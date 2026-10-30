// greenRoom.js — the lounge between runs: sofa, lamps, a dressing mirror, a door
// the stage manager opens, and the phone Steve calls on. Returns the scene and
// registers its animated people and the door on the studio that owns the life
// pass.
//
// Stage D rebuilt it in the same language as the studio: charcoal walls with
// slatted wood, a cove of brand-iris light, a dressing mirror ringed with warm
// bulbs, rounded furniture. Every position the camera takes and the door /
// phone / stage-manager code rely on is unchanged.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PAL, mat, cyl, box, sph, pos, rimLit } from './kit.js';
import { person, crewPerson } from './people.js';
import { loadPeople } from './spriteActors.js';
import { screenTexture } from './textures.js';

const rbox = (w, h, d, m, r = 0.05) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m);

export function buildGreen(studio) {
  const s = new THREE.Scene();
  // warm lounge — dim lamp pools, lifted a touch so the room reads clearly
  s.background = new THREE.Color(0x0d0a12);
  s.add(new THREE.HemisphereLight(0x9a8cff, 0x2a1c12, 0.62));
  const ceil = new THREE.PointLight(0xffe6c2, 13, 24); ceil.position.set(0, 4.2, -1); s.add(ceil);
  const lampL = new THREE.PointLight(PAL.gold, 15, 11); lampL.position.set(-4.2, 2.4, -3.5); s.add(lampL);
  const lampR = new THREE.PointLight(0xffd88a, 10, 10); lampR.position.set(5.2, 2.5, -6.2); s.add(lampR);
  const cove = new THREE.PointLight(PAL.iris, 9, 14); cove.position.set(0.4, 3.9, -6.2); s.add(cove);

  // ---- shell: charcoal walls, polished deck, rug ----
  const wallMat = mat(0x2a2338, 0, 0, 0.8);
  const floorMat = mat(0x1c1728, 0, 0, 0.34, 0.25);
  const ceilMat = mat(0x120f1a, 0, 0, 0.9);
  s.add(pos(box(12, 0.1, 10, floorMat), 0, 0, -2));
  s.add(pos(box(12, 0.1, 10, ceilMat), 0, 4.6, -2));
  s.add(pos(box(12, 4.7, 0.15, wallMat), 0, 2.35, -7));
  s.add(pos(box(0.15, 4.7, 10, wallMat), -6, 2.35, -2));
  s.add(pos(box(0.15, 4.7, 10, wallMat), 6, 2.35, -2));
  // slatted wood, one instanced mesh per wall
  const slatM = mat(0x4a3424, 0, 0, 0.6);
  const slats = (n, sx, sy, sz, place) => {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(sx, sy, sz), slatM, n);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { place(o, i); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    return im;
  };
  s.add(slats(66, 0.11, 3.6, 0.06, (o, i) => o.position.set(-5.9 + i * 0.18, 1.9, -6.9)));
  s.add(slats(48, 0.06, 3.6, 0.11, (o, i) => o.position.set(-5.92, 1.9, -6.6 + i * 0.18)));
  s.add(slats(48, 0.06, 3.6, 0.11, (o, i) => o.position.set(5.92, 1.9, -6.6 + i * 0.18)));
  // the iris cove: a lit strip where the wall meets the ceiling, three sides
  const coveM = mat(0x000000, PAL.iris, 2.2);
  s.add(pos(box(11.8, 0.05, 0.05, coveM), 0, 4.45, -6.9));
  s.add(pos(box(0.05, 0.05, 9.6, coveM), -5.9, 4.45, -2.1));
  s.add(pos(box(0.05, 0.05, 9.6, coveM), 5.9, 4.45, -2.1));
  s.add(pos(box(2.4, 0.06, 1.2, mat(0x000000, 0xffe6c2, 0.35)), 0, 4.5, -1));
  // rug: a rounded slab in iris-ink under the seating
  const rug = rbox(5.2, 0.03, 3.4, mat(0x2a2150, 0, 0, 0.95), 0.015); rug.position.set(0.4, 0.06, -3.9); s.add(rug);

  // ---- seating ----
  const leather = mat(0x5a3a22, 0, 0, 0.55, 0.05);
  const sofa = () => { const g = new THREE.Group();
    g.add(pos(rbox(2.4, 0.42, 1.0, leather, 0.1), 0, 0.59, 0));        // seat cushion (top at 0.8)
    g.add(pos(rbox(2.4, 0.72, 0.28, leather, 0.1), 0, 0.94, -0.5));    // back
    g.add(pos(rbox(0.26, 0.62, 1.0, leather, 0.1), -1.2, 0.74, 0));    // arms
    g.add(pos(rbox(0.26, 0.62, 1.0, leather, 0.1), 1.2, 0.74, 0));
    g.add(pos(box(2.3, 0.14, 0.9, mat(0x1a1410, 0, 0, 0.5, 0.6)), 0, 0.17, 0)); // plinth
    return g; };
  const sofaA = sofa(); sofaA.position.set(0.4, 0, -4.8); s.add(sofaA);
  const sofaB = sofa(); sofaB.position.set(4.4, 0, -1.5); sofaB.rotation.y = -Math.PI / 2; s.add(sofaB);
  // cushions
  const cushM = mat(0x7855fa, 0, 0, 0.8);
  const c1 = rbox(0.42, 0.42, 0.14, cushM, 0.06); c1.position.set(-0.7, 1.0, -0.3); c1.rotation.set(-0.18, 0.3, 0.1); sofaA.add(c1);
  const c2 = rbox(0.42, 0.42, 0.14, mat(0x1fdde9, 0, 0, 0.8), 0.06); c2.position.set(0.95, 1.0, -0.3); c2.rotation.set(-0.18, -0.25, -0.08); sofaA.add(c2);

  // ---- the low table and the phone (the "Steve calls" camera frames it) ----
  const wood = mat(0x7a5a38, 0, 0, 0.5), steel = mat(0x16121e, 0, 0, 0.3, 0.7);
  const table = new THREE.Group();
  table.add(pos(rbox(1.8, 0.1, 0.9, wood, 0.04), 0, 0.5, 0));
  for (const [dx, dz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) table.add(pos(cyl(0.035, 0.03, 0.5, steel), dx, 0.25, dz));
  table.position.set(0.4, 0, -3.2); s.add(table);
  s.add(pos(rbox(0.28, 0.05, 0.14, mat(0x0a0a12, 0, 0, 0.3, 0.4), 0.02), 0.1, 0.6, -3.1));
  s.add(pos(box(0.22, 0.01, 0.1, mat(0x000000, PAL.aqua, 1.2)), 0.1, 0.63, -3.1));
  // a glass and a small plant on the table
  s.add(pos(cyl(0.05, 0.04, 0.11, mat(0xaaddee, 0, 0, 0.1, 0.1)), 0.75, 0.61, -3.25));
  const pot = pos(cyl(0.07, 0.055, 0.12, mat(0xe8e4f0, 0, 0, 0.6)), 0.2, 0.61, -3.4); s.add(pot);
  const leaf = mat(0x3f8a2e, 0, 0, 0.7);
  for (let i = 0; i < 5; i++) { const l = sph(0.05, leaf); l.scale.set(0.8, 1.6, 0.5); l.position.set(0.2 + Math.cos(i * 1.26) * 0.04, 0.74, -3.4 + Math.sin(i * 1.26) * 0.04); l.rotation.set(Math.sin(i * 1.26) * 0.5, 0, -Math.cos(i * 1.26) * 0.5); s.add(l); }

  // ---- credenza, lamps, a floor plant ----
  s.add(pos(rbox(2.6, 1.0, 0.6, wood, 0.03), -4.2, 0.5, -6.4));
  s.add(pos(cyl(0.16, 0.2, 0.5, steel), -4.2, 1.25, -6.3));
  const shade = mat(0x000000, 0xffe0a8, 0.55);
  s.add(pos(cyl(0.3, 0.22, 0.4, shade), -4.2, 1.65, -6.3));
  s.add(pos(cyl(0.04, 0.04, 2.6, steel), 5.2, 1.3, -6.2));
  s.add(pos(cyl(0.3, 0.22, 0.4, shade), 5.2, 2.5, -6.2));
  const fpot = pos(cyl(0.28, 0.2, 0.5, mat(0x2a2150, 0, 0, 0.5)), -5.2, 0.28, -1.2); s.add(fpot);
  for (let i = 0; i < 9; i++) {
    const l = sph(0.11, leaf); l.scale.set(0.5, 2.2, 0.3);
    const a = i * 0.7; l.position.set(-5.2 + Math.cos(a) * 0.14, 0.95, -1.2 + Math.sin(a) * 0.14);
    l.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); s.add(l);
  }

  // ---- the dressing mirror, ringed with warm bulbs (replaces the old picture) ----
  s.add(pos(rbox(1.5, 1.1, 0.06, mat(0x120e18, 0, 0, 0.5, 0.4), 0.03), 0.4, 2.6, -6.9));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.94), new THREE.MeshStandardMaterial({ color: 0x6a7090, roughness: 0.12, metalness: 1 }));
  glass.position.set(0.4, 2.6, -6.86); s.add(glass);
  const bulbM = mat(0x000000, 0xffd88a, 2.0);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), bulbM, 22);
  { const o = new THREE.Object3D(); let k = 0;
    for (let i = 0; i < 7; i++) for (const y of [3.2, 2.0]) { o.position.set(0.4 - 0.69 + i * 0.23, y, -6.84); o.updateMatrix(); bulbs.setMatrixAt(k++, o.matrix); }
    for (let i = 0; i < 4; i++) for (const x of [-0.31, 1.11]) { o.position.set(x, 2.25 + i * 0.23, -6.84); o.updateMatrix(); bulbs.setMatrixAt(k++, o.matrix); }
  }
  s.add(bulbs);

  // ---- doors: one fixed, one that swings (green:manager) ----
  const doorMat = mat(0x2b2638, 0, 0, 0.55, 0.2);
  s.add(pos(box(0.9, 3.4, 0.1, doorMat), -2.9, 1.7, -6.9));
  // an "on air" lamp over the doors, lit warm
  s.add(pos(rbox(0.7, 0.14, 0.06, mat(0x000000, PAL.peach, 1.1), 0.03), -2.2, 3.62, -6.88));
  // The right door swings on a hinge so the stage manager can open it for the
  // "we're ready for you" beat. Hinged at its right edge.
  const hinge = new THREE.Group(); hinge.position.set(-1.55, 1.7, -6.9);
  const swing = box(0.9, 3.4, 0.1, doorMat); swing.position.set(-0.45, 0, 0);
  hinge.add(swing); s.add(hinge);
  studio._greenDoor = hinge;
  // Warm hallway light in the doorway — hidden inside the closed door slab,
  // revealed as it swings open. Basic material so it glows unlit.
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 3.3), new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
  hall.position.set(-2.0, 1.7, -6.91); s.add(hall);

  // a monitor on the side wall showing the live feed, as in every real green room
  const feed = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshStandardMaterial({ color: 0x0a0a16, emissive: 0xffffff, emissiveMap: screenTexture(), emissiveIntensity: 1.1, roughness: 0.4 }));
  feed.position.set(5.9, 2.7, -2.4); feed.rotation.y = -Math.PI / 2; s.add(feed);
  s.add(pos(box(0.04, 0.9, 1.5, steel), 5.93, 2.7, -2.4));

  // ---- people ----
  // The stage manager, hidden until they open that door on "Start next round".
  const gsm = crewPerson({ hairStyle: 'short' });
  gsm.position.set(-2.15, 0, -6.4); gsm.rotation.y = -0.2; // in the doorway
  gsm.userData.parts.armR.rotation.z = 2.3; // hand up: "we're ready!"
  gsm.visible = false;
  s.add(gsm);
  studio._greenSM = gsm;

  // The contestant, waiting on the sofa between runs (same outfit as on stage).
  const you = person({ skin: 0xc98d64, hair: 0x2a1c10, shirt: 0x3e6b2d, pants: 0x2b3340, accent: PAL.mantis, glow: 0.04, seated: true, outfit: 'hoodie', hairStyle: 'short', eyes: 0x3a2412 });
  you.position.set(0.4, 0.06, -4.8); you.rotation.y = 0.2;
  s.add(you);

  studio._greenPeople = [
    { g: you, parts: you.userData.parts, role: 'player', phase: 0.9, armL: you.userData.parts.armL.rotation.z, armR: you.userData.parts.armR.rotation.z },
    { g: gsm, parts: gsm.userData.parts, role: 'greenSM', phase: 2.2, armL: gsm.userData.parts.armL.rotation.z, armR: gsm.userData.parts.armR.rotation.z },
  ];

  // Swap the capsule people for rigged ones once the kit has loaded (see studioSet.js; same people, same outfits).
  (async () => {
    let people = null;
    try { people = await loadPeople(); } catch { people = null; }
    if (!people) return;
    const swap = (old, opts, seatY) => {
      const g = people.create(opts);
      g.position.set(old.position.x, 0, old.position.z + (seatY ? 0.1 : 0)); g.rotation.y = old.rotation.y; g.visible = old.visible;
      if (seatY) g.userData.seatOn(seatY);
      s.remove(old); s.add(g);
      const entry = studio._greenPeople.find((e) => e.g === old);
      if (entry) { entry.g = g; entry.skeletal = true; entry.parts = null; }
      return g;
    };
    swap(you, { sex: 'f', tone: 1.05, seated: true, hair: { style: 'Hair_Buns', color: 0x2a1c10 },
      outfit: { top: 'hoodie', topColor: 0x3e6b2d, bottomColor: 0x2b3340, shoeColor: 0x15151a } }, 0.8);
    studio._greenSM = swap(gsm, { sex: 'm', tone: 1.0, hair: { style: 'Hair_Buzzed', color: 0x1a140e },
      outfit: { top: 'tee', topColor: 0x20202c, bottomColor: 0x1c1c24, shoeColor: 0x0c0c10 }, rest: 'Idle_Rail_Call', talk: 'Idle_Rail_Call' }, 0);
  })();

  // The sketchy guy — Steve's man, loitering by the doors in a long coat and
  // a wide-brim hat. The "sketchyCall" scene finds him (takes.js).
  const sg = new THREE.Group();
  const coatM = rimLit(mat(0x17120c, PAL.gold, 0.07, 0.85), new THREE.Color(PAL.gold), { power: 3, strength: 0.4 });
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 1.15, 20), coatM);
  coat.position.y = 0.62; sg.add(coat);
  const sgHead = sph(0.17, mat(0x14100a, PAL.gold, 0.1, 0.8)); sgHead.position.y = 1.35; sg.add(sgHead);
  const brim = cyl(0.3, 0.3, 0.035, coatM); brim.position.y = 1.45; sg.add(brim);
  const crown = cyl(0.15, 0.17, 0.16, coatM); crown.position.y = 1.54; sg.add(crown);
  // (parked left of the far door, clear of the swinging one)
  sg.position.set(-3.5, 0, -6.55); sg.rotation.y = 0.55; sg.rotation.z = -0.05; // leaning, up to something
  s.add(sg);
  return s;
}
