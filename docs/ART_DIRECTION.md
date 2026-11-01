# Art direction

One page, so the next change fits the rest.

## The three looks, and why

| Where | Look | Why |
|---|---|---|
| Launcher, Practice Exams, NCM-MCI Lab | Quiet dark UI: Space Grotesk headings, rounded cards, one violet accent, a soft glow | These are tools; the interface should get out of the way of the content |
| Who Wants to Be a Nutanix Engineer | A TV studio in real-time 3D: glass deck, light beams, bloom, **voxel people, crowd and set pieces**, real PBR surface textures | A game show is a produced picture; voxels make the people charming and consistent instead of uncanny, and the lighting does the "TV" |
| StarNix | Lit 3D models with real textures (ships, rocks, station) and a real rock canyon | An arcade game wants one coherent world; pre-rendered from real 3D models so the games' rules and drawing code stay as they were |

## Rules

- **Voxels are for living things and mascots** (people, the crowd, the piggy bank), at 2.5 cm for presenters and 5 cm for
  the crowd. Surfaces (floor, wall, steel, leather, stone) use real CC0 PBR textures instead.
- **Textures are CC0 only** (ambientCG, Poly Haven) and are recorded in the `ATTRIBUTIONS.md` beside them.
- **Montserrat inside the games** (it is part of the show and ships with them); **Space Grotesk** in the launcher and
  exams. They never meet on one screen.
- **Palette:** iris `#7855FA`, aqua `#1FDDE9`, mantis `#92DD23`, peach `#FF9178`, gold `#FFC857` on near-black. Glow comes
  from emissive surfaces, never from flat bright fills.
- **Nothing blocks the game.** Every visual layer has a fallback and a `?flag=0` switch (`?people=`, `?textures=0`,
  `?film=0`), and none of it changes a rule, a score or a question.
- **Authoring tools are dev-only** (`tools/` folders) and never ship to players: pxl, loom and kiln scripts, the render
  pipeline for StarNix's ships, the texture and voxel builders.
