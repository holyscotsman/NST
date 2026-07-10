// rng.js — deterministic seeded PRNG. Pure. Used for shareable/replayable seeds.
// A seed string reproduces the same sequence for anyone (CLAUDE.md §3).

// xmur3 string hash -> 32-bit seed generator.
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// mulberry32 PRNG -> function returning float in [0, 1).
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Make a deterministic rng from any seed string.
export function makeRng(seedStr) {
  return mulberry32(xmur3(String(seedStr))());
}

// Fisher-Yates shuffle of a copy, driven by an injected rng.
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick one element by weight. weights[i] corresponds to items[i]. Uses rng.
export function weightedPick(items, weights, rng) {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// A human-friendly shareable seed like "NTNX-8F3K2Q". Not deterministic itself;
// the resulting string is what drives determinism when reused.
export function generateSeedString(randFn) {
  const rand = randFn || Math.random;
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable 0/O/1/I
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return 'NTNX-' + s;
}

// Normalize a seed arriving from outside (the ?seed= link, the title input):
// uppercase, strip anything but A-Z / 0-9 / dash, cap the length. Returns null
// when nothing valid remains, so callers can fall back cleanly.
export function normalizeSeed(input) {
  if (typeof input !== 'string') return null;
  const s = input.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  return s.length ? s : null;
}
