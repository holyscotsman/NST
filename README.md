# Nutanix Study Tool (NST)

### 🔗 **Play it now: [holyscotsman.github.io/NST](https://holyscotsman.github.io/NST/)**

No install, no signup, no cost — it's a static site, so that link just works in any browser,
including on your phone. Bookmark it.

---

## What this is

NST is one dark-mode home for Nutanix certification prep, built around a simple idea: **the same
question bank, studied three different ways.** Load a certification's questions once, then pick
whichever format fits how you actually want to study that day — a game show, an arcade run, or a
straight practice exam. Progress and mastery are tracked per-question and follow you across visits.

On the public site above, that is **entirely local**: everything saves to your browser's own
storage, nothing leaves the machine, and there is no account to make. If you instead run the
[small server](#host-it-for-a-team-accounts--login) — because your network blocks the GitHub URL,
or because several people want their own progress — the same work is also mirrored to an account on
**that** server, so it follows you between browsers and devices. Nothing is sent anywhere else
either way.

| | | |
|---|---|---|
| 🎙️ | **[Who Wants to Be a Nutanix Engineer](./wwtbane/)** | A *Who Wants to Be a Millionaire*-style game show |
| 🚀 | **[StarNix](./starnix/)** | Three arcade games built around the same question bank |
| 📝 | **[Practice Exams](./practice-exams/)** | A straight practice test, Nutanix-exam-shaped |

## How the questions work

Every tool is powered by a **question bank** — a set of multiple-choice Nutanix exam questions,
each with a correct answer key, an explanation, and (where relevant) a diagram to read. Banks are
plain text files, not baked into the tools, so the same engine can run any certification's
question set.

1. Open the site and pick a certification from the chooser on the home page (right now that's
   **NCP-MCI — Multicloud Infrastructure**, with a short 25-question set for a quick pass or the
   full ~255-question bank for real coverage).
2. Your choice is remembered — every tool below loads it automatically. Switch it anytime from the
   home page or the ⚙️ Settings panel.
3. Pick a tool and start answering. However you play, right and wrong answers feed the **same
   mastery tracker** per question (a spaced-repetition scheduler, the same idea behind flashcard
   apps like Anki) — so a question you keep missing keeps resurfacing until it sticks, and one
   you've nailed a few times shows up less often.

Nothing here is graded by AI — every "correct answer" is a fixed, human-authored key. The tools
just decide *when* to ask you a question you already have a key for.

## The three tools, in more detail

### 🎙️ Who Wants to Be a Nutanix Engineer (WWTBANE)

A game-show quiz styled on *Who Wants to Be a Millionaire*. Answer **30 questions in a row**,
climbing a money ladder from easy → medium → hard → one deliberately brutal final question. Miss
one and the run ends (permadeath) — but you keep whatever you'd already banked at the last safe
haven, so an early loss still pays out. Between runs, spend your coins in the **Green Room** on
extra lifeline slots or a tip from "Shady Steve." Three lifelines help you when you're stuck —
**50:50**, **Ask the Audience**, and **Phone a Friend** — but none of them auto-answer for you, and
a lifeline-assisted correct answer doesn't count toward mastering that question; you still have to
actually know it eventually.

### 🚀 StarNix

A cinematic sci-fi shell wrapping **three different arcade games**, all quizzing you on the same
bank:

- **Acropolis Rescue Mission (ARM)** — a 2D side-scrolling flight game; fly through sectors
  collecting knowledge cores, each one triggering a question.
- **Kuiper Belt Battle (KBB)** — a turn-based roguelike; a correct answer powers your attack,
  and you build a run out of "artifacts" (passive upgrades, Balatro-style) that combo together.
- **Chasm Chase (CC)** — a 3D endless runner; dodge obstacles down a canyon, with question gates
  opening as you go.

All three share one profile: cross-game XP and rank, daily missions, achievements, and the same
mastery data as everything else — switching games doesn't reset your progress.

### 📝 Practice Exams

The no-frills option. **Practice Mode** gives instant feedback per question (see the right answer
and the explanation immediately, retry as much as you want, untimed). **Exam Mode** simulates the
real thing: a 90-minute timer, shuffled questions and answer order, no feedback until you submit,
and an 80% pass bar — then a full review of what you got wrong.

## Question banks

Banks are plain **Markdown files** in [`/banks/`](./banks/), loaded at runtime — nothing is baked
into the tools, so you can drop in a bank for any certification and switch between them.

- **Bundled today:** a 255-question **NCP-MCI** bank ([`banks/ncp-mci/`](./banks/ncp-mci/)) and a
  quick 25-question **NCP-MCI** set ([`banks/ncp-mci-25/`](./banks/ncp-mci-25/)) for a faster pass
  (WWTBANE scales its money ladder to fit short banks like this one).
- **Add a bank:** drop `your-cert/your-cert.md` into `/banks/`, list it in
  [`banks/manifest.json`](./banks/manifest.json), and it appears in the chooser. See
  [`banks/README.md`](./banks/README.md) for the quick version and
  [`docs/BANK_FORMAT.md`](./docs/BANK_FORMAT.md) for the full authoring format.

The shared parser and per-tool adapters live in [`/shared/`](./shared/).

## Architecture

A **static multi-page site** — no framework, no build for the site itself. Each tool is
self-contained in its own folder (imported via `git subtree`, full history preserved), so there are
no dependency or CSS collisions between them.

```
NST/
├── index.html          # launcher / home page
├── styles/             # the launcher's stylesheet
├── banks/              # Markdown question banks + manifest.json
├── shared/             # everything the tools agree on: the bank parser and loader,
│                       #   the mastery store (nst-mastery.js) and its dashboard,
│                       #   readiness and review views, preferences, backup, account
│                       #   sync, the version stamp, and the Nutanix wordmark
├── wwtbane/            # WWTBANE (vanilla-JS ES modules)
├── starnix/            # StarNix (built single-file app)
├── practice-exams/     # Practice Exams
├── server/             # optional login + accounts server (see below)
├── scripts/            # the shared test suites and audits
├── docs/               # BANK_FORMAT.md, knowledge base
├── .nojekyll           # serve files as-is
└── .github/workflows/  # CI (tests only — it never deploys)
```

Design language: dark-only theme, purple accent (`#7C4DFF`), Space Grotesk + Manrope type, answer
states that pair color with an icon and text (never color alone), and reduced-motion support.

## Run it locally

The site is static, but banks and ES modules need HTTP (not `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Host it for a team (accounts + login)

If the GitHub URL is blocked on your network, or several people want their own
progress, there is a small server that hosts the same site behind a login:

```bash
node server/server.mjs        # needs Node 22+, no npm install
```

Everyone gets an account, and their progress follows them to any browser or
device instead of living in one browser's storage. A **root** account is created
on first run for managing the others. Storage is a single SQLite file
(`node:sqlite`, built into Node) — no database server to run.

The apps themselves are unchanged: they still use `localStorage`, and
`shared/nst-sync.js` mirrors it to the account. On a static host that module
stays dormant, so the same build works both ways.

See **[server/README.md](./server/README.md)** for setup, configuration, a
systemd unit, and the security notes.

## Develop

Each tool keeps its own tooling:

- **WWTBANE** — no build step; edit `wwtbane/src` and reload. Tests: `cd wwtbane && node --test tests/*.test.mjs`.
- **StarNix** — edit the module `.js` files, then rebuild the single file: `cd starnix && node build.mjs`.
  Never edit `starnix/index.html` by hand — it is generated. Harnesses: `node bank-lint.mjs`, `node scheduler-test.mjs`, etc.
- **Practice Exams** — plain static files; edit and reload. Exam parameters live in `practice-exams/config.js`.

Everything the tools share is tested from `scripts/`, and all of it gates a pull request:

```bash
node scripts/mastery-test.mjs      # the mastery store: scheduling, merging, storage failure
node scripts/bank-test.mjs         # every bank, with the parser the app uses
node scripts/server-test.mjs       # the login server, end to end on a scratch database
node scripts/auth-test.mjs         # passwords, sessions, throttling, cookie parsing
```

…and a dozen more beside them (sync, backup, readiness, review, dashboard, compression,
path safety, robustness). These need nothing installed.

Nine further suites need a real browser and are the fourth CI job:

```bash
npm install --no-save playwright axe-core && npx playwright install chromium
python3 -m http.server 8124 &                    # they read the site over HTTP
node scripts/a11y-audit.mjs                      # accessibility, incl. keyboard and focus
node scripts/prefs-test.mjs                      # one preference, all four front-ends
node scripts/dialog-test.mjs                     # every dialog, at seven window sizes
node scripts/resume-test.mjs                     # an exam surviving a discarded tab
node scripts/smoke-test.mjs                      # a real server and login, end to end
```

They skip cleanly without a browser. CI sets `NST_REQUIRE_BROWSER=1`, which turns that skip
into a failure — a suite that runs nothing must not report success.

## Deploy

Plain static site, no pipeline — GitHub Pages serves the files from a branch. In **Settings → Pages**,
set **Source: Deploy from a branch**, pick the branch containing the site and `/ (root)`, and save.
The launcher is live at <https://holyscotsman.github.io/NST/>, with each tool at
`/NST/wwtbane/`, `/NST/starnix/`, and `/NST/practice-exams/`. The root `.nojekyll` serves everything
as-is; the only workflow (`ci.yml`) runs tests and does not deploy.
