# Optimization Cycle 02 — plan (target: v1.3.0)

Seeded from Cycle 01's reviewed survey backlog (premises re-verified by this
cycle's adversarial change review before implementation).

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C2-01 | sx-shell | Define the missing .sx-btn-primary style (pause Resume + selected genre button) | S/low |
| C2-02 | ww-screens | Fix the win screen's contradictory '0 coins total' wallet row | S/low |
| C2-03 | cc | Reset stale HUD/PB state on Run again | S/low |
| C2-04 | ww-quiz | Re-anchor the money-ladder highlight and scroll on window resize | S/low |
| C2-05 | pe-exam | Fix timer screen-reader announcements to fire once per urgency crossing | S/low |
| C2-06 | pe-practice | Announce the check verdict to screen readers | S/low |
| C2-07 | ww-quiz | Show the selected count on the multi-answer lock button | S/low |
| C2-08 | home | Dim and disable Volume and PE-sounds rows while Mute all is on | S/low |
| C2-09 | ww-quiz | Keep keyboard focus in the quiz across question changes | S/low |
| C2-10 | pe-exam | Turn the disabled Next button into "Review & submit" on the last question | S/low |

## Instructions

### C2-01 — Define the missing .sx-btn-primary style (pause Resume + selected genre button)

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

Three call sites use class sx-btn-primary (pause overlay Resume at line 1580, and the selected Upbeat/Chill genre button at lines 1258-1259) but no CSS rule for it exists anywhere in the bundle — verified computed style is UA-default gray rgb(107,107,107) on the dark theme. Add two rules next to .sx-btn-iris in _injectShellCSS (~line 1767): .sx-btn-primary{background:var(--iris);color:#fff;} and .sx-btn-primary:hover{background:var(--iris600);}. Verify headlessly by asserting the computed backgroundColor of .sx-pause-resume equals the iris token after rebuild.

*Why:* The pause screen's primary CTA and the active music-style choice read as branded, intentional buttons instead of unstyled gray blobs.

### C2-02 — Fix the win screen's contradictory '0 coins total' wallet row

**Surface:** ww-screens · **Files:** wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

endRun applies prestige (wallet reset to 0) before rendering ResultScreen, so the win screen reads 'took home 50,000 coins' followed by '🪙 0 coins total' (verified headless screenshot). In ResultScreen (screens.js), when ctx.won, replace the wallet row with the run's payout and record — e.g. '🏆 50,000 coin payout' plus the existing wins badge — and keep the wallet row only on the loss path where it is truthful.

*Why:* The biggest celebratory moment no longer tells the winner they have zero coins one line after awarding 50,000.

### C2-03 — Reset stale HUD/PB state on Run again

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

The btnRestart handler resets only hudCache.shields. Also reset hudCache.mile and hudCache.bio to 0, clear mileHideAt/bioHideAt, remove the 'on' class from mileBanner/bioBanner, reset pbBeaten=false, roll pbBest forward to max(pbBest, last run's points), and restore el.pb to 'PB x km' with class 'cc-pb'. Today a restart suppresses every milestone banner until the new run beats the old distance (sim.lastMilestone > stale hudCache.mile never fires), a banner up at death stays glued on-screen for kilometers, and 'NEW RECORD' persists as a lie through the whole next run. Verify headless by driving a run past 10 km, crashing, restarting, and asserting banner classes/textContent.

*Why:* Second runs get their milestone celebrations back and the HUD stops showing leftover banners and a stale NEW RECORD badge.

### C2-04 — Re-anchor the money-ladder highlight and scroll on window resize

**Surface:** ww-quiz · **Files:** wwtbane/src/shell/ui/hud.js · **Effort/Risk:** S/low

Hud._moveHighlight only runs inside update(), so a resize mid-question leaves the rail stale: verified that shrinking 1280px to 700px leaves the mobile strip at scrollLeft=0 while the current rung sits at x=1866 (off-screen), and the highlight's pixel `top` can drift on the vertical rail too. Store the last index in update() (this._lastIndex) and add one debounced window resize listener in the Hud constructor that re-calls _moveHighlight(this._lastIndex). Verify headless by resizing across the 760px breakpoint and asserting the .rung.current is within the ladder's visible scroll range.

*Why:* Rotating a phone or resizing the window no longer hides where you are on the ladder — the current rung stays in view.

### C2-05 — Fix timer screen-reader announcements to fire once per urgency crossing

**Surface:** pe-exam · **Files:** practice-exams/exam-mode.js, practice-exams/styles.css · **Effort/Risk:** S/low

tick() sets aria-live="polite" on the timer element at the 25% crossing, but the element's innerHTML is replaced every second afterward, so screen readers would announce the countdown every second for the rest of the sitting. Keep the timer's aria-live permanently "off", add a visually-hidden sibling live region (aria-live="polite", aria-atomic="true"), and write the one-shot warning text ("a quarter of the time left" / "running out of time") into it only at each crossing. Verify headless by asserting the timer's aria-live stays "off" and the live region text appears exactly once per threshold on a short (1-question, 1-minute) exam.

*Why:* Screen-reader users get the intended two polite time warnings instead of a per-second countdown barrage.

### C2-06 — Announce the check verdict to screen readers

**Surface:** pe-practice · **Files:** practice-exams/practice-mode.js, practice-exams/styles.css · **Effort/Risk:** S/low

Only the score chip has aria-live today, so checking an answer announces '3 correct · 5 answered' but never the actual verdict. Add a persistent visually-hidden aria-live='polite' status element to the practice shell (created once in start(), not re-inserted per render, so announcements fire reliably), and set its text on check to e.g. 'Correct' or 'Not quite. Correct answer: B' using ui.LETTERS and the question's correct index(es). Clear it on navigation.

*Why:* Non-sighted users hear whether they got the question right — the core feedback loop of Practice mode.

### C2-07 — Show the selected count on the multi-answer lock button

**Surface:** ww-quiz · **Files:** wwtbane/src/shell/ui/overlay.js · **Effort/Risk:** S/low

Multi questions are graded all-or-nothing but the lock button reads a static 'Lock in these answers', so locking with too few picks feels like a UI accident. In _refreshSelection, when this.current.q.type === 'multi', set lockBtn.textContent to `Lock in ${n} answer${n===1?'':'s'}` (falling back to the static label at n=0 while disabled). Verify with a headless run on a multi question (or a jsdom-free DOM test): select 1 then 2 options and assert the label updates.

*Why:* A pre-lock sanity check that makes 'you picked only one answer on a select-all question' visible before the permadeath grade, without leaking how many answers are correct.

### C2-08 — Dim and disable Volume and PE-sounds rows while Mute all is on

**Surface:** home · **Files:** scripts/nst-home.js, styles/nst-home.css · **Effort/Risk:** S/low

In the Audio section (scripts/nst-home.js:249-265), when prefs.audioMuted is true the Volume slider and 'Practice Exams sounds' switch stay fully interactive with no visual cue they do nothing (verified: slider.disabled=false, row opacity 1). On the Mute-all toggle change, set slider.disabled, add a .nst-set-row.muted class (opacity ~0.45 via CSS) on both rows, set aria-disabled on the PE switch, and restore on unmute. Keep values intact so unmuting returns to the prior volume.

*Why:* Standard mixer behavior — users immediately see mute overrides the other audio controls instead of wondering why the slider does nothing.

### C2-09 — Keep keyboard focus in the quiz across question changes

**Surface:** ww-quiz · **Files:** wwtbane/src/shell/ui/overlay.js · **Effort/Risk:** S/low

After clicking Continue the old card (holding the focused .continue-btn) is destroyed and focus falls to <body> (verified), so Tab restarts from the top of the document and arrow-key radio navigation is unreachable without re-tabbing through the HUD. In showQuestion, set tabindex=-1 on the new stem h2 and focus it with {preventScroll:true} (mirroring main.js _swap's heading-focus pattern). Verify headless: after continue, document.activeElement is the stem, and one Tab lands on the first revealed option.

*Why:* Keyboard and screen-reader players stay anchored at the question instead of being dumped to the page top thirty times per run.

### C2-10 — Turn the disabled Next button into "Review & submit" on the last question

**Surface:** pe-exam · **Files:** practice-exams/exam-mode.js · **Effort/Risk:** S/low

On question N the Next button is disabled but still reads "Next" (verified headless) — the natural forward flow dead-ends and the user must notice the separate submit bar. In renderCard(), when idx === N-1, keep nextBtn enabled, relabel it "Review & submit", and route its click to promptSubmit() (which already summarizes unanswered/flagged and offers "Review flagged first"); restore the normal label/behavior on other questions. Leave ArrowRight inert on the last question to avoid accidental submits. Verify headless: navigate to the last chip, assert the label and that clicking opens the submit modal.

*Why:* The exam's forward momentum leads straight into the submit flow instead of stalling on a dead disabled button.

## Review verdicts

(recorded before implementation)

