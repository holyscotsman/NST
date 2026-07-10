# BACKLOG.md

Ideas that aren't scheduled work yet. Promote to `AUTONOMOUS_RUN.md` when specced.

## Gameplay
- Per-question images/diagrams — **hook shipped** (schema + renderer); the
  image content itself is human-authored and still wanted.
- Daily seed (a shared seed-of-the-day; the `?seed=` link plumbing shipped).
- Difficulty "confidence" meter drawn from mastery box distribution.
- More lifelines or green-room perks (e.g., "swap the question").

## Content pipeline
- A proper authoring tool / CSV importer that runs the validator.
- Human review workflow surfacing `reviewStatus` and diffs.
- Explanations with links to the exact Nutanix doc section.

## Presentation
- Procedural canvas textures (recommended next): studio floor carpet/brushed
  disc, green-room wall paneling + sofa fabric weave — all generated in code
  like the existing wordmark/art, no image files.
- Host visual-novel dialogue between questions.
- Richer Steve scene (portrait, typewriter text).
- Win/lose sting variations; subtle ambient bed (still original, still < brand rules).

## Tech
- Service worker for full offline play + installable PWA.
- Bundle/minify step (optional; the game runs unbundled today).

## From the code review (docs/CODE_REVIEW.md) — deferred
- Proper radiogroup ARIA: roving tabindex + arrow-key nav for the answer
  options (operable today via Tab + number keys).
- Beat-index the music scheduler so it doesn't re-scan the note table each step
  (only matters if the track set grows).
- Hoist the duplicated `reduced()` helper into `dom.js`; extract the shared
  `.reveal` builder used by the green room + results.
- Align `load()` vs `importString` save-version handling before bumping the
  save schema; decide whether `MAX_BOX`/`GRADUATED_BOX` should be one constant.
- Clear the `_previewMode` (`?scene=`) dev-tool interval on scene change.
