# Provenance for the shipped banks

Where the questions in `banks/ncp-mci/ncp-mci.md` came from, kept so the answer
keys can be checked against their source. **Nothing loads these files** — they are
not banks, they are not in `manifest.json`, and the apps never read them.

| file | what it is |
| --- | --- |
| `ncp-mci-e1.md` | the interchange export the NCP-MCI bank was built from |
| `ncp-mci-e1-review.md` | the review pass over that export |

## One copy, and which one (v2.63.0)

There were two of each, in two directories, and they had **diverged**:
`starnix/banks/` (which nothing referenced and nothing knew about) and
`wwtbane/docs/interchange/` (which v2.61.0 had just labelled the provenance to
keep). The one that was blessed was the stale one, wrong on every point where
they differed:

| | kept — was `starnix/banks/` | discarded — was `wwtbane/docs/interchange/` | the shipped bank says |
| --- | --- | --- | --- |
| a cluster-size note | "the minimum is four" | "the minimum is five" | four |
| an LCM question | "a host that has GPUs" | "a host that has **CPUs**" | GPUs |
| a Metro Availability explanation | describes the options | "Options A and B" | describes them |
| a storage-container explanation | describes the option | "Option C" | describes it |
| an invisible character | a plain space | **U+2028 LINE SEPARATOR** (×5 in the file) | plain space |

Two of those matter beyond tidiness. "CPUs" makes the question contradict its own
stem. And U+2028 has already cost this project three questions: `verify-build.mjs`
still carries the check from when it silently emptied their explanations — so the
copy the repository pointed an author at contained five of the exact character
that had broken it before.

The review file was byte-identical in both places.

## If you re-derive questions from these

Author into the format in [`docs/BANK_FORMAT.md`](../../docs/BANK_FORMAT.md) and
put the result in `banks/`. `scripts/bank-test.mjs` now refuses a second
near-duplicate copy of any tracked text file, and refuses an invisible line or
paragraph separator in anything under `banks/`.
