import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fiftyFifty, askAudience, phoneFriend } from '../src/core/lifelines.js';
import { makeRng } from '../src/core/rng.js';
import { multiQuestion } from './fixtures.mjs';

const single = { id: 'X-E-001', type: 'single', options: ['A', 'B', 'C', 'D'], answer: [2] };
const twoDistract = { id: 'X-E-002', type: 'single', options: ['A', 'B', 'C'], answer: [0] }; // 2 distractors

test('50:50 never removes a correct option and always leaves a distractor', () => {
  for (let s = 0; s < 500; s++) {
    const rng = makeRng('fifty' + s);
    const { removed } = fiftyFifty(single, rng);
    assert.ok(removed.length <= 2, 'removes at most 2');
    assert.ok(!removed.includes(2), 'never removes the correct index'); // NEGATIVE CONTROL
    const remainingDistractors = [0, 1, 3].filter((i) => !removed.includes(i));
    assert.ok(remainingDistractors.length >= 1, 'leaves >=1 distractor');
  }
});

test('50:50 on a 2-distractor question removes only one', () => {
  const { removed } = fiftyFifty(twoDistract, makeRng('two'));
  assert.equal(removed.length, 1);
  assert.ok(!removed.includes(0));
});

test('50:50 on multi-answer removes only distractors', () => {
  const mq = multiQuestion(); // answer [0,2], distractors [1,3]
  for (let s = 0; s < 200; s++) {
    const { removed } = fiftyFifty(mq, makeRng('m' + s));
    for (const r of removed) assert.ok(!mq.answer.includes(r)); // NEGATIVE CONTROL
    assert.ok([1, 3].filter((i) => !removed.includes(i)).length >= 1);
  }
});

test('Ask the Audience plurality never lands on a wrong option', () => {
  for (const diff of ['easy', 'medium', 'hard', 'extreme']) {
    for (let s = 0; s < 300; s++) {
      const rng = makeRng(`aud${diff}${s}`);
      const { bars, winner } = askAudience(single, rng, diff);
      const sum = bars.reduce((a, b) => a + b.percent, 0);
      assert.equal(sum, 100, 'bars sum to 100');
      assert.ok(single.answer.includes(winner), 'winner is a correct option');
      const max = Math.max(...bars.map((b) => b.percent));
      const argmax = bars.find((b) => b.percent === max).index;
      assert.ok(single.answer.includes(argmax), 'plurality is correct'); // NEGATIVE CONTROL
      for (const b of bars) if (b.index !== winner) assert.ok(b.percent < bars[winner].percent, 'no bar ties/beats winner');
    }
  }
});

test('Ask the Audience is a wider hint on easy than on hard', () => {
  const avg = (diff) => {
    let sum = 0; const N = 400;
    for (let s = 0; s < N; s++) {
      const { bars, winner } = askAudience(single, makeRng('w' + diff + s), diff);
      sum += bars[winner].percent;
    }
    return sum / N;
  };
  assert.ok(avg('easy') > avg('hard'), 'easy audience is more confident than hard'); // NEGATIVE CONTROL
});

test('Phone a Friend always points at a correct option', () => {
  for (const diff of ['easy', 'medium', 'hard', 'extreme']) {
    const { pick } = phoneFriend(single, diff);
    assert.ok(single.answer.includes(pick)); // NEGATIVE CONTROL
  }
});

test('Phone a Friend uses authored hint text when present', () => {
  const authored = { ...single, phoneHint: 'It is definitely C, trust me.' };
  const { text, pick } = phoneFriend(authored, 'hard');
  assert.equal(text, 'It is definitely C, trust me.');
  assert.ok(authored.answer.includes(pick)); // pick still from the key, not the prose
});
