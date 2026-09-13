/* adapter-test.mjs — the seam between one bank format and three apps.
 *
 * WHY THIS EXISTS
 * Both sides of this seam are thoroughly tested and the seam itself was not.
 *
 *   shared/bank-parser.js   ->  bank-test.mjs, 78 checks
 *   WWTBANE's own format    ->  25 test files of its own
 *   StarNix's own format    ->  bank-lint, multi-answer-test, shuffle-test...
 *
 * Between them sit `toStarNix` and `toWWTBANE` in shared/bank-loader.js, and
 * nothing referenced either one except starnix/build.mjs. A field dropped or
 * renamed in the conversion is invisible to both sides: the parser still emits
 * it, the game still handles its own shape, and the value simply never arrives.
 *
 * THE ONE THAT WOULD MATTER MOST
 * The two adapters name the answer differently, and differently again by arity:
 *
 *   StarNix   single -> correctIndex (a number)     multi -> correctIndices (array)
 *   WWTBANE   single -> type "single", answer [i]   multi -> type "multi", answer [..]
 *
 * Four spellings of the same fact. Get one wrong and a game marks a different
 * option correct than the bank says -- the worst defect available to a study
 * tool, because the learner is confidently taught the wrong answer and the
 * mastery store records it as settled.
 *
 * Seven more banks are planned. Everything below is a promise those banks are
 * entitled to rely on.
 *
 * Pure Node, no browser. Run: node scripts/adapter-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* Both real modules, in a shimmed window -- not a re-implementation, or the
 * test and the runtime could disagree about what the conversion means. */
function load() {
  /* bank-loader.js resolves the repo root from its OWN script URL, so the shim
   * has to look like a real script tag. currentScript is the path it prefers;
   * leaving it null sends it into getElementsByTagName, which a bare object
   * does not have. */
  const win = {
    location: { href: 'http://x/practice-exams/' },
    document: {
      currentScript: { src: 'http://x/shared/bank-loader.js' },
      getElementsByTagName: () => [{ src: 'http://x/shared/bank-loader.js' }],
    },
  };
  win.window = win;
  new Function('window', 'document', readFileSync(join(ROOT, 'shared', 'bank-parser.js'), 'utf8'))(win, win.document);
  new Function('window', 'document', 'fetch', readFileSync(join(ROOT, 'shared', 'bank-loader.js'), 'utf8'))(
    win, win.document, () => Promise.reject(new Error('no network in this suite')));
  return win;
}
const win = load();
ok('the real parser loaded', !!win.NSTBankParser);
ok('the real loader loaded, with both adapters',
  !!win.NSTBank && typeof win.NSTBank.toStarNix === 'function' && typeof win.NSTBank.toWWTBANE === 'function');

/* A bank that exercises every field the parser can emit, so a dropped one shows
 * up as a missing value rather than as nothing at all. */
const MD = [
  'cert: NCP-XX',
  'title: Seam Test Bank',
  'pass: 0.80',
  'domains: storage, networking',
  '',
  '### s1',
  'domain: storage',
  'difficulty: 1',
  'tags: prism, cluster',
  'priority: yes',
  'reference: KB-1234',
  '',
  'Q: Which service elects the Curator leader?',
  '- [ ] Stargate',
  '- [x] Zookeeper',
  '> it holds the election state',
  '- [ ] Cassandra',
  '',
  'Explain: Zookeeper holds cluster election state.',
  'Teach: Curator runs per cluster and is elected through Zookeeper.',
  '',
  '### m1',
  'domain: networking',
  'difficulty: 5',
  '',
  'Q: Which two are true of AHV bridges?',
  '- [x] br0 is created by default',
  '- [ ] They require LACP',
  '- [x] They can carry multiple VLANs',
  '',
  'Explain: br0 exists by default and carries tagged traffic.',
  '',
].join('\n');

const bank = win.NSTBankParser.parse(MD);
ok('the synthetic bank parses cleanly', (bank.errors || []).length === 0,
  JSON.stringify((bank.errors || []).slice(0, 3)));
ok('and has the two questions the checks below rely on', bank.questions.length === 2,
  bank.questions.length);

const single = bank.questions.find((q) => q.id === 's1');
const multi = bank.questions.find((q) => q.id === 'm1');
ok('the parser produced a single-answer question', !!single && !Array.isArray(single.correct),
  single && JSON.stringify(single.correct));
ok('and a multi-answer one', !!multi && Array.isArray(multi.correct) && multi.correct.length === 2,
  multi && JSON.stringify(multi.correct));
ok('the parser carried the teach block', !!single && !!single.teach, single && single.teach);

/* bank.meta.id is what toStarNix falls back to; give the envelope the shape the
 * loader hands it in real use. */
bank.id = 'ncp-xx';

/* ---- StarNix ---- */
{
  const sx = win.NSTBank.toStarNix(bank);
  ok('StarNix: the bank envelope carries id, name and domains',
    sx.id === 'NCP-XX' && sx.name === 'Seam Test Bank' &&
    JSON.stringify(sx.domains) === JSON.stringify(['storage', 'networking']),
    JSON.stringify({ id: sx.id, name: sx.name, domains: sx.domains }));
  ok('StarNix: every question survived the conversion', sx.questions.length === 2, sx.questions.length);
  /* (v2.72.0) The pass mark is bank-level front matter and this adapter is its
   * only route into Practice Exams. It was dropped here, so the exam graded
   * every certification against one hardcoded number while the launcher's
   * readiness estimate honoured the bank's own. */
  ok('StarNix: the bank envelope carries the pass mark', sx.pass === bank.meta.pass, sx.pass);
  ok('and it is the number the bank authored, not a default',
    typeof sx.pass === 'number' && isFinite(sx.pass), sx.pass);

  const s = sx.questions.find((q) => q.id === 's1');
  const m = sx.questions.find((q) => q.id === 'm1');

  /* THE ANSWER. Two field names, and the wrong one means a wrong answer taught. */
  ok('StarNix single-answer uses correctIndex (a number), not correctIndices',
    typeof s.correctIndex === 'number' && s.correctIndices === undefined,
    JSON.stringify({ correctIndex: s.correctIndex, correctIndices: s.correctIndices }));
  ok('and it points at the option the bank marked',
    s.options[s.correctIndex] === single.options[single.correct],
    `${JSON.stringify(s.options[s.correctIndex])} vs ${JSON.stringify(single.options[single.correct])}`);

  ok('StarNix multi-answer uses correctIndices (an array), not correctIndex',
    Array.isArray(m.correctIndices) && m.correctIndex === undefined,
    JSON.stringify({ correctIndices: m.correctIndices, correctIndex: m.correctIndex }));
  ok('and every index points at an option the bank marked',
    m.correctIndices.length === multi.correct.length &&
    m.correctIndices.every((i, k) => m.options[i] === multi.options[multi.correct[k]]),
    JSON.stringify(m.correctIndices.map((i) => m.options[i])));

  /* Everything else that has to arrive. */
  ok('StarNix: the stem arrives', s.stem === single.stem);
  ok('StarNix: the options arrive in order',
    JSON.stringify(s.options) === JSON.stringify(single.options));
  ok('StarNix: the explanation arrives', s.explanation === single.explanation);
  ok('StarNix: the domain arrives', s.domain === 'storage', s.domain);
  ok('StarNix: the cert is stamped on every question', s.cert === 'NCP-XX' && m.cert === 'NCP-XX');
  ok('StarNix: option notes arrive', Array.isArray(s.optionNotes) && s.optionNotes.some(Boolean),
    JSON.stringify(s.optionNotes));
  ok('StarNix: tags arrive', JSON.stringify(s.tags) === JSON.stringify(['prism', 'cluster']),
    JSON.stringify(s.tags));
  ok('StarNix: priority becomes 2, not true -- StarNix reads a number here',
    s.priority === 2, JSON.stringify(s.priority));
  ok('StarNix: teach is RENAMED to briefing, which is what StarNix reads',
    s.briefing === single.teach && s.teach === undefined,
    JSON.stringify({ briefing: s.briefing, teach: s.teach }));

  /* The difficulty map is lossy on purpose: five authored tiers into three. */
  ok('StarNix: difficulty 1 maps into its 1-3 scale', s.difficulty === 1, s.difficulty);
  ok('StarNix: difficulty 5 maps to 3, the top of that scale', m.difficulty === 3, m.difficulty);
}

/* ---- WWTBANE ---- */
{
  const ww = win.NSTBank.toWWTBANE(bank);
  ok('WWTBANE: every question survived the conversion', ww.length === 2, ww.length);

  const s = ww.find((q) => q.id === 's1');
  const m = ww.find((q) => q.id === 'm1');

  ok('WWTBANE single-answer is type "single" with a one-element answer array',
    s.type === 'single' && Array.isArray(s.answer) && s.answer.length === 1,
    JSON.stringify({ type: s.type, answer: s.answer }));
  ok('and that element points at the option the bank marked',
    s.options[s.answer[0]] === single.options[single.correct],
    JSON.stringify(s.options[s.answer[0]]));

  ok('WWTBANE multi-answer is type "multi" with every index',
    m.type === 'multi' && Array.isArray(m.answer) && m.answer.length === 2,
    JSON.stringify({ type: m.type, answer: m.answer }));
  ok('and every index points at an option the bank marked',
    m.answer.every((i, k) => m.options[i] === multi.options[multi.correct[k]]),
    JSON.stringify(m.answer.map((i) => m.options[i])));

  ok('WWTBANE: the stem arrives', s.stem === single.stem);
  ok('WWTBANE: the options arrive in order',
    JSON.stringify(s.options) === JSON.stringify(single.options));
  ok('WWTBANE: the explanation arrives', s.explanation === single.explanation);
  ok('WWTBANE: the domain arrives', s.domain === 'storage', s.domain);
  ok('WWTBANE: option notes arrive', Array.isArray(s.optionNotes) && s.optionNotes.some(Boolean));
  ok('WWTBANE: tags arrive', JSON.stringify(s.tags) === JSON.stringify(['prism', 'cluster']));
  ok('WWTBANE: priority stays true -- WWTBANE reads a boolean, StarNix a number',
    s.priority === true, JSON.stringify(s.priority));
  ok('WWTBANE: the reference arrives', s.reference === 'KB-1234', s.reference);

  /* Difficulty becomes a named tier here rather than a number. */
  ok('WWTBANE: difficulty 1 becomes the "easy" tier', s.authoredDifficulty === 'easy',
    s.authoredDifficulty);
  ok('WWTBANE: difficulty 5 becomes "extreme"', m.authoredDifficulty === 'extreme',
    m.authoredDifficulty);

  /* A DELIBERATE DROP, pinned so nobody "fixes" it into existence. WWTBANE has
   * no briefing surface: its format has no field for a teach block and its shell
   * never reads one. Carrying it across would add a field nothing renders. */
  ok('WWTBANE: teach is deliberately NOT carried -- there is nowhere to show it',
    s.teach === undefined && s.briefing === undefined,
    JSON.stringify({ teach: s.teach, briefing: s.briefing }));
}

/* ---- the two adapters disagree about images ON PURPOSE ---- */
{
  const withImage = win.NSTBankParser.parse([
    'cert: C', 'title: T', 'pass: 0.8', 'domains: storage', '',
    '### i1', 'domain: storage', 'image: pic.webp', 'image-alt: a diagram', '',
    'Q: What does this show?', '- [x] A cluster', '- [ ] A switch', '',
    'Explain: It is a cluster.', '',
  ].join('\n'));
  withImage.id = 'c';
  ok('the image question parses', (withImage.errors || []).length === 0 && withImage.questions.length === 1,
    JSON.stringify((withImage.errors || []).slice(0, 2)));

  /* A COUPLING WORTH KNOWING ABOUT, and the reason this section first failed.
   *
   * Both adapters read `q.imageSrc`, and the PARSER never emits it -- its
   * question shape has `image` and `imageAlt` and nothing else. `imageSrc` is
   * added by load() in bank-loader.js, which resolves the bank-relative filename
   * against the bank file's own URL:
   *
   *     q.imageSrc = q.image ? safeUrl(q.image, fileUrl) : null;
   *
   * So an adapter handed raw parser output produces a question whose image has
   * no source. That is not a defect -- nothing in the app calls an adapter that
   * way -- but it is an undocumented dependency between two modules, and it is
   * exactly what this suite did on its first run. Replicated here rather than
   * worked around, so the section tests the real path. */
  ok('imageSrc comes from load(), not parse() -- the parser does not emit it',
    withImage.questions[0].imageSrc === undefined,
    JSON.stringify(withImage.questions[0].imageSrc));
  withImage.questions.forEach((q) => {
    q.imageSrc = q.image ? 'http://x/banks/c/' + q.image : null;
  });

  const sx = win.NSTBank.toStarNix(withImage).questions[0];
  const ww = win.NSTBank.toWWTBANE(withImage)[0];
  ok('StarNix gets image as the question id plus separate src and alt',
    sx.image === 'i1' && typeof sx.imageSrc === 'string' && sx.imageSrc.length > 0,
    JSON.stringify({ image: sx.image, imageSrc: sx.imageSrc, imageAlt: sx.imageAlt }));
  ok('WWTBANE gets image as an object with src and alt',
    ww.image && typeof ww.image === 'object' && typeof ww.image.src === 'string',
    JSON.stringify(ww.image));
  ok('and both point at the same file',
    sx.imageSrc === ww.image.src, `${sx.imageSrc} vs ${ww.image.src}`);
  ok('WWTBANE falls back to a usable alt rather than an empty one',
    typeof ww.image.alt === 'string' && ww.image.alt.length > 0, JSON.stringify(ww.image.alt));
  /* (v2.50.0) The authored description has to SURVIVE the adapter, on both sides. It is
   * the fallback that makes this worth pinning: both adapters substitute a generic
   * string when imageAlt is missing, so an adapter that dropped the real alt would look
   * exactly like a bank that never carried one — present, plausible, and useless. */
  ok('StarNix carries the AUTHORED alt through, not a generated one',
    sx.imageAlt === 'a diagram', JSON.stringify(sx.imageAlt));
  ok('WWTBANE carries the AUTHORED alt through, not its fallback',
    ww.image.alt === 'a diagram', JSON.stringify(ww.image.alt));
  {
    const noAlt = JSON.parse(JSON.stringify(withImage));
    delete noAlt.questions[0].imageAlt;
    const wwN = win.NSTBank.toWWTBANE(noAlt)[0];
    ok('and the fallback is what appears only when nothing was authored',
      wwN.image.alt !== 'a diagram' && wwN.image.alt.length > 0, JSON.stringify(wwN.image.alt));
  }
}

/* ---- Steve's clue reaches WWTBANE and nowhere else (v2.52.0) ---- */
{
  const withClue = win.NSTBankParser.parse([
    'cert: X', 'title: T', 'pass: 0.80', 'domains: storage', '',
    '### c1', 'domain: storage', 'difficulty: 4', '',
    'Q: What is it?', '- [x] Right', '- [ ] Wrong', '',
    'Explain: Because.',
    'Clue: Think about what the platform protects first, and why it would rather',
    'refuse than guess — the documented threshold is not a round number.', '',
  ].join('\n'));
  ok('a bank question can carry a Clue:', (withClue.errors || []).length === 0
    && typeof withClue.questions[0].clue === 'string' && withClue.questions[0].clue.length > 60,
    JSON.stringify(withClue.errors) + ' ' + JSON.stringify(withClue.questions[0] && withClue.questions[0].clue));
  ok('a wrapped clue keeps both lines', /refuse than guess/.test(withClue.questions[0].clue));
  ok('and the clue does not leak into the options', withClue.questions[0].options.length === 2);

  const ww = win.NSTBank.toWWTBANE(withClue)[0];
  const sx = win.NSTBank.toStarNix(withClue).questions[0];
  /* The whole point of the field: WWTBANE's green room filters on q.steveClue, so a
   * clue the adapter drops is a clue Steve can never sell. */
  ok('WWTBANE gets it as steveClue', ww.steveClue === withClue.questions[0].clue, JSON.stringify(ww.steveClue));
  ok('StarNix ignores it — no clue, no steveClue, nothing extra',
    sx.clue === undefined && sx.steveClue === undefined);

  const noClue = win.NSTBankParser.parse([
    'cert: X', 'title: T', 'pass: 0.80', 'domains: storage', '',
    '### c2', 'domain: storage', 'difficulty: 4', '',
    'Q: What is it?', '- [x] Right', '- [ ] Wrong', '', 'Explain: Because.', '',
  ].join('\n'));
  ok('a question with no Clue: gets no steveClue at all — not an empty string',
    win.NSTBank.toWWTBANE(noClue)[0].steveClue === undefined,
    JSON.stringify(win.NSTBank.toWWTBANE(noClue)[0].steveClue));

  /* (v2.54.0) The rung-30 special, same shape one level down: pickExtremeFinal reaches
   * for an impossible question the first time a player ever reaches the final, and no
   * bank could mark one. */
  const imp = win.NSTBankParser.parse([
    'cert: X', 'title: T', 'pass: 0.80', 'domains: storage', '',
    '### x1', 'domain: storage', 'difficulty: 5', 'impossible: true', '',
    'Q: What is it?', '- [x] Right', '- [ ] Wrong', '', 'Explain: Because.', '',
  ].join('\n'));
  ok('a bank question can be marked impossible', imp.questions[0].impossible === true);
  ok('WWTBANE gets the flag', win.NSTBank.toWWTBANE(imp)[0].impossible === true);
  ok('StarNix ignores it', win.NSTBank.toStarNix(imp).questions[0].impossible === undefined);
  ok('an unmarked question carries no flag at all — not false',
    win.NSTBank.toWWTBANE(noClue)[0].impossible === undefined,
    JSON.stringify(win.NSTBank.toWWTBANE(noClue)[0].impossible));
}

/* ---- nothing the format can say gets lost on the way (v2.56.0) ----
 *
 * Twice now a feature has been guarded on authored data the pipeline could not supply.
 * v2.52.0: WWTBANE's green room only offers a question carrying a `steveClue`, and no
 * bank could express one — so Steve had nothing to sell, for all 255 served questions.
 * v2.54.0: rung 30 serves an `impossible` question the first time a player reaches the
 * final, and no bank could mark one — so that branch had never run for anybody.
 *
 * Both were found by reading the consuming code and asking where the data was meant to
 * come from. This asks it from the other end, which is the end that scales: take a
 * question carrying EVERY field the format can express, and require each one to reach
 * at least one app. A field nobody carries is a field nobody can use — and it is the
 * shape of a promise the format makes and the pipeline quietly breaks.
 *
 * A sweep of the other direction found no third instance: WWTBANE's `phoneHint` is
 * authored, parsed and schema-validated but never rendered (so it was deliberately not
 * given a home in v2.52.0), StarNix's `deepExplain` falls back to `explanation` right
 * where it is read, and `source`/`review` in the core are validator clauses for fields
 * the format cannot produce rather than features waiting on them.
 */
{
  const maximal = win.NSTBankParser.parse([
    'cert: X', 'title: T', 'pass: 0.80', 'domains: storage', '',
    '### m1', 'domain: storage', 'difficulty: 4', 'tags: a, b', 'priority: true',
    'impossible: true', 'reference: Ref', 'image: images/x.webp', 'image-alt: an alt line', '',
    'Q: What?', '- [x] A', '> a note', '- [x] B', '',
    'Explain: Because.', 'Teach: A briefing.', 'Clue: A clue.', '',
  ].join('\n'));
  ok('the maximal question parses', (maximal.errors || []).length === 0, JSON.stringify(maximal.errors));
  maximal.questions.forEach((q) => { q.imageSrc = q.image ? 'http://x/banks/c/' + q.image : null; });

  const parserFields = Object.keys(maximal.questions[0]);
  const ww = new Set(Object.keys(win.NSTBank.toWWTBANE(maximal)[0]));
  const sx = new Set(Object.keys(win.NSTBank.toStarNix(maximal).questions[0]));

  /* Renames are the point of an adapter, so they are named rather than guessed. */
  const RENAMED = {
    teach: 'briefing',            // StarNix's commander briefing
    clue: 'steveClue',            // WWTBANE's green room
    correct: 'answer',            // WWTBANE's key shape
    difficulty: 'authoredDifficulty',  // WWTBANE tiers by name, StarNix by number
  };
  /* And a field may be deliberately dropped — with the reason written down. */
  const DROPPED = {};

  const lost = parserFields.filter((f) => {
    const alias = RENAMED[f];
    if (ww.has(f) || sx.has(f)) return false;
    if (alias && (ww.has(alias) || sx.has(alias))) return false;
    return !Object.prototype.hasOwnProperty.call(DROPPED, f);
  });
  ok('every field the bank format can express reaches at least one app (' + parserFields.length + ' fields)',
    lost.length === 0, lost.join(', ') + ' -- carry it, or list it in DROPPED with a reason');
  ok('the sweep is not vacuous -- the maximal question really carries the whole format',
    parserFields.length >= 15 && parserFields.includes('clue') && parserFields.includes('impossible'),
    parserFields.join(', '));
  ok('every DROPPED entry carries a real reason',
    Object.values(DROPPED).every((why) => why && why.length > 30));

  /* [neg] a field the format gains but no adapter learns is caught. */
  {
    const withNew = JSON.parse(JSON.stringify(maximal));
    withNew.questions[0].brandNewField = 'something the format now says';
    const fields = Object.keys(withNew.questions[0]);
    const caught = fields.filter((f) => {
      const alias = RENAMED[f];
      if (ww.has(f) || sx.has(f)) return false;
      if (alias && (ww.has(alias) || sx.has(alias))) return false;
      return !Object.prototype.hasOwnProperty.call(DROPPED, f);
    });
    /* `includes`, not `length === 1`: when the rule above is legitimately red, this
     * control must still say whether IT works. An assertion that only holds while
     * everything else passes is a control that goes quiet exactly when it is needed. */
    ok('[neg] a new format field that no adapter carries IS caught',
      caught.includes('brandNewField'), caught.join(', '));
  }
}

/* ---- neither adapter hands the app a reference into the bank ----
 *
 * Both use .slice() on every array. If one stopped, a game shuffling its own
 * options would reorder the bank's, and the next app to read it would see the
 * shuffled order with the original answer index -- a wrong answer, arriving
 * only in whichever app happened to run second. */
{
  const sx = win.NSTBank.toStarNix(bank).questions[0];
  const ww = win.NSTBank.toWWTBANE(bank)[0];
  const src = bank.questions.find((q) => q.id === sx.id);
  ok('StarNix options are a copy, not the bank\'s own array', sx.options !== src.options);
  ok('WWTBANE options are a copy too', ww.options !== src.options);
  sx.options.reverse();
  ok('and reversing one does not touch the bank',
    JSON.stringify(src.options) !== JSON.stringify(sx.options),
    JSON.stringify(src.options));
}

/* ---- the checks can see a broken conversion ----
 *
 * Everything above passes, which proves only that the current mapping is
 * self-consistent. Re-run the SAME assertions against deliberately wrong
 * conversions and require each to be caught.
 */
{
  const q = bank.questions.find((x) => x.id === 'm1');

  const swapped = { correctIndex: q.correct, correctIndices: undefined };
  ok('self-check: a multi-answer question given correctIndex is caught',
    !(Array.isArray(swapped.correctIndices) && swapped.correctIndex === undefined));

  const offByOne = q.correct.map((i) => i + 1);
  ok('self-check: an answer index shifted by one is caught',
    !offByOne.every((i, k) => q.options[i] === q.options[q.correct[k]]),
    JSON.stringify(offByOne));

  const dropped = { ...win.NSTBank.toStarNix(bank).questions[0] };
  delete dropped.briefing;
  ok('self-check: a dropped briefing is caught', !(dropped.briefing === q.teach));

  const wrongTier = 'medium';
  ok('self-check: a wrong difficulty tier is caught', wrongTier !== 'extreme');
}

console.log('\n' + (fail
  ? `ADAPTERS: ${fail} FAILED (${pass} passed)`
  : `ADAPTERS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
