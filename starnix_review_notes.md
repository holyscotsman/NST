# StarNix — review notes

Companion to `dump1_review_verification.md` (full verdicts). IDs use current sectioning: a1=Q1-60, a2=Q1-58, a3=Q1-33, a4=Q1-50, a5=Dump 2 (Q1-39).

## Corrected in the bank (key was wrong in the source; fixed + marked `corrected`)

### a2q1
Source key was "Reserved Capacity is set too high" — wrong. Corrected to **"Advertised Capacity is set too low"** (high confidence). A container's Advertised Capacity caps it against the pool, so a low value makes it fill/alert while the cluster has space; reserving space does the opposite. Per-option and overall explanations were rewritten to match.

### a4q15
Source key was "See capacity runway" — wrong. Corrected to **"Filter VM by efficiency"** (high confidence). A VM at 95-100% memory is the Constrained VM profile, surfaced via VM efficiency; capacity runway is a cluster forecast, not a per-VM diagnostic. Explanations rewritten to match.

## Dropped from the bank

### a1q48 / a3q29
VM Efficiency "deleted after 129/120 days" is a false premise — baselines are 30 days and Efficiency never auto-deletes; 129/120 reconciles with no documented baseline set. Both dropped.

### a3q1
Flawed: two valid answers. GPU VMs can't live-migrate (CCLM out), but both "Recovery Plan planned failover" and "Migrate Async Protection Domains" are valid minimal-downtime methods. Dropped (rewording would mean authoring new content — restore on request).

### a4q36 / a3q10
Exact duplicates of a1q8 / a1q36 (options reordered). Dropped.

## Unresolved — kept in the bank with the SOURCE key (not verified)

### a1q13
Metro+Witness. Source key (guest I/O pause + automatic failover to recovery) is consistent with Nutanix docs (medium confidence); exact option wording lives in a gated table. Portal check skipped — left as-is.

### a1q27
Application Discovery prerequisites (API key + key ID, Internet connection). Native PC feature prereqs are behind the Nutanix portal login; not verifiable from open sources. Portal check skipped — left as-is.

### a3q7
CAC authentication failure. Source keys only "no CRL configured," but its own per-option text calls OCSP an equally "highly likely cause," and the overall explanation treats CRL/OCSP as interchangeable revocation mechanisms — so this reads as two valid answers presented as single-answer. Kept with the source key; verify whether Nutanix CAC specifically requires CRL before relying on it.

## Other notes

### a5q39
Per-option wording is self-contradictory (option 1 labeled "Correct:" but text says "not the most likely cause"). Key is unambiguous: option 1 "Change password at next logon," confirmed by the overall explanation. Preserved verbatim.

### a4q50
Answer text uses "21 days" for the zombie window; current Nutanix docs say 30 days. Keyed option (low IOPS + low network) is still correct vs the distractors. Dated number only.

### a1q10 / a1q16 / a3q7 typos
Source typos in distractor rationales ("IIncorrect", "Inccorrect", "Potential, milar to..."). Keys unaffected; preserved verbatim.

### a4q35 / a4q40
NOT duplicates despite identical stem ("Refer Exhibit: Why has an anomaly been triggered?") — different exhibits and options. Both kept.

### Image reconciliation
a4q50 has an uploaded crop but no embedded image in the source RTF (no `@image` assigned). a1q16/a1q37/a4q3/a4q35/a4q40/a4q43/a4q49 have source images but no uploaded crop (extracted from the RTFD). See the image manifest.
