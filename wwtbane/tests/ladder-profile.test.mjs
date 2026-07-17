// Ladder profiles: short banks (MIN_BANK..29 valid questions) play a scaled
// ladder; >=30 keeps the classic run. The classic profile must be numerically
// identical to the pinned LADDER/BANK_BOUNDARIES constants so the two sources
// can never drift.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN_LENGTH, TIERS, LADDER, BANK_BOUNDARIES, MIN_BANK,
  CLASSIC_LADDER, ladderProfile, setActiveLadder, activeLadder,
} from '../src/core/config.js';
import { ladderValue, runningTotal, bankedAfter, payout, nextBoundary, isBankBoundary } from '../src/core/coins.js';
import { positionTier } from '../src/core/runController.js';
import { buildSet, SetManager } from '../src/core/selection.js';

function syntheticBank(n) {
  const tiers = ['easy', 'medium', 'hard'];
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    domain: 'prism',
    authoredDifficulty: i === n - 1 ? 'extreme' : tiers[i % 3],
    type: 'single',
    stem: `Q${i}?`,
    options: ['a', 'b', 'c', 'd'],
    answer: [0],
    explanation: 'because',
    reviewStatus: 'human-reviewed',
  }));
}

test('classic profile equals the pinned constants', () => {
  assert.equal(CLASSIC_LADDER.runLength, RUN_LENGTH);
  assert.deepEqual(CLASSIC_LADDER.tiers, TIERS);
  assert.deepEqual(CLASSIC_LADDER.ladder, LADDER);
  assert.deepEqual(CLASSIC_LADDER.bankBoundaries, BANK_BOUNDARIES);
});

test('ladderProfile: >=30 classic, <MIN_BANK null', () => {
  assert.equal(ladderProfile(30), CLASSIC_LADDER);
  assert.equal(ladderProfile(255), CLASSIC_LADDER);
  assert.equal(ladderProfile(MIN_BANK - 1), null);
  assert.equal(ladderProfile(0), null);
});

test('every short profile is well-formed', () => {
  for (let n = MIN_BANK; n < RUN_LENGTH; n++) {
    const p = ladderProfile(n);
    assert.equal(p.runLength, n, `runLength for ${n}`);
    assert.equal(p.tiers.reduce((a, t) => a + t.count, 0), n, `tier sum for ${n}`);
    assert.equal(p.tiers[p.tiers.length - 1].key, 'extreme');
    assert.equal(p.tiers[p.tiers.length - 1].count, 1);
    for (const t of p.tiers) assert.ok(t.count >= 1, `tier ${t.key} >=1 for ${n}`);
    assert.equal(p.ladder.length, n);
    for (let i = 1; i < p.ladder.length; i++) assert.ok(p.ladder[i] > p.ladder[i - 1], `ladder increases for ${n}`);
    assert.equal(p.ladder[n - 1], 50000, `top prize for ${n}`);
    assert.ok(p.bankBoundaries.length >= 1);
    for (let i = 1; i < p.bankBoundaries.length; i++) assert.ok(p.bankBoundaries[i] > p.bankBoundaries[i - 1]);
    assert.ok(p.bankBoundaries[p.bankBoundaries.length - 1] <= n - 2, `havens never on the final for ${n}`);
  }
});

test('the 25-question profile matches the design', () => {
  const p = ladderProfile(25);
  assert.deepEqual(p.tiers.map((t) => t.count), [8, 8, 8, 1]);
  // scaled havens: Q4 / Q8 / Q14 / Q21 (0-based 3, 7, 13, 20)
  assert.deepEqual(p.bankBoundaries, [3, 7, 13, 20]);
  // easy 8x100=800, medium 8x500 -> 4,800, hard 8x2000 -> 20,800, final 50,000
  assert.equal(p.ladder[7], 800);
  assert.equal(p.ladder[15], 4800);
  assert.equal(p.ladder[23], 20800);
  assert.equal(p.ladder[24], 50000);
});

test('coins + tiers + selection under an active 25-question profile', (t) => {
  setActiveLadder(ladderProfile(25));
  t.after(() => setActiveLadder(null)); // restore classic for anything after

  // economy follows the scaled ladder
  assert.equal(payout({ clearedCount: 25, won: true }), 50000);
  assert.equal(ladderValue(24), 50000);
  assert.equal(runningTotal(8), 800);
  assert.equal(bankedAfter(8), 800);        // passed the Q8 haven (idx 7)
  assert.equal(bankedAfter(7), 400);        // passed only the Q4 haven (idx 3)
  assert.equal(nextBoundary(0).qIndex, 3);
  assert.ok(isBankBoundary(20) && !isBankBoundary(24));

  // play-position tiers follow the 8/8/8/1 shape
  assert.equal(positionTier(0), 'easy');
  assert.equal(positionTier(7), 'easy');
  assert.equal(positionTier(8), 'medium');
  assert.equal(positionTier(16), 'hard');
  assert.equal(positionTier(23), 'hard');
  assert.equal(positionTier(24), 'extreme');

  // a 25-question bank builds a full 25-question set, no duplicates
  const bank = syntheticBank(25);
  const set = buildSet({ bank, mode: 'seeded', seed: 'test' });
  assert.equal(set.length, 25);
  assert.equal(new Set(set.map((q) => q.id)).size, 25);

  // Steve's pin lands on the first hard slot of the short shape (8 + 8 = 16)
  const sm = new SetManager({ bank, mode: 'seeded', seed: 'test' });
  sm.init();
  const outside = { ...syntheticBank(26)[25], id: 'pinme', authoredDifficulty: 'hard' };
  sm.pinIntoCurrent(outside);
  assert.equal(sm.current()[16].id, 'pinme');
});

test('classic behavior is untouched when no profile is set', () => {
  assert.equal(activeLadder(), CLASSIC_LADDER);
  assert.equal(payout({ clearedCount: 30, won: true }), 50000);
  assert.equal(bankedAfter(10), 1000);
  assert.equal(positionTier(29), 'extreme');
  assert.throws(() => buildSet({ bank: syntheticBank(25), mode: 'seeded', seed: 'x' }), /bank too small/);
});
