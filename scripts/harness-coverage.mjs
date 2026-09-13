/* harness-coverage.mjs — a test suite that nothing runs is not a test suite.
 *
 * WHAT THIS EXISTS FOR
 * StarNix is the largest app in this repo, and the primary suites for all three
 * of its games had never been executed by CI. Not once. They were written, they
 * passed, and nothing invoked them:
 *
 *   arm-run.cjs          163 checks
 *   cc-run.cjs           124 checks
 *   kbb-run.cjs          156 checks
 *   cc-death-paths.cjs     5 checks
 *   kbb-draw.cjs          16 checks
 *   kbb-fuzz.cjs          invariants across randomised runs
 *   arm-fuzz.cjs         the only fuzz of the ARM flight engine
 *
 * Alongside them, `node perf-smoke.mjs` WAS a CI step -- one that exits 0
 * without running anything unless PERF=1 is set, which CI never set, in a job
 * with no browser for it to use. A green step that ran nothing.
 *
 * And verify-build.mjs, a ~400-line build verifier, has been stale since NIT
 * (the in-game exam) was removed in d4892dd. It asserts four mission lines where
 * there are three, fails two checks, and then crashes dereferencing the button
 * that no longer exists. Nobody found out, because nobody ran it.
 *
 * The common cause is not any of those files. It is that nothing compared what
 * exists on disk with what CI invokes.
 *
 * HOW IT WORKS
 * Exhaustive classification, deliberately not a heuristic. Every candidate file
 * must be either invoked by ci.yml or listed in EXCLUDED with a reason. A file
 * that is neither fails the build and has to be classified by a person. There is
 * no "looks like a library" guess to be wrong about.
 *
 * Pure Node, no browser. Run: node scripts/harness-coverage.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* Directories whose .mjs/.cjs files are all candidates. */
const DIRS = ['starnix', 'scripts', 'practice-exams', 'wwtbane/tests'];

/* Not run by CI, and why. Every entry needs a reason someone can disagree with.
 * This is the list a reviewer should read first. */
const EXCLUDED = {
  // --- shared libraries: they define helpers, they are not suites ---
  'scripts/browser-env.mjs':      'library — finds Chromium and axe for the browser suites',
  'starnix/arm-headless.cjs':     'library — the jsdom ctx the ARM harnesses eval arm.js inside',
  'starnix/kbb-headless.cjs':     'library — same for KBB; its own header says "run nothing directly"',
  'wwtbane/tests/_harness.mjs':   'library — serves the repo and resolves Playwright for the e2e runs',
  'wwtbane/tests/fixtures.mjs':   'library — shared question/save fixtures',

  // --- tools that produce something rather than assert something ---
  'starnix/render-kbb-sprites.mjs': 'asset generator — writes sprite PNGs, run when the art changes',
  'starnix/visual-playtest.mjs':    'manual — drives a real browser for eyeball review, not pass/fail',
  'wwtbane/tests/shots.mjs':        'manual — captures design screenshots',
  'wwtbane/tests/shots-gfx.mjs':    'manual — same, for the 3D backdrop',

  // --- needs a dependency the everyday gate should not carry ---
  'starnix/kbb-draw.cjs':
    'needs the native canvas backend (starnix/package.json declares canvas@^3). ' +
    'Measured: with canvas removed, arm-run, cc-run, kbb-run, cc-death-paths and ' +
    'both fuzzers still pass, and kbb-draw fails 6 of its 16 checks -- it really ' +
    'does exercise real rendering. A native build in CI to buy one suite is a bad ' +
    'trade; run it locally with `cd starnix && npm install && node kbb-draw.cjs`.',

  // --- opt-in, because running them everywhere would be wrong ---
  'starnix/perf-smoke.mjs':
    'opt-in — needs PERF=1 AND a Chromium. It was a CI step without either, so it ' +
    'exited 0 having run nothing; removed in v2.40.0 rather than left as a green ' +
    'step that tested air. Run it before a release: cd starnix && PERF=1 node perf-smoke.mjs',
  'wwtbane/tests/e2e.mjs':    'opt-in — needs a browser; the browser job covers this ground end to end',
  'wwtbane/tests/smoke.mjs':  'opt-in — needs a browser, same',

  // --- known stale, and named so it stays visible ---
  'starnix/verify-build.mjs':
    'STALE, NOT WIRED — asserts the NIT exam feature that d4892dd removed entirely. ' +
    'It expects four mission lines (ARM,CC,KBB,NIT) where the shell renders three, ' +
    'fails that check and the finale-reveal check, then crashes dereferencing the ' +
    'NIT button. Its NIT assumptions run through several blocks (lines ~154-410), so ' +
    'this needs a deliberate pass by someone who knows what those blocks were for -- ' +
    'not a quiet deletion. Until then it is dark on purpose rather than by accident.',

  // --- build, not test ---
  'starnix/build.mjs': 'the build itself — CI runs it as `node build.mjs`, matched separately',
};

/* Everything ci.yml actually invokes. Covers plain `node x.mjs`, an env prefix
 * (`ARM_FUZZ_RUNS=6 node arm-fuzz.cjs`), a relative path (`../scripts/x.mjs`)
 * and the one glob (`node --test tests/*.test.mjs`). */
const ciPath = join(ROOT, '.github', 'workflows', 'ci.yml');
ok('ci.yml is there to read', existsSync(ciPath));
const ciRaw = readFileSync(ciPath, 'utf8');

/* Comments are stripped FIRST. This file's own workflow comments name commands
 * in prose -- "run it before a release: PERF=1 node perf-smoke.mjs" -- and a
 * parse that reads those as invocations concludes CI runs a step it removed.
 * It did exactly that on the first run of this suite. */
const ci = ciRaw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

const invocations = (text) => {
  const out = new Set();
  for (const m of text.matchAll(/node\s+(?:--\S+\s+)*([^\s|;&]+\.(?:mjs|cjs))/g)) {
    out.add(m[1].replace(/^\.\.\//, '').split('/').pop());
  }
  return out;
};
const invoked = invocations(ci);
const globbed = /node\s+--test\s+tests\/\*\.test\.mjs/.test(ci);
ok('ci.yml invokes something -- a parse that found nothing would pass everything',
  invoked.size >= 20, invoked.size + ' invocations found');
ok('and the wwtbane glob is recognised', globbed);
ok('comments are stripped -- a command named in prose is not an invocation',
  !invocations(ciRaw.split('\n').filter((l) => /^\s*#/.test(l)).join('\n')).size ||
  !invoked.has('perf-smoke.mjs'),
  'perf-smoke.mjs is named in a workflow comment and must not count as run');

/* Candidates on disk. */
const candidates = [];
for (const dir of DIRS) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const name of readdirSync(abs)) {
    if (!/\.(mjs|cjs)$/.test(name)) continue;
    candidates.push(`${dir}/${name}`);
  }
}
ok('found harness files to classify', candidates.length >= 30, candidates.length);

/* The rule. */
const unclassified = [];
for (const rel of candidates) {
  const base = rel.split('/').pop();
  if (invoked.has(base)) continue;
  if (globbed && rel.startsWith('wwtbane/tests/') && /\.test\.mjs$/.test(base)) continue;
  if (Object.prototype.hasOwnProperty.call(EXCLUDED, rel)) continue;
  unclassified.push(rel);
}
ok('every harness is either run by CI or documented as not run',
  unclassified.length === 0,
  unclassified.join(', ') + ' -- add it to ci.yml, or to EXCLUDED with a reason');

/* An exclusion with no reason is just a way to hide a file. */
const thin = Object.entries(EXCLUDED).filter(([, why]) => !why || why.length < 25).map(([k]) => k);
ok('every exclusion carries a real reason', thin.length === 0, thin.join(', '));

/* And the list must not rot the other way: an entry for a file that is gone, or
 * for one CI actually runs, is a stale claim. */
const ghosts = Object.keys(EXCLUDED).filter((rel) => !existsSync(join(ROOT, rel)));
ok('no exclusion names a file that no longer exists', ghosts.length === 0, ghosts.join(', '));
const contradictions = Object.keys(EXCLUDED)
  .filter((rel) => rel !== 'starnix/build.mjs' && invoked.has(rel.split('/').pop()));
ok('no exclusion contradicts ci.yml by naming something it runs',
  contradictions.length === 0, contradictions.join(', '));

/* The specific regressions this release fixed, named so they cannot come back
 * quietly as a line deleted from ci.yml. */
for (const suite of ['arm-run.cjs', 'cc-run.cjs', 'kbb-run.cjs',
                     'cc-death-paths.cjs', 'kbb-fuzz.cjs', 'arm-fuzz.cjs']) {
  ok(`CI runs ${suite}`, invoked.has(suite));
}
/* The suites need jsdom, and the job that runs them installs nothing by default.
 * That is why they were dark, and leaving the install out is how they go dark
 * again -- with a MODULE_NOT_FOUND rather than silence, but dark all the same. */
ok('the StarNix job installs jsdom, without which none of those six can start',
  /npm install[^\n]*\bjsdom@/.test(ci));
/* Into starnix/, specifically. cc-death-paths.cjs requires jsdom by absolute
 * path -- require(__dirname + '/node_modules/jsdom') -- which only one directory
 * satisfies. Installing at the workspace root resolves the bare-name requires
 * and fails that one, which is how the second attempt at this release went red. */
ok('and into starnix/, where the absolute-path require can find it',
  /npm install[^\n]*--prefix\s+"\$GITHUB_WORKSPACE\/starnix"[^\n]*jsdom@/.test(ci));
ok('and verifies BOTH require forms, not just the bare one',
  /require\.resolve\('jsdom'\)/.test(ci) && /test -d[^\n]*starnix\/node_modules\/jsdom/.test(ci));
ok('and does not pull in canvas, which only kbb-draw needs',
  !/npm install[^\n]*\bcanvas@/.test(ci));
ok('perf-smoke.mjs is NOT a CI step -- it cannot pass without PERF=1 and a browser',
  !invoked.has('perf-smoke.mjs'));

/* ---- the rule can see a gap ----
 *
 * Everything above passes, which proves only that today's lists agree. Re-run
 * the SAME rule against a workflow with a suite removed, and against a
 * candidate that is on neither list, and require both to be reported.
 */
{
  /* Mirrors the real rule above, glob exemption included. Leaving that out made
   * the self-check report all 25 wwtbane .test.mjs files as dark, which they
   * never were -- `node --test tests/*.test.mjs` has always covered them. */
  const rule = (invokedSet, files, excluded, glob = globbed) => files.filter((rel) => {
    const base = rel.split('/').pop();
    if (invokedSet.has(base)) return false;
    if (glob && rel.startsWith('wwtbane/tests/') && /\.test\.mjs$/.test(base)) return false;
    if (Object.prototype.hasOwnProperty.call(excluded, rel)) return false;
    return true;
  });

  ok('self-check: a harness on neither list is reported',
    rule(invoked, ['starnix/brand-new-suite.cjs'], EXCLUDED).join() === 'starnix/brand-new-suite.cjs');
  ok('self-check: one CI runs is not',
    rule(invoked, ['starnix/arm-run.cjs'], EXCLUDED).length === 0);
  ok('self-check: one on the exclusion list is not',
    rule(invoked, ['starnix/verify-build.mjs'], EXCLUDED).length === 0);

  const without = new Set(invoked); without.delete('kbb-fuzz.cjs');
  ok('self-check: deleting a suite from ci.yml brings it back as unclassified',
    rule(without, ['starnix/kbb-fuzz.cjs'], EXCLUDED).join() === 'starnix/kbb-fuzz.cjs');

  /* And against the real ci.yml as it was before this release. */
  const before = ci.replace(/^\s*- run: (ARM_FUZZ_RUNS=6 )?node (arm-run|cc-run|kbb-run|cc-death-paths|kbb-fuzz|arm-fuzz)\.cjs\s*$/gm, '');
  const beforeInvoked = invocations(before);
  const wouldReport = rule(beforeInvoked, candidates, EXCLUDED);
  ok('self-check: the pre-v2.40.0 workflow reports all six dark suites',
    wouldReport.length === 6, wouldReport.join(', '));
}

console.log('\n' + (fail
  ? `HARNESS COVERAGE: ${fail} FAILED (${pass} passed)`
  : `HARNESS COVERAGE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
