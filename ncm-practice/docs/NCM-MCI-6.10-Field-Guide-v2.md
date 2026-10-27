# NCM-MCI 6.10 Field Guide v2

Updated 2026-10-24. Supersedes v1. Changes from v1: task numbering corrected to the lab's; Task 4 is VG load balancing (detach → enable → re-attach), not Flash Mode; Task 14 is PC Operations → Planning, not Sizer; Task 5 template is made in PC; Task 2 data disk is a load-balanced volume group; Task 12 REST API Explorer is under the username menu; Task 7 module ACROPOLIS/INFO/relp off; Task 10 covers CVM and hypervisor with real ncli syntax and Cluster Lockdown; Task 17 remote site on both clusters with network mapping; Task 1 three I/O charts and the Clone-from-ADSF-File path.

## Master task map

| # | Task | Runs in | One line |
| --- | --- | --- | --- |
| 1 | SQL01 vs SQL02 analysis + fix SQL02 | Prism Central | PC Analysis (3 IO charts) + Report + Desktop Task 1.txt + SQL02 disk cloned to SCSI; leave SQL01/SQL02 OFF. |
| 2 | NEWSQL write-intensive VM | Prism Element | PE: NEWSQL_VM 12/128, 100 GB OS; NEWSQL_VG 750 GB on a container with room, load balancing + Flash Mode, attached; no NIC, OFF. |
| 3 | Category + storage encryption policy | Prism Central | PC → Categories + Storage Policy; VM-Storage has two values, policy uses softwareencrypted. |
| 4 | Database_VM volume group optimization | Prism Central | VG → Manage Connections: detach VM → Update: enable Load Balancing → re-attach VM; VM OFF. |
| 5 | Small VM template + SMTP + NCC reports | Prism Element | PE Create Small VM (2/8/125) → PC Create VM Template Small Template → PE SMTP + Alert Email + Set NCC Frequency. |
| 6 | Inode threshold tuning | Prism Element | PE Health → Checks → inode: warning 45%, critical 60%, every minute, no auto-resolve. |
| 7 | Corp_Syslog | Prism Element | PE → Settings → Syslog; Corp_Syslog 23.236.51.202 TCP/514 relp off; module ACROPOLIS INFO + monitor logs; Cluster 1 only. |
| 8 | Repair Security Policy.txt | Desktop text editor | Edit Security Policy.txt only; Quarantine false/APPLY/SecOps; SMB True/MONITOR/smbhost/smbclient; DN True/MONITOR/ALL/True. |
| 9 | sql3532 per KB-3532 | Prism Element | PE sql3532: 12 CPU/128 GB, OS 100, DATA 80, LOGS 100, TEMPDB 50, SCSI, Flash Mode, Agent VM, no VG/NIC, OFF. |
| 10 | SCMA security hardening (Cluster 2) | SSH / CLI | Cluster 2: get-*-security-config to task 10.txt first; AIDE weekly + high-strength on cvm and hypervisor; root passwd; Cluster Lockdown: add .pub, uncheck password login. |
| 11 | Immediate rebuild after planned reboot | SSH / CLI | SSH → ncli cluster set-resiliency-preference desired-resiliency-preference=immediate. |
| 12 | API JSON repair + Test_Deploy VM | PC API Explorer | UUIDs via ncli cluster info / acli net.list; fix API_Create_VM.txt; username → REST API Explorer → POST /vms → 202; Test_Deploy OFF. |
| 13 | OpenSSL CSR with SAN | SSH / CLI | OpenSSL CSR; files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt; cat → paste to get them onto the Desktop. |
| 14 | IaaS capacity plan (3 waves) | Prism Central | PC → Operations → Planning: scenario IaaS, new cluster, HPE DX365-10-G11-NVMe, RF3, 12 months, 100/50/20 waves, PDF IaaS-requirement.pdf. |
| 15 | SQL_Batch_Saturday report | Prism Central | PC Reports: SQL_Batch_Saturday, Cluster 1 max CPU, SQL* VMs max read latency + max CPU ready, Sunday 12AM previous 7 days, email DBA, CSV ZIP to Desktop. |
| 16 | NCC suppression + Pulse alert tuning | SSH / CLI | Cluster 1: suppress backup_schedule_check only; Health → Checks → pulse enablement check: messages yes, alert no; resolve existing alert. |
| 17 | DR remote site + protection domain | Prism Element | PE DR: Task17 remote site on both clusters (Physical, DR IP, 10 MB/sec, network mapping) + one Task17 Async DR PD for Web/App/DB, 2 days local/remote. |

## Exam-day rules

- Decide where the task runs before touching the mouse (the exam VM is slow).
- CLI-capable tasks over SSH: 1 (disk), 7, 10, 11, 16; cerebro for 17.
- Pure CLI/Desktop tasks first: 8, 11, 12 file edit, 13.
- Never power on a VM unless told. Exact file names with spaces.
- Flash Mode belongs in exactly three places: Task 9, the Task 2 VG, and Task 4 only if SSD is mentioned.
- One Notepad for UUIDs, names and the deliverable checklist.

## Task 1: SQL01 vs SQL02 analysis + fix SQL02

**Runs in:** Prism Central (Analysis, Reports, VM disk clone) → ACLI as a fallback for the disk

**Scenario.** The DBA team says SQL02 performs worse than SQL01 though both came from the same image. Both VMs are off and must stay off. Compare them, save the analysis and a scheduled report, capture the page to a text file, and fix SQL02.

**Plain English.** Two database servers were built from the same template, but one is slow. The company wants proof of the difference and the slow one fixed, and both servers have to stay switched off the whole time. You open the management console that sees every cluster (Prism Central), graph the two servers side by side on three storage charts (IOPS, latency, bandwidth), save the graph with an exact name, copy it into a text file, and schedule it to email a team every morning. Then you look at how the slow server's virtual hard drive is plugged in. It's on an old-style connector (like USB 1 vs USB 3). You clone the drive onto the fast connector and remove the old one.

### Required values

| Item | Value |
| --- | --- |
| Analysis session name | Compare SQL01 and SQL02 |
| Report name | Compare SQL01 and SQL02 |
| Report schedule | Daily at 10:00 AM |
| Report recipient | perf_group@ACME.org |
| Report retention | disabled |
| Text file on Desktop | Task 1.txt |
| SQL02 problem disk bus → correct bus | IDE/SATA → SCSI |
| The three charts to add | IOPS, I/O latency, I/O bandwidth |
| GUI clone option name | Clone from ADSF File |

### Order of work

1. PC → Operations → Analysis → New Session; entity type Virtual Machine, add SQL01 + SQL02
2. Three I/O charts: IOPS, I/O latency, I/O bandwidth (storage, not CPU/memory)
3. Save session as Compare SQL01 and SQL02
4. Right-click chart area → Select All → copy → Notepad → Desktop\Task 1.txt
5. Create Report from the session: Compare SQL01 and SQL02, daily 10:00 AM to perf_group@ACME.org, retention off
6. PC → SQL02 → Disks: the IDE/SATA disk is the problem; hover it and copy its ADSF path
7. Add New Disk → Clone from ADSF File → paste the path → bus SCSI → Add
8. Remove the IDE/SATA disk; VM stays off (ACLI clone_from_vmdisk is the fallback)

### Commands / edits

```
acli vm.get SQL01
acli vm.get SQL02
acli vm.disk_create SQL02 clone_from_vmdisk=<UUID> bus=scsi
acli vm.disk_delete SQL02 disk_addr=sata.0   # or ide.0
```

### What loses the task

- Powering on either VM
- Charting CPU/memory; the task is storage, so IOPS + latency + bandwidth
- Leaving report retention enabled
- Saving Task1.txt instead of Task 1.txt
- Fixing charts but never fixing SQL02's disk
- Deleting the VM instead of correcting the disk

### Examiner checklist (what a candidate must say)

- [ ] Prism Central, not Prism Element, for the analysis and the report
- [ ] Three charts: IOPS, I/O latency, I/O bandwidth
- [ ] Session and report both named Compare SQL01 and SQL02
- [ ] Daily at 10:00 AM to perf_group@ACME.org, retention off
- [ ] File is Task 1.txt with the space
- [ ] SQL02's disk is IDE/SATA; clone it as SCSI (Clone from ADSF File) and remove the old one
- [ ] Neither VM gets powered on

**Flash card:** `PC Analysis (3 IO charts) + Report + Desktop Task 1.txt + SQL02 disk cloned to SCSI; leave SQL01/SQL02 OFF.`

## Task 2: NEWSQL write-intensive VM

**Runs in:** Prism Element (Cluster 1) → VM → Create VM, then Storage → Volume Groups for the data disk

**Scenario.** New write-heavy MS-SQL workload on Cluster 1. Create the VM for maximum production storage performance; every object name includes NEWSQL. No network, stays off, do not touch Storage Policies.

**Plain English.** A new database server that writes a lot of data needs to be built for speed on Cluster 1, without its storage traffic getting stuck on a single machine. Every object name must include NEWSQL. You create a VM with 12 CPUs / 128 GB and a 100 GB system disk. The big 750 GB data disk goes into a volume group with load balancing and Flash Mode, on a container that has room, and you attach that to the VM. No network card, left off, and you don't touch Storage Policies.

### Required values

| Item | Value |
| --- | --- |
| Required string in name | NEWSQL |
| vCPU / memory | 12 vCPU / 128 GB |
| OS disk / data disk | 100 GB / 750 GB |
| Disk bus | SCSI |
| How to avoid I/O pinned to one node | Data disk as a volume group with load balancing enabled |
| Why the UI capped the disk at ~239 GB | The container was out of free space; pick a container with room |
| Network adapter? | None |
| Performance option | Flash Mode |
| Use Storage Policies? | No |

### Order of work

1. Cluster 1 PE → VM → Create VM: name with NEWSQL (e.g. NEWSQL_VM), 12 vCPU, 128 GB
2. OS disk 100 GB SCSI on a container with free space
3. Storage → Volume Groups → + Volume Group: NEWSQL_VG, add a 750 GB disk on a container with room (the ~239 GB cap is the default container's free space)
4. On the VG: enable Load Balancing (spreads I/O across nodes) and Flash Mode
5. Attach the VG to NEWSQL_VM (Manage Connections / add client)
6. No NIC; do not power on; save and validate; leave Storage Policies alone

### Commands / edits

```
acli vm.get NEWSQL_VM   # optional validation
acli vg.get NEWSQL_VG
```

### What loses the task

- Forgetting NEWSQL in the name of the VM or the VG
- Fighting the 239 GB cap on the default container instead of choosing a container with space
- Adding a NIC
- Powering on the VM
- SATA/IDE instead of SCSI
- Creating only one disk
- Opening Storage Policies despite the instruction

### Examiner checklist (what a candidate must say)

- [ ] NEWSQL in the VM name and the VG name
- [ ] 12 vCPU, 128 GB
- [ ] OS disk 100 GB SCSI
- [ ] Data disk 750 GB as a volume group with load balancing + Flash Mode, attached to the VM
- [ ] Pick a container with free space (that's the ~239 GB cap)
- [ ] No NIC, powered off, no Storage Policies

**Flash card:** `PE: NEWSQL_VM 12/128, 100 GB OS; NEWSQL_VG 750 GB on a container with room, load balancing + Flash Mode, attached; no NIC, OFF.`

## Task 3: Category + storage encryption policy

**Runs in:** Prism Central → Govern → Categories / Storage Policies

**Scenario.** Admins should be able to opt a VM into software encryption by tagging it. Some VMs will later sit on self-encrypting drives and must be distinguishable by the same category.

**Plain English.** The company wants admins to turn on encryption for a server just by putting a label on it, instead of configuring each one by hand. In Prism Central You create a label (category) called VM-Storage with two possible values, then a rule (storage policy) that says: anything labeled softwareencrypted gets its storage encrypted.

### Required values

| Item | Value |
| --- | --- |
| Category name | VM-Storage |
| Category values (two) | softwareencrypted, SEDencrypted |
| Storage policy name | Encrypted-Storage |
| Policy matches which value | softwareencrypted |
| Policy action | Encrypt VM storage |

### Order of work

1. PC → Govern → Categories
2. Create category VM-Storage
3. Add value softwareencrypted
4. Add value SEDencrypted
5. Govern → Policies → Storage Policies
6. Create Encrypted-Storage, rule VM-Storage = softwareencrypted
7. Enable encryption action, save, verify

### What loses the task

- Creating only one category value
- Pointing the policy at SEDencrypted instead of softwareencrypted
- Looking for categories in PE instead of PC
- Creating the category but never the policy

### Examiner checklist (what a candidate must say)

- [ ] Done in Prism Central under Govern
- [ ] Category VM-Storage with two values: softwareencrypted and SEDencrypted
- [ ] Policy named Encrypted-Storage
- [ ] Policy matches softwareencrypted, not SEDencrypted

**Flash card:** `PC → Categories + Storage Policy; VM-Storage has two values, policy uses softwareencrypted.`

## Task 4: Database_VM volume group optimization

**Runs in:** Prism Central → Infrastructure → Storage → Volume Groups (PE Storage → Volume Groups also works)

**Scenario.** Database_VM was migrated with a volume group attached. Tune that VG for best performance in a production multi-node cluster. Use the existing VG, add no disks, VM stays off.

**Plain English.** A database server has a shared storage volume attached. On a cluster of several machines, that volume's traffic can all land on one machine; the company wants it spread across them. Nothing may be added or removed, and the server stays off. The setting that spreads the load can't be changed while the server is attached to the volume. So you detach the server from the volume group, turn on load balancing, and attach it again. Flash Mode (pin to SSD) is a different setting and only belongs here if the task mentions SSDs.

### Required values

| Item | Value |
| --- | --- |
| Setting that spreads VG I/O across nodes | Load balancing |
| What must happen before you can change it | Detach the VM (Manage Connections → remove) |
| After enabling it | Re-attach the VM (Manage Connections → add) |
| Where | Storage → Volume Groups → right-click VG → Manage Connections / Update |
| VM power state | OFF |
| Create a new VG? | No |

### Order of work

1. Confirm Database_VM is powered off
2. Storage → Volume Groups → List → right-click the Database_VM VG → Manage Connections
3. Remove Database_VM from the VG's client list → Save (settings are locked while a client is attached)
4. Right-click the VG → Update: enable Load Balancing (the multi-node optimization); add Flash Mode only if the task also asks for SSD pinning
5. Manage Connections again → add Database_VM back → Save
6. Reopen and verify: load balancing on, VM attached, VM still off

### Commands / edits

```
acli vg.list
acli vg.get Database_VM
acli vm.get Database_VM
```

### What loses the task

- Powering on the VM
- Trying to toggle the setting while the VM is still attached (greyed out); detach, change, re-attach
- Forgetting to re-attach the VM afterward
- Creating a new VG instead of editing the existing one
- Adding disks
- Treating Flash Mode as the whole answer when the task says multi-node

### Examiner checklist (what a candidate must say)

- [ ] Storage → Volume Groups → Manage Connections
- [ ] Detach the VM first; the setting is locked while attached
- [ ] Enable Load Balancing
- [ ] Re-attach the VM afterward
- [ ] Don't create a new VG, don't add disks, VM stays off

**Flash card:** `VG → Manage Connections: detach VM → Update: enable Load Balancing → re-attach VM; VM OFF.`

## Task 5: Small VM template + SMTP + NCC reports

**Runs in:** Prism Element for the VM, SMTP and NCC email; Prism Central for the template (Compute → VMs → Create VM Template)

**Scenario.** ACME standardizes VM sizing on NVD-2031. Build the small profile VM, template it, and make Cluster 1 email alerts and NCC reports.

**Plain English.** The company has a standard 'small server' size from a Nutanix design document and wants a reusable template of it. The cluster also needs to be able to send email alerts and health reports. You build a VM with exactly 2 CPUs, 8 GB memory and a 125 GB disk in Prism Element and leave it off. Templates are a Prism Central feature, so you switch consoles to turn it into a template. Then back in Prism Element you point the cluster at a mail server, add two alert mailboxes, and switch on the emailed health report.

### Required values

| Item | Value |
| --- | --- |
| VM name | Small VM |
| Template name | Small Template |
| vCPU / memory / disk | 2 vCPU / 8 GB / 125 GB |
| Disk container | default |
| Where templates are made | Prism Central → Compute → VMs → right-click → Create VM Template |
| SMTP server | Cluster 2 CVM external IP |
| Cluster sender address | cluster1@ACME.org |
| Alert recipients | primaryalerts@ACME.org, secondaryalerts@ACME.org |
| Where NCC report email lives | Health → Actions → Set NCC Frequency |

### Order of work

1. Cluster 1 PE → VM → Create VM: Small VM, 2 vCPU, 8 GB, 125 GB on the default container; do not power on
2. PC → Compute → VMs → right-click Small VM → Create VM Template → Small Template (PE has no template function)
3. PE Gear → SMTP Server: Cluster 2 CVM external IP, sender cluster1@ACME.org; send test
4. PE Gear → Alert Email Configuration: recipients primaryalerts + secondaryalerts
5. PE Health → Actions → Set NCC Frequency: enable the emailed NCC report to the same recipients

### What loses the task

- Guessing the VM size instead of NVD-2031 (2/8/125)
- Powering on Small VM
- Looking for Create Template in PE; it lives in PC
- Saving SMTP without testing
- Forgetting the NCC report email is a separate setting from alert email

### Examiner checklist (what a candidate must say)

- [ ] Small VM: 2 vCPU, 8 GB, 125 GB on the default container, powered off
- [ ] Template is made in Prism Central (Compute → VMs → Create VM Template), named Small Template
- [ ] SMTP server is a Cluster 2 CVM external IP, sender cluster1@ACME.org
- [ ] Alert recipients primaryalerts and secondaryalerts
- [ ] NCC report email: Health → Actions → Set NCC Frequency

**Flash card:** `PE Create Small VM (2/8/125) → PC Create VM Template Small Template → PE SMTP + Alert Email + Set NCC Frequency.`

## Task 6: Inode threshold tuning

**Runs in:** Prism Element (Cluster 1) → Health → Checks (search "inode")

**Scenario.** After a CVM ran out of inodes, ACME wants earlier warning on Cluster 1 and the condition to stay visible until an admin clears it. Change only the inode check.

**Plain English.** A controller once ran out of inodes (file slots). The company wants an earlier warning that stays on screen until a human clears it. In Prism Element Health you find the inode check and sets warning 45%, critical 60%, runs it every minute, and turns off auto-resolve. He tunes the check; he doesn't disable it.

### Required values

| Item | Value |
| --- | --- |
| How to find the check | Health → Checks → search inode |
| Warning threshold | 45% |
| Critical threshold | 60% |
| Check interval | every 1 minute |
| Auto-resolve | disabled |
| Disable the check instead of tuning? | No |

### Order of work

1. Cluster 1 PE → Health → Checks
2. Search inode; open the CVM inode usage check
3. Edit its parameters
4. Warning 45%, critical 60%
5. Frequency every 1 minute
6. Turn off auto-resolve
7. Save, reopen, verify

### What loses the task

- Disabling the check instead of tuning it
- Warning higher than critical
- Leaving the default schedule
- Leaving auto-resolve on
- Changing unrelated NCC checks

### Examiner checklist (what a candidate must say)

- [ ] Warning 45%, critical 60%
- [ ] Every 1 minute
- [ ] Auto-resolve off
- [ ] Only the inode check changed, not disabled

**Flash card:** `PE Health → Checks → inode: warning 45%, critical 60%, every minute, no auto-resolve.`

## Task 7: Corp_Syslog

**Runs in:** Prism Element (Cluster 1) → Settings → Syslog Server, or ncli rsyslog-config

**Scenario.** Security operations collects VM lifecycle events from Cluster 1 on a central syslog server. Forward only those logs.

**Plain English.** Security wants a record of every time a virtual machine is created, changed or deleted, sent to their central log server. Only those events, only from Cluster 1. You add a syslog server entry with the server's address, pick TCP on port 514 with RELP off, and attach only the Acropolis module (the service that manages VMs) at INFO level with monitor logs.

### Required values

| Item | Value |
| --- | --- |
| Server name | Corp_Syslog |
| IP address | 23.236.51.202 |
| Protocol / port | TCP / 514 |
| Log module (VM lifecycle events) | ACROPOLIS, with Monitor logs included |
| relp-enabled value for plain TCP | false |
| Which cluster | Cluster 1 only |

### Order of work

1. Cluster 1 PE → Settings → Syslog Server (or SSH + ncli rsyslog-config)
2. New server Corp_Syslog
3. IP 23.236.51.202
4. TCP, port 514; RELP off
5. Module ACROPOLIS only (the service that creates/changes/deletes VMs); level INFO so change events are included
6. Tick Include Monitor logs for that module; no other modules
7. Save and verify

### Commands / edits

```
ncli rsyslog-config add-server name=Corp_Syslog ip-address=23.236.51.202 port=514 network-protocol=tcp relp-enabled=false
ncli rsyslog-config add-module server-name=Corp_Syslog module-name=ACROPOLIS level=INFO include-monitor-logs=true
ncli rsyslog-config set-status enable=true
ncli rsyslog-config ls-servers
ncli rsyslog-config ls-modules server-name=Corp_Syslog
```

### What loses the task

- UDP instead of TCP
- Port 6514 instead of 514
- relp-enabled=true (that is RELP, not plain TCP)
- Level ERROR when the task wants change events (INFO)
- Selecting every module (there is no AOS module in this build; VM events are ACROPOLIS)
- Configuring Cluster 2 as well
- Forgetting Include Monitor logs

### Examiner checklist (what a candidate must say)

- [ ] Name Corp_Syslog, IP 23.236.51.202
- [ ] TCP 514, not UDP, not 6514, RELP off
- [ ] Module ACROPOLIS only, level INFO, with Monitor logs
- [ ] Cluster 1 only

**Flash card:** `PE → Settings → Syslog; Corp_Syslog 23.236.51.202 TCP/514 relp off; module ACROPOLIS INFO + monitor logs; Cluster 1 only.`

## Task 8: Repair Security Policy.txt

**Runs in:** Desktop text editor (Notepad / Notepad++)

**Scenario.** A Flow policy export on the Desktop has values masked with xxxx placeholders. Restore it to the intended policies without changing structure, and keep the file name.

**Plain English.** A firewall rule export was handed over with some values blanked out as xxxx. The company wants the blanks filled in correctly without changing anything else in the file. You open the text file and fills in three rules: quarantine is the only one that actually blocks (APPLY) and isn't logged; the other two are watch-only (MONITOR) and logged. He saves it under the same name.

### Required values

| Item | Value |
| --- | --- |
| File | Security Policy.txt |
| Quarantine: hitlog / action / environment | false / APPLY / SecOps |
| SMB block: hitlog / action / tags | True / MONITOR / smbhost + smbclient |
| dn-policy1: ipv6 / action / protocol / hitlog | True / MONITOR / ALL / True |
| Only policy in APPLY mode | Quarantine |
| May you add or delete lines? | No |

### Order of work

1. Open Desktop\Security Policy.txt
2. Quarantine: is_policy_hitlog_enabled=false, action=APPLY, Environment=SecOps
3. SMB-block: hitlog=True, action=MONITOR, SMBv1 values smbhost then smbclient
4. dn-policy1: allow_ipv6_traffic=True, action=MONITOR, protocol=ALL, hitlog=True
5. Leave any placeholder the task says not to replace
6. Save with the same file name

### Commands / edits

```
Quarantine: is_policy_hitlog_enabled=false; action=APPLY; Environment=SecOps
SMB:        is_policy_hitlog_enabled=True;  action=MONITOR; SMBv1=smbhost, smbclient
DN:         allow_ipv6_traffic=True; action=MONITOR; protocol=ALL; is_policy_hitlog_enabled=True
```

### What loses the task

- Changing the JSON structure
- APPLY on a non-quarantine policy
- TCP instead of ALL for the DN policy
- Logging quarantine when it is the one exception
- Renaming the file

### Examiner checklist (what a candidate must say)

- [ ] Quarantine: hitlog false, APPLY, Environment SecOps
- [ ] SMB: hitlog True, MONITOR, smbhost and smbclient
- [ ] dn-policy1: IPv6 True, MONITOR, protocol ALL, hitlog True
- [ ] Only placeholders change; no lines added, removed or renamed file

**Flash card:** `Edit Security Policy.txt only; Quarantine false/APPLY/SecOps; SMB True/MONITOR/smbhost/smbclient; DN True/MONITOR/ALL/True.`

## Task 9: sql3532 per KB-3532

**Runs in:** Prism Element (Cluster 1) → VM → Update

**Scenario.** sql3532 was migrated from another platform and doesn't match the SQL Server standard. Reconfigure it: sizing, split SCSI disks, SSD preference, first to power on after node failure. Stays off.

**Plain English.** A SQL server moved from another platform doesn't follow the company's SQL standard. Fix it to match the internal KB article. It stays off. You resize it to 12 CPUs / 128 GB, gives it four separate SCSI disks (system, data, logs, temp) with sizes worked out from the requirements, turns on Flash Mode, and marks it to start first after a failure. No network card, no volume group.

### Required values

| Item | Value |
| --- | --- |
| vCPU / memory | 12 vCPU / 128 GB |
| OS / Data / Logs / TempDB disk sizes | 100 / 80 / 100 / 50 GB |
| Disk bus | SCSI |
| Volume group? | None |
| Network adapter? | None |
| Keep on SSD via | Flash Mode |
| Power-on priority setting in PE 6.10 | Agent VM |
| If a dedicated SQL container is required | compression on (0 delay), dedup off, erasure coding off |

### Order of work

1. Cluster 1 PE → VM → Table → sql3532 → Update
2. 12 vCPU, 128 GB; stay on the default container unless the task asks for a SQL container (then Storage → Containers: compression on with 0 delay, dedup off, erasure coding off)
3. Four SCSI disks in this order (AHV disks have no names; order is the label): scsi.0 OS 100, scsi.1 DATA 80, scsi.2 LOGS 100, scsi.3 TEMPDB 50
4. No volume group, no NIC
5. SSD preference = Update VM → Flash Mode checkbox
6. Agent VM option so it powers on before other VMs
7. Save; confirm still powered off

### Commands / edits

```
acli vm.get sql3532   # optional validation
```

### What loses the task

- Powering on the VM
- Creating a volume group
- Adding a NIC
- One big disk instead of the split layout
- Forgetting Flash Mode
- SATA/IDE instead of SCSI
- Enabling dedup or erasure coding on a SQL container

### Examiner checklist (what a candidate must say)

- [ ] 12 vCPU, 128 GB
- [ ] Disks: OS 100, Data 80 (4×20), Logs 100 (80+25%), TempDB 50, all SCSI
- [ ] Flash Mode on
- [ ] Agent VM so it powers on first
- [ ] No VG, no NIC, stays off

**Flash card:** `PE sql3532: 12 CPU/128 GB, OS 100, DATA 80, LOGS 100, TEMPDB 50, SCSI, Flash Mode, Agent VM, no VG/NIC, OFF.`

## Task 10: SCMA security hardening (Cluster 2)

**Runs in:** SSH to Cluster 2 CVM (ncli) + Prism Element Cluster 2 → Gear → Cluster Lockdown

**Scenario.** An audit found Cluster 2 on default security settings. Capture the current config first, enable AIDE weekly, high-strength passwords, change the AHV root password, and require SSH keys for CVM login. No reboots.

**Plain English.** A security audit found Cluster 2 using default settings. It needs to be hardened, but first the current state must be saved as evidence, and nothing can be rebooted. You SSH into a controller VM, dump the current security config (CVM and hypervisor) to a file first, then turn on a file-integrity checker (AIDE) weekly and strong passwords on both, change the host's root password last, then in Prism Element's Cluster Lockdown load the public key and uncheck password logins.

### Required values

| Item | Value |
| --- | --- |
| Output file captured BEFORE changes | task 10.txt |
| Commands that capture current config | ncli cluster get-cvm-security-config and get-hypervisor-security-config |
| AIDE schedule | weekly |
| AHV host IP (from the CVM) | 172.30.0.2 |
| Root password must match | admin user's password |
| Public key location | Desktop\Files\SSH |
| Key type to import | public key (.pub) |
| Where SSH keys are managed in PE | Gear → Cluster Lockdown |
| After importing the key | Uncheck Enable Remote Login with Password |

### Order of work

1. SSH to a Cluster 2 CVM as nutanix
2. ncli cluster get-cvm-security-config and get-hypervisor-security-config → paste both outputs to Desktop\task 10.txt BEFORE any change
3. edit-cvm-security-params and edit-hypervisor-security-params: enable-aide=true, schedule=weekly
4. edit-cvm-security-params and edit-hypervisor-security-params: enable-high-strength-password=true
5. ssh root@172.30.0.2 → passwd → set to the admin password (last of the CLI steps)
6. PE Cluster 2 → Gear → Cluster Lockdown → New Public Key → paste the contents of the .pub file from Desktop\Files\SSH → Save
7. Uncheck Enable Remote Login with Password → Save; validate; do not reboot

### Commands / edits

```
ncli cluster get-cvm-security-config
ncli cluster get-hypervisor-security-config
ncli cluster edit-cvm-security-params enable-aide=true
ncli cluster edit-cvm-security-params schedule=weekly
ncli cluster edit-cvm-security-params enable-high-strength-password=true
ncli cluster edit-hypervisor-security-params enable-aide=true
ncli cluster edit-hypervisor-security-params schedule=weekly
ncli cluster edit-hypervisor-security-params enable-high-strength-password=true
ssh root@172.30.0.2
passwd
```

### What loses the task

- Exporting task 10.txt after the changes
- Changing the AHV root password before the ncli security commands (do all ncli work first, root password last)
- Doing only the hypervisor side when the task says hypervisor and CVMs
- Using 192.168.x.x instead of 172.30.0.2
- Importing the private key instead of the public .pub key
- Unchecking password login before the key is imported (lockout)
- Rebooting anything

### Examiner checklist (what a candidate must say)

- [ ] Capture task 10.txt BEFORE any change, with get-cvm-security-config and get-hypervisor-security-config
- [ ] AIDE enabled weekly on CVMs and hypervisor
- [ ] High-strength passwords on both
- [ ] ssh root@172.30.0.2 then passwd, matching admin, as the last CLI step
- [ ] Gear → Cluster Lockdown: paste the .pub key, then uncheck Enable Remote Login with Password
- [ ] No reboot

**Flash card:** `Cluster 2: get-*-security-config to task 10.txt first; AIDE weekly + high-strength on cvm and hypervisor; root passwd; Cluster Lockdown: add .pub, uncheck password login.`

## Task 11: Immediate rebuild after planned reboot

**Runs in:** SSH to a Cluster 1 CVM (ncli)

**Scenario.** ACME does rolling host and CVM reboots in maintenance windows. Cluster 1 must start rebuilding resiliency immediately when a node goes down. Command line only. No reboots.

**Plain English.** When the company reboots machines for maintenance, the cluster normally waits a while before rebuilding lost data copies. They want it to start rebuilding immediately. One command over SSH on a Cluster 1 controller VM, then a second to verify. No spaces around the equals sign.

### Required values

| Item | Value |
| --- | --- |
| Full command | ncli cluster set-resiliency-preference desired-resiliency-preference=immediate |
| Verify with | ncli cluster get-resiliency-status |
| Spaces around the = sign? | No |

### Order of work

1. SSH to any Cluster 1 CVM (if you blank: type ncli cluster and press Tab twice to list subcommands)
2. ncli cluster set-resiliency-preference desired-resiliency-preference=immediate
3. ncli cluster get-resiliency-status to verify
4. Do not reboot hosts or CVMs

### Commands / edits

```
ncli cluster set-resiliency-preference desired-resiliency-preference=immediate
ncli cluster get-resiliency-status
ncli cluster get-resiliency-preference   # if available
```

### What loses the task

- Spaces around =
- Quoting immediate if the command rejects it
- Using the older rebuild-reservation command
- Not verifying

### Examiner checklist (what a candidate must say)

- [ ] ncli cluster set-resiliency-preference desired-resiliency-preference=immediate
- [ ] Verify with get-resiliency-status
- [ ] No reboot, nothing else changed

**Flash card:** `SSH → ncli cluster set-resiliency-preference desired-resiliency-preference=immediate.`

## Task 12: API JSON repair + Test_Deploy VM

**Runs in:** Prism Central → username menu (top right) → REST API Explorer; UUIDs from the API or from a CVM

**Scenario.** A colleague's API request file on the Desktop has errors and placeholders. Fix it, save under the same name, and create the VM through the v3 REST API. VM must stay off.

**Plain English.** Someone drafted a request to create a server through the programming interface (API) instead of the console, but left mistakes in it. Fix the request and use it to create the server, switched off. You grab the cluster's and network's ID numbers from a CVM (ncli cluster info, acli net.list), fix the JSON file (CPU, memory in MiB, disk in MiB, branding off, IDs in quotes), save it, open the REST API Explorer from your username menu in Prism Central, and send it. A 202 reply means it worked.

### Required values

| Item | Value |
| --- | --- |
| File | API_Create_VM.txt |
| Where REST API Explorer is | Click your username, top right of PC |
| Endpoint | POST /api/nutanix/v3/vms |
| Cluster UUID from the CLI | ncli cluster info \| grep -i uuid |
| Subnet UUID from the CLI | acli net.list |
| Find cluster UUID with (API) | POST /clusters/list {"kind":"cluster"} |
| num_sockets / memory_size_mib / disk_size_mib | 2 / 8192 / 51200 |
| disable_branding | true |
| metadata.kind | vm |
| Success HTTP status | 202 |
| Subnet name | default-net |

### Order of work

1. Get the UUIDs: SSH to a CVM → ncli cluster info | grep -i uuid, acli net.list (or POST /clusters/list and /subnets/list in the API Explorer)
2. Open Desktop\API_Create_VM.txt; fix num_sockets=2, memory 8192, disk 51200, disable_branding=true, metadata {"kind":"vm"}, UUIDs in quotes
3. Save with the same file name
4. PC → click your username (top right) → REST API Explorer → vms → POST /vms → Try it out
5. Paste the fixed JSON → Execute; confirm 202 Accepted
6. Verify Test_Deploy exists on Cluster 1, on default-net, powered off

### Commands / edits

```
ncli cluster info | grep -i uuid        # cluster UUID
acli net.list                           # subnet UUID
acli image.list                         # image UUID if the JSON needs one

POST /api/nutanix/v3/clusters/list   body: {"kind":"cluster"}
POST /api/nutanix/v3/subnets/list    body: {"kind":"subnet"}
POST /api/nutanix/v3/vms             body: fixed API_Create_VM.txt

"num_sockets": 2
"memory_size_mib": 8192
"disk_size_mib": 51200
"disable_branding": true
"metadata": {"kind": "vm"}
"uuid": "<Cluster-UUID>" / "<Subnet-UUID>"
```

### What loses the task

- Hunting for Postman; the lab has the REST API Explorer under your username
- Missing quotes around UUIDs
- metadata.kind left blank
- Using names where UUIDs are required
- Powering on the VM
- Saving under a different file name
- Wrong endpoint

### Examiner checklist (what a candidate must say)

- [ ] UUIDs from ncli cluster info / acli net.list (or the API list calls)
- [ ] num_sockets 2, memory 8192, disk 51200, disable_branding true, metadata.kind vm
- [ ] UUIDs in quotes; names don't work
- [ ] REST API Explorer is under the username menu, top right; POST /vms; expect 202
- [ ] Test_Deploy exists, powered off; file saved under the same name

**Flash card:** `UUIDs via ncli cluster info / acli net.list; fix API_Create_VM.txt; username → REST API Explorer → POST /vms → 202; Test_Deploy OFF.`

## Task 13: OpenSSL CSR with SAN

**Runs in:** SSH to a CVM (openssl); results copied to Desktop by cat → paste

**Scenario.** Security needs a CSR for the Prism Element certificate covering the cluster VIP and all three CVMs before the corporate CA will issue it. Save the config, the CSR, and the commands you ran.

**Plain English.** Websites and admin consoles prove who they are with certificates. To get one, you first write a request that lists every name the certificate should cover. The security team wants that request file. You write a small config file naming the main address plus three extra names (the SANs), runs a command-line tool called openssl to turn it into a request, verifies it, and saves the config, the request, and a log of what he typed onto the Desktop with exact file names.

### Required values

| Item | Value |
| --- | --- |
| Common Name | prism_element.ACME.org |
| SANs | cvm1.ACME.org, cvm2.ACME.org, cvm3.ACME.org |
| Country / State / Locality | US / North Carolina / Durham |
| Org / OU | ACME / Infrastructure |
| Key / digest | RSA 2048 / SHA-256 |
| Config file name | prism_element_acme.cnf |
| CSR file name | prism_element_acme.csr |
| Commands + output file | Task 13.txt |
| Get files to the Desktop by | cat → select → paste into Notepad |

### Order of work

1. SSH to a CVM
2. Write prism_element_acme.cnf: [req], [req_distinguished_name], [v3_req], [alt_names]
3. openssl req -new -nodes -sha256 … -config the .cnf → .csr (and .key)
4. openssl req -text -noout -verify -in the .csr; confirm SANs in the output
5. cat each file, select the text in the terminal, paste into Notepad, Save As the exact name on the Desktop
6. Paste commands and output into Desktop\Task 13.txt
7. Only if the task asks for a self-signed cert too: openssl x509 -req … -extensions v3_req -extfile the .cnf

### Commands / edits

```
[ req ]
default_bits = 2048
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no
[ req_distinguished_name ]
C = US
ST = North Carolina
L = Durham
O = ACME
OU = Infrastructure
CN = prism_element.ACME.org
emailAddress = administrator@ACME.org
[ v3_req ]
subjectAltName = @alt_names
[ alt_names ]
DNS.1 = cvm1.ACME.org
DNS.2 = cvm2.ACME.org
DNS.3 = cvm3.ACME.org

openssl req -new -nodes -out prism_element_acme.csr -keyout prism_element_acme.key -config prism_element_acme.cnf -sha256
openssl req -text -noout -verify -in prism_element_acme.csr

# only if a self-signed certificate is also required:
openssl x509 -req -days 1460 -in prism_element_acme.csr -signkey prism_element_acme.key -out prism_element_acme.crt -sha256 -extensions v3_req -extfile prism_element_acme.cnf
```

### What loses the task

- Forgetting the SANs (v3_req / alt_names)
- Trying to download the files instead of cat → copy → paste into Notepad
- Saving the key but not the CSR
- Wrong filename or path
- Not pasting output into Task 13.txt
- Using SHA1 instead of SHA-256

### Examiner checklist (what a candidate must say)

- [ ] Common name prism_element.ACME.org
- [ ] Three SANs: cvm1, cvm2, cvm3 .ACME.org
- [ ] RSA 2048 and SHA-256, not SHA1
- [ ] Files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt
- [ ] Verify the CSR and show the SANs in the output

**Flash card:** `OpenSSL CSR; files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt; cat → paste to get them onto the Desktop.`

## Task 14: IaaS capacity plan (3 waves)

**Runs in:** Prism Central → Operations → Planning → Scenarios (Nutanix Sizer at sizer.nutanix.com is the fallback)

**Scenario.** A new customer wants a cluster for general IaaS. Size it for 12 months with two-host-failure tolerance on HPE DX365-10-G11-NVMe full flash, three VM waves, and export the PDF.

**Plain English.** A new customer wants to know how many servers to buy. Prism Central has a planning tool that does the math if you describe the workload correctly. In Prism Central → Operations → Planning you create a scenario named IaaS for a brand-new cluster on one specific HPE model, say it must survive two hosts failing at once, plan 12 months ahead, describe the VMs, add three waves of growth, let it recommend a node count, and export the PDF with an exact name. Nutanix Sizer on the web is only the fallback.

### Required values

| Item | Value |
| --- | --- |
| Where the planning tool is | PC → Operations → Planning → Scenarios |
| Scenario name | IaaS |
| Target | New cluster |
| Hardware | HPE DX365-10-G11-NVMe |
| Resiliency | RF3 / 2 host failures |
| Runway | 12 months |
| Per-VM profile | 4 vCPU / 16 GB / 200 GB |
| Waves | 100 now, 50 at 3 months, 20 at 6 months |
| Export file | IaaS-requirement.pdf |

### Order of work

1. PC → Operations → Planning → Scenarios → + New Scenario, named IaaS
2. Target: New Cluster (not an existing one)
3. Hardware: vendor HPE, model DX365-10-G11-NVMe, full flash; leave the model's CPU/RAM/drives alone
4. Resiliency RF3 / 2 host failures; period 12 months
5. Workload: VMs at 4 vCPU / 16 GB / 200 GB; add 100 starting now, 50 starting in 3 months, 20 starting in 6 months
6. Recommend; take the smallest node count that satisfies it; save
7. Generate the PDF report → save as Desktop\IaaS-requirement.pdf
8. Fallback only if Planning is missing: sizer.nutanix.com directly (my.nutanix.com is blocked)

### What loses the task

- Hunting for Sizer when PC Planning does the whole task
- Using an existing cluster
- RF2
- Changing the hardware profile
- Forgetting a wave
- Wrong export filename
- Not exporting the PDF at all

### Examiner checklist (what a candidate must say)

- [ ] PC → Operations → Planning → Scenarios, not Sizer
- [ ] Scenario IaaS, new cluster, HPE DX365-10-G11-NVMe full flash, hardware untouched
- [ ] RF3 / 2 host failures, 12-month runway
- [ ] 4 vCPU / 16 GB / 200 GB per VM
- [ ] 100 now, 50 in 3 months, 20 in 6 months
- [ ] Smallest recommended node count
- [ ] Desktop\IaaS-requirement.pdf

**Flash card:** `PC → Operations → Planning: scenario IaaS, new cluster, HPE DX365-10-G11-NVMe, RF3, 12 months, 100/50/20 waves, PDF IaaS-requirement.pdf.`

## Task 15: SQL_Batch_Saturday report

**Runs in:** Prism Central → Operations → Reports

**Scenario.** The DBA team runs batch jobs on the SQL servers every Saturday and wants a weekly report showing whether the cluster or the VMs were the bottleneck. Generate one now and save the CSV ZIP to the Desktop.

**Plain English.** Database admins run heavy jobs every Saturday and want a weekly report showing whether the cluster or the servers were the slow part. In Prism Central Reports You build a report with a cluster section (peak CPU) and a VM section filtered to names starting with SQL (peak read latency and peak CPU-ready), schedules it for Sunday midnight over the last 7 days, emails it, then runs it once and saves the CSV ZIP.

### Required values

| Item | Value |
| --- | --- |
| Report name | SQL_Batch_Saturday |
| Cluster scope | Cluster 1 only |
| Cluster metric + aggregation | CPU used % , Maximum |
| VM filter type | Name starts with SQL (prefix) |
| VM metrics | Max I/O read latency; max CPU ready |
| Schedule | Sunday 12:00 AM |
| Time range | Previous 7 days |
| Recipient | dbateam@ACME.org |
| Export | CSV → ZIP on Desktop |

### Order of work

1. PC → Operations → Reports → new report SQL_Batch_Saturday
2. Cluster-level view for Cluster 1 only
3. Cluster metric: CPU Used %, aggregation Maximum
4. VM-level view; filter name prefix (starts with) SQL
5. VM metrics: I/O read latency (Maximum) and CPU Ready (Maximum)
6. Schedule weekly Sunday 12:00 AM, time range previous 7 days
7. Recipient dbateam@ACME.org; save
8. Generate an instance, export CSV, save the ZIP to Desktop

### What loses the task

- All clusters instead of Cluster 1
- Filter 'contains SQL' instead of prefix/starts-with
- Average instead of Maximum
- CPU Usage instead of CPU Ready for the VM metric
- Wrong time range
- Never generating and exporting the ZIP

### Examiner checklist (what a candidate must say)

- [ ] SQL_Batch_Saturday, Cluster 1 only
- [ ] Cluster metric: CPU used, Maximum
- [ ] VM filter: name starts with (prefix) SQL, not contains
- [ ] VM metrics: max I/O read latency, max CPU ready
- [ ] Sunday 12:00 AM, previous 7 days, dbateam@ACME.org
- [ ] Generate once, export CSV, ZIP on Desktop

**Flash card:** `PC Reports: SQL_Batch_Saturday, Cluster 1 max CPU, SQL* VMs max read latency + max CPU ready, Sunday 12AM previous 7 days, email DBA, CSV ZIP to Desktop.`

## Task 16: NCC suppression + Pulse alert tuning

**Runs in:** SSH to Cluster 1 CVM (ncc) + Prism Element → Health → Checks (search "pulse")

**Scenario.** Protection domain NoVMs intentionally has a schedule but no entities and must not be deleted. NCC keeps warning about it, and a 'Pulse is not enabled' alert is active. Quiet both without disabling Pulse or any other check.

**Plain English.** A health check keeps complaining about a protection domain that is intentionally empty, and there's a nagging alert about Pulse (phone-home telemetry). Quiet both without turning anything important off. You disable exactly one NCC check over SSH, then in Prism Element sets the Pulse alert to log messages but not alert, and resolves the alert that's already showing.

### Required values

| Item | Value |
| --- | --- |
| NCC check to disable | backup_schedule_check |
| NCC path | health_checks data_protection_checks protection_domain_checks backup_schedule_check |
| Delete NoVMs PD? | No |
| Where the Pulse check lives in PE | Health → Checks → search pulse → Pulse enablement check |
| Pulse alert: messages / alert | Messages recorded, alert disabled |
| Last step | Resolve the active Pulse alert |

### Order of work

1. SSH to a Cluster 1 CVM
2. Run ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check to confirm it is the one
3. Disable only that check
4. PE Cluster 1 → Health → Checks → search pulse → open the Pulse enablement check
5. Turn its alert off while leaving messages/logging on (do not disable Pulse itself)
6. Alerts → resolve the existing Pulse alert
7. Validate: no backup_schedule_check warning, Pulse alert resolved

### Commands / edits

```
ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check
ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check --disable   # syntax varies; ncc --help
ncc health_checks list_disabled
```

### What loses the task

- Deleting the NoVMs protection domain
- Disabling Pulse itself
- Suppressing all NCC checks
- Turning off logging/messages
- Not resolving the active alert

### Examiner checklist (what a candidate must say)

- [ ] Only backup_schedule_check disabled
- [ ] NoVMs PD is not deleted
- [ ] Pulse stays enabled; messages recorded, alert off
- [ ] Resolve the existing alert

**Flash card:** `Cluster 1: suppress backup_schedule_check only; Health → Checks → pulse enablement check: messages yes, alert no; resolve existing alert.`

## Task 17: DR remote site + protection domain

**Runs in:** Prism Element → Data Protection, on Cluster 1 and then Cluster 2

**Scenario.** Cluster 1 is production, Cluster 2 is DR. Web-Prod, App-Prod and DB-Prod must recover on Cluster 2 as one consistent unit and fail back afterward. Every object name must include Task17.

**Plain English.** If the main datacenter dies, a three-part app (web, app, database) must come back on a second cluster together, from the same moment in time, and be able to move back later. You tell each cluster about the other as a remote site over a dedicated replication network, cap the bandwidth so it doesn't flood the link, map the networks, and put all three servers in one protection domain with a snapshot schedule and two days of retention on each side. Everything you name must contain Task17.

### Required values

| Item | Value |
| --- | --- |
| Required string in object names | Task17 |
| Replication network | 172.30.0.x DR addresses |
| Remote site type | Physical Cluster |
| Bandwidth limit | 10 MB/sec |
| Local / remote retention | 2 days / 2 days |
| How many protection domains | One, with all three VMs |
| PD type | Async DR |
| Failback setting | Remote site configured on both clusters (reverse replication) |
| Fix if PE throws DR errors | Restart cerebro |

### Order of work

1. Cluster 1 PE → Data Protection → Table → + Remote Site → Physical Cluster
2. Name with Task17; capability Disaster Recovery; address = Cluster 2 CVM/VIP on the 172.30.0.x DR network
3. Bandwidth throttling 10 MB/sec (10240 KB/sec if the field is KB); Network Mapping source → destination
4. Repeat the remote site on Cluster 2 pointing back at Cluster 1 (this is what allows failback)
5. Cluster 1 → + Protection Domain → Async DR → name with Task17
6. Protect Selected Entities: Web-Prod, App-Prod, DB-Prod together
7. New Schedule: tightest RPO allowed (15-min async), retention 2 local / 2 remote, remote site = the Task17 site
8. Save; verify remote site and PD healthy; if PE errors, restart cerebro

### Commands / edits

```
allssh genesis stop cerebro
cluster start
```

### What loses the task

- Using the external IP instead of the 172.30.0.x DR IP
- Creating the remote site on Cluster 1 only (no failback)
- One PD per VM instead of one PD for all three
- Leaving Task17 out of a name
- Leaving bandwidth unlimited
- Skipping network mapping
- Not restarting cerebro when PE errors

### Examiner checklist (what a candidate must say)

- [ ] Task17 in every object name
- [ ] Remote site is Physical Cluster type, on the 172.30.0.x DR address, not the external one
- [ ] Remote site configured on both clusters (that's the failback)
- [ ] 10 MB/sec bandwidth cap, network mapping set
- [ ] One Async DR protection domain with all three VMs
- [ ] 2 days local, 2 days remote
- [ ] If PE errors: restart cerebro

**Flash card:** `PE DR: Task17 remote site on both clusters (Physical, DR IP, 10 MB/sec, network mapping) + one Task17 Async DR PD for Web/App/DB, 2 days local/remote.`

## Appendix A: Command reference

| Task | Command | Purpose |
| --- | --- | --- |
| 1 | `acli vm.get SQL01` | Inspect SQL01 disk bus and power state |
| 1 | `acli vm.get SQL02` | Inspect SQL02; find the slow disk bus |
| 1 | `acli vm.disk_create SQL02 clone_from_vmdisk=<UUID> bus=scsi` | Clone the SATA disk as a SCSI disk |
| 1 | `acli vm.disk_delete SQL02 disk_addr=sata.0` | Remove the old SATA/IDE disk |
| 10 | `ncli cluster get-cvm-security-config` | Capture current CVM SCMA config BEFORE changes → Desktop\task 10.txt |
| 10 | `ncli cluster get-hypervisor-security-config` | Capture current hypervisor SCMA config → same file |
| 10 | `ncli cluster edit-cvm-security-params enable-aide=true` | Enable AIDE on the CVMs |
| 10 | `ncli cluster edit-cvm-security-params schedule=weekly` | CVM AIDE schedule weekly |
| 10 | `ncli cluster edit-cvm-security-params enable-high-strength-password=true` | High-strength passwords on the CVMs |
| 10 | `ncli cluster edit-hypervisor-security-params enable-aide=true` | Enable AIDE on the hypervisor |
| 10 | `ncli cluster edit-hypervisor-security-params schedule=weekly` | Hypervisor AIDE schedule weekly |
| 10 | `ncli cluster edit-hypervisor-security-params enable-high-strength-password=true` | High-strength passwords on the hypervisor |
| 10 | `ssh root@172.30.0.2` | Hop to the AHV host from the CVM (after all ncli work) |
| 10 | `passwd` | Set AHV root password to match admin |
| 11 | `ncli cluster set-resiliency-preference desired-resiliency-preference=immediate` | Rebuild immediately after a node goes down |
| 11 | `ncli cluster get-resiliency-status` | Verify |
| 12 | `POST /api/nutanix/v3/clusters/list {"kind":"cluster"}` | Find Cluster 1 UUID (API list call, or ncli cluster info \| grep -i uuid on a CVM) |
| 12 | `POST /api/nutanix/v3/subnets/list {"kind":"subnet"}` | Find default-net UUID (API list call, or acli net.list on a CVM) |
| 12 | `POST /api/nutanix/v3/vms` | Create Test_Deploy from the fixed API_Create_VM.txt (username → REST API Explorer → vms → POST → Try it out) |
| 13 | `cat > prism_element_acme.cnf <<'EOF'` | Create the OpenSSL config ([req], [req_distinguished_name], [v3_req], [alt_names]) |
| 13 | `openssl req -new -nodes -out prism_element_acme.csr -keyout prism_element_acme.key -config prism_element_acme.cnf -sha256` | Generate the CSR, RSA 2048 / SHA-256 |
| 13 | `openssl req -text -noout -verify -in prism_element_acme.csr` | Verify the CSR and confirm SANs |
| 16 | `ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check` | Run / locate the single check |
| 16 | `ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check --disable` | Disable only that check (syntax varies; ncc --help) |
| 16 | `ncc health_checks list_disabled` | Confirm only that check is off |
| 17 | `allssh genesis stop cerebro` | Stop cerebro on every CVM when PE DR config errors out |
| 17 | `cluster start` | Restart stopped services |

## Appendix B: Glossary

- **Cluster** — A group of physical servers working as one pool of compute and storage.
- **VM** — Virtual machine: a computer made of software, running on the cluster.
- **CVM** — Controller VM: the special VM on each server that runs Nutanix's storage software. Admins SSH into it to run commands.
- **Prism Element (PE)** — The console for one cluster. Local things: VMs on that cluster, storage, DR, syslog, health checks.
- **Prism Central (PC)** — The console that sees all clusters. Cross-cluster things: analysis, reports, categories, policies, the API.
- **SSH** — A text terminal connection to a server. Faster than clicking around in a slow web console.
- **ncli / acli / ncc** — Nutanix command-line tools: ncli for cluster settings, acli for VMs and disks, ncc for health checks.
- **SCSI vs IDE/SATA** — Ways a virtual disk is attached. SCSI is the fast modern one; IDE/SATA is the slow compatibility one.
- **Volume group** — A set of virtual disks that can be shared with VMs, used for databases.
- **Flash Mode** — Pins a VM's or volume group's data to SSDs so it stays fast.
- **Snapshot** — A saved point-in-time copy of a VM's data.
- **Protection domain** — A group of VMs snapshotted together on a schedule and replicated to another cluster for disaster recovery.
- **RPO** — How much data you can afford to lose, measured in time. 15 minutes means snapshots every 15 minutes.
- **Category / policy** — A label on a VM, and a rule that does something to every VM with that label.
- **Template** — A VM frozen as a blueprint, so new VMs can be stamped from it.
- **Syslog** — A standard way to ship log lines to a central server.
- **NCC** — Nutanix Cluster Check: hundreds of health checks that raise alerts.
- **Pulse** — Nutanix's phone-home telemetry.
- **API / JSON / UUID** — Talking to the system with structured text instead of clicks; JSON is the text format; a UUID is an object's unique ID number.
- **CSR / SAN** — Certificate signing request, and the extra names a certificate should cover.
- **Sizer** — Nutanix's tool for working out how many servers a workload needs.
- **Inode** — A slot in a filesystem for one file; run out and you can't create files even with free space.
