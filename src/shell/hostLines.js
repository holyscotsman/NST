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

// Read-out pacing: how long the stem sits alone before the answers start
// appearing, and the gap between answers — "read the question first".
export function readoutPacing(stemLength, optionCount = 4) {
  const stemMs = Math.max(1600, Math.min(5200, 900 + stemLength * 30));
  const optionGapMs = 700;
  return { stemMs, optionGapMs, totalMs: stemMs + optionCount * optionGapMs };
}
