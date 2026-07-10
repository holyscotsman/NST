import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, exportString, importString, prestige } from '../src/shell/persistence.js';

test('export → import round-trips a save (mastery, wallet, stats survive)', () => {
  const s = defaultSave();
  s.wallet = 4500;
  s.stats.runs = 7;
  s.mastery.records['STOR-E-001'] = { box: 3, seen: 5, correct: 4 };
  const back = importString(exportString(s));
  assert.equal(back.wallet, 4500);
  assert.equal(back.stats.runs, 7);
  assert.deepEqual(back.mastery.records['STOR-E-001'], { box: 3, seen: 5, correct: 4 });
});

test('import normalizes a sparse save through migrate()', () => {
  const back = importString(JSON.stringify({ version: 1, wallet: 900 }));
  assert.equal(back.wallet, 900);
  assert.ok(back.lifelines.fifty.slots >= 1, 'defaults fill the gaps');
  assert.equal(back.flags.seenIntro, false);
});

test('negative control: garbage and wrong shapes import as null', () => {
  assert.equal(importString('not json {'), null);
  assert.equal(importString('[1,2,3]'), null);
  assert.equal(importString('"just a string"'), null);
  assert.equal(importString(JSON.stringify({ version: 99 })), null);
  assert.equal(importString(''), null);
});

test('prestige keeps mastery but resets wallet and slots (import-safe)', () => {
  const s = defaultSave();
  s.wallet = 9000;
  s.lifelines.fifty.slots = 2;
  s.mastery.records['X'] = { box: 4, seen: 2, correct: 2 };
  const p = importString(exportString(prestige(s)));
  assert.equal(p.wallet, 0);
  assert.equal(p.lifelines.fifty.slots, 1);
  assert.deepEqual(p.mastery.records['X'], { box: 4, seen: 2, correct: 2 }); // NEGATIVE CONTROL: never wiped
});
