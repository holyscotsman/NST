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

  /* "in 4 hours" / "in 2 days" -- delegated to the mastery store, which owns the
   * intervals these describe. Practice Exams says the same thing about the same
   * card, and two copies of the rounding rules would eventually disagree. The
   * local fallback only matters if this module is loaded without the store. */
  function untilText(at, now) {
    var M = window.NSTMastery;
    if (M && M.untilText) return M.untilText(at, now);
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

  /* Set Practice Exams' focus domain without disturbing the rest of its
   * preferences, and return the object to store.
   *
   * The dashboard writes another tool's preference key, so the whole risk here
   * is clobbering: the same object carries the question-set choice, and the
   * store is shared with every other site on this origin, so `raw` may be
   * anything at all. Anything that is not a plain object is replaced rather
   * than merged into, and a `__proto__` key never survives.
   */
  function withFocus(raw, domain) {
    var base = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (var k in raw) {
        if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
        if (k === "__proto__") continue;
        base[k] = raw[k];
      }
    }
    base.focusDomain = String(domain == null ? "" : domain);
    return base;
  }

  /* An exam left unfinished, as the launcher needs to describe it.
   *
   * v2.29.0 taught Exam Mode to survive the tab being discarded, and offers the
   * sitting back on the Practice Exams entry screen. But the launcher is where
   * people actually land, and it said nothing -- so the feature only worked for
   * someone who happened to walk back in through the door they left by.
   *
   * PURE, and deliberately shallow: it is handed the raw stored text and decides
   * only what can be decided without a question bank. It must not claim the exam
   * is restorable -- only Practice Exams can know that, since only it can rebuild
   * the questions -- so the wording this feeds says "unfinished", not "resume".
   *
   * A record for a different certification is not ours to talk about; a record
   * that will not parse is not a record.
   */
  function pendingExam(raw, bankId, now) {
    var t = now == null ? Date.now() : now;
    var s = null;
    try { s = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (e) { return null; }
    if (!s || typeof s !== "object") return null;
    if (!Array.isArray(s.q) || !s.q.length) return null;
    if (!Array.isArray(s.answers)) return null;
    /* Only Practice Exams can say whether the bank still has these questions, so
     * this cannot be a complete check -- but it can refuse the records that are
     * plainly broken, rather than advertising an exam that the link then cannot
     * produce. Every entry must be an object with a string id and a permutation
     * of whole, in-range indices, which is the shape applyPerm replays. */
    for (var qi = 0; qi < s.q.length; qi++) {
      var e = s.q[qi];
      if (!e || typeof e !== "object") return null;
      if (typeof e.id !== "string" || !e.id) return null;
      if (!Array.isArray(e.perm) || e.perm.length < 2) return null;
      var seen = {};
      for (var pi = 0; pi < e.perm.length; pi++) {
        var v = e.perm[pi];
        if (typeof v !== "number" || !isFinite(v) || v < 0 || v >= e.perm.length || v !== Math.floor(v)) return null;
        if (seen[v]) return null;                 // a permutation cannot repeat an index
        seen[v] = true;
      }
    }
    if (typeof s.endTime !== "number" || !isFinite(s.endTime)) return null;
    if (bankId && s.bank && s.bank !== bankId) return null;
    var answered = 0;
    for (var i = 0; i < s.answers.length; i++) {
      var a = s.answers[i];
      if (a === null || a === undefined) continue;
      if (Array.isArray(a) ? a.length : true) answered++;
    }
    return {
      total: s.q.length,
      answered: answered,
      remainingMs: Math.max(0, s.endTime - t),
      expired: s.endTime <= t,
    };
  }

  window.NSTDash = {
    model: model,
    pendingExam: pendingExam,
    withFocus: withFocus,
    untilText: untilText,
    cleanAttempts: cleanAttempts,
    WEAK_MAX: WEAK_MAX,
    WEAK_MIN_DOMAINS: WEAK_MIN_DOMAINS,
  };
})();
