# Optimization Cycle 01 — plan (target: v1.2.0)

Selected from a 60-candidate, 10-surface survey (10 parallel agents). Bugs and
data-loss hazards first, with every surface touched. Each item passes an
adversarial change review BEFORE implementation; verdicts are recorded below.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C1-01 | home | Make the Help link actually help: open a small Help panel | M/low |
| C1-02 | home | Settings bank picker: show the real error + Retry when the manifest fetch fails | S/low |
| C1-03 | home | Reset-data confirm: focus Cancel by default, not the destructive button | S/low |
| C1-04 | pe-practice | Make Enter advance to the next question after checking | S/low |
| C1-05 | pe-exam | Guard against accidental refresh/close during an in-progress exam | S/low |
| C1-06 | kbb | Fix number-key soft-lock on multi-answer questions | S/low |
| C1-07 | kbb | Define the missing PALETTE.mid token (4 broken CSS rules) | S/low |
| C1-08 | cc | Stop tab-switch from resuming a paused game | S/low |
| C1-09 | ww-quiz | Cap the question card height so it never overflows off-screen | S/low |
| C1-10 | arm | Auto-pause on tab hide so timed questions don't silently expire | S/low |

## Instructions

### C1-01 — Make the Help link actually help: open a small Help panel

**Surface:** home · **Files:** index.html, scripts/nst-home.js, styles/nst-home.css · **Effort/Risk:** M/low

index.html line 53 is <a class="nst-help" href="#help"> and no #help target exists — clicking does nothing (verified in browser). Convert it to a button that opens a compact dialog reusing the existing .nst-modal styles and the same dialog contract already in nst-home.js (Escape closes, Tab cycles, focus returns): three one-liners on what each tool is, one on picking a question bank, one pointing at Settings. Also un-hide it on tablet where CSS currently sets .nst-help { display:none }, or show it inside the Settings modal footer on small screens.

*Why:* The only 'Help' affordance on the launcher currently goes nowhere — a visible dead end for new users.

### C1-02 — Settings bank picker: show the real error + Retry when the manifest fetch fails

**Surface:** home · **Files:** scripts/nst-home.js · **Effort/Risk:** S/low

buildBankSection (scripts/nst-home.js:95-99) renders 'No question banks found. Drop a Markdown bank into /banks/…' even when the manifest fetch failed, because it never consults Bank.manifestError() — verified by aborting the manifest route: hero shows 'Couldn't load… Retry' while Settings shows the misleading empty-state. Mirror the hero's treatment: if banks.length===0 && Bank.manifestError(), show 'Couldn't load the question banks — check your connection.' plus a Retry button that calls Bank.manifest(true) and re-renders the list.

*Why:* An offline user opening Settings is told to author a new bank instead of being told the fetch failed — the two pickers now contradict each other.

### C1-03 — Reset-data confirm: focus Cancel by default, not the destructive button

**Surface:** home · **Files:** scripts/nst-home.js · **Effort/Risk:** S/low

confirmReset (scripts/nst-home.js:362) calls ok.focus(), so Enter pressed right after the dialog opens irreversibly wipes all saved data (verified: activeElement is 'Reset everything'). Change to cancel.focus() per the ARIA dialog pattern for irreversible actions; keep 'Reset everything' visually prominent and last in Tab order. One-line change plus a headless assertion that document.activeElement.textContent === 'Cancel' after opening.

*Why:* Prevents a single accidental Enter from destroying all progress and preferences on the device.

### C1-04 — Make Enter advance to the next question after checking

**Surface:** pe-practice · **Files:** practice-exams/practice-mode.js · **Effort/Risk:** S/low

In practice-mode.js onKey, when state[idx].checked is true, map Enter to 'next question' (idx++ / renderCard) instead of falling through to onCheckOrRetry, which currently wipes the checked answer back to 'Check answer' state. Keep 'Try again' as a button click (optionally bind it to R), and update the .pe-keys hint to 'Enter check / next'. Verified live: today Enter, Enter on question 1 clears the verdict, deselects the answer, and un-counts it from progress.

*Why:* The natural answer-check-advance keyboard rhythm works instead of silently destroying the user's checked answer.

### C1-05 — Guard against accidental refresh/close during an in-progress exam

**Surface:** pe-exam · **Files:** practice-exams/exam-mode.js · **Effort/Risk:** S/low

There is no beforeunload handler while an exam is running (verified headless), so a reflexive F5, back-swipe, or tab close silently discards the whole timed sitting. Register a window beforeunload listener (e.preventDefault() + e.returnValue) when the exam starts, and remove it in doSubmit(), in the Exit confirm path, and if root becomes disconnected. Verify in Playwright with page.close({ runBeforeUnload: true }) asserting a dialog fires mid-exam and does not fire after submit.

*Why:* One stray refresh no longer throws away up to 90 minutes of exam progress without warning.

### C1-06 — Fix number-key soft-lock on multi-answer questions

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** S/low

handleKey (kbb.js ~line 3193) routes any 1-9 keypress straight to onAnswer(s, n-1) even when isMultiQ(q). Verified live in a headless browser: on a 'Choose two' question the press is graded WRONG by the engine (wrongCount++, mastery records a miss), then onAnswer throws 'chosenSet.indexOf is not a function' (chosenSet is a number in the multi branch), leaving s.locked=true with no feedback and no Continue button — a hard soft-lock. Fix: in handleKey, when the question is multi, find the matching option button in s.optsEl by data-idx and .click() it (which toggles selection exactly like a mouse click), and let Enter click the enabled submit button; single-answer behavior unchanged. Rebuild starnix/index.html with node build.mjs.

*Why:* Keyboard players currently get an instant wrong answer plus a frozen battle the moment a multi-select question appears; after the fix keys work identically to clicks.

### C1-07 — Define the missing PALETTE.mid token (4 broken CSS rules)

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** S/low

Four injected rules concatenate P.mid which does not exist in PALETTE (lines 1124, 1186, 1214, 1241), producing 'color:undefined' — verified live: the stylesheet contains 4 'undefined' occurrences and .kbb-play-stake computes rgb(242,242,247) (full-bright text color) instead of a muted tone. Affected: artifact-card descriptions in the hand, the stake line under the move header, map node icons, and the map dock 'Next:' label. Add mid: '#c6c8dc' (or similar between text #F2F2F7 and dim #9a9aad) to PALETTE and rebuild.

*Why:* Restores the intended visual hierarchy so secondary text stops shouting at the same brightness as primary copy; verifiable by asserting no 'undefined' in the injected stylesheet.

### C1-08 — Stop tab-switch from resuming a paused game

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

In createCCModule, onVis() calls resume() unconditionally when the tab becomes visible, even when the shell's pause overlay (module.pause) or the how-to card owns the pause — the sim then runs and crashes unattended behind the overlay. Replace the single `running` boolean with two owner flags (e.g. pausedByUI, pausedByVis); pause()/resume() exposed to the shell and showHowTo set pausedByUI, onVis sets pausedByVis, and the loop runs only when both are clear. Verify headless: mount, call module.pause(), fake document.hidden toggle + visibilitychange, assert sim.distance does not advance.

*Why:* Players who alt-tab while paused no longer return to a ship that silently ran into walls behind the pause menu.

### C1-09 — Cap the question card height so it never overflows off-screen

**Surface:** ww-quiz · **Files:** wwtbane/styles/main.css · **Effort/Risk:** S/low

The .q-card is position:fixed anchored to the bottom with no max-height; on short viewports (verified at 1280x560) a question plus audience poll or feedback panel pushes the meta chips and stem to top:-168px with no way to scroll them into view. Add `max-height: calc(100vh - 110px); overflow-y: auto; overscroll-behavior: contain;` to .q-card (and a mobile override under the 760px breakpoint of roughly `calc(100vh - 190px)` to clear the top HUD strip). Verify headless by repeating the 1280x560 run: card top must be >= 0 and the stem scrollable into view.

*Why:* On small laptop windows and landscape phones the question text and explanation are currently unreachable — this makes every question readable everywhere.

### C1-10 — Auto-pause on tab hide so timed questions don't silently expire

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

Measured: with the tab hidden 3s, the question countdown drained 3012ms — a tabbed-away player eats a timeout (14 shield damage on field scans, lost core). In mount(), add on(doc, 'visibilitychange', ...): when doc.hidden && !paused, call the existing pause() and set an autoPaused flag; on visible, resume() only if autoPaused (so it never fights the shell's pause overlay). Verify in headless chromium by stubbing document.hidden, dispatching visibilitychange, sleeping, and asserting __armTest.questionRemain() is unchanged.

*Why:* Switching tabs mid-question no longer costs shields and cores the player never had a chance to answer.

## Review verdicts

(filled in by the change review before implementation)

## Backlog (replacements if a review fails)

- **[sx-shell]** Define the missing .sx-btn-primary style (pause Resume + selected genre button) — The pause screen's primary CTA and the active music-style choice read as branded, intentional buttons instead of unstyled gray blobs.
- **[ww-screens]** Fix the win screen's contradictory '0 coins total' wallet row — The biggest celebratory moment no longer tells the winner they have zero coins one line after awarding 50,000.
- **[cc]** Reset stale HUD/PB state on Run again — Second runs get their milestone celebrations back and the HUD stops showing leftover banners and a stale NEW RECORD badge.
- **[ww-quiz]** Re-anchor the money-ladder highlight and scroll on window resize — Rotating a phone or resizing the window no longer hides where you are on the ladder — the current rung stays in view.
- **[pe-exam]** Fix timer screen-reader announcements to fire once per urgency crossing — Screen-reader users get the intended two polite time warnings instead of a per-second countdown barrage.
- **[pe-practice]** Announce the check verdict to screen readers — Non-sighted users hear whether they got the question right — the core feedback loop of Practice mode.
- **[ww-quiz]** Show the selected count on the multi-answer lock button — A pre-lock sanity check that makes 'you picked only one answer on a select-all question' visible before the permadeath grade, without leaking how many answers are correct.
- **[home]** Dim and disable Volume and PE-sounds rows while Mute all is on — Standard mixer behavior — users immediately see mute overrides the other audio controls instead of wondering why the slider does nothing.
- **[ww-quiz]** Keep keyboard focus in the quiz across question changes — Keyboard and screen-reader players stay anchored at the question instead of being dumped to the page top thirty times per run.
- **[pe-exam]** Turn the disabled Next button into "Review & submit" on the last question — The exam's forward momentum leads straight into the submit flow instead of stalling on a dead disabled button.
