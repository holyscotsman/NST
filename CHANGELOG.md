# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

## v2.1.0 — Sprite integration, WWTBANE studio fixes, launcher branding (2026-07-24)

A user-directed batch: finished the KBB art deferred from v2.0.0, fixed two
visible bugs in WWTBANE's 3D studio, added real Nutanix branding to the
launcher, and rewrote the README for a first-time reader.

### Added
- **StarNix/KBB:** the Shield (Aegis) and Medic (Mender) escort ships now use
  the cinematic art the owner uploaded, trimmed and re-glowed in their
  existing aqua/mantis colors; the 5 asteroid sprites keep their glow-rimmed
  silhouette but the flat fill is now real cratered-rock texture from the
  same upload. The third (fighter-jet) render is held back — its opaque
  background has no clean edge for a cutout.
- **Launcher:** the real Nutanix wordmark (vendored unaltered, previously
  StarNix-only) now appears in the nav as a small logo + "Study Tool" lockup.

### Fixed
- **WWTBANE:** every "arm raised" pose (the player's relief cheer, the
  green-room stage manager's "we're ready!", an audience wave, the host's
  idle gesture) used the wrong rotation sign and swung the hand up through
  the face instead of out beside it — fixed at all 5 sites.
- **WWTBANE:** the glowing circle behind the title wordmark stayed visible
  on every scene (it was never tied to the wordmark's own visibility), sat
  at the same depth as the middle audience tiers, and visually swallowed
  the crowd behind it whenever the title text wasn't showing. Now parented
  to the wordmark (inherits its visibility), transparent, and smaller.
- **KBB artifacts:** an audit of the 71-artifact catalog found two exact
  duplicates under different names (`replication-factor`/`quickdraw-cache`,
  `witness-daemon`/`fifty-fifty`); both redesigned into mechanically
  distinct effects. Dropped a dead `q5`/`Q5_GATED` tag that nothing read.
- **Local dev:** the WWTBANE browser-test harness's Playwright loader
  silently `SKIP`-ed in any sandbox without a local `npm install`, masking a
  real regression — 3 of 4 browser test scripts were missing
  `nst.activeBank` since the NST bank-loader consolidation and hit the
  "no bank" guard screen on every run. Fixed the loader and all three
  scripts.

### Changed
- **Launcher:** the exam chooser no longer renders all 8 certs as
  equal-weight tiles — the 7 "Coming soon" certs collapse into one muted
  line so the one working exam (NCP-MCI) reads clearly.
- **README:** the live URL now leads the document; each tool has a real
  gameplay explanation (WWTBANE's ladder/lifelines, StarNix's three games,
  Practice Exams' practice/exam split) instead of one-line summaries.

### QA
- StarNix: `build.mjs` clean (4270.9 KB) · `kbb-run.cjs` 156/156 ·
  `kbb-draw.cjs` 16/16 · bank-lint/scheduler/multi-answer/shuffle/timer green.
- WWTBANE: 168 unit tests · `smoke.mjs` 9/9 · `e2e.mjs` 22/22 · both studio
  fixes confirmed with real before/after screenshots (Playwright).
- Launcher: bank selection, nav badge, and Settings panel verified via
  Playwright at desktop and 390px mobile widths, zero console errors.

## v2.0.0 — Exam chooser + StarNix gameplay pass (2026-07-23)

A user-directed feature batch across the launcher and StarNix.

### Added
- **Launcher:** an 8-exam chooser on the main screen — NCP-MCI, NCP-AI,
  NCP-CN, NCP-CI, NCP-US, NCP-MCA, NCP-DB, NCP-EUC. Each cert offers a
  **25-question** or **Full bank** choice. NCP-MCI is playable; the other
  seven show a "Coming soon" tile until their banks land.
- **StarNix / Chasm Chase:** enemy **mines** — a glowing mine hangs in one
  lane; flying into it detonates for an extra shield (dodge by changing lanes).
- **StarNix / KBB:** artifact **position/adjacency interactions**. Artifacts
  read their neighbours and slot, so rack order matters, and the rack is
  player-reorderable via ◀ ▶ arrows on each card. Six new adjacency artifacts
  (Sync Coupler, Chain Link, Isolator, Flank Booster, Load Balancer, Peer
  Cache). The existing artifact set is unchanged.

### Changed
- **Chasm Chase:** the left-right **scanner drone was removed**; falling rocks
  are now **irregular boulders** instead of perfect spheres; **more question
  gates** (every 6 km, first at 3 km); a **deeper, more realistic draw
  distance** with retuned fog; sleeker enemy squadron ships.
- **KBB:** the **boss music** was reworked toward a more heroic, anthemic
  melody with the darkness eased a touch.

### Notes / deferred
- The attached **asteroid textures** and **Shield/Medic KBB ship sprites**
  need the image files committed to the repo before they can be embedded
  (pasted images arrive as vision, not files). KBB already renders ships and
  asteroids with existing/procedural art in the meantime.
- KBB already shipped **65** artifacts (not fewer than 35); this batch adds
  six rather than trimming. Say the word to curate the set down.

### QA
- StarNix build 4271.7 KB (gate 4600) + 5 logic harnesses green · launcher
  cert-chooser browser checks · Chasm Chase + KBB battle smoke clean (zero
  console errors) · WWTBANE + Practice Exams suites green.

## v1.9.0 — Optimization Cycle 08 (2026-07-23)

The capstone cycle: copy that tells the truth, misses that become the next
study session, and a release-consistency guard so future changes stay honest.
All 10 shipped; verdicts in `docs/optimization/CYCLE-08.md`.

### Fixed
- **Launcher:** the StarNix card described "study guides and reference
  material" — a product that doesn't exist. It now says what StarNix is
  (three arcade games, adaptive drills), with an ARCADE tag and a Play CTA.
- **WWTBANE:** the Help screen's safe havens were hardcoded to the classic
  Q5/Q10/Q17/Q25 — wrong on every scaled short-bank ladder. They now render
  from the active ladder.
- **Practice Exams:** the "A–D select" keyboard hint understated the truth —
  the handler accepts up to A–J and the full bank carries 5-option questions.
  The range now follows the loaded set (A–D / A–E), in both modes.

### Added
- **Practice Exams:** exam results gain "Practice the N you missed" — one
  click launches Practice Mode over exactly the missed questions; resumed
  full-bank sessions announce themselves with a "Resumed where you left off"
  strip and a Start-over control; the results screen names the question bank
  the score was earned on (a pass on 25 questions is a different claim than
  one on 255).
- **Launcher:** a "Last visited" ribbon marks the tool you opened last.
- **Site:** a branded 404 page (GitHub Pages serves it for any bad deep
  link) pointing back to the launcher; the README now lists both bundled
  banks (255-question NCP-MCI + the 25-question set).
- **Release hygiene:** `scripts/version-check.mjs` runs in CI — the site
  version and the CHANGELOG's top entry can no longer drift apart.

### QA
- StarNix build + 5 harnesses green · WWTBANE 168 unit tests + 22/22 browser
  E2E · PE engine harness + version guard green · targeted C8 browser checks
  · full-site zero-console-error sweep clean.

## v1.8.0 — Optimization Cycle 07 (2026-07-23)

Continuity and quality-of-life: sessions survive interruptions, results become
a study tool, and hidden affordances get labeled. All 10 shipped; verdicts in
`docs/optimization/CYCLE-07.md`.

### Added
- **Practice Exams:** full-bank Practice sessions resume where you left off
  (per bank; random subsets and domain-focused sessions still start fresh);
  the results "By domain" rows are now buttons that filter the review list to
  that domain (combines with the incorrect-only toggle); a print stylesheet
  turns the results review into a clean paper study sheet; exam attempt
  history can be cleared (confirmed first) for shared machines.
- **WWTBANE:** closing or reloading the tab mid-run now warns before the run
  is lost (only while a live run is on stage — menus, green room, and finished
  runs never nag); the Help screen documents tap-to-skip read-outs and the
  exhibit lightbox.
- **StarNix:** the Chasm Chase how-to card starts with Enter/Space (or
  Escape) and focuses its Continue button — keyboard players never reach for
  the mouse; KBB advertises its 1–9 answer keys under the options (pointer-fine
  devices only); profile export gains a one-tap "Copy to clipboard" button
  with clipboard-API + select-fallback and "Copied ✓" feedback.

### Fixed
- **Practice Exams:** the question strip now sets `aria-current` on the
  current chip, so screen readers announce position, not just selection.

### QA
- StarNix build 4266.2 KB (gate 4600) + 5 harnesses green · WWTBANE 168 unit
  tests + 22/22 browser E2E · PE engine harness green · 14 targeted C7 checks
  · full-site zero-console-error sweep clean.

## v1.7.0 — Optimization Cycle 06 (2026-07-23)

Deeper features land: domain-focused practice, a paid feature that finally
works, and pace control. All 10 shipped; verdicts in
`docs/optimization/CYCLE-06.md`.

### Fixed
- **KBB:** the Intel consumable and Intel Cache artifact set a flag that
  nothing ever read — players paid coins for a no-op. The reveal now renders:
  "📡 INTEL · next 4 → 0 → 8", a mutation-free three-hit forecast of the
  enemy's attack pattern.
- **WWTBANE:** the GL studio's set wordmark showed behind the title/result/
  green-room heroes (the CSS fallback already hid its own) — hero parity now.
- **Dev tools:** the WWTBANE jump input's max follows the active ladder length
  instead of a hard-coded 30.

### Added
- **Practice Exams:** a "Practice focus" domain chip row — study one blueprint
  area at a time (chips show per-domain question counts; persisted; Exam mode
  always draws the whole bank).
- **WWTBANE:** the pre-round host beats are tap/key-skippable (~4 s to ~0.7 s
  to the first question when skipped) and guard against stacking; question
  exhibits open in a click-to-enlarge lightbox (screenshots were illegible at
  the 200 px card size).
- **All pages:** Open Graph metadata for link sharing; the StarNix build's
  head gains its missing theme-color and meta description.
- **Performance:** bank markdown and the manifest are session-cached for
  5 minutes — hopping between the launcher and tools no longer refetches
  ~376 KB per navigation (Retry paths bypass the cache).
- **Release hygiene:** the site version lives in one shared module
  (`shared/nst-version.js`) read by the launcher diagnostics and PE footer.

## v1.6.0 — Optimization Cycle 05 (2026-07-23)

Escape hatches and assistive-tech reach. All 10 shipped; verdicts in
`docs/optimization/CYCLE-05.md`.

### Fixed
- **ARM:** a window resize regenerated the whole starfield and nebula — burning
  seeded gameplay RNG on a cosmetic event and subtly forking deterministic
  runs. Stars live in map coordinates; resize no longer rebuilds them.
- **StarNix:** the "Reset all progress" confirmation armed forever after one
  accidental tap — it now stands down by itself after 5 seconds.
- **WWTBANE title:** the music toggle rebuilt the entire screen (and replayed
  the branded wipe) just to change its label — it updates in place; pressing
  Enter in the seed box now plays the seed instead of doing nothing.

### Added
- **StarNix Settings:** the same easy exits the Codex already had — sticky
  "← Menu" at the top and Escape (both flush unsaved slider/toggle changes).
- **StarNix:** the "A run is waiting" prompt gained a plain "← Back to menu" —
  a mis-click no longer forces choosing between resuming and destroying the
  save; focus lands on Resume. Master/effects sliders play a confirmation blip
  at the released level.
- **Screen-reader reach across all three games:** ARM announces toasts,
  objectives, and answer verdicts; KBB announces verdicts and makes the fanned
  artifact cards focusable with real accessible names; Chasm Chase gains named
  controls, a proper dialog role on the question panel, live milestone/biome
  banners, and announced verdicts.
- **Practice Exams:** the results page mirrors Retake / Back to home (plus
  "↑ Back to top") after the review list — it ran ~15,000 px with actions only
  at the top.

## v1.5.0 — Optimization Cycle 04 (2026-07-23)

Trust and feedback: scores say what they measured, records get celebrated,
controls reach the keyboard. All 10 shipped; verdicts in
`docs/optimization/CYCLE-04.md`.

### Fixed
- **KBB:** the shop honored the base 4-slot cap even for Hangar "Consumable
  rack" owners — the render check is rack-aware like the engine, so the paid
  5th slot can actually be bought into.
- **ARM:** the five settings switches were plain divs — invisible to Tab.
  They are real `role="switch"` buttons with visible focus and Space/Enter.
- **Chasm Chase:** on-screen lane/duck buttons fire on pointerdown like the
  jump button (click waited for pointerup — touch input lag).

### Added
- **Launcher:** picking a bank loads it immediately — the hint shows the real
  question count (25 vs 255 matters), Settings rows gain counts, and a broken
  bank file fails loudly at the launcher instead of as an empty tool. Plus an
  a11y micro-pass: live-region hints, contextual nav-chip label,
  `aria-haspopup` on the gear, modal overscroll containment.
- **Practice Exams:** every attempt is stamped with the bank it was taken on
  (shown in Recent attempts — a PASS on the 25-bank is a different claim than
  the full bank) and how long it took; results show "Time used M:SS of M:SS".
- **ARM:** the shield bar turns peach with a soft pulse at low shields (same
  25%/35% hysteresis as the music's danger layer; static glow under reduced
  motion).
- **Chasm Chase:** the game-over screen celebrates "★ NEW PERSONAL BEST" (or
  shows the distance to beat) instead of saving your record silently.
- **WWTBANE:** the title screen gained the missing "🛋 Green room" button —
  returning players could not reach the shop without losing a run first.

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
