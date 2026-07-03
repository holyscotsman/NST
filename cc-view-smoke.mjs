/* cc-view-smoke.mjs — constructs CCView against a minimal mock of THREE (r128 surface)
 * and drives the full render path. The jsdom build verifier never reaches CCView (no WebGL
 * context -> CC falls back), so runtime errors in the 3D view code are otherwise invisible.
 * This proves CCView builds, renders many frames over a live sim, runs the intro camera,
 * resizes and disposes WITHOUT THROWING. It does NOT check visual correctness (that needs a
 * real browser) — only that the view code is structurally sound. No WebGL is created. */
import fs from "fs";

// ---- minimal THREE mock -----------------------------------------------------
class Vec {
  constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  set(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; return this; }
}
class Mat4 {
  makeScale() { return this; }
  compose() { return this; }
}
class Quat {
  set() { return this; }
  setFromAxisAngle() { return this; }
}
function colorObj(hex) { return { value: hex || 0, setHex(h) { this.value = h; return this; } }; }
function tex() {
  return {
    wrapS: 0, wrapT: 0, encoding: 0, anisotropy: 0, needsUpdate: false,
    map: null, normalMap: null,
    repeat: new Vec(1, 1), offset: new Vec(0, 0),
    dispose() {}
  };
}
class Node3D {
  constructor() {
    this.position = new Vec(); this.rotation = new Vec(); this.scale = new Vec(1, 1, 1);
    this.visible = true; this.children = [];
  }
  add(c) { this.children.push(c); return this; }
}
function geom() { return { dispose() {} }; }
function material(opts) {
  opts = opts || {};
  return {
    color: colorObj(opts.color), emissive: colorObj(opts.emissive),
    emissiveIntensity: opts.emissiveIntensity, roughness: opts.roughness, metalness: opts.metalness,
    map: null, normalMap: null, normalScale: new Vec(1, 1),
    dispose() {}
  };
}
function instanceMatrix() {
  return { count: 0, needsUpdate: false, setUsage() {} };
}
class InstancedMesh extends Node3D {
  constructor(g, m, count) { super(); this.geometry = g; this.material = m; this.count = count; this.frustumCulled = true; this.instanceMatrix = instanceMatrix(); this.instanceMatrix.count = count; }
  setMatrixAt() {}
  dispose() {}
}
class Renderer {
  constructor() {}
  setPixelRatio() {} setSize() {} setClearColor() {} render() {} dispose() {}
  getContext() { return null; }
}
const THREE = {
  // constants
  sRGBEncoding: 1, RepeatWrapping: 1000, MirroredRepeatWrapping: 1002, DynamicDrawUsage: 35048,
  // math
  Vector3: Vec, Quaternion: Quat, Matrix4: Mat4,
  // scene graph
  Scene: class extends Node3D { constructor() { super(); this.fog = null; this.background = null; } },
  Group: Node3D, Mesh: class extends Node3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } },
  InstancedMesh,
  PerspectiveCamera: class { constructor() { this.position = new Vec(); this.aspect = 1; } lookAt() {} updateProjectionMatrix() {} },
  // lights
  HemisphereLight: class extends Node3D {}, DirectionalLight: class extends Node3D {},
  AmbientLight: class extends Node3D {}, PointLight: class extends Node3D {},
  // materials / color / fog
  MeshStandardMaterial: function (o) { return material(o); },
  MeshBasicMaterial: function (o) { return material(o); },
  Color: function (h) { return colorObj(h); },
  Fog: function () { return {}; },
  // geometry
  PlaneGeometry: geom, BoxGeometry: geom, ConeGeometry: geom, CylinderGeometry: geom,
  TorusGeometry: geom, CircleGeometry: geom, OctahedronGeometry: geom, SphereGeometry: geom, RingGeometry: geom, BufferGeometry: geom,
  // textures / renderer
  TextureLoader: class { load(url) { (globalThis.__texLoads || (globalThis.__texLoads = [])).push(url); return tex(); } },
  WebGLRenderer: Renderer
};

// ---- load cc.js -------------------------------------------------------------
globalThis.window = globalThis;
globalThis.window.devicePixelRatio = 2;
// Provide (mock) assets so _rockMat sets .map/.normalMap and the texture-scroll branches
// (floor/wall/surface offset animation) are actually exercised — TextureLoader returns a mock
// texture regardless of URL, so any truthy string works. Without this those branches are skipped.
globalThis.window.STARNIX_ASSETS = { ccRock: "mock://rock", ccRockN: "mock://rockN", ccSky: "mock://sky", ccSurface: "mock://surface" };
(0, eval)(fs.readFileSync(new URL("./cc.js", import.meta.url), "utf8"));
const CC = globalThis.window.CC;

let fails = 0; const errs = [];
function ok(name, cond) { console.log((cond ? "  \u2713 " : "  \u2717 ") + name); if (!cond) fails++; }

// mock canvas
const canvas = { width: 1280, height: 720, clientWidth: 1280, clientHeight: 720, getContext() { return {}; } };

console.log("CCView smoke (mock THREE — builds, renders, intro, resize, dispose without throwing):");

let view = null, buildErr = null;
const sim = new CC.CCSim({ rng: CC.makeFallbackRng(7) });
try { view = new CC.CCView(THREE, sim, canvas, { reducedMotion: false }); }
catch (e) { buildErr = e; }
ok("CCView constructs", !buildErr && !!view);
ok("planet rim loads the ccSurface texture (distinct from canyon rock)", (globalThis.__texLoads || []).includes("mock://surface"));
if (buildErr) errs.push(buildErr);

if (view) {
  let runErr = null;
  try {
    // intro camera sweep
    for (const t of [0, 0.25, 0.5, 0.75, 1, 1.2]) view.setIntroCamera(t);
    // drive the sim + render for a while so every render branch (obstacles/coins/gates/ship/particles/scroll) runs
    for (let f = 0; f < 600; f++) {
      sim.step(1 / 120);
      if (sim.phase === "QUESTION") { sim.pending = null; sim.phase = "RUN"; }   // skip gate questions
      else if (sim.phase === "OVER") sim.reset();
      if (f % 50 === 0) view.spawnSparks(0, 0.6, 4, 8);                          // exercise particle pool
      view.render(1 / 60);
    }
    view.resize();
  } catch (e) { runErr = e; }
  ok("intro camera + 600 rendered frames + resize run clean", !runErr);
  if (runErr) errs.push(runErr);

  // ship-descent wiring (Jason's fly-in fix): the ship starts high above the chasm and lands at its
  // gameplay height by the end of the fly-in, so the intro reads as the ship diving INTO the chasm.
  view.setIntroCamera(0); ok("intro starts the ship high above the chasm (it descends in)", (view._introLift || 0) > 10);
  view.setIntroCamera(1); ok("intro ends with the ship at its gameplay height (descent = 0)", view._introLift === 0);

  // (v0.43.0) motion-continuity feel pass: camera follow, velocity bank easing, duck ease, landing squash
  {
    const p = sim.player;
    // camera follows a lane change laterally
    p.lane = 2; p.fromX = p.x; p.targetX = sim.cfg.LANE_W; p.laneT = 0;
    for (let f = 0; f < 60; f++) { sim.step(1 / 120); sim.step(1 / 120); view.applySpeedCamera(sim.speed, true, p.x, 1 / 60); view.render(1 / 60); }
    ok("feel: camera eased laterally toward the player's lane (C1)", view._camFX > sim.cfg.LANE_W * 0.25);
    ok("feel: ship banked during the change and eased back near zero after arrival (C2)", Math.abs(view._bank) < 0.08);
    // mid-tween bank is nonzero (velocity-driven)
    p.lane = 0; p.fromX = p.x; p.targetX = -sim.cfg.LANE_W; p.laneT = 0;
    let midBank = 0;
    for (let f = 0; f < 8; f++) { sim.step(1 / 120); view.applySpeedCamera(sim.speed, true, p.x, 1 / 120); view.render(1 / 120); if (f === 6) midBank = view._bank; }
    ok("feel: bank is engaged mid lane-change, signed toward motion (C2)", midBank < -0.1);
    for (let f = 0; f < 90; f++) { sim.step(1 / 120); view.render(1 / 120); }   // settle
    // duck eases instead of snapping
    p.ducking = true; view.render(1 / 60);
    ok("feel: duck factor eases (one frame is far from fully ducked) (C3)", view._duckF > 0 && view._duckF < 0.6);
    for (let f = 0; f < 40; f++) view.render(1 / 60);
    ok("feel: duck factor converges while held (C3)", view._duckF > 0.9);
    p.ducking = false; p.duckT = 0;
    for (let f = 0; f < 40; f++) view.render(1 / 60);
    ok("feel: duck factor releases back out (C3)", view._duckF < 0.1);
    // landing triggers squash + dip
    p.jumping = true; p.y = 1.2; view.render(1 / 60);
    p.jumping = false; p.y = 0; view.render(1 / 60);
    ok("feel: landing triggers the squash impulse (C4)", view._landT > 0.7);
    ok("feel: landing dips the camera (C4)", view._landDip > 0.05);
  }

  // (v0.47.0) telegraphs + futuristic gate + duck pitch
  ok("chevron telegraph meshes built (up=jump gold, down=duck aqua)", !!view.iChevUp && !!view.iChevDown);
  ok("gate energy films built (aqua + gold)", !!view.iGateFilm && !!view.iGateFilmPow && !!view._gateFilmMat);
  {
    sim.player.ducking = true;
    for (let f = 0; f < 30; f++) view.render(1 / 60);
    ok("ducking pitches the nose down (dive-under read)", view.ship.rotation.x > 0.15);
    sim.player.ducking = false; sim.player.duckT = 0;
    for (let f = 0; f < 40; f++) view.render(1 / 60);
    ok("pitch releases when the duck ends", view.ship.rotation.x < 0.05);
  }

  let dispErr = null;
  try { view.dispose(); } catch (e) { dispErr = e; }
  ok("dispose runs clean (frees disposables, nulls scene/camera/renderer)", !dispErr);
  if (dispErr) errs.push(dispErr);
}

if (errs.length) console.log("\nERRORS:\n" + errs.map((e) => (e && e.stack) || String(e)).join("\n\n"));
console.log("\n" + (fails ? ("CC VIEW SMOKE: " + fails + " FAIL") : "CC VIEW SMOKE: ALL GREEN"));
process.exit(fails ? 1 : 0);
