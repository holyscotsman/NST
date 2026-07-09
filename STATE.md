# STATE.md — resume point

**Read order each session:** `CLAUDE.md` → this → `AUTONOMOUS_RUN.md`.

## Where things stand

The first playable end-to-end build is in place: a complete, static, GitHub
Pages–hostable game.

- **Live site:** https://holyscotsman.github.io/WWTBANE/

### Done
- **Core (pure, headless-testable)** — `src/core/`
  - `config.js` — run shape, tiers, money ladder, bank boundaries, shop prices, mastery constants.
  - `rng.js` — seeded PRNG (xmur3 + mulberry32), shuffle, weighted pick, seed strings.
  - `questionSchema.js` — structural validator (never judges correctness).
  - `mastery.js` — Leitner boxes, cold-start seeding, promote/demote, graduate-out ceiling, assisted-no-promote.
  - `lifelines.js` — 50:50, Ask the Audience, Phone a Friend, with the §3 integrity guarantees.
  - `coins.js` — money ladder, tier-boundary banking, payout.
  - `selection.js` — seeded + mastery selection, tier fill with graceful backfill, double-buffer `SetManager`.
  - `runController.js` — the run state machine (grade → feedback → advance), mastery updates, event emission.
  - `eventBus.js` — the §10 bridge. `aiAdapter.js` — the forbidden-at-runtime no-op seam.
- **Shell (browser)** — `src/shell/`
  - `studio.js` — persistent WebGL studio + green room, camera cuts, event reactions, reduced-motion, disposal.
  - `ui/` — `dom.js`, `hud.js` (ladder/coins/lifelines), `overlay.js` (quiz), `screens.js` (title/green room/result/help/settings).
  - `audio.js` — original WebAudio stings. `persistence.js` — localStorage save + prestige.
  - `main.js` — wiring + navigation state machine.
- **Content** — `src/content/questions.js` (157 verified) + `quarantine.js` (2 held). AI-drafted, independently AI-verified, **pending human sign-off**.
- **Tests** — `tests/*.test.mjs` (41 headless pins with negative controls), `smoke.mjs`, `e2e.mjs` (full-flow browser).
- **Vendored** — Three.js r160 + addons, self-hosted Montserrat (no CDN, no external requests).

### Mini-specs captured in code
- **Money ladder:** easy 100/ea → banks 1,000 (Q10); medium 500/ea → 6,000 (Q20); hard 2,000/ea → 24,000 (Q29); final → 50,000 (Q30). Death pays the last banked amount.
- **Mastery→tier:** box 0–1 hard, 2–3 medium, 4 easy, 5 graduated. Extreme is pinned. Cold-start = authored difficulty.
- **Impossible first final:** handled in `main.startRun` by swapping Q30 for an `impossible` question while `flags.reachedFinalBefore` is false; the flag is set the moment the final is shown.

## Next candidates (not blocking a playable ship)
- Human review pass over the question bank (see `FLAGS.md`).
- Host dialogue / richer Steve visual-novel presentation (content = human).
- Optional images per question (schema has room; loader TBD).
- Visual sign-off on the studio (`BROWSER_QA.md`).
