/* dialog-test.mjs — a dialog must never hide what it is asking you to agree to.
 *
 * THE DEFECT THIS EXISTS FOR
 * .nst-modal is capped at the viewport height and is `overflow: hidden`. That is
 * correct only because a child carries the scrolling: the stylesheet gives
 * `.nst-modal > .nst-modal-body` overflow-y:auto, so a tall dialog scrolls its
 * prose while the title and buttons stay put.
 *
 * Settings and Help are built that way. The two CONFIRM dialogs were not: they
 * appended their paragraphs straight to .nst-modal, with no .nst-modal-body
 * anywhere. Nothing in them could scroll, so once the window got short the text
 * was clipped by the cap and there was no way to reach it.
 *
 * Measured on the real page, before the fix:
 *
 *   480x280 larger-text   content 248px in a 230px box   nothing scrollable
 *   390x260 larger-text   content 292px in a 210px box   nothing scrollable
 *   320x240 larger-text   content 342px in a 190px box   152px unreachable
 *
 * The dialog in question is "Reset all saved data?", and the clipped sentence is
 * the one naming what is about to be permanently destroyed. The buttons stayed
 * visible -- the flex column shrank the prose rather than the button row -- so
 * the failure mode was not a broken-looking dialog. It was a working-looking
 * dialog with the warning cut out of it, and a "Reset everything" button.
 *
 * Note which viewports those are. Larger text is an accessibility preference, and
 * turning it on is what moves the threshold from a window under 264px tall to one
 * under about 340px. The setting that exists to make the text readable was what
 * made it unreachable.
 *
 * WHAT THIS CHECKS
 * A sweep, not a list. Every dialog the launcher can open is opened at a range of
 * window heights, and the rule is the same for all of them: if the panel's
 * content is taller than its box, something inside it must actually scroll. A
 * dialog added later is covered the day it is added.
 *
 * Plus a static rule the browser half cannot reach: confirmRestore needs a real
 * backup file to appear, so instead the source is read and no dialog is allowed
 * to append body text directly to a .nst-modal. That rule runs with or without a
 * browser.
 *
 * Needs a browser for the sweep. Run:
 *   node scripts/dialog-test.mjs        (expects a static server on :8124)
 * Skips the sweep without one; CI sets NST_REQUIRE_BROWSER=1 so that fails.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const B = process.env.NST_BASE || 'http://localhost:8124';

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- the static rule: body text belongs in a body ----
 *
 * Deliberately reads the source rather than the DOM, because confirmRestore only
 * appears after somebody picks a backup file. Catching the pattern catches the
 * dialog the sweep can never open. */
{
  const src = readFileSync(join(ROOT, 'scripts', 'nst-home.js'), 'utf8');
  const direct = [];
  const re = /(\w+)\.appendChild\(\s*el\(\s*"p"\s*,\s*"nst-modal-body-text"/g;
  let m;
  while ((m = re.exec(src))) if (m[1] === 'modal') direct.push(src.slice(m.index, m.index + 60));
  ok('no dialog appends body text straight to .nst-modal',
    direct.length === 0,
    direct.join(' | ') + ' -- .nst-modal is overflow:hidden with a viewport cap; ' +
    'only .nst-modal-body scrolls, so this text would be unreachable on a short window');

  /* And the rule is not vacuous. */
  const planted = src.replace(
    /var rbody = el\("div", "nst-modal-body"\);\s*rbody\.appendChild\(/,
    'var rbody = el("div", "nst-modal-body");\n    modal.appendChild(');
  const plantedHits = [];
  const re2 = /(\w+)\.appendChild\(\s*el\(\s*"p"\s*,\s*"nst-modal-body-text"/g;
  while ((m = re2.exec(planted))) if (m[1] === 'modal') plantedHits.push(1);
  ok('self-check: the rule catches a paragraph moved back onto the modal',
    planted !== src && plantedHits.length === 1, plantedHits.length + ' hits');

  /* Whatever does the scrolling has to still be told to scroll. */
  const css = readFileSync(join(ROOT, 'styles', 'nst-home.css'), 'utf8');
  ok('.nst-modal-body is the element the stylesheet makes scrollable',
    /\.nst-modal\s*>\s*\.nst-modal-body\s*\{[^}]*overflow-y:\s*auto/.test(css));
  ok('a small dialog does not pad its body a second time',
    /\.nst-modal-sm\s*>\s*\.nst-modal-body\s*\{[^}]*padding:\s*0/.test(css));
  ok('the title and the action row are pinned, so the prose is what shrinks',
    /\.nst-modal\s*>\s*\.nst-modal-actions\s*\{[^}]*flex:\s*0\s+0\s+auto/.test(css));
}

if (fail) {
  console.log(`\nDIALOGS: ${fail} FAILED (${pass} passed) -- static rules, before the browser sweep`);
  process.exit(1);
}

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const browser = await chromium.launch(launchOptions());

/* Every dialog the launcher can open, and how to get to it. */
/* `open` returns false when the trigger is not on screen at this width. The nav
 * deliberately drops the Help button on a narrow viewport, and a dialog nobody
 * can open cannot clip anything -- but a silent skip is how a sweep ends up
 * measuring nothing, so it is reported, and the tally below requires each dialog
 * to have been measured at a short size anyway. */
const click = async (p, sel) => {
  const el = await p.$(sel);
  if (!el || !(await el.isVisible())) return false;
  await el.click();
  return true;
};
const DIALOGS = [
  { name: 'Settings', open: (p) => click(p, '#nst-settings-btn') },
  { name: 'Help',     open: (p) => click(p, '#nst-help-btn') },
  { name: 'Reset confirm', open: async (p) => {
      if (!await click(p, '#nst-settings-btn')) return false;
      await p.waitForTimeout(200);
      return click(p, '.nst-modal .nst-btn-danger');
    } },
];

/* Short windows, and the accessibility preference that makes every one of them
 * shorter. These are small but real: a snapped half-height window, a phone in
 * landscape with the browser chrome showing. */
const SIZES = [
  [1280, 900, false], [900, 520, false], [740, 300, false],
  [568, 320, true], [480, 280, true], [390, 260, true], [320, 240, true],
];

/* The measurement, run inside the page. "Reachable" is the whole question: a
 * panel whose content overflows is fine if something scrolls, and broken if
 * nothing does. */
const MEASURE = `(() => {
  const panels = [...document.querySelectorAll('.nst-modal')].filter((m) => m.offsetParent !== null);
  const m = panels[panels.length - 1];
  if (!m) return { err: 'no dialog' };
  const overflowing = (e) => e.scrollHeight > e.clientHeight + 1;
  const scrolls = (e) => {
    const s = getComputedStyle(e);
    return (s.overflowY === 'auto' || s.overflowY === 'scroll') && overflowing(e);
  };
  const unreachable = overflowing(m) && !scrolls(m) && ![...m.querySelectorAll('*')].some(scrolls);
  const actions = m.querySelector('.nst-modal-actions');
  const btns = actions ? [...actions.querySelectorAll('button')] : [];
  const mb = m.getBoundingClientRect();
  return {
    title: (m.querySelector('.nst-modal-title') || {}).textContent || '',
    hidden: Math.max(0, m.scrollHeight - m.clientHeight),
    unreachable,
    squashed: btns.filter((b) => b.getBoundingClientRect().height < 24).length,
    outside: btns.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.bottom > mb.bottom + 1 || r.top < mb.top - 1;
    }).length,
  };
})()`;

async function look(d, [w, h, larger], mutate) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(B + '/index.html', { waitUntil: 'load' });
  if (larger) {
    await page.evaluate(() => localStorage.setItem('nst.prefs', JSON.stringify({ largerText: true })));
    await page.reload({ waitUntil: 'load' });
  }
  await page.waitForTimeout(250);
  const opened = await d.open(page);
  if (!opened) { await ctx.close(); return { skipped: true }; }
  await page.waitForTimeout(250);
  if (mutate) await page.evaluate(mutate);
  const r = await page.evaluate(MEASURE);
  await ctx.close();
  return r;
}

const SHORT = SIZES.filter(([, h]) => h <= 320);
const measuredShort = new Map(DIALOGS.map((d) => [d.name, 0]));

for (const d of DIALOGS) {
  for (const size of SIZES) {
    const [w, h, lg] = size;
    const r = await look(d, size);
    const where = `${d.name} at ${w}x${h}${lg ? ' with larger text' : ''}`;
    if (r.skipped) { console.log(`n/a  ${where}: its trigger is not on screen at this width`); continue; }
    if (r.err) { ok(`${where}: opens`, false, r.err); continue; }
    if (h <= 320) measuredShort.set(d.name, measuredShort.get(d.name) + 1);
    ok(`${where}: nothing is clipped out of reach`, !r.unreachable,
      `${r.hidden}px of "${r.title}" is past the cap with no scroller`);
    ok(`${where}: the buttons are not squashed under 24px`, r.squashed === 0, r.squashed + ' squashed');
    ok(`${where}: the buttons stay inside the panel`, r.outside === 0, r.outside + ' outside');
  }
}

/* A dialog whose trigger vanished at every short size would pass this whole
 * sweep without being looked at once. */
for (const [name, n] of measuredShort) {
  ok(`${name} was actually measured on a short window`, n > 0,
    `0 of ${SHORT.length} short sizes -- the sweep never saw it`);
}

/* ---- the sweep can see the defect it exists for ----
 *
 * Re-parent the reset confirm's paragraphs onto the modal, exactly as the code
 * did before the fix, and require the rule to fail at the sizes where it used
 * to. If this passes, the sweep is measuring something other than the dialog. */
{
  const unwrap = () => {
    const m = [...document.querySelectorAll('.nst-modal')].pop();
    const body = m && m.querySelector('.nst-modal-body');
    if (!body) return;
    const actions = m.querySelector('.nst-modal-actions');
    while (body.firstChild) m.insertBefore(body.firstChild, actions);
    body.remove();
  };
  const reset = DIALOGS[2];
  const broken = await look(reset, [320, 240, true], unwrap);
  ok('self-check: the pre-fix structure is caught at 320x240 with larger text',
    broken.unreachable === true, JSON.stringify(broken));
  const brokenMid = await look(reset, [480, 280, true], unwrap);
  ok('self-check: and at 480x280, where it also used to clip',
    brokenMid.unreachable === true, JSON.stringify(brokenMid));
  const roomy = await look(reset, [1280, 900, false], unwrap);
  ok('self-check: but not on a window with room, where there is nothing to hide',
    roomy.unreachable === false, JSON.stringify(roomy));
}

await browser.close();
console.log('\n' + (fail ? `DIALOGS: ${fail} FAILED (${pass} passed)` : `DIALOGS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
