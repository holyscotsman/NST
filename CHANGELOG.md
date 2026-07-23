# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

## v1.4.0 — Optimization Cycle 03 (2026-07-23)

Keyboard reach, focus discipline, and pacing control. All 10 shipped; inline
review verdicts in `docs/optimization/CYCLE-03.md`.

### Fixed
- **Practice Exams:** both question palettes (Practice 255-chip, Exam 75-chip)
  are built once and updated in place — selecting an option no longer rebuilds
  the strip and throws keyboard focus to the page body; the focused option is
  re-focused after the card refresh.
- **StarNix intro:** the finale mission panel was clickable while still
  invisible — a stray center-screen click seconds into the cinematic could
  warp into a game. It is untouchable until its reveal beat.
- **Chasm Chase:** steering keys are swallowed only during the RUN phase now —
  during a question, Space activates the focused button and arrows scroll the
  explanation instead of being eaten by preventDefault.
- **KBB:** the engine's event log (Overcharge, Lazarus Protocol, siphons,
  consumable use) finally renders — a status ticker with aria-live; renderLog
  had guarded on an element nothing ever created.

### Added
- **Practice Exams:** leaving Practice mode with checked answers asks first
  (shared confirm dialog with the exam's Escape/Tab/focus contract);
  zero-progress exits stay instant.
- **ARM:** keyboard answering — digits 1-6 pick (or toggle, on multi-select)
  the matching option and Enter presses Submit while a question panel is up.
- **WWTBANE:** a click/tap on the question card skips the answer read-out
  stagger (up to ~9 s of pacing) and reveals every option at once; after
  green-room purchases, focus stays on the clicked shop control instead of
  jumping to the heading.
- **Launcher + Practice Exams:** Google Fonts load without blocking first
  paint (preload + swap, noscript fallback) — on a slow or blocked network the
  system-font fallback renders immediately.

## v1.3.0 — Optimization Cycle 02 (2026-07-23)

Polish and accessibility from the reviewed survey backlog. All 10 shipped;
review verdicts and instructions in `docs/optimization/CYCLE-02.md`.

### Fixed
- **StarNix:** the pause overlay's Resume and the selected music-genre button
  now have the intended iris styling — the `sx-btn-primary` class had no CSS
  rule anywhere, so they rendered as UA-default gray (high-contrast mode also
  gets its bounding border).
- **WWTBANE:** the win screen no longer says "took home 50,000 coins" directly
  above "0 coins total" — the win row now shows the payout (+ career win
  count); the truthful wallet total stays on the loss path.
- **Chasm Chase:** "Run again" resets milestone/biome banner caches, hides a
  banner stuck on-screen at death, and clears a stale "NEW RECORD" chip (the
  beaten record becomes the new PB bar).
- **WWTBANE:** resizing mid-question re-anchors the money-ladder highlight and
  the mobile strip's scroll — the current rung could sit fully off-screen.
- **Practice Exams:** the exam timer's screen-reader announcement fired every
  second after the first urgency crossing (aria-live on an element rewritten
  per tick); announcements now go through a dedicated live region exactly once
  per crossing.

### Added
- **Practice Exams:** checking an answer in Practice mode announces the verdict
  to screen readers ("Correct." / "Not quite. Correct answer: B"), cleared on
  navigation.
- **WWTBANE:** the multi-answer lock button shows the live selection count
  ("Lock in 2 answers") — multi questions grade all-or-nothing.
- **Launcher:** while "Mute all" is on, the Volume slider and Practice Exams
  sounds rows dim and disable; values are kept for unmute.
- **WWTBANE:** keyboard focus lands on the new question's stem after Continue
  instead of falling to the page body.
- **Practice Exams:** on the last exam question the Next button becomes
  "Review & submit" and opens the submit summary — the forward flow no longer
  dead-ends.

### Test infrastructure
- WWTBANE's browser e2e works under the consolidated repo again: the test
  server now falls back to the repo root for `/shared/` + `/banks/`, and the
  scenarios prime the runtime bank — 22/22 checks pass (previously the suite
  died on the "no bank" guard).

## v1.2.0 — Optimization Cycle 01 (2026-07-23)

Bugs and data-loss hazards from a 60-candidate survey. All 10 shipped;
review verdicts and instructions in `docs/optimization/CYCLE-01.md`.

### Fixed
- **KBB:** pressing a number key on a multi-select ("Choose two") question no
  longer grades it instantly wrong — and no longer throws and soft-locks the
  battle. Digits now toggle options exactly like clicks; the confirm control
  submits.
- **KBB:** four interface rules were rendering with `color: undefined` (the
  palette's `mid` token didn't exist) — stake lines, map nodes, artifact card
  text and the map dock now use a real mid-emphasis tone.
- **Chasm Chase:** switching back to the tab no longer force-resumes a game you
  paused — only the auto-pause taken on tab-hide auto-resumes.
- **ARM:** hiding the tab now freezes the run. Question countdowns are
  wall-clock deadlines and kept draining while hidden, silently costing
  timeouts and shield damage.
- **WWTBANE:** very long questions (with an audience poll up) could push the
  question text off the top of short viewports with no way to reach it — the
  card now scrolls internally.
- **Launcher:** the nav "Help" link was a dead anchor; it now opens a real Help
  dialog (full dialog contract: Escape, focus trap, focus restore) and is no
  longer hidden on tablets.
- **Launcher:** when the bank manifest fails to load, Settings no longer shows
  the misleading "No question banks found" empty state — it shows the real
  error with a working Retry.

### Changed
- **Practice mode:** after checking an answer, Enter advances to the next
  question. It previously re-triggered "Try again" and silently wiped the
  checked answer — including when focus was still on the button just clicked.
- **Launcher:** the "Reset all saved data" confirm now focuses Cancel, so a
  reflexive Enter can't wipe every save on the device.

### Added
- **Exam mode:** an in-progress timed exam now warns before refresh/close
  (browser `beforeunload` guard); the guard drops cleanly on submit and exit.

### QA
Verified: 25-assertion per-change browser QA (all pass), full-site E2E sweep
(zero console errors, zero failed requests), 168 WWTBANE tests, StarNix build
+ 5 harnesses, PE engine harness, security grep of the diff (no new sinks).
