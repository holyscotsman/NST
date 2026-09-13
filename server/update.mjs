/* update.mjs — one-click update from GitHub.
 *
 * WHAT THIS IS, PLAINLY
 * This downloads code from the internet and runs it as the service account. That
 * is remote code execution by design, so the safety comes from constraints that
 * cannot be reached from the browser:
 *
 *   - the source URL is a CONSTANT below. Nothing in the request influences where
 *     the download comes from, so a hostile request cannot point it elsewhere.
 *   - the route is root-only and CSRF-checked (enforced in server.mjs).
 *   - the archive is extracted and CHECKED in a staging directory first. The live
 *     tree is not touched until the new copy is proven to look like this app, so
 *     a truncated or wrong download can never leave a half-broken install.
 *   - server/data/ is never overwritten. The database survives every update.
 *
 * Node has no built-in archive reader, so extraction shells out to `tar`, which
 * ships with Windows 10/Server 2019+ and every Linux. The archive is a .tar.gz
 * rather than a .zip: Windows' bsdtar reads both, but GNU tar on Linux reads only
 * tar, so the zip form would work on the VM and fail in every test.
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, lstatSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/* Fixed source. Not configurable from a request -- see the header. */
export const REPO = 'holyscotsman/NST';
export const BRANCH = 'main';
/* A .tar.gz, not a .zip. `tar` on Windows is bsdtar and reads both, but GNU tar
 * on Linux reads only tar archives -- so the zip form worked on the target
 * platform while failing everywhere the tests run. */
const ARCHIVE_URL = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}`;
const VERSION_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/shared/nst-version.js`;

/* The repository packs to about 6 MB. Ten times that leaves room for several
 * more certification banks and their exhibits, and still bounds what a runaway
 * response can allocate on a small VM. */
export const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;

/* Read a response body with a hard ceiling, rather than trusting its length. */
async function readCapped(res, limit) {
  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > limit) throw new Error('too large');
    return buf;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.length;
    if (size > limit) { try { await res.body.cancel(); } catch { /* already ending */ } throw new Error('too large'); }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/* Members a correct archive of this app never contains.
 *
 * `tar -tv` prints one ls-style line per member on both GNU tar and bsdtar: a
 * mode string, owner, size, date, then the name (and ` -> target` for a link).
 * Anything whose mode does not start with `-` or `d` is not a plain file or
 * directory, and is refused whatever it is. */
export function unsafeMembers(listing) {
  const bad = [];
  for (const raw of String(listing).split('\n')) {
    const line = raw.trimEnd();
    if (!line) continue;
    const m = line.match(/^(\S+)\s+\S+\s+\d+\s+\S+\s+\S+\s+(.*)$/);
    if (!m) continue;                       // not a member line (a warning, say)
    const mode = m[1];
    const name = m[2].split(' -> ')[0];
    const kind = mode[0];
    if (kind !== '-' && kind !== 'd') { bad.push(name + ' (' + kind + ')'); continue; }
    if (name.startsWith('/') || /^[A-Za-z]:[\\/]/.test(name)) { bad.push(name); continue; }
    if (name.split(/[\\/]/).some((seg) => seg === '..')) { bad.push(name); continue; }
  }
  return bad;
}

/* What actually went wrong, rather than always blaming a missing `tar`. */
function tarFailure(e) {
  const msg = String((e && (e.stderr || e.message)) || '').trim();
  if (/ENOENT|not recognized|not found/i.test(msg)) {
    return '`tar` is not available to extract the update. It ships with Windows 10/Server 2019+ and all Linux; on older Windows, update by hand.';
  }
  return `The downloaded archive could not be read${msg ? ': ' + msg.split('\n')[0] : ''}. Nothing was changed.`;
}

/* Never replaced by an update: runtime state, and anything git does not track. */
const PRESERVE = ['server/data', 'node_modules', '.git'];

/* A staged copy must contain all of these to be considered a real NST tree.
 * This is what stops a truncated download from being copied over a working
 * install. */
const REQUIRED = [
  'index.html',
  'shared/nst-version.js',
  'server/server.mjs',
  'server/db.mjs',
  'starnix/index.html',
  'wwtbane/index.html',
  'practice-exams/index.html',
];

function parseVersion(src) {
  const m = String(src).match(/NST_VERSION\s*=\s*["']([^"']+)["']/);
  return m ? m[1] : null;
}

export function localVersion(root) {
  try { return parseVersion(readFileSync(join(root, 'shared', 'nst-version.js'), 'utf8')); }
  catch { return null; }
}

/* Compare dotted versions numerically: "2.10.0" is newer than "2.9.0", which a
 * string compare gets backwards. */
export function isNewer(candidate, current) {
  if (!candidate || !current) return false;
  const a = String(candidate).split('.').map((n) => parseInt(n, 10) || 0);
  const b = String(current).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

/* Ask GitHub what the published version is. Never throws: a blocked or offline
 * network is an ordinary answer here, not a crash. */
export async function checkForUpdate(root, { timeoutMs = 10000 } = {}) {
  const current = localVersion(root);
  try {
    const ctl = AbortSignal.timeout(timeoutMs);
    const res = await fetch(VERSION_URL, { signal: ctl, headers: { 'User-Agent': 'nst-updater' } });
    if (!res.ok) return { ok: false, current, error: `GitHub replied ${res.status}` };
    const latest = parseVersion(await res.text());
    if (!latest) return { ok: false, current, error: 'could not read the published version' };
    return { ok: true, current, latest, updateAvailable: isNewer(latest, current) };
  } catch (e) {
    const msg = (e && e.name === 'TimeoutError')
      ? 'GitHub did not respond in time (is it reachable from this machine?)'
      : `could not reach GitHub (${e && e.message ? e.message : e})`;
    return { ok: false, current, error: msg };
  }
}

/* List the regular files under dir, relative to base.
 *
 * lstat, not stat, and symlinks are skipped rather than followed. Two reasons,
 * both about an archive we did not build:
 *   - a link pointing at a directory is walked as one by stat, so a self-
 *     referential link ('a -> .') recurses until the stack blows
 *   - a link pointing outside the tree would have its TARGET's contents copied
 *     into the live install
 * Nothing this app ships is a symlink, so skipping them costs nothing. */
export function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st;
    try { st = lstatSync(full); } catch { continue; }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(full, base, out);
    else if (st.isFile()) out.push(relative(base, full));
  }
  return out;
}

export function isPreserved(relPath) {
  // Fold BOTH separators, not just this platform's.
  //
  // This used to split on `sep`, which is correct only as long as the path was
  // produced by this platform's `relative()`. That is exactly the assumption
  // that made the static-file denylist inert on Windows in v2.8.1: a rule
  // written with forward slashes, compared against a path that had backslashes.
  // The preserve list is what keeps the database from being overwritten, so it
  // is not a place to depend on who built the string.
  const norm = String(relPath).replace(/\\/g, '/');
  return PRESERVE.some((p) => norm === p || norm.startsWith(p + '/'));
}

/* Download, stage, verify, then swap. Returns a report; never leaves the live
 * tree half-written, because nothing is copied until the staged copy passes. */
export async function applyUpdate(root, { log = () => {} } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'nst-update-'));
  const archive = join(tmp, 'nst.tar.gz');
  try {
    log('Downloading the latest version from GitHub...');
    const res = await fetch(ARCHIVE_URL, { signal: AbortSignal.timeout(120000), headers: { 'User-Agent': 'nst-updater' } });
    if (!res.ok) return { ok: false, error: `GitHub replied ${res.status} when downloading the update.` };
    /* A ceiling, because `arrayBuffer()` has none.
     *
     * The whole archive is held in memory to be written out, and nothing bounded
     * how much. The repository is about 6 MB packed today; MAX_ARCHIVE_BYTES is
     * ten times that, which leaves room for several more certification banks and
     * their exhibits while keeping a runaway response from taking the service
     * down on a small VM. Content-Length is checked first when the server sends
     * one, and the stream is counted regardless -- a header can be absent, or
     * wrong. */
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_ARCHIVE_BYTES) {
      return { ok: false, error: `The download is ${(declared / 1048576).toFixed(0)} MB, larger than the ${MAX_ARCHIVE_BYTES / 1048576} MB limit. Nothing was changed.` };
    }
    let buf;
    try {
      buf = await readCapped(res, MAX_ARCHIVE_BYTES);
    } catch (e) {
      return { ok: false, error: `The download exceeded the ${MAX_ARCHIVE_BYTES / 1048576} MB limit and was stopped. Nothing was changed.` };
    }
    if (buf.length < 10000) return { ok: false, error: 'The download was too small to be a real copy of the app.' };
    writeFileSync(archive, buf);
    log(`Downloaded ${(buf.length / 1024 / 1024).toFixed(1)} MB.`);

    /* READ THE ARCHIVE BEFORE OPENING IT
     *
     * Extraction happens before any of the staging checks below, so by the time
     * the tree is validated a hostile member is already written. GNU tar refuses
     * a `..` member and strips a leading `/`; Windows ships bsdtar, not GNU tar,
     * and this service runs on Windows. Leaving the guarantee to whichever `tar`
     * is installed means it is untested on the platform that matters.
     *
     * So the member list is read first -- `-t` lists without extracting -- and
     * the whole archive is refused if any member is absolute, walks up with
     * `..`, or is anything but a plain file or directory. A symlink is refused
     * outright rather than relied upon to be skipped later: walk() does skip
     * them, but that is a second line, not the first.
     *
     * Same rule on every platform, and testable here. */
    log('Inspecting the archive...');
    let listing;
    try {
      listing = (await run('tar', ['-tvzf', archive], { timeout: 120000 })).stdout;
    } catch (e) {
      return { ok: false, error: tarFailure(e) };
    }
    const unsafe = unsafeMembers(listing);
    if (unsafe.length) {
      return { ok: false, error: `The download contained ${unsafe.length} file path${unsafe.length === 1 ? '' : 's'} that would write outside the update folder (${unsafe.slice(0, 3).join(', ')}). Nothing was extracted.` };
    }

    log('Extracting...');
    try { await run('tar', ['-xzf', archive, '-C', tmp], { timeout: 120000 }); }
    catch (e) {
      return { ok: false, error: tarFailure(e) };
    }

    // codeload unpacks to <repo>-<branch>/
    const extracted = readdirSync(tmp).map((n) => join(tmp, n)).filter((p) => statSync(p).isDirectory());
    const staged = extracted.find((p) => existsSync(join(p, 'server', 'server.mjs')));
    if (!staged) return { ok: false, error: 'The downloaded archive did not contain the app.' };

    // Prove it is a real, complete NST tree BEFORE touching anything live.
    const missing = REQUIRED.filter((f) => !existsSync(join(staged, ...f.split('/'))));
    if (missing.length) {
      return { ok: false, error: `The download looks incomplete (missing ${missing.join(', ')}). Nothing was changed.` };
    }

    const newVersion = parseVersion(readFileSync(join(staged, 'shared', 'nst-version.js'), 'utf8'));
    const current = localVersion(root);
    log(`Staged v${newVersion} (currently running v${current}).`);

    // Copy over the live tree. Fast and local: the slow, failure-prone part
    // (network) is already done and verified.
    //
    // From the first copyFileSync onward the install is PARTIALLY WRITTEN, and
    // the failure message has to change with it. A disk that fills here leaves a
    // half-new tree, and telling someone "nothing was changed" would send them
    // to restart a service that will not come back.
    const files = walk(staged);
    let copied = 0, skipped = 0;
    for (const rel of files) {
      if (isPreserved(rel)) { skipped++; continue; }
      const dest = join(root, rel);
      try {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(join(staged, rel), dest);
      } catch (e) {
        const why = e && e.message ? e.message : e;
        if (copied === 0) {
          return { ok: false, error: `Could not write to the app directory (${why}). Nothing was changed.` };
        }
        return {
          ok: false, partial: true, copied,
          error: `The update stopped partway through after replacing ${copied} files (${why}). ` +
            `The install is now a mix of both versions. Your database is untouched. ` +
            `Free up disk space and run the update again, or re-clone the repository over this directory.`,
        };
      }
      copied++;
    }
    log(`Updated ${copied} files (kept ${skipped}, including your database).`);
    return { ok: true, from: current, to: newVersion, copied, skipped };
  } catch (e) {
    // Everything reaching here is before the first write: download, extraction
    // and verification all happen in the temp directory.
    return { ok: false, error: `Update failed: ${e && e.message ? e.message : e}. Nothing was changed.` };
  } finally {
    try { rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch { /* temp dir */ }
  }
}
