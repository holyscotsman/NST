import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fiftyFifty, askAudience, phoneFriend, PHONE_ACCURACY, ballotFromBars } from '../src/core/lifelines.js';
import { makeRng } from '../src/core/rng.js';
import { multiQuestion } from './fixtures.mjs';

const single = { id: 'X-E-001', type: 'single', options: ['A', 'B', 'C', 'D'], answer: [2] };
const twoDistract = { id: 'X-E-002', type: 'single', options: ['A', 'B', 'C'], answer: [0] }; // 2 distractors

test('ballotFromBars distributes n crowd votes proportional to the poll', () => {
  const bars = [{ index: 0, percent: 50 }, { index: 1, percent: 30 }, { index: 2, percent: 20 }];
  const n = 168;
  const ballot = ballotFromBars(bars, n);
  assert.equal(ballot.length, n, 'one vote per crowd member');
  assert.ok(ballot.every((v) => v != null), 'every seat gets a vote (no holes)');
  const count = (opt) => ballot.filter((v) => v === opt).length;
  // largest-remainder apportionment of 168: 84 / 50 / 34 (sums to 168)
  assert.equal(count(0), 84);
  assert.equal(count(1), 50);
  assert.equal(count(2), 34);
  assert.equal(count(0) + count(1) + count(2), n, 'votes sum to exactly n');
  // NEGATIVE CONTROL: the popular option is not everyone — the poll still splits.
  assert.ok(count(0) < n);
});

test('ballotFromBars is deterministic and scatters options across the crowd', () => {
  const bars = [{ index: 0, percent: 60 }, { index: 1, percent: 40 }];
  const a = ballotFromBars(bars, 100);
  const b = ballotFromBars(bars, 100);
  assert.deepEqual(a, b, 'same poll -> same crowd render');
  // scattered, not one solid block: the first 60 seats are NOT all option 0.
  const firstBlock = a.slice(0, 60);
  assert.ok(firstBlock.some((v) => v === 1), 'options are interleaved, not clustered'); // NEGATIVE CONTROL
});

test('ballotFromBars guards empty / zero inputs', () => {
  assert.deepEqual(ballotFromBars([], 10), []);         // NEGATIVE CONTROL
  assert.deepEqual(ballotFromBars([{ index: 0, percent: 100 }], 0), []);
  assert.deepEqual(ballotFromBars(null, 10), []);
});

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

// ---- Ask the Audience: a helpful-but-fallible poll ----

function audienceStats(diff, N = 3000) {
  let correctTop = 0; let correctBarSum = 0; const otherBarSum = [0, 0, 0];
  for (let s = 0; s < N; s++) {
    const { bars, winner } = askAudience(single, makeRng(`aud${diff}${s}`), diff);
    assert.equal(bars.reduce((a, b) => a + b.percent, 0), 100, 'bars sum to 100');
    const max = Math.max(...bars.map((b) => b.percent));
    assert.equal(bars[winner].percent, max, 'winner is the top bar');
    if (single.answer.includes(winner)) correctTop += 1;
    correctBarSum += bars[2].percent;
    let oi = 0; for (const b of bars) if (b.index !== 2) otherBarSum[oi++] += b.percent;
  }
  return { rate: correctTop / N, correctAvg: correctBarSum / N, otherAvg: otherBarSum.map((s) => s / N) };
}

test('Ask the Audience helps: the correct bar is the tallest on average, every tier', () => {
  for (const diff of ['easy', 'medium', 'hard', 'extreme']) {
    const { correctAvg, otherAvg } = audienceStats(diff, 1500);
    for (const o of otherAvg) assert.ok(correctAvg > o, `${diff}: correct bar tallest on average`);
  }
});

test('Ask the Audience is usually — but not always — right, and clearer on easy', () => {
  const easy = audienceStats('easy').rate;
  const hard = audienceStats('hard').rate;
  const extreme = audienceStats('extreme').rate;
  assert.ok(easy > 0.9, `easy should be reliably helpful (got ${easy.toFixed(2)})`);
  assert.ok(hard > 0.5 && hard < 0.9, `hard helps but misfires (got ${hard.toFixed(2)})`); // NEGATIVE CONTROL
  assert.ok(extreme > 0.45 && extreme < 0.85, `extreme helps but often misfires (got ${extreme.toFixed(2)})`);
  assert.ok(easy > hard && hard > extreme, 'clarity falls as difficulty rises');
});

// ---- Phone a Friend: a panicky, ~68%-accurate friend ----

test('Phone a Friend lands near the 68/32 split over many calls', () => {
  let hits = 0; const N = 5000;
  for (let s = 0; s < N; s++) {
    const { pick, hitsKey } = phoneFriend(single, makeRng('phone' + s));
    assert.ok(pick >= 0 && pick < single.options.length, 'names a real option');
    assert.equal(single.answer.includes(pick), hitsKey, 'hitsKey matches whether the pick is correct');
    if (hitsKey) hits += 1;
  }
  const rate = hits / N;
  assert.ok(Math.abs(rate - PHONE_ACCURACY) < 0.03, `~${PHONE_ACCURACY} correct (got ${rate.toFixed(3)})`);
});

test('Phone a Friend does sometimes name a wrong option (it is fallible)', () => {
  let wrong = 0;
  for (let s = 0; s < 400; s++) {
    const { pick } = phoneFriend(single, makeRng('pw' + s));
    if (!single.answer.includes(pick)) wrong += 1;
  }
  assert.ok(wrong > 0, 'the friend is wrong at least sometimes'); // NEGATIVE CONTROL vs the old always-correct rule
});

test('Ask the Audience with a single distractor still sums to 100 (no orphaned mass)', () => {
  // A 3-of-4 multi item leaves exactly one distractor — the "trap" takes it,
  // so the leftover mass has no other distractor to land on. It must not orphan.
  const oneDistractor = { id: 'X-M-001', type: 'multi', options: ['A', 'B', 'C', 'D'], answer: [0, 1, 2] };
  for (const diff of ['easy', 'hard']) {
    for (let s = 0; s < 300; s++) {
      const { bars, winner } = askAudience(oneDistractor, makeRng(`sd${diff}${s}`), diff);
      assert.equal(bars.reduce((a, b) => a + b.percent, 0), 100, 'bars sum to 100'); // NEGATIVE CONTROL vs orphan bug
      assert.equal(bars[winner].percent, Math.max(...bars.map((b) => b.percent)), 'winner is the top bar');
    }
  }
});

test('Phone a Friend on a no-distractor question can only name a correct option', () => {
  const allCorrect = { id: 'X-E-003', type: 'multi', options: ['A', 'B'], answer: [0, 1] };
  for (let s = 0; s < 50; s++) {
    const { pick } = phoneFriend(allCorrect, makeRng('nd' + s));
    assert.ok(allCorrect.answer.includes(pick)); // NEGATIVE CONTROL: never out of range
  }
});
