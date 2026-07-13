import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitIntoParts } from '../src/core/textSplit.js';

test('splits a multi-sentence clue on sentence boundaries', () => {
  const clue = 'The CVM runs AOS on every node. It serves all the cluster storage. Prism manages the whole thing.';
  const parts = splitIntoParts(clue, 3);
  assert.equal(parts.length, 3);
  assert.ok(parts.every((p) => p.length > 0));
  // no word is lost or added — concatenation preserves the content
  assert.equal(parts.join(' ').replace(/\s+/g, ' ').trim(), clue.replace(/\s+/g, ' ').trim());
});

test('falls back to word splitting when there are fewer sentences than parts', () => {
  const clue = 'Data-at-rest encryption protects the media, not the wire.'; // one sentence
  const parts = splitIntoParts(clue, 3);
  assert.equal(parts.length, 3);
  assert.ok(parts.every((p) => p.length > 0), 'no empty bubble'); // NEGATIVE CONTROL
  assert.equal(parts.join(' ').trim(), clue.trim());
});

test('always returns exactly n parts, even for tiny or empty input', () => {
  assert.deepEqual(splitIntoParts('', 3), ['', '', '']);          // NEGATIVE CONTROL
  assert.equal(splitIntoParts('Hi.', 3).length, 3);
  assert.ok(splitIntoParts('Hi.', 3).every((p) => p.length > 0)); // padded, never blank
  assert.deepEqual(splitIntoParts('one sentence only', 1), ['one sentence only']);
});
