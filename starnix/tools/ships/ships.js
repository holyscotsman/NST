// ships.js — the StarNix ships, rocks and station as real 3D models (three.js geometry, loom PBR textures), built for
// render.html, which lights them and writes the sprite images the games draw. Every model points along +X, with its
// top toward +Y and its wings along Z.
import * as THREE from 'three';

const TAU = Math.PI * 2;

// ---- materials ----
export async function loadMaterials(base) {
  const L = new THREE.TextureLoader();
  const get = (name, kind, srgb) => new Promise((res) => L.load(`${base}/${name}/${name}_${kind}.png`, (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)));
  const set = async (name, { repeat = [1, 1], emissiveIntensity = 1.2, color = 0xffffff } = {}) => {
    const [map, normalMap, orm, emissiveMap] = await Promise.all([get(name, 'albedo', true), get(name, 'normal', false), get(name, 'orm', false), get(name, 'emissive', true)]);
    for (const t of [map, normalMap, orm, emissiveMap]) if (t) t.repeat.set(repeat[0], repeat[1]);
    return new THREE.MeshStandardMaterial({ color, map, normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, emissive: 0xffffff, emissiveMap, emissiveIntensity });
  };
  const paint = (color, { metal = 0.55, rough = 0.32, emissive = 0x000000, ei = 0 } = {}) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, emissive, emissiveIntensity: ei });
  const glass = (color, emissive) => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.08, emissive, emissiveIntensity: 1.4 });
  const glow = (color, ei = 2.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: ei });
  return {
    steel: await set('hull_steel', { color: 0xdddde8 }), iris: await set('hull_iris', { color: 0xe8e0ff }), red: await set('hull_red', { color: 0xffe8e0 }),
    cream: await set('hull_cream'), gold: await set('gold', { emissiveIntensity: 0 }), rock: await set('rock', { repeat: [1.6, 1.6], emissiveIntensity: 0, color: 0x9a948c }),
    dark: paint(0x1a1c24, { metal: 0.8, rough: 0.4 }), irisPaint: paint(0x6a52e8, { metal: 0.5, rough: 0.3 }), redPaint: paint(0xd1473d, { metal: 0.5, rough: 0.3 }),
    aquaGlass: glass(0x66e8ff, 0x1fb8d8), greenGlow: glow(0x92dd23), aquaGlow: glow(0x1fdde9), orangeGlow: glow(0xff8a2a, 3), goldGlow: glow(0xffc857, 3), redGlow: glow(0xff4a3a, 2.6),
    blueCell: paint(0x1b2f78, { metal: 0.7, rough: 0.25, emissive: 0x2a5aff, ei: 0.35 }),
  };
}

// ---- small helpers ----
const mesh = (g, m, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) => { const o = new THREE.Mesh(g, m); o.position.set(...pos); o.rotation.set(...rot); o.scale.set(...scale); return o; };
// a body of revolution along +X from a profile of [x, radius] pairs
function lathe(profile, seg = 40) {
  const pts = profile.map(([x, r]) => new THREE.Vector2(r, x));
  const g = new THREE.LatheGeometry(pts, seg); g.rotateZ(-Math.PI / 2); return g;
}
// a flat plate in the XZ plane from [x, z] points, thickness along Y, with a bevel
function plate(points, thick = 0.05, bevel = 0.015) {
  const s = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, -thick / 2, 0); return g;     // shape XY -> XZ, centred on y = 0
}
// a plate in the XY plane (a fin standing up), thickness along Z
function fin(points, thick = 0.04, bevel = 0.012) {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
  g.translate(0, 0, -thick / 2); return g;
}
const mirrorZ = (g) => { const m = g.clone(); m.scale(1, 1, -1); const i = m.index; if (i) { const a = i.array; for (let k = 0; k < a.length; k += 3) { const t = a[k]; a[k] = a[k + 1]; a[k + 1] = t; } } return m; };
function exhaust(M, x, y, z, r, mat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 1.25, r * 2.2, 20), M.dark, [x, y, z], [0, 0, Math.PI / 2]));
  g.add(mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, r * 0.3, 20), mat, [x - r * 1.1, y, z], [0, 0, Math.PI / 2]));
  return g;
}

// ---- the heroes ----
export function talon(M) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[-1.0, 0.0], [-0.98, 0.14], [-0.7, 0.21], [-0.1, 0.25], [0.5, 0.2], [0.9, 0.11], [1.18, 0.03], [1.22, 0]]), M.steel));
  const wing = plate([[0.45, 0.16], [-0.35, 1.05], [-0.72, 1.05], [-0.5, 0.2]], 0.05, 0.014);
  g.add(mesh(wing, M.iris, [0, -0.02, 0], [0.06, 0, 0])); g.add(mesh(mirrorZ(wing), M.iris, [0, -0.02, 0], [-0.06, 0, 0]));
  const canard = plate([[0.78, 0.12], [0.5, 0.5], [0.4, 0.5], [0.5, 0.12]], 0.035, 0.01);
  g.add(mesh(canard, M.irisPaint)); g.add(mesh(mirrorZ(canard), M.irisPaint));
  g.add(mesh(fin([[-0.5, 0.15], [-0.95, 0.62], [-1.0, 0.62], [-0.9, 0.15]], 0.04, 0.01), M.iris));
  g.add(mesh(new THREE.SphereGeometry(0.2, 28, 18), M.aquaGlass, [0.32, 0.17, 0], [0, 0, 0], [1.9, 0.62, 0.8]));
  for (const z of [-0.12, 0.12]) g.add(exhaust(M, -1.02, 0.0, z, 0.1, M.aquaGlow));
  for (const z of [-0.62, 0.62]) { g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12), M.dark, [0.34, -0.06, z], [0, 0, Math.PI / 2])); g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), M.goldGlow, [0.7, -0.06, z], [0, 0, Math.PI / 2])); }
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.012, 0.05), M.redPaint, [0.05, 0.255, 0]));
  return g;
}

export function aegis(M) {
  const g = new THREE.Group();
  const hull = plate([[1.0, 0.0], [0.82, 0.42], [-0.2, 0.55], [-0.95, 0.48], [-1.05, 0.2], [-1.05, -0.2], [-0.95, -0.48], [-0.2, -0.55], [0.82, -0.42]], 0.34, 0.07);
  g.add(mesh(hull, M.steel));
  g.add(mesh(plate([[0.7, 0], [0.45, 0.3], [-0.5, 0.34], [-0.75, 0.15], [-0.75, -0.15], [-0.5, -0.34], [0.45, -0.3]], 0.2, 0.05), M.iris, [0, 0.27, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.17, 24, 16), M.aquaGlass, [0.35, 0.4, 0], [0, 0, 0], [1.6, 0.7, 1]));
  const pod = plate([[0.2, 0.55], [-0.6, 0.95], [-0.95, 0.95], [-0.8, 0.5]], 0.22, 0.05);
  g.add(mesh(pod, M.iris, [0, -0.04, 0])); g.add(mesh(mirrorZ(pod), M.iris, [0, -0.04, 0]));
  for (const z of [-0.78, 0.78]) g.add(exhaust(M, -0.98, -0.04, z, 0.13, M.aquaGlow));
  for (const z of [-0.2, 0.2]) g.add(exhaust(M, -1.08, 0.0, z, 0.1, M.aquaGlow));
  for (const [R, r, x] of [[0.5, 0.035, 1.0], [0.6, 0.02, 1.08]]) g.add(mesh(new THREE.TorusGeometry(R, r, 12, 64, Math.PI * 1.1), M.greenGlow, [x, 0, 0], [0, 1.2, Math.PI / 2]));
  for (const z of [-0.3, 0.3]) g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 12), M.dark, [0.85, 0.18, z], [0, 0, Math.PI / 2]));
  return g;
}

export function mender(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.5, 40, 28), M.cream, [0, 0, 0], [0, 0, 0], [2.1, 0.62, 1.0]));
  g.add(mesh(new THREE.SphereGeometry(0.3, 28, 20), M.aquaGlass, [0.38, 0.22, 0], [0, 0, 0], [1.6, 0.8, 1.0]));
  g.add(mesh(new THREE.TorusGeometry(0.64, 0.035, 12, 64), M.steel, [-0.1, 0, 0], [0.5, 1.0, 0.0], [1, 1, 1]));
  const cross = new THREE.Group();
  cross.add(mesh(new THREE.BoxGeometry(0.09, 0.012, 0.34), M.greenGlow)); cross.add(mesh(new THREE.BoxGeometry(0.34, 0.012, 0.09), M.greenGlow));
  cross.position.set(-0.3, 0.382, 0); g.add(cross);
  for (const z of [-0.42, 0.42]) { g.add(mesh(new THREE.CapsuleGeometry(0.09, 0.62, 8, 16), M.steel, [-0.6, -0.1, z], [0, 0, Math.PI / 2])); g.add(exhaust(M, -1.0, -0.1, z, 0.085, M.aquaGlow)); }
  g.add(mesh(new THREE.CylinderGeometry(0.005, 0.03, 0.4, 8), M.dark, [0.0, 0.5, 0], [0, 0, 0.2]));
  g.add(mesh(new THREE.SphereGeometry(0.04, 12, 8), M.greenGlow, [-0.03, 0.7, 0]));
  return g;
}

// ---- the BCM ----
export function raider(M) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[-0.9, 0.0], [-0.88, 0.12], [-0.5, 0.2], [0.2, 0.17], [0.8, 0.09], [1.2, 0.02], [1.25, 0]]), M.red));
  const blade = plate([[0.3, 0.14], [-0.5, 0.95], [-0.95, 1.05], [-0.62, 0.16]], 0.04, 0.012);
  g.add(mesh(blade, M.dark, [0, 0, 0], [0.12, 0, 0])); g.add(mesh(mirrorZ(blade), M.dark, [0, 0, 0], [-0.12, 0, 0]));
  const edge = plate([[0.3, 0.14], [-0.5, 0.95], [-0.52, 0.9], [0.22, 0.14]], 0.045, 0.01);
  g.add(mesh(edge, M.redGlow, [0, 0.005, 0], [0.12, 0, 0])); g.add(mesh(mirrorZ(edge), M.redGlow, [0, 0.005, 0], [-0.12, 0, 0]));
  g.add(mesh(fin([[-0.4, 0.15], [-0.9, 0.5], [-0.95, 0.15]], 0.035), M.dark));
  g.add(mesh(new THREE.SphereGeometry(0.12, 20, 14), M.orangeGlow, [0.35, 0.12, 0], [0, 0, 0], [1.5, 0.7, 0.8]));
  for (const z of [-0.1, 0.1]) g.add(exhaust(M, -0.95, 0, z, 0.075, M.orangeGlow));
  return g;
}

export function warship(M) {
  const g = new THREE.Group();
  g.add(mesh(plate([[1.2, 0], [0.9, 0.7], [-0.3, 0.95], [-1.1, 0.8], [-1.3, 0.3], [-1.3, -0.3], [-1.1, -0.8], [-0.3, -0.95], [0.9, -0.7]], 0.5, 0.09), M.red));
  g.add(mesh(plate([[0.8, 0], [0.5, 0.45], [-0.5, 0.55], [-0.9, 0.3], [-0.9, -0.3], [-0.5, -0.55], [0.5, -0.45]], 0.3, 0.07), M.steel, [0, 0.38, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.42, 0.34), M.dark, [-0.2, 0.75, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.06, 0.28), M.orangeGlow, [-0.2, 0.9, 0]));
  for (const z of [-0.62, 0.62]) { g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.95, 16), M.dark, [0.85, 0.12, z], [0, 0, Math.PI / 2])); g.add(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 16), M.goldGlow, [1.34, 0.12, z], [0, 0, Math.PI / 2])); }
  for (const z of [-0.8, 0, 0.8]) g.add(exhaust(M, -1.32, 0, z, 0.2, M.goldGlow));
  g.add(mesh(new THREE.BoxGeometry(1.8, 0.02, 0.1), M.redGlow, [0.1, 0.27, 0]));
  return g;
}

// ---- rocks ----
export function rock(M, seed) {
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const p = geo.attributes.position, v = new THREE.Vector3();
  const rnd = (i) => { const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const lump = (x, y, z) => Math.sin(x * 2.1 + seed) * Math.cos(y * 2.3 + seed * 2) * 0.22 + Math.sin(z * 3.7 + seed * 3) * 0.12 + Math.sin((x + y) * 6.1 + seed) * 0.05;
  // a few craters: dents along random directions
  const craters = Array.from({ length: 7 }, (_, i) => ({ d: new THREE.Vector3(rnd(i) - 0.5, rnd(i + 9) - 0.5, rnd(i + 19) - 0.5).normalize(), r: 0.28 + rnd(i + 29) * 0.22, depth: 0.1 + rnd(i + 39) * 0.1 }));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + lump(v.x, v.y, v.z);
    for (const c of craters) { const a = Math.acos(Math.min(1, v.dot(c.d))); if (a < c.r) r -= c.depth * (1 - Math.pow(a / c.r, 2)) * (a < c.r * 0.85 ? 1 : (c.r - a) / (c.r * 0.15)); }
    // an irregular silhouette
    const sx = 1.0 + (seed % 3) * 0.08, sy = 0.82 + (seed % 2) * 0.1, sz = 0.92;
    v.multiplyScalar(r); p.setXYZ(i, v.x * sx, v.y * sy, v.z * sz);
  }
  geo.computeVertexNormals();
  // box-projected-ish UVs from the position, so the texture does not smear
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv[i * 2] = v.x * 0.9 + v.z * 0.4 + 0.5; uv[i * 2 + 1] = v.y * 0.9 + v.z * 0.4 + 0.5; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return mesh(geo, M.rock);
}

// ---- the Acropolis station ----
export function station(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(1.1, 0.16, 20, 96), M.steel, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(1.1, 0.03, 10, 96), M.aquaGlow, [0, 0.17, 0], [Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4; g.add(mesh(new THREE.BoxGeometry(2.0, 0.07, 0.1), M.steel, [0, 0, 0], [0, a + Math.PI / 4, 0])); }
  g.add(mesh(lathe([[-0.9, 0.0], [-0.9, 0.3], [-0.5, 0.36], [0.0, 0.3], [0.3, 0.2], [0.8, 0.12], [1.55, 0.03], [1.62, 0]].map(([y, r]) => [y, r])).rotateZ(Math.PI / 2), M.iris, [0, 0.0, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.2, 20, 14), M.aquaGlow, [0, 0.9, 0]));
  for (const x of [-1.9, 1.9]) { g.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.7), M.blueCell, [x, 0, 0])); g.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), M.steel, [x * 0.72, 0, 0])); }
  const win = new THREE.BoxGeometry(0.05, 0.03, 0.05);
  for (let i = 0; i < 40; i++) { const a = i * TAU / 40; g.add(mesh(win, i % 3 ? M.aquaGlow : M.goldGlow, [Math.cos(a) * 1.1, 0.175, Math.sin(a) * 1.1])); }
  return g;
}

// Box-projected UVs: every triangle takes its texture coordinates from the plane its normal faces most, so plated hull
// textures keep their shape on extruded sides and lathed bodies (which otherwise smear). `scale`: texture tiles per unit.
export function boxProject(root, scale = 1.0) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.map) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, uv = new Float32Array(p.count * 2), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.crossVectors(b.clone().sub(a), c.clone().sub(a));
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      for (let k = 0; k < 3; k++) {
        const v = [a, b, c][k];
        const [u, w] = ax >= ay && ax >= az ? [v.z, v.y] : ay >= az ? [v.x, v.z] : [v.x, v.y];
        uv[(i + k) * 2] = u * scale; uv[(i + k) * 2 + 1] = w * scale;
      }
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); o.geometry = g;
  });
  return root;
}

export const MODELS = { talon, aegis, mender, raider, warship, station };
