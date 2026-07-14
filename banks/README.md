# Question banks

Each `.md` file here is one certification's question bank. The tools (WWTBANE, StarNix,
Practice Exams) load the **active** bank at runtime — nothing is baked into the apps.

## Add a bank

1. Write `your-cert.md` in the format below (or in [`docs/BANK_FORMAT.md`](../docs/BANK_FORMAT.md)).
2. Put any exhibit images next to it (e.g. `images/…`).
3. Register it in `manifest.json`:

```json
{
  "banks": [
    { "id": "ncp-mci", "file": "ncp-mci.md", "cert": "NCP-MCI", "title": "Nutanix Certified Professional — Multicloud Infrastructure" }
  ]
}
```

4. Open the Study Tool and pick the bank from the launcher (**Settings → Question bank**).

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

Full spec + all optional fields: [`docs/BANK_FORMAT.md`](../docs/BANK_FORMAT.md).

## `_archive/`

Old banks kept for reference. Files here are **not** loaded (they're not in `manifest.json`).
Move one up a level and add it to the manifest to use it.
