// persistence.js — browser save state in localStorage. Degrades to in-memory if
// storage is unavailable (private mode, etc.). Mastery is shared learning state
// and is NEVER wiped by a prestige/win (CLAUDE.md §3).

import { STORAGE_KEY, LIFELINE_DEFAULT_SLOTS } from '../core/config.js';
import { emptyMastery } from '../core/mastery.js';

let memoryFallback = null;

function storage() {
  try {
    const t = '__wwtbane_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return localStorage;
  } catch {
    return null;
  }
}

export function defaultSave() {
  return {
    version: 1,
    mastery: emptyMastery(),
    wallet: 0,
    lifelines: defaultLifelines(),
    flags: { reachedFinalBefore: false, seenIntro: false },
    steveTaught: [],
    lastWelcome: null, // last host welcome-line key, so he never repeats himself
    stats: { runs: 0, wins: 0, bestPayout: 0, questionsAnswered: 0, longestStreak: 0 },
    settings: { motion: 'auto', highContrast: false, sound: true, music: true, musicStyle: 'studio', postFx: true, extraTime: false },
  };
}

export function defaultLifelines() {
  return {
    fifty: { slots: LIFELINE_DEFAULT_SLOTS, charges: LIFELINE_DEFAULT_SLOTS },
    audience: { slots: LIFELINE_DEFAULT_SLOTS, charges: LIFELINE_DEFAULT_SLOTS },
    phone: { slots: LIFELINE_DEFAULT_SLOTS, charges: LIFELINE_DEFAULT_SLOTS },
  };
}

export function load() {
  const s = storage();
  let raw = null;
  if (s) raw = s.getItem(STORAGE_KEY);
  else raw = memoryFallback;
  if (!raw) return defaultSave();
  try {
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return defaultSave();
  }
}

export function save(state) {
  const raw = JSON.stringify(state);
  const s = storage();
  if (s) s.setItem(STORAGE_KEY, raw);
  else memoryFallback = raw;
}

export function resetAll() {
  const s = storage();
  if (s) s.removeItem(STORAGE_KEY);
  memoryFallback = null;
  return defaultSave();
}

// Prestige: winning resets coins and purchased slots ONLY. Mastery + flags persist.
// The win itself is tallied in the run controller flow (endRun), not here, so a
// win counts whether or not the player chooses to prestige afterwards.
export function prestige(state) {
  return { ...state, wallet: 0, lifelines: defaultLifelines() };
}

// Export the save as a portable string (plain JSON — transparent on purpose;
// there is nothing secret in a save). Import runs the same migrate() used at
// load, so a save from any version normalizes cleanly. Returns null when the
// string is not a readable save.
export function exportString(state) {
  return JSON.stringify(state);
}

export function importString(raw) {
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    if (parsed.version !== 1) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

function migrate(parsed) {
  const base = defaultSave();
  const merged = { ...base, ...parsed };
  merged.mastery = parsed.mastery && parsed.mastery.records ? parsed.mastery : emptyMastery();
  merged.lifelines = { ...defaultLifelines(), ...(parsed.lifelines || {}) };
  merged.flags = { ...base.flags, ...(parsed.flags || {}) };
  merged.stats = { ...base.stats, ...(parsed.stats || {}) };
  merged.settings = { ...base.settings, ...(parsed.settings || {}) };
  merged.steveTaught = Array.isArray(parsed.steveTaught) ? parsed.steveTaught : [];
  return merged;
}
