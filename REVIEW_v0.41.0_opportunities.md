# StarNix v0.41.0 — Deep review: areas of opportunity

> **Scope:** code-level review of `cc.js`, `kbb.js`, `exam.js`, `arm.js`, `starnix-shell.js` against specs 01–08, focused on Jason's four complaints: CC jank, KBB look/behavior, exam intuitiveness, ARM 3D feel. **Method caveat:** I am browser-blind — findings below are split into *provable from code* vs *needs your eyes*. No code was changed in this pass.

---

## 1. CC — "looks janky": root causes, ranked

Jank in a runner comes from motion discontinuities and frame pacing. CC has five provable ones:

**C1 — The camera never moves laterally.** `applySpeedCamera` sets `cam.position.set(P[0]+sx, …)` where `P[0]` is the constant `chasePos[0] = 0` (cc.js ~1280). The ship slides lane-to-lane across a bolted-down frame — the single biggest "cheap" tell vs Temple Run/Subway Surfers, where the camera eases a fraction of the player's x and counter-rolls slightly.
*Fix:* camera x eases toward `p.x * ~0.45` (spring/lerp), look-at x follows at ~0.3, add ±2–3° roll from lateral velocity. Headlessly assertable (camera x tracks player x within bounds); feel needs eyes.

**C2 — Linear lane tween + bank that snaps to zero.** `p.x = fromX + (targetX-fromX)*laneT` (linear, cc.js ~327) and `ship.rotation.z = (targetX - p.x) * 0.25` (~1350). Bank is maximal on the first frame of a lane change, decays linearly, and hits arrival with a derivative discontinuity (instant un-bank). Reads robotic.
*Fix:* smoothstep the tween (`t*t*(3-2t)`); drive bank from *smoothed lateral velocity*, not remaining distance, so it eases in and out.

**C3 — Duck is an instant snap.** `ship.scale.y = ducking ? 0.6 : 1` and a flat `-0.25` y drop, both single-frame (~1349-1351). Enter *and* exit pop.
*Fix:* ease a duck factor over ~90 ms both ways; add slight x-stretch (squash-and-stretch).

**C4 — Landing has no recovery.** Jump is `sin(π·t)` — vertical speed is *maximal* at ground contact, then `p.y = 0` the same frame (~337). A hard slam with zero acknowledgment: no squash, no camera dip, no dust.
*Fix:* 80–120 ms landing squash on the ship, 1-frame camera y dip (~0.1), reuse the dust pool for a landing puff. Sim untouched — view-only.

**C5 — Variable timestep.** The loop feeds raw RAF `dt` (clamped at 0.25 s) straight into `sim.step` (~1810). Spec 04 §5 explicitly requires a **fixed timestep**; it was never implemented. Every GC hitch — and we *know* the audio engine churns 5–8 Web Audio nodes per note — becomes a visible lurch, and sim behavior varies with framerate.
*Fix:* fixed-step accumulator (120 Hz sim, render each RAF; interpolation optional). Headlessly verifiable (identical inputs ⇒ identical sim trajectory regardless of dt slicing).

**Needs your eyes only:** texture-scroll strobe/shimmer on the distant floor (comments already flag the dial-down), wall-texture repetition, whether fog (`far = DRAW_DIST·0.95`) fully hides row spawn-in on your laptop's aspect.

**Verdict:** no rebuild. C1–C5 are a contained "game-feel pass" on the view + one loop change, all regression-guarded by the existing 284-check gate + fairness.

---

## 2. KBB — "doesn't look or behave the way I want": split the diagnosis

**What's demonstrably solid (don't rebuild):** the sim engine. 64 hooked artifacts (spec asked ~18 of 50), a real flat/mult/post damage pipeline, shop with rarity pricing + reroll, boss mechanics, deterministic RNG, 81/81 + 200-run fuzz + 14/14 draw harness. Rebuilding this would burn verified, spec-true work.

**Why it looks wrong — three compounding causes:**
- **K1 — You've never seen the intended art.** The 3D combat path is coded but `kbbHero1/2/3`, `kbbEnemy`, `kbbBoss`, `kbbAsteroid1-5` were never inlined into `STARNIX_ASSETS`, so every session has rendered the *procedural-triangle 2D fallback*. Judging KBB's look today is judging the placeholder.
- **K2 — The battle is visually subordinate.** Grid rows: combat canvas `3fr`, question panel `4fr`. The fantasy is "answers are your weapon," but the screen says "form with a decorative strip above it." Opportunity: make combat the stage and project the question *into* it (console/HUD framing) instead of a separate panel below.
- **K3 — Impact choreography.** Whether hits land with weight (flash, knockback, screen shake, damage numbers) is browser-blind; the draw fns exist but choreography timing needs your eyes once sprites are in.

**Why it behaves wrong — two provable causes:**
- **K4 — The tune is punishing (known: #35).** Squad 50 HP; enemy intent `3 + 0.5/round` scaling; a wrong answer deals no damage *and* you still eat the intent. Fuzz shows most variable-skill runs die in **section 1**. For a learning tool this is the real defect: mid-skill learners get ground down with no counterplay, which punishes studying.
- **K5 — Your only verb is "answer."** Spec §3 is faithfully implemented (question → damage → enemy intent), but within a battle there are zero decisions: no block/heal/attack choice, no target, no resource spend. The Slay-the-Spire/Balatro feel you named comes from *per-turn choice*; here all agency lives between battles (shop/artifacts). Also a real spec divergence: `maxAttacks: 5` vs spec §3's **3 + finishing blow** (the finishing blow itself is implemented).

**Recommendation:** not a full rebuild. Sequence: (1) inline the sprites — then judge the look for real; (2) re-tune combat per #35 with fuzz-driven targets (e.g. "a 70%-correct player reaches section 3"); (3) *then* decide the agency question — adding one in-battle decision layer (e.g. each turn choose **Attack / Brace / Repair**, where a correct answer executes the chosen action) is a contained sim change that fuzz can verify, and it delivers the StS feel without discarding the engine. **What I need from you:** one or two sentences on what "the way I want" looks like — pace? decisions? spectacle? A reference ("more like Balatro's scoring drama" vs "more like StS combat") targets the work.

---

## 3. Exam — "more intuitive": ranked fixes

The current exam is a *speed game* wearing an exam's clothes. Concrete issues:

**E1 — First click commits, irreversibly.** Single-answer questions grade on the first option click (exam.js ~275). No select→confirm, no changing your mind, misclick = wrong. Real exam software (and the real NCP-MCI) is select → highlight → confirm/Next. Highest-impact fix.

**E2 — Feedback is a 260/560 ms flash, then auto-advance.** You cannot read *why* you were wrong. The authored `explanation` — the learning-integrity centerpiece of the bank — is **never shown during the exam**, only in the missed-questions list at the very end. Fix: after grading, hold; show explanation + optionNotes; advance on **Next**.

**E3 — Per-question decay timer is the only mode.** Every question opens with points draining and a timeout that force-commits a wrong. That's a fine *Blitz* game mode; it is hostile as the default for 29 exhibit questions and multi-answer stems. Proposed mode split at the length picker:
  - **Study** — untimed, explanation after every answer, back-navigation.
  - **Exam sim** — one whole-exam clock (like the real cert: 120 min / 75 q), flag-for-review, review screen before final submit, explanations only at the end.
  - **Blitz** — the current decay-timer scoring, kept as the arcade mode (bests already tracked per length).

**E4 — Multi-answer submit is silently dead** until exactly *k* options are selected (both the button gate and `commit` require it). No message explains why nothing happens. Fix: always-enabled Submit with inline "select N more" hinting (still grade set-equality).

**E5 — No keyboard.** A–E to select, Enter to confirm, in a study tool used on a laptop. Cheap, big.

**E6 — Timeout UX.** Auto-commit null + 560 ms flash + advance is brutal; in Study mode remove timeouts entirely, in Exam sim a timeout belongs to the whole clock, not the question.

All E-items are contained in `exam.js` + a small shell picker change; every one is headlessly assertable (selection state machine, mode flags, keyboard events, explanation presence).

---

## 4. ARM — "feel like I'm in a 3D spacecraft"

**Challenge first:** a true 3D ARM (cockpit or chase cam) is a *new game* — CC-scale effort — and the top-down collect/dodge design doesn't survive a camera move into the plane. Before that conversation, know that "3D spacecraft feel" in 2D decomposes into five specific, cheap sensations ARM currently lacks:

**A1 — Depth: one starfield layer.** Stars render at a single parallax factor (`0.3`, arm.js ~890) plus nebula blobs. One layer = flat backdrop. Fix: 3–4 star layers at ~0.15/0.35/0.6/1.0 camera factors with size/alpha by depth; put a sparse *foreground* layer above the ship.
**A2 — The hull never banks.** The sprite rotates in yaw only. Fix: roll on turn (x-squash + slight shear or pre-rendered tilt), proportional to smoothed turn rate — the strongest "I'm flying a craft, not a cursor" cue.
**A3 — Camera is glued.** `camX/camY` track position only. Fix: velocity lead (look-ahead), soft spring, mild speed-based zoom-out, and a subtle *world counter-roll* (rotate the canvas 1–2° opposite the turn) — the whole scene banks with you.
**A4 — Thrust has no body.** Add star-streak stretch scaling with speed (the warp code already proves the technique — run it at 10–20 % intensity in normal flight), engine plume length by throttle, tiny acceleration shake.
**A5 — Occlusion/lighting order.** Foreground rocks drawn *over* the ship at a faster parallax factor sell depth instantly.

**Recommendation:** do the A1–A5 feel pass (view-only, no sim/contract change, structurally testable, then your eyes judge). If after seeing it you still want true 3D, that's a scoped rebuild discussion with real costs — not the first move.

---

## 5. Cross-cutting

**X1 — Stop waiting on the audio node-churn fix.** 5–8 Web Audio nodes created/stopped per note is a known-bad design; it's the prime suspect for frame hitches in *all three* games and directly amplifies CC's C5. The `?perf`-audio-off confirmation run never happened — I recommend we just fix it (pooled gain/oscillator bank, one-time graph), verified by the 86-check audio harness + a node-allocation counter assertion.
**X2 — Fixed timestep** (C5) should be considered for ARM's loop too, not just CC — same GC-hitch exposure.
**X3 — KBB sprite inlining** (K1) is a Core task, on me, no blockers.

---

## 6. Decisions I need from you

1. **KBB:** in one or two sentences — what does "the way I want" mean? Pace, in-battle decisions, spectacle, or all three? (My sequence stands regardless: sprites → re-tune → agency layer; full rebuild not recommended.)
2. **ARM:** approve the 2D feel pass (A1–A5) as the first move vs opening the true-3D rebuild discussion now.
3. **Exam:** confirm the three-mode split (Study / Exam sim / Blitz) and that Study becomes the default.
4. **Audio:** green-light fixing the node churn now instead of waiting for the `?perf` run.
