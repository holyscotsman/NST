/* load-test.mjs — how the four static pages load their scripts.
 *
 * THE DEFECT THIS EXISTS FOR
 * Every <script src> on the launcher and Practice Exams was a plain blocking
 * tag. A classic script with no defer stops the parser dead: nothing after it is
 * parsed, nothing paints, and the NEXT script is not even requested until this
 * one has arrived and run. Ten tags is ten round trips end to end.
 *
 * Measured on a throttled 60ms link, serving this repo over HTTP:
 *
 *   launcher         DOMContentLoaded 1022ms   first contentful paint: NEVER
 *   practice-exams   DOMContentLoaded 1404ms
 *
 * 938ms of the launcher's 1022ms was one script waiting on the last -- each tag
 * started within 2ms of its predecessor finishing, a perfect staircase. The
 * concurrency across the ten was 1.08x: effectively a single file at a time.
 * And the launcher painted NOTHING until the whole chain was done, because the
 * tags sit in <head> and a blocking script in <head> holds back first paint.
 *
 * Adding `defer` to them:
 *
 *   launcher         DOMContentLoaded  586ms  (-43%)   first paint 316ms
 *   practice-exams   DOMContentLoaded  601ms  (-57%)
 *
 * concurrency 4.71x and 5.41x. Nothing else changed. defer is exactly the right
 * tool here because deferred scripts still execute in DOCUMENT ORDER, so the
 * global contracts these files depend on -- NSTBankParser existing before
 * bank-loader.js runs, NSTMastery before the tools that write to it -- hold
 * unchanged. Only the fetching became parallel.
 *
 * WHY A GATE AND NOT JUST THE FIX
 * `defer` is one word. Deleting it is one keystroke, it breaks no test, changes
 * no output, and the page still works -- just slowly, on a link nobody developing
 * locally has. The staircase would come back silently. So: every classic script
 * tag on every page must carry defer, and the one documented exception has to
 * earn it.
 *
 * Pure Node, no browser. Run: node scripts/load-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- the rules, as functions, so the self-check below runs the same code ---- */

/* Every <script> in document order: its src (or null when inline), whether it is
 * a module, and the attributes that decide when it runs. Deliberately a regex
 * over the source rather than a DOM parse: this has to run with no dependencies,
 * and the tags in this repo are plain. */
export function scriptTags(html) {
  const out = [];
  const re = /<script\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const src = (attrs.match(/\bsrc\s*=\s*"([^"]*)"/i) || [])[1] || null;
    out.push({
      src,
      at: m.index,
      module: /\btype\s*=\s*"module"/i.test(attrs),
      importmap: /\btype\s*=\s*"importmap"/i.test(attrs),
      defer: /\bdefer\b/i.test(attrs),
      async: /\basync\b/i.test(attrs),
    });
  }
  return out;
}

/* A classic external script with neither defer nor async blocks the parser.
 * Modules are deferred by definition; inline scripts have nothing to fetch. */
export function blocking(html, allow = []) {
  return scriptTags(html)
    .filter((s) => s.src && !s.module && !s.defer && !s.async)
    .map((s) => basename(s.src))
    .filter((n) => !allow.includes(n));
}

/* `async` on an ordered script is worse than no attribute at all: it runs
 * whenever it lands, so bank-loader.js can execute before bank-parser.js has
 * defined NSTBankParser -- intermittently, under load, on someone else's link. */
export function asyncOrdered(html) {
  return scriptTags(html).filter((s) => s.src && s.async).map((s) => basename(s.src));
}

/* Deferred scripts run in document order, so a dependency is satisfied iff its
 * tag appears first. Returns the pairs that are the wrong way round. */
export function orderBreaks(html, pairs) {
  const pos = new Map();
  scriptTags(html).forEach((s, i) => { if (s.src) pos.set(basename(s.src), i); });
  const bad = [];
  for (const [first, then] of pairs) {
    if (!pos.has(first) || !pos.has(then)) continue;      // page does not use both
    if (pos.get(first) > pos.get(then)) bad.push(`${first} after ${then}`);
  }
  return bad;
}

/* ---- the pages ---- */

/* The one script allowed to block, and the reason. nst-prefs.js sets the
 * accessibility classes on <html> synchronously at load: reduced motion, high
 * contrast, larger text. Deferred, it would run after the parser is done, and
 * somebody who needs high contrast could watch the page paint in the ordinary
 * palette first and then jump. A flash of the wrong contrast is a worse bug
 * than a 60ms round trip, so this one stays blocking on purpose. */
const MAY_BLOCK = ['nst-prefs.js'];

/* Contracts that only hold because of tag order. */
const ORDER = [
  ['bank-parser.js', 'bank-loader.js'],      // NSTBankParser, used at load
  ['nst-mastery.js', 'nst-sync.js'],         // sync flushes the mastery store
  ['engine.js', 'app.js'],
  ['bank-loader.js', 'preload-three.js'],    // reads NSTBank.active() at load
];

const PAGES = ['index.html', 'practice-exams/index.html', 'wwtbane/index.html', '404.html'];

for (const rel of PAGES) {
  const html = readFileSync(join(ROOT, rel), 'utf8');
  const tags = scriptTags(html).filter((s) => s.src);
  const label = rel;

  const block = blocking(html, MAY_BLOCK);
  ok(`${label}: no classic script blocks the parser`, block.length === 0,
    block.join(', ') + ' -- add defer, or justify it in MAY_BLOCK');

  const loose = asyncOrdered(html);
  ok(`${label}: nothing is async`, loose.length === 0,
    loose.join(', ') + ' -- async ignores document order, and these depend on it');

  const breaks = orderBreaks(html, ORDER);
  ok(`${label}: deferred scripts are in dependency order`, breaks.length === 0, breaks.join('; '));

  /* A module entry that needs the classic globals must come after them, because
   * deferred classics and modules share one queue, resolved in document order. */
  const mod = scriptTags(html).find((s) => s.module && !s.importmap);
  if (mod && tags.length) {
    const lastClassic = Math.max(...tags.filter((s) => !s.module).map((s) => s.at));
    ok(`${label}: the module entry runs after the classic scripts it needs`,
      mod.at > lastClassic, `module at ${mod.at}, last classic at ${lastClassic}`);
  }
}

/* ---- the exception has to earn it ---- */
{
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const actuallyBlocking = blocking(html, []);
  ok('the only blocking script is the documented one',
    actuallyBlocking.length === MAY_BLOCK.length &&
    actuallyBlocking.every((n) => MAY_BLOCK.includes(n)),
    actuallyBlocking.join(', '));

  /* MAY_BLOCK is not a place to park a script somebody did not want to think
   * about. To sit there, a file has to do the thing the exception is for:
   * touch the document synchronously, before paint. */
  for (const name of MAY_BLOCK) {
    const src = readFileSync(join(ROOT, 'shared', name), 'utf8');
    ok(`${name} blocks for a reason -- it touches document.documentElement at load`,
      /document\.documentElement/.test(src));
    const last = src.trimEnd().split('\n').slice(-3).join('\n');
    ok(`${name} really calls it at load, not only from an exported function`,
      /\)\s*\(\s*\)\s*;?\s*$/.test(last) || /^\s*apply/m.test(src), last.slice(-60));
  }
}

/* ---- the rules can see a violation ----
 *
 * Every check above passes, which on its own proves only that the regex found
 * nothing. These feed the SAME functions pages that are broken in the exact way
 * each rule exists to catch, and require a complaint.
 */
{
  const page = (tags) => `<!doctype html><html><head>${tags}</head><body></body></html>`;

  ok('self-check: a plain blocking script is caught',
    blocking(page('<script src="./a.js"></script>')).join() === 'a.js');
  ok('self-check: the same script with defer is not',
    blocking(page('<script src="./a.js" defer></script>')).length === 0);
  ok('self-check: a module is not counted as blocking',
    blocking(page('<script type="module" src="./a.js"></script>')).length === 0);
  ok('self-check: an inline script is not counted as blocking',
    blocking(page('<script>var x=1;</script>')).length === 0);
  ok('self-check: the allow-list works, and only for the name on it',
    blocking(page('<script src="../shared/nst-prefs.js"></script>'), MAY_BLOCK).length === 0 &&
    blocking(page('<script src="../shared/nst-sync.js"></script>'), MAY_BLOCK).join() === 'nst-sync.js');

  ok('self-check: async is caught',
    asyncOrdered(page('<script src="./a.js" async></script>')).join() === 'a.js');

  const wrongWay = page('<script src="./bank-loader.js" defer></script><script src="./bank-parser.js" defer></script>');
  ok('self-check: a dependency loaded before its dependency is caught',
    orderBreaks(wrongWay, ORDER).join() === 'bank-parser.js after bank-loader.js',
    JSON.stringify(orderBreaks(wrongWay, ORDER)));
  const rightWay = page('<script src="./bank-parser.js" defer></script><script src="./bank-loader.js" defer></script>');
  ok('self-check: and the correct order is not', orderBreaks(rightWay, ORDER).length === 0);
  ok('self-check: a pair the page does not use is not reported',
    orderBreaks(page('<script src="./unrelated.js" defer></script>'), ORDER).length === 0);

  /* The real launcher, with defer stripped, must fail the real rule. If this
   * passes, the rule is reading something other than the page. */
  const real = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const stripped = real.replace(/ defer>/g, '>');
  ok('self-check: the real launcher with defer removed fails the real rule',
    stripped !== real && blocking(stripped, MAY_BLOCK).length >= 8,
    blocking(stripped, MAY_BLOCK).length + ' blocking without defer');
}

console.log('\n' + (fail ? `LOAD: ${fail} FAILED (${pass} passed)` : `LOAD: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
