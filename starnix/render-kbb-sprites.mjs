/* render-kbb-sprites.mjs — code-drawn KBB squad art per 07 §6 briefs (v0.47.0, K1).
 * Renders Talon / Aegis / Mender + BCM enemy + boss + 5 asteroids as 192px
 * transparent PNGs (ships point RIGHT; the view mirrors via drawBillboard) and a
 * concept sheet for eyeballing. Deterministic — no Math.random.
 * Run: node render-kbb-sprites.mjs   → sprites/*.png + kbb-squad-sheet.png
 */
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "node:fs";

const S = 192, C = S / 2;
const P = { iris: "#7855FA", iris3: "#AC9BFD", aqua: "#1FDDE9", mantis: "#92DD23", peach: "#FF6B5B", gold: "#FFC857", dark: "#101020", red: "#B3392E", white: "#F2F2F7" };

function cv() { const c = createCanvas(S, S); return [c, c.getContext("2d")]; }
function poly(g, pts, fill, stroke, lw, glow, glowCol) {
  g.save();
  if (glow) { g.shadowBlur = glow; g.shadowColor = glowCol || fill; }
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.lineJoin = "round"; g.stroke(); }
  g.restore();
}
function engineGlow(g, x, y, r, col) {
  const grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, col); grad.addColorStop(0.45, col + "aa"); grad.addColorStop(1, col + "00");
  g.save(); g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
function coreLine(g, x0, x1, y, col) {  // the shared family motif: glowing spine
  g.save(); g.shadowBlur = 10; g.shadowColor = col; g.strokeStyle = col; g.lineWidth = 3.4; g.lineCap = "round";
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.restore();
}
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---- Talon (DPS): sharp swept-forward delta, blade nose, twin forward cannons ---- */
function talon(g) {
  // speed lines behind
  g.save(); g.strokeStyle = P.aqua + "55"; g.lineWidth = 2;
  for (const dy of [-22, 0, 22]) { g.beginPath(); g.moveTo(18, C + dy); g.lineTo(52, C + dy); g.stroke(); }
  g.restore();
  engineGlow(g, 54, C - 17, 15, P.aqua); engineGlow(g, 54, C + 17, 15, P.aqua);
  // swept wings (behind hull)
  poly(g, [[64, C - 8], [40, C - 44], [98, C - 20]], P.iris, P.iris3, 2, 8, P.iris);
  poly(g, [[64, C + 8], [40, C + 44], [98, C + 20]], P.iris, P.iris3, 2, 8, P.iris);
  // main blade hull
  poly(g, [[168, C], [96, C - 18], [56, C - 12], [56, C + 12], [96, C + 18]], P.peach, P.white + "cc", 2.5, 14, P.peach);
  // facet shade
  poly(g, [[168, C], [96, C - 18], [86, C]], "#00000030", null, 0, 0);
  // twin forward cannons
  poly(g, [[150, C - 22], [104, C - 26], [104, C - 18], [144, C - 16]], P.iris3, null, 0, 6, P.aqua);
  poly(g, [[150, C + 22], [104, C + 26], [104, C + 18], [144, C + 16]], P.iris3, null, 0, 6, P.aqua);
  coreLine(g, 66, 150, C, P.aqua);
}
/* ---- Aegis (Shield): broad layered hexagon, hex plating, forward shield arc ---- */
function aegis(g) {
  engineGlow(g, 50, C - 20, 14, P.aqua); engineGlow(g, 50, C + 20, 14, P.aqua);
  // broad hex hull
  const hx = [[142, C], [116, C - 40], [66, C - 40], [46, C], [66, C + 40], [116, C + 40]];
  poly(g, hx, P.iris, P.aqua, 3, 12, P.iris);
  // layered inner hex
  poly(g, [[126, C], [106, C - 27], [72, C - 27], [58, C], [72, C + 27], [106, C + 27]], "#00000028", P.iris3, 1.6, 0);
  // hex plating lines
  g.save(); g.strokeStyle = P.iris3 + "88"; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(66, C - 40); g.lineTo(66, C + 40); g.moveTo(106, C - 33); g.lineTo(106, C + 33); g.stroke(); g.restore();
  // projected shield arc (the motif)
  g.save(); g.shadowBlur = 16; g.shadowColor = P.mantis; g.strokeStyle = P.mantis; g.lineWidth = 5; g.lineCap = "round";
  g.beginPath(); g.arc(C + 6, C, 74, -0.62, 0.62); g.stroke();
  g.strokeStyle = P.mantis + "66"; g.lineWidth = 2.4; g.beginPath(); g.arc(C + 6, C, 84, -0.5, 0.5); g.stroke();
  g.restore();
  coreLine(g, 58, 132, C, P.aqua);
}
/* ---- Mender (Medic): rounded supportive hull, soft dome, white core, cross ---- */
function mender(g) {
  // gentle aura
  const aura = g.createRadialGradient(C, C, 20, C, C, 86);
  aura.addColorStop(0, P.mantis + "2e"); aura.addColorStop(1, P.mantis + "00");
  g.fillStyle = aura; g.beginPath(); g.arc(C, C, 86, 0, Math.PI * 2); g.fill();
  engineGlow(g, 52, C - 14, 12, P.aqua); engineGlow(g, 52, C + 14, 12, P.aqua);
  // rounded hull (capsule-ish)
  g.save(); g.shadowBlur = 12; g.shadowColor = P.iris; g.fillStyle = P.iris; g.strokeStyle = P.iris3; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(58, C - 26);
  g.quadraticCurveTo(128, C - 44, 148, C); g.quadraticCurveTo(128, C + 44, 58, C + 26);
  g.quadraticCurveTo(44, C, 58, C - 26); g.closePath(); g.fill(); g.stroke(); g.restore();
  // soft dome
  g.save(); g.shadowBlur = 10; g.shadowColor = P.aqua; g.fillStyle = "#cfeef2dd";
  g.beginPath(); g.arc(112, C - 12, 15, 0, Math.PI * 2); g.fill(); g.restore();
  // white core + cross emblem
  g.save(); g.shadowBlur = 14; g.shadowColor = P.white; g.fillStyle = P.white;
  g.beginPath(); g.arc(88, C + 6, 9, 0, Math.PI * 2); g.fill(); g.restore();
  g.save(); g.shadowBlur = 12; g.shadowColor = P.mantis; g.fillStyle = P.mantis;
  g.fillRect(84.5, C - 9 + 6, 7, 30 - 12); g.fillRect(76, C + 6 - 3.5, 24, 7); g.restore();
  coreLine(g, 60, 140, C + 22, P.mantis);
}
/* ---- BCM enemy: inverted palette (peach/red), harsher angles ---- */
function bcmEnemy(g) {
  engineGlow(g, 150, C, 15, P.peach);       // faces RIGHT like the heroes; the view mirrors it
  // jagged dart hull
  poly(g, [[36, C], [96, C - 16], [126, C - 34], [150, C - 10], [150, C + 10], [126, C + 34], [96, C + 16]], P.red, P.peach, 2.6, 12, P.peach);
  // harsh wing blades
  poly(g, [[104, C - 20], [132, C - 58], [146, C - 26]], P.dark, P.peach, 2, 8, P.peach);
  poly(g, [[104, C + 20], [132, C + 58], [146, C + 26]], P.dark, P.peach, 2, 8, P.peach);
  // angry eye core
  g.save(); g.shadowBlur = 14; g.shadowColor = P.peach; g.fillStyle = P.peach;
  g.beginPath(); g.arc(84, C, 8, 0, Math.PI * 2); g.fill(); g.restore();
  coreLine(g, 60, 142, C, P.peach);
}
/* ---- BCM boss: bigger multi-pronged hulk, gold command accents ---- */
function bcmBoss(g) {
  engineGlow(g, 158, C - 26, 14, P.peach); engineGlow(g, 158, C + 26, 14, P.peach);
  // trident prongs (forward = LEFT here too? keep RIGHT-facing family: prongs left = aft? No: point RIGHT)
  poly(g, [[176, C], [120, C - 12], [120, C + 12]], P.gold, P.gold, 2, 12, P.gold);
  poly(g, [[168, C - 44], [116, C - 40], [122, C - 20]], P.red, P.peach, 2, 8, P.peach);
  poly(g, [[168, C + 44], [116, C + 40], [122, C + 20]], P.red, P.peach, 2, 8, P.peach);
  // massive hull block
  poly(g, [[124, C - 34], [58, C - 46], [26, C - 18], [26, C + 18], [58, C + 46], [124, C + 34]], P.red, P.peach, 3, 14, P.peach);
  // gold command spine + eye
  coreLine(g, 40, 132, C, P.gold);
  g.save(); g.shadowBlur = 18; g.shadowColor = P.gold; g.fillStyle = P.gold;
  g.beginPath(); g.arc(78, C, 11, 0, Math.PI * 2); g.fill(); g.restore();
  // armor plate seams
  g.save(); g.strokeStyle = P.peach + "77"; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(58, C - 46); g.lineTo(58, C + 46); g.moveTo(96, C - 40); g.lineTo(96, C + 40); g.stroke(); g.restore();
}
/* ---- asteroids: 5 seeded irregular rocks, rim-lit ---- */
function asteroid(g, seed) {
  const r = mulberry32(seed);
  const n = 9 + Math.floor(r() * 4), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rad = 52 + r() * 30;
    pts.push([C + Math.cos(a) * rad, C + Math.sin(a) * rad]);
  }
  const grad = g.createLinearGradient(C - 60, C - 60, C + 60, C + 60);
  grad.addColorStop(0, "#2b2b44"); grad.addColorStop(1, "#14141f");
  poly(g, pts, null, null, 0, 0);
  g.save(); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fillStyle = grad; g.fill();
  g.shadowBlur = 10; g.shadowColor = P.iris; g.strokeStyle = (seed % 2 ? P.iris3 : P.aqua) + "aa"; g.lineWidth = 2.2; g.stroke(); g.restore();
  // craters
  for (let k = 0; k < 4; k++) {
    const cx = C + (r() - 0.5) * 70, cy = C + (r() - 0.5) * 70, cr = 5 + r() * 9;
    g.save(); g.fillStyle = "#0c0c16aa"; g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#3a3a55"; g.lineWidth = 1; g.stroke(); g.restore();
  }
}

mkdirSync("sprites", { recursive: true });
const jobs = [
  ["kbbHero1", talon], ["kbbHero2", aegis], ["kbbHero3", mender],
  ["kbbEnemy", bcmEnemy], ["kbbBoss", bcmBoss],
  ["kbbAsteroid1", g => asteroid(g, 11)], ["kbbAsteroid2", g => asteroid(g, 23)],
  ["kbbAsteroid3", g => asteroid(g, 37)], ["kbbAsteroid4", g => asteroid(g, 51)], ["kbbAsteroid5", g => asteroid(g, 77)]
];
const out = {};
for (const [name, fn] of jobs) {
  const [c, g] = cv(); fn(g);
  const buf = c.toBuffer("image/png");
  writeFileSync("sprites/" + name + ".png", buf);
  out[name] = buf;
  console.log(name.padEnd(14), (buf.length / 1024).toFixed(1) + " KB");
}
// concept sheet (5 x 2 on dark) for Jason's eyeball pass
{
  const sheet = createCanvas(S * 5 + 60, S * 2 + 90), sg = sheet.getContext("2d");
  sg.fillStyle = "#0a0a16"; sg.fillRect(0, 0, sheet.width, sheet.height);
  sg.fillStyle = P.white; sg.font = "700 20px sans-serif";
  sg.fillText("KBB squad — Talon / Aegis / Mender · BCM enemy + boss · belt rocks (07 §6)", 16, 30);
  const { loadImage } = await import("canvas");
  for (let i = 0; i < jobs.length; i++) {
    const img = await loadImage(out[jobs[i][0]]);
    sg.drawImage(img, 10 + (i % 5) * (S + 10), 46 + Math.floor(i / 5) * (S + 20));
    sg.fillStyle = "#9a9aad"; sg.font = "12px sans-serif";
    sg.fillText(jobs[i][0], 14 + (i % 5) * (S + 10), 46 + Math.floor(i / 5) * (S + 20) + S + 14);
  }
  writeFileSync("kbb-squad-sheet.png", sheet.toBuffer("image/png"));
  console.log("kbb-squad-sheet.png written");
}
