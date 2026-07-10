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

// The gold lock-in suspense before the reveal. Two 0.9s breaths on the early
// tiers; the hard round and the final hold noticeably longer (with a drum
// roll) to build the anticipation the top of the ladder deserves.
const SUSPENSE_MS = 1700;
const SUSPENSE_HARD_MS = 3000;
const SUSPENSE_FINAL_MS = 3800;

function reduced() { return document.body.classList.contains('reduced-motion'); }

export class QuizScreen {
  constructor(handlers = {}) {
    this.handlers = handlers; // onAnswer(indices), onLifeline(type), onContinue(result), onQuit()
    this.selected = new Set();
    this.locked = false;
    this.removed = new Set();
    this.el = h('section', { class: 'quiz-screen', 'aria-label': 'Quiz' });
    this._timers = [];
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
  _clearTimers() { this._timers.forEach(clearTimeout); this._timers = []; if (this._typeIv) clearInterval(this._typeIv); }

  showQuestion(current, snapshot) {
    this._clearTimers();
    this.selected.clear();
    this.removed.clear();
    this.locked = false;
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
      this.optionsEl.append(h('li', {}, btn));
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
    } else {
      const { stemMs, optionGapMs } = readoutPacing(q.stem.length, q.options.length);
      btns.forEach((b) => { b.classList.add('unrevealed'); b.disabled = true; });
      btns.forEach((b, i) => this._after(stemMs + i * optionGapMs, () => {
        this.revealed.add(i);
        b.classList.remove('unrevealed');
        b.style.animationDelay = '0s'; // the reveal IS the stagger
        if (!this.removed.has(i)) b.disabled = false;
        if (this.handlers.onReveal) this.handlers.onReveal(i);
      }));
    }
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
      if (on && !btn.classList.contains('selected')) {
        btn.classList.remove('selected'); void btn.offsetWidth; // restart the pulse
      }
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    this.lockBtn.disabled = this.selected.size === 0;
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
      this._lifelineDone(2600);
    } else if (type === 'audience') {
      clear(this.lifelinePanel);
      const max = Math.max(...payload.bars.map((b) => b.percent));
      const rows = payload.bars.map((b, i) => {
        const fill = h('span', { class: 'aud-bar' + (b.percent === max ? ' top' : '') });
        fill.style.transitionDelay = (i * 0.08) + 's';
        const pct = h('span', { class: 'aud-pct' + (b.percent === max ? ' top' : '') }, '0%');
        return { b, fill, pct, row: h('div', { class: 'aud-row' },
          h('span', { class: 'aud-letter' }, letter(b.index)),
          h('span', { class: 'aud-bar-wrap' }, fill),
          pct) };
      });
      this.lifelinePanel.append(h('div', { class: 'audience', 'aria-label': 'Audience poll results' },
        h('div', { class: 'll-title' }, '👥 Ask the audience'),
        ...rows.map((r) => r.row)));
      // bars grow via transition (staggered); percentages count up alongside
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const r of rows) r.fill.style.width = r.b.percent + '%';
      }));
      if (reduced()) {
        for (const r of rows) r.pct.textContent = r.b.percent + '%';
      } else {
        const t0 = performance.now(), dur = 1600;
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - k, 3);
          for (const r of rows) r.pct.textContent = Math.round(r.b.percent * e) + '%';
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      this._lifelineDone(4400); // bars + a beat to read them
    } else if (type === 'phone') {
      clear(this.lifelinePanel);
      const caret = h('span', { class: 'phone-caret', 'aria-hidden': 'true' });
      const typed = h('span', {}, '');
      this.lifelinePanel.append(h('div', { class: 'phone' },
        h('div', { class: 'll-title' }, '📞 Phone a friend'),
        h('p', { class: 'phone-text' }, '“', typed, caret, '”')));
      const text = payload.text;
      if (reduced()) {
        typed.textContent = text;
        caret.remove();
        this._lifelineDone(1200);
      } else {
        let n = 0;
        this._typeIv = setInterval(() => {
          n += 1;
          typed.textContent = text.slice(0, n);
          if (n >= text.length) { clearInterval(this._typeIv); caret.remove(); }
        }, 33);
        this._lifelineDone(text.length * 33 + 2600); // typing + a beat to read
      }
    }
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
    // the next question's timer sweep can't strand it on screen.
    const fa = h('div', { class: 'speech-bubble you', 'aria-hidden': 'true' },
      h('span', { class: 'speech-who' }, 'You'), 'Final answer!');
    document.body.append(fa);
    setTimeout(() => fa.remove(), Math.max(1800, ms));

    this._after(ms, () => {
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
      this._after(2600, () => { if (this.handlers.onContinue) this.handlers.onContinue(result); });
      return;
    }

    const label = result.won ? 'Collect your winnings' : 'Next question';
    const fb = h('div', { class: 'feedback good', role: 'status' },
      h('div', { class: 'fb-head' }, result.won ? '🏆 You did it!' : '✓ Correct'),
      result.boundary ? h('div', { class: 'fb-bank' }, `🛡 Banked ${result.banked.toLocaleString('en-US')} coins — that's yours to keep.`) : null,
      h('p', { class: 'fb-exp' }, result.explanation),
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
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
    const k = e.key.toLowerCase();
    if (k in map && map[k] < q.options.length) { this.pick(map[k]); e.preventDefault(); }
    else if (e.key === 'Enter' && this.selected.size > 0) { this.lock(); e.preventDefault(); }
  }
}
