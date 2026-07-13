# WWTBANE — UI & animation design brief

*For Claude Designer. This document is the full spec; the short prompt to paste alongside it is at the very end.*

---

## 1. What you are designing

**"Who Wants to be a Nutanix Engineer?"** — a neon game-show quiz played in the browser. A 3D WebGL studio (already built) sits behind everything as a live backdrop; **all UI you design is a DOM overlay** floating above that canvas. The player answers 30 questions in a row to win. One wrong answer ends the run, but coins "bank" at safe havens along the way.

Design the **overlay UI and its animation choreography**. The 3D studio behind it is not your problem — treat it as a dark, atmospheric stage with drifting colored light beams, and make the UI read cleanly on top of it.

**Deliverable:** a single self-contained HTML/CSS/vanilla-JS mockup (dummy data is fine) showing the main game screen at desktop **1440×900** plus a mobile variant (~390×844), with the animations below implemented so they can be previewed by clicking through a fake question. No frameworks, no external assets, no CDN requests.

---

## 2. Brand & identity (non-negotiable)

- **Palette** — use these and only these as the accent system, on near-black glassy panels:
  | Name | Hex | Role |
  |---|---|---|
  | Iris | `#7855FA` | primary brand, easy/medium ambience, glows |
  | Aqua | `#1FDDE9` | interactive highlights, selection, medium tier |
  | Mantis | `#92DD23` | correct / banked / success |
  | Peach | `#FF6B5B` | wrong / danger, hard tier |
  | Gold | `#FFC857` | money, the final question, "locked in" suspense |
  - Background base: `#04040a`. Panels: translucent dark glass (`rgba(12,12,26,0.72)` + `backdrop-filter: blur`), 1px `rgba(255,255,255,0.12)` borders, soft outer glow in the accent color where it matters.
- **Typography:** Montserrat only (400/600/700/800). **Sentence case everywhere** — never Title Case, ALL CAPS only for tiny letter-spaced labels (like "banked").
- **Original identity only.** Evoke "big-money quiz show" through light, glass, and gold — but do **not** copy any real show's trade dress: no hexagonal answer lozenges, no recreations of the Millionaire look, logo, or music. Rounded-rectangle geometry, our palette, our wordmark.
- Tone: confident, warm, a little theatrical. Not corporate, not childish.

---

## 3. The game screen — layout (this is the key change)

Three fixed anchors around a center stage. The 3D studio fills the viewport behind everything.

```
┌────────────────────────────────────────────────────────────┬─────────┐
│ ┌─────────────────┐                                        │  Q30 ★  │
│ │ 🪙 coins earned │   (upper-left corner, stacked)         │  Q29 ▲🛡 │
│ │ banked 🛡 6,000  │                                        │  Q28 ▲  │
│ │ playing 8,500   │                                        │   ...   │
│ ├─────────────────┤                                        │  Q21 ▲  │
│ │ ½   👥   📞     │  ← lifeline medallions, below coins    │  Q20 ◆🛡 │
│ └─────────────────┘                                        │   ...   │
│                                                            │  Q11 ◆  │
│                 (open stage — 3D studio                    │  Q10 ●🛡 │
│                  visible through here)                     │   ...   │
│                                                            │  Q2  ●  │
│        ┌────────────────────────────────────┐              │  Q1  ●  │
│        │  Q14 · Medium        [domain chip] │              │         │
│        │  Question text sits lower-center…  │              │  money  │
│        │  ┌───────────┐  ┌───────────┐      │              │  ladder │
│        │  │ A  option │  │ B  option │      │              │  (right │
│        │  └───────────┘  └───────────┘      │              │  rail,  │
│        │  ┌───────────┐  ┌───────────┐      │              │  full   │
│        │  │ C  option │  │ D  option │      │              │  height)│
│        │  └───────────┘  └───────────┘      │              │         │
│        │            [ Final answer ]        │              │         │
│        └────────────────────────────────────┘              │         │
└────────────────────────────────────────────────────────────┴─────────┘
```

- **Upper-left corner cluster** (fixed):
  1. **Coins earned** panel on top — two rows: `banked 🛡 6,000` (mantis, with the shield) and `playing for 8,500` (gold). Small "next safe haven: Q20 → 6,000" hint line beneath in muted text.
  2. **Lifelines** directly below — three circular/rounded **medallions**: ½ (50:50), 👥 (ask the audience), 📞 (phone a friend). Each shows its glyph large, its name in a tiny label on hover/focus, and a small `2/2` charge pip when a second slot is owned. *(If you think coins-below-lifelines reads better, show both orders — the cluster stays upper-left either way.)*
- **Right rail — the money ladder**, full height, fixed to the right edge:
  - **Vertical**, Q1 at the bottom → Q30 at the top. The player climbs *upward*.
  - Each rung: question number, tier glyph, coin value. Tier glyphs + colors (never color alone): ● aqua easy (Q1–10), ◆ iris medium (Q11–20), ▲ peach hard (Q21–29), ★ gold final (Q30).
  - **Safe havens** (Q10, Q20, Q29) get a 🛡 marker and a faint mantis background band.
  - Current rung: gold border + glow, slightly scaled up. Cleared rungs: dimmed, values tinted mantis. The rail auto-scrolls so the current rung stays comfortably in view.
- **Center-lower: the question card.** Glass panel, max-width ~720px, sitting in the lower half so the studio stays visible above it. Contains: meta chips (`Q14 · Medium`, domain, `select all that apply` when multi), the question stem (large, 700 weight), the 2×2 option grid (single column on narrow widths), and the gold **Final answer** button. Options are rounded rectangles with a square letter chip (A/B/C/D) on the left and a state mark (✓/✗) slot on the right.
- Small **seed chip** (`Seed NTNX-8F3K2Q`, monospace) tucked bottom-left, only on seeded runs.

**Mobile:** ladder collapses to a horizontal scrolling strip pinned to the top edge; the coins+lifelines cluster becomes a compact top-left row beneath it; the question card goes full-width with stacked options.

---

## 4. Other screens (brief direction, same language)

- **Title:** centered wordmark — "who wants to be a" (small, letter-spaced, muted) over "Nutanix Engineer?" (huge, 800, aqua→iris→mantis gradient text with an iris glow). Primary gold-glow "Start a run" button, ghost "Green room" button, collapsible "Play a shared seed" input.
- **Green room:** warm shift — the same glass panels but with gold/amber lighting cues. A shop list (lifeline slots, recharge) and a distinct **Steve** panel styled like a private phone call: portrait silhouette, italic quoted clue with a gold left border.
- **Results:** win = gold everything, trophy emblem, "You are a Nutanix Engineer!"; loss = subdued, with a "the correct answer was…" reveal panel (mantis answer text) and the explanation. Big single primary action.

---

## 5. Animation choreography — be exact

House easing: `cubic-bezier(0.22, 1, 0.36, 1)` ("swift-out") for entrances, `ease-in-out` for loops. All animations are keyed to these game events (the app emits them on an event bus — name your keyframes/classes to match):

| Event | Animation |
|---|---|
| `question:show` | Card rises 16px + fades in, 350ms. Options stagger in A→D at 60ms intervals (translateY 10px + fade). Meta chips pop 120ms before the stem. |
| option selected | 120ms scale 1.00→1.03→1.00 pulse; aqua border + inner glow snaps on. |
| `answer:lock` (Final answer pressed) | **The suspense beat.** Selected option turns gold, breathing glow pulse (opacity 0.6↔1.0, 900ms cycle, max 2 cycles ≈ 1.8s) while everything else dims to 60%. Then the reveal fires. |
| `answer:correct` | Correct option flashes mantis (250ms), ✓ stamps in with a 1.2→1.0 scale settle. Coin "playing for" number **counts up** over 600ms (tabular numerals, no layout shift). Ladder: current-rung glow slides up one rung, 400ms, with a brief gold trail. |
| `coins:bank` (safe haven) | The moment to celebrate: the "playing for" value flies (a small gold coin particle arc, 3–5 particles, 700ms) into the "banked" row; shield icon stamps with a 1.3→1.0 bounce; banked value counts up in mantis; the safe-haven rung on the ladder pulses mantis once. |
| `answer:wrong` | Chosen option shakes horizontally (±6px, 3 cycles, 300ms) and settles peach with ✗; the actually-correct option lights mantis 200ms later. Whole card desaturates slightly. Ladder glow drops down to the last safe-haven rung, 500ms, ease-in. |
| `lifeline:use` 50:50 | The two removed options **power down**: quick flicker (2 opacity dips within 250ms — well under any strobe threshold), then collapse to 25% opacity with a strike-through, slight scale-down to 0.98. |
| `lifeline:use` audience | A poll panel slides down from the card's meta row. Bars grow left→right with 80ms stagger, 500ms each, ease-out; the winning bar gets a mantis→aqua gradient and lands last. Percentages count up alongside. |
| `lifeline:use` phone | A phone panel slides in; the friend's line types on (typewriter, ~30 chars/sec) inside a quote. No countdown timers anywhere — this game deliberately has none. |
| any lifeline spent | Its medallion drains: glyph desaturates, a radial wipe dims the face, charge pip flips 2/2→1/2 with a small flip animation. |
| `run:win` | Gold takeover: vignette warms, ladder crowns with a ★ burst, 12–20 slow-falling gold confetti particles (DOM/CSS only), result screen crossfades in. |
| `run:dead` | 400ms dim-to-quiet, then the results screen rises. Somber, not punishing. |
| screen navigation | Outgoing screen fades 150ms; incoming rises 16px + fades 250ms. Never both animating directions at once. |

**Idle life:** the current ladder rung breathes very subtly (glow 0.85↔1.0, 3s cycle); lifeline medallions have a faint specular sweep every ~8s. Nothing else moves at idle.

---

## 6. Hard constraints (the app enforces these — the design must too)

- **Reduced motion** (`prefers-reduced-motion` or in-game setting): every animation above collapses to an instant cut — no glides, no pulses, no particles, no typewriter (text appears whole), counters jump to their final value. Design must look complete and intentional in this mode, not broken.
- **No strobing.** Nothing flashes more than ~2 times in quick succession; everything stays well under 3 Hz.
- **Colorblind-safe:** every state carries a glyph or text as well as color (✓/✗, 🛡, tier shapes ●◆▲★, strike-through on removed options).
- **Keyboard + touch first-class:** visible 3px gold focus rings; option hit areas ≥ 48px tall; keys 1–4/A–D select, Enter locks.
- **No timers, ever.** No countdowns, no urgency meters.
- The quiz must remain real DOM text (screen readers) — never bake question text into images/canvas.

---

## 7. Existing DOM hooks (map your design onto these)

The shipped app already uses these class names — reusing them makes the design drop-in: `.hud`, `.coins`, `.coin-amt.banked`, `.coin-amt.playing`, `.lifelines`, `.lifeline.ll-fifty/.ll-audience/.ll-phone`, `.ladder`, `.rung` (+ `.current`, `.cleared`, `.safe`, `.tier-easy/medium/hard/extreme`), `.q-card`, `.stem`, `.options`, `.option` (+ `.selected`, `.removed`, `.is-correct`, `.is-wrong`), `.opt-letter`, `.lock-btn`, `.audience`, `.aud-bar`, `.phone`, `.feedback`, `.continue-btn`, `.seed-chip`.

---

## 8. Prompt to paste into Claude Designer

> Design the game screen for "Who Wants to be a Nutanix Engineer?", a neon game-show quiz, following the attached brief exactly. Build one self-contained HTML/CSS/vanilla-JS page (no frameworks, no external requests) with dummy data showing: the money ladder as a full-height vertical rail on the RIGHT edge (Q1 bottom → Q30 top, tier glyphs, safe-haven shields, current rung glowing), a coins-earned panel and the three lifeline medallions stacked in the UPPER-LEFT corner, and the question card lower-center over a dark stage background. Implement the full animation choreography from §5 — question entrance stagger, gold lock-in suspense pulse, correct/wrong reveals, coin count-ups, the safe-haven banking flourish with coin particles, ladder climb/drop, 50:50 power-down, audience poll bars, phone typewriter — with working demo buttons to trigger each state, plus a reduced-motion mode where every animation becomes an instant cut. Use only the five brand colors on dark glass panels, Montserrat, sentence case. Include a 390px-wide mobile variant (ladder becomes a top horizontal strip). Respect every constraint in §6: no strobing, no timers, glyphs alongside color, visible focus rings.

---

*Reference: the 3D studio prototype (`WWTBANE_studio_3d_prototype.html`) defines the backdrop's look — a dark stage disc with a glowing aqua rim, gold floor spokes, iris/aqua spotlight beams, a tiered silhouette audience, and the gradient wordmark panel. The overlay should feel like it belongs to that world: glass over neon.*
