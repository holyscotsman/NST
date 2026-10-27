// fx.test.mjs — the celebration particles. What matters: reduced motion emits
// nothing at all, a burst eventually clears itself (no particle lives forever),
// the pools recycle instead of growing, and coins come to rest on the deck.
import './_three.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
await import('three');
const { buildFx } = await import('../src/shell/stage/fx.js');
const tier = (name) => ({ name });

const live = (fx) => {
  // count instances whose scale is non-zero, via the instance matrices
  let n = 0;
  for (const mesh of fx.group.children) {
    const a = mesh.instanceMatrix.array;
    for (let i = 0; i < mesh.count; i++) if (Math.abs(a[i * 16]) > 1e-6 || Math.abs(a[i * 16 + 1]) > 1e-6) n++;
  }
  return n;
};
const run = (fx, seconds, reduced = false) => { for (let t = 0; t < seconds; t += 1 / 60) fx.update(1 / 60, reduced); };

test('starts empty', () => {
  const fx = buildFx({ tier: tier('medium') });
  run(fx, 0.5);
  assert.equal(live(fx), 0);
});

test('a burst appears, then clears itself', () => {
  const fx = buildFx({ tier: tier('medium') });
  fx.confetti(100); fx.coins(30); fx.sparks(20);
  run(fx, 0.3);
  assert.ok(live(fx) > 100, 'particles are visible mid-burst');
  run(fx, 12);
  assert.equal(live(fx), 0, 'everything has faded out');
});

test('reduced motion: every emitter is a no-op', () => {
  const fx = buildFx({ tier: tier('high') });
  fx.update(1 / 60, true);
  fx.confetti(200); fx.coins(50); fx.sparks(40); fx.show(5);
  run(fx, 1, true);
  assert.equal(live(fx), 0);
  assert.equal(fx.active, false);
});

test('show() keeps emitting, then stops', () => {
  const fx = buildFx({ tier: tier('medium') });
  fx.show(1);
  assert.equal(fx.active, true);
  run(fx, 0.6);
  assert.ok(live(fx) > 5, 'still raining');
  run(fx, 15);
  assert.equal(fx.active, false);
  assert.equal(live(fx), 0);
});

test('pools recycle: asking for more than the pool holds never throws or grows', () => {
  const fx = buildFx({ tier: tier('low') });
  const counts = fx.group.children.map((m) => m.count);
  fx.confetti(5000); fx.coins(5000);
  run(fx, 0.5);
  assert.deepEqual(fx.group.children.map((m) => m.count), counts);
});

test('coins land on the deck and lie flat', () => {
  const fx = buildFx({ tier: tier('medium') });
  fx.coins(1, 0, 0);
  run(fx, 2.5);
  const coinMesh = fx.group.children[1];
  const a = coinMesh.instanceMatrix.array;
  let found = false;
  for (let i = 0; i < coinMesh.count; i++) {
    if (Math.abs(a[i * 16]) > 1e-6) { found = true; assert.ok(a[i * 16 + 13] < 0.1, 'resting height ' + a[i * 16 + 13]); }
  }
  assert.ok(found, 'the coin is still on the deck before it fades');
});

const { piggyBank } = await import('../src/shell/stage/props.js');

test('piggy bank: bump squashes it, then it settles back exactly to rest', () => {
  const pig = piggyBank(0, 0);
  pig.scale.setScalar(0.88); pig.userData.baseScale = 0.88;
  pig.userData.update(1 / 60, false);
  assert.equal(pig.scale.y, 0.88, 'untouched pig is at rest');
  pig.userData.bump();
  let moved = false;
  for (let i = 0; i < 20; i++) { pig.userData.update(1 / 60, false); if (Math.abs(pig.scale.y - 0.88) > 0.005) moved = true; }
  assert.ok(moved, 'it squashes');
  for (let i = 0; i < 600; i++) pig.userData.update(1 / 60, false);
  assert.ok(Math.abs(pig.scale.y - 0.88) < 1e-9 && Math.abs(pig.scale.x - 0.88) < 1e-9, 'settles to base scale');
});

test('piggy bank: reduced motion snaps back instead of wobbling', () => {
  const pig = piggyBank(0, 0);
  pig.scale.setScalar(0.88); pig.userData.baseScale = 0.88;
  pig.userData.bump();
  pig.userData.update(1 / 60, true);
  assert.equal(pig.scale.y, 0.88);
});
