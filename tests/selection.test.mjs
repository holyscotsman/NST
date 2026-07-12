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

test('mastery mode surfaces priority questions first; seeded mode ignores priority', () => {
  // 15 medium questions, the first 5 flagged priority ("master these first").
  const bank = makeBank({ easy: 15, medium: 15, hard: 15, extreme: 5, impossible: 2 });
  let tagged = 0;
  for (const q of bank) { if (q.authoredDifficulty === 'medium' && tagged < 5) { q.priority = true; tagged += 1; } }
  const prioIds = new Set(bank.filter((q) => q.priority).map((q) => q.id));
  const prioCount = (set) => set.filter((q) => prioIds.has(q.id)).length;

  const N = 60;
  let masterySum = 0, seededSum = 0;
  for (let i = 0; i < N; i++) {
    masterySum += prioCount(buildSet({ bank, mode: 'mastery', mastery: emptyMastery(), setIndex: i, reachedFinalBefore: true }));
    seededSum += prioCount(buildSet({ bank, mode: 'seeded', seed: `S${i}`, setIndex: 0, reachedFinalBefore: true }));
  }
  const mMean = masterySum / N, sMean = seededSum / N;
  // Mastery selection floods the run with the 5 priority questions (of 5).
  assert.ok(mMean >= 4.3, `mastery should surface almost all priority questions each run (got ${mMean.toFixed(2)})`);
  // NEGATIVE CONTROL: seeded selection is priority-blind, so it picks them only at
  // the base rate (~5 * 10/15 ≈ 3.3) — clearly fewer than mastery mode.
  assert.ok(mMean > sMean + 0.6, `mastery (${mMean.toFixed(2)}) must beat priority-blind seeded (${sMean.toFixed(2)})`);
});

test('SetManager feeds the shared run clock into mastery weighting (staleness survives rebuilds)', () => {
  const bank = makeBank({ easy: 15, medium: 15, hard: 15, extreme: 5, impossible: 2 });
  // Spread lastRun 0..14 across every item so the clock value changes weights.
  const mkMastery = () => {
    const m = emptyMastery();
    bank.filter((q) => q.authoredDifficulty !== 'extreme').forEach((q, i) => {
      record(m, q.id, { correct: true, runIndex: i % 15, authoredDifficulty: q.authoredDifficulty });
    });
    return m;
  };
  const mkRng = () => { let c = 0; return () => { c++; return ((c * 2654435761) % 1000) / 1000; }; };
  const ids = (set) => set.map((q) => q.id);

  // Plumbing proof: a SetManager with clock=10 builds the EXACT set that a
  // direct buildSet with currentRun=10 builds (same rng, same mastery).
  const direct10 = buildSet({ bank, mastery: mkMastery(), mode: 'mastery', currentRun: 10, rng: mkRng(), reachedFinalBefore: true });
  const sm10 = new SetManager({ bank, getMastery: mkMastery, mode: 'mastery', rng: mkRng(), reachedFinalBefore: true, getRunIndex: () => 10 });
  assert.deepEqual(ids(sm10.init()), ids(direct10), 'getRunIndex reaches buildSet as currentRun');

  // NEGATIVE CONTROL: the old post-prestige state (clock reset to 0) selects a
  // DIFFERENT set — staleness clamps to zero and the weighting changes.
  const sm0 = new SetManager({ bank, getMastery: mkMastery, mode: 'mastery', rng: mkRng(), reachedFinalBefore: true, getRunIndex: () => 0 });
  assert.notDeepEqual(ids(sm0.init()), ids(direct10), 'a collapsed clock changes selection');
});

test('pinIntoCurrent places a promised question into a hard slot exactly once', () => {
  const bank = makeBank({ easy: 25, medium: 25, hard: 25, extreme: 8, impossible: 2 });
  const sm = new SetManager({ bank, getMastery: () => emptyMastery(), mode: 'seeded', seed: 'PIN', reachedFinalBefore: true });
  sm.init();
  const outsider = bank.find((q) => q.authoredDifficulty === 'hard' && !sm.current().some((x) => x.id === q.id));
  assert.ok(outsider, 'fixture provides a hard question outside the set');

  assert.equal(sm.pinIntoCurrent(outsider), true);
  const set = sm.current();
  assert.equal(set.length, 30);
  assert.equal(new Set(set.map((q) => q.id)).size, 30, 'still 30 distinct');
  const idx = set.findIndex((q) => q.id === outsider.id);
  assert.ok(idx >= 20 && idx <= 28, `pinned into the hard block (got ${idx})`);

  // NEGATIVE CONTROL: pinning a question already in the set is a no-op.
  const before = set.map((q) => q.id);
  assert.equal(sm.pinIntoCurrent(set[5]), false);
  assert.deepEqual(sm.current().map((q) => q.id), before, 'set unchanged');
});

test('Steve never repeats a taught clue and never sells a clue-less question', () => {
  // 8 clue-less hards + AHV-H-900 (the only clue carrier) = exactly 9 hards, so
  // every hard question is guaranteed into the seeded set's 9 hard slots.
  const bank = makeBank({ hard: 8 });
  const sm = new SetManager({ bank, getMastery: () => emptyMastery(), mode: 'seeded', seed: 'STEVE', reachedFinalBefore: true });
  sm.init();

  // NEGATIVE CONTROL: untaught, clue-carrying → returned (Steve still works).
  const q = sm.peekUpcomingHard(new Set());
  assert.ok(q && q.id === 'AHV-H-900' && q.steveClue, 'the clue carrier is offered');

  // Already taught → null, even with 8 untaught clue-less hards in the set
  // (the old fallback would re-teach or sell one of those).
  assert.equal(sm.peekUpcomingHard(new Set(['AHV-H-900'])), null, 'no repeats, no clue-less sales');

  // A set whose hard slots hold ONLY clue-less questions → null outright.
  const bare = makeBank({ hard: 9 }).filter((x) => x.id !== 'AHV-H-900');
  const sm2 = new SetManager({ bank: bare, getMastery: () => emptyMastery(), mode: 'seeded', seed: 'STEVE2', reachedFinalBefore: true });
  sm2.init();
  assert.equal(sm2.peekUpcomingHard(new Set()), null, 'nothing to teach means nothing for sale');
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
