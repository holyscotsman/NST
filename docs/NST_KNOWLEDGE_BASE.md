# Nutanix Study Tool (NST) — Knowledge Base

> **What this is.** NST consolidates two previously separate study apps — **WWTBANE** and
> **StarNix** — plus a new **Nutanix Practice Exams** module into a single web app. This
> document is the self-contained project reference: what each tool is, how it's built, the
> design decisions and integrity rules behind the content, and what remains open. It merges
> the original WWTBANE and StarNix handoff documents into one cohesive record so the app can
> be maintained without the original repos.

**Snapshot**
- **Cert targeted:** NCP-MCI (Nutanix Certified Professional — Multicloud Infrastructure).
- **Hosting:** plain static site on GitHub Pages (deploy from a branch, root). No build step
  at deploy time, no server, no runtime CDN dependencies.
- **Live:** https://holyscotsman.github.io/NST/ (once Pages is enabled).
- **Structure:** a launcher home page routing to three tools, each in its own folder.

---

## 1. Product overview

NST's home page (`/`) is a dark-mode launcher with three cards:

| Tool | Path | What it is |
|------|------|-----------|
| **WWTBANE** — "Who Wants to Be a Nutanix Engineer?" | `/wwtbane/` | A game-show-style quiz over a spaced-repetition engine: answer 30 in a row, permadeath, money ladder, Green Room + lifelines. |
| **StarNix** | `/starnix/` | A cinematic study game: three arcade sub-games (Acropolis Rescue, Kuiper Belt Battle, Chasm Chase) that teach one shared question bank via a Leitner scheduler. |
| **Nutanix Practice Exams** | `/practice-exams/` | A standard practice test with **Practice Mode** (instant feedback, untimed) and **Exam Mode** (timed, randomized, 80% to pass). |

Both source apps were framework-free static apps, so NST unifies them **without rewriting
either** — each tool lives in its own directory with its own CSS/JS, avoiding framework,
dependency, and namespace collisions. The full git history of both source repos is preserved
(imported via `git subtree`). The **Nutanix Practice Exams** module was built from StarNix's
former "Nutanix Interrogation Test," which was moved out of StarNix entirely.

### Repository layout

```
nst/
├── index.html                 # launcher / home page
├── styles/nst-home.css        # launcher styles + Settings + accessibility classes
├── scripts/nst-home.js        # launcher Settings panel
├── shared/nst-prefs.js        # NST-wide preferences (single source of truth)
├── wwtbane/                    # WWTBANE (imported, works unchanged)
├── starnix/                    # StarNix (imported; Interrogation Test removed)
├── practice-exams/             # Nutanix Practice Exams (new module)
├── docs/NST_KNOWLEDGE_BASE.md  # this document
├── .nojekyll                   # serve files as-is
└── .github/workflows/ci.yml    # CI: WWTBANE tests + StarNix build/harnesses
```

### Design language

Dark-only theme, purple signature (`#7C4DFF`; replaces the Nutanix lime-green accent at the
client's request), Space Grotesk (display) + Manrope (UI). Answer/option states pair color
with an icon **and** text (never color alone), visible focus rings, reduced-motion aware.
Each source app keeps its own internal look; the launcher, Settings, and Practice Exams share
the system above.

---

## 2. Shared philosophy — the integrity rules (carry these forward)

Both source projects were built on the same non-negotiable principles. These are the spine of
a trustworthy study tool and must survive any future change:

1. **Learning integrity — the authored answer key is authoritative. An LLM must NEVER
   determine correctness.** The runtime never asks an AI whether an answer is right; a fixed,
   human-authored/reviewed key decides. AI was permitted **only** for offline content
   drafting/verification, with human review before shipping. Both apps keep a permanent no-op
   `AIAdapter` seam that must stay a no-op.
2. **Ambiguous items are quarantined**, with a documented reason — never silently "fixed."
   Where an explanation's prose seems to disagree with a key, that is a *note*, not grounds to
   change the key.
3. **No player timers in the study loop** (WWTBANE). Where a timer exists (StarNix exam sim,
   Practice Exams Exam Mode) it is a deliberate exam-condition feature, and an "extra time"
   accessibility multiplier is honored.
4. **Accessibility is a gate.** Keyboard + touch; colorblind-safe cues (shape/icon + text,
   never color alone); reduced-motion (cuts not moves, no strobe, flashing < 3 Hz); DOM-based
   quiz text for screen readers.
5. **Determinism.** Gameplay randomness flows through a seeded, forkable RNG — never
   `Math.random` in gameplay paths (StarNix enforces this with a gate allowlist).
6. **Original art & audio only** — drawn/synthesized in code; no imported models, no licensed
   music, the Nutanix wordmark used unaltered on title screens only.
7. **Pure static hosting** — no server, no runtime dependency except vendored Three.js.
8. **Test gate with negative controls** — headless GREEN is the minimum ship gate, and every
   new test pin ships with a control that must *fail* to prove the assertion is real. Visual/
   audio correctness is a separate human sign-off.

---

## 3. WWTBANE — "Who Wants to Be a Nutanix Engineer?"

### 3.1 What it is
A game-show quiz styled after *Who Wants to Be a Millionaire*. Answer **30 questions in a
row** (10 easy / 10 medium / 9 hard / 1 extreme final), climbing a money ladder. A bank with
10–29 valid questions plays a **proportionally scaled ladder** (`ladderProfile()` in
`core/config.js`) — same tier split, same safe-haven rhythm, same 50,000 top prize; the
25-question bank runs 8/8/8/1 with havens at Q4/Q8/Q14/Q21. **One wrong
answer ends the run** (permadeath), but coins **bank** at safe havens so an early death still
pays. Between runs, the **Green Room** spends banked coins on lifeline slots, refills, or a
tip from an insider ("Shady Steve"). Underneath is a spaced-repetition engine — the game is a
study tool disguised as a game show.

### 3.2 Architecture
Two layers over one canvas, joined by an event bus:
- **The quiz is always real DOM** (question card, A–F options, HUD/ladder), layered over a GL
  canvas — question text is **never** rendered in GL. This is the key accessibility decision.
- **A persistent 3D broadcast studio** (Three.js r160, vendored) is a cosmetic backdrop built
  once; scenes are camera moves + lighting swaps, not rebuilds. If WebGL is absent (or skipped
  for tests) a **CSS-only studio** reacts to the same events and the game plays identically.
- **The event bus** (`src/core/eventBus.js`) is the only coupling: the pure run controller
  emits, the studio/audio/HUD subscribe. Unknown events are no-ops (forward-compatible).
- The core (`src/core/`) is pure and headless (no DOM/WebGL/IO), fully unit-tested in Node;
  the shell (`src/shell/`) wires it to the browser. One RAF, plain-JS modules, no bundler.

### 3.3 Locked game-design decisions
- **Difficulty = personal mastery, not fixed labels.** A question's tier derives from the
  player's Leitner box; authored difficulty is only the cold-start seed. Correct (unaided)
  answers promote and eventually graduate a question out; misses demote. Graduated questions
  occasionally resurface (`RESURFACE_CHANCE = 0.12`).
- **Safety nets:** coins bank at safe havens (`BANK_BOUNDARIES = [4,9,16,24]`, i.e. after
  Q5/Q10/Q17/Q25 on the classic ladder; short banks scale these positions via the active
  ladder profile) and can't be lost; die mid-tier → drop to the last banked amount.
- **Seed:** a shown seed deterministically drives selection from the *authored* pools
  (ignoring mastery), so `?seed=NTNX-XXXXXX` reproduces the same run for anyone;
  seeded runs still feed mastery.
- **Double-buffered set generation:** always a ready `current` and `next`; the set two ahead
  is built from mastery after the current is played — this is what lets Steve's clue reference
  a real, guaranteed-upcoming question.
- **Lifelines** (start 3, one use each; buy a 2nd slot per type, cap 2): **50:50** (removes up
  to 2 distractors, never the key), **Ask the Audience** (a *fallible* poll — usually right,
  can be wrong on hard questions), **Phone a Friend** (a ~10 s cutscene, **68% correct / 32%
  wrong**). **Lifelines advise, never grade** — an assisted-correct answer does not promote
  mastery.
- **Impossible first final:** the first time a player reaches Q30 it's a genuinely obscure real
  question they likely miss; the loss reveals the answer (gated on a persistence flag, not the
  seed).
- **Prestige:** winning resets coins + purchased slots only; **mastery persists**.

### 3.4 Economy
Money ladder: easy +100 (banks 1,000), medium +500 (banks 6,000), hard +2,000 (banks 24,000),
extreme +26,000 → **win = 50,000**. Green Room shop: 2nd lifeline slot 3,000; refill 1,500;
call Steve 4,000.

### 3.5 Audio & persistence
All audio synthesized at runtime (WebAudio, original compositions, 4 style arrangements). Save
in `localStorage` key `wwtbane.save.v1` with `migrate()` normalization, export/import, prestige,
and `resetAll()`.

### 3.6 Key files
`src/core/` — `config.js` (all constants), `rng.js`, `questionSchema.js`, `mastery.js`
(Leitner), `selection.js` (buildSet + SetManager double-buffer + priority), `coins.js`,
`lifelines.js`, `runController.js` (run state machine), `eventBus.js`, `aiAdapter.js` (no-op).
`src/content/` — `questions.js` (generated bank), `parseMarkdownBank.js` /
`parseInterchangeBank.js` (two authoring formats), `quarantine.js`, `images/`.
`src/shell/` — `main.js` (Game class + boot + wiring), `studio.js` / `director.js` / `takes.js`
(WebGL studio + camera), `backdrop.js` (CSS fallback), `music.js` / `audio.js`, `persistence.js`,
`ui/` (overlay, screens, hud, cinematic, steveCutscene). `scripts/import-questions.mjs` (bank
importer). `vendor/` (Three.js r160 + Montserrat). `tests/` (unit + smoke + e2e).

---

## 4. StarNix

### 4.1 What it is
A single-file study game. A cinematic shell wraps **three arcade sub-games** — all teaching the
same shared question bank through one spaced-retrieval (Leitner) engine. The fiction: you are
the NX-SRC (Nutanix Starlight Rescue Crew) recovering "knowledge cores" from the shattered MCI
Station. The games are different "skins" over one loop: *see a question → answer → the answer
feeds the mastery scheduler*.

> **The Interrogation Test was removed.** StarNix formerly included a practice-exam module
> ("NIT — Nutanix Interrogation Test", study/sim/blitz). Per the consolidation decision it was
> **removed entirely** from StarNix and rebuilt as the standalone **Nutanix Practice Exams**
> tool (§5). StarNix now = the three games + shared bank + in-game mastery, plus its rank/XP,
> daily missions, station meter, and Codex/Progress dashboard.

### 4.2 The learning core (the most reusable asset)
Everything a study tool cares about lives in `starnix-core.js` — UI-free, deterministic,
localStorage-backed:
- **Modified Leitner spaced retrieval.** Per question: `{seen, correct, incorrect, streak,
  bucket, lastSeen, …}`. Buckets 0–8 with review intervals `[0, 30s, 2m, 10m, 1h, 6h, 24h,
  3d, 7d]`; `MASTERED_BUCKET = 4`. **Classic-Leitner gate:** a correct answer only promotes if
  the card was actually *due* (cramming the same card across games in one sitting can't mint
  "mastered"); wrong always demotes one rung.
- **The single choke point: `mastery.record(id, correct, ctx)`.** All surfaces route every
  graded answer through this one function — so XP, streaks, achievements, daily missions,
  telemetry, the station meter, and pace stats are wired **once**, not per surface. This is the
  key architectural lesson.
- **Selection/scheduling:** `makeQuestionProvider` weights by state (`due 6 / new 3 / reinforce
  1`), with a **priority** multiplier (the 25-question "a6" pack carries `priority: 2`) and an
  inert `setDomainWeights` seam (blueprint weights are quarantined `null` — see §6).
- **Study signals already built:** per-question pace aggregates (EMA of latency + timer-used →
  "slow but correct"), a **readiness composite** vs the 80% pass mark, a **miss pile**, a
  **weakest-questions** drill, domain-targeted study, per-question **notes**, and a dev-gated
  **tuning** override of scheduler constants.
- **The Codex / Progress dashboard** (`Shell.showStats`) surfaces all of it: per-domain mastery
  heatmap, readiness + sim-trend, achievements, and drill launchers. It's pure read-out over
  the mastery/qstats data, so it ports wherever that data goes.

### 4.3 The three games
All implement `StarNix.registerGame({ id, mount(root, ctx), unmount() })` and clean up fully in
`unmount()`. The `ctx` hands each game a scheduler, seeded RNG, persistence, audio, theme, and a
no-op AI seam; games never touch `localStorage` directly.
- **ARM — Acropolis Rescue Mission** (`arm.js`, 2D flight, Canvas): fly through sectors
  recovering cores; each core opens a question. Hangar upgrades, a Depot, and Vega's briefings.
- **KBB — Kuiper Belt Battle** (`kbb.js`, roguelike, Canvas): turn-based battles where a correct
  answer powers your action; artifact combos, surge turns, a between-run hangar, a Flagship boss.
- **CC — Chasm Chase** (`cc.js`, 3D endless runner, Three.js r128 vendored): dodge a canyon;
  gates open questions; distance-keyed biomes and a Garage economy.
The **mastery profile is shared** across all three.

### 4.4 Meta-progression
One `localStorage` profile (migrate-repaired): mastery store, cross-game XP + Commander ranks
(10 ranks paying concrete rewards), achievements, cosmetic ship trails, daily missions (3
date-seeded/day from 7 templates), study-day streaks, the station meter (0–60, mastery-fed),
per-question notes, and per-question pace stats. All fed from the record choke point.

### 4.5 Build & architecture
`build.mjs` concatenates the module files (`core → questions → assets → shell → audio → arm →
cc → kbb → boot`) into a single `index.html`, inlining vendored Three.js + font + referenced
exhibit images. **Edit the module `.js` files, never `index.html`** (it's generated). One
`localStorageProvider` is the only module that touches storage (last-known-good backup,
debounced writes, `update(fn)` for concurrent writers). Reduced motion is a
`data-motion=reduced` attribute driving CSS twins; high contrast is `data-contrast=high`.

### 4.6 Key files
`starnix-core.js` (engine + meta + contract), `questions.js` (compiled bank),
`starnix_questions.md` + `banks/*.md` (question sources), `import-questions.mjs` (compiler +
`--check`), `arm.js` / `kbb.js` / `cc.js`, `starnix-shell.js` (menu/screens/Codex), `audio.js`
(synth), `assets.js` (inlined art), `build.mjs`, and the harnesses (`bank-lint.mjs`,
`scheduler-test.mjs`, `multi-answer-test.mjs`, `shuffle-test.mjs`, `timer-test.mjs`, the
`*-run.cjs` game engines, `verify-build.mjs`).

---

## 5. Nutanix Practice Exams (the new module)

Built from StarNix's former Interrogation Test — the **255-question NCP-MCI bank ported
verbatim** plus the exam engine's grading/shuffle logic — as a clean, standalone static module
in the NST design system.

- **Practice Mode** — instant per-question feedback (correct answer + explanation revealed,
  per-option rationale), unlimited retries, free navigation (prev/next/jump palette), running
  score, untimed.
- **Exam Mode** — timed **90-minute** countdown (amber when low, auto-submit at zero),
  randomized question **and** option order, flag-for-review, question palette, **no feedback
  until submit**, **80% pass/fail**, then a results screen + full per-question review.
- **Single-source config** (`practice-exams/config.js`): `PASS_THRESHOLD = 0.80`,
  `EXAM_QUESTION_COUNT = 75`, `EXAM_TIME_LIMIT_MIN = 90`, shuffle flags. Exhibits ported;
  attempt history persisted to `localStorage` (`nst.practice-exams.history.v1`).
- **Files:** `config.js`, `engine.js` (bank normalization + grading + shuffle + scoring),
  `ui.js` (shared DOM + accessible option states), `practice-mode.js`, `exam-mode.js`,
  `results.js`, `styles.css`, `data/` (the bank + exhibit images).

---

## 6. The question banks & content pipeline

Both apps use a human-authorable Markdown authoring format compiled to a runtime `questions.js`,
with a `*-review.md` quarantine convention and a `--check` drift guard. Each question carries a
`cert` field, so scaling to more certs just means more banks.

- **WWTBANE bank:** 233 questions across 12 domains (157 AI-drafted + verified, 25 owner
  "priority" set, 51 owner "Exam 1" interchange set), 6 exhibit images. Two formats (native
  `## Q` blocks; interchange `### id` blocks) auto-detected by `scripts/import-questions.mjs`.
- **StarNix / Practice Exams bank:** 255 questions across 9 domains (32 multi-answer, 27
  exhibits, 25 priority "a6"). Interchange format in `banks/*.md`; `import-questions.mjs`
  compiles `questions.js`. This bank is the source for **Nutanix Practice Exams**.

**Content integrity (§2) is paramount:** keys come only from authored data; ambiguous items are
quarantined; AI is never authoritative; blueprint (domain) weights ship inert `null` because the
official NCP-MCI blueprint publishes no section weights (a ratification packet awaits sign-off).
IDs are stable so mastery records survive re-imports.

---

## 7. NST-wide systems

- **Preferences (`shared/nst-prefs.js`).** A single `localStorage` key (`nst.prefs`) holds
  NST-wide settings honored across all tools. The launcher + Practice Exams apply them via root
  classes (`.nst-reduced-motion` / `.nst-high-contrast` / `.nst-larger-text`); WWTBANE and
  StarNix read `nst.prefs` at boot and map it onto their own settings (reduced motion, high
  contrast, audio mute/volume, dev flag).
- **Settings panel** (launcher nav gear, `scripts/nst-home.js`): Accessibility (reduced motion,
  high contrast, larger text), Audio (master mute + volume, applies to the games), Developer
  Mode (build info + diagnostics), and Reset saved data (clears `nst.*`, `starnix:*`, and
  `wwtbane.*` keys with a confirm).
- **Navigation:** each game's title screen has a "← Main menu" link back to the launcher; the
  launcher cards link into each tool.

---

## 8. Testing & CI

- **CI** (`.github/workflows/ci.yml`, on push/PR) runs each tool's dependency-free checks:
  WWTBANE's unit tests (`node --test tests/*.test.mjs`) and StarNix's build + pure logic
  harnesses (`build.mjs`, `bank-lint`, `scheduler-test`, `multi-answer-test`, `shuffle-test`,
  `timer-test`).
- **WWTBANE** additionally has a Playwright smoke test and a 22-check e2e (browser tests
  self-skip if Playwright/Chromium is absent). **StarNix** has a broader local gate
  (`npm run check`) covering the game engines and, opt-in, a headless-Chromium perf smoke.
- **Discipline to keep:** negative controls on every test pin; "headless GREEN proves structure,
  not looks/sound" (visual/audio needs a human pass); adversarial review for nontrivial changes.

---

## 9. Open items (inherited backlog)

**Content (needs a human ruling):**
- WWTBANE: 9 quarantined interchange questions (8 choose-two candidates; q48 malformed; **q51
  has a contradictory source key** — needs a ruling, not an auto-flip); final human review of
  the 157 AI-drafted keys; owner-set domain/difficulty tags are ingestion guesses pending
  confirmation; Steve clues missing for all 76 owner questions.
- StarNix: a few quarantined/ambiguous keys documented in their review files.
- Blueprint (domain) weights remain quarantined `null` pending official evidence.

**Platform/QA:**
- On-hardware visual/FPS/audio sign-off of the WebGL surfaces (both apps have a browser-blind
  QA debt).
- WWTBANE forward-work items: audience-poll math on multi-answer questions, WebGL context-loss
  handling, save-corruption fuzzing, an a11y CI audit, a post-run recap, a lifetime-stats
  Progress screen, optional PWA/offline.
- StarNix: optional cross-device sync (was blocked on Apps Script credentials); exhibit image
  format decision.

---

## 10. Provenance

NST was assembled by importing `holyscotsman/WWTBANE` and `holyscotsman/StarNix` via `git
subtree` (full history preserved), building the launcher and the Practice Exams module, removing
the Interrogation Test from StarNix, and adding the NST-wide Settings/preferences layer. The two
source repos are archived; this document consolidates their handoffs. For deep detail on any
subsystem, the authoritative source is the code itself — WWTBANE's `src/core/` and StarNix's
`starnix-core.js` are the best starting points.
