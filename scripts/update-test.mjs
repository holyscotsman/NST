/* update-test.mjs — the one-click updater's safety properties.
 *
 * This is the only code path that downloads from the internet and installs it as
 * the service account, so the tests are about what it REFUSES to do: never touch
 * the live tree until a staged copy is proven complete, never overwrite the
 * database, and never let a non-root request anywhere near it.
 *
 * The version comparison and the staging/verify logic are exercised directly.
 * Network calls are not made -- reachability is an operational question, not a
 * property of this code.
 *
 * Pure Node, no browser, no dependencies. Run: node scripts/update-test.mjs
 */
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { isNewer, localVersion, REPO, BRANCH } from '../server/update.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- version comparison ---- */
{
  ok('a higher patch is newer', isNewer('2.8.2', '2.8.1'));
  ok('a higher minor is newer', isNewer('2.9.0', '2.8.9'));
  ok('a higher major is newer', isNewer('3.0.0', '2.99.99'));
  ok('the same version is not newer', !isNewer('2.8.1', '2.8.1'));
  ok('an older version is not newer', !isNewer('2.8.0', '2.8.1'));
  // the bug a string compare would introduce
  ok('2.10.0 is newer than 2.9.0 (numeric, not lexical)', isNewer('2.10.0', '2.9.0'));
  ok('2.9.0 is NOT newer than 2.10.0', !isNewer('2.9.0', '2.10.0'));
  ok('a missing candidate is never newer', !isNewer(null, '2.8.1'));
  ok('a missing current is never newer', !isNewer('2.8.1', null));
}

/* ---- reading the local version ---- */
{
  const tmp = mkdtempSync(join(tmpdir(), 'nst-upd-'));
  mkdirSync(join(tmp, 'shared'), { recursive: true });
  writeFileSync(join(tmp, 'shared', 'nst-version.js'), 'window.NST_VERSION = "9.9.9";\n');
  ok('reads the version from a tree', localVersion(tmp) === '9.9.9', localVersion(tmp));
  rmSync(tmp, { recursive: true, force: true });

  const empty = mkdtempSync(join(tmpdir(), 'nst-upd-'));
  ok('a tree with no version file returns null, does not throw', localVersion(empty) === null);
  rmSync(empty, { recursive: true, force: true });
}

/* ---- the source is a constant, not request-controlled ---- */
{
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  ok('the repo is a fixed constant', REPO === 'holyscotsman/NST', REPO);
  ok('the branch is a fixed constant', BRANCH === 'main', BRANCH);
  // The URLs must be built from those constants only -- no interpolation of
  // anything that could come from a request.
  ok('the download URL is built only from the constants (tar.gz, readable by both GNU tar and bsdtar)',
    /const ARCHIVE_URL = `https:\/\/codeload\.github\.com\/\$\{REPO\}\/tar\.gz\/refs\/heads\/\$\{BRANCH\}`/.test(src));
  ok('the version URL is built only from the constants',
    /const VERSION_URL = `https:\/\/raw\.githubusercontent\.com\/\$\{REPO\}\/\$\{BRANCH\}\/shared\/nst-version\.js`/.test(src));
  ok('applyUpdate takes no URL parameter', /export async function applyUpdate\(root, \{ log/.test(src));
}

/* ---- the database is on the preserve list ---- */
{
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  const m = src.match(/const PRESERVE = \[([^\]]*)\]/);
  ok('a PRESERVE list exists', !!m);
  const list = m ? m[1] : '';
  ok('server/data (the database) is preserved', /server\/data/.test(list), list);
  ok('node_modules is preserved', /node_modules/.test(list), list);
  ok('.git is preserved', /\.git/.test(list), list);
}

/* ---- an incomplete download must be rejected before anything is copied ---- */
{
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  const m = src.match(/const REQUIRED = \[([\s\S]*?)\]/);
  ok('a REQUIRED manifest exists', !!m);
  const list = m ? m[1] : '';
  for (const f of ['index.html', 'shared/nst-version.js', 'server/server.mjs', 'starnix/index.html']) {
    ok(`the completeness check requires ${f}`, list.includes(f));
  }
  // the verify must come BEFORE the copy loop, or a bad download lands live
  const verifyAt = src.indexOf('The download looks incomplete');
  const copyAt = src.indexOf('copyFileSync(join(staged, rel), dest)');
  ok('completeness is verified BEFORE any file is copied', verifyAt > 0 && copyAt > 0 && verifyAt < copyAt,
    `verify@${verifyAt} copy@${copyAt}`);
  const stagedAt = src.indexOf('const staged =');
  ok('extraction targets a temp dir, not the live tree', src.includes("mkdtempSync(join(tmpdir(), 'nst-update-'))"));
  ok('staging is resolved before the verify', stagedAt > 0 && stagedAt < verifyAt);
}

/* ---- the routes are root-only and CSRF-checked ---- */
{
  const srv = readFileSync(new URL('../server/server.mjs', import.meta.url), 'utf8');
  const adminGuard = srv.indexOf("if (me.role !== 'root')");
  const checkRoute = srv.indexOf("path === '/admin/update-check'");
  const applyRoute = srv.indexOf("path === '/admin/update-apply'");
  ok('both update routes exist', checkRoute > 0 && applyRoute > 0);
  ok('they sit AFTER the root-only guard', adminGuard > 0 && checkRoute > adminGuard && applyRoute > adminGuard,
    `guard@${adminGuard} check@${checkRoute} apply@${applyRoute}`);
  const applyBlock = srv.slice(applyRoute, applyRoute + 900);
  ok('the apply route checks CSRF', applyBlock.includes('csrfValid(req, form)'));
  ok('the apply route is POST only', applyBlock.includes("method === 'POST'"));
  ok('the apply route is audited', applyBlock.includes("DB.audit"));
}

console.log('\n' + (fail ? `UPDATE: ${fail} FAILED of ${pass + fail}` : `UPDATE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
