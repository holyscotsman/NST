// overlay.js — the DOM quiz overlay (question card, options, lifeline panels,
// feedback), Game A design. Rendered over the studio backdrop; the quiz is
// always real DOM so screen readers and keyboard/touch users get a first-class
// experience. Choreography per docs/DESIGN_BRIEF.md §5:
//   entrance stagger → aqua selection → GOLD lock-in suspense (≤2 breaths)
//   → reveal (mantis stamp / peach shake, correct lights 200ms later).

import { h, clear } from './dom.js';
import { letter } from '../../core/lifelines.js';
import { DOMAIN_LABEL, TIER_LABEL } from './labels.js';
import { readoutPacing } from '../hostLines.js';
import { VOTE_COLORS } from '../../core/config.js';

// The gold lock-in suspense before the reveal. Two 0.9s breaths on the early
// tiers; the hard round and the final hold noticeably longer (with a drum
// roll) to build the anticipation the top of the ladder deserves.
const SUSPENSE_MS = 1700;
const SUSPENSE_HARD_MS = 3000;
const SUSPENSE_FINAL_MS = 3800;
const FIFTY_DONE_MS = 2600;       // 50:50: beat to read the two options removed
const AUDIENCE_DONE_MS = 4400;    // audience: bars grow + a beat to read them
const PHONE_STEP_MS = 2000;       // phone cutscene: 5 lines ≈ 10 seconds
const WRONG_WALK_MS = 2600;       // wrong answer → auto-walk to the green room

function reduced() { return document.body.classList.contains('reduced-motion'); }

// Optional authored diagram/screenshot for a question ({ src, alt, caption? },
// validated by questionSchema). A missing file must never block play — the
// Per-option notes from the source exam (why each distractor is wrong). Shown
// collapsed under the explanation after a correct answer — pure presentation of
// authored content, never generated. Empty notes are skipped.
function optionNotesPanel(q, correctSet) {
  if (!q || !Array.isArray(q.optionNotes)) return null;
  const rows = q.optionNotes
    .map((note, i) => ({ note, i }))
    .filter(({ note, i }) => note && !correctSet.has(i));
  if (!rows.length) return null;
  return h('details', { class: 'fb-notes' },
    h('summary', {}, 'Why the other options are wrong'),
    h('ul', {}, ...rows.map(({ note, i }) =>
      h('li', {}, h('b', {}, letter(i) + ': '), note))),
  );
}

// whole figure removes itself if the image fails to load.
function questionImage(image) {
  const img = h('img', { src: image.src, alt: image.alt, loading: 'lazy' });
  const fig = h('figure', { class: 'q-image' },
    img,
    image.caption ? h('figcaption', {}, image.caption) : null);
  img.addEventListener('error', () => fig.remove());
  return fig;
}

export class QuizScreen {
  constructor(handlers = {}) {
    this.handlers = handlers; // onAnswer(indices), onLifeline(type), onContinue(result), onQuit()
    this.selected = new Set();
    this.locked = false;
    this.removed = new Set();
    this.el = h('section', { class: 'quiz-screen', 'aria-label': 'Quiz' });
    this._timers = [];
    this._roveI = 0;           // roving-tabindex focus stop (single-answer radiogroup)
    this._faBubble = null;     // the "Final answer!" body bubble, so pause can clear it
    this._submitTimer = null;  // pending lock-in submit (parked while paused)
    this._pendingIndices = null;
    this._submitParked = false;
  }

  mount(root, hudEl) {
    clear(root); // replace whatever screen was showing (title/green room)
    clear(this.el);
    this.el.append(hudEl);
    this.cardWrap = h('div', { class: 'q-card-wrap' });
    this.el.append(this.cardWrap);
    root.append(this.el);
  }

  _after(ms, fn) { const id = setTimeout(fn, reduced() ? 0 : ms); this._timers.push(id); return id; }
  // Bumped on every question change; async loops (the audience count-up) check
  // it so they stop writing to nodes from a question that's already gone.
  _clearTimers() { this._timers.forEach(clearTimeout); this._timers = []; this._gen = (this._gen || 0) + 1; }

  showQuestion(current, snapshot) {
    this._clearTimers();
    this.selected.clear();
    this.removed.clear();
    this.locked = false;
    this._roveI = 0;
    this._submitTimer = null; this._pendingIndices = null; this._submitParked = false;
    if (this._faBubble) { this._faBubble.remove(); this._faBubble = null; }
    document.querySelectorAll('.speech-bubble.you').forEach((el) => el.remove());
    const q = current.q;
    this.current = current;

    const multi = q.type === 'multi';
    const banner = current.isFinal
      ? h('div', { class: 'final-banner' }, current.q.impossible
          ? "The final question — nobody's meant to get this one."
          : 'The final question for the top prize')
      : null;

    this.lifelinePanel = h('div', { class: 'lifeline-panel', 'aria-live': 'polite' });

    this.optionsEl = h('ul', { class: 'options', role: multi ? 'group' : 'radiogroup', 'aria-label': 'Answer options' });
    q.options.forEach((opt, i) => {
      const btn = h('button', {
        type: 'button', class: 'option', role: multi ? 'checkbox' : 'radio',
        'aria-checked': 'false', dataset: { i: String(i) },
        onclick: () => this.pick(i),
      },
        h('span', { class: 'opt-letter', 'aria-hidden': 'true' }, letter(i)),
        h('span', { class: 'opt-text' }, opt),
        h('span', { class: 'opt-mark', 'aria-hidden': 'true' }),
      );
      // role=presentation so the <li> doesn't break the radiogroup→radio owned
      // relationship. Roving tabindex is applied as options reveal (single only).
      if (!multi) btn.tabIndex = i === 0 ? 0 : -1;
      this.optionsEl.append(h('li', { role: 'presentation' }, btn));
    });

    this.lockBtn = h('button', {
      class: 'lock-btn', type: 'button', disabled: true,
      onclick: () => this.lock(),
    }, multi ? 'Lock in these answers' : 'Final answer');

    // rebuild the card each question so the entrance choreography re-runs
    this.card = h('div', { class: 'q-card' },
      banner,
      h('div', { class: 'q-meta' },
        h('span', { class: `chip tier tier-${current.tier}` }, `Q${current.number} · ${TIER_LABEL[current.tier]}`),
        h('span', { class: 'chip domain' }, DOMAIN_LABEL[q.domain] || q.domain),
        multi ? h('span', { class: 'chip multi' }, 'Select all that apply') : null,
      ),
      this.lifelinePanel,
      h('h2', { class: 'stem' }, q.stem),
      q.image ? questionImage(q.image) : null,
      this.optionsEl,
      h('div', { class: 'lock-row' }, this.lockBtn),
    );
    clear(this.cardWrap);
    this.cardWrap.append(this.card);

    // The read-out: the stem sits alone long enough to read, then the answers
    // appear one at a time (no text-to-speech — pacing does the "reading").
    // Reduced motion shows everything at once.
    this.revealed = new Set();
    const btns = [...this.optionsEl.querySelectorAll('.option')];
    if (reduced()) {
      btns.forEach((_, i) => this.revealed.add(i));
      this._applyRoving();
    } else {
      const { stemMs, optionGapMs } = readoutPacing(q.stem.length, q.options.length);
      btns.forEach((b) => { b.classList.add('unrevealed'); b.disabled = true; });
      btns.forEach((b, i) => this._after(stemMs + i * optionGapMs, () => {
        this.revealed.add(i);
        b.classList.remove('unrevealed');
        b.style.animationDelay = '0s'; // the reveal IS the stagger
        if (!this.removed.has(i)) b.disabled = false;
        this._applyRoving(); // keep the tab stop on the first live option
        if (this.handlers.onReveal) this.handlers.onReveal(i);
      }));
    }
  }

  /* ---------- radiogroup keyboard model (single-answer only) ---------- */

  // Options currently focusable: revealed and not 50:50-removed, in DOM order.
  _focusableOptionIndices() {
    const out = [];
    for (const b of this.optionsEl.querySelectorAll('.option')) {
      const i = Number(b.dataset.i);
      if (this.revealed.has(i) && !this.removed.has(i)) out.push(i);
    }
    return out;
  }

  _optionBtn(i) { return this.optionsEl.querySelector(`.option[data-i="${i}"]`); }

  // Roving tabindex: exactly one live option is the Tab stop (the selected one,
  // else the current rove target, else the first live option). Multi (checkbox
  // group) keeps native per-option Tab stops, so this is a no-op there.
  _applyRoving() {
    if (!this.optionsEl || (this.current && this.current.q.type === 'multi')) return;
    const live = this._focusableOptionIndices();
    if (!live.length) return;
    const active = this.selected.size ? [...this.selected][0]
      : (live.includes(this._roveI) ? this._roveI : live[0]);
    this._roveI = active;
    for (const b of this.optionsEl.querySelectorAll('.option')) {
      b.tabIndex = Number(b.dataset.i) === active ? 0 : -1;
    }
  }

  // Arrow / Home / End within the radiogroup: move focus AND (radio pattern)
  // select as focus moves. dir is +1 / -1 / 'home' / 'end'.
  _moveRove(dir) {
    if (this.locked || (this.current && this.current.q.type === 'multi')) return;
    const live = this._focusableOptionIndices();
    if (!live.length) return;
    let pos = live.indexOf(this._roveI);
    if (pos < 0) pos = 0;
    let next;
    if (dir === 'home') next = live[0];
    else if (dir === 'end') next = live[live.length - 1];
    else next = live[(pos + dir + live.length) % live.length];
    this._roveI = next;
    this.pick(next); // selection follows focus (_refreshSelection re-applies roving)
    const b = this._optionBtn(next);
    if (b) b.focus({ preventScroll: true });
  }

  pick(i) {
    if (this.locked || this.removed.has(i) || !this.revealed.has(i)) return;
    const multi = this.current.q.type === 'multi';
    if (multi) {
      if (this.selected.has(i)) this.selected.delete(i); else this.selected.add(i);
    } else {
      this.selected.clear(); this.selected.add(i);
    }
    this._refreshSelection();
    if (this.handlers.onSelectSound) this.handlers.onSelectSound();
  }

  _refreshSelection() {
    [...this.optionsEl.querySelectorAll('.option')].forEach((btn) => {
      const i = Number(btn.dataset.i);
      const on = this.selected.has(i);
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    this.lockBtn.disabled = this.selected.size === 0;
    this._applyRoving();
  }

  // Signal (once) that a lifeline has delivered its help — the music engine
  // pops back from the lifeline loop to the tier loop.
  _lifelineDone(ms) {
    this._after(ms, () => { if (this.handlers.onLifelineDone) this.handlers.onLifelineDone(); });
  }

  applyLifeline(type, payload) {
    if (type === 'fifty') {
      for (const idx of payload.removed) {
        this.removed.add(idx);
        this.selected.delete(idx);
        const btn = this.optionsEl.querySelector(`.option[data-i="${idx}"]`);
        if (btn) { btn.classList.add('removed'); btn.disabled = true; btn.setAttribute('aria-hidden', 'true'); }
      }
      this._refreshSelection();
      this._lifelineDone(FIFTY_DONE_MS);
    } else if (type === 'audience') {
      clear(this.lifelinePanel);
      const max = Math.max(...payload.bars.map((b) => b.percent));
      // One static, screen-reader-friendly summary of the final poll — the
      // animated bars/percentages are aria-hidden so the count-up doesn't flood
      // the live region.
      const summary = payload.bars.map((b) => `${letter(b.index)} ${b.percent}%`).join(', ');
      const rows = payload.bars.map((b, i) => {
        const col = VOTE_COLORS[b.index] || VOTE_COLORS[0];
        const fill = h('span', { class: 'aud-bar' + (b.percent === max ? ' top' : ''), 'aria-hidden': 'true' });
        fill.style.transitionDelay = (i * 0.08) + 's';
        fill.style.background = col; // same hue the crowd raised for this option
        const pct = h('span', { class: 'aud-pct' + (b.percent === max ? ' top' : ''), 'aria-hidden': 'true' }, '0%');
        const letterEl = h('span', { class: 'aud-letter' }, letter(b.index));
        letterEl.style.color = col;
        return { b, fill, pct, row: h('div', { class: 'aud-row' },
          letterEl,
          h('span', { class: 'aud-bar-wrap' }, fill),
          pct) };
      });
      this.lifelinePanel.append(h('div', { class: 'audience', 'aria-label': 'Audience poll: ' + summary },
        h('div', { class: 'll-title' }, '👥 Ask the audience'),
        ...rows.map((r) => r.row)));
      // bars grow via transition (staggered); percentages count up alongside
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const r of rows) r.fill.style.width = r.b.percent + '%';
      }));
      if (reduced()) {
        for (const r of rows) r.pct.textContent = r.b.percent + '%';
      } else {
        const gen = this._gen, t0 = performance.now(), dur = 1600;
        const step = (t) => {
          if (this._gen !== gen) return; // question changed — stop writing
          const k = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - k, 3);
          for (const r of rows) r.pct.textContent = Math.round(r.b.percent * e) + '%';
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      this._lifelineDone(AUDIENCE_DONE_MS);
    } else if (type === 'phone') {
      this._phoneCutscene(payload.pick);
    }
  }

  // Phone a Friend — a ~10s cutscene: the friend picks up, panics, and blurts
  // their guess, which then tags the option they named (they're right ~68% of
  // the time — see lifelines.js). This is the game's ONE sanctioned timed
  // sequence; it never limits the player's own decision. Reduced motion skips
  // straight to the guess.
  _phoneCutscene(pick) {
    clear(this.lifelinePanel);
    const L = letter(pick);
    const avatar = h('div', { class: 'phone-avatar', 'aria-hidden': 'true' },
      h('span', { class: 'pa-head' }), h('span', { class: 'pa-body' }));
    const bubble = h('p', { class: 'phone-bubble' }, '');
    const panel = h('div', { class: 'phone-call', 'aria-live': 'polite', 'aria-label': 'Phone a friend' },
      h('div', { class: 'll-title' }, '📞 Phone a friend'),
      h('div', { class: 'phone-stage' }, avatar, bubble));
    this.lifelinePanel.append(panel);

    const script = [
      "Hello?! Wait — you're on RIGHT NOW?!",
      "Okay okay, don't panic. I'm not panicking. You're panicking!",
      'Read them to me again — no, I heard you, I heard you…',
      'Ohh no. Um. Okay. Gut feeling — trust the gut.',
      `Go with ${L}. It's ${L}! …I think. GO GO GO!`,
    ];
    const markPick = () => {
      const btn = this.optionsEl.querySelector(`.option[data-i="${pick}"]`);
      if (btn && !this.removed.has(pick)) {
        btn.classList.add('phone-pick');
        if (!btn.querySelector('.phone-tag')) btn.append(h('span', { class: 'phone-tag', 'aria-hidden': 'true' }, '📞'));
      }
    };

    if (reduced()) {
      bubble.textContent = script[script.length - 1];
      avatar.classList.add('panic');
      markPick();
      this._lifelineDone(1400);
      return;
    }
    const step = PHONE_STEP_MS;
    script.forEach((line, k) => this._after(k * step, () => {
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      bubble.textContent = line;
      avatar.classList.toggle('panic', k >= 1 && k < 4);
      if (k === script.length - 1) { avatar.classList.remove('panic'); markPick(); }
    }));
    this._lifelineDone(script.length * step);
  }

  // The suspense beat: gold lock-in, everything else dims, then the answer is
  // actually submitted after two breaths (instantly under reduced motion).
  lock() {
    if (this.locked || this.selected.size === 0) return;
    this.locked = true;
    this.lockBtn.disabled = true;
    if (this.handlers.onLockSound) this.handlers.onLockSound();

    [...this.optionsEl.querySelectorAll('.option')].forEach((btn) => {
      const i = Number(btn.dataset.i);
      btn.disabled = true;
      if (this.selected.has(i)) {
        btn.classList.remove('selected');
        btn.classList.add('locked-in');
        if (!reduced()) btn.append(h('span', { class: 'lock-glow', 'aria-hidden': 'true' }));
      } else if (!this.removed.has(i)) {
        btn.classList.add('dimmed');
      }
    });

    const indices = [...this.selected];
    const isFinal = !!this.current.isFinal;
    const ms = reduced() ? 0 : (isFinal ? SUSPENSE_FINAL_MS : this.current.tier === 'hard' ? SUSPENSE_HARD_MS : SUSPENSE_MS);
    if (ms && this.handlers.onSuspense) this.handlers.onSuspense({ ms, tier: this.current.tier, isFinal });

    // The contestant's speech bubble ("our guy" calls it). Plain setTimeout so
    // the next question's timer sweep can't strand it on screen; tracked on
    // this._faBubble so a pause can pull it off before the menu opens.
    const fa = h('div', { class: 'speech-bubble you', 'aria-hidden': 'true' },
      h('span', { class: 'speech-who' }, 'You'), 'Final answer!');
    document.body.append(fa);
    this._faBubble = fa;
    setTimeout(() => { fa.remove(); if (this._faBubble === fa) this._faBubble = null; }, Math.max(1800, ms));

    this._pendingIndices = indices;
    this._submitTimer = this._after(ms, () => {
      this._submitTimer = null;
      if (this.handlers.onAnswer) this.handlers.onAnswer(indices);
    });
  }

  showFeedback(result) {
    const correctSet = new Set(result.correctAnswer);
    const wrong = result.correct === false;
    if (wrong) this.card.classList.add('desat');

    [...this.optionsEl.querySelectorAll('.option')].forEach((btn) => {
      const i = Number(btn.dataset.i);
      btn.disabled = true;
      btn.classList.remove('dimmed');
      const glow = btn.querySelector('.lock-glow');
      if (glow) glow.remove();
      const isCorrect = correctSet.has(i);
      const wasChosen = result.selected.includes(i);
      if (isCorrect) {
        btn.classList.remove('locked-in');
        btn.classList.add('is-correct');
        if (wrong) btn.classList.add('late'); // lights up 200ms after the miss
        btn.querySelector('.opt-mark').textContent = '✓';
      } else if (wasChosen) {
        btn.classList.remove('locked-in');
        btn.classList.add('is-wrong');
        btn.querySelector('.opt-mark').textContent = '✗';
      } else if (wrong && !this.removed.has(i)) {
        btn.classList.add('faded');
      }
    });
    const lockRow = this.card.querySelector('.lock-row');
    if (lockRow) lockRow.remove();

    if (result.correct === false) {
      // A wrong answer heads straight to the green room, where the correct
      // answer and its explanation are waiting. Brief beat to read the marks.
      const fb = h('div', { class: 'feedback bad', role: 'status' },
        h('div', { class: 'fb-head' }, '✗ Not this time'),
        h('p', { class: 'fb-note' }, 'The correct answer is lit above. Walking you back to the green room…'),
      );
      this.card.append(fb);
      this._after(WRONG_WALK_MS, () => { if (this.handlers.onContinue) this.handlers.onContinue(result); });
      return;
    }

    const label = result.won ? 'Collect your winnings' : 'Next question';
    const fb = h('div', { class: 'feedback good', role: 'status' },
      h('div', { class: 'fb-head' }, result.won ? '🏆 You did it!' : '✓ Correct'),
      result.boundary ? h('div', { class: 'fb-bank' }, `🛡 Banked ${result.banked.toLocaleString('en-US')} coins — that's yours to keep.`) : null,
      h('p', { class: 'fb-exp' }, result.explanation),
      optionNotesPanel(result.q, correctSet),
      result.q && result.q.reference ? h('p', { class: 'fb-ref' }, 'Reference: ' + result.q.reference) : null,
      h('button', { class: 'continue-btn', type: 'button', onclick: () => this.handlers.onContinue && this.handlers.onContinue(result) }, label),
    );
    this.card.append(fb);
    const btn = fb.querySelector('.continue-btn');
    if (btn) btn.focus({ preventScroll: true });
  }

  handleKey(e) {
    if (this.locked) {
      if (e.key === 'Enter') { const c = this.card.querySelector('.continue-btn'); if (c) { c.click(); e.preventDefault(); } }
      return;
    }
    const q = this.current && this.current.q;
    if (!q) return;
    // Radiogroup arrow navigation — only when an option is focused, so arrows
    // elsewhere behave normally. Single-answer only (checkbox groups Tab).
    if (q.type !== 'multi') {
      const onOption = document.activeElement && document.activeElement.classList
        && document.activeElement.classList.contains('option');
      if (onOption) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { this._moveRove(1); e.preventDefault(); return; }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { this._moveRove(-1); e.preventDefault(); return; }
        if (e.key === 'Home') { this._moveRove('home'); e.preventDefault(); return; }
        if (e.key === 'End') { this._moveRove('end'); e.preventDefault(); return; }
      }
    }
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
    const k = e.key.toLowerCase();
    if (k in map && map[k] < q.options.length) { this.pick(map[k]); e.preventDefault(); }
    else if (e.key === 'Enter' && this.selected.size > 0) { this.lock(); e.preventDefault(); }
  }

  // Pause hooks (main calls these around the pause menu). Park the pending
  // lock-in submit so the locked answer isn't graded behind the overlay, and
  // pull the transient "Final answer!" bubble off-screen.
  onPause() {
    if (this._faBubble) { this._faBubble.remove(); this._faBubble = null; }
    document.querySelectorAll('.speech-bubble.you').forEach((el) => el.remove());
    if (this._submitTimer != null) {
      clearTimeout(this._submitTimer);
      this._timers = this._timers.filter((id) => id !== this._submitTimer);
      this._submitTimer = null;
      this._submitParked = true;
    }
  }

  onResume() {
    if (!this._submitParked || !this.locked || !this._pendingIndices) return;
    this._submitParked = false;
    const indices = this._pendingIndices;
    this._submitTimer = this._after(reduced() ? 0 : 600, () => {
      this._submitTimer = null;
      if (this.handlers.onAnswer) this.handlers.onAnswer(indices);
    });
  }

  // Quitting the run: drop the parked submit entirely so it never fires.
  abortPending() {
    if (this._submitTimer != null) { clearTimeout(this._submitTimer); this._submitTimer = null; }
    this._submitParked = false; this._pendingIndices = null;
    if (this._faBubble) { this._faBubble.remove(); this._faBubble = null; }
  }
}
