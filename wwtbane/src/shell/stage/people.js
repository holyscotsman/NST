// people.js — the figures on the set. Stage C of the graphics overhaul.
//
// A proportioned, stylised person built from shared, low-poly geometry: an
// egg-shaped head with a jaw, eyes with whites / iris / pupil / catch-light,
// brows, a nose and ears, several hair styles, and dressed outfits (jacket and
// tie, tee, hoodie) over tapered limbs with an elbow bend. Roughly 3-4k
// triangles a person — the first version spent ~10k on a dozen 864-triangle
// spheres. External model files stay out of the repo (brand rule: original art
// in code), so the "3D asset" feel comes from silhouette, materials and detail.
//
// Everything on the face is parented INTO the head mesh, so turning the head
// moves the whole face. userData.parts exposes what the studio's _animatePeople
// drives, with no per-frame allocation:
//   head (material = skin), torso (material = outfit, shared by the sleeves),
//   hairM, mouths { smile, flat, frown, open }, eyeL / eyeR (blink: scale.y),
//   irisL / irisR (gaze: position.x / y), browL / browR (mood), armL / armR
//   (shoulder pivots; rotation.z = 0 hangs straight down).
import * as THREE from 'three';
import { PAL, mat, cyl, box, sph, rimLit } from './kit.js';

// ---- shared geometry, built once ----------------------------------------
let G = null;
function geos() {
  if (G) return G;
  // Skull: a sphere stretched into an egg, with the lower half pulled in
  // toward a chin so the face has a jaw instead of a ball outline.
  const skull = new THREE.SphereGeometry(0.155, 20, 15);
  skull.scale(0.93, 1.06, 0.99);
  const p = skull.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0) {
      const t = Math.min(1, -y / 0.165);
      const k = 1 - 0.2 * Math.pow(t, 1.4);
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * (1 - 0.09 * t));
    }
  }
  skull.computeVertexNormals();

  // Torso: a lathe through shoulder / chest / waist, then flattened front to
  // back so the chest is wider than it is deep.
  const profile = [[0.001, -0.27], [0.14, -0.27], [0.155, -0.16], [0.168, -0.02], [0.19, 0.07], [0.182, 0.15], [0.09, 0.205], [0.001, 0.22]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const torso = new THREE.LatheGeometry(profile, 14);
  torso.scale(1, 1, 0.68);
  torso.computeVertexNormals();

  G = {
    skull, torso,
    upper: new THREE.CylinderGeometry(0.058, 0.048, 0.3, 10, 1),
    fore: new THREE.CylinderGeometry(0.047, 0.036, 0.26, 10, 1),
    hand: new THREE.SphereGeometry(0.042, 10, 8),
    shoulder: new THREE.SphereGeometry(0.052, 10, 8),
    neck: new THREE.CylinderGeometry(0.047, 0.056, 0.11, 10, 1),
    hips: new THREE.SphereGeometry(0.17, 12, 8),
    leg: new THREE.CylinderGeometry(0.085, 0.055, 0.86, 12, 1),
    thigh: new THREE.CylinderGeometry(0.085, 0.066, 0.4, 12, 1),
    shin: new THREE.CylinderGeometry(0.064, 0.047, 0.74, 12, 1),
    knee: new THREE.SphereGeometry(0.07, 8, 6),
    shoe: new THREE.SphereGeometry(0.06, 10, 7),
    eyeW: new THREE.SphereGeometry(0.021, 10, 8),
    disc: new THREE.CircleGeometry(1, 12),
    nose: new THREE.SphereGeometry(0.02, 8, 6),
    ear: new THREE.SphereGeometry(0.028, 8, 6),
    hairCap: new THREE.SphereGeometry(0.168, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairBall: new THREE.SphereGeometry(0.06, 10, 8),
    lock: new THREE.CapsuleGeometry(0.05, 0.2, 4, 8),
    lipSmile: new THREE.TorusGeometry(0.04, 0.0085, 6, 14, Math.PI),
    mouthOpen: new THREE.SphereGeometry(0.022, 10, 8),
    ring: new THREE.TorusGeometry(0.036, 0.0035, 5, 16),
    collar: new THREE.TorusGeometry(0.052, 0.012, 6, 16),
  };
  return G;
}

const mesh = (g, m) => new THREE.Mesh(g, m);
const tint = (hex, toward, k) => new THREE.Color(hex).lerp(new THREE.Color(toward), k);

// outfit: 'jacket' (jacket, shirt and tie or bow), 'tee', 'hoodie', 'stage'
// (dark crew wear). hairStyle: 'short' | 'swept' | 'long' | 'bun' | 'bald'.
// `rim` is a Color held by reference (the accent) — it lights every edge of the
// figure in the mood colour.
export function person({
  skin = 0xd9b48f, hair = 0x2a2118, shirt = 0x2f3a55, pants = 0x252c3a, shoes = 0x15151f,
  accent = 0x000000, glow = 0.06, seated = false,
  outfit = 'tee', hairStyle = 'short', eyes = 0x3a2a1c, tie = null, bow = null, glasses = false, rim = null,
} = {}) {
  const g = new THREE.Group();
  const K = geos();
  const lit = (m, s) => (rim ? rimLit(m, rim, { power: 2.8, strength: s }) : m);

  const skinM = lit(mat(skin, accent, glow * 0.5, 0.55), 0.5);
  const hairM = lit(mat(hair, 0x000000, 0, 0.55, 0.2), 0.7);
  const outfitM = lit(mat(shirt, accent, glow, 0.7), 0.55);
  const pantsM = lit(mat(pants, 0x000000, 0, 0.72), 0.45);
  const shoeM = lit(mat(shoes, 0x000000, 0, 0.35, 0.2), 0.5);
  const lipM = mat(tint(skin, 0x7a2f33, 0.5).getHex(), 0x000000, 0, 0.45);
  const darkM = mat(0x140d09, 0x000000, 0, 0.6);
  const browM = mat(tint(hair, 0x000000, 0.25).getHex(), 0x000000, 0, 0.7);

  // ---- head and face ----
  const head = mesh(K.skull, skinM); head.position.set(0, 1.56, 0); g.add(head);

  const whiteM = mat(0xf1ece6, 0x000000, 0, 0.3);
  const irisM = mat(eyes, 0x000000, 0, 0.35);
  const pupilM = new THREE.MeshBasicMaterial({ color: 0x050403 });
  const glintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeParts = {};
  for (const sgn of [-1, 1]) {
    // eye = group so a blink squashes white + iris together
    const eye = new THREE.Group(); eye.position.set(sgn * 0.054, 0.018, 0.131);
    const white = mesh(K.eyeW, whiteM); white.scale.set(1.1, 1, 0.55); eye.add(white);
    const iris = new THREE.Group(); iris.position.z = 0.0126; eye.add(iris);
    const ir = mesh(K.disc, irisM); ir.scale.setScalar(0.0125); iris.add(ir);
    const pu = mesh(K.disc, pupilM); pu.scale.setScalar(0.0066); pu.position.z = 0.0004; iris.add(pu);
    const gl = mesh(K.disc, glintM); gl.scale.setScalar(0.0028); gl.position.set(0.0045, 0.0045, 0.0008); iris.add(gl);
    head.add(eye);
    eyeParts[sgn === 1 ? 'eyeR' : 'eyeL'] = eye;
    eyeParts[sgn === 1 ? 'irisR' : 'irisL'] = iris;
    // brow
    const brow = mesh(new THREE.BoxGeometry(0.05, 0.0095, 0.012), browM);
    brow.position.set(sgn * 0.056, 0.058, 0.138); brow.rotation.z = -sgn * 0.1;
    head.add(brow);
    eyeParts[sgn === 1 ? 'browR' : 'browL'] = brow;
    // ear
    const ear = mesh(K.ear, skinM); ear.scale.set(0.55, 1, 0.8); ear.position.set(sgn * 0.143, -0.004, -0.004); head.add(ear);
  }
  const nose = mesh(K.nose, skinM); nose.scale.set(0.9, 1.15, 1.25); nose.position.set(0, -0.022, 0.148); head.add(nose);

  if (glasses) {
    const frameM = mat(0x0c0c14, PAL.aqua, 0.25, 0.3, 0.6);
    for (const sgn of [-1, 1]) { const r = mesh(K.ring, frameM); r.scale.set(1.15, 1, 1); r.position.set(sgn * 0.054, 0.018, 0.146); head.add(r); }
    const br = box(0.03, 0.005, 0.005, frameM); br.position.set(0, 0.024, 0.15); head.add(br);
  }

  // mouth states — one visible at a time (setMouth swaps them)
  const mouths = {
    smile: mesh(K.lipSmile, lipM), frown: mesh(K.lipSmile, lipM),
    flat: box(0.06, 0.011, 0.012, lipM), open: mesh(K.mouthOpen, darkM),
  };
  mouths.smile.rotation.z = Math.PI; mouths.smile.position.set(0, -0.037, 0.139);   // ∪
  mouths.frown.position.set(0, -0.082, 0.136);                                       // ∩
  mouths.flat.position.set(0, -0.06, 0.141);
  mouths.open.scale.set(1.2, 0.9, 0.45); mouths.open.position.set(0, -0.062, 0.139);
  for (const [k, m] of Object.entries(mouths)) { m.visible = k === 'flat'; head.add(m); }

  // ---- hair ----
  if (hairStyle !== 'bald') {
    const cap = mesh(K.hairCap, hairM); cap.position.set(0, 0.006, -0.02); cap.rotation.x = -0.5; cap.scale.set(1.0, 1.04, 1.04); head.add(cap);
    if (hairStyle === 'swept') {
      const quiff = mesh(K.hairBall, hairM); quiff.scale.set(1.5, 0.8, 1.3); quiff.position.set(0.02, 0.145, 0.05); quiff.rotation.z = -0.25; head.add(quiff);
    } else if (hairStyle === 'long') {
      const back = mesh(K.lock, hairM); back.scale.set(1.5, 1.2, 0.9); back.position.set(0, -0.1, -0.085); head.add(back);
      for (const sgn of [-1, 1]) { const side = mesh(K.lock, hairM); side.scale.set(0.7, 0.9, 0.7); side.position.set(sgn * 0.14, -0.08, -0.02); head.add(side); }
    } else if (hairStyle === 'bun') {
      const bun = mesh(K.hairBall, hairM); bun.position.set(0, 0.135, -0.085); head.add(bun);
    }
  }

  // ---- body ----
  const neck = mesh(K.neck, skinM); neck.position.set(0, 1.385, 0); g.add(neck);
  const torso = mesh(K.torso, outfitM); torso.position.set(0, 1.17, 0); g.add(torso);
  const hips = mesh(K.hips, pantsM); hips.scale.set(1, 0.8, 0.78); hips.position.set(0, 0.92, 0); g.add(hips);

  // outfit detail, in group space on the chest (front of the torso is ~z 0.11)
  if (outfit === 'jacket') {
    const lapelM = lit(mat(tint(shirt, 0xffffff, 0.16).getHex(), accent, glow, 0.5), 0.5);
    const shirtUnder = mat(0xe9e6f2, 0x000000, 0, 0.6);
    const v = box(0.07, 0.13, 0.006, shirtUnder); v.position.set(0, 1.3, 0.1155); g.add(v);
    for (const sgn of [-1, 1]) {
      const lap = box(0.038, 0.16, 0.009, lapelM); lap.position.set(sgn * 0.058, 1.285, 0.1175); lap.rotation.z = -sgn * 0.2; g.add(lap);
    }
    if (tie != null) {
      const tm = mat(tie, 0x000000, 0, 0.45);
      const t = box(0.026, 0.17, 0.008, tm); t.position.set(0, 1.25, 0.122); g.add(t);
      const knot = box(0.032, 0.03, 0.014, tm); knot.position.set(0, 1.343, 0.122); g.add(knot);
    }
    if (bow != null) {
      const bm = mat(0x1a1408, bow, 0.55, 0.4);
      const knot = box(0.026, 0.03, 0.02, bm); knot.position.set(0, 1.362, 0.1); g.add(knot);
      for (const sgn of [-1, 1]) { const w = box(0.05, 0.034, 0.012, bm); w.position.set(sgn * 0.04, 1.362, 0.1); w.rotation.z = sgn * 0.18; g.add(w); }
    }
  } else if (outfit === 'tee') {
    const c = mesh(K.collar, outfitM); c.rotation.x = Math.PI / 2; c.scale.set(1, 0.8, 1); c.position.set(0, 1.375, 0.012); g.add(c);
  } else if (outfit === 'hoodie') {
    const c = mesh(K.collar, outfitM); c.rotation.x = Math.PI / 2; c.scale.set(1.5, 1.3, 1.6); c.position.set(0, 1.37, -0.03); g.add(c);
    const pocket = box(0.2, 0.07, 0.01, outfitM); pocket.position.set(0, 1.0, 0.098); g.add(pocket);
  }

  // ---- arms: shoulder pivot -> upper arm -> elbow -> forearm -> hand ----
  const longSleeve = outfit !== 'tee';
  const arms = {};
  for (const sgn of [-1, 1]) {
    const armPivot = new THREE.Group();
    armPivot.position.set(sgn * 0.196, 1.34, 0.005);
    armPivot.add(mesh(K.shoulder, outfitM));
    const upper = mesh(K.upper, outfitM); upper.position.y = -0.16; armPivot.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.31; elbow.rotation.x = -0.3; armPivot.add(elbow);
    const fore = mesh(K.fore, longSleeve ? outfitM : skinM); fore.position.y = -0.13; elbow.add(fore);
    const hand = mesh(K.hand, skinM); hand.scale.set(0.8, 1.25, 0.65); hand.position.set(0, -0.285, 0.004); elbow.add(hand);
    armPivot.rotation.z = -sgn * 0.1;
    g.add(armPivot);
    arms[sgn === 1 ? 'armR' : 'armL'] = armPivot;
  }

  // ---- legs ----
  for (const sgn of [-1, 1]) {
    if (seated) {
      const thigh = mesh(K.thigh, pantsM); thigh.rotation.x = Math.PI / 2; thigh.position.set(sgn * 0.1, 0.88, 0.2); g.add(thigh);
      const knee = mesh(K.knee, pantsM); knee.position.set(sgn * 0.1, 0.88, 0.4); g.add(knee);
      const shin = mesh(K.shin, pantsM); shin.position.set(sgn * 0.1, 0.5, 0.4); g.add(shin);
      const shoe = mesh(K.shoe, shoeM); shoe.scale.set(0.95, 0.7, 2.1); shoe.position.set(sgn * 0.1, 0.05, 0.47); g.add(shoe);
    } else {
      const leg = mesh(K.leg, pantsM); leg.position.set(sgn * 0.1, 0.5, 0); g.add(leg);
      const shoe = mesh(K.shoe, shoeM); shoe.scale.set(0.95, 0.7, 2.1); shoe.position.set(sgn * 0.1, 0.045, 0.045); g.add(shoe);
    }
  }

  // hairM is exposed so the crowd stand-in actor can recolour its hair to match
  // the seat it replaces (torso.material === outfitM, head.material === skinM).
  g.userData.parts = { head, torso, hairM, mouths, ...eyeParts, ...arms };
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
export function crewPerson({ clipboard = false, rim = null, hairStyle = 'short', hair = 0x3c3c46, skin = 0xd9b48f, glasses = false } = {}) {
  const g = person({ skin, hair, shirt: 0x23232f, pants: 0x1a1a24, accent: PAL.aqua, glow: 0.12, outfit: 'hoodie', hairStyle, glasses, rim });
  const head = g.userData.parts.head;
  const gearM = mat(0x0a0a14, PAL.aqua, 0.5);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.016, 8, 24, Math.PI), gearM);
  band.position.set(0, 0.015, 0); head.add(band); // arc opens downward: ear → crown → ear
  for (const sgn of [-1, 1]) {
    const cup = cyl(0.045, 0.045, 0.035, gearM);
    cup.rotation.z = Math.PI / 2; cup.position.set(sgn * 0.158, -0.004, 0); head.add(cup);
  }
  const boom = box(0.018, 0.018, 0.13, gearM);
  boom.position.set(0.1, -0.06, 0.1); boom.rotation.set(0.15, 0.55, 0); head.add(boom);
  const micTip = sph(0.02, gearM); micTip.position.set(0.055, -0.078, 0.152); head.add(micTip);
  if (clipboard) {
    const cb = box(0.26, 0.36, 0.03, mat(0x22222e, PAL.aqua, 0.25));
    cb.position.set(-0.28, 1.05, 0.16); cb.rotation.set(0.3, 0.2, 0.1); g.add(cb);
  }
  return g;
}
