// people.test.mjs — the figure builder's contract: the parts the life pass
// drives exist, a person stays inside a triangle budget (the first version
// spent ~50k per figure), and outfits/hair styles all build.
import './_three.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const THREE = await import('three');
const { person, crewPerson, setMouth } = await import('../src/shell/stage/people.js');

function tris(obj) {
  let n = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    n += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return n;
}

test('every part the life pass drives exists', () => {
  const P = person({ outfit: 'jacket', hairStyle: 'swept', bow: 0xffc857 }).userData.parts;
  for (const k of ['head', 'torso', 'hairM', 'mouths', 'eyeL', 'eyeR', 'irisL', 'irisR', 'browL', 'browR', 'armL', 'armR']) {
    assert.ok(P[k], `parts.${k}`);
  }
  for (const k of ['smile', 'flat', 'frown', 'open']) assert.ok(P.mouths[k], `mouths.${k}`);
});

test('the crowd stand-in contract holds: head is skin, torso is the outfit', () => {
  const P = person({ skin: 0xc98d64, shirt: 0x3e6b2d }).userData.parts;
  assert.equal(P.head.material.color.getHex(), 0xc98d64);
  assert.equal(P.torso.material.color.getHex(), 0x3e6b2d);
  assert.ok(P.hairM.color);
});

test('a figure stays inside a triangle budget', () => {
  for (const outfit of ['jacket', 'tee', 'hoodie', 'stage']) {
    for (const seated of [false, true]) {
      const n = tris(person({ outfit, seated, hairStyle: 'long', glasses: true, tie: 0x7855fa, bow: 0xffc857 }));
      assert.ok(n < 6000, `${outfit}${seated ? ' seated' : ''}: ${n} triangles`);
    }
  }
  assert.ok(tris(crewPerson({ clipboard: true })) < 6000);
});

test('every hair style builds, and bald adds no hair geometry', () => {
  const base = tris(person({ hairStyle: 'bald' }));
  for (const hairStyle of ['short', 'swept', 'long', 'bun']) {
    assert.ok(tris(person({ hairStyle })) > base, hairStyle);
  }
});

test('setMouth shows exactly one mouth', () => {
  const P = person().userData.parts;
  for (const k of ['smile', 'frown', 'flat', 'open']) {
    setMouth(P, k);
    const shown = Object.entries(P.mouths).filter(([, m]) => m.visible).map(([n]) => n);
    assert.deepEqual(shown, [k]);
  }
});

test('figures share geometry (built once), materials stay per person', () => {
  const a = person().userData.parts, b = person().userData.parts;
  assert.equal(a.head.geometry, b.head.geometry);
  assert.notEqual(a.head.material, b.head.material);
  assert.ok(THREE.Color);
});
