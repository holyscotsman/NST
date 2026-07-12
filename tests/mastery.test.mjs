import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyMastery, record, effectiveTier, getRecord, isGraduated, domainProgress, selectionWeight } from '../src/core/mastery.js';
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

test('the graduate-out ceiling equals the promotion cap, so graduation is reachable', () => {
  // NEGATIVE CONTROL: record() caps the box at MAX_BOX, so if GRADUATED_BOX ever
  // exceeded MAX_BOX, isGraduated() could never fire. They share one source.
  assert.equal(MASTERY.GRADUATED_BOX, MASTERY.MAX_BOX);
});

test('extreme questions stay pinned to the extreme tier regardless of mastery', () => {
  const m = emptyMastery();
  for (let i = 0; i < 10; i++) record(m, extreme.id, { correct: true, authoredDifficulty: 'extreme' });
  assert.equal(effectiveTier(m, extreme), 'extreme'); // NEGATIVE CONTROL
});

test('domainProgress ranks proven-weak domains first and counts graduations', () => {
  const bank = [
    { id: 'STOR-E-001', domain: 'storage', authoredDifficulty: 'easy' },
    { id: 'STOR-E-002', domain: 'storage', authoredDifficulty: 'easy' },
    { id: 'NET-M-001', domain: 'networking', authoredDifficulty: 'medium' },
    { id: 'NET-M-002', domain: 'networking', authoredDifficulty: 'medium' },
    { id: 'PRISM-X-001', domain: 'prism', authoredDifficulty: 'extreme' }, // excluded (finals pool)
  ];
  const m = emptyMastery();
  // Master all of storage; keep failing networking.
  for (let i = 0; i < 6; i++) record(m, 'STOR-E-001', { correct: true, authoredDifficulty: 'easy' });
  for (let i = 0; i < 6; i++) record(m, 'STOR-E-002', { correct: true, authoredDifficulty: 'easy' });
  record(m, 'NET-M-001', { correct: false, authoredDifficulty: 'medium' });

  const rows = domainProgress(bank, m);
  assert.equal(rows.length, 2, 'extreme-only domains are excluded');
  assert.equal(rows[0].domain, 'networking', 'the weak domain ranks first');
  assert.equal(rows[1].domain, 'storage');
  assert.equal(rows[1].graduated, 2);
  assert.equal(rows[1].score, 1, 'fully mastered domain scores 100%');
  assert.ok(rows[0].score < 0.5, 'failing domain scores low');
  // NEGATIVE CONTROL: the mastered domain must NOT rank as weakest.
  assert.notEqual(rows[0].domain, 'storage');
});

test('priority questions outweigh peers in selection until they graduate', () => {
  const prio = { id: 'NPX-M-001', authoredDifficulty: 'medium', priority: true };
  const peer = { id: 'STOR-M-001', authoredDifficulty: 'medium' }; // same tier, no priority
  const m = emptyMastery();
  // Untouched: identical base weight, but the priority flag boosts it hard.
  const wPrio = selectionWeight(m, prio, 0);
  const wPeer = selectionWeight(m, peer, 0);
  assert.ok(wPrio > wPeer * 5, `priority (${wPrio}) should dwarf its peer (${wPeer})`);

  // NEGATIVE CONTROL: the non-priority peer gets no boost.
  const m2 = emptyMastery();
  assert.equal(selectionWeight(m2, { ...peer }, 0), selectionWeight(m2, { ...peer, priority: false }, 0));

  // NEGATIVE CONTROL: once the player masters (graduates) the priority question,
  // the boost drops away — a mastered priority item behaves like any other.
  const m3 = emptyMastery();
  for (let i = 0; i < 10; i++) record(m3, prio.id, { correct: true, authoredDifficulty: 'medium' });
  assert.equal(isGraduated(m3, prio.id), true);
  const gradPrio = selectionWeight(m3, prio, 0);
  const gradPeerBox = { id: 'STOR-M-002', authoredDifficulty: 'medium' };
  for (let i = 0; i < 10; i++) record(m3, gradPeerBox.id, { correct: true, authoredDifficulty: 'medium' });
  assert.equal(gradPrio, selectionWeight(m3, gradPeerBox, 0), 'graduated priority = graduated peer'); // NEGATIVE CONTROL
});

test('domainProgress gives unseen questions zero credit', () => {
  const bank = [
    { id: 'AHV-H-001', domain: 'ahv', authoredDifficulty: 'hard' },
    { id: 'AHV-H-002', domain: 'ahv', authoredDifficulty: 'hard' },
  ];
  const m = emptyMastery();
  const rows = domainProgress(bank, m);
  assert.equal(rows[0].seen, 0);
  assert.equal(rows[0].score, 0, 'no proof, no progress'); // NEGATIVE CONTROL
});
