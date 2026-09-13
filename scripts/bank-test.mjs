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
import { dirname, join, relative, resolve, basename } from 'node:path';

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

/* ---- (v2.46.0) draft mode: check ONE file, before it is wired up ----
 *
 * Seven more banks are planned, and the workflow for adding one had a hole in
 * the middle of it. This suite reads banks/manifest.json and checks every bank
 * listed there -- so to validate a bank you are still writing, you first had to
 * add it to the manifest, which is the file that decides what the live app
 * offers people. An unfinished bank had to be published to be checked.
 *
 * Worse, it was not optional. One of the checks below is "every bank file on
 * disk is listed in the manifest" -- correct, because an unlisted bank is
 * invisible to the app and that is nearly always a mistake. But it means the
 * moment you create banks/ncp-ai/ncp-ai.md, CI goes red until you publish it.
 * Measured: `FAIL every bank file on disk is listed in the manifest`.
 *
 * Two answers, both small:
 *   - banks/drafts/ is exempt from the orphan rule. A file there is not in the
 *     manifest because it is not finished, which is a state, not an error.
 *   - `node scripts/bank-test.mjs <file.md>` runs the CONTENT rules against one
 *     file and skips the manifest entirely.
 *
 * Draft mode reuses the same loop as the real run rather than a copy of it, so
 * a draft cannot pass checks the real banks would fail. */
const DRAFT_DIR = 'drafts';
const argFile = process.argv[2];
const DRAFT_MODE = !!argFile;

/* ---- the manifest ---- */
const manifestPath = join(BANKS, 'manifest.json');
if (!DRAFT_MODE) ok('the manifest exists', existsSync(manifestPath));
let manifest = null;
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
catch (e) { ok('the manifest is valid JSON', false, e.message); }
if (!manifest) {
  console.log('\nBANKS: cannot continue without a readable manifest');
  process.exit(1);
}
if (!DRAFT_MODE) {
  ok('the manifest lists banks', Array.isArray(manifest.banks), typeof manifest.banks);
  ok('and certs', Array.isArray(manifest.certs), typeof manifest.certs);
}

/* In draft mode the "bank list" is the one file named on the command line,
 * given the same shape a manifest entry has so the content loop below does not
 * need to know the difference. */
const banks = DRAFT_MODE
  ? [{ id: basename(argFile), cert: '(draft)', title: argFile,
       file: relative(BANKS, resolve(argFile)) }]
  : (manifest.banks || []);
const certs = DRAFT_MODE ? [] : (manifest.certs || []);

if (DRAFT_MODE) {
  const abs = resolve(argFile);
  ok(`the draft file exists: ${argFile}`, existsSync(abs), abs);
  if (!existsSync(abs)) {
    console.log('\nBANKS: nothing to check');
    process.exit(1);
  }
  console.log(`checking one draft, manifest rules skipped: ${argFile}\n`);
}

/* Every bank entry is complete and its file is really there. */
for (const b of DRAFT_MODE ? [] : banks) {
  ok(`bank "${b.id}" declares an id, cert, title and file`,
    !!(b.id && b.cert && b.title && b.file), JSON.stringify(b));
  const file = join(BANKS, String(b.file || ''));
  ok(`bank "${b.id}" points at a file that exists`, existsSync(file), b.file);
}
if (!DRAFT_MODE) {
  const ids = banks.map((b) => b.id);
  ok('no two banks share an id', new Set(ids).size === ids.length, ids.join(','));
}

/* Every cert's banks resolve, and every bank belongs to a declared cert. */
if (!DRAFT_MODE) {
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
if (!DRAFT_MODE) {
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
  /* banks/drafts/ is where a bank lives while it is being written. Not being in
   * the manifest is the whole point of it: the app must not offer an unfinished
   * bank, and the author must not have to publish one to check it. Everywhere
   * else, an unlisted bank is still invisible to the app and still a mistake. */
  const orphans = found.filter((f) => !listed.has(f) && !f.startsWith(DRAFT_DIR + '/'));
  ok('every bank file on disk is listed in the manifest (drafts/ excepted)',
    orphans.length === 0, orphans.join(', '));
  const drafts = found.filter((f) => f.startsWith(DRAFT_DIR + '/'));
  if (drafts.length) {
    note(`${drafts.length} draft bank(s) in banks/${DRAFT_DIR}/, not offered by the app: ` +
      drafts.join(', ') + ' — check one with: node scripts/bank-test.mjs banks/' + drafts[0]);
  }
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
/* (v2.50.0) An exhibit nothing describes. The floor is deliberately a real sentence's
 * worth: these are Prism screenshots, CLI output and topology diagrams that questions
 * are asked ABOUT, so the alt has to carry the values the question turns on rather than
 * name the picture. Sixty characters will not stop someone determined to write "a
 * screenshot", but it does stop the filename, the question id, and the empty string. */
const ALT_MIN = 60;
const thinAltIn = (qs) => {
  const hits = [];
  for (const q of qs) {
    if (!q.image) continue;
    const alt = typeof q.imageAlt === 'string' ? q.imageAlt.trim() : '';
    if (alt.length < ALT_MIN) { hits.push(`${q.id} (${alt.length} chars)`); continue; }
    if (alt.includes(q.id) || alt.includes(String(q.image))) hits.push(`${q.id} (names the id/file)`);
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

  /* An exhibit that resolves is still unusable to a screen-reader user if nothing
   * describes it. Measured before this rule existed: the full NCP-MCI bank carried 27
   * `image:` lines and 6 `image-alt:` lines. Practice Exams renders
   * `q.imageAlt || ("Exhibit for question " + q.id)`, so the other 21 questions shipped
   * an <img> whose alt read "Exhibit for question mci-networking-5gfy" — present, so
   * axe is satisfied, and useless, so the question cannot be answered. */
  const thinAlt = thinAltIn(qs);
  ok(`${label} every exhibit carries alt text that describes it`, thinAlt.length === 0,
    thinAlt.slice(0, 4).join(', '));

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

if (!DRAFT_MODE) {
  ok('every question id in every bank is globally unique', true,
    `${allIds.size} ids across ${banks.length} bank(s)`);
}

/* ---- the linter is not vacuous ----
 *
 * Every check above passed, which proves nothing on its own: a rule with a typo
 * in it passes everything. These run the SAME functions over deliberately broken
 * banks, parsed by the same parser, and require them to complain.
 */
if (!DRAFT_MODE) {
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

  /* The alt rule, in all three ways it can be got wrong. */
  const imgQ = (alt) => '### e1\ndomain: storage\ndifficulty: 2\nimage: images/e1.webp\n' +
    (alt === null ? '' : 'image-alt: ' + alt + '\n') +
    '\nQ: What does the exhibit show?\n- [x] The right one\n- [ ] A wrong one\n\nExplain: Because.\n';
  const noAlt = Parser.parse(head + imgQ(null));
  ok('self-check: an exhibit with NO alt text is caught',
    thinAltIn(noAlt.questions).length === 1, JSON.stringify(thinAltIn(noAlt.questions)));
  const stubAlt = Parser.parse(head + imgQ('Exhibit'));
  ok('self-check: a one-word alt is caught',
    thinAltIn(stubAlt.questions).length === 1, JSON.stringify(thinAltIn(stubAlt.questions)));
  const idAlt = Parser.parse(head + imgQ('Exhibit for question e1, shown in the Prism user interface as a screenshot.'));
  ok('self-check: an alt long enough but only naming the question is caught',
    thinAltIn(idAlt.questions).length === 1, JSON.stringify(thinAltIn(idAlt.questions)));
  const realAlt = Parser.parse(head + imgQ('Prism Element storage container details: replication factor 1, compression off, erasure coding off.'));
  ok('self-check: a real description passes',
    thinAltIn(realAlt.questions).length === 0, JSON.stringify(thinAltIn(realAlt.questions)));
  ok('self-check: a question with no exhibit is not asked for alt text',
    thinAltIn(clean.questions).length === 0);
}

/* Skipped in draft mode: this section is about the PARSER, not about the file
 * named on the command line, and counting it there would inflate a draft's
 * result with checks that have nothing to do with the draft. */
/* ---- (v2.43.0) line endings, because the next banks will be written on Windows ----
 *
 * bank-parser.js normalises CRLF and lone CR to LF before it splits lines:
 *
 *     var text = String(md == null ? "" : md).replace(/\r\n?/g, "\n");
 *
 * Every bank in this repository uses LF, so that line is load-bearing for
 * exactly zero of them today and nothing here noticed it existed. It reads like
 * a redundant normalisation of the kind somebody tidies away.
 *
 * Delete it and every check in this suite still passes. Then measure what a
 * Windows-authored bank actually does without it, which is worse than the stray
 * trailing characters this comment first predicted:
 *
 *     CRLF  -> questions: []      the whole bank parses to NOTHING
 *     CR    -> questions: [], and empty metadata as well
 *
 * `### w1\r` does not match the heading pattern, so no question is ever opened.
 * The file is not mangled, it is invisible: a bank that loads, reports no error,
 * and contains zero questions. Nothing about that looks like a line-ending
 * problem, which is why the checks below name the ending rather than the symptom.
 *
 * Seven more banks are planned. This is the check that makes the normalisation
 * survive until they arrive.
 */
if (!DRAFT_MODE) {
  const head = 'cert: X\ntitle: T\npass: 0.80\ndomains: storage, networking\n\n';
  const body = '### w1\ndomain: storage\ndifficulty: 2\n\n' +
    'Q: Which node holds the Curator leader?\n' +
    '- [x] The one that won the election\n' +
    '- [ ] The one with the lowest id\n\n' +
    'Explain: Curator elects a leader per cluster.\n';
  const lf = head + body;

  const parsedLf = Parser.parse(lf);
  ok('the LF control bank parses', (parsedLf.errors || []).length === 0 && parsedLf.questions.length === 1);

  for (const [label, eol] of [['CRLF (Windows)', '\r\n'], ['CR (classic Mac)', '\r']]) {
    const converted = lf.replace(/\n/g, eol);
    ok(`the ${label} source really differs from the LF one`, converted !== lf);
    const p2 = Parser.parse(converted);
    ok(`${label}: parses without errors`, (p2.errors || []).length === 0,
      JSON.stringify((p2.errors || []).slice(0, 2)));
    ok(`${label}: yields the same questions as LF`,
      JSON.stringify(p2.questions) === JSON.stringify(parsedLf.questions),
      JSON.stringify(p2.questions).slice(0, 200));
    ok(`${label}: yields the same metadata`,
      JSON.stringify(p2.meta) === JSON.stringify(parsedLf.meta),
      JSON.stringify(p2.meta));

    /* The specific damage a surviving \r does, named so a failure is readable. */
    const q = p2.questions[0] || {};
    const carriage = (v) => typeof v === 'string' && v.includes('\r');
    ok(`${label}: no carriage return survives into the question id`, !carriage(q.id), JSON.stringify(q.id));
    ok(`${label}: nor the stem`, !carriage(q.stem), JSON.stringify(q.stem));
    ok(`${label}: nor the domain -- a stray \\r makes it miss the declared list`,
      !carriage(q.domain), JSON.stringify(q.domain));
    ok(`${label}: nor any option -- it would render as an invisible character`,
      !(q.options || []).some(carriage), JSON.stringify(q.options));
    ok(`${label}: nor the explanation`, !carriage(q.explanation), JSON.stringify(q.explanation));
    ok(`${label}: nor any declared domain`,
      !(p2.meta.domains || []).some(carriage), JSON.stringify(p2.meta.domains));
  }

  /* Mixed endings, because a file edited on both platforms has both. */
  const mixed = head.replace(/\n/g, '\r\n') + body;
  const pm = Parser.parse(mixed);
  ok('a file with mixed CRLF and LF parses the same too',
    JSON.stringify(pm.questions) === JSON.stringify(parsedLf.questions) &&
    JSON.stringify(pm.meta) === JSON.stringify(parsedLf.meta));

  /* The rule is not vacuous: without the normalisation, CRLF breaks. Run the
   * SAME parser over a source whose \r the parser cannot see, by checking that
   * the raw split it would otherwise do leaves carriage returns behind. */
  const naive = (head + body).replace(/\n/g, '\r\n').split('\n');
  ok('self-check: splitting CRLF on \\n alone really does leave \\r behind',
    naive.some((l) => l.endsWith('\r')),
    'if this is false the whole section proves nothing');
}

console.log('\n' + (fail
  ? `BANKS: ${fail} FAILED (${pass} passed${warn ? `, ${warn} warning${warn > 1 ? 's' : ''}` : ''})`
  : `BANKS: ALL GREEN (${pass} checks${warn ? `, ${warn} warning${warn > 1 ? 's' : ''}` : ''})`));
process.exit(fail ? 1 : 0);
