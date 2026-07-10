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
import { Music } from './music.js';
import { CssBackdrop } from './backdrop.js';
import { Hud } from './ui/hud.js';
import { QuizScreen } from './ui/overlay.js';
import { Cinematic } from './ui/cinematic.js';
import { TitleScreen, GreenRoom, ResultScreen, HelpScreen, SettingsScreen } from './ui/screens.js';
import { h, clear } from './ui/dom.js';

import { QUESTIONS } from '../content/questions.js';

export class Game {
  constructor(roots) {
    this.roots = roots; // { studio, screen, announce, fallback }
    this.bus = createBus();
    this.save = persistence.load();
    this.audio = new GameAudio({ enabled: this.save.settings.sound });
    this.music = new Music({ enabled: this.save.settings.music !== false });
    this.bank = null;
    this.campaign = null;      // persistent mastery SetManager
    this.rc = null;
    this._greenReveal = null;  // loss info shown in the green room
    this.hud = new Hud({ onLifeline: (t) => this.useLifeline(t) });
    this.quiz = new QuizScreen({
      onAnswer: (idx) => this.answer(idx),
      onContinue: (r) => this.continueAfter(r),
      onSelectSound: () => this.audio.play('select'),
      onLockSound: () => { this.audio.play('lock'); this.music.pop(); this.music.duck(2.2, 0.25); },
      onLifelineDone: () => this.music.pop(),
    });
    this.steveVisit = { called: false, question: null, clue: '' };
    this.reduced = this._resolveReduced();
    this._onKey = (e) => this._handleKey(e);
  }

  async boot() {
    // Scene preview tool: ?scene=thinking&take=5 jumps the camera director
    // straight to a scene/take for review (docs/CINEMATIC_TAKES.md).
    const params = new URLSearchParams(window.location.search);
    if (params.has('scene')) return this._previewMode(params);

    // Validate the shipped bank; play with whatever is structurally valid.
    const res = validateBank(QUESTIONS);
    this.bank = res.valid;
    if (res.rejected.length) console.warn('[wwtbane] rejected questions:', res.rejected);
    if (this.bank.length < 30) {
      this._fatal(`The question bank is too small to play (${this.bank.length} valid). Need at least 30.`);
      return;
    }

    this._applyBodyClasses();

    // The layered CSS studio is always built into the fallback element; it is
    // shown whenever WebGL is unavailable (or skipped) and reacts to the same
    // event stream as the GL studio (mood tint, camera push, pulses, scenes).
    this.backdrop = new CssBackdrop(this.roots.fallback);
    this.bus.on('*', (data, type) => this.backdrop.react(type, data));

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

    // Audio reacts to the same event stream. Big musical moments (right/wrong/
    // final-wrong/win) are the music engine's stingers; small UI cues stay sfx.
    this.bus.on('answer:correct', (d) => { this.music.stinger('right'); if (d.boundary) this.audio.play('bank'); });
    this.bus.on('answer:wrong', (d) => this.music.stinger(d.index === 29 ? 'finalWrong' : 'wrong'));
    this.bus.on('lifeline:use', () => { this.audio.play('lifeline'); this.music.push('lifeline'); });
    this.bus.on('run:win', () => { this.music.stop(); this.music.stinger('win'); });
    this.bus.on('run:dead', () => this.music.stop());
    this.bus.on('question:show', (d) => {
      if (d.isFinal) this._markFinalReached();
      // Tier loops: quicker and brighter on easy, slower and lower as tiers rise.
      this.music.play(d.isFinal ? 'final' : d.tier);
    });
    this.bus.on('scene:green', () => this.music.play('lounge'));
    this.bus.on('scene:studio', () => { if (this.screen !== 'quiz') this.music.play('lounge'); });

    // Browsers require a user gesture before audio can start.
    const kick = () => {
      this.audio.resume(); this.music.resume();
      if (this.screen === 'title' || this.screen === 'greenroom') this.music.play('lounge');
    };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });

    // HUD flourishes: banking particles + shield stamp, and the win ★ burst.
    this.bus.on('coins:bank', () => { if (this.rc) this.hud.bank(this.rc.index); });
    this.bus.on('run:win', () => this.hud.burst());

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

  // ?scene=<name>[&take=<1-based>] — a review tool for the cinematic takes.
  // WebGL-only (it previews the studio's camera direction), no save, no music.
  async _previewMode(params) {
    this._applyBodyClasses();
    this.backdrop = new CssBackdrop(this.roots.fallback);
    let skipGl = false;
    try { skipGl = localStorage.getItem('wwtbane.nogl') === '1'; } catch { /* ignore */ }
    try {
      if (skipGl) throw new Error('gl skipped');
      const { Studio } = await import('./studio.js');
      this.studio = new Studio(this.roots.studio, { reducedMotion: this.reduced });
      await this.studio.init();
      this.roots.fallback.classList.add('hidden');
    } catch {
      this._fatal('The scene preview needs WebGL (it reviews the 3D studio camera takes).');
      return;
    }
    const { SCENES } = await import('./takes.js');
    const director = this.studio.director;
    director.previewLoop = true; // one-shot scenes repeat while under review

    const start = (name, takeIdx) => director.playAt(name, takeIdx);
    const first = SCENES[params.get('scene')] ? params.get('scene') : 'intro';
    start(first, (parseInt(params.get('take'), 10) || 1) - 1);

    const select = h('select', { class: 'motion-select', 'aria-label': 'Scene',
      onchange: (e) => start(e.target.value, 0) },
      ...Object.keys(SCENES).map((n) => h('option', { value: n, selected: n === first }, n)));
    const infoEl = h('span', { class: 'preview-info' }, '');
    const bar = h('div', { class: 'preview-hud' },
      h('span', { class: 'preview-label' }, 'scene preview'),
      select,
      h('button', { class: 'secondary small', type: 'button', onclick: () => { const i = director.info(); start(i.name, i.take); } }, 'next take ▸'),
      h('button', { class: 'secondary small', type: 'button', onclick: () => { const i = director.info(); start(i.name, 0); } }, 'restart'),
      infoEl,
    );
    clear(this.roots.screen);
    this.roots.screen.append(bar);
    setInterval(() => {
      const i = director.info();
      if (i) infoEl.textContent = `take ${i.take}/${i.takes} · ${i.t.toFixed(1)}s / ${i.dur}s`;
    }, 200);
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
    this.bus.emit('scene:studio', {});
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
    this.bus.emit('scene:green', {});
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
      reveal: this._greenReveal, // set after a loss: the answer + explanation first
      onAckReveal: () => { this._greenReveal = null; this._renderGreenRoom(); },
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
    this.bus.emit('steve:call', {}); // the backdrop cuts to the sketchy guy
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
      // Seeded runs must be fully reproducible — INCLUDING the impossible first
      // final. Pass the flag through so buildSet picks Q30 with the SEEDED rng;
      // two first-time players on the same seed then get the same final.
      const sm = new SetManager({ bank: this.bank, getMastery: () => this.save.mastery, mode: 'seeded', seed, reachedFinalBefore: this.save.flags.reachedFinalBefore });
      sm.init();
      set = sm.current();
      this._seededManager = sm;
    } else {
      this._ensureCampaign();
      seed = null;
      set = this.campaign.current();
      // Impossible first final (mastery only): the campaign double-buffer is built
      // with reachedFinalBefore:true so a prebuilt set can't bake in a stale
      // impossible final, so swap Q30 here while the flag is unset. Mastery play
      // is non-deterministic, so Math.random is appropriate.
      if (!this.save.flags.reachedFinalBefore) {
        const impossibles = this.bank.filter((q) => q.impossible);
        if (impossibles.length) {
          set = set.slice();
          set[29] = impossibles[Math.floor(Math.random() * impossibles.length)];
        }
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

    const beginPlay = () => {
      this.screen = 'quiz';
      this.quiz.mount(this.roots.screen, this.hud.el);
      this.audio.resume();
      const cur = this.rc.start();
      this.quiz.showQuestion(cur, this.rc.snapshot());
      this.hud.update(this.rc.snapshot());
      this._announce(`Question 1 of 30. ${cur.q.stem}`);
    };

    // First run ever: the host gives a tour of the soundstage, then walks the
    // player through the UI on the real first question (and gives the answer).
    if (!this.save.flags.seenIntro) this._playIntro(beginPlay);
    else beginPlay();
  }

  _playIntro(beginPlay) {
    let started = false;
    this.screen = 'cinematic';
    clear(this.roots.screen); // clear the title; the studio is the set
    this.bus.emit('scene:studio', {});
    const cine = new Cinematic({
      onCam: (k) => { if (this.studio) this.studio.cutTo(k); },
      onStartRun: () => { started = true; beginPlay(); },
      answerFor: () => {
        const q = this.rc.set[0];
        const i = q.answer[0];
        return { letter: letter(i), text: q.options[i] };
      },
      // The host's freebie must not promote mastery — mark Q1 assisted.
      onAnswerRevealed: () => { if (this.rc) this.rc.assisted = true; },
      onDone: () => {
        if (!started) beginPlay();
        this.save.flags.seenIntro = true;
        this.persist();
      },
    });
    cine.play();
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
    const prev = this.rc.index;
    const cur = this.rc.advance();
    if (!cur) return this.endRun(false, result);
    this.quiz.showQuestion(cur, this.rc.snapshot());
    this.hud.update(this.rc.snapshot());
    this.hud.trail(prev, 'up'); // gold streak as the highlight climbs
    this._announce(`Question ${cur.number} of 30. ${cur.q.stem}`);
  }

  endRun(won, result) {
    const pay = won ? result.payout : (result ? result.payout : payout({ clearedCount: this.rc.clearedCount, won: false }));
    const reached = this.rc.clearedCount;
    this.save.stats.runs += 1;
    if (won) this.save.stats.wins += 1;
    this.save.stats.bestPayout = Math.max(this.save.stats.bestPayout, pay || 0);
    this.save.stats.longestStreak = Math.max(this.save.stats.longestStreak, reached);

    if (won) {
      // A win banks learning but resets coins and purchased slots (prestige) —
      // applied here so EVERY exit from the win screen starts fresh, not just the
      // "climb again" button. Mastery persists.
      this.save = persistence.prestige(this.save);
      this.campaign = null; // fresh climb from the top on the next run
      this.persist();
      this._swap(ResultScreen({
        won: true,
        payout: pay || 0,
        wallet: this.save.wallet, // 0 — prestige has reset it
        reached,
        onPrestige: () => this.startRun('mastery', null),
        onTitle: () => this.showTitle(),
      }));
      this.screen = 'result';
      this.rc = null;
      return;
    }

    // A loss walks straight back to the green room, where the correct answer
    // and its explanation are waiting (and the pep talk to go again).
    this.save.wallet += pay || 0;
    if (this.mode !== 'seeded' && this.campaign) this.campaign.advance();
    this.persist();
    this._greenReveal = {
      impossibleFinal: !!(result && result.wasFinal && result.wasImpossible),
      correctText: result ? this._answerText(result.q, result.correctAnswer) : null,
      explanation: result ? result.explanation : null,
      reached: reached + 1, // the question that ended the run
      banked: pay || 0,
    };
    this.rc = null;
    this.showGreenRoom();
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
    this.music.setEnabled(this.save.settings.music !== false);
    if (this.save.settings.music !== false && (this.screen === 'title' || this.screen === 'greenroom')) {
      this.music.play('lounge');
    }
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
