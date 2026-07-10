// director.js — the camera director. Plays SCENES (playlists of timed TAKES,
// defined in takes.js) as looping background footage, cuts to one-shot scenes
// on triggers, then returns to the interrupted background or advances to the
// scene's `next` — exactly like a vision mixer following the show's logic.
//
// Pure math: evaluates a camera pose {p, t} each frame; the Studio applies it.
// No allocation in update() (poses reuse two scratch arrays).
//
// Scene flags (takes.js): loop (background playlist), next (advance on end),
// hold (freeze on the last frame until something else plays), loopTail (loop
// the final take forever), set ('studio' | 'green' — which 3D set it needs).
//
// Reduced motion: every take renders as a locked-off frame (its mid pose) for
// its duration — cuts, never moves.

import { SCENES } from './takes.js';

const D2R = Math.PI / 180;

function easeInOut(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function lerp(a, b, k) { return a + (b - a) * k; }

export class Director {
  constructor({ reduced = false, onSet = () => {} } = {}) {
    this.reduced = reduced;
    this.onSet = onSet;          // called with 'studio' | 'green' when a scene needs that set
    this.baseName = 'intro';     // the ambient background scene
    this.current = null;         // { name, scene, takeIdx, t }
    this.queue = [];             // one-shot scenes waiting after the current one
    this._p = [0, 0, 0];         // scratch: camera position
    this._t = [0, 0, 0];         // scratch: look target
    this._start('intro');
  }

  /* ---------------- control ---------------- */

  // Set the ambient background. If only background footage is playing, cut to
  // it now; if a one-shot is mid-take, it lands here when it finishes.
  setBase(name) {
    if (!SCENES[name]) return;
    const wasBase = !this.current || this.current.name === this.baseName;
    this.baseName = name;
    if (wasBase) this._start(name);
  }

  // Cut to a one-shot scene right now (a trigger fired).
  play(name) {
    if (!SCENES[name]) return;
    this.queue = [];
    this._start(name);
  }

  // Chain a one-shot after whatever is currently playing.
  enqueue(name) {
    if (!SCENES[name]) return;
    this.queue.push(name);
  }

  // Jump straight to a scene's Nth take (the ?scene= preview tool uses this).
  playAt(name, takeIdx = 0) {
    if (!SCENES[name]) return;
    this.queue = [];
    if (SCENES[name].loop) this.baseName = name;
    this._start(name);
    this.current.takeIdx = Math.max(0, Math.min(takeIdx, this.current.scene.takes.length - 1));
  }

  // What's on screen right now (for the preview HUD).
  info() {
    const c = this.current;
    if (!c) return null;
    return { name: c.name, take: c.takeIdx + 1, takes: c.scene.takes.length, t: c.t, dur: c.scene.takes[c.takeIdx].dur };
  }

  // Freeze the camera on an explicit pose (the intro tutorial's tour uses
  // this); the next play()/setBase() takes over again.
  holdPose(p, t) {
    this.current = { name: '__hold', scene: { takes: [{ type: 'static', dur: Infinity, p, t }], hold: true }, takeIdx: 0, t: 0 };
  }

  _start(name) {
    const scene = SCENES[name];
    this.current = { name, scene, takeIdx: 0, t: 0 };
    if (scene.set) this.onSet(scene.set);
  }

  /* ---------------- per-frame ---------------- */

  // Advance time and return the camera pose { p:[x,y,z], t:[x,y,z] }.
  update(dt) {
    const cur = this.current;
    if (!cur) return null;
    const scene = cur.scene;
    const take = scene.takes[cur.takeIdx];
    cur.t += dt;

    if (cur.t >= take.dur) {
      if (cur.takeIdx < scene.takes.length - 1) {
        cur.takeIdx += 1; cur.t = 0;
      } else if (scene.loopTail) {
        cur.t = 0; // keep repeating the final take
      } else if (scene.loop) {
        cur.takeIdx = 0; cur.t = 0;
      } else if (scene.hold) {
        cur.t = take.dur; // freeze on the last frame
      } else if (this.previewLoop) {
        this._start(cur.name); // preview tool: repeat the scene under review
      } else if (this.queue.length) {
        this._start(this.queue.shift());
      } else if (scene.next && SCENES[scene.next]) {
        // advancing to a background scene re-bases on it
        if (SCENES[scene.next].loop) this.baseName = scene.next;
        this._start(scene.next);
      } else {
        this._start(this.baseName);
      }
    }

    const c = this.current; // may have changed above
    const tk = c.scene.takes[c.takeIdx];
    const k = Math.min(1, tk.dur === Infinity ? 0 : c.t / tk.dur);
    // Reduced motion: locked-off cuts — hold each take at its midpoint pose.
    this._pose(tk, this.reduced ? 0.5 : k);
    return { p: this._p, t: this._t };
  }

  _pose(take, k) {
    const e = easeInOut(k);
    const P = this._p, T = this._t;
    switch (take.type) {
      case 'orbit': {
        const a = lerp(take.from, take.to, k) * D2R; // constant angular speed
        P[0] = take.center[0] + Math.cos(a) * take.radius;
        P[1] = take.height;
        P[2] = take.center[2] + Math.sin(a) * take.radius;
        const look = take.look || take.center;
        T[0] = look[0]; T[1] = look[1]; T[2] = look[2];
        break;
      }
      case 'dolly': {
        for (let i = 0; i < 3; i++) {
          P[i] = lerp(take.from.p[i], take.to.p[i], e);
          T[i] = lerp(take.from.t[i], take.to.t[i], e);
        }
        break;
      }
      case 'pan': {
        P[0] = take.p[0]; P[1] = take.p[1]; P[2] = take.p[2];
        for (let i = 0; i < 3; i++) T[i] = lerp(take.from[i], take.to[i], e);
        break;
      }
      case 'static':
      default: {
        P[0] = take.p[0]; P[1] = take.p[1]; P[2] = take.p[2];
        T[0] = take.t[0]; T[1] = take.t[1]; T[2] = take.t[2];
        break;
      }
    }
  }

  /* ---------------- the show's cue sheet ---------------- */

  // Map a game event to camera direction. Returns true if it handled a cue.
  cue(type, data = {}) {
    switch (type) {
      case 'run:start':
        this.baseName = 'thinking';
        this.play('producerReady'); // "they're ready for you" → hostAsks via question:show
        return true;
      case 'question:show': {
        this.baseName = 'thinking';
        // The host asks at the start of each tier (Q1, Q11, Q21) and the final.
        const tierStart = data.index === 0 || data.index === 10 || data.index === 20 || data.isFinal;
        if (tierStart) {
          if (this.current && this.current.name === 'producerReady') this.enqueue('hostAsks');
          else this.play('hostAsks');
        } else if (!this.current || this.current.name !== 'producerReady') {
          this._start('thinking');
        }
        return true;
      }
      case 'answer:lock': this.play('finalAnswer'); return true;
      case 'answer:correct': this.play('correct'); return true;
      case 'answer:wrong': this.play('incorrect'); return true;
      case 'coins:bank': this.enqueue('hostExplains'); return true;
      case 'run:win': this.baseName = 'finalCorrect'; this.play('finalCorrect'); return true;
      case 'lifeline:use':
        if (data.type === 'fifty') this.play('fifty');
        else if (data.type === 'audience') this.play('audiencePoll');
        else this.play('phoneFriend');
        return true;
      case 'steve:call': this.play('sketchyCall'); return true;
      case 'green:manager': this.play('managerDoor'); return true;
      case 'scene:green': this.setBase('greenRoom'); this.play('greenRoom'); return true;
      case 'scene:studio': this.setBase('intro'); this.play('intro'); return true;
      default: return false;
    }
  }
}
