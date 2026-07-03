/* Assemble the single-file StarNix build (index.html) for Google Apps Script.
 * Order matters:
 *   1. core   — defines StarNix, registerGame/registerAudio, initCore, makeContext, NoopAudio
 *   2. shell  — boot/title/cinematic/menu, strict mount/unmount
 *   3. audio  — installs StarNix.core.audio (real Web-Audio engine, 5 tracks)
 *   4. arm    — registers ARM
 *   5. cc     — registers CC (reads window.THREE; graceful fallback if absent)
 *   6. kbb    — registers KBB (Kuiper Belt Battle)
 *   7. boot   — StarNix.boot(#app)
 * Three.js (UMD global) is loaded from CDN in <head> for CC.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

const modules = [
  ["starnix-core.js", "core"],
  ["questions.js", "questions"],
  ["assets.js", "assets"],
  ["starnix-shell.js", "shell"],
  ["audio.js", "audio"],
  ["arm.js", "arm"],
  ["cc.js", "cc"],
  ["kbb.js", "kbb"],
  ["exam.js", "exam"]
];

function read(p) { return readFileSync(new URL("./" + p, import.meta.url), "utf8"); }
// Defuse any literal </script> so an inline block can't be closed early.
function safe(s) { return s.replace(/<\/script>/gi, "<\\/script>"); }

const blocks = modules.map(([file, name]) =>
  `<!-- ===== ${name} (${file}) ===== -->\n<script>\n${safe(read(file))}\n</script>`
).join("\n\n");

// ---- exhibits: inline present exhibit-images/* as data URIs (window.STARNIX_EXHIBITS).
// Exam questions render their exhibit from this map; absent keys fall back to a pending note.
const EXHIBIT_MIME = { png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml" };
function exhibitBlock() {
  const map = {};
  try {
    for (const f of readdirSync(new URL("./exhibit-images/", import.meta.url))) {
      const ext = (f.split(".").pop() || "").toLowerCase();
      const mime = EXHIBIT_MIME[ext];
      if (!mime) continue;
      const b64 = readFileSync(new URL("./exhibit-images/" + f, import.meta.url)).toString("base64");
      map[f.replace(/\.[^.]+$/, "")] = "data:" + mime + ";base64," + b64;
    }
  } catch (e) { /* no dir -> empty map */ }
  const n = Object.keys(map).length;
  return { n, html: `<!-- ===== exhibits (${n} inlined) ===== -->\n<script>\nwindow.STARNIX_EXHIBITS = ${JSON.stringify(map)};\n</script>` };
}
const exhibits = exhibitBlock();

const boot = `<!-- ===== boot ===== -->
<script>
(function () {
  "use strict";
  function fail(msg) {
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
  function start() {
    try {
      if (!window.StarNix || typeof window.StarNix.boot !== "function") return fail("core/shell not loaded");
      Promise.resolve(window.StarNix.boot(document.getElementById("app"), {})).catch(function (e) {
        fail((e && e.message) || String(e));
      });
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
<title>StarNix — Starlight Rescue Crew</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" />
<!-- Three.js (UMD global window.THREE) for the Chasm Chase 3D renderer -->
<script src="${THREE_CDN}"></script>
<style>
  html, body { margin: 0; height: 100%; background: #07070e; color: #F2F2F7;
    font-family: 'Montserrat', Arial, sans-serif; overflow: hidden; }
  #app { position: fixed; inset: 0; }
  /* loading splash shown until the shell paints */
  #app:empty::after { content: "Loading StarNix…"; position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center; color: #6d6d80;
    font-size: 14px; letter-spacing: .04em; }
</style>
</head>
<body>
<div id="app"></div>

${exhibits.html}

${blocks}

${boot}
</body>
</html>
`;

writeFileSync(new URL("./index.html", import.meta.url), html, "utf8");
const bytes = Buffer.byteLength(html, "utf8");
console.log("Wrote index.html (" + (bytes / 1024).toFixed(1) + " KB, " + modules.length + " modules + boot + " + exhibits.n + " exhibits)");
