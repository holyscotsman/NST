/* smoke-test.mjs — the whole app, once, the way a person uses it.
 *
 * Every other suite here tests one module in isolation. This one starts a real
 * server with a throwaway database and drives a real browser through the actual
 * journey: a colleague creates an account, signs in, picks a bank, answers
 * questions, and their progress reaches the account and comes back on the
 * dashboard; then root signs in, sees both accounts, downloads a backup and
 * checks for updates.
 *
 * It exists because unit suites all passing is not the same as the app working.
 * Fourteen releases in one evening is exactly when something composes badly —
 * a CSP that blocks a new fetch, a route that moved, a module loaded in the
 * wrong order — and none of the focused tests would notice.
 *
 * WHAT IT ALREADY CAUGHT
 * A check that fetched an asset from /admin failed with "Failed to fetch". Not
 * a bug: the admin page is `default-src 'none'` with no connect-src, because it
 * has no script and needs no network of its own. The test was measuring the CSP
 * rather than the thing it meant to. Asked from the study tool, where
 * connect-src is 'self', it passes. Worth keeping as a note, because the same
 * mistake is easy to repeat.
 *
 * Needs a browser, so it is a local tool rather than a CI gate (CI stays
 * dependency-free), like scripts/mobile-audit.mjs and scripts/a11y-audit.mjs.
 * It brings its own server and database, so nothing needs to be running first:
 *   node scripts/smoke-test.mjs
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PORT = Number(process.env.NST_PORT || 8000 + Math.floor(Math.random() * 900));
const dir = mkdtempSync(join(tmpdir(), 'nst-smoke-'));
const child = spawn(process.execPath, [join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: join(dir, 's.db'), NST_ROOT_PASSWORD: 'smoke-test-pw' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((ok, no) => { const t = setTimeout(() => no(new Error('no start')), 15000);
  child.stdout.on('data', d => { if (String(d).includes('listening')) { clearTimeout(t); ok(); } }); child.stderr.on('data', () => {}); });

async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try { const mod = await import(spec); const c = mod.chromium || (mod.default && mod.default.chromium); if (c) return c; }
    catch { /* try the next location */ }
  }
  return null;
}
const chromium = await loadChromium();
if (!chromium) {
  child.kill('SIGKILL'); rmSync(dir, { recursive: true, force: true });
  console.log('SKIP: playwright not available');
  process.exit(0);
}
const EXE = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const BASE = `http://127.0.0.1:${PORT}`;
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); } else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
p.on('console', msg => { if (msg.type() === 'error' && !/404|favicon/.test(msg.text())) errs.push(msg.text()); });

// 1. A colleague creates their own account.
await p.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
await p.fill('input[name="username"]', 'colleague');
await p.fill('input[name="displayName"]', 'A Colleague');
await p.fill('input[name="password"]', 'a-good-long-password');
await p.fill('input[name="password2"]', 'a-good-long-password');
await p.click('button[type="submit"]');
await p.waitForTimeout(900);
ok('a colleague can create an account', p.url().includes('/login'), p.url());

await p.fill('input[name="username"]', 'colleague');
await p.fill('input[name="password"]', 'a-good-long-password');
await p.click('button[type="submit"]');
await p.waitForTimeout(2000);
ok('and sign in to the study tool', !p.url().includes('/login'), p.url());

// 2. Pick a bank and study.
await p.evaluate(() => localStorage.setItem('nst.activeBank', 'ncp-mci-25'));
await p.goto(`${BASE}/practice-exams/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
ok('Practice Exams loads the bank', await p.$('.pe-modecard-practice') !== null);

await p.click('.pe-modecard-practice');
await p.waitForTimeout(900);
for (let i = 0; i < 3; i++) {
  await p.click('.pe-opt');
  await p.click('.pe-check');
  await p.waitForTimeout(300);
  const next = await p.$('.pe-next:not([disabled])');
  if (next) { await next.click(); await p.waitForTimeout(300); }
}
const answered = await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('nst.mastery.v1') || '{"records":{}}');
  return Object.keys(s.records).length;
});
ok('answering questions records mastery', answered >= 3, answered);

// 3. It reaches the account.
await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const onServer = await p.evaluate(async () => {
  const r = await fetch('/api/progress', { credentials: 'same-origin' });
  const j = await r.json();
  const blob = j && j.data && j.data.data && j.data.data['nst.mastery.v1'];
  return blob ? Object.keys(JSON.parse(blob).records).length : 0;
});
ok('progress reaches the account', onServer >= 3, onServer);
ok('and no "not saving" warning is shown', !(await p.$('#nst-sync-warn')));

// 4. The dashboard reflects it.
const dash = await p.evaluate(() => {
  const d = document.getElementById('nst-dash');
  return d && !d.hidden ? d.innerText.replace(/\n+/g, ' | ') : null;
});
ok('the dashboard shows progress', !!dash && /SEEN/.test(dash), dash ? dash.slice(0, 90) : 'hidden');
ok('and an exam readiness verdict', !!dash && /EXAM READINESS/.test(dash));

// 5. Root can back up and check for updates.
const root = await ctx.browser().newContext({ viewport: { width: 1280, height: 1000 } });
const rp = await root.newPage();
rp.on('pageerror', e => errs.push('root: ' + e.message));
await rp.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await rp.fill('input[name="username"]', 'root');
await rp.fill('input[name="password"]', 'smoke-test-pw');
await rp.click('button[type="submit"]');
await rp.waitForTimeout(1200);
await rp.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
const users = await rp.evaluate(() => [...document.querySelectorAll('table td b')].map(e => e.textContent.trim()));
ok('root sees both accounts', users.includes('root') && users.includes('colleague'), users.join(','));

const [dl] = await Promise.all([
  rp.waitForEvent('download', { timeout: 15000 }).catch(() => null),
  rp.click('form[action="/admin/backup"] button'),
]);
ok('root can download a backup', !!dl, dl ? dl.suggestedFilename() : 'none');

await rp.click('form[action="/admin/update-check"] button');
await rp.waitForTimeout(6000);
const notice = await rp.evaluate(() => (document.body.innerText.match(/(up to date|is available|could not|did not respond)[^\n]*/i) || [])[0] || null);
ok('the update check answers one way or the other', !!notice, notice);

// Is the server still up after the update check?
let alive = false;
try {
  const probe = await fetch(`${BASE}/login`, { redirect: 'manual' });
  alive = probe.status > 0;
} catch (e) { alive = false; }
ok('the server is still running after an update check', alive);

// 6. Compression is on for the real assets.
//
// Asked from the STUDY TOOL page, not /admin. The admin page's CSP is
// `default-src 'none'` with no connect-src, so fetch() from it is blocked --
// correctly, since it has no script and needs no network of its own. Asking
// there measured the CSP, not the compression.
const enc = await p.evaluate(async () => {
  try {
    const r = await fetch('/shared/nst-mastery.js', { credentials: 'same-origin' });
    return { status: r.status, enc: r.headers.get('content-encoding'), vary: r.headers.get('vary') };
  } catch (e) { return { error: String(e && e.message || e) }; }
});
ok('assets are compressed', enc.enc === 'br' || enc.enc === 'gzip', JSON.stringify(enc));
ok('and Vary is set', /accept-encoding/i.test(enc.vary || ''), enc.vary);

ok('no page errors anywhere', errs.length === 0, errs.slice(0, 3).join(' ;; '));
console.log('\n' + (fail ? `SMOKE: ${fail} FAILED (${pass} passed)` : `SMOKE: ALL GREEN (${pass} checks)`));
await b.close(); child.kill('SIGKILL'); rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
