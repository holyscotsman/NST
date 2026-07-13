# WWTBANE Graphics Overhaul — adapted directive + ledger

This is the owner's 5-phase graphics directive, **adapted to the current
modular game** (the original was written for the retired single-file prototype).
The full audit is in `docs/GRAPHICS_AUDIT.md`.

## Adaptations (why this differs from the uploaded directive)

- **Modular, not single-file.** `CLAUDE.md §5` mandates plain-JS modules; the
  directive's own escape clause defers to it. Delivery stays modular.
- **Three.js vendored, never CDN** (`CLAUDE.md §5`). Effects that would need
  un-vendored addons (`Reflector`, `RoomEnvironment`, stock post shaders) are
  built from **core Three.js** (`PMREMGenerator`, procedural env) and **inline
  custom shaders** instead.
- **Original art, no cloned trade dress** (`CLAUDE.md §6`). The stage medallion
  is the show's own mark, **not** the Nutanix corporate logo.
- **FPS not benchmarkable in CI.** A dev FPS meter (`?fps=1` / Alt+F) is provided
  for the owner to verify the 60/≥45 budget on real hardware; perf principles
  (one RAF, instancing, no per-frame alloc) are enforced and audited.
- **Scope = the gaps.** Phases 3/4/5 are already substantially implemented; this
  overhaul targets the audit's identified gaps, in the directive's phase order,
  shipped as tested PRs.

## Progress ledger

- [x] Phase 0 — Audit, dev FPS meter, shots harness
- [x] Phase 2 — Environment map + reflective hero floor + emissive tuning
- [x] Phase 3 — Shadows, rim/back light, lock-in cue
- [x] Phase 1 — Set detail (LED wall, columns, medallion, truss/fixtures, bevels)
- [x] Phase 4 — Post polish (vignette/grain) + camera micro-motion + toggle
- [x] Phase 5 — UI lozenges, dust motes, branded transitions
- [x] Final verification pass (structural — see below; on-hardware sign-off in `BROWSER_QA.md`)

(Phase order is 0 → 2 → 3 → 1 → 4 → 5: materials/light first, since they make
the geometry work in Phase 1 read; camera/UI polish last.)

## Work log

<!-- YYYY-MM-DD | Phase N | done|HANDOFF|BLOCKED | note -->
- 2026-07-11 | Phase 0 | done | Audit grounded in real src; dev FPS meter
  (`src/shell/fpsMeter.js`, `?fps=1`/Alt+F); shots harness `tests/shots-gfx.mjs`
  writing before/after into `shots/`. Modular/vendored architecture confirmed.
- 2026-07-11 | Phase 3 | done | PCF soft shadows (one shadow-casting key,
  1024 map, tuned bias/radius; figures cast, disc receives); cool rim/back
  light behind the hot seats; `ui:lockin` cue dims the fills to a hard-key pool
  on lock-in and crossfades back on the reveal (reduced motion snaps; emitted
  from main's onSuspense).
- 2026-07-11 | Phase 2 | done | PMREM environment from a procedural neon scene
  (`_setupEnvironment`, core THREE — no addon/CDN) → `scene.environment` on both
  sets; hero floor now low-roughness/high-metal (metal 0.9, rough 0.22,
  envMapIntensity 1.5) reflecting the rig; emissive bumped >1 on rim/spokes/
  monitors/halo to drive bloom. Tests green; dispose frees the env RT.
- 2026-07-11 | Phase 1 | done | Set detail: curved LED video wall (procedural
  panel texture, BackSide cylinder arc), emissive light columns (two instanced
  meshes, tuned below bloom threshold so they read as tubes not slabs), show
  medallion (torus rings + emblem — the show's own mark, not Nutanix's), and
  instanced truss fixtures (cans + lenses). Higher segment counts / bevels on
  hero props. Shipped #21.
- 2026-07-11 | Phase 4 | done | Post polish: inline vignette+grain ShaderPass
  appended last in the composer; slow camera micro-motion (breathing) in the
  studio idle; `postFx` setting gates the whole composer vs a direct render, so
  the effects can be turned off. Reduced motion holds the camera still. #22.
- 2026-07-11 | Phase 5 | done | UI/motion/VFX: answer options redesigned to the
  broadcast hexagonal-lozenge silhouette (`clip-path` hex, cool hairline that
  traces the shape + subtle top-lit gradient fill; all state "borders" moved to
  inset shadows since a clipped border is a no-op); animated gold edge-glow on
  the locked option clipped to the lozenge; floating dust motes in the beams
  (additive Points, drift+wrap in place, gated on motion+effects); branded
  gradient screen-wipe on top-level screen changes (menu↔game↔results), skipped
  under reduced motion / effects-off. Verified all answer states via the shots
  harness; 86/7/18 green.
- 2026-07-11 | Final verify | done | Structural cross-check on merged main: full
  matrix green (86 headless / 7 smoke / 18 e2e, no console errors); a dedicated
  probe confirmed the effects-off + reduced-motion path (direct render, no
  composer; motes + wipe suppressed) boots, plays, and reveals cleanly; a single
  `tests/shots-gfx.mjs` frame shows all five phases coexisting (LED wall +
  columns + floor medallion, reflective disc, soft shadows + rim, vignette/grain,
  dust motes) with the hexagonal lozenges on top. The remaining gate is the
  human on-hardware FPS + look sign-off, queued in `BROWSER_QA.md`
  (`CLAUDE.md §6` — structural proof ≠ visual observation).
