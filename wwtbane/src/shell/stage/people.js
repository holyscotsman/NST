// people.js — the figures on the set: a proportioned low-poly person with an
// animatable face, and the headset crew. (Rebuilt in stage C of the graphics
// overhaul; this is the original, moved.)
import * as THREE from 'three';
import { PAL, mat, cyl, box, sph } from './kit.js';


// A proportioned low-poly person — rounded capsule limbs, separate skin /
// hair / clothes colours, and an animatable face. External model files stay
// out of the repo (brand rule: original art in code), so the "3D asset" feel
// comes from geometry, not imports.
//
// Everything on the face (hair, eyes, mouths) is parented INTO the head mesh,
// so turning the head moves the whole face. userData.parts exposes:
//   head, torso, armL, armR, eyeL, eyeR, mouths { smile, flat, frown, open }
// The studio's _animatePeople drives blinking, breathing, head sway, talking
// mouths, and mood expressions off those refs — no per-frame allocation.
export function person({ skin = 0xd9b48f, hair = 0x2a2118, shirt = 0x2f3a55, pants = 0x252c3a, shoes = 0x15151f, accent = 0x000000, glow = 0.06, seated = false } = {}) {
  const g = new THREE.Group();
  const skinM = mat(skin, accent, glow * 0.5, 0.55);
  const hairM = mat(hair, 0x000000, 0, 0.7);
  const shirtM = mat(shirt, accent, glow, 0.65);
  const pantsM = mat(pants, 0x000000, 0, 0.7);
  const shoeM = mat(shoes, 0x000000, 0, 0.5);
  const darkM = mat(0x1c1410, 0x000000, 0, 0.6);
  const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m);

  // head carries the whole face in local space
  const head = sph(0.155, skinM); head.position.set(0, 1.56, 0); g.add(head);
  const hairCap = sph(0.162, hairM); hairCap.scale.set(1, 0.72, 1); hairCap.position.set(0, 0.07, -0.025); head.add(hairCap);
  const eyes = {};
  for (const sgn of [-1, 1]) {
    const eye = sph(0.017, darkM); eye.position.set(sgn * 0.055, 0.015, 0.142); head.add(eye);
    eyes[sgn === 1 ? 'eyeR' : 'eyeL'] = eye;
  }
  // nose + ears for depth
  const nose = sph(0.02, skinM); nose.scale.set(1, 1.1, 1.3); nose.position.set(0, -0.02, 0.152); head.add(nose);
  for (const sgn of [-1, 1]) { const ear = sph(0.028, skinM); ear.scale.set(0.6, 1, 0.8); ear.position.set(sgn * 0.15, 0, 0); head.add(ear); }
  // mouth states — one visible at a time (animatePeople swaps them)
  const mouths = {
    smile: new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 8, 14, Math.PI), skinM.clone()),
    frown: new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 8, 14, Math.PI), skinM.clone()),
    flat: box(0.07, 0.013, 0.013, darkM),
    open: new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.011, 8, 14), darkM),
  };
  mouths.smile.material.color.setHex(0x8a5a44); mouths.smile.rotation.z = Math.PI; // ∪
  mouths.frown.material.color.setHex(0x8a5a44); mouths.frown.position.y = -0.075;  // ∩
  for (const [k, m] of Object.entries(mouths)) {
    m.position.z = 0.146; if (k !== 'frown') m.position.y = k === 'smile' ? -0.045 : -0.06;
    m.visible = k === 'flat';
    head.add(m);
  }

  const torso = capsule(0.155, 0.34, shirtM); torso.position.set(0, 1.17, 0); g.add(torso);
  const hips = capsule(0.14, 0.08, pantsM); hips.position.set(0, 0.92, 0); g.add(hips);

  const arms = {};
  for (const sgn of [-1, 1]) {
    // Arm hangs from a shoulder joint that overlaps the torso, so it reads as
    // connected and pivots from the shoulder (not its middle) when animated.
    const armPivot = new THREE.Group();
    armPivot.position.set(sgn * 0.165, 1.35, 0.01);
    const shoulder = sph(0.078, shirtM); armPivot.add(shoulder);          // bridges to the torso
    const upper = capsule(0.05, 0.30, shirtM); upper.position.set(0, -0.2, 0); armPivot.add(upper);
    const hand = sph(0.05, skinM); hand.position.set(0, -0.4, 0.01); armPivot.add(hand);
    armPivot.rotation.z = -sgn * 0.12;
    g.add(armPivot);
    arms[sgn === 1 ? 'armR' : 'armL'] = armPivot;
  }

  if (seated) {
    for (const sgn of [-1, 1]) {
      const thigh = capsule(0.066, 0.28, pantsM); thigh.rotation.x = Math.PI / 2; thigh.position.set(sgn * 0.1, 0.88, 0.2); g.add(thigh);
      const shin = capsule(0.056, 0.62, pantsM); shin.position.set(sgn * 0.1, 0.5, 0.38); g.add(shin);
      const shoe = box(0.11, 0.07, 0.24, shoeM); shoe.position.set(sgn * 0.1, 0.13, 0.44); g.add(shoe);
    }
  } else {
    for (const sgn of [-1, 1]) {
      const leg = capsule(0.064, 0.56, pantsM); leg.position.set(sgn * 0.1, 0.42, 0); g.add(leg);
      const shoe = box(0.11, 0.07, 0.24, shoeM); shoe.position.set(sgn * 0.1, 0.035, 0.05); g.add(shoe);
    }
  }
  // hairM is exposed so the crowd stand-in actor can recolour its hair to match
  // the seat it replaces (torso.material === shirtM, head.material === skinM).
  g.userData.parts = { head, torso, hairM, mouths, ...eyes, ...arms };
  return g;
}

// Swap which mouth shape is showing. Direct property sets — no Object.entries
// allocation (this runs per person, every frame, in the life pass).
export function setMouth(parts, kind) {
  const m = parts.mouths;
  m.smile.visible = kind === 'smile';
  m.frown.visible = kind === 'frown';
  m.flat.visible = kind === 'flat';
  m.open.visible = kind === 'open';
}

// A crew member: dark stagewear, over-the-head headset with ear cups + boom
// mic (+ optional clipboard). The band is a HALF torus arcing ear-to-ear over
// the crown — in the head's local space so it turns with the head.
export function crewPerson({ clipboard = false } = {}) {
  const g = person({ skin: 0xd9b48f, hair: 0x3c3c46, shirt: 0x23232f, pants: 0x1a1a24, accent: PAL.aqua, glow: 0.12 });
  const head = g.userData.parts.head;
  const gearM = mat(0x0a0a14, PAL.aqua, 0.5);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 10, 24, Math.PI), gearM);
  band.position.set(0, 0.02, 0); head.add(band); // arc opens downward: ear → crown → ear
  for (const sgn of [-1, 1]) {
    const cup = cyl(0.045, 0.045, 0.035, gearM);
    cup.rotation.z = Math.PI / 2; cup.position.set(sgn * 0.165, 0, 0); head.add(cup);
  }
  const boom = box(0.022, 0.022, 0.13, gearM);
  boom.position.set(0.1, -0.06, 0.1); boom.rotation.set(0.15, 0.55, 0); head.add(boom);
  const micTip = sph(0.022, gearM); micTip.position.set(0.055, -0.075, 0.155); head.add(micTip);
  if (clipboard) {
    const cb = box(0.26, 0.36, 0.03, mat(0x22222e, PAL.aqua, 0.25));
    cb.position.set(-0.28, 1.05, 0.16); cb.rotation.set(0.3, 0.2, 0.1); g.add(cb);
  }
  return g;
}

