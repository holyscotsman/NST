// quality.js — graphics tiers and the runtime governor.
//
// The studio is a real-time 3D set drawn behind a DOM quiz. It has to look
// like a produced game on a workstation GPU AND still hold a steady frame rate
// on a locked-down company laptop running integrated graphics (or a VM with
// software rendering). So every expensive feature hangs off one of three tiers
// instead of being on or off:
//
//   high    discrete / Apple-silicon class — 4x MSAA, ambient occlusion,
//           real-time mirror floor, full-res bloom, 2048 shadows, DPR 2
//   medium  integrated graphics — 4x MSAA, bloom, environment-lit floor, DPR 1.5
//   low     software / very weak GPUs, or "effects off" — direct render, no
//           post chain, no shadows beyond the key, DPR 1
//
// Resolution order: ?quality= in the URL, then a saved choice, then the GPU's
// own name. After that a small governor watches frame time and steps DOWN
// (never up — flapping tiers is worse than a conservative one) if the GPU
// cannot keep up. Under reduced motion nothing here changes: motion and
// quality are independent.

export const TIERS = {
  low: {
    name: 'low',
    dpr: 1, msaa: 0, maxPixels: 0,
    bloom: false, ao: false, mirror: false, grade: false,
    shadowMap: 1024, shadowType: 'basic',
    beams: 4, motes: 60, crowdDetail: 0, rimLight: false,
  },
  medium: {
    name: 'medium',
    dpr: 1.5, msaa: 4, maxPixels: 2600000,
    bloom: true, ao: false, mirror: false, grade: true,
    shadowMap: 1024, shadowType: 'pcfsoft',
    beams: 8, motes: 150, crowdDetail: 1, rimLight: true,
  },
  high: {
    name: 'high',
    dpr: 2, msaa: 4, maxPixels: 4000000,
    bloom: true, ao: true, mirror: true, grade: true,
    shadowMap: 2048, shadowType: 'pcfsoft',
    beams: 12, motes: 260, crowdDetail: 2, rimLight: true,
  },
};

const ORDER = ['low', 'medium', 'high'];

// What the GPU calls itself -> a starting tier. Deliberately coarse: this only
// picks where to START; the governor corrects from real frame times.
export function tierFromRenderer(name) {
  const r = String(name || '').toLowerCase();
  if (!r) return 'medium';
  // Software rasterisers (headless CI, locked-down VMs): never promise more.
  if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|angle \(google, vulkan.*subzero/.test(r)) return 'low';
  // Phones and tablets: capable but thermally bound and drawing a lot of pixels.
  if (/mali|adreno|powervr|videocore|apple gpu(?!.*m\d)/.test(r)) return 'medium';
  // Apple silicon (M1/M2/...) and discrete desktop GPUs.
  if (/apple m\d|nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|arc a\d|arc b\d/.test(r)) return 'high';
  // Intel integrated, AMD APUs / Vega, generic "Radeon Graphics".
  if (/intel|uhd|iris|hd graphics|radeon\(tm\)|radeon graphics|vega/.test(r)) return 'medium';
  return 'medium';
}

function readParam() {
  try {
    const q = new URLSearchParams(window.location.search).get('quality');
    return ORDER.includes(q) ? q : null;
  } catch { return null; }
}

function readSaved() {
  try {
    const v = localStorage.getItem('wwtbane.quality');
    return ORDER.includes(v) ? v : null; // 'auto' / missing / junk -> detect
  } catch { return null; }
}

// Ask the context which GPU it is. Falls back to the generic string.
export function gpuName(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return gl.getParameter(gl.RENDERER);
  } catch { return ''; }
}

// The tier a previous visit proved broken on this machine (see studio.js, the
// black-frame check). Auto never picks it, or anything above it, again.
function readBad() {
  try { const v = localStorage.getItem('wwtbane.gfxBad2'); return ORDER.includes(v) ? v : null; } catch { return null; }
}
export function rememberBadTier(name) {
  try { localStorage.setItem('wwtbane.gfxBad2', name); } catch { /* storage blocked: the fallback still holds for this visit */ }
}

// Feature switches for diagnosing a machine: ?ao=0 ?mirror=0 ?msaa=0 ?bloom=0
// ?grade=0 ?dpr=1.25 turn one thing off (or cap the pixel ratio) on top of the
// tier, so "which feature breaks it" is a URL away instead of a code change.
export function applyOverrides(tier, search) {
  let q; try { q = new URLSearchParams(search); } catch { return tier; }
  const t = { ...tier };
  for (const k of ['ao', 'mirror', 'bloom', 'grade']) if (q.get(k) === '0') t[k] = false;
  if (q.get('msaa') === '0') t.msaa = 0;
  const dpr = parseFloat(q.get('dpr'));
  if (dpr > 0.4 && dpr <= 3) t.dpr = Math.min(t.dpr, dpr);
  return t;
}

// Pick the starting tier. `effects` false ("effects off" in Settings) caps it
// at low, preserving what that switch has always meant. An AUTOMATIC choice never
// goes above medium until a person asks for high (?quality=high or Settings):
// "high" is the one tier that has only ever been verified in software, so it is
// opt-in. `autoMax` lets a test (or a future, proven build) raise that cap.
export function pickTier({ gl, effects = true, autoMax = 'low', search = '' } = {}) {
  const forced = readParam() || readSaved();
  let name = forced || tierFromRenderer(gpuName(gl));
  if (!forced && ORDER.indexOf(name) > ORDER.indexOf(autoMax)) name = autoMax;
  const bad = readBad();
  if (!forced && bad && ORDER.indexOf(name) >= ORDER.indexOf(bad)) name = ORDER[Math.max(0, ORDER.indexOf(bad) - 1)];
  if (effects === false) name = 'low';
  const tier = applyOverrides({ ...TIERS[name] }, search || (typeof window !== 'undefined' ? window.location.search : ''));
  return { tier, source: forced ? 'override' : 'detected', gpu: gpuName(gl) };
}

// Watches frame time and asks for a step down when the GPU is clearly behind.
//
// Two responses, cheapest first: lower the render resolution (the pixel count
// is almost always what hurts), and only if that is already at the floor, drop
// a whole tier. A window must be consistently slow, not a single hitch, and
// the first couple of seconds are ignored (shader compilation, texture upload).
export class Governor {
  constructor({ tier, onResolution, onTier, enabled = true } = {}) {
    this.tier = tier;
    this.onResolution = onResolution || (() => {});
    this.onTier = onTier || (() => {});
    this.enabled = enabled;
    this.scale = 1;            // multiplier on tier.dpr
    this.minScale = 0.6;       // never go below 60% of the tier's resolution
    this.warm = 2.5;           // seconds to ignore at start
    this.acc = 0; this.n = 0; this.window = 1.5;
    this.slow = 0;             // consecutive slow windows
    this.drops = 0;            // tier drops so far (capped)
  }

  // Called with the raw (unclamped) frame delta in seconds.
  sample(dt) {
    if (!this.enabled || !(dt > 0)) return;
    if (this.warm > 0) { this.warm -= Math.min(dt, 0.25); return; }
    // A backgrounded tab hands back a multi-second delta; that is not slowness.
    if (dt > 0.5) return;
    this.acc += dt; this.n++;
    if (this.acc < this.window) return;
    const avg = this.acc / this.n;
    this.acc = 0; this.n = 0;
    // 30 fps is the floor we defend: the scene is slow-moving, so a steady 30
    // is fine; below that the camera moves visibly stutter.
    if (avg > 1 / 30) this.slow++; else this.slow = Math.max(0, this.slow - 1);
    if (this.slow < 2) return;
    this.slow = 0;
    if (this.scale > this.minScale + 0.01) {
      this.scale = Math.max(this.minScale, this.scale - 0.2);
      this.onResolution(this.scale);
    } else if (this.drops < 2 && this.tier.name !== 'low') {
      this.drops++;
      const next = ORDER[Math.max(0, ORDER.indexOf(this.tier.name) - 1)];
      this.tier = { ...TIERS[next] };
      this.scale = 1;
      this.warm = 1.5;
      this.onTier(this.tier);
    }
  }
}
