# StarNix — KBB sprite generation prompts (the v0.50 production wave)

> The ten `kbb*` PNGs from **07 §10.2** (they unlock KBB's coded-and-waiting 3D combat path), plus the
> optional `ccGroundN` normal map. One prompt per asset, written to be pasted into an image generator as-is.
> The earlier wave's prompts (ccShip, planet, backdrops…) live in `ASSET_PROMPTS.md` — this file is only
> what's outstanding. Send finished images to me; I optimize (downscale + key-out if needed) and inline
> into `assets.js` under the key shown. Code changes: **zero** — the 3D path lights up on asset presence.

## Rules that make or break these (read once)

1. **The view is dictated by the in-game camera.** KBB renders ships as **billboards in strict side
   profile**. Heroes face **RIGHT**; the enemy and boss face **LEFT** (the enemy zone is screen-right,
   so they fly toward the squad). A three-quarter view, front view, or top-down view will look broken
   in-game — the prompt for each asset repeats this because generators love drifting to 3/4 hero angles.
2. **Generate at 1024×1024** (models compose better at native res); I downscale to the shipping size in
   the table. For the elongated `kbbEnemy`/`kbbBoss` you may use a **3:2 landscape** canvas with the hull
   along the long axis instead.
3. **Transparency:** ask for a transparent PNG with alpha. If the tool can't, generate on a **flat,
   solid, pure-black background with no gradient, glow-bleed, cast shadow, or vignette** and I'll key it
   out. Never put scenery (stars, nebula, planets) behind the ship — it can't be removed cleanly.
4. **Padding:** subject centered at ~70–75% of frame with even margin (heroes want ~30–40% total padding
   so the engine glow never clips).
5. **One craft per image.** No squads, no formations, no escort fighters around the boss.

## Shared palette + faction language

Accent palette (glowing trim, engine light, core lines): **Iris `#7855FA` · Aqua `#1FDDE9` ·
Mantis `#92DD23` · Peach `#FF6B5B` · Gold `#FFC857`.**

- **Allied squad (heroes):** cool accents (aqua / iris / mantis) on light-grey/charcoal hulls. Family
  look across all three: faceted paneling, a single glowing core line running the spine, twin engines.
- **BCM enemies:** the inversion — **hot orange-red** engine/weapon glow on **darker gunmetal** hulls,
  harsher angles, aggressive asymmetry allowed. Cool-vs-hot is the faction read at a glance; hold it.

## Style suffix — append to EVERY ship and asteroid prompt, verbatim

> "Semi-realistic modern sci-fi game art — clean readable forms, PBR-style materials (brushed and
> painted metal, matte composite panels, subtle edge wear and panel lines), a small cockpit/canopy and
> visible engine nozzles. NOT cartoon, NOT cel-shaded, NOT low-poly, NOT photoreal. Neutral light-grey /
> charcoal hull as the base. Soft neutral key light from the upper front with gentle fill, plus the
> ship's own emissive engine/trim glow; even and legible, no heavy dramatic shadows hiding the
> silhouette. Isolated subject on a **fully transparent background (PNG alpha)** — no scene, no stars,
> no nebula, no ground, no cast shadow, no text, no logos, no watermark, no UI, no humans, a single
> craft only. Centered, ~75% of frame, even margin, 1024×1024."

*(For `kbbEnemy`/`kbbBoss` swap the hull clause to "darker gunmetal / charcoal hull" and, if using
landscape, the last line to "…even margin, 1536×1024 landscape".)*

**Negative prompt (if your tool takes one):** `text, watermark, logo, UI, HUD, frame, border, humans,
pilot visible, multiple ships, background scenery, stars, nebula, planet, ground, cast shadow,
three-quarter view, front view, top-down view, cartoon, cel shading, low poly`

---

## The ten sprites

### `kbbHero1` — **Talon**, the fast striker (DPS) · ships at 512×512 · faces RIGHT

> **Prompt:** "A small, sharp single-seat sci-fi strike fighter in **strict side profile, nose pointing
> RIGHT**, perfectly horizontal, as a game sprite. Aggressive swept-forward silhouette like a thrown
> blade: a long tapering dagger nose, thin forward-raked wing, **twin forward-mounted cannons** slung
> under the nose with faint peach `#FF6B5B` muzzle emitters. Hull accents in peach and iris `#7855FA`
> trim lines along faceted panels; a single glowing iris core line running the length of the spine; a
> compact canopy near the front; **twin rear engine nozzles glowing bright aqua `#1FDDE9`** with short
> speed-line exhaust streaks. Built for speed — every line rakes forward. [+ Style suffix]"

### `kbbHero2` — **Aegis**, the bulwark (Shield) · ships at 512×512 · faces RIGHT

> **Prompt:** "A broad, heavy sci-fi escort ship in **strict side profile, nose pointing RIGHT**,
> perfectly horizontal, as a game sprite. Wide layered silhouette built from **stacked hexagonal armor
> plating** — deliberate, fortress-like, roughly twice Talon's visual bulk, with a blunt reinforced prow.
> Hull accents in iris `#7855FA` and aqua `#1FDDE9` trim; a single glowing core line along the spine; a
> small armored canopy; twin rear engines glowing aqua. Its signature: a **translucent mantis-green
> `#92DD23` energy shield arc** projected just off the forward hull, with one thin **orbiting shield-ring
> element** visible edge-on around the midsection. The shield glow is emissive but contained — it must
> not wash out the silhouette. [+ Style suffix]"

### `kbbHero3` — **Mender**, the support (Medic) · ships at 512×512 · faces RIGHT

> **Prompt:** "A rounded, calm sci-fi support vessel in **strict side profile, nose pointing RIGHT**,
> perfectly horizontal, as a game sprite. Soft organic-industrial silhouette: a smooth **domed upper
> hull** over a compact body, no aggressive angles anywhere — it reads as gentle next to warships. Hull
> accents in mantis `#92DD23` and iris `#7855FA`; a **white-glowing core** visible through a small dorsal
> aperture; a clean **plus/cross emblem** panel on the hull side; a faint, gentle white-green aura hugging
> the hull (subtle — 10–15% opacity feel, not a light show); small canopy; twin rear engines glowing soft
> aqua. Same family DNA as its squadmates: faceted panels, spine core line, twin engines. [+ Style suffix]"

### `kbbEnemy` — BCM fighter · ships at 512×512 · faces LEFT

> **Prompt:** "A hostile sci-fi interceptor in **strict side profile, nose pointing LEFT**, perfectly
> horizontal, as a game sprite. Harsh, predatory silhouette: jagged swept wing, forward-jutting angular
> mandible prow, asymmetric sensor spine — meaner and messier than an allied ship. **Darker gunmetal /
> charcoal hull** with worn panels; **hot orange-red engine glow and weapon emitters** (`#FF6B5B` pushed
> toward red), thin gold `#FFC857` warning striping on the wing edges; a narrow slit canopy glowing
> faint red. Twin rear engines with short angry exhaust. No cool blue/green accents anywhere — this
> faction burns hot. [+ Style suffix, gunmetal hull variant]"

### `kbbBoss` — BCM capital ship · ships at 768×768 · faces LEFT · reads at 2× fighter scale

> **Prompt:** "A massive hostile sci-fi capital warship in **strict side profile, nose pointing LEFT**,
> perfectly horizontal, as a game sprite. Long, brutal dreadnought silhouette — layered armored hull
> segments, a stepped command superstructure aft, rows of small glowing gun emplacements along the
> flank, a huge under-slung prow cannon. **Dark gunmetal / near-black charcoal hull** with battle wear;
> **hot orange-red reactor lines** glowing between armor plates, red engine bank at the stern (three or
> four large nozzles), sparse gold `#FFC857` hazard striping. It must read as the fighters' big brother:
> same hot-faction glow language, vastly more mass. Fine panel detail matters — this ships at 768px and
> is the largest sprite in the game. [+ Style suffix, gunmetal hull variant; 3:2 landscape allowed with
> the hull along the long axis]"

### `kbbAsteroid1` … `kbbAsteroid5` — Kuiper belt rocks · ship at 256×256 each · any facing

Five separate generations. **Each must have a clearly distinct silhouette** — in-game they tumble past
in the parallax belt and repetition reads instantly. Use the five shape briefs below with the shared
rock prompt; strong dark outline contrast against a deep-violet nebula is the readability requirement.

> **Shared prompt:** "A single asteroid as an isolated game sprite: [SHAPE]. Weathered cratered rock,
> cool charcoal-grey surface with subtle violet ambient tint, a few faint iris `#7855FA` mineral glints
> in crevices, rim-lit softly from the upper left so the silhouette stays crisp and dark-edged. Matte,
> non-metallic. High shape readability at small sizes. [+ Style suffix — drop the cockpit/engine clause,
> keep everything from 'Isolated subject…' on]"

| Asset | [SHAPE] |
|---|---|
| `kbbAsteroid1` | "a chunky potato-shaped boulder, slightly wider than tall, one large crater on the upper face" |
| `kbbAsteroid2` | "an elongated splintered shard, roughly 2.5:1, tapering to a broken point at one end" |
| `kbbAsteroid3` | "a rough triangular wedge with one flat sheared face and crumbled corners" |
| `kbbAsteroid4` | "a lumpy binary — two fused rounded masses with a pinched waist between them" |
| `kbbAsteroid5` | "a jagged star-like fragment with 4–5 irregular spurs, the most angular of the set" |

---

## Optional sprite (new, v0.76.0)

### `ccShipDuck` — the CC dive pose · ships at 512×512 · top-rear 3/4, nose DOWN

> Wired-and-waiting: CC's duck is now a nose-down power-dive (v0.72.0); this sprite would replace the
> flat `ccShip` during the dive for a sharper read. Asset-gated — zero code risk if never supplied.
>
> **Prompt:** "The SAME fighter as `ccShip` (match its hull design, colors and materials exactly) seen
> from the chase camera: **top-rear three-quarter view with the nose pitched steeply DOWN** into a dive,
> wings level (no roll), tail and twin aqua `#1FDDE9` engine nozzles raised toward the viewer and firing
> hard — bright elongated exhaust with a small afterburner flare. The fuselage foreshortens toward the
> lowered nose. Same faceted light-grey/charcoal paneling and iris `#7855FA` trim as `ccShip`.
> [+ Style suffix]"

## Optional texture

### `ccGroundN` — normal map for the CC chasm floor · ships at 1024×1024 · seamless

Only worth generating if your tool does clean normal maps; the floor works flat without it. It must
correspond to the diffuse `ccGround` already inlined (dark weathered stone + compacted sand, hairline
cracks, embedded pebbles).

> **Prompt:** "A **seamless, tileable tangent-space normal map** (the standard lavender/blue encoding,
> flat neutral = `#8080FF`) for a canyon-floor texture of weathered stone and compacted sand: fine grit
> grain, hairline crack channels, small embedded pebbles raised slightly, subtle broad undulations. No
> diffuse color, no lighting, no shadows — normal-map encoding only. Uniform detail with no focal
> feature so it tiles invisibly on all four edges. Fills the entire frame, 1024×1024."

*(If the generator can't do true normal maps, skip it — a fake one looks worse than none.)*

---

## Delivery checklist (per image)

- [ ] Correct facing (heroes RIGHT · enemy/boss LEFT) and **true side profile** — reject 3/4 drifts
- [ ] Transparent alpha (or pure-black keyable background), no cast shadow, no scenery
- [ ] Single craft, centered, even margin, glow unclipped
- [ ] Faction color language holds (cool allies / hot BCM)
- [ ] Asteroids: five genuinely different silhouettes side by side
