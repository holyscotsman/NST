// runController.js — the run state machine. Pure logic; emits events for the
// backdrop/audio via an injected `emit`. Owns: current set, progress, lifelines,
// coin banking, permadeath, and mastery updates.
//
// Rules enforced here (CLAUDE.md §3/§4):
//   - Permadeath: a wrong answer ends the run.
//   - Multi-answer is all-or-nothing.
//   - Coins bank at tier boundaries; death drops to the last banked amount.
//   - A lifeline-assisted correct answer does NOT promote mastery.
//   - The authored key alone decides correctness — never an LLM.

import { record as recordMastery } from './mastery.js';
import { fiftyFifty, askAudience, phoneFriend } from './lifelines.js';
import { runningTotal, bankedAfter, payout, isBankBoundary, nextBoundary } from './coins.js';
import { LIFELINE_TYPES } from './config.js';

export function positionTier(index) {
  if (index < 10) return 'easy';
  if (index < 20) return 'medium';
  if (index < 29) return 'hard';
  return 'extreme';
}

export function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export class RunController {
  // lifelines: { fifty:{slots,charges}, audience:{...}, phone:{...} } (mutated; persist externally)
  // mastery:   { records:{...} } (mutated; persist externally)
  constructor({ set, mastery, lifelines, seed = 'default', mode = 'mastery', runIndex = 0, emit }) {
    this.set = set;
    this.mastery = mastery || { records: {} };
    this.lifelines = lifelines || defaultLifelines();
    this.seed = seed;
    this.mode = mode;
    this.runIndex = runIndex;
    this.emit = emit || (() => {});

    this.index = 0;
    this.alive = true;
    this.won = false;
    this.clearedCount = 0;
    this.assisted = false;             // any lifeline used on the current question
    this.usedThisQuestion = new Set(); // which lifeline types used on current question
    this.lifelineOutput = {};          // cached lifeline results for current question
    this.rngSalt = 0;
  }

  start() {
    this.emit('run:start', { seed: this.seed, mode: this.mode, runIndex: this.runIndex });
    this._show();
    return this.current();
  }

  current() {
    return {
      q: this.set[this.index],
      index: this.index,
      number: this.index + 1,
      tier: positionTier(this.index),
      isFinal: this.index === 29,
    };
  }

  snapshot() {
    return {
      index: this.index,
      number: this.index + 1,
      tier: positionTier(this.index),
      alive: this.alive,
      won: this.won,
      clearedCount: this.clearedCount,
      running: runningTotal(this.clearedCount),
      banked: bankedAfter(this.clearedCount),
      nextBoundary: nextBoundary(this.clearedCount),
      lifelines: this.lifelines,
      assisted: this.assisted,
      usedThisQuestion: [...this.usedThisQuestion],
    };
  }

  _show() {
    const cur = this.current();
    if (cur.isFinal && cur.q.impossible) this.emit('final:impossible', { q: cur.q });
    this.emit('question:show', { index: cur.index, number: cur.number, tier: cur.tier, isFinal: cur.isFinal });
  }

  canUseLifeline(type) {
    if (!LIFELINE_TYPES.includes(type)) return false;
    if (this.usedThisQuestion.has(type)) return false;
    const l = this.lifelines[type];
    return !!l && l.charges > 0;
  }

  // Consume a lifeline on the current question. Returns its payload (or null).
  useLifeline(type) {
    if (!this.canUseLifeline(type)) return null;
    const q = this.set[this.index];
    const tier = positionTier(this.index);
    // Deterministic per (seed, question, type) so seeded runs reproduce lifelines.
    const rng = makeLocalRng(`${this.seed}#${this.runIndex}#${this.index}#${type}#${this.rngSalt++}`);

    let payload;
    if (type === 'fifty') payload = fiftyFifty(q, rng);
    else if (type === 'audience') payload = askAudience(q, rng, tier);
    else if (type === 'phone') payload = phoneFriend(q, tier);

    this.lifelines[type].charges -= 1;
    this.usedThisQuestion.add(type);
    this.assisted = true;
    this.lifelineOutput[type] = payload;
    this.emit('lifeline:use', { type, tier, payload });
    return { type, payload };
  }

  // Grade an answer. selectedIndices: array of chosen option indices.
  // Returns a result object describing what happened.
  answer(selectedIndices) {
    if (!this.alive || this.won) return null;
    const cur = this.current();
    const q = cur.q;
    const correct = sameSet(selectedIndices, q.answer);
    this.emit('answer:lock', { index: cur.index, selected: selectedIndices });

    // Record mastery. Assisted-correct does not promote; wrong always demotes.
    recordMastery(this.mastery, q.id, {
      correct,
      assisted: this.assisted,
      runIndex: this.runIndex,
      authoredDifficulty: q.authoredDifficulty,
    });

    if (!correct) {
      this.alive = false;
      const result = {
        correct: false,
        selected: selectedIndices,
        correctAnswer: q.answer.slice(),
        explanation: q.explanation,
        wasFinal: cur.isFinal,
        wasImpossible: !!q.impossible,
        payout: payout({ clearedCount: this.clearedCount, won: false }),
        q,
      };
      this.emit('answer:wrong', { index: cur.index, correctAnswer: q.answer.slice(), tier: cur.tier });
      this.emit('run:dead', { payout: result.payout, wasFinal: cur.isFinal, wasImpossible: !!q.impossible });
      return result;
    }

    // Correct.
    this.clearedCount += 1;
    const boundary = isBankBoundary(cur.index);
    const banked = bankedAfter(this.clearedCount);
    this.emit('answer:correct', {
      index: cur.index, tier: cur.tier, assisted: this.assisted, boundary, banked,
    });
    if (boundary) this.emit('coins:bank', { amount: banked });

    const result = {
      correct: true,
      selected: selectedIndices,
      correctAnswer: q.answer.slice(),
      explanation: q.explanation,
      boundary,
      banked,
      running: runningTotal(this.clearedCount),
      wasFinal: cur.isFinal,
      q,
    };

    if (cur.isFinal) {
      this.won = true;
      result.won = true;
      result.payout = payout({ clearedCount: this.clearedCount, won: true });
      this.emit('run:win', { payout: result.payout });
      return result;
    }

    // Grading is done; the UI shows feedback, then calls advance() to move on.
    result.hasNext = true;
    return result;
  }

  // Move to the next question (after feedback). Emits 'question:show'.
  advance() {
    if (!this.alive || this.won) return null;
    if (this.index >= this.set.length - 1) return null;
    this.index += 1;
    this.assisted = false;
    this.usedThisQuestion = new Set();
    this.lifelineOutput = {};
    this._show();
    return this.current();
  }
}

export function defaultLifelines() {
  return {
    fifty: { slots: 1, charges: 1 },
    audience: { slots: 1, charges: 1 },
    phone: { slots: 1, charges: 1 },
  };
}

// Small local deterministic rng without importing rng.js internals redundantly.
import { makeRng } from './rng.js';
function makeLocalRng(key) { return makeRng(key); }
