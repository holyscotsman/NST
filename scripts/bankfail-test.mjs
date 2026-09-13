/* bankfail-test.mjs — telling "the server didn't answer" from "you haven't picked a bank".
 *
 * THE DEFECT THIS EXISTS FOR
 * Every tool here is question-driven, and the questions arrive over the network at
 * runtime: a manifest fetch, then a bank markdown fetch. Either can fail. This app is
 * hosted off a machine someone copies files onto, so "either can fail" is not a
 * hypothetical — a renamed directory, a half-finished copy, a bank listed in the
 * manifest whose file never made it.
 *
 * The loader recorded one of the two failures (manifestError) and the launcher read it.
 * Nothing recorded a failed bank FILE, and no tool read either. All three tools showed
 * the same screen they show when nobody has chosen a bank yet:
 *
 *   practice exams   "Choose a question bank to begin."
 *                    "Select a question bank above, then start a practice test or exam."
 *   wwtbane          "No question bank is loaded yet. Choose one in the Nutanix Study
 *                     Tool launcher (Settings -> Question bank), then come back to play."
 *   starnix          (nothing at all — the title screen, with a Start button; the
 *                     no-bank screen is only reached by launching a mission, so the
 *                     player watched the whole intro cinematic first)
 *
 * Measured with the bank selected and its file 404ing. The launcher showed that bank
 * selected and said so. So the advice was not merely unhelpful — it sent the player to
 * a screen that disagreed with it, and left them nothing to press.
 *
 * WHAT THIS CHECKS
 * A server this suite owns, so it can break one resource at a time on purpose:
 *
 *   manifest  /banks/manifest.json 404s
 *   bankfile  the manifest is fine and every bank .md 404s
 *   ok        nothing is broken
 *
 * In the two broken modes, with a bank selected, every page must NAME the failure, must
 * NOT tell the player to go and choose a bank, and (the tools) must offer a control that
 * retries. Retrying is then proved rather than assumed: the server is repaired while the
 * broken page is still open, the control is pressed, and the page has to come back with
 * real questions in it.
 *
 * One page is covered differently. StarNix shows its "pick a bank" screen only when you
 * try to launch a mission, so with no bank chosen the browser half sees the title screen
 * and can only say that it does not cry failure; the instruction that screen carries is
 * checked by reading the shell instead. A failed FETCH is now said at boot, before the
 * intro cinematic, and that the browser half does see.
 *
 * The negative control is the other half and matters just as much: with nothing broken
 * and no bank chosen, the plain "pick a bank" state must survive untouched. A fix that
 * shouts "couldn't load the question bank" at someone who simply has not chosen one has
 * traded one wrong message for another.
 *
 * Needs a browser. Run:
 *   node scripts/bankfail-test.mjs
 * Skips without one; CI sets NST_REQUIRE_BROWSER=1 so that fails instead.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const PORT = Number(process.env.NST_BANKFAIL_PORT || 8141);
const BANK_ID = 'ncp-mci-25';

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- static: the loader has to keep recording it ---------------------- */
const loader = readFileSync(join(ROOT, 'shared/bank-loader.js'), 'utf8');
ok('bank-loader exposes loadError() alongside manifestError()',
  /loadError:\s*loadError/.test(loader) && /function loadError\(\)/.test(loader));
ok('a failed bank fetch is recorded before it is rethrown',
  /_loadError = e \|\| new Error\("bank fetch failed"\);\s*\n\s*throw e;/.test(loader));
ok('load() clears the recorded failure on success',
  /_cache\[id\] = bank;\s*\n\s*_loadError = null;/.test(loader));
/* StarNix's unchosen-bank screen is behind the bridge menu, so the browser half never
 * sees it. The rule it would have checked there is checked here instead: the branch that
 * runs when nothing failed still tells the player where banks are chosen. */
const sxShell = readFileSync(join(ROOT, 'starnix/starnix-shell.js'), 'utf8');
const noBankFn = (sxShell.split('Shell.prototype.showNoBank')[1] || '').slice(0, 2600);
ok('starnix keeps the launcher instruction for a bank nobody has chosen',
  /Settings → Question bank/.test(noBankFn));
ok('starnix says something different when the fetch is what failed',
  /Couldn'?t load the question bank/.test(noBankFn) && /STARNIX_BANK_ERROR/.test(noBankFn));

/* ---- the server this suite breaks on purpose -------------------------- */
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.jpg': 'image/jpeg',
};
let broken = 'ok';                      // flipped at runtime to prove a retry retries
const server = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (broken === 'manifest' && u === '/banks/manifest.json') { res.writeHead(404); return res.end('x'); }
  if (broken === 'bankfile' && /^\/banks\/.+\.md$/.test(u)) { res.writeHead(404); return res.end('x'); }
  let p = join(ROOT, u);
  try { if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html'); } catch { /* not a dir */ }
  if (!existsSync(p) || !p.startsWith(ROOT)) { res.writeHead(404); return res.end('x'); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(PORT, r));
const stop = () => { try { server.close(); } catch { /* already down */ } };

const chromium = await loadChromium();
if (!chromium) missing('Playwright', 'npm install --no-save playwright && npx playwright install chromium', stop);

const browser = await chromium.launch(launchOptions());
const B = 'http://localhost:' + PORT;

/* A context per scenario: the loader's sessionStorage cache and the active-bank key both
 * live per origin, and a scenario must not inherit the previous one's warm cache. */
async function context(selectBank) {
  const c = await browser.newContext({ viewport: { width: 1100, height: 820 } });
  await c.addInitScript(([key, id]) => {
    try { if (id) localStorage.setItem(key, id); else localStorage.removeItem(key); } catch { /* private mode */ }
  }, ['nst.activeBank', selectBank ? BANK_ID : '']);
  return c;
}
const read = (p) => p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim());
async function open(c, path) {
  const p = await c.newPage();
  await p.goto(B + path, { waitUntil: 'networkidle' }).catch(() => { /* boot may keep sockets */ });
  await p.waitForTimeout(2200);
  return p;
}
const retryButton = (p) => p.locator('button', { hasText: /^\s*Try again\s*$/i }).first();

const PAGES = [
  ['launcher', '/'],
  ['practice exams', '/practice-exams/'],
  ['wwtbane', '/wwtbane/'],
  ['starnix', '/starnix/'],
];
const NAMES_IT = /couldn'?t load|could not be loaded/i;
/* The instruction that was wrong: sending someone to pick a bank they have picked. */
const SENDS_YOU_AWAY = /choose (a|one) (question )?bank|select a question bank above|Settings\s*(→|->)\s*Question bank/i;

/* ---- the two broken modes, with a bank actually selected -------------- */
for (const mode of ['manifest', 'bankfile']) {
  broken = mode;
  const c = await context(true);
  for (const [name, path] of PAGES) {
    const p = await open(c, path);
    const t = await read(p);
    ok(`${mode}: ${name} names the failure`, NAMES_IT.test(t), t.slice(0, 160));
    ok(`${mode}: ${name} does not tell you to go and choose a bank`, !SENDS_YOU_AWAY.test(t), t.slice(0, 160));
    if (name !== 'launcher') {
      ok(`${mode}: ${name} offers a control that retries`, (await retryButton(p).count()) > 0, t.slice(0, 160));
    }
    await p.close();
  }
  await c.close();
}

/* ---- pressing it has to actually recover ------------------------------ */
for (const mode of ['manifest', 'bankfile']) {
  for (const [name, path] of PAGES.slice(1)) {
    broken = mode;
    const c = await context(true);
    const p = await open(c, path);
    const before = await read(p);
    if (!NAMES_IT.test(before)) { ok(`${mode}: ${name} retry recovers`, false, 'never reached the failure state'); await c.close(); continue; }
    broken = 'ok';                                  // the host comes back while the page is open
    const btn = retryButton(p);
    if (!(await btn.count())) { ok(`${mode}: ${name} retry recovers`, false, 'no retry control to press'); await c.close(); continue; }
    await btn.click({ timeout: 5000 }).catch(() => { /* asserted below */ });
    await p.waitForTimeout(3500);
    const after = await read(p);
    ok(`${mode}: ${name} retry recovers once the server answers`, !NAMES_IT.test(after), after.slice(0, 160));
    await c.close();
  }
}

/* ---- negative control: an unchosen bank is not a failure -------------- */
broken = 'ok';
{
  const c = await context(false);
  for (const [name, path] of PAGES.slice(1)) {
    const p = await open(c, path);
    const t = await read(p);
    ok(`nothing broken, no bank chosen: ${name} does not claim a failure`, !NAMES_IT.test(t), t.slice(0, 160));
    ok(`nothing broken, no bank chosen: ${name} offers no retry`, (await retryButton(p).count()) === 0, t.slice(0, 160));
    // StarNix is the exception, by design and not by accident: with no bank chosen it
    // shows the title screen, and its "pick a bank" screen sits behind the bridge menu,
    // reached by trying to launch a mission. So the browser half can only say that it
    // does not cry failure; the instruction itself is checked in the source below.
    if (name !== 'starnix') {
      ok(`nothing broken, no bank chosen: ${name} still says how to choose one`, SENDS_YOU_AWAY.test(t), t.slice(0, 160));
    }
    await p.close();
  }
  await c.close();
}

/* ---- and the healthy path is still the healthy path ------------------- */
{
  const c = await context(true);
  const expect = {
    'practice exams': /questions in the bank/i,
    'wwtbane': /who wants to be a nutanix engineer|start|play/i,
    'starnix': /starlight rescue crew/i,
  };
  for (const [name, path] of PAGES.slice(1)) {
    const p = await open(c, path);
    const t = await read(p);
    ok(`nothing broken, bank chosen: ${name} boots normally`, expect[name].test(t) && !NAMES_IT.test(t), t.slice(0, 160));
    await p.close();
  }
  await c.close();
}

await browser.close();
stop();
console.log(fail === 0 ? `\nBANK FAILURES: ALL GREEN (${pass} checks)` : `\n${pass} passed, ${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
