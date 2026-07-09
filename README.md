# Who Wants to be a Nutanix Engineer? 🧠

A **game-show quiz that teaches the Nutanix NCP-MCI exam.** Answer 30 questions
in a row — from easy warm-ups to a brutal final — and win. Miss one and the run
is over, but you keep whatever you'd banked. It runs entirely in your browser.

### ▶️ Play it now: **https://holyscotsman.github.io/WWTBANE/**

*(No install, no login, nothing to download — it's a static web page.)*

---

## What it is

It's a study tool disguised as a game show. Instead of grinding flashcards, you
climb a money ladder answering real **NCP-MCI** questions — Nutanix AOS, Prism,
AHV, storage, data protection, networking, security, and more. The twist: the
game quietly tracks **what you personally know**, so it keeps feeding you the
things you're shaky on and eases off the ones you've mastered.

## How to play

1. **Start a run.** You'll face 30 questions: 10 easy, 10 medium, 9 hard, and one
   nearly-impossible final.
2. **One wrong answer ends the run** — but your coins **bank** at each tier
   boundary (questions 10, 20, and 29). Clear a tier and that money is safe even
   if you fall later.
3. **Three lifelines**, one use each:
   - **50:50** removes two wrong answers.
   - **Ask the audience** polls the room — it never points you at a wrong answer,
     but on hard questions it's only a weak hint.
   - **Phone a friend** gives a hedged tip toward the right answer.
   - Using a lifeline still counts as correct — but it won't mark that topic as
     *mastered*. You only master what you answer on your own.
4. **The green room** (between runs) is where you spend banked coins: buy a second
   slot for a lifeline, recharge them, or pay **Steve** for an inside tip on a
   hard question you're about to face.
5. **Seeds** let you replay the exact same 30 questions — or challenge a friend to
   the identical run.

Everything works with keyboard (number keys pick answers, Enter locks it in),
touch, and screen readers. There's a **reduced-motion** mode, a **high-contrast**
mode, and there are **no timers** — study at your own pace.

## What makes it stick

- **It learns you.** Every question has a personal "mastery" level (a spaced-
  repetition system). Miss something and it comes back sooner and harder; nail it
  a few times and it drifts away — occasionally resurfacing so you don't forget.
- **Your progress is saved** on your device and is **never wiped** — not even when
  you win. Winning just resets your coins and lets you climb again from the top.
- **Honest answers.** The game **never asks an AI whether your answer is right.**
  Correctness is decided by a fixed, reviewed answer key. (See
  [learning integrity](#a-note-on-answer-quality) below.)

## Under the hood

- **Pure static site** — plain HTML/CSS/JavaScript modules, no build step needed.
- **3D studio backdrop** rendered with **Three.js** (vendored locally, no CDN) —
  and if WebGL isn't available, the game falls back to a CSS studio and plays
  exactly the same.
- **The quiz is always DOM**, layered over the 3D canvas, which is what keeps it
  accessible.
- **No external requests at all** — Three.js and the font are bundled in the repo,
  so it works offline too.

## Run it locally

```bash
# serve the folder (any static server works)
npm run serve         # then open http://localhost:8080/

# tests
npm test              # 41 headless unit tests (with negative controls)
npm run smoke         # browser smoke test (boots the game, answers a question)
npm run e2e           # full play-through: win, prestige, lose, green room, seed
```

No dependencies are required to *play* — the test scripts use Playwright.

## Project layout

```
index.html            # entry point
src/core/             # pure game logic (no browser deps) — fully unit-tested
  config, rng, questionSchema, mastery, lifelines, coins, selection,
  runController, eventBus, aiAdapter
src/shell/            # browser layer
  main.js, studio.js (WebGL), audio.js, persistence.js, ui/*
src/content/          # the question bank (questions.js) + quarantine.js
vendor/               # Three.js r160 + addons, self-hosted Montserrat
tests/                # unit tests, smoke test, full e2e
docs/                 # cinematic spec (+ event contract), content QA report
```

## A note on answer quality

The 157-question bank covers 12 exam domains. It was drafted and then
**independently double-checked** for factual accuracy against Nutanix
documentation, and is marked *verified* — with a final human review still
recommended before you rely on it for exam prep (tracked in
[`FLAGS.md`](FLAGS.md) and [`docs/CONTENT_QA_REPORT.md`](docs/CONTENT_QA_REPORT.md)).
Found a question you'd word differently? That's exactly the kind of fix this is
set up for — the answer keys live in `src/content/questions.js`.

> Not affiliated with or endorsed by Nutanix. "NCP-MCI" and "Nutanix" are
> trademarks of Nutanix, Inc., used here only to describe what the quiz covers.
> All artwork, audio, and wording are original.

## License

MIT — see [`LICENSE`](LICENSE).
