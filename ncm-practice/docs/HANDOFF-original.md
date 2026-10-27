# NCM-MCI 6.10 Guided Practice — session handoff

Written 2026-10-24. Covers everything built and decided in this chat so another chat (or a person) can pick it up.

## 1. Situation

- Jason sat the NCM-MCI 6.10 lab exam on 2026-10-22 and scored 1633 (pass is ~3000 on a 1000–5000 scale). Retake planned; fallback is the 7.5 version after Oct 31. Nutanix employees get free attempt resets.
- Score report gives a number only, no per-objective breakdown.
- Root causes Jason reported: UI navigation on a very slow exam VM, not knowing where a few settings live, a handful of wrong values, and losing whole tasks to one mistake. Recall of values was a smaller problem than navigation.
- Source material: "NCM-MCI 6.10 Field Guide v1" PDF (17 tasks, step-by-step), a colleague's confidence-coloured spreadsheet (two photographed pages), and Jason's post-exam notes.

## 2. What exists now

| Thing | Where | Notes |
|---|---|---|
| Live site | https://ncm-mci-guided-practice.netlify.app | Public. Netlify project `ncm-mci-guided-practice` (site id `ee887e1a-704f-4b4d-ac8c-346dd0d1de06`), team account jasonisscotty13@gmail.com (Google login). |
| Database | Netlify Database (Neon-managed Postgres) on that project | Table `progress(user_key text pk, data jsonb, updated_at timestamptz)`. Provisioned automatically on first deploy. |
| Function | `/api/progress` | GET/PUT one JSON blob per sync key. Key = SHA-256 of a passphrase, hashed in the browser. Server keeps the newer of stored vs incoming by `updated_at`. |
| Source | `site/` folder (zip attached): `public/index.html`, `public/assets/*.svg`, `netlify/functions/progress.mjs`, `netlify/database/migrations/20261023150000_create_progress.sql`, `netlify.toml`, `package.json` | No GitHub repo. Deploys are pushed from Claude through the Netlify connector (`deploy-site` operation, then the `npx @netlify/mcp` upload command it returns). |
| Claude artifact | https://claude.ai/artifact/LJQEgDqADfbCuBs55PBcYi | Earlier copy; now behind the Netlify site. Treat Netlify as source of truth. |
| Claude Docs practice sheet | "NCM-MCI 6.10 Practice Exam — Task Sheet" | Exam-style task wording without steps. Uses the field guide's (wrong) numbering; not updated. |

Deploying a change: edit `site/public/index.html`, then in Claude call the Netlify connector `deploy-site` with the site id and run the command it returns from the `site/` directory. Build takes about a minute. Migrations in `netlify/database/migrations/` apply automatically on production deploys; never edit an applied migration, add a new file instead.

## 3. How the site works

Single HTML file, no framework, Montserrat from Google Fonts, styled to the Nutanix Design system (Montserrat only; titles ExtraLight iris-800 #391699; iris #7855FA accent; #4B00AA fill behind white; #F2F2F2 panels; #BFBFBF hairlines; square corners except pill buttons; no shadows; status as dot + word; 120–200 ms ease-out motion only; dark theme on #131313 with iris-300 text). Deviation: commands use a system monospace stack because the design system defines no mono face.

### Screens (four)
- **Home** — Start practice, "Weakest right now" (four lowest tasks), the progress grid (17 tasks × 7 drill types), sync key control, reset. Progress is only shown here.
- **Practice** — one question at a time. Two dropdowns: **Task** (All, weakest first / Task 1–17) and **Focus** (Mixed / Walkthrough / Terminal / Command fill / Recall / Location / Values / Step order / Traps). Mixed leans toward Walkthrough and includes Terminal. A focus a task can't do (Terminal on a GUI-only task) falls back to Mixed.
- **Tasks** — number strip, then per task: **Learn** (plain-English why/what, where, one-liner, values, order of work, commands, what loses the task), **Practice this task**, **Examiner card** (for a second person reading the scenario aloud and ticking what the candidate must say; grade feeds Recall).
- **Reference** — Command finder (type what you need, get the command), Menu paths (first click for every task), Glossary (22 terms).

### Drill types and grading
- **Walkthrough** — one step at a time; three levels per task: Pick (choose next step from 3) → Cue (first two words shown, say the rest, reveal, self-grade) → Blind. Clean run promotes.
- **Terminal** — mock CVM shell (`nutanix@NTNX-C1-CVM:~$`, `…C2…` for Cluster 2) and API Explorer prompt for Task 12. Commands must be entered in order; `hint` shows the next command with its key token blanked; `steps` lists objectives; `clear`. Wrong tool → "command not found"; valid-but-later command → "not yet"; spaces around `=` fail. Clean = no hints, no wrong attempts. Tasks with a terminal: 1, 7, 10, 11, 12, 13, 16, 17.
- **Command fill** — three levels per task: One blank (the key token) → Key tokens (all critical tokens) → Whole command (empty prompt; graded with the terminal matcher, so flag order can vary where openssl allows it and `<UUID>` placeholders accept anything).
- **Recall** — scenario, say it aloud, reveal full card, self-grade.
- **Location** — pick PE / PC / SSH-CLI / Desktop editor / PC API Explorer / Sizer.
- **Values** — type exact names, IPs, sizes, schedules; lenient on separators and case, not content. Up to 5 per question.
- **Step order** — click shuffled steps in order; wrong clicks count.
- **Traps** — one correct statement vs three documented mistakes.

### Spacing and storage
- Leitner boxes per (task, type): correct → +1 (max 3 = mastered), miss → 0. Practice always serves the lowest box first and avoids immediate repeats.
- State object `S = {box:{"<taskId>:<type>":0-3}, fade:{taskId:1-3}, cfade:{taskId:1-3}, seen, right, streak, v:2, updated}` in `localStorage` key `ncm-drill-v1`. Sync hash in `ncm-drill-sync`.
- Sync: on load, GET by hash; adopt server copy if newer, else push. After every answer, debounced PUT (800 ms). Offline keeps working on local storage.
- A one-time migration (`S.v !== 2`) remapped stored progress when task numbering was corrected (see §4).

## 4. Task numbering (corrected)

The field guide's order was wrong where the lab's own file names prove it: `Task 1.txt` (SQL analysis), `task 10.txt` (SCMA), `Task 13.txt` (CSR), `Task17` in DR object names. Displaced tasks took the freed slots; those three (6, 9, 2) are inferred, not confirmed.

| # | Task | Runs in |
|---|---|---|
| 1 | SQL01 vs SQL02 analysis + fix SQL02 | PC (Analysis, Reports, disk clone) |
| 2 | NEWSQL write-intensive VM | PE VM + Volume Groups |
| 3 | Category + storage encryption policy | PC Govern |
| 4 | Database_VM volume group optimization | PC/PE Storage → Volume Groups |
| 5 | Small VM template + SMTP + NCC reports | PE (VM, SMTP, NCC email); PC (template) |
| 6 | Inode threshold tuning | PE Health → Checks |
| 7 | Corp_Syslog | PE Settings → Syslog or `ncli rsyslog-config` |
| 8 | Repair Security Policy.txt | Desktop text editor |
| 9 | sql3532 per KB-3532 | PE VM Update |
| 10 | SCMA security hardening (Cluster 2) | SSH ncli + PE Cluster Lockdown |
| 11 | Immediate rebuild after planned reboot | SSH ncli |
| 12 | API JSON repair + Test_Deploy VM | PC REST API Explorer (username menu) |
| 13 | OpenSSL CSR with SAN | SSH openssl |
| 14 | IaaS capacity plan (3 waves) | PC Operations → Planning → Scenarios |
| 15 | SQL_Batch_Saturday report | PC Operations → Reports |
| 16 | NCC suppression + Pulse alert tuning | SSH ncc + PE Health → Checks |
| 17 | DR remote site + protection domain | PE Data Protection, both clusters |

## 5. Corrections to the field guide (validated against the colleague's sheet and Jason's exam)

- **Task 4**: the "multi-node" optimization is **Load Balancing** on the VG, not Flash Mode. Setting is locked while a client is attached: Manage Connections → detach VM → Update → enable Load Balancing → re-attach. Guide listed detaching as a mistake; it's required.
- **Task 14**: the tool is **PC → Operations → Planning → Scenarios**, not Nutanix Sizer (which is blocked via my.nutanix.com in the lab). Values unchanged: scenario IaaS, new cluster, HPE DX365-10-G11-NVMe full flash, RF3/2 host failures, 12 months, 4 vCPU/16 GB/200 GB, waves 100 now/50 at 3 mo/20 at 6 mo, smallest node count, export `Desktop\IaaS-requirement.pdf`.
- **Task 5**: Create VM Template is **PC → Compute → VMs → right-click → Create VM Template**; PE has no template function. SMTP (Gear → SMTP Server), alert recipients (Gear → Alert Email Configuration) and NCC report email (Health → Actions → Set NCC Frequency) are PE.
- **Task 2 (NEWSQL)**: "avoid I/O constrained to one node" → 750 GB data disk as a **volume group with Load Balancing + Flash Mode**, attached to the VM, on a container with free space. The ~239 GB disk-size cap Jason hit is the default container's free space.
- **Task 12**: REST API Explorer is under the **username menu (top right)** in PC, not Admin Center. Postman isn't in the lab. UUIDs: `ncli cluster info | grep -i uuid`, `acli net.list` (or POST /clusters/list, /subnets/list). JSON: `num_sockets 2`, `memory_size_mib 8192`, `disk_size_mib 51200`, `disable_branding true`, `metadata {"kind":"vm"}`, UUIDs quoted; expect 202; VM stays off.
- **Task 1**: three charts: IOPS, I/O latency, I/O bandwidth. GUI disk fix: SQL02 → Disks → hover IDE/SATA disk → copy ADSF path → Add New Disk → Clone from ADSF File → SCSI → remove old disk. ACLI fallback: `acli vm.disk_create SQL02 clone_from_vmdisk=<UUID> bus=scsi`, `acli vm.disk_delete SQL02 disk_addr=sata.0`.
- **Task 7**: module is **ACROPOLIS** (no AOS module in this build), level **INFO**, Include Monitor Logs, TCP 514 with **relp-enabled=false**. `ncli rsyslog-config add-server name=Corp_Syslog ip-address=23.236.51.202 port=514 network-protocol=tcp relp-enabled=false` / `add-module server-name=Corp_Syslog module-name=ACROPOLIS level=INFO include-monitor-logs=true` / `set-status enable=true`.
- **Task 10**: capture both `ncli cluster get-cvm-security-config` and `get-hypervisor-security-config` to `Desktop\task 10.txt` **before** changes; `edit-cvm-security-params` and `edit-hypervisor-security-params` with `enable-aide=true`, `schedule=weekly`, `enable-high-strength-password=true`; `ssh root@172.30.0.2` → `passwd` (match admin) **last**; PE Gear → Cluster Lockdown → New Public Key (paste the `.pub` from `Desktop\Files\SSH`) → uncheck Enable Remote Login with Password. No reboot. The colleague's `edit-software-config-management-policy` / `set-high-strength-password-policy` are not real ncli commands.
- **Task 13**: get files to the Desktop by `cat` → select → paste into Notepad → Save As; no download. Self-signed variant only if asked: `openssl x509 -req -days 1460 -in … -signkey … -out … -sha256 -extensions v3_req -extfile ….cnf`.
- **Task 16**: Pulse alert is tuned at PE Health → Checks → search "pulse" → Pulse enablement check: alert off, messages on; then resolve the active alert. NCC: disable only `health_checks data_protection_checks protection_domain_checks backup_schedule_check`.
- **Task 17**: remote site type Physical Cluster, DR address on 172.30.0.x, 10 MB/sec, network mapping; **configure the remote site on both clusters** (that is the failback); one Async DR PD with Web-Prod/App-Prod/DB-Prod, 2 days local/remote, Task17 in every name; `allssh genesis stop cerebro; cluster start` if PE errors.
- **Task 9**: four SCSI disks, order is the label (scsi.0 OS 100, scsi.1 Data 80, scsi.2 Logs 100, scsi.3 TempDB 50); SSD preference = Flash Mode checkbox; power-on-first = Agent VM; no VG, no NIC. If a dedicated SQL container is asked for: compression on (0 delay), dedup off, erasure coding off (colleague's low-confidence note).
- **Flash Mode** is wanted in exactly three places (Task 4 only if SSD is mentioned, Task 9, Task 2 VG). Jason enabled it on extra VMs; that risks "unrelated change" deductions.

## 6. Exam-day tactics for a slow VM

- Decide where each task runs before touching the mouse (Reference → Menu paths).
- Do CLI-capable tasks over SSH, not the GUI: 1 (disk), 7, 10, 11, 16; cerebro for 17.
- Order by cost: pure CLI/Desktop tasks first (8, 11, 12 file edit, 13) while GUI pages load elsewhere.
- Skip the PDFs/KBs for tasks already known; use them only for syntax you're unsure of.
- Keep one Notepad open as scratch for UUIDs, exact names, and the deliverable checklist.
- Never power on a VM unless told; exact file names including spaces (`Task 1.txt`, `task 10.txt`, `Task 13.txt`).

## 7. Study plan agreed

- Two or three 20-minute Practice (Mixed, All tasks) blocks per day; weakest tasks surface automatically.
- Night before: one Recall pass across all 17.
- Any task whose Values or Step order cell keeps resetting → run it in the lab reservation; the tool can't replace reps on a real cluster.
- Teaching: use Tasks → Learn to explain a task to someone else, then hand them the Examiner card and let them grade. Four or five tasks per sitting.

## 8. Open items

- Confirm the inferred numbers for inode (6), sql3532 (9), NEWSQL (2) against memory of the exam.
- Verify in the lab: VG Load Balancing toggle location in PE 6.10 vs PC; PC Planning → Scenarios supports the HPE model and PDF export; the 239 GB cap is container free space.
- Optional: rename the Claude Docs task sheet numbering to match §4; add a GitHub repo if version history is wanted; add export/import of progress if sync is ever unavailable.
