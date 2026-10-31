// Dev-only (not published): builds the voxel people with kiln and strips each GLB to what the studio needs.
//   node wwtbane/tools/voxel/build-people.mjs [path/to/kiln.js]     (needs @gltf-transform/core and /functions)
// The studio shades them flat (face normals come from the shader), so normals and UVs are dropped; the part nodes
// (torso, head, armL, armR, legL, legR) keep their pivots, which is why the meshes are NOT quantised.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const kiln = process.argv[2] || path.join(process.env.HOME || '', '.claude/skills/kiln/bin/kiln.js');
const require = createRequire(import.meta.url);
const { NodeIO } = require('@gltf-transform/core');
const { dedup, prune } = require('@gltf-transform/functions');
const out = path.join(here, '../../assets/voxel/people');
const work = mkdtempSync(path.join(tmpdir(), 'voxel-'));
mkdirSync(out, { recursive: true });
execFileSync('node', [kiln, 'build', path.join(here, 'people.kx.js'), '--out', work], { stdio: 'inherit' });
const io = new NodeIO();
for (const look of ['host', 'player', 'op', 'stage', 'fan']) {
  const doc = await io.read(path.join(work, 'models', `vox_${look}.glb`));
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) { prim.setAttribute('NORMAL', null); prim.setAttribute('TEXCOORD_0', null); }
  await doc.transform(dedup(), prune());
  await io.write(path.join(out, `${look}.glb`), doc);
}
console.log('voxel people ->', out);
