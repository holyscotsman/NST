// shots.mjs — capture design-verification screenshots of the redesigned UI
// (CSS backdrop variant). Not a test gate; a visual aid for BROWSER_QA.md.

import { serve, loadPlaywright, launchArgs } from './_harness.mjs';

const PORT = 8101;
const OUT = process.env.SHOT_DIR || '/tmp';

async function main() {
  const pw = await loadPlaywright();
  if (!pw || !pw.chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
  const server = await serve(PORT);
  const browser = await pw.chromium.launch(launchArgs());
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => { try {
    localStorage.setItem('wwtbane.e2e', '1');
    localStorage.setItem('wwtbane.nogl', '1'); // show the CSS studio (the designed backdrop)
    localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, flags: { seenIntro: true }, settings: { music: false } }));
  } catch {} });
  const page = await context.newPage();

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('.brand-main');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/shot-title.png` });

  await page.click('button.primary.big');
  await page.waitForSelector('.q-card .stem');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/shot-game.png` });

  // audience poll + a selection
  await page.click('.lifeline.ll-audience');
  await page.waitForTimeout(1800);
  await page.click('.option[data-i="1"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/shot-game-poll.png` });

  // lock-in suspense (gold)
  await page.click('.lock-btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/shot-game-locked.png` });
  await page.waitForSelector('.feedback', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/shot-game-reveal.png` });

  // green room — reached the way players reach it now: by losing
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('.brand-main');
  await page.click('button.primary.big');
  await page.waitForSelector('.q-card .stem');
  const wrong = await page.evaluate(() => { const a = window.__wwt.answer(); for (let i = 0; i < 6; i++) if (!a.includes(i)) return i; return 0; });
  await page.click(`.option[data-i="${wrong}"]`);
  await page.click('.lock-btn');
  await page.waitForSelector('.green-room .reveal-answer', { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/shot-greenroom-reveal.png` });
  await page.click('.green-room .primary.big');
  await page.waitForSelector('.shop');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/shot-greenroom.png` });

  // the intro cinematic (fresh save)
  const ctx2 = await context.browser().newContext({ viewport: { width: 1440, height: 900 } });
  await ctx2.addInitScript(() => { try {
    localStorage.setItem('wwtbane.nogl', '1');
    localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, settings: { music: false } }));
  } catch {} });
  const p2 = await ctx2.newPage();
  await p2.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await p2.waitForSelector('.brand-main');
  await p2.click('button.primary.big');
  await p2.waitForSelector('.cine-panel');
  await p2.waitForTimeout(2600);
  await p2.screenshot({ path: `${OUT}/shot-cinematic.png` });
  await ctx2.close();

  // mobile
  const mob = await context.newPage();
  await mob.setViewportSize({ width: 390, height: 844 });
  await mob.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await mob.waitForSelector('.brand-main');
  await mob.click('button.primary.big');
  await mob.waitForSelector('.q-card .stem');
  await mob.waitForTimeout(700);
  await mob.screenshot({ path: `${OUT}/shot-mobile.png` });

  await browser.close();
  server.close();
  console.log('shots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
