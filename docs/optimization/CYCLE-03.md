# Optimization Cycle 03 — plan (target: v1.4.0)

Ten items from the reviewed survey backlog (40 unconsumed candidates). Inline
adversarial review this cycle: each premise re-verified against the CURRENT
code (cycles 1-2 changed several of these files) before implementation;
verdicts recorded below.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C3-01 | pe-practice | Stop losing keyboard focus and palette scroll on option select | M/low |
| C3-02 | pe-exam | Update the question palette in place instead of rebuilding it every render | M/low |
| C3-03 | pe-practice | Confirm before exiting Practice mode with progress | S/low |
| C3-04 | cc | Make the question overlay keyboard-operable | M/low |
| C3-05 | arm | Add keyboard answering to the question panel | S/low |
| C3-06 | kbb | Surface engine log feedback (renderLog is a no-op, consumables are silent) | S/low |
| C3-07 | ww-quiz | Let a click/tap skip the answer read-out stagger | M/low |
| C3-08 | ww-screens | Keep focus on the shop control after green-room purchases | S/low |
| C3-09 | sx-shell | Hide the cinematic mission panel until its reveal beat | S/low |
| C3-10 | cross | Make Google Fonts non-render-blocking on launcher and Practice Exams | S/low |

## Instructions

### C3-01 — Stop losing keyboard focus and palette scroll on option select

**Surface:** pe-practice · **Files:** practice-exams/practice-mode.js · **Effort/Risk:** M/low

selectOption() calls renderCard(), which rebuilds the card and all palette chips (255 buttons in full-bank practice) and re-centers the strip via centerPalette — verified: after selecting an option, document.activeElement is BODY. Fix: in renderCard, capture the focused option's data-i before rebuilding and re-focus the matching .pe-opt after; skip buildPalette()/centerPalette() when only the selection changed (palette state only changes on check/navigate). Multi-select questions benefit most — each toggle currently throws keyboard users back to the top of the document.

*Why:* Keyboard and screen-reader users keep their place while answering, and full-bank sessions stop rebuilding 255 DOM nodes per click.

### C3-02 — Update the question palette in place instead of rebuilding it every render

**Surface:** pe-exam · **Files:** practice-exams/exam-mode.js · **Effort/Risk:** M/low

buildPalette() wipes paletteEl.innerHTML and recreates all N buttons (up to 75) on every answer selection, navigation, and flag toggle; a keyboard user who activates a chip loses focus to <body> (verified headless). Split into buildPalette() (once at start) and updatePalette() that toggles the current/answered/flagged classes and refreshes aria-labels on the existing buttons, then call updatePalette() from renderCard(). Focus stays on the activated chip and per-render DOM churn drops from N node creations to N class toggles.

*Why:* Keyboard users keep their place in the palette and every answer/navigation renders with less jank on long exams.

### C3-03 — Confirm before exiting Practice mode with progress

**Surface:** pe-practice · **Files:** practice-exams/practice-mode.js, practice-exams/ui.js · **Effort/Risk:** S/low

The '← Modes' button in practice-mode.js exits immediately, discarding all answered questions; Exam mode already guards exit with confirmModal but that helper is private to exam-mode.js. Add a small shared ui.confirm(title, body, confirmLabel, onConfirm) in ui.js (the .pe-modal CSS already exists in styles.css, including focus-trap patterns to copy from exam-mode), and call it from the practice exit handler only when answeredCount() > 0 — zero-progress exits stay instant.

*Why:* An accidental click no longer silently wipes a long study session, matching the protection Exam mode already has.

### C3-04 — Make the question overlay keyboard-operable

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** M/low

onKey only early-returns on PHASE_OVER, so during a question Space/arrows are swallowed by preventDefault — Space can't activate the focused Continue button and the scrollable explanation can't be arrow-scrolled. Guard onKey to return early whenever sim.phase !== PHASE_RUN (or the intro/how-to is up). Then add: focus overlayBtns[0] in showQuestion(), and 1–9 / A–D hotkeys that click the matching option (toggle selection for multi, Enter submits). Verify headless via dispatched keydown events and window.CC._lastSim.lastResult.

*Why:* Keyboard players answer gate questions without reaching for the mouse, and Space/scroll stop being mysteriously dead in the overlay.

### C3-05 — Add keyboard answering to the question panel

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

In arm.js, extend the existing window keydown wiring (near bindGlobalInput / the BRIEF 1-2-3 handler at line ~643) with a QUESTION/DEPOT_Q branch: Digit1-Digit6 (and Numpad) click the matching visible .arm-opt button (toggle selection for multi-answer questions), Enter/Space triggers the visible Submit button or Continue once answered. Guard on pendingQuestion, !paused, and button.disabled so it cannot double-answer. Verify headless by dispatching KeyboardEvents and asserting via root.__armTest.hasQuestion()/answer flow and option class marks.

*Why:* Desktop pilots fly with WASD and pick briefing options with 1/2/3, then must grab the mouse for every core scan — keys make the core loop uninterrupted.

### C3-06 — Surface engine log feedback (renderLog is a no-op, consumables are silent)

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** S/low

renderLog (line 3191) guards on s.logEl which is never created anywhere, so every engine log line — 'Overcharge armed', 'Stasis field', 'Lazarus Protocol: survived at 1 HP', siphon shield rips, surge charged — never reaches the DOM, and onUseConsumable gives zero textual feedback. Create the missing log element in mount (a one-line status strip in leftCol under the coins panel, dim styling to match kbb-eyebrow) so renderLog works, and call the existing toast(s, ...) with the newest run.log entry from onUseConsumable.

*Why:* Using a Repair Kit or Stasis Field currently changes numbers with no acknowledgment; players finally see what their items and once-per-run saves actually did.

### C3-07 — Let a click/tap skip the answer read-out stagger

**Surface:** ww-quiz · **Files:** wwtbane/src/shell/ui/overlay.js · **Effort/Risk:** M/low

showQuestion staggers option reveal via readoutPacing (measured 5.2s for a short 4-option question, up to ~9s for long stems with 6 options) and clicking does nothing. Track the reveal timers separately in overlay.js and add a pointerdown listener on this.card (plus Space in handleKey) that, while any option is still .unrevealed, clears those timers and reveals all remaining options at once (reusing the existing per-option reveal body, firing onReveal only once, then _applyRoving). Verify headless: click the stem 200ms after showQuestion and assert no .option.unrevealed remains and all buttons are enabled.

*Why:* Permadeath means players replay the easy tier constantly; skipping the forced 5-9s read-out on questions they've already seen removes the single biggest per-question wait.

### C3-08 — Keep focus on the shop control after green-room purchases

**Surface:** ww-screens · **Files:** wwtbane/src/shell/main.js, wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

Every Buy 2nd slot / Refill / Call Steve click re-renders the whole green room via _swap, which moves focus to the H2 heading (verified headless: focus jumps from 'Buy 2nd slot · 3,000' to '🛋 The green room') and replays entrance animations. Give the shop buttons stable ids in screens.js (e.g. id: `buy-slot-${type}`, 'refill-btn'), add an option to Game._swap to skip the heading-focus, and in _renderGreenRoom record document.activeElement.id before the swap and refocus that id (or its nearest enabled sibling) afterwards.

*Why:* Keyboard and screen-reader users can buy several upgrades in a row without being thrown back to the top of the screen each click.

### C3-09 — Hide the cinematic mission panel until its reveal beat

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

The finale mission panel (.sx-mission, built in showCinematic around lines 245-265) is appended at cinematic start with only inline opacity:0, while the CSS rule at line ~1746 sets pointer-events:auto. Verified in Chromium: a center-screen click 1.5s into the ~15s intro hits an invisible mission button and silently navigates away; its three buttons are also in the Tab order. Fix: set mission.style.visibility='hidden' at creation, flip to 'visible' in the frame loop when T >= B.mission (same spot that fades opacity, line ~605), and guard the delegated click handler with if (T < B.mission) return. Visibility:hidden also removes the buttons from tab order.

*Why:* Players can no longer accidentally launch a mission (or get yanked out of the intro) by clicking or tabbing during the cinematic.

### C3-10 — Make Google Fonts non-render-blocking on launcher and Practice Exams

**Surface:** cross · **Files:** index.html, practice-exams/index.html · **Effort/Risk:** S/low

Both index.html and practice-exams/index.html load fonts.googleapis.com CSS as a blocking <link rel="stylesheet">; on a slow or blocked network (reproduced in the sandbox: ERR_CONNECTION_RESET) first paint stalls until the request fails. Switch to the async pattern: <link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"> plus a <noscript> stylesheet fallback. The CSS already declares full system-font fallback stacks and display=swap, so nothing else changes.

*Why:* The launcher and PE paint immediately on slow or offline networks instead of hanging white on a third-party CDN.

## Review verdicts

Inline adversarial review (premises re-verified against the current tree in one
sweep; risk assessed per item against cycles 1-2's changes). **All 10: PASS.**

Notes folded into implementation:
- **C3-01/02:** both palettes become build-once / update-in-place; practice must
  preserve the C1-04 Enter-advance and C2-06 verdict-clear paths that run
  through renderCard; focused option is re-focused after the card rebuild.
- **C3-04:** the guard must return WITHOUT preventDefault outside PHASE_RUN so
  the browser's native Space/arrow behavior reaches the overlay's buttons.
- **C3-05:** DOM-driven and phase-agnostic — digits click a visible .arm-opt,
  Enter/Space the visible submit; inert when no panel is up.
- **C3-06:** logEl is created in kbb.js's battle panel (never the built
  index.html); renderLog call sites confirmed live.
- **C3-10:** preload+onload swap with a <noscript> fallback; preconnects stay.

