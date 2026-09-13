/* prefs-test.mjs — one preference, four surfaces, three different idioms.
 *
 * Accessibility preferences are set in ONE place (the launcher's Settings, into
 * localStorage "nst.prefs") and have to reach four independently-built
 * front-ends, none of which express them the same way:
 *
 *   launcher         <html class="nst-reduced-motion nst-high-contrast …">
 *   Practice Exams   the same classes, its own stylesheet
 *   StarNix          StarNix.core.profile.settings.reducedMotion / .colorblind
 *                    / .masterVol   (its high-contrast key is `colorblind`)
 *   WWTBANE          <body class="reduced-motion high-contrast">, resolved
 *                    through its own tri-state settings.motion
 *
 * Nothing checked that they agree. Auditing it by reading took a browser probe
 * and two wrong answers first -- a grep for the prefs key in `wwtbane/*.js`
 * finds nothing, because that game's source lives under `src/shell/`, and
 * StarNix looks unset in the DOM because it keeps the state on a profile object
 * rather than a class. Both honour the preference; neither looks like it does.
 *
 * That is exactly the kind of cross-module contract that rots quietly: any one
 * of the four could stop reading the key and every suite would still pass,
 * while somebody who needs reduced motion gets a 3D camera flight.
 *
 * This proves the preference arrives, in both directions -- ON must switch it on
 * and OFF must leave it off, or a surface that hardcodes the accessible mode
 * would pass a one-sided test.
 *
 * Needs a browser and a static server on :8124. Run:
 *   node scripts/prefs-test.mjs
 */
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const B = process.env.NST_BASE || 'http://localhost:8124';

let pass = 0, fail = 0;
const ok = (n, c, x) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); }
};

const browser = await chromium.launch(launchOptions());

/* Load one page with a given nst.prefs already in storage, and report how that
 * page expresses the preference in its own terms. */
async function surfaceState(path, prefs, settle) {
  const ctx = await browser.newContext();
  const seed = await ctx.newPage();
  await seed.goto(B + '/index.html', { waitUntil: 'domcontentloaded' });
  await seed.evaluate((p) => {
    localStorage.setItem('nst.activeBank', 'ncp-mci');
    localStorage.setItem('nst.prefs', JSON.stringify(p));
  }, prefs);
  await seed.close();

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(B + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(settle);
  const state = await page.evaluate(() => {
    const htmlC = document.documentElement.className || '';
    const bodyC = document.body.className || '';
    const sx = window.StarNix && window.StarNix.core && window.StarNix.core.profile
      ? window.StarNix.core.profile.settings : null;
    return {
      html: htmlC,
      body: bodyC,
      // shared idiom (launcher, Practice Exams)
      sharedReduced: /\bnst-reduced-motion\b/.test(htmlC),
      sharedContrast: /\bnst-high-contrast\b/.test(htmlC),
      sharedLarger: /\bnst-larger-text\b/.test(htmlC),
      // WWTBANE idiom
      wwtReduced: /\breduced-motion\b/.test(bodyC),
      wwtContrast: /\bhigh-contrast\b/.test(bodyC),
      // StarNix idiom
      sxReduced: sx ? !!sx.reducedMotion : null,
      sxContrast: sx ? !!sx.colorblind : null,
      sxMuted: sx ? sx.masterVol === 0 : null,
    };
  });
  await ctx.close();
  return { state, errs };
}

const ON = { reducedMotion: true, highContrast: true, largerText: true, audioMuted: true };
const OFF = { reducedMotion: false, highContrast: false, largerText: false, audioMuted: false };

/* ---- the two surfaces that share the launcher's stylesheet ---- */
for (const [label, path] of [['launcher', '/index.html'], ['practice exams', '/practice-exams/index.html']]) {
  const on = await surfaceState(path, ON, 400);
  const off = await surfaceState(path, OFF, 400);
  ok(`${label} — reduced motion arrives`, on.state.sharedReduced, on.state.html);
  ok(`${label} — and is absent when it is off`, !off.state.sharedReduced, off.state.html);
  ok(`${label} — high contrast arrives`, on.state.sharedContrast, on.state.html);
  ok(`${label} — and is absent when it is off`, !off.state.sharedContrast, off.state.html);
  ok(`${label} — larger text arrives`, on.state.sharedLarger, on.state.html);
  ok(`${label} — and is absent when it is off`, !off.state.sharedLarger, off.state.html);
  ok(`${label} — no page errors reading prefs`, on.errs.length === 0, on.errs[0]);
}

/* ---- StarNix keeps it on a profile object, not a class ---- */
{
  const on = await surfaceState('/starnix/index.html', ON, 4000);
  const off = await surfaceState('/starnix/index.html', OFF, 4000);
  ok('starnix — the profile exists to carry the preference', on.state.sxReduced !== null,
    'StarNix.core.profile.settings was not reachable');
  ok('starnix — reduced motion arrives', on.state.sxReduced === true, on.state.sxReduced);
  ok('starnix — and is off when it is off', off.state.sxReduced === false, off.state.sxReduced);
  ok('starnix — high contrast arrives, under its own name (colorblind)',
    on.state.sxContrast === true, on.state.sxContrast);
  ok('starnix — and is off when it is off', off.state.sxContrast === false, off.state.sxContrast);
  ok('starnix — muting the launcher mutes the game', on.state.sxMuted === true, on.state.sxMuted);
  ok('starnix — and unmuted stays unmuted', off.state.sxMuted === false, off.state.sxMuted);
  ok('starnix — no page errors reading prefs', on.errs.length === 0, on.errs[0]);
}

/* ---- WWTBANE resolves it through its own tri-state, onto the body ---- */
{
  const on = await surfaceState('/wwtbane/index.html', ON, 3500);
  const off = await surfaceState('/wwtbane/index.html', OFF, 3500);
  ok('wwtbane — reduced motion arrives', on.state.wwtReduced, on.state.body);
  ok('wwtbane — and is absent when it is off', !off.state.wwtReduced, off.state.body);
  ok('wwtbane — high contrast arrives', on.state.wwtContrast, on.state.body);
  ok('wwtbane — and is absent when it is off', !off.state.wwtContrast, off.state.body);
  ok('wwtbane — no page errors reading prefs', on.errs.length === 0, on.errs[0]);
}

/* ---- the thing a one-sided test would miss ---- */
{
  // A surface that simply always applied the accessible mode would pass every
  // "it arrives" check above. The OFF cases are what make this a real test, so
  // assert at least one surface genuinely differed between the two runs.
  const on = await surfaceState('/index.html', ON, 400);
  const off = await surfaceState('/index.html', OFF, 400);
  ok('the two runs are actually different, so ON is not trivially true',
    on.state.html !== off.state.html, `${on.state.html} vs ${off.state.html}`);
}

await browser.close();
console.log('\n' + (fail ? `PREFS: ${fail} FAILED (${pass} passed)` : `PREFS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
