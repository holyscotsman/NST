/* perf-smoke.mjs — (v0.205.0, V1.1 Backend#10) opt-in performance budget smoke.
 * 01 §13 mandates allocation-free update/draw loops, but headless GREEN proves structure
 * only — the v0.108–0.115 drawCockpitHud per-frame string allocation shipped unseen.
 * PERF=1 node perf-smoke.mjs → real Chromium (the visual-playtest scaffold's dependency
 * exception): each surface runs ~5s while rAF deltas and performance.memory growth are
 * sampled; p95 frame time and heap growth must stay inside budget. Opt-in so the everyday
 * gate stays fast — run it before releases and after any loop-touching unit.
 */
if (process.env.PERF !== "1") { console.log("PERF SMOKE: skipped (opt-in — PERF=1 to run)"); process.exit(0); }

const { chromium } = await import("playwright");
const { resolve } = await import("node:path");
const url = "file://" + resolve("./index.html");
const P95_BUDGET_MS = 50;      // generous: headless CI chromium
const HEAP_BUDGET_MB = 24;     // per 5s surface — a leaky loop blows far past this

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 140)));
console.log("PERF SMOKE: loading " + url);
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2600);

let pass = true;
async function measure(name, enter, p95Override) {
  await page.evaluate(enter);
  await page.waitForTimeout(1400);                         // mount + skips settle before sampling
  const r = await page.evaluate(() => new Promise((done) => {
    const deltas = [];
    const heap0 = performance.memory ? performance.memory.usedJSHeapSize : 0;
    let last = performance.now(); const t0 = last;
    function tick(t) {
      deltas.push(t - last); last = t;
      if (t - t0 < 5000) requestAnimationFrame(tick);
      else {
        deltas.sort((a, b) => a - b);
        done({
          n: deltas.length,
          p50: deltas[Math.floor(deltas.length * 0.5)] || 0,
          p95: deltas[Math.floor(deltas.length * 0.95)] || 0,
          heapMB: performance.memory ? (performance.memory.usedJSHeapSize - heap0) / 1048576 : 0
        });
      }
    }
    requestAnimationFrame(tick);
  }));
  const p95Budget = p95Override || P95_BUDGET_MS;
  const okP = r.p95 <= p95Budget, okH = r.heapMB <= HEAP_BUDGET_MB;
  if (!(okP && okH)) pass = false;
  console.log("  " + (okP && okH ? "✓" : "✗") + " " + name
    + ": p50 " + r.p50.toFixed(1) + "ms · p95 " + r.p95.toFixed(1) + "ms (≤" + p95Budget + ")"
    + " · heap " + (r.heapMB >= 0 ? "+" : "") + r.heapMB.toFixed(1) + "MB (≤" + HEAP_BUDGET_MB + ")"
    + " · " + r.n + " frames");
}

await measure("menu (bridge)", () => {
  const S = window.StarNix; S.core.profile.onboarded = true; S.shell.showMenu();
});
await measure("ARM live sector", () => {
  const S = window.StarNix; delete S.core.profile.saves; S.shell.enterGame("ARM");
  setTimeout(() => {
    try {
      const T = S.shell.currentGameRoot.__armTest;
      T.endBriefingIntro();
      for (let i = 0; i < 12 && T.state() === "BRIEF"; i++) {
        const o = T.briefOptions();
        let gi = o.findIndex((x) => /hyperdrive/i.test(x));
        if (gi < 0) gi = Math.max(0, o.findIndex((x) => /understand|go ahead/i.test(x)));
        T.briefPick(gi);
      }
      T.flushWarp && T.flushWarp();
    } catch (e) {}
  }, 500);
});
// CC under headless Chromium renders on SwiftShader (software GL): the loop paces a rock-
// steady ~50ms with zero heap growth — an environment cadence, not a defect. Budget 67ms
// (a 15fps software floor); REAL-hardware CC feel stays a human-pass judgment (BROWSER_QA).
await measure("CC live run (software GL)", () => {
  const S = window.StarNix; S.shell.exitGame(); delete S.core.profile.saves; S.shell.enterGame("CC");
  setTimeout(() => {
    const sk = document.querySelector(".cc-intro-skip"); if (sk) sk.click();
    setTimeout(() => { const c = document.querySelector(".cc-howto-cont"); if (c) c.click(); }, 200);
  }, 700);
}, 67);
await measure("KBB live battle", () => {
  const S = window.StarNix; S.shell.exitGame(); delete S.core.profile.saves; S.shell.enterGame("KBB");
  setTimeout(() => { document.querySelectorAll(".kbb-skip, .kbb-ht-skip").forEach((n2) => { try { n2.click(); } catch (e) {} }); }, 700);
});

await browser.close();
console.log(pass ? "PERF SMOKE: ALL GREEN" : "PERF SMOKE: BUDGET EXCEEDED");
process.exit(pass ? 0 : 1);
