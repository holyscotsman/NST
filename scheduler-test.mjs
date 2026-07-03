/* scheduler-test.mjs — unit-tests the shared spaced-retrieval scheduler + mastery
 * (01 §3/§4). Exercises makeQuestionProvider + makeMasteryStore directly under a
 * mocked clock and seeded RNG. No DOM. Proves: Leitner bucket advance/decay,
 * review-due timing by interval, reason classification, determinism, exclusions,
 * difficulty band, and due-weighting. Run: node scheduler-test.mjs
 */
import fs from "fs";
globalThis.window = globalThis;
(0, eval)(fs.readFileSync(new URL("./starnix-core.js", import.meta.url), "utf8"));
const I = globalThis.StarNix._internal;
const { makeQuestionProvider, makeMasteryStore, makeRng, clock, constants, DOMAINS } = I;

let T = 1000000;
clock.now = () => T;            // shared clock object -> deterministic "time"

let fails = 0;
function ok(name, cond) { console.log((cond ? "  \u2713 " : "  \u2717 ") + name); if (!cond) fails++; }

function Q(id, domain, difficulty) { return { id: id, cert: "NCP-MCI", domain: domain, difficulty: difficulty, stem: id + " stem", options: ["a", "b", "c"], correctIndex: 0, explanation: "x" }; }
const pack = { id: "NCP-MCI", domains: DOMAINS, questions: [
  Q("s1", "storage", 1), Q("s2", "storage", 2), Q("s3", "storage", 3),
  Q("n1", "networking", 2), Q("n2", "networking", 2), Q("v1", "vms", 1)
] };
function fresh() {
  const profile = { mastery: {}, totals: { questionsSeen: 0, correct: 0, incorrect: 0 } };
  const m = makeMasteryStore(profile, {});
  return { m: m, p: makeQuestionProvider(pack, m) };
}

console.log("Scheduler / mastery:");

// 1. fresh question classifies as "new"
{ const f = fresh(); ok("fresh question -> reason 'new'", f.p.next({ game: "KBB", rng: makeRng(1) }).reason === "new"); }

// 2. Leitner bucket advance on correct, gentle decay (not reset) on wrong
{ const f = fresh();
  f.m.record("s1", true, { game: "KBB" }); ok("correct -> bucket 1", f.m.get("s1").bucket === 1);
  f.m.record("s1", true, { game: "KBB" }); ok("correct -> bucket 2 + streak 2", f.m.get("s1").bucket === 2 && f.m.get("s1").streak === 2);
  f.m.record("s1", false, { game: "KBB" }); ok("wrong -> bucket 1 (decay) + streak reset", f.m.get("s1").bucket === 1 && f.m.get("s1").streak === 0);
}

// 3. review-due timing follows the per-bucket interval
{ const f = fresh(); const excl = ["s2", "s3", "n1", "n2", "v1"];
  f.m.record("s1", true, { game: "KBB" });                 // bucket 1, lastSeen=T, interval[1]
  ok("seen but interval not elapsed -> 'reinforce'", f.p.next({ game: "KBB", excludeIds: excl, rng: makeRng(2) }).reason === "reinforce");
  T += constants.INTERVALS[1] + 1000;                       // advance past interval
  ok("interval elapsed -> 'review-due'", f.p.next({ game: "KBB", excludeIds: excl, rng: makeRng(2) }).reason === "review-due");
  T -= constants.INTERVALS[1] + 1000;
}

// 4. deterministic under the same seed + same state
{ const a = fresh(), b = fresh(), sa = [], sb = [];
  for (let i = 0; i < 12; i++) sa.push(a.p.next({ game: "KBB", rng: makeRng(7) }).question.id);
  for (let i = 0; i < 12; i++) sb.push(b.p.next({ game: "KBB", rng: makeRng(7) }).question.id);
  ok("same seed -> identical draw sequence", JSON.stringify(sa) === JSON.stringify(sb));
}

// 5. exclusions respected (leave only n2)
{ const f = fresh(); const excl = ["s1", "s2", "s3", "n1", "v1"]; let allN2 = true;
  for (let i = 0; i < 25; i++) if (f.p.next({ game: "KBB", excludeIds: excl, rng: makeRng(i) }).question.id !== "n2") allN2 = false;
  ok("excludeIds respected", allN2);
}

// 6. difficulty band respected
{ const f = fresh(); let inBand = true;
  for (let i = 0; i < 30; i++) if (f.p.next({ game: "KBB", difficultyBand: [1, 1], rng: makeRng(i) }).question.difficulty !== 1) inBand = false;
  ok("difficultyBand [1,1] -> only difficulty-1 questions", inBand);
}

// 7. due is weighted well above uniform
{ const f = fresh();
  for (const id of ["s1", "s2", "s3", "n1", "n2", "v1"]) f.m.record(id, true, { game: "KBB" });
  for (let k = 0; k < 5; k++) for (const id of ["s2", "s3", "n1", "n2", "v1"]) f.m.record(id, true, { game: "KBB" }); // bucket 6, recent
  f.m.record("s1", false, { game: "KBB" });                  // bucket 0
  f.m.get("s1").lastSeen = T - 10 * 60 * 60 * 1000;          // stale -> due
  let dueHits = 0; const N = 400;
  for (let i = 0; i < N; i++) if (f.p.next({ game: "KBB", rng: makeRng(i) }).question.id === "s1") dueHits++;
  ok("due item selected far above uniform share (" + dueHits + "/" + N + " vs ~67)", dueHits > N / 3);
}

// 8. summary() aggregates mastered count
{ const f = fresh();
  for (let k = 0; k < constants.MASTERED_BUCKET; k++) f.m.record("s1", true, { game: "KBB" });
  ok("summary().masteredCount counts bucket>=threshold", f.m.summary().masteredCount === 1);
}

console.log("\n" + (fails ? ("SCHEDULER TEST: " + fails + " FAIL") : "SCHEDULER TEST: ALL GREEN"));
process.exit(fails ? 1 : 0);
