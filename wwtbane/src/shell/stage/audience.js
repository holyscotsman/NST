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
// A person is three instanced meshes (clothes, skin, hair) per body type, plus the chairs. Per-person variation
// is per-instance colour on a white base. The people start as capsule stand-ins and are upgraded to simplified,
// baked-pose human shapes (assets/people/crowd/, about 1.5k triangles each; see ATTRIBUTIONS.md) once those small
// files load: upgrade() swaps the geometry in place, so nothing else has to know.
import * as THREE from 'three';
import { PAL, mat, mergeGeos, rimLit } from './kit.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { crowdSprites } from './spriteActors.js';

const CROWD_ROOT = new URL('../../../assets/people/crowd/', import.meta.url).href;

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

  // Two body types (m/f). Each seat belongs to one, and `userData.map` on every mesh turns a global seat index into
  // that mesh's own instance index (-1: not this body type), so callers can keep addressing seats globally.
  const isF = (i, t) => ((i * 7 + t * 3) % 5) < 2;
  const nF = (() => { let n = 0, k = 0; for (let t = 0; t < tiers; t++) for (let i = 0; i < perTier[t]; i++, k++) if (isF(i, t)) n++; return n; })();
  const variants = {};
  for (const [v, n] of [['m', total - nF], ['f', nF]]) {
    const body = new THREE.InstancedMesh(mergeGeos(bTorso, bLap, bArmL, bArmR), bodyMat, n);
    const head = new THREE.InstancedMesh(headGeo, headMat, n);
    const hair = new THREE.InstancedMesh(hairGeo, hairMat, n);
    for (const m of [body, head, hair]) { m.userData.map = new Int32Array(total).fill(-1); m.userData.variant = v; }
    variants[v] = { body, head, hair, n: 0 };
  }
  const chairs = new THREE.InstancedMesh(mergeGeos(chairGeoSeat, chairGeoBack), chairMat, total);
  const meshes = ['m', 'f'].flatMap((v) => [variants[v].body, variants[v].head, variants[v].hair]);

  // dark, muted palettes — the room is mostly silhouette
  const shirtCols = [0x23263f, 0x2d2236, 0x1f3030, 0x3a3018, 0x26262e, 0x25301d, 0x35222f, 0x1d2740, 0x2b2b3a];
  const skinCols = [0xa98265, 0xbf9670, 0x8d6342, 0x6f452d, 0xc9a98a, 0x84553a];
  const hairCols = [0x1a140e, 0x0c0907, 0x2c1f12, 0x45454e, 0x1e1815];
  const o = new THREE.Object3D(), col = new THREE.Color(), white = new THREE.Color(0xffffff);
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
      const v = isF(i, t) ? 'f' : 'm', V = variants[v], li = V.n++;
      for (const m of [V.body, V.head, V.hair]) { m.setMatrixAt(li, o.matrix); m.userData.map[count] = li; }
      const shirt = shirtCols[(i * 7 + t * 29) % shirtCols.length];
      const skin = skinCols[(i * 5 + t * 11) % skinCols.length];
      const hair = hairCols[(i * 3 + t * 7) % hairCols.length];
      V.body.setColorAt(li, col.setHex(shirt));
      V.head.setColorAt(li, col.setHex(skin));
      V.hair.setColorAt(li, col.setHex(hair));
      seats.push({ x: o.position.x, y: Y, z: o.position.z, rotY: o.rotation.y, scale, shirt, skin, hair, v });
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
  const cardO = new THREE.Object3D();
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

  // Swap the capsule stand-ins for the baked human shapes. Resolves to false (and leaves the capsules) on any failure.
  async function upgrade() {
    const lod = tier.crowdDetail === 0 ? '_lo' : ''; // the weakest tier gets a ~1k-triangle person instead of ~2.3k
    try {
      const L = new GLTFLoader();
      const load = async (v, k) => { const g = await L.loadAsync(`${CROWD_ROOT}crowd_${v}_${k}${lod}.glb`); let geo = null; g.scene.traverse((o) => { if (o.isMesh && !geo) geo = o.geometry; }); return geo; };
      const got = {};
      for (const v of ['m', 'f']) got[v] = { body: await load(v, 'clothes'), head: await load(v, 'skin'), hair: await load(v, 'hair') };
      for (const v of ['m', 'f']) for (const k of ['body', 'head', 'hair']) {
        const mesh = variants[v][k]; const old = mesh.geometry; mesh.geometry = got[v][k]; old.dispose();
      }
      return true;
    } catch (e) { console.warn('[wwtbane] baked crowd unavailable — keeping the capsule crowd', e); return false; }
  }

  // HD-2D crowd: the body instances become pixel-art cards (same matrices, same seat map, so the studio's wave / cough /
  // leave code is untouched); the separate head and hair instances are not needed any more.
  let spriteBob = null;
  function useSprites(kit) {
    if (!kit) return false;
    try {
      const looks = { m: 'fan', f: 'stage' }, flips = [];
      for (const v of ['m', 'f']) {
        const V = variants[v], cs = crowdSprites(kit, looks[v]);
        const old = V.body.geometry; V.body.geometry = cs.geometry; V.body.material = cs.material; old.dispose();
        // tint: the seat's muted shirt colour, lifted so the sprite's own colours still show
        seats.forEach((st, i) => { const k = V.body.userData.map[i]; if (st.v === v && k >= 0) V.body.setColorAt(k, col.setHex(st.shirt).multiplyScalar(3.4)); });
        if (V.body.instanceColor) V.body.instanceColor.needsUpdate = true;
        V.head.visible = false; V.hair.visible = false;
        flips.push(cs.flip);
      }
      spriteBob = (t) => { flips[0](Math.floor(t * 1.1) & 1); flips[1](Math.floor(t * 1.1 + 0.5) & 1); };
      return true;
    } catch (e) { console.warn('[wwtbane] sprite crowd unavailable', e); return false; }
  }

  return { group, meshes, chairs, seats, voteCards, total, phones, upgrade, useSprites, bob: (t) => spriteBob && spriteBob(t) };
}
