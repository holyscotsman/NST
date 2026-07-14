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

## Bundled bank

`ncp-mci/` is a 255-question NCP-MCI bank (with exhibit images) — the working example. Remove
its entry from `manifest.json` if you want the tools to start with no certification selected.
