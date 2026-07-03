# NIGHT_LOG — autonomous session, started 2026-07-03

Morning report per `NIGHT_RUN.md` v2. One entry per unit (version, unit, what shipped,
assertion delta, negative-control result, punts). Blockers logged here, not asked.

Baseline at start: v0.51.0, commit 068168c, `npm run check` ALL GREEN (verify-build 345,
fairness 20/20, kbb-run 20/20, kbb-draw green). Node v26.4.0 via Homebrew.

---

## v0.52.0 — Unit 1: ARM engine harness (`arm-headless.cjs` + `arm-run.cjs`)

**Shipped:** the KBB-pattern harness pair for ARM, wired into `npm run check`.
- `arm-headless.cjs` — mock ctx mirroring `kbb-headless.cjs` + ARM deltas: `rng.shuffle`/`range`
  (copy semantics matching `starnix-core.makeRng`), `questions.pool()`, `ctx.test = true`
  (arm.js TESTMODE: no RAF; frames via `root.__armTest.step(dt)`).
- `arm-run.cjs` — **46 assertions** (target was ≥15): registration shape; INTRO→BRIEF walked via
  real briefing option clicks→WARP→SECTOR (5 distinct-qid cores, 'arm' bed); grading right/wrong
  (mastery args, telemetry, +25/cargo vs lost); forceTimeout → wrong grade + live Continue + clean
  resolve (no hang); depot round-trip (HOME→DEPOT_Q→+40/station+1→DEPOT_SUM→SHOP→SECTORCLEAR→
  sector-2 BRIEF); death-by-timeout via 8× puzzle stability breaches → GAMEOVER → "Ship destroyed"
  panel → Relaunch; pause/resume freezing gnow() across wall time; zero-residue unmount;
  reduced-motion (intro auto-end, immediate countdown) vs stagger-delayed countdown; seeded
  determinism (`coresForSector`).

**Assertion delta:** +46 (new suite). Gate: ALL GREEN end-to-end, exit 0.

**Negative control:** flipped ARM `gradeAnswer` single-answer equality → exactly the 12
grading-dependent new assertions failed + 1 PRE-EXISTING verify-build pin ("a timed-out core is
graded incorrect") — same behavior, correctly co-tripped. Restored, re-ran, ALL GREEN.

**⚠ Discrepancy logged (not a blocker; unit shipped on actual behavior):** NIGHT_RUN unit 1 said
"use `_test.forceTimeout` to pin death-by-timeout landing on the GAME OVER panel". Code reality:
question timeouts NEVER damage — `showQuestion`'s two consumers (core scan `arm.js:1092`, depot
`arm.js:1240`) cost the core only. The claimed trace `timeUp → wrong → damage → gameOver`
(QA-A5, spec 02 v1.3 §"Death by timeout", v0.50.0 changelog) does not exist. Real timeout→
GAME OVER paths: puzzle stability breach (`puzzleExpire` → `damage(14)`, now pinned) and the
boss 5 s warp deadline (eyes-on). Pinned both truths; annotated QA-A5 with a revised eyes-on
protocol. **Jason's design call:** should question timeout damage (as the docs claim)? One-line
change if yes + spec/QA re-sync. Did NOT change gameplay — learning-integrity/spec rules say ask,
NIGHT_RUN says log and move on.

**Punted:** nothing else. Commit: `v0.52.0 — ARM engine harness`.

---

## v0.53.0 — Unit 2: Commander rank (cross-game XP meta-progression)

**Shipped:** one XP pool + 10 ranks + menu display + one-shot rank-up moment, fed ONLY by
existing seams (per the unit's "read the seams" rule):
- **Answers** — `makeMasteryStore.record` (the ONE choke point all three games AND the exam
  already route through): correct +10 / wrong +2 / Leitner promotion +15 / first cross into
  `MASTERED_BUCKET` +40.
- **Exam completions** — shell `_recordExam`: +25 any completed mode, +75 pass bonus (≥80,
  the exam's own mark), 0 on abandon.
- **Run scores** — `persistence.submitScore`: this 01-contract seam has been called by ARM
  (guarded) since the boss shipped, but NO provider implemented it — a silent no-op. Completed
  it in `initCore`, bound to the live profile (bests.<GAME> high-water + flat +150). ARM's
  campaign-win call now works with zero game-module edits.
- Ranks pinned (0/150/400/800/1400/2200/3300/4800/6800/9500, Recruit→Fleet admiral); pure
  math on `StarNix.xp`; `profile.xp`+`rankSeen` in defaultProfile + migrate repair.
- Shell: `.sx-rank` strip in the menu head (gold name, iris→gold bar, to-next line; textContent
  per house rule), rebuilt each `showMenu`; rank-up = gold `.sx-toast-gold` toast + 3-pulse
  brightness on the strip; reduced-motion (flag + CSS guard) = same surface, static;
  `rankSeen` makes it one-shot. `_toast` gained an optional class param (additive).

**Assertion delta:** verify-build 345 → **360** (+15, section K4). Full gate ALL GREEN, exit 0.

**Negative control:** gutted the `addXP` mutation → exactly the 4 live-wiring pins failed
(mastery award, submitScore ×2, _recordExam award; 356/360), pure-math and DOM pins
correctly unaffected. Restored, re-ran, ALL GREEN 360/360.

**Punted (logged, not blocking):**
- CC/KBB per-run score XP: both write `profile.bests.CC/KBB` directly inside their modules
  (load→mutate→save) — no core seam passes their scores; tapping them means editing game
  files. Their gameplay already feeds the pool per-answer. Phase-2 candidate if wanted.
- 01 doc-sync for `profile.xp`/`rankSeen`/`StarNix.xp`/completed `submitScore` — spec
  versioning (01_SHARED_CORE_v1_5.md) is its own unit; noted in STATE Open.
- Rank-up detection is menu-entry (not mid-game): games own their screens while mounted;
  the shell moment fires on the next menu visit. Deliberate, pinned as designed.

Commit: `v0.53.0 — Commander rank XP meta-progression`.
