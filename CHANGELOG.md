# Changelog

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
