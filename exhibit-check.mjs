/* exhibit-check.mjs — proves the exhibit-image pipeline is integrity-safe:
 *  (A) provider next() EXCLUDES @image questions from the action games by default and
 *      INCLUDES them only with allowImages; pool() (the exam path) always sees them.
 *  (B) every LIVE @image question has an inlined data:image URI in window.STARNIX_EXHIBITS
 *      — so no live exhibit question can render blank / be unanswerable.
 *  (C) (v0.143.0, NIT#2) the inverse: every INLINED exhibit is referenced by a live question
 *      — orphan files on disk (a4q50) must not ship dead base64.
 * Each property carries a negative control. Run: node exhibit-check.mjs
 */
import fs from "fs";
let fails = 0;
function ok(name, cond) { console.log((cond ? "  \u2713 " : "  \u2717 ") + name); if (!cond) fails++; }

globalThis.window = globalThis;
(0, eval)(fs.readFileSync(new URL("./starnix-core.js", import.meta.url), "utf8"));
const I = globalThis.StarNix._internal;
const { makeQuestionProvider, makeMasteryStore, makeRng, DOMAINS } = I;

// ---- (A) provider gate ----
function Q(id, img){ const q={id,cert:"NCP-MCI",domain:"storage",difficulty:2,stem:id,options:["a","b","c"],correctIndex:0,explanation:"x"}; if(img)q.image=img; return q; }
const pack = { id:"NCP-MCI", domains:DOMAINS, questions:[ Q("t1"), Q("t2"), Q("img1","a1q1"), Q("img2","a2q18") ] };
const m = makeMasteryStore({ mastery:{}, totals:{questionsSeen:0,correct:0,incorrect:0} }, {});
const p = makeQuestionProvider(pack, m);
const rng = makeRng(42);
let sawDefault=false, sawAllowed=false;
for (let i=0;i<400;i++){ if (p.next({rng}).question.image) sawDefault=true; }
for (let i=0;i<400;i++){ if (p.next({rng, allowImages:true}).question.image) sawAllowed=true; }
ok("next() excludes exhibit questions by default (games)", sawDefault === false);
ok("[neg] next({allowImages:true}) CAN return an exhibit question", sawAllowed === true);
ok("pool() returns exhibit questions (exam path)", p.pool().filter(q=>q.image).length === 2);

// ---- (B) integrity: live @image questions are all inlined ----
(0, eval)(fs.readFileSync(new URL("./questions.js", import.meta.url), "utf8"));
const live = (globalThis.STARNIX_QUESTIONS && globalThis.STARNIX_QUESTIONS.questions) || [];
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const mx = html.match(/window\.STARNIX_EXHIBITS\s*=\s*(\{[\s\S]*?\})\s*;/);
const EXH = mx ? JSON.parse(mx[1]) : {};
const liveImg = live.filter(q => q.image);
const missing = liveImg.filter(q => !EXH[q.image]);
const badURI = Object.values(EXH).filter(v => !/^data:image\//.test(v));
console.log("  (live=" + live.length + ", live@image=" + liveImg.length + ", inlined=" + Object.keys(EXH).length + ")");
ok("STARNIX_EXHIBITS present with entries", Object.keys(EXH).length > 0);
ok("every inlined exhibit is a data:image/* URI", badURI.length === 0);
ok("every LIVE @image question has an inlined exhibit (integrity)", missing.length === 0);
ok("[neg] a non-existent exhibit key is absent from the map", !EXH["__nope__"]);

// ---- (C) no orphans: inlined keys \u2286 live-referenced keys ----
const refIds = new Set(liveImg.map(q => q.image));
const orphans = Object.keys(EXH).filter(k => !refIds.has(k));
ok("NIT#2: every INLINED exhibit is referenced by a live question (no dead base64)", orphans.length === 0);
ok("NIT#2: the a4q50 orphan file stays on disk but no longer ships",
  !EXH["a4q50"] && fs.existsSync(new URL("./exhibit-images/a4q50.png", import.meta.url)));

console.log(fails ? ("EXHIBIT CHECK: " + fails + " FAILED") : "EXHIBIT CHECK: ALL GREEN");
process.exit(fails ? 1 : 0);
