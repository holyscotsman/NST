// _harness.mjs — shared browser-test plumbing: a tiny static server, playwright
// loader, and chromium executable discovery.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = normalize(join(fileURLToPath(import.meta.url), '..', '..'));
const EXE = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const PW = ['playwright', '/opt/node22/lib/node_modules/playwright', 'playwright-core'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// Since the NST consolidation the game loads /shared/ and /banks/ from the
// repo root at runtime (../shared/bank-loader.js etc. relative to /wwtbane/).
// Requests that don't resolve under wwtbane/ fall back to the repo root so the
// browser tests exercise the real runtime-bank path instead of 404ing into the
// "no bank" guard screen.
const REPO_ROOT = normalize(join(ROOT, '..'));
export function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      let full = normalize(join(ROOT, p));
      if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end('no'); }
      if (!existsSync(full)) {
        const alt = normalize(join(REPO_ROOT, p));
        if (alt.startsWith(REPO_ROOT) && existsSync(alt)) full = alt;
      }
      const body = await readFile(full);
      res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

export async function loadPlaywright() {
  for (const c of PW) { try { return await import(c); } catch { /* next */ } }
  return null;
}

export function findExe() { return EXE.find((p) => existsSync(p)); }

export function launchArgs() {
  return { executablePath: findExe(), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] };
}
