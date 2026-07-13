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

## From the code review (docs/CODE_REVIEW.md) — status
Resolved in the hardening pass (`docs/HARDENING_REVIEW.md`):
- ~~Proper radiogroup ARIA: roving tabindex + arrow-key nav~~ — **done**
  (roving tabindex + Arrow/Home/End; `role=presentation` list items).
- ~~Align `load()` vs `importString` save-version handling; decide
  `MAX_BOX`/`GRADUATED_BOX` one constant~~ — **done** (`SAVE_VERSION` constant
  normalized in `migrate()`; `MASTERY_MAX_BOX` single source).

Reviewed and intentionally left as-is (not defects):
- Beat-index the music scheduler — **not worth it**: the note-table re-scan is a
  60ms `setInterval` lookahead, not an RAF/draw loop, and allocates nothing.
  Only revisit if the note tables grow by an order of magnitude.
- Hoist the duplicated `reduced()` helper / extract the `.reveal` builder — pure
  style; four one-line copies and a small markup dup, no defect. Optional.
- Clear the `_previewMode` (`?scene=`) interval — **not a leak**: it's a single
  interval on a terminal dev-only page with no teardown path.
