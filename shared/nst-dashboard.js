/* Nutanix Study Tool — the progress rollup behind the home page dashboard.
 * Exposes window.NSTDash.
 *
 * WHY THIS IS A SEPARATE, PURE MODULE
 * The launcher renders three tools' worth of progress in one place, and the
 * decisions about WHAT to show are the part that can be wrong: a dashboard that
 * says "weakest area: networking" about a domain nobody has ever answered, or
 * "0 due" about a bank that was never opened, teaches the reader to ignore it.
 * Those decisions live here, as a function from data to a view model, so they
 * can be tested without a browser (scripts/dashboard-test.mjs).
 *
 * Rendering — elements, classes, layout — stays in scripts/nst-home.js.
 *
 * Everything here treats its inputs as hostile: the exam history comes from
 * localStorage, which is shared with every other site on the same github.io
 * origin, so a poisoned entry must produce a boring number, never a crash or a
 * nonsense claim on the home page.
 */
(function () {
  "use strict";

  var HOUR = 3600 * 1000;
  var DAY = 24 * HOUR;

  /* A domain is only a candidate for "weakest" once it has been answered.
   * Ranking untouched domains ranks nothing — they are all zero, so the list
   * would just be alphabetical and would change as soon as one is opened. */
  var WEAK_MAX = 3;
  var WEAK_MIN_DOMAINS = 2;

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
  function pct(part, whole) { return whole > 0 ? Math.round((num(part) / whole) * 100) : 0; }
  function clampPct(v) { return Math.max(0, Math.min(100, Math.round(num(v)))); }

  /* "in 4 hours" / "in 2 days". Deliberately coarse: an exact countdown implies a
   * precision the scheduler does not have. */
  function untilText(at, now) {
    var ms = num(at) - num(now);
    if (!(ms > 0)) return null;
    if (ms < HOUR) return "in under an hour";
    if (ms < DAY) { var h = Math.round(ms / HOUR); return "in " + h + (h === 1 ? " hour" : " hours"); }
    var d = Math.round(ms / DAY);
    return "in " + d + (d === 1 ? " day" : " days");
  }

  /* Exam attempts as Practice Exams writes them, minus anything malformed. */
  function cleanAttempts(history) {
    if (!history || !history.length) return [];
    var out = [];
    for (var i = 0; i < history.length; i++) {
      var a = history[i];
      if (!a || typeof a !== "object") continue;
      var p = Number(a.pct);
      if (!isFinite(p) || p < 0 || p > 100) continue;
      out.push({ pct: Math.round(p), pass: !!a.pass, at: num(a.at), bank: typeof a.bank === "string" ? a.bank : "" });
    }
    return out;
  }

  /* summary: the object from NSTMastery.summary(bank.questions)
   * history: the array from the Practice Exams engine (newest first)
   * now:     injectable clock */
  function model(opts) {
    opts = opts || {};
    var s = opts.summary || null;
    var now = opts.now == null ? Date.now() : opts.now;
    var attempts = cleanAttempts(opts.history);

    var total = s ? num(s.total) : 0;
    var seen = s ? num(s.seen) : 0;
    var mastered = s ? num(s.mastered) : 0;
    var due = s ? num(s.due) : 0;
    var answered = s ? num(s.correct) + num(s.incorrect) : 0;

    /* Weakest areas, from domains that have actually been answered. */
    var weakest = [];
    if (s && s.domains && s.domains.length) {
      var touched = [];
      for (var i = 0; i < s.domains.length; i++) {
        var d = s.domains[i];
        if (!d || !num(d.seen)) continue;
        touched.push({
          domain: String(d.domain || "General"),
          pct: clampPct(num(d.score) * 100),
          seen: num(d.seen),
          total: num(d.total),
        });
      }
      // summary() already sorts weakest-first; keep that order.
      if (touched.length >= WEAK_MIN_DOMAINS) weakest = touched.slice(0, WEAK_MAX);
    }

    var best = null, last = null;
    if (attempts.length) {
      last = attempts[0];
      best = attempts[0];
      for (var j = 1; j < attempts.length; j++) if (attempts[j].pct > best.pct) best = attempts[j];
    }

    /* Nothing answered and no exam taken means there is no picture to draw. The
     * caller shows the nudge instead of a wall of zeros. */
    var hasData = seen > 0 || attempts.length > 0;

    return {
      hasData: hasData,
      total: total,
      seen: seen,
      mastered: mastered,
      due: due,
      answered: answered,
      masteredPct: pct(mastered, total),
      seenPct: pct(seen, total),
      accuracy: answered > 0 && s ? clampPct((num(s.correct) / answered) * 100) : null,
      // Only meaningful when nothing is due right now; otherwise the queue is the message.
      nextDue: due > 0 ? null : (s ? untilText(s.nextDueAt, now) : null),
      weakest: weakest,
      exam: attempts.length ? { best: best, last: last, count: attempts.length } : null,
      nudge: total
        ? "Answer a few questions in any tool — they all feed this."
        : "Pick an exam above to start tracking progress.",
    };
  }

  window.NSTDash = {
    model: model,
    untilText: untilText,
    cleanAttempts: cleanAttempts,
    WEAK_MAX: WEAK_MAX,
    WEAK_MIN_DOMAINS: WEAK_MIN_DOMAINS,
  };
})();
