# Authoring questions — see `docs/BANK_FORMAT.md` at the repository root

**This file used to describe a WWTBANE-only authoring format and an importer that
compiled it into `src/content/questions.js`. Both are gone (v2.61.0).** Questions
are no longer baked into this game: all three tools load a bank at runtime from
`/banks/`, so there is nothing to compile and nothing to import.

Write banks in the one live format, documented at the repository root:

- **[`docs/BANK_FORMAT.md`](../../docs/BANK_FORMAT.md)** — the format itself
- **[`banks/README.md`](../../banks/README.md)** — where a bank file goes and how
  to register it in `manifest.json`

The formats are not compatible, which is the reason this page is a pointer rather
than a deletion. The old one used `## Q1` headings with `**Question:**` and
`- **Difficulty:** easy`; the live one uses `### <stable-id>` with `Q:`,
`difficulty: 1`–`5` and `Explain:`. Anything written to the old shape will not
parse, and nothing will tell you so except an empty bank.

## Where the old content went

- `docs/priority-question-bank.md` — the owner's own 25 questions. All 25 are
  accounted for in the live banks: 23 in `banks/ncp-mci/ncp-mci.md` and 2 in
  `banks/drafts/wwtbane-legacy.md`. The file is kept as provenance for the
  answer keys, which are owner-authored.
- `banks/provenance/` (repository root) — the interchange export the bank was
  built from, and its review pass. There were two copies of each, in this
  directory and in `starnix/banks/`, and they had diverged; v2.63.0 kept the one
  the shipped bank agrees with and recorded the differences in
  [`banks/provenance/README.md`](../../banks/provenance/README.md).
