/* a11y-browser.mjs — accessibility audit against the real rendered pages.
 *
 * Checks the things a static reading cannot: computed WCAG contrast of every
 * visible text node against its actual painted background, whether every
 * focusable control has an accessible name, whether a modal really traps focus
 * and closes on Escape, and whether prefers-reduced-motion is honoured.
 *
 * Needs a browser, so it is not a CI gate (CI stays dependency-free). Run:
 *   node scripts/a11y-browser.mjs        (expects a static server on :8124)
 */
async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try { const m = await import(spec); const c = m.chromium || (m.default && m.default.chromium); if (c) return c; }
    catch { /* try the next location */ }
  }
  return null;
}
const chromium = await loadChromium();
if (!chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
const EXE = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = process.env.NST_BASE || 'http://localhost:8124';
let pass = 0, fail = 0;
const ok = (n, c) => { console.log((c ? 'ok   ' : 'FAIL ') + n); c ? pass++ : fail++; };
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--use-gl=swiftshader'] });

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

console.log(`\n${fail === 0 ? 'A11Y: ALL GREEN' : 'A11Y: ' + fail + ' FAILED'} (${pass} checks)`);
await browser.close();
process.exit(fail ? 1 : 0);
