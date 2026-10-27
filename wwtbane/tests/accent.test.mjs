// The accent is the set's colour script: one shared, eased colour that the wall,
// deck, rims and beams all follow. The failure modes are not crashes. They are a
// room that jumps colour on a tier change (no easing), a material that stops
// following the mood (lost tracking), and a mood with no partner colour so the
// set goes single-hue. So these tests are about those.
import test from 'node:test';
import assert from 'node:assert/strict';
import './_three.mjs'; // maps 'three' onto the vendored build (see _three-hook.mjs)
const THREE = await import('three');
const { Accent } = await import('../src/shell/stage/accent.js');
const { PAL } = await import('../src/shell/stage/kit.js');

const hex = (c) => c.getHex();
const close = (a, b, eps = 0.02) => Math.abs(a - b) < eps;

test('it starts on its colour and that colour\'s partner', () => {
  const a = new Accent(PAL.iris);
  assert.equal(hex(a.color), PAL.iris);
  assert.equal(hex(a.alt), PAL.aqua);
});

test('every mood has a DIFFERENT partner, so the set is never single-hue', () => {
  for (const m of [PAL.iris, PAL.aqua, PAL.gold, PAL.peach, PAL.mantis]) {
    const a = new Accent(m);
    assert.notEqual(hex(a.alt), hex(a.color), `mood ${m.toString(16)} has a distinct partner`);
  }
});

test('gold — the money colour — is paired with iris, not aqua', () => {
  const a = new Accent(); a.set(PAL.gold, 1, true);
  assert.equal(hex(a.alt), PAL.iris);
});

test('an unknown mood colour still gets a partner rather than an error', () => {
  const a = new Accent(); a.set(0x223344, 0.5, true);
  assert.equal(hex(a.color), 0x223344);
  assert.equal(hex(a.alt), PAL.aqua);
});

test('a mood change EASES: one frame later it has moved, but is not there yet', () => {
  const a = new Accent(PAL.iris);
  a.set(PAL.gold);
  a.update(1 / 60, false);
  assert.notEqual(hex(a.color), PAL.iris, 'it moved');
  assert.notEqual(hex(a.color), PAL.gold, 'but did not jump');
});

test('and it arrives', () => {
  const a = new Accent(PAL.iris);
  a.set(PAL.peach, 0.7);
  for (let i = 0; i < 600; i++) a.update(1 / 60, false);
  assert.ok(close(a.color.r, new THREE.Color(PAL.peach).r) && close(a.color.g, new THREE.Color(PAL.peach).g));
  assert.ok(close(a.level, 0.7));
});

test('[neg] reduced motion SNAPS — no eased colour travel at all', () => {
  const a = new Accent(PAL.iris);
  a.set(PAL.gold, 1.3);
  a.update(1 / 60, true);
  assert.equal(hex(a.color), PAL.gold);
  assert.equal(a.level, 1.3);
});

test('snap on set() lands immediately without waiting for an update', () => {
  const a = new Accent(PAL.iris);
  a.set(PAL.aqua, 1, true);
  assert.equal(hex(a.color), PAL.aqua);
});

test('a tracked material follows the mood, scaled', () => {
  const a = new Accent(PAL.iris);
  const m = new THREE.MeshStandardMaterial();
  a.track(m, 2);
  const base = m.emissive.clone();
  assert.ok(close(base.r, new THREE.Color(PAL.iris).r * 2, 0.01));
  a.set(PAL.mantis, 1, true);
  assert.ok(close(m.emissive.g, new THREE.Color(PAL.mantis).g * 2, 0.01), 'followed to mantis');
});

test('a PARTNER-tracked material follows the partner, not the mood', () => {
  const a = new Accent(PAL.iris);
  const m = new THREE.MeshStandardMaterial();
  a.track(m, 1, true);
  assert.ok(close(m.emissive.b, new THREE.Color(PAL.aqua).b, 0.01));
  a.set(PAL.gold, 1, true);
  assert.ok(close(m.emissive.b, new THREE.Color(PAL.iris).b, 0.01), 'gold\'s partner is iris');
});

test('dimming the set (a wrong answer) dims every tracked emissive with it', () => {
  const a = new Accent(PAL.iris);
  const m = new THREE.MeshStandardMaterial();
  a.track(m, 1);
  const lit = m.emissive.r;
  a.set(PAL.peach, 0.5, true);
  assert.ok(m.emissive.r < lit + 1e-9 || m.emissive.r <= new THREE.Color(PAL.peach).r * 0.5 + 1e-6);
});

test('track() returns the material, so it can be used inline', () => {
  const a = new Accent();
  const m = new THREE.MeshStandardMaterial();
  assert.equal(a.track(m), m);
});

test('the colour objects are stable references — shaders hold them as uniforms', () => {
  const a = new Accent(PAL.iris);
  const c = a.color, alt = a.alt;
  a.set(PAL.gold); for (let i = 0; i < 30; i++) a.update(1 / 60, false);
  assert.equal(a.color, c, 'recoloured in place, not replaced');
  assert.equal(a.alt, alt);
});
