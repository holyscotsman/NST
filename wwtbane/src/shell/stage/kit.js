// kit.js — the palette and the tiny geometry/material builders every part of
// the stage shares. Nothing here knows about the studio.
import * as THREE from 'three';

export const PAL = { iris: 0x7855FA, aqua: 0x1FDDE9, mantis: 0x92DD23, peach: 0xFF9178, gold: 0xFFC857 };

export function mat(color, emissive, ei = 0, rough = 0.6, metal = 0.1) {
  return new THREE.MeshStandardMaterial({ color, emissive: emissive ?? 0x000000, emissiveIntensity: ei, roughness: rough, metalness: metal });
}
export function cyl(rt, rb, h, m) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24), m); }
export function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
export function sph(r, m) { return new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), m); }
export function pos(m, x, y, z) { m.position.set(x, y, z); return m; }
export function castShadows(group) { group.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }


// Merge any number of geometries into one non-indexed buffer (position +
// normal) — the audience bodies and chairs each draw as a single instanced mesh.
export function mergeGeos(...geos) {
  const parts = geos.map((g) => g.toNonIndexed());
  const posLen = parts.reduce((n, g) => n + g.attributes.position.array.length, 0);
  const pos_ = new Float32Array(posLen);
  const nor = new Float32Array(posLen);
  let off = 0;
  for (const g of parts) {
    pos_.set(g.attributes.position.array, off);
    nor.set(g.attributes.normal.array, off);
    off += g.attributes.position.array.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos_, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}


// A fresnel rim: adds `color` to the emissive term in proportion to how edge-on
// the surface is to the camera. Standard-material lighting alone leaves talent
// and crowd as flat dark shapes against a dark room; a thin bright edge in the
// mood colour is what separates them, and it is what makes a character read as
// designed rather than rendered. `color` is held by reference, so the accent's
// easing recolours every rim in the room with no per-frame work.
export function rimLit(material, color, { power = 2.6, strength = 0.9 } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: color };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor; uniform float uRimPower, uRimStrength;')
      .replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n'
        + '  float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), uRimPower);\n'
        + '  totalEmissiveRadiance += uRimColor * rimF * uRimStrength;');
  };
  material.customProgramCacheKey = () => 'rim' + power + ':' + strength;
  return material;
}
