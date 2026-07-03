# Session 3 — Acropolis Rescue Mission (ARM) work order

**You own:** spec doc `02` and the module `arm.js`. **Do not touch** the contract (`01`), shared core, or the shell — flag contract needs to the Core chat. ARM is the 2D **top-down** flight mission: fly a ship around a sector, collect cores (= cargo), solve puzzle activities and answer exam questions, then engage **hyperdrive** to warp to the next sector / out. Antagonist: BCM.

**Start from the current `arm.js` the Core chat is handing you** (project copy is ~9 versions stale; it already has per-sector randomized core positions and the 3-sector campaign). Edit `arm.js` only; keep it standalone. **Learning integrity:** never AI-author or alter answer keys. Logic (timers, spawn counts, puzzle rules) you can reason about and should describe how you verified; visuals are browser-only. **No screenshot needed for this chat.**

---

## Tasks

### 1. Hyperdrive warp polish — code-gen
- **Stronger screen distortion** on engage (heavier warp/chromatic/blur than today).
- **Hold the warp 1–2 s longer** before arrival.
- **Remove the "Hyperdrive" text** shown mid-screen during transit — Jason does not want that label on screen.
- **3D wormhole:** after engage, render a **3D-feeling tunnel** (code-gen — receding concentric rings / perspective streaks rushing past) instead of a flat wipe. Browser-only.

### 2. Huge hyperdrive button + panic spawn on full collection — logic + UI
When **all cores in the sector are collected**: make the **hyperdrive button HUGE/unmistakable** (escape cue), and **spawn ~10 enemies nearby** for a panic to warp out. Tune count/placement (threatening but escapable); reuse the existing enemy spawn path. Trigger off the existing collected-vs-total condition. The trigger + count are logic you can verify; the button scale is browser-only.

### 3. Puzzles — concrete changes (Jason has decided most of these)
- **Simon: keep, modified.** Start at **5 sequence steps**; in harder sectors ramp to **8–9**. The **timer must not start until after the sequence finishes playing** (it starts when it's the player's turn to input, not during playback).
- **Grid: remove.**
- **New puzzle "Battery" (polarity match):** ~**4 AA batteries**, each randomly oriented (some correct, some flipped — could be all 4 wrong). Each slot shows the required polarity; **tap a battery to flip it 180°**; when **all charges match** the required orientation, the puzzle completes. Random initial state each time. Keep the interaction one-tap-per-battery and fast.
- **New puzzle "vCPU divide" (even allocation):** a Node with a **random total vCPU count** and a **random VM count chosen so it divides evenly** (e.g., 48 vCPUs across 12 VMs → 4 each). The player allocates vCPUs **evenly** across the VMs; correct when every VM is equal and the node is fully allocated with none left/over capacity. Design a **quick, fun interaction** (your call) — e.g., a per-VM stepper or "+1/–1 to all" controls with a live "allocated / capacity · balanced?" readout, or a balance-the-uneven-VMs variant. Ties to capacity-planning/oversubscription (NCP-MCI relevant). Keep it solvable in a few actions under the timer.
- **rewire, dials, sort: undecided — propose.** Hand Jason a short table: each of these three → current difficulty + timer → keep / cut / retune + proposed new timer + one line on what makes it too easy/hard. Implement obvious timer retunes immediately; **gate removals on Jason's confirmation.**
- **Timers much quicker overall** across the kept puzzles (logic — verify).

### 4. ARM ship sprites — ASSET-GATED (mechanics-independent)
Jason is generating **top-down** sprites for the ARM `armHero`, `armEnemy`, and `armBoss` ships (prompts in `ASSET_PROMPTS.md`). Write the code paths to consume `assets.armHero/armEnemy/armBoss` **with fallbacks** to current actors so ARM runs before assets land. (A boss ship implies a boss encounter — if one isn't built yet, wire the `armBoss` sprite where the boss will go and flag the boss-fight scope to Jason/Core.)

---

## Deliver back to Core
Updated `arm.js` + updated `02` + a short changelog + verification notes + the **rewire/dials/sort proposal table**. Add `pause()` (freeze rAF + sim/puzzle timers) and `resume()` and expose on mount per Core's signature — **ARM has no pause today, implement it.** Core merges, rebuilds, runs verify + harnesses, inlines assets, and wires the pause overlay.
