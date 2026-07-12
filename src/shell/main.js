// main.js — the browser entry point. Wires the pure core to the DOM overlay, the
// WebGL backdrop, audio, and persistence. Owns navigation between screens.
//
// The quiz is always playable as DOM even if WebGL fails to start.

import { createBus } from '../core/eventBus.js';
import { validateBank } from '../core/questionSchema.js';
import { SetManager } from '../core/selection.js';
import { RunController } from '../core/runController.js';
import { generateSeedString, normalizeSeed } from '../core/rng.js';
import { payout } from '../core/coins.js';
import { SHOP, LIFELINE_MAX_SLOTS } from '../core/config.js';
import { letter } from '../core/lifelines.js';
import { pickWelcome, pickQuestionLine, pickBankLine, pickTierLine } from './hostLines.js';

import * as persistence from './persistence.js';
import { GameAudio } from './audio.js';
import { Music, MUSIC_STYLES } from './music.js';
import { installFpsMeter } from './fpsMeter.js';
import { CssBackdrop } from './backdrop.js';
import { Hud } from './ui/hud.js';
import { QuizScreen } from './ui/overlay.js';
import { Cinematic } from './ui/cinematic.js';
import { playSteveCutscene } from './ui/steveCutscene.js';
import { TitleScreen, GreenRoom, ResultScreen, HelpScreen, SettingsScreen } from './ui/screens.js';
import { h, clear, money } from './ui/dom.js';

import { QUESTIONS } from '../content/questions.js';

export class Game {
  constructor(roots) {
    this.roots = roots; // { studio, screen, announce, fallback }
    this.bus = createBus();
    this.save = persistence.load();
    this.audio = new GameAudio({ enabled: this.save.settings.sound });
    this.music = new Music({ enabled: this.save.settings.music !== false, style: this.save.settings.musicStyle || 'studio' });
    this.bank = null;
    this.campaign = null;      // persistent mastery SetManager
    this.rc = null;
    this._greenReveal = null;  // loss info shown in the green room
    this._lastShownTier = null; // tracks tier crossings for the host's congrats beat
    this.hud = new Hud({
      onLifeline: (t) => this.useLifeline(t),
      onPause: () => this.togglePause(),
    });
    this.quiz = new QuizScreen({
      onAnswer: (idx) => this.answer(idx),
      onContinue: (r) => this.continueAfter(r),
      onSelectSound: () => this.audio.play('select'),
      onReveal: () => this.audio.play('reveal'),
      onLockSound: () => { this.audio.play('lock'); this.music.pop(); },
      // The suspense beat: duck the tier loop for its whole length, and roll
      // the snare under the hard round and the final.
      onSuspense: ({ ms, tier, isFinal }) => {
        this.music.duck((ms + 1400) / 1000, 0.25);
        if (tier === 'hard' || isFinal) this.music.drumRoll(ms / 1000);
        this.bus.emit('ui:lockin', {}); // studio dims to the lock-in tension pool
      },
      onLifelineDone: () => this.music.pop(),
    });
    this.steveVisit = { called: false, question: null, clue: '' };
    this.reduced = this._resolveReduced();
    this._onKey = (e) => this._handleKey(e);
  }

  async boot() {
    // Dev-only FPS meter for the graphics performance budget (?fps=1 / Alt+F).
    installFpsMeter();

    // Scene preview tool: ?scene=thinking&take=5 jumps the camera director
    // straight to a scene/take for review (docs/CINEMATIC_TAKES.md).
    const params = new URLSearchParams(window.location.search);
    if (params.has('scene')) return this._previewMode(params);

    // Dev tools: normally toggled on from Settings ("Developer tools"). ?dev=1 is
    // a convenience shortcut that flips the same persisted flag.
    if (params.get('dev') === '1' && !this.save.settings.dev) { this.save.settings.dev = true; this.persist(); }

    // Validate the shipped bank; play with whatever is structurally valid.
    const res = validateBank(QUESTIONS);
    this.bank = res.valid;
    if (res.rejected.length) console.warn('[wwtbane] rejected questions:', res.rejected);
    if (this.bank.length < 30) {
      this._fatal(`The question bank is too small to play (${this.bank.length} valid). Need at least 30.`);
      return;
    }

    this._applyBodyClasses();

    // Browsers require a user gesture before audio can start — register the
    // unlock FIRST so a click during the (async) WebGL boot still counts, and
    // show a small hint so the silent title screen explains itself.
    // The listeners are PERMANENT: a context can re-suspend (backgrounded tab,
    // mobile route change), and a once-only unlock left the game silent for
    // good — every later gesture now re-resumes a suspended context.
    const hint = h('div', { class: 'sound-hint' }, '🔊 Click anywhere for sound');
    if (this.save.settings.music !== false || this.save.settings.sound) document.body.append(hint);
    const kick = () => {
      hint.remove();
      this.audio.resume(); this.music.resume();
      if ((this.screen === 'title' || this.screen === 'greenroom') && !this.music.currentName) {
        this.music.play('lounge');
      }
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) { this.audio.resume(); this.music.resume(); }
    });

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
      this.studio = new Studio(this.roots.studio, {
        reducedMotion: this.reduced,
        postFx: this.save.settings.postFx !== false,
        onAmbient: (k) => this.audio.play(k), // diegetic crowd sounds (a cough)
      });
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
      // Crossing into a harder tier: the host congratulates + warns instead of the
      // generic read-out quip (the final keeps its own FINAL_LINE via _hostQuip).
      const tierLine = (!d.isFinal && this._lastShownTier && d.tier !== this._lastShownTier)
        ? pickTierLine(d.tier) : null;
      this._lastShownTier = d.tier;
      if (tierLine) this._hostSay(tierLine, { announce: true });
      else this._hostQuip(d);
    });
    this.bus.on('scene:green', () => this.music.play('lounge'));
    this.bus.on('scene:studio', () => { if (this.screen !== 'quiz') this.music.play('lounge'); });

    // HUD flourishes: banking particles + shield stamp, and the win ★ burst.
    // The host also pauses to celebrate the safe haven and steady the player.
    this.bus.on('coins:bank', () => {
      if (this.rc) this.hud.bank(this.rc.index);
      this._hostSay(pickBankLine(), { announce: true });
    });
    this.bus.on('run:win', () => this.hud.burst());

    window.addEventListener('keydown', this._onKey);
    this._installTestHook();

    // Challenge links: ?seed=NTNX-XXXXXX drops straight into that seeded run
    // (same 30 questions for anyone — CLAUDE.md §3). First-time visitors still
    // get the tutorial first.
    const linkSeed = normalizeSeed(params.get('seed') || '');
    if (linkSeed) this.startRun('seeded', linkSeed);
    else this.showTitle();
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

  // A quick branded gradient wipe over the top-level screen changes (no hard
  // cuts). Skipped under reduced motion / effects-off. Self-removing.
  _wipe() {
    if (this.reduced || this.save.settings.postFx === false) return;
    const w = h('div', { class: 'screen-wipe', 'aria-hidden': 'true' });
    document.body.appendChild(w);
    setTimeout(() => w.remove(), 650);
  }

  showTitle() {
    this._wipe();
    this.screen = 'title';
    this._clearQuip();
    this._greenReveal = null; // a loss reveal never survives leaving to the title
    this.bus.emit('scene:studio', {});
    this._swap(TitleScreen({
      wallet: this.save.wallet,
      stats: this.save.stats,
      music: this.save.settings.music !== false,
      onStart: (mode, seed) => this.startRun(mode, seed),
      onGreenRoom: () => this.showGreenRoom(),
      onHelp: () => this._swap(HelpScreen(() => this.showTitle())),
      onSettings: () => this.showSettings(),
      onToggleMusic: () => {
        this.save.settings.music = this.save.settings.music === false; // flip (default on)
        this._applySettings(); // mutes, or resumes the lounge if turning on
        this.persist();
        this.showTitle(); // refresh the button label
      },
    }));
  }

  showSettings() {
    this._swap(SettingsScreen({
      settings: this.save.settings,
      audioStatus: this._audioStatus(),
      dev: !!this.save.settings.dev,
      wallet: this.save.wallet,
      onDevAddCoins: (n) => { this.save.wallet = Math.max(0, this.save.wallet + n); this.persist(); this.showSettings(); },
      onDevStartAt: (n) => this._devStartAt(n),
      onChange: (k, v) => { this.save.settings[k] = v; this._applySettings(); this.persist(); this.showSettings(); },
      onReset: () => {
        if (!confirm('Reset ALL progress? This wipes your mastery, coins, lifelines and history and starts you over as a first-time player (the intro plays again). This cannot be undone.')) return;
        this.save = persistence.resetAll();
        // clear every derived / in-memory bit so nothing survives the wipe
        this.campaign = null; this.rc = null;
        this.steveVisit = { called: false, question: null, clue: '' };
        this._greenReveal = null; this._lastShownTier = null;
        this._applySettings(); // re-apply the fresh default motion / contrast / audio
        this.showTitle();
      },
      onExport: () => persistence.exportString(this.save),
      onImport: (raw) => {
        const imported = persistence.importString(raw);
        if (!imported) { alert('That save code could not be read — paste the whole code, exactly as exported.'); return; }
        if (!confirm('Import this save? It replaces ALL progress on this device.')) return;
        this.save = imported;
        this.campaign = null; // rebuild question sets from the imported mastery
        persistence.save(this.save);
        this._applySettings();
        this.showTitle();
        this._announce('Save imported.');
      },
      onClose: () => this.showTitle(),
    }));
  }

  showGreenRoom() {
    if (this.screen !== 'greenroom') this._wipe(); // wipe on entry, not on shop re-renders
    this.screen = 'greenroom';
    this._clearQuip();
    this._ensureCampaign();
    this.bus.emit('scene:green', {});
    // Fresh Steve availability each visit.
    if (!this.steveVisit.locked) {
      const q = this.campaign.peekUpcomingHard(new Set(this.save.steveTaught));
      // Belt-and-braces: selection only returns clue-carrying questions, but a
      // missing clue must never reach the UI as the string "undefined".
      this.steveVisit = { called: false, locked: false, question: q, clue: (q && q.steveClue) || '' };
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
      onEnterStudio: () => this._managerBeat(),
      onBack: () => this.showTitle(),
    }));
  }

  // "Start next round": the stage manager opens the green-room door, stands by
  // it, and a speech bubble pops — then the show cuts back to the studio.
  _managerBeat() {
    if (this._managerBusy) return;
    this._managerBusy = true;
    clear(this.roots.screen); // let the doorway play out uncovered
    this.bus.emit('green:manager', {});
    this.audio.play('select');
    const line = "We're ready for you back in the Hot Seat!";
    this._announce(`Stage manager: ${line}`);
    const bubble = h('div', { class: 'speech-bubble', 'aria-hidden': 'true' },
      h('span', { class: 'speech-who' }, 'Stage manager'), line);
    const doorMs = this.reduced ? 0 : 1200;   // bubble pops once the door is open
    const readMs = this.reduced ? 1600 : 2600; // a beat to read it
    setTimeout(() => this.roots.screen.append(bubble), doorMs);
    setTimeout(() => {
      bubble.remove();
      this._managerBusy = false;
      this.startRun('mastery', null);
    }, doorMs + readMs);
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
    // The paid promise survives a reload: until this question appears in a run,
    // a rebuilt campaign pins it back into the upcoming set (_ensureCampaign).
    this.save.stevePending = this.steveVisit.question.id;
    this.audio.play('lifeline');
    this.persist();
    this._renderGreenRoom(); // the clue now lives in the panel underneath…
    // …and the split-screen cutscene plays over it, lifting to reveal it.
    playSteveCutscene(this.roots.screen, { clue: this.steveVisit.clue, reduced: this.reduced });
  }

  /* ---------------- run lifecycle ---------------- */

  _ensureCampaign() {
    if (this.campaign) return;
    this.campaign = new SetManager({
      bank: this.bank,
      getMastery: () => this.save.mastery,
      mode: 'mastery',
      reachedFinalBefore: true, // finals handled by the impossible-swap below
      // Staleness clock = the same counter record() stamps into lastRun, so
      // "less recently seen" survives prestige/import campaign rebuilds.
      getRunIndex: () => this.save.stats.runs,
    });
    this.campaign.init();
    // Steve's paid, not-yet-delivered clue: the rebuilt set almost certainly
    // dropped that question — pin it back so the promise (CLAUDE.md §3:
    // "a real, guaranteed-upcoming question") holds across sessions.
    if (this.save.stevePending) {
      const pending = this.bank.find((q) => q.id === this.save.stevePending);
      if (pending) this.campaign.pinIntoCurrent(pending);
      else { this.save.stevePending = null; this.persist(); } // question left the bank
    }
  }

  startRun(mode, seedInput) {
    let set, seed;
    if (mode === 'seeded') {
      // One normalization for typed seeds and ?seed= links, so the same code
      // always reproduces the same run.
      seed = normalizeSeed(seedInput || '') || generateSeedString();
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
    // Steve's promise is delivered the moment his question enters a live run.
    if (this.save.stevePending && set.some((q) => q.id === this.save.stevePending)) {
      this.save.stevePending = null;
      this.persist();
    }
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

    // A pending dev jump (from "Start run at question N") skips the intro/welcome
    // and drops straight onto the chosen question.
    const devJump = this._devJumpTarget; this._devJumpTarget = null;

    const beginPlay = () => {
      this._wipe(); // branded transition into the studio
      this._lastShownTier = null; // fresh run: the first tier crossing is Q11
      this.screen = 'quiz';
      this.quiz.mount(this.roots.screen, this.hud.el);
      this.audio.resume();
      this.rc.start();
      const cur = devJump && devJump > 1 ? this.rc.devJumpTo(devJump) : this.rc.current();
      this.quiz.showQuestion(cur, this.rc.snapshot());
      this.hud.update(this.rc.snapshot());
      this._announce(`Question ${cur.number} of 30. ${cur.q.stem}`);
    };

    // First run ever: the host gives a tour of the soundstage, then walks the
    // player through the UI on the real first question (and gives the answer).
    // Every run after that opens with him welcoming the player back instead.
    // A dev jump skips the ceremony so playtesting is one click.
    if (devJump) beginPlay();
    else if (!this.save.flags.seenIntro) this._playIntro(beginPlay);
    else this._welcomeBeat(beginPlay);
  }

  // The host welcomes the player back to the Hot Seat — a different line each
  // run, drifting snarky once the attempts pile up (authored copy, FLAGS.md).
  _welcomeBeat(beginPlay) {
    this.screen = 'cinematic';
    clear(this.roots.screen);
    this.bus.emit('scene:studio', {});
    this.bus.emit('host:welcome', {});
    const { text, key } = pickWelcome({ runs: this.save.stats.runs, last: this.save.lastWelcome });
    this.save.lastWelcome = key;
    this.persist();
    this._announce(`Host: ${text}`);
    const bubble = h('div', { class: 'speech-bubble host', 'aria-hidden': 'true' },
      h('span', { class: 'speech-who' }, 'Host'), text);
    const showMs = this.reduced ? 200 : 900;   // bubble pops once the camera settles
    const holdMs = this.reduced ? 1200 : 3000; // a beat to read it
    setTimeout(() => this.roots.screen.append(bubble), showMs);
    setTimeout(() => { bubble.remove(); beginPlay(); }, showMs + holdMs);
  }

  // A short host quip as each question is read out — his voice, never the
  // question or answers (those stay in the DOM card).
  _clearQuip() {
    if (this._quipEl) { this._quipEl.remove(); this._quipEl = null; }
  }

  _hostQuip(d) {
    this._hostSay(pickQuestionLine({ isFinal: d.isFinal }));
  }

  // Show a host speech bubble — the read-out quip, or a congrats beat on a bank /
  // tier crossing. The meaningful beats announce to the live region and hold a
  // little longer; all of it is skipped while the tutorial host is mid-sentence.
  _hostSay(line, { announce = false, ms } = {}) {
    if (document.querySelector('.cine-layer')) return;
    this._clearQuip();
    const el = h('div', { class: 'speech-bubble host quip', 'aria-hidden': 'true' },
      h('span', { class: 'speech-who' }, 'Host'), line);
    document.body.append(el);
    this._quipEl = el;
    if (announce) this._announce(`Host: ${line}`);
    const hold = ms != null ? ms : (announce ? (this.reduced ? 2000 : 3800) : (this.reduced ? 1600 : 2800));
    setTimeout(() => { el.remove(); if (this._quipEl === el) this._quipEl = null; }, hold);
  }

  /* ---------------- pause menu ---------------- */

  togglePause() {
    if (this._pauseEl) return this._closePause();
    if (this.screen !== 'quiz') return;
    this._clearQuip(); // no host chatter floating over the menu
    if (this.quiz) this.quiz.onPause(); // park a pending lock-in + clear its bubble
    const seed = this.seed;
    const toggle = (key, label, desc) => {
      const input = h('input', { type: 'checkbox', checked: !!this.save.settings[key],
        onchange: (e) => { this.save.settings[key] = e.target.checked; this._applySettings(); this.persist(); } });
      return h('label', { class: 'setting' }, input,
        h('span', {}, h('b', {}, label), h('span', { class: 'muted small' }, desc)));
    };
    const copier = (label, value) => {
      const btn = h('button', { class: 'secondary small', type: 'button' }, label);
      btn.onclick = async () => {
        try { await navigator.clipboard.writeText(value); btn.textContent = 'Copied ✓'; }
        catch { btn.textContent = value; } // clipboard blocked: show it to hand-copy
      };
      return btn;
    };
    const challengeUrl = seed
      ? `${location.origin}${location.pathname}?seed=${encodeURIComponent(seed)}`
      : null;
    const styleSel = h('label', { class: 'setting' },
      h('select', { class: 'motion-select', 'aria-label': 'Music style',
        onchange: (e) => { this.save.settings.musicStyle = e.target.value; this._applySettings(); this.persist(); } },
        ...MUSIC_STYLES.map((s) => h('option', { value: s.id, selected: (this.save.settings.musicStyle || 'studio') === s.id }, s.label))),
      h('span', {}, h('b', {}, 'Music style'), h('span', { class: 'muted small' }, 'Switches instantly.')));
    const panel = h('section', { class: 'pause-panel panel', role: 'dialog', 'aria-label': 'Pause menu' },
      h('h2', { class: 'screen-title' }, 'Paused'),
      toggle('music', 'Music', 'The lounge and tier loops.'),
      toggle('sound', 'Sound effects', 'Picking, locking, lifelines.'),
      styleSel,
      h('p', { class: 'muted small audio-status' }, this._audioStatus()),
      h('div', { class: 'pause-seed' },
        seed
          ? [h('span', { class: 'muted small' }, 'Seed — anyone who plays it gets this exact run'),
             h('code', {}, seed), copier('Copy seed', seed), copier('Copy challenge link', challengeUrl)]
          : h('span', { class: 'muted small' }, 'Mastery run — questions adapt to you, so there is no seed to share. Use "Enter seed" on the title screen for a replayable run.')),
      this.save.settings.dev ? this._pauseDevBlock() : null,
      h('div', { class: 'menu' },
        h('button', { class: 'primary', type: 'button', onclick: () => this._closePause() }, 'Resume'),
        h('button', { class: 'ghost small', type: 'button', onclick: () => {
          if (confirm('Quit this run? Coins not yet banked are lost.')) { if (this.quiz) this.quiz.abortPending(); this._closePause(); this.rc = null; this.showTitle(); }
        } }, 'Quit to title'),
      ));
    this._pauseEl = h('div', { class: 'pause-layer' }, panel);
    this.roots.screen.append(this._pauseEl);
    const focusTarget = panel.querySelector('h2');
    if (focusTarget) { focusTarget.setAttribute('tabindex', '-1'); focusTarget.focus({ preventScroll: true }); }
  }

  _closePause() {
    if (this._pauseEl) { this._pauseEl.remove(); this._pauseEl = null; }
    if (this.quiz) this.quiz.onResume(); // re-arm any parked lock-in submit
  }

  // Playtesting block for the pause menu (settings.dev only): add coins and jump
  // to any question in the current run. Coins land in the between-run wallet.
  _pauseDevBlock() {
    const walletLabel = h('span', { class: 'muted small' }, `Wallet: ${money(this.save.wallet)} coins`);
    const addCoins = (n) => {
      this.save.wallet = Math.max(0, this.save.wallet + n);
      this.persist();
      walletLabel.textContent = `Wallet: ${money(this.save.wallet)} coins`;
    };
    const jumpInput = h('input', {
      id: 'dev-jump-input', class: 'dev-jump', type: 'number', min: '1', max: '30',
      value: String(this.rc ? this.rc.current().number : 1), 'aria-label': 'Jump to question number',
    });
    const jump = () => {
      const n = parseInt(jumpInput.value, 10);
      if (!Number.isFinite(n)) return;
      this._closePause();
      this.devJumpTo(n);
    };
    return h('div', { class: 'dev-tools' },
      h('b', {}, '🛠 Developer'),
      walletLabel,
      h('div', { class: 'dev-row' },
        h('button', { class: 'secondary small', type: 'button', onclick: () => addCoins(1000) }, '+1,000 coins'),
        h('button', { class: 'secondary small', type: 'button', onclick: () => addCoins(10000) }, '+10,000 coins')),
      h('div', { class: 'dev-row' },
        h('label', { class: 'muted small', for: 'dev-jump-input' }, 'Jump to question'),
        jumpInput,
        h('button', { class: 'secondary small', type: 'button', onclick: jump }, 'Go')));
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

  /* ---------------- dev tools (settings.dev) ---------------- */

  // Start a fresh mastery run and drop straight onto question N. Used from the
  // Settings dev panel (there is no active run there). The jump itself happens
  // in startRun's beginPlay via _devJumpTarget.
  _devStartAt(n) {
    this._devJumpTarget = Math.max(1, Math.min(30, Math.floor(n) || 1));
    this.startRun('mastery', null); // beginPlay replaces the settings screen
  }

  // Jump the CURRENT run to question N (from the pause menu). Clears any parked
  // lock-in so a stale submit can't fire against the new question.
  devJumpTo(n) {
    if (!this.rc) return;
    if (this.quiz) this.quiz.abortPending();
    const cur = this.rc.devJumpTo(n);
    this.quiz.showQuestion(cur, this.rc.snapshot());
    this.hud.update(this.rc.snapshot());
    this._announce(`Question ${cur.number} of 30. ${cur.q.stem}`);
  }

  answer(indices) {
    if (!this.rc) return;
    const result = this.rc.answer(indices);
    if (!result) return; // dead run / double submit — core refused the grade
    this.hud.update(this.rc.snapshot());
    this.quiz.showFeedback(result);
    // Mastery + lifeline charges changed this turn.
    this.save.stats.questionsAnswered += 1;
    this.persist();
    this._announce(result.correct ? 'Correct.' : 'Wrong. ' + this._answerText(result.q, result.correctAnswer));
  }

  continueAfter(result) {
    if (this._advancing) return; // re-entrancy guard (double Enter / click)
    this._advancing = true;
    try {
      this._continueAfter(result);
    } finally { this._advancing = false; }
  }

  _continueAfter(result) {
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
      pickedNote: result ? this._pickedNote(result) : null,
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

  // The source exam's note for the (wrong) option the player picked — shown in
  // the green-room reveal so the miss teaches. Authored content, never generated.
  _pickedNote(result) {
    const q = result.q;
    if (!q || !Array.isArray(q.optionNotes) || !Array.isArray(result.selected)) return null;
    const wrongPicks = result.selected.filter((i) => !result.correctAnswer.includes(i));
    const notes = wrongPicks.map((i) => q.optionNotes[i]).filter(Boolean)
      .map((n, k) => (wrongPicks.length > 1 ? `${letter(wrongPicks[k])}: ${n}` : n));
    return notes.length ? notes.join('  ·  ') : null;
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
    if (this.studio) { this.studio.reduced = this.reduced; this.studio.postFx = this.save.settings.postFx !== false; }
    this.audio.setEnabled(this.save.settings.sound);
    this.music.setEnabled(this.save.settings.music !== false);
    if (this.music.style !== (this.save.settings.musicStyle || 'studio')) {
      this.music.setStyle(this.save.settings.musicStyle || 'studio');
    }
    if (this.save.settings.music !== false) {
      if (this.screen === 'title' || this.screen === 'greenroom') {
        this.music.play('lounge');
      } else if (this.screen === 'quiz' && this.rc) {
        // Re-enabling music mid-run resumes the right tier loop immediately
        // (it used to stay silent until the next question).
        const cur = this.rc.current();
        this.music.play(cur.isFinal ? 'final' : cur.tier);
      }
    }
    this._applyBodyClasses();
  }

  // A human-readable line about the audio engine, for the pause menu and
  // settings — makes "the audio is missing" diagnosable at a glance.
  _audioStatus() {
    const ctx = this.music.ctx || this.audio.ctx;
    if (!ctx) return 'Audio has not started yet — it begins on your first click or key press (browser rule).';
    if (ctx.state === 'suspended') return 'Audio is paused by the browser — click anywhere to resume it.';
    if (ctx.state === 'running') return 'Audio engine: running. If you hear nothing, check the toggles above, the tab’s mute flag, and the device volume/mute switch.';
    return `Audio engine: ${ctx.state}.`;
  }

  _applyBodyClasses() {
    document.body.classList.toggle('high-contrast', !!this.save.settings.highContrast);
    document.body.classList.toggle('reduced-motion', this.reduced);
  }

  _handleKey(e) {
    if (e.key === 'Escape' && (this._pauseEl || this.screen === 'quiz')) {
      this.togglePause();
      e.preventDefault();
      return;
    }
    if (this._pauseEl) return; // the pause menu swallows quiz keys
    if (this.screen === 'quiz' && this.quiz) this.quiz.handleKey(e);
  }

  _announce(msg) { if (this.roots.announce) this.roots.announce.textContent = msg; }

  _fatal(msg) {
    this._swap(h('section', { class: 'screen fatal' },
      h('h2', {}, 'Could not start'),
      h('p', {}, msg)));
  }
}
