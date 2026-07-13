// import-questions.mjs — turn an authored Markdown bank into the game's
// src/content/questions.js. Run it whenever the owner uploads/updates their
// Markdown bank:
//
//   node scripts/import-questions.mjs <input.md> [output.js] [--force] [--merge]
//
// Defaults: input  = docs/question-bank.md
//           output = src/content/questions.js
//
// By default it REPLACES the bank with the parsed file. With --merge it instead
// merges the parsed questions AHEAD of the questions already in the output file,
// replacing any that share an id (so re-running is idempotent) and keeping the
// rest — used to add a set (e.g. the priority bank) without regenerating the
// whole thing from one source.
//
// Either way it validates every question with the SAME schema the game uses at
// boot and REFUSES to write if anything fails (unless --force), so a typo can
// never quietly ship a broken key. It never judges correctness — the author's
// [x] mark is authoritative (CLAUDE.md §4).

import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { parseMarkdownBank } from '../src/content/parseMarkdownBank.js';
import { parseInterchangeBank, looksLikeInterchange } from '../src/content/parseInterchangeBank.js';
import { validateBank } from '../src/core/questionSchema.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const merge = args.includes('--merge');
const positional = args.filter((a) => !a.startsWith('--'));
const input = positional[0] || 'docs/question-bank.md';
const output = positional[1] || 'src/content/questions.js';

if (!existsSync(input)) {
  console.error(`✗ Input not found: ${input}\n  Upload your Markdown bank there, or pass a path:\n    node scripts/import-questions.mjs path/to/your-bank.md`);
  process.exit(1);
}

const md = readFileSync(input, 'utf8');
// Two authored formats are accepted: the native one (## blocks, [x] marks —
// docs/QUESTION_AUTHORING.md) and the cross-game interchange one (### blocks,
// (x) marks). Auto-detected by shape.
const interchange = looksLikeInterchange(md);
const { questions, rejected, summary } = interchange ? parseInterchangeBank(md) : parseMarkdownBank(md);

console.log(`\nParsed ${input} (${interchange ? 'interchange' : 'native'} format)`);
console.log(`  ✓ ${questions.length} valid question(s)`);
if (rejected.length) {
  console.log(`  ✗ ${rejected.length} rejected:`);
  for (const r of rejected) console.log(`     #${r.index} "${(r.header || '').slice(0, 48)}"${r.id ? ` [${r.id}]` : ''}: ${r.errors.join('; ')}`);
}
console.log('\nBy difficulty:', JSON.stringify(summary.byDiff));
console.log('By domain:    ', JSON.stringify(summary.byDomain));
console.log(`Images:        ${summary.images}`);

// An empty result is NEVER writable — even --force must not blow away a good
// bank with `export const QUESTIONS = []` (that would break the game at boot).
if (questions.length === 0) {
  console.error('\n✗ Not writing — no valid questions were parsed. Fix the bank and re-run.');
  process.exit(1);
}
if (rejected.length && !force) {
  console.error('\n✗ Not writing — fix the rejected questions above (or pass --force to write only the valid ones).');
  process.exit(1);
}

// Assemble the final bank: replace by default, or merge the new questions ahead
// of the existing ones (idempotent by id) with --merge.
let finalQuestions = questions;
let existingCount = 0;
if (merge) {
  let existing = [];
  if (existsSync(output)) {
    try {
      const mod = await import(pathToFileURL(resolve(output)).href);
      existing = Array.isArray(mod.QUESTIONS) ? mod.QUESTIONS : [];
    } catch (e) {
      console.error(`\n✗ --merge could not read existing questions from ${output}: ${e.message}`);
      process.exit(1);
    }
  }
  existingCount = existing.length;
  const newIds = new Set(questions.map((q) => q.id));
  const kept = existing.filter((q) => !newIds.has(q.id));
  finalQuestions = [...questions, ...kept]; // new/priority first, then the rest
  console.log(`\nMerge: ${questions.length} new + ${kept.length} kept (of ${existingCount} existing) = ${finalQuestions.length} total`);
}

// Validate the FINAL assembled bank — catches duplicate ids and any structural
// issue across the merged set (negative-control safety before we write).
const check = validateBank(finalQuestions);
if (!check.ok) {
  console.error(`\n✗ Not writing — the assembled bank has ${check.rejected.length} invalid question(s):`);
  for (const r of check.rejected) console.error(`     [${r.id}]: ${r.errors.join('; ')}`);
  if (!force) process.exit(1);
}
const byDiff = check.summary.byDiff || {};
const meetsRunRequirement = (byDiff.easy || 0) >= 10 && (byDiff.medium || 0) >= 10 && (byDiff.hard || 0) >= 9 && (byDiff.extreme || 0) >= 1;
console.log(`Full-run ready (10 easy / 10 medium / 9 hard / 1 extreme): ${meetsRunRequirement ? 'YES' : 'NO'}`);
if (!meetsRunRequirement) {
  console.warn('\n⚠ The assembled bank does not have enough questions for a full 30-question run.');
  if (!force) { console.error('  Not writing — add more questions, or pass --force to write anyway.'); process.exit(1); }
}

const header = merge
  ? `// questions.js — the playable NCP-MCI question bank.
// ASSEMBLED by scripts/import-questions.mjs (--merge): priority questions from an
// authored Markdown source are merged AHEAD of the existing bank. Content is
// human-authored; the runtime never uses AI to grade (CLAUDE.md §4) — the stored
// authored key is authoritative. Re-run the importer to regenerate.

`
  : `// questions.js — the playable NCP-MCI question bank.
// GENERATED by scripts/import-questions.mjs from an authored Markdown bank.
// Do NOT hand-edit — edit the Markdown source and re-run the importer.
// Content is human-authored (owner-provided); the runtime never uses AI to
// grade (CLAUDE.md §4) — the stored authored key is authoritative.

`;
// Write atomically (temp + rename) so a crash mid-write can't truncate the
// existing good bank.
const tmp = output + '.tmp';
writeFileSync(tmp, header + `export const QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};\n`);
renameSync(tmp, output);
console.log(`\n✓ Wrote ${finalQuestions.length} question(s) to ${output}`);
