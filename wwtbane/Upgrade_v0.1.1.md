# Upgrade v0.1.1 — the 50-item department program

The work program for WWTBANE v0.1.1: **ten items for each of the five departments**, every one grounded in the code as it stands today (file/line citations were verified against the tree when this plan was authored). Each item is a self-contained unit of work that Claude Code can execute from its plan alone.

## How to read and run this plan

- **Item anatomy** — every item states *why* (the current gap, cited), *how* (concrete file-level steps), *files*, *proof* (the test/verification gate), and *the project rules that bind it*.
- **Gates are non-negotiable** (`CLAUDE.md §6/§9`): headless green with **negative controls** on every new test pin; honest reporting; visual work additionally queues in `BROWSER_QA.md` and stays "code-complete, visual-pending" until a human signs off. No timeline estimates anywhere.
- **Suggested order** — within each department: bug-fixes first, then changes/overhauls, then new implementations and enhancements. Across departments, the shared clusters below should land together.
- **Statuses** — track per-item progress by checking items off here and recording the unit in `CHANGELOG.md`/`STATE.md` as usual. An item that needs the owner (copy sign-off, hosting OK) parks in `FLAGS.md`, never silently.

## Cross-department coordination (shared deliverables)

Three clusters are one implementation seen from multiple departments — build each ONCE, coordinated:

1. **Lifeline copy truth** — `PX-01` (in-game Help rewrite + keyboard section) owns the player-facing fix; `PQ-09` owns the README rewrite and the mechanical docs-drift gate that keeps retired claims from returning; `CL-01` is the copy authority (canonical wording checked against `docs/LIFELINES.md`). One wording, three surfaces.
2. **Steve integrity** — `GS-10` owns the core `peekUpcomingHard` guard (never re-teach, never sell a question without a clue); `CL-02` owns the shell/UI side (never render an empty clue, never charge for one); `CL-03` drafts the missing NPX `steveClue`s (flagged for human review); `CL-04` makes a paid clue survive a reload.
3. **Loss-reveal enrichment** — `PX-05` (show the question, the player’s answer, and the reference in the loss reveal) and `CL-05` (reference + topic tags in the reveal) are one reveal upgrade; `PX-06` (post-run recap) builds on the same data plumbing. *(Since this plan was researched, per-option notes from the interchange bank also render in the reveal path — extend, don’t duplicate.)*

---

## Game Systems (GS)

The pure rules engine: run shape, permadeath, banking, lifeline mechanics, seeded determinism, double-buffer set generation, Leitner mastery + priority weighting, the event contract, the coin economy. Everything in `src/core/` — headless, deterministic, provable.

### ✅ GS-01 · Latch RunController.answer() against double grading

**Type:** bug-fix

**Why.** RunController.answer() (src/core/runController.js:123) only guards on `!this.alive || this.won`; after a correct non-final grade it waits for advance(), so a second answer() call on the same question re-grades it — inflating clearedCount (which drives runningTotal/bankedAfter/payout in src/core/coins.js) and double-recording mastery. The shell's `_advancing` guard in src/shell/main.js covers only continueAfter, and the prior hardening pass (CHANGELOG 'critical code review') hardened answer() against bad input, not double grading. Note: Game.answer() (src/shell/main.js:679-687) dereferences `result.correct` and calls quiz.showFeedback(result) unguarded, so the new null return path MUST be handled in the shell too or it throws.

**Implementation plan.**

1. src/core/runController.js: add `this.awaitingAdvance = false` to the constructor state block.
2. src/core/runController.js answer(): return null while `awaitingAdvance` is true; set it true after a correct non-final grade (the `hasNext` path).
3. src/core/runController.js advance() and devJumpTo(): clear the latch alongside the existing per-question resets (assisted / usedThisQuestion / lifelineOutput).
4. src/core/runController.js snapshot(): expose `awaitingAdvance` so the DOM overlay can disable the submit affordance without any event-contract change.
5. src/shell/main.js answer(): bail out early when rc.answer() returns null (skip showFeedback/stats/announce) — today `result.correct` would throw a TypeError on any null result.
6. tests/runController.test.mjs: new test — answer Q1 correctly twice before advance(); assert the second call returns null, clearedCount stays 1, and the mastery box promoted exactly once. NEGATIVE CONTROL: after advance() grading works normally again, and a wrong answer still ends the run.
7. Update CHANGELOG.md and STATE.md per the definition of done.

**Files.** `src/core/runController.js`, `src/shell/main.js`, `tests/runController.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: `npm test` — new double-submit test with negative controls (post-advance grading works; permadeath unaffected); existing runController/e2e suites stay green. No visual component, no BROWSER_QA entry needed.

**Bound by.** The authored key remains the sole grader (§4); latch is pure core state plus a defensive shell guard — no event-contract change; never fabricate a green; small per-unit commit, no co-author tag.

### ✅ GS-02 · Refuse lifeline use once the run has ended

**Type:** bug-fix

**Why.** canUseLifeline()/useLifeline() (src/core/runController.js:91-119) never check `this.alive`/`this.won`, and the lifelines object is the persisted save state (src/shell/main.js:454-457 passes this.save.lifelines and persists after every use in useLifeline), so a stray call after permadeath or a win silently burns a charge the player paid coins for in the Green Room. The shell's useLifeline already tolerates a null return (`if (!out) return;`), so this is a core-only guard.

**Implementation plan.**

1. src/core/runController.js canUseLifeline(): return false when `!this.alive || this.won` (useLifeline already delegates to it at line 100, so both paths are covered by one guard).
2. tests/runController.test.mjs: new test — die on Q1 with a full charge; assert canUseLifeline('fifty') is false, useLifeline('fifty') returns null, and charges are unchanged. NEGATIVE CONTROL: the identical call before death succeeds and decrements the charge.
3. tests/runController.test.mjs: same assertion after a win (drive a full 30-correct run like the existing win test, then attempt a lifeline).
4. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/runController.js`, `tests/runController.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: `npm test` — new dead-run/won-run lifeline tests with the pre-death success as the negative control; the existing 'lifeline cannot be used twice on the same question' test (tests/runController.test.mjs:73-80) stays green.

**Bound by.** Lifelines advise, never grade (§3/§4); persisted charge economy must not be altered otherwise; headless green with negative controls is the ship gate.

### ✅ GS-03 · Unify the mastery staleness clock across SetManager and RunController

**Type:** bug-fix

**Why.** selectionWeight() (src/core/mastery.js:104-117) computes staleness as `currentRun - rec.lastRun`, but lastRun is written from RunController.runIndex (= save.stats.runs, src/shell/main.js:460) while SetManager._build (src/core/selection.js:174-186) passes `currentRun: setIndex` — a private counter that resets to 0 whenever the campaign is rebuilt (every win sets `campaign = null` in endRun; save import does too), and drifts from stats.runs even mid-campaign (setIndex advances twice at init and seeded runs bump stats.runs without touching it). After a prestige the `Math.max(0, ...)` clamp zeroes staleness for every seen question, so the 'less-recently-seen' half of the weighting silently dies. The comment at mastery.js:107-108 even admits the counters differ.

**Implementation plan.**

1. src/core/selection.js: add a `getRunIndex` option to SetManager (default preserves current behavior: `() => this.setIndex`) and pass its value as `currentRun` in _build().
2. src/shell/main.js _ensureCampaign(): pass `getRunIndex: () => this.save.stats.runs` so the same clock feeds both record() (via RunController runIndex) and selectionWeight(). Leave the seeded SetManager in startRun untouched — fillTier only calls selectionWeight in mastery mode, so seeded builds never read the clock.
3. src/core/mastery.js: update the 'different counters' comment at selectionWeight — the campaign clock is now shared; keep the defensive clamp for imported/legacy saves.
4. tests/selection.test.mjs: with two recorded items (lastRun 0 vs lastRun 9) and getRunIndex()=10, assert buildSet weighting favors the stale item statistically over N injected-rng builds. NEGATIVE CONTROL: with a reset-style clock (getRunIndex()=0, mimicking the old post-prestige state), the stale/recent preference collapses — assert the two distributions differ.
5. tests/mastery.test.mjs: pin selectionWeight monotonicity — weight(lastRun=4, currentRun=10) > weight(lastRun=9, currentRun=10), and the staleness contribution caps at 6.
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/selection.js`, `src/core/mastery.js`, `src/shell/main.js`, `tests/selection.test.mjs`, `tests/mastery.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: `npm test` — new staleness tests with the collapsed-clock negative control; existing mastery/selection suites (priority boost, injected-rng reproducibility, seeded determinism) stay green — seeded builds never call selectionWeight, so seeds are unaffected by construction.

**Bound by.** Mastery is shared learning state and persists across wins (§3) — record() semantics untouched; no re-tuning of the weight formula beyond fixing the clock; no refactor of working systems without cause beyond this defect (§7).

### GS-04 · Keep Ask the Audience helpful on multi-answer questions

**Type:** bug-fix

**Why.** askAudience (src/core/lifelines.js:57-89) splits correctShare near-evenly across all correct options (distributeAcross with floor 0.5), so on a hard 2-correct multi each correct bar averages ~0.43/2 ≈ 0.215 while the trap distractor averages 0.31 — the trap is the modal winner most of the time, violating §3's 'the correct answer draws the most weight on average (so it helps)' AND the file's own invariant comment ('correct is the modal winner', lifelines.js:27-28). The statistical tests (tests/lifelines.test.mjs audienceStats, lines 70-99) only exercise a single-answer fixture, so this is uncovered.

**Implementation plan.**

1. src/core/lifelines.js askAudience(): when correctList.length > 1, pick an rng-chosen lead correct option and give it the dominant share of correctShare. The skew must be tuned so the LEAD bar's mean strictly beats trapMean at every tier WITHOUT touching AUDIENCE_PARAMS — on extreme (correctMean 0.39 vs trapMean 0.35) that forces the lead to take ≳90% of correctShare; the original draft's example weights (2.2 vs 0.4) provably fail there.
2. Guard the new branch on correctList.length > 1 only, keeping the single-answer rng call sequence byte-identical so seeded reproducibility and the existing single-answer statistics are unchanged.
3. docs/LIFELINES.md: document the multi-answer poll shape under the existing owner-revision section (the contract change lands with the code).
4. tests/lifelines.test.mjs: add audienceStatsMulti(diff) over the existing 2-correct-of-4 fixture (tests/fixtures.mjs multiQuestion — already present, no fixture change needed; askAudience takes difficulty as a parameter): assert a correct option is the modal winner >55% on hard and the lead correct bar's mean is the tallest at every tier including extreme. NEGATIVE CONTROLS: the trap still wins sometimes on hard (rate < 0.95, preserving fallibility) and easy correct-modal rate > hard rate (clarity still falls with difficulty).
5. Run the new multi test against the OLD code first to show it red (honest failure), then green after the fix; re-run the untouched single-answer statistical tests to prove no drift there.
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/lifelines.js`, `tests/lifelines.test.mjs`, `docs/LIFELINES.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless statistical tests (≥1500 seeded trials per tier) with negative controls, proven red-then-green. No visual change — the DOM poll and the studio vote cards (ballotFromBars) render whatever bars core emits.

**Bound by.** Lifelines advise, never grade (§3/§4); the owner revision that a trap can occasionally win — more often on hard — must survive (docs/LIFELINES.md); deterministic under injected rng; AUDIENCE_PARAMS tier means are owner-tuned, do not change them.

### GS-05 · Make pickFinal honor the cross-set exclusion so finals do not repeat back-to-back

**Type:** bug-fix

**Why.** pickFinal (src/core/selection.js:135-150) filters candidates only against ctx.chosen and ignores the `soft` cross-set exclusion that fillTier honors (line 111), so the double-buffer can deal the same Q30 in consecutive runs even when other extreme questions exist. Verified: the SetManager disjointness test (tests/selection.test.mjs:112-125) asserts zero overlap including index 29 but only for its one seed 'DB' — with 6 non-impossible extremes in that fixture the final collides on other seeds.

**Implementation plan.**

1. src/core/selection.js pickFinal(): for each candidate pool in the existing order (impossible pool, non-impossible extremes, all extremes, buckets.hard, bank) try the fresh subset `!ctx.soft.has(q.id)` first, then relax to the full subset — mirroring mainTierPools' fresh-before-reused ordering.
2. Keep the impossible-first-final branch's gating identical (persistence flag, not seed); pick() still consumes exactly one rng call per non-empty pool, so same-seed reproducibility holds by construction.
3. tests/selection.test.mjs: sweep ~50 seeds building SetManager current/next against a bank with ≥3 non-impossible extremes; assert current[29].id !== next[29].id on every seed (this test must be shown red on the old code first). NEGATIVE CONTROL: with a bank holding exactly 1 usable extreme, the final legally repeats and buildSet still returns 30 without throwing (the relax path works).
4. Confirm the existing 'disjoint current/next' test now holds by construction rather than by seed luck, and that the seeded-determinism and flag-gating tests (lines 22-57) stay green.
5. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/selection.js`, `tests/selection.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: seed-sweep test proven red on the old code, green after; negative control for the tiny-bank relax path; full existing selection suite green (same-seed determinism unchanged — the fix is a deterministic function of the same inputs).

**Bound by.** Seeded determinism must hold — same seed still reproduces the same current/next pair (§3); impossible-final flag gating untouched; prefer-disjoint-but-relax philosophy of the existing soft mechanism preserved.

### GS-06 · Move the impossible-first-final swap from the shell into core selection

**Type:** change

**Why.** The mastery-mode impossible-final swap lives inline in src/shell/main.js startRun (lines 441-448), hand-slicing the set with Math.random — a run-shape rule (§3 'impossible first final') living untested in the shell while its seeded twin is headless-tested in selection.js (tests/selection.test.mjs:42-57). Core rules belong in src/core/ where they get headless coverage with negative controls; this is a with-cause move (untested spec logic), not a cosmetic refactor.

**Implementation plan.**

1. src/core/selection.js: export a pure `applyImpossibleFinal(set, bank, rng = Math.random)` — returns a NEW array with index 29 replaced by an rng-picked `impossible` question; no-op (returns the input) when the bank has no impossible questions or the set is shorter than 30; never mutates its arguments.
2. src/shell/main.js startRun(): replace the inline filter/slice block (lines 441-448) with `if (!this.save.flags.reachedFinalBefore) set = applyImpossibleFinal(set, this.bank)` — mastery branch only, exactly as today; the seeded branch stays on buildSet's flag-gated seeded path.
3. tests/selection.test.mjs: unit tests — the helper installs an impossible Q30 and leaves indices 0-28 untouched; the input set is not mutated. NEGATIVE CONTROLS: no-op with an empty impossible pool, and a deterministic injected rng picks a predictable impossible question (proving the rng seam).
4. tests/e2e.mjs: re-run to confirm the first-final flow (impossible final → loss reveals the real answer → reachedFinalBefore flag set) is unchanged end-to-end.
5. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/selection.js`, `src/shell/main.js`, `tests/selection.test.mjs`, `tests/e2e.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless unit tests with negative controls plus the existing e2e run — behavior is provably identical, only ownership moves. No visual delta — no BROWSER_QA entry.

**Bound by.** Impossible first final stays gated on the reachedFinalBefore persistence flag, never the seed (§3); the loss-reveals-the-real-answer flow downstream is untouched; this is a with-cause refactor (untested shell logic implementing a §3 rule), satisfying §7's no-refactor-without-cause bar.

### GS-07 · Add pure daily-seed derivation (seed-of-the-day)

**Type:** new-implementation

**Why.** BACKLOG.md lists the daily seed with the note that the ?seed= link plumbing already shipped; normalizeSeed/generateSeedString exist in src/core/rng.js and the ?seed= boot path is src/shell/main.js:175-176. The only missing piece is a pure deterministic derivation so everyone on the same UTC date gets the same shareable run — a rules-level feature the seed system already supports (seeded runs are priority-blind, deterministic, and still feed mastery per §3).

**Implementation plan.**

1. src/core/rng.js: export `dailySeed(date = new Date())` — format the UTC date as YYYYMMDD, then derive `generateSeedString(makeRng('daily#' + ymd))` so the result is a normal-looking NTNX-XXXXXX code that round-trips normalizeSeed unchanged.
2. src/shell/main.js startRun() seeded branch (NOT boot()): after `seed = normalizeSeed(seedInput)`, resolve the literal value 'DAILY' via dailySeed() before building the SetManager. This one hook covers BOTH entry points — boot() funnels ?seed=daily through startRun, and the title-screen seed input calls startRun directly (the original plan's boot()-only alias would have missed typed seeds). The pause menu then shows and shares the resolved NTNX code.
3. tests/rng.test.mjs: pin two fixed dates to their exact derived seed strings (determinism regression pin); assert same date → same seed. NEGATIVE CONTROLS: adjacent dates produce different seeds, and normalizeSeed(dailySeed(d)) === dailySeed(d).
4. BACKLOG.md: mark the derivation shipped; note the title-screen 'Daily challenge' button as remaining UI-department work.
5. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/rng.js`, `src/shell/main.js`, `tests/rng.test.mjs`, `BACKLOG.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless rng tests with negative controls; manual smoke: open ?seed=daily twice on the same day and confirm identical Q1 (the pause-menu seed shows the same resolved NTNX code both times). No visual unit — no BROWSER_QA entry.

**Bound by.** Pure static hosting — client UTC only, no server clock (document the midnight-boundary caveat in a code comment); seeded runs stay priority-blind, deterministic from authored pools, and still feed mastery (§3); no player timers; no new runtime dependencies (§7).

### GS-08 · Overhaul the RunController read model: defensive snapshot + per-run summary log

**Type:** overhaul

**Why.** snapshot() (src/core/runController.js:68-83) hands the UI a live reference to the persisted lifelines save object and omits mode/seed, while endRun in src/shell/main.js (lines 710-716) re-derives run stats by poking rc internals (this.rc.clearedCount) — and there is no per-question log, so a results/green-room 'you fell on a hard networking question' readout has no core support. Verified the HUD (src/shell/ui/hud.js update(), lines 112-155) reads only snapshot.lifelines[type].charges/.slots plus index/banked/running/nextBoundary/usedThisQuestion, so a defensive copy with the same field names is a drop-in.

**Implementation plan.**

1. src/core/runController.js: accumulate `this.log = []` — push one entry per grade `{ id, domain, tier, number, correct, assisted, lifelinesUsed: [...] }` (small scalars only, once per answer — not a hot loop, no pooling concern, no question-object retention).
2. src/core/runController.js: add `summary()` — pure derivation returning { reached, clearedCount, won, perTier: {easy,medium,hard,extreme:{asked,correct}}, missedQuestion: {id, domain, tier} | null, lifelinesSpent, assistedCorrectCount }.
3. src/core/runController.js snapshot(): return a defensive per-type copy of lifelines ({ fifty: {...l.fifty} } etc.) and add `mode` and `seed`; keep existing field names stable so hud.js needs no changes.
4. src/shell/main.js endRun(): read this.rc.summary() instead of raw fields and append it (with payout and a runIndex stamp) to a capped save.stats.history (keep the latest 20; entries are id/tier/domain scalars so the persisted save stays compact).
5. src/shell/persistence.js: defaultSave().stats gains history: []; migrate() already merges stats over base defaults so old saves normalize for free — add an explicit array-type guard like the steveTaught one; SAVE_VERSION unchanged per the existing additive-migrate pattern.
6. tests/runController.test.mjs: summary correctness for a win, a mid-tier death (missedQuestion populated with the right domain/tier), and lifeline counting. NEGATIVE CONTROL: mutating the snapshot's lifelines copy does NOT change the controller's real charges (proves the old aliasing is gone).
7. tests/persistence.test.mjs: an old save without history loads with history: [] and nothing else disturbed; prestige() keeps history (stats persist through a win).
8. Update CHANGELOG.md and STATE.md; note the results/green-room rendering of history as a UI-department follow-up.

**Files.** `src/core/runController.js`, `src/shell/main.js`, `src/shell/persistence.js`, `tests/runController.test.mjs`, `tests/persistence.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: new summary/snapshot tests with the mutation negative control; persistence migration test; existing e2e green (HUD contract unchanged — verified hud.js field usage before shipping). No visual work — history UI is explicitly out of scope here.

**Bound by.** Lifelines/mastery remain the shell-persisted mutable sources (documented contract in the constructor comment) — only the read model is copied; no event-contract change; mastery is never wiped (§3); prestige still resets only coins + slots; UI rendering belongs to another department.

### GS-09 · Ship an executable event-contract registry with a headless contract test

**Type:** enhancement

**Why.** CLAUDE.md §5 makes docs/WWTBANE_CINEMATIC_SPEC.md §10 the quiz↔backdrop bridge, but nothing executable pins it. Verified drift: the shell emits ui:lockin, host:welcome, green:manager and steve:call (src/shell/main.js lines 57, 359, 394, 497) that the §10 table (spec lines 90-102) never documents, and run:dead carries only { payout, wasFinal, wasImpossible } (runController.js:152). Contract drift breaks studio/music reactions silently because consumers no-op unknown events by design (spec line 104).

**Implementation plan.**

1. src/core/eventContract.js (new): export CORE_EVENTS — a map of the ten RunController emissions (run:start, question:show, final:impossible, lifeline:use, answer:lock, answer:correct, answer:wrong, coins:bank, run:win, run:dead) to their required payload keys — and SHELL_EVENTS for scene:studio, scene:green, ui:lockin, host:welcome, green:manager, steve:call.
2. src/core/runController.js: add clearedCount to the run:dead payload (additive and forward-compatible under §10's unknown-events rule; gives results/backdrop consumers the run depth without poking rc internals).
3. docs/WWTBANE_CINEMATIC_SPEC.md §10: add the missing shell-event rows and the new run:dead field — the explicit renegotiation-in-the-spec that CLAUDE.md §5 requires, in the same commit as the code.
4. tests/eventContract.test.mjs (new): drive full headless runs (lifelines on several tiers, a death run, a win run, a devJumpTo) capturing every emit via the injected emit fn; assert every emitted type exists in CORE_EVENTS and carries every required payload key.
5. Same test file, NEGATIVE CONTROLS: a deliberately malformed synthetic emission (missing a required key) fails the checker, and an event name absent from the registry is flagged — proving the checker can actually fail.
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/eventContract.js (new)`, `src/core/runController.js`, `docs/WWTBANE_CINEMATIC_SPEC.md`, `tests/eventContract.test.mjs (new)`, `CHANGELOG.md`, `STATE.md`

**Proof.** New headless contract test with two negative controls; existing smoke/e2e green (consumers ignore the additive run:dead field per the spec's unknown-events rule). No visual delta — no BROWSER_QA entry.

**Bound by.** The event contract is renegotiated in spec §10 in the same change (§5); additive-only payload changes so unknown-event/unknown-field consumers keep working; the registry describes events, it never carries question text (quiz stays DOM, §5).

### ✅ GS-10 · Stop Steve repeating taught clues or selling clue-less questions

**Type:** bug-fix

**Why.** CLAUDE.md §3 pins 'he never gives the same clue twice', but SetManager.peekUpcomingHard (src/core/selection.js:205-213) falls back to `fresh[0] || hards[0]`: `hards[0]` re-teaches an already-taught question (a repeated clue), and `fresh[0]` can be a hard question with NO steveClue — the shell then charges SHOP.steve (4,000 coins, main.js _callSteve) and the green room renders the literal string 'undefined' as his tip. This is live today: all 25 owner NPX priority questions ship without steveClue, 9 of them are hard, and PRIORITY_WEIGHT_BOOST (×10) floods a fresh player's 9 hard slots with exactly those questions. The GreenRoom UI already has the correct null state ('○ Unavailable' / 'Steve has nothing new for you right now', src/shell/ui/screens.js:117-129), so returning null implements the written spec without inventing any design. [Replaces the death-scrap economy item — see reviewNotes.]

**Implementation plan.**

1. src/core/selection.js peekUpcomingHard(): only ever return a question that HAS a steveClue AND is not in alreadyTaught; delete the `fresh[0] || hards[0]` fallback and return null when no such question exists in the upcoming set.
2. src/shell/main.js: verify (no change expected) that showGreenRoom's null path renders the unavailable state and that _callSteve's `!this.steveVisit.question` guard blocks the purchase — this pairing is what makes null the spec-correct behavior.
3. tests/selection.test.mjs: new tests — (a) with every clue-carrying hard in the upcoming set already in alreadyTaught, peekUpcomingHard returns null (never a repeat); (b) with the upcoming set's hard slots holding only clue-less hards (extend the fixture bank with hard questions lacking steveClue), it returns null rather than a clue-less question. NEGATIVE CONTROL: with one untaught clue-carrying hard present it returns exactly that question — the existing 'Steve reads the upcoming run' test (tests/selection.test.mjs:112-125) stays green.
4. FLAGS.md: new entry — the 25 NPX priority questions have no steveClue; Steve clues are teaching dialogue (human-authored per §7), so he will read as unavailable more often until the owner authors them. Do NOT draft clues autonomously.
5. Update CHANGELOG.md and STATE.md.

**Files.** `src/core/selection.js`, `tests/selection.test.mjs`, `FLAGS.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: `npm test` — new peekUpcomingHard tests with the untaught-clue negative control, shown red on the old code first (the repeat/clue-less fallback currently returns non-null); existing SetManager/Steve tests green. Green-room manual smoke: fully-taught state shows the existing 'nothing new' copy and the Call button never charges for an empty clue.

**Bound by.** 'He never gives the same clue twice' (§3) is the rule being enforced; steveClue content is human-authored teaching dialogue — authoring clues for the NPX set is forbidden autonomous work (§7), only flag the gap; one-call-per-visit, pricing, and the double-buffer guarantee (clue references a real upcoming question) untouched.

---

## Content & Learning (CL)

The question bank, ingestion/QA tooling, learning-model integration, exhibits/images, and authored-copy pipeline. **Frozen surface: no question stem, option, or answer key changes.** Dialogue drafts and metadata enrichment ship flagged for human review.

### ✅ CL-01 · Fix the Help screen's outdated lifeline copy

**Type:** bug-fix

**Why.** src/shell/ui/screens.js line 195 tells players Ask the Audience 'never points you wrong, only sometimes weakly' and Phone a Friend 'gives a hedged tip toward the right answer' — verified verbatim in the file; both describe the pre-revision design and contradict the shipped fallible lifelines (PHONE_ACCURACY = 0.68 in src/core/lifelines.js line 23, the audience trap distractor in AUDIENCE_PARAMS lines 29-34, both documented as owner revisions in docs/LIFELINES.md). The same line also overstates 50:50 ('removes two wrong answers' — fiftyFifty removes UP TO two, and only one on a two-key multi-answer). Players are being coached to over-trust lifelines that can now be wrong.

**Implementation plan.**

1. src/shell/ui/screens.js: rewrite the rule('Three lifelines,', ...) entry in HelpScreen (line 195) to match docs/LIFELINES.md — 50:50 removes up to two wrong answers, never the right one; the audience usually helps but a wrong answer can occasionally win the poll, more often on hard questions; the friend blurts a guess that is right about two times in three; close with 'lifelines advise, they never decide — the authored key does'. Keep the existing assisted-answers-don't-promote-mastery sentence.
2. FLAGS.md: append the rewritten help copy to the §2 pending-human-review list (game-mechanics copy, AI-drafted).
3. tests/e2e.mjs: from the title screen click 'How to play' (TitleScreen onHelp, screens.js line 41), assert the new fallibility wording is present in the help DOM, then close back to the title.
4. tests/e2e.mjs negative control: assert the stale phrases 'never points you wrong' and 'toward the right answer' no longer appear anywhere in the help DOM.

**Files.** `src/shell/ui/screens.js`, `FLAGS.md`, `tests/e2e.mjs`

**Proof.** npm test stays green; npm run e2e includes the new help-screen assertion plus the negative control proving the stale copy is gone. Text-only DOM change — no BROWSER_QA entry needed.

**Bound by.** CLAUDE.md §7: game copy is AI-drafted only as flagged-for-review work — FLAGS.md entry mandatory, not done until a human reads it. Copy must state facts that match lifelines.js exactly (no new mechanics implied). Sentence case per brand rules.

### ✅ CL-02 · Stop Steve selling an empty clue for clue-less hard questions

**Type:** bug-fix

**Why.** SetManager.peekUpcomingHard (src/core/selection.js lines 205-213) falls back to hard questions WITHOUT an authored steveClue when none with a clue are in the upcoming set — and all 9 hard questions in the owner's 25-question NPX priority set lack steveClue (verified by executing the bank) while PRIORITY_WEIGHT_BOOST = 10 (src/core/mastery.js line 100) floods early mastery sets with them. main.js line 328 then sets clue to q.steveClue = undefined, the green-room panel (screens.js line 122) interpolates it into a template literal and renders the literal text 'undefined', and playSteveCutscene's splitIntoParts('', 3) returns three empty strings (textSplit.js returns Array(n).fill('') for empty input) so the cutscene shows blank bubbles — the player pays coins for nothing.

**Implementation plan.**

1. src/core/selection.js: change peekUpcomingHard so the clue-less fallback (lines 210-212) is removed — return the first fresh clue-having hard question, else null (the green room already has a proper 'Unavailable' state when steve.question is null, screens.js lines 117/129).
2. src/shell/main.js line 328: harden to clue: (q && q.steveClue) || '' so a missing clue can never reach the UI as undefined.
3. src/shell/ui/steveCutscene.js: defensive guard in playSteveCutscene — if the clue is empty, skip the three clue bubbles rather than showing blanks (belt-and-braces; should be unreachable after the selection fix).
4. tests/selection.test.mjs: new test — a SetManager whose current set's hard questions all lack steveClue returns null from peekUpcomingHard.
5. tests/selection.test.mjs negative control: a set containing one clue-having hard question returns exactly that question, and alreadyTaught still excludes it on the next call.

**Files.** `src/core/selection.js`, `src/shell/main.js`, `src/shell/ui/steveCutscene.js`, `tests/selection.test.mjs`

**Proof.** Headless: node --test tests/selection.test.mjs with the negative control above. The e2e lose-flow already visits the green room (tests/e2e.mjs lines 74-92) — assert the Steve panel never contains the string 'undefined'.

**Bound by.** No new authored copy invented at runtime (§7); grading and mastery untouched; headless tests with negative controls are the ship gate. Pairs with (but does not depend on) the NPX steveClue drafting item.

### CL-03 · Draft steveClue, tags, and missing references for the 25 NPX priority questions (flagged for review)

**Type:** new-implementation

**Why.** Verified by executing src/content/questions.js: all 25 NPX questions lack steveClue and tags, and 24 lack a reference; 9 of them are authored hard, and the priority boost floods early sets with them, so Steve can never teach the owner's own priority material (see the companion bug-fix). Stems, options, and keys stay byte-for-byte frozen — only optional metadata fields are added (the parser already ingests **Steve:**/**Tags:**/**Reference:** per docs/QUESTION_AUTHORING.md lines 46-49 and parseMarkdownBank.js lines 111-112), drafted strictly from each question's owner-authored explanation.

**Implementation plan.**

1. docs/priority-question-bank.md: add a '**Steve:**' line to each of the 9 hard NPX blocks — a concept-teaching clue derived only from the owner's explanation, never quoting a full option verbatim.
2. docs/priority-question-bank.md: add '**Tags:**' (3-5 kebab-case topics) to all 25 blocks and '**Reference:**' to the 24 missing one, following the style of the existing bank's references.
3. Re-run: node scripts/import-questions.mjs docs/priority-question-bank.md --merge and diff src/content/questions.js to confirm ONLY the new metadata fields changed (stems/options/answer arrays byte-identical).
4. FLAGS.md §1: record that steveClue/tags/reference on the NPX set are AI-drafted pending owner review, while the keys remain owner-authored.
5. tests/importer.test.mjs: add an assertion over the shipped bank that every priority hard question carries a non-empty steveClue.
6. Negative control: a fixture priority-hard question without a Steve line makes that assertion fail (prove the test detects the gap).

**Files.** `docs/priority-question-bank.md`, `src/content/questions.js`, `FLAGS.md`, `tests/importer.test.mjs`

**Proof.** Importer report shows 25 merged with 0 rejected; a scripted diff proves stems/options/answers unchanged; node --test green including the new coverage assertion and its negative control.

**Bound by.** HARD: question stems/options/keys frozen — metadata only, gated by the diff step. CLAUDE.md §7: teaching-dialogue drafts follow the §4 offline-QA precedent — FLAGS.md flagging mandatory and the item is NOT done until the owner signs the clues off. Clues teach the concept, never verbatim answers. Explanations are not reworded.

### ✅ CL-04 · Make Steve's paid clue survive a reload — persist and pin the pending taught question

**Type:** bug-fix

**Why.** CLAUDE.md §3 pins the double-buffer precisely so 'Steve's clue references a real, guaranteed-upcoming question' — but the campaign SetManager is memory-only (src/shell/main.js line 38; _ensureCampaign at lines 410-419 builds fresh random sets on every boot) while save.steveTaught persists (src/shell/persistence.js line 28). Pay Steve, close the tab, and next session's rebuilt set almost certainly omits the taught question — yet steveTaught permanently excludes it from being taught again (main.js lines 398-399, peekUpcomingHard's alreadyTaught filter). The player's coins are burned and the §3 guarantee is silently broken by a simple refresh.

**Implementation plan.**

1. src/shell/persistence.js: add stevePending: null to defaultSave() and normalize it in migrate() (keep a string question id, else null) — mirror how steveTaught is normalized at line 108.
2. src/shell/main.js _callSteve (lines 393-399): alongside the steveTaught push, set this.save.stevePending = this.steveVisit.question.id and persist.
3. src/core/selection.js: add SetManager.pinIntoCurrent(q) — no-op if q is already anywhere in _current; otherwise replace one hard-tier slot (play-order indexes 20-28, per the 10/10/9/1 build order) with q.
4. src/shell/main.js _ensureCampaign (lines 410-419): after init(), if save.stevePending resolves to a bank question, call campaign.pinIntoCurrent(q).
5. src/shell/main.js startRun (mastery path): when the run's set contains save.stevePending, clear it and persist — the promised question has now been delivered into a run.
6. tests/selection.test.mjs: pinIntoCurrent places the question in a hard slot exactly once and the set stays 30 distinct; negative control: pinning a question already in the set leaves the set byte-identical.
7. tests/persistence.test.mjs: migrate() fills a missing stevePending with null; negative control: a non-string stevePending in a stored save normalizes to null instead of crashing the load.

**Files.** `src/shell/persistence.js`, `src/shell/main.js`, `src/core/selection.js`, `tests/selection.test.mjs`, `tests/persistence.test.mjs`

**Proof.** node --test tests/selection.test.mjs tests/persistence.test.mjs green with both negative controls. Manual spot-check via the dev menu: add coins, pay Steve, reload the page, and confirm (console) the pending id is present in campaign.current().

**Bound by.** Mastery mode only — seeded runs stay deterministic and priority/mastery-blind, never pinned. No grading or mastery changes; the pin is selection-only. Save-shape change goes through the existing migrate() normalization (SAVE_VERSION gate untouched). No new authored content.

### CL-05 · Show the doc reference and topic tags in the loss reveal

**Type:** enhancement

**Why.** The loss reveal is the game's most important learning moment, but _greenReveal (src/shell/main.js lines 743-749) carries only correctText + explanation — the authored reference (158 of 182 questions have one, verified) and tags are dropped, even though the correct-answer path already shows the reference (overlay.js line 417, .fb-ref). A player who just died gets less study signal than one who answered right. Note: losses never pass through ResultScreen — main.js only builds it with won: true (line 725) and routes losses straight to showGreenRoom (line 751), so the GreenRoom reveal block is the one live surface.

**Implementation plan.**

1. src/shell/main.js lines 743-749: extend _greenReveal with reference: result && result.q ? result.q.reference : null, tags likewise, and domain.
2. src/shell/ui/screens.js: in the GreenRoom reveal block (lines 62-66), render a 'Reference: …' line and small topic chips when present — verbatim text, presentation only. (ResultScreen's loss-reveal branch at lines 171-175 is dead code — mirror the change there for consistency or leave it; do NOT build new loss plumbing into ResultScreen.)
3. styles/main.css: add .reveal-ref and .reveal-tags styles matching the existing .fb-ref treatment; chips are text labels readable in high-contrast mode.
4. tests/e2e.mjs lose-on-purpose scenario (lines 74-92): assert .reveal-ref renders when the missed question has a reference.
5. Negative control: force a loss on a question without reference/tags (dev-tools jump or e2e hook) and assert no .reveal-ref/.reveal-tags nodes render.

**Files.** `src/shell/main.js`, `src/shell/ui/screens.js`, `styles/main.css`, `tests/e2e.mjs`

**Proof.** npm run e2e green with the presence assertion and the no-reference negative control; text-only DOM addition, no motion — no BROWSER_QA entry required.

**Bound by.** Presentation only — reference/explanation text rendered verbatim, never reworded (§4 + owner content freeze). The reveal stays DOM for screen readers. Colorblind-safe: chips carry text, never colour alone.

### CL-06 · Render authored inline-code spans (backticks) as real code at display time

**Type:** enhancement

**Why.** Six shipped questions — verified by scanning the bank: NPX-H-001, NPX-E-001, NPX-H-002, NPX-H-003, NPX-M-005, NPX-H-008 — carry markdown backticks in options and explanations (e.g. acli host.exit_maintenance_mode host-ip), and overlay.js/screens.js render them as literal backtick characters, so CLI commands read badly on the card, the feedback, and the loss reveal. Formatting at render time improves presentation without touching the frozen stored text.

**Implementation plan.**

1. src/shell/ui/inlineCode.js (new): pure codeSpans(text) -> Node[] that splits on balanced backtick pairs into text nodes and <code> elements; unbalanced backticks stay literal; built with createElement/createTextNode only (no innerHTML).
2. src/shell/ui/overlay.js: use codeSpans for the option text (line 97), the stem (line 120), and the explanation paragraph .fb-exp (line 416).
3. src/shell/ui/screens.js: use codeSpans for reveal-answer and reveal-exp in the GreenRoom reveal (lines 64-65) and the matching ResultScreen block (lines 173-174).
4. styles/main.css: style code inside .option/.stem/.fb-exp/.reveal (monospace, subtle tint, legible in high-contrast mode).
5. tests/inlinecode.test.mjs (new): balanced pairs produce <code> nodes whose joined textContent equals the input minus backticks.
6. Negative controls: input without backticks yields a single text node; an unbalanced backtick is preserved literally; input containing '<b>x</b>' renders as text, not markup (injection-proof).

**Files.** `src/shell/ui/inlineCode.js (new)`, `src/shell/ui/overlay.js`, `src/shell/ui/screens.js`, `styles/main.css`, `tests/inlinecode.test.mjs (new)`

**Proof.** node --test tests/inlinecode.test.mjs with all three negative controls; an e2e pass over a run containing an NPX backtick question (dev-tools jump) asserts a code element appears in an option and no literal backtick remains.

**Bound by.** Question text/keys frozen — stored strings unchanged, formatting is render-only. No innerHTML (XSS-safe). Screen readers read code spans as normal inline text. One-shot DOM build — nothing added to any RAF loop.

### CL-07 · Extend no-repeat rotation to all host-line pickers and deepen the shallow pools

**Type:** enhancement

**Why.** pickWelcome avoids back-to-back repeats via its last key (src/shell/hostLines.js lines 66-73, persisted as save.lastWelcome at main.js line 498), but pickQuestionLine, pickBankLine, and pickTierLine (lines 76-93) draw uniformly with no memory — verified. With only 6 QUESTION_LINES over a 30-question run, 4 BANK_LINES, and 2 lines per tier in TIER_LINES, identical consecutive quips are common and the host feels canned.

**Implementation plan.**

1. src/shell/hostLines.js: give pickQuestionLine/pickBankLine/pickTierLine the pickWelcome contract — accept { last, rng }, return { text, key }, never repeating the last key when the pool has more than one line.
2. src/shell/main.js: hold per-pool last-keys for the session and pass/refresh them at the three call sites (line 153 pickTierLine, line 165 pickBankLine, line 517 pickQuestionLine).
3. src/shell/hostLines.js: draft roughly 6 new QUESTION_LINES, 4 new BANK_LINES, and 2 extra lines per TIER_LINES tier — generic show banter that never contains question, answer, or exam content.
4. FLAGS.md §2: append the new lines to the pending-human-review dialogue list.
5. tests/hostlines.test.mjs: extend the existing rotation test to all three pickers — 200 seeded draws with no back-to-back repeat.
6. Negative control: a single-line pool is permitted to repeat and the picker terminates (no infinite reroll).

**Files.** `src/shell/hostLines.js`, `src/shell/main.js`, `FLAGS.md`, `tests/hostlines.test.mjs`

**Proof.** node --test tests/hostlines.test.mjs green including the single-line-pool negative control; e2e unchanged (bubbles are aria-transparent flavour).

**Bound by.** CLAUDE.md §7: host dialogue drafts follow the FLAGS.md §2 precedent — entry mandatory, NOT done until a human reads them. Lines never reference exam content. Pickers stay pure/rng-injected so they remain headless-testable. FINAL_LINE stays fixed.

### CL-08 · Overhaul the Phone-a-Friend dialogue into a rotating multi-script module

**Type:** overhaul

**Why.** The entire phone cutscene script is one hardcoded 5-line array inside QuizScreen._phoneCutscene (src/shell/ui/overlay.js lines 298-304, verified), so every call in every run is word-for-word identical — the flattest dialogue system in the game. docs/LIFELINES.md pins this dialogue as generic UI flavour (the authored phoneHint field is intentionally unused by the mechanic), so adding rotating variants is squarely in-bounds.

**Implementation plan.**

1. src/shell/phoneScripts.js (new): export PHONE_SCRIPTS — the existing script plus 3 drafted variants, each exactly 5 lines with the final line templated on {L} — and a pure pickPhoneScript({ last, rng }) with no-back-to-back-repeat, returning { lines, key }.
2. src/shell/ui/overlay.js: _phoneCutscene consumes a picked script passed via the applyLifeline payload; keep PHONE_STEP_MS pacing (~10s total, line 22), the panic avatar beats, markPick on the last line, and the reduced-motion collapse to the final line only (lines 313-318).
3. src/shell/main.js: pick the script at lifeline-fire time, hold the session's last script key, and pass lines into the overlay payload.
4. FLAGS.md §2: flag the drafted variant scripts for human review.
5. tests/phonescripts.test.mjs (new): every script has 5 lines; the final line of every script contains {L}; rotation over 100 seeded draws never repeats back-to-back.
6. Negative controls: a malformed script missing the {L} placeholder is rejected by a validate helper; a one-script pool repeats without looping forever.

**Files.** `src/shell/phoneScripts.js (new)`, `src/shell/ui/overlay.js`, `src/shell/main.js`, `FLAGS.md`, `tests/phonescripts.test.mjs (new)`

**Proof.** node --test tests/phonescripts.test.mjs with both negative controls; e2e fires Phone a Friend and asserts a 5-bubble sequence ends naming the picked letter; BROWSER_QA.md entry to confirm pacing still reads well.

**Bound by.** docs/LIFELINES.md owner revision binds this: dialogue stays generic flavour, never exam content, and phoneHint stays unused by the mechanic. The cutscene remains the game's ONE sanctioned timed sequence (~10s) and never limits the player's decision. Reduced-motion variant required. Drafts flagged for human review, not done until read.

### CL-09 · Build a content audit + human-review packet generator

**Type:** new-implementation

**Why.** FLAGS.md §1 leaves 157 AI-drafted questions pending human review and BACKLOG.md line 14 explicitly wants a review workflow surfacing reviewStatus — yet today the only visibility is ad-hoc node one-liners. Real gaps found (and re-verified) this way prove the tooling debt: 121 questions missing steveClue, 24 missing reference, 25 missing tags, a 396-tag uncontrolled vocabulary, and 2 quarantined items invisible outside src/content/quarantine.js.

**Implementation plan.**

1. scripts/audit-content.mjs (new): read src/content/questions.js + quarantine.js and print reviewStatus counts, per-tier/per-domain matrix, metadata coverage (steveClue on hard/extreme, phoneHint, reference, tags, images), a singleton/near-duplicate tag report, an exhibit-lint (stems matching /exhibit|screenshot|shown below|diagram|pictured/i with no q.image), and the quarantine list with reasons.
2. Add a --packet <path> mode that writes a checklist-style Markdown review packet (each question's stem/options/marked key/explanation quoted verbatim, grouped by reviewStatus then domain, one checkbox per question) for the owner's FLAGS §1 sign-off pass.
3. Factor the analysis into a pure exported function (bank in, findings out) so it is unit-testable; the CLI stays a thin wrapper.
4. package.json: add "audit:content": "node scripts/audit-content.mjs".
5. tests/audit.test.mjs (new) using tests/fixtures.mjs: a fully-covered fixture bank yields zero warnings (negative control), and a fixture with one hard question missing steveClue yields exactly that one warning.
6. docs/QUESTION_AUTHORING.md: document the audit command in the pipeline section.

**Files.** `scripts/audit-content.mjs (new)`, `package.json`, `tests/audit.test.mjs (new)`, `tests/fixtures.mjs`, `docs/QUESTION_AUTHORING.md`

**Proof.** node --test tests/audit.test.mjs green with the zero-warning negative control; run npm run audit:content against the real bank and confirm it reports the known 121/24/25 gaps without modifying any file.

**Bound by.** Offline tooling only — no AI in the loop, never judges key correctness (§4); the packet quotes content verbatim (no rewording); no runtime dependency added (node built-ins only); packet output is an input for the human, not a shipped game asset.

### CL-10 · Make the importer verify image files exist and lint exhibit references

**Type:** change

**Why.** scripts/import-questions.mjs validates structure but never checks that q.image.src exists on disk (verified — it only counts summary.images at line 50), while overlay.js line 35 silently removes broken figures at runtime — so a typo'd filename would ship an invisibly missing exhibit with zero warning. The parser resolves bare filenames to src/content/images/ (parseMarkdownBank.js lines 12, 157) and the schema already enforces local-only src + mandatory alt, but nothing proves the file is real. The bank currently ships zero images, so this lands the guard before the first one does.

**Implementation plan.**

1. scripts/import-questions.mjs: after parseMarkdownBank, check existsSync(resolve(q.image.src)) for every parsed image; a missing file joins the rejected list and blocks the write (consistent with the existing refuse-unless---force behavior at lines 58-61).
2. scripts/import-questions.mjs: add a non-blocking WARNING section listing questions whose stem matches /exhibit|screenshot|shown below|diagram|pictured/i but carry no image — the ingestion-drop tripwire.
3. docs/QUESTION_AUTHORING.md: document both checks in the Images section so authors know a bad filename fails the import.
4. tests/importer.test.mjs: fixture bank referencing a nonexistent image file — importer exits non-zero and the output file is not written.
5. tests/importer.test.mjs negative control: the same fixture with the image file actually present at the matching src-relative path under the test's working directory imports cleanly and writes the bank.
6. tests/importer.test.mjs: exhibit-lint fixture (stem says 'shown in the exhibit', no image) produces the warning but still writes.

**Files.** `scripts/import-questions.mjs`, `docs/QUESTION_AUTHORING.md`, `tests/importer.test.mjs`

**Proof.** node --test tests/importer.test.mjs green including the missing-file failure case and the file-present negative control; re-run the real --merge command and confirm the existing 182-question bank still imports byte-identical (the merge-idempotency test already pins this).

**Bound by.** Importer keeps never judging correctness — the author's [x] stays authoritative (§4). Preserve the atomic temp+rename write (lines 116-120) and the never-write-an-empty-bank guarantee (lines 54-57). Headless tests with negative controls are the ship gate; no new dependencies.

---

## Graphics/Cinematics Studio (GX)

The WebGL soundstage, camera direction, characters/crowd, lighting, post FX, and the CSS fallback. Original art drawn in code; one RAF; no per-frame allocation; reduced-motion variants; visual work queues in `BROWSER_QA.md` for human sign-off.

### GX-01 · Add an in-engine win celebration: pooled GL confetti burst

**Type:** new-implementation

**Why.** Winning 30-in-a-row is the game's rarest moment, yet Studio.react('run:win') (src/shell/studio.js lines 223-227) only sets a gold mood, bumps beam spin to 3, and an 8s happy face - the only confetti is the DOM/CSS HUD star burst (hud.burst(), wired at src/shell/main.js line 167). The 3D stage barely reacts while the finalCorrect celebration orbit (src/shell/takes.js lines 150-159) loops. Verified: no particle burst of any kind exists in studio.js beyond the dust motes.

**Implementation plan.**

1. src/shell/studio.js _buildStudio(): pre-allocate one THREE.InstancedMesh of ~400 small PlaneGeometry quads, per-instance colours cycling PAL iris/aqua/mantis/peach/gold via setColorAt, visible=false; build per-instance velocity/spin Float32Arrays once at build time using index-hashing (deterministic, like the crowd palettes - no Math.random).
2. src/shell/studio.js react('run:win'): when this.reduced is true do nothing extra; otherwise reset instance transforms above the stage disc (~[0,7,0], just above the y=6 truss ring) through the existing this._dummy scratch Object3D and set this._confetti = { t: 0 }.
3. src/shell/studio.js _tick: while _confetti is active, integrate gravity + flutter by composing matrices through this._dummy and writing instanceMatrix in place; hide and clear after ~8s to match the existing happy-mood t:8 and the finalCorrect loopTail. Zero allocation in the loop.
4. src/shell/studio.js dispose(): no code change needed - the isInstancedMesh branch (line 275) frees the pool; prove it by having the smoke probe call dispose() at the end and assert no console errors (Studio.dispose is never invoked in any runtime path today, so the probe is the only real exercise of it).
5. src/shell/main.js _installTestHook(): add studio: () => this.studio to window.__wwt (the hook is already gated on localStorage 'wwtbane.e2e'==='1' and never present in normal play).
6. tests/smoke.mjs (runs with real GL, unlike e2e which sets wwtbane.nogl): extend the init script to set 'wwtbane.e2e'='1' and settings.dev in the seeded save; use the shipped Settings 'Start run at question N' -> 30, answer via window.__wwt.answer(), assert the confetti mesh becomes visible on run:win. NEGATIVE CONTROLS: hidden after an ordinary answer:correct, and hidden in a second context booted with settings.motion='reduced'.
7. BROWSER_QA.md: queue 'Win celebration - confetti flutters over the stage during the finalCorrect orbit; nothing bursts under reduced motion'; mark the unit code-complete, visual-pending.

**Files.** `src/shell/studio.js`, `src/shell/main.js`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** GL smoke probe asserting confetti visibility after run:win with two negative controls (hidden after answer:correct; hidden under reduced motion) plus a dispose()-then-no-console-errors teardown check; full headless/smoke/e2e matrix stays green; BROWSER_QA.md entry for human visual sign-off.

**Bound by.** Pooled/pre-allocated - no allocation in the update loop; one RAF; dispose on teardown; reduced-motion skips the burst entirely; flashing < 3 Hz (confetti drifts, never strobes); palette colours only, original art in code; presentation-only (no gameplay effect); not done until human sign-off per CLAUDE.md paragraph 9.

### GX-02 · Fix the dead mood-intensity channel and give the loss a real lights-down beat

**Type:** bug-fix

**Why.** _setMood(color, intensity) stores this.mood.intensity (src/shell/studio.js lines 285-292) but nothing anywhere reads it (verified by grep: written in the constructor and _setMood only) - the final's 1.15 gold lift, the win's 1.3, and run:dead's 0.5 dim are silent no-ops. run:dead also passes the colour literal 0x223 (= 0x000223, near-black - a mistyped 0x222233), so the 'dim' today is only the accidental side effect of lerping the key colour to almost-black. And Director.cue (src/shell/director.js) has no 'run:dead' case, so after the 6s 'incorrect' scene the camera re-bases onto the upbeat 'thinking' loop over a dead run while the player reads the feedback.

**Implementation plan.**

1. src/shell/studio.js _setMood(): keep the colour-target easing; store the intensity as this._moodIntensityTarget (and remove or repoint the write-only this.mood.intensity so the dead channel cannot silently return).
2. src/shell/studio.js _buildStudio(): add key: 65 to _baseLights (the key SpotLight is built with intensity 65 at line 592); in _tick, ease _keyLight.intensity toward B.key * _moodIntensityTarget alongside the existing colour lerp, snapping under reduced motion (same pattern as _lightEnvCur).
3. src/shell/studio.js react('run:dead'): fix the colour literal to the intended dark slate 0x222233 and set _lightEnv to ~0.45 so the fills come down with the key.
4. src/shell/takes.js: add a 'runDead' hold scene (slow overhead settle onto the dimmed stage, ~4s + hold); src/shell/director.js cue(): add case 'run:dead' -> play('runDead') so the camera never bounces back to 'thinking' after a death; docs/CINEMATIC_TAKES.md: add the runDead scene table and trigger-map row (run:dead already exists in the docs/WWTBANE_CINEMATIC_SPEC.md event contract, line 101 - no contract change).
5. tests/director.test.mjs (shared with the director-coverage item, or standalone if that lands later): cue('run:dead') lands on 'runDead'; NEGATIVE CONTROL: cue('answer:correct') never lands there.
6. tests/smoke.mjs GL probe (via the e2e-gated __wwt.studio accessor): drive a deliberate wrong answer via __wwt.answer(); assert the key-light intensity target after run:dead is measurably below its question:show value; NEGATIVE CONTROL: intensity target unchanged after a correct answer.
7. BROWSER_QA.md: queue 'Loss beat - the house goes down when you die: key dims, fills drop, camera settles overhead and holds until the green room'.

**Files.** `src/shell/studio.js`, `src/shell/director.js`, `src/shell/takes.js`, `docs/CINEMATIC_TAKES.md`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** Headless director test for the new cue with negative control; GL smoke probe comparing key-light intensity across states with negative control; BROWSER_QA.md entry for the visual read of the lights-down beat.

**Bound by.** Reduced motion snaps instead of easing (cuts not moves); event contract WWTBANE_CINEMATIC_SPEC.md paragraph 10 unchanged (run:dead already exists); no per-frame allocation (scalar ease on stored refs); visual sign-off required before done.

### GX-03 · Settle stale studio state when reduced-motion or effects toggle at runtime

**Type:** bug-fix

**Why.** main.js _applySettings (line 779) flips studio.reduced / studio.postFx by direct field assignment, but studio.js _tick gates the whole motes/life path on !this.reduced (lines 320-336, 379-390) - so switching Motion to reduced leaves the dust motes visible and frozen mid-air (exactly the 'static gold field' the build comment at studio.js lines 854-856 guards against), can freeze an eye mid-blink (scale.y ~0.1), leave a talking mouth open, and strand the key-light colour half-lerped. Verified: the motes' visible flag is only ever updated inside the !reduced branch. This is an accessibility-facing defect - the reduced-motion look must be a clean locked-off set.

**Implementation plan.**

1. src/shell/studio.js: add setReduced(flag) and setPostFx(flag) methods; src/shell/main.js _applySettings calls them instead of assigning the fields directly (line 779).
2. setReduced(true): hide _motes; snap _keyLight.color to _moodTarget and _lightEnvCur to _lightEnv (applying the light intensities once); walk _studioPeople + _greenPeople resetting eye scales to 1, mouths to resting shape via setMouth, arm rotations to their stored armL/armR bases, torso scale to 1, and g.rotation.z to 0; clear _mood and zero _talk; cancel any active pulse.
3. setReduced(false): restore _motes.visible per the current postFx flag; the tick resumes everything else. setPostFx(false): hide _motes (the composer bypass at studio.js lines 411-420 already handles the render path); setPostFx(true) restores motes when not reduced.
4. tests/smoke.mjs (real GL, via the e2e-gated __wwt.studio accessor): the Motion setting lives on the Settings screen (reachable from the title, not the pause menu), so drive it there - boot with full motion on the title (the intro scene uses the studio set, so motes are live), open Settings, set Motion to 'reduced', assert motes are hidden and every registered person's eye scale is 1; set back to 'full' and assert motes return. NEGATIVE CONTROL: with motion left on 'full' and effects on, motes remain visible.
5. BROWSER_QA.md: queue 'Toggle Motion to reduced - no frozen motes, no stuck-shut eyes or open mouths; toggling back restores the living set'.

**Files.** `src/shell/studio.js`, `src/shell/main.js`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** GL smoke probe with negative control (full motion keeps motes visible); the existing reduced-motion e2e path stays green; BROWSER_QA.md entry.

**Bound by.** Reduced-motion = cuts not moves is a CLAUDE.md paragraph 6 hard rule; all reset work happens once in the toggle call, never per frame (no new work or allocation in _tick); no behavior change for players who never touch the toggle.

### GX-04 · Implement the 50:50 console dark-out the fifty take already frames

**Type:** enhancement

**Why.** The 'fifty' scene in src/shell/takes.js (lines 186-192) is documented as 'the overhead console beat: two screens go dark from above', but Studio.react's 'lifeline:use' case only handles the audience type (studio.js lines 202-206) - the console monitors never change, so the 3s overhead pan shows nothing happening. Verified: the react switch has no fifty branch, and each console monitor already gets its own material instance from the screenMat() factory (studio.js lines 624-633), so per-monitor dimming is possible without touching the shared screenTexture used by the pedestal cameras.

**Implementation plan.**

1. src/shell/studio.js _buildStudio(): keep refs to the two console monitor materials as this._consoleScreens (their emissiveIntensity is 1.4 from the mat() call in screenMat); the shared screenTexture is untouched so the three pedestal-camera monitors are unaffected.
2. src/shell/studio.js react('lifeline:use'): on data.type === 'fifty', set this._fiftyDim = { t: 0 }; in _tick ease both monitors' emissiveIntensity from 1.4 down to ~0.05 over ~0.8s (single bounded ease, no flicker loop); snap immediately under reduced motion.
3. Restore path: react('question:show') and both answer:correct / answer:wrong branches ease (or snap, reduced) the monitors back to 1.4 so the next beat starts relit.
4. tests/smoke.mjs already clicks .lifeline.ll-fifty under real GL (line 69) - add a probe via the e2e-gated __wwt.studio accessor asserting _consoleScreens emissiveIntensity target drops after the click; NEGATIVE CONTROL: firing Ask the Audience instead leaves the console screens at full intensity.
5. BROWSER_QA.md: queue '50:50 - the overhead beat shows two console screens going dark as the distractors are removed, then relighting for the next question; reduced motion snaps'.

**Files.** `src/shell/studio.js`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** Smoke GL probe with negative control (audience lifeline leaves screens lit); the existing '50:50 removes exactly two options' smoke check unaffected; BROWSER_QA.md entry.

**Bound by.** Presentation only - lifelines advise, never grade (the authored key decides correctness; this touches no quiz logic); flashing < 3 Hz (one bounded ease, no strobe); no per-frame allocation (scalar state + stored material refs); reduced motion snaps; visual sign-off required.

### GX-05 · Choreograph crowd reactions for reveals and silence during the final-answer hold

**Type:** enhancement

**Why.** The 168-person instanced audience (4 tiers x 42, verified in _buildStudio) only moves via rare random idle moments (_crowdTick, studio.js lines 517-580) and the vote cards - correct answers, the win, and the lock-in suspense get zero crowd response. Worse, _crowdTick has no phase gating at all, so the random 'someone gets up and leaves' moment can fire during the finalAnswer suspense hold (this._phase === 'lockin'), which reads as a tonal bug on the show's tensest beat.

**Implementation plan.**

1. src/shell/studio.js: add a _cheer = { t, dur } state set from react('answer:correct') (~1.2s) and react('run:win') (~4s), guarded by !this.reduced (under reduced motion the crowd simply stays still - _flash is also a no-op there by design, so nothing substitutes).
2. _tick: while _cheer is active, write a phase-staggered bounce directly into each audience mesh's instanceMatrix.array at [i*16 + 13] (the column-major Y-translation element) for the body/head/hair meshes: base seat Y + sin(t*freq + i*0.7) * 0.05 * seat scale, then set instanceMatrix.needsUpdate - in-place float writes into existing buffers, zero allocation. On end, restore every seat via the existing _seatMatrix/_seatSet helpers (one pass, not per frame).
3. Suppress _crowdTick random moments while this._phase === 'lockin' or a _cheer is active, and push c.nextAt past the reveal so nobody wanders off mid-suspense; skip the cheer Y-write for a seat hidden by an active walk-on swap (c.event) so the stand-in actor keeps owning its transform.
4. Budget check: run tests/shots-gfx.mjs plus the ?fps=1 meter with a forced cheer and record the per-frame cost of ~504 Y-writes (168 seats x 3 meshes) in the docs/GRAPHICS_OVERHAUL.md work log.
5. tests/smoke.mjs GL probe (via __wwt.studio): _cheer becomes active after a correct answer; NEGATIVE CONTROLS: no _cheer while _phase === 'lockin', and no random crowd event spawns during lockin even with c.nextAt forced to 0.
6. BROWSER_QA.md: queue 'Crowd cheers (staggered bounce) on correct and win; sits dead still through the final-answer hold; reduced motion shows no bounce'.

**Files.** `src/shell/studio.js`, `tests/smoke.mjs`, `docs/GRAPHICS_OVERHAUL.md`, `BROWSER_QA.md`

**Proof.** Smoke GL probe with two negative controls (no cheer during lockin; no random crowd event during lockin); shots-gfx + fps meter budget note in the work log; BROWSER_QA.md entry for the choreography read.

**Bound by.** No per-frame allocation (in-place instanceMatrix element writes); one RAF; reduced-motion skips the bounce entirely; crowd randomness stays presentation-only (never touches gameplay RNG or selection); performance budget must hold (~60 fps target, cost recorded); no timeline estimates in the doc updates.

### GX-06 · Vary the LED video wall content per tier and go gold for the final

**Type:** enhancement

**Why.** The wraparound LED wall is a single static texture built once (ledWallTexture(), studio.js lines 1177-1195) and this._ledWall (line 794) is stored but never referenced again (verified by grep) - the set's biggest produced surface looks identical on an easy Q1, the hard tier, and the extreme final, wasting an escalation cue the mood key-light already follows (react('question:show') already receives data.tier and data.isFinal, studio.js lines 189-193).

**Implementation plan.**

1. src/shell/studio.js: extend ledWallTexture(theme) to accept a theme - easy (iris/aqua, sparse lit cells), medium (aqua-heavy), hard (iris/peach, denser lit ratio), final (gold-dominant chase pattern) - all deterministic via the existing index-hash (no Math.random), brand palette only.
2. _buildStudio(): pre-build all four CanvasTextures once at init into this._ledTex = { easy, medium, hard, final }; assign easy as the default map.
3. react('question:show'): pick data.isFinal ? 'final' : data.tier and swap this._ledWall.material.map (+ material.needsUpdate) only when the pick changes - a texture cut, inherently reduced-motion-safe.
4. Optional motion: when !reduced && postFx, drift map.offset.x += dt * 0.01 in _tick (in-place, no allocation); leave the offset static otherwise.
5. dispose(): explicitly dispose all four _ledTex textures - the material traverse only frees the currently assigned map, so the other three would leak.
6. tests/smoke.mjs GL probe (via __wwt.studio): assert the wall's map reference differs between an easy question and a hard-tier question reached via the shipped dev jump (Settings 'Start run at question N' -> 21); NEGATIVE CONTROL: two consecutive easy questions keep the identical texture object. End the probe by calling studio.dispose() and asserting no console errors (Studio.dispose has no runtime caller, so the probe is the only honest exercise of the new four-texture teardown).
7. BROWSER_QA.md: queue 'LED wall - character changes per tier, gold chase for the final; no swap mid-question; effects-off/reduced still shows a static wall'.

**Files.** `src/shell/studio.js`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** Smoke GL probe with negative control (same-tier questions keep the same texture object) plus an explicit dispose()-with-no-console-errors teardown check covering the four-texture free; full matrix green; BROWSER_QA.md entry.

**Bound by.** Original abstract neon in code, palette colours only, no trade dress; textures built once at init (never per question); reduced-motion gets cuts (texture swap) not motion (no offset drift); dispose on teardown; no per-frame allocation.

### GX-07 · Add an adaptive quality governor that sheds effects under sustained low FPS

**Type:** new-implementation

**Why.** The graphics overhaul added a dev-only FPS meter (src/shell/fpsMeter.js) but nothing acts on its data - a weak GPU grinds through bloom, PCF shadows, the 168-person crowd, and motes at low FPS unless the player finds the Settings effects toggle themselves. BROWSER_QA.md's open 'FPS budget' gate (~60, >=45 on weaker hardware) deserves a runtime response, not just a meter. Complies with the hard rules: pure static hosting, no new dependency, degrades presentation only.

**Implementation plan.**

1. src/shell/quality.js (new): a pure DOM-free governor - createGovernor(opts) consumes per-frame dt via a rolling scalar accumulator (no arrays, no allocation) and returns a quality level 0 (full) -> 3 (minimal) with hysteresis: sustained avg below ~45 fps over ~180 frames steps down; sustained above ~58 fps over ~600 frames steps back up, never above the configured ceiling.
2. src/shell/studio.js _tick: feed dt to the governor; on level change (rare, not per frame) apply L1 = hide _motes; L2 = renderer.setPixelRatio(1.25) + renderer.shadowMap.enabled = false followed by a one-time material needsUpdate walk (required for the shadow toggle to take effect); L3 = bypass the composer (the exact direct-render path postFx-off already uses at studio.js lines 411-420). Stepping up restores pixel ratio to the init cap Math.min(devicePixelRatio, 2) (studio.js line 52).
3. Respect user intent: derive the governor ceiling from settings in src/shell/main.js (postFx=false or reduced=true starts at the equivalent floor); stepping up never re-enables anything the user's settings disabled.
4. src/shell/fpsMeter.js: append the current governor level to the meter readout (e.g. '48 fps . q2') so the on-hardware sign-off can watch degradation happen.
5. tests/quality.test.mjs (new, headless - auto-discovered by the npm test glob 'node --test tests/*.test.mjs'): fabricated 33ms frames step the governor down; NEGATIVE CONTROLS: steady 16.6ms frames never degrade, and a brief 20-frame spike does not trigger a step (hysteresis holds); ceiling is never exceeded on recovery.
6. docs/GRAPHICS_OVERHAUL.md: append a work-log line; BROWSER_QA.md: queue 'On weak hardware the studio visibly sheds motes -> resolution/shadows -> post instead of chugging; recovery steps back up; the ?fps=1 meter shows the level'.

**Files.** `src/shell/quality.js (new)`, `tests/quality.test.mjs (new)`, `src/shell/studio.js`, `src/shell/fpsMeter.js`, `src/shell/main.js`, `docs/GRAPHICS_OVERHAUL.md`, `BROWSER_QA.md`

**Proof.** New headless governor suite with negative controls (steady 60fps never degrades; short spikes ride through; ceiling respected); full matrix green; BROWSER_QA.md on-hardware check with the meter showing the level.

**Bound by.** No allocation in the per-frame path (scalar accumulators only; level-change work is event-driven); one RAF; never overrides explicit user settings (only degrades below them, never upgrades past them); no new runtime dependency, pure static hosting; no timeline estimates in the doc updates.

### GX-08 · Add headless coverage for the camera director plus a takes-schema gate

**Type:** new-implementation

**Why.** director.js is deliberately pure math with reusable scratch arrays and imports only takes.js (pure data) - importable in Node with zero DOM - yet tests/ contains no director or takes coverage at all (verified: no director/takes test files exist). Every cinematic rides on scene advancement, queueing, holds, and the cue map, and a malformed take (missing dur, bad type, wrong set name) would only surface as a silent camera glitch in a browser nobody is watching.

**Implementation plan.**

1. tests/director.test.mjs (new): construct Director with a stub onSet and step update(dt) - assert take advancement at dur boundaries, loop restart, loopTail repeating the last take, hold freezing on the final frame, next re-basing onto looping scenes (baseName updates), queue draining in order, play() clearing the queue, playAt() clamping out-of-range take indices, and holdPose freezing until the next play/setBase.
2. Reduced-motion contract: with reduced=true, update() returns each take's midpoint pose for its whole duration - compare against the pose produced at k=0.5 with reduced=false.
3. Cue-sheet integrity: for every case in Director.cue, assert the scene it plays/enqueues/re-bases exists in SCENES, and that onSet fires with 'studio'/'green' matching scene.set.
4. Takes schema validation over SCENES (src/shell/takes.js): per-type required fields (orbit: center/radius/height/from/to; dolly: from.p/from.t/to.p/to.t; pan: p/from/to; static: p/t), finite positive dur, set in {studio, green}, flag fields boolean.
5. NEGATIVE CONTROLS: play('nope')/setBase('nope')/enqueue('nope') leave director state unchanged; a deliberately malformed take object fed to the validator is rejected (proves the gate can fail).
6. No runner wiring needed - package.json's test script already globs tests/*.test.mjs via node --test; run npm test to confirm discovery, then update CHANGELOG.md and STATE.md per the definition of done.

**Files.** `tests/director.test.mjs (new)`, `src/shell/director.js`, `src/shell/takes.js`, `CHANGELOG.md`, `STATE.md`

**Proof.** New headless suite green with the negative controls above (bogus scene names ignored; malformed take rejected); zero behavior change to shipped cinematics proven by the full matrix staying green.

**Bound by.** Tests only - no retiming or reframing of takes (the drafted scenes await owner direction per docs/CINEMATIC_TAKES.md); negative controls mandatory on every new pin (CLAUDE.md paragraph 6); never fabricate a green; small per-unit commit.

### GX-09 · Reconcile CINEMATIC_TAKES.md with takes.js and retire the dead producerReady cue path

**Type:** change

**Why.** docs/CINEMATIC_TAKES.md is the owner's tuning surface for the pending drafted-takes review (a STATE.md next candidate), but it has drifted from the code - all verified: phoneFriend is documented as a 4s tight shot on the host (doc line 116) yet ships as a 10s hold on the contestant (takes.js lines 197-204); audiencePoll is documented as two 3s takes (doc lines 118-121) but ships as one 6s dolly (lines 209-216); the takes.js footnote (lines 245-246) still claims take 7 was 'set to 5s' when it is 16s (the doc already says 16s); and director.cue('question:show') still special-cases 'producerReady' (director.js lines 178-181) - a scene nothing plays outside the ?scene= preview, where question:show never fires, so the branch is unreachable in play.

**Implementation plan.**

1. docs/CINEMATIC_TAKES.md: rewrite the phoneFriend and audiencePoll tables to match src/shell/takes.js as shipped (10s contestant hold matching the DOM cutscene; single 6s crowd push), and re-verify every other row's durations and shot descriptions against SCENES (the producerReady section already correctly notes it is preview-only).
2. src/shell/takes.js: correct the stale trailing footnote - take 7 is 16s, matching the doc's asterisk note.
3. src/shell/director.js cue('question:show'): remove the producerReady special-case branch; keep the producerReady scene itself in takes.js, annotated preview-only (the ?scene= tool still plays it).
4. tests/takes-doc.test.mjs (new, auto-discovered by the npm test glob): parse the duration columns of the scene tables in docs/CINEMATIC_TAKES.md and compare take counts + durations against SCENES so the tables can never silently drift again; NEGATIVE CONTROL: perturbing a parsed duration in memory makes the comparison fail.
5. CHANGELOG.md entry; note in the doc that trigger-map rows must match Director.cue.

**Files.** `docs/CINEMATIC_TAKES.md`, `src/shell/takes.js`, `src/shell/director.js`, `tests/takes-doc.test.mjs (new)`, `CHANGELOG.md`

**Proof.** New doc-sync headless test with its negative control; existing smoke/e2e stay green (no visual behavior change intended - the removed cue branch is unreachable in play).

**Bound by.** Records-only sync - do not redesign or retime any drafted take (that is the owner's pending review per the docs/CINEMATIC_TAKES.md legend); no timeline estimates in docs; small per-unit commit.

### GX-10 · Overhaul the green-room set: fabric and carpet textures plus a living sketchy Steve

**Type:** overhaul

**Why.** BACKLOG.md's presentation section lists the remaining procedural texture ('sofa fabric weave' - the studio disc and wall paneling shipped; verified: the sofas and green-room floor are flat single-colour materials, leather/floorMat in _buildGreen, studio.js lines 893-909). The sketchy guy is a faceless cylinder-plus-hat group (lines 957-968) excluded from _greenPeople (lines 952-955) - he neither breathes, blinks, nor reacts when the sketchyCall camera (takes.js lines 220-230) pushes in on him, and studio.react has no 'steve:call' case at all (verified: the switch handles ten events, not that one), even though director.cue already cuts to sketchyCall on it.

**Implementation plan.**

1. src/shell/studio.js: add fabricTexture() (woven cross-hatch in warm browns) and carpetTexture() (low-contrast mottle) canvas generators beside panelTexture(), deterministic like the existing textures; apply fabric as map + roughnessMap on the sofa leather material and carpet on the green-room floorMat.
2. Rebuild the sketchy guy on the person() builder (dark coat shirt/pants colours, the existing brim/crown hat geometry parented into the head, sunglasses as two dark boxes over the eyes) while keeping his loitering position, lean, and silhouette by the doors ([-3.5, 0, -6.55]).
3. Register him in this._greenPeople with role 'sketchy' and a distinct phase so the _animatePeople life pass drives his breathing/head-drift/arm sway (skip blink under the shades; his resting mouth stays 'flat' via the default branch).
4. Add react('steve:call'): raise his arm to a phone-to-ear pose (eased in _tick via stored refs, snapped under reduced motion) and set a talker-override flag for the cutscene duration; restore the pose and flag on 'scene:green'. In _animatePeople, the green-set talker is hardcoded to 'greenSM' (line 440) - extend the selection to prefer 'sketchy' while the flag is live.
5. Textures are freed by the existing dispose traverse (they are material maps + roughnessMap, which dispose() already handles at lines 268-270); cover it with the shared smoke-probe dispose()-no-console-errors check since no runtime path calls dispose.
6. tests/smoke.mjs (real GL - NOT e2e, which sets wwtbane.nogl and never boots the studio): seed the init-script save with a wallet >= the Steve price, answer deliberately wrong via __wwt.answer() to land in the green room, click Call Steve, then assert via __wwt.studio that the sketchy figure has userData.parts and the phone-pose flag is set; NEGATIVE CONTROL: the flag is not set on merely entering the green room.
7. BROWSER_QA.md: queue 'Green room texture pass (sofa weave, carpet) + sketchy Steve breathes, takes the call phone-to-ear during ?scene=sketchyCall; reduced motion snaps the pose'.

**Files.** `src/shell/studio.js`, `tests/smoke.mjs`, `BROWSER_QA.md`

**Proof.** GL smoke probe with negative control (no phone pose without steve:call); ?scene=sketchyCall preview for framing; texture teardown covered by the probe's dispose()-no-console-errors check; BROWSER_QA.md entry (code-complete, visual-pending).

**Bound by.** Original art drawn in code - no imported model files (FLAGS.md #6 stands until the owner changes the rule); palette + warm green-room grade; no per-frame allocation (pose eased via stored refs); dispose on teardown; reduced-motion snaps; Steve's dialogue copy untouched (human-authored content per CLAUDE.md paragraph 7 - this unit is set dressing only).

---

## Player Experience (PX)

Everything the player touches in the DOM: the quiz card, screens, HUD/ladder, input, ARIA + accessibility, responsive layout, feedback loops, onboarding.

### ✅ PX-01 · Correct the Help screen's lifeline descriptions and add a keyboard-controls section

**Type:** bug-fix

**Why.** HelpScreen (src/shell/ui/screens.js line 195) still teaches the pre-revision lifelines: 'Ask the Audience polls the room (it never points you wrong, only sometimes weakly)' and 'Phone a Friend gives a hedged tip toward the right answer'. The shipped behavior (src/core/lifelines.js PHONE_ACCURACY = 0.68; askAudience trap distractor can win, more often on hard - docs/LIFELINES.md) contradicts this, so the game actively misinforms players about when to trust a lifeline. Help also never mentions the keyboard model (1-6/A-F pick, Arrow/Home/End between answers, Enter lock, Escape pause) that overlay.js handleKey (lines 425-448) and main.js _handleKey implement.

**Implementation plan.**

1. src/shell/ui/screens.js: in HelpScreen, rewrite the 'Three lifelines' bullet (line 195) to match docs/LIFELINES.md - 50:50 removes two wrong answers; Ask the Audience is a real, fallible poll (usually right, occasionally wrong on hard questions); Phone a Friend is a panicked guess that is right about 2 times in 3 - both advise, never grade; keep the existing assisted-answers-don't-promote-mastery sentence.
2. src/shell/ui/screens.js: add a 'Keyboard' bullet to HelpScreen listing: 1-6 or A-F select, arrow keys / Home / End move between answers (selection follows focus), Enter locks in, Escape pauses - mirroring QuizScreen.handleKey in src/shell/ui/overlay.js and Game._handleKey in src/shell/main.js.
3. FLAGS.md: append the new help copy to the section-2 authored-copy flag (AI-drafted UI-mechanics text awaiting a human read).
4. tests/e2e.mjs: open 'How to play' from the title, assert the fallible-poll phrasing and the keyboard bullet are present; negative controls: assert the stale strings 'never points you wrong' and 'hedged tip' are absent from the help list.
5. Update CHANGELOG.md and STATE.md per the definition of done.

**Files.** `src/shell/ui/screens.js`, `tests/e2e.mjs`, `FLAGS.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E check asserting the help text matches shipped lifeline behavior, with negative controls asserting the old 'never points you wrong' and 'hedged tip' phrasings are gone. Full headless + smoke + e2e suites stay green.

**Bound by.** Human sign-off on copy (flag in FLAGS.md section 2); sentence case + Montserrat; copy must describe lifelines as advisors, never graders (CLAUDE.md section 3 integrity of assists); no timeline estimates.

### PX-02 · Fix mobile quiz layout: cap card height against overflow and enforce 44px touch targets

**Type:** bug-fix

**Why.** styles/main.css pins .q-card-wrap to the bottom (position: fixed, bottom: 26px desktop at line 319, bottom: 12px in the max-width 760px block at line 755) with no max-height on .q-card, so a long stem plus 6 options plus an authored image (max-height 200px) plus an audience/phone panel grows past the top of a 390x844 viewport and makes options unreachable (the wrap is fixed, so #ui-root's overflow: auto cannot rescue it). Meanwhile core touch controls sit well under 44px: .link (6px padding / 13px font, about 30px - 'How to play', 'Settings', music toggle, 'Back to title'), .pause-btn (7px padding / 11px font, about 30px, lines 678-682), and .small (8px padding / 12px font, about 32px, line 208) - standards debt against the CLAUDE.md section 6 keyboard + touch rule.

**Implementation plan.**

1. styles/main.css: give .q-card 'max-height: calc(100vh - 120px)' plus a following 'max-height: calc(100dvh - 120px)' declaration (dvh with vh fallback) and 'overflow-y: auto', tightening to 'calc(100dvh - 150px)' inside the max-width 760px block so the 58px ladder strip and the HUD row (top: 66px) stay clear.
2. styles/main.css: in the max-width 760px block, re-anchor .speech-bubble.you (currently left: 50%; bottom: 58% at line 751, z-index 8 from the base .speech-bubble rule at 656) so it cannot cover a full-height card - either position it above the card top or drop its z-index below .q-card-wrap's 5.
3. styles/main.css: add an '@media (pointer: coarse)' block giving .link, .pause-btn, .secondary.small, .ghost.small, .refill-btn, .cine-skip, .sc-skip, and .seed-box summary a 44px min-height (inline-flex centring, padding growth - not font growth); fine-pointer desktop rendering stays byte-identical.
4. tests/e2e.mjs: add a 390x844 hasTouch scenario - start a run, fire Ask the Audience, assert .q-card's boundingClientRect fits inside the viewport and .lock-btn is clickable, and assert the title-foot .link buttons and .pause-btn measure at least 44px tall.
5. tests/e2e.mjs negative controls: at the default 1100x800 fine-pointer viewport, a standard 4-option card gains no scrollbar (scrollHeight <= clientHeight) and the compact desktop control heights are preserved (under 40px), proving both changes are scoped.
6. BROWSER_QA.md: queue 'Card overflow + touch targets at 390px' (long multi question + image + poll; every control comfortably tappable) as code-complete, visual-pending.
7. Update CHANGELOG.md and STATE.md.

**Files.** `styles/main.css`, `tests/e2e.mjs`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E at 390x844 under touch emulation asserting the card fits with a poll open, the lock button is clickable, and target heights are at least 44px; negative controls proving desktop layout and compact sizes are unchanged. BROWSER_QA entry for on-device human sign-off.

**Bound by.** Quiz stays DOM (screen readers); keyboard + touch must both reach every option; pure CSS - no layout refactor of working screens (CLAUDE.md section 7 no-refactor-without-cause); visual change so code-complete, visual-pending until BROWSER_QA sign-off.

### PX-03 · Stop focus yanks on in-place screen re-renders (settings, green-room shop, title music toggle)

**Type:** bug-fix

**Why.** Every settings change calls onChange then this.showSettings() (src/shell/main.js line 292), every shop purchase calls _renderGreenRoom() (from _buySlot/_refill/_callSteve, lines 374-406), and the title music toggle calls showTitle() (line 279) - all rebuild the screen through _swap(), whose focus branch (main.js lines 246-250) moves focus to the h1/h2. A keyboard or screen-reader user toggling a checkbox or buying a slot has focus ripped to the heading after every interaction, breaking focus continuity on the two most form-heavy screens. (The pause menu's toggles mutate in place and are unaffected.)

**Implementation plan.**

1. src/shell/main.js: change _swap(el) to _swap(el, { restoreFocus = false } = {}); when restoreFocus is true, record the active element's data-fkey before clearing and, after append, focus the new element carrying the same data-fkey instead of the heading (fall back to the heading if the key is gone, e.g. a buy button that became 'Max slots').
2. src/shell/ui/screens.js: stamp stable data-fkey attributes on every interactive control in SettingsScreen (one per setting key, music-style select, export/import/reset, dev controls), GreenRoom (per-lifeline buy buttons keyed by type, refill, Steve call, nav buttons), and the TitleScreen music toggle.
3. src/shell/main.js: pass { restoreFocus: true } from showSettings' onChange/onDevAddCoins re-renders, from _renderGreenRoom's calls after onAckReveal/_buySlot/_refill/_callSteve, and from the onToggleMusic showTitle() refresh - genuine navigations keep the heading-focus behavior.
4. tests/e2e.mjs: focus the music checkbox in Settings via keyboard, toggle with Space, assert document.activeElement still carries that data-fkey; same for a green-room buy button after a purchase (fund the wallet through the existing save-injection init script).
5. tests/e2e.mjs negative control: navigating title to Settings still lands focus on the screen heading (the existing navigation contract from the first-playable fix).
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/main.js`, `src/shell/ui/screens.js`, `tests/e2e.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E asserting focus stays on the toggled control across settings and green-room re-renders, with the negative control proving real navigation still moves focus to the heading. Full suite green.

**Bound by.** Accessibility rule (keyboard-first, CLAUDE.md section 6); no refactor beyond the listed re-render paths (no-refactor-without-cause, section 7); behavior identical for mouse users.

### PX-04 · Make the pause menu a true modal: focus trap, aria-modal, background inert, focus restore

**Type:** bug-fix

**Why.** togglePause (src/shell/main.js lines 537-587) builds a role='dialog' panel but sets no aria-modal, does not trap Tab, leaves the quiz card and HUD focusable underneath, and _closePause (lines 589-592) never returns focus to the Menu button. main.js line 819 makes _handleKey swallow quiz keys while paused, but Tab is browser-default - a keyboard user can Tab out of the 'Paused' dialog into quiz options that no longer respond, and a screen reader still perceives the whole quiz behind the overlay.

**Implementation plan.**

1. src/shell/main.js: add 'aria-modal': 'true' to the pause panel and record the previously focused element (defaulting to the HUD pause button) when opening.
2. src/shell/main.js: while the pause layer is open, set the native inert attribute on the pause layer's siblings under roots.screen (the quiz screen element, which contains the HUD) so background content is unfocusable and hidden from assistive tech; remove it in _closePause.
3. src/shell/main.js: add a keydown handler on the pause layer that wraps Tab/Shift+Tab across the panel's focusable elements (query 'button, input, select, [tabindex]:not([tabindex="-1"])') - a small local helper, removed with the layer.
4. src/shell/main.js: in _closePause, restore focus to the recorded opener element if still connected (the HUD .pause-btn persists across questions).
5. tests/e2e.mjs: open the pause menu, press Tab about 15 times, assert document.activeElement is always inside .pause-panel; close with Escape and assert focus is on .pause-btn; negative control: with the menu closed, Tab from the card reaches an .option element.
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/main.js`, `tests/e2e.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E focus-cycling test proving Tab never escapes the open dialog and focus is restored on close, with the negative control proving options are reachable when unpaused. Full suite green.

**Bound by.** Accessibility (keyboard + screen reader, CLAUDE.md section 6); must not disturb the hardening pass's parked lock-in submit logic (quiz.onPause/onResume); inert is native DOM - no new runtime dependency (section 7).

### PX-05 · Complete the loss reveal: show the question, the player's answer, and the doc reference

**Type:** enhancement

**Why.** On a wrong answer, endRun (src/shell/main.js lines 743-749) builds _greenReveal with only correctText, explanation, reached, and banked - the GreenRoom reveal (src/shell/ui/screens.js lines 55-73) then shows an answer with no question stem, no record of what the player picked, and no q.reference, even though the run controller's result carries q and selected (src/core/runController.js answer()) and correct-answer feedback does render the reference (overlay.js line 417). The moment of death is the highest-value teaching beat in a learning game and it currently drops the most context.

**Implementation plan.**

1. src/shell/main.js: in endRun's loss branch, extend _greenReveal (keeping the existing result-null guards) with stem: result.q.stem, domain: result.q.domain, yourAnswer: this._answerText(result.q, result.selected), and reference: result.q.reference || null.
2. src/shell/ui/screens.js: import DOMAIN_LABEL from './labels.js'; in GreenRoom's reveal block, render the stem above the reveal panel (muted, quoted) with a domain chip, a 'You answered' line with the player's picks (x-glyphed), keep 'The correct answer was' (check-glyphed), and add a 'Reference:' line styled like overlay's .fb-ref when reference exists.
3. styles/main.css: add .reveal-stem / .reveal-yours rules reusing the existing .reveal palette (peach for the wrong pick, mantis for the correct one, glyphs carrying the state, never color alone).
4. tests/e2e.mjs: in the existing lose-on-purpose scenario, assert the green-room reveal shows the failed question's stem and a 'You answered' line matching the clicked option; negative control: a question without a reference renders no 'Reference:' node.
5. BROWSER_QA.md: queue the enriched reveal for a visual read (desktop + 390px).
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/main.js`, `src/shell/ui/screens.js`, `styles/main.css`, `tests/e2e.mjs`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E loss-flow assertions on stem, your-answer, and reference rendering, with the no-reference negative control; BROWSER_QA entry for the visual pass.

**Bound by.** Displays only existing authored content (stem/explanation/reference are already in the schema - no new authored copy); colorblind-safe check/x glyphs, never color alone; reveal stays DOM; the authored key remains the only source of correctness (CLAUDE.md section 4).

### PX-06 · Add a post-run recap: every question from the run, reviewable in the green room and win screen

**Type:** new-implementation

**Why.** The run controller returns full per-question results (result.q, selected, correctAnswer, explanation in src/core/runController.js answer(), plus rc.usedThisQuestion for lifelines), but the shell throws them away - after a run of any length the player has no way to revisit what they cleared or which lifelines they leaned on. A recap list is the highest-leverage learning feature the existing data already supports, and both GreenRoom (loss) and ResultScreen (win) have room for it.

**Implementation plan.**

1. src/shell/ui/labels.js: move the TIER_GLYPH map here from src/shell/ui/hud.js (it is a non-exported const at hud.js line 11) and export it; hud.js imports it - one shared source for the tier glyphs.
2. src/shell/main.js: keep a this._runLog array - reset in startRun's beginPlay, and in answer() push { number, tier, domain, stem, correct, yourText, correctText, explanation, reference, lifelines: [...this.rc.usedThisQuestion] } built from the result before advance() clears usedThisQuestion (dev jumps simply log only what was actually answered).
3. src/shell/main.js: pass the log into endRun's two exits - _greenReveal.recap for losses and ResultScreen ctx.recap for wins.
4. src/shell/ui/screens.js: render the recap as a <details class='recap'> ('Review this run - N questions') under the GreenRoom reveal and on the win ResultScreen; each row: Q number, tier glyph + tier word (TIER_GLYPH/TIER_LABEL from labels.js), check/x glyph + word, stem, your answer vs correct answer, and an expandable explanation + reference - all plain DOM.
5. styles/main.css: add .recap styles on the existing panel/reveal tokens; rows stack cleanly at 390px inside the card's scroll container.
6. tests/e2e.mjs: lose on Q1 and assert the recap holds exactly 1 row flagged wrong with the clicked option text; in the win scenario assert 30 rows; negative control: after starting the next run and losing again, the recap holds only the new run's rows (no leakage across runs).
7. BROWSER_QA.md: queue the recap layout (desktop + 390px) for visual sign-off.
8. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/main.js`, `src/shell/ui/screens.js`, `src/shell/ui/labels.js`, `src/shell/ui/hud.js`, `styles/main.css`, `tests/e2e.mjs`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E row-count and content assertions for loss and win recaps with the fresh-run negative control; BROWSER_QA entry for the visual pass. Core is untouched, so existing runController tests stand as the grading gate.

**Bound by.** Display-only: must not touch mastery, grading, or lifeline state (CLAUDE.md section 4); shows only authored explanations/references already shipped; colorblind-safe glyphs + words; stays DOM; session-only (not persisted) so no save-schema bump.

### PX-07 · Add a Progress screen: lifetime stats plus the domain-mastery dashboard, off the title screen

**Type:** new-implementation

**Why.** persistence.js tracks runs, wins, bestPayout, questionsAnswered, and longestStreak (line 30) but the title surfaces only wins and bestPayout (screens.js lines 26-27); src/core/mastery.js still exports the fully tested domainProgress() that has been unused since the owner had the green-room dashboard removed (AUTONOMOUS_RUN.md: it remains 'if it's ever wanted again'). A dedicated, opt-in Progress screen off the title puts exam-readiness data (weakest domains first, priority-set progress) back in front of the player without re-cluttering the green room - placement explicitly flagged for the owner since they removed the original surface.

**Implementation plan.**

1. src/core/mastery.js: add a small pure priorityProgress(bank, state) helper returning { graduated, total } over q.priority questions using isGraduated().
2. tests/mastery.test.mjs: pin priorityProgress with negative controls (a bank with zero priority questions returns total 0 without dividing by zero; a non-graduated priority item is never counted as graduated).
3. src/shell/ui/progress.js (new): ProgressScreen(ctx) rendering (a) a stat row for runs / wins / longest streak / questions answered / best payout from ctx.stats, (b) domainProgress rows weakest-first as labelled bars with the percentage and 'graduated x/y' as text (DOMAIN_LABEL imported from labels.js), and (c) a priority line ('Practice set: x of y mastered') when total > 0.
4. src/shell/main.js + src/shell/ui/screens.js: add a 'Progress' link to TitleScreen's title-foot (ctx.onProgress) that _swaps ProgressScreen({ stats, rows: domainProgress(this.bank, this.save.mastery), priority: priorityProgress(this.bank, this.save.mastery), onClose: () => this.showTitle() }).
5. styles/main.css: bar styles from the existing palette (aqua fill on panel-2 track) with the percent text beside every bar so meaning never rests on bar length alone; empty state for a fresh save ('Answer questions to start building mastery data').
6. tests/e2e.mjs: open Progress on a fresh save and assert the empty state; answer one question, return, and assert that domain's seen-count text incremented; negative control: the green room contains no dashboard nodes (the owner's removal stands).
7. BROWSER_QA.md: queue the Progress screen visuals; FLAGS.md: note the new placement for the owner (the dashboard was removed from the green room at their request - this revives it elsewhere and is trivially removable).
8. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/ui/progress.js (new)`, `src/core/mastery.js`, `src/shell/main.js`, `src/shell/ui/screens.js`, `styles/main.css`, `tests/mastery.test.mjs`, `tests/e2e.mjs`, `BROWSER_QA.md`, `FLAGS.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless test on priorityProgress with negative controls; e2e fresh-save empty state + increment check and the green-room-stays-clean negative control; BROWSER_QA entry for the visual pass.

**Bound by.** Must NOT return to the green room (explicit owner removal); read-only over mastery - never mutates records; colorblind-safe (text values, not bar length alone); project palette + sentence case; reduced motion collapses bar transitions (global CSS rule already covers it); placement flagged in FLAGS.md for owner sign-off before it is 'done'.

### PX-08 · Overhaul the green-room shop: per-lifeline hints, affordability shortfalls, and purchase announcements

**Type:** overhaul

**Why.** The GreenRoom shop (src/shell/ui/screens.js shopRow, lines 76-89) shows only name + charges + a buy button that silently disables when ctx.wallet < SHOP.lifelineSlot - nothing explains what each lifeline does (LIFELINE_META.hint exists in src/core/config.js lines 68-72, unused here), how far the player is from affording a slot (3,000) / refill (1,500) / Steve (4,000), and purchases give no screen-reader feedback (main.js _buySlot/_refill/_callSteve never call _announce). For the between-runs economy loop this is the weakest UX surface in the game.

**Implementation plan.**

1. src/shell/ui/screens.js: in shopRow, render meta.hint as a muted line under the lifeline name, and when a buy button is money-disabled render a shortfall note ('Need 2,000 more', coin glyph + text) from SHOP.lifelineSlot - ctx.wallet; do the same for the refill row (SHOP.refillAll) and Steve's call button (SHOP.steve).
2. src/shell/ui/screens.js: expose the shortfall in the disabled button's accessible name (aria-label) so the reason, not just the disabled state, reaches assistive tech.
3. src/shell/main.js: after _buySlot, _refill, and _callSteve mutate the wallet, call this._announce with the outcome ('Second 50:50 slot bought - 2,000 coins left', 'All lifelines recharged', 'Steve is on the line') so the aria-live region reports the purchase.
4. styles/main.css: add .shop-hint and .shop-short styles (muted / peach with a coin glyph, not color alone) inside the existing green-room token set.
5. FLAGS.md: add the new shop microcopy (hints, shortfall notes, announcements) to the section-2 authored-copy flag for a human read.
6. tests/e2e.mjs: seed a save with wallet 1000 via the init script, enter the green room after a loss, assert the slot row shows the 2,000-coin shortfall; fund to 5000, buy a slot, assert #announce contains the purchase message and the charges text reads 2/2; negative control: with wallet >= price no shortfall node exists.
7. BROWSER_QA.md: queue the denser shop rows (desktop + 390px single-column grid) for visual sign-off; update CHANGELOG.md and STATE.md.

**Files.** `src/shell/ui/screens.js`, `src/shell/main.js`, `styles/main.css`, `tests/e2e.mjs`, `BROWSER_QA.md`, `FLAGS.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E shortfall/announcement assertions with the affordable-state negative control; BROWSER_QA entry for the visual pass. Full suite green.

**Bound by.** New microcopy is game-mechanics text - added to the FLAGS.md section-2 authored-copy flag for a human read; shortfall uses glyph + text (colorblind-safe); prices stay in src/core/config.js SHOP (no economy changes); green-room layout stays low so the lounge remains visible (owner request).

### PX-09 · Wire the extra-time accessibility setting into every paced UI sequence

**Type:** change

**Why.** CLAUDE.md section 6 lists 'extra-time' as a required accessibility feature, but the persisted settings.extraTime flag (src/shell/persistence.js line 31) is read by nothing - a repo-wide grep finds only its default and the Settings toggle (screens.js line 243, mislabelled 'No timers'), a literal no-op. Meanwhile real paced beats rush slow readers: the question read-out (readoutPacing in src/shell/hostLines.js), host bubble holds in _hostSay/_welcomeBeat/_managerBeat, the 2.6s WRONG_WALK_MS auto-walk, the lifeline done-beats in overlay.js, and the intro cinematic's dwell (cinematic.js line 98).

**Implementation plan.**

1. src/shell/hostLines.js: add an optional pace parameter to readoutPacing(stemLength, optionCount, pace = 1) that multiplies stemMs and optionGapMs (never below their base values).
2. src/shell/ui/overlay.js: accept a pacing option (new QuizScreen({ ..., pace: () => number }) supplied by main.js) and apply it to the reading beats: pass it to readoutPacing in showQuestion and multiply FIFTY_DONE_MS, AUDIENCE_DONE_MS, PHONE_STEP_MS, and WRONG_WALK_MS (factor 1.6 when extraTime is on, 1 otherwise); leave the gold suspense beats untouched (drama, not reading).
3. src/shell/main.js: implement the pace getter from this.save.settings.extraTime and apply the same multiplier to the host-line holds in _hostSay, _welcomeBeat, and _managerBeat; pass a pace option into the Cinematic constructor and use it in src/shell/ui/cinematic.js _advance's dwell (line 98).
4. src/shell/ui/screens.js: relabel the toggle 'Extra time' with the description 'Hold host lines, question read-outs and reveals on screen longer.'; move the no-countdown promise ('there is never a countdown to answer') into the HelpScreen rules so the guarantee stays visible; flag the relabelled copy in FLAGS.md section 2.
5. tests/hostlines.test.mjs: pin that pace 1.6 scales both stemMs and optionGapMs and pace 1 is identity; negative control: the multiplier never shrinks a beat below its base value (pace 0.5 clamps to 1).
6. tests/e2e.mjs: with extraTime true in the injected save, answer wrongly and assert .feedback.bad is still on screen after the base 2.6s window (auto-walk extended); negative control: with extraTime false the green room is reached within the normal window.
7. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/ui/overlay.js`, `src/shell/main.js`, `src/shell/ui/cinematic.js`, `src/shell/ui/screens.js`, `src/shell/hostLines.js`, `tests/hostlines.test.mjs`, `tests/e2e.mjs`, `FLAGS.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless pacing-multiplier test with negative control; e2e timing assertions for the extended wrong-answer walk vs the default; full suite green.

**Bound by.** The no-player-timers rule is strengthened, never weakened - extra time only lengthens beats and never adds a countdown; the Phone-a-Friend cutscene stays the only deliberately timed sequence (its steps may lengthen, never shorten); reduced-motion branches still collapse to instant and take precedence; setting copy flagged for human sign-off.

### PX-10 · Show a priority chip on owner practice-set questions

**Type:** enhancement

**Why.** The 25 owner-authored NPX-* questions carry priority: true (src/core/questionSchema.js line 33) and mastery selection floods runs with them via PRIORITY_WEIGHT_BOOST (src/core/mastery.js line 100), but the player cannot tell a question belongs to the owner's practice-exam set - the q-meta row in overlay.js showQuestion (lines 114-118) renders only tier, domain, and multi chips. Surfacing the set tells the player which questions their study plan is built around (STATE.md 'Priority questions' section).

**Implementation plan.**

1. src/shell/ui/overlay.js: in showQuestion's q-meta block, append a 'chip priority' span reading 'star-glyph Priority' when q.priority is set, after the domain chip - glyph plus word, shown in every mode (seeded selection stays priority-blind, but the question is still part of the set).
2. styles/main.css: add .chip.priority using the gold token (color: var(--gold); border-color: rgba(255,200,87,0.55)) consistent with .chip.tier-extreme at line 336; confirm it wraps cleanly in the flex-wrap q-meta row at 390px.
3. src/shell/ui/screens.js: mirror the star marker on the green-room loss reveal (and recap rows if that item lands first) when the failed question was priority - a one-line conditional off the data endRun already passes.
4. src/shell/main.js: extend the e2e-only test hook (_installTestHook, gated on localStorage 'wwtbane.e2e') with priority: () => !!(this.rc && this.rc.current().q.priority) so the test can identify the current question's set membership deterministically.
5. tests/e2e.mjs: walk a mastery run answering correctly until the hook reports a priority question (guard 30) and assert the .chip.priority node is present; negative control: on a question the hook reports as non-priority, assert no .chip.priority node exists.
6. FLAGS.md section 1: ask the owner to confirm they want the set visible in-game (a presentation choice over their practice set - trivially removable).
7. BROWSER_QA.md: queue the chip for a visual read (contrast over the busy card, 390px wrap); update CHANGELOG.md and STATE.md.

**Files.** `src/shell/ui/overlay.js`, `src/shell/ui/screens.js`, `src/shell/main.js`, `styles/main.css`, `tests/e2e.mjs`, `FLAGS.md`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** E2E chip-presence assertion on a priority question with the non-priority negative control, both located deterministically via the test hook; BROWSER_QA visual entry.

**Bound by.** Purely cosmetic - must not touch selection, grading, or mastery ('priority is a selection hint - never affects grading', questionSchema.js); glyph + word, not color alone; gold from the project palette; owner sign-off flagged since it exposes their practice set.

---

## Platform & QA (PQ)

Gates and pipes: the headless suite + negative-control policy, browser harnesses, CI, save integrity, performance budgets, hosting/versioning, resilience.

### PQ-01 · Harden persistence.save() against storage write failures

**Type:** bug-fix

**Why.** VERIFIED: src/shell/persistence.js save() (lines 57-62) calls s.setItem() bare; storage() (lines 10-19) only probes availability with a 1-character write, so a QuotaExceededError on the real, much larger payload (or storage revoked mid-session) throws out of Game.persist() (src/shell/main.js:768) into live gameplay flow (persist() sits on the answer, shop, and settings paths) with no recovery and no message to the player. save() currently returns undefined, so adding a return value breaks no caller.

**Implementation plan.**

1. src/shell/persistence.js save(): wrap the s.setItem call in try/catch; on failure write the serialized state to the existing memoryFallback and return { ok: false }; return { ok: true } on success (verified: no caller reads the current undefined return).
2. src/shell/persistence.js: export a lastWriteFailed() getter (module-level boolean, set on first failure, cleared on the next success) so the shell can detect degradation without new plumbing.
3. src/shell/main.js persist() (line 768): on the first { ok: false }, call this._announce() and show a one-time non-blocking notice ('progress is running in memory only - export a save code from Settings'); never rethrow.
4. tests/persistence.test.mjs: stub globalThis.localStorage (delete it in a finally - Node 22 has no ambient localStorage here, verified by the existing suite relying on the storage() catch) with a setItem that passes the 1-char '__wwtbane_test__' probe but throws QuotaExceededError on the STORAGE_KEY payload; assert save() does not throw, returns ok:false, and a subsequent load() serves the state from the memory fallback.
5. NEGATIVE CONTROL: same suite with a healthy storage stub - save() returns ok:true, the memory fallback stays null, lastWriteFailed() never trips.
6. Update CHANGELOG.md and STATE.md.

**Files.** `src/shell/persistence.js`, `src/shell/main.js`, `tests/persistence.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: new persistence tests green with the quota-throwing stub plus the healthy-stub negative control; npm run smoke and npm run e2e stay green (persist() is on the answer path, so any regression surfaces immediately).

**Bound by.** Pure static hosting (no server-side saves); degrade gracefully rather than block play; notice copy is UI chrome, not exam content and not host dialogue; never fabricate a green.

### PQ-02 · Handle WebGL context loss in the studio with CSS-fallback handover

**Type:** new-implementation

**Why.** VERIFIED: grep finds no webglcontextlost/webglcontextrestored handler anywhere in src/ or tests/; main.js:132 hides the CSS fallback after a successful Studio init, so a driver reset or GPU eviction mid-run leaves a frozen or black canvas behind the DOM quiz for the rest of the session. The quiz keeps working (it is DOM) but the backdrop silently dies. Studio already declares an onError option that is never invoked or passed (studio.js:31) - a ready-made seam.

**Implementation plan.**

1. src/shell/studio.js init() (after the appendChild at line 60): add renderer.domElement listeners - on 'webglcontextlost' call event.preventDefault(), stop rendering via renderer.setAnimationLoop(null), and invoke a new onContextLost option callback; on 'webglcontextrestored' restart renderer.setAnimationLoop(this._tick) (the _tick class field at studio.js:302) and invoke onContextRestored. Three re-uploads GL state itself; do NOT rebuild the scene graph - the studio is built once.
2. src/shell/main.js (Studio construction, lines 126-130): pass onContextLost, which removes 'hidden' from roots.fallback so the existing CssBackdrop (already mirroring the whole event bus, main.js:114-115) takes over seamlessly; onContextRestored re-hides the fallback.
3. src/shell/main.js: if restore throws during resume or a second context-lost arrives before restore, call this.studio.dispose() (studio.js:249), null this.studio (the bus forwarder at main.js:133 already guards on this.studio), and stay on the CSS fallback for the session.
4. tests/contextloss.mjs (new, reusing serve/loadPlaywright/launchArgs from tests/_harness.mjs): boot the real GL path (no wwtbane.nogl), start a run, then page.evaluate getExtension('WEBGL_lose_context').loseContext() on the #studio-root canvas context; assert #backdrop-fallback loses .hidden, the quiz still answers and locks in, and zero console/page errors; then restoreContext() and assert the fallback re-hides and frames advance again.
5. NEGATIVE CONTROL: identical flow without firing loseContext - assert the fallback stays hidden throughout, proving the visibility assertion is not trivially true.
6. Add a BROWSER_QA.md entry: eyeball the GL-to-CSS handover on real hardware (no flash, no dead frame).
7. package.json: add a contextloss script alongside smoke/e2e; update CHANGELOG.md and STATE.md.

**Files.** `src/shell/studio.js`, `src/shell/main.js`, `tests/contextloss.mjs (new)`, `package.json`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless browser test with the WEBGL_lose_context extension plus the no-loss negative control; visual handover queued in BROWSER_QA.md for human sign-off (visual work is never done without it).

**Bound by.** Build the studio once - restore must resume, not rebuild; dispose GL resources on permanent teardown; quiz stays DOM so play never blocks; reduced-motion path must behave identically (the fallback swap is a cut, not an animation).

### PQ-03 · Overhaul CI: run smoke + e2e + screenshot artifacts, not just unit tests

**Type:** overhaul

**Why.** VERIFIED: .github/workflows/ci.yml runs only 'node --test tests/*.test.mjs' with an explicit no-install step; tests/smoke.mjs and tests/e2e.mjs self-SKIP (exit 0) when Playwright is missing, and tests/_harness.mjs findExe() (line 36, probing the EXE list at line 11) only checks /opt/pw-browsers paths that do not exist on GitHub runners - so the 8 smoke + 18 e2e browser checks (counts confirmed against STATE.md) never gate a push/PR, and a broken boot path could merge green.

**Implementation plan.**

1. tests/_harness.mjs: extend findExe() to honor a WWT_CHROMIUM env var and glob the default Playwright cache (~/.cache/ms-playwright/chromium-*/chrome-linux/chrome) before the existing /opt paths; keep the undefined-means-SKIP behavior for local machines.
2. tests/_harness.mjs loadPlaywright(): when process.env.WWT_REQUIRE_BROWSER === '1', a missing browser or executable exits 1 instead of SKIP - CI must never report a skipped browser suite as green (never fabricate a green).
3. package.json: add "test:browser": "node tests/smoke.mjs && node tests/e2e.mjs".
4. .github/workflows/ci.yml: add a browser job - setup-node 22, then 'npx playwright install --with-deps chromium' (npx fetches the full playwright CLI for CI only; repo devDependencies stay playwright-core alone), then run test:browser with WWT_REQUIRE_BROWSER=1; leave the zero-dependency headless job untouched.
5. ci.yml: after browser tests, run node tests/shots.mjs with SHOT_DIR pointed into the workspace and actions/upload-artifact the PNGs (shots/ is gitignored - verified - so artifacts are the review channel for BROWSER_QA.md); on failure, upload the same directory for diagnosis.
6. README.md + STATE.md: update the gates description (CI now runs headless + smoke + e2e on every push/PR); no timeline estimates.
7. NEGATIVE CONTROL (local, pre-merge): break one e2e selector with WWT_REQUIRE_BROWSER=1 and a real chromium present, confirm the run exits non-zero; revert. Second negative control: missing browser + WWT_REQUIRE_BROWSER=1 exits 1.

**Files.** `.github/workflows/ci.yml`, `tests/_harness.mjs`, `package.json`, `README.md`, `STATE.md`, `CHANGELOG.md`

**Proof.** Open a PR: headless and browser jobs both green, screenshot artifact attached; the broken-selector negative control proves a broken flow fails the job; missing-browser + WWT_REQUIRE_BROWSER=1 exits 1 (second negative control).

**Bound by.** Never fabricate a green (SKIP must hard-fail in CI); no runtime dependencies added - Playwright stays dev/CI-only and the shipped site remains pure static; no timeline estimates in docs.

### PQ-04 · Add a seeded save-corruption fuzz suite and tighten migrate()

**Type:** new-implementation

**Why.** VERIFIED: load() accepts arrays that importString rejects (persistence.js:89 rejects Array.isArray, load() at 43-55 does not); migrate() (lines 99-110) passes parsed.mastery through unsanitized when it has a records key (line 103) and never sanitizes wallet/stats to finite non-negative numbers, so a save with wallet NaN or 1e309 survives into the HUD; nothing systematically exercises hostile shapes - the existing tests/persistence.test.mjs covers only happy-path corruption. Saves are the player's long-term learning state; silent normalization bugs destroy it. (Corrected from the proposal: object spread uses CreateDataProperty, so a JSON __proto__ key cannot pollute Object.prototype through migrate() - the suite asserts non-pollution rather than claiming an existing pollution bug.)

**Implementation plan.**

1. src/shell/persistence.js: factor a parseRaw(raw) helper out of load() (JSON.parse + migrate + catch) so tests can drive the exact load path without a localStorage global; load() becomes a thin wrapper.
2. src/shell/persistence.js migrate(): reject non-plain-objects (arrays, primitives) the same way importString does (align the two paths - a documented CODE_REVIEW follow-up); sanitize wallet and each stats.* field to finite non-negative numbers; ensure mastery.records is an own plain object or fall back to emptyMastery().
3. tests/persistence.fuzz.test.mjs (new): use makeRng from src/core/rng.js to generate ~500 seeded mutations of exportString(defaultSave()) - random truncations, per-key type flips, injected __proto__/constructor keys, deep nulls, huge/NaN numbers, array wrapping - and drive each through both parseRaw() and importString().
4. Assert per case: never throws; result is null or a fully-shaped save (version === SAVE_VERSION from src/core/config.js:118, lifelines/flags/stats/settings objects present, mastery.records an own plain object, wallet finite and >= 0); Object.prototype remains unpolluted after every case.
5. Print the seed + failing mutation on any assertion failure so CI results reproduce locally; pin any fuzzer-found bug as a named regression test in tests/persistence.test.mjs.
6. NEGATIVE CONTROL: a pristine exportString(defaultSave()) with mastery records round-trips non-null and deep-equal on wallet/stats/mastery - proving the tightened gate is not rejecting everything. Update CHANGELOG.md and STATE.md.

**Files.** `tests/persistence.fuzz.test.mjs (new)`, `src/shell/persistence.js`, `tests/persistence.test.mjs`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: fuzz suite green over the deterministic seed set, negative-control round-trip green, existing persistence tests untouched and green; npm run e2e scenario 3c (export) still passes.

**Bound by.** Mastery is shared learning state - normalization of a valid save must never wipe it (assert explicitly); deterministic seeds only, no wall-clock randomness in tests; negative controls mandatory.

### PQ-05 · Add a vendor-integrity and no-external-request gate

**Type:** new-implementation

**Why.** VERIFIED: the no-CDN rule (CLAUDE.md section 5) and README's 'no external requests at all' promise are enforced by convention only - nothing verifies the index.html importmap targets (lines 16-21: ./vendor/three/build/three.module.js and ./vendor/three/examples/jsm/) exist on disk, that the vendored Three is the documented r160 (three.module.js line 6: const REVISION = '160'), or that no external URL has crept into a code path. All referenced assets confirmed present (vendor/fonts/montserrat.css + 2 woff2 files, styles/main.css, vendor/three/examples/jsm/). One bad merge silently breaks the sandbox/offline guarantee.

**Implementation plan.**

1. tests/vendor.test.mjs (new): read index.html, parse the importmap JSON plus every href/src attribute, and assert each relative target resolves to an existing file or directory under the repo root (three.module.js, vendor/three/examples/jsm/, vendor/fonts/montserrat.css, styles/main.css).
2. Same test: read vendor/three/build/three.module.js and assert its REVISION constant is '160', matching README.md and the vendor policy.
3. Same test: parse vendor/fonts/montserrat.css and assert every url(...) resolves to a vendored font file.
4. Add a pure function findExternalUrls(source) in scripts/check-static.mjs that flags http(s):// occurrences in import/importScripts/fetch/href/src/url() positions (comments stripped first); run it from the test over index.html, styles/*.css, and src/**/*.js with an explicit empty allow-list.
5. NEGATIVE CONTROL: feed findExternalUrls fixture strings containing a CDN https import and a CSS @import of an external font; assert both are flagged. Second negative control documented in the test header: temporarily renaming three.module.js locally fails the suite.
6. Wire nothing new into CI - the test lands in tests/*.test.mjs and runs in the existing zero-dependency headless job automatically; update STATE.md gate counts and CHANGELOG.md.

**Files.** `tests/vendor.test.mjs (new)`, `scripts/check-static.mjs (new)`, `index.html`, `STATE.md`, `CHANGELOG.md`

**Proof.** Headless: gate green on the current tree; negative-control fixtures flagged; renaming vendor/three/build/three.module.js locally fails the suite, then restore.

**Bound by.** Three.js vendored, never CDN (CLAUDE.md section 5); no runtime deps beyond Three.js; test uses Node built-ins only so the zero-dependency CI job stays zero-dependency.

### PQ-06 · Add an automated axe-core accessibility audit across game states

**Type:** enhancement

**Why.** VERIFIED: accessibility is a hard rule (CLAUDE.md section 6) but automated coverage is pointwise - tests/smoke.mjs checks only the radiogroup arrow-nav (lines 44-64). New UI keeps landing (pause menu, shop, settings, Steve panel) with no page-wide check for contrast, missing names, or ARIA misuse, so regressions ship silently between human passes (the hardening pass already caught a clipped focus ring and broken radiogroup semantics by hand - exactly what this automates).

**Implementation plan.**

1. package.json: add axe-core as a devDependency (test-only; the shipped site remains dependency-free - matches the existing playwright-core precedent).
2. tests/a11y.mjs (new): reuse serve/loadPlaywright/launchArgs from tests/_harness.mjs; drive the states - title, question card after the read-out settles, pause menu open (Escape), Settings screen, and green-room shop + Steve reached via the loss path already scripted in tests/shots.mjs lines 47-61.
3. Inject node_modules/axe-core/axe.min.js with page.addScriptTag at each state and run axe.run with WCAG 2.x A/AA tags; fail on any serious or critical violation, printing rule id + selector for each.
4. Handle intentional patterns with targeted per-node exemptions documented inline (e.g. the aria-hidden #studio-root canvas), never blanket rule disables.
5. NEGATIVE CONTROL: inject a deliberately broken control (unlabeled icon button with ~1.2:1 contrast) into the title screen DOM and assert axe flags it - proving the audit detects real violations.
6. package.json: add "a11y": "node tests/a11y.mjs" and append it to the CI browser job in .github/workflows/ci.yml (ordering: land after the CI-overhaul item so the browser job exists).
7. BROWSER_QA.md: note the audit supplements but never replaces the human screen-reader/keyboard pass; update CHANGELOG.md and STATE.md.

**Files.** `tests/a11y.mjs (new)`, `package.json`, `.github/workflows/ci.yml`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** npm run a11y green across all five states; the planted-violation negative control fails as expected; CI browser job runs it on every PR once the CI overhaul lands.

**Bound by.** Quiz stays DOM for screen readers; colorblind-safe glyphs and keyboard/touch rules are what this gate protects; axe-core is dev-only (no runtime deps beyond Three.js); automated green does not replace human a11y sign-off.

### PQ-07 · Encode the performance budget as a repeatable browser test

**Type:** new-implementation

**Why.** VERIFIED: CLAUDE.md section 6 performance rules (one RAF, no allocation in update loops, GL disposal on teardown) are enforced only by code review and the human FPS meter (src/shell/fpsMeter.js, ?fps=1); grep confirms renderer.info is read nowhere, so nothing machine-checks that the thinking loop does not leak heap or GL resources, or that quit-to-title actually frees what studio.js dispose() (line 249) is supposed to free. A regression here degrades every session on weak hardware.

**Implementation plan.**

1. src/shell/main.js _installTestHook() (line 183): expose window.__wwt.glInfo = () => a renderer.info snapshot (memory.geometries/textures, programs.length) via this.studio (null-safe) - gated exactly like the existing hook behind localStorage 'wwtbane.e2e', so it never exists in normal play.
2. tests/perf.mjs (new): boot the real WebGL path (no wwtbane.nogl) with the harness swiftshader args plus --js-flags=--expose-gc; start a run and reach the steady thinking loop.
3. Loop-count budget: via addInitScript, wrap window.requestAnimationFrame to count distinct persistent callbacks per frame tick (Three's setAnimationLoop schedules through it); after the entrance tweens settle (the hud.js _tween and overlay.js poll count-up RAF chains around hud.js:210-224 and overlay.js:260-275 are transient and self-terminate), assert the steady-state persistent per-frame count is exactly one - the studio loop (CLAUDE.md sections 5/6).
4. Heap budget: force GC, sample performance.memory.usedJSHeapSize, idle 8s in the thinking loop, force GC, resample; assert growth below a stated ceiling (start at 2 MB; record observed swiftshader variance in the test header and adjust honestly).
5. GL budgets: assert __wwt.glInfo() geometry/texture counts are stable across the idle window (no per-frame resource creation) and that after quit-to-title (pause menu, quit) the counts drop back near the post-dispose baseline.
6. NEGATIVE CONTROL: from the test, register a rogue persistent RAF that allocates a 10k-element array per frame; assert both the loop-count and heap detectors trip; remove it and re-assert green.
7. package.json: "perf": "node tests/perf.mjs"; add to the CI browser job - loop-count and GL assertions gate hard; the heap ceiling gates hard only if swiftshader variance proves stable, otherwise it prints as a labeled advisory (never silently passed).
8. Update STATE.md and CHANGELOG.md gate descriptions.

**Files.** `tests/perf.mjs (new)`, `src/shell/main.js`, `package.json`, `.github/workflows/ci.yml`, `STATE.md`, `CHANGELOG.md`

**Proof.** Headless browser run: budgets green on the current build; the rogue-RAF negative control trips both detectors; budget numbers printed every run for trend-watching in CI logs.

**Bound by.** One RAF, no allocation in update/draw loops, dispose GL on teardown (CLAUDE.md section 6); test hook stays behind the wwtbane.e2e opt-in; never fabricate a green - advisory metrics must be explicitly labeled advisory.

### PQ-08 · Extend e2e to the green-room economy, Steve call, and save import

**Type:** enhancement

**Why.** VERIFIED: tests/e2e.mjs drives win/prestige, loss, seeded runs, pause, and export - but never buys a lifeline slot, refills charges, calls Steve (line 89 only checks the .steve panel exists), or imports a save through the UI. The shop rows (src/shell/ui/screens.js:76-89), refill row (103-108), Steve panel (111-130), the cutscene (src/shell/ui/steveCutscene.js, skip button .sc-skip at line 48), and the onImport path (src/shell/main.js:304-314) have zero end-to-end coverage despite being the entire between-runs loop.

**Implementation plan.**

1. tests/e2e.mjs: add Scenario 5 - init-script a save with wallet 20000 + seenIntro; lose on purpose (reuse the wrong-answer helper from scenario 2) to land in the green-room shop.
2. Drive 'Buy 2nd slot' for 50:50 (screens.js:84-87): assert the shop row reads '2/2 charged' and the wallet debits by SHOP.lifelineSlot (src/core/config.js:81, 3000); then burn a charge next run, return via a second loss, drive the .refill-btn and assert charges restore with the SHOP.refillAll debit.
3. Drive Steve: click 'Call Steve', wait for the split-screen cutscene, click its .sc-skip control, assert the clue persists in .steve-clue, the stored save's steveTaught array gained the question id (main.js:398-399), and the same visit offers no second call (steve.calledThisVisit renders the clue, not the button - one call per visit, CLAUDE.md section 3).
4. Start the next run and assert the purchased second 50:50 charge is actually usable twice in one run (two successful uses / charge pips).
5. Import path: capture an export code in one context, paste it into Settings .save-io in a fresh context, click Import; handle BOTH dialogs via page.on('dialog') (main.js uses confirm() to accept at line 307 and alert() to reject at line 306); assert wallet + a marked mastery record arrive. NEGATIVE CONTROL: paste garbage, assert the rejection alert fires and the stored save is byte-identical afterward.
6. NEGATIVE CONTROL (economy): a context seeded with wallet below SHOP.lifelineSlot must render the buy button DISABLED (screens.js:85 sets disabled: !slotAfford - the button is present but inert; corrected from the proposal, which wrongly expected it absent); force-click it and assert the wallet is unchanged (main.js _buySlot line 375-376 also guards).
7. Update the honest check-count in STATE.md and CHANGELOG.md.

**Files.** `tests/e2e.mjs`, `STATE.md`, `CHANGELOG.md`

**Proof.** npm run e2e green with the new scenario on the working flows and both negative controls; runs in the CI browser job once the CI overhaul lands.

**Bound by.** Lifelines advise, never grade - do not re-test grading here (core-owned); Steve is one call per visit and never repeats a clue (assert, do not alter); no timers introduced; test hook usage stays behind the wwtbane.e2e opt-in.

### ✅ PQ-09 · Fix stale player-facing copy (README + in-game help) and add a mechanical docs-drift gate

**Type:** bug-fix

**Why.** VERIFIED, and worse than proposed: README.md says Ask the Audience 'never points you at a wrong answer' (line 31) and Phone a Friend gives 'a hedged tip toward the right answer' (line 33) - both superseded by the owner revision in CLAUDE.md section 3 / docs/LIFELINES.md; it claims coins bank at 'questions 10, 20, and 29' (line 27) while the shipped safe havens are Q5/Q10/Q17/Q25 (src/core/config.js:38); it still sells the removed 'mastery board' (lines 39, 54); and it claims a '157-question bank' (line 111) while src/content/questions.js holds 182 (verified by import). The SAME retired lifeline copy also ships inside the game: the HelpScreen (src/shell/ui/screens.js:195) tells players the audience 'never points you wrong'. Players rely on this copy to decide when to trust a lifeline - it must not lie.

**Implementation plan.**

1. README.md: rewrite the lifeline bullets to shipped behavior (fallible audience poll where a trap distractor can win, more often on hard; panicking friend right 68% of the time; hints never decide correctness - the authored key does), fix the safe-haven line to Q5/Q10/Q17/Q25, remove the mastery-board sentences, correct the bank count to 182, and refresh the project-layout block (add scripts/, styles/, hostLines.js, director.js/takes.js).
2. src/shell/ui/screens.js HelpScreen (line 195): fix the same lifeline sentence to shipped behavior (mechanics copy, not exam content and not host dialogue - but note the change in the commit for the human copy pass, per the FLAGS.md section-2 precedent).
3. tests/docs.test.mjs (new): import QUESTIONS from src/content/questions.js and assert README's 'N-question bank' token equals QUESTIONS.length; assert the live URL in README matches STATE.md's; assert README's safe-haven list matches the SAFE_HAVENS export in src/core/config.js. (Dropped from the proposal: the README version-badge assertion - README has no version badge, and version pinning already lives in tests/version.test.mjs.)
4. Same test: pin the retired claims as forbidden strings in README.md AND src/shell/ui/screens.js ('never points you at a wrong answer', 'never points you wrong', 'hedged tip toward the right answer', 'mastery board') with a comment citing the CLAUDE.md section-3 owner revision, so the stale copy cannot return.
5. NEGATIVE CONTROL: run the checker helpers against fixture strings containing '157-question bank' (with the real 182-item bank) and a forbidden phrase; assert both fail.
6. CHANGELOG.md: record the player-facing copy corrections; STATE.md: add the docs gate to the test roster; manual read-through of the diff against CLAUDE.md section 3 and docs/LIFELINES.md before commit.

**Files.** `README.md`, `src/shell/ui/screens.js`, `tests/docs.test.mjs (new)`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: docs gate green against the corrected README + HelpScreen, both negative-control fixtures fail; npm run smoke/e2e stay green (HelpScreen renders in the help flow).

**Bound by.** Copy must describe lifelines exactly as CLAUDE.md section 3 / docs/LIFELINES.md spec them; keep the pending-human-review caveat on the AI-drafted bank intact (section-7 note); this is mechanics documentation, not host/Steve dialogue or exam content - but flag in the commit if any wording drifts toward teaching content; no timeline estimates.

### PQ-10 · Ship a service worker for full offline play (owner-flagged PWA)

**Type:** change

**Why.** VERIFIED: BACKLOG.md Tech lists 'Service worker for full offline play + installable PWA'; the site already makes zero external requests (vendored Three r160 + self-hosted Montserrat, importmap in index.html lines 16-21), so offline play is one cache layer away - high value for studying on flights/commutes. It is first-party platform code, not a runtime dependency, and hosting stays GitHub Pages - but it changes serving behavior (stale-until-update), so it conservatively ships behind an owner-OK flag per the CLAUDE.md section-7 hosting rule.

**Implementation plan.**

1. FLAGS.md: add the entry FIRST - SW proposed, update policy stated (new version activates on next load; old caches deleted on activate), registration ships disabled until the owner OK lands.
2. scripts/build-sw-manifest.mjs (new): walk index.html, styles/, src/, vendor/ and emit sw-manifest.js (an importScripts-able asset list + a cache version derived from VERSION in src/core/config.js) so the precache list can never drift from the tree; wire as npm run build:sw.
3. sw.js (new, repo root): classic script; importScripts('./sw-manifest.js'); install precaches the manifest, fetch serves cache-first with network fallback, activate deletes caches whose version differs - all paths relative so the GitHub Pages /WWTBANE/ subpath works.
4. manifest.webmanifest (new): name/short_name, theme+background #04040a, display standalone; icons drawn by a small script rendering the project's neon mark in the palette (code-drawn original art - preferred over the emoji favicon, whose glyph rendering is platform font art, for anything shipped as a PNG icon); link it plus the SW registration (feature-gated behind the FLAGS.md OK, failure-silent, honoring a ?nosw=1 kill switch) from index.html.
5. tests/offline.mjs (new, via tests/_harness.mjs): load the page and wait for SW activation, then CLOSE the static server and reload (server-down is a stronger offline proof than context.setOffline, which SW-mediated fetches can bypass in Playwright); assert the title renders and a run starts with zero console errors. NEGATIVE CONTROL: fresh context with ?nosw=1, server closed - assert the load fails, proving the pass is the SW's doing.
6. tests/vendor.test.mjs: assert sw-manifest.js exists, includes index.html + three.module.js + the Montserrat woff2 files, and its cache version matches VERSION - so a release can never ship a stale-forever cache.
7. package.json: add build:sw and offline scripts; README.md documents offline/install once the owner OKs; BROWSER_QA.md: queue install-to-homescreen + airplane-mode play on a real device; CHANGELOG.md/STATE.md updates. Do NOT mark the unit done until the FLAGS.md owner OK lands (park-and-flag).

**Files.** `sw.js (new)`, `manifest.webmanifest (new)`, `scripts/build-sw-manifest.mjs (new)`, `index.html`, `tests/offline.mjs (new)`, `tests/vendor.test.mjs`, `FLAGS.md`, `package.json`, `README.md`, `BROWSER_QA.md`, `CHANGELOG.md`, `STATE.md`

**Proof.** Headless: offline reload e2e green with the server-closed + ?nosw=1 negative control; manifest-coverage assertions green in the unit job; BROWSER_QA.md entry for real-device install + offline play; unit stays parked until the FLAGS.md owner OK.

**Bound by.** Pure static hosting preserved (no server; the SW is first-party platform code, not a runtime dependency); flagged for owner OK per the CLAUDE.md section-7 rule before the registration ships enabled; no external requests; icons are original code-drawn art in the project palette; cache version locked to VERSION so updates propagate.

---

## Review provenance

This plan was produced by ten agents: five department researchers reading the live tree (each citing real files and verifying gaps by inspection), then five independent skeptical reviewers who re-checked every item against `CLAUDE.md`, verified every cited path, spot-checked claimed gaps in the code, corrected factual errors, and replaced items that failed review. Reviewer notes are preserved in the session record. The plan itself makes no correctness decisions about exam content — the authored key remains the sole grader, always.
