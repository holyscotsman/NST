/* wwtbane-gfx-test.mjs — the 3D studio actually renders, at every quality tier.
 *
 * WWTBANE's game logic has unit tests and an e2e that runs with the GPU path
 * switched OFF ("wwtbane.nogl", for speed). That left the one part of the game
 * people look at with no gate at all: the WebGL studio could fail to build, fall
 * back to the CSS backdrop, or render a black rectangle, and every suite stayed
 * green. modules-parse catches a syntax error; nothing caught "it parses and
 * draws nothing".
 *
 * So this boots the real studio at each tier and asserts three things:
 *
 *   1. the tier builds the chain it promises (low = direct render; medium = MSAA
 *      + bloom + grade; high adds ambient occlusion) -- read from the studio's
 *      own gfxInfo(), not inferred from a URL flag being present
 *   2. the picture is real: the overlay is hidden, the canvas is screenshotted,
 *      and the pixels are decoded (a dependency-free PNG reader, below) and
 *      checked for brightness range and colour variety. A black frame, a white
 *      frame and a flat single-colour fill all fail it
 *   3. the studio frames its shots around the UI: with the question card on
 *      screen the projection is shifted up into the free area, and on the
 *      title screen it is not
 *
 * Needs a browser and a static server on :8124. Run: node scripts/wwtbane-gfx-test.mjs
 */
import { inflateSync } from 'node:zlib';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const B = process.env.NST_BASE || 'http://localhost:8124';

let pass = 0, fail = 0;
const ok = (n, c, x) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); }
};

/* ---- a PNG reader, because the picture is the thing under test ----
 * Playwright's screenshots are 8-bit, non-interlaced RGB or RGBA. That is all
 * this decodes; anything else throws, which fails the test loudly rather than
 * passing on garbage. */
function decodePng(buf) {
  let o = 8, w = 0, h = 0, depth = 0, ct = 0;
  const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8);
    const data = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ct = data[9]; if (data[12]) throw new Error('interlaced PNG'); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  if (depth !== 8 || (ct !== 2 && ct !== 6)) throw new Error(`unsupported PNG (depth ${depth}, type ${ct})`);
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev ? prev[x] : 0, c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}

/* Brightness and variety of a decoded frame. Variety is the number of distinct
 * colours after dropping to 4 bits a channel: a real lit scene has hundreds, a
 * black frame has one and a flat fill a handful. */
function stats({ w, h, bpp, data }) {
  let sum = 0, n = 0, bright = 0;
  const seen = new Set();
  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      const i = (y * w + x) * bpp;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l; n++; if (l > 60) bright++;
      seen.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    }
  }
  return { mean: sum / n, brightFrac: bright / n, colours: seen.size };
}

const browser = await chromium.launch(launchOptions());
const errs = [];

async function boot(tier, { size = [1280, 800], motion = 'full' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] } });
  await ctx.addInitScript((m) => { try {
    localStorage.setItem('wwtbane.e2e', '1');
    localStorage.setItem('nst.activeBank', 'ncp-mci');
    localStorage.setItem('wwtbane.save.v1', JSON.stringify({ version: 1, flags: { seenIntro: true }, settings: { motion: m, music: false, sound: false } }));
  } catch { /* storage blocked */ } }, motion);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(`[${tier}] pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`[${tier}] console.error: ${m.text().slice(0, 160)}`); });
  await page.goto(`${B}/wwtbane/?quality=${tier}`, { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('.brand-main', { timeout: 60000 });
  // the studio initialises asynchronously; wait until it reports in
  await page.waitForFunction(() => window.__wwt && window.__wwt.gfx && window.__wwt.gfx(), null, { timeout: 90000 });
  await page.waitForTimeout(2500); // let a few frames land
  return { ctx, page };
}

// The 3D studio on its own: UI hidden so the screenshot is only the canvas.
async function pictureOf(page) {
  await page.evaluate(() => {
    for (const id of ['ui-root', 'announce']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; }
    document.querySelectorAll('.sound-hint, .hud, .q-card-wrap, .ladder').forEach((e) => { e.style.visibility = 'hidden'; });
  });
  await page.waitForTimeout(400);
  const png = await page.screenshot();
  await page.evaluate(() => {
    for (const id of ['ui-root', 'announce']) { const e = document.getElementById(id); if (e) e.style.visibility = ''; }
    document.querySelectorAll('.sound-hint, .hud, .q-card-wrap, .ladder').forEach((e) => { e.style.visibility = ''; });
  });
  return stats(decodePng(png));
}

const EXPECT = {
  low:    { pipe: false, bloom: false, ao: false, grade: false, msaa: 0 },
  medium: { pipe: true,  bloom: true,  ao: false, grade: true,  msaa: 4 },
  high:   { pipe: true,  bloom: true,  ao: true,  grade: true,  msaa: 4 },
};

for (const tier of ['low', 'medium', 'high']) {
  const { ctx, page } = await boot(tier);
  const g = await page.evaluate(() => window.__wwt.gfx());
  const want = EXPECT[tier];
  ok(`${tier}: the studio reports the tier that was asked for`, g.tier === tier, g.tier);
  for (const k of Object.keys(want)) ok(`${tier}: ${k} is ${want[k]}`, g[k] === want[k], `${k}=${g[k]}`);
  ok(`${tier}: the WebGL canvas exists and the CSS fallback is hidden`, await page.evaluate(() =>
    !!document.querySelector('#studio-root canvas') && document.getElementById('backdrop-fallback').classList.contains('hidden')));
  ok(`${tier}: it never renders above its tier's resolution cap`, g.dpr <= { low: 1, medium: 1.5, high: 2 }[tier] + 1e-9, g.dpr);

  /* Work budgets. A GPU cost is a number, so pin it: not to fix today's figure
   * but so a change that quietly multiplies the scene (an unscaled crowd, a
   * second copy of the set) fails here instead of on somebody's laptop. They are
   * deliberately loose -- roughly 1.5x what each tier draws today, measured in
   * the studio's own frame counter, and high pays three scene passes (the
   * picture, the mirror and the AO depth pass). The drawn-at-all check is the
   * other half: a render that draws nothing has a budget of zero. */
  const BUDGET = { low: [380, 340000], medium: [420, 450000], high: [1300, 1500000] }[tier];
  ok(`${tier}: it actually drew something`, g.calls > 20 && g.triangles > 10000, `${g.calls} calls, ${g.triangles} triangles`);
  ok(`${tier}: draw calls are within budget`, g.calls <= BUDGET[0], `${g.calls} > ${BUDGET[0]}`);
  ok(`${tier}: triangles are within budget`, g.triangles <= BUDGET[1], `${g.triangles} > ${BUDGET[1]}`);

  const s = await pictureOf(page);
  ok(`${tier}: the studio is not a black frame`, s.mean > 8, `mean luminance ${s.mean.toFixed(1)}`);
  ok(`${tier}: nor blown out to white`, s.mean < 190, `mean luminance ${s.mean.toFixed(1)}`);
  ok(`${tier}: it has real tonal variety, not a flat fill`, s.colours > 150, `${s.colours} distinct colours`);
  ok(`${tier}: part of the picture is actually lit`, s.brightFrac > 0.01, `${(s.brightFrac * 100).toFixed(2)}% bright`);

  // Safe frame: the title has no question card, so no shift; the question screen does.
  ok(`${tier}: on the title screen the shot is not shifted`, g.view.dy === 0 && g.view.dx === 0, JSON.stringify(g.view));
  if (tier !== 'low') { // one tier is enough to prove the framing; low is the slow one in software GL
    await ctx.close(); continue;
  }
  await page.click('button.primary.big');
  await page.waitForSelector('.q-card .stem', { timeout: 60000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.option')].every((b) => !b.classList.contains('unrevealed')), { timeout: 60000 });
  await page.waitForTimeout(3500); // the shift eases in over about a second
  const q = await page.evaluate(() => window.__wwt.gfx());
  ok(`${tier}: with the question card up, the shot is shifted UP into the free area`, q.view.dy < -40, JSON.stringify(q.view));
  ok(`${tier}: and LEFT of the money ladder`, q.view.dx < -40, JSON.stringify(q.view));
  await ctx.close();
}

/* Reduced motion means STILL. The set has a lot that moves -- aurora on the wall,
 * sweeping beams, a rotating core, drifting dust, a breathing crowd, film grain --
 * and every one of them has to stop, not slow down. This takes two frames 800 ms
 * apart and requires them to be identical; the negative control is the same
 * comparison with motion on, which must differ (otherwise "identical" proves only
 * that the picture never changes at all). */
async function frame(page) {
  await page.evaluate(() => {
    for (const id of ['ui-root', 'announce']) { const e = document.getElementById(id); if (e) e.style.visibility = 'hidden'; }
    document.querySelectorAll('.sound-hint').forEach((e) => e.remove());
  });
  return decodePng(await page.screenshot());
}
function diffFraction(a, b) {
  let d = 0, n = 0;
  for (let i = 0; i < a.data.length; i += 4 * 7) { n++; if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 6) d++; }
  return d / n;
}
{
  const { ctx, page } = await boot('medium', { motion: 'reduced' });
  const a = await frame(page); await page.waitForTimeout(800); const b = await frame(page);
  const still = diffFraction(a, b);
  ok('reduced motion: two frames 800 ms apart are identical', still < 0.0005, `${(still * 100).toFixed(3)}% of sampled pixels changed`);
  await ctx.close();
}
{
  const { ctx, page } = await boot('medium', { motion: 'full' });
  const a = await frame(page); await page.waitForTimeout(800); const b = await frame(page);
  const moving = diffFraction(a, b);
  ok('[neg] with motion ON the same two frames differ, so "identical" above means something', moving > 0.002, `${(moving * 100).toFixed(3)}% changed`);
  await ctx.close();
}

/* A narrow window must not crop the two-shot to one person's shoulder: the
 * vertical field of view widens to keep a minimum horizontal one. */
{
  const { ctx, page } = await boot('low', { size: [390, 844] });
  const g = await page.evaluate(() => window.__wwt.gfx());
  ok('portrait phone: the field of view widens past the 50 degree desktop default', g.fov > 60, g.fov);
  ok('and is capped, so a very narrow window does not become a fisheye', g.fov <= 84.1, g.fov);
  await ctx.close();
}
{
  const { ctx, page } = await boot('low', { size: [1600, 900] });
  const g = await page.evaluate(() => window.__wwt.gfx());
  ok('[neg] a wide desktop window keeps the original 50 degree framing', Math.abs(g.fov - 50) < 0.2, g.fov);
  await ctx.close();
}

/* A GPU can accept every command and still return a black frame (this happened
 * on real hardware: medium and high drew black, low did not). Nothing throws, so
 * the studio looks at its own canvas. Prove both halves: a healthy frame is NOT
 * flagged, and a frame forced black IS, dropping the tier and remembering it. */
{
  const { ctx, page } = await boot('medium');
  await page.evaluate(() => { const h = window.__wwt.studio()._health; h.next = 0; h.t = 1; });
  await page.waitForFunction(() => window.__wwt.studio()._health.last != null, null, { timeout: 60000 });
  const healthy = await page.evaluate(() => ({ last: window.__wwt.studio()._health.last, tier: window.__wwt.gfx().tier, fb: window.__wwt.studio()._health.fellBack }));
  ok('a healthy frame reads as mostly not black and is left alone', healthy.last < 0.3 && healthy.tier === 'medium' && !healthy.fb, `${Math.round(healthy.last * 100)}% black, tier ${healthy.tier}`);
  await page.evaluate(() => {
    const s = window.__wwt.studio(); const h = s._health;
    h.done = false; h.checks = 0; h.t = 0; h.next = 0.2; h.hits = 0;
    s.pipe.render = () => { s.renderer.setRenderTarget(null); s.renderer.setClearColor(0x000000, 1); s.renderer.clear(); };
  });
  await page.waitForFunction(() => window.__wwt.gfx().tier === 'low', null, { timeout: 90000 }).catch(() => {});
  const after = await page.evaluate(() => ({ tier: window.__wwt.gfx().tier, bad: localStorage.getItem('wwtbane.gfxBad2') }));
  ok('[neg] a frame forced black makes the studio drop a tier by itself', after.tier === 'low', after.tier);
  ok('and it remembers which tier failed, so the next visit does not repeat it', after.bad === 'medium', String(after.bad));
  await ctx.close();
}

ok('no page errors or console errors at any tier', errs.length === 0, errs.slice(0, 3).join(' | '));

await browser.close();
console.log('\n' + (fail ? `WWTBANE GFX: ${fail} FAILED of ${pass + fail}` : `WWTBANE GFX: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
