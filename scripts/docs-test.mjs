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

console.log('\n' + (fail ? `DOCS: ${fail} FAILED (${pass} passed)` : `DOCS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
