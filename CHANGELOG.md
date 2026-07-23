# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

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
