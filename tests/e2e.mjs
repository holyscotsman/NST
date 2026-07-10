// e2e.mjs — full-flow browser test. Uses the test-only hook (localStorage
// 'wwtbane.e2e'='1') to read the current authored key and drive real runs:
//   1) win all 30 (including the impossible first final) and prestige;
//   2) lose on purpose, then walk through the green room back into a run;
//   3) start a seeded run and confirm the seed is shown.
// Verifies the whole state machine wires up in a real browser with no errors.

import { serve, loadPlaywright, launchArgs } from './_harness.mjs';

const PORT = 8100;
const base = `http://localhost:${PORT}/`;

async function main() {
  const pw = await loadPlaywright();
  if (!pw || !pw.chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
  const server = await serve(PORT);
  const browser = await pw.chromium.launch(launchArgs());
  const errors = [];
  const results = [];
  const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

  const context = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  // Reduced motion (instant camera cuts) + no audio so the 30-question run is fast.
  // seenIntro skips the first-run cinematic here; scenario 4 covers it separately.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('wwtbane.e2e', '1');
      localStorage.setItem('wwtbane.nogl', '1'); // skip the GPU-bound studio; smoke.mjs covers WebGL boot
      localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, flags: { seenIntro: true }, settings: { motion: 'reduced', sound: false, music: false } }));
    } catch {}
  });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  async function answerCurrent() {
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    const ans = await page.evaluate(() => window.__wwt.answer());
    for (const i of ans) await page.click(`.option[data-i="${i}"]`);
    await page.click('.lock-btn');
    await page.waitForSelector('.feedback', { timeout: 8000 });
  }

  try {
    // ---- Scenario 1: win the whole thing ----
    await page.goto(base, { waitUntil: 'load', timeout: 20000 });
    await page.waitForSelector('.brand-main', { timeout: 10000 });
    await page.click('button.primary.big'); // start mastery run
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    check('starting a run replaces the title screen (no leftover menu behind the quiz)', !(await page.$('.title-screen')));

    let guard = 0; let won = false;
    while (guard++ < 40) {
      const n = await page.evaluate(() => window.__wwt.number());
      await answerCurrent();
      won = await page.evaluate(() => window.__wwt.won());
      if (n % 10 === 0 || won) console.log(`   ...answered Q${n}${won ? ' (won)' : ''}`);
      await page.click('.continue-btn');
      if (won) break;
    }
    await page.waitForSelector('.result-screen.win', { timeout: 8000 });
    const wallet = await page.evaluate(() => window.__wwt.wallet());
    const winMsg = (await page.textContent('.result-msg')) || '';
    check('won all 30 questions (incl. impossible final) via the real DOM flow', won);
    // A win is a prestige: coins reset to zero regardless of which exit is taken.
    check('winning applies the prestige reset (coins back to zero)', wallet === 0, `wallet=${wallet}`);
    check('the win screen still shows the 50,000 top prize', /50,?000/.test(winMsg), winMsg.slice(0, 40));

    // "Climb again" starts a fresh run directly (reset already applied in endRun).
    await page.click('.result-screen .primary.big');
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    check('climb again starts a fresh run', true);

    // ---- Scenario 2: lose on purpose → straight to the green room ----
    await page.goto(base, { waitUntil: 'load', timeout: 20000 });
    await page.waitForSelector('.brand-main', { timeout: 8000 });
    await page.click('button.primary.big');
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    const wrong = await page.evaluate(() => { const a = window.__wwt.answer(); for (let i = 0; i < 6; i++) if (!a.includes(i)) return i; return 0; });
    await page.click(`.option[data-i="${wrong}"]`);
    await page.click('.lock-btn');
    // No click needed — the game walks you back to the green room by itself
    // (under reduced motion the wrong-beat is instant), where the correct
    // answer + explanation are revealed first.
    await page.waitForSelector('.green-room .reveal-answer', { timeout: 10000 });
    check('losing goes straight to the green room with the answer revealed', true);
    await page.click('.green-room .primary.big'); // Got it — to the green room
    await page.waitForSelector('.shop', { timeout: 8000 });
    check('after the reveal, the green room offers the shop and Steve', !!(await page.$('.steve')));
    await page.click('.green-room .primary.big'); // Start next round
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    check('you can start the next round from the green room', true);

    // ---- Scenario 3: seeded run shows the seed ----
    await page.goto(base, { waitUntil: 'load', timeout: 20000 });
    await page.waitForSelector('.brand-main', { timeout: 8000 });
    await page.click('.seed-box summary');
    await page.fill('.seed-input', 'NTNX-TESTME');
    await page.click('.seed-box .secondary');
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    const seedShown = await page.textContent('.seed-chip');
    check('seeded run displays the seed for sharing', /TESTME/.test(seedShown || ''), seedShown);

    // Pause menu: Escape opens it (music/sound toggles + the seed), Escape closes.
    await page.keyboard.press('Escape');
    await page.waitForSelector('.pause-panel', { timeout: 5000 });
    const pauseSeed = await page.textContent('.pause-seed');
    check('pause menu opens with the shareable seed', /TESTME/.test(pauseSeed || ''), pauseSeed);
    const toggles = await page.$$eval('.pause-panel .setting input', (els) => els.length);
    check('pause menu offers music + sound toggles', toggles === 2, `${toggles} toggles`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.pause-panel'), { timeout: 5000 });
    check('pause menu closes back to the question', true);

    // ---- Scenario 4: first-run intro cinematic (fresh save) ----
    const ctx2 = await browser.newContext({ viewport: { width: 1100, height: 800 } });
    await ctx2.addInitScript(() => {
      try {
        localStorage.setItem('wwtbane.e2e', '1');
        localStorage.setItem('wwtbane.nogl', '1');
        localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, settings: { motion: 'reduced', sound: false, music: false } }));
      } catch {}
    });
    const p2 = await ctx2.newPage();
    p2.on('console', (m) => { if (m.type() === 'error') errors.push('intro: ' + m.text()); });
    p2.on('pageerror', (e) => errors.push('intro pageerror: ' + e.message));
    await p2.goto(base, { waitUntil: 'load', timeout: 20000 });
    await p2.waitForSelector('.brand-main', { timeout: 8000 });
    await p2.click('button.primary.big'); // first-ever start → cinematic
    await p2.waitForSelector('.cine-panel', { timeout: 8000 });
    check('the first run opens with the host cinematic', true);
    await p2.click('.cine-skip');
    await p2.waitForSelector('.q-card .stem', { timeout: 10000 });
    check('skipping the intro lands on the first question', true);
    // The seen-intro flag must persist so later runs go straight in. (A reload
    // can't be used here — the test's init script resets the save on nav.)
    const seen = await p2.evaluate(() => { try { return JSON.parse(localStorage.getItem('wwtbane.save.v1')).flags.seenIntro === true; } catch { return false; } });
    check('the intro is marked seen — later runs go straight in', seen);
    await ctx2.close();

    check('no console errors across all scenarios', errors.length === 0, errors.slice(0, 4).join(' | '));
  } catch (e) {
    check('all scenarios completed', false, e.message);
  } finally {
    await browser.close();
    server.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (errors.length) { console.log('\nErrors:'); for (const e of errors) console.log('  - ' + e); }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
