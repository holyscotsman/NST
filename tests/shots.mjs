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
    localStorage.removeItem('wwtbane.save.v1');
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

  // green room (fresh page so state is clean)
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('.brand-main');
  await page.click('button.ghost');
  await page.waitForSelector('.green-room');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/shot-greenroom.png` });

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
