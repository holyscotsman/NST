// Dev-only: puts real CC0 ambientCG rock and asphalt textures into StarNix's assets.js for Chasm Chase.
//   node starnix/tools/ships/build-canyon.mjs <dir-with-unzipped-ambientCG-sets>        (needs sharp)
// Rock029 (red-brown rock) for the canyon walls and obstacle rocks (colour + normal), Asphalt025C (dark) for the road.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const dir = process.argv[2];
if (!dir) { console.error('usage: node build-canyon.mjs <dir>'); process.exit(1); }
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets.js');
let src = readFileSync(file, 'utf8');
const put = async (keys, input, size, quality) => {
  const webp = await sharp(input).resize(size, size).webp({ quality }).toBuffer();
  for (const k of keys) {
    const re = new RegExp(`(\\b${k}:\\s*)"data:image/\\w+;base64,[^"]*"`);
    if (!re.test(src)) throw new Error(`assets.js has no ${k}`);
    src = src.replace(re, `$1"data:image/webp;base64,${webp.toString('base64')}"`);
  }
  console.log(keys.join('+'), size, `${webp.length} B`);
};
const f = (id, kind) => path.join(dir, id, `${id}_1K-JPG_${kind}.jpg`);
await put(['ccSurface', 'ccRock'], f('Rock029', 'Color'), 768, 82);
await put(['ccRockN'], f('Rock029', 'NormalGL'), 768, 88);
await put(['ccGround'], f('Asphalt025C', 'Color'), 512, 82);
writeFileSync(file, src);
