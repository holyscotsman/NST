# 07 — Art Direction

<!-- doc-version: v1.1 · baseline v1.0 = original file · MINOR (implemented asset-key inventory; no language/brand change) -->
**Doc version:** v1.1 · **Owner:** single chat · **Edited:** 2026-06-28

The visual language for the whole StarNix suite: **neon, Nutanix-styled, original art**. This file defines the look, *how* art is produced (so it stays self-contained for the Apps Script single-file build), and the per-game asset list with design briefs.

---

## 1. Visual language

- **Mood:** neon synthwave in deep space — glowing geometric ships and stations on a near-black field. Clean, vector, high-contrast, a little retro-arcade. The existing in-code ARM art (swept-wing neon ship, glowing station glyph) is the **anchor style** — everything matches it.
- **Palette (from shared tokens, `01 §8`):** Iris `#7855FA`, Aqua `#1FDDE9`, Mantis `#92DD23`, Peach `#FF6B5B`, Gold `#FFC857`, iris300 `#AC9BFD`, iris600 `#6D40E6`, on Charcoal `#131313` / near-black. White for highlights/text.
- **Color meaning (kept consistent across all 3 games):** Iris = friendly/structure, Aqua = energy/accent, Mantis = success/install/heal, Peach = danger/enemy/damage, Gold = reward/coins. **Never rely on color alone** — pair with shape/icon (`01 §12`).
- **Form:** geometric, faceted, low-vertex silhouettes; strong outer glow (soft bloom) + a brighter core line; minimal internal detail. Readable at small sizes.
- **Type:** Montserrat, sentence case. Titles get a subtle neon glow; body stays crisp.
- **Light:** glows pulse gently; cores/engines emit; subtle scanline/grain optional (respect reduced-motion).

---

## 2. Production method (matters for hosting)

- **2D (ARM, KBB, menus, HUD): draw in code as vector** — SVG and/or Canvas paths with glow via `shadowBlur`/SVG `feGaussianBlur`. No large raster assets. This keeps the **single-file Apps Script build** small and the art crisp at any resolution. (This is exactly how ARM's art already works.)
- **3D (CC): procedural low-poly geometry** built in Three.js (boxes/extrusions/merged meshes), neon via emissive materials + a bloom pass, simple gradient sky. **No heavy textured models**; tiny procedural or data-URI textures only if needed.
- **Icons (KBB artifacts, buffs, UI): a systematic glyph set** (see §5), drawn as small SVGs so ~50 of them stay tiny and consistent.
- **Avoid:** base64-embedding big PNGs (bloats the single file), external image hosting (breaks offline/Apps Script), and any third-party sprite rips.

---

## 3. Brand rules (hard)

- **Original art only.** All ships, stations, icons, enemies are our own designs in the Nutanix palette.
- **Official Nutanix wordmark:** used **unaltered**, **title screen only** — never recolored, distorted, rotated, or placed on busy backgrounds (per Nutanix brand guidelines). Everywhere else uses original lettering/marks.
- **Don't use Nutanix product names as in-game proper nouns** (Prism, Flow, Calm, etc.) to avoid brand confusion — concept *nods* in flavor text are fine (e.g., the "Microsegmentation Disruptor" weapon).

---

## 4. Per-game asset inventory

### Shared / shell
- [ ] Title treatment + wordmark lockup zone (title screen only)
- [ ] Menu: three game cards (ARM/KBB/CC) with distinct neon motifs; Continue/Stats/Settings
- [ ] HUD kit: bars (HP/shield), buttons, panels, toasts — one shared neon UI skin
- [ ] Shared motifs: **core/knowledge gem**, **coin (hex)**, particle/spark set, parallax starfields
- [ ] BCM faction look (the enemy): angular, hostile, **peach/red** accents, dark hulls
- [ ] Cinematic elements: intact station, **Disruptor beam**, shatter debris, warp streaks, planet

### ARM (mostly exists — extend)
- [ ] Player ship (✅ swept-wing neon — keep)
- [ ] Station glyph that grows as cores install (✅ exists)
- [ ] Cores, drones, asteroids (✅ exist)
- [ ] **Boss:** large BCM warship with shed-core phases (new)

### KBB
- [ ] **Squad ships** Talon / Aegis / Mender — three distinct silhouettes (§6 briefs)
- [ ] Enemy roster (several escalating BCM types) + **bosses** with a tell for their mechanic
- [ ] **Artifact icon set (~50)** via the systematic glyph system (§5)
- [ ] Battle UI: enemy HP bar, **intent indicator** (number + icon), squad bars, attack/answer panel
- [ ] Parallax Kuiper-belt backdrop (drifting ice/rock, distant nebula)

### CC (3D)
- [ ] Low-poly chasm walls + floor (instanced rock chunks)
- [ ] Three obstacle types, each visually unmistakable: **lane-block** (full rock wall), **low rock** (jumpable), **ceiling enemy** (duck-under hovering BCM)
- [ ] Coins (hex) + cores (gem) in 3D, with glow
- [ ] Power-up auras: magnet, invincibility, shield+, coin×, slow-mo (distinct colors+icons)
- [ ] Runner ship (reuse ARM silhouette as low-poly, or a CC variant)
- [ ] Planet sky + the "radar line" ceiling (flavor) + fog

---

## 5. Artifact / icon system (so ~50 icons stay consistent)

Don't hand-design 50 unique illustrations. Use a **system**:
- Each icon = a **simple central glyph** (8–12 vector primitives) on a rounded tile.
- **Rarity ring color:** common = iris300, uncommon = aqua, rare = mantis, legendary = gold (ring + subtle inner glow).
- **Category hue** for the glyph: damage = peach, defense = iris, heal = mantis, economy = gold, utility = aqua.
- Glyph motifs map to effect family (e.g., chevrons = damage, shield = defense, cross = heal, coin = economy, gear/lens = utility).
This yields 50 legible, on-brand icons that read at a glance and are cheap to produce as tiny SVGs.

---

## 6. KBB squad design briefs (first concrete art target)

| Ship | Silhouette | Color | Motif |
|------|-----------|-------|-------|
| **Talon** (DPS) | sharp, swept-forward, aggressive; twin forward cannons | Peach + iris hull, aqua engine | speed lines, blade nose |
| **Aegis** (Shield) | broad, hexagonal, layered; projects a shield arc | Iris + aqua, mantis shield glow | hex plating, orbiting shield ring |
| **Mender** (Medic) | rounded, calm, supportive; soft dome | Mantis + iris, white core | plus/cross emblem, gentle aura |

All three share the family look (faceted, glowing core line, twin engines) so they read as one squad. Enemy BCM ships invert the palette toward peach/red and use harsher angles.

---

## 7. Motion & feel

- Glow pulse on cores/engines; parallax depth on backgrounds; light screen-shake on hits/explosions; warp streaks on hyperdrive.
- **Reduced-motion setting** dampens parallax/shake/flash (`01 §12`). Nothing critical conveyed by flashing alone.

---

## 8. Delivery plan

Art is produced **per game during its build phase**, in the code-vector method above, matching this spec. The **first concrete deliverable** to lock the style is the **KBB squad concept sheet** (Talon/Aegis/Mender + a BCM enemy + the core/coin motifs + palette) — produced as an SVG. (Ask to start it any time; it doubles as the reusable in-game art.)

---

## 9. Art checklist (rollup)
- [ ] Shared neon UI skin + motifs (core, coin, particles, starfield)
- [ ] BCM enemy faction language + cinematic elements
- [ ] ARM boss art (extend existing set)
- [ ] KBB squad (3 ships) + enemy roster + bosses + battle UI
- [ ] Artifact icon **system** + ~50 icons
- [ ] CC low-poly chasm, 3 obstacle types, coins/cores, power-up auras, sky
- [ ] Reduced-motion variants honored


---

## 10. Implemented asset keys (added v1.1 — current `STARNIX_ASSETS`)

The inlined base64 keys actually present in `assets.js` (read by games as `ctx.assets.<key>`), with roles:

| Key | Used by | Role |
|---|---|---|
| `armHero` | ARM | player ship, in-game (top-down) |
| `armEnemy` | ARM | **in-game** BCM fighter — silver-grey / red |
| `armEnemyDive` | ARM | **intro-only** BCM enemy — near-black; used solely in the dive-to-planet beat |
| `armBoss` | ARM | boss hull (Increment-2 seam) |
| `armWarp` | ARM | dead-astern hull for the hyperdrive cutscene |
| `armStation` | ARM | Acropolis Station (intact in the intro, then shattered) |
| `ccRock`, `ccRockN` | CC | boulder albedo + normal map |
| `ccSky`, `ccSurface` | CC | sky dome + planet-surface texture |
| `ccShip`, `ccGround`, `ccBumps` | CC | ship billboard, floor albedo, floor bump |
| `nebulaBg` | KBB | parallax Kuiper-Belt backdrop |
| `bcmShip` | KBB | legacy BCM ship (fallback) |
| `menuBg` | shell | menu background |
| `planet` | shell / ARM | planet art |
| `wordmark` | shell | official Nutanix wordmark — **title screen only, unaltered** |

> **BCM enemy roles (important):** there are two distinct enemy sprites. `armEnemy` (silver-grey / red) is the **in-game** fighter; `armEnemyDive` (near-black) is reserved **exclusively** for the ARM intro/Disruptor dive cinematic. Do not swap them.

> **Not yet inlined:** the KBB 3D combat sprites (`kbbHero1/2/3`, `kbbEnemy`, `kbbBoss`, `kbbAsteroid1-5`) — KBB renders on its 2D fallback until these are added (see 03 §13).

---

## Change history

- **v1.1 (2026-06-28)** — Added §10 listing the asset keys actually inlined in `STARNIX_ASSETS` and their roles, including the **two-sprite BCM enemy split** (`armEnemy` in-game silver/red vs `armEnemyDive` intro-only near-black), the ARM sprite roster (`armHero/armBoss/armWarp/armStation`), the CC textures, and the shell/KBB assets (`menuBg/nebulaBg/bcmShip/planet/wordmark`). Noted the KBB 3D combat sprites are not yet inlined. No change to the visual language or brand rules (§1-§3).
- **v1.0** — baseline (original `07_ART_DIRECTION.md`): visual language, production method, brand rules, per-game asset inventory + briefs, icon system, motion/feel, delivery plan.
