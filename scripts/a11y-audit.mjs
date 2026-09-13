/* a11y-audit.mjs — accessibility audit of the launcher and Practice Exams.
 *
 * TWO HALVES, BECAUSE ONE IS NOT ENOUGH
 *
 * 1. axe-core, across every surface including the ones only reachable by
 *    interacting (the Settings dialog, a checked question, a live exam).
 *    Automated rules catch on the order of a third of WCAG failures — worth
 *    having, never sufficient.
 *
 * 2. The keyboard checks axe cannot make, which is where the real defects were:
 *    - every interactive element has an accessible name
 *    - every one changes appearance when focused (an invisible focus ring is a
 *      keyboard user navigating blind)
 *    - focus survives a view change. Replacing container.innerHTML destroys
 *      whatever the keyboard was on and drops focus to <body>, so the next Tab
 *      restarts from the top of the document. axe sees a perfect page; someone
 *      who pressed Enter on "Start practicing" has to tab past everything to
 *      reach question one. This is what caught it.
 *    - the modal traps focus, Escape closes it, and focus returns to the opener
 *    - the first paint does NOT steal focus: moving it before anyone has
 *      interacted interrupts a screen reader's page-load announcement
 *    - every tap target meets WCAG 2.2 SC 2.5.8 (AA), 24x24 CSS px
 *    - a phone held sideways still works: the site is only ever measured in
 *      portrait, and landscape is the shorter, more crowded viewport
 *
 * TWO NOTES ON MEASURING FOCUS, BOTH LEARNED THE HARD WAY
 *
 * The probe that tests focus rings has to focus each element in turn, which
 * destroys the very state the focus-after-view-change check reads. Ask where
 * focus is FIRST. (The first version of this file did not, and reported that a
 * working fix had failed.)
 *
 * And a ring styled with :focus-visible only appears in KEYBOARD modality.
 * Chrome decides that from the last real input event, so after any click in the
 * setup a programmatic .focus() matches :focus but not :focus-visible, and every
 * correctly-styled control reports "no focus ring". Press a key first. (The same
 * first version reported four such false failures, all on pages whose setup
 * happened to click something.)
 *
 * Needs a browser, axe-core and a served copy of the site, so it is not a CI
 * gate (CI stays dependency-free). Run:
 *   npm install --no-save axe-core
 *   node scripts/a11y-audit.mjs
 *   (expects a static server on :8124 serving the repo root)
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try { const m = await import(spec); const c = m.chromium || (m.default && m.default.chromium); if (c) return c; }
    catch { /* try the next location */ }
  }
  return null;
}
function loadAxe() {
  const candidates = [
    join(HERE, '..', 'node_modules', 'axe-core', 'axe.min.js'),
    join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
    process.env.AXE_PATH || '',
  ].filter(Boolean);
  for (const c of candidates) { if (existsSync(c)) return readFileSync(c, 'utf8'); }
  return null;
}

const chromium = await loadChromium();
if (!chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
const AXE = loadAxe();
if (!AXE) {
  console.log('SKIP: axe-core not found. Install it first:  npm install --no-save axe-core');
  process.exit(0);
}

const EXE = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = process.env.NST_BASE || 'http://localhost:8124';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* A store with real history, so the surfaces under test are the populated ones
 * rather than their empty states. */
const NOW = Date.now();
const RECS = {};
for (let i = 1; i <= 25; i++) {
  const id = 'ncp25-q' + String(i).padStart(2, '0');
  RECS[id] = {
    id, box: i % 7, seen: 3, correct: 2, incorrect: 1, streak: 1,
    lastSeen: NOW - i * 86400000, firstCorrectAt: NOW - 30 * 86400000, lastRun: -1,
  };
}
const SEED = `(() => { localStorage.clear();
  localStorage.setItem('nst.activeBank','ncp-mci-25');
  localStorage.setItem('nst.mastery.v1', ${JSON.stringify(JSON.stringify({ format: 1, records: RECS, updatedAt: NOW }))});
  localStorage.setItem('nst.practice-exams.history.v1', ${JSON.stringify(JSON.stringify([{ pct: 84, pass: true, at: NOW - 86400000 }]))});
})()`;

/* Named, focusable, and visibly focused. Runs INSIDE the page. */
const FOCUS_PROBE = () => {
  const SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
  const els = [...document.querySelectorAll(SEL)].filter((e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  });
  const unnamed = [], noRing = [];
  for (const e of els) {
    // An inert subtree (the page behind an open dialog) cannot take focus at
    // all, by design. Probing it for a focus ring measures the inertness, not
    // the styling.
    if (e.closest('[inert]')) continue;
    // Measure from an unfocused baseline: the control the dialog focuses on
    // open is already focused when this runs, so focusing it again changes
    // nothing and it reports as having no ring.
    if (document.activeElement === e) e.blur();
    const name = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.value || '').trim();
    if (!name) unnamed.push((e.className || e.tagName).toString().slice(0, 40));
    const b = getComputedStyle(e);
    const before = [b.outlineWidth, b.outlineStyle, b.outlineColor, b.boxShadow, b.borderColor, b.backgroundColor].join('|');
    e.focus();
    const a = getComputedStyle(e);
    const after = [a.outlineWidth, a.outlineStyle, a.outlineColor, a.boxShadow, a.borderColor, a.backgroundColor].join('|');
    if (before === after) noRing.push((e.className || e.tagName).toString().slice(0, 30) + ' "' + name.slice(0, 22) + '"');
    e.blur();
  }
  return { total: els.length, unnamed, noRing };
};

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });

async function open(url, prep) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.evaluate(SEED);
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1600);
  if (prep) await prep(p);
  return { p, errs };
}

async function surface(label, url, prep, expectFocus) {
  const { p, errs } = await open(url, prep);

  // Where focus IS -- before the probe below moves it.
  const focused = await p.evaluate(() => {
    const a = document.activeElement;
    return a === document.body ? null : (a.className || a.tagName).toString();
  });

  // page.evaluate runs outside the page's CSP, so axe can be defined even where
  // an injected <script> would be blocked.
  await p.evaluate(AXE);
  const violations = await p.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help }));
  });
  ok(`${label} — no axe violations`, violations.length === 0,
    violations.map((v) => `${v.id}(${v.n})`).join(', '));
  for (const v of violations) console.log(`       [${(v.impact || '?').toUpperCase()}] ${v.id} × ${v.n} — ${v.help}`);

  // Put Chrome in keyboard modality before probing rings -- see the header.
  await p.keyboard.press('Shift');
  const r = await p.evaluate(FOCUS_PROBE);
  ok(`${label} — every control has an accessible name (${r.total} controls)`,
    r.unnamed.length === 0, r.unnamed.slice(0, 4).join(', '));
  ok(`${label} — every control shows focus`, r.noRing.length === 0, r.noRing.slice(0, 4).join(', '));

  if (expectFocus !== undefined) {
    if (expectFocus === null) {
      ok(`${label} — the first paint does not steal focus`, focused === null, focused);
    } else {
      ok(`${label} — focus lands on ${expectFocus}`,
        !!focused && focused.indexOf(expectFocus) >= 0, focused === null ? 'BODY (lost)' : focused);
    }
  }
  ok(`${label} — no page errors`, errs.length === 0, errs.slice(0, 2).join(' ;; '));
  await p.close();
}

await surface('launcher', `${B}/`);
await surface('launcher settings dialog', `${B}/`, async (p) => {
  await p.click('#nst-settings-btn'); await p.waitForTimeout(600);
});
await surface('launcher help dialog', `${B}/`, async (p) => {
  await p.click('#nst-help-btn'); await p.waitForTimeout(600);
});
await surface('practice exams entry', `${B}/practice-exams/`, null, null);
await surface('practice mode', `${B}/practice-exams/`, async (p) => {
  await p.focus('.pe-modecard-practice');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(900);
  await p.click('.pe-opt');
  await p.click('.pe-check');
  await p.waitForTimeout(500);
  // No focus expectation here: this setup deliberately clicks through to a
  // checked question, so focus belongs on the button that was clicked. Where
  // focus lands on ENTERING a mode is tested in the round-trip section below.
});
await surface('exam mode', `${B}/practice-exams/`, async (p) => {
  await p.focus('.pe-modecard-exam');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(900);
}, 'pe-bar-title');

/* ---- the dialog's keyboard contract ---- */
{
  const { p } = await open(`${B}/`);
  await p.focus('#nst-settings-btn');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  const inside = await p.evaluate(() => !!document.activeElement.closest('.nst-modal'));
  ok('settings dialog — focus moves into it on open', inside);

  let escaped = null;
  for (let i = 0; i < 60; i++) {
    await p.keyboard.press('Tab');
    if (await p.evaluate(() => !document.activeElement.closest('.nst-modal-overlay'))) { escaped = i; break; }
  }
  ok('settings dialog — Tab never leaves it', escaped === null, `escaped after ${escaped} tabs`);

  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({
    open: !!document.querySelector('.nst-modal-overlay'),
    id: document.activeElement === document.body ? null : document.activeElement.id,
  }));
  ok('settings dialog — Escape closes it', after.open === false);
  ok('settings dialog — focus returns to the button that opened it',
    after.id === 'nst-settings-btn', after.id === null ? 'BODY (lost)' : after.id);
  await p.close();
}

/* ---- the page behind a dialog is out of reach, not merely untabbable ---- */
{
  const { p } = await open(`${B}/`);
  // Count what can actually TAKE focus, not what exists: an inert element is
  // still in the DOM with a bounding box, so counting nodes would report the
  // background as reachable even when it is not. Ask each one to take focus.
  const outsideCount = async () => p.evaluate(() => {
    const SEL = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(SEL)].filter((e) => {
      if (e.closest('.nst-modal-overlay')) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    let n = 0;
    for (const e of els) { e.focus(); if (document.activeElement === e) n++; e.blur(); }
    return n;
  });
  const before = await outsideCount();
  await p.click('#nst-settings-btn');
  await p.waitForTimeout(600);
  const during = await outsideCount();
  ok('settings dialog — nothing behind it stays reachable', during === 0,
    `${during} of ${before} still exposed`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const after = await outsideCount();
  ok('settings dialog — and the page comes back when it closes', after === before,
    `${after} vs ${before}`);
  await p.close();
}

/* ---- tap targets: WCAG 2.2 SC 2.5.8 (AA), 24x24 CSS px ----
 *
 * Measured at a LANDSCAPE phone size, which is the shorter and more crowded of
 * the two orientations and the one nothing else here covers.
 *
 * A control's own box is not always its target: a 16x16 checkbox inside a 510x43
 * <label> has the label's hit area, and failing it would be wrong. The rule below
 * takes the larger of the two. (Measuring the element alone reported three
 * perfectly good settings toggles as failures.)
 */
{
  const TARGET_MIN = 24;
  const land = await browser.newContext({
    viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const measure = () => {
    const MIN = 24;
    const sel = 'button, a[href], input, [role="radio"], [role="button"], [role="switch"]';
    const small = [];
    document.querySelectorAll(sel).forEach((e) => {
      const q = e.getBoundingClientRect();
      if (!q.width || !q.height) return;
      // The real target: this element, or the label that wraps it.
      const label = e.closest('label') || (e.id ? document.querySelector(`label[for="${e.id}"]`) : null);
      const l = label ? label.getBoundingClientRect() : null;
      const w = Math.max(q.width, l ? l.width : 0);
      const h = Math.max(q.height, l ? l.height : 0);
      if (w >= MIN && h >= MIN) return;
      small.push(`${(e.className || e.tagName).toString().slice(0, 26)} ${Math.round(w)}x${Math.round(h)}`);
    });
    return {
      small: [...new Set(small)],
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  };

  async function landscape(label, url, prep) {
    const p = await land.newPage();
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.evaluate(SEED);
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    if (prep) await prep(p);
    const r = await p.evaluate(measure);
    ok(`${label} (landscape) — every tap target is at least ${TARGET_MIN}px`,
      r.small.length === 0, r.small.slice(0, 4).join(', '));
    ok(`${label} (landscape) — the page does not scroll sideways`, r.hScroll === false);
    await p.close();
  }

  await landscape('launcher', `${B}/`);
  await landscape('launcher settings', `${B}/`, async (p) => {
    await p.click('#nst-settings-btn'); await p.waitForTimeout(600);
  });
  await landscape('practice exams entry', `${B}/practice-exams/`);
  await landscape('practice mode', `${B}/practice-exams/`, async (p) => {
    await p.click('.pe-modecard-practice'); await p.waitForTimeout(800);
    await p.click('.pe-opt'); await p.click('.pe-check'); await p.waitForTimeout(400);
  });
  await landscape('exam mode', `${B}/practice-exams/`, async (p) => {
    await p.click('.pe-modecard-exam'); await p.waitForTimeout(800);
  });
  await land.close();
}

/* ---- focus survives the whole round trip, not just the way in ---- */
{
  const { p } = await open(`${B}/practice-exams/`);
  const where = () => p.evaluate(() =>
    document.activeElement === document.body ? null : (document.activeElement.className || '').toString());

  await p.focus('.pe-modecard-practice');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(900);
  const inMode = await where();
  ok('entering a mode moves focus to its heading', !!inMode && inMode.indexOf('pe-bar-title') >= 0,
    inMode === null ? 'BODY (lost)' : inMode);

  await p.keyboard.press('Tab');
  const next = await where();
  ok('and Tab continues inside the new view, not from the document top',
    !!next && next.indexOf('pe-') >= 0, next === null ? 'BODY (lost)' : next);

  await p.click('.pe-exit');
  await p.waitForTimeout(900);
  const back = await where();
  ok('leaving a mode puts focus back on the entry heading',
    !!back && back.indexOf('pe-entry-title') >= 0, back === null ? 'BODY (lost)' : back);
  await p.close();
}

await browser.close();
console.log('\n' + (fail ? `A11Y: ${fail} FAILED (${pass} passed)` : `A11Y: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
