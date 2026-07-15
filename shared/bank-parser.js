/* Nutanix Study Tool — question-bank parser.
 * Parses an NST Markdown question bank (see docs/BANK_FORMAT.md) into a normalized
 * object all the tools consume. Works in the browser (window.NSTBankParser) and in
 * Node (module.exports) so the same parser drives runtime loading and offline checks.
 *
 * Output:
 *   { meta: { cert, title, version, pass, domains[] },
 *     questions: [ { id, domain, difficulty(1-5), tags[], image, imageAlt, priority,
 *                    reference, stem, options[], correct(number|number[]), optionNotes[],
 *                    explanation, teach } ],
 *     errors: [ { id?, line?, message } ] }
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.NSTBankParser = api;
})(this, function () {
  "use strict";

  function stripLabel(s) { return s.replace(/^\*\*/, "").replace(/\*\*(?=\s*:)/, "").replace(/\*\*$/, ""); }
  function clampDiff(n) { n = parseInt(n, 10); if (isNaN(n)) return 3; return Math.max(1, Math.min(5, n)); }
  function truthy(v) { return /^(true|yes|1|on)$/i.test(String(v).trim()); }

  // Match "key: value" (tolerating **bold** labels). Returns [key, value] or null.
  function kv(line) {
    var m = stripLabel(line.trim()).match(/^([A-Za-z][A-Za-z0-9 _-]*?)\s*:\s*(.*)$/);
    if (!m) return null;
    return [m[1].trim().toLowerCase(), m[2].trim()];
  }

  function parse(md) {
    var text = String(md == null ? "" : md).replace(/\r\n?/g, "\n");
    var lines = text.split("\n");
    var meta = { cert: "", title: "", version: "", pass: 0.8, domains: [] };
    var questions = [];
    var errors = [];

    // ---- meta: everything before the first "### " ----
    var firstQ = lines.findIndex(function (l) { return /^###\s+/.test(l); });
    var metaLines = firstQ < 0 ? lines : lines.slice(0, firstQ);
    metaLines.forEach(function (l) {
      var h1 = l.match(/^#\s+(.*)$/);
      if (h1) { if (!meta.title) meta.title = h1[1].trim(); return; }
      var p = kv(l);
      if (!p) return;
      switch (p[0]) {
        case "cert": meta.cert = p[1]; break;
        case "title": meta.title = p[1]; break;
        case "version": meta.version = p[1]; break;
        case "pass": case "passingscore": case "pass-threshold": {
          var v = parseFloat(p[1]); if (!isNaN(v)) meta.pass = v > 1 ? v / 100 : v; break;
        }
        case "domains": meta.domains = p[1].split(",").map(function (d) { return d.trim(); }).filter(Boolean); break;
      }
    });

    if (firstQ < 0) return { meta: meta, questions: questions, errors: errors };

    // ---- split the rest into question blocks by "### <id>" ----
    var blocks = [];
    var cur = null;
    for (var i = firstQ; i < lines.length; i++) {
      var h = lines[i].match(/^###\s+(.*)$/);
      if (h) { cur = { id: h[1].trim(), start: i + 1, lines: [] }; blocks.push(cur); }
      else if (cur) cur.lines.push(lines[i]);
    }

    blocks.forEach(function (blk) { parseBlock(blk, questions, errors, meta); });

    // derive domains from questions if the header didn't declare them
    if (!meta.domains.length) {
      var seen = {}; questions.forEach(function (q) { if (q.domain) seen[q.domain] = 1; });
      meta.domains = Object.keys(seen);
    }
    return { meta: meta, questions: questions, errors: errors };
  }

  function parseBlock(blk, questions, errors, meta) {
    var q = {
      id: blk.id, domain: "", difficulty: 3, tags: [], image: null, imageAlt: "",
      priority: false, reference: "", stem: "", options: [], correct: null,
      optionNotes: [], explanation: "", teach: "",
    };
    var correctIdx = [];
    var state = "meta";        // meta -> stem -> options -> explain -> teach
    var stemBuf = [], expBuf = [], teachBuf = [];
    var lastOpt = -1;

    function flushStem() { q.stem = stemBuf.join("\n").trim(); }

    for (var li = 0; li < blk.lines.length; li++) {
      var raw = blk.lines[li];
      var line = raw.trim();

      // option line?  - [x] text   /   - [ ] text
      var opt = line.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
      if (opt) {
        if (state === "meta") { flushStem(); }
        state = "options";
        if (opt[1].toLowerCase() === "x") correctIdx.push(q.options.length);
        q.options.push(opt[2].trim());
        q.optionNotes.push("");
        lastOpt = q.options.length - 1;
        continue;
      }

      // per-option note:  > text   (belongs to the last option)
      var note = raw.match(/^\s*>\s?(.*)$/);
      if (note && state === "options" && lastOpt >= 0) {
        q.optionNotes[lastOpt] = (q.optionNotes[lastOpt] ? q.optionNotes[lastOpt] + " " : "") + note[1].trim();
        continue;
      }

      // block labels
      var p = kv(line);
      if (p && state === "meta") {
        switch (p[0]) {
          case "domain": q.domain = p[1].toLowerCase(); break;
          case "difficulty": case "diff": q.difficulty = clampDiff(p[1]); break;
          case "tags": q.tags = p[1].split(",").map(function (t) { return t.trim(); }).filter(Boolean); break;
          case "image": case "exhibit": q.image = p[1] || null; break;
          case "image-alt": case "imagealt": case "alt": q.imageAlt = p[1]; break;
          case "priority": q.priority = truthy(p[1]); break;
          case "reference": case "ref": q.reference = p[1]; break;
          case "q": case "question": case "stem": state = "stem"; if (p[1]) stemBuf.push(p[1]); break;
          case "explain": case "explanation": state = "explain"; if (p[1]) expBuf.push(p[1]); break;
          case "teach": case "briefing": state = "teach"; if (p[1]) teachBuf.push(p[1]); break;
          default: /* unknown meta key — ignore */ break;
        }
        continue;
      }
      // labels that switch state from later positions (e.g. Explain after options)
      if (p && (state === "stem" || state === "options" || state === "explain" || state === "teach")) {
        if (p[0] === "explain" || p[0] === "explanation") { if (state === "stem") flushStem(); state = "explain"; if (p[1]) expBuf.push(p[1]); continue; }
        if (p[0] === "teach" || p[0] === "briefing") { state = "teach"; if (p[1]) teachBuf.push(p[1]); continue; }
        if ((p[0] === "q" || p[0] === "question" || p[0] === "stem")) { state = "stem"; if (p[1]) stemBuf.push(p[1]); continue; }
      }

      // accumulate free text by state
      if (state === "stem") { if (line) stemBuf.push(line); }
      else if (state === "explain") { if (line) expBuf.push(line); }
      else if (state === "teach") { if (line) teachBuf.push(line); }
      // (meta free text before Q: is ignored)
    }
    if (state === "stem" || (!q.stem && stemBuf.length)) flushStem();
    q.explanation = expBuf.join("\n").trim();
    q.teach = teachBuf.join("\n").trim();

    // finalize correct
    if (correctIdx.length === 1) q.correct = correctIdx[0];
    else if (correctIdx.length > 1) q.correct = correctIdx.slice().sort(function (a, b) { return a - b; });

    // validate
    var probs = [];
    if (!q.id) probs.push("missing id");
    if (!q.stem) probs.push("missing question text (Q:)");
    if (q.options.length < 2) probs.push("needs at least 2 options");
    if (!correctIdx.length) probs.push("no correct option marked ([x])");
    if (!q.explanation) probs.push("missing explanation (Explain:)");
    if (meta.domains.length && q.domain && meta.domains.indexOf(q.domain) < 0) probs.push("domain '" + q.domain + "' not in the bank's domains list");

    if (probs.length && (!q.stem || q.options.length < 2 || !correctIdx.length)) {
      errors.push({ id: q.id, line: blk.start, message: probs.join("; ") });
      return; // structurally invalid — skip
    }
    if (probs.length) errors.push({ id: q.id, line: blk.start, message: probs.join("; ") }); // warnings kept, question still used
    questions.push(q);
  }

  return { parse: parse };
});
