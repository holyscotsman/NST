# Optimization Cycle 07 — plan (target: v1.8.0)

Self-sourced from implementation knowledge (the survey backlog is exhausted);
every premise verified by grep/code-read before selection. Inline review.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C7-01 | ww | Guard an active run against accidental refresh/close | S/low |
| C7-02 | pe-practice | Full-bank Practice resumes at your last position | M/low |
| C7-03 | pe-exam | Results: click a domain row to filter the review list | M/low |
| C7-04 | pe | Palette chips expose aria-current | S/low |
| C7-05 | cc | How-to card starts on Enter/Space | S/low |
| C7-06 | pe | Clear attempt history control | S/low |
| C7-07 | pe | Print stylesheet for the results report | S/low |
| C7-08 | kbb | Battle panel advertises number-key answering | S/low |
| C7-09 | ww | Help documents the new interactions | S/low |
| C7-10 | sx-shell | Copy button for the profile export | S/low |

## Instructions

### C7-01 — Guard an active run against accidental refresh/close

**Surface:** ww · **Files:** wwtbane/src/shell/main.js · **Effort/Risk:** S/low

No beforeunload exists in wwtbane/src/shell/main.js (grep: 0) — a reflexive F5 mid-run silently ends the climb (the run is memory-only; only banked coins survive). Register the guard while screen === "quiz" and the run is alive; drop it on run end, green room, title, and win.

*Why:* A 25-questions-deep run can no longer be lost to one reflex.

### C7-02 — Full-bank Practice resumes at your last position

**Surface:** pe-practice · **Files:** practice-exams/practice-mode.js, practice-exams/app.js · **Effort/Risk:** M/low

Practice in full-bank mode is a stable authored-order study view, but it always restarts at Q1 — a 255-question grind loses your place on every visit. Persist {bank, idx} in the PE prefs on navigation and restore it silently when re-entering full-bank practice on the same bank (random subsets stay fresh).

*Why:* Long study sessions pick up where they left off.

### C7-03 — Results: click a domain row to filter the review list

**Surface:** pe-exam · **Files:** practice-exams/results.js, practice-exams/ui.js, practice-exams/styles.css · **Effort/Risk:** M/low

The per-domain breakdown rows are inert display; the review list has only the incorrect-only filter. Make each row a button that toggles filtering the review list to that domain (aria-pressed, combinable with the wrong-only toggle).

*Why:* "I bombed storage" becomes one click to study exactly that.

### C7-04 — Palette chips expose aria-current

**Surface:** pe · **Files:** practice-exams/practice-mode.js, practice-exams/exam-mode.js · **Effort/Risk:** S/low

Neither mode marks the current chip for AT (grep aria-current: 0) — the "current" state is visual-only. Set aria-current="true" on the active chip in both updatePalette() functions.

*Why:* SR users know which question they are on from the strip.

### C7-05 — How-to card starts on Enter/Space

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

The how-to overlay is dismissed only by its clickable start control — keyboard users are stuck behind it. Let Enter/Space (and Escape) trigger the same start path while the card is up.

*Why:* Keyboard players are not blocked at the door of the game.

### C7-06 — Clear attempt history control

**Surface:** pe · **Files:** practice-exams/engine.js, practice-exams/app.js · **Effort/Risk:** S/low

Recent attempts accumulate forever with no way to clear them (privacy on shared machines; grep clearHistory: 0). Add engine.clearHistory() and a small "Clear history" button on the entry screen behind the shared confirm dialog.

*Why:* Shared-machine users can wipe their scores.

### C7-07 — Print stylesheet for the results report

**Surface:** pe · **Files:** practice-exams/styles.css · **Effort/Risk:** S/low

No @media print rules exist — printing results wastes pages on nav chrome, buttons, and dark backgrounds. Add print rules: hide actions/palette/chrome, light background, readable review list.

*Why:* The results page becomes a printable study report.

### C7-08 — Battle panel advertises number-key answering

**Surface:** kbb · **Files:** starnix/kbb.js · **Effort/Risk:** S/low

KBB accepts 1-9 (with multi toggling since C1-06) but nothing tells the player — options show "1." prefixes with no hint keys work. Add a subtle kbd hint line under the actions row, like PE's.

*Why:* A hidden input method becomes discoverable.

### C7-09 — Help documents the new interactions

**Surface:** ww · **Files:** wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

The in-game help predates the cycle work: the tap-to-skip read-out (C3-07) and exhibit lightbox (C6-02) are undocumented. Add one help line covering both.

*Why:* The help screen stays truthful about how the game plays.

### C7-10 — Copy button for the profile export

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

The export flow fills a textarea the user must manually select-all + copy. Add a Copy button (navigator.clipboard with execCommand fallback) with a "Copied ✓" confirmation.

*Why:* Progress backup becomes one click.

## Review verdicts

Inline adversarial review: premises verified by grep/code-read at selection
time (beforeunload absent in main.js; aria-current absent in both modes; no
@media print; no clearHistory; music-style select is native — a prior
candidate was DROPPED because its premise failed: the launcher card hover
already guards reduced motion at styles/nst-home.css:535). **All 10: PASS.**


## QA record

- Implementation note (C7-02): the entry screen passed `count = meta.total`
  for the full bank, so the `!opts.count` resumable guard never held — caught
  by the targeted browser check; the practice launch now passes `null` for
  the full bank (the built pool is identical either way).
- StarNix build 4266.2 KB (gate 4600); bank-lint / scheduler / multi-answer /
  shuffle / timer harnesses all green.
- WWTBANE: 168 unit tests (incl. docs claims over the new Help line) + 22/22
  browser E2E.
- Practice Exams engine harness green.
- Targeted verification `c7-verify.mjs`: 14/14 (resume, aria-current, domain
  filter 5→2→2→5, clear-history, print block, beforeunload guard, help line,
  bundle wiring for C7-05/08/10).
- Full-site sweep: zero console errors, zero failed requests.

**Result: 10/10 shipped, no reverts.**
