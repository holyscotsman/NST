/* dashboard-test.mjs — the home page progress rollup.
 *
 * The dashboard is the first thing a returning user reads, and the way it goes
 * wrong is not a crash: it is a confident sentence that is not true. So these
 * tests are about the claims, not the plumbing —
 *
 *   - it never names a "weakest area" that has never been answered
 *   - it never shows a wall of zeros in place of "you haven't started"
 *   - "0 due" is distinguished from "nothing scheduled"
 *   - a poisoned exam history (localStorage is shared with every other site on
 *     the same github.io origin) yields a boring number, never a crash
 *
 * It runs against the real NSTMastery so the two modules cannot drift apart.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/dashboard-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
const DASH_SRC = read('shared', 'nst-dashboard.js');
const MASTERY_SRC = read('shared', 'nst-mastery.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

function fresh() {
  const map = new Map();
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage };
  win.window = win;
  const run = (src) => new Function('window', 'setTimeout', 'clearTimeout', 'Date', src)(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  run(MASTERY_SRC);
  run(DASH_SRC);
  return { M: win.NSTMastery, D: win.NSTDash };
}

const T0 = 1_700_000_000_000;
const HOUR = 3600_000, DAY = 24 * HOUR;

/* A small bank spanning three domains. */
const BANK = [
  { id: 'a1', domain: 'networking' }, { id: 'a2', domain: 'networking' },
  { id: 'b1', domain: 'storage' }, { id: 'b2', domain: 'storage' },
  { id: 'c1', domain: 'security' }, { id: 'c2', domain: 'security' },
];

/* ---- the empty state is an empty state, not zeros ---- */
{
  const { M, D } = fresh();
  const m = D.model({ summary: M.summary(BANK, T0), history: [], now: T0 });
  ok('a fresh install reports no data', m.hasData === false);
  ok('it still knows the bank size', m.total === 6, m.total);
  ok('it names no weakest area', m.weakest.length === 0);
  ok('it offers a nudge, not a statistic', /answer a few/i.test(m.nudge));
  ok('unseen questions are all due', m.due === 6, m.due);
}

/* ---- no bank at all ---- */
{
  const { D } = fresh();
  const m = D.model({ summary: null, history: [], now: T0 });
  ok('a missing bank does not throw', m && m.hasData === false);
  ok('with no bank the nudge points at the exam picker', /pick an exam/i.test(m.nudge));
  ok('no bank means no percentages to misread', m.masteredPct === 0 && m.total === 0);
}

/* ---- weakest areas: only what has been answered ---- */
{
  const { M, D } = fresh();
  // Answer only networking and storage. security is untouched and must not be
  // called a weak area -- it is an unknown, which is a different claim.
  M.record('a1', { correct: false, gate: 'always', now: T0 });
  M.record('a2', { correct: false, gate: 'always', now: T0 });
  M.record('b1', { correct: true, gate: 'always', now: T0 });
  M.record('b2', { correct: true, gate: 'always', now: T0 });

  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  const names = m.weakest.map((w) => w.domain);
  ok('weakest areas are reported once two domains are seen', m.weakest.length === 2, names.join(','));
  ok('an untouched domain is never called weak', names.indexOf('security') === -1, names.join(','));
  ok('the worst answered domain comes first', names[0] === 'networking', names.join(','));
  ok('each weak area carries its own coverage', m.weakest[0].seen === 2 && m.weakest[0].total === 2);
  ok('weak-area percentages are whole numbers in range',
    m.weakest.every((w) => Number.isInteger(w.pct) && w.pct >= 0 && w.pct <= 100));
}

/* ---- one answered domain is not a ranking ---- */
{
  const { M, D } = fresh();
  M.record('a1', { correct: true, gate: 'always', now: T0 });
  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  ok('one domain is data, not a ranking', m.weakest.length === 0, m.weakest.length);
  ok('but it still counts as having started', m.hasData === true);
}

/* ---- at most three ---- */
{
  const bank = [];
  for (let i = 0; i < 8; i++) bank.push({ id: 'q' + i, domain: 'd' + i });
  const { M, D } = fresh();
  bank.forEach((q, i) => M.record(q.id, { correct: i % 2 === 0, gate: 'always', now: T0 }));
  const m = D.model({ summary: M.summary(bank, T0 + 1), history: [], now: T0 + 1 });
  ok('the weak list is capped at three', m.weakest.length === 3, m.weakest.length);
}

/* ---- "0 due" vs "nothing scheduled" ---- */
{
  const { M, D } = fresh();
  for (const q of BANK) M.record(q.id, { correct: true, gate: 'always', now: T0 });
  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  ok('answering everything clears the queue', m.due === 0, m.due);
  ok('a cleared queue says when the next one lands', typeof m.nextDue === 'string' && m.nextDue.length > 0, m.nextDue);
  ok('the next-due text is coarse, not a countdown', /^in /.test(m.nextDue), m.nextDue);
}
{
  const { M, D } = fresh();
  M.record('a1', { correct: true, gate: 'always', now: T0 });
  // Everything else is unseen, so the queue is not empty.
  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  ok('a non-empty queue suppresses the next-due line', m.due > 0 && m.nextDue === null, m.due + '/' + m.nextDue);
}

/* ---- the time wording ---- */
{
  const { D } = fresh();
  ok('under an hour is not rounded to zero', D.untilText(T0 + 10 * 60_000, T0) === 'in under an hour');
  ok('hours are singular at one', D.untilText(T0 + HOUR, T0) === 'in 1 hour', D.untilText(T0 + HOUR, T0));
  ok('hours are plural above one', D.untilText(T0 + 5 * HOUR, T0) === 'in 5 hours');
  ok('days are singular at one', D.untilText(T0 + DAY, T0) === 'in 1 day', D.untilText(T0 + DAY, T0));
  ok('days are plural above one', D.untilText(T0 + 3 * DAY, T0) === 'in 3 days');
  ok('a time in the past is not a schedule', D.untilText(T0 - DAY, T0) === null);
  ok('an unset time is not a schedule', D.untilText(0, T0) === null);
}

/* ---- accuracy ---- */
{
  const { M, D } = fresh();
  M.record('a1', { correct: true, gate: 'always', now: T0 });
  M.record('a2', { correct: false, gate: 'always', now: T0 });
  M.record('b1', { correct: true, gate: 'always', now: T0 });
  M.record('b2', { correct: true, gate: 'always', now: T0 });
  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  ok('accuracy is answered-correct over answered', m.accuracy === 75, m.accuracy);
  ok('accuracy ignores the unanswered rest of the bank', m.answered === 4, m.answered);
}
{
  const { M, D } = fresh();
  const m = D.model({ summary: M.summary(BANK, T0), history: [], now: T0 });
  ok('accuracy over nothing is null, not 0%', m.accuracy === null, m.accuracy);
}

/* ---- exam attempts ---- */
{
  const { M, D } = fresh();
  const history = [
    { pct: 72, pass: false, at: T0 - DAY, bank: 'ncp-mci' },
    { pct: 88, pass: true, at: T0 - 3 * DAY, bank: 'ncp-mci' },
    { pct: 60, pass: false, at: T0 - 9 * DAY, bank: 'ncp-mci' },
  ];
  const m = D.model({ summary: M.summary(BANK, T0), history, now: T0 });
  ok('the newest attempt is the last one', m.exam.last.pct === 72, m.exam.last.pct);
  ok('the best attempt is the highest, not the newest', m.exam.best.pct === 88, m.exam.best.pct);
  ok('the pass flag rides with the attempt', m.exam.best.pass === true && m.exam.last.pass === false);
  ok('the attempt count is reported', m.exam.count === 3, m.exam.count);
  ok('an exam alone counts as having started', m.hasData === true);
}
{
  const { M, D } = fresh();
  const m = D.model({ summary: M.summary(BANK, T0), history: [], now: T0 });
  ok('no attempts means no exam block at all', m.exam === null);
}

/* ---- hostile history (localStorage is a shared origin) ---- */
{
  const { M, D } = fresh();
  const history = [
    null,
    'not an object',
    { pct: 'NaN', pass: true },
    { pct: 1e9, pass: true },
    { pct: -5, pass: true },
    { pct: Infinity, pass: true },
    { pct: 91, pass: 'yes', at: 'whenever' },
  ];
  let m;
  ok('a poisoned history does not throw', (() => {
    try { m = D.model({ summary: M.summary(BANK, T0), history, now: T0 }); return true; }
    catch (e) { return e.message; }
  })() === true);
  ok('only the plausible attempt survives', m.exam && m.exam.count === 1, m.exam && m.exam.count);
  ok('out-of-range percentages are dropped, not clamped into a lie', m.exam.best.pct === 91, m.exam.best.pct);
  ok('a non-boolean pass becomes a boolean', m.exam.best.pass === true);
  ok('a non-numeric timestamp becomes 0', m.exam.best.at === 0, m.exam.best.at);
}
{
  const { M, D } = fresh();
  for (const h of [null, undefined, 'nope', 42, {}]) {
    ok('a history of ' + JSON.stringify(h) + ' is treated as empty',
      D.model({ summary: M.summary(BANK, T0), history: h, now: T0 }).exam === null);
  }
}

/* ---- percentages are presentable ---- */
{
  const { M, D } = fresh();
  for (const q of BANK) M.record(q.id, { correct: true, gate: 'always', now: T0 });
  const m = D.model({ summary: M.summary(BANK, T0 + 1), history: [], now: T0 + 1 });
  ok('mastered% is a whole number', Number.isInteger(m.masteredPct));
  ok('seen% is a whole number', Number.isInteger(m.seenPct));
  ok('seen% reflects the whole bank', m.seenPct === 100, m.seenPct);
  ok('mastery is not claimed from one correct answer', m.masteredPct < 100, m.masteredPct);
}

/* ---- the drill link's preference merge ---- */
{
  const { D } = fresh();
  // The dashboard writes ANOTHER tool's preference object. Clobbering the
  // question-set choice there would silently change what the next exam draws.
  const before = { useFull: true, somethingElse: 7 };
  const after = D.withFocus(before, 'networking');
  ok('the focus domain is set', after.focusDomain === 'networking');
  ok('the question-set choice survives', after.useFull === true);
  ok('unrelated keys survive', after.somethingElse === 7);
  ok('the original object is not mutated', before.focusDomain === undefined);
}
{
  const { D } = fresh();
  for (const junk of [null, undefined, 'a string', 42, ['an', 'array'], true]) {
    const after = D.withFocus(junk, 'storage');
    ok('a ' + JSON.stringify(junk) + ' preference blob is replaced, not merged',
      after && after.focusDomain === 'storage' && Object.keys(after).length === 1);
  }
}
{
  const { D } = fresh();
  // localStorage is shared with every other site on this origin.
  const poisoned = JSON.parse('{"__proto__": {"polluted": true}, "useFull": false}');
  const after = D.withFocus(poisoned, 'security');
  ok('a __proto__ key never survives the merge', !Object.prototype.hasOwnProperty.call(after, '__proto__'));
  ok('and nothing is polluted', ({}).polluted === undefined);
  ok('the real keys still come through', after.useFull === false && after.focusDomain === 'security');
}
{
  const { D } = fresh();
  ok('a missing domain clears the focus rather than storing undefined',
    D.withFocus({}, undefined).focusDomain === '');
  ok('a non-string domain is coerced, not stored raw',
    typeof D.withFocus({}, 12).focusDomain === 'string');
}

/* ---- the renderer actually uses this module ---- */
{
  const home = read('scripts', 'nst-home.js');
  ok('the home page renders from the model', /NSTDash/.test(home));
  ok('the weak rows are links, not click handlers', /nst-dash-weaklink/.test(home));
  ok('they target Practice Exams', /practice-exams\//.test(home));
  ok('they set the focus through withFocus, not by hand', /withFocus/.test(home));
  const index = read('index.html');
  ok('the module is loaded by the launcher', /shared\/nst-dashboard\.js/.test(index));
  ok('it loads after the mastery store it reads',
    index.indexOf('nst-dashboard.js') > index.indexOf('nst-mastery.js'));
}

console.log('\n' + (fail ? `DASHBOARD: ${fail} FAILED (${pass} passed)` : `DASHBOARD: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
