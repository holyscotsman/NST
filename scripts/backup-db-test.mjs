/* backup-db-test.mjs — the database backup a root user can download.
 *
 * The database is the only irreplaceable thing in this system: every account,
 * every password hash, and everyone's study history. The documented alternative
 * was "stop the service and copy three files", which nobody does, so the value
 * of the button is entirely in whether the file it produces actually restores.
 *
 * So the test does not check that a download happened. It takes a backup from a
 * running server, opens it as a database, and reads the rows back.
 *
 * The other half is who may do it. A backup is a complete copy of every
 * credential in the system, so an ordinary account must not be able to take one,
 * and neither must a forged cross-site form.
 *
 * Spawns a real server on a scratch port with a throwaway database.
 * Pure Node, no browser — runs in CI. Run: node scripts/backup-db-test.mjs
 */
import { spawn } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

const PORT = 8500 + Math.floor(Math.random() * 400);
const dataDir = mkdtempSync(join(tmpdir(), 'nst-bkp-'));
const dbFile = join(dataDir, 'live.db');
const ROOT_PW = 'root-pw-not-the-default';

const child = spawn(process.execPath, [join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: dbFile, NST_ROOT_PASSWORD: ROOT_PW },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((done, die) => {
  const t = setTimeout(() => die(new Error('server did not start')), 15000);
  child.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); done(); } });
  child.stderr.on('data', () => {});
});

/* node:http, not fetch: this response is a binary attachment and the test needs
 * the bytes exactly as sent. */
function client() {
  const jar = new Map();
  const req = (path, { method = 'GET', body = null, headers = {} } = {}) => new Promise((done, die) => {
    const h = { ...headers };
    if (jar.size) h.Cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body != null) {
      h['Content-Type'] = 'application/x-www-form-urlencoded';
      h['Content-Length'] = Buffer.byteLength(body);
    }
    const r = httpRequest({ hostname: '127.0.0.1', port: PORT, path, method, headers: h }, (res) => {
      for (const c of res.headers['set-cookie'] || []) {
        const kv = c.split(';')[0];
        const i = kv.indexOf('=');
        if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => done({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    r.on('error', die);
    if (body != null) r.write(body);
    r.end();
  });
  return {
    req,
    async csrf(path = '/login') {
      const r = await req(path);
      return r.body.toString().match(/name="csrf" value="([^"]+)"/)?.[1] || '';
    },
    async signIn(username, password) {
      const csrf = await this.csrf('/login');
      const r = await req('/login', {
        method: 'POST',
        body: new URLSearchParams({ csrf, username, password }).toString(),
      });
      return r.status === 302;
    },
    async signUp(username, password) {
      const csrf = await this.csrf('/signup');
      const r = await req('/signup', {
        method: 'POST',
        body: new URLSearchParams({ csrf, username, password, password2: password, displayName: username }).toString(),
      });
      return r.status === 302;
    },
  };
}

try {
  const root = client();
  ok('signed in as root', await root.signIn('root', ROOT_PW));

  /* Put real, identifiable data in before backing up, so the restored copy can
   * be checked for the actual rows rather than just for being a database. */
  const alice = client();
  ok('a second account can be created', await alice.signUp('alice', 'correct-horse-battery'));
  ok('and can sign in', await alice.signIn('alice', 'correct-horse-battery'));
  const saved = await alice.req('/api/progress', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ v: 1, data: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: { 'q-marker': { id: 'q-marker', box: 7, seen: 42 } } }) } }),
  });
  ok('and can store progress', saved.status === 200, saved.status);

  /* ---- who may take one ---- */
  {
    const r = await alice.req('/admin/backup', {
      method: 'POST',
      body: new URLSearchParams({ csrf: await alice.csrf('/') || 'x' }).toString(),
    });
    ok('an ordinary account cannot take a backup', r.status === 403, r.status);
  }
  {
    const anon = client();
    const r = await anon.req('/admin/backup', { method: 'POST', body: 'csrf=whatever' });
    ok('nor can a signed-out visitor', r.status === 302 && /\/login$/.test(r.headers.location || ''),
      `${r.status} ${r.headers.location}`);
  }
  {
    const r = await root.req('/admin/backup', { method: 'POST', body: 'csrf=forged-token' });
    ok('a forged CSRF token is refused even for root', r.status === 302 && /err=/.test(r.headers.location || ''),
      `${r.status} ${r.headers.location}`);
  }
  {
    const r = await root.req('/admin/backup', { method: 'GET' });
    ok('a plain GET does not hand one out', r.status !== 200, r.status);
  }

  /* ---- the backup itself ---- */
  const csrf = await root.csrf('/admin');
  const r = await root.req('/admin/backup', {
    method: 'POST',
    body: new URLSearchParams({ csrf }).toString(),
  });
  ok('root gets a backup', r.status === 200, r.status);
  ok('offered as a download, not rendered', /attachment/.test(r.headers['content-disposition'] || ''),
    r.headers['content-disposition']);
  ok('under a dated .db filename',
    /filename="nst-backup-\d{4}-\d{2}-\d{2}-\d{4}\.db"/.test(r.headers['content-disposition'] || ''),
    r.headers['content-disposition']);
  ok('and never cached: it holds password hashes',
    /no-store/.test(r.headers['cache-control'] || ''), r.headers['cache-control']);
  ok('the length is declared', Number(r.headers['content-length']) === r.body.length,
    `${r.headers['content-length']} vs ${r.body.length}`);

  ok('it really is a SQLite file', r.body.subarray(0, 15).toString('latin1') === 'SQLite format 3',
    JSON.stringify(r.body.subarray(0, 15).toString('latin1')));

  /* THE test: open it and read the data back. */
  const restored = join(dataDir, 'restored.db');
  writeFileSync(restored, r.body);
  ok('a snapshot needs no -wal companion to be complete',
    !existsSync(restored + '-wal') && !existsSync(restored + '-shm'));

  const rdb = new DatabaseSync(restored, { readOnly: true });
  try {
    const users = rdb.prepare('SELECT username, role FROM users ORDER BY username').all();
    const names = users.map((u) => u.username);
    ok('every account is in the backup', names.includes('root') && names.includes('alice'), names.join(','));
    ok('roles survive', users.find((u) => u.username === 'root').role === 'root');

    const hash = rdb.prepare('SELECT pass_hash FROM users WHERE username = ?').get('alice');
    ok('credentials come with it', !!hash && !!hash.pass_hash);
    ok('and are still hashes, not passwords',
      !!hash && !String(hash.pass_hash).includes('correct-horse-battery'));

    const prog = rdb.prepare(
      'SELECT p.blob AS blob FROM progress p JOIN users u ON u.id = p.user_id WHERE u.username = ?',
    ).get('alice');
    ok("a user's progress is in the backup", !!prog && !!prog.blob,
      prog ? String(prog.blob).slice(0, 60) : 'missing');
    // Parse it rather than grep it. The stored blob is an envelope whose values
    // are themselves JSON strings, so the mastery record's own fields are
    // escaped inside it -- a regex for `"box":7` cannot match, and would report
    // a perfectly good backup as broken.
    let rec = null;
    try {
      const env = JSON.parse(String(prog.blob));
      rec = JSON.parse(env.data['nst.mastery.v1']).records['q-marker'];
    } catch (e) { rec = null; }
    ok('down to the individual record', !!rec, rec === null ? 'unparseable' : 'ok');
    ok('with its scheduling state intact', !!rec && rec.box === 7 && rec.seen === 42,
      rec ? `box ${rec.box}, seen ${rec.seen}` : 'missing');
  } finally { rdb.close(); }

  /* The live database must be untouched by having been backed up. */
  {
    const again = await alice.req('/api/progress');
    ok('the live server still works after a backup', again.status === 200, again.status);
    ok('and the live data is still there', /q-marker/.test(again.body.toString()));
    ok('the live database keeps its own WAL', existsSync(dbFile));
  }

  /* Two backups in a row must both be valid: the first must not leave the temp
   * file, the lock, or anything else behind. */
  {
    const c2 = await root.csrf('/admin');
    const r2 = await root.req('/admin/backup', { method: 'POST', body: new URLSearchParams({ csrf: c2 }).toString() });
    ok('a second backup works too', r2.status === 200, r2.status);
    ok('and is also a SQLite file', r2.body.subarray(0, 15).toString('latin1') === 'SQLite format 3');
  }

  /* It is an administrative action, so it is in the log. */
  {
    const page = await root.req('/admin');
    ok('the backup is written to the audit log', /backup/.test(page.body.toString()));
  }
} finally {
  child.kill('SIGKILL');
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* scratch dir */ }
}

console.log('\n' + (fail ? `BACKUP-DB: ${fail} FAILED (${pass} passed)` : `BACKUP-DB: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
