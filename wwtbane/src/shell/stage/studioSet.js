// studioSet.js — assembles the main stage and hands the Studio one object to
// drive. Replaces the old 320-line _buildStudio, which built everything inline
// out of primitives and left its parts as loose fields on the Studio.
//
// The set is a stack of layers, each its own module:
//
//   lights.js     key / fill / accent rims / wash / flash
//   floor.js      the deck: glossy black glass with inlaid light
//   ledWall.js    the curved video wall and the wordmark
//   rig.js        truss, moving-head fixtures and volumetric beams
//   audience.js   the crowd, risers and phones
//   core.js       the hologram at centre stage
//
// and this file places the talent, chairs, cameras and props between them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PAL, mat, cyl, box, castShadows } from './kit.js';
import { Accent } from './accent.js';
import { buildFx } from './fx.js';
import { buildLights } from './lights.js';
import { buildFloor } from './floor.js';
import { buildLedWall } from './ledWall.js';
import { buildRig } from './rig.js';
import { buildAudience } from './audience.js';
import { buildCore } from './core.js';
import { person, setMouth, crewPerson } from './people.js';
import { loadActorKit, createActor } from './actors.js';
import { studioCamera, piggyBank } from './props.js';
import { screenTexture, wallMarkTexture, softDotTexture } from './textures.js';

// A hot seat: a pedestal, a thick cushion, a tall back with a lit edge and a
// footrest ring. Cushion top sits at y = 0.93 so the seated figures keep their pose.
function hotSeat(x, accent) {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x15162a, metalness: 0.55, roughness: 0.38 });
  const trim = accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 2.4, true);
  const post = cyl(0.07, 0.09, 0.8, mat(0x0d0e18, 0x000000, 0, 0.3, 0.9)); post.position.y = 0.4; g.add(post);
  const base = cyl(0.34, 0.38, 0.06, mat(0x0d0e18, 0x000000, 0, 0.3, 0.9)); base.position.y = 0.03; g.add(base);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.014, 8, 48), trim); baseRing.rotation.x = Math.PI / 2; baseRing.position.y = 0.065; g.add(baseRing);
  const cushion = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.14, 0.58, 4, 0.05), shell); cushion.position.y = 0.86; g.add(cushion);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.98, 0.11, 4, 0.05), shell); back.position.set(0, 1.4, -0.3); back.rotation.x = -0.1; g.add(back);
  const edge = box(0.04, 0.9, 0.012, trim); edge.position.set(0.3, 1.4, -0.245); edge.rotation.x = -0.1; g.add(edge);
  const edge2 = edge.clone(); edge2.position.x = -0.3; g.add(edge2);
  const rest = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.026, 10, 36), mat(0x0d0e18, 0x000000, 0, 0.3, 0.9));
  rest.rotation.x = Math.PI / 2; rest.position.set(0, 0.34, 0.08); g.add(rest);
  g.position.x = x;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export async function buildStudioSet(studio) {
  const tier = studio.tier, accent = studio.accent;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050c);
  scene.fog = new THREE.FogExp2(0x060716, 0.016);

  const lights = buildLights(scene, tier, accent);
  const floor = await buildFloor({ tier, accent });
  scene.add(floor.group);
  const wall = buildLedWall({ accent, markTexture: await wallMarkTexture() });
  scene.add(wall.mesh);
  const rig = buildRig({ tier, accent });
  scene.add(rig.group);
  const audience = buildAudience({ tier, accent });
  scene.add(audience.group);
  floor.hide.push(...audience.meshes, audience.chairs, audience.voteCards, audience.phones);

  // glowing monitor face shared by the panels and the broadcast cameras
  const screenTex = screenTexture();
  const screenMat = () => { const m = mat(0x0a0a16, 0xffffff, 1.4, 0.5); m.emissiveMap = screenTex; m.map = screenTex; return m; };
  studio._screenTex = screenTex; studio._screenMat = screenMat;

  const core = buildCore({ accent });
  scene.add(core.group);
  const fx = buildFx({ tier });
  scene.add(fx.group);

  // ---- the hot seats, host and contestant ----
  const seatL = hotSeat(-2.1, accent), seatR = hotSeat(2.1, accent);
  scene.add(seatL, seatR);

  // The capsule people (people.js) go in first so the set is complete at once. When the skeletal kit (actors.js:
  // ~3 MB of bodies, hair and animation) has loaded, the two on the hot seats are swapped for rigged ones. With
  // ?people=procedural, or if the kit cannot load, the capsule people stay.
  const host0 = person({ skin: 0xd9b48f, hair: 0x8f97a6, shirt: 0x2b2b40, pants: 0x20202f, accent: PAL.gold, glow: 0.03, seated: true,
    outfit: 'jacket', hairStyle: 'swept', bow: PAL.gold, eyes: 0x4a6a8a, rim: accent.color });
  host0.position.set(2.1, 0.16, 0); host0.rotation.y = -0.28;
  host0.userData.parts.armR.rotation.z = 1.0; // working the room — arm swept out, not across the face
  setMouth(host0.userData.parts, 'smile');
  castShadows(host0); scene.add(host0);

  const player0 = person({ skin: 0xc98d64, hair: 0x2a1c10, shirt: 0x3e6b2d, pants: 0x2b3340, accent: PAL.mantis, glow: 0.09, seated: true,
    outfit: 'hoodie', hairStyle: 'short', eyes: 0x3a2412, rim: accent.color });
  player0.position.set(-2.1, 0.16, 0); player0.rotation.y = 0.28;
  castShadows(player0); scene.add(player0);

  // one reusable crowd member who stands in for a seat during the random moments
  const actor = person({ skin: 0xc9a07a, hair: 0x33271a, shirt: 0x3a3f63, pants: 0x22223a, accent: PAL.iris, glow: 0.06, outfit: 'tee', rim: accent.color });
  actor.visible = false; scene.add(actor);

  // fourth wall: broadcast pedestal cameras and an operator
  for (const [cx, cz] of [[3.4, 9.5], [-5.2, 8.2], [0.2, 11.2]]) {
    const cam = studioCamera(screenMat());
    cam.position.set(cx, 0, cz); cam.rotation.y = Math.atan2(cx, cz);
    scene.add(cam);
  }
  const operator = crewPerson({ rim: accent.color, hairStyle: 'short' });
  operator.position.set(3.9, 0, 10.4); operator.rotation.y = Math.PI + 0.35;
  scene.add(operator);
  const sm = crewPerson({ clipboard: true, rim: accent.color, hairStyle: 'bun', hair: 0x2a1c3a, skin: 0xc98d64, glasses: true });
  sm.position.set(-9.2, 0, 1.4); sm.rotation.y = 1.05;
  scene.add(sm);

  // the piggy bank — tucked to stage right, out of the two-shot, snout to centre
  const pig = piggyBank(5.7, -0.9);
  pig.rotation.y = Math.atan2(0.9, 5.7); pig.scale.setScalar(0.88); pig.userData.baseScale = 0.88;
  scene.add(pig);

  // Perimeter fins framing the stage: dark metal with one thin lit edge facing
  // the deck. (They used to be solid slabs of emissive colour, which read as
  // plastic and competed with the talent.)
  const finBody = new THREE.BoxGeometry(0.12, 5.2, 0.3), finEdge = new THREE.BoxGeometry(0.012, 5.0, 0.1);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x0b0c14, roughness: 0.4, metalness: 0.8 });
  const fin = (partner, offset) => {
    const angles = [];
    for (let i = 0; i < 9; i++) {
      const a = ((i * 2 + offset) / 18) * Math.PI * 2;
      if (Math.abs(Math.cos(a)) < 0.52) continue; // keep clear of the title and the camera line
      angles.push(a);
    }
    const body = new THREE.InstancedMesh(finBody, finMat, angles.length);
    const edge = new THREE.InstancedMesh(finEdge, accent.track(new THREE.MeshStandardMaterial({ color: 0x000000, emissiveIntensity: 1 }), 2.6, partner), angles.length);
    const o = new THREE.Object3D();
    angles.forEach((a, k) => {
      o.position.set(Math.cos(a) * 9.6, 2.6, Math.sin(a) * 9.6); o.rotation.y = -a; o.updateMatrix(); body.setMatrixAt(k, o.matrix);
      o.position.set(Math.cos(a) * 9.6 - Math.cos(a) * 0.066, 2.6, Math.sin(a) * 9.6 - Math.sin(a) * 0.066); o.updateMatrix(); edge.setMatrixAt(k, o.matrix);
    });
    body.instanceMatrix.needsUpdate = true; edge.instanceMatrix.needsUpdate = true;
    const g = new THREE.Group(); g.add(body, edge); return g;
  };
  scene.add(fin(false, 0), fin(true, 1));

  // dust motes drifting through the beams
  const MOTES = tier.motes;
  const mpos = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) {
    mpos[i * 3] = (Math.random() * 2 - 1) * 6.5; mpos[i * 3 + 1] = Math.random() * 7; mpos[i * 3 + 2] = (Math.random() * 2 - 1) * 6.5;
  }
  const mgeo = new THREE.BufferGeometry(); mgeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
  const motes = new THREE.Points(mgeo, new THREE.PointsMaterial({ color: 0xffe6c2, size: 0.11, map: softDotTexture(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  motes.visible = !studio.reduced && studio.postFx;
  scene.add(motes);

  // ---- hand the studio what its life pass, crowd and vote code read ----
  const parts = (g, role, phase) => g.userData.skeletal ? { g, skeletal: true, role, phase } : ({ g, parts: g.userData.parts, role, phase, armL: g.userData.parts.armL.rotation.z, armR: g.userData.parts.armR.rotation.z });
  studio._studioPeople = [parts(host0, 'host', 0.0), parts(player0, 'player', 1.7), parts(sm, 'crew', 3.1), parts(operator, 'crew', 4.6), parts(actor, 'extra', 2.3)];
  studio._crowd = { meshes: audience.meshes, chairs: audience.chairs, seats: audience.seats, actor, event: null, nextAt: 7, restoreIdx: -1, restoreAt: 0 };
  studio._voteCards = audience.voteCards; studio._voteN = audience.seats.length; studio._vote = null;

  const skeletal = [];
  const swapInSkeletal = async () => {
    let kit = null;
    try { if (!/[?&]people=procedural/.test(window.location.search)) kit = await loadActorKit(); } catch { kit = null; }
    if (!kit) return;
    // `seatY` seats the pelvis on a cushion; without it the figure stands on the deck where the old one stood
    const make = (old, opts, seatY) => {
      const g = createActor(kit, opts);
      g.position.set(old.position.x, 0, old.position.z + (seatY ? 0.1 : 0)); g.rotation.y = old.rotation.y;
      if (seatY) g.userData.seatOn(seatY);
      scene.remove(old); scene.add(g); skeletal.push(g);
      const entry = studio._studioPeople.find((e) => e.g === old);
      if (entry) { entry.g = g; entry.skeletal = true; entry.parts = null; }
    };
    make(host0, { sex: 'm', tone: 1.3, seated: true, hair: { style: 'Hair_SimpleParted', color: 0x9aa1b0 },
      outfit: { top: 'jacket', topColor: 0x25263a, innerColor: 0xeceef7, bottomColor: 0x1b1c2b, shoeColor: 0x0c0c10 } }, 0.93);
    make(player0, { sex: 'f', tone: 1.05, seated: true, hair: { style: 'Hair_Buns', color: 0x2a1c10 },
      outfit: { top: 'hoodie', topColor: 0x3e6b2d, bottomColor: 0x2b3340, shoeColor: 0x15151a } }, 0.93);
    make(operator, { sex: 'm', tone: 1.0, hair: { style: 'Hair_Buzzed', color: 0x1a140e },
      outfit: { top: 'tee', topColor: 0x20202c, bottomColor: 0x1c1c24, shoeColor: 0x0c0c10 } }, 0);
    make(sm, { sex: 'f', tone: 1.05, hair: { style: 'Hair_Long', color: 0x2a1c3a },
      outfit: { top: 'shirt', topColor: 0x2c3a52, bottomColor: 0x1d1d28, shoeColor: 0x0c0c10 } }, 0);
  };
  swapInSkeletal();
  return {
    scene, lights, floor, wall, rig, core, audience, accent, fx, pig,
    update(dt, t, st) {
      accent.update(dt, st.reduced);
      for (const a of skeletal) a.userData.update(st.reduced ? 0 : dt);
      lights.update({ env: st.env, pulse: st.pulse, pulseColor: st.pulseColor });
      floor.update(t, { level: accent.level, pulse: st.pulse });
      wall.update(t, dt, { level: accent.level, pulse: st.pulse, reduced: st.reduced });
      rig.update(t, { spin: st.spin, reduced: st.reduced, level: accent.level * (0.45 + 0.55 * st.env) });
      core.update(t, dt, { reduced: st.reduced });
      fx.update(dt, st.reduced);
      pig.userData.update(dt, st.reduced);
      if (!st.reduced && st.postFx) {
        for (let i = 1; i < mpos.length; i += 3) { mpos[i] += dt * 0.14; if (mpos[i] > 7) mpos[i] = 0.2; }
        mgeo.attributes.position.needsUpdate = true; motes.rotation.y += dt * 0.02; motes.visible = true;
      } else motes.visible = false;
    },
    resize(w, h, dpr) { floor.resize(w, h, dpr); },
    dispose() { floor.dispose(); wall.dispose(); rig.dispose(); fx.dispose(); },
  };
}
