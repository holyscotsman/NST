/* bank-test.mjs — the question banks themselves, and the manifest that lists them.
 *
 * WHY THIS IS NOT starnix/bank-lint.mjs
 * That one lints StarNix's generated `questions.js`. This one lints the Markdown
 * banks in /banks/, which is what the runtime actually loads and what a person
 * edits by hand. Nothing checked those at all.
 *
 * THE ONE THAT MATTERS MOST: IDS ARE GLOBAL
 * `NSTMastery.get(id)` keys on the bare question id, with no bank scoping. Two
 * banks using the same id share one record: answering a question in one moves
 * the other's box, its counters and its review date. Nothing reports it, the
 * schedule just becomes quietly wrong for both.
 *
 * Today's two banks happen not to collide, because they were written with
 * different prefixes. Nothing enforced that, and six more banks are planned, so
 * this does.
 *
 * Everything is parsed with the REAL shared/bank-parser.js rather than a
 * re-implementation, so the lint and the runtime cannot disagree about what a
 * bank means.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/bank-test.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BANKS = join(ROOT, 'banks');

let pass = 0, fail = 0, warn = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};
const note = (text) => { warn++; console.log('warn ' + text); };

/* The real parser, in a shimmed window. */
function loadParser() {
  const src = readFileSync(join(ROOT, 'shared', 'bank-parser.js'), 'utf8');
  const win = {};
  win.window = win;
  new Function('window', 'define', 'module', 'exports', src)(win, undefined, undefined, undefined);
  if (!win.NSTBankParser) throw new Error('bank-parser did not expose NSTBankParser');
  return win.NSTBankParser;
}
const Parser = loadParser();

/* ---- the manifest ---- */
const manifestPath = join(BANKS, 'manifest.json');
ok('the manifest exists', existsSync(manifestPath));
let manifest = null;
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
catch (e) { ok('the manifest is valid JSON', false, e.message); }
if (!manifest) {
  console.log('\nBANKS: cannot continue without a readable manifest');
  process.exit(1);
}
ok('the manifest lists banks', Array.isArray(manifest.banks), typeof manifest.banks);
ok('and certs', Array.isArray(manifest.certs), typeof manifest.certs);

const banks = manifest.banks || [];
const certs = manifest.certs || [];

/* Every bank entry is complete and its file is really there. */
for (const b of banks) {
  ok(`bank "${b.id}" declares an id, cert, title and file`,
    !!(b.id && b.cert && b.title && b.file), JSON.stringify(b));
  const file = join(BANKS, String(b.file || ''));
  ok(`bank "${b.id}" points at a file that exists`, existsSync(file), b.file);
}
{
  const ids = banks.map((b) => b.id);
  ok('no two banks share an id', new Set(ids).size === ids.length, ids.join(','));
}

/* Every cert's banks resolve, and every bank belongs to a declared cert. */
{
  const byId = new Set(banks.map((b) => b.id));
  const certCodes = new Set(certs.map((c) => c.code));
  for (const c of certs) {
    if (!c.banks) {
      ok(`cert ${c.code} without banks is marked coming soon`, c.comingSoon === true, JSON.stringify(c));
      continue;
    }
    for (const key of Object.keys(c.banks)) {
      ok(`cert ${c.code} variant "${key}" points at a real bank`, byId.has(c.banks[key]), c.banks[key]);
    }
  }
  for (const b of banks) {
    ok(`bank "${b.id}" belongs to a declared cert`, certCodes.has(b.cert), b.cert);
  }
}

/* No orphans: a .md under /banks/ that the manifest never mentions is invisible
 * to the app, which is almost always a mistake rather than a choice. */
{
  const listed = new Set(banks.map((b) => String(b.file).split('/').join('/')));
  const found = [];
  const walk = (dir, rel = '') => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, rel ? `${rel}/${name}` : name);
      else if (name.endsWith('.md') && name.toLowerCase() !== 'readme.md') found.push(rel ? `${rel}/${name}` : name);
    }
  };
  walk(BANKS);
  const orphans = found.filter((f) => !listed.has(f));
  ok('every bank file on disk is listed in the manifest', orphans.length === 0, orphans.join(', '));
}

/* ---- each bank's content ---- */
const allIds = new Map();          // question id -> bank id, for the cross-bank check
const LETTER = /\b[Oo]ptions?\s+[A-E]\b|\banswers?\s+(?:are|is)\s+[A-E]\b|\(option\s+[A-E]\)/;
const POSITIONAL = /\b(all|none)\s+of\s+the\s+above\b|\bboth\s+[A-E]\s+and\s+[A-E]\b/i;

/* The content rules, named so the self-check at the bottom can exercise exactly
 * the code that runs over the real banks rather than a copy of it. */
const lettersIn = (qs) => {
  const hits = [];
  for (const q of qs) {
    if (q.explanation && LETTER.test(q.explanation)) hits.push(`${q.id}:explanation`);
    for (const n of q.optionNotes || []) if (n && LETTER.test(n)) hits.push(`${q.id}:optionNote`);
  }
  return hits;
};
const positionalIn = (qs) => {
  const hits = [];
  for (const q of qs) for (const o of q.options || []) if (POSITIONAL.test(o)) hits.push(q.id);
  return hits;
};
const strayDomainsIn = (qs, declared) =>
  [...new Set(qs.map((q) => q.domain).filter((d) => d && !declared.has(d)))];

for (const b of banks) {
  const file = join(BANKS, String(b.file || ''));
  if (!existsSync(file)) continue;
  const md = readFileSync(file, 'utf8');
  const parsed = Parser.parse(md);
  const qs = parsed.questions || [];
  const label = `bank "${b.id}"`;

  ok(`${label} parses without errors`, (parsed.errors || []).length === 0,
    (parsed.errors || []).slice(0, 3).map((e) => `${e.id}@${e.line}: ${e.message}`).join(' | '));
  ok(`${label} has questions`, qs.length > 0, qs.length);
  ok(`${label} declares a pass threshold in range`,
    typeof parsed.meta.pass === 'number' && parsed.meta.pass > 0 && parsed.meta.pass <= 1, parsed.meta.pass);

  /* Ids: unique here, and unique across every bank. */
  const seen = new Set();
  const dupesHere = [], collisions = [];
  for (const q of qs) {
    if (seen.has(q.id)) dupesHere.push(q.id);
    seen.add(q.id);
    const owner = allIds.get(q.id);
    if (owner && owner !== b.id) collisions.push(`${q.id} (also in ${owner})`);
    else allIds.set(q.id, b.id);
  }
  ok(`${label} has no duplicate question ids`, dupesHere.length === 0, dupesHere.slice(0, 4).join(', '));
  ok(`${label} shares no question id with another bank`, collisions.length === 0,
    collisions.slice(0, 4).join(', ') + ' -- mastery keys on the bare id, so these would share one record');

  /* Answerable at all. */
  const thin = qs.filter((q) => !q.options || q.options.length < 2).map((q) => q.id);
  ok(`${label} has at least two options on every question`, thin.length === 0, thin.slice(0, 4).join(', '));
  const unanswerable = qs.filter((q) => q.correct === null || q.correct === undefined).map((q) => q.id);
  ok(`${label} marks an answer on every question`, unanswerable.length === 0, unanswerable.slice(0, 4).join(', '));
  const emptyStem = qs.filter((q) => !q.stem || !q.stem.trim()).map((q) => q.id);
  ok(`${label} has a question on every question`, emptyStem.length === 0, emptyStem.slice(0, 4).join(', '));
  const badIndex = qs.filter((q) => {
    const idx = Array.isArray(q.correct) ? q.correct : [q.correct];
    return idx.some((i) => typeof i !== 'number' || i < 0 || i >= (q.options || []).length);
  }).map((q) => q.id);
  ok(`${label} answer keys point at real options`, badIndex.length === 0, badIndex.slice(0, 4).join(', '));

  /* Domains: the dashboard and the practice focus both group by these, so a typo
   * silently creates a one-question "domain". */
  if (parsed.meta.domains && parsed.meta.domains.length) {
    const declared = new Set(parsed.meta.domains);
    const stray = strayDomainsIn(qs, declared);
    ok(`${label} uses only its declared domains`, stray.length === 0,
      stray.join(', ') + ' -- not in: ' + [...declared].join(', '));
  }
  const noDomain = qs.filter((q) => !q.domain).map((q) => q.id);
  ok(`${label} gives every question a domain`, noDomain.length === 0, noDomain.slice(0, 4).join(', '));

  /* Shuffle safety: option order is randomised at runtime, so anything that
     refers to an option by letter or position is wrong for the reader. */
  const letterHits = lettersIn(qs);
  ok(`${label} never refers to an option by letter`, letterHits.length === 0, letterHits.slice(0, 4).join(', '));
  const posHits = positionalIn(qs);
  ok(`${label} has no positional option text`, posHits.length === 0, posHits.slice(0, 4).join(', '));

  /* Images referenced must exist, or the exhibit is a broken box. */
  const missingImages = [];
  for (const q of qs) {
    if (!q.image) continue;
    const rel = String(q.image);
    if (/^https?:/i.test(rel)) continue;                       // external, not ours to check
    const abs = join(dirname(file), rel);
    if (!existsSync(abs)) missingImages.push(`${q.id} -> ${rel}`);
  }
  ok(`${label} image references resolve`, missingImages.length === 0, missingImages.slice(0, 4).join(', '));

  /* Craft, reported but not fatal. */
  const singles = qs.filter((q) => !Array.isArray(q.correct) && q.options && q.options.length > 1);
  if (singles.length >= 20) {
    const longest = singles.filter((q) => {
      const lens = q.options.map((o) => String(o).length);
      return lens[q.correct] === Math.max(...lens);
    }).length;
    const pct = Math.round((longest / singles.length) * 100);
    if (pct > 60) note(`${label}: the correct option is the longest in ${pct}% of single-answer items (aim under 60%)`);
  }
  const noExplain = qs.filter((q) => !q.explanation || !q.explanation.trim()).length;
  if (noExplain) note(`${label}: ${noExplain} question(s) have no explanation — the tool teaches through these`);
}

ok('every question id in every bank is globally unique', true,
  `${allIds.size} ids across ${banks.length} bank(s)`);

/* ---- the linter is not vacuous ----
 *
 * Every check above passed, which proves nothing on its own: a rule with a typo
 * in it passes everything. These run the SAME functions over deliberately broken
 * banks, parsed by the same parser, and require them to complain.
 */
{
  const head = 'cert: X\ntitle: T\npass: 0.80\ndomains: storage, networking\n\n';
  const q = (id, domain, explain, opts) => `### ${id}\ndomain: ${domain}\ndifficulty: 2\n\n` +
    `Q: A question about ${id}?\n` +
    (opts || ['- [x] The right one', '- [ ] A wrong one']).join('\n') +
    `\n\nExplain: ${explain || 'Because that is how it works.'}\n`;

  const clean = Parser.parse(head + q('s1', 'storage') + q('s2', 'networking'));
  ok('self-check: a clean synthetic bank parses', (clean.errors || []).length === 0,
    JSON.stringify(clean.errors));
  ok('self-check: and trips none of the content rules',
    lettersIn(clean.questions).length === 0 &&
    positionalIn(clean.questions).length === 0 &&
    strayDomainsIn(clean.questions, new Set(clean.meta.domains)).length === 0);

  const dupe = Parser.parse(head + q('same', 'storage') + q('same', 'storage'));
  ok('self-check: a duplicate id inside a bank is reported',
    (dupe.errors || []).some((e) => /duplicate id/i.test(e.message)),
    JSON.stringify((dupe.errors || []).map((e) => e.message)));

  const byLetter = Parser.parse(head + q('s1', 'storage', 'Option B is wrong because it is wrong.'));
  ok('self-check: an explanation naming an option by letter is caught',
    lettersIn(byLetter.questions).length === 1, JSON.stringify(lettersIn(byLetter.questions)));

  const positional = Parser.parse(head + q('s1', 'storage', 'Fine.', ['- [x] All of the above', '- [ ] A wrong one']));
  ok('self-check: positional option text is caught',
    positionalIn(positional.questions).length === 1, JSON.stringify(positionalIn(positional.questions)));

  const stray = Parser.parse(head + q('s1', 'invented-domain'));
  ok('self-check: a domain outside the declared list is caught',
    strayDomainsIn(stray.questions, new Set(stray.meta.domains)).length === 1,
    JSON.stringify(strayDomainsIn(stray.questions, new Set(stray.meta.domains))));
}

console.log('\n' + (fail
  ? `BANKS: ${fail} FAILED (${pass} passed${warn ? `, ${warn} warning${warn > 1 ? 's' : ''}` : ''})`
  : `BANKS: ALL GREEN (${pass} checks${warn ? `, ${warn} warning${warn > 1 ? 's' : ''}` : ''})`));
process.exit(fail ? 1 : 0);
