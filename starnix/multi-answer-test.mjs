/* multi-answer-test.mjs — unit-tests multi-select support (correctIndices).
 * Proves: core validateBank accepts a well-formed multi question and rejects the
 * malformed shapes; the set-equality grading used *identically* by ARM/CC/KBB;
 * and the generated bank actually contains valid multi questions.
 * Run: node multi-answer-test.mjs
 */
import fs from "fs";
globalThis.window = globalThis;
(0, eval)(fs.readFileSync(new URL("./starnix-core.js", import.meta.url), "utf8"));
const { validateBank, DOMAINS } = globalThis.StarNix._internal;

let fails = 0;
function ok(name, cond) { console.log((cond ? "  \u2713 " : "  \u2717 ") + name); if (!cond) fails++; }

function vq(q) { return validateBank({ id: "NCP-MCI", domains: DOMAINS, questions: [q] }); }
function base(extra) {
  return Object.assign({
    id: "mci-storage-aaaa", cert: "NCP-MCI", domain: "storage", difficulty: 1,
    stem: "stem", options: ["a", "b", "c", "d"], explanation: "x"
  }, extra);
}

console.log("Multi-answer support:");

// ---- core validation (questionErrors via validateBank) ----
ok("valid multi (correctIndices [0,2]) accepted", vq(base({ correctIndices: [0, 2] })).ok);
ok("valid single (correctIndex 1) still accepted", vq(base({ correctIndex: 1 })).ok);
ok("multi length 1 rejected", !vq(base({ correctIndices: [1] })).ok);
ok("multi duplicate index rejected", !vq(base({ correctIndices: [1, 1] })).ok);
ok("multi out-of-range rejected", !vq(base({ correctIndices: [0, 9] })).ok);
ok("multi non-integer rejected", !vq(base({ correctIndices: [0, 1.5] })).ok);
ok("missing both keys rejected", !vq(base({})).ok);

// ---- set-equality grading (identical logic embedded in arm.js / cc.js / kbb.js) ----
function grade(q, chosen) {
  if (q && Array.isArray(q.correctIndices) && q.correctIndices.length) {
    if (!Array.isArray(chosen) || chosen.length !== q.correctIndices.length) return false;
    for (let i = 0; i < q.correctIndices.length; i++) if (chosen.indexOf(q.correctIndices[i]) < 0) return false;
    return true;
  }
  return chosen === (q ? q.correctIndex : -1);
}
const multi = { correctIndices: [0, 2] };
ok("grade multi exact set -> correct", grade(multi, [0, 2]) === true);
ok("grade multi reversed order -> correct", grade(multi, [2, 0]) === true);
ok("grade multi subset -> incorrect", grade(multi, [0]) === false);
ok("grade multi superset -> incorrect", grade(multi, [0, 1, 2]) === false);
ok("grade multi one wrong member -> incorrect", grade(multi, [0, 1]) === false);
ok("grade multi non-array answer -> incorrect", grade(multi, 0) === false);
const single = { correctIndex: 1 };
ok("grade single match -> correct", grade(single, 1) === true);
ok("grade single miss -> incorrect", grade(single, 0) === false);

// ---- the generated bank contains valid multi questions ----
(0, eval)(fs.readFileSync(new URL("./questions.js", import.meta.url), "utf8"));
const bank = globalThis.STARNIX_QUESTIONS;
ok("generated bank loaded", !!bank && Array.isArray(bank.questions));
const multiInBank = (bank.questions || []).filter((q) => Array.isArray(q.correctIndices));
ok("generated bank contains >=1 multi question", multiInBank.length >= 1);
ok("every multi question in the bank has >=2 distinct in-range indices",
  multiInBank.every((q) => q.correctIndices.length >= 2 &&
    new Set(q.correctIndices).size === q.correctIndices.length &&
    q.correctIndices.every((i) => i >= 0 && i < q.options.length)));
ok("generated bank validates clean", validateBank(bank).ok);

console.log(fails ? ("\nMULTI-ANSWER TEST: " + fails + " FAIL(S)") : "\nMULTI-ANSWER TEST: ALL GREEN");
process.exit(fails ? 1 : 0);
