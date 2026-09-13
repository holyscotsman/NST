/* docs-test.mjs — documentation that describes a repository it no longer has.
 *
 * Two kinds of rot, both found by hand and both cheap to catch:
 *
 *   - **The architecture tree stopped matching the repository.** README.md's
 *     tree listed seven top-level entries; the repo had ten. Missing were
 *     `server/` — which has its own section further down the SAME file —
 *     `scripts/`, and `styles/`. Anyone reading it to find their way around was
 *     told the login server did not exist.
 *   - **Links to files that moved or were never there.** A dead link in a README
 *     is invisible until somebody clicks it, and nothing here ever clicked.
 *
 * Pure Node, no network. Run: node scripts/docs-test.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* Directories that exist only for tooling, and that no reader needs a map to. */
const NOT_ARCHITECTURE = new Set(['.git', 'node_modules', '.github']);

const README = readFileSync(join(ROOT, 'README.md'), 'utf8');

/* ---- the tree must describe the repository that is actually here ---- */
{
  const realDirs = readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !NOT_ARCHITECTURE.has(d.name))
    .map((d) => d.name)
    .sort();

  // The fenced block that starts with the repo name.
  const block = (README.match(/```\s*\nNST\/\n([\s\S]*?)```/) || [])[1] || '';
  ok('README has an architecture tree', block.length > 0);

  const listed = new Set();
  for (const line of block.split('\n')) {
    const m = line.match(/^[│\s]*[├└]──\s+([^\s#]+)/);
    if (m) listed.add(m[1].replace(/\/$/, ''));
  }
  ok('and it lists something', listed.size > 0, listed.size);

  const missing = realDirs.filter((d) => !listed.has(d));
  ok('every top-level directory in the repo appears in the tree',
    missing.length === 0, missing.join(', '));

  // And nothing listed has since been deleted or renamed.
  const ghosts = [...listed].filter((e) => {
    const p = join(ROOT, e);
    // ".github/workflows" and similar nested entries are written as one token
    return !existsSync(p);
  });
  ok('and nothing in the tree has since disappeared', ghosts.length === 0, ghosts.join(', '));

  // server/ in particular: the README documents it at length further down, so a
  // tree without it contradicts the same file.
  ok('the tree includes server/, which the README documents below it',
    listed.has('server'), [...listed].join(' '));
  ok('and scripts/, where every shared test lives', listed.has('scripts'));
}

/* ---- every relative link in the docs must resolve ---- */
{
  const docs = [
    'README.md', 'CHANGELOG.md',
    'server/README.md', 'banks/README.md',
    'docs/BANK_FORMAT.md', 'docs/NST_KNOWLEDGE_BASE.md',
  ].filter((f) => existsSync(join(ROOT, f)));

  ok('the documents this checks all exist', docs.length >= 4, docs.length);

  const broken = [];
  for (const doc of docs) {
    const text = readFileSync(join(ROOT, doc), 'utf8');
    const base = dirname(join(ROOT, doc));
    // [label](target) — skip absolute URLs, anchors and mailto.
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      let target = m[1];
      if (/^(https?:|mailto:|#|data:)/.test(target)) continue;
      target = target.split('#')[0];
      if (!target) continue;
      const abs = resolve(base, decodeURIComponent(target));
      // Must stay inside the repo and must exist.
      if (!abs.startsWith(ROOT)) { broken.push(`${doc} -> ${m[1]} (outside the repo)`); continue; }
      if (!existsSync(abs)) { broken.push(`${doc} -> ${m[1]}`); continue; }
      // A link ending in "/" should be a directory, not a file.
      if (m[1].endsWith('/') && !statSync(abs).isDirectory()) broken.push(`${doc} -> ${m[1]} (not a directory)`);
    }
  }
  ok('every relative link in the docs resolves to something that exists',
    broken.length === 0, broken.slice(0, 6).join('; '));
}

/* ---- the claims that contradicted each other ---- */
{
  // The opening used to say "nothing is sent to a server, there's no account to
  // make" while the same file documented accounts, login and server-side sync.
  // On a self-hosted instance the first half of that was simply untrue.
  const hasServerSection = /##\s+Host it for a team/.test(README);
  ok('the README still documents the optional server', hasServerSection);
  if (hasServerSection) {
    ok('and no longer claims, without qualification, that nothing is sent to a server',
      !/nothing is sent to a server, there's no\s*\n?account to make/.test(README));
    ok('the local-only promise is scoped to the public static site',
      /On the public site above, that is \*\*entirely local\*\*/.test(README));
  }
}

/* ---- the version the docs advertise ---- */
{
  const ver = (readFileSync(join(ROOT, 'shared', 'nst-version.js'), 'utf8')
    .match(/NST_VERSION = "(\d+\.\d+\.\d+)"/) || [])[1];
  ok('the version stamp is readable', !!ver, ver);
  const kb = join(ROOT, 'docs', 'NST_KNOWLEDGE_BASE.md');
  if (existsSync(kb)) {
    const text = readFileSync(kb, 'utf8');
    // The knowledge base names CI jobs; it must at least know there are four.
    ok('the knowledge base knows about the browser CI job',
      /browser/i.test(text) && /NST_REQUIRE_BROWSER/.test(text));
  }
}

/* ---- server/README.md is the page somebody follows to stand a VM up --------
 * Two things in it go stale without anyone noticing: a setting the code reads
 * that the table never mentions (unfindable), a row for one the code no longer
 * reads (silently does nothing), and the performance figures, which are exact
 * today and drift the moment content changes. */
{
  const srvDoc = join(ROOT, 'server', 'README.md');
  if (existsSync(srvDoc)) {
    const doc = readFileSync(srvDoc, 'utf8');

    // Every NST_* the SERVER reads (scripts/ has its own, for test tooling).
    const read = new Set();
    for (const f of readdirSync(join(ROOT, 'server')).filter((n) => n.endsWith('.mjs'))) {
      const src = readFileSync(join(ROOT, 'server', f), 'utf8');
      for (const m of src.matchAll(/process\.env\.(NST_[A-Z_]+)/g)) read.add(m[1]);
    }
    const documented = new Set([...doc.matchAll(/^\|\s*`(NST_[A-Z_]+)`/gm)].map((m) => m[1]));

    ok('the server reads at least one setting', read.size > 0, read.size);
    const undocumented = [...read].filter((v) => !documented.has(v));
    ok('every setting the server reads is in the configuration table',
      undocumented.length === 0, undocumented.join(', '));
    const phantom = [...documented].filter((v) => !read.has(v));
    ok('and the table has no row for a setting the server ignores',
      phantom.length === 0, phantom.join(', '));

    /* The compression table. These are the numbers a reader uses to decide
     * whether this will be fast enough over their network, so a stale one is a
     * wrong answer, not a typo. Tolerance is deliberately tight: they are exact
     * today, and 3% of the StarNix build is still 86 KB of headroom. */
    const zlib = await import('node:zlib');
    const Q = Number((readFileSync(join(ROOT, 'server', 'compress.mjs'), 'utf8')
      .match(/BR_QUALITY\s*=\s*(\d+)/) || [])[1]);
    ok('the brotli quality the server uses is readable', Number.isFinite(Q) && Q > 0, Q);

    const rows = [...doc.matchAll(/^\|\s*([^|]*?[A-Za-z][^|]*?)\s*\|\s*(\d+) KB\s*\|\s*(\d+) KB\s*\|/gm)]
      .map((m) => ({ label: m[1].trim(), disk: +m[2], wire: +m[3] }));
    ok('the performance table has rows to check', rows.length >= 3, rows.length);

    const FILES = {
      'StarNix (one self-contained file)': 'starnix/index.html',
      'The NCP-MCI question bank': 'banks/ncp-mci/ncp-mci.md',
      "WWTBANE's 3D library": 'wwtbane/vendor/three/build/three.module.min.js',
    };
    for (const row of rows) {
      const rel = FILES[row.label];
      if (!rel) { ok(`performance table row "${row.label}" names a file this check knows`, false, 'unmapped row'); continue; }
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) { ok(`"${row.label}" — the file it describes exists`, false, rel); continue; }
      const buf = readFileSync(abs);
      const disk = Math.round(buf.length / 1024);
      const wire = Math.round(zlib.brotliCompressSync(buf,
        { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: Q } }).length / 1024);
      const dDrift = Math.abs(disk - row.disk) / row.disk * 100;
      const wDrift = Math.abs(wire - row.wire) / row.wire * 100;
      ok(`"${row.label}" — the on-disk size in the README is current`,
        dDrift <= 3, `README says ${row.disk} KB, it is ${disk} KB`);
      ok(`"${row.label}" — and the over-the-wire size is current`,
        wDrift <= 5, `README says ${row.wire} KB, brotli q${Q} gives ${wire} KB`);
    }
  }
}

/* ---- (v2.42.0) the CI section, against the workflow it describes ----
 *
 * The knowledge base's "Testing & CI" section had drifted into fiction. It said
 * CI runs four jobs of which THREE are dependency-free (two are), that the
 * browser job is "the repo's only npm install" (there are two), that the browser
 * job runs six suites (nine), and it listed six StarNix harnesses where the job
 * runs nineteen. Some of that rot was months old and some of it was a day old --
 * v2.40.0 added the jsdom install and six game suites and did not come back to
 * this file.
 *
 * That is the same failure as the architecture tree above: a document describing
 * a repository it no longer has. The tree is checked against the filesystem, so
 * this is checked against ci.yml.
 *
 * The checkable claims only. The prose is not required to enumerate every suite
 * -- forcing that would make the document a worse read and the check a nuisance
 * -- but every suite it DOES name has to be real, and the counts it states have
 * to be right.
 */
{
  const kb = readFileSync(join(ROOT, 'docs', 'NST_KNOWLEDGE_BASE.md'), 'utf8');
  const ciRaw = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  const ci = ciRaw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

  /* Jobs are the keys under `jobs:` at four-space indent that carry a name. */
  const jobBlocks = ci.split(/\n  [a-z][a-z0-9-]*:\n/).filter((b) => /^\s+name: /m.test(b));
  const jobs = jobBlocks.filter((b) => /runs-on:/.test(b));
  ok('ci.yml parses into jobs at all -- a parse finding none would pass everything',
    jobs.length >= 3, jobs.length + ' jobs');

  const installs = jobs.filter((b) => /npm install/.test(b));
  const free = jobs.length - installs.length;

  const saysJobs = kb.match(/runs \*\*(\w+) jobs?\*\*/);
  /* Spelled-out counts the READMEs use. It stopped at ten and the browser job
   * reached eleven, so the rule failed on its own vocabulary rather than on any
   * drift -- "README says Eleven, the job runs 11". Carried well past the
   * current numbers so the next suite does not do the same. */
  const WORDS = {
    two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  };
  ok('the knowledge base states how many CI jobs there are', !!saysJobs, saysJobs && saysJobs[1]);
  ok('and the number is right', !!saysJobs && WORDS[saysJobs[1]] === jobs.length,
    `doc says ${saysJobs && saysJobs[1]}, ci.yml has ${jobs.length}`);

  const saysFree = kb.match(/\*\*(\w+) are\s*\n?\s*dependency-free\*\*/);
  ok('the knowledge base states how many jobs are dependency-free', !!saysFree,
    saysFree && saysFree[1]);
  ok('and that number is right too', !!saysFree && WORDS[saysFree[1]] === free,
    `doc says ${saysFree && saysFree[1]}, ci.yml has ${free} job(s) with no npm install`);

  /* "the only npm install" was true once and is not now. */
  ok('the knowledge base no longer calls any job the repo\'s ONLY npm install',
    !/only\s+\n?\s*`?npm install`?/i.test(kb),
    `there are ${installs.length} jobs that install something`);

  /* Every suite the document names must be one CI actually runs. A phantom suite
   * is how a reader goes looking for coverage that is not there. */
  const invoked = new Set();
  for (const m of ci.matchAll(/node\s+(?:--\S+\s+)*([^\s|;&]+\.(?:mjs|cjs))/g)) {
    invoked.add(m[1].replace(/^\.\.\//, '').split('/').pop().replace(/\.(mjs|cjs)$/, ''));
  }
  /* Named in backticks in the CI section, in the shape of a suite. */
  const sectionStart = kb.indexOf('## 8. Testing & CI');
  const sectionEnd = kb.indexOf('\n---', sectionStart);
  const section = kb.slice(sectionStart, sectionEnd > 0 ? sectionEnd : undefined);
  const named = [...section.matchAll(/`([a-z][a-z0-9-]*(?:-test|-run|-fuzz|-check|-smoke|-audit|-browser|-lint|-balance|-paths|-draw|-coverage))(?:\.(?:mjs|cjs))?`/g)]
    .map((m) => m[1]);
  ok('the CI section names some suites -- a regex matching none would pass everything',
    named.length >= 10, named.length + ' named');

  /* kbb-draw and perf-smoke are named as deliberately NOT wired, so they are
   * expected to be absent from ci.yml; naming them is the point. */
  const EXPECTED_ABSENT = new Set(['kbb-draw', 'perf-smoke']);
  const phantom = [...new Set(named)].filter((n) => !invoked.has(n) && !EXPECTED_ABSENT.has(n));
  ok('every suite the CI section names is one CI actually runs', phantom.length === 0,
    phantom.join(', ') + ' -- named in the document, absent from ci.yml');

  ok('and the two it names as deliberately unwired really are unwired',
    [...EXPECTED_ABSENT].every((n) => !invoked.has(n) && section.includes(n)),
    [...EXPECTED_ABSENT].filter((n) => invoked.has(n)).join(', '));

  /* The README states the browser-suite count in prose too, and drifted the same
   * way -- it said six when the job runs nine. Two documents, one workflow. */
  const browserJob = jobs.find((b) => /playwright/i.test(b)) || '';
  const browserSuites = [...browserJob.matchAll(/node\s+scripts\/([a-z0-9-]+)\.mjs/g)]
    .map((m) => m[1]);
  ok('the browser job runs a countable set of suites', browserSuites.length >= 5,
    browserSuites.join(', '));
  const saysBrowser = README.match(/(\w+) further suites need a real browser/);
  ok('the README states how many suites need a browser', !!saysBrowser,
    saysBrowser && saysBrowser[1]);
  ok('and that number matches the job',
    !!saysBrowser && WORDS[saysBrowser[1].toLowerCase()] === browserSuites.length,
    `README says ${saysBrowser && saysBrowser[1]}, the job runs ${browserSuites.length}`);

  /* Not vacuous. */
  ok('self-check: a phantom suite would be caught',
    !invoked.has('no-such-suite-test'));
  ok('self-check: the job counter tracks ci.yml rather than a constant',
    jobs.length === [...ci.matchAll(/runs-on:/g)].length, jobs.length);
}

console.log('\n' + (fail ? `DOCS: ${fail} FAILED (${pass} passed)` : `DOCS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
