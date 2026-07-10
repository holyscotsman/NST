# Changelog

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
