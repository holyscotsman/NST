import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyMastery, record, effectiveTier, getRecord, isGraduated } from '../src/core/mastery.js';
import { MASTERY } from '../src/core/config.js';

const hard = { id: 'AHV-H-001', authoredDifficulty: 'hard' };
const easy = { id: 'STOR-E-001', authoredDifficulty: 'easy' };
const extreme = { id: 'PRISM-X-001', authoredDifficulty: 'extreme' };

test('cold-start tier is the authored difficulty', () => {
  const m = emptyMastery();
  assert.equal(effectiveTier(m, hard), 'hard');
  assert.equal(effectiveTier(m, easy), 'easy');
  assert.equal(effectiveTier(m, extreme), 'extreme');
});

test('unaided correct answers promote toward mastery; misses demote', () => {
  const m = emptyMastery();
  record(m, hard.id, { correct: true, authoredDifficulty: 'hard' }); // box 0 -> 1
  const box1 = getRecord(m, hard.id).box;
  record(m, hard.id, { correct: true, authoredDifficulty: 'hard' }); // 1 -> 2
  assert.ok(getRecord(m, hard.id).box > box1, 'promotes on correct');
  record(m, hard.id, { correct: false, authoredDifficulty: 'hard' }); // demote
  assert.ok(getRecord(m, hard.id).box < 2, 'demotes on wrong'); // NEGATIVE CONTROL
});

test('a lifeline-assisted correct answer does NOT promote mastery', () => {
  const m = emptyMastery();
  record(m, hard.id, { correct: true, assisted: false, authoredDifficulty: 'hard' });
  const boxUnaided = getRecord(m, hard.id).box;

  const m2 = emptyMastery();
  record(m2, hard.id, { correct: true, assisted: true, authoredDifficulty: 'hard' });
  const rec2 = getRecord(m2, hard.id);

  // seedBox for hard is 0; unaided moves it to 1, assisted leaves it at 0.
  assert.equal(boxUnaided, 1);
  assert.equal(rec2.box, 0, 'assisted correct leaves the box unchanged'); // NEGATIVE CONTROL
  assert.equal(rec2.seen, 1, 'but exposure is still recorded');
  assert.equal(rec2.correct, 1);
});

test('mastery graduates out at the ceiling and cannot exceed it', () => {
  const m = emptyMastery();
  for (let i = 0; i < 20; i++) record(m, easy.id, { correct: true, authoredDifficulty: 'easy' });
  assert.equal(getRecord(m, easy.id).box, MASTERY.MAX_BOX);
  assert.equal(isGraduated(m, easy.id), true);
});

test('extreme questions stay pinned to the extreme tier regardless of mastery', () => {
  const m = emptyMastery();
  for (let i = 0; i < 10; i++) record(m, extreme.id, { correct: true, authoredDifficulty: 'extreme' });
  assert.equal(effectiveTier(m, extreme), 'extreme'); // NEGATIVE CONTROL
});
