/* attack-browser.mjs — the DOM half of the security gate.
 *
 * scripts/security-test.mjs proves hostile input stays inert *as data*; this
 * proves it stays inert when RENDERED: a malicious question bank and poisoned
 * storage are loaded into all four real pages, and nothing may execute, no
 * prototype may be polluted, and every page must still work.
 *
 * Needs a browser, so it is not a CI gate. Run locally:
 *   node scripts/attack-browser.mjs        (expects a static server on :8124)
 */
// playwright is CJS: its exports arrive on `.default` under an ESM import.
async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try {
      const m = await import(spec);
      const c = m.chromium || (m.default && m.default.chromium);
      if (c) return c;
    } catch { /* try the next location */ }
  }
  return null;
}
const chromium = await loadChromium();
if (!chromium) { console.log('SKIP: playwright not available'); process.exit(0); }
const EXE = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const B = process.env.NST_BASE || 'http://localhost:8124';
const browser = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--use-gl=swiftshader'] });
let pass=0, fail=0;
const ok=(n,c)=>{ console.log((c?'ok   ':'FAIL ')+n); c?pass++:fail++; };

// ---------- ATTACK 1: hostile question bank (the primary untrusted input) ----------
const XSS = '<img src=x onerror="window.__PWNED=1">';
const HOSTILE = `# ${XSS} Bank
cert: NCP-MCI
title: ${XSS}
domains: ${XSS}, storage

### q1
domain: ${XSS}
difficulty: 2

Q: Stem with ${XSS} inside
- [x] Option ${XSS}
- [ ] Safe option
> note ${XSS}

Explain: Explanation ${XSS}
`;
for (const [name, url] of [['Practice Exams','/practice-exams/index.html'], ['launcher','/index.html'], ['StarNix','/starnix/index.html'], ['WWTBANE','/wwtbane/index.html']]) {
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; page.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
  await page.route('**/banks/manifest.json', r=>r.fulfill({status:200,contentType:'application/json',
    body: JSON.stringify({ banks:[{id:'evil',cert:'NCP-MCI',title:XSS,file:'evil/evil.md'}], certs:[{code:'NCP-MCI',name:XSS,variants:[{id:'evil',label:'25'}]}] })}));
  await page.route('**/banks/evil/evil.md', r=>r.fulfill({status:200,contentType:'text/markdown',body:HOSTILE}));
  await page.goto(B+url,{waitUntil:'load'});
  await page.evaluate(()=>localStorage.setItem('nst.activeBank','evil'));
  await page.reload({waitUntil:'load'});
  await page.waitForTimeout(3000);
  const r = await page.evaluate(()=>({
    pwned: !!window.__PWNED,
    injected: document.querySelectorAll('img[src="x"]').length,
    literal: document.body.textContent.includes('onerror'),
  }));
  ok(`${name}: hostile bank did not execute script`, !r.pwned);
  ok(`${name}: no injected <img> element materialized (${r.injected})`, r.injected===0);
  await page.close();
}

// ---------- ATTACK 2: poisoned storage across every known key ----------
const POISON = {
  'nst.prefs': '{"__proto__":{"polluted":"yes"},"reducedMotion":"<img src=x onerror=window.__PWNED=1>"}',
  'nst.activeBank': '{"__proto__":{"polluted":"yes"}}',
  'nst.practice-exams.history.v1': '{"length":3,"0":{"pct":"<img src=x onerror=window.__PWNED=1>"}}',
  'nst.practice-exams.position.v1': '{"bank":"ncp-mci","idx":"9999"}',
  'nst.practice-exams.prefs.v1': '{"__proto__":{"polluted":"yes"},"useFull":"yes"}',
  'starnix:profile': '{"__proto__":{"polluted":"yes"},"bests":{"KBB":"NaN"},"kbbSalvage":"lots"}',
  'wwtbane:save': '{"__proto__":{"polluted":"yes"},"wallet":"free money","stats":{"runs":"many"},"mastery":{"records":{"q1":{"box":"x"}}}}',
};
for (const [name, url] of [['launcher','/index.html'], ['Practice Exams','/practice-exams/index.html'], ['StarNix','/starnix/index.html'], ['WWTBANE','/wwtbane/index.html']]) {
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; page.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
  await page.goto(B+url,{waitUntil:'load'});
  await page.evaluate((p)=>{ for(const k in p) localStorage.setItem(k,p[k]); sessionStorage.setItem('nst.bankcache:evil','{"__proto__":{"polluted":"yes"},"t":0,"x":"junk"}'); }, POISON);
  await page.reload({waitUntil:'load'});
  await page.waitForTimeout(3000);
  const r = await page.evaluate(()=>({
    polluted: ({}).polluted !== undefined || Object.prototype.polluted !== undefined,
    pwned: !!window.__PWNED,
    interactive: [...document.querySelectorAll('button')].filter(b=>b.offsetParent).length,
  }));
  ok(`${name}: no prototype pollution from poisoned storage`, !r.polluted);
  ok(`${name}: poisoned values did not execute script`, !r.pwned);
  ok(`${name}: page still renders and is interactive (${r.interactive} buttons)`, r.interactive>0);
  ok(`${name}: no uncaught page errors (${errs.length})`, errs.length===0);
  if (errs.length) errs.slice(0,2).forEach(e=>console.log('      '+e));
  await page.close();
}
console.log(`\n${fail===0?'ALL ATTACKS REPELLED':'FAILURES: '+fail} (${pass} checks)`);
await browser.close();
process.exit(fail?1:0);
