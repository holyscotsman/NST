/* backup-test.mjs — NSTBackup contract, against a shimmed window.
 *
 * The stakes: this module is the only thing standing between a user and losing
 * months of mastery history, and it writes to a localStorage that is SHARED with
 * every other site published under the same github.io user page. So the tests
 * care as much about what it refuses to write as about what it round-trips.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/backup-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'shared', 'nst-backup.js'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  -- ' + extra : '')); }
};

/* Minimal localStorage + window shim. */
function makeWindow(seed = {}, opts = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (opts.failWritesFor && opts.failWritesFor(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      map.set(k, String(v));
    },
    removeItem: (k) => { map.delete(k); },
    _map: map,
  };
  const win = { localStorage: storage, NST_VERSION: '9.9.9' };
  win.window = win;
  const fn = new Function('window', 'navigator', 'document', 'Blob', 'URL', 'setTimeout', SRC);
  fn(win, {}, undefined, undefined, undefined, () => {});
  return { win, storage, map };
}

const T0 = 1_700_000_000_000;
const MASTERY_SRC = readFileSync(join(HERE, '..', 'shared', 'nst-mastery.js'), 'utf8');

/* A window with BOTH modules in it, wired the way a page wires them: backup
 * first, mastery second, exactly as index.html loads them. The merge path looks
 * NSTMastery up lazily at restore time for that reason, and testing the two
 * together is the only way to prove that lookup works. */
function freshBoth() {
  const map = new Map();
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage, NST_VERSION: '9.9.9' };
  win.window = win;
  new Function('window', 'navigator', 'document', 'Blob', 'URL', 'setTimeout', SRC)(
    win, {}, undefined, undefined, undefined, () => {});
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', MASTERY_SRC)(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  // The tests below reach for localStorage directly for keys with no module.
  globalThis.localStorage = storage;
  return { B: win.NSTBackup, M: win.NSTMastery, map, win };
}

const SEED = {
  'nst.prefs': '{"reducedMotion":true}',
  'nst.activeBank': 'ncp-mci-25',
  'nst.practice-exams.history.v1': '[{"score":80}]',
  'starnix:profile': '{"xp":950}',
  'wwtbane.save.v1': '{"coins":42}',
  // A neighbouring project on the SAME github.io origin. Must never be touched.
  'someOtherProject.token': 'secret-value',
  'unrelated': 'x',
};

/* ---- collect: takes ours, leaves the neighbours alone ---- */
{
  const { win } = makeWindow(SEED);
  const data = win.NSTBackup.collect();
  ok('collect takes every NST-owned key', Object.keys(data).length === 5, Object.keys(data).join(','));
  ok('collect ignores a neighbouring project on the shared origin',
    !('someOtherProject.token' in data) && !('unrelated' in data));
}

/* ---- envelope + round trip ---- */
{
  const { win } = makeWindow(SEED);
  const json = win.NSTBackup.toJSON();
  const env = JSON.parse(json);
  ok('envelope is stamped with app + format', env.app === 'nutanix-study-tool' && env.format === 1);
  ok('envelope records the app version', env.appVersion === '9.9.9');
  ok('envelope summary names the tools it found',
    env.summary.tools.includes('StarNix') && env.summary.tools.includes('WWTBANE') &&
    env.summary.tools.includes('Practice Exams') && env.summary.tools.includes('Settings'),
    env.summary.tools.join(','));

  // restore into a DIFFERENT, empty browser
  const fresh = makeWindow({});
  const res = fresh.win.NSTBackup.restore(json);
  ok('restore into an empty browser succeeds', res.ok, res.error);
  ok('round trip preserves every value',
    fresh.map.get('starnix:profile') === '{"xp":950}' &&
    fresh.map.get('wwtbane.save.v1') === '{"coins":42}' &&
    fresh.map.get('nst.prefs') === '{"reducedMotion":true}');
}

/* ---- the security property: a hostile file cannot reach a neighbour ---- */
{
  const { win, map } = makeWindow({ 'someOtherProject.token': 'secret-value' });
  const hostile = JSON.stringify({
    app: 'nutanix-study-tool', format: 1,
    data: {
      'nst.prefs': '{}',
      'someOtherProject.token': 'OVERWRITTEN',
      '../../etc/passwd': 'nope',
      'wwtbane.save.v1': '{"coins":1}',
    },
  });
  const chk = win.NSTBackup.inspect(hostile);
  ok('inspect keeps only owned keys', chk.ok && Object.keys(chk.data).length === 2, Object.keys(chk.data || {}).join(','));
  ok('inspect counts what it rejected', chk.rejected === 2, String(chk.rejected));
  const res = win.NSTBackup.restore(hostile, { mode: 'merge' });
  ok('restore leaves a neighbouring project untouched',
    res.ok && map.get('someOtherProject.token') === 'secret-value', map.get('someOtherProject.token'));
  ok('restore did not create the unowned key', !map.has('../../etc/passwd'));
}

/* ---- prototype pollution ---- */
{
  const { win } = makeWindow({});
  const nasty = '{"app":"nutanix-study-tool","format":1,"__proto__":{"polluted":"yes"},"data":{"nst.prefs":"{}"}}';
  const chk = win.NSTBackup.inspect(nasty);
  ok('inspect accepts the file but strips __proto__', chk.ok);
  ok('Object.prototype was not polluted', ({}).polluted === undefined);
}

/* ---- rejection paths ---- */
{
  const { win } = makeWindow({});
  ok('rejects non-JSON', !win.NSTBackup.inspect('not json{').ok);
  ok('rejects an array', !win.NSTBackup.inspect('[1,2,3]').ok);
  ok('rejects a foreign app', !win.NSTBackup.inspect('{"app":"something-else","format":1,"data":{}}').ok);
  ok('rejects a future format', !win.NSTBackup.inspect('{"app":"nutanix-study-tool","format":99,"data":{}}').ok);
  ok('rejects an envelope with no owned data',
    !win.NSTBackup.inspect('{"app":"nutanix-study-tool","format":1,"data":{"nope":"x"}}').ok);
  ok('rejects non-string values',
    !win.NSTBackup.inspect('{"app":"nutanix-study-tool","format":1,"data":{"nst.prefs":{"a":1}}}').ok);
}

/* ---- replace vs merge ---- */
{
  const good = JSON.stringify({ app: 'nutanix-study-tool', format: 1, data: { 'nst.prefs': '{"new":true}' } });

  const rep = makeWindow({ 'nst.prefs': '{"old":true}', 'starnix:profile': '{"xp":1}' });
  rep.win.NSTBackup.restore(good, { mode: 'replace' });
  ok('replace clears NST keys not present in the backup', !rep.map.has('starnix:profile'));
  ok('replace writes the backup values', rep.map.get('nst.prefs') === '{"new":true}');

  const mer = makeWindow({ 'nst.prefs': '{"old":true}', 'starnix:profile': '{"xp":1}' });
  mer.win.NSTBackup.restore(good, { mode: 'merge' });
  ok('merge keeps NST keys not present in the backup', mer.map.get('starnix:profile') === '{"xp":1}');
  // True for a key with no merge strategy -- a preference IS last-writer-wins.
  // NOT a general rule: the keys holding mastery and exam history are combined
  // value-by-value instead. See the merge section further down.
  ok('a key with no merge strategy is taken from the backup', mer.map.get('nst.prefs') === '{"new":true}');
}

/* ---- a failed write must not destroy what was there ---- */
{
  const seed = { 'nst.prefs': '{"keep":true}', 'starnix:profile': '{"xp":7}' };
  const w = makeWindow(seed, { failWritesFor: (k) => k === 'wwtbane.save.v1' });
  const backup = JSON.stringify({
    app: 'nutanix-study-tool', format: 1,
    data: { 'nst.prefs': '{"new":true}', 'wwtbane.save.v1': '{"boom":true}' },
  });
  const res = w.win.NSTBackup.restore(backup, { mode: 'replace' });
  ok('a quota failure reports rather than pretending', !res.ok && /storage/i.test(res.error), res.error);
  ok('a quota failure rolls the old data back',
    w.map.get('nst.prefs') === '{"keep":true}' && w.map.get('starnix:profile') === '{"xp":7}',
    JSON.stringify([...w.map]));
}

/* ---- filename ---- */
{
  const { win } = makeWindow({});
  ok('filename is dated and .json', /^nst-progress-\d{4}-\d{2}-\d{2}\.json$/.test(win.NSTBackup.filename()), win.NSTBackup.filename());
}

/* ---- merge must actually merge, not overwrite ----
 *
 * This is the bug this section exists for. "merge" used to mean only "do not
 * delete keys the incoming copy lacks": within a key the incoming value won
 * outright. All mastery lives in ONE key, so two devices -- or a restore over
 * existing progress -- silently threw one side's work away.
 */
{
  const { B, M, map } = freshBoth();

  // This browser: two questions answered, one of them recently and wrongly.
  M.record('shared-q', { correct: true, gate: 'always', now: T0 });
  M.record('local-only', { correct: true, gate: 'always', now: T0 });
  M.flush();

  // The other device: the same shared question plus one of its own.
  const other = {
    app: 'nutanix-study-tool', format: 1, data: {
      'nst.mastery.v1': JSON.stringify({
        format: 1,
        records: {
          'shared-q': { id: 'shared-q', box: 5, seen: 9, correct: 8, incorrect: 1, streak: 3, lastSeen: T0 + 60_000, firstCorrectAt: T0 - 1000, lastRun: 4 },
          'remote-only': { id: 'remote-only', box: 2, seen: 3, correct: 2, incorrect: 1, streak: 1, lastSeen: T0, firstCorrectAt: T0, lastRun: -1 },
        },
        updatedAt: T0 + 60_000,
      }),
    },
  };

  const out = B.restore(JSON.stringify(other), { mode: 'merge' });
  ok('a merge restore succeeds', out.ok === true, out.error);

  M.load(true);
  ok('the local-only question survives the merge', !!M.get('local-only'),
    'THIS IS THE BUG: the incoming copy used to overwrite the whole key');
  ok('the other device\'s question arrives', !!M.get('remote-only'));
  ok('the shared question is still there', !!M.get('shared-q'));

  const sh = M.get('shared-q');
  ok('the newer sighting owns the schedule', sh.box === 5 && sh.lastSeen === T0 + 60_000,
    `box ${sh.box}, lastSeen ${sh.lastSeen}`);
  ok('counters take the larger side, never the sum', sh.seen === 9 && sh.correct === 8,
    `seen ${sh.seen}, correct ${sh.correct}`);
  ok('and are not double-counted', sh.seen < 10, sh.seen);
  ok('the earlier first-correct wins', sh.firstCorrectAt === T0 - 1000, sh.firstCorrectAt);
}
{
  // The reverse direction: a LOCAL answer newer than the incoming one must win
  // the schedule, or syncing would undo the answer you just gave.
  const { B, M } = freshBoth();
  M.record('q', { correct: false, gate: 'always', now: T0 + 500_000 });   // just got it wrong
  M.flush();
  const stale = {
    app: 'nutanix-study-tool', format: 1, data: {
      'nst.mastery.v1': JSON.stringify({
        format: 1,
        records: { q: { id: 'q', box: 8, seen: 4, correct: 4, incorrect: 0, streak: 4, lastSeen: T0, firstCorrectAt: T0, lastRun: -1 } },
        updatedAt: T0,
      }),
    },
  };
  B.restore(JSON.stringify(stale), { mode: 'merge' });
  M.load(true);
  const q = M.get('q');
  ok('a stale high box does not overwrite a fresh miss', q.box < 8, `box ${q.box}`);
  ok('and the fresh sighting time is kept', q.lastSeen === T0 + 500_000, q.lastSeen);
  ok('but the older run of correct answers is not lost', q.correct === 4, q.correct);
}
{
  // Exam attempts are the other single key holding everything.
  const { B } = freshBoth();
  const mine = [{ at: 3000, pct: 70, total: 25, correct: 17, pass: false }];
  const theirs = [
    { at: 5000, pct: 92, total: 25, correct: 23, pass: true },
    { at: 3000, pct: 70, total: 25, correct: 17, pass: false },   // the same attempt
  ];
  const KEY = 'nst.practice-exams.history.v1';
  localStorage.setItem(KEY, JSON.stringify(mine));
  B.restore(JSON.stringify({
    app: 'nutanix-study-tool', format: 1, data: { [KEY]: JSON.stringify(theirs) },
  }), { mode: 'merge' });
  const got = JSON.parse(localStorage.getItem(KEY));
  ok('exam attempts are unioned, not replaced', got.length === 2, got.length);
  ok('and the duplicate is not duplicated', got.filter((a) => a.at === 3000).length === 1);
  ok('newest first', got[0].at === 5000, got.map((a) => a.at).join(','));
}
{
  // Replace mode must still mean replace.
  const { B, M } = freshBoth();
  M.record('local-only', { correct: true, gate: 'always', now: T0 });
  M.flush();
  B.restore(JSON.stringify({
    app: 'nutanix-study-tool', format: 1, data: {
      'nst.mastery.v1': JSON.stringify({ format: 1, records: { incoming: { id: 'incoming', box: 1, seen: 1, correct: 1, incorrect: 0, streak: 1, lastSeen: T0, firstCorrectAt: T0, lastRun: -1 } }, updatedAt: T0 }),
    },
  }), { mode: 'replace' });
  M.load(true);
  ok('replace still replaces', !M.get('local-only') && !!M.get('incoming'));
}
{
  // The in-memory cache must not put the old records back.
  //
  // NSTMastery parses the store once and writes it back on its next save. If a
  // restore changes localStorage underneath that cache, a later debounced save
  // rewrites the OLD records over the merged ones -- losing exactly what the
  // merge just rescued, and only sometimes, depending on timing.
  const { B, M } = freshBoth();
  M.record('local-only', { correct: true, gate: 'always', now: T0 });
  M.flush();
  M.get('local-only');                      // prime the cache

  B.restore(JSON.stringify({
    app: 'nutanix-study-tool', format: 1, data: {
      'nst.mastery.v1': JSON.stringify({
        format: 1,
        records: { incoming: { id: 'incoming', box: 3, seen: 2, correct: 2, incorrect: 0, streak: 2, lastSeen: T0, firstCorrectAt: T0, lastRun: -1 } },
        updatedAt: T0,
      }),
    },
  }), { mode: 'merge' });

  // No explicit reload here: the restore is responsible for invalidating it.
  ok('the store sees the merged data without being told to reload',
    !!M.get('incoming') && !!M.get('local-only'),
    `incoming ${!!M.get('incoming')}, local ${!!M.get('local-only')}`);

  // And a save from the cache must now write the merged set, not the old one.
  M.record('third', { correct: true, gate: 'always', now: T0 + 1000 });
  M.flush();
  const written = JSON.parse(localStorage.getItem('nst.mastery.v1')).records;
  ok('and a later save does not resurrect the pre-restore records',
    !!written.incoming && !!written['local-only'] && !!written.third,
    Object.keys(written).join(','));
}
{
  // Keys with no merge strategy are last-writer-wins, which is what a preference means.
  const { B } = freshBoth();
  localStorage.setItem('nst.prefs.v1', JSON.stringify({ theme: 'old' }));
  B.restore(JSON.stringify({
    app: 'nutanix-study-tool', format: 1,
    data: { 'nst.prefs.v1': JSON.stringify({ theme: 'new' }) },
  }), { mode: 'merge' });
  ok('a preference is simply taken from the incoming copy',
    JSON.parse(localStorage.getItem('nst.prefs.v1')).theme === 'new');
}

console.log('\n' + (fail ? `BACKUP: ${fail} FAILED of ${pass + fail}` : `BACKUP: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
