/* safe-path.mjs — turning an untrusted URL path into a file on disk, safely, on
 * BOTH Linux and Windows.
 *
 * THE BUG THIS EXISTS TO PREVENT
 * The first version of these guards normalised the URL with `path.normalize()`.
 * That is platform-dependent: on Windows it returns a BACKSLASH-separated path.
 * Every denylist entry is written with forward slashes, so on Windows
 *
 *     path.win32.normalize('/server/data/nst.db')  ->  '\\server\\data\\nst.db'
 *
 * and `startsWith('/server/')` silently stopped matching. The database — scrypt
 * password hashes, live session rows, every user's progress — became downloadable
 * by any signed-in user, while every Linux test went on passing.
 *
 * THE RULE
 * A URL path is NOT a filesystem path. URLs are always '/'-separated on every
 * platform, so URL work is done with POSIX semantics only, and the platform's
 * path module is used solely for the final resolve onto real disk.
 *
 * TWO LAYERS, DELIBERATELY
 *   1. the URL is refused outright if it is malformed or contains anything that
 *      means something dangerous on Windows (drive letters, ADS colons, NUL)
 *   2. the guard is then applied to the RESOLVED path — where the request would
 *      actually land on disk. That is authoritative: no amount of URL trickery,
 *      encoding, casing or symlinking changes where a file really is.
 *
 * `pathImpl` is injectable so the test suite can exercise Windows semantics on a
 * Linux CI runner (`path.win32`) — this class of bug must never again be
 * invisible to the platform we happen to test on.
 */
import * as nodePath from 'node:path';

/* Relative to the served root. Anything at or under these is never served. */
export const DENY = ['server', '.git', '.github', 'node_modules', '.gitignore'];

/* Canonicalise an untrusted URL path to a POSIX-style absolute path, or return
 * null to refuse it. Refusing is always safe: the caller answers 404. */
export function normalizeUrlPath(urlPath) {
  if (typeof urlPath !== 'string' || !urlPath) return null;
  let p = urlPath.split('?')[0].split('#')[0];

  let decoded;
  try { decoded = decodeURIComponent(p); } catch { return null; }   // malformed %-escape
  if (decoded.includes('\0')) return null;                          // NUL truncation

  // Windows treats '\' as a separator; Linux treats it as an ordinary filename
  // character. Fold it to '/' so one canonical form is checked on both, and a
  // path like '/..\..\secret' cannot mean different things on different hosts.
  decoded = decoded.replace(/\\/g, '/');

  // A colon is a drive separator ('C:') and an alternate-data-stream marker
  // ('file.js::$DATA') on Windows. Nothing the site serves needs one.
  if (decoded.includes(':')) return null;

  // POSIX normalisation, always — this is a URL, not a local path.
  const norm = nodePath.posix.normalize(decoded.startsWith('/') ? decoded : '/' + decoded);

  // normalize() leaves a leading '..' in place if it cannot be resolved away.
  if (norm === '..' || norm.startsWith('../')) return null;
  return norm;
}

/* Is this URL path inside something we never serve?
 *
 * Case-insensitive because Windows filesystems are: '/SERVER/data/nst.db' and
 * '/server/data/nst.db' are the same file there, so one spelling being denied
 * and the other served would be a hole. */
export function isDeniedPath(norm) {
  if (!norm) return true;
  const segments = norm.split('/').filter(Boolean);
  if (!segments.length) return false;
  const first = segments[0].toLowerCase();
  // Windows also ignores trailing dots and spaces in filenames, so 'server.'
  // and 'server ' both open `server`. Strip them before comparing.
  const folded = first.replace(/[. ]+$/, '');
  return DENY.some((d) => d.toLowerCase() === folded);
}

/* Resolve a URL path to an absolute file path inside rootDir, or null.
 *
 * The containment check is the real guard; the denylist above is a fast first
 * pass. Both are applied to where the request ACTUALLY lands. */
export function resolveWithin(rootDir, urlPath, pathImpl = nodePath) {
  const norm = normalizeUrlPath(urlPath);
  if (norm === null) return null;
  if (isDeniedPath(norm)) return null;

  // Hand the POSIX-normalised, denylisted path to the platform resolver.
  const rel = norm.replace(/^\/+/, '');
  const full = rel ? pathImpl.resolve(rootDir, rel) : pathImpl.resolve(rootDir);

  // Windows compares paths case-insensitively; Linux does not. Comparing with the
  // wrong rule either lets an escape through or rejects legitimate files.
  const ci = pathImpl === nodePath.win32 || process.platform === 'win32';
  const fold = (s) => (ci ? s.toLowerCase() : s);
  const root = fold(pathImpl.resolve(rootDir));
  const cand = fold(full);
  if (cand !== root && !cand.startsWith(root + pathImpl.sep)) return null;

  // Re-check the denylist against the RESOLVED location, which is authoritative:
  // whatever the URL claimed, this is the file that would be read.
  const relFromRoot = pathImpl.relative(pathImpl.resolve(rootDir), full);
  if (relFromRoot) {
    const firstSeg = relFromRoot.split(/[\\/]/).filter(Boolean)[0] || '';
    const folded = firstSeg.toLowerCase().replace(/[. ]+$/, '');
    if (DENY.some((d) => d.toLowerCase() === folded)) return null;
  }
  return full;
}
