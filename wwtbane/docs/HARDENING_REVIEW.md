# Hardening review — post graphics-overhaul + feedback batches

An adversarial review of everything that landed since the last critical review
(PR #18): the full graphics overhaul (PRs #19–24) and three owner-feedback
batches (PRs #25–26 + the thinking-dim/animation drop). Five reviewers swept
distinct dimensions; each reported finding was then independently verified with a
refute-by-default pass. **11 confirmed, 2 refuted.**

## Confirmed → fixed

| # | Sev | Area | Fix |
|---|-----|------|-----|
| 1 | high | a11y: focus ring | `.option` `clip-path` clipped the outset focus outline to nothing → clip-safe inset gold ring, declared after the state rules so it wins. |
| 2 | med | GL teardown | `EffectComposer.dispose()` skips added passes → dispose each pass (bloom FBO chain, output, grain) before `composer.dispose()`. |
| 3 | med | GL teardown | scene traverse freed geometry/material but not `InstancedMesh` instance buffers → `o.dispose()` for instanced meshes (audience/chairs/spokes/fixtures/columns). |
| 4 | med | a11y: radiogroup | declared `role=radiogroup/radio` but no roving tabindex / arrow nav; `<li>` broke the owned relationship → roving tabindex (synced on reveal + selection), Arrow/Home/End with selection-follows-focus, `role=presentation` list items. Multi/checkbox path unchanged. |
| 5 | low | reduced-motion | film-grain `uTime` advanced under reduced motion → guarded with `!this.reduced` so the grain field freezes. |
| 6 | low | a11y: colourblind | selected state was colour+glow only (no glyph), flattened further under reduced motion → `::before` shape marker (◉ radio / ▣ checkbox) in the mark slot. |
| 7 | low | event lifecycle | pausing during lock-in suspense stranded the "Final answer!" bubble over the menu and still submitted the locked answer → `onPause`/`onResume`/`abortPending`: park the submit + pull the bubble; re-arm on resume, drop on quit. |
| 8 | low | visual | crowd walk-on actor used a fixed palette → adopts the replaced seat's per-instance colours (stored per seat; hair material exposed from `person()`). |
| 9 | low | persistence | `load()`/`importString` diverged on save version and `migrate()` never normalized it; `MAX_BOX`/`GRADUATED_BOX` were separate → `SAVE_VERSION` constant normalized in `migrate()`; single `MASTERY_MAX_BOX` source. |

(#4 was reported by two dimensions — one finding.)

## Refuted (verified NOT defects — left as-is)

- **Music scheduler note-table re-scan** — it's a 60ms `setInterval` lookahead
  scheduler, not an RAF/draw loop, and allocates nothing. Only revisit if the
  note tables grow by an order of magnitude.
- **`_previewMode` (`?scene=`) interval never cleared** — a single interval on a
  terminal dev-only page with no teardown path; not an accumulating leak.
- **Duplicated `reduced()` helper / `.reveal` builder** — accurate observation but
  pure style, no defect (kept as optional cleanup in `BACKLOG.md`).

## Tests added (with negative controls)
- Smoke: arrow-key navigation selects within the radiogroup (roving tabindex +
  selection-follows-focus).
- Mastery: the graduate-out ceiling equals the promotion cap (graduation stays
  reachable).
- Persistence: the save version is stamped from `SAVE_VERSION` and normalized on
  migrate (future/unknown version still rejected — existing negative control).

Gates after the pass: 90 headless / 8 smoke / 18 e2e green. WebGL look + the new
focus/selection cues queued in `BROWSER_QA.md` for on-device sign-off.
