# Authoring the question bank (Markdown)

Write your questions in **one Markdown file**, drop any images in a folder, and
one command turns it into the game's bank — validated the same way the game
validates at boot. Your answer key is authoritative; the game never uses AI to
decide correctness.

---

## The format

Each question is an **H2 heading** (`## …`) followed by fields and an option
list. Mark the correct answer(s) with `[x]`.

```markdown
## Q1
- **Domain:** storage
- **Difficulty:** easy

**Question:** A three-node cluster hosts a storage container configured with
replication factor 2 (RF2). How many simultaneous node failures can it survive
without data loss?

- [ ] Two
- [x] One
- [ ] Three
- [ ] Zero — RF2 provides no fault tolerance

**Explanation:** RF2 keeps two copies of the data, so the container tolerates
one node failure.
**Phone a friend:** I'm fairly sure it's one — RF2 means two copies.
**Steve:** Count the copies RF2 keeps, then subtract one for the original.
**Reference:** Nutanix Bible — Redundancy Factor
```

### Fields

| Field | Required | Notes |
|---|---|---|
| **Domain** | ✅ | One of: `prism`, `storage`, `dataprotection`, `ahv`, `networking`, `lifecycle`, `monitoring`, `migration`, `unifiedstorage`, `security`, `performance`, `foundation`. Common aliases work (e.g. `AOS`→storage, `LCM`→lifecycle, `Move`→migration, `Files`→unifiedstorage). |
| **Difficulty** | ✅ | `easy`, `medium`, `hard`, or `extreme`. |
| **Question** | ✅ | The stem. Can wrap across lines. |
| options | ✅ | 4–6 lines of `- [ ]` / `- [x]`. Exactly one `[x]` for single-answer; two or more for multi-answer (leave at least one wrong option). |
| **Explanation** | ✅ | Shown after the answer. Can wrap across lines. |
| **Phone a friend** | optional | The Phone-a-Friend hint (hedged toward the right answer). |
| **Steve** | optional | Steve's teaching clue for this question. |
| **Reference** | optional | A doc/section citation, shown under the explanation. |
| **Tags** | optional | Comma-separated. |
| **Image** | optional | A filename (see Images below). |
| **Alt** | with Image | A short description of the image (required for accessibility). |
| **Caption** | optional | A visible caption under the image. |
| **Type** | optional | `single` or `multi`. If omitted, it's inferred from how many `[x]` you mark. |
| **Impossible** | optional | `true` on an `extreme` question marks it as the genuinely-obscure "first final" (the loss reveals the real answer). |
| **Priority** | optional | `yes` marks a "master this first" question. Mastery-driven runs strongly prefer priority questions until you graduate them, so a flagged set gets drilled ahead of the rest of the bank. Selection hint only — it never affects grading. |
| **ID** | optional | Leave blank — IDs auto-generate per domain/difficulty. |

### Multi-answer example

```markdown
## Q2
- **Domain:** dataprotection
- **Difficulty:** medium
- **Type:** multi

**Question:** Which of the following are valid Nutanix protection strategies?
(Select all that apply.)

- [x] Asynchronous replication
- [x] NearSync replication
- [ ] Telepathic replication
- [x] Metro availability

**Explanation:** Async, NearSync, and Metro are all real; the third is not.
```

### Images

1. Put image files in **`src/content/images/`** in the repo.
2. Reference each by **filename** in the question: `- **Image:** rf2-diagram.png`.
3. Always add an **Alt** line describing it.

Images must be local files (the game is a static site and plays offline — no
external URLs). Keep them reasonably small (they display up to ~200px tall).

---

## Turning it into the game bank

Save your file as `docs/question-bank.md` (or anywhere) and run:

```bash
node scripts/import-questions.mjs docs/question-bank.md
```

It prints a per-tier/per-domain summary, lists any questions it rejected (with
the reason), and writes `src/content/questions.js` — but **only if everything
validates** and there are enough questions for a full run
(**≥ 10 easy, 10 medium, 9 hard, 1 extreme**). Add `--force` to write just the
valid ones while you're still building the bank.

To **add** a set to the existing bank instead of regenerating from scratch, pass
`--merge`. The parsed questions are placed ahead of what's already in
`questions.js`, replacing any that share an `id` (so re-running is safe) and
keeping the rest. This is how the priority practice-exam set was added without
disturbing the main bank:

```bash
node scripts/import-questions.mjs docs/priority-question-bank.md --merge
```

You don't have to run it yourself — upload the Markdown (and images) and I'll
run the import, show you the report, and ship the new bank.

---

## Prompt you can paste into another chat to structure your questions

> Convert my questions into this exact Markdown format. For each question output
> an `## Qn` heading, then `- **Domain:**` (one of: prism, storage,
> dataprotection, ahv, networking, lifecycle, monitoring, migration,
> unifiedstorage, security, performance, foundation) and `- **Difficulty:**`
> (easy/medium/hard/extreme). Then a `**Question:**` line with the stem, then
> 4 options as `- [ ]` lines with the correct one(s) marked `- [x]`, then an
> `**Explanation:**` line. If a question has an image, add `- **Image:**
> <filename>` and `- **Alt:** <description>`. Do not invent answers — keep my
> keys exactly. Output only the Markdown.

> **Note:** because these are your own questions, the importer marks them
> `reviewStatus: "human-reviewed"`. That asserts you stand behind the keys —
> which finally clears the question-bank review flag in `FLAGS.md`.
