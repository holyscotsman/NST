// actors.test.mjs — the garment cutter in actors.js. Clothes are shells cut from the body mesh, so the whole
// look depends on three properties: the cut lands exactly on the plane (a hem is a straight line), nothing
// outside the planes survives, and the opening (the neck) really is removed. Each has a control that must fail.
import './_three.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const THREE = await import('three');
const { garment } = await import('../src/shell/stage/actors.js');

// A tall tube (radius 0.2, y from 0 to 2) standing in for a torso, skinned to one bone.
function tube() {
  const geo = new THREE.CylinderGeometry(0.2, 0.2, 2, 24, 8, true); geo.translate(0, 1, 0);
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
const count = (m) => m.geometry.attributes.position.count / 3;

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
  const p = m.geometry.attributes.position; let A = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); A += b.sub(a).cross(c.sub(a)).length() / 2; }
  return A;
};

test('the neck opening removes the surface inside it and keeps the rest', () => {
  const whole = garment(tube(), [], null, 0, new THREE.MeshBasicMaterial());
  const holed = garment(tube(), [], (x, y) => Math.hypot(x, y - 1) - 0.15, 0, new THREE.MeshBasicMaterial());
  // (the opening is subdivided along its edge, so compare area rather than triangle count)
  assert.ok(area(holed) < area(whole) * 0.95, `${area(holed)} vs ${area(whole)}`);
  assert.ok(area(holed) > area(whole) * 0.6, 'but not most of the garment');
  const p = holed.geometry.attributes.position; let inside = 0;
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    if (Math.hypot(cx, cy - 1) < 0.1) inside++;
  }
  assert.equal(inside, 0, 'no triangle survives deep inside the opening');
});

test('a plane that excludes the whole body leaves an empty garment rather than throwing', () => {
  const g = garment(tube(), [{ axis: 1, min: 5 }], null, 0, new THREE.MeshBasicMaterial());
  assert.equal(count(g), 0);
});
