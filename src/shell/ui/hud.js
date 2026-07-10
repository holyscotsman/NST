// hud.js — the in-run HUD, Game A layout: coins panel + lifeline medallions
// pinned upper-left, the money ladder as a full-height right rail with a gold
// highlight that slides between rungs, and the seed chip bottom-left.
// Built once; update() mutates values so count-up tweens and transitions work.
// Colorblind-safe: every state carries a glyph or text, never color alone.

import { h, clear, money } from './dom.js';
import { LADDER, BANK_BOUNDARIES, LIFELINE_TYPES, LIFELINE_META } from '../../core/config.js';
import { positionTier } from '../../core/runController.js';

const TIER_GLYPH = { easy: '●', medium: '◆', hard: '▲', extreme: '★' };
const LL_LABEL = { fifty: '50:50', audience: 'Audience', phone: 'Phone' };

function reduced() { return document.body.classList.contains('reduced-motion'); }

export class Hud {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.el = h('div', { class: 'hud-root' });
    this._displayed = { banked: 0, playing: 0 };
    this._raf = null;
    this._lastCharges = {};
    this._buildCluster();
    this._buildLadder();
    this._buildSeed();
    this.el.append(this.cluster, this.ladderEl, this.seedEl);
  }

  /* ---------------- upper-left cluster ---------------- */

  _buildCluster() {
    this.bankedVal = h('span', { class: 'coin-amt banked' },
      h('span', { class: 'shield', 'aria-hidden': 'true' }, '🛡'), h('span', { class: 'num' }, '0'));
    this.playingVal = h('span', { class: 'coin-amt playing' }, '0');
    this.hintEl = h('div', { class: 'coin-hint' }, '');
    this.coinsEl = h('div', { class: 'coins' },
      h('div', { class: 'coins-head' }, 'Coins earned'),
      h('div', { class: 'coin-line' }, h('span', { class: 'coin-label' }, 'Banked'), this.bankedVal),
      h('div', { class: 'coin-line' }, h('span', { class: 'coin-label' }, 'Playing for'), this.playingVal),
      this.hintEl,
    );

    this.llEls = {};
    this.lifelinesEl = h('div', { class: 'lifelines', role: 'group', 'aria-label': 'Lifelines' });
    LIFELINE_TYPES.forEach((type, i) => {
      const meta = LIFELINE_META[type];
      const pip = h('span', { class: 'll-charges hidden' }, '');
      const btn = h('button', {
        class: `lifeline ll-${type}`, type: 'button', title: meta.hint,
        onclick: () => this.handlers.onLifeline && this.handlers.onLifeline(type),
      },
        h('span', { class: 'll-glyph', 'aria-hidden': 'true' }, meta.glyph),
        h('span', { class: 'll-sweep', 'aria-hidden': 'true' },
          h('span', { style: { animationDelay: (i * 0.5) + 's' } })),
        pip,
      );
      const name = h('span', { class: 'll-name' }, LL_LABEL[type]);
      const slot = h('div', { class: 'll-slot' }, btn, name);
      this.llEls[type] = { btn, pip, slot };
      this.lifelinesEl.append(slot);
    });

    this.pauseBtn = h('button', {
      class: 'pause-btn', type: 'button', 'aria-label': 'Pause menu',
      onclick: () => this.handlers.onPause && this.handlers.onPause(),
    }, '☰ Menu');

    this.cluster = h('div', { class: 'hud', role: 'region', 'aria-label': 'Game status' },
      this.coinsEl, this.lifelinesEl, this.pauseBtn);
  }

  /* ---------------- right-rail ladder ---------------- */

  _buildLadder() {
    this.rungs = [];
    this.track = h('div', { class: 'ladder-track' });
    this.highlight = h('div', { class: 'rung-highlight', 'aria-hidden': 'true' }, h('span', { class: 'glow' }));
    this.track.append(this.highlight);
    // Q30 at the top, Q1 at the bottom — the player climbs upward.
    for (let i = LADDER.length - 1; i >= 0; i--) {
      const tier = positionTier(i);
      const safe = BANK_BOUNDARIES.includes(i);
      const li = h('li', { class: `rung tier-${tier}${safe ? ' safe' : ''}` },
        h('span', { class: 'rung-num' }, `Q${i + 1}`),
        h('span', { class: 'rung-glyph', 'aria-hidden': 'true' }, TIER_GLYPH[tier]),
        h('span', { class: 'rung-val' }, money(LADDER[i])),
        h('span', { class: 'rung-safe', 'aria-hidden': 'true' }, '🛡'),
      );
      this.rungs[i] = li;
      this.track.append(li);
    }
    this.ladderEl = h('ol', { class: 'ladder', 'aria-label': 'Money ladder, question 1 to 30' },
      h('div', { class: 'ladder-head', 'aria-hidden': 'true' }, 'Money ladder'),
      this.track);
  }

  _buildSeed() {
    this.seedEl = h('div', { class: 'seed-chip hidden' });
  }

  setSeed(seed) {
    clear(this.seedEl);
    if (seed) {
      this.seedEl.classList.remove('hidden');
      this.seedEl.append(h('span', {}, 'Seed'), h('code', {}, seed));
    } else {
      this.seedEl.classList.add('hidden');
    }
  }

  /* ---------------- updates ---------------- */

  update(snapshot) {
    // ladder state
    for (let i = 0; i < this.rungs.length; i++) {
      const r = this.rungs[i];
      r.classList.toggle('current', i === snapshot.index);
      r.classList.toggle('cleared', i < snapshot.index);
    }
    this._moveHighlight(snapshot.index);

    // coins (tweened)
    this._tween('banked', snapshot.banked || 0, 500);
    this._tween('playing', snapshot.running || 0, 600);
    const nb = snapshot.nextBoundary;
    this.hintEl.textContent = nb ? `Next safe haven: Q${nb.qIndex + 1} → ${money(nb.amount)}` : 'Past the last safe haven';

    // lifelines
    for (const type of LIFELINE_TYPES) {
      const l = snapshot.lifelines[type];
      const used = snapshot.usedThisQuestion.includes(type);
      const { btn, pip, slot } = this.llEls[type];
      const empty = !l || l.charges <= 0;
      const available = !empty && !used;
      btn.disabled = !available;
      btn.classList.toggle('empty', empty);
      slot.classList.toggle('empty', empty);
      btn.setAttribute('aria-label', `${LIFELINE_META[type].name}. ${available ? `${l.charges} of ${l.slots} charges` : (used ? 'used this question' : 'no charges left')}`);
      if (l && l.slots > 1) {
        pip.classList.remove('hidden');
        const txt = `${l.charges}/${l.slots}`;
        if (pip.textContent && pip.textContent !== txt && !reduced()) {
          pip.classList.remove('flip'); void pip.offsetWidth; pip.classList.add('flip');
        }
        pip.textContent = txt;
      } else {
        pip.classList.add('hidden');
      }
      // drain wipe the moment a lifeline runs dry
      const prev = this._lastCharges[type];
      if (prev != null && l && l.charges < prev && l.charges === 0 && !reduced()) {
        const wipe = h('span', { class: 'll-drain', 'aria-hidden': 'true' });
        btn.append(wipe);
        setTimeout(() => wipe.remove(), 600);
      }
      this._lastCharges[type] = l ? l.charges : 0;
    }
  }

  _moveHighlight(index) {
    const rung = this.rungs[index];
    if (!rung) return;
    this.highlight.style.top = rung.offsetTop + 'px';
    // keep the current rung comfortably in view (vertical rail or mobile strip)
    if (this.ladderEl.scrollHeight > this.ladderEl.clientHeight + 4) {
      this.ladderEl.scrollTop = Math.max(0, rung.offsetTop - this.ladderEl.clientHeight / 2);
    }
    if (this.ladderEl.scrollWidth > this.ladderEl.clientWidth + 4) {
      this.ladderEl.scrollLeft = Math.max(0, rung.offsetLeft - this.ladderEl.clientWidth / 2 + 27);
    }
  }

  // gold trail streak when the highlight climbs (or falls after a miss)
  trail(fromIndex, dir) {
    if (reduced()) return;
    const rung = this.rungs[fromIndex];
    if (!rung) return;
    const t = h('div', { class: `rung-trail ${dir}`, 'aria-hidden': 'true' });
    t.style.top = rung.offsetTop + 'px';
    this.track.append(t);
    setTimeout(() => t.remove(), 600);
  }

  // safe-haven celebration: coin particles, shield stamp, rung pulse
  bank(justClearedIndex) {
    const shield = this.bankedVal.querySelector('.shield');
    if (!reduced()) {
      const fx = h('div', { class: 'bank-fx', 'aria-hidden': 'true' },
        h('span'), h('span'), h('span'), h('span'), h('span'));
      this.coinsEl.append(fx);
      setTimeout(() => fx.remove(), 1000);
      shield.classList.remove('stamp'); void shield.offsetWidth; shield.classList.add('stamp');
      const rung = this.rungs[justClearedIndex];
      if (rung) {
        rung.classList.remove('bank-pulse'); void rung.offsetWidth; rung.classList.add('bank-pulse');
        setTimeout(() => rung.classList.remove('bank-pulse'), 900);
      }
    }
  }

  // gold ★ ring burst at the top of the ladder on a win
  burst() {
    if (reduced()) return;
    const b = h('div', { class: 'ladder-burst', 'aria-hidden': 'true' });
    this.track.append(b);
    setTimeout(() => b.remove(), 1000);
  }

  /* ---------------- count-up tween ---------------- */

  _tween(key, to, ms) {
    const numEl = key === 'banked' ? this.bankedVal.querySelector('.num') : this.playingVal;
    const from = this._displayed[key];
    if (from === to) { numEl.textContent = money(to); return; }
    this._displayed[key] = to;
    if (reduced() || Math.abs(to - from) < 2) { numEl.textContent = money(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      numEl.textContent = money(Math.round(from + (to - from) * e));
      if (k < 1 && this._displayed[key] === to) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
