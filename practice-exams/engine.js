/* Nutanix Practice Exams — engine (pure logic + data normalization + storage).
 *
 * The question bank is ported verbatim from StarNix's Nutanix Interrogation Test
 * (data/questions.js -> window.STARNIX_QUESTIONS). This module normalizes it to a
 * single schema and provides the grading / shuffling / scoring used by both modes.
 * Grading and option-shuffle logic mirror the original exam engine exactly. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});

  /* ---- normalized schema ---------------------------------------------------
   * Question {
   *   id: string
   *   prompt: string
   *   options: string[]
   *   correct: number | number[]   // index(es) into options; array => multi-select
   *   explanation?: string
   *   domain?: string
   *   difficulty?: number
   *   image?: string               // exhibit key -> window.PE_EXHIBITS[key]
   *   imageAlt?: string
   *   optionNotes?: string[]       // per-option rationale (parallel to options)
   * } */
  var _bank = null;
  function normalizeBank() {
    if (_bank) return _bank;
    var raw = (window.STARNIX_QUESTIONS && window.STARNIX_QUESTIONS.questions) || [];
    _bank = raw.map(function (q) {
      var correct = Array.isArray(q.correctIndices) && q.correctIndices.length
        ? q.correctIndices.slice().sort(function (a, b) { return a - b; })
        : q.correctIndex;
      return {
        id: q.id,
        prompt: q.stem,
        options: q.options ? q.options.slice() : [],
        correct: correct,
        explanation: q.explanation || "",
        domain: q.domain || "general",
        difficulty: q.difficulty || 1,
        image: q.image || null,
        imageSrc: q.imageSrc || null,
        imageAlt: q.imageAlt || "",
        optionNotes: q.optionNotes ? q.optionNotes.slice() : null,
      };
    }).filter(function (q) { return q.prompt && q.options.length >= 2 && q.correct != null; });
    return _bank;
  }
  function resetCache() { _bank = null; }

  function bankMeta() {
    var b = normalizeBank();
    var domains = {};
    b.forEach(function (q) { domains[q.domain] = (domains[q.domain] || 0) + 1; });
    return { total: b.length, domains: domains, name: (window.STARNIX_QUESTIONS && window.STARNIX_QUESTIONS.name) || "Nutanix Practice Exam" };
  }

  /* ---- randomness ---------------------------------------------------------- */
  function rng() { return Math.random(); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---- grading (mirrors the original exam engine) --------------------------
   * chosen is a number (single) or an array of indices (multi). Multi is correct
   * iff the chosen set equals the correct set exactly. */
  function isMulti(q) { return Array.isArray(q.correct); }
  function gradeAnswer(q, chosen) {
    if (Array.isArray(q.correct)) {
      if (!Array.isArray(chosen) || chosen.length !== q.correct.length) return false;
      for (var i = 0; i < q.correct.length; i++) if (chosen.indexOf(q.correct[i]) < 0) return false;
      return true;
    }
    var idx = Array.isArray(chosen) ? (chosen.length ? chosen[0] : -1) : chosen;
    return typeof idx === "number" && idx === q.correct;
  }
  /* (v2.7.0) Practice Exams now feeds the shared mastery store too, so a question
   * answered here resurfaces (or stops resurfacing) in StarNix and WWTBANE. It uses
   * StarNix's policy -- promote only when the card is actually DUE -- which is what
   * stops a single 60-question sitting from minting a bank's worth of "mastered".
   * Silent and optional: if the shared module is absent, grading is unaffected. */
  function recordMastery(q, correct) {
    try {
      var M = window.NSTMastery;
      if (!M || !q || !q.id) return null;
      return M.record(q.id, { correct: !!correct, gate: "due", step: 1 });
    } catch (e) { return null; }
  }

  function isAnswered(chosen) {
    if (chosen == null) return false;
    if (Array.isArray(chosen)) return chosen.length > 0;
    return typeof chosen === "number" && chosen >= 0;
  }

  /* (v2.71.0) How a stored answer stands against what the question ASKS for.
   *
   * isAnswered() answers "did they touch this", which is what a progress bar
   * wants. gradeAnswer() requires an exact-size match for a multi-answer
   * question: choose three on a "Choose two" and it is wrong, always. Nothing
   * asked the question in between, so all four surfaces that summarise an exam
   * -- the palette chip, its aria-label, the "N answered" counter and the submit
   * dialog -- reported a guaranteed-wrong question as answered, and the sitting
   * offered no way to notice before the score.
   *
   * Measured in a browser on the shipped bank: a question badged "SELECT 2" took
   * all four options, marked itself answered, and said nothing anywhere.
   *
   * `state` is "empty" | "short" | "ready" | "over". Single-answer questions
   * need one, so they are only ever empty or ready and every caller can use one
   * vocabulary. */
  function selectionState(q, chosen) {
    var need = (q && Array.isArray(q.correct)) ? q.correct.length : 1;
    var have = Array.isArray(chosen)
      ? chosen.length
      : (typeof chosen === "number" && isFinite(chosen) && chosen >= 0 ? 1 : 0);
    return {
      need: need,
      have: have,
      multi: need > 1,
      state: have === 0 ? "empty" : (have < need ? "short" : (have > need ? "over" : "ready")),
    };
  }

  /* Answered AND in a state that can score. The number a timed sitting should
   * count, because the other kind cannot come out right. */
  function isReady(q, chosen) { return selectionState(q, chosen).state === "ready"; }

  /* ---- option shuffle (remaps correct index(es) + parallel optionNotes) ---- */
  function shuffleOptions(q) {
    var n = q.options.length, perm = [];
    for (var i = 0; i < n; i++) perm.push(i);
    for (var k = n - 1; k > 0; k--) { var j = Math.floor(rng() * (k + 1)); var t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
    return applyPerm(q, perm);
  }

  /* Rebuild the exact derived question a permutation produced.
   *
   * Exam Mode shuffles each question's options, so an answer is stored as an
   * index into the SHUFFLED list. Restoring a sitting by rebuilding it from the
   * bank would reshuffle, and every stored index would then point at a different
   * option -- answers silently rewritten, with nothing to see. Persisting the
   * permutation and replaying it here is what makes a resumed exam the same
   * exam. Splitting it out of shuffleOptions keeps one definition of the
   * mapping rather than two that must be kept in step. */
  function applyPerm(q, perm) {
    var inv = {}; perm.forEach(function (orig, ni) { inv[orig] = ni; });
    var dq = {
      id: q.id, perm: perm.slice(),
      prompt: q.prompt, domain: q.domain, difficulty: q.difficulty,
      explanation: q.explanation, image: q.image, imageAlt: q.imageAlt,
      // (v2.4.1) imageSrc is the ONLY live exhibit source — runtime banks resolve it
      // in bank-loader, and window.PE_EXHIBITS (the old inlined map) is never
      // populated any more. Dropping it here blanked every exhibit in Exam Mode.
      imageSrc: q.imageSrc,
      options: perm.map(function (p) { return q.options[p]; }),
    };
    if (q.optionNotes) dq.optionNotes = perm.map(function (p) { return q.optionNotes[p]; });
    if (Array.isArray(q.correct)) dq.correct = q.correct.map(function (c) { return inv[c]; }).sort(function (a, b) { return a - b; });
    else dq.correct = inv[q.correct];
    return dq;
  }

  /* ---- exam assembly -------------------------------------------------------
   * count: how many questions to draw (defaults to EXAM_QUESTION_COUNT; pass the
   * bank size for a full-bank exam). Questions and options are shuffled. */
  function buildExam(count) {
    var cfg = window.PE_CONFIG;
    var pool = normalizeBank().slice();
    if (cfg.SHUFFLE_QUESTIONS) pool = shuffle(pool);
    var n = Math.min(count || cfg.EXAM_QUESTION_COUNT, pool.length);
    var chosen = pool.slice(0, n);
    if (cfg.SHUFFLE_OPTIONS) chosen = chosen.map(shuffleOptions);
    return chosen;
  }
  // Practice Mode: the full bank in authored order (stable study view), OR a random
  // subset of `count` when count is smaller than the bank. Options stay unshuffled.
  function buildPractice(count, domain) {
    var pool = normalizeBank().slice();
    // (C6-01) optional focus domain — study one blueprint area at a time
    if (domain) pool = pool.filter(function (q) { return q.domain === domain; });
    if (count && count < pool.length) return shuffle(pool).slice(0, count);
    return pool;
  }

  /* Which domain to study next, given a sitting's per-domain tally.
   *
   * RANKED ON MISSES, NOT ON PERCENTAGE
   * This used to take the lowest percentage, "ties broken by most misses". Ties
   * across different denominators are rare, so the tie-breaker almost never ran
   * and the primary key was a bare rate -- which the SMALLEST domain wins, because
   * four questions reach 0% far more easily than eleven do.
   *
   * Simulated over 2,000 seventy-five-question sittings at 60% accuracy, that
   * named a domain with fewer missed questions than another **62% of the time**,
   * forgoing 2.9 missed questions on average, and it has named a domain with a
   * single question in the exam. A real sitting: "Focus next on Performance --
   * 0% there (4 missed)", while Data Protection sat at 1/11, ten missed.
   *
   * Misses first answers the question actually being asked -- where is the most
   * to be learned -- and it removes the small-sample problem structurally rather
   * than by a threshold: a domain with one question has at most one miss and can
   * never outrank a domain with more. Percentage breaks the tie, so between two
   * domains that each cost ten marks the weaker one wins.
   *
   * Returns null when nothing was missed. Pure; tested by engine-test.mjs. */
  function focusDomain(byDomain) {
    var best = null, bestMiss = -1, bestPct = 101;
    Object.keys(byDomain || {}).forEach(function (d) {
      var s = byDomain[d];
      if (!s || !s.total) return;
      var miss = s.total - s.correct;
      var pct = (s.correct / s.total) * 100;
      if (miss > bestMiss || (miss === bestMiss && pct < bestPct)) {
        best = d; bestMiss = miss; bestPct = pct;
      }
    });
    if (!best || bestMiss <= 0) return null;
    return { domain: best, missed: bestMiss, pct: Math.round(bestPct),
             total: byDomain[best].total };
  }

  /* ---- scoring ------------------------------------------------------------- */
  // results: [{ q, chosen, correct }]
  function summarize(results) {
    var cfg = window.PE_CONFIG, correct = 0, byDomain = {}, wrong = [];
    results.forEach(function (r) {
      var d = r.q.domain || "general";
      if (!byDomain[d]) byDomain[d] = { correct: 0, total: 0 };
      byDomain[d].total++;
      if (r.correct) { correct++; byDomain[d].correct++; } else wrong.push(r);
    });
    var n = results.length;
    var frac = n ? correct / n : 0;
    return {
      correct: correct,
      total: n,
      // (v2.4.1) FLOOR, not round: pass is decided on the unrounded fraction, so
      // rounding up printed "80%" on a failing 79.6% sitting (203/255) right next
      // to "80% to pass". Flooring can never claim a threshold you did not reach.
      pct: Math.floor(frac * 100),
      pass: n > 0 && frac >= cfg.PASS_THRESHOLD,
      byDomain: byDomain,
      wrong: wrong,
      results: results,
    };
  }

  /* ---- exhibits ------------------------------------------------------------ */
  function exhibitSrc(key) {
    if (!key) return null;
    var map = window.PE_EXHIBITS || {};
    return map[key] || null;
  }

  /* ---- attempt history (localStorage) -------------------------------------- */
  var STORE_KEY = "nst.practice-exams.history.v1";
  function loadHistory() {
    // (QA v2.1.1) a poisoned key holding a truthy non-array must not crash the entry screen
    try { var h = window.NSTSafeParse(localStorage.getItem(STORE_KEY)); return Array.isArray(h) ? h : []; }
    catch (e) { return []; }
  }
  function saveAttempt(a) {
    try {
      // (C4-03) stamp which bank produced this score — a PASS on the 25-question
      // bank is not the same claim as one on the full bank.
      if (a && !a.bank) {
        try { a.bank = bankMeta().name || (window.NSTBank && window.NSTBank.active()) || ""; } catch (eB) {}
      }
      var h = loadHistory();
      h.unshift(a);
      h = h.slice(0, 50);
      localStorage.setItem(STORE_KEY, JSON.stringify(h));
    } catch (e) { /* storage unavailable — attempts stay in memory only */ }
  }

  function clearHistory() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* storage unavailable */ }
  }

  /* The normalized (pre-shuffle) question for an id, or null. */
  function questionById(id) {
    var bank = normalizeBank();
    for (var i = 0; i < bank.length; i++) if (bank[i].id === id) return bank[i];
    return null;
  }

  PE.engine = {
    normalizeBank: normalizeBank,
    applyPerm: applyPerm,
    questionById: questionById,
    resetCache: resetCache,
    bankMeta: bankMeta,
    rng: rng,
    shuffle: shuffle,
    isMulti: isMulti,
    gradeAnswer: gradeAnswer,
    recordMastery: recordMastery,
    isAnswered: isAnswered,
    selectionState: selectionState,
    isReady: isReady,
    shuffleOptions: shuffleOptions,
    buildExam: buildExam,
    buildPractice: buildPractice,
    summarize: summarize,
    focusDomain: focusDomain,
    exhibitSrc: exhibitSrc,
    loadHistory: loadHistory,
    saveAttempt: saveAttempt,
    clearHistory: clearHistory,   // (C7-06)
  };
})();
