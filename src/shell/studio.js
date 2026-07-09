// studio.js — the persistent WebGL backdrop. Built once; scenes are camera moves
// and lighting/prop swaps, not rebuilds (CLAUDE.md §5). Owns the single RAF.
// The quiz itself is a DOM overlay drawn on top of this canvas — never rendered
// in GL — which is what keeps the game accessible.
//
// Adapted and modularised from the 3D studio prototype. Original neon identity
// only; stick figures + glow; no cloned trade dress.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const PAL = { iris: 0x7855FA, aqua: 0x1FDDE9, mantis: 0x92DD23, peach: 0xFF6B5B, gold: 0xFFC857 };

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
    this.cam = {
      from: new THREE.Vector3(), to: new THREE.Vector3(),
      tFrom: new THREE.Vector3(), tTo: new THREE.Vector3(), k: 1, dur: 1.1,
    };
    this._spin = 1; // beam spin multiplier (bumped on wins)
  }

  async init() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;
    this.container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI * 0.52;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 40;
    this.controls.enablePan = false;

    this.clock = new THREE.Clock();
    this.studio = this._buildStudio();
    this.green = this._buildGreen();
    this.active = this.studio;

    await this._setupBloom();
    this._setCam('two', true);
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
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.5, 0.2));
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
    this._setCam(name === 'green' ? 'green' : 'two', false);
  }

  cutTo(camKey) { if (PRESETS[camKey]) this._setCam(camKey, false); }

  // React to a quiz event (the backdrop side of the event contract).
  react(type, data = {}) {
    switch (type) {
      case 'question:show':
        this.setScene('studio');
        if (data.isFinal) { this._setMood(PAL.gold, 1.15); this.cutTo('two'); }
        else if (data.tier === 'hard') { this._setMood(PAL.iris, 1.05); this.cutTo('player'); }
        else if (data.tier === 'medium') { this._setMood(PAL.aqua, 1.0); this.cutTo('two'); }
        else { this._setMood(PAL.iris, 0.95); this.cutTo('two'); }
        break;
      case 'lifeline:use':
        if (data.type === 'audience') this.cutTo('aud');
        else if (data.type === 'phone') this.cutTo('host');
        else this.cutTo('over');
        break;
      case 'answer:correct':
        this._flash(PAL.mantis);
        this.cutTo('player');
        break;
      case 'answer:wrong':
        this._flash(PAL.peach);
        this._setMood(PAL.peach, 0.7);
        break;
      case 'run:win':
        this._setMood(PAL.gold, 1.3);
        this._spin = this.reduced ? 1 : 3;
        this.cutTo('two');
        break;
      case 'run:dead':
        this._setMood(0x223, 0.5);
        this.cutTo('over');
        break;
      case 'scene:green':
        this.setScene('green');
        break;
      case 'scene:studio':
        this.setScene('studio');
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

  _setCam(key, instant) {
    const P = PRESETS[key]; if (!P) return;
    this.cam.from.copy(this.camera.position); this.cam.tFrom.copy(this.controls.target);
    this.cam.to.set(...P.p); this.cam.tTo.set(...P.t);
    this.cam.k = (instant || this.reduced) ? 1 : 0;
    if (this.cam.k === 1) { this.camera.position.copy(this.cam.to); this.controls.target.copy(this.cam.tTo); this.controls.update(); }
  }

  _tick = () => {
    if (this.disposed) return;
    const dt = this.clock.getDelta();
    if (this.cam.k < 1) {
      this.cam.k = Math.min(1, this.cam.k + dt / this.cam.dur);
      const e = this.cam.k < 0.5 ? 2 * this.cam.k * this.cam.k : 1 - Math.pow(-2 * this.cam.k + 2, 2) / 2;
      this.camera.position.lerpVectors(this.cam.from, this.cam.to, e);
      this.controls.target.lerpVectors(this.cam.tFrom, this.cam.tTo, e);
    }
    this.controls.update();

    if (!this.reduced && this.active === this.studio) {
      const t = this.clock.elapsedTime;
      for (const b of this.beams) {
        b.rotation.z = Math.cos(b.userData.base + t * 0.3 * this._spin) * 0.2;
        b.rotation.x = Math.sin(b.userData.base + t * 0.3 * this._spin) * 0.2;
      }
      if (this._spin > 1) this._spin = Math.max(1, this._spin - dt * 0.6);
    }

    // Flash pulse via the warm light (bounded, < 3Hz, reduced-motion exits above).
    if (this.pulse.color && this._pulseLight) {
      this.pulse.t += dt;
      const k = Math.min(1, this.pulse.t / this.pulse.dur);
      const amt = Math.sin(k * Math.PI); // up then down, single pulse
      this._pulseLight.color.copy(this.pulse.color);
      this._pulseLight.intensity = 20 + amt * 120;
      if (k >= 1) { this.pulse.color = null; this._pulseLight.intensity = 20; }
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

    s.add(new THREE.AmbientLight(0x222244, 0.5));
    const key = new THREE.SpotLight(PAL.iris, 120, 60, 0.6, 0.5, 1.2); key.position.set(6, 14, 8); key.target.position.set(0, 1, 0); s.add(key, key.target);
    this._keyLight = key;
    const key2 = new THREE.SpotLight(PAL.aqua, 90, 60, 0.7, 0.5, 1.2); key2.position.set(-8, 12, 4); key2.target.position.set(0, 1, 0); s.add(key2, key2.target);
    const warm = new THREE.PointLight(PAL.gold, 40, 30); warm.position.set(0, 4, 2); s.add(warm);
    this._pulseLight = new THREE.PointLight(PAL.mantis, 20, 40); this._pulseLight.position.set(0, 2, 3); s.add(this._pulseLight);

    const disc = cyl(9, 9, 0.4, mat(0x0b0b18, 0x090914, 0.2, 0.35, 0.7)); disc.position.y = -0.2;
    disc.geometry = new THREE.CylinderGeometry(9, 9, 0.4, 64); s.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 0.08, 10, 80), mat(0x000000, PAL.aqua, 2)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; s.add(rim);

    const spokeGeo = new THREE.BoxGeometry(0.1, 0.05, 6);
    const spokeMat = mat(0x000000, PAL.gold, 2.2);
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
    const audMat = mat(0x14142a, PAL.iris, 0.12, 0.7);
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
    const halo = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), mat(0x000000, PAL.iris, 0.7)); halo.position.set(0, 4, -12.2); s.add(halo);

    const beamColors = [PAL.iris, PAL.aqua, PAL.gold, PAL.iris];
    for (let i = 0; i < beamColors.length; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 24, 1, true),
        new THREE.MeshBasicMaterial({ color: beamColors[i], transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const a = i / beamColors.length * Math.PI * 2; cone.position.set(Math.cos(a) * 3, 5.5, Math.sin(a) * 3);
      cone.rotation.z = Math.cos(a) * 0.18; cone.rotation.x = Math.sin(a) * 0.18; cone.userData.base = a; s.add(cone); this.beams.push(cone);
    }
    return s;
  }

  _buildGreen() {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x2a2c30);
    s.add(new THREE.AmbientLight(0xffffff, 0.55));
    const ceil = new THREE.PointLight(0xfff4e0, 40, 30); ceil.position.set(0, 4.2, -1); s.add(ceil);
    const lampL = new THREE.PointLight(PAL.gold, 25, 12); lampL.position.set(-4.2, 2.4, -3.5); s.add(lampL);

    const wallMat = mat(0xcfd3da, 0, 0.9), floorMat = mat(0x35363b, 0, 0.95), ceilMat = mat(0xf2f0ea, 0, 0.95);
    s.add(pos(box(12, 0.1, 10, floorMat), 0, 0, -2));
    s.add(pos(box(12, 0.1, 10, ceilMat), 0, 4.6, -2));
    s.add(pos(box(12, 4.7, 0.15, wallMat), 0, 2.35, -7));
    s.add(pos(box(0.15, 4.7, 10, wallMat), -6, 2.35, -2));
    s.add(pos(box(0.15, 4.7, 10, wallMat), 6, 2.35, -2));
    s.add(pos(box(2.4, 0.06, 1.2, mat(0x000000, 0xfff4e0, 1.5)), 0, 4.5, -1));

    const leather = mat(0xa0643a, 0, 0.6), wood = mat(0xc9a468, 0, 0.7), woodDk = mat(0x8a6a44, 0, 0.7);
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
    s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.9)), -4.2, 1.65, -6.3));
    s.add(pos(cyl(0.04, 0.04, 2.6, woodDk), 5.2, 1.3, -6.2));
    s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.9)), 5.2, 2.5, -6.2));

    s.add(pos(box(1.5, 1.1, 0.06, woodDk), 0.4, 2.6, -6.9));
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.95), new THREE.MeshBasicMaterial({ map: artTexture() })); art.position.set(0.4, 2.6, -6.86); s.add(art);
    const doorMat = mat(0xe9e6df, 0, 0.8);
    s.add(pos(box(0.9, 3.4, 0.1, doorMat), -2.9, 1.7, -6.9));
    s.add(pos(box(0.9, 3.4, 0.1, doorMat), -2.0, 1.7, -6.9));

    const you = figure(PAL.mantis, 1); you.position.set(0.4, 0.55, -4.8); you.rotation.y = 0.2;
    you.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.emissiveIntensity = 0.1; o.material.color.set(0x4a4a5a); } });
    s.add(you);
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
  const skin = mat(0xeef0ff, accent, 0.35, 0.5);
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
