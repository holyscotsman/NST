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

1. **Start a new game.** Your first time, the host gives you a tour of the
   soundstage and walks you through the rules — then it's 30 questions: 10 easy,
   10 medium, 9 hard, and one nearly-impossible final.
2. **One wrong answer ends the run** — but your coins **bank** at the safe
   havens (questions 5, 10, 17 and 25). Pass one and that money is yours to
   keep even if you fall later.
3. **Three lifelines**, one use each:
   - **50:50** removes two wrong answers.
   - **Ask the audience** runs a real, fallible poll — the crowd is usually
     right, but a tempting wrong answer can win the room, especially on hard
     questions.
   - **Phone a friend** is a panicked guess — right about two times in three.
   - Lifelines **advise, they never grade**: the answer key decides what's
     correct. A lifeline-assisted answer still counts — but it won't mark that
     topic as *mastered*. You only master what you answer on your own.
4. **Miss one and you're walked back to the green room**, where the correct
   answer and its explanation are waiting — read it, then spend banked coins:
   buy a second slot for a lifeline, recharge them, or pay **Steve** for an
   inside tip on a hard question you're about to face. Then it's "Start next
   round". The goal is to keep going.
5. **Seeds** let you replay the exact same 30 questions — or challenge a friend to
   the identical run.

Everything works with keyboard (number keys or A–F pick an answer, arrows move
between them, Enter locks it in, Escape pauses), touch, and screen readers.
There's a **reduced-motion** mode, a **high-contrast** mode, and there are
**no timers** — study at your own pace.

## What makes it stick

- **It learns you.** Every question has a personal "mastery" level (a spaced-
  repetition system). Miss something and it comes back sooner and harder; nail it
  a few times and it drifts away — occasionally resurfacing so you don't forget.
  Owner-flagged **priority questions** are drilled first until you master them.
- **It sounds and moves like a show.** An original synth score shifts with the
  stakes — quick and bright on easy questions, slower and lower as the money
  climbs, a heartbeat under the final — and a camera director cuts between
  broadcast-style shots: the host leaning in, the audience, the piggy bank,
  the sweat on question 21.
- **Your progress is saved** on your device and is **never wiped** — not even when
  you win. Winning just resets your coins and lets you climb again from the top.
- **Honest answers.** The game **never asks an AI whether your answer is right.**
  Correctness is decided by a fixed, reviewed answer key. (See
  [learning integrity](#a-note-on-answer-quality) below.)

## Under the hood

- **Pure static site** — plain HTML/CSS/JavaScript modules, no build step needed.
- **3D studio backdrop** rendered with **Three.js** (vendored locally, no CDN),
  filmed by a data-driven camera director (`src/shell/takes.js` — see
  `docs/CINEMATIC_TAKES.md`, previewable via `?scene=<name>`); if WebGL isn't
  available, the game falls back to a CSS studio and plays exactly the same.
- **All audio is synthesized at runtime** — original compositions in WebAudio,
  no audio files, nothing licensed.
- **The quiz is always DOM**, layered over the 3D canvas, which is what keeps it
  accessible.
- **No external requests at all** — Three.js and the font are bundled in the repo,
  so it works offline too.

## Run it locally

```bash
# serve the folder (any static server works)
npm run serve         # then open http://localhost:8080/

# tests
npm test              # headless unit tests (with negative controls)
npm run smoke         # browser smoke test (boots the game, answers a question)
npm run e2e           # full play-through: win, prestige, lose, green room, seed
```

No dependencies are required to *play* — the test scripts use Playwright.

## Project layout

```
index.html            # entry point
src/core/             # pure game logic (no browser deps) — fully unit-tested
  config, rng, questionSchema, mastery, lifelines, coins, selection,
  runController, eventBus, textSplit, aiAdapter
src/shell/            # browser layer
  main.js, studio.js (WebGL), director.js + takes.js (camera), music.js,
  backdrop.js (CSS studio), audio.js, hostLines.js, persistence.js, ui/*
src/content/          # the question bank (questions.js), parsers, images/
scripts/              # import-questions.mjs (Markdown/interchange → bank)
styles/               # main.css (the whole DOM look)
vendor/               # Three.js r160 + addons, self-hosted Montserrat
tests/                # unit tests, smoke test, full e2e
docs/                 # cinematic spec (+ event contract), authoring guide,
                      # content QA report, interchange bank sources
```

## A note on answer quality

The 233-question bank covers 12 exam domains. It combines owner-supplied
practice-exam sets (used verbatim, keys and all) with a drafted pool that was
**independently double-checked** for factual accuracy against Nutanix
documentation — with a final human review still recommended before you rely on
it for exam prep (tracked in
[`FLAGS.md`](FLAGS.md) and [`docs/CONTENT_QA_REPORT.md`](docs/CONTENT_QA_REPORT.md)).
Found a question you'd word differently? That's exactly the kind of fix this is
set up for — the answer keys live in `src/content/questions.js`.

> Not affiliated with or endorsed by Nutanix. "NCP-MCI" and "Nutanix" are
> trademarks of Nutanix, Inc., used here only to describe what the quiz covers.
> All artwork, audio, and wording are original.

## License

MIT — see [`LICENSE`](LICENSE).
