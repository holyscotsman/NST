/* restore-test.mjs — backing up and restoring, through the buttons.
 *
 * WHY THIS NEEDED ITS OWN SUITE
 * `backup-test.mjs` exercises NSTBackup directly and covers its rules well. What
 * nothing covered was the path a person actually takes: Settings, "Restore from
 * file…", a file, and one of two buttons that decide whether their current
 * progress survives. `dialog-test.mjs` says so in its own header -- confirmRestore
 * is only reachable after a file has been chosen, so it reads the source instead.
 *
 * That is a gap on the one client-side action that can destroy a study record.
 * This closes it: back up, study on, restore, and check what is there afterwards,
 * for BOTH modes.
 *
 * WHAT IT CAUGHT ON THE WAY (v2.67.0)
 * The first run of this produced a backup containing `nst.activeBank` and nothing
 * else -- no study data at all -- and Replace then wiped the record it was meant
 * to bring back. The cause was not restore: NSTMastery debounces its writes by
 * 400ms and NSTBackup.collect() reads localStorage, so an envelope built inside
 * that window omits the newest answers. NSTSync already flushed for exactly this
 * reason; backup did not, and was safe only because it lives on the launcher
 * where there is nothing to answer. collect() flushes now.
 *
 * Needs a browser; brings its own static server.
 * Run: node scripts/restore-test.mjs
 */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadChromium, launchOptions, missing } from './browser-env.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

const PORT = Number(process.env.NST_PORT || 8000 + Math.floor(Math.random() * 900));
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const up = await (async () => {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/index.html`); if (r.ok) return true; }
    catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  return false;
})();
if (!up) { server.kill('SIGKILL'); console.log('FAIL static server did not start'); process.exit(1); }

const chromium = await loadChromium();
if (!chromium) {
  missing('playwright', 'npm install --no-save playwright && npx playwright install chromium',
    () => server.kill('SIGKILL'));
}
const browser = await chromium.launch(launchOptions());
const BASE = `http://127.0.0.1:${PORT}`;
const dir = mkdtempSync(join(tmpdir(), 'nst-restore-'));

/* Eight answered questions, a backup of them, then five more and a change to one
 * the backup knows about -- so Merge and Replace have to differ. */
async function sitting() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addInitScript("localStorage.setItem('nst.activeBank','ncp-mci');");
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.NSTMastery && window.NSTBackup, null, { timeout: 15000 });
  await page.evaluate(() => {
    for (let i = 0; i < 8; i++) window.NSTMastery.record('OLD-Q' + i, { correct: true, gate: 'always' });
  });
  return { ctx, page, errs };
}

try {
  /* ---- 1. the backup carries the study record, debounce or not ---------- */
  {
    const { ctx, page, errs } = await sitting();
    // Deliberately NO flush: this is the window that used to empty the file.
    const text = await page.evaluate(() => window.NSTBackup.toJSON());
    const env = JSON.parse(text);
    ok('a backup taken straight after answering contains the study record',
      Object.keys(env.data).includes('nst.mastery.v1'), Object.keys(env.data).join(', '));
    ok('and all eight answers are in it',
      new Set(JSON.stringify(env.data).match(/OLD-Q\d/g) || []).size === 8,
      String(new Set(JSON.stringify(env.data).match(/OLD-Q\d/g) || []).size));
    ok('the envelope says what it is', env.app === 'nutanix-study-tool' && env.format === 1);
    ok('no page errors while building it', errs.length === 0, errs.slice(0, 2).join(' ;; '));
    await ctx.close();
  }

  /* ---- 2. the two modes, through the buttons ---------------------------- */
  for (const mode of ['Merge', 'Replace']) {
    const { ctx, page, errs } = await sitting();
    const file = join(dir, `backup-${mode}.json`);
    writeFileSync(file, await page.evaluate(() => window.NSTBackup.toJSON()));

    // Study on: five the backup has never seen, and one it has, answered again.
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) window.NSTMastery.record('NEW-Q' + i, { correct: true, gate: 'always' });
      window.NSTMastery.record('OLD-Q0', { correct: false, gate: 'always' });
      window.NSTMastery.flush();
    });

    await page.click('#nst-settings-btn');
    await page.waitForTimeout(400);
    await page.setInputFiles('input[type="file"]', file);
    await page.waitForTimeout(700);

    const dialog = await page.evaluate(() => ({
      titles: Array.from(document.querySelectorAll('.nst-modal-title')).map((e) => e.textContent.trim()),
      buttons: Array.from(document.querySelectorAll('.nst-modal-actions button')).map((e) => e.textContent.trim()),
      body: Array.from(document.querySelectorAll('.nst-modal-body-text')).map((e) => e.textContent.trim()).join(' '),
    }));
    ok(`${mode}: choosing a file asks before it does anything`,
      dialog.titles.includes('Restore this backup?'), dialog.titles.join('/'));
    ok(`${mode}: and offers both modes plus a way out`,
      ['Cancel', 'Merge', 'Replace'].every((b) => dialog.buttons.includes(b)), dialog.buttons.join(','));
    ok(`${mode}: the question says which button does what`,
      /Replace swaps/.test(dialog.body) && /Merge keeps/.test(dialog.body), dialog.body.slice(0, 90));

    const clicked = await page.evaluate((m) => {
      const b = Array.from(document.querySelectorAll('.nst-modal-actions button'))
        .find((x) => x.textContent.trim() === m);
      if (!b) return false;
      b.click(); return true;
    }, mode);
    await page.waitForTimeout(700);

    const after = await page.evaluate(() => ({
      olds: [0,1,2,3,4,5,6,7].filter((i) => !!window.NSTMastery.get('OLD-Q' + i)).length,
      news: [0,1,2,3,4].filter((i) => !!window.NSTMastery.get('NEW-Q' + i)).length,
      q0wrong: (window.NSTMastery.get('OLD-Q0') || {}).incorrect,
      status: (document.querySelector('.nst-bk-status') || {}).textContent || '',
    }));
    ok(`${mode}: the button worked and said so`,
      clicked && /Restored \d+ item/.test(after.status), after.status.slice(0, 70));
    ok(`${mode}: everything the backup held comes back`, after.olds === 8, String(after.olds) + '/8');

    if (mode === 'Merge') {
      ok('Merge: work the backup never saw survives', after.news === 5, String(after.news) + '/5');
      ok('Merge: and the newer answer to a shared question is kept, not undone',
        after.q0wrong === 1, String(after.q0wrong));
    } else {
      ok('Replace: work the backup never saw is gone, as the button says',
        after.news === 0, String(after.news) + '/5');
      ok('Replace: and a shared question reverts to the backup\'s version',
        after.q0wrong === 0, String(after.q0wrong));
    }
    ok(`${mode}: no page errors through the whole round trip`, errs.length === 0, errs.slice(0, 2).join(' ;; '));
    await ctx.close();
  }

  /* ---- 3. cancelling changes nothing ------------------------------------ */
  {
    const { ctx, page } = await sitting();
    const file = join(dir, 'backup-cancel.json');
    writeFileSync(file, await page.evaluate(() => window.NSTBackup.toJSON()));
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) window.NSTMastery.record('NEW-Q' + i, { correct: true, gate: 'always' });
      window.NSTMastery.flush();
    });
    await page.click('#nst-settings-btn');
    await page.waitForTimeout(400);
    await page.setInputFiles('input[type="file"]', file);
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('.nst-modal-actions button'))
        .find((x) => x.textContent.trim() === 'Cancel');
      if (b) b.click();
    });
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({
      news: [0,1,2,3,4].filter((i) => !!window.NSTMastery.get('NEW-Q' + i)).length,
      olds: [0,1,2,3,4,5,6,7].filter((i) => !!window.NSTMastery.get('OLD-Q' + i)).length,
    }));
    ok('Cancel leaves the record exactly as it was', after.news === 5 && after.olds === 8,
      `new=${after.news} old=${after.olds}`);
    await ctx.close();
  }

  /* ---- 4. a file that is not a backup is refused, not half-applied ------ */
  {
    const { ctx, page } = await sitting();
    const junk = join(dir, 'not-a-backup.json');
    writeFileSync(junk, '{"hello":"world"}');
    await page.click('#nst-settings-btn');
    await page.waitForTimeout(400);
    await page.setInputFiles('input[type="file"]', junk);
    await page.waitForTimeout(700);
    const state = await page.evaluate(() => ({
      asked: Array.from(document.querySelectorAll('.nst-modal-title')).map((e) => e.textContent.trim()),
      status: (document.querySelector('.nst-bk-status') || {}).textContent || '',
      olds: [0,1,2,3,4,5,6,7].filter((i) => !!window.NSTMastery.get('OLD-Q' + i)).length,
    }));
    ok('a file that is not a backup never reaches the confirm',
      !state.asked.includes('Restore this backup?'), state.asked.join('/'));
    ok('it says so instead of failing silently', state.status.trim().length > 0, state.status.slice(0, 70));
    ok('and the record is untouched', state.olds === 8, String(state.olds) + '/8');
    await ctx.close();
  }
} catch (err) {
  console.log('FAIL unexpected error: ' + (err && err.stack ? err.stack : err));
  fail++;
}

await browser.close();
server.kill('SIGKILL');
rmSync(dir, { recursive: true, force: true });
console.log('\n' + (fail ? `RESTORE: ${fail} FAILED of ${pass + fail}` : `RESTORE: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
