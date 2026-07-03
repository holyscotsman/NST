/* kbb-balance.cjs — headless clear-depth probe for KBB combat tuning.
 * Loads the DOM-free KBB engine and simulates many runs across three build
 * cohorts (no-build / random-build / good-build) with variable answer skill,
 * reporting the distribution of death-section. Combat balance depends on
 * enemy-HP-vs-damage and answer correctness, NOT question content, so a large
 * synthetic bank is used (bank SIZE is the separate D1 concern, deliberately
 * isolated here). No Math.random for run seeding — deterministic mulberry32.
 * Run: node kbb-balance.cjs
 */
const fs = require('fs');
(0, eval)(fs.readFileSync(require('path').join(__dirname, 'kbb.js'), 'utf8')); // -> globalThis.KBB
const KBB = globalThis.KBB;
const { createRun, drawQuestion, submitAnswer, leaveShop, startDungeon, shopBuyArtifact, CONFIG, ARTIFACTS_BY_ID } = KBB;
// sweep without editing the module: KBB_PATCH='{"maxAttacks":5,"squad":{"hp":32}}'
const PATCH = process.env.KBB_PATCH ? JSON.parse(process.env.KBB_PATCH) : null;
if (PATCH){ if (PATCH.squad) Object.assign(CONFIG.squad, PATCH.squad); for (const k in PATCH) if (k!=='squad') CONFIG[k]=PATCH[k]; }

function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

function makeBank(){ const qs=[]; let n=0; for(let d=1;d<=3;d++)for(let i=0;i<500;i++)qs.push({id:'q'+(n++),difficulty:d,domain:'storage',options:['a','b','c','d'],correctIndex:0,stem:'s',explanation:'e'}); return qs; }
function makeProvider(bank,rnd){ return { next(o){ const b=(o&&o.difficultyBand)||[1,3]; const ex=new Set((o&&o.excludeIds)||[]); const pool=bank.filter(q=>q.difficulty>=b[0]&&q.difficulty<=b[1]&&!ex.has(q.id)); if(!pool.length)return null; return {question:pool[Math.floor(rnd()*pool.length)],reason:'probe'}; } }; }
function makeCtx(seed){ const rnd=mulberry32(seed>>>0); return { rng:KBB.makeRng(seed), questions:makeProvider(makeBank(),rnd), _rnd:rnd }; }

// player buys at a shop per cohort. 'none' buys nothing; 'random' buys affordable
// offers in offered order; 'good' prefers damage/risk (mult/flat) offers first.
function shop(run,cohort,rnd){
  if(cohort==='none') return;
  let guard=0;
  while(guard++<20){
    const offers=run.shop.artifacts; if(!offers.length) break;
    if(run.squad.artifacts.length>=CONFIG.maxArtifacts) break;
    let idx=-1;
    if(cohort==='good'){
      // cheapest affordable damage/risk first, else cheapest affordable anything
      let best=-1,bestP=1e9;
      for(let i=0;i<offers.length;i++){const o=offers[i],cat=(ARTIFACTS_BY_ID[o.id]||{}).category;if(o.price<=run.squad.coins&&(cat==='damage'||cat==='risk')&&o.price<bestP){best=i;bestP=o.price;}}
      if(best<0)for(let i=0;i<offers.length;i++){const o=offers[i];if(o.price<=run.squad.coins&&o.price<bestP){best=i;bestP=o.price;}}
      idx=best;
    } else { // random: a random affordable offer
      const aff=[];for(let i=0;i<offers.length;i++)if(offers[i].price<=run.squad.coins)aff.push(i);
      if(aff.length)idx=aff[Math.floor(rnd()*aff.length)];
    }
    if(idx<0) break;
    const r=shopBuyArtifact(run,idx); if(!r.ok) break;
  }
}

function simRun(seed,cohort,p,rnd){
  const ctx=makeCtx(seed);
  const run=createRun(ctx,{seed,preRunShop:true});
  let guard=0;
  while(guard++<400){
    if(run.phase==='lost') return run.depthClearedSection; // section last cleared; died trying for the next
    if(run.section>CONFIG.fuzzSectionCap) return 99;       // survived to cap = "cleared"
    if(run.phase==='shop'){ shop(run,cohort,rnd); if(run._preRun) startDungeon(run); else leaveShop(run); continue; }
    if(run.phase==='battle'){
      const d=drawQuestion(run); const q=run.battle.question; if(!q) return run.depthClearedSection; // bank dry (won't happen here)
      const right=(typeof q.correctIndex==='number')?q.correctIndex:(q.correctIndices?q.correctIndices.slice():0);
      let chosen; if(rnd()<p) chosen=right; else { // a wrong answer
        if(Array.isArray(right)) chosen=[ (right[0]+1)%4 ]; else chosen=(right+1)%4;
      }
      // (v0.46.0 K5) agency policy a real player would use: Repair when HP is low,
      // Brace when the incoming intent would bite into a mid HP pool, else Attack.
      // Disable with KBB_NO_AGENCY=1 to probe the old answer-only behavior.
      let action='attack';
      if(!process.env.KBB_NO_AGENCY){
        // Emergency-only defense: a defensive turn spends kill-window damage, so a smart
        // player defends only when the NEXT intent would (nearly) kill and there are still
        // enough attacks left to finish the enemy afterwards.
        const sq=run.squad, b=run.battle, intent=b.enemy?(b.enemy.intent||0):0;
        const attacksLeft=b.maxAttacks-b.attackIndex;
        if(sq.hp+sq.shield<=intent+1 && attacksLeft>=3) action=(sq.maxHp-sq.hp>=sq.healPower)?'repair':'brace';
      }
      submitAnswer(run,chosen,8000,action); // neutral speed (no quickdraw bonus)
      continue;
    }
    break;
  }
  return run.depthClearedSection;
}

function pct(arr,q){ const a=arr.slice().sort((x,y)=>x-y); return a[Math.min(a.length-1,Math.floor(q*a.length))]; }
function summarize(label,vals){
  const cleared=vals.filter(v=>v===99).length, deaths=vals.filter(v=>v!==99);
  const med=deaths.length?pct(deaths,0.5):99, p25=deaths.length?pct(deaths,0.25):99, p75=deaths.length?pct(deaths,0.75):99;
  console.log(`  ${label.padEnd(14)} died at section  p25=${p25}  median=${med}  p75=${p75}   | reached cap: ${(100*cleared/vals.length).toFixed(0)}%`);
}

const N=600;
console.log(`KBB clear-depth probe — ${N} runs/cohort, maxAttacks=${CONFIG.maxAttacks}, basePower=${CONFIG.squad.basePower}, enemyBaseHp=${CONFIG.enemyBaseHp}, hpPerRound=${CONFIG.hpPerRound}, hpPerSection=${CONFIG.hpPerSection}, bossHpMult=${CONFIG.bossHpMult}`);
console.log(`  (death-section = last section fully cleared before the run ended; "reached cap" = survived all ${CONFIG.fuzzSectionCap} sections)`);
const FIXED_SKILL = process.env.KBB_SKILL ? parseFloat(process.env.KBB_SKILL) : null;
for(const cohort of ['none','random','good']){
  const vals=[]; const seedRnd=mulberry32(0xC0FFEE ^ (cohort.length*7919));
  for(let i=0;i<N;i++){ const p=(FIXED_SKILL!=null)?FIXED_SKILL:(0.78+0.17*seedRnd()); vals.push(simRun(1000+i, cohort, p, seedRnd)); }
  summarize(cohort, vals);
}

// ---- assert mode (v0.46.0 K4 gate): `KBB_ASSERT=1 node kbb-balance.cjs` ----
// Learning-integrity tune targets, fuzz-verified with the emergency agency policy:
//   * a 70%-correct player with a realistic (random-buy) build clears a median of >=3 sections
//   * a 50%-correct player still fails early (median <=2) — the ladder keeps real stakes
//   * an 85%-correct good build does NOT trivially clear the whole cap (<=50% cap-reach)
if(process.env.KBB_ASSERT){
  function probe(skill,cohort){ const vals=[]; const r=mulberry32(0xBEEF ^ (cohort.length*104729)); for(let i=0;i<300;i++){ vals.push(simRun(5000+i,cohort,skill,r)); } return vals; }
  const med=(v)=>{const d=v.filter(x=>x!==99); return d.length?pct(d,0.5):99;};
  const capPct=(v)=>100*v.filter(x=>x===99).length/v.length;
  const a=probe(0.7,'random'), b=probe(0.5,'random'), c=probe(0.85,'good');
  const okA=med(a)>=3, okB=med(b)<=2, okC=capPct(c)<=50;
  console.log(`ASSERT 70%/random median>=3: ${med(a)} ${okA?'OK':'FAIL'}`);
  console.log(`ASSERT 50%/random median<=2: ${med(b)} ${okB?'OK':'FAIL'}`);
  console.log(`ASSERT 85%/good cap-reach<=50%: ${capPct(c).toFixed(0)}% ${okC?'OK':'FAIL'}`);
  if(okA&&okB&&okC){ console.log('KBB BALANCE: ALL GREEN'); } else { console.log('KBB BALANCE: FAIL'); process.exit(1); }
}
