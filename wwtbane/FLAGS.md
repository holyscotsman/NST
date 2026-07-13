# FLAGS.md — blockers & questions for the human

Things the autonomous loop **cannot** decide. Nothing here blocks a playable
ship, but each wants a human before it's "done" per `CLAUDE.md`.

## 0. Exam2 interchange bank — 9 quarantined questions need owner decisions
- **Imported:** 51 questions from `docs/interchange/e1.md` (owner-supplied,
  transcribed verbatim from the source exam) are live in the bank, with 6
  exhibit images. Keys are the exam's own — no decision needed there.
- **Waiting on the owner** (`docs/interchange/e1-review.md`; the parser refuses
  these until the flags are removed):
  - **8 choose-two questions** (q13, q17, q27, q48, q50, q54, q57, q60): the
    review file was written for a single-answer schema, but **WWTBANE supports
    multi-answer natively** (all-or-nothing grading). Say the word and they
    import as `type: multi` unchanged. q48 is also flagged malformed in the
    source (bundles two independent facts); recommend splitting — a content
    decision only you can make.
  - **q51 — contradictory source key**: three of four signals (the per-option
    explanations and the overall explanation) indicate the intended answer is
    "Migrate vDisks…", but the exam's key marks "Migrate VM…". NOT flipped
    automatically — rule on it and it moves to the live bank.
- Also for a human pass: the interchange `@domain`/`@difficulty` tags were
  authored during transcription (not exam content); the domain map
  (architecture→foundation, vms→ahv) is an ingestion choice — flag if wrong.

## 1. Question bank — owner content arriving; 25 priority questions merged
- **Status:** the owner has supplied **25 of their own questions** (a Nutanix
  practice-exam set). These are merged into the bank as the **priority** set
  (`priority:true`, ids `NPX-*`, `reviewStatus:"human-reviewed"`), source of
  record in `docs/priority-question-bank.md`, merged via
  `node scripts/import-questions.mjs docs/priority-question-bank.md --merge`.
  Mastery-driven runs surface them first until the player graduates them
  (see `docs/CONTENT_QA_REPORT.md` / CHANGELOG). The keys and explanations are
  **owner-authored**, so the §4/§7 key-review concern is satisfied for these 25.
- **Owner confirmation still wanted (these 25):** the **domain and difficulty
  tags** were assigned by ingestion classification, not the owner (they slot
  each question into a tier). Confirm or re-tag: 3 easy / 13 medium / 9 hard,
  across the domains printed by the importer. Difficulty values are
  human-authored content per §7 — this is the only outstanding item for the set.
- **What's left overall:** the remaining **157 questions are still AI-drafted**
  pending review; the owner can keep supplying Markdown to replace/extend them
  (the same `--merge` path adds a set without disturbing the rest).
- **Note:** the **runtime never uses AI to grade** — correctness is decided
  solely by the stored authored key.

## 1b. Steve clue coverage — owner questions have no clues yet
- **What changed:** Steve now only ever sells a question that carries an
  authored `steveClue` and that he hasn't taught before (`peekUpcomingHard`,
  CLAUDE.md §3 "never gives the same clue twice"). The old fallback could
  charge 4,000 coins and render an empty tip.
- **Consequence:** none of the owner-supplied questions (25 NPX priority +
  51 interchange) carry `steveClue`, and the priority boost floods early runs
  with exactly those — so Steve will read "nothing new for you" more often
  until clues exist for them.
- **Needs the human:** Steve clues are teaching dialogue (§7). Say the word
  and drafts can be produced for your review (the `Upgrade_v0.1.1.md` CL-03
  item), or author them yourself in the Markdown sources.

## 2. Host dialogue — intro cinematic, welcome lines, quips (authored content)
- **What:** the first-run cinematic (`src/shell/ui/cinematic.js`) contains host
  dialogue: the studio tour lines and the guided tutorial that walks the player
  through the UI and reveals the first question's answer. The welcome-back
  lines (including the snarky set), per-question quips, and the
  safe-haven / tier-crossing congrats beats (`BANK_LINES`, `TIER_LINES`) in
  `src/shell/hostLines.js`, plus Steve's split-screen call bookends
  (`STEVE_OPENER` / `STEVE_CLOSER` in `src/shell/ui/steveCutscene.js` — the
  opener/sign-off only; the middle three bubbles are the authored `q.steveClue`
  split for pacing, not new copy), are the same category — game-mechanics
  banter, AI-drafted at the owner's explicit request, awaiting a human read.
- **Why flagged:** `CLAUDE.md §7` reserves host dialogue for a human. These
  lines were AI-drafted at the owner's explicit request ("the host explains how
  to play") — they are game-mechanics narration, not exam teaching — but still
  warrant a human read-through for voice and tone.
- **Also in this bucket:** the corrected Help-screen copy (lifeline accuracy +
  the new keyboard bullet) and the reworked README lifeline/safe-haven wording
  — mechanics documentation aligned to `docs/LIFELINES.md`, awaiting the same
  human read (kept honest by the `tests/docs.test.mjs` drift gate).
- **Integrity note:** the tutorial's revealed answer marks Q1 as assisted, so
  the freebie never promotes mastery.

## 3. Palette identity (inherited, unconfirmed)
- The Iris/Aqua/Mantis/Peach/Gold palette is inherited from StarNix and used
  throughout. `CLAUDE.md §6/§8` flag it for confirmation: keep it, or define
  WWTBANE's own identity?

## 4. Studio visual sign-off
- The WebGL studio is **code-complete, visual-pending**. It passes structural
  and interaction tests but needs a human's eyes. Tracked in `BROWSER_QA.md`.

## 5. Exam version scope
- Content targets **AOS 6.x / Prism / AHV** (broad NCP-MCI). If you want to pin a
  specific exam blueprint version, say which and the bank can be curated to it.

## 6. Character models — code-built upgrade shipped; imports need a rules change
- The owner asked twice about using "a 3D digital asset" for the people. The
  shipped answer: **proportioned capsule-built people** (skin/hair/clothes/
  faces, posable arms, readable hot seats) drawn in code — because the brand
  rule is original art in code, imported model files carry licensing risk,
  and a static Pages site should stay lean. If the owner still wants imported
  GLB/FBX assets after seeing these, that is an explicit change to the
  CLAUDE.md §6 brand rule and needs their sign-off (plus a vetted-license
  asset source) first.

## 7. Easy-tier difficulty calibration
- The owner asked whether the easy round is easy enough, and whether the
  questions were owner-supplied. They were **not** — the owner never provided
  questions; the whole bank is AI-drafted pending human review (flag #1).
  The authored `easy` labels are cold-start seeds only; if the owner wants a
  gentler on-ramp, a human pass should re-grade the easy pool (or supply
  replacement questions) — difficulty values are human-authored content per
  `CLAUDE.md §7`.

## Resolved
- _none yet._
