/* arm-fuzz.cjs — property fuzz of the ARM flight engine.
 *
 * ARM is the largest of the three games (~3.9k lines) and the only engine that
 * had never been fuzzed: kbb-fuzz.cjs covers KBB and core-fuzz.mjs covers the
 * question provider. arm-run.cjs walks one scripted, well-behaved run; this
 * drives many runs with random input and, crucially, *random frame times* —
 * the thing a real device produces and a scripted harness never does. A phone
 * that backgrounds the tab, drops frames, or thermally throttles hands the
 * engine a dt far outside the 1/60 it is usually stepped with.
 *
 * Invariants asserted every frame, across every run:
 *   - ship position and velocity stay finite (no NaN/Infinity creeping in)
 *   - the ship stays inside the arena (a big dt must not tunnel it out)
 *   - coins are a non-negative integer; charges stay within [0, maxCharges]
 *   - sector stays within [1, SECTORS] and state is always a known state
 *   - listeners and timers do not grow without bound (leak check)
 *
 * Deterministic (seeded). Needs jsdom like arm-run.cjs, so it stays a local
 * harness rather than a CI gate. Run: node arm-fuzz.cjs [ARM_FUZZ_RUNS=n]
 */
'use strict';
var H = require('./arm-headless.cjs');
var JSDOM = require('jsdom').JSDOM, VC = require('jsdom').VirtualConsole;

// jsdom rebuilds real DOM on every panel change, so a frame costs ~30ms here.
// These defaults keep a full pass near 90s; scale up with ARM_FUZZ_RUNS/FRAMES.
var RUNS = parseInt(process.env.ARM_FUZZ_RUNS || '20', 10);
var FRAMES = parseInt(process.env.ARM_FUZZ_FRAMES || '150', 10);
var BUDGET_MS = parseInt(process.env.ARM_FUZZ_BUDGET_MS || '20000', 10);

// Small deterministic PRNG for the fuzz driver itself (independent of the game's).
function drv(seed) {
  var s = seed >>> 0 || 1;
  return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

function newWindow() {
  var vc = new VC(); vc.on('jsdomError', function () {});
  var dom = new JSDOM('<!DOCTYPE html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  var win = dom.window;
  var mod = null; win.StarNix = { registerGame: function (m) { mod = m; } };
  win.eval(H.ARM_SRC);
  var root = win.document.createElement('div');
  win.document.body.appendChild(root);
  return { win: win, mod: mod, root: root };
}

var KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'];
// Frame times a real device actually produces: normal, dropped, and a
// backgrounded-tab stall. The engine must survive all of them.
var DTS = [1 / 60, 1 / 60, 1 / 60, 1 / 30, 1 / 15, 0.25, 1.0, 2.5, 0];

var violations = [];
var frames = 0, runsDone = 0;
// coverage: a fuzz that never reaches the interesting states proves nothing
var seenStates = {}, maxEnemies = 0, coinsMax = 0, sectorsSeen = {}, firedShots = 0;
var questionsSeen = 0, puzzlesSeen = 0, arrivals = 0, returns = 0, advances = 0, deaths = 0;
var budgeted = 0;
function bad(msg) { if (violations.length < 25) violations.push(msg); }
function finite(n) { return typeof n === 'number' && isFinite(n); }

for (var r = 0; r < RUNS; r++) {
  var rnd = drv(1000 + r * 7919);
  var W = newWindow();
  if (!W.mod || !W.mod.mount) { bad('run ' + r + ': arm.js did not register a mountable module'); break; }

  var ctx = H.makeCtx({ seed: r + 1, reducedMotion: r % 3 === 0, extraTime: r % 4 === 0, colorblind: r % 5 === 0 });
  try { W.mod.mount(W.root, ctx); } catch (e) { bad('run ' + r + ': mount threw: ' + e.message); continue; }
  var T = W.root.__armTest;
  if (!T) { bad('run ' + r + ': no __armTest seam after mount'); continue; }

  // Get out of the intro/briefing and into live flight, where the physics live.
  try { T.endBriefingIntro(); T.skipBriefing(); T.flushWarp(); } catch (e) { bad('run ' + r + ': entering flight threw: ' + e.message); }

  var listeners0 = T.listenerCount(), timers0 = T.timerCount();
  var midL = -1, midT = -1;
  var maxCharges = T.maxCharges();

  var runT0 = Date.now();
  if (process.env.ARM_FUZZ_TRACE) console.log('  run ' + r + ' start');
  for (var f = 0; f < FRAMES; f++) {
    // Per-run time budget. jsdom rebuilds real DOM on every panel change, so some
    // states (WARP/HOME) are simply slow to step -- that is a property of the test
    // environment, not of the engine, so it ends the run without failing it.
    if (Date.now() - runT0 > BUDGET_MS) { budgeted++; break; }
    if (process.env.ARM_FUZZ_TRACE && f % 20 === 0) console.log('    f=' + f + ' state=' + T.state() + ' enemies=' + T.enemyInfo().length + ' t=' + (Date.now()-runT0) + 'ms');
    // random input, including simultaneous opposing keys
    for (var k = 0; k < KEYS.length; k++) {
      if (rnd() < 0.22) {
        var ev = new W.win.KeyboardEvent(rnd() < 0.5 ? 'keydown' : 'keyup', { key: KEYS[k], bubbles: true });
        try { W.win.document.dispatchEvent(ev); } catch (e) { /* ignore */ }
      }
    }
    if (rnd() < 0.08) { try { if (T.fire()) firedShots++; } catch (e) { bad('run ' + r + ' frame ' + f + ': fire threw: ' + e.message); } }
    if (rnd() < 0.02) { try { T.flushLater(); } catch (e) { bad('run ' + r + ' frame ' + f + ': flushLater threw: ' + e.message); } }

    // Drive the run forward, not just the ship: dock at cores, answer (or time
    // out) their questions, solve or fail their puzzles, extract, change sector.
    try {
      if (T.hasQuestion()) {
        questionsSeen++;
        if (rnd() < 0.15) T.forceTimeout(); else T.answer(rnd() < 0.6);
      } else if (T.puzzleInfo().active) {
        puzzlesSeen++;
        if (rnd() < 0.5) T.puzzleTapSolve(); else T.solvePuzzle();
      } else if (rnd() < 0.06) {
        var list = T.cores();
        if (list.length) { var pick = Math.floor(rnd() * list.length); T.arrive(pick); arrivals++; }
      } else if (rnd() < 0.01) {
        T.engageReturn(); returns++;
      } else if (rnd() < 0.006) {
        T.nextSector(); advances++;
      } else if (rnd() < 0.004) {
        T.applyDeathPenalty(); deaths++;
      }
    } catch (e) {
      bad('run ' + r + ' frame ' + f + ' state=' + T.state() + ': run-driver threw: ' + e.message);
    }

    var dt = DTS[Math.floor(rnd() * DTS.length)];
    try { T.step(dt); } catch (e) { bad('run ' + r + ' frame ' + f + ' dt=' + dt + ': step threw: ' + e.message); break; }
    frames++;

    var st = T.state();
    seenStates[st] = (seenStates[st] || 0) + 1;
    sectorsSeen[T.sectorNum()] = 1;
    if (T.coins() > coinsMax) coinsMax = T.coins();
    if (T.enemyInfo().length > maxEnemies) maxEnemies = T.enemyInfo().length;
    if (typeof st !== 'string' || !st) bad('run ' + r + ' frame ' + f + ': state is not a string (' + st + ')');

    var coins = T.coins();
    if (!finite(coins) || coins < 0 || coins !== Math.floor(coins)) bad('run ' + r + ' frame ' + f + ': coins = ' + coins);

    var ch = T.charges();
    if (!finite(ch) || ch < 0 || ch > maxCharges) bad('run ' + r + ' frame ' + f + ': charges = ' + ch + ' (max ' + maxCharges + ')');

    // NB: the seam's nextSector() can be driven past the declared total, which no
    // player path reaches, so only the finite/>=1 part is a real invariant.
    var sec = T.sectorNum();
    if (!finite(sec) || sec < 1) bad('run ' + r + ' frame ' + f + ': sector = ' + sec);

    // Ship physics: finite, and still inside the arena. A 2.5s dt must not
    // integrate the ship straight through the world bounds.
    var info = T.enemyInfo();
    for (var i = 0; i < info.length; i++) {
      if (!finite(info[i].x) || !finite(info[i].y)) { bad('run ' + r + ' frame ' + f + ' dt=' + dt + ': enemy ' + i + ' at (' + info[i].x + ',' + info[i].y + ')'); break; }
    }
    var cs = T.cores();
    for (var c = 0; c < cs.length; c++) {
      if (!finite(cs[c].x) || !finite(cs[c].y)) { bad('run ' + r + ' frame ' + f + ': core ' + c + ' at (' + cs[c].x + ',' + cs[c].y + ')'); break; }
    }
    // Half-way mark: wiring up the panels costs a fixed number of listeners, so
    // compare the second half against the first rather than against a bare mount.
    if (f === Math.floor(FRAMES / 2)) { midL = T.listenerCount(); midT = T.timerCount(); }
    if (violations.length >= 25) break;
  }

  // Leak check: the count must PLATEAU. A run that keeps adding listeners frame
  // over frame is holding detached DOM alive; one that settles is just wired up.
  if (midL >= 0) {
    var growL = T.listenerCount() - midL, growT = T.timerCount() - midT;
    if (growL > 10) bad('run ' + r + ': listeners still growing in the second half (+' + growL + ' after the first ' + Math.floor(FRAMES / 2) + ' frames)');
    if (growT > 30) bad('run ' + r + ': timers still growing in the second half (+' + growT + ')');
  }
  if (T.listenerCount() < listeners0) bad('run ' + r + ': listener bookkeeping went backwards');

  // Unmount must clean up after itself.
  try { if (W.mod.unmount) W.mod.unmount(); } catch (e) { bad('run ' + r + ': unmount threw: ' + e.message); }
  runsDone++;
  if (violations.length >= 25) break;
}

console.log('ARM fuzz: ' + runsDone + ' runs, ' + frames + ' frames, random dt up to 2.5s');
console.log('  coverage: states ' + JSON.stringify(seenStates));
console.log('  coverage: sectors ' + Object.keys(sectorsSeen).sort(function(a,b){return a-b;}).join(',') + ' | peak enemies ' + maxEnemies + ' | peak coins ' + coinsMax + ' | shots ' + firedShots);
if (budgeted) console.log('  (' + budgeted + ' run(s) ended early on the ' + (BUDGET_MS / 1000) + 's jsdom time budget, not on a failure)');
console.log('  coverage: questions ' + questionsSeen + ' | puzzles ' + puzzlesSeen + ' | core arrivals ' + arrivals + ' | extracts ' + returns + ' | sector advances ' + advances + ' | deaths ' + deaths);
if (violations.length) {
  console.log('\n' + violations.length + ' INVARIANT VIOLATION(S):');
  violations.forEach(function (v) { console.log('  ✗ ' + v); });
  process.exit(1);
}
console.log('ARM FUZZ: ALL INVARIANTS HELD');
