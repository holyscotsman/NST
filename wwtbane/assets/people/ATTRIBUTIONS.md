# People assets: sources and licences

Everything in this folder is **CC0 1.0 Universal** (public domain). No attribution is required; it is given here because
it is the right thing to do and because the project keeps a record of where every imported file came from.

| Files | What | Source | Licence |
|---|---|---|---|
| `body_f/`, `body_m/` | Rigged base bodies (Superhero Female / Male) with eyes and brows | Quaternius, *Universal Base Characters [Standard]* <https://quaternius.itch.io/universal-base-characters> | CC0 1.0 |
| `Hair_*/`, `Eyebrows_*/` | Hair styles and brows, rigged to the head bone | same pack, `Hairstyles/Rigged to Head Bone` | CC0 1.0 |
| `anims.glb` | Five animation clips (Idle_Loop, Idle_Talking_Loop, Sitting_Idle_Loop, Sitting_Talking_Loop, Dance_Loop) | Quaternius, *Universal Animation Library [Standard]* <https://quaternius.itch.io/universal-animation-library> | CC0 1.0 |

## What was changed

Only what shrinks them for the web (see `wwtbane/tools/optimize-people.mjs`):

- textures resized (1024 px bodies, 512 px hair) and re-encoded as WebP;
- the animation file cut down to the five clips above, with the keyframes resampled;
- two texture file names the original `.gltf` files referenced but did not ship (`T_Eye_Normal_png.png`,
  `T_Hair_1_Normal_png.png`) were pointed at the files that were shipped (`T_Eye_Normal.png`, `T_Hair_1_Normal.png`).

The meshes themselves are untouched. **Clothes are not part of the pack** (the bodies ship in underwear): they are
generated at load time in `src/shell/stage/actors.js` by cutting shells out of the body mesh.

## The rule this relaxes

The project's brand rule was "original art in code, no imported models". On 2026-10-28 the owner signed off on importing
**CC0 models and textures, sourced and prepared without their involvement**, for the graphics overhaul. Anything added
here must keep to that: CC0 only, recorded in this file.
