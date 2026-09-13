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
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, sep } from 'node:path';
import { isNewer, localVersion, REPO, BRANCH } from '../server/update.mjs';
import * as U from '../server/update.mjs';

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

/* ---- the archive is not one we built: exercised, not pattern-matched ---- */
{
  // A real tree with the shapes a hostile or merely odd archive can contain.
  const tmp = mkdtempSync(join(tmpdir(), 'nst-walk-'));
  mkdirSync(join(tmp, 'sub', 'deep'), { recursive: true });
  writeFileSync(join(tmp, 'index.html'), 'x');
  writeFileSync(join(tmp, 'sub', 'a.js'), 'x');
  writeFileSync(join(tmp, 'sub', 'deep', 'b.css'), 'x');
  // A link to the tree's own root: stat() reports a directory, so a stat-based
  // walk recurses forever.
  symlinkSync(tmp, join(tmp, 'loop'), 'dir');
  // A link pointing outside: a stat-based walk would copy the TARGET's bytes
  // into the live install.
  symlinkSync('/etc/hostname', join(tmp, 'escape.txt'));

  let files = null, threw = null;
  try { files = U.walk(tmp); } catch (e) { threw = e.message; }
  ok('a self-referential symlink does not hang or overflow the stack', threw === null, threw);
  ok('the real files are all found', files && files.length === 3, files && files.length);
  const norm = (files || []).map((f) => f.split(sep).join('/')).sort();
  ok('and they are the right ones',
    JSON.stringify(norm) === JSON.stringify(['index.html', 'sub/a.js', 'sub/deep/b.css']), norm.join(','));
  ok('a symlink out of the tree is never copied', norm.indexOf('escape.txt') === -1, norm.join(','));
  ok('and neither is the loop', norm.every((f) => f.indexOf('loop') === -1), norm.join(','));
  rmSync(tmp, { recursive: true, force: true });
}
{
  ok('the database directory is preserved', U.isPreserved('server/data/nst.db') === true);
  ok('so is everything under it', U.isPreserved('server/data/backups/old.db') === true);
  ok('but not the server code itself', U.isPreserved('server/server.mjs') === false);
  ok('a Windows-separated path is still recognised', U.isPreserved('server\\data\\nst.db') === true);
  ok('a lookalike prefix is not preserved', U.isPreserved('server/database/x') === false);
}
{
  const SRC = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  // A source tarball comes from GitHub, but the extraction is still of a tree
  // this process did not create, so the walk must not follow what is in it.
  ok('the file walk uses lstat, not stat', /lstatSync\(/.test(SRC));
  ok('symlinks are skipped rather than followed', /isSymbolicLink\(\)\)\s*continue/.test(SRC));
  ok('only regular files are copied', /isFile\(\)/.test(SRC));
  ok('a failed lstat skips the entry instead of aborting the update',
    /catch \{ continue; \}/.test(SRC));
}

/* ---- the failure message has to match what actually happened ---- */
{
  const SRC = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  // "Nothing was changed" is true right up until the first copyFileSync and
  // false forever after. A disk that fills mid-copy leaves a half-new tree, and
  // telling someone nothing changed sends them to restart a service that will
  // not come back.
  ok('a write failure is caught per file, not just around the whole loop',
    /copyFileSync\([\s\S]{0,200}?\} catch \(e\) \{/.test(SRC));
  ok('a failure before the first write still says nothing was changed',
    /copied === 0[\s\S]{0,220}Nothing was changed/.test(SRC));
  ok('a failure after the first write does NOT claim nothing was changed',
    /partial: true[\s\S]{0,400}mix of both versions/.test(SRC));
  ok('and it names how many files were replaced',
    /replacing \$\{copied\} files/.test(SRC));
  ok('and it reassures about the database', /database is untouched/i.test(SRC));
  ok('and it says what to do next',
    /run the update again|re-clone/i.test(SRC));
  const partialIdx = SRC.indexOf('partial: true');
  const outerIdx = SRC.lastIndexOf('Nothing was changed.`');
  ok('the outer catch still covers the pre-write phase', outerIdx > 0 && partialIdx > 0);
}

/* ---- what the archive is allowed to contain -------------------------------
 *
 * THE GAP THIS CLOSES
 * Extraction ran before any of the staging checks, so by the time the tree was
 * validated a hostile member was already written to disk. Nothing in this code
 * decided what was safe: it was left to whichever `tar` happened to be
 * installed. Measured here on GNU tar, a hostile archive is handled well -- a
 * `..` member refused, a leading `/` stripped so the file lands inside the
 * staging folder:
 *
 *     tar: ../../victim/escaped-relative.txt: Member name contains '..'
 *     tar: Removing leading `/' from member names
 *
 * But this service runs on WINDOWS, where `tar` is bsdtar, not GNU tar. The
 * guarantee that mattered was the one on the platform none of these tests run
 * on. So the member list is now read first (`-t` lists without extracting) and
 * the archive is refused by this code, identically everywhere.
 */
{
  // `tar -tv` prints an ls-style line per member on GNU tar and bsdtar alike.
  const line = (mode, name) => `${mode} 0/0  19 1970-01-01 00:00 ${name}`;
  const listing = [
    line('-rw-r--r--', 'NST-main/index.html'),
    line('drwxr-xr-x', 'NST-main/server/'),
    line('-rw-r--r--', 'NST-main/server/server.mjs'),
  ].join('\n');

  ok('a normal archive listing is accepted whole', U.unsafeMembers(listing).length === 0,
    U.unsafeMembers(listing).join(', '));

  const traversal = U.unsafeMembers(line('-rw-r--r--', '../../etc/cron.d/evil'));
  ok('a member that walks up out of the folder is refused',
    traversal.length === 1 && /\.\./.test(traversal[0]), JSON.stringify(traversal));

  const nested = U.unsafeMembers(line('-rw-r--r--', 'NST-main/a/../../../../evil'));
  ok('a ".." buried mid-path is refused too, not just a leading one',
    nested.length === 1, JSON.stringify(nested));

  const absolute = U.unsafeMembers(line('-rw-r--r--', '/etc/cron.d/evil'));
  ok('an absolute path is refused', absolute.length === 1, JSON.stringify(absolute));

  // Windows is the platform this service actually runs on.
  const drive = U.unsafeMembers(line('-rw-r--r--', 'C:\\Windows\\System32\\evil.dll'));
  ok('a Windows drive-letter path is refused', drive.length === 1, JSON.stringify(drive));
  const driveFwd = U.unsafeMembers(line('-rw-r--r--', 'C:/Windows/System32/evil.dll'));
  ok('including the forward-slash spelling of one', driveFwd.length === 1, JSON.stringify(driveFwd));
  const winUp = U.unsafeMembers(line('-rw-r--r--', 'NST-main\\..\\..\\evil'));
  ok('and a backslash-separated ".." walk', winUp.length === 1, JSON.stringify(winUp));

  const link = U.unsafeMembers(`lrw-r--r-- 0/0  0 1970-01-01 00:00 NST-main/pwn -> ../../../../etc/passwd`);
  ok('a symlink is refused outright, not left to be skipped later',
    link.length === 1 && /\(l\)/.test(link[0]), JSON.stringify(link));

  const dev = U.unsafeMembers(line('crw-r--r--', 'NST-main/dev/null'));
  ok('and anything that is not a plain file or directory', dev.length === 1, JSON.stringify(dev));

  /* [neg] the check is not simply refusing everything. */
  ok('[neg] a directory member is allowed', U.unsafeMembers(line('drwxr-xr-x', 'NST-main/banks/')).length === 0);
  ok('[neg] a name merely CONTAINING two dots is allowed',
    U.unsafeMembers(line('-rw-r--r--', 'NST-main/banks/ncp..mci.md')).length === 0,
    JSON.stringify(U.unsafeMembers(line('-rw-r--r--', 'NST-main/banks/ncp..mci.md'))));
  ok('[neg] a warning line that is not a member is ignored',
    U.unsafeMembers('tar: Removing leading `/\' from member names').length === 0);
}

/* ---- the order of operations is the point --------------------------------- */
{
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  const inspect = src.indexOf("'-tvzf'");
  const extract = src.indexOf("'-xzf'");
  ok('the archive is listed before it is extracted', inspect > 0 && extract > 0 && inspect < extract,
    `inspect@${inspect} extract@${extract}`);
  ok('and nothing is extracted when a member is refused',
    /unsafe\.length[\s\S]{0,400}?Nothing was extracted/.test(src));
}

/* ---- a ceiling on the download -------------------------------------------- */
{
  ok('there is a maximum archive size', Number.isFinite(U.MAX_ARCHIVE_BYTES) && U.MAX_ARCHIVE_BYTES > 0,
    U.MAX_ARCHIVE_BYTES);
  ok('it leaves real room to grow (the repo packs to about 6 MB)',
    U.MAX_ARCHIVE_BYTES >= 32 * 1024 * 1024, (U.MAX_ARCHIVE_BYTES / 1048576) + ' MB');
  ok('but still bounds what one response can allocate',
    U.MAX_ARCHIVE_BYTES <= 256 * 1024 * 1024, (U.MAX_ARCHIVE_BYTES / 1048576) + ' MB');
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  ok('the body is counted as it arrives, not trusted from Content-Length',
    /readCapped\(res, MAX_ARCHIVE_BYTES\)/.test(src) && /size > limit/.test(src));
  ok('and Content-Length is still checked first, when it is sent',
    /content-length[\s\S]{0,200}MAX_ARCHIVE_BYTES/i.test(src));
}

/* ---- saying what actually went wrong -------------------------------------- */
{
  const src = readFileSync(new URL('../server/update.mjs', import.meta.url), 'utf8');
  ok('a tar failure is no longer always reported as a missing tar',
    /function tarFailure/.test(src) && /ENOENT\|not recognized\|not found/.test(src));
  // `return tarFailure(e)` -- the call sites, not the `function tarFailure(e)`
  // that declares it, which the first version of this check counted too.
  const sites = (src.match(/return\s*\{\s*ok:\s*false,\s*error:\s*tarFailure\(e\)/g) || []).length;
  ok('and both tar call sites report through it', sites === 2, String(sites));
}


console.log('\n' + (fail ? `UPDATE: ${fail} FAILED of ${pass + fail}` : `UPDATE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
