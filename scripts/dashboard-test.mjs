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
  ok('each weak area carries its own coverage', m.weakest[0].seen === 2 && m.weakest[0].total === 2);
  ok('weak-area percentages are whole numbers in range',
    m.weakest.every((w) => Number.isInteger(w.pct) && w.pct >= 0 && w.pct <= 100));
  // Four answers is not a diagnosis, so this list is ranked on coverage and
  // says so. What it must NOT do is call itself weakness.
  ok('four answers is not enough to rank by skill', m.weakBasis === 'coverage', m.weakBasis);
}

/* ---- the ranking has to mean the word it uses -------------------------------
 *
 * THE DEFECT THIS EXISTS FOR
 * `weakest` used to be ordered by summary().score -- box progress across the
 * WHOLE domain, unseen questions included. That is a coverage measure wearing a
 * skill label: with every domain held at the same accuracy, it ranked purely by
 * how much of each had been opened, and the launcher printed the result under
 * "Weakest areas" as a bare percentage, three lines below "ACCURACY 73%".
 *
 * Measured on the shipped 255-question bank at a uniform ~73%, it named the
 * three LEAST-STUDIED domains -- one of them the single most accurate of the
 * nine, shown as "4%" beside a card reading 73%.
 *
 * So: hold skill equal, vary coverage, and require that the ranking does not
 * move. Then hold coverage equal, vary skill, and require that it does. */
{
  // Nine domains, four questions each. Every domain is answered with the SAME
  // accuracy (3 right, 1 wrong = 75%); only how many of its questions have been
  // opened differs.
  const bank = [];
  for (let d = 0; d < 9; d++) for (let i = 0; i < 4; i++) bank.push({ id: 'd' + d + 'q' + i, domain: 'dom' + d });
  const { M, D } = fresh();
  for (let d = 0; d < 9; d++) {
    // dom0 has one question opened, dom8 has all four -- the real pattern, where
    // you study by picking topics rather than sweeping the bank evenly.
    const opened = 1 + (d % 4);
    for (let i = 0; i < opened; i++) {
      for (let r = 0; r < 4; r++) {
        M.record('d' + d + 'q' + i, { correct: r < 3, gate: 'always', now: T0 });
      }
    }
  }
  const sum1 = M.summary(bank, T0 + 1);
  const m = D.model({ summary: sum1, history: [], now: T0 + 1 });
  const accs = m.weakest.map((w) => w.accuracy);
  ok('with skill held equal, every ranked domain reports the same accuracy',
    m.weakBasis === 'accuracy' && accs.length === 3 && accs.every((a) => a === accs[0]),
    m.weakBasis + ' ' + JSON.stringify(m.weakest.map((w) => w.domain + ':' + w.accuracy)));
  ok('and the percentage shown IS that accuracy, not box progress',
    m.weakest.every((w) => w.pct === w.accuracy),
    JSON.stringify(m.weakest.map((w) => w.pct + '/' + w.accuracy)));

  /* [neg] The control, on the scenario where the two rankings actually diverge.
   * Every domain here is equally accurate, so a ranking that carries any skill
   * information has nothing to separate them on. Box score separates them
   * anyway -- into exactly the coverage order -- which is the whole defect. */
  const sameSkill = sum1.domains.every((d) => d.accuracy === sum1.domains[0].accuracy);
  const leastCovered = sum1.domains.slice()
    .sort((x, y) => (x.seen / x.total) - (y.seen / y.total)).slice(0, 3).map((d) => d.domain).sort();
  const byScore = sum1.domains.slice().sort((x, y) => x.score - y.score).slice(0, 3).map((d) => d.domain).sort();
  ok('[neg] ranking by box score instead sorts purely by coverage',
    sameSkill && byScore.join(',') === leastCovered.join(','),
    'same skill: ' + sameSkill + ' · byScore: ' + byScore.join(',') + ' · leastCovered: ' + leastCovered.join(','));

  // Now the other direction: one domain is genuinely worse, and it is the most
  // thoroughly studied -- the case the old ranking got backwards.
  const { M: M2, D: D2 } = fresh();
  for (let d = 0; d < 9; d++) {
    const opened = d === 0 ? 4 : 1 + (d % 4);
    for (let i = 0; i < opened; i++) {
      for (let r = 0; r < 4; r++) {
        // dom0: 1 of 4 right (25%). Everyone else: 3 of 4 (75%).
        M2.record('d' + d + 'q' + i, { correct: d === 0 ? r < 1 : r < 3, gate: 'always', now: T0 });
      }
    }
  }
  const m2 = D2.model({ summary: M2.summary(bank, T0 + 1), history: [], now: T0 + 1 });
  ok('the domain actually answered worst comes first, however well covered',
    m2.weakest[0].domain === 'dom0' && m2.weakest[0].accuracy === 25,
    m2.weakest.map((w) => w.domain + ':' + w.accuracy).join(','));
}

/* ---- a percentage without its unit is the other half of the defect ---- */
{
  const home = read('scripts', 'nst-home.js');
  // The visible row used to print `w.pct + "%"`. The unit is not optional: the
  // same card shows an accuracy stat, and two unlabelled percentages measuring
  // different things is the misreading this cycle removed.
  ok('the weak row prints a unit beside its percentage',
    /nst-dash-weakpct[^]*?w\.pct \+ "% " \+ words\.unit/.test(home));
  ok('and the heading is taken from the ranking basis, not asserted',
    /WEAK_WORDS\[basis\]/.test(home) && /Least covered areas/.test(home));
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

/* ---- an unfinished exam, as the launcher describes it --------------------
 * v2.29.0 taught Exam Mode to survive the tab being discarded and offers the
 * sitting back on the Practice Exams entry screen. The launcher is where people
 * actually land, and it said nothing -- so the feature only worked for somebody
 * who walked back in through the door they left by.
 *
 * This decides only what can be decided WITHOUT a question bank, because the
 * launcher has no engine to rebuild questions with. It therefore must not claim
 * the exam is restorable; the wording it feeds says "unfinished", not "resume".
 */
{
  const { D } = fresh();
  const NOW = 1_700_000_000_000;
  const rec = (over) => JSON.stringify(Object.assign({
    bank: 'ncp-mci', endTime: NOW + 10 * 60_000,
    q: [{ id: 'a', perm: [0, 1] }, { id: 'b', perm: [1, 0] }, { id: 'c', perm: [0, 1] }],
    answers: [0, null, [1, 2]], flags: [false, false, false],
  }, over || {}));

  const p = D.pendingExam(rec(), 'ncp-mci', NOW);
  ok('an exam in progress is described', !!p);
  ok('it counts the questions', p && p.total === 3, p && p.total);
  ok('a multi-answer selection counts as answered', p && p.answered === 2, p && p.answered);
  ok('an unanswered question does not', p && p.answered !== 3);
  ok('it reports the time left', p && p.remainingMs === 10 * 60_000, p && p.remainingMs);
  ok('and does not call it expired', p && p.expired === false);

  const gone = D.pendingExam(rec({ endTime: NOW - 1 }), 'ncp-mci', NOW);
  ok('an exam whose clock ran out is still described', !!gone);
  ok('it is marked expired', gone && gone.expired === true);
  ok('and reports no time left rather than a negative number',
    gone && gone.remainingMs === 0, gone && gone.remainingMs);

  ok('a record for another certification is not ours to talk about',
    D.pendingExam(rec(), 'some-other-cert', NOW) === null);
  ok('but with no bank named, it is described', !!D.pendingExam(rec(), '', NOW));

  ok('a record that will not parse is not a record', D.pendingExam('{nope', '', NOW) === null);
  ok('nor is null', D.pendingExam(null, '', NOW) === null);
  ok('nor an empty string', D.pendingExam('', '', NOW) === null);
  ok('nor a bare number', D.pendingExam('42', '', NOW) === null);
  ok('a record with no questions is nothing to offer',
    D.pendingExam(rec({ q: [] }), '', NOW) === null);
  ok('a record with no answers array is refused',
    D.pendingExam(rec({ answers: 'nope' }), '', NOW) === null);
  ok('a record with no deadline is refused',
    D.pendingExam(rec({ endTime: 'soon' }), '', NOW) === null);
  ok('an infinite deadline is refused, not treated as forever',
    D.pendingExam(rec({ endTime: Infinity }), '', NOW) === null);

  /* The launcher cannot know whether the bank still HAS these questions -- it has
   * no engine to rebuild with -- so its check can never be complete. It can still
   * refuse the records that are plainly broken, rather than advertising an exam
   * the link then cannot produce. Every one of these used to be advertised. */
  const q1 = (over) => rec({ q: [Object.assign({ id: 'a', perm: [1, 0] }, over)] });
  ok('a well-formed permutation is advertised', !!D.pendingExam(q1(), '', NOW));
  ok('a permutation that is not an array is refused', D.pendingExam(q1({ perm: 'xy' }), '', NOW) === null);
  ok('an out-of-range index is refused', D.pendingExam(q1({ perm: [99, -5] }), '', NOW) === null);
  ok('a repeated index is refused -- a permutation cannot repeat',
    D.pendingExam(q1({ perm: [0, 0] }), '', NOW) === null);
  ok('a one-option permutation is refused', D.pendingExam(q1({ perm: [0] }), '', NOW) === null);
  ok('a fractional index is refused', D.pendingExam(q1({ perm: [0.5, 1] }), '', NOW) === null);
  ok('a question with no id is refused', D.pendingExam(rec({ q: [{ perm: [0, 1] }] }), '', NOW) === null);
  ok('an id that is not a string is refused', D.pendingExam(q1({ id: 7 }), '', NOW) === null);
  ok('a null question entry is refused', D.pendingExam(rec({ q: [null] }), '', NOW) === null);
  ok('one bad entry among good ones refuses the whole record -- half an exam is not the exam',
    D.pendingExam(rec({ q: [{ id: 'a', perm: [1, 0] }, { id: 'b', perm: [5, 9] }] }), '', NOW) === null);

  // It is a read, not a write: nothing it is handed may be mutated.
  const obj = JSON.parse(rec());
  const before = JSON.stringify(obj);
  D.pendingExam(obj, 'ncp-mci', NOW);
  ok('it does not modify the record it is given', JSON.stringify(obj) === before);
}

/* ---- and the launcher actually draws it ---- */
{
  const home = read('scripts', 'nst-home.js');
  const css = read('styles', 'nst-home.css');
  ok('the launcher asks about an unfinished exam', /Dash\.pendingExam/.test(home));
  ok('it reads the key Exam Mode writes', /nst\.practice-exams\.exam\.v1/.test(home));
  ok('it draws something', /nst-dash-exam/.test(home) && /\.nst-dash-exam/.test(css));
  ok('it links to Practice Exams, the only place that can resume it',
    /note\.href = "\.\/practice-exams\/"/.test(home));
  ok('it says "unfinished" rather than promising a resume it cannot verify',
    /unfinished exam/.test(home) && !/Resume your exam/.test(home));
  ok('it says the clock is still running', /clock is still running/.test(home));
  ok('an expired one reads differently', /finished while you were away/.test(home));
  ok('and is styled differently, not just worded differently', /\.nst-dash-exam\.expired/.test(css));
  ok('storage being unavailable does not take the rest of the panel down',
    /catch \(eX\) \{ \/\* storage unavailable/.test(home));
}

console.log('\n' + (fail ? `DASHBOARD: ${fail} FAILED (${pass} passed)` : `DASHBOARD: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
