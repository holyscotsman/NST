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
  // (v2.53.0) the bank the app SERVES, through the real parser and adapter — not the
  // compiled fixture this used to validate, which no player ever received.
  const { shippedBank } = await import('./fixtures.mjs');
  const QUESTIONS = shippedBank().questions;
  /* { runtime: true } is how main.js validates it. The strict mode below it enforces
   * WWTBANE's OWN authored taxonomy -- its id pattern and its twelve domain names -- and
   * a launcher bank is authored to the NST schema instead. Validating the served bank
   * strictly rejects all 255 of them for having ids like "mci-security-q3p5", which is
   * not a defect in the bank; it is the wrong question asked of it. */
  const res = validateBank(QUESTIONS, { runtime: true });
  assert.equal(res.ok, true, JSON.stringify(res.rejected));
  // Enough to build a classic 10/10/9 run.
  assert.ok(res.summary.byDiff.easy >= 10, `easy: ${res.summary.byDiff.easy}`);
  assert.ok(res.summary.byDiff.medium >= 10, `medium: ${res.summary.byDiff.medium}`);
  assert.ok(res.summary.byDiff.hard >= 9, `hard: ${res.summary.byDiff.hard}`);
  /* (v2.53.0) `extreme >= 1` was here, and it held for WWTBANE's own authored bank. The
   * bank the app serves has NO extreme tier -- its questions are difficulty 2, 3 and 4,
   * which toWWTBANE maps to easy/medium/hard and nothing to extreme. So the "nearly
   * impossible final" is an ordinary hard question, and `q.impossible` can never fire
   * because no bank format field expresses it.
   *
   * That is a property of the content, not a fault in the code: pickExtremeFinal falls
   * back through `|| pick(buckets.hard) || pick(bank)` on purpose. Asserting a tier the
   * shipped bank does not have would fail for the wrong reason; asserting nothing would
   * leave the fallback untested. So assert the fallback, on the real bank. */
  assert.equal(res.summary.byDiff.extreme || 0, 0,
    'the served bank has no extreme tier -- if one appears, revisit the final-rung fallback below');
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
test('interchange ids validate; malformed interchange ids do not', () => {
  assert.equal(validateQuestion({ ...good, id: 'ncp-mci-e1-q7' }).ok, true);
  assert.equal(validateQuestion({ ...good, id: 'ncp-mci-e1-7' }).ok, false);  // NEGATIVE CONTROL (no -qN)
  assert.equal(validateQuestion({ ...good, id: 'NCP-MCI-e1-q7' }).ok, false); // NEGATIVE CONTROL (mixed case)
});
test('optionNotes must align 1:1 with options and be strings', () => {
  assert.equal(validateQuestion({ ...good, optionNotes: ['a', 'b', 'c', 'd'] }).ok, true);
  assert.equal(validateQuestion({ ...good, optionNotes: ['a', '', '', ''] }).ok, true, 'empty entries allowed');
  assert.equal(validateQuestion({ ...good, optionNotes: ['a', 'b'] }).ok, false);          // NEGATIVE CONTROL (misaligned)
  assert.equal(validateQuestion({ ...good, optionNotes: 'a note' }).ok, false);            // NEGATIVE CONTROL (not an array)
  assert.equal(validateQuestion({ ...good, optionNotes: ['a', 'b', 'c', 42] }).ok, false); // NEGATIVE CONTROL (non-string)
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

test('the ladder still has a final rung when the bank has no extreme tier', async () => {
  const { shippedBank } = await import('./fixtures.mjs');
  const { buildSet } = await import('../src/core/selection.js');
  const { emptyMastery } = await import('../src/core/mastery.js');
  const bank = shippedBank().questions;
  assert.equal(bank.filter((q) => q.authoredDifficulty === 'extreme').length, 0,
    'precondition: the served bank really has no extreme questions');

  const set = buildSet({ bank, mastery: emptyMastery(), mode: 'seeded', seed: 'FINAL' });
  assert.equal(set.length, 30, 'a full classic run is still built');
  const final = set[set.length - 1];
  assert.ok(final && final.id, 'the final rung is a real question, not undefined');
  assert.ok(final.stem && final.options.length >= 2, 'and a playable one');
});
