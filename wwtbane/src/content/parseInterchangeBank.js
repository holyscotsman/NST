// parseInterchangeBank.js — turn a bank in the cross-game "canonical interchange
// format" (shared between StarNix and WWTBANE) into the game's question objects.
// PURE (string in, data out; no I/O).
//
// The format (documented in the bank files themselves):
//   ### <id>                       stable id, e.g. ncp-mci-e1-q7 (kept verbatim)
//   <stem lines>                   verbatim, until the first option
//   @image: <file> / @image-alt:   optional exhibit (file lives in src/content/images/)
//   - ( ) / - (x) <option>         option; (x) marks the exam's own key
//     > <note>                     that option's explanation (verbatim)
//   @overall: <text>               the exam's overall explanation
//   @domain / @difficulty(1|2|3) / @tags / @priority / @briefing
//   @multi / @review               quarantine flags — such blocks are REJECTED here
//                                  (they only appear in review files, which need a
//                                  human decision before import)
//
// The content is transcribed verbatim from the source exam by the owner — this
// module only STRUCTURES it. It never decides whether a key is correct
// (CLAUDE.md §4): the (x) mark is authoritative. @briefing is StarNix commander
// dialogue and is intentionally dropped — WWTBANE's host/Steve have their own voice.

import { validateQuestion } from '../core/questionSchema.js';

const IMAGE_DIR = 'src/content/images/';

// Interchange domain -> WWTBANE domain (identity where the taxonomies agree).
const DOMAIN_MAP = {
  architecture: 'foundation',
  storage: 'storage',
  networking: 'networking',
  security: 'security',
  vms: 'ahv',
  'data-protection': 'dataprotection',
  lifecycle: 'lifecycle',
  monitoring: 'monitoring',
  performance: 'performance',
};

const DIFF_MAP = { 1: 'easy', 2: 'medium', 3: 'hard' };

const OPT_RE = /^-\s*\((x| )\)\s+(.+)$/;   // - (x) Correct option / - ( ) Distractor
const NOTE_RE = /^>\s?(.*)$/;              // > per-option explanation (indent stripped)
const FIELD_RE = /^@([a-z-]+):\s*(.*)$/;   // @field: value
// U+2028/U+2029 cannot appear in a regex literal (they are line terminators), so build it.
const UNICODE_LINE_SEPS = new RegExp('[' + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + ']', 'g');

function norm(s) { return String(s || '').trim(); }

// True when the text looks like the interchange format (### blocks + (x) options)
// rather than the native authoring format (## blocks + [x] options).
export function looksLikeInterchange(md) {
  return /^###\s+\S/m.test(md) && /^-\s*\((?:x| )\)\s+/m.test(md);
}

// Parse a whole interchange bank. Returns the same shape as parseMarkdownBank:
//   { questions: [validated objects], rejected: [{ index, header, id, errors }], summary }
export function parseInterchangeBank(md) {
  if (typeof md !== 'string' || !md.trim()) {
    return { questions: [], rejected: [{ index: 0, header: '(file)', errors: ['empty or non-string markdown'] }], summary: summarize([]) };
  }
  // RTF-derived sources can carry Unicode line/paragraph separators (U+2028/29)
  // inside a field value; fold them to spaces so `.`-based parsing sees one line.
  const lines = md.replace(/\r\n/g, '\n').replace(UNICODE_LINE_SEPS, ' ').split('\n');
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (/^###\s+/.test(line)) { cur = { header: norm(line.replace(/^###\s+/, '')), lines: [] }; blocks.push(cur); }
    else if (cur) cur.lines.push(line);
  }
  if (!blocks.length) {
    return { questions: [], rejected: [{ index: 0, header: '(file)', errors: ['no questions found — each question must start with "### " (an H3 header)'] }], summary: summarize([]) };
  }

  const questions = [];
  const rejected = [];
  const seen = new Set();
  blocks.forEach((block, i) => {
    const { q, parseErrors } = buildQuestion(block);
    const { ok, errors } = validateQuestion(q, seen);
    const all = [...parseErrors, ...errors];
    if (ok && !parseErrors.length) questions.push(q);
    else rejected.push({ index: i + 1, header: block.header, id: q.id, errors: all });
  });

  return { questions, rejected, summary: summarize(questions) };
}

function buildQuestion(block) {
  const parseErrors = [];
  const meta = {};
  const options = [];
  const notes = [];
  const answer = [];
  const stemLines = [];
  let sawOption = false;

  for (const raw of block.lines) {
    const line = norm(raw);
    if (!line || line === '---') continue;

    const opt = OPT_RE.exec(line);
    if (opt) {
      if (opt[1] === 'x') answer.push(options.length);
      options.push(norm(opt[2]));
      notes.push('');
      sawOption = true;
      continue;
    }

    const note = NOTE_RE.exec(line);
    if (note && sawOption && options.length) {
      const j = options.length - 1;
      notes[j] = notes[j] ? `${notes[j]} ${norm(note[1])}` : norm(note[1]);
      continue;
    }

    const f = FIELD_RE.exec(line);
    if (f) { meta[f[1]] = norm(f[2]); continue; }

    // anything else before the first option is stem text (verbatim, folded)
    if (!sawOption) stemLines.push(line);
  }

  // Quarantine flags: these blocks only appear in review files and each needs a
  // human decision — refuse them so a review file can never slip into the bank.
  if ('review' in meta || 'multi' in meta) {
    parseErrors.push('quarantined block (@review/@multi) — needs a human decision before import');
  }

  const domain = DOMAIN_MAP[norm(meta.domain).toLowerCase()];
  const difficulty = DIFF_MAP[parseInt(meta.difficulty, 10)];
  if (!domain) parseErrors.push(`unknown interchange domain: ${JSON.stringify(meta.domain)}`);
  if (!difficulty) parseErrors.push(`unknown interchange difficulty: ${JSON.stringify(meta.difficulty)} (expected 1|2|3)`);

  const q = {
    id: block.header, // interchange ids are kept verbatim (stable across games/imports)
    domain: domain || 'storage',
    authoredDifficulty: difficulty || 'medium',
    type: answer.length >= 2 ? 'multi' : 'single',
    stem: stemLines.join(' '),
    options,
    answer,
    explanation: meta.overall || '',
    reviewStatus: 'human-reviewed', // owner-supplied, transcribed verbatim from the source exam
  };
  if (notes.some((n) => n)) q.optionNotes = notes;
  if (meta.tags) q.tags = meta.tags.split(',').map(norm).filter(Boolean);
  if (parseInt(meta.priority, 10) > 0) q.priority = true;
  if (meta.image) {
    q.image = { src: IMAGE_DIR + meta.image, alt: norm(meta['image-alt']) };
    if (!q.image.alt) parseErrors.push('exhibit needs an "@image-alt:" description (accessibility)');
  }
  // @briefing intentionally dropped (StarNix voice, not WWTBANE content).

  return { q, parseErrors };
}

function summarize(questions) {
  const byDiff = {}; const byDomain = {}; let images = 0;
  for (const q of questions) {
    byDiff[q.authoredDifficulty] = (byDiff[q.authoredDifficulty] || 0) + 1;
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
    if (q.image) images += 1;
  }
  const meetsRunRequirement =
    (byDiff.easy || 0) >= 10 && (byDiff.medium || 0) >= 10 &&
    (byDiff.hard || 0) >= 9 && (byDiff.extreme || 0) >= 1;
  return { total: questions.length, byDiff, byDomain, images, meetsRunRequirement };
}
