/* Nutanix Study Tool — the exam-readiness estimate (window.NSTReadiness).
 *
 * THE QUESTION THIS ANSWERS
 * "If I sat the exam today, would I pass?" It is the most useful thing a study
 * tool can say and the easiest thing to get dishonestly wrong, so the whole
 * design here is about not overstating.
 *
 * THE MODEL, IN FULL
 * For every question in the bank, estimate P(correct) and average across the
 * whole bank. Four rules keep that honest:
 *
 *   1. NEVER BELOW GUESSING. A four-option question is right a quarter of the
 *      time even from someone who has never seen it, so each question's floor is
 *      its own blind-guess probability: 1/n for a single answer, 1/C(n,k) for a
 *      "choose k" — which is far harsher, as it should be.
 *
 *   2. EVIDENCE IS SMOOTHED, AND SO IS THE PRIOR. One correct answer is not
 *      proof. Each question's observed accuracy is Laplace-smoothed toward a
 *      prior: the person's accuracy in that domain if the domain has been
 *      sampled, else their overall accuracy. That prior is ITSELF smoothed
 *      toward chance -- otherwise a short perfect streak produces a prior of
 *      1.0, smoothing toward it does nothing, and the estimate hits 100% on a
 *      single pass through the bank. (It did, until the tests said so.)
 *
 *   3. TIME ONLY EVER LOWERS THE ESTIMATE. A question answered right six months
 *      ago and not since is weaker evidence than one from yesterday, so an
 *      overdue card decays back toward its blind-guess floor -- never toward the
 *      prior, which is built from the same ageing data and would barely move.
 *      Decay bottoms out at half the demonstrated edge over guessing: you keep
 *      something for having known it, however long you have been away. Since the
 *      target is the floor, decay can only ever reduce, so a demonstrated miss
 *      is never forgiven by the calendar.
 *
 *   4. BELOW A QUARTER OF THE BANK SEEN, THERE IS NO VERDICT. At low coverage
 *      the number is mostly prior — an opinion wearing a percentage. It says
 *      "not enough yet" and how much more would change that.
 *
 * The result is reported as a BAND, never a point. The width comes from the
 * sampling variance of an `examSize`-question draw plus a model term that grows
 * with the share of the bank never seen. A verdict is only given when the whole
 * band sits on one side of the pass mark.
 *
 * Pure: no DOM, no storage. Tested headlessly by scripts/readiness-test.mjs.
 */
(function () {
  "use strict";

  /* Below this share of the bank seen, the estimate is mostly prior. */
  var MIN_COVERAGE = 0.25;
  /* Laplace strength: how many prior-weighted observations a question starts with.
   * 2 means a single correct answer moves the estimate but does not own it. */
  var SMOOTHING = 2;
  /* How far an overdue card can decay toward the prior. Never to zero: having
   * answered it right once is still evidence, just weaker. */
  var RETENTION_FLOOR = 0.5;
  /* A domain needs this many answers before it is a better prior than the
   * overall average. */
  var DOMAIN_PRIOR_MIN = 4;
  /* How hard the prior itself is pulled back toward chance. Deliberately
   * stronger than SMOOTHING: a prior built from a handful of answers should not
   * be allowed to assert certainty on every unseen question in its domain. */
  var PRIOR_SMOOTHING = 6;
  /* Extra uncertainty, in probability points, per unit of unseen bank. At the
   * 25% coverage floor this is ~11 points of band on top of sampling noise. */
  var MODEL_SD = 0.15;
  var Z95 = 1.96;

  var DEFAULT_PASS = 0.8;
  var DEFAULT_EXAM_SIZE = 75;
  var DEFAULT_CHANCE = 0.25;      /* four options, one answer */

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  function choose(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1;
    for (var i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return r;
  }

  /* The probability of getting this question right by guessing alone. */
  function chanceFor(q) {
    if (!q) return DEFAULT_CHANCE;
    var n = q.options && q.options.length ? q.options.length : 0;
    if (n < 2) return DEFAULT_CHANCE;
    var k = Array.isArray(q.correct) ? q.correct.length : 1;
    if (k < 1 || k > n) return DEFAULT_CHANCE;
    var ways = k === 1 ? n : choose(n, k);
    return ways > 0 ? 1 / ways : DEFAULT_CHANCE;
  }

  /* estimate({ questions, mastery, pass, examSize, now })
   *
   * questions: the active bank's questions ({ id, domain, options, correct })
   * mastery:   window.NSTMastery (used for its records and its interval policy,
   *            so the estimate can never disagree with the scheduler)
   */
  function estimate(opts) {
    opts = opts || {};
    var qs = opts.questions || [];
    var M = opts.mastery || null;
    var now = opts.now == null ? Date.now() : opts.now;
    var passP = clamp01(opts.pass == null ? DEFAULT_PASS : Number(opts.pass) || DEFAULT_PASS);
    var examSize = Math.max(1, Math.round(num(opts.examSize) || DEFAULT_EXAM_SIZE));
    var total = qs.length;

    var blank = {
      verdict: "not-enough", label: "Not enough data yet", ready: null,
      score: 0, low: 0, high: 0, pass: Math.round(passP * 100),
      coverage: 0, seen: 0, total: total, minCoverage: Math.round(MIN_COVERAGE * 100),
      needMore: 0, examSize: examSize,
      detail: total
        ? "Answer more of the bank and this becomes a real estimate."
        : "Pick an exam to estimate readiness.",
    };
    if (!total || !M) return blank;

    /* ---- pass 1: gather evidence, per domain and overall ---------------- */
    var recs = [];
    var chances = [];
    var domAcc = {};                 // domain -> { c, n }
    var allC = 0, allN = 0, seen = 0, chanceSum = 0;
    for (var i = 0; i < total; i++) {
      var q = qs[i];
      var rec = M.get(q.id);
      recs.push(rec);
      var ch = chanceFor(q);
      chances.push(ch);
      chanceSum += ch;
      if (!rec || !rec.seen) continue;
      seen++;
      var c = num(rec.correct), w = num(rec.incorrect), n = c + w;
      if (!n) continue;
      allC += c; allN += n;
      var d = q.domain || "General";
      var a = domAcc[d] || (domAcc[d] = { c: 0, n: 0 });
      a.c += c; a.n += n;
    }

    var coverage = seen / total;
    var baseline = total ? chanceSum / total : DEFAULT_CHANCE;

    /* A domain is only a better prior than the overall average once it has been
     * sampled enough to mean something. Whichever is used, it is pulled back
     * toward the bank's average blind-guess rate in proportion to how little it
     * rests on -- so a 4-for-4 domain is a prior of about 0.7, not 1.0. */
    function smoothPrior(c, n) { return (c + PRIOR_SMOOTHING * baseline) / (n + PRIOR_SMOOTHING); }
    var overall = allN ? smoothPrior(allC, allN) : null;

    function priorFor(domain, fallback) {
      var a = domAcc[domain || "General"];
      if (a && a.n >= DOMAIN_PRIOR_MIN) return smoothPrior(a.c, a.n);
      return overall == null ? fallback : overall;
    }

    /* ---- pass 2: P(correct) per question -------------------------------- */
    var ps = [];
    for (var j = 0; j < total; j++) {
      var qq = qs[j];
      var r = recs[j];
      var floor = chances[j];
      var prior = clamp01(priorFor(qq.domain, floor));
      var p;

      if (!r || !r.seen) {
        p = prior;                                  // unseen: the prior is all we have
      } else {
        var cc = num(r.correct), ww = num(r.incorrect), nn = cc + ww;
        p = (cc + SMOOTHING * prior) / (nn + SMOOTHING);

        /* Rule 3: an overdue card decays back toward its blind-guess floor. The
         * target is the floor, not the prior, so this can only ever reduce. */
        var interval = M.intervalFor ? num(M.intervalFor(r.box)) : 0;
        var retention;
        if (interval <= 0) {
          // box 0 is "always due" -- the scheduler does not consider it learned.
          retention = RETENTION_FLOOR;
        } else {
          var staleness = (now - num(r.lastSeen)) / interval;
          // sqrt, not linear: two weeks off should not cost what a year does.
          retention = staleness <= 1 ? 1 : Math.max(RETENTION_FLOOR, 1 / Math.sqrt(staleness));
        }
        p = floor + (p - floor) * retention;
      }

      // Rule 1 last, so nothing above can push a question below guessing.
      ps.push(clamp01(Math.max(p, floor)));
    }

    /* ---- roll up -------------------------------------------------------- */
    var sum = 0, varSum = 0;
    for (var k = 0; k < ps.length; k++) { sum += ps[k]; varSum += ps[k] * (1 - ps[k]); }
    var mean = sum / total;
    var meanVar = (varSum / total) / Math.min(examSize, total);
    var unseenShare = 1 - coverage;
    var modelVar = Math.pow(MODEL_SD * unseenShare, 2);
    var sd = Math.sqrt(meanVar + modelVar);

    var score = clamp01(mean) * 100;
    var low = clamp01(mean - Z95 * sd) * 100;
    var high = clamp01(mean + Z95 * sd) * 100;
    var passPct = passP * 100;

    var out = {
      score: Math.round(score),
      low: Math.round(low),
      high: Math.round(high),
      pass: Math.round(passPct),
      coverage: Math.round(coverage * 100),
      seen: seen,
      total: total,
      examSize: examSize,
      minCoverage: Math.round(MIN_COVERAGE * 100),
      needMore: Math.max(0, Math.ceil(MIN_COVERAGE * total) - seen),
    };

    if (coverage < MIN_COVERAGE) {
      out.verdict = "not-enough";
      out.label = "Not enough data yet";
      out.ready = null;
      out.detail = "You've seen " + seen + " of " + total + " questions. " +
        out.needMore + " more and this becomes a real estimate.";
      // Below the floor the number is mostly prior, so it is not shown at all.
      out.score = 0; out.low = 0; out.high = 0;
      return out;
    }

    /* The detail line carries the numbers as prose. The track shows WHERE they
     * sit; a row of figures pinned to the track's far ends would read as its
     * endpoints, which they are not. */
    var range = "Estimated " + out.low + "–" + out.high + "%";
    if (low >= passPct) {
      out.verdict = "likely-ready";
      out.label = "Likely ready";
      out.ready = true;
      out.detail = range + ", all of it above the " + out.pass + "% pass mark.";
    } else if (high < passPct) {
      out.verdict = "not-yet";
      out.label = "Not yet";
      out.ready = false;
      out.detail = range + ", all of it below the " + out.pass + "% pass mark.";
    } else {
      out.verdict = "on-the-edge";
      out.label = "On the edge";
      out.ready = null;
      out.detail = range + " — the " + out.pass + "% pass mark sits inside that range, so it could go either way.";
    }
    if (coverage < 0.6) {
      out.detail += " Based on " + seen + " of " + total + " questions seen.";
    }
    return out;
  }

  window.NSTReadiness = {
    estimate: estimate,
    chanceFor: chanceFor,
    MIN_COVERAGE: MIN_COVERAGE,
    SMOOTHING: SMOOTHING,
    PRIOR_SMOOTHING: PRIOR_SMOOTHING,
    RETENTION_FLOOR: RETENTION_FLOOR,
    DOMAIN_PRIOR_MIN: DOMAIN_PRIOR_MIN,
    MODEL_SD: MODEL_SD,
    DEFAULT_PASS: DEFAULT_PASS,
    DEFAULT_EXAM_SIZE: DEFAULT_EXAM_SIZE,
  };
})();
