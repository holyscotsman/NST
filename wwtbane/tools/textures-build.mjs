// Dev-only (not published): turns the downloaded ambientCG sets (CC0, https://ambientcg.com) into the small WebP
// maps the studio loads from assets/textures/. Usage: node wwtbane/tools/textures-build.mjs <dir-with-unzipped-sets>
// (needs `sharp`). Each set becomes <name>/color.webp, normal.webp (OpenGL convention, as three.js expects) and
// rough.webp at the size below.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const src = process.argv[2];
if (!src) { console.error('usage: node textures-build.mjs <dir>'); process.exit(1); }
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/textures');
const SETS = [
  // [name, ambientCG id, size]
  ['marble', 'Marble016', 1024],       // dark veined marble: the deck's polish, pedestals
  ['onyx', 'Onyx013', 512],            // dark swirled stone: the money pedestal and accents
  ['steel', 'Metal009', 512],          // brushed steel: stool posts, truss, pillars
  ['carbon', 'Fabric004', 512],        // carbon weave: consoles and trim
  ['leather', 'Leather037', 512],      // leather: the contestants' seats
];
for (const [name, id, size] of SETS) {
  const dir = path.join(out, name); mkdirSync(dir, { recursive: true });
  const f = (kind) => path.join(src, id, `${id}_1K-JPG_${kind}.jpg`);
  await sharp(f('Color')).resize(size, size).webp({ quality: 82 }).toFile(path.join(dir, 'color.webp'));
  await sharp(f('NormalGL')).resize(size, size).webp({ quality: 88 }).toFile(path.join(dir, 'normal.webp'));
  await sharp(f('Roughness')).resize(size, size).greyscale().webp({ quality: 80 }).toFile(path.join(dir, 'rough.webp'));
  console.log(name, id, size);
}
