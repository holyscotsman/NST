/* Assemble the single-file StarNix build (index.html) for Google Apps Script.
 * Order matters:
 *   1. core   — defines StarNix, registerGame/registerAudio, initCore, makeContext, NoopAudio
 *   2. shell  — boot/title/cinematic/menu, strict mount/unmount
 *   3. audio  — installs StarNix.core.audio (real Web-Audio engine, 5 tracks)
 *   4. arm    — registers ARM
 *   5. cc     — registers CC (reads window.THREE; graceful fallback if absent)
 *   6. kbb    — registers KBB (Kuiper Belt Battle)
 *   7. boot   — StarNix.boot(#app)
 * Three.js (UMD global) is VENDORED (vendor/three-r128.min.js) and inlined — zero runtime
 * CDN dependencies (v0.158.0, V1.1 Backend#5). Montserrat ships as an inlined variable-font
 * subset (vendor/montserrat.css). Both are sha256-pinned: a drifted vendor file FAILS the build.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const THREE_SHA = "9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2";   // three.js r128 (cdnjs copy, vendored 2026-07-11)
const FONT_SHA = "ec10c02708feb2fb7f960556652b732d529e30bf14c5dd59e790aacd65f5d5c7";    // Montserrat latin variable subset (OFL)
function vendored(rel, sha, label) {
  const buf = readFileSync(new URL(rel, import.meta.url));
  const got = createHash("sha256").update(buf).digest("hex");
  if (got !== sha) {
    // A CRLF checkout (git's core.autocrlf, on by default in Git for Windows)
    // changes these bytes and so their digest. That is a line-ending problem, not
    // a tampered dependency -- say which, because "drifted" reads like a supply
    // chain alarm. Still fail: silently normalising would defeat the pin.
    const asLf = createHash("sha256").update(buf.toString("utf8").replace(/\r\n/g, "\n")).digest("hex");
    if (asLf === sha) {
      console.error("BUILD FAIL: " + label + " has CRLF line endings, so its bytes no longer match the pin.");
      console.error("  The file itself is intact -- git rewrote it on checkout (core.autocrlf).");
      console.error("  Fix: the repo ships a .gitattributes with '* -text'. Re-clone, or run:");
      console.error("      git rm --cached -r . && git reset --hard");
      process.exit(1);
    }
    console.error("BUILD FAIL: " + label + " drifted (sha256 " + got + " != pinned " + sha + ")");
    process.exit(1);
  }
  return buf.toString("utf8");
}
const threeSrc = vendored("./vendor/three-r128.min.js", THREE_SHA, "vendor/three-r128.min.js");
const fontCss = vendored("./vendor/montserrat.css", FONT_SHA, "vendor/montserrat.css");

// The question bank is NO LONGER inlined: StarNix is a bank-agnostic engine and
// loads Markdown banks at runtime from /banks/ (shared/bank-loader.js, added to the
// <head> below). questions.js stays on disk as the lint/test fixture only.
const modules = [
  ["starnix-core.js", "core"],
  ["assets.js", "assets"],
  ["starnix-shell.js", "shell"],
  ["audio.js", "audio"],
  ["arm.js", "arm"],
  ["cc.js", "cc"],
  ["kbb.js", "kbb"]
];

function read(p) { return readFileSync(new URL("./" + p, import.meta.url), "utf8"); }
// Defuse any literal </script> so an inline block can't be closed early.
function safe(s) { return s.replace(/<\/script>/gi, "<\\/script>"); }

const sizeLedger = {};   // (v0.166.0, V1.1 Backend#6) per-module bytes — printed + budget-gated
// (v0.198.0, V1.1 FE#9) ship power-on: each module block is preceded by a one-line status
// script, so the splash shows REAL inter-module parse progress — zero framework.
const BOOT_MSGS = {
  core: "Initializing core systems\u2026",
  questions: "Loading the question bank\u2026",
  assets: "Decoding ship art\u2026",
  shell: "Powering up the bridge\u2026",
  audio: "Warming the synth racks\u2026",
  arm: "Fueling the rescue wing\u2026",
  cc: "Spinning up the chasm\u2026",
  kbb: "Charting the Kuiper Belt\u2026"
};
const blocks = modules.map(([file, name]) => {
  const src = safe(read(file));
  sizeLedger[name] = Buffer.byteLength(src, "utf8");
  const msg = BOOT_MSGS[name] || ("Loading " + name + "\u2026");
  return `<script>window.__sxBoot && __sxBoot(${JSON.stringify(msg)});</script>\n<!-- ===== ${name} (${file}) ===== -->\n<script>\n${src}\n</script>`;
}).join("\n\n");

// Exam questions render their exhibit from this map; absent keys fall back to a pending note.
/* (v2.51.0) The exhibit-inlining block lived here. It read every file in
 * exhibit-images/ (34 files, 3.2 MB) on every build and inlined none of them: the
 * reference set it filtered against came from questions.js, the compiled bank that
 * stopped being built into the page when StarNix became bank-agnostic. It emitted an
 * empty window.STARNIX_EXHIBITS that nothing read.
 *
 * Exhibits belong to the bank now — banks/<id>/images/, resolved at runtime by
 * shared/bank-loader.js into q.imageSrc — and StarNix's games filter exhibit questions
 * out entirely, so it has nothing to inline even in principle. exhibit-check.mjs holds
 * the invariant from the other side. */
const exhibits = { n: 0, html: "" };


const boot = `<!-- ===== boot ===== -->
<script>
(function () {
  "use strict";
  function fail(msg) {
    var bsF = document.getElementById("sx-boot");
    if (bsF && bsF.parentNode) bsF.parentNode.removeChild(bsF);   // (v0.198.0, FE#9) never hang on the splash
    var app = document.getElementById("app");
    if (app) {
      app.textContent = "";
      var d = document.createElement("div");
      d.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;color:#FF6B5B;font:600 15px Montserrat,Arial,sans-serif;text-align:center";
      d.textContent = "StarNix failed to start — " + msg;
      app.appendChild(d);
    }
    if (window.console) console.error("StarNix boot error:", msg);
  }
  function launch() {
    Promise.resolve(window.StarNix.boot(document.getElementById("app"), {})).then(function () {
      var bs2 = document.getElementById("sx-boot");                 // (v0.198.0, FE#9) the shell has the bridge
      if (bs2 && bs2.parentNode) bs2.parentNode.removeChild(bs2);
    }).catch(function (e) {
      fail((e && e.message) || String(e));
    });
  }
  function start() {
    try {
      if (!window.StarNix || typeof window.StarNix.boot !== "function") return fail("core/shell not loaded");
      // Load the active runtime bank (if any) into window.STARNIX_QUESTIONS before the core
      // reads it. No bank selected -> resolves null -> the engine boots with an empty pool and
      // the shell shows its "no question bank" state. A load failure never blocks boot.
      if (window.NSTBank && typeof window.NSTBank.load === "function") {
        window.NSTBank.load().then(function (bank) {
          if (bank && bank.questions && bank.questions.length) {
            try { window.STARNIX_QUESTIONS = window.NSTBank.toStarNix(bank); } catch (eB) {}
            return;
          }
          // (v2.48.0) load() resolves-with-nothing when the MANIFEST is what failed, so
          // the resolved path has to ask the loader whether that is why.
          if (window.NSTBank.manifestError && window.NSTBank.manifestError()) window.STARNIX_BANK_ERROR = "manifest";
        }).catch(function () { window.STARNIX_BANK_ERROR = "bank"; }).then(launch);
      } else { launch(); }
    } catch (e) { fail((e && e.message) || String(e)); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
</script>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#07070e" />
<!-- (v2.2.1) CSP: a single-file app needs 'unsafe-inline' for its own script/style,
     but every external vector (fetch beyond same-origin banks, embeds, base hijack)
     is denied. frame-ancestors is header-only, so it cannot be set from here. -->
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src data:; media-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
<meta name="description" content="StarNix — three arcade study games (ARM, Chasm Chase, Kuiper Belt Battle) where Nutanix exam questions are the ammunition." />
<meta property="og:type" content="website" />
<meta property="og:title" content="StarNix — Starlight Rescue Crew" />
<meta property="og:description" content="Three arcade study games where Nutanix exam questions are the ammunition." />
<meta property="og:site_name" content="Nutanix Study Tool" />
<!-- (QA) inline favicon: without one the browser requests /favicon.ico and 404s -->
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD24A'%3E%3Cpath d='M12 2l2.6 6.9L22 9.3l-5.4 4.6 1.8 7.1L12 17l-6.4 4 1.8-7.1L2 9.3l7.4-.4z'/%3E%3C/svg%3E" />
<title>StarNix — Starlight Rescue Crew</title>
<style>/* ===== Montserrat, vendored (no fonts CDN) ===== */
${fontCss}</style>
<!-- Three.js r128 (UMD global window.THREE), VENDORED — no runtime CDN -->
<script>${threeSrc}</script>
<!-- NST runtime question-bank engine. External (not inlined) so bank-loader.js can resolve
     the repo root from its own script URL, then fetch Markdown banks from /banks/ at runtime. -->
<script src="../shared/bank-parser.js"></script>
<script src="../shared/bank-loader.js"></script>
<!-- (v2.7.0) the shared per-question mastery store. Loaded BEFORE the inlined core,
     which reads window.NSTMastery at init to point profile.mastery at it. -->
<script src="../shared/nst-mastery.js"></script>
<!-- Account sync: active only when served from the app server. -->
<script src="../shared/nst-sync.js"></script>
<style>
  html, body { margin: 0; height: 100%; background: #07070e; color: #F2F2F7;
    font-family: 'Montserrat', Arial, sans-serif; overflow: hidden; }
  #app { position: fixed; inset: 0; }
  /* (v0.198.0, V1.1 FE#9) ship power-on splash — real inter-module progress, removed by boot */
  #sx-boot { position: fixed; inset: 0; z-index: 999; background: #07070e; display: flex;
    flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
  #sx-boot .sxb-crest svg { width: 54px; height: 60px; animation: sxbSpin 2.6s linear infinite; }
  #sx-boot .sxb-title { font-size: 12px; font-weight: 800; letter-spacing: .3em; color: #AC9BFD; }
  #sx-boot .sxb-status { font-size: 13px; color: #6d6d80; letter-spacing: .04em; min-height: 18px; }
  #sx-boot .sxb-bar { width: min(300px, 60vw); height: 3px; border-radius: 3px; background: #1c1c2c; overflow: hidden; }
  #sx-boot .sxb-bar i { display: block; height: 100%; width: 0%; background: linear-gradient(90deg, #7855FA, #1FDDE9); transition: width .18s ease; }
  @keyframes sxbSpin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { #sx-boot .sxb-crest svg { animation: none; } }
</style>
</head>
<body>
<div id="app"></div>
<div id="sx-boot" aria-hidden="true">
  <div class="sxb-crest"><svg viewBox="0 0 60 66"><polygon points="30,2 57,17 57,49 30,64 3,49 3,17" fill="none" stroke="#1FDDE9" stroke-width="2.5"/></svg></div>
  <div class="sxb-title">NX-SRC \u00b7 STARNIX</div>
  <div class="sxb-status" id="sx-boot-status">Ship power-on\u2026</div>
  <div class="sxb-bar"><i id="sx-boot-bar"></i></div>
</div>
<script>
/* (v0.198.0, FE#9) the splash stepper + a pre-shell parse-fault trap (the shell's own error
   ring takes over the moment it exists). */
window.__sxBoot = (function () {
  var n = 0, total = ${modules.length + 1};
  return function (msg) {
    try {
      var elS = document.getElementById("sx-boot-status"), barS = document.getElementById("sx-boot-bar");
      n++;
      if (elS) elS.textContent = msg;
      if (barS) barS.style.width = Math.min(100, Math.round(n / total * 100)) + "%";
    } catch (eS) {}
  };
})();
window.addEventListener("error", function (ev) {
  try {
    if (window.StarNix && window.StarNix.shell) return;
    var elE = document.getElementById("sx-boot-status");
    if (elE) { elE.textContent = "Boot fault: " + ((ev && ev.message) || "script error"); elE.style.color = "#FF6B5B"; }
  } catch (eE) {}
});
</script>

${exhibits.html}

${blocks}

${boot}
</body>
</html>
`;

writeFileSync(new URL("./index.html", import.meta.url), html, "utf8");
const bytes = Buffer.byteLength(html, "utf8");
// (v0.166.0, V1.1 Backend#6) the size report: per-module bytes + gzip total, persisted for
// the gate. The bundle 5x'd from ~1.3MB with nobody watching — now a bloated drop goes red.
sizeLedger.exhibits = Buffer.byteLength(exhibits.html, "utf8");
sizeLedger.three = Buffer.byteLength(threeSrc, "utf8");
sizeLedger.font = Buffer.byteLength(fontCss, "utf8");
sizeLedger.total = bytes;
{
  const gz = (await import("node:zlib")).gzipSync(html).length;
  sizeLedger.gzip = gz;
  const rows = Object.keys(sizeLedger).filter((k) => k !== "total" && k !== "gzip")
    .sort((a, b) => sizeLedger[b] - sizeLedger[a]);
  console.log("---- size report (KB) ----");
  for (const k of rows) console.log("  " + k.padEnd(10) + (sizeLedger[k] / 1024).toFixed(1).padStart(9));
  console.log("  " + "TOTAL".padEnd(10) + (bytes / 1024).toFixed(1).padStart(9) + "   gzip " + (gz / 1024).toFixed(1));
  writeFileSync(new URL("./build-size.json", import.meta.url), JSON.stringify(sizeLedger, null, 2));
  // (QA) hard size budget — the report above is informational; THIS is the gate.
  // Current build is ~4352 KB (2489 gzip); the budget leaves ~6% headroom for
  // normal feature work while catching an accidental asset/vendor drop going red.
  const BUDGET_KB = 4600;
  if (bytes > BUDGET_KB * 1024) {
    console.error("BUILD FAIL: bundle " + (bytes / 1024).toFixed(1) + " KB exceeds the " + BUDGET_KB + " KB budget — trim or consciously raise BUDGET_KB.");
    process.exit(1);
  }
}
console.log("Wrote index.html (" + (bytes / 1024).toFixed(1) + " KB, " + modules.length + " modules + boot + " + exhibits.n + " exhibits)");
