/* store.mjs — the data layer for NST accounts on Netlify Database (Postgres).
 *
 * The same operations as server/db.mjs (the SQLite layer used on a VM), made async and given Postgres SQL.
 * It takes one function, `q(text, params) -> Promise<row[]>`, instead of importing a database client, so the
 * production wiring (netlify/functions/app.mjs) and the tests (a real local Postgres) differ only in what they
 * pass in.
 */

export const WINDOW_MS = 15 * 60 * 1000;
export const LOCKOUT_MS = 10 * 60 * 1000;

export function makeStore(q) {
  const one = async (text, params) => (await q(text, params))[0] || null;

  return {
    /* ---- users ---- */
    getUserByName: (username) => one('SELECT * FROM nst_users WHERE lower(username) = lower($1)', [String(username)]),
    getUserById: (id) => one('SELECT * FROM nst_users WHERE id = $1', [Number(id)]),
    async listUsers() {
      return q(`
        SELECT u.id, u.username, u.display_name, u.role, u.disabled, u.must_change, u.created_at, u.last_login_at,
               (SELECT COUNT(*)::int FROM nst_sessions s WHERE s.user_id = u.id AND s.expires_at > $1) AS active_sessions,
               (SELECT p.updated_at FROM nst_progress p WHERE p.user_id = u.id) AS progress_at,
               (SELECT LENGTH(p.blob) FROM nst_progress p WHERE p.user_id = u.id) AS progress_bytes
        FROM nst_users u ORDER BY (u.role = 'root') DESC, lower(u.username)`, [Date.now()]);
    },
    async countUsers() { return (await one('SELECT COUNT(*)::int AS n FROM nst_users')).n; },
    async countRoots() { return (await one("SELECT COUNT(*)::int AS n FROM nst_users WHERE role = 'root' AND disabled = 0")).n; },
    async createUser({ username, displayName, passHash, passSalt, role = 'user', mustChange = 0 }) {
      return one(`INSERT INTO nst_users (username, display_name, pass_hash, pass_salt, role, must_change, created_at)
                  VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [username, displayName || username, passHash, passSalt, role, mustChange ? 1 : 0, Date.now()]);
    },
    async setPassword(userId, passHash, passSalt, mustChange) {
      await q('UPDATE nst_users SET pass_hash = $1, pass_salt = $2, must_change = $3 WHERE id = $4',
        [passHash, passSalt, mustChange ? 1 : 0, userId]);
    },
    async setDisabled(userId, disabled) {
      await q('UPDATE nst_users SET disabled = $1 WHERE id = $2', [disabled ? 1 : 0, userId]);
      if (disabled) await q('DELETE FROM nst_sessions WHERE user_id = $1', [userId]);   // kick them out now
    },
    async setRole(userId, role) { await q('UPDATE nst_users SET role = $1 WHERE id = $2', [role, userId]); },
    async touchLogin(userId) { await q('UPDATE nst_users SET last_login_at = $1 WHERE id = $2', [Date.now(), userId]); },
    async deleteUser(userId) { await q('DELETE FROM nst_users WHERE id = $1', [userId]); },   // cascades to sessions + progress

    /* ---- sessions ---- */
    async createSession(tokenHash, userId, ttlMs, userAgent) {
      const now = Date.now();
      await q('INSERT INTO nst_sessions (token_hash, user_id, created_at, expires_at, user_agent) VALUES ($1,$2,$3,$4,$5)',
        [tokenHash, userId, now, now + ttlMs, String(userAgent || '').slice(0, 200)]);
    },
    /* The session and its (enabled) user in one round trip. */
    async getSessionUser(tokenHash) {
      return one(`SELECT s.token_hash, s.expires_at, u.*
                  FROM nst_sessions s JOIN nst_users u ON u.id = s.user_id
                  WHERE s.token_hash = $1 AND s.expires_at > $2 AND u.disabled = 0`, [tokenHash, Date.now()]);
    },
    async touchSession(tokenHash, ttlMs) { await q('UPDATE nst_sessions SET expires_at = $1 WHERE token_hash = $2', [Date.now() + ttlMs, tokenHash]); },
    async deleteSession(tokenHash) { await q('DELETE FROM nst_sessions WHERE token_hash = $1', [tokenHash]); },
    async deleteUserSessions(userId) { await q('DELETE FROM nst_sessions WHERE user_id = $1', [userId]); },
    async purgeExpiredSessions() { await q('DELETE FROM nst_sessions WHERE expires_at <= $1', [Date.now()]); },

    /* ---- progress ---- */
    getProgress: (userId) => one('SELECT blob, updated_at FROM nst_progress WHERE user_id = $1', [userId]),
    async putProgress(userId, blob) {
      await q(`INSERT INTO nst_progress (user_id, blob, updated_at) VALUES ($1,$2,$3)
               ON CONFLICT (user_id) DO UPDATE SET blob = EXCLUDED.blob, updated_at = EXCLUDED.updated_at`,
        [userId, blob, Date.now()]);
    },
    async clearProgress(userId) { await q('DELETE FROM nst_progress WHERE user_id = $1', [userId]); },

    /* ---- audit ---- */
    async audit(actor, action, detail) {
      await q('INSERT INTO nst_audit (at, actor, action, detail) VALUES ($1,$2,$3,$4)',
        [Date.now(), actor || null, action, detail ? String(detail).slice(0, 500) : null]);
    },
    recentAudit: (limit = 50) => q('SELECT * FROM nst_audit ORDER BY id DESC LIMIT $1', [limit]),

    /* ---- sign-in throttling (the server's in-memory version, moved into the database) ---- */
    async throttleCheck(key, now = Date.now()) {
      const r = await one('SELECT count, first_at, locked_until FROM nst_throttle WHERE key = $1', [key]);
      if (!r) return { allowed: true };
      if (r.locked_until > now) return { allowed: false, retryAfterMs: r.locked_until - now };
      if (now - r.first_at > WINDOW_MS) { await q('DELETE FROM nst_throttle WHERE key = $1', [key]); return { allowed: true }; }
      return { allowed: true };
    },
    /* One atomic upsert, so two simultaneous failures both count. */
    async throttleFail(key, now = Date.now(), max = 8) {
      const r = await one(`
        INSERT INTO nst_throttle (key, count, first_at, locked_until) VALUES ($1, 1, $2, 0)
        ON CONFLICT (key) DO UPDATE SET
          count    = CASE WHEN $2 - nst_throttle.first_at > $3 THEN 1 ELSE nst_throttle.count + 1 END,
          first_at = CASE WHEN $2 - nst_throttle.first_at > $3 THEN $2 ELSE nst_throttle.first_at END
        RETURNING count`, [key, now, WINDOW_MS]);
      if (r.count >= Math.max(1, max)) {
        await q('UPDATE nst_throttle SET locked_until = $1, count = 0, first_at = $2 WHERE key = $3', [now + LOCKOUT_MS, now, key]);
      }
      // keep the table small: expired, unlocked rows are dead weight
      if (Math.random() < 0.05) await q('DELETE FROM nst_throttle WHERE first_at < $1 AND locked_until < $2', [now - WINDOW_MS, now]);
    },
    async throttleReset(key) { await q('DELETE FROM nst_throttle WHERE key = $1', [key]); },
  };
}
