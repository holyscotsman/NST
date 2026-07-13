import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, normalizeSeed, generateSeedString } from '../src/core/rng.js';

test('the same seed string reproduces the same sequence', () => {
  const a = makeRng('NTNX-TESTME'), b = makeRng('NTNX-TESTME');
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('negative control: different seeds diverge', () => {
  const a = makeRng('NTNX-AAAAAA'), b = makeRng('NTNX-BBBBBB');
  const sameAll = Array.from({ length: 10 }, () => a() === b()).every(Boolean);
  assert.equal(sameAll, false);
});

test('normalizeSeed uppercases and strips to A-Z/0-9/dash', () => {
  assert.equal(normalizeSeed('ntnx-abc123'), 'NTNX-ABC123');
  assert.equal(normalizeSeed('  NTNX-8F3K2Q  '), 'NTNX-8F3K2Q');
  assert.equal(normalizeSeed('<script>alert(1)</script>'), 'SCRIPTALERT1SCRIPT');
});

test('normalizeSeed caps length and rejects empty input', () => {
  assert.equal(normalizeSeed('A'.repeat(60)).length, 24);
  assert.equal(normalizeSeed(''), null);          // NEGATIVE CONTROL
  assert.equal(normalizeSeed('   ☃☃☃   '), null); // NEGATIVE CONTROL
  assert.equal(normalizeSeed(undefined), null);   // NEGATIVE CONTROL
});

test('a typed seed and its link form normalize identically (same run)', () => {
  const generated = generateSeedString(() => 0.42);
  assert.equal(normalizeSeed(generated), generated, 'generated seeds are already normal form');
  assert.equal(normalizeSeed('ntnx-testme'), normalizeSeed('NTNX-TESTME'));
});
