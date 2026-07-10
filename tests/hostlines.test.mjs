import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickWelcome, pickQuestionLine, readoutPacing,
  WELCOME_LINES, SNARKY_LINES, FINAL_LINE, SNARK_MIN_RUNS,
} from '../src/shell/hostLines.js';

// deterministic rng from a fixed sequence
const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test('welcome lines rotate and never repeat back-to-back', () => {
  const first = pickWelcome({ runs: 0, last: null, rng: seq(0.9, 0.0) });
  const again = pickWelcome({ runs: 0, last: first.key, rng: seq(0.9, 0.0) });
  assert.notEqual(again.key, first.key, 'same rng + last -> shifted to a different line');
  assert.ok(WELCOME_LINES.includes(first.text));
});

test('snark only unlocks past the attempt threshold', () => {
  // rng always says "be snarky" — but the run count gates it. NEGATIVE CONTROL:
  for (let runs = 0; runs < SNARK_MIN_RUNS; runs++) {
    const { text } = pickWelcome({ runs, rng: seq(0.0) });
    assert.ok(WELCOME_LINES.includes(text), `runs=${runs} must never be snarky`);
  }
  const snarky = pickWelcome({ runs: SNARK_MIN_RUNS, rng: seq(0.0, 0.0) });
  assert.ok(SNARKY_LINES.map((l) => l.replaceAll('{n}', String(SNARK_MIN_RUNS + 1))).includes(snarky.text));
  assert.ok(snarky.key >= 100, 'snark keys live in their own space');
});

test('snark is occasional, not constant, past the threshold', () => {
  // rng says "not this time" (>= 0.4) — stays friendly even at high run counts. NEGATIVE CONTROL
  const { text } = pickWelcome({ runs: 12, rng: seq(0.9, 0.0) });
  assert.ok(WELCOME_LINES.includes(text));
});

test('attempt number is interpolated into {n} lines', () => {
  const { text } = pickWelcome({ runs: 4, rng: seq(0.0, 0.34) }); // -> a {n} snark line
  assert.ok(!text.includes('{n}'), 'placeholder replaced');
});

test('the final question gets its fixed line; others draw from the pool', () => {
  assert.equal(pickQuestionLine({ isFinal: true }), FINAL_LINE);
  const line = pickQuestionLine({ isFinal: false, rng: seq(0.5) });
  assert.notEqual(line, FINAL_LINE); // NEGATIVE CONTROL
});

test('read-out pacing scales with stem length within bounds', () => {
  const short = readoutPacing(20, 4);
  const long = readoutPacing(400, 4);
  assert.ok(short.stemMs >= 1600, 'never shorter than the floor');
  assert.ok(long.stemMs <= 5200, 'never longer than the cap');
  assert.ok(long.stemMs > short.stemMs, 'longer stems earn more reading time');
  assert.equal(short.totalMs, short.stemMs + 4 * short.optionGapMs);
});
