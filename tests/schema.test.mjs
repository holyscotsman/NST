import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, validateBank } from '../src/core/questionSchema.js';

const good = {
  id: 'STOR-E-001', domain: 'storage', authoredDifficulty: 'easy', type: 'single',
  stem: 'What is a storage container backed by?', options: ['Storage pool', 'vDisk', 'Oplog', 'Curator'],
  answer: [0], explanation: 'A container is a logical slice of a storage pool.', reviewStatus: 'verified',
};

test('a well-formed question validates', () => {
  assert.equal(validateQuestion(good).ok, true);
});

test('the shipped bank is structurally valid', async () => {
  const { QUESTIONS } = await import('../src/content/questions.js');
  const res = validateBank(QUESTIONS);
  assert.equal(res.ok, true, JSON.stringify(res.rejected));
  // Enough to build a run in every tier, plus extras for variety.
  assert.ok(res.summary.byDiff.easy >= 10);
  assert.ok(res.summary.byDiff.medium >= 10);
  assert.ok(res.summary.byDiff.hard >= 9);
  assert.ok(res.summary.byDiff.extreme >= 1);
  // The owner's priority practice-exam set ships and is flagged for mastery-first.
  const priority = QUESTIONS.filter((q) => q.priority);
  assert.equal(priority.length, 25, 'the 25 priority questions are present');
  assert.ok(priority.every((q) => q.priority === true && typeof q.explanation === 'string'));
});

// --- negative controls: each malformed question MUST be rejected ---
test('negative control: answer index out of range is rejected', () => {
  assert.equal(validateQuestion({ ...good, answer: [9] }).ok, false);
});
test('negative control: empty option text is rejected', () => {
  assert.equal(validateQuestion({ ...good, options: ['A', '', 'C', 'D'] }).ok, false);
});
test('negative control: duplicate options are rejected', () => {
  assert.equal(validateQuestion({ ...good, options: ['A', 'A', 'C', 'D'] }).ok, false);
});
test('negative control: single-answer with two keys is rejected', () => {
  assert.equal(validateQuestion({ ...good, answer: [0, 1] }).ok, false);
});
test('negative control: multi-answer marking every option correct is rejected', () => {
  const q = { ...good, type: 'multi', answer: [0, 1, 2, 3] };
  assert.equal(validateQuestion(q).ok, false);
});
test('negative control: bad id format is rejected', () => {
  assert.equal(validateQuestion({ ...good, id: 'nope' }).ok, false);
});
test('negative control: impossible flag on non-extreme is rejected', () => {
  assert.equal(validateQuestion({ ...good, impossible: true }).ok, false);
});
test('a question may carry a boolean priority flag', () => {
  assert.equal(validateQuestion({ ...good, priority: true }).ok, true);
  assert.equal(validateQuestion({ ...good, priority: false }).ok, true);
});
test('negative control: non-boolean priority is rejected', () => {
  assert.equal(validateQuestion({ ...good, priority: 'yes' }).ok, false); // NEGATIVE CONTROL
});
test('negative control: duplicate ids across a bank are rejected', () => {
  const res = validateBank([good, { ...good }]);
  assert.equal(res.ok, false);
  assert.ok(res.rejected.length >= 1);
});

// --- optional question image hook (content stays human-authored) ---
test('a question with a valid local image validates', () => {
  const q = { ...good, image: { src: 'assets/diagrams/rf2.png', alt: 'Two-node replication diagram', caption: 'RF2 data placement' } };
  assert.equal(validateQuestion(q).ok, true);
});
test('negative control: image without alt text is rejected', () => {
  const q = { ...good, image: { src: 'assets/diagrams/rf2.png' } };
  assert.equal(validateQuestion(q).ok, false);
});
test('negative control: external image URLs are rejected (static/offline rule)', () => {
  for (const src of ['https://example.com/x.png', '//cdn.example.com/x.png', 'data:image/png;base64,AAAA']) {
    const q = { ...good, image: { src, alt: 'A diagram' } };
    assert.equal(validateQuestion(q).ok, false, src);
  }
});
test('negative control: image as a bare string is rejected', () => {
  assert.equal(validateQuestion({ ...good, image: 'x.png' }).ok, false);
});
