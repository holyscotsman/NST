/* netlify-build.mjs — assembles the site that Netlify publishes into dist/.
 *
 * The repository root is also the development workspace (tests, scripts, the VM server, docs), and none of
 * that belongs on a public site. This copies exactly the files the browser loads, nothing else, so a new
 * top-level folder is never published by accident: it has to be added here on purpose.
 *
 * Run: node scripts/netlify-build.mjs     (netlify.toml runs it as the build command)
 */
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'dist');

/* What the browser loads. Folders are copied whole (minus the EXCLUDE rules); single files by name. */
export const PUBLISH = [
  'index.html', '404.html',
  'styles', 'shared', 'banks',
  'wwtbane', 'starnix', 'practice-exams', 'ncm-practice',
  'scripts/nst-home.js',
];

/* Inside a published folder, never ship tests, scratch output or dev-only material. */
const EXCLUDE_DIRS = new Set(['tests', 'test', 'tools', 'shots', 'node_modules', 'drafts', 'provenance', '.git']);
const EXCLUDE_FILE = /(\.test\.m?js|\.cjs|\.map|\.md\.tmp|\.DS_Store)$/;

export function build(out = OUT) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  let files = 0;
  for (const rel of PUBLISH) {
    const from = join(ROOT, rel);
    if (!existsSync(from)) throw new Error(`netlify-build: ${rel} is listed but does not exist`);
    cpSync(from, join(out, rel), {
      recursive: true,
      filter: (src) => {
        const name = basename(src);
        if (statSync(src).isDirectory()) return !EXCLUDE_DIRS.has(name);
        if (EXCLUDE_FILE.test(name)) return false;
        files++;
        return true;
      },
    });
  }
  return { out, files };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = build();
  console.log(`netlify-build: ${r.files} files -> ${r.out}`);
  const top = readdirSync(r.out).sort().join(', ');
  console.log(`netlify-build: published top level: ${top}`);
}
