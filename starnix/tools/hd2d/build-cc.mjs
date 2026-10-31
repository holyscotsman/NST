// Dev-only: turns Chasm Chase's photographic canyon textures into chunky pixel-art ones (downscaled, then reduced to a
// small palette) in assets.js. Safe to run twice (the second pass finds a 128px texture and leaves it as it is).
//   node starnix/tools/hd2d/build-cc.mjs      (needs `sharp`)   then   node starnix/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets.js');
let src = readFileSync(file, 'utf8');
for (const [k, size, colours] of [['ccSurface', 128, 40], ['ccGround', 128, 32], ['ccRock', 128, 40]]) {
  const re = new RegExp(`(\\b${k}:\\s*)"data:image/(\\w+);base64,([^"]*)"`);
  const m = src.match(re); if (!m) { console.log('skip', k); continue; }
  const buf = Buffer.from(m[3], 'base64'), meta = await sharp(buf).metadata();
  if (meta.width <= size) { console.log(k, 'already', meta.width); continue; }
  const small = await sharp(buf).resize(size, size, { kernel: 'lanczos3' }).png({ palette: true, colours, dither: 0.6 }).toBuffer();
  const webp = await sharp(small).webp({ lossless: true, effort: 6 }).toBuffer();
  src = src.replace(re, `$1"data:image/webp;base64,${webp.toString('base64')}"`);
  console.log(k, `${meta.width}px ${m[2]} ${buf.length} B -> ${size}px webp ${webp.length} B`);
}
writeFileSync(file, src);
