# Changelog

All notable changes to the Nutanix Study Tool, one entry per optimization
cycle. Each cycle: a 10-surface survey selects 10 improvements, every item
passes an adversarial change review before implementation, and the cycle ships
only after the full QA gate (unit suites, browser E2E, security checks).

## v2.67.0 — the backup that arrived before the answers (2026-09-13)

**A coverage gap on the one client-side action that can destroy a study record,
and a latent defect the new suite found on its first run.**

### The gap
`backup-test.mjs` exercises `NSTBackup` directly, thoroughly. What nothing
covered was the path a person actually takes: **Settings → "Restore from file…" →
a file → one of two buttons that decide whether their current progress
survives.** `dialog-test.mjs` says so in its own header — `confirmRestore` only
appears after a file has been chosen, so it reads the source instead.

### What the first run found
The backup it produced contained `nst.activeBank` **and nothing else**. No study
record. Restoring it in Replace mode then wiped the eight answers it was meant to
bring back.

The cause was not restore. `NSTMastery` debounces its writes by 400ms;
`NSTBackup.collect()` reads `localStorage`. Inside that window the newest answers
are in the store's memory and not yet on disk, so an envelope built there omits
them silently.

**`NSTSync` already knew.** `flushOnHide` flushes mastery before snapshotting,
with a comment explaining exactly this. Backup is the same envelope built by a
different door, and that door did not flush.

### How reachable it is: not at all, today
Backup lives only on the launcher, where there is nothing to answer. Arriving
there from a tool fires `pagehide`, which flushes. **No user can currently reach
the window** — the safety is a property of the page layout, not of the module. A
page that put a backup button beside a question would reopen it in silence, and
nothing would have said so.

`collect()` flushes now, and only when a write is actually pending
(`NSTMastery.pending()`, new): the sync poll calls `collect()` every five
seconds, and an unconditional flush there would rewrite the whole store that
often for the length of a study session.

### The suite
`scripts/restore-test.mjs`, new, 24 checks, in the browser CI job after
`bankfail-test`. Eight answers, a backup, five more answers and a changed sixth,
then the real buttons:

- the backup taken **straight after answering** carries all eight
- choosing a file asks before doing anything, offers Cancel / Merge / Replace,
  and the question says which button does what
- **Merge** restores all eight, keeps all five the backup never saw, and keeps
  the *newer* answer to the question both know about
- **Replace** restores all eight, discards the five as the button says, and
  reverts the shared question to the backup's version
- Cancel leaves the record exactly as it was
- a file that is not a backup never reaches the confirm, says so, and changes
  nothing

Against the un-flushed `collect()` it goes red on four, naming the cause:

```
FAIL a backup taken straight after answering contains the study record -- nst.activeBank
FAIL Replace: everything the backup held comes back  -- 0/8
```

### A note on how this was read
The first measurement showed Replace losing everything and Merge apparently
fine, which reads as a catastrophic restore bug. It was neither: Merge "worked"
only because the local store still held those eight questions, so the backup was
never consulted, and Replace failed because the file was empty. Dumping the
file's contents settled it in one step. The suite now asserts what is *in* the
backup before it asserts anything about restoring it, so the same confusion
cannot recur.

## v2.66.0 — the third one, in the place I had already cleared (2026-09-13)

**A sweep for the class v2.57.0 and v2.65.0 belong to, and it found a third
instance — in the exact ranking v2.57.0 examined and let stand.**

### The class
Three times a recommendation has been decided by a **rate**, and a rate is won by
the smallest sample: one question answered wrong is 0%, and 0% beats everything.

### The third one
StarNix's coach took `stats().domains[0]`, sorted by `masteredPct`. Simulated
over 4,000 profiles of 5–11 domains with 1–45 questions each:

| | before | after |
| --- | --- | --- |
| named a domain with LESS left to learn | **65%** of profiles | 0% |
| average questions forgone | **15.7** | 0 |
| smallest domain ever named | **1 question** | 3 |

15.7 questions is the largest miss of the three, because StarNix ranks over whole
domains rather than one sitting's slice.

**v2.57.0 looked straight at this ranking** — it is where "Weakest domain" became
"Least mastered" — and let the ordering stand, reasoning that "for a drill
prompt, least-mastered is a fair thing to suggest". That reasoning assumed ties
would be common and the tie-breaker would carry the decision. Ties are not
common. The rate carried it.

### The fix
`StarNix.plan.drillTarget(domains)`: rank by **questions left to master**, ties
broken by the lower rate — the same shape as `engine.focusDomain` (v2.65.0). The
Codex list keeps its own `masteredPct` order, which is fine: it prints
`mastered/total` beside every row, so nothing there can be misread.

### The rule, so there is no fourth
`scripts/ranker-test.mjs`, new, 14 checks, in CI after `dashboard-test`. One
property, asked of all three rankers in their own vocabularies — the launcher in
answers, the results screen in misses, StarNix in mastered-of-total:

1. **Same rate, different size → the larger wins.** Two domains you are equally
   bad at are not equally worth an evening.
2. **A minimal candidate at the worst possible rate must not win** against a
   substantially larger one. The failure itself, stated directly.
3. **Same size, different rate → the weaker wins**, so a ranker cannot satisfy
   the first two by ignoring skill entirely.

Three `[neg]` controls rank the same fixtures **by rate** and require a different
answer — except on the third, which both rankings get right, and which is
labelled as deliberately non-discriminating so it is not mistaken for proof.

Reverting the comparison turns it red:

```
FAIL drillTarget: a one-question domain at 0% does not beat ten unmastered -- tiny
```

### What the three fixes taught, in order
v2.57.0 required **evidence before ranking** — a threshold, which has to be
tuned. v2.65.0 and this one rank on **the quantity itself**, which needs no
threshold: a domain with one question has at most one miss and structurally
cannot win. The second shape is better, and the launcher keeps the first only
because "how many answers back this" is genuinely its question.

## v2.65.0 — the smallest domain kept winning (2026-09-13)

**A defect, and the same one as v2.57.0 in a second place. The screen that tells
you what to study next named the domain with the least to learn, most of the
time.**

### What it said
After a real 75-question sitting:

```
🎯 Focus next on "Performance" — 0% there (4 missed).
```

Performance was **0 of 4** — the smallest slice in that exam. Data Protection was
**1 of 11**: ten missed. Lifecycle was 1 of 10: nine missed. The recommendation
named the four.

### Why
The ranking took the lowest **percentage**, with a comment saying "ties broken by
most misses". Ties across different denominators are rare, so the tie-breaker
almost never ran and a bare rate decided it — and the smallest domain wins a rate,
because four questions reach 0% far more easily than eleven do.

Simulated over 2,000 sittings against the shipped bank:

| sitting | named a domain with FEWER misses | missed questions forgone | smallest domain ever named |
| --- | --- | --- | --- |
| 75 questions, 60% accuracy | **62%** of runs | 2.9 average | 1 question |
| 75 questions, 80% accuracy | 49% | 1.8 | 1 question |
| 25 questions, 60% accuracy | 53% | 1.7 | 1 question |

A domain with a **single** question answered wrong is 0%, and beat everything.

### The fix
`engine.focusDomain()`, new and pure: rank by **missed questions**, ties broken by
the lower percentage. That answers the question actually being asked — where is
the most to be learned — and it removes the small-sample problem structurally
rather than with a threshold: a domain with one question has at most one miss and
can never outrank a domain with more. Between two domains that each cost ten
marks, the weaker one still wins.

The sentence leads with the number the ranking used:

```
🎯 Focus next on "Monitoring" — 11 missed of 13 there (15% correct).
```

Saying "0% there" first invited a comparison of rates across domains of very
different sizes, which is the comparison that misleads.

### The gate
`engine-test.mjs`, a new `focus` group: the exact sitting that started this must
name Data Protection; a one-question domain at 0% must not outrank four real
misses; equal misses go to the lower percentage; a perfect sitting, an empty
tally, a missing one and a zero-question domain all behave. Two `[neg]` controls
run the **old** percentage ranking over the same fixtures and require it to
answer differently — otherwise the data proves nothing.

Reverting the comparison turns it red:

```
FAIL [focus] names the domain with the most missed questions, not the lowest rate
```

### The same class, twice
v2.57.0 was the launcher ranking "weakest areas" by a measure the least-studied
domain wins. This is the results screen ranking "focus next" by a measure the
smallest domain wins. Both are recommendations built on a rate with no regard for
how much evidence stands behind it. The v2.57.0 rule lives in `dashboard-test`
and guards `NSTDash` only; this one guards the engine. Worth saying plainly: the
fix there was to require evidence before ranking, and the fix here is to rank on
the quantity itself — the second is the better shape, because it needs no
threshold to tune.

## v2.64.0 — read the archive before opening it (2026-09-13)

**Hardening on the one code path that downloads from the internet and installs
it as the service account. No exploit on the platform the tests run on — and
that was exactly the problem.**

### What the updater left to somebody else
`applyUpdate` extracted the archive **before** any of its staging checks, so by
the time the tree was validated a hostile member was already on disk. Nothing in
this code decided what was safe; it was left to whichever `tar` happened to be
installed.

Measured against a deliberately hostile archive, GNU tar behaves well:

```
tar: ../../victim/escaped-relative.txt: Member name contains '..'
tar: Removing leading `/' from member names
```

The `..` member is refused and the absolute path is defanged into the staging
folder. Nothing escaped.

**But this service runs on Windows, where `tar` is bsdtar, not GNU tar.** Every
test in this repository runs on Linux. The guarantee that mattered was the one on
the platform none of them cover, and it was never written down anywhere — it was
a property of the operating system's tar.

### Read first, extract second
The member list is now read with `-t`, which lists without extracting, and the
whole archive is refused by **this** code if any member:

- walks up with `..`, anywhere in the path, in either slash direction
- is absolute, including the `C:\` and `C:/` spellings Windows uses
- is anything but a plain file or directory — a symlink is refused outright
  rather than relied upon to be skipped later. `walk()` does skip symlinks; that
  is a second line of defence, not the first.

Verified both ways: the hostile archive's three bad members are named and
refused, and this repository's own 294-member archive passes with none.

### Two smaller things on the same path
**The download had no ceiling.** `res.arrayBuffer()` buffered the whole archive
with only a *lower* bound (under 10 KB was rejected). `MAX_ARCHIVE_BYTES` is 64 MB
— ten times the ~6 MB this repository packs to, room for several more
certification banks and their exhibits, and still a bound on what one response
can allocate on a small VM. `Content-Length` is checked when sent, and the stream
is counted regardless, because a header can be absent or wrong.

**Every `tar` failure was reported as a missing `tar`** — "`tar` is not available
to extract the update… on older Windows, update by hand." A corrupt download, a
refused member, a disk error: all the same sentence, sending someone to fix
something that was never broken. `tarFailure()` now distinguishes a missing
binary from an archive that could not be read, and quotes what was actually said.

### The gate
`update-test.mjs`, 54 → 75 checks: each refusal separately (`..` leading and
buried, absolute, Windows drive-letter in both spellings, backslash walk,
symlink, device), the size ceiling and how it is enforced, the honest error, and
— the point of the cycle — that **listing happens before extraction** in the
source order. Three `[neg]` controls keep it from simply refusing everything: a
directory member passes, a filename merely *containing* two dots passes, and a
`tar:` warning line is not mistaken for a member.

Against the previous code it goes red on four, including:

```
FAIL the archive is listed before it is extracted  -- inspect@-1 extract@10901
```

### A rule that miscounted itself
"Both tar call sites report through `tarFailure`" counted three, because
`function tarFailure(e)` matches a search for `tarFailure(e)` as readily as a
call to it does. The rule was wrong, not the code; it matches the `return`
statement now.

## v2.63.0 — one copy, and the right one (2026-09-13)

**Two copies of the same source, diverged, and last cycle blessed the wrong one.**

### What was there
The interchange export the NCP-MCI bank was built from existed twice:
`starnix/banks/ncp-mci-e1.md` — which nothing referenced and nothing knew about —
and `wwtbane/docs/interchange/e1.md`, which **v2.61.0 had just labelled the
provenance to keep**. They differed in five places, and the shipped bank agrees
with the unreferenced copy on every one:

| | kept (was `starnix/banks/`) | discarded (was `wwtbane/docs/interchange/`) | live bank |
| --- | --- | --- | --- |
| a cluster-size note | "the minimum is four" | "the minimum is five" | four |
| an LCM question | "a host that has GPUs" | "a host that has **CPUs**" | GPUs |
| a Metro Availability explanation | describes the options | "Options A and B" | describes them |
| a storage-container explanation | describes the option | "Option C" | describes it |
| an invisible character | a plain space | **U+2028 LINE SEPARATOR** ×5 | plain space |

Two of those are more than untidy. "CPUs" makes the question contradict its own
stem. And U+2028 has already cost this project three questions —
`starnix/verify-build.mjs` still carries the check from when one silently emptied
their explanations — so the file the repository pointed an author at held five
instances of the exact character that had broken it before.

That is how a near-duplicate turns harmful: not by existing, but by becoming the
copy someone is sent to.

### One copy, beside what it documents
Both files now live in `banks/provenance/`, next to the bank they are provenance
for rather than inside one of the three games, with a README recording every
divergence and which copy won. `starnix/banks/` and `wwtbane/docs/interchange/`
are gone; `FLAGS.md`, `CONTENT_QA_REPORT.md` and `QUESTION_AUTHORING.md` point at
the new home.

The manifest rule had to learn about them: `banks/provenance/` holds `.md` files
under `banks/` that are deliberately not banks, so it is excepted the way
`drafts/` is — with a second check that the exception is not an empty excuse.

### The gates
`bank-test.mjs`, 89 → 96 checks.

**No tracked text file is a near-duplicate of another.** Line-set Jaccard over
every tracked `.md`/`.js`/`.mjs`/`.json`/`.css` of 4 KB or more, excluding vendor
code and build output. Measured across 138 files it found exactly the two pairs
that started this and nothing else — zero false positives. Tracked files only,
which is the right trade and is said so in the rule: CI runs on a full checkout,
so nothing reaches `main` unseen, while a working-tree scan would flag every
scratch copy someone made while editing. A `[neg]` control plants a copy and
requires it to score as one.

**No invisible line or paragraph separator under `banks/`.** U+2028 and U+2029
are line terminators to a JavaScript parser and nothing at all to a reader.
Nothing in a question bank needs either.

That second rule went red the moment it was written, on a file this cycle had
just moved: `ncp-mci-e1-review.md` carried **four** U+2028s — and being
byte-identical in both old locations, both copies had them. They sit inside a
single-line `@overall:` field where a newline would break the format, so they are
now single spaces, which is what the corrected `e1.md` did with its own.

Both rules were run against the original state and both go red:

```
FAIL no tracked text file is a near-duplicate of another
  -- banks/provenance/ncp-mci-e1.md ~ wwtbane/docs/interchange/e1.md (1.00)
FAIL no bank or provenance file carries an invisible line separator
  -- banks/provenance/ncp-mci-e1-review.md: 1x U+2028 LINE SEPARATOR
```

### Also checked, and clean
Four things this cycle measured and found working, recorded so they are not
re-investigated: the launcher's weak-area link does open Practice Exams focused
on that domain (end to end, `focusDomain` written and the chip active); the nav
bank badge is correctly wired to both its initial and its update call; Practice
Exams' question-count facts do update when the set selection changes; and there
is no reference to any AI assistant anywhere in the tracked tree outside the
changelog.

## v2.62.0 — the second bank fits (2026-09-13)

**A cliff the code could only warn about, reached by the next thing this
repository is for. Plus a flaw in v2.60.0's own fix, found by measuring.**

### The cliff, measured
The page-hide push rides `keepalive: true`, which browsers cap at 64 KB across
all in-flight keepalive requests. `sync-test.mjs` has said since v2.39.0 that the
envelope sits at 94% of that with **one** certification bank, and that a second
would take it over on its own. It does. With the shipped 255-question bank
studied and duplicated per cert:

| banks | questions | envelope | gzipped | keepalive |
| --- | --- | --- | --- | --- |
| 1 | 255 | 49.5 KB | 4.6 KB | fits |
| **2** | 510 | **98.4 KB** | 8.5 KB | **over — falls back** |
| 4 | 1020 | 196.1 KB | 16.3 KB | over — falls back |
| 8 | 2040 | 391.5 KB | 32.5 KB | over — falls back |

Over the cap the push falls back to an ordinary `fetch`, which the previous
comment described honestly as *"less likely to survive the page going away"*.
Seven more banks are planned. From the second one, every last-chance save on a
closing tab is a coin toss.

### The fix is the shape of the data
The envelope is JSON full of identically-shaped records, so it deflates about
twelvefold — **eight banks compressed still sit at half the cap**. Measured
through a real browser and server: 43.6 KB → 2.3 KB, 18.6×.

- **Client.** The ordinary push compresses with `CompressionStream("gzip")` and
  sends `Content-Encoding: gzip`. A browser without it pushes plain JSON exactly
  as before.
- **Server.** `readBody` inflates a gzipped body — **with a ceiling.** `MAX_BODY`
  bounds the bytes *arriving*; a compressed body's danger is what it *becomes*,
  and 64 KB of zeros expands to 64 MB. `maxOutputLength` stops zlib at the limit
  rather than after it: a 63.7 KB bomb that would open to 64 MB gets **413**, an
  encoding the server does not speak gets **415**, and the process keeps serving.

**Page-hide cannot compress**, because `CompressionStream` is asynchronous and
the page is already leaving. So the ordinary push keeps its compressed body, and
the page-hide push uses it *only while it still describes what is in the
browser*. When something was answered inside the debounce window the cache is
stale, and it falls back to exactly the previous behaviour — sending a stale
compressed body would drop precisely the answers that push exists to save. The
case where it helps most is a push that **failed**: the cache is written before
the request, so the tab-closing retry is compressed and fits.

### A flaw in v2.60.0, found by this
`nst.sync.owner` — last cycle's stamp recording which account last synced in this
browser — starts with `nst.`, so `NSTBackup` collected it like study data. It is
not study data, and that bit twice:

- a restore overwrote the local stamp with whichever browser last pushed, so two
  devices would trade stamps and **clear each other's progress** — the exact
  failure the stamp exists to prevent;
- and because the stamp is written just *after* a push, including it made every
  push's snapshot immediately stale, silently discarding the compressed body the
  page-hide path depends on. That is how it surfaced: a new check failed against
  correct code, and the reason was the stamp.

`NSTBackup.LOCAL_ONLY` now names the keys that describe this browser rather than
the study. They are read and written normally; they are only invisible to backup,
restore and sync.

### The gates
- `server-test.mjs` 78 → 88: a gzipped body is accepted and round-trips
  byte-for-byte; a bomb small enough to pass the arriving-bytes limit is refused
  rather than unpacked; an unsupported encoding says 415; `identity` and plain
  JSON both still work; the server survives all of it. Two fixture-validity
  checks confirm the payload really compresses and the bomb really is small.
- `sync-test.mjs` 82 → 93: the ordinary push is gzipped and the body really is
  the compressed bytes; it decodes back to the same envelope; a browser without
  `CompressionStream` still pushes; a page-hide with newer data does **not** send
  the stale copy; after a failed push the retry does, and rides keepalive.
- `backup-test.mjs` 44 → 52: the stamp is not collected, survives a
  replace-restore and an account-switch clear, and a near-miss key like
  `nst.sync.ownership` is still ours.

Reverting each half turns its own suite red — 4 checks in backup, 4 in sync, 6 in
server.

### One more thing the module learned
`gzipBody` reached for the bare global `Response`. Everything else in that module
goes through `window`, and the inconsistency meant a harness could hand it a
compressor it would then ignore. It reads `window.Response` now.

## v2.61.0 — one way to write a question (2026-09-13)

**A documentation defect with real cost ahead of it. The repository told you to
author questions in a format nothing parses, using an importer that wrote to a
file deleted ten versions ago.**

### What was still standing
v2.51.0 retired WWTBANE's compiled question file when the runtime bank engine
took over. It left behind the whole machine that produced it:

- `scripts/import-questions.mjs`, whose default output was
  `src/content/questions.js` — **a path that no longer exists**
- `src/content/parseMarkdownBank.js` and `parseInterchangeBank.js`, two more
  question formats, used by nothing but that importer
- `src/content/quarantine.js`, imported by nothing at all
- three test files exercising the above (174 → 143 WWTBANE checks)
- `npm run import:questions`
- `docs/QUESTION_AUTHORING.md`, describing the dead format in full
- the same command repeated in `FLAGS.md`, `docs/priority-question-bank.md` and
  `docs/CONTENT_QA_REPORT.md`

And a source comment in `src/shell/main.js` asserting that
`src/content/questions.js` *"remains on disk as the schema/docs test fixture
only"* — it does not.

### Why it mattered rather than just being untidy
The two formats are not compatible:

| | live (`docs/BANK_FORMAT.md`) | dead (`QUESTION_AUTHORING.md`) |
| --- | --- | --- |
| question header | `### <stable-id>` | `## Q1` |
| domain | `domain: storage` | `- **Domain:** storage` |
| stem | `Q:` | `**Question:**` |
| difficulty | `difficulty: 2` (1–5) | `- **Difficulty:** easy` |
| how it reaches the app | dropped in `/banks/`, parsed at runtime | an importer, into a deleted file |

The next thing this repository is for is adding certification banks. Following
the wrong page meant authoring in a shape nothing parses, running a command that
appeared to work, and getting an empty bank, with nothing anywhere explaining
why.

### The owner's own 25 questions are all accounted for
`docs/priority-question-bank.md` holds 25 questions FLAGS.md describes as
owner-authored, and they are not in the live bank under their `NPX-*` ids — which
looked alarming. Measured per question, Jaccard over the union of stem words
against the best match in each bank: **23 are in `banks/ncp-mci/ncp-mci.md` and 2
in `banks/drafts/wwtbane-legacy.md`.** The two that first scored below the
threshold (0.53, 0.48) are the same questions reworded — checked by hand against
`mci-security-wn75` and `mci-vms-tuqo`. Nothing is stranded, so the file is kept
as provenance for the answer keys and no longer claims to be an input.

A first pass used word-containment rather than Jaccard and reported "25 of 25
already live", which is the same saturation mistake v2.53.0's rescue count made.

### The gate
`docs-test.mjs`, 38 → 45 checks: **every command a document presents as runnable
must name something that exists** — the script in `node <path>`, and the name in
`npm run <name>`. Two `[neg]` controls plant a missing file and a missing script
and require the scan to name both.

**The limit of the rule, stated in it.** The first version checked that a command
would run *from where it is written*, and reported four good lines as broken:
prose establishes a working directory a line earlier ("StarNix: `cd starnix &&
node build.mjs`. Harnesses: `node bank-lint.mjs`"), and a backticked command in a
sentence is sometimes a mention, not an instruction ("...which breaks `node
build.mjs`"). It now checks the thing that actually went wrong — that the file
exists in this repository at all — which a deleted script fails wherever it is
written.

Against the pre-deletion text:

```
FAIL every script a document says to run exists
  -- docs/NST_KNOWLEDGE_BASE.md: node wwtbane/scripts/import-questions.mjs
FAIL every npm script a document says to run is defined
  -- docs/NST_KNOWLEDGE_BASE.md: npm run import:questions
```

### Kept, and said to be provenance
`docs/priority-question-bank.md`, `docs/interchange/e1.md` and `e1-review.md` are
where live questions came from and why their keys can be trusted. They stay, now
labelled as history rather than as inputs. `docs/QUESTION_AUTHORING.md` is a
pointer to `docs/BANK_FORMAT.md` rather than a deletion, because the formats
differ and someone will look for it by name.

## v2.60.0 — whose progress is this? (2026-09-13)

**A data-separation defect. On a machine two colleagues share, the first
person's study record was transferred into the second person's account.**

### The setup this deployment actually has
The tool is served from one VM to a whole team. `localStorage` is per-browser; an
account is per-person. Signing out deletes the server session and deliberately
**leaves the study record alone** — it has to, or studying offline or on a static
host would be impossible.

Nothing recorded whose record it was. `NSTSync.start()` pulled with mode
`"merge"` whenever anything was already local, then force-pushed the result to
whoever had just signed in.

On a shared machine that is not a merge. It is a transfer. Measured end to end,
one browser, two accounts:

```
localStorage after sign-out         nst.mastery.v1, nst.activeBank
signed in as                        bob
bob's account contains alice's ids  true   (12 of 12)
```

Alice's twelve questions, permanently in Bob's account, feeding his mastery
scheduler, his readiness estimate and his review queue. And visible to him on
screen, because it is the same browser store the dashboard reads.

### The fix
The browser now carries a stamp — `nst.sync.owner` — saying which account last
synced there. On sign-in:

- **A different id** means this record belongs to someone else. It is cleared
  before anything reads or sends it, and never pushed.
- **The same id** is the person's own offline work, and merging it is the whole
  point — study on a laptop, open a phone, lose nothing. Unchanged.
- **No stamp at all** is the case the original comment describes, *"a first
  sign-in adopts existing local progress"*: a browser that studied before sync
  existed, or on a static host. Still adopted, **once**, after which the stamp
  makes every later switch visible.

`NSTBackup.clearLocal()` is new and necessary: `restore(..., {mode:"replace"})`
only clears keys on its way to writing new ones, so against a **brand-new**
account — which has nothing stored — `pull()` returns "nothing stored yet",
writes nothing, and the previous person's record survives to be pushed up. That
is precisely how it escaped.

**What this costs.** Work that was never pushed is lost — someone who studied
with the network down and signed out before it recovered. That window is narrow
(a push fires every five seconds, on page-hide, and forced at sign-in), and both
alternatives are worse: their record ends up inside a colleague's account, and it
stays readable in a colleague's browser. Nothing is said on screen; the incoming
person sees their own progress, which is correct, and naming the previous account
to them would be its own small leak. `NSTSync.switchedFrom()` reports it for a
surface that may want it later.

### The gate, in two places because the bug lives in two
`sync-test.mjs`, 68 → 82 checks, pins all three cases apart — different account,
same account, no stamp — plus the brand-new-account case that `replace` cannot
cover, and `clearLocal` removing every owned key and nothing else. A `[neg]`
control runs the same switch with the stamp absent and requires the data to
travel, so the fixture cannot quietly stop exercising the path.

`smoke-test.mjs`, 15 → 20 checks, plays it out for real: a colleague studies,
signs out, root signs in at the same browser, and root's account must hold none
of it. Against the original code:

```
FAIL and their account holds NONE of the previous person's questions
  -- 12 of 12 carried over
```

### A harness subtlety worth recording
`NSTSync` starts itself on load, so the mock window has already run the whole
sign-in path before the test touches it. Calling `start()` again is not a no-op:
by then the browser carries the *new* owner's stamp, so the second run correctly
sees no switch and resets `switchedFrom` to null — which is exactly what the new
check reported, against working code, until the test read the automatic run
instead of re-running it.

## v2.59.0 — the map that never moved (2026-09-13)

**A defect. The question strip in both study modes was pinned to question one
for the whole sitting. On a phone, everything past question nine was off-screen.**

### What the strip is for
Both modes draw a row of numbered chips above the card: where you are, what you
have answered, what you flagged, and the only way to jump straight to one. With
75 questions it is far wider than the screen — 21 chips fit on a 1280px desktop,
9 on a 390px phone — so it scrolls.

`ui.centerPalette()` exists to scroll the current chip into view. It was called
from exactly one place: `buildPalette()`. That runs **once**, at which point the
current question is #1 and the strip is already at `scrollLeft` 0.

So it was a no-op every time it ran, and never ran when it would have done
something. Measured, jumping through a real sitting:

```
                     q1        q10        q25   q50   q75
exam desktop 1280    visible   visible    OFF   OFF   OFF
exam phone 390       visible   OFF        OFF   OFF   OFF
practice phone 390   visible   OFF        OFF   OFF   OFF
```

Question 75 of 75, ninety seconds left, and the map of the exam is showing
questions 1 to 9.

### How it got there
Honestly, and that is the interesting part. **C3-01** stopped rebuilding all 75
chips on every render — the rebuild threw an activating keyboard user's focus to
`<body>` on every option click — and moved the build out of the render path. The
centring call went with it. Its comment even records the reasoning: the old code
"re-centered the strip needlessly". It did; centring on *navigation* was simply
never put back.

### The fix, and why it is not "centre every render"
Centring on every update is exactly what C3-01 removed, and rightly: it yanks the
strip back to the current chip while you are scrolling it to find a flagged one.
Navigation must move the window; answering and flagging must not. So the strip
now records which chip it is scrolled to and re-centres only when the current
question **changes** — one line in each mode, gated on `palCentered !== idx`.

### The gate
`scripts/palette-test.mjs`, new, 14 checks, in the browser CI job after
`resume-test`.

It measures the thing itself: after jumping to questions 1, 10, 25, 50 and 75, is
the current chip's rectangle inside the strip's visible box — in Exam Mode at
1280px, Exam Mode at 390px, and Practice Mode at 390px. Then the other half:
park the strip somewhere deliberately, answer and flag the current question, and
require the scroll position not to move; then jump again and require that it
does. A `[neg]` control scrolls a current chip out of view on purpose and
requires the probe to report it, so the measurement cannot quietly stop seeing
off-screen chips. Two source rules state the original bug directly: the centring
must be reachable from `updatePalette`, not only from `buildPalette`.

Against the original code it goes red on 8 of 14.

### A rule that ran out of vocabulary
Adding an eleventh browser suite turned `docs-test` red — not on drift, but on
its own word list, which stopped at ten: *"README says Eleven, the job runs 11"*.
Extended to twenty.

## v2.58.0 — the address the client wrote (2026-09-13)

**A vulnerability. With the reverse-proxy setting this project's own README
recommends, both login rate limits were fully bypassable by a header the caller
sets, and a client could strip `Secure` off the session cookie.**

### What `X-Forwarded-For` actually contains
`X-Forwarded-For: a, b, c` is built left to right, and **the client writes the
first entry**. Each proxy appends the address it received the connection from. So
the leftmost value is not an address the server learned — it is a string the
caller chose.

`clientIp()` read that leftmost value, and both login gates key on it.

### Measured, through a real reverse proxy, with `NST_TRUST_PROXY=1`
| | before | after |
| --- | --- | --- |
| per-account gate, honest client | locked after 9 | locked after 9 |
| per-account gate, rotating `X-Forwarded-For` | **never locked in 14** | locked after 9 |
| per-address gate, 70 usernames, rotating header | **never locked in 70** | locked after 45 |
| `Secure` on the session cookie, client prepends `http` | **SECURE MISSING** | present |

Unlimited password guesses at any account — `root`'s default password is
documented — and unlimited account enumeration, both from a single socket. The
per-address gate exists specifically to catch enumeration, which the per-account
key "cannot see at all because it never repeats"; the spoof turned off the only
gate that could.

The fourth row is a separate defect with the same cause: `isHttps()` read the
leftmost `X-Forwarded-Proto`, so a client prepending `http` to a genuinely-HTTPS
deployment's header made the server drop `Secure` from the session cookie, which
then travels in clear on any plain-HTTP request to the same host.

`server/README.md` line 297 tells the operator to set `NST_TRUST_PROXY=1` for
anything leaving a trusted LAN, so this was the recommended configuration, not an
exotic one.

### The fix
Read from the **right**. The only entry this server did not take on the caller's
word is the one the trusted proxy appended itself. With N proxies in front, the
last N were written by them and everything left of that is the client's, so the
address that reached the first trusted proxy is the Nth from the right.
`NST_TRUST_PROXY_HOPS` says what N is and defaults to 1 — the single-reverse-proxy
case the README describes. A header with fewer entries than that is not what the
declared topology would have produced, so it is ignored entirely and the socket
address is used: that is always a true statement about who connected, and falling
back to it can only ever tighten a limit.

There is no configuration in which reading the left-hand entry is correct, so
none is offered.

**The residual, and the new lever for it.** Reading the right-hand entry is right
only when a proxy actually wrote it. If the app is *also* reachable directly — a
second binding, a LAN shortcut past the proxy — a client connecting that way owns
the whole header again. `NST_TRUST_PROXY_FROM` takes a list of proxy addresses
and reads forwarded headers only from those peers, which is the one thing a
client cannot forge. Empty by default, so no existing deployment changes
behaviour; the README now says to set it, and why.

### The gate
`scripts/proxy-trust-test.mjs`, new, 14 checks, wired into CI after
`server-test`.

**It has to bring a proxy.** A header-reading bug cannot be tested by sending
that header directly: with nothing in front, leftmost and rightmost are the same
entry and every implementation looks correct — the first version of this probe
reported the fix had changed nothing for exactly that reason. So the suite stands
up its own chain of reverse proxies, each appending `X-Forwarded-For` and setting
`X-Forwarded-Proto` as nginx, IIS and Caddy do, and drives the app through them.

It covers both gates under a rotating header, the `Secure` flag against a
prepended `http`, a two-hop chain, a header too short for the declared hop count,
and the peer allowlist in both directions. Two `[neg]` controls confirm the
forwarded address is genuinely in play and that a value the client invents never
becomes a throttle bucket of its own.

Against the original code it goes red on 8 of 14, naming each one:

```
FAIL and a rotating X-Forwarded-For does not reopen it  -- NEVER LOCKED
FAIL the per-address gate closes on account enumeration despite a rotating header
FAIL and a client prepending "http" cannot strip Secure off it
```

### A flake this suite shipped with for ten minutes
It stood up eight servers on ports picked at random from a 900-wide range, and
two runs close together collided on `EADDRINUSE` and took the whole suite down.
A suite that fails for a reason unrelated to what it measures teaches you to
re-run it instead of read it. Ports now come from the OS, a failed start is
retried on fresh ones, and a stack that throws part-way takes its own server and
proxies down instead of leaving them holding ports.

## v2.57.0 — the word has to mean the measurement (2026-09-13)

**A defect. The home page told you your best subject was your worst, and printed
the claim as a bare percentage under a card that also reports accuracy.**

### What it said, and what was true
"Weakest areas" is ranked from `summary().score` — box progress across the WHOLE
domain, never-seen questions included at box 0. That is a coverage measure. A
domain you have opened four times out of twenty-six scores near zero however well
those four went, so the ranking sorts by how much of each topic you have started,
not by how well you answer it.

Measured on the shipped 255-question bank, with every domain held at the same
~73% accuracy and only coverage varied:

```
domain             shown%   true accuracy%   coverage%   seen/total
architecture            4             75          15          4/26
data-protection         6             71          24          7/29
lifecycle               8             71          33          7/21
...
vms                    23             72          95         39/41

"Weakest areas" picks: architecture, data-protection, lifecycle
```

`architecture` is the most accurate of the nine domains. The card named it the
weakest and drew it at 4%.

Three lines above, the same card reads **ACCURACY 73%**. Two percentages, no
units, measuring different things — and the reading a person lands on ("I get 4%
of architecture right") is both wrong and the most alarming one available. The
accessible name already said "4% mastered"; only the visible text had lost the
word.

Then "Pick one to practise just that area" sends them to drill the topic they are
best at.

### The fix, in three parts
**Rank on what the word claims.** `NSTDash.model` now orders by domain accuracy
once a domain has at least 8 answers behind it — below that, one miss out of
three is 67% and the list reorders on a single answer, which is not a diagnosis.
`NSTMastery.summary()` gained the per-domain `correct`/`incorrect` counts this
needs, and an `accuracy` that is **null**, not 0%, for a domain with no answers.

**Say which question was answered.** The model reports `weakBasis`:
`"accuracy"` when there is evidence, `"coverage"` before that. The launcher takes
its heading from it — "Weakest areas · Ranked by how often you answer them right"
versus "Least covered areas · Not enough answers yet to rank these by accuracy" —
and in the coverage case it now ranks and prints the *same* number, instead of
sorting by box score and labelling it coverage.

**Put the unit on the number.** Every row reads `62% correct`, never `62%`. The
column was 40px, sized for a bare percentage; it is 76px now.

The same word had the same problem in StarNix, where the numbers do carry their
units ("4% mastered", "12/26"), so nothing there could be misread — only the
headings were asserting weakness over a mastery ranking. Two words changed:
"Weakest domain:" is "Least mastered:", and "Progress · weakest domains" is
"Progress · least mastered domains". The rankings are unchanged; for a drill
prompt, least-mastered is a fair thing to suggest, and now it says so.

### The gate
`dashboard-test.mjs`, 106 → 116 checks. The rule is a discrimination test, which
is the only kind that could have caught this: build nine domains at **identical
accuracy** and varying coverage, and require that the ranking finds nothing to
separate them on; then make one domain genuinely worse **and** the best covered,
and require that it comes first. A fixture-validity control confirms the two
rankings actually diverge on that data — sorting it by box score reproduces the
coverage order exactly.

Reverting the model and re-running says it plainly:

```
FAIL and the percentage shown IS that accuracy, not box progress -- ["25/75",...]
```

25% shown for a domain answered right 75% of the time.

### A bug this cycle introduced and the measurement caught
The new per-domain loop declared `var answered`, and `var` is function-scoped:
that name already held the bank-wide answer count `accuracy` divides by. The card
went to **100%**. It was caught on the next measurement run, one line after the
fix that needed it, and is why the rename carries a comment rather than just a
new name.

## v2.56.0 — closing the class (2026-09-13)

**No defect. One rule that generalizes the last two cycles, and a sweep that says
there is no third instance.**

Twice in a row the same bug turned up: a feature guarded on authored data the
pipeline could not supply.

- **v2.52.0** — WWTBANE's green room only offers a question carrying a `steveClue`.
  No bank could express one, so Steve had nothing to sell, for all 255 served
  questions.
- **v2.54.0** — rung 30 serves an `impossible` question the first time a player ever
  reaches the final. No bank could mark one, so that branch had never run for
  anybody.

Both were found by reading the consuming code and asking where its data was meant to
come from. That works, and it does not scale: it finds them one at a time, after
they ship.

### The rule, asked from the other end
`adapter-test.mjs`, +5 checks (66 → 71). Take a question carrying **every field the
bank format can express** — all seventeen — and require each one to reach at least
one app, by its own name or by a named rename (`teach` → `briefing`,
`clue` → `steveClue`, `correct` → `answer`, `difficulty` → `authoredDifficulty`). A
field nobody carries is a field nobody can use, and it is exactly the shape of a
promise the format makes and the pipeline quietly breaks.

Planting a new field in the real parser is caught by name:

```
FAIL every field the bank format can express reaches at least one app (18 fields)
  -- hint -- carry it, or list it in DROPPED with a reason
```

### The sweep: no third instance
The other direction, for completeness — every `q.<property>` read anywhere in the
three apps, checked against what the adapters produce. Three candidates, none a
defect:

- **`phoneHint`** (WWTBANE) is authored, parsed and schema-validated, and **never
  rendered** — `phoneFriend` picks an option algorithmically and the UI shows the
  pick. It was deliberately not given a home in v2.52.0, and still should not have
  one.
- **`deepExplain`** (StarNix's ARM) falls back to `explanation` on the line that
  reads it: `q.deepExplain || q.explanation || ""`. An optional enrichment that
  degrades where it is used, not a promise broken elsewhere.
- **`source` and `review`** (the core validator) are clauses guarding fields the
  format cannot produce — dead validation rather than a dead feature.

So the class is closed: the two found were the only two.

### A note on the control
The new control first asserted the planted field was the **only** one caught. That
holds while everything else passes and goes quiet the moment the rule is
legitimately red — a control that stops reporting exactly when it is needed. It
asserts membership now.

## v2.55.0 — the shape of the study record (2026-09-13)

**No defect. Two gates over behaviour that is already right, and one of them was
vacuous until its own control caught it.**

### The study record has to stay small forever
This is a browser tool somebody uses every day for months before an exam, and the
whole study record lives in `localStorage` — a few megabytes the app cannot raise
and, when they run out, cannot write to. v2.41.0 added the banner that says so:
*"your answers are not being saved."* Nothing checked the thing that would make
that banner appear.

A year of daily study, driven through the real `NSTMastery` against the real bank
— 365 days × 40 answers, on a clock that advances a day at a time:

```
14600 answers over 365 simulated days against 255 questions
  day 1: 6.7 KB   day 30: 8.7 KB   day 180: 8.8 KB   day 365: 8.8 KB
```

Flat from the half-year mark, because the store keeps one row per **question** and
updates it. The negative control keeps one row per **answer** — the mistake this
exists to catch — and reaches **893 KB** over the same year, on its way to a wall
a daily user would hit in a few months.

So `scripts/storage-growth-test.mjs` (9 checks) pins the *shape*, not the size:
the store must plateau by day 180, fit in 64 KB, and stay proportional to the bank
rather than the answers. A future change that starts appending per answer fails all
three.

### Every state-changing route is defended, and the record says which way
The server has two defences against a hostile page posting as a signed-in user,
and they are not interchangeable: the session cookie is `HttpOnly; SameSite=Strict`,
so a cross-site request carries no session at all — and the forms additionally
carry a CSRF token. `/api/progress` relies on the first; every form route uses
both. Nothing checked which had which, so a new POST route could have neither and
look exactly like the ones that have both.

`server-test.mjs`, +4 checks (74 → 78): every `POST`/`PUT` branch must call
`csrfValid`, or appear on a list of SameSite-defended routes with a written reason,
and the premise that list rests on — the cookie really being `HttpOnly;
SameSite=Strict` — is asserted beside it.

### The control earned its keep
The first version scanned forty lines ahead of each route for `csrfValid`. A
deliberately undefended route planted immediately above `/logout` **passed**,
because `/logout`'s own `csrfValid` call sat inside that window. A fixed window is
a rule that reads its neighbour's homework. The scan now stops at the start of the
next route, and the same planted route is caught by name:

```
FAIL every state-changing route validates CSRF, or is listed as SameSite-defended
  -- /planted-route (line 346)
```

CI's Practice Exams job: 22 shared suites → 23.

## v2.54.0 — the final nobody could meet (2026-09-13)

Rung 30 of Who Wants to be a Nutanix Engineer has a special case. The first time
a player ever reaches the final, `pickExtremeFinal` reaches for a question the
bank has marked **impossible**:

```js
if (!reachedFinalBefore) {
  const imp = pick(bank.filter((q) => q.impossible));
  if (imp) return imp;
}
```

Nothing in the bank format could set that flag, and `toWWTBANE` carried none. So
`bank.filter(...)` was empty for every question the app has ever served, and that
branch had never run for anybody. **The same shape as the Steve clue in v2.52.0,
one level down** — a feature guarded on authored data, kept alive in code, cut off
from its only supply when the runtime bank engine landed.

### Fixed
`impossible: true` joins `priority: true` as a per-question field, carried through
to WWTBANE. StarNix and Practice Exams ignore it. An unmarked question carries no
flag at all rather than `false`, so `filter((q) => q.impossible)` stays honest.

### Verified
Three tests drive the real markdown → parser → adapter path into the real
`buildSet`:

```
✓ the first-ever final serves an impossible question when the bank marks one
✓ a returning finalist gets an ordinary extreme, not the impossible one again
✓ a bank marking nothing impossible still builds a final — the state the app ships in
```

Deleting the one line that carries the flag turns the first red. `adapter-test.mjs`,
+4 checks (62 → 66).

### And a correction to v2.53.0
The rescue converted 160 questions out of the old WWTBANE fixture and **silently
dropped the `impossible` flag on four of them** — there was no field to put it in,
and the converter said nothing about what it could not carry. `STOR-X-002`,
`AHV-X-001`, `NET-X-001` and `PERF-X-001` carry it again in
`banks/drafts/wwtbane-legacy.md`.

That draft now holds everything the fixture did that the format can express: 160
questions, 13 at the extreme tier, 61 Steve clues, 4 marked impossible. Publishing
it would give the ladder its first-timer final back.

## v2.53.0 — 160 questions nobody could answer (2026-09-13)

`wwtbane/src/content/questions.js` was a 309 KB compiled bank exported as
`QUESTIONS` and imported by **no application file** — only two tests. The app
loads `banks/*.md` at runtime. Matching its 233 questions against both published
banks:

```
duplicate  (Jaccard >= 0.80) :  66
borderline (0.55 - 0.80)     :   7   — same question, reworded
orphan     (< 0.55)          : 160
```

**160 questions, all `reviewStatus: verified`, all with references, spread across
twelve domains.** A finished set that no player has ever been able to reach —
including **13 at the extreme tier**, which the served bank has none of.

### The first count was wrong, and the metric is why
This started at 132. The first pass scored overlap as
`intersection / min(|a|, |b|)`, which saturates whenever one stem is much shorter
than the other — so a short bank question matched almost anything:

```
[0.60] DP-E-003
  wwt : which nutanix data protection feature delivers a zero rpo by synchronously…
  bank: which service controls all i o in the nutanix cluster
```

Twenty-eight questions were filed as "near matches" on pairings like that and
left behind. Proper Jaccard — over the **union** — puts them where they belong.
The seven that really are borderline were then read rather than thresholded, and
every one is the same question reworded.

### Rescued, not published
`banks/drafts/wwtbane-legacy.md` — the interchange format, in the one place banks
live. `drafts/` is deliberately absent from `banks/manifest.json`, so the launcher
offers nothing new; the content simply stops being stranded in a fixture.

```
node scripts/bank-test.mjs banks/drafts/wwtbane-legacy.md
BANKS: ALL GREEN (16 checks, 1 warning)
```

The warning is real and worth keeping in view: *the correct option is the longest
in 72% of single-answer items* — a craft tell in the rescued content, reported
because publishing it would ship that tell to players.

**61 carry a Steve clue, 48 of those on hard questions** — which is what v2.52.0's
format change was for. Publishing this bank is what would actually make Steve
talk, and what would give the ladder a real extreme final.

### The two tests were pointed at the wrong bank
`docs.test.mjs` asserted the README's "N-question bank" against the fixture, so it
enforced **233** into player-facing copy while players got **255** — a docs-drift
gate, green throughout, guarding the wrong number. `schema.test.mjs` validated the
fixture's structure, not the bank anyone receives. Both now read the served bank
through the real parser and adapter; the README says 255 questions across 9
domains.

### A near-miss worth recording
Re-pointed, `validateBank` rejected **all 255** — `bad id: "mci-security-q3p5"`,
`bad domain: architecture`. That is not a broken bank. `validateBank(qs, { runtime:
true })` is how `main.js` calls it: strict mode enforces WWTBANE's *own* authored
taxonomy — its id pattern, its twelve domain names — and a launcher bank is
authored to the NST schema instead. The test was asking the wrong question of a
healthy bank.

### What the right question found
The served bank has **no extreme tier**. Its questions are difficulty 2, 3 and 4;
`toWWTBANE` maps those to easy, medium and hard, and nothing to extreme. So the
"nearly impossible final" on rung 30 is an ordinary hard question, and
`q.impossible` — the first-time-you-reach-the-final special — can never fire,
because no bank field expresses it.

That is a property of the content, not a fault in the code: `pickExtremeFinal`
falls back through `|| pick(buckets.hard) || pick(bank)` on purpose. So the
assertion is the fallback itself, driven on the real bank — a full 30-rung run is
built and the final rung is a real, playable question. Asserting a tier the bank
does not have would fail for the wrong reason; asserting nothing would leave the
fallback untested.

### Still open
`wwtbane/scripts/import-questions.mjs` compiles to `src/content/questions.js`,
which no longer exists and nothing read. Its test drives it into a temp directory,
so it still passes. It, and the three parsers under `src/content/` that only it
uses, are the next cycle's question.

## v2.52.0 — Steve had nothing to sell (2026-09-13)

Who Wants to be a Nutanix Engineer has a green room. Steve is on the line, and for
4,000 coins he will teach you a hard question he knows is coming. `selection.js`
picks who he talks about:

```js
const withClue = hards.filter((q) => q.steveClue && !alreadyTaught.has(q.id));
return withClue[0] || null;
```

The comment above it explains why: *"Steve never sells a question he has nothing to
say about (the old fallback charged 4,000 coins and rendered an empty tip)."* Somebody
found that bug and fixed it properly — a clue has to be **authored**, or Steve stays
quiet.

Then the runtime bank engine landed, and the fix outlived its data. `shared/bank-parser.js`
had no notion of a clue; `toWWTBANE` carried none. Measured on the shipped bank:

```
toWWTBANE questions: 255
with steveClue     : 0
```

Zero. Not "few" — **none, and none possible**: no bank could express a clue, so the
filter emptied every set it was handed and the green room said "nothing new" forever.

### Fixed — the format can say it
`Clue:` joins `Explain:` and `Teach:` as a per-question field: a couple of sentences
that teach toward the answer without naming it, wrapping across lines like the others.
`toWWTBANE` carries it to `steveClue`. StarNix and Practice Exams ignore it — they have
no green room — and a question without one gets no `steveClue` at all rather than an
empty string, because an empty string is exactly what the 4,000-coin bug was made of.

### Verified — through the pipeline, not around it
`selection.test.mjs` already had a Steve test. It passed throughout, because it built
its questions with `makeBank()` and set `steveClue` by hand: **the fixture could express
something the pipeline could not.**

The new tests build a bank as markdown, run it through the real parser and the real
adapter, and hand the result to the real `SetManager`:

```
✓ Steve is reachable through the REAL bank pipeline, not just the fixture
✓ a bank with no authored clues leaves Steve with nothing — the state the app shipped in
```

Deleting the one line that carries the clue turns the first red and leaves the old
fixture test green — which is the whole point of adding it.

`adapter-test.mjs`, +6 checks (56 → 62): the clue parses, survives wrapping, does not
leak into the options, reaches WWTBANE, and does **not** reach StarNix.

### Not fixed here
The shipped NCP-MCI bank still carries no clues, so Steve is still quiet — the format
can now say it, and nobody has said it yet. Sixty-one authored clues do exist, in
`wwtbane/src/content/questions.js`: a 309 KB compiled bank the app never reads, holding
132 verified questions that appear in no bank at all. That is the next cycle's work.

`phoneHint` got no such field, deliberately. All 233 are authored, parsed by WWTBANE's
own markdown parser and validated by its schema — and **never rendered**: `phoneFriend`
picks an option algorithmically and the UI shows the pick. Giving a dead field a home in
the live format would just have made it dead in two places.

## v2.51.0 — one bank, one copy (2026-09-13)

StarNix carried its own copy of the question bank. `starnix_questions.md` (354 KB)
compiled by `import-questions.mjs` into `questions.js` (391 KB), and StarNix's
harnesses — `bank-lint`, `multi-answer-test`, a CI step called
`import-questions --check` — linted **that**, while the app served
`banks/ncp-mci/ncp-mci.md`. The drift guard compared the copy with its own source.
Nothing compared either with the bank anyone actually answers.

They matched. Measured, id by id:

```
starnix/questions.js : 255 questions
banks/ncp-mci.md     : 255 questions
ids only in one or the other         : 0
shared ids with different stem       : 0
shared ids with different options    : 0
shared ids with different explanation: 0
exhibit questions                    : 27 — with different alt text: 21
```

**Twenty-one.** v2.50.0 wrote those exhibit descriptions into the bank the day
before. The compiled copy kept the old ones, and three StarNix harnesses went on
linting text no player would ever see. That is what a duplicate does — not a loud
divergence, a quiet one, on exactly the part somebody just took the trouble to fix.

### Removed — the second copy and its toolchain
`questions.js`, `starnix_questions.md`, `questions_authoring.md`,
`starnix_briefing_scaffold.md`, `import-questions.mjs`. **972 KB.**

### Removed — `starnix/exhibit-images/`, 34 files, 3.2 MB
Twenty-seven are pre-WEBP originals of images that live in `banks/ncp-mci/images/`
now; seven are orphans referenced by no live question — `a4q50.png` among them,
which `build.mjs`'s own comment already named as dead weight.

The build read all 34 on every run and inlined **none**: it filtered them against a
reference set taken from `questions.js`, which stopped being built into the page when
StarNix became bank-agnostic. What shipped was `window.STARNIX_EXHIBITS = {}` — an
empty global no game, shell or page reads. Directory, global, filter and the
"Inlining exhibits…" boot step are all gone.

### The harnesses read the real bank now
`starnix/real-bank.mjs` loads `banks/ncp-mci/ncp-mci.md` the way the browser does —
real markdown, real parser, real StarNix adapter — for `bank-lint`,
`multi-answer-test` and `verify-build`. Which means those harnesses now also verify
the seam they depend on: a parser or adapter change that breaks StarNix's question
shape fails there instead of in somebody's browser.

`exhibit-check`'s third section asserted
`Object.keys(EXH).length === 0 || Object.values(EXH).every(isDataUri)` — true whether
the map is empty or full, a check with no failing case. It now asserts what the
machinery was for, with a control that fails.

### The rule that keeps it to one
`bank-test.mjs`, +4 checks (85 → 89). Twelve live question ids are taken from the
manifest's first bank and the repo is walked: a file outside `banks/` carrying three
or more of them is a second copy. The negative control reconstructs the deleted
`questions.js` and requires it to be caught — it reported ALL CLEAR on the first run,
because the probe directory was named with a leading dot and the walk skips those. A
control the rule cannot see proves nothing.

### Also
`harness-coverage.mjs` follows imports one hop (+2 checks, 25 → 27): a module
imported by a harness CI runs is covered by it, not dark. Before this, factoring
shared setup out of three harnesses into one module made the new module look like an
unrun suite, and the only way to quiet it was an exclusion saying "not run" about a
file that runs constantly.

CI's StarNix job: 20 runs → 19. Repo: **−4.2 MB**.

## v2.50.0 — alt text that says nothing is not alt text (2026-09-13)

The shipped NCP-MCI bank carries **27 exhibit questions**. Six of them had
authored alt text. The other twenty-one rendered this:

```html
<img alt="Exhibit for question mci-networking-5gfy">
```

That is Practice Exams' fallback — `q.imageAlt || ("Exhibit for question " + q.id)`
— and it is a fallback doing exactly what a fallback should: never shipping an
empty `alt`. Which is why nothing ever reported it. **axe is satisfied**: the
attribute is present and non-empty. The a11y audit is green. The rule it enforces
— *images have alt text* — was being met to the letter.

To someone using a screen reader, twenty-one questions asked about a picture and
then described it as "Exhibit for question mci-networking-5gfy". The questions are
not hard for them. They are **unanswerable**.

### Fixed — twenty-one descriptions, written from the images

Each one read, then described to carry what its question turns on. Not "a
screenshot of Prism" — the values:

> Terminal output of `manage_ovs show_uplinks` run on a CVM. Bridge: br0. Bond:
> br0-up. bond_mode: balance-tcp. interfaces: eth3 eth2 eth1 eth0. lacp: active.
> lacp-fallback: false. lacp_speed: fast.

> A Prism Charts view over a 3-hour range, 09:08 AM to 03:08 PM… Hypervisor CPU
> Ready Time stays between roughly 80% and 100% across the whole window, spiking
> to 100%, and currently reads 96%. Memory Usage currently reads 21.5%… Storage
> Controller IOPS currently reads 0 IOPS with three isolated one-IOPS spikes.

The bank now carries 27 `image:` lines and **27** `image-alt:` lines. Shortest
description 162 characters, median 372.

### Fixed — the rule that stops it coming back

`bank-test.mjs`, +7 checks (78 → 85). An exhibit whose alt is under sixty
characters fails, and so does one that merely names the question id or the file —
the two ways of writing alt text that technically has content.

Sixty characters will not stop someone determined to write "a screenshot", and it
is not meant to. It stops the three things that actually happened: the empty
string, the filename, and the generated fallback.

Five self-checks run the same rule over deliberately broken banks — no alt, a
one-word alt, a long alt that only names the question — and require each to be
caught, plus a real description that must pass and a question with no exhibit that
must not be asked for one. Stripping two real alt lines from the bank fails the
real run by name:

```
FAIL bank "ncp-mci" every exhibit carries alt text that describes it
  -- mci-security-q3p5 (0 chars), mci-performance-i0w8 (0 chars)
```

### Fixed — and it has to survive the trip

`adapter-test.mjs`, +3 checks (53 → 56). **Both** adapters substitute a generic
string when `imageAlt` is missing, so an adapter that silently dropped the authored
description would look exactly like a bank that never had one: present, plausible,
useless. The authored text is now pinned through both, with a control proving the
fallback appears only when nothing was written.

### Note on StarNix

StarNix never shows these. Its question provider filters every exhibit out of the
games — an arcade round cannot stop for a full-screen screenshot — and all three
games carry a guard for one that leaks anyway (checked in `verify-build` since
v2.49.0). This is Practice Exams' surface, and WWTBANE's if an exhibit ever
reaches it.

## v2.49.0 — the biggest dark suite in the repo (2026-09-13)

`starnix/verify-build.mjs` boots the **assembled `index.html`** in jsdom — the real
built shell, the real question bank, all three games flown for real frames — and
checks 557 things about the artefact that actually ships. Nothing else in the
repo does that.

It had not run since **d4892dd** removed the in-game exam. It crashed 23 checks
in, dereferencing a button that no longer existed:

```
✗ Menu#7: four launchable mission lines (ARM,CC,KBB,NIT)
VERIFY CRASHED: TypeError: Cannot read properties of null (reading 'dispatchEvent')
```

v2.42.0 catalogued it as *"stale, not wired — needs a deliberate pass by someone
who knows what those blocks were for."* This is that pass.

### What it found, in the app rather than in itself

**Two of the five asteroid sprites in the cold-open cinematic do not exist.**
`assets.js` carries `kbbAsteroid1..3`; the cinematic asked for five and indexed
`rng.next() * 5`, so **two of every five rocks** in the belt beat fell back to flat
polygons. Nothing crashed and nothing logged — the fallback did its job, which is
exactly why five releases went by. The rocks now index modulo the art that exists,
and the build no longer asks for art it does not have. The rule that catches the
whole class: *every art key the build asks for must be in the bundle.*

**Chasm Chase spawns an obstacle it never explains.** The how-to lists five rules;
the game spawns five obstacle kinds. They are not the same five — `OB_ROCKFALL`
lands in a lane and kills it outright, at any action, and was never mentioned. A
BOULDERS rule joins the list, and the check is now *"is every obstacle the game
can throw at you named before you meet it"* rather than a pinned count.

**Dead CSS**: four `.sx-strip-divider` rules styling an element nothing creates —
it divided the exam tile from the missions.

### What it found in itself

- **A check that measured a card in no box at all.** `mC.box =
  constants.MAX_BUCKET` — the core exports `MAX_BOX`. The undefined read set the
  box to `undefined`, so "a due correct at the cap" was never at the cap.
- **A determinism allowlist that counted comments.** `Math.random` mentions, not
  call sites, so documenting the rule turned the rule red. Counting call sites
  re-baselines the core from 1 to **0** and ARM from 4 to **3** — both tighter.
- **A sweep with a silent catch-all.** Every obstacle that was not a wall, arch or
  rockfall was measured against the LOW ROCK's rule: jump-clearable. The mine,
  added later, is not — it seals its lane, which is the point of it. Mines now have
  their own rule, and an unclassified obstacle type goes red instead of being
  folded into whichever branch is last.

### What was removed
~950 lines: the exam sections (`K`, `K2`, `B1/B2`), the post-sim report, the
exam-sim save/resume, the readiness/weakest-drill screen, the certification
finale, the "why I missed this" memos, the daily gauntlet, the domain lens. Every
one drove `exam.js`, which was deleted. They were not repairable — there is
nothing left to assert about.

Where something outlived the exam it was kept and re-pointed: the Codex heatmap,
the miss pile's pure logic, the Leitner ledger, the telemetry. And where a surface
went, the check became *"it really is gone, not half-wired"* — no orphan tile, no
unreachable achievement, no daily mission nobody can complete, no planner
recommending a sim that cannot be sat.

### Wired in
The bank is now supplied the way the browser supplies it — the real markdown, the
real parser, the real StarNix adapter, installed before the build's own scripts
run — so this harness also verifies the seam it depends on.

CI's StarNix job goes from 19 runs to 20. **557 checks, ~22 seconds.** Breaking
one on purpose exits 1, so the wiring is not decorative.

## v2.48.0 — "the server didn't answer" is not "you haven't picked a bank" (2026-09-13)

Every tool here loads its questions over the network at runtime: a manifest fetch,
then a bank markdown fetch. This app is hosted off a machine somebody copies files
onto, so either of those can fail for ordinary reasons — a renamed directory, a
half-finished copy, a bank the manifest lists whose file never made it.

The loader recorded one of the two failures (`manifestError`) and **the launcher was
the only screen that read it.** Nothing recorded a failed bank *file* at all. So all
three tools showed the screen they show when nobody has chosen a bank yet. Measured,
with the bank selected and its file returning 404:

```
practice exams   "Choose a question bank to begin."
                 "Select a question bank above, then start a practice test or exam."
wwtbane          "No question bank is loaded yet. Choose one in the Nutanix Study
                  Tool launcher (Settings -> Question bank), then come back to play."
starnix          (nothing — the title screen, with a Start button)
```

The launcher, meanwhile, said `Couldn't load this bank — check your connection and
re-select it.` So the advice was not just unhelpful. **It sent the player to a screen
that contradicted it**, and gave them nothing to press when they got there.

StarNix was the worst of the three, because it looked fine. It offered Start, played
the full intro cinematic, and only mentioned a missing bank if you then tried to
launch a mission — where it told you to go and pick the bank you had picked.

### Fixed — the loader keeps both failures
`loadError()` joins `manifestError()`: a failed bank-file fetch is recorded before it
is rethrown, and cleared on success. `load()` still rejects exactly as before, so
every existing caller is untouched; what is new is that a caller re-rendering *later*
can still find out why it has nothing.

### Fixed — all three tools say which it is, and offer a retry
```
Couldn't load this question bank — the file is missing, or the server didn't
answer. Check your connection, then try again.          [ Try again ]
```
Practice Exams renders it in the one place every path already ends (`showEntry`), so
boot, bank-switching and post-retry re-renders are all covered by one branch. WWTBANE
and StarNix reload. **StarNix now says it at boot**, before the cinematic: being told
after the intro that the questions never arrived is the wrong order.

### Verified, both directions
`scripts/bankfail-test.mjs` — 44 checks, and it owns its server so it can 404 one
resource at a time. Reverting the five source files and rebuilding StarNix turns
**26** of them red, quoting the old text back:

```
FAIL bankfile: wwtbane names the failure
  -- No question bank is loaded yet. Choose one in the Nutanix Study Tool
     launcher (Settings -> Question bank), then come back to play.
```

A retry that does not retry is the obvious way to pass this suite while fixing
nothing, so it is not taken on trust: the server is repaired **while the broken page
is still open**, the control is pressed, and the page has to come back with real
questions in it. Six checks, two failure modes x three tools.

The negative control is the other half. With nothing broken and no bank chosen, the
plain "pick a bank" state has to survive untouched — no failure claimed, no retry
offered, the launcher instruction still there. A fix that shouts "couldn't load the
question bank" at someone who simply has not chosen one has traded one wrong message
for another.

One page is covered differently and the suite says so: StarNix shows its "pick a
bank" screen only when you try to launch a mission, so the browser half can only
check that it does not cry failure, and the instruction that screen carries is
checked by reading the shell. A failed *fetch* is said at boot, and that the browser
half does see.

StarNix rebuilt at 2870.0 KB, well under the 4600 KB gate. CI browser job: nine
suites -> ten, with README and the knowledge base updated to match.

## v2.47.0 — Does the queue actually teach? (2026-09-13)

**No defect. It teaches, and now there is a number for it: 100.8x.**

`review-test.mjs` checked the due queue's **mechanics** — what counts as due,
what gets capped, what order things come back in, whether a barely-started bank
produces a 240-question "review" of material never seen. All necessary. None of
it asks the question a learner is actually relying on:

> If I keep getting a question wrong, does it come back more often than one I
> keep getting right?

That is the entire premise of spaced repetition and the reason this app schedules
anything at all. **A scheduler can satisfy every mechanical rule in that suite
and still present all 255 questions in a flat rotation** — every check green, and
the learner spending equal time on what they know and what they do not.

### Added — 10 checks in `review-test.mjs` (65 → 75)
A learner of *known* behaviour, studied over simulated weeks against the real
`NSTMastery` and the real `dueQueue`. Thirty cards in three profiles — ten always
answered wrong, ten always right, ten alternating — studied every thirty minutes
for twenty-one simulated days. The learner is perfectly consistent, which is not
realistic and is exactly what makes the result readable: any difference in
exposure is the scheduler's doing, not noise.

```
1008 sessions over 21 simulated days — exposures:
  always-wrong 10080,  mixed 2212,  always-right 100
  (100.8x more often wrong than right)
```

The cards you keep missing come back every single session. The ones you have
learned recede to a hundred sightings across three weeks. The half-right cards
land between the two, where they belong.

### The threshold is deliberately loose
The check requires **3x**, and the measured value is **100x**. A tight threshold
would break every time the interval ladder is retuned, which is a legitimate
thing to do; 3x is a floor that separates "the mechanism works" from "flat
rotation" and tolerates tuning. The actual ratio is printed on every run, pass or
fail, so a drop from 100x to 5x is visible in a CI log while still passing.

### Verified
The negative control models the failure this section exists for — a scheduler
that ignores correctness and rotates everything equally. It shows wrong and right
cards **exactly** as often as each other, and fails the ratio check. The
mechanism is checked too, so a failure is diagnosable rather than mysterious: the
always-wrong card sits in box 0 or 1, the always-right card has climbed to box 4
or above, and its interval is longer.

This is the same shape as the readiness calibration in v2.35.0, for the same
reason. **The machinery being right is not the same as the number meaning what it
says.**

## v2.46.0 — You had to publish a bank to check it (2026-09-13)

Seven more banks are planned, and the workflow for adding one had a hole in the
middle of it.

`bank-test.mjs` checks every bank `banks/manifest.json` lists. So to validate a
bank you are still writing, you first had to add it to the manifest — **the file
that decides what the live app offers people.** An unfinished bank had to be
published to be checked.

And it was not optional. One of the rules is *"every bank file on disk is listed
in the manifest"* — correct, because an unlisted bank is invisible to the app and
that is nearly always a mistake. But it means the moment you create
`banks/ncp-ai/ncp-ai.md`, CI goes red. Measured:

```
FAIL every bank file on disk is listed in the manifest  -- ncp-ai/ncp-ai.md
```

The only way back to green was to publish an unfinished bank.

### Added — `banks/drafts/`
A bank being written lives here until it is ready. Files here are exempt from
the orphan rule: not being in the manifest is the whole point of them. The full
run reports them as a warning naming the command to check each one, so a
forgotten draft is visible rather than silent.

### Added — a single-file mode
```bash
node scripts/bank-test.mjs banks/drafts/ncp-ai.md
```
Runs the content rules against one file and skips the manifest entirely: 15
checks — ids unique, every question answerable, answer keys in range, domains
declared, no option referred to by letter or position, images resolve.

It reuses **the same loop** as the real run rather than a copy, so a draft cannot
pass checks the published banks would fail. The manifest-shape rules, the
cross-bank id check and the linter's own self-checks are skipped, because none of
them mean anything for one unpublished file — and counting them would inflate a
draft's result with checks that have nothing to do with the draft.

### Verified
A deliberately broken draft is caught with the question and the line:

```
FAIL bank "broken.md" parses without errors
  -- b1@16: no correct option marked ([x]); domain 'not-a-declared-domain'
     not in the bank's domains list
FAIL bank "broken.md" never refers to an option by letter  -- b1:explanation
```

The normal run is unchanged at 78 checks, and a draft present no longer fails it.

### What a draft check cannot do, said in the README
**Question ids are global.** `NSTMastery` keys on the bare id with no bank
scoping, so two banks sharing an id share one record — answering a question in
one moves the other's box, counters and review date, and nothing reports it. Only
the full run sees across banks, so publishing still ends with `node
scripts/bank-test.mjs`.

## v2.45.0 — The seam between one bank format and three apps (2026-09-13)

**No defect.** Both adapters are correct. The finding is that nothing checked
them, and they sit exactly where nobody looks.

| side | coverage |
|---|---|
| `shared/bank-parser.js` | `bank-test.mjs`, 78 checks |
| WWTBANE's own format | 25 test files of its own |
| StarNix's own format | `bank-lint`, `multi-answer-test`, `shuffle-test`, … |
| **the conversion between them** | **nothing** |

`toStarNix` and `toWWTBANE` live in `shared/bank-loader.js`, and nothing
referenced either one except `starnix/build.mjs`. A field dropped or renamed in
the conversion is invisible to both sides: the parser still emits it, the game
still handles its own shape, and the value simply never arrives.

### The one that would matter most
The two adapters name the answer differently, and differently again by arity:

```
StarNix   single -> correctIndex (a number)      multi -> correctIndices (array)
WWTBANE   single -> type "single", answer [i]    multi -> type "multi", answer [..]
```

Four spellings of the same fact. Get one wrong and a game marks a different
option correct than the bank says — the worst defect available to a study tool,
because the learner is confidently taught the wrong answer and the shared
mastery store records it as settled.

### Added — `scripts/adapter-test.mjs` (53 checks), wired into CI
A synthetic bank exercising every field the parser can emit, run through both
real adapters — not a re-implementation, or the test and the runtime could
disagree about what the conversion means. Every field is checked into place, and
the deliberate divergences are pinned with their reasons:

- `priority` is `2` for StarNix and `true` for WWTBANE — different types on purpose.
- `teach` is **renamed** to `briefing` for StarNix and **dropped** for WWTBANE,
  which has no briefing surface. Pinned so nobody "fixes" it into existence.
- `image` is `{src, alt}` for WWTBANE and `image`/`imageSrc`/`imageAlt` for
  StarNix — and both must point at the same file.
- Difficulty is lossy on purpose: five authored tiers into StarNix's three, and
  into WWTBANE's named tiers.
- Every array is `.slice()`d. If one stopped, a game shuffling its own options
  would reorder the bank's, and the next app to read it would see the shuffled
  order with the original answer index — a wrong answer arriving only in
  whichever app happened to run second.

### A coupling worth knowing about
Both adapters read `q.imageSrc`, and **the parser never emits it.** It is added
by `load()`, which resolves the bank-relative filename against the bank file's
own URL. An adapter handed raw parser output produces a question whose image has
no source. Not a defect — nothing in the app calls an adapter that way — but an
undocumented dependency between two modules, found because this suite did
exactly that on its first run.

### Verified
Four controls against the real adapters, each naming the damage:

```
multi-answer given correctIndex     -> {"correctIndex":0}
WWTBANE answer index shifted by 1   -> points at "Cassandra", and ["They require LACP", null]
teach no longer renamed to briefing -> {}
options handed over uncopied        -> reversing StarNix's reversed the bank's
```

The second is the one the suite exists for: a one-place index shift, and the
game teaches the wrong answer.

### Three bugs in this suite, before the code
Its first run failed on a `document` shim without `getElementsByTagName`, then
on images (it skipped the `load()` step that creates `imageSrc`), then on option
notes (the syntax is `> text`, not `note:`). Each was caught because the failure
looked wrong for the change — and each is now either replicated properly or
documented as the coupling it revealed.

## v2.44.0 — Half of a success criterion (2026-09-13)

**No defect.** Every interactive control in this app conforms to WCAG 2.2
SC 2.5.8 on size alone. What was missing is that the audit could only ever have
found out one of the two ways.

`mobile-audit.mjs` checked target **size**: 24x24 to pass, 44x44 reported as an
advisory. But SC 2.5.8 is not "every target must be 24x24". It is: a target
under 24x24 is **still conformant** when a 24px-diameter circle centred on it
does not intersect the circle of any other target. Size and spacing are
alternatives, and only one of them was ever measured.

So a sub-24px control alone in a corner passes, two of them a few pixels apart
do not, and nothing here could tell those apart.

### Added — the spacing clause, and 2 self-checks (11 → 13 passing)
Targets under 24x24 are now checked for the criterion's own geometry: centres at
least 24px apart. Reported as a **problem**, not an advisory, and separately from
the size advisories — because the fix differs. Spacing is fixed with margin, size
with padding, and treating them as one thing produces the wrong change.

### The threshold is 24, not 44, and I got that wrong first
The first version used the 44px **AAA** size as its definition of "small" and
failed three screens:

```
kbb-battle       button.kbb-action (106x35) and button.kbb-action (106x35), 8px apart
kbb-battle       button.kbb-opt (334x42) and button.kbb-opt (334x42), 8px apart
cc-establishing  button.cc-key (56x56) and button.cc-intro-skip (78x36), 0px apart
```

Every one of those is a comfortable thumb target that conforms on size alone, and
the spacing clause has nothing to say about them. **A check that fails on correct
code is worse than no check** — the same conclusion that removed a static
reachability heuristic in v2.41.0. Caught because the "failures" were 35–56px
buttons, which are obviously not mis-tap risks.

### Verified
The corrected check finds nothing on the real screens, which is the right answer
and also indistinguishable from a check that cannot fire. So it plants two 18px
targets 10px apart and requires them to be reported, then moves them 40px apart
and requires it to go quiet — the rule is about clearance, not about being small.

### The 20 AAA advisories stand, and stay advisories
All of them are StarNix in-game controls, several carrying a deliberate
`min-height: 24px` and a comment naming SC 2.5.8 from an earlier cycle. They are
small on purpose — a replay-intro link, a skip, a coach dismiss — and pushing
them to 44px would make deliberately unobtrusive controls prominent. With the
spacing clause now measured, they are conformant rather than merely untested.

## v2.43.0 — Two guarantees nobody checked (2026-09-13)

Neither is a defect. Both are load-bearing lines that every existing test would
survive the deletion of.

## Part two — the line endings the next seven banks will have

`bank-parser.js` normalises CRLF and lone CR to LF before it splits lines:

```js
var text = String(md == null ? "" : md).replace(/\r\n?/g, "\n");
```

Every bank in this repository uses LF, so that line is load-bearing for exactly
**zero** of them today, and nothing checked it existed. It reads like a redundant
normalisation of the kind somebody tidies away.

**Seven more banks are planned, and they will be authored on Windows.** Measured
with the normalisation removed:

```
CRLF  ->  questions: []      the whole bank parses to NOTHING
CR    ->  questions: [], and empty metadata as well
```

`### w1\r` does not match the heading pattern, so no question is ever opened. The
file is not mangled — it is **invisible**: a bank that loads, reports no error,
and contains zero questions. Nothing about that looks like a line-ending problem,
which is why the new checks name the ending rather than the symptom.

I had predicted stray trailing characters in option text and domain names. The
control showed total silent failure instead, and the suite's header now says
what was measured rather than what I guessed.

### Added — 23 checks in `bank-test.mjs` (55 → 78)
CRLF, lone CR, and a mixed file must each parse **identically to the LF
control** — same questions, same metadata — and no carriage return may survive
into an id, a stem, a domain, an option, an explanation, or the declared domain
list. Each of those is named separately because a stray `\r` in a domain makes it
miss the declared list, and in an id makes it miss the mastery store.

### Verified
Removing the normalisation from the real parser fails 3 checks, reporting the
empty question list. The self-check confirms that splitting CRLF on `\n` alone
really does leave `\r` behind — without which the whole section would prove
nothing.

---

## Part one — the audit log nobody checked was written


**No defect.** The audit log is complete: 17 action types covering every
privileged operation on this server. This is the gate.

`pages-test.mjs` proves the audit table **escapes** what it renders — a display
name of `<img src=x onerror=...>` comes back as text. Nothing proved anything is
ever **put in it**.

That matters more than it sounds. The admin page is the only record of who did
what to whose account, and every one of those actions is one forgotten
`DB.audit()` away from leaving no trace: the action still succeeds, the page
still says *"X is disabled and signed out"*, and the log is silent about it.
Nobody discovers that until they go looking for a record that was never
written — which is exactly when they need it.

### Added — 17 checks in `session-test.mjs` (30 → 47)

Two halves, because they fail differently:

- **Behavioural.** Each admin action is performed against the real server and
  the real `/admin` page is read back. The row must appear, and it must name
  **both** the administrator who did it and the account it was done to — a log
  that records the verb but not the target is not a record.
- **Static.** Every `case` in the admin switch must call `DB.audit()`. A *new*
  action added without one is the regression that actually happens, and the
  behavioural half cannot see an action it does not know to perform.

### On what is deliberately not audited
`putProgress` — the routine progress sync — writes no audit row, and should not.
It fires constantly during ordinary study; auditing it would bury the seventeen
entries that matter under thousands that do not. The log is a record of
privileged acts, not a write-ahead log.

### Verified
Removing `DB.audit()` from the `enable` branch of the real server fails **four**
checks: the behavioural one reports `0 -> 0` rows, the two identity checks report
an empty set, and the static one names `enable` with "succeeds and leaves no
record of who did it". Restored, all 47 pass.

The control asserts its own replacement count before the suite runs. An earlier
control in this session silently matched nothing and reported ALL GREEN, which
looks identical to a passing control and proves exactly as much as not running
one.

## v2.42.0 — The CI section described a workflow that no longer exists (2026-09-13)

`docs/NST_KNOWLEDGE_BASE.md` §8 "Testing & CI" had drifted into fiction, and the
README with it. Found by checking my own work from earlier the same day.

| the document said | the workflow does |
|---|---|
| four jobs, **three** dependency-free | four jobs, **two** |
| the browser job is "the repo's **only** `npm install`" | there are **two** |
| the browser job runs **six** suites | **nine** |
| the StarNix job runs **six** harnesses | **nineteen** |
| the Practice Exams job runs ~12 named suites | **22** |
| `a11y-browser` is "14, painted-background contrast" | 62 checks, and far more than contrast |
| README: "**Six** further suites need a real browser" | **nine** |

Some of that rot was months old. Some of it was **hours** old: v2.40.0 added the
jsdom install and six StarNix game suites and never came back to this file, and
v2.41.0 added `dialog-test` and `resume-test` coverage without updating the
counts. A document that is wrong about the thing it exists to explain is worse
than no document — a reader goes looking for coverage that is not there, or
trusts a guarantee that was withdrawn.

### Fixed
Both documents rewritten from `ci.yml` rather than edited by eye: the real job
count, which jobs install what and why, the full suite lists, and the two
harnesses (`kbb-draw`, `perf-smoke`) that are deliberately **not** wired, named
with their reasons so their absence reads as a decision.

### Added — 14 checks in `docs-test.mjs` (24 → 38)
This is the same failure the suite already existed for — "documentation that
describes a repository it no longer has" — so it is checked the same way. The
architecture tree is checked against the filesystem; the CI section is now
checked against `ci.yml`:

- the stated job count matches;
- the stated dependency-free count matches;
- no document calls any job the repo's *only* `npm install`;
- **every suite either document names is one CI actually runs** — a phantom suite
  is how a reader goes looking for coverage that does not exist;
- the two named as deliberately unwired really are unwired;
- the README's browser-suite count matches the browser job.

The prose is *not* required to enumerate every suite — forcing that would make
the document a worse read and the check a nuisance. Only what it does say has to
be true.

### Verified
Four controls on the knowledge base and two on the README, each naming the exact
discrepancy: claiming three dependency-free jobs fails with "doc says three,
ci.yml has 2"; claiming five jobs fails with the count; renaming a real suite to
a phantom one fails naming it; and the README saying "Six" fails with "README
says Six, the job runs 9".

The control that matters most runs the other way round. **Removing the jsdom
install from `ci.yml`** — the workflow changing under a correct document — fails
with "doc says two, ci.yml has 3". **Removing `dialog-test` from the browser
job** fails twice, once as a phantom suite and once on the count. These checks
catch drift from either side, which is the only way they are worth having.

## v2.41.0 — The sync warning lived on the page you are not on (2026-09-13)

`NSTSync` fires `nst-sync-status` once a push has failed three times running.
The launcher listened for it and showed a "Not saving" chip. **Practice Exams
and WWTBANE both load `nst-sync.js` — so sync runs, and can fail, on both — and
listened for nothing.**

That is the worst possible place for the warning to be missing. The launcher is
the page you are *not* on while you are studying. A 90-minute exam or a long
WWTBANE run is exactly the stretch during which an hour of work can quietly fail
to reach an account, and you would find out on the next device.

Practice Exams already had the machinery and the argument. `watchStorage()` puts
a banner above `#pe-root` for storage failures, and the comment above it says:
*"someone mid-exam should not have to notice a small badge to learn that the
last forty minutes will not survive closing the tab."* The same reasoning, the
same page, a different failure — and it was never wired.

### And then the same gap, one event over
Writing the rule for the *class* rather than the instance found a second one
immediately. `nst-mastery.js` fires `nst-storage-status`, all three pages load
it, and **WWTBANE listened for that one either**.

That is the worse of the two. Sync failing means the work is safe here and has
not left yet. Storage failing means it is not being written **anywhere** — the
run dies with the tab, and so does the copy sync would have pushed, because sync
builds its envelope from the same storage that is refusing. WWTBANE was missing
both warnings; this was the louder one.

### Fixed
- **Practice Exams** gains `watchSync()`, a banner above `#pe-root` (never
  inside it — every mode replaces the contents of that element).
- **WWTBANE** gains `_watchSync()` **and `_watchStorage()`**, fixed banners
  appended to `<body>` rather than into `#screen`, which is redrawn on every
  question and would wipe them. Both mirror into the game's existing `aria-live`
  region, since WWTBANE is played from the keyboard. When both are showing the
  sync banner steps up so neither is hidden, and the storage one sits on top —
  if you can only read one, it should be that.

Both are **amber, not red, and `role="status"`, not `role="alert"`.** The
launcher already draws this distinction carefully and the new banners keep it:
storage failing means nothing is written anywhere and the work dies with the
tab; sync failing means the work is safe in this browser and merely has not left
yet. Saying the second in the words of the first teaches people to ignore the
first.

### Added
- **27 checks in `sync-test.mjs` (40 → 67)** — the rule is about the class, not
  the instance, and covers **both** events: a page that loads `nst-sync.js` must
  listen for `nst-sync-status`, and one that loads `nst-mastery.js` must listen
  for `nst-storage-status`. A fourth page is covered the day it is added. Plus
  the wording and severity split, checked in both directions.
- **30 checks in `a11y-browser.mjs` (32 → 62)** — both real events fired in the
  real page. A healthy session shows nothing; a failing push raises a *visible*
  `role="status"` banner carrying the reason; a storage failure raises a
  *visible* `role="alert"` one that never claims the work is safe; and both
  **go away when the failure clears**.

### Also: the expired-exam card, opened for the first time
Unrelated to the warnings, found while looking for other things nobody was
watching. `resume-test.mjs` checks the wording of the card you get when a timed
exam's clock ran out while you were away — that it appears, that it does not say
"Resume", that it explains why — and **never clicked it**.

The card's whole promise is one sentence: *"Open it to see how the N you
answered scored."* A resume that threw, hung, or landed on a blank screen would
have left every one of those checks green: the exam gone, the offer to see it a
lie, and the suite reporting ALL GREEN.

The path is subtle enough to be worth walking. Resuming rebuilds the sitting and
starts the timer; `startTimer()` calls `tick()` immediately rather than waiting a
second; the deadline is already behind; and that first tick auto-submits. Four
things in a row, none of them obvious from the card.

**It works.** 6 checks in `resume-test.mjs` (44 → 50) now open it: no page
error, not left on the card or a blank screen, lands on a result carrying a
score, says "Time expired" so the score is not mistaken for a full sitting, and
**clears the saved record** — without which the same finished exam would be
offered again on every visit, forever.

### The third event, and why it is not covered
`nst-sync.js` also fires `nst-account`, and only the launcher listens. That is a
deliberate difference rather than the same gap a third time: the two events
above are **failure notifications**, and missing one means a failure nobody is
told about. `nst-account` is informational — it names the account, it does not
report anything going wrong — so a page that does not show it loses a label
rather than a warning. Written down in the suite so the rule is not extended by
rote, and so the reason is visible if `nst-account` ever starts carrying a
failure.

### Why both halves
The static rule stops at "listens at all", and that limit is stated rather than
papered over. Deleting the `watchSync()` call from Practice Exams' `boot()`
leaves the `addEventListener` in a function nothing invokes — the page goes deaf
and the static check stays green. Measured: that control failed **three** checks
in `a11y-browser.mjs` and **none** in `sync-test.mjs`.

An approximation of static reachability was tried first. It caught the Practice
Exams case and then reported the launcher (registers inline) and WWTBANE (a
class method called as `this._watchSync()`) as deaf when both work. A check that
fails on correct code is worse than one with a stated limit, so "is it wired"
belongs to the browser half.

### Verified
Removing the Practice Exams listener fails 3 browser checks. Moving WWTBANE's
banner into the screen it redraws fails the placement check. Both banners were
confirmed by hand in a browser before the checks were written: absent while
healthy, visible and in-viewport on failure with the reason attached, gone on
recovery.

One check had to be corrected rather than the code: it asserted the reason
appears in `textContent`, which the launcher's nav chip does not do — it reads
"Not saving" with the detail in its `title` and `aria-label`, a deliberate
choice for a tight nav bar that still reaches a screen reader. The rule is now
that the reason is **reachable**, not that it sits in one particular attribute.

## v2.40.0 — 448 checks that had never run once (2026-09-13)

StarNix is the largest app in this repo — 2.9 MB, three games. **The primary
test suite for every one of those games had never been executed by CI.** Not
once. They were written, they passed, and nothing invoked them.

| harness | what it covers | checks |
|---|---|---|
| `arm-run.cjs` | a scripted ARM flight run | **163** |
| `cc-run.cjs` | Chasm Chase | **124** |
| `kbb-run.cjs` | Kuiper Belt Battle | **156** |
| `cc-death-paths.cjs` | every way a CC run can end | 5 |
| `kbb-fuzz.cjs` | KBB invariants under randomised input | — |
| `arm-fuzz.cjs` | the ARM flight engine under random **frame times** | — |

All six pass. Nothing is fixed here — this is 448 checks of existing, working
coverage being connected to the thing that was supposed to be running it.

### They were not forgotten — they needed a dependency
The first attempt at this release wired them and CI went red:
`Cannot find module 'jsdom'`. These harnesses eval the game sources inside a
jsdom window, and the StarNix job installs nothing.

`starnix/package.json`'s own `npm run check` script has listed most of them all
along. `ci.yml` hand-duplicated part of that list and dropped **exactly the ones
with a dependency** — which is a much better explanation than an oversight, and
the one this release now records.

So the job installs `jsdom@29.1.1`, the same dev-tooling pattern the browser job
already uses for Playwright. The app itself stays dependency-free.

**Into `starnix/`, not the workspace root** — and that is not a detail. Most of
these harnesses require jsdom by bare name, which resolves from anywhere up the
tree. `cc-death-paths.cjs` requires it by **absolute path**,
`require(__dirname + '/node_modules/jsdom')`, which exactly one directory
satisfies. A root install passed the bare-name check and then failed on that one
file — the second red CI run of this release. The step now verifies **both**
forms, because the check that only tested the bare one is what let it through.

**Not `canvas`.** `starnix/package.json` also declares `canvas@^3` — jsdom's
native rendering backend — but measurement says only one suite needs it: with
canvas removed, `arm-run`, `cc-run`, `kbb-run`, `cc-death-paths` and both
fuzzers still pass, and **`kbb-draw.cjs` fails 6 of its 16 checks**. It really
does exercise real rendering. A native build in the everyday gate to buy one
suite is a bad trade, so `kbb-draw` is excluded and named, with the measurement
in its reason.

`arm-fuzz.cjs` is worth singling out: it is the only harness anywhere in this
repo that feeds an engine **random frame times**, which is what a throttled or
backgrounded phone actually produces, and ARM is the one engine that had never
been fuzzed. Its own header calls it "a harness rather than a CI gate" because
the default 20 runs take ~90s. Six runs take ~50s and still exercise deaths,
extracts and sector advances, so it is wired at `ARM_FUZZ_RUNS=6`.

### A CI step that tested air
`node perf-smoke.mjs` **was** a step in the StarNix job. It exits 0 without
running anything unless `PERF=1` is set — which CI never set — in a job with no
browser for it to use, so it could not have run even if the flag were there.
Every build reported that step green.

It is removed rather than fixed. Making it real would put frame-timing
assertions in the everyday gate, which is a flake source; it stays what its
author intended, an opt-in pre-release tool (`cd starnix && PERF=1 node
perf-smoke.mjs`). A step that prints "skipped" while the job reports success is
worse than no step.

### A verifier that has been wrong for months
`starnix/verify-build.mjs` is a ~400-line build verifier. Nothing runs it, and
it has been stale since commit `d4892dd` removed the NIT in-game exam entirely.
It asserts four mission lines (`ARM,CC,KBB,NIT`) where the shell renders three,
fails that check and the finale-reveal check, then **crashes** dereferencing the
NIT button that no longer exists.

It is **not** wired and **not** deleted. Its NIT assumptions run through several
blocks between lines ~154 and ~410, and quietly deleting a verifier — or
guess-editing one — is how coverage disappears. It is named in the exclusion
list with exactly what is wrong with it, so it is now dark *on purpose* rather
than by accident, and the next person to open it knows what they are looking at.

### Added — `scripts/harness-coverage.mjs` (22 checks)
The common cause was not any of those files. It is that **nothing compared what
exists on disk with what CI invokes.**

Exhaustive classification, deliberately not a heuristic: every `.mjs`/`.cjs`
under `starnix/`, `scripts/`, `practice-exams/` and `wwtbane/tests/` must be
either invoked by `ci.yml` or listed in `EXCLUDED` with a reason. A file that is
neither fails the build and has to be classified by a person — there is no
"looks like a library" guess to be wrong about. Exclusions are checked back:
each needs a real reason, must name a file that exists, and must not contradict
`ci.yml` by naming something it runs.

### Verified
The decisive check replays the **pre-v2.40.0 workflow** through the same rule
and requires it to report exactly the six dark suites. It does. Removing any
one suite from `ci.yml` brings it back as unclassified.

Two bugs in this suite were caught by its own checks before it shipped. The
workflow comments name commands in prose — "run it before a release: `PERF=1
node perf-smoke.mjs`" — and the first parse read those as invocations, so it
concluded CI runs a step that had just been removed. Comments are stripped
first now, and a check asserts it. The second: the self-check's copy of the rule
omitted the `node --test tests/*.test.mjs` glob exemption and reported all 25
WWTBANE test files as dark, which they never were.

## v2.39.0 — The guard that turned out not to be the guard (2026-09-13)

**No defect. The interesting part is what breaking it on purpose showed.**

Every path into the browser stores parses JSON with a reviver that drops
`__proto__` — `nst-mastery` does it three times, `nst-backup` twice. The account
**sync pull is the one that cannot**: it reads the body with `r.json()`, and
`Response.json()` takes no reviver. The poisoned object arrives fully formed.

The obvious story is that this line is the guard:

```js
B.restore(JSON.stringify(res.data), { mode: mode })
```

Sync re-serialises the object it just parsed and hands the **string** to
`NSTBackup.restore`, which parses it again with the reviver. A round trip
through JSON for data that is already an object — exactly the kind of thing
somebody tidies up.

That story is wrong, and the checks said so:

| control | result |
|---|---|
| reviver deleted from `inspect()` | **nothing polluted** |
| `isOwned` / typeof-string filter deleted as well | **nothing polluted** |

The path is safe **structurally**. `JSON.parse` creates `__proto__` as an own
*data* property and never invokes the setter, and the only assignment target is
a fresh local object whose prototype nothing reads back. Both merge paths —
`NSTMastery.mergeSerialized` and `mergeAttempts` — parse with their own revivers
on top, and `mergeAttempts`' dedupe key is a `join("|")`, so it can never spell
`__proto__`.

### Added — 10 checks in `sync-test.mjs` (30 → 40)

Labelled by whether they can actually fail, because a suite that cannot fail is
worse than no suite:

- **`BITES:`** — the pull hands `restore` a string; `nst-backup.inspect` really
  does parse with the reviver; `Object.assign` on the same payload really does
  move `__proto__` onto the copy (which is what the round trip avoids). Deleting
  the reviver fails one of these.
- **`net (cannot currently fail):`** — the three prototype checks. They pass with
  every guard removed, because there is nothing here to pollute. They are a net
  for a future change — an unsafe recursive merge, a `restoreObject()` that
  skips the round trip — **not** evidence that today's guards work.

### This is the third suite today to pass for the wrong reason
The first version ran its checks synchronously after calling `pull()`, which
returns a promise — the restore had not happened yet. Fixed by awaiting it. The
second then reported `ok: false, "That file isn't an NST backup."`: the payload
was never a valid envelope, so the restore rejected it and the pollution checks
were green over nothing.

Both were caught by the same addition: a check that the operation **actually
did something** — `out.ok === true`, `restored >= 1`, and the key present in
storage — placed before any check that asks whether something bad happened.

### Threat model, stated plainly
The blob comes back from the same account that wrote it, so the ordinary case is
someone poisoning their own browser. It is worth checking because the server is
not the only writer: the blob is text in SQLite, is restored from backup files,
and on this deployment the database sits on a VM.

## v2.38.0 — You could read the warning, but only with a mouse (2026-09-13)

v2.37.0 made the clipped text in a confirm dialog reachable by giving it a
scrolling body. It was reachable **by wheel**. It was not reachable at all from
a keyboard.

A scrolling container with no focusable content inside it cannot be scrolled
with a keyboard. Chrome does not put such a container in the tab order, so
there is no way to give it focus and therefore no way to send it an arrow key.
The text past the fold is mouse-only. Firefox makes scrollable regions focusable
on its own; Chrome does not, and Chrome is what this is served to.

Measured on the real pages, after v2.37.0:

| dialog | window | clipped | focusable children | Tab reaches the body |
|---|---|---|---|---|
| Reset confirm | 320x240 larger text | 152px | 0 | **no** |
| Help | 900x520 | 232px | 0 | **no** |
| Settings | 900x300 | 1190px | 14 | n/a — its controls scroll it |

**Help fails at 900x520**, which is an ordinary window, not a contrived one.
That one is not a v2.37.0 regression — Help has had a `.nst-modal-body` since it
was written, and its content has always been nothing but text. Nothing looked
for it.

Settings escapes by accident: it has fourteen controls, and tabbing through them
scrolls the container for free.

### Fixed
- **A scrolling body with nothing focusable in it becomes a tab stop** —
  `tabindex="0"`, `role="group"`, and an `aria-label` built from the dialog's
  title, applied in `openDialog` so every dialog is covered, including ones
  added later.

  Only when it overflows. An unconditional tab stop would be a dead landing spot
  on every dialog that fits, for every keyboard user, to serve the case where it
  does not. Re-checked on `resize`, because whether a dialog overflows is a
  property of the window rather than of the dialog; the listener is released
  when the last dialog closes.
- **A focus ring on that landing spot** (`2px solid var(--purple-light)`, inset
  because the body is flush with the panel edge). A tab stop with no visible
  ring is a place the keyboard silently lands.
- **The focus traps in the confirm and Help dialogs now use a real focusable
  selector** instead of `querySelectorAll("button")`. That was right only while
  those dialogs contained nothing but buttons — the moment the body became
  focusable, Tab would have skipped it on the wrap. Settings already did this
  correctly; now there is one definition of it.

### Added
- **21 more checks in `dialog-test.mjs` (62 → 83).** Every scrolling element in
  every dialog, at every size, must either contain something focusable or be
  focusable itself. Plus a real Tab walk on the worst case — ten actual `Tab`
  presses, because `:focus-visible` and the tab order are both modality-
  dependent and a probe that calls `focus()` has been wrong about this repo
  before — a check that the landing spot has a visible ring, a check that an
  arrow key on it actually moves `scrollTop`, and a check that Settings gains
  **no** extra tab stop.

### Nowhere else has it
- **18 checks in `a11y-browser.mjs` (14 → 32)** sweep the main screen of all
  four apps at four window sizes for the same thing: a container that scrolls
  with nothing focusable inside it. **All sixteen are clean.**

Sixteen clean results prove nothing on their own — a selector with a typo in it
is clean everywhere — so the sweep plants a text-only scroller and requires the
same code to find it, then adds a button to it and requires the report to clear.
The rule is about keyboard reach, not about scrolling.

The one near-miss worth recording: `.nst-diag-json`, the dev-mode diagnostics
`<pre>`, has `max-height: 180px` and `overflow-x: auto`, which makes
`overflow-y` compute to `auto` as well — a text-only scroller by construction.
Measured with dev mode on, it does not overflow: the prefs object is about nine
lines against a 180px cap. Not a defect today; it would become one if prefs grew,
and the sweep now watches it.

### Verified
Disabling `syncScrollFocus` fails 8 checks: five per-size keyboard-reach checks
across Help and the reset confirm, the Tab walk (which reports the tab order it
actually saw — ten presses, all buttons), the ring, and the arrow key. The
scroll checks stay green throughout, so the two halves are independent. Removing
just the focus ring fails exactly one check.

## v2.37.0 — A confirm dialog that hid what it was confirming (2026-09-13)

`.nst-modal` is capped at the viewport height and is `overflow: hidden`. That is
correct only because a child carries the scrolling: the stylesheet gives
`.nst-modal > .nst-modal-body` `overflow-y: auto`, so a tall dialog scrolls its
prose while the title and buttons stay put.

Settings and Help are built that way. **The two confirm dialogs were not** —
they appended their paragraphs straight to `.nst-modal`, with no
`.nst-modal-body` anywhere. Nothing in them could scroll, so once the window got
short the text was clipped by the cap and there was no way to reach it.

Measured on the real page, before the fix:

| window | content | box | scrollable |
|---|---|---|---|
| 480x280 larger text | 248px | 230px | nothing |
| 390x260 larger text | 292px | 210px | nothing |
| 320x240 larger text | 342px | 190px | nothing — **152px unreachable** |

The dialog is **"Reset all saved data?"**, and the clipped sentence is the one
naming what is about to be permanently destroyed: NST preferences, Practice
Exams attempt history, and WWTBANE/StarNix progress.

The buttons stayed visible — the flex column shrank the prose rather than the
button row — so this did not look broken. It looked like a working dialog, with
the warning cut out of it and a "Reset everything" button under it.

### The accessibility setting was what triggered it
Larger text moves the threshold from a window under 264px tall to one under
about 340px. The preference that exists to make the text readable is what made
it unreachable.

### Fixed
- **`confirmReset` and `confirmRestore` wrap their prose in `.nst-modal-body`**,
  the same structure Settings and Help already use. `confirmRestore` needed it
  more: two paragraphs, one of them a variable-length list of what the backup
  file contains.
- **`.nst-modal-sm > .nst-modal-body { padding: 0 }`** — a small dialog pads
  itself, and 24px of panel plus 24px of body is a 48px gutter on a 420px panel.
- **The title and action row are pinned** (`flex: 0 0 auto`). Without that the
  flex column shrinks every child to fit, squashing the buttons instead of
  letting the body scroll — and on a destructive confirm the buttons are the
  last thing that should be compressed.

After the fix, every one of those windows reports the content reachable by
scrolling, and the roomy windows gain no scrollbar they do not need.

### Added
- **`scripts/dialog-test.mjs` (62 checks)**, wired into CI. A sweep, not a list:
  every dialog the launcher can open, at seven window sizes, must satisfy one
  rule — if the panel's content is taller than its box, something inside it must
  actually scroll. Buttons must also stay above 24px and inside the panel.

  Two details keep the sweep honest. The nav drops the Help button on a narrow
  viewport, so a dialog can be unreachable at a size; that is reported as `n/a`
  rather than passed, and a separate check requires each dialog to have been
  measured on a short window at least once — otherwise a hidden trigger would
  quietly empty the coverage. And because `confirmRestore` only appears after
  somebody picks a real backup file, a static rule reads the source and forbids
  appending body text directly to a `.nst-modal`, which catches the dialog the
  browser half can never open.

### Verified
The sweep re-parents the reset confirm's paragraphs back onto the modal — the
exact pre-fix structure — and requires the rule to fail at 320x240 and 480x280,
the sizes where it really did clip, and to still pass at 1280x900 where there is
nothing to hide. The static rule is checked the same way against a planted
regression.

## Also in v2.37.0 — what happens to a browser that is already signed in

`server-test.mjs` is thorough about **who may sign in**. It had exactly one
check on the other side of that question — "a disabled account cannot sign in" —
and that is the login path. Nothing tested the path that matters when something
has gone wrong: somebody is signed in **right now**, holding a valid cookie, and
an administrator has just decided they should not be.

Five actions are supposed to end that session immediately. **All five are
correct.** Nothing is fixed here. But writing the suite and then breaking the
server on purpose showed the reasons are not the ones the code reads as though
they are:

| action | what actually cuts it |
|---|---|
| admin disables the account | `currentUser`'s `user.disabled` check — **and** the DELETE inside `setDisabled`, independently |
| admin deletes the account | `currentUser`'s `!user` check. **Not** the cascade |
| admin resets the password | `deleteUserSessions` — nothing else |
| person changes own password | `deleteUserSessions` — nothing else |
| admin demotes a root | nothing, and nothing needs to: the role is re-read per request |

One function carries three of the five: `currentUser`, doing a `getUserById` and
two null checks that read as ordinary defensiveness. Turning `PRAGMA
foreign_keys` **OFF** leaves the session rows behind and the holder is *still*
signed out. The cascade and the `DELETE` inside `setDisabled` are hygiene.

### Added
- **`scripts/session-test.mjs` (30 checks)**, wired into CI. Spawns a real
  server on a throwaway database, signs accounts in for real, and checks each
  revocation against a live cookie.

### This suite lied to me twice before it worked
Worth writing down, because both are the same mistake in different clothes.

Its first run reported all five revocations green **while the accounts had never
been signed in at all** — signing up redirects to `/login` rather than creating
a session. The precondition check on each case ("starts signed in") is what
caught that, and is why it stays.

Its second lied the other way. Deleting `deleteUserSessions` from the admin
reset left the suite **ALL GREEN**: an admin reset also sets `must_change`, and
a `must_change` session answers 403 on `/api/me`. The probe read 403 as "signed
out" when it means "signed in but confined". Hence `signedInState`, which
returns `in` / `confined` / `out` and distinguishes a session that is gone from
one that is merely held.

### Verified
Each guard was deleted in turn and the suite re-run: the admin reset losing its
revocation fails 3 checks, the self-change losing its revocation fails 2 (the
other browser reads `in`), `currentUser` no longer re-reading the user row fails
5 including a demoted session opening `/admin` with a 200, and `foreign_keys
OFF` fails only the hygiene check, exactly as labelled. Removing **either** of
the two disable defences alone is invisible to a request — removing both flips
the behavioural check to `in`.


## v2.36.0 — Ten scripts, one at a time (2026-09-13)

Every `<script src>` on the launcher and Practice Exams was a plain blocking
tag. A classic script with no `defer` stops the parser dead: nothing after it is
parsed, nothing paints, and **the next script is not even requested** until this
one has arrived and run. Ten tags is ten round trips, end to end.

Measured over HTTP on a throttled 60ms link, median of five runs:

| page | DOMContentLoaded | first paint | script concurrency |
|---|---|---|---|
| launcher | 1004ms → **586ms** (−42%) | never → **316ms** | 1.08x → 4.38x |
| Practice Exams | 1399ms → **595ms** (−57%) | n/a | 0.90x → 5.38x |
| WWTBANE | 923ms → **844ms** (−9%) | n/a | 6.47x → 7.57x |

A concurrency of 1.08x means one file at a time. The launcher's waterfall was a
perfect staircase — each tag started within 2ms of its predecessor finishing —
and 938ms of its 1004ms was spent in it.

**The launcher painted nothing at all until the whole chain had run.** The tags
sit in `<head>`, and a blocking script there holds back first paint as surely as
a stylesheet does. On that link a visitor watched a blank page for a full second,
then got the whole thing at once.

### Changed
- **`defer` on every classic script tag** in `index.html`,
  `practice-exams/index.html` and `wwtbane/index.html` — 29 tags.

`defer` is the right tool rather than `async` because deferred scripts still
execute in **document order**. Every contract these files depend on — the parser
defining `NSTBankParser` before the loader runs, the mastery store existing
before sync flushes it, `engine.js` before `app.js` — holds unchanged. Only the
fetching became parallel. `async` would have broken all of them, intermittently,
on somebody else's connection.

WWTBANE gains least because most of its 29 scripts are ES modules, which the
spec already defers; only five classic tags were blocking there.

### One script still blocks, on purpose
`shared/nst-prefs.js` sets the accessibility classes on `<html>` synchronously at
load — reduced motion, high contrast, larger text. Deferred, it would run after
the parser is done, and somebody who needs high contrast could watch the page
paint in the ordinary palette and then jump. A flash of the wrong contrast is a
worse bug than a 60ms round trip. It is 1,981 bytes.

### Added
- **`scripts/load-test.mjs` (26 checks)**, wired into CI. Every classic script
  tag must carry `defer`; nothing may be `async`; the tag order must satisfy the
  dependency pairs; a module entry must come after the classic globals it needs;
  and the one blocking script has to earn the exception — the suite reads
  `nst-prefs.js` and requires it to actually touch `document.documentElement` at
  load, so `MAY_BLOCK` cannot become a place to park a tag nobody wanted to think
  about.

This is a gate rather than a note because `defer` is one word. Deleting it breaks
no test, changes no output, produces no error, and the page still works — just
slowly, on a link nobody developing locally has. The staircase would come back
silently.

### Verified
Stripping `defer` from the real launcher and re-running the real rule reports 8
blocking scripts. The self-checks feed the same functions a page with a bare
tag, one with `async`, one loading `bank-loader.js` before `bank-parser.js`, and
a module placed before the classics — each is caught, and the correct forms are
not. Full gate green: 18 logic suites, the engine harness and all 8 browser
suites, including the 15-step end-to-end journey through a real server and login.

## v2.35.0 — The two apps nobody had ever audited (2026-09-13)

The accessibility audit covered the launcher and Practice Exams. **StarNix and
WWTBANE had no accessibility gate of any kind** — the two surfaces that are the
most animated, the most actively worked on, and the most likely to grow a control
nobody can see the focus on.

Both are clean: zero axe violations, every control Tab reaches has a name, and
every one shows a 3px focus ring. **Nothing is fixed here.** This is the gate.

### Added
- **10 checks in `a11y-audit.mjs` (55 total)** covering both games: axe across
  WCAG 2.0/2.1 A and AA, plus the keyboard walk — every control the tab order
  reaches must have an accessible name and a visible focus indicator.

### The games are tabbed, not focused, and that matters
`:focus-visible` matches only in keyboard modality, and a programmatic `focus()`
does not reliably establish it. A probe written that way **reported two WWTBANE
controls as having no focus ring** — `seed-input` and `secondary`. Tabbing to
them shows `focus-visible: true` and `outline: solid 3px rgb(255,200,87)` on
every control, and `seed-input` is not even in the tab order until its
`<details>` is opened.

That trap is documented in this file's own header, and a fresh probe fell into it
anyway. Pressing Tab is both what a keyboard user actually does and immune to it.
The existing surfaces keep the `focus()` method, which is exercised and working
there and reaches controls the tab order does not.

### Verified
Suppressing WWTBANE's focus ring fails the ring check, naming all four affected
controls. Emptying a button's label fails **two** checks — the name walk and
axe's own `button-name`. An image with no alt fails axe with
`[CRITICAL] image-alt`.

## Also in this release: does the readiness number mean anything?

The readiness estimate is the highest-stakes *claim* the app makes — tell someone
they are ready when they are not and they pay an exam fee to find out. It had 54
checks. Every one of them tests the **machinery**: the guess floor, the
smoothing, the decay, the coverage gate. Not one asks the question a reader of
the number actually has: *if it says 90%, is this person answering about 90%?*
A model can honour every rule in that module and still be a thermometer reading
in the wrong units.

**It is well calibrated.** Simulated learners studying the way people study — the
whole bank, a pass every three days — are tracked closely, and the caution early
on is real rather than decorative:

```
passes  days  score  band      verdict          (true ability 90%)
1       3     87     80-94%    On the edge
3       9     89     83-96%    Likely ready
8       24    91     85-97%    Likely ready
```

Nothing is fixed. What the checks add is the ability to *notice*:

### Added
- **12 calibration checks in `readiness-test.mjs` (54 → 66).** Learners of known
  ability — 90%, 80%, 55% — must each be estimated within a few points of what
  they can actually do, the band must contain their true ability, a genuinely
  unready one must never be told otherwise and must have the top of their band
  below the pass mark, a stronger learner must always outscore a weaker one, and
  a single pass must not open at "likely ready" while still landing in the right
  neighbourhood. The generator is seeded, so a failure is a change in the model
  rather than a bad afternoon.

### Why it was worth adding
**A model that inflated every estimate by 12 points passed 53 of the 54 existing
checks.** Against the new ones it fails four, naming the numbers: a 90% learner
reported as 100%, an 80% learner as 94%, a 55% learner as 65%. A model that
ignores the evidence and tells everyone "75%" fails six, including the ordering
check that no amount of conservatism can satisfy.

## v2.34.0 — The branches a sweep cannot reach (2026-09-13)

v2.33.0 swept every page builder with hostile input. Feeding input only
exercises the branches that input reaches, and `server/pages.mjs` has **fourteen
conditional renders** — the sweep takes one side of each.

Reading all fourteen showed every untaken side renders static text, so nothing
was missing. But "nothing is missing today" is the whole problem: a branch added
next month is not covered by a sweep written before it existed, and this is the
module where a missed escape is a script running in root's session.

### Added
- **A source rule, which does not care which branch runs (3 checks, 162 total).**
  Every `${…}` in the module is extracted with brace matching, and wherever one
  mentions a value carrying text a user chose — a username, a display name, an
  audit actor or detail, an error echoed back, the repo or version on the admin
  page — that mention must sit inside `esc()` (or `msg()`, which escapes).

  Narrow on purpose. A blanket *"everything must be escaped"* would flag all 39
  unescaped interpolations here — every one of them legitimately a number, a
  static string, or HTML already assembled from escaped parts — and an allowlist
  that long stops being read and becomes a rubber stamp.

### It reported correct code first, twice
- **String literals.** `from`, `to`, `label` and `message` are ordinary English
  words: *"Back to the study tool"* is not a variable. Literals are blanked
  before scanning.
- **Comparisons.** `u.display_name !== u.username` mentions the username to
  decide whether to render something *else*. A value being tested is not a value
  being written out.

### Verified
Removing `esc()` from the username, the repo, the audit detail and the update
page's version is caught, each naming the exact expression. And the case that
justifies the rule existing at all: an unescaped `${username}` planted in the
`allowSignup: false` branch — which the input sweep **provably never renders**,
since it always passes `true` — is caught immediately.

## v2.33.0 — The 307 lines of HTML nobody tested (2026-09-13)

`server/pages.mjs` builds every page the login server serves — by string
interpolation, from data users control: a username, a display name someone chose
at self-registration, an error echoed back. Three hundred lines of it, and not
one direct test.

The attack is short. Sign yourself up with a display name of
`<img src=x onerror=…>`; root opens `/admin` to see who has registered; it runs
in root's session — the one account that can delete everybody's progress.
Nothing about that needs access this server does not deliberately hand out:
self-registration is on by default.

**It does not happen.** Every interpolation is escaped, confirmed against a
running instance before this suite existed: the payload comes back as text, no
element is injected, the page carries zero `<script>` tags. This release is the
gate, not a fix.

### Added
- **`scripts/pages-test.mjs` (CI-gated, 159 checks).** `esc()` itself — all five
  characters, `&` first so nothing is double-escaped, null and undefined, and an
  object that tries to smuggle markup through `toString`. Then a **sweep**: every
  exported page builder called with six payloads in every string field, asserting
  no raw tag-opening from the payload survives. Written as a sweep so a page
  added later is covered the day it is added, with a check that every exported
  builder appears in the sweep at all.

### Three ways this suite was wrong before it was right
Each was caught by a control, not by reading it:

- **It flagged correct code.** `<svg` appears in every page — the shell's favicon
  is a `data:` URI containing one. And a payload of `javascript:NST_PWN=1`
  contains nothing `esc()` escapes, so it *should* come through verbatim; as text
  in a `<p>` it is a string, not a link. The rule now derives its fragments from
  the payload's own raw tag-openings, which escaping provably removes.
- **It flagged escaped output as a leak.** Asking "does any tag contain the
  marker" matched `<input … value="&lt;script&gt;NST_PWN…">` — a correctly
  escaped value inside a legitimate tag. Closing tags were the same story:
  `</title>` and `</style>` are in every page already.
- **And then it could not catch the bug it exists for.** With one hostile value
  reused everywhere, `username` and `display_name` matched — and the admin page
  renders the display name *only when it differs*. That branch never ran, and
  removing its `esc()` left all 159 checks green. Every slot now gets a distinct
  value, which also makes a failure name the field.

### Verified
Removing `esc()` from the admin display name, the username, the audit actor, the
update page's version and the error message each fail 10–11 checks by name,
printing the raw tag-opening that survived.

### Also fixed: a test that was wrong 13% of the time
CI caught `resume-test.mjs` failing one check — *"so the stored answer still
points at the option it pointed at"* — on a suite that passes locally. It was not
a flake and was not re-run. It compared the stored answer with `===`, and a
**multi-answer** question stores its answer as an *array* of chosen indices,
which is never `===` to itself after a JSON round-trip. 13% of this bank is
multi-answer, so the check failed exactly when the shuffle put one of those
first. Reproduced by forcing a multi-answer question into first place:

```
first question answer stored as: [0]  (MULTI — the CI case)
after resuming:                  [0]
strict ===   : false   <- what failed in CI
deep compare : true    <- what the fix uses
```

The exam data was never wrong; only the assertion about it was.

## v2.32.0 — Checking the one sentence the whole project rests on (2026-09-13)

*"However you play, right and wrong answers feed the same mastery tracker."*

That is the README's headline claim and the reason this is one app rather than
three. **It is also the single most fragile thing in it**, and nothing checked
it. Three independently-built codebases reach the shared store three different
ways, and any one of them could stop with every other suite still green:

| tool | how it reaches the shared store |
|---|---|
| Practice Exams | `engine.recordMastery` → `NSTMastery.record` |
| StarNix | `core.mastery.record`, through an IIFE whose parameter is named `global` |
| WWTBANE | only when `state.shared` is true, which `emptyMastery()` sets **solely if the shared module was found at that moment** |

WWTBANE's is the thinnest: a falsy flag silently returns it to keeping private
records, and the game plays exactly the same.

**All three work.** This release is the check, not a fix.

### Added
- **`scripts/promise-test.mjs` (CI-gated, 25 checks).** Answers a question in
  each of the three tools *through that tool's own API*, in one browser context,
  and asserts all three land in one store — then that the launcher rolls them up.

  The differing **policies** are checked too, because sharing the evidence was
  never meant to flatten how each tool feels: StarNix and Practice Exams move the
  box by one and only when a card is due; WWTBANE moves by two from its own seed,
  and an **assisted** answer counts as exposure without moving the box at all.

  It checks provenance, not presence. `emptyMastery()` hands back a *live
  reference* to `shared.all()`, so even a broken fallback mutates the same object
  — presence alone would pass for the wrong reason. So: the record must not have
  existed before, the store must grow by exactly one, and the record must carry
  the shared engine's own fields (`streak`, `incorrect`, `firstCorrectAt`) that a
  private shape has no idea about.

### Verified
Cutting each thread is caught. WWTBANE's flag set false fails 2 checks including
the one named for it; WWTBANE keeping a private copy fails 9; StarNix losing the
bridge fails 7 — including that the launcher can no longer see every tool's work.

The first version of the WWTBANE section **crashed** on a broken integration
rather than reporting, hiding every check after it. Guarded, it now names nine
failures instead of printing a stack trace.

## v2.31.0 — The dead end v2.30.0 created (2026-09-13)

Attacking the saved-exam record v2.29.0 introduced — ten payloads: prototype
pollution in the record and inside a question, a script tag as a question id, a
permutation of out-of-range indices, a 50,000-entry question array, an index a
billion past the end, a deadline at the end of representable time. **All ten were
repelled**: no pollution, no script ran, nothing crashed, and a fresh exam stayed
on offer throughout.

But the results showed something else. For every malformed record the launcher
said *"You have an unfinished exam"* while Practice Exams declined it — so
following that link landed on a page that silently cleared the record and said
nothing at all. **A dead end, introduced by v2.30.0, one release earlier.**

### Fixed
- **Practice Exams now says what happened to it.** A saved exam it cannot rebuild
  is reported — *"An unfinished exam could not be restored — the question bank has
  changed since it was started, or the saved copy was damaged. It has been
  cleared."* — with `role="status"`, instead of vanishing. The launcher's check
  is *necessarily* shallower, because it has no engine to rebuild questions with,
  so this mismatch cannot be designed away; what it can do is stop being silent.
  Somebody followed that link looking for exactly this.
- **The launcher refuses the records that are plainly broken**, rather than
  advertising an exam the link cannot produce. Every question entry must be an
  object with a string id and a genuine permutation — whole, in-range, no
  repeats, at least two options — which is the shape `applyPerm` replays. It
  still cannot know whether the bank *has* the question; it no longer promises on
  a record that could never have worked.

### Added
- **10 checks in `dashboard-test.mjs` (110 total)** for the shapes it now
  refuses, including that one bad entry among good ones refuses the whole record.
- **8 checks in `resume-test.mjs` (44 total)** that walk the whole path: a record
  the launcher accepts and Practice Exams cannot, the link followed, and the
  explanation found at the other end — named cause, announced, record cleared, no
  resume offered that cannot be honoured, fresh exam still available.

### Verified
Removing the explanation puts the dead end back and fails three checks by name.

## v2.30.0 — Telling you about it on the page you actually land on (2026-09-13)

v2.29.0 taught Exam Mode to survive the tab being discarded and offers the
sitting back — on the Practice Exams entry screen. Which means the feature only
worked for somebody who happened to walk back in through the door they left by.
The launcher is the home page. It said nothing.

### Added
- **The progress panel now leads with an unfinished exam.** *"You have an
  unfinished exam — 34:12 left. 5 of 75 answered. The clock is still running."*,
  linking to Practice Exams. An expired one reads *"An exam finished while you
  were away"* and is styled as such — red rather than amber, because there is
  nothing left to go back to, only a result to see.

  It is drawn **before** the no-data check, deliberately: somebody whose very
  first action was an exam has no mastery to show yet, and is exactly the person
  who must not lose it.

- **`NSTDash.pendingExam(raw, bankId, now)`** — pure, and deliberately shallow.
  The launcher has no engine to rebuild questions with, so this decides only what
  can be decided without a bank. It therefore **must not claim the exam is
  restorable**: the wording it feeds says "unfinished", not "resume", and points
  at the one place that can actually know. A record for another certification is
  not ours to talk about; one that will not parse is not a record.

- **26 checks in `dashboard-test.mjs` (100 total).** Including that a
  multi-answer selection counts as answered and an unanswered question does not,
  that an expired record reports `0` rather than a negative remaining time, that
  a missing, non-numeric or **infinite** deadline is refused rather than treated
  as forever, that it never mutates what it is handed, and that storage being
  unavailable does not take the rest of the panel down with it.

### Verified
Removing the bank guard and the deadline guard fails three checks by name;
pointing the link anywhere but Practice Exams fails its own.

### Measured, not changed
The per-render save v2.29.0 added costs **0.6 ms** including the full DOM update,
for a 4.3 KB record. There is nothing to optimise, so nothing was.

## v2.29.0 — An exam that survives the tab being taken away (2026-09-13)

Practice Mode has always remembered where you were. Exam Mode — the long one,
the timed one, the one worth ninety minutes — remembered nothing. The asymmetry
was exactly backwards from where the value is.

A phone reclaiming a backgrounded tab took the whole sitting with it, and the
`beforeunload` guard does not help there: a discarded tab never fires it.

### Added
- **Exam Mode now saves the sitting and offers it back.** Coming back to the
  entry screen shows *"Resume your exam — 34:12 left"* above everything else,
  with the count answered and a way to discard it instead. A 75-question sitting
  costs **4.2 KB**, which matters beside a sync envelope that is capped and a
  store that has to survive a full quota.

Two things make this correct rather than merely convenient:

- **The clock does not stop.** `endTime` is an absolute timestamp and is saved as
  one, so time away is spent whether the page was open or not and resuming buys
  nothing. The card says so in as many words. An exam whose time ran out while
  you were gone comes back as *"Time ran out while you were away"* — finished,
  with an explanation, rather than silently vanishing or silently restarting.
- **The option order comes back identical.** Exam Mode shuffles each question's
  options, so an answer is stored as an index into the *shuffled* list.
  Rebuilding from the bank would reshuffle, and every stored index would then
  point at a different option — every answer silently rewritten, with nothing on
  screen to show it. Each question's permutation is persisted and replayed
  (`engine.applyPerm`, split out of `shuffleOptions` so there is one definition
  of the mapping rather than two to keep in step).

It refuses rather than guesses. A record from another certification is kept but
not offered; one naming a question the bank no longer has, one whose option count
changed under it, one with no questions, and one that will not parse are all
declined and cleared. Half an exam is not the exam.

The save happens in `renderCard()` — the single point every answer, flag and
navigation already passes through, so it cannot be forgotten by a later change
the way seven separate call sites could.

- **`scripts/resume-test.mjs` (CI-gated, 36 checks).** Drives a real exam, answers
  six, flags one, discards the tab, and comes back: the offer appears, the answers
  and flag are there, the deadline is unchanged, and **the options are in the same
  order with the stored answer still pointing where it pointed.** Plus the expiry
  path, all five refusal paths, and that submitting clears the record so a graded
  exam is never offered back.

### Verified
Removing the save fails seven checks. Replacing the replayed permutation with a
fresh shuffle — the silent-corruption bug this design exists to prevent — fails
exactly the one check written for it.

## v2.28.0 — Pinning the setup guide to the code (2026-09-13)

**`server/README.md` was checked claim by claim and found accurate.** Nothing in
it is fixed. It is also the page somebody follows to stand a VM up, and the two
things in it most likely to go stale without anyone noticing now cannot.

### Added
- **11 more checks in `scripts/docs-test.mjs` (24 total).**

  **The configuration table, both ways.** Every `NST_*` the *server* reads must
  have a row, or it is a setting nobody can find; and every row must name one
  the server still reads, or it is a setting that silently does nothing. (The
  `NST_*` variables under `scripts/` are test tooling and are deliberately out
  of scope.) All six documented today are exactly the six the server reads.

  **The performance table, against real brotli.** Each row's on-disk and
  over-the-wire figure is recompressed at the quality `server/compress.mjs`
  actually uses and compared. These are the numbers a reader uses to decide
  whether this will be fast enough over their network, so a stale one is a wrong
  answer rather than a typo. All three are currently exact — 2868/1350 KB,
  367/98 KB, 652/155 KB, a 59% saving — and the tolerance is tight (3% on disk,
  5% over the wire) because they can afford to be.

### Verified
Adding an undocumented setting, leaving a row for a removed one, and shifting one
size figure each fail their own check, naming the variable or printing both
numbers.

## v2.27.0 — Documentation describing a repository it no longer has (2026-09-13)

Read the README as a newcomer would, and check each claim against the code.
Three were wrong, one of them in a way that matters.

### Fixed
- **The README told you nothing is sent to a server — in a file that documents
  the server.** The opening promised "everything saves to your browser's local
  storage — nothing is sent to a server, there's no account to make", while
  *Host it for a team (accounts + login)* describes accounts, sign-in and
  progress that "follows you to any browser or device". Both cannot be true. On
  the public static site the first is right; on a self-hosted instance — which
  is the whole point of the server — it is simply false, and it is the
  privacy-relevant half. Now scoped: local-only on the public site, mirrored to
  an account on **your** server if you run one, and nowhere else either way.
- **The architecture tree listed seven top-level entries against ten real
  ones.** Missing: `server/` (documented at length in the same file),
  `scripts/` (every shared test suite) and `styles/`. Someone using the tree to
  find their way around was told the login server did not exist.
- **`shared/` was described as "bank parser + loader + per-tool adapters +
  Nutanix wordmark".** It is also the mastery store — the spaced-repetition
  scheduler the whole app is built on — plus the dashboard, readiness and review
  views, preferences, backup, account sync and the version stamp. The one
  sentence describing the most important directory in the repo omitted its
  reason for existing.
- **`Develop` did not mention the shared suites at all**, though they are the
  majority of the gate. It now shows how to run them, and the six browser suites
  with the one-line install they need.

### Added
- **`scripts/docs-test.mjs` (CI-gated, 13 checks).** Every top-level directory
  must appear in the architecture tree and everything in the tree must still
  exist; every relative link across README, CHANGELOG, the server, bank and
  format docs and the knowledge base must resolve (a dead link is invisible
  until somebody clicks it, and nothing here ever clicked); and the local-only
  promise must stay scoped while the server section exists.

### Verified
Deleting `server/` from the tree fails two checks by name; breaking one doc link
fails a third with the file and target printed.

## v2.26.0 — One preference, four front-ends (2026-09-13)

**No bug was found here, and none is fixed.** This is the check that would have
answered the question in a second, written because answering it by reading took a
browser probe and two wrong conclusions on the way.

Accessibility preferences are set in one place — the launcher's Settings, into
`localStorage` `"nst.prefs"` — and have to reach four independently-built
front-ends, none of which express them the same way:

| surface | how it says "reduced motion" |
|---|---|
| launcher | `<html class="nst-reduced-motion …">` |
| Practice Exams | the same classes, its own stylesheet |
| StarNix | `StarNix.core.profile.settings.reducedMotion` — high contrast is `colorblind` |
| WWTBANE | `<body class="reduced-motion">`, via its own tri-state `settings.motion` |

All four work. Neither game *looks* like it does: a grep for the prefs key in
`wwtbane/*.js` finds nothing, because that game's source lives under
`src/shell/`; and StarNix shows no class at all, because it keeps the state on a
profile object. Both readings are wrong, and both were made here before the
browser settled it.

That is precisely the kind of cross-module contract that rots quietly. Any one of
the four could stop reading the key and **every existing suite would still
pass**, while somebody who needs reduced motion gets a 3D camera flight.

### Added
- **`scripts/prefs-test.mjs` (CI-gated, 28 checks).** Sets the preferences on,
  then off, loads all four surfaces, and asserts each reflects the setting in its
  own idiom — including that muting the launcher mutes StarNix, and that high
  contrast arrives in StarNix under its own name.

  Both directions, deliberately: a surface that simply hardcoded the accessible
  mode would pass every "it arrives" check, so the OFF cases are what make it a
  test. A final check asserts the two runs actually differ, so "it arrives"
  cannot be trivially true.

### Verified
Removing WWTBANE's prefs import fails its check by name. Removing StarNix's fails
its own — but only after `build.mjs` runs, because StarNix is served as a built
monolith and editing the source changes nothing the test can see. The first
attempt at that control was invalid for exactly that reason; the suite is
ordered after the build in CI.

## v2.25.0 — When the browser refuses to store anything (2026-09-13)

`NSTMastery.saveError()` has always existed. It was exported, and it was read by
**nobody** — not one call site anywhere in the app.

So when a browser stops accepting writes — a full quota, a private window, an
enterprise policy that disables site data — the tool went on showing progress,
promoting boxes and scheduling reviews for a session that would be gone the
moment the tab closed. In silence. StarNix already toasts this for its own
store; the shared store, which is where every tool's answers actually live, said
nothing at all.

Measured in a real browser before the fix: `setItem` throwing,
`saveError() === "quota"`, and **not one word on the page.**

### Fixed
- **The store now announces a refused write** as an `nst-storage-status` event,
  on *change* only — once when writes start failing, once when they recover, not
  once per write.
- **The launcher shows a red "Not saved" chip**, `role="alert"`, distinct from
  the amber sync chip. It had to be distinct in words as well as colour: the sync
  warning promises the work is *"still safe in this browser"*, and that is
  precisely what is untrue here. Nothing is being kept anywhere — including the
  copy sync would push, because sync builds its envelope from the same storage
  that is refusing the writes.
- **Practice Exams shows a full banner**, because that is the page where answers
  are actually given, and someone forty minutes into an exam should not have to
  notice a small badge to learn the sitting will not survive the tab closing. It
  renders *outside* `#pe-root`, so changing screens — every mode replaces that
  element's contents — does not wipe it.
- Both name what actually failed (a full quota reads differently from a refused
  write) and both point at **Settings → Save backup file**, which writes a file
  and does not need storage — the one thing that still works.

### Added
- **25 checks in `mastery-test.mjs`.** The announcement is exercised against a
  storage that can be made to refuse writes on demand: that the error is
  recorded, that the answer *still counts in-session* (a save must never throw),
  that it announces once rather than per-write, that recovery announces too so
  the warning can be taken down, that everything recorded while broken is in the
  write that finally lands, and that a window with no `CustomEvent` still records
  without throwing. Plus the wiring on both surfaces, including that neither
  borrows the sync chip's "still safe in this browser".

### Verified
Removing the announcement fails six checks; removing the Practice Exams listener
fails its own. In a browser, the warning appears on failure with `role="alert"`,
exactly one element and one event however many writes fail, and disappears on
recovery.

## v2.24.0 — The answers that never reached the disk (2026-09-13)

Mastery writes are debounced by 400ms, and they should be: without it a
255-question sitting would stringify the whole store on every single answer.
The cost is a window in which an answer exists only in the page's memory — and a
page that is going away never gets to close it. The pending timeout simply never
fires.

Measured in a real browser: **three answers recorded, the tab hidden, and
nothing written at all.**

### Fixed
- **`NSTMastery` now flushes on `pagehide` and on the document going hidden.**
  Nothing was doing it. `nst-sync.js` has both handlers, but it only registers
  them once it has reached the app server — on GitHub Pages and `file://` it
  stays dormant by design, so on those deployments the window never closed for
  anybody. The debounce belongs to the mastery module, so the flush does too:
  bound there, it works wherever the app is served from. `pagehide` covers a
  close, a navigation and bfcache; `visibilitychange` covers a phone
  backgrounding the tab, which is where the OS is most likely to kill it
  outright. Both are paths on which a timer will not run again.
  Measured after: the same three answers are on disk the moment the tab hides.
- **The last-chance sync push was sending a stale snapshot.** `flushOnHide`
  builds its envelope from `localStorage`, so the newest answers — the ones most
  at risk, which is the entire reason that push exists — were exactly the ones
  missing from it. It now forces the mastery write first, and does not assume
  mastery's own handler ran first: listener order between modules is not
  guaranteed.

### Added
- **10 checks in `mastery-test.mjs`, 5 in `sync-test.mjs`.** The mastery ones run
  against a window that behaves like a browser in the two ways that matter —
  timers that actually defer and listeners that can be fired — because the shim
  the rest of that file uses runs `setTimeout` synchronously and would hide this
  bug completely. They pin that an answer is *not* written immediately (the
  debounce is the point), that hiding the page writes it, that the pending timer
  is cancelled rather than left to write twice, that becoming *visible* does not
  force a write, and that a window with no `addEventListener` still loads.

### Verified
Removing the fix fails seven checks by name and exits 1. The first version of
the test crashed instead of reporting, which would still have gone red but hidden
every check after it; it now reports a missing listener as one clear failure.

### Not changed
Scaling was measured at the same time, to 4080 questions — eight banks' worth,
against the seven more that are planned. Everything stays linear and fast:
recording all 4080 takes 3.3ms, the mastery rollup 0.3ms, readiness under
0.1ms, the due queue 0.6ms. There is nothing to optimise here.

## v2.23.0 — The 109 checks nothing ran (2026-09-13)

Every logic suite in this repo gates a pull request. Five did not, for one
reason: they need a real browser, and CI was kept dependency-free. So
accessibility, colour contrast, phone and landscape layout, the rendered half of
the security gate, and the entire sign-in-to-study journey were the only parts of
this project a change could break in silence. They passed — whenever someone
remembered to run them.

### Added
- **A `browser` CI job running all five, 109 checks in total.** `a11y-audit`
  (45: axe across every surface including the ones only reachable by
  interacting, plus the keyboard checks axe cannot make — accessible names,
  visible focus, focus surviving a view change, modal focus trapping, no
  focus-steal on first paint, WCAG 2.2 target sizes, landscape), `a11y-browser`
  (14: WCAG contrast of every visible text node against its *actually painted*
  backdrop, and `prefers-reduced-motion`), `mobile-audit` (11: layout at 390×844
  across the launcher, both games and every exam surface), `attack-browser`
  (24: a malicious question bank and poisoned storage loaded into all four real
  pages, where `security-test.mjs` only proves they stay inert as *data*), and
  `smoke-test` (15: a real server, a real database and a real login, driven end
  to end).

  It is the only `npm install` in the repo, and it is dev tooling — nothing
  there ships to a user. The app itself remains dependency-free.

### Fixed
- **The skip that would have made the whole job a no-op.** All five printed
  `SKIP` and exited **0** when no browser was found. That is right on a laptop,
  where the alternative is a red build for a tool the developer has not
  installed — and exactly wrong in CI, where an exit 0 that ran nothing is
  indistinguishable from 109 passing checks. This is the failure mode
  `robustness-test.mjs` was written to avoid, reintroduced by the harness rather
  than by the tests. `NST_REQUIRE_BROWSER=1` (which the job sets) now turns the
  skip into a hard failure naming what is missing and how to install it.
- **A browser path that only existed on one machine.** Each suite hardcoded a
  fallback `executablePath` into this sandbox's `/opt`. Naming a path that does
  not exist is worse than naming none — Playwright fails with a
  missing-executable error instead of simply using the browser it downloaded.
  The path is now used only if it is actually there.

### Changed
- **`scripts/browser-env.mjs`** — the browser-resolution logic was copied into
  all five suites, in three slightly different spellings. One module now:
  finding Playwright, finding Chromium, finding axe-core, and the skip-or-fail
  decision.

### Verified
The gate was checked against a real regression, not just a green run:
suppressing the focus ring on `.pe-btn` (`outline: none` with no replacement —
the defect the check exists for) fails three surfaces by name and exits 1.
Deleting a *custom* ring correctly does **not** fail, because the browser's own
focus ring takes over and the control is still visible to a keyboard user.

## v2.22.0 — What the login page gave away (2026-09-13)

This server sits on a company LAN with self-service sign-up, a root account and
one SQLite file holding everyone's progress. The auth module was written
carefully — scrypt, per-user salts, hashed session tokens, timing-safe
comparison everywhere, one identical error message for a failed sign-in. So this
cycle stopped reading it and probed a running instance instead. Four findings,
each measured before and after.

### Fixed
- **One malformed cookie took the whole site down for that browser.**
  `decodeURIComponent('%')` throws a `URIError`, `parseCookies` did not catch it,
  and the session cookie is read *before* routing — so a single junk cookie
  answered **500 to every page, the sign-in screen included**, with no way in to
  clear it. The Cookie header is attacker-controlled on every request, which made
  it a one-line denial of service against any visitor. A value that will not
  decode is now kept verbatim: it matches no session and no CSRF token, which is
  the correct outcome. Being unreadable is not grounds for taking the server
  down. Measured: `Cookie: nst_session=%` → **500 before, 200 after.**

- **The clock named every account on the server.** A failed sign-in deliberately
  returns one message for both halves, so the text could not be used to
  enumerate usernames. But an unknown username short-circuited before
  `verifyPassword`, skipping the deliberately-slow scrypt entirely — so it
  answered in **1.6 ms** where a real username took **31.6 ms**. A 20x tell, on
  the exact question the error text refused to answer. A missing *or disabled*
  account now burns the same scrypt against a fixed throwaway salt and discards
  the result. Measured: **19.6x before, 1.0x after.**

- **Sign-up had no throttle at all.** Every POST ran a deliberately costly hash
  and wrote a row, so a loop against it pinned the CPU and grew the database
  without limit — and *"That username is already taken"* answered the
  enumeration question at full speed. Sign-up is now rate-limited per address
  **before** the name lookup, the hash, or the insert, and every attempt counts
  rather than only the failures: the thing being capped is how fast accounts can
  be created. Measured: 20 rapid posts → **20 accounts before, 8 then 429 after.**

- **The throttle was itself a way to exhaust the process.** Attempts are keyed
  `ip|username`, and an unknown username costs nothing to reject, so a bot
  posting a fresh random name every time minted a map entry that nothing ever
  came back to expire. The map is now capped: expired records go first, then the
  oldest records *not* serving a live lockout — so filling it cannot be used to
  wash out a lockout someone has already earned.

- **Closing the timing leak opened a CPU one, so that is closed too.** Making an
  unknown username cost a full scrypt meant a bot could force 30 ms of work per
  request — and the throttle is keyed `ip|username`, so a bot inventing a fresh
  name every time never hits the same key twice and was never throttled at all.
  Failed sign-ins are now *also* counted per address, on a much looser limit
  (60 per 15 minutes, failures only) that a person cannot reach and a shared
  office address has room for. A successful sign-in clears it. Measured: 80
  logins under 80 different usernames from one address → **60 served, then 429**,
  capping the burn at 1.9 s instead of leaving it open.

### Added
- **`scripts/auth-test.mjs` (CI-gated, 68 checks).** Each of the four above as
  the assertion that the probe now fails, including a real timing measurement of
  known-vs-unknown username, a lockout that has to survive a map flood, proof
  that a many-username flood the fine gate cannot see is caught by the coarse
  one, and the ordering proof that both gates run before any expensive work —
  the scrypt, the name lookup, the insert. Plus the
  guarantees that were already right, pinned so they stay: HttpOnly and
  SameSite=Strict on the session cookie, Secure only over https, a sign-out that
  actually expires it, CSRF rejection on every mismatch, unique salts, hashed
  session tokens, and the username and password rules.

## v2.21.0 — Can a request kill the server? (2026-09-13)

The app server is one Node process on a VM, often started by hand in a terminal
rather than as a service. A crash there is not a blip: the tool is gone for
everybody until someone notices and logs in to restart it. `server-test.mjs`
asks whether each route does the right thing; nothing asked whether the process
survives the wrong thing.

### Added
- **`scripts/robustness-test.mjs` (CI-gated, 57 checks).** Everything hostile or
  merely malformed that a browser, a scanner or a broken client can send, with
  one absolute bar: a request may be refused, may 400, may 413, may 500 — **none
  of them may end the process.**

  Malformed bodies (truncated JSON, a bare number, 2000-deep nesting, lone
  surrogates, NUL bytes, a 100 KB key name, `__proto__` and `constructor`
  payloads, a 9 MB body past the cap). Hostile paths (a 60 KB URL, 200 levels of
  traversal raw and percent-encoded, malformed escapes, an encoded NUL,
  backslashes, a drive letter, an alternate data stream, a UNC path, fullwidth
  unicode dots, overlong UTF-8). Hostile headers (a 60 KB cookie, 500 cookies,
  non-UTF8 cookie bytes, a 2000-entry Accept-Encoding, a negative Content-Length
  claim). Raw framing a client library will not produce (no HTTP version, an
  unknown method, a Content-Length that lies, two Content-Lengths, a bad chunk
  size, binary garbage). Then 120 concurrent requests and 40 abandoned half-open
  connections.

### The result: nothing was broken
Every one survives, prototype pollution never takes hold, and no traversal
returns a file. **This suite found no bugs** — it converts "the error handling
looks right" into "it has been checked", and stops a future change from
quietly removing that.

### The detector proves itself
A suite that finds nothing looks identical to a suite that cannot find anything.
So it ends by killing the server and requiring its own liveness check to notice.
Without that, an `alive()` stuck at `true` would report a perfect score against a
process that died on the first request.

## v2.20.0 — The question banks are checked now (2026-09-13)

Seven more certification banks are planned, and nothing checked the ones that
exist. `starnix/bank-lint.mjs` lints StarNix's *generated* `questions.js`; the
Markdown banks in `/banks/` — what the runtime actually loads, and what a person
edits by hand — had no check at all.

### Added
- **`scripts/bank-test.mjs` (CI-gated, 55 checks).** It parses every bank with
  the **real** `shared/bank-parser.js` rather than a re-implementation, so the
  lint and the runtime cannot disagree about what a bank means.

  **The check that matters most: question ids are global.** `NSTMastery.get(id)`
  keys on the bare id with no bank scoping, so two banks using the same id share
  one record — answering a question in one moves the other's box, its counters
  and its review date. Nothing reports it; the schedule just becomes quietly
  wrong for both. Today's two banks happen not to collide because they were
  written with different prefixes. Nothing enforced that.

  Also checked: the manifest's banks all exist and belong to declared certs;
  every cert variant resolves; no `.md` sits under `/banks/` unlisted and
  therefore invisible; every question has a stem, two options, an answer key
  pointing at a real option, and a domain from the bank's own declared list (a
  typo there silently creates a one-question "domain" in the dashboard and the
  practice focus); no explanation names an option **by letter** and no option
  says "all of the above", both of which are wrong under the runtime's option
  shuffling; and every exhibit image resolves. Missing explanations and
  correct-answer-is-longest tells are reported as warnings, not failures.

### Documented
The rule the linter now enforces was not written down anywhere. `docs/BANK_FORMAT.md`
said ids must be "stable, unique", which any reader takes to mean unique *in this
file* — precisely the misreading that causes the collision. Both that spec and
`banks/README.md` now say **across every bank**, explain why (mastery stores one
record per id, with no bank scoping), point at the prefix convention the bundled
banks already follow, and tell an author to run the linter before committing.

### The linter proves it is not vacuous
Every check passing proves nothing on its own — a rule with a typo in it passes
everything too. The suite ends by running **the same functions** over
deliberately broken synthetic banks and requiring them to complain: a duplicate
id, an explanation naming an option by letter, positional option text, and a
domain outside the declared list.

Separately, before shipping, the whole linter was driven against nine broken
bank trees in a temp copy of the repo — including the cross-bank id collision, a
manifest entry with no file, an orphaned bank file, a cert pointing at a missing
bank, and an unresolvable image. All nine were caught, and a healthy pair of
banks still passed.

## v2.19.0 — Sync says when it isn't working (2026-09-13)

Having found one silent way to lose progress, I went looking for the rest in the
same path. Three more, none of them reported, all of them quiet by construction.

### Fixed
- **The page-hide push was about to start failing forever, silently.** A
  `keepalive: true` request body is capped at 64 KB by the browser. Measured with
  the full 255-question bank studied plus the game saves and exam history a
  regular user accumulates, the envelope is **60.5 KB — 94% of the cap**, and the
  mastery store alone is 43 KB for *one* bank. A second cert's bank takes it over
  on its own, and over the cap the request is simply rejected with no error
  anywhere. Oversized bodies now fall back to an ordinary fetch: less likely to
  survive the page going away, but it either works or it does not, rather than
  never working while appearing to.

- **The page-hide push marked itself as done before knowing whether it worked.**
  It cannot be awaited — the page is going — so a page restored from bfcache
  carried a false "already pushed" and skipped the next real push. It no longer
  records anything; since v2.18.0 a merge loses nothing, so re-sending is free.

- **A repeatedly failing push said nothing.** The error went into a variable no
  surface read, while someone studied for an hour with nothing reaching their
  account and found out on the next device. Three consecutive failures now raise
  a **Not saving** chip in the nav, explaining that the data is still safe in
  this browser and pointing at Settings → Save backup file. It clears itself when
  sync recovers.

  One failure is a hiccup the next push covers, so it is not mentioned. The
  all-clear fires only after real trouble — "fine" is the assumed starting state,
  so a healthy session shows nothing at all. (It fired a spurious all-clear on
  every successful first push until the test insisted otherwise.)

### Added
- **`scripts/smoke-test.mjs` — the whole app, once, the way a person uses it.**
  Every other suite tests one module in isolation. This one starts a real server
  with a throwaway database and drives a real browser through the actual journey:
  a colleague creates an account, signs in, picks a bank, answers questions, and
  their progress reaches the account and comes back on the dashboard; then root
  signs in, sees both accounts, downloads a backup and checks for updates. 15
  checks.

  It exists because every unit suite passing is not the same as the app working.
  Fourteen releases in one evening is exactly when something composes badly — a
  CSP that blocks a new call, a route that moved, a module loaded in the wrong
  order — and no focused test would notice.

  It caught one thing immediately, which turned out not to be a bug: a check that
  fetched an asset from `/admin` failed, because that page is `default-src 'none'`
  with no `connect-src` — correct, since it has no script and needs no network of
  its own. The test was measuring the CSP rather than the thing it meant to.

- **`scripts/sync-test.mjs` (CI-gated, 25 checks)** against a scriptable fetch:
  the keepalive threshold, which transport each body size chooses, that a second
  page-hide flush still sends, that one failure is quiet and three are not, and
  that recovery is announced exactly once.

Verified in a real browser against a real server: a healthy session shows
nothing, a server returning 500 raises the chip with the reason in its tooltip,
and recovery removes it.

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
