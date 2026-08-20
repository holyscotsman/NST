// mastery.js — per-question Leitner mastery. Shared learning state that persists
// across runs and is NEVER wiped by a win (the project design rules).
//
// (v2.7.0) The records now live in the SHARED store (shared/nst-mastery.js, exposed
// as window.NSTMastery) rather than inside this game's save, so an answer here
// counts in StarNix and Practice Exams too — the thing the README always promised.
// This module keeps WWTBANE's POLICY: the box moves only on an UNAIDED answer, and
// it moves in steps of 2 on the shared 0..8 ladder so the ladder keeps its original
// length. Everything below still reads a `state` object with `.records`, which is
// now a live view of the shared records.
//
// Low box  = the question is still hard for this player.
// High box = mastered; box === GRADUATED_BOX means graduated (rarely resurfaced).
// A question's effective tier is derived from its box; authored difficulty is
// only the cold-start seed for a question the player has never answered.

import { MASTERY, boxToTier, coldStartTier } from './config.js';

// The shared store, when the page has loaded it. Absent in bare unit tests, which
// exercise the pure fallback below.
function sharedStore() {
  return (typeof window !== 'undefined' && window.NSTMastery) ? window.NSTMastery : null;
}

// A mastery state. Backed by the shared store when present, so `records` is a live
// view every tool writes through; otherwise a plain local object.
export function emptyMastery() {
  const shared = sharedStore();
  if (shared) {
    shared.migrateIfNeeded();          // fold legacy per-tool history in, once
    return { records: shared.all(), shared: true };
  }
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
//    a lifeline-assisted correct answer does not promote mastery (the project design rules).
//    Correct -> box + 1 (capped at GRADUATED_BOX, the graduate-out ceiling).
//    Wrong   -> box - 1 (floored at MIN_BOX). Bidirectional.
export function record(state, id, { correct, assisted = false, runIndex = 0, authoredDifficulty = 'medium' }) {
  const shared = state.shared ? sharedStore() : null;
  if (shared) {
    // WWTBANE's policy, handed to the shared engine: every answer counts as
    // exposure, but only an UNAIDED one moves the box, and it moves by STEP.
    const res = shared.record(id, {
      correct: !!correct,
      assisted: !!assisted,
      gate: 'always',
      step: MASTERY.STEP,
      runIndex,
      seedBox: shared.seedFor(authoredDifficulty),
    });
    state.records = shared.all();
    return res.rec;
  }
  let rec = state.records[id];
  if (!rec) {
    rec = { box: seedBox(authoredDifficulty), seen: 0, correct: 0, lastRun: -1 };
    state.records[id] = rec;
  }
  rec.seen += 1;
  if (correct) rec.correct += 1;
  rec.lastRun = runIndex;

  if (!assisted) {
    if (correct) rec.box = Math.min(MASTERY.MAX_BOX, rec.box + MASTERY.STEP);
    else rec.box = Math.max(MASTERY.MIN_BOX, rec.box - MASTERY.STEP);
  }
  return rec;
}

// Where a brand-new question sits the first time it is recorded, so its first
// unaided answer moves it sensibly relative to its authored difficulty.
export function seedBoxFor(authoredDifficulty) {
  const shared = sharedStore();
  return shared ? shared.seedFor(authoredDifficulty) : seedBox(authoredDifficulty);
}

function seedBox(authoredDifficulty) {
  // Same distances from graduation as the original 0..5 ladder, on 0..8 in steps
  // of 2: one unaided answer still graduates an easy question, four a hard one.
  switch (authoredDifficulty) {
    case 'easy': return 6;   // one correct graduates it
    case 'medium': return 4;
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

// How strongly a not-yet-mastered priority question outweighs a normal one in
// mastery selection. Large enough that runs are dominated by the priority set
// until each item graduates, without making it an absolute lock (variety stays).
export const PRIORITY_WEIGHT_BOOST = 10;

// Selection weight: prefer weaker (lower box) and less-recently-seen items.
// Higher weight = more likely to be chosen for a run.
export function selectionWeight(state, q, currentRun) {
  const rec = getRecord(state, q.id);
  const box = rec ? rec.box : seedBox(q.authoredDifficulty);
  // The campaign passes the same clock that stamps lastRun (save.stats.runs via
  // SetManager.getRunIndex). The clamp stays as defense for imported/legacy
  // saves whose lastRun may outrun a fresh clock — a weight must never go
  // negative (that would make an item unselectable).
  const staleness = rec ? Math.max(0, Math.min(6, currentRun - rec.lastRun)) : 6;
  // Weakness dominates; staleness is a gentle nudge; +1 keeps everything eligible.
  const base = (MASTERY.MAX_BOX - box) * 2 + staleness + 1;
  // Priority questions ("master these first") get a big multiplier UNTIL the
  // player graduates them. Once graduated the boost drops away, so mastered
  // priority items behave like any other mastered question (rarely resurfaced).
  if (q.priority && !isGraduated(state, q.id)) return base * PRIORITY_WEIGHT_BOOST;
  return base;
}
