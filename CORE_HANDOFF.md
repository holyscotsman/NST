# Core handoff — consolidated NCP-MCI question bank

Supersedes `CORE_HANDOFF_dump1.md` and the paraphrased `questions.authoring.md` (both retired). Covers Dump 1 (exams a1–a4) + Dump 2 (a5).

## Deliverables
- **`starnix_questions.md`** — the bank. 235 questions (240 parsed − 5 removed). Import this.
- **`starnix_briefing_scaffold.md`** — 235 stubs for a separate chat to fill `@briefing`/`@eli5`/`@tags`. NOT for import yet.
- **`starnix_review_notes.md`** — disputed/unresolved keys + source defects. Read before import.
- **`dump1_review_verification.md`** — full web-researched verdicts behind the corrections.
- **`exhibit-images/`** — 29 exhibit images named by `@image` key (+ `MANIFEST.md`, + one orphan).

## Block format (per question)
```
<!-- a1q1 -->            id comment (matches scaffold + review + image key); "corrected" appended if key was fixed
### Q

<stem>                   may span multiple lines (scenario specs/alerts/tables)

- ( ) <option>
    <verbatim per-option explanation>   indented line; starts with "Correct:"/"Incorrect:" etc.
- (x) <option>
    <verbatim per-option explanation>
@domain: <one of: architecture|storage|networking|security|vms|data-protection|lifecycle|monitoring|performance>
@difficulty: <1|2|3>
@image: <id>             only on exhibit questions; file is exhibit-images/<id>.<ext>
@multi: true             only on multi-answer questions
@explain: <verbatim Overall explanation>
```

## Importer requirements (new vs the old format)
1. **Indented per-option explanation line** under each option — parse and attach to that option. This is the one genuinely new construct.
2. **`@multi: true`** → multiple correct options; map to `correctIndices` (all `(x)`). 24 such questions.
3. **`@image: <id>`** → load `exhibit-images/<id>.<ext>`. Extensions vary (png/jpg/jpeg/webp); resolve by glob on the key. 29 exhibits.
4. **`@explain`** is the source Overall explanation (one block), not per-option.
5. **Multi-line stems** — read everything between the blank after `### Q` and the first `- (` option.
6. No `@briefing`/`@eli5`/`@tags` here (separate scaffold) and no `@review` (separate notes). `@id` is omitted; hash the stem as before. The `<!-- id -->` comment is for cross-file joins only.

## Before you import
- `starnix_review_notes.md` lists **a1q13, a1q27, a3q7** — kept with the SOURCE key but unverified. Confirm or drop before relying.
- **a2q1** and **a4q15** were corrected (source key was wrong) and marked `corrected`; their per-option + overall text was rewritten by ingestion.
- Dropped (not in the bank): a1q48, a3q29, a3q1 (bad/flawed), a4q36, a3q10 (exact dups).
- Image orphan: `exhibit-images/_orphan_a4q50.png` is unreferenced (no source image for a4 Q50).

## Counts
235 questions · 24 multi-answer · 29 exhibit · 2 corrected. Domains: vms 42, networking 31, data-protection 30, monitoring 29, storage 25, architecture 23, security 21, lifecycle 19, performance 16 (after drops).
