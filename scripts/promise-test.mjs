/* promise-test.mjs — "however you play, answers feed the same mastery tracker".
 *
 * That sentence is the README's headline claim and the reason this project is
 * one app rather than three. It is also the single most fragile thing in it: the
 * claim spans three independently-built codebases that reach the shared store
 * three different ways, and ANY of them could stop and every other suite would
 * still pass.
 *
 *   Practice Exams  engine.recordMastery -> NSTMastery.record(gate "due", step 1)
 *   StarNix         core.mastery.record  -> the same, through an IIFE whose
 *                                           parameter is named `global`
 *   WWTBANE         core/mastery.record  -> only when state.shared is true, which
 *                                           emptyMastery() sets solely if the
 *                                           shared module was found at that moment
 *
 * Each of those is a thread that can be cut without a stack trace. WWTBANE's is
 * the thinnest: a falsy `shared` flag silently returns it to keeping its own
 * private records, and the game plays exactly the same.
 *
 * The policies differ on purpose and are checked as well as the plumbing --
 * sharing the evidence is not supposed to flatten how each tool feels:
 *
 *   StarNix / Practice Exams   gate "due",    step 1
 *   WWTBANE                    gate "always", step 2, unaided answers only
 *
 * Needs a browser and a static server on :8124. Run:
 *   node scripts/promise-test.mjs
 */
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const B = process.env.NST_BASE || 'http://localhost:8124';

let pass = 0, fail = 0;
const ok = (n, c, x) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); }
};

const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext();       // ONE context: one browser, one store

async function open(path, settleMs) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(B + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(settleMs);
  return { page, errs };
}

/* Start from an empty store so every record below is attributable. */
{
  const { page } = await open('/index.html', 300);
  await page.evaluate(() => {
    localStorage.removeItem('nst.mastery.v1');
    localStorage.setItem('nst.activeBank', 'ncp-mci');
  });
  await page.close();
}

/* ---- Practice Exams ---- */
{
  const { page, errs } = await open('/practice-exams/index.html', 800);
  const r = await page.evaluate(() => {
    const E = window.PE.engine, M = window.NSTMastery;
    const q = E.buildPractice()[0];
    E.recordMastery(q, true);
    M.flush();
    const disk = JSON.parse(localStorage.getItem('nst.mastery.v1') || '{"records":{}}');
    return { id: q.id, onDisk: !!disk.records[q.id], box: disk.records[q.id] && disk.records[q.id].box };
  });
  ok('Practice Exams writes to the shared store', r.onDisk, r.id);
  ok('and moves the box by one, its policy', r.box === 1, r.box);
  ok('no page errors', errs.length === 0, errs[0]);
  await page.close();
}

/* ---- StarNix: a different page, the same store ---- */
{
  const { page, errs } = await open('/starnix/index.html', 4000);
  const r = await page.evaluate(() => {
    const c = window.StarNix && window.StarNix.core, M = window.NSTMastery;
    if (!c) return { error: 'no core' };
    const before = Object.keys(M.all()).length;
    // The live view must BE the shared records, not a copy -- every existing
    // reader (achievements, readiness, the heatmap) goes through it.
    const isLiveView = c.profile.mastery === M.all();
    c.mastery.record('ncp25-q01', true, {});
    M.flush();
    const disk = JSON.parse(localStorage.getItem('nst.mastery.v1') || '{"records":{}}');
    return {
      isLiveView, before,
      carriedOver: before > 0,
      onDisk: !!disk.records['ncp25-q01'],
      box: disk.records['ncp25-q01'] && disk.records['ncp25-q01'].box,
      total: Object.keys(M.all()).length,
    };
  });
  ok('StarNix finds the shared store at all', !r.error, r.error);
  ok('it can see what Practice Exams recorded, on a different page', r.carriedOver, r.before);
  ok('its profile is a live view of the shared records, not a copy', r.isLiveView);
  ok('StarNix writes to the shared store', r.onDisk);
  ok('and moves the box by one, its policy', r.box === 1, r.box);
  ok('both tools’ answers are now in one store', r.total >= 2, r.total);
  ok('no page errors', errs.length === 0, errs[0]);
  await page.close();
}

/* ---- WWTBANE: a third codebase, the same store ---- */
{
  const { page, errs } = await open('/wwtbane/index.html', 3500);
  const r = await page.evaluate(async () => {
    const M = await import('./src/core/mastery.js');
    const S = window.NSTMastery;
    const before = Object.keys(S.all()).length;
    // THE thread: emptyMastery() only sets shared:true when it found the module.
    const state = M.emptyMastery();
    const out = { before, saysShared: state.shared === true, sees: Object.keys(state.records).length };
    /* Presence alone would not prove WWTBANE put it there: emptyMastery hands
     * back a LIVE reference to shared.all(), so even the local fallback branch
     * mutates the same object. Assert provenance instead -- a record that did
     * not exist before, and a box only WWTBANE's step of 2 produces. */
    out.absentBefore = S.get('ncp25-q02') === null;
    M.record(state, 'ncp25-q02', { correct: true, assisted: false, runIndex: 1, authoredDifficulty: 'medium' });
    S.flush();
    const disk = JSON.parse(localStorage.getItem('nst.mastery.v1') || '{"records":{}}');
    out.onDisk = !!disk.records['ncp25-q02'];
    out.box = disk.records['ncp25-q02'] && disk.records['ncp25-q02'].box;
    out.storeGrew = Object.keys(S.all()).length === before + 1;
    // It went through the SHARED engine, which stamps fields the local fallback
    // has no idea about. A private record would have none of them.
    const rec = disk.records['ncp25-q02'] || {};
    out.sharedEngineShape = typeof rec.streak === 'number' && typeof rec.incorrect === 'number'
      && typeof rec.firstCorrectAt === 'number';
    /* An ASSISTED answer must count as exposure but must not move the box.
     * Guarded: if the integration is broken there is no shared record to read,
     * and reaching into null would end the run with a stack trace instead of
     * naming which checks failed -- hiding every check after this one. */
    const at = () => S.get('ncp25-q02') || null;
    const boxBefore = at() ? at().box : null;
    M.record(state, 'ncp25-q02', { correct: true, assisted: true, runIndex: 2, authoredDifficulty: 'medium' });
    S.flush();
    out.assistedMovedBox = at() ? at().box !== boxBefore : true;   // no record at all is a failure too
    out.assistedCounted = !!at() && at().seen >= 2;
    out.total = Object.keys(S.all()).length;
    return out;
  });
  ok('WWTBANE marks its state as shared -- the thread that can silently snap', r.saysShared, r.saysShared);
  ok('it sees the other tools’ records', r.sees >= 2, r.sees);
  ok('the question was not already in the store', r.absentBefore);
  ok('WWTBANE writes to the shared store', r.onDisk);
  ok('and the store grew by exactly that one record', r.storeGrew, `${r.before} -> ${r.total}`);
  ok('the record carries the shared engine’s own fields, not a private shape',
    r.sharedEngineShape);
  ok('and moves the box by TWO from its seed, keeping its own ladder',
    r.box === 6, `box ${r.box} (medium seeds at 4, step 2)`);
  ok('an assisted answer still counts as exposure', r.assistedCounted);
  ok('but does not move the box -- WWTBANE’s unaided rule survives sharing',
    !r.assistedMovedBox);
  ok('all three tools’ answers are in one store', r.total >= 3, r.total);
  ok('no page errors', errs.length === 0, errs[0]);
  await page.close();
}

/* ---- and the launcher rolls all three up ---- */
{
  const { page, errs } = await open('/index.html', 1200);
  const r = await page.evaluate(() => {
    const M = window.NSTMastery;
    const ids = Object.keys(M.all());
    const dash = document.getElementById('nst-dash');
    const seen = [...document.querySelectorAll('.nst-dash-stat')]
      .map((s) => s.textContent.replace(/\s+/g, ' ')).join(' | ');
    return { ids: ids.length, dashShown: dash && !dash.hidden, seen };
  });
  ok('the launcher sees every tool’s work in one place', r.ids >= 3, r.ids);
  ok('and shows the panel rather than hiding it', r.dashShown);
  ok('the rollup counts them', /Seen/.test(r.seen), r.seen);
  ok('no page errors', errs.length === 0, errs[0]);
  await page.close();
}

await browser.close();
console.log('\n' + (fail ? `PROMISE: ${fail} FAILED (${pass} passed)` : `PROMISE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
