/* storage-growth-test.mjs — the study record has to stay small forever.
 *
 * WHY THIS EXISTS
 * This is a tool somebody uses every day for months before an exam, in a browser,
 * where the whole study record lives in localStorage — a quota of a few megabytes
 * that the app cannot raise and, when it runs out, cannot write to. v2.41.0 added
 * the banner that says so ("your answers are not being saved"). Nothing checks the
 * thing that would make that banner appear.
 *
 * The record is bounded by DESIGN: NSTMastery keeps one row per question and
 * updates it, and Practice Exams caps its attempt history at fifty summaries. So
 * the number to watch is not how big it is but whether it GROWS — one row per
 * question is fine forever; one row per answer is a few weeks of study before a
 * daily user hits a wall the app can only apologise for.
 *
 * WHAT THIS CHECKS
 * A year of study against the real bank, driven through the real NSTMastery:
 * 365 days x 40 answers = 14,600 answers, on a clock that advances a day at a
 * time so the scheduler behaves as it would in life. Then:
 *
 *   - the store plateaus — day 365 is no bigger than day 180
 *   - it stays within a cap chosen far below any browser quota
 *   - and it is proportional to the BANK, not to the answers
 *
 * Measured at the time of writing: 8.8 KB after 14,600 answers, flat from day 180.
 *
 * The negative control is a store that appends a row per answer instead of
 * updating one per question — the mistake this exists to catch — and it has to
 * fail every one of those three.
 *
 * Pure Node, no browser. Run: node scripts/storage-growth-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* The real mastery store in a shimmed window, same idiom as review-test.mjs. */
function freshStore() {
  const map = new Map();
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage };
  win.window = win;
  new Function('window', 'setTimeout', 'clearTimeout', 'Date',
    readFileSync(join(ROOT, 'shared/nst-mastery.js'), 'utf8'))(win, (fn) => { fn(); return 0; }, () => {}, Date);
  return { M: win.NSTMastery, map };
}
const bytesOf = (map) => { let n = 0; for (const [k, v] of map) n += Buffer.byteLength(k + v, 'utf8'); return n; };

const { loadRealBank } = await import(join(ROOT, 'starnix/real-bank.mjs'));
const ids = loadRealBank().questions.map((q) => q.id);
ok('the real bank loaded, so this measures the shipped question count', ids.length > 100, ids.length);

const DAY = 86400000, T0 = Date.UTC(2026, 0, 1);
const ANSWERS_PER_DAY = 40, DAYS = 365;

/* A year of daily study, recorded through the real store. */
function studyYear(record) {
  let answers = 0;
  const at = {};
  for (let day = 1; day <= DAYS; day++) {
    const now = T0 + day * DAY;
    for (let i = 0; i < ANSWERS_PER_DAY; i++) {
      record(ids[(answers * 7 + i * 13) % ids.length], (answers + i) % 10 < 7, now);
      answers++;
    }
    if (day === 1 || day === 30 || day === 180 || day === DAYS) at[day] = true;
  }
  return answers;
}

{
  const { M, map } = freshStore();
  const marks = {};
  let answers = 0;
  for (let day = 1; day <= DAYS; day++) {
    const now = T0 + day * DAY;
    for (let i = 0; i < ANSWERS_PER_DAY; i++) {
      M.record(ids[(answers * 7 + i * 13) % ids.length], { correct: (answers + i) % 10 < 7, gate: 'always', now });
      answers++;
    }
    if ([1, 30, 180, DAYS].includes(day)) marks[day] = bytesOf(map);
  }
  console.log('     . ' + answers + ' answers over ' + DAYS + ' simulated days against ' + ids.length +
    ' questions -- day 1: ' + (marks[1] / 1024).toFixed(1) + ' KB, day 30: ' + (marks[30] / 1024).toFixed(1) +
    ' KB, day 180: ' + (marks[180] / 1024).toFixed(1) + ' KB, day 365: ' + (marks[DAYS] / 1024).toFixed(1) + ' KB');

  ok('a year of daily study is recorded (14k+ answers)', answers >= 14000, answers);
  /* The plateau. Not "small" -- FLAT: whatever the bank's size, the back half of the
   * year must add nothing, because the rows were all created in the front half. */
  ok('the store has plateaued by the half-year mark (day 365 is no bigger than day 180)',
    marks[DAYS] <= marks[180], marks[180] + ' -> ' + marks[DAYS] + ' bytes');
  /* A cap far below any browser quota, so this fails long before a user would notice. */
  ok('and the whole year fits in 64 KB', marks[DAYS] < 64 * 1024, (marks[DAYS] / 1024).toFixed(1) + ' KB');
  /* Proportional to the bank: ~one row per question, not one per answer. */
  ok('the record is proportional to the BANK, not the answers (under 400 bytes per question)',
    marks[DAYS] / ids.length < 400, Math.round(marks[DAYS] / ids.length) + ' bytes per question');
  ok('one key holds it all, and it is the documented one',
    map.size === 1 && map.has('nst.mastery.v1'), [...map.keys()].join(', '));
}

/* ---- the negative control: a store that grows per ANSWER ---- */
{
  const log = [];
  const fakeMap = new Map();
  const record = (id, correct, now) => {
    log.push({ id, correct, now });                 // the mistake: append, never update
    fakeMap.set('nst.mastery.v1', JSON.stringify(log));
  };
  const answers = studyYear(record);
  const total = bytesOf(fakeMap);
  console.log('     . negative control (a row per answer): ' + answers + ' answers -> ' + (total / 1024).toFixed(1) + ' KB');
  ok('[neg] a per-answer store does NOT fit in 64 KB', !(total < 64 * 1024), (total / 1024).toFixed(1) + ' KB');
  ok('[neg] and is not proportional to the bank', !(total / ids.length < 400),
    Math.round(total / ids.length) + ' bytes per question');
  /* And the plateau check catches it too: measure the same growth at both marks. */
  const half = [];
  const halfMap = new Map();
  for (let i = 0; i < answers / 2; i++) { half.push(i); halfMap.set('k', JSON.stringify(half)); }
  ok('[neg] a per-answer store has not plateaued at the half-year mark',
    !(total <= bytesOf(halfMap)), bytesOf(halfMap) + ' -> ' + total + ' bytes');
}

/* ---- the OTHER store: the bank cache in sessionStorage ----
 *
 * Everything above is about localStorage, which is bounded by design. The bank
 * cache was not bounded at all. It had a five-minute TTL that was checked on
 * READ and enforced nowhere: a stale entry was found stale, ignored, and left
 * in place, and nothing in the app ever removed one. The store therefore grew
 * by one whole bank per bank opened, for the life of the tab.
 *
 * Measured: a bank is 380 KB stored, which a browser holds as UTF-16 -- 760 KB
 * each. Chromium fits 13 before setItem throws; a 5 MB quota fits 6. The
 * roadmap is eight certifications and NCP-MCI already ships two banks.
 *
 * The failure at the wall is the reason this is a bug rather than untidiness.
 * setItem throws, the throw was swallowed, and nothing was evicted -- so the
 * cache keeps whichever banks were opened FIRST and the bank being studied now
 * is the one that never gets cached. Measured in a browser before the fix:
 * with the store full, writing the active bank threw and it read back absent.
 * The feature then did the opposite of its stated purpose, silently, and only
 * for the people who had been using it longest. */
{
  /* A sessionStorage with a real quota, so "full" means what it means in a
   * browser rather than whatever the test decides to assert. */
  function quotaStore(maxChars) {
    const map = new Map();
    const used = () => { let n = 0; for (const [k, v] of map) n += k.length + v.length; return n; };
    return {
      get length() { return map.size; },
      key: (i) => Array.from(map.keys())[i] ?? null,
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      removeItem: (k) => { map.delete(k); },
      clear: () => map.clear(),
      setItem: (k, v) => {
        const prev = map.has(k) ? k.length + map.get(k).length : 0;
        if (used() - prev + k.length + String(v).length > maxChars) {
          const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e;
        }
        map.set(k, String(v));
      },
    };
  }

  function loader(store) {
    const win = {
      location: { href: 'http://x/' },
      document: {
        currentScript: { src: 'http://x/shared/bank-loader.js' },
        getElementsByTagName: () => [{ src: 'http://x/shared/bank-loader.js' }],
      },
      sessionStorage: store,
      localStorage: quotaStore(1e9),
      NSTSafeParse: (t) => { try { return JSON.parse(t); } catch (e) { return null; } },
    };
    win.window = win;
    new Function('window', 'document', 'sessionStorage', 'localStorage', 'fetch',
      readFileSync(join(ROOT, 'shared', 'bank-loader.js'), 'utf8'))(
      win, win.document, store, win.localStorage, () => Promise.reject(new Error('no network')));
    return win.NSTBank;
  }

  const BANK = 380 * 1024;                       // one bank, as stored
  const body = (ageMs) => JSON.stringify({ t: Date.now() - ageMs, x: 'x'.repeat(BANK) });
  const TTL = 5 * 60 * 1000;

  // Bounded by the TTL the cache already claimed.
  {
    const store = quotaStore(BANK * 40);
    const NB = loader(store);
    for (let i = 0; i < 6; i++) store.setItem('nst.bankcache:old' + i, body(TTL + 60000));
    ok('six stale banks are sitting in the cache', NB._cacheKeys().length === 6);
    NB._cachePut('nst.bankcache:new', body(0));
    ok('writing one sweeps every entry past the TTL', NB._cacheKeys().length === 1,
      NB._cacheKeys().join(','));
    ok('and the entry just written is the one that survived',
      store.getItem('nst.bankcache:new') !== null);
  }

  // A live entry inside the TTL is not swept -- the sweep must be the TTL, not
  // "delete everything", or the cache would never hit.
  {
    const store = quotaStore(BANK * 40);
    const NB = loader(store);
    store.setItem('nst.bankcache:live', body(60 * 1000));
    NB._cachePut('nst.bankcache:new', body(0));
    ok('an entry still inside the TTL survives a write', NB._cacheKeys().length === 2,
      NB._cacheKeys().join(','));
  }

  // The wall: every entry live, no room left. The bank being asked for now must
  // win, because it is the one about to be read.
  {
    const store = quotaStore(BANK * 6 + 4096);
    const NB = loader(store);
    let n = 0;
    try { for (; n < 40; n++) store.setItem('nst.bankcache:live' + n, body(1000 + n)); } catch (e) {}
    ok('the store fills at a realistic number of banks', n >= 5 && n <= 7, n);
    const before = NB._cacheKeys().length;
    const wrote = NB._cachePut('nst.bankcache:active', body(0));
    ok('the active bank is cached even with the store full', wrote === true);
    ok('and it can be read back', store.getItem('nst.bankcache:active') !== null);
    ok('room was made by eviction, not by growing the store',
      NB._cacheKeys().length <= before, `${before} -> ${NB._cacheKeys().length}`);
    ok('the OLDEST entry is the one that went', store.getItem('nst.bankcache:live0') === null);
    ok('a newer one was kept', store.getItem('nst.bankcache:live' + (n - 1)) !== null);
  }

  // [neg] the behaviour this replaced: a bare setItem with the throw swallowed.
  {
    const store = quotaStore(BANK * 6 + 4096);
    let n = 0;
    try { for (; n < 40; n++) store.setItem('nst.bankcache:live' + n, body(1000 + n)); } catch (e) {}
    let cached = true;
    try { store.setItem('nst.bankcache:active', body(0)); } catch (e) { cached = false; }
    ok('[neg] the old write gives up at the wall, leaving the active bank uncached',
      cached === false && store.getItem('nst.bankcache:active') === null);
  }

  // [neg] a cache that evicted everything would pass "the active bank fits" and
  // be useless; the live-entry check above is what rules it out.
  {
    const store = quotaStore(BANK * 40);
    const NB = loader(store);
    store.setItem('nst.bankcache:live', body(60 * 1000));
    NB._cachePut('nst.bankcache:new', body(0));
    ok('[neg] eviction is not "clear the cache"', store.getItem('nst.bankcache:live') !== null);
  }

  // Storage refusing outright must not break loading -- a miss is a refetch.
  {
    const hostile = {
      get length() { throw new Error('denied'); },
      key: () => { throw new Error('denied'); },
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
      removeItem: () => { throw new Error('denied'); },
    };
    const NB = loader(hostile);
    let threw = null;
    try { NB._cachePut('nst.bankcache:x', body(0)); } catch (e) { threw = e.message; }
    ok('a storage that refuses everything does not throw out of the cache', threw === null, threw);
    ok('and reports the write as failed rather than pretending', NB._cachePut('nst.bankcache:x', body(0)) === false);
  }

  // The app must go through cachePut, not setItem, or this is all decorative.
  {
    const src = readFileSync(join(ROOT, 'shared', 'bank-loader.js'), 'utf8');
    const puts = (src.match(/sessionStorage\.setItem/g) || []).length;
    ok('there is exactly one sessionStorage write in the loader', puts === 1, puts);
    ok('and it is inside cachePut', /function cachePut[\s\S]{0,400}sessionStorage\.setItem/.test(src));
    ok('the fetch path caches through it', /cachePut\(SESS_PREFIX \+ url/.test(src));
  }
}

console.log(fail === 0 ? `\nSTORAGE GROWTH: ALL GREEN (${pass} checks)` : `\n${pass} passed, ${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
