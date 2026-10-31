// Dev-only: draws StarNix's Acropolis Rescue ships and station with pxl and writes them into assets.js.
//   node starnix/tools/hd2d/build-arm.mjs [path/to/pxl.js]     (needs `sharp`)   then   node starnix/build.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pxl = process.argv[2] || path.join(process.env.HOME || '', '.claude/skills/pxl/bin/pxl.js');
const sharp = createRequire(import.meta.url)('sharp');
const work = mkdtempSync(path.join(tmpdir(), 'hd2d-arm-'));
const KEYS = ['armHero', 'armEnemy', 'armEnemyDive', 'armStation', 'armBoss', 'armWarp', 'ccShip'];

execFileSync('node', [pxl, 'build', path.join(here, 'arm.px.js'), '--out', work, '--no-preview'], { stdio: 'inherit' });
const file = path.join(here, '../../assets.js');
let src = readFileSync(file, 'utf8');
for (const k of KEYS) {
  const webp = await sharp(path.join(work, 'sprites', `${k}.png`)).webp({ lossless: true, effort: 6 }).toBuffer();
  const re = new RegExp(`(\\b${k}:\\s*)"data:image/\\w+;base64,[^"]*"`);
  if (!re.test(src)) throw new Error(`assets.js has no ${k}`);
  src = src.replace(re, `$1"data:image/webp;base64,${webp.toString('base64')}"`);
}
writeFileSync(file, src);
console.log('assets.js updated:', KEYS.join(', '));
