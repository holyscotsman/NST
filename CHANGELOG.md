# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

## v2.5.1 — The hardening is now proven, not just present (2026-08-18)

Development-loop cycle 14 (security). Previous cycles added CSP, prototype-
pollution guards, storage validation and escaping; this one **attacks them** and
then pins the result so a refactor cannot quietly undo it.

### Added
- **`scripts/security-test.mjs` — a hostile-input gate, now run in CI.**
  18 checks over the real threat model: poisoned JSON must not reshape
  prototypes, a malicious question bank must stay inert data, duplicate ids and
  prose checklists must still be reported/ignored, the bank loader must honour
  only http(s), and no shipped file may contain `eval`, `new Function`, or a
  string-argument timer.
- **`scripts/attack-browser.mjs` — the DOM half.** It loads a bank whose every
  field carries an XSS payload, plus poisoned values in all seven storage keys,
  into **all four real pages**, and asserts nothing executes, no prototype is
  polluted, and every page still renders and works. 24 checks, all passing.
  Skips cleanly where no browser is available, so it never blocks CI.

### Verified (no changes needed)
- All eight stored-JSON guards, the CSP on all four entry points (WEBP
  exhibits are covered by the existing `img-src 'self'`), and every
  `NSTDomainLabel` render site (three escaped, one `textContent`).
- No new injection sinks, dynamic-code sinks, or committed dependencies since
  the v2.2.1 security pass.

## v2.5.0 — Exhibit diagrams 70% lighter (2026-08-18)

Development-loop cycle 13 (performance). Profiling the deployed site showed the
heaviest thing on it was no longer a build — it was the question bank's exhibit
images (2.6 MB across 27 diagrams), and v2.4.1 had just restored them in Exam
Mode, so they were being fetched in earnest.

### Changed
- **Exhibit diagrams converted to WEBP: 2,629 KB → 790 KB (−70%).** Quality was
  checked before trusting the number — a 1:1 crop of the most text-dense
  diagram (a VM-list screenshot) is visually indistinguishable from the PNG at
  q92, while dropping 585 KB → 93 KB. Six images where WEBP would have been
  *larger* keep their original encoding, and every diagram keeps its exact
  pixel dimensions.
- Bank markdown references were repointed to the new files; all 27 exhibits
  verified to fetch and decode in a browser with zero 404s.

## v2.4.4 — Readable domains, readable green room (2026-08-18)

Development-loop cycle 12 (UI/UX), screenshot-driven over the screens that had
never been captured: the Practice Exams results page and WWTBANE's green room.

### Fixed
- **"Vms" is now "VMs".** Domain names were title-cased by CSS
  (`text-transform: capitalize`), which cannot know acronyms or hyphens — the
  results breakdown read "Vms", and a hyphenated domain would read
  "Data-protection". A shared `NSTDomainLabel` helper (in the bank framework,
  so every surface can reach it) now renders real labels, used by the Practice
  Exams domain rows, the review chips, the "focus next" callout, and StarNix's
  Codex.
- **WWTBANE green room header washed out.** The heading and its subtitle sat
  directly on the lit 3D lounge with no scrim. They now share the same
  translucent legibility card the title screen already uses.
- **Practice Exams results actions cramped on phones.** Three side-by-side
  buttons forced "Practice the 25 you missed" onto three lines; below 480px
  they stack, each label on one line at a full tap target.

## v2.4.3 — The wrong-answer walk survives pause and quit (2026-08-18)

Development-loop cycle 11 (audit, iteration 4): the loose ends left when the
last hunt was cut short — two confirmed and fixed, two refuted on inspection.

### Fixed
- **WWTBANE: pausing during the walk back to the green room did not stop it.**
  A wrong answer starts a 2.6s walk-back before the run finalizes, and `onPause`
  parked only the lock-in submit — so the run could end *underneath* the open
  pause menu. The walk timer is now parked on pause and re-armed on resume,
  exactly like the submit.
- **WWTBANE: quitting during that walk-back threw 2.6s later.** `abortPending`
  dropped the submit timer but not the walk timer, which then fired against a
  torn-down run — `endRun` dereferences the (now null) run controller
  unconditionally. The walk timer is dropped on quit, and `endRun` refuses to
  finalize a run that no longer exists.

### Investigated, no change needed
- The intro cinematic does **not** double-route keys: the screen state is
  `cinematic`, and the global handler only forwards to the quiz on `quiz`.
- KBB artifacts with permanent `onAcquire` effects (Bio Reactor, Glass Cannon)
  are **already unsellable by design** — `isSellable` excludes them precisely
  because the effect cannot be cleanly reversed, and the UI explains the
  refusal. The suspected sell-trap and buy/sell ratchet are both unreachable.
- The StarNix question provider's relax chain (band → domain → excluded) and
  its weighted pick were reviewed and are sound.

## v2.4.2 — Lifelines can no longer be burned on a locked answer (2026-08-18)

Development-loop cycle 10 (audit follow-up + supply-chain hardening).

### Fixed
- **WWTBANE: a lifeline clicked after "Final answer" spent a paid charge for
  nothing.** Locking an answer disables the options and the lock button, then
  runs a multi-second suspense beat before submitting — and pausing parks that
  submit indefinitely. The HUD medallions stayed live through the whole window,
  so a late click burned a charge on an answer that was already committed and
  set `assisted = true` on a question the player had answered unaided. The run
  controller now refuses the charge, and the medallions dim at lock-in with a
  tooltip explaining why ("your answer is locked in"); a new question re-arms
  them.

### Security
- **CI actions are pinned to commit SHAs** (`actions/checkout` and
  `actions/setup-node` at v4.4.0) instead of mutable `@v4` tags — the last open
  item from the v2.1.1 supply-chain review, now that the SHAs are resolvable.

## v2.4.1 — Deep bug hunt: exhibits restored, parser corruption fixed (2026-08-17)

Development-loop cycle 9 (audit, iteration 3): a parallel bug hunt across eight
surfaces, each finding adversarially verified against the real code before any
fix. Five defects confirmed and fixed; the rest were refuted as guarded or
unreachable.

### Fixed
- **Practice Exams — every exhibit image was missing in Exam Mode.** The
  option-shuffle rebuilt each question without `imageSrc`, and the fallback it
  relied on (`window.PE_EXHIBITS`) has not been populated since StarNix's exam
  mode was removed — so all 27 diagram questions rendered with no diagram,
  unanswerable, while Practice Mode showed them fine.
- **Practice Exams — a failing score could print the passing mark.** The result
  percentage rounded up while pass/fail is decided on the exact fraction, so a
  203/255 sitting (79.6%) displayed "80%" beside "80% to pass". The score now
  floors, and can never claim a threshold it did not reach.
- **Bank parser — the documented `**Q:**` bold-label form was broken.** Only
  `**Q**:` parsed; the documented variant left a literal `**` glued to the stem
  (and to any metadata value written that way).
- **Bank parser — Markdown checklists inside prose became answer options.** A
  `- [x]` line in an `Explain:`/`Teach:` block was swallowed as a real option
  and silently flipped the question to multi-answer with a wrong answer key.
- **Bank parser — duplicate question ids loaded silently.** Two blocks sharing
  an id collide in every per-question store (mastery, spaced repetition); the
  parser now reports it as a bank error.

### Added
- Regression tests for the exhibit-source and score-display defects, both
  verified to fail against the pre-fix code.

## v2.4.0 — Cleanup + salvage: branding, README, arms fix, 17 MB lighter (2026-08-17)

Development-loop cycle 8 (code + repository cleanup, with salvage).

### Added (salvaged from an orphaned work branch)
- **Launcher:** the official **Nutanix wordmark** now brands the nav (extracted
  to `shared/nutanix-wordmark.svg`), and the exam chooser is decluttered — the
  playable NCP-MCI tile stands alone with the seven coming-soon certs as a
  one-line note.
- **WWTBANE:** raised arms no longer clip through heads (the studio's shoulder
  rotation used the wrong sign in four poses), and the bare glowing circle
  over the crowd is gone.
- **READMEs:** the root README leads with the live URL and describes what each
  game actually plays like; WWTBANE's README points at the monorepo URL
  (the retired standalone URL is now pinned as forbidden by its docs test).

### Removed
- Stale working documents: `docs/optimization/` (the July loop's state files —
  also the last in-repo references to the AI tooling), the studio improvement
  plan, WWTBANE's one-time review reports (code review, graphics audit ×2,
  hardening review), and its `STATE.md`/`BROWSER_QA.md` resume-point docs.
- **16 MB of source art** (`starnix/art/`) whose processed versions are
  embedded in the build — originals remain recoverable from git history.
- The unused OrbitControls addon; the orphaned remote work branch (after
  salvaging its three good commits above).

## v2.3.4 — Polish: three.js preloads with the page (2026-08-17)

Development-loop cycle 7 (perf polish).

### Changed
- **WWTBANE:** `modulepreload` for the minified three.js build — the 652 KB
  fetch starts with the HTML instead of after the boot module resolves its
  import, removing one waterfall hop from first load. (StarNix's phone title
  screen was audited this cycle and passed as-is.)

## v2.3.3 — UI/UX cycle 2: StarNix mission select fits phones (2026-08-17)

Development-loop cycle 6 (UI/UX, iteration 2), screenshot-driven.

### Fixed
- **StarNix on phones:** the Mission-select header squeezed its right column
  off the viewport — the rank strip and the Main menu / Stats buttons clipped
  past the right edge at 390px. The bridge header now stacks vertically at
  phone widths: crest, full-width rank strip, then the menu buttons in a
  wrapped row. (WWTBANE's phone title screen was audited too and passed.)

## v2.3.2 — Audit cycle 2: review findings applied (2026-08-17)

Development-loop cycle 5 (code audit, iteration 2): an adversarial review of
everything the loops shipped since v2.1.1 verified the CSP hashes, the
minified three.js export surface (416/416 identical), build determinism, and
the vendored fonts — and produced two cleanup findings, both applied.

### Changed
- **Fonts load without blocking:** `shared/fonts.css` shrinks from 62 KB of
  base64 to a ~1 KB stylesheet referencing sibling `.woff2` files (the pattern
  WWTBANE already uses) — the already-compressed woff2 ships raw instead of
  +33% base64, faces lazy-load per unicode-range, and CSP tightens from
  `font-src data:` to `font-src 'self'`.
- **One canonical safe-parse:** the `__proto__`-stripping stored-JSON parse now
  lives once in `shared/bank-parser.js` (`window.NSTSafeParse`), consumed by
  the bank loader and all three Practice Exams call sites; only the
  self-contained StarNix/WWTBANE bundles keep local copies.

## v2.3.1 — Performance cycle 2: WWTBANE loads 48% less JS (2026-08-17)

Development-loop cycle 4 (performance, iteration 2).

### Changed
- **WWTBANE:** the vendored three.js ESM build is now **minified**
  (1,243 → 652 KB, −48%) and the importmap points at it; the postprocessing
  addons (bloom) keep resolving the same module instance through the map.
  The inline importmap's CSP hash was recomputed to match.

## v2.3.0 — UI/UX cycle: the phone launcher works again (2026-08-17)

Development-loop cycle 3 (UI/UX modernization), screenshot-driven.

### Fixed
- **Launcher on phones:** the exam chooser overflowed the viewport — the hero
  (a flex item, so `min-width: auto`) grew to the cert grid’s intrinsic
  3-column width (654px) and **clipped the playable NCP-MCI tile off the left
  edge** at 390px. The hero now shrinks properly, and phones get a compact
  2-up tile grid with the playable tile’s two variant buttons stacked.

### Changed
- Hero headline uses `text-wrap: balance` for even multi-line wraps
  (progressive enhancement).

## v2.2.1 — Security cycle: strict CSP everywhere (2026-08-17)

Development-loop cycle 2 (code audit + security).

### Security
- **Content-Security-Policy on every page.** The launcher and Practice Exams
  run fully strict (`script-src 'self'`, everything else denied); WWTBANE
  allows exactly its two inline blocks by sha256 hash; the 404 page hashes its
  own inline style + script; StarNix (a single-file app) keeps
  `'unsafe-inline'` for its own code but denies every external vector —
  no page can load third-party script, embed plugins, hijack `<base>`,
  or POST a form anywhere.
- **Prototype-pollution guards:** every parse of stored JSON (NST prefs,
  StarNix profile, WWTBANE save + import, Practice Exams history/resume/prefs,
  bank cache) now strips `__proto__` keys with a reviver.
- **Repo hygiene:** the inert nested workflow directories left over from the
  subtree import (`starnix/.github`, `wwtbane/.github` — GitHub never ran
  them) are deleted, including the stale Pages deploy config that claimed
  write permissions.

## v2.2.0 — Performance pass: 30% smaller StarNix, zero external requests (2026-08-17)

Development-loop cycle 1 (workflow optimization + performance).

### Changed
- **StarNix:** 17 embedded images (ships, stations, canyon textures, menu and
  nebula backdrops) converted from PNG/JPEG to WEBP — the single-file build
  drops **4108 → 2862 KB** (gzip 2319 → 1388, −40% over the wire), with alpha
  preserved on every sprite.
- **Launcher + Practice Exams:** Manrope and Space Grotesk are now **vendored**
  as variable-font data URIs in `shared/fonts.css` — the site makes **zero
  external requests** (was: Google Fonts CSS + woff2 on two pages). Faster
  first paint, no CDN dependency, and the door is open for a strict CSP.
- **CI:** the whole dependency-free StarNix battery now gates PRs (audio,
  CC view/fairness, exhibits, perf, bank import, KBB balance) — design/test
  drift previously surfaced only in local runs.

## v2.1.1 — Full QA + security pass (2026-08-02)

A user-requested audit of the whole site: every test suite run, one real
gameplay bug fixed, stale harnesses modernized, and a static security review
(XSS sinks, storage poisoning, supply chain, secrets) with fixes applied.

### Fixed
- **Chasm Chase:** a real scheduling bug — with question gates every 6 km
  (≡3 mod 6), the 34-km turn grid landed a 90° corner exactly on a question
  gate every 3rd turn (39/141/243 km). `TURN_KM` is now 36, pinning every
  turn at ≡5 mod 6 — provably never on a gate.
- **Practice Exams:** a poisoned attempt-history key (any truthy non-array)
  crashed the entry screen; history is now validated as an array, history-row
  numbers are coerced, and the practice resume index must be a real integer
  before it indexes the question bank.
- **WWTBANE:** save migration now normalizes `wallet`, `stats.runs`, and
  mastery box numbers — a poisoned wallet permanently NaN'd every shop
  purchase.

### Security
- Bank-derived text (domain names, topics) and stored values (UA string,
  storage keys, prefs dump, history rows) now render as text nodes, never
  `innerHTML` — closing two high-severity and four low-severity XSS sinks in
  the StarNix shell/ARM briefing, the launcher diagnostics panel, and the
  Practice Exams history list.
- The question-bank loader only honours http(s) URLs for bank files and
  exhibit images (`javascript:`/`data:`/cross-scheme refs are dropped).
- WWTBANE's DOM helper lost its unused raw-`innerHTML` prop; CI runs with
  least-privilege `contents: read`; the launcher and Practice Exams pages
  send only the origin (never the full URL) to the font CDN.

### Changed
- **Test harnesses** modernized to the shipped design (no product changes):
  boss-music assertions track the reworked anthemic melody; scanner-drone
  (OB_SWEEP) checks became mine (OB_BOMB) solvability/instancing checks;
  eleven references to curated-out artifacts remapped onto the kept
  35-roster; exhibit integrity now validates runtime bank images on disk;
  boost (3 gates) and milestone (10 km first mark) expectations aligned.

## v2.1.0 — KBB art + artifact curation (2026-07-24)

A user-directed follow-up: real ship/asteroid art for Kuiper Belt Battle and a
tighter, more build-defining artifact roster.

### Added
- **StarNix / KBB:** three hand-drawn **hero ship sprites** now fly the squad —
  an attacker, a shield ship (green bubble), and a medic (green cross) — drawn
  both on the combat stage and in the squad panel.
- **StarNix / KBB:** three **asteroid textures** shape the Kuiper belt; each
  drifting rock now wears a cratered/rubble texture instead of a flat polygon.

### Changed
- **StarNix / KBB:** the artifact roster is curated from 71 down to **35**
  build-defining picks — a Balatro-style set spanning flat/mult/ramp damage,
  sustain, defense, economy, utility, risk, permanent scaling, domain payoffs,
  and the five **adjacency** artifacts whose rack position matters. Every
  artifact wired to special logic (Lazarus, Twin Reactor, Compression, Golden
  Cache) is retained.
- **StarNix / KBB:** late-section enemy HP scaling re-tightened
  (`hpPerSection` 0.10 → 0.16) so the clear-depth difficulty target holds after
  the stronger, concentrated artifact pool.

### Fixed
- **StarNix / KBB:** belt rocks that indexed a removed texture slot fell back to
  a gray polygon; the belt now derives its sprite index from the live texture
  count, so every rock is textured.

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
