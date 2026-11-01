// Dev-only: renders the StarNix ship, rock and station sprites from the 3D models in ships.js and writes them into assets.js.
//   node starnix/tools/ships/build.mjs <loom-output-dir> [--only=name,name] [--dump=dir]      (needs sharp and playwright)
// <loom-output-dir> holds the maps built from materials.tx.js by loom (hull_steel/, hull_iris/, ..., gold/, rock/).
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const texDir = process.argv[2];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const dump = (process.argv.find((a) => a.startsWith('--dump=')) || '').slice(7);
if (!texDir) { console.error('usage: node build.mjs <loom-output-dir>'); process.exit(1); }
const { loadChromium, launchOptions } = await import(path.join(here, '../../../scripts/browser-env.mjs'));

// the asset the games read -> how to draw it. flip: mirror left-right (the BCM art points left); w,h: output size.
const JOBS = [
  // Kuiper Belt Battle (side views; heroes point right, the BCM left)
  { key: 'kbbHero1', model: 'talon', view: 'side', w: 256, h: 256 },
  { key: 'kbbHero2', model: 'aegis', view: 'side', w: 256, h: 256 },
  { key: 'kbbHero3', model: 'mender', view: 'side', w: 256, h: 256 },
  { key: 'kbbEnemy', model: 'raider', view: 'side', w: 192, h: 192, flip: true },
  { key: 'kbbBoss', model: 'warship', view: 'side', w: 256, h: 256, flip: true },
  { key: 'kbbAsteroid1', model: 'rock1', view: 'side', w: 256, h: 256 },
  { key: 'kbbAsteroid2', model: 'rock2', view: 'side', w: 256, h: 256 },
  { key: 'kbbAsteroid3', model: 'rock3', view: 'side', w: 256, h: 256 },
  // Acropolis Rescue (top-down, nose up) and the shared player ship
  { key: 'armHero', model: 'talon', view: 'top', w: 256, h: 256 },
  { key: 'armWarp', model: 'talon', view: 'top', w: 256, h: 256 },
  { key: 'ccShip', model: 'talon', view: 'top', w: 256, h: 256 },
  { key: 'armEnemy', model: 'raider', view: 'top', w: 256, h: 256 },
  { key: 'armEnemyDive', model: 'raider', view: 'topdown', w: 256, h: 256, tint: '#444a5a' },
  { key: 'armStation', model: 'station', view: 'iso', w: 384, h: 384 },
  { key: 'armBoss', model: 'warship', view: 'topdown', w: 600, h: 400, aspect: 1.5 },
];

const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json' };
const roots = [['/three/', path.join(here, '../../../wwtbane/vendor/three/')], ['/tex/', texDir.endsWith('/') ? texDir : texDir + '/'], ['/', here + '/']];
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  for (const [prefix, dir] of roots) if (url.startsWith(prefix)) {
    const f = path.join(dir, url.slice(prefix.length));
    if (!f.startsWith(dir.replace(/\/$/, '')) || !existsSync(f)) continue;
    res.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); return;
  }
  res.writeHead(404); res.end();
}).listen(0);
const port = server.address().port;

const chromium = await loadChromium(); const browser = await chromium.launch(launchOptions());
const file = path.join(here, '../../assets.js');
let src = readFileSync(file, 'utf8');
if (dump) mkdirSync(dump, { recursive: true });
for (const job of JOBS) {
  if (only.length && !only.includes(job.key)) continue;
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message.slice(0, 160)));
  const qs = new URLSearchParams({ model: job.model, view: job.view, size: '1024', ...(job.tint ? { tint: job.tint } : {}), ...(job.aspect ? { aspect: String(job.aspect) } : {}) });
  await page.goto(`http://127.0.0.1:${port}/render.html?${qs}`);
  await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
  const dataUrl = await page.evaluate(() => window.__png); await page.close();
  let img = sharp(Buffer.from(dataUrl.split(',')[1], 'base64')).trim({ threshold: 1 });
  img = img.resize(job.w, job.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' });
  if (job.flip) img = img.flop();
  const webp = await img.webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  if (dump) writeFileSync(path.join(dump, job.key + '.webp'), webp);
  const re = new RegExp(`(\\b${job.key}:\\s*)"data:image/\\w+;base64,[^"]*"`);
  if (!re.test(src)) throw new Error(`assets.js has no ${job.key}`);
  src = src.replace(re, `$1"data:image/webp;base64,${webp.toString('base64')}"`);
  console.log(job.key, `${webp.length} B`);
}
await browser.close(); server.close();
writeFileSync(file, src);
console.log('assets.js updated');
