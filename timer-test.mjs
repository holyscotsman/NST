/* timer-test.mjs — unit-tests the shared dynamic question timer (D6). Length scales with how much
 * there is to read (stem + options), single vs multi, and difficulty; an authored q.timer overrides;
 * the Extra-time accessibility setting extends it. Pure, no DOM. Run: node timer-test.mjs
 */
import fs from "fs";
globalThis.window = globalThis;
(0, eval)(fs.readFileSync(new URL("./starnix-core.js", import.meta.url), "utf8"));
const T = globalThis.StarNix._internal.questionTimerSeconds;

let fails = 0;
function ok(name, cond) { console.log((cond ? "  \u2713 " : "  \u2717 ") + name); if (!cond) fails++; }

function Q(over) {
  return Object.assign({ id: "q", stem: "short stem here", options: ["aa", "bb", "cc", "dd"], correctIndex: 0, difficulty: 1 }, over || {});
}
const longStem = "this is a much longer question stem with many more words to read carefully before answering correctly";
const longOpts = ["a fairly long answer option one", "a fairly long answer option two", "a fairly long answer option three", "a fairly long answer option four"];

console.log("Dynamic question timer:");

ok("returns an integer", Number.isInteger(T(Q())));
ok("deterministic (same input -> same output)", T(Q()) === T(Q()));

ok("more words -> not less time", T(Q({ stem: longStem, options: longOpts })) >= T(Q()));
ok("more words -> strictly more time (well below the cap)", T(Q({ stem: longStem })) > T(Q()));

ok("higher difficulty -> more time (same text)", T(Q({ stem: longStem, difficulty: 3 })) > T(Q({ stem: longStem, difficulty: 1 })));

const single = Q({ stem: longStem });
const multi = Q({ stem: longStem, correctIndices: [0, 2] }); delete multi.correctIndex;
ok("multi-answer -> more time than the single equivalent", T(multi) > T(single));

const huge = Q({ stem: (longStem + " ").repeat(5), options: longOpts, difficulty: 3, correctIndices: [0, 1, 2] }); delete huge.correctIndex;
ok("tiny question clamps to the floor (12s)", T(Q({ stem: "a", options: ["x", "y"] })) === 12);
ok("huge question clamps to the cap (45s)", T(huge) === 45);

ok("authored q.timer overrides the computed base", T(Q({ timer: 30, stem: longStem })) === 30);

const base = T(Q({ stem: longStem }));
ok("Extra-time extends the timer", T(Q({ stem: longStem }), { extraTime: true }) > base);
ok("Extra-time can exceed the cap (accessibility)", T(huge, { extraTime: true }) > 45);

console.log(fails === 0 ? "\nTIMER TEST: ALL GREEN" : "\nTIMER TEST: " + fails + " FAILED");
process.exit(fails === 0 ? 0 : 1);
