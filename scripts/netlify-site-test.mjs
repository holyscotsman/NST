/* netlify-site-test.mjs — the site Netlify will publish is complete, and contains only what it should.
 *
 * scripts/netlify-build.mjs copies a whitelist into dist/. Two ways that goes wrong, and neither is loud:
 *   - a file a page needs is missing from the whitelist: a tool loads half-broken on Netlify and nobody sees it
 *     on GitHub Pages (which serves the whole repository)
 *   - something that should never be public is in dist: tests, the VM server, scratch files
 * So this builds into a temporary folder, serves THAT, opens the launcher and every tool in a real browser, and
 * fails on any request that does not come back, then lists what must not be there.
 *
 * Needs a browser. Run: node scripts/netlify-site-test.mjs
 */
import { existsSync, mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { join, relative } from 'node:path';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';
import { build, PUBLISH } from './netlify-build.mjs';

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

const out = mkdtempSync(join(tmpdir(), 'nst-dist-'));
const { files } = build(out);
ok('the build produces a site', files > 100, files);

const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const all = walk(out).map((p) => relative(out, p));
const found = (re) => all.filter((f) => re.test(f));
ok('every whitelisted entry is present', PUBLISH.every((p) => existsSync(join(out, p))));
ok('[neg] no tests are published', found(/(^|\/)(tests?|shots)\//).length === 0 && found(/\.test\.m?js$/).length === 0, found(/(^|\/)tests?\//).slice(0, 3).join(','));
ok('[neg] the VM server, the repo scripts and the Netlify sources are not published', found(/^(server|netlify|node_modules|\.github|docs)\//).length === 0 && found(/^scripts\/(?!nst-home\.js)/).length === 0, found(/^(server|netlify|scripts)\//).slice(0, 3).join(','));
ok('[neg] question-bank drafts and provenance are not published', found(/^banks\/(drafts|provenance)\//).length === 0);
ok('the NCM section (served only to signed-in people by the edge function) is in the deploy', found(/^ncm-practice\/index\.html$/).length === 1);
ok('the launcher, 404 and shared modules are present', ['index.html', '404.html', 'shared/nst-sync.js', 'shared/nst-backup.js', 'banks/manifest.json'].every((f) => all.includes(f)));

const PORT = 9300 + Math.floor(Math.random() * 500);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: out, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium', () => { server.kill('SIGKILL'); rmSync(out, { recursive: true, force: true }); });
const browser = await chromium.launch(launchOptions());
const BASE = `http://127.0.0.1:${PORT}`;
const PAGES = [['the launcher', '/'], ['WWTBANE', '/wwtbane/'], ['StarNix', '/starnix/'], ['Practice Exams', '/practice-exams/'], ['NCM-MCI Lab Practice', '/ncm-practice/']];
for (const [name, path] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('nst.activeBank', 'ncp-mci'); localStorage.setItem('wwtbane.quality', 'low'); } catch { /* storage blocked */ } });
  const page = await ctx.newPage();
  const bad = [], errs = [];
  page.on('response', (r) => { if (r.status() >= 400 && !/\/api\/(me|progress)$/.test(r.url())) bad.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  ok(`${name}: every file it asks for is in the published site`, bad.length === 0, bad.slice(0, 4).join(' | '));
  ok(`${name}: no page error`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
await browser.close();
server.kill('SIGKILL');
rmSync(out, { recursive: true, force: true });
console.log('\n' + (fail ? `NETLIFY SITE: ${fail} FAILED of ${pass + fail}` : `NETLIFY SITE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
