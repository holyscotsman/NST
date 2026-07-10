import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSet, SetManager, tierOfQuestion } from '../src/core/selection.js';
import { emptyMastery, record } from '../src/core/mastery.js';
import { makeBank } from './fixtures.mjs';

function countByAuthored(set) {
  const c = { easy: 0, medium: 0, hard: 0, extreme: 0 };
  for (const q of set) c[q.authoredDifficulty]++;
  return c;
}

test('a run is 30 distinct questions in the 10/10/9/1 tier shape', () => {
  const bank = makeBank();
  const set = buildSet({ bank, mode: 'seeded', seed: 'ABC', setIndex: 0, reachedFinalBefore: true });
  assert.equal(set.length, 30);
  assert.equal(new Set(set.map((q) => q.id)).size, 30, 'all distinct');
  assert.deepEqual(countByAuthored(set), { easy: 10, medium: 10, hard: 9, extreme: 1 });
  assert.equal(set[29].authoredDifficulty, 'extreme', 'final is extreme');
});

test('seeded selection is deterministic and ignores mastery', () => {
  const bank = makeBank();
  const a = buildSet({ bank, mode: 'seeded', seed: 'SEED-1', setIndex: 0 });
  const b = buildSet({ bank, mode: 'seeded', seed: 'SEED-1', setIndex: 0 });
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id), 'same seed reproduces');

  // Mastery churn must not change a seeded run.
  const m = emptyMastery();
  for (const q of bank) record(m, q.id, { correct: true, authoredDifficulty: q.authoredDifficulty });
  const c = buildSet({ bank, mode: 'seeded', seed: 'SEED-1', setIndex: 0, mastery: m });
  assert.deepEqual(a.map((q) => q.id), c.map((q) => q.id), 'mastery does not affect seeded'); // NEGATIVE CONTROL
});

test('different seeds generally produce different runs', () => {
  const bank = makeBank();
  const a = buildSet({ bank, mode: 'seeded', seed: 'SEED-A', setIndex: 0 });
  const b = buildSet({ bank, mode: 'seeded', seed: 'SEED-B', setIndex: 0 });
  assert.notDeepEqual(a.map((q) => q.id), b.map((q) => q.id)); // NEGATIVE CONTROL
});

test('impossible final is gated on the reached-final flag, not the seed', () => {
  const bank = makeBank();
  const first = buildSet({ bank, mode: 'seeded', seed: 'S', setIndex: 0, reachedFinalBefore: false });
  assert.equal(first[29].impossible, true, 'first-ever final is impossible');

  const later = buildSet({ bank, mode: 'seeded', seed: 'S', setIndex: 0, reachedFinalBefore: true });
  assert.notEqual(later[29].impossible, true, 'later finals are not impossible'); // NEGATIVE CONTROL
});

test('the impossible first final is deterministic under a seed (same seed, same Q30)', () => {
  const bank = makeBank();
  const a = buildSet({ bank, mode: 'seeded', seed: 'SHARED', setIndex: 0, reachedFinalBefore: false });
  const b = buildSet({ bank, mode: 'seeded', seed: 'SHARED', setIndex: 0, reachedFinalBefore: false });
  assert.equal(a[29].impossible, true);
  assert.equal(a[29].id, b[29].id, 'two first-time players on the same seed get the same final'); // NEGATIVE CONTROL
});

test('selection backfills when a tier is short and still returns 30 distinct', () => {
  const bank = makeBank({ easy: 5, medium: 15, hard: 15, extreme: 5, impossible: 2 }); // too few easy
  const set = buildSet({ bank, mode: 'seeded', seed: 'BF', setIndex: 0, reachedFinalBefore: true });
  assert.equal(set.length, 30);
  assert.equal(new Set(set.map((q) => q.id)).size, 30);
});

test('mastery mode reproduces with an injected rng and shifts tiers as you learn', () => {
  const bank = makeBank();
  const m = emptyMastery();
  // Master all the "hard" AHV questions so they drift to an easier tier.
  for (const q of bank.filter((x) => x.authoredDifficulty === 'hard')) {
    for (let i = 0; i < 3; i++) record(m, q.id, { correct: true, authoredDifficulty: 'hard' });
    assert.notEqual(tierOfQuestion(bank.find((x) => x.id === q.id), m, 'mastery'), 'hard'); // NEGATIVE CONTROL
  }
  let calls = 0; const rng = () => { calls++; return ((calls * 2654435761) % 1000) / 1000; };
  const set = buildSet({ bank, mode: 'mastery', mastery: m, rng, reachedFinalBefore: true });
  assert.equal(set.length, 30);
  assert.equal(new Set(set.map((q) => q.id)).size, 30);
});

test('mastery mode reproduces exactly with the same injected rng + mastery', () => {
  const bank = makeBank();
  const m = emptyMastery();
  for (const q of bank.slice(0, 20)) record(m, q.id, { correct: true, authoredDifficulty: q.authoredDifficulty });
  const mkRng = () => { let c = 0; return () => { c++; return ((c * 2654435761) % 1000) / 1000; }; };
  const a = buildSet({ bank, mode: 'mastery', mastery: m, rng: mkRng(), reachedFinalBefore: true });
  const b = buildSet({ bank, mode: 'mastery', mastery: m, rng: mkRng(), reachedFinalBefore: true });
  assert.deepEqual(a.map((q) => q.id), b.map((q) => q.id), 'same rng + mastery -> same run');
});

test('SetManager keeps a disjoint current/next and Steve reads the upcoming run', () => {
  // Big enough to build two fully-disjoint back-to-back runs (needs >= 60).
  const bank = makeBank({ easy: 25, medium: 25, hard: 25, extreme: 8, impossible: 2 });
  const sm = new SetManager({ bank, getMastery: () => emptyMastery(), mode: 'seeded', seed: 'DB', reachedFinalBefore: true });
  const current = sm.init();
  const next = sm.next();
  const overlap = current.filter((q) => next.some((n) => n.id === q.id));
  assert.equal(overlap.length, 0, 'current and next do not overlap');

  const steveQ = sm.peekUpcomingHard(new Set());
  assert.ok(steveQ, 'Steve has a question');
  assert.ok(current.some((q) => q.id === steveQ.id), 'from the upcoming (current) run');
  assert.ok(steveQ.steveClue, 'and it carries a teaching clue');
});
