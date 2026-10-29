// actors.js — skeletal people for the stage.
//
// The procedural people in people.js are capsules with faces. These are the other kind: a rigged,
// properly proportioned human body (Quaternius "Universal Base Characters", CC0) animated with real motion-
// captured-style clips (Quaternius "Universal Animation Library", CC0). Both packs share one skeleton, so any
// clip plays on any body. See assets/people/ATTRIBUTIONS.md for sources and licences.
//
// The base bodies arrive in underwear, so the clothes are made here, at load time: each garment is a shell
// cut out of the body's own mesh (the triangles inside a region), pushed out along its normals so it sits on
// top of the skin, and skinned to the same bones. That is why a shirt or a pair of trousers follows the
// animation exactly, with no separate rigging.
//
// Nothing here is required: loadActorKit() resolves to null if any file fails to load (offline, blocked,
// an old browser) and the set falls back to the procedural people.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const ROOT = new URL('../../../assets/people/', import.meta.url).href;
export const HAIR_STYLES = ['Hair_SimpleParted', 'Hair_Buns', 'Hair_Buzzed', 'Hair_Long', 'Hair_BuzzedFemale', 'Hair_Beard'];

let kitPromise = null;

// Loads (once) the two bodies, the hair styles and the animation clips. Resolves to null on any failure.
export function loadActorKit() {
  if (!kitPromise) {
    kitPromise = (async () => {
      const L = new GLTFLoader();
      const load = (p) => L.loadAsync(ROOT + p);
      const [f, m, an, ...hs] = await Promise.all([
        load('body_f/body_f.gltf'), load('body_m/body_m.gltf'), load('anims.glb'),
        ...HAIR_STYLES.map((h) => load(`${h}/${h}.gltf`)),
      ]);
      const clips = {}; for (const c of an.animations) clips[c.name] = c;
      const hair = {}; HAIR_STYLES.forEach((h, i) => { hair[h] = hs[i].scene; });
      return { bodies: { f: f.scene, m: m.scene }, hair, clips };
    })().catch((e) => { console.warn('[wwtbane] skeletal people unavailable — using the procedural ones', e); return null; });
  }
  return kitPromise;
}

// Where each bone sits in the body's bind pose (the T-pose the mesh was modelled in).
function bindPositions(skeleton) {
  const out = new Map();
  skeleton.bones.forEach((b, i) => out.set(b.name, new THREE.Vector3().setFromMatrixPosition(skeleton.boneInverses[i].clone().invert())));
  return out;
}

// A garment: the part of `body` inside every plane in `planes` ({ axis: 0|1|2, max } or { axis, min }), clipped
// exactly at the plane so hems and cuffs are straight lines, minus the region where `hole(x, y, z)` is negative (the
// neck opening; triangles that straddle its edge are subdivided so the edge is round, not a saw), pushed out by
// `inflate` metres along the normals and skinned like the body.
export function garment(body, planes, hole, inflate, material) {
  const g = body.geometry, pos = g.attributes.position, nor = g.attributes.normal, idx = g.index;
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, uv = g.attributes.uv;
  const vert = (i) => ({
    p: [pos.getX(i), pos.getY(i), pos.getZ(i)], n: [nor.getX(i), nor.getY(i), nor.getZ(i)], uv: uv ? [uv.getX(i), uv.getY(i)] : [0, 0],
    si: [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)], sw: [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)],
  });
  const lerp = (a, b, t) => ({
    p: a.p.map((v, k) => v + (b.p[k] - v) * t), n: a.n.map((v, k) => v + (b.n[k] - v) * t), uv: a.uv.map((v, k) => v + (b.uv[k] - v) * t),
    si: t < 0.5 ? a.si : b.si, sw: t < 0.5 ? a.sw : b.sw,
  });
  // Sutherland–Hodgman against one plane, keeping d(v) <= 0
  const clip = (poly, d) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], da = d(a), db = d(b);
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) out.push(lerp(a, b, da / (da - db)));
    }
    return out;
  };
  const tests = planes.map((pl) => (pl.max !== undefined ? (v) => v.p[pl.axis] - pl.max : (v) => pl.min - v.p[pl.axis]));
  const tris = [];
  const mid = (a, b) => lerp(a, b, 0.5);
  const emit = (tri, depth) => {
    if (!hole) { tris.push(tri); return; }
    const d = tri.map((v) => hole(v.p[0], v.p[1], v.p[2]));
    if (d[0] < 0 && d[1] < 0 && d[2] < 0) return;
    if (d[0] >= 0 && d[1] >= 0 && d[2] >= 0) { tris.push(tri); return; }
    if (depth > 0) {
      const [a, b, c] = tri, ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      emit([a, ab, ca], depth - 1); emit([ab, b, bc], depth - 1); emit([ca, bc, c], depth - 1); emit([ab, bc, ca], depth - 1);
      return;
    }
    const cx = (tri[0].p[0] + tri[1].p[0] + tri[2].p[0]) / 3, cy = (tri[0].p[1] + tri[1].p[1] + tri[2].p[1]) / 3, cz = (tri[0].p[2] + tri[1].p[2] + tri[2].p[2]) / 3;
    if (hole(cx, cy, cz) >= 0) tris.push(tri);
  };
  for (let t = 0; t < idx.count; t += 3) {
    let poly = [vert(idx.getX(t)), vert(idx.getX(t + 1)), vert(idx.getX(t + 2))];
    for (const d of tests) { poly = clip(poly, d); if (poly.length < 3) break; }
    if (poly.length < 3) continue;
    for (let k = 1; k + 1 < poly.length; k++) emit([poly[0], poly[k], poly[k + 1]], 4);
  }
  const n = tris.length * 3;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4);
  let i = 0;
  for (const tri of tris) for (const v of tri) {
    for (let k = 0; k < 3; k++) { P[i * 3 + k] = v.p[k] + v.n[k] * inflate; N[i * 3 + k] = v.n[k]; }
    UV[i * 2] = v.uv[0]; UV[i * 2 + 1] = v.uv[1];
    for (let k = 0; k < 4; k++) { SI[i * 4 + k] = v.si[k]; SW[i * 4 + k] = v.sw[k]; }
    i++;
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(P, 3)); ng.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  ng.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  ng.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); ng.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
  const m = new THREE.SkinnedMesh(ng, material);
  m.bind(body.skeleton, body.bindMatrix);
  m.frustumCulled = false; m.castShadow = true;
  return m;
}

// Hair and brows: re-skin a "rigged to head bone" mesh onto the character's own skeleton, all on the Head bone.
function headPiece(body, scene, tint) {
  const headIdx = body.skeleton.bones.findIndex((b) => b.name === 'Head');
  const out = [];
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = headIdx; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    const mat = o.material.clone(); mat.color.set(tint); mat.side = THREE.DoubleSide; mat.alphaTest = Math.max(mat.alphaTest || 0, 0.4);
    const m = new THREE.SkinnedMesh(g, mat); m.bind(body.skeleton, body.bindMatrix); m.frustumCulled = false; out.push(m);
  });
  return out;
}

const fabric = (color, rough = 0.86) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });

// opts: sex 'f'|'m'; tone (skin brightness, 0.7–1.7); hair {style, color}; seated; outfit {top, topColor, innerColor,
//       bottomColor, shoeColor}; rim (accent colour). top: 'jacket' | 'tee' | 'hoodie' | 'shirt'.
export function createActor(kit, opts = {}) {
  const { sex = 'f', tone = 1, hair = null, seated = false, outfit = {} } = opts;
  const root = SkeletonUtils.clone(kit.bodies[sex]);
  let body = null, headBone = null, spine = null;
  root.traverse((o) => {
    if (o.isSkinnedMesh) { o.material = o.material.clone(); if (!body || o.geometry.attributes.position.count > body.geometry.attributes.position.count) body = o; }
    if (o.isBone && o.name === 'Head') headBone = o;
    if (o.isBone && o.name === 'spine_03') spine = o;
  });
  body.castShadow = true;
  body.material.color.setRGB(tone, tone * 0.97, tone * 0.94);
  // the bundled brows take the hair colour
  root.traverse((o) => { if (o.isSkinnedMesh && o.name === 'Eyebrows') { o.material.color.set(hair ? hair.color ?? 0x2a1c10 : 0x2a1c10); o.material.alphaTest = Math.max(o.material.alphaTest || 0, 0.4); o.material.side = THREE.DoubleSide; } });

  const bp = bindPositions(body.skeleton);
  const y = (n) => bp.get(n).y, x = (n) => Math.abs(bp.get(n).x);
  const waist = y('pelvis'), neck = y('neck_01'), ankle = y('foot_l');
  const sleeveShort = x('upperarm_l') + (x('lowerarm_l') - x('upperarm_l')) * 0.62, sleeveLong = x('hand_l') - 0.03;
  const top = outfit.top || 'tee';
  const topMat = fabric(outfit.topColor ?? 0x3a3f63, top === 'jacket' ? 0.7 : 0.9);
  const inflate = { jacket: 0.024, hoodie: 0.03, tee: 0.012, shirt: 0.012 }[top] ?? 0.014;
  const long = top === 'jacket' || top === 'hoodie' || top === 'shirt';
  const hem = { jacket: 0.16, hoodie: 0.14, tee: 0.03, shirt: 0.06 }[top] ?? 0.05; // how far below the hip joint the hem falls
  const pieces = [];
  const sleeve = long ? sleeveLong : sleeveShort;
  const headCut = { axis: 1, max: neck + 0.05 };            // nothing above the neck: the face is bare
  // a round neck opening, seen from the front, through front and back alike (negative inside)
  const neckHole = (cx, cy) => Math.hypot(cx, cy - (neck - 0.005)) - 0.078;
  if (top === 'jacket') {
    // a shirt collar standing up out of the neckline
    pieces.push(garment(body, [{ axis: 1, min: neck - 0.07 }, { axis: 1, max: neck + 0.04 }], (cx, cy, cz) => 0.092 - Math.hypot(cx, cz + 0.04), 0.016, fabric(outfit.innerColor ?? 0xe9ecf5, 0.8)));
  }
  pieces.push(garment(body, [{ axis: 1, min: waist - hem }, headCut, { axis: 0, max: sleeve }, { axis: 0, min: -sleeve }], neckHole, inflate, topMat));
  pieces.push(garment(body, [{ axis: 1, min: ankle + 0.015 }, { axis: 1, max: waist + 0.09 }, { axis: 0, max: 0.5 }, { axis: 0, min: -0.5 }], null, 0.026, fabric(outfit.bottomColor ?? 0x20202f, 0.8)));
  pieces.push(garment(body, [{ axis: 1, max: ankle + 0.015 }, { axis: 0, max: 0.5 }, { axis: 0, min: -0.5 }], null, 0.02, fabric(outfit.shoeColor ?? 0x0e0e12, 0.45)));
  for (const p of pieces) root.add(p);

  if (hair && kit.hair[hair.style]) for (const m of headPiece(body, kit.hair[hair.style], hair.color ?? 0x2a1c10)) root.add(m);

  // ---- motion ----
  const mixer = new THREE.AnimationMixer(root);
  const actions = {};
  for (const [name, clip] of Object.entries(kit.clips)) { actions[name] = mixer.clipAction(clip); actions[name].setLoop(THREE.LoopRepeat, Infinity); }
  const g = new THREE.Group(); g.add(root);
  let current = null;
  const play = (name, fade = 0.4) => {
    const next = actions[name]; if (!next || next === current) return;
    next.reset().setEffectiveWeight(1).play();
    if (current) current.crossFadeTo(next, fade, false);
    current = next; g.userData.clip = name;
  };
  const rest = seated ? 'Sitting_Idle_Loop' : 'Idle_Loop', talk = seated ? 'Sitting_Talking_Loop' : 'Idle_Talking_Loop';
  play(rest, 0);
  mixer.update(0.01); root.updateMatrixWorld(true);

  const head = { y: 0, x: 0, z: 0 };
  const api = {
    skeletal: true, mixer, actions, play, rest, talk, body, root, parts: null, bind: bp,
    // sit the pelvis on a seat: `seatY` is the cushion's top in the parent's space
    seatOn(seatY) {
      const pel = root.getObjectByName('pelvis'); pel.updateWorldMatrix(true, false);
      const wy = new THREE.Vector3().setFromMatrixPosition(pel.matrixWorld).y;
      g.position.y += seatY + 0.07 - wy;
    },
    // the life pass calls this each frame with the mood and whether this person is the one talking
    react({ t, phase = 0, talking = false, mood = null, glance = 0.13 }) {
      let want = talking ? talk : rest;
      let lift = 0;
      if (mood) {
        const env = Math.max(0, Math.min(1, mood.t / 0.35, (mood.total - mood.t) / 0.35));
        if (mood.kind === 'happy') { want = talk; lift = -0.1 * env; } else lift = 0.22 * env;
      }
      if (want !== g.userData.clip) play(want);
      head.y = Math.sin(t * 0.35 + phase) * glance + Math.sin(t * 1.27 + phase * 2) * 0.02;
      head.x = Math.sin(t * 0.29 + phase * 2) * 0.04 + lift;
      head.z = Math.sin(t * 0.5 + phase * 1.3) * 0.02;
    },
    update(dt) {
      mixer.update(dt);
      if (headBone) { headBone.rotation.y += head.y; headBone.rotation.x += head.x; headBone.rotation.z += head.z; }
    },
    dispose() { mixer.stopAllAction(); root.traverse((o) => { if (o.isMesh) { o.geometry.dispose?.(); } }); },
  };
  Object.assign(g.userData, api);
  return g;
}
