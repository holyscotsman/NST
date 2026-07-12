# StarNix — Backlog STATUS @ v0.16.0 (2026-06-27)

> **Read this first.** The dated sections below (v1, June 24, `v0.6.x` marks) are the historical baseline. Much of what they list as "open" shipped in the v0.12–0.16 wave, and the bank has since grown. This header supersedes them with current state.

## Done since the June-24 baseline (shipped; body below not retro-updated)
- **Question bank: ~60 → 199 questions, re-tiered to 18 easy / 155 med / 26 hard.** All keyed, all with explanation + option notes. Structural audit (2026-06-27): **no** empty explanations, **no** missing/out-of-range keys, **no** duplicate stems, **no** exhibit-referencing stem missing an image. → **This resolves the premise of D1** ("12/46/2, hard tier has 2"): the bank is no longer the bottleneck; the KBB ladder + difficulty buckets are feasible on the live bank. (Caveat: a structural scan can't confirm a key is *correct* — see open item A2.)
- **Universal pause overlay** (shell): Pause button + Esc, menu-styled Resume/Menu, stops+restarts music; ARM/CC/KBB all expose `pause()/resume()`. = BACKLOG #2 "next unit" — **done**.
- **CC**: camera-follow ship-descent intro (§3 intro + #11), distant enemy squadron (§3 + #11), wall-bulge obstacle narrowed to one lane, metallic square fly-through gates + glow-pulse, darker floor, distant mountains, much faster + wider gate cadence (solvability invariant preserved), gate-on-obstacle fairness fix. → most of §3-CC and #11.
- **KBB** (other chat, merged): four-zone full-bleed layout, Kuiper parallax bg, HP bars, battle FX, 3D combat sprites + 2D fallback. = #3/#7 layout.
- **ARM**: hyperdrive 3D wormhole + 3-2-1 + panic gauntlet, puzzle roster rework, briefing dialogue tree + authored teach/ELI5, **v0.16 briefing wall-of-text readability fix + tightened framing**, enemy-fire laser SFX.
- **Audio**: epic layered warp (×2), warp wind-down, distinct laser SFX, chill `exam` track for NIT.
- **Tooling**: `npm run check` one-command gate (build → verify → 7 harnesses).

## Actually open — categorized

### A. Blocked on you (decision / input)
- **A1 · D5 — 3D-asset route.** Gates ALL sprite/3D/menu-art. Input ready: `ASSET_NEEDS.md`. Real call: generate sprites at all (vs doc-07 procedural-first); if yes, keep each small + update 07.
- **A2 · Answer-key correctness.** The structural audit can't prove keys are *right*. Open: **a3q7** (CRL vs OCSP — both defensible) + any keys you want re-checked. I can research + propose; I won't alter a key unilaterally (learning integrity).
- **A3 · ARM-goes-endless** vs keep the 3-sector campaign (mutually exclusive).
- **A4 · Dispatch** — do the ARM/KBB reworks move to their own chats, or stay here?
- **A5 · Your eyes/ears** owed: warp ×2 + wind-down + laser + chill-exam (ear); CC gates/floor/wall/mountains/speed/descent (eye); ARM briefing layout (eye).

### B. Other chats' lanes (flagged — not mine to edit)
- **Doc sync**: `02` (ARM briefing + laser), `04` (all CC changes), `08` (audio additions).
- **KBB combat re-tune** (#35 — most runs die in section 1; learning-integrity flag). KBB chat.
- **Per-core authored wording** — a few briefings phrased as questions (old design). ARM chat.

### C. Safe without you (in-lane, verifiable or prep — no key-guessing, no blind visual churn)
- [x] Refresh this backlog status — done (this section).
- [x] Question-bank structural audit — done (clean; above).
- [ ] **Formalize `pause()/resume()` in the doc-01 GameModule contract** — code implements it, ARM flagged the gap; produce updated `01` spec.
- [ ] **Core doc-accuracy pass** (`00/01/05/06/07`): document the real asset keys (from the audit), correct stale version/premise refs.
- [ ] **Research the open key ambiguities** (a3q7 etc.) → evidence doc for your decision (drafts only; bank untouched).

**Default plan:** I'll work down section C unless you redirect. I'm deliberately **not** piling on more blind CC visual changes (they accumulate unverified) or touching answer keys (integrity).

---

# StarNix — Feedback Backlog & Roadmap (v1, 2026-06-24)

Derived from Jason's June 24 feedback plus the still-open items in `STATE.md`.
Priority-ordered. **Nothing here is built yet** — execution waits on the §0 decisions.

**Legend:** 🐞 bug/defect · ⚙ engine/shared-core · 🔒 content-gated · 🎨 needs user-generated art (CC0, per 07) · 👁 browser-only (look/feel can't be machine-verified — playtest) · 🔊 audio (ear-check only) · ❓ needs your decision

---

## June 25 wave — graphics + feel overhaul (ACTIVE) + 3-session parallel dispatch

13 items from Jason's June 25 screenshots, split by game into **3 simultaneous chat sessions** (independent modules → clean parallel merge) plus a **Core lane** (this chat) for the cross-cutting pieces. Sessions hand updated modules back here; Core merges + verifies.

**Correction up front:** there is **no pause menu anywhere** — ARM included. The only "back" affordance is the shell `← Menu` button (`starnix-shell.js`). CC has internal `pause()/resume()` (it freezes the sim during questions) but no overlay. So "the same one ARM has" can't be copied — a pause **overlay must be built** (Core/shell). **Confirmed by Jason:** it reuses the menu styling (**Resume** + **← Menu**), and **entering pause stops the music; exiting restarts it** — so an audio glitch self-heals by opening then closing pause. Each game exposes `pause()/resume()`; Core also calls the audio stop/restart on overlay open/close.

### Art-direction pivot (doc 07, Core-owned)
Move from all-neon-code-art toward a **hybrid**: realistic **raster sprites for hero objects** (player ship, enemy ship, squadron) + **code-generated FX for everything ambient** (atmosphere particles, parallax/looping backgrounds, glows, screen-distortion, wormhole) + neon palette kept as UI/accent. Rationale:
- **Code-gen (no asset, loops forever, ~0 bundle cost):** CC atmosphere/dust, CC motion cues, CC wall-curve geometry, the KBB looping Kuiper-Belt background, the ARM wormhole, all glow/distortion. Recommend this over raster/video for anything that scrolls or loops.
- **Raster sprites/textures (Jason generates; Core optimizes + inlines as base64 in `assets.js`):** Jason wants real assets for most actors — **17 total**, prompts consolidated in `ASSET_PROMPTS.md`. CC: `ccShip` (rear), `ccGround`, `ccBumps`. ARM (top-down): `armHero`, `armEnemy`, `armBoss`. KBB (side-profile): `kbbHero1/2/3` (independent), `kbbEnemy`, `kbbBoss`, `kbbAsteroid1`–5. Code-gen stays for the ambient-only layer (fog, glow, screen-distortion, wormhole, parallax *motion*).
- **Bundle budget:** bundle is ~1.3 MB today. Sprites add to it; GAS serves large HTML but load time grows. Target each optimized sprite <=~200 KB; lean on code-gen for backgrounds to avoid MBs of bloat. (Gated on Jason's answer re: tolerance.)
- **3D per game:** CC is already Three.js. **KBB will *attempt* a 3D combat zone** (Jason's call: "give it a shot, fall back to 2D if it doesn't work") — practical path is sprite-**billboards in a Three.js scene** (depth/perspective/lighting/parallax from the 2D ship assets), fallback to the current 2D canvas. ARM stays 2D top-down + sprites.

### The split

| Session | Owns | Items (this wave) |
|---|---|---|
| **1 — Chasm Chase** | `04`, `cc.js` | wall-**curve** obstacle (replace floating brick; bulge the chasm wall inward to seal one lane, connected + extended); **much faster** + better motion frame-of-reference; **ground darker than walls**; **invuln soft-pulse glow** on core-get + reserve **flash** for damage/shield-loss + **grace gap** between shield losses; **atmosphere** pass; **realistic ship sprite** integration (sprite-gated); + `pause()/resume()` hook |
| **2 — KBB** | `03`, `kbb.js` | **4 strictly non-overlapping zones**; red = battle animation + **looping Kuiper-Belt bg** (code-gen motion + asteroid sprites); **artifact hover tooltips**; rename "Intent" → **"Incoming Attack"** + **pulsating-red pre-attack alert**; **attempt 3D combat zone** (billboards, fallback 2D) with `kbbHero1/2/3`+`kbbEnemy`+`kbbBoss` sprites (gated); + `pause()/resume()` |
| **3 — ARM** | `02`, `arm.js` | **Hyperdrive**: stronger distortion, +1-2 s, **no mid-screen text**, **3D wormhole**; **huge button + ~10 panic enemies** on full core collection; **puzzles**: keep **Simon** (5→8–9 steps, timer starts after playback), **cut Grid**, add **Battery** (polarity-flip) + **vCPU divide** (even allocation), propose keep/cut on rewire/dials/sort, faster timers; ARM ship sprites `armHero/Enemy/Boss` (gated) |
| **Core (here)** | `00/01/05/06/07`, shell, build | **Pause overlay** + optional `pause/resume` contract hook + wiring; **graphics direction** (07) + **asset pipeline** + **sprite prompts**; **merge + verify** all three sessions |

Hyperdrive/cargo = **ARM** (sectors + cores), not CC — pending Jason's confirm.

### Dependencies, sequencing, logistics
- **Mechanics start immediately** in all 3 sessions (no shared dependency). **Sprite hookup is gated** on Jason's generated assets + Core inlining them — each session writes the *code path* to consume `assets.<KEY>` with a documented fallback so it runs before the asset lands; Core adds the key on merge.
- **Pause hook (so sessions aren't blocked on Core):** each game's `mount` exposes `pause()` (stop rAF + freeze sim/timers) and `resume()`. Core owns the contract edit (`01`), the overlay UI, and the wiring; game chats only implement + expose the two methods (CC: surface the existing ones). Flag, don't edit, the contract.
- **Rule for every game chat:** edit **only** your module (`.js`) + your spec (`02/03/04`). Do **not** touch the contract (`01`), shared core, or shell. If you need a contract change, **flag it for Core**. Keep learning integrity (never AI-author/alter answer keys). Headless-verify where possible; layout/feel is browser-only — note what needs Jason's eyes.
- **Stale project files:** the project-knowledge `.js` are ~9 versions behind (no v0.6.20-0.6.29). Each session must start from the **current** module — Core ships `cc.js` / `kbb.js` / `arm.js` for Jason to drop into each chat.
- **Merge:** each session returns updated module + updated spec + a short changelog + verification notes. Core drops each into the tree, rebuilds, runs verify + the 6 harnesses + ingest, resolves any contract additions, stamps the version.

## §0 — Decisions / inputs that gate the work (resolve these first)

- [ ] **D1 ❓🔒 Question-bank expansion is the critical path.** The whole "more / harder / no-repeat / difficulty-bucket" vision is bottlenecked by the bank. Live today: **12 easy / 46 medium / 2 hard** (≈65 with fixtures). KBB's 15-round ladder needs ≈20 per tier (5 rounds × 4 battles); **the hard tier has 2 questions.** Target ≈120 (≈40/tier). To author them I need the **exam-dump text + your key adjudications** (learning integrity — I never ship an unverified key). Unblocks: KBB structure, ARM "more sectors," no-reuse run length, difficulty buckets.
- [ ] **D2 ❓⚙ Per-game selection policy (confirm the pedagogy shift).** Your feedback moves selection off pure mastery-weighted spaced-retrieval into three different policies: **ARM** = no-reuse + difficulty rises by sector; **KBB** = difficulty ladder by round (easy→med→hard) + no-reuse; **CC** = pure-random + no-reuse + no scaling. Mastery is still tracked across all games (Stats screen), but the in-run *order* becomes policy-driven. Confirm this is intended.
- [ ] **D3 ❓ Reuse-on-exhaustion rule.** A finite bank caps no-reuse run length. KBB: reuse once a tier is exhausted — confirmed. **ARM/CC:** when the bank runs dry mid-run, allow reuse or end the sector/run?
- [ ] **D4 ❓🔒 Commander "explain further" = authored, not AI.** Hard rule: no runtime AI; correctness comes from authored data. The deeper per-core breakdown must be **written** (I draft, you verify) — a new per-question field for ~every question. **DRAFTED ✅ v0.6.9** — `deepExplain` authored for all 60 (frame-don't-spoil). Hard rule kept: no runtime AI; content is authored. **Awaiting Jason's accuracy sign-off.**
- [ ] **D5 ❓🎨 3D / sprite direction (per surface).** "More 3D" (ARM actors, ARM cinematic, menu) + new ship/asteroid/enemy art. Per 07, images must be CC0/user-supplied. Routes: **(a) pseudo-3D in canvas** (perspective scaling + parallax + layered sprites — no new engine, ~80% of the feel); **(b) Three.js** (real 3D, big rework; CC already loads it); **(c) image sprites** you generate from prompts I provide. Pick a route per surface. (My recommendation: R3.)
- [ ] **D6 ❓ CC gets a per-question timer** — this reverses the earlier "CC is untimed" design and makes the Extra-time setting relevant for CC again. Confirming so I supersede #13's CC stance (you've effectively already said yes).

---

## §1 — P1: Learning integrity & bugs (highest; mostly engine, not content-gated)

- [x] 🐞⚙ **[CC] Fix question resume-before-ready.** ✅ v0.6.1 — `PHASE_EXPLAIN`; world frozen until Continue. Answering correctly resumes the world behind the overlay before the player clicks Continue. The Continue gate exists (P1c) but the sim isn't held — freeze the sim through the explanation until an explicit Continue tap.
- [x] ⚙👁 **[SHARED] Randomized answer order, every game.** ✅ v0.6.0 — shuffle in `provider.next({shuffle})`. Shuffle option order per presentation, remapping `correctIndex`/`correctIndices` (multi-answer set-grading must still hold). Memorizing answer *position* = false mastery — this is a learning-integrity fix, not just a KBB nicety. Option text stays exactly as in the exam; only order changes.
- [x] ⚙ **[SHARED] No question reuse within a run, every game.** ✅ already wired via `excludeIds` in all 3 games. Exclude already-seen-this-run via the provider's `excludeIds`. (Run length bounded by bank size — see D3.)
- [x] 🐞 **[CC] Invulnerability after answering.** ✅ v0.6.1 — 1.5 s i-frames + ship blink on resume. 1–2 s i-frames with the ship blinking on resume, so you aren't instantly hit by an obstacle that scrolled in.
- [x] 🐞 **[ARM] Invulnerability after collecting a core.** ✅ v0.6.1 — post-collect invuln 1.5 s. 1–2 s i-frames so enemy ships can't kill you during the collect beat.
- [x] ⚙ **[CC][ARM] Per-question timer.** ✅ v0.6.2 — shared `timerSeconds` formula; CC + ARM core questions (ARM puzzle activities still pending with the §3 puzzle work). Length derived from question text length, single vs multi-answer, and difficulty — quick but learnable. CC questions + ARM puzzle activities. Extra-time setting extends it. (Pairs with R5.)

---

## §2 — P2: Run structure & selection (some content-gated)

- [ ] ⚙🔒 **[KBB] 15-round structure.** 15 rounds, each = 3 regular + 1 boss. Difficulty ladder: rounds 1–5 easy, 6–10 medium, 11–15 hard. Randomized within tier; reuse a tier only once exhausted. **Blocked on D1** (hard tier nearly empty).
- [ ] ⚙🔒 **[KBB] Fast enemy-HP scaling.** Enemy health scales hard with rounds so success depends on the right artifacts + correct answers. Re-tune CONFIG; the balance probe checks reachability.
- [ ] 🔒 **[CONTENT] Backend difficulty tags (Easy/Med/Hard).** Already exists as `difficulty` 1/2/3, but the bank is mis-weighted (12/46/2) and likely mis-tagged. Audit + re-tag as part of D1. Never surfaced in the UI.
- [x] 🔒 **[ARM] More sectors, escalating difficulty + more questions.** Add sectors that draw harder questions as you progress. ✅ v0.6.7 — **3-sector campaign on the existing 60-question bank** (Jason reversed the defer: build it now with what we have), no-reuse across the whole run, difficulty ceiling rises by sector, re-briefs each sector, win = clear all 3. **Deeper escalation (a true hard tier / more sectors) still wants the question dump — that part stays deferred.**

---

## §3 — P3: Game flow & feel

**ARM**
- [x] 👁 **Proximity trigger ring** around activity-cores (destroy-asteroid / defeat-guardians): a decent-sized ring triggers the activity instead of flying onto the core. ✅ v0.6.4 — split per playtest: **combat cores only** get a large danger ring (`COMBAT_RING_PAD=320`, radius ≈346 px ≈5× the old reach); extract/collect/puzzle stay **contact** (`EXTRACT_PAD=10`, fly onto them). Verifier proves ring-engage-from-far + extract-is-contact.
- [x] 👁🔊 **Hyperdrive warp rework:** ~2× longer cinematic, enhanced graphics, and a **3-2-1 countdown** when engaging the warp to the next sector (after cargo delivery). Audio in §4. ✅ v0.6.5 — countdown phase (charging ring + number) → accelerating colour-shifting streak tunnel; ~3.35 s vs 1.1 s; reduced-motion aware; seam-verified. **Audio ("epic warp sound") still open in §4 — Audio chat's lane.**
- [~] 👁🔒 **Commander briefing rework:** bigger screen; the commander *teaches* the upcoming core knowledge (no "study this" phrasing); dialogue tree — **"I understand" / "Repeat" / "Explain further"**. Repeat = same line. Explain further = deeper breakdown (authored, D4), after which the only options are **"Yes, sir" / "Please repeat, sir."** Easter egg: ask to repeat 3× on one core → the commander gets frustrated. **STRUCTURE ✅ v0.6.6** (dialogue tree, bigger panel, 3×-repeat easter egg, seam-verified). **REMAINING: generate + verify the per-question `briefing` (teach) + `deepExplain` (ELI5) content for all 60** — I draft anchored to the verified `explanation` (frame-don't-spoil), Jason verifies; adds `deepExplain` to the schema + importer. **CONTENT ✅ v0.6.9** — authored `briefing` (teach) + `deepExplain` (ELI5, via `@eli5`) for all 60, frame-don't-spoil, anchored to the verified `explanation`; rewrote the one briefing that named its answer. **AI-DRAFT pending Jason's accuracy review.** Schema/importer extended (`@eli5→deepExplain`). Tree now reads real content.
- [x] 👁 **Question fade sequencing:** question text fades in fast, then answers fade in one at a time (read time, no text overload). ✅ v0.6.3 — 180 ms staggered reveal; the per-question timer now starts only after the last option lands (closes R5); reduced-motion shows all + starts immediately.
- [x] 👁 **More unique puzzle activities** + a completion **time limit**. ✅ v0.6.10 — added a "core stability" completion timer (formula×1.5, breach = shield hit + fresh attempt, no softlock) to all puzzles; added two new types (lights-out reactor grid, swap-to-sort) rotated per sector with the existing three.

**CC**
- [ ] 👁 **Obstacle redesign (rock-only):** drop squares. Random 3→2-lane narrowing via canyon-wall extensions (center-left or center-right); duck = a full-width **arch**. Every obstacle uses the rock texture but must read clearly as a wall.
- [ ] 👁 **Enemy squadron in the distance** — the chase target you're pursuing.
- [ ] 👁 **Intro: camera follows the ship** into the canyon instead of the canyon scrolling past.

---

## §4 — P4: Audio (`audio.js` — ear-check only, not machine-verifiable)

- [x] 🔊👁 **[ARM] Epic warp sound** — Star Trek/Star Wars feel, much more bass, a layered build under the warp. ✅ v0.6.12 — 3-2-1 now plays a rising pitched charge (with sub thumps) building into the layered hyperdrive whoosh; also added a distinct puzzle-solved chime. Tune timbre/levels by ear in audio.js.
- [ ] 🔊👁 **[ARM] Distinct puzzle-solve SFX** for the activity mini-games.

---

## §5 — P5: Visual / 3D / branding (high cost, asset-dependent, browser-only)

- [x] 🎨👁 **[CORE] Menu: subtle tiled Nutanix wireframe-X background** + more Nutanix branding. ✅ v0.6.11 — code-drawn neon wireframe-X tile (SVG data-URI, low opacity) behind the cards + an NX-SRC crew crest above the heading.
- [ ] 🎨👁❓ **[CORE] Cinematic: more epic / 3D.** Likely a Three.js port (D5).
- [ ] 🎨👁❓⏸ **[ARM] More 3D look** + distinct **asteroid sprites** + better **ship/enemy** art (D5: pseudo-3D + image sprites, confirmed). **DEFERRED by Jason (2026-06-24): circle back after the other games + a core update.** (Ship/enemy/asteroid ImageGen prompts already sent.)
- [x] 👁 **[ARM] Briefing animation:** ✅ v0.6.8 — comms window reskinned as a live ship transmission (scanlines, signal flicker, portrait scan-sweep + jitter, live-signal bars), all gated on reducedMotion.
- [ ] 🎨👁 **[ARM] Commander sprite** (not urgent).
- [ ] 👁 **[KBB][CC] #12 P2 — high-contrast canvas** for the remaining two games; folds in alongside their reworks. *KBB half largely done in the v0.6.13 graphics/UI overhaul (HP bars below ships, drop-shadowed numbers, labeled intent/shield chips, battle-animation FX, stretch bug fixed). CC canvas pass still open. Browser playtest of KBB visuals pending.*

---

## §6 — Previously-tracked / meta (don't lose these)

- [ ] 👁 **#15 touch + small-screen audit** (Part 3 close-out). *(v0.182.0, V1.1 FE#7: the SHELL half is closed — 600px breakpoint, 44px back/pause/skip/claim targets, safe-area insets on gamebar/dock/badge/skip. The per-game audit remains open.)*
- [ ] 🔒❓ **Multi-select content:** author the ~12 deferred multi items + adjudicate the 3 contradictory keys (boot+data / Production container / Q48). Folds into D1.
- [ ] **Part 4 meta:** cross-run meta-progression/unlocks; audio event layer (boss stinger triggers on bosses); shell/menu polish; **Playwright** real-browser coverage (catches WebGL/layout/audio jsdom can't); robustness/perf hardening (mobile FPS/memory, error boundaries).

---

## §7 — Recommended improvements (my call; you didn't ask)

- **R1 ⚙ Build no-reuse + option-shuffle as one shared core service**, not three per-game copies — a single tested `provider.draw({ excludeIds, difficultyBand, shuffle })` that all games call. Less drift, one place to verify, grading stays correct. Everything pedagogy-related sits on this; I'd build it first.
- **R2 Author the deeper-explanation schema once** (D4): keep `explain` (have), add `deepExplain` (+ optional `teach`) to the question schema so ARM's commander, KBB's post-answer, and CC's post-answer all read the same authored content. Avoids per-game divergence; keeps learning integrity central.
- **R3 Pseudo-3D before a Three.js port for ARM.** A full 3D ARM is a large rewrite with browser-only verification. Perspective-scaled sprites + parallax + a banking ship likely gets ~80% of the "3D" feel at a fraction of the cost/risk. I'd push back on a full port as the first move — try pseudo-3D, escalate only if it falls short.
- **R4 The difficulty re-tag is itself a learning-integrity task.** A 12/46/2 split means most items are "medium" by default; a real easy/med/hard pass (with your sign-off) improves both the KBB ladder and the Stats weak-domain signal.
- **R5 Timer and fade-in must be designed together.** Start the answer timer only *after* the options finish fading in, or short timers feel unfair on long/multi questions.
- **R6 Bank size is the ceiling on the whole vision.** KBB alone wants ~60 questions/run with no reuse. D1 is the single highest-leverage item on this list — most of §2 and parts of §3 unblock the moment the bank grows.
- **R7 Add a per-game "seen this run" debug readout** behind the test seam, so no-reuse + bucket progression can be machine-verified — the rest of this work is browser-only, so cheap headless hooks are worth it.

---

## §8 — June 24 playtest feedback (triage)

Captured from Jason's v0.6.15 play session. Ownership is by **MD-spec lane** (the per-game chats own 02/03/04/08); this Core/Integration chat can implement code and flag spec edits to those chats. Status as of **v0.6.16**.

| # | Item | Lane | Type | Status / note |
|---|------|------|------|----------------|
| 1 | Music degrades over time ("slow then weird") | audio `08` / core code | **bug** | **DONE v0.6.16** — scheduler catch-up clamp; regression-tested. |
| 2 | No pause in CC or KBB (only ARM + start menu) | **shell `01` — this chat** | gap | **Next, mine.** Pause/settings is a shell affordance; ARM has it, CC/KBB don't. Cleanest fix = a *universal* shell pause overlay any game can raise (stops its RAF, mutes/holds audio), so each game opts in instead of re-implementing. Needs: confirm ARM's pause is shell- or self-provided first. |
| 3 | KBB looks bad (see screenshot) | KBB `03` + art `07` | visual | Tied to #7 (layout) — biggest KBB block. Tiny ships in a thin band, huge dead space. |
| 4 | KBB has no real intro / how-to — needs a slow, **animated**, skippable tutorial before first battle | KBB `03` | feel | New build. The current `#24` how-to is a static card; this wants a guided, animated teach. |
| 5 | First shop = **Common artifacts only**; everything after first battle is random | KBB `03` | rule | **Decision resolved** (was a §0 open item). Clear directive — implement. |
| 6 | Audit **all KBB artifacts** for sense | KBB `03` + `07` | content | I can produce an audit table (effect vs description vs exam-relevance) for Jason to ratify. |
| 7 | KBB **battle screen full-bleed**; Q&A + stats **overlaid** on top, never covering the ships | KBB `03` | layout | The structural fix behind #3. Likely a layered layout (canvas full-bleed, translucent question panel anchored low). |
| 8 | KBB attack animations **slower + bigger** | KBB `03` | feel | Pacing/clarity. |
| 9 | KBB question reveal uses the **ARM fade** | KBB `03` (shared pattern) | feel | Reuse ARM's answer-fade sequencing. |
| 10 | ARM commander "Knowledge" should be **info to learn**, not questions back at the player | ARM `02` | content | Reframe the briefing copy as teaching (source it from the authored Q&A). Full question list still pending from Jason. |
| 11 | CC must read as **flying into a chasm chasing the squadron**, not a camera staring at a canyon | CC `04` + core code | visual | = the not-yet-built §3 CC items: **camera-follow intro** + a **distant enemy squadron** as the chase target, + real depth. Jason floats generating a chasm image (skybox/heightmap) or building it in 3D. |
| 12 | Audit what's achievable with **WebGL**; want more 3D across games + cutscenes | cross-cutting | direction | Exploratory. CC already uses Three.js r128; question is whether to bring 3D into the shell cutscenes / 2D games or keep them 2D. |

**Decisions still needed from Jason**
- **D1 (exam dump)** still the long pole — blocks KBB 15-round ladder + the difficulty re-tag (bank is mis-weighted 12 easy / 46 med / 2 hard).
- **#11/#12 CC look:** procedural 3D chasm vs a generated heightmap/skybox image (the latter needs Jason's image-gen). Pick a direction before the CC visual unit.
- **#7 KBB layout + #8 pacing:** confirm the full-bleed layout intent (canvas behind a low translucent overlay) and that slower animations are acceptable even though they lengthen each turn.
- **KBB combat tuning** (still open from §0) — the layout/animation rework is the moment to also fix the punishing constants.

**What this chat will pick up directly** (no per-game-spec rewrite needed): **#2 universal pause** (shell `01`) is the clear next unit. KBB items (#3–#9) are a large coherent block better done together and belong to `03`; ARM #10 to `02`; CC #11 to `04` — implementable here as code, but those MD specs are owned elsewhere, so flag on delivery.

## Suggested sequencing (my recommendation — you set the order)

1. **Decisions §0** (especially D1, D2, D5) + kick off the **content track** (D1 — it's the long pole).
2. **R1 shared draw service** → then the §1 engine items ride on it (no-reuse, shuffle, timers) + the two §1 bugs (CC resume, i-frames). High value, low/again-verifiable, not content-gated.
3. **§2 structure** as content lands (KBB 15-round + HP scaling; ARM sectors).
4. **§3 flow/feel** (warp, briefing dialogue, CC obstacles/squadron/camera) — engagement; mostly browser-only, so delivered for playtest.
5. **§4 audio**, then **§5 visual/3D** (asset-dependent; needs your image-gen) and the remaining **#12 P2** + **#15** + **Part 4**.
