# Critical code review — findings & remediation

A full-codebase review run across four subsystems (pure core, WebGL/audio shell,
DOM UI, tests/ingestion). This records what was found, what was fixed, and what
was consciously deferred. Overall the codebase was found healthy — the load-
bearing invariants all hold; the issues were edge cases, per-frame allocations,
a11y gaps, and cleanliness.

## Fixed in this pass

### Correctness
- **Seeded lifelines were order-dependent.** `runController` keyed the lifeline
  rng with a run-wide `rngSalt++`, so a question's audience/phone result changed
  based on how many lifelines were used earlier. Dropped the salt — the
  `(seed, run, question, type)` key is already unique, so outcomes are now
  reproducible AND order-independent.
- **`selectionWeight` staleness could go negative** (it mixed two counters —
  set index vs run index), making a graduated item unselectable. Clamped with
  `Math.max(0, …)`.
- **`askAudience` orphaned vote mass** when the "trap" was the only distractor
  (a 3-of-4 multi item): the leftover was scattered onto random bars by the
  largest-remainder fill. Now folded into the correct side.
- **Importer could clobber a good bank.** `--force` would write
  `export const QUESTIONS = []` from an all-invalid bank, and the write wasn't
  atomic. Now it hard-refuses an empty result and writes via temp-file + rename.
- **Stale loss reveal** persisted if you left the green room to the title
  without acknowledging it; cleared in `showTitle()`.
- Hardened `runController.answer()` against a non-array argument, and added a
  re-entrancy guard to `continueAfter` (double Enter/click could skip a Q).

### Accessibility
- **Reduced motion now zeroes `animation-delay`/`transition-delay`** too, not
  just durations — staggered entrances were still animating in one-by-one,
  violating the "stagger collapses to instant" rule.
- **Ask-the-Audience count-up no longer floods the live region** — the animated
  bars/percentages are `aria-hidden`, and the panel carries one static
  poll summary for screen readers. The count-up also stops writing when the
  question changes (generation token).
- Intro cinematic dialog now takes focus and announces each line via a live
  region.

### Performance (per-frame allocations removed from the RAF path)
- `setMouth` no longer calls `Object.entries` every frame per person (the
  single biggest GC source in `_tick`).
- The camera director returns a reused `{p,t}` wrapper instead of a fresh
  object each frame.
- `_crowdTick` no longer allocates a closure per frame; the `talker` lookup and
  the `_flash` `THREE.Color` are reused instead of rebuilt.
- `dispose()` now frees textures and the bloom composer (it left them leaked).

### Cleanliness
- Removed dead CSS from the old Phone-a-Friend design (`.phone`, `.phone-text`,
  `.phone-caret`), a redundant `:nth-of-type(1)` option selector, dead fields
  (`_typeIv`, `_raf`), a dead pulse-restart branch, and a doc/return-shape
  mismatch in `questionSchema`. Promoted overlay magic timings to named
  constants. Export-code button resets its label.

### Tests added (all with negative controls)
- Importer write-gate: refuses/does-not-clobber on invalid, `--force` never
  writes `[]`, refuses a run-incomplete bank without `--force` and writes the
  valid subset with it, and writes cleanly when complete.
- Parser: alias normalization, multi-line folding, lifeline/tags/impossible
  extraction, `**Type:** single` + two keys rejected, duplicate IDs rejected.
- Mastery-mode selection reproduces exactly with the same injected rng.
- Ask-the-Audience single-distractor edge sums to 100 (guards the orphan fix).

## Deferred (tracked in BACKLOG.md)
- **Radiogroup ARIA is half-implemented** — options are individually tabbable
  with no roving tabindex / arrow-key navigation. Operable today (Tab + number
  keys); a proper roving-tabindex pass is a larger change.
- **Music scheduler re-scans the note table each step** — allocation-free in the
  idle path, but a beat-indexed schedule would remove the per-step scan if the
  track set grows.
- Minor: hoist the duplicated `reduced()` helper into `dom.js`; extract the
  shared `.reveal` builder; align `load()`/`importString` version handling
  before ever bumping the save schema; collapse `MAX_BOX`/`GRADUATED_BOX` or
  document why they're distinct; `_previewMode` dev-tool interval isn't cleared.

## Assessment
The core (coins, mastery, selection, lifelines, rng, persistence, schema) is
deterministic and correct; 50:50 never removes a correct option, Phone a Friend
is exactly 68% accurate, the audience always sums to 100 with a clear winner,
coins bank at Q5/Q10/Q17/Q25 with death→last-banked, and mastery is never wiped
by a win. There is exactly one RAF, reduced motion gates every animation, and
audio only starts on a gesture. After this pass the RAF/scheduler hot paths are
allocation-free, the reduced-motion and live-region a11y gaps are closed, and
the ingestion gate can no longer ship a broken bank.
