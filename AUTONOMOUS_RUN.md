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
- Question images: extend the schema with an optional image ref and a loader; do
  **not** author image content.
- Analytics of a player's weak domains in the green room (surface mastery by
  domain). Pure UI over existing mastery state.
- Host dialogue hooks in the studio once host content exists.

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
