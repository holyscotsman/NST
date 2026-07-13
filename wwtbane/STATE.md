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
- Tests: 97 headless (negative controls) + 8 smoke + 18 e2e; CI runs headless
  on every push/PR. All green as of the last drop.

### Lifeline / insider cinematics (latest)
- Ask the Audience now cuts to the crowd raising colour-coded vote cards
  (`studio.audienceVote` + `ballotFromBars`; `VOTE_COLORS` shared with the DOM
  poll). Shady Steve's tip plays a split-screen phone cutscene
  (`src/shell/ui/steveCutscene.js`; clue split via `src/core/textSplit.js`).
  Settings "Reset progress" hardened to a true first-time reset. Steve
  opener/closer flavour flagged in `FLAGS.md §2`; visuals in `BROWSER_QA.md`.

### Upgrade batch 1 (latest)
- Nine `Upgrade_v0.1.1.md` items shipped (✅-marked in the doc): GS-01
  double-grade latch (`awaitingAdvance`), GS-02 lifelines refused after run
  end, GS-03 shared staleness clock (`SetManager.getRunIndex` ←
  `save.stats.runs`), GS-10/CL-02 Steve never repeats/sells clue-less
  (+`FLAGS.md §1b`: owner questions lack clues), CL-04 `stevePending` persisted
  + `pinIntoCurrent`, PX-01/CL-01 Help copy truth + keyboard bullet, PQ-09
  README rewrite + `tests/docs.test.mjs` drift gate. The work queue now lives
  in `Upgrade_v0.1.1.md` (see AUTONOMOUS_RUN.md).

### v0.1.1 kickoff
- `Upgrade_v0.1.1.md` at the repo root is the 50-item department program
  (10 each: Game Systems GS-*, Content & Learning CL-*, Graphics GX-*,
  Player Experience PX-*, Platform & QA PQ-*), each item with a file-level
  plan + verification gate. Work it top of queue; shared clusters
  (lifeline copy truth, Steve integrity, loss-reveal enrichment) land once.
- Version badge: `VERSION` in `src/core/config.js` (pinned to package.json by
  `tests/version.test.mjs`) renders in the title footer.
- **Exam2 interchange bank ingested** — 51 owner questions + 6 exhibits
  (bank 233). New `src/content/parseInterchangeBank.js` (format auto-detected
  by the importer); interchange ids kept verbatim; `optionNotes` render after
  grading (feedback panel + green-room reveal). 9 review-file questions parked
  (`FLAGS.md §0`). Source of record: `docs/interchange/e1.md` + `e1-review.md`.

### Priority questions (owner practice-exam set)
- 25 owner-authored questions merged as the priority set (`priority:true`, ids
  `NPX-*`, `reviewStatus:"human-reviewed"`); source `docs/priority-question-bank.md`,
  merged via `import-questions.mjs … --merge` (bank now 182). `priority` boolean
  added to schema + `Priority:` markdown field; `selectionWeight` boosts a
  not-yet-graduated priority question (`PRIORITY_WEIGHT_BOOST`) so mastery runs
  are flooded with the set until graduated (seeded runs stay priority-blind).
  Domain/difficulty tags are ingestion classification — pending owner confirm
  (`FLAGS.md §1`). Tests: schema/parser/mastery/selection/importer, all with
  negative controls.

### In-app Dev menu (playtesting)
- Enable via Settings "🛠 Developer tools" toggle (persists; `?dev=1` still a
  shortcut). Adds coins (+1k/+10k) in Settings and the pause menu; "Start run at
  question N" in Settings (skips intro → `_devJumpTarget` handled in
  `startRun`/`beginPlay`); "Jump to question" in the pause menu
  (`Game.devJumpTo` → `RunController.devJumpTo`). Jump credits prior questions as
  cleared for realistic coin math, never grades, never touches mastery. Tests +
  negative controls in `runController.test.mjs`.

### Hardening pass (docs/HARDENING_REVIEW.md)
- Adversarial review (5 reviewers + per-finding verify) over the graphics
  overhaul + feedback batches: 11 confirmed fixes, 2 refuted. Notables: restored
  the keyboard focus ring the lozenge clip-path was eating; true radiogroup
  keyboard nav (roving tabindex + arrows); GL teardown now frees composer passes
  + instanced-mesh buffers; grain freezes under reduced motion; pause-during-
  suspense parks the submit; crowd swap-in matches the seat colour; save-version
  + mastery-box constants single-sourced. Visual cues queued in `BROWSER_QA.md`.

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
