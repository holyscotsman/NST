// backdrop.js — the layered CSS studio (design handoff §"cinematic backdrop").
// Doubles as the no-WebGL fallback while the Three.js studio remains the
// primary backdrop. Pure DOM/CSS: haze, wordmark, truss, audience silhouettes,
// light beams, stage disc, mood tint, camera push, single-shot pulses, and the
// warm green-room variant. All layers are aria-hidden and GPU-cheap.

import { h, clear } from './ui/dom.js';

// mood tint per tier (rgb + opacity), from the design component
const MOOD = {
  easy: ['120,85,250', 0.07],
  medium: ['31,221,233', 0.09],
  hard: ['120,85,250', 0.15],
  extreme: ['255,200,87', 0.16],
  wrong: ['255,107,91', 0.12],
  dead: ['255,107,91', 0.05],
  win: ['255,200,87', 0.22],
};

export class CssBackdrop {
  constructor(rootEl) {
    this.root = rootEl;
    this.root.setAttribute('aria-hidden', 'true');
    this.root.dataset.scene = 'studio';
    this.root.dataset.cam = 'none';
    this.root.dataset.hero = '1'; // set wordmark hidden until a run starts
    this._build();
  }

  // '1' outside a run (title/results carry their own hero), '0' during play.
  setHero(on) { this.root.dataset.hero = on ? '1' : '0'; }

  _build() {
    clear(this.root);
    const aud = (side) => h('div', { class: `bd-aud ${side}` },
      h('div', { class: 'backlight' }),
      h('div', { class: 'row r1' }), h('div', { class: 'row r2' }),
      h('div', { class: 'row r3' }), h('div', { class: 'row r4' }));
    const beam = (n) => h('div', { class: `bd-beam b${n}` }, h('div', { class: 'sway' }, h('div', { class: 'blade' })));

    this.mood = h('div', { class: 'bd-mood' });
    this.cam = h('div', { class: 'bd-cam' },
      h('div', { class: 'bd-studio' },
        h('div', { class: 'bd-haze h1' }), h('div', { class: 'bd-haze h2' }),
        h('div', { class: 'bd-haze h3' }), h('div', { class: 'bd-haze h4' }),
        h('div', { class: 'bd-wordmark' },
          h('div', { class: 'halo' }),
          h('div', { class: 'pre' }, 'who wants to be a'),
          h('div', { class: 'name' }, 'NUTANIX ENGINEER')),
        h('div', { class: 'bd-truss' }), h('div', { class: 'bd-truss t2' }),
        aud('left'), aud('right'),
        beam(1), beam(2), beam(3), beam(4),
        h('div', { class: 'bd-disc' },
          h('div', { class: 'fill' }), h('div', { class: 'spokes' }),
          h('div', { class: 'rim' }), h('div', { class: 'ring' }), h('div', { class: 'inner' })),
        h('div', { class: 'bd-pool' }),
        this.mood,
        h('div', { class: 'bd-vignette' }),
      ),
      h('div', { class: 'bd-green' },
        h('div', { class: 'bd-ghaze g1' }), h('div', { class: 'bd-ghaze g2' }), h('div', { class: 'bd-ghaze g3' }),
        h('div', { class: 'bd-lamp l1' }), h('div', { class: 'bd-lamp l2' }),
        h('div', { class: 'bd-credenza' }), h('div', { class: 'bd-art' }),
        h('div', { class: 'bd-sofa' },
          h('div', { class: 'back' }), h('div', { class: 'seat' }),
          h('div', { class: 'arm a1' }), h('div', { class: 'arm a2' })),
        // the contestant, waiting it out — slouched, swaying, tapping a foot
        h('div', { class: 'bd-contestant' },
          h('span', { class: 'c-head' }), h('span', { class: 'c-body' }),
          h('span', { class: 'c-leg l1' }), h('span', { class: 'c-leg l2' })),
        h('div', { class: 'bd-gvignette' }),
      ),
    );
    this.root.append(this.cam);
    this._setMood('easy');
  }

  _visible() { return !this.root.classList.contains('hidden'); }

  _setMood(key) {
    const [rgb, op] = MOOD[key] || MOOD.easy;
    this.mood.style.background = `radial-gradient(1300px 800px at 50% 18%, rgba(${rgb},${op}), transparent 70%)`;
  }

  // single-shot reveal flash (mantis correct / peach wrong); never loops
  _pulse(rgb) {
    if (!this._visible()) return;
    if (document.body.classList.contains('reduced-motion')) return;
    const el = h('div', { class: 'bd-pulse', 'aria-hidden': 'true' });
    el.style.background = `radial-gradient(1100px 700px at 50% 45%, rgba(${rgb},0.9), transparent 70%)`;
    document.body.append(el);
    setTimeout(() => el.remove(), 750);
  }

  // Backdrop side of the event contract — mirrors Studio.react.
  react(type, data = {}) {
    switch (type) {
      case 'question:show':
        this.root.dataset.scene = 'studio';
        this.setHero(false); // in-run: the set wordmark dresses the stage
        this._setMood(data.isFinal ? 'extreme' : data.tier);
        this.root.dataset.cam = data.isFinal ? 'final' : data.tier === 'hard' ? 'hard' : 'none';
        break;
      case 'answer:correct':
        this._pulse('146,221,35');
        break;
      case 'answer:wrong':
        this._pulse('255,107,91');
        this._setMood('wrong');
        break;
      case 'run:win':
        this._setMood('win');
        this.root.dataset.cam = 'win';
        this.setHero(true); // result screens carry their own hero
        break;
      case 'run:dead':
        this._setMood('dead');
        this.root.dataset.cam = 'none';
        this.setHero(true);
        break;
      case 'scene:green':
        this.root.dataset.scene = 'green';
        this.root.dataset.cam = 'none';
        this.setHero(true);
        break;
      case 'scene:studio':
        this.root.dataset.scene = 'studio';
        this.setHero(true); // title screen: its own hero wordmark
        break;
      default: break;
    }
  }
}
