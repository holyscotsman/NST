# NCM-MCI 6.10 Practice Exam — Task Sheet (v2)

Updated 2026-10-24 from the Guided Practice site. Exam-style wording: scenario and required values, no procedure. Numbering follows the lab (file names Task 1.txt, task 10.txt, Task 13.txt and the Task17 object names fix 1, 10, 13, 17; 2, 6 and 9 are inferred).

Standing rules: do not power on any VM unless told; change nothing the task does not name; names, file names and paths must match exactly; lab topology and credentials come from the lab.

## Task 1 — SQL01 vs SQL02 analysis + fix SQL02

The DBA team says SQL02 performs worse than SQL01 though both came from the same image. Both VMs are off and must stay off. Compare them, save the analysis and a scheduled report, capture the page to a text file, and fix SQL02.

| Requirement | Value |
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

## Task 2 — NEWSQL write-intensive VM

New write-heavy MS-SQL workload on Cluster 1. Create the VM for maximum production storage performance; every object name includes NEWSQL. No network, stays off, do not touch Storage Policies.

| Requirement | Value |
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

## Task 3 — Category + storage encryption policy

Admins should be able to opt a VM into software encryption by tagging it. Some VMs will later sit on self-encrypting drives and must be distinguishable by the same category.

| Requirement | Value |
| --- | --- |
| Category name | VM-Storage |
| Category values (two) | softwareencrypted, SEDencrypted |
| Storage policy name | Encrypted-Storage |
| Policy matches which value | softwareencrypted |
| Policy action | Encrypt VM storage |

## Task 4 — Database_VM volume group optimization

Database_VM was migrated with a volume group attached. Tune that VG for best performance in a production multi-node cluster. Use the existing VG, add no disks, VM stays off.

| Requirement | Value |
| --- | --- |
| Setting that spreads VG I/O across nodes | Load balancing |
| What must happen before you can change it | Detach the VM (Manage Connections → remove) |
| After enabling it | Re-attach the VM (Manage Connections → add) |
| Where | Storage → Volume Groups → right-click VG → Manage Connections / Update |
| VM power state | OFF |
| Create a new VG? | No |

## Task 5 — Small VM template + SMTP + NCC reports

ACME standardizes VM sizing on NVD-2031. Build the small profile VM, template it, and make Cluster 1 email alerts and NCC reports.

| Requirement | Value |
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

## Task 6 — Inode threshold tuning

After a CVM ran out of inodes, ACME wants earlier warning on Cluster 1 and the condition to stay visible until an admin clears it. Change only the inode check.

| Requirement | Value |
| --- | --- |
| How to find the check | Health → Checks → search inode |
| Warning threshold | 45% |
| Critical threshold | 60% |
| Check interval | every 1 minute |
| Auto-resolve | disabled |
| Disable the check instead of tuning? | No |

## Task 7 — Corp_Syslog

Security operations collects VM lifecycle events from Cluster 1 on a central syslog server. Forward only those logs.

| Requirement | Value |
| --- | --- |
| Server name | Corp_Syslog |
| IP address | 23.236.51.202 |
| Protocol / port | TCP / 514 |
| Log module (VM lifecycle events) | ACROPOLIS, with Monitor logs included |
| relp-enabled value for plain TCP | false |
| Which cluster | Cluster 1 only |

## Task 8 — Repair Security Policy.txt

A Flow policy export on the Desktop has values masked with xxxx placeholders. Restore it to the intended policies without changing structure, and keep the file name.

| Requirement | Value |
| --- | --- |
| File | Security Policy.txt |
| Quarantine: hitlog / action / environment | false / APPLY / SecOps |
| SMB block: hitlog / action / tags | True / MONITOR / smbhost + smbclient |
| dn-policy1: ipv6 / action / protocol / hitlog | True / MONITOR / ALL / True |
| Only policy in APPLY mode | Quarantine |
| May you add or delete lines? | No |

## Task 9 — sql3532 per KB-3532

sql3532 was migrated from another platform and doesn't match the SQL Server standard. Reconfigure it: sizing, split SCSI disks, SSD preference, first to power on after node failure. Stays off.

| Requirement | Value |
| --- | --- |
| vCPU / memory | 12 vCPU / 128 GB |
| OS / Data / Logs / TempDB disk sizes | 100 / 80 / 100 / 50 GB |
| Disk bus | SCSI |
| Volume group? | None |
| Network adapter? | None |
| Keep on SSD via | Flash Mode |
| Power-on priority setting in PE 6.10 | Agent VM |
| If a dedicated SQL container is required | compression on (0 delay), dedup off, erasure coding off |

## Task 10 — SCMA security hardening (Cluster 2)

An audit found Cluster 2 on default security settings. Capture the current config first, enable AIDE weekly, high-strength passwords, change the AHV root password, and require SSH keys for CVM login. No reboots.

| Requirement | Value |
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

## Task 11 — Immediate rebuild after planned reboot

ACME does rolling host and CVM reboots in maintenance windows. Cluster 1 must start rebuilding resiliency immediately when a node goes down. Command line only. No reboots.

| Requirement | Value |
| --- | --- |
| Full command | ncli cluster set-resiliency-preference desired-resiliency-preference=immediate |
| Verify with | ncli cluster get-resiliency-status |
| Spaces around the = sign? | No |

## Task 12 — API JSON repair + Test_Deploy VM

A colleague's API request file on the Desktop has errors and placeholders. Fix it, save under the same name, and create the VM through the v3 REST API. VM must stay off.

| Requirement | Value |
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

## Task 13 — OpenSSL CSR with SAN

Security needs a CSR for the Prism Element certificate covering the cluster VIP and all three CVMs before the corporate CA will issue it. Save the config, the CSR, and the commands you ran.

| Requirement | Value |
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

## Task 14 — IaaS capacity plan (3 waves)

A new customer wants a cluster for general IaaS. Size it for 12 months with two-host-failure tolerance on HPE DX365-10-G11-NVMe full flash, three VM waves, and export the PDF.

| Requirement | Value |
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

## Task 15 — SQL_Batch_Saturday report

The DBA team runs batch jobs on the SQL servers every Saturday and wants a weekly report showing whether the cluster or the VMs were the bottleneck. Generate one now and save the CSV ZIP to the Desktop.

| Requirement | Value |
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

## Task 16 — NCC suppression + Pulse alert tuning

Protection domain NoVMs intentionally has a schedule but no entities and must not be deleted. NCC keeps warning about it, and a 'Pulse is not enabled' alert is active. Quiet both without disabling Pulse or any other check.

| Requirement | Value |
| --- | --- |
| NCC check to disable | backup_schedule_check |
| NCC path | health_checks data_protection_checks protection_domain_checks backup_schedule_check |
| Delete NoVMs PD? | No |
| Where the Pulse check lives in PE | Health → Checks → search pulse → Pulse enablement check |
| Pulse alert: messages / alert | Messages recorded, alert disabled |
| Last step | Resolve the active Pulse alert |

## Task 17 — DR remote site + protection domain

Cluster 1 is production, Cluster 2 is DR. Web-Prod, App-Prod and DB-Prod must recover on Cluster 2 as one consistent unit and fail back afterward. Every object name must include Task17.

| Requirement | Value |
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

## Self-check key (cover until attempted)

| # | Runs in | One line |
| --- | --- | --- |
| 1 | Prism Central | PC Analysis (3 IO charts) + Report + Desktop Task 1.txt + SQL02 disk cloned to SCSI; leave SQL01/SQL02 OFF. |
| 2 | Prism Element | PE: NEWSQL_VM 12/128, 100 GB OS; NEWSQL_VG 750 GB on a container with room, load balancing + Flash Mode, attached; no NIC, OFF. |
| 3 | Prism Central | PC → Categories + Storage Policy; VM-Storage has two values, policy uses softwareencrypted. |
| 4 | Prism Central | VG → Manage Connections: detach VM → Update: enable Load Balancing → re-attach VM; VM OFF. |
| 5 | Prism Element | PE Create Small VM (2/8/125) → PC Create VM Template Small Template → PE SMTP + Alert Email + Set NCC Frequency. |
| 6 | Prism Element | PE Health → Checks → inode: warning 45%, critical 60%, every minute, no auto-resolve. |
| 7 | Prism Element | PE → Settings → Syslog; Corp_Syslog 23.236.51.202 TCP/514 relp off; module ACROPOLIS INFO + monitor logs; Cluster 1 only. |
| 8 | Desktop text editor | Edit Security Policy.txt only; Quarantine false/APPLY/SecOps; SMB True/MONITOR/smbhost/smbclient; DN True/MONITOR/ALL/True. |
| 9 | Prism Element | PE sql3532: 12 CPU/128 GB, OS 100, DATA 80, LOGS 100, TEMPDB 50, SCSI, Flash Mode, Agent VM, no VG/NIC, OFF. |
| 10 | SSH / CLI | Cluster 2: get-*-security-config to task 10.txt first; AIDE weekly + high-strength on cvm and hypervisor; root passwd; Cluster Lockdown: add .pub, uncheck password login. |
| 11 | SSH / CLI | SSH → ncli cluster set-resiliency-preference desired-resiliency-preference=immediate. |
| 12 | PC API Explorer | UUIDs via ncli cluster info / acli net.list; fix API_Create_VM.txt; username → REST API Explorer → POST /vms → 202; Test_Deploy OFF. |
| 13 | SSH / CLI | OpenSSL CSR; files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt; cat → paste to get them onto the Desktop. |
| 14 | Prism Central | PC → Operations → Planning: scenario IaaS, new cluster, HPE DX365-10-G11-NVMe, RF3, 12 months, 100/50/20 waves, PDF IaaS-requirement.pdf. |
| 15 | Prism Central | PC Reports: SQL_Batch_Saturday, Cluster 1 max CPU, SQL* VMs max read latency + max CPU ready, Sunday 12AM previous 7 days, email DBA, CSV ZIP to Desktop. |
| 16 | SSH / CLI | Cluster 1: suppress backup_schedule_check only; Health → Checks → pulse enablement check: messages yes, alert no; resolve existing alert. |
| 17 | Prism Element | PE DR: Task17 remote site on both clusters (Physical, DR IP, 10 MB/sec, network mapping) + one Task17 Async DR PD for Web/App/DB, 2 days local/remote. |
