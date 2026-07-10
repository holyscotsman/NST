import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('../scripts/import-questions.mjs', import.meta.url).pathname;

function run(mdPath, outPath, force = false) {
  const args = [SCRIPT, mdPath, outPath, ...(force ? ['--force'] : [])];
  try {
    execFileSync('node', args, { stdio: 'pipe' });
    return { code: 0 };
  } catch (e) {
    return { code: e.status ?? 1 };
  }
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
  let bank = '';
  for (let i = 0; i < 10; i++) bank += q(i, 'ahv', 'easy');
  for (let i = 0; i < 10; i++) bank += q(100 + i, 'storage', 'medium');
  for (let i = 0; i < 9; i++) bank += q(200 + i, 'prism', 'hard');
  bank += q(300, 'security', 'extreme');
  writeFileSync(md, bank);
  assert.equal(run(md, out).code, 0, 'a complete bank writes without --force');
  assert.match(readFileSync(out, 'utf8'), /export const QUESTIONS = \[/);
});
