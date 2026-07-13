import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('../scripts/import-questions.mjs', import.meta.url).pathname;

function run(mdPath, outPath, force = false, extra = []) {
  const args = [SCRIPT, mdPath, outPath, ...(force ? ['--force'] : []), ...extra];
  try {
    execFileSync('node', args, { stdio: 'pipe' });
    return { code: 0 };
  } catch (e) {
    return { code: e.status ?? 1 };
  }
}

// A complete run-ready bank as Markdown (10 easy / 10 medium / 9 hard / 1 extreme).
function fullBankMd() {
  let bank = '';
  for (let i = 0; i < 10; i++) bank += q(i, 'ahv', 'easy');
  for (let i = 0; i < 10; i++) bank += q(100 + i, 'storage', 'medium');
  for (let i = 0; i < 9; i++) bank += q(200 + i, 'prism', 'hard');
  bank += q(300, 'security', 'extreme');
  return bank;
}

// One valid question block for the given tier.
function q(n, domain, difficulty) {
  return `## Q${n}\n- **Domain:** ${domain}\n- **Difficulty:** ${difficulty}\n\n**Question:** Stem number ${n} long enough to validate here?\n- [x] Right\n- [ ] W1\n- [ ] W2\n- [ ] W3\n\n**Explanation:** Right is right for stem ${n} here.\n`;
}

let dir;
test.before(() => { dir = mkdtempSync(join(tmpdir(), 'wwt-import-')); });
test.after(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

test('importer refuses to write and leaves a good bank untouched when the input is invalid', () => {
  const md = join(dir, 'bad.md');
  const out = join(dir, 'out1.js');
  writeFileSync(md, '# not a question at all\njust prose, no headings');
  const sentinel = 'export const QUESTIONS = ["DO NOT CLOBBER"];\n';
  writeFileSync(out, sentinel);
  const { code } = run(md, out);
  assert.notEqual(code, 0, 'exits non-zero on an unparseable bank');
  assert.equal(readFileSync(out, 'utf8'), sentinel, 'existing bank is byte-identical (not clobbered)'); // NEGATIVE CONTROL
});

test('importer refuses even with --force when zero valid questions parse', () => {
  const md = join(dir, 'empty.md');
  const out = join(dir, 'out2.js');
  writeFileSync(md, '## Q1\n- **Domain:** nonsense\n\n**Question:** short'); // invalid domain, too-short stem, no options
  const before = 'export const QUESTIONS = ["KEEP"];\n';
  writeFileSync(out, before);
  const { code } = run(md, out, true);
  assert.notEqual(code, 0, '--force still refuses an empty result');
  assert.equal(readFileSync(out, 'utf8'), before); // NEGATIVE CONTROL: --force never writes []
});

test('importer refuses a run-incomplete bank without --force, but writes the valid subset with it', () => {
  const md = join(dir, 'short.md');
  const out = join(dir, 'out3.js');
  writeFileSync(md, q(1, 'ahv', 'easy') + '\n' + q(2, 'storage', 'medium')); // only 2 questions
  assert.notEqual(run(md, out).code, 0, 'refuses a too-small bank by default');
  assert.ok(!existsSync(out), 'nothing written on refusal');

  assert.equal(run(md, out, true).code, 0, '--force writes the valid subset');
  const written = readFileSync(out, 'utf8');
  assert.match(written, /export const QUESTIONS = /);
  assert.match(written, /"AHV-E-001"/);
  assert.match(written, /"STOR-M-001"/);
});

test('importer writes cleanly when the bank is complete', () => {
  const md = join(dir, 'full.md');
  const out = join(dir, 'out4.js');
  writeFileSync(md, fullBankMd());
  assert.equal(run(md, out).code, 0, 'a complete bank writes without --force');
  assert.match(readFileSync(out, 'utf8'), /export const QUESTIONS = \[/);
});

test('--merge adds new questions ahead of the existing bank, keeping the rest', () => {
  const out = join(dir, 'merge.js');
  // Seed the output with a full existing bank.
  writeFileSync(join(dir, 'base.md'), fullBankMd());
  assert.equal(run(join(dir, 'base.md'), out).code, 0);
  const baseCount = (readFileSync(out, 'utf8').match(/"id":/g) || []).length;

  // Merge two brand-new priority questions in.
  const add = `## P1\n- **Domain:** networking\n- **Difficulty:** medium\n- **ID:** NPX-M-001\n- **Priority:** yes\n\n**Question:** A priority stem long enough to validate here?\n- [x] Right\n- [ ] W1\n- [ ] W2\n- [ ] W3\n\n**Explanation:** Right is right here for the priority one.\n` +
    `## P2\n- **Domain:** networking\n- **Difficulty:** hard\n- **ID:** NPX-H-001\n- **Priority:** yes\n\n**Question:** A second priority stem long enough here?\n- [x] Right\n- [ ] W1\n- [ ] W2\n- [ ] W3\n\n**Explanation:** Right is right here too.\n`;
  const addMd = join(dir, 'add.md');
  writeFileSync(addMd, add);
  assert.equal(run(addMd, out, false, ['--merge']).code, 0, 'merge writes a full-run-ready combined bank');

  const written = readFileSync(out, 'utf8');
  const total = (written.match(/"id":/g) || []).length;
  assert.equal(total, baseCount + 2, 'merged bank = base + 2 new');
  assert.match(written, /"NPX-M-001"/);
  assert.match(written, /"AHV-E-001"/, 'existing questions are preserved'); // NEGATIVE CONTROL
  // The new priority questions come first (ahead of the existing bank).
  assert.ok(written.indexOf('"NPX-M-001"') < written.indexOf('"AHV-E-001"'), 'new/priority questions are first');
});

test('--merge is idempotent — re-running replaces same-id questions, not duplicates them', () => {
  const out = join(dir, 'merge2.js');
  writeFileSync(join(dir, 'base2.md'), fullBankMd());
  run(join(dir, 'base2.md'), out);
  const add = `## P1\n- **Domain:** networking\n- **Difficulty:** medium\n- **ID:** NPX-M-050\n- **Priority:** yes\n\n**Question:** An idempotent priority stem long enough here?\n- [x] Right\n- [ ] W1\n- [ ] W2\n- [ ] W3\n\n**Explanation:** Right is right in the idempotent case.\n`;
  const addMd = join(dir, 'add2.md');
  writeFileSync(addMd, add);
  run(addMd, out, false, ['--merge']);
  const first = (readFileSync(out, 'utf8').match(/"id":/g) || []).length;
  run(addMd, out, false, ['--merge']); // run it again
  const second = (readFileSync(out, 'utf8').match(/"id":/g) || []).length;
  assert.equal(first, second, 're-merging the same id does not grow the bank'); // NEGATIVE CONTROL
  assert.equal((readFileSync(out, 'utf8').match(/"NPX-M-050"/g) || []).length, 1, 'exactly one copy of the id');
});
