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
  ok('merge still overwrites the keys it does carry', mer.map.get('nst.prefs') === '{"new":true}');
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

console.log('\n' + (fail ? `BACKUP: ${fail} FAILED of ${pass + fail}` : `BACKUP: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
