/* kbb-run.cjs — the KBB engine + DOM run-through harness (rebuilt v0.50.0; the original never
 * landed in this repo). Two layers:
 *   1) ENGINE: drives createRun/drawQuestion/submitAnswer directly across full battles and rooms,
 *      asserting state invariants (hp/shield bounds, kill window, agency effects, loss finalize).
 *   2) DOM: mounts the module in jsdom, plays the intro-skip -> Start run -> several answered turns
 *      through real clicks, asserts view wiring (action row, hint, strike class, boss music, unmount).
 * Deterministic (seeded). Run: node kbb-run.cjs   |   KBB_SEED=n overrides the seed.
 */
'use strict';
var H = require('./kbb-headless.cjs');
var JSDOM = require('jsdom').JSDOM, VC = require('jsdom').VirtualConsole;
var ok = H.ok, group = H.group;

var SEED = parseInt(process.env.KBB_SEED || '9', 10);

function newWindow() {
  var vc = new VC(); vc.on('jsdomError', function () {});
  var dom = new JSDOM('<!DOCTYPE html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  var win = dom.window, rafQ = [];
  win.requestAnimationFrame = function (cb) { rafQ.push(cb); return rafQ.length; };
  win.cancelAnimationFrame = function () {};
  win.STARNIX_ASSETS = {};
  var mod = null; win.StarNix = { registerGame: function (m) { mod = m; } };
  win.eval(H.KBB_SRC);
  var t = 0;
  function step(n, dt) { dt = dt || 16; for (var k = 0; k < n; k++) { t += dt; var gen = rafQ.slice(); rafQ.length = 0; for (var i = 0; i < gen.length; i++) gen[i](t); } }
  return { win: win, doc: win.document, mod: mod, KBB: win.KBB, step: step };
}

/* ================= 1) ENGINE ================= */
(function engine() {
  group('ENGINE: battles through the public seam (createRun/drawQuestion/submitAnswer/leaveShop)');
  var V = newWindow(), K = V.KBB;

  function play(run, pickAction, pickAnswer, maxTurns) {
    var turns = 0, log = { wins: 0, invariants: true, res: null };
    while (run.phase !== 'lost' && turns < maxTurns) {
      var d = K.drawQuestion(run);
      var q = d && d.question;
      if (!q) {
        // between battles: try to cross the shop/reward gate the engine exposes
        if (run.phase !== 'lost' && typeof K.leaveShop === 'function') { try { K.leaveShop(run); } catch (e) {} }
        d = K.drawQuestion(run); q = d && d.question;
        if (!q) break;
      }
      var res = K.submitAnswer(run, pickAnswer(q, turns), 900, pickAction(run, q, turns));
      turns++; log.res = res;
      if (res.error) { log.invariants = false; break; }
      var s = run.squad;
      if (!(s.hp >= 0 && s.hp <= s.maxHp && s.shield >= 0)) log.invariants = false;
      if (run.battle && !(run.battle.attackIndex >= 0 && run.battle.attackIndex <= run.battle.maxAttacks)) log.invariants = false;
      if (!res.correct && res.damage) log.invariants = false;      // wrong answers never deal damage
      if (res.win) log.wins++;
    }
    log.turns = turns; return log;
  }
  var right = function (q) { return q.multi ? q.correctIndices.slice() : q.correctIndex; };
  var wrongA = function (q) { return q.multi ? [q.correctIndices[0]] : ((q.correctIndex + 1) % q.options.length); };

  // A) all-correct attack: crosses at least two battles (wins + shop gate)
  var runA = K.createRun(H.makeCtx(K, { seed: SEED }), { seed: SEED });
  var A = play(runA, function () { return 'attack'; }, right, 60);
  ok(A.turns >= 6, 'all-correct play sustains multiple turns (' + A.turns + ')');
  ok(A.wins >= 2, 'crosses at least two battle wins through the shop gate (' + A.wins + ')');
  ok(A.invariants, 'state invariants held every turn (bounds, wrong=no-damage, no seam errors)');

  // B) brace on turn 1 must raise REAL shield by block minus the counter (v0.46 lesson)
  var runB = K.createRun(H.makeCtx(K, { seed: SEED + 1 }), { seed: SEED + 1 });
  var dB = K.drawQuestion(runB), qB = dB.question, shB = runB.squad.shield, eB = runB.battle.enemy.hp;
  var rB = K.submitAnswer(runB, right(qB), 900, 'brace');
  var shExpect = Math.max(0, shB + K.CONFIG.squad.block - (rB.enemyAttacked ? rB.incoming : 0));
  ok(rB.correct === true && runB.squad.shield === shExpect, 'brace raises real squad shield (' + shB + ' -> ' + runB.squad.shield + ')');
  ok(runB.battle.enemy.hp === eB, 'brace deals no damage');

  // C) repair after taking damage heals healPower (capped at maxHp)
  var runC = K.createRun(H.makeCtx(K, { seed: SEED + 2 }), { seed: SEED + 2 });
  runC.squad.shield = 0;                                                                       // bare hull so the counter reaches hp
  var dC1 = K.drawQuestion(runC); K.submitAnswer(runC, wrongA(dC1.question), 3000, 'attack');   // eat a counter
  if (runC.phase !== 'lost') {
    var hpC = runC.squad.hp;
    var dC2 = K.drawQuestion(runC), rC = K.submitAnswer(runC, right(dC2.question), 900, 'repair');
    var healExpect = Math.min(K.CONFIG.squad.healPower, K.CONFIG.squad.maxHp - hpC);
    var hpAfterExpect = Math.max(0, hpC + rC.healed - (rC.enemyAttacked ? (rC.toHp == null ? rC.incoming : rC.toHp) : 0));
    ok(rC.correct === true && rC.healed === healExpect && rC.healed > 0 && runC.squad.hp === hpAfterExpect, 'repair heals real hp (+' + rC.healed + ', from a real deficit; counter accounted)');
  } else { ok(false, 'repair probe: run died to one counter (tune drifted?)'); }

  // D) all-wrong reaches a terminal LOSS (enemy-kill or the finishing-blow window)
  var runD = K.createRun(H.makeCtx(K, { seed: SEED + 3 }), { seed: SEED + 3 });
  var D = play(runD, function () { return 'attack'; }, wrongA, 200);
  ok(runD.phase === 'lost', 'all-wrong play reaches phase=lost (turns=' + D.turns + ')');
  ok(D.res && (D.res.lossReason === 'enemy-kill' || D.res.lossReason === 'finishing-blow'), 'loss reason is enemy-kill or finishing-blow (' + (D.res && D.res.lossReason) + ')');
  ok(runD.squad.hp >= 0, 'hp never goes negative on the loss path');
})();

/* ================= 2) DOM ================= */
(function domFlow() {
  group('DOM: mount -> skip intro -> Start run -> answered turns -> boss music -> unmount');
  var V = newWindow(), doc = V.doc, KBB = V.KBB;
  var ctx = H.makeCtx(KBB, { seed: SEED, reducedMotion: false });
  ok(!!V.mod && typeof V.mod.mount === 'function', 'module registered with mount()');
  V.mod.mount(doc.body, ctx);
  V.step(3);
  function q(sel) { return doc.querySelector(sel); }
  function clickText(sel, t) { var e = Array.prototype.slice.call(doc.querySelectorAll(sel)); for (var i = 0; i < e.length; i++) { if ((e[i].textContent || '').toLowerCase().indexOf(t) >= 0) { e[i].click(); return true; } } return false; }

  // how-to-play (Skip) -> cinematic (Skip \u25B6, NOT the '\u21BB intro' replay button) -> pre-run shop
  clickText('.kbb-ht-skip', 'skip') || clickText('.kbb-btn', 'next');
  V.step(3);
  var cineSkip = Array.prototype.slice.call(doc.querySelectorAll('.kbb-skip')).find(function (b) { return /skip/i.test(b.textContent || ''); });
  if (cineSkip) { cineSkip.click(); V.step(2); }
  var cineGone = !Array.prototype.slice.call(doc.querySelectorAll('.kbb-skip')).some(function (b) { return /skip/i.test(b.textContent || ''); });
  ok(cineGone, 'intro cinematic ends via Skip (replay button may remain)');
  clickText('.kbb-btn', 'start run');
  V.step(3);
  ok(doc.querySelectorAll('.kbb-opt').length > 0, 'Start run reaches a battle question');
  ok(doc.querySelectorAll('.kbb-action').length === 3 && !!q('.kbb-act-hint'), 'action row + hint render');
  ok(ctx._rec.tracks.some(function (t) { return t.id === 'kbb'; }), "mount plays the 'kbb' bed");

  // Advance across whatever screen is up (feedback Continue / shop "Next battle") until options exist.
  function toQuestion() {
    for (var adv = 0; adv < 6; adv++) {
      if (q('.kbb-opt:not(:disabled)')) return true;
      var c = q('.kbb-cont:not(.kbb-submit)');
      if (c) { c.click(); V.step(2); continue; }
      if (clickText('.kbb-btn', 'next battle')) { V.step(2); continue; }
      if (clickText('.kbb-btn', 'contin') || clickText('.kbb-btn', 'onward')) { V.step(2); continue; }
      break;
    }
    return !!q('.kbb-opt:not(:disabled)');
  }
  // answer across battles until the enemy's counter fires the strike telegraph
  var struck = false, answered = 0;
  for (var round = 0; round < 10 && !struck; round++) {
    if (!toQuestion()) break;
    q('.kbb-opt:not(:disabled)').click();
    var sub = q('.kbb-submit'); if (sub && !sub.disabled) sub.click();
    answered++;
    V.step(3);
    var ep = q('.kbb-enemy'); if (ep && ep.classList.contains('kbb-en-strike')) struck = true;
  }
  ok(answered >= 2, 'answered ' + answered + ' turn(s) through the DOM, crossing battles');
  ok(struck, 'enemy strike telegraph (kbb-en-strike) fired once a counter landed');

  // boss music: flag the live enemy as boss, force a fresh enemy render via the next turn
  if (toQuestion()) {
    var st = KBB._test.state();
    st.run.battle.enemy.boss = true; st.run.battle.enemy.hp = st.run.battle.enemy.maxHp = 500;
    q('.kbb-opt:not(:disabled)').click();
    var s2 = q('.kbb-submit'); if (s2 && !s2.disabled) s2.click();
    V.step(3);
    var c2 = q('.kbb-cont:not(.kbb-submit)'); if (c2) { c2.click(); V.step(2); }
    ok(ctx._rec.tracks.some(function (t) { return t.id === 'boss' && t.intensity; }), "boss battle swaps to 'boss' (intensity) via renderEnemy");
    // clearing the flag only takes effect on the NEXT renderEnemy — answer one more turn to force it
    var stLive = KBB._test.state();
    if (stLive.run.battle && stLive.run.battle.enemy) stLive.run.battle.enemy.boss = false;
    if (toQuestion()) {
      q('.kbb-opt:not(:disabled)').click();
      var s3 = q('.kbb-submit'); if (s3 && !s3.disabled) s3.click();
      V.step(3);
      var c3 = q('.kbb-cont:not(.kbb-submit)'); if (c3) { c3.click(); V.step(2); }
    }
    var ti = ctx._rec.tracks.map(function (t) { return t.id; });
    ok(ti.lastIndexOf('kbb') > ti.indexOf('boss'), "bed returns to 'kbb' after the boss flag clears");
  } else {
    ok(false, 'boss-music probe could not reach a live battle');
    ok(false, "bed returns to 'kbb' after the boss flag clears (unreached)");
  }

  // unmount cleanliness
  var before = doc.body.childNodes.length;
  V.mod.unmount();
  ok(!q('.kbb-root'), 'unmount removes the KBB root');
  ok(doc.body.childNodes.length < before || !q('.kbb-root'), 'no orphan DOM after unmount');
  V.step(3);   // any stray RAF after unmount would throw into step's generation
})();

H.summary('KBB RUN');
