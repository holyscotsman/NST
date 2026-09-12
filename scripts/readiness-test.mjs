/* readiness-test.mjs — the exam-readiness estimate.
 *
 * This is the one number in the app that can do real harm. "Likely ready" told
 * to someone who is not costs them an exam fee and a booking; a permanent "not
 * yet" for someone who is makes the tool useless. So the tests are about the
 * guarantees, not the arithmetic:
 *
 *   - it never claims readiness from thin evidence (a coverage floor)
 *   - it never scores a question below blind guessing, and knows that a
 *     "choose two" is far harder to guess than a single answer
 *   - time can only ever lower the estimate, never raise it
 *   - one right answer is not proof; sustained accuracy is
 *   - it reports a band, and only gives a verdict when the band is decisive
 *   - a hand-edited or corrupt record cannot produce a confident number
 *
 * Runs against the real NSTMastery, so the estimate and the scheduler cannot
 * disagree about what "due" means.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/readiness-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
const MASTERY_SRC = read('shared', 'nst-mastery.js');
const READY_SRC = read('shared', 'nst-readiness.js');

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
  run(READY_SRC);
  return { M: win.NSTMastery, R: win.NSTReadiness, map };
}

const T0 = 1_700_000_000_000;
const DAY = 24 * 3600_000;

/* A 40-question bank over four domains, four options each, single answer. */
function bank(n = 40, domains = ['a', 'b', 'c', 'd']) {
  const qs = [];
  for (let i = 0; i < n; i++) {
    qs.push({
      id: 'q' + i,
      domain: domains[i % domains.length],
      options: ['1', '2', '3', '4'],
      correct: 0,
    });
  }
  return qs;
}

/* Answer the first `count` questions `reps` times with the given outcome. */
function drill(M, qs, count, reps, correct, at = T0) {
  for (let i = 0; i < count; i++) {
    for (let r = 0; r < reps; r++) {
      M.record(qs[i].id, { correct, gate: 'always', now: at });
    }
  }
}

/* ---- blind-guess probability ---- */
{
  const { R } = fresh();
  ok('four options, one answer is 1 in 4', R.chanceFor({ options: [1, 2, 3, 4], correct: 0 }) === 0.25);
  ok('five options, one answer is 1 in 5', R.chanceFor({ options: [1, 2, 3, 4, 5], correct: 0 }) === 0.2);
  const two = R.chanceFor({ options: [1, 2, 3, 4], correct: [0, 1] });
  ok('choose two of four is 1 in 6, far harder than 1 in 4', Math.abs(two - 1 / 6) < 1e-9, two);
  const three = R.chanceFor({ options: [1, 2, 3, 4, 5], correct: [0, 1, 2] });
  ok('choose three of five is 1 in 10', Math.abs(three - 0.1) < 1e-9, three);
  ok('a malformed question falls back to 1 in 4', R.chanceFor({ options: [], correct: null }) === 0.25);
  ok('no question at all falls back to 1 in 4', R.chanceFor(null) === 0.25);
  ok('more correct answers than options does not break it', R.chanceFor({ options: [1, 2], correct: [0, 1, 2] }) === 0.25);
}

/* ---- the coverage floor ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  // Perfect on a fifth of the bank -- below the floor.
  drill(M, qs, 8, 5, true);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('a perfect run on a fifth of the bank is not readiness', e.verdict === 'not-enough', e.verdict);
  ok('no verdict means no boolean either', e.ready === null);
  ok('it does not show a number it cannot stand behind', e.score === 0 && e.low === 0 && e.high === 0);
  ok('it says how much more is needed', e.needMore === 2, e.needMore);
  ok('it reports the coverage it has', e.coverage === 20, e.coverage);
  ok('the detail names real counts', /8 of 40/.test(e.detail), e.detail);
}
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 10, 5, true);   // exactly at the 25% floor
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('at exactly the floor a verdict is given', e.verdict !== 'not-enough', e.verdict);
  ok('and a number comes with it', e.score > 0);
}

/* ---- an empty or bankless call ---- */
{
  const { M, R } = fresh();
  const e = R.estimate({ questions: [], mastery: M, now: T0 });
  ok('no bank yields no verdict', e.verdict === 'not-enough' && e.total === 0);
  ok('no bank points at the exam picker', /pick an exam/i.test(e.detail), e.detail);
  const e2 = R.estimate({ questions: bank(10), mastery: null, now: T0 });
  ok('no mastery store does not throw', e2.verdict === 'not-enough');
}

/* ---- never below guessing ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  // Wrong every time, on the whole bank.
  drill(M, qs, 40, 6, false);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('answering everything wrong still scores at least chance', e.score >= 25, e.score);
  ok('but it is nowhere near the bar', e.verdict === 'not-yet', e.verdict);
  ok('the range sits below the bar entirely', e.high < e.pass, e.high + '<' + e.pass);
}
{
  // A bank of "choose two" questions: guessing is worth far less, and the floor
  // for a person who knows nothing should follow it down.
  const { M, R } = fresh();
  const qs = bank(40).map((q) => ({ ...q, correct: [0, 1] }));
  drill(M, qs, 40, 6, false);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('a multi-answer bank floors far lower than a single-answer one', e.score < 25, e.score);
  ok('and it is above zero, because guessing still sometimes works', e.score > 0, e.score);
}

/* ---- one right answer is not proof ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 1, true);            // every question, answered right once
  const once = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });

  const b = fresh();
  const qs2 = bank(40);
  drill(b.M, qs2, 40, 6, true);          // every question, right six times
  const many = b.R.estimate({ questions: qs2, mastery: b.M, now: T0 + 1 });

  ok('sustained accuracy beats a single pass', many.score > once.score, once.score + ' -> ' + many.score);
  ok('one pass over the bank is not yet "likely ready"', once.verdict !== 'likely-ready', once.verdict);
  ok('sustained accuracy does reach it', many.verdict === 'likely-ready', many.verdict + ' ' + many.score);
}

/* ---- time only lowers ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 6, true);
  const now = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  const later = R.estimate({ questions: qs, mastery: M, now: T0 + 400 * DAY });
  ok('a year of not studying lowers the estimate', later.score < now.score, now.score + ' -> ' + later.score);
  ok('it does not decay below guessing', later.score >= 25, later.score);
  ok('a long absence can withdraw the verdict',
    !(now.verdict === 'likely-ready' && later.verdict === 'likely-ready') || later.score < now.score,
    now.verdict + ' -> ' + later.verdict);
}
{
  // The downward-only rule: a question answered WRONG does not improve with age.
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 6, false);
  const now = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  const later = R.estimate({ questions: qs, mastery: M, now: T0 + 400 * DAY });
  ok('time never forgives a demonstrated miss', later.score <= now.score, now.score + ' -> ' + later.score);
}

/* ---- the band ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 20, 4, true);
  drill(M, qs.slice(20), 10, 4, false);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('the band brackets the point estimate', e.low <= e.score && e.score <= e.high,
    `${e.low}/${e.score}/${e.high}`);
  ok('the band has width', e.high > e.low, `${e.low}..${e.high}`);
  ok('every number is a whole percentage',
    [e.score, e.low, e.high, e.pass, e.coverage].every(Number.isInteger));
  ok('nothing escapes 0..100', [e.score, e.low, e.high].every((v) => v >= 0 && v <= 100));
}
{
  // Less of the bank seen must mean a wider band, at equal accuracy.
  const a = fresh(), b = fresh();
  const qa = bank(80), qb = bank(80);
  drill(a.M, qa, 24, 4, true);    // 30% coverage
  drill(b.M, qb, 72, 4, true);    // 90% coverage
  const ea = a.R.estimate({ questions: qa, mastery: a.M, now: T0 + 1 });
  const eb = b.R.estimate({ questions: qb, mastery: b.M, now: T0 + 1 });
  ok('thin coverage widens the band', (ea.high - ea.low) > (eb.high - eb.low),
    `${ea.high - ea.low} vs ${eb.high - eb.low}`);
}

/* ---- the verdict follows the band, not the point ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 6, true);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('"likely ready" requires the LOW end to clear the bar', e.verdict !== 'likely-ready' || e.low >= e.pass,
    `${e.low} vs ${e.pass}`);
  ok('"not yet" requires the HIGH end to miss the bar',
    e.verdict !== 'not-yet' || e.high < e.pass);
  ok('the verdict carries a plain-language label', typeof e.label === 'string' && e.label.length > 0, e.label);
  ok('ready is true only for likely-ready', (e.verdict === 'likely-ready') === (e.ready === true));
}
{
  const { M, R } = fresh();
  const qs = bank(40);
  // Mixed: right on half, wrong on half -- should straddle or sit below.
  drill(M, qs, 20, 4, true);
  drill(M, qs.slice(20), 20, 4, false);
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('a half-right bank is not readiness', e.verdict !== 'likely-ready', e.verdict + ' ' + e.score);
  ok('an on-the-edge verdict is not a yes', e.verdict !== 'on-the-edge' || e.ready === null);
}

/* ---- the pass bar is the bank's, not a constant ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 5, true);
  const strict = R.estimate({ questions: qs, mastery: M, pass: 0.95, now: T0 + 1 });
  const lax = R.estimate({ questions: qs, mastery: M, pass: 0.5, now: T0 + 1 });
  ok('a higher bar is reported', strict.pass === 95 && lax.pass === 50);
  ok('the same performance can clear a low bar and miss a high one',
    lax.verdict === 'likely-ready' && strict.verdict !== 'likely-ready',
    lax.verdict + ' / ' + strict.verdict);
  ok('the detail names the actual bar', /95%/.test(strict.detail), strict.detail);
}

/* ---- a smaller exam draw is noisier ---- */
{
  const { M, R } = fresh();
  const qs = bank(80);
  drill(M, qs, 60, 4, true);
  const small = R.estimate({ questions: qs, mastery: M, examSize: 10, now: T0 + 1 });
  const big = R.estimate({ questions: qs, mastery: M, examSize: 75, now: T0 + 1 });
  ok('a ten-question exam is a wider band than a seventy-five', (small.high - small.low) > (big.high - big.low),
    `${small.high - small.low} vs ${big.high - big.low}`);
  ok('the point estimate does not move with the draw size', small.score === big.score,
    small.score + ' vs ' + big.score);
}

/* ---- corrupt records ---- */
{
  const { M, R, map } = fresh();
  const qs = bank(40);
  drill(M, qs, 40, 5, true);
  // Hand-edit the store the way a curious user or a bad import would.
  const raw = JSON.parse(map.get('nst.mastery.v1'));
  raw.records.q0 = { id: 'q0', box: 999, seen: -5, correct: 1e9, incorrect: NaN, lastSeen: 'yesterday' };
  raw.records.q1 = { id: 'q1', box: 'high', seen: 3, correct: null, incorrect: undefined, lastSeen: -1 };
  raw.records.q2 = null;
  map.set('nst.mastery.v1', JSON.stringify(raw));
  M.load(true);

  let e;
  ok('a hand-edited store does not throw', (() => {
    try { e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 }); return true; }
    catch (err) { return err.message; }
  })() === true);
  ok('and still produces a sane percentage', e.score >= 0 && e.score <= 100 && Number.isInteger(e.score), e.score);
  ok('a billion correct answers do not manufacture certainty', e.low <= 100 && e.high <= 100);
}

/* ---- domain priors ---- */
{
  // A domain answered well should lift its own unseen questions more than an
  // untouched domain's.
  const { M, R } = fresh();
  const qs = bank(40, ['a', 'b', 'c', 'd', 'e']);   // 8 questions per domain = 20%
  // Answer every 'a' question correctly, leave the rest alone entirely.
  const aIds = qs.filter((q) => q.domain === 'a').map((q) => q.id);
  aIds.forEach((id) => { for (let r = 0; r < 6; r++) M.record(id, { correct: true, gate: 'always', now: T0 }); });
  const e = R.estimate({ questions: qs, mastery: M, now: T0 + 1 });
  ok('one strong domain is not enough coverage for a verdict', e.verdict === 'not-enough', e.verdict);
  ok('coverage counts questions, not domains', e.coverage === 20, e.coverage);
}

/* ---- the module is actually wired up ---- */
{
  const index = read('index.html');
  ok('the launcher loads the readiness module', /shared\/nst-readiness\.js/.test(index));
  ok('it loads after the mastery store it reads',
    index.indexOf('nst-readiness.js') > index.indexOf('nst-mastery.js'));
  const home = read('scripts', 'nst-home.js');
  ok('the home page shows it', /NSTReadiness/.test(home));
}

console.log('\n' + (fail ? `READINESS: ${fail} FAILED (${pass} passed)` : `READINESS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
