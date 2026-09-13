# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

## v2.18.0 — "Merge" now merges (2026-09-13)

The worst kind of bug: no error, no crash, and the thing the whole app exists to
accumulate quietly disappearing.

### Fixed
- **Merging progress replaced it instead of combining it.** `NSTBackup.restore`
  in `merge` mode meant only *"do not delete keys the incoming copy lacks"* —
  within a key, the incoming value won outright. **All mastery lives in one
  localStorage key**, and all exam attempts in another, so "merge" threw away one
  side's entire history.

  Two ways to hit it, both ordinary:

  - **Two devices, one account.** Study on a laptop in the morning, open the tool
    on a phone at lunch: the phone pulls the account copy over its own local
    progress, and then pushes the result — so the loss propagates back to the
    server and the laptop. Verified: before this change a phone holding two
    questions the server had never seen ended up with the server's two and lost
    its own.
  - **Restore from file, choosing "merge".** The only sensible reading of that
    word is "combine", and it did not.

  `nst.mastery.v1` is now combined **record by record**, and
  `nst.practice-exams.history.v1` as the union of attempts, de-duplicated and
  re-capped. Keys with no strategy (preferences, the resume position) stay
  last-writer-wins, which is what those actually mean.

- **The in-memory store could put the old records back.** `NSTMastery` parses the
  store once and writes it back on its next save. A restore that changed
  localStorage underneath that cache would be undone by the next debounced save —
  intermittently, depending on timing. `restore` now invalidates it.

### The merge policy, and why
Two devices' records descend from a **shared** history, so this is not the same
problem as `mergeLegacy`, which folds together stores from different tools that
never overlapped and can safely sum:

- **The record with the newer `lastSeen` decides box, streak and schedule.** It
  is the most recent evidence. Taking the higher box would be kinder and wrong:
  getting a question wrong an hour ago is the truth, even if yesterday's device
  still remembers a high box.
- **Counters take the larger of the two, never the sum.** Both sides share a
  prefix; max never double-counts it and never loses what one side did alone.
- **`firstCorrectAt` takes the earlier value** — it marks when something first
  clicked, and the earlier one is the true one.

### Tests
`scripts/backup-test.mjs` 26 → 44 checks, on a window with **both** modules
wired the way a page wires them — the merge looks `NSTMastery` up lazily at
restore time because `nst-backup.js` loads first, and testing them together is
the only way to prove that lookup works.

Verified end to end against a real server with two separate browser contexts as
two devices: each holding two questions the other had never seen, both converge
on all four.

## v2.17.0 — A phone held sideways (2026-09-13)

Every mobile pass so far measured portrait. Landscape is the shorter, more
crowded of the two orientations and nothing had ever looked at it.

### Fixed
- **Two tap targets were under the WCAG 2.2 SC 2.5.8 (AA) minimum of 24x24 CSS
  px**, on every phone, in both orientations:
  - Practice Exams' **"← Main menu"** link was 87x21 — a 14px line of text with
    no padding at all. It is now 103x29, with the padding negative-margined back
    so nothing on the page moves; only the target grows.
  - The **volume slider** in Settings was 16px tall. The track still looks the
    same; the element now has 24px of height to aim at.

### Added
- **Landscape and tap-target checks in `scripts/a11y-audit.mjs` (35 → 45
  checks).** Five surfaces measured at 844x390 with touch emulation: every
  target at least 24x24, and no page scrolling sideways.

  **A control's own box is not always its target.** A 16x16 checkbox inside a
  510x43 `<label>` has the label's hit area, and failing it would be wrong — so
  the rule takes the larger of the two. Measuring the element alone reported
  three perfectly good Settings toggles as failures, which is how that ended up
  written down in the file.

### Not defects, after checking
The first landscape sweep also flagged the decorative background glows as
escaping the viewport and controls sitting below the fold. Both were the audit's
fault: the glows live inside a `pointer-events: none`, `overflow: hidden` fixed
layer and never widen the page, and content below the fold on a 390px-tall
viewport is ordinary as long as the page scrolls — which it does, everywhere.

## v2.16.0 — A backup anyone will actually take (2026-09-12)

The database on that VM is the only irreplaceable thing in the system: every
account, every password hash, and everyone's study history. The documented way
to protect it was "stop the service and copy three files", which is a procedure
nobody performs until the morning after they needed to.

### Added
- **`/admin` → Download a backup.** One click, one file, taken while people are
  still using the tool. Root only, CSRF-checked, written to the audit log, and
  streamed rather than read into memory.

  It uses SQLite's `VACUUM INTO`, and the reason is the whole point: copying
  `nst.db` from a running server gives you a file whose recent writes are still
  in the `-wal` companion, so the copy is quietly stale — or torn, if writes land
  mid-copy. `VACUUM INTO` writes a fresh, fully checkpointed database with no
  `-wal` or `-shm` beside it. One file, complete, restorable. It is also plain
  SQL rather than a Node API, so it does not depend on which version of the
  experimental `node:sqlite` surface a given Node ships.

  The restore note in the UI is not padding either: a snapshot copied back next
  to a stale `nst.db-wal` loses precisely the changes it was restoring, without
  reporting anything wrong. Both the admin page and `server/README.md` now say
  to delete the companions.

- **`scripts/backup-db-test.mjs` (CI-gated, 28 checks).** It does not check that
  a download happened. It takes a backup from a running server, writes it to
  disk, opens it as a database and reads the rows back: every account present,
  roles intact, credentials still hashes rather than passwords, and one user's
  progress recovered down to an individual question's box and sighting count.

  The other half is who may take one. A backup is a complete copy of every
  credential in the system, so the tests confirm an ordinary account gets 403, a
  signed-out visitor is sent to the sign-in page, a forged CSRF token is refused
  even for root, and a plain GET hands out nothing.

## v2.15.0 — Compression on the app server (2026-09-12)

A measurement pass over every entry point found the runtime already fast — FCP
under 140 ms everywhere, no long tasks — and every win sitting in transfer size,
on the server the VM actually runs.

### Added
- **Brotli and gzip for static files.** `server/compress.mjs`, built on Node's
  own `zlib`, so still no dependencies. Measured over the wire:

  | | on disk | brotli | saved |
  |---|---|---|---|
  | `starnix/index.html` | 2868 KB | 1350 KB | 53% |
  | `wwtbane` three.js | 652 KB | 155 KB | 76% |
  | `ncp-mci.md` (the bank) | 367 KB | 98 KB | 73% |
  | `nst-home.js` | 46 KB | 13 KB | 72% |
  | `nst-home.css` | 38 KB | 9 KB | 76% |
  | **total** | **3995 KB** | **1648 KB** | **59%** |

  Fonts and images are left alone: re-compressing a woff2 costs CPU to make it
  very slightly larger.

  Three details carry the weight, and each is its own test:

  - **`Vary: Accept-Encoding` on every negotiated response, including the 304.**
    Without it a shared cache can hand a brotli body to a client that asked for
    none, and the page fails to load — intermittently, for one person.
  - **The ETag changes with the encoding.** An identity ETag matched against a
    compressed body is the same bug from the other side: revalidate, get a 304,
    reuse bytes in the wrong encoding. A conditional request is now compared
    against the tag for the encoding being asked for.
  - **Brotli quality 5, not the default 11.** On the 2868 KB StarNix build:
    q5 gives 1350 KB in 67 ms; q11 gives 1301 KB in **3846 ms**. The default
    would stall the first request for nearly four seconds to save a further
    3.6%. Results are cached per file and mtime, under a bounded byte budget, so
    only the first request pays even that.

- **`scripts/compress-test.mjs` (CI-gated, 56 checks).** Every compressed body
  is decompressed and compared byte-for-byte with the file on disk — the one
  check that proves the whole path. It also re-asserts that compression changed
  nothing about the guards: the database and `.git` are still 404, the security
  headers survive, and the content type is still the file's own.

  **It talks to the server over `node:http`, not `fetch`.** undici decompresses
  a response transparently and leaves `Content-Encoding` in place, so `fetch()`
  hands back the original bytes under a header claiming they are brotli — it is
  structurally unable to prove anything about the wire. The first version of the
  test used it and duly reported the "compressed" body as exactly the size of the
  file it was supposed to have shrunk.

### Measured, and deliberately unchanged
FCP: launcher 100 ms, Practice Exams 72 ms, StarNix 136 ms. No long tasks on any
surface; heap 3–15 MB. Nothing in the runtime warranted work.

## v2.14.0 — The accessibility pass (2026-09-12)

An audit against axe-core plus the keyboard checks it cannot make. Three real
defects; the automated rules found one of them.

### Fixed
- **Keyboard focus was dropped every time a view changed.** Press Enter on
  *Start practicing* and Practice Exams replaces the whole container — which
  destroys whatever the keyboard was on, leaving focus on `<body>`. The next Tab
  restarts from the top of the document, so reaching question one means tabbing
  past the entire page. Both modes and the way back now move focus to the new
  view's heading, which also gives a screen reader something to announce.

  Not on the first paint, though: moving focus before anyone has interacted
  interrupts the page-load announcement.

- **Practice and Exam mode had no `<h1>`.** The bar title was a `<div>`, so a
  screen-reader user navigating by heading found nothing at all in the two
  screens where all the work happens. (This is the one axe caught.)

- **The page behind an open dialog stayed reachable.** The focus trap holds Tab
  inside the dialog, which is what a keyboard user needs — and does nothing for
  a screen reader's virtual cursor or element list, where all 13 background
  controls were still exposed and announced. The background is now `inert`,
  which removes it from focus, hit-testing and the accessibility tree together.
  A depth counter handles nesting, so closing the Reset confirmation does not
  un-inert the page while Settings is still open.

- **The dialog close button had no focus style of its own.** It is the control a
  dialog focuses on open — the first thing a keyboard user sees — and the only
  one on the page relying on the browser's default ring, which is tuned for
  light chrome and reads faintly on this theme.

### Added
- **`scripts/a11y-audit.mjs`** — axe-core across six surfaces, including the
  ones reachable only by interacting, plus the checks axe cannot make: every
  control named and visibly focused, focus surviving a view change, the dialog's
  trap/Escape/restore contract, the background unreachable while it is open, and
  the first paint not stealing focus. 35 checks.

  Needs a browser and axe-core, so it is a local tool rather than a CI gate (CI
  stays dependency-free), like `scripts/mobile-audit.mjs`:

  ```bash
  npm install --no-save axe-core
  node scripts/a11y-audit.mjs      # expects a static server on :8124
  ```

  **Two measurement traps are documented in its header, because the first
  version of the file fell into both.** Probing every control for a focus ring
  focuses each one in turn, which destroys the state the focus-after-view-change
  check reads — so ask where focus is *first*. And a `:focus-visible` ring only
  appears in keyboard modality, which Chrome infers from the last real input
  event: after any click in the setup, a programmatic `.focus()` matches
  `:focus` but not `:focus-visible`, and every correctly-styled control reports
  as having no ring. Between them those produced five false failures, including
  one against a fix that was working.

### Verified
- axe-core: **no violations** on the launcher, the Settings and Help dialogs,
  the Practice Exams entry, Practice mode with a question checked, and a live
  exam — at WCAG 2.0 A/AA, 2.1 A/AA and best-practice.
- Every interactive control on all six surfaces has an accessible name and a
  visible focus indicator.

## v2.13.0 — Why a domain is weak (2026-09-12)

The dashboard says *networking, 28%*. That is a verdict without evidence. A weak
domain is a set of questions with histories, and this is where those become
visible.

### Added
- **Each question carries its own record in Practice Exams.** Under the
  explanation, once you have seen it before:

  > Seen 5 times · 1 right, 4 wrong · due now

  "1 right, 4 wrong" says something a percentage cannot: this is not a gap in
  coverage, it is a question that keeps catching you. It appears only when there
  is a history to report — the answer just given is already in the record, so a
  first sighting would read "Seen 1 time" and add nothing.

  It refuses to overstate in two smaller ways as well: a record with sightings
  but no grades (a lifeline carried the answer) reports the sightings and claims
  no right/wrong split, and a card that has fallen due says "due now" rather than
  also promising a return.

### Changed
- **"When does this come back" is now said in one place.** `NSTMastery` owns the
  intervals, so it now owns the wording for them (`untilText`, `dueAt`); the home
  dashboard and Practice Exams both delegate. Two copies of the rounding rules
  would eventually disagree about the same card, and the one that is wrong would
  be whichever the reader happened to be looking at.

  `dueAt()` and `isDue()` are now gated against each other directly: not due a
  moment before, due exactly at, still due after.

### Tests
- `scripts/review-test.mjs` 48 → 65, `scripts/mastery-test.mjs` 47 → 62.

## v2.12.1 — An audit of the last five releases (2026-09-12)

Five releases in one session is exactly when things slip through. This is the
review pass over that diff. Nothing here was reported by a user; three defects
were found by writing tests that execute a guarantee instead of pattern-matching
the source for it.

### Fixed
- **The review card contradicted itself on a large bank.** With 226 questions
  due it read *"Review 25 due"* in the heading and *"226 due again"* one line
  below, because the heading took the capped session length. The heading is the
  number someone acts on, so it now reports the real total and the session length
  is stated separately.

- **The updater followed symlinks out of the archive.** `walk()` used `stat()`,
  which reports a symlinked directory as a directory. A source tarball comes from
  GitHub, but it is still a tree this process did not build: a self-referential
  link would recurse until the stack overflowed, and a link pointing outside the
  tree would have had its **target's** contents copied into the live install. It
  now uses `lstat()`, skips symlinks, and copies only regular files.

- **The updater's preserve list depended on the platform separator.** It split on
  `path.sep`, which is right only while the path came from this platform's
  `relative()`. That is the identical assumption that made the static-file
  denylist inert on Windows in v2.8.1 — a rule written with forward slashes,
  compared against a path carrying backslashes. This list is what keeps the
  database from being overwritten, so it now folds both separators regardless of
  who built the string. Caught by an executable test, not a code review.

- **"Nothing was changed" could be a lie.** A disk that filled partway through
  the copy left a half-new tree and still reported that nothing had changed,
  which would send someone to restart a service that was not going to come back.
  Failures are now caught per file: before the first write the old message is
  still true, and after it the message says how many files were replaced, that
  the install is now a mix of both versions, that the database is untouched, and
  what to do about it.

### Tests
- **`scripts/update-test.mjs` 33 → 54 checks**, and the new ones *run* the code
  rather than matching its text: a real temp tree containing a self-referential
  symlink and a link to `/etc/hostname`, asserting the walk terminates and copies
  neither. `walk()` and `isPreserved()` are exported for this — a guarantee that
  can only be regex-asserted is not really guaranteed.
- **`scripts/review-test.mjs` 43 → 48 checks**, covering the headline/session
  distinction that produced the contradictory card.

### Verified, not changed
- The dashboard's whole cost on the full 255-question bank: **0.35 ms**
  (`summary` 0.13, `estimate` 0.21, `model` 0.01), and the review queue **0.11
  ms** over 255 questions. Home page load 41 ms. No optimisation warranted.
- The real updater end-to-end against GitHub: 279 files installed over a live
  tree, database preserved, on the hardened walk.

## v2.12.0 — The due queue, and somewhere to do it (2026-09-12)

"9 due now" was a number with nowhere to go. Spaced repetition only works if the
due cards actually get answered.

### Added
- **A "Review N due" card in Practice Exams.** It appears above the two mode
  cards when something is actually due, and never otherwise — an empty promise
  is worse than no card. It runs under Practice Mode rules: instant feedback,
  the explanation revealed, untimed.

- **The home page's "Due now" figure is now a link** to that session, with an
  accessible name that says where it goes. It is the only figure in the row that
  leads anywhere, and the only one styled as a link.

- **`shared/nst-review.js`** builds the queue, and the three arguable decisions
  live there with `scripts/review-test.mjs` (CI-gated, 43 checks) holding them:

  - **Overdue before new.** `NSTMastery.isDue()` counts a never-answered question
    as due, which is right for the scheduler and wrong for a review session: a
    255-question bank you have barely started would produce a "review" of 240
    questions you have never seen. Cards you have learned and are losing come
    first; new material fills whatever room is left.
  - **Oldest due date first,** among the overdue — the ordinary spaced-repetition
    rule. Ties keep the bank's authored order, so the queue does not reshuffle
    between the count shown and the session started.
  - **The session is capped at 25, and the cap is stated.** An uncapped queue on
    a fully-due bank is a sitting nobody finishes, and an abandoned review is
    worse than a short one — the scheduler only learns from answers. The counts
    always describe the whole due set, so "9 due" is never contradicted by a
    session of 25.

  Both surfaces describe a queue the same way — "10 due again · 15 new" — because
  those are different kinds of work and a reader plans differently for each.

## v2.11.0 — Weak areas you can act on (2026-09-12)

Naming someone's weakest domain and leaving them to go find it is half a
feature. Each weak area on the home page is now a link that opens Practice
Exams already focused on it.

### Added
- **Weakest-area rows drill straight into Practice Exams.** Clicking
  *networking* opens the tool with `networking` preselected as the practice
  focus — two clicks from "where am I weak" to answering questions about it.

  It sets Practice Exams' own preference key rather than inventing a second
  channel between the tools. PE already validates that value against the live
  bank on load, so a stale domain (a different bank selected since, a renamed
  area) falls back to "all domains", never to an empty session.

  Each row is a real `<a>`, not a click handler on a div: focusable, openable in
  a new tab, announced as a link, and carrying the domain and its coverage in
  its accessible name.

- **`NSTDash.withFocus()`** does the preference merge, because the dashboard is
  writing *another tool's* settings object. It carries the question-set choice,
  so clobbering it would silently change what the next exam draws. Anything that
  is not a plain object is replaced rather than merged into, and a `__proto__`
  key never survives — `localStorage` is shared with every other site on the
  origin.

- **17 more checks in `scripts/dashboard-test.mjs` (now 71)** on that merge:
  unrelated keys survive, the source object is not mutated, junk blobs are
  replaced, and prototype pollution is refused.

## v2.10.0 — Am I ready? (2026-09-12)

The dashboard says where you stand. This answers the question people actually
have: *if I sat the exam today, would I pass?*

It is the most useful thing a study tool can say and the easiest thing to get
dishonestly wrong, so `shared/nst-readiness.js` is built around four rules and
53 tests that hold it to them.

### Added
- **An exam-readiness estimate on the home page.** A **range** on a track with
  the pass mark drawn on it — never a single number, because a point estimate
  reads as a promise. The band's width *is* the uncertainty: narrow means the
  tool is confident, wide means it isn't, and both are honest.

  Four rules:

  1. **Never below guessing.** Each question's floor is its own blind-guess
     probability — 1/n for a single answer, 1/C(n,k) for a "choose k", which is
     far harsher and should be. A four-option question is right a quarter of the
     time from someone who has never seen it.
  2. **Evidence is smoothed, and so is the prior.** Observed accuracy is
     Laplace-smoothed toward a domain prior, and that prior is itself pulled back
     toward chance. Without the second step a short perfect streak produces a
     prior of 1.0, smoothing toward it does nothing, and the estimate reads 100%
     after one pass through the bank. It did, until the tests said so.
  3. **Time only ever lowers the estimate.** An overdue question decays back
     toward its guess floor — not toward the prior, which is built from the same
     ageing data and would barely move. Decay bottoms out at half the
     demonstrated edge over guessing, and since the target is the floor it can
     only reduce: a demonstrated miss is never forgiven by the calendar.
  4. **Below a quarter of the bank seen, there is no verdict.** At low coverage
     the number is mostly prior — an opinion wearing a percentage. It says how
     many more questions would change that, and shows no figure at all.

  A verdict is given only when the whole band sits on one side of the pass mark:
  **Likely ready**, **Not yet**, **On the edge**, or **Not enough data yet**.
  Each pairs its colour with a word, so colour is never the only signal. The
  pass mark comes from the bank's own `pass:` metadata, not a constant.

- **`scripts/readiness-test.mjs` (CI-gated, 54 checks)** tests the guarantees,
  not the arithmetic — including a hand-edited record claiming a billion correct
  answers. It runs against the real `NSTMastery`, so the estimate and the
  scheduler can never disagree about what "due" means.

## v2.9.0 — One progress picture (2026-09-12)

Three tools have been feeding one mastery store since v2.7.0, but nothing ever
showed the result. You could tell how a single session went; you could not tell
where you stood.

### Added
- **A progress dashboard on the home page.** Below the three tool cards: mastered
  share of the active bank as a ring, then seen, accuracy, what's due, the best
  exam score, and the three weakest domains as bars.

  The interesting part is what it refuses to say. A dashboard that overstates is
  worse than no dashboard, so:

  - **it stays hidden until a bank is chosen.** With no bank there is no
    denominator, and a panel of dashes is worse than no panel.
  - **it never names a weakest area that has never been answered.** Ranking
    untouched domains ranks nothing — they are all zero, so the list would be
    alphabetical noise that reshuffles the moment one is opened. Below two
    answered domains there is no ranking at all.
  - **it shows a nudge, not a wall of zeros,** before anything has been answered.
  - **"0 due" is not the same as "nothing scheduled."** An empty queue reads as
    *finished*, which is the opposite of the truth, so it says when the next card
    comes back instead.
  - **accuracy over nothing is blank, not 0%.**

- **`scripts/dashboard-test.mjs` (CI-gated, 53 checks)** tests those claims, not
  the plumbing — including a poisoned exam history, since `localStorage` is
  shared with every other site on the `github.io` origin.

  The rollup lives in `shared/nst-dashboard.js` as a pure function from data to a
  view model, precisely so the decisions can be tested without a browser. It runs
  against the real `NSTMastery`, so the two cannot drift apart.

- **`NSTMastery.summary()` now reports `nextDueAt`** — the soonest scheduled
  review when nothing is due right now.

### Fixed
- **The home page scrolled sideways on a 320px phone.** The nav row (bank chip,
  gear, avatar) overflowed the viewport, so the whole page did. Under 380px the
  decorative avatar — `aria-hidden` initials, carrying no information — is the
  one thing dropped, and the gap tightens before anything else has to. Verified
  at 320 / 360 / 390 / 768 / 1024 / 1440.

- **Domain names are shown as the bank author wrote them.** A `text-transform:
  capitalize` would render the authored `vms` as `Vms`, which no generic rule
  can fix. This also matches how Practice Exams shows them.

## v2.8.2 — One-click updates, scrollable dialogs (2026-09-12)

The VM is reachable but the GitHub URL is not, so the copy running there had no
way to move forward: every update meant a manual re-clone on a machine whose
whole point is that it cannot reach GitHub from a browser. It can reach it from
Node, which is all an updater needs.

### Added
- **One-click update from `/admin`.** *Check for updates* asks GitHub what the
  published version is; *Install update* downloads, verifies and installs it,
  then exits so the service manager restarts on the new code. Root only,
  CSRF-checked, and written to the audit log like every other admin action.

  It downloads code from the internet and runs it as the service account, so the
  safety is structural, not procedural:

  - **the source is a constant.** `ARCHIVE_URL` and `VERSION_URL` are built from
    literals in `server/update.mjs`; `applyUpdate()` takes no URL argument, so
    nothing in a request can redirect where the code comes from.
  - **staged, then verified, then swapped.** The archive is extracted to a temp
    directory and checked against a 7-file manifest *before* anything live is
    touched. A truncated or wrong download cannot leave a half-broken install —
    it fails with the old copy still intact.
  - **`server/data/` is never overwritten.** The database, `node_modules` and
    `.git` are preserved across every update.

  The archive is a `.tar.gz`, not a `.zip`: Windows' `tar` is bsdtar and reads
  both, but GNU tar on Linux reads only tar — the zip form worked on the VM and
  failed in every test.

- **`scripts/update-test.mjs` (CI-gated, 33 checks)** asserts the properties
  above rather than the happy path: that the source really is a constant, that
  verification happens before the copy, that the preserve list still contains
  the database, and that the routes stay root-only, POST-only, CSRF-checked and
  audited.

### Fixed
- **Dialogs could not be scrolled on a short window.** `.nst-modal` had no height
  limit, so on a laptop-height or scaled-up window the bottom of a long settings
  dialog — including the Reset control — sat below the viewport with nothing to
  scroll. The modal is now a flex column capped at the viewport height: the
  header stays pinned and the body scrolls, with `overscroll-behavior: contain`
  so the page underneath doesn't scroll instead once the dialog hits its end.
  Verified at five viewport heights down to 400px.

## v2.8.1 — Windows deployment (2026-09-12)

Preparing the app server for a Windows VM. A 130-agent audit raised 41
Windows-compatibility findings; three adversarial refuters each cut that to four
real ones, none of them in the deployed HTTP path. Verdict: **the server itself
is Windows-ready** — every confirmed defect was in build/test tooling.

### Security
- **The static-file denylist was inert on Windows.** `isDenied()` compared
  denylist entries written with forward slashes against `path.normalize()`
  output, which is platform-dependent:
  `path.win32.normalize('/server/data/nst.db')` is `'\server\data\nst.db'`,
  so `startsWith('/server/')` silently stopped matching. The SQLite database
  (scrypt hashes, live sessions, everyone's progress) and the full git history
  became downloadable by any signed-in user — while all 74 Linux tests passed.

  A URL path is not a filesystem path. `server/safe-path.mjs` now canonicalises
  URLs with POSIX semantics only and uses the platform path module solely for the
  final resolve, then enforces the denylist on the **resolved** path. It also
  closes Windows-only spellings: case-insensitive matching, trailing dots and
  spaces, drive letters, alternate data streams, backslash separators, NUL bytes.

- **`scripts/path-guard-test.mjs` (CI-gated, 162 checks)** runs every case under
  both `path.posix` and `path.win32`. Node's `path.win32` implements Windows
  semantics on any platform, so a Linux runner catches Windows path regressions —
  "we only test on Linux" was itself the vulnerability, and it was fixable without
  changing where we test.

### Fixed
- **Shutdown never ran on Windows.** Windows does not deliver `SIGTERM` — a
  service stop or `taskkill` terminates outright — so `db.close()` was skipped.
  `SIGINT`/`SIGTERM`/`SIGHUP`/`SIGBREAK` are all registered now. A hard kill was
  already survivable (WAL + synchronous commits).
- **A CRLF checkout broke the StarNix build.** `build.mjs` SHA-256-pins its
  vendored assets; Git for Windows defaults to `core.autocrlf=true`, which
  rewrites those bytes, so the build failed with `drifted` — indistinguishable
  from a tampered dependency. A `.gitattributes` (`* -text`) prevents it, and the
  check now detects the CRLF case specifically and says so, while still failing
  (silently normalising would defeat the pin).
- **The hostile-input gate crashed on Windows.** `scripts/security-test.mjs`
  passed a bare absolute path to `import()`; on Windows the ESM loader reads `C:`
  as a URL scheme and throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` before a single
  assertion — the gate would have silently stopped protecting anything. Now uses
  `pathToFileURL`.
- **`npm run check` broke at the KBB link.** `KBB_ASSERT=1 node ...` is POSIX
  shell syntax and npm runs scripts through `cmd.exe` on Windows, skipping every
  later step in the `&&` chain. `kbb-balance.cjs` now also accepts `--assert`; the
  env var still works.
- **The server test leaked a temp directory on Windows.** It removed the database
  directory immediately after `kill()`, which Windows refuses while SQLite holds
  the handles; the error landed in a silent `catch` so the suite still reported
  ALL GREEN. It now waits for the child to exit, retries, and reports.

### Added
- **A Windows deployment section** in `server/README.md`: firewall rule, NSSM
  service install, `ProgramData` for the database, PowerShell environment-variable
  syntax, Hyper-V reserved port ranges, and WAL-aware backups.

## v2.8.0 — Host it yourself, with accounts (2026-09-11)

The GitHub URL is blocked on some corporate networks, which makes a static site
on Pages unreachable for exactly the people who want it. This release adds a
small server so the tool can be hosted on a VM, behind a login, with each person
keeping their own progress.

It is **one Node process with no npm dependencies**. Storage is a single SQLite
file via Node 22's built-in `node:sqlite` — a database *file*, not a database
*server*: nothing to install, nothing to administer, and you can copy it to back
up or delete it to reset.

### Added
- **`server/server.mjs`** — serves the existing site, gated behind a sign-in.
  Anyone can create an account; a **root** account is created on first run to
  manage the rest (reset password, disable/enable, promote/demote, delete), with
  an activity log. The last remaining root cannot be deleted, disabled or
  demoted, since that would lock administration out permanently.
- **`shared/nst-sync.js`** — mirrors the browser's local progress to the signed-in
  account: pull on load, debounced push on change, and a final push as the tab
  closes. **Progress follows the person, not the browser.**
- **`server/README.md`** — setup, configuration, a systemd unit, and the security
  notes, including what this deliberately does not do.
- **`scripts/server-test.mjs` (CI-gated, 74 checks)** — spawns its own instance on
  a scratch port with a throwaway database and exercises the whole surface. Most
  of it is about what the server *refuses*: gating, traversal, account isolation,
  CSRF, throttling, admin authorisation.

### Why the apps did not have to change
StarNix, WWTBANE and Practice Exams still read and write `localStorage` exactly
as before; the sync module moves the same envelope the offline backup already
produces (v2.6.0). So there was no rewrite of three storage layers, the app
survives a network hiccup mid-session, and a server blob and a downloaded backup
file are interchangeable. On a static host `/api/me` simply 404s and the module
stays dormant — **the same build works in both places**.

### Security
- passwords stored as **scrypt** hashes with a per-user random salt, never plaintext
  (the test asserts the default password does not appear in the database file)
- session tokens random and stored **hashed**, so reading the database does not
  yield a usable cookie; `HttpOnly` + `SameSite=Strict`, `Secure` over HTTPS
- failed sign-ins throttled per IP and username, and worded identically whether
  the username exists or not, so accounts cannot be enumerated
- **the database, `.git` and CI config are never served** — the repo is the served
  directory, so this needed an explicit denylist; without it any signed-in user
  could have downloaded the password hashes
- a password change ends every other session for that account

The root default password is **`nutanix`**, as requested. It is stored hashed
like any other, can be set on first run with `NST_ROOT_PASSWORD`, and both the
server log and the Accounts page warn until it is changed.

### Fixed
- **Sign-out silently did nothing on the launcher.** The page sets
  `form-action 'none'` — correct hardening for a page that otherwise has no forms
  — which blocks a `<form>` submit with no visible failure. Sign-out is a `fetch`
  now, so the strict policy stands and the CSRF check still applies.
- **`frame-ancestors` was being ignored.** It has no effect in a `<meta>` CSP, so
  the sign-in and admin pages had no clickjacking protection; it is sent as a real
  header now, alongside `X-Frame-Options: DENY`.

## v2.7.0 — One mastery tracker, at last (2026-08-20)

Development-loop cycle 21 (architecture). The README has always promised that
"however you play, right and wrong answers feed the **same mastery tracker** per
question". Auditing the data layer for the dashboard work found that this was
**not true**: it held *inside* StarNix (whose three games share one profile), but
WWTBANE kept its own Leitner state in `wwtbane.save.v1` with a different schema,
Practice Exams recorded only attempt history, and nothing synced. Answering a
question in one tool did nothing for the others' scheduling.

This release makes the promise true.

### Added
- **`shared/nst-mastery.js`** — one per-question record (`nst.mastery.v1`) that
  every tool reads and writes. Practice Exams now feeds it too, so a practice or
  exam answer schedules the games.

### How two schedulers became one
They disagreed on both scale and gate, and those differences are what make each
tool feel like itself — so the **evidence** is shared while each keeps its
**policy**, passed per call:

| | scale (before) | gate | now |
|---|---|---|---|
| StarNix | 0–8, time-based | only when the card is **due** | `gate:"due", step:1` |
| WWTBANE | 0–5, run-based | only when **unaided** | `gate:"always", step:2` |

The canonical ladder is StarNix's 0–8 — the finer of the two, and time-based,
which generalises across tools in a way a per-tool run index cannot. WWTBANE
moves it two boxes at a time so its ladder keeps its **original length**: one
unaided answer still graduates an easy question, four still graduate a hard one.
Its tier bands were rescaled by 8/5 to match, and its run-index staleness nudge
is preserved.

Practice Exams uses StarNix's due-gate, which is what stops a single 60-question
sitting from minting a bank's worth of "mastered"; skipped questions record
nothing, since a question you never saw is no evidence either way.

### Migration
Both legacy stores are folded in once, on first load. Where only one tool knew a
question its record carries over intact (WWTBANE's box rescaled 0–5 → 0–8); where
both did, the counters **add** and the box takes the **higher** — the player
really did answer it that many times and really did demonstrate the better box
somewhere, and losing proven progress would be the worse error. A WWTBANE-only
record is left due rather than given a fabricated review date, since its run
index carries no wall-clock meaning.

Nothing is deleted: `wwtbane.save.v1` is untouched, and the profile's existing
backup rotation means the pre-upgrade `starnix:profile` (mastery included) is
retained in `starnix:profile:bak`. Verified in a live browser with planted
legacy data — history preserved, XP untouched.

### Verified
`scripts/mastery-test.mjs` (CI-gated, 47 checks) covers both policies, the
due-gate anti-cram rule, the unaided rule, the merge, and corrupt-record
handling. A browser test confirms the round trip end to end: answer in StarNix →
WWTBANE sees it → WWTBANE's answer moves the same box → Practice Exams sees that.

### Changed
- StarNix's `bucket` field is now `box`, matching the shared vocabulary. The
  games and shell never referenced it directly, so the rename is confined to the
  core, its mock and its harnesses.
- The StarNix profile no longer persists its own copy of mastery — it is a live
  view of the shared store, and a second stale copy would only confuse migration.
- A WWTBANE test kept its own hand-copied seed table, which had silently drifted
  from production; it now imports the real one.

### Known
- `starnix/verify-build.mjs` crashes in this environment (`dispatchEvent` on
  null). Pre-existing and unrelated to this change — it fails identically on the
  previous commit — and it is not a CI gate. Logged for a later cycle.

## v2.6.0 — Progress you can actually keep (2026-08-20)

Development-loop cycle 20 (durability). Everything NST knows about you — mastery
history built over weeks, exam attempts, game saves — lived only in this
browser's localStorage, with a Reset button and no way back. "Clear browsing
data" erased months of work permanently.

**Why not SQLite/IndexedDB/OPFS?** They are the *same* storage bucket the browser
clears together — a different API over identical fragility, for ~1 MB of WASM, a
CSP that has to allow `wasm-unsafe-eval`, and COOP/COEP headers GitHub Pages
cannot send. Durability comes from getting the data *out* of the origin, which is
what a downloaded file does.

### Added
- **Back up your progress** (launcher → Settings). Saves every NST key to a dated
  JSON file, and restores it here or on another device. Restore offers **Replace**
  or **Merge**, so an old backup on a newer device need not throw away the newer
  work, and confirms first with what the file actually contains and when it was
  made. The dialog defaults focus to Cancel, like Reset.
- **`shared/nst-backup.js`** — the collect/inspect/restore engine, plus a storage
  estimate and `navigator.storage.persist()` to resist *automatic* eviction (which
  a manual clear still defeats — only the file survives that).
- **`scripts/backup-test.mjs` (CI-gated, 26 checks)** covering the round trip, the
  refusal paths, prototype pollution, replace-vs-merge, and the two properties
  below.

### Security
- **A backup file cannot reach a neighbouring site.** A `github.io` user page is
  **one origin for every project published under it**, so this localStorage is
  shared with the owner's other sites. Export therefore takes only keys NST owns
  (`nst.`, `starnix:`, `wwtbane.`), and import refuses to write anything outside
  that set no matter what the file claims — a hand-edited or hostile backup can't
  overwrite a neighbouring project's data. Verified in a real browser.
- Restore is transactional: a mid-write failure (quota) rolls back what was there
  rather than leaving progress half-replaced, and says so.

### Fixed
- **StarNix stopped saving silently when storage ran out.** The write path
  swallowed every error, so a full quota let the player keep answering while
  nothing persisted — Leitner history quietly stopped accumulating. The failure is
  now recorded and surfaced once, on the menu the player returns to between runs.

### Changed
- `.nst-btn` alone paints no background, so a bare one fell through to the
  browser's grey chrome; every other use pairs it with a modifier. Added the one
  filled variant (`.nst-btn-primary`) for the recommended action.

## v2.5.6 — The listener array that never let go (2026-08-18)

Development-loop cycle 19 (audit). ARM is the largest of the three games (~3.9k
lines) and the only engine never fuzzed — `kbb-fuzz.cjs` covers KBB and
`core-fuzz.mjs` the question provider. Fuzzing it found a resource leak that no
scripted harness could have surfaced, because it only shows up under *repeated*
interaction.

### Fixed
- **Every rebuilt panel in ARM leaked its listeners for the rest of the
  session.** `on()` records each listener in a `listeners` array so `offAll()`
  can release them at unmount — but `clear(node)`, which every panel calls
  before re-rendering, dropped the DOM nodes without dropping their entries. The
  array kept every dead button alive, along with the closure holding its option
  and core data. `clear()` now prunes the tracked listeners for the subtree it
  discards. Measured, on 20 interactions:

  | surface | before | after |
  |---|---|---|
  | REWIRE puzzle (re-renders the grid on every cell tap) | 32 → 152 listeners | flat at 32 |
  | SORT puzzle (re-renders on every pick) | +80 listeners | flat at 30 |
  | briefing options (one re-render per core, per sector) | +1 per sector, forever | flat at 26 across 25 sectors |

  The puzzles were the worst of it — a full grid of listeners per tap — and they
  compound: after the rewire measurement above, the sort puzzle *started* at 156
  rather than 32. `arm-run.cjs` still passes 163/163, so the buttons all still
  work; the fix only stops the bookkeeping from outliving the elements.

### Added
- **`starnix/arm-fuzz.cjs`** — property fuzz of the ARM engine. Drives many runs
  with random input and, crucially, **random frame times** (1/60 up to a 2.5s
  backgrounded-tab stall) — what a real device produces and what a scripted
  harness never sends. Asserts every frame that ship and enemy positions stay
  finite, coins stay a non-negative integer, charges stay within `[0, maxCharges]`,
  the state is always a known one, and — the check that caught the leak — that
  listener and timer counts *plateau* rather than climb. Needs jsdom like
  `arm-run.cjs`, so it stays local rather than gating CI.

### Checked, and found already sound
Recording these so a later audit does not re-chase them:
- **`shared/nst-prefs.js` does not validate stored types**, but every consumer
  does: StarNix's `setMasterVolume` runs `+v || 0` (which turns `NaN` and
  `"abc"` into 0) and clamps to `[0, 1.2]`; Practice Exams' `sfx.js` range-checks
  before use. A poisoned `audioVolume` cannot produce a non-finite or
  deafening gain.
- **The launcher's `el(tag, cls, html)` helper assigns `innerHTML`**, but every
  bank-derived string reaching it (titles, cert codes, names) is wrapped in
  `esc()`, and the diagnostics panel uses `textContent` for the user-agent and
  storage keys.

## v2.5.5 — Stop paying for what the page never uses (2026-08-18)

Development-loop cycle 18 (performance). Measured real navigation timings and
resource waterfalls for all four entry points in a mobile Chromium, rather than
reasoning about file sizes on disk.

### Fixed
- **WWTBANE downloaded 652 KB of three.js before deciding it needed none of
  it.** `studio.js` — and through it the whole 3D bundle — is deliberately
  behind a dynamic `import()`, because `boot()` short-circuits to the "no
  question bank" screen before ever reaching it. A static
  `<link rel="modulepreload">` in the HTML defeated that entirely, fetching the
  bundle with the document either way. Measured on the no-bank path: three.js
  was **65% of the page's 999 KB**, for a module that is never imported and a
  screen with no canvas on it. The preload is now injected from
  `src/boot/preload-three.js`, only when a bank is active and WebGL isn't being
  skipped — the two conditions that decide whether the studio boots at all.
  - No bank: **999 KB -> 349 KB** (-650 KB), same screen, same behaviour.
  - With a bank: unchanged, and the head start is intact — three.js still
    finishes at ~45 ms, some 110 ms before `studio.js` is even requested.

### Changed
- **The launcher and Practice Exams now preload their two subset faces.** They
  were only discovered once `shared/fonts.css` had parsed, costing a waterfall
  hop before the real typography could swap in. Font fetches now start at
  ~15 ms instead of 46 ms (launcher) and 74–101 ms (Practice Exams). Request
  count and total bytes are unchanged — `crossorigin` is set, so the preload
  hits rather than fetching each face twice.

## v2.5.4 — StarNix's in-game screens, measured on a phone (2026-08-18)

Development-loop cycle 17 (UI/UX). Earlier mobile passes covered the launcher,
Practice Exams and WWTBANE; StarNix's *in-game* screens — the densest layouts
in the site — had never been measured at phone width. Driving each one through
the shipped test seams and measuring it turned up one bug class repeated in
three places: **a centred `nowrap` flex row that is then clipped loses content
off *both* ends, unreachably.**

### Fixed
- **The first-run "1 · START HERE" ribbon was sliced in half — on every
  viewport.** The mission cards carry `overflow:hidden` purely to contain a
  hover sheen that slides across them, and that clip also cut the top 7px off
  the order ribbon, which sits at `top:-8px` by design. The sheen is now a
  swept background that cannot leave the box, so the cards no longer clip at
  all. This was the very guidance a new player is meant to follow.
- **KBB's stat bar hid its own content on a phone.** The pill centres a
  `nowrap` row and clips it, so DEPTH lost 50px off the left edge (rendering as
  "-1") and the ↻ intro button sat 64px past the right edge — both permanently
  unreachable, not merely off-screen. It now wraps.
- **The KBB battle could be dragged sideways.** The ±8° artifact-card fan
  widened each 118px card's box to 138px and the rack never wrapped, pushing
  the game root 116px wider than the viewport. The fan is now flat on phones
  and the rack wraps; the root measures exactly the viewport width.
- **ARM's briefing dash threw its readouts off-screen.** The cockpit clusters
  are placed with `left:calc(12% - 125px)`, which computes to **-78px** at
  390px wide — taking SECTOR / CORES and the uplink log with it. They are now
  pinned to the edges and share the width.
- **The menu could be dragged sideways by ~9px.** `.sx-menu` set only
  `overflow-y:auto`, and per spec that computes `overflow-x` to `auto` as well,
  so the drifting backdrop photo (which scales 1.08→1.16 by design) became
  scrollable slop. `overflow-x` is now pinned.
- **Three controls sat under the WCAG 2.2 SC 2.5.8 (AA) 24px minimum** — the
  coach-mark close button (23×19), KBB's ↻ intro (65×21) and ARM's ↻ intro
  (57×22). All now meet the floor.

### Added
- **`scripts/mobile-audit.mjs`** — drives StarNix's menu, progress, settings,
  ARM (briefing / flight / question), KBB (how-to / battle) and CC at phone
  width and measures what the eye misses: content sitting outside a
  `overflow-x:hidden` ancestor and thus unreachable, containers that genuinely
  scroll sideways, and controls under the 24px AA target size (44px AAA is
  reported as advisory, since the in-game HUDs are deliberately dense). Green
  at both 390×844 and 360×640. Needs a browser, so like the a11y and attack
  harnesses it stays local rather than gating CI.

## v2.5.3 — The last two unaudited surfaces, fuzzed (2026-08-18)

Development-loop cycle 16 (audit). StarNix's core and its KBB engine were the
two surfaces the interrupted v2.4.1 hunt never reached. Rather than re-read
them, this cycle fuzzes them for invariant violations.

### Fixed
- **A bank whose questions all carry an exhibit crashed every game.** The
  provider relaxes its filters in turn (difficulty band → domain → the exclude
  list) but *never* stops filtering exhibits out, since games can't render a
  full-screen image. With no non-exhibit question anywhere, the pool came back
  empty and `next()` threw — uncaught in ARM, Chasm Chase and KBB alike. It now
  falls back to serving the exhibit question, which the games already greet
  with an explicit "exhibit served in error" notice; a confusing question beats
  a dead game. Banks with any ordinary question are completely unaffected.

### Added
- **`starnix/core-fuzz.mjs` (CI-gated)** — 200 provider draws across the
  domain / band / allowImages / near-total-exclusion matrix asserting `next()`
  never throws, never returns junk, and never leaks an exhibit into a game pool
  while an ordinary question exists; plus mastery-record range invariants and
  the all-exhibit regression above (verified to fail against the pre-fix core).
- **`starnix/kbb-fuzz.cjs`** — 120 seeded KBB runs (4,439 turns) with randomly
  ordered five-artifact racks, mixing attack/brace/repair and right/wrong
  answers, asserting HP stays within bounds, nothing goes NaN or negative, and
  every cap holds. Needs jsdom like `kbb-run.cjs`, so it stays a local harness.

## v2.5.2 — Accessibility audited with real measurements (2026-08-18)

Development-loop cycle 15 (UI/UX). Accessibility had never been audited
systematically in these cycles — this one measures it against the rendered
pages rather than eyeballing it, and keeps the audit runnable.

### Fixed
- **One WCAG AA contrast failure.** The version footer used `--fainter`
  (#6E6890) which computes to **3.88:1** on the page background — under the
  4.5:1 minimum for body text. The token is now #7E77A0 (**4.82:1**), still
  visually faint.

### Added
- **`scripts/a11y-browser.mjs`** — 14 checks against the real pages: computed
  WCAG contrast for every visible text node (resolved against its actual
  painted backdrop, not an assumed one), accessible names on every focusable
  control, a genuine modal focus-trap test (focus enters, survives 12 tabs,
  Escape closes), and `prefers-reduced-motion` compliance on all three
  surfaces. Skips where no browser is available.

### Verified (no changes needed)
- Focus trap, Escape handling, and reduced-motion support were already correct
  on every surface; all 25 focusable controls across the launcher and Practice
  Exams already carried accessible names.

## v2.5.1 — The hardening is now proven, not just present (2026-08-18)

Development-loop cycle 14 (security). Previous cycles added CSP, prototype-
pollution guards, storage validation and escaping; this one **attacks them** and
then pins the result so a refactor cannot quietly undo it.

### Added
- **`scripts/security-test.mjs` — a hostile-input gate, now run in CI.**
  18 checks over the real threat model: poisoned JSON must not reshape
  prototypes, a malicious question bank must stay inert data, duplicate ids and
  prose checklists must still be reported/ignored, the bank loader must honour
  only http(s), and no shipped file may contain `eval`, `new Function`, or a
  string-argument timer.
- **`scripts/attack-browser.mjs` — the DOM half.** It loads a bank whose every
  field carries an XSS payload, plus poisoned values in all seven storage keys,
  into **all four real pages**, and asserts nothing executes, no prototype is
  polluted, and every page still renders and works. 24 checks, all passing.
  Skips cleanly where no browser is available, so it never blocks CI.

### Verified (no changes needed)
- All eight stored-JSON guards, the CSP on all four entry points (WEBP
  exhibits are covered by the existing `img-src 'self'`), and every
  `NSTDomainLabel` render site (three escaped, one `textContent`).
- No new injection sinks, dynamic-code sinks, or committed dependencies since
  the v2.2.1 security pass.

## v2.5.0 — Exhibit diagrams 70% lighter (2026-08-18)

Development-loop cycle 13 (performance). Profiling the deployed site showed the
heaviest thing on it was no longer a build — it was the question bank's exhibit
images (2.6 MB across 27 diagrams), and v2.4.1 had just restored them in Exam
Mode, so they were being fetched in earnest.

### Changed
- **Exhibit diagrams converted to WEBP: 2,629 KB → 790 KB (−70%).** Quality was
  checked before trusting the number — a 1:1 crop of the most text-dense
  diagram (a VM-list screenshot) is visually indistinguishable from the PNG at
  q92, while dropping 585 KB → 93 KB. Six images where WEBP would have been
  *larger* keep their original encoding, and every diagram keeps its exact
  pixel dimensions.
- Bank markdown references were repointed to the new files; all 27 exhibits
  verified to fetch and decode in a browser with zero 404s.

## v2.4.4 — Readable domains, readable green room (2026-08-18)

Development-loop cycle 12 (UI/UX), screenshot-driven over the screens that had
never been captured: the Practice Exams results page and WWTBANE's green room.

### Fixed
- **"Vms" is now "VMs".** Domain names were title-cased by CSS
  (`text-transform: capitalize`), which cannot know acronyms or hyphens — the
  results breakdown read "Vms", and a hyphenated domain would read
  "Data-protection". A shared `NSTDomainLabel` helper (in the bank framework,
  so every surface can reach it) now renders real labels, used by the Practice
  Exams domain rows, the review chips, the "focus next" callout, and StarNix's
  Codex.
- **WWTBANE green room header washed out.** The heading and its subtitle sat
  directly on the lit 3D lounge with no scrim. They now share the same
  translucent legibility card the title screen already uses.
- **Practice Exams results actions cramped on phones.** Three side-by-side
  buttons forced "Practice the 25 you missed" onto three lines; below 480px
  they stack, each label on one line at a full tap target.

## v2.4.3 — The wrong-answer walk survives pause and quit (2026-08-18)

Development-loop cycle 11 (audit, iteration 4): the loose ends left when the
last hunt was cut short — two confirmed and fixed, two refuted on inspection.

### Fixed
- **WWTBANE: pausing during the walk back to the green room did not stop it.**
  A wrong answer starts a 2.6s walk-back before the run finalizes, and `onPause`
  parked only the lock-in submit — so the run could end *underneath* the open
  pause menu. The walk timer is now parked on pause and re-armed on resume,
  exactly like the submit.
- **WWTBANE: quitting during that walk-back threw 2.6s later.** `abortPending`
  dropped the submit timer but not the walk timer, which then fired against a
  torn-down run — `endRun` dereferences the (now null) run controller
  unconditionally. The walk timer is dropped on quit, and `endRun` refuses to
  finalize a run that no longer exists.

### Investigated, no change needed
- The intro cinematic does **not** double-route keys: the screen state is
  `cinematic`, and the global handler only forwards to the quiz on `quiz`.
- KBB artifacts with permanent `onAcquire` effects (Bio Reactor, Glass Cannon)
  are **already unsellable by design** — `isSellable` excludes them precisely
  because the effect cannot be cleanly reversed, and the UI explains the
  refusal. The suspected sell-trap and buy/sell ratchet are both unreachable.
- The StarNix question provider's relax chain (band → domain → excluded) and
  its weighted pick were reviewed and are sound.

## v2.4.2 — Lifelines can no longer be burned on a locked answer (2026-08-18)

Development-loop cycle 10 (audit follow-up + supply-chain hardening).

### Fixed
- **WWTBANE: a lifeline clicked after "Final answer" spent a paid charge for
  nothing.** Locking an answer disables the options and the lock button, then
  runs a multi-second suspense beat before submitting — and pausing parks that
  submit indefinitely. The HUD medallions stayed live through the whole window,
  so a late click burned a charge on an answer that was already committed and
  set `assisted = true` on a question the player had answered unaided. The run
  controller now refuses the charge, and the medallions dim at lock-in with a
  tooltip explaining why ("your answer is locked in"); a new question re-arms
  them.

### Security
- **CI actions are pinned to commit SHAs** (`actions/checkout` and
  `actions/setup-node` at v4.4.0) instead of mutable `@v4` tags — the last open
  item from the v2.1.1 supply-chain review, now that the SHAs are resolvable.

## v2.4.1 — Deep bug hunt: exhibits restored, parser corruption fixed (2026-08-17)

Development-loop cycle 9 (audit, iteration 3): a parallel bug hunt across eight
surfaces, each finding adversarially verified against the real code before any
fix. Five defects confirmed and fixed; the rest were refuted as guarded or
unreachable.

### Fixed
- **Practice Exams — every exhibit image was missing in Exam Mode.** The
  option-shuffle rebuilt each question without `imageSrc`, and the fallback it
  relied on (`window.PE_EXHIBITS`) has not been populated since StarNix's exam
  mode was removed — so all 27 diagram questions rendered with no diagram,
  unanswerable, while Practice Mode showed them fine.
- **Practice Exams — a failing score could print the passing mark.** The result
  percentage rounded up while pass/fail is decided on the exact fraction, so a
  203/255 sitting (79.6%) displayed "80%" beside "80% to pass". The score now
  floors, and can never claim a threshold it did not reach.
- **Bank parser — the documented `**Q:**` bold-label form was broken.** Only
  `**Q**:` parsed; the documented variant left a literal `**` glued to the stem
  (and to any metadata value written that way).
- **Bank parser — Markdown checklists inside prose became answer options.** A
  `- [x]` line in an `Explain:`/`Teach:` block was swallowed as a real option
  and silently flipped the question to multi-answer with a wrong answer key.
- **Bank parser — duplicate question ids loaded silently.** Two blocks sharing
  an id collide in every per-question store (mastery, spaced repetition); the
  parser now reports it as a bank error.

### Added
- Regression tests for the exhibit-source and score-display defects, both
  verified to fail against the pre-fix code.

## v2.4.0 — Cleanup + salvage: branding, README, arms fix, 17 MB lighter (2026-08-17)

Development-loop cycle 8 (code + repository cleanup, with salvage).

### Added (salvaged from an orphaned work branch)
- **Launcher:** the official **Nutanix wordmark** now brands the nav (extracted
  to `shared/nutanix-wordmark.svg`), and the exam chooser is decluttered — the
  playable NCP-MCI tile stands alone with the seven coming-soon certs as a
  one-line note.
- **WWTBANE:** raised arms no longer clip through heads (the studio's shoulder
  rotation used the wrong sign in four poses), and the bare glowing circle
  over the crowd is gone.
- **READMEs:** the root README leads with the live URL and describes what each
  game actually plays like; WWTBANE's README points at the monorepo URL
  (the retired standalone URL is now pinned as forbidden by its docs test).

### Removed
- Stale working documents: `docs/optimization/` (the July loop's state files —
  also the last in-repo references to the AI tooling), the studio improvement
  plan, WWTBANE's one-time review reports (code review, graphics audit ×2,
  hardening review), and its `STATE.md`/`BROWSER_QA.md` resume-point docs.
- **16 MB of source art** (`starnix/art/`) whose processed versions are
  embedded in the build — originals remain recoverable from git history.
- The unused OrbitControls addon; the orphaned remote work branch (after
  salvaging its three good commits above).

## v2.3.4 — Polish: three.js preloads with the page (2026-08-17)

Development-loop cycle 7 (perf polish).

### Changed
- **WWTBANE:** `modulepreload` for the minified three.js build — the 652 KB
  fetch starts with the HTML instead of after the boot module resolves its
  import, removing one waterfall hop from first load. (StarNix's phone title
  screen was audited this cycle and passed as-is.)

## v2.3.3 — UI/UX cycle 2: StarNix mission select fits phones (2026-08-17)

Development-loop cycle 6 (UI/UX, iteration 2), screenshot-driven.

### Fixed
- **StarNix on phones:** the Mission-select header squeezed its right column
  off the viewport — the rank strip and the Main menu / Stats buttons clipped
  past the right edge at 390px. The bridge header now stacks vertically at
  phone widths: crest, full-width rank strip, then the menu buttons in a
  wrapped row. (WWTBANE's phone title screen was audited too and passed.)

## v2.3.2 — Audit cycle 2: review findings applied (2026-08-17)

Development-loop cycle 5 (code audit, iteration 2): an adversarial review of
everything the loops shipped since v2.1.1 verified the CSP hashes, the
minified three.js export surface (416/416 identical), build determinism, and
the vendored fonts — and produced two cleanup findings, both applied.

### Changed
- **Fonts load without blocking:** `shared/fonts.css` shrinks from 62 KB of
  base64 to a ~1 KB stylesheet referencing sibling `.woff2` files (the pattern
  WWTBANE already uses) — the already-compressed woff2 ships raw instead of
  +33% base64, faces lazy-load per unicode-range, and CSP tightens from
  `font-src data:` to `font-src 'self'`.
- **One canonical safe-parse:** the `__proto__`-stripping stored-JSON parse now
  lives once in `shared/bank-parser.js` (`window.NSTSafeParse`), consumed by
  the bank loader and all three Practice Exams call sites; only the
  self-contained StarNix/WWTBANE bundles keep local copies.

## v2.3.1 — Performance cycle 2: WWTBANE loads 48% less JS (2026-08-17)

Development-loop cycle 4 (performance, iteration 2).

### Changed
- **WWTBANE:** the vendored three.js ESM build is now **minified**
  (1,243 → 652 KB, −48%) and the importmap points at it; the postprocessing
  addons (bloom) keep resolving the same module instance through the map.
  The inline importmap's CSP hash was recomputed to match.

## v2.3.0 — UI/UX cycle: the phone launcher works again (2026-08-17)

Development-loop cycle 3 (UI/UX modernization), screenshot-driven.

### Fixed
- **Launcher on phones:** the exam chooser overflowed the viewport — the hero
  (a flex item, so `min-width: auto`) grew to the cert grid’s intrinsic
  3-column width (654px) and **clipped the playable NCP-MCI tile off the left
  edge** at 390px. The hero now shrinks properly, and phones get a compact
  2-up tile grid with the playable tile’s two variant buttons stacked.

### Changed
- Hero headline uses `text-wrap: balance` for even multi-line wraps
  (progressive enhancement).

## v2.2.1 — Security cycle: strict CSP everywhere (2026-08-17)

Development-loop cycle 2 (code audit + security).

### Security
- **Content-Security-Policy on every page.** The launcher and Practice Exams
  run fully strict (`script-src 'self'`, everything else denied); WWTBANE
  allows exactly its two inline blocks by sha256 hash; the 404 page hashes its
  own inline style + script; StarNix (a single-file app) keeps
  `'unsafe-inline'` for its own code but denies every external vector —
  no page can load third-party script, embed plugins, hijack `<base>`,
  or POST a form anywhere.
- **Prototype-pollution guards:** every parse of stored JSON (NST prefs,
  StarNix profile, WWTBANE save + import, Practice Exams history/resume/prefs,
  bank cache) now strips `__proto__` keys with a reviver.
- **Repo hygiene:** the inert nested workflow directories left over from the
  subtree import (`starnix/.github`, `wwtbane/.github` — GitHub never ran
  them) are deleted, including the stale Pages deploy config that claimed
  write permissions.

## v2.2.0 — Performance pass: 30% smaller StarNix, zero external requests (2026-08-17)

Development-loop cycle 1 (workflow optimization + performance).

### Changed
- **StarNix:** 17 embedded images (ships, stations, canyon textures, menu and
  nebula backdrops) converted from PNG/JPEG to WEBP — the single-file build
  drops **4108 → 2862 KB** (gzip 2319 → 1388, −40% over the wire), with alpha
  preserved on every sprite.
- **Launcher + Practice Exams:** Manrope and Space Grotesk are now **vendored**
  as variable-font data URIs in `shared/fonts.css` — the site makes **zero
  external requests** (was: Google Fonts CSS + woff2 on two pages). Faster
  first paint, no CDN dependency, and the door is open for a strict CSP.
- **CI:** the whole dependency-free StarNix battery now gates PRs (audio,
  CC view/fairness, exhibits, perf, bank import, KBB balance) — design/test
  drift previously surfaced only in local runs.

## v2.1.1 — Full QA + security pass (2026-08-02)

A user-requested audit of the whole site: every test suite run, one real
gameplay bug fixed, stale harnesses modernized, and a static security review
(XSS sinks, storage poisoning, supply chain, secrets) with fixes applied.

### Fixed
- **Chasm Chase:** a real scheduling bug — with question gates every 6 km
  (≡3 mod 6), the 34-km turn grid landed a 90° corner exactly on a question
  gate every 3rd turn (39/141/243 km). `TURN_KM` is now 36, pinning every
  turn at ≡5 mod 6 — provably never on a gate.
- **Practice Exams:** a poisoned attempt-history key (any truthy non-array)
  crashed the entry screen; history is now validated as an array, history-row
  numbers are coerced, and the practice resume index must be a real integer
  before it indexes the question bank.
- **WWTBANE:** save migration now normalizes `wallet`, `stats.runs`, and
  mastery box numbers — a poisoned wallet permanently NaN'd every shop
  purchase.

### Security
- Bank-derived text (domain names, topics) and stored values (UA string,
  storage keys, prefs dump, history rows) now render as text nodes, never
  `innerHTML` — closing two high-severity and four low-severity XSS sinks in
  the StarNix shell/ARM briefing, the launcher diagnostics panel, and the
  Practice Exams history list.
- The question-bank loader only honours http(s) URLs for bank files and
  exhibit images (`javascript:`/`data:`/cross-scheme refs are dropped).
- WWTBANE's DOM helper lost its unused raw-`innerHTML` prop; CI runs with
  least-privilege `contents: read`; the launcher and Practice Exams pages
  send only the origin (never the full URL) to the font CDN.

### Changed
- **Test harnesses** modernized to the shipped design (no product changes):
  boss-music assertions track the reworked anthemic melody; scanner-drone
  (OB_SWEEP) checks became mine (OB_BOMB) solvability/instancing checks;
  eleven references to curated-out artifacts remapped onto the kept
  35-roster; exhibit integrity now validates runtime bank images on disk;
  boost (3 gates) and milestone (10 km first mark) expectations aligned.

## v2.1.0 — KBB art + artifact curation (2026-07-24)

A user-directed follow-up: real ship/asteroid art for Kuiper Belt Battle and a
tighter, more build-defining artifact roster.

### Added
- **StarNix / KBB:** three hand-drawn **hero ship sprites** now fly the squad —
  an attacker, a shield ship (green bubble), and a medic (green cross) — drawn
  both on the combat stage and in the squad panel.
- **StarNix / KBB:** three **asteroid textures** shape the Kuiper belt; each
  drifting rock now wears a cratered/rubble texture instead of a flat polygon.

### Changed
- **StarNix / KBB:** the artifact roster is curated from 71 down to **35**
  build-defining picks — a Balatro-style set spanning flat/mult/ramp damage,
  sustain, defense, economy, utility, risk, permanent scaling, domain payoffs,
  and the five **adjacency** artifacts whose rack position matters. Every
  artifact wired to special logic (Lazarus, Twin Reactor, Compression, Golden
  Cache) is retained.
- **StarNix / KBB:** late-section enemy HP scaling re-tightened
  (`hpPerSection` 0.10 → 0.16) so the clear-depth difficulty target holds after
  the stronger, concentrated artifact pool.

### Fixed
- **StarNix / KBB:** belt rocks that indexed a removed texture slot fell back to
  a gray polygon; the belt now derives its sprite index from the live texture
  count, so every rock is textured.

## v2.0.0 — Exam chooser + StarNix gameplay pass (2026-07-23)

A user-directed feature batch across the launcher and StarNix.

### Added
- **Launcher:** an 8-exam chooser on the main screen — NCP-MCI, NCP-AI,
  NCP-CN, NCP-CI, NCP-US, NCP-MCA, NCP-DB, NCP-EUC. Each cert offers a
  **25-question** or **Full bank** choice. NCP-MCI is playable; the other
  seven show a "Coming soon" tile until their banks land.
- **StarNix / Chasm Chase:** enemy **mines** — a glowing mine hangs in one
  lane; flying into it detonates for an extra shield (dodge by changing lanes).
- **StarNix / KBB:** artifact **position/adjacency interactions**. Artifacts
  read their neighbours and slot, so rack order matters, and the rack is
  player-reorderable via ◀ ▶ arrows on each card. Six new adjacency artifacts
  (Sync Coupler, Chain Link, Isolator, Flank Booster, Load Balancer, Peer
  Cache). The existing artifact set is unchanged.

### Changed
- **Chasm Chase:** the left-right **scanner drone was removed**; falling rocks
  are now **irregular boulders** instead of perfect spheres; **more question
  gates** (every 6 km, first at 3 km); a **deeper, more realistic draw
  distance** with retuned fog; sleeker enemy squadron ships.
- **KBB:** the **boss music** was reworked toward a more heroic, anthemic
  melody with the darkness eased a touch.

### Notes / deferred
- The attached **asteroid textures** and **Shield/Medic KBB ship sprites**
  need the image files committed to the repo before they can be embedded
  (pasted images arrive as vision, not files). KBB already renders ships and
  asteroids with existing/procedural art in the meantime.
- KBB already shipped **65** artifacts (not fewer than 35); this batch adds
  six rather than trimming. Say the word to curate the set down.

### QA
- StarNix build 4271.7 KB (gate 4600) + 5 logic harnesses green · launcher
  cert-chooser browser checks · Chasm Chase + KBB battle smoke clean (zero
  console errors) · WWTBANE + Practice Exams suites green.

## v1.9.0 — Optimization Cycle 08 (2026-07-23)

The capstone cycle: copy that tells the truth, misses that become the next
study session, and a release-consistency guard so future changes stay honest.
All 10 shipped; verdicts in `docs/optimization/CYCLE-08.md`.

### Fixed
- **Launcher:** the StarNix card described "study guides and reference
  material" — a product that doesn't exist. It now says what StarNix is
  (three arcade games, adaptive drills), with an ARCADE tag and a Play CTA.
- **WWTBANE:** the Help screen's safe havens were hardcoded to the classic
  Q5/Q10/Q17/Q25 — wrong on every scaled short-bank ladder. They now render
  from the active ladder.
- **Practice Exams:** the "A–D select" keyboard hint understated the truth —
  the handler accepts up to A–J and the full bank carries 5-option questions.
  The range now follows the loaded set (A–D / A–E), in both modes.

### Added
- **Practice Exams:** exam results gain "Practice the N you missed" — one
  click launches Practice Mode over exactly the missed questions; resumed
  full-bank sessions announce themselves with a "Resumed where you left off"
  strip and a Start-over control; the results screen names the question bank
  the score was earned on (a pass on 25 questions is a different claim than
  one on 255).
- **Launcher:** a "Last visited" ribbon marks the tool you opened last.
- **Site:** a branded 404 page (GitHub Pages serves it for any bad deep
  link) pointing back to the launcher; the README now lists both bundled
  banks (255-question NCP-MCI + the 25-question set).
- **Release hygiene:** `scripts/version-check.mjs` runs in CI — the site
  version and the CHANGELOG's top entry can no longer drift apart.

### QA
- StarNix build + 5 harnesses green · WWTBANE 168 unit tests + 22/22 browser
  E2E · PE engine harness + version guard green · targeted C8 browser checks
  · full-site zero-console-error sweep clean.

## v1.8.0 — Optimization Cycle 07 (2026-07-23)

Continuity and quality-of-life: sessions survive interruptions, results become
a study tool, and hidden affordances get labeled. All 10 shipped; verdicts in
`docs/optimization/CYCLE-07.md`.

### Added
- **Practice Exams:** full-bank Practice sessions resume where you left off
  (per bank; random subsets and domain-focused sessions still start fresh);
  the results "By domain" rows are now buttons that filter the review list to
  that domain (combines with the incorrect-only toggle); a print stylesheet
  turns the results review into a clean paper study sheet; exam attempt
  history can be cleared (confirmed first) for shared machines.
- **WWTBANE:** closing or reloading the tab mid-run now warns before the run
  is lost (only while a live run is on stage — menus, green room, and finished
  runs never nag); the Help screen documents tap-to-skip read-outs and the
  exhibit lightbox.
- **StarNix:** the Chasm Chase how-to card starts with Enter/Space (or
  Escape) and focuses its Continue button — keyboard players never reach for
  the mouse; KBB advertises its 1–9 answer keys under the options (pointer-fine
  devices only); profile export gains a one-tap "Copy to clipboard" button
  with clipboard-API + select-fallback and "Copied ✓" feedback.

### Fixed
- **Practice Exams:** the question strip now sets `aria-current` on the
  current chip, so screen readers announce position, not just selection.

### QA
- StarNix build 4266.2 KB (gate 4600) + 5 harnesses green · WWTBANE 168 unit
  tests + 22/22 browser E2E · PE engine harness green · 14 targeted C7 checks
  · full-site zero-console-error sweep clean.

## v1.7.0 — Optimization Cycle 06 (2026-07-23)

Deeper features land: domain-focused practice, a paid feature that finally
works, and pace control. All 10 shipped; verdicts in
`docs/optimization/CYCLE-06.md`.

### Fixed
- **KBB:** the Intel consumable and Intel Cache artifact set a flag that
  nothing ever read — players paid coins for a no-op. The reveal now renders:
  "📡 INTEL · next 4 → 0 → 8", a mutation-free three-hit forecast of the
  enemy's attack pattern.
- **WWTBANE:** the GL studio's set wordmark showed behind the title/result/
  green-room heroes (the CSS fallback already hid its own) — hero parity now.
- **Dev tools:** the WWTBANE jump input's max follows the active ladder length
  instead of a hard-coded 30.

### Added
- **Practice Exams:** a "Practice focus" domain chip row — study one blueprint
  area at a time (chips show per-domain question counts; persisted; Exam mode
  always draws the whole bank).
- **WWTBANE:** the pre-round host beats are tap/key-skippable (~4 s to ~0.7 s
  to the first question when skipped) and guard against stacking; question
  exhibits open in a click-to-enlarge lightbox (screenshots were illegible at
  the 200 px card size).
- **All pages:** Open Graph metadata for link sharing; the StarNix build's
  head gains its missing theme-color and meta description.
- **Performance:** bank markdown and the manifest are session-cached for
  5 minutes — hopping between the launcher and tools no longer refetches
  ~376 KB per navigation (Retry paths bypass the cache).
- **Release hygiene:** the site version lives in one shared module
  (`shared/nst-version.js`) read by the launcher diagnostics and PE footer.

## v1.6.0 — Optimization Cycle 05 (2026-07-23)

Escape hatches and assistive-tech reach. All 10 shipped; verdicts in
`docs/optimization/CYCLE-05.md`.

### Fixed
- **ARM:** a window resize regenerated the whole starfield and nebula — burning
  seeded gameplay RNG on a cosmetic event and subtly forking deterministic
  runs. Stars live in map coordinates; resize no longer rebuilds them.
- **StarNix:** the "Reset all progress" confirmation armed forever after one
  accidental tap — it now stands down by itself after 5 seconds.
- **WWTBANE title:** the music toggle rebuilt the entire screen (and replayed
  the branded wipe) just to change its label — it updates in place; pressing
  Enter in the seed box now plays the seed instead of doing nothing.

### Added
- **StarNix Settings:** the same easy exits the Codex already had — sticky
  "← Menu" at the top and Escape (both flush unsaved slider/toggle changes).
- **StarNix:** the "A run is waiting" prompt gained a plain "← Back to menu" —
  a mis-click no longer forces choosing between resuming and destroying the
  save; focus lands on Resume. Master/effects sliders play a confirmation blip
  at the released level.
- **Screen-reader reach across all three games:** ARM announces toasts,
  objectives, and answer verdicts; KBB announces verdicts and makes the fanned
  artifact cards focusable with real accessible names; Chasm Chase gains named
  controls, a proper dialog role on the question panel, live milestone/biome
  banners, and announced verdicts.
- **Practice Exams:** the results page mirrors Retake / Back to home (plus
  "↑ Back to top") after the review list — it ran ~15,000 px with actions only
  at the top.

## v1.5.0 — Optimization Cycle 04 (2026-07-23)

Trust and feedback: scores say what they measured, records get celebrated,
controls reach the keyboard. All 10 shipped; verdicts in
`docs/optimization/CYCLE-04.md`.

### Fixed
- **KBB:** the shop honored the base 4-slot cap even for Hangar "Consumable
  rack" owners — the render check is rack-aware like the engine, so the paid
  5th slot can actually be bought into.
- **ARM:** the five settings switches were plain divs — invisible to Tab.
  They are real `role="switch"` buttons with visible focus and Space/Enter.
- **Chasm Chase:** on-screen lane/duck buttons fire on pointerdown like the
  jump button (click waited for pointerup — touch input lag).

### Added
- **Launcher:** picking a bank loads it immediately — the hint shows the real
  question count (25 vs 255 matters), Settings rows gain counts, and a broken
  bank file fails loudly at the launcher instead of as an empty tool. Plus an
  a11y micro-pass: live-region hints, contextual nav-chip label,
  `aria-haspopup` on the gear, modal overscroll containment.
- **Practice Exams:** every attempt is stamped with the bank it was taken on
  (shown in Recent attempts — a PASS on the 25-bank is a different claim than
  the full bank) and how long it took; results show "Time used M:SS of M:SS".
- **ARM:** the shield bar turns peach with a soft pulse at low shields (same
  25%/35% hysteresis as the music's danger layer; static glow under reduced
  motion).
- **Chasm Chase:** the game-over screen celebrates "★ NEW PERSONAL BEST" (or
  shows the distance to beat) instead of saving your record silently.
- **WWTBANE:** the title screen gained the missing "🛋 Green room" button —
  returning players could not reach the shop without losing a run first.

## v1.4.0 — Optimization Cycle 03 (2026-07-23)

Keyboard reach, focus discipline, and pacing control. All 10 shipped; inline
review verdicts in `docs/optimization/CYCLE-03.md`.

### Fixed
- **Practice Exams:** both question palettes (Practice 255-chip, Exam 75-chip)
  are built once and updated in place — selecting an option no longer rebuilds
  the strip and throws keyboard focus to the page body; the focused option is
  re-focused after the card refresh.
- **StarNix intro:** the finale mission panel was clickable while still
  invisible — a stray center-screen click seconds into the cinematic could
  warp into a game. It is untouchable until its reveal beat.
- **Chasm Chase:** steering keys are swallowed only during the RUN phase now —
  during a question, Space activates the focused button and arrows scroll the
  explanation instead of being eaten by preventDefault.
- **KBB:** the engine's event log (Overcharge, Lazarus Protocol, siphons,
  consumable use) finally renders — a status ticker with aria-live; renderLog
  had guarded on an element nothing ever created.

### Added
- **Practice Exams:** leaving Practice mode with checked answers asks first
  (shared confirm dialog with the exam's Escape/Tab/focus contract);
  zero-progress exits stay instant.
- **ARM:** keyboard answering — digits 1-6 pick (or toggle, on multi-select)
  the matching option and Enter presses Submit while a question panel is up.
- **WWTBANE:** a click/tap on the question card skips the answer read-out
  stagger (up to ~9 s of pacing) and reveals every option at once; after
  green-room purchases, focus stays on the clicked shop control instead of
  jumping to the heading.
- **Launcher + Practice Exams:** Google Fonts load without blocking first
  paint (preload + swap, noscript fallback) — on a slow or blocked network the
  system-font fallback renders immediately.

## v1.3.0 — Optimization Cycle 02 (2026-07-23)

Polish and accessibility from the reviewed survey backlog. All 10 shipped;
review verdicts and instructions in `docs/optimization/CYCLE-02.md`.

### Fixed
- **StarNix:** the pause overlay's Resume and the selected music-genre button
  now have the intended iris styling — the `sx-btn-primary` class had no CSS
  rule anywhere, so they rendered as UA-default gray (high-contrast mode also
  gets its bounding border).
- **WWTBANE:** the win screen no longer says "took home 50,000 coins" directly
  above "0 coins total" — the win row now shows the payout (+ career win
  count); the truthful wallet total stays on the loss path.
- **Chasm Chase:** "Run again" resets milestone/biome banner caches, hides a
  banner stuck on-screen at death, and clears a stale "NEW RECORD" chip (the
  beaten record becomes the new PB bar).
- **WWTBANE:** resizing mid-question re-anchors the money-ladder highlight and
  the mobile strip's scroll — the current rung could sit fully off-screen.
- **Practice Exams:** the exam timer's screen-reader announcement fired every
  second after the first urgency crossing (aria-live on an element rewritten
  per tick); announcements now go through a dedicated live region exactly once
  per crossing.

### Added
- **Practice Exams:** checking an answer in Practice mode announces the verdict
  to screen readers ("Correct." / "Not quite. Correct answer: B"), cleared on
  navigation.
- **WWTBANE:** the multi-answer lock button shows the live selection count
  ("Lock in 2 answers") — multi questions grade all-or-nothing.
- **Launcher:** while "Mute all" is on, the Volume slider and Practice Exams
  sounds rows dim and disable; values are kept for unmute.
- **WWTBANE:** keyboard focus lands on the new question's stem after Continue
  instead of falling to the page body.
- **Practice Exams:** on the last exam question the Next button becomes
  "Review & submit" and opens the submit summary — the forward flow no longer
  dead-ends.

### Test infrastructure
- WWTBANE's browser e2e works under the consolidated repo again: the test
  server now falls back to the repo root for `/shared/` + `/banks/`, and the
  scenarios prime the runtime bank — 22/22 checks pass (previously the suite
  died on the "no bank" guard).

## v1.2.0 — Optimization Cycle 01 (2026-07-23)

Bugs and data-loss hazards from a 60-candidate survey. All 10 shipped;
review verdicts and instructions in `docs/optimization/CYCLE-01.md`.

### Fixed
- **KBB:** pressing a number key on a multi-select ("Choose two") question no
  longer grades it instantly wrong — and no longer throws and soft-locks the
  battle. Digits now toggle options exactly like clicks; the confirm control
  submits.
- **KBB:** four interface rules were rendering with `color: undefined` (the
  palette's `mid` token didn't exist) — stake lines, map nodes, artifact card
  text and the map dock now use a real mid-emphasis tone.
- **Chasm Chase:** switching back to the tab no longer force-resumes a game you
  paused — only the auto-pause taken on tab-hide auto-resumes.
- **ARM:** hiding the tab now freezes the run. Question countdowns are
  wall-clock deadlines and kept draining while hidden, silently costing
  timeouts and shield damage.
- **WWTBANE:** very long questions (with an audience poll up) could push the
  question text off the top of short viewports with no way to reach it — the
  card now scrolls internally.
- **Launcher:** the nav "Help" link was a dead anchor; it now opens a real Help
  dialog (full dialog contract: Escape, focus trap, focus restore) and is no
  longer hidden on tablets.
- **Launcher:** when the bank manifest fails to load, Settings no longer shows
  the misleading "No question banks found" empty state — it shows the real
  error with a working Retry.

### Changed
- **Practice mode:** after checking an answer, Enter advances to the next
  question. It previously re-triggered "Try again" and silently wiped the
  checked answer — including when focus was still on the button just clicked.
- **Launcher:** the "Reset all saved data" confirm now focuses Cancel, so a
  reflexive Enter can't wipe every save on the device.

### Added
- **Exam mode:** an in-progress timed exam now warns before refresh/close
  (browser `beforeunload` guard); the guard drops cleanly on submit and exit.

### QA
Verified: 25-assertion per-change browser QA (all pass), full-site E2E sweep
(zero console errors, zero failed requests), 168 WWTBANE tests, StarNix build
+ 5 harnesses, PE engine harness, security grep of the diff (no new sinks).
