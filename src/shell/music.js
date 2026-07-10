// music.js — procedural music engine. ORIGINAL compositions synthesized at
// runtime with WebAudio (CLAUDE.md §6: original only, never licensed cues, no
// recreation of any existing show's music). No audio files ship with the game.
//
// Tracks (looping):
//   lounge   — main menu + green room: relaxed, elevator-jazz vamp
//   easy     — bright and quick (G major, 126 BPM)
//   medium   — a step tenser and lower (E minor, 110 BPM)
//   hard     — slower and darker still (C minor, 94 BPM)
//   final    — slow, low, ominous (C# minor drone + heartbeat, 76 BPM)
//   lifeline — quirky thinking vamp; push()ed over a tier loop, pop() restores
// Stingers (one-shot, duck the music while they play):
//   right (quick positive), wrong (~3s), finalWrong (~4s dramatic), win fanfare
//
// Engine: a lookahead step scheduler (setInterval ~60ms, schedules ~0.25s
// ahead) — no allocation-heavy graphs; one shared noise buffer for percussion.

const A4 = 440;
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function N(name) { // 'C4' -> frequency
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  const midi = 12 * (Number(m[2]) + 1) + NOTE_IDX[m[1]];
  return A4 * Math.pow(2, (midi - 69) / 12);
}

/* ------------------------------------------------------------------ tracks
   Voice event: [beat, note(s), lengthInBeats, velocity 0..1]
   Voice: { wave, gain, cutoff?, decay? ('pluck' short envelope) }            */

// The show's question hook — ONE melodic contour shared by the tier loops:
// bright and high in the easy round, then the SAME melody a key lower and in
// minor for medium, so the rounds feel related but the stakes clearly rise.
const HOOK = [0, 1, 2, 1, 0, 2, 1, 3]; // chord-tone indices, half-beat steps
function hookArp(chords, len) {
  const seq = [];
  chords.forEach((notes, c) => HOOK.forEach((idx, i) => seq.push([c * 4 + i * 0.5, notes[idx], len])));
  return seq;
}
// Driving eighth-note bass alternating root and the octave above.
function pumpBass(lo, hi, len) {
  const seq = [];
  for (let i = 0; i < 16; i++) seq.push([i, (i % 2 ? hi : lo)[i >> 1], len, i % 4 === 0 ? 1 : 0.7]);
  return seq;
}

const TRACKS = {
  // Menu + green room. Laid-back major-7 vamp — the waiting-room record.
  lounge: {
    bpm: 76, beats: 16, gain: 0.7,
    voices: [
      { wave: 'sine', gain: 0.45, kind: 'bass', notes: [
        [0, 'C2', 1.6], [2, 'G2', 1.6], [4, 'A1', 1.6], [6, 'E2', 1.6],
        [8, 'F2', 1.6], [10, 'C2', 1.6], [12, 'G1', 1.6], [14, 'B1', 1.6],
      ] },
      { wave: 'triangle', gain: 0.30, kind: 'chord', notes: [
        [0.5, ['E3', 'G3', 'B3'], 2.6], [4.5, ['E3', 'G3', 'C4'], 2.6],
        [8.5, ['F3', 'A3', 'C4'], 2.6], [12.5, ['F3', 'G3', 'B3'], 2.6],
      ] },
      { wave: 'sine', gain: 0.16, kind: 'lead', pluck: 0.5, notes: [
        [2, 'E4', 0.9], [3, 'G4', 0.9], [6.5, 'B4', 1.2], [10, 'A4', 0.9], [11, 'G4', 0.9], [14.5, 'D4', 1.2],
      ] },
    ],
  },

  // Easy tier — up-tempo and bright, with a dramatic backbone: a pounding
  // downbeat, a saw-pad chord bed, and the show hook riding a I–V–vi–IV turn.
  easy: {
    bpm: 128, beats: 16, gain: 0.72,
    voices: [
      { wave: 'triangle', gain: 0.5, kind: 'bass', notes: pumpBass(
        ['G2', 'G2', 'D2', 'D2', 'E2', 'E2', 'C2', 'C2'],
        ['G3', 'G3', 'D3', 'D3', 'E3', 'E3', 'C3', 'C3'], 0.45) },
      { wave: 'sawtooth', gain: 0.055, kind: 'pad', cutoff: 1000, notes: [
        [0, ['G3', 'B3', 'D4'], 3.6], [4, ['D3', 'F#3', 'A3'], 3.6],
        [8, ['E3', 'G3', 'B3'], 3.6], [12, ['C3', 'E3', 'G3'], 3.6],
      ] },
      { wave: 'square', gain: 0.10, kind: 'arp', pluck: 0.35, notes: hookArp([
        ['G4', 'B4', 'D5', 'G5'], ['D4', 'F#4', 'A4', 'D5'],
        ['E4', 'G4', 'B4', 'E5'], ['C4', 'E4', 'G4', 'C5'],
      ], 0.4) },
      { kind: 'thump', gain: 0.22, notes: [[0, 0, .3], [4, 0, .3], [8, 0, .3], [12, 0, .3]] },
      { kind: 'hat', gain: 0.06, notes: (() => { const s = []; for (let i = 0; i < 16; i++) s.push([i + 0.5, 0, 0.05]); return s; })() },
    ],
  },

  // Medium tier — the SAME hook melody, dropped a key into E minor and an
  // octave lower, slower and darker: familiar tune, serious room.
  medium: {
    bpm: 108, beats: 16, gain: 0.72,
    voices: [
      { wave: 'triangle', gain: 0.5, kind: 'bass', notes: (() => {
        const seq = []; const roots = ['E2', 'E2', 'B1', 'B1', 'C2', 'C2', 'A1', 'A1'];
        for (let i = 0; i < 16; i++) seq.push([i, roots[i >> 1], 0.42, i % 4 === 0 ? 1 : 0.65]);
        return seq;
      })() },
      { wave: 'sawtooth', gain: 0.05, kind: 'pad', cutoff: 750, notes: [
        [0, ['E3', 'G3', 'B3'], 3.6], [4, ['B2', 'D#3', 'F#3'], 3.6],
        [8, ['C3', 'E3', 'G3'], 3.6], [12, ['A2', 'C3', 'E3'], 3.6],
      ] },
      { wave: 'square', gain: 0.08, kind: 'arp', pluck: 0.3, notes: hookArp([
        ['E3', 'G3', 'B3', 'E4'], ['B2', 'D#3', 'F#3', 'B3'],
        ['C3', 'E3', 'G3', 'C4'], ['A2', 'C3', 'E3', 'A3'],
      ], 0.35) },
      { kind: 'thump', gain: 0.16, notes: [[0, 0, .3], [4, 0, .3], [8, 0, .3], [12, 0, .3]] },
      { kind: 'hat', gain: 0.05, notes: [[1, 0, .05], [3, 0, .05], [5, 0, .05], [7, 0, .05], [9, 0, .05], [11, 0, .05], [13, 0, .05], [15, 0, .05]] },
    ],
  },

  // Hard tier — slow, low, sparse. Space is the tension.
  hard: {
    bpm: 94, beats: 16, gain: 0.74,
    voices: [
      { wave: 'sine', gain: 0.55, kind: 'bass', notes: [
        [0, 'C2', 1.8], [3.5, 'C2', 0.4], [4, 'Ab1', 1.8], [7.5, 'Ab1', 0.4],
        [8, 'F1', 1.8], [11.5, 'F1', 0.4], [12, 'G1', 1.8], [15.5, 'G1', 0.4],
      ] },
      { wave: 'sawtooth', gain: 0.045, kind: 'pad', cutoff: 620, notes: [
        [0, ['C3', 'Eb3', 'G3'], 3.7], [4, ['Ab2', 'C3', 'Eb3'], 3.7],
        [8, ['F2', 'Ab2', 'C3'], 3.7], [12, ['G2', 'B2', 'D3'], 3.7],
      ] },
      { wave: 'triangle', gain: 0.09, kind: 'lead', pluck: 0.45, notes: [
        [2, 'G4', 0.7], [3, 'Eb4', 0.7], [6, 'C4', 0.9], [10, 'Ab4', 0.7], [11, 'G4', 0.7], [14, 'D4', 1.2],
      ] },
      { kind: 'thump', gain: 0.30, notes: [[0, 0, .3], [4, 0, .3], [8, 0, .3], [12, 0, .3]] },
    ],
  },

  // The final question — a low drone, a heartbeat, and a nervous shimmer.
  final: {
    bpm: 76, beats: 8, gain: 0.8,
    voices: [
      { wave: 'sawtooth', gain: 0.05, kind: 'pad', cutoff: 420, notes: [[0, ['C#2', 'G#2'], 7.8]] },
      { wave: 'sine', gain: 0.5, kind: 'bass', notes: [[0, 'C#1', 7.8]] },
      { kind: 'thump', gain: 0.4, notes: [[0, 0, .3], [0.5, 0, .22], [4, 0, .3], [4.5, 0, .22]] },
      { wave: 'triangle', gain: 0.05, kind: 'arp', pluck: 0.22, notes: [
        [2, 'C#5', .3], [2.5, 'E5', .3], [3, 'G#5', .3], [6, 'D5', .3], [6.5, 'C#5', .3], [7, 'G#4', .3],
      ] },
    ],
  },

  // Lifeline — a curious, airy thinking-music vamp (Dm7 / G7).
  lifeline: {
    bpm: 104, beats: 8, gain: 0.7,
    voices: [
      { wave: 'sine', gain: 0.4, kind: 'bass', notes: [[0, 'D2', 1.7], [2, 'A2', 1.7], [4, 'G2', 1.7], [6, 'B2', 1.7]] },
      { wave: 'triangle', gain: 0.17, kind: 'arp', pluck: 0.28, notes: [
        [0, 'F4', .35], [0.5, 'A4', .35], [1, 'C5', .35], [1.5, 'E5', .35],
        [2, 'C5', .35], [2.5, 'A4', .35], [3, 'F4', .35], [3.5, 'A4', .35],
        [4, 'F4', .35], [4.5, 'B4', .35], [5, 'D5', .35], [5.5, 'F5', .35],
        [6, 'D5', .35], [6.5, 'B4', .35], [7, 'G4', .35], [7.5, 'B4', .35],
      ] },
      { kind: 'hat', gain: 0.045, notes: [[0.5, 0, .05], [1.5, 0, .05], [2.5, 0, .05], [3.5, 0, .05], [4.5, 0, .05], [5.5, 0, .05], [6.5, 0, .05], [7.5, 0, .05]] },
    ],
  },
};

const LOOKAHEAD_S = 0.28;
const TICK_MS = 60;

export class Music {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
    this.ctx = null;
    this.currentName = null;
    this.stack = [];
    this._loop = null; // { track, spb, loopStart, nextEventIdx flattened }
    this._timer = null;
  }

  _ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      this.bus = this.ctx.createGain(); // loop bus (ducked under stingers)
      this.bus.gain.value = 1;
      this.bus.connect(this.master);
      // shared noise buffer for hats
      const len = Math.floor(this.ctx.sampleRate * 0.1);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch { return false; }
  }

  resume() { if (this._ensure() && this.ctx.state === 'suspended') this.ctx.resume(); }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.stop();
  }

  /* ---------------- loop control ---------------- */

  play(name) {
    if (!this.enabled || !TRACKS[name]) return;
    if (this.currentName === name) return;
    if (!this._ensure()) return;
    this.resume();
    this._fadeOutCurrent();
    this.currentName = name;
    const track = TRACKS[name];
    const spb = 60 / track.bpm;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(track.gain, this.ctx.currentTime + 0.6);
    gain.connect(this.bus);
    this._loop = { track, spb, out: gain, loopStart: this.ctx.currentTime + 0.05, beatCursor: 0 };
    if (!this._timer) this._timer = setInterval(() => this._tick(), TICK_MS);
  }

  push(name) {
    if (!this.enabled) return;
    if (this.currentName && this.currentName !== name) this.stack.push(this.currentName);
    this.play(name);
  }

  pop() {
    const prev = this.stack.pop();
    if (prev) this.play(prev);
  }

  stop() {
    this._fadeOutCurrent();
    this.currentName = null;
    this.stack = [];
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  _fadeOutCurrent() {
    if (this._loop && this.ctx) {
      const g = this._loop.out.gain;
      g.cancelScheduledValues(this.ctx.currentTime);
      g.setValueAtTime(Math.max(g.value, 0.0001), this.ctx.currentTime);
      g.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
      const dead = this._loop.out;
      setTimeout(() => { try { dead.disconnect(); } catch { /* gone */ } }, 900);
    }
    this._loop = null;
  }

  // A subtle snare-roll crescendo under the hard-round suspense beat. Ends
  // with a quick choke so the reveal stinger lands on silence.
  drumRoll(seconds = 3) {
    if (!this.enabled || !this._ensure()) return;
    this.resume();
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise; src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass'; band.Q.value = 0.9;
    band.frequency.setValueAtTime(1500, t);
    band.frequency.linearRampToValueAtTime(2100, t + seconds); // brightens as it builds
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.012, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.05, t + seconds);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.12);
    // tremolo so it reads as sticks on a snare, not static
    const lfo = ctx.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 16;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0.008, t);
    depth.gain.linearRampToValueAtTime(0.03, t + seconds);
    lfo.connect(depth); depth.connect(g.gain);
    src.connect(band); band.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + seconds + 0.2);
    lfo.start(t); lfo.stop(t + seconds + 0.2);
  }

  duck(seconds = 1.2, depth = 0.3) {
    if (!this.ctx) return;
    const g = this.bus.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(depth, t + 0.08);
    g.setValueAtTime(depth, t + seconds - 0.4);
    g.linearRampToValueAtTime(1, t + seconds);
  }

  /* ---------------- scheduler ---------------- */

  _tick() {
    const L = this._loop;
    if (!L || !this.ctx) return;
    const now = this.ctx.currentTime;
    const horizon = now + LOOKAHEAD_S;
    const loopDur = L.track.beats * L.spb;
    // schedule any events whose absolute time falls inside the window
    while (true) {
      const beatAbs = L.beatCursor; // absolute beats since loopStart
      const within = L.loopStart + beatAbs * L.spb;
      if (within >= horizon) break;
      // Skip anything already in the past (suspended context, throttled tab) so
      // resuming never bursts a backlog of piled-up notes.
      if (within >= now - 0.03) {
        const beatInLoop = beatAbs % L.track.beats;
        for (const v of L.track.voices) {
          for (const ev of v.notes) {
            if (Math.abs(ev[0] - beatInLoop) < 1e-6) this._event(v, ev, within, L.spb, L.out);
          }
        }
      }
      L.beatCursor += 0.5; // half-beat grid
    }
  }

  _event(voice, ev, t, spb, out) {
    const [, note, lenBeats, vel = 0.8] = ev;
    const dur = Math.max(0.06, lenBeats * spb);
    if (voice.kind === 'hat') return this._hat(t, voice.gain * vel, out);
    if (voice.kind === 'thump') return this._thump(t, voice.gain * vel, out);
    const notes = Array.isArray(note) ? note : [note];
    for (const nm of notes) this._voiceNote(voice, N(nm), t, dur, vel, out);
  }

  _voiceNote(voice, freq, t, dur, vel, out) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = voice.wave || 'sine';
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    const peak = (voice.gain || 0.2) * vel;
    const att = 0.015;
    const rel = voice.pluck ? Math.min(dur, voice.pluck) : dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0012), t + att);
    g.gain.exponentialRampToValueAtTime(0.0008, t + rel + 0.03);
    let head = o;
    if (voice.cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(voice.cutoff, t);
      o.connect(f); head = f;
    }
    head.connect(g); g.connect(out);
    o.start(t); o.stop(t + rel + 0.08);
  }

  _hat(t, gain, out) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.045);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t); src.stop(t + 0.06);
  }

  _thump(t, gain, out) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.28);
    o.connect(g); g.connect(this.masterOr(out));
    o.start(t); o.stop(t + 0.3);
  }

  masterOr(out) { return out || this.master; }

  /* ---------------- stingers ---------------- */

  _sting(freq, t, dur, { type = 'triangle', gain = 0.3, glideTo = null } = {}) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  stinger(name) {
    if (!this._ensure()) return;
    this.resume();
    const t = this.ctx.currentTime;
    if (name === 'right') {
      // the good sound: a bright major stab with a sparkle on top
      this.duck(1.1);
      [N('C5'), N('E5'), N('G5')].forEach((f) => this._sting(f, t, 0.5, { gain: 0.26 }));
      this._sting(N('C6'), t + 0.09, 0.42, { type: 'sine', gain: 0.2 });
      this._sting(N('G4'), t, 0.3, { type: 'square', gain: 0.07 });
    } else if (name === 'wrong') {
      // ~3s: a hard minor hit, a long fall, and a low rumble fading out
      this.duck(3.2, 0.15);
      [N('C4'), N('Eb4'), N('Gb4')].forEach((f) => this._sting(f, t, 1.1, { type: 'sawtooth', gain: 0.14 }));
      this._sting(N('C3'), t + 0.15, 2.4, { type: 'sawtooth', gain: 0.2, glideTo: N('F#2') });
      this._sting(N('C2'), t + 0.3, 2.7, { type: 'sine', gain: 0.3, glideTo: N('C1') });
      this._thump(t + 0.02, 0.5);
    } else if (name === 'finalWrong') {
      // ~4s: the dramatic one — double impact, tritone brass fall, dark resolve
      this.duck(4.4, 0.1);
      this._thump(t, 0.6); this._thump(t + 0.5, 0.55);
      [N('C#3'), N('G3')].forEach((f, i) => this._sting(f, t + 0.1, 1.6, { type: 'sawtooth', gain: 0.18 - i * 0.04, glideTo: f * 0.84 }));
      this._sting(N('C#4'), t + 0.9, 2.6, { type: 'sawtooth', gain: 0.12, glideTo: N('G#3') });
      this._sting(N('C#2'), t + 1.2, 2.8, { type: 'sine', gain: 0.32, glideTo: N('C#1') });
      [N('C#3'), N('E3'), N('G#3')].forEach((f) => this._sting(f, t + 3.1, 0.9, { type: 'triangle', gain: 0.1 }));
    } else if (name === 'win') {
      this.duck(3.5, 0.12);
      [N('C5'), N('E5'), N('G5'), N('C6')].forEach((f, i) => this._sting(f, t + i * 0.12, 0.5, { gain: 0.3 }));
      [N('C4'), N('G4')].forEach((f, i) => this._sting(f, t + 0.25 + i * 0.22, 0.6, { type: 'sawtooth', gain: 0.1 }));
      [N('F5'), N('A5'), N('C6')].forEach((f) => this._sting(f, t + 0.85, 0.8, { gain: 0.22 }));
      [N('G5'), N('B5'), N('D6')].forEach((f) => this._sting(f, t + 1.5, 0.9, { gain: 0.22 }));
      [N('C5'), N('E5'), N('G5'), N('C6')].forEach((f) => this._sting(f, t + 2.3, 1.4, { gain: 0.28 }));
    }
  }
}
