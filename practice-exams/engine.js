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
        imageAlt: q.imageAlt || "",
        optionNotes: q.optionNotes ? q.optionNotes.slice() : null,
      };
    }).filter(function (q) { return q.prompt && q.options.length >= 2 && q.correct != null; });
    return _bank;
  }

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
  function isAnswered(chosen) {
    if (chosen == null) return false;
    if (Array.isArray(chosen)) return chosen.length > 0;
    return typeof chosen === "number" && chosen >= 0;
  }

  /* ---- option shuffle (remaps correct index(es) + parallel optionNotes) ---- */
  function shuffleOptions(q) {
    var n = q.options.length, perm = [];
    for (var i = 0; i < n; i++) perm.push(i);
    for (var k = n - 1; k > 0; k--) { var j = Math.floor(rng() * (k + 1)); var t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
    var inv = {}; perm.forEach(function (orig, ni) { inv[orig] = ni; });
    var dq = {
      id: q.id, prompt: q.prompt, domain: q.domain, difficulty: q.difficulty,
      explanation: q.explanation, image: q.image, imageAlt: q.imageAlt,
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
  function buildPractice(count) {
    var pool = normalizeBank().slice();
    if (count && count < pool.length) return shuffle(pool).slice(0, count);
    return pool;
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
      pct: Math.round(frac * 100),
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
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveAttempt(a) {
    try {
      var h = loadHistory();
      h.unshift(a);
      h = h.slice(0, 50);
      localStorage.setItem(STORE_KEY, JSON.stringify(h));
    } catch (e) { /* storage unavailable — attempts stay in memory only */ }
  }

  PE.engine = {
    normalizeBank: normalizeBank,
    bankMeta: bankMeta,
    rng: rng,
    shuffle: shuffle,
    isMulti: isMulti,
    gradeAnswer: gradeAnswer,
    isAnswered: isAnswered,
    shuffleOptions: shuffleOptions,
    buildExam: buildExam,
    buildPractice: buildPractice,
    summarize: summarize,
    exhibitSrc: exhibitSrc,
    loadHistory: loadHistory,
    saveAttempt: saveAttempt,
  };
})();
