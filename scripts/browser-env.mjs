/* browser-env.mjs — finding a browser, and refusing to pretend.
 *
 * Three suites need a real Chromium: the accessibility audit, the mobile layout
 * audit and the end-to-end smoke test. Each had its own copy of the same
 * resolution logic, and each ended it the same way: if no browser turned up,
 * print SKIP and exit 0.
 *
 * That is right on a laptop, where the alternative is a red build for a tool
 * the developer simply has not installed. It is exactly wrong in CI, where an
 * exit 0 that ran nothing is indistinguishable from 71 passing checks — the
 * failure mode robustness-test.mjs was written to avoid, reintroduced by the
 * harness rather than the tests.
 *
 * So the skip is now conditional. Set NST_REQUIRE_BROWSER=1 (CI does) and a
 * missing browser is a hard failure that says what is missing and how to get it.
 * Leave it unset and the local behaviour is unchanged.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

/* The sandbox this repo is developed in ships Playwright globally and Chromium
 * under /opt; a normal checkout gets both from `npm install --no-save`. Try the
 * package name first so an ordinary install wins. */
const PLAYWRIGHT_SPECS = ['playwright', '/opt/node22/lib/node_modules/playwright/index.js'];
const SANDBOX_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const REQUIRED = process.env.NST_REQUIRE_BROWSER === '1';

/* Skip locally, fail loudly under NST_REQUIRE_BROWSER. `cleanup` runs either
 * way, so a suite that has already started a server still tears it down. */
export function missing(what, howToGet, cleanup) {
  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* best effort */ } }
  if (REQUIRED) {
    console.error(`FAIL: ${what} is required here (NST_REQUIRE_BROWSER=1) and was not found.`);
    console.error(`      ${howToGet}`);
    console.error('      Exiting non-zero: a suite that runs nothing must not report success.');
    process.exit(1);
  }
  console.log(`SKIP: ${what} not available. ${howToGet}`);
  process.exit(0);
}

export async function loadChromium() {
  for (const spec of PLAYWRIGHT_SPECS) {
    try { const m = await import(spec); const c = m.chromium || (m.default && m.default.chromium); if (c) return c; }
    catch { /* try the next location */ }
  }
  return null;
}

/* undefined means "let Playwright use the browser it downloaded". Naming a
 * path that does not exist is worse than naming none: launch fails with a
 * missing-executable error instead of just working. */
export function chromePath() {
  if (process.env.PW_CHROME) return process.env.PW_CHROME;
  if (existsSync(SANDBOX_CHROME)) return SANDBOX_CHROME;
  return undefined;
}

/* Only pass executablePath when there is one, for the reason above. */
export function launchOptions(extra = {}) {
  const exe = chromePath();
  return { args: ['--no-sandbox', '--use-gl=swiftshader'], ...(exe ? { executablePath: exe } : {}), ...extra };
}

export function loadAxe() {
  const candidates = [
    process.env.AXE_PATH || '',
    join(HERE, '..', 'node_modules', 'axe-core', 'axe.min.js'),
    join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
  ].filter(Boolean);
  for (const c of candidates) { if (existsSync(c)) return readFileSync(c, 'utf8'); }
  return null;
}
