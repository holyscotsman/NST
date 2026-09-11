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

export function throttleCheck(key, now = Date.now()) {
  const rec = attempts.get(key);
  if (!rec) return { allowed: true };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { allowed: false, retryAfterMs: rec.lockedUntil - now };
  }
  if (now - rec.first > WINDOW_MS) { attempts.delete(key); return { allowed: true }; }
  return { allowed: true };
}

export function throttleFail(key, now = Date.now()) {
  let rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) rec = { count: 0, first: now, lockedUntil: 0 };
  rec.count++;
  if (rec.count >= MAX_ATTEMPTS) { rec.lockedUntil = now + LOCKOUT_MS; rec.count = 0; rec.first = now; }
  attempts.set(key, rec);
  return rec;
}

export function throttleReset(key) { attempts.delete(key); }
export function _throttleClearAll() { attempts.clear(); }

/* ---- cookies --------------------------------------------------------- */

export function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
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
