// studio.js — the persistent WebGL backdrop. Built once; scenes are camera moves
// and lighting/prop swaps, not rebuilds (CLAUDE.md §5). Owns the single RAF.
// The quiz itself is a DOM overlay drawn on top of this canvas — never rendered
// in GL — which is what keeps the game accessible.
//
// Adapted and modularised from the 3D studio prototype. Original neon identity
// only; stick figures + glow; no cloned trade dress.

import * as THREE from 'three';
import { Director } from './director.js';

const PAL = { iris: 0x7855FA, aqua: 0x1FDDE9, mantis: 0x92DD23, peach: 0xFF6B5B, gold: 0xFFC857 };

// Locked-off poses used by the intro tutorial's tour (director.holdPose).
const PRESETS = {
  two:    { p: [0, 3.3, 12],  t: [0, 1.4, 0] },
  host:   { p: [-3.2, 1.9, 4], t: [2.1, 1.5, 0] },
  player: { p: [3.2, 1.9, 4],  t: [-2.1, 1.5, 0] },
  over:   { p: [0, 13, 5],     t: [0, 0.6, 0] },
  aud:    { p: [0, 3.2, 3],     t: [0, 3, -13] },
  green:  { p: [4.6, 3.2, 6],   t: [-0.5, 1.2, -4] },
};

export class Studio {
  constructor(container, opts = {}) {
    this.container = container;
    this.reduced = !!opts.reducedMotion;
    this.onError = opts.onError || (() => {});
    this.beams = [];
    this.disposed = false;
    this.useBloom = false;
    this.mood = { key: PAL.iris, intensity: 1 };
    this.pulse = { color: null, active: false, t: 0, dur: 0.7 };
    this._look = new THREE.Vector3();
    this._spin = 1; // beam spin multiplier (bumped on wins)
    this.onAmbient = opts.onAmbient || (() => {}); // little diegetic sounds (a cough in the crowd)
    this._talk = 0;      // seconds the host (or door manager) keeps "talking"
    this._mood = null;   // { kind: 'happy' | 'sad', t } — face reactions
    this._dummy = new THREE.Object3D(); // scratch for instanced-matrix updates
    this._hiddenMat = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    this._moodTarget = new THREE.Color(PAL.iris); // key-light colour eases toward this
  }

  async init() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92; // keep the stage moody, not blown out
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;
    this.container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    // The camera director owns every shot (takes.js); it swaps 3D sets as its
    // scenes demand. Manual orbiting is retired — this is broadcast footage.
    this.director = new Director({ reduced: this.reduced, onSet: (set) => this.setScene(set) });

    this.clock = new THREE.Clock();
    this.studio = this._buildStudio();
    this.green = this._buildGreen();
    this.active = this.studio;

    await this._setupBloom();
    window.addEventListener('resize', this._onResize);
    renderer.setAnimationLoop(this._tick);
  }

  async _setupBloom() {
    try {
      const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
      const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
      const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.active, this.camera));
      // gentle bloom: strong bloom washed out the host/contestant/audience
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.45, 0.34));
      this.composer.addPass(new OutputPass());
      this.useBloom = true;
    } catch {
      this.useBloom = false; // graceful: direct render still looks good
    }
  }

  /* ---------- public API ---------- */

  setScene(name) {
    const target = name === 'green' ? this.green : this.studio;
    if (this.active === target) return;
    this.active = target;
    if (this.useBloom && this.composer) this.composer.passes[0].scene = this.active;
  }

  // Freeze on a named pose (used by the intro tutorial's tour).
  cutTo(camKey) {
    const P = PRESETS[camKey];
    if (P) this.director.holdPose(P.p, P.t);
  }

  // React to a quiz event: the director cues the camera (scene playlists in
  // takes.js); this switch keeps the lighting side — mood, pulses, beam spin.
  react(type, data = {}) {
    this.director.cue(type, data);
    switch (type) {
      case 'question:show':
        if (data.isFinal) this._setMood(PAL.gold, 1.15);
        else if (data.tier === 'hard') this._setMood(PAL.iris, 1.05);
        else if (data.tier === 'medium') this._setMood(PAL.aqua, 1.0);
        else this._setMood(PAL.iris, 0.95);
        this._talk = 2.6; // the host reads it out
        break;
      case 'host:welcome':
        this._talk = 3.6;
        break;
      case 'answer:correct':
        this._flash(PAL.mantis);
        this._mood = { kind: 'happy', t: 2.2, total: 2.2 };
        break;
      case 'answer:wrong':
        this._flash(PAL.peach);
        this._setMood(PAL.peach, 0.7);
        this._mood = { kind: 'sad', t: 2.8, total: 2.8 };
        break;
      case 'run:win':
        this._setMood(PAL.gold, 1.3);
        this._spin = this.reduced ? 1 : 3;
        this._mood = { kind: 'happy', t: 8, total: 8 };
        break;
      case 'run:dead':
        this._setMood(0x223, 0.5);
        break;
      case 'green:manager':
        // the stage manager opens the green-room door and stands by it
        if (this._greenSM) this._greenSM.visible = true;
        this._doorT = 0;
        this._talk = 3.4; // "we're ready for you back in the Hot Seat!"
        break;
      case 'scene:green':
        // fresh visit: the door is shut, the manager is back in the hallway
        if (this._greenDoor) this._greenDoor.rotation.y = 0;
        if (this._greenSM) this._greenSM.visible = false;
        this._doorT = null;
        break;
      default: break;
    }
  }

  resize() { this._onResize(); }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      if (this.composer && this.composer.dispose) this.composer.dispose();
      this.renderer.dispose();
      [this.studio, this.green].forEach((sc) => sc && sc.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          // material.dispose() does not free its textures — do it explicitly.
          if (m.map) m.map.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          m.dispose();
        });
      }));
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  /* ---------- internals ---------- */

  _setMood(color, intensity) {
    this.mood.key = color;
    this.mood.intensity = intensity;
    // The key light eases toward the new colour in _tick (smooth tier changes)
    // rather than snapping. Under reduced motion it snaps in _tick.
    if (this._moodTarget) this._moodTarget.setHex(color);
    if (this._keyLight && this.reduced) this._keyLight.color.setHex(color);
  }

  _flash(color) {
    if (this.reduced) return; // reduced motion: no strobe/pulse
    if (!this.pulse.color) this.pulse.color = new THREE.Color();
    this.pulse.color.setHex(color); // reuse the Color instance
    this.pulse.active = true;
    this.pulse.t = 0;
  }

  _tick = () => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    this.director.reduced = this.reduced;
    const pose = this.director.update(dt);
    if (pose) {
      this.camera.position.set(pose.p[0], pose.p[1], pose.p[2]);
      this._look.set(pose.t[0], pose.t[1], pose.t[2]);
      this.camera.lookAt(this._look);
    }

    if (!this.reduced && this.active === this.studio) {
      const t = this.clock.elapsedTime;
      for (const b of this.beams) {
        b.rotation.z = Math.cos(b.userData.base + t * 0.3 * this._spin) * 0.2;
        b.rotation.x = Math.sin(b.userData.base + t * 0.3 * this._spin) * 0.2;
      }
      if (this._spin > 1) this._spin = Math.max(1, this._spin - dt * 0.6);
      this._crowdTick(dt, t);
    }

    // Key light eases toward the current tier/mood colour (smooth transitions).
    if (this._keyLight && this._moodTarget && !this.reduced) {
      this._keyLight.color.lerp(this._moodTarget, Math.min(1, dt * 2.6));
    }

    // Life pass: blinking, breathing, head sway, talking mouths, reactions.
    // Skipped entirely under reduced motion.
    if (!this.reduced) {
      if (this._talk > 0) this._talk -= dt;
      if (this._mood && (this._mood.t -= dt) <= 0) this._mood = null;
      this._animatePeople(this.clock.elapsedTime);
    }

    // Green-room door swing (green:manager) — eased open over ~1.1s; reduced
    // motion snaps it open in a single cut.
    if (this._doorT != null && this._greenDoor) {
      this._doorT = this.reduced ? 1 : Math.min(1, this._doorT + dt / 1.1);
      const e = 1 - Math.pow(1 - this._doorT, 3);
      this._greenDoor.rotation.y = e * 1.5; // swings inward, into the lounge
      if (this._doorT >= 1) this._doorT = null;
    }

    // Flash pulse via the warm light (bounded, < 3Hz, reduced-motion exits above).
    if (this.pulse.active && this._pulseLight) {
      this.pulse.t += dt;
      const k = Math.min(1, this.pulse.t / this.pulse.dur);
      const amt = Math.sin(k * Math.PI); // up then down, single pulse
      this._pulseLight.color.copy(this.pulse.color);
      this._pulseLight.intensity = 14 + amt * 90;
      if (k >= 1) { this.pulse.active = false; this._pulseLight.intensity = 14; }
    }

    if (this.useBloom && this.composer) {
      try { this.composer.render(); }
      catch { this.useBloom = false; this.renderer.render(this.active, this.camera); }
    } else {
      this.renderer.render(this.active, this.camera);
    }
  };

  _onResize = () => {
    if (!this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  /* ---------- the life pass: idle motion, faces, crowd moments ---------- */

  // Drives every registered person on the ACTIVE set. Pure trig on stored
  // refs — no allocation. Each person gets a phase offset so the room never
  // moves in lockstep.
  _animatePeople(t) {
    const list = this.active === this.studio ? this._studioPeople : this._greenPeople;
    if (!list) return;
    const mood = this._mood;
    const talker = this.active === this.studio ? 'host' : 'greenSM'; // depends only on the set
    for (const a of list) {
      if (!a.g.visible) continue;
      const ph = a.phase;
      const P = a.parts;
      // breathing + a slow, slight head wander
      P.torso.scale.y = 1 + Math.sin(t * 1.6 + ph) * 0.013;
      P.head.rotation.y = Math.sin(t * 0.37 + ph) * (a.role === 'crew' ? 0.3 : 0.12);
      P.head.rotation.x = Math.sin(t * 0.29 + ph * 2) * 0.05;
      // blinking: a quick lid-drop every few seconds, offset per person
      const blink = ((t + ph * 1.31) % 3.6) < 0.1 ? 0.12 : 1;
      P.eyeL.scale.y = blink; P.eyeR.scale.y = blink;
      // idle arm sway around the posed base (the crowd actor's arms belong to
      // the crowd-moment animation while one is running)
      const actorBusy = a.role === 'extra' && this._crowd && this._crowd.event;
      if (!actorBusy) {
        P.armL.rotation.z = a.armL + Math.sin(t * 0.8 + ph) * 0.05;
        P.armR.rotation.z = a.armR + Math.sin(t * 0.8 + ph + 1.3) * 0.05;
      }

      if (a.role === 'greenSM') {
        // holding the door: a clear beckoning wave
        P.armR.rotation.z = a.armR + Math.sin(t * 6) * 0.28;
      }

      // faces: reactions win, then talking, then each role's resting face
      if (mood && (a.role === 'host' || a.role === 'player')) {
        setMouth(P, mood.kind === 'happy' ? 'smile' : 'frown');
        // ease the reaction in over the first 0.35s and out over the last 0.35s
        const env = Math.max(0, Math.min(1, mood.t / 0.35, (mood.total - mood.t) / 0.35));
        P.head.rotation.x += (mood.kind === 'happy' ? -0.06 : 0.22) * env; // lift / drop
        if (mood.kind === 'happy' && a.role === 'player') {
          // arms up in relief — smoothly in and back down with the envelope
          P.armL.rotation.z = a.armL * (1 - env) + 2.3 * env;
          P.armR.rotation.z = a.armR * (1 - env) - 2.3 * env;
        }
      } else if (this._talk > 0 && a.role === talker) {
        setMouth(P, Math.sin(t * 11) > -0.2 ? 'open' : 'flat');
      } else {
        setMouth(P, a.role === 'host' ? 'smile' : 'flat');
      }
    }
  }

  // Occasional audience moments: a wave, a cough (with its little sound), or
  // someone getting up and leaving. One at a time, never under reduced motion.
  // Build (into the shared scratch Object3D) the instance matrix for a seat.
  _seatMatrix(seat, scale) {
    const d = this._dummy;
    d.position.set(seat.x, seat.y, seat.z);
    d.rotation.set(0, seat.rotY, 0);
    d.scale.setScalar(scale);
    d.updateMatrix();
    return d.matrix;
  }

  _crowdTick(dt, t) {
    const c = this._crowd;
    if (!c) return;
    // restore a seat someone walked out of
    if (c.restoreIdx >= 0 && t >= c.restoreAt) {
      c.mesh.setMatrixAt(c.restoreIdx, this._seatMatrix(c.seats[c.restoreIdx], c.seats[c.restoreIdx].scale));
      c.mesh.instanceMatrix.needsUpdate = true;
      c.restoreIdx = -1;
    }
    const ev = c.event;
    if (ev) {
      ev.t += dt;
      const seat = c.seats[ev.idx];
      if (ev.kind === 'cough') {
        // a couple of quick shoulder jolts
        c.mesh.setMatrixAt(ev.idx, this._seatMatrix(seat, seat.scale * (1 + Math.abs(Math.sin(ev.t * 24)) * 0.05)));
        c.mesh.instanceMatrix.needsUpdate = true;
        if (ev.t >= 0.5) {
          c.mesh.setMatrixAt(ev.idx, this._seatMatrix(seat, seat.scale));
          c.mesh.instanceMatrix.needsUpdate = true;
          c.event = null;
        }
      } else if (ev.kind === 'wave') {
        c.actor.userData.parts.armR.rotation.z = -2.0 + Math.sin(ev.t * 7) * 0.5;
        if (ev.t >= 2.8) {
          c.actor.visible = false;
          c.mesh.setMatrixAt(ev.idx, this._seatMatrix(seat, seat.scale));
          c.mesh.instanceMatrix.needsUpdate = true;
          c.event = null;
        }
      } else if (ev.kind === 'leave') {
        // shuffle away from the stage, up the aisle, with a little walk-bob
        const r = Math.hypot(seat.x, seat.z) || 1;
        const dist = ev.t * 0.85;
        c.actor.position.set(seat.x + (seat.x / r) * dist, seat.y + Math.abs(Math.sin(ev.t * 9)) * 0.04, seat.z + (seat.z / r) * dist);
        if (ev.t >= 3.4) {
          c.actor.visible = false;
          c.restoreIdx = ev.idx; c.restoreAt = t + 22; // their seat sits empty a while
          c.event = null;
        }
      }
      if (!c.event) c.nextAt = t + 9 + Math.random() * 13;
      return;
    }
    if (t < c.nextAt || c.restoreIdx >= 0) return;
    // start a new moment (presentation-only randomness — gameplay is elsewhere)
    const idx = Math.floor(Math.random() * c.seats.length);
    const kind = ['wave', 'cough', 'leave'][Math.floor(Math.random() * 3)];
    c.event = { kind, idx, t: 0 };
    const seat = c.seats[idx];
    if (kind === 'cough') {
      this.onAmbient('cough');
    } else {
      // swap the instance for the animated actor
      c.mesh.setMatrixAt(idx, this._hiddenMat);
      c.mesh.instanceMatrix.needsUpdate = true;
      c.actor.position.set(seat.x, seat.y, seat.z);
      c.actor.rotation.y = seat.rotY;
      c.actor.scale.setScalar(seat.scale * 0.97);
      c.actor.userData.parts.armR.rotation.z = kind === 'wave' ? -2.0 : c.actor.userData.parts.armR.rotation.z;
      c.actor.visible = true;
    }
  }

  /* ---------- scene builders (from the prototype) ---------- */

  _buildStudio() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x05050d);
    s.fog = new THREE.FogExp2(0x05050d, 0.018);

    // dimmer wash so the figures and set read against the dark (was 120/90/40)
    s.add(new THREE.AmbientLight(0x222244, 0.4));
    const key = new THREE.SpotLight(PAL.iris, 65, 60, 0.6, 0.5, 1.2); key.position.set(6, 14, 8); key.target.position.set(0, 1, 0); s.add(key, key.target);
    this._keyLight = key;
    const key2 = new THREE.SpotLight(PAL.aqua, 48, 60, 0.7, 0.5, 1.2); key2.position.set(-8, 12, 4); key2.target.position.set(0, 1, 0); s.add(key2, key2.target);
    const warm = new THREE.PointLight(PAL.gold, 20, 30); warm.position.set(0, 4, 2); s.add(warm);
    this._pulseLight = new THREE.PointLight(PAL.mantis, 14, 40); this._pulseLight.position.set(0, 2, 3); s.add(this._pulseLight);

    const discMat = mat(0x3a3f5c, 0x090914, 0.2, 0.5, 0.55); discMat.map = floorTexture();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.4, 64), discMat); disc.position.y = -0.2; s.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 0.08, 12, 96), mat(0x000000, PAL.aqua, 1.7)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; s.add(rim);

    const spokeGeo = new THREE.BoxGeometry(0.1, 0.05, 6);
    const spokeMat = mat(0x000000, PAL.gold, 0.45);
    const N = 30, spokes = new THREE.InstancedMesh(spokeGeo, spokeMat, N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; d.position.set(Math.cos(a) * 4.6, 0.03, Math.sin(a) * 4.6); d.rotation.set(0, -a, 0); d.updateMatrix(); spokes.setMatrixAt(i, d.matrix); }
    spokes.instanceMatrix.needsUpdate = true; s.add(spokes);

    // Shared glowing-screen texture for every monitor on the set.
    const screenTex = screenTexture();
    const screenMat = () => { const m = mat(0x0a0a16, 0xffffff, 0.7, 0.5); m.emissiveMap = screenTex; m.map = screenTex; return m; };
    this._screenTex = screenTex;

    const console_ = new THREE.Group();
    const pole = cyl(0.28, 0.4, 1.2, mat(0x101020, PAL.aqua, 0.3, 0.4, 0.6)); pole.position.y = 0.6; console_.add(pole);
    for (const dx of [-0.55, 0.55]) {
      const arm = cyl(0.05, 0.05, 0.7, mat(0x101020)); arm.position.set(dx * 0.7, 1.15, 0); arm.rotation.z = Math.PI / 2; console_.add(arm);
      const mon = box(0.9, 0.7, 0.12, screenMat()); mon.position.set(dx * 1.05, 1.2, 0); mon.rotation.y = dx > 0 ? -0.5 : 0.5; console_.add(mon);
    }
    s.add(console_);
    this._screenMat = screenMat;

    // The hot seats — tall chairs with an aqua-trimmed backrest and a footrest
    // ring, bright enough to read behind the seated figures.
    const seatMat = mat(0x2a2a3e, PAL.aqua, 0.16, 0.45, 0.4);
    for (const x of [2.1, -2.1]) {
      const seat = cyl(0.36, 0.32, 0.12, seatMat); seat.position.set(x, 0.85, 0); s.add(seat);
      const back = box(0.56, 0.72, 0.09, seatMat); back.position.set(x, 1.28, -0.3); back.rotation.x = -0.1; s.add(back);
      const leg = cyl(0.06, 0.06, 0.85, seatMat); leg.position.set(x, 0.42, 0); s.add(leg);
      const rest = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 10, 32), seatMat);
      rest.rotation.x = Math.PI / 2; rest.position.set(x, 0.34, 0.08); s.add(rest);
    }

    // The host — silver hair, dark suit, gold bow tie — mid-gesture; and
    // tonight's contestant in the hot seat. Both angled slightly to center.
    const host = person({ skin: 0xd9b48f, hair: 0x9aa3b2, shirt: 0x2b2b40, pants: 0x20202f, accent: PAL.gold, glow: 0.09, seated: true });
    host.position.set(2.1, 0.16, 0); host.rotation.y = -0.28;
    const bow = box(0.12, 0.055, 0.04, mat(0x1a1408, PAL.gold, 0.55)); bow.position.set(0, 1.415, 0.15); host.add(bow);
    host.userData.parts.armR.rotation.z = -1.0; // working the room
    setMouth(host.userData.parts, 'smile');
    s.add(host);

    const player = person({ skin: 0xc98d64, hair: 0x2a1c10, shirt: 0x3e6b2d, pants: 0x2b3340, accent: PAL.mantis, glow: 0.09, seated: true });
    player.position.set(-2.1, 0.16, 0); player.rotation.y = 0.28;
    s.add(player);

    // ---- the audience: seated bodies on visible chairs, on riser platforms ----
    const body = new THREE.CapsuleGeometry(0.115, 0.3, 5, 12); body.translate(0, 1.06, 0);
    const lap = new THREE.BoxGeometry(0.24, 0.09, 0.32); lap.translate(0, 0.84, 0.14);
    const ah = new THREE.SphereGeometry(0.15, 12, 10); ah.translate(0, 1.5, 0);
    const audMat = mat(0x1a1a34, PAL.iris, 0.22, 0.7);
    const chairGeoSeat = new THREE.BoxGeometry(0.36, 0.07, 0.36); chairGeoSeat.translate(0, 0.76, 0.05);
    const chairGeoBack = new THREE.BoxGeometry(0.36, 0.55, 0.07); chairGeoBack.translate(0, 1.02, -0.16);
    const chairMat = mat(0x141428, PAL.iris, 0.07, 0.7);
    let count = 0; const tiers = 4, per = 42; const total = tiers * per;
    const aud = new THREE.InstancedMesh(mergeGeos(body, lap, ah), audMat, total);
    const chairs = new THREE.InstancedMesh(mergeGeos(chairGeoSeat, chairGeoBack), chairMat, total);
    const o = new THREE.Object3D();
    const seats = []; // per-instance placement, for the crowd-moment events
    // Deterministic jitter so there is no per-frame allocation and no RNG surprises.
    for (let t = 0; t < tiers; t++) {
      const R = 11 + t * 1.7, Y = 0.2 + t * 1.15;
      // riser platform under each row so the arc reads as seating, not floaters
      const riser = new THREE.Mesh(new THREE.RingGeometry(R - 0.85, R + 0.85, 56, 1, Math.PI * 0.06, Math.PI * 0.88),
        mat(0x0d0d1c, PAL.iris, 0.03, 0.8, 0.3));
      riser.rotation.x = -Math.PI / 2; riser.position.y = Y - 0.03; s.add(riser);
      const fascia = new THREE.Mesh(new THREE.RingGeometry(R - 0.88, R - 0.8, 56, 1, Math.PI * 0.06, Math.PI * 0.88),
        mat(0x000000, PAL.aqua, 0.5));
      fascia.rotation.x = -Math.PI / 2; fascia.position.y = Y - 0.025; s.add(fascia);
      for (let i = 0; i < per; i++) {
        const a = Math.PI * 1.06 + (i / (per - 1)) * Math.PI * 0.88;
        const scale = 0.95 + ((i * 37 + t * 13) % 15) / 100;
        o.position.set(Math.cos(a) * R, Y, Math.sin(a) * R); o.rotation.y = -a + Math.PI / 2;
        o.scale.setScalar(1); o.updateMatrix(); chairs.setMatrixAt(count, o.matrix);
        o.scale.setScalar(scale); o.updateMatrix(); aud.setMatrixAt(count, o.matrix);
        seats.push({ x: o.position.x, y: Y, z: o.position.z, rotY: o.rotation.y, scale });
        count++;
      }
    }
    aud.instanceMatrix.needsUpdate = true; s.add(aud);
    chairs.instanceMatrix.needsUpdate = true; s.add(chairs);

    // One reusable "crowd actor" who stands in for a seat during the random
    // audience moments (waving, getting up and leaving). Hidden until then.
    const actor = person({ skin: 0xc9a07a, hair: 0x33271a, shirt: 0x30305a, pants: 0x22223a, accent: PAL.iris, glow: 0.06 });
    actor.visible = false; s.add(actor);
    this._crowd = { mesh: aud, chairs, seats, actor, event: null, nextAt: 7, restoreIdx: -1, restoreAt: 0 };

    // Fourth wall: broadcast pedestal cameras aimed at the stage, plus an
    // operator behind camera one.
    for (const [cx, cz] of [[3.4, 9.5], [-5.2, 8.2], [0.2, 11.2]]) {
      const cam = studioCamera(screenMat());
      cam.position.set(cx, 0, cz);
      cam.rotation.y = Math.atan2(cx, cz); // -z (the lens) faces the stage center
      s.add(cam);
    }
    const operator = crewPerson();
    operator.position.set(3.9, 0, 10.4); operator.rotation.y = Math.PI + 0.35; // eyes on the monitor
    s.add(operator);

    const truss = new THREE.Mesh(new THREE.TorusGeometry(8, 0.18, 12, 64), mat(0x15151f, PAL.peach, 0.15, 0.4, 0.7)); truss.rotation.x = Math.PI / 2; truss.position.y = 6; s.add(truss);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({ map: wordmarkTexture(), transparent: true }));
    back.position.set(0, 4, -12); s.add(back);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), mat(0x000000, PAL.iris, 0.4)); halo.position.set(0, 4, -12.2); s.add(halo);

    const beamColors = [PAL.iris, PAL.aqua, PAL.gold, PAL.iris];
    for (let i = 0; i < beamColors.length; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 32, 1, true),
        new THREE.MeshBasicMaterial({ color: beamColors[i], transparent: true, opacity: 0.032, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const a = i / beamColors.length * Math.PI * 2; cone.position.set(Math.cos(a) * 3, 5.5, Math.sin(a) * 3);
      cone.rotation.z = Math.cos(a) * 0.18; cone.rotation.x = Math.sin(a) * 0.18; cone.userData.base = a; s.add(cone); this.beams.push(cone);
    }

    // The piggy bank — where the coins live. On a pedestal at stage right;
    // the "thinking" playlist gives it a dramatic slow zoom (takes.js).
    s.add(piggyBank(4.2, 2.2));

    // The stage manager in the wings — headset, clipboard, permanently busy.
    // The "producerReady" scene cuts to them when a new game starts.
    const sm = crewPerson({ clipboard: true });
    sm.position.set(-6.5, 0, 3.0); sm.rotation.y = 0.9; // facing the stage
    s.add(sm);

    // Everyone the idle-animation pass drives (blink/breathe/sway/talk/mood).
    this._studioPeople = [
      { g: host, parts: host.userData.parts, role: 'host', phase: 0.0, armL: host.userData.parts.armL.rotation.z, armR: host.userData.parts.armR.rotation.z },
      { g: player, parts: player.userData.parts, role: 'player', phase: 1.7, armL: player.userData.parts.armL.rotation.z, armR: player.userData.parts.armR.rotation.z },
      { g: sm, parts: sm.userData.parts, role: 'crew', phase: 3.1, armL: sm.userData.parts.armL.rotation.z, armR: sm.userData.parts.armR.rotation.z },
      { g: operator, parts: operator.userData.parts, role: 'crew', phase: 4.6, armL: operator.userData.parts.armL.rotation.z, armR: operator.userData.parts.armR.rotation.z },
      { g: actor, parts: actor.userData.parts, role: 'extra', phase: 2.3, armL: actor.userData.parts.armL.rotation.z, armR: actor.userData.parts.armR.rotation.z },
    ];

    return s;
  }

  _buildGreen() {
    const s = new THREE.Scene();
    // warm lounge — dim lamp pools, lifted a touch so the room reads clearly
    s.background = new THREE.Color(0x0f0b07);
    s.add(new THREE.AmbientLight(0xffe0b0, 0.24));
    const ceil = new THREE.PointLight(0xffe6c2, 13, 24); ceil.position.set(0, 4.2, -1); s.add(ceil);
    const lampL = new THREE.PointLight(PAL.gold, 15, 11); lampL.position.set(-4.2, 2.4, -3.5); s.add(lampL);
    const lampR = new THREE.PointLight(0xffd88a, 10, 10); lampR.position.set(5.2, 2.5, -6.2); s.add(lampR);

    const panelTex = panelTexture();
    const wallMat = mat(0x6a5a40, 0, 0.9); wallMat.map = panelTex;
    const sideMat = mat(0x6a5a40, 0, 0.9); sideMat.map = panelTex;
    const floorMat = mat(0x241c12, 0, 0.95), ceilMat = mat(0x2e271c, 0, 0.95);
    s.add(pos(box(12, 0.1, 10, floorMat), 0, 0, -2));
    s.add(pos(box(12, 0.1, 10, ceilMat), 0, 4.6, -2));
    s.add(pos(box(12, 4.7, 0.15, wallMat), 0, 2.35, -7));
    s.add(pos(box(0.15, 4.7, 10, sideMat), -6, 2.35, -2));
    s.add(pos(box(0.15, 4.7, 10, sideMat), 6, 2.35, -2));
    s.add(pos(box(2.4, 0.06, 1.2, mat(0x000000, 0xffe6c2, 0.35)), 0, 4.5, -1));

    const leather = mat(0x6e4526, 0, 0.65), wood = mat(0x8a6f45, 0, 0.7), woodDk = mat(0x594430, 0, 0.75);
    const sofa = () => { const g = new THREE.Group();
      g.add(pos(box(2.4, 0.5, 1.0, leather), 0, 0.55, 0));
      g.add(pos(box(2.4, 0.7, 0.25, leather), 0, 0.9, -0.5));
      g.add(pos(box(0.25, 0.6, 1.0, leather), -1.2, 0.75, 0));
      g.add(pos(box(0.25, 0.6, 1.0, leather), 1.2, 0.75, 0));
      return g; };
    const sofaA = sofa(); sofaA.position.set(0.4, 0, -4.8); s.add(sofaA);
    const sofaB = sofa(); sofaB.position.set(4.4, 0, -1.5); sofaB.rotation.y = -Math.PI / 2; s.add(sofaB);

    const table = new THREE.Group(); table.add(pos(box(1.8, 0.12, 0.9, wood), 0, 0.5, 0));
    for (const [dx, dz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) table.add(pos(box(0.08, 0.5, 0.08, woodDk), dx, 0.25, dz));
    table.position.set(0.4, 0, -3.2); s.add(table);
    s.add(pos(box(0.28, 0.05, 0.14, mat(0x111111, 0x000000)), 0.1, 0.6, -3.1));
    s.add(pos(box(0.22, 0.01, 0.1, mat(0x000000, PAL.aqua, 1.2)), 0.1, 0.63, -3.1));

    s.add(pos(box(2.6, 1.0, 0.6, wood), -4.2, 0.5, -6.4));
    s.add(pos(cyl(0.16, 0.2, 0.5, woodDk), -4.2, 1.25, -6.3));
    s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.5)), -4.2, 1.65, -6.3));
    s.add(pos(cyl(0.04, 0.04, 2.6, woodDk), 5.2, 1.3, -6.2));
    s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.5)), 5.2, 2.5, -6.2));

    s.add(pos(box(1.5, 1.1, 0.06, woodDk), 0.4, 2.6, -6.9));
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.95), new THREE.MeshBasicMaterial({ map: artTexture() })); art.position.set(0.4, 2.6, -6.86); s.add(art);
    const doorMat = mat(0x6e6151, 0, 0.85);
    s.add(pos(box(0.9, 3.4, 0.1, doorMat), -2.9, 1.7, -6.9));
    // The right door swings on a hinge so the stage manager can open it for the
    // "we're ready for you" beat (green:manager). Hinged at its right edge.
    const hinge = new THREE.Group(); hinge.position.set(-1.55, 1.7, -6.9);
    const swing = box(0.9, 3.4, 0.1, doorMat); swing.position.set(-0.45, 0, 0);
    hinge.add(swing); s.add(hinge);
    this._greenDoor = hinge;
    // Warm hallway light in the doorway — hidden inside the closed door slab,
    // revealed as it swings open. Basic material so it glows unlit.
    const hall = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 3.3),
      new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
    hall.position.set(-2.0, 1.7, -6.91); s.add(hall);

    // The stage manager, hidden until they open that door on "Start next round".
    const gsm = crewPerson();
    gsm.position.set(-2.15, 0, -6.4); gsm.rotation.y = -0.2; // in the doorway
    gsm.userData.parts.armR.rotation.z = -2.3; // hand up: "we're ready!"
    gsm.visible = false;
    s.add(gsm);
    this._greenSM = gsm;

    // The contestant, waiting on the sofa between runs (same outfit as on stage).
    const you = person({ skin: 0xc98d64, hair: 0x2a1c10, shirt: 0x3e6b2d, pants: 0x2b3340, accent: PAL.mantis, glow: 0.04, seated: true });
    you.position.set(0.4, 0.06, -4.8); you.rotation.y = 0.2;
    s.add(you);

    this._greenPeople = [
      { g: you, parts: you.userData.parts, role: 'player', phase: 0.9, armL: you.userData.parts.armL.rotation.z, armR: you.userData.parts.armR.rotation.z },
      { g: gsm, parts: gsm.userData.parts, role: 'greenSM', phase: 2.2, armL: gsm.userData.parts.armL.rotation.z, armR: gsm.userData.parts.armR.rotation.z },
    ];

    // The sketchy guy — Steve's man, loitering by the doors in a long coat and
    // a wide-brim hat. The "sketchyCall" scene finds him (takes.js).
    const sg = new THREE.Group();
    const coatM = mat(0x17120c, PAL.gold, 0.07, 0.85);
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 1.15, 20), coatM);
    coat.position.y = 0.62; sg.add(coat);
    const sgHead = sph(0.17, mat(0x14100a, PAL.gold, 0.1, 0.8)); sgHead.position.y = 1.35; sg.add(sgHead);
    const brim = cyl(0.3, 0.3, 0.035, coatM); brim.position.y = 1.45; sg.add(brim);
    const crown = cyl(0.15, 0.17, 0.16, coatM); crown.position.y = 1.54; sg.add(crown);
    // (parked left of the far door, clear of the swinging one)
    sg.position.set(-3.5, 0, -6.55); sg.rotation.y = 0.55; sg.rotation.z = -0.05; // leaning, up to something
    s.add(sg);
    return s;
  }
}

/* ---------- shared geometry helpers ---------- */
function mat(color, emissive, ei = 0, rough = 0.6, metal = 0.1) {
  return new THREE.MeshStandardMaterial({ color, emissive: emissive ?? 0x000000, emissiveIntensity: ei, roughness: rough, metalness: metal });
}
function cyl(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24), m); }
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function sph(r, m) { return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), m); }
function pos(m, x, y, z) { m.position.set(x, y, z); return m; }

/* ---------- people (original art drawn in code) ---------- */

// A proportioned low-poly person — rounded capsule limbs, separate skin /
// hair / clothes colours, and an animatable face. External model files stay
// out of the repo (brand rule: original art in code), so the "3D asset" feel
// comes from geometry, not imports.
//
// Everything on the face (hair, eyes, mouths) is parented INTO the head mesh,
// so turning the head moves the whole face. userData.parts exposes:
//   head, torso, armL, armR, eyeL, eyeR, mouths { smile, flat, frown, open }
// The studio's _animatePeople drives blinking, breathing, head sway, talking
// mouths, and mood expressions off those refs — no per-frame allocation.
function person({ skin = 0xd9b48f, hair = 0x2a2118, shirt = 0x2f3a55, pants = 0x252c3a, shoes = 0x15151f, accent = 0x000000, glow = 0.06, seated = false } = {}) {
  const g = new THREE.Group();
  const skinM = mat(skin, accent, glow * 0.5, 0.55);
  const hairM = mat(hair, 0x000000, 0, 0.7);
  const shirtM = mat(shirt, accent, glow, 0.65);
  const pantsM = mat(pants, 0x000000, 0, 0.7);
  const shoeM = mat(shoes, 0x000000, 0, 0.5);
  const darkM = mat(0x1c1410, 0x000000, 0, 0.6);
  const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m);

  // head carries the whole face in local space
  const head = sph(0.155, skinM); head.position.set(0, 1.56, 0); g.add(head);
  const hairCap = sph(0.162, hairM); hairCap.scale.set(1, 0.72, 1); hairCap.position.set(0, 0.07, -0.025); head.add(hairCap);
  const eyes = {};
  for (const sgn of [-1, 1]) {
    const eye = sph(0.017, darkM); eye.position.set(sgn * 0.055, 0.015, 0.142); head.add(eye);
    eyes[sgn === 1 ? 'eyeR' : 'eyeL'] = eye;
  }
  // nose + ears for depth
  const nose = sph(0.02, skinM); nose.scale.set(1, 1.1, 1.3); nose.position.set(0, -0.02, 0.152); head.add(nose);
  for (const sgn of [-1, 1]) { const ear = sph(0.028, skinM); ear.scale.set(0.6, 1, 0.8); ear.position.set(sgn * 0.15, 0, 0); head.add(ear); }
  // mouth states — one visible at a time (animatePeople swaps them)
  const mouths = {
    smile: new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 8, 14, Math.PI), skinM.clone()),
    frown: new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 8, 14, Math.PI), skinM.clone()),
    flat: box(0.07, 0.013, 0.013, darkM),
    open: new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.011, 8, 14), darkM),
  };
  mouths.smile.material.color.setHex(0x8a5a44); mouths.smile.rotation.z = Math.PI; // ∪
  mouths.frown.material.color.setHex(0x8a5a44); mouths.frown.position.y = -0.075;  // ∩
  for (const [k, m] of Object.entries(mouths)) {
    m.position.z = 0.146; if (k !== 'frown') m.position.y = k === 'smile' ? -0.045 : -0.06;
    m.visible = k === 'flat';
    head.add(m);
  }

  const torso = capsule(0.155, 0.34, shirtM); torso.position.set(0, 1.17, 0); g.add(torso);
  const hips = capsule(0.14, 0.08, pantsM); hips.position.set(0, 0.92, 0); g.add(hips);

  const arms = {};
  for (const sgn of [-1, 1]) {
    const arm = capsule(0.048, 0.34, shirtM);
    arm.position.set(sgn * 0.215, 1.16, 0.01);
    arm.rotation.z = -sgn * 0.16;
    const hand = sph(0.05, skinM); hand.position.set(sgn * 0.03, -0.24, 0.01); arm.add(hand);
    g.add(arm);
    arms[sgn === 1 ? 'armR' : 'armL'] = arm;
  }

  if (seated) {
    for (const sgn of [-1, 1]) {
      const thigh = capsule(0.066, 0.28, pantsM); thigh.rotation.x = Math.PI / 2; thigh.position.set(sgn * 0.1, 0.88, 0.2); g.add(thigh);
      const shin = capsule(0.056, 0.62, pantsM); shin.position.set(sgn * 0.1, 0.5, 0.38); g.add(shin);
      const shoe = box(0.11, 0.07, 0.24, shoeM); shoe.position.set(sgn * 0.1, 0.13, 0.44); g.add(shoe);
    }
  } else {
    for (const sgn of [-1, 1]) {
      const leg = capsule(0.064, 0.56, pantsM); leg.position.set(sgn * 0.1, 0.42, 0); g.add(leg);
      const shoe = box(0.11, 0.07, 0.24, shoeM); shoe.position.set(sgn * 0.1, 0.035, 0.05); g.add(shoe);
    }
  }
  g.userData.parts = { head, torso, mouths, ...eyes, ...arms };
  return g;
}

// Swap which mouth shape is showing. Direct property sets — no Object.entries
// allocation (this runs per person, every frame, in the life pass).
function setMouth(parts, kind) {
  const m = parts.mouths;
  m.smile.visible = kind === 'smile';
  m.frown.visible = kind === 'frown';
  m.flat.visible = kind === 'flat';
  m.open.visible = kind === 'open';
}

// A crew member: dark stagewear, over-the-head headset with ear cups + boom
// mic (+ optional clipboard). The band is a HALF torus arcing ear-to-ear over
// the crown — in the head's local space so it turns with the head.
function crewPerson({ clipboard = false } = {}) {
  const g = person({ skin: 0xd9b48f, hair: 0x3c3c46, shirt: 0x23232f, pants: 0x1a1a24, accent: PAL.aqua, glow: 0.12 });
  const head = g.userData.parts.head;
  const gearM = mat(0x0a0a14, PAL.aqua, 0.5);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 10, 24, Math.PI), gearM);
  band.position.set(0, 0.02, 0); head.add(band); // arc opens downward: ear → crown → ear
  for (const sgn of [-1, 1]) {
    const cup = cyl(0.045, 0.045, 0.035, gearM);
    cup.rotation.z = Math.PI / 2; cup.position.set(sgn * 0.165, 0, 0); head.add(cup);
  }
  const boom = box(0.022, 0.022, 0.13, gearM);
  boom.position.set(0.1, -0.06, 0.1); boom.rotation.set(0.15, 0.55, 0); head.add(boom);
  const micTip = sph(0.022, gearM); micTip.position.set(0.055, -0.075, 0.155); head.add(micTip);
  if (clipboard) {
    const cb = box(0.26, 0.36, 0.03, mat(0x22222e, PAL.aqua, 0.25));
    cb.position.set(-0.28, 1.05, 0.16); cb.rotation.set(0.3, 0.2, 0.1); g.add(cb);
  }
  return g;
}

// A broadcast pedestal camera for the fourth wall — body, lens, red tally
// light, and a little operator monitor on the back.
function studioCamera(screenMat) {
  const g = new THREE.Group();
  const dark = mat(0x14141f, 0x000000, 0, 0.5, 0.5);
  const ped = cyl(0.09, 0.14, 1.3, dark); ped.position.y = 0.65; g.add(ped);
  const base = cyl(0.3, 0.34, 0.08, dark); base.position.y = 0.04; g.add(base);
  const body = box(0.42, 0.34, 0.62, mat(0x1b1b2a, PAL.aqua, 0.08, 0.5, 0.5)); body.position.y = 1.45; g.add(body);
  const lens = cyl(0.09, 0.11, 0.3, dark); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.45, -0.45); g.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 10, 24), mat(0x000000, PAL.aqua, 0.6));
  ring.position.set(0, 1.45, -0.6); g.add(ring);
  const tally = box(0.045, 0.045, 0.02, mat(0x330000, 0xff3344, 1.4)); tally.position.set(0.13, 1.65, -0.28); g.add(tally);
  const mon = box(0.24, 0.15, 0.02, screenMat || mat(0x0a0a16, PAL.aqua, 0.5)); mon.position.set(0, 1.5, 0.33); mon.rotation.x = -0.2; g.add(mon);
  const handle = cyl(0.02, 0.02, 0.3, dark); handle.rotation.z = Math.PI / 2; handle.position.set(0, 1.24, 0.28); g.add(handle);
  return g;
}

// An original piggy bank on a lit pedestal — the show's coin vault mascot.
function piggyBank(x, z) {
  const g = new THREE.Group();
  const pedestal = cyl(0.5, 0.62, 1.0, mat(0x101020, 0x1FDDE9, 0.25, 0.4, 0.6)); pedestal.position.y = 0.5; g.add(pedestal);
  const top = cyl(0.56, 0.5, 0.08, mat(0x000000, 0xFFC857, 0.35)); top.position.y = 1.02; g.add(top);
  const goldM = mat(0xffc857, 0xFFC857, 0.28, 0.35, 0.35);
  const body = sph(0.42, goldM); body.scale.set(1.18, 0.92, 1); body.position.y = 1.48; g.add(body);
  const snout = cyl(0.13, 0.16, 0.14, goldM); snout.rotation.z = Math.PI / 2; snout.position.set(-0.52, 1.44, 0); g.add(snout);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 12), goldM); earL.position.set(-0.2, 1.86, 0.17); g.add(earL);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 12), goldM); earR.position.set(-0.2, 1.86, -0.17); g.add(earR);
  for (const [lx, lz] of [[-0.24, 0.2], [0.24, 0.2], [-0.24, -0.2], [0.24, -0.2]]) {
    const leg = cyl(0.07, 0.08, 0.18, goldM); leg.position.set(lx, 1.12, lz); g.add(leg);
  }
  const slot = box(0.2, 0.03, 0.06, mat(0x0a0a14, 0x000000, 0, 0.5)); slot.position.set(0.05, 1.88, 0); g.add(slot);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20, Math.PI * 1.4), goldM);
  tail.position.set(0.52, 1.52, 0); tail.rotation.y = Math.PI / 2; g.add(tail);
  g.position.set(x, 0, z);
  g.rotation.y = 0.5; // snout angled toward the stage center
  return g;
}

// Merge any number of geometries into one non-indexed buffer (position +
// normal) — the audience bodies and chairs each draw as a single instanced mesh.
function mergeGeos(...geos) {
  const parts = geos.map((g) => g.toNonIndexed());
  const posLen = parts.reduce((n, g) => n + g.attributes.position.array.length, 0);
  const pos_ = new Float32Array(posLen);
  const nor = new Float32Array(posLen);
  let off = 0;
  for (const g of parts) {
    pos_.set(g.attributes.position.array, off);
    nor.set(g.attributes.normal.array, off);
    off += g.attributes.position.array.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos_, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

function wordmarkTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 600; const x = c.getContext('2d');
  x.clearRect(0, 0, 1024, 600);
  x.textAlign = 'center'; x.fillStyle = '#eef0ff';
  x.font = '600 40px Montserrat, sans-serif'; x.fillText('who wants to be a', 512, 250);
  const grad = x.createLinearGradient(0, 0, 1024, 0); grad.addColorStop(0, '#1FDDE9'); grad.addColorStop(0.5, '#7855FA'); grad.addColorStop(1, '#92DD23');
  x.fillStyle = grad; x.font = '800 96px Montserrat, sans-serif';
  x.shadowColor = '#7855FA'; x.shadowBlur = 30; x.fillText('NUTANIX ENGINEER', 512, 360);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function artTexture() {
  const c = document.createElement('canvas'); c.width = 270; c.height = 190; const x = c.getContext('2d');
  x.fillStyle = '#141428'; x.fillRect(0, 0, 270, 190);
  const cols = ['#7855FA', '#1FDDE9', '#92DD23', '#FF6B5B', '#FFC857'];
  // Deterministic layout (no Math.random) so the picture is stable.
  for (let i = 0; i < 9; i++) {
    x.fillStyle = cols[i % cols.length]; x.globalAlpha = 0.85; x.beginPath();
    x.arc(30 + (i * 53 % 210), 30 + (i * 37 % 130), 12 + (i * 7 % 26), 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// The stage disc: brushed concentric rings with faint radial spokes, so the
// big floor reads as a machined broadcast platform instead of flat black.
// Grayscale-ish so the material's base colour tints it. Deterministic.
function floorTexture() {
  const S = 512; const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#8b90ad'; x.fillRect(0, 0, S, S);
  const cx = S / 2, cy = S / 2;
  // brushed radial streaks
  for (let a = 0; a < 720; a++) {
    const ang = (a / 720) * Math.PI * 2;
    x.strokeStyle = `rgba(${a % 2 ? 210 : 120},${a % 2 ? 214 : 128},235,0.05)`;
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx + Math.cos(ang) * cx * 1.5, cy + Math.sin(ang) * cy * 1.5); x.stroke();
  }
  // concentric grooves
  for (let r = 18; r < cx; r += 15) {
    x.strokeStyle = r % 45 === 3 ? 'rgba(31,221,233,0.5)' : 'rgba(20,22,40,0.6)';
    x.lineWidth = r % 45 === 3 ? 2 : 3;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  }
  // soft centre vignette
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, cx);
  g.addColorStop(0, 'rgba(30,34,58,0.55)'); g.addColorStop(0.7, 'rgba(30,34,58,0)'); g.addColorStop(1, 'rgba(6,6,14,0.6)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Warm vertical wall paneling for the green room (wood-ish seams + grain).
function panelTexture() {
  const W = 256, H = 256; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#8a7350'; x.fillRect(0, 0, W, H);
  for (let px = 0; px < W; px++) {
    const seam = px % 48; const shade = seam < 3 ? 0.55 : seam > 44 ? 0.75 : 1;
    const grain = 0.9 + 0.1 * Math.sin(px * 0.7);
    const v = Math.round(120 * shade * grain);
    x.fillStyle = `rgb(${v + 30},${v + 12},${Math.round(v * 0.6)})`;
    x.fillRect(px, 0, 1, H);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.2); return t;
}

// A glowing monitor face: faint grid + scanlines, used on the console and the
// broadcast cameras (as an emissive map so it lights up).
function screenTexture() {
  const W = 128, H = 96; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#04121a'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(31,221,233,0.5)'; x.lineWidth = 1;
  for (let gx = 8; gx < W; gx += 16) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
  for (let gy = 8; gy < H; gy += 16) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
  x.fillStyle = 'rgba(146,221,35,0.5)'; x.fillRect(10, 12, 40, 6); x.fillRect(10, 24, 26, 6);
  for (let sy = 0; sy < H; sy += 3) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, sy, W, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
