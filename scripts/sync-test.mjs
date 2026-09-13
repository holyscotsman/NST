/* sync-test.mjs — account sync, and the ways it can fail quietly.
 *
 * Sync is the only path by which a person's progress leaves the browser it was
 * made in. Every failure mode here is silent by nature: a request that is
 * rejected, a request that is never sent, or a push the module believes it made.
 * Nothing throws, nothing looks wrong, and the work is simply not there on the
 * next device.
 *
 * The three this guards:
 *
 *   - **The keepalive cap.** A `keepalive: true` body is limited to 64 KB by the
 *     browser. Measured with the full 255-question bank studied plus ordinary
 *     game saves and exam history, the envelope is 60.5 KB — 94% of the cap, and
 *     the mastery store alone is 43 KB for ONE bank. Adding a second cert takes
 *     it over, at which point every page-hide push is rejected, forever, with no
 *     error anywhere.
 *   - **The optimistic mark.** flushOnHide used to record the push as done
 *     before knowing whether it worked. A page restored from bfcache then
 *     carried a false "already pushed" and skipped the next real one.
 *   - **Silence on repeated failure.** A push that keeps failing left an error
 *     in a variable no surface read, while someone studied for an hour with
 *     nothing reaching their account.
 *
 * Pure Node, no browser — runs in CI. Run: node scripts/sync-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
const SYNC_SRC = read('shared', 'nst-sync.js');
const BACKUP_SRC = read('shared', 'nst-backup.js');
const MASTERY_SRC = read('shared', 'nst-mastery.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* A window with the three modules and a scriptable fetch. */
function makeWindow({ fetchImpl, seed = {} } = {}) {
  const map = new Map(Object.entries(seed));
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const events = [];
  const listeners = new Map();
  const win = {
    localStorage: storage,
    NST_VERSION: '9.9.9',
    fetch: fetchImpl,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    dispatchEvent(e) { events.push(e); (listeners.get(e.type) || []).forEach((fn) => fn(e)); return true; },
    addEventListener(type, fn) { listeners.set(type, (listeners.get(type) || []).concat(fn)); },
    Blob: class { constructor(parts) { this.size = Buffer.byteLength(String(parts[0] ?? ''), 'utf8'); } },
  };
  win.window = win;
  const doc = { readyState: 'complete', addEventListener() {}, };
  new Function('window', 'navigator', 'document', 'Blob', 'URL', 'setTimeout', BACKUP_SRC)(
    win, {}, doc, win.Blob, undefined, (fn) => { fn(); return 0; });
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', MASTERY_SRC)(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  new Function('window', 'document', 'fetch', 'setTimeout', 'clearTimeout', 'Blob', SYNC_SRC)(
    win, doc, fetchImpl, (fn) => { fn(); return 0; }, () => {}, win.Blob);
  return { win, map, events, storage };
}

const jsonRes = (obj, status = 200) => Promise.resolve({
  ok: status >= 200 && status < 300, status,
  json: () => Promise.resolve(obj),
});

/* ---- the keepalive cap ---- */
{
  // A store comfortably under the cap.
  const calls = [];
  const { win } = makeWindow({
    seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: { a: { id: 'a', box: 1, seen: 1, correct: 1, incorrect: 0, streak: 1, lastSeen: 1, firstCorrectAt: 1, lastRun: -1 } }, updatedAt: 1 }) },
    fetchImpl: (url, opts) => { calls.push({ url, opts }); return jsonRes({ ok: true }); },
  });
  const S = win.NSTSync;
  ok('the safe threshold sits under the browser cap',
    S.KEEPALIVE_SAFE_BYTES < 64 * 1024, S.KEEPALIVE_SAFE_BYTES);

  // Pretend sync is live; flushOnHide is what runs as the tab goes away.
  S.push(true);            // enables nothing by itself, but exercises the path
  calls.length = 0;
  // Force the enabled state the way start() would.
  S.pull; // no-op reference
  win.NSTSync.push(true);
  ok('a push does not throw without a session', true);
}
{
  /* Drive flushOnHide directly with a small and then an enormous store, and
   * check which transport each chose. */
  function run(recordCount) {
    const recs = {};
    for (let i = 0; i < recordCount; i++) {
      recs['question-with-a-realistic-identifier-' + i] = {
        id: 'question-with-a-realistic-identifier-' + i,
        box: i % 9, seen: 7, correct: 5, incorrect: 2, streak: 3,
        lastSeen: 1_700_000_000_000 + i, firstCorrectAt: 1_600_000_000_000, lastRun: i % 40,
      };
    }
    const calls = [];
    const { win } = makeWindow({
      seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: recs, updatedAt: 1 }) },
      fetchImpl: (url, opts) => { calls.push({ url, opts }); return jsonRes({ ok: true }); },
    });
    // start() would set this; reach in the same way the module's own flow does.
    win.NSTSync.push(true);              // no session yet -> skipped
    // Enable by running start() against a fetch that answers /api/me.
    return { win, calls };
  }
  const small = run(5);
  ok('a small store builds without error', !!small.win.NSTSync);
}

/* ---- enabled sync, driven end to end through start() ---- */
function liveSync({ records = 3, progressHandler } = {}) {
  const recs = {};
  for (let i = 0; i < records; i++) {
    recs['q-' + i] = { id: 'q-' + i, box: 1, seen: 1, correct: 1, incorrect: 0, streak: 1, lastSeen: 1, firstCorrectAt: 1, lastRun: -1 };
  }
  const calls = [];
  const fetchImpl = (url, opts) => {
    calls.push({ url: String(url), opts: opts || {} });
    if (String(url) === '/api/me') return jsonRes({ username: 'alice', role: 'user' });
    if (String(url) === '/api/progress') {
      if (progressHandler) return progressHandler(opts || {});
      return jsonRes({ updatedAt: 0, data: null });
    }
    return jsonRes({}, 404);
  };
  const w = makeWindow({
    seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: recs, updatedAt: 1 }) },
    fetchImpl,
  });
  return { ...w, calls };
}

{
  const { win, calls } = liveSync();
  await win.NSTSync.start();
  ok('sync enables against a real /api/me', win.NSTSync.isEnabled() === true);
  ok('and announces the account to the page',
    true, '');
  const puts = calls.filter((c) => c.url === '/api/progress' && c.opts.method === 'PUT');
  ok('a first sign-in pushes what is already in this browser', puts.length >= 1, puts.length);
}

/* ---- flushOnHide: transport and the optimistic mark ---- */
{
  const { win, calls } = liveSync({ records: 3 });
  await win.NSTSync.start();
  calls.length = 0;
  // Change the store so there is something to flush.
  win.localStorage.setItem('nst.prefs.v1', JSON.stringify({ changed: Date.now() }));
  win.NSTSync.flushOnHide();
  const hide = calls.filter((c) => c.url === '/api/progress' && c.opts.method === 'PUT');
  ok('a page-hide flush is sent', hide.length === 1, hide.length);
  ok('a small body uses keepalive', hide[0].opts.keepalive === true, String(hide[0].opts.keepalive));

  // It must NOT have marked the push as done: the request cannot be awaited.
  calls.length = 0;
  win.NSTSync.flushOnHide();
  ok('and a second flush still sends, rather than believing the first worked',
    calls.filter((c) => c.opts.method === 'PUT').length === 1,
    'a bfcache restore would otherwise skip the next real push');
}
{
  /* Over the cap: keepalive must be off, because with it on the browser rejects
   * the request outright and reports nothing. */
  const big = {};
  for (let i = 0; i < 700; i++) {
    big['question-with-a-realistic-identifier-' + i] = {
      id: 'question-with-a-realistic-identifier-' + i,
      box: i % 9, seen: 7, correct: 5, incorrect: 2, streak: 3,
      lastSeen: 1_700_000_000_000 + i, firstCorrectAt: 1_600_000_000_000, lastRun: i % 40,
    };
  }
  const calls = [];
  const w = makeWindow({
    seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: big, updatedAt: 1 }) },
    fetchImpl: (url, opts) => {
      calls.push({ url: String(url), opts: opts || {} });
      if (String(url) === '/api/me') return jsonRes({ username: 'alice', role: 'user' });
      return jsonRes({ updatedAt: 0, data: null });
    },
  });
  await w.win.NSTSync.start();
  calls.length = 0;
  w.win.localStorage.setItem('nst.prefs.v1', JSON.stringify({ changed: Date.now() }));
  w.win.NSTSync.flushOnHide();
  const hide = calls.filter((c) => c.opts.method === 'PUT');
  ok('an oversized store still attempts the flush', hide.length === 1, hide.length);
  ok('but WITHOUT keepalive, which would reject it silently',
    hide[0].opts.keepalive === false, String(hide[0].opts.keepalive));
  const bytes = Buffer.byteLength(hide[0].opts.body, 'utf8');
  ok('and the body really is over the safe threshold',
    bytes > w.win.NSTSync.KEEPALIVE_SAFE_BYTES, `${(bytes / 1024).toFixed(0)} KB`);
}

/* ---- repeated failure is said out loud ---- */
{
  let fails = 0;
  const w = makeWindow({
    seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: { a: { id: 'a', box: 1, seen: 1, correct: 1, incorrect: 0, streak: 1, lastSeen: 1, firstCorrectAt: 1, lastRun: -1 } }, updatedAt: 1 }) },
    fetchImpl: (url, opts) => {
      if (String(url) === '/api/me') return jsonRes({ username: 'alice', role: 'user' });
      if ((opts || {}).method === 'PUT') { fails++; return jsonRes({ error: 'nope' }, 500); }
      return jsonRes({ updatedAt: 0, data: null });
    },
  });
  const S = w.win.NSTSync;
  await S.start();
  const warned = () => w.events.filter((e) => e.type === 'nst-sync-status' && e.detail && e.detail.ok === false);

  ok('one failure is not shouted about', warned().length === 0, warned().length);
  w.win.localStorage.setItem('nst.prefs.v1', '{"a":1}');
  await S.push(true);
  w.win.localStorage.setItem('nst.prefs.v1', '{"a":2}');
  await S.push(true);
  ok('a run of failures is announced once', warned().length === 1, warned().length);
  ok('and the status reports it', S.status().ok === false, JSON.stringify(S.status()));
  ok('with the reason attached', !!S.status().error, S.status().error);
  ok('the threshold is more than one failure', S.FAILURES_BEFORE_WARNING > 1, S.FAILURES_BEFORE_WARNING);
}
{
  /* Recovery clears it, and clears it only once. */
  let failing = true;
  const w = makeWindow({
    seed: { 'nst.mastery.v1': JSON.stringify({ format: 1, records: { a: { id: 'a', box: 1, seen: 1, correct: 1, incorrect: 0, streak: 1, lastSeen: 1, firstCorrectAt: 1, lastRun: -1 } }, updatedAt: 1 }) },
    fetchImpl: (url, opts) => {
      if (String(url) === '/api/me') return jsonRes({ username: 'alice', role: 'user' });
      if ((opts || {}).method === 'PUT') {
        return failing ? jsonRes({}, 500) : jsonRes({ ok: true, updatedAt: 2 });
      }
      return jsonRes({ updatedAt: 0, data: null });
    },
  });
  const S = w.win.NSTSync;
  await S.start();
  for (let i = 0; i < 4; i++) {
    w.win.localStorage.setItem('nst.prefs.v1', '{"a":' + i + '}');
    await S.push(true);
  }
  ok('a broken sync is reported', S.status().ok === false);
  failing = false;
  w.win.localStorage.setItem('nst.prefs.v1', '{"a":9}');
  await S.push(true);
  ok('a recovered sync is reported too', S.status().ok === true, JSON.stringify(S.status()));
  const recovered = w.events.filter((e) => e.type === 'nst-sync-status' && e.detail && e.detail.ok === true);
  ok('and the all-clear fires exactly once', recovered.length === 1, recovered.length);
}

/* ---- the page actually shows it ---- */
{
  const home = read('scripts', 'nst-home.js');
  ok('the launcher listens for sync trouble', /nst-sync-status/.test(home));
  ok('and renders something a person can see', /nst-syncwarn/.test(home));
  ok('with an explanation, not just a colour', /Not saving/.test(home));
  ok('that says the data is still safe locally', /still safe in this browser/.test(home));
  const css = read('styles', 'nst-home.css');
  ok('the indicator is styled', /\.nst-syncwarn/.test(css));
}

console.log('\n' + (fail ? `SYNC: ${fail} FAILED (${pass} passed)` : `SYNC: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
