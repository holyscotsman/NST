/* mastery-test.mjs — the shared mastery store's contract.
 *
 * This module now carries every tool's scheduling AND absorbs two legacy stores
 * that hold months of a user's real history, so the tests care most about:
 *   - each tool's policy surviving the merge (StarNix's due-gate, WWTBANE's
 *     unaided rule and its ladder length)
 *   - migration never losing proven progress
 *   - a corrupt or hand-edited record never poisoning the scheduler
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/mastery-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'shared', 'nst-mastery.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

function fresh(seed = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage };
  win.window = win;
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', SRC)(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  return { M: win.NSTMastery, map };
}

const T0 = 1_700_000_000_000;   // fixed clock; the module takes an injectable now

/* ---- StarNix policy: promote only when DUE ---- */
{
  const { M } = fresh();
  M.record('q1', { correct: true, gate: 'due', step: 1, now: T0 });
  ok('a first correct answer promotes (a new card is always due)', M.get('q1').box === 1);

  // immediately again: box 1's interval is 30s, so this is NOT due
  M.record('q1', { correct: true, gate: 'due', step: 1, now: T0 + 1000 });
  ok('cramming the same card does not promote it again', M.get('q1').box === 1, M.get('q1').box);
  ok('but the answer is still counted', M.get('q1').seen === 2 && M.get('q1').correct === 2);

  // past the interval -> due again
  M.record('q1', { correct: true, gate: 'due', step: 1, now: T0 + 40_000 });
  ok('once the interval elapses it promotes again', M.get('q1').box === 2, M.get('q1').box);

  const before = M.get('q1').lastSeen;
  M.record('q1', { correct: true, gate: 'due', step: 1, now: T0 + 41_000 });
  ok('an early correct answer does not push the due date out', M.get('q1').lastSeen === before);
}

/* ---- wrong answers always demote, due or not ---- */
{
  const { M } = fresh();
  for (let i = 0; i < 4; i++) M.record('q2', { correct: true, gate: 'due', now: T0 + i * 100_000_000 });
  const high = M.get('q2').box;
  M.record('q2', { correct: false, gate: 'due', now: T0 + 100 });   // nowhere near due
  ok('a wrong answer demotes even when the card is not due', M.get('q2').box === high - 1, `${high} -> ${M.get('q2').box}`);
  ok('a wrong answer resets the streak', M.get('q2').streak === 0);
}

/* ---- WWTBANE policy: unaided-only, step 2, ladder length preserved ---- */
{
  const { M } = fresh();
  // an EASY question seeds at 6; one unaided correct (+2) graduates it, as before
  M.record('e1', { correct: true, gate: 'always', step: 2, seedBox: M.seedFor('easy'), now: T0 });
  ok('one unaided correct still graduates an easy question', M.isGraduated(M.get('e1')), M.get('e1').box);

  // a HARD question seeds at 0 and takes four
  const { M: M2 } = fresh();
  for (let i = 0; i < 3; i++) M2.record('h1', { correct: true, gate: 'always', step: 2, seedBox: M2.seedFor('hard'), now: T0 + i });
  ok('three unaided corrects do not yet graduate a hard question', !M2.isGraduated(M2.get('h1')), M2.get('h1').box);
  M2.record('h1', { correct: true, gate: 'always', step: 2, now: T0 + 9 });
  ok('the fourth graduates it', M2.isGraduated(M2.get('h1')), M2.get('h1').box);

  // a lifeline-assisted answer counts but must not promote
  const { M: M3 } = fresh();
  M3.record('a1', { correct: true, gate: 'always', step: 2, seedBox: 2, now: T0 });
  const boxAfter = M3.get('a1').box;
  M3.record('a1', { correct: true, gate: 'always', step: 2, assisted: true, now: T0 + 1 });
  ok('an assisted correct answer does not move the box', M3.get('a1').box === boxAfter, M3.get('a1').box);
  ok('an assisted answer is still counted as seen', M3.get('a1').seen === 2);
}

/* ---- due scheduling ---- */
{
  const { M } = fresh();
  ok('a never-answered question is due', M.isDue(null, T0));
  M.record('d1', { correct: true, gate: 'due', now: T0 });          // -> box 1, interval 30s
  ok('not due one second later', !M.isDue(M.get('d1'), T0 + 1000));
  ok('due once the interval passes', M.isDue(M.get('d1'), T0 + 31_000));
}

/* ---- migration: the part that touches real user history ---- */
{
  const starnix = {
    shared: { id: 'shared', box: 3, seen: 10, correct: 7, incorrect: 3, streak: 2, lastSeen: T0, firstCorrectAt: T0 - 1000 },
    sxOnly: { id: 'sxOnly', box: 5, seen: 4, correct: 4, incorrect: 0, streak: 4, lastSeen: T0 },
  };
  const wwtbane = {
    shared: { box: 5, seen: 6, correct: 5, lastRun: 3 },   // 0..5 scale -> 8
    wbOnly: { box: 2, seen: 3, correct: 1, lastRun: 1 },   // -> round(2*1.6)=3
  };
  const { M } = fresh();
  const merged = M.mergeLegacy(starnix, wwtbane);

  // three distinct questions, not four: `shared` is the SAME question in both stores
  ok('every distinct question from both stores survives', Object.keys(merged).length === 3, Object.keys(merged).join(','));
  ok('a StarNix-only question keeps its box', merged.sxOnly.box === 5);
  ok('a WWTBANE box is rescaled 0..5 -> 0..8', merged.wbOnly.box === 3, merged.wbOnly.box);
  ok('a shared question takes the HIGHER box', merged.shared.box === 8, merged.shared.box);
  ok('a shared question ADDS both stores exposure', merged.shared.seen === 16, merged.shared.seen);
  ok('a shared question adds both correct counts', merged.shared.correct === 12, merged.shared.correct);
  ok('WWTBANE wrongs are inferred from seen-minus-correct', merged.shared.incorrect === 3 + 1, merged.shared.incorrect);
  ok('StarNix timestamps are carried over', merged.shared.lastSeen === T0);
  ok('a WWTBANE-only question is left due rather than given a fabricated schedule', merged.wbOnly.lastSeen === 0);
}

/* ---- migrateIfNeeded reads the real legacy keys and is idempotent ---- */
{
  const seed = {
    'starnix:profile': JSON.stringify({ mastery: { a: { box: 2, seen: 3, correct: 2, incorrect: 1, lastSeen: T0 } } }),
    'wwtbane.save.v1': JSON.stringify({ mastery: { records: { b: { box: 5, seen: 2, correct: 2, lastRun: 1 } } } }),
  };
  const { M, map } = fresh(seed);
  const r1 = M.migrateIfNeeded();
  ok('migration runs when the shared store is empty', r1.ran && r1.migrated === 2, JSON.stringify(r1));
  ok('it reports where the records came from', r1.fromStarNix === 1 && r1.fromWWTBANE === 1);
  ok('the shared store now holds both', M.count() === 2);
  ok('the legacy stores are LEFT IN PLACE (only copy of this history)',
    map.has('starnix:profile') && map.has('wwtbane.save.v1'));
  const r2 = M.migrateIfNeeded();
  ok('running it again is a no-op', !r2.ran, JSON.stringify(r2));
}
{
  const { M } = fresh({});
  ok('migration with nothing to migrate is a clean no-op', !M.migrateIfNeeded().ran);
}

/* ---- hostile / corrupt input ---- */
{
  const { M } = fresh({
    'nst.mastery.v1': JSON.stringify({
      format: 1,
      records: {
        nan: { box: NaN, seen: 'lots', correct: -5, incorrect: null, lastSeen: 'yesterday' },
        huge: { box: 9999, seen: 1e9, correct: 1e9 },
        neg: { box: -50, seen: -3, correct: -3 },
      },
    }),
  });
  const nan = M.get('nan');
  ok('a NaN box is clamped into range', nan.box >= 0 && nan.box <= 8, nan.box);
  ok('non-numeric counters become 0', nan.seen === 0 && nan.correct === 0);
  ok('a negative count becomes 0', M.get('neg').seen === 0 && M.get('neg').box === 0);
  ok('an out-of-range box is clamped to MAX', M.get('huge').box === 8, M.get('huge').box);
  ok('correct can never exceed seen', M.get('huge').correct <= M.get('huge').seen);
}
{
  const { M } = fresh({ 'nst.mastery.v1': '{"format":1,"__proto__":{"pwned":1},"records":{"x":{"box":1}}}' });
  M.load(true);
  ok('a stored blob cannot pollute Object.prototype', ({}).pwned === undefined);
  ok('the legitimate record still loads', M.get('x') !== null);
}
{
  const { M } = fresh({ 'nst.mastery.v1': 'not json at all' });
  ok('corrupt storage yields an empty store rather than throwing', M.count() === 0);
}

/* ---- summary / rollup ---- */
{
  const { M } = fresh();
  const bank = [
    { id: 'a', domain: 'VMs' }, { id: 'b', domain: 'VMs' },
    { id: 'c', domain: 'Storage' }, { id: 'd', domain: 'Storage' }, { id: 'e', domain: 'Storage' },
  ];
  // master both VMs questions, leave Storage untouched
  for (const id of ['a', 'b']) {
    for (let i = 0; i < 5; i++) M.record(id, { correct: true, gate: 'due', now: T0 + i * 100_000_000 });
  }
  const s = M.summary(bank, T0 + 500_000_000);
  ok('summary counts what has been seen', s.seen === 2 && s.total === 5);
  ok('summary counts mastered', s.mastered === 2, s.mastered);
  ok('unseen questions are due', s.due >= 3, s.due);
  ok('domains are ordered weakest-first', s.domains[0].domain === 'Storage', s.domains.map(d => d.domain).join(','));
  ok('a domain score reflects its boxes', s.domains[0].score === 0 && s.domains[1].score > 0);
  ok('masteredPct is over the whole bank, not just what was seen', Math.round(s.masteredPct) === 40, s.masteredPct);
}

/* ---- a save must never throw, even when storage refuses ---- */
{
  const map = new Map();
  const storage = {
    get length() { return map.size; }, key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: () => { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage }; win.window = win;
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', SRC)(win, (fn) => { fn(); return 0; }, () => {}, Date);
  const M = win.NSTMastery;
  let threw = false;
  try { M.record('q', { correct: true, now: T0 }); M.flush(); } catch (e) { threw = true; }
  ok('recording an answer never throws when storage is full', !threw);
  ok('the answer still counts in-session', M.get('q').seen === 1);
  ok('the write failure is reported', M.saveError() === 'quota', M.saveError());
}

console.log('\n' + (fail ? `MASTERY: ${fail} FAILED of ${pass + fail}` : `MASTERY: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
