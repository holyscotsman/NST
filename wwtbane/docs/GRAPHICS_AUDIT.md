# GRAPHICS_AUDIT.md — Phase 0

Grounded in the **current modular game** (`src/shell/studio.js` et al.), not the
retired single-file prototype the directive was written against. See
`docs/GRAPHICS_OVERHAUL.md` for how the directive is adapted to this codebase.

## Engine

- **Three.js r160, vendored** at `vendor/three/` and loaded via an import map in
  `index.html` (`three` → `./vendor/three/build/three.module.js`, `three/addons/`
  → `./vendor/three/examples/jsm/`). **No CDN** (CLAUDE.md §5 hard rule).
- Only a **minimal subset of addons is vendored**: the postprocessing chain
  (`EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`, `ShaderPass`).
  `Reflector`, `RoomEnvironment`, and the stock `FilmShader`/`VignetteShader` are
  **not** vendored — so those effects are implemented with **core Three.js**
  (`PMREMGenerator`, a procedural env scene) and **inline custom shaders**, to
  avoid CDN loads or new vendoring.

## Renderer setup (studio.js `init`)

- `WebGLRenderer({ antialias:true, powerPreference:'high-performance' })`,
  `pixelRatio = min(devicePixelRatio, 2)`.
- `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure = 0.92`.
- `outputColorSpace = SRGBColorSpace`. Canvas textures flagged `SRGBColorSpace`.
- **No shadow map configured** (`renderer.shadowMap` untouched; no `castShadow`).
- Post: `EffectComposer` → `RenderPass` → `UnrealBloomPass(0.42, 0.45, 0.34)` →
  `OutputPass`. Graceful fallback to direct render if addons fail to load.
- **One RAF** via `renderer.setAnimationLoop(this._tick)`.

## Scene inventory

- **Studio set:** grooved stage disc (procedural floor texture), aqua rim +
  gold spoke ring (instanced), a console desk with two glowing grid monitors
  (shared emissive screen texture), two hot seats (backrest + footrest ring),
  a truss torus, a curved wordmark backdrop plane, 4 additive volumetric beam
  cones, a piggy-bank prop, three fourth-wall broadcast cameras + operator.
- **People:** capsule-built host / contestant / crew with animatable faces
  (blink, breathe, sway, talking mouths, mood reactions) — driven allocation-
  free in the life pass.
- **Audience:** instanced seated bodies (torso+lap+head) on riser rings with an
  aqua fascia per tier; one reusable "actor" for the random crowd moments.
- **Green room:** wood-panel walls (procedural), sofas, table, lamps, a hinged
  door, sketchy-guy prop, seated contestant.
- **Lights:** dim ambient (`0x222244`, 0.4); iris + aqua spot keys; a warm gold
  point; a mantis pulse point (event flashes); fog (`FogExp2`).
- **Camera:** fully cue-driven director (`director.js` + `takes.js`) — eased
  orbit/dolly/pan/static takes per game state; reduced-motion = locked-off cuts.

## UI approach

- The quiz is a **DOM overlay** (Game A design in `styles/main.css` + `ui/`) for
  accessibility — never rendered in GL. Colorblind-safe glyphs, reduced-motion,
  keyboard/touch, live-region announcements.

## Top 10 visual weaknesses (Phase 0 targets)

1. **No environment map** — metals/gloss have nothing to reflect; surfaces read
   matte. *(P2)*
2. **Floor doesn't reflect** — it's textured but not mirror-like; the signature
   "Millionaire" gloss floor is missing. *(P2)*
3. **No shadows** — figures/props don't ground into the stage; the hero area
   lacks contact shadow and drama. *(P3)*
4. **No rim/back light** — subjects don't separate from the dark background. *(P3)*
5. **No explicit lock-in lighting cue** — the classic "dim everything but a hard
   key" tension beat isn't a distinct state. *(P3)*
6. **Backdrop is a flat wordmark plane**, not a curved LED wall array; no
   perimeter light columns/fins; stage has no center medallion. *(P1)*
7. **Truss is a single torus** with no fixtures reading as real rig hardware. *(P1)*
8. **Emissive intensities are conservative** (<1 in places) — not authored to
   drive bloom deliberately. *(P2)*
9. **No vignette / film grain / micro-motion** — frames read slightly flat and
   perfectly still. *(P4)*
10. **Option cards are rounded rectangles**, not the broadcast hexagonal-lozenge
    silhouette; no dust motes in the beams. *(P5)*

## Perf note

FPS cannot be benchmarked from the headless CI sandbox. A **dev FPS meter**
(`src/shell/fpsMeter.js`, `?fps=1` or Alt+F, off by default) is provided for the
owner to verify the 60/≥45 budget on real hardware. Perf *principles* are
enforced in code and were audited clean in the prior review (one RAF, instancing,
no per-frame allocation).
