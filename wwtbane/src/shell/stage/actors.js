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
      const [f, m, an, an2, ...hs] = await Promise.all([
        load('body_f/body_f.gltf'), load('body_m/body_m.gltf'), load('anims.glb'), load('anims2.glb'),
        ...HAIR_STYLES.map((h) => load(`${h}/${h}.gltf`)),
      ]);
      const clips = {}; for (const c of [...an.animations, ...an2.animations]) clips[c.name] = c;
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
// neck opening, clipped along its zero line so the edge is a smooth curve), pushed out by
// `inflate` metres along the normals and skinned like the body. `smooth` relaxation passes soften the body's muscle
// detail into cloth (open edges stay put).
export function garment(body, planes, hole, inflate, material, { smooth = 0, lambda = 0.5 } = {}) {
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
  // the opening is clipped like a plane, along the zero line of hole(x, y, z) (kept where it is >= 0), so its edge is a smooth curve
  if (hole) tests.push((v) => -hole(v.p[0], v.p[1], v.p[2]));
  const tris = [];
  for (let t = 0; t < idx.count; t += 3) {
    let poly = [vert(idx.getX(t)), vert(idx.getX(t + 1)), vert(idx.getX(t + 2))];
    for (const d of tests) { poly = clip(poly, d); if (poly.length < 3) break; }
    if (poly.length < 3) continue;
    for (let k = 1; k + 1 < poly.length; k++) tris.push([poly[0], poly[k], poly[k + 1]]);
  }
  // Weld vertices that share a position (to 0.01 mm) so the shell is one surface: it can then be smoothed like cloth
  // and shaded smoothly, instead of carrying the body's muscle detail.
  const key = (v) => `${Math.round(v.p[0] * 1e5)},${Math.round(v.p[1] * 1e5)},${Math.round(v.p[2] * 1e5)}`;
  const slot = new Map(), verts = [], I = [];
  for (const tri of tris) for (const v of tri) {
    const k = key(v); let id = slot.get(k);
    if (id === undefined) { id = verts.length; slot.set(k, id); verts.push(v); }
    I.push(id);
  }
  const n = verts.length;
  const P = new Float32Array(n * 3);
  verts.forEach((v, i) => { P[i * 3] = v.p[0]; P[i * 3 + 1] = v.p[1]; P[i * 3 + 2] = v.p[2]; });
  if (smooth > 0 && n) {
    // vertices on an open edge (hems, cuffs, the neck) stay put; the rest relax toward the average of their neighbours
    const edgeUse = new Map(), nb = Array.from({ length: n }, () => new Set());
    for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) {
      const a = I[t + e], b = I[t + (e + 1) % 3]; if (a === b) continue;
      const ek = a < b ? `${a}_${b}` : `${b}_${a}`; edgeUse.set(ek, (edgeUse.get(ek) || 0) + 1);
      nb[a].add(b); nb[b].add(a);
    }
    const fixed = new Uint8Array(n);
    for (const [ek, c] of edgeUse) if (c === 1) { const [a, b] = ek.split('_'); fixed[+a] = 1; fixed[+b] = 1; }
    const Q = new Float32Array(P.length);
    for (let it = 0; it < smooth; it++) {
      for (let i = 0; i < n; i++) {
        if (fixed[i] || !nb[i].size) { Q[i * 3] = P[i * 3]; Q[i * 3 + 1] = P[i * 3 + 1]; Q[i * 3 + 2] = P[i * 3 + 2]; continue; }
        let x = 0, y = 0, z = 0; for (const j of nb[i]) { x += P[j * 3]; y += P[j * 3 + 1]; z += P[j * 3 + 2]; }
        const k = 1 / nb[i].size;
        Q[i * 3] = P[i * 3] + (x * k - P[i * 3]) * lambda; Q[i * 3 + 1] = P[i * 3 + 1] + (y * k - P[i * 3 + 1]) * lambda; Q[i * 3 + 2] = P[i * 3 + 2] + (z * k - P[i * 3 + 2]) * lambda;
      }
      P.set(Q);
    }
  }
  // smoothing pulls the shell in at the body's bulges (chest, shoulders), so it is pushed out a little further
  inflate += Math.min(0.016, smooth * 0.0016);
  // normals from the (smoothed) surface, then the shell is pushed out along them
  const N = new Float32Array(n * 3);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const o of [a, b, c]) { N[o] += nx; N[o + 1] += ny; N[o + 2] += nz; }
  }
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1;
    N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l;
    P[i * 3] += N[i * 3] * inflate; P[i * 3 + 1] += N[i * 3 + 1] * inflate; P[i * 3 + 2] += N[i * 3 + 2] * inflate;
  }
  const UV = new Float32Array(n * 2), SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4);
  verts.forEach((v, i) => {
    UV[i * 2] = v.uv[0]; UV[i * 2 + 1] = v.uv[1];
    for (let k = 0; k < 4; k++) { SI[i * 4 + k] = v.si[k]; SW[i * 4 + k] = v.sw[k]; }
  });
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(P, 3)); ng.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  ng.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  ng.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); ng.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
  ng.setIndex(I);
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
//       bottomColor, shoeColor}; rim (accent colour); rest / talk (clip names that replace the default idle and
//       talking clips). top: 'jacket' | 'tee' | 'hoodie' | 'shirt'.
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
  pieces.push(garment(body, [{ axis: 1, min: waist - hem }, headCut, { axis: 0, max: sleeve }, { axis: 0, min: -sleeve }], neckHole, inflate, topMat, { smooth: top === 'tee' ? 5 : 9 }));
  pieces.push(garment(body, [{ axis: 1, min: ankle - 0.005 }, { axis: 1, max: waist + 0.09 }, { axis: 0, max: 0.5 }, { axis: 0, min: -0.5 }], null, 0.026, fabric(outfit.bottomColor ?? 0x20202f, 0.8), { smooth: 7 }));
  for (const p of pieces) root.add(p);

  // Shoes: the foot's own shell, relaxed hard so the toes merge into one rounded shape, and pushed out. Skinned like
  // the rest, so it follows the foot exactly (a block parented to the foot bone drifted off the foot).
  root.add(garment(body, [{ axis: 1, max: ankle + 0.012 }, { axis: 0, max: 0.5 }, { axis: 0, min: -0.5 }], null, 0.03, fabric(outfit.shoeColor ?? 0x0e0e12, 0.4), { smooth: 12, lambda: 0.5 }));

  // a build: the base bodies are heroic; slim them (it narrows clothes, arms and all, in one go)
  const build = opts.build ?? (sex === 'm' ? 0.9 : 0.96);
  root.scale.set(build, 1, build);

  const hairMeshes = [];
  root.traverse((o) => { if (o.isSkinnedMesh && o.name === 'Eyebrows') hairMeshes.push(o); });
  if (hair && kit.hair[hair.style]) for (const m of headPiece(body, kit.hair[hair.style], hair.color ?? 0x2a1c10)) { root.add(m); hairMeshes.push(m); }

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
  const rest = opts.rest || (seated ? 'Sitting_Idle_Loop' : 'Idle_Loop'), talk = opts.talk || (seated ? 'Sitting_Talking_Loop' : 'Idle_Talking_Loop');
  play(rest, 0);
  mixer.update(0.01); root.updateMatrixWorld(true);

  const head = { y: 0, x: 0, z: 0 };
  const armBones = { l: [root.getObjectByName('upperarm_l'), root.getObjectByName('lowerarm_l'), root.getObjectByName('hand_l')], r: [root.getObjectByName('upperarm_r'), root.getObjectByName('lowerarm_r'), root.getObjectByName('hand_r')] };
  let armsUp = 0;
  let armPose = null; // { side: 1|-1, x, y, z, amount } for one arm, in the figure's own frame; cleared each update
  const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3();
  const _qd = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qg = new THREE.Quaternion();
  // Swing a bone (and so the limb beneath it) until it points along `target` (world space), by `amount` of the way.
  const aim = (bone, child, target, amount) => {
    bone.updateWorldMatrix(true, true);
    bone.getWorldPosition(_p0); child.getWorldPosition(_p1); _d.subVectors(_p1, _p0).normalize();
    _qd.setFromUnitVectors(_d, target); _qd.slerp(_qi.identity(), 1 - amount);
    bone.getWorldQuaternion(_qw); _qw.premultiply(_qd);
    bone.parent.getWorldQuaternion(_qp); bone.quaternion.copy(_qp.invert().multiply(_qw));
    bone.updateWorldMatrix(false, true);
  };
  const api = {
    skeletal: true, mixer, actions, play, rest, talk, body, root, parts: null, bind: bp,
    // sit the pelvis on a seat: `seatY` is the cushion's top in the parent's space
    // hold one arm along a direction (the figure's own frame: x to its left, y up, z forward) on the next update
    pose(side, x, y, z, amount = 1) { armPose = { side, x, y, z, amount }; },
    // recolour for a stand-in: the top, the skin tone multiplier and the hair
    recolor({ top, tone, hair: hairColor } = {}) {
      if (top !== undefined) topMat.color.setHex(top);
      if (tone !== undefined) body.material.color.setRGB(tone, tone * 0.97, tone * 0.94);
      if (hairColor !== undefined) for (const m of hairMeshes) m.material.color.setHex(hairColor);
    },
    seatOn(seatY) {
      const pel = root.getObjectByName('pelvis'); pel.updateWorldMatrix(true, false);
      const wy = new THREE.Vector3().setFromMatrixPosition(pel.matrixWorld).y;
      g.position.y += seatY + 0.07 - wy;
    },
    // the life pass calls this each frame with the mood and whether this person is the one talking
    react({ t, phase = 0, talking = false, mood = null, glance = 0.13, cheers = false }) {
      let want = talking ? talk : rest;
      let lift = 0;
      if (mood) {
        const env = Math.max(0, Math.min(1, mood.t / 0.35, (mood.total - mood.t) / 0.35));
        if (mood.kind === 'happy') { want = talk; lift = -0.1 * env; armsUp = cheers ? env : 0; } else lift = 0.22 * env;
      } else armsUp = 0;
      if (opts.setArmsUp !== undefined) armsUp = opts.setArmsUp; // look-dev hook
      if (want !== g.userData.clip) play(want);
      head.y = Math.sin(t * 0.35 + phase) * glance + Math.sin(t * 1.27 + phase * 2) * 0.02;
      head.x = Math.sin(t * 0.29 + phase * 2) * 0.04 + lift;
      head.z = Math.sin(t * 0.5 + phase * 1.3) * 0.02;
    },
    update(dt) {
      mixer.update(dt);
      if (armsUp > 0.001) { // arms thrown up and out, both sides (cheering): aim each arm along a world direction
        g.getWorldQuaternion(_qg);
        for (const [side, bones] of [[1, armBones.l], [-1, armBones.r]]) {
          _t.set(side * 0.42, 1, 0.12).normalize().applyQuaternion(_qg);
          aim(bones[0], bones[1], _t, armsUp); aim(bones[1], bones[2], _t, armsUp);
        }
      }
      if (armPose) {
        g.getWorldQuaternion(_qg); const bones = armPose.side > 0 ? armBones.l : armBones.r;
        _t.set(armPose.x, armPose.y, armPose.z).normalize().applyQuaternion(_qg);
        aim(bones[0], bones[1], _t, armPose.amount); aim(bones[1], bones[2], _t, armPose.amount);
        armPose = null;
      }
      if (headBone) { headBone.rotation.y += head.y; headBone.rotation.x += head.x; headBone.rotation.z += head.z; }
    },
    dispose() { mixer.stopAllAction(); root.traverse((o) => { if (o.isMesh) { o.geometry.dispose?.(); } }); },
  };
  Object.assign(g.userData, api);
  return g;
}
