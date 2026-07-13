import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController, defaultLifelines, sameSet } from '../src/core/runController.js';
import { buildSet } from '../src/core/selection.js';
import { bankedAfter } from '../src/core/coins.js';
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

test('devJumpTo lands on the requested question and credits the coin math', () => {
  const { rc, events } = freshRun();
  rc.start();
  events.length = 0;
  const cur = rc.devJumpTo(18); // 1-based
  assert.equal(cur.number, 18);
  assert.equal(cur.index, 17);
  assert.equal(cur.tier, 'medium');
  assert.equal(rc.clearedCount, 17); // prior questions treated as cleared
  assert.equal(rc.snapshot().banked, bankedAfter(17)); // coin math follows clearedCount
  assert.ok(rc.snapshot().banked > 0, 'past the first safe haven'); // NEGATIVE CONTROL vs a fresh run
  assert.equal(rc.alive, true);
  // It emits a normal question:show so the shell/backdrop react like any move.
  assert.ok(events.some(([t, d]) => t === 'question:show' && d.number === 18));
});

test('devJumpTo clamps out-of-range inputs and ignores garbage', () => {
  const { rc } = freshRun();
  rc.start();
  assert.equal(rc.devJumpTo(999).number, 30); // clamp high
  assert.equal(rc.devJumpTo(0).number, 1);    // clamp low
  assert.equal(rc.devJumpTo(-5).number, 1);   // clamp low // NEGATIVE CONTROL
  rc.devJumpTo(12);
  assert.equal(rc.devJumpTo(NaN).number, 12); // garbage is a no-op // NEGATIVE CONTROL
});

test('devJumpTo does not grade — mastery is untouched by the jump', () => {
  const { rc, mastery } = freshRun();
  rc.start();
  const q = rc.set[17];
  const before = JSON.stringify(getRecord(mastery, q.id));
  rc.devJumpTo(18);
  assert.equal(JSON.stringify(getRecord(mastery, q.id)), before); // NEGATIVE CONTROL
});

test('a double submit cannot re-grade the same question (advance latch)', () => {
  const { rc, mastery } = freshRun();
  rc.start();
  const q = rc.current().q;
  const first = rc.answer(q.answer.slice());
  assert.equal(first.correct, true);
  assert.equal(rc.clearedCount, 1);
  const boxAfterFirst = getRecord(mastery, q.id).box;

  // Second submit before advance(): refused outright.
  const second = rc.answer(q.answer.slice());
  assert.equal(second, null, 'second grade is refused'); // NEGATIVE CONTROL
  assert.equal(rc.clearedCount, 1, 'coins math not inflated');
  assert.equal(getRecord(mastery, q.id).box, boxAfterFirst, 'mastery promoted exactly once');
  assert.equal(rc.snapshot().awaitingAdvance, true, 'snapshot exposes the latch for the UI');

  // After advance() grading works normally again — including permadeath.
  rc.advance();
  assert.equal(rc.snapshot().awaitingAdvance, false);
  const c = rc.current();
  const wrong = [0, 1, 2, 3].find((i) => !c.q.answer.includes(i));
  const r = rc.answer([wrong]);
  assert.equal(r.correct, false);
  assert.equal(rc.alive, false, 'a wrong answer still ends the run');
});

test('lifelines are refused once the run has ended (dead or won)', () => {
  // Dead run: die on Q1 with full charges, then try to use one.
  const { rc } = freshRun();
  rc.start();
  // NEGATIVE CONTROL first: the identical call before death succeeds.
  assert.equal(rc.canUseLifeline('fifty'), true);
  const c = rc.current();
  const wrong = [0, 1, 2, 3].find((i) => !c.q.answer.includes(i));
  rc.answer([wrong]);
  assert.equal(rc.alive, false);
  assert.equal(rc.canUseLifeline('audience'), false, 'dead run refuses lifelines');
  assert.equal(rc.useLifeline('audience'), null);
  assert.equal(rc.lifelines.audience.charges, 1, 'the paid charge is not burned'); // NEGATIVE CONTROL

  // Won run: drive 30 correct, then try to use one.
  const b = freshRun('WIN');
  b.rc.start();
  while (b.rc.alive && !b.rc.won) {
    const cur = b.rc.current();
    const r = b.rc.answer(cur.q.answer.slice());
    if (r.hasNext) b.rc.advance();
  }
  assert.equal(b.rc.won, true);
  assert.equal(b.rc.canUseLifeline('fifty'), false, 'won run refuses lifelines');
  assert.equal(b.rc.useLifeline('fifty'), null);
  assert.equal(b.rc.lifelines.fifty.charges, 1);
});

test('multi-answer grading is all-or-nothing', () => {
  assert.equal(sameSet([0, 2], [2, 0]), true, 'order-insensitive');
  assert.equal(sameSet([0], [0, 2]), false, 'partial is wrong'); // NEGATIVE CONTROL
  assert.equal(sameSet([0, 1], [0, 2]), false, 'one wrong pick fails');
  assert.equal(sameSet([0, 2, 3], [0, 2]), false, 'an extra pick fails');
});
