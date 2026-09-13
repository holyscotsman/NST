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

/* ---- (C) StarNix inlines no exhibits, and has nothing left to inline with ----
 *
 * (v2.51.0) This used to read window.STARNIX_EXHIBITS out of the build and assert
 *   Object.keys(EXH).length === 0 || Object.values(EXH).every(isDataUri)
 * which passes whether the map is empty or full: a check with no failing case. The
 * machinery behind it was just as hollow — build.mjs read all 34 files in
 * exhibit-images/ on every build, filtered them against a reference set taken from a
 * compiled bank that was no longer built in, and inlined none of them into a global
 * nothing read. Directory, global and filter are all gone; what is left is the rule
 * they were supposed to serve, stated so it can fail.
 */
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
ok("the build declares no exhibit map (exhibits belong to the bank, not the engine)",
  !/window\.STARNIX_EXHIBITS/.test(html));
ok("no exhibit-images directory is left in starnix/",
  !fs.existsSync(new URL("./exhibit-images/", import.meta.url)));
/* Call sites, not mentions — the same trap the Math.random allowlist fell into in
 * v2.49.0, where a comment explaining the rule turned the rule red. The comment in
 * build.mjs saying why the directory went must not count as reading it. */
const buildSrc = fs.readFileSync(new URL("./build.mjs", import.meta.url), "utf8")
  .split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
ok("and the build has no code that reads one",
  !/exhibit-images/.test(buildSrc));
/* The negative control for (C): the rule has a failing case, and here it is. */
ok("[neg] a build that DID declare an exhibit map would be caught",
  /window\.STARNIX_EXHIBITS/.test('<script>window.STARNIX_EXHIBITS = {};</script>'));

console.log(fails ? ("EXHIBIT CHECK: " + fails + " FAILED") : "EXHIBIT CHECK: ALL GREEN");
process.exit(fails ? 1 : 0);
