// bake.json (static posed geometry, three groups) -> three small simplified GLBs
import { Document, NodeIO } from '@gltf-transform/core';
import { weld, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import fs from 'node:fs';
const [,, input, outdir, rs, rc, rh, tag = 'm'] = process.argv;
const parts = JSON.parse(fs.readFileSync(input, 'utf8'));
await MeshoptSimplifier.ready;
const ratios = { skin: Number(rs), clothes: Number(rc), hair: Number(rh) };
for (const [name, list] of Object.entries(parts)) {
  const doc = new Document(); const buf = doc.createBuffer(); const scene = doc.createScene();
  const P = [], N = [], I = []; let off = 0;
  for (const m of list) { for (const v of m.P) P.push(v); for (const v of m.N) N.push(v); for (const i of m.I) I.push(i + off); off += m.P.length / 3; }
  const pos = doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buf);
  const nor = doc.createAccessor().setType('VEC3').setArray(new Float32Array(N)).setBuffer(buf);
  const ind = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(I)).setBuffer(buf);
  const prim = doc.createPrimitive().setAttribute('POSITION', pos).setAttribute('NORMAL', nor).setIndices(ind);
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  await doc.transform(weld({ tolerance: 0.0008 }), simplify({ simplifier: MeshoptSimplifier, ratio: ratios[name], error: Number(process.env.ERR || 0.02) }));
  const tris = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount() / 3;
  const out = `${outdir}/crowd_${tag}_${name}.glb`;
  await new NodeIO().write(out, doc);
  console.log(name, Math.round(I.length / 3), '->', tris, 'tris', (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}
