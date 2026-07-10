# Lifelines & the no-timers policy

## No player timers

**The player is never on a clock.** There is no countdown to answer, ever —
you can take as long as you like on any question (this is also the
accessibility "extra time / no timers" guarantee).

The one deliberately *timed* sequence in the whole game is the **Phone a
Friend cutscene** (~10 seconds), which is a pre-scripted cut-scene, not a
limit on your decision — the friend delivers their guess and then you still
choose in your own time.

Everything else that uses a timer is a **presentation beat**, not a decision
timer, and none of them forfeit or auto-submit the player's answer:

| Timed thing | What it is |
|---|---|
| Answer read-out (stem, then options one at a time) | Intro animation; you still answer whenever you're ready. |
| Gold lock-in suspense before the reveal | Drama beat *after* you've already locked your answer. |
| Correct/wrong feedback, bank celebrations | Reactions to a decision already made. |
| Host welcome, question quips, stage-manager door | Cut-scenes between moments. |
| Audience bars growing / percentages counting up | Animating a result that's already computed. |

If a real decision timer is ever added, it must be opt-in and off by default.

## 50:50

Removes up to two **distractors** — never a correct option, and always leaves
at least one distractor standing. Unchanged and non-negotiable.

## Ask the Audience — a helpful but fallible poll

The audience is modelled as a real crowd vote (`askAudience` in
`src/core/lifelines.js`):

- The correct answer draws the **most** weight on average, so the crowd
  **helps** — the top bar is the correct answer most of the time.
- One random distractor becomes a **"trap"** that pulls extra votes and can
  occasionally overtake the correct answer — more often the harder the
  question.
- Confidence is wide on easy questions and thin (and sometimes wrong) on hard
  ones.

Approximate "top bar is correct" rates by difficulty (seeded Monte-Carlo, in
the tests): **easy ≈ 95%+, medium ≈ 80%, hard ≈ 65%, extreme ≈ 55%.** It
always *helps*, but it is not a guarantee.

> **Design change:** the original spec (`CLAUDE.md §3`) said the plurality
> could *never* land on a wrong option. The owner asked for a statistic that
> "helps but cannot always be correct," so the audience is now genuinely
> fallible. It still never *grades* — it only shows what the room thinks.

## Phone a Friend — a panicking, ~68%-right friend

A ~10-second cutscene: the friend picks up, panics through a few speech
bubbles, and blurts a guess, which tags the option they named.

- **68%** of the time the friend lands on a correct option; **32%** of the
  time they name a wrong one (`PHONE_ACCURACY` in `src/core/lifelines.js`).
- The UI never tells you whether the friend is right — that's the point.

> **Design change:** the original spec said Phone a Friend always hedged
> *toward* the correct option and its content was authored. It's now a
> mechanic with a fixed accuracy; the panic dialogue is generic UI flavour
> (not exam content), and the authored `phoneHint` field is no longer used by
> the mechanic. As with the audience, it advises but never grades.

## Integrity that did not change

- The **authored answer key alone decides correctness** — no lifeline and no
  LLM ever grades (`CLAUDE.md §4`).
- A **lifeline-assisted correct answer does not promote mastery**
  (`runController` marks the question assisted).
- Lifeline outcomes are **deterministic under a seed** (the rng is keyed by
  seed + run + question + type), so a shared seed reproduces the same audience
  poll and the same friend's guess for everyone.
