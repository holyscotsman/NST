/* ncm-practice-test.mjs — the NCM-MCI lab practice tool, held to the same rules as every NST page.
 *
 * It arrived as a single self-contained HTML file with inline <script> and <style>, style="" attributes in
 * its templates, web fonts from Google, and its own Netlify sync function. NST pages run under a strict
 * Content-Security-Policy (script-src 'self'; style-src 'self'; connect-src 'self'), which forbids every
 * one of those. A page that violates it does not crash: the browser quietly refuses, and the app renders
 * unstyled or inert. So this suite proves, in a real browser with that policy enforced, that:
 *
 *   - the page makes no request outside the site and logs no CSP violation
 *   - every screen renders and a practice question can be answered
 *   - the data-css attribute shim leaves nothing behind
 *   - progress lives under an nst. key, so shared/nst-backup.js (and so account sync) carries it
 *   - the backup merge keeps the NEWER record rather than blindly overwriting
 *   - the launcher links to it, and it links back
 *
 * Static checks run without a browser; the rest needs one and brings its own static server.
 * Run: node scripts/ncm-practice-test.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };
const read = (p) => readFileSync(join(REPO, p), 'utf8');

/* ---- static: what the files themselves say ---- */
const html = read('ncm-practice/index.html'), js = read('ncm-practice/ncm.js'), css = read('ncm-practice/ncm.css');
ok('the page has no inline <script> body', !/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html));
ok('the page has no <style> block and no style="" attribute', !/<style[\s>]/i.test(html) && !/\sstyle=/i.test(html));
ok('the app script writes no style="" attribute into markup', !/\sstyle="/.test(js));
ok('no inline event-handler attributes', !/\son[a-z]+="/i.test(html) && !/\son(click|change|input|keydown)="/.test(js));
ok('nothing in the page, script or styles loads from outside the site',
  !/(?:src|href)="https?:|url\(\s*['"]?https?:|@import\s+url\(\s*['"]?https?:|fetch\(\s*['"`]https?:|XMLHttpRequest|WebSocket/i.test(html + js + css));
ok('it declares the same strict CSP as the other pages', /script-src 'self'; style-src 'self'; font-src 'self'/.test(html));
ok('progress is stored under an nst. key, so backup and account sync carry it', /const KEY="nst\.ncm-practice\.v1"/.test(js));
ok('the old Netlify sync function and its key are gone', !/api\/progress|ncm-drill-sync|ncm-drill-v1/.test(js));
ok('fonts are vendored and present', ['montserrat-extralight-latin.woff2', 'montserrat-light-latin.woff2', 'montserrat.css'].every((f) => existsSync(join(REPO, 'ncm-practice/fonts', f))));
ok('the launcher links to the tool', /href="\.\/ncm-practice\/"/.test(read('index.html')));
ok('the tool links back to the launcher', /href="\.\.\/"/.test(html));
ok('the tool does not load a StarNix or WWTBANE file (it is its own section)', !/starnix|wwtbane/i.test(html + js));

/* ---- browser ---- */
const PORT = Number(process.env.NST_PORT || 8000 + Math.floor(Math.random() * 900));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const up = await (async () => {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/ncm-practice/index.html`); if (r.ok) return true; }
    catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  return false;
})();
if (!up) { server.kill('SIGKILL'); console.log('FAIL static server did not start'); process.exit(1); }
const BASE = `http://127.0.0.1:${PORT}`;

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium', () => server.kill('SIGKILL'));
const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const issues = [], external = [];
page.on('pageerror', (e) => issues.push('pageerror: ' + e.message.slice(0, 160)));
// The shared sync module probes /api/me on every page; on a static host that is a harmless 404, so it is not an issue.
page.on('console', (m) => { if ((m.type() === 'error' && !/Failed to load resource/.test(m.text())) || /content security policy|refused to/i.test(m.text())) issues.push(m.type() + ': ' + m.text().slice(0, 200)); });
page.on('response', (r) => { if (r.status() >= 400 && !/\/api\/me$/.test(r.url())) issues.push(r.status() + ' ' + r.url()); });
page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) external.push(r.url()); });

await page.goto(`${BASE}/ncm-practice/`, { waitUntil: 'load' });
await page.waitForSelector('#nav button', { timeout: 15000 });
const screens = await page.$$eval('#nav button', (b) => b.map((x) => x.dataset.s));
ok('four screens: home, practice, tasks, reference', screens.length === 4, screens.join(','));
for (const s of screens) {
  await page.click(`#nav button[data-s="${s}"]`); await page.waitForTimeout(150);
  const n = (await page.textContent('#view')).trim().length;
  ok(`the ${s} screen renders content`, n > 200, n);
}
ok('the data-css shim applied every style and left no attribute behind', (await page.$$eval('[data-css]', (e) => e.length)) === 0);
await page.click('#nav button[data-s="tasks"]');
ok('the tasks screen reaches the Learn and examiner pages', (await page.$$eval('#view button, #view a', (e) => e.length)) > 5);

// every drill type must render under the strict CSP (a style="" or inline handler would be refused silently)
await page.click('#nav button[data-s="practice"]'); await page.waitForSelector('#focus');
const focuses = await page.$$eval('#focus option', (o) => o.map((x) => x.value));
ok('nine focus options: mixed plus eight drill types', focuses.length === 9, focuses.join(','));
const drilled = [];
for (const task of ['1', '12', '7']) {
  await page.selectOption('#taskf', task);
  for (const f of focuses) {
    await page.selectOption('#focus', f); await page.waitForTimeout(80);
    const len = (await page.textContent('#q')).trim().length;
    if (len < 20) drilled.push(`task ${task} / ${f}: ${len}`);
  }
}
ok('every drill type renders a question for tasks 1, 12 and 7', drilled.length === 0, drilled.slice(0, 3).join(' | '));
ok('the terminal drill takes input and answers', await (async () => {
  await page.selectOption('#taskf', '7'); await page.selectOption('#focus', 'term'); await page.waitForSelector('#ti', { timeout: 5000 });
  const before = (await page.textContent('#term')).length;
  await page.fill('#ti', 'hint'); await page.press('#ti', 'Enter'); await page.waitForTimeout(150);
  return (await page.textContent('#term')).length > before;
})());

ok('a clean terminal run (task 7, the syslog session added in v2.82.0) is graded and promotes the cell', await (async () => {
  await page.selectOption('#taskf', '7'); await page.selectOption('#focus', 'term'); await page.waitForSelector('#ti');
  const cmds = await page.evaluate(() => CLI[7].cmds.map((x) => x.c));
  for (const c of cmds) { await page.fill('#ti', c); await page.press('#ti', 'Enter'); await page.waitForTimeout(120); }
  const fb = (await page.textContent('#fb')).trim();
  const box = await page.evaluate(() => JSON.parse(localStorage.getItem('nst.ncm-practice.v1')).box['7:cmd']);
  return /clean/i.test(fb) && box >= 1;
})());

// answer a practice question
await page.click('#nav button[data-s="practice"]'); await page.waitForTimeout(200);
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('nst.ncm-practice.v1') || '{"seen":0}').seen || 0);
await page.evaluate(() => { mark(1, 'recall', true); });
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('nst.ncm-practice.v1')));
ok('answering writes progress to the nst. key', after.seen === before + 1 && after.box['1:recall'] === 1 && !!after.updated, JSON.stringify(after).slice(0, 120));
ok('there is no stray legacy key', await page.evaluate(() => !localStorage.getItem('ncm-drill-v1')));

// backup carries it
const env = await page.evaluate(() => { const e = window.NSTBackup.envelope(); return { keys: Object.keys(e.data), tools: e.summary.tools }; });
ok('the shared backup includes the progress, labelled NCM practice', env.keys.includes('nst.ncm-practice.v1') && env.tools.includes('NCM practice'), JSON.stringify(env));

// merge: newer wins both ways
const merged = await page.evaluate(() => {
  const B = window.NSTBackup, e = B.envelope();
  const mk = (u, n) => JSON.stringify({ updated: u, seen: n, box: {} });
  const put = (u, n) => B.restore(JSON.stringify({ app: e.app, format: e.format, data: { 'nst.ncm-practice.v1': mk(u, n) } }), { mode: 'merge' });
  localStorage.setItem('nst.ncm-practice.v1', mk('2026-06-01T00:00:00Z', 10));
  put('2026-01-01T00:00:00Z', 999);           // older incoming: ignored
  const afterOld = JSON.parse(localStorage.getItem('nst.ncm-practice.v1')).seen;
  put('2026-09-01T00:00:00Z', 20);            // newer incoming: adopted
  const afterNew = JSON.parse(localStorage.getItem('nst.ncm-practice.v1')).seen;
  return { afterOld, afterNew };
});
ok('[neg] an OLDER synced record does not overwrite newer local progress', merged.afterOld === 10, merged.afterOld);
ok('a NEWER synced record is adopted', merged.afterNew === 20, merged.afterNew);

// a pull that changes storage makes the page re-read it (otherwise its next save would clobber the merge)
const reread = await page.evaluate(() => {
  localStorage.setItem('nst.ncm-practice.v1', JSON.stringify({ box: { '3:loc': 3 }, fade: {}, cfade: {}, seen: 50, right: 40, streak: 2, v: 2, updated: '2026-10-01T00:00:00Z' }));
  window.dispatchEvent(new CustomEvent('nst-sync-pulled', { detail: { keys: 1 } }));
  return S.seen;
});
ok('on nst-sync-pulled the page re-reads its progress from storage', reread === 50, reread);

ok('no request left the site', external.length === 0, external.slice(0, 3).join(' | '));
ok('no console error, page error or CSP violation', issues.length === 0, [...new Set(issues)].slice(0, 3).join(' | '));

// the launcher card opens it
await page.goto(`${BASE}/`, { waitUntil: 'load' });
const card = await page.$('a.nst-card--lab[href="./ncm-practice/"]');
ok('the launcher shows an NCM-MCI Lab Practice card', !!card);

// the certification gate: the three bank tools stay locked until an exam is chosen; the lab tool does not
await page.evaluate(() => { try { localStorage.removeItem('nst.activeBank'); } catch (e) {} });
await page.goto(`${BASE}/`, { waitUntil: 'load' });
await page.waitForSelector('.nst-certvar', { timeout: 15000 });
const locked = await page.$$eval('[data-needs-cert]', (a) => a.map((x) => x.getAttribute('aria-disabled')));
ok('with no exam chosen, WWTBANE, StarNix and Practice Exams are locked', locked.length === 3 && locked.every((v) => v === 'true'), locked.join(','));
ok('the lab tool is not gated', (await page.$eval('.nst-card--lab', (a) => a.getAttribute('aria-disabled'))) === null);
await page.click('a[data-tool="StarNix"]', { force: true }); await page.waitForTimeout(300);
ok('[neg] clicking a locked tool does not leave the launcher', new URL(page.url()).pathname === '/', page.url());
await page.click('.nst-certvar >> nth=0'); await page.waitForTimeout(300);
const unlocked = await page.$$eval('[data-needs-cert]', (a) => a.map((x) => x.getAttribute('aria-disabled')));
ok('choosing an exam unlocks all three', unlocked.every((v) => v === null), unlocked.join(','));

await browser.close();
server.kill('SIGKILL');
console.log('\n' + (fail ? `NCM PRACTICE: ${fail} FAILED of ${pass + fail}` : `NCM PRACTICE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
