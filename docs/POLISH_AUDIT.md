# Visual polish audit (2026-11-01)

Every screen of every tool, looked at as a person would on a Mac at 1280x800. What reads as professional, what reads as
"vibe coded", and the order the fixes are being made in. Ticks are filled in as the work lands.

## What already works

- **Launcher and Practice Exams.** One dark theme, one type scale, rounded cards with a quiet glow, a clear hierarchy
  (step 1 certification, step 2 tool). Nothing to fix beyond small spacing.
- **WWTBANE at the Medium tier.** Light beams, bloom, glass reflections and the money ladder read as a produced set.

## WWTBANE (the studio game)

| # | Finding | Why it looks amateur | Fix | |
|---|---|---|---|---|
| W1 | The audience is dark, realistic silhouettes next to voxel presenters | Two art styles in one frame; the crowd is the biggest area of the picture and says nothing | A voxel crowd: instanced, seated, tinted per seat, with a few waving | [ ] |
| W2 | The piggy bank and the hologram orb are smooth primitives | They are the two things the eye goes to, and they look like a toy and a screensaver | Detailed, textured, properly lit models: a voxel piggy bank with a gold material and coins, an orb built from rings, a core and a lit pedestal | [ ] |
| W3 | Presenters are small in wide shots and their faces do not read | A 3 cm voxel face is about six pixels at the wide camera | Slightly larger heads and bolder face features; the close-up cameras do the rest | [ ] |
| W4 | Surfaces are flat colours with glow | Nothing for the light to catch | CC0 PBR textures on the deck, seats, steel, camera bodies and pedestals (done in v2.95); next: the wall pillars, the riser steps and the desks | [~] |
| W5 | The question card and money ladder cover about a third of the stage | The set is the show; the UI should frame it | Keep the layout but lower the card's opacity over the stage and tighten its height | [ ] |
| W6 | The default Low tier has no bloom or depth of field | First impression on any machine that falls back | The CSS film look (bloom, vignette, tilt-shift) is already there; Medium is the default again where it is safe | [x] |

## StarNix (three games)

| # | Finding | Why it looks amateur | Fix | |
|---|---|---|---|---|
| S1 | Three art styles at once: painted ships (Acropolis Rescue), neon vector arrowheads (Kuiper Belt heroes and raider) and photo-textured 3D (Chasm Chase) | No single look, so none of it feels designed | One look for all three: lit 3D ship and rock models rendered with real textures | [ ] |
| S2 | Kuiper Belt shows procedural neon arrowheads until the sprite images decode | A visible pop on every start | The new art ships in the same file and is decoded before the first frame | [ ] |
| S3 | Chasm Chase walls repeat one rock texture and the ground is a flat grey strip | Repeating tiles and no material variety | Better CC0 rock, sand and gravel sets with normal maps, and a real sky | [ ] |
| S4 | Heads-up displays are dense and sit on top of the action | Competes with the picture | Leave the layout; tune panel opacity | [ ] |

## NCM-MCI Lab and cross-cutting

| # | Finding | Fix | |
|---|---|---|---|
| X1 | The NCM-MCI Lab page is a light theme in a dark product | Restyle to the same dark theme and type as the launcher | [ ] |
| X2 | Two typefaces (Space Grotesk in the launcher and exams, Montserrat in the games) | Keep Montserrat inside the games (it is part of the show), and say so in the style notes | [ ] |
| X3 | No written art direction | A one-page style note: palette, type, materials, what voxel is for | [ ] |
