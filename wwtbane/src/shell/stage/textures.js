// textures.js — every texture is drawn on a canvas at load: original art in
// code, no image files. Deterministic (no Math.random) so the picture is stable.
import * as THREE from 'three';

export function artTexture() {
  const c = document.createElement('canvas'); c.width = 270; c.height = 190; const x = c.getContext('2d');
  x.fillStyle = '#141428'; x.fillRect(0, 0, 270, 190);
  const cols = ['#7855FA', '#1FDDE9', '#92DD23', '#FF6B5B', '#FFC857'];
  // Deterministic layout (no Math.random) so the picture is stable.
  for (let i = 0; i < 9; i++) {
    x.fillStyle = cols[i % cols.length]; x.globalAlpha = 0.85; x.beginPath();
    x.arc(30 + (i * 53 % 210), 30 + (i * 37 % 130), 12 + (i * 7 % 26), 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Warm vertical wall paneling for the green room (wood-ish seams + grain).
export function panelTexture() {
  const W = 256, H = 256; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#8a7350'; x.fillRect(0, 0, W, H);
  for (let px = 0; px < W; px++) {
    const seam = px % 48; const shade = seam < 3 ? 0.55 : seam > 44 ? 0.75 : 1;
    const grain = 0.9 + 0.1 * Math.sin(px * 0.7);
    const v = Math.round(120 * shade * grain);
    x.fillStyle = `rgb(${v + 30},${v + 12},${Math.round(v * 0.6)})`;
    x.fillRect(px, 0, 1, H);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1.2); return t;
}

// A glowing monitor face: faint grid + scanlines, used on the console and the
// broadcast cameras (as an emissive map so it lights up).
export function screenTexture() {
  const W = 128, H = 96; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#04121a'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(31,221,233,0.5)'; x.lineWidth = 1;
  for (let gx = 8; gx < W; gx += 16) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
  for (let gy = 8; gy < H; gy += 16) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
  x.fillStyle = 'rgba(146,221,35,0.5)'; x.fillRect(10, 12, 40, 6); x.fillRect(10, 24, 26, 6);
  for (let sy = 0; sy < H; sy += 3) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, sy, W, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// The wordmark as it appears on the LED wall. Wide, because it is mapped onto a
// curved display, and drawn after the web font is ready — a canvas drawn before
// Montserrat loads silently falls back to a system sans and the title is wrong
// for the whole session.
export async function wallMarkTexture() {
  try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('300 200px Montserrat')]); } catch { /* fall back */ }
  const W = 2048, H = 660;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  // Brand type: light weights, sentence case, one flat colour per line — no
  // gradient fill and no tracked capitals (the Nutanix Design System rules).
  x.fillStyle = '#C6BEFE';
  x.font = '300 64px Montserrat, sans-serif';
  x.fillText('Who wants to be a', W / 2, 188);
  x.fillStyle = '#ffffff';
  x.font = '300 200px Montserrat, sans-serif';
  x.fillText('Nutanix', W / 2, 402);
  x.fillText('Engineer?', W / 2, 592);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true;
  return t;
}

// A soft round dot for point sprites. Points default to hard squares, which read
// as dropped pixels rather than dust.
export function softDotTexture() {
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
