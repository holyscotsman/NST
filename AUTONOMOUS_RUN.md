# AUTONOMOUS_RUN.md — loop + queue

## The loop
1. Read `CLAUDE.md` → `STATE.md` → this file.
2. Take the top **unblocked** item from the queue.
3. Build it from a spec or `CLAUDE.md §3`. If a needed decision isn't written
   anywhere, **do not invent it** — move the item to **Blocked** with a note in
   `FLAGS.md`, and take the next unblocked item.
4. Land it to the definition of done (`CLAUDE.md §9`): implemented + headless
   green **with negative controls** + `CHANGELOG.md`/`STATE.md` updated + commit.
   Visual units also go to `BROWSER_QA.md` as "code-complete, visual-pending".
5. Only fully stop when everything left is blocked.

## Queue

### Ready
- _Empty — everything remaining is blocked on the human (below) or lives as an
  unspecced idea in `BACKLOG.md`. Promote a backlog item here once specced._

### Done (recent)
- Save export/import: Settings exports the save as a portable code and imports
  one (confirm-gated, migrate-normalized, garbage-rejected).
- Question image hook: schema field (`image {src, alt, caption?}` — local-only,
  alt required) + overlay renderer with load-failure fallback. **No image
  content authored** (that stays human).
- Shareable challenge links: `?seed=NTNX-XXXXXX` boots straight into the
  seeded run; pause menu copies the link; one `normalizeSeed` path for typed
  and linked seeds.
- Host dialogue hooks: welcome beat + per-question quips via speech bubbles
  (`hostLines.js`; copy pending human review, FLAGS #2).
- Green-room mastery dashboard — built, then **removed at the owner's request**
  (batch 2). Core `domainProgress` + tests remain if it's ever wanted again.

### Blocked (need the human — see FLAGS.md)
- Final human review / sign-off of the question bank and Steve/phone clues.
- Palette identity confirmation (StarNix-inherited vs WWTBANE's own).
- Any authored content: questions, keys, host/Steve dialogue, difficulty values.

## Notes
- Never push to a branch other than the one assigned for the session.
- Content generation for THIS build used the §4-sanctioned offline path
  (AI draft → independent AI verify → `reviewStatus: verified`, human sign-off
  pending). Do not wire AI into the runtime answer path — the `AIAdapter` stays a
  no-op.
