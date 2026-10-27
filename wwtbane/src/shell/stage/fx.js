// fx.js — the set's celebrations: paper confetti, a gold coin shower, and radial
// sparks. Stage D of the graphics overhaul.
//
// Two instanced meshes (paper, coins) share one small CPU-simulated pool each:
// a few hundred particles at most, so the cost is a handful of draw calls and a
// trivial loop. Nothing here allocates per frame.
//
// Rules from the design brief hold: no strobing (particles fall and fade, nothing
// flashes), and under reduced motion every emit call is a no-op — the
// celebration is carried by the colour change, the HUD and the camera cut, not
// by things moving.
import * as THREE from 'three';
import { PAL } from './kit.js';

const COUNTS = { low: [120, 30], medium: [260, 60], high: [480, 110] };
const PAPER_COLORS = [PAL.iris, PAL.aqua, PAL.mantis, PAL.gold, PAL.peach, 0xffffff];
const G = 9.8;

class Pool {
  constructor(mesh, n) {
    this.mesh = mesh; this.n = n; this.cursor = 0;
    this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3);
    this.r = new Float32Array(n * 3); this.w = new Float32Array(n * 3);
    this.life = new Float32Array(n); this.rest = new Uint8Array(n);
    this.o = new THREE.Object3D();
    // start every instance collapsed
    this.o.scale.setScalar(0); this.o.updateMatrix();
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, this.o.matrix);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false; // instances roam far outside the base geometry's bounds
  }
  spawn() { // ring cursor: a full pool recycles its oldest particle
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.n; this.rest[i] = 0; return i;
  }
}

export function buildFx({ tier }) {
  const [nPaper, nCoin] = COUNTS[tier.name] || COUNTS.medium;
  const group = new THREE.Group();

  const paperMesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.15, 0.085),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: true }), nPaper);
  paperMesh.setColorAt(0, new THREE.Color(1, 1, 1)); // allocates instanceColor
  const coinMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.014, 12),
    new THREE.MeshStandardMaterial({ color: PAL.gold, emissive: PAL.gold, emissiveIntensity: 0.25, metalness: 0.85, roughness: 0.3 }), nCoin);
  group.add(paperMesh, coinMesh);
  const paper = new Pool(paperMesh, nPaper), coins = new Pool(coinMesh, nCoin);
  const tmp = new THREE.Color();
  let showT = 0, showCarry = 0, t = 0;
  let reduced = false;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function emitPaper(x, y, z, vx, vy, vz, life) {
    const i = paper.spawn(), k = i * 3;
    paper.p[k] = x; paper.p[k + 1] = y; paper.p[k + 2] = z;
    paper.v[k] = vx; paper.v[k + 1] = vy; paper.v[k + 2] = vz;
    paper.r[k] = rnd(0, 6.28); paper.r[k + 1] = rnd(0, 6.28); paper.r[k + 2] = rnd(0, 6.28);
    paper.w[k] = rnd(-9, 9); paper.w[k + 1] = rnd(-9, 9); paper.w[k + 2] = rnd(-5, 5);
    paper.life[i] = life;
    tmp.setHex(PAPER_COLORS[(Math.random() * PAPER_COLORS.length) | 0]);
    paperMesh.setColorAt(i, tmp); paperMesh.instanceColor.needsUpdate = true;
  }
  function emitCoin(x, y, z, vx, vy, vz) {
    const i = coins.spawn(), k = i * 3;
    coins.p[k] = x; coins.p[k + 1] = y; coins.p[k + 2] = z;
    coins.v[k] = vx; coins.v[k + 1] = vy; coins.v[k + 2] = vz;
    coins.r[k] = rnd(0, 6.28); coins.r[k + 1] = 0; coins.r[k + 2] = rnd(0, 6.28);
    coins.w[k] = rnd(-8, 8); coins.w[k + 1] = 0; coins.w[k + 2] = rnd(-8, 8);
    coins.life[i] = rnd(3.2, 4.4);
  }

  const api = {
    group,
    get active() { return showT > 0; },

    // A burst of paper over the stage floor.
    confetti(n = 120) {
      if (reduced) return;
      for (let i = 0; i < n; i++) emitPaper(rnd(-5, 5), rnd(5.2, 7), rnd(-4, 4), rnd(-0.8, 0.8), rnd(-0.5, 1.2), rnd(-0.8, 0.8), rnd(4.5, 7));
    },
    // Coins tipping down toward a point on the deck (the piggy bank by default).
    coins(n = 30, x = 5.7, z = -0.9) {
      if (reduced) return;
      for (let i = 0; i < n; i++) emitCoin(x + rnd(-0.5, 0.5), rnd(3.2, 5.2), z + rnd(-0.5, 0.5), rnd(-0.5, 0.5), rnd(-1, 0.5), rnd(-0.5, 0.5));
    },
    // Radial sparks thrown up and out from a point (the Core on a right answer).
    sparks(n = 36, x = 0, y = 1.6, z = 0, color = PAL.gold) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.28), s = rnd(1.2, 3.4);
        emitPaper(x, y, z, Math.cos(a) * s, rnd(1.6, 4.2), Math.sin(a) * s, rnd(1.6, 2.6));
        const k = ((paper.cursor + paper.n - 1) % paper.n);
        tmp.setHex(i % 3 === 0 ? 0xffffff : color); paperMesh.setColorAt(k, tmp);
      }
    },
    // Keep it raining for a while (the run-win moment).
    show(seconds = 6) { if (!reduced) showT = seconds; },

    update(dt, isReduced) {
      reduced = !!isReduced; t += dt;
      if (reduced) { showT = 0; }
      if (showT > 0) {
        showT -= dt;
        showCarry += dt;
        const per = 1 / 55; // ~55 pieces a second, scaled to the pool
        while (showCarry > per) {
          showCarry -= per;
          emitPaper(rnd(-5.5, 5.5), rnd(6, 7.2), rnd(-4.5, 4.5), rnd(-0.6, 0.6), rnd(-0.4, 0.6), rnd(-0.6, 0.6), rnd(5, 7));
          if (Math.random() < 0.22) emitCoin(rnd(-4, 4), rnd(5, 6.5), rnd(-3, 3), rnd(-0.4, 0.4), rnd(-0.5, 0), rnd(-0.4, 0.4));
        }
      }
      stepPaper(dt); stepCoins(dt);
    },
    dispose() { paperMesh.geometry.dispose(); paperMesh.material.dispose(); coinMesh.geometry.dispose(); coinMesh.material.dispose(); },
  };

  function stepPaper(dt) {
    const P = paper, o = P.o; let any = false;
    for (let i = 0; i < P.n; i++) {
      if (P.life[i] <= 0) continue;
      any = true;
      const k = i * 3;
      P.life[i] -= dt;
      if (P.life[i] <= 0) { o.position.set(0, -50, 0); o.scale.setScalar(0); o.updateMatrix(); paperMesh.setMatrixAt(i, o.matrix); continue; }
      if (!P.rest[i]) {
        // gravity, but paper hits terminal velocity fast and sways side to side
        P.v[k + 1] = Math.max(-1.5, P.v[k + 1] - G * 0.35 * dt);
        P.v[k] += Math.sin(t * 5 + i * 1.7) * 1.4 * dt; P.v[k + 2] += Math.cos(t * 4.3 + i) * 1.4 * dt;
        P.v[k] *= 1 - 0.9 * dt; P.v[k + 2] *= 1 - 0.9 * dt;
        P.p[k] += P.v[k] * dt; P.p[k + 1] += P.v[k + 1] * dt; P.p[k + 2] += P.v[k + 2] * dt;
        P.r[k] += P.w[k] * dt; P.r[k + 1] += P.w[k + 1] * dt; P.r[k + 2] += P.w[k + 2] * dt;
        if (P.p[k + 1] <= 0.015) { P.p[k + 1] = 0.015; P.rest[i] = 1; P.r[k] = Math.PI / 2; }
      }
      const fade = Math.min(1, P.life[i] / 0.6);
      o.position.set(P.p[k], P.p[k + 1], P.p[k + 2]);
      o.rotation.set(P.r[k], P.r[k + 1], P.r[k + 2]);
      o.scale.setScalar(fade);
      o.updateMatrix(); paperMesh.setMatrixAt(i, o.matrix);
    }
    if (any) { paperMesh.instanceMatrix.needsUpdate = true; if (paperMesh.instanceColor) paperMesh.instanceColor.needsUpdate = true; }
  }

  function stepCoins(dt) {
    const P = coins, o = P.o; let any = false;
    for (let i = 0; i < P.n; i++) {
      if (P.life[i] <= 0) continue;
      any = true;
      const k = i * 3;
      P.life[i] -= dt;
      if (P.life[i] <= 0) { o.position.set(0, -50, 0); o.scale.setScalar(0); o.updateMatrix(); coinMesh.setMatrixAt(i, o.matrix); continue; }
      if (!P.rest[i]) {
        P.v[k + 1] -= G * dt;
        P.p[k] += P.v[k] * dt; P.p[k + 1] += P.v[k + 1] * dt; P.p[k + 2] += P.v[k + 2] * dt;
        P.r[k] += P.w[k] * dt; P.r[k + 2] += P.w[k + 2] * dt;
        if (P.p[k + 1] <= 0.02) {
          P.p[k + 1] = 0.02;
          if (P.v[k + 1] < -1.2) { P.v[k + 1] *= -0.38; P.v[k] *= 0.5; P.v[k + 2] *= 0.5; P.w[k] *= 0.5; P.w[k + 2] *= 0.5; }
          else { P.rest[i] = 1; P.r[k] = 0; P.r[k + 2] = 0; } // lies flat
        }
      }
      o.position.set(P.p[k], P.p[k + 1], P.p[k + 2]);
      o.rotation.set(P.r[k], P.r[k + 1], P.r[k + 2]);
      o.scale.setScalar(Math.min(1, P.life[i] / 0.6));
      o.updateMatrix(); coinMesh.setMatrixAt(i, o.matrix);
    }
    if (any) coinMesh.instanceMatrix.needsUpdate = true;
  }

  return api;
}
