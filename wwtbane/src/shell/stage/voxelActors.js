// voxelActors.js — voxel people for the stage.
//
// Each person is a figure built from 2.5 cm voxels with kiln (tools/voxel/people.kx.js; the GLBs are in
// assets/voxel/people/): a head with a face, hair and ears, a clothed torso, two arms and two legs, as six named parts
// that rotate about their joints. Posing is done here, in code, by turning those parts, so the studio drives a voxel
// person exactly as it drives the rigged ones (react, update, pose, recolor, play, seatOn; see actors.js).
//
// Each part's material pieces are merged into one mesh with vertex colours, so a person is six draw calls, and the
// faces are shaded flat (the shader derives the normals), which is what gives voxels their crisp look under the stage
// lights. loadVoxelKit() resolves to null on any failure and the set falls back to the sprites or the rigged people.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LOOKS, pickLook } from './looks.js';

const ROOT = new URL('../../../assets/voxel/people/', import.meta.url).href;
const PARTS = ['legL', 'legR', 'shinL', 'shinR', 'torso', 'head', 'armL', 'armR'];
const HIP_Y = 0.9;                      // where the legs and torso meet, in metres (the figure is about 1.8 m tall)

let kitPromise = null;

// One vertex-coloured geometry from every primitive directly under a node (each primitive's material colour is baked
// into its vertices); null if there are none. The primitives are left where they are.
export function mergeNodeGeometry(node) {
  const meshes = node.children.filter((c) => c.isMesh);
  if (!meshes.length) return null;
  const geos = meshes.map((m) => {
    const g = m.geometry.clone(), c = m.material.color || new THREE.Color(1, 1, 1), n = g.attributes.position.count;
    const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'color') g.deleteAttribute(k);
    return g;
  });
  return mergeGeometries(geos, false);
}

// Replace a part node's primitives with one merged vertex-coloured mesh.
function bake(node) {
  const meshes = node.children.filter((c) => c.isMesh);
  const merged = mergeNodeGeometry(node);
  if (!merged) return;
  for (const m of meshes) { node.remove(m); m.material.dispose?.(); }
  const mesh = new THREE.Mesh(merged, null); mesh.name = node.name + '.mesh';
  node.add(mesh);
}

export function loadVoxelKit() {
  if (!kitPromise) {
    kitPromise = (async () => {
      const L = new GLTFLoader();
      const looks = {};
      await Promise.all(LOOKS.map(async (look) => {
        const gltf = await L.loadAsync(`${ROOT}${look}.glb`);
        const root = gltf.scene.children[0] || gltf.scene;
        const parts = {};
        root.traverse((o) => { const m = /(legL|legR|shinL|shinR|torso|head|armL|armR)$/.exec(o.name); if (m) { bake(o); parts[m[1]] = o; } });
        if (PARTS.some((p) => !parts[p])) throw new Error(`voxel ${look}: missing parts`);
        looks[look] = root;
      }));
      return { looks };
    })().catch((e) => { console.warn('[wwtbane] voxel people unavailable', e); return null; });
  }
  return kitPromise;
}

const ease = (cur, want, k) => cur + (want - cur) * k;

// opts: look, seated (see pickLook in looks.js). Same shape as createActor's group.
export function createVoxelActor(kit, opts = {}) {
  const look = pickLook(opts), seated = !!opts.seated;
  const root = kit.looks[look].clone(true);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0.02 });
  const P = {};
  root.traverse((o) => {
    const m = /(legL|legR|shinL|shinR|torso|head|armL|armR)$/.exec(o.name); if (m) P[m[1]] = o;
    if (o.isMesh) { o.material = mat; o.castShadow = true; o.receiveShadow = true; }
  });
  const g = new THREE.Group(); g.add(root);
  const rest = {}; for (const k of PARTS) rest[k] = P[k].position.clone();

  // current and wanted joint angles, eased every frame
  const cur = { aLz: 0.06, aRz: -0.06, aLx: 0, aRx: 0, torsoZ: 0, headX: 0, headY: 0, bounce: 0 };
  const want = { ...cur }; let pose = 'idle', t = 0, phase = 0, glance = 0.13, waving = false, walking = false, walk = 0;

  // the wanted angles for the current pose (re-derived every frame so the motion is a function of time)
  const aim = () => {
    const w = want; w.aLz = 0.06; w.aRz = -0.06; w.aLx = 0; w.aRx = 0; w.headX = 0; w.bounce = 0;
    switch (pose) {
      case 'talk': w.aRx = -0.9 + Math.sin(t * 6) * 0.35; w.aRz = -0.25; w.headX = Math.sin(t * 7) * 0.06; break;
      case 'cheer': w.aLz = 2.55 + Math.sin(t * 9) * 0.2; w.aRz = -2.55 - Math.sin(t * 9 + 1) * 0.2; w.bounce = Math.abs(Math.sin(t * 9)) * 0.05; w.headX = -0.12; break;
      case 'wave': w.aRz = -2.4 + Math.sin(t * 8) * 0.35; break;
      case 'worry': w.aRx = -1.95; w.aRz = 0.25; w.headX = 0.2; break;
      default: break;
    }
  };

  if (seated) { P.legL.rotation.x = -Math.PI / 2; P.legR.rotation.x = -Math.PI / 2; P.legL.rotation.z = -0.05; P.legR.rotation.z = 0.05; P.shinL.rotation.x = Math.PI / 2; P.shinR.rotation.x = Math.PI / 2; }   // thighs forward, shins hanging

  const api = {
    skeletal: true, voxel: true, look, parts: null, rest: opts.rest, talk: opts.talk,
    play(name) { walking = /walk/i.test(name || ''); g.userData.clip = name; },
    pose() { waving = true; },                                    // the crowd stand-in waves an arm
    recolor({ top, tone } = {}) {
      const c = new THREE.Color(1, 1, 1);
      if (top !== undefined) c.lerp(new THREE.Color(top), 0.5);
      if (tone !== undefined) c.multiplyScalar(Math.max(0.6, Math.min(1.3, 0.55 + tone * 0.45)));
      mat.color.copy(c);
    },
    // sit the hips on a cushion: `seatY` is the cushion's top in the parent's space
    seatOn(seatY) { g.position.y += seatY + 0.07 - HIP_Y; },
    react({ t: time, phase: ph = 0, talking = false, mood = null, glance: gl = 0.13, cheers = false }) {
      let p = talking ? 'talk' : 'idle';
      if (mood) {
        const env = Math.max(0, Math.min(1, mood.t / 0.35, (mood.total - mood.t) / 0.35));
        if (env > 0.05) p = mood.kind === 'happy' ? (cheers ? 'cheer' : 'talk') : 'worry';
      }
      pose = p; phase = ph; glance = gl;
      cur.headY = Math.sin(time * 0.35 + ph) * gl + Math.sin(time * 1.27 + ph * 2) * 0.02;
    },
    update(dt) {
      t += dt;
      if (waving) { pose = 'wave'; waving = false; }
      aim();
      const k = 1 - Math.exp(-dt * 9);
      for (const key of ['aLz', 'aRz', 'aLx', 'aRx', 'headX', 'bounce']) cur[key] = ease(cur[key], want[key], k);
      const breath = Math.sin(t * 1.8 + phase) * 0.006;
      P.armL.rotation.z = cur.aLz + breath; P.armR.rotation.z = cur.aRz - breath;
      P.armL.rotation.x = cur.aLx; P.armR.rotation.x = cur.aRx;
      P.head.rotation.x = cur.headX + Math.sin(t * 1.1 + phase) * 0.02; P.head.rotation.y = cur.headY;
      P.torso.scale.y = 1 + breath * 0.8; P.torso.position.y = rest.torso.y + cur.bounce;
      if (walking && !seated) {
        walk += dt * 7;
        P.legL.rotation.x = Math.sin(walk) * 0.55; P.legR.rotation.x = -Math.sin(walk) * 0.55;
        P.shinL.rotation.x = Math.max(0, -Math.sin(walk)) * 0.7; P.shinR.rotation.x = Math.max(0, Math.sin(walk)) * 0.7;
        P.armL.rotation.x = -Math.sin(walk) * 0.45; P.armR.rotation.x = Math.sin(walk) * 0.45;
      } else if (!seated) { P.legL.rotation.x = 0; P.legR.rotation.x = 0; P.shinL.rotation.x = 0; P.shinR.rotation.x = 0; }
    },
    dispose() { mat.dispose(); },
  };
  Object.assign(g.userData, api);
  return g;
}

// A voxel prop (assets/voxel/set/<name>.glb, built with kiln) as one vertex-coloured geometry, or null if it cannot be
// loaded. Cached, so every user of a prop shares one download.
const props = new Map();
export function loadVoxelProp(name) {
  if (!props.has(name)) {
    props.set(name, new GLTFLoader().loadAsync(new URL(`../../../assets/voxel/set/${name}.glb`, import.meta.url).href).then((gltf) => {
      let node = null; gltf.scene.traverse((o) => { if (!node && o.children.some((c) => c.isMesh)) node = o; });
      return node ? mergeNodeGeometry(node) : null;
    }).catch((e) => { console.warn(`[wwtbane] voxel prop ${name} unavailable`, e); return null; }));
  }
  return props.get(name);
}
