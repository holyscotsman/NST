// selection.js — question-set generation. Pure (rng injected).
//
// Two modes:
//   'seeded'  — deterministic selection from the AUTHORED difficulty pools,
//               ignoring personal mastery. Seed N reproduces the same game for
//               anyone. Seeded runs still feed mastery.
//   'mastery' — non-deterministic, driven by each question's effective tier
//               (personal Leitner state), weighted toward weaker/staler items,
//               occasionally resurfacing a graduated question.
//
// The extreme final (Q30) is special: the first time a player ever reaches it,
// it is an "impossible" authored question. That is gated on a persistence flag,
// NOT on the seed (CLAUDE.md §3).

import { TIERS, MASTERY } from './config.js';
import { makeRng, shuffle, weightedPick } from './rng.js';
import { effectiveTier, selectionWeight, isGraduated } from './mastery.js';

const MAIN_TIERS = ['easy', 'medium', 'hard'];

// The tier a question counts as for selection, given mode.
export function tierOfQuestion(q, mastery, mode) {
  if (mode === 'seeded') return q.authoredDifficulty;
  return effectiveTier(mastery, q); // may be 'graduated' or 'extreme'
}

// Build one 30-question set. Returns an array of question objects in play order.
// Guarantees 30 distinct questions or throws with a clear message.
export function buildSet(opts) {
  const {
    bank,
    mastery = { records: {} },
    mode = 'mastery',
    seed = 'default',
    setIndex = 0,
    reachedFinalBefore = true,
    currentRun = 0,
    exclude = new Set(),
    rng: injectedRng,
  } = opts;

  const rng = mode === 'seeded' ? makeRng(`${seed}#${setIndex}`) : (injectedRng || Math.random);
  // Two constraints: `chosen` (hard — no duplicate within this set) and `soft`
  // (cross-set exclusion we PREFER to honor but relax rather than fail when the
  // bank is too small to build fully-disjoint back-to-back sets).
  const soft = new Set(exclude);
  const chosen = new Set();
  const out = [];

  // Bucket the bank by the tier it presents at in this mode.
  const buckets = { easy: [], medium: [], hard: [], extreme: [], graduated: [] };
  for (const q of bank) {
    const t = tierOfQuestion(q, mastery, mode);
    if (buckets[t]) buckets[t].push(q);
  }
  const ctx = { mode, rng, mastery, currentRun, chosen, soft };

  // Fill the three main tiers.
  for (const tier of TIERS) {
    if (tier.key === 'extreme') continue; // handled last
    let need = tier.count;

    // Mastery mode: occasionally resurface a graduated question into an easy slot
    // so mastered material isn't forgotten.
    if (mode === 'mastery' && tier.key === 'easy') {
      const grads = buckets.graduated.filter((q) => !chosen.has(q.id) && !soft.has(q.id));
      if (grads.length && rng() < MASTERY.RESURFACE_CHANCE) {
        const g = grads[Math.floor(rng() * grads.length)];
        commit(out, g, ctx); need -= 1;
      }
    }

    const pools = mainTierPools(tier.key, buckets, bank);
    fillTier(need, pools, ctx, out);
  }

  // Fill the extreme final (Q30).
  commit(out, pickFinal({ bank, buckets, reachedFinalBefore, ctx }), ctx);

  const target = TIERS.reduce((a, t) => a + t.count, 0);
  if (out.length !== target) {
    throw new Error(`selection: built ${out.length} of ${target}; bank too small (need at least ${target} distinct playable questions).`);
  }
  return out;
}

function commit(out, q, ctx) {
  if (!q || ctx.chosen.has(q.id)) return false;
  out.push(q); ctx.chosen.add(q.id);
  return true;
}

// Candidate pools for a main tier, in priority order:
//   own tier → adjacent tiers → any non-extreme, each "fresh" (not soft-excluded)
//   before "reused" (soft-excluded). Splitting each pool by soft lets us prefer
//   disjoint sets yet still succeed on a small bank.
function mainTierPools(tierKey, buckets, bank) {
  const nonExtreme = bank.filter((q) => q.authoredDifficulty !== 'extreme');
  const adj = backfillOrder(tierKey).flatMap((t) => buckets[t]);
  const seq = [buckets[tierKey], adj, nonExtreme];
  const pools = [];
  for (const s of seq) pools.push({ list: s, soft: false });
  for (const s of seq) pools.push({ list: s, soft: true });
  return pools;
}

function fillTier(need, pools, ctx, out) {
  let added = 0;
  for (const pool of pools) {
    while (added < need) {
      const cands = pool.list.filter((q) => !ctx.chosen.has(q.id) && (pool.soft || !ctx.soft.has(q.id)));
      if (!cands.length) break;
      let q;
      if (ctx.mode === 'seeded') q = cands[Math.floor(ctx.rng() * cands.length)];
      else {
        const weights = cands.map((c) => selectionWeight(ctx.mastery, c, ctx.currentRun));
        q = weightedPick(cands, weights, ctx.rng);
      }
      if (commit(out, q, ctx)) added += 1;
    }
    if (added >= need) break;
  }
  return added;
}

function backfillOrder(tierKey) {
  switch (tierKey) {
    case 'easy': return ['medium', 'hard'];
    case 'medium': return ['easy', 'hard'];
    case 'hard': return ['medium', 'easy'];
    default: return MAIN_TIERS.filter((t) => t !== tierKey);
  }
}

function pickFinal({ bank, buckets, reachedFinalBefore, ctx }) {
  const pick = (list) => {
    const c = list.filter((q) => !ctx.chosen.has(q.id));
    return c.length ? c[Math.floor(ctx.rng() * c.length)] : null;
  };
  // Flag-gated impossible first final (not seed-gated).
  if (!reachedFinalBefore) {
    const imp = pick(bank.filter((q) => q.impossible));
    if (imp) return imp;
  }
  const extremes = bank.filter((q) => q.authoredDifficulty === 'extreme');
  return pick(extremes.filter((q) => !q.impossible))
      || pick(extremes)
      || pick(buckets.hard)
      || pick(bank);
}

// Double-buffer set manager. Always keeps a `current` and a ready `next` set, so
// Steve's clue can reference a real, guaranteed-upcoming question. The set two
// ahead is built after the current set is played, from the latest mastery.
export class SetManager {
  // getRunIndex: the staleness clock for mastery weighting. It must be the SAME
  // counter that stamps record().lastRun (the shell passes save.stats.runs) or
  // "less recently seen" silently dies after any campaign rebuild — the private
  // setIndex resets to 0 on every prestige/import while lastRun keeps counting.
  constructor({ bank, getMastery, mode = 'mastery', seed = 'default', reachedFinalBefore = true, rng, getRunIndex }) {
    this.bank = bank;
    this.getMastery = getMastery || (() => ({ records: {} }));
    this.mode = mode;
    this.seed = seed;
    this.reachedFinalBefore = reachedFinalBefore;
    this.rng = rng;
    this.setIndex = 0;
    this.getRunIndex = getRunIndex || (() => this.setIndex);
    this._current = null;
    this._next = null;
  }

  init() {
    this._current = this._build(this.setIndex++, new Set());
    this._next = this._build(this.setIndex++, idsOf(this._current));
    return this._current;
  }

  _build(setIndex, exclude) {
    return buildSet({
      bank: this.bank,
      mastery: this.getMastery(),
      mode: this.mode,
      seed: this.seed,
      setIndex,
      reachedFinalBefore: this.reachedFinalBefore,
      currentRun: this.getRunIndex(),
      exclude,
      rng: this.rng,
    });
  }

  current() { return this._current; }
  next() { return this._next; }

  // Called after `current` has been played. Promotes next -> current and builds
  // a fresh next (two-ahead) from whatever mastery now looks like.
  advance() {
    this._current = this._next;
    this._next = this._build(this.setIndex++, idsOf(this._current));
    return this._current;
  }

  setReachedFinalBefore(v) { this.reachedFinalBefore = v; }

  // Honor Steve's promise across sessions: the campaign sets are memory-only,
  // so a clue paid for last session may not be in this session's rebuilt set.
  // Pin the taught question into the CURRENT set's hard block (play order
  // 21–29, 0-based 20–28 per the 10/10/9/1 shape) so the clue still references
  // a real, guaranteed-upcoming question (CLAUDE.md §3). No-op if already in.
  pinIntoCurrent(q) {
    if (!q || !this._current) return false;
    if (this._current.some((x) => x.id === q.id)) return false;
    const slot = 20; // first hard slot
    this._current = this._current.slice();
    this._current[slot] = q;
    return true;
  }

  // A guaranteed-upcoming hard question from the UPCOMING run (the prebuilt
  // `current` set) for Steve to teach. ONLY a question that carries an authored
  // steveClue AND has not been taught before qualifies — Steve never repeats a
  // clue (CLAUDE.md §3) and never sells a question he has nothing to say about
  // (the old fallback charged 4,000 coins and rendered an empty tip). When
  // nothing qualifies, null: the green room shows his "nothing new" state.
  peekUpcomingHard(alreadyTaught = new Set()) {
    if (!this._current) return null;
    const mastery = this.getMastery();
    const hards = this._current.filter((q) => tierOfQuestion(q, mastery, this.mode) === 'hard' || q.authoredDifficulty === 'hard');
    const withClue = hards.filter((q) => q.steveClue && !alreadyTaught.has(q.id));
    return withClue[0] || null;
  }
}

function idsOf(set) { return new Set(set.map((q) => q.id)); }
