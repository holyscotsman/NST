# Nutanix Study Tool (NST)

**Live:** <https://holyscotsman.github.io/NST/> — once GitHub Pages is enabled (see [Deploy](#deploy)).

One dark-mode home for Nutanix certification prep. From the landing page you pick one of
three tools:

| Tool | Path | What it is |
|------|------|------------|
| **Who Wants to Be a Nutanix Engineer (WWTBANE)** | [`/wwtbane/`](./wwtbane/) | A game-show-style quiz — climb the ladder answering NCP-MCI questions. |
| **StarNix** | [`/starnix/`](./starnix/) | A cinematic study game: three arcade sub-games (Acropolis Rescue, Kuiper Belt Battle, Chasm Chase) that teach one shared NCP-MCI question bank via spaced retrieval. |
| **Nutanix Practice Exams** | [`/practice-exams/`](./practice-exams/) | A standard practice test with **Practice Mode** (instant feedback, unlimited retries, untimed) and **Exam Mode** (timed, randomized, 80% to pass). |

NST consolidates two formerly separate repositories — **WWTBANE** and **StarNix** — into a single
app, preserving each project's full git history. The **Nutanix Practice Exams** module was built
from StarNix's former "Nutanix Interrogation Test," which has been moved out of StarNix entirely
and now lives only here.

## Architecture

NST is a **static multi-page site**. Each tool is self-contained in its own folder, so there are
no framework, dependency, or CSS-namespace collisions between them, and each tool keeps working
exactly as it did before consolidation. The launcher (`/`) links to each tool.

```
nst/
├── index.html              # launcher / home page
├── styles/nst-home.css     # home styles
├── wwtbane/                # WWTBANE (vanilla-JS ES modules, imported via git subtree)
├── starnix/                # StarNix (built single-file app, imported via git subtree)
├── practice-exams/         # Nutanix Practice Exams (new module)
│   ├── index.html
│   ├── config.js           # PASS_THRESHOLD, EXAM_QUESTION_COUNT, EXAM_TIME_LIMIT_MIN, shuffle flags
│   ├── engine.js           # grading / shuffling / scoring + bank normalization
│   ├── ui.js               # shared DOM + accessible option states
│   ├── practice-mode.js    # instant feedback, unlimited retries, untimed
│   ├── exam-mode.js        # timed, randomized, feedback at end
│   ├── results.js          # scoring + review screen
│   ├── styles.css
│   └── data/               # question bank (255 NCP-MCI questions) + exhibit images
├── .nojekyll               # serve files as-is (no Jekyll), like wwtbane/starnix
└── .github/workflows/      # CI (tests only)
```

Design language (all tools): dark-only theme, purple signature color (`#7C4DFF`), Space Grotesk +
Manrope type, accessible answer states that pair color with an icon and text (never color alone),
visible focus rings, and reduced-motion support.

## Run it locally

The whole site is static — serve the repo root with any static file server (ES modules and the
question data need HTTP, not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

- Home: <http://localhost:8000/>
- WWTBANE: <http://localhost:8000/wwtbane/>
- StarNix: <http://localhost:8000/starnix/>
- Practice Exams: <http://localhost:8000/practice-exams/>

## Develop

Each tool retains its own tooling:

- **WWTBANE** — no build step; edit files under `wwtbane/src` and reload. Tests (zero-dependency,
  Node built-ins): `cd wwtbane && node --test tests/*.test.mjs`.
- **StarNix** — edit the module `.js` files, then regenerate the single-file app:
  `cd starnix && node build.mjs`. Never edit `starnix/index.html` by hand — it is generated.
  Check gate: `cd starnix && npm install && npm run check`.
- **Practice Exams** — plain static files; edit and reload. Exam parameters live in
  `practice-exams/config.js`.

## Deploy

Plain static site — **no build step, no deploy pipeline** (exactly like WWTBANE and StarNix today).
GitHub Pages just serves the files from a branch.

**One-time setup** (in the repo's **Settings → Pages**):

1. **Source:** *Deploy from a branch*.
2. **Branch:** pick the branch that contains the site, then `/ (root)`, and **Save**.
   - After this project's pull request is merged, that branch is **`main`**.
   - To preview *before* merging, pick the feature branch instead.
3. Wait ~1 minute, then open **<https://holyscotsman.github.io/NST/>**.

> A fresh repo has Pages **off** by default and `main` starts empty, so the URL 404s until both are
> true: Pages is enabled **and** the chosen branch actually contains `index.html` at its root. The
> root `.nojekyll` turns Jekyll off so everything is served as-is.

Once live, the launcher is at `https://holyscotsman.github.io/NST/`, with each tool at
`/NST/wwtbane/`, `/NST/starnix/`, and `/NST/practice-exams/`. The only workflow in the repo is
`ci.yml` (tests); it does not deploy anything.

## Configuring Practice Exams

All exam parameters are single-source values in `practice-exams/config.js`:

```js
PASS_THRESHOLD: 0.80,       // 80% to pass
EXAM_QUESTION_COUNT: 75,    // questions per Exam Mode attempt
EXAM_TIME_LIMIT_MIN: 90,    // Exam Mode time limit (minutes)
SHUFFLE_QUESTIONS: true,    // Exam Mode
SHUFFLE_OPTIONS: true,      // Exam Mode
```
