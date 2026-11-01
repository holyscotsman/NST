// Dev-only: turns ambientCG Rock030 into the loom-style maps (rock_albedo / rock_normal / rock_orm) that render.html reads.
//   node starnix/tools/ships/rock-material.mjs <dir-with-unzipped-ambientCG-sets> <loom-output-dir>      (needs sharp)
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const sharp = createRequire(import.meta.url)('sharp');
const [, , sets, out] = process.argv;
if (!sets || !out) { console.error('usage: node rock-material.mjs <ambientcg-dir> <loom-output-dir>'); process.exit(1); }
const src = path.join(sets, 'Rock030', 'Rock030_1K-JPG_'), dir = path.join(out, 'rock');
mkdirSync(dir, { recursive: true });
await sharp(src + 'Color.jpg').resize(512, 512).png().toFile(path.join(dir, 'rock_albedo.png'));
await sharp(src + 'NormalGL.jpg').resize(512, 512).png().toFile(path.join(dir, 'rock_normal.png'));
const rough = await sharp(src + 'Roughness.jpg').resize(512, 512).greyscale().raw().toBuffer();
const orm = Buffer.alloc(512 * 512 * 3); for (let i = 0; i < 512 * 512; i++) { orm[i * 3] = 255; orm[i * 3 + 1] = rough[i]; orm[i * 3 + 2] = 0; }
await sharp(orm, { raw: { width: 512, height: 512, channels: 3 } }).png().toFile(path.join(dir, 'rock_orm.png'));
console.log('rock material ->', dir);
