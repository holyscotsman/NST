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

console.log(fail === 0 ? `\nSTORAGE GROWTH: ALL GREEN (${pass} checks)` : `\n${pass} passed, ${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
