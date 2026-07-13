// docs.test.mjs — the docs-drift gate. Player-facing copy (README + in-game
// help) must describe the SHIPPED game: the fallible lifelines pinned by the
// CLAUDE.md §3 owner revision (docs/LIFELINES.md), the real safe havens, and
// the real bank size. Retired claims are pinned as forbidden strings so stale
// copy cannot quietly return.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUESTIONS } from '../src/content/questions.js';
import { BANK_BOUNDARIES } from '../src/core/config.js';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const state = readFileSync(new URL('../STATE.md', import.meta.url), 'utf8');
const screens = readFileSync(new URL('../src/shell/ui/screens.js', import.meta.url), 'utf8');

// Retired by the CLAUDE.md §3 owner revision (docs/LIFELINES.md): the audience
// can be wrong, the friend guesses. The removed mastery board must not be sold.
const FORBIDDEN = [
  'never points you at a wrong answer',
  'never points you wrong',
  'hedged tip toward the right answer',
  'mastery board',
];

// Pure checker helpers so the negative controls can exercise them directly.
export function bankCountClaim(text) {
  const m = text.match(/(\d+)-question bank/);
  return m ? parseInt(m[1], 10) : null;
}
export function forbiddenHits(text) {
  return FORBIDDEN.filter((s) => text.toLowerCase().includes(s.toLowerCase()));
}

test('README states the real bank size', () => {
  assert.equal(bankCountClaim(readme), QUESTIONS.length,
    `README's "N-question bank" must match src/content/questions.js (${QUESTIONS.length})`);
});

test('README states the real safe havens', () => {
  const havens = BANK_BOUNDARIES.map((i) => i + 1); // 0-based Q index -> Q number
  for (const q of havens) {
    assert.ok(readme.includes(String(q)), `README mentions safe haven Q${q}`);
  }
  assert.match(readme, /questions 5, 10, 17 and 25/, 'the safe-haven sentence lists them all');
});

test('README and STATE.md agree on the live URL', () => {
  const url = 'https://holyscotsman.github.io/WWTBANE/';
  assert.ok(readme.includes(url), 'README carries the live URL');
  assert.ok(state.includes(url), 'STATE.md carries the same URL');
});

test('retired lifeline/mastery-board claims are gone from README and the in-game help', () => {
  assert.deepEqual(forbiddenHits(readme), [], 'README carries no retired claims');
  assert.deepEqual(forbiddenHits(screens), [], 'the Help screen carries no retired claims');
});

test('negative control: the checkers actually catch drift', () => {
  // A wrong count is detected…
  assert.equal(bankCountClaim('a proud 157-question bank'), 157);
  assert.notEqual(bankCountClaim('a proud 157-question bank'), QUESTIONS.length);
  // …and a resurrected retired claim is detected.
  assert.deepEqual(forbiddenHits('the poll never points you wrong, honest'), ['never points you wrong']);
  assert.deepEqual(forbiddenHits('check the mastery board for progress'), ['mastery board']);
});
