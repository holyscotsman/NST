# Graphics

How the studio is drawn, what changes between a workstation and a locked-down
laptop, and how to look at it. (The graphics overhaul, v2.74.0 to v2.79.0.)

## Layers

| Layer | Where | What it does |
| --- | --- | --- |
| Pipeline | `src/shell/stage/post.js` | multisampled half-float targets, optional ambient occlusion, bloom, ACES tone map, one combined grade pass (contrast, split tone, edge aberration, vignette, grain, dither) |
| Tiers | `src/shell/stage/quality.js` | `low` / `medium` / `high` and the runtime governor |
| The set | `stage/studioSet.js` and `floor`, `ledWall`, `rig`, `audience`, `core`, `lights` | the deck (mirror on high), shader LED wall, truss and beams, crowd, hologram Core |
| Colour script | `stage/accent.js` | one eased mood colour that the wall, deck, rims and beams follow (the key light stays white) |
| People | `stage/people.js` | faces, hair, outfits, rim-lit figures; shared geometry |
| Celebrations | `stage/fx.js` | confetti, coin shower, Core sparks; no-ops under reduced motion |
| Green room | `stage/greenRoom.js` | the lounge scene |
| Safe frame | `studio.js` (`_measureSafeFrame`) | measures the DOM ladder and question card and shifts the camera so the subject sits in the free area |

The quiz is always DOM text over the canvas; none of this changes that.

## Quality tiers

| | low | medium | high |
| --- | --- | --- | --- |
| Pixel ratio | 1 | up to 1.5 | up to 2 |
| Antialiasing | none | 4x MSAA | 4x MSAA |
| Bloom, grade | off | on | on |
| Ambient occlusion | off | off | on |
| Mirror floor | off | off | on |
| Shadow map | 1024 | 1024 | 2048 |
| Beams, motes | 4, 60 | 8, 150 | 12, 260 |

How a tier is chosen, first match wins: `?quality=low|medium|high` in the URL,
then Settings, Graphics quality (stored as `wwtbane.quality`), then the GPU's own
name (software renderers get `low`, integrated graphics `medium`, discrete and
Apple silicon `high`). "Cinematic effects" off in Settings caps the tier at `low`.

After that a governor watches frame time and only ever steps **down**: first the
render resolution (to 60 percent), then a whole tier. It ignores the first
seconds, single hitches and backgrounded tabs.

## Reduced motion

Quality and motion are independent. Under reduced motion the camera cuts (never
glides), beams stop sweeping, the life pass and every particle emitter are off,
and the gfx test proves two frames 800 ms apart are identical.

## Brand rules

Original art in code (no model files, no imported textures), Montserrat only, the
palette in `DESIGN_BRIEF.md`, and, since v2.78.0, the Nutanix Design System rules
for the DOM. Nothing flashes faster than 3 Hz.

## Looking at it

- `?scene=<name>` previews a camera scene (`docs/CINEMATIC_TAKES.md`).
- `?quality=high` forces a tier. `window.__wwt.gfx()` (when `localStorage`
  `wwtbane.e2e` is `1`) reports tier, GPU, pipeline, draw calls and triangles.
- `node tests/shots-gfx.mjs [label]` writes screenshots to `shots/`.

## What is tested, and what is not

`scripts/wwtbane-gfx-test.mjs` runs the real WebGL path at each tier and checks
the pipeline that was built, that rendered pixels are not blank, safe-frame
shifts, field of view, reduced-motion stillness, and per-tier render-work
budgets (draw calls and triangles). Unit tests cover the tiers and governor,
the accent, the people, the particles and the design rules.

**Not measurable in CI:** real frame times. CI renders in software (SwiftShader),
which can verify what is drawn and how much work it is, but not how fast a real
GPU does it. The budgets keep the work bounded and the governor protects slow
machines, but a person should look at it on real hardware (`BROWSER_QA.md`).
