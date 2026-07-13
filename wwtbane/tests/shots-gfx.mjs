// shots-gfx.mjs — graphics-overhaul screenshot harness. Captures the WebGL
// studio across the key gameplay states into shots/ for before/after review.
// NOT a test gate (visuals need human sign-off — BROWSER_QA.md). Uses the real
// GL path (not the CSS fallback) so materials/lighting/post are exercised.
//
//   node tests/shots-gfx.mjs [label]   # default label: "phase"
// Writes shots/<label>-<state>.png for: title, question, lockin, correct, wrong.

import { serve, loadPlaywright, launchArgs } from './_harness.mjs';
import { mkdirSync } from 'node:fs';

const PORT = 8107;
const LABEL = process.argv[2] || 'phase';
const OUT = new URL('../shots/', import.meta.url).pathname;

async function main() {
  const pw = await loadPlaywright();
  if (!pw || !pw.chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
  mkdirSync(OUT, { recursive: true });
  const server = await serve(PORT);
  const browser = await pw.chromium.launch(launchArgs());
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('wwtbane.e2e', '1');
    localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, flags: { seenIntro: true }, settings: { motion: 'full', music: false, sound: false } }));
  } catch {} });
  const page = await ctx.newPage();
  const shot = (name) => page.screenshot({ path: `${OUT}${LABEL}-${name}.png` });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('.brand-main');
  await page.waitForTimeout(1400); // let the intro orbit settle
  await shot('title');

  await page.click('button.primary.big');
  await page.waitForSelector('.q-card .stem');
  await page.waitForFunction(() => [...document.querySelectorAll('.option')].every((b) => !b.classList.contains('unrevealed')), { timeout: 15000 });
  await page.waitForTimeout(600);
  await shot('question');

  // lock-in suspense (gold beat)
  const ans = await page.evaluate(() => window.__wwt.answer());
  await page.click(`.option[data-i="${ans[0]}"]`);
  await page.click('.lock-btn');
  await page.waitForTimeout(700);
  await shot('lockin');

  // correct reveal
  await page.waitForSelector('.feedback.good', { timeout: 8000 });
  await page.waitForTimeout(500);
  await shot('correct');

  // wrong reveal: fresh run, answer wrong
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForSelector('.brand-main');
  await page.click('button.primary.big');
  await page.waitForSelector('.q-card .stem');
  await page.waitForFunction(() => [...document.querySelectorAll('.option')].every((b) => !b.classList.contains('unrevealed')), { timeout: 15000 });
  const wrong = await page.evaluate(() => { const a = window.__wwt.answer(); for (let i = 0; i < 6; i++) if (!a.includes(i)) return i; return 0; });
  await page.click(`.option[data-i="${wrong}"]`);
  await page.click('.lock-btn');
  await page.waitForTimeout(1400);
  await shot('wrong');

  await browser.close();
  server.close();
  console.log(`shots written to shots/ with label "${LABEL}"`);
}

main().catch((e) => { console.error(e); process.exit(1); });
