# NST Studio Improvement Plan

The Nutanix Study Tool, run as a game-dev studio. Eight roles, executed **in order** (the
Director sets the stage first; QA/Testing/Security always goes last). Each role owns ten
improvement tasks across the six targets:

- **SX** — StarNix intro & bridge menu
- **ARM** — Acropolis Rescue Mission (StarNix)
- **KBB** — Kuiper Belt Battle (StarNix)
- **CC** — Chasm Chase (StarNix)
- **WW** — Who Wants to Be a Nutanix Engineer
- **PE** — Nutanix Practice Exams

Ground rules: improvements only, no overhauls — the smallest change that clearly makes the
target better. Every task must leave the CI suites green (WWTBANE unit tests; StarNix build +
harnesses) and pass a browser check before it ships. Audio added to PE is **subtle and off by
default** (opt-in via NST Settings), honoring the global mute. All motion respects
reduced-motion preferences.

---

## 1. Director

Owns coherence: one product, one voice, no dead ends.

1. **[ALL] Navigation coherence** — every tool exposes a consistent "← Main menu" route back to the launcher; same wording, reachable from its primary screens.
2. **[PE/ALL] Copy & naming pass** — titles, meta descriptions, and in-app copy use the current names (bank names, mode names); no stale "255-question"/data-folder references anywhere.
3. **[ALL] Loading states** — bank switching and tool boot show branded loading feedback, never a blank screen.
4. **[Launcher] First-run guidance** — with no bank selected, the bank buttons visibly invite the choice (pulse/emphasis) so a new user knows the first step.
5. **[Launcher] Active-bank visibility** — the chosen bank is visible at a glance from the nav (badge), not only in the hero.
6. **[ALL] Error resilience** — a failed manifest/bank fetch shows a friendly retry message in the launcher rather than failing silently.
7. **[ALL] Reduced-motion compliance sweep** — audit every animation added by this plan plus existing hero/card animations; all honor `prefers-reduced-motion` and the NST setting.
8. **[PE] Session continuity** — Practice Exams remembers the last-used mode and question-set choice and preselects them on return.
9. **[SX] Intro respect** — returning players (profile exists) get a quieter title→menu path; Skip is always available within the first second of the cinematic.
10. **[ALL] Version stamp** — a consistent, unobtrusive build/version stamp visible in launcher Settings diagnostics and each tool (StarNix badge exists; verify others).

## 2. Game Experience / Level Designer

Owns pacing, motivation, and "what do I do next".

1. **[SX] Mission flavor** — each bridge-menu game strip gets a one-line hook ("Tow stranded ships home", …) so choosing a mission means something.
2. **[ARM] Gentler first sector** — first-sector pacing is more forgiving (more time / softer hazard density) so new pilots land the loop before the pressure rises.
3. **[KBB] Depth zones** — named depth milestones ("Scattered Disk", "Deep Belt", …) announce progression with a brief banner.
4. **[CC] Run milestones** — distance markers celebrate progress mid-run (500m / 1000m…), giving the chase a rhythm.
5. **[WW] Safe-haven drama** — crossing a safe haven on the money ladder is visibly celebrated; the banked amount is unmistakable.
6. **[PE] Study streak** — Practice mode shows a current-streak counter (consecutive correct) to reward momentum.
7. **[PE] Focus recommendation** — the results screen calls out the weakest domain with a one-line "focus next on…" recommendation.
8. **[PE] Review flagged first** — from the exam submit/review flow, a "review flagged" affordance jumps straight to flagged questions.
9. **[SX] Cinematic pacing** — the intro shows beat progress (dots) so viewers know how long remains; Skip prominent throughout.
10. **[WW] Green-room clarity** — a first-visit hint in the green room explains buying lifelines vs starting the next run.

## 3. Physics Engine

Owns weight, momentum, and feel. Games + WWTBANE studio only (the exam has no physics).

1. **[ARM] Inertial ship feel** — player motion uses smoothed acceleration/deceleration rather than instant velocity changes.
2. **[ARM] Impact feedback** — collisions/damage produce a magnitude-scaled screen shake (reduced-motion aware).
3. **[KBB] Rock mass variance** — asteroid spin/drift varies with size so big rocks read heavy and small rocks skitter.
4. **[KBB] Hit knockback** — destroying/striking a rock imparts a small recoil/push for tactile shots.
5. **[CC] Camera smoothing** — the chase camera lerps toward the player (no hard snaps) for a weightier ride.
6. **[CC] Forgiveness window** — a small grace window (coyote-time-style) on lethal collisions makes near-misses feel earned rather than cheap.
7. **[WW] Avatar idle life** — host/contestant avatars get subtle sinusoidal breathing/sway so the studio never looks frozen.
8. **[WW] Win particles with physics** — the win celebration uses gravity+drag particles (confetti arcs), reduced-motion aware.
9. **[SX] Menu parallax inertia** — the bridge starfield drifts with pointer movement using damped (inertial) follow.
10. **[Games] Delta-time audit** — verify game loops scale by frame delta (no speed doubling at 120 Hz); fix any fixed-step assumptions found.

## 4. Texture / Visual Detail

Owns surfaces: what things are made of.

1. **[SX] Card material** — bridge-menu strips get a hover sheen/scanline treatment so they read as console panels.
2. **[SX] Intro grade** — the cinematic gets a subtle vignette + grain overlay for a filmic look (cheap CSS/canvas, reduced-motion safe).
3. **[ARM] Backdrop depth** — background star/nebula layering gains variation so sectors don't feel like the same wallpaper.
4. **[KBB] Rock variety** — rock sprites/tints vary per spawn so the belt feels mineral, not cloned.
5. **[CC] Depth cueing** — distance fog/haze tuning so speed reads through atmosphere.
6. **[WW] Studio floor & light** — the stage floor/spotlight materials get a polish pass (gradient/reflection tune) for a broadcast look.
7. **[WW] Ladder finish** — the money ladder's current/passed/haven rungs get distinct material treatments (metallic gradient on havens).
8. **[PE] Option-row material** — answer rows gain refined hover elevation and correct/incorrect state gradients (color+icon+text always paired).
9. **[Launcher] Card icon sheen** — tool-card icons get gradient + hover glint consistent with each tool's accent.
10. **[Launcher/PE] Elevation tokens** — one consistent shadow/elevation scale applied across launcher and PE cards/modals.

## 5. User Interface

Owns clarity, input, and accessibility of controls.

1. **[PE] Keyboard play** — A–D/1–9 select options, ←/→ navigate, F flags (exam); a discoverable hint shows the shortcuts.
2. **[PE] Progress clarity** — the progress bar distinguishes answered vs remaining; the strip chip states (current/answered/flagged) get a legend or tooltip.
3. **[PE] Results navigation** — from results, wrong answers are one click away (jump links / filter to incorrect).
4. **[PE] Timer urgency** — exam timer shifts color at 25% and 10% remaining and announces politely via `aria-live`.
5. **[SX] Focus & hit targets** — bridge top-bar buttons and strips get visible focus rings and comfortable hit areas; tab order is sane.
6. **[SX] Settings clarity** — settings rows have consistent label + one-line description formatting.
7. **[WW] Lifeline legibility** — lifeline buttons expose clear labels/tooltips and disabled reasons (used/can't-afford).
8. **[WW] Pause affordance** — Escape/pause is hinted on first play; pause overlay buttons are keyboard-reachable.
9. **[Launcher] Settings ↔ bank picker parity** — the Settings bank section and hero buttons stay in sync and use the same names/highlight.
10. **[ALL] Small-screen pass** — launcher and PE entry render cleanly at 360 px wide (wrapping, no horizontal scroll).

## 6. Sound Design

Owns feedback you can hear. PE audio is opt-in (off by default) and respects global mute.

1. **[PE] Feedback sfx (opt-in)** — tiny WebAudio cues: select, correct, incorrect, flag, submit, pass/fail sting; a "Practice Exams sounds" toggle (default off) in NST Settings.
2. **[SX] Menu click coverage** — every interactive bridge/menu control plays the click/hover blip consistently (audit + fill gaps).
3. **[SX] Intro punctuation** — cinematic beat transitions and Skip get a soft whoosh/click.
4. **[ARM] Event distinction** — pickup vs damage vs objective sounds are clearly distinct; pitch randomization prevents fatigue.
5. **[KBB] Impact scaling** — rock impact sound pitch/weight scales with rock size.
6. **[CC] Near-miss whoosh** — passing close to an obstacle at speed gives an airy whoosh.
7. **[WW] Ladder tick** — climbing a rung gets a subtle ratchet tick; havens get a deeper clunk.
8. **[WW] Lifeline signatures** — each lifeline has a short signature sound on use.
9. **[ALL] Level normalization** — new/changed sfx pass through capped gains; nothing clips or towers over music.
10. **[ALL] Mute propagation audit** — NST mute + per-tool settings silence every new sound path.

## 7. Music Design

Owns emotional continuity. PE music is opt-in (off by default).

1. **[PE] Practice ambient (opt-in)** — a quiet generative pad for Practice mode only, behind the same off-by-default toggle; never in Exam mode.
2. **[SX] Track transitions** — title → menu → game transitions crossfade (no hard cuts/pops).
3. **[SX] Cinematic dynamics** — intro music ducks under beat changes and swells on the title reveal.
4. **[ARM] Danger layer** — low health / final-wave states raise musical intensity (filter/layer), relaxing on recovery.
5. **[KBB] Depth timbre** — the deeper the run, the darker/wider the music timbre (filter sweep tied to depth).
6. **[CC] Speed pulse** — a percussion layer keys off current speed for momentum.
7. **[WW] Tier escalation** — each difficulty tier subtly raises musical stakes; a riser marks tier crossings.
8. **[WW] Result themes** — win fanfare and loss sting are clearly differentiated arrangements.
9. **[SX] Fade utility** — a shared fade-in/out helper in the StarNix audio engine replaces any abrupt starts/stops.
10. **[ALL] Loudness pass** — perceived level is consistent across all tracks/tools (gain trims documented in code).

## 8. QA / Testing / Security (always last)

Owns proof. Nothing above ships broken.

1. **[ALL] Full regression** — run WWTBANE's 130-test suite and StarNix build + all five harnesses after all role work; fix every regression.
2. **[PE] Logic tests** — add a Node test script for PE engine logic (grading, shuffle mapping, summarize, streak) and wire it into CI.
3. **[ALL] Browser E2E sweep** — scripted pass: load every page, answer questions in both PE modes, open each StarNix game, start a WWTBANE run — zero console errors.
4. **[ALL] Accessibility audit** — modal focus behavior, `aria-pressed`/roles on all new toggles/buttons, contrast of new colors ≥ WCAG AA.
5. **[ALL] Injection/XSS audit** — all bank-derived strings render escaped; no new `innerHTML` sinks accept unescaped external data; no `eval`.
6. **[ALL] Storage audit** — every localStorage read is parse-guarded and namespaced (`nst.`, `starnix:`, `wwtbane.`); corrupt values can't crash boot.
7. **[ALL] Failure-path tests** — 404 manifest, malformed manifest, malformed bank markdown → every tool lands on its friendly error state.
8. **[SX/PE] Weight check** — StarNix bundle size within budget (build gate) and PE page weight reasonable; document deltas.
9. **[ALL] Preference matrix** — reduced-motion × mute × high-contrast combinations spot-checked across tools; new features obey all three.
10. **[ALL] Ship it** — final green run, push, PR updated with a verification summary, merge + deploy.
