// config.js — game constants. Pure data, no browser or Node APIs.
// This is the de-facto core spec (the project design rules) expressed as numbers.

// The game version, shown on the title screen. Keep in lockstep with
// package.json "version" (tests pin the two together).
export const VERSION = '0.1.1';

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
// Safe havens (banked, guaranteed) sit at Q5, Q10, Q17 and Q25 (owner-set —
// independent of tier boundaries). Index 0 => after Q1, index 29 => Q30 (win).
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

// Question indices (0-based) after which the running total banks and cannot be
// lost: Q5 (idx 4), Q10 (idx 9), Q17 (idx 16), Q25 (idx 24).
export const BANK_BOUNDARIES = [4, 9, 16, 24];

/* ---- Ladder profiles (short-bank support) ---------------------------------
 * The classic run is 30 questions, but a bank with MIN_BANK..29 valid questions
 * gets a proportionally scaled ladder — same tier feel, same safe-haven rhythm,
 * same 50,000 top prize — instead of being locked out. ladderProfile() is pure;
 * the ACTIVE profile is a module singleton set once at boot from the loaded
 * bank's size. Everything that used to read the 30-rung constants reads
 * activeLadder() instead; with no profile set it IS the classic shape, so
 * existing behavior (and every pinned test) is unchanged. */
export const MIN_BANK = 10;

const TIER_INCREMENT = { easy: 100, medium: 500, hard: 2000 };
const TOP_PRIZE = 50000;
const CLASSIC_HAVEN_QUESTIONS = [5, 10, 17, 25]; // 1-based, of a 30-rung run

function buildProfile(tiers) {
  const runLength = tiers.reduce((a, t) => a + t.count, 0);
  const ladder = [];
  let total = 0;
  for (const t of tiers) {
    if (t.key === 'extreme') continue;
    for (let i = 0; i < t.count; i++) { total += TIER_INCREMENT[t.key]; ladder.push(total); }
  }
  ladder.push(TOP_PRIZE); // the final always plays for the same top prize
  const bankBoundaries = [];
  for (const q of CLASSIC_HAVEN_QUESTIONS) {
    const pos = Math.round((q / RUN_LENGTH) * runLength);
    const idx = Math.min(runLength - 2, Math.max(0, pos - 1)); // never on the final
    if (!bankBoundaries.includes(idx)) bankBoundaries.push(idx);
  }
  return { runLength, tiers, ladder, bankBoundaries };
}

// The classic 30-rung profile — identical numbers to LADDER/BANK_BOUNDARIES
// above (pinned by tests so the two sources can never drift).
export const CLASSIC_LADDER = buildProfile(TIERS);

// The profile for a bank of `bankSize` valid questions. >=30 -> classic;
// MIN_BANK..29 -> scaled (tier split proportional to 10/10/9, one final);
// under MIN_BANK -> null (unplayable, show the friendly bank screen).
export function ladderProfile(bankSize) {
  if (bankSize >= RUN_LENGTH) return CLASSIC_LADDER;
  if (bankSize < MIN_BANK) return null;
  const easy = Math.round(bankSize * 10 / RUN_LENGTH);
  const medium = Math.round(bankSize * 10 / RUN_LENGTH);
  const hard = bankSize - easy - medium - 1;
  return buildProfile([
    { key: 'easy', count: easy },
    { key: 'medium', count: medium },
    { key: 'hard', count: hard },
    { key: 'extreme', count: 1 },
  ]);
}

let ACTIVE_LADDER = CLASSIC_LADDER;
export function setActiveLadder(profile) { ACTIVE_LADDER = profile || CLASSIC_LADDER; }
export function activeLadder() { return ACTIVE_LADDER; }

export const LIFELINE_TYPES = ['fifty', 'audience', 'phone'];

// Per-option colours for the Ask-the-Audience vote: the crowd raises cards in
// these hues and the DOM poll rows carry the same swatch, so "the crowd leaned
// toward B" reads the same in the studio and in the panel. Index = option index.
// CSS strings so both the DOM and THREE.Color (which parses CSS) can use them.
export const VOTE_COLORS = ['#1FDDE9', '#7855FA', '#92DD23', '#FF6B5B', '#FFC857', '#FF9F40'];

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
// The promotion cap and the graduate-out ceiling are the SAME value — a question
// graduates exactly when it reaches the top box — so they share one source.
const MASTERY_MAX_BOX = 5;
export const MASTERY = {
  MIN_BOX: 0,
  MAX_BOX: MASTERY_MAX_BOX,       // box 5 == graduated (rarely resurfaced)
  GRADUATED_BOX: MASTERY_MAX_BOX, // must equal MAX_BOX (same source above)
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
// The save-schema version. defaultSave() stamps it and migrate() normalizes to
// it, so every load/import path agrees on the version field. Bump this only
// alongside a real migration step in persistence.migrate().
export const SAVE_VERSION = 1;
