// coins.js — coin economy & banking. Pure.
// Coins scale with questions answered AND tiers cleared. They bank at each tier
// boundary; dying mid-tier drops the player to the last banked amount, losing
// only the current tier's unbanked coins (CLAUDE.md §3).

import { LADDER, BANK_BOUNDARIES } from './config.js';

// Cumulative coins after answering the question at 0-based index correctly.
export function ladderValue(qIndex) {
  if (qIndex < 0) return 0;
  return LADDER[Math.min(qIndex, LADDER.length - 1)];
}

// The running (not-yet-guaranteed) total after clearing `clearedCount` questions.
export function runningTotal(clearedCount) {
  if (clearedCount <= 0) return 0;
  return ladderValue(clearedCount - 1);
}

// The guaranteed banked amount after clearing `clearedCount` questions:
// the ladder value at the highest tier boundary the player has passed.
export function bankedAfter(clearedCount) {
  let banked = 0;
  for (const b of BANK_BOUNDARIES) {
    if (b + 1 <= clearedCount) banked = ladderValue(b);
  }
  return banked;
}

// True if clearing the question at 0-based qIndex crosses a bank boundary.
export function isBankBoundary(qIndex) {
  return BANK_BOUNDARIES.includes(qIndex);
}

// Coins the player walks away with when a run ends.
//   won  -> the full top prize (finished all 30).
//   dead -> whatever was banked at the last tier boundary passed.
export function payout({ clearedCount, won }) {
  if (won) return ladderValue(LADDER.length - 1);
  return bankedAfter(clearedCount);
}

// The next safe haven ahead of the player (for HUD "guaranteed at" hints).
// Returns { qIndex, amount } or null if past the last boundary.
export function nextBoundary(clearedCount) {
  for (const b of BANK_BOUNDARIES) {
    if (b + 1 > clearedCount) return { qIndex: b, amount: ladderValue(b) };
  }
  return null;
}
