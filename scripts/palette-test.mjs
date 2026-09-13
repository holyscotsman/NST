/* palette-test.mjs — the question strip has to know where you are.
 *
 * THE DEFECT THIS SUITE EXISTS FOR
 * Both study modes draw a strip of numbered chips above the card: the map of the
 * sitting, and the only way to jump to a flagged or unanswered question. With 75
 * questions the strip is far wider than the screen, so it scrolls — 21 chips fit
 * on a 1280px desktop, 9 on a 390px phone.
 *
 * `ui.centerPalette()` exists to scroll the current chip into view, and it was
 * called from exactly one place: `buildPalette()`. That runs ONCE, at which
 * point the current question is #1 and the strip is already at scrollLeft 0. It
 * was a no-op every time it ran, and never ran when it would have done
 * something. Measured:
 *
 *     exam desktop 1280  q1:visible  q10:visible  q25:OFF  q50:OFF  q75:OFF
 *     exam phone 390     q1:visible  q10:OFF      q25:OFF  q50:OFF  q75:OFF
 *     practice phone 390 q1:visible  q10:OFF      q25:OFF  q50:OFF  q75:OFF
 *
 * On a phone, everything past question nine. During a timed exam, the map of
 * where you are, parked at the beginning.
 *
 * It got there honestly: C3-01 stopped rebuilding all 75 chips on every render
 * (which threw an activating keyboard user's focus to <body>) and moved the
 * build out of the render path. The centring went with it and was never put
 * back on navigation.
 *
 * SO THE RULE HAS TWO HALVES, AND THE SECOND IS WHY THE FIX IS NOT "CENTRE
 * EVERY RENDER"
 * Centring on every update is what C3-01 removed, and rightly: it yanks the
 * strip back to the current chip while you are scrolling it to find a flagged
 * one. Navigation must move the window; answering and flagging must not.
 *
 * Needs a browser and a served copy of the site; brings its own static server.
 * Run: node scripts/palette-test.mjs
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

const PORT = Number(process.env.NST_PORT || 8000 + Math.floor(Math.random() * 900));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const up = await (async () => {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/practice-exams/index.html`); if (r.ok) return true; }
    catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  return false;
})();
if (!up) { server.kill('SIGKILL'); console.log('FAIL static server did not start'); process.exit(1); }
const BASE = `http://127.0.0.1:${PORT}`;

const chromium = await loadChromium();
if (!chromium) {
  missing('playwright', 'npm install --no-save playwright && npx playwright install chromium',
    () => server.kill('SIGKILL'));
}
const browser = await chromium.launch(launchOptions());

/* Where the current chip sits relative to the strip's visible box. */
const PROBE = () => {
  const pal = document.querySelector('.pe-palette');
  const cur = pal && pal.querySelector('.pe-pal.current');
  if (!pal) return { none: 'no palette' };
  if (!cur) return { none: 'no current chip' };
  const pr = pal.getBoundingClientRect(), cr = cur.getBoundingClientRect();
  return { n: Number(cur.textContent.trim()),
           onScreen: cr.left >= pr.left - 0.5 && cr.right <= pr.right + 0.5,
           scrollLeft: Math.round(pal.scrollLeft), maxScroll: Math.round(pal.scrollWidth - pal.clientWidth),
           chips: pal.children.length };
};

async function openMode(width, height, cta) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript("localStorage.setItem('nst.activeBank','ncp-mci');");
  const page = await ctx.newPage();
  await page.goto(`${BASE}/practice-exams/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.getByText(cta, { exact: false }).first().click();
  await page.waitForTimeout(900);
  return { ctx, page };
}

/* Jump the way someone hunting a flagged question does: click its chip. The
 * chip may itself be off-screen, so go through the DOM rather than the mouse. */
async function jumpTo(page, n) {
  const okJump = await page.evaluate((i) => {
    const chips = document.querySelectorAll('.pe-pal');
    if (chips.length < i) return false;
    chips[i - 1].click();
    return true;
  }, n);
  await page.waitForTimeout(120);
  return okJump;
}

try {
  /* ---- 1. the strip follows the sitting, in both modes, at both widths ---- */
  for (const [label, w, h, cta] of [
    ['Exam Mode, 1280px', 1280, 950, 'Start exam'],
    ['Exam Mode, 390px phone', 390, 844, 'Start exam'],
    ['Practice Mode, 390px phone', 390, 844, 'Start practicing'],
  ]) {
    const { ctx, page } = await openMode(w, h, cta);
    const first = await page.evaluate(PROBE);
    ok(`${label}: the strip is wider than the screen, so this is worth checking`,
      !first.none && first.maxScroll > 0 && first.chips >= 25,
      JSON.stringify(first));

    const lost = [];
    for (const stop of [1, 10, 25, 50, 75]) {
      if (!(await jumpTo(page, stop))) continue;
      const s = await page.evaluate(PROBE);
      if (s.none || !s.onScreen) lost.push('q' + stop + (s.none ? ':' + s.none : ':off-screen'));
    }
    ok(`${label}: the current question is on screen at 1, 10, 25, 50 and 75`,
      lost.length === 0, lost.join(' '));
    await ctx.close();
  }

  /* ---- 2. and it does NOT move while you are reading it ----------------- */
  {
    // The other half of the rule. Scroll the strip somewhere deliberately, then
    // answer and flag the CURRENT question: neither is navigation, so neither
    // may drag the window back.
    const { ctx, page } = await openMode(1280, 950, 'Start exam');
    await jumpTo(page, 12);
    await page.evaluate(() => { document.querySelector('.pe-palette').scrollLeft = 1400; });
    await page.waitForTimeout(60);
    const parked = (await page.evaluate(PROBE)).scrollLeft;

    await page.evaluate(() => { const o = document.querySelector('.pe-opt'); if (o) o.click(); });
    await page.waitForTimeout(150);
    const afterAnswer = (await page.evaluate(PROBE)).scrollLeft;
    ok('answering the current question leaves the strip where you put it',
      afterAnswer === parked, parked + ' -> ' + afterAnswer);

    const flagged = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /Flag/i.test(x.textContent));
      if (!b) return false;
      b.click(); return true;
    });
    await page.waitForTimeout(150);
    const afterFlag = (await page.evaluate(PROBE)).scrollLeft;
    ok('flagging it does not either', !flagged || afterFlag === parked, parked + ' -> ' + afterFlag);

    // ...but the next jump still moves it, so the rule above did not simply
    // break the centring.
    await jumpTo(page, 60);
    const s = await page.evaluate(PROBE);
    ok('and the next jump still brings the strip along', s.onScreen && s.n === 60, JSON.stringify(s));
    await ctx.close();
  }

  /* ---- 3. [neg] the probe can actually see an off-screen chip ----------- */
  {
    // Everything above would also pass against a probe that never reports
    // off-screen. Park the strip at its far end while the current question is
    // #1 and require the probe to say so.
    const { ctx, page } = await openMode(390, 844, 'Start exam');
    await jumpTo(page, 1);
    await page.evaluate(() => { const p = document.querySelector('.pe-palette'); p.scrollLeft = p.scrollWidth; });
    await page.waitForTimeout(80);
    const s = await page.evaluate(PROBE);
    ok('[neg] a current chip scrolled out of the strip IS reported off-screen',
      !s.none && s.onScreen === false, JSON.stringify(s));
    await ctx.close();
  }

  /* ---- 4. the centring is reachable from the render path ---------------- */
  {
    const { readFileSync } = await import('node:fs');
    for (const f of ['exam-mode.js', 'practice-mode.js']) {
      const src = readFileSync(join(REPO, 'practice-exams', f), 'utf8');
      // The original bug in one line: centerPalette called only from the
      // build, which happens once. It has to be reachable from the function
      // that runs on every navigation.
      const inUpdate = /function updatePalette\(\)[^]*?centerPalette\(/.test(src);
      ok(`${f}: centring runs from updatePalette, not only from buildPalette`, inUpdate);
      ok(`${f}: and it is gated on the current question changing`,
        /palCentered !== idx/.test(src));
    }
  }

  /* ---- 4. a chip that cannot score must not look like one that can ----
   *
   * The strip is the map of the sitting, so what it colours in is what someone
   * trusts. gradeAnswer() requires an exact-size match on a multi-answer
   * question -- three choices on a "Choose two" is wrong, always -- but
   * isAnswered() is true for any non-empty array, and the palette used that. A
   * question certain to be marked wrong wore the answered colour and said
   * "answered" to a screen reader, and the sitting gave no way to notice it
   * before the score. */
  {
    const { ctx, page } = await openMode(390, 844, 'Start exam');
    try {
      let found = false;
      for (let i = 0; i < 40 && !found; i++) {
        found = await page.evaluate(() => !!document.querySelector('.pe-chip-multi'));
        if (!found) {
          await page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) => /^Next/.test(x.textContent.trim()));
            if (b) b.click();
          });
          await page.waitForTimeout(140);
        }
      }
      ok('the shipped bank has a multi-answer question to test', found);

      const need = await page.evaluate(() => Number((document.querySelector('.pe-chip-multi').textContent.match(/\d+/) || [0])[0]));
      ok('and it asks for more than one', need >= 2, need);

      const pick = async (i) => {
        await page.evaluate((n) => document.querySelectorAll('.pe-opt')[n].click(), i);
        await page.waitForTimeout(140);
      };
      const state = () => page.evaluate(() => {
        const cur = document.querySelector('.pe-pal.current');
        return {
          cls: cur.className,
          aria: cur.getAttribute('aria-label'),
          tally: (document.querySelector('.pe-chip-tally') || {}).textContent || null,
          tallyCls: (document.querySelector('.pe-chip-tally') || {}).className || '',
          meta: (document.querySelector('.pe-progress-meta') || { textContent: '' }).textContent,
        };
      });

      await pick(0);
      let st = await state();
      ok('one of two: the chip is not marked answered', !/\banswered\b/.test(st.cls), st.cls);
      ok('it is marked incomplete instead', /incomplete/.test(st.cls), st.cls);
      ok('and a screen reader is told the numbers', /1 of 2 chosen/.test(st.aria), st.aria);
      ok('the card shows a running tally', /1 of 2 chosen/.test(st.tally || ''), st.tally);

      await pick(1);
      st = await state();
      ok('two of two: now it is answered', /\banswered\b/.test(st.cls) && !/incomplete/.test(st.cls), st.cls);
      ok('the tally says so', /2 of 2 chosen/.test(st.tally || '') && /\bok\b/.test(st.tallyCls), st.tally);
      ok('and the counter counts it', /1 answered/.test(st.meta), st.meta);

      await pick(2);
      st = await state();
      ok('three of two: the chip stops claiming answered', !/\banswered\b/.test(st.cls), st.cls);
      ok('it is marked incomplete', /incomplete/.test(st.cls), st.cls);
      ok('the aria-label says what is wrong', /3 chosen, needs 2/.test(st.aria), st.aria);
      ok('the tally is marked over, not merely different', /over/.test(st.tallyCls), st.tallyCls);
      ok('and the counter stops counting it', /0 answered/.test(st.meta), st.meta);

      // The thing a person actually loses: submitting without knowing.
      await page.evaluate(() => document.querySelector('.pe-btn-submit').click());
      await page.waitForTimeout(600);
      const dlg = await page.evaluate(() => {
        const d = document.querySelector('.nst-dialog, [role=dialog]');
        return d ? d.textContent.replace(/\s+/g, ' ') : '';
      });
      ok('the submit dialog names the wrong-sized answers',
        /1 with the wrong number of choices/.test(dlg), dlg.slice(0, 140));
      ok('and does not fold them into "answered"', /0 of 75 answered/.test(dlg), dlg.slice(0, 140));
      ok('the three counts still partition the exam',
        /0 of 75 answered/.test(dlg) && /74 unanswered/.test(dlg), dlg.slice(0, 160));
    } finally { await ctx.close(); }
  }

} catch (err) {
  console.log('FAIL unexpected error: ' + (err && err.stack ? err.stack : err));
  fail++;
}

await browser.close();
server.kill('SIGKILL');
console.log('\n' + (fail ? `PALETTE: ${fail} FAILED of ${pass + fail}` : `PALETTE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
