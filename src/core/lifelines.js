// lifelines.js — 50:50, Ask the Audience, Phone a Friend. Pure; rng injected so
// results are reproducible under a seed.
//
// Integrity that still holds (CLAUDE.md §3/§4):
//   - 50:50 removes only distractors, never a correct option, always leaves >=1.
//   - The authored key alone decides GRADING — a lifeline never grades.
//   - A lifeline-assisted correct answer does not promote mastery (runController).
//
// OWNER OVERRIDE of the original §3 wording (documented in docs/LIFELINES.md):
//   - Phone a Friend is a fallible friend: 68% of the time they land on a correct
//     option, 32% of the time they blurt a wrong one. (Was: always correct.)
//   - Ask the Audience is a real poll that USUALLY but not always favours the
//     correct answer — it helps more on easy questions than hard ones. (Was:
//     the plurality could never be wrong.)
// Neither ever *grades*; they only advise, and the player still chooses.

import { shuffle } from './rng.js';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export function letter(i) { return LETTERS[i] || String(i + 1); }

// Phone a Friend accuracy — the friend lands on a correct option this often.
export const PHONE_ACCURACY = 0.68;

// Ask the Audience shape by difficulty: how much of the vote the correct
// answer(s) draw on average, and how much a single "trap" distractor can pull.
// correctMean > trapMean everywhere, so the crowd HELPS (correct is the modal
// winner) — but on hard/extreme the trap can occasionally win.
const AUDIENCE_PARAMS = {
  easy:    { correctMean: 0.62, trapMean: 0.15, noise: 0.06 },
  medium:  { correctMean: 0.50, trapMean: 0.23, noise: 0.075 },
  hard:    { correctMean: 0.43, trapMean: 0.31, noise: 0.085 },
  extreme: { correctMean: 0.39, trapMean: 0.35, noise: 0.09 },
};

function distractorsOf(q) {
  const correct = new Set(q.answer);
  const d = [];
  for (let i = 0; i < q.options.length; i++) if (!correct.has(i)) d.push(i);
  return d;
}

// 50:50 — returns { removed:[indices] }. Removes up to 2 distractors, never a
// correct option, always leaving at least one distractor standing.
export function fiftyFifty(q, rng) {
  const distractors = distractorsOf(q);
  const maxRemovable = Math.max(0, distractors.length - 1); // keep >=1 distractor
  const removeCount = Math.min(2, maxRemovable);
  const removed = shuffle(distractors, rng).slice(0, removeCount);
  return { removed: removed.sort((a, b) => a - b) };
}

// Ask the Audience — returns { bars:[{index,percent}], winner, correctIsTop }.
// A believable poll: the correct option(s) draw the most weight on average, one
// random distractor becomes a "trap" that occasionally overtakes them (more
// often the harder the question), and the rest is scattered across the others.
export function askAudience(q, rng, difficulty = 'medium') {
  const n = q.options.length;
  const correctList = [...new Set(q.answer)];
  const distract = distractorsOf(q);
  const P = AUDIENCE_PARAMS[difficulty] || AUDIENCE_PARAMS.medium;

  let correctShare = clamp(P.correctMean + gaussish(rng) * P.noise, 0.22, 0.80);
  let trapShare = distract.length ? clamp(P.trapMean + gaussish(rng) * P.noise, 0.04, 0.78) : 0;
  const trapIdx = distract.length ? distract[Math.floor(rng() * distract.length)] : -1;

  let remaining = 1 - correctShare - trapShare;
  if (remaining < 0) { trapShare = Math.max(0, trapShare + remaining); remaining = 0; }

  const shares = new Array(n).fill(0);
  distributeAcross(shares, correctList, correctShare, rng, 0.5); // key gets the bulk
  if (trapIdx >= 0) shares[trapIdx] += trapShare;
  const others = distract.filter((i) => i !== trapIdx);
  if (!others.length && remaining > 0) {
    // No other distractors to hold the leftover — give it to the correct side
    // (never orphan it, or toPercents would scatter it onto random bars).
    distributeAcross(shares, correctList, remaining, rng, 0.5);
  } else {
    distributeAcross(shares, others, remaining, rng, 0.3);
  }

  const percents = toPercents(shares);
  const winner = argmax(percents);
  return {
    winner,
    correctIsTop: correctList.includes(winner),
    bars: percents.map((percent, index) => ({ index, percent })),
  };
}

// Phone a Friend — returns { pick, hitsKey }. `pick` is the option the friend
// names: a correct one PHONE_ACCURACY of the time, otherwise a random
// distractor. `hitsKey` is for tests/telemetry only — the UI never reveals it
// (the whole point is that you can't be sure the friend is right).
export function phoneFriend(q, rng) {
  const correctList = [...new Set(q.answer)];
  const distract = distractorsOf(q);
  const hitsKey = distract.length === 0 || rng() < PHONE_ACCURACY;
  const pool = hitsKey ? correctList : distract;
  const pick = pool[Math.floor(rng() * pool.length)];
  return { pick, hitsKey };
}

/* ---------- helpers ---------- */

// ~N(0,1) from the sum of three uniforms (cheap, good enough for flavour).
function gaussish(rng) { return (rng() + rng() + rng() - 1.5) / 0.5; }

// Spread `total` mass across `idxs` with random weights (>= floor so no zeros).
function distributeAcross(shares, idxs, total, rng, floor) {
  if (!idxs.length || total <= 0) return;
  const w = idxs.map(() => floor + rng());
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  idxs.forEach((i, k) => { shares[i] += (total * w[k]) / sum; });
}

// Fractional shares -> integer percents summing to exactly 100 (largest remainder).
function toPercents(shares) {
  const raw = shares.map((s) => Math.max(0, s) * 100);
  const floors = raw.map((v) => Math.floor(v));
  let rem = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < order.length && rem > 0; k++) { floors[order[k].i] += 1; rem -= 1; }
  return floors;
}

function argmax(arr) { let bi = 0; for (let i = 1; i < arr.length; i++) if (arr[i] > arr[bi]) bi = i; return bi; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
