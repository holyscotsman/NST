# Optimization Cycle 04 — plan (target: v1.5.0)

Ten items from the reviewed survey backlog. Inline adversarial review: premises
re-verified against the current tree before implementation; verdicts below.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C4-01 | home | Load the bank on selection: question count in the hint, errors surfaced early | M/low |
| C4-02 | home | Modal + picker a11y micro-pass: aria-live hint, overscroll containment, aria-haspopup | S/low |
| C4-03 | pe-practice | Stamp exam attempts with their question bank and show it in Recent attempts | S/low |
| C4-04 | pe-exam | Show time used on the results screen and store it in attempt history | S/low |
| C4-05 | arm | Make the settings toggles keyboard-reachable real switches | S/low |
| C4-06 | arm | Low-shield danger state on the HUD shield meter | S/low |
| C4-07 | kbb | Let the shop sell into the Hangar's paid 5th consumable slot | S/low |
| C4-08 | cc | Fire on-screen lane/duck buttons on pointerdown | S/low |
| C4-09 | cc | Celebrate the personal best on the game-over screen | S/low |
| C4-10 | ww-screens | Add a Green room button to the title screen | S/low |

## Instructions

### C4-01 — Load the bank on selection: question count in the hint, errors surfaced early

**Surface:** home · **Files:** scripts/nst-home.js · **Effort/Risk:** M/low

When a hero bank button is clicked (scripts/nst-home.js:190), also call Bank.load(b.id): on success set the hint to '<title> · <N> questions — open a tool below to study it.' and stash the count on the manifest entry so the Settings rows' existing '· N questions' branch (line 119, currently dead — the manifest has no count field) starts rendering; on failure show 'Couldn't load this bank — <Retry>' in the hint. Bank.load is already cached per page and warms the HTTP cache for the tool the user opens next. Files are 16KB/376KB so this is cheap and only runs on an explicit click.

*Why:* Users see what they just armed (size matters: 25 vs ~200+ questions) and a broken bank file fails loudly at the launcher instead of as a silently empty tool.

### C4-02 — Modal + picker a11y micro-pass: aria-live hint, overscroll containment, aria-haspopup

**Surface:** home · **Files:** scripts/nst-home.js, styles/nst-home.css, index.html · **Effort/Risk:** S/low

Three verified one-liners: (1) add aria-live="polite" to .nst-cert-hint and the Settings 'Selected — reopen a tool' note so screen readers hear bank-selection feedback (currently silent apart from aria-pressed); (2) add overscroll-behavior: contain to .nst-modal-overlay (currently 'auto') so scrolling past the modal's end on mobile can't chain to the page behind (body is scrollable at 360px); (3) add aria-haspopup="dialog" to the settings gear and an aria-label on the nav bank chip ('Question bank: NCP-MCI — choose') since its bare text lacks context.

*Why:* Screen-reader users get confirmation of the app's single most important choice, and the mobile modal stops leaking scroll to the page behind it.

### C4-03 — Stamp exam attempts with their question bank and show it in Recent attempts

**Surface:** pe-practice · **Files:** practice-exams/engine.js, practice-exams/app.js, practice-exams/styles.css · **Effort/Risk:** S/low

engine.saveAttempt stores mode/pct/pass/total but not which bank was active, yet the entry screen lets you switch between the 25-question and 255-question NCP-MCI banks in place and renders one global history list — a PASS on the small bank is indistinguishable from one on the full bank. In engine.saveAttempt, merge in bank: bankMeta().name (or window.NSTBank.active()) when absent; in app.js history rows, render the bank name as a muted suffix (old unstamped rows just omit it). Extend engine-test.mjs with a stamp assertion.

*Why:* Users can tell which certification bank and set size each past score actually came from.

### C4-04 — Show time used on the results screen and store it in attempt history

**Surface:** pe-exam · **Files:** practice-exams/exam-mode.js, practice-exams/results.js, practice-exams/styles.css · **Effort/Risk:** S/low

The exam knows totalMs and endTime but discards them at submit — results never says how long the sitting took. In doSubmit(), compute usedMs = totalMs - Math.max(0, endTime - Date.now()), clamp to totalMs, pass { timeUsedMs, limitMs } through the existing results opts, and render a line under .pe-score-frac (e.g. "Time used 41:32 of 90:00") reusing the existing mm:ss formatter; also add durationMs to the saveAttempt() payload. Verify headless by submitting a short exam and asserting the time line renders and localStorage history rows carry durationMs.

*Why:* Students see their pacing at a glance — the key readiness signal a timed practice exam should give beyond pass/fail.

### C4-05 — Make the settings toggles keyboard-reachable real switches

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

toggleRow() (line ~2478) builds the Music/SFX/Reduced-motion/Extra-time/Smooth-difficulty switches as plain <div class="arm-sw"> — verified Tab skips all five. Build them as <button class="arm-sw"> (btn() helper already exists) with role="switch", aria-checked kept in sync in the click handler, and an :focus-visible outline rule in CSS(); Space/Enter then work for free. Verify headless: query role/aria-checked, Tab to a switch, press Space, assert the class and aria-checked flip.

*Why:* Keyboard and screen-reader players can actually change audio and accessibility settings instead of being locked out of the very menu meant for them.

### C4-06 — Low-shield danger state on the HUD shield meter

**Surface:** arm · **Files:** starnix/arm.js · **Effort/Risk:** S/low

The 6px aqua shield bar never changes appearance; only the music layer reacts (updateDangerMusic, ≤25% with 35% hysteresis). Mirror that exact hysteresis in hud()/damage(): toggle a 'low' class on the shield row (mShield's parent) that switches the fill to COL.peach with a soft opacity pulse (animation disabled under .arm-reduce and prefers-reduced-motion, brighter static glow instead). Verify headless: drive shields down via __armTest.forceTimeout() field scans, assert the class appears, refillShields() clears it above the 35% line.

*Why:* Players stop dying 'out of nowhere' — the moment shields hit critical is visible at a glance, not just a subtle music shift.

### C4-07 — Let the shop sell into the Hangar's paid 5th consumable slot

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** S/low

renderShop line 3045 computes cfull with CONFIG.consumableCap (4), but the engine (shopBuyConsumable, line 882) honors run.consumableCap, which the 50-salvage Hangar 'Consumable rack' raises to 5. A rack owner holding 4 consumables sees 'Slots full' and disabled buy buttons for a purchase the engine would accept. Change the check to run.consumables.length >= (run.consumableCap || CONFIG.consumableCap), mirroring the engine, and rebuild.

*Why:* A meta-progression unlock players grind salvage for stops being silently unusable in the shop UI.

### C4-08 — Fire on-screen lane/duck buttons on pointerdown

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

kLeft/kRight/kDuck use bindBtn (click), which fires only after pointerup — jump already uses pointer events via bindHold. Add a bindTap(btn, fn) helper using pointerdown + preventDefault (the .cc-key CSS already sets touch-action:none) and use it for the three tap keys, dropping their click binding to avoid double-fire. Verify headless by dispatching pointerdown on the buttons and asserting sim.player.lane / ducking via the window.CC._lastSim seam.

*Why:* Touch players get ~50–150 ms faster dodge response, which is the difference between a clean dodge and a shield loss at 84 m/s.

### C4-09 — Celebrate the personal best on the game-over screen

**Surface:** cc · **Files:** starnix/cc.js · **Effort/Risk:** S/low

showOver() already loads the profile and updates prof.bests.CC, but the player is never told. Inside the existing persistence promise, append a stats row: '★ NEW PERSONAL BEST' (gold, reusing .cc-row) when sim.runStats.points beat the prior best, else 'Best: X.XX km' showing the target. Add a dedicated el.ovrBest div in buildDom so the async fill has a stable slot. Verify headless by mounting with a mock persistence returning a known best and asserting the rendered row text for both branches.

*Why:* The death screen answers the question every runner asks — 'was that my best?' — turning a crash into a reason to run again.

### C4-10 — Add a Green room button to the title screen

**Surface:** ww-screens · **Files:** wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

main.js already passes onGreenRoom to TitleScreen (main.js:304) but TitleScreen never renders it — verified headless that the title's only buttons are Start/Main menu/Play seed/Help/Settings/Music, so a player who returns to the title with banked coins cannot reach the shop without losing a run first. In wwtbane/src/shell/ui/screens.js TitleScreen, add a secondary button '🛋 Green room' next to 'Start new game' (shown once ctx.stats.runs > 0 or wallet > 0) that calls ctx.onGreenRoom(). Verify headless: click it and assert the green-room screen renders.

*Why:* Players with coins can recharge lifelines and call Steve before a run instead of hitting a dead end at the title.

## Review verdicts

Inline adversarial review — every premise re-verified against the current tree
(grep + code read; the KBB shop-cap and ARM toggle premises confirmed at their
exact lines). **All 10: PASS.** Notes: C4-07's engine is already rack-aware at
three sites — only the shop RENDER check lags; C4-10's onGreenRoom handler is
already passed in, TitleScreen just never rendered a control for it.

