// config.js — game constants. Pure data, no browser or Node APIs.
// This is the de-facto core spec (CLAUDE.md §3) expressed as numbers.

// A run is 30 questions: 10 easy / 10 medium / 9 hard / 1 extreme final.
export const RUN_LENGTH = 30;

export const TIERS = [
  { key: 'easy',    count: 10 },
  { key: 'medium',  count: 10 },
  { key: 'hard',    count: 9 },
  { key: 'extreme', count: 1 },
];

// Difficulty labels used for authored cold-start seeds.
export const DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

// Exam content domains (NCP-MCI blueprint areas).
export const DOMAINS = [
  'prism',           // Cluster management, Prism Element & Central
  'storage',         // AOS storage: containers, pools, dedup, compression, EC-X, capacity
  'dataprotection',  // Snapshots, protection domains, async/nearsync/metro, Leap
  'ahv',             // AHV virtualization: VM lifecycle, live migration, affinity, images
  'networking',      // AHV networking, VLANs, virtual switches, IPAM, Flow
  'lifecycle',       // LCM, one-click upgrades, firmware
  'monitoring',      // Health, NCC, alerts, analysis
  'migration',       // Nutanix Move
  'unifiedstorage',  // Files, Objects, Volumes
  'security',        // Cluster lockdown, DARE, STIG, Flow microsegmentation
  'performance',     // Performance & capacity planning
  'foundation',      // Foundation, node/cluster expansion, hardware
];

// The money ladder. Cumulative coins after answering question N correctly.
// Safe havens (banked, guaranteed) sit at every tier boundary: Q10, Q20, Q29, Q30.
// Index 0 => after Q1, index 29 => after Q30 (a win).
export const LADDER = buildLadder();

function buildLadder() {
  const rungs = [];
  let total = 0;
  // Easy Q1..Q10: 100 each -> banks at 1,000
  for (let i = 0; i < 10; i++) { total += 100; rungs.push(total); }
  // Medium Q11..Q20: 500 each -> banks at 6,000
  for (let i = 0; i < 10; i++) { total += 500; rungs.push(total); }
  // Hard Q21..Q29: 2,000 each -> banks at 24,000
  for (let i = 0; i < 9; i++) { total += 2000; rungs.push(total); }
  // Extreme Q30: +26,000 -> wins at 50,000
  total += 26000; rungs.push(total);
  return rungs;
}

// Question indices (0-based) after which the running total banks and cannot be lost.
// After Q10 (idx 9), Q20 (idx 19), Q29 (idx 28), Q30 (idx 29).
export const BANK_BOUNDARIES = [9, 19, 28, 29];

export const LIFELINE_TYPES = ['fifty', 'audience', 'phone'];

export const LIFELINE_META = {
  fifty:    { name: '50:50',            glyph: '½', hint: 'Removes two wrong answers' },
  audience: { name: 'Ask the audience', glyph: '👥', hint: 'Polls the studio audience' },
  phone:    { name: 'Phone a friend',   glyph: '📞', hint: 'A friend gives their best guess' },
};

// Lifeline slots: start with 1 of each; a permanent second slot can be bought; cap 2.
export const LIFELINE_DEFAULT_SLOTS = 1;
export const LIFELINE_MAX_SLOTS = 2;

// Green Room shop prices (in coins). Slot price scales with how many you own.
export const SHOP = {
  // Buying the 2nd slot of a given lifeline type.
  lifelineSlot: 3000,
  // Refill one lifeline charge back to its slot capacity.
  refillAll: 1500,
  // Steve teaches the concept behind one guaranteed-upcoming hard question. Expensive.
  steve: 4000,
};

// Mastery / Leitner boxes. Low box = still hard for you; high box = mastered.
export const MASTERY = {
  MIN_BOX: 0,
  MAX_BOX: 5,          // box 5 == graduated (rarely resurfaced)
  GRADUATED_BOX: 5,
  // Chance a graduated question is resurfaced into an easy slot so it isn't forgotten.
  RESURFACE_CHANCE: 0.12,
};

// Map a Leitner box to the tier a question presents at (for mastery-driven selection).
export function boxToTier(box) {
  if (box <= 1) return 'hard';
  if (box <= 3) return 'medium';
  if (box <= 4) return 'easy';
  return 'graduated';
}

// Cold-start: a brand-new authored question presents at its authored tier until
// the player has answered it at least once.
export function coldStartTier(authoredDifficulty) {
  return authoredDifficulty;
}

export const STORAGE_KEY = 'wwtbane.save.v1';
