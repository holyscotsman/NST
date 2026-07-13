# BROWSER_QA.md — visual sign-off queue

Structural/interaction tests (`tests/smoke.mjs`, `tests/e2e.mjs`) prove the app
boots and plays. **Visual correctness still needs a human** (`CLAUDE.md §6`).
Items stay **code-complete, visual-pending** until signed off here.

How to look: run `npm run serve` and open http://localhost:8080/ (or just open
the live site). Prefer a real GPU browser for the WebGL.

## Pending sign-off — v0.1.1 kickoff (newest)

- [ ] **Music on first click** — load the title fresh (hard refresh), click once
  anywhere: the show theme should start within a second, no off/on toggle
  needed. Also background the tab a minute, return, click: it resumes.
- [ ] **Upbeat title theme** — the menu/green-room track is now an up-tempo
  show opener (bright progression, driving bass, the question hook on top).
  Confirm it reads as game-show excitement, not elevator jazz — and that the
  four music styles (studio/neon/mellow/arcade) still sound right on it.
- [ ] **Audience faces the stage** — `?scene=thinking&take=3` and
  `?scene=audiencePoll`: every seated person (and chair) faces stage centre —
  faces/laps toward the stage, hair at the back; wave/cough/leave crowd
  moments still swap in facing the right way.
- [ ] **Exhibit questions** — play until an interchange question with an image
  appears (dev-jump: seed NTNX-TEST2 → Q25): the exhibit renders between stem
  and options, readable, with a caption-less clean frame; alt text present.
- [ ] **"Why the other options are wrong"** — answer an interchange question
  correctly: the collapsed panel under the explanation opens to per-option
  notes. Get one wrong: the green-room reveal shows "Your pick:" with the note
  for the option you chose.
- [ ] **Version badge** — v0.1.1 shows in the title footer, legible, unobtrusive.

## Pending sign-off — lifeline & insider cinematics (newest)

- [ ] **Ask the Audience vote** — fire it mid-question: the camera cuts to the
  crowd from the stage, the audience raises colour-coded vote cards weighted to
  the poll (most on the popular pick), and the DOM poll rows match those colours;
  camera hands back after ~6s while the panel stays. Reduced motion: cards snap
  on, no camera move.
- [ ] **Call Shady Steve** — in the green room, pay Steve: the split-screen phone
  cinematic plays (you left, Steve right — hat/shades/smirk), 5 bubbles in order
  (he acknowledges → three clue bubbles → sign-off), Skip works, and the clue is
  still in the panel afterward. Reduced motion shows the whole clue at once.
- [ ] **Reset progress** — Settings → "Reset progress": confirm it wipes
  everything and the next game opens with the first-run intro; applied settings
  (motion/contrast/audio) reset too.

## Pending sign-off — hardening pass (newest; `docs/HARDENING_REVIEW.md`)

- [ ] **Keyboard focus ring** — Tab to the answer options: each shows a clear
  inset gold focus ring (it used to be clipped away by the lozenge shape). Arrow
  keys move between options (selection follows focus); number keys + Enter still
  work; the ring reads on every state.
- [ ] **Selection glyph** — a selected option shows a ◉ (single) / ▣ (multi)
  marker, not just the aqua tint — check it's legible and that it gives way to the
  ✓/✗ on reveal.
- [ ] **Grain under reduced motion** — with reduced motion on and effects on, the
  film grain is static (no shimmer); everything else still cuts, not moves.
- [ ] **Pause during suspense** — lock an answer, then hit Escape during the gold
  hold: the "Final answer!" bubble should not float over the pause menu, and the
  answer should grade only after you resume (not behind the overlay). Quit-to-title
  from that state must not later flash a stray reveal.
- [ ] **Audience swap** — during a wave/leave crowd moment the stand-in should be
  the same colour as the seat it replaced (no colour pop in or out).

## Pending sign-off — owner feedback (newest)

- [ ] **Thinking-scene dim** — while a question is being read out the rig is full;
  a couple of seconds in (the thinking cinematic) it eases down a touch for drama;
  it flares back on the reveal and dims hard on lock-in. Confirm it reads as a
  subtle mood shift, not a jarring cut, and reduced-motion still looks fine.
- [ ] **More natural idle** — host/contestant/crew breathe with a layered rise,
  the head drifts with a slight roll, the body slowly shifts weight, blinks are
  smooth (with the odd double blink), and arms sway loosely — nobody loops one
  stiff wobble. No hitching; crowd wave/cough/leave still fine.
- [ ] **Compact ladder** — the right rail is narrower with smaller rungs; all 30
  rungs fit without scrolling on desktop; the gold highlight still tracks the
  current rung; mobile top-strip still reads.
- [ ] **Pillars** — the perimeter columns are darker/thinner and no longer cross
  the show title (front or back); the menu title and the 3D wordmark read clean;
  side columns still frame the stage. Watch across the menu's slow orbit.
- [ ] **Audience as people** — the seated crowd has skin heads, hair, shirts, and
  resting arms with per-person colour variation (no uniform blue mass); the
  walk-on waver/cough/leave moments still swap in seamlessly and restore the
  seat afterward (`?scene=thinking&take=3` and `take=7` for the wide shots).
- [ ] **Host congrats beats** — clear a safe haven (Q5/Q10/Q17/Q25): the host
  bubble celebrates the bank during the reveal. Cross into medium (Q11) and hard
  (Q21): the host congratulates + warns it gets harder. Nothing fires on easy Q1
  or over the tutorial; reduced-motion still shows the bubbles briefly.

## Pending sign-off — graphics overhaul (newest; `docs/GRAPHICS_OVERHAUL.md`)

Structural verification passed (tests green; effects-off + reduced-motion path
boots/plays/reveals with no console errors; all five phases confirmed to coexist
in a single frame via `tests/shots-gfx.mjs`). The remaining gate is human, on
real hardware:

- [ ] **FPS budget** — turn on the dev meter (`?fps=1` or Alt+F) and confirm the
  studio holds ~60 (and ≥45 on weaker hardware) with effects on; note the drop
  when the reflective floor / bloom / motes are on screen.
- [ ] **Hero floor + environment** — the stage disc reflects the rig; emissive
  props (rim, spokes, monitors, medallion) drive tasteful bloom, not blowout.
- [ ] **Shadows + rim light** — figures cast soft shadows onto the disc; the cool
  back/rim light separates the hot seats from the backdrop; the lock-in cue dims
  the fills to a hard-key pool and crossfades back on the reveal.
- [ ] **Set detail** — curved LED video wall, alternating iris/aqua light
  columns, the floor medallion (the show's own mark), and the truss light cans
  all read as real broadcast hardware; columns frame rather than wash.
- [ ] **Post grade** — vignette darkens the corners, film grain is subtle, and
  the camera micro-motion keeps settled shots from feeling frozen; the
  "Cinematic effects" Settings toggle turns all of it (plus motes) off cleanly.
- [ ] **Answer lozenges** — A/B/C/D read as the broadcast hexagonal lozenges in
  every state (hover / selected / locked / correct / wrong / removed / phone
  pick); the locked option's gold edge-glow traces the shape; high-contrast and
  mobile (390px) still lay out cleanly.
- [ ] **Dust motes + screen wipes** — faint motes drift in the beams during play
  (gone under reduced motion / effects-off); the brand-gradient wipe sweeps on
  menu ↔ game ↔ results changes without a hard cut.

## Pending sign-off — graphics + animation polish (newest)

- [ ] **Procedural textures** — the stage disc reads as a machined platform
  (concentric grooves), console + camera monitors show glowing grids, green
  room walls have warm wood paneling. `?scene=thinking&take=7`, `?scene=greenRoom`.
- [ ] **Smoother reactions** — tier/mood key-light now eases between colours
  instead of snapping; correct/wrong face reactions and the contestant's
  arms-up ramp in and out (no pop).
- [ ] **Lifeline cutscenes** — Phone a Friend 10s panicking cutscene; audience
  poll (now fallible). Trigger them in a run.

## Pending sign-off — the living studio

- [ ] **Faces & idle life** — blinking, breathing, head sway; host's mouth
  moves while he talks; smiles on correct, frowns + dropped heads on wrong;
  contestant's arms up on a correct answer. (`?scene=hostWelcome`,
  `?scene=thinking&take=8`.)
- [ ] **Seated audience** — chair rows + risers read as people sitting
  (`?scene=thinking&take=3`); wideshot shows the whole broadcast floor with
  the fourth-wall pedestal cameras + operator (`?scene=thinking&take=7`).
- [ ] **Crowd moments** — wait on the thinking loop: occasional wave, cough
  (listen for it), or someone getting up and leaving; never more than one at
  a time; nothing under reduced motion.
- [ ] **Headset** — over-the-crown band + ear cups + boom mic
  (`?scene=producerReady`).
- [ ] **Audio status line** — pause menu / settings explain the engine state;
  toggling music back on mid-question resumes the tier loop instantly.

## Pending sign-off — owner feedback batch 2

- [ ] **Capsule people** — host (suit, silver hair, bow tie), contestant,
  crew, sofa contestant; hot seats read as chairs (backrest + footrest).
  Look via `?scene=hostWelcome`, `?scene=thinking&take=1`, and the wideshot
  `?scene=thinking&take=7`.
- [ ] **Host welcome beat** — every run opens on the host + a fresh line;
  after 3 attempts the snarky ones may appear.
- [ ] **Question read-out** — stem alone first, answers appear one at a time;
  the host quip bubble shows alongside; nothing feels too slow/too fast.
- [ ] **"Final answer!" bubble** — pops by the contestant on lock-in.
- [ ] **Thinking loop, slowed way down** — drifts, not moves; confirm it no
  longer distracts behind the card.
- [ ] **Pause menu** — ☰ Menu / Escape; toggles work live; seed copy works
  on a seeded run; quit-to-title confirms.
- [ ] **Green room** — dashboard gone, menu low, lounge visible; the sofa
  contestant reads as a person.
- [ ] **Audio recovery** — background the tab a while, come back, click once:
  music resumes.

## Pending sign-off — owner feedback batch

- [ ] **Stage-manager door beat** — in the green room press "Start next
  round": the door swings open with warm hallway light, the manager stands in
  it, the speech bubble pops, then the run starts. (Preview the framing with
  `?scene=managerDoor`.)
- [ ] **Green room brightness** — a tad brighter, still a warm dim lounge;
  the ambient camera barely moves now.
- [ ] **Thinking takes at double length** — confirm the slower cutting reads
  calmer behind the quiz card (owner may still want triple).
- [ ] **Money ladder text size** — bigger rungs on desktop + mobile strip.
- [ ] **Hard-round suspense** — longer gold hold + subtle drum roll on hard
  and final questions; early tiers still quick.
- [ ] **Easy/medium music** — easy is more dramatic but upbeat; medium is the
  same melody, lower and minor. Menu plays the lounge after the first click
  (the 🔊 hint explains the browser autoplay gate).

## Pending sign-off — music, cinematics & dashboard

- [ ] **Cinematic takes** — review every scene via `?scene=<name>` (see
  `docs/CINEMATIC_TAKES.md`); confirm the ✏️ drafted scenes and take 7's 5s.
- [ ] **Music** — lounge (menu/green room), tier loops slowing/darkening,
  final drone, lifeline vamp hand-back, stingers (right / 3s wrong /
  4s final-wrong / win).
- [ ] **Intro cinematic + tutorial** — first-run tour, highlights, the
  answer giveaway, skip button.
- [ ] **Loss flow** — wrong answer → green room reveal → pep talk → shop.
- [ ] **Mastery dashboard** — bars/percentages/weak markers read correctly.

## Pending sign-off — Game A redesign

- [ ] **Game screen** — right-rail ladder (glyphs, safe havens, gold sliding
  highlight), upper-left coins + medallions, lower-center card match the
  design handoff (`Game A.dc.html`).
- [ ] **Choreography** — entrance stagger, gold lock-in suspense, reveals,
  bank particles, poll bars, phone typewriter, win confetti read as intended.
- [ ] **CSS backdrop** — haze/beams/disc/audience and the green-room warm
  variant (force no-WebGL to see it; it is also what mobile/weak GPUs get).
- [ ] **Title / green room / results** — match the handoff screens.
- [ ] **Mobile 390px** — top ladder strip, compact HUD, bottom card.
- [ ] **Reduced motion** — everything cuts instantly; nothing looks broken.

## Pending sign-off

- [ ] **Studio scene** — disc/rim/spokes, console, host + contestant figures,
  instanced audience arc, truss, beams, wordmark backdrop read as intended.
- [ ] **Green room scene** — lounge composition, warm lighting, the phone (Steve).
- [ ] **Camera choreography** — cuts per moment (two-shot, host, contestant,
  overhead, audience) feel right; final gets emphasis.
- [ ] **Mood + pulses** — tier colour shifts; mantis (correct) / peach (wrong)
  pulses are single, sub-3 Hz, not strobing.
- [ ] **Reduced motion** — with the Motion setting on "reduced", cameras cut
  instantly and no flashes fire.
- [ ] **Bloom** — if the post-processing bloom loads, glow is tasteful, not blown out.
- [ ] **Mobile** — HUD, ladder strip, options, and panels lay out cleanly on a phone.
- [ ] **CSS fallback** — force WebGL off (or a device without it) and confirm the
  gradient studio + full playability.

## Signed off
- _none yet._
