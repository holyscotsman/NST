// mastery.js — per-question Leitner mastery. Pure. Shared learning state that
// persists across runs and is NEVER wiped by a win (CLAUDE.md §3).
//
// Low box  = the question is still hard for this player.
// High box = mastered; box === GRADUATED_BOX means graduated (rarely resurfaced).
// A question's effective tier is derived from its box; authored difficulty is
// only the cold-start seed for a question the player has never answered.

import { MASTERY, boxToTier, coldStartTier } from './config.js';

// A fresh, empty mastery state.
export function emptyMastery() {
  return { records: {} /* id -> {box, seen, correct, lastRun} */ };
}

export function getRecord(state, id) {
  return state.records[id] || null;
}

// The tier a question currently presents at for this player.
// No record -> cold-start authored difficulty. Extreme is pinned (final pool).
export function effectiveTier(state, q) {
  if (q.authoredDifficulty === 'extreme') return 'extreme';
  const rec = getRecord(state, q.id);
  if (!rec) return coldStartTier(q.authoredDifficulty);
  return boxToTier(rec.box);
}

export function isGraduated(state, id) {
  const rec = getRecord(state, id);
  return !!rec && rec.box >= MASTERY.GRADUATED_BOX;
}

// Record an answer.
//  - Always updates exposure counters (seen / correct / lastRun).
//  - Changes the Leitner box ONLY when the answer was UNAIDED:
//    a lifeline-assisted correct answer does not promote mastery (CLAUDE.md §3/§4).
//    Correct -> box + 1 (capped at GRADUATED_BOX, the graduate-out ceiling).
//    Wrong   -> box - 1 (floored at MIN_BOX). Bidirectional.
export function record(state, id, { correct, assisted = false, runIndex = 0, authoredDifficulty = 'medium' }) {
  let rec = state.records[id];
  if (!rec) {
    rec = { box: seedBox(authoredDifficulty), seen: 0, correct: 0, lastRun: -1 };
    state.records[id] = rec;
  }
  rec.seen += 1;
  if (correct) rec.correct += 1;
  rec.lastRun = runIndex;

  if (!assisted) {
    if (correct) rec.box = Math.min(MASTERY.MAX_BOX, rec.box + 1);
    else rec.box = Math.max(MASTERY.MIN_BOX, rec.box - 1);
  }
  return rec;
}

// Where a brand-new question sits the first time it is recorded, so its first
// unaided answer moves it sensibly relative to its authored difficulty.
function seedBox(authoredDifficulty) {
  switch (authoredDifficulty) {
    case 'easy': return 4;   // one correct graduates it
    case 'medium': return 2;
    case 'hard': return 0;
    default: return 0;       // extreme handled separately (pinned tier)
  }
}

// Selection weight: prefer weaker (lower box) and less-recently-seen items.
// Higher weight = more likely to be chosen for a run.
export function selectionWeight(state, q, currentRun) {
  const rec = getRecord(state, q.id);
  const box = rec ? rec.box : seedBox(q.authoredDifficulty);
  const staleness = rec ? Math.min(6, currentRun - rec.lastRun) : 6;
  // Weakness dominates; staleness is a gentle nudge; +1 keeps everything eligible.
  return (MASTERY.MAX_BOX - box) * 2 + staleness + 1;
}
