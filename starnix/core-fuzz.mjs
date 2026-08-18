/* core-fuzz.mjs — property fuzz over the question provider + mastery store.
 *
 * The harnesses beside this one pin specific behaviours; this one asserts the
 * INVARIANTS that must hold whatever the caller asks for: next() must never
 * throw, never return junk, and never leak an exhibit question into a game pool
 * while any non-exhibit question exists. Pure Node (window shim) so it gates
 * every PR.
 *
 * Run: node core-fuzz.mjs
 */
import { readFileSync } from "node:fs";
globalThis.window = globalThis;
(0, eval)(readFileSync(new URL("./starnix-core.js", import.meta.url), "utf8"));
const I = globalThis.StarNix._internal;
const { makeQuestionProvider, makeMasteryStore, makeRng, DOMAINS } = I;
let viol = [];
const ck = (c,m,x) => { if(!c) viol.push(m+' '+JSON.stringify(x)); };

// --- provider: never throw, never return junk, across the option matrix ---
function Q(id,d,diff,img){ const q={id,cert:"NCP-MCI",domain:d,difficulty:diff,stem:id,options:["a","b","c","d"],correctIndex:0,explanation:"x"}; if(img)q.image=img; return q; }
const doms = DOMAINS.slice(0,4);
const pack = { id:"NCP-MCI", domains:DOMAINS, questions:[] };
for (let i=0;i<40;i++) pack.questions.push(Q("q"+i, doms[i%doms.length], (i%3)+1, i%7===0?("img"+i):null));
const m = makeMasteryStore({ mastery:{}, totals:{questionsSeen:0,correct:0,incorrect:0} }, {});
const p = makeQuestionProvider(pack, m);
let picks=0;
for (let s=1;s<=200;s++){
  const rng = makeRng(s);
  const opts = {
    rng,
    domain: (s%5===0) ? doms[s%doms.length] : null,
    band: (s%3===0) ? (s%3)+1 : null,
    allowImages: s%4===0,
    excludeIds: s%6===0 ? pack.questions.slice(0, 38).map(q=>q.id) : [],   // near-total exclusion
    shuffle: s%2===0,
  };
  let r;
  try { r = p.next(opts); } catch(e){ viol.push('provider threw: '+e.message+' opts='+JSON.stringify({d:opts.domain,b:opts.band,ai:opts.allowImages,ex:opts.excludeIds.length})); continue; }
  picks++;
  ck(r && r.question && typeof r.question.id === 'string', 'provider returned junk', {s});
  ck(typeof r.reason === 'string', 'missing reason', {s});
  if (!opts.allowImages) ck(!r.question.image, 'exhibit leaked into a game pick', {s,id:r.question.id});
  ck(Array.isArray(r.question.options) && r.question.options.length>=2, 'bad options', {s});
  // record a result so mastery evolves under us
  m.record(r.question.id, s%3!==0, {});
}
// --- mastery invariants after 200 records ---
const snap = m.snapshot ? m.snapshot() : null;
if (snap && snap.mastery) {
  for (const id in snap.mastery){ const rec=snap.mastery[id];
    ck(Number.isFinite(rec.box), 'mastery box NaN', {id,box:rec.box});
    ck(rec.box>=0 && rec.box<=10, 'mastery box out of range', {id,box:rec.box});
    ck(Number.isFinite(rec.seen) && rec.seen>=0, 'seen invalid', {id,seen:rec.seen});
  }
}
console.log(`provider: ${picks}/200 picks clean across domain/band/allowImages/near-total-exclusion combos`);
if (viol.length){ console.log('VIOLATIONS: '+viol.length); [...new Set(viol)].slice(0,8).forEach(v=>console.log('  '+v)); process.exit(1); }
console.log('CORE INVARIANTS HELD');

// --- regression (v2.5.3): a bank whose questions ALL carry an exhibit ---
// Every relaxation above keeps filtering exhibits out, so this used to leave the
// pool empty and next() threw — taking down whichever game asked for a question.
{
  const m2 = makeMasteryStore({ mastery:{}, totals:{questionsSeen:0,correct:0,incorrect:0} }, {});
  const only = (id,img)=>({id,cert:"NCP-MCI",domain:DOMAINS[0],difficulty:2,stem:id,options:["a","b","c"],correctIndex:0,explanation:"x",image:img});
  const p2 = makeQuestionProvider({ id:"X", domains:DOMAINS, questions:[only("a","i1"),only("b","i2")] }, m2);
  let threw = false, got = null;
  try { got = p2.next({ rng: makeRng(1) }); } catch (e) { threw = true; }
  if (threw || !got || !got.question) { console.log("VIOLATION: an all-exhibit bank still breaks the games"); process.exit(1); }
  console.log("all-exhibit bank: served '" + got.question.id + "' instead of throwing (the games show their exhibit notice)");
}
console.log("CORE FUZZ: ALL GREEN");
