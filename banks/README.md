# Question banks

Each `.md` file here is one certification's question bank. The tools (WWTBANE, StarNix,
Practice Exams) load the **active** bank at runtime — nothing is baked into the apps.

Each bank lives in its own folder (e.g. `ncp-mci/`) with the Markdown file and an
`images/` folder for any exhibits. The bundled `ncp-mci/` bank is a working example.

## Add a bank

1. Make a folder `your-cert/` with `your-cert.md` in the format below (or in
   [`docs/BANK_FORMAT.md`](../docs/BANK_FORMAT.md)).
2. Put any exhibit images in `your-cert/images/` and reference them as `images/…`.
3. Register it in `manifest.json`:

```json
{
  "banks": [
    { "id": "ncp-mci", "file": "ncp-mci/ncp-mci.md", "cert": "NCP-MCI", "title": "Nutanix Certified Professional — Multicloud Infrastructure" }
  ]
}
```

4. Reload the Study Tool — it appears in the **Certification** selector on the home page
   (also under Settings → Question bank). Pick it, then open any tool.

## Question ids must be unique across ALL banks

Not just within one file. Mastery is stored per question id with no bank
scoping — `nst.mastery.v1` holds one record per id, full stop. Two banks using
`q01` share a single record, so answering that question in one bank moves the
other's box, its counters and its next review date. Nothing warns you at
runtime; the schedule simply becomes wrong for both.

**Prefix every id with the bank.** The bundled banks do this — `ncp25-q01` and
`mci-security-q3p5` — which is why they have never collided.

```
### ncp-ai-storage-004
```

## Check a bank before you commit it

```bash
node scripts/bank-test.mjs
```

It parses every bank with the same parser the app uses and fails on: cross-bank
id collisions, duplicate ids within a bank, a manifest entry whose file is
missing, a bank file that no manifest entry mentions (so the app never sees it),
a cert pointing at a bank that doesn't exist, questions with no stem, fewer than
two options, no answer key or an answer key pointing past the end of the options,
a domain that isn't in the bank's own `domains:` line, an exhibit image that
doesn't resolve, and two things that break under the runtime's option shuffling:
an explanation that names an option **by letter** ("Option B is wrong"), and an
option that says "all of the above" or "both A and B".

It also warns — without failing — about questions with no explanation, and about
the correct answer being the longest option too often, which is a tell that makes
questions guessable.

It runs in CI, so a bad bank cannot reach `main`.

## Format (short version)

```markdown
# Nutanix Certified Professional — Multicloud Infrastructure
cert: NCP-MCI
pass: 0.80
domains: storage, networking, security

### storage-001            <!-- stable id: progress keys off this -->
domain: storage
difficulty: 2              <!-- 1 (easy) … 5 (extreme) -->

Q: What is required to create a storage container in Nutanix?
- [x] A name
  > Only a name is required.
- [ ] A replication factor
- [ ] An assigned VM

Explain: A storage container needs only a name; other settings inherit cluster defaults.
```

- `- [x]` marks the correct option (two or more `[x]` = a multi-answer question).
- Everything except `id`, `domain`, `Q:`, the options, and `Explain:` is optional.
- Optional per-question fields: `tags`, `image` + `image-alt`, `priority: true`, `reference`, and a `Teach:` blurb (used by the games).
- `Clue:` is Steve's green-room hint in Who Wants to be a Nutanix Engineer — a couple of
  sentences that *teach toward* the answer without naming it. He only ever offers a hard
  question that carries one, so a bank with no clues leaves his green room empty. It may
  wrap across lines like `Explain:` and `Teach:`; StarNix and Practice Exams ignore it.

```
Clue: Consider what each rule protects. Pinning a VM to specific hosts is often for
licensing or dedicated hardware, so the platform treats it as non-negotiable.
```

Full spec + all optional fields: [`docs/BANK_FORMAT.md`](../docs/BANK_FORMAT.md).

## Bundled bank

`ncp-mci/` is a 255-question NCP-MCI bank (with exhibit images) — the working example. Remove
its entry from `manifest.json` if you want the tools to start with no certification selected.
