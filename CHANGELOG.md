# Changelog

## Unreleased — owner feedback: thinking-scene dim + more natural idle motion

- **Dramatic thinking beat** — once the host finishes reading a question out, the
  rig eases down a touch (the "thinking" cinematic) for a more deliberative mood;
  it flares back to full on the reveal, and the lock-in still dims much further.
  A distinct light level between the bright read-out and the deep lock-in.
- **More natural people** — the idle animation is richer: layered two-tone
  breathing (chest widens as it rises), multi-frequency head motion with a slight
  roll, a very slow whole-body weight shift, a smooth multi-frame blink (with an
  occasional double blink), and layered arm sway — so the cast reads as alive
  rather than looping one wobble. Still allocation-free, one RAF, motion-gated.

## Unreleased — owner feedback: ladder, pillars, audience, host congrats

- **Compact money ladder** — the right-rail ladder is narrower with tighter,
  smaller rungs so it reads cleaner and frees space for the question card.
- **Pillars recede** — the perimeter light columns are darker, thinner, and the
  ones on the center line (front and back) are removed so they stop crowding
  the show title; the remaining columns frame the stage from the sides.
- **The audience are people now** — the seated crowd is rebuilt to match the
  walk-on actor: a shirt torso with resting arms, a skin-tone head, and hair,
  with per-person colour variation so they read as individuals instead of a
  uniform blue mass. Still just a few instanced draw calls for the whole crowd.
- **Host congrats beats** — clearing a safe haven now gets a "that's banked,
  take a breath" beat from the host; crossing into the medium and hard tiers
  gets a "nice work — it gets tougher now" beat. Authored show-host flavour
  (never exam content); flagged for human review with the other host lines.

## Unreleased — graphics overhaul (phase 5): UI lozenges, dust motes, transitions

- **Broadcast answer lozenges** — the A/B/C/D options are redrawn to the classic
  game-show hexagonal-lozenge silhouette (pointed ends via `clip-path`), with a
  cool hairline that traces the shape and a subtle top-lit gradient fill. Every
  answer state (hover / selected / locked / correct / wrong / removed) reads on
  the new shape; the "borders" moved to inset shadows so they follow the clipped
  silhouette instead of a cut-off rectangle.
- **Animated lock-in edge glow** — the locked option gets a breathing gold ring
  clipped to the lozenge.
- **Volumetric dust motes** — a faint additive mote field drifts up through the
  light beams during play, selling the volumetric light. Motion + effects only
  (off under reduced motion and the cinematic-effects toggle).
- **Branded screen transitions** — top-level screen changes (menu ↔ game ↔
  results) sweep a brand-gradient wipe instead of hard-cutting. Skipped under
  reduced motion / effects-off.

## Unreleased — graphics overhaul (phase 4): post polish + camera micro-motion

- **Vignette + film grain** — a final grade pass (inline custom shader, last in
  the composer) darkens the corners and adds very subtle animated grain, so the
  frame reads as produced footage. Blacks stay black (bloom still only catches
  emissives).
- **Camera micro-motion** — a ≈0.5% handheld drift on top of the director's
  pose so even settled shots never feel frozen. Off under reduced motion.
- **Cinematic-effects toggle** — a new Settings switch turns off bloom +
  vignette/grain + camera drift for a flatter, cheaper image (accessibility /
  low-end hardware); persists in the save.

## Unreleased — graphics overhaul (phase 1): set detail

- **Wraparound LED video wall** — a curved emissive panel arcing above the
  audience shows a grid of glowing brand-colour cells (procedural, abstract —
  no trade dress); the big produced backdrop.
- **Center stage medallion** — an original neon emblem (nested hexagons +
  radial ticks) inlaid into the stage floor.
- **Perimeter light columns** — vertical neon fins framing the stage,
  alternating iris/aqua (two instanced meshes), tuned below the bloom threshold
  so they frame rather than wash.
- **Rig fixtures** — instanced light cans hanging from the truss with emissive
  lenses, so the overhead rig reads as real hardware. All repeats instanced.

## Unreleased — graphics overhaul (phase 3): shadows, rim light, lock-in cue

- **Soft shadows** — the renderer now casts PCF soft shadows from one key
  spotlight (1024 map, tuned bias/radius); the host and contestant cast, the
  stage floor receives, so the figures ground into the set. Fills and the
  distant audience don't cast (perf).
- **Rim/back light** — a cool spot behind the hot seats separates the host and
  contestant from the dark background.
- **Lock-in lighting cue** — when you lock an answer, the fill lights crossfade
  down to a hard-key pool on the contestant (the classic tension beat) and
  flare back up on the reveal. Driven by a new `ui:lockin` event; reduced
  motion snaps rather than dims.

## Unreleased — graphics overhaul (phases 0 + 2): environment, reflective floor

Adapted from the owner's 5-phase graphics directive (docs/GRAPHICS_OVERHAUL.md),
kept modular + vendored per CLAUDE.md (no CDN, original art).

- **Phase 0** — a dev-only FPS meter (`?fps=1` / Alt+F, off by default) for
  verifying the perf budget on real hardware; a GL screenshot harness
  (`tests/shots-gfx.mjs`) capturing the five gameplay states into `shots/`;
  and `docs/GRAPHICS_AUDIT.md` grounding the directive in the real codebase.
- **Phase 2** — a **PMREM environment map** built from a small procedural neon
  scene (core Three.js — no addon, no CDN) so metals and gloss finally have
  something to reflect; the **hero stage floor** is now low-roughness /
  high-metalness and mirrors the rig; key emissives (rim, spokes, monitors,
  halo) authored above 1 so bloom catches them deliberately. Env render target
  is disposed on teardown.

## Unreleased — critical code review: fixes, hardening, tests

Full-codebase review (core / shell / UI / tests) — findings and remediation in
docs/CODE_REVIEW.md. Highlights:

- **Correctness:** seeded lifelines are no longer order-dependent (dropped the
  redundant rng salt); `selectionWeight` can't go negative and strand an item;
  `askAudience` no longer orphans vote mass on a single-distractor item; the
  importer can't clobber a good bank (refuses empty results, writes atomically);
  stale loss-reveal cleared on return to title; `answer()`/`continueAfter`
  hardened against bad input and double-advance.
- **Accessibility:** reduced motion now also zeroes animation/transition
  *delays* (staggered entrances were still animating); the Ask-the-Audience
  count-up no longer floods the live region (bars aria-hidden + a static
  summary); the intro cinematic takes focus and announces each line.
- **Performance:** removed the per-frame allocations from the RAF path
  (`setMouth`/Object.entries, the director's pose wrapper, the crowd closure,
  the flash Color); `dispose()` now frees textures + the bloom composer.
- **Cleanliness:** deleted dead CSS/fields/branches, named the overlay's magic
  timings, fixed a doc/return mismatch.
- **Tests:** +11 (86 headless total) — importer write-gate (can't ship a broken
  or empty bank), parser aliases/extraction/conflicts/duplicate-ids,
  mastery-mode reproducibility, and the audience single-distractor edge. All
  with negative controls.

## Unreleased — graphics + animation polish

- **Procedural textures** (all canvas-generated in code — no image files): the
  stage disc is a brushed, grooved broadcast platform; console and broadcast-
  camera monitors show a glowing grid screen (shared emissive texture); the
  green-room walls get warm vertical wood paneling.
- **Smoother animation:** the key light now *eases* between tier/mood colours
  instead of snapping, and the correct/wrong face reactions (head lift/drop,
  the contestant's arms-up) ramp in and out with an envelope rather than
  popping. No new per-frame allocation; all still skipped under reduced motion.

## Unreleased — music variations (selectable arrangements)

- **Pick your arrangement.** A new music-style selector (Settings and the
  pause menu) switches the whole score between **Studio (original)**, **Neon
  synthwave**, **Mellow lounge**, and **8-bit arcade** — each a transform of
  the same original compositions (tempo, instrument timbre, dynamics), so it's
  a different voice, not different music. The change is audible immediately and
  persists in the save. Still original synth only (CLAUDE.md §6).
- Implemented as a pure `styleTrack(track, styleId)` transform (notes arrays
  are shared read-only, so no per-tick allocation); headless-tested with
  negative controls (studio = identity, unknown style = no-op, notes never
  mutated).

## Unreleased — lifeline overhaul: Phone-a-Friend cutscene, fallible audience

- **Phone a Friend is now a ~10s cutscene** — the friend picks up, panics
  through speech bubbles, and blurts a guess that tags the option they named.
  They're **68% correct / 32% wrong** (`PHONE_ACCURACY`); the UI never reveals
  which. Reduced motion skips to the guess. This is the game's ONE sanctioned
  timed sequence and it never limits the player's own decision.
- **Ask the Audience is now a believable, fallible poll** — the correct answer
  draws the most weight on average (so it helps), but a random "trap"
  distractor can occasionally win, more often on hard. Seeded Monte-Carlo in
  the tests: correct-plurality ≈ easy 95%+, medium 80%, hard 65%, extreme 55%.
- **Timer audit + policy** — confirmed there are no player decision timers;
  documented every timed thing as a presentation beat in `docs/LIFELINES.md`
  (new), which also captures the two mechanic changes above. `CLAUDE.md §3`
  updated to match (owner revisions of the original lifeline wording).
- Lifeline outcomes stay deterministic under a seed; assisted-correct still
  doesn't promote mastery; the authored key alone grades (nothing here grades).

## Unreleased — Markdown question-bank ingestion

- **Author the bank in Markdown.** New pure parser (`parseMarkdownBank.js`)
  and importer (`scripts/import-questions.mjs`, `npm run import:questions`)
  turn a Markdown file — one `## Qn` heading per question, options as
  `- [ ]`/`- [x]`, labelled `**Domain/Difficulty/Explanation/…**` fields —
  into `src/content/questions.js`. Every question is validated with the SAME
  schema the game uses at boot; the importer refuses to overwrite the bank if
  anything fails or the tiers can't fill a full run (unless `--force`).
- IDs auto-generate per domain/difficulty; single vs multi is inferred from
  the number of `[x]` marks; image files resolve from `src/content/images/`.
- Owner-provided questions import as `reviewStatus: "human-reviewed"` — the
  path to finally clearing the question-bank review flag (`FLAGS.md`).
- Docs: `docs/QUESTION_AUTHORING.md` (spec, template, and a ready-to-paste
  prompt for structuring questions in another chat), a format example, and an
  images folder README. Parser tested with negative controls (no key marked,
  image missing alt, too few options, empty input).
- The runtime still never uses AI to grade — the authored `[x]` is
  authoritative (CLAUDE.md §4).

## Unreleased — the living studio: faces, crowd, cameras + audio fixes

- **Animated faces and idle life** — everyone (host, contestant, stage
  managers, camera operator, green-room contestant) now breathes, sways,
  blinks, and glances around on independent phases. Mouths are swappable
  shapes: the host visibly *talks* while a question is read out or he
  welcomes you back; correct answers get smiles (the contestant throws their
  arms up), wrong answers get frowns and dropped heads; the door manager
  beckons. All trig on stored refs — no per-frame allocation; fully skipped
  under reduced motion.
- **The audience actually sits** — seated bodies (torso/lap/head) on visible
  chair rows, on riser platforms with an aqua fascia strip per tier.
- **Random crowd moments** — occasionally someone waves at the camera, coughs
  (with a soft diegetic cough sound), or gets up and walks out, leaving their
  seat empty for a while. One at a time, presentation-only randomness, never
  under reduced motion.
- **Fourth wall dressed** — three broadcast pedestal cameras (lens, red tally
  light, operator monitor) aimed at the stage, plus a camera operator.
- **Stage-manager headset fixed** — now a half-band arcing ear-to-ear over
  the crown with ear cups and a boom mic, parented to the head so it moves
  with it (it was a full ring on the wrong axis).
- **More polygons everywhere** — spheres/cylinders/capsules/tori bumped to
  smoother segment counts; faces gained noses and ears.
- **Audio fixes**: re-enabling music mid-run now resumes the tier loop
  immediately (it used to stay silent until the next question), and the pause
  menu + settings show a live audio-engine status line ("blocked until a
  click", "running — check tab/device mute") so silence is diagnosable.

## Unreleased — save transfer between devices

- **Export / import in Settings** — "Export save code" copies the full save
  (plain JSON, nothing secret in it) to the clipboard and shows it in a box;
  pasting a code and hitting "Import save code" replaces this device's
  progress after a confirm. Import runs the same `migrate()` as load, so
  sparse or older saves normalize cleanly, and unreadable codes are rejected
  with a message instead of a broken state. Headless-tested round-trip with
  negative controls (garbage/wrong-shape/wrong-version codes → null; prestige
  through export/import still never wipes mastery).

## Unreleased — queue pass: image hook, challenge links, reveal tick

- **Question image hook** — the schema accepts an optional
  `image { src, alt, caption? }` (local paths only — the game ships static and
  plays offline; alt text required), and the quiz card renders it between the
  stem and the answers, removing itself if the file fails to load. **No image
  content was authored** — that remains a human task (CLAUDE.md §7).
- **Challenge links** — `?seed=NTNX-XXXXXX` boots straight into that seeded
  run; the pause menu now copies a ready-to-share link next to the seed. One
  `normalizeSeed` path (uppercase, A-Z/0-9/dash, capped) covers typed and
  linked seeds so the same code always reproduces the same run.
- A soft **tick per answer** as the read-out reveals them (original synth cue).
- Tests: 59 headless (image + seed normalization negative controls) + 7 smoke
  + 17 e2e (challenge-link scenario).

## Unreleased — owner feedback batch 2: welcome host, read-out, people, pause menu

- **Host welcome cinematic on every run** — the camera settles on the host and
  a speech bubble greets the player back to the Hot Seat. A different line
  each time (never repeats back-to-back), and past three attempts he sometimes
  gets snarky. Lines live in `src/shell/hostLines.js` (headless-tested
  rotation/snark gating; copy flagged for human review in FLAGS.md).
- **Question read-out pacing** — the stem now sits alone long enough to read
  (scaled to its length), then the answers appear one at a time. No
  text-to-speech; pacing does the "reading". Reduced motion shows everything
  at once.
- **Speech bubbles** — the host gets a short quip bubble as each question is
  read (his chatter only — questions/answers never leave the DOM card), and
  locking in pops a **"Final answer!"** bubble by the contestant.
- **Thinking loop slowed way down** (second owner note): 12–16s takes with
  tiny camera drifts instead of moves; the title orbit now takes 36s per lap.
- **People, not sticks** — proportioned capsule-built people with skin, hair,
  faces, and clothing colours replace the stick figures: suited host with a
  gold bow tie, contestant in mantis, headset crew, plus readable hot seats
  (backrest + footrest). All original art drawn in code — no external model
  files (brand rule; see FLAGS.md #6).
- **Green room simplified** — the mastery dashboard is gone (owner request)
  and the menu sits low on screen so the 3D lounge is actually visible.
- **Audio hardened** — the gesture unlock is now permanent instead of
  once-only, so a re-suspended AudioContext (backgrounded tab, mobile) comes
  back on the next click/keypress; the tab regaining visibility also resumes.
- **Pause menu** — ☰ Menu in the HUD or Escape: music/sound toggles, the
  run's seed with a copy button (or a note that mastery runs have none), and
  quit-to-title. Covered by new e2e checks.
- First-run tutorial's safe-haven line corrected to Q5/Q10/Q17/Q25.

## Unreleased — owner feedback batch: banks, music, cinematics, green room

- **Safe havens moved to Q5 / Q10 / Q17 / Q25** (bank at Q29 removed) — coins
  now bank earlier and the whole hard round is played at risk. Help text, HUD
  shields, and the coins tests (with negative controls) updated to match.
- **Money ladder text enlarged** (desktop and mobile strip).
- **Hard-round suspense:** the gold lock-in beat holds longer on the hard tier
  (3s) and the final (3.8s), with a subtle snare-roll crescendo underneath
  (`music.drumRoll`); early tiers keep the quick two-breath beat.
- **Music:** the easy loop is more dramatic while staying upbeat (driving
  bass, chord pad, downbeat thump, I–V–vi–IV turn), and medium now plays the
  SAME hook melody a key lower in E minor — familiar tune, serious room.
  A "🔊 Click anywhere for sound" hint explains the browser autoplay gate on
  the title screen, and the audio unlock now registers before the WebGL boot.
- **Thinking-scene takes doubled in length** (10/10/6/6/8/10/10/6/6/10s) — the
  quick cuts behind the quiz card were distracting.
- **Green room:** lighting lifted a touch (still a warm lounge); the ambient
  camera is now a single near-static drift (no cinematic, by owner request);
  the menu sits center-lower on screen.
- **Stage-manager beat:** "Start next round" now opens the green-room door
  (hinged, warm hallway light behind it), the head-set stage manager stands in
  it, and an animated speech bubble pops — "We're ready for you back in the
  Hot Seat!" — before the run starts. Reduced motion: door cuts open, shorter
  hold, screen-reader announcement.
- Capitalization pass over UI strings (sentence case per the brand rule).

## Unreleased — green-room mastery dashboard

- **"Your mastery, domain by domain"** panel in the green room: per-domain
  progress bars computed from the shared Leitner state (`domainProgress` in
  `src/core/mastery.js`, headless-tested with negative controls). Weakest
  domains flagged first with a ▲ marker; unseen questions count as zero —
  mastery is proven, not assumed. Colorblind-safe (numbers on every bar).
- README refreshed to the current game (host tutorial, music, camera director,
  loss flow, mastery board); shared UI labels extracted to `ui/labels.js`.

## Unreleased — take tuning + scene preview tool

- **Scene preview tool:** `?scene=<name>&take=<n>` jumps the camera director
  to any scene/take for review, with a HUD to switch scenes, step takes, and
  restart. One-shot scenes repeat while under review.
- **Take fixes found with it:** the piggy-bank zoom no longer ends inside the
  piggy; the final-answer and intensity push-ins stop before figures bloom
  out; the piggy's pedestal glow is subdued.
- **GL green room re-lit** as the warm, dim lounge it was meant to be (dark
  walls, lamp pools, subdued wood/leather) — it was rendering blown-out white,
  which also hid the sketchy guy's silhouette.
- Stage-manager headset rebuilt as an over-ear band + boom mic (it read as a
  glowing hat).

## Unreleased — camera director: cinematic scenes & takes

- **Camera director** (`src/shell/director.js` + `src/shell/takes.js`): the
  studio camera now plays scene playlists of timed takes — looping background
  footage with event-triggered cutscenes that return to (or advance past) the
  interrupted scene. Owner-specced scenes implemented verbatim: the intro
  orbital (10s loop), "host asks" tier-opener (4s -> thinking), and the
  10-take "player is thinking" loop (contestant/host focus, audience pans,
  overhead tilt, piggy-bank zoom, wideshot, intensity push-ins, orbital).
  Drafted the rest for review: final-answer hold, correct/incorrect, host
  explains, final-correct win loop, green-room loop, the three lifelines,
  the sketchy-guy call, and producer-says-ready (docs/CINEMATIC_TAKES.md).
- **New set pieces:** a gold piggy bank on a lit pedestal at stage right, a
  stage manager (headset + clipboard) in the wings, and a sketchy guy (long
  coat, wide-brim hat) by the green-room doors. Original art drawn in code.
- Manual camera orbiting retired — the show is broadcast footage now; the
  intro tutorial's locked-off poses still work via director.holdPose.
- Reduced motion: every take is a locked-off cut held at its mid pose.


## Unreleased — music, intro cinematic, and the new loss flow

- **Procedural music** (`src/shell/music.js`): original WebAudio compositions,
  no files — a relaxed lounge vamp for the main menu + green room; tier loops
  that start quick and bright on easy and get slower and lower-keyed through
  medium, hard, and the final's low drone-and-heartbeat; a lifeline "thinking"
  vamp that plays during a lifeline and hands back to the tier loop after; and
  stingers — a quick positive hit on a correct answer, a ~3s wrong sound, a
  ~4s dramatic final-question-wrong, and the win fanfare. Music ducks under
  stingers and the lock-in suspense. New Music toggle in settings.
- **Intro cinematic + guided tutorial** (first run only, skippable): a camera
  tour of the soundstage — audience, host, contestant — then the host walks the
  player through the ladder, safe havens, lifelines, and locking in, and gives
  away the first question's answer ("on the house"; marked assisted so it never
  promotes mastery). Host dialogue flagged for human review in `FLAGS.md`.
- **Title menu** simplified to "Start new game" and "Enter seed" — the green
  room is reached through play, not the menu.
- **New loss flow:** a wrong answer shows "Not this time" and walks straight to
  the green room, which opens on the correct answer + explanation and a
  keep-going pep talk before the shop ("Start next round"). The green-room
  backdrop now has the contestant sitting on the sofa, bored — swaying and
  tapping a foot.
- **Stage lighting fixed:** the WebGL studio was too bright — dimmer key
  lights, gentler bloom, subdued floor spokes and beams, brighter figure
  accents, so the host, contestant, and audience actually read.

## Unreleased — Game A redesign

Implemented the full UI redesign from the design handoff (Game A "broadcast"
direction; see `docs/DESIGN_BRIEF.md`).

- **Layout:** money ladder is a full-height right rail (Q1 bottom → Q30 top)
  with a gold highlight that slides between rungs; coins panel + lifeline
  medallions pinned upper-left; question card floats lower-center; seed chip
  bottom-left. Mobile: ladder becomes a top horizontal strip, compact HUD row,
  bottom-anchored card.
- **Cinematic CSS backdrop** (`src/shell/backdrop.js`): drifting haze, set
  wordmark, truss, audience silhouettes, sweeping blurred light beams, stage
  disc with rotating gold spokes and aqua rim, tier mood tint, camera push,
  single-shot reveal pulses, and a warm green-room variant. Doubles as the
  no-WebGL fallback; reacts to the same event bus as the GL studio.
- **Choreography:** staggered question entrance; gold lock-in suspense
  (two breaths before the reveal); mantis stamp / peach shake reveals with the
  correct answer lighting 200ms later; coin count-up tweens; safe-haven bank
  particles + shield stamp; 50:50 power-down; staggered audience poll bars;
  phone typewriter; drain wipes and charge-pip flips on medallions; win
  confetti + ★ ring.
- **Screens** restyled: title hero with gradient wordmark, warm gold green
  room with Steve's portrait, gold-takeover win / subdued loss results.
- **Fonts:** vendored Montserrat is the variable font — declared as
  `font-weight: 400 800` so 600/700/800 render as true weights.
- All 42 headless, 7 smoke, and 11 e2e checks stay green; reduced-motion,
  colorblind-safe glyphs, keyboard/touch, and no-timers constraints preserved.

## Unreleased — first playable build

Added the whole first end-to-end game, hostable as static files on GitHub Pages.

- **Game core** (pure, headless-tested): seeded RNG, question schema/validator,
  Leitner mastery, lifelines (50:50 / Ask the Audience / Phone a Friend) with the
  integrity guarantees, coin economy with tier-boundary banking, seeded +
  mastery-driven selection with a double-buffered set manager, and the run state
  machine (permadeath, multi-answer all-or-nothing, impossible first final,
  prestige).
- **Browser shell**: persistent WebGL studio + green room (vendored Three.js),
  DOM quiz overlay, HUD money ladder, green room with a lifeline shop and Steve,
  original WebAudio cues, localStorage persistence, and the navigation wiring.
- **Accessibility**: keyboard + touch, colorblind-safe glyphs, reduced-motion,
  high-contrast, screen-reader announcements, no timers.
- **Content**: 157-question NCP-MCI bank across 12 domains, AI-drafted and
  independently AI-verified (offline ingestion QA), marked `verified` — pending
  human sign-off. 2 duplicate finals quarantined.
- **Tests**: 41 headless assertions with mandatory negative controls; a browser
  smoke test and a full-flow E2E (win + prestige, loss + green room, seeded).
- **Vendored**: Three.js r160 + addons and a self-hosted Montserrat subset — the
  site makes **no external requests**.
- **Docs**: `CLAUDE.md`, cinematic spec (incl. the §10 event contract), content
  QA report, and the state/flag/backlog/QA files.

### Fixes & polish
- Starting a run now clears the previous screen — the title/green-room menu no
  longer lingers behind the quiz card. Added an E2E regression guard.
- A win is tallied whether or not the player chooses to prestige afterwards
  (moved the counter out of `prestige`).
- Focus moves to the new screen's heading on navigation (keyboard / screen reader).
- Added a GitHub Actions workflow that runs the headless suite on every push and PR.

### Review follow-ups (from an automated PR review)
- Seeded runs are now reproducible through the impossible first final: the flag
  is passed to the seeded builder so Q30 is chosen with the seeded RNG, not
  `Math.random()`. Two first-time players on the same seed get the same final.
  (Mastery play keeps the non-deterministic swap.)
- A win now applies its prestige reset (coins + purchased slots) in `endRun`, so
  it can't be bypassed by leaving the win screen via "Back to title" — every exit
  starts a fresh climb. Mastery still persists.
