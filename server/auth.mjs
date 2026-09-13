/* auth.mjs — passwords, sessions, and the small amount of hardening a login
 * page needs to not be a liability. Zero npm dependencies; node:crypto only.
 *
 * Choices worth stating:
 *  - scrypt, not a bare SHA. A password hash has to be SLOW; a plain digest can
 *    be brute-forced at billions of guesses a second on a GPU.
 *  - Per-user random salt, so two people who pick the same password do not share
 *    a hash, and a precomputed table is useless.
 *  - Session tokens are random 32-byte values; only their SHA-256 is stored, so
 *    read access to the database file does not yield usable cookies.
 *  - Every comparison of a secret is timing-safe.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

// Deliberately costly. ~100ms per hash on a small VM is unnoticeable at login
// and ruinous for an attacker working through a wordlist.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password, salt) {
  const s = salt || randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), s, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return { hash: hash.toString('hex'), salt: s };
}

export function verifyPassword(password, storedHash, salt) {
  try {
    const { hash } = hashPassword(password, salt);
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(String(storedHash), 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

/* The identical error message on a failed login is only half of not leaking who
 * has an account here. The other half is the CLOCK: verifyPassword is meant to
 * be slow, so a sign-in that skips it because no such user exists answers in a
 * millisecond while a real username answers in thirty. Measured on this server
 * that was a 20x gap -- enough to enumerate every account without ever reading
 * the error text.
 *
 * So when the username misses, burn the same scrypt against a fixed throwaway
 * salt and throw the answer away. Same work, same wait, nothing to compare. */
const DUMMY_SALT = randomBytes(16).toString('hex');
const DUMMY_HASH = scryptSync('\u0000unused', DUMMY_SALT, SCRYPT.keylen,
  { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }).toString('hex');

export function absorbPassword(password) {
  verifyPassword(password, DUMMY_HASH, DUMMY_SALT);
  return false;                                  // never a sign-in, always false
}

export function newSessionToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

/* ---- username + password rules -------------------------------------- */

export const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

export function validateUsername(name) {
  const n = String(name || '').trim();
  if (!USERNAME_RE.test(n)) {
    return { ok: false, error: 'Usernames are 3–32 characters, letters, numbers, dot, dash or underscore.' };
  }
  return { ok: true, value: n };
}

/* A deliberately modest bar. This is an internal study tool, and a rule so strict
 * that people write passwords on sticky notes is worse than a short minimum. */
export const MIN_PASSWORD = 8;

export function validatePassword(pw, username) {
  const p = String(pw || '');
  if (p.length < MIN_PASSWORD) return { ok: false, error: `Passwords need at least ${MIN_PASSWORD} characters.` };
  if (p.length > 200) return { ok: false, error: 'That password is too long (200 characters max).' };
  if (username && p.toLowerCase() === String(username).toLowerCase()) {
    return { ok: false, error: 'Your password cannot be the same as your username.' };
  }
  return { ok: true, value: p };
}

/* ---- login throttling ----------------------------------------------- */

/* In-memory, per-key sliding window. Enough to make online guessing pointless
 * without needing a dependency or a shared cache — this runs as one process. */
const attempts = new Map();   // key -> { count, first, lockedUntil }
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 10 * 60 * 1000;

/* A key is ip|username, and an unknown username costs the server nothing to
 * reject -- so a bot posting a fresh random name every time minted a map entry
 * per request that nothing ever came back to expire. The throttle that exists
 * to survive a flood was itself the way to exhaust the process.
 *
 * Cap it. Expired records go first; if that is not enough, evict the oldest
 * records that are NOT serving a live lockout, so filling the map cannot be
 * used to wash out a lockout someone has already earned. */
const MAX_KEYS = 4096;

function sweep(now) {
  if (attempts.size <= MAX_KEYS) return;
  for (const [k, r] of attempts) {
    const locked = r.lockedUntil && r.lockedUntil > now;
    if (!locked && now - r.first > WINDOW_MS) attempts.delete(k);
  }
  if (attempts.size <= MAX_KEYS) return;
  for (const [k, r] of attempts) {                  // insertion order = oldest first
    if (attempts.size <= MAX_KEYS) break;
    if (!(r.lockedUntil && r.lockedUntil > now)) attempts.delete(k);
  }
  while (attempts.size > MAX_KEYS) {                // all of them locked: take the oldest
    const k = attempts.keys().next().value;
    if (k === undefined) break;
    attempts.delete(k);
  }
}

export function throttleCheck(key, now = Date.now()) {
  const rec = attempts.get(key);
  if (!rec) return { allowed: true };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - now };
  }
  if (now - rec.first > WINDOW_MS) { attempts.delete(key); return { allowed: true }; }
  return { allowed: true };
}

/* `max` lets one caller be coarser than another. The fine key is ip|username at
 * eight tries; the coarse key is the address alone, and has to sit far above any
 * honest use because a whole office can share one address behind NAT. */
export function throttleFail(key, now = Date.now(), max = MAX_ATTEMPTS) {
  let rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) rec = { count: 0, first: now, lockedUntil: 0 };
  rec.count++;
  if (rec.count >= Math.max(1, max)) { rec.lockedUntil = now + LOCKOUT_MS; rec.count = 0; rec.first = now; }
  attempts.set(key, rec);
  sweep(now);
  return rec;
}

/* Failed sign-ins per ADDRESS, regardless of which username was tried.
 *
 * The per-username gate cannot see this attack: keyed ip|username, a bot that
 * invents a fresh name every request never hits the same key twice, so it is
 * never throttled at all. That was survivable only while an unknown username
 * was free to reject -- and closing the timing leak made every one of them cost
 * a full scrypt. Without this second gate, fixing the leak would have handed
 * over a CPU exhaustion vector in its place.
 *
 * Deliberately loose. Only FAILURES count, so a person signing in normally never
 * approaches it, and a shared office address has room for everyone's bad day. */
export const MAX_ATTEMPTS_PER_IP = 60;

export function _throttleSize() { return attempts.size; }
export const _THROTTLE_MAX_KEYS = MAX_KEYS;
export const _THROTTLE_MAX_ATTEMPTS = MAX_ATTEMPTS;

export function throttleReset(key) { attempts.delete(key); }
export function _throttleClearAll() { attempts.clear(); }

/* ---- cookies --------------------------------------------------------- */

/* Never throws. The Cookie header is attacker-controlled on every single
 * request, and decodeURIComponent('%') is a URIError -- which used to escape
 * all the way out of the request handler and answer 500. Not just on one page:
 * the session cookie is read before routing, so ONE malformed cookie turned the
 * whole site, sign-in screen included, into an error page for that browser, with
 * no way in to clear it.
 *
 * A value that will not decode is kept verbatim instead. It will not match a
 * session or a CSRF token, which is the correct outcome; being unreadable is not
 * grounds for taking the server down. */
export function parseCookies(header) {
  const out = Object.create(null);
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) return;
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  });
  return out;
}

export function cookieHeader(name, value, { maxAge, secure, expire } = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (secure) bits.push('Secure');
  if (expire) bits.push('Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  else if (maxAge) bits.push(`Max-Age=${Math.floor(maxAge / 1000)}`);
  return bits.join('; ');
}

/* ---- CSRF ------------------------------------------------------------ */

/* SameSite=Strict already blocks cross-site form posts in every browser that
 * matters, but a double-submit token costs nothing and covers the case where a
 * proxy or an old client drops the cookie attribute. */
export function newCsrfToken() { return randomBytes(24).toString('base64url'); }

export function csrfOk(cookieToken, sentToken) {
  if (!cookieToken || !sentToken) return false;
  const a = Buffer.from(String(cookieToken));
  const b = Buffer.from(String(sentToken));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
