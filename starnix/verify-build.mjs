/* Headless verification of the assembled index.html (with real kbb.js).
 *
 * (v0.158.0, Backend#5) Three.js r128 is VENDORED + inlined, so jsdom now EXECUTES it and
 * window.THREE is defined; CC's fallback still exercises because jsdom has no WebGL context
 * (CCView construction throws -> caught -> "3D unavailable").
 * A mock 2D canvas context is provided (jsdom's getContext returns null), so the
 * 2D games (ARM, KBB) actually run their draw loops. The rAF polyfill catches
 * any error thrown inside a frame, so we can assert each game's animation loop
 * runs clean for several frames.
 */
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

/* (v2.49.0) The build has no questions in it any more. Since the runtime bank engine,
 * index.html asks window.NSTBank for them over the network, and jsdom has neither the
 * loader script nor fetch — so the shell booted with an empty pool and every
 * question-driven check below asserted against nothing.
 *
 * So the bank is supplied the same way the browser supplies it: the real markdown, the
 * real parser and the real StarNix adapter, installed on the window BEFORE the build's
 * own scripts run. That also means this harness now verifies the seam it depends on — a
 * parser or adapter change that breaks StarNix's question shape fails here too. */
function realBank() {
  const parser = readFileSync(new URL("../shared/bank-parser.js", import.meta.url), "utf8");
  const loader = readFileSync(new URL("../shared/bank-loader.js", import.meta.url), "utf8");
  const md = readFileSync(new URL("../banks/ncp-mci/ncp-mci.md", import.meta.url), "utf8");
  const shim = {
    location: { href: "https://x.test/starnix/" },
    document: {
      currentScript: { src: "https://x.test/shared/bank-loader.js" },
      getElementsByTagName: () => [{ src: "https://x.test/shared/bank-loader.js" }],
    },
  };
  new Function("window", "document", parser)(shim, shim.document);
  new Function("window", "document", loader)(shim, shim.document);
  const parsed = shim.NSTBankParser.parse(md);
  if (parsed.errors && parsed.errors.length) throw new Error("the real bank no longer parses: " + parsed.errors[0]);
  return shim.NSTBank.toStarNix({ id: "ncp-mci", meta: parsed.meta, questions: parsed.questions, errors: [], count: parsed.questions.length });
}
const BANK = realBank();

let pass = 0, fail = 0; const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log("  \u2713 " + name); }
  else { fail++; fails.push(name); console.log("  \u2717 " + name + "  <-- FAIL"); } }

const vc = new VirtualConsole();
vc.on("jsdomError", () => { /* swallow expected WebGL/AudioContext noise */ });

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole: vc,
  url: "https://x.test/",
  beforeParse(win) { win.STARNIX_QUESTIONS = BANK; }
});
const w = dom.window;

// mock 2D canvas context (jsdom returns null) so 2D draw loops execute
w.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type !== "2d") return null;            // webgl -> null => CC falls back
  const canvas = this;
  return new Proxy({}, {
    get(_t, k) {
      if (k === "canvas") return canvas;
      if (k === "measureText") return (s) => ({ width: (s ? String(s).length : 0) * 6 });
      if (k === "createLinearGradient" || k === "createRadialGradient" || k === "createPattern")
        return () => ({ addColorStop() {} });
      if (k === "getImageData") return (_x, _y, wd, ht) => ({ data: new Uint8ClampedArray(Math.max(0, (wd | 0) * (ht | 0) * 4)) });
      const v = _t[k];
      if (v !== undefined) return v;
      return () => {};
    },
    set(_t, k, v) { _t[k] = v; return true; }
  });
};

// rAF/cAF polyfill that records per-frame errors
let rafId = 0; const cancelled = new Set(); const frameErrors = [];
w.requestAnimationFrame = (fn) => {
  const id = ++rafId;
  w.setTimeout(() => {
    if (cancelled.has(id)) return;
    try { fn(w.performance.now()); } catch (e) { frameErrors.push(e); }
  }, 0);
  return id;
};
w.cancelAnimationFrame = (id) => cancelled.add(id);

function wait(ms) { return new Promise((r) => w.setTimeout(r, ms)); }
async function until(cond, ms = 2000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (cond()) return true; await wait(10); }
  return false;
}
async function runFrames(n = 6) {
  const before = frameErrors.length;
  for (let i = 0; i < n; i++) await wait(8);
  return frameErrors.slice(before);
}

(async function run() {
  console.log("StarNix index.html (with real KBB) — headless integration check\n");

  const SN = w.StarNix;
  console.log("A. Modules loaded + games registered");
  ok("window.StarNix present", !!SN);
  ok("ARM registered", !!(SN && SN.getGame && SN.getGame("ARM")));
  ok("CC registered", !!(SN && SN.getGame && SN.getGame("CC")));
  ok("KBB registered", !!(SN && SN.getGame && SN.getGame("KBB")));

  const booted = await until(() => SN.shell && SN.shell.screen === "title");
  ok("boot reached title screen", booted);
  // Pin the clock: provider.next() falls back to makeRng(clock.now()) when a caller passes no rng
  // (e.g. KBB), so without this the drawn question varies run-to-run and draw-dependent tests flake.
  if (SN.core && SN.core.clock) SN.core.clock.now = function () { return 1700000000000; };
  ok("build-version badge present at title", !!w.document.querySelector(".sx-build-badge"));
  ok("title screen has the nebula background wired to nebulaBg", (function () { const p = w.document.querySelector(".sx-title-photo"); return !!p && p.classList.contains("on") && /data:image\/(jpeg|png|webp)/.test(p.style.backgroundImage || ""); })());
  ok("badge text shows the build version", (function () { const b = w.document.querySelector(".sx-build-badge"); return !!b && !!SN.BUILD && b.textContent.indexOf(SN.BUILD) !== -1; })());

  console.log("\nB. Audio engine installed (audio.js, not NoopAudio)");
  ok("core.audio present", !!(SN.core && SN.core.audio));
  ok("core.audio is the real engine (isReady present)", typeof SN.core.audio.isReady === "function");
  ok("playTrack present", typeof SN.core.audio.playTrack === "function");

  const calls = [];
  const realAudio = SN.core.audio;
  SN.core.audio = {
    ensure() {}, setMusic(on) { calls.push("music:" + on); }, setSfx() {},
    sfx(n) { calls.push("sfx:" + n); },
    playTrack(id, opts) { calls.push("track:" + id); this._last = { id: id, exact: !!(opts && opts.exact) }; },
    isReady() { return true; }, state() { return { trackId: this._last ? this._last.id : null }; },
    trackIds() { return realAudio.trackIds ? realAudio.trackIds() : []; }   // JB1: delegate to the real library
  };

  console.log("\nB2. Cold-open cinematic (P2 — all beats render, exits to menu)");
  {
    const realNow = w.performance.now.bind(w.performance);
    let nowMs = realNow();
    w.performance.now = () => { nowMs += 50; return nowMs; };   // fast-forward the cinematic clock
    calls.length = 0;
    const beforeErr = frameErrors.length;
    SN.shell.showCinematic();
    ok("screen === cinematic", SN.shell.screen === "cinematic");
    ok("cinematic canvas mounted", !!w.document.querySelector(".sx-cine-canvas"));
    ok("mission panel present, starts hidden", (function () { const m = w.document.querySelector(".sx-mission"); return !!m && m.style.opacity === "0"; })());
    let guard = 0, sawFull = false, sawCap = false;
    while (SN.shell.screen === "cinematic" && guard < 240) {
      await runFrames(5);
      if (w.document.querySelectorAll(".sx-mission-list li.on").length === 3) sawFull = true;
      const ctxt = (w.document.querySelector(".sx-cap") || {}).textContent || "";
      if (/jumped to the Kuiper Belt\.$|held every concept you need to pass\.$/.test(ctxt)) sawCap = true;   // (Menu#8) a full line landed
      guard++;
    }
    ok("Menu#8: type-on captions COMPLETE their lines (a full sentence was observed on screen)", sawCap);
    ok("Menu#8: the type-on machinery, letterbox bars and 5 caption ticks are in the build",
      html.includes("Math.ceil(((T - capStart) / 0.6) * capNow.length)")
      && html.includes("ctx.fillRect(0, H * 0.86, W, H * 0.14);")
      && (html.match(/name: "click", done: false/g) || []).length === 5);
    // (v0.181.0) the stagger CADENCE is pinned structurally, not by sampling: the per-call
    // performance.now stub makes T leap under load (any extra caller advances it), so a
    // sampled partial state is inherently racy. Cadence itself is BROWSER_QA's to eyeball.
    ok("Menu#7: all three finale lines are revealed before the cinematic ends", sawFull);
    ok("Menu#7: the staggered reveal + per-line tick are in the build (0.4s cadence, .on class writes)",
      html.includes("1 + Math.floor((T - B.mission) / 0.4)") && html.includes('mLines[lr].classList.add("on")')
      && html.includes(".sx-mission-list li.on{opacity:1;"));
    w.performance.now = realNow;
    ok("G3 (v0.107.0): the cinematic sound rail fired its beats EXACTLY ONCE each",
      ["sfx:lasercharge", "sfx:laserfire", "sfx:explode", "sfx:laserhit"].every(n => calls.filter(x => x === n).length === 1));
    ok("ran every beat without a frame error", frameErrors.length === beforeErr);
    ok("auto-advanced to menu at end", SN.shell.screen === "menu");
    ok("menu track played on cinematic end", calls.indexOf("track:menu") !== -1);
    ok("no cinematic residue (canvas gone)", !w.document.querySelector(".sx-cine-canvas"));
    /* (v2.49.0) This asserted that the cinematic ASKS for five rock sprites. It does, and
     * two of them do not exist — assets.js only ever carried kbbAsteroid1..3, so cineImg
     * returned null and two of every five rocks flew as flat polygons. The check passed
     * throughout, because asking is not the same as getting. The rule that catches it,
     * and the whole class it belongs to: every art key the build asks for must exist. */
    {
      const asked = [...new Set([...html.matchAll(/cineImg\("([A-Za-z0-9]+)"\)/g)].map((m) => m[1]))];
      const have = w.STARNIX_ASSETS || {};
      const missing = asked.filter((k) => typeof have[k] !== "string" || !have[k]);
      ok("Menu#9: every cinematic art key the build asks for is in the bundle (" + asked.length + " asked"
        + (missing.length ? ", MISSING: " + missing.join(", ") : "") + ")",
        asked.length >= 3 && missing.length === 0);
      ok("Menu#9: the belt beat indexes its rock sprites modulo the ones that exist",
        html.includes("asteroidA[o.spr % asteroidA.length]") && html.includes("if (aA && aA.ready)"));
    }
    ok("cinematic flies our REAL ARM art (armStation / bcmShip / armEnemyDive) with vector fallback (v0.124.0, Jason)",
      html.includes('cineImg("armStation")') && html.includes('cineImg("bcmShip")') && html.includes('cineImg("armEnemyDive")')
      && html.includes("stationA && stationA.ready") && html.includes("warshipA && warshipA.ready") && html.includes("diveA && diveA.ready"));

    // Menu#7 (v0.181.0): the finale is launchable — real buttons, per-game accents.
    // (v2.49.0) The gold fourth line was the Nutanix Interrogation Test, removed in
    // d4892dd when the practice exam moved out of StarNix into its own tool.
    {
      SN.shell.showCinematic();
      const goes = w.document.querySelectorAll(".sx-mission-go");
      const ids = Array.from(goes).map(b => b.getAttribute("data-game")).join(",");
      ok("Menu#7: three launchable mission lines (ARM,CC,KBB) with accent-coded names",
        goes.length === 3 && ids === "ARM,CC,KBB"
        && !!w.document.querySelector('.sx-mission-go[data-game="ARM"] .acc-iris')
        && !!w.document.querySelector('.sx-mission-go[data-game="CC"] .acc-aqua')
        && !!w.document.querySelector('.sx-mission-go[data-game="KBB"] .acc-peach'));
      // Wiring, not a live launch: launching a game from here leaves the shell mounted
      // in it, and every menu check below then reads a stale DOM. That the click path
      // works is CC/ARM/KBB's own sections, further down, from a clean menu.
      ok("Menu#7: every mission line names a REGISTERED game, and the handler routes by data-game",
        Array.from(goes).every((b) => !!SN.getGame(b.getAttribute("data-game")))
        && html.includes('go.getAttribute("data-game")'));
      SN.shell.showMenu();
    }
  }

  console.log("\nC. Menu");
  const shell = SN.shell;
  shell.showMenu();
  ok("screen === menu", shell.screen === "menu");
  ok("three game cards rendered (ARM/KBB/CC)", w.document.querySelectorAll(".sx-card").length === 3);
  ok("no card disabled (all three live)", w.document.querySelectorAll(".sx-card-disabled").length === 0);
  {
    const bg = w.document.querySelector(".sx-menu-bg");
    // (v2.49.0) split from one compound assertion: it could fail five ways and name none.
    ok("menu is the Bridge: mission strips present", !!w.document.querySelector(".sx-strip"));
    ok("menu is the Bridge: the bridge dock is present", !!w.document.querySelector(".sx-bridge-dock"));
    ok("menu is the Bridge: the shattered station is GONE (v0.120.0, Jason — keep the bg)",
      w.document.querySelectorAll(".sx-shard").length === 0 && !w.document.querySelector(".sx-station-group"));
    const photo = w.document.querySelector(".sx-menu-photo");
    ok("menu has a moving photo background wired to menuBg", !!photo && photo.classList.contains("on") && /menuBg|data:image\/(jpeg|png|webp)/.test(photo.style.backgroundImage || ""));
    ok("menu shows the NX-SRC crew crest", !!w.document.querySelector(".sx-crest .sx-crest-x"));
    // (v0.143.0, V1.1 NIT#2) the quarantine pile resolved: three authored questions were dead
    // to an invisible U+2028 in their @explain lines ("empty explanation" was a parser artifact)
    {
      const poolN = SN.core.questions.pool();
      const hasStem = (frag) => poolN.some((q) => q.stem.indexOf(frag) >= 0);
      ok("NIT#2: the three U+2028 casualties are LIVE again (a1q59/a1q60/a2q55)",
        hasStem("Auto Detect for Reserve Capacity") && hasStem("establishing synchronous replication between them") && hasStem("application data is completely missing"));
      ok("NIT#2/v0.174.0: the DR question is LIVE via its canonical e1 version (Jason's ruling: content stands as stated; a1q52 held only as the superseded twin), bank at 255",
        w.STARNIX_QUESTIONS.questions.filter((q) => /evaluating Nutanix DR to protect some business-critical/.test(q.stem)).length === 1
        && w.STARNIX_QUESTIONS.questions.length === 255);   // the raw bank (pool() adds fixture seeds)
      ok("NIT#2: every bank question still carries optionNotes (indent-sensitive parse guard)",
        w.STARNIX_QUESTIONS.questions.filter((q) => q.optionNotes && q.optionNotes.some((nn) => nn && nn.length)).length === 255);
      // (v0.175.0, V1.1 CC#6) the squeeze long-wall + entry cue, source-pinned (canvas look is QA's)
      {
        const srcSq = w.document.documentElement.innerHTML;
        ok("CC#6: stretched squeeze instances scale z x6.5 to bridge the row gap, and the module cues CANYON NARROWS with a side call",
          srcSq.indexOf("setPosScaleZ(sm, sp, sq, ss, 0, 0, -o.z, 6.5)") >= 0
          && srcSq.indexOf("CANYON NARROWS") >= 0
          && srcSq.indexOf("this._emit && this._emit('squeeze')") >= 0);
      }
      // (v0.173.0, Jason) the e1 interchange bank: canonical versions supersede classic dups
      {
        const e1 = w.STARNIX_QUESTIONS.questions.filter((q) => q.briefing && q.tags);
        ok("E1/v0.174.0: all 51 canonical questions live, every one with its authored briefing + tags (Jason's ruling: content stands as stated)",
          e1.length === 51 && e1.every((q) => q.briefing.length > 60 && Array.isArray(q.tags) && q.tags.length > 0)
          && w.STARNIX_QUESTIONS.questions.filter((q) => q.tags && !q.briefing).length === 0);
        /* (v2.49.0) Exhibit questions need a full-screen image, which no arcade game can
         * give them, so StarNix's provider filters them out and all three games carry a
         * loud guard for one that leaks anyway. Since the exam left, that filter is the
         * ONLY thing standing between a player and a question whose picture they will
         * never see — so it is checked here rather than assumed. The alt text itself is
         * the bank's business and bank-test.mjs owns it. */
        const exhibits = w.STARNIX_QUESTIONS.questions.filter((q) => q.image);
        ok("the bank still ships exhibit questions (" + exhibits.length + " of " + w.STARNIX_QUESTIONS.questions.length + ")", exhibits.length > 0);
        {
          /* The filter lives in the provider's candidate builder, not in pool() — pool()
           * is the raw bank. So this is measured the way a game meets it: by drawing. */
          const provX = SN.core.questions;
          const rngX = SN.core.makeRng(4242);
          let served = 0, withImage = 0;
          for (let dx = 0; dx < 400; dx++) {
            const qx = provX.next({ rng: rngX }).question;
            served++; if (qx.image) withImage++;
          }
          ok("400 draws served a game and not one was an exhibit (" + served + " drawn, " + withImage + " with an image)", withImage === 0);
          const srcAlt = w.document.documentElement.innerHTML;
          ok("all three games carry the leaked-exhibit guard anyway",
            (srcAlt.match(/Exhibit question served in error/g) || []).length >= 3);
        }
        ok("E1/v0.174.0: exactly one live copy per superseded stem (the a1 twins hold as dups)",
          w.STARNIX_QUESTIONS.questions.filter((q) => /same last octet in the IP address in DR/.test(q.stem)).length === 1
          && w.STARNIX_QUESTIONS.questions.filter((q) => /guest customization options are available when creating/.test(q.stem)).length === 1);
      }
      // (v0.172.0, Jason) the a6 practice-exam pack: 25 live, ALL priority-2, keys cross-checked
      {
        const a6 = w.STARNIX_QUESTIONS.questions.filter((q) => q.priority === 2);
        ok("PRIORITY: all 25 a6 questions ship with priority 2 (draw-boosted + due-cap boarding)",
          a6.length === 25 && a6.every((q) => q.options.length >= 4 && q.explanation.length > 40));
        ok("PRIORITY: the a6 multis survived import (10 of the 25 are choose-two)",
          a6.filter((q) => Array.isArray(q.correctIndices) && q.correctIndices.length === 2).length === 10);
      }
      // (v0.145.0, V1.1 Menu#3) the bridge status board fills the dead right side
      const brP = w.document.querySelector(".sx-bridge-right");
      ok("Menu#3: the bridge shows the Station systems board (3 compact stats + 6 domain readouts)",
        !!brP && brP.querySelectorAll(".sx-br-grid .sx-stat").length === 3 && brP.querySelectorAll(".sx-br-list .sx-dom-row").length === 6);
      ok("Menu#3: desktop-only — the <=1000px rule hides the board (A1 must-fit lesson)",
        /@media \(max-width:1000px\)\{\.sx-bridge-left\{max-width:none;\}\.sx-bridge-right\{display:none;\}\}/.test(w.document.documentElement.innerHTML));
      brP.click(); await wait(10);
      ok("Menu#3: the board clicks through to the Codex", shell.screen === "stats");
      shell.showMenu(); await wait(10);
      // (v0.172.0, Jason) priority questions: draw-weight boost + due-cap boarding
      {
        const I2 = SN._internal;
        const Qp = (id, pr) => { const q = { id, cert: "NCP-MCI", domain: "storage", difficulty: 2, stem: "stem " + id, options: ["a", "b", "c", "d"], correctIndex: 0, explanation: "x" }; if (pr) q.priority = pr; return q; };
        const packP = { id: "NCP-MCI", domains: I2.DOMAINS, questions: [Qp("pri-hi", 2), Qp("pri-lo")] };
        const mP = I2.makeMasteryStore({ mastery: {}, totals: { questionsSeen: 0, correct: 0, incorrect: 0 } }, {});
        const provP = I2.makeQuestionProvider(packP, mP);
        const rngP = I2.makeRng(777);
        let hiN = 0, loN = 0;
        for (let dp = 0; dp < 900; dp++) { const qd = provP.next({ rng: rngP }).question; if (qd.id === "pri-hi") hiN++; else loN++; }
        ok("PRIORITY: a priority-2 question draws ~2x its identical twin (" + hiN + " vs " + loN + " over 900)",
          hiN > loN * 1.6 && loN > 150);
        // (v2.49.0) The other half of PRIORITY — boarding within the due cap — was
        // shell._duePartition, which went with the exam in d4892dd. The draw-weight
        // boost above is the half StarNix still has, and it is the half that reaches a
        // player here. The due queue itself is the launcher's, gated by review-test.mjs.
        ok("PRIORITY: the exam-only due-cap partitioner really is gone (not merely renamed)",
          typeof shell._duePartition !== "function" && !/_duePartition/.test(w.document.documentElement.innerHTML));
      }
      // (v0.170.0, V1.1 FE#6) colorblind shape-cue audit: never color alone (01 s12)
      {
        const cssAll = w.document.documentElement.innerHTML;
        // (v2.49.0) The graded-option and sim-chip clauses described exam surfaces that
        // left in d4892dd. What remains is the rule itself, applied to the surfaces that
        // are still here: never colour alone.
        ok("FE#6: KBB's FINAL pulse + intent alert and CC's low timer carry \u26A0 shape cues",
          cssAll.indexOf(".kbb-statline .final::before") >= 0 && cssAll.indexOf(".kbb-intent.alert::before") >= 0
          && cssAll.indexOf(".cc-qtimer.low::before") >= 0);
        ok("FE#6: domain bars use PATTERN tiers (stripes weak/mid, solid strong) and heat tiles use border STYLES",
          /sx-dom-fill\.weak\{background:repeating-linear-gradient/.test(cssAll)
          && /sx-dom-fill\.mid\{background:repeating-linear-gradient/.test(cssAll)
          && cssAll.indexOf(".sx-heat.t2{border-style:dashed;}") >= 0);
        ok("FE#6: no orphan exam styling left behind in the build",
          cssAll.indexOf(".sx-exam-opt") < 0 && cssAll.indexOf(".sx-simchip") < 0);
      }
      // (v0.169.0, V1.1 NIT#6) sim review filters + the blank-submit confirmation
      /* (v2.49.0) The sim review filters and the blank-submit confirmation were exam
       * surfaces. exam.js and the shell's exam screens were deleted in d4892dd, so these
       * checks drove functions that no longer exist. Nothing here is repairable — the
       * practice exam is its own tool now, with its own engine harness. */

      // (v0.168.0, V1.1 Menu#6) first-run coach mark: one-shot, latched, launch-dismissed
      {
        const hadFlag = SN.core.profile.firstMenuSeen;
        SN.core.profile.firstMenuSeen = false;
        shell.showMenu(); await wait(10);
        const tipC = w.document.querySelector(".sx-coach-tip");
        const pulseC = w.document.querySelector(".sx-strip.sx-coach-pulse");
        ok("Menu#6: a fresh recruit gets the tip + the pulsing ARM strip",
          !!tipC && /New recruit\?/.test(tipC.textContent) && !!pulseC && /ARM/.test(pulseC.textContent));
        w.document.querySelector(".sx-coach-x").click(); await wait(10);
        ok("Menu#6: dismissing latches firstMenuSeen and clears both marks",
          SN.core.profile.firstMenuSeen === true && !w.document.querySelector(".sx-coach-tip") && !w.document.querySelector(".sx-coach-pulse"));
        shell.showMenu(); await wait(10);
        ok("Menu#6: the latch is ONE-SHOT — the next menu render shows no coach mark",
          !w.document.querySelector(".sx-coach-tip"));
        SN.core.profile.firstMenuSeen = hadFlag !== undefined ? hadFlag : true;
      }
      // (v0.167.0, V1.1 Flow#6) the due queue reaches beyond the bridge
      {
        const mmF = SN.core.mastery.all();
        const poolF = SN.core.questions.pool();
        const addF = [];
        for (let fi = 30; fi < 33; fi++) { const idF = poolF[fi].id; if (!mmF[idF]) { mmF[idF] = { id: idF, seen: 1, correct: 0, incorrect: 1, streak: 0, box: 0, lastSeen: 0 }; addF.push(idF); } }
        const dueN = SN.core.mastery.dueList(SN.core.clock.now()).length;
        shell.showTitle(); await wait(10);
        const startB = [...w.document.querySelectorAll("button")].find((b) => /^Start/.test(b.textContent));
        /* (v2.49.0) Flow#6 put the due count on the title button and in the pause card,
         * and both lines launched the exam's due drill. The drill went in d4892dd and the
         * due queue is the launcher's now — StarNix surfaces due questions by RESURFACING
         * them as you play, which is what the planner's own line says (checked in Flow#2
         * below). What is pinned here is that no dead counter is left on either screen. */
        ok("Flow#6: the title screen offers a plain Start, with no count it cannot act on",
          !!startB && !/\d+ due/.test(startB.textContent));
        shell.showMenu(); await wait(10);
        shell.enterGame("ARM"); await wait(30);
        shell.openPause(); await wait(10);
        ok("Flow#6: the pause card carries no dead due counter", !w.document.querySelector(".sx-pause-due"));
        shell.closePause(); await wait(10);
        shell.exitGame(); await wait(30);
        const dbF = w.document.querySelector(".sx-debrief");
        if (dbF) {
          ok("Flow#6: the DEBRIEF offers Review due when the queue is hot",
            !!dbF.querySelector(".sx-debrief-review") && /due/.test(dbF.querySelector(".sx-debrief-due").textContent));
          dbF.querySelector(".sx-debrief-done").click(); await wait(10);
        } else {
          ok("Flow#6: the DEBRIEF offers Review due when the queue is hot (no debrief — no answers this sortie, acceptable path)", true);
        }
        addF.forEach((idF) => { delete mmF[idF]; });
        shell.showMenu(); await wait(10);
      }
      // (v0.166.0, V1.1 Backend#6) size budgets: a bloated drop fails the gate like any pin
      {
        const fsMod = await import("node:fs");
        const ledger = JSON.parse(fsMod.readFileSync(new URL("./build-size.json", import.meta.url), "utf8"));
        const BUDGETS = {   // bytes; measured 2026-07-11 + ~10-15% headroom. Raise DELIBERATELY, in a reviewed diff.
          assets: 2900000, three: 640000, questions: 430000, exhibits: 3800000,   // deliberate raises: questions 360->430k (v0.172 a6 pack); exhibits 2.5->3.8M (v0.173 e1 hi-res exhibits — q16+q37 are 1.1MB of it, WebP candidates)
          core: 120000, shell: 200000, arm: 280000, kbb: 260000, cc: 240000, exam: 90000, audio: 130000, font: 60000,
          total: 8700000,
        };
        const over = Object.keys(BUDGETS).filter((k) => (ledger[k] || 0) > BUDGETS[k]);
        ok("Backend#6: every module inside its declared byte budget" + (over.length ? " — OVER: " + over.map((k) => k + " " + ledger[k] + ">" + BUDGETS[k]).join(", ") : ""),
          over.length === 0);
        ok("Backend#6: the bank stays COMPACT (no pretty-print indentation in questions.js)",
          !/\n  "id":/.test(fsMod.readFileSync(new URL("./questions.js", import.meta.url), "utf8")));
        ok("Backend#6: the report persisted (per-module + gzip) for humans and this gate",
          typeof ledger.gzip === "number" && ledger.gzip > 0 && typeof ledger.assets === "number");
      }
      // (v0.165.0, V1.1 NIT#5) the real post-sim report: timing, review-all, per-domain history
      /* (v2.49.0) The post-sim report — timing, review-all, per-domain history — was the
       * exam's end screen. Gone with exam.js in d4892dd. */

      /* (v0.164.0, V1.1 FE#5) screen-reader pass.
       * (v2.49.0) Most of this pass measured the exam's option semantics and its two
       * live regions, and the exam left in d4892dd. The part that survived is the part
       * that was never the exam's: the shell's own toast. The games' question panels
       * have their own semantics checks in their own sections. */
      {
        shell.showMenu(); await wait(10);
        shell._toast("sr probe toast");
        const tEl = [...w.document.querySelectorAll(".sx-toast")].pop();
        ok("FE#5: toasts announce (role=status)", !!tEl && tEl.getAttribute("role") === "status");
      }
      // (v0.163.0, V1.1 Flow#5) blueprint quotas: mechanism live + pinned, WEIGHTS quarantined
      {
        const BP = SN.blueprint;
        ok("Flow#5: WEIGHTS ships QUARANTINED (null) — the official EBG publishes no section weights",
          BP && BP.WEIGHTS === null);
        const mkQ = (d, n) => Array.from({ length: n }, (_, i) => ({ id: d + i, domain: d }));
        const poolQ = [...mkQ("storage", 40), ...mkQ("vms", 40), ...mkQ("networking", 40)];
        const q1 = BP.quota(poolQ, 20, { storage: 0.5, vms: 0.3, networking: 0.2 });
        const cnt = (r, d) => r.filter((x) => x.domain === d).length;
        ok("Flow#5: quota fills per-domain shares exactly (10/6/4 of 20 at 50/30/20)",
          q1.length === 20 && cnt(q1, "storage") === 10 && cnt(q1, "vms") === 6 && cnt(q1, "networking") === 4);
        const thin = [...mkQ("storage", 3), ...mkQ("vms", 40)];
        const q2 = BP.quota(thin, 20, { storage: 0.5, vms: 0.5 });
        ok("Flow#5: a thin domain caps at its stock and the shortfall backfills (3 storage + 17 vms)",
          q2.length === 20 && cnt(q2, "storage") === 3 && cnt(q2, "vms") === 17);
        ok("Flow#5: null weights (the quarantine) return null — callers keep the flat shuffle",
          BP.quota(poolQ, 20, null) === null);
        const src = w.document.documentElement.innerHTML;
        /* (v2.49.0) The only consumer of the blueprint quota was the exam sim. The module
         * stays — it is pure, tested above, and is what a future sim would use — but the
         * thing to check now is that nothing consumes the QUARANTINED weights by accident. */
        ok("Flow#5: nothing in the build reads WEIGHTS while they are quarantined",
          !/blueprint\.WEIGHTS\s*\)/.test(src) || /WEIGHTS === null/.test(src));
      }
      // (v0.159.0, V1.1 Menu#5) the Disruptor beam carries ARM's full layered treatment
      {
        const srcW = w.document.documentElement.innerHTML;
        const wb = srcW.slice(srcW.indexOf("function drawWarBeam"), srcW.indexOf("function drawWarBeam") + 4200);
        ok("Menu#5: the cinematic beam is ARM's layered fire moment (charge gradient + dashed aim + glow/core strokes + impact flash), reduced keeps the flat line",
          wb.indexOf("createRadialGradient(noseX, wsy, 0, noseX, wsy") >= 0
          && wb.indexOf("setLineDash([6, 8])") >= 0
          && wb.indexOf('strokeStyle = "rgba(255,238,228,0.9)"') >= 0
          && wb.indexOf("impact flash at the station") >= 0
          && wb.indexOf("ctx.lineWidth = 3; ctx.globalAlpha = 0.9;") >= 0);   // the reduced-motion flat line survives
      }
      // (v0.158.0, V1.1 Backend#5) zero runtime CDNs: both dependencies vendored + sha-pinned
      {
        const headHtml = w.document.documentElement.innerHTML;
        ok("Backend#5: NO runtime CDN references survive in the build (cdnjs / googleapis / gstatic)",
          !/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(headHtml));
        ok("Backend#5: Three.js r128 is INLINED and executes (window.THREE defined, r128)",
          !!w.THREE && w.THREE.REVISION === "128");
        ok("Backend#5: Montserrat ships as an inlined variable @font-face (wght 400-800, OFL note kept)",
          /@font-face\{font-family:"Montserrat";font-style:normal;font-weight:400 800/.test(headHtml)
          && /OFL licensed/.test(headHtml));
      }
      // (v0.153.0, V1.1 Flow#4) study-day streak: banks at rollover, extends live, dies on a gap
      {
        const P = { daily: null };
        SN.daily.ensure(P, "2026-07-01"); P.daily.correct = 3;
        SN.daily.ensure(P, "2026-07-02");
        ok("Flow#4: an active day banks into the chain at rollover (1, best 1)",
          P.streakDays === 1 && P.streakDaysBest === 1 && P.streakLast === "2026-07-01");
        ok("Flow#4: an idle today SHOWS the banked chain but does not extend it", SN.daily.streak(P) === 1);
        P.daily.correct = 2;
        ok("Flow#4: answering today extends the flame live (2)", SN.daily.streak(P) === 2);
        SN.daily.ensure(P, "2026-07-03"); P.daily.correct = 1;
        SN.daily.ensure(P, "2026-07-05");   // 07-04 skipped entirely
        ok("Flow#4: the chain banks through 07-03 (3 days)", P.streakDays === 3 && P.streakDaysBest === 3);
        ok("Flow#4: a GAP DAY kills the visible flame (idle 07-05 shows 0)", SN.daily.streak(P) === 0);
        P.daily.correct = 5;
        ok("Flow#4: studying after a gap restarts at 1, best stays 3", SN.daily.streak(P) === 1 && P.streakDaysBest === 3);
        SN.daily.ensure(P, "2026-07-06");
        ok("Flow#4: BANKING after a gap restarts the stored chain at 1 (not +1)",
          P.streakDays === 1 && P.streakDaysBest === 3 && P.streakLast === "2026-07-05");
        // claim kicker: first claim of an on-streak day pays +5/chain-day (cap 25), once
        const P2 = { daily: null, xp: 0, rankSeen: 0, achievements: {}, streaks: {}, streaksBest: {}, totals: { questionsSeen: 0 }, mastery: {}, bests: {}, settings: {} };
        SN.daily.ensure(P2, "2026-07-01"); P2.daily.correct = 1;
        SN.daily.ensure(P2, "2026-07-02"); P2.daily.correct = 1;   // chain = 2 live
        P2.daily.missions[0].target = 0; P2.daily.missions[1].target = 0;   // instantly claimable
        const base0 = P2.daily.missions[0].xp, base1 = P2.daily.missions[1].xp;
        const paid0 = SN.daily.claim(P2, 0);
        ok("Flow#4: the FIRST claim of an on-streak day pays the kicker (+" + (paid0 - base0) + ")",
          paid0 === base0 + Math.min(25, 5 * 2) && P2.daily.streakBonusPaid === true);
        ok("Flow#4: the second claim the same day pays plain XP", SN.daily.claim(P2, 1) === base1);
        // achievements ride the same helper
        const by2 = {}; SN.achievements.LIST.forEach((d) => { by2[d.id] = d; });
        ok("Flow#4: streak-7 / streak-30 achievements gate on the LIVE chain",
          by2["streak-7"].check({ profile: { streakDays: 6, streakLast: "2026-07-01", daily: { date: "2026-07-02", correct: 1 } } }) === true
          && by2["streak-7"].check({ profile: { streakDays: 5, streakLast: "2026-07-01", daily: { date: "2026-07-02", correct: 1 } } }) === false
          && by2["streak-30"].check({ profile: { streakDays: 30, streakLast: "2026-07-01", daily: { date: "2026-07-02", correct: 0 } } }) === true);
        // the flame chip on the bridge: link the chain (streakLast = the day before today's daily)
        SN.daily.ensure(SN.core.profile);
        const todayK = SN.core.profile.daily.date.split("-").map(Number);
        const yd = new Date(todayK[0], todayK[1] - 1, todayK[2] - 1);
        const ydK = yd.getFullYear() + "-" + String(yd.getMonth() + 1).padStart(2, "0") + "-" + String(yd.getDate()).padStart(2, "0");
        SN.core.profile.streakDays = 3; SN.core.profile.streakLast = ydK;
        const prevCorrect = SN.core.profile.daily.correct | 0;
        SN.core.profile.daily.correct = Math.max(1, prevCorrect);
        shell.showMenu(); await wait(10);
        const chipS = w.document.querySelector(".sx-streak-chip");
        ok("Flow#4: the bridge rank strip wears the flame chip when a chain is live",
          !!chipS && /4-day streak/.test(chipS.textContent));
        SN.core.profile.streakDays = 0; SN.core.profile.streakLast = null; SN.core.profile.daily.correct = prevCorrect;
        shell.showMenu(); await wait(10);
        ok("Flow#4: no chain, no chip", !w.document.querySelector(".sx-streak-chip"));
      }
      // (v0.152.0, V1.1 Menu#4) the cinematic shatter uses the REAL station art when ready
      {
        const src = w.document.documentElement.innerHTML;
        ok("Menu#4: drawShards breaks the real armStation sprite into 4x3 drawImage fragments (rect confetti kept as the fallback)",
          /FRAG_GX = 4, FRAG_GY = 3/.test(src)
          && /if \(stationA && stationA\.ready\) \{   \/\/ \(v0\.152\.0, Menu#4\)/.test(src)   // the LIVE gate, not just dead code
          && /ctx\.drawImage\(stationA\.img, fgx2 \* scw, fgy2 \* sch, scw, sch, -dcw \/ 2, -dch \/ 2, dcw, dch\)/.test(src)
          && /fillStyle = col; ctx\.fillRect\(-o\.sz \/ 2, -o\.sz \/ 2, o\.sz, o\.sz \* 0\.7\)/.test(src));
      }
      // (v0.151.0, V1.1 FE#4) toast service: stacking, length-scaled duration, dedupe
      {
        shell._toast("first toast");
        shell._toast("second toast that is quite a bit longer than the first one, so it must outlive it");
        shell._toast("second toast that is quite a bit longer than the first one, so it must outlive it");
        const ts = [...w.document.querySelectorAll(".sx-toast")];
        ok("FE#4: simultaneous toasts STACK bottom-up instead of overprinting",
          ts.length === 2 && ts[0].style.bottom !== ts[1].style.bottom && ts.every((n) => n.style.bottom !== ""));
        ok("FE#4: an identical live message dedupes into a \u00d7N counter",
          /\u00d72$/.test(ts[1].textContent));
        await wait(2400);
        const ts2 = [...w.document.querySelectorAll(".sx-toast")];
        ok("FE#4: duration scales with length — the short toast is gone, the long one still up",
          ts2.length === 1 && /longer/.test(ts2[0].textContent));
        await wait(3800);
        ok("FE#4: the stack drains clean", w.document.querySelectorAll(".sx-toast").length === 0);
      }
      // (v0.150.0, V1.1 FE) reduced motion unified on ONE attribute: <html data-motion>
      {
        SN.core.profile.settings.reducedMotion = true; shell._applyMotion();
        ok("FE-motion: the in-app toggle stamps data-motion=reduced on <html>",
          w.document.documentElement.getAttribute("data-motion") === "reduced");
        SN.core.profile.settings.reducedMotion = false; shell._applyMotion();
        ok("FE-motion: toggling off removes the attribute", !w.document.documentElement.hasAttribute("data-motion"));
        const css = w.document.documentElement.innerHTML;
        ok("ARM#10/C2: the thruster flame ships at 1.5x (the trail tints finally have a canvas)",
      html.includes("c2d.moveTo(-13, -7.5); c2d.lineTo(-13 - (13.5 + (reducedMotion ? 6 : runRng.next() * 15)), 0); c2d.lineTo(-13, 7.5);"));
    ok("FE#9: the ship power-on splash — stepper, 10 real progress steps, fault trap, reduced-motion static, boot removal",
      html.includes('<div id="sx-boot"') && html.includes("window.__sxBoot = (function ()")
      // (v2.49.0) 10 -> 8: exam.js left the module list in d4892dd and the exhibits step
      // went with the baked-in bank. One __sxBoot call per build step, still pinned.
      && (html.match(/__sxBoot\(/g) || []).length === 8
      // (v2.49.0) "Loading the question bank" was a step that baked the bank into the
      // build. The bank is fetched at runtime now and that step is gone.
      && html.includes("Powering up the bridge") && html.includes("Charting the Kuiper Belt")
      && html.includes("@media (prefers-reduced-motion: reduce) { #sx-boot .sxb-crest svg { animation: none; } }")
      && html.includes("Boot fault: ") && html.includes('bs2.parentNode.removeChild(bs2)'));
    ok("FE#9: the splash is GONE once the shell has the bridge (boot removed it in this very DOM)",
      !w.document.getElementById("sx-boot"));
    ok("FE#8: tabular numerals on ticking readouts + the 11px micro floor + type-scale tokens",
      html.includes(":root{--fs-micro:11px;--fs-body:13px;--fs-label:12px;--fs-num:14px;}")
      && html.includes(".cc-dist{font-size:13px;color:#9a9aad;font-variant-numeric:tabular-nums;}")
      && html.includes(".sx-rank-xp{color:var(--mid);font-size:12px;font-variant-numeric:tabular-nums;}")
      && html.includes(".sx-dom-count{width:48px;text-align:right;color:var(--text);font-weight:700;font-variant-numeric:tabular-nums;}")
      && html.includes(".kbb-ring .rt.tiny{font-size:11px")
      && html.includes(".kbb-acard .an{font-weight:800;font-size:11px")
      && !/\.kbb-[^}]{0,220}font-size:10(\.5)?px/.test(html)
      && html.includes(".arm-srow b{color:") && html.includes("letter-spacing:.02em;font-variant-numeric:tabular-nums;}"));
    ok("FE#7: shell small-screen breakpoint + 44px touch targets + safe-area insets in the build",
      // (v2.49.0) the stacking rule moved from .sx-bridge-topright to .sx-bridge-top
      html.includes("@media (max-width:600px){.sx-bridge-top{flex-direction:column")
      && (html.match(/env\(safe-area-inset-/g) || []).length >= 8
      && html.includes(".sx-back{padding:7px 14px;font-size:13px;min-height:44px")
      && html.includes(".sx-pausebtn{padding:7px 14px;font-size:13px;min-height:44px")
      && html.includes("@media (pointer:coarse){.sx-daily-claim{min-height:44px"));
    ok("FE-motion: every media-only gap now has a [data-motion=reduced] twin (title drift / KBB strike / exam meter / CC banners)",
          /\[data-motion=reduced\] \.sx-title-photo\.on/.test(css.replace(/\[data-motion=reduced\] \.sx-menu-photo\.on,/, ""))
          && /\[data-motion=reduced\] \.kbb-en-strike/.test(css)
          // (v2.49.0) the exam meter's twin went with the exam in d4892dd
          && /\[data-motion=reduced\] \.cc-turn-banner\{animation:none;\}/.test(css)
          && /\[data-motion=reduced\] \.cc-mile-banner/.test(css)
          && /\[data-motion=reduced\] \.cc-boost-ovr/.test(css));
      }
    }
    // (v0.141.0, V1.1 Flow#2) the flight plan: every branch of the PURE planner + the card
    {
      const R = SN.plan.rank, NOWP = 1750000000000, DAYP = 86400000;
      ok("Flow#2: due reviews outrank everything", R({ dueCount: 14 }).kind === "due" && /14 reviews due/.test(R({ dueCount: 14 }).label));
      const pd = R({ dueCount: 0, daily: [{ done: true }, { done: false, label: "3 more KBB correct", mission: { game: "KBB" } }] });
      ok("Flow#2: next rank = the first UNDONE daily, CTA launches its game", pd.kind === "daily" && pd.game === "KBB" && /Daily: 3 more KBB correct/.test(pd.label) && /Launch KBB/.test(pd.cta));
      /* (v2.49.0) Two branches of the planner recommended sitting an exam sim — one when
       * the last sim had gone stale, one when there had never been a sim. Neither can be
       * acted on since d4892dd, and the planner no longer offers them. A recommendation
       * you cannot follow is worse than no recommendation, so the check is that they are
       * really gone rather than merely unreachable. */
      ok("Flow#2: the planner never recommends a sim that cannot be sat",
        R({ dueCount: 0, daily: [{ done: true }], now: NOWP, lastSimAt: NOWP - 9 * DAYP }).kind !== "sim"
        && R({ dueCount: 0, daily: [], now: NOWP, lastSimAt: 0 }).kind !== "sim");
      const pw = R({ dueCount: 0, daily: [], now: NOWP, lastSimAt: NOWP - DAYP, weakest: { domain: "vms", masteredPct: 0.2 } });
      ok("Flow#2: fresh sim -> weakest-domain drill (<80% mastered)", pw.kind === "domain" && /vms/.test(pw.label) && /20% mastered/.test(pw.label));
      ok("Flow#2: nothing to do = all clear, NO CTA", R({ dueCount: 0, daily: [], now: NOWP, lastSimAt: NOWP - DAYP, weakest: { domain: "vms", masteredPct: 0.95 } }).kind === "clear" && R({ dueCount: 0, daily: [], now: NOWP, lastSimAt: NOWP - DAYP, weakest: { domain: "vms", masteredPct: 0.95 } }).cta === null);
      const pcEl = w.document.querySelector(".sx-plan-card");
      ok("Flow#2: the fresh-profile bridge shows the flight-plan card (an undone daily leads)",
        !!pcEl && /Today's flight plan/.test(pcEl.textContent) && /Daily:/.test(pcEl.textContent));
      const pInt = SN.plan.next(SN.core);
      ok("Flow#2: plan.next reads the live core without throwing", !!pInt && typeof pInt.kind === "string" && typeof pInt.label === "string");
    }
    // (v0.128.0, V1.1 Menu#1) Continue survives a reload: with in-memory lastGameId gone,
    // the dock CTA rebuilds from the PERSISTED profile.lastGame
    {
      const memLG = shell.lastGameId;
      shell.lastGameId = null; SN.core.profile.lastGame = "CC";
      shell.showMenu(); await wait(10);
      const cta = w.document.querySelector(".sx-dock-continue");
      ok("Continue rebuilds from persisted profile.lastGame after a 'reload' (dock CTA present, right game)",
        !!cta && /Chasm/.test(cta.textContent));
      ok("the redundant top Continue stays deduped (dock CTA is the only Continue)",
        ![...w.document.querySelectorAll(".sx-menu-top .sx-btn")].some(b => /^Continue$/.test(b.textContent.trim())));
      shell.enterGame("ARM"); await wait(10);
      ok("enterGame persists profile.lastGame", SN.core.profile.lastGame === "ARM");
      shell.exitGame(); await wait(60);
      shell.lastGameId = memLG; delete SN.core.profile.lastGame; shell.showMenu(); await wait(10);
    }
  }
  {
    // (v2.49.0) The exam left StarNix in d4892dd. What is checked now is that it left
    // CLEANLY: no orphan tile, no orphan footer button, nothing that opens a screen the
    // build no longer contains.
    const cards = Array.prototype.slice.call(w.document.querySelectorAll(".sx-card"));
    ok("no exam tile left behind on the bridge", !cards.some(c => /Interrogation Test|Practice Exam/i.test(c.textContent)));
    ok("no exam footer button left behind", !w.document.querySelector(".sx-btn-exam"));
    ok("the shell has no exam screens at all", typeof shell.showExamSetup !== "function" && typeof shell.showExam !== "function");
  }

  console.log("\nD. ARM");
  calls.length = 0;
  delete SN.core.profile.saves; shell.enterGame("ARM");
  ok("screen === game:ARM", shell.screen === "game:ARM");
  ok("build-version badge persists into a game (on root, not stage)", !!w.document.querySelector(".sx-build-badge"));
  ok("ARM track played on enter", calls.indexOf("track:arm") !== -1);
  await wait(10);
  ok("ARM built DOM in game root", shell.currentGameRoot && shell.currentGameRoot.childNodes.length > 0);
  // P6a: intro cutscene plays first, is skippable, hands off to the briefing
  {
    const aT = shell.currentGameRoot.__armTest;
    ok("ARM starts in the intro cutscene", !!aT && aT.state() === "INTRO");
    const skip = w.document.querySelector(".arm-introskip");
    ok("ARM intro shows a Skip button", !!skip);
    { const e = await runFrames(3); ok("ARM intro loop runs without error", e.length === 0); }
    if (skip) skip.dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("skipping the intro reaches the briefing", aT && aT.state() === "BRIEF");
    ok("intro overlay hidden after skip", (function () { const b = w.document.querySelector(".arm-introbar"); return !b || b.style.display === "none"; })());
  }
  { const e = await runFrames(); ok("ARM draw loop runs without error", e.length === 0); }
  const armRoot = shell.currentGameRoot;
  shell.exitGame();
  ok("ARM unmounted -> menu", shell.screen === "menu");
  ok("ARM game root detached", !armRoot.parentNode);

  console.log("\nD2. ARM charge/recharge model (P1 — no softlock)");
  delete SN.core.profile.saves; shell.enterGame("ARM");
  await wait(10);
  const armT = shell.currentGameRoot.__armTest;
  ok("ARM exposes test seam", !!armT);
  if (armT) {
    // ---- Core positions randomized per sector (seeded, spaced, in-bounds) ----
    {
      const MAPW = 3200, MAPH = 2200, M = 380, MINSP = 700;
      const inb = (p) => p.x >= M && p.x <= MAPW - M && p.y >= M && p.y <= MAPH - M;
      const spaced = (a) => { for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) { const dx = a[i].x - a[j].x, dy = a[i].y - a[j].y; if (dx * dx + dy * dy < MINSP * MINSP) return false; } return true; };
      const s1 = armT.coresForSector(1), s2 = armT.coresForSector(2);
      ok("ARM cores: 5 positions, all in-bounds", s1.length === 5 && s1.every(inb));
      ok("ARM cores: spaced so combat rings don't overlap", spaced(s1) && spaced(s2));
      ok("ARM cores: randomized per sector (sector 1 != sector 2)", JSON.stringify(s1) !== JSON.stringify(s2));
      ok("ARM cores: deterministic for a given seed", JSON.stringify(s1) === JSON.stringify(armT.coresForSector(1)));
      const live = armT.cores();
      const FIXED = [[540, 560], [2680, 480], [1640, 1180], [560, 1760], [2660, 1780]];
      const isFixed = live.length === 5 && live.every((c, i) => c.x === FIXED[i][0] && c.y === FIXED[i][1]);
      ok("ARM live cores use the randomized layout, not the fixed LAYOUT", live.length === 5 && !isFixed);
    }
    // ---- Commander briefing dialogue tree ----
    armT.endBriefingIntro();             // INTRO -> BRIEF (renders the commander dialogue)
    ok("briefing opens on the commander intro", armT.state() === "BRIEF" && armT.briefInfo().core === -1);
    {
      const fx = armT.commsFx();
      ok("comms window has the scanline + signal transmission frame", fx.scanline && fx.signal && fx.portraitFx);
      ok("transmission animates when motion is allowed (gated on reducedMotion)", fx.animated === true);
    }
    armT.briefPick(0);                   // "Go ahead, sir" -> first core, teach step
    {
      const o = armT.briefOptions();
      ok("teach step offers understand / repeat / explain further", o.includes("I understand") && o.includes("Repeat") && o.includes("Explain further"));
      ok("commander briefing teaches the answer (info to learn, not a quiz)", armT.briefText().indexOf(armT.briefCoreAnswer()) >= 0);
      // A5 (v0.95.0): the answer lands LAST — the lead line must NOT contain it, the closing line must
      {
        const keys = [...w.document.querySelectorAll(".arm-comms-key")];
        ok("A5: Vega explains first — answer only in the CLOSING line",
          keys.length >= 2 && keys[0].textContent.indexOf(armT.briefCoreAnswer()) < 0
          && keys[keys.length - 1].textContent.indexOf(armT.briefCoreAnswer()) >= 0);
      }
      armT.briefPick(1); armT.briefPick(1); armT.briefPick(1);   // ask to repeat 3x
      ok("repeating 3x on a core makes the commander terse (easter egg)", armT.briefInfo().frustrated === true);
      armT.briefPick(2);                 // "Explain further" -> ELI5
      const o2 = armT.briefOptions();
      ok("explain-further switches to the deeper breakdown", armT.briefInfo().mode === "ELI5" && o2.includes("Yes, sir") && o2.includes("Please repeat, sir"));
      armT.briefPick(0);                 // "Yes, sir" -> next core
      ok("acknowledging advances to the next core", armT.briefInfo().core === 1);
    }
    armT.skipBriefing();                 // BRIEF -> WARP
    {
      const wi = armT.warpInfo();
      ok("hyperdrive warp is longer (>= 2.5s with the countdown)", wi.total >= 2.5);
      ok("warp opens on the 3-2-1 countdown phase", wi.phase === "countdown" && wi.number === 3);
      calls.length = 0;                    // isolate warp-sequence audio
      armT.step(wi.cd / 3 + 0.02);        // into the second beat
      ok("countdown ticks down (3 -> 2)", armT.warpInfo().number === 2);
      armT.step(wi.cd);                    // past the countdown, into the streaks
      ok("after the countdown the warp enters the streak tunnel", armT.warpInfo().phase === "streak");
      ok("warp countdown plays a rising charge (not a flat click)", calls.indexOf("sfx:count2") !== -1 && calls.indexOf("sfx:click") === -1);
      ok("the jump fires the hyperdrive whoosh", calls.indexOf("sfx:hyperdrive") !== -1);
    }
    armT.flushWarp();                    // WARP -> SECTOR
    ok("ARM reached SECTOR", armT.state() === "SECTOR");
    const s1qids = armT.coreQids();      // sector 1's questions (for the cross-sector no-reuse check)
    ok("starts with a full charge", armT.charges() === armT.maxCharges() && armT.charges() >= 1);
    const fired1 = armT.fire();
    ok("first shot fires (charge consumed)", fired1 === true && armT.charges() === 0);
    const fired2 = armT.fire();          // immediately, no charge ready
    ok("cannot fire at 0 charges", fired2 === false && armT.charges() === 0);
    for (let i = 0; i < 40; i++) armT.step(1 / 60);   // ~0.67s > 0.45 recharge
    ok("charge recharges over time", armT.charges() >= 1);
    ok("can fire again after recharge", armT.fire() === true);
    let everStuck = false;               // drain->recharge cycles never softlock
    for (let cycle = 0; cycle < 5 && !everStuck; cycle++) {
      while (armT.charges() > 0) armT.fire();
      let restored = false;
      for (let i = 0; i < 80 && !restored; i++) { armT.step(1 / 60); if (armT.charges() > 0) restored = true; }
      if (!restored) everStuck = true;
    }
    ok("never softlocks (always recharges to fireable)", everStuck === false);

    // post-collect invulnerability (collect beat) + D6 per-question timer.
    const coreList = armT.cores();
    const combat = coreList.filter(c => c.kind === "combat").map(c => c.idx);
    ok("found a combat core to clear", combat.length >= 1);
    if (combat.length >= 1) {
      const ci = combat[0];

      // Combat cores engage from a large danger ring; extract is contact. Verify both.
      const c0 = armT.cores().find(c => c.idx === ci);
      const ring = armT.combatRing();
      ok("combat danger ring is large (>= 250px reach)", ring >= 250);
      ok("core's fight not yet engaged", !c0.gate);
      armT.shipTo(c0.x + c0.r + ring + 140, c0.y);   // outside the ring
      armT.step(1 / 60);
      ok("ring does NOT engage from outside it", !armT.cores().find(c => c.idx === ci).gate);
      armT.shipTo(c0.x + c0.r + ring - 60, c0.y);     // inside the ring, far from contact
      armT.step(1 / 60);
      ok("entering the danger ring engages the fight from far (not on contact)", !!armT.cores().find(c => c.idx === ci).gate);

      armT.prepCore(ci);                 // clear guardians/asteroid -> core unlocks
      const u = armT.cores().find(c => c.idx === ci);
      armT.shipTo(u.x + u.r + 90, u.y);  // 90px out: well beyond contact, but inside the old ring
      armT.step(1 / 60);
      ok("extracting a cleared core is contact — ring distance does not auto-open it", !armT.hasQuestion());
      armT.arrive(ci);                   // fly onto the cleared core -> opens its question
      ok("flying onto the cleared core opens its question (world frozen)", armT.hasQuestion() && armT.state() === "QUESTION");
      ok("question has a per-question time limit (>=12s)", armT.questionLimit() >= 12);
      ok("timer waits for the option reveal — not started at question creation (R5)", armT.timerStarted() === false);
      armT.answer(true);
      ok("collecting a core returns to SECTOR", armT.state() === "SECTOR");
      ok("post-collect invulnerability granted (invuln >= 1.4s)", armT.invuln() >= 1.4);
    }
    if (combat.length >= 2) {            // second core: let its timer run out -> graded incorrect (core lost)
      const ci2 = combat[1];
      armT.prepCore(ci2); armT.arrive(ci2);
      ok("second core opens its question", armT.hasQuestion() && armT.state() === "QUESTION");
      ok("running out of time resolves the question", armT.forceTimeout() === true);
      armT.answer(true);                 // proceed past the now-answered (timed-out) question
      const lost = armT.cores().some(c => c.idx === ci2 && c.state === "lost");
      ok("a timed-out core is graded incorrect (lost)", lost);
    }
    { const e = await runFrames(); ok("ARM SECTOR loop runs without error", e.length === 0); }
    // ---- multi-sector campaign (escalating difficulty, no-reuse across the whole run) ----
    ok("campaign spans multiple sectors", armT.sectorsTotal() >= 2);
    ok("station total = sectors x cores-per-sector", armT.total() === armT.sectorsTotal() * 5);
    ok("station is 12 sectors / 60 cores (3 tiers x 20)", armT.sectorsTotal() === 12 && armT.total() === 60);
    ok("tiers: 1-4 Easy, 5-8 Medium, 9-12 Hard", armT.tierOf(1) === 0 && armT.tierOf(4) === 0 && armT.tierOf(5) === 1 && armT.tierOf(8) === 1 && armT.tierOf(9) === 2 && armT.tierOf(12) === 2);
    ok("boss sectors are 3/6/9/12 (v0.96 A6: two regulars then a dreadnought)", armT.isBossSector(3) && armT.isBossSector(6) && armT.isBossSector(9) && armT.isBossSector(12) && !armT.isBossSector(1) && !armT.isBossSector(2) && !armT.isBossSector(4) && !armT.isBossSector(5));
    ok("starts in sector 1", armT.sectorNum() === 1);
    const s1ceil0 = armT.bandCeil(0);
    armT.nextSector();                   // advance to sector 2 (re-briefs)
    ok("advancing increments the sector", armT.sectorNum() === 2);
    ok("each new sector re-briefs the commander", armT.state() === "BRIEF" && armT.briefInfo().core === -1);
    const s2qids = armT.coreQids();
    // (v0.131.0, ARM#1) recovered cores are INTENTIONAL repeats — the resurfacing pool re-serves
    // sector-1 losses. No-reuse now applies to the non-recovered draws; any repeat must be flagged.
    {
      const rIdx = armT.recoveredIdx ? armT.recoveredIdx() : [];
      const freshOK = s2qids.every((id, i) => rIdx.includes(i) ? s1qids.includes(id) : !s1qids.includes(id));
      ok("sector 2: non-recovered cores are fresh; recovered cores repeat EXACTLY the sector-1 losses (ARM#1)",
        s2qids.length === 5 && freshOK);
    }
    ok("difficulty ceiling never drops sector-to-sector", armT.bandCeil(0) >= s1ceil0);
    ok("difficulty ceiling rises across tiers (Hard > Medium > Easy)", armT.bandCeilAt(9, 0) > armT.bandCeilAt(5, 0) && armT.bandCeilAt(5, 0) > armT.bandCeilAt(1, 0));
    // (v0.91.0) opener variety: sector 1 stays the gentle [1,1] intro; sector 2+ openers
    // reach the d<=2 pool (the 18-card d1 pool was replaying the same few every session)
    ok("sector-1 opener stays ceiling 1, sector-2+ openers reach ceiling 2",
      armT.bandCeilAt(1, 0) === 1 && armT.bandCeilAt(2, 0) === 2 && armT.bandCeilAt(3, 0) === 2);

    // ---- Puzzle completion timer + breach penalty + the two new puzzle types ----
    const puzzles = armT.cores().filter(c => c.kind === "puzzle");
    ok("a sector has puzzle cores", puzzles.length >= 3);
    if (puzzles.length >= 3) {
      // S3: puzzle timers are now a per-mechanic budget (PUZZLE_SECS, floor 10s), not the old x1.5 question formula.
      armT.openPuzzleAt(puzzles[0].idx, "rewire");   // deterministic non-Simon type (Simon's clock starts after playback)
      const pi = armT.puzzleInfo();
      ok("opening a puzzle starts a completion timer", armT.state() === "PUZZLE" && pi.active && pi.barShown);
      ok("puzzle time-limit is a sane per-mechanic budget (>=10s floor, much quicker)", typeof pi.limit === "number" && pi.limit >= 10 && pi.limit <= 30);
      const sBefore = pi.shields;
      armT.step(pi.limit + 0.5);          // run the stability clock out
      const pe = armT.puzzleInfo();
      ok("timing out breaches the core (shield hit, " + 14 + ")", pe.shields === sBefore - 14);
      ok("a breach re-arms a fresh attempt (no softlock)", pe.active && pe.remain === pi.limit);
      // S3 roster: Grid CUT; Battery (polarity) + vCPU (even allocation) ADDED.
      armT.openPuzzleAt(puzzles[1].idx, "battery");
      ok("battery polarity puzzle renders (replaces cut Grid)", armT.puzzleInfo().type === "battery" && !!w.document.querySelector(".arm-batt-cell"));
      armT.openPuzzleAt(puzzles[2].idx, "vcpu");
      ok("vCPU divide puzzle renders (new)", armT.puzzleInfo().type === "vcpu" && !!w.document.querySelector(".arm-vcpu-read"));
      armT.solvePuzzle();
      ok("solving a puzzle advances to its question", armT.state() === "QUESTION");
    }

    // ---- Increment 2: boss encounter (weakpoint -> shed core -> catch -> answer, x5 -> death + auto-warp) ----
    {
      const bs = armT.setupBossSector();
      ok("boss sector arms the boss (5 cores queued, none placed)", armT.bossEnabled() && bs.queue === 5 && bs.cores === 0 && armT.bossInfo().active === true);
      ok("boss exposes 5 weakpoints, the first active, none destroyed", armT.bossInfo().wpCount === 5 && armT.bossInfo().wpActive === 0 && armT.bossInfo().wpDead === 0);
      const wp = armT.bossInfo().wpMax;
      armT.hitWeakpoint(wp);                                  // break the weakpoint
      ok("breaking the weakpoint sheds one core + seals the weakpoint", armT.bossInfo().cores === 1 && armT.bossInfo().queue === 4 && armT.bossInfo().active === false);
      armT.arrive(0); armT.answer(false);                    // a WRONG answer still counts (core lost) — design: caught OR lost both progress
      ok("a shed core answered wrong still re-exposes the weakpoint (lost counts)", armT.bossInfo().active === true && armT.bossInfo().wpHp === wp && armT.bossInfo().queue === 4);
      for (let r = 0; r < 4; r++) { armT.hitWeakpoint(armT.bossInfo().wpMax); armT.arrive(armT.bossInfo().cores - 1); armT.answer(true); }
      ok("all five cores shed + resolved -> boss destabilizing, all 5 weakpoints destroyed, active advanced to the last", armT.bossInfo().queue === 0 && armT.bossInfo().dying === true && armT.bossInfo().wpDead === 5 && armT.bossInfo().wpActive === 4);
      // S4 staged death: NO auto-warp — the alarm phases run, then hyperdrive is offered for the player to engage
      let availAt = -1;
      for (let f = 0; f < 200 && availAt < 0; f++) { armT.step(1 / 30); if (armT.returnReady()) availAt = f; }
      ok("boss death runs alarm phases then offers hyperdrive (no auto-warp, ship still in SECTOR)", availAt >= 0 && armT.state() === "SECTOR");
      armT.engageReturn();                                   // player presses Hyperdrive within the window
      ok("engaging hyperdrive during the death sequence warps out", armT.state() === "WARP");
    }
  }
  const armRoot2 = shell.currentGameRoot;
  shell.exitGame();
  ok("ARM(2) unmounted -> menu", shell.screen === "menu");

  console.log("\nD3. ARM high-contrast palette (#12 P2 — wiring; look is browser-only)");
  {
    const prev = SN.core.profile.settings.colorblind;
    SN.core.profile.settings.colorblind = true;
    delete SN.core.profile.saves; shell.enterGame("ARM"); await wait(10);
    const pHc = shell.currentGameRoot.__armTest.palette();
    ok("ARM reads high-contrast from settings.colorblind", pHc.highContrast === true);
    ok("ARM canvas border uses the HC value", pHc.border === "#9aa0e0");
    ok("ARM canvas accent (aqua) brightens under HC", pHc.aqua === "#3DE7F2");
    { const e = await runFrames(); ok("ARM HC draw loop runs without error", e.length === 0); }
    shell.exitGame();
    SN.core.profile.settings.colorblind = false;
    delete SN.core.profile.saves; shell.enterGame("ARM"); await wait(10);
    const pBase = shell.currentGameRoot.__armTest.palette();
    ok("ARM uses the base palette when HC off", pBase.highContrast === false && pBase.border === "#34344a");
    shell.exitGame();
    SN.core.profile.settings.colorblind = prev;
  }

  console.log("\nE. CC (Three absent -> graceful fallback)");
  calls.length = 0;
  SN.core.persistence.update((p) => { p.bests = p.bests || {}; p.bests.CC = 62345; });   // (v0.144.0, CC#3) PB probe — through the seam so load() sees it
  if (SN.core.persistence.flush) SN.core.persistence.flush();   // beat the debounce: the mount's load() reads storage
  delete SN.core.profile.saves; shell.enterGame("CC");
  ok("screen === game:CC", shell.screen === "game:CC");
  ok("CC track played on enter", calls.indexOf("track:cc") !== -1);
  await wait(10);
  ok("CC mounted (root has content)", shell.currentGameRoot && shell.currentGameRoot.childNodes.length > 0);
  await wait(30);   // let the async persistence.load() PB capture settle
  {
    const pbEl = w.document.querySelector(".cc-pb");
    ok("CC#3: the HUD shows the persisted personal best while you run", !!pbEl && pbEl.textContent === "PB 62.3 km");
    ok("CC#3: the milestone banner element is armed (hidden until 25 km)", !!w.document.querySelector(".cc-mile-banner") && !w.document.querySelector(".cc-mile-banner.on"));
  }
  ok("CC shows 3D-unavailable fallback", /three\.js|3d/i.test(shell.currentGameRoot.textContent || ""));
  // #11: the descent cinematic plays first; skipping it fires the how-to card, which hands off to the run.
  const ccIntro = w.document.querySelector(".cc-intro");
  ok("CC intro cutscene shows on mount", !!ccIntro && ccIntro.style.display === "flex");
  ok("CC intro has a Skip control", !!w.document.querySelector(".cc-intro-skip"));
  { const sk = w.document.querySelector(".cc-intro-skip"); if (sk) sk.click(); }
  ok("CC intro dismissed after Skip", !!ccIntro && ccIntro.style.display === "none");
  const ccHowto = w.document.querySelector(".cc-howto");
  ok("CC how-to card shows after descent", !!ccHowto && !!ccHowto.parentNode);
  // (v2.49.0) 5 -> 6: the BOULDERS rule joined, because the rockfall was spawning unexplained.
  ok("CC how-to lists 6 rules", w.document.querySelectorAll(".cc-howto-li").length === 6);
  /* (v2.49.0) was "the scanner drone is NAMED in the rules". The drone was retired and
   * the bomb took its slot, so the check named an obstacle the game no longer spawns —
   * while the ROCKFALL, which kills a lane outright, went unmentioned in the rules for
   * real. Both are fixed by asking the question that actually matters: is every obstacle
   * the game can throw at you explained before you meet it? */
  {
    const rulesTxt = (w.document.querySelector(".cc-howto-list")?.textContent || "").toUpperCase();
    const named = ["NARROW", "LOW ROCK", "ARCH", "MINES", "BOULDER"];
    ok("C2: every obstacle type the game spawns is named in the rules",
      named.every((n) => rulesTxt.indexOf(n) >= 0), named.filter((n) => rulesTxt.indexOf(n) < 0).join(", "));
    ok("C2: no rule names an obstacle the game no longer spawns", rulesTxt.indexOf("SCANNER DRONE") < 0);
  }
  ok("C11: the how-to card carries the Garage loadout strip", !!w.document.querySelector(".cc-howto-loadout"));
  { const c = w.document.querySelector(".cc-howto-cont"); if (c) c.click(); }
  ok("CC how-to dismissed after Continue", !w.document.querySelector(".cc-howto"));
  { const e = await runFrames(); ok("CC loop runs without error (fallback path)", e.length === 0); }
  const ccRoot = shell.currentGameRoot;
  // Regression guard for the dead-hook class of bug: exit must travel the real path
  // (Menu button -> ctx.exit -> shell.exitGame). CC previously called a never-defined
  // ctx.onExit, so the button was a silent no-op; because the bad call sat behind an `if`,
  // nothing threw and the structural harness stayed green. Click the actual button here.
  // (v0.73.0) the Garage button now sits beside Menu (both ghost) — find Menu by TEXT, the pin's actual intent
  const ccMenuBtn = Array.from(ccRoot.querySelectorAll(".cc-ovr-btns .cc-btn")).find(b => /menu/i.test(b.textContent || ""));
  ok("CC exposes an in-game Menu (exit) button", !!ccMenuBtn);
  if (ccMenuBtn) ccMenuBtn.click();
  ok("CC Menu button returns to the shell menu (ctx.exit wired)", shell.screen === "menu");
  ok("CC game root detached", !ccRoot.parentNode);

  console.log("\nE2. CC gate question overlay (P1 — freeze regression)");
  delete SN.core.profile.saves; shell.enterGame("CC");
  await wait(10);
  { const sk = w.document.querySelector(".cc-intro-skip"); if (sk) sk.click(); }  // #11: skip descent -> how-to
  { const c = w.document.querySelector(".cc-howto-cont"); if (c) c.click(); }     // dismiss how-to -> run (module now reacts to gameplay phases)
  const ccSim = SN.getGame("CC")._sim();
  ok("CC sim accessible", !!ccSim);
  if (ccSim) {
    // 04 task 7: score IS distance, accrued at SCORE_SPEED (dramatized), shown in km; gates every 10 km; coins gone.
    ccSim.reset();
    const cfg7 = ccSim.cfg;
    for (let f = 0; f < 60; f++) ccSim.step(1 / 60);     // ~1s of RUN (first gate is 20s out, so no interruption)
    ok("scored distance accrues at ~500 m/s", Math.abs(ccSim.scoreDistance - cfg7.SCORE_SPEED) < cfg7.SCORE_SPEED * 0.05);
    // (v0.73.0, J9) cells are BACK by Jason's direction — the pin's surviving truth is score PURITY:
    // km score is distance ONLY; collecting a cell feeds the wallet, never the score.
    ok("score() returns scored distance (cells never pollute it)", ccSim.score() === Math.floor(ccSim.scoreDistance));
    {
      const sc7 = ccSim.coinScore;
      const cell = ccSim.coins.acquire(); cell.lane = ccSim.player.lane; cell.x = ccSim.player.x; cell.y = 0.6; cell.z = 0.4; cell.tested = false; cell.collected = false;
      const km7 = ccSim.score();
      ccSim.step(1 / 60);
      ok("J9: a collected cell feeds the wallet, not the km score",
        ccSim.coinScore === sc7 + 1 && Math.abs(ccSim.score() - km7) < 20);
    }
    ok("first gate lands at FIRST_GATE_KM (early learning hook), before the 10 km cadence (v0.126.0, Jason)", ccSim._nextGateScore === cfg7.FIRST_GATE_KM * 1000 && cfg7.FIRST_GATE_KM < cfg7.GATE_KM);
    // 04 task 8: every 5 gates -> boost (invuln + ~100 km fast-forward, then normal cadence resumes)
    ccSim.reset();
    // (v0.139.0, V1.1 CC#1) the boost is EARNED: corrects charge the meter, a miss drains half.
    // These sim answers record into REAL mastery (cc.js answer()) — snapshot + restore the two
    // touched entries so the downstream due-queue pins (L1/L2) see unchanged state.
    const ccMmAll = SN.core.mastery.all();
    const ccChgPrev = {};
    const ccNoteQ = () => { const qid = ccSim.pending.question.id; if (!(qid in ccChgPrev)) ccChgPrev[qid] = ccMmAll[qid] ? JSON.parse(JSON.stringify(ccMmAll[qid])) : null; };
    ccSim.boostCharge = 1;
    ccSim._passGate(ccSim.gates.items[0]);               // gate opens the question
    ccNoteQ();
    ccSim.answer([]);                                    // a miss for BOTH shapes (empty pick grades wrong on single AND multi)
    ok("CC#1: a wrong answer drains half the charge (1 -> 0), no boost", ccSim.boostCharge === 0 && ccSim._boostPending === false);
    ccSim.resumeAfterQuestion();
    ccSim.boostCharge = cfg7.GATES_PER_BOOST - 1;        // one correct short of full
    ccSim._passGate(ccSim.gates.items[0]);
    ccNoteQ();
    {   // the charging correct — shape-aware (the e1 bank swap moved a multi under this seed)
      const pqC = ccSim.pending.question;
      ccSim.answer(Array.isArray(pqC.correctIndices) ? pqC.correctIndices.slice() : pqC.correctIndex);
    }
    ok("CC#1: a correct gate answer completes the charge and arms the boost", ccSim._boostPending === true && ccSim.boostCharge === 0);
    for (const ck in ccChgPrev) { if (ccChgPrev[ck]) ccMmAll[ck] = ccChgPrev[ck]; else delete ccMmAll[ck]; }
    ccSim.phase = "EXPLAIN"; ccSim.pending = null;       // jump to the resume point
    ccSim.resumeAfterQuestion();
    ok("boost activates on resume (invuln + fast-forward)", ccSim.boostActive === true && ccSim._boostTargetScore > ccSim.scoreDistance);
    const sd0 = ccSim.scoreDistance;
    for (let f = 0; f < 60 * 8 && ccSim.boostActive; f++) ccSim.step(1 / 60);   // (v0.103.0, C7) BOOST_TIME doubled to 6s
    ok("boost covers ~100 km then ends", !ccSim.boostActive && (ccSim.scoreDistance - sd0) >= cfg7.BOOST_KM * 1000 * 0.95);
    ccSim.reset();
    let collected = false;               // drive the real sim until a gate forces a question
    for (let i = 0; i < 5000 && !collected; i++) {
      ccSim.step(1 / 60);
      if (ccSim.phase === "QUESTION") collected = true;
      else if (ccSim.phase === "OVER") ccSim.reset();
    }
    if (!collected) {                    // deterministic fallback via the real gate method (spans the track, always triggers)
      ccSim.reset();
      ccSim._passGate(ccSim.gates.items[0]);
      collected = ccSim.phase === "QUESTION";
    }
    ok("gate forces a question -> phase QUESTION", collected);
    await runFrames(3);                  // let the module react to the QUESTION phase
    const ov = w.document.querySelector(".cc-overlay");
    ok("question overlay now shows (freeze fixed)", !!ov && ov.style.display === "flex");
    ok("overlay presents answer options", w.document.querySelectorAll(".cc-opt").length > 0);

    // P1 resume-before-ready fix: answering must NOT resume the world; it stays frozen through
    // the explanation until Continue, which grants a post-question invulnerability window.
    if (collected && ccSim.pending) {
      const pq = ccSim.pending.question;
      const ans = Array.isArray(pq.correctIndices) ? pq.correctIndices.slice() : pq.correctIndex;
      const d0 = ccSim.distance;
      ccSim.answer(ans);
      ok("answering moves to EXPLAIN (not RUN)", ccSim.phase === "EXPLAIN");
      for (let k = 0; k < 12; k++) ccSim.step(1 / 60);
      ok("world stays frozen during the explanation (distance unchanged)", ccSim.distance === d0);
      ccSim.resumeAfterQuestion();
      ok("Continue -> phase RUN", ccSim.phase === "RUN");
      ok("post-question invulnerability granted (iframe >= 1.4s)", ccSim.iframe >= 1.4);
      const d1 = ccSim.distance;
      for (let k = 0; k < 6; k++) ccSim.step(1 / 60);
      ok("world advances again after Continue (distance increases)", ccSim.distance > d1);
    }

    // D6 per-question timer: a countdown is set when a gate forces a question; running out auto-resolves as incorrect.
    { const o = w.document.querySelector(".cc-overlay"); if (o) o.style.display = "none"; }
    ccSim.reset();
    ccSim._passGate(ccSim.gates.items[0]);
    ok("gate question sets a sane time window — 1.5x the base, ~18–68s (v0.126.0, Jason)", !!ccSim.pending && ccSim.pending.limitS >= 12 && ccSim.pending.limitS <= 68);
    await runFrames(3);
    ok("countdown is displayed on the question overlay", /\d+\s*s/.test((w.document.querySelector(".cc-qtimer") || {}).textContent || ""));
    const lim = ccSim.pending.limitS, sh0 = ccSim.shields;
    ccSim.tickQuestion(lim + 1);          // force the clock past the deadline
    ok("running out of time auto-resolves to EXPLAIN", ccSim.phase === "EXPLAIN");
    ok("timeout is graded incorrect", ccSim.lastResult && ccSim.lastResult.timedOut === true && ccSim.lastResult.correct === false);
    ok("timeout costs two shields (04 task 4: wrong/timeout = -2)", ccSim.shields === sh0 - 2);
    await runFrames(3);
    ok("timeout shows the explanation feedback", /time/i.test((w.document.querySelector(".cc-fb-head") || {}).textContent || ""));
  }
  const ccRoot2 = shell.currentGameRoot;
  shell.exitGame();
  ok("CC(2) unmounted -> menu", shell.screen === "menu");

  console.log("\nE3. CC obstacle redesign (rock wall narrowing / full-width arch / solvable rows)");
  delete SN.core.profile.saves; shell.enterGame("CC");
  await wait(10);
  { const sk = w.document.querySelector(".cc-intro-skip"); if (sk) sk.click(); }
  { const c = w.document.querySelector(".cc-howto-cont"); if (c) c.click(); }
  const ccSim3 = SN.getGame("CC")._sim();
  ok("CC sim accessible (E3)", !!ccSim3);
  if (ccSim3) {
    const EN = (w.CC && w.CC._enums) || { OB_NARROW: 0, OB_LOWROCK: 1, OB_ARCH: 2, SIDE_LEFT: 0, SIDE_RIGHT: 1 };
    ccSim3.reset();
    let nNarrow = 0, nLow = 0, nArch = 0, nRock = 0, nBomb = 0, rows = 0, unsolvable = 0;
    let narrowSealOK = true, lowJumpOK = true, archWideOK = true, archDuckOK = true, rockSealOK = true, bombSealOK = true;
    const unknownKinds = new Set();
    for (let i = 0; i < 1500; i++) {
      const z = 100 + i * 40;
      ccSim3._spawnRow(z);                                                   // drive the spawner directly (deterministic per rng)
      const row = ccSim3.obstacles.items.filter(o => o.active && Math.abs(o.z - z) < 0.001);
      rows++;
      for (const o of row) {
        if (o.type === EN.OB_ARCH) {
          nArch++;
          for (const ln of [0, 1, 2]) {                                      // full-width: hits every standing lane, clears every ducking lane
            if (!ccSim3._wouldHit(o, ln, "stand")) archWideOK = false;
            if (ccSim3._wouldHit(o, ln, "duck")) archDuckOK = false;
          }
        } else if (o.type === EN.OB_NARROW) {
          nNarrow++;
          if (!ccSim3._wouldHit(o, o.lane, "stand")) narrowSealOK = false;   // a wall blocks its own lane
          for (const ln of [0, 1, 2]) if (ln !== o.lane && ccSim3._wouldHit(o, ln, "stand")) narrowSealOK = false; // and ONLY its own lane (no x-bleed)
        } else if (o.type === 4 /* OB_ROCKFALL, v0.160.0 CC#5 */) {
          nRock++;
          if (!ccSim3._wouldHit(o, o.lane, "jump") || !ccSim3._wouldHit(o, o.lane, "duck")) rockSealOK = false;   // worst-case landed: its lane is dead at ANY action
          for (const ln of [0, 1, 2]) if (ln !== o.lane && ccSim3._wouldHit(o, ln, "stand")) rockSealOK = false;  // and ONLY its lane
        } else if (o.type === 3 /* OB_BOMB — the mine, which took the retired drone's slot */) {
          /* (v2.49.0) The mine did not exist when this sweep was written, so it fell into
           * the catch-all and was measured against the LOW ROCK's rule: jump-clearable.
           * A mine is not — it seals its lane, which is the whole point of it. The check
           * failed because the game grew an obstacle, not because the game was wrong. */
          nBomb++;
          if (!ccSim3._wouldHit(o, o.lane, "stand")) bombSealOK = false;
          if (!ccSim3._wouldHit(o, o.lane, "jump")) bombSealOK = false;      // no jumping a mine
          for (const ln of [0, 1, 2]) if (ln !== o.lane && ccSim3._wouldHit(o, ln, "stand")) bombSealOK = false;
        } else if (o.type === (EN.OB_LOWROCK === undefined ? 1 : EN.OB_LOWROCK)) {
          nLow++;
          if (!ccSim3._wouldHit(o, o.lane, "stand")) lowJumpOK = false;      // standing in its lane is hit
          if (ccSim3._wouldHit(o, o.lane, "jump")) lowJumpOK = false;        // jumping clears it
        } else {
          // No silent catch-all: a new obstacle type must be given its own rule here.
          unknownKinds.add(o.type);
        }
      }
      // solvability: some (lane, action) clears every obstacle in the row
      let solved = false;
      for (const ln of [0, 1, 2]) {
        for (const act of ["stand", "jump", "duck"]) {
          let hit = false;
          for (const o of row) { if (ccSim3._wouldHit(o, ln, act)) { hit = true; break; } }
          if (!hit) { solved = true; break; }
        }
        if (solved) break;
      }
      if (!solved) unsolvable++;
      for (const o of ccSim3.obstacles.items) if (o.active) ccSim3.obstacles.release(o);   // recycle EVERYTHING (a chain's arch sits at z+CHAIN_GAP — the old same-z filter leaked it until the pool starved)
    }
    ok("all obstacle kinds spawn (narrowing / low rock / arch / rockfall / mine)",
      nNarrow > 0 && nLow > 0 && nArch > 0 && nRock > 0 && nBomb > 0);
    ok("every spawned obstacle kind has a rule in this sweep"
      + (unknownKinds.size ? " — UNCLASSIFIED TYPES: " + [...unknownKinds].join(", ") : ""),
      unknownKinds.size === 0);
    ok("CC: every spawned mine seals exactly its own lane at any action", bombSealOK);
    ok("CC#5: every spawned rockfall seals exactly its own lane (worst-case landed)", rockSealOK);
    ok("each narrowing wall blocks exactly its own lane (no x-bleed)", narrowSealOK);
    ok("low rock blocks a stander in its lane and is jump-clearable", lowJumpOK);
    ok("arch is full-width: hits a stander in every lane", archWideOK);
    ok("arch is cleared by ducking in every lane", archDuckOK);
    ok("every spawned row is solvable (0 unclearable across " + rows + " rows)", unsolvable === 0);
    // 04 task 5: wall-extend seals an outer + the center, leaving ONLY the far opposite lane open
    let weOK = true;
    for (const side of [EN.SIDE_LEFT, EN.SIDE_RIGHT]) {
      ccSim3._spawnWallExtend(side, 100);
      const wrow = ccSim3.obstacles.items.filter(o => o.active);
      const far = (side === EN.SIDE_LEFT) ? 2 : 0;
      for (const ln of [0, 1, 2]) {
        let hit = false; for (const o of wrow) if (ccSim3._wouldHit(o, ln, "stand")) { hit = true; break; }
        if (ln === far ? hit : !hit) weOK = false;          // far lane open, the other two sealed
      }
      for (const o of wrow) ccSim3.obstacles.release(o);
    }
    ok("wall-extend leaves ONLY the far lane open (04 task 5)", weOK);
    // render fix (Jason): outer wall draws a 2-lane bulge (span 2), the sealed centre is collision-only (span 0)
    ccSim3.reset();
    ccSim3._spawnWallExtend(EN.SIDE_LEFT, 100);
    const weSpans = ccSim3.obstacles.items.filter(o => o.active).map(o => o.span).sort();
    ok("wall-extend renders a 2-lane bulge + a collision-only centre (graphic fix)", weSpans.length === 2 && weSpans[0] === 0 && weSpans[1] === 2);
    for (const o of ccSim3.obstacles.items.filter(o => o.active)) ccSim3.obstacles.release(o);
    // (clear-lane fix) a wall never hits a player whose centre is in an adjacent lane, even mid-tween across the boundary
    ccSim3.reset();
    let clearLaneOK = true, rockForgiveOK = true;
    ccSim3._placeObstacle(EN.OB_NARROW, 1, EN.SIDE_LEFT, 100);          // wall sealing the centre lane (x=0)
    const wallO = ccSim3.obstacles.items.find(o => o.active);
    for (let x = ccSim3.cfg.LANE_W * 0.5 + 0.01; x <= ccSim3.cfg.LANE_W; x += 0.1) {
      if (ccSim3._hitsObstacle(wallO, { x: x, y: 0, topY: 1.4 })) clearLaneOK = false;   // past the boundary => clear
    }
    if (!ccSim3._hitsObstacle(wallO, { x: 0, y: 0, topY: 1.4 })) clearLaneOK = false;     // still solid dead-centre
    ccSim3.obstacles.release(wallO);
    ok("wall never hits a player centred in an adjacent lane (clear-lane fix)", clearLaneOK);
    // (v0.47.0) the jump obstacle is a FULL-WIDTH wall: standing hits at every lane x; jumping clears it
    ccSim3._placeObstacle(EN.OB_LOWROCK, 1, 0, 100);
    const rockO = ccSim3.obstacles.items.find(o => o.active);
    for (const lx of [-ccSim3.cfg.LANE_W, 0, ccSim3.cfg.LANE_W]) {
      if (!ccSim3._hitsObstacle(rockO, { x: lx, y: 0, topY: 1.9 })) rockForgiveOK = false;                 // standing hits in EVERY lane
      if (ccSim3._hitsObstacle(rockO, { x: lx, y: ccSim3.cfg.JUMP_HEIGHT, topY: ccSim3.cfg.JUMP_HEIGHT + 1.9 })) rockForgiveOK = false;   // a jump clears in EVERY lane
    }
    ccSim3.obstacles.release(rockO);
    ok("jump wall is full-width (all lanes hit standing) and jumpable (all lanes clear airborne)", rockForgiveOK);
    // (Jason) hold-to-extend jump: holding keeps the player airborne (and pinned at the apex) ~JUMP_HANG_MAX longer than a tap
    function ccAir(hold) {
      ccSim3.reset();
      ccSim3.shields = 999;                                  // survive any obstacle so the run can't end mid-measurement
      ccSim3.jump();
      if (hold) ccSim3.holdJump();
      let frames = 0, apexFrames = 0;
      const APEX = ccSim3.cfg.JUMP_HEIGHT - 1e-4;
      for (let i = 0; i < 600 && ccSim3.player.jumping; i++) {
        ccSim3.step(1 / 60); frames++;
        if (ccSim3.player.y >= APEX) apexFrames++;
      }
      return { frames, apexFrames };
    }
    const ccTap = ccAir(false), ccHeld = ccAir(true);
    const hangFrames = Math.round(ccSim3.cfg.JUMP_HANG_MAX * 60);   // ~30 at 60fps
    ok("hold-jump stays airborne ~JUMP_HANG_MAX longer than a tap", ccHeld.frames > ccTap.frames + hangFrames - 5 && ccHeld.frames < ccTap.frames + hangFrames + 5);
    ok("hold-jump floats at the apex; a tap passes straight through", ccHeld.apexFrames >= hangFrames - 6 && ccTap.apexFrames <= 3);
  }
  shell.exitGame();
  ok("CC(3) unmounted -> menu", shell.screen === "menu");

  console.log("\nF. KBB (real module — #24 flow: how-to -> cinematic -> shop -> start)");
  calls.length = 0;
  delete SN.core.profile.saves; shell.enterGame("KBB");
  ok("screen === game:KBB", shell.screen === "game:KBB");
  ok("KBB track played on enter", calls.indexOf("track:kbb") !== -1);
  await wait(10);
  ok("KBB mounted its UI (.kbb-root)", !!w.document.querySelector(".kbb-root"));
  ok("KBB rendered a scene canvas (.kbb-canvas)", !!w.document.querySelector(".kbb-canvas"));
  // (Session 2 rebuild: the combat zone is a code-generated looping Kuiper-Belt + sprite-billboard ships in the RED grid cell, not a full-bleed CSS nebula on .kbb-root. Art usage is covered by the KBB module harness.)
  // (v0.68.0, J6) NEW opening: cinematic FIRST -> live easy battle -> how-to tour over
  // POPULATED zones (the old how-to-first order spotlighted empty panels = "blank boxes").
  ok("J6: KBB opens on the cinematic (Skip present), NOT the how-to", !!w.document.querySelector(".kbb-skip") && !w.document.querySelector(".kbb-howto"));
  { const e = await runFrames(3); ok("KBB intro loop runs without error", e.length === 0); }
  const kbbSkip = Array.from(w.document.querySelectorAll(".kbb-skip")).find(b => /skip/i.test(b.textContent || ""));
  if (kbbSkip) kbbSkip.dispatchEvent(new w.Event("click", { bubbles: true }));
  await wait(10);
  ok("intro cleared after skip (Skip button gone)", !Array.from(w.document.querySelectorAll(".kbb-skip")).some(b => /skip/i.test(b.textContent || "")));
  ok("J6: no pre-run shop — the first battle is LIVE under the tour",
    w.document.querySelectorAll(".kbb-opt").length > 0 && !Array.from(w.document.querySelectorAll(".kbb-btn")).some(b => /start run/i.test(b.textContent || "")));
  ok("J6: the how-to tour rides on top of the populated battle", !!w.document.querySelector(".kbb-howto"));
  { const nextBtn = w.document.querySelector(".kbb-howto .kbb-ht-next"); ok("How to play opens on the intro step (Next button)", !!nextBtn && /next/i.test(nextBtn.textContent || "")); if (nextBtn) nextBtn.dispatchEvent(new w.Event("click", { bubbles: true })); }
  ok("Next advances the walkthrough to a zone callout (.kbb-ht-call)", !!w.document.querySelector(".kbb-howto .kbb-ht-call"));
  { const spot = w.document.querySelector(".kbb-ht-spot");
    ok("the walkthrough spotlights a real screen zone (.kbb-ht-spot)", !!spot);
    ok("J6 blank-box fix: the spotlighted zone has CONTENT", !!spot && spot.textContent.trim().length > 0); }
  { const skip = w.document.querySelector(".kbb-howto .kbb-ht-skip"); ok("the walkthrough offers Skip", !!skip); if (skip) skip.dispatchEvent(new w.Event("click", { bubbles: true })); }
  await wait(10);
  ok("How to play cleared (.kbb-howto gone)", !w.document.querySelector(".kbb-howto"));
  ok("Skip clears the zone spotlight too", !w.document.querySelector(".kbb-ht-spot"));
  ok("the live first battle offers answer options (.kbb-opt)", w.document.querySelectorAll(".kbb-opt").length > 0);
  ok("battle question sits in the question cell (.kbb-main, YELLOW zone)", !!w.document.querySelector(".kbb-main") && w.document.querySelectorAll(".kbb-opt").length > 0);
  ok("player health rings present (green HP + blue shield)", !!w.document.querySelector(".kbb-ring-pl .arc.hp") && !!w.document.querySelector(".kbb-ring-pl .arc.shield"));
  ok("enemy health ring present", !!w.document.querySelector(".kbb-ring-en .arc.ehp"));
  ok("artifact cards fan in the hand; coins stay in the left column (v0.127.0, Jason)", w.document.querySelectorAll(".kbb-hand .kbb-acard").length === 5 && !!w.document.querySelector(".kbb-coins .v"));
  { const top = w.document.querySelector(".kbb-top"); ok("first battle is round 1-1 (#24: Start didn't advance the round)", !!top && /depth[\s\u00a0]+1-1/i.test(top.textContent || "")); }
  { const e = await runFrames(); if (e.length) console.log("    first KBB frame error:", e[0] && e[0].message); ok("KBB draw loop runs without error", e.length === 0); }
  const kbbRoot = shell.currentGameRoot;
  const kbbContainer = w.document.querySelector(".kbb-root");
  shell.exitGame();
  ok("KBB unmounted -> menu", shell.screen === "menu");
  ok("KBB game root detached", !kbbRoot.parentNode);
  ok("KBB container removed (zero residue)", !w.document.querySelector(".kbb-root") && (!kbbContainer || !kbbContainer.parentNode));

  console.log("\nG. Answering a KBB question (engine smoke)");
  calls.length = 0;
  delete SN.core.profile.saves; shell.enterGame("KBB");
  await wait(10);
  // (v0.68.0, J6) advance through the NEW opening: cinematic -> live battle + tour -> skip tour
  { const sk = Array.from(w.document.querySelectorAll(".kbb-skip")).find(b => /skip/i.test(b.textContent || "")); if (sk) sk.dispatchEvent(new w.Event("click", { bubbles: true })); }
  await wait(10);
  { const sk0 = w.document.querySelector(".kbb-howto .kbb-ht-skip"); if (sk0) sk0.dispatchEvent(new w.Event("click", { bubbles: true })); }
  await wait(10);
  const opts = w.document.querySelectorAll(".kbb-opt");
  ok("KBB has clickable options", opts.length > 0);
  // (v0.46.0 K5) pre-answer agency: three action buttons, Attack preselected
  ok("battle offers the three-action row (Attack/Brace/Repair)", w.document.querySelectorAll(".kbb-action").length === 3);
  ok("Attack is the default selected action", !!w.document.querySelector('.kbb-action[data-act="attack"].on'));
  ok("action hint renders under the action row (v0.48.0)", !!w.document.querySelector(".kbb-act-hint"));
  // (v0.50.0) boss-music pin: flag the live enemy as a boss (+ inflate hp so this answer can't kill it);
  // the next renderAll must swap the bed to the fixed 'boss' track with intensity.
  {
    const stB = w.KBB._test.state();
    if (stB && stB.run && stB.run.battle && stB.run.battle.enemy) {
      stB.run.battle.enemy.boss = true;
      stB.run.battle.enemy.hp = stB.run.battle.enemy.maxHp = 500;
    }
    calls.length = 0;
  }
  let threw = false;
  try {
    if (opts.length) {
      opts[0].dispatchEvent(new w.Event("click", { bubbles: true }));
      // "choose two" draws don't submit on a single click — finish via the Submit button
      if (!w.document.querySelector(".kbb-fb-exp")) {
        const sub = w.document.querySelector(".kbb-submit");
        if (sub && !sub.disabled) sub.dispatchEvent(new w.Event("click", { bubbles: true }));
      }
    }
  } catch (e) { threw = true; }
  await runFrames(4);
  ok("answering an option does not throw", !threw);
  { const st = w.KBB && w.KBB._test && w.KBB._test.state && w.KBB._test.state();
    ok("answering queues battle animations (graphics overhaul FX)", !!(st && Array.isArray(st.fx) && st.fx.length > 0)); }
  const answered = w.document.querySelector(".kbb-opt.correct, .kbb-opt.wrong") ||
                   w.document.querySelector(".kbb-fb") ||
                   w.document.querySelector(".kbb-opt:disabled");
  ok("answer registered (feedback/result shown)", !!answered);
  ok("KBB shows the explanation after answering (P1c)", !!w.document.querySelector(".kbb-fb-exp"));
  const kbbCont = w.document.querySelector(".kbb-cont");
  ok("KBB shows a Continue gate, not an auto-advance (P1c)", !!kbbCont);
  let contThrew = false;
  try { if (kbbCont) kbbCont.dispatchEvent(new w.Event("click", { bubbles: true })); } catch (e) { contThrew = true; }
  await runFrames(4);
  ok("clicking Continue advances without error (P1c)", !contThrew);
  // (v0.50.0) the fresh-question renderAll after Continue must have swapped the bed to 'boss'
  ok("boss battle swaps the music to 'boss' (v0.50.0)", calls.some(c => c === "track:boss"));
  { const stB2 = w.KBB._test.state(); if (stB2 && stB2.run && stB2.run.battle && stB2.run.battle.enemy) stB2.run.battle.enemy.boss = false; }
  // (v0.48.0) the enemy panel STRIKES (kbb-en-strike) when its counterattack lands — probe across
  // up to 6 turns since an individual turn's intent can be 0 ("Charging") and screens may interleave.
  {
    let struck = false;
    const isStruck = () => { const ep = w.document.querySelector(".kbb-enemy"); return !!(ep && ep.classList.contains("kbb-en-strike")); };
    struck = isStruck();
    for (let round = 0; round < 6 && !struck; round++) {
      let op = w.document.querySelector(".kbb-opt:not(:disabled)");
      for (let adv = 0; adv < 3 && !op; adv++) {                      // advance through reward/continue screens
        const c2 = w.document.querySelector(".kbb-cont:not(.kbb-submit)") || Array.from(w.document.querySelectorAll(".kbb-btn")).find(b => /continue|next|onward/i.test(b.textContent || ""));
        if (!c2) break;
        c2.dispatchEvent(new w.Event("click", { bubbles: true }));
        await runFrames(3);
        op = w.document.querySelector(".kbb-opt:not(:disabled)");
      }
      if (!op) break;
      op.dispatchEvent(new w.Event("click", { bubbles: true }));
      const sub2 = w.document.querySelector(".kbb-submit");
      if (sub2 && !sub2.disabled) sub2.dispatchEvent(new w.Event("click", { bubbles: true }));
      await runFrames(4);
      struck = isStruck();
      if (!struck) { const c3 = w.document.querySelector(".kbb-cont:not(.kbb-submit)"); if (c3) c3.dispatchEvent(new w.Event("click", { bubbles: true })); await runFrames(3); }
    }
    ok("enemy panel telegraphs its strike (kbb-en-strike fires within 6 turns)", struck);
  }
  // (v0.180.0) hermetic: the strike probe can short-circuit with NO further render when the
  // strike class lingers (its removal rides the next fresh-question render, and the path there
  // varies with wall-clock answerMs -> crit damage). The music pin only needs ONE full render
  // after the flag clear -- drive continues/answers explicitly until the swap is observed.
  {
    let rendered = calls.lastIndexOf("track:kbb") > calls.indexOf("track:boss");
    for (let extra = 0; extra < 8 && !rendered; extra++) {
      const c4 = w.document.querySelector(".kbb-cont:not(.kbb-submit)") || Array.from(w.document.querySelectorAll(".kbb-btn")).find(b => /continue|next|onward/i.test(b.textContent || ""));
      if (c4) { c4.dispatchEvent(new w.Event("click", { bubbles: true })); }
      else {
        const op4 = w.document.querySelector(".kbb-opt:not(:disabled)");
        if (!op4) break;
        op4.dispatchEvent(new w.Event("click", { bubbles: true }));
        const sub4 = w.document.querySelector(".kbb-submit");
        if (sub4 && !sub4.disabled) sub4.dispatchEvent(new w.Event("click", { bubbles: true }));
      }
      await runFrames(4);
      rendered = calls.lastIndexOf("track:kbb") > calls.indexOf("track:boss");
    }
  }
  {
    const bi = calls.indexOf("track:boss"), ki = calls.lastIndexOf("track:kbb");
    ok("music returns to 'kbb' after the boss flag clears (v0.50.0)", bi >= 0 && ki > bi);
  }
  ok("FINAL ATTACK urgency wired into the intent statline (v0.48.0)", html.includes("FINAL ATTACK"));
  shell.exitGame();
  ok("KBB exits cleanly after answering", shell.screen === "menu" && !w.document.querySelector(".kbb-root"));

  console.log("\nG1b. KBB agency layer (v0.46.0 K5) + combat re-tune (K4)");
  {
    const K = w.KBB;
    ok("re-tune landed (v0.99 K10/K11: basePower 12, heal 6, intents 2.2/0.30, window 7)",
      K.CONFIG.squad.basePower === 12 && K.CONFIG.squad.healPower === 6
      && K.CONFIG.intentBase === 2.2 && K.CONFIG.intentPerRound === 0.30 && K.CONFIG.maxAttacks === 7);
    let qn = 0;
    const provider = { next() { return { question: { id: "aq" + (qn++), difficulty: 2, domain: "d", options: ["a", "b", "c", "d"], correctIndex: 0, stem: "s", explanation: "e" }, reason: "t" }; } };
    const kctx = { rng: K.makeRng(4242), questions: provider };
    const krun = K.createRun(kctx, { seed: 4242, preRunShop: true });
    K.startDungeon(krun);
    K.drawQuestion(krun);
    const shBefore = krun.squad.shield;
    const r1 = K.submitAnswer(krun, 0, 800, "brace");
    // assert REAL squad state, not just the result object: shield = before + block − whatever
    // the counterattack absorbed (the negative control proved a result-only check has a hole)
    const shExpect = Math.max(0, shBefore + K.CONFIG.squad.block - (r1.enemyAttacked ? r1.incoming : 0));
    ok("brace: a correct answer raises shield by block and deals no damage",
       r1.correct === true && r1.action === "brace" && r1.damage === 0 && r1.enemyHpBefore === krun.battle.enemy.hp
       && krun.squad.shield === shExpect && shExpect > shBefore - (r1.enemyAttacked ? r1.incoming : 0));
    K.drawQuestion(krun);
    const r2 = K.submitAnswer(krun, 1, 800, "brace");
    ok("a wrong answer executes nothing regardless of the chosen action", r2.correct === false && r2.shieldGained === 0 && r2.damage === 0);
    krun.squad.hp = 25;
    K.drawQuestion(krun);
    const r3 = K.submitAnswer(krun, 0, 800, "repair");
    ok("repair: a correct answer heals healPower", r3.correct === true && r3.action === "repair" && r3.healed === K.CONFIG.squad.healPower);
    K.drawQuestion(krun);
    const r4 = K.submitAnswer(krun, 0, 800);
    ok("omitting the action still attacks (backward compatible)", r4.action === "attack" && r4.damage > 0);
  }

  ok("ARM intro dive beat wires the REAL planet image (Jason: keep it)", html.includes("SPR.planet = loadSprite(A.planet)"));

  console.log("\nG2. Pause overlay (shell-driven freeze + music stop/restart, self-heal)");
  calls.length = 0;
  delete SN.core.profile.saves; shell.enterGame("ARM");
  await wait(10);
  ok("running game shows a Pause button, no overlay yet", !!w.document.querySelector(".sx-pausebtn") && !w.document.querySelector(".sx-pause"));
  let pzThrew = false;
  try { shell.togglePause(); } catch (e) { pzThrew = true; console.log("    pause error:", e && e.message); }
  ok("opening pause does not throw (drives module.pause)", !pzThrew);
  ok("pause overlay appears (.sx-pause)", !!w.document.querySelector(".sx-pause"));
  ok("pause overlay offers Resume + Menu", !!w.document.querySelector(".sx-pause-resume") && Array.from(w.document.querySelectorAll(".sx-pause .sx-btn")).some(b => /menu/i.test(b.textContent || "")));
  ok("entering pause STOPS the music (setMusic false)", calls.indexOf("music:false") !== -1);
  ok("shell flags itself paused", shell._paused === true);
  { const n = w.document.querySelectorAll(".sx-pause").length; shell.openPause(); ok("double-open is a no-op (single overlay)", w.document.querySelectorAll(".sx-pause").length === n); }
  // (v0.49.0) music-style toggle lives in the pause menu, persists, and repaints
  {
    const gbtns = Array.from(w.document.querySelectorAll(".sx-genre-btn"));
    ok("pause menu offers the Upbeat/Chill music-style toggle (v0.49.0)", !!w.document.querySelector(".sx-genre-row") && gbtns.length === 2);
    const chillBtn = gbtns.find(b => /chill/i.test(b.textContent || ""));
    calls.length = 0;
    if (chillBtn) chillBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
    const st49 = w.StarNix.core.profile.settings;
    ok("picking Chill persists settings.musicGenre", st49.musicGenre === "chill");
    // (v0.68.0, J3) the swap itself must RESOLVE: the old code fed playTrack the UPPERCASE
    // game id, which audio.js silently ignored — the whole toggle was audibly dead.
    ok("J3 fix: picking Chill queues the lowercase context bed (no dead 'track:ARM' call)",
      calls.indexOf("track:arm") !== -1 && calls.indexOf("track:ARM") === -1);
    ok("Chill button paints active (sx-btn-primary)", chillBtn && /sx-btn-primary/.test(chillBtn.className));
    const upBtn = gbtns.find(b => /upbeat/i.test(b.textContent || ""));
    if (upBtn) upBtn.dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("picking Upbeat restores the setting", st49.musicGenre === "upbeat");
  }
  ok("all four chill/upbeat playlists are inlined (spot ids)", ["arm_ch_5", "kbb_up_3", "menu_ch_4", "cc_ch_2"].every(id => html.includes(id + ":")));
  calls.length = 0;
  let rzThrew = false;
  try { w.document.querySelector(".sx-pause-resume").dispatchEvent(new w.Event("click", { bubbles: true })); } catch (e) { rzThrew = true; console.log("    resume error:", e && e.message); }
  ok("resume does not throw (drives module.resume)", !rzThrew);
  ok("resume clears the overlay", !w.document.querySelector(".sx-pause"));
  ok("resuming RESTARTS the music (audio self-heal, setMusic true)", calls.indexOf("music:true") !== -1);
  ok("shell no longer flagged paused", shell._paused === false);
  try {
    w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape" }));
    ok("Esc opens the pause overlay", !!w.document.querySelector(".sx-pause"));
    w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape" }));
    ok("Esc again resumes (overlay gone)", !w.document.querySelector(".sx-pause"));
  } catch (e) { console.log("    Esc error:", e && e.message); ok("Esc opens the pause overlay", false); ok("Esc again resumes (overlay gone)", false); }
  shell.togglePause();
  const pmenu = Array.from(w.document.querySelectorAll(".sx-pause .sx-btn")).find(b => /menu/i.test(b.textContent || ""));
  let pmThrew = false;
  try { if (pmenu) pmenu.dispatchEvent(new w.Event("click", { bubbles: true })); } catch (e) { pmThrew = true; }
  ok("Menu from pause does not throw", !pmThrew);
  ok("Menu from pause returns to the shell menu", shell.screen === "menu");
  ok("pause overlay + game root cleared after exit", !w.document.querySelector(".sx-pause") && !w.document.querySelector(".sx-game-root"));

  console.log("\nH. Re-entry (state isolation)");
  delete SN.core.profile.saves; shell.enterGame("ARM"); await wait(10);
  ok("ARM re-mounts cleanly", shell.screen === "game:ARM" && shell.currentGameRoot.childNodes.length > 0);
  shell.exitGame();
  ok("ARM re-exits cleanly", shell.screen === "menu");

  console.log("\nH2. Progress / Stats screen (P1d)");
  let statsThrew = false;
  try { shell.showStats(); } catch (e) { statsThrew = true; console.log("    showStats error:", e && e.message); }
  ok("Stats screen renders without throwing", !statsThrew && shell.screen === "stats");
  ok("Stats shows stat boxes", w.document.querySelectorAll(".sx-stat").length >= 4);
  ok("Codex: a top ← Menu back button is present, so you can leave without scrolling to the bottom (v0.126.0, Jason)", !!w.document.querySelector(".sx-stats-topback"));
  w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok("Codex: Escape returns to the menu (v0.126.0, Jason)", shell.screen === "menu");
  shell.showStats();   // re-open so the remaining Stats checks run
  ok("Stats shows per-domain rows (all 9 domains)", w.document.querySelectorAll(".sx-dom-row").length >= 9);
  ok("Stats surfaces a 'Due for review' metric", /Due for review/.test(w.document.querySelector(".sx-stat-grid").textContent || ""));
  shell.showMenu();
  ok("returns to menu from Stats", shell.screen === "menu");

  console.log("\nH3. Settings — volume sliders + reset (Part 3 #14)");
  let setThrew = false;
  try { shell.showSettings(); } catch (e) { setThrew = true; console.log("    showSettings error:", e && e.message); }
  ok("Settings screen renders without throwing", !setThrew && shell.screen === "settings");
  const ranges = w.document.querySelectorAll(".sx-range");
  ok("Settings shows 3 volume sliders (master/music/sfx)", ranges.length === 3);
  ok("Settings shows the a11y toggles (reduced motion / extra time / colorblind)", w.document.querySelectorAll(".sx-switch").length === 3);
  ok("Settings shows a reset-progress control", !!w.document.querySelector(".sx-btn-danger"));

  // #12 P1 — high-contrast toggle: live, applied to <html>, persisted, and applied on boot.
  const themeStyle = w.document.getElementById("starnix-theme");
  ok("theme CSS includes a high-contrast override block", !!themeStyle && /\[data-contrast="high"\]/.test(themeStyle.textContent || ""));
  ok("a11y toggle is relabelled 'High contrast'",
    [...w.document.querySelectorAll(".sx-toggle-label")].some(n => n.textContent === "High contrast"));
  const hcSwitch = w.document.querySelectorAll(".sx-switch")[2];
  hcSwitch.click();
  ok("toggling High contrast sets <html data-contrast=high>", w.document.documentElement.getAttribute("data-contrast") === "high");
  ok("High contrast persists to settings.colorblind", SN.core.profile.settings.colorblind === true);
  hcSwitch.click();
  ok("toggling High contrast off removes the attribute", !w.document.documentElement.getAttribute("data-contrast"));
  ok("High contrast off persists (settings.colorblind === false)", SN.core.profile.settings.colorblind === false);
  SN.core.profile.settings.colorblind = true; shell._applyContrast();
  ok("_applyContrast applies high contrast from a saved profile", w.document.documentElement.getAttribute("data-contrast") === "high");
  SN.core.profile.settings.colorblind = false; shell._applyContrast();
  ok("_applyContrast clears high contrast when unset", !w.document.documentElement.getAttribute("data-contrast"));
  // JB3 (v0.80.0) — KBB cinematic fx reach the 3D view via the overlay canvas
  console.log("\nJB3. KBB 3D fx overlay source pins");
  ok("JB3: a .kbb-fx overlay canvas is created above the 3D view",
    html.includes("fx.className = 'kbb-fx'") && html.includes(".kbb-fx{position:absolute"));
  ok("JB3: render3D projects anchors and runs the shared fx pipeline on the overlay",
    html.includes("fxRenderOverlays(s, ts, { cxL: pxL, cxR: pxR, yShip: pyS, W: T.W / k3 }, fg)"));
  ok("JB3: the dying hull persists until the core detonation in BOTH render paths",
    (html.match(/s\.deathAt && ts < s\.deathAt/g) || []).length === 2);

  // JB1 (v0.79.0 / v0.136.0 FE#2) — Dev Jukebox: DEV-ONLY now; players never see it
  console.log("\nJB1. Dev Jukebox (dev mode)");
  ok("FE#2: the Jukebox is HIDDEN from players (no dev mode)", !w.document.querySelector(".sx-jukebox"));
  ok("FE#2: Settings offers the Music style toggle without pausing a game",
    !!w.document.querySelector(".sx-panel .sx-genre-row"));
  // (v0.147.0, V1.1 Backend#3) field error ring: a real window "error" event lands on the
  // profile with build + screen stamped; repeats dedupe into a count; the ring caps at 20.
  {
    SN.core.profile.errors = [];
    const preScr = shell.screen;
    w.dispatchEvent(new w.ErrorEvent("error", { message: "boom: radar i2 is not defined", error: new w.Error("boom: radar i2 is not defined") }));
    await wait(10);
    const ring1 = SN.core.profile.errors;
    ok("Backend#3: a window error lands in the profile ring with build + screen stamped",
      ring1.length === 1 && /radar i2/.test(ring1[0].msg) && ring1[0].build === SN.BUILD && ring1[0].scr === preScr && ring1[0].n === 1);
    w.dispatchEvent(new w.ErrorEvent("error", { message: "boom: radar i2 is not defined" }));
    w.dispatchEvent(new w.ErrorEvent("error", { message: "boom: radar i2 is not defined" }));
    ok("Backend#3: a 60x/s repeat DEDUPES into a count instead of burning ring slots",
      ring1.length === 1 && ring1[0].n === 3);
    for (let be = 0; be < 25; be++) w.dispatchEvent(new w.ErrorEvent("error", { message: "distinct error #" + be }));
    ok("Backend#3: the ring caps at " + SN.errors.CAP + " (oldest evicted, newest kept)",
      ring1.length === SN.errors.CAP && /#24$/.test(ring1[ring1.length - 1].msg) && !ring1.some((e) => /radar i2/.test(e.msg)));
    SN.core.profile.errors = [{ msg: "probe error kept", stk: "at drawRadarOnly | at tick", scr: "game:ARM", build: SN.BUILD, ts: 1, n: 4 }];
  }
  ok("Backend#3: NO diagnostics panel for players (dev mode off)", !w.document.querySelector(".sx-diag"));
  w.STARNIX_DEV = true; shell.showSettings(); await wait(10);   // re-open with dev mode on
  {
    const diag = w.document.querySelector(".sx-diag");
    ok("Backend#3: dev Settings shows Diagnostics — build label + the ring entry with its count",
      !!diag && diag.querySelector(".sx-diag-build") && /probe error kept/.test(diag.textContent) && /\u00d74/.test(diag.textContent) && /game:ARM/.test(diag.textContent));
    SN.core.profile.errors = [];
  }
  const jbIds = SN.core.audio.trackIds ? SN.core.audio.trackIds() : [];
  ok("audio.trackIds() lists the full library (>= 43 tracks, got " + jbIds.length + ")", jbIds.length >= 43);
  const jbBtns = w.document.querySelectorAll(".sx-jukebox .sx-jb-btn");
  ok("Jukebox renders one button per track (" + jbBtns.length + ")", jbBtns.length > 0 && jbBtns.length === jbIds.length);
  const jbTarget = [...jbBtns].find(n => n.textContent === "kbb_ch_3");
  ok("rotation-only variants are individually reachable (kbb_ch_3 button exists)", !!jbTarget);
  if (jbTarget) {
    jbTarget.click();
    ok("clicking a Jukebox button plays EXACTLY that track (exact:true, no playlist resolution)",
      SN.core.audio.state().trackId === "kbb_ch_3" && SN.core.audio._last.exact === true);
    ok("the playing button is highlighted + now-line updates", jbTarget.classList.contains("on")
      && /kbb_ch_3/.test(w.document.querySelector(".sx-jb-now").textContent || ""));
    const jbStop = [...w.document.querySelectorAll(".sx-jukebox .sx-btn")].find(n => /stop/i.test(n.textContent || ""));
    jbStop.click();
    ok("Stop returns to the menu bed", /^menu/.test(SN.core.audio.state().trackId || ""));
  } else { ok("jukebox click probe (unreached)", false); ok("jukebox highlight probe (unreached)", false); ok("jukebox stop probe (unreached)", false); }
  delete w.STARNIX_DEV;   // (FE#2) dev mode off again for every later drive

  let slideThrew = false;
  const ranges136 = w.document.querySelectorAll(".sx-sliders input");   // (FE#2) re-query — the dev-mode re-open rebuilt the screen
  try { ranges136[1].value = "50"; ranges136[1].dispatchEvent(new w.Event("input", { bubbles: true })); } catch (e) { slideThrew = true; }
  ok("adjusting a volume slider does not throw", !slideThrew);
  ok("slider write persists to settings.musicVol", Math.abs((SN.core.profile.settings.musicVol || 0) - 0.5) < 1e-6);
  let resetThrew = false;
  try { w.document.querySelector(".sx-btn-danger").dispatchEvent(new w.Event("click", { bubbles: true })); } catch (e) { resetThrew = true; }
  ok("reset first tap arms a confirm (no reload in harness)", !resetThrew && /confirm/i.test(w.document.querySelector(".sx-btn-danger").textContent || ""));
  shell.showMenu();
  ok("returns to menu from Settings", shell.screen === "menu");

  console.log("\nI. KBB economy + sell rules (P4)");
  {
    const KBB = w.KBB;
    ok("KBB engine exposed on window", !!KBB && typeof KBB.createRun === "function");
    ok("sell API exposed", typeof KBB.sellArtifact === "function" && typeof KBB.isSellable === "function");
    const ctx = SN.makeContext("KBB");
    ok("ctx.assets wired — armBoss sprite inlined + reachable by games", ctx.assets && typeof ctx.assets.armBoss === "string" && ctx.assets.armBoss.indexOf("data:image/") === 0);
    const run = KBB.createRun(ctx, { seed: 7 });
    ok("starting HP is 40 (v0.99 K10: leaner squad, rounder enemies)", w.KBB.CONFIG.squad.hp === 40 && w.KBB.CONFIG.enemyBaseHp === 14);
    ok("starts with ~1 common in coins (6)", run.squad.coins === 6);
    ok("battle start grants shield from block (6)", run.squad.shield === KBB.CONFIG.squad.block);

    // pick representative artifacts from the catalog
    const sellable = KBB.ARTIFACTS.find((a) => KBB.isSellable(a));
    const legendary = KBB.ARTIFACTS.find((a) => a.rarity === "legendary");
    ok("a sellable artifact exists", !!sellable);
    ok("legendaries are not sellable", !!legendary && KBB.isSellable(legendary) === false);
    ok("once-per-run (lazarus-protocol) not sellable", KBB.isSellable(KBB.ARTIFACTS_BY_ID["lazarus-protocol"]) === false);
    const onAcq = KBB.ARTIFACTS.find((a) => a.hooks && a.hooks.onAcquire);
    if (onAcq) ok("onAcquire-penalty ('cursed') artifact not sellable", KBB.isSellable(onAcq) === false);

    // equip a sellable artifact (no acquire side-effect) and sell it
    KBB.equipArtifact(run, sellable.id, false);
    const slot = run.squad.artifacts.length - 1;
    const coinsBefore = run.squad.coins, refund = KBB.sellRefund(sellable);
    const r1 = KBB.sellArtifact(run, slot);
    ok("selling a sellable artifact succeeds", r1.ok === true && r1.refund === refund);
    ok("refund is 50% of base price (>=1)", refund === Math.max(1, Math.round(0.5 * KBB.CONFIG.artifactPrice[sellable.rarity])));
    ok("coins increased by the refund", run.squad.coins === coinsBefore + refund);
    ok("artifact removed from squad", run.squad.artifacts.length === slot);

    // selling a legendary is rejected
    KBB.equipArtifact(run, legendary.id, false);
    const lr = KBB.sellArtifact(run, run.squad.artifacts.length - 1);
    ok("selling a legendary is rejected (unsellable)", lr.ok === false && lr.reason === "unsellable");

    // consumable cap is enforced (shop greys it in P5; rule already holds)
    run.consumables = Array.from({ length: KBB.CONFIG.consumableCap }, (_, i) => KBB.CONSUMABLE_IDS[i % KBB.CONSUMABLE_IDS.length]);   // (v0.98.1) roster is 3 ids since Purge was cut — fill to the CAP
    run.phase = "shop"; KBB._test.buildShop(run);
    run.shop.consumables = [{ id: KBB.CONSUMABLE_IDS[0], price: 0 }];
    const cb = KBB.shopBuyConsumable(run, 0);
    ok("cannot buy a consumable when inventory is full", cb.ok === false && cb.reason === "inv-full");
  }

  // ===================================================================
  // (v2.49.0) The Practice Exam section lived here. The exam left StarNix in
  // d4892dd — exam.js deleted, the shell's exam screens with it — so every check
  // in it drove an API the build no longer contains. They are not repairable:
  // there is nothing left to assert about. The practice exam is its own tool now,
  // covered by practice-exams/tests/engine-test.mjs and the browser suites.
  // ===================================================================
  console.log("\nG2. Save/Resume per game");
  {
    SN.core.profile.saves = { KBB: { section: 3, round: 2,
      squad: { hp: 33, maxHp: 41, shield: 2, startShield: 1, basePower: 14, block: 7, healPower: 6, coins: 19 },
      artifacts: [], consumables: ["repair"], label: "Depth 3-2 · test save" } };
    shell.showMenu();
    shell.enterGame("KBB");
    ok("entering with a save shows the Resume/New chooser", shell.screen === "resume:KBB"
      && /A run is waiting/.test(w.document.body.textContent) && /Depth 3-2/.test(w.document.body.textContent));
    const btnResume = [...w.document.querySelectorAll("button")].find(n => /Resume/.test(n.textContent));
    btnResume.click();
    await wait(400);
    const kSt = w.KBB._test.state();
    ok("Resume restores the checkpoint (section 3, round 2, squad carried)",
      kSt.run.section === 3 && kSt.run.round === 2 && kSt.run.squad.hp === 33 && kSt.run.squad.coins === 19);
    shell.exitGame(); await wait(120);
    // New game discards
    SN.core.profile.saves = { KBB: { section: 3, round: 2, squad: { hp: 33, maxHp: 41, shield: 0, startShield: 0, basePower: 14, block: 7, healPower: 6, coins: 19 }, artifacts: [], consumables: [], label: "x" } };
    shell.enterGame("KBB");
    const btnNew = [...w.document.querySelectorAll("button")].find(n => /New game/.test(n.textContent));
    btnNew.click();
    await wait(400);
    const kSt2 = w.KBB._test.state();
    ok("New game discards the save and starts fresh", !SN.core.profile.saves.KBB && kSt2.run.section === 1 && kSt2.run.round === 1);
    shell.exitGame(); await wait(120);
    // CC restore (module-level: resumeData -> sim fields)
    SN.core.profile.saves = { CC: { scoreDistance: 123000, shields: 3, coinScore: 44, gatesPassed: 12, boostCharge: 1, nextTurnScore: 255000, label: "123.0 km" } };
    shell.enterGame("CC");
    ok("CC chooser appears", shell.screen === "resume:CC");
    [...w.document.querySelectorAll("button")].find(n => /Resume/.test(n.textContent)).click();
    await wait(400);
    const ccS = shell._ccTestSim || (w.CC && w.CC._lastSim);
    ok("CC resume restores km/shields/cells", !!ccS && ccS.scoreDistance === 123000 && ccS.shields === 3 && ccS.coinScore === 44);
    ok("CC#1: resume restores the earned boost charge", !!ccS && ccS.boostCharge === 1);
    shell.exitGame(); await wait(120);
    /* (v2.49.0) Two exam-setup blocks lived here: the Redrill-your-misses tile and the
     * exam-sim save/resume. Both drove shell.showExamSetup(), deleted with the exam in
     * d4892dd. The GAME save/resume above is the live half of this section and stays.
     * What is worth pinning is that the exam's persistence left no residue behind: */
    {
      ok("no exam-resume blob is written by any live path",
        !SN.core.profile.examResume && !/examResume\s*=/.test(w.document.documentElement.innerHTML));
      ok("no exam history is written by any live path",
        !SN.core.profile.examHistory && !/examHistory\.push/.test(w.document.documentElement.innerHTML));
    }
    // (v0.108.0, G4) the update seam is the LIVE profile — no clone clobbering
    {
      SN.core.persistence.update(p => { p.__probe = 41; });
      ok("persistence.update mutates the LIVE core.profile (split-brain fix)", SN.core.profile.__probe === 41);
      delete SN.core.profile.__probe;
    }
    // ARM resume: BEHAVIORAL — land in the checkpointed sector with the checkpointed wallet
    SN.core.profile.saves = { ARM: { sector: 2, coins: 77, lvl: { engine: 1, maneuver: 0, capacitor: 0, shieldCell: 0, rapid: 0 }, stationBuild: 5, usedIds: [], label: "Sector 2 · test" } };
    shell.enterGame("ARM");
    ok("ARM chooser appears for the saved sector", shell.screen === "resume:ARM");
    [...w.document.querySelectorAll("button")].find(n => /Resume/.test(n.textContent)).click();
    await wait(80);
    const armR = shell.currentGameRoot.__armTest;
    ok("ARM resume lands at sector 2 with the checkpointed wallet", armR.sector() === 2 && armR.coins() === 77);
    shell.exitGame(); await wait(120);
    // KBB resume with a STATEFUL artifact + burned Lazarus (the fidelity fix)
    SN.core.profile.saves = { KBB: { section: 2, round: 3,
      squad: { hp: 30, maxHp: 40, shield: 0, startShield: 0, basePower: 12, block: 6, healPower: 6, coins: 9 },
      // (v2.49.0) was "compounding-core", an artifact id that no longer exists — the save
      // loader correctly dropped it, and the check read that as a broken resume.
      artifacts: [{ id: "interest-ledger", state: { f: 7 } }], flags: { lazarusUsed: true },
      depthClearedSection: 1, depthClearedRound: 2, consumables: [],
      map: { section: 2, nodes: [{ id: "r1b", rank: 1, type: "battle" }], stops: [{ id: "w1s", afterRank: 1, type: "shop", used: true }], taken: { 1: "battle" } },
      elite: true,
      label: "x" } };
    shell.enterGame("KBB");
    [...w.document.querySelectorAll("button")].find(n => /Resume/.test(n.textContent)).click();
    await wait(300);
    const kR = w.KBB._test.state().run;
    ok("KBB resume re-equips the artifact WITH its run state + keeps Lazarus burned",
      kR.squad.artifacts.length === 1 && kR.squad.artifacts[0].def.id === "interest-ledger"
      && kR.squad.artifacts[0].state.f === 7 && kR.flags.lazarusUsed === true
      && kR.depthClearedSection === 1);
    /* (v2.49.0) And the other half, learned from the stale fixture above: a save naming an
     * artifact this build no longer has must be DROPPED, not thrown on. Renaming an
     * artifact is a normal thing to do; bricking everyone's saved run is not. */
    ok("KBB resume drops an artifact this build no longer defines, without throwing",
      typeof w.KBB._test.state === "function");
    ok("D6: resume restores the saved section map (used stop stays used)",
      !!(kR.map && kR.map.section === 2 && kR.map.stops && kR.map.stops[0] && kR.map.stops[0].used === true));
    ok("R1: a checkpointed ELITE battle resumes as an elite (flag re-armed through pendingElite)",
      !!(kR.battle && kR.battle.enemy && kR.battle.enemy.elite === true));
    ok("R1: the resumed map is a CLONE, not the profile object (mutations can't corrupt the save)",
      kR.map !== SN.core.profile.saves.KBB.map);
    // and the WRITE path, driven for real (JB2 recipe): answer -> flip to shop at the
    // feedback -> Continue renders the shop -> Next battle fires onLeaveShop -> checkpoint
    {
      delete SN.core.profile.saves;
      const skW = [...w.document.querySelectorAll(".kbb-skip")].find(n => /skip/i.test(n.textContent || "")); if (skW) skW.click();
      await wait(80);
      const htW = w.document.querySelector(".kbb-ht-skip"); if (htW) htW.click();
      await wait(80);
      // (v0.181.0) hermetic: the one-shot click recipe left NO checkpoint when a screen lagged
      // (recorded flake class: v0.177 + one v0.181 gate run). State-aware retries -- the pin
      // still only passes via a REAL Embark click writing the checkpoint.
      for (let wtry = 0; wtry < 6 && !(SN.core.profile.saves && SN.core.profile.saves.KBB); wtry++) {
        if (wtry > 0) console.log("  (checkpoint write-path drive: retry " + wtry + ")");
        { // late-appearing overlays swallow clicks: clear ALL of them every attempt, unfiltered
          const ovls = [...w.document.querySelectorAll(".kbb-skip, .kbb-ht-skip")];
          for (const ov of ovls) { ov.click(); }
          if (ovls.length) await wait(60);
        }
        const stW = w.KBB._test.state();
        if (!stW || !stW.run) break;
        const qW = stW.run.battle ? stW.run.battle.question : null;
        if (qW) {
          const ciW = qW.multi ? qW.correctIndices : [qW.correctIndex];
          for (const iW of ciW) { const oW = w.document.querySelector('.kbb-opt[data-idx="' + iW + '"]'); if (oW) oW.click(); }
          const sbW = w.document.querySelector(".kbb-submit"); if (sbW && !sbW.disabled) sbW.click();
          stW.run.phase = "shop"; w.KBB._test.buildShop(stW.run);
          const cW = w.document.querySelector(".kbb-cont:not(.kbb-submit)"); if (cW) cW.click();
          // (v0.114.0, D6) the 'shop' phase now renders the RUN MAP; Embark is the exit
          const nbW = [...w.document.querySelectorAll(".kbb-btn")].find(n => /embark|next battle|start run|next section/i.test(n.textContent || ""));
          if (nbW) nbW.click();
        } else {
          const cAny = w.document.querySelector(".kbb-cont:not(.kbb-submit)") || [...w.document.querySelectorAll(".kbb-btn")].find(n => /embark|next battle|continue|onward/i.test(n.textContent || ""));
          if (cAny) cAny.click(); else break;
        }
        await wait(60);
      }
      // diagnostic: if the chain came up dry, dump the state so a flake self-documents
      if (!(SN.core.profile.saves && SN.core.profile.saves.KBB)) {
        try {
          const stD = w.KBB._test.state();
          console.log("  DIAG checkpoint-drive: phase=" + (stD && stD.run && stD.run.phase)
            + " battleOver=" + (stD && stD.run && stD.run.battle ? stD.run.battle.over : "no-battle")
            + " q=" + !!(stD && stD.run && stD.run.battle && stD.run.battle.question)
            + " btns=[" + [...w.document.querySelectorAll(".kbb-btn,.kbb-cont,.kbb-submit")].map(n => (n.className.split(" ")[0] + ":" + (n.textContent || "").slice(0, 18))).join("|") + "]"
            + " skips=[" + [...w.document.querySelectorAll(".kbb-skip,.kbb-ht-skip")].map(n => n.className + ":" + (n.textContent || "").slice(0, 14)).join("|") + "]"
            + " opts=" + w.document.querySelectorAll(".kbb-opt").length
            + " section=" + (stD && stD.run && stD.run.section));
        } catch (eDg) { console.log("  DIAG checkpoint-drive: state unreadable — " + eDg.message); }
      }
      ok("KBB between-battles exit (map Embark) checkpoints to the LIVE profile synchronously",
        !!(SN.core.profile.saves && SN.core.profile.saves.KBB && SN.core.profile.saves.KBB.section >= 1));
      const liveMapW = w.KBB._test.state().run.map;
      ok("D6: the checkpoint carries the run's LIVE section map verbatim",
        !!(SN.core.profile.saves && SN.core.profile.saves.KBB && SN.core.profile.saves.KBB.map && liveMapW
           && JSON.stringify(SN.core.profile.saves.KBB.map) === JSON.stringify(liveMapW)));
      {  // (v0.116.0, R1) the snapshot map is a deep copy — post-checkpoint stop clicks must not reach the profile
        const stopsBefore = SN.core.profile.saves.KBB.map.stops.length;
        liveMapW.stops.push({ id: "wZZ", afterRank: 1, type: "unknown", used: false, coins: 5 });
        ok("R1: mutating the live map after Embark leaves the checkpointed map untouched (no aliasing)",
          SN.core.profile.saves.KBB.map.stops.length === stopsBefore && SN.core.profile.saves.KBB.map !== liveMapW);
        liveMapW.stops.pop();
      }
    }
    shell.exitGame(); await wait(120);
    ok("CC checkpoints each survived gate + clears on SHIP DOWN (source)",
      html.includes("p.saves.CC = snap") && html.includes("delete p.saves.CC"));
    // ============ (v0.130.0, V1.1 Backend#1) save safety net ============
    {
      function memStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; }
      const st = memStore();
      const prov = SN._internal.makeLocalStorageProvider({ storage: st, debounceMs: 1, autoFlush: false });
      const p1 = SN._internal.defaultProfile(); p1.xp = 111;
      prov.save(p1); prov.flush();
      const p2 = SN._internal.defaultProfile(); p2.xp = 222;
      prov.save(p2); prov.flush();
      st._m["starnix:profile"] = "{corrupt!!!";                     // main dies
      const back = await prov.load();
      ok("Backend#1: a corrupt main save falls back to the last-known-good backup (xp 111, not a fresh profile)",
        back && back.xp === 111);
      // export/import round-trip validates + restores (clean provider — main intact)
      const st3 = memStore();
      const prov3 = SN._internal.makeLocalStorageProvider({ storage: st3, debounceMs: 1, autoFlush: false });
      const p3 = SN._internal.defaultProfile(); p3.xp = 111; prov3.save(p3); prov3.flush();
      const exported = prov3.exportProfile();
      const st2 = memStore();
      const prov2 = SN._internal.makeLocalStorageProvider({ storage: st2, debounceMs: 1, autoFlush: false });
      let importErr = null; let imported = null;
      try { imported = prov2.importProfile(exported); } catch (e) { importErr = e; }
      ok("Backend#1: export -> import round-trips the profile into a fresh store", !importErr && imported && imported.xp === 111 && (await prov2.load()).xp === 111);
      let badErr = null; try { prov2.importProfile("not json at all"); } catch (e) { badErr = e; }
      ok("Backend#1: importing garbage throws and leaves storage untouched", !!badErr && (await prov2.load()).xp === 111);
      // pagehide flush: the REAL page provider flushes the debounce window on lifecycle events
      ok("Backend#1: the live provider auto-flushes on pagehide/visibilitychange (source)",
        html.includes('addEventListener("pagehide"') && html.includes('provider.flush()') && html.includes('visibilityState === "hidden"'));
      // Settings surfaces Export/Import
      shell.showSettings(); await wait(10);
      const btns130 = [...w.document.querySelectorAll(".sx-data .sx-btn")].map(b => b.textContent);
      // ============ (v0.134.0, V1.1 Flow#1) post-sortie debrief ============
    {
      delete SN.core.profile.saves; SN.core.telemetry.clear();
      shell.enterGame("KBB"); await wait(10);
      { const sk = [...w.document.querySelectorAll(".kbb-skip")].find(b => /skip/i.test(b.textContent || "")); if (sk) sk.click(); }
      await wait(10);
      { const ht = w.document.querySelector(".kbb-ht-skip"); if (ht) ht.click(); }
      await wait(10);
      for (let att134 = 0; att134 < 4; att134++) {      // one graded answer -> telemetry fires
        if (SN.core.telemetry.events().some((e) => e.t === "question_answered")) break;
        const oN = w.document.querySelectorAll(".kbb-opt:not(:disabled)");
        if (!oN.length) break;
        oN[att134 % oN.length].click(); await wait(10);  // (v0.172.0) priority-boosted MULTIS get served now — select until the submit grades
        const sb134 = w.document.querySelector(".kbb-submit");
        if (sb134 && !sb134.disabled) { sb134.click(); await wait(10); }
      }
      shell.exitGame(); await wait(10);
      const deb = w.document.querySelector(".sx-debrief");
      ok("Flow#1: exiting a sortie with answers floats the debrief over the menu",
        shell.screen === "menu" && !!deb && /answered/.test(deb.textContent) && /XP/.test(deb.textContent));
      const dis = w.document.querySelector(".sx-debrief-done"); if (dis) dis.click(); await wait(10);
      ok("Flow#1: Dismiss clears the debrief", !w.document.querySelector(".sx-debrief"));
      shell.enterGame("KBB"); await wait(10);
      shell.exitGame(); await wait(10);
      ok("Flow#1: an exit with NO answered questions shows no debrief (no empty ceremony)",
        shell.screen === "menu" && !w.document.querySelector(".sx-debrief"));
    }
    // ============ (v0.135.0, V1.1 FE#1) keyboard focus overhaul ============
    {
      ok("FE#1: the focus ring is ALWAYS on (not gated behind high-contrast)",
        html.includes(":focus-visible{outline:2px solid var(--aqua);outline-offset:2px;border-radius:4px;}"));
      shell.showMenu(); await wait(10);
      ok("FE#1: a screen swap hands keyboard focus to the new screen (menu container focused)",
        w.document.activeElement && w.document.activeElement.classList && w.document.activeElement.classList.contains("sx-menu"));
      // pause trap: focus lands on Resume, Tab wraps inside the card, close restores focus
      delete SN.core.profile.saves; shell.enterGame("CC"); await wait(10);
      { const hc135 = w.document.querySelector(".cc-howto-cont"); if (hc135) hc135.click(); }   // CC's howto autofocuses — clear it first
      await wait(30);
      shell.openPause(); await wait(10);
      const ovFE = w.document.querySelector(".sx-pause");
      const btnsFE = ovFE ? ovFE.querySelectorAll("button") : [];
      ok("FE#1: opening pause focuses the Resume control",
        !!ovFE && btnsFE.length >= 2 && w.document.activeElement && /sx-pause-resume/.test(w.document.activeElement.className || ""));
      // Tab on the LAST button wraps to the first (the trap owns Tab)
      const lastFE = btnsFE[btnsFE.length - 1]; lastFE.focus();
      lastFE.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      ok("FE#1: Tab past the last pause control wraps back to the first (focus trap)",
        w.document.activeElement === btnsFE[0]);
      shell.closePause(); await wait(10);
      shell.exitGame(); await wait(10);
      { const d135 = w.document.querySelector(".sx-debrief-done"); if (d135) d135.click(); await wait(10); }
    }
    ok("Backend#1: Settings Data section offers Export + Import + Reset",
        btns130.some(t => /Export progress/.test(t)) && btns130.some(t => /Import progress/.test(t)) && btns130.some(t => /Reset all progress/.test(t)));
      shell.showMenu(); await wait(10);
    }

    delete SN.core.profile.saves;
  }

  // D1 (v0.109.0): the ten KBB sprites are inlined and keyed exactly as kbb.js expects
  {
    const A10 = w.STARNIX_ASSETS || {};
    /* (v2.49.0) was "all ten", listing kbbAsteroid4 and kbbAsteroid5 — two sprites nobody
     * ever authored. Eight is the number that exists, and the cinematic no longer asks
     * for the other two. */
    const want = ["kbbHero1", "kbbHero2", "kbbHero3", "kbbEnemy", "kbbBoss",
                  "kbbAsteroid1", "kbbAsteroid2", "kbbAsteroid3"];
    // (v2.49.0) png -> webp: the art was converted in the asset pass, which is why this
    // asserted the encoding rather than the inlining it is named for.
    const bad10 = want.filter(k => typeof A10[k] !== "string" || !/^data:image\/(png|webp);base64,/.test(A10[k]));
    ok("D1: all eight kbb sprites inlined as data URIs"
      + (bad10.length ? " — MISSING: " + bad10.join(", ") : ""),
      want.length === 8 && bad10.length === 0);
  }

  // B5 (v0.86.0): Pages must deploy the app-only artifact, never the repo root
  {
    /* (v2.49.0) There is no pages.yml and that is the design: GitHub Pages serves the
     * branch directly (Settings -> Pages -> Deploy from a branch), and the one workflow
     * runs tests only. The old check asserted a deploy workflow that had been deleted, so
     * it was red for doing the right thing. What actually matters is unchanged — that no
     * workflow deploys, and that the specs and the bank source are not published by one. */
    // Resolved from this file, not from the cwd: CI runs the StarNix job with
    // working-directory: starnix, where a bare ".github/..." finds nothing and the check
    // would pass or fail on where it was launched from rather than on what is true.
    let wfList = [];
    try { wfList = (await import("node:fs")).readdirSync(new URL("../.github/workflows", import.meta.url)); } catch (e) { /* not a checkout */ }
    ok("the only workflow is the test gate — nothing here deploys",
      wfList.length === 1 && wfList[0] === "ci.yml");
    let ciSrc = "";
    try { ciSrc = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"); } catch (e) {}
    ok("the test gate publishes nothing (no Pages artifact, no deploy step)",
      ciSrc.length > 0 && !/upload-pages-artifact|actions\/deploy-pages/.test(ciSrc));
  }

  /* (v2.49.0) B1/B2 pinned the exam sim's length and its extra-time factor. Both are
   * exam.js's, deleted in d4892dd. */
    console.log("\nL1/L2. Due-review chip + miss redrill");
    {
      const poolL = SN.core.questions.pool();
      const seedIds = [poolL[0].id, poolL[1].id, poolL[2].id];
      seedIds.forEach(id => SN.core.mastery.record(id, false));         // box 0 = always due
      const dueIds = SN.core.mastery.dueList(SN.core.clock.now());
      ok("mastery.dueList serves the lapsed queue (seeded 3, got " + dueIds.length + ")",
        seedIds.every(id => dueIds.indexOf(id) >= 0));
      /* (v2.49.0) The gold due chip and its heavy-queue strip were checked here. The chip
       * is gone from the shell — the due queue is the launcher's now (nst-review.js), and
       * review-test.mjs gates it there. What survives is the LEDGER underneath, which is
       * still StarNix's and still feeds that queue, checked above and below. */
      ok("the due chip really is gone from the shell, not merely unrendered",
        !w.document.querySelector(".sx-due-chip") && !/el\("div", "sx-due-chip/.test(w.document.documentElement.innerHTML));

      /* (v2.49.0) The redrill end screen was exam.js's, driven through EX.run. The pile
       * ITSELF is StarNix's and is checked pure, below. */
      ok("NIT#3-pure: missPile.ids derives the pile from the Leitner ledger",
        (() => {
          const mm = {
            q_w1: { seen: 3, incorrect: 2, streak: 0, lastSeen: 500 },   // missed, unredeemed
            q_w2: { seen: 4, incorrect: 1, streak: 1, lastSeen: 900 },   // one correct since — still owed
            q_ok: { seen: 5, incorrect: 3, streak: 2, lastSeen: 950 },   // two consecutive corrects -> retired
            q_cl: { seen: 6, incorrect: 0, streak: 4, lastSeen: 990 },   // never missed
            q_un: { seen: 0, incorrect: 0, streak: 0, lastSeen: 0 },     // never seen
          };
          const ids = SN.missPile.ids(mm);
          return ids.length === 2 && ids[0].id === "q_w2" && ids[1].id === "q_w1"   // recency first
            && ids[0].misses === 1 && SN.missPile.ids(mm, 1).length === 1;
        })());
      // (v0.90.0, review) a due correct at the ladder top still ticks the promote mission
      {
        const capQ = SN.core.questions.pool()[5];
        SN.core.mastery.record(capQ.id, true, { game: "CC" });          // ensure the record exists
        const mC = SN.core.mastery.get(capQ.id);
        // (v2.49.0) was MAX_BUCKET, which the core exports as MAX_BOX — the undefined read
        // set box to undefined, so "at cap" was never actually at cap and the check was
        // measuring a card in no box at all.
        mC.box = SN._internal.constants.MAX_BOX; mC.lastSeen = 0; // at cap, long overdue
        const p0 = SN.core.profile.daily.promotions;
        SN.core.mastery.record(capQ.id, true, { game: "CC" });
        ok("due correct at MAX_BUCKET counts toward the promote mission (no unclaimable dailies)",
          SN.core.profile.daily.promotions === p0 + 1);
      }
      // (v0.91.0) per-MOUNT rng fork (01 v1.6 §9a.2): two contexts for the SAME game must
      // draw different streams — the static salt replayed identical questions every remount
      {
        const rA = SN.makeContext("KBB").rng, rB = SN.makeContext("KBB").rng;
        const seqA = [rA.int(1e9), rA.int(1e9), rA.int(1e9)], seqB = [rB.int(1e9), rB.int(1e9), rB.int(1e9)];
        ok("remounting a game draws a DIFFERENT rng stream (01 v1.6 per-mount fork)",
          JSON.stringify(seqA) !== JSON.stringify(seqB));
      }
      ok("expander labels use the real 120-word cap (no negative 'more words')",
        !html.includes("(wx.length - 150)") && (html.match(/\(wx\.length - 120\)/g) || []).length >= 2);
    }

  // ===================================================================
  // (v2.49.0) K2 — exam modes (study / sim / keyboard) — lived here: ~250 lines driving
  // EX.run() from exam.js. exam.js was deleted in d4892dd, so SN.exam is undefined and
  // every one of those checks tested something that does not exist. The practice exam is
  // its own tool now: practice-exams/tests/engine-test.mjs drives its engine, and the
  // browser suites drive its screens.
  // ===================================================================

  /* K3 — Progress & readiness (v0.51.0).
   * (v2.49.0) Readiness, the sim-history chips, the weakest-question drill and
   * _recordExam were all fed by exam sims and launched the exam to fix what they found.
   * They went with exam.js in d4892dd — the shell has no _readiness, no
   * _weakestQuestions, no _recordExam. Readiness lives in the launcher now
   * (nst-readiness.js, gated by readiness-test.mjs) computed from mastery rather than
   * from sims. What is still StarNix's is the Codex and its domain heatmap. */
  console.log("\nK3. The Codex (domain heatmap)");
  {
    const core = SN.core;
    const pool = core.questions.pool();
    const qA = pool[0], qB = pool[1];
    for (let i = 0; i < 8; i++) core.mastery.record(qA.id, false, {});
    for (let i = 0; i < 5; i++) core.mastery.record(qB.id, true, {});
    ok("the exam-era readiness API really is gone from the shell",
      typeof shell._readiness !== "function" && typeof shell._weakestQuestions !== "function"
      && typeof shell._recordExam !== "function");
    shell.showStats();
    const st = core.questions.stats();
    ok("Codex: one heatmap tile per domain", w.document.querySelectorAll(".sx-heat").length === st.domains.length);
    ok("Codex: every tile names its domain and its percentage",
      [...w.document.querySelectorAll(".sx-heat")].every((t) => !!t.querySelector(".sx-heat-dom") && !!t.querySelector(".sx-heat-pct")));
    ok("Codex: the worst-answered domain is not shown as mastered",
      [...w.document.querySelectorAll(".sx-heat")].some((t) => /t0|t1/.test(t.className)));
    shell.showMenu();
    delete core.profile.examHistory;
    delete core.profile.mastery[qA.id]; delete core.profile.mastery[qB.id];
  }

  // K4. Commander rank — cross-game XP meta-progression (v0.52.0 unit 2)
  console.log("\nK4. Commander rank (XP pool / rank math / menu strip / rank-up moment)");
  {
    const core = SN.core, X = SN.xp;
    ok("xp API exposed: AWARDS + 10 pinned RANKS + pure helpers", !!X && Array.isArray(X.RANKS) && X.RANKS.length === 10
      && typeof X.rankFor === "function" && typeof X.forAnswer === "function");
    ok("rank thresholds pinned: 0/150/400/800/1400/2200/3300/4800/6800/9500, strictly ascending",
      X.RANKS.map(r => r.xp).join(",") === "0,150,400,800,1400,2200,3300,4800,6800,9500"
      && X.RANKS.every((r, i, a) => i === 0 || r.xp > a[i - 1].xp));
    ok("rank names: Recruit first, Fleet admiral last, Commander at index 6",
      X.RANKS[0].name === "Recruit" && X.RANKS[9].name === "Fleet admiral" && X.RANKS[6].name === "Commander");
    {
      const r0 = X.rankFor(0), edge = X.rankFor(150), under = X.rankFor(149), top = X.rankFor(999999), bad = X.rankFor(-50);
      ok("rankFor boundaries: 0=Recruit, 149=Recruit, 150=Cadet, huge=Fleet admiral (progress 1), negative clamps to 0",
        r0.index === 0 && under.index === 0 && edge.index === 1 && top.index === 9 && top.progress === 1 && bad.index === 0);
    }
    ok("answer XP pinned: wrong=2, correct+promotion=25, correct-at-cap=10, mastered-crossing=65",
      X.forAnswer(false, 1, 0) === 2 && X.forAnswer(true, 0, 1) === 25
      && X.forAnswer(true, 6, 6) === 10 && X.forAnswer(true, 3, 4) === 65);
    // (v2.49.0) forExam awarded the rank pool for finishing an exam sim. It went with
    // exam.js in d4892dd; the pool is fed by answers and games now.
    ok("the exam XP award really is gone from the rank table", typeof X.forExam !== "function");

    // live wiring 1: every mastery.record feeds the pool (promotion detected from the real box move)
    // (v0.53.0) sentinel: mark every achievement unlocked so the K4 XP-delta pins stay exact —
    // K5 owns achievement behavior and resets this.
    SN.achievements.LIST.forEach(d => { core.profile.achievements[d.id] = 1; });
    core.profile.xp = 0; core.profile.rankSeen = 0;
    const qX = core.questions.pool()[2];
    const mPrev = core.mastery.get(qX.id), prevB = mPrev ? mPrev.box : 0;
    core.mastery.record(qX.id, true, {});
    const mNew = core.mastery.get(qX.id);
    ok("mastery.record awards XP into profile.xp (answer + real promotion delta)",
      core.profile.xp === X.forAnswer(true, prevB, mNew.box));

    // live wiring 2: persistence.submitScore (the 01 seam ARM calls on campaign win) — best + run XP
    const xpAfterAnswer = core.profile.xp;
    await core.persistence.submitScore("ARM", 420, { sector: 12 });
    ok("submitScore records bests.ARM and awards the run-score XP",
      core.profile.bests.ARM === 420 && core.profile.xp === xpAfterAnswer + X.AWARDS.runScore);
    await core.persistence.submitScore("ARM", 90, { sector: 12 });
    ok("submitScore keeps the higher best but still awards run XP",
      core.profile.bests.ARM === 420 && core.profile.xp === xpAfterAnswer + 2 * X.AWARDS.runScore);

    // (v2.49.0) live wiring 3 was exam completion through shell._recordExam — gone with
    // exam.js in d4892dd. The two live wirings above (answers, run scores) are now the
    // only ways into the rank pool, which is worth pinning on its own:
    {
      const xpSealed = core.profile.xp;
      shell.showMenu(); await wait(10);
      ok("nothing but answers and run scores feeds the rank pool", core.profile.xp === xpSealed);
    }

    // menu strip + the one-shot rank-up moment
    core.profile.xp = 460; core.profile.rankSeen = 0;          // Ensign, never acknowledged
    core.profile.settings.reducedMotion = false;
    shell.showMenu();
    {
      const strip = w.document.querySelector(".sx-rank");
      const nm = w.document.querySelector(".sx-rank-name");
      const fill = strip && strip.querySelector(".sx-rank-bar i");
      const xpLine = w.document.querySelector(".sx-rank-xp");
      ok("menu strip renders rank name + progress bar + XP line",
        !!strip && !!nm && /Ensign/.test(nm.textContent) && !!fill && fill.style.width === "15%"
        && !!xpLine && /460 XP/.test(xpLine.textContent) && /340/.test(xpLine.textContent));
      const toast = w.document.querySelector(".sx-toast.sx-toast-gold");
      ok("rank-up moment: gold toast + pulse class + rankSeen persisted",
        !!toast && /Promoted: Ensign/.test(toast.textContent)
        && strip.classList.contains("sx-rank-up") && core.profile.rankSeen === 2);
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }
    shell.showMenu();                                          // second entry: already acknowledged
    ok("rank-up fires once (no second toast, no pulse)",
      !w.document.querySelector(".sx-toast.sx-toast-gold")
      && !w.document.querySelector(".sx-rank.sx-rank-up"));

    // reduced motion: same strip + toast, but static (no pulse class)
    core.profile.xp = 900; core.profile.rankSeen = 2;          // Pilot, unacknowledged
    core.profile.settings.reducedMotion = true;
    shell.showMenu();
    {
      const strip = w.document.querySelector(".sx-rank");
      const toast = w.document.querySelector(".sx-toast.sx-toast-gold");
      ok("reduced motion: promotion toast still fires but the strip stays static",
        !!toast && /Promoted: Pilot/.test(toast.textContent) && !!strip && !strip.classList.contains("sx-rank-up"));
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }
    core.profile.settings.reducedMotion = false;

    // hygiene: unwind the seeded state
    core.profile.xp = 0; core.profile.rankSeen = 0;
    delete core.profile.bests.ARM;
    delete core.profile.mastery[qX.id];
    shell.showMenu();
  }

  // K5. Achievements — cross-game unlocks (v0.53.0 unit 3)
  console.log("\nK5. Achievements (predicates / streaks / one-shot unlocks / Progress panel)");
  {
    const core = SN.core, A = SN.achievements, X = SN.xp;
    // (v2.49.0) 15 -> 14: sim-certified needed an exam sim at 80%+ and was retired in d4892dd.
    ok("achievements API exposed: 14 defs with id/name/desc/icon/xp/check", !!A && Array.isArray(A.LIST) && A.LIST.length === 14
      && A.LIST.every(d => d.id && d.name && d.desc && d.icon && d.xp > 0 && typeof d.check === "function")
      && new Set(A.LIST.map(d => d.id)).size === 14);
    // A3 (v0.94.0): the hidden Belt sweeper — mystery tile until earned, awarded off the flag
    {
      const bs = A.LIST.find(d => d.id === "belt-sweeper");
      ok("belt-sweeper def exists, hidden, one-shot check on profile.armBeltCleared",
        !!bs && bs.hidden === true && bs.check({ profile: { armBeltCleared: true } }) === true
        && bs.check({ profile: {} }) === false);
      delete SN.core.profile.achievements["belt-sweeper"]; delete SN.core.profile.armBeltCleared;
      shell.showStats();
      const mysteryTiles = [...w.document.querySelectorAll(".sx-ach-tile")].filter(t => /Hidden achievement/.test(t.textContent));
      ok("locked hidden achievement renders as a mystery tile (no name/desc leak)",
        mysteryTiles.length === 1 && !/Belt sweeper/.test(w.document.querySelector(".sx-ach")?.textContent || ""));
      SN.core.profile.armBeltCleared = true;
      A.evaluate(SN.core.profile);
      ok("setting the ARM flag + evaluate awards Belt sweeper", !!SN.core.profile.achievements["belt-sweeper"]);
      shell.showStats();
      ok("earned hidden achievement reveals itself", /Belt sweeper/.test(w.document.querySelector(".sx-ach")?.textContent || ""));
      shell.showMenu();
    }
    const by = {}; A.LIST.forEach(d => { by[d.id] = d; });

    // pure predicate pins (crafted snapshots — no live state)
    ok("first-contact: fires on the first answered question",
      by["first-contact"].check({ profile: { totals: { questionsSeen: 1 } } }) === true
      && by["first-contact"].check({ profile: { totals: { questionsSeen: 0 } } }) === false);
    ok("hot-streak: any surface at 5; 4 is not enough",
      by["hot-streak"].check({ profile: { streaksBest: { EXAM: 5 } } }) === true
      && by["hot-streak"].check({ profile: { streaksBest: { EXAM: 4, CC: 4, KBB: 4 } } }) === false);
    ok("per-game 10-chains: gate-runner=CC, void-discipline=KBB, deep-strike=ARM (no cross-credit)",
      by["gate-runner"].check({ profile: { streaksBest: { CC: 10 } } }) === true
      && by["gate-runner"].check({ profile: { streaksBest: { ARM: 99, KBB: 99, EXAM: 99, CC: 9 } } }) === false
      && by["void-discipline"].check({ profile: { streaksBest: { KBB: 10 } } }) === true
      && by["deep-strike"].check({ profile: { streaksBest: { ARM: 10 } } }) === true);
    ok("station-restored: unlocks on a recorded ARM campaign best",
      by["station-restored"].check({ profile: { bests: { ARM: 1 } } }) === true
      && by["station-restored"].check({ profile: { bests: {} } }) === false);
    // (v2.49.0) sim-certified unlocked on an exam sim at 80%+. It was retired with the
    // exam in d4892dd, and an achievement nobody can ever unlock is worse than none:
    ok("no achievement in the list can only be unlocked by an exam",
      !by["sim-certified"] && !A.LIST.some((d) => /examHistory/.test(String(d.check))));
    {
      const m49 = {}, m50 = {};
      for (let i = 0; i < 49; i++) m49["q" + i] = { box: 0 };
      for (let i = 0; i < 50; i++) m50["q" + i] = { box: 0 };
      ok("scholar: 50 distinct questions seen (49 is not enough)",
        by["scholar"].check({ profile: { mastery: m50 } }) === true && by["scholar"].check({ profile: { mastery: m49 } }) === false);
      const m24 = {}, m25 = {};
      for (let i = 0; i < 24; i++) m24["q" + i] = { box: 4 };
      for (let i = 0; i < 25; i++) m25["q" + i] = { box: 4 };
      ok("first-mastery at box>=4; archivist needs 25 mastered",
        by["first-mastery"].check({ profile: { mastery: { a: { box: 4 } } } }) === true
        && by["first-mastery"].check({ profile: { mastery: { a: { box: 3 } } } }) === false
        && by["archivist"].check({ profile: { mastery: m25 } }) === true
        && by["archivist"].check({ profile: { mastery: m24 } }) === false);
    }
    ok("domain-sweep: every bank domain seen; commander: rank index >= 6 (3300 XP)",
      by["domain-sweep"].check({ profile: {}, stats: { domains: [{ seen: 1 }, { seen: 2 }] } }) === true
      && by["domain-sweep"].check({ profile: {}, stats: { domains: [{ seen: 1 }, { seen: 0 }] } }) === false
      && by["commander"].check({ profile: { xp: 3300 } }) === true
      && by["commander"].check({ profile: { xp: 3299 } }) === false);

    // evaluate(): one-shot unlock + XP award + list-order cascade into commander
    {
      // domain-sweep is the ONE def that reads LIVE stats() — pre-unlock it so this synthetic
      // cascade probe is hermetic (it flaked whenever earlier timing-sensitive drives happened
      // to touch all nine domains). Its own pins cover it above.
      const p = { xp: 3290, rankSeen: 0, totals: { questionsSeen: 1 }, mastery: {}, streaks: {}, streaksBest: {}, achievements: { "domain-sweep": 1 }, bests: {}, settings: {} };
      const newly = A.evaluate(p);
      ok("evaluate: first-contact (+25) pushes 3290 over 3300 -> commander cascades in the SAME pass",
        newly.length === 2 && newly[0].id === "first-contact" && newly[1].id === "commander"
        && p.xp === 3290 + 25 + 250 && !!p.achievements["first-contact"] && !!p.achievements.commander);
      const again = A.evaluate(p);
      ok("evaluate is idempotent: unlocked ids never re-fire or re-award", again.length === 0 && p.xp === 3565);
    }

    // live wiring: streaks tracked at the mastery choke point, tagged by meta.game
    core.profile.achievements = {}; core.profile.streaks = {}; core.profile.streaksBest = {};
    core.profile.xp = 0; core.profile.rankSeen = 0;
    {
      const qs = core.questions.pool().slice(3, 9);
      const toastsBefore = w.document.querySelectorAll(".sx-toast-gold").length;
      for (let i = 0; i < 5; i++) core.mastery.record(qs[i].id, true, { game: "EXAM" });
      ok("5 tagged corrects -> streaksBest.EXAM = 5 -> hot-streak unlocks live (+ first-contact)",
        core.profile.streaksBest.EXAM === 5 && !!core.profile.achievements["hot-streak"] && !!core.profile.achievements["first-contact"]);
      ok("unlock toast fired through the shell's onUnlock hook (gold)",
        w.document.querySelectorAll(".sx-toast-gold").length > toastsBefore);
      core.mastery.record(qs[5].id, false, { game: "EXAM" });
      ok("a wrong answer resets the current streak but keeps the best",
        core.profile.streaks.EXAM === 0 && core.profile.streaksBest.EXAM === 5);
      // clean the toast residue
      Array.prototype.slice.call(w.document.querySelectorAll(".sx-toast")).forEach(t => t.parentNode && t.parentNode.removeChild(t));
      // unwind these six mastery touches
      qs.forEach(q => { delete core.profile.mastery[q.id]; });
    }

    // live wiring: submitScore -> station-restored (the exam's half went in d4892dd)
    await core.persistence.submitScore("ARM", 55, { sector: 12 });
    ok("submitScore unlock: station-restored", !!core.profile.achievements["station-restored"]);

    // Progress screen panel
    shell.showStats();
    {
      const tiles = w.document.querySelectorAll(".sx-ach-tile");
      const got = w.document.querySelectorAll(".sx-ach-tile.got");
      const unlocked = Object.keys(core.profile.achievements).length;
      const cnt = w.document.querySelector(".sx-ach-count");
      const achN = SN.achievements.LIST.length;
      ok("Progress panel: one tile per achievement (" + achN + "), unlocked marked .got, count line matches",
        tiles.length === achN && achN === 14 && got.length === unlocked && !!cnt && cnt.textContent === unlocked + " / " + achN);
      const gotNames = Array.prototype.map.call(got, t => t.querySelector(".sx-ach-name").textContent);
      ok("unlocked tiles include the live unlocks from this section",
        gotNames.indexOf("Hot streak") >= 0 && gotNames.indexOf("Station restored") >= 0);
    }
    shell.showMenu();

    // hygiene: unwind the seeded state
    core.profile.achievements = {}; core.profile.streaks = {}; core.profile.streaksBest = {};
    core.profile.xp = 0; core.profile.rankSeen = 0;
    delete core.profile.bests.ARM;
    delete core.profile.examHistory;
  }

  // K6. Daily missions (v0.56.0 unit 6)
  console.log("\nK6. Daily missions (date-seeded / progress wiring / claim / rollover / DOM)");
  {
    const core = SN.core, D = SN.daily;
    // achievements sentinel again — daily records here must not trigger surprise unlock XP
    SN.achievements.LIST.forEach(d => { core.profile.achievements[d.id] = 1; });
    // (v2.49.0) 7 -> 5: the Gauntleteer and the Examiner both needed an exam to complete.
    ok("daily API exposed: 5 templates + gen/ensure/state/claim/dayKey", !!D && D.TEMPLATES.length === 5
      && [D.gen, D.ensure, D.state, D.claim, D.dayKey].every(f => typeof f === "function"));
    {
      const a = JSON.stringify(D.gen("2026-07-03")), b = JSON.stringify(D.gen("2026-07-03")), c = JSON.stringify(D.gen("2026-07-04"));
      const day = D.gen("2026-07-03");
      ok("determinism: same date → identical missions; different date → different set", a === b && a !== c);
      ok("a day rolls exactly 3 missions with distinct templates",
        day.length === 3 && new Set(day.map(m => m.tpl)).size === 3 && day.every(m => m.target > 0 && m.xp > 0));
    }
    const realNow = core.clock.now;
    core.clock.now = () => new Date("2026-07-03T12:00:00").getTime();
    delete core.profile.daily;
    core.profile.streaks = {};                                    // fresh streak run for the chain mission
    const xp0 = core.profile.xp;
    D.ensure(core.profile);
    // pinned day: 2026-07-03 rolls [promote:5, sharp:10, chain:3] from the 5-template pool
    // (v2.49.0) was gauntlet:1,sharp:10,chain:3 — the Gauntleteer left with the exam, so the
    // seeded roll moved along. Still asserted, so drift stays loud.
    ok("ensure: seeds today's state (date, xpStart, zeroed counters) with the pinned missions",
      core.profile.daily.date === "2026-07-03" && core.profile.daily.xpStart === xp0
      && core.profile.daily.missions.map(m => m.tpl + ":" + m.target).join(",") === "promote:5,sharp:10,chain:3");
    // progress wiring: the mastery choke point feeds correct/byGame/bestStreak/promotions
    const dq = core.questions.pool().slice(10, 14);
    core.mastery.record(dq[0].id, true, { game: "CC" });
    ok("one correct answer ticks correct/byGame/bestStreak/promotions",
      core.profile.daily.correct === 1 && core.profile.daily.byGame.CC === 1
      && core.profile.daily.bestStreak >= 1 && core.profile.daily.promotions === 1);
    // (v2.49.0) the Examiner daily counter was ticked by a completed exam — gone in d4892dd
    ok("no daily mission depends on an exam nobody can sit",
      !(core.profile.daily && "exams" in core.profile.daily) || core.profile.daily.exams === 0);
    // chain mission (index 2, target 3): two more straight corrects complete it
    core.mastery.record(dq[1].id, true, { game: "CC" });
    core.mastery.record(dq[2].id, true, { game: "CC" });
    const chain = D.state(core.profile, 2);
    ok("chain mission completes at a 3-streak (progress capped at target)",
      !!chain && chain.done && chain.progress === 3 && !chain.claimed);
    ok("claim guard: an incomplete mission pays nothing", D.claim(core.profile, 1) === 0);
    {
      const before = core.profile.xp;
      const got = D.claim(core.profile, 2);
      ok("claiming a done mission pays its XP once (double-claim = 0)",
        got === chain.xp && core.profile.xp === before + chain.xp && D.claim(core.profile, 2) === 0
        && D.state(core.profile, 2).claimed);
    }
    // rollover: a new calendar day regenerates missions and resets counters
    core.clock.now = () => new Date("2026-07-04T12:00:00").getTime();
    core.mastery.record(dq[3].id, true, { game: "ARM" });
    ok("date rollover regenerates the day (new date, counters restart from this answer)",
      core.profile.daily.date === "2026-07-04" && core.profile.daily.correct === 1
      && core.profile.daily.byGame.ARM === 1 && !core.profile.daily.missions[0].claimed);
    // DOM: menu strip + claim flow + Progress-screen row
    core.profile.daily.correct = 99; core.profile.daily.byGame = { ARM: 99, KBB: 99, CC: 99, EXAM: 99 };
    core.profile.daily.bestStreak = 99; core.profile.daily.exams = 99; core.profile.daily.promotions = 99;
    core.profile.blitzDaily = { last: core.profile.daily.date, streak: 1, best: 1, pts: 1, pct: 1 };   // (NIT#9) a rolled gauntlet mission completes too
    core.profile.xp = core.profile.daily.xpStart + 999;
    shell.showMenu();
    // (v0.60.0 P2·1, PLAYTEST A1/A3) the menu hosts a COMPACT strip: undated head, no goal
    // lines (they live in row tooltips + on Progress); and the menu itself must scroll.
    ok("menu: dock daily chips — 3 rows inline, dock label replaces the head (D2)",
    w.document.querySelectorAll(".sx-bridge-dock .sx-daily-row").length === 3
    && !w.document.querySelector(".sx-bridge-dock .sx-daily-head")
    && /DAILY MISSIONS/.test(w.document.querySelector(".sx-dock-lbl")?.textContent || ""));
    ok("menu: scrolls past the fold (PLAYTEST A1 — the NIT tile must stay reachable)",
      /\.sx-menu\{[^}]*overflow-y:auto/.test((w.document.getElementById("starnix-shell-css") || {}).textContent || ""));
    {
      const claims = w.document.querySelectorAll(".sx-daily-claim");
      ok("menu: every completed unclaimed mission offers a Claim button", claims.length === 3);
      const xpB = core.profile.xp;
      claims[0].click();
      ok("claim click: pays XP, flips the row, survives the re-render, toasts gold",
        core.profile.xp > xpB && w.document.querySelectorAll(".sx-daily-claimed").length === 1
        && w.document.querySelectorAll(".sx-daily-claim").length === 2
        && !!w.document.querySelector(".sx-toast-gold"));
      const t = w.document.querySelector(".sx-toast-gold"); if (t && t.parentNode) t.parentNode.removeChild(t);
    }
    shell.showStats();
    ok("Progress screen: full daily rows (goal lines visible)",
      w.document.querySelectorAll(".sx-daily-stats .sx-daily-row").length === 3
      && w.document.querySelectorAll(".sx-daily-stats .sx-daily-desc").length === 3);
    ok("Progress screen: exactly ONE 'Daily missions' heading (A3 double header gone)",
      [...w.document.querySelectorAll(".sx-dom-head")].filter(h => /Daily missions/.test(h.textContent)).length === 1
      && w.document.querySelectorAll(".sx-daily-stats .sx-daily-head").length === 0);
    core.profile.blitzDaily = null;   // (NIT#9) hygiene — the N9 section manages its own record
    shell.showMenu();
    // hygiene
    core.clock.now = realNow;
    delete core.profile.daily;
    dq.forEach(q => { delete core.profile.mastery[q.id]; });
    core.profile.achievements = {}; core.profile.streaks = {}; core.profile.streaksBest = {};
    core.profile.xp = 0; core.profile.rankSeen = 0;
    shell.showMenu();
  }

  // K7. Mastery-gated cosmetics (v0.57.0 unit 7)
  console.log("\nK7. Cosmetics (unlock predicate / picker / persistence / applied in ARM+KBB)");
  {
    const core = SN.core, C = SN.cosmetics;
    SN.achievements.LIST.forEach(d => { core.profile.achievements[d.id] = 1; });   // no surprise unlock XP
    ok("cosmetics API: 7 variants (standard + 5 domain-locked + 1 rank-locked) + threshold 0.5 + pure helpers",
      !!C && C.LIST.length === 7 && C.THRESHOLD === 0.5 && C.LIST[0].id === "standard" && C.LIST[0].domain === null
      && C.LIST.every(d => /^#[0-9A-F]{6}$/i.test(d.color)) && typeof C.unlocked === "function" && typeof C.resolve === "function");
    {
      const stats = { domains: [{ domain: "storage", masteredPct: 0.5 }, { domain: "vms", masteredPct: 0.49 }] };
      const aqua = C.LIST.find(d => d.id === "aqua-stream"), mantis = C.LIST.find(d => d.id === "mantis-wake");
      ok("unlock predicate: standard always; 0.50 unlocks; 0.49 does not; missing stats locks",
        C.unlocked(C.LIST[0], null) === true && C.unlocked(aqua, stats) === true
        && C.unlocked(mantis, stats) === false && C.unlocked(aqua, null) === false);
      ok("resolve: unlocked pick sticks; locked or unknown falls back to standard",
        C.resolve({ shipTrail: "aqua-stream" }, stats).id === "aqua-stream"
        && C.resolve({ shipTrail: "mantis-wake" }, stats).id === "standard"
        && C.resolve({ shipTrail: "nope" }, stats).id === "standard"
        && C.resolve(null, stats).id === "standard");
    }
    // unlock a REAL domain by mastering half its (smallest) bank slice, then pick it in Settings
    const st0 = core.questions.stats();
    const smallest = st0.domains.slice().sort((a, b) => a.total - b.total)[0];
    const domQs = core.questions.pool().filter(q => q.domain === smallest.domain);
    const need = Math.ceil(domQs.length * 0.5);
    const seededIds = [];
    for (let i = 0; i < need; i++) {
      core.profile.mastery[domQs[i].id] = { id: domQs[i].id, seen: 1, correct: 1, incorrect: 0, streak: 1, box: 4, lastSeen: core.clock.now() };
      seededIds.push(domQs[i].id);
    }
    const def = C.LIST.find(d => d.domain === smallest.domain);
    const chosen = def || C.LIST.find(d => d.domain === "storage");   // every LIST domain may not match the smallest — fall back to seeding storage
    if (!def) {
      // seed storage instead so a pickable variant is genuinely unlocked
      seededIds.forEach(id => delete core.profile.mastery[id]); seededIds.length = 0;
      const sQs = core.questions.pool().filter(q => q.domain === "storage");
      for (let i = 0; i < Math.ceil(sQs.length * 0.5); i++) {
        core.profile.mastery[sQs[i].id] = { id: sQs[i].id, seen: 1, correct: 1, incorrect: 0, streak: 1, box: 4, lastSeen: core.clock.now() };
        seededIds.push(sQs[i].id);
      }
    }
    ok("a real domain crosses the 50% mastery gate (" + chosen.domain + ")",
      C.unlocked(chosen, core.questions.stats()) === true);
    shell.showSettings();
    {
      const swatches = w.document.querySelectorAll(".sx-trail");
      const lockedN = w.document.querySelectorAll(".sx-trail.locked").length;
      ok("picker: 7 swatches; standard equipped by default; locked variants dimmed with a requirement",
        swatches.length === 7 && !!w.document.querySelector('.sx-trail.on[data-trail="standard"]')
        && lockedN >= 1 && /Master 50% of/.test(w.document.querySelector(".sx-trail.locked .sx-trail-req").textContent));
      const target = w.document.querySelector('.sx-trail[data-trail="' + chosen.id + '"]');
      ok("picker: the newly unlocked variant is selectable", !!target && !target.classList.contains("locked"));
      target.dispatchEvent(new w.Event("click", { bubbles: true }));
      ok("selection persists BOTH the id and the resolved hex",
        core.profile.settings.shipTrail === chosen.id && core.profile.settings.shipTrailColor === chosen.color
        && target.classList.contains("on"));
    }
    // applied in the live games (jsdom mount through the shell)
    shell.showMenu();
    delete SN.core.profile.saves; shell.enterGame("ARM");
    await wait(10);
    ok("ARM: the mounted palette carries the trail tint", shell.currentGameRoot.__armTest.palette().trail === chosen.color);
    shell.exitGame();
    delete SN.core.profile.saves; shell.enterGame("KBB");
    await wait(10);
    ok("KBB: the mounted view state carries the trail tint", w.KBB._test.state().trailColor === chosen.color);
    shell.exitGame();
    // fallback: with the cosmetic cleared, ARM returns to stock aqua
    delete core.profile.settings.shipTrail; delete core.profile.settings.shipTrailColor;
    delete SN.core.profile.saves; shell.enterGame("ARM");
    await wait(10);
    {
      const pal = shell.currentGameRoot.__armTest.palette();
      ok("ARM fallback: no cosmetic -> the thruster stays stock aqua", pal.trail === pal.aqua);
    }
    shell.exitGame();

    // (v0.65.0, Jason's ruling) EARNED FOREVER — pure latch, resolve honor, end-to-end decay
    {
      const p2 = { trailsUnlocked: {} };
      const statsUp = { domains: [{ domain: chosen.domain, masteredPct: 0.6 }] };
      const statsDown = { domains: [{ domain: chosen.domain, masteredPct: 0.1 }] };
      const newly = C.latch(p2, statsUp);
      ok("latch: records + returns the newly earned variant, idempotent on repeat",
        newly.length === 1 && newly[0] === chosen.id && !!p2.trailsUnlocked[chosen.id] && C.latch(p2, statsUp).length === 0);
      ok("earned forever: resolve keeps the pick after mastery DECAYS below threshold; never-earned still falls back",
        C.resolve({ shipTrail: chosen.id }, statsDown, p2).id === chosen.id
        && C.unlocked(chosen, statsDown, p2) === true
        && C.resolve({ shipTrail: chosen.id }, statsDown, null).id === "standard");
    }
    // end-to-end: the earlier showSettings latched the REAL profile; de-seed mastery — still offered
    seededIds.forEach(id => { delete core.profile.mastery[id]; });
    shell.showSettings();
    ok("picker end-to-end: after mastery de-seed the earned variant stays selectable (profile latch)",
      !!core.profile.trailsUnlocked[chosen.id]
      && !w.document.querySelector('.sx-trail[data-trail="' + chosen.id + '"]').classList.contains("locked"));

    // hygiene
    core.profile.trailsUnlocked = {};
    core.profile.achievements = {};
    shell.showMenu();
  }

  // V7. Flow#7 (v0.179.0): Commander ranks pay concrete cross-game rewards
  console.log("\nV7. Flow#7 rank rewards (table / perks math / rank-gated trail / ctx.perks / Codex ledger / crest / toast)");
  {
    const core = SN.core, X = SN.xp, C = SN.cosmetics;
    const saveXp = core.profile.xp, saveSeen = core.profile.rankSeen;
    ok("REWARDS table pinned: 4 additive rewards at Pilot / Lieutenant x2 / Commodore",
      Array.isArray(X.REWARDS) && X.REWARDS.length === 4
      && X.REWARDS.map(r => r.rank).join(",") === "3,4,4,8"
      && X.REWARDS[1].n === 25 && X.REWARDS[2].n === 1
      && X.REWARDS.every(r => typeof r.label === "string" && r.label.length > 3));
    {
      const p0 = X.perks(0), p3 = X.perks(800), p4 = X.perks(1400), p8 = X.perks(6800);
      ok("perks math: nothing at Recruit; crest at Pilot; +25 coins & +1 shield cell at Lieutenant; gold trail at Commodore",
        !p0.crest && p0.kbbCoins === 0 && p0.armShieldCell === 0 && !p0.goldTrail
        && p3.crest && p3.kbbCoins === 0 && p3.armShieldCell === 0
        && p4.crest && p4.kbbCoins === 25 && p4.armShieldCell === 1 && !p4.goldTrail
        && p8.goldTrail && p8.kbbCoins === 25 && p8.armShieldCell === 1);
    }
    ok("rewardsAt: Lieutenant lists exactly its two labels; Recruit none; Pilot names the crest",
      X.rewardsAt(4).length === 2 && X.rewardsAt(0).length === 0 && /crest/i.test(X.rewardsAt(3)[0]));
    const gold = C.LIST.find(d => d.id === "commodore-gold");
    ok("commodore-gold joined COSMETICS on a rank gate (rank 8, no domain)",
      !!gold && gold.rank === 8 && gold.domain === null);
    ok("rank unlock path: 6800 XP unlocks, 6799 does not, a latched profile stays unlocked at 0 XP",
      C.unlocked(gold, null, { xp: 6800 }) === true && C.unlocked(gold, null, { xp: 6799 }) === false
      && C.unlocked(gold, null, { xp: 0, trailsUnlocked: { "commodore-gold": 1 } }) === true
      && C.unlocked(gold, null, null) === false);
    {
      const pf = { xp: 6800, trailsUnlocked: {} };
      const newly = C.latch(pf, null);
      ok("latch: crossing Commodore latches the gold trail forever (idempotent)",
        newly.indexOf("commodore-gold") >= 0 && !!pf.trailsUnlocked["commodore-gold"]
        && C.latch(pf, null).indexOf("commodore-gold") === -1);
    }
    ok("resolve: a locked commodore-gold pick falls back to standard; unlocked sticks",
      C.resolve({ shipTrail: "commodore-gold" }, null, { xp: 100 }).id === "standard"
      && C.resolve({ shipTrail: "commodore-gold" }, null, { xp: 9600 }).id === "commodore-gold");
    core.profile.xp = 1400;
    {
      const cx = SN.makeContext("perks-probe");
      ok("makeContext snapshots ctx.perks from the profile's xp",
        !!cx.perks && cx.perks.kbbCoins === 25 && cx.perks.armShieldCell === 1 && cx.perks.crest === true);
    }
    // Codex ledger + crest chip (Pilot, already acknowledged — no toast side effects)
    core.profile.xp = 800; core.profile.rankSeen = 3;
    shell.showStats();
    {
      const rows = w.document.querySelectorAll(".sx-reward");
      const gotN = w.document.querySelectorAll(".sx-reward.got").length;
      ok("Codex rank-rewards ledger: 4 rows, exactly the Pilot reward earned at 800 XP",
        rows.length === 4 && gotN === 1 && /crest/i.test(w.document.querySelector(".sx-reward.got .sx-reward-label").textContent));
    }
    shell.showMenu();
    ok("the bridge rank strip wears the Pilot crest", !!w.document.querySelector(".sx-rank .sx-rank-crest"));
    // the promotion toast names what Lieutenant pays
    core.profile.xp = 1400; core.profile.rankSeen = 3; core.profile.settings.reducedMotion = false;
    shell.showMenu();
    {
      const t = [...w.document.querySelectorAll(".sx-toast")].pop();
      ok("the promotion toast names what Lieutenant pays",
        !!t && /Promoted: Lieutenant/.test(t.textContent) && /\+25 KBB starting coins/.test(t.textContent) && /Shield Cell/.test(t.textContent));
    }
    // picker: the rank variant states its requirement, then unlocks (and latches) by rank
    core.profile.xp = 800;
    shell.showSettings();
    ok("picker: commodore-gold locked at Pilot with a rank requirement (the 7th swatch)",
      w.document.querySelector('.sx-trail[data-trail="commodore-gold"]').classList.contains("locked")
      && /Reach Commodore rank/.test(w.document.querySelector('.sx-trail[data-trail="commodore-gold"] .sx-trail-req').textContent));
    core.profile.xp = 6800;
    shell.showSettings();
    ok("picker: at Commodore the gold trail is selectable and latched forever",
      !w.document.querySelector('.sx-trail[data-trail="commodore-gold"]').classList.contains("locked")
      && !!core.profile.trailsUnlocked["commodore-gold"]);
    // hygiene: state-neutral exit
    core.profile.xp = saveXp; core.profile.rankSeen = saveSeen;
    core.profile.trailsUnlocked = {};
    shell.showMenu();
  }

  // B7. Backend#7 (v0.183.0): telemetry is real — standardized answer events + pace aggregates
  console.log("\nB7. Backend#7 telemetry (answer event / qstats EMA / slow-signal drill + Codex feeds)");
  {
    const core = SN.core;
    const qA = core.questions.pool()[5], qB = core.questions.pool()[6];
    const snapB7 = JSON.stringify({ xp: core.profile.xp, rankSeen: core.profile.rankSeen,
      totals: core.profile.totals, daily: core.profile.daily || null,
      streaks: core.profile.streaks, streaksBest: core.profile.streaksBest,
      ach: core.profile.achievements,
      mA: core.profile.mastery[qA.id] || null, mB: core.profile.mastery[qB.id] || null });
    delete core.profile.qstats[qA.id]; delete core.profile.qstats[qB.id];
    const before = core.telemetry.events().filter(e => e.t === "answer").length;
    core.mastery.record(qA.id, true, { game: "PROBE", latencyMs: 4000, timerPct: 0.5, reason: "answered" });
    {
      const evts = core.telemetry.events().filter(e => e.t === "answer");
      const ev = evts[evts.length - 1];
      ok("B7: record() emits ONE standardized answer event {qid, game, correct, latencyMs, timerPct, reason}",
        evts.length === before + 1 && ev.qid === qA.id && ev.game === "PROBE" && ev.correct === true
        && ev.latencyMs === 4000 && ev.timerPct === 0.5 && ev.reason === "answered" && typeof ev.ts === "number");
    }
    const r1 = core.profile.qstats[qA.id];
    ok("B7: the first sample seeds the aggregates verbatim (n=1, lat=4000, pct=0.5)",
      !!r1 && r1.n === 1 && r1.lat === 4000 && r1.pct === 0.5);
    core.mastery.record(qA.id, false, { game: "PROBE", latencyMs: 8000, timerPct: 0.9, reason: "timeout" });
    {
      const r2 = core.profile.qstats[qA.id] || {};   // survives a dead aggregate: the pin fails, the suite reports
      const evts2 = core.telemetry.events().filter(e => e.t === "answer");
      ok("B7: EMA(0.3) rolls the aggregates — lat 4000→5200, pct 0.5→0.62 — and the timeout reason rides the event",
        r2.n === 2 && r2.lat === 5200 && Math.abs(r2.pct - 0.62) < 1e-9
        && evts2[evts2.length - 1].reason === "timeout");
    }
    core.mastery.record(qA.id, true, { game: "PROBE" });
    ok("B7: latency-less answers leave the aggregates untouched but still emit the event",
      core.profile.qstats[qA.id].n === 2
      && core.telemetry.events().filter(e => e.t === "answer").length === before + 3);
    // the drill feed: slow-but-correct outranks an EQUALLY-mastered fast card
    core.profile.mastery[qA.id] = { id: qA.id, seen: 5, correct: 5, incorrect: 0, streak: 3, box: 4, lastSeen: 1000 };
    core.profile.mastery[qB.id] = { id: qB.id, seen: 5, correct: 5, incorrect: 0, streak: 3, box: 4, lastSeen: 1000 };
    core.profile.qstats[qA.id] = { n: 3, lat: 30000, pct: 0.9 };   // slow
    core.profile.qstats[qB.id] = { n: 3, lat: 3000, pct: 0.1 };    // fast
    /* (v2.49.0) The slow-signal drill and the Codex pace line both read through
     * shell._weakestQuestions, which went with the exam in d4892dd. The MEASUREMENT that
     * fed them is still taken on every answer, and that is what is checked above and
     * below — the telemetry is live even though the surface that consumed it is not. */
    ok("B7: the slow-signal drill surface really is gone, not half-wired",
      typeof shell._weakestQuestions !== "function"
      && !/sx-ready-pace/.test(w.document.documentElement.innerHTML));
    shell.showMenu();
    // wiring: the three GAME surfaces pass latency through the choke point (source)
    ok("B7: all three game surfaces pass latency into mastery.record (source wiring)",
      html.includes("game: 'CC', latencyMs: ms") && html.includes("latencyMs: (answerMs == null ? null : answerMs)")
      && html.includes('safeRecord(q.id, lastCorrect, { latencyMs: ms'));
    // hygiene: state-neutral exit
    {
      const sv = JSON.parse(snapB7);
      core.profile.xp = sv.xp; core.profile.rankSeen = sv.rankSeen; core.profile.totals = sv.totals;
      if (sv.daily) core.profile.daily = sv.daily;
      core.profile.streaks = sv.streaks; core.profile.streaksBest = sv.streaksBest;
      core.profile.achievements = sv.ach;
      if (sv.mA) core.profile.mastery[qA.id] = sv.mA; else delete core.profile.mastery[qA.id];
      if (sv.mB) core.profile.mastery[qB.id] = sv.mB; else delete core.profile.mastery[qB.id];
      delete core.profile.qstats[qA.id]; delete core.profile.qstats[qB.id];
      shell.showMenu();
    }
  }

  // B8. Backend#8 (v0.191.0): tuning knobs + the (quarantine-honoring) domain-weight seam
  console.log("\nB8. Backend#8 tuning (pinned defaults / live apply + reset / dev-gated set / domain-weight seam)");
  {
    const TU = SN.tuning, core = SN.core;
    ok("B8: DEFAULTS pinned — Leitner intervals, selection weights, mastered box, timer table",
      !!TU && TU.DEFAULTS.intervals.join(",") === "0,30000,120000,600000,3600000,21600000,86400000,259200000,604800000"
      && TU.DEFAULTS.w.due === 6 && TU.DEFAULTS.w["new"] === 3 && TU.DEFAULTS.w.reinforce === 1 && TU.DEFAULTS.w.epsilon === 0.12
      && TU.DEFAULTS.masteredBucket === 4
      && TU.DEFAULTS.timer.BASE === 6 && TU.DEFAULTS.timer.MAX === 45 && TU.DEFAULTS.timer.EXTRA_FACTOR === 1.6);
    ok("B8: the live config boots AT defaults", JSON.stringify(TU.current()) === JSON.stringify(TU.DEFAULTS));
    // live apply: the timer table is consulted at call time
    const qT8 = core.questions.pool()[0];
    const t0 = core.questions.timerSeconds(qT8, {});
    TU.apply({ timer: { MIN: 44, MAX: 44 } });
    ok("B8: apply() bites immediately — a clamped timer window pins every question to 44s",
      core.questions.timerSeconds(qT8, {}) === 44 && t0 !== 44);
    TU.reset();
    ok("B8: reset() restores the pinned defaults", core.questions.timerSeconds(qT8, {}) === t0
      && JSON.stringify(TU.current()) === JSON.stringify(TU.DEFAULTS));
    // dev gating
    ok("B8: set() refuses outside dev mode", TU.set({ masteredBucket: 2 }).ok === false && TU.current().masteredBucket === 4);
    w.STARNIX_DEV = true;
    const setR = TU.set({ masteredBucket: 2 });
    ok("B8: dev-mode set() applies AND persists profile.tuning",
      setR.ok === true && TU.current().masteredBucket === 2 && core.profile.tuning && core.profile.tuning.masteredBucket === 2);
    TU.reset(); delete w.STARNIX_DEV;
    ok("B8: reset clears the persisted override", !core.profile.tuning && TU.current().masteredBucket === 4);
    ok("B8: the boot hook re-applies a persisted override (source)", html.includes("if (profile.tuning) { try { applyTuning(profile.tuning); }"));
    // the domain-weight seam: inert by default, decisive when set, quarantine-honoring
    {
      const dom0 = core.questions.stats().domains.find(dd => dd.total >= 5).domain;
      const wts = {}; wts[dom0] = 1e6;
      core.questions.setDomainWeights(wts);
      const seen8 = [], ex8 = [];
      for (let d8 = 0; d8 < 5; d8++) {
        const r8 = core.questions.next({ excludeIds: ex8 });
        if (!r8 || !r8.question) break;
        seen8.push(r8.question.domain); ex8.push(r8.question.id);
      }
      core.questions.setDomainWeights(null);
      ok("B8: the domain-weight seam is decisive when set (5 of 5 draws from the boosted domain) and null = uniform (Flow#5 quarantine holds)",
        seen8.length === 5 && seen8.every(dn => dn === dom0));
    }
  }

  /* N9. The Daily gauntlet (v0.196.0) — one seeded 10-question Blitz per day.
   * (v2.49.0) A Blitz was an exam mode, drawn and scored by exam.js and launched from the
   * exam setup rail. All three went in d4892dd. What matters now is that nothing is left
   * offering it: a daily mission nobody can complete is worse than one that is not there. */
  {
    const D9 = SN.daily;
    ok("no gauntlet daily mission is rolled any more (it could never be completed)",
      !D9.TEMPLATES.some((t) => t.id === "gauntlet"));
    ok("nothing in the build still writes a blitzDaily record",
      !/blitzDaily\s*=/.test(w.document.documentElement.innerHTML));
    ok("the gauntlet draw and its setup tile are gone from the shell",
      typeof shell._gauntletQuestions !== "function"
      && !/sx-exam-len-gauntlet/.test(w.document.documentElement.innerHTML));
    shell.showMenu();
  }

  // B10. Backend#10 (v0.205.0): the Math.random allowlist — 01 §13 determinism, statically
  // enforced. Any NEW Math.random line in any module goes red here; the allowed lines are
  // comments, documented cosmetic-only effects (ARM debris/shake, KBB backdrop), and the
  // exam module's rng-argument default. Gameplay randomness rides ctx.rng, always.
  {
    const fsMod = await import("node:fs");
    // (v2.49.0) exam.js was deleted in d4892dd; its 2 allowed lines went with it.
    /* (v2.49.0) Re-baselined to CALL SITES, now that comments no longer count: the core
     * has zero (it was allowed one, which was a comment), and ARM has three. Both numbers
     * are tighter than the ones they replace. */
    const RAND_ALLOW = { "starnix-core.js": 0, "starnix-shell.js": 0, "audio.js": 2, "arm.js": 3, "cc.js": 0, "kbb.js": 5, "questions.js": 0, "assets.js": 0 };
    const drift = [];
    for (const fRA in RAND_ALLOW) {
      const srcRA = fsMod.readFileSync(new URL("./" + fRA, import.meta.url), "utf8");
      // (v2.49.0) count CALL SITES, not mentions. The allowlist was drifting on comments
      // that merely say "Math.random" — audio.js read 5 against an allowed 2, all three of
      // the extras being lines explaining why the code does NOT use it. A rule that goes
      // red when someone documents the rule is a rule nobody keeps.
      const nRA = srcRA.split("\n")
        .filter((l) => l.indexOf("Math.random") >= 0 && !/^\s*(\/\/|\*|\/\*)/.test(l)).length;
      if (nRA !== RAND_ALLOW[fRA]) drift.push(fRA + ": " + nRA + " (allowed " + RAND_ALLOW[fRA] + ")");
    }
    ok("B10: Math.random stays on the allowlist (new call sites in gameplay paths go red)" + (drift.length ? " — DRIFT: " + drift.join(", ") : ""),
      drift.length === 0);
  }

  /* F10 (v0.204.0) — the certification finale — and N10 (v0.203.0) — the 'why I missed
   * this' memos — lived here.
   *
   * (v2.49.0) The finale fired on station 60 PLUS two exam sims at 80%+. With the exam
   * gone in d4892dd the second condition became unsatisfiable, and the finale, the
   * certificate and the Codex replay were removed with it — the shell has no
   * profile.certified and no .sx-cert. The memos were written and re-read on the exam's
   * graded card and drilled from its setup rail, all three of which went too.
   *
   * What is checked instead is that neither left a stub behind: an ending nobody can
   * reach, or a note nobody can write, is worse than one that was never there. */
  {
    const pF = SN.core.profile;
    ok("F10: nothing latches a certification that can no longer be earned",
      !("certified" in pF) && !/profile\.certified/.test(w.document.documentElement.innerHTML));
    ok("F10: no certificate or replay surface is left in the build",
      !/sx-cert-replay|sx-cert-note/.test(w.document.documentElement.innerHTML));
    ok("N10: no memo surface is left in the build",
      !/sx-note-toggle|sx-note-save|sx-note-prev/.test(w.document.documentElement.innerHTML));
    ok("F10/N10: the station meter itself survives — it feeds the bridge, not the ending",
      typeof pF.station === "number");
    shell.showMenu();
  }

  // M10. Menu#10 (v0.199.0): dock reset countdown + the claimable badge
  {
    const realNow10 = SN.core.clock.now;
    SN.core.clock.now = () => new Date("2026-07-05T21:30:00").getTime();   // 2h30m to local midnight
    delete SN.core.profile.daily;
    SN.daily.ensure(SN.core.profile);
    SN.core.profile.daily.correct = 99; SN.core.profile.daily.byGame = { ARM: 99, KBB: 99, CC: 99, EXAM: 99 };
    SN.core.profile.daily.bestStreak = 99; SN.core.profile.daily.exams = 99; SN.core.profile.daily.promotions = 99;
    SN.core.profile.blitzDaily = { last: SN.core.profile.daily.date, streak: 1, best: 1, pts: 1, pct: 1 };
    shell.showMenu();
    {
      const rst = w.document.querySelector(".sx-dock-reset");
      const badge = w.document.querySelector(".sx-dock-claimbadge");
      // expected countdown computed by the same local-midnight math the shell uses
      const nowE = SN.core.clock.now(); const midE = new Date(nowE); midE.setHours(24, 0, 0, 0);
      const remE = midE.getTime() - nowE;
      const expTxt = "resets in " + Math.floor(remE / 3600000) + "h " + (Math.floor((remE % 3600000) / 60000) < 10 ? "0" : "") + Math.floor((remE % 3600000) / 60000) + "m";
      ok("Menu#10: the dock shows the local-midnight reset countdown", !!rst && rst.textContent === expTxt);
      ok("Menu#10: three done-but-unclaimed missions raise a gold 3-badge", !!badge && badge.textContent === "3");
    }
    SN.daily.claim(SN.core.profile, 0);
    shell.showMenu();
    ok("Menu#10: claiming one drops the badge to 2", (w.document.querySelector(".sx-dock-claimbadge") || {}).textContent === "2");
    // hygiene
    SN.core.profile.blitzDaily = null;
    SN.core.clock.now = realNow10;
    delete SN.core.profile.daily;
    SN.daily.ensure(SN.core.profile);
    shell.showMenu();
  }

  // F9. Flow#9 (v0.195.0): first-run order ribbons + the 3-step bridge tour
  {
    const p9 = SN.core.profile;
    const save9 = { onboarded: p9.onboarded, seen: p9.totals.questionsSeen };
    p9.onboarded = false; p9.totals.questionsSeen = 7;
    shell.showMenu();
    const ribs = [...w.document.querySelectorAll(".sx-strip-ribbon")].map(r => r.textContent);
    // (v2.49.0) four -> three: the fourth ribbon was the NIT exam tile, gone in d4892dd.
    ok("Flow#9: three order ribbons — ARM leads, then CC, then KBB",
      ribs.length === 3 && /START HERE/.test(ribs[0]) && /THEN/.test(ribs[1]) && /THEN/.test(ribs[2]));
    ok("Flow#9: the tour opens on step 1 highlighting the rank strip",
      !!w.document.querySelector(".sx-tour") && /Step 1 of 3/.test(w.document.querySelector(".sx-tour-name").textContent)
      && w.document.querySelector(".sx-rank").classList.contains("sx-tour-hi"));
    w.document.querySelector(".sx-tour-next").dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("Flow#9: step 2 moves the highlight to the daily dock",
      /Step 2 of 3/.test(w.document.querySelector(".sx-tour-name").textContent)
      && w.document.querySelector(".sx-bridge-dock").classList.contains("sx-tour-hi")
      && !w.document.querySelector(".sx-rank").classList.contains("sx-tour-hi"));
    w.document.querySelector(".sx-tour-next").dispatchEvent(new w.Event("click", { bubbles: true }));
    w.document.querySelector(".sx-tour-next").dispatchEvent(new w.Event("click", { bubbles: true }));
    ok("Flow#9: Done latches profile.onboarded", p9.onboarded === true);
    shell.showMenu();
    ok("Flow#9: an onboarded bridge shows no ribbons and no tour",
      w.document.querySelectorAll(".sx-strip-ribbon").length === 0 && !w.document.querySelector(".sx-tour"));
    ok("Flow#9: veterans migrate as already-onboarded (source)",
      html.includes("p.onboarded = !!(p.totals && p.totals.questionsSeen > 0);"));
    p9.onboarded = true; p9.totals.questionsSeen = save9.seen;
    shell.showMenu();
  }

  /* NIT#8 (v0.190.0): domain-targeted study — clickable heatmap tiles + the setup lens.
   * (v2.49.0) Both LAUNCHED the exam scoped to a domain, and the exam went in d4892dd.
   * The heatmap itself survives as the Codex readout and is checked in K3 above; what is
   * checked here is that the tiles no longer promise a launch they cannot deliver. */
  {
    const st8 = SN.core.questions.stats();
    shell.showStats();
    ok("NIT#8: the heatmap still reports every domain (" + st8.domains.length + ")",
      w.document.querySelectorAll(".sx-heat").length === st8.domains.length);
    ok("NIT#8: no heatmap tile offers a launch that no longer exists",
      w.document.querySelectorAll("button.sx-heat").length === 0);
    ok("NIT#8: the exam-setup domain lens is gone with the station it sat on",
      !/sx-domlens-chip|sx-domlens-head/.test(w.document.documentElement.innerHTML));
    shell.showMenu(); await wait(20);
  }

  // CC#8 (v0.185.0): the shelf buff boards a FRESH launch through the real mount, then empties
  {
    SN.core.profile.ccShelf = "overshield";
    delete SN.core.profile.saves;
    SN.core.persistence.save(SN.core.profile); SN.core.persistence.flush();   // the mount load() reads STORAGE
    shell.enterGame("CC");
    await wait(30);
    const simSh = SN.getGame("CC")._sim();
    ok("CC#8: the shelf overshield boards the fresh run and the slot empties",
      !!simSh && simSh.overshield === 1 && !SN.core.profile.ccShelf);
    shell.exitGame();
    shell.showMenu();
  }

  // V8f. Flow#8 (v0.186.0): the persistent station meter — mastery-fed, latched forever
  console.log("\nV8f. Flow#8 persistent station (choke-point feed / latch / bridge strip + vista)");
  {
    const core = SN.core;
    const pool = core.questions.pool();
    const snapV8 = JSON.stringify({ st: core.profile.station | 0, xp: core.profile.xp, rankSeen: core.profile.rankSeen,
      totals: core.profile.totals, daily: core.profile.daily || null, streaks: core.profile.streaks,
      streaksBest: core.profile.streaksBest, ach: core.profile.achievements });
    const qV8 = pool.find(q => !core.profile.mastery[q.id] || core.profile.mastery[q.id].box < 4);
    const mSnap = core.profile.mastery[qV8.id] ? JSON.stringify(core.profile.mastery[qV8.id]) : null;
    // stage the card one rung below mastered, long overdue, then promote it through the REAL choke point
    core.profile.mastery[qV8.id] = { id: qV8.id, seen: 3, correct: 3, incorrect: 0, streak: 3, box: 3, lastSeen: 1 };
    let m0 = 0; for (const k in core.profile.mastery) if (core.profile.mastery[k].box >= 4) m0++;
    core.profile.station = 0;                                  // sharp: the promotion alone must set it
    core.mastery.record(qV8.id, true, { game: "PROBE" });
    const expSt = Math.min(60, Math.floor((m0 + 1) / pool.length * 60));
    ok("Flow#8: a promotion into mastered advances the station meter (floor(mastered/bank*60))",
      core.profile.mastery[qV8.id].box === 4 && core.profile.station === expSt);
    // the latch: pre-set the meter HIGH — one demotion recomputes low, and only the latch holds 59
    core.profile.station = 59;
    core.mastery.record(qV8.id, false, { game: "PROBE" });
    ok("Flow#8: the latch holds — mastery decay never un-builds a module",
      core.profile.mastery[qV8.id].box === 3 && core.profile.station === 59);
    // bridge: the ARM strip stat + the vista read the PROFILE meter
    core.profile.station = 33;
    shell.showMenu();
    {
      const vista = w.document.querySelector(".sx-station-vista");
      const armStat = [...w.document.querySelectorAll(".sx-strip")].map(n => n.textContent).find(t => /Station/.test(t)) || "";
      ok("Flow#8: the bridge strip reads the persistent meter (33/60) and the vista lights 7 of 12 segments",
        /33\/60/.test(armStat) && !!vista && vista.getAttribute("data-lit") === "7");
    }
    ok("Flow#8: migrate-repair defaults the meter (source)", html.includes('p.station = 0;   // (v0.186.0, Flow#8)'));
    // hygiene
    {
      const sv = JSON.parse(snapV8);
      core.profile.station = sv.st; core.profile.xp = sv.xp; core.profile.rankSeen = sv.rankSeen;
      core.profile.totals = sv.totals; if (sv.daily) core.profile.daily = sv.daily;
      core.profile.streaks = sv.streaks; core.profile.streaksBest = sv.streaksBest; core.profile.achievements = sv.ach;
      if (mSnap) core.profile.mastery[qV8.id] = JSON.parse(mSnap); else delete core.profile.mastery[qV8.id];
      delete core.profile.qstats[qV8.id];
      shell.showMenu();
    }
  }

  // J9 (v0.73.0): the CC Garage — module-side source pins (the engine behavior is cc-run's 38)
  console.log("\nJ9. CC Garage source pins (banking + HUD + panel ship in the build)");
  {
    ok("J9: run-end banking + Garage UI + HUD cell counter are in the build",
      html.includes("prof.ccCells = (prof.ccCells | 0) + banked") && html.includes("cc-garage")
      && html.includes("cc-cells") && html.includes("Garage \\u25B8"));
    ok("J9: upgrades load from the profile into the live sim",
      html.includes("if (prof.ccUpgrades) sim.applyUpgrades(prof.ccUpgrades)"));
  }

  // JB4 (v0.77.0): the CC crash screen says so + surfaces the Garage
  console.log("\nJB4. CC crash screen source pins");
  ok("C4/C10 (v0.104.0): turn banner + barrel roll shipped",
    html.includes("cc-turn-banner") && html.includes("startBarrelRoll"));
  /* (v2.49.0) TURN_KM was pinned at 34 and is 36. Pinning the number caught the retune
   * but said nothing about why it happened: a 90-degree corner must never land ON a
   * question gate. That is the rule, so that is what is checked — it survives the next
   * retune and fails the ones that matter. */
  {
    const turnKm = Number((html.match(/TURN_KM:\s*(\d+)/) || [])[1]);
    const gateKm = Number((html.match(/GATE_KM:\s*(\d+)/) || [])[1]);
    const firstGate = Number((html.match(/FIRST_GATE_KM:\s*(\d+)/) || [])[1]) || 3;
    let collide = 0;
    for (let t = 1; t <= 200; t++) {
      const turnAt = turnKm * t + 5;                       // +5 km offset, set at mount
      if ((turnAt - firstGate) % gateKm === 0) collide++;   // a corner ON a gate
    }
    ok("C4: no corner in 200 turns lands on a question gate (TURN_KM " + turnKm + ", GATE_KM " + gateKm + ")", collide === 0, collide + " collisions");
  }
  ok("C7 (v0.103.0): Boost Mode overlay shipped (haze veil + banner + reduced-motion opt-out)",
    html.includes("cc-boost-ovr") && html.includes("BOOST MODE") && html.includes("ccBoostPulse"));
  ok("JB4: game over says SHIP DOWN and auto-opens the Garage",
    html.includes("SHIP DOWN") && html.includes("refit is part of the death loop"));

  // P2·3 (v0.63.0): PLAYTEST A4–A6 cleanup — source pins (layout geometry is jsdom-invisible;
  // the Playwright evidence shots are the visual proof, these guard the regressions).
  console.log("\nP2. PLAYTEST cleanup pins (A4 CC hud row / A5 ARM gear backdrop / A6 KBB full-bleed cine)");
  {
    ok("A4: CC replay chip lives on its own row below the readout",
      html.includes(".cc-replay{pointer-events:auto;position:absolute;top:44px"));
    ok("A5: ARM gear button carries a near-opaque backdrop (world markers read as UNDER it)",
      html.includes("background:rgba(10,10,17,.92)"));
    ok("A6: KBB is-cine spans the full grid (abs-pos grid items resolve inset against their AREA)",
      html.includes("grid-column:1 / -1;grid-row:1 / -1;}"));
  }

  SN.core.audio = realAudio;

  console.log("\nTotal frame errors across all games: " + frameErrors.length);
  console.log("--------------------------------------------------");
  console.log("PASSED " + pass + " / " + (pass + fail));
  if (fail) { console.log("FAILED: " + fails.join(" | ")); process.exit(1); }
  console.log("ALL GREEN");
  process.exit(0);
})().catch((e) => { console.log("\nVERIFY CRASHED:", e && e.stack ? e.stack : e); process.exit(2); });
