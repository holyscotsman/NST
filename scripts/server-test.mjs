/* server-test.mjs — the app server's contract, against a real running instance.
 *
 * This is the security-critical surface of the whole project: it is the only
 * part that holds other people's credentials and keeps one person's study
 * progress away from another's. The tests are weighted accordingly — most of
 * them are about what the server REFUSES to do.
 *
 * Spawns its own server on a scratch port with a throwaway database, so it is
 * safe to run anywhere and leaves nothing behind. Pure Node, no browser, no npm
 * dependencies — it runs in CI. Run: node scripts/server-test.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const PORT = 8300 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const tmp = mkdtempSync(join(tmpdir(), 'nst-servertest-'));
const DB_FILE = join(tmp, 'test.db');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- a tiny cookie-aware client ------------------------------------- */

function makeClient() {
  const jar = new Map();
  return {
    jar,
    cookieHeader() { return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; '); },
    async req(path, { method = 'GET', body, form, json, headers = {} } = {}) {
      const h = { ...headers };
      const c = this.cookieHeader();
      if (c) h.Cookie = c;
      let payload = body;
      if (form) { payload = new URLSearchParams(form).toString(); h['Content-Type'] = 'application/x-www-form-urlencoded'; }
      if (json) { payload = JSON.stringify(json); h['Content-Type'] = 'application/json'; }
      const res = await fetch(BASE + path, { method, headers: h, body: payload, redirect: 'manual' });
      const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      for (const sc of setCookie) {
        const [pair] = sc.split(';');
        const i = pair.indexOf('=');
        const k = pair.slice(0, i).trim(); const v = pair.slice(i + 1).trim();
        if (/Max-Age=0/i.test(sc)) jar.delete(k); else jar.set(k, v);
      }
      const text = await res.text();
      return { status: res.status, location: res.headers.get('location'), text, setCookie };
    },
    async csrf(path = '/login') {
      const r = await this.req(path);
      const m = r.text.match(/name="csrf" value="([^"]+)"/);
      return m ? m[1] : null;
    },
  };
}

/* ---- boot ------------------------------------------------------------ */

const child = spawn(process.execPath, [join(REPO, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: DB_FILE, NST_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
child.stdout.on('data', (d) => { serverLog += d; });
child.stderr.on('data', (d) => { serverLog += d; });

async function waitForServer(ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(BASE + '/login', { redirect: 'manual' }); if (r.status) return true; }
    catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  return false;
}

/* Wait for the child to actually die before removing its database.
 *
 * On Linux this could be synchronous: POSIX lets you unlink a file another
 * process still has open. Windows refuses, and SQLite's Windows VFS does not
 * open with FILE_SHARE_DELETE -- so rmSync would throw EBUSY into a silent
 * catch, the suite would still report ALL GREEN, and every run would leak a
 * temp directory containing the test database. kill() is also asynchronous, so
 * the old code raced even in principle. */
async function cleanup() {
  if (child.exitCode === null && child.signalCode === null) {
    const gone = new Promise((r) => child.once('exit', r));
    try { child.kill('SIGTERM'); } catch {}
    // The guard above matters: on the failure path the child is already dead,
    // and without it every failure would stall here for the full timeout.
    await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))]);
  }
  try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); }
  catch (e) { console.log('note: could not remove ' + tmp + ' (' + (e && e.code) + ')'); }
}

try {
  if (!await waitForServer()) { console.log('FAIL server did not start\n' + serverLog); await cleanup(); process.exit(1); }

  /* ---- 1. nothing is reachable without an account ---- */
  {
    const anon = makeClient();
    for (const p of ['/', '/starnix/index.html', '/wwtbane/index.html', '/practice-exams/index.html', '/admin']) {
      const r = await anon.req(p);
      ok(`anonymous ${p} is sent to the login page`, r.status === 302 && /\/login$/.test(r.location || ''), `${r.status} ${r.location}`);
    }
    const me = await anon.req('/api/me');
    ok('anonymous /api/me is refused', me.status === 401, me.status);
    const pr = await anon.req('/api/progress');
    ok('anonymous /api/progress is refused', pr.status === 401, pr.status);
    const login = await anon.req('/login');
    ok('the login page itself is public', login.status === 200 && /Sign in/.test(login.text));
    ok('the login page can load its font CSS while signed out',
      (await anon.req('/shared/fonts.css')).status === 200);
  }

  /* ---- 2. the database and the repo's internals are never served ---- */
  {
    const c = makeClient();
    const csrf = await c.csrf();
    await c.req('/login', { method: 'POST', form: { csrf, username: 'root', password: 'nutanix' } });
    ok('root can sign in with the documented default password', c.jar.has('nst_session'));

    for (const p of ['/server/data/test.db', '/server/server.mjs', '/server/auth.mjs', '/server/db.mjs',
      '/.git/config', '/.github/workflows/ci.yml', '/.gitignore']) {
      const r = await c.req(p);
      ok(`a signed-in user cannot fetch ${p}`, r.status === 404, r.status);
    }
    for (const p of ['/../etc/passwd', '/shared/../../etc/passwd', '/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '/..%2f..%2fetc%2fpasswd', '/shared/%2e%2e/%2e%2e/etc/passwd']) {
      const r = await c.req(p);
      ok(`traversal ${p} is refused`, r.status === 404 || r.status === 403, r.status);
    }
    ok('the study tool itself is served', (await c.req('/index.html')).status === 200);
    ok('StarNix is served', (await c.req('/starnix/index.html')).status === 200);
  }

  /* ---- 3. the stored root password is a hash, not the plaintext ---- */
  {
    ok('the database file exists', existsSync(DB_FILE));
    const raw = readFileSync(DB_FILE);
    ok('the plaintext default password is NOT in the database file',
      !raw.includes(Buffer.from('nutanix')), 'found "nutanix" in the db');
  }

  /* ---- 4. creating an account ---- */
  {
    const c = makeClient();
    const csrf = await c.csrf('/signup');
    ok('the signup page is public', !!csrf);

    const short = await c.req('/signup', { method: 'POST', form: { csrf, username: 'alice', password: 'abc', password2: 'abc' } });
    ok('a too-short password is rejected', short.status === 400 && /at least/i.test(short.text));

    const mismatch = await c.req('/signup', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse', password2: 'different-one' } });
    ok('mismatched passwords are rejected', mismatch.status === 400 && /do not match/i.test(mismatch.text));

    const badName = await c.req('/signup', { method: 'POST', form: { csrf, username: 'a b!', password: 'correct-horse', password2: 'correct-horse' } });
    ok('an invalid username is rejected', badName.status === 400);

    const reserved = await c.req('/signup', { method: 'POST', form: { csrf, username: 'ROOT', password: 'correct-horse', password2: 'correct-horse' } });
    ok('the root username is reserved (case-insensitively)', reserved.status === 400 && /reserved/i.test(reserved.text));

    const good = await c.req('/signup', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse', password2: 'correct-horse' } });
    ok('a valid account is created', good.status === 302 && /created=1/.test(good.location || ''), `${good.status} ${good.location}`);

    const dupe = await c.req('/signup', { method: 'POST', form: { csrf, username: 'ALICE', password: 'correct-horse', password2: 'correct-horse' } });
    ok('a duplicate username is rejected regardless of case', dupe.status === 400 && /taken/i.test(dupe.text));

    const noCsrf = await c.req('/signup', { method: 'POST', form: { username: 'mallory', password: 'correct-horse', password2: 'correct-horse' } });
    ok('signup without a CSRF token is refused', noCsrf.status === 400);
  }

  /* ---- 5. signing in ---- */
  {
    const c = makeClient();
    const csrf = await c.csrf();
    const wrong = await c.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'not-my-password' } });
    ok('a wrong password is refused', wrong.status === 401);
    ok('the failure message does not reveal whether the user exists',
      /do not match/i.test(wrong.text) && !/no such user|unknown user/i.test(wrong.text));

    const ghost = await c.req('/login', { method: 'POST', form: { csrf, username: 'nobody-here', password: 'whatever123' } });
    ok('an unknown user gets the SAME message as a wrong password',
      ghost.status === 401 && /do not match/i.test(ghost.text));

    const good = await c.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse' } });
    ok('the right password signs in', good.status === 302 && c.jar.has('nst_session'));

    const sc = good.setCookie.find((s) => s.startsWith('nst_session'));
    ok('the session cookie is HttpOnly', /HttpOnly/i.test(sc || ''), sc);
    ok('the session cookie is SameSite=Strict', /SameSite=Strict/i.test(sc || ''), sc);

    const me = await c.req('/api/me');
    ok('a signed-in user can read their own identity', me.status === 200 && JSON.parse(me.text).username === 'alice');
    ok('a normal user is not an admin', JSON.parse(me.text).role === 'user');
    ok('a normal user cannot open the root console', (await c.req('/admin')).status === 403);
  }

  /* ---- 6. progress is per-account and isolated ---- */
  {
    const alice = makeClient();
    let csrf = await alice.csrf();
    await alice.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse' } });

    const envelope = { app: 'nutanix-study-tool', format: 1, data: { 'nst.mastery.v1': '{"records":{"q1":{"box":7}}}' } };
    const put = await alice.req('/api/progress', { method: 'PUT', json: envelope });
    ok('progress can be saved to the account', put.status === 200 && JSON.parse(put.text).ok);

    const get = await alice.req('/api/progress');
    const got = JSON.parse(get.text);
    ok('progress comes back intact', got.data.data['nst.mastery.v1'] === envelope.data['nst.mastery.v1']);

    const junk = await alice.req('/api/progress', { method: 'PUT', body: 'not json', headers: { 'Content-Type': 'application/json' } });
    ok('a malformed progress payload is rejected', junk.status === 400);
    const wrongShape = await alice.req('/api/progress', { method: 'PUT', json: { nope: true } });
    ok('a payload that is not a progress envelope is rejected', wrongShape.status === 400);

    // a second account must not see the first one's work
    const bob = makeClient();
    csrf = await bob.csrf('/signup');
    await bob.req('/signup', { method: 'POST', form: { csrf, username: 'bob', password: 'battery-staple', password2: 'battery-staple' } });
    csrf = await bob.csrf();
    await bob.req('/login', { method: 'POST', form: { csrf, username: 'bob', password: 'battery-staple' } });
    const bobSees = JSON.parse((await bob.req('/api/progress')).text);
    ok("a second account cannot see the first account's progress", bobSees.data === null, JSON.stringify(bobSees).slice(0, 80));

    await bob.req('/api/progress', { method: 'PUT', json: { app: 'nutanix-study-tool', format: 1, data: { 'nst.prefs': '{"bob":true}' } } });
    const aliceStill = JSON.parse((await alice.req('/api/progress')).text);
    ok("writing as one account does not touch the other's", aliceStill.data.data['nst.mastery.v1'] === envelope.data['nst.mastery.v1']);
  }

  /* ---- 7. signing out ---- */
  {
    const c = makeClient();
    const csrf = await c.csrf();
    await c.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse' } });
    const token = c.jar.get('nst_session');
    const csrf2 = await c.csrf('/account/password');
    const out = await c.req('/logout', { method: 'POST', form: { csrf: csrf2 } });
    ok('signing out redirects to the login page', out.status === 302 && /\/login$/.test(out.location || ''));

    // the old token must be dead server-side, not merely dropped by the client
    const replay = makeClient();
    replay.jar.set('nst_session', token);
    ok('the old session token no longer works after signing out',
      (await replay.req('/api/me')).status === 401);
  }

  /* ---- 8. the root console ---- */
  {
    const root = makeClient();
    let csrf = await root.csrf();
    await root.req('/login', { method: 'POST', form: { csrf, username: 'root', password: 'nutanix' } });
    const page = await root.req('/admin');
    ok('root can open the console', page.status === 200);
    ok('the console lists the accounts', /alice/.test(page.text) && /bob/.test(page.text));
    ok('the console warns that root still uses the default password', /default password/i.test(page.text));

    csrf = (page.text.match(/name="csrf" value="([^"]+)"/) || [])[1];

    // find bob's id from the admin table reliably: the row contains his name and hidden id inputs
    const rows = page.text.split('<tr>').filter((r) => r.includes('<td'));
    const rowMatch = rows.find((r) => /<b>bob<\/b>/.test(r));
    const id = rowMatch && (rowMatch.match(/name="id" value="(\d+)"/) || [])[1];
    ok('the console exposes an id for each account', !!id, id);

    const disable = await root.req('/admin/disable', { method: 'POST', form: { csrf, id } });
    ok('root can disable an account', disable.status === 302 && /done=/.test(disable.location || ''));

    // a disabled user cannot sign in, and any live session is cut
    const bob = makeClient();
    const bcsrf = await bob.csrf();
    const tryLogin = await bob.req('/login', { method: 'POST', form: { csrf: bcsrf, username: 'bob', password: 'battery-staple' } });
    ok('a disabled account cannot sign in', tryLogin.status === 401);

    await root.req('/admin/enable', { method: 'POST', form: { csrf, id } });
    const reLogin = await bob.req('/login', { method: 'POST', form: { csrf: bcsrf, username: 'bob', password: 'battery-staple' } });
    ok('re-enabling lets them back in', reLogin.status === 302);

    // a reset hands out a temporary password and forces a change
    const reset = await root.req('/admin/reset', { method: 'POST', form: { csrf, id } });
    const temp = decodeURIComponent((reset.location || '').split('done=')[1] || '').match(/:\s*(\S+)\s/);
    ok('a reset reports a temporary password', !!temp, reset.location);
    if (temp) {
      const b2 = makeClient();
      const c2 = await b2.csrf();
      const r2 = await b2.req('/login', { method: 'POST', form: { csrf: c2, username: 'bob', password: temp[1] } });
      ok('the temporary password works', r2.status === 302);
      ok('and lands on the forced password change', /\/account\/password$/.test(r2.location || ''), r2.location);
      const blocked = await b2.req('/');
      ok('nothing else is reachable until the password is changed',
        blocked.status === 302 && /\/account\/password$/.test(blocked.location || ''));
      const api = await b2.req('/api/progress');
      ok('the API is blocked during a forced change too', api.status === 403);
    }

    // the last root account must not be removable, or the server locks forever
    const rootRow = rows.find((r) => /<b>root<\/b>/.test(r));
    ok('root cannot act on their own row', /that’s you|that's you/.test(rootRow || ''));

    const noCsrf = await root.req('/admin/delete', { method: 'POST', form: { id } });
    ok('an admin action without a CSRF token is refused', noCsrf.status === 302 && /err=/.test(noCsrf.location || ''));
  }

  /* ---- 9. only root reaches admin actions ---- */
  {
    const alice = makeClient();
    const csrf = await alice.csrf();
    await alice.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse' } });
    const acsrf = await alice.csrf('/account/password');
    for (const action of ['disable', 'delete', 'promote', 'reset']) {
      const r = await alice.req('/admin/' + action, { method: 'POST', form: { csrf: acsrf, id: 1 } });
      ok(`a normal user cannot call /admin/${action}`, r.status === 403, r.status);
    }
  }

  /* ---- 10. changing your own password ---- */
  {
    const c = makeClient();
    let csrf = await c.csrf();
    await c.req('/login', { method: 'POST', form: { csrf, username: 'alice', password: 'correct-horse' } });
    csrf = await c.csrf('/account/password');
    const wrongCurrent = await c.req('/account/password', { method: 'POST', form: { csrf, current: 'nope', password: 'new-password-here', password2: 'new-password-here' } });
    ok('changing a password needs the current one', wrongCurrent.status === 400 && /not right/i.test(wrongCurrent.text));

    const changed = await c.req('/account/password', { method: 'POST', form: { csrf, current: 'correct-horse', password: 'new-password-here', password2: 'new-password-here' } });
    ok('a correct current password allows the change', changed.status === 302);

    const fresh = makeClient();
    const fcsrf = await fresh.csrf();
    ok('the old password no longer works',
      (await fresh.req('/login', { method: 'POST', form: { csrf: fcsrf, username: 'alice', password: 'correct-horse' } })).status === 401);
    ok('the new password works',
      (await fresh.req('/login', { method: 'POST', form: { csrf: fcsrf, username: 'alice', password: 'new-password-here' } })).status === 302);
  }

  /* ---- 11. login throttling ---- */
  {
    const c = makeClient();
    const csrf = await c.csrf();
    let sawLockout = false;
    for (let i = 0; i < 12; i++) {
      const r = await c.req('/login', { method: 'POST', form: { csrf, username: 'throttle-me', password: 'guess' + i } });
      if (r.status === 429) { sawLockout = true; break; }
    }
    ok('repeated failed sign-ins are locked out', sawLockout);
  }
} catch (err) {
  console.log('FAIL unexpected error: ' + (err && err.stack ? err.stack : err));
  fail++;
}

await cleanup();
console.log('\n' + (fail ? `SERVER: ${fail} FAILED of ${pass + fail}` : `SERVER: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
