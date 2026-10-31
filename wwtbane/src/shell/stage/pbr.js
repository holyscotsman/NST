// pbr.js — real surface textures (CC0 sets from ambientCG, see assets/textures/ATTRIBUTIONS.md) for the set's materials.
//
// pbr(material, 'steel', { repeat: [1, 2] }) starts loading a set's colour, normal and roughness maps and hangs them on
// an existing MeshStandardMaterial as they arrive. The material is usable straight away (it is just its plain self until
// the maps land) and, if the files cannot be loaded, it stays that way: nothing here can break the set. ?textures=0
// switches every set off for diagnosis.
import * as THREE from 'three';

const ROOT = new URL('../../../assets/textures/', import.meta.url).href;
const cache = new Map();
const enabled = () => { try { return !/[?&]textures=0/.test(window.location.search); } catch { return true; } };

function load(url, srgb) {
  const key = url;
  if (cache.has(key)) return cache.get(key);
  const p = new Promise((resolve) => {
    new THREE.TextureLoader().load(url, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      resolve(t);
    }, undefined, () => resolve(null));
  });
  cache.set(key, p);
  return p;
}

// One loaded texture shared by every material that uses it; each material gets its own repeat through a clone.
async function tex(set, kind, srgb, repeat) {
  const t = await load(`${ROOT}${set}/${kind}.webp`, srgb);
  if (!t) return null;
  const c = t.clone(); c.needsUpdate = true; c.repeat.set(repeat[0], repeat[1]);
  return c;
}

// opts: repeat [x, y]; color (multiplies the colour map, to darken or tint a bright set); rough (replaces roughness,
// which the roughness map then scales); metal; normalScale; map: false for normal + roughness only.
export function pbr(material, set, { repeat = [1, 1], color, rough, metal, normalScale = 0.8, map = true } = {}) {
  if (!enabled()) return material;
  if (color !== undefined) material.color.set(color);
  if (rough !== undefined) material.roughness = rough;
  if (metal !== undefined) material.metalness = metal;
  (async () => {
    const [m, n, r] = await Promise.all([map ? tex(set, 'color', true, repeat) : null, tex(set, 'normal', false, repeat), tex(set, 'rough', false, repeat)]);
    if (m) material.map = m;
    if (n) { material.normalMap = n; material.normalScale.set(normalScale, normalScale); }
    if (r) material.roughnessMap = r;
    material.needsUpdate = true;
  })().catch(() => { /* keep the plain material */ });
  return material;
}

// The raw colour map of a set, for shaders that sample it themselves (the deck). Resolves to null on failure.
export function pbrTexture(set, kind = 'color', repeat = [1, 1]) {
  if (!enabled()) return Promise.resolve(null);
  return tex(set, kind, kind === 'color', repeat);
}
