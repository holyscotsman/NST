import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController, defaultLifelines, sameSet } from '../src/core/runController.js';
import { buildSet } from '../src/core/selection.js';
import { emptyMastery, getRecord } from '../src/core/mastery.js';
import { makeBank } from './fixtures.mjs';

function freshRun(seed = 'RUN') {
  const bank = makeBank();
  const set = buildSet({ bank, mode: 'seeded', seed, setIndex: 0, reachedFinalBefore: true });
  const mastery = emptyMastery();
  const events = [];
  const rc = new RunController({ set, mastery, lifelines: defaultLifelines(), seed, mode: 'seeded', emit: (t, d) => events.push([t, d]) });
  return { rc, set, mastery, events };
}

test('answering all 30 correctly wins the top prize', () => {
  const { rc } = freshRun();
  rc.start();
  let result;
  while (rc.alive && !rc.won) {
    const cur = rc.current();
    result = rc.answer(cur.q.answer.slice());
    if (result.hasNext) rc.advance();
  }
  assert.equal(rc.won, true);
  assert.equal(result.payout, 50000);
});

test('a wrong answer ends the run (permadeath) and pays only what was banked', () => {
  const { rc } = freshRun();
  rc.start();
  // Answer Q1 wrong: pick an option that is not the key.
  const cur = rc.current();
  const wrong = [0, 1, 2, 3].find((i) => !cur.q.answer.includes(i));
  const result = rc.answer([wrong]);
  assert.equal(result.correct, false);
  assert.equal(rc.alive, false);
  assert.equal(result.payout, 0); // died in tier 1 // NEGATIVE CONTROL
});

test('banking happens crossing Q10 and is kept even if you die later', () => {
  const { rc } = freshRun();
  rc.start();
  for (let i = 0; i < 10; i++) { const c = rc.current(); const r = rc.answer(c.q.answer.slice()); if (r.hasNext) rc.advance(); }
  assert.equal(rc.snapshot().banked, 1000);
  // Now die in tier 2.
  const c = rc.current();
  const wrong = [0, 1, 2, 3].find((i) => !c.q.answer.includes(i));
  const r = rc.answer([wrong]);
  assert.equal(r.payout, 1000);
});

test('a lifeline-assisted correct answer does not promote that questions mastery', () => {
  const { rc, mastery } = freshRun('A');
  rc.start();
  const q = rc.current().q;
  rc.useLifeline('fifty');
  rc.answer(q.answer.slice());
  assert.equal(getRecord(mastery, q.id).box, seedBoxFor(q.authoredDifficulty)); // unchanged // NEGATIVE CONTROL

  // Control: same question answered unaided in a fresh run promotes it.
  const b = freshRun('A');
  b.rc.start();
  const q2 = b.rc.current().q;
  b.rc.answer(q2.answer.slice());
  assert.equal(getRecord(b.mastery, q2.id).box, seedBoxFor(q2.authoredDifficulty) + 1);
});

function seedBoxFor(diff) { return { easy: 4, medium: 2, hard: 0, extreme: 0 }[diff]; }

test('a lifeline cannot be used twice on the same question', () => {
  const { rc } = freshRun();
  rc.start();
  assert.ok(rc.useLifeline('audience'));
  assert.equal(rc.canUseLifeline('audience'), false);
  assert.equal(rc.useLifeline('audience'), null); // NEGATIVE CONTROL
  assert.equal(rc.lifelines.audience.charges, 0);
});

test('multi-answer grading is all-or-nothing', () => {
  assert.equal(sameSet([0, 2], [2, 0]), true, 'order-insensitive');
  assert.equal(sameSet([0], [0, 2]), false, 'partial is wrong'); // NEGATIVE CONTROL
  assert.equal(sameSet([0, 1], [0, 2]), false, 'one wrong pick fails');
  assert.equal(sameSet([0, 2, 3], [0, 2]), false, 'an extra pick fails');
});
