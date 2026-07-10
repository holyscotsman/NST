import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ladderValue, runningTotal, bankedAfter, payout, isBankBoundary, nextBoundary } from '../src/core/coins.js';
import { LADDER } from '../src/core/config.js';

test('ladder is strictly increasing, 30 rungs, tops out at 50,000', () => {
  assert.equal(LADDER.length, 30);
  for (let i = 1; i < LADDER.length; i++) assert.ok(LADDER[i] > LADDER[i - 1]);
  assert.equal(LADDER[29], 50000);
});

test('coins bank only at the safe havens (Q5, Q10, Q17, Q25)', () => {
  assert.equal(bankedAfter(0), 0);
  assert.equal(bankedAfter(4), 0, 'nothing banked before Q5 clears'); // NEGATIVE CONTROL
  assert.equal(bankedAfter(5), 500, 'banks after Q5');
  assert.equal(bankedAfter(9), 500, 'no new bank between Q5 and Q10'); // NEGATIVE CONTROL
  assert.equal(bankedAfter(10), 1000, 'banks after Q10');
  assert.equal(bankedAfter(15), 1000, 'no new bank mid stretch');
  assert.equal(bankedAfter(17), 4500, 'banks after Q17');
  assert.equal(bankedAfter(25), 16000, 'banks after Q25');
  assert.equal(bankedAfter(29), 16000, 'no bank at Q29 — the top is all risk'); // NEGATIVE CONTROL
});

test('dying mid-tier drops to the last banked amount, not the running total', () => {
  // Reached Q15 (cleared 14), then wrong on Q15.
  const cleared = 14;
  assert.ok(runningTotal(cleared) > bankedAfter(cleared), 'was playing for more than is banked');
  assert.equal(payout({ clearedCount: cleared, won: false }), 1000); // Q10 haven is safe // NEGATIVE CONTROL
});

test('an early death before the first haven pays nothing banked', () => {
  assert.equal(payout({ clearedCount: 4, won: false }), 0);
});

test('winning pays the full top prize', () => {
  assert.equal(payout({ clearedCount: 30, won: true }), 50000);
});

test('bank boundary + next boundary helpers', () => {
  assert.equal(isBankBoundary(4), true);   // after Q5 (0-based index 4)
  assert.equal(isBankBoundary(9), true);   // after Q10
  assert.equal(isBankBoundary(16), true);  // after Q17
  assert.equal(isBankBoundary(24), true);  // after Q25
  assert.equal(isBankBoundary(5), false);  // NEGATIVE CONTROL
  assert.equal(isBankBoundary(28), false, 'Q29 bank removed'); // NEGATIVE CONTROL
  assert.deepEqual(nextBoundary(0), { qIndex: 4, amount: 500 });
  assert.deepEqual(nextBoundary(5), { qIndex: 9, amount: 1000 });
  assert.deepEqual(nextBoundary(10), { qIndex: 16, amount: 4500 });
  assert.deepEqual(nextBoundary(17), { qIndex: 24, amount: 16000 });
  assert.equal(nextBoundary(25), null, 'nothing guaranteed past Q25');
  assert.equal(nextBoundary(30), null);
});
