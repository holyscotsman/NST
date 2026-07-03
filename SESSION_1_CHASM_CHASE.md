# Session 1 — Chasm Chase (CC) work order

**You own:** spec doc `04` and the module `cc.js`. **Do not touch** the contract (`01`), shared core, or the shell — if you think you need a contract change, **stop and flag it for the Core chat**. CC is the 3D endless runner (Three.js r128); camera sits behind-and-above the ship, flying forward down a sandstone chasm chasing the squadron.

**Start from the current `cc.js` the Core chat is handing you** (the project-knowledge copy is ~9 versions stale). Edit `cc.js` only; keep it standalone (Core concatenates). Headless smoke is `cc-view-smoke.mjs` (jsdom + a THREE stub with no real geometry — guard against it as the code already does); don't regress it. Layout/feel is browser-only — say what Jason should look for.

**Jason will drop the Chasm-Chase screenshot (the floating "brick wall" obstacle) into this chat — use it as the reference for task 1.**

---

## Tasks

### 1. Wall-curve obstacle (replace the floating brick) — code-gen, high priority
`OB_NARROW` is already correct conceptually — "a canyon-wall extension that closes ONE outer lane (3->2 lanes)," `SIDE_LEFT`/`SIDE_RIGHT` pick the sealed lane, collision is right (`if (o.type === OB_NARROW) return true`). **The problem is only the geometry:** it renders as a detached `BoxGeometry` chunk (the "brick wall"). Rework it so the **chasm wall itself bulges inward** to seal the lane — a smooth inward curve **connected to the wall and extended** along Z (a spur/promontory, not a floating box), tapering back out so the lane reopens past it. Reuse `_jagInnerFace()` so the bulge matches the craggy wall. Keep the collision span exactly. Acceptance: reads as the canyon narrowing, no seam between bulge and wall. Browser-only.

### 2. Much faster + better motion frame-of-reference — code-gen, high priority
Current `BASE_SPEED 22`, `MAX_SPEED 46`, `SPEED_RAMP 0.0009` (distance-based). Do both levers: **raise the speed** (respect `MIN_GAP >= MAX_SPEED * JUMP_TIME` so rows stay dodgeable) **and add motion reference** so speed reads — denser/closer wall striations or passing wall markers, ground streaking, edge speed-lines, a slight FOV/shake ramp with speed, particles streaming past. Perceived speed comes from reference points passing the camera, not the number. Browser-only.

### 3. Ground darker than the walls — code-gen now, texture later
The chasm **floor must read clearly darker than the side walls**. Do it now by darkening/tinting the ground material relative to the walls (keep striation). A dedicated darker ground texture (`assets.ccGround`) is also being generated — wire the code path to use it when present, fallback to the tint. Browser-only.

### 4. Invuln glow vs. damage flash + shield-loss grace — code-gen
Split feedback by meaning: **core-get / invulnerable = soft pulsating glow** (gentle emissive/halo pulse for the i-frame window — reads "protected"). **Reserve flashing for damage / shield loss** (sharp flash). **Grace gap between shield losses:** after a shield drops, a short cooldown where another can't be lost, so you don't lose two back-to-back with no reaction. Tune the window; make it explicit in code. Look is browser-only; the grace-gap timing is logic you can reason about.

### 5. Atmosphere pass — code-gen
More realistic ambience: drifting dust/particulate, depth-fog tuning (chasm fades convincingly), light shafts from the sky lip, subtle color grade, parallax sky. Lightweight, code-generated. Browser-only.

### 6. Sprites / textures — ASSET-GATED (mechanics-independent)
Jason is generating the assets; **prompts live in `ASSET_PROMPTS.md`**. For CC: `ccShip` (rear-view player ship — billboard on a camera-facing plane is recommended over a 3D model for this fixed camera), `ccGround` (task 3), `ccBumps` (the low-rock/bump obstacle texture, separate from walls). Write each code path to consume `assets.<KEY>` **with a fallback** to current rendering so CC runs before assets land. Don't block tasks 1–5 on this.

---

## Deliver back to Core
Updated `cc.js` + updated `04` + a short changelog + verification notes (machine-checked vs. needs-Jason's-eyes). Add `pause()` (freeze rAF + sim/timers) and `resume()` and expose them on mount per Core's signature — CC already has internal `pause()/resume()`, so surface those. Core merges, rebuilds, runs verify + harnesses, inlines assets, and wires the pause overlay.
