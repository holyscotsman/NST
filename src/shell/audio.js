// audio.js — original synthesized cues via WebAudio. No licensed music, no
// recreation of any existing show's audio (CLAUDE.md §6). Everything here is
// generated from oscillators + envelopes at runtime, so nothing is shipped as a
// sound file. Silent until the first user gesture (browser autoplay policy).

const NOTES = { C4: 261.63, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, A3: 220, E3: 164.81 };

export class GameAudio {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
  }

  _ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      return true;
    } catch { return false; }
  }

  resume() { if (this._ensure() && this.ctx.state === 'suspended') this.ctx.resume(); }
  setEnabled(v) { this.enabled = v; }

  _noise() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = Math.floor(this.ctx.sampleRate * 0.12);
    this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this._noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return this._noiseBuf;
  }

  // A muffled double cough from somewhere in the crowd (diegetic flavor).
  _cough(t) {
    for (const [at, dur, gain] of [[0, 0.09, 0.05], [0.16, 0.07, 0.035]]) {
      const src = this.ctx.createBufferSource();
      src.buffer = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 750; f.Q.value = 1.4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t + at);
      g.gain.exponentialRampToValueAtTime(0.0005, t + at + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t + at); src.stop(t + at + dur + 0.02);
    }
  }

  _tone(freq, start, dur, { type = 'sine', gain = 0.5, glideTo = null } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(this.master);
    o.start(start); o.stop(start + dur + 0.02);
  }

  play(name) {
    if (!this.enabled || !this._ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    switch (name) {
      case 'select': this._tone(NOTES.E5, t, 0.08, { type: 'triangle', gain: 0.28 }); break;
      case 'reveal': this._tone(NOTES.C5, t, 0.05, { type: 'sine', gain: 0.12 }); break; // soft tick as each answer reads out
      case 'lock':   this._tone(NOTES.C4, t, 0.14, { type: 'sawtooth', gain: 0.3, glideTo: NOTES.G4 }); break;
      case 'lifeline':
        this._tone(NOTES.G4, t, 0.1, { type: 'triangle', gain: 0.3 });
        this._tone(NOTES.C5, t + 0.08, 0.14, { type: 'triangle', gain: 0.3 });
        break;
      case 'correct': // rising major arpeggio
        [NOTES.C5, NOTES.E5, NOTES.G5].forEach((f, i) => this._tone(f, t + i * 0.07, 0.18, { type: 'triangle', gain: 0.34 }));
        break;
      case 'bank':    // brighter, gold flourish
        [NOTES.G4, NOTES.C5, NOTES.E5, NOTES.G5].forEach((f, i) => this._tone(f, t + i * 0.06, 0.22, { type: 'square', gain: 0.18 }));
        break;
      case 'wrong':   // descending, minor, buzzy
        this._tone(NOTES.A3, t, 0.5, { type: 'sawtooth', gain: 0.3, glideTo: NOTES.E3 });
        this._tone(NOTES.E3, t + 0.06, 0.5, { type: 'square', gain: 0.14 });
        break;
      case 'win':     // fanfare
        [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => this._tone(f, t + i * 0.11, 0.4, { type: 'triangle', gain: 0.32 }));
        [NOTES.C4, NOTES.G4].forEach((f, i) => this._tone(f, t + i * 0.22, 0.5, { type: 'sawtooth', gain: 0.12 }));
        break;
      case 'tension': // low pulse (kept short, non-looping)
        this._tone(NOTES.A3, t, 0.6, { type: 'sine', gain: 0.16 });
        break;
      case 'cough': this._cough(t); break;
      default: break;
    }
  }
}
