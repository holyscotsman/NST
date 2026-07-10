# BROWSER_QA.md — visual sign-off queue

Structural/interaction tests (`tests/smoke.mjs`, `tests/e2e.mjs`) prove the app
boots and plays. **Visual correctness still needs a human** (`CLAUDE.md §6`).
Items stay **code-complete, visual-pending** until signed off here.

How to look: run `npm run serve` and open http://localhost:8080/ (or just open
the live site). Prefer a real GPU browser for the WebGL.

## Pending sign-off — the living studio (newest)

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
