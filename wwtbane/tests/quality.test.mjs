// The quality tiers decide how much GPU the studio spends. Two failure modes
// matter and neither is a crash: promising a software renderer the full effects
// chain (a slideshow nobody can play), and a governor that either never reacts
// or flaps on a single hitch. So these tests are about decisions.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TIERS, tierFromRenderer, pickTier, applyOverrides, rememberBadTier, Governor } from '../src/shell/stage/quality.js';

test('software rasterisers are never given more than the low tier', () => {
  for (const r of [
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
    'Mesa OffScreen',
  ]) assert.equal(tierFromRenderer(r), 'low', r);
});

test('discrete and Apple-silicon GPUs start at high', () => {
  for (const r of [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)',
  ]) assert.equal(tierFromRenderer(r), 'high', r);
});

test('integrated and mobile GPUs start at medium', () => {
  for (const r of [
    'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11, D3D11)',
    'Mali-G78 MC14',
    'Adreno (TM) 650',
  ]) assert.equal(tierFromRenderer(r), 'medium', r);
});

test('an unknown or missing GPU name is medium, not an error', () => {
  assert.equal(tierFromRenderer(''), 'medium');
  assert.equal(tierFromRenderer(undefined), 'medium');
  assert.equal(tierFromRenderer('Some Future GPU 9000'), 'medium');
});

test('[neg] a discrete GPU name is not mistaken for software just because it says "Direct3D11"', () => {
  assert.notEqual(tierFromRenderer('ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11, D3D11)'), 'low');
});

test('"effects off" caps the tier at low whatever the GPU is', () => {
  const gl = { getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 1 }), getParameter: () => 'NVIDIA GeForce RTX 4090' };
  assert.equal(pickTier({ gl, effects: true, autoMax: 'high' }).tier.name, 'high');
  assert.equal(pickTier({ gl, effects: false, autoMax: 'high' }).tier.name, 'low');
});

test('Auto never picks high on its own: high is opt-in until it is proven on real GPUs', () => {
  const gl = { getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 1 }), getParameter: () => 'Apple M2 Pro' };
  assert.equal(pickTier({ gl, effects: true }).tier.name, 'medium');
});

test('a tier remembered as broken is never picked again, nor anything above it', () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: (k) => { delete store[k]; } };
  try {
    const gl = { getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 1 }), getParameter: () => 'NVIDIA GeForce RTX 4090' };
    rememberBadTier('medium');
    assert.equal(pickTier({ gl, effects: true, autoMax: 'high' }).tier.name, 'low');
    store['wwtbane.quality'] = 'high'; // a person's explicit choice still wins
    assert.equal(pickTier({ gl, effects: true }).tier.name, 'high');
  } finally { delete globalThis.localStorage; }
});

test('diagnostic URL switches turn single features off without touching the tier', () => {
  const t = applyOverrides({ ...TIERS.high }, '?ao=0&mirror=0&msaa=0&bloom=0&grade=0&dpr=1.25');
  assert.equal(t.ao, false); assert.equal(t.mirror, false); assert.equal(t.msaa, 0);
  assert.equal(t.bloom, false); assert.equal(t.grade, false); assert.equal(t.dpr, 1.25);
  assert.deepEqual(applyOverrides({ ...TIERS.medium }, '?foo=1'), TIERS.medium, 'unrelated params change nothing');
  assert.equal(applyOverrides({ ...TIERS.low }, '?dpr=2').dpr, TIERS.low.dpr, 'a dpr switch only ever lowers');
});

test('every tier carries the full set of knobs, and they only ever increase', () => {
  const keys = Object.keys(TIERS.high).sort();
  for (const t of Object.values(TIERS)) assert.deepEqual(Object.keys(t).sort(), keys, t.name);
  assert.ok(TIERS.low.dpr < TIERS.medium.dpr && TIERS.medium.dpr < TIERS.high.dpr);
  assert.ok(!TIERS.low.bloom && !TIERS.low.ao && !TIERS.low.mirror, 'low must not run the post chain');
  assert.ok(TIERS.high.ao && TIERS.high.mirror, 'high is where the expensive features live');
  assert.ok(!TIERS.medium.ao && !TIERS.medium.mirror, 'medium skips the two that cost the most');
});

/* ---- the governor ---- */

// Feed `seconds` of frames at a fixed frame time.
function run(g, seconds, frame) {
  const n = Math.round(seconds / frame);
  for (let i = 0; i < n; i++) g.sample(frame);
}
function make(tierName = 'high', extra = {}) {
  const events = { res: [], tier: [] };
  const g = new Governor({
    tier: { ...TIERS[tierName] },
    onResolution: (k) => events.res.push(k),
    onTier: (t) => events.tier.push(t.name),
    ...extra,
  });
  return { g, events };
}

test('[neg] a GPU holding 60 fps is never touched', () => {
  const { g, events } = make();
  run(g, 60, 1 / 60);
  assert.deepEqual(events, { res: [], tier: [] });
});

test('the first seconds are ignored — shader compile and texture upload are not slowness', () => {
  const { g, events } = make();
  run(g, 2.0, 0.2); // five 200 ms frames inside the warm-up window
  assert.equal(events.res.length + events.tier.length, 0);
});

test('a single hitch does not trigger anything', () => {
  const { g, events } = make();
  run(g, 5, 1 / 60);
  g.sample(0.4); // one dropped half-second
  run(g, 10, 1 / 60);
  assert.deepEqual(events, { res: [], tier: [] });
});

test('a backgrounded tab (multi-second delta) is not slowness', () => {
  const { g, events } = make();
  run(g, 5, 1 / 60);
  for (let i = 0; i < 20; i++) g.sample(3.0);
  assert.deepEqual(events, { res: [], tier: [] });
});

test('sustained slowness drops RESOLUTION first, in steps, before touching the tier', () => {
  const { g, events } = make();
  run(g, 10, 1 / 15); // a steady 15 fps: long enough for the resolution steps, not the tier
  assert.ok(events.res.length >= 2, 'resolution was reduced in steps: ' + events.res);
  assert.ok(events.res[0] < 1, 'to less than full');
  assert.ok(events.res.every((k, i) => i === 0 || k < events.res[i - 1]), 'strictly downward within a tier');
  assert.ok(Math.min(...events.res) >= g.minScale - 1e-9, 'never below the floor');
  assert.deepEqual(events.tier, [], 'the tier is untouched while resolution still has room');
});

test('only once resolution is at its floor does the tier step down — and resolution resets for the new tier', () => {
  const { g, events } = make();
  run(g, 25, 1 / 15);
  assert.equal(events.tier[0], 'medium');
  assert.equal(g.scale <= 1 && g.scale >= g.minScale - 1e-9, true);
  assert.equal(g.tier.name === 'medium' || g.tier.name === 'low', true);
});

test('if resolution is exhausted the tier steps down, and stops at low', () => {
  const { g, events } = make('high');
  run(g, 300, 1 / 10);
  assert.deepEqual(events.tier, ['medium', 'low']);
  assert.equal(g.tier.name, 'low');
});

test('tier drops are capped, so a hopeless machine settles instead of thrashing', () => {
  const { g, events } = make('high');
  run(g, 2000, 1 / 5);
  assert.ok(events.tier.length <= 2);
});

test('[neg] it never steps UP — flapping tiers is worse than a conservative one', () => {
  const { g, events } = make('medium');
  run(g, 60, 1 / 10);   // slow: drops
  const before = events.tier.length;
  run(g, 120, 1 / 120); // then very fast for a long time
  assert.equal(events.tier.length, before);
  assert.ok(!events.tier.includes('high'));
});

test('a disabled governor never reacts, however slow the frames', () => {
  const { g, events } = make('high', { enabled: false });
  run(g, 120, 1 / 5);
  assert.deepEqual(events, { res: [], tier: [] });
});
