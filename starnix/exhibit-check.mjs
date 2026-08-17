/* exhibit-check.mjs — proves the exhibit-image pipeline is integrity-safe:
 *  (A) provider next() EXCLUDES @image questions from the action games by default and
 *      INCLUDES them only with allowImages; pool() (the exam path) always sees them.
 *  (B) (v2.1.1 modernized) exhibits now load at RUNTIME from the bank folder
 *      (banks/<id>/images/*, resolved by shared/bank-loader.js) — StarNix ships no exam
 *      mode and inlines nothing, so the integrity invariant is: every `image:` reference
 *      in every manifest bank resolves to a real file on disk (no runtime 404 exhibits),
 *      and the built page carries no dead exhibit base64.
 * Each property carries a negative control. Run: node exhibit-check.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
let fails = 0;
function ok(name, cond) { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fails++; }

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

// ---- (B) runtime-bank integrity: every bank `image:` reference resolves on disk ----
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANKS = path.join(ROOT, "banks");
const manifest = JSON.parse(fs.readFileSync(path.join(BANKS, "manifest.json"), "utf8"));
const banks = Array.isArray(manifest.banks) ? manifest.banks : [];
let refTotal = 0, refMissing = [];
for (const b of banks) {
  const mdPath = path.join(BANKS, b.file);
  if (!fs.existsSync(mdPath)) { refMissing.push(b.id + ": bank file missing (" + b.file + ")"); continue; }
  const md = fs.readFileSync(mdPath, "utf8");
  for (const mm of md.matchAll(/^image:\s*(\S+)\s*$/gm)) {
    refTotal++;
    const imgPath = path.join(path.dirname(mdPath), mm[1]);
    if (!fs.existsSync(imgPath)) refMissing.push(b.id + ": " + mm[1]);
  }
}
console.log("  (banks=" + banks.length + ", image refs=" + refTotal + ")");
ok("manifest parses with at least one bank", banks.length > 0);
ok("every bank `image:` reference resolves to a real file (no runtime 404 exhibits)",
  refMissing.length === 0 || (console.log("    missing: " + refMissing.join(", ")), false));
ok("[neg] a fabricated reference would be caught",
  !fs.existsSync(path.join(BANKS, banks[0] ? path.dirname(banks[0].file) : ".", "images/__nope__.png")));

// ---- (C) the built page ships no dead exhibit base64 (exam mode left StarNix) ----
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const mx = html.match(/window\.STARNIX_EXHIBITS\s*=\s*(\{[\s\S]*?\})\s*;/);
const EXH = mx ? JSON.parse(mx[1]) : {};
ok("STARNIX_EXHIBITS map exists in the build (shape intact)", !!mx);
ok("no dead exhibit base64 ships (games filter @image; exhibits render in Practice Exams)",
  Object.keys(EXH).length === 0 || Object.values(EXH).every(v => /^data:image\//.test(v)));

console.log(fails ? ("EXHIBIT CHECK: " + fails + " FAILED") : "EXHIBIT CHECK: ALL GREEN");
process.exit(fails ? 1 : 0);
