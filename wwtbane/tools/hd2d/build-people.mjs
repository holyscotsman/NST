// Dev-only (not published): draws the HD-2D people with pxl and packs each look into one sheet.
//   node wwtbane/tools/hd2d/build-people.mjs [path/to/pxl.js]     (needs `sharp`; pxl is the pixel-art skill)
// Sheet layout: one row per pose in POSES order, one column per frame (the last row may have fewer frames).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pxl = process.argv[2] || path.join(process.env.HOME || '', '.claude/skills/pxl/bin/pxl.js');
const sharp = createRequire(import.meta.url)('sharp');
const out = path.join(here, '../../assets/hd2d/people');
const work = mkdtempSync(path.join(tmpdir(), 'hd2d-'));
const LOOKS = ['host', 'player', 'op', 'stage', 'fan'];
const POSES = [['idle', 2], ['talk', 2], ['cheer', 2], ['wave', 2], ['worry', 1]];
const W = 38, H = 62, COLS = 2;

mkdirSync(out, { recursive: true });
execFileSync('node', [pxl, 'build', path.join(here, 'people.px.js'), '--out', work], { stdio: 'inherit' });
for (const look of LOOKS) {
  const comps = [];
  for (let r = 0; r < POSES.length; r++) for (let f = 0; f < POSES[r][1]; f++)
    comps.push({ input: await sharp(path.join(work, 'anims', `${look}_${POSES[r][0]}.png`)).extract({ left: f * W, top: 0, width: W, height: H }).toBuffer(), left: f * W, top: r * H });
  await sharp({ create: { width: W * COLS, height: H * POSES.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps).png({ compressionLevel: 9, palette: true }).toFile(path.join(out, `${look}.png`));
}
console.log('sheets ->', out);
