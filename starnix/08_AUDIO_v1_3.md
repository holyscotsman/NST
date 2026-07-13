# 08 — Audio

> **Version:** v1.3
> **Owner chat:** Audio. **Owns/edits:** this file only (`08_AUDIO.md`).
> **Source of truth it implements:** `01 §7` (audio engine, 5 tracks). Reads `01 §12` (a11y: reduced-motion does not affect audio; music/SFX are independent toggles) and `05` (verification).
> **Module delivered:** `audio.js` → installs `window.StarNix.core.audio`. Standalone audition: `audio-test.html`. Headless check: `audio-verify.mjs`.

This document is the concrete realization of `01 §7`. `01 §7` defines the *contract*; this file defines the *parameters* (per-track tempo / key / chord loop / arp / drum pattern / mix) and the synthesis details. `01` remains authoritative for the API shape; if the two ever disagree, `01` wins and this file is corrected.

---

## 1. Contract (from `01 §7`)

All music is **generated in-browser via Web Audio** — there are **no audio files** (required for the single-file Apps Script build). The engine reuses ARM's existing chiptune timbre family unchanged in character:

> detuned dual-**pulse bass** through a `tanh` soft-clip **waveshaper** + low-pass envelope, a thin-pulse **arp lead**, a triangle **kick**, and a high-pass-noise **hat**.

```ts
type TrackId = "cinematic" | "menu" | "arm" | "kbb" | "cc";
type SfxName = "fire" | "hit" | "explode" | "collect" | "correct" | "wrong" | "hyperdrive";

interface Audio {
  ensure(): void;                          // unlock/resume AudioContext on first gesture
  setMusic(on: boolean): void;             // master music on/off (smoothed); independent of SFX
  setSfx(on: boolean): void;               // SFX on/off; independent of music
  sfx(name: SfxName): void;                // one-shot effect
  playTrack(id: TrackId, opts?): void;     // crossfade-swap the music loop
}
```

`playTrack`'s optional second arg carries the **boss intensity** layer (§4): `playTrack(id, { intensity: true })`. Existing one-arg callers are unaffected (`intensity` defaults `false`). The `TrackId` enum is **not** extended for boss — bosses reuse the game track plus a layer.

**Install point:** `window.StarNix.core.audio`. The Core chat injects this same object into each game as `ctx.audio`. Convenience read-only accessors `isReady()`, `state()`, `analyser()`, and `context()` are exposed for the shell/Settings UI, diagnostics, and tests; they are not part of the frozen `01 §7` interface. `analyser()` returns a passthrough `AnalyserNode` spliced into the master bus (`master → analyser → destination`) — transparent to audio, used by `audio-test.html` to scope the live output; it returns `null` before `ensure()`. `context()` returns the internal `AudioContext` (or `null` before `ensure()`).

---

## 2. The five tracks

Shared timbre family; distinguished by **tempo**, **key/chord loop**, **arp pattern**, **drum pattern**, and **mix level**. Every loop is **4 bars × 16 steps** (16th-note grid). Bass roots and arp notes are authored as note names and pre-converted to Hz once at load (no parsing/allocation in the scheduler).

| Track | Used by | BPM | Key / chord loop | Mood | Drum pattern | Mix |
|-------|---------|-----|------------------|------|--------------|-----|
| `cinematic` | Intro cold open | 84 | A minor — Am · F · Dm · E | tense, sparse → swells within the loop; E major cadence (G♯ leading tone) for drama | kick on beat 1 only; **no hats** (tension); arp density rises bars 1→4 | 0.42 |
| `menu` | Main menu **and** pause | 110 | C major — C · G · Am · F | calm, hopeful (I–V–vi–IV) | kick on 1 & 3; soft hats on the "and" of 2 & 4 | 0.46 |
| `arm` | Acropolis Rescue Mission | 126 | A minor — Am · F · C · G | exploratory steady groove (**the existing ARM loop, unchanged**) | kick on step 0, hat on step 2 (per bar quarter) | 0.50 |
| `kbb` | Kuiper Belt Battle | 150 | D minor — Dm · B♭ · F · A | driving, aggressive, combat tension; A major = dominant pull | four-on-the-floor kick (0/4/8/12); snare 4 & 12; hats on offbeats | 0.50 |
| `cc` | Chasm Chase | 166 | E major — E · B · C♯m · A | fast, propulsive runner pulse (bright) | four-on-the-floor kick; **constant 16th hats** | 0.50 |

**Per-track detail (authored Hz comes from these note names):**

```
cinematic  bars: Am[A3 C4 E4 C4]  F[F3 A3 C4 A3]  Dm[D3 F3 A3 F3]  E[E3 G#3 B3 G#3]
           bass: A1 F1 D1 E1   arp wave: thin   arp steps: bars 0-1 {0,8}; bars 2-3 {0,4,8,12}
menu       bars: C[C4 E4 G4 E4]  G[G3 B3 D4 B3]  Am[A3 C4 E4 C4]  F[F3 A3 C4 A3]
           bass: C2 G1 A1 F1   arp wave: thin   arp steps: {0,4,8,12}
arm        bars: Am[A3 C4 E4 A4] F[F3 A3 C4 F4]  C[C3 E3 G3 C4]   G[G2 B2 D3 G3]
           bass: A1 F1 C2 G1   arp wave: thin   arp steps: every step (16ths)  [matches ARM source]
kbb        bars: Dm[D3 F3 A3 D4] Bb[Bb3 D4 F4 D4] F[F3 A3 C4 F4]  A[A3 C#4 E4 A4]
           bass: D1 Bb1 F1 A1  arp wave: square  arp steps: even steps (8ths, harder edge)
cc         bars: E[E4 G#4 B4 E5] B[B3 D#4 F#4 B4] C#m[C#4 E4 G#4 C#5] A[A3 C#4 E4 A4]
           bass: E1 B1 C#2 A1  arp wave: thin   arp steps: every step (running 16ths)
```

Bass plays on even steps; on the off-quarter it jumps an octave (the ARM "plucky electric octave bass" behaviour), kept across all tracks for family cohesion.

`arm` is a byte-for-byte port of the ARM loop (tempo, chords, arp, drums) so the existing game is unchanged. The other four are new authored loops in the same voice family.

---

## 3. Synthesis (ported from ARM, generalized)

Voices, unchanged in character from ARM (`starnix.html` AUDIO block):

- **Bass** — two `PeriodicWave` pulse oscillators detuned **+4 / −7 cents**, summed into a `WaveShaper` with a `tanh(x·2.6)` curve (soft clip → electric grit), then a resonant low-pass (Q 12) sweeping 2200→360 Hz over the note. Octave-jump on the off-quarter.
- **Arp lead** — one thin-pulse (`menu`/`cinematic`/`arm`/`cc`) or square (`kbb`) `PeriodicWave` through a low-pass envelope (3200→1500 Hz, Q 3).
- **Kick** — triangle 140→46 Hz, fast decay.
- **Hat** — white-noise burst through a 7 kHz high-pass.

**Generalizations made for multi-track + crossfade (do not change the timbre):**
1. **Per-track gain bus.** Each active loop owns a `GainNode → musicBus → master`. `playTrack` cross-ramps the **outgoing** bus to 0 and the **incoming** bus to its mix level (`linearRamp`, ~0.9 s), then stops the outgoing scheduler. Same-track calls are a no-op (or a live intensity toggle).
2. **Master music gain (`musicBus`).** `setMusic` smooths this 0↔level (`setTargetAtTime`) so on/off never clicks; while off, scheduling timers are cleared (no silent CPU) and re-armed on resume.
3. **Pre-computed note tables + step masks.** Note names → Hz and drum/arp step sets → `Uint8Array` masks are built **once at load**. The scheduler reads numbers and O(1) masks only — **no regex, array literals, closures, or `forEach` in the hot path** (honours `01 §13`). ARM's `[4,-7].forEach` and `midiF` regex are hoisted out of the per-note path.
4. **Deterministic noise.** ARM filled its noise buffer with `Math.random()`; replaced with a self-contained `xorshift32` so `src/core` carries **no `Math.random()`** (the `05` lint ban) and noise is reproducible. Audibly identical (white noise either way).

**Scheduling model:** one look-ahead scheduler per active loop (25 ms timer, 120 ms horizon) — the proven ARM approach. Web Audio voices are inherently **one-shot** (`start`/`stop` once); they cannot be pooled, and the scheduler runs on a timer **outside any RAF**, so the `01 §13` "no allocation in the draw loop" rule does not apply to note creation. The rule *is* honoured for the scheduler's own hot path (point 3).

---

## 4. Boss music — intensity layer (Master Plan N5: proposed, **awaiting confirmation**)

Per Master Plan §11 N5 the recommendation is **reuse the game track + an added intensity layer** rather than author distinct boss tracks. Implemented as `playTrack(id, { intensity: true })`:

- adds a **detuned octave-up arp** (the existing arp at ×2 freq, −9 cents, lower gain) for a thicker, more urgent lead;
- **denser hats** (an extra hat on even steps) for drive;
- a **sub-octave reinforcement** on the bass.

It layers onto the current loop without a crossfade or tempo change, so entering/leaving a boss is seamless. Toggling intensity on the *same* track is live (no restart). This stays within the 5-`TrackId` contract.

> ⚑ **Open (N5).** If distinct boss tracks are preferred instead, this section and the `intensity` arg are replaced by two new authored loops. Flagged; default behaviour (one-arg `playTrack`) is unchanged either way.

---

## 5. SFX set (ported from ARM)

All one-shot, generated live. The `01 §7` set plus ARM's `click` (kept for menu/UI use; harmless extra). `warp` is accepted as an alias of `hyperdrive`.

| Name | Synthesis | Used by (typical) |
|------|-----------|-------------------|
| `fire` | square 680→360 Hz, 80 ms | weapon fire |
| `hit` | low-passed noise burst (1.6 kHz), 90 ms | taking/ dealing chip damage |
| `explode` | low-passed noise burst (900 Hz), 340 ms | destruction |
| `collect` | sine 520→900 Hz, 180 ms | core / pickup secured |
| `correct` | sine 520→780 Hz then 780→1040 Hz (two-note rise) | right answer |
| `wrong` | sawtooth 300→120 Hz, 300 ms | wrong answer |
| `hyperdrive` (`warp`) | layered saw sweep 110→1500 Hz ×2 (detuned) + sub sine 90→38 Hz + band-passed noise rise + triangle ping | warp / sector transition |
| `click` | triangle 440 Hz, 50 ms | UI tap (ARM extra) |

SFX route `node → sfxBus → master`, gated by the `setSfx` flag (independent of music). Unknown names fall back to a soft sine blip rather than failing silently.

---

## 6. Accessibility & settings hooks

- **Independent toggles.** Music and SFX are separate booleans (`setMusic` / `setSfx`); the shell persists them in `Settings` (`01 §5`). Audio is never required to convey game-critical information (`01 §12` — correctness uses colour **+ icon + the `correct`/`wrong` cue, not sound alone**).
- **Reduced motion** (`01 §12`) does **not** alter audio; it is a visual setting. No audio cue flashes or strobes.
- **First-gesture unlock.** `ensure()` resumes a suspended `AudioContext`; it is safe to call repeatedly and is wired to the same first user gesture the shell already captures.

---

## 7. Verification (per `05`)

`audio.js` is **DOM-free** (touches only `window.AudioContext`, `window.StarNix`, and timers), so the headless harness uses a **strict Web-Audio mock + virtual timers** instead of jsdom — a smaller, dependency-free check that still exercises the real scheduler/voice code. The mock throws on the same conditions the real API does (`exponentialRampToValueAtTime` value ≤ 0 or non-finite, `stop` before `start`, non-finite param values), so genuine bugs (a bad note frequency, a zero-target envelope) are caught headlessly.

`audio-verify.mjs` asserts:
1. API surface present (`ensure/setMusic/setSfx/sfx/playTrack`) under `StarNix.core.audio`.
2. All API calls are safe **before** `ensure()` (no throw; no AudioContext yet).
3. Each of the 5 tracks schedules ≥ 4 bars with **no exceptions**; every oscillator frequency and every envelope target is finite and valid; every `stop ≥ start`; each track actually emits bass + arp + kick; the node graph reaches `destination`.
4. **Crossfade**: switching tracks runs both schedulers during the overlap, then the outgoing scheduler's timer is cleared.
5. **Boss intensity** (`kbb`, `cc`) schedules extra voices vs. the non-intensity track, with no exceptions.
6. Every SFX (incl. `warp` alias and `click`) schedules valid nodes; unknown name falls back without throwing.
7. **Toggles**: `setMusic(false)` halts scheduling and clears timers; `setMusic(true)` resumes; `setSfx(false)` suppresses SFX nodes; `setSfx(true)` restores.
8. **Leak**: after `setMusic(false)` no interval timers remain armed.

`audio-test.html` is the human audition: buttons for all 5 tracks (and boss-layer toggles), the full SFX set, and music/SFX switches. A live oscilloscope reads `analyser()` (the real master bus) so you can see as well as hear that a track or SFX is producing sound.

---

## 8. Checklist (this module)

- [x] Port ARM engine + SFX into `StarNix.core.audio` (timbre unchanged)
- [x] Author the 5 track definitions (tempo + chord loop + arp + drums + mix)
- [x] `playTrack` crossfade (per-track gain bus; same-track no-op / live intensity toggle)
- [x] Music/SFX independent toggles (smoothed; timers cleared when muted)
- [x] Boss intensity layer behind `opts.intensity` (N5 — proposed, awaiting confirm)
- [x] Hot-path allocation removed (pre-computed Hz + step masks; no `forEach`/regex/literals)
- [x] `Math.random()` removed from core (deterministic noise)
- [x] Headless harness green (`audio-verify.mjs`); standalone `audio-test.html`
- [ ] Core chat: inline `audio.js` into the single-file build and pass as `ctx.audio` (other chat)
- [ ] Settings persistence of toggles wired by the shell (Core chat)

---

## 9. Persistent-chain synthesis + the 40-track library (added v1.3 — matches shipped `audio.js`)

**Node-churn elimination (`v0.45.0`, X1).** Per-note chains (7–11 nodes each) were replaced by **persistent per-(voice, output) chains** with round-robin pools (K=3, where the intensity layer doubles notes at the same `t`); each note now creates **one-shot oscillators/buffer sources only**. Critical catch: `ensure()`'s TTL wrapper would have auto-disconnected the persistent chains ~2.5 s in — invisible to the strict mock, dead in a browser — so `chainsFor` **suspends TTL tracking while building**. The sfx TTL sweep is unchanged. The smoke proves zero heavy-node creation at steady state.

**The 40-track library (`v0.49.0`).** 4 contexts × 2 genres × 5 tracks (36 new defs; 43 total with `exam`/`cinematic`/`boss`). **Chill** = 76–112 BPM, no snare, no guitar, levels .32–.40; **upbeat** = 118–180 BPM at the old beds' energy. The context ids (`menu`/`arm`/`kbb`/`cc`) remain the contract: a selection layer resolves them through per-genre `PLAYLISTS` with per-context **rotation cursors**, so repeated visits cycle variants. `playTrack(id, { exact: true })` bypasses resolution; the fixed ids pass through untouched. New exports: `setMusicGenre` / `getMusicGenre`. The shell's pause card gained an **Upbeat / Chill** toggle persisting `settings.musicGenre`, applied at boot and swapping the paused game's bed on resume.

**Consumers (`v0.50.0`).** KBB boss battles play the fixed `boss` bed with the intensity layer via a transition-guarded `renderEnemy` hook (back to `kbb` when the boss clears). ARM already switched to `boss` on its boss sectors.

**Verification.** `audio-smoke.mjs` drives all 43 defs clean and pins resolution / rotation / fixed-id passthrough / the genre getter; `verify-build.mjs` G2 pins the pause toggle, `settings.musicGenre` persistence, boot apply, and spot-resolved track ids. All 36 new tracks are **ears-blind** pending the QA-S4 listen pass (`BROWSER_QA.md`).

## Change history

- **v1.3 (2026-06-28)** — Added §9: the `v0.45` persistent-chain architecture (round-robin pools, one-shot sources per note, the `chainsFor` TTL-suspension catch), the `v0.49` 40-track library (4×2×5, chill/upbeat authoring rules, playlist resolution + rotation behind the unchanged context-id contract, `exact` bypass, `setMusicGenre`/`getMusicGenre`, the shell's persisted pause-card toggle), and the `v0.50` KBB boss-bed consumer. Verification updated (43-def drive, resolution/rotation pins). No SFX change.

- **v1.2 (2026-06-28)** — Integration landed (no engine change): Core inlines `audio.js`, and the shell calls `playTrack()` at the cinematic cold-open, the main menu (and on return to menu), the practice exam, and per-game on mount (`GAME_META[id].track`). Pause is handled by the shell's overlay (per `01 §9` / v1.3): it **stops the music on open and restarts it on resume** with a fresh scheduler, so a slowed or glitched audio thread self-heals via pause → resume. The `analyser()`/`context()` accessors drive the audition page's oscilloscope. Header version aligned to the filename (was v1.0). No track or SFX change.
- **v1.0** — Initial spec. Ported `01 §7`'s five-track table into concrete authored parameters (per-track BPM / key / chord loop / arp / drum pattern / mix); documented the ARM-derived synthesis and the generalizations required for multi-track crossfade (per-track gain bus, master music gain, pre-computed note/step tables, deterministic noise); specified the SFX set; proposed the boss **intensity layer** behind `playTrack(id, {intensity})` pending Master Plan N5; defined the headless verification (strict Web-Audio mock, no jsdom — module is DOM-free). Ships `audio.js`, `audio-test.html`, `audio-verify.mjs`. Adds read-only `analyser()`/`context()` diagnostics accessors (passthrough analyser on the master bus) driving the audition page's oscilloscope. Headless verification: 86/86 assertions green.
