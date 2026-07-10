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

// Per-domain mastery progress for the green-room dashboard. Pure.
// Unseen questions count as zero progress — mastery is proven, not assumed.
// Returns [{ domain, seen, total, graduated, score }] sorted weakest-first
// (by score, then by how much of the domain is still unseen).
export function domainProgress(bank, state) {
  const acc = new Map(); // domain -> { total, seen, graduated, boxSum }
  for (const q of bank) {
    if (q.authoredDifficulty === 'extreme') continue; // finals pool isn't studied material
    let d = acc.get(q.domain);
    if (!d) { d = { domain: q.domain, total: 0, seen: 0, graduated: 0, boxSum: 0 }; acc.set(q.domain, d); }
    d.total += 1;
    const rec = getRecord(state, q.id);
    if (rec) {
      d.seen += 1;
      d.boxSum += rec.box;
      if (rec.box >= MASTERY.GRADUATED_BOX) d.graduated += 1;
    }
  }
  const rows = [...acc.values()].map((d) => ({
    domain: d.domain,
    seen: d.seen,
    total: d.total,
    graduated: d.graduated,
    score: d.total ? d.boxSum / (d.total * MASTERY.MAX_BOX) : 0,
  }));
  rows.sort((a, b) => (a.score - b.score) || (a.seen / a.total) - (b.seen / b.total) || a.domain.localeCompare(b.domain));
  return rows;
}

// Selection weight: prefer weaker (lower box) and less-recently-seen items.
// Higher weight = more likely to be chosen for a run.
export function selectionWeight(state, q, currentRun) {
  const rec = getRecord(state, q.id);
  const box = rec ? rec.box : seedBox(q.authoredDifficulty);
  // lastRun and currentRun can be different counters — clamp both ends so a
  // weight never goes negative (which would make an item unselectable).
  const staleness = rec ? Math.max(0, Math.min(6, currentRun - rec.lastRun)) : 6;
  // Weakness dominates; staleness is a gentle nudge; +1 keeps everything eligible.
  return (MASTERY.MAX_BOX - box) * 2 + staleness + 1;
}
