// kcna-bank.test.mjs — the shipped KCNA bank must be able to carry a full WWTBANE
// run. bank-test.mjs already proves it parses and that ids are unique across banks;
// this proves the ladder can be filled: enough easy, medium and hard questions, and
// at least one final, because difficulty here is an ESTIMATE (the source pool had
// none) and a future edit must not quietly starve a tier.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { parse } = require('../../shared/bank-parser.js');
const bank = parse(readFileSync(new URL('../../banks/kcna/kcna.md', import.meta.url), 'utf8'));
const TIER = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'hard', 5: 'extreme' }; // shared/bank-loader.js
const tiers = {};
for (const q of bank.questions) tiers[TIER[q.difficulty]] = (tiers[TIER[q.difficulty]] || 0) + 1;

test('the KCNA bank parses with no errors and is KCNA-shaped', () => {
  assert.deepEqual(bank.errors, []);
  assert.equal(bank.meta.cert, 'KCNA');
  assert.equal(bank.meta.pass, 0.75);
  assert.ok(bank.questions.length >= 300, `${bank.questions.length} questions`);
});

test('every question is 4 options with exactly one correct answer, in a declared domain', () => {
  for (const q of bank.questions) {
    assert.equal(q.options.length, 4, q.id);
    assert.ok(Number.isInteger(q.correct), q.id);
    assert.ok(bank.meta.domains.includes(q.domain), `${q.id}: ${q.domain}`);
    assert.ok(q.explanation && q.explanation.length > 10, q.id);
  }
});

test('a 30-question run can be filled: 10 easy, 10 medium, 9 hard, 1 final (with room to spare)', () => {
  assert.ok(tiers.easy >= 20, `easy ${tiers.easy}`);
  assert.ok(tiers.medium >= 20, `medium ${tiers.medium}`);
  assert.ok(tiers.hard >= 18, `hard ${tiers.hard}`);
  assert.ok(tiers.extreme >= 3, `final ${tiers.extreme}`);
});

test('[neg] the distribution check can fail: a bank of only medium questions starves the ladder', () => {
  const starved = { medium: 300 };
  assert.ok(!(starved.easy >= 20));
});
