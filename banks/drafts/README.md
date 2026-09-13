# Drafts

A bank being written lives here until it is ready to publish.

Nothing in this directory is offered to anyone. The app reads
`banks/manifest.json`, and a file here is deliberately not in it.

## Why the directory exists

`scripts/bank-test.mjs` checks every bank the manifest lists, and one of its
rules is that every `.md` under `banks/` **is** listed — because a bank the
manifest does not mention is invisible to the app, which is nearly always a
mistake.

That rule made starting a new bank impossible without publishing it. The moment
you created `banks/ncp-ai/ncp-ai.md`, the suite failed:

```
FAIL every bank file on disk is listed in the manifest  -- ncp-ai/ncp-ai.md
```

The only way to a green build was to add an unfinished bank to the file that
decides what the live app offers people.

Files under `banks/drafts/` are exempt. Not being in the manifest is the whole
point of them.

## Checking one

```bash
node scripts/bank-test.mjs banks/drafts/ncp-ai.md
```

That runs the content rules against one file and skips the manifest entirely:
ids unique, every question answerable, answer keys in range, domains declared,
no option referred to by letter or position, images resolve. Exactly the rules a
published bank must satisfy — the same code path, so a draft cannot pass checks
the real banks would fail.

Failures name the question and the line:

```
FAIL bank "ncp-ai.md" parses without errors
  -- b1@16: no correct option marked ([x]); domain 'storage' not in the bank's domains list
```

## Publishing one

1. Move it to its own directory: `banks/<bank-id>/<bank-id>.md`
2. Add an entry to `banks/manifest.json` (`id`, `cert`, `title`, `file`)
3. Make sure the cert it names is in the manifest's `certs` list
4. `node scripts/bank-test.mjs` — the full run, including the cross-bank checks

Step 4 matters most. **Question ids are global**: `NSTMastery` keys on the bare
id with no bank scoping, so two banks using the same id share one record, and
answering a question in one moves the other's box, counters and review date.
Nothing reports it; the schedule just becomes quietly wrong for both. The full
run is what catches that, and a draft check cannot.
