/* mobile-audit.mjs — phone-viewport layout audit of StarNix's in-game screens.
 *
 * The earlier mobile passes covered the launcher, Practice Exams and WWTBANE.
 * StarNix's *in-game* surfaces — ARM's briefing/flight/question panel, KBB's
 * how-to/shop/battle, CC's intro — were never measured at phone width, and they
 * are the densest layouts in the site. This drives each one through the shipped
 * test seams and measures what the eye misses:
 *
 *   - content pushed outside the viewport, or a container that scrolls sideways
 *   - content hard-clipped by an overflow:hidden ancestor and thus unreachable
 *     (a centred nowrap flex row loses BOTH ends this way)
 *   - interactive controls under the WCAG 2.2 SC 2.5.8 (AA) 24x24 minimum
 *
 * Screenshots are written alongside for review. Needs a browser and a served
 * copy of the site, so it is not a CI gate (CI stays dependency-free). Run:
 *   node starnix/build.mjs && node scripts/mobile-audit.mjs
 *   (expects a static server on :8124 serving the repo root)
 */
import { mkdirSync } from 'node:fs';

async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try { const m = await import(spec); const c = m.chromium || (m.default && m.default.chromium); if (c) return c; }
    catch { /* try the next location */ }
  }
  return null;
}
const chromium = await loadChromium();
if (!chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
const EXE = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = process.env.NST_BASE || 'http://localhost:8124';
const VW = Number(process.env.VW || 390), VH = Number(process.env.VH || 844);
const OUT = process.env.NST_SHOTS || '';
if (OUT) mkdirSync(OUT, { recursive: true });

// WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA. 44px is SC 2.5.5 (AAA) —
// reported separately as advisory, since the in-game HUDs are deliberately dense.
const MIN_AA = 24, MIN_AAA = 44;
// px of tolerance before an overflow counts — below this it is subpixel/rounding noise.
const SLACK = 8;

let pass = 0, fail = 0, advisory = 0;
const ok = (n, c) => { console.log((c ? 'ok   ' : 'FAIL ') + n); c ? pass++ : fail++; };

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const page = await browser.newPage({
  viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
// StarNix shows a "no bank" screen with no bank selected, and no game will mount.
await page.addInitScript(() => { try { localStorage.setItem('nst.activeBank', 'ncp-mci-25'); } catch (e) {} });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));
const sleep = (ms) => page.waitForTimeout(ms);

/* Measure the screen currently mounted. */
async function audit(name) {
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` });
  const r = await page.evaluate(({ vw, minAA, minAAA, slack }) => {
    const out = { docScrollW: document.documentElement.scrollWidth, over: [], unreachable: [], scrollers: [], aa: [], aaa: [] };
    const desc = (el) => {
      const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '';
      return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
             (cls ? '.' + String(cls).trim().split(/\s+/).slice(0, 2).join('.') : '');
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05;
    };
    const isInteractive = (el) => el.tagName === 'BUTTON' || el.tagName === 'A' ||
      el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.getAttribute('role') === 'button';
    // does this element render text of its own (not just via children)?
    const hasOwnText = (el) => {
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
      return false;
    };
    // nearest ancestor that constrains horizontal overflow
    const clipper = (el) => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== 'visible') return { el: p, ox };
        p = p.parentElement;
      }
      return null;
    };

    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el)) continue;
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;

      // A whole container that scrolls sideways lets the player drag the layout mid-play.
      // Only a real scroll container can be dragged; on an overflow:visible element a wide
      // child simply paints outside its box, which is normal and harmless.
      const ox = getComputedStyle(el).overflowX;
      if (el.scrollWidth > el.clientWidth + slack && (ox === 'auto' || ox === 'scroll')) {
        out.scrollers.push({ el: desc(el), scrollW: el.scrollWidth, clientW: el.clientWidth });
      }

      // Only content the player must read or press counts. Decorative art is routinely
      // cropped on purpose (ARM's briefing is a full-bleed cockpit), so ignore it.
      const matters = isInteractive(el) || hasOwnText(el);
      if (matters) {
        const c = clipper(el);
        if (c) {
          const cb = c.el.getBoundingClientRect();
          const outLeft = (cb.left + c.el.clientLeft) - b.left;
          const outRight = b.right - (cb.left + c.el.clientLeft + c.el.clientWidth);
          const worst = Math.max(outLeft, outRight);
          // overflow-x:hidden cannot be scrolled, so anything outside is lost for good
          if (worst > slack && c.ox === 'hidden') {
            out.unreachable.push({ el: desc(el), by: Math.round(worst), inside: desc(c.el),
              text: (el.textContent || '').trim().slice(0, 20) });
          }
        } else if (b.right > vw + slack || b.left < -slack) {
          out.over.push({ el: desc(el), left: Math.round(b.left), right: Math.round(b.right) });
        }
      }

      if (isInteractive(el) && !el.disabled) {
        const w = Math.round(b.width), h = Math.round(b.height);
        const rec = { el: desc(el), w, h, text: (el.textContent || '').trim().slice(0, 20) };
        if (w < minAA || h < minAA) out.aa.push(rec);
        else if (w < minAAA || h < minAAA) out.aaa.push(rec);
      }
    }
    return out;
  }, { vw: VW, minAA: MIN_AA, minAAA: MIN_AAA, slack: SLACK });

  const problems = [];
  if (r.docScrollW > VW + 1) problems.push(`document scrolls sideways (${r.docScrollW}px > ${VW}px)`);
  const dedup = (list, fmt) => {
    const seen = new Set();
    for (const x of list) { const k = x.el; if (seen.has(k)) continue; seen.add(k); problems.push(fmt(x)); }
  };
  dedup(r.unreachable, (x) => `unreachable: ${x.el} "${x.text}" sits ${x.by}px outside ${x.inside} (overflow-x:hidden)`);
  dedup(r.scrollers, (x) => `scrolls sideways: ${x.el} (${x.scrollW} > ${x.clientW})`);
  dedup(r.over, (x) => `outside viewport: ${x.el} [${x.left}..${x.right}]`);
  dedup(r.aa, (x) => `target ${x.w}x${x.h} < ${MIN_AA} (WCAG AA): ${x.el} "${x.text}"`);

  ok(`${name} — layout`, problems.length === 0);
  for (const p of problems) console.log('       ' + p);
  const seenAdv = new Set();
  for (const x of r.aaa) { if (seenAdv.has(x.el)) continue; seenAdv.add(x.el); advisory++;
    console.log(`     · advisory: ${x.el} ${x.w}x${x.h} < ${MIN_AAA} (AAA) "${x.text}"`); }
}

console.log(`StarNix in-game mobile audit @ ${VW}x${VH}\n`);
await page.goto(B + '/starnix/index.html', { waitUntil: 'load' });
await sleep(2500);

await page.evaluate(() => window.StarNix.shell.showMenu());
await sleep(600); await audit('menu');
await page.evaluate(() => window.StarNix.shell.showStats());
await sleep(600); await audit('progress');
await page.evaluate(() => window.StarNix.shell.showSettings());
await sleep(500); await audit('settings');

/* ARM — briefing, flight, question panel */
await page.evaluate(() => window.StarNix.shell.showMenu());
await sleep(300);
await page.evaluate(() => window.StarNix.shell.enterGame('ARM'));
await page.waitForFunction(() => {
  const r = window.StarNix.shell.currentGameRoot; return !!(r && r.__armTest);
}, null, { timeout: 30000 });
await page.evaluate(() => window.StarNix.shell.currentGameRoot.__armTest.endBriefingIntro());
await sleep(600); await audit('arm-briefing');
await page.evaluate(() => { const T = window.StarNix.shell.currentGameRoot.__armTest; T.skipBriefing(); T.flushWarp(); });
await sleep(700); await audit('arm-flight');
await page.evaluate(() => { const T = window.StarNix.shell.currentGameRoot.__armTest; T.prepCore(1); T.arrive(1); });
await sleep(700); await audit('arm-question');
await page.evaluate(() => window.StarNix.shell.exitGame());
await sleep(400);

/* KBB — how-to tour, then the live battle. The cold open runs first; .kbb-skip is
   the "replay intro" control, NOT a skip, so wait the tour out rather than click it. */
await page.evaluate(() => window.StarNix.shell.enterGame('KBB'));
await page.waitForSelector('.kbb-howto', { timeout: 60000 });
await sleep(900); await audit('kbb-howto');
await page.evaluate(() => { const b = document.querySelector('.kbb-ht-skip'); if (b) b.click(); });
await page.waitForFunction(() => !document.querySelector('.kbb-howto'), null, { timeout: 20000 });
await sleep(900); await audit('kbb-battle');
await page.evaluate(() => window.StarNix.shell.exitGame());
await sleep(400);

/* CC */
await page.evaluate(() => window.StarNix.shell.enterGame('CC'));
await sleep(1800); await audit('cc-establishing');
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => /skip|continue|start|go/i.test(x.textContent || ''));
  if (b) b.click();
});
await sleep(1500); await audit('cc-run');
await page.evaluate(() => window.StarNix.shell.exitGame());
await sleep(300);

ok('no uncaught page errors', pageErrors.length === 0);
for (const e of pageErrors.slice(0, 6)) console.log('       ' + e);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed, ${advisory} advisory (AAA target size)`);
if (OUT) console.log('screenshots: ' + OUT);
process.exit(fail ? 1 : 0);
