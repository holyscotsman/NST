# STATE.md — resume point

**Read order each session:** `CLAUDE.md` → this → `AUTONOMOUS_RUN.md`.

## Where things stand

The game is live at **https://holyscotsman.github.io/WWTBANE/** and has been
through five major drops (see `CHANGELOG.md`): the first playable build, the
Game A UI redesign, music + intro tutorial + loss-flow rework, the camera
director (cinematic scenes/takes), and take tuning with the scene preview tool.

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
    4s final-wrong / win). `audio.js` — small UI cues.
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
- Tests: 42 headless (negative controls) + 7 smoke + 13 e2e; CI runs headless
  on every push/PR. All green as of the last drop.
- Visual sign-off queue: `BROWSER_QA.md` (code-complete, visual-pending).

## Next candidates
- Owner feedback pass on the ✏️ drafted cinematic takes (use the preview tool).
- Human review of the question bank + host dialogue (`FLAGS.md`).
- Backlog ideas in `BACKLOG.md` (domain-mastery dashboard, PWA, etc.).
