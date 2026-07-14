# NST question-bank format

A question bank is a single Markdown file. One file = one certification exam. The tools
parse it at runtime (`shared/bank-parser.js`), so you can add or edit a bank by dropping a
`.md` into `/banks/` and registering it in `manifest.json` — no build step.

## File shape

```markdown
# <Human title>            ← optional; also settable via `title:` below
cert: NCP-MCI              ← short cert code
title: Nutanix Certified Professional — Multicloud Infrastructure
version: 2026.1            ← optional, free text
pass: 0.80                 ← pass threshold (0–1, or a percent like 80)
domains: architecture, storage, networking, security, vms, data-protection, lifecycle, monitoring, performance

### <question-id>          ← starts a question; the id is stable (progress/mastery keys off it)
domain: storage            ← should be one of the domains above
difficulty: 2              ← 1–5 (1 easy … 5 extreme). Drives the games' tiers.
tags: containers, capacity ← optional, comma-separated
image: images/q1.png       ← optional exhibit (path relative to this file)
image-alt: Prism capacity view showing a container at 80% used
priority: true             ← optional: surface this question earlier/more often
reference: Nutanix Bible — Storage   ← optional citation

Q: What is required to create a storage container in Nutanix?
- [x] A name
  > Only a name is required.                     ← optional per-option note
- [ ] A replication factor
  > Optional; a cluster default applies.
- [ ] An assigned VM
- [ ] A dedup policy

Explain: A storage container needs only a name; other settings inherit cluster defaults.
Teach: Containers are logical — they don't reserve space until data lands.   ← optional
```

## Rules

| Field | Required | Notes |
|---|---|---|
| `### id` | ✅ | Stable, unique. Progress and spaced-repetition key off it — don't renumber. |
| `domain:` | ✅ | Lowercase; ideally listed in the header `domains:`. |
| `Q:` | ✅ | The question stem. May span several lines (until the first option). |
| options | ✅ | `- [ ]` / `- [x]` list, 2–6 options. **`[x]` marks correct.** |
| `Explain:` | ✅ | Shown after answering. May span several lines. |
| `difficulty:` | recommended | 1–5. Defaults to 3 (medium) if omitted. |
| per-option `> note` | optional | Follows an option; the tools show it as that option's rationale. |
| `tags:` | optional | Comma-separated topic tags. |
| `image:` + `image-alt:` | optional | Exhibit/screenshot; path is relative to the bank file. |
| `priority:` | optional | `true` surfaces the question sooner. |
| `reference:` | optional | Source citation. |
| `Teach:` | optional | Longer teaching blurb the games use as a "briefing". |

- **Multi-answer:** mark two or more options with `[x]`. Grading requires the exact set.
- **Labels are case-insensitive** and tolerate `**bold**` (`**Q:**` works too). `Question:`,
  `Explanation:`, and `Briefing:` are accepted aliases for `Q:`, `Explain:`, `Teach:`.
- Anything the parser doesn't recognize is ignored, so notes/comments won't break a bank.

## How each tool uses it

All tools read the same normalized question; each takes what it needs and ignores the rest:

- **Practice Exams** — id, question, options, correct answer(s), explanation, per-option notes, exhibit, domain.
- **StarNix games** — the above plus `difficulty` (tiers), `priority`, `tags`, and `Teach:` (briefings).
- **WWTBANE** — the above; `difficulty` maps to its easy/medium/hard/extreme tiers.

## Validation

The parser reports problems per question. A question missing its stem, <2 options, or no
`[x]` is skipped; a missing `Explain:` or an unknown `domain:` is a warning (the question
still loads). The launcher's bank picker surfaces these when you select a bank.
