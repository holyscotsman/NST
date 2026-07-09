// lifelines.js — 50:50, Ask the Audience, Phone a Friend. Pure; rng injected so
// results are reproducible under a seed. Hard integrity rules (CLAUDE.md §3):
//   - No lifeline ever presents a wrong option as correct.
//   - 50:50 removes only distractors, never a correct option, always leaves >=1 distractor.
//   - Ask the Audience plurality NEVER lands on a wrong option.
//   - Phone a Friend hedges toward a correct option.

import { shuffle } from './rng.js';

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export function letter(i) { return LETTERS[i] || String(i + 1); }

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

// Ask the Audience — returns { bars:[{index,percent}], winner } where the single
// highest bar is guaranteed to be a correct option. Margin is thin on hard items
// (weak hint, high tension) and wide on easy ones. Never misleading, only less helpful.
export function askAudience(q, rng, difficulty = 'medium') {
  const n = q.options.length;
  const correct = new Set(q.answer);
  // Winner is always a correct option.
  const correctList = [...correct];
  const winner = correctList[Math.floor(rng() * correctList.length)];

  const base = { easy: 68, medium: 54, hard: 42, extreme: 38 }[difficulty] ?? 50;
  let W = clamp(Math.round(base + (rng() * 8 - 4)), Math.ceil(100 / n) + 6, 82);

  // Distribute the remainder across the other options.
  const others = [];
  for (let i = 0; i < n; i++) if (i !== winner) others.push(i);
  const weights = others.map((i) => {
    // Other correct options (multi-answer) lean higher; distractors lower.
    const lean = correct.has(i) ? 0.55 : 0.2;
    return lean + rng() * 0.6;
  });
  let wsum = weights.reduce((a, b) => a + b, 0) || 1;
  let remaining = 100 - W;
  const bars = new Array(n).fill(0);
  bars[winner] = W;
  const cap = W - 2; // no other bar may reach the winner
  let leftover = 0;
  for (let k = 0; k < others.length; k++) {
    let v = Math.round((weights[k] / wsum) * remaining);
    if (v > cap) { leftover += v - cap; v = cap; }
    bars[others[k]] = v;
  }
  bars[winner] += leftover;

  // Fix rounding drift so the bars sum to exactly 100, keeping the winner strictly max.
  fixSum(bars, winner, cap);

  return {
    winner,
    bars: bars.map((percent, index) => ({ index, percent })),
  };
}

function fixSum(bars, winner, cap) {
  let sum = bars.reduce((a, b) => a + b, 0);
  let drift = 100 - sum;
  // Apply drift to the winner first (it can absorb upward freely).
  if (drift !== 0) { bars[winner] += drift; drift = 0; }
  // Guarantee strict plurality.
  for (let i = 0; i < bars.length; i++) {
    if (i !== winner && bars[i] >= bars[winner]) {
      const over = bars[i] - (bars[winner] - 1);
      bars[i] -= over;
      bars[winner] += over;
    }
    if (bars[i] < 0) { bars[winner] += bars[i]; bars[i] = 0; }
  }
}

// Phone a Friend — returns { pick, confidence, text }. `pick` is ALWAYS a correct
// option (derived from the authoritative key). Authored `phoneHint` text is used
// verbatim when present (it points toward the correct answer); otherwise a
// template is filled from the key. Hedges harder on harder items.
export function phoneFriend(q, difficulty = 'medium') {
  const pick = q.answer[0];
  const confidence = {
    easy: 'pretty confident',
    medium: 'fairly sure',
    hard: 'not certain, but leaning',
    extreme: 'really not sure — this is a wild guess',
  }[difficulty] ?? 'fairly sure';

  let text;
  if (typeof q.phoneHint === 'string' && q.phoneHint.trim().length > 0) {
    text = q.phoneHint.trim();
  } else {
    const hedge = difficulty === 'easy' || difficulty === 'medium'
      ? "I'd go with that."
      : "but honestly, double-check me on this one.";
    text = `I think it's ${letter(pick)} — "${q.options[pick]}". I'm ${confidence}, ${hedge}`;
  }
  return { pick, confidence, text };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
