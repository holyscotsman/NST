/* db.mjs — the whole persistence layer, in one SQLite file.
 *
 * "A temporary database file, not a SQL server": node:sqlite is built into Node
 * 22, so this is a real relational database in a single file on disk with ZERO
 * npm dependencies — nothing to install, nothing to administer, and you can copy
 * or delete the file to move or reset everything.
 *
 * Schema notes worth knowing:
 *  - Passwords are stored as a scrypt hash + per-user random salt. The plaintext
 *    is never written anywhere, including the root account's.
 *  - Session tokens are stored HASHED. Someone who can read this file still
 *    cannot mint a working cookie from it.
 *  - A user's study progress is one JSON blob: the same envelope the offline
 *    backup file uses (shared/nst-backup.js), so the two are interchangeable.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDb(file) {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);

  // WAL keeps readers from blocking the writer — this is a study tool used by a
  // handful of people at once, but it costs nothing and avoids "database locked".
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT    NOT NULL DEFAULT '',
      pass_hash    TEXT    NOT NULL,
      pass_salt    TEXT    NOT NULL,
      role         TEXT    NOT NULL DEFAULT 'user',   -- 'user' | 'root'
      disabled     INTEGER NOT NULL DEFAULT 0,
      must_change  INTEGER NOT NULL DEFAULT 0,        -- forced reset after an admin sets a password
      created_at   INTEGER NOT NULL,
      last_login_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      user_agent TEXT
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS progress (
      user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      blob       TEXT    NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      at      INTEGER NOT NULL,
      actor   TEXT,
      action  TEXT NOT NULL,
      detail  TEXT
    );
  `);
  return db;
}

/* ---- users ---------------------------------------------------------- */

export function getUserByName(db, username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(String(username)) || null;
}
export function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}
export function listUsers(db) {
  return db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, u.disabled, u.must_change,
           u.created_at, u.last_login_at,
           (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ?) AS active_sessions,
           (SELECT p.updated_at FROM progress p WHERE p.user_id = u.id) AS progress_at,
           (SELECT LENGTH(p.blob) FROM progress p WHERE p.user_id = u.id) AS progress_bytes
    FROM users u ORDER BY u.role = 'root' DESC, u.username COLLATE NOCASE
  `).all(Date.now());
}
export function countUsers(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}
export function createUser(db, { username, displayName, passHash, passSalt, role = 'user', mustChange = 0 }) {
  const info = db.prepare(`
    INSERT INTO users (username, display_name, pass_hash, pass_salt, role, must_change, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, displayName || username, passHash, passSalt, role, mustChange ? 1 : 0, Date.now());
  return getUserById(db, info.lastInsertRowid);
}
export function setPassword(db, userId, passHash, passSalt, mustChange) {
  db.prepare('UPDATE users SET pass_hash = ?, pass_salt = ?, must_change = ? WHERE id = ?')
    .run(passHash, passSalt, mustChange ? 1 : 0, userId);
}
export function setDisabled(db, userId, disabled) {
  db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(disabled ? 1 : 0, userId);
  if (disabled) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);  // kick them out now
}
export function setRole(db, userId, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}
export function touchLogin(db, userId) {
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(Date.now(), userId);
}
export function deleteUser(db, userId) {
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);   // cascades to sessions + progress
}
export function countRoots(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'root' AND disabled = 0").get().n;
}

/* ---- sessions ------------------------------------------------------- */

export function createSession(db, tokenHash, userId, ttlMs, userAgent) {
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES (?,?,?,?,?)')
    .run(tokenHash, userId, now, now + ttlMs, String(userAgent || '').slice(0, 200));
}
export function getSession(db, tokenHash) {
  return db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').get(tokenHash, Date.now()) || null;
}
export function touchSession(db, tokenHash, ttlMs) {
  db.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(Date.now() + ttlMs, tokenHash);
}
export function deleteSession(db, tokenHash) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}
export function deleteUserSessions(db, userId) {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}
export function purgeExpiredSessions(db) {
  return db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now()).changes;
}

/* ---- progress ------------------------------------------------------- */

export function getProgress(db, userId) {
  return db.prepare('SELECT blob, updated_at FROM progress WHERE user_id = ?').get(userId) || null;
}
export function putProgress(db, userId, blob) {
  db.prepare(`
    INSERT INTO progress (user_id, blob, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET blob = excluded.blob, updated_at = excluded.updated_at
  `).run(userId, blob, Date.now());
}
export function clearProgress(db, userId) {
  db.prepare('DELETE FROM progress WHERE user_id = ?').run(userId);
}

/* ---- audit ---------------------------------------------------------- */

/* A consistent single-file snapshot of the whole database, taken WITHOUT
 * stopping the server.
 *
 * `VACUUM INTO` is the right tool and the reason is worth writing down: copying
 * `nst.db` while the process is running gives you a file whose recent writes are
 * still in the `-wal` companion, so the copy is silently stale -- or, if writes
 * land mid-copy, torn. VACUUM INTO writes a fresh, fully checkpointed database
 * with no `-wal` or `-shm` alongside it. One file, complete, restorable.
 *
 * It is also plain SQL rather than a Node API, so it does not depend on which
 * version of the experimental `node:sqlite` surface this Node happens to ship.
 *
 * The path is quoted for SQL, not interpolated raw: on Windows it will contain
 * backslashes and may contain apostrophes.
 */
export function snapshotTo(db, destPath) {
  const quoted = String(destPath).replace(/'/g, "''");
  db.exec(`VACUUM INTO '${quoted}'`);
  return destPath;
}

export function audit(db, actor, action, detail) {
  db.prepare('INSERT INTO audit (at, actor, action, detail) VALUES (?,?,?,?)')
    .run(Date.now(), actor || null, action, detail ? String(detail).slice(0, 500) : null);
}
export function recentAudit(db, limit = 50) {
  return db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT ?').all(limit);
}
