# 07 — Art Direction

> **Version:** v1.2 · 2026-06-28 · Adds §10 (live asset manifest: every inlined `STARNIX_ASSETS` key, every key the code reads, and the exact PNG-sprite / texture production list with formats + sizes). Folds in v1.1's inventory (v1.1 was delivered but never re-uploaded to the project).

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

## 10. Asset manifest (live, as of build v0.47.0)

**Definitions.** A **sprite** is a standalone object image drawn/billboarded at a position — it MUST be a **PNG with a transparent background** (alpha). A **texture** is a surface fill — **tileable/seamless** where marked, and it may be **JPEG** (opaque) to keep the single-file build small. Every byte ships base64-inlined into `index.html` (+~33% size), so budgets matter: sprites ≤150 KB, textures/backdrops ≤250 KB each.

### 10.1 Inlined today (`assets.js`, 18 keys) and who reads them

| Key | Kind | Read by | Status |
|---|---|---|---|
| `armHero` | PNG sprite | ARM (player ship) | in use |
| `armEnemy` | PNG sprite | ARM (in-game BCM fighter) | in use |
| `armEnemyDive` | PNG sprite | ARM (intro dive beat ONLY) | in use |
| `armBoss` | PNG sprite | ARM (boss) | in use |
| `armStation` | PNG sprite | ARM (intro station, shattered) | in use |
| `armWarp` | PNG sprite | ARM (hyperdrive hull; falls back to `ccShip`) | in use |
| `planet` | image (JPEG ok; drawn circular-clipped) | Shell cinematic + ARM intro dive beat (v0.47.0) | in use |
| `wordmark` | PNG (alpha; official, unaltered) | Shell title | in use |
| `menuBg` | backdrop (JPEG ok) | Shell menu (Ken-Burns) | in use |
| `nebulaBg` | backdrop (JPEG ok) | Shell + KBB backdrop | in use |
| `bcmShip` | PNG sprite | KBB legacy 2D fallback | in use (fallback) |
| `ccShip` | PNG sprite | CC player + ARM warp fallback | in use |
| `ccSky` | backdrop (JPEG ok, non-tiling) | CC sky | in use |
| `ccRock` | **tileable texture** | CC canyon walls + arch + jump wall (v0.47.0) | in use |
| `ccRockN` | tileable **normal map** (PNG) | CC walls | in use |
| `ccSurface` | **tileable texture** | CC planet rim | in use |
| `ccGround` | **tileable texture** | CC chasm floor | in use |
| `ccBumps` | tileable texture | *(nothing — retired v0.47.0: the lane rock it textured became the full-width wall sharing `ccRock`)* | **retired — safe to delete** |

### 10.2 Referenced by code but NOT inlined — the production list

**PNG sprites (transparent background required):**

| Key | What | Size | Facing / notes |
|---|---|---|---|
| `kbbHero1` | Squad ship 1 — *Talon* (§6 brief: fast striker) | 512×512 | faces **RIGHT**, ~30–40% padding for glow |
| `kbbHero2` | Squad ship 2 — *Aegis* (§6: bulwark) | 512×512 | faces RIGHT |
| `kbbHero3` | Squad ship 3 — *Mender* (§6: support) | 512×512 | faces RIGHT |
| `kbbEnemy` | BCM fighter | 512×512 | faces **LEFT** (enemy zone is screen-right) |
| `kbbBoss` | BCM capital ship | 768×768 | faces LEFT, reads at 2× fighter scale |
| `kbbAsteroid1–5` | Kuiper belt rocks, 5 distinct silhouettes | 256×256 each | any facing; strong outline vs `nebulaBg` |

These ten unlock KBB's **coded-and-waiting 3D combat path** (today it runs the procedural 2D fallback). Style per §1/§6: neon vector on dark, Iris/Aqua hero glow, Peach/Gold enemy accents, no gradients that fight the additive glow.

**Textures (tileable/seamless):**

| Key | What | Size | Notes |
|---|---|---|---|
| `ccGroundN` | Normal map matching `ccGround` | 1024×1024 PNG | *optional* — code already consumes it if present (floor relief) |

Nothing else is missing. If you replace existing textures, keep them seamless at the listed repeat axes (walls tile in z, floor in x+z).

### 10.3 Format rules (hard)

- Alpha needed → **PNG**. Opaque backdrop/texture → **JPEG** is fine and smaller.
- Normal maps → **PNG only** (JPEG artifacts corrupt normals).
- Never bake the wordmark into other art (§3). Sentence case in any in-art text; Montserrat.


---

## Change history
- **v1.2 (2026-06-28):** Added §10 live asset manifest — inlined keys + readers, the ten missing `kbb*` PNG sprites (sizes/facing) + optional `ccGroundN`, `ccBumps` retired, PNG-vs-JPEG format rules. Folds in the v1.1 inventory (delivered earlier, never re-uploaded).
- **v1.1 (2026-06-28):** `STARNIX_ASSETS` key inventory; `armEnemy` in-game vs `armEnemyDive` intro-only split. *(superseded by §10)*
- **v1.0:** Baseline.
