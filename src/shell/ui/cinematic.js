// cinematic.js — the first-run intro: a camera tour of the soundstage, then a
// guided tutorial where the host walks the player through the UI on the run's
// real first question and gives away the answer ("on the house").
//
// The host's lines are authored copy — flagged in FLAGS.md for human review
// per CLAUDE.md §7. Skippable at any moment; typewriter collapses under
// reduced motion; advances on click/Enter or auto after a reading pause.

import { h, clear } from './dom.js';
import { letter } from '../../core/lifelines.js';

function reduced() { return document.body.classList.contains('reduced-motion'); }

// The tour, before the first question appears. cam keys match the studio presets.
const TOUR = [
  { cam: 'two', text: 'Welcome to Who wants to be a Nutanix Engineer! The lights are on, the audience is in — and the seat on the left is yours.' },
  { cam: 'aud', text: 'Say hello to our studio audience. They vote honestly, if you ever think to ask them.' },
  { cam: 'host', text: "I'm your host. I ask the questions — the answers, I'm afraid, are your department." },
  { cam: 'player', text: 'And tonight’s contestant… you. Thirty questions stand between you and fifty thousand coins.' },
  { cam: 'two', text: 'Let me show you how this works.' },
];

// The guided tutorial, over the live question. `hi` is a selector to spotlight.
const TUTORIAL = [
  { hi: '.ladder', text: 'The money ladder. Every correct answer climbs one rung — ten easy, ten medium, nine hard, and one final question at the very top.' },
  { hi: '.coins', text: 'Your coins bank at the safe havens — questions 5, 10, 17 and 25. Banked coins are yours to keep, even if you fall.' },
  { hi: '.lifelines', text: 'Three lifelines: 50:50, ask the audience, and phone a friend. One use each — spend them wisely.' },
  { hi: '.options', text: 'Pick an answer, then press Final answer to lock it in. But careful — one wrong answer ends the run. That’s the game.' },
  { answerReveal: true, text: '' }, // filled in at runtime with the real Q1 key
  { text: 'Good luck out there.' },
];

export class Cinematic {
  // opts: { onCam(key), onDone(), answerFor() -> {letter,text} | null }
  constructor(opts) {
    this.opts = opts;
    this.layer = null;
    this.timer = null;
    this.typeIv = null;
    this.active = false;
  }

  _panel() {
    this.textEl = h('p', { class: 'cine-text' }, '');
    this.nextHint = h('span', { class: 'cine-next', 'aria-hidden': 'true' }, '▸');
    const panel = h('div', { class: 'cine-panel', role: 'dialog', 'aria-label': 'Host' },
      h('div', { class: 'cine-host' }, h('span', { class: 'cine-dot' }), 'the host'),
      this.textEl, this.nextHint);
    const skip = h('button', { class: 'cine-skip', type: 'button', onclick: () => this.end() }, 'Skip intro →');
    this.layer = h('div', { class: 'cine-layer' }, panel, skip);
    // click anywhere (or Enter) advances
    this.layer.addEventListener('click', (e) => { if (e.target === skip) return; this._advance(); });
    this._keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { this._advance(); e.preventDefault(); }
      if (e.key === 'Escape') this.end();
    };
    window.addEventListener('keydown', this._keyHandler);
    document.body.append(this.layer);
  }

  play() {
    this.active = true;
    this._panel();
    this.steps = [...TOUR.map((s) => ({ ...s, phase: 'tour' })), { startRun: true }, ...TUTORIAL.map((s) => ({ ...s, phase: 'tut' }))];
    this.idx = -1;
    this._advance();
  }

  _advance() {
    if (!this.active) return;
    clearTimeout(this.timer);
    if (this.typeIv) clearInterval(this.typeIv);
    this._unhighlight();
    this.idx += 1;
    const step = this.steps[this.idx];
    if (!step) return this.end();

    if (step.startRun) {
      // hand off to the game to mount the quiz + show Q1, then continue talking
      if (this.opts.onStartRun) this.opts.onStartRun();
      return this._advance();
    }
    if (step.cam && this.opts.onCam) this.opts.onCam(step.cam);
    if (step.hi) this._highlight(step.hi);

    let text = step.text;
    if (step.answerReveal) {
      const a = this.opts.answerFor ? this.opts.answerFor() : null;
      text = a
        ? `Since it’s your first night, this one’s on the house: the answer is ${a.letter} — “${a.text}”. Don’t tell anyone.`
        : 'Since it’s your first night, take your time on this one.';
      if (this.opts.onAnswerRevealed) this.opts.onAnswerRevealed();
    }
    this._say(text);
    const dwell = Math.max(2800, text.length * 55);
    this.timer = setTimeout(() => this._advance(), reduced() ? Math.max(1200, dwell * 0.6) : dwell);
  }

  _say(text) {
    this.nextHint.classList.remove('on');
    if (reduced()) {
      this.textEl.textContent = text;
      this.nextHint.classList.add('on');
      return;
    }
    this.textEl.textContent = '';
    let n = 0;
    this.typeIv = setInterval(() => {
      n += 1;
      this.textEl.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(this.typeIv); this.nextHint.classList.add('on'); }
    }, 24);
  }

  _highlight(sel) {
    const el = document.querySelector(sel);
    if (el) { el.classList.add('tut-glow'); this._hi = el; }
  }

  _unhighlight() {
    if (this._hi) { this._hi.classList.remove('tut-glow'); this._hi = null; }
  }

  end() {
    if (!this.active) return;
    this.active = false;
    clearTimeout(this.timer);
    if (this.typeIv) clearInterval(this.typeIv);
    this._unhighlight();
    window.removeEventListener('keydown', this._keyHandler);
    if (this.layer) { this.layer.remove(); this.layer = null; }
    if (this.opts.onDone) this.opts.onDone();
  }
}
