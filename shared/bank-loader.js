/* Nutanix Study Tool — question-bank loader.
 * Fetches Markdown banks from /banks/ at runtime, parses them (shared/bank-parser.js),
 * tracks the active bank, and adapts the normalized bank into each tool's shape.
 * Loaded in <head> before a tool's own scripts. Exposes window.NSTBank.
 *
 * No bank is active by default (empty manifest) — tools show a "no bank" state until
 * one is added to /banks/ and selected. */
(function () {
  "use strict";

  // Resolve the repo root from this script's own URL: <root>/shared/bank-loader.js
  var self = document.currentScript || (function () { var s = document.getElementsByTagName("script"); return s[s.length - 1]; })();
  var ROOT = (self && self.src ? self.src : "").replace(/shared\/bank-loader\.js(?:\?.*)?$/, "");
  var BANKS = ROOT + "banks/";
  var MANIFEST = BANKS + "manifest.json";
  var ACTIVE_KEY = "nst.activeBank";

  var _manifest = null;      // cached manifest
  var _cache = {};           // id -> parsed+adapted bank

  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.text();
    });
  }

  function manifest() {
    if (_manifest) return Promise.resolve(_manifest);
    return fetchText(MANIFEST).then(function (t) {
      var j = {};
      try { j = JSON.parse(t); } catch (e) { j = {}; }
      _manifest = Array.isArray(j.banks) ? j.banks : [];
      return _manifest;
    }).catch(function () { _manifest = []; return _manifest; });
  }

  function active() { try { return localStorage.getItem(ACTIVE_KEY) || null; } catch (e) { return null; } }
  function setActive(id) { try { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY); } catch (e) {} }

  // Load a bank by id (default: the active bank). Resolves null when there is none.
  function load(id) {
    id = id || active();
    if (!id) return Promise.resolve(null);
    if (_cache[id]) return Promise.resolve(_cache[id]);
    return manifest().then(function (banks) {
      var entry = banks.filter(function (b) { return b.id === id; })[0];
      if (!entry) return null;
      var fileUrl = new URL(entry.file, BANKS).href;
      return fetchText(fileUrl).then(function (md) {
        var parsed = window.NSTBankParser.parse(md);
        // resolve exhibit image paths relative to the bank file
        parsed.questions.forEach(function (q) { q.imageSrc = q.image ? new URL(q.image, fileUrl).href : null; });
        var bank = {
          id: id,
          meta: parsed.meta,
          questions: parsed.questions,
          errors: parsed.errors,
          count: parsed.questions.length,
        };
        _cache[id] = bank;
        return bank;
      });
    });
  }

  /* ---- adapters: normalized bank -> each tool's native shape ---- */

  // Practice Exams / StarNix core global (window.STARNIX_QUESTIONS shape).
  // StarNix's core validates difficulty on a 1|2|3 scale, so the bank's 1-5 scale is
  // folded down to match (1,2 -> 1 easy · 3 -> 2 medium · 4,5 -> 3 hard), consistent with
  // the WWTBANE tiering. Practice Exams treats difficulty as an opaque hint, so this is safe there too.
  var SX_DIFF = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 };
  function toStarNix(bank) {
    if (!bank) return { id: "", name: "", domains: [], questions: [] };
    return {
      id: bank.meta.cert || bank.id,
      name: bank.meta.title || bank.meta.cert || bank.id,
      domains: bank.meta.domains.slice(),
      questions: bank.questions.map(function (q) {
        var o = {
          id: q.id, cert: bank.meta.cert || bank.id, domain: q.domain,
          difficulty: SX_DIFF[q.difficulty] || 2, stem: q.stem, options: q.options.slice(),
          explanation: q.explanation,
        };
        if (Array.isArray(q.correct)) o.correctIndices = q.correct.slice(); else o.correctIndex = q.correct;
        if (q.optionNotes && q.optionNotes.some(Boolean)) o.optionNotes = q.optionNotes.slice();
        if (q.image) { o.image = q.id; o.imageSrc = q.imageSrc; o.imageAlt = q.imageAlt; }
        if (q.tags && q.tags.length) o.tags = q.tags.slice();
        if (q.priority) o.priority = 2;
        if (q.teach) o.briefing = q.teach;
        return o;
      }),
    };
  }

  // WWTBANE bank shape.
  function toWWTBANE(bank) {
    var TIER = { 1: "easy", 2: "easy", 3: "medium", 4: "hard", 5: "extreme" };
    if (!bank) return [];
    return bank.questions.map(function (q) {
      var ans = Array.isArray(q.correct) ? q.correct.slice() : [q.correct];
      var o = {
        id: q.id, domain: q.domain, authoredDifficulty: TIER[q.difficulty] || "medium",
        type: ans.length > 1 ? "multi" : "single", stem: q.stem, options: q.options.slice(),
        answer: ans, explanation: q.explanation, reviewStatus: "human-reviewed",
      };
      if (q.optionNotes && q.optionNotes.some(Boolean)) o.optionNotes = q.optionNotes.slice();
      if (q.image) o.image = { src: q.imageSrc, alt: q.imageAlt || ("exhibit " + q.id) };
      if (q.tags && q.tags.length) o.tags = q.tags.slice();
      if (q.priority) o.priority = true;
      if (q.reference) o.reference = q.reference;
      return o;
    });
  }

  window.NSTBank = {
    ROOT: ROOT, BANKS: BANKS,
    manifest: manifest,
    list: manifest,
    active: active,
    setActive: setActive,
    load: load,
    toStarNix: toStarNix,
    toWWTBANE: toWWTBANE,
  };
})();
