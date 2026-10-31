// spriteActors.js — HD-2D people: pixel-art figures standing upright in the 3D studio.
//
// Each person is a flat card that always faces the camera, showing one cell of a pixel-art sheet (assets/hd2d/people/,
// drawn with pxl by tools/hd2d/people.px.js: one row per pose, one column per frame, 38x62 px a cell). The card is lit by
// the studio's own lights and casts a shadow, which is what makes them sit in the set instead of on top of it.
//
// A sprite actor has exactly the interface of createActor() in actors.js (react, update, pose, recolor, play, seatOn), so
// studio.js and the set builders drive both alike. loadPeople() picks the kit: sprites by default, the rigged 3D bodies
// with ?people=3d, the original procedural capsules with ?people=procedural.
import * as THREE from 'three';
import { loadActorKit, createActor } from './actors.js';
import { LOOKS, pickLook } from './looks.js';
import { loadVoxelKit, createVoxelActor } from './voxelActors.js';

const ROOT = new URL('../../../assets/hd2d/people/', import.meta.url).href;
const POSES = ['idle', 'talk', 'cheer', 'wave', 'worry'];
const FRAMES = { idle: 2, talk: 2, cheer: 2, wave: 2, worry: 1 };
const FPS = { idle: 2, talk: 6, cheer: 6, wave: 6, worry: 1 };
const CELL_W = 38, CELL_H = 62, COLS = 2, ROWS = POSES.length;
const PIXEL = 0.0315;                 // metres a sprite pixel covers in the world
const FEET = 3;                       // empty rows under the shoes in a cell
const SEATED_ROWS = 44;               // rows kept when seated (head to hips; the desk or sofa hides the rest)

let kitPromise = null;

// Loads (once) every sheet. Resolves to null if any is missing (offline, blocked): the caller falls back.
export function loadSpriteKit() {
  if (!kitPromise) {
    kitPromise = (async () => {
      const loader = new THREE.TextureLoader();
      const sheets = {};
      await Promise.all(LOOKS.map(async (look) => {
        const t = await loader.loadAsync(`${ROOT}${look}.png`);
        t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
        sheets[look] = t;
      }));
      return { sheets };
    })().catch((e) => { console.warn('[wwtbane] sprite people unavailable', e); return null; });
  }
  return kitPromise;
}

const _p = new THREE.Vector3();

// opts: look, seated, scale (see pickLook). Same shape as createActor's group.
export function createSpriteActor(kit, opts = {}) {
  const look = pickLook(opts), seated = !!opts.seated;
  const tex = kit.sheets[look].clone(); tex.needsUpdate = true;
  const rows = seated ? SEATED_ROWS : CELL_H;
  const h = rows * PIXEL, w = CELL_W * PIXEL;
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.38 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  mesh.frustumCulled = false;
  // feet on the group's origin (standing); seated, the lower edge is the hips and seatOn() sets the height
  mesh.position.y = seated ? h / 2 : h / 2 - FEET * PIXEL;
  const g = new THREE.Group(); g.add(mesh);

  let pose = 'idle', frame = 0, clock = 0, base = 0, walking = false, waving = false, bobPhase = Math.random() * 6;
  const apply = () => {
    const r = POSES.indexOf(pose), fr = Math.min(frame, FRAMES[pose] - 1);
    tex.repeat.set(1 / COLS, (rows / CELL_H) / ROWS);
    tex.offset.set(fr / COLS, 1 - r / ROWS - tex.repeat.y);   // the sheet's v runs up from the bottom
    if (mesh.customDepthMaterial.map) mesh.customDepthMaterial.map = tex;
  };
  const set = (p) => { if (p !== pose) { pose = p; frame = 0; clock = 0; apply(); } };
  apply();

  // Face the camera (about the vertical axis only, so the figure stays upright). Shadow passes face their own light.
  mesh.onBeforeRender = (_r, _s, camera) => {
    mesh.getWorldPosition(_p);
    const parentYaw = g.rotation.y;
    mesh.rotation.y = Math.atan2(camera.position.x - _p.x, camera.position.z - _p.z) - parentYaw;
  };

  const api = {
    skeletal: true, sprite: true, look, parts: null,
    play(name) { walking = /walk/i.test(name || ''); g.userData.clip = name; },
    // the crowd stand-in waves an arm: any call this frame shows the waving pose
    pose() { waving = true; },
    recolor({ top, tone } = {}) {
      const c = new THREE.Color(1, 1, 1);
      if (top !== undefined) c.lerp(new THREE.Color(top), 0.55);
      if (tone !== undefined) c.multiplyScalar(Math.max(0.6, Math.min(1.3, 0.55 + tone * 0.45)));
      mat.color.copy(c);
    },
    seatOn(seatY) { g.position.y += seatY; },
    react({ t, phase = 0, talking = false, mood = null, cheers = false }) {
      let want = talking ? 'talk' : 'idle';
      if (mood) {
        const env = Math.max(0, Math.min(1, mood.t / 0.35, (mood.total - mood.t) / 0.35));
        if (env > 0.05) want = mood.kind === 'happy' ? (cheers ? 'cheer' : 'talk') : 'worry';
      }
      set(want);
      base = Math.sin(t * 0.9 + phase) * 0.004;
    },
    update(dt) {
      if (waving) { set('wave'); waving = false; }
      clock += dt;
      const n = FRAMES[pose], f = Math.floor(clock * FPS[pose]) % n;
      if (f !== frame) { frame = f; apply(); }
      bobPhase += dt * (walking ? 9 : 2);
      mesh.position.y = (seated ? h / 2 : h / 2 - FEET * PIXEL) + base + (walking ? Math.abs(Math.sin(bobPhase)) * 0.05 : 0);
    },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); mesh.customDepthMaterial.dispose(); },
  };
  Object.assign(g.userData, api);
  return g;
}

// The crowd: one card per seat (an InstancedMesh draws them all), seated crop, facing the way its seat faces. Each seat's
// colour tints the sprite, so a dark muted palette per seat varies the room. Two looks (men / women) and a slow two-frame
// bob, flipped out of step between the two so the room is never in lockstep.
export function crowdSprites(kit, look) {
  const tex = kit.sheets[look].clone(); tex.needsUpdate = true;
  const scale = 0.0216, rows = SEATED_ROWS;
  const geometry = new THREE.PlaneGeometry(CELL_W * scale, rows * scale); geometry.translate(0, 0.78 + (rows * scale) / 2, 0.02);
  const material = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45 });
  // the seat's tint colours the glow too (the glow is most of what a dim crowd is lit by)
  material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance *= vColor;\n#endif'); };
  tex.repeat.set(1 / COLS, (rows / CELL_H) / ROWS);
  const flip = (frame) => { tex.offset.set((frame % COLS) / COLS, 1 - tex.repeat.y); };
  flip(0);
  return { geometry, material, flip };
}

// The people a set builder should use: { kind, create(opts) } or null (use the procedural capsules).
//   default             voxel people (assets/voxel/people, built with kiln)
//   ?people=sprite      pixel-art cards (assets/hd2d/people)
//   ?people=3d          the rigged bodies of v2.89-2.91
//   ?people=procedural  the original capsules
export async function loadPeople() {
  const q = typeof window !== 'undefined' ? window.location.search : '';
  if (/[?&]people=procedural/.test(q)) return null;
  const rigged = async () => { const kit = await loadActorKit(); return kit ? { kind: '3d', create: (o) => createActor(kit, o) } : null; };
  if (/[?&]people=3d/.test(q)) return rigged();
  if (/[?&]people=sprite/.test(q)) { const kit = await loadSpriteKit(); return kit ? { kind: 'sprite', create: (o) => createSpriteActor(kit, o) } : rigged(); }
  const vox = await loadVoxelKit();
  if (vox) return { kind: 'voxel', create: (o) => createVoxelActor(vox, o) };
  const sprites = await loadSpriteKit();                  // voxels unavailable: fall back to sprites, then the 3D people
  if (sprites) return { kind: 'sprite', create: (o) => createSpriteActor(sprites, o) };
  return rigged();
}
