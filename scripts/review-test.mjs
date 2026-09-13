/* review-test.mjs — the due-review queue.
 *
 * The queue's failure modes are not crashes, they are sessions nobody finishes
 * or sessions that study the wrong thing:
 *
 *   - a barely-started bank producing a 240-question "review" of material never
 *     seen, because the scheduler counts unseen questions as due
 *   - new material crowding out cards that are actively decaying
 *   - a queue that reshuffles between the count shown and the session started
 *   - a count that contradicts the session length after the cap applies
 *
 * Runs against the real NSTMastery, so the queue and the scheduler cannot
 * disagree about what "due" means.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/review-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
const MASTERY_SRC = read('shared', 'nst-mastery.js');
const REVIEW_SRC = read('shared', 'nst-review.js');

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
  run(REVIEW_SRC);
  return { M: win.NSTMastery, R: win.NSTReview, map };
}

const T0 = 1_700_000_000_000;
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

function bank(n) {
  const qs = [];
  for (let i = 0; i < n; i++) qs.push({ id: 'q' + i, domain: 'd' + (i % 4) });
  return qs;
}

/* ---- nothing at all ---- */
{
  const { M, R } = fresh();
  ok('an empty bank yields an empty queue', R.dueQueue({ questions: [], mastery: M, now: T0 }).total === 0);
  ok('no mastery store yields an empty queue', R.dueQueue({ questions: bank(5), mastery: null, now: T0 }).total === 0);
  ok('an empty queue describes itself plainly',
    /nothing due/i.test(R.describe(R.dueQueue({ questions: [], mastery: M, now: T0 }))));
  ok('describe() survives being handed nothing', /nothing due/i.test(R.describe(null)));
}

/* ---- overdue comes before new ---- */
{
  const { M, R } = fresh();
  const qs = bank(40);
  // Answer four questions and let them fall due; the other 36 are untouched.
  ['q10', 'q11', 'q12', 'q13'].forEach((id) => M.record(id, { correct: true, gate: 'always', now: T0 }));
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 10, now: T0 + 30 * DAY });

  ok('the whole due set is counted, not just the session', q.total === 40, q.total);
  ok('overdue and new are counted apart', q.overdue === 4 && q.fresh === 36, `${q.overdue}/${q.fresh}`);
  const first4 = q.questions.slice(0, 4).map((x) => x.id).sort();
  ok('every overdue card comes before any new one',
    JSON.stringify(first4) === JSON.stringify(['q10', 'q11', 'q12', 'q13']), first4.join(','));
  ok('new material fills the remaining room', q.questions.length === 10, q.questions.length);
  ok('the cap is reported', q.capped === true);
  ok('the description separates the two kinds of work',
    /4 due again/.test(R.describe(q)) && /36 new/.test(R.describe(q)), R.describe(q));
  ok('a capped session says how long it actually is',
    /covers 10/.test(R.describe(q)), R.describe(q));
}

/* ---- oldest due date first ---- */
{
  const { M, R } = fresh();
  const qs = bank(10);
  // Answer three at different times; all reach box 1 (a 30s interval), so their
  // due dates are ordered by when they were answered.
  M.record('q5', { correct: true, gate: 'always', now: T0 });
  M.record('q1', { correct: true, gate: 'always', now: T0 + 10 * MIN });
  M.record('q8', { correct: true, gate: 'always', now: T0 + 20 * MIN });
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 3, now: T0 + DAY });
  const ids = q.questions.map((x) => x.id);
  ok('the longest-waiting card is first', ids[0] === 'q5', ids.join(','));
  ok('then the next longest', ids[1] === 'q1', ids.join(','));
  ok('then the most recent', ids[2] === 'q8', ids.join(','));
}
{
  // A high box with a long interval that lapsed long ago must outrank a low box
  // that only just came due -- the due DATE is what orders them, not the box.
  const { M, R } = fresh();
  const qs = bank(10);
  for (let i = 0; i < 6; i++) M.record('q2', { correct: true, gate: 'always', now: T0 + i * 10 * DAY });
  M.record('q7', { correct: true, gate: 'always', now: T0 + 100 * DAY });
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 2, now: T0 + 200 * DAY });
  ok('order follows the due date, not the box', q.questions[0].id === 'q2',
    q.questions.map((x) => x.id).join(','));
}

/* ---- stability: the same inputs give the same queue ---- */
{
  const { M, R } = fresh();
  const qs = bank(30);
  for (let i = 0; i < 12; i++) M.record('q' + i, { correct: true, gate: 'always', now: T0 });
  const a = R.dueQueue({ questions: qs, mastery: M, limit: 8, now: T0 + DAY });
  const b = R.dueQueue({ questions: qs, mastery: M, limit: 8, now: T0 + DAY });
  ok('the queue does not reshuffle between calls',
    a.questions.map((x) => x.id).join(',') === b.questions.map((x) => x.id).join(','));
  ok('ties keep the bank order', a.questions[0].id === 'q0', a.questions.map((x) => x.id).join(','));
}

/* ---- nothing due ---- */
{
  const { M, R } = fresh();
  const qs = bank(6);
  // Answer everything and look immediately: box 1's interval has not elapsed.
  for (const q of qs) M.record(q.id, { correct: true, gate: 'always', now: T0 });
  const q = R.dueQueue({ questions: qs, mastery: M, now: T0 + 1 });
  ok('a freshly answered bank has nothing due', q.total === 0, q.total);
  ok('and no questions to hand to a session', q.questions.length === 0);
  ok('and is not marked capped', q.capped === false);
}

/* ---- the cap ---- */
{
  const { M, R } = fresh();
  const qs = bank(100);
  const q = R.dueQueue({ questions: qs, mastery: M, now: T0 });
  ok('an untouched bank defaults to a finishable session',
    q.questions.length === R.DEFAULT_LIMIT, q.questions.length);
  ok('but still reports the real total', q.total === 100, q.total);
  ok('and says it is only a slice', q.capped === true);
}
{
  const { M, R } = fresh();
  const qs = bank(10);
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 50, now: T0 });
  ok('a limit larger than the bank is not padded', q.questions.length === 10, q.questions.length);
  ok('and nothing is marked capped', q.capped === false);
}
{
  const { M, R } = fresh();
  const qs = bank(10);
  for (const bad of [0, -5, NaN, 'lots', null, undefined]) {
    const q = R.dueQueue({ questions: qs, mastery: M, limit: bad, now: T0 });
    ok('a limit of ' + JSON.stringify(bad) + ' falls back to something sane',
      q.questions.length > 0 && q.questions.length <= 25, q.questions.length);
  }
}

/* ---- the session is a real subset of the bank ---- */
{
  const { M, R } = fresh();
  const qs = bank(60);
  for (let i = 0; i < 20; i++) M.record('q' + i, { correct: i % 2 === 0, gate: 'always', now: T0 });
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 25, now: T0 + 10 * DAY });
  const ids = q.questions.map((x) => x.id);
  ok('no question appears twice', new Set(ids).size === ids.length);
  ok('every question came from the bank', ids.every((id) => qs.some((x) => x.id === id)));
  ok('the session never exceeds its limit', q.questions.length <= 25, q.questions.length);
  ok('the counts add up', q.overdue + q.fresh === q.total, `${q.overdue}+${q.fresh} vs ${q.total}`);
}

/* ---- corrupt records ---- */
{
  const { M, R, map } = fresh();
  const qs = bank(20);
  for (let i = 0; i < 10; i++) M.record('q' + i, { correct: true, gate: 'always', now: T0 });
  const raw = JSON.parse(map.get('nst.mastery.v1'));
  raw.records.q0 = { id: 'q0', box: 1e9, seen: 2, correct: 2, incorrect: 0, lastSeen: 'never' };
  raw.records.q1 = { id: 'q1', box: -3, seen: 1, correct: 1, incorrect: 0, lastSeen: NaN };
  raw.records.q2 = null;
  map.set('nst.mastery.v1', JSON.stringify(raw));
  M.load(true);

  let q;
  ok('a hand-edited store does not throw', (() => {
    try { q = R.dueQueue({ questions: qs, mastery: M, limit: 10, now: T0 + DAY }); return true; }
    catch (e) { return e.message; }
  })() === true);
  ok('and still yields a usable session', q.questions.length > 0 && q.questions.length <= 10, q.questions.length);
  ok('with no holes in it', q.questions.every((x) => x && x.id));
  ok('and counts that still add up', q.overdue + q.fresh === q.total);
}

/* ---- the headline number is the real one ---- */
{
  const { M, R } = fresh();
  const qs = bank(300);
  const q = R.dueQueue({ questions: qs, mastery: M, limit: 25, now: T0 });
  ok('a capped queue still reports the true total', q.total === 300, q.total);
  ok('the session is the capped slice', q.questions.length === 25, q.questions.length);
  ok('the two numbers are deliberately different here', q.total !== q.questions.length);
  // A card headed "Review 25 due" beside "300 new" contradicts itself, so the
  // headline's number is never the session length. (Until v2.69.0 this was
  // asserted against the app source, which hardcoded `dq.total`; the number is
  // right but the WORD was not -- see the headline group below.)
  const h = R.headline(q);
  ok('the headline never prints the session length as its number',
    h.title.indexOf('25') === -1, h.title);
  ok('and the session length is stated separately',
    /covers /.test(R.describe(q)), R.describe(q));
  ok('the app composes its card from headline(), not its own wording',
    /Review\.headline\(dq\)/.test(read('practice-exams', 'app.js')));
}

/* ---- the headline says which KIND of work this is ----
 *
 * dueQueue() has always separated overdue from new, "because those two are
 * different kinds of work and a reader plans differently for each". The card
 * headline did not: on a fresh install Practice Exams read
 *
 *   REVIEW | Review 255 due | "The questions the scheduler wants back today"
 *          | 255 new · this session covers 25
 *
 * -- three claims of revision over a facts line saying every one was new. */
{
  const { M, R } = fresh();
  const qs = bank(40);

  // Nothing answered: this is a first pass, not revision.
  const allNew = R.dueQueue({ questions: qs, mastery: M, limit: 25, now: T0 });
  const hNew = R.headline(allNew);
  ok('a queue of nothing but new questions is not headed "Review"', !/review/i.test(hNew.title), hNew.title);
  ok('it is headed with what it is', /start 40 new/i.test(hNew.title), hNew.title);
  ok('its tag stops saying REVIEW too', hNew.tag === 'START', hNew.tag);
  ok('and the paragraph stops claiming the scheduler wants them back',
    !/wants back/.test(hNew.blurb), hNew.blurb);
  ok('the button matches the work', /studying/i.test(hNew.cta), hNew.cta);
  ok('the headline never contradicts the facts line beside it',
    /40 new/.test(R.describe(allNew)) && /40 new/i.test(hNew.title));

  // [neg] the old wording on the same fixture: the control that shows this
  // fixture can tell the two apart, rather than passing anything.
  const oldTitle = 'Review ' + allNew.total + ' due';
  ok('[neg] the wording this replaced calls 40 never-answered questions a review',
    /review/i.test(oldTitle) && allNew.overdue === 0);

  // Four answered and fallen due, thirty-six untouched.
  ['q10', 'q11', 'q12', 'q13'].forEach((id) => M.record(id, { correct: true, gate: 'always', now: T0 }));
  const mixed = R.dueQueue({ questions: qs, mastery: M, limit: 25, now: T0 + 30 * DAY });
  const hMix = R.headline(mixed);
  ok('a mixed queue is headed Review again', hMix.tag === 'REVIEW' && /review/i.test(hMix.title));
  ok('the number in the heading is the one its own word applies to',
    /review 4 due/i.test(hMix.title), hMix.title);
  ok('it does not recount new material as revision', hMix.title.indexOf('40') === -1, hMix.title);
  ok('and it agrees with the facts line', /4 due again/.test(R.describe(mixed)));
  ok('the paragraph says new material fills the rest of the session',
    /new material/.test(hMix.blurb), hMix.blurb);

  // [neg] a headline that always said START would fail here.
  ok('[neg] the same fixture answered differently produces a different tag',
    hNew.tag !== hMix.tag, hNew.tag + '/' + hMix.tag);

  // Everything overdue: the case the original wording was written for, unchanged.
  const { M: M2, R: R2 } = fresh();
  const small = bank(4);
  ['q0', 'q1', 'q2', 'q3'].forEach((id) => M2.record(id, { correct: true, gate: 'always', now: T0 }));
  const allOld = R2.dueQueue({ questions: small, mastery: M2, limit: 25, now: T0 + 30 * DAY });
  const hOld = R2.headline(allOld);
  ok('an all-overdue queue keeps the wording it always had',
    hOld.tag === 'REVIEW' && /review 4 due/i.test(hOld.title), hOld.title);
  ok('with no new material it does not promise any', !/new material/.test(hOld.blurb), hOld.blurb);
  ok('the scheduler sentence survives where it is true', /wants back/.test(hOld.blurb));

  // Empty and malformed.
  const none = R.headline(R.dueQueue({ questions: [], mastery: M, now: T0 }));
  ok('an empty queue says nothing is due', /nothing due/i.test(none.title), none.title);
  ok('headline() survives being handed nothing', /nothing due/i.test(R.headline(null).title));
  ['tag', 'title', 'blurb', 'cta'].forEach((k) => {
    ok('every headline carries a ' + k, typeof hNew[k] === 'string' && hNew[k].length > 0);
  });
}

/* ---- one question's own history ---- */
{
  const { M, R } = fresh();
  ok('a question never answered has no history to show',
    R.historyLine(null, M, T0) === null);
  ok('neither does an empty record',
    R.historyLine({ id: 'q0', seen: 0, correct: 0, incorrect: 0, box: 0 }, M, T0) === null);
}
{
  const { M, R } = fresh();
  M.record('q0', { correct: true, gate: 'always', now: T0 });
  const line = R.historyLine(M.get('q0'), M, T0 + 1);
  ok('one sighting is singular', /Seen 1 time\b/.test(line), line);
  ok('the split is reported', /1 right, 0 wrong/.test(line), line);
  ok('and when it comes back', /back in |due now/.test(line), line);
}
{
  const { M, R } = fresh();
  for (const c of [true, false, false, false]) M.record('q0', { correct: c, gate: 'always', now: T0 });
  const line = R.historyLine(M.get('q0'), M, T0 + 1);
  ok('several sightings are plural', /Seen 4 times/.test(line), line);
  ok('the record is what it is', /1 right, 3 wrong/.test(line), line);
}
{
  // A card that fell due says so, rather than counting toward a return.
  const { M, R } = fresh();
  M.record('q0', { correct: true, gate: 'always', now: T0 });
  const line = R.historyLine(M.get('q0'), M, T0 + 400 * DAY);
  ok('an overdue card says it is due now', /due now/.test(line), line);
  ok('and does not also promise a return', !/back in/.test(line), line);
}
{
  // Ungraded sightings: a lifeline can carry an answer, leaving seen > 0 with no
  // right/wrong split. "0 right, 0 wrong" beside "seen 3 times" reads as a bug.
  const { M, R } = fresh();
  const line = R.historyLine({ id: 'q0', seen: 3, correct: 0, incorrect: 0, box: 2, lastSeen: T0 }, M, T0 + 1);
  ok('an ungraded record reports the sightings', /Seen 3 times/.test(line), line);
  ok('and claims no right/wrong split', !/right,/.test(line), line);
}
{
  const { M, R } = fresh();
  // Hand-edited nonsense must still produce a sentence, not NaN.
  const line = R.historyLine({ id: 'q0', seen: 'lots', correct: -4, incorrect: NaN, box: 1e9, lastSeen: 'never' }, M, T0);
  ok('a corrupt record does not print NaN', line === null || !/NaN|undefined|-\d/.test(line), line);
}
{
  // The wording must be the mastery store's, not a second copy.
  const { M, R } = fresh();
  M.record('q0', { correct: true, gate: 'always', now: T0 });
  const rec = M.get('q0');
  const mine = R.historyLine(rec, M, T0 + 1);
  const theirs = M.untilText(M.dueAt(rec), T0 + 1);
  ok('the return wording comes from the scheduler itself',
    theirs === null || mine.indexOf(theirs) >= 0, mine + ' vs ' + theirs);
}
{
  // Without a mastery store it still says what it can, rather than throwing.
  const { R } = fresh();
  const line = R.historyLine({ id: 'q0', seen: 2, correct: 1, incorrect: 1, box: 1, lastSeen: T0 }, null, T0);
  ok('no scheduler still yields the record', /Seen 2 times/.test(line) && /1 right, 1 wrong/.test(line), line);
  ok('and simply omits the return', !/back|due now/.test(line), line);
}

/* ---- Practice Exams actually offers this ---- */
{
  const app = read('practice-exams', 'app.js');
  ok('the entry screen builds a due queue', /NSTReview/.test(app));
  ok('it starts a session from an explicit question list', /questions:\s*/.test(app));
  const index = read('practice-exams', 'index.html');
  ok('Practice Exams loads the module', /shared\/nst-review\.js/.test(index));
  const pm = read('practice-exams', 'practice-mode.js');
  ok('practice mode shows a question its own history', /historyLine/.test(pm));
  ok('and only once there is more than this sighting to report', /rec\.seen > 1/.test(pm));
  ok('it loads after the mastery store it reads',
    index.indexOf('nst-review.js') > index.indexOf('nst-mastery.js'));
}

/* ---- (v2.47.0) does the queue actually teach? ----
 *
 * Everything above checks the queue's MECHANICS: what counts as due, what gets
 * capped, what order things come back in. All necessary, and none of it asks the
 * question a learner is actually relying on:
 *
 *   if I keep getting a question wrong, does it come back more often than one
 *   I keep getting right?
 *
 * That is the entire premise of spaced repetition and the reason this app
 * schedules anything at all. A scheduler can satisfy every mechanical rule above
 * and still present all 255 questions in a flat rotation -- every check green,
 * and the learner spending equal time on what they know and what they do not.
 *
 * So: simulate a learner of KNOWN behaviour over simulated weeks, driving the
 * real NSTMastery and the real dueQueue, and count how often each card is
 * actually put in front of them.
 *
 * This is the same shape as the readiness calibration in v2.35.0, and for the
 * same reason. The machinery being right is not the same as the number meaning
 * what it says.
 */
{
  const { M, R } = fresh();
  const MIN_ = 60_000, HOUR_ = 60 * MIN_, DAY_ = 24 * HOUR_;

  /* Thirty cards in three profiles. The learner is perfectly consistent, which
   * is not realistic and is exactly what makes the result readable: any
   * difference in exposure is the scheduler's doing, not noise. */
  const PROFILE = {};
  const questions = [];
  for (let i = 0; i < 30; i++) {
    const id = 'q' + i;
    questions.push({ id });
    PROFILE[id] = i < 10 ? 'always-wrong' : (i < 20 ? 'always-right' : 'mixed');
  }
  const answers = { 'always-wrong': () => false, 'always-right': () => true };
  let flip = false;
  answers.mixed = () => (flip = !flip);

  /* Study every 30 minutes for three simulated weeks. A session takes whatever
   * the queue offers, up to twenty cards. */
  const seen = {};
  questions.forEach((q) => { seen[q.id] = 0; });
  let t = T0, sessions = 0;
  const END = T0 + 21 * DAY_;
  while (t < END) {
    const due = R.dueQueue({ questions, mastery: M, now: t, limit: 20 });
    if (due.questions.length) {
      sessions++;
      for (const q of due.questions) {
        seen[q.id]++;
        M.record(q.id, { correct: answers[PROFILE[q.id]](), gate: 'due', step: 1, now: t });
      }
    }
    t += 30 * MIN_;
  }

  const total = (kind) => questions
    .filter((q) => PROFILE[q.id] === kind)
    .reduce((n, q) => n + seen[q.id], 0);
  const wrong = total('always-wrong'), right = total('always-right'), mixed = total('mixed');

  /* Printed unconditionally, not only on failure: this is the scheduler's
   * behaviour in one line, and a drift in it is worth seeing in a CI log even
   * while the thresholds still pass. */
  console.log('     . ' + sessions + ' sessions over 21 simulated days -- exposures: ' +
    'always-wrong ' + wrong + ', mixed ' + mixed + ', always-right ' + right +
    ' (' + (wrong / right).toFixed(1) + 'x more often wrong than right)');
  ok('the simulation actually ran sessions', sessions > 50, sessions + ' sessions');
  ok('and put every card in front of the learner at least once',
    questions.every((q) => seen[q.id] > 0),
    JSON.stringify(questions.filter((q) => !seen[q.id]).map((q) => q.id)));

  /* THE POINT. Ten cards always wrong against ten always right, same period. */
  ok('a card you keep getting WRONG comes back more than one you keep getting right',
    wrong > right, `wrong ${wrong} vs right ${right}`);
  ok('and substantially more -- at least three times as often',
    wrong >= right * 3, `wrong ${wrong} vs right ${right} (ratio ${(wrong / right).toFixed(1)}x)`);
  ok('a half-right card lands between the two, not outside them',
    mixed > right && mixed < wrong, `wrong ${wrong}, mixed ${mixed}, right ${right}`);

  /* The mechanism, so a failure above is diagnosable rather than mysterious. */
  const wrongRec = M.get('q0'), rightRec = M.get('q15');
  ok('the card answered wrong sits in a low box', wrongRec.box <= 1, JSON.stringify(wrongRec.box));
  ok('the card answered right has climbed', rightRec.box >= 4, JSON.stringify(rightRec.box));
  ok('so its interval is longer, which is what spaces it out',
    M.intervalFor(rightRec.box) > M.intervalFor(wrongRec.box),
    `${M.intervalFor(rightRec.box)}ms vs ${M.intervalFor(wrongRec.box)}ms`);

  /* Not vacuous: a flat scheduler that ignores correctness passes every
   * mechanical check above and fails this one. Model it and show the difference. */
  {
    const flat = {};
    questions.forEach((q) => { flat[q.id] = 0; });
    let ft = T0;
    while (ft < END) {
      /* Every card due every time -- the failure mode this section exists for. */
      for (const q of questions.slice(0, 20)) flat[q.id]++;
      ft += 30 * MIN_;
    }
    const fWrong = questions.filter((q) => PROFILE[q.id] === 'always-wrong')
      .reduce((n, q) => n + flat[q.id], 0);
    const fRight = questions.filter((q) => PROFILE[q.id] === 'always-right')
      .reduce((n, q) => n + flat[q.id], 0);
    ok('self-check: a flat rotation shows wrong and right cards equally often',
      fWrong === fRight, `${fWrong} vs ${fRight}`);
    ok('self-check: and would therefore FAIL the ratio check above',
      !(fWrong >= fRight * 3), `${fWrong} vs ${fRight}`);
  }
}

console.log('\n' + (fail ? `REVIEW: ${fail} FAILED (${pass} passed)` : `REVIEW: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
