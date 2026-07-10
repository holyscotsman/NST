# BROWSER_QA.md — visual sign-off queue

Structural/interaction tests (`tests/smoke.mjs`, `tests/e2e.mjs`) prove the app
boots and plays. **Visual correctness still needs a human** (`CLAUDE.md §6`).
Items stay **code-complete, visual-pending** until signed off here.

How to look: run `npm run serve` and open http://localhost:8080/ (or just open
the live site). Prefer a real GPU browser for the WebGL.

## Pending sign-off — music, cinematics & dashboard (newest)

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
