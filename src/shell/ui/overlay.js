// overlay.js — the DOM quiz overlay (question, options, lifeline panels,
// feedback). Rendered on top of the GL canvas; the quiz is always DOM so screen
// readers and keyboard/touch users get a first-class experience (CLAUDE.md §6).

import { h, clear } from './dom.js';
import { letter } from '../../core/lifelines.js';
import { DOMAINS } from '../../core/config.js';

const DOMAIN_LABEL = {
  prism: 'Prism', storage: 'Storage', dataprotection: 'Data protection', ahv: 'AHV',
  networking: 'Networking', lifecycle: 'Lifecycle & upgrades', monitoring: 'Monitoring',
  migration: 'Migration', unifiedstorage: 'Files / Objects / Volumes', security: 'Security',
  performance: 'Performance', foundation: 'Foundation',
};
const TIER_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', extreme: 'Final' };

export class QuizScreen {
  constructor(handlers = {}) {
    this.handlers = handlers; // onAnswer(indices), onLifeline(type), onContinue(result), onQuit()
    this.selected = new Set();
    this.locked = false;
    this.removed = new Set();
    this.el = h('section', { class: 'quiz-screen', 'aria-label': 'Quiz' });
  }

  mount(root, hudEl) {
    clear(root); // replace whatever screen was showing (title/green room), don't stack on it
    clear(this.el);
    this.el.append(hudEl);
    this.card = h('div', { class: 'q-card' });
    this.el.append(this.card);
    root.append(this.el);
  }

  showQuestion(current, snapshot) {
    this.selected.clear();
    this.removed.clear();
    this.locked = false;
    const q = current.q;
    this.current = current;
    clear(this.card);

    const multi = q.type === 'multi';
    const banner = current.isFinal
      ? h('div', { class: 'final-banner' }, current.q.impossible
          ? "The final question — nobody's meant to get this one."
          : 'The final question for the top prize')
      : null;

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

    this.lifelinePanel = h('div', { class: 'lifeline-panel', 'aria-live': 'polite' });

    this.lockBtn = h('button', {
      class: 'lock-btn', type: 'button', disabled: true,
      onclick: () => this.lock(),
    }, multi ? 'Lock in these answers' : 'Final answer');

    this.card.append(
      banner,
      h('div', { class: 'q-meta' },
        h('span', { class: `chip tier-${current.tier}` }, `Q${current.number} · ${TIER_LABEL[current.tier]}`),
        h('span', { class: 'chip domain' }, DOMAIN_LABEL[q.domain] || q.domain),
        multi ? h('span', { class: 'chip multi' }, 'Select all that apply') : null,
      ),
      h('h2', { class: 'stem' }, q.stem),
      this.lifelinePanel,
      this.optionsEl,
      this.lockBtn,
    );
  }

  pick(i) {
    if (this.locked || this.removed.has(i)) return;
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
    [...this.optionsEl.children].forEach((li) => {
      const btn = li.firstChild;
      const i = Number(btn.dataset.i);
      const on = this.selected.has(i);
      btn.classList.toggle('selected', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    this.lockBtn.disabled = this.selected.size === 0;
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
    } else if (type === 'audience') {
      clear(this.lifelinePanel);
      const max = Math.max(...payload.bars.map((b) => b.percent));
      const chart = h('div', { class: 'audience', 'aria-label': 'Audience poll results' },
        h('div', { class: 'll-title' }, '👥 Ask the audience'),
        ...payload.bars.map((b) => h('div', { class: 'aud-row' },
          h('span', { class: 'aud-letter' }, letter(b.index)),
          h('div', { class: 'aud-bar-wrap' },
            h('div', { class: 'aud-bar' + (b.percent === max ? ' top' : ''), style: { width: b.percent + '%' } })),
          h('span', { class: 'aud-pct' }, b.percent + '%'),
        )),
      );
      this.lifelinePanel.append(chart);
    } else if (type === 'phone') {
      clear(this.lifelinePanel);
      this.lifelinePanel.append(h('div', { class: 'phone' },
        h('div', { class: 'll-title' }, '📞 Phone a friend'),
        h('p', { class: 'phone-text' }, `"${payload.text}"`),
      ));
    }
  }

  lock() {
    if (this.locked || this.selected.size === 0) return;
    this.locked = true;
    this.lockBtn.disabled = true;
    const indices = [...this.selected];
    if (this.handlers.onAnswer) this.handlers.onAnswer(indices);
  }

  showFeedback(result) {
    const correctSet = new Set(result.correctAnswer);
    [...this.optionsEl.children].forEach((li) => {
      const btn = li.firstChild;
      const i = Number(btn.dataset.i);
      btn.disabled = true;
      const isCorrect = correctSet.has(i);
      const wasChosen = result.selected.includes(i);
      if (isCorrect) { btn.classList.add('is-correct'); btn.querySelector('.opt-mark').textContent = '✓'; }
      if (wasChosen && !isCorrect) { btn.classList.add('is-wrong'); btn.querySelector('.opt-mark').textContent = '✗'; }
    });
    this.lockBtn.remove();

    const done = result.won || result.correct === false;
    const label = result.won ? 'Collect your winnings' : (result.correct ? 'Next question' : 'See how you did');
    const fb = h('div', { class: `feedback ${result.correct ? 'good' : 'bad'}`, role: 'status' },
      h('div', { class: 'fb-head' }, result.correct ? (result.won ? '🏆 You did it!' : '✓ Correct') : '✗ Not this time'),
      result.boundary && result.correct ? h('div', { class: 'fb-bank' }, `🛡 Banked ${result.banked.toLocaleString('en-US')} coins — that's yours to keep.`) : null,
      h('p', { class: 'fb-exp' }, result.explanation),
      result.q && result.q.reference ? h('p', { class: 'fb-ref' }, 'Reference: ' + result.q.reference) : null,
      h('button', { class: 'continue-btn', type: 'button', onclick: () => this.handlers.onContinue && this.handlers.onContinue(result) }, label),
    );
    this.card.append(fb);
    const btn = fb.querySelector('.continue-btn');
    if (btn) btn.focus();
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
