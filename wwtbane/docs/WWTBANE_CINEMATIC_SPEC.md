# WWTBANE — Cinematic backdrop spec

The 3D studio is a **backdrop**, not the game. The quiz is a DOM overlay on top of
the GL canvas (that split is what keeps the game accessible). This spec pins down
the studio, its cameras, the choreography, and — most importantly — **§10, the
event contract** that bridges quiz logic and the backdrop.

Status: implemented in `src/shell/studio.js`. Visuals are **code-complete,
visual-pending** — human sign-off tracked in `BROWSER_QA.md`.

---

## 1. Principles

- Built **once**. Scenes are camera moves + lighting/prop swaps, never rebuilds.
- **One RAF** owns the render loop (`Studio` via `renderer.setAnimationLoop`).
- No allocation in the update/draw loop; instanced meshes for the audience and
  floor spokes; deterministic jitter (no `Math.random` per frame).
- Original neon identity only. Stick figures + glow. No cloned trade dress; the
  wordmark is drawn in-canvas.
- `devicePixelRatio` capped at 2. GL resources disposed on teardown.

## 2. Scenes

- **Studio** — the game floor: a raised disc with a neon rim and gold spokes, a
  central console, host and contestant stools + figures, a tiered instanced
  audience arc, an overhead truss, volumetric light beams, and a backdrop panel
  carrying the original wordmark.
- **Green room** — a warm between-runs lounge: sofas, a coffee table with the
  phone (Steve), credenza, lamps, framed art, double doors, and the seated "you".

## 3. Camera presets

`two` (two-shot), `host`, `player` (contestant), `over` (overhead), `aud`
(audience), `green` (green-room establishing). Cuts ease over ~1.1s, or snap
instantly under reduced motion.

## 4. Lighting & mood

Key light colour tracks the current tier: iris (easy/hard tension), aqua
(medium), gold (final). A dedicated pulse light flashes mantis on a correct
answer and peach on a wrong one — a single bounded pulse, never a strobe.

## 5. Choreography (per game moment)

| Moment | Backdrop response |
|---|---|
| Question shown (easy/medium) | Studio scene, two-shot, calm mood |
| Question shown (hard) | Push to contestant, iris tension |
| Question shown (final) | Gold mood, two-shot, beams emphasised |
| Lifeline: audience | Cut to the audience |
| Lifeline: phone | Cut to the host |
| Lifeline: 50:50 | Overhead beat |
| Correct answer | Mantis pulse, cut to contestant |
| Wrong answer | Peach pulse, dim, pull to overhead |
| Win | Gold wash, beams spin up briefly |
| Enter green room | Swap to the green-room scene |

## 6. Reduced motion

Camera **cuts** instead of gliding; **no** flash pulses; beam animation halts.
Everything still reads as a staged studio, just static. Driven by the
`reducedMotion` flag (system preference or the in-game Motion setting).

## 7. Accessibility & performance guardrails

- The canvas is `aria-hidden`; nothing gameplay-critical is GL-only.
- Flashing capped well under 3 Hz (a single sub-second pulse per event).
- If WebGL fails to initialise, the shell hides the canvas and shows a CSS
  studio gradient — the quiz plays identically.

## 8. Teardown

`Studio.dispose()` stops the RAF, disposes geometries/materials, and removes the
canvas. Safe to call more than once.

## 9. Fallback contract

The backdrop is **optional**. `main.js` starts it in a try/catch; any failure
falls back to `#backdrop-fallback` (CSS). No quiz logic depends on the studio.

---

## 10. Event contract (the bridge)

`src/core/eventBus.js` is a synchronous pub/sub. The run controller **emits**;
the studio and audio **subscribe**. The quiz core conforms to this contract; any
change is renegotiated here first.

| Event | Payload | Emitted when |
|---|---|---|
| `run:start` | `{ seed, mode, runIndex }` | A run begins |
| `question:show` | `{ index, number, tier, isFinal }` | A question is presented |
| `final:impossible` | `{ q }` | The impossible first final is shown |
| `lifeline:use` | `{ type, tier, payload }` | A lifeline is spent |
| `answer:lock` | `{ index, selected }` | The player locks an answer |
| `answer:correct` | `{ index, tier, assisted, boundary, banked }` | Correct answer |
| `answer:wrong` | `{ index, correctAnswer, tier }` | Wrong answer (run ends) |
| `coins:bank` | `{ amount }` | Coins bank at a tier boundary |
| `run:win` | `{ payout }` | All 30 answered correctly |
| `run:dead` | `{ payout, wasFinal, wasImpossible }` | The run ends on a miss |
| `scene:studio` / `scene:green` | — | UI requests a scene swap |

Consumers must treat unknown events as no-ops (forward-compatible). The studio
subscribes to `*` and maps events to camera/lighting via `Studio.react`.

---

## Open questions (need the human)

- Palette identity: keep the StarNix-inherited palette or define WWTBANE's own?
- Should the host figure lip-sync/gesture to authored host dialogue once that
  content exists, or stay ambient?
- Green-room camera: a single establishing shot, or angles per shop action?
