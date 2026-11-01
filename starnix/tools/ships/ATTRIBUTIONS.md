# StarNix art sources

- **Ships, rocks and station** are built in `tools/ships/ships.js` (three.js geometry written for this project) and rendered
  to the sprite images in `assets.js` by `tools/ships/build.mjs`. The plated hull and gold textures are generated in code
  with the loom tool (`materials.tx.js`).
- **ambientCG (CC0 1.0, https://ambientcg.com)**, used as supplied or resized: `Rock030` (asteroids, via `rock-material.mjs`),
  `Rock029` (canyon walls and obstacle rocks in Chasm Chase, colour and normal map), `Asphalt025C` (the road).
  CC0 is public domain; the sources are recorded here anyway.
