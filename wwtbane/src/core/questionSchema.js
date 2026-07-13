// questionSchema.js — validates authored questions. Pure, no I/O.
// The authored answer key is authoritative (CLAUDE.md §4). This validator only
// checks STRUCTURE; it never decides whether a key is factually correct.

import { DOMAINS, DIFFICULTIES } from './config.js';

export const REVIEW_STATUSES = ['ai-drafted', 'verified', 'human-reviewed', 'quarantine'];
// Two accepted id shapes:
//  - native:      STOR-E-001, DP-H-014, PRISM-X-002
//  - interchange: ncp-mci-e1-q7 — the cross-game (StarNix/WWTBANE) bank format.
//    Kept verbatim so mastery records stay stable across re-imports and games.
const ID_RE = /^(?:[A-Z]+-[EMHX]-\d{3}|[a-z0-9]+(?:-[a-z0-9]+)*-q\d+)$/;

// Validate a single question object. Returns { ok, errors: string[] }.
export function validateQuestion(q, seenIds) {
  const errors = [];
  const push = (m) => errors.push(m);

  if (!q || typeof q !== 'object') return { ok: false, errors: ['not an object'] };

  if (typeof q.id !== 'string' || !ID_RE.test(q.id)) push(`bad id: ${JSON.stringify(q.id)}`);
  if (seenIds && q.id) {
    if (seenIds.has(q.id)) push(`duplicate id: ${q.id}`);
    else seenIds.add(q.id);
  }

  if (!DOMAINS.includes(q.domain)) push(`bad domain: ${q.domain}`);
  if (!DIFFICULTIES.includes(q.authoredDifficulty)) push(`bad authoredDifficulty: ${q.authoredDifficulty}`);
  if (q.type !== 'single' && q.type !== 'multi') push(`bad type: ${q.type}`);
  if (typeof q.stem !== 'string' || q.stem.trim().length < 8) push('stem too short/missing');
  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 8) push('explanation too short/missing');
  if (q.reviewStatus && !REVIEW_STATUSES.includes(q.reviewStatus)) push(`bad reviewStatus: ${q.reviewStatus}`);
  if (typeof q.impossible !== 'undefined' && typeof q.impossible !== 'boolean') push('impossible must be boolean');
  if (q.impossible && q.authoredDifficulty !== 'extreme') push('impossible questions must be authoredDifficulty=extreme');
  // Priority questions are surfaced first by mastery selection until graduated
  // (a "learn these first" set). Purely a selection hint — never affects grading.
  if (typeof q.priority !== 'undefined' && typeof q.priority !== 'boolean') push('priority must be boolean');

  // Options
  if (!Array.isArray(q.options) || q.options.length < 4 || q.options.length > 6) {
    push(`options must be an array of 4-6 (got ${Array.isArray(q.options) ? q.options.length : 'none'})`);
  } else {
    if (q.options.some((o) => typeof o !== 'string' || o.trim().length === 0)) push('empty option text');
    const norm = q.options.map((o) => String(o).trim().toLowerCase());
    if (new Set(norm).size !== norm.length) push('duplicate option text');
  }

  // Answer
  const optCount = Array.isArray(q.options) ? q.options.length : 0;
  if (!Array.isArray(q.answer) || q.answer.length === 0) {
    push('answer must be a non-empty array of indices');
  } else {
    const inRange = q.answer.every((i) => Number.isInteger(i) && i >= 0 && i < optCount);
    if (!inRange) push('answer index out of range');
    if (new Set(q.answer).size !== q.answer.length) push('duplicate answer index');
    if (q.type === 'single' && q.answer.length !== 1) push('single-answer must have exactly 1 correct index');
    if (q.type === 'multi') {
      if (q.answer.length < 2) push('multi-answer must have >=2 correct indices');
      // Must leave at least one distractor so 50:50 and grading stay meaningful.
      if (optCount && q.answer.length >= optCount) push('must leave at least one distractor');
    }
  }

  // Optional question image (a diagram/screenshot ref — content is authored by
  // humans; this only validates the hook). Must be a local path (the game ships
  // static and plays offline — no external loads) and MUST carry alt text.
  if (typeof q.image !== 'undefined') {
    if (!q.image || typeof q.image !== 'object' || Array.isArray(q.image)) {
      push('image must be an object { src, alt }');
    } else {
      if (typeof q.image.src !== 'string' || q.image.src.trim().length === 0) push('image.src must be a non-empty string');
      else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(q.image.src.trim())) push('image.src must be a local path, not an external URL');
      if (typeof q.image.alt !== 'string' || q.image.alt.trim().length < 3) push('image.alt (description) is required');
      if (typeof q.image.caption !== 'undefined' && typeof q.image.caption !== 'string') push('image.caption must be a string');
    }
  }

  // Optional per-option explanations (interchange banks carry a note per option:
  // why the right one is right and each distractor wrong). When present the array
  // must align 1:1 with options; entries may be '' where the source had no note.
  if (typeof q.optionNotes !== 'undefined') {
    if (!Array.isArray(q.optionNotes)) push('optionNotes must be an array');
    else {
      if (Array.isArray(q.options) && q.optionNotes.length !== q.options.length) push('optionNotes must align 1:1 with options');
      if (q.optionNotes.some((n) => typeof n !== 'string')) push('optionNotes entries must be strings');
    }
  }

  // Lifeline content (optional but type-checked when present).
  if (typeof q.phoneHint !== 'undefined' && typeof q.phoneHint !== 'string') push('phoneHint must be a string');
  if (typeof q.steveClue !== 'undefined' && typeof q.steveClue !== 'string') push('steveClue must be a string');
  if (typeof q.reference !== 'undefined' && typeof q.reference !== 'string') push('reference must be a string');
  if (typeof q.tags !== 'undefined' && !Array.isArray(q.tags)) push('tags must be an array');

  return { ok: errors.length === 0, errors };
}

// Validate a whole bank. Returns { ok, valid: [...], rejected: [{id, errors}], summary }.
export function validateBank(bank) {
  const seen = new Set();
  const valid = [];
  const rejected = [];
  if (!Array.isArray(bank)) return { ok: false, valid, rejected, summary: 'bank is not an array' };
  for (const q of bank) {
    const { ok, errors } = validateQuestion(q, seen);
    if (ok) valid.push(q);
    else rejected.push({ id: q && q.id, errors });
  }
  const byDiff = countBy(valid, (q) => q.authoredDifficulty);
  const byDomain = countBy(valid, (q) => q.domain);
  return {
    ok: rejected.length === 0,
    valid,
    rejected,
    summary: { total: bank.length, valid: valid.length, rejected: rejected.length, byDiff, byDomain },
  };
}

function countBy(arr, keyFn) {
  const m = {};
  for (const x of arr) { const k = keyFn(x); m[k] = (m[k] || 0) + 1; }
  return m;
}
