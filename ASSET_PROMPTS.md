# StarNix — asset generation prompts (detailed)

Every image asset the June-25 wave needs, with a precise camera-correct view for each. Generate each, send to the **Core chat**; Core optimizes (downscale + WebP) and inlines as base64 in `assets.js` under the key shown; the game sessions consume `assets.<KEY>` with a fallback.

## How to use this
1. **The view is dictated by each game's camera — this is the #1 thing to get right.** Each game renders the ship from a fixed angle, so the sprite must match that exact angle or it looks wrong in-game. (This is what made `ccShip` come out as a side angle — see CC below.) Each asset states its view explicitly, including what to avoid.
2. **Each prompt is paste-ready.** Paste the asset's prompt, then append the **Style suffix** (next section) so the whole set stays visually consistent. Generate the set in one session/seed family if your tool supports it.
3. **Transparency:** ask for a transparent PNG with alpha. If the tool can't, generate the subject **on a flat, solid, pure-black background with no gradient, glow-bleed, or shadow**, and Core will key it out. Never put scenery behind a ship.
4. **Resolution:** 1024×1024 square is the default. For the elongated warships (`kbbEnemy`, `kbbBoss`) you may use a 3:2 landscape canvas with the ship along the long axis. Subject centered, filling ~70–80% of the frame, even transparent margin.

## Style suffix (append to EVERY ship/asteroid prompt)
> "Semi-realistic modern sci-fi game art — clean readable forms, PBR-style materials (brushed and painted metal, matte composite panels, subtle edge wear and panel lines), a small cockpit/canopy and visible engine nozzles. NOT cartoon, NOT cel-shaded, NOT low-poly, NOT photoreal. Neutral light-grey / charcoal hull as the base. Soft neutral key light from the upper front with gentle fill, plus the ship's own emissive engine/trim glow; even and legible, no heavy dramatic shadows hiding the silhouette. Isolated subject on a **fully transparent background (PNG alpha)** — no scene, no stars, no nebula, no ground, no cast shadow, no text, no logos, no watermark, no UI, no humans, a single craft only. Centered, ~75% of frame, even margin, 1024×1024."

Palette for accents (use as glowing trim + engine light): **Iris `#7855FA`, Aqua `#1FDDE9`, Mantis `#92DD23`, Peach `#FF6B5B`, Gold `#FFC857`.** Allied ships = aqua / iris / mantis accents on grey hulls. Enemy (BCM) ships = **hot orange-and-red** engine/weapon glow on **darker gunmetal** hulls. This contrast (cool allies vs. hot enemies) is intentional and should hold across all of them.

---

# Chasm Chase (`cc.js`)
**Camera:** fixed, sitting **directly behind the ship and slightly above it**, looking forward down a sandstone chasm. The ship flies away from you. You are dead astern, looking at its back and the top of its hull.

### `ccShip` — player ship
**View (read carefully):** **Straight behind the ship, camera slightly elevated and pitched down onto its back.** We see the **rear of the fuselage and the top (dorsal) deck**, with both engine nozzles pointing **toward the viewer** (we're looking up the tailpipes). The ship is **perfectly symmetric left-to-right** — we are dead centre astern, not off to either side. Nose points **away into the distance** (toward the top of the frame). **Do NOT render a three-quarter view, a side view, or any left/right rotation; do NOT show the underside or the front of the ship.**
> **Prompt:** "A sleek single-seat sci-fi interceptor seen **from directly behind and slightly above (dead astern, looking at the rear and the top deck)**, flying away from the viewer down a canyon. Symmetric swept delta wings, smooth aerodynamic fuselage tapering to **twin engine nozzles at the rear that glow bright aqua/cyan and face the viewer**. A low bubble canopy near the front (only its top is visible from behind). Crisp aqua and violet neon trim lines running along the spine and the trailing edges of the wings on a light-grey hull with fine panel lines. Perfectly left-right symmetric, nose pointing away into the distance. [+ Style suffix]"

### `ccGround` — chasm floor texture
**View:** flat **top-down seamless texture** (applied to the floor plane). No objects, no directional shadows.
> **Prompt:** "A **seamless, tileable, top-down** canyon-floor texture: dark weathered stone and compacted sand with fine grit, hairline cracks, and small embedded pebbles. Muted, desaturated **dark brown-grey, noticeably darker than canyon walls.** Flat, even, shadowless lighting so it tiles invisibly; uniform with no large focal feature. Fills the entire frame, 1024×1024, tileable on all four edges. No objects, no text."

### `ccBumps` — low-rock obstacle texture (separate from the walls)
**View:** flat seamless texture, applied to the bump/low-rock obstacles.
> **Prompt:** "A **seamless, tileable** rocky-obstacle texture: clustered jagged rock rubble forming a low ridge, mid-grey stone with **sharper facets and harder edges than the floor, and slightly warmer in tone** so it reads as a distinct obstacle. Flat, even, shadowless lighting; tiles invisibly; fills the frame, 1024×1024, tileable. No objects, no text."

### `ccSky` — chasm sky backdrop
**View:** a wide atmospheric backdrop sitting far behind the action (the strip of sky above the canyon rim and the haze down the chasm ahead). Low-detail and unobtrusive — it must never compete with the gates, walls, or ship.
> **Prompt:** "A wide alien-planet sky backdrop seen from deep inside a canyon, looking up and forward: a dusky upper atmosphere graduating from deep indigo-violet at the top to a hazy teal-and-amber band near the horizon, a faint scatter of cool distant stars, and one soft, low-contrast nebula glow. Atmospheric, smooth, **low-detail and unobtrusive** — no sun disc, no planets, no moons, no ground, no canyon walls, no objects, no text, no watermark. Horizontal, fills the frame, **tileable left-to-right so it wraps**, 2048×1024 (2:1)."

(Canyon **walls** keep the existing `ccSurface` texture — no new asset.)

---

# ARM (`arm.js`)
**Camera:** **pure orthographic top-down** (straight down at a 2D plane). Ships are drawn **nose pointing up (12 o'clock)** at rest and the engine rotates the sprite to face its heading — so every ARM ship MUST be drawn nose-up, seen from directly overhead (dorsal surface), no tilt or perspective.

### `armHero` — player ship (top-down)
**View:** **straight-down overhead, nose at 12 o'clock**, fully symmetric, orthographic (no perspective, no tilt). We see the top of the hull.
> **Prompt:** "A sci-fi rescue/scout starship seen **from directly overhead (orthographic top-down), nose pointing straight up**. Symmetric compact hull: central bubble cockpit canopy, two forward-swept wings, **twin engine nozzles at the rear (bottom of frame) glowing aqua**, a small utility/cargo bay. Aqua and violet neon trim on a light-grey hull, crisp panel lines, a clean readable silhouette that stays legible when shrunk small. No tilt, no perspective — flat top-down. [+ Style suffix]"

### `armEnemy` — enemy fighter (top-down)
**View:** straight-down overhead, **nose at 12 o'clock**, orthographic.
> **Prompt:** "A hostile BCM military fighter seen **from directly overhead (orthographic top-down), nose pointing straight up**. Aggressive angular dark gunmetal arrowhead hull, swept-back attack wings, **twin engines at the rear glowing hot orange**, weapon hardpoints on the wings, a menacing silhouette. Orange/red accents on dark plating. Flat top-down, no perspective. [+ Style suffix]"

### `armBoss` — BCM Dreadnought (Galaga boss, top-down, faces DOWN toward the player)
**View:** straight-down overhead (orthographic, matches ARM's top-down camera), but **the prow/weapons point DOWN toward the bottom of the frame (6 o'clock)** and the **engines are at the top (12 o'clock)** — because in the boss arena the dreadnought sits across the *top* of the screen facing down at the player's ship (which sits at the bottom, nose up). Do **not** orient it nose-up like the fighters; it must read as bearing down on the viewer. Far larger than a fighter — a wide capital ship that fills most of the frame's width. Use the **3:2 landscape canvas** so the broad hull has room.
> **Prompt:** "A colossal BCM dreadnought — a heavy sci-fi capital warship — seen **from directly overhead (orthographic top-down), with its armored prow and main weapon batteries pointing DOWN toward the bottom of the frame and its bank of engine nozzles at the top of the frame glowing hot orange-red**. A broad, wide, intimidating hull far larger than a fighter, symmetric left-to-right, bristling with turrets and gun batteries along the leading (bottom) edge, layered battle-scarred dark gunmetal plating with hot orange and red trim and weapon glow. **At the dead center of the hull, a recessed circular reactor housing / exposed power-core socket** — a darker inset bay framed by armor petals, clearly the ship's vulnerable heart (the game overlays a pulsing glowing core here, so leave it readable and uncluttered). Menacing, imposing, obviously the boss. Flat top-down, no perspective tilt. [+ Style suffix]"

**Note:** the game renders the **weakpoint** itself (a pulsing gold core + a peach HP arc) as an overlay at the center of the sprite, so the sprite just needs that clean central reactor bay for it to sit in. If no `armBoss` PNG is present the boss falls back to a vector dreadnought, so the game is playable without it — this sprite is the visual upgrade.

---

# KBB (`kbb.js`)
**Camera:** combat zone shown in **side profile (broadside)** — **player ships on the left facing right, enemy on the right facing left.** Every KBB ship is a pure lateral/broadside view (we see the full side of the ship), nose toward its facing edge, engine exhaust on the opposite (tail) end. These read correctly both as flat 2D sprites and as billboards in the 3D attempt. The three hero ships are **separate files** and must look **visibly different** from each other.

### `kbbHero1` — allied interceptor (faces right)
**View:** **pure side profile, nose pointing RIGHT (3 o'clock)**, engine exhaust glowing at the **left** (tail). Broadside, no three-quarter angle.
> **Prompt:** "A sleek allied starfighter in **pure side profile, nose pointing RIGHT**, a balanced interceptor with a bubble canopy and a single large thruster. **Aqua/cyan** neon trim on a light-grey hull, **engine exhaust glowing aqua at the left (tail)**. Clean heroic silhouette, broadside view only. [+ Style suffix]"

### `kbbHero2` — allied strike fighter (faces right, distinct from #1)
**View:** pure side profile, nose RIGHT, exhaust at left.
> **Prompt:** "A second, visibly different allied starfighter in **pure side profile, nose pointing RIGHT** — a sharper, more angular strike variant with forward-swept wings and **twin thrusters**. **Violet/iris** neon trim on a light-grey hull, **engine exhaust glowing violet at the left (tail)**. Broadside view only, clearly distinct in shape from a rounded interceptor. [+ Style suffix]"

### `kbbHero3` — allied gunship (faces right, distinct from #1 and #2)
**View:** pure side profile, nose RIGHT, exhaust at left.
> **Prompt:** "A third, visibly different allied ship in **pure side profile, nose pointing RIGHT** — a heavier gunship: bulkier armored hull, visible side cannons, **four thrusters**. **Mantis-green** neon trim on a light-grey hull, **engine exhaust glowing green at the left (tail)**. Broadside view only, obviously chunkier than the other two. [+ Style suffix]"

### `kbbEnemy` — BCM Marauder warship (faces left)
**View:** **pure side profile, nose pointing LEFT (9 o'clock)**, engine exhaust glowing at the **right** (tail). Broadside.
> **Prompt:** "A menacing BCM military warship in **pure side profile, nose pointing LEFT**, aggressive angular dark gunmetal hull, weapon barrels along the broadside, **hot-orange engine glow at the right (tail)**, battle-worn with dramatic rim lighting. Broadside view only, threatening. [+ Style suffix] (3:2 landscape canvas acceptable, ship along the long axis.)"

### `kbbBoss` — BCM flagship / boss (faces left)
**View:** pure side profile, **nose LEFT**, exhaust at right, clearly far larger than a fighter.
> **Prompt:** "A huge BCM flagship / boss warship in **pure side profile, nose pointing LEFT**, a heavily armored elongated hull bristling with cannons and turrets along the broadside, **multiple orange-red engine glows at the right (tail)**, ominous and obviously far larger than a fighter. Broadside view only. [+ Style suffix] (use a 3:2 landscape canvas, ship spanning the long axis.)"

### `kbbAsteroid1`…`kbbAsteroid5` — Kuiper-Belt bodies (background)
**View:** any angle (they tumble). Irregular, varied. Transparent background.
> **Prompt (run 5×, varying the shape word):** "An irregular Kuiper-Belt asteroid / icy body, cold **blue-grey rock with a subtle frost-and-ice sheen**, cratered and pitted, lit from one side with a faint icy sub-surface glow. Shape: **{round-and-cratered / elongated potato / angular splintered shard / lumpy heavily-cratered / cracked split chunk}** — make each of the five visibly different. Transparent background, single body, no other objects, 1024×1024." (Note: asteroids do not need the ship Style suffix — just transparent background, no scene.)

---

## Checklist (17 assets)
- **CC:** `ccShip` (dead-astern), `ccGround` (tileable, darkest), `ccBumps` (tileable), `ccSky` (2:1, wraps horizontally). `ccSurface` (walls) already exists. Normal maps (`ccGroundN`/`ccBumpsN`) are best derived from the albedo with a tool, not image-generated.
- **ARM (top-down, nose-up):** `armHero`, `armEnemy`, `armBoss`
- **KBB (side profile):** `kbbHero1` (→, aqua), `kbbHero2` (→, violet), `kbbHero3` (→, green), `kbbEnemy` (←), `kbbBoss` (←), `kbbAsteroid1–5`

Send them to Core in batches; nothing else is blocked on them (mechanics proceed; sprites slot in on merge).
