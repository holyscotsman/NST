/* auth-test.mjs — the login layer, and the four ways it gave itself away.
 *
 * This server sits on a company LAN with self-service sign-up and a root
 * account. Everything here was found by probing a running instance, not by
 * reading the code — each check is the assertion that the probe now fails.
 *
 *   - **A malformed cookie took the whole site down for that browser.**
 *     decodeURIComponent('%') throws, parseCookies did not catch it, and the
 *     session cookie is read before routing — so one junk cookie answered 500
 *     to every page including /login, with no way in to clear it. Measured: 500.
 *   - **The clock named your accounts.** A failed sign-in returns one message
 *     for both halves, deliberately. But an unknown username skipped the scrypt
 *     entirely and answered in 1.6ms where a real one took 31.6ms — a 20x tell.
 *     The careful error text was undone by a stopwatch.
 *   - **Sign-up had no throttle at all.** Every POST ran a deliberately slow
 *     hash and wrote a row, so a loop pinned the CPU and grew the database
 *     without limit. Measured: 20 of 20 accounts created.
 *   - **The throttle was its own flood.** Keyed by ip|username, and an unknown
 *     username costs nothing to reject, so a fresh random name per request
 *     minted a map entry nothing ever came back to expire.
 *
 * Pure Node, no network. Run: node scripts/auth-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as A from '../server/auth.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};
const noThrow = (fn) => { try { return { ok: true, value: fn() }; } catch (e) { return { ok: false, error: e }; } };

/* ---- 1. parseCookies survives anything a client can send --------------- */
{
  const nasty = [
    'nst_session=%',                  // the one that answered 500
    'a=%E0%A4%A',                     // truncated multi-byte
    'b=%ZZ', 'c=%', 'd=100%',
    'e=%C0%80',                       // overlong
    '=novalue', 'novalue', ';;;', '',
    'f=' + '%'.repeat(200),
    'g=ok; h=%; i=fine',              // a good cookie beside a bad one
  ];
  let threw = null;
  for (const h of nasty) { const r = noThrow(() => A.parseCookies(h)); if (!r.ok) { threw = h + ' -> ' + r.error.message; break; } }
  ok('no cookie header can make parseCookies throw', threw === null, threw);

  const mixed = A.parseCookies('g=ok; h=%; i=fine');
  ok('a bad value does not lose the good cookies beside it', mixed.g === 'ok' && mixed.i === 'fine', JSON.stringify(mixed));
  ok('and the undecodable one is kept verbatim, not dropped', mixed.h === '%', JSON.stringify(mixed));
  ok('an undecodable value cannot match a real token', mixed.h !== A.hashToken('%'));

  const good = A.parseCookies('nst_session=a%20b; nst_csrf=tok');
  ok('ordinary percent-encoding still decodes', good.nst_session === 'a b' && good.nst_csrf === 'tok', JSON.stringify(good));

  const poison = A.parseCookies('__proto__=x; constructor=y; toString=z');
  ok('a cookie named __proto__ cannot reach Object.prototype', ({}).x === undefined && Object.prototype.x === undefined);
  ok('and the parsed object has no inherited surface to shadow', Object.getPrototypeOf(poison) === null);
  ok('reading a cookie that was never sent is still undefined', poison.nst_session === undefined);

  const src = read('server', 'auth.mjs');
  ok('the decode is guarded in source, not by luck', /try \{ out\[k\] = decodeURIComponent\(v\); \} catch/.test(src));
}

/* ---- 2. a missing username costs the same as a real one ---------------- */
{
  ok('absorbPassword exists', typeof A.absorbPassword === 'function');
  ok('and never reports a sign-in', A.absorbPassword('anything') === false);

  const { hash, salt } = A.hashPassword('a-real-password');
  const t = (fn) => { const a = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - a) / 1e6; };
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const real = [], miss = [];
  for (let i = 0; i < 7; i++) {
    real.push(t(() => A.verifyPassword('wrong-guess', hash, salt)));
    miss.push(t(() => A.absorbPassword('wrong-guess')));
  }
  const ratio = med(real) / med(miss);
  ok('a real check is actually slow (scrypt is doing its job)', med(real) > 5, med(real).toFixed(1) + 'ms');
  ok('an unknown username takes the same time as a known one',
    ratio > 0.5 && ratio < 2, `known ${med(real).toFixed(1)}ms vs unknown ${med(miss).toFixed(1)}ms = ${ratio.toFixed(1)}x`);

  const srv = read('server', 'server.mjs');
  ok('the login route actually calls it', /A\.absorbPassword\(form\.password\)/.test(srv));
  ok('and a DISABLED account burns the time too, not just a missing one',
    /\(user && !user\.disabled\)[\s\S]{0,200}A\.absorbPassword/.test(srv));
  ok('the failure message still does not say which half was wrong',
    /That username and password do not match\./.test(srv) &&
    !/(no such user|unknown username|wrong password')/i.test(srv));
}

/* ---- 3. sign-up is rate limited before it does any work ---------------- */
{
  const srv = read('server', 'server.mjs');
  const signup = srv.slice(srv.indexOf("path === '/signup'"), srv.indexOf("path === '/logout'"));
  ok('sign-up consults the throttle', /A\.throttleCheck\(sKey\)/.test(signup));
  ok('it is keyed per address', /'signup\|' \+ clientIp\(req\)/.test(signup));
  ok('a locked-out signup answers 429, not 400', /sendHtml\(res, 429, P\.signupPage/.test(signup));
  ok('and says how long to wait', /Try again in \$\{mins\} minute/.test(signup));
  ok('EVERY attempt counts, not only the failures', /A\.throttleFail\(sKey\);/.test(signup));

  const gateAt = signup.indexOf('A.throttleCheck(sKey)');
  ok('the gate runs before the password is hashed',
    gateAt >= 0 && gateAt < signup.indexOf('A.hashPassword'), `${gateAt} vs ${signup.indexOf('A.hashPassword')}`);
  ok('the gate runs before the database is queried for the name',
    gateAt >= 0 && gateAt < signup.indexOf('DB.getUserByName'), `${gateAt} vs ${signup.indexOf('DB.getUserByName')}`);
  ok('the gate runs before a row can be written',
    gateAt >= 0 && gateAt < signup.indexOf('DB.createUser'), `${gateAt} vs ${signup.indexOf('DB.createUser')}`);
  ok('so "already taken" cannot be mined at speed either',
    gateAt >= 0 && gateAt < signup.indexOf("back('That username is already taken"));
}

/* ---- 4. the throttle itself cannot be used to exhaust the process ------ */
{
  A._throttleClearAll();
  ok('the cap is a real number', A._THROTTLE_MAX_KEYS > 0 && Number.isFinite(A._THROTTLE_MAX_KEYS));

  const N = A._THROTTLE_MAX_KEYS * 3;
  for (let i = 0; i < N; i++) A.throttleFail('10.0.0.1|nobody-' + i);
  ok('a flood of never-seen usernames cannot grow the map without limit',
    A._throttleSize() <= A._THROTTLE_MAX_KEYS, `${A._throttleSize()} entries after ${N} attempts`);

  // A lockout must survive someone trying to wash it out with junk keys.
  A._throttleClearAll();
  const now = Date.now();
  for (let i = 0; i < 9; i++) A.throttleFail('10.0.0.2|victim', now);
  ok('eight bad guesses lock an account out', A.throttleCheck('10.0.0.2|victim', now).allowed === false);
  for (let i = 0; i < A._THROTTLE_MAX_KEYS * 2; i++) A.throttleFail('10.0.0.3|junk-' + i, now);
  ok('and flooding the map does NOT clear that lockout',
    A.throttleCheck('10.0.0.2|victim', now).allowed === false, JSON.stringify(A.throttleCheck('10.0.0.2|victim', now)));
  ok('the map is still bounded afterwards', A._throttleSize() <= A._THROTTLE_MAX_KEYS, A._throttleSize());

  /* The coarse per-address gate. Closing the timing leak made every unknown
   * username cost a full scrypt; the fine ip|username key never repeats for a
   * bot inventing names, so without this the fix would have been a CPU DoS. */
  A._throttleClearAll();
  ok('there is a per-address limit, looser than the per-account one',
    A.MAX_ATTEMPTS_PER_IP > A._THROTTLE_MAX_ATTEMPTS, `${A.MAX_ATTEMPTS_PER_IP} vs ${A._THROTTLE_MAX_ATTEMPTS}`);
  ok('but still a limit, not a formality', A.MAX_ATTEMPTS_PER_IP < 10000, A.MAX_ATTEMPTS_PER_IP);

  const ipKey = 'login-ip|10.0.0.9';
  for (let i = 0; i < A.MAX_ATTEMPTS_PER_IP; i++) {
    A.throttleFail('10.0.0.9|invented-' + i, now);              // fine key: never repeats
    A.throttleFail(ipKey, now, A.MAX_ATTEMPTS_PER_IP);          // coarse key: does
  }
  ok('a flood of DIFFERENT usernames from one address is eventually refused',
    A.throttleCheck(ipKey, now).allowed === false, JSON.stringify(A.throttleCheck(ipKey, now)));
  ok('and the per-username gate still could not see it',
    A.throttleCheck('10.0.0.9|invented-3', now).allowed === true);

  A._throttleClearAll();
  for (let i = 0; i < A._THROTTLE_MAX_ATTEMPTS + 1; i++) A.throttleFail('login-ip|10.0.0.10', now, A.MAX_ATTEMPTS_PER_IP);
  ok('a handful of typos does not lock a shared office address out',
    A.throttleCheck('login-ip|10.0.0.10', now).allowed === true);

  const srv = read('server', 'server.mjs');
  ok('the login route consults the address gate', /A\.throttleCheck\(ipKey\)/.test(srv));
  ok('it counts failures against the address too', /A\.throttleFail\(ipKey, Date\.now\(\), A\.MAX_ATTEMPTS_PER_IP\)/.test(srv));
  ok('and a real sign-in clears the address, not just the account', /A\.throttleReset\(ipKey\)/.test(srv));
  ok('the address gate is checked before the scrypt runs',
    srv.indexOf('A.throttleCheck(ipKey)') < srv.indexOf('A.absorbPassword'));

  // Expired records are the first thing to go, so ordinary use never evicts.
  A._throttleClearAll();
  const old = now - 60 * 60 * 1000;
  for (let i = 0; i < A._THROTTLE_MAX_KEYS + 50; i++) A.throttleFail('10.0.0.4|stale-' + i, old);
  A.throttleFail('10.0.0.4|fresh', now);
  ok('a current record outlives a swept-away stale one',
    A.throttleCheck('10.0.0.4|fresh', now).allowed === true);
  A._throttleClearAll();
}

/* ---- 5. the guarantees that were already right, pinned ----------------- */
{
  const { hash, salt } = A.hashPassword('correct horse battery');
  ok('the right password verifies', A.verifyPassword('correct horse battery', hash, salt));
  ok('the wrong one does not', !A.verifyPassword('correct horse batterz', hash, salt));
  ok('two identical passwords get different salts', A.hashPassword('same').salt !== A.hashPassword('same').salt);
  ok('a garbage stored hash is a failure, not a throw', A.verifyPassword('x', 'not-hex', salt) === false);
  ok('a null stored hash is a failure, not a throw', A.verifyPassword('x', null, salt) === false);

  const a = A.newSessionToken(), b = A.newSessionToken();
  ok('session tokens are unique', a.token !== b.token);
  ok('and the stored form is a hash, not the token', a.tokenHash !== a.token && a.tokenHash.length === 64);
  ok('the same token always hashes the same', A.hashToken(a.token) === a.tokenHash);

  ok('csrf rejects a missing cookie', A.csrfOk('', 'tok') === false);
  ok('csrf rejects a missing form field', A.csrfOk('tok', '') === false);
  ok('csrf rejects a mismatch', A.csrfOk('tok-aaaa', 'tok-bbbb') === false);
  ok('csrf accepts a match', A.csrfOk('tok-aaaa', 'tok-aaaa') === true);
  ok('csrf of different lengths does not throw', A.csrfOk('short', 'much-longer-value') === false);

  const c = A.cookieHeader('nst_session', 'v', { maxAge: 1000, secure: true });
  ok('the session cookie is HttpOnly', /HttpOnly/.test(c));
  ok('the session cookie is SameSite=Strict', /SameSite=Strict/.test(c));
  ok('Secure is set when the request was https', /Secure/.test(c));
  ok('Secure is omitted on plain http, or the cookie would never be sent',
    !/Secure/.test(A.cookieHeader('nst_session', 'v', { maxAge: 1000, secure: false })));
  const gone = A.cookieHeader('nst_session', '', { expire: true });
  ok('signing out expires the cookie', /Max-Age=0/.test(gone) && /Expires=Thu, 01 Jan 1970/.test(gone));

  ok('root is a reserved username at signup', /=== 'root'\) return back\('That username is reserved/.test(read('server', 'server.mjs')));
  ok('a username cannot contain a path separator', !A.validateUsername('a/b').ok && !A.validateUsername('a\\b').ok);
  ok('nor a space or a quote', !A.validateUsername('a b').ok && !A.validateUsername("a'b").ok);
  ok('a two-character username is refused', !A.validateUsername('ab').ok);
  ok('a 33-character username is refused', !A.validateUsername('a'.repeat(33)).ok);
  ok('an ordinary one is accepted', A.validateUsername('jason.s_1-x').ok);
  ok('a 7-character password is refused', !A.validatePassword('1234567').ok);
  ok('an 8-character one is accepted', A.validatePassword('12345678').ok);
  ok('a password equal to the username is refused', !A.validatePassword('JasonJason', 'jasonjason').ok);
  ok('a 201-character password is refused', !A.validatePassword('x'.repeat(201)).ok);
}

console.log('\n' + (fail ? `AUTH: ${fail} FAILED (${pass} passed)` : `AUTH: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
