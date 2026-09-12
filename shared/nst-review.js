/* Nutanix Study Tool — the due-review queue (window.NSTReview).
 *
 * The dashboard says "9 due now". This turns that number into the actual list,
 * in the order worth answering.
 *
 * THREE DECISIONS, ALL OF THEM ARGUABLE, SO ALL OF THEM HERE AND TESTED
 *
 *   1. OVERDUE BEFORE NEW. `NSTMastery.isDue()` counts a never-answered question
 *      as due, which is right for the scheduler and wrong for a review session:
 *      a 255-question bank you have barely started would produce a "review" of
 *      240 questions you have never seen. Cards you have learned and are losing
 *      come first; new material fills whatever room is left.
 *
 *   2. OLDEST DUE DATE FIRST, among the overdue. That is the ordinary
 *      spaced-repetition rule and it needs no defending: the card that has been
 *      waiting longest is the one decaying furthest.
 *
 *   3. THE SESSION IS CAPPED, and the cap is stated. An uncapped queue on a
 *      fully-due bank is a 255-question sitting nobody finishes, and an
 *      abandoned review is worse than a short one -- the scheduler only learns
 *      from answers.
 *
 * Pure: no DOM, no storage. Tested headlessly by scripts/review-test.mjs.
 */
(function () {
  "use strict";

  /* Enough to be worth doing, short enough to finish. */
  var DEFAULT_LIMIT = 25;

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  /* dueQueue({ questions, mastery, limit, now })
   *
   * Returns { questions, total, overdue, fresh, capped } where `questions` is
   * the capped, ordered list to hand to a study mode, and the counts describe
   * the whole due set, not the slice -- a caller saying "9 due" should not be
   * contradicted by a session of 25.
   */
  function dueQueue(opts) {
    opts = opts || {};
    var qs = opts.questions || [];
    var M = opts.mastery || null;
    var now = opts.now == null ? Date.now() : opts.now;
    var limit = Math.max(1, Math.round(num(opts.limit) || DEFAULT_LIMIT));

    var empty = { questions: [], total: 0, overdue: 0, fresh: 0, capped: false, limit: limit };
    if (!qs.length || !M) return empty;

    var overdue = [];   // seen before, and the interval has elapsed
    var fresh = [];     // never answered
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      var rec = M.get(q.id);
      if (!M.isDue(rec, now)) continue;
      if (rec && rec.seen) {
        var interval = M.intervalFor ? num(M.intervalFor(rec.box)) : 0;
        overdue.push({ q: q, at: num(rec.lastSeen) + interval, order: i });
      } else {
        fresh.push({ q: q, order: i });
      }
    }

    // Oldest due date first; ties keep the bank's authored order so the queue is
    // stable across calls rather than reshuffling on every render.
    overdue.sort(function (a, b) { return (a.at - b.at) || (a.order - b.order); });

    var picked = [];
    for (var j = 0; j < overdue.length && picked.length < limit; j++) picked.push(overdue[j].q);
    for (var k = 0; k < fresh.length && picked.length < limit; k++) picked.push(fresh[k].q);

    var total = overdue.length + fresh.length;
    return {
      questions: picked,
      total: total,
      overdue: overdue.length,
      fresh: fresh.length,
      capped: total > picked.length,
      limit: limit,
    };
  }

  /* The one-line description of a queue, so every surface says it the same way.
   * "6 due again · 3 new" -- never just a total, because those two are different
   * kinds of work and a reader plans differently for each. */
  function describe(qd) {
    if (!qd || !qd.total) return "Nothing due right now.";
    var parts = [];
    if (qd.overdue) parts.push(qd.overdue + " due again");
    if (qd.fresh) parts.push(qd.fresh + " new");
    var s = parts.join(" · ");
    if (qd.capped) s += " · this session covers " + qd.questions.length;
    return s;
  }

  /* What the store knows about ONE question, as a sentence to show beside it.
   *
   * "Seen 4 times · 1 right, 3 wrong · back in 2 days"
   *
   * This is the answer to "why is this domain weak" at the level someone can act
   * on: not a score, but the record. Returns null for a question never answered
   * -- there is no history to report, and "Seen 0 times" beside a question you
   * are seeing for the first time is noise.
   *
   * `mastery` is passed in rather than read off window so the wording and the
   * scheduler can never disagree about when a card returns.
   */
  function historyLine(rec, mastery, now) {
    if (!rec || !rec.seen) return null;
    var M = mastery || null;
    var t = now == null ? Date.now() : now;
    var seen = Math.max(0, Math.round(num(rec.seen)));
    var right = Math.max(0, Math.round(num(rec.correct)));
    var wrong = Math.max(0, Math.round(num(rec.incorrect)));

    var parts = ["Seen " + seen + (seen === 1 ? " time" : " times")];
    // Only claim a right/wrong split when there is one to report: a card can be
    // seen without being graded (a lifeline carried it), and "0 right, 0 wrong"
    // next to "seen 3 times" reads as a bug.
    if (right || wrong) parts.push(right + " right, " + wrong + " wrong");

    if (M && M.isDue && M.isDue(rec, t)) {
      parts.push("due now");
    } else if (M && M.dueAt && M.untilText) {
      var back = M.untilText(M.dueAt(rec), t);
      if (back) parts.push("back " + back);
    }
    return parts.join(" · ");
  }

  window.NSTReview = {
    dueQueue: dueQueue,
    historyLine: historyLine,
    describe: describe,
    DEFAULT_LIMIT: DEFAULT_LIMIT,
  };
})();
