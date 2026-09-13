/* server.mjs — serves the Nutanix Study Tool from a VM, behind a login, with
 * per-account progress in one SQLite file. Zero npm dependencies: node:http,
 * node:sqlite, node:crypto, node:fs.
 *
 *   node server/server.mjs
 *
 * Environment (all optional):
 *   NST_PORT           port to listen on            (default 8080)
 *   NST_HOST           address to bind              (default 0.0.0.0)
 *   NST_DB             database file                (default server/data/nst.db)
 *   NST_ROOT_PASSWORD  root's password on FIRST RUN (default "nutanix")
 *   NST_ALLOW_SIGNUP   "0" to close self-registration
 *   NST_TRUST_PROXY    "1" to read X-Forwarded-For / -Proto (only behind one)
 *   NST_TRUST_PROXY_HOPS  how many proxies are in front (default 1)
 *   NST_TRUST_PROXY_FROM  comma-separated proxy addresses allowed to forward
 *
 * The site itself is unchanged: the same static files are served, and the app
 * keeps using localStorage as its working store. A small client module
 * (shared/nst-sync.js) mirrors that store to the account, so progress follows
 * the person rather than the browser.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync, statSync, createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { resolveWithin } from './safe-path.mjs';
import { fileURLToPath } from 'node:url';
import { gunzipSync, inflateSync } from 'node:zlib';
import * as DB from './db.mjs';
import * as A from './auth.mjs';
import * as P from './pages.mjs';
import * as U from './update.mjs';
import * as Z from './compress.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(HERE, '..');                       // the repo: what we serve
const PORT = Number(process.env.NST_PORT || 8080);
const HOST = process.env.NST_HOST || '0.0.0.0';
const DB_FILE = process.env.NST_DB || join(HERE, 'data', 'nst.db');
const DEFAULT_ROOT_PASSWORD = 'nutanix';
const ALLOW_SIGNUP = process.env.NST_ALLOW_SIGNUP !== '0';
const TRUST_PROXY = process.env.NST_TRUST_PROXY === '1';
/* How many reverse proxies sit in front. Only meaningful with TRUST_PROXY, and
 * it decides how far from the RIGHT of X-Forwarded-For the real client address
 * is -- see forwardedEntry. Anything unparseable or below 1 means 1, the
 * single-proxy case; there is no configuration in which reading the left-hand
 * entry is correct, so none is offered. */
const TRUST_PROXY_HOPS = Math.max(1, Math.floor(Number(process.env.NST_TRUST_PROXY_HOPS) || 1));
/* Which peers are allowed to speak for someone else. Reading the right-hand
 * entry is correct only when a proxy actually wrote it; if the app is ALSO
 * reachable directly -- a second binding, a LAN shortcut past the proxy -- a
 * client connecting that way has the whole header to itself again. Listing the
 * proxy's address here makes the trust conditional on who connected, which is
 * the one thing a client cannot forge. Empty (the default) trusts any peer, so
 * an existing deployment behaves exactly as before. */
const TRUST_PROXY_FROM = String(process.env.NST_TRUST_PROXY_FROM || '')
  .split(',').map((v) => v.trim()).filter(Boolean);
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;           // 30 days, sliding
const MAX_BODY = 8 * 1024 * 1024;                       // a progress blob, generously
const COOKIE = 'nst_session';
const CSRF_COOKIE = 'nst_csrf';

const db = DB.openDb(DB_FILE);

/* ---- first run: make sure a root account exists ---------------------- */

let rootUsesDefaultPassword = false;
(function ensureRoot() {
  const existing = DB.getUserByName(db, 'root');
  const configured = process.env.NST_ROOT_PASSWORD || DEFAULT_ROOT_PASSWORD;
  if (!existing) {
    const { hash, salt } = A.hashPassword(configured);
    DB.createUser(db, {
      username: 'root', displayName: 'Root', passHash: hash, passSalt: salt, role: 'root',
    });
    DB.audit(db, 'system', 'root-created', null);
    console.log('  Created the root account.');
  }
  // Whether root still uses the well-known default is worth knowing at a glance;
  // it drives the banner on the admin page and the note at startup.
  const root = DB.getUserByName(db, 'root');
  rootUsesDefaultPassword = !!root && A.verifyPassword(DEFAULT_ROOT_PASSWORD, root.pass_hash, root.pass_salt);
})();

setInterval(() => { try { DB.purgeExpiredSessions(db); } catch { /* not fatal */ } }, 60 * 60 * 1000).unref();

/* ---- helpers --------------------------------------------------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8', '.map': 'application/json; charset=utf-8',
};

/* READING A FORWARDED HEADER FROM THE RIGHT, NOT THE LEFT
 *
 * `X-Forwarded-For: a, b, c` is built left to right: whatever the CLIENT sent
 * comes first, and each proxy APPENDS the address it received the connection
 * from. So the leftmost entry is not the client's address -- it is a string the
 * client chose, and reading it hands the client control of every decision made
 * from it.
 *
 * That is not theoretical. Both login gates key on this value, and with
 * NST_TRUST_PROXY=1 (which server/README.md recommends for any deployment past
 * a trusted LAN) a single socket rotating the header never tripped either one:
 *
 *     fine gate  (one username, rotating X-Forwarded-For)   locked after NEVER
 *     coarse gate(70 usernames, rotating X-Forwarded-For)   locked after NEVER
 *
 * versus 9 and 61 attempts without the header. Unlimited password guesses at
 * `root`, and unlimited account enumeration, from one connection.
 *
 * The only entry this server did not take on the client's word is the one the
 * trusted proxy appended itself -- at the RIGHT-hand end. With N proxies in
 * front, the last N entries were written by them and everything left of that is
 * the client's; the address that reached the first trusted proxy is therefore
 * the Nth from the right. NST_TRUST_PROXY_HOPS says how many N is; it defaults
 * to 1, the single-reverse-proxy case the README describes.
 *
 * A header with fewer entries than that was not written by the proxies claimed,
 * so it is not used at all: the socket address is always a true statement about
 * who connected, and falling back to it can only ever tighten a limit. */
/* IPv4-mapped IPv6 ("::ffff:10.0.0.5") is how Node reports a v4 peer on a
 * dual-stack socket; an operator writing the proxy's address means the v4 one. */
function peerTrusted(req) {
  if (!TRUST_PROXY_FROM.length) return true;
  const peer = String(req.socket.remoteAddress || '');
  const bare = peer.replace(/^::ffff:/, '');
  return TRUST_PROXY_FROM.indexOf(peer) !== -1 || TRUST_PROXY_FROM.indexOf(bare) !== -1;
}

function forwardedEntry(req, header) {
  if (!peerTrusted(req)) return null;
  const raw = req.headers[header];
  if (!raw) return null;
  const parts = String(raw).split(',').map((v) => v.trim()).filter(Boolean);
  // Nth from the right. Too few entries means the header is not what the
  // configured topology would have produced -- ignore it rather than guess.
  if (parts.length < TRUST_PROXY_HOPS) return null;
  return parts[parts.length - TRUST_PROXY_HOPS];
}

function isHttps(req) {
  if (TRUST_PROXY) {
    const proto = forwardedEntry(req, 'x-forwarded-proto');
    // Only an affirmative "https" from the proxy downgrades nothing. A client
    // that prepends "http" must not be able to strip Secure off the session
    // cookie, which is what reading the left-hand entry allowed.
    if (proto) return proto.toLowerCase() === 'https';
  }
  return !!req.socket.encrypted;
}
function clientIp(req) {
  if (TRUST_PROXY) {
    const ip = forwardedEntry(req, 'x-forwarded-for');
    if (ip) return ip;
  }
  return req.socket.remoteAddress || 'unknown';
}

function send(res, code, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(code, {
    'Content-Length': buf.length,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // frame-ancestors is ignored when delivered in a <meta>, so the sign-in and
    // admin pages only get real clickjacking protection from a header.
    'Content-Security-Policy': "frame-ancestors 'none'",
    'X-Frame-Options': 'DENY',
    ...headers,
  });
  res.end(buf);
}
const sendHtml = (res, code, html, headers) =>
  send(res, code, html, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
const sendJson = (res, code, obj, headers) =>
  send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
const redirect = (res, to, headers = {}) => { res.writeHead(302, { Location: to, 'Cache-Control': 'no-store', ...headers }); res.end(); };

/* A gzipped request body, unpacked with a ceiling on what it may become.
 *
 * The progress envelope is JSON full of repeated record shapes, so it deflates
 * about twelvefold -- measured, eight certification banks studied: 391.5 KB of
 * JSON, 32.5 KB gzipped. That is what keeps the page-hide push inside the
 * browser's 64 KB keepalive cap as banks are added (see shared/nst-sync.js).
 *
 * `limit` alone does not cover this. It bounds the bytes ARRIVING, and a
 * compressed body's danger is what it becomes: a few hundred kilobytes of zeros
 * expand to gigabytes and take the process with them. So the decompressed size
 * is capped too, by the same number, and zlib stops at it rather than after. */
function inflateBody(buf, encoding, limit) {
  const enc = String(encoding || '').split(',')[0].trim().toLowerCase();
  if (!enc || enc === 'identity') return buf;
  if (enc !== 'gzip' && enc !== 'deflate') {
    const e = new Error('unsupported content encoding');
    e.statusCode = 415;
    throw e;
  }
  try {
    return enc === 'gzip'
      ? gunzipSync(buf, { maxOutputLength: limit })
      : inflateSync(buf, { maxOutputLength: limit });
  } catch (err) {
    // A body that expands past the ceiling, or simply is not what it claims.
    const e = new Error('body too large');
    e.statusCode = 413;
    throw e;
  }
}

async function readBody(req, limit = MAX_BODY) {
  const raw = await new Promise((ok, fail) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { fail(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks)));
    req.on('error', fail);
  });
  return inflateBody(raw, req.headers['content-encoding'], limit);
}
function parseForm(buf) {
  const out = {};
  new URLSearchParams(buf.toString('utf8')).forEach((v, k) => { out[k] = v; });
  return out;
}

/* ---- session --------------------------------------------------------- */

function currentUser(req) {
  const cookies = A.parseCookies(req.headers.cookie);
  const token = cookies[COOKIE];
  if (!token) return null;
  const sess = DB.getSession(db, A.hashToken(token));
  if (!sess) return null;
  const user = DB.getUserById(db, sess.user_id);
  if (!user || user.disabled) return null;
  // Sliding expiry, but only rewrite when it has aged a while — no need to touch
  // the database on every single request.
  if (sess.expires_at - Date.now() < SESSION_TTL - 60 * 60 * 1000) {
    DB.touchSession(db, sess.token_hash, SESSION_TTL);
  }
  return { user, tokenHash: sess.token_hash };
}

function ensureCsrf(req, res) {
  const cookies = A.parseCookies(req.headers.cookie);
  let token = cookies[CSRF_COOKIE];
  if (!token) {
    token = A.newCsrfToken();
    // Readable by script is fine: this is a double-submit token, not a secret
    // session. It only has to be un-guessable by a cross-origin page.
    res.setHeader('Set-Cookie', [
      ...(res.getHeader('Set-Cookie') || []),
      `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Strict${isHttps(req) ? '; Secure' : ''}`,
    ]);
  }
  return token;
}
function csrfValid(req, form) {
  const cookies = A.parseCookies(req.headers.cookie);
  return A.csrfOk(cookies[CSRF_COOKIE], form && form.csrf);
}

/* ---- static ---------------------------------------------------------- */

// Anything needed to RENDER the login and signup pages must be public, or the
// sign-in screen would depend on being signed in.
const PUBLIC_PREFIXES = ['/shared/fonts.css', '/shared/fonts/'];

/* The repo IS the served directory, so anything in it is reachable unless we say
 * otherwise. server/ (the SQLite database -- password hashes, live sessions,
 * everyone's progress), .git/, .github/ and node_modules/ never are.
 *
 * The rules live in ./safe-path.mjs, applied to the RESOLVED path rather than the
 * URL text, and written with POSIX semantics because a URL is not a filesystem
 * path. That distinction is not pedantry: the first version used
 * path.normalize(), which returns backslash-separated paths on Windows, so every
 * denylist entry silently stopped matching there while Linux tests stayed green.
 * scripts/path-guard-test.mjs now exercises both platforms' semantics on Linux.
 */

async function serveStatic(req, res, urlPath) {
  // One call: canonicalises the URL, refuses anything denied or malformed, and
  // guarantees the result is inside ROOT. null means "answer 404" -- the same
  // reply a missing file gets, so probing cannot distinguish the two.
  let full = resolveWithin(ROOT, urlPath);
  if (!full) return sendHtml(res, 404, P.errorPage(404, "That page isn't here."));
  try {
    let st = await stat(full).catch(() => null);
    if (st && st.isDirectory()) {
      full = join(full, 'index.html');
      st = await stat(full).catch(() => null);
    }
    if (!st || !st.isFile()) return sendHtml(res, 404, P.errorPage(404, "That page isn't here."));
    const ext = extname(full).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const baseEtag = `W/"${st.size}-${Number(st.mtimeMs).toString(36)}"`;

    // Negotiate the encoding BEFORE answering a conditional request: the ETag
    // is per-encoding, so a client holding the brotli copy must be compared
    // against the brotli tag, not the identity one.
    const wanted = Z.isCompressible(type, st.size) ? Z.pickEncoding(req.headers['accept-encoding']) : null;
    const etag = Z.taggedEtag(baseEtag, wanted);

    // Vary goes on the 304 too, or a shared cache learns the wrong thing from it.
    const varyHdr = Z.isCompressible(type, st.size) ? { Vary: 'Accept-Encoding' } : {};
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, ...varyHdr });
      return res.end();
    }

    const body = await readFile(full);
    // The HTML entry points must revalidate so a redeploy is picked up; the heavy
    // immutable-ish assets can sit in cache for a while.
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';
    const packed = wanted ? await Z.encode(body, wanted, `${full}:${st.mtimeMs}`) : null;
    send(res, 200, packed || body, {
      'Content-Type': type,
      'Cache-Control': cache,
      ETag: packed ? etag : baseEtag,
      ...varyHdr,
      ...(packed ? { 'Content-Encoding': wanted } : {}),
    });
  } catch {
    sendHtml(res, 500, P.errorPage(500, 'Something went wrong reading that file.'));
  }
}

/* ---- routes ---------------------------------------------------------- */

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const method = req.method || 'GET';
  const sess = currentUser(req);
  const me = sess && sess.user;
  const secure = isHttps(req);

  /* --- public: sign in --- */
  if (path === '/login') {
    if (me) return redirect(res, '/');
    const csrf = ensureCsrf(req, res);
    if (method === 'GET') {
      return sendHtml(res, 200, P.loginPage({
        csrf, allowSignup: ALLOW_SIGNUP,
        notice: url.searchParams.get('created') ? 'Account created — sign in to start.' : '',
        error: url.searchParams.get('expired') ? 'Your session expired. Please sign in again.' : '',
      }));
    }
    if (method === 'POST') {
      const form = parseForm(await readBody(req, 64 * 1024));
      if (!csrfValid(req, form)) return sendHtml(res, 400, P.loginPage({ csrf, error: 'Your sign-in form expired. Try again.', allowSignup: ALLOW_SIGNUP }));
      const username = String(form.username || '').trim();
      const ip = clientIp(req);
      const key = ip + '|' + username.toLowerCase();
      // Two gates. The fine one stops someone working through passwords for a
      // known account; the coarse one stops someone working through ACCOUNTS,
      // which the fine key cannot see at all because it never repeats.
      const ipKey = 'login-ip|' + ip;
      const gate = A.throttleCheck(ipKey).allowed ? A.throttleCheck(key) : A.throttleCheck(ipKey);
      if (!gate.allowed) {
        const mins = Math.ceil(gate.retryAfterMs / 60000);
        return sendHtml(res, 429, P.loginPage({ csrf, username, allowSignup: ALLOW_SIGNUP,
          error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }));
      }
      const user = DB.getUserByName(db, username);
      // No user, or a disabled one, must still cost what a real check costs --
      // otherwise the reply time says which usernames exist. See absorbPassword.
      const good = (user && !user.disabled)
        ? A.verifyPassword(form.password, user.pass_hash, user.pass_salt)
        : A.absorbPassword(form.password);
      if (!good) {
        A.throttleFail(key);
        A.throttleFail(ipKey, Date.now(), A.MAX_ATTEMPTS_PER_IP);
        DB.audit(db, username || null, 'login-failed', ip);
        // One message for every failure: telling someone which half was wrong
        // hands them a way to enumerate valid usernames.
        return sendHtml(res, 401, P.loginPage({ csrf, username, allowSignup: ALLOW_SIGNUP,
          error: 'That username and password do not match.' }));
      }
      A.throttleReset(key);
      A.throttleReset(ipKey);                     // a real sign-in clears the address too
      const { token, tokenHash } = A.newSessionToken();
      DB.createSession(db, tokenHash, user.id, SESSION_TTL, req.headers['user-agent']);
      DB.touchLogin(db, user.id);
      DB.audit(db, user.username, 'login', ip);
      return redirect(res, user.must_change ? '/account/password' : '/', {
        'Set-Cookie': A.cookieHeader(COOKIE, token, { maxAge: SESSION_TTL, secure }),
      });
    }
  }

  /* --- public: create account --- */
  if (path === '/signup') {
    if (me) return redirect(res, '/');
    if (!ALLOW_SIGNUP) return sendHtml(res, 403, P.errorPage(403, 'New accounts are closed on this server. Ask an administrator for one.'));
    const csrf = ensureCsrf(req, res);
    if (method === 'GET') return sendHtml(res, 200, P.signupPage({ csrf, minPassword: A.MIN_PASSWORD }));
    if (method === 'POST') {
      const form = parseForm(await readBody(req, 64 * 1024));
      const back = (error) => sendHtml(res, 400, P.signupPage({
        csrf, error, username: form.username, displayName: form.displayName, minPassword: A.MIN_PASSWORD,
      }));
      /* Sign-up was the unthrottled door. Every POST ran a deliberately slow
       * scrypt and wrote a row, so a loop against it pinned the CPU and grew the
       * database without limit -- and "That username is already taken" told the
       * same loop which accounts exist. Rate-limit it per address, before any of
       * the work, and count every attempt rather than only the failures: the
       * thing being capped here is how fast accounts can be created. */
      const sKey = 'signup|' + clientIp(req);
      const sGate = A.throttleCheck(sKey);
      if (!sGate.allowed) {
        const mins = Math.ceil(sGate.retryAfterMs / 60000);
        return sendHtml(res, 429, P.signupPage({ csrf, minPassword: A.MIN_PASSWORD,
          username: form.username, displayName: form.displayName,
          error: `Too many sign-up attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }));
      }
      A.throttleFail(sKey);
      if (!csrfValid(req, form)) return back('Your form expired. Try again.');
      const u = A.validateUsername(form.username);
      if (!u.ok) return back(u.error);
      if (u.value.toLowerCase() === 'root') return back('That username is reserved.');
      const p = A.validatePassword(form.password, u.value);
      if (!p.ok) return back(p.error);
      if (form.password !== form.password2) return back('Those passwords do not match.');
      if (DB.getUserByName(db, u.value)) return back('That username is already taken.');
      const { hash, salt } = A.hashPassword(p.value);
      const user = DB.createUser(db, {
        username: u.value, displayName: String(form.displayName || '').slice(0, 60),
        passHash: hash, passSalt: salt, role: 'user',
      });
      DB.audit(db, user.username, 'signup', clientIp(req));
      return redirect(res, '/login?created=1');
    }
  }

  /* --- sign out --- */
  if (path === '/logout' && method === 'POST') {
    const form = parseForm(await readBody(req, 16 * 1024));
    if (sess && csrfValid(req, form)) {
      DB.deleteSession(db, sess.tokenHash);
      DB.audit(db, me.username, 'logout', null);
    }
    return redirect(res, '/login', { 'Set-Cookie': A.cookieHeader(COOKIE, '', { expire: true, secure }) });
  }

  /* --- public assets the login page itself needs --- */
  if (!me && PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return serveStatic(req, res, path);
  }

  /* --- everything past here needs an account --- */
  if (!me) {
    if (path.startsWith('/api/')) return sendJson(res, 401, { error: 'not signed in' });
    return redirect(res, '/login');
  }

  /* --- change password (also the forced-reset landing) --- */
  if (path === '/account/password') {
    const csrf = ensureCsrf(req, res);
    if (method === 'GET') {
      return sendHtml(res, 200, P.changePasswordPage({ csrf, forced: !!me.must_change, minPassword: A.MIN_PASSWORD }));
    }
    if (method === 'POST') {
      const form = parseForm(await readBody(req, 64 * 1024));
      const back = (error) => sendHtml(res, 400, P.changePasswordPage({ csrf, error, forced: !!me.must_change, minPassword: A.MIN_PASSWORD }));
      if (!csrfValid(req, form)) return back('Your form expired. Try again.');
      if (!A.verifyPassword(form.current, me.pass_hash, me.pass_salt)) return back('Your current password is not right.');
      const p = A.validatePassword(form.password, me.username);
      if (!p.ok) return back(p.error);
      if (form.password !== form.password2) return back('Those new passwords do not match.');
      const { hash, salt } = A.hashPassword(p.value);
      DB.setPassword(db, me.id, hash, salt, 0);
      // Every other session for this account is now stale — a password change
      // should end them, keeping only the one doing the changing.
      DB.deleteUserSessions(db, me.id);
      const { token, tokenHash } = A.newSessionToken();
      DB.createSession(db, tokenHash, me.id, SESSION_TTL, req.headers['user-agent']);
      DB.audit(db, me.username, 'password-changed', null);
      if (me.username === 'root') {
        rootUsesDefaultPassword = A.verifyPassword(DEFAULT_ROOT_PASSWORD, hash, salt);
      }
      return redirect(res, me.role === 'root' ? '/admin' : '/', {
        'Set-Cookie': A.cookieHeader(COOKIE, token, { maxAge: SESSION_TTL, secure }),
      });
    }
  }

  // A forced reset means exactly that: nothing else is reachable until it is done.
  if (me.must_change && !path.startsWith('/shared/') && path !== '/account/password') {
    if (path.startsWith('/api/')) return sendJson(res, 403, { error: 'password change required' });
    return redirect(res, '/account/password');
  }

  /* --- who am I (for the client sync module) --- */
  if (path === '/api/me' && method === 'GET') {
    return sendJson(res, 200, {
      id: me.id, username: me.username, displayName: me.display_name, role: me.role,
      serverBacked: true,
    });
  }

  /* --- per-account progress ---
   * The payload is the same envelope shared/nst-backup.js already produces, so
   * the server never has to understand the study data -- it stores and returns
   * an opaque blob belonging to one account. */
  if (path === '/api/progress') {
    if (method === 'GET') {
      const row = DB.getProgress(db, me.id);
      if (!row) return sendJson(res, 200, { updatedAt: 0, data: null });
      return sendJson(res, 200, { updatedAt: row.updated_at, data: JSON.parse(row.blob) });
    }
    if (method === 'PUT' || method === 'POST') {
      let body;
      try { body = await readBody(req); }
      catch (e) {
        // 415 when the body claimed an encoding this server does not speak;
        // 413 when it was, or would become, too big. Saying which is the
        // difference between a client that can retry uncompressed and one that
        // keeps sending something that will never be accepted.
        return e && e.statusCode === 415
          ? sendJson(res, 415, { error: 'that content encoding is not supported' })
          : sendJson(res, 413, { error: 'that progress payload is too large' });
      }
      let parsed;
      try { parsed = JSON.parse(body.toString('utf8')); }
      catch { return sendJson(res, 400, { error: 'not valid JSON' }); }
      if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
        return sendJson(res, 400, { error: 'not a progress envelope' });
      }
      DB.putProgress(db, me.id, JSON.stringify(parsed));
      return sendJson(res, 200, { ok: true, updatedAt: Date.now() });
    }
    if (method === 'DELETE') {
      DB.clearProgress(db, me.id);
      DB.audit(db, me.username, 'progress-cleared', null);
      return sendJson(res, 200, { ok: true });
    }
  }

  /* --- root console --- */
  if (path === '/admin' || path.startsWith('/admin/')) {
    if (me.role !== 'root') return sendHtml(res, 403, P.errorPage(403, 'That page is for administrators.'));
    const csrf = ensureCsrf(req, res);

    if (path === '/admin' && method === 'GET') {
      return sendHtml(res, 200, P.adminPage({
        me, users: DB.listUsers(db), csrf,
        version: U.localVersion(ROOT), repo: U.REPO,
        defaultRootPassword: rootUsesDefaultPassword,
        audit: DB.recentAudit(db, 25),
        notice: url.searchParams.get('done') || '',
        error: url.searchParams.get('err') || '',
      }));
    }

    /* Update: root-only, CSRF-checked, and the download URL is a constant in
     * update.mjs -- nothing in the request chooses what gets installed. */
    /* Download a snapshot of the database.
     *
     * This is the only irreplaceable thing in the whole system -- everyone's
     * progress and every password hash -- and the documented alternative was
     * "stop the service and copy three files", which nobody does. POST with the
     * usual CSRF check, like every other admin action, and streamed rather than
     * buffered so a large database cannot be read into memory in one piece.
     */
    if (path === '/admin/backup' && method === 'POST') {
      const form = parseForm(await readBody(req, 16 * 1024));
      if (!csrfValid(req, form)) return redirect(res, '/admin?err=' + encodeURIComponent('Your form expired. Try again.'));
      const tmp = mkdtempSync(join(tmpdir(), 'nst-backup-'));
      const file = join(tmp, 'snapshot.db');
      const cleanup = () => { try { rmSync(tmp, { recursive: true, force: true }); } catch { /* temp dir */ } };
      try {
        DB.snapshotTo(db, file);
        const size = statSync(file).size;
        const d = new Date();
        const p2 = (n) => String(n).padStart(2, '0');
        const name = `nst-backup-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.db`;
        DB.audit(db, me.username, 'backup', `${(size / 1024).toFixed(0)} KB`);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.sqlite3',
          'Content-Length': size,
          'Content-Disposition': `attachment; filename="${name}"`,
          // It holds password hashes: never store it anywhere on the way.
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        });
        const stream = createReadStream(file);
        stream.on('error', () => { res.destroy(); cleanup(); });
        stream.on('close', cleanup);
        return stream.pipe(res);
      } catch (e) {
        cleanup();
        DB.audit(db, me.username, 'backup-failed', e && e.message ? e.message : String(e));
        return redirect(res, '/admin?err=' + encodeURIComponent(
          `Could not make a backup (${e && e.message ? e.message : e}).`));
      }
    }

    if (path === '/admin/update-check' && method === 'POST') {
      const form = parseForm(await readBody(req, 16 * 1024));
      if (!csrfValid(req, form)) return redirect(res, '/admin?err=' + encodeURIComponent('Your form expired. Try again.'));
      const r = await U.checkForUpdate(ROOT);
      if (!r.ok) return redirect(res, '/admin?err=' + encodeURIComponent(r.error));
      return redirect(res, '/admin?done=' + encodeURIComponent(
        r.updateAvailable
          ? `Version ${r.latest} is available (you have ${r.current}). Use "Install update" to apply it.`
          : `You are up to date (v${r.current}).`));
    }

    if (path === '/admin/update-apply' && method === 'POST') {
      const form = parseForm(await readBody(req, 16 * 1024));
      if (!csrfValid(req, form)) return redirect(res, '/admin?err=' + encodeURIComponent('Your form expired. Try again.'));
      const lines = [];
      const r = await U.applyUpdate(ROOT, { log: (m) => lines.push(m) });
      if (!r.ok) {
        DB.audit(db, me.username, 'update-failed', r.error);
        return redirect(res, '/admin?err=' + encodeURIComponent(r.error));
      }
      DB.audit(db, me.username, 'updated', `${r.from} -> ${r.to}`);
      // The new code is on disk but this process is still running the old one.
      // Exiting lets the service manager (NSSM, systemd) start it again; if the
      // server was started by hand there is nothing to restart it, which the
      // message says. Delay so this response actually reaches the browser.
      // Answer with the result page itself rather than a redirect: a redirect
      // would send the browser back for /admin inside the restart window, where
      // it would get a connection error instead of the outcome.
      setTimeout(() => { try { db.close(); } catch {} process.exit(0); }, 1200);
      return sendHtml(res, 200, P.updatedPage({ from: r.from, to: r.to, copied: r.copied }));
    }

    if (method === 'POST') {
      const form = parseForm(await readBody(req, 64 * 1024));
      if (!csrfValid(req, form)) return redirect(res, '/admin?err=' + encodeURIComponent('Your form expired. Try again.'));
      const target = DB.getUserById(db, Number(form.id));
      if (!target) return redirect(res, '/admin?err=' + encodeURIComponent('That account no longer exists.'));
      if (target.id === me.id) return redirect(res, '/admin?err=' + encodeURIComponent('Use "Change password" for your own account.'));
      const action = path.slice('/admin/'.length);
      const done = (m) => redirect(res, '/admin?done=' + encodeURIComponent(m));

      // Losing every root account would lock the server permanently, so the last
      // one standing cannot be deleted, disabled or demoted.
      const wouldStrandServer = (target.role === 'root' && DB.countRoots(db) <= 1);

      switch (action) {
        case 'reset': {
          const temp = 'nst-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
          const { hash, salt } = A.hashPassword(temp);
          DB.setPassword(db, target.id, hash, salt, 1);       // forces a change at next sign-in
          DB.deleteUserSessions(db, target.id);
          DB.audit(db, me.username, 'password-reset', target.username);
          return done(`Temporary password for ${target.username}: ${temp} — they must change it at sign-in.`);
        }
        case 'disable':
          if (wouldStrandServer) return redirect(res, '/admin?err=' + encodeURIComponent('That is the only root account.'));
          DB.setDisabled(db, target.id, 1);
          DB.audit(db, me.username, 'disabled', target.username);
          return done(`${target.username} is disabled and signed out.`);
        case 'enable':
          DB.setDisabled(db, target.id, 0);
          DB.audit(db, me.username, 'enabled', target.username);
          return done(`${target.username} can sign in again.`);
        case 'promote':
          DB.setRole(db, target.id, 'root');
          DB.audit(db, me.username, 'promoted', target.username);
          return done(`${target.username} is now an administrator.`);
        case 'demote':
          if (wouldStrandServer) return redirect(res, '/admin?err=' + encodeURIComponent('That is the only root account.'));
          DB.setRole(db, target.id, 'user');
          DB.audit(db, me.username, 'demoted', target.username);
          return done(`${target.username} is now a normal user.`);
        case 'delete':
          if (wouldStrandServer) return redirect(res, '/admin?err=' + encodeURIComponent('That is the only root account.'));
          DB.deleteUser(db, target.id);
          DB.audit(db, me.username, 'deleted', target.username);
          return done(`${target.username} and their progress were deleted.`);
        default:
          return redirect(res, '/admin?err=' + encodeURIComponent('Unknown action.'));
      }
    }
  }

  /* --- the study tool itself --- */
  if (method === 'GET' || method === 'HEAD') return serveStatic(req, res, path === '/' ? '/index.html' : path);
  return send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain', Allow: 'GET, HEAD, POST' });
}

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error('request failed:', req.method, req.url, err && err.message);
    if (!res.headersSent) sendHtml(res, 500, P.errorPage(500, 'Something went wrong on the server.'));
    else res.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log('\n  Nutanix Study Tool');
  console.log(`  serving  ${ROOT}`);
  console.log(`  database ${DB_FILE}`);
  console.log(`  listening on http://${HOST === '0.0.0.0' ? '<this-vm>' : HOST}:${PORT}\n`);
  if (rootUsesDefaultPassword) {
    console.log('  NOTE: the root account is using the default password ("nutanix").');
    console.log('        Sign in as root and change it before exposing this beyond a trusted network.\n');
  }
  if (!ALLOW_SIGNUP) console.log('  Self-registration is closed (NST_ALLOW_SIGNUP=0).\n');
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;            // a service stop can deliver twice
  shuttingDown = true;
  server.close(() => { try { db.close(); } catch {} process.exit(0); });
  setTimeout(() => process.exit(0), 3000).unref();
}

/* Windows never DELIVERS SIGTERM -- a service stop or `taskkill` terminates the
 * process outright, so a SIGTERM-only handler would mean db.close() never runs
 * there. SIGINT (Ctrl+C) and SIGBREAK (Ctrl+Break, Windows-only) do arrive, so
 * all four are registered; the ones a platform does not raise simply never fire.
 *
 * A hard kill is survivable regardless: SQLite is in WAL mode and every write is
 * committed synchronously, so the next start recovers from the -wal file. The
 * graceful path is a tidiness measure, not the thing that protects the data. */
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  try { process.on(sig, shutdown); } catch { /* not raised on this platform */ }
}

export { server, db };
