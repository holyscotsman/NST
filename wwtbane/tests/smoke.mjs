// smoke.mjs — headless browser smoke test. Serves the site and drives a short
// play-through in Chromium: title -> start -> 50:50 -> answer -> feedback,
// failing if the console reports errors or the flow breaks. Structural proof
// that the app boots and is interactive; NOT a visual sign-off (WebGL visuals
// still need human review — see BROWSER_QA.md).

import { serve, loadPlaywright, launchArgs } from './_harness.mjs';

const PORT = 8099;

async function main() {
  const pw = await loadPlaywright();
  if (!pw || !pw.chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
  const server = await serve(PORT);
  const errors = [];
  const browser = await pw.chromium.launch(launchArgs());
  const context = await browser.newContext({ viewport: { width: 1100, height: 800 } });
  // Skip the first-run intro cinematic; it has its own e2e coverage.
  await context.addInitScript(() => { try {
    localStorage.setItem('wwtbane.e2e', '1'); // exposes window.__wwt (the answer key, the graphics snapshot)
    localStorage.setItem('nst.activeBank', 'ncp-mci'); // runtime bank (post-NST-consolidation boot needs one selected; the 30-rung classic ladder this smoke test expects)
    localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, flags: { seenIntro: true } }));
  } catch {} });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  const results = [];
  const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

  try {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForSelector('.brand-main', { timeout: 30000 });
    check('title screen renders', true);

    const ver = await page.textContent('.title-foot .version').catch(() => null);
    check('version badge shows on the title screen', /^v\d+\.\d+\.\d+$/.test(ver || ''), String(ver));

    await page.click('button.primary.big');
    await page.waitForSelector('.q-card .stem', { timeout: 30000 });
    check('a question is shown', true, await page.textContent('.chip'));

    const optionCount = await page.$$eval('.option', (els) => els.length);
    check('question has options', optionCount >= 4, `${optionCount} options`);

    // Accessibility: the single-answer radiogroup must honour arrow-key nav with
    // a roving tab stop (declared role=radiogroup + roving tabindex + selection
    // follows focus). Skip gracefully if this question happens to be multi.
    const isRadio = await page.$eval('.options', (el) => el.getAttribute('role') === 'radiogroup');
    if (isRadio) {
      // wait out the progressive read-out so the options are revealed + enabled
      await page.waitForFunction(() => [...document.querySelectorAll('.option')].every((b) => !b.classList.contains('unrevealed') && !b.disabled), { timeout: 15000 });
      await page.$eval('.option[data-i="0"]', (el) => el.focus());
      await page.keyboard.press('ArrowDown');
      const kb = await page.evaluate(() => {
        const opts = [...document.querySelectorAll('.option')];
        return {
          checked: opts.findIndex((o) => o.getAttribute('aria-checked') === 'true'),
          roving: opts.findIndex((o) => o.tabIndex === 0),
          active: document.activeElement && document.activeElement.dataset ? Number(document.activeElement.dataset.i) : -1,
        };
      });
      check('arrow key navigates + selects within the radiogroup', kb.checked === 1 && kb.roving === 1 && kb.active === 1, JSON.stringify(kb));
    } else {
      check('arrow key navigates + selects within the radiogroup', true, 'skipped (multi question)');
    }

    const rungs = await page.$$eval('.rung', (els) => els.length);
    check('money ladder has 30 rungs', rungs === 30, `${rungs} rungs`);

    // The rule (core/lifelines.js, docs/LIFELINES.md): remove up to TWO
    // distractors, never a correct option, always leave at least one standing.
    // "Exactly two" was true of the original single-answer bank; a multi-answer
    // question with two distractors can only give up one. So assert the rule.
    const shape = await page.evaluate(() => ({ n: document.querySelectorAll('.option').length, correct: window.__wwt.answer().length }));
    await page.click('.lifeline.ll-fifty');
    await page.waitForTimeout(200);
    const removed = await page.$$eval('.option.removed', (els) => els.length);
    const distractors = shape.n - shape.correct;
    const expected = Math.min(2, Math.max(0, distractors - 1));
    check('50:50 removes up to two distractors and leaves one standing', removed === expected,
      `${removed} removed, expected ${expected} (${shape.n} options, ${shape.correct} correct)`);

    await page.click('.option:not(.removed)');
    await page.click('.lock-btn');
    await page.waitForSelector('.feedback', { timeout: 20000 });
    // Correct → explanation + continue; wrong → auto-walk to the green room.
    const followUp = await Promise.race([
      page.waitForSelector('.continue-btn', { timeout: 6000 }).then(() => 'continue'),
      page.waitForSelector('.green-room', { timeout: 6000 }).then(() => 'greenroom'),
    ]).catch(() => null);
    check('answering leads to feedback and the next step', !!followUp, String(followUp));

    check('no console errors or page exceptions', errors.length === 0, errors.slice(0, 4).join(' | '));
  } catch (e) {
    check('play-through completed', false, e.message);
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
