# 03 — KBB · Kuiper Belt Battle

<!-- doc-version: v1.1 · baseline v1.0 = original file · MINOR (view-rebuild implementation notes; no design change) -->
**Doc version:** v1.1 · **Owner:** single chat (was KBB) · **Edited:** 2026-06-28

**Genre:** 2D roguelike, Slay-the-Spire structure × Balatro scoring (Canvas, parallax). **Status:** new build (Phase 2). The biggest design surface — read this whole file before coding.

A squad of three NX-SRC ships chases the BCM warship into the Kuiper Belt. **You attack by answering exam questions.** Runs are endless and escalating; what makes each run unique is the **artifacts** you collect and combine.

---

## 1. Run structure

- A **run** = a sequence of **sections**. Each section = **5 rounds: 4 battles + 1 boss.**
- Endless: section N+1 follows section N with higher enemy HP and harder questions.
- **Score = depth reached**, labeled `section-round` (e.g., `1-1` = first battle; `3-5` = boss of section 3). Best depth persisted.

```mermaid
flowchart LR
  START["Squad enters left,<br/>enemy on right"] --> R1["Round 1 battle"]
  R1 --> SH1["Shop"] --> R2["Round 2 battle"] --> SH2["Shop"]
  SH2 --> R3["Round 3"] --> SH3["Shop"] --> R4["Round 4"] --> SH4["Shop"]
  SH4 --> R5["Round 5 BOSS"] --> NEXT["Section + 1 (harder)"]
  NEXT --> R1
```

Shop appears after **every** battle (including before the boss). Lose at any battle → run ends → score = furthest `section-round` cleared+current.

---

## 2. The squad (✅ confirmed: shared entity, three named ships)

The squad reads as **three ships** but acts as **one entity** when attacking — a single shared HP+shield pool. Each ship is the *narrative home* of one stat, so artifacts are themed to a ship even though they all modify the one shared squad:

| Callsign (proposed) | Role | Stat it owns | Artifacts that route here |
|---------------------|------|--------------|---------------------------|
| **Talon** | DPS / Fighter | `basePower` (attack) | damage artifacts |
| **Aegis** | Shield | `block` per enemy turn + `maxShield` | durability artifacts |
| **Mender** | Medic | `healPower` (heal magnitude) | healing artifacts |

> Names are proposals (N4) — easy to rename. Flavor text references the ship ("Talon overcharges: ×2 damage"), but mechanically everything resolves on the shared `Squad`.

Squad state:
```ts
interface Squad {
  hp: number; maxHp: number;        // shared pool; 0 → run over
  shield: number;                    // temporary absorb, consumed before hp
  basePower: number;                 // Talon-owned attack base
  block: number;                     // Aegis grants this much shield each enemy turn
  healPower: number;                 // Mender-owned heal magnitude
  coins: number;
  artifacts: Artifact[];             // max 5 equipped
}
```

---

## 3. Battle: turn structure

Per your spec: **max 3 attacks** to defeat the enemy; the enemy **attacks back after each of your attacks**; failing to kill in 3 = loss; the enemy can also kill you during the 3 turns.

**Sequence of one battle:**
1. **Battle start.** Enemy spawns with `hp`, `maxHp`, and a visible **intent** (how much damage its next attack will deal). Fire `onBattleStart` artifact hooks. Shield ship may pre-load `shield += block`.
2. **Your attack (up to 3 times):**
   a. A question is drawn (`QuestionProvider.next`, difficulty band scales with section; exclude ids seen this battle).
   b. You answer.
   c. **Correct →** compute damage (see §4), apply to enemy. Fire `onCorrect`.
   **Wrong →** no damage by default. Fire `onWrong` (some artifacts soften: ignore first wrong, chip damage, etc.).
   d. If `enemy.hp <= 0` → **win** (skip remaining attacks).
3. **Enemy attack** (after each of your attacks, while enemy alive): damage = `enemy.intent` (modified by `onEnemyAttack` mitigation pipeline), absorbed by `shield` then `hp`. Re-roll/advance intent. If `hp <= 0` → **loss**.
4. After **3 attacks**, if enemy still alive → enemy delivers a **finishing blow** → loss.
5. **Win →** earn coins (`onCoinGain` pipeline), fire `onBattleWon`, go to shop.

```mermaid
sequenceDiagram
  participant P as You
  participant Q as Question
  participant S as Squad
  participant E as Enemy
  Note over E: spawn + show intent
  loop up to 3 attacks
    Q->>P: draw question (band scales)
    P->>Q: answer
    alt correct
      P->>E: damage = base × mult (artifacts)
    else wrong
      Note over P: onWrong (maybe softened)
    end
    alt enemy dead
      Note over E: WIN → coins → shop
    else enemy alive
      E->>S: intent damage (shield then hp)
      Note over S: hp<=0 → LOSS
    end
  end
  Note over E: still alive after 3 → finishing blow → LOSS
```

---

## 4. Damage math (Q5: confirm — Balatro-style)

Recommended: **`damage = (basePower + Σ flatBonus) × (1 + Σ multBonus)`**, computed through an ordered pipeline so artifacts compose predictably.

```
ctx.flat = squad.basePower
ctx.mult = 1
for each artifact hook onCorrect / modifyDamage (in acquisition order):
    artifact may add to ctx.flat, add to ctx.mult, or transform ctx
damage = round(ctx.flat * ctx.mult)
clamp: finite, >= 0
```

Optional mult sources (Q5 — include speed/streak?):
- **Streak:** consecutive correct answers grant escalating mult (artifact-gated, off by default).
- **Speed:** answering under a threshold grants mult (artifact-gated, and must respect the "extra time" accessibility setting — so speed bonuses are opt-in, never punish slow readers by default).

Keeping base/mult explicit is what enables 50 artifacts to interact like Balatro jokers without spaghetti.

---

## 5. Enemy & boss design

```ts
interface Enemy {
  id: string; name: string;
  hp: number; maxHp: number;
  intent: number;            // damage of its next attack (shown to player)
  intentPattern: "flat" | "ramp" | "alternating" | "boss-special";
  rewardCoins: number;
}
```

- **Scaling:** `maxHp` grows with `section` and `round`; `intent` grows more slowly. Question **difficulty band** widens/rises with section (drawn via provider).
- **Boss (round 5):** higher HP + a special mechanic, e.g.: *shields up every other turn* (your alternate attacks blocked), *enrage* (intent ramps each turn), or *gated* (immune until you answer a difficulty-3 question correctly). One mechanic per boss, telegraphed.
- Defeating an enemy in **one** attack can trigger bonus artifacts (e.g., "Async Mirror").

**Checklist**
- [ ] Enemy/boss data + scaling curves (section/round → hp/intent/band)
- [ ] Intent display (number + icon, colorblind-safe)
- [ ] 3+ boss mechanics, one per boss, telegraphed
- [ ] One-shot detection for artifact triggers

---

## 6. Artifact system — the engine (most important part)

Target: **~50 unique artifacts**, max **5 equipped**. To keep them unique *and* bug-free, artifacts are **data + event hooks**, not bespoke code paths. The engine fires lifecycle events; each artifact subscribes and mutates context through **pipelines** (for value-modifying hooks) or **side effects** (for heal/shield/coins).

```ts
interface ArtifactCtx {
  run: RunState; section: number; round: number;
  squad: Squad; enemy: Enemy | null; question: Question | null;
  rng: Rng; log: (s: string) => void;
}

interface Artifact {
  id: string; name: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;          // player-facing
  tags?: string[];              // e.g. "damage","heal","economy","storage"
  hooks: Partial<{
    onAcquire(c: ArtifactCtx): void;
    onRunStart(c: ArtifactCtx): void;
    onSectionStart(c: ArtifactCtx): void;
    onBattleStart(c: ArtifactCtx): void;
    onQuestionShown(c: ArtifactCtx): void;
    modifyDamage(c: ArtifactCtx, dmg: { flat: number; mult: number }): void; // pipeline
    onCorrect(c: ArtifactCtx): void;
    onWrong(c: ArtifactCtx): void;
    onAttackResolved(c: ArtifactCtx): void;
    modifyEnemyIntent(c: ArtifactCtx, intent: number): number;   // pipeline
    onEnemyAttack(c: ArtifactCtx, incoming: number): number;     // pipeline (mitigation)
    onBattleWon(c: ArtifactCtx): void;
    modifyCoinGain(c: ArtifactCtx, coins: number): number;       // pipeline
    onShopEnter(c: ArtifactCtx): void;
    onConsumableUsed(c: ArtifactCtx): void;
  }>;
}
```

**Engine rules:**
- Hooks fire in **acquisition order** (deterministic). `modify*` hooks form pipelines (output of one feeds the next). Document order in tooltips so combos are legible.
- All randomness via `ctx.rng` (seeded). No artifact reads wall-clock or `Math.random()`.
- Artifacts must be **pure w.r.t. their declared hooks** — no reaching into global state. This is what makes the fuzz test meaningful.

**Checklist (engine)**
- [ ] Event dispatcher with ordered pipelines + side-effect hooks
- [ ] Equip cap (5) + acquire/replace UX
- [ ] Deterministic ordering; all RNG via ctx.rng
- [ ] Tooltip generation from `description`

---

## 7. Artifact catalog — starter set (schema-defined; ~18 of 50)

The rest follow the same schema. Categories below are the design buckets to fill out to 50.

| id | name | rarity | effect (hook) |
|----|------|--------|---------------|
| `overclocked-core` | Overclocked Core | common | `+4` flat damage (`modifyDamage`) |
| `replication-factor` | Replication Factor | uncommon | `×1.5` mult while squad HP is full |
| `erasure-mult` | Erasure Multiplier | rare | `onCorrect`: `+0.5` mult, resets each battle |
| `nanobot-swarm` | Nanobot Swarm | common | `onCorrect`: heal `6` (scales with healPower) |
| `adaptive-shielding` | Adaptive Shielding | common | `onBattleStart`/enemy turn: `+8` shield |
| `data-locality` | Data Locality | uncommon | Storage-domain correct answers deal `×2` |
| `cold-tier` | Cold Tier | uncommon | first wrong answer each battle: no penalty |
| `curator` | Curator | common | `modifyCoinGain`: `+3` per battle |
| `lazarus-protocol` | Lazarus Protocol | rare | once per run, survive lethal at `1` HP |
| `compression` | Compression | uncommon | shop prices `−20%` |
| `prism-beam` | Prism Beam | rare | first attack each battle: `+1` attack this battle |
| `witness-daemon` | Witness Daemon | uncommon | `onQuestionShown`: reveal one wrong option |
| `metadata-ring` | Metadata Ring | legendary | `+0.2` mult **per artifact owned** |
| `foundation` | Foundation | uncommon | `onBattleWon`: `+2` max HP (permanent) |
| `genesis-block` | Genesis Block | rare | `onSectionStart`: `+1` basePower (permanent) |
| `risky-recompile` | Risky Recompile | rare | `−1` max attacks, but `×2` all damage |
| `async-mirror` | Async Mirror | uncommon | if enemy dies in 1 attack: gain a random consumable |
| `ntp-sync` | NTP Sync | common | `+6s` on question timers (if timers enabled) |

**Categories to reach ~50** (each ~5–8 artifacts):
- **Damage** (flat / mult / conditional)
- **Sustain** (Medic synergies: heal on correct/kill/section)
- **Defense** (Shield synergies: block, shield overflow, damage reflection)
- **Economy** (coins, discounts, reroll, interest on saved coins)
- **Question utility** (50/50, reveal, retry, extra attack, more time)
- **Risk/reward** (trade attacks/HP for damage/coins)
- **Scaling/"snowball"** (grow permanently over the run)
- **Domain-flavored** (bonus tied to a specific exam domain — also nudges learning that domain)

**Checklist (catalog)**
- [ ] Author ~50 artifacts as data across the 8 categories
- [ ] Each: id/name/rarity/description/hooks; reviewed for uniqueness
- [ ] Rarity-weighted shop pool
- [ ] Per-artifact unit test (effect fires as described)

---

## 8. Shop & consumables

- Appears after each battle. Offers **rarity-weighted artifacts** + **consumables**, plus a **reroll** (coins).
- **Artifacts:** buy to equip (cap 5; replacing one is allowed with confirm).
- **Consumables (one-shot):** `repair` (heal HP), `recharge` (restore shield), maybe `purge` (skip/redraw a question once), `intel` (preview next enemy intent). Artifacts can modify consumable strength.
- Coins from battle wins (`modifyCoinGain` pipeline); boss pays more.

**Checklist**
- [ ] Shop UI (offers + prices + reroll + buy/replace)
- [ ] Consumable set + effects + inventory
- [ ] Rarity weighting + price scaling by section
- [ ] Coin economy tuned (see review-agent fuzz/balance pass)

---

## 9. Difficulty & question integration

- Question **difficulty band** rises with section (provider `difficultyBand` widens upward).
- Enemy `maxHp` and boss mechanics escalate per section/round.
- All questions **randomized** within the band; exclude ids already seen **this battle** (across-run repeats are fine and feed mastery).
- Every answer → `MasteryStore.record` + telemetry `question_answered`.

---

## 10. Determinism, save & scoring

- A run is driven by a **seed** (RNG). Same seed + same answers ⇒ same run (critical for the fuzz suite and for debugging).
- **Save:** persist best depth (`section-round`), and optionally allow run resume (seed + state snapshot) — resume is a stretch goal.
- **Score:** encode `section-round` to a comparable number for leaderboards (e.g., `section*100 + round`).

---

## 11. Verification (KBB-specific)

Beyond the shared gate:
- [ ] **Unit test per artifact** — effect matches description, no exceptions.
- [ ] **Battle-engine tests** — win/loss paths, 3-attack cap, enemy-during-turns death, shield-before-HP, finishing blow.
- [ ] **Pipeline order tests** — `modifyDamage`/`modifyCoinGain`/`onEnemyAttack` compose in acquisition order.
- [ ] **Fuzz suite (the big one)** — run e.g. **500 seeded runs**, each picking random artifacts and answering randomly, asserting invariants every step:
  - `0 ≤ hp ≤ maxHp`, `shield ≥ 0`, `coins ≥ 0`
  - `damage` finite and `≥ 0` (no `NaN`/`Infinity`)
  - no thrown exceptions; every run terminates (win-section or loss)
  - artifact cap never exceeded
  This is the primary defense against artifact-interaction bugs.
- [ ] **Balance report** from fuzz output (avg depth, coin curve, win rates) feeds tuning.

---

## 12. KBB checklist (rollup)

**Engine**
- [ ] Run/section/round state machine (4 battles + boss, endless)
- [ ] Battle turn loop (3-attack cap, enemy counter-attacks, loss paths)
- [ ] Damage pipeline (base × mult) + clamping
- [ ] Squad model (HP + shield + role stats) [Q6]
- [ ] Enemy/boss scaling + boss mechanics

**Artifacts & shop**
- [ ] Hook dispatcher + ordered pipelines
- [ ] ~50 artifacts authored as data (8 categories)
- [ ] Equip cap (5), shop, reroll, consumables, coin economy

**Integration**
- [ ] QuestionProvider band scaling + per-battle exclusions
- [ ] MasteryStore + telemetry on every answer
- [ ] Seeded RNG throughout; depth scoring + persistence

**Verification**
- [ ] Per-artifact unit tests
- [ ] Battle/pipeline tests
- [ ] 500-run fuzz invariants green
- [ ] Balance report generated


---

## 13. View rebuild + rendering (added v1.1 — matches shipped `kbb.js`)

The battle view was rebuilt as a **four-zone CSS grid** (non-overlap guaranteed by the grid, not by absolute positioning):
- a **head** row (turn / run status pill);
- a **green** column — the NX-SRC squad;
- a **center** — the combat canvas (3D / 2D);
- an **enemy** column — the BCM warship + its **"Incoming Attack"** intent (a pulsing alert label);
- a **quest** row — the question / shop panel.

**Combat rendering** is a Three.js path with a 2D-canvas fallback. The 3D path expects sprite assets `kbbHero1/2/3` (squad), `kbbEnemy`, `kbbBoss`, and `kbbAsteroid1-5`, over a parallax **`nebulaBg`** backdrop. **Those `kbb*` sprite keys are not yet inlined into `STARNIX_ASSETS`** (only `nebulaBg` and the legacy `bcmShip` are present), so the build currently renders on the **2D fallback** until Core inlines them; the 3D code path is ready.

`pause()` / `resume()` are implemented (hard freeze; per `01 §9`). Verified by the jsdom suite (81/81) + a 200-run fuzz + a 14/14 draw-loop check. **Browser-blind:** pixel-level zone non-overlap at real sizes, the WebGL 3D path, and visual correctness (the 2D fallback is what currently ships).

---

## Change history

- **v1.1 (2026-06-28)** — Added §13 documenting the v0.2.0 **view rebuild**: a four-zone CSS grid (head / green squad / center combat canvas / enemy column with a pulsing "Incoming Attack" intent / quest row), a Three.js 3D combat path with a 2D-canvas fallback, and a parallax `nebulaBg` backdrop. Noted that the `kbb*` 3D sprite keys (`kbbHero1/2/3`, `kbbEnemy`, `kbbBoss`, `kbbAsteroid1-5`) are **not yet inlined** into `STARNIX_ASSETS`, so the build runs on the 2D fallback for now. `pause()`/`resume()` implemented. Verified 81/81 jsdom + 200-run fuzz + 14/14 draw-loop (structural; the 3D/visual layer is browser-blind). No design or question-bank change.
- **v1.0** — baseline (original `03_KBB_kuiper_belt_battle.md`): the full KBB design (run structure, squad, battle/damage, enemies/boss, artifact engine + catalog, shop, difficulty, determinism/scoring, verification).
