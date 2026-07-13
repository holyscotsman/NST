import { test } from 'node:test';
import assert from 'node:assert/strict';
import { styleTrack, MUSIC_STYLES } from '../src/shell/music.js';

const track = {
  bpm: 100, beats: 16, gain: 0.7,
  voices: [
    { wave: 'sine', gain: 0.4, kind: 'bass', notes: [[0, 'C2', 1]] },
    { wave: 'square', gain: 0.1, kind: 'arp', notes: [[0, 'C4', 0.4]] },
    { kind: 'thump', gain: 0.3, notes: [[0, 0, 0.3]] },
  ],
};

test('every advertised style is real and studio is the untouched original', () => {
  assert.ok(MUSIC_STYLES.some((s) => s.id === 'studio'));
  const same = styleTrack(track, 'studio');
  assert.equal(same, track, 'studio returns the original object (identity)'); // NEGATIVE CONTROL
  assert.equal(styleTrack(track, 'nonsense-style'), track, 'unknown style is a no-op'); // NEGATIVE CONTROL
});

test('a transform style changes tempo and instrument voices but not the notes', () => {
  const neon = styleTrack(track, 'neon');
  assert.notEqual(neon, track);
  assert.ok(neon.bpm > track.bpm, 'neon is faster');
  assert.equal(neon.voices[0].wave, 'sawtooth', 'bass timbre changed');
  assert.equal(neon.voices[1].wave, 'sawtooth', 'arp timbre changed');
  // notes arrays are shared (read-only) — no deep copy, no per-tick allocation
  assert.equal(neon.voices[0].notes, track.voices[0].notes);
  // original is untouched
  assert.equal(track.voices[0].wave, 'sine');
  assert.equal(track.bpm, 100);
});

test('mellow softens the drums; arcade uses square lead', () => {
  const mellow = styleTrack(track, 'mellow');
  assert.ok(mellow.voices[2].gain < track.voices[2].gain, 'mellow drums quieter');
  assert.ok(mellow.bpm < track.bpm, 'mellow is slower');
  const arcade = styleTrack(track, 'arcade');
  assert.equal(arcade.voices[1].wave, 'square');
});
