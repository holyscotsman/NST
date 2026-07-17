// Every src module must PARSE. The game dynamically imports heavy modules
// (studio.js) inside try/catch and falls back to the CSS backdrop on failure —
// which means a SyntaxError (e.g. a duplicate identifier) ships as a silent
// visual downgrade instead of a red build. This test makes it a red build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

for (const file of walk(root)) {
  test(`parses: ${file.slice(root.length + 1)}`, () => {
    // stdin + --input-type=module makes --check treat the source as ESM
    // regardless of extension or package.json context.
    assert.doesNotThrow(
      () => execFileSync(process.execPath, ['--input-type=module', '--check'], {
        input: readFileSync(file, 'utf8'),
        stdio: ['pipe', 'pipe', 'pipe'],
      }),
      `${file} failed to parse`
    );
  });
}
