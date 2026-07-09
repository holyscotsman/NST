// hud.js — the in-run heads-up display: money ladder, coin bank, and lifelines.
// Colorblind-safe: every tier/state also carries a glyph and text label, never
// color alone (CLAUDE.md §6).

import { h, clear, money } from './dom.js';
import { LADDER, BANK_BOUNDARIES, LIFELINE_TYPES, LIFELINE_META } from '../../core/config.js';
import { positionTier } from '../../core/runController.js';

const TIER_GLYPH = { easy: '●', medium: '◆', hard: '▲', extreme: '★' };

export class Hud {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.el = h('div', { class: 'hud', role: 'region', 'aria-label': 'Game status' });
    this.ladderEl = h('ol', { class: 'ladder', 'aria-label': 'Money ladder, question 1 to 30' });
    this.coinsEl = h('div', { class: 'coins' });
    this.seedEl = h('div', { class: 'seed-chip hidden' });
    this.lifelinesEl = h('div', { class: 'lifelines', role: 'group', 'aria-label': 'Lifelines' });
    this.el.append(
      h('div', { class: 'hud-left' }, this.coinsEl, this.seedEl, this.lifelinesEl),
      h('div', { class: 'hud-right' }, this.ladderEl),
    );
    this._buildLadder();
  }

  setSeed(seed) {
    clear(this.seedEl);
    if (seed) {
      this.seedEl.classList.remove('hidden');
      this.seedEl.append(h('span', { class: 'seed-label' }, 'Seed'), h('code', {}, seed));
    } else {
      this.seedEl.classList.add('hidden');
    }
  }

  _buildLadder() {
    clear(this.ladderEl);
    this.rungs = [];
    for (let i = LADDER.length - 1; i >= 0; i--) {
      const tier = positionTier(i);
      const boundary = BANK_BOUNDARIES.includes(i);
      const li = h('li', {
        class: `rung tier-${tier}${boundary ? ' safe' : ''}`,
        dataset: { i: String(i) },
      },
        h('span', { class: 'rung-num' }, String(i + 1)),
        h('span', { class: 'rung-glyph', 'aria-hidden': 'true' }, TIER_GLYPH[tier]),
        h('span', { class: 'rung-val' }, money(LADDER[i])),
        boundary ? h('span', { class: 'rung-safe', title: 'Guaranteed — banked here' }, '🛡') : null,
      );
      this.rungs[i] = li;
      this.ladderEl.append(li);
    }
  }

  update(snapshot) {
    // Ladder highlight
    for (let i = 0; i < this.rungs.length; i++) {
      const r = this.rungs[i];
      r.classList.toggle('current', i === snapshot.index);
      r.classList.toggle('cleared', i < snapshot.index);
    }
    if (this.rungs[snapshot.index]) {
      this.rungs[snapshot.index].scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    // Coins
    clear(this.coinsEl);
    const nb = snapshot.nextBoundary;
    this.coinsEl.append(
      h('div', { class: 'coin-line' },
        h('span', { class: 'coin-label' }, 'Playing for'),
        h('span', { class: 'coin-amt playing' }, money(snapshot.running || 0) + ' coins')),
      h('div', { class: 'coin-line' },
        h('span', { class: 'coin-label' }, 'Banked'),
        h('span', { class: 'coin-amt banked' }, '🛡 ' + money(snapshot.banked || 0))),
      nb ? h('div', { class: 'coin-hint' }, `Next safe haven: Q${nb.qIndex + 1} → ${money(nb.amount)}`) : null,
    );

    // Lifelines
    clear(this.lifelinesEl);
    for (const type of LIFELINE_TYPES) {
      const l = snapshot.lifelines[type];
      const used = snapshot.usedThisQuestion.includes(type);
      const meta = LIFELINE_META[type];
      const available = l && l.charges > 0 && !used;
      const btn = h('button', {
        class: `lifeline ll-${type}${available ? '' : ' spent'}`,
        type: 'button',
        disabled: !available,
        title: meta.hint,
        'aria-label': `${meta.name}. ${available ? l.charges + ' charge' + (l.charges > 1 ? 's' : '') + ' left' : (used ? 'used this question' : 'no charges left')}`,
        onclick: () => available && this.handlers.onLifeline && this.handlers.onLifeline(type),
      },
        h('span', { class: 'll-glyph', 'aria-hidden': 'true' }, meta.glyph),
        h('span', { class: 'll-name' }, meta.name),
        l && l.slots > 1 ? h('span', { class: 'll-charges' }, `${l.charges}/${l.slots}`) : null,
      );
      this.lifelinesEl.append(btn);
    }
  }
}
