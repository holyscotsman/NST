/* kbb-fuzz.cjs — property fuzz over the KBB turn engine.
 *
 * Plays 120 seeded runs with randomly-ordered 5-artifact racks (order matters:
 * the adjacency artifacts read their neighbours) mixing attack/brace/repair and
 * right/wrong answers, asserting the invariants that must hold every turn: hp
 * within [0,maxHp], no NaN/Infinity anywhere, shield/coins/basePower
 * non-negative, caps respected, damage finite.
 *
 * Needs jsdom (like kbb-run.cjs), so it is a local harness, not a CI gate.
 * Run: npm i --no-save jsdom && node kbb-fuzz.cjs
 */
const H = require('./kbb-headless.cjs');
const { JSDOM, VirtualConsole } = require('jsdom');
function mkK(){ const vc=new VirtualConsole(); vc.on('jsdomError',()=>{});
  const d=new JSDOM('<!DOCTYPE html><body></body>',{runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=d.window; w.requestAnimationFrame=()=>0; w.cancelAnimationFrame=()=>{};
  w.STARNIX_ASSETS={}; w.StarNix={registerGame(){}}; w.eval(H.KBB_SRC); return w.KBB; }
const K = mkK();
const IDS = K.ARTIFACTS ? K.ARTIFACTS.map(a=>a.id) : Object.keys(K.ARTIFACTS_BY_ID||{});
const right = q => q.multi ? q.correctIndices.slice() : q.correctIndex;
const wrong = q => { const n=q.options.length; if(q.multi) return [(q.correctIndices[0]+1)%n]; return (q.correctIndex+1)%n; };

const viol = [];
function check(cond, msg, ctx){ if(!cond) viol.push(msg+' '+JSON.stringify(ctx)); }

let runs=0, turns=0;
for (let seed=1; seed<=120; seed++){
  const r = K.createRun(H.makeCtx(K,{seed}),{seed});
  // equip a random rack (order matters for adjacency artifacts)
  const pick = [];
  for (let i=0;i<5;i++) pick.push(IDS[(seed*7+i*13) % IDS.length]);
  pick.forEach(id => { try { K.equipArtifact(r, id, true); } catch(e){} });
  runs++;
  let guard=0;
  while (r.phase !== 'lost' && r.phase !== 'won' && guard++ < 220){
    if (r.phase === 'shop'){ try { K.leaveShop(r); } catch(e){} continue; }
    const d = K.drawQuestion(r); const q = d && d.question;
    if (!q) { try { K.leaveShop(r); } catch(e){} continue; }
    const act = ['attack','brace','repair'][(seed+guard)%3];
    const ans = ((seed+guard)%4===0) ? wrong(q) : right(q);
    let res;
    try { res = K.submitAnswer(r, ans, 800+(guard*37)%9000, act); } catch(e){ viol.push('THROW seed'+seed+' turn'+guard+': '+e.message); break; }
    turns++;
    const s = r.squad, b = r.battle;
    check(s.hp >= 0, 'hp negative', {seed,guard,hp:s.hp});
    check(s.hp <= s.maxHp, 'hp exceeds maxHp', {seed,guard,hp:s.hp,max:s.maxHp});
    check(Number.isFinite(s.hp) && Number.isFinite(s.maxHp), 'hp NaN/Inf', {seed,guard,hp:s.hp,max:s.maxHp});
    check(s.shield >= 0 && Number.isFinite(s.shield), 'shield invalid', {seed,guard,sh:s.shield});
    check(s.coins >= 0 && Number.isFinite(s.coins), 'coins invalid', {seed,guard,c:s.coins});
    check(Number.isFinite(s.basePower) && s.basePower >= 0, 'basePower invalid', {seed,guard,bp:s.basePower});
    check(Number.isFinite(s.healPower), 'healPower NaN', {seed,guard,hp2:s.healPower});
    check(s.artifacts.length <= K.CONFIG.maxArtifacts, 'artifact cap exceeded', {seed,guard,n:s.artifacts.length});
    check(r.consumables.length <= (r.consumableCap||K.CONFIG.consumableCap), 'consumable cap exceeded', {seed,guard,n:r.consumables.length});
    if (res && res.damage != null) check(Number.isFinite(res.damage) && res.damage >= 0, 'damage invalid', {seed,guard,dmg:res.damage});
    if (b && b.enemy) check(Number.isFinite(b.enemy.hp), 'enemy hp NaN', {seed,guard,ehp:b.enemy.hp});
  }
}
console.log(`fuzzed ${runs} runs / ${turns} turns across the 35-artifact roster`);
if (viol.length){ console.log(`INVARIANT VIOLATIONS: ${viol.length}`); [...new Set(viol)].slice(0,8).forEach(v=>console.log('  '+v)); process.exit(1); }
console.log('ALL INVARIANTS HELD');
