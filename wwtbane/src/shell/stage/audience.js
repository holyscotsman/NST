// audience.js — the crowd.
//
// 168 identical bobble-heads in full-saturation shirts was the busiest thing on
// screen. A studio audience is the opposite of a focal point: dark, dense,
// anonymous, and lit only from the front by stage spill — what you notice is the
// rim of light on shoulders and the odd phone glowing. So:
//
//   - denser rows (the spacing is constant, so the outer tiers hold more people)
//   - clothing darkened and desaturated, varied by index (no RNG: stable)
//   - a fresnel rim from the accent so the silhouettes read against the wall
//   - riser fascias lit in a dim accent line, so the tiers read as architecture
//   - phones: a small percentage of seats hold a glowing screen
//
// Bodies, heads, hair and chairs are four instanced meshes (four draw calls for
// the whole room). Per-person variation is per-instance colour on a white base.
import * as THREE from 'three';
import { PAL, mat, mergeGeos, rimLit } from './kit.js';

export function buildAudience({ tier, accent }) {
  const group = new THREE.Group();
  const tiers = 4, spacing = 0.66;
  const perTier = [];
  for (let t = 0; t < tiers; t++) perTier.push(Math.round(((11 + t * 1.7) * Math.PI * 0.88) / spacing));
  const total = perTier.reduce((a, b) => a + b, 0);

  // Geometry detail follows the tier. Nobody in the crowd is ever closer than ten
  // metres, so on the weaker tiers a person is a handful of facets: the silhouette
  // (which is all a dark crowd is) survives, the triangle count does not.
  //                                     torso    arms     head     hair
  const D = [{ tc: 3, tr: 8,  ac: 2, ar: 6, hw: 8,  hh: 6, rw: 6,  rh: 4 },    // low
             { tc: 4, tr: 10, ac: 3, ar: 7, hw: 10, hh: 7, rw: 8,  rh: 5 },    // medium
             { tc: 5, tr: 12, ac: 4, ar: 8, hw: 14, hh: 10, rw: 10, rh: 8 }][tier.crowdDetail] || {};
  const bTorso = new THREE.CapsuleGeometry(0.13, 0.26, D.tc, D.tr); bTorso.translate(0, 1.14, 0);
  const bLap = new THREE.BoxGeometry(0.26, 0.1, 0.34); bLap.translate(0, 0.84, 0.14);
  const bArmL = new THREE.CapsuleGeometry(0.043, 0.24, D.ac, D.ar); bArmL.rotateX(0.95); bArmL.translate(-0.16, 1.02, 0.1);
  const bArmR = new THREE.CapsuleGeometry(0.043, 0.24, D.ac, D.ar); bArmR.rotateX(0.95); bArmR.translate(0.16, 1.02, 0.1);
  const headGeo = new THREE.SphereGeometry(0.15, D.hw, D.hh); headGeo.translate(0, 1.52, 0);
  const hairGeo = new THREE.SphereGeometry(0.155, D.rw, D.rh); hairGeo.scale(1, 0.72, 1); hairGeo.translate(0, 1.57, -0.02);
  const rimOn = (m, strength) => (tier.rimLight ? rimLit(m, accent.alt, { power: 3.4, strength }) : m);
  const bodyMat = rimOn(mat(0xffffff, 0x000000, 0, 0.8), 0.2);
  const headMat = rimOn(mat(0xffffff, 0x000000, 0, 0.62), 0.14);
  const hairMat = rimOn(mat(0xffffff, 0x000000, 0, 0.8), 0.32);
  const chairGeoSeat = new THREE.BoxGeometry(0.36, 0.07, 0.36); chairGeoSeat.translate(0, 0.76, 0.05);
  const chairGeoBack = new THREE.BoxGeometry(0.36, 0.55, 0.07); chairGeoBack.translate(0, 1.02, -0.16);
  const chairMat = mat(0x0d0d1c, 0x000000, 0, 0.75, 0.2);

  const audBody = new THREE.InstancedMesh(mergeGeos(bTorso, bLap, bArmL, bArmR), bodyMat, total);
  const audHead = new THREE.InstancedMesh(headGeo, headMat, total);
  const audHair = new THREE.InstancedMesh(hairGeo, hairMat, total);
  const chairs = new THREE.InstancedMesh(mergeGeos(chairGeoSeat, chairGeoBack), chairMat, total);
  const meshes = [audBody, audHead, audHair];

  // dark, muted palettes — the room is mostly silhouette
  const shirtCols = [0x23263f, 0x2d2236, 0x1f3030, 0x3a3018, 0x26262e, 0x25301d, 0x35222f, 0x1d2740, 0x2b2b3a];
  const skinCols = [0xa98265, 0xbf9670, 0x8d6342, 0x6f452d, 0xc9a98a, 0x84553a];
  const hairCols = [0x1a140e, 0x0c0907, 0x2c1f12, 0x45454e, 0x1e1815];
  const o = new THREE.Object3D(), col = new THREE.Color();
  const seats = [];
  let count = 0;

  for (let t = 0; t < tiers; t++) {
    const R = 11 + t * 1.7, Y = 0.2 + t * 1.15, per = perTier[t];
    const riser = new THREE.Mesh(new THREE.RingGeometry(R - 0.85, R + 0.85, 64, 1, Math.PI * 0.06, Math.PI * 0.88),
      mat(0x0a0a18, 0x000000, 0, 0.85, 0.2));
    riser.rotation.x = -Math.PI / 2; riser.position.y = Y - 0.03; group.add(riser);
    const fascia = new THREE.Mesh(new THREE.RingGeometry(R - 0.9, R - 0.82, 64, 1, Math.PI * 0.06, Math.PI * 0.88),
      accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 0.7, true));
    fascia.rotation.x = -Math.PI / 2; fascia.position.y = Y - 0.025; group.add(fascia);

    for (let i = 0; i < per; i++) {
      const a = Math.PI * 1.06 + (i / (per - 1)) * Math.PI * 0.88;
      const scale = 0.94 + ((i * 37 + t * 13) % 17) / 100;
      // a person's front (lap, arms, face) is local +Z: yaw 3pi/2 - a aims it at the stage
      o.position.set(Math.cos(a) * R, Y, Math.sin(a) * R); o.rotation.y = Math.PI * 1.5 - a;
      o.scale.setScalar(1); o.updateMatrix(); chairs.setMatrixAt(count, o.matrix);
      o.scale.setScalar(scale); o.updateMatrix();
      audBody.setMatrixAt(count, o.matrix); audHead.setMatrixAt(count, o.matrix); audHair.setMatrixAt(count, o.matrix);
      const shirt = shirtCols[(i * 7 + t * 29) % shirtCols.length];
      const skin = skinCols[(i * 5 + t * 11) % skinCols.length];
      const hair = hairCols[(i * 3 + t * 7) % hairCols.length];
      audBody.setColorAt(count, col.setHex(shirt));
      audHead.setColorAt(count, col.setHex(skin));
      audHair.setColorAt(count, col.setHex(hair));
      seats.push({ x: o.position.x, y: Y, z: o.position.z, rotY: o.rotation.y, scale, shirt, skin, hair });
      count++;
    }
  }
  for (const m of [...meshes, chairs]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    group.add(m);
  }

  // Phones: a few percent of the room is holding a lit screen.
  const phoneIdx = [];
  for (let i = 0; i < seats.length; i++) if (((i * 2654435761) >>> 0) % 100 < 7) phoneIdx.push(i);
  const phones = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }), phoneIdx.length);
  phoneIdx.forEach((si, k) => {
    const st = seats[si], dl = Math.hypot(st.x, st.z) || 1, ux = -st.x / dl, uz = -st.z / dl;
    o.position.set(st.x + ux * 0.24, st.y + 1.05 * st.scale, st.z + uz * 0.24);
    o.rotation.set(-0.5, Math.atan2(ux, uz), 0); o.scale.setScalar(st.scale); o.updateMatrix();
    phones.setMatrixAt(k, o.matrix);
    phones.setColorAt(k, k % 3 ? col.setRGB(1.4, 1.5, 2.0) : col.setRGB(2.0, 1.6, 1.1));
  });
  phones.instanceMatrix.needsUpdate = true; if (phones.instanceColor) phones.instanceColor.needsUpdate = true;
  group.add(phones);

  // Ask-the-Audience cards: one per seat, hidden until the lifeline fires.
  const cardGeo = new THREE.PlaneGeometry(0.16, 0.22);
  const cardMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const voteCards = new THREE.InstancedMesh(cardGeo, cardMat, total);
  const cardO = new THREE.Object3D(), white = new THREE.Color(0xffffff);
  for (let i = 0; i < seats.length; i++) {
    const st = seats[i], dl = Math.hypot(st.x, st.z) || 1, ux = -st.x / dl, uz = -st.z / dl;
    cardO.position.set(st.x + ux * 0.28, st.y + 1.34 * st.scale, st.z + uz * 0.28);
    cardO.rotation.set(0, Math.atan2(ux, uz), 0); cardO.scale.setScalar(st.scale);
    cardO.updateMatrix(); voteCards.setMatrixAt(i, cardO.matrix); voteCards.setColorAt(i, white);
  }
  voteCards.instanceMatrix.needsUpdate = true;
  if (voteCards.instanceColor) voteCards.instanceColor.needsUpdate = true;
  voteCards.visible = false;
  group.add(voteCards);

  return { group, meshes, chairs, seats, voteCards, total, phones };
}
