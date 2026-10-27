/* netlify-app-test.mjs — the hosted account system, against a real Postgres.
 *
 * netlify/lib/app.mjs is server/server.mjs rewritten as a web-standard Request -> Response handler over
 * Postgres. The risk in a port is not that it crashes; it is that it quietly stops doing one of the things the
 * original did: throttling guesses, hiding which usernames exist, refusing a forged form, ending a disabled
 * person's sessions. So this drives the real handler with real requests against a local Postgres started by
 * Netlify's own @netlify/database-dev (the same engine family Netlify Database uses), through the same
 * @netlify/database client the deployed function uses, with the real migration files applied.
 *
 * Needs the two dev packages: npm install --no-save @netlify/database @netlify/database-dev
 * Run: node scripts/netlify-app-test.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

let NetlifyDB, getDatabase;
try {
  ({ NetlifyDB } = await import('@netlify/database-dev'));
  ({ getDatabase } = await import('@netlify/database'));
} catch (e) {
  const msg = 'the Netlify database packages are not installed: npm install --no-save @netlify/database @netlify/database-dev';
  if (process.env.NST_REQUIRE_NETLIFY_DB === '1') { console.error('FAIL: ' + msg); process.exit(1); }
  console.log('SKIP: ' + msg); process.exit(0);
}
const { createApp } = await import('../netlify/lib/app.mjs');
const { makeStore } = await import('../netlify/lib/store.mjs');
const { queryFrom } = await import('../netlify/lib/db.mjs');
const { sessionAllowed } = await import('../netlify/lib/gate.mjs');
const { NST_VERSION } = await import('../netlify/lib/version.mjs');

const dev = new NetlifyDB();
const connectionString = await dev.start();
await dev.applyMigrations(join(REPO, 'netlify/database/migrations'));
const db = getDatabase({ connectionString });
const q = queryFrom(db);
const store = makeStore(q);

const ENV = { NST_SETUP_TOKEN: 'setup-token-for-tests', NST_ALLOW_SIGNUP: '1' };
const app = createApp({ store, env: (k) => ENV[k], version: NST_VERSION });
const ORIGIN = 'https://nst.test';

/* A tiny cookie jar, because every flow here depends on cookies. */
class Browser {
  constructor(ip = '203.0.113.7') { this.jar = {}; this.ip = ip; }
  async go(path, { method = 'GET', form, json, headers = {}, body, ip } = {}) {
    const h = new Headers(headers);
    const c = Object.entries(this.jar).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
    if (c) h.set('cookie', c);
    let b = body;
    if (form) { b = new URLSearchParams(form).toString(); h.set('content-type', 'application/x-www-form-urlencoded'); }
    if (json) { b = JSON.stringify(json); h.set('content-type', 'application/json'); }
    const res = await app(new Request(ORIGIN + path, { method, headers: h, body: b, redirect: 'manual' }), { ip: ip || this.ip });
    for (const sc of res.headers.getSetCookie()) {
      const [kv] = sc.split(';'); const i = kv.indexOf('=');
      const k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1));
      if (/Max-Age=0/i.test(sc)) delete this.jar[k]; else this.jar[k] = v;
    }
    res.text_ = res.status >= 300 && res.status < 400 ? '' : await res.text();
    return res;
  }
  async csrf(path) { await this.go(path); return this.jar.nst_csrf; }
  async signup(u, p, extra = {}) { const csrf = await this.csrf('/signup'); return this.go('/signup', { method: 'POST', form: { csrf, username: u, password: p, password2: p, ...extra } }); }
  async login(u, p, extra = {}) { const csrf = await this.csrf('/login'); return this.go('/login', { method: 'POST', form: { csrf, username: u, password: p, ...extra } }); }
}
const loc = (r) => r.headers.get('location') || '';

try {
  /* ---- the schema ---- */
  const tables = (await q("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).map((r) => r.table_name);
  ok('the migrations create the account tables', ['nst_users', 'nst_sessions', 'nst_progress', 'nst_audit', 'nst_throttle'].every((t) => tables.includes(t)), tables.join(','));
  ok('the legacy progress table from the previous app is kept', tables.includes('progress'));

  /* ---- first-run setup ---- */
  const anon = new Browser();
  ok('before setup: no administrator exists', (await store.countRoots()) === 0);
  const sGet = await anon.go('/setup');
  ok('/setup is reachable while there is no administrator and a token is configured', sGet.status === 200 && /Create the administrator/.test(sGet.text_));
  const badTok = await anon.go('/setup', { method: 'POST', form: { csrf: anon.jar.nst_csrf, token: 'nope', username: 'root', password: 'a-long-passphrase', password2: 'a-long-passphrase' } });
  ok('[neg] a wrong setup token creates nothing', badTok.status === 403 && (await store.countRoots()) === 0);
  const noCsrf = await anon.go('/setup', { method: 'POST', form: { csrf: 'forged', token: ENV.NST_SETUP_TOKEN, username: 'root', password: 'a-long-passphrase', password2: 'a-long-passphrase' } });
  ok('[neg] a forged form creates nothing', noCsrf.status === 400 && (await store.countRoots()) === 0);
  const mk = await anon.go('/setup', { method: 'POST', form: { csrf: anon.jar.nst_csrf, token: ENV.NST_SETUP_TOKEN, username: 'root', password: 'a-long-passphrase', password2: 'a-long-passphrase' } });
  ok('the right token creates the administrator', mk.status === 303 && (await store.countRoots()) === 1, mk.status);
  ok('after that /setup is gone for good', (await anon.go('/setup')).status === 404);
  const rootRow = await store.getUserByName('root');
  ok('the password is stored hashed with a salt, never in the clear', rootRow.pass_hash.length === 128 && rootRow.pass_hash !== 'a-long-passphrase' && !!rootRow.pass_salt);

  /* ---- sign up and sign in ---- */
  const ana = new Browser('198.51.100.20');
  const su = await ana.signup('ana', 'correct horse battery', { displayName: 'Ana' });
  ok('sign-up creates an account and sends you to sign in', su.status === 303 && /\/login\?created=1/.test(loc(su)), `${su.status} ${loc(su)}`);
  ok('[neg] a duplicate username is refused, whatever the case', (await new Browser('198.51.100.21').signup('ANA', 'another long pass')).status === 400);
  ok('[neg] "root" is reserved', (await new Browser('198.51.100.22').signup('root', 'another long pass')).status === 400);
  ok('[neg] a short password is refused', (await new Browser('198.51.100.23').signup('bobby', 'short')).status === 400);
  const li = await ana.login('ana', 'correct horse battery');
  ok('signing in sets a session cookie and goes home', li.status === 303 && loc(li) === '/' && !!ana.jar.nst_session, `${li.status} ${loc(li)}`);
  const setCookie = (await new Browser().login('ana', 'correct horse battery')).headers.getSetCookie().join(' | ');
  ok('the session cookie is HttpOnly, Secure and SameSite=Lax', /nst_session=[^;]+;[^|]*HttpOnly/.test(setCookie) && /nst_session[^|]*Secure/.test(setCookie) && /nst_session[^|]*SameSite=Lax/.test(setCookie), setCookie.slice(0, 200));
  const sess = await q('SELECT token_hash FROM nst_sessions');
  ok('only a HASH of the session token is stored', sess.length > 0 && sess.every((r) => r.token_hash.length === 64 && r.token_hash !== ana.jar.nst_session));
  const me = await ana.go('/api/me');
  const meJson = JSON.parse(me.text_);
  ok('/api/me says who is signed in', me.status === 200 && meJson.username === 'ana' && meJson.displayName === 'Ana' && meJson.role === 'user' && meJson.serverBacked === true, me.text_);
  const meOut = await new Browser().go('/api/me');
  ok('/api/me is a 401 when signed out, and says accounts exist (the launcher uses that to show "Sign in")', meOut.status === 401 && JSON.parse(meOut.text_).accounts === true, meOut.text_);

  /* ---- sign-in does not leak who has an account ---- */
  const bad1 = await new Browser('198.51.100.30').login('ana', 'wrong password!');
  const bad2 = await new Browser('198.51.100.31').login('nobody-here', 'wrong password!');
  const msg = (r) => (/<div class="msg err">([^<]*)</.exec(r.text_) || [])[1];
  ok('[neg] a wrong password and an unknown user get the same status and the same words', bad1.status === 401 && bad2.status === 401 && msg(bad1) === msg(bad2) && !!msg(bad1), `${msg(bad1)} / ${msg(bad2)}`);
  const t0 = Date.now(); await new Browser('198.51.100.32').login('nobody-here', 'x'.repeat(10)); const tMissing = Date.now() - t0;
  const t1 = Date.now(); await new Browser('198.51.100.33').login('ana', 'x'.repeat(10)); const tReal = Date.now() - t1;
  ok('an unknown user costs about as long as a real one (no timing tell)', tMissing > tReal * 0.4, `${tMissing} ms vs ${tReal} ms`);

  /* ---- throttling lives in the database, so it survives separate invocations ---- */
  const attacker = '192.0.2.99';
  let last;
  for (let i = 0; i < 8; i++) last = await new Browser(attacker).login('ana', 'guess number ' + i);
  const locked = await new Browser(attacker).login('ana', 'correct horse battery');
  ok('[neg] eight wrong guesses lock the account for that address, even with the RIGHT password', locked.status === 429 && /Too many attempts/.test(locked.text_), locked.status);
  const rows = await q("SELECT key FROM nst_throttle WHERE key LIKE $1", ['%' + attacker + '%']);
  ok('the lockout is a database row (not process memory), so another instance sees it', rows.length >= 1, rows.length);
  const elsewhere = await new Browser('192.0.2.100').login('ana', 'correct horse battery');
  ok('another address is not locked out', elsewhere.status === 303);
  const sgn = new Browser('192.0.2.77'); let s429 = 0;
  for (let i = 0; i < 12; i++) { const r = await sgn.signup('flood' + i, 'a long passphrase'); if (r.status === 429) s429++; }
  ok('[neg] sign-up is throttled per address (a loop cannot mint accounts)', s429 > 0, `${s429} refused of 12`);

  /* ---- CSRF ---- */
  const victim = new Browser('198.51.100.40');
  await victim.signup('vic', 'a long passphrase'); await victim.login('vic', 'a long passphrase');
  const forgedLogout = await victim.go('/logout', { method: 'POST', form: { csrf: 'forged' } });
  ok('[neg] a logout without the CSRF token does not end the session', forgedLogout.status === 303 && (await victim.go('/api/me')).status === 200);
  ok('...and the session is really still alive', (await q('SELECT 1 FROM nst_sessions s JOIN nst_users u ON u.id = s.user_id WHERE lower(u.username) = $1', ['vic'])).length === 1);
  const goodLogout = await victim.go('/logout', { method: 'POST', form: { csrf: victim.jar.nst_csrf } });
  ok('a logout WITH the token ends it and clears the cookie', goodLogout.status === 303 && !victim.jar.nst_session && (await victim.go('/api/me')).status === 401);

  /* ---- safe redirects ---- */
  const nx = new Browser('198.51.100.50'); await nx.signup('nexty', 'a long passphrase');
  const toNcm = await nx.login('nexty', 'a long passphrase', { next: '/ncm-practice/' });
  ok('"next" returns you to the page you came for', loc(toNcm) === '/ncm-practice/', loc(toNcm));
  for (const evil of ['//evil.example/x', 'https://evil.example/', '/\\evil.example', 'javascript:alert(1)']) {
    const b = new Browser('198.51.100.51'); await b.signup('ev' + Math.random().toString(36).slice(2, 7), 'a long passphrase');
    const r = await b.login((await q('SELECT username FROM nst_users ORDER BY id DESC LIMIT 1'))[0].username, 'a long passphrase', { next: evil });
    ok(`[neg] an off-site "next" (${evil}) is ignored`, loc(r) === '/', loc(r));
  }
  const gated = await new Browser().go('/account/password');
  ok('a signed-out visit to an account page is sent to sign in, remembering where it was going', gated.status === 303 && /^\/login\?next=%2Faccount%2Fpassword/.test(loc(gated)), loc(gated));

  /* ---- progress: the envelope the shared sync module sends ---- */
  const envelope = { app: 'nst', format: 1, data: { 'nst.ncm-practice.v1': '{"seen":3}', 'nst.mastery.v1': '{"a":1}' } };
  ok('progress GET with nothing stored is {updatedAt:0,data:null}', JSON.stringify(JSON.parse((await ana.go('/api/progress')).text_)) === '{"updatedAt":0,"data":null}');
  const putPlain = await ana.go('/api/progress', { method: 'PUT', json: envelope });
  ok('PUT stores the envelope', putPlain.status === 200 && JSON.parse(putPlain.text_).ok === true, putPlain.text_);
  const got = JSON.parse((await ana.go('/api/progress')).text_);
  ok('GET returns exactly what was stored, with a timestamp', JSON.stringify(got.data) === JSON.stringify(envelope) && got.updatedAt > 0);
  const gz = gzipSync(Buffer.from(JSON.stringify({ ...envelope, data: { 'nst.ncm-practice.v1': '{"seen":9}' } })));
  const putGz = await ana.go('/api/progress', { method: 'PUT', body: gz, headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' } });
  ok('a gzip-compressed PUT (what shared/nst-sync.js sends) is accepted', putGz.status === 200, putGz.status + ' ' + putGz.text_);
  ok('...and stored decompressed', JSON.parse((await ana.go('/api/progress')).text_).data.data['nst.ncm-practice.v1'] === '{"seen":9}');
  const putAlready = await ana.go('/api/progress', { method: 'PUT', body: JSON.stringify(envelope), headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' } });
  ok('a body that CLAIMS gzip but is plain JSON (a CDN already inflated it) is still accepted', putAlready.status === 200, putAlready.status);
  ok('[neg] not JSON is a 400', (await ana.go('/api/progress', { method: 'PUT', body: 'not json' })).status === 400);
  ok('[neg] JSON that is not an envelope is a 400', (await ana.go('/api/progress', { method: 'PUT', json: { hello: 1 } })).status === 400);
  ok('[neg] an unknown content-encoding is a 415', (await ana.go('/api/progress', { method: 'PUT', body: '{}', headers: { 'content-encoding': 'br' } })).status === 415);
  ok('[neg] a huge body is a 413', (await ana.go('/api/progress', { method: 'PUT', body: JSON.stringify({ data: { x: 'a'.repeat(2.1 * 1024 * 1024) } }) })).status === 413);
  ok('[neg] a gzip bomb (small on the wire, huge inflated) is a 413', (await ana.go('/api/progress', { method: 'PUT', body: gzipSync(Buffer.from('{"data":{"x":"' + 'a'.repeat(3 * 1024 * 1024) + '"}}')) })).status === 413);
  const otherUser = new Browser('198.51.100.60'); await otherUser.signup('carl', 'a long passphrase'); await otherUser.login('carl', 'a long passphrase');
  ok('[neg] one account never sees another\'s progress', JSON.parse((await otherUser.go('/api/progress')).text_).data === null);
  ok('[neg] progress without signing in is a 401', (await new Browser().go('/api/progress')).status === 401 && (await new Browser().go('/api/progress', { method: 'PUT', json: envelope })).status === 401);
  const del = await ana.go('/api/progress', { method: 'DELETE' });
  ok('DELETE clears it', del.status === 200 && JSON.parse((await ana.go('/api/progress')).text_).data === null);

  /* ---- the gate for /ncm-practice/ ---- */
  const sha = async (s) => createHash('sha256').update(s).digest('hex');
  ok('a valid session passes the NCM gate', await sessionAllowed(`nst_session=${encodeURIComponent(ana.jar.nst_session)}`, q, sha));
  ok('[neg] no cookie does not', !(await sessionAllowed('', q, sha)));
  ok('[neg] a made-up session token does not', !(await sessionAllowed('nst_session=forged', q, sha)));
  ok('[neg] a malformed cookie value does not throw', !(await sessionAllowed('nst_session=%E0%A4%A', q, sha)));
  ok('[neg] an expired session does not', !(await sessionAllowed(`nst_session=${encodeURIComponent(ana.jar.nst_session)}`, q, sha, Date.now() + 40 * 24 * 3600 * 1000)));

  /* ---- password change ---- */
  const pc = new Browser('198.51.100.70'); await pc.signup('pwchange', 'old long passphrase'); await pc.login('pwchange', 'old long passphrase');
  const other = new Browser('198.51.100.71'); await other.login('pwchange', 'old long passphrase');
  const csrfPc = await pc.csrf('/account/password');
  const wrongCur = await pc.go('/account/password', { method: 'POST', form: { csrf: csrfPc, current: 'nope nope nope', password: 'new long passphrase', password2: 'new long passphrase' } });
  ok('[neg] the wrong current password changes nothing', wrongCur.status === 400);
  const okPc = await pc.go('/account/password', { method: 'POST', form: { csrf: csrfPc, current: 'old long passphrase', password: 'new long passphrase', password2: 'new long passphrase' } });
  ok('changing the password works', okPc.status === 303);
  ok('and ends every OTHER session', (await other.go('/api/me')).status === 401);
  ok('while this one carries on', (await pc.go('/api/me')).status === 200);
  ok('the new password signs in; the old one does not', (await new Browser('198.51.100.72').login('pwchange', 'new long passphrase')).status === 303 && (await new Browser('198.51.100.73').login('pwchange', 'old long passphrase')).status === 401);

  /* ---- the administrator console ---- */
  const admin = new Browser('198.51.100.80');
  await admin.login('root', 'a-long-passphrase');
  const adm = await admin.go('/admin');
  ok('the administrator sees the console, which names Netlify and offers no VM backup/update buttons', adm.status === 200 && /Accounts/.test(adm.text_) && /Netlify/.test(adm.text_) && !/admin\/backup|update-apply/.test(adm.text_), adm.status);
  ok('[neg] an ordinary user is refused the console', (await ana.go('/admin')).status === 403);
  ok('[neg] a signed-out visitor is sent to sign in', (await new Browser().go('/admin')).status === 303);
  const carl = await store.getUserByName('carl');
  const act = (action, id, csrf = admin.jar.nst_csrf) => admin.go('/admin/' + action, { method: 'POST', form: { csrf, id } });
  ok('[neg] an admin action without the CSRF token does nothing', loc(await act('disable', carl.id, 'forged')).includes('err='));
  await act('disable', carl.id);
  ok('disabling an account ends its sessions at once', (await otherUser.go('/api/me')).status === 401 && (await new Browser('198.51.100.81').login('carl', 'a long passphrase')).status === 401);
  await act('enable', carl.id);
  ok('enabling lets them in again', (await new Browser('198.51.100.82').login('carl', 'a long passphrase')).status === 303);
  const rs = await act('reset', carl.id);
  const temp = /Temporary password for carl: (\S+)/.exec(decodeURIComponent(loc(rs)))?.[1];
  ok('reset issues a one-time password', !!temp && temp.startsWith('nst-'), loc(rs));
  const tb = new Browser('198.51.100.83'); const tl = await tb.login('carl', temp);
  ok('signing in with it forces a password change before anything else', loc(tl) === '/account/password' && (await tb.go('/api/progress')).status === 403 && (await tb.go('/')).status !== 200);
  ok('the gate refuses a session that still owes a password change', !(await sessionAllowed(`nst_session=${encodeURIComponent(tb.jar.nst_session)}`, q, sha)));
  await act('promote', carl.id);
  ok('promoting makes another administrator', (await store.countRoots()) === 2);
  const rootUser = await store.getUserByName('root');
  await act('demote', carl.id);
  ok('demoting returns them to an ordinary user', (await store.countRoots()) === 1 && (await store.getUserById(carl.id)).role === 'user');
  ok('[neg] an administrator cannot act on their own account from the console', loc(await act('delete', rootUser.id)).includes('err=') && (await store.getUserByName('root')) !== null);
  const before = await store.countUsers();
  await act('delete', carl.id);
  ok('deleting an account removes it and its progress', (await store.countUsers()) === before - 1 && (await q('SELECT 1 FROM nst_progress WHERE user_id = $1', [carl.id])).length === 0);
  ok('the audit log records what happened', (await store.recentAudit(100)).some((a) => a.action === 'login-failed') && (await store.recentAudit(100)).some((a) => a.action === 'deleted'));

  /* ---- signup can be closed ---- */
  ENV.NST_ALLOW_SIGNUP = '0';
  ok('[neg] with NST_ALLOW_SIGNUP=0 the sign-up page is closed', (await new Browser('198.51.100.90').go('/signup')).status === 403);
  ENV.NST_ALLOW_SIGNUP = '1';

  /* ---- headers ---- */
  const h = await new Browser().go('/login');
  ok('pages cannot be framed and are never cached', h.headers.get('x-frame-options') === 'DENY' && /frame-ancestors 'none'/.test(h.headers.get('content-security-policy')) && h.headers.get('cache-control') === 'no-store');
  ok('unknown account routes are a 404, not a crash', (await ana.go('/account/nothing')).status === 404);
} catch (e) {
  fail++; console.log('FAIL unexpected error: ' + (e && e.stack ? e.stack : e));
}

try { await db.pool.end(); } catch { /* already closed */ }
await dev.stop();
console.log('\n' + (fail ? `NETLIFY APP: ${fail} FAILED of ${pass + fail}` : `NETLIFY APP: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
