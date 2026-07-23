# Nutanix Study Tool (NST)

One dark-mode home for Nutanix certification prep. Pick a **question bank**, then study it three
different ways — a game-show quiz, a cinematic arcade, or a straight practice exam.

**Live:** <https://holyscotsman.github.io/NST/> (once GitHub Pages is enabled — see [Deploy](#deploy)).

## The three tools

| Tool | Path | What it is |
|------|------|------------|
| **Who Wants to Be a Nutanix Engineer** | [`/wwtbane/`](./wwtbane/) | A game-show quiz — climb the money ladder answering questions. |
| **StarNix** | [`/starnix/`](./starnix/) | A cinematic study game with three arcade sub-games that drill questions via spaced retrieval. |
| **Practice Exams** | [`/practice-exams/`](./practice-exams/) | A practice test with **Practice Mode** (instant feedback, untimed) and **Exam Mode** (timed, 80% to pass). |

All three are a single **engine** that reads whichever question bank you load — the tools ship with
no questions of their own.

## Question banks

Banks are plain **Markdown files** in [`/banks/`](./banks/), loaded at runtime. Nothing is baked
into the tools, so you can drop in a bank for any certification and switch between them.

- **Pick a certification** in the selector on the home page (or Settings → Question bank). Your
  choice is remembered, and every tool loads it. Until you pick one, each tool shows a "choose a
  bank" screen.
- **Bundled:** a 255-question **NCP-MCI** bank ships in [`banks/ncp-mci/`](./banks/ncp-mci/),
  plus a quick 25-question **NCP-MCI** set in [`banks/ncp-mci-25/`](./banks/ncp-mci-25/)
  (WWTBANE scales its money ladder to fit short banks like this one).
- **Add a bank:** drop `your-cert/your-cert.md` into `/banks/`, list it in
  [`banks/manifest.json`](./banks/manifest.json), and it appears in the selector. See
  [`banks/README.md`](./banks/README.md) for the quick version and
  [`docs/BANK_FORMAT.md`](./docs/BANK_FORMAT.md) for the full format.

The shared parser and per-tool adapters live in [`/shared/`](./shared/).

## Architecture

A **static multi-page site** — no framework, no build for the site itself. Each tool is
self-contained in its own folder (imported via `git subtree`, full history preserved), so there are
no dependency or CSS collisions between them.

```
NST/
├── index.html          # launcher / home page
├── banks/              # Markdown question banks + manifest.json
├── shared/             # bank parser + loader + per-tool adapters
├── wwtbane/            # WWTBANE (vanilla-JS ES modules)
├── starnix/            # StarNix (built single-file app)
├── practice-exams/     # Practice Exams
├── docs/               # BANK_FORMAT.md, knowledge base
├── .nojekyll           # serve files as-is
└── .github/workflows/  # CI (tests only)
```

Design language: dark-only theme, purple accent (`#7C4DFF`), Space Grotesk + Manrope type,
answer states that pair color with an icon and text (never color alone), and reduced-motion support.

## Run it locally

The site is static, but banks and ES modules need HTTP (not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Develop

Each tool keeps its own tooling:

- **WWTBANE** — no build step; edit `wwtbane/src` and reload. Tests: `cd wwtbane && node --test tests/*.test.mjs`.
- **StarNix** — edit the module `.js` files, then rebuild the single file: `cd starnix && node build.mjs`.
  Never edit `starnix/index.html` by hand — it is generated. Harnesses: `node bank-lint.mjs`, `node scheduler-test.mjs`, etc.
- **Practice Exams** — plain static files; edit and reload. Exam parameters live in `practice-exams/config.js`.

## Deploy

Plain static site, no pipeline — GitHub Pages serves the files from a branch. In **Settings → Pages**,
set **Source: Deploy from a branch**, pick the branch containing the site and `/ (root)`, and save.
After ~1 minute the launcher is live at <https://holyscotsman.github.io/NST/>, with each tool at
`/NST/wwtbane/`, `/NST/starnix/`, and `/NST/practice-exams/`. The root `.nojekyll` serves everything
as-is; the only workflow (`ci.yml`) runs tests and does not deploy.
