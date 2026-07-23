# Optimization Cycle 08 — plan (v1.9.0, final cycle)

Ten improvements, selected by inline discovery with every premise verified
against the code before selection. The capstone theme: **say what's true**
(copy that matches the product), **close the loop** (misses become the next
study session), and **guard the future** (a release-consistency check in CI).

### C8-01 — The launcher's StarNix card describes a product that doesn't exist

**Surface:** launcher · **Files:** index.html · **Effort/Risk:** S/low

The card reads "Study guides and reference material to build a solid
foundation" with a STUDY tag and an "Open" CTA. StarNix is three arcade games
driven by spaced retrieval — the launcher's own Help dialog says exactly that
(scripts/nst-home.js:441). Fix the description (full + short), the tag
(STUDY → ARCADE), and the CTA (Open → Play).

*Why:* The first thing a new user reads should not be wrong.

### C8-02 — Resumed practice sessions say so, and offer a way out

**Surface:** pe · **Files:** practice-exams/practice-mode.js, styles.css · **Effort/Risk:** S/low

C7-02 resumes full-bank practice at the saved question — silently. Opening at
"Question 14 of 255" with no explanation looks like a bug. Show a dismissible
strip when a session resumes: "Resumed where you left off · Start over" —
Start over clears the saved position and returns to question 1.

*Why:* An invisible convenience reads as a glitch; a labeled one builds trust.

### C8-03 — The keyboard hint's letter range follows the loaded questions

**Surface:** pe · **Files:** practice-exams/practice-mode.js, exam-mode.js · **Effort/Risk:** S/low

Both mode bars hardcode "A–D select", but the key handler accepts a–j/1–9 and
the shipped full bank has two 5-option questions — key E works there and
nothing says so. Compute the set's max option count once and render the true
range (A–D / A–E).

*Why:* A hint that is sometimes wrong teaches users to distrust all hints.

### C8-04 — The WWTBANE Help names the classic safe havens on every ladder

**Surface:** ww · **Files:** wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

The havens rule hardcodes "Q5, Q10, Q17 and Q25" while the run-length rule is
already dynamic. On the scaled ladder (10–29-question banks, e.g. the bundled
25-question set) the real havens sit elsewhere. Render them from
`activeLadder().bankBoundaries` (0-based → Q numbers).

*Why:* Help that is wrong for a bundled bank is worse than no help.

### C8-05 — A release-consistency guard in CI

**Surface:** infra · **Files:** scripts/version-check.mjs (new), .github/workflows/ci.yml · **Effort/Risk:** S/low

Nothing checks that `shared/nst-version.js` and the CHANGELOG's top entry
move together — cycle 3 shipped exactly that drift (caught by hand). Add a
20-line node script asserting the CHANGELOG's first `## vX.Y.Z` equals
`NST_VERSION`, run as a CI step.

*Why:* The loop's own release hygiene, made mechanical before the loop ends.

### C8-06 — Exam results: practice the questions you missed

**Surface:** pe · **Files:** practice-exams/practice-mode.js, results.js, exam-mode.js · **Effort/Risk:** M/medium

The results screen names the weakest domain but offers no direct action on
the misses. Add "Practice the N you missed" to the results actions: launches
Practice Mode seeded with exactly the missed questions (practice-mode gains
an `opts.questions` override; such sessions are never resumable).

*Why:* The highest-value study set a learner has is the list of questions
they just got wrong — one click should get them there.

### C8-07 — README lists what actually ships

**Surface:** docs · **Files:** README.md · **Effort/Risk:** S/low

"Bundled: a 255-question NCP-MCI bank" — the 25-question set
(banks/ncp-mci-25) has shipped since the scaled-ladder work and is the reason
WWTBANE plays short banks. List both bundled banks.

*Why:* The repo's front page should match the /banks directory.

### C8-08 — Results name the bank they were earned on

**Surface:** pe · **Files:** practice-exams/results.js · **Effort/Risk:** S/low

History rows show the bank (C4-03) because a pass on 25 questions is a
different claim than one on 255 — but the results screen itself never says
which bank produced the score. Add the bank name under the outcome header
(it prints on the C7-07 study sheet too, via engine.bankMeta()).

*Why:* The same reasoning that added C4-03, applied one screen earlier.

### C8-09 — The launcher remembers where you were

**Surface:** launcher · **Files:** scripts/nst-home.js, styles/nst-home.css · **Effort/Risk:** S/low

Three identical-weight cards every visit. Store `nst.lastTool` when a card is
clicked; on load, show a small "Last visited" chip on that card. No
reordering, no behavior change — just a landmark.

*Why:* Returning users re-find their tool at a glance.

### C8-10 — A branded 404 page

**Surface:** site · **Files:** 404.html (new) · **Effort/Risk:** S/low

GitHub Pages serves `404.html` for any bad deep link; today that's the stock
GitHub page — a dead end with no way back to the tool. Add a minimal
dark-themed page (self-contained inline styles) linking back to the launcher.

*Why:* Every dead end should point home.

## Review verdicts

Inline adversarial review, premises grep/code-verified at selection time.
Checked and **rejected** as already-covered (recorded so the next reader
doesn't re-litigate them): font preconnects exist (index.html:17); PE number-
key answering exists (practice-mode.js:98); CC pause is owned by the shell's
Escape/⏸ (starnix-shell.js:1580); no `target="_blank"` anywhere → no
noopener gap; bank-text rendering audit clean — every stem/option/explanation
path uses textContent or esc(); the launcher reset-all clears by `^nst\.`
prefix so the C7-02 position key is already covered. **All 10: PASS.**
C8-06 is the only M-effort item; its risk is contained because
`opts.questions` bypasses only the pool-build step and the mode's own state
machine is untouched.

## QA record

- Version guard green (v1.9.0 consistent) and now enforced in CI.
- StarNix build 4266.2 KB (gate 4600); all 5 harnesses green (no StarNix
  source changes this cycle — build re-verified anyway).
- WWTBANE: 168 unit tests (docs-claims suite passes over the dynamic havens
  line) + 22/22 browser E2E.
- Practice Exams engine harness green.
- Targeted verification `c8-verify.mjs`: 13/13 (card copy, ribbon lifecycle,
  404 page, resume note + Start over, A–E hint on the full bank, bank line,
  misses button count/label/payload, opts.questions live start, dynamic
  havens, README banks).
- Full-site sweep: zero console errors, zero failed requests.

**Result: 10/10 shipped, no reverts. This closes the 8-cycle loop.**
