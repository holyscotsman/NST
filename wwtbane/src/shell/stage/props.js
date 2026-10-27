// props.js — set dressing that is neither a person nor architecture.
import * as THREE from 'three';
import { PAL, mat, cyl, box, sph } from './kit.js';

// A broadcast pedestal camera for the fourth wall — body, lens, red tally
// light, and a little operator monitor on the back.
export function studioCamera(screenMat) {
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
export function piggyBank(x, z) {
  const g = new THREE.Group();
  const pedestal = cyl(0.5, 0.62, 1.0, mat(0x101020, 0x1FDDE9, 0.08, 0.4, 0.6)); pedestal.position.y = 0.5; g.add(pedestal);
  const top = cyl(0.56, 0.5, 0.08, mat(0x000000, 0xFFC857, 0.35)); top.position.y = 1.02; g.add(top);
  const goldM = mat(0xffc857, 0xFFC857, 0.28, 0.35, 0.35);
  const body = sph(0.42, goldM); body.scale.set(1.18, 0.92, 1); body.position.y = 1.48; g.add(body);
  const snout = cyl(0.13, 0.16, 0.14, goldM); snout.rotation.z = Math.PI / 2; snout.position.set(-0.52, 1.44, 0); g.add(snout);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 12), goldM); earL.position.set(-0.18, 1.82, 0.2); earL.scale.set(1.5, 0.8, 0.8); earL.rotation.x = 0.5; g.add(earL);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 12), goldM); earR.position.set(-0.18, 1.82, -0.2); earR.scale.set(1.5, 0.8, 0.8); earR.rotation.x = -0.5; g.add(earR);
  for (const [lx, lz] of [[-0.24, 0.2], [0.24, 0.2], [-0.24, -0.2], [0.24, -0.2]]) {
    const leg = cyl(0.07, 0.08, 0.18, goldM); leg.position.set(lx, 1.12, lz); g.add(leg);
  }
  const slot = box(0.2, 0.03, 0.06, mat(0x0a0a14, 0x000000, 0, 0.5)); slot.position.set(0.05, 1.88, 0); g.add(slot);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 20, Math.PI * 1.4), goldM);
  tail.position.set(0.52, 1.52, 0); tail.rotation.y = Math.PI / 2; g.add(tail);
  // a face: dark eyes with a glint, and nostrils on the snout
  const eyeM = mat(0x120a04, 0x000000, 0, 0.3);
  for (const sz of [-1, 1]) {
    const e = sph(0.035, eyeM); e.position.set(-0.31, 1.61, sz * 0.31); g.add(e);
    const gl = sph(0.011, new THREE.MeshBasicMaterial({ color: 0xffffff })); gl.position.set(-0.335, 1.625, sz * 0.335); g.add(gl);
    const n = sph(0.018, eyeM); n.position.set(-0.6, 1.45, sz * 0.05); g.add(n);
  }
  // Bank squash: every coin banked makes the pig give a little. `bump()` starts
  // it, `update(dt)` runs it (a damped spring on the body's squash). Rest pose
  // is the identity, so a pig that has never been bumped costs nothing.
  let k = 0, v = 0, rest = true;
  g.userData.bump = () => { v = 7; rest = false; };
  g.userData.update = (dt, reduced) => {
    if (rest) return;
    if (reduced) { rest = true; g.scale.setScalar(g.userData.baseScale || 1); return; }
    v += (-90 * k - 7 * v) * dt; k += v * dt;
    const s0 = g.userData.baseScale || 1;
    g.scale.set(s0 * (1 - k * 0.04), s0 * (1 + k * 0.08), s0 * (1 - k * 0.04));
    if (Math.abs(k) < 0.002 && Math.abs(v) < 0.02) { k = 0; v = 0; rest = true; g.scale.setScalar(s0); }
  };
  g.userData.baseScale = 1;
  g.position.set(x, 0, z);
  g.rotation.y = 0.5; // snout angled toward the stage center
  return g;
}

