/* path-guard-test.mjs — the static-file path guards, under BOTH Linux and
 * Windows path semantics.
 *
 * WHY THIS EXISTS
 * The original guards used `path.normalize()`, which is platform-dependent. On
 * Windows it returns backslash-separated paths, so a denylist written with
 * forward slashes stopped matching and the SQLite database — password hashes,
 * session rows, everyone's progress — became downloadable by any signed-in user.
 * Every Linux test passed throughout.
 *
 * The lesson is that "we test on Linux" was itself the vulnerability. Node ships
 * `path.win32`, which implements Windows semantics on any platform, so the whole
 * matrix runs on a Linux CI runner with no Windows machine involved.
 *
 * Pure Node, no browser, no dependencies. Run: node scripts/path-guard-test.mjs
 */
import * as nodePath from 'node:path';
import { normalizeUrlPath, isDeniedPath, resolveWithin, DENY } from '../server/safe-path.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

const PLATFORMS = [
  { name: 'posix', impl: nodePath.posix, root: '/opt/nst' },
  { name: 'win32', impl: nodePath.win32, root: 'C:\\nst' },
];

/* ---- the regression that started this ---- */
{
  // Proof of the original bug, so it can never quietly return.
  const winNorm = nodePath.win32.normalize('/server/data/nst.db');
  ok('path.normalize IS platform-dependent (the original bug)',
    winNorm === '\\server\\data\\nst.db', winNorm);
  ok('normalizeUrlPath is NOT platform-dependent',
    normalizeUrlPath('/server/data/nst.db') === '/server/data/nst.db',
    normalizeUrlPath('/server/data/nst.db'));
}

/* ---- things that must be REFUSED OUTRIGHT, on either platform ---- */
const MUST_DENY = [
  // the database and the repo's internals
  '/server/data/nst.db', '/server/server.mjs', '/server/auth.mjs', '/server',
  '/.git/config', '/.git', '/.github/workflows/ci.yml', '/.gitignore',
  '/node_modules/foo/index.js',
  // Windows is case-insensitive: these open the SAME files there
  '/SERVER/data/nst.db', '/Server/Data/Nst.Db', '/.GIT/config', '/.GitIgnore',
  // Windows ignores trailing dots and spaces in names
  '/server./data/nst.db', '/server /data/nst.db',
  // percent-encoded spellings of the above
  '/%73erver/data/nst.db', '/.%67it/config',
  // Windows drive letters and alternate data streams
  '/C:/Windows/win.ini', '/C:\\Windows\\win.ini', '/index.html::$DATA',
  // NUL truncation and malformed escapes
  '/index.html\0.png', '/%ZZ',
];

for (const { name, impl, root } of PLATFORMS) {
  for (const bad of MUST_DENY) {
    const got = resolveWithin(root, bad, impl);
    ok(`[${name}] refuses ${JSON.stringify(bad)}`, got === null, `resolved to ${got}`);
  }
}

/* ---- traversal: the invariant is CONTAINMENT, not refusal ----
 *
 * A static server may legitimately clamp '/../etc/passwd' to <root>/etc/passwd
 * rather than erroring — that is safe, and it is what this one does. Asserting
 * "must return null" would have been asserting an implementation detail. What
 * actually matters is that no spelling of traversal can ever land OUTSIDE the
 * served root, or inside a denied directory. */
const TRAVERSALS = [
  '/../etc/passwd', '/../../etc/passwd', '/shared/../../etc/passwd',
  '/%2e%2e%2f%2e%2e%2fetc%2fpasswd', '/..%2f..%2fetc%2fpasswd',
  '/shared/%2e%2e/%2e%2e/etc/passwd',
  // backslash traversal — a separator on Windows, a filename char on Linux
  '\\..\\..\\Windows\\win.ini', '/..\\..\\Windows\\win.ini',
  '/%5c..%5c..%5cWindows%5cwin.ini',
  // dance around and try to re-enter a denied directory
  '/shared/../server/data/nst.db', '/banks/../../nst/server/data/nst.db',
  '/a/b/c/../../../../../../etc/shadow',
];

for (const { name, impl, root } of PLATFORMS) {
  const rootAbs = impl.resolve(root);
  for (const t of TRAVERSALS) {
    const got = resolveWithin(root, t, impl);
    const label = JSON.stringify(t);
    if (got === null) { ok(`[${name}] ${label} refused outright`, true); continue; }
    const lower = got.toLowerCase(), rootLower = rootAbs.toLowerCase();
    const contained = lower === rootLower || lower.startsWith(rootLower + impl.sep);
    ok(`[${name}] ${label} cannot escape the served root`, contained, got);
    const rel = impl.relative(rootAbs, got);
    const first = (rel.split(/[\\/]/).filter(Boolean)[0] || '').toLowerCase().replace(/[. ]+$/, '');
    ok(`[${name}] ${label} cannot land in a denied directory`,
      !DENY.some((d) => d.toLowerCase() === first), `landed in ${rel}`);
  }
}

/* ---- things that MUST still be served ---- */
const MUST_ALLOW = [
  '/', '/index.html', '/starnix/index.html', '/wwtbane/index.html',
  '/practice-exams/index.html', '/shared/fonts.css', '/shared/nst-mastery.js',
  '/banks/manifest.json', '/banks/ncp-mci-25/ncp-mci-25.md',
  '/styles/nst-home.css', '/shared/fonts/manrope-latin.woff2',
  // a query string and fragment must not change which file is served
  '/index.html?v=2', '/index.html#top',
  // harmless dot-segments that resolve back inside
  '/starnix/../index.html', '/./index.html',
];

for (const { name, impl, root } of PLATFORMS) {
  for (const good of MUST_ALLOW) {
    const got = resolveWithin(root, good, impl);
    ok(`[${name}] serves ${JSON.stringify(good)}`, got !== null, 'was refused');
    if (got !== null) {
      const rootAbs = impl.resolve(root);
      const inside = got === rootAbs || got.toLowerCase().startsWith(rootAbs.toLowerCase() + impl.sep);
      ok(`[${name}] ${JSON.stringify(good)} lands inside the served root`, inside, got);
    }
  }
}

/* ---- unit-level behaviour ---- */
{
  ok('normalizeUrlPath refuses a malformed escape', normalizeUrlPath('/%ZZ') === null);
  ok('normalizeUrlPath refuses a NUL byte', normalizeUrlPath('/a\0b') === null);
  ok('normalizeUrlPath refuses a colon (drive letter / ADS)', normalizeUrlPath('/C:/x') === null);
  ok('normalizeUrlPath folds backslashes to slashes',
    normalizeUrlPath('/a\\b') === '/a/b', normalizeUrlPath('/a\\b'));
  ok('normalizeUrlPath strips a query string',
    normalizeUrlPath('/a.html?x=1') === '/a.html');
  ok('isDeniedPath is case-insensitive', isDeniedPath('/SERVER/x') && isDeniedPath('/server/x'));
  ok('isDeniedPath ignores trailing dots/spaces', isDeniedPath('/server./x') && isDeniedPath('/server /x'));
  ok('isDeniedPath allows ordinary paths', !isDeniedPath('/starnix/index.html'));
  ok('isDeniedPath does not over-match a similar name', !isDeniedPath('/servers/index.html'));
  ok('every denied name is covered', DENY.every((d) => isDeniedPath('/' + d + '/x')));
}

console.log('\n' + (fail ? `PATH GUARDS: ${fail} FAILED of ${pass + fail}` : `PATH GUARDS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
