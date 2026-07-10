// takes.js — the camera script: every cinematic scene, take by take.
// Pure data, written to be hand-tuned. Full table in docs/CINEMATIC_TAKES.md.
//
// A SCENE is a playlist of TAKES. Looping scenes are ambient backgrounds; a
// trigger cuts to a one-shot scene, which then returns to the interrupted
// background (or advances to `next`). Durations are seconds.
//
// Take types (evaluated by src/shell/director.js):
//   { type:'orbit',  dur, center:[x,y,z], radius, height, from, to, look:[x,y,z] }
//       — circles `center` at `radius`/`height`, sweeping `from`→`to` degrees
//   { type:'dolly',  dur, from:{p,t}, to:{p,t} }
//       — glides camera position p and look-target t between two poses
//   { type:'pan',    dur, p:[x,y,z], from:[x,y,z], to:[x,y,z] }
//       — camera fixed at p; the look-target sweeps from→to (pans and tilts)
//   { type:'static', dur, p:[x,y,z], t:[x,y,z] }
//       — locked-off shot
//
// Stage geography (see studio.js): stage center [0,~1,0]; console at center;
// HOST seated at [2.1, ~1.5, 0]; CONTESTANT (hot seat) at [-2.1, ~1.5, 0];
// audience arc on the -z side (radius 11–16, heights 0.2–3.6); wordmark panel
// at z=-12; PIGGY BANK pedestal at [4.2, ~1.0, 2.2]; STAGE MANAGER in the
// wings at [-6.5, 0, 3]. Green room: sofa ~[0.4, 0, -4.8]; phone on the table
// at [0.1, 0.63, -3.1]; SKETCHY GUY by the doors at [-3.5, 0, -6.55]; the
// hinged door swings at [-2.0, 1.7, -6.9] (manager beat).

export const SCENES = {
  /* ================= user-specced scenes (verbatim timings) ================= */

  // Intro cinematic — slow orbital rotation around the soundstage, hot seat
  // center. Seamless full-360 loop, slowed way down (owner note: the original
  // 10s lap read as too fast).
  intro: {
    set: 'studio', loop: true,
    takes: [
      { type: 'orbit', dur: 36, center: [0, 1.2, 0], radius: 13, height: 4.2, from: 90, to: 450, look: [0, 1.3, 0] },
    ],
  },

  // The host welcomes the player back to the Hot Seat — plays at the top of
  // every run (after the first-run tutorial exists) under his speech bubble.
  hostWelcome: {
    set: 'studio', hold: true,
    takes: [
      { type: 'dolly', dur: 4,
        from: { p: [-0.9, 1.8, 4.6], t: [2.1, 1.5, 0] },
        to:   { p: [-0.45, 1.72, 4.0], t: [2.1, 1.48, 0] } },
    ],
  },

  // Host asks the question — plays at the start of each tier. Host in his
  // chair, leaning to camera as it slowly zooms. 4s, no loop → Player is
  // Thinking.
  hostAsks: {
    set: 'studio', next: 'thinking',
    takes: [
      { type: 'dolly', dur: 4,
        from: { p: [-1.5, 1.85, 6.5], t: [2.1, 1.5, 0] },
        to:   { p: [-0.4, 1.65, 3.6], t: [2.1, 1.45, 0] } },
    ],
  },

  // Player is thinking — the ambient in-question loop. 10 takes, then repeats.
  // Slowed WAY down from the original brief (owner note, twice): long takes
  // and tiny camera travel, so the backdrop breathes instead of competing
  // with the quiz card. Same ten compositions as specced.
  thinking: {
    set: 'studio', loop: true,
    takes: [
      // 1. focus on the contestant — 16s, gentle drift
      { type: 'dolly', dur: 16,
        from: { p: [1.7, 1.74, 4.2], t: [-2.1, 1.45, 0] },
        to:   { p: [1.5, 1.68, 3.85], t: [-2.1, 1.43, 0] } },
      // 2. both contestant and host — 16s, near-still
      { type: 'dolly', dur: 16,
        from: { p: [0, 2.55, 9.4], t: [0, 1.4, 0] },
        to:   { p: [0, 2.45, 8.9], t: [0, 1.38, 0] } },
      // 3. slow pan left→right across the audience — 14s, narrower sweep
      { type: 'pan', dur: 14, p: [0, 2.6, 2.5], from: [-5, 2.3, -9.5], to: [5, 2.3, -9.5] },
      // 4. above host + contestant, a slow settling tilt — 12s
      { type: 'pan', dur: 12, p: [0, 10.5, 4.5], from: [0, 3.6, -3.4], to: [0, 1.6, -0.9] },
      // 5. the piggy bank, unhurried push — 14s
      { type: 'dolly', dur: 14,
        from: { p: [7.3, 2.4, 5.8], t: [4.2, 1.4, 2.2] },
        to:   { p: [6.6, 2.1, 5.0], t: [4.2, 1.4, 2.2] } },
      // 6. the other side of the audience, watching the contestant — 16s
      { type: 'pan', dur: 16, p: [-1.5, 2.7, 2.2], from: [6.5, 2.3, -9.8], to: [-1.5, 2.4, -10.6] },
      // 7. wideshot — host/contestant centered, the whole room visible — 16s*
      { type: 'static', dur: 16, p: [0, 5.4, 15.5], t: [0, 1.7, -1] },
      // 8. slow drift on the intensity of the contestant — 12s
      { type: 'dolly', dur: 12,
        from: { p: [0.5, 1.72, 2.9], t: [-2.1, 1.5, 0] },
        to:   { p: [0.28, 1.68, 2.62], t: [-2.1, 1.5, 0] } },
      // 9. slow drift on the intensity of the host — 12s
      { type: 'dolly', dur: 12,
        from: { p: [-0.5, 1.72, 2.9], t: [2.1, 1.5, 0] },
        to:   { p: [-0.28, 1.68, 2.62], t: [2.1, 1.5, 0] } },
      // 10. barely-moving orbital around the soundstage — 16s, 18° of arc
      { type: 'orbit', dur: 16, center: [0, 1.2, 0], radius: 11, height: 3.6, from: -54, to: -36, look: [0, 1.3, 0] },
    ],
  },

  /* ============ drafted scenes — take/timing details open to tuning ============ */

  // Host asks "Is that your final answer?" — plays on lock-in; a tight push on
  // the host that holds through the suspense until the reveal cuts away.
  finalAnswer: {
    set: 'studio', hold: true,
    takes: [
      { type: 'dolly', dur: 4,
        from: { p: [0.0, 1.8, 3.7], t: [2.1, 1.5, 0] },
        to:   { p: [0.65, 1.68, 2.8], t: [2.1, 1.48, 0] } },
    ],
  },

  // Question is correct — relief pull-back off the contestant, then a quick
  // celebratory sweep across the audience. Returns to the background scene.
  correct: {
    set: 'studio',
    takes: [
      { type: 'dolly', dur: 2.5,
        from: { p: [-0.2, 1.6, 2.1], t: [-2.1, 1.45, 0] },
        to:   { p: [1.0, 2.0, 3.8], t: [-2.1, 1.4, 0] } },
      { type: 'pan', dur: 2.5, p: [0, 3.0, 3], from: [-8, 2.2, -9], to: [8, 2.2, -9] },
    ],
  },

  // Question is incorrect — a slow retreat from the contestant, then the
  // overhead looking down on a dimmed stage.
  incorrect: {
    set: 'studio',
    takes: [
      { type: 'dolly', dur: 3,
        from: { p: [0.4, 1.7, 2.4], t: [-2.1, 1.35, 0] },
        to:   { p: [1.9, 2.7, 6.2], t: [-2.1, 1.3, 0] } },
      { type: 'static', dur: 3, p: [0, 12, 4], t: [0, 0.8, 0] },
    ],
  },

  // Host explains the next part — plays when coins bank at a tier boundary; a
  // gentle arc around the two-shot while he talks.
  hostExplains: {
    set: 'studio',
    takes: [
      { type: 'orbit', dur: 4, center: [0, 1.3, 0], radius: 7, height: 2.6, from: 30, to: 75, look: [0, 1.4, 0] },
    ],
  },

  // Final question correct — the win: a fast orbit around the contestant, a
  // wide push on the celebrating stage, then a long celebration orbit (loops).
  finalCorrect: {
    set: 'studio', loopTail: true,
    takes: [
      { type: 'orbit', dur: 3, center: [-2.1, 1.3, 0], radius: 4.5, height: 2.0, from: 0, to: 180, look: [-2.1, 1.4, 0] },
      { type: 'dolly', dur: 4,
        from: { p: [0, 6, 16], t: [0, 1.6, 0] },
        to:   { p: [0, 4.6, 12.6], t: [0, 1.6, 0] } },
      { type: 'orbit', dur: 8, center: [0, 1.2, 0], radius: 12, height: 5, from: 0, to: 360, look: [0, 1.5, 0] },
    ],
  },

  // The green room — a single calm locked-off shot of the lounge. No cinematic
  // here by owner request: the room is a backdrop for the shop menu, and an
  // imperceptibly slow drift keeps it feeling alive without pulling focus.
  greenRoom: {
    set: 'green', loop: true,
    takes: [
      { type: 'dolly', dur: 40,
        from: { p: [4.6, 2.6, 4.8], t: [-0.5, 1.2, -4] },
        to:   { p: [4.3, 2.5, 4.5], t: [-0.5, 1.2, -4] } },
    ],
  },

  // The stage manager opens the green-room door: "We're ready for you back in
  // the Hot Seat!" Plays on "Start next round"; holds on the doorway until the
  // run starts and the show cuts back to the studio.
  managerDoor: {
    set: 'green', hold: true,
    takes: [
      // approaches from the credenza side so the sofa stays out of frame
      { type: 'dolly', dur: 3.2,
        from: { p: [-4.9, 1.9, -2.7], t: [-2.2, 1.4, -6.9] },
        to:   { p: [-4.1, 1.65, -3.7], t: [-2.2, 1.35, -6.9] } },
    ],
  },

  // 50:50 — the overhead console beat: two screens go dark from above.
  fifty: {
    set: 'studio',
    takes: [
      { type: 'pan', dur: 3, p: [0, 8.5, 2.5], from: [0, 4, -2], to: [0, 1.1, 0] },
    ],
  },

  // Phone a friend — a slow ~10s push that holds on the contestant through the
  // whole phone-call cutscene (the friend's panicking speech bubbles play in
  // the DOM overlay). Matches the 10s cutscene in ui/overlay.js.
  phoneFriend: {
    set: 'studio', hold: true,
    takes: [
      { type: 'dolly', dur: 10,
        from: { p: [0.6, 1.78, 3.6], t: [-2.1, 1.5, 0] },
        to:   { p: [0.2, 1.66, 2.8], t: [-2.1, 1.48, 0] } },
    ],
  },

  // Ask the audience — sweep the crowd, then the view from the stage.
  audiencePoll: {
    set: 'studio',
    takes: [
      { type: 'pan', dur: 3, p: [0, 3.1, 2.8], from: [-9, 2.4, -10], to: [9, 2.4, -10] },
      { type: 'static', dur: 3, p: [0, 3.2, 3], t: [0, 3, -13] },
    ],
  },

  // Sketchy guy phone call (green room, Steve) — the phone first, then the
  // figure loitering by the doors.
  sketchyCall: {
    set: 'green',
    takes: [
      { type: 'dolly', dur: 3,
        from: { p: [1.7, 1.4, -0.9], t: [0.1, 0.63, -3.1] },
        to:   { p: [0.8, 0.98, -2.2], t: [0.1, 0.63, -3.1] } },
      { type: 'dolly', dur: 4,
        from: { p: [-0.8, 1.75, -3.2], t: [-3.5, 1.35, -6.6] },
        to:   { p: [-1.6, 1.6, -4.6], t: [-3.5, 1.3, -6.6] } },
    ],
  },

  // Producer / stage manager: "they're ready for you" — plays as a new game
  // starts: the wings, then a sweep onto the stage.
  producerReady: {
    set: 'studio',
    takes: [
      { type: 'dolly', dur: 3,
        from: { p: [-3.6, 1.95, 5.2], t: [-6.5, 1.35, 3.0] },
        to:   { p: [-5.0, 1.7, 4.0], t: [-6.5, 1.3, 3.0] } },
      { type: 'pan', dur: 2.5, p: [-4, 2.2, 6], from: [-6.5, 1.3, 3], to: [0, 1.2, 0] },
    ],
  },
};

// * take 7 of "thinking" had no duration in the brief — set to 5s, flagged in
//   docs/CINEMATIC_TAKES.md for confirmation.
