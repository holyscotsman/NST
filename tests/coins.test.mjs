import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ladderValue, runningTotal, bankedAfter, payout, isBankBoundary, nextBoundary } from '../src/core/coins.js';
import { LADDER } from '../src/core/config.js';

test('ladder is strictly increasing, 30 rungs, tops out at 50,000', () => {
  assert.equal(LADDER.length, 30);
  for (let i = 1; i < LADDER.length; i++) assert.ok(LADDER[i] > LADDER[i - 1]);
  assert.equal(LADDER[29], 50000);
});

test('coins bank only at tier boundaries', () => {
  assert.equal(bankedAfter(0), 0);
  assert.equal(bankedAfter(5), 0, 'nothing banked mid first tier'); // NEGATIVE CONTROL
  assert.equal(bankedAfter(10), 1000, 'banks after Q10');
  assert.equal(bankedAfter(15), 1000, 'no new bank mid second tier');
  assert.equal(bankedAfter(20), 6000, 'banks after Q20');
  assert.equal(bankedAfter(29), 24000, 'banks after Q29');
  assert.equal(bankedAfter(30), 50000, 'full prize after Q30');
});

test('dying mid-tier drops to the last banked amount, not the running total', () => {
  // Reached Q15 (cleared 14), then wrong on Q15.
  const cleared = 14;
  assert.ok(runningTotal(cleared) > bankedAfter(cleared), 'was playing for more than is banked');
  assert.equal(payout({ clearedCount: cleared, won: false }), 1000); // only tier 1 is safe // NEGATIVE CONTROL
});

test('an early death in the first tier pays nothing banked', () => {
  assert.equal(payout({ clearedCount: 4, won: false }), 0);
});

test('winning pays the full top prize', () => {
  assert.equal(payout({ clearedCount: 30, won: true }), 50000);
});

test('bank boundary + next boundary helpers', () => {
  assert.equal(isBankBoundary(9), true);   // after Q10 (0-based index 9)
  assert.equal(isBankBoundary(4), false);
  assert.deepEqual(nextBoundary(0), { qIndex: 9, amount: 1000 });
  assert.deepEqual(nextBoundary(10), { qIndex: 19, amount: 6000 });
  assert.equal(nextBoundary(30), null);
});
