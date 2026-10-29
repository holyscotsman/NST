// actors.test.mjs — the garment cutter in actors.js. Clothes are shells cut from the body mesh, so the whole
// look depends on three properties: the cut lands exactly on the plane (a hem is a straight line), nothing
// outside the planes survives, and the opening (the neck) really is removed. Each has a control that must fail.
import './_three.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const THREE = await import('three');
const { garment } = await import('../src/shell/stage/actors.js');

// A tall tube (radius 0.2, y from 0 to 2) standing in for a torso, skinned to one bone.
function tube(segments = 8) {
  const geo = new THREE.CylinderGeometry(0.2, 0.2, 2, 24, segments, true); geo.translate(0, 1, 0);
  const n = geo.attributes.position.count;
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(n * 4), 4));
  const sw = new Float32Array(n * 4); for (let i = 0; i < n; i++) sw[i * 4] = 1;
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  const bone = new THREE.Bone();
  const mesh = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial());
  mesh.add(bone); mesh.bind(new THREE.Skeleton([bone]));
  return mesh;
}
const yRange = (m) => { const p = m.geometry.attributes.position; let lo = Infinity, hi = -Infinity; for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); } return [lo, hi]; };
const count = (m) => m.geometry.index.count / 3;
const triPoint = (m, t, k) => { const p = m.geometry.attributes.position, i = m.geometry.index.getX(t * 3 + k); return [p.getX(i), p.getY(i), p.getZ(i)]; };

test('a hem is cut exactly on its plane, not at the nearest triangle edge', () => {
  const body = tube();
  // 0.4 does not fall on any of the tube's own rings (they are every 0.25), so a centroid test would be ragged
  const g = garment(body, [{ axis: 1, min: 0.4 }, { axis: 1, max: 1.7 }], null, 0, new THREE.MeshBasicMaterial());
  const [lo, hi] = yRange(g);
  assert.ok(Math.abs(lo - 0.4) < 1e-6, `lower edge ${lo}`);
  assert.ok(Math.abs(hi - 1.7) < 1e-6, `upper edge ${hi}`);
});

test('[neg] with no planes the garment is the whole body, so the plane test above is not vacuous', () => {
  const g = garment(tube(), [], null, 0, new THREE.MeshBasicMaterial());
  const [lo, hi] = yRange(g);
  assert.ok(lo < 0.01 && hi > 1.99);
});

test('a garment skinned from the body keeps the body\'s bone data', () => {
  const g = garment(tube(), [{ axis: 1, max: 1 }], null, 0.01, new THREE.MeshBasicMaterial());
  assert.ok(g.isSkinnedMesh && g.geometry.attributes.skinIndex && g.geometry.attributes.skinWeight);
  const w = g.geometry.attributes.skinWeight; let sum = 0; for (let i = 0; i < w.count; i++) sum += w.getX(i);
  assert.ok(Math.abs(sum - w.count) < 1e-3, 'every vertex is still fully weighted to its bone');
});

test('inflating pushes the shell out along the normals', () => {
  const flat = garment(tube(), [], null, 0, new THREE.MeshBasicMaterial());
  const fat = garment(tube(), [], null, 0.05, new THREE.MeshBasicMaterial());
  const r = (m) => { const p = m.geometry.attributes.position; let mx = 0; for (let i = 0; i < p.count; i++) mx = Math.max(mx, Math.hypot(p.getX(i), p.getZ(i))); return mx; };
  assert.ok(Math.abs(r(fat) - r(flat) - 0.05) < 1e-3, `${r(flat)} -> ${r(fat)}`);
});

const area = (m) => {
  let A = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < count(m); t++) { a.fromArray(triPoint(m, t, 0)); b.fromArray(triPoint(m, t, 1)); c.fromArray(triPoint(m, t, 2)); A += b.sub(a).cross(c.sub(a)).length() / 2; }
  return A;
};

test('the neck opening removes the surface inside it and keeps the rest', () => {
  // (a fine mesh, as the real body is: the edge is found by interpolating along triangle edges, so its error is about
  // the square of the edge length)
  const whole = garment(tube(80), [], null, 0, new THREE.MeshBasicMaterial());
  const holed = garment(tube(80), [], (x, y) => Math.hypot(x, y - 1) - 0.15, 0, new THREE.MeshBasicMaterial());
  assert.ok(area(holed) < area(whole) * 0.97, `${area(holed)} vs ${area(whole)}`);
  assert.ok(area(holed) > area(whole) * 0.6, 'but not most of the garment');
  // nothing may remain inside the opening: every vertex is outside it (the edge is clipped along its curve)
  const p = holed.geometry.attributes.position; let inside = 0;
  for (let i = 0; i < p.count; i++) if (Math.hypot(p.getX(i), p.getY(i) - 1) < 0.15 - 2e-3) inside++;
  assert.equal(inside, 0, 'no vertex survives inside the opening');
});

test('smoothing softens a bumpy surface but leaves its open edges where they were', () => {
  // a tube with a bump in the middle: smoothing must reduce the bump, never move the cut edges
  const bump = tube(); const pos = bump.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) { if (Math.abs(pos.getY(i) - 1) < 0.2) { const k = 1.25; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); } }
  const raw = garment(bump, [{ axis: 1, min: 0.3 }, { axis: 1, max: 1.7 }], null, 0, new THREE.MeshBasicMaterial());
  const soft = garment(bump, [{ axis: 1, min: 0.3 }, { axis: 1, max: 1.7 }], null, 0, new THREE.MeshBasicMaterial(), { smooth: 8 });
  const maxR = (m) => { const p = m.geometry.attributes.position; let r = 0; for (let i = 0; i < p.count; i++) r = Math.max(r, Math.hypot(p.getX(i), p.getZ(i))); return r; };
  assert.ok(maxR(soft) < maxR(raw) - 0.005, `${maxR(raw)} -> ${maxR(soft)}`);
  const lo = (m) => { const p = m.geometry.attributes.position; let y = Infinity; for (let i = 0; i < p.count; i++) y = Math.min(y, p.getY(i)); return y; };
  assert.ok(Math.abs(lo(soft) - 0.3) < 0.02, 'the hem stayed within the extra inflate of where it was cut (it is not pulled in by smoothing)');
});

test('a plane that excludes the whole body leaves an empty garment rather than throwing', () => {
  const g = garment(tube(), [{ axis: 1, min: 5 }], null, 0, new THREE.MeshBasicMaterial());
  assert.equal(count(g), 0);
});
