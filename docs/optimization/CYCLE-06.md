# Optimization Cycle 06 — plan (target: v1.7.0)

The last of the reviewed survey backlog plus three self-sourced items from
implementation experience. Inline adversarial review before implementation.

| # | Surface | Change | Effort/Risk |
|---|---------|--------|-------------|
| C6-01 | pe-practice | Add a domain filter for Practice mode on the entry screen | M/med |
| C6-02 | ww-quiz | Click-to-enlarge lightbox for exhibit images | M/low |
| C6-03 | ww-screens | Make the pre-round host beats tap-to-skip and stop them stacking | M/med |
| C6-04 | ww-screens | Hide the 3D set wordmark behind the title/result hero (parity with CSS fallback) | S/low |
| C6-05 | cross | Session-cache parsed question banks in shared/bank-loader.js | M/med |
| C6-06 | cross | Add PWA/social metadata and fix the StarNix head gaps | M/low |
| C6-07 | kbb | Wire up the dead Intel / showAllIntent feature | M/med |
| C6-08 | cross | Single source of truth for the site version | S/low |
| C6-09 | ww-screens | WWTBANE dev-jump input max follows the active ladder | S/low |
| C6-10 | sx-shell | StarNix genre buttons expose aria-pressed | S/low |

## Instructions

### C6-01 — Add a domain filter for Practice mode on the entry screen

**Surface:** pe-practice · **Files:** practice-exams/app.js, practice-exams/engine.js, practice-exams/styles.css · **Effort/Risk:** M/med

bankMeta() already computes per-domain counts and every question carries q.domain. Add an optional 'Focus domain' chip row on the entry screen (All + one chip per domain with its count, same .pe-seg styling), stored in the existing prefs blob, applied only to Practice launches: extend buildPractice(count, domain) to filter the pool before sampling, and have updateFacts() show the effective question count. Exam mode ignores the filter to stay exam-faithful.

*Why:* Students can drill their weakest domain — the exact follow-up the results screen's 'focus next on…' recommendation asks them to do.

### C6-02 — Click-to-enlarge lightbox for exhibit images

**Surface:** ww-quiz · **Files:** wwtbane/src/shell/ui/overlay.js, wwtbane/styles/main.css · **Effort/Risk:** M/low

Question exhibits (.q-image img) are capped at max-height:200px with no zoom — the ncp-mci bank ships 6 PNG screenshots that are illegible at that size, especially on mobile. In questionImage(), wrap the img in a button (aria-label 'View exhibit full size'); on click append a fixed full-screen .img-lightbox overlay showing the image at up to 92vw/92vh with a close button, closing on Escape/backdrop click and returning focus to the trigger. Add ~15 lines of CSS. Verify headless with a seeded run containing an image question (or by injecting q.image): click opens the overlay, Escape closes it, focus returns.

*Why:* Diagram/screenshot questions become actually readable instead of a 200px thumbnail you have to answer from.

### C6-03 — Make the pre-round host beats tap-to-skip and stop them stacking

**Surface:** ww-screens · **Files:** wwtbane/src/shell/main.js · **Effort/Risk:** M/med

In wwtbane/src/shell/main.js, _welcomeBeat and _managerBeat hold the player on an empty screen behind fixed setTimeouts (measured headless: ~7.8s from 'Start new game' to an answerable question; ~11.6s from 'Start next round' because the manager beat then chains into the welcome beat). Store the timeout ids and add a one-shot pointerdown/keydown listener that cancels them, removes the bubble, and calls beginPlay()/startRun immediately (guarded so it fires once). Also pass a skipWelcome flag from _managerBeat into startRun so the two beats never play back-to-back. The intro cinematic already has a Skip button — this brings the recurring beats in line.

*Why:* Every run start currently costs 8-12 unskippable seconds; impatient repeat players get straight to the question with one tap.

### C6-04 — Hide the 3D set wordmark behind the title/result hero (parity with CSS fallback)

**Surface:** ww-screens · **Files:** wwtbane/src/shell/studio.js · **Effort/Risk:** S/low

The CSS fallback hides its stage wordmark on hero screens (main.css: #backdrop-fallback[data-hero="1"] .bd-wordmark, backdrop.js setHero), but the GL studio's wordmark plane (studio.js ~line 841, wordmarkTexture) stays visible, producing a ghosted duplicate 'NUTANIX ENGINEER' directly behind the DOM title panel (visible in headless screenshot). Keep a ref to that mesh (this._wordmark = back) and in Studio.react() mirror backdrop.js's hero mapping: visible on 'question:show', hidden on 'scene:studio', 'run:win', 'run:dead'. Verify with before/after screenshots of the title screen.

*Why:* The title and result screens read as one clean hero instead of two overlapping wordmarks fighting behind glass.

### C6-05 — Session-cache parsed question banks in shared/bank-loader.js

**Surface:** cross · **Files:** shared/bank-loader.js · **Effort/Risk:** M/med

fetchText() uses cache:"no-cache", and the in-memory _cache dies on every navigation, so each hop between launcher, PE, WWTBANE, and StarNix refetches manifest.json plus the full bank markdown (banks/ncp-mci/ncp-mci.md is 376 KB) and re-parses it — confirmed via request logging across consecutive visits. In load(), store the raw markdown in sessionStorage keyed by "nst.bankCache." + id + ":" + entry.file (quota-guarded try/catch), and read it before fetching; keep manifest() network-first and let its force=true Retry path clear the cache entry.

*Why:* Tool-to-tool navigation stops re-downloading a third of a megabyte per hop and boots noticeably faster on mobile connections.

### C6-06 — Add PWA/social metadata and fix the StarNix head gaps

**Surface:** cross · **Files:** manifest.webmanifest, icons/nst.svg, index.html, practice-exams/index.html, wwtbane/index.html, starnix/build.mjs · **Effort/Risk:** M/low

No page has a web app manifest, apple-touch-icon, or Open Graph tags, and the built starnix/index.html lacks theme-color and a meta description (its head template lives at starnix/build.mjs ~lines 145-151). Add a small manifest.webmanifest (name, short_name, start_url, display:standalone, colors) plus an icons/nst.svg extracted from the existing inline favicon, link both from all four pages, add og:title/og:description/og:type to the launcher, and add <meta name="theme-color"> and description to the StarNix build template, then rebuild.

*Why:* Add-to-home-screen installs get a proper name/icon/standalone window, shared links unfurl correctly, and StarNix's browser chrome matches the rest of the site.

### C6-07 — Wire up the dead Intel / showAllIntent feature

**Surface:** kbb · **Files:** starnix/kbb.js, starnix/index.html · **Effort/Risk:** M/med

run.flags.showAllIntent is set by the Intel consumable (line 925) and the Intel Cache artifact (line 230) but grep confirms nothing ever reads it — players pay coins for a no-op. Add a pure helper forecastIntent(run, n) that projects the next n incoming attack values from the enemy's pattern state (flat/ramp/alternating/siphon/crescendo, plus boss shield/jam parity) without mutating the enemy, export it on KBB, and in renderEnemy append a small statline ('next: 5 → 7 → 12') when run.flags.showAllIntent is set. Rebuild index.html.

*Why:* Two shipped items that promise 'see the enemy's full incoming attack' finally do something visible, and the pure helper is trivially unit-testable in Node.

### C6-08 — Single source of truth for the site version

**Surface:** cross · **Files:** shared/nst-version.js, index.html, practice-exams/index.html, scripts/nst-home.js, practice-exams/app.js · **Effort/Risk:** S/low

NST_VERSION lives hard-coded in scripts/nst-home.js AND practice-exams/app.js renders its own literal "v1.x.0" — every release bumps two files by hand (one was missed mid-cycle once). Add shared/nst-version.js defining window.NST_VERSION, load it from both pages, and read it in the diagnostics panel and the PE footer.

*Why:* Release hygiene: one bump, no drift between the two rendered versions.

### C6-09 — WWTBANE dev-jump input max follows the active ladder

**Surface:** ww-screens · **Files:** wwtbane/src/shell/ui/screens.js · **Effort/Risk:** S/low

The dev-tools jump input hard-codes max="30"; on a short-bank (e.g. 25-rung) ladder the browser UI happily accepts 26-30 which then clamp downstream. Set the max attribute from activeLadder().runLength when the settings screen renders.

*Why:* The input constraint tells the truth about the run length.

### C6-10 — StarNix genre buttons expose aria-pressed

**Surface:** sx-shell · **Files:** starnix/starnix-shell.js · **Effort/Risk:** S/low

The Upbeat/Chill genre buttons toggle the sx-btn-primary class but carry no ARIA state — a screen reader cannot tell which is selected. Set aria-pressed on both at build and on every repaint.

*Why:* The music-genre choice becomes perceivable to AT.

## Review verdicts

Inline adversarial review — all premises re-verified (showAllIntent is written
at kbb.js:230/925 and read nowhere; no og:/manifest metadata on any page;
bank-loader fetches no-cache with a per-page in-memory cache only). **All 10:
PASS.** C6-07 (Intel) is the riskiest (M/med) — scoped to a read-only reveal
of the existing intent forecast, no engine changes.

