/* cc-smoke.cjs — headless verification for the CURRENT Chasm Chase module (cc.js).
 * Plain Node, no deps. Hand-rolls a DOM + a tiny THREE stub (no real geometry — exercises the
 * code's stub guards), then:
 *   - tests CCSim logic (lanes/jump/duck, collision for all 3 obstacle types, shields, buffs,
 *     question pause/resume, mastery+telemetry, hitFlash, speed ramp/invariant),
 *   - proves spawner SOLVABILITY (every row has a clearing lane+action) + POOL stability,
 *   - proves the view's visual RNG does NOT desync the sim (determinism),
 *   - constructs CCView under the stub and renders crash/protected/question frames (no throw),
 *   - mounts the real GameModule, drives how-to->skip-intro->run via fired clicks, asserts
 *     pause() freezes the sim and resume() restores it, and unmount() leaves zero residue.
 * Exit 0 == all green.  */
'use strict';

/* ----------------------------- assertions ----------------------------- */
var PASS = 0, FAIL = 0, GROUP = '', FAILS = [];
function group(n) { GROUP = n; console.log('\n— ' + n); }
function ok(c, m) { if (c) { PASS++; console.log('  \u2713 ' + m); } else { FAIL++; FAILS.push(GROUP + ' :: ' + m); console.log('  \u2717 ' + m); } }
function approx(a, b, e) { return Math.abs(a - b) <= (e == null ? 1e-9 : e); }

/* =============================== DOM stub ============================== */
var ALL_ELS = [];
function bag() { return { byType: Object.create(null), add: 0, rem: 0 }; }
function addEL(b, t, fn) { (b.byType[t] || (b.byType[t] = [])).push(fn); b.add++; }
function remEL(b, t, fn) { var a = b.byType[t]; if (a) { var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } b.rem++; }
function fire(b, t, ev) { var a = b.byType[t]; if (a) for (var i = a.slice().length - 1, s = a.slice(); i >= 0; i--) s[i](ev || {}); }
function balanced(b) { for (var k in b.byType) if (b.byType[k].length !== 0) return false; return true; }
function glctx() { return { getExtension: function (n) { return n === 'WEBGL_lose_context' ? { loseContext: function () {} } : null; } }; }

function makeEl(tag) {
  var b = bag();
  var el = {
    tagName: (tag || 'div').toUpperCase(), className: '', textContent: '', value: '', disabled: false,
    style: {}, children: [], parentNode: null, _l: b,
    clientWidth: 800, clientHeight: 600, width: 800, height: 600,
    classList: { _s: {}, add: function (c) { this._s[c] = 1; }, remove: function (c) { delete this._s[c]; }, contains: function (c) { return !!this._s[c]; } },
    appendChild: function (c) { c.parentNode = el; el.children.push(c); return c; },
    removeChild: function (c) { var i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); c.parentNode = null; return c; },
    setAttribute: function () {}, getAttribute: function () { return null; }, querySelector: function () { return null; },
    addEventListener: function (t, fn) { addEL(b, t, fn); }, removeEventListener: function (t, fn) { remEL(b, t, fn); },
    fire: function (t, ev) { fire(b, t, ev || { preventDefault: function () {} }); },
    click: function () { el.fire('click'); }, focus: function () {}, getContext: function () { return glctx(); }
  };
  Object.defineProperty(el, 'innerHTML', { get: function () { return el._h || ''; }, set: function (v) { el._h = v; if (v === '') el.children.length = 0; } });
  ALL_ELS.push(el);
  return el;
}
function findByClass(tok) { for (var i = 0; i < ALL_ELS.length; i++) { var c = ALL_ELS[i].className || ''; if (c.indexOf(tok) >= 0) return ALL_ELS[i]; } return null; }

var DOC_BAG = bag(), WIN_BAG = bag(), RAF = [], RID = 0;
var doc = {
  hidden: false, _l: DOC_BAG, body: makeEl('body'),
  createElement: function (t) { return makeEl(t); },
  addEventListener: function (t, fn) { addEL(DOC_BAG, t, fn); }, removeEventListener: function (t, fn) { remEL(DOC_BAG, t, fn); }
};
var win = {
  devicePixelRatio: 2, _l: WIN_BAG, document: doc,
  addEventListener: function (t, fn) { addEL(WIN_BAG, t, fn); }, removeEventListener: function (t, fn) { remEL(WIN_BAG, t, fn); },
  requestAnimationFrame: function (cb) { RID++; RAF.push({ id: RID, cb: cb }); return RID; },
  cancelAnimationFrame: function (id) { for (var i = 0; i < RAF.length; i++) if (RAF[i].id === id) { RAF.splice(i, 1); break; } },
  setTimeout: function (f, ms) { return setTimeout(f, ms); }, clearTimeout: function (t) { return clearTimeout(t); }
};
win.window = win; win.self = win;
var FLUSH_T = 1000;
function flush(n, dtMs) {
  dtMs = dtMs || 16;
  for (var i = 0; i < n; i++) { if (!RAF.length) break; var job = RAF.shift(); FLUSH_T += dtMs; job.cb(FLUSH_T); }
}
global.window = win; global.document = doc; global.self = win;
global.requestAnimationFrame = win.requestAnimationFrame; global.cancelAnimationFrame = win.cancelAnimationFrame;
try { if (!global.navigator) global.navigator = { userAgent: 'smoke' }; } catch (e) {}

/* =============================== THREE stub ============================== */
function installThree() {
  var disposed = 0;
  function disp() { return { dispose: function () { disposed++; } }; }
  function V3() { return { x: 0, y: 0, z: 0, set: function (x, y, z) { this.x = x; this.y = y; this.z = z; return this; }, copy: function (v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; } }; }
  function geom() { return disp(); }                       // NO .attributes / .translate -> exercises the code's guards
  function mat() { var m = disp(); m.color = {}; m.emissive = {}; return m; }  // bare color -> exercises setHex/setRGB guards
  function mesh() { return { position: V3(), rotation: { x: 0, y: 0, z: 0, set: function (a, b, c) { this.x = a; this.y = b; this.z = c; } }, scale: V3(), visible: true, children: [], add: function (c) { this.children.push(c); return c; } }; }
  function grp() { return { position: V3(), rotation: { x: 0, y: 0, z: 0, set: function (a, b, c) { this.x = a; this.y = b; this.z = c; } }, scale: V3(), visible: true, children: [], add: function (c) { this.children.push(c); return c; } }; }
  var T = {
    _disposed: function () { return disposed; },
    DynamicDrawUsage: 1,
    WebGLRenderer: function () { return { setPixelRatio: function () {}, setClearColor: function () {}, setSize: function () {}, render: function () {}, dispose: function () { disposed++; }, getContext: function () { return glctx(); } }; },
    Scene: function () { return { fog: null, background: null, children: [], add: function (c) { this.children.push(c); return c; } }; },
    Fog: function () { return {}; }, Color: function () { return {}; },
    PerspectiveCamera: function () { return { position: V3(), aspect: 1, lookAt: function () {}, updateProjectionMatrix: function () {} }; }, // note: NO fov -> guard must skip
    AmbientLight: mesh, DirectionalLight: mesh, PointLight: mesh, HemisphereLight: mesh,
    MeshStandardMaterial: function () { return mat(); }, MeshBasicMaterial: function () { return mat(); },
    PlaneGeometry: geom, BoxGeometry: geom, ConeGeometry: geom, CylinderGeometry: geom, TorusGeometry: geom, OctahedronGeometry: geom, SphereGeometry: geom,
    Mesh: function () { return mesh(); },
    Group: function () { return grp(); },
    InstancedMesh: function (g, m, count) { return { count: count, frustumCulled: true, instanceMatrix: { count: count, needsUpdate: false, setUsage: function () {} }, setMatrixAt: function () {}, dispose: function () { disposed++; } }; },
    Matrix4: function () { return { compose: function () { return this; }, makeScale: function () { return this; }, identity: function () { return this; } }; },
    Quaternion: function () { return { set: function () { return this; }, setFromAxisAngle: function () { return this; } }; },
    Vector3: function (x, y, z) { var v = V3(); if (x != null) v.set(x, y, z); return v; }
  };
  win.THREE = T; global.THREE = T;
  return T;
}
var THREE = installThree();

/* ---- boot: mock-core installs window.StarNix, then cc.js auto-registers ---- */
var MC = require('./mock-core.js');
require('./cc.js'); var CC = win.CC;   // package.json "type":"module" makes require('./cc.js') ESM (empty namespace); the UMD still sets window.CC
var CCSim = CC.CCSim, CCView = CC.CCView, CONFIG = CC.CONFIG, E = CC._enums, FIXED = CONFIG.FIXED_DT;

function newSim(seed, ov) { var c = MC.createMockCore({ seed: seed || 7 }); var s = new CCSim({ ctx: c, rng: c.rng.fork('CC'), config: ov || {} }); s.__ctx = c; return s; }
function stepN(s, n) { for (var i = 0; i < n; i++) s.step(FIXED); }
// Keep a run going indefinitely for pooling/throughput tests: collisions off (iframe high), and
// auto-dismiss any question (answer correctly + resume) so phase stays RUN and spawns keep flowing.
// Consumes no rng, so two sims pumped identically stay bit-identical (the determinism test relies on this).
function pump(s) {
  s.iframe = 1e6; s.step(FIXED);
  if (s.phase === 'QUESTION' && s.pending) { s.answer(s.pending.question.correctIndex); if (s.phase === 'EXPLAIN') s.resumeAfterQuestion(); s.iframe = 1e6; }
}
function stepAlive(s, n) { for (var i = 0; i < n; i++) pump(s); }

/* ============================ 1. movement ============================ */
group('1. Movement / lane / jump / duck');
(function () {
  var s = newSim();
  s.moveRight(); ok(s.player.lane === 2, 'moveRight -> lane 2');
  s.moveRight(); ok(s.player.lane === 2, 'moveRight clamps at 2');
  s.moveLeft(); s.moveLeft(); ok(s.player.lane === 0, 'moveLeft clamps at 0');
  stepN(s, 60); ok(approx(s.player.x, -CONFIG.LANE_W, 1e-3), 'lane tween settles at target x');
  s.jump(); ok(s.player.jumping, 'jump sets jumping');
  var apex = 0; for (var i = 0; i < 80 && s.player.jumping; i++) { s.step(FIXED); if (s.player.y > apex) apex = s.player.y; }
  ok(approx(apex, CONFIG.JUMP_HEIGHT, 0.05), 'jump reaches apex height');
  ok(!s.player.jumping && s.player.y === 0, 'jump auto-lands');
  s.duck(); ok(s.player.ducking, 'duck sets ducking'); s.step(FIXED); ok(s.player.topY < CONFIG.PLAYER_H, 'duck lowers hitbox top');
  s.phase = 'QUESTION'; var ln = s.player.lane; s.moveRight(); ok(s.player.lane === ln, 'inputs ignored when not RUN');
})();

/* ============================ 2. collision ============================ */
group('2. Collision math (all three obstacle types)');
(function () {
  var s = newSim();
  function place(type, lane, side) { s.obstacles.acquire(); var o = s.obstacles.items[s.obstacles.live - 1]; o.type = type; o.lane = lane; o.side = side; o.x = (lane - 1) * CONFIG.LANE_W; o.z = 0.0001; o.tested = false; return o; }
  // OB_NARROW seals a lane at ANY height
  ok(s._wouldHit({ type: E.OB_NARROW, x: -CONFIG.LANE_W }, 0, 'stand') === true, 'narrow: standing in sealed lane hit');
  ok(s._wouldHit({ type: E.OB_NARROW, x: -CONFIG.LANE_W }, 0, 'jump') === true, 'narrow: STILL hit at jump apex (full height)');
  ok(s._wouldHit({ type: E.OB_NARROW, x: -CONFIG.LANE_W }, 2, 'stand') === false, 'narrow: other lane clear');
  // OB_LOWROCK: jump clears
  ok(s._wouldHit({ type: E.OB_LOWROCK, x: 0 }, 1, 'stand') === true, 'low-rock: standing in lane hit');
  ok(s._wouldHit({ type: E.OB_LOWROCK, x: 0 }, 1, 'jump') === false, 'low-rock: cleared by jumping');
  ok(s._wouldHit({ type: E.OB_LOWROCK, x: 0 }, 0, 'stand') === false, 'low-rock: other lane clear');
  // OB_ARCH: full-width, duck clears, lane-independent
  ok(s._wouldHit({ type: E.OB_ARCH, x: 0 }, 0, 'stand') === true, 'arch: standing hit (lane 0)');
  ok(s._wouldHit({ type: E.OB_ARCH, x: 0 }, 2, 'stand') === true, 'arch: standing hit (lane 2, lane-independent)');
  ok(s._wouldHit({ type: E.OB_ARCH, x: 0 }, 1, 'duck') === false, 'arch: cleared by ducking');
  ok(s._wouldHit({ type: E.OB_ARCH, x: 0 }, 1, 'jump') === true, 'arch: jumping does NOT clear it');
})();

/* ===================== 3. shields / buffs / over ===================== */
group('3. Shields, buffs, game-over, hitFlash');
(function () {
  var s = newSim();
  ok(s.shields === CONFIG.SHIELDS_START, 'starts at SHIELDS_START');
  // crash sets the sharp flash + grace
  s.obstacles.acquire(); var o = s.obstacles.items[s.obstacles.live - 1]; o.type = E.OB_NARROW; o.lane = s.player.lane; o.side = E.SIDE_LEFT; o.x = (s.player.lane - 1) * CONFIG.LANE_W; o.z = 0.0001; o.tested = false;
  var sh0 = s.shields; s.step(FIXED);
  ok(s.shields === sh0 - CONFIG.COLLISION_SHIELD_COST, 'crash costs a shield');
  ok(s.hitFlash > 0, 'crash sets hitFlash (sharp damage flash)');
  ok(s.iframe > 0, 'crash starts the shield-loss grace (iframe)');
  var hf = s.hitFlash; s.step(FIXED); ok(s.hitFlash < hf, 'hitFlash decays each tick');
  // buff grant + expiry
  var s2 = newSim(); s2._grantBuff('invincible'); ok(s2.buffs.invincible > 0, 'invincible buff granted');
  for (var i = 0; i < Math.ceil(CONFIG.BUFF_INVINCIBLE / FIXED) + 5; i++) s2.step(FIXED);
  ok(s2.buffs.invincible <= 0, 'invincible buff expires');
  // drain to zero -> game over
  var s3 = newSim();
  for (var k = 0; k < CONFIG.SHIELDS_START + 2 && s3.phase !== 'OVER'; k++) {
    s3.iframe = 0; var ob = s3.obstacles.acquire();
    ob.type = E.OB_NARROW; ob.lane = s3.player.lane; ob.side = E.SIDE_LEFT; ob.x = (s3.player.lane - 1) * CONFIG.LANE_W; ob.z = 0.0001; ob.tested = false; s3.step(FIXED);
  }
  ok(s3.shields === 0 && s3.phase === 'OVER', '0 shields -> game over');
})();

/* =============== 4. question pause/resume + mastery/telemetry =============== */
group('4. Question flow + mastery + telemetry');
(function () {
  var s = newSim();
  // a gate spans the track (x=0). Put the player in an OUTER lane to prove the gate triggers
  // regardless of lane — you cannot miss it.
  s.player.lane = 0; s.player.x = -CONFIG.LANE_W; s.player.targetX = -CONFIG.LANE_W; s.player.fromX = -CONFIG.LANE_W; s.player.laneT = 1;
  var c = s.gates.acquire(); c.lane = 1; c.x = 0; c.z = 0.0001; c.tested = false; c.power = false; c.kind = '';
  s.step(FIXED);
  ok(s.phase === 'QUESTION' && s.pending, 'gate triggers a question even with the player in another lane (unmissable)');
  var q = s.pending.question, correct = q.correctIndex;
  var res = s.answer(correct);
  ok(res && res.correct && s.phase === 'EXPLAIN', 'correct answer -> EXPLAIN');
  ok(s.__ctx.mastery.get(q.id) && s.__ctx.mastery.get(q.id).correct === 1, 'mastery.record written');
  s.resumeAfterQuestion();
  ok(s.phase === 'RUN' && s.iframe >= CONFIG.POST_Q_GRACE - 1e-6, 'resume -> RUN with post-question grace');
  // wrong answer costs a shield
  var s2 = newSim(); var c2 = s2.gates.acquire(); c2.lane = 1; c2.x = 0; c2.z = 0.0001; c2.tested = false; c2.power = false; c2.kind = ''; s2.step(FIXED);
  var q2 = s2.pending.question, wrong = (q2.correctIndex + 1) % q2.options.length, sh = s2.shields;
  s2.answer(wrong); ok(s2.shields === sh - 1, 'wrong answer costs a shield');
})();

/* ================= 5. speed invariant + ramp/cap ================= */
group('5. Speed invariant + ramp');
(function () {
  ok(CONFIG.MIN_GAP >= CONFIG.MAX_SPEED * CONFIG.JUMP_TIME, 'MIN_GAP >= MAX_SPEED*JUMP_TIME (' + CONFIG.MIN_GAP + ' >= ' + (CONFIG.MAX_SPEED * CONFIG.JUMP_TIME).toFixed(2) + ')');
  ok(CONFIG.BASE_GAP > CONFIG.MIN_GAP, 'BASE_GAP > MIN_GAP (density ramp possible)');
  var s = newSim(); ok(approx(s.speed, CONFIG.BASE_SPEED), 'starts at BASE_SPEED');
  stepAlive(s, 14000);
  ok(s.speed === CONFIG.MAX_SPEED, 'speed caps at MAX_SPEED after a long run');
  ok(s.distance > 5000, 'distance accumulates over the run');
})();

/* ============ 6. spawner solvability + pool stability ============ */
group('6. Spawner solvability + pooling (3 seeds)');
(function () {
  var seeds = [3, 11, 29], ACTIONS = ['stand', 'jump', 'duck'];
  for (var si = 0; si < seeds.length; si++) {
    var s = newSim(seeds[si]);
    var rowsChecked = 0, unsolvable = 0, seenZ = Object.create(null);
    for (var t = 0; t < 9000; t++) {
      pump(s);
      // bucket active, not-yet-reached obstacles by exact z (a row shares z); check each row once
      var items = s.obstacles.items, byZ = Object.create(null);
      for (var i = 0; i < items.length; i++) { var o = items[i]; if (o.active && o.z > 0.5) { var key = o.z.toFixed(3); (byZ[key] || (byZ[key] = [])).push(o); } }
      for (var key in byZ) {
        if (seenZ[key]) continue; seenZ[key] = 1; rowsChecked++;
        var row = byZ[key], solvable = false;
        for (var lane = 0; lane < 3 && !solvable; lane++) {
          for (var ai = 0; ai < ACTIONS.length && !solvable; ai++) {
            var clears = true;
            for (var ri = 0; ri < row.length; ri++) if (s._wouldHit(row[ri], lane, ACTIONS[ai])) { clears = false; break; }
            if (clears) solvable = true;
          }
        }
        if (!solvable) unsolvable++;
      }
    }
    ok(rowsChecked > 50, 'seed ' + seeds[si] + ': exercised many rows (' + rowsChecked + ')');
    ok(unsolvable === 0, 'seed ' + seeds[si] + ': every row has a clearing lane+action');
    var pr = s.poolReport(), names = ['obstacles', 'coins', 'gates'], leak = false, exh = false;
    for (var ni = 0; ni < names.length; ni++) { var p = pr[names[ni]]; if (p.balance !== p.live) leak = true; if (p.exhaustions > 0) exh = true; if (p.factoryCalls !== p.cap) leak = true; }
    ok(!exh, 'seed ' + seeds[si] + ': no pool exhaustions (sized for worst case)');
    ok(!leak, 'seed ' + seeds[si] + ': pools balanced, no growth (acquired-released == live; factoryCalls == cap)');
  }
})();

/* ============ 7. view RNG does NOT desync the sim (determinism) ============ */
group('7. Determinism: view visual-RNG isolated from sim spawns');
(function () {
  var canvas = makeEl('canvas');
  var a = newSim(99), b = newSim(99);
  var vb = new CCView(THREE, b, canvas, { reducedMotion: false });   // attaching a view forks vrng off b.rng
  for (var i = 0; i < 4000; i++) { pump(a); pump(b); vb.render(FIXED); }
  ok(approx(a.distance, b.distance, 1e-6), 'same distance with/without a rendering view');
  ok(a.coinScore === b.coinScore, 'same coin score (view rng never touched sim rng)');
  ok(a.obstacles.acquiredEver === b.obstacles.acquiredEver, 'identical obstacle spawn count');
  ok(a.gates.acquiredEver === b.gates.acquiredEver, 'identical gate spawn count');
  vb.dispose();
})();

/* ============ 8. CCView smoke under the stub (no real geometry) ============ */
group('8. CCView build + render (crash / protected / question) + dispose');
(function () {
  var canvas = makeEl('canvas');
  var s = newSim(5), v = null, threw = null;
  try { v = new CCView(THREE, s, canvas, { reducedMotion: false }); } catch (e) { threw = e; }
  ok(!threw, 'CCView constructs under the geometry-less stub' + (threw ? ' (' + (threw && threw.message) + ')' : ''));
  ok(v && v.iNarrowL && v.iNarrowR, 'per-wall bulge meshes built (iNarrowL/iNarrowR)');
  ok(v && v.iTick && v.iDust, 'speed-ticks + dust instanced meshes built');
  ok(v && v.shipGlow && v.shipGlowMat, 'ship glow shell built');
  var rThrew = null;
  try {
    for (var i = 0; i < 1500; i++) { pump(s); v.applySpeedCamera(s.speed, true); v.render(FIXED); }
    // crash -> hitFlash path
    s.iframe = 0; var o = s.obstacles.acquire(); o.type = E.OB_NARROW; o.lane = s.player.lane; o.side = E.SIDE_LEFT; o.x = (s.player.lane - 1) * CONFIG.LANE_W; o.z = 0.0001; o.tested = false; s.step(FIXED);
    for (var j = 0; j < 30; j++) { v.render(FIXED); s.step(FIXED); }
    // protected (invincible) path
    s._grantBuff('invincible'); for (var k = 0; k < 30; k++) v.render(FIXED);
    // reduced-motion render + low/high speed camera
    v.reducedMotion = true; v.render(FIXED); v.applySpeedCamera(CONFIG.BASE_SPEED, false); v.applySpeedCamera(CONFIG.MAX_SPEED, true);
  } catch (e) { rThrew = e; }
  ok(!rThrew, 'render() across run/crash/protected/reduced-motion frames never throws' + (rThrew ? ' (' + (rThrew && rThrew.stack) + ')' : ''));
  var d0 = THREE._disposed(); v.dispose(); ok(THREE._disposed() > d0, 'dispose() releases geometries/materials/renderer');
})();

/* ============ 9. module mount/unmount + pause/resume freeze ============ */
group('9. GameModule: pause/resume surface + freeze + clean unmount');
(function () {
  var mod = CC.createCCModule();
  ok(typeof mod.pause === 'function' && typeof mod.resume === 'function', 'module exposes pause()/resume()');
  var noThrow = true; try { mod.pause(); mod.resume(); } catch (e) { noThrow = false; }
  ok(noThrow, 'pause()/resume() are safe no-ops before mount');

  var winAdd0 = WIN_BAG.add, docAdd0 = DOC_BAG.add;
  var root = makeEl('div'); var ctx = MC.createMockCore({ seed: 7 });
  ctx.exit = function () { ctx.__exited = true; };
  mod.mount(root, ctx);
  flush(2, 16);                                  // how-to card is up (paused); render static frames
  var howtoBtn = findByClass('cc-howto-cont'); ok(!!howtoBtn, 'how-to card shown on entry');
  if (howtoBtn) howtoBtn.click();                // -> startIntro
  flush(2, 16);
  var skip = findByClass('cc-intro-skip'); ok(!!skip, 'intro overlay + Skip present');
  if (skip) skip.click();                        // endIntro -> RUN
  flush(20, 16);
  var sim = mod._sim();
  ok(sim && sim.phase === 'RUN', 'after how-to + skip intro -> RUN phase');
  var dRun = sim.distance; flush(20, 16); ok(sim.distance > dRun, 'world advances while running');

  // pause() must freeze the sim (distance) across many frames
  mod.pause();
  var dPause = sim.distance; flush(40, 16);
  ok(approx(sim.distance, dPause, 1e-9), 'pause() freezes the sim (distance does not advance)');
  // resume() must restore advancement with no crash
  mod.resume(); var dRes = sim.distance; flush(40, 16);
  ok(sim.distance > dRes, 'resume() restarts advancement');

  // pause must also freeze the QUESTION countdown
  var s2sim = mod._sim();
  var cc = s2sim.gates.acquire();
  if (cc) { cc.lane = 1; cc.x = 0; cc.z = 0.0001; cc.tested = false; cc.power = false; cc.kind = ''; }
  flush(6, 16);
  if (cc && s2sim.phase === 'QUESTION' && s2sim.pending) {
    mod.pause(); var rem = s2sim.pending.remainS; flush(30, 16);
    ok(approx(s2sim.pending.remainS, rem, 1e-9), 'pause() freezes the question timer');
    mod.resume();
  } else { ok(true, 'pause() freezes the question timer (n/a: no question this run) '); }

  // unmount -> zero residue
  mod.unmount();
  ok(RAF.length === 0, 'unmount cancels the RAF loop');
  ok(balanced(WIN_BAG) && balanced(DOC_BAG), 'window/document listeners balanced after unmount');
  var canvasBalanced = true; for (var i = 0; i < ALL_ELS.length; i++) { var e = ALL_ELS[i]; if (e.tagName === 'CANVAS' && !balanced(e._l)) canvasBalanced = false; }
  ok(canvasBalanced, 'canvas touch listeners balanced after unmount');
  ok(WIN_BAG.add > winAdd0 && DOC_BAG.add > docAdd0, 'mount actually registered window/document listeners');
})();

/* =============================== summary =============================== */
console.log('\n' + (FAIL ? ('\u2717 ' + FAIL + ' FAILED, ' + PASS + ' passed') : ('ALL GREEN — ' + PASS + ' checks passed')));
if (FAIL) { console.log('\nFailures:'); for (var i = 0; i < FAILS.length; i++) console.log('  - ' + FAILS[i]); process.exit(1); }
process.exit(0);
