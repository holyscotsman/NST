/* app.mjs — the NST account system as a web-standard request handler, for Netlify Functions.
 *
 * server/server.mjs is the same product as a Node http server backed by one SQLite file, for hosting on a VM.
 * This is the same behaviour for Netlify: `Request` in, `Response` out, Postgres behind it. It deliberately
 * reuses server/auth.mjs (scrypt, session tokens, CSRF, cookies, validation) and server/pages.mjs (every page)
 * so the two cannot drift apart on anything that matters for security or wording.
 *
 * What is different, and why:
 *   - Public with optional sign-in. Anyone can use the tools and keep progress in their browser; an account
 *     saves it to the database. Only /ncm-practice/ is gated (netlify/edge-functions/ncm-gate.mjs).
 *   - There is no first-run default root password. The first administrator is created once, at /setup, with a
 *     secret token that lives in the Netlify environment.
 *   - Sign-in throttling is in the database (nst_throttle): serverless instances share no memory.
 *   - Lax cookies: people arrive from links in other sites, and a Strict cookie would show them as signed out
 *     on that first page.
 *   - No backup download or self-update: the data is in Netlify Database and a new version is a deploy.
 *
 * createApp({ store, env, version }) -> async (request, { ip }) => Response
 */
import * as A from '../../server/auth.mjs';
import * as P from '../../server/pages.mjs';

const COOKIE = 'nst_session';
const CSRF_COOKIE = 'nst_csrf';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;           // 30 days, sliding
const MAX_PROGRESS_BYTES = 2 * 1024 * 1024;

const SECURITY = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function createApp({ store, env = () => undefined, version = '' } = {}) {
  const allowSignup = () => env('NST_ALLOW_SIGNUP') !== '0';

  const html = (status, body, headers = {}) => new Response(body, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY, ...headers },
  });
  const json = (status, obj, headers = {}) => new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY, ...headers },
  });
  /* Several Set-Cookie headers on one response need Headers.append, which a plain object cannot express. */
  const redirect = (location, cookies = []) => {
    const h = new Headers({ Location: location, 'Cache-Control': 'no-store', ...SECURITY });
    for (const c of cookies) h.append('Set-Cookie', c);
    return new Response(null, { status: 303, headers: h });
  };

  /* Only ever a same-site path: "/ncm-practice/", never "//evil.example" or "https://...". */
  const safeNext = (v) => {
    const s = String(v || '');
    return /^\/(?![/\\])[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#]*$/.test(s) && s.length < 300 ? s : '';
  };

  async function parseForm(request, limit = 64 * 1024) {
    const text = await request.text();
    if (text.length > limit) return {};
    const out = Object.create(null);
    for (const [k, v] of new URLSearchParams(text)) out[k] = v;
    return out;
  }

  return async function handle(request, { ip = 'unknown' } = {}) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method;
    const secure = url.protocol === 'https:';
    const cookies = A.parseCookies(request.headers.get('cookie'));
    const cookieOpts = (extra) => ({ secure, sameSite: 'Lax', ...extra });

    /* ---- who is this? ---- */
    let sess = null;
    if (cookies[COOKIE]) {
      const tokenHash = A.hashToken(cookies[COOKIE]);
      const row = await store.getSessionUser(tokenHash);
      if (row) {
        sess = { tokenHash, user: row };
        if (row.expires_at - Date.now() < SESSION_TTL - 60 * 60 * 1000) await store.touchSession(tokenHash, SESSION_TTL);
      }
    }
    const me = sess && sess.user;

    /* ---- CSRF: a double-submit cookie, minted on demand ---- */
    let csrfToken = cookies[CSRF_COOKIE];
    const newCookies = [];
    const ensureCsrf = () => {
      if (!csrfToken) {
        csrfToken = A.newCsrfToken();
        newCookies.push(A.cookieHeader(CSRF_COOKIE, csrfToken, cookieOpts({ sameSite: 'Strict' })).replace(/; HttpOnly/, ''));
      }
      return csrfToken;
    };
    const csrfValid = (form) => A.csrfOk(cookies[CSRF_COOKIE], form && form.csrf);
    const withCsrfCookie = (res) => { for (const c of newCookies) res.headers.append('Set-Cookie', c); return res; };

    /* ---- first-run: create the administrator ---- */
    if (path === '/setup') {
      const token = env('NST_SETUP_TOKEN');
      if (!token || (await store.countRoots()) > 0) return html(404, P.errorPage(404, 'Nothing here.'));
      const csrf = ensureCsrf();
      if (method === 'GET') return withCsrfCookie(html(200, P.setupPage({ csrf, minPassword: A.MIN_PASSWORD })));
      if (method === 'POST') {
        const form = await parseForm(request);
        const back = (error, status = 400) => withCsrfCookie(html(status, P.setupPage({ csrf, error, minPassword: A.MIN_PASSWORD })));
        const key = 'setup|' + ip;
        const gate = await store.throttleCheck(key);
        if (!gate.allowed) return back('Too many attempts. Try again later.', 429);
        if (!csrfValid(form)) return back('Your form expired. Try again.');
        // Compare the token in constant time, and count every wrong guess.
        if (!A.csrfOk(token, form.token)) { await store.throttleFail(key); return back('That setup token is not right.', 403); }
        const u = A.validateUsername(form.username);
        if (!u.ok) return back(u.error);
        const p = A.validatePassword(form.password, u.value);
        if (!p.ok) return back(p.error);
        if (form.password !== form.password2) return back('Those passwords do not match.');
        if (await store.getUserByName(u.value)) return back('That username is already taken.');
        const { hash, salt } = A.hashPassword(p.value);
        const user = await store.createUser({ username: u.value, displayName: u.value, passHash: hash, passSalt: salt, role: 'root' });
        await store.audit(user.username, 'setup', ip);
        return redirect('/login?created=1');
      }
    }

    /* ---- sign in ---- */
    if (path === '/login') {
      const next = safeNext(url.searchParams.get('next'));
      if (me) return redirect(next || '/');
      const csrf = ensureCsrf();
      if (method === 'GET') {
        return withCsrfCookie(html(200, P.loginPage({
          csrf, allowSignup: allowSignup(), next,
          notice: url.searchParams.get('created') ? 'Account created — sign in to start.' : '',
          error: url.searchParams.get('expired') ? 'Your session expired. Please sign in again.' : '',
        })));
      }
      if (method === 'POST') {
        const form = await parseForm(request);
        const fnext = safeNext(form.next);
        const page = (status, extra) => withCsrfCookie(html(status, P.loginPage({ csrf, allowSignup: allowSignup(), next: fnext, ...extra })));
        if (!csrfValid(form)) return page(400, { error: 'Your sign-in form expired. Try again.' });
        const username = String(form.username || '').trim();
        const key = ip + '|' + username.toLowerCase();
        const ipKey = 'login-ip|' + ip;
        // Two gates: one per account being guessed at, one per address (a bot inventing a new name every
        // time never repeats the first key).
        const gate = (await store.throttleCheck(ipKey)).allowed ? await store.throttleCheck(key) : await store.throttleCheck(ipKey);
        if (!gate.allowed) {
          const mins = Math.ceil(gate.retryAfterMs / 60000);
          return page(429, { username, error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` });
        }
        const user = await store.getUserByName(username);
        // A missing or disabled user must still cost a real scrypt, or the reply time says who has an account.
        const good = (user && !user.disabled) ? A.verifyPassword(form.password, user.pass_hash, user.pass_salt) : A.absorbPassword(form.password);
        if (!good) {
          await store.throttleFail(key);
          await store.throttleFail(ipKey, Date.now(), A.MAX_ATTEMPTS_PER_IP);
          await store.audit(username || null, 'login-failed', ip);
          return page(401, { username, error: 'That username and password do not match.' });
        }
        await store.throttleReset(key);
        await store.throttleReset(ipKey);
        const { token, tokenHash } = A.newSessionToken();
        await store.createSession(tokenHash, user.id, SESSION_TTL, request.headers.get('user-agent'));
        await store.touchLogin(user.id);
        await store.audit(user.username, 'login', ip);
        return redirect(user.must_change ? '/account/password' : (fnext || '/'),
          [A.cookieHeader(COOKIE, token, cookieOpts({ maxAge: SESSION_TTL }))]);
      }
    }

    /* ---- create an account ---- */
    if (path === '/signup') {
      const next = safeNext(url.searchParams.get('next'));
      if (me) return redirect(next || '/');
      if (!allowSignup()) return html(403, P.errorPage(403, 'New accounts are closed. Ask an administrator for one.'));
      const csrf = ensureCsrf();
      if (method === 'GET') return withCsrfCookie(html(200, P.signupPage({ csrf, minPassword: A.MIN_PASSWORD, next })));
      if (method === 'POST') {
        const form = await parseForm(request);
        const fnext = safeNext(form.next);
        const back = (error, status = 400) => withCsrfCookie(html(status, P.signupPage({
          csrf, error, username: form.username, displayName: form.displayName, minPassword: A.MIN_PASSWORD, next: fnext })));
        // Sign-up is the unthrottled door otherwise: every POST runs a slow scrypt and writes a row.
        const sKey = 'signup|' + ip;
        const sGate = await store.throttleCheck(sKey);
        if (!sGate.allowed) {
          const mins = Math.ceil(sGate.retryAfterMs / 60000);
          return back(`Too many sign-up attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`, 429);
        }
        await store.throttleFail(sKey);
        if (!csrfValid(form)) return back('Your form expired. Try again.');
        const u = A.validateUsername(form.username);
        if (!u.ok) return back(u.error);
        if (u.value.toLowerCase() === 'root') return back('That username is reserved.');
        const p = A.validatePassword(form.password, u.value);
        if (!p.ok) return back(p.error);
        if (form.password !== form.password2) return back('Those passwords do not match.');
        if (await store.getUserByName(u.value)) return back('That username is already taken.');
        const { hash, salt } = A.hashPassword(p.value);
        let user;
        try {
          user = await store.createUser({ username: u.value, displayName: String(form.displayName || '').slice(0, 60), passHash: hash, passSalt: salt, role: 'user' });
        } catch (e) {
          if (e && e.code === '23505') return back('That username is already taken.');   // lost a race to the unique index
          throw e;
        }
        await store.audit(user.username, 'signup', ip);
        return redirect('/login?created=1' + (fnext ? '&next=' + encodeURIComponent(fnext) : ''));
      }
    }

    /* ---- sign out ---- */
    if (path === '/logout' && method === 'POST') {
      const form = await parseForm(request, 16 * 1024);
      // A forged request (no valid CSRF token) must not sign anyone out, in the database OR by clearing their cookie.
      if (!csrfValid(form)) return redirect(me ? '/' : '/login');
      if (sess) {
        await store.deleteSession(sess.tokenHash);
        await store.audit(me.username, 'logout', null);
      }
      return redirect('/login', [A.cookieHeader(COOKIE, '', cookieOpts({ expire: true }))]);
    }

    /* ---- the JSON API the shared sync module talks to ---- */
    if (path === '/api/me' && method === 'GET') {
      if (!me) return json(401, { error: 'not signed in', accounts: true, signup: allowSignup() });
      return json(200, { id: me.id, username: me.username, displayName: me.display_name, role: me.role, serverBacked: true });
    }

    /* ---- everything below needs an account ---- */
    if (!me) {
      if (path.startsWith('/api/')) return json(401, { error: 'not signed in' });
      return redirect('/login?next=' + encodeURIComponent(path + url.search));
    }

    if (path === '/account/password') {
      const csrf = ensureCsrf();
      const forced = !!me.must_change;
      if (method === 'GET') return withCsrfCookie(html(200, P.changePasswordPage({ csrf, forced, minPassword: A.MIN_PASSWORD })));
      if (method === 'POST') {
        const form = await parseForm(request);
        const back = (error) => withCsrfCookie(html(400, P.changePasswordPage({ csrf, error, forced, minPassword: A.MIN_PASSWORD })));
        if (!csrfValid(form)) return back('Your form expired. Try again.');
        if (!A.verifyPassword(form.current, me.pass_hash, me.pass_salt)) {
          await store.audit(me.username, 'password-change-failed', ip);
          return back('Your current password is not right.');
        }
        const p = A.validatePassword(form.password, me.username);
        if (!p.ok) return back(p.error);
        if (form.password !== form.password2) return back('Those passwords do not match.');
        const { hash, salt } = A.hashPassword(p.value);
        await store.setPassword(me.id, hash, salt, 0);
        // every OTHER session ends; this one carries on
        await store.deleteUserSessions(me.id);
        const { token, tokenHash } = A.newSessionToken();
        await store.createSession(tokenHash, me.id, SESSION_TTL, request.headers.get('user-agent'));
        await store.audit(me.username, 'password-changed', null);
        return redirect(me.role === 'root' ? '/admin' : '/', [A.cookieHeader(COOKIE, token, cookieOpts({ maxAge: SESSION_TTL }))]);
      }
    }

    if (me.must_change && path !== '/account/password') {
      if (path.startsWith('/api/')) return json(403, { error: 'password change required' });
      return redirect('/account/password');
    }

    /* ---- per-account progress: an opaque blob (the shared backup envelope) ---- */
    if (path === '/api/progress') {
      if (method === 'GET') {
        const row = await store.getProgress(me.id);
        if (!row) return json(200, { updatedAt: 0, data: null });
        return json(200, { updatedAt: row.updated_at, data: JSON.parse(row.blob) });
      }
      if (method === 'PUT' || method === 'POST') {
        let body;
        try { body = await readProgressBody(request); }
        catch (e) {
          return e && e.status === 415 ? json(415, { error: 'that content encoding is not supported' })
            : json(413, { error: 'that progress payload is too large' });
        }
        let parsed;
        try { parsed = JSON.parse(body); } catch { return json(400, { error: 'not valid JSON' }); }
        if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
          return json(400, { error: 'not a progress envelope' });
        }
        await store.putProgress(me.id, JSON.stringify(parsed));
        return json(200, { ok: true, updatedAt: Date.now() });
      }
      if (method === 'DELETE') {
        await store.clearProgress(me.id);
        await store.audit(me.username, 'progress-cleared', null);
        return json(200, { ok: true });
      }
    }

    /* ---- administrator console ---- */
    if (path === '/admin' || path.startsWith('/admin/')) {
      if (me.role !== 'root') return html(403, P.errorPage(403, 'That page is for administrators.'));
      const csrf = ensureCsrf();
      if (path === '/admin' && method === 'GET') {
        return withCsrfCookie(html(200, P.adminPage({
          me, users: await store.listUsers(), csrf, version, hosted: 'Netlify',
          defaultRootPassword: false, audit: await store.recentAudit(25),
          notice: url.searchParams.get('done') || '', error: url.searchParams.get('err') || '',
        })));
      }
      if (method === 'POST') {
        const form = await parseForm(request);
        const toAdmin = (k, m) => withCsrfCookie(redirect('/admin?' + k + '=' + encodeURIComponent(m)));
        if (!csrfValid(form)) return toAdmin('err', 'Your form expired. Try again.');
        const target = await store.getUserById(Number(form.id));
        if (!target) return toAdmin('err', 'That account no longer exists.');
        if (target.id === me.id) return toAdmin('err', 'Use "Change password" for your own account.');
        const action = path.slice('/admin/'.length);
        // Losing every administrator would lock the site out of administration for good.
        const wouldStrand = target.role === 'root' && (await store.countRoots()) <= 1;
        switch (action) {
          case 'reset': {
            const temp = 'nst-' + A.newCsrfToken().replace(/[^a-z0-9]/gi, '').slice(0, 10).toLowerCase();
            const { hash, salt } = A.hashPassword(temp);
            await store.setPassword(target.id, hash, salt, 1);
            await store.deleteUserSessions(target.id);
            await store.audit(me.username, 'password-reset', target.username);
            return toAdmin('done', `Temporary password for ${target.username}: ${temp} — they must change it at sign-in.`);
          }
          case 'disable':
            if (wouldStrand) return toAdmin('err', 'That is the only root account.');
            await store.setDisabled(target.id, 1);
            await store.audit(me.username, 'disabled', target.username);
            return toAdmin('done', `${target.username} is disabled and signed out.`);
          case 'enable':
            await store.setDisabled(target.id, 0);
            await store.audit(me.username, 'enabled', target.username);
            return toAdmin('done', `${target.username} can sign in again.`);
          case 'promote':
            await store.setRole(target.id, 'root');
            await store.audit(me.username, 'promoted', target.username);
            return toAdmin('done', `${target.username} is now an administrator.`);
          case 'demote':
            if (wouldStrand) return toAdmin('err', 'That is the only root account.');
            await store.setRole(target.id, 'user');
            await store.audit(me.username, 'demoted', target.username);
            return toAdmin('done', `${target.username} is now a normal user.`);
          case 'delete':
            if (wouldStrand) return toAdmin('err', 'That is the only root account.');
            await store.deleteUser(target.id);
            await store.audit(me.username, 'deleted', target.username);
            return toAdmin('done', `${target.username} and their progress were deleted.`);
          default:
            return toAdmin('err', 'Unknown action.');
        }
      }
    }

    return html(404, P.errorPage(404, 'That page does not exist.'));
  };
}

/* The shared sync module sends the progress envelope gzipped. Decide by the gzip magic bytes rather than the
   header: a CDN may already have inflated it, and a body that claims gzip but is not should not be a 500. */
async function readProgressBody(request) {
  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.length > MAX_PROGRESS_BYTES) { const e = new Error('too large'); e.status = 413; throw e; }
  const enc = (request.headers.get('content-encoding') || '').toLowerCase();
  if (enc && !/^(gzip|identity)$/.test(enc)) { const e = new Error('encoding'); e.status = 415; throw e; }
  if (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    const ds = new DecompressionStream('gzip');
    const w = ds.writable.getWriter(); w.write(buf).catch(() => {}); w.close().catch(() => {});
    const reader = ds.readable.getReader();
    const parts = []; let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_PROGRESS_BYTES) { try { await reader.cancel(); } catch { /* already done */ } const e = new Error('too large'); e.status = 413; throw e; }
      parts.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(parts));
  }
  return new TextDecoder().decode(buf);
}
