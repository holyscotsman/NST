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
    this.pulse = { color: null, t: 0, dur: 0.7 };
    this._look = new THREE.Vector3();
    this._spin = 1; // beam spin multiplier (bumped on wins)
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
        break;
      case 'answer:correct':
        this._flash(PAL.mantis);
        break;
      case 'answer:wrong':
        this._flash(PAL.peach);
        this._setMood(PAL.peach, 0.7);
        break;
      case 'run:win':
        this._setMood(PAL.gold, 1.3);
        this._spin = this.reduced ? 1 : 3;
        break;
      case 'run:dead':
        this._setMood(0x223, 0.5);
        break;
      case 'green:manager':
        // the stage manager opens the green-room door and stands by it
        if (this._greenSM) this._greenSM.visible = true;
        this._doorT = 0;
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
      this.renderer.dispose();
      [this.studio, this.green].forEach((sc) => sc && sc.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
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
    if (this._keyLight) { this._keyLight.color.setHex(color); }
  }

  _flash(color) {
    if (this.reduced) return; // reduced motion: no strobe/pulse
    this.pulse.color = new THREE.Color(color);
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
    if (this.pulse.color && this._pulseLight) {
      this.pulse.t += dt;
      const k = Math.min(1, this.pulse.t / this.pulse.dur);
      const amt = Math.sin(k * Math.PI); // up then down, single pulse
      this._pulseLight.color.copy(this.pulse.color);
      this._pulseLight.intensity = 14 + amt * 90;
      if (k >= 1) { this.pulse.color = null; this._pulseLight.intensity = 14; }
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

    const disc = cyl(9, 9, 0.4, mat(0x0b0b18, 0x090914, 0.2, 0.35, 0.7)); disc.position.y = -0.2;
    disc.geometry = new THREE.CylinderGeometry(9, 9, 0.4, 64); s.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 0.08, 10, 80), mat(0x000000, PAL.aqua, 1.7)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; s.add(rim);

    const spokeGeo = new THREE.BoxGeometry(0.1, 0.05, 6);
    const spokeMat = mat(0x000000, PAL.gold, 0.45);
    const N = 30, spokes = new THREE.InstancedMesh(spokeGeo, spokeMat, N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; d.position.set(Math.cos(a) * 4.6, 0.03, Math.sin(a) * 4.6); d.rotation.set(0, -a, 0); d.updateMatrix(); spokes.setMatrixAt(i, d.matrix); }
    spokes.instanceMatrix.needsUpdate = true; s.add(spokes);

    const console_ = new THREE.Group();
    const pole = cyl(0.28, 0.4, 1.2, mat(0x101020, PAL.aqua, 0.3, 0.4, 0.6)); pole.position.y = 0.6; console_.add(pole);
    for (const dx of [-0.55, 0.55]) {
      const arm = cyl(0.05, 0.05, 0.7, mat(0x101020)); arm.position.set(dx * 0.7, 1.15, 0); arm.rotation.z = Math.PI / 2; console_.add(arm);
      const mon = box(0.9, 0.7, 0.12, mat(0x0a0a16, PAL.aqua, 0.4)); mon.position.set(dx * 1.05, 1.2, 0); mon.rotation.y = dx > 0 ? -0.5 : 0.5; console_.add(mon);
    }
    s.add(console_);

    const stoolMat = mat(0x14141f, 0, 0.4, 0.3);
    const stoolH = cyl(0.34, 0.3, 0.12, stoolMat); stoolH.position.set(2.1, 0.85, 0); s.add(stoolH);
    const stoolP = cyl(0.34, 0.3, 0.12, stoolMat); stoolP.position.set(-2.1, 0.85, 0); s.add(stoolP);
    const legH = cyl(0.06, 0.06, 0.85, stoolMat); legH.position.set(2.1, 0.42, 0); s.add(legH);
    const legP = cyl(0.06, 0.06, 0.85, stoolMat); legP.position.set(-2.1, 0.42, 0); s.add(legP);

    const host = figure(PAL.gold, -1); host.position.set(2.1, 0, 0); host.rotation.y = Math.PI;
    const bow = box(0.16, 0.08, 0.05, mat(0x000000, PAL.gold, 1.5)); bow.position.set(0, 1.42, 0.12); host.add(bow);
    const hand = host.children[7]; if (hand) { hand.rotation.z = -1.1; hand.position.y = 1.55; }
    s.add(host);

    const player = figure(PAL.mantis, 1); player.position.set(-2.1, 0, 0); s.add(player);
    const parm = player.children[6]; if (parm) { parm.rotation.z = 1.4; parm.position.set(-0.05, 1.5, 0.16); }

    const body = new THREE.CapsuleGeometry(0.13, 0.62, 4, 8); body.translate(0, 1.0, 0);
    const ah = new THREE.SphereGeometry(0.17, 10, 8); ah.translate(0, 1.55, 0);
    const audMat = mat(0x1a1a34, PAL.iris, 0.22, 0.7);
    let count = 0; const tiers = 4, per = 42; const total = tiers * per;
    const aud = new THREE.InstancedMesh(mergeTwo(body, ah), audMat, total); const o = new THREE.Object3D();
    // Deterministic jitter so there is no per-frame allocation and no RNG surprises.
    for (let t = 0; t < tiers; t++) {
      const R = 11 + t * 1.7, Y = 0.2 + t * 1.15;
      for (let i = 0; i < per; i++) {
        const a = Math.PI * 1.06 + (i / (per - 1)) * Math.PI * 0.88;
        o.position.set(Math.cos(a) * R, Y, Math.sin(a) * R); o.rotation.y = -a + Math.PI / 2;
        o.scale.setScalar(0.95 + ((i * 37 + t * 13) % 15) / 100);
        o.updateMatrix(); aud.setMatrixAt(count++, o.matrix);
      }
    }
    aud.instanceMatrix.needsUpdate = true; s.add(aud);

    const truss = new THREE.Mesh(new THREE.TorusGeometry(8, 0.18, 8, 48), mat(0x15151f, PAL.peach, 0.15, 0.4, 0.7)); truss.rotation.x = Math.PI / 2; truss.position.y = 6; s.add(truss);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshBasicMaterial({ map: wordmarkTexture(), transparent: true }));
    back.position.set(0, 4, -12); s.add(back);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), mat(0x000000, PAL.iris, 0.4)); halo.position.set(0, 4, -12.2); s.add(halo);

    const beamColors = [PAL.iris, PAL.aqua, PAL.gold, PAL.iris];
    for (let i = 0; i < beamColors.length; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: beamColors[i], transparent: true, opacity: 0.032, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const a = i / beamColors.length * Math.PI * 2; cone.position.set(Math.cos(a) * 3, 5.5, Math.sin(a) * 3);
      cone.rotation.z = Math.cos(a) * 0.18; cone.rotation.x = Math.sin(a) * 0.18; cone.userData.base = a; s.add(cone); this.beams.push(cone);
    }

    // The piggy bank — where the coins live. On a pedestal at stage right;
    // the "thinking" playlist gives it a dramatic slow zoom (takes.js).
    s.add(piggyBank(4.2, 2.2));

    // The stage manager in the wings — headset, clipboard, permanently busy.
    // The "producerReady" scene cuts to them when a new game starts.
    const sm = standingFigure(0x23232f, PAL.aqua, 0.08);
    sm.position.set(-6.5, 0, 3.0); sm.rotation.y = 0.9; // facing the stage
    // over-ear headset band + a little boom mic
    const headset = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 8, 20), mat(0x0a0a14, PAL.aqua, 0.5));
    headset.position.set(0, 1.58, 0); headset.rotation.y = Math.PI / 2; sm.add(headset);
    const mic = box(0.03, 0.03, 0.16, mat(0x0a0a14, PAL.aqua, 0.6));
    mic.position.set(0.12, 1.5, 0.12); mic.rotation.y = 0.5; sm.add(mic);
    const clipboard = box(0.26, 0.36, 0.03, mat(0x22222e, PAL.aqua, 0.25));
    clipboard.position.set(-0.28, 1.12, 0.14); clipboard.rotation.set(0.3, 0.2, 0.1); sm.add(clipboard);
    s.add(sm);

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

    const wallMat = mat(0x4d4438, 0, 0.9), floorMat = mat(0x241c12, 0, 0.95), ceilMat = mat(0x2e271c, 0, 0.95);
    s.add(pos(box(12, 0.1, 10, floorMat), 0, 0, -2));
    s.add(pos(box(12, 0.1, 10, ceilMat), 0, 4.6, -2));
    s.add(pos(box(12, 4.7, 0.15, wallMat), 0, 2.35, -7));
    s.add(pos(box(0.15, 4.7, 10, wallMat), -6, 2.35, -2));
    s.add(pos(box(0.15, 4.7, 10, wallMat), 6, 2.35, -2));
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
    const gsm = standingFigure(0x23232f, PAL.aqua, 0.12);
    const gband = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 8, 20), mat(0x0a0a14, PAL.aqua, 0.5));
    gband.position.set(0, 1.58, 0); gband.rotation.y = Math.PI / 2; gsm.add(gband);
    const gmic = box(0.03, 0.03, 0.16, mat(0x0a0a14, PAL.aqua, 0.6));
    gmic.position.set(0.12, 1.5, 0.12); gmic.rotation.y = 0.5; gsm.add(gmic);
    gsm.position.set(-2.15, 0, -6.4); gsm.rotation.y = -0.2; // in the doorway
    gsm.visible = false;
    s.add(gsm);
    this._greenSM = gsm;

    const you = figure(PAL.mantis, 1); you.position.set(0.4, 0.55, -4.8); you.rotation.y = 0.2;
    you.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.emissiveIntensity = 0.1; o.material.color.set(0x4a4a5a); } });
    s.add(you);

    // The sketchy guy — Steve's man, loitering by the doors in a long coat and
    // a wide-brim hat. The "sketchyCall" scene finds him (takes.js).
    const sg = new THREE.Group();
    const coatM = mat(0x17120c, PAL.gold, 0.07, 0.85);
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 1.15, 12), coatM);
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
function cyl(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), m); }
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function sph(r, m) { return new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); }
function pos(m, x, y, z) { m.position.set(x, y, z); return m; }

function figure(accent, dir) {
  const g = new THREE.Group();
  const skin = mat(0xeef0ff, accent, 0.5, 0.5); // bright enough to read, no close-up blowout
  const head = sph(0.2, skin); head.position.set(0, 1.62, 0); g.add(head);
  const torso = cyl(0.09, 0.11, 0.62, skin); torso.position.set(0, 1.2, 0); g.add(torso);
  const thighL = cyl(0.07, 0.07, 0.5, skin); thighL.position.set(-0.12, 0.92, 0.22 * dir); thighL.rotation.x = Math.PI / 2 * dir; g.add(thighL);
  const thighR = cyl(0.07, 0.07, 0.5, skin); thighR.position.set(0.12, 0.92, 0.22 * dir); thighR.rotation.x = Math.PI / 2 * dir; g.add(thighR);
  const shinL = cyl(0.06, 0.06, 0.55, skin); shinL.position.set(-0.12, 0.62, 0.46 * dir); g.add(shinL);
  const shinR = cyl(0.06, 0.06, 0.55, skin); shinR.position.set(0.12, 0.62, 0.46 * dir); g.add(shinR);
  const armL = cyl(0.055, 0.055, 0.5, skin); armL.position.set(-0.18, 1.28, 0.06 * dir); armL.rotation.z = 0.5; g.add(armL);
  const armR = cyl(0.055, 0.055, 0.5, skin); armR.position.set(0.18, 1.28, 0.06 * dir); armR.rotation.z = -0.5; g.add(armR);
  return g;
}

// A standing crew figure (legs, coat/torso, head) with a small accent glow.
function standingFigure(clothes, accent, glow) {
  const g = new THREE.Group();
  const m = mat(clothes, accent, glow, 0.75);
  const legL = cyl(0.06, 0.07, 0.72, m); legL.position.set(-0.11, 0.36, 0); g.add(legL);
  const legR = cyl(0.06, 0.07, 0.72, m); legR.position.set(0.11, 0.36, 0); g.add(legR);
  const torso = cyl(0.14, 0.17, 0.68, m); torso.position.y = 1.06; g.add(torso);
  const armL = cyl(0.05, 0.05, 0.52, m); armL.position.set(-0.22, 1.1, 0.02); armL.rotation.z = 0.35; g.add(armL);
  const armR = cyl(0.05, 0.05, 0.52, m); armR.position.set(0.22, 1.1, 0.02); armR.rotation.z = -0.6; g.add(armR);
  const head = sph(0.17, mat(0xd9cdb8, accent, glow * 0.6, 0.6)); head.position.y = 1.56; g.add(head);
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
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 8), goldM); earL.position.set(-0.2, 1.86, 0.17); g.add(earL);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 8), goldM); earR.position.set(-0.2, 1.86, -0.17); g.add(earR);
  for (const [lx, lz] of [[-0.24, 0.2], [0.24, 0.2], [-0.24, -0.2], [0.24, -0.2]]) {
    const leg = cyl(0.07, 0.08, 0.18, goldM); leg.position.set(lx, 1.12, lz); g.add(leg);
  }
  const slot = box(0.2, 0.03, 0.06, mat(0x0a0a14, 0x000000, 0, 0.5)); slot.position.set(0.05, 1.88, 0); g.add(slot);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 14, Math.PI * 1.4), goldM);
  tail.position.set(0.52, 1.52, 0); tail.rotation.y = Math.PI / 2; g.add(tail);
  g.position.set(x, 0, z);
  g.rotation.y = 0.5; // snout angled toward the stage center
  return g;
}

function mergeTwo(a, b) {
  const ga = a.toNonIndexed(), gb = b.toNonIndexed();
  const pa = ga.attributes.position.array, pb = gb.attributes.position.array;
  const na = ga.attributes.normal.array, nb = gb.attributes.normal.array;
  const pos_ = new Float32Array(pa.length + pb.length); pos_.set(pa); pos_.set(pb, pa.length);
  const nor = new Float32Array(na.length + nb.length); nor.set(na); nor.set(nb, na.length);
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
