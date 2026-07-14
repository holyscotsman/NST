# Cinematic takes — the camera script

The WebGL studio's camera is driven by a **director** (`src/shell/director.js`)
playing **scenes** — playlists of timed **takes** — defined in
`src/shell/takes.js`. Looping scenes are ambient background footage; game
events cut to one-shot scenes, which then **return** to the interrupted
background or **advance** to a named next scene.

Edit `src/shell/takes.js` to retime or re-frame anything — it's pure data with
the stage geography documented at the top.

**Preview any scene in the browser:** open the game with `?scene=<name>` (and
optionally `&take=<n>`), e.g. `/?scene=thinking&take=5` for the piggy-bank
zoom. A small HUD lets you switch scenes, step takes, and restart; one-shot
scenes repeat while under review. WebGL required.

Legend: ✅ = specced by the owner (implemented verbatim) · ✏️ = drafted by
Awaiting take-by-take direction.

## Scenes

### ✅ Intro cinematic — `intro` (loops · title screen)
| # | Take | Duration |
|---|---|---|
| 1 | Slow orbital rotation around the soundstage, hot seat centered (full 360°, seamless loop) | 36s (slowed from the 10s brief — owner: too fast) |

### ✅ Host welcomes you back — `hostWelcome` (top of every run · holds)
The host's speech-bubble greeting (rotating lines, snark past 3 attempts).
| # | Take | Duration |
|---|---|---|
| 1 | Gentle push onto the host in his chair | 4s + hold |

### ✅ Host asks the question — `hostAsks` (start of each tier + the final → cuts to Player is thinking)
| # | Take | Duration |
|---|---|---|
| 1 | Host in his chair, leaning to camera as it slowly zooms in | 4s |

### ✅ Player is thinking — `thinking` (loops · the in-question background)

Slowed **way down** from the original brief (owner note, twice): long takes
and tiny camera travel — drifts, not moves — so the backdrop never competes
with the quiz card. Same ten compositions as specced.

| # | Take | Duration |
|---|---|---|
| 1 | Focus on the contestant (gentle drift) | 16s |
| 2 | Both contestant and host (near-still) | 16s |
| 3 | Slow pan left → right across the audience (narrower sweep) | 14s |
| 4 | Above host + contestant, a slow settling tilt | 12s |
| 5 | Piggy bank, unhurried push | 14s |
| 6 | The other side of the audience, watching the contestant | 16s |
| 7 | Wideshot — host/contestant centered, whole room visible | **16s*** |
| 8 | Slow drift on the intensity of the contestant | 12s |
| 9 | Slow drift on the intensity of the host | 12s |
| 10 | Barely-moving orbital around the soundstage (18° of arc) | 16s |

\* take 7 had no duration in the brief — now 16s like the other long holds,
confirm or adjust.

### ✏️ "Is that your final answer?" — `finalAnswer` (on lock-in; holds till the reveal)
| # | Take | Duration |
|---|---|---|
| 1 | Tight push-in on the host, freezing on the last frame through the suspense | 4s + hold |

### ✏️ Question is correct — `correct` (→ returns to thinking)
| # | Take | Duration |
|---|---|---|
| 1 | Relief pull-back off the contestant | 2.5s |
| 2 | Quick celebratory sweep across the audience | 2.5s |

### ✏️ Question is incorrect — `incorrect`
| # | Take | Duration |
|---|---|---|
| 1 | Slow retreat away from the contestant | 3s |
| 2 | Overhead, looking down on the dimmed stage | 3s |

### ✏️ Host explains the next part — `hostExplains` (when coins bank at a tier boundary)
| # | Take | Duration |
|---|---|---|
| 1 | Gentle arc around the two-shot while he talks | 4s |

### ✏️ Final question correct — `finalCorrect` (the win; last take loops)
| # | Take | Duration |
|---|---|---|
| 1 | Fast orbit around the contestant | 3s |
| 2 | Wide push on the celebrating stage | 4s |
| 3 | Long celebration orbit (repeats until you leave) | 8s loop |

### ✅ The green room — `greenRoom` (loops · between-runs background)

No cinematic here by owner request — the room is a calm backdrop for the shop
menu, with an imperceptibly slow drift so it doesn't feel frozen.

| # | Take | Duration |
|---|---|---|
| 1 | Wide lounge, near-static drift | 40s |

### ✅ Stage manager at the door — `managerDoor` (on "Start next round" · holds)

The stage manager opens the green-room door and stands by it while a DOM
speech bubble pops: *"We're ready for you back in the Hot Seat!"* — then the
run starts and the show cuts to the studio.

| # | Take | Duration |
|---|---|---|
| 1 | Push toward the doorway as the door swings open | 3.2s + hold |

### ✏️ 50:50 — `fifty` (→ returns)
| # | Take | Duration |
|---|---|---|
| 1 | Overhead on the console, tilting down as two screens go dark | 3s |

### ✏️ Phone a friend — `phoneFriend` (→ returns)
| # | Take | Duration |
|---|---|---|
| 1 | Tight on the host as the call goes out | 4s |

### ✏️ Ask the audience — `audiencePoll` (→ returns)
| # | Take | Duration |
|---|---|---|
| 1 | Sweep across the voting audience | 3s |
| 2 | The crowd from the stage | 3s |

### ✏️ Sketchy guy phone call — `sketchyCall` (green room, on calling Steve → returns)
| # | Take | Duration |
|---|---|---|
| 1 | The phone on the coffee table, slow zoom | 3s |
| 2 | The sketchy guy loitering by the doors — long coat, wide-brim hat | 4s |

### ✏️ Producer says they're ready — `producerReady` (kept for preview; no
longer triggered — the `hostWelcome` beat fronts every run instead)
| # | Take | Duration |
|---|---|---|
| 1 | The stage manager in the wings — headset, clipboard | 3s |
| 2 | Sweep from the wings onto the stage | 2.5s |

## Trigger map (director cue sheet)

| Game event | Camera |
|---|---|
| Title screen | `intro` loop |
| Run begins (`host:welcome`) | `hostWelcome` (holds under the greeting bubble) |
| New game starts (`run:start`) | re-bases on `thinking`; Q1's `question:show` cuts to `hostAsks` |
| Question shown (tier start: Q1/Q11/Q21/final) | `hostAsks` → `thinking` |
| Question shown (otherwise) | `thinking` (restarts the playlist) |
| Final answer locked | `finalAnswer` (holds until the reveal) |
| Correct | `correct` → background |
| Wrong | `incorrect` → background |
| Coins bank | `hostExplains` queued after `correct` |
| Win | `finalCorrect` (tail loops) |
| 50:50 / audience / phone | `fifty` / `audiencePoll` / `phoneFriend` → background |
| Steve called (green room) | `sketchyCall` → `greenRoom` |
| Enter green room | `greenRoom` loop |
| "Start next round" (`green:manager`) | `managerDoor` (holds until the run starts) |

## Notes

- **New set pieces** built for these takes: the gold **piggy bank** on a lit
  pedestal at stage right, the **stage manager** (headset + clipboard) in the
  wings, and the **sketchy guy** (long coat, wide-brim hat) by the green-room
  doors. All original art drawn in code.
- **Reduced motion:** every take becomes a locked-off cut (held at its mid
  pose) for its duration — no orbits, pans, or zooms.
- The CSS backdrop (no-WebGL fallback) keeps its own simpler mood/camera-push
  language; these takes are the WebGL studio's.
