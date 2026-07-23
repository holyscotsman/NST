# Optimization Cycle 05 — plan (target: v1.6.0)

Ten items from the reviewed survey backlog — an accessibility-heavy batch.
Inline adversarial review before implementation; verdicts below.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C5-01 | sx-shell | Give Settings the same easy exit the Codex already has (Escape + sticky top back) | S/low |
| C5-02 | sx-shell | Add a cancel path and focus handoff to the 'A run is waiting' resume prompt | S/low |
| C5-03 | sx-shell | Play a confirmation blip when the effects-volume slider is released | S/low |
| C5-04 | sx-shell | Auto-disarm the 'Reset all progress' confirmation after a few seconds | S/low |
| C5-05 | arm | Stop regenerating the starfield and nebula on window resize | S/low |
| C5-06 | arm | Announce toasts, objectives, and answer results to assistive tech | S/low |
| C5-07 | kbb | Announce answer feedback to assistive tech and make hand cards focusable | S/low |
| C5-08 | cc | Add ARIA semantics to controls, overlays, and banners | S/low |
| C5-09 | pe-exam | Add a bottom action row after the review list on results | S/low |
| C5-10 | ww-screens | Title polish: Enter plays a seed, music toggle updates in place | S/low |

## Instructions

### C5-01 — Give Settings the same easy exit the Codex already has (Escape + sticky top back)

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

showStats (v0.126.0) added Escape-to-menu and a sticky .sx-stats-topback because 'the Codex is a long screen; make LEAVING it easy' — but showSettings (lines 1341-1428), which is equally long (audio, toggles, trails, data, dev sections), only has a bottom '← Menu' and verified Escape does nothing. Mirror the two-line pattern from showStats: a global Escape keydown handler in _screenListeners that flushes persistence and calls showMenu, plus the same sticky top back button markup/class at the top of the panel.

*Why:* Leaving Settings no longer requires scrolling past six sections; keyboard behavior matches the sibling Codex screen.

### C5-02 — Add a cancel path and focus handoff to the 'A run is waiting' resume prompt

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

The resume prompt in enterGame (lines 1473-1491) offers only 'Resume' or 'New game (discards the save)' — a player who mis-clicked a mission strip cannot back out without either resuming or destroying their save, and it is the only screen that skips this._focusScreen(). Add a '← Menu' ghost button plus an Escape handler that both call showMenu(), and call this._focusScreen(rs) after appending. While there, also add the missing _focusScreen(s) call at the end of showTitle (line 225) so every screen honors the v0.135.0 focus convention (verified: focus stays on <body> on the title screen).

*Why:* A mis-click on a mission with a saved run is no longer a trap that forces choosing between resuming and deleting progress.

### C5-03 — Play a confirmation blip when the effects-volume slider is released

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

In _buildVolumeSliders (lines 1016-1043) the music slider is self-demonstrating (the bed is playing) but the 'Effects volume' and 'Master volume' sliders give zero audible feedback — the user can't judge the level until some later game event fires an SFX. In the existing 'change' handler (line 1031, which already persists), fire core.audio.sfx('click') for the sfxVol and masterVol sliders (change, not input, so dragging doesn't spam). Verifiable in Node with the mock audio core by counting sfx calls after dispatching input+change events.

*Why:* Adjusting effects volume immediately demonstrates the new level, matching how the music slider already behaves.

### C5-04 — Auto-disarm the 'Reset all progress' confirmation after a few seconds

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

The two-tap reset confirm (lines 1367-1380) arms permanently: one accidental click leaves the button in the red 'Tap again to confirm — erases mastery & best scores' state until it is clicked again (which erases everything) or the screen is left. Add a ~4s setTimeout on arm that reverts armed=false, the label, and the .armed class; clear the timer on the confirming click. Track the timeout so _clearScreen/destroy can't leak it (store on this and clear in _clearScreen, or use the existing listener-bag idiom with a stored handle).

*Why:* An accidental first tap on the destructive reset button safely defuses itself instead of leaving a one-click data-wipe armed indefinitely.

### C5-05 — Stop regenerating the starfield and nebula on window resize

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

resize() (line ~687) calls makeStars() on every window resize, which redraws 500+ stars and 4-6 nebula blobs from runRng. Verified live: repeated resizes changed the nebula blob count (6→5→4), meaning seeded gameplay RNG is consumed (perturbing later enemy spawns/HP rolls) and the tier-tinted nebula from ARM#9 reverts to the tier-0 palette (re-tint only happens in buildSectorWorld). Star count depends only on MAP_W/MAP_H, so remove the makeStars() call from resize() — mount's newRun() already builds the field. Verify headless: dispatch resize events and assert __armTest.nebulaCols() and a star sample are unchanged.

*Why:* Resizing or rotating the device no longer visibly re-rolls the backdrop, erases the sector's tier identity, or nudges seeded gameplay off its deterministic track.

### C5-06 — Announce toasts, objectives, and answer results to assistive tech

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

arm.js contains zero aria attributes. In buildDom(), set role="status" and aria-live="polite" on the toast element and the banner (objective) element, and set aria-live="polite" on the .arm-explain answer-feedback block created in showQuestion(). All dynamic text already flows through textContent so no other changes are needed. Verify headless by asserting the attributes exist and that showToast()/setBanner() update the live-region nodes.

*Why:* Screen-reader users hear 'Core secured +15', objective changes, and correct/incorrect feedback instead of total silence outside the canvas.

### C5-07 — Announce answer feedback to assistive tech and make hand cards focusable

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** S/low

The verdict/explanation container .kbb-fb (line 2621) and the toast have no aria-live, so correct/wrong results are never announced (confirmed via getAttribute in a live session); the fanned artifact cards expose their descriptions only via title= (hover-only — invisible to keyboard and touch users). Set aria-live='polite' on the fb element when it is created and role='status' on the toast, and reuse the existing attachTooltip(s, card, def) helper (already used for shop tiles, gives tabIndex, aria-label, and focus-triggered tooltip) on the hand's artifact cards in renderArtifacts.

*Why:* Screen-reader and keyboard users get the round outcome and can read what their artifacts do, using machinery the file already ships.

### C5-08 — Add ARIA semantics to controls, overlays, and banners

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

cc.js has zero aria attributes. In buildDom: give the four glyph-only control keys aria-labels ('Move left', 'Jump — hold to float', 'Duck', 'Move right'); set role='dialog' + aria-modal='true' + aria-label on the question panel and game-over panel; mark mileBanner/bioBanner/turnBanner as an aria-live='polite' region (turnBanner 'assertive' since it is time-critical) and the canvas as aria-hidden. Verify headless with DOM attribute assertions after mount.

*Why:* Screen-reader and switch users get named controls and announced warnings instead of unlabeled triangle glyphs and silent flashing text.

### C5-09 — Add a bottom action row after the review list on results

**Surface:** pe-exam · **Files:** practice-exams/results.js, practice-exams/styles.css · **Effort/Risk:** S/low

The results page was 14,563 px tall with only 25 questions (roughly 3x that at 75), and Retake / Back to home exist only above the review list — nothing follows it (verified headless). Append a second .pe-results-actions row after .pe-review with Retake and Back to home wired to the same opts callbacks, plus a ghost "Back to top" button calling window.scrollTo(0, 0). Verify headless by asserting elements exist after .pe-review and that clicking bottom Retake restarts an exam.

*Why:* After reading through a long review, the next action is one click away instead of a 14k-pixel scroll back up.

### C5-10 — Title polish: Enter plays a seed, music toggle updates in place

**Surface:** ww-screens · **Files:** wwtbane/src/shell/ui/screens.js, wwtbane/src/shell/main.js · **Effort/Risk:** S/low

Two verified title-screen frictions: pressing Enter in the seed input does nothing (screen stays 'title'), and clicking the music toggle calls showTitle(), which replays the branded screen wipe, rebuilds the whole screen, and warps focus to the H1 (all confirmed headless). In screens.js, wrap the seed controls in a form whose onsubmit preventDefaults and calls ctx.onStart('seeded', value); for the toggle, update the existing button's textContent and aria-pressed in place, and in main.js make onToggleMusic apply/persist the setting without re-rendering the screen.

*Why:* Enter-to-submit matches universal expectation, and toggling music no longer flashes a full-screen wipe or steals keyboard focus.

## Review verdicts

Inline adversarial review — all premises re-verified against the current tree
(the Codex's Escape/topback exists at shell:1126/1199 while showSettings has
neither; cc.js has literally zero aria attributes; ARM's three aria hits are
cycle-4's switches). **All 10: PASS.**

