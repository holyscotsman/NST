// greenRoom.js — the lounge between runs: sofa, lamps, a door the stage manager
// opens, and the phone Steve calls on. Returns the scene and registers its
// animated people and the door on the studio that owns the life pass.
import * as THREE from 'three';
import { PAL, mat, cyl, box, sph, pos } from './kit.js';
import { person, crewPerson } from './people.js';
import { panelTexture, artTexture } from './textures.js';

export function buildGreen(studio) {
  const s = new THREE.Scene();
  // warm lounge — dim lamp pools, lifted a touch so the room reads clearly
  s.background = new THREE.Color(0x0f0b07);
  s.add(new THREE.AmbientLight(0xffe0b0, 0.24));
  const ceil = new THREE.PointLight(0xffe6c2, 13, 24); ceil.position.set(0, 4.2, -1); s.add(ceil);
  const lampL = new THREE.PointLight(PAL.gold, 15, 11); lampL.position.set(-4.2, 2.4, -3.5); s.add(lampL);
  const lampR = new THREE.PointLight(0xffd88a, 10, 10); lampR.position.set(5.2, 2.5, -6.2); s.add(lampR);

  const panelTex = panelTexture();
  const wallMat = mat(0x6a5a40, 0, 0.9); wallMat.map = panelTex;
  const sideMat = mat(0x6a5a40, 0, 0.9); sideMat.map = panelTex;
  const floorMat = mat(0x241c12, 0, 0.95), ceilMat = mat(0x2e271c, 0, 0.95);
  s.add(pos(box(12, 0.1, 10, floorMat), 0, 0, -2));
  s.add(pos(box(12, 0.1, 10, ceilMat), 0, 4.6, -2));
  s.add(pos(box(12, 4.7, 0.15, wallMat), 0, 2.35, -7));
  s.add(pos(box(0.15, 4.7, 10, sideMat), -6, 2.35, -2));
  s.add(pos(box(0.15, 4.7, 10, sideMat), 6, 2.35, -2));
  s.add(pos(box(2.4, 0.06, 1.2, mat(0x000000, 0xffe6c2, 0.35)), 0, 4.5, -1));

  const leather = mat(0x6e4526, 0, 0.65), wood = mat(0x8a6f45, 0, 0.7), woodDk = mat(0x594430, 0, 0.75);
  const sofa = () => { const g = new THREE.Group();
    g.add(pos(box(2.4, 0.5, 1.0, leather), 0, 0.55, 0));
    g.add(pos(box(2.4, 0.7, 0.25, leather), 0, 0.9, -0.5));
    g.add(pos(box(0.25, 0.6, 1.0, leather), -1.2, 0.75, 0));
    g.add(pos(box(0.25, 0.6, 1.0, leather), 1.2, 0.75, 0));
    return g; };
  const sofaA = sofa(); sofaA.position.set(0.4, 0, -4.8); s.add(sofaA);
  const sofaB = sofa(); sofaB.position.set(4.4, 0, -1.5); sofaB.rotation.y = -Math.PI / 2; s.add(sofaB);

  const table = new THREE.Group(); table.add(pos(box(1.8, 0.12, 0.9, wood), 0, 0.5, 0));
  for (const [dx, dz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) table.add(pos(box(0.08, 0.5, 0.08, woodDk), dx, 0.25, dz));
  table.position.set(0.4, 0, -3.2); s.add(table);
  s.add(pos(box(0.28, 0.05, 0.14, mat(0x111111, 0x000000)), 0.1, 0.6, -3.1));
  s.add(pos(box(0.22, 0.01, 0.1, mat(0x000000, PAL.aqua, 1.2)), 0.1, 0.63, -3.1));

  s.add(pos(box(2.6, 1.0, 0.6, wood), -4.2, 0.5, -6.4));
  s.add(pos(cyl(0.16, 0.2, 0.5, woodDk), -4.2, 1.25, -6.3));
  s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.5)), -4.2, 1.65, -6.3));
  s.add(pos(cyl(0.04, 0.04, 2.6, woodDk), 5.2, 1.3, -6.2));
  s.add(pos(cyl(0.3, 0.22, 0.4, mat(0x000000, 0xffe0a8, 0.5)), 5.2, 2.5, -6.2));

  s.add(pos(box(1.5, 1.1, 0.06, woodDk), 0.4, 2.6, -6.9));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.95), new THREE.MeshBasicMaterial({ map: artTexture() })); art.position.set(0.4, 2.6, -6.86); s.add(art);
  const doorMat = mat(0x6e6151, 0, 0.85);
  s.add(pos(box(0.9, 3.4, 0.1, doorMat), -2.9, 1.7, -6.9));
  // The right door swings on a hinge so the stage manager can open it for the
  // "we're ready for you" beat (green:manager). Hinged at its right edge.
  const hinge = new THREE.Group(); hinge.position.set(-1.55, 1.7, -6.9);
  const swing = box(0.9, 3.4, 0.1, doorMat); swing.position.set(-0.45, 0, 0);
  hinge.add(swing); s.add(hinge);
  studio._greenDoor = hinge;
  // Warm hallway light in the doorway — hidden inside the closed door slab,
  // revealed as it swings open. Basic material so it glows unlit.
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 3.3),
    new THREE.MeshBasicMaterial({ color: 0xffe6c2 }));
  hall.position.set(-2.0, 1.7, -6.91); s.add(hall);

  // The stage manager, hidden until they open that door on "Start next round".
  const gsm = crewPerson();
  gsm.position.set(-2.15, 0, -6.4); gsm.rotation.y = -0.2; // in the doorway
  gsm.userData.parts.armR.rotation.z = 2.3; // hand up: "we're ready!"
  gsm.visible = false;
  s.add(gsm);
  studio._greenSM = gsm;

  // The contestant, waiting on the sofa between runs (same outfit as on stage).
  const you = person({ skin: 0xc98d64, hair: 0x2a1c10, shirt: 0x3e6b2d, pants: 0x2b3340, accent: PAL.mantis, glow: 0.04, seated: true, outfit: 'hoodie', hairStyle: 'short' });
  you.position.set(0.4, 0.06, -4.8); you.rotation.y = 0.2;
  s.add(you);

  studio._greenPeople = [
    { g: you, parts: you.userData.parts, role: 'player', phase: 0.9, armL: you.userData.parts.armL.rotation.z, armR: you.userData.parts.armR.rotation.z },
    { g: gsm, parts: gsm.userData.parts, role: 'greenSM', phase: 2.2, armL: gsm.userData.parts.armL.rotation.z, armR: gsm.userData.parts.armR.rotation.z },
  ];

  // The sketchy guy — Steve's man, loitering by the doors in a long coat and
  // a wide-brim hat. The "sketchyCall" scene finds him (takes.js).
  const sg = new THREE.Group();
  const coatM = mat(0x17120c, PAL.gold, 0.07, 0.85);
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
