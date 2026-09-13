/* resume-test.mjs — an exam that survives the tab being taken away.
 *
 * Practice Mode has always remembered where you were. Exam Mode -- the long
 * one, the timed one, the one worth ninety minutes -- remembered nothing. A
 * phone reclaiming a backgrounded tab took the whole sitting with it, and the
 * `beforeunload` guard does not help: a discarded tab never fires it.
 *
 * Two things make this correct rather than merely convenient, and both are what
 * this suite is really for:
 *
 *   - **The clock must not stop.** `endTime` is an absolute timestamp, saved as
 *     one. Time away is spent whether the page was open or not, so reloading
 *     buys nothing, and an exam whose time ran out while you were gone comes
 *     back finished rather than fresh.
 *   - **The option order must come back identical.** Exam Mode shuffles each
 *     question's options, so an answer is stored as an index into the SHUFFLED
 *     list. Rebuilding from the bank would reshuffle and every stored index
 *     would then point at a different option -- every answer silently rewritten,
 *     with nothing on screen to show it. The permutation is persisted and
 *     replayed for exactly this reason.
 *
 * And it must refuse rather than guess: a record from another certification, one
 * naming a question the bank no longer has, one whose option count changed under
 * it, or one that will not parse, are all declined. Half an exam is not the exam.
 *
 * Needs a browser and a static server on :8124. Run:
 *   node scripts/resume-test.mjs
 */
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const chromium = await loadChromium();
if (!chromium) missing('playwright', 'npm install --no-save playwright && npx playwright install chromium');
const B = process.env.NST_BASE || 'http://localhost:8124';
const KEY = 'nst.practice-exams.exam.v1';

let pass = 0, fail = 0;
const ok = (n, c, x) => {
  if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); }
};

const browser = await chromium.launch(launchOptions());

/* Start an exam, answer `n` questions, flag one, then hand the page back. */
async function sitting(n = 6) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(B + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((k) => {
    localStorage.setItem('nst.activeBank', 'ncp-mci');
    localStorage.removeItem(k);
  }, KEY);
  await page.goto(B + '/practice-exams/index.html', { waitUntil: 'networkidle' });
  await page.click('.pe-modecard-exam');
  await page.waitForTimeout(600);
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('abcd'[i % 4]);
    if (i === 2) await page.keyboard.press('f');
    await page.keyboard.press('ArrowRight');
  }
  await page.waitForTimeout(250);
  return { ctx, page, errs };
}

/* The interruption: the tab is discarded. No beforeunload, no chance to react. */
async function discardAndReturn(ctx, page) {
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await page.close();
  const back = await ctx.newPage();
  await back.goto(B + '/practice-exams/index.html', { waitUntil: 'networkidle' });
  await back.waitForTimeout(600);
  return back;
}

/* ---- the sitting is written down at all ---- */
{
  const { ctx, page, errs } = await sitting(6);
  const saved = await page.evaluate((k) => {
    const raw = JSON.parse(localStorage.getItem(k) || 'null');
    if (!raw) return null;
    return {
      total: raw.q.length,
      answered: raw.answers.filter((a) => a !== null).length,
      flags: raw.flags.filter(Boolean).length,
      idx: raw.idx,
      hasPerms: raw.q.every((x) => Array.isArray(x.perm) && x.perm.length > 1),
      absoluteEnd: typeof raw.endTime === 'number' && raw.endTime > Date.now(),
      bytes: JSON.stringify(raw).length,
      keys: Object.keys(raw).sort().join(','),
    };
  }, KEY);
  ok('an exam in progress is saved', !!saved);
  ok('every answer so far is in it', saved && saved.answered === 6, saved && saved.answered);
  ok('and the flag', saved && saved.flags === 1, saved && saved.flags);
  ok('and where you were', saved && saved.idx === 6, saved && saved.idx);
  ok('every question carries its option permutation', saved && saved.hasPerms);
  ok('the deadline is stored as an absolute time, not a remaining duration',
    saved && saved.absoluteEnd, saved && saved.keys);
  // Small enough to sit beside everything else, which matters: the sync envelope
  // is capped and the store has to survive a full quota.
  ok('a 75-question sitting costs only a few KB', saved && saved.bytes < 16 * 1024, saved && saved.bytes);
  ok('no page errors while saving', errs.length === 0, errs[0]);
  await ctx.close();
}

/* ---- it comes back, and it is the SAME exam ---- */
{
  const { ctx, page } = await sitting(6);
  const before = await page.evaluate((k) => {
    const raw = JSON.parse(localStorage.getItem(k));
    const E = window.PE.engine;
    return {
      id: raw.q[0].id,
      options: E.applyPerm(E.questionById(raw.q[0].id), raw.q[0].perm).options,
      answer0: raw.answers[0],
      endTime: raw.endTime,
    };
  }, KEY);

  const back = await discardAndReturn(ctx, page);
  const card = await back.evaluate(() => {
    const c = document.querySelector('.pe-modecard-resume');
    return c ? { text: c.innerText.replace(/\s+/g, ' '), discard: !!document.querySelector('.pe-resume-discard') } : null;
  });
  ok('coming back offers the exam, not a blank slate', !!card);
  ok('it says how much time is left', !!card && /\d+:\d\d left/.test(card.text), card && card.text.slice(0, 60));
  ok('it says how much was answered', !!card && /6 of \d+ answered/.test(card.text), card && card.text);
  ok('it says plainly that the clock kept running',
    !!card && /clock kept running/.test(card.text));
  ok('and there is a way to throw it away instead', !!card && card.discard);

  await back.click('.pe-modecard-resume');
  await back.waitForTimeout(700);
  const after = await back.evaluate((b) => {
    const raw = JSON.parse(localStorage.getItem('nst.practice-exams.exam.v1'));
    const E = window.PE.engine;
    const rebuilt = E.applyPerm(E.questionById(b.id), raw.q[0].perm).options;
    return {
      answered: document.querySelectorAll('.pe-pal.answered').length,
      flagged: document.querySelectorAll('.pe-pal.flagged').length,
      sameOptions: JSON.stringify(rebuilt) === JSON.stringify(b.options),
      /* Deep-compare, not ===. A MULTI-answer question stores its answer as an
       * ARRAY of chosen indices, and two arrays are never === after a JSON
       * round-trip. 13% of this bank is multi-answer, so === passed locally and
       * failed in CI the first time the shuffle put one of those first -- an
       * intermittency that looks exactly like a flake and is not one. */
      sameAnswer: JSON.stringify(raw.answers[0]) === JSON.stringify(b.answer0),
      answerWasMulti: Array.isArray(b.answer0),
      endTimeUnchanged: raw.endTime === b.endTime,
      rawAnswer0: raw.answers[0],
    };
  }, before);
  ok('every answer is still there', after.answered === 6, after.answered);
  ok('and the flag', after.flagged === 1, after.flagged);
  ok('the options come back in the SAME order — this is what makes the answers mean what they meant',
    after.sameOptions);
  ok('so the stored answer still points at the option it pointed at', after.sameAnswer,
    `${JSON.stringify(before.answer0)} -> ${JSON.stringify(after.rawAnswer0)}${after.answerWasMulti ? ' (multi-answer)' : ''}`);
  ok('and resuming did not extend the deadline', after.endTimeUnchanged);
  await ctx.close();
}

/* ---- an exam whose time ran out while you were away ---- */
{
  const { ctx, page } = await sitting(4);
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k));
    s.endTime = Date.now() - 60000;
    localStorage.setItem(k, JSON.stringify(s));
  }, KEY);
  const back = await discardAndReturn(ctx, page);
  const card = await back.evaluate(() => {
    const c = document.querySelector('.pe-modecard-resume');
    return c ? c.innerText.replace(/\s+/g, ' ') : null;
  });
  ok('an expired sitting is still offered, not silently dropped', !!card);
  ok('but it is not offered as resumable', !!card && !/Resume your exam/.test(card), card);
  ok('it says the time ran out', !!card && /[Tt]ime ran out/.test(card), card);
  ok('and explains why, rather than looking like a bug',
    !!card && /keeps running whether the page is open/.test(card));

  /* (v2.41.0) And then OPEN it, which nothing did.
   *
   * The card's whole promise is one sentence: "Open it to see how the N you
   * answered scored." Every check above reads the card's words and none of them
   * clicks it, so a resume that threw, hung, or landed on a blank screen would
   * leave all of them green -- the exam would be gone and the offer to see it
   * would be a lie, with a suite reporting ALL GREEN.
   *
   * The path is subtle enough to be worth walking: resuming rebuilds the sitting
   * and starts the timer, startTimer() calls tick() immediately rather than
   * waiting a second, the deadline is already behind, and that first tick
   * auto-submits. Four things in a row, none of them obvious from the card. */
  const before = await back.evaluate(() => {
    const c = document.querySelector('.pe-modecard-resume');
    const m = c && c.innerText.match(/(\d+) of (\d+) answered/);
    return m ? { answered: Number(m[1]), total: Number(m[2]) } : null;
  });
  ok('the card states how many were answered', !!before && before.answered === 4,
    JSON.stringify(before));

  const opened = [];
  back.on('pageerror', (e) => opened.push(e.message));
  await back.click('.pe-modecard-resume');
  await back.waitForTimeout(1200);
  const landed = await back.evaluate(() => {
    const root = document.getElementById('pe-root');
    const text = root ? root.innerText.replace(/\s+/g, ' ') : '';
    return {
      text: text.slice(0, 400),
      hasScore: /%/.test(text),
      stillOnCard: !!document.querySelector('.pe-modecard-resume'),
      empty: text.trim().length < 20,
    };
  });
  ok('opening an expired exam does not throw', opened.length === 0, opened.join(' | '));
  ok('and does not leave you on the card or on a blank screen',
    !landed.stillOnCard && !landed.empty, JSON.stringify(landed));
  ok('it lands on a result with a score', landed.hasScore, landed.text);
  ok('and says the time expired, so the score is not mistaken for a full sitting',
    /[Tt]ime expired/.test(landed.text), landed.text);

  /* The record must be gone afterwards, or the same finished exam is offered
   * again on the next visit -- forever. */
  const after = await back.evaluate((k) => localStorage.getItem(k), KEY);
  ok('and the saved sitting is cleared, so it is not offered again', after === null,
    String(after).slice(0, 60));
  await ctx.close();
}

/* ---- it refuses rather than restoring something wrong ---- */
for (const [label, mutate] of [
  ['a record from another certification', (k) => { const s = JSON.parse(localStorage.getItem(k)); s.bank = 'some-other-cert'; localStorage.setItem(k, JSON.stringify(s)); }],
  ['a question the bank no longer has', (k) => { const s = JSON.parse(localStorage.getItem(k)); s.q[3].id = 'no-such-question-id'; localStorage.setItem(k, JSON.stringify(s)); }],
  ['an option count that changed under it', (k) => { const s = JSON.parse(localStorage.getItem(k)); s.q[2].perm = [0, 1]; localStorage.setItem(k, JSON.stringify(s)); }],
  ['a record that will not parse', (k) => { localStorage.setItem(k, '{not json'); }],
  ['a record with no questions', (k) => { const s = JSON.parse(localStorage.getItem(k)); s.q = []; localStorage.setItem(k, JSON.stringify(s)); }],
]) {
  const { ctx, page } = await sitting(4);
  await page.evaluate(mutate, KEY);
  const back = await discardAndReturn(ctx, page);
  const r = await back.evaluate(() => ({
    offered: !!document.querySelector('.pe-modecard-resume'),
    stillHasExamCard: !!document.querySelector('.pe-modecard-exam'),
    errors: 0,
  }));
  ok(`${label} — is declined, not half-restored`, !r.offered);
  ok(`${label} — and a fresh exam is still on offer`, r.stillHasExamCard);
  await ctx.close();
}

/* ---- the launcher's shallower check must not lead to a dead end ----------
 * The launcher advertises an unfinished exam from a check that cannot be
 * complete: it has no engine, so it cannot know whether the bank still has the
 * questions. Somebody may follow that link here specifically to find their exam.
 * Silently clearing it and showing nothing is the dead end. */
{
  const ctx = await browser.newContext();
  const seed = await ctx.newPage();
  await seed.goto(B + '/index.html', { waitUntil: 'domcontentloaded' });
  // Shape the launcher accepts, content only Practice Exams can reject.
  await seed.evaluate((k) => {
    localStorage.setItem('nst.activeBank', 'ncp-mci');
    localStorage.setItem(k, JSON.stringify({
      bank: 'ncp-mci', endTime: Date.now() + 3600000,
      q: [{ id: 'ncp25-q01', perm: [0, 1, 2, 3] }, { id: 'a-question-since-deleted', perm: [0, 1, 2, 3] }],
      answers: [0, 1], flags: [false, false], idx: 0,
    }));
  }, KEY);
  await seed.goto(B + '/index.html', { waitUntil: 'networkidle' });
  await seed.waitForTimeout(700);
  const advertised = await seed.evaluate(() => {
    const n = document.querySelector('.nst-dash-exam');
    return n ? n.innerText.replace(/\s+/g, ' ') : null;
  });
  ok('the launcher does advertise it (its check cannot see the missing question)', !!advertised, advertised);

  await seed.click('.nst-dash-exam');
  await seed.waitForTimeout(1400);
  const landed = await seed.evaluate(() => {
    const g = document.querySelector('.pe-resume-gone');
    return {
      onPE: /practice-exams/.test(location.pathname),
      explained: g ? g.textContent : null,
      role: g ? g.getAttribute('role') : null,
      cleared: localStorage.getItem('nst.practice-exams.exam.v1') === null,
      examStillOffered: !!document.querySelector('.pe-modecard-exam'),
      noFalseResume: !document.querySelector('.pe-modecard-resume'),
    };
  });
  ok('following the link lands on Practice Exams', landed.onPE);
  ok('and the page says what happened to the exam, rather than nothing at all',
    !!landed.explained, landed.explained);
  ok('it names a cause a person can act on', !!landed.explained && /question bank has changed/.test(landed.explained));
  ok('it is announced, not just drawn', landed.role === 'status', landed.role);
  ok('the unusable record is cleared, not left to advertise itself again', landed.cleared);
  ok('it does not offer a resume it cannot honour', landed.noFalseResume);
  ok('and a fresh exam is still on offer', landed.examStillOffered);
  await ctx.close();
}

/* ---- submitting ends it ---- */
{
  const { ctx, page } = await sitting(3);
  // Submit through the real controls, not by poking storage: the point is that
  // the path a person actually takes clears it.
  const before = await page.evaluate((k) => localStorage.getItem(k) !== null, KEY);
  await page.click('.pe-btn-submit');
  await page.waitForTimeout(300);
  const confirmed = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Submit');
    if (!b) return false;
    b.click();
    return true;
  });
  await page.waitForTimeout(900);
  const gone = {
    before,
    confirmed,
    after: await page.evaluate((k) => localStorage.getItem(k) !== null, KEY),
    onResults: await page.evaluate(() => !!document.querySelector('.pe-results')),
  };
  ok('there was a saved sitting before submitting', gone.before);
  ok('the submit dialog appeared and was confirmed', gone.confirmed);
  ok('and the exam actually graded', gone.onResults);
  ok('and submitting clears it, so a graded exam is never offered back', !gone.after);
  await ctx.close();
}

await browser.close();
console.log('\n' + (fail ? `RESUME: ${fail} FAILED (${pass} passed)` : `RESUME: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
