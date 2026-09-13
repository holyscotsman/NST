// Practice Exams engine harness — pure-logic tests run in Node (no browser).
// Mirrors the StarNix harness style: prints one PASS line per group, exits
// non-zero on the first failure. Covers normalization, grading, option-shuffle
// remapping, exam/practice assembly, summarize, and the storage guards.
// (The practice-mode streak counter is DOM-bound; the browser E2E sweep
// asserts it against the real UI.)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// ---- minimal browser shims -------------------------------------------------
const storage = new Map();
const localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
const window = { localStorage };
window.window = window;
// (v2.3.2) the real page loads shared/bank-parser.js before the PE scripts, which
// defines the canonical stored-JSON parse — the shim mirrors that environment.
window.NSTSafeParse = (raw) => JSON.parse(raw, (k, v) => (k === '__proto__' ? undefined : v));
window.PE_CONFIG = {
  PASS_THRESHOLD: 0.8,
  EXAM_QUESTION_COUNT: 75,
  EXAM_TIME_LIMIT_MIN: 90,
  SHUFFLE_QUESTIONS: true,
  SHUFFLE_OPTIONS: true,
  TIMER_LOW_MIN: 5,
};
window.STARNIX_QUESTIONS = {
  name: 'Harness Bank',
  questions: [
    { id: 'q1', stem: 'Single?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, domain: 'alpha', explanation: 'because', optionNotes: ['na', 'nb', 'nc', 'nd'] },
    { id: 'q2', stem: 'Multi?', options: ['w', 'x', 'y', 'z'], correctIndices: [3, 1], domain: 'alpha' },
    { id: 'q3', stem: 'Also single?', options: ['1', '2', '3'], correctIndex: 0, domain: 'beta' },
    { id: 'q4', stem: 'Drop me (one option)', options: ['only'], correctIndex: 0 },
    { id: 'q5', stem: '', options: ['a', 'b'], correctIndex: 1 },              // drop: no prompt
    { id: 'q6', stem: 'Drop me (no correct)', options: ['a', 'b'] },           // drop: correct null
    { id: 'q7', stem: 'Keep', options: ['p', 'q'], correctIndex: 1, domain: 'beta' },
  ],
};

// engine.js is a browser IIFE — evaluate it against the shimmed window.
const src = readFileSync(join(here, 'engine.js'), 'utf8');
new Function('window', 'localStorage', src)(window, localStorage);
const E = window.PE.engine;

let group = '';
function check(name, cond) {
  if (!cond) { console.error(`FAIL [${group}] ${name}`); process.exit(1); }
}
function pass() { console.log(`PASS ${group}`); }

// ---- normalizeBank ----------------------------------------------------------
group = 'normalize';
const bank = E.normalizeBank();
check('drops invalid rows (1-option, no prompt, no correct)', bank.length === 4);
check('keeps ids', bank.map((q) => q.id).join(',') === 'q1,q2,q3,q7');
const multi = bank.find((q) => q.id === 'q2');
check('multi correct sorted ascending', JSON.stringify(multi.correct) === '[1,3]');
check('meta counts by domain', (() => { const m = E.bankMeta(); return m.total === 4 && m.domains.alpha === 2 && m.domains.beta === 2 && m.name === 'Harness Bank'; })());
pass();

// ---- grading ----------------------------------------------------------------
group = 'grading';
const q1 = bank.find((q) => q.id === 'q1');
check('single: right index', E.gradeAnswer(q1, 2) === true);
check('single: wrong index', E.gradeAnswer(q1, 1) === false);
check('single: array-wrapped index', E.gradeAnswer(q1, [2]) === true);
check('single: null', E.gradeAnswer(q1, null) === false);
check('multi: exact set, any order', E.gradeAnswer(multi, [3, 1]) === true);
check('multi: subset fails', E.gradeAnswer(multi, [1]) === false);
check('multi: superset fails', E.gradeAnswer(multi, [1, 3, 0]) === false);
check('multi: scalar fails', E.gradeAnswer(multi, 1) === false);
check('isAnswered: null/[]/-1 no, 0/[1] yes',
  !E.isAnswered(null) && !E.isAnswered([]) && !E.isAnswered(-1) && E.isAnswered(0) && E.isAnswered([1]));
pass();

// ---- option shuffle remapping ----------------------------------------------
group = 'shuffle-map';
for (let i = 0; i < 200; i++) {
  const s1 = E.shuffleOptions(q1);
  check('single remap points at same text', s1.options[s1.correct] === 'c');
  check('optionNotes stay parallel', s1.options.every((opt, k) => {
    const orig = 'abcd'.indexOf(opt);
    return s1.optionNotes[k] === ['na', 'nb', 'nc', 'nd'][orig];
  }));
  const s2 = E.shuffleOptions(multi);
  const txts = s2.correct.map((c) => s2.options[c]).sort().join('');
  check('multi remap points at same texts', txts === 'xz');
  check('multi remap stays sorted', JSON.stringify(s2.correct) === JSON.stringify(s2.correct.slice().sort((a, b) => a - b)));
}
// (v2.4.1) the shuffled copy must carry the exhibit source through: imageSrc is the
// ONLY live source (window.PE_EXHIBITS is never populated any more), so dropping it
// blanked every exhibit in Exam Mode while Practice Mode looked fine.
{
  const withImg = { ...q1, image: 'a2q50', imageSrc: 'banks/x/images/a2q50.png', imageAlt: 'diagram' };
  const s = E.shuffleOptions(withImg);
  check('shuffle preserves the exhibit source', s.imageSrc === withImg.imageSrc && s.image === 'a2q50' && s.imageAlt === 'diagram');
}
pass();

// ---- exam / practice assembly ------------------------------------------------
group = 'assembly';
const exam = E.buildExam(3);
check('exam draws requested count', exam.length === 3);
check('exam has no duplicate ids', new Set(exam.map((q) => q.id)).size === 3);
check('exam caps at pool size', E.buildExam(99).length === 4);
const practiceFull = E.buildPractice();
check('practice full bank in authored order', practiceFull.map((q) => q.id).join(',') === 'q1,q2,q3,q7');
const practiceSub = E.buildPractice(2);
check('practice subset size honored', practiceSub.length === 2 && new Set(practiceSub.map((q) => q.id)).size === 2);
pass();

// ---- summarize ----------------------------------------------------------------
group = 'summarize';
const mk = (q, ok) => ({ q, chosen: 0, correct: ok });
const sum = E.summarize([mk(q1, true), mk(multi, false), mk(bank[2], true), mk(bank[3], true)]);
check('counts', sum.correct === 3 && sum.total === 4 && sum.pct === 75);
check('75% under 80% threshold fails', sum.pass === false);
check('byDomain totals', sum.byDomain.alpha.total === 2 && sum.byDomain.alpha.correct === 1 && sum.byDomain.beta.correct === 2);
check('wrong list holds the miss', sum.wrong.length === 1 && sum.wrong[0].q.id === 'q2');
const atLine = E.summarize([mk(q1, true), mk(multi, true), mk(bank[2], true), mk(bank[3], true), mk(q1, false)]);
check('exactly 80% passes', atLine.pct === 80 && atLine.pass === true);
check('empty run cannot pass', E.summarize([]).pass === false && E.summarize([]).pct === 0);
// (v2.4.1) a FAILING score must never print the pass threshold: 4/5 = 80% passes,
// but a 79.6% sitting used to round up to "80%" beside "80% to pass".
{
  const near = [];
  for (let i = 0; i < 203; i++) near.push(mk(q1, true));
  for (let i = 0; i < 52; i++) near.push(mk(q1, false));
  const s = E.summarize(near);           // 203/255 = 79.607%
  check('a failing sitting never displays the pass threshold', s.pass === false && s.pct === 79);
}
pass();

// ---- storage guards ------------------------------------------------------------
group = 'storage';
storage.set('nst.practice-exams.history.v1', '{corrupt json!!');
check('corrupt history reads as []', Array.isArray(E.loadHistory()) && E.loadHistory().length === 0);
E.saveAttempt({ mode: 'exam', pct: 75 });
check('saveAttempt recovers and persists', E.loadHistory().length === 1 && E.loadHistory()[0].pct === 75);
for (let i = 0; i < 60; i++) E.saveAttempt({ i });
check('history capped at 50', E.loadHistory().length === 50);
pass();

// ---- focusDomain: what to study next ----------------------------------------
//
// THE DEFECT THIS EXISTS FOR
// The results screen ranked the focus recommendation by lowest PERCENTAGE,
// "ties broken by most misses". Ties across different denominators are rare, so
// the tie-breaker almost never ran and a bare rate decided it -- which the
// SMALLEST domain wins, because four questions reach 0% far more easily than
// eleven do. A real sitting said "Focus next on Performance -- 0% there (4
// missed)" while Data Protection sat at 1/11, ten missed.
//
// Simulated over 2,000 seventy-five-question sittings at 60% accuracy, the old
// ranking named a domain with fewer missed questions than another 62% of the
// time, forgoing 2.9 missed questions on average, and it has named a domain with
// a single question in the exam.
group = 'focus';
{
  const D = (correct, total) => ({ correct, total });

  // The sitting that started this.
  const real = E.focusDomain({
    architecture: D(2, 8), 'data-protection': D(1, 11), lifecycle: D(1, 10),
    monitoring: D(3, 9), networking: D(2, 9), performance: D(0, 4),
    security: D(1, 4), storage: D(3, 7), vms: D(3, 13),
  });
  check('names the domain with the most missed questions, not the lowest rate',
    real.domain === 'data-protection');
  check('and reports that count', real.missed === 10);
  check('with the rate alongside it, not instead of it', real.pct === 9 && real.total === 11);

  // A single-question domain answered wrong is 0%, and must never win.
  const tiny = E.focusDomain({ tiny: D(0, 1), big: D(8, 12) });
  check('a one-question domain at 0% does not outrank four real misses',
    tiny.domain === 'big' && tiny.missed === 4);

  // Equal misses: the weaker domain wins.
  const tied = E.focusDomain({ weak: D(1, 11), strong: D(30, 40) });
  check('equal misses go to the lower percentage', tied.domain === 'weak');
  check('and both really were equal', tied.missed === 10);

  // Nothing missed, nothing to say.
  check('a perfect sitting gets no recommendation', E.focusDomain({ a: D(5, 5), b: D(3, 3) }) === null);
  check('an empty tally gets none either', E.focusDomain({}) === null);
  check('and neither does a missing one', E.focusDomain(null) === null);
  check('a domain with no questions is skipped, not divided by zero',
    E.focusDomain({ empty: D(0, 0), real: D(1, 3) }).domain === 'real');

  // [neg] the old ranking would have answered differently on this data --
  // otherwise the fixture proves nothing.
  const byPct = (byDomain) => {
    let best = null, bestPct = 101, bestMiss = -1;
    for (const d of Object.keys(byDomain)) {
      const s = byDomain[d];
      if (!s.total) continue;
      const pct = s.correct / s.total * 100, miss = s.total - s.correct;
      if (pct < bestPct || (pct === bestPct && miss > bestMiss)) { best = d; bestPct = pct; bestMiss = miss; }
    }
    return best;
  };
  check('[neg] the old percentage ranking really does differ here',
    byPct({ 'data-protection': D(1, 11), performance: D(0, 4) }) === 'performance');
  check('[neg] and on the one-question case', byPct({ tiny: D(0, 1), big: D(8, 12) }) === 'tiny');
}
pass();


console.log('engine-test: all groups green');
