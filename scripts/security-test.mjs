/* security-test.mjs — hostile-input regression gate.
 *
 * The site's threat model is: question banks are author-supplied content and
 * localStorage/sessionStorage is attacker-writable (shared machine, another
 * tab, a poisoned export). Cycles 2/5/9/10 hardened those paths; this pins the
 * hardening so a refactor cannot quietly undo it.
 *
 * Pure Node (no browser, no deps) so it gates every PR. The DOM-level half —
 * proving nothing executes when these values are rendered — lives in
 * scripts/attack-browser.mjs, which needs a browser.
 *
 * Run: node scripts/security-test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, checks = 0;
function ok(name, cond) { checks++; console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fails++; }
function group(t) { console.log("\n" + t); }

// Load the shared bank framework the way a page does (window globals).
globalThis.window = globalThis;
const parser = await import(path.join(ROOT, "shared/bank-parser.js"));
const parse = (parser.default && parser.default.parse) || parser.parse || globalThis.NSTBankParser.parse;

const XSS = '<img src=x onerror="window.__PWNED=1">';

/* ---- 1. the reviver: poisoned JSON must not reshape prototypes ---- */
group("Stored JSON (NSTSafeParse): prototype pollution");
{
  const safe = globalThis.NSTSafeParse;
  ok("NSTSafeParse is exposed by the bank framework", typeof safe === "function");
  const out = safe('{"__proto__":{"polluted":"yes"},"keep":1}');
  ok("__proto__ key is stripped from the result", out.polluted === undefined);
  ok("Object.prototype is untouched", ({}).polluted === undefined && Object.prototype.polluted === undefined);
  ok("legitimate keys survive", out.keep === 1);
  ok("nested __proto__ is stripped too", safe('{"a":{"__proto__":{"polluted":"yes"}}}').a.polluted === undefined);
  let threw = false; try { safe("{not json"); } catch (e) { threw = true; }
  ok("malformed JSON throws (callers wrap it)", threw);
}

/* ---- 2. the parser: hostile bank content stays inert data ---- */
group("Hostile question bank: parsed as data, never markup");
{
  const md = `# ${XSS}\ncert: NCP-MCI\ntitle: ${XSS}\ndomains: ${XSS}, storage\n\n` +
    `### q1\ndomain: ${XSS}\ndifficulty: 2\n\nQ: Stem ${XSS}\n- [x] Opt ${XSS}\n- [ ] Safe\n> note ${XSS}\n\nExplain: Exp ${XSS}\n`;
  const r = parse(md);
  ok("the hostile bank still parses to one question", r.questions.length === 1);
  const q = r.questions[0];
  ok("payload stays a literal string in the stem (not markup)", typeof q.stem === "string" && q.stem.includes("<img"));
  // a `>` note annotates the option it FOLLOWS, so the payload note lands on index 1
  ok("payload stays literal in options / notes / explanation",
    q.options[0].includes("<img") && q.optionNotes[1].includes("<img") && q.explanation.includes("<img"));
  ok("no parsed field is an element/object smuggled in",
    [q.stem, q.domain, q.explanation, ...q.options].every((v) => typeof v === "string"));
  ok("__proto__ as a domain cannot pollute", (parse("# b\ncert: c\n\n### q\ndomain: __proto__\n\nQ: s\n- [x] a\n- [ ] b\n\nExplain: e\n"), ({}).polluted === undefined));
}

/* ---- 3. the parser's own integrity reports (v2.4.1) ---- */
group("Bank integrity reporting");
{
  const dup = parse("# b\ncert: c\n\n### same\ndomain: storage\n\nQ: one\n- [x] a\n- [ ] b\n\nExplain: e\n\n### same\ndomain: storage\n\nQ: two\n- [x] a\n- [ ] b\n\nExplain: e\n");
  ok("duplicate question ids are reported", dup.errors.some((e) => /duplicate id/.test(e.message)));
  const chk = parse("# b\ncert: c\n\n### q\ndomain: storage\n\nQ: s\n- [x] a\n- [ ] b\n\nExplain: prose\n- [x] a checklist in prose\n");
  ok("a checklist inside Explain: is NOT swallowed as an option", chk.questions[0].options.length === 2);
  ok("…and cannot flip the question to multi-answer", !Array.isArray(chk.questions[0].correct));
}

/* ---- 4. bank-loader URL guard (v2.1.1): only http(s) is honoured ---- */
group("Bank loader: URL scheme guard");
{
  const src = readFileSync(path.join(ROOT, "shared/bank-loader.js"), "utf8");
  ok("a safeUrl helper gates resolved URLs", /function safeUrl/.test(src));
  ok("it accepts only http(s)", /\^https\?:\$|https\?:/.test(src) && /protocol/.test(src));
  ok("both the bank file and its exhibits go through it", (src.match(/safeUrl\(/g) || []).length >= 3);
}

/* ---- 5. no dangerous sinks in shipped source ---- */
group("Shipped source: no dynamic-code sinks");
{
  const files = [
    "shared/bank-parser.js", "shared/bank-loader.js", "shared/nst-prefs.js", "scripts/nst-home.js",
    "practice-exams/engine.js", "practice-exams/app.js", "practice-exams/ui.js",
    "practice-exams/results.js", "practice-exams/practice-mode.js", "practice-exams/exam-mode.js",
  ];
  let bad = [];
  for (const f of files) {
    const s = readFileSync(path.join(ROOT, f), "utf8");
    if (/\beval\s*\(/.test(s) || /new\s+Function\s*\(/.test(s)) bad.push(f);
    if (/set(Timeout|Interval)\s*\(\s*["'`]/.test(s)) bad.push(f + " (string timer)");
  }
  ok("no eval / new Function / string-argument timers" + (bad.length ? ": " + bad.join(", ") : ""), bad.length === 0);
}

console.log(fails ? `\nSECURITY: ${fails} FAILED of ${checks}` : `\nSECURITY: ALL GREEN (${checks} checks)`);
process.exit(fails ? 1 : 0);
