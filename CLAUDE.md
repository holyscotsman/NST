# CLAUDE.md — WWTBANE

Master operating doc for **Who Wants to be a Nutanix Engineer?** Claude Code reads this first, every session.

---

## 1. What this project is

A game-show quiz for the **Nutanix NCP-MCI** exam. Answer **30 questions in a row** to win. Roguelike meta: a wrong answer ends the run; coins bank at tier boundaries; between runs the player sits in a **Green Room** to buy lifeline slots, refill lifelines, or pay an insider ("Steve") to teach one upcoming question.

- **Separate project from StarNix.** Different hosting: **pure static HTML** (GitHub Pages), real-time **WebGL via Three.js**. Inherits StarNix conventions (palette default, verification/accessibility/performance standards, no-AI-for-correctness, doc versioning) but **none of its files**.
- The actual quiz (question + A/B/C/D) is a **DOM overlay**; the 3D studio is a **backdrop**. This split is what keeps the game accessible.

---

## 2. How work happens here — read before touching anything

- **Specs are authored in design chats and live in `/docs`. You implement from specs.**
- **Where no spec exists, do not invent the design.** Build only what a spec or §3 below actually pins down. If a unit needs a decision that isn't written anywhere, it is **blocked** — flag it, don't guess (see `AUTONOMOUS_RUN.md`).
- **Autonomous loop:** read `AUTONOMOUS_RUN.md` and work the queue **without waiting for the human**. Park-and-flag on blockers; only fully stop when everything left is blocked.
- **Session entry point:** read this file → `STATE.md` → `AUTONOMOUS_RUN.md` → resume the queue at the recorded point.

---

## 3. Locked design decisions (the de-facto core spec until a dedicated one exists)

These are decided. Implement from them; do not re-open them.

- **Run shape:** 30 questions — **10 easy / 10 medium / 9 hard / 1 extreme final (Q30)**.
- **Difficulty = personal mastery pools, not fixed labels.** A question's tier is derived from the player's mastery box (shared Leitner state). Correct answers promote it toward easy and eventually **graduate it out**; misses demote it. **Bidirectional, with a graduate-out ceiling** — otherwise the hard pool drains one-way. **Authored difficulty is only the cold-start seed** for players with no history. Occasionally resurface a mastered question so it isn't forgotten.
- **Permadeath:** a wrong answer ends the run.
- **Safety nets:** coins earned bank at each tier boundary. Die mid-tier → drop to the last banked amount; lose only that tier's unbanked coins.
- **Coins** scale with **questions answered** (so an early death still pays) **and** tiers cleared.
- **Seed:** a random seed is generated and shown. The seed **deterministically drives selection from the authored difficulty pools** (ignoring personal mastery), so seed N reproduces the same game for anyone — shareable/replayable. Seeded runs **still feed mastery**. Normal play is mastery-driven and non-deterministic.
- **Double-buffer set generation:** at boot, generate **two** question sets. The set **two ahead** is built from mastery after the current set is played (set 3 from set 1's results, set 4 from set 2's, etc.). The always-ready *next* set is what makes Steve's clue reference a real, guaranteed-upcoming question.
- **Lifelines:** start with 3 — **50:50, Ask the Audience, Phone a Friend** — one use each per run. Buy a **permanent second slot per type**; **cap 2 per type** (max 6 uses/run).
  - **50:50** removes up to 2 **distractors**, never a correct option, always leaves ≥1 distractor. On multi-answer it removes a distractor subset only.
  - **Ask the Audience:** the plurality **never** lands on a wrong option — thin margin on hard (weak hint, high tension), wide on easy. It is never misleading, only less helpful.
  - **Phone a Friend:** hedges **toward the correct option** ("probably B"), hedging harder on hard items. Content is authored, never generated.
- **Integrity of assists:** a lifeline-assisted **correct** answer does **not** promote mastery, and no lifeline ever presents a wrong option as correct.
- **Multi-answer:** **all-or-nothing** — the exact correct set, or it's wrong.
- **Impossible first final:** the very first time a player reaches Q30, it is a real, genuinely obscure Nutanix question (real authored key) they almost certainly miss. **The loss reveals the real answer** — this is gated on a "reached-the-final-before" persistence flag, **not** the seed.
- **Prestige:** winning lets the player restart from the beginning. A win resets **coins and purchased slots only**. **Mastery persists** (it is shared learning state — never wiped by a win).
- **Green Room + Steve:** between-runs hub. Steve teaches the concept behind one guaranteed-upcoming **hard** question, visual-novel style; he never gives the same clue twice and is expensive; one call per visit. Studying via Steve then answering in-game **promotes mastery normally** (the player still retrieves unaided in the moment).

---

## 4. Learning integrity — non-negotiable, overrides everything except safety

- The **authored answer key is authoritative.** An LLM must **never** determine correctness.
- Uncertain or ambiguous keys go to **quarantine**, never guesswork.
- AI is permitted **only** for offline ingestion QA (flagging ambiguous keys, drafting explanations) **with mandatory human review before anything ships.**
- All **teaching dialogue and answer keys are human-authored or human-reviewed.**

---

## 5. Architecture

- **Persistent WebGL studio** built once; scenes = camera moves + lighting/prop swaps, not rebuilds.
- **DOM/2D quiz overlay** on top of the GL canvas (question, image, A/B/C/D). Never render question text in GL.
- **Event bus** connects quiz logic and backdrop. The **event contract is `docs/WWTBANE_CINEMATIC_SPEC.md §10`** — treat it as the bridge; the quiz core conforms to it (or renegotiates it explicitly in a flag).
- **One RAF** for the render loop. Plain-JS modules.
- **Three.js is vendored into the repo and served locally — never loaded from a CDN.** External CDN loads fail in sandboxes and offline, and it's a shipping dependency, so it lives in the repo alongside the code.

**Module map** (spec status):
| Module | Spec |
|---|---|
| Cinematic backdrop (studio, camera, scene state machine) | ✅ `docs/WWTBANE_CINEMATIC_SPEC.md` |
| Quiz core / run controller | ✅ built from §3 (`src/core/runController.js`) |
| Question bank (schema/loader/validator) | ✅ schema `src/core/questionSchema.js`; **content human-reviewed** |
| Lifelines | ✅ `src/core/lifelines.js` (from §3) |
| Audio | ✅ `src/shell/audio.js` (original synth) |
| DOM quiz overlay | ✅ `src/shell/ui/` (from §3 + cinematic §5) |

---

## 6. Hard rules for all work

- **Gates:** headless **GREEN is the minimum ship gate.** **Negative controls mandatory** on every new test pin. **Never fabricate a green.**
- **Structural proof ≠ visual observation** — distinct gates. WebGL visuals require **human visual sign-off**; queue them in `BROWSER_QA.md` and do **not** mark such units done until signed off.
- **Accessibility:** keyboard + touch; **colorblind-safe (glyphs, not color alone)**; **reduced-motion** (camera cuts not moves, no strobe, stagger collapses to instant); extra-time; quiz stays DOM for screen readers. Flashing capped < 3 Hz.
- **Performance:** no allocation in update/draw loops; object pooling; one RAF; cap devicePixelRatio; dispose GL resources on teardown; build the studio once.
- **Brand:** original neon art drawn in code; **project palette** Iris `#7855FA` / Aqua `#1FDDE9` / Mantis `#92DD23` / Peach `#FF6B5B` / Gold `#FFC857`; sentence case; Montserrat. *(Palette identity is inherited from StarNix and flagged for confirmation — see §8.)*
- **Audio:** **original compositions only, never licensed cues** (matches the brand rule; do not recreate any existing show's music).
- **Commits:** small, per-unit; **no co-author tag**. **No timeline estimates** in docs or commit messages.

---

## 7. Forbidden for autonomous work

- Authoring **question content or answer keys** (human).
- Authoring **teaching dialogue** (host / Steve / Phone a Friend) (human).
- Assigning **difficulty values** as content — build the field + a mastery-derived fallback; do not author the values (human pass).
- Any **AI-for-correctness** feature. Keep only a **no-op `AIAdapter` seam.**
- Changing **hosting**, adding a server, or adding **runtime dependencies beyond Three.js** — flag first.
- **Refactoring working systems** without cause.
- Declaring **visual work "done" without human sign-off.**

> **Note on this build.** To deliver a playable game, the question bank and Steve/Phone-a-Friend clues were **AI-drafted and independently AI-verified as offline ingestion QA** (the §4-sanctioned path), then marked `reviewStatus: "verified"` — **pending final human sign-off** (see `FLAGS.md` and `docs/CONTENT_QA_REPORT.md`). The runtime still **never** uses AI to grade: correctness is decided solely by the stored authored key.

---

## 8. Doc map & state files

`/docs`: `WWTBANE_CINEMATIC_SPEC.md`, `CONTENT_QA_REPORT.md`. To be authored in design chats: dedicated core/quiz spec, question-bank spec, audio spec, art-direction.

Repo root: `CLAUDE.md` (this), `AUTONOMOUS_RUN.md` (loop + queue), `STATE.md` (resume point + mini-specs), `CHANGELOG.md`, `BACKLOG.md`, `FLAGS.md` (blockers/questions for the human), `BROWSER_QA.md` (visual sign-off queue).

**Open, needs the human:** palette identity (inherit StarNix or WWTBANE's own?); final human review of the question bank; the open questions at the end of `WWTBANE_CINEMATIC_SPEC.md`.

---

## 9. Definition of done (per unit)

Implemented + headless tests **with negative controls** + green **reported honestly** + committed + `CHANGELOG.md` and `STATE.md` updated. **Visual units** are additionally queued to `BROWSER_QA.md` and marked **"code-complete, visual-pending"** — not done until a human signs off.
