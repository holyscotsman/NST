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
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';
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

function walk(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, base, out);
    else out.push(relative(base, full));
  }
  return out;
}

function isPreserved(relPath) {
  const norm = relPath.split(sep).join('/');
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
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) return { ok: false, error: 'The download was too small to be a real copy of the app.' };
    writeFileSync(archive, buf);
    log(`Downloaded ${(buf.length / 1024 / 1024).toFixed(1)} MB.`);

    log('Extracting...');
    try { await run('tar', ['-xzf', archive, '-C', tmp], { timeout: 120000 }); }
    catch (e) {
      return { ok: false, error: '`tar` is not available to extract the update. It ships with Windows 10/Server 2019+ and all Linux; on older Windows, update by hand.' };
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
    const files = walk(staged);
    let copied = 0, skipped = 0;
    for (const rel of files) {
      if (isPreserved(rel)) { skipped++; continue; }
      const dest = join(root, rel);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(staged, rel), dest);
      copied++;
    }
    log(`Updated ${copied} files (kept ${skipped}, including your database).`);
    return { ok: true, from: current, to: newVersion, copied, skipped };
  } catch (e) {
    return { ok: false, error: `Update failed: ${e && e.message ? e.message : e}. Nothing was changed.` };
  } finally {
    try { rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch { /* temp dir */ }
  }
}
