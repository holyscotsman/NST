# STATE.md — resume point

**Read order each session:** `CLAUDE.md` → this → `AUTONOMOUS_RUN.md`.

## Where things stand

The game is live at **https://holyscotsman.github.io/WWTBANE/** and has been
through seven major drops (see `CHANGELOG.md`): the first playable build, the
Game A UI redesign, music + intro tutorial + loss-flow rework, the camera
director (cinematic scenes/takes), take tuning with the scene preview tool,
the first owner feedback batch (safe havens Q5/Q10/Q17/Q25, hard-round
suspense + drum roll, music rework, stage-manager door beat), and the second
(host welcome beat with rotating/snarky lines, question read-out pacing,
speech bubbles, much slower takes, capsule-built people + readable hot seats,
audio-resume hardening, pause menu, mastery dashboard removed).

### Architecture map
- **Core (pure, headless-tested)** — `src/core/`: config, rng, questionSchema,
  mastery (Leitner), lifelines, coins, selection (double-buffer SetManager),
  runController, eventBus, aiAdapter (no-op seam).
- **Shell (browser)** — `src/shell/`:
  - `studio.js` — WebGL sets (studio + warm green room) with props (piggy bank,
    stage manager, sketchy guy); lighting/mood/pulses; delegates the camera to…
  - `director.js` + `takes.js` — the camera director: scene playlists of timed
    takes, event-triggered cutscenes, preview via `?scene=<name>&take=<n>`.
    Take tables + trigger map: `docs/CINEMATIC_TAKES.md`.
  - `backdrop.js` — layered CSS studio (no-WebGL fallback), mood/camera/pulse.
  - `music.js` — procedural WebAudio score: lounge, tier loops (faster→slower/
    lower), final drone, lifeline vamp (push/pop), stingers (right / 3s wrong /
    4s final-wrong / win), drum roll. `audio.js` — small UI cues.
  - `hostLines.js` — the host's welcome/quip copy + pure pickers (no-repeat
    rotation, snark gating) and the question read-out pacing helper.
  - `ui/` — hud (right-rail ladder, coins, medallions), overlay (card, lock-in
    suspense, reveals, poll, typewriter), screens (title / green room with
    loss-reveal phase / results / help / settings), cinematic (first-run host
    tour + tutorial), dom helper.
  - `persistence.js` — save/prestige; flags: reachedFinalBefore, seenIntro.
- **Content** — `src/content/questions.js` (157 verified, pending human
  sign-off) + quarantine.js.
- **Flows:** title → (first run: producer/tour/tutorial) → run; wrong answer →
  green room (reveal + pep talk → shop, "Start next round"); win → prestige.

### Gates
- Tests: 88 headless (negative controls) + 7 smoke + 18 e2e; CI runs headless
  on every push/PR. All green as of the last drop.

### Owner feedback pass (post-overhaul)
- Compact money ladder; perimeter pillars darkened/thinned + center-line ones
  removed so they clear the title; audience rebuilt as instanced *people*
  (torso+arms/skin head/hair, per-person colour) to match the walk-on actor;
  host congrats beats on safe-haven banks (`BANK_LINES`) and tier crossings
  (`TIER_LINES`, Q11/Q21). New host copy flagged in `FLAGS.md §2`. Visual items
  queued in `BROWSER_QA.md`.

### Graphics overhaul (docs/GRAPHICS_OVERHAUL.md)
- All 5 phases shipped: P0 audit + dev FPS meter + shots harness; P2 env map +
  reflective floor; P3 shadows + rim light + lock-in cue; P1 set detail (LED
  wall, columns, medallion, truss); P4 vignette/grain + camera micro-motion +
  effects toggle; P5 hexagonal answer lozenges + dust motes + branded screen
  wipes. Final verification pass done (structural): full matrix green, the
  effects-off + reduced-motion render path verified clean, and all five phases
  confirmed coexisting in one frame. The only open item is the human
  on-hardware FPS + WebGL-look sign-off (dev meter `?fps=1` / Alt+F), queued in
  `BROWSER_QA.md`. The overhaul is code-complete, visual-pending.

### Owner-authored bank (in progress)
- Ingestion pipeline is live: `docs/QUESTION_AUTHORING.md` → Markdown →
  `npm run import:questions` → `src/content/questions.js`. Waiting on the
  owner's Markdown upload (+ images in `src/content/images/`) to replace the
  AI-drafted bank. Run the importer, review its report, then ship.
- Visual sign-off queue: `BROWSER_QA.md` (code-complete, visual-pending).

## Next candidates
- Owner feedback pass on the ✏️ drafted cinematic takes (use the preview tool).
- Human review of the question bank + host dialogue (`FLAGS.md`) — includes
  the owner's "are the easy questions easy enough?" concern and the new
  welcome/quip lines.
- If the owner still wants imported 3D character assets after seeing the
  capsule people, that's a rules change (`FLAGS.md` #6).
- Backlog ideas in `BACKLOG.md` (PWA, etc.).
