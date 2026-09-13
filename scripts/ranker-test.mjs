/* ranker-test.mjs — one property, applied to every "what should I study next".
 *
 * THE CLASS THIS EXISTS FOR
 * Three times now, a recommendation has been decided by a RATE, and a rate is
 * won by the smallest sample. One question answered wrong is 0%, and 0% beats
 * everything.
 *
 *   v2.57.0  the launcher's "weakest areas" ranked by box progress over the
 *            whole domain -- a coverage measure -- and named the three
 *            LEAST-STUDIED domains, one of them the most accurate of nine.
 *   v2.65.0  the results screen's "focus next" ranked by percentage correct and
 *            named a domain with fewer missed questions than another in 62% of
 *            simulated sittings, forgoing 2.9 questions.
 *   v2.66.0  StarNix's coach took stats().domains[0], sorted by masteredPct,
 *            and named a domain with less left to learn 65% of the time,
 *            forgoing 15.7 questions. v2.57.0 examined this exact ranking and
 *            let it stand as "fair for a drill prompt"; measuring says no.
 *
 * So the rule stops being three separate fixes and becomes one property that
 * every such ranker has to satisfy:
 *
 *   1. SAME RATE, DIFFERENT SIZE -> the larger wins. Two domains you are equally
 *      bad at are not equally worth an evening; one has more to learn.
 *   2. A MINIMAL CANDIDATE AT THE WORST POSSIBLE RATE MUST NOT WIN against a
 *      substantially larger one. This is the failure itself, stated directly.
 *   3. SAME SIZE, DIFFERENT RATE -> the weaker wins. Without this a ranker could
 *      satisfy 1 and 2 by ignoring skill entirely.
 *
 * Each ranker is asked in its own vocabulary -- the launcher in answers, the
 * results screen in misses, StarNix in mastered-of-total -- and all three must
 * answer the same way.
 *
 * Pure Node, no browser. Run: node scripts/ranker-test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- load the three rankers ------------------------------------------- */

function shimWindow(extra = {}) {
  const map = new Map();
  const storage = {
    get length() { return map.size; },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
  const win = { localStorage: storage, PE_CONFIG: { PASS_THRESHOLD: 0.8 }, ...extra };
  win.window = win;
  return win;
}

/* 1. The launcher: NSTDash.model().weakest, over a real NSTMastery. */
const launcher = (() => {
  const win = shimWindow();
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', read('shared', 'nst-mastery.js'))(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  new Function('window', 'setTimeout', 'clearTimeout', 'Date', read('shared', 'nst-dashboard.js'))(
    win, (fn) => { fn(); return 0; }, () => {}, Date);
  return win;
})();

/* 2. Practice Exams: engine.focusDomain(byDomain). */
const focusDomain = (() => {
  const win = shimWindow();
  new Function('window', 'localStorage', read('practice-exams', 'engine.js'))(win, win.localStorage);
  return win.PE.engine.focusDomain;
})();

/* 3. StarNix: StarNix.plan.drillTarget(domains). Read from the module source,
 *    not the built file: the built file is 2.8 MB and this needs one function. */
const drillTarget = (() => {
  const src = read('starnix', 'starnix-core.js');
  const m = src.match(/function drillTarget\(domains\) \{[\s\S]*?\n  \}/);
  if (!m) return null;
  return new Function('return ' + m[0].replace('function drillTarget', 'function drillTarget'))();
})();

ok('all three rankers loaded', !!launcher.NSTDash && typeof focusDomain === 'function' && typeof drillTarget === 'function',
  `dash=${!!launcher.NSTDash} focus=${typeof focusDomain} drill=${typeof drillTarget}`);

/* ---- the property, asked of each in its own vocabulary ----------------- */

/* Practice Exams speaks in correct-of-total for one sitting. */
{
  const D = (correct, total) => ({ correct, total });

  const sameRate = focusDomain({ small: D(0, 3), large: D(0, 30) });
  ok('focusDomain: same rate, the larger domain wins', sameRate && sameRate.domain === 'large',
    sameRate && sameRate.domain);

  const tiny = focusDomain({ tiny: D(0, 1), real: D(20, 30) });
  ok('focusDomain: a one-question domain at 0% does not beat ten real misses',
    tiny && tiny.domain === 'real', tiny && tiny.domain);

  const sameSize = focusDomain({ weak: D(2, 20), strong: D(18, 20) });
  ok('focusDomain: same size, the weaker domain wins', sameSize && sameSize.domain === 'weak',
    sameSize && sameSize.domain);
}

/* StarNix speaks in mastered-of-total across the whole domain. */
{
  const D = (domain, mastered, total) => ({ domain, mastered, total, masteredPct: total ? mastered / total : 0, due: 0 });

  const sameRate = drillTarget([D('small', 0, 3), D('large', 0, 30)]);
  ok('drillTarget: same rate, the larger domain wins', sameRate && sameRate.domain === 'large',
    sameRate && sameRate.domain);

  const tiny = drillTarget([D('tiny', 0, 1), D('real', 20, 30)]);
  ok('drillTarget: a one-question domain at 0% does not beat ten unmastered',
    tiny && tiny.domain === 'real', tiny && tiny.domain);

  const sameSize = drillTarget([D('weak', 2, 20), D('strong', 18, 20)]);
  ok('drillTarget: same size, the weaker domain wins', sameSize && sameSize.domain === 'weak',
    sameSize && sameSize.domain);

  ok('drillTarget: nothing left to learn means no recommendation',
    drillTarget([D('done', 12, 12)]) === null);
  ok('drillTarget: a zero-question domain is skipped, not divided by zero',
    (drillTarget([D('empty', 0, 0), D('real', 1, 4)]) || {}).domain === 'real');
}

/* The launcher speaks in answers, and needs enough of them before it will rank
 * on skill at all -- a different solution to the same problem, so it is asked
 * the same questions through a real mastery store. */
{
  const { NSTMastery: M, NSTDash: D } = launcher;
  const T0 = 1_700_000_000_000;

  function model(spec) {
    M.reset();
    const bank = [];
    for (const [domain, total, wrongOf] of spec) {
      for (let i = 0; i < total; i++) {
        const id = domain + '-' + i;
        bank.push({ id, domain });
        // Three answers each, so every domain clears the evidence bar.
        for (let r = 0; r < 3; r++) M.record(id, { correct: i >= wrongOf, gate: 'always', now: T0 });
      }
    }
    return D.model({ summary: M.summary(bank, T0 + 1), history: [], now: T0 + 1 });
  }

  // Same accuracy (half wrong), very different sizes.
  const m1 = model([['small', 4, 2], ['large', 40, 20], ['other', 12, 1]]);
  ok('launcher: with equal accuracy it does not put the smallest first',
    m1.weakest.length && m1.weakest[0].domain !== 'small',
    m1.weakBasis + ' ' + m1.weakest.map((w) => w.domain + ':' + w.accuracy).join(','));

  // Same size, different accuracy: the weaker must lead.
  const m2 = model([['weak', 20, 18], ['strong', 20, 2]]);
  ok('launcher: same size, the weaker domain leads',
    m2.weakest.length && m2.weakest[0].domain === 'weak',
    m2.weakest.map((w) => w.domain + ':' + w.accuracy).join(','));
}

/* ---- [neg] the fixtures discriminate ----------------------------------- */
{
  // Each fixture above must actually separate a rate-ranker from a
  // quantity-ranker. Rank the same data by rate and require a DIFFERENT answer.
  const byRate = (doms) => doms.slice().sort((a, b) =>
    (a.mastered / a.total) - (b.mastered / b.total))[0];
  const D = (domain, mastered, total) => ({ domain, mastered, total });

  ok('[neg] ranking the same-rate fixture by rate answers differently',
    byRate([D('small', 0, 3), D('large', 0, 30)]).domain === 'small',
    byRate([D('small', 0, 3), D('large', 0, 30)]).domain);
  ok('[neg] and the one-question fixture too',
    byRate([D('tiny', 0, 1), D('real', 20, 30)]).domain === 'tiny');
  // ...but not the same-size one, which both rankings get right. Stated so the
  // third property is not mistaken for a discriminating test.
  ok('[neg] the same-size fixture is deliberately NOT discriminating',
    byRate([D('weak', 2, 20), D('strong', 18, 20)]).domain === 'weak');
}

console.log('\n' + (fail ? `RANKERS: ${fail} FAILED (${pass} passed)` : `RANKERS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
