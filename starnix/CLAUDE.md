# StarNix

Single-file study game for the Nutanix NCP-MCI exam, hosted on Google Apps Script. A cinematic
shell wraps three sub-games (ARM 2D flight, KBB roguelike, CC 3D runner) plus a practice-exam
module, all teaching one shared question bank via Leitner spaced retrieval. Theme: NX-SRC vs the
BCM. Currently v0.51.0.

## Commands

- `node build.mjs` — assemble all modules into `index.html` (the single deployable file)
- `npm run check` — **THE GATE.** build → verify-build (345 assertions) → audio-smoke →
  cc-view-smoke → cc-fairness → exhibit → scheduler → multi-answer → shuffle → timer →
  `KBB_ASSERT=1 kbb-balance` → kbb-run → kbb-draw. Must end ALL GREEN before any unit is done.
- Individual harnesses run standalone: `node verify-build.mjs`, `node kbb-run.cjs`, etc.
- `npm install` restores test deps (jsdom, canvas). `canvas` is only needed by draw-loop
  harnesses (kbb-draw); it ships prebuilt binaries for common platforms.

## Architecture

- **Edit module files, never `index.html`** — it is generated. Modules: `starnix-core.js`
  (contract impl + `BUILD_VERSION`), `starnix-shell.js` (menu/screens/pause/exam launch),
  `arm.js`, `kbb.js`, `cc.js`, `exam.js`, `audio.js` (deterministic synth, 40-track library),
  `assets.js` (inlined base64 art), `questions.js` (the bank).
- Contract: each game registers `StarNix.registerGame({ id, mount(root, ctx), unmount })` and
  must fully clean up in `unmount()`. `ctx = { questions, mastery, persistence, rng, audio,
  theme, telemetry }`. Plain JS, no build step beyond concatenation.
- Specs `00–08` (versioned `_vX_Y.md` files, highest version wins) are the authoritative design
  docs; `00` is the index. If code and spec conflict or something is unspecified: **ask, don't
  assume.** Refer to docs by number.
- The old one-chat-per-module ownership model is retired — a single session owns everything.
  Doc versioning discipline remains (see Conventions).

## Hard rules

- **No bugs ship.** Every unit: gate green + a **negative control** (deliberately break the new
  behavior, confirm exactly the new assertions fail, restore). A control that doesn't fail is a
  broken test, not a pass.
- **Learning integrity is paramount.** Answer keys come only from authored question data. Never
  invent, guess, or ship unverified keys — quarantine ambiguous items and document the open
  decision. AI is never authoritative for correctness (`AIAdapter` stays a no-op seam).
- Headless GREEN proves structure, not looks or sound. New visual/audio surface is
  **browser-blind until a human pass** — track it in `BROWSER_QA.md`.
- Determinism: all gameplay randomness through `ctx.rng` (seeded, forkable). No `Math.random`
  in gameplay paths.
- Performance (01 §13): no allocation in update/draw loops, object pooling, one RAF per game.
  Accessibility (01 §12): keyboard+touch, colorblind-safe cues (shape+color), reduced-motion and
  extra-time honored everywhere.

## Conventions

- Version: bump `BUILD_VERSION` in `starnix-core.js` per shipped unit. `CHANGELOG.md` entry =
  single long-line bullets, prepended above the previous `## [x.y.z]` anchor.
- Spec edits: never overwrite a spec — write the next `<base>_vX_Y.md` with an updated version
  header and a `## Change history` entry.
- `STATE.md` is the session handoff: a new headline block demotes the previous one under
  `> **Earlier this session (…):**`. Update it at the end of substantial sessions.
- Harness patterns: jsdom mounts with a mock ctx (see `kbb-headless.cjs` / `mock-core.js`);
  CommonJS `.cjs` for harnesses; draw code early-returns under a null 2D context so logic
  harnesses run without canvas.
- Palette: Iris `#7855FA`, Aqua `#1FDDE9`, Mantis `#92DD23`, Peach `#FF6B5B`, Gold `#FFC857`.
  Sentence case, Montserrat. Original in-code art only; the Nutanix wordmark unaltered, title
  screen only (07).
- Communication: concise, matter-of-fact, no sycophancy; challenge assumptions; no timeline
  estimates. Git commits: no co-author tags.

## Deploy

Copy/paste `index.html` into the Google Apps Script project (or push via `clasp` — planned but
not yet set up). Phase 5 of `00` defines the eventual migration to nginx on AHV/NKP.

## Current state

See `STATE.md` (always current) and `CHANGELOG.md`. Standing items: browser QA pass owed for
v0.42–0.51 surface (`BROWSER_QA.md` is the checklist); ten `kbb*` sprites wanted
(`SPRITE_PROMPTS.md`); D1 bank expansion blocked on question dumps; quarantined keys a1q13 /
a1q27 / a3q7; a4q50 orphan image.
