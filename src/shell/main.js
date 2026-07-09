// main.js — the browser entry point. Wires the pure core to the DOM overlay, the
// WebGL backdrop, audio, and persistence. Owns navigation between screens.
//
// The quiz is always playable as DOM even if WebGL fails to start.

import { createBus } from '../core/eventBus.js';
import { validateBank } from '../core/questionSchema.js';
import { SetManager } from '../core/selection.js';
import { RunController } from '../core/runController.js';
import { generateSeedString } from '../core/rng.js';
import { effectiveTier } from '../core/mastery.js';
import { payout } from '../core/coins.js';
import { SHOP, LIFELINE_MAX_SLOTS } from '../core/config.js';
import { letter } from '../core/lifelines.js';

import * as persistence from './persistence.js';
import { GameAudio } from './audio.js';
import { Hud } from './ui/hud.js';
import { QuizScreen } from './ui/overlay.js';
import { TitleScreen, GreenRoom, ResultScreen, HelpScreen, SettingsScreen } from './ui/screens.js';
import { h, clear } from './ui/dom.js';

import { QUESTIONS } from '../content/questions.js';

export class Game {
  constructor(roots) {
    this.roots = roots; // { studio, screen, announce, fallback }
    this.bus = createBus();
    this.save = persistence.load();
    this.audio = new GameAudio({ enabled: this.save.settings.sound });
    this.bank = null;
    this.campaign = null;      // persistent mastery SetManager
    this.rc = null;
    this.hud = new Hud({ onLifeline: (t) => this.useLifeline(t) });
    this.quiz = new QuizScreen({
      onAnswer: (idx) => this.answer(idx),
      onContinue: (r) => this.continueAfter(r),
      onSelectSound: () => this.audio.play('select'),
    });
    this.steveVisit = { called: false, question: null, clue: '' };
    this.reduced = this._resolveReduced();
    this._onKey = (e) => this._handleKey(e);
  }

  async boot() {
    // Validate the shipped bank; play with whatever is structurally valid.
    const res = validateBank(QUESTIONS);
    this.bank = res.valid;
    if (res.rejected.length) console.warn('[wwtbane] rejected questions:', res.rejected);
    if (this.bank.length < 30) {
      this._fatal(`The question bank is too small to play (${this.bank.length} valid). Need at least 30.`);
      return;
    }

    this._applyBodyClasses();

    // Start the backdrop; if WebGL is unavailable, fall back to a CSS studio.
    // (E2E tests set 'wwtbane.nogl' to skip the GPU-bound backdrop for speed;
    // the WebGL boot itself is covered by the smoke test.)
    let skipGl = false;
    try { skipGl = localStorage.getItem('wwtbane.nogl') === '1'; } catch { /* ignore */ }
    if (skipGl) this.roots.fallback.classList.remove('hidden');
    try {
      if (skipGl) throw new Error('gl skipped for test');
      const { Studio } = await import('./studio.js');
      this.studio = new Studio(this.roots.studio, { reducedMotion: this.reduced });
      await this.studio.init();
      this.roots.fallback.classList.add('hidden');
      this.bus.on('*', (data, type) => { if (this.studio) this.studio.react(type, data); });
    } catch (e) {
      console.warn('[wwtbane] WebGL backdrop unavailable, using CSS fallback', e);
      this.roots.fallback.classList.remove('hidden');
    }

    // Audio reacts to the same event stream.
    this.bus.on('answer:correct', (d) => this.audio.play(d.boundary ? 'bank' : 'correct'));
    this.bus.on('answer:wrong', () => this.audio.play('wrong'));
    this.bus.on('lifeline:use', () => this.audio.play('lifeline'));
    this.bus.on('run:win', () => this.audio.play('win'));
    this.bus.on('question:show', (d) => { if (d.isFinal) this._markFinalReached(); });

    window.addEventListener('keydown', this._onKey);
    this._installTestHook();
    this.showTitle();
  }

  // Test-only seam, active ONLY when localStorage 'wwtbane.e2e' === '1'. Lets the
  // headless E2E test drive a real run. Never present in normal play, so it can
  // never leak answer keys to a player who did not opt in.
  _installTestHook() {
    try {
      if (localStorage.getItem('wwtbane.e2e') !== '1') return;
    } catch { return; }
    window.__wwt = {
      screen: () => this.screen,
      wallet: () => this.save.wallet,
      answer: () => (this.rc ? this.rc.current().q.answer.slice() : null),
      number: () => (this.rc ? this.rc.current().number : null),
      won: () => (this.rc ? this.rc.won : false),
    };
  }

  /* ---------------- navigation ---------------- */

  _swap(el) {
    clear(this.roots.screen);
    this.roots.screen.append(el);
    this.roots.screen.scrollTop = 0;
    // Move focus to the new screen's heading so keyboard/screen-reader users
    // land in the right place after navigation.
    const focusTarget = el.querySelector('h1, h2') || el;
    if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
  }

  showTitle() {
    this.screen = 'title';
    if (this.studio) this.studio.react('scene:studio');
    this._swap(TitleScreen({
      wallet: this.save.wallet,
      stats: this.save.stats,
      onStart: (mode, seed) => this.startRun(mode, seed),
      onGreenRoom: () => this.showGreenRoom(),
      onHelp: () => this._swap(HelpScreen(() => this.showTitle())),
      onSettings: () => this.showSettings(),
    }));
  }

  showSettings() {
    this._swap(SettingsScreen({
      settings: this.save.settings,
      onChange: (k, v) => { this.save.settings[k] = v; this._applySettings(); this.persist(); this.showSettings(); },
      onReset: () => { if (confirm('Reset ALL progress on this device? This cannot be undone.')) { this.save = persistence.resetAll(); this.campaign = null; this.showTitle(); } },
      onClose: () => this.showTitle(),
    }));
  }

  showGreenRoom() {
    this.screen = 'greenroom';
    this._ensureCampaign();
    if (this.studio) this.studio.react('scene:green');
    // Fresh Steve availability each visit.
    if (!this.steveVisit.locked) {
      const q = this.campaign.peekUpcomingHard(new Set(this.save.steveTaught));
      this.steveVisit = { called: false, locked: false, question: q, clue: q ? q.steveClue : '' };
    }
    this._renderGreenRoom();
  }

  _renderGreenRoom() {
    this._swap(GreenRoom({
      wallet: this.save.wallet,
      lifelines: this.save.lifelines,
      steve: {
        question: this.steveVisit.question,
        calledThisVisit: this.steveVisit.called,
        clue: this.steveVisit.clue,
      },
      onBuySlot: (type) => this._buySlot(type),
      onRefill: () => this._refill(),
      onCallSteve: () => this._callSteve(),
      onEnterStudio: () => this.startRun('mastery', null),
      onBack: () => this.showTitle(),
    }));
  }

  _buySlot(type) {
    const l = this.save.lifelines[type];
    if (l.slots >= LIFELINE_MAX_SLOTS || this.save.wallet < SHOP.lifelineSlot) return;
    this.save.wallet -= SHOP.lifelineSlot;
    l.slots += 1; l.charges += 1; // the new slot comes charged
    this.audio.play('lifeline');
    this.persist(); this._renderGreenRoom();
  }

  _refill() {
    const needs = Object.values(this.save.lifelines).some((l) => l.charges < l.slots);
    if (!needs || this.save.wallet < SHOP.refillAll) return;
    this.save.wallet -= SHOP.refillAll;
    for (const l of Object.values(this.save.lifelines)) l.charges = l.slots;
    this.audio.play('bank');
    this.persist(); this._renderGreenRoom();
  }

  _callSteve() {
    if (this.steveVisit.called || !this.steveVisit.question || this.save.wallet < SHOP.steve) return;
    this.save.wallet -= SHOP.steve;
    this.steveVisit.called = true;
    this.steveVisit.locked = true; // don't re-roll his question until next real visit
    if (!this.save.steveTaught.includes(this.steveVisit.question.id)) {
      this.save.steveTaught.push(this.steveVisit.question.id);
    }
    this.audio.play('lifeline');
    this.persist(); this._renderGreenRoom();
  }

  /* ---------------- run lifecycle ---------------- */

  _ensureCampaign() {
    if (this.campaign) return;
    this.campaign = new SetManager({
      bank: this.bank,
      getMastery: () => this.save.mastery,
      mode: 'mastery',
      reachedFinalBefore: true, // finals handled by the impossible-swap below
    });
    this.campaign.init();
  }

  startRun(mode, seedInput) {
    let set, seed;
    if (mode === 'seeded') {
      seed = (seedInput && seedInput.length ? seedInput : generateSeedString()).toUpperCase();
      const sm = new SetManager({ bank: this.bank, getMastery: () => this.save.mastery, mode: 'seeded', seed, reachedFinalBefore: true });
      sm.init();
      set = sm.current();
      this._seededManager = sm;
    } else {
      this._ensureCampaign();
      seed = null;
      set = this.campaign.current();
    }

    // Impossible first final: the very first time the player ever reaches Q30,
    // swap in a genuinely obscure real question. Gated on a persisted flag.
    if (!this.save.flags.reachedFinalBefore) {
      const impossibles = this.bank.filter((q) => q.impossible);
      if (impossibles.length) {
        const pick = impossibles[Math.floor(Math.random() * impossibles.length)];
        set = set.slice();
        set[29] = pick;
      }
    }

    this.steveVisit.locked = false; // next green-room visit re-rolls Steve
    this.mode = mode; this.seed = seed;
    // Lifelines: run works off (and depletes) the saved charges.
    this.rc = new RunController({
      set,
      mastery: this.save.mastery,
      lifelines: this.save.lifelines,
      seed: seed || 'mastery',
      mode,
      runIndex: this.save.stats.runs,
      emit: (t, d) => this.bus.emit(t, d),
    });
    this.hud.setSeed && this.hud.setSeed(seed);
    this.screen = 'quiz';
    this.quiz.mount(this.roots.screen, this.hud.el);
    this.audio.resume();
    const cur = this.rc.start();
    this.quiz.showQuestion(cur, this.rc.snapshot());
    this.hud.update(this.rc.snapshot());
    this._announce(`Question 1 of 30. ${cur.q.stem}`);
  }

  useLifeline(type) {
    if (!this.rc) return;
    const out = this.rc.useLifeline(type);
    if (!out) return;
    this.quiz.applyLifeline(out.type, out.payload);
    this.hud.update(this.rc.snapshot());
    this.persist(); // charge spent
  }

  answer(indices) {
    if (!this.rc) return;
    const result = this.rc.answer(indices);
    this.hud.update(this.rc.snapshot());
    this.quiz.showFeedback(result);
    // Mastery + lifeline charges changed this turn.
    this.save.stats.questionsAnswered += 1;
    this.persist();
    this._announce(result.correct ? 'Correct.' : 'Wrong. ' + this._answerText(result.q, result.correctAnswer));
  }

  continueAfter(result) {
    if (result.won) return this.endRun(true, result);
    if (result.correct === false) return this.endRun(false, result);
    const cur = this.rc.advance();
    if (!cur) return this.endRun(false, result);
    this.quiz.showQuestion(cur, this.rc.snapshot());
    this.hud.update(this.rc.snapshot());
    this._announce(`Question ${cur.number} of 30. ${cur.q.stem}`);
  }

  endRun(won, result) {
    const pay = won ? result.payout : (result ? result.payout : payout({ clearedCount: this.rc.clearedCount, won: false }));
    this.save.wallet += pay || 0;
    this.save.stats.runs += 1;
    if (won) this.save.stats.wins += 1;
    this.save.stats.bestPayout = Math.max(this.save.stats.bestPayout, pay || 0);
    this.save.stats.longestStreak = Math.max(this.save.stats.longestStreak, this.rc.clearedCount);
    // Advance the mastery campaign's double buffer for the next run.
    if (this.mode !== 'seeded' && this.campaign) this.campaign.advance();
    this.persist();

    const impossibleFinal = !won && result && result.wasFinal && result.wasImpossible;
    this._swap(ResultScreen({
      won,
      payout: pay || 0,
      wallet: this.save.wallet,
      reached: this.rc.clearedCount,
      impossibleFinal,
      correctText: !won && result ? this._answerText(result.q, result.correctAnswer) : null,
      explanation: !won && result ? result.explanation : null,
      onGreenRoom: () => this.showGreenRoom(),
      onPrestige: () => { this.save = persistence.prestige(this.save); this.campaign = null; this.persist(); this.showTitle(); },
      onTitle: () => this.showTitle(),
    }));
    this.screen = 'result';
    this.rc = null;
  }

  /* ---------------- helpers ---------------- */

  _markFinalReached() {
    if (!this.save.flags.reachedFinalBefore) {
      this.save.flags.reachedFinalBefore = true;
      this.persist();
    }
  }

  _answerText(q, indices) {
    if (!q) return '';
    return indices.map((i) => `${letter(i)}: ${q.options[i]}`).join('  ·  ');
  }

  persist() { persistence.save(this.save); }

  _resolveReduced() {
    const m = this.save.settings.motion;
    if (m === 'reduced') return true;
    if (m === 'full') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _applySettings() {
    this.reduced = this._resolveReduced();
    if (this.studio) this.studio.reduced = this.reduced;
    this.audio.setEnabled(this.save.settings.sound);
    this._applyBodyClasses();
  }

  _applyBodyClasses() {
    document.body.classList.toggle('high-contrast', !!this.save.settings.highContrast);
    document.body.classList.toggle('reduced-motion', this.reduced);
  }

  _handleKey(e) {
    if (this.screen === 'quiz' && this.quiz) this.quiz.handleKey(e);
  }

  _announce(msg) { if (this.roots.announce) this.roots.announce.textContent = msg; }

  _fatal(msg) {
    this._swap(h('section', { class: 'screen fatal' },
      h('h2', {}, 'Could not start'),
      h('p', {}, msg)));
  }
}
