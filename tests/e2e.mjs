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
  await context.addInitScript(() => {
    try {
      localStorage.setItem('wwtbane.e2e', '1');
      localStorage.setItem('wwtbane.nogl', '1'); // skip the GPU-bound studio; smoke.mjs covers WebGL boot
      localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, settings: { motion: 'reduced', sound: false } }));
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
    check('won all 30 questions (incl. impossible final) via the real DOM flow', won);
    check('winning pays the full 50,000 prize', wallet === 50000, `wallet=${wallet}`);

    // Prestige resets coins.
    await page.click('.result-screen .primary.big'); // Climb again (prestige)
    await page.waitForSelector('.brand-main', { timeout: 8000 });
    const walletAfter = await page.evaluate(() => window.__wwt.wallet());
    check('prestige resets the wallet to zero', walletAfter === 0, `wallet=${walletAfter}`);

    // ---- Scenario 2: lose on purpose, then the green room ----
    await page.click('button.primary.big');
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    const wrong = await page.evaluate(() => { const a = window.__wwt.answer(); for (let i = 0; i < 6; i++) if (!a.includes(i)) return i; return 0; });
    await page.click(`.option[data-i="${wrong}"]`);
    await page.click('.lock-btn');
    await page.waitForSelector('.feedback.bad', { timeout: 8000 });
    check('a wrong answer is marked wrong', true);
    await page.click('.continue-btn');
    await page.waitForSelector('.result-screen.lose', { timeout: 8000 });
    check('losing shows the result screen with the answer revealed', !!(await page.$('.reveal-answer')));

    await page.click('.result-screen .primary.big'); // To the green room
    await page.waitForSelector('.green-room', { timeout: 8000 });
    check('green room opens with a shop and Steve', !!(await page.$('.shop')) && !!(await page.$('.steve')));
    await page.click('.green-room .primary.big'); // Enter the studio
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    check('you can enter a new run from the green room', true);

    // ---- Scenario 3: seeded run shows the seed ----
    await page.goto(base, { waitUntil: 'load', timeout: 20000 });
    await page.waitForSelector('.brand-main', { timeout: 8000 });
    await page.click('.seed-box summary');
    await page.fill('.seed-input', 'NTNX-TESTME');
    await page.click('.seed-box .secondary');
    await page.waitForSelector('.q-card .stem', { timeout: 10000 });
    const seedShown = await page.textContent('.seed-chip');
    check('seeded run displays the seed for sharing', /TESTME/.test(seedShown || ''), seedShown);

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
