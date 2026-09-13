/* session-test.mjs — what happens to a browser that is ALREADY signed in.
 *
 * WHY THIS IS NOT server-test.mjs
 * That suite is thorough about who may sign in. It has exactly one check on the
 * other side of the question -- "a disabled account cannot sign in" -- and that
 * is the login path. Nothing tested the path that actually matters when
 * something has gone wrong:
 *
 *   somebody is signed in RIGHT NOW, holding a valid cookie, and an
 *   administrator has just decided they should not be.
 *
 * Five actions are supposed to end that session immediately: the person changes
 * their own password, an admin resets it, an admin disables the account, an
 * admin deletes it, an admin demotes it from root. Every one of them is one line
 * away from silently not happening, and the failure is invisible -- the admin
 * page says "disabled and signed out", the audit log records it, and the cookie
 * keeps working. Nobody finds out until it matters.
 *
 * NO DEFECT WAS FOUND. All five behave correctly. But writing this suite and
 * then breaking the server on purpose showed the reasons are not the ones the
 * code reads as though they are:
 *
 *   - DISABLE is not cut by the DELETE FROM sessions inside setDisabled.
 *     Removing that line changes nothing a request can see: currentUser re-reads
 *     the user row and returns null on `user.disabled`. The DELETE is hygiene.
 *   - DELETE is not cut by ON DELETE CASCADE either. Turning PRAGMA foreign_keys
 *     OFF leaves the session rows behind and the holder is STILL signed out,
 *     because currentUser returns null on `!user`. The cascade is hygiene.
 *   - DEMOTE is never revoked at all and does not need to be: the role comes
 *     from the users table on every request, not from the session.
 *
 * So one function carries three of the five: currentUser, in server.mjs, doing
 * a getUserById and two null checks that look like ordinary defensiveness.
 *
 * The other two are the password paths, and there deleteUserSessions IS the
 * control -- nothing else invalidates a cookie whose password just changed. The
 * self-change case is the classic one: somebody watched you type your password,
 * you change it, and their session has to die. Nothing else makes that happen.
 *
 * A NOTE ON HOW THIS SUITE FIRST LIED TO ME
 * Its first run reported all five revocations green while the accounts had never
 * been signed in at all -- signing up redirects to /login rather than creating a
 * session. Its second lied the other way: deleting deleteUserSessions from the
 * admin reset left it ALL GREEN, because an admin reset sets must_change, and a
 * must_change session answers 403 on /api/me. "Signed out" and "signed in but
 * confined" are different states and the probe was reading both as signed out.
 * Hence signedInState below, which distinguishes them, and the precondition on
 * every case that the account really was signed in first.
 *
 * WHAT BREAKING THE SERVER ON PURPOSE SHOWED
 * Each line was deleted in turn and the suite re-run:
 *
 *   admin reset loses deleteUserSessions   -> 3 fail (the session reads
 *                                             'confined', not 'out')
 *   self change loses deleteUserSessions   -> 2 fail (the other browser is
 *                                             still 'in' -- the classic hole)
 *   currentUser stops re-reading the user  -> 5 fail, including a demoted
 *                                             session opening /admin with 200
 *   currentUser drops the disabled check   -> 2 fail (static only)
 *   setDisabled drops its session DELETE   -> 1 fail (static only)
 *   BOTH of the disable defences at once   -> 5 fail, and the behavioural
 *                                             check flips to 'in'
 *   PRAGMA foreign_keys OFF                -> 1 fail, the hygiene check
 *
 * The two single-line disable cases are static-only for a real reason rather
 * than a gap: disable is defended twice over, so removing either one alone is
 * invisible to a request. That is worth knowing and is why both are checked by
 * name -- the behavioural check cannot see a redundancy being spent.
 *
 * Spawns its own server on a scratch port with a throwaway database. Pure Node,
 * no browser, no npm dependencies. Run: node scripts/session-test.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const PORT = 8700 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;
const tmp = mkdtempSync(join(tmpdir(), 'nst-sessiontest-'));

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

function makeClient() {
  const jar = new Map();
  return {
    jar,
    async req(path, { method = 'GET', form } = {}) {
      const h = {};
      const c = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      if (c) h.Cookie = c;
      let payload;
      if (form) { payload = new URLSearchParams(form).toString(); h['Content-Type'] = 'application/x-www-form-urlencoded'; }
      const res = await fetch(BASE + path, { method, headers: h, body: payload, redirect: 'manual' });
      for (const sc of (res.headers.getSetCookie ? res.headers.getSetCookie() : [])) {
        const [pair] = sc.split(';');
        const i = pair.indexOf('=');
        const k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
        if (/Max-Age=0/i.test(sc)) jar.delete(k); else jar.set(k, v);
      }
      return { status: res.status, location: res.headers.get('location'), text: await res.text() };
    },
    async csrf(path) {
      const m = (await this.req(path)).text.match(/name="csrf" value="([^"]+)"/);
      return m ? m[1] : null;
    },
    async login(username, password) {
      const csrf = await this.csrf('/login');
      await this.req('/login', { method: 'POST', form: { csrf, username, password } });
      return this.jar.has('nst_session');
    },
  };
}

const child = spawn(process.execPath, [join(REPO, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: join(tmp, 's.db'), NST_HOST: '127.0.0.1',
         NST_ROOT_PASSWORD: 'session-test-root-pw' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => { log += d; });

async function waitForServer(ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(BASE + '/login', { redirect: 'manual' }); if (r.status) return true; }
    catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  return false;
}
async function cleanup() {
  if (child.exitCode === null && child.signalCode === null) {
    const gone = new Promise((r) => child.once('exit', r));
    try { child.kill('SIGTERM'); } catch {}
    await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))]);
  }
  try { rmSync(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); }
  catch (e) { console.log('note: could not remove ' + tmp + ' (' + (e && e.code) + ')'); }
}

/* A signed-in browser, as the server sees one. */
let seq = 0;
/* Signing up does NOT sign you in -- it redirects to /login?created=1. Getting
 * that wrong is how this suite first passed for the wrong reason: every
 * "revocation cut the session" check was green because there had never been a
 * session to cut. The `starts signed in` precondition on each case is what
 * caught it, and is why it stays. */
async function signUp(name, password) {
  const c = makeClient();
  const csrf = await c.csrf('/signup');
  await c.req('/signup', { method: 'POST', form: {
    csrf, username: name, displayName: name, password, password2: password } });
  await c.login(name, password);
  return c;
}
/* Three states, not two. /api/me is the cheapest authenticated endpoint and
 * answers with a status rather than a redirect, so there is no ambiguity with
 * "sent somewhere else" -- but a session that is alive and merely confined to
 * the forced-password-change page also answers non-200, and calling that
 * "signed out" is how this suite missed a removed revocation entirely.
 *
 *   'in'          200 -- a working session
 *   'confined'    403 -- the session is ALIVE; must_change is holding it
 *   'out'         401 -- no session at all, which is what revocation means */
async function signedInState(c) {
  const r = await c.req('/api/me');
  if (r.status === 200) return 'in';
  if (r.status === 403 && /password change required/i.test(r.text)) return 'confined';
  if (r.status === 401) return 'out';
  return 'other:' + r.status;
}
const stillSignedIn = async (c) => (await signedInState(c)) === 'in';
async function adminAction(root, action, targetId) {
  const csrf = await root.csrf('/admin');
  return root.req('/admin/' + action, { method: 'POST', form: { csrf, id: String(targetId) } });
}
async function idOf(root, username) {
  const page = (await root.req('/admin')).text;
  // the admin table carries each row's id on its action forms
  const re = new RegExp('value="(\\d+)"[^]{0,4000}?' + username, 'g');
  const rows = [...page.matchAll(/<input type="hidden" name="id" value="(\d+)"/g)].map((m) => Number(m[1]));
  // resolve by asking the API as that user instead, when the page shape is unclear
  return { rows, re };
}

try {
  if (!await waitForServer()) { console.log('FAIL server did not start\n' + log); await cleanup(); process.exit(1); }

  const root = makeClient();
  ok('root signs in', await root.login('root', 'session-test-root-pw'), log.slice(-200));

  /* Each case gets its own account, so one revocation cannot mask another. */
  const mk = async (pw) => {
    const name = 'victim' + (++seq);
    const c = await signUp(name, pw);
    return { name, c };
  };
  /* The admin page lists accounts newest-first or oldest-first depending on the
   * query; rather than guess, find the row whose forms sit closest after the
   * username. */
  const findId = async (username) => {
    const page = (await root.req('/admin')).text;
    const at = page.indexOf('>' + username + '<');
    const from = at >= 0 ? at : 0;
    const m = page.slice(from).match(/name="id" value="(\d+)"/);
    return m ? Number(m[1]) : null;
  };

  /* ---- 1. an admin disables the account ---- */
  {
    const { name, c } = await mk('a-good-long-password');
    ok(`${name}: signing up leaves them signed in`, await stillSignedIn(c));
    const id = await findId(name);
    ok(`${name}: appears on the admin page with an id`, id !== null, String(id));
    const r = await adminAction(root, 'disable', id);
    ok(`${name}: the disable action is accepted`, r.status === 302, r.status);
    const st1 = await signedInState(c);
    ok('DISABLE cuts the live session immediately', st1 === 'out', st1);
  }

  /* ---- 2. an admin resets the password ---- */
  {
    const { name, c } = await mk('a-good-long-password');
    ok(`${name}: starts signed in`, await stillSignedIn(c));
    await adminAction(root, 'reset', await findId(name));
    const st = await signedInState(c);
    /* 'out', not merely 'not in'. A reset also sets must_change, so a session
     * that was NOT cut answers 'confined' -- which is the exact reading that
     * made this check pass with the revocation deleted. */
    ok('an ADMIN PASSWORD RESET cuts the live session immediately', st === 'out',
      st + " -- 'confined' means the session is alive and only must_change is holding it");
  }

  /* ---- 3. an admin deletes the account ----
   * This one has no explicit DELETE FROM sessions anywhere. It works only
   * because the schema cascades AND the pragma enabling cascades is set. */
  {
    const { name, c } = await mk('a-good-long-password');
    ok(`${name}: starts signed in`, await stillSignedIn(c));
    await adminAction(root, 'delete', await findId(name));
    const st2 = await signedInState(c);
    ok('DELETING the account cuts the live session immediately', st2 === 'out', st2);
  }

  /* ---- 4. the person changes their own password ----
   * The case that matters after a shoulder-surf: changing the password has to
   * end the sessions somebody else may already be holding. */
  {
    const { name, c } = await mk('a-good-long-password');
    const other = makeClient();
    ok(`${name}: a second browser can sign in with the same password`,
      await other.login(name, 'a-good-long-password'));
    const csrf = await c.csrf('/account/password');
    await c.req('/account/password', { method: 'POST', form: {
      csrf, current: 'a-good-long-password', password: 'a-different-long-password', password2: 'a-different-long-password' } });
    const st3 = await signedInState(other);
    ok('a SELF PASSWORD CHANGE cuts the other browser\'s session', st3 === 'out', st3);
    ok('and the old password no longer works', !await makeClient().login(name, 'a-good-long-password'));
    ok('while the new one does', await makeClient().login(name, 'a-different-long-password'));
  }

  /* ---- 5. an admin demotes a root ----
   * Nothing revokes here, and nothing needs to: the role is re-read from the
   * users table on every request. The check is that the ADMIN PAGE closes, not
   * that the session dies. */
  {
    const { name, c } = await mk('a-good-long-password');
    const id = await findId(name);
    await adminAction(root, 'promote', id);
    ok(`${name}: promoted, and their EXISTING session can now open /admin`,
      (await c.req('/admin')).status === 200);
    await adminAction(root, 'demote', id);
    const after = await c.req('/admin');
    ok('DEMOTING closes /admin for the session that is already open', after.status === 403, after.status);
    ok('but leaves them signed in to the study tool, which is right',
      await stillSignedIn(c));
  }

  /* ---- 6. the lines that actually carry this ----
   *
   * Established by breaking each one and re-running: currentUser is the control
   * for disable, delete and demote, and deleteUserSessions is the control for
   * the two password paths. The cascade and the DELETE inside setDisabled are
   * hygiene -- removing either changes nothing a request can observe. They are
   * still checked, because an orphan session row is worth not having, but they
   * are labelled for what they are so nobody mistakes them for the guard. */
  {
    const fs = await import('node:fs');
    const db = fs.readFileSync(join(REPO, 'server', 'db.mjs'), 'utf8');
    const srv = fs.readFileSync(join(REPO, 'server', 'server.mjs'), 'utf8');

    ok('THE GUARD: currentUser re-reads the user row every request',
      /function currentUser[^]{0,600}getUserById/.test(srv));
    ok('THE GUARD: and returns null when that row is gone -- this is what cuts a deleted account',
      /function currentUser[^]{0,700}!user\s*\|\|/.test(srv));
    ok('THE GUARD: and when it is disabled -- this is what cuts a disabled account',
      /function currentUser[^]{0,700}user\.disabled/.test(srv));
    ok('THE GUARD: a self password change deletes the account\'s other sessions',
      /DB\.setPassword\(db, me\.id[^]{0,400}DB\.deleteUserSessions\(db, me\.id\)/.test(srv));
    ok('THE GUARD: an admin reset does too',
      /DB\.setPassword\(db, target\.id[^]{0,200}DB\.deleteUserSessions\(db, target\.id\)/.test(srv));
    ok('and changing a password still demands the current one, even on a forced reset',
      /A\.verifyPassword\(form\.current/.test(srv));

    ok('hygiene: foreign keys are ON, so a deleted user leaves no orphan sessions',
      /PRAGMA\s+foreign_keys\s*=\s*ON/i.test(db));
    ok('hygiene: and the sessions table declares the cascade that relies on it',
      /user_id[^,]*REFERENCES\s+users\(id\)\s+ON\s+DELETE\s+CASCADE/i.test(db));
    ok('hygiene: disabling an account also clears its session rows',
      /setDisabled[^]{0,300}DELETE FROM sessions WHERE user_id/.test(db));
  }

  /* ---- 7. the checks can see a revocation that did not happen ----
   *
   * Every check above passed, which proves only that signing out works at all.
   * A session that was never cut must FAIL the same helper. */
  {
    const { name, c } = await mk('a-good-long-password');
    ok(`${name}: an untouched session is still signed in`, await stillSignedIn(c) === true);
    ok('self-check: stillSignedIn is not simply always false',
      await stillSignedIn(root) === true);
    const dead = makeClient();
    dead.jar.set('nst_session', 'not-a-real-token');
    ok('self-check: and not simply always true -- a forged cookie reads as signed out',
      await signedInState(dead) === 'out');
    await adminAction(root, 'disable', await findId(name));
    ok('self-check: the same account, after disable, flips to signed out',
      await signedInState(c) === 'out');
    /* And the state probe really can tell the two non-200 answers apart, or the
     * reset check above is back to passing for the wrong reason. */
    const { name: cn, c: cc } = await mk('a-good-long-password');
    await adminAction(root, 'reset', await findId(cn));
    const forced = makeClient();
    await forced.login(cn, 'wrong-password-entirely');
    ok(`self-check: ${cn} after a reset is 'out', not 'confined'`,
      await signedInState(cc) === 'out');
  }
} catch (e) {
  fail++;
  console.log('FAIL threw: ' + (e && e.stack || e));
} finally {
  await cleanup();
}

console.log('\n' + (fail ? `SESSIONS: ${fail} FAILED (${pass} passed)` : `SESSIONS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
