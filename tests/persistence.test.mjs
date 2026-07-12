import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave, exportString, importString, prestige, resetAll } from '../src/shell/persistence.js';
import { SAVE_VERSION } from '../src/core/config.js';

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
  assert.equal(importString(JSON.stringify({ version: 99 })), null); // NEGATIVE CONTROL: future/unknown version rejected
  assert.equal(importString(''), null);
});

test('the save version is stamped from SAVE_VERSION and migrate normalizes it', () => {
  assert.equal(defaultSave().version, SAVE_VERSION);
  // migrate() always stamps the current version so no stored value survives
  // unnormalized (both load() and importString() route through it).
  const back = importString(exportString(defaultSave()));
  assert.equal(back.version, SAVE_VERSION);
});

test('reset returns a first-time save — the intro replays and nothing carries over', () => {
  const fresh = resetAll();
  assert.equal(fresh.flags.seenIntro, false, 'the first-run intro plays again');
  assert.equal(fresh.flags.reachedFinalBefore, false, 'the impossible-final gate resets too');
  assert.equal(fresh.wallet, 0);
  assert.equal(Object.keys(fresh.mastery.records).length, 0, 'mastery wiped'); // NEGATIVE CONTROL vs prestige (which keeps it)
  assert.equal(fresh.lifelines.fifty.slots, 1, 'purchased slots gone');
  assert.deepEqual(fresh.steveTaught, []);
});

test('stevePending persists a paid clue and migrate normalizes bad shapes', () => {
  const s = defaultSave();
  assert.equal(s.stevePending, null, 'default is null');
  s.stevePending = 'AHV-H-900';
  const back = importString(exportString(s));
  assert.equal(back.stevePending, 'AHV-H-900', 'the paid promise survives a round-trip');
  // NEGATIVE CONTROL: a non-string stevePending in a stored save normalizes to
  // null instead of crashing the load or leaking a weird type into selection.
  const dirty = importString(JSON.stringify({ version: 1, stevePending: { evil: true } }));
  assert.equal(dirty.stevePending, null);
  const missing = importString(JSON.stringify({ version: 1 }));
  assert.equal(missing.stevePending, null, 'older saves without the field fill with null');
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
