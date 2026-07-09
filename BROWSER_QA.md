# BROWSER_QA.md — visual sign-off queue

Structural/interaction tests (`tests/smoke.mjs`, `tests/e2e.mjs`) prove the app
boots and plays. **Visual correctness still needs a human** (`CLAUDE.md §6`).
Items stay **code-complete, visual-pending** until signed off here.

How to look: run `npm run serve` and open http://localhost:8080/ (or just open
the live site). Prefer a real GPU browser for the WebGL.

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
