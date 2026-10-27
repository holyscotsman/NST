// studio.js — the persistent WebGL backdrop. Built once; scenes are camera moves
// and lighting/prop swaps, not rebuilds (the project design rules). Owns the single RAF.
// The quiz itself is a DOM overlay drawn on top of this canvas — never rendered
// in GL — which is what keeps the game accessible.
//
// Adapted and modularised from the 3D studio prototype. Original neon identity
// only; stick figures + glow; no cloned trade dress.

import * as THREE from 'three';
import { Director } from './director.js';
import { ballotFromBars } from '../core/lifelines.js';
import { VOTE_COLORS } from '../core/config.js';
import { TIERS, pickTier, rememberBadTier, Governor } from './stage/quality.js';
import { createPipeline } from './stage/post.js';
import { PAL } from './stage/kit.js';
import { setMouth } from './stage/people.js';
import { buildGreen } from './stage/greenRoom.js';
import { Accent } from './stage/accent.js';
import { buildStudioSet } from './stage/studioSet.js';


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
    this.postFx = opts.postFx !== false; // bloom + vignette/grain + camera micro-motion
    this.onError = opts.onError || (() => {});
    this.disposed = false;
    this.pipe = null;      // the post chain (stage/post.js); null = direct render
    this.tier = null;      // active quality tier (stage/quality.js)
    this.governor = null;  // steps resolution / tier down if the GPU cannot keep up
    this._view = { dx: 0, dy: 0 };    // current framing shift, px (eased)
    this._viewTarget = { dx: 0, dy: 0 };
    this._measureAt = 0;
    this.mood = { key: PAL.iris, intensity: 1 };
    this.pulse = { color: null, active: false, t: 0, dur: 0.7 };
    this._look = new THREE.Vector3();
    this._spin = 1; // beam spin multiplier (bumped on wins)
    this.onAmbient = opts.onAmbient || (() => {}); // little diegetic sounds (a cough in the crowd)
    this._talk = 0;      // seconds the host (or door manager) keeps "talking"
    this._mood = null;   // { kind: 'happy' | 'sad', t } — face reactions
    this._dummy = new THREE.Object3D(); // scratch for instanced-matrix updates
    this._hiddenMat = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    this.accent = new Accent(PAL.iris); // the mood colour: wall, deck, rims and beams ease toward it
    this.set = null;                    // the studio set (stage/studioSet.js)
    this._lightEnv = 1;    // fill-light multiplier target (1 = full, ~0.3 = lock-in)
    this._lightEnvCur = 1; // eased value applied each frame
    this._phase = null;    // 'readout' | 'thinking' | 'lockin' | 'reveal' — drives the thinking dim
  }

  async init() {
    // Pick the quality tier BEFORE building the renderer: whether the default
    // framebuffer needs its own antialiasing depends on it.
    let probe = null;
    try { probe = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); } catch { /* none */ }
    const picked = pickTier({ gl: probe, effects: this.postFx });
    try { const lose = probe && probe.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); } catch { /* ignore */ }
    this.tier = picked.tier;
    this.gpu = picked.gpu;

    // With the composer the scene is anti-aliased by the multisampled render
    // target, so the canvas itself only needs MSAA on the direct-render path.
    const renderer = new THREE.WebGLRenderer({ antialias: this.tier.msaa === 0, powerPreference: 'high-performance' });
    this.renderer = renderer;
    this._applyResolution(1);
    renderer.info.autoReset = false; // a frame is several render() calls under the composer; count the whole frame
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92; // keep the stage moody, not blown out
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = this.tier.shadowType === 'pcfsoft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    // The camera director owns every shot (takes.js); it swaps 3D sets as its
    // scenes demand. Manual orbiting is retired — this is broadcast footage.
    this.director = new Director({ reduced: this.reduced, onSet: (set) => this.setScene(set) });

    this.clock = new THREE.Clock();
    this.set = await buildStudioSet(this);
    this.studio = this.set.scene;
    this.green = buildGreen(this);
    this.active = this.studio;

    this._setupEnvironment(); // PMREM env so metals/gloss have something to reflect
    await this._buildPipeline();
    this._fitCamera();
    this.governor = new Governor({
      tier: this.tier,
      enabled: this.tier.name !== 'low' || this.tier.dpr > 0,
      onResolution: (k) => this._applyResolution(k),
      onTier: (t) => this._changeTier(t),
    });
    this._health = { t: 0, next: 1.2, checks: 0, hits: 0, last: null, done: false, fellBack: null };
    // Safari/Apple GPUs draw the post chain black for its first seconds, then recover on their own.
    // Keep the canvas invisible until a frame is really there (or 8 s pass), so the player never sees it.
    this._veil = this.tier.name !== 'low';
    if (this._veil) { const d = renderer.domElement; d.style.opacity = '0'; d.style.transition = 'opacity .6s ease'; this._veilTimer = setTimeout(() => this._unveil(), 8000); }
    this._setupDiagnostics();
    window.addEventListener('resize', this._onResize);
    renderer.setAnimationLoop(this._tick);
  }

  // ---- is the picture actually there? ----
  // A GPU/driver combination can accept every command and still hand back a
  // mostly black frame (a half-float or multisampled target it cannot really
  // use). Nothing throws, so nothing in the code can notice. This looks: a few
  // times in the first seconds after a tier is built, sample rows of the real
  // canvas, and if nearly every sample is pure black, drop one tier and remember
  // it, so the next visit does not repeat the mistake.
  _blackFraction() {
    const gl = this.renderer.getContext();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    if (!w || !h) return null;
    if (!this._row || this._row.length < w * 4) this._row = new Uint8Array(w * 4);
    this.renderer.setRenderTarget(null);
    let dark = 0, n = 0;
    for (let r = 0; r < 10; r++) {
      const y = Math.min(h - 1, Math.floor(h * (0.05 + 0.9 * r / 9)));
      gl.readPixels(0, y, w, 1, gl.RGBA, gl.UNSIGNED_BYTE, this._row);
      for (let x = 0; x < w; x += 24) { const i = x * 4; n++; if (this._row[i] + this._row[i + 1] + this._row[i + 2] <= 3) dark++; }
    }
    return n ? dark / n : null;
  }

  _checkFrame(dt) {
    const H = this._health;
    if (!H || H.done || this.disposed) return;
    H.t += dt;
    if (H.t < H.next) return;
    H.next = H.t + 0.7; H.checks++;
    if (document.visibilityState !== 'visible') return;
    let f = null;
    try { f = this._blackFraction(); } catch { f = null; }
    if (f == null) return;
    H.last = f;
    if (this._veil && (f < 0.85 || H.t > 8)) this._unveil();
    // Recreate the render targets while the frame is still black: a resize is what clears it on its own.
    if (this._veil && f >= 0.85 && (H.checks === 2 || H.checks === 5)) this._kickTargets();
    // A dark set legitimately reads 30% pure black, and Safari's readback of the direct (Low) canvas reported 87%
    // on a frame that was visibly fine, so only a frame that is black through and through counts, four times running.
    H.hits = f > 0.85 ? H.hits + 1 : 0;
    if (H.hits >= 8 && this.tier.name !== 'low') {
      const from = this.tier.name, to = from === 'high' ? 'medium' : 'low';
      console.warn(`[wwtbane] the ${from} tier is drawing a black frame on this GPU (${Math.round(f * 100)}% black) — dropping to ${to}`);
      rememberBadTier(from);
      H.fellBack = `${from}->${to}`;
      this._unveil();
      H.t = 0; H.next = 1.2; H.checks = 0; H.hits = 0;
      if (this.governor) { this.governor.tier = { ...TIERS[to] }; this.governor.scale = 1; }
      this._changeTier({ ...TIERS[to] });
    } else if (H.checks > 14) H.done = true;
  }

  _unveil() {
    if (!this._veil) return;
    this._veil = false;
    clearTimeout(this._veilTimer);
    this.renderer.domElement.style.opacity = '1';
  }

  _kickTargets() {
    if (!this.pipe) return;
    const w = window.innerWidth, h = window.innerHeight;
    try { this.pipe.setSize(w + 2, h); this.pipe.setSize(w, h); } catch { /* the check below decides */ }
  }

  // ?debug=gfx shows what this machine is really running, so a bug report is a
  // screenshot instead of a description.
  _setupDiagnostics() {
    const dom = this.renderer.domElement;
    this._errors = [];
    dom.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this._errors.push('context lost'); });
    this.renderer.debug.onShaderError = (gl, prog, vs, fs) => { this._errors.push('shader: ' + String(gl.getProgramInfoLog(prog) || '').slice(0, 160)); };
    let on = false; try { on = new URLSearchParams(window.location.search).get('debug') === 'gfx'; } catch { /* no URL */ }
    if (!on) return;
    const el = document.createElement('pre');
    Object.assign(el.style, { position: 'fixed', left: '8px', bottom: '8px', zIndex: '99', margin: '0', padding: '8px 10px', font: '11px/1.35 ui-monospace, Menlo, monospace', color: '#cfe', background: 'rgba(0,0,0,0.78)', border: '1px solid #4a6', maxWidth: '60ch', whiteSpace: 'pre-wrap', pointerEvents: 'none' });
    document.body.appendChild(el);
    this._debugTimer = setInterval(() => {
      const g = this.gfxInfo(), gl = this.renderer.getContext(), H = this._health;
      el.textContent = [
        `tier ${g.tier}  pipe ${g.pipe}  ao ${g.ao}  bloom ${g.bloom}  grade ${g.grade}  msaa ${g.msaa}`,
        `gpu ${g.gpu}`,
        `canvas ${gl.drawingBufferWidth}x${gl.drawingBufferHeight}  dpr ${g.dpr}  maxTex ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`,
        `calls ${g.calls}  tris ${g.triangles}  fov ${g.fov}  view ${g.view.dx},${g.view.dy}`,
        `black-frame check: ${H.last == null ? 'pending' : Math.round(H.last * 100) + '% black'}${H.fellBack ? '  FELL BACK ' + H.fellBack : ''}`,
        this._errors.length ? 'errors: ' + this._errors.slice(-3).join(' | ') : 'errors: none',
      ].join('\n');
    }, 500);
  }

  // Resolution is the first thing the governor trades away: scale the pixel
  // ratio, keeping the canvas CSS size untouched.
  _applyResolution(scale) {
    let dpr = Math.min(window.devicePixelRatio || 1, this.tier.dpr);
    // The post chain keeps several multisampled half-float buffers, each pixel
    // costing 8 bytes x 4 samples. On a large retina window that is hundreds of
    // megabytes, which some GPUs/drivers hand back as black. Cap the pixel count
    // (the 3D is soft glow and the quiz text is DOM, so nothing visible is lost).
    if (this.tier.maxPixels) dpr = Math.min(dpr, Math.sqrt(this.tier.maxPixels / Math.max(1, window.innerWidth * window.innerHeight)));
    dpr = Math.max(0.5, dpr * scale);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.pipe) { this.pipe.setPixelRatio(dpr); this.pipe.setSize(window.innerWidth, window.innerHeight); }
    if (this.set) this.set.resize(window.innerWidth, window.innerHeight, dpr);
  }

  async _buildPipeline() {
    if (this.pipe) { this.pipe.dispose(); this.pipe = null; }
    if (!this.tier.bloom && !this.tier.ao && !this.tier.grade && !this.tier.msaa) return; // low: direct render
    try {
      this.pipe = await createPipeline({
        renderer: this.renderer, scene: this.active, camera: this.camera,
        tier: this.tier, width: window.innerWidth, height: window.innerHeight,
      });
      this.pipe.setPixelRatio(this.renderer.getPixelRatio());
      this.pipe.setSize(window.innerWidth, window.innerHeight);
    } catch (e) {
      console.warn('[wwtbane] post chain unavailable — rendering directly', e);
      this.pipe = null; // graceful: direct render still looks good
    }
  }

  // The governor decided this GPU cannot carry the current tier.
  async _changeTier(t) {
    this.tier = t;
    this.renderer.shadowMap.type = t.shadowType === 'pcfsoft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.renderer.shadowMap.needsUpdate = true;
    this._applyResolution(1);
    await this._rebuildSet();
    await this._buildPipeline();
  }

  // The set bakes the tier in (beam count, the mirror pass, shadow-map size), so a
  // tier change rebuilds it rather than patching it.
  async _rebuildSet() {
    const wasStudio = this.active === this.studio;
    const old = this.set;
    this.set = await buildStudioSet(this);
    this.studio = this.set.scene;
    if (wasStudio) this.active = this.studio;
    if (this._envRT) this.studio.environment = this._envRT.texture;
    if (old) { old.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); old.dispose(); }
  }

  // Wide shots must survive a tall, narrow window. Keep a minimum HORIZONTAL
  // field of view (what a 16:10 screen shows at 50 degrees vertical) so a phone
  // in portrait sees the two-shot, not one person's shoulder.
  _fitCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const base = 50 * Math.PI / 180;
    let vfov = base;
    if (aspect < 1.6) {
      const hMin = 2 * Math.atan(Math.tan(base / 2) * 1.6);
      vfov = Math.min(84 * Math.PI / 180, 2 * Math.atan(Math.tan(hMin / 2) / aspect));
    }
    this.camera.fov = vfov * 180 / Math.PI;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  // Where is there room to see the studio? The quiz card, money ladder and HUD
  // cover most of the screen during a question, so a shot framed on the centre
  // of the viewport puts the host behind the card. Measure the free rectangle
  // and shift the projection so the subject sits in the middle of THAT.
  _measureSafeFrame() {
    const W = window.innerWidth, H = window.innerHeight;
    let x1 = W, y1 = H;
    const ladder = document.querySelector('.ladder');
    if (ladder) { const r = ladder.getBoundingClientRect(); if (r.width > 0 && r.left > W * 0.5) x1 = Math.min(x1, r.left); }
    const card = document.querySelector('.q-card-wrap');
    if (card) { const r = card.getBoundingClientRect(); if (r.height > 0 && r.top > H * 0.3) y1 = Math.min(y1, r.top - 10); }
    this._viewTarget = { dx: (x1 - W) / 2, dy: (y1 - H) / 2 };
  }

  _applyFrameShift(dt) {
    const T = this._viewTarget, V = this._view;
    const k = this.reduced ? 1 : Math.min(1, dt * 3.2);
    V.dx += (T.dx - V.dx) * k; V.dy += (T.dy - V.dy) * k;
    if (Math.abs(T.dx - V.dx) < 0.25) V.dx = T.dx;
    if (Math.abs(T.dy - V.dy) < 0.25) V.dy = T.dy;
    const W = window.innerWidth, H = window.innerHeight;
    if (Math.abs(V.dx) < 0.5 && Math.abs(V.dy) < 0.5) {
      if (this.camera.view && this.camera.view.enabled) { this.camera.clearViewOffset(); }
    } else {
      this.camera.setViewOffset(W, H, -V.dx, -V.dy, W, H);
    }
  }

  // Build a PMREM environment map from a small procedural "studio" scene of
  // brand-coloured emitters, so metals and the gloss floor have something to
  // reflect (core Three.js only — no RoomEnvironment addon, no CDN).
  _setupEnvironment() {
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = new THREE.Scene();
      env.background = new THREE.Color(0x04040a);
      const emit = (color, x, y, z, w, h) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color }));
        m.position.set(x, y, z); m.lookAt(0, y, 0); env.add(m);
      };
      // a ring of neon emitters (the rig), a bright top, a dark floor
      emit(0x9a7bff, 0, 7, -9, 20, 6);    // iris back wall
      emit(0x1FDDE9, -9, 4, 3, 12, 8);    // aqua stage-left
      emit(0x7855FA, 9, 4, 3, 12, 8);     // iris stage-right
      emit(0xFFC857, 0, 3, 9, 14, 5);     // gold front (camera side)
      emit(0x2a2f45, 0, 10.5, 0, 30, 30); // cool top fill
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x03030a }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -1; env.add(floor);

      this._envRT = pmrem.fromScene(env, 0.04);
      const tex = this._envRT.texture;
      this.studio.environment = tex;
      this.green.environment = tex;
      env.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      pmrem.dispose();
    } catch (e) {
      console.warn('[wwtbane] environment map unavailable', e); // metals just read matte
    }
  }

  /* ---------- public API ---------- */

  setScene(name) {
    const target = name === 'green' ? this.green : this.studio;
    if (this.active === target) return;
    this.active = target;
    if (this.pipe) this.pipe.setScene(this.active);
  }

  // Freeze on a named pose (used by the intro tutorial's tour).
  cutTo(camKey) {
    const P = PRESETS[camKey];
    if (P) this.director.holdPose(P.p, P.t);
  }

  // The crowd casts its vote: tint each card by the option that seat voted for
  // (proportional to the poll — VOTE_COLORS), then the _tick beat raises + fades
  // them in. Presentation only; the authored key still decides correctness.
  audienceVote(bars) {
    const cards = this._voteCards;
    if (!cards || !Array.isArray(bars) || !bars.length) return;
    const ballot = ballotFromBars(bars, this._voteN);
    const col = this._voteCol || (this._voteCol = new THREE.Color());
    for (let i = 0; i < this._voteN; i++) {
      const opt = ballot[i];
      col.set(VOTE_COLORS[opt] != null ? VOTE_COLORS[opt] : VOTE_COLORS[0]);
      cards.setColorAt(i, col);
    }
    if (cards.instanceColor) cards.instanceColor.needsUpdate = true;
    cards.visible = true;
    cards.position.y = -0.18;
    cards.material.opacity = 0;
    this._vote = { t: 0 }; // drives rise → hold → fall in _tick
  }

  // React to a quiz event: the director cues the camera (scene playlists in
  // takes.js); this switch keeps the lighting side — mood, pulses, beam spin.
  react(type, data = {}) {
    this.director.cue(type, data);
    switch (type) {
      case 'question:show':
        this.set.wall.showMark(true);                          // (C6-04) in a run: the wordmark shows on the wall
        this.set.core.powerPanels(true);
        if (data.isFinal) this._setMood(PAL.gold, 1.15);
        else if (data.tier === 'hard') this._setMood(PAL.iris, 1.05);
        else if (data.tier === 'medium') this._setMood(PAL.aqua, 1.0);
        else this._setMood(PAL.iris, 0.95);
        this._talk = 2.6; // the host reads it out
        this._lightEnv = 1; // full rig while the host presents the question
        this._phase = 'readout'; // then eases down to the thinking dim (in _tick)
        break;
      case 'ui:lockin':
        this.set.core.setTension(true);
        this._lightEnv = 0.32; // dim the fills — hard key on the contestant
        this._phase = 'lockin';
        break;
      case 'lifeline:use':
        // Ask the Audience: the crowd raises its vote cards (the director cuts to
        // the audiencePoll camera in the same tick).
        if (data.type === 'audience' && data.payload) this.audienceVote(data.payload.bars);
        if (data.type === 'fifty') this.set.core.powerPanels(false); // the two panels go dark
        break;
      case 'host:welcome':
        this._talk = 3.6;
        break;
      case 'answer:correct':
        this._flash(PAL.mantis);
        this.set.core.setTension(false); this.set.core.flash();
        this.set.fx.sparks(40, 0, 1.9, 0, PAL.mantis);
        this._mood = { kind: 'happy', t: 2.2, total: 2.2 };
        this._lightEnv = 1; // rig flares back up on the reveal
        this._phase = 'reveal';
        break;
      case 'answer:wrong':
        this._flash(PAL.peach);
        this.set.core.setTension(false);
        this._setMood(PAL.peach, 0.7);
        this._mood = { kind: 'sad', t: 2.8, total: 2.8 };
        this._lightEnv = 1;
        this._phase = 'reveal';
        break;
      case 'coins:bank':
        this.set.fx.coins(36); this.set.pig.userData.bump();
        break;
      case 'run:win':
        this.set.fx.confetti(180); this.set.fx.coins(60); this.set.fx.show(7);
        this.set.wall.showMark(false);                         // (C6-04) hero screens carry their own wordmark
        this._setMood(PAL.gold, 1.3);
        this._spin = this.reduced ? 1 : 3;
        this._mood = { kind: 'happy', t: 8, total: 8 };
        break;
      case 'run:dead':
        this.set.wall.showMark(false);                         // (C6-04) hero screens carry their own wordmark
        this._setMood(0x223, 0.5);
        break;
      case 'green:manager':
        // the stage manager opens the green-room door and stands by it
        if (this._greenSM) this._greenSM.visible = true;
        this._doorT = 0;
        this._talk = 3.4; // "we're ready for you back in the Hot Seat!"
        break;
      case 'scene:green':
        this.set.wall.showMark(false);                         // (C6-04) hero screens carry their own wordmark
        // fresh visit: the door is shut, the manager is back in the hallway
        if (this._greenDoor) this._greenDoor.rotation.y = 0;
        if (this._greenSM) this._greenSM.visible = false;
        this._doorT = null;
        break;
      default: break;
    }
  }

  resize() { this._onResize(); }

  // A read-only snapshot of what the renderer is actually doing — the e2e hook
  // exposes it so a browser test can prove each quality tier builds the chain it
  // promises, rather than trusting that the flag was honoured.
  gfxInfo() {
    const pipe = this.pipe;
    return {
      tier: this.tier ? this.tier.name : null,
      gpu: this.gpu || '',
      pipe: !!pipe,
      ao: !!(pipe && pipe.aoPass),
      bloom: !!(pipe && pipe.bloom),
      grade: !!(pipe && pipe.grade),
      msaa: this.tier ? this.tier.msaa : 0,
      dpr: this.renderer ? this.renderer.getPixelRatio() : 0,
      view: { dx: Math.round(this._view.dx), dy: Math.round(this._view.dy) },
      fov: this.camera ? Math.round(this.camera.fov * 10) / 10 : 0,
      calls: this._stats ? this._stats.calls : 0,         // draw calls in the last frame
      triangles: this._stats ? this._stats.triangles : 0,  // triangles in the last frame
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this._debugTimer) clearInterval(this._debugTimer);
    window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
      if (this.pipe) { this.pipe.dispose(); this.pipe = null; }
      if (this.set) this.set.dispose();
      if (this._envRT) this._envRT.dispose();
      this.renderer.dispose();
      [this.studio, this.green].forEach((sc) => sc && sc.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          // material.dispose() does not free its textures — do it explicitly.
          if (m.map) m.map.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          if (m.roughnessMap && m.roughnessMap !== m.map) m.roughnessMap.dispose();
          m.dispose();
        });
        // An InstancedMesh keeps its instanceMatrix / instanceColor buffers on the
        // mesh (not the geometry), so geometry.dispose() misses them — free them.
        if (o.isInstancedMesh && o.dispose) o.dispose();
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
    // The mood colours everything BEHIND the talent (wall, deck, rims, beams) and
    // eases there; the key light on faces is never tinted. Under reduced motion
    // it snaps.
    this.accent.set(color, intensity, this.reduced);
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
    // (PH) delta-time audit: clamp the frame delta so a backgrounded tab doesn't return
    // with a multi-second dt that teleports camera moves and mood envelopes.
    this.renderer.info.reset();
    const rawDt = this.clock.getDelta();
    const dt = Math.min(0.05, rawDt);
    if (this.governor) this.governor.sample(rawDt);
    if ((this._measureAt -= dt) <= 0) { this._measureAt = 0.25; this._measureSafeFrame(); }
    this._applyFrameShift(dt);
    this.director.reduced = this.reduced;
    const pose = this.director.update(dt);
    if (pose) {
      this.camera.position.set(pose.p[0], pose.p[1], pose.p[2]);
      // Micro-motion: a tiny handheld drift so static shots never feel frozen
      // (≈0.5% of a typical framing). Off under reduced motion / effects-off.
      if (!this.reduced && this.postFx) {
        const t = this.clock.elapsedTime;
        this.camera.position.x += Math.sin(t * 0.7) * 0.02 + Math.sin(t * 1.9) * 0.006;
        this.camera.position.y += Math.sin(t * 0.9 + 1.3) * 0.013;
      }
      this._look.set(pose.t[0], pose.t[1], pose.t[2]);
      this.camera.lookAt(this._look);
    }

    if (!this.reduced && this.active === this.studio) this._crowdTick(dt, this.clock.elapsedTime);
    if (this._spin > 1) this._spin = Math.max(1, this._spin - dt * 0.6);

    // Lock-in cue: the fills ease down toward the target so only the key pool
    // survives (the classic tension beat), crossfading. Reduced motion snaps.
    if (Math.abs(this._lightEnvCur - this._lightEnv) > 0.001) {
      this._lightEnvCur = this.reduced ? this._lightEnv
        : this._lightEnvCur + (this._lightEnv - this._lightEnvCur) * Math.min(1, dt * 3.2);
    }

    // Reveal flash: a single bounded pulse (< 3 Hz; reduced motion exits above).
    let pulseAmt = 0;
    if (this.pulse.active) {
      this.pulse.t += dt;
      const k = Math.min(1, this.pulse.t / this.pulse.dur);
      pulseAmt = Math.sin(k * Math.PI); // up then down
      if (k >= 1) this.pulse.active = false;
    }

    // One call for the whole set: accent, lights, deck, wall, beams, core, motes.
    if (this.set) {
      this.set.update(dt, this.clock.elapsedTime, {
        reduced: this.reduced, postFx: this.postFx, spin: this._spin,
        env: this._lightEnvCur, pulse: pulseAmt, pulseColor: this.pulse.color,
      });
    }

    // Ask-the-Audience vote cards: raise + fade in, hold, then lower + fade out.
    // Event-driven (handled regardless of reduced motion; reduced snaps on/off).
    if (this._vote && this._voteCards) {
      const v = this._vote; v.t += dt;
      const cards = this._voteCards;
      const RISE = 1.1, HOLD_END = 4.6, FALL_END = 5.6;
      if (this.reduced) {
        cards.position.y = 0; cards.material.opacity = 0.92;
        if (v.t >= FALL_END) { cards.visible = false; this._vote = null; }
      } else if (v.t < RISE) {
        const k = 1 - Math.pow(1 - v.t / RISE, 3);
        cards.position.y = -0.18 * (1 - k); cards.material.opacity = 0.92 * k;
      } else if (v.t < HOLD_END) {
        cards.position.y = Math.sin((v.t - RISE) * 2) * 0.012; cards.material.opacity = 0.92;
      } else if (v.t < FALL_END) {
        const k = (v.t - HOLD_END) / (FALL_END - HOLD_END);
        cards.position.y = -0.16 * k; cards.material.opacity = 0.92 * (1 - k);
      } else {
        cards.visible = false; cards.material.opacity = 0; this._vote = null;
      }
    }

    // Life pass: blinking, breathing, head sway, talking mouths, reactions.
    // Skipped entirely under reduced motion.
    if (!this.reduced) {
      if (this._talk > 0) this._talk -= dt;
      if (this._mood && (this._mood.t -= dt) <= 0) this._mood = null;
      // Once the host finishes reading out, the "thinking" cinematic takes over —
      // ease the rig down a touch for a more dramatic, deliberative mood (the
      // lock-in later dims it much further). Reveal/read-out sit at full.
      if (this._phase === 'readout' && this._talk <= 0) {
        this._phase = 'thinking';
        this._lightEnv = 0.84;
      }
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

    if (this.pipe) {
      // Freeze the grain field under reduced motion — advancing the time uniform
      // reshuffles per-pixel noise every frame, which is continuous motion.
      this.pipe.update({ time: this.clock.elapsedTime, animateGrain: !this.reduced });
      try { this.pipe.render(); }
      catch { this.pipe.dispose(); this.pipe = null; this.renderer.render(this.active, this.camera); }
    } else {
      // effects off (or unavailable): flat direct render
      this.renderer.render(this.active, this.camera);
    }
    const ri = this.renderer.info.render;
    this._stats = { calls: ri.calls, triangles: ri.triangles };
    this._checkFrame(dt);
  };

  _onResize = () => {
    if (!this.camera) return;
    this._fitCamera();
    this._applyResolution(this.governor ? this.governor.scale : 1);
    this._measureSafeFrame();
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
      // Breathing: two layered sines make an organic in/out (not a metronome);
      // the chest widens a touch as it rises.
      const breath = Math.sin(t * 1.5 + ph) * 0.62 + Math.sin(t * 0.83 + ph * 1.7) * 0.38;
      P.torso.scale.y = 1 + breath * 0.017;
      P.torso.scale.x = P.torso.scale.z = 1 + breath * 0.006;
      // Head: a slow wander + a faster micro-jitter + a slight roll, layered so
      // it never holds a pose. Crew glance around more (watching the monitors).
      const look = a.role === 'crew' ? 0.3 : 0.13;
      P.head.rotation.y = Math.sin(t * 0.35 + ph) * look + Math.sin(t * 1.27 + ph * 2) * 0.022;
      P.head.rotation.x = Math.sin(t * 0.29 + ph * 2) * 0.05 + Math.sin(t * 2.1 + ph) * 0.012;
      P.head.rotation.z = Math.sin(t * 0.5 + ph * 1.3) * 0.03;
      // A very slow whole-body weight shift so nobody stands like a statue
      // (skip the crowd actor — the crowd-moment animation owns its transform).
      // (PH) plus a hair of vertical bob coupled to the breath, so the shift reads
      // as weight moving through the legs rather than a hinge at the floor.
      if (a.role !== 'extra') {
        a.g.rotation.z = Math.sin(t * 0.6 + ph) * 0.008;
        if (a.baseY === undefined) a.baseY = a.g.position.y;
        a.g.position.y = a.baseY + breath * 0.005;
      }
      // Blinking: a smooth lid close-and-open (a sine hump over ~0.14s, many
      // frames) instead of a hard 1-frame drop, with an occasional double blink.
      const bt = (t + ph * 1.31) % 3.4;
      let blink = 1;
      if (bt < 0.14) blink = 1 - Math.sin((bt / 0.14) * Math.PI) * 0.9;
      else if (bt > 0.22 && bt < 0.34 && Math.floor((t + ph) / 3.4) % 3 === 0) {
        blink = 1 - Math.sin(((bt - 0.22) / 0.12) * Math.PI) * 0.9; // the second flick of a double blink
      }
      P.eyeL.scale.y = blink; P.eyeR.scale.y = blink;
      // Gaze: the eyes jump to a new spot every ~1.6 s (a saccade) and hold, as
      // real eyes do; the crowd of cameras and the other talent are the targets.
      const gk = Math.floor(t / 1.6 + ph);
      const gh = Math.sin(gk * 12.9898 + ph * 78.233) * 43758.5453;
      const gx = ((gh - Math.floor(gh)) - 0.5) * 0.011, gy = (((gh * 7.13) - Math.floor(gh * 7.13)) - 0.5) * 0.006;
      P.irisL.position.x = P.irisR.position.x = gx;
      P.irisL.position.y = P.irisR.position.y = gy;
      let brow = 0; // + raised, - lowered
      // idle arm sway around the posed base, layered for a looser feel (the crowd
      // actor's arms belong to the crowd-moment animation while one is running)
      const actorBusy = a.role === 'extra' && this._crowd && this._crowd.event;
      if (!actorBusy) {
        P.armL.rotation.z = a.armL + Math.sin(t * 0.8 + ph) * 0.05 + Math.sin(t * 1.7 + ph) * 0.015;
        P.armR.rotation.z = a.armR + Math.sin(t * 0.8 + ph + 1.3) * 0.05 + Math.sin(t * 1.9 + ph) * 0.015;
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
        brow = (mood.kind === 'happy' ? 1 : -0.7) * env;
        if (mood.kind === 'happy' && a.role === 'player') {
          // arms up in relief — smoothly in and back down with the envelope.
          // Each arm pivots from its own shoulder (armPivot.rotation.z=0 hangs
          // straight down); the sign here must swing it OUT and up (away from
          // the body's centreline), not in — the opposite sign swings the hand
          // across the chest and up through the face. Right arm (sgn=+1) needs
          // a positive target, left arm (sgn=-1) a negative one.
          P.armL.rotation.z = a.armL * (1 - env) - 2.3 * env;
          P.armR.rotation.z = a.armR * (1 - env) + 2.3 * env;
        }
      } else if (this._talk > 0 && a.role === talker) {
        setMouth(P, Math.sin(t * 11) > -0.2 ? 'open' : 'flat');
        // talking: small nods on the beat of the speech, a raised brow on
        // stress, and the free hand gestures
        const beat = Math.max(0, Math.sin(t * 5.3 + ph));
        P.head.rotation.x += beat * 0.05;
        brow = beat * 0.5;
        if (a.role === 'host') P.armR.rotation.z = a.armR + Math.sin(t * 2.4) * 0.22 + beat * 0.12;
      } else {
        setMouth(P, a.role === 'host' ? 'smile' : 'flat');
      }
      P.browL.position.y = P.browR.position.y = 0.058 + brow * 0.009;
      P.browL.rotation.z = 0.1 - brow * 0.06; P.browR.rotation.z = -0.1 + brow * 0.06;
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

  // Set one seat's instance matrix across every audience mesh (body/head/hair).
  _seatSet(idx, matrix) {
    for (const m of this._crowd.meshes) { m.setMatrixAt(idx, matrix); m.instanceMatrix.needsUpdate = true; }
  }

  _crowdTick(dt, t) {
    const c = this._crowd;
    if (!c) return;
    // restore a seat someone walked out of
    if (c.restoreIdx >= 0 && t >= c.restoreAt) {
      this._seatSet(c.restoreIdx, this._seatMatrix(c.seats[c.restoreIdx], c.seats[c.restoreIdx].scale));
      c.restoreIdx = -1;
    }
    const ev = c.event;
    if (ev) {
      ev.t += dt;
      const seat = c.seats[ev.idx];
      if (ev.kind === 'cough') {
        // a couple of quick shoulder jolts
        this._seatSet(ev.idx, this._seatMatrix(seat, seat.scale * (1 + Math.abs(Math.sin(ev.t * 24)) * 0.05)));
        if (ev.t >= 0.5) {
          this._seatSet(ev.idx, this._seatMatrix(seat, seat.scale));
          c.event = null;
        }
      } else if (ev.kind === 'wave') {
        // positive: swings the (right) arm up and outward, clear of the head —
        // the negative angle used here previously swung the hand up and across
        // the face instead (see the armL/armR fix note above)
        c.actor.userData.parts.armR.rotation.z = 2.0 + Math.sin(ev.t * 7) * 0.5;
        if (ev.t >= 2.8) {
          c.actor.visible = false;
          this._seatSet(ev.idx, this._seatMatrix(seat, seat.scale));
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
      // swap the instance for the animated actor, matching the seat's colours so
      // the stand-in doesn't pop (torso.material is shared by torso+arms; head's
      // by head/nose/ears/hands; hairM is the exposed hair cap material).
      this._seatSet(idx, this._hiddenMat);
      const P = c.actor.userData.parts;
      P.torso.material.color.setHex(seat.shirt);
      P.head.material.color.setHex(seat.skin);
      if (P.hairM) P.hairM.color.setHex(seat.hair);
      c.actor.position.set(seat.x, seat.y, seat.z);
      c.actor.rotation.y = seat.rotY;
      c.actor.scale.setScalar(seat.scale * 0.97);
      c.actor.userData.parts.armR.rotation.z = kind === 'wave' ? 2.0 : c.actor.userData.parts.armR.rotation.z;
      c.actor.visible = true;
    }
  }

}
