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

console.log('engine-test: all groups green');
