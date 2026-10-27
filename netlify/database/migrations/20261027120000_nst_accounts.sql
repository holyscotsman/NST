-- NST accounts on Netlify Database (Postgres). Mirrors server/db.mjs (the SQLite schema used when the tool is
-- hosted on a VM), so the two stay comparable. Timestamps are epoch milliseconds in DOUBLE PRECISION: exact for
-- any date this century, and returned to JavaScript as plain numbers.
--
-- Tables are prefixed nst_ because this database already holds a legacy `progress` table from the
-- ncm-mci-guided-practice site (the previous owner of this Netlify project). That table is left untouched.

CREATE TABLE IF NOT EXISTS nst_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '',
  pass_hash     TEXT NOT NULL,
  pass_salt     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',          -- 'user' | 'root'
  disabled      INTEGER NOT NULL DEFAULT 0,
  must_change   INTEGER NOT NULL DEFAULT 0,            -- forced reset after an admin sets a password
  created_at    DOUBLE PRECISION NOT NULL,
  last_login_at DOUBLE PRECISION
);
CREATE UNIQUE INDEX IF NOT EXISTS nst_users_username_ci ON nst_users (lower(username));

CREATE TABLE IF NOT EXISTS nst_sessions (
  token_hash TEXT PRIMARY KEY,                          -- SHA-256 of the cookie value; the cookie itself is never stored
  user_id    INTEGER NOT NULL REFERENCES nst_users(id) ON DELETE CASCADE,
  created_at DOUBLE PRECISION NOT NULL,
  expires_at DOUBLE PRECISION NOT NULL,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS nst_sessions_user ON nst_sessions (user_id);

-- One opaque blob per account: the same envelope shared/nst-backup.js produces, so a downloaded backup file
-- and an account copy are interchangeable.
CREATE TABLE IF NOT EXISTS nst_progress (
  user_id    INTEGER PRIMARY KEY REFERENCES nst_users(id) ON DELETE CASCADE,
  blob       TEXT NOT NULL,
  updated_at DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS nst_audit (
  id     SERIAL PRIMARY KEY,
  at     DOUBLE PRECISION NOT NULL,
  actor  TEXT,
  action TEXT NOT NULL,
  detail TEXT
);

-- Sign-in throttling. On a VM this lived in process memory; serverless functions share no memory between
-- invocations, so a throttle kept there would never trip. It has to be in the database.
CREATE TABLE IF NOT EXISTS nst_throttle (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  first_at     DOUBLE PRECISION NOT NULL,
  locked_until DOUBLE PRECISION NOT NULL DEFAULT 0
);
