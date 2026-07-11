// hostLines.js — the host's chatter: welcome-back lines for the top of every
// run (drifting snarky once the attempts pile up) and short read-along quips
// while a question is revealed. Pure data + pure pickers so the rotation is
// headless-testable. AUTHORED COPY — flagged in FLAGS.md for human review per
// CLAUDE.md §7. Questions and answers NEVER appear in these bubbles.

export const WELCOME_LINES = [
  'Welcome back to the Hot Seat!',
  'Look who is back under the lights!',
  'The seat is still warm — let’s play.',
  'Welcome back! The audience missed you.',
  'Back for the climb. I like it.',
  'Our contestant returns — take your seat!',
  'Lights up. You know where to sit.',
  'Good to see you again. Thirty questions await.',
];

// Unlocked once the player is SNARK_MIN_RUNS attempts in — and even then only
// sometimes. {n} is replaced with the attempt number.
export const SNARKY_LINES = [
  'Back again? The seat was getting cold.',
  'Attempt number {n}. The audience admires persistence.',
  'You again? I’ll act surprised.',
  'The crew has started naming the chair after you.',
  'Round {n}. At this point you two are old friends.',
  'Take a seat — you know the way better than I do.',
];

export const QUESTION_LINES = [
  'Here’s your next question…',
  'Take your time with this one.',
  'Read it carefully…',
  'Next one, coming up.',
  'Alright — focus.',
  'Let’s see what you make of this.',
];

export const FINAL_LINE = 'This is it. The final question.';

// Host beats between questions. BANK_LINES fire when a safe haven is cleared —
// he pauses to celebrate the banked money and steady the player. TIER_LINES fire
// when the player crosses into a harder tier — congrats plus a heads-up. Generic
// show-host flavour only; never the question, an answer, or exam content.
export const BANK_LINES = [
  'That one is in the bank — nobody can take it from you now. Breathe.',
  'Safe and banked. Shake it off, and let us keep climbing.',
  'Money in the vault! Take a second, then we go again.',
  'Locked in the bank. Nicely done — ready for the next stretch?',
];

export const TIER_LINES = {
  medium: [
    'Nice work — the easy ten are behind you. It steps up a little from here.',
    'That is the warm-up done. The medium round now — stay with me.',
  ],
  hard: [
    'Look at you — into the hard round! No easy ones left. Bring your focus.',
    'The gloves are off now. These are the tough ones. Take your time.',
  ],
};

export const SNARK_MIN_RUNS = 3; // attempts completed before snark unlocks

// Pick a welcome line: never the same line twice in a row, and snark only
// past SNARK_MIN_RUNS attempts — and then only ~40% of the time.
export function pickWelcome({ runs = 0, last = null, rng = Math.random } = {}) {
  const snarky = runs >= SNARK_MIN_RUNS && rng() < 0.4;
  const pool = snarky ? SNARKY_LINES : WELCOME_LINES;
  const offset = snarky ? 100 : 0; // keys the two pools apart for `last`
  let idx = Math.floor(rng() * pool.length) % pool.length;
  if (offset + idx === last) idx = (idx + 1) % pool.length;
  return { text: pool[idx].replaceAll('{n}', String(runs + 1)), key: offset + idx };
}

// A short host quip as the question is read out (the final gets its own line).
export function pickQuestionLine({ isFinal = false, rng = Math.random } = {}) {
  if (isFinal) return FINAL_LINE;
  return QUESTION_LINES[Math.floor(rng() * QUESTION_LINES.length) % QUESTION_LINES.length];
}

// The host's "safe haven cleared" beat (money banked).
export function pickBankLine({ rng = Math.random } = {}) {
  return BANK_LINES[Math.floor(rng() * BANK_LINES.length) % BANK_LINES.length];
}

// The host's "you crossed into a harder tier" beat. Returns null for tiers with
// no line (easy start / the final gets its own FINAL_LINE), so callers can fall
// back to the normal read-out quip.
export function pickTierLine(tier, { rng = Math.random } = {}) {
  const pool = TIER_LINES[tier];
  if (!pool || !pool.length) return null;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

// Read-out pacing: how long the stem sits alone before the answers start
// appearing, and the gap between answers — "read the question first".
export function readoutPacing(stemLength, optionCount = 4) {
  const stemMs = Math.max(1600, Math.min(5200, 900 + stemLength * 30));
  const optionGapMs = 700;
  return { stemMs, optionGapMs, totalMs: stemMs + optionCount * optionGapMs };
}
