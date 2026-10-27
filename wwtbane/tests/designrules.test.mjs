// designrules.test.mjs — the Nutanix Design System rules the DOM must keep
// (docs/DESIGN_BRIEF.md, and the Design System artifact the brief follows):
// no emoji in the UI (icons are drawn SVG), no hexagonal answer lozenges, no
// gradient headline text. Cheap source-level guards: a stray emoji or a pasted
// old clip-path is exactly the kind of regression nobody notices in review.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const uiFiles = readdirSync(join(root, 'src/shell/ui')).filter((f) => f.endsWith('.js')).map((f) => 'src/shell/ui/' + f);

test('no emoji in the UI source (drawn icons only)', () => {
  const astral = /[\u{1F300}-\u{1FAFF}]/u;
  for (const f of [...uiFiles, 'src/shell/main.js']) {
    const bad = read(f).split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => !l.trim().startsWith('//') && astral.test(l));
    assert.deepEqual(bad.map(([n, l]) => `${f}:${n} ${l.trim().slice(0, 60)}`), [], f);
  }
});

test('answers are rounded cards, not hexagonal lozenges', () => {
  const css = read('styles/main.css');
  const last = css.lastIndexOf('\n.option {') + 1;
  assert.ok(last > css.indexOf('Nutanix Design System pass'), 'the design-system block restyles .option');
  assert.match(css.slice(last, last + 120), /clip-path:\s*none/);
  assert.match(css.slice(last, last + 120), /border-radius:\s*4px/);
});

test('the title is flat type, not gradient text', () => {
  const css = read('styles/main.css');
  const block = css.slice(css.indexOf('.brand-main { background: none'));
  assert.match(block.slice(0, 200), /background:\s*none/);
  assert.match(block.slice(0, 200), /font-weight:\s*300/);
});

test('the shipped X ident assets are the official shape in the two allowed colours', () => {
  const white = read('assets/nutanix-x-white.svg'), iris = read('assets/nutanix-x-iris.svg');
  assert.match(white, /fill="#FFFFFF"/); assert.match(iris, /fill="#7855FA"/);
  const d = (s) => s.match(/ d="([^"]+)"/)[1];
  assert.equal(d(white), d(iris), 'same path in both colours (never redrawn)');
});
