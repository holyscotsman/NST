/* a11y-browser.mjs — accessibility audit against the real rendered pages.
 *
 * Checks the things a static reading cannot: computed WCAG contrast of every
 * visible text node against its actual painted background, whether every
 * focusable control has an accessible name, whether a modal really traps focus
 * and closes on Escape, and whether prefers-reduced-motion is honoured.
 *
 * Needs a browser. Run:
 *   node scripts/a11y-browser.mjs        (expects a static server on :8124)
 * Skips without one; CI sets NST_REQUIRE_BROWSER=1 so the skip fails instead.
 */
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const B = process.env.NST_BASE || 'http://localhost:8124';
let pass = 0, fail = 0;
const ok = (n, c) => { console.log((c ? 'ok   ' : 'FAIL ') + n); c ? pass++ : fail++; };
const browser = await chromium.launch(launchOptions());

// WCAG 2.1 relative luminance + contrast, resolved against the real painted backdrop.
const CONTRAST = `(() => {
  const lum = (r,g,b) => { const f=c=>{c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const parse = s => { const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p=m[1].split(',').map(x=>parseFloat(x)); return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]}; };
  const bgOf = el => { let n=el; while(n && n!==document.documentElement){ const c=parse(getComputedStyle(n).backgroundColor); if(c && c.a>0.5) return c; n=n.parentElement; } return {r:8,g:6,b:15,a:1}; };
  const out=[];
  document.querySelectorAll('p,span,div,li,h1,h2,h3,button,a,label,td,th').forEach(el=>{
    if(!el.offsetParent) return;
    const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
    if(t.length<4) return;
    const cs=getComputedStyle(el); const fg=parse(cs.color); if(!fg) return;
    const bg=bgOf(el);
    const L1=lum(fg.r,fg.g,fg.b), L2=lum(bg.r,bg.g,bg.b);
    const ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700;
    const need = (px>=24 || (px>=18.66 && bold)) ? 3 : 4.5;
    if(ratio < need) out.push({ text:t.slice(0,44), ratio:+ratio.toFixed(2), need, px:+px.toFixed(1), cls:(el.className||'').toString().split(' ')[0] });
  });
  return out.sort((a,b)=>a.ratio-b.ratio);
})()`;

for (const [name, url] of [['launcher', '/index.html'], ['Practice Exams', '/practice-exams/index.html']]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(B + '/index.html', { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('nst.activeBank', 'ncp-mci-25'); });
  await page.goto(B + url, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const low = await page.evaluate(CONTRAST);
  ok(`${name}: every visible text node meets WCAG AA contrast`, low.length === 0);
  low.slice(0, 6).forEach(r => console.log(`      ${r.ratio} (need ${r.need}) ${r.px}px .${r.cls} — "${r.text}"`));
  const kb = await page.evaluate(() => {
    const f = [...document.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => e.offsetParent);
    return { n: f.length, noName: f.filter(e => !(e.textContent || '').trim() && !e.getAttribute('aria-label') && !e.getAttribute('title')).length };
  });
  ok(`${name}: all ${kb.n} focusable controls have an accessible name`, kb.noName === 0);
  await page.close();
}

// modal: focus moves in, stays in, Escape closes
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(B + '/index.html', { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('nst.activeBank', 'ncp-mci-25'); });
  await page.goto(B + '/practice-exams/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  await page.evaluate(() => [...document.querySelectorAll('button')].find(x => /Start exam/i.test(x.textContent)).click());
  await page.waitForTimeout(1000);
  await page.evaluate(() => { const s = [...document.querySelectorAll('button')].find(b => b.offsetParent && /Submit exam/i.test(b.textContent)); if (s) s.click(); });
  await page.waitForTimeout(600);
  const sel = '.pe-modal-overlay,[class*=modal]';
  ok('confirm modal opens', await page.evaluate((s) => !!document.querySelector(s), sel));
  ok('focus moves into the modal', await page.evaluate((s) => { const m = document.querySelector(s); return !!m && m.contains(document.activeElement); }, sel));
  let escaped = false;
  for (let i = 0; i < 12 && !escaped; i++) {
    await page.keyboard.press('Tab');
    escaped = await page.evaluate((s) => { const m = document.querySelector(s); return !!m && !m.contains(document.activeElement); }, sel);
  }
  ok('focus stays trapped across 12 tabs', !escaped);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok('Escape closes the modal', await page.evaluate((s) => !document.querySelector(s), sel));
  await page.close();
}

// reduced motion honoured on every surface
for (const [name, url] of [['launcher', '/index.html'], ['StarNix', '/starnix/index.html'], ['WWTBANE', '/wwtbane/index.html']]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await page.goto(B + '/index.html', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('nst.activeBank', 'ncp-mci-25'));
  await page.goto(B + url, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const n = await page.evaluate(() => {
    let a = 0;
    document.querySelectorAll('*').forEach(el => { if (!el.offsetParent) return; const cs = getComputedStyle(el);
      if ((parseFloat(cs.animationDuration) || 0) > 0.3 && cs.animationIterationCount === 'infinite') a++; });
    return a;
  });
  ok(`${name}: honours prefers-reduced-motion (${n} long infinite animations)`, n === 0);
  ok(`${name}: renders clean under reduced motion (${errs.length} errors)`, errs.length === 0);
  await ctx.close();
}

/* (v2.38.0) Scrolling regions a keyboard cannot reach.
 *
 * A container with overflow:auto and NO focusable content inside it cannot be
 * scrolled from the keyboard: Chrome will not put it in the tab order, so it can
 * never be given focus and never receive an arrow key. Whatever is past its fold
 * is reachable with a mouse and by no other means. Firefox makes such regions
 * focusable on its own; Chrome does not, and Chrome is what this is served to.
 *
 * The launcher's dialogs had exactly this, and dialog-test.mjs now covers them
 * in detail. This is the wider sweep: the main screen of each of the four apps,
 * at four window sizes, at the moment somebody arrives. All four are clean --
 * which is only worth printing because the planted control below proves the
 * check can see one.
 */
{
  const FIND = `(() => {
    const F = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
              "textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const out = [];
    for (const e of document.querySelectorAll('*')) {
      if (e === document.body || e === document.documentElement || e === document.scrollingElement) continue;
      const s = getComputedStyle(e);
      const y = (s.overflowY === 'auto' || s.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 1;
      const x = (s.overflowX === 'auto' || s.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1;
      if (!y && !x) continue;
      if (e.querySelectorAll(F).length || e.matches(F)) continue;
      out.push((e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0]) +
               ' (' + (y ? e.scrollHeight - e.clientHeight : e.scrollWidth - e.clientWidth) + 'px past the fold)');
    }
    return out;
  })()`;

  const SIZES = [[1280, 900], [900, 520], [390, 600], [390, 300]];
  const APPS = [['launcher', '/index.html'], ['Practice Exams', '/practice-exams/index.html'],
                ['WWTBANE', '/wwtbane/index.html'], ['StarNix', '/starnix/index.html']];
  for (const [name, url] of APPS) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.goto(B + '/index.html', { waitUntil: 'load' });
      await page.evaluate(() => {
        localStorage.setItem('nst.activeBank', 'ncp-mci');
        localStorage.setItem('nst.prefs', JSON.stringify({ largerText: true }));
      });
      await page.goto(B + url, { waitUntil: 'load' });
      await page.waitForTimeout(700);
      const bad = await page.evaluate(FIND);
      ok(`${name} at ${w}x${h}: nothing scrolls that a keyboard cannot reach` +
         (bad.length ? ' -- ' + bad.join(', ') : ''), bad.length === 0);
      await ctx.close();
    }
  }

  /* Sixteen clean results prove nothing on their own -- a selector with a typo
   * in it is clean everywhere. Plant one and require the same code to find it. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(B + '/index.html', { waitUntil: 'load' });
    await page.evaluate(() => {
      const d = document.createElement('div');
      d.className = 'planted-scroller';
      d.style.cssText = 'height:60px;overflow-y:auto;position:fixed;top:0;left:0;width:200px;z-index:9999';
      d.innerHTML = '<p>' + 'long text '.repeat(200) + '</p>';
      document.body.appendChild(d);
    });
    const bad = await page.evaluate(FIND);
    ok('self-check: a planted text-only scroller IS found, so the sweep is not vacuous',
      bad.length === 1 && /planted-scroller/.test(bad[0]));

    /* And giving it something to tab to clears it, so the rule is about keyboard
     * reach rather than about scrolling. */
    await page.evaluate(() => {
      const d = document.querySelector('.planted-scroller');
      const b = document.createElement('button'); b.textContent = 'x';
      d.appendChild(b);
    });
    const after = await page.evaluate(FIND);
    ok('self-check: and clears once it contains something focusable',
      after.length === 0, JSON.stringify(after));
    await ctx.close();
  }
}

/* (v2.41.0) The sync warning, on every page that can produce one.
 *
 * sync-test.mjs owns the static half: any page that loads nst-sync.js must
 * listen for nst-sync-status. That rule cannot see a banner wired to the wrong
 * element id, or one that renders invisibly, or one that never goes away when
 * the connection comes back -- each of which looks exactly like a working
 * listener from the source.
 *
 * So: fire the real event, in the real page, and look. Then fire the recovery
 * and look again, because a warning that will not clear is its own bug.
 */
{
  /* Both status events, on every page that can produce them. Checking only the
   * one that happened to be noticed is how the second gap survives the fix for
   * the first -- WWTBANE was missing both listeners, and storage is the more
   * serious of the two: there the work does not survive the tab closing. */
  const PAGES = [
    ['launcher', '/index.html', 'nst-sync-warn', 'nst-store-warn'],
    ['Practice Exams', '/practice-exams/index.html', 'pe-sync-warn', 'pe-store-warn'],
    ['WWTBANE', '/wwtbane/index.html', 'wwt-sync-warn', 'wwt-store-warn'],
  ];
  for (const [name, url, id, storeId] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(B + url, { waitUntil: 'load' });
    await page.evaluate(() => {
      localStorage.setItem('nst.activeBank', 'ncp-mci');
      localStorage.setItem('wwtbane.nogl', '1');   // skip the GPU backdrop
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1800);

    ok(`${name}: a healthy session shows no sync warning`,
      !(await page.evaluate((i) => !!document.getElementById(i), id)));

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nst-sync-status',
      { detail: { ok: false, failures: 3, error: 'network error' } })));
    await page.waitForTimeout(250);
    const shown = await page.evaluate((i) => {
      const e = document.getElementById(i);
      if (!e) return null;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return {
        text: e.textContent, role: e.getAttribute('role'),
        /* The reason may be in the visible text or in the accessible name. The
         * launcher's is a nav chip reading "Not saving" with the detail in its
         * title/aria-label -- a deliberate choice for a tight nav bar, and the
         * accessible name still carries it. Practice Exams and WWTBANE have room
         * for a full sentence and use it. The rule is that the reason is
         * REACHABLE, not that it sits in one particular attribute. */
        reason: [e.textContent, e.getAttribute('title'), e.getAttribute('aria-label')]
          .filter(Boolean).join(' | '),
        visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
        inViewport: r.top < window.innerHeight && r.bottom > 0,
      };
    }, id);
    ok(`${name}: a failing push raises a VISIBLE warning`,
      !!shown && shown.visible && shown.inViewport, JSON.stringify(shown));
    ok(`${name}: it is role=status, not an alert -- nothing is lost when sync fails`,
      !!shown && shown.role === 'status', shown && shown.role);
    ok(`${name}: and the reason the push failed is reachable (text or accessible name)`,
      !!shown && /network error/.test(shown.reason), shown && shown.reason.slice(0, 90));

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nst-sync-status',
      { detail: { ok: true, failures: 0, error: null } })));
    await page.waitForTimeout(250);
    ok(`${name}: and it goes away when sync recovers`,
      !(await page.evaluate((i) => !!document.getElementById(i), id)));

    /* Storage refusing writes is the louder failure, and must read as one. */
    ok(`${name}: a healthy session shows no storage warning`,
      !(await page.evaluate((i) => !!document.getElementById(i), storeId)));
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nst-storage-status',
      { detail: { ok: false, reason: 'quota' } })));
    await page.waitForTimeout(250);
    const stored = await page.evaluate((i) => {
      const e = document.getElementById(i);
      if (!e) return null;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return {
        role: e.getAttribute('role'),
        visible: r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
        inViewport: r.top < window.innerHeight && r.bottom > 0,
        says: [e.textContent, e.getAttribute('title'), e.getAttribute('aria-label')]
          .filter(Boolean).join(' | '),
      };
    }, storeId);
    ok(`${name}: a storage failure raises a VISIBLE warning`,
      !!stored && stored.visible && stored.inViewport, JSON.stringify(stored));
    ok(`${name}: it INTERRUPTS (role=alert) -- unlike sync, this work dies with the tab`,
      !!stored && stored.role === 'alert', stored && stored.role);
    ok(`${name}: and it never claims the work is still safe in this browser`,
      !!stored && !/still safe in this browser/i.test(stored.says) &&
      /not being saved/i.test(stored.says), stored && stored.says.slice(0, 80));
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nst-storage-status',
      { detail: { ok: true, reason: null } })));
    await page.waitForTimeout(250);
    ok(`${name}: and it goes away when storage recovers`,
      !(await page.evaluate((i) => !!document.getElementById(i), storeId)));
    await ctx.close();
  }
}

console.log(`\n${fail === 0 ? 'A11Y: ALL GREEN' : 'A11Y: ' + fail + ' FAILED'} (${pass} checks)`);
await browser.close();
process.exit(fail ? 1 : 0);
