/* Nutanix Study Tool — the shared mastery store (window.NSTMastery).
 *
 * THE PROBLEM THIS SOLVES
 * The README has always promised that "however you play, right and wrong answers
 * feed the same mastery tracker per question". That was true inside StarNix (its
 * three games share one profile) but not across tools: WWTBANE kept its own
 * Leitner state in `wwtbane.save.v1`, Practice Exams recorded only attempt
 * history, and nothing synced. Answering a question in one tool did nothing for
 * the others' scheduling. This module makes the promise true.
 *
 * ONE BOX, TWO POLICIES
 * The two existing schedulers disagreed on both scale and gate:
 *
 *            scale                gate for changing the box
 *   StarNix  0..8, time-based     only when the card is actually DUE
 *   WWTBANE  0..5, run-based      only when the answer was UNAIDED
 *
 * Sharing state does not mean flattening those rules — they are what make each
 * tool feel like itself. So the *evidence* (the box and the counters) is shared,
 * while each tool keeps its own policy and passes it in per call:
 *
 *   StarNix   record(id, { correct, gate: "due",    step: 1 })
 *   WWTBANE   record(id, { correct, gate: "always", step: 2, assisted })
 *
 * The canonical scale is StarNix's 0..8: it is the finer of the two, and it is
 * time-based, which generalises across tools and across real study sessions in a
 * way a per-tool run index cannot. WWTBANE moves the same box in steps of 2 so
 * its ladder keeps its original length — four unaided answers still graduate a
 * hard question, one still graduates an easy one — see SEED_BOX below.
 *
 * WHAT THIS MODULE DOES NOT OWN
 * Only the Leitner record. XP, ranks, achievements, streak tracking, telemetry
 * and StarNix's station meter stay where they are; they read the outcome of a
 * record() call rather than living here.
 */
(function () {
  "use strict";

  var KEY = "nst.mastery.v1";
  var FORMAT = 1;

  var MIN_BOX = 0;
  var MAX_BOX = 8;
  var MASTERED_BOX = 4;      // StarNix's "mastered" threshold — feeds readiness
  var GRADUATED_BOX = 8;     // WWTBANE's "rarely resurfaced" ceiling

  /* Review interval per box, in ms. Box 0 is always due. Carried over from
   * StarNix unchanged so existing schedules keep their meaning. */
  var INTERVALS = [0, 30e3, 2 * 60e3, 10 * 60e3, 60 * 60e3, 6 * 60 * 60e3,
    24 * 60 * 60e3, 3 * 24 * 60 * 60e3, 7 * 24 * 60 * 60e3];

  /* Where a never-answered question starts, by authored difficulty. WWTBANE
   * seeded easy/medium/hard at 4/2/0 on a 0..5 ladder; the same *distances from
   * graduation* on 0..8, in steps of 2, are 6/4/0 — so an easy question still
   * graduates on one unaided answer and a hard one still takes four. */
  var SEED_BOX = { easy: 6, medium: 4, hard: 0, extreme: 0 };

  function now() { return Date.now(); }

  function clampBox(b) {
    b = Math.round(Number(b));
    if (!isFinite(b)) return MIN_BOX;
    return Math.max(MIN_BOX, Math.min(MAX_BOX, b));
  }
  function nonNegInt(n) {
    n = Math.floor(Number(n));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function blank(id, seedBox) {
    return {
      id: String(id),
      box: clampBox(seedBox == null ? MIN_BOX : seedBox),
      seen: 0, correct: 0, incorrect: 0, streak: 0,
      lastSeen: 0, firstCorrectAt: 0,
      // WWTBANE alone schedules by run index rather than wall clock (its staleness
      // nudge counts runs since the question last appeared). Kept here so sharing the
      // record does not quietly change how that game picks its questions.
      lastRun: -1,
    };
  }

  /* ---- storage -------------------------------------------------------- */

  var _state = null;   // { format, records: {id: rec}, updatedAt }

  function ls() { try { return window.localStorage; } catch (e) { return null; } }

  function emptyState() { return { format: FORMAT, records: {}, updatedAt: 0 }; }

  /* A stored record is untrusted input like any other: coerce every field so a
   * hand-edited or corrupted entry cannot poison the scheduler with NaN. */
  function sanitizeRecord(id, raw) {
    if (!raw || typeof raw !== "object") return null;
    var r = blank(id);
    r.box = clampBox(raw.box);
    r.seen = nonNegInt(raw.seen);
    r.correct = nonNegInt(raw.correct);
    r.incorrect = nonNegInt(raw.incorrect);
    r.streak = nonNegInt(raw.streak);
    r.lastSeen = nonNegInt(raw.lastSeen);
    r.firstCorrectAt = nonNegInt(raw.firstCorrectAt);
    r.lastRun = (typeof raw.lastRun === "number" && isFinite(raw.lastRun)) ? Math.floor(raw.lastRun) : -1;
    if (r.correct > r.seen) r.seen = r.correct;   // counters must stay coherent
    return r;
  }

  function load(force) {
    if (_state && !force) return _state;
    var s = ls();
    _state = emptyState();
    if (!s) return _state;
    var raw = null;
    try { raw = s.getItem(KEY); } catch (e) { return _state; }
    if (!raw) return _state;
    var parsed = null;
    try {
      parsed = JSON.parse(raw, function (k, v) { return k === "__proto__" ? undefined : v; });
    } catch (e) { return _state; }
    if (!parsed || typeof parsed !== "object" || !parsed.records || typeof parsed.records !== "object") return _state;
    for (var id in parsed.records) {
      if (!Object.prototype.hasOwnProperty.call(parsed.records, id)) continue;
      var rec = sanitizeRecord(id, parsed.records[id]);
      if (rec) _state.records[id] = rec;
    }
    _state.updatedAt = nonNegInt(parsed.updatedAt);
    return _state;
  }

  var _saveTimer = null, _saveErr = null, _announced = false;

  /* Not throwing from a save is right -- an answer must still count in-session
   * even once the browser has stopped accepting writes. But the flag that
   * recorded it was read by nobody: saveError() was exported and never called
   * from anywhere. So a browser refusing to store data (a full quota, private
   * browsing, an enterprise policy that disables site data) meant the tool went
   * on showing progress, promoting boxes and scheduling reviews for a session
   * that would be gone the moment the tab closed, in silence.
   *
   * StarNix already toasts this for its own store. The shared store, which is
   * where every tool's answers actually live, said nothing at all.
   *
   * Announce it as an event, on CHANGE only, so a surface can show it without
   * polling and without repeating itself on every write. */
  function announceStorage() {
    var bad = !!_saveErr;
    if (bad === _announced) return;
    _announced = bad;
    try {
      window.dispatchEvent(new window.CustomEvent("nst-storage-status", {
        detail: { ok: !bad, reason: _saveErr },
      }));
    } catch (e) { /* no CustomEvent here: a test harness, not a browser */ }
  }

  function writeNow() {
    var s = ls();
    if (!s || !_state) return;
    _state.updatedAt = now();
    try { s.setItem(KEY, JSON.stringify(_state)); _saveErr = null; }
    catch (e) {
      _saveErr = (e && e.name === "QuotaExceededError") ? "quota" : "write";
    }
    announceStorage();
  }
  function save(immediate) {
    if (immediate) { if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; } writeNow(); return; }
    if (_saveTimer) return;
    _saveTimer = setTimeout(function () { _saveTimer = null; writeNow(); }, 400);
  }
  function flush() { save(true); }
  function saveError() { return _saveErr; }

  /* ---- reading -------------------------------------------------------- */

  function all() { return load().records; }
  function get(id) { return load().records[String(id)] || null; }
  function count() { var n = 0, r = all(); for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) n++; return n; }

  function intervalFor(box) { return INTERVALS[Math.min(clampBox(box), INTERVALS.length - 1)] || 0; }

  /* Due = never answered, or the box's interval has elapsed since lastSeen. */
  function isDue(rec, t) {
    if (!rec || !rec.seen) return true;
    return (rec.lastSeen + intervalFor(rec.box)) <= (t == null ? now() : t);
  }
  function isMastered(rec) { return !!rec && rec.box >= MASTERED_BOX; }
  function isGraduated(rec) { return !!rec && rec.box >= GRADUATED_BOX; }

  function seedFor(authoredDifficulty) {
    var k = String(authoredDifficulty || "medium").toLowerCase();
    return SEED_BOX[k] != null ? SEED_BOX[k] : SEED_BOX.medium;
  }

  /* ---- recording ------------------------------------------------------ */

  /* Record one answer and return what happened, so callers can award XP or fire
   * achievements off the box movement without duplicating the policy.
   *
   * opts:
   *   correct    (bool)   the graded outcome
   *   gate       "due"    change the box only if the card was actually due
   *              "always" change it on every answer                (default "due")
   *   step       (int)    how far the box moves                    (default 1)
   *   assisted   (bool)   a lifeline carried the answer: counters move, box does not
   *   seedBox    (int)    where a brand-new record starts          (default MIN_BOX)
   *   runIndex   (int)    WWTBANE's run counter, for its staleness nudge
   *   now        (int)    injectable clock, for tests
   */
  function record(id, opts) {
    opts = opts || {};
    id = String(id);
    var st = load();
    var t = opts.now != null ? opts.now : now();
    var correct = !!opts.correct;
    var step = opts.step != null ? Math.max(1, Math.floor(opts.step)) : 1;
    var gate = opts.gate === "always" ? "always" : "due";

    var rec = st.records[id];
    var isNew = !rec;
    if (!rec) rec = st.records[id] = blank(id, opts.seedBox != null ? opts.seedBox : MIN_BOX);

    var prevBox = rec.box;
    // The classic-Leitner gate: cramming the same card repeatedly in one sitting
    // must not mint "mastered". A never-seen card is always due.
    var wasDue = isDue(rec, t);
    var mayMoveBox = !opts.assisted && (gate === "always" || wasDue || !correct);

    rec.seen++;
    if (typeof opts.runIndex === "number" && isFinite(opts.runIndex)) rec.lastRun = Math.floor(opts.runIndex);
    // A non-due CORRECT answer must not restart the interval clock, or answering
    // early would defer the due date (and so promotion) indefinitely. Due answers
    // and every wrong answer do reset it.
    if (wasDue || !correct) rec.lastSeen = t;

    if (correct) {
      rec.correct++; rec.streak++;
      if (!rec.firstCorrectAt) rec.firstCorrectAt = t;
      if (mayMoveBox) rec.box = clampBox(rec.box + step);
    } else {
      rec.incorrect++; rec.streak = 0;
      if (mayMoveBox) rec.box = clampBox(rec.box - step);
    }

    save();
    return {
      rec: rec, id: id, isNew: isNew, prevBox: prevBox, box: rec.box,
      wasDue: wasDue, promoted: rec.box > prevBox, demoted: rec.box < prevBox,
      assisted: !!opts.assisted,
    };
  }

  /* ---- migration ------------------------------------------------------ */

  /* Fold the two legacy per-tool stores into one canonical set of records.
   * PURE: takes the legacy objects, returns records — it does not read or write
   * storage, so it can be tested exhaustively and run without side effects.
   *
   * Where both tools know a question, the merge is deliberately generous: the
   * player really did answer it that many times, and really did demonstrate the
   * higher box somewhere, so counters add and the box takes the max. Losing
   * proven progress would be the worse error.
   */
  function mergeLegacy(starnixMastery, wwtbaneRecords) {
    var out = {};

    function touch(id) {
      if (!out[id]) out[id] = blank(id);
      return out[id];
    }

    // StarNix: already on the canonical 0..8 scale and already time-stamped.
    if (starnixMastery && typeof starnixMastery === "object") {
      for (var sid in starnixMastery) {
        if (!Object.prototype.hasOwnProperty.call(starnixMastery, sid)) continue;
        var sm = sanitizeRecord(sid, starnixMastery[sid]);
        if (!sm) continue;
        var a = touch(sid);
        a.box = clampBox(sm.box);
        a.seen = sm.seen; a.correct = sm.correct; a.incorrect = sm.incorrect;
        a.streak = sm.streak; a.lastSeen = sm.lastSeen; a.firstCorrectAt = sm.firstCorrectAt;
      }
    }

    // WWTBANE: 0..5 boxes rescaled onto 0..8, and a run index that carries no
    // wall-clock meaning — so lastSeen stays 0 (i.e. due now) rather than being
    // invented. Being asked a question again slightly early is a far smaller
    // harm than a fabricated review schedule.
    if (wwtbaneRecords && typeof wwtbaneRecords === "object") {
      for (var wid in wwtbaneRecords) {
        if (!Object.prototype.hasOwnProperty.call(wwtbaneRecords, wid)) continue;
        var w = wwtbaneRecords[wid];
        if (!w || typeof w !== "object") continue;
        var wBox = clampBox(Math.round((Number(w.box) || 0) * (MAX_BOX / 5)));
        var wSeen = nonNegInt(w.seen);
        var wCorrect = nonNegInt(w.correct);
        if (wCorrect > wSeen) wSeen = wCorrect;
        var b = touch(wid);
        b.box = Math.max(b.box, wBox);            // the higher box was genuinely earned
        b.seen += wSeen;
        b.correct += wCorrect;
        b.incorrect += Math.max(0, wSeen - wCorrect);
        if (typeof w.lastRun === "number" && isFinite(w.lastRun)) b.lastRun = Math.floor(w.lastRun);
        // streak/firstCorrectAt: WWTBANE tracked neither per question; leave as-is.
      }
    }
    return out;
  }

  /* Run the migration once, if it has not already run and there is anything to
   * migrate. Returns a report. The legacy stores are LEFT IN PLACE: they are the
   * only copy of this history, and a one-way delete on first load would be
   * unrecoverable if anything here is wrong. */
  function migrateIfNeeded(opts) {
    opts = opts || {};
    var st = load();
    if (count() > 0 && !opts.force) return { ran: false, reason: "already populated" };

    var s = ls();
    var sx = null, wb = null;
    try {
      var rawS = s && s.getItem("starnix:profile");
      if (rawS) {
        var pS = JSON.parse(rawS, function (k, v) { return k === "__proto__" ? undefined : v; });
        if (pS && pS.mastery && typeof pS.mastery === "object") sx = pS.mastery;
      }
    } catch (e) { sx = null; }
    try {
      var rawW = s && s.getItem("wwtbane.save.v1");
      if (rawW) {
        var pW = JSON.parse(rawW, function (k, v) { return k === "__proto__" ? undefined : v; });
        if (pW && pW.mastery && pW.mastery.records && typeof pW.mastery.records === "object") wb = pW.mastery.records;
      }
    } catch (e2) { wb = null; }

    if (!sx && !wb) return { ran: false, reason: "nothing to migrate" };

    var merged = mergeLegacy(sx, wb);
    var n = 0;
    for (var k in merged) {
      if (!Object.prototype.hasOwnProperty.call(merged, k)) continue;
      st.records[k] = merged[k]; n++;
    }
    save(true);
    return {
      ran: true, migrated: n,
      fromStarNix: sx ? Object.keys(sx).length : 0,
      fromWWTBANE: wb ? Object.keys(wb).length : 0,
    };
  }

  /* When something comes back, in words: "in 4 hours", "in 2 days".
   *
   * Deliberately coarse -- an exact countdown implies a precision the scheduler
   * does not have -- and deliberately HERE rather than in each surface that
   * needs it. The home dashboard and Practice Exams both say this, and two
   * copies of the rounding rules would eventually disagree about the same card.
   * Returns null when there is nothing scheduled. */
  function untilText(at, t) {
    var when = t == null ? now() : t;
    var ms = Number(at) - Number(when);
    if (!isFinite(ms) || !(ms > 0)) return null;
    var HOUR = 3600e3, DAY = 24 * HOUR;
    if (ms < HOUR) return "in under an hour";
    if (ms < DAY) { var h = Math.round(ms / HOUR); return "in " + h + (h === 1 ? " hour" : " hours"); }
    var d = Math.round(ms / DAY);
    return "in " + d + (d === 1 ? " day" : " days");
  }

  /* When this card next comes back, as a timestamp. 0 when it is due now. */
  function dueAt(rec) {
    if (!rec || !rec.seen) return 0;
    return Number(rec.lastSeen || 0) + intervalFor(rec.box);
  }

  /* Merge two mastery states that describe the SAME questions.
   *
   * This is the two-device case, and it is not the same problem as mergeLegacy
   * above. That one folds together stores from different tools that never
   * overlapped, so summing counters is right. Here both sides descend from a
   * shared history -- the same question answered on a phone and a laptop -- so
   * summing would double-count every answer they already agreed on.
   *
   * THE POLICY, AND WHY
   *   - the record with the NEWER lastSeen decides box, streak and lastSeen.
   *     That is the most recent evidence about whether the person knows it. Max
   *     box would be kinder and wrong: getting it wrong an hour ago is the truth,
   *     even if yesterday's device still remembers a high box.
   *   - seen/correct/incorrect take the LARGER of the two, per counter. Both
   *     sides share a prefix, so max never double-counts it and never loses the
   *     work one side did alone.
   *   - firstCorrectAt takes the EARLIER non-zero value: it is a "when did this
   *     first click" marker and the earlier one is the true one.
   *
   * Neither input is modified. Returns a fresh records map.
   */
  function mergeStates(a, b) {
    var out = {};
    var src = [a || {}, b || {}];
    for (var i = 0; i < src.length; i++) {
      var recs = src[i];
      if (!recs || typeof recs !== "object") continue;
      for (var id in recs) {
        if (!Object.prototype.hasOwnProperty.call(recs, id)) continue;
        if (id === "__proto__") continue;
        var inc = sanitizeRecord(id, recs[id]);
        var cur = out[id];
        if (!cur) { out[id] = inc; continue; }

        var newer = inc.lastSeen >= cur.lastSeen ? inc : cur;
        var older = newer === inc ? cur : inc;
        out[id] = {
          id: String(id),
          // The most recent sighting owns the schedule.
          box: newer.box,
          streak: newer.streak,
          lastSeen: newer.lastSeen,
          lastRun: Math.max(cur.lastRun, inc.lastRun),
          // Counters: the larger of the two, never the sum.
          seen: Math.max(cur.seen, inc.seen),
          correct: Math.max(cur.correct, inc.correct),
          incorrect: Math.max(cur.incorrect, inc.incorrect),
          // The earlier "first correct" is the real one; 0 means never.
          firstCorrectAt: (cur.firstCorrectAt && older.firstCorrectAt)
            ? Math.min(cur.firstCorrectAt, inc.firstCorrectAt)
            : (cur.firstCorrectAt || inc.firstCorrectAt),
        };
      }
    }
    return out;
  }

  /* Merge an incoming serialized state (a whole `nst.mastery.v1` value, as a
   * string) with what this browser already holds, and return the string to
   * store. Used by the backup/restore and account-sync paths, which both used to
   * overwrite this key wholesale -- losing every answer the other side had. */
  function mergeSerialized(currentText, incomingText) {
    function recordsOf(text) {
      if (!text) return {};
      try {
        var p = JSON.parse(String(text), function (k, v) { return k === "__proto__" ? undefined : v; });
        return (p && p.records && typeof p.records === "object") ? p.records : {};
      } catch (e) { return {}; }
    }
    var merged = mergeStates(recordsOf(currentText), recordsOf(incomingText));
    return JSON.stringify({ format: FORMAT, records: merged, updatedAt: now() });
  }

  /* ---- reporting ------------------------------------------------------ */

  /* Roll the shared records up against a bank, for dashboards and readiness.
   * Unseen questions count as zero: mastery is proven, not assumed. */
  function summary(questions, t) {
    var qs = questions || [];
    var when = t == null ? now() : t;
    var out = {
      total: qs.length, seen: 0, mastered: 0, graduated: 0, due: 0,
      correct: 0, incorrect: 0, boxSum: 0, domains: [],
      // When nothing is due, this is when the soonest card comes back (0 = never
      // scheduled). A surface that only shows "0 due" reads as finished; this is
      // what lets it say "next review in two days" instead.
      nextDueAt: 0,
    };
    var byDomain = {};
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      var d = q.domain || "General";
      var acc = byDomain[d] || (byDomain[d] = { domain: d, total: 0, seen: 0, mastered: 0, due: 0, boxSum: 0 });
      acc.total++;
      var rec = get(q.id);
      if (rec && rec.seen) {
        out.seen++; acc.seen++;
        out.correct += rec.correct; out.incorrect += rec.incorrect;
        out.boxSum += rec.box; acc.boxSum += rec.box;
        if (isMastered(rec)) { out.mastered++; acc.mastered++; }
        if (isGraduated(rec)) out.graduated++;
      }
      if (isDue(rec, when)) { out.due++; acc.due++; }
      else if (rec) {
        var at = rec.lastSeen + intervalFor(rec.box);
        if (at > when && (!out.nextDueAt || at < out.nextDueAt)) out.nextDueAt = at;
      }
    }
    for (var k in byDomain) {
      if (!Object.prototype.hasOwnProperty.call(byDomain, k)) continue;
      var a = byDomain[k];
      a.score = a.total ? a.boxSum / (a.total * MAX_BOX) : 0;
      out.domains.push(a);
    }
    // weakest first — that is the order a study surface wants to show
    out.domains.sort(function (x, y) {
      return (x.score - y.score) || ((x.seen / (x.total || 1)) - (y.seen / (y.total || 1))) ||
        String(x.domain).localeCompare(String(y.domain));
    });
    out.masteredPct = out.total ? (out.mastered / out.total) * 100 : 0;
    out.seenPct = out.total ? (out.seen / out.total) * 100 : 0;
    return out;
  }

  function reset() {
    _state = emptyState();
    var s = ls();
    try { if (s) s.removeItem(KEY); } catch (e) {}
  }

  /* The debounce above is what keeps a 255-question sitting from stringifying the
   * whole store on every single answer. Its cost is a window: for up to 400ms an
   * answer exists only in this page's memory.
   *
   * A page that is going away never gets to close that window -- the pending
   * timeout simply never fires, and the answers are gone from the browser as
   * well as from the account. Measured: three answers recorded, the tab hidden,
   * and nothing written at all.
   *
   * Nothing was flushing it. NSTSync has pagehide and visibilitychange handlers,
   * but it only registers them when it is talking to the app server -- on GitHub
   * Pages and file:// it stays dormant by design, so there the window never
   * closed for anybody. The debounce belongs to this module, so the flush does
   * too: registered here, it works on every deployment.
   *
   * pagehide covers a close, a navigation and bfcache; visibilitychange covers a
   * phone backgrounding the tab, which is where the OS is most likely to kill it
   * outright. Both fire on paths where a timer will not run again. */
  (function bindFlush() {
    try {
      if (!window.addEventListener) return;
      window.addEventListener("pagehide", flush);
      if (window.document && window.document.addEventListener) {
        window.document.addEventListener("visibilitychange", function () {
          if (window.document.visibilityState === "hidden") flush();
        });
      }
    } catch (e) { /* a shimmed window in a test harness: nothing to bind to */ }
  })();

  window.NSTMastery = {
    KEY: KEY, FORMAT: FORMAT,
    MIN_BOX: MIN_BOX, MAX_BOX: MAX_BOX, MASTERED_BOX: MASTERED_BOX, GRADUATED_BOX: GRADUATED_BOX,
    INTERVALS: INTERVALS, SEED_BOX: SEED_BOX,
    load: load, save: save, flush: flush, saveError: saveError,
    all: all, get: get, count: count,
    isDue: isDue, isMastered: isMastered, isGraduated: isGraduated,
    intervalFor: intervalFor, seedFor: seedFor,
    untilText: untilText, dueAt: dueAt,
    record: record,
    mergeLegacy: mergeLegacy, migrateIfNeeded: migrateIfNeeded,
    mergeStates: mergeStates, mergeSerialized: mergeSerialized,
    summary: summary, reset: reset,
    _blank: blank,
  };
})();
