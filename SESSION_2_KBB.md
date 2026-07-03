# Session 2 — Kuiper Belt Battle (KBB) work order

**You own:** spec doc `03` and the module `kbb.js`. **Do not touch** the contract (`01`), shared core, or the shell — if you think you need a contract change, **stop and flag it for the Core chat**. KBB is the card-battler roguelike: answer exam questions to power attacks against a BCM warship; buy artifacts/consumables between battles.

**Start from the current `kbb.js` the Core chat is handing you** (project copy is ~9 versions stale; it already has the ring HUD, the shop offset, the animated how-to, and the retuned combat). Edit `kbb.js` only; keep it standalone. **Learning integrity:** never AI-author or alter answer keys. The `kbb` checks in `verify-build.mjs` and the `kbb-balance.cjs` probe must stay green. Layout/feel is browser-only.

**Jason will drop the annotated KBB screenshot (the four colored zone boxes) into this chat — it is the spec for task 1.**

---

## Tasks

### 1. Four strictly non-overlapping zones — highest priority
From Jason's annotated screenshot, four regions that must **never overlap, at any phase**:
- **GREEN (left column):** squad only — health rings, metrics/stats, coins, artifacts. **No combat ships here** (today a small squadron is drawn into this card and combat ships bleed beside it — remove that).
- **RED (top-center):** combat zone — *only* the ship-battle animation over a **looping Kuiper-Belt background** (task 2).
- **BLUE (top-right):** enemy data only — name, the renamed attack stat (task 4), HP ring.
- **YELLOW (bottom):** questions only.

Rebuild the layout as a clean non-overlapping grid; verify on a laptop/landscape viewport. Acceptance: pre-run shop, battle, between-battle shop, and lost screens all show **zero overlap**. Browser-only — this is the central ask.

### 2. Looping Kuiper-Belt background — code-gen + asteroid sprites
Red zone wants "a cool looping background of flying through the Kuiper Belt." Build the **motion code-generated** (seamless parallax scroll suggesting forward flight) and populate it with the **5 asteroid sprites** (`kbbAsteroid1`–`5`, see `ASSET_PROMPTS.md`) drifting/tumbling at varied depths, plus a code-gen starfield/nebula behind. Until the asteroid PNGs land, fall back to simple code-drawn rocks. Browser-only.

### 3. Artifact hover tooltips — DOM
Each owned/offered artifact shows, **on hover** (and on keyboard focus), a tooltip explaining what it does, pulled from the artifact's `description`/effect data. Keep it within the green zone's bounds (don't violate task 1).

### 4. Rename "Intent" → "Incoming Attack" + pulsating-red alert — copy + animation
"Intent" confuses Jason; it's the enemy's **attack damage dealt after each of your turns**. Rename the **user-facing label** to **"Incoming Attack"** (internal `intent` var can stay), and fix the artifact/consumable copy that says "intent" (the reveal-intent artifact, the `intel` consumable) accordingly. **Plus:** when the enemy is **about to attack**, make the indicator **glow and gently pulsate red** until the attack fires — an alert telling the user a hit is coming. Acceptance: the word "Intent" no longer appears player-facing; the alert pulse is visible before each enemy hit.

### 5. Enemy + squadron sprites — attempt **3D**, fallback 2D — ASSET-GATED
Jason wants better art for the **enemy**, the **boss**, and the **three hero ships** (separate, so they move independently), and wants you to **try 3D** for the combat zone (Three.js is already loaded for CC). Practical path, since assets are images not models: render the combat zone as a **Three.js scene using the generated sprites as billboards** (textured planes with depth, perspective, lighting, parallax) — that delivers the 3D feel from 2D assets. If the 3D scene doesn't pan out, **fall back to the current 2D canvas** combat zone using the same sprites. Either way write the code path to consume `assets.kbbHero1/2/3`, `assets.kbbEnemy`, `assets.kbbBoss` (prompts in `ASSET_PROMPTS.md`) **with fallbacks** so KBB runs before assets land. Combat-zone convention: **player ships on the left facing right, enemy on the right facing left.** (Flag to Core if the 3D path needs anything from the contract/shell.)

---

## Deliver back to Core
Updated `kbb.js` + updated `03` + a short changelog + verification notes (call out the layout and the 3D attempt explicitly — both browser-only). Add `pause()` (freeze rAF + battle/timer state) and `resume()` and expose on mount per Core's signature. Core merges, rebuilds, runs verify + the 6 harnesses + the balance probe, inlines assets, and wires the pause overlay.
