// parseMarkdownBank.js — turn an authored Markdown question bank into the
// game's question objects. PURE (string in, data out; no I/O). The Markdown
// format is documented in docs/QUESTION_AUTHORING.md.
//
// The content is HUMAN-authored — this module only *structures* it. It never
// decides whether an answer is correct (CLAUDE.md §4): the author marks the
// key with [x], and that mark is authoritative.

import { validateQuestion } from '../core/questionSchema.js';

// Where image files live, relative to the page (index.html at the repo root).
const IMAGE_DIR = 'src/content/images/';

// Domain → id prefix (ids auto-generate so authors never have to think about them).
const DOMAIN_PREFIX = {
  prism: 'PRISM', storage: 'STOR', dataprotection: 'DP', ahv: 'AHV',
  networking: 'NET', lifecycle: 'LCM', monitoring: 'MON', migration: 'MOVE',
  unifiedstorage: 'UST', security: 'SEC', performance: 'PERF', foundation: 'FND',
};
const DIFF_LETTER = { easy: 'E', medium: 'M', hard: 'H', extreme: 'X' };

// Loose aliases so the author can be a little informal about domain names.
const DOMAIN_ALIAS = {
  prism: 'prism', 'prism central': 'prism', 'prism element': 'prism',
  storage: 'storage', aos: 'storage', 'aos storage': 'storage',
  dataprotection: 'dataprotection', 'data protection': 'dataprotection', dr: 'dataprotection', leap: 'dataprotection',
  ahv: 'ahv', virtualization: 'ahv',
  networking: 'networking', network: 'networking', flow: 'networking',
  lifecycle: 'lifecycle', lcm: 'lifecycle', upgrades: 'lifecycle', 'lifecycle & upgrades': 'lifecycle',
  monitoring: 'monitoring', ncc: 'monitoring', alerts: 'monitoring', health: 'monitoring',
  migration: 'migration', move: 'migration',
  unifiedstorage: 'unifiedstorage', 'unified storage': 'unifiedstorage', files: 'unifiedstorage', objects: 'unifiedstorage', volumes: 'unifiedstorage',
  security: 'security', dare: 'security', stig: 'security',
  performance: 'performance', capacity: 'performance',
  foundation: 'foundation', hardware: 'foundation',
};

const DIFF_ALIAS = {
  easy: 'easy', e: 'easy', medium: 'medium', med: 'medium', m: 'medium',
  hard: 'hard', h: 'hard', extreme: 'extreme', x: 'extreme', final: 'extreme', impossible: 'extreme',
};

const OPT_RE = /^[-*]\s*\[([ xX])\]\s+(.+)$/;      // - [x] Correct option
const FIELD_RE = /^-?\s*\*\*([^:*]+):\*\*\s*(.*)$/; // - **Label:** value  /  **Label:** value

function norm(s) { return String(s || '').trim(); }
function truthy(v) { return /^(y|yes|true|1)$/i.test(norm(v)); }

// Parse a whole Markdown bank. Returns:
//   { questions: [validated objects], rejected: [{ index, header, id, errors }], summary }
// Each question is validated with the SAME schema the game uses at boot.
export function parseMarkdownBank(md) {
  if (typeof md !== 'string' || !md.trim()) {
    return { questions: [], rejected: [{ index: 0, header: '(file)', errors: ['empty or non-string markdown'] }], summary: empty() };
  }
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) { cur = { header: norm(line.replace(/^##\s+/, '')), lines: [] }; blocks.push(cur); }
    else if (cur) cur.lines.push(line);
  }
  if (!blocks.length) {
    return { questions: [], rejected: [{ index: 0, header: '(file)', errors: ['no questions found — each question must start with "## " (an H2 header)'] }], summary: empty() };
  }

  const questions = [];
  const rejected = [];
  const seen = new Set();
  const counters = {};
  blocks.forEach((block, i) => {
    const { q, parseErrors } = buildQuestion(block, counters);
    const { ok, errors } = validateQuestion(q, seen);
    const all = [...parseErrors, ...errors];
    if (ok && !parseErrors.length) questions.push(q);
    else rejected.push({ index: i + 1, header: block.header, id: q.id, errors: all });
  });

  return { questions, rejected, summary: summarize(questions) };
}

function buildQuestion(block, counters) {
  const parseErrors = [];
  const meta = {};
  const options = [];
  const answer = [];
  const extra = {};
  let stem = '';
  let explanation = '';
  let mode = null;

  for (const raw of block.lines) {
    const line = norm(raw);
    if (!line) continue;

    const opt = OPT_RE.exec(line);
    if (opt) {
      if (opt[1].toLowerCase() === 'x') answer.push(options.length);
      options.push(norm(opt[2]));
      mode = null;
      continue;
    }

    const f = FIELD_RE.exec(line);
    if (f) {
      const label = f[1].trim().toLowerCase();
      const val = norm(f[2]);
      switch (label) {
        case 'question': case 'stem': stem = val; mode = 'stem'; break;
        case 'explanation': case 'why': explanation = val; mode = 'explanation'; break;
        case 'phone a friend': case 'phone': extra.phoneHint = val; mode = null; break;
        case 'steve': case 'steve clue': case 'clue': extra.steveClue = val; mode = null; break;
        case 'reference': case 'ref': case 'source': extra.reference = val; mode = null; break;
        case 'tags': extra.tags = val.split(',').map(norm).filter(Boolean); mode = null; break;
        default: meta[label] = val; mode = null; break;
      }
      continue;
    }

    // continuation lines fold into whichever multi-line field is open
    if (mode === 'stem') stem += (stem ? ' ' : '') + line;
    else if (mode === 'explanation') explanation += (explanation ? ' ' : '') + line;
  }

  // domain / difficulty (normalized through the alias tables)
  const domain = DOMAIN_ALIAS[norm(meta.domain).toLowerCase()] || norm(meta.domain).toLowerCase();
  const difficulty = DIFF_ALIAS[norm(meta.difficulty || meta.tier).toLowerCase()] || norm(meta.difficulty || meta.tier).toLowerCase();

  // type: explicit, else inferred from how many options are marked correct
  let type = norm(meta.type).toLowerCase();
  if (type !== 'single' && type !== 'multi') type = answer.length >= 2 ? 'multi' : 'single';

  const q = {
    id: makeId(domain, difficulty, counters, meta.id),
    domain,
    authoredDifficulty: difficulty,
    type,
    stem,
    options,
    answer,
    explanation,
    // owner-provided content ⇒ human-authored; owner may override per question.
    reviewStatus: norm(meta.reviewstatus) || 'human-reviewed',
  };
  if (extra.phoneHint) q.phoneHint = extra.phoneHint;
  if (extra.steveClue) q.steveClue = extra.steveClue;
  if (extra.reference) q.reference = extra.reference;
  if (extra.tags && extra.tags.length) q.tags = extra.tags;
  if (truthy(meta.impossible)) q.impossible = true;
  // "Priority: yes" marks a question the player should master first — mastery
  // selection strongly prefers it until it graduates. Selection hint only.
  if (truthy(meta.priority)) q.priority = true;

  // image: bare filename resolves into the images dir; a path/URL is kept as-is
  // so the schema can reject anything non-local.
  if (meta.image) {
    const src = /[/:]/.test(meta.image) ? meta.image : IMAGE_DIR + meta.image;
    q.image = { src, alt: norm(meta.alt || meta['image-alt'] || meta.imagealt) };
    if (meta.caption) q.image.caption = norm(meta.caption);
    if (!q.image.alt) parseErrors.push('image needs an "Alt:" description (accessibility)');
  }

  if (!stem && !options.length) parseErrors.push('block has no "**Question:**" and no options — is this a stray heading?');
  return { q, parseErrors };
}

function makeId(domain, difficulty, counters, provided) {
  if (provided) return norm(provided).toUpperCase();
  const prefix = DOMAIN_PREFIX[domain] || 'GEN';
  const letter = DIFF_LETTER[difficulty] || 'E';
  const key = `${prefix}-${letter}`;
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${String(counters[key]).padStart(3, '0')}`;
}

function empty() { return { total: 0, byDiff: {}, byDomain: {}, images: 0, meetsRunRequirement: false }; }

function summarize(questions) {
  const byDiff = {}; const byDomain = {}; let images = 0;
  for (const q of questions) {
    byDiff[q.authoredDifficulty] = (byDiff[q.authoredDifficulty] || 0) + 1;
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
    if (q.image) images += 1;
  }
  // A full 30-question run needs 10 easy / 10 medium / 9 hard / 1 extreme.
  const meetsRunRequirement =
    (byDiff.easy || 0) >= 10 && (byDiff.medium || 0) >= 10 &&
    (byDiff.hard || 0) >= 9 && (byDiff.extreme || 0) >= 1;
  return { total: questions.length, byDiff, byDomain, images, meetsRunRequirement };
}
