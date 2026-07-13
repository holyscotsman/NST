# Priority question bank — Nutanix NCP-MCI practice exam

Owner-provided practice-exam questions (compiled from screenshots, 2026-07-11).
These are the **priority** set: mastery selection surfaces them first, so the
player drills and graduates them ahead of the rest of the bank.

- The **answer keys and explanations are owner-authored** — the `[x]` mark is
  authoritative; the game never uses AI to decide correctness (CLAUDE.md §4).
- `Domain` and `Difficulty` tags are an ingestion classification (they slot each
  question into a tier); they are flagged for owner confirmation in `FLAGS.md`.
- Merge into the shipped bank with:
  `node scripts/import-questions.mjs docs/priority-question-bank.md --merge`

---

## Q1 — single datastore ESXi HA advanced option
- **Domain:** foundation
- **Difficulty:** hard
- **ID:** NPX-H-001
- **Priority:** yes

**Question:** If a Nutanix cluster that has been deployed using ESXi is only
using one datastore, which advanced option needs to be set during the initial
cluster deployment?

- [ ] `das.ignoreInsufficientHbDatastore` with Value of `false`
- [ ] `das.ignoreInsufficientHbDatastore` with Value of `0`
- [ ] `das.ignoreInsufficientHbDatastore` with Value of `1`
- [x] `das.ignoreInsufficientHbDatastore` with Value of `true`

**Explanation:** With only one Nutanix datastore, vSphere HA reports an
insufficient-heartbeat-datastores warning unless the advanced option
`das.ignoreInsufficientHbDatastore = true` is set. Recommended vSphere
availability settings also include enabling host monitoring and using
percentage-based admission control sized to the number of nodes.
**Reference:** vSphere HA — Admission Control & heartbeat datastores

## Q2 — default passwords to change (ESXi)
- **Domain:** security
- **Difficulty:** easy
- **ID:** NPX-E-001
- **Priority:** yes

**Question:** To improve security on a newly created vSphere-based Nutanix
cluster, which two default passwords should be changed? (Choose two)

- [x] root user on ESXi
- [ ] nutanix user on vCenter
- [x] nutanix user on the CVM
- [ ] root user on Prism Central

**Explanation:** Nutanix recommends changing the default passwords, including the
Controller VM (CVM) local `nutanix` account and the hypervisor's local account —
for ESXi that is the local `root` user. (Other accounts to change elsewhere
include AHV root/admin/nutanix, Hyper-V administrator, Prism Central admin +
nutanix, IPMI ADMIN, and FSVM nutanix.)

## Q3 — LCM pre-check failure logs
- **Domain:** lifecycle
- **Difficulty:** hard
- **ID:** NPX-H-002
- **Priority:** yes

**Question:** After triggering a set of LCM updates, an administrator notices a
failure message in Prism during the pre-checks, but it lacks enough detail to
isolate the cause. Which two logs should be investigated on the CVM? (Choose two)

- [ ] `stargate.out`
- [x] `lcm_ops.out`
- [x] `genesis.out`
- [ ] `lcm_wget.out`

**Explanation:** Before an update LCM runs pre-checks and stops if any fail. LCM
writes all operations to `genesis.out`, `lcm_ops.out`, `lcm_ops.trace`, and
`lcm_wget.log`; `lcm_ops.out` and `genesis.out` carry the pre-check context.

## Q4 — exit maintenance mode (CVM + node)
- **Domain:** prism
- **Difficulty:** hard
- **ID:** NPX-H-003
- **Priority:** yes

**Question:** Which two CLI commands are required to take the CVM and the node
out of maintenance mode? (Choose two.)

- [x] `acli host.exit_maintenance_mode host-ip`
- [x] `ncli host edit id=host-ID enable-maintenance-mode=false`
- [ ] `acli host.disable_maintenance_mode host-ip`
- [ ] `ncli host edit id=host-ID disable-maintenance-mode=true`

**Explanation:** Remove the CVM from maintenance mode with
`ncli host edit id=host-ID enable-maintenance-mode=false` (after finding the ID
via `ncli host list`), then remove the node with
`acli host.exit_maintenance_mode host-ip` and verify with `acli host.get`.

## Q5 — DSF performance acceleration features
- **Domain:** storage
- **Difficulty:** medium
- **ID:** NPX-M-001
- **Priority:** yes

**Question:** Which terms describe performance acceleration features of the
Distributed Storage Fabric?

- [ ] Extent Groups, vDisk flash mode and AHV Turbo
- [x] Intelligent Tiering, Data Locality and Automatic Disk Balancing
- [ ] Erasure Coding, vDisk flash mode and Autonomous Extent Store
- [ ] Deduplication, Compression and Erasure Coding

**Explanation:** DSF accelerates performance with Intelligent Tiering (moves data
between SSD and HDD by access pattern), Data Locality (VM data kept on the node
running the VM, following it on migration), and Automatic Disk Balancing (keeps
utilization uniform across the cluster).

## Q6 — AES bypasses the OpLog
- **Domain:** storage
- **Difficulty:** hard
- **ID:** NPX-H-004
- **Priority:** yes

**Question:** The Autonomous Extent Store will bypass the OpLog in which workload
scenario?

- [ ] Sequential Read
- [ ] Sequential Write
- [x] Sustained Random Write
- [ ] Sustained Random Read

**Explanation:** For sustained random write workloads, AES writes directly to the
Extent Store, bypassing the OpLog. Bursty random workloads still take the OpLog
path and drain to the Extent Store via AES where possible.

## Q7 — cache dedup VDI workloads
- **Domain:** storage
- **Difficulty:** medium
- **ID:** NPX-M-002
- **Priority:** yes

**Question:** What two types of VDI workloads benefit from enabling cache
deduplication? (Choose two)

- [ ] VAAI Clone
- [x] Persistent Desktops
- [x] Full Clone
- [ ] Linked Clone

**Explanation:** Cache (inline read-cache) deduplication is recommended for
full-clone, persistent-desktop, and physical-to-virtual use cases (CVMs need at
least 24 GB RAM). It is not recommended for VAAI clone or linked-clone
environments.

## Q8 — RF2 4-node full-clone VDI container
- **Domain:** storage
- **Difficulty:** medium
- **ID:** NPX-M-003
- **Priority:** yes

**Question:** An administrator is preparing an RF2 4-node cluster to deploy a VDI
project consisting of full clones. Which action should the administrator take to
support this workload?

- [ ] Create a dedicated storage pool with the default storage efficiency configuration.
- [x] Create a dedicated storage container with inline compression and deduplication.
- [ ] Set cluster redundancy to RF3 to support Erasure Coding in a new Storage Container.
- [ ] Add one node to the cluster and enable Erasure coding in a new Storage Container.

**Explanation:** Nutanix recommends inline compression for most workloads and
disabling deduplication except for VDI. For a VDI full-clone project, create a
dedicated storage container with inline compression and deduplication enabled.

## Q9 — low-priority VMs on 1G uplinks
- **Domain:** networking
- **Difficulty:** hard
- **ID:** NPX-H-005
- **Priority:** yes

**Question:** A company wants a few lower-priority VMs to communicate through 1G
uplinks only. How could the company achieve this while still maintaining maximum
throughput for the other mission-critical VMs?

- [ ] Add all available uplinks to br0 and configure LACP.
- [ ] Add all available uplinks to br0 and configure balance-slb.
- [x] Create vs1 with 1G uplinks and assign the lower priority VMs a network on br1.
- [ ] Create vs0 with 1G uplinks and assign the lower priority VMs a network on br1.

**Explanation:** Create a new virtual switch (vs1) built on the 1G uplink
interfaces (bridge br1) and place the lower-priority VMs there, keeping the
mission-critical VMs on a virtual switch with faster uplinks so their throughput
is unaffected.

## Q10 — bandwidth across multiple links
- **Domain:** networking
- **Difficulty:** medium
- **ID:** NPX-M-004
- **Priority:** yes

**Question:** What is the Nutanix recommended configuration for taking full
advantage of the bandwidth provided by multiple links?

- [ ] No Uplink Bond
- [ ] Active-Active with MAC Pinning
- [ ] Active-Backup
- [x] Active-Active

**Explanation:** Active-Active (Balance-TCP) lets VMs send traffic across
multiple uplink interfaces, aggregating their bandwidth. Active-Backup uses one
uplink at a time, MAC pinning (Balance-SLB) pins a vNIC to a single uplink, and
No Uplink Bond uses only one uplink — none aggregate bandwidth like Active-Active.

## Q11 — collect node MAC address
- **Domain:** networking
- **Difficulty:** medium
- **ID:** NPX-M-005
- **Priority:** yes

**Question:** An administrator wants to script a network map of which nodes/NICs
connect to which switches/ports using MAC addresses. What is the most efficient
way to collect the node MAC address?

- [ ] Using the network configuration in Prism Element.
- [x] Use the `ethtool` command via `cli`.
- [ ] Use the `manage_ovs` command via `cli`.
- [ ] Use the IPMI interface collect HW data.

**Explanation:** On the AHV host, `ethtool -P ethX` prints the permanent
(hardware) MAC address of the interface — scriptable and efficient. (`ifconfig
ethX` also shows the HWaddr along with interface statistics.)

## Q12 — per-report customization
- **Domain:** prism
- **Difficulty:** medium
- **ID:** NPX-M-006
- **Priority:** yes

**Question:** An administrator needs to customize report settings, such as
appearance and retention format, differentiated for each corporate business
unit. Where should these customizations be configured?

- [ ] In the main **Report Setting** in Prism Central Reports
- [ ] In Prism Central Settings, **UI Settings**
- [ ] In Nutanix Cloud Manager Operation Policies
- [x] In **Report Settings** for each report

**Explanation:** Report settings can be applied globally (all reports) or per
report. To differentiate per business unit, configure the settings for each
individual report — the report-level setting takes precedence over the global one.

## Q13 — compare two VMs for constraint
- **Domain:** monitoring
- **Difficulty:** medium
- **ID:** NPX-M-007
- **Priority:** yes

**Question:** An administrator needs to compare two VMs to see if one is resource
constrained. Which two chart types can provide this information? (Choose two)

- [x] Entity Chart for each VM showing its CPU Ready %
- [x] Metric chart showing each VM's CPU Usage %
- [ ] Metric chart showing cluster CPU Usage %
- [ ] Entity chart for each VM's host showing Hypervisor CPU Usage %

**Explanation:** Entity charts track one or more metrics for a single entity (per
VM — CPU Ready %); Metric charts track a single metric across one or more entities
(CPU Usage % for both VMs). The host- and cluster-level charts don't isolate the
two VMs.

## Q14 — track a recurring CPU spike
- **Domain:** monitoring
- **Difficulty:** medium
- **ID:** NPX-M-008
- **Priority:** yes

**Question:** After an update, a VM's CPU usage spikes to 100% every 60–120
minutes, against a normal weekday/weekend band. In which two locations should the
administrator look to track this behavior? (Choose two)

- [ ] In the VM details Alert tab.
- [x] In the Event dashboard.
- [x] In the VM details Metrics tab.
- [ ] In the Alerts dashboard.

**Explanation:** Anomaly detection learns a normal behavior band per metric and
flags outliers as events. Anomalies appear in the behavioral-anomaly Event
details and on the VM details Metrics tab.

## Q15 — add vCPUs?
- **Domain:** performance
- **Difficulty:** hard
- **ID:** NPX-H-006
- **Priority:** yes

**Question:** An application is not performing well. The VM has 1 vCPU with 2
vCores; Prism shows 50% CPU usage and 0 CPU Ready. Which action should be taken?

- [ ] Do not add vCPUs because the cluster is already overcommitted.
- [ ] Add 1 vCPU with 2 vCores to ensure vNUMA support.
- [x] Do not add vCPUs because the application does not support SMP.
- [ ] Add 2 vCores to double VM computing power.

**Explanation:** At only 50% CPU usage and 0 CPU Ready, the VM is not waiting on
CPU scheduling and would gain nothing from more processors — the application
cannot use additional CPUs because it does not support SMP (Symmetric
Multi-Processing).

## Q16 — inefficient VM profile: bully
- **Domain:** monitoring
- **Difficulty:** hard
- **ID:** NPX-H-007
- **Priority:** yes

**Question:** Which Inefficient VM Profile type is used to identify a VM with
Host I/O Stargate CPU usage > 85%?

- [ ] Over-provisioned VM
- [x] Bully
- [ ] Inactive VM
- [ ] Constrained VM

**Explanation:** A bully VM consumes so many resources that others starve. It is
flagged when, for over an hour, it shows CPU ready time > 5%, memory swap rate
> 0 Kbps, or Host I/O Stargate CPU usage > 85%.

## Q17 — forward AHV logs to a syslog server
- **Domain:** monitoring
- **Difficulty:** hard
- **ID:** NPX-H-008
- **Priority:** yes

**Question:** An administrator must configure an AHV cluster to forward all
system logs to a central log server. What two steps need to be taken? (Choose two)

- [x] Determine which modules and log levels need to be forwarded.
- [x] Configure `rsyslog-config` via `ncli`.
- [ ] Install the Splunk Agent for AHV.
- [ ] Configure `rsyslog` forwarding via Prism Element.

**Explanation:** Use the nCLI `rsyslog-config` command to forward logs: add the
server, then add a module specifying which modules and log levels to forward, and
enable it. It cannot be configured in Prism Element (only Prism Central or the
CVM's ncli), and no Splunk agent is required.

## Q18 — service that controls all I/O
- **Domain:** storage
- **Difficulty:** easy
- **ID:** NPX-E-002
- **Priority:** yes

**Question:** Which service controls all I/O in the Nutanix cluster?

- [x] Stargate
- [ ] Zookeeper
- [ ] Curator
- [ ] Genesis

**Explanation:** Stargate is the data I/O manager — responsible for all data
management and I/O and the main interface from the hypervisor (NFS/iSCSI/SMB). It
runs on every node to serve localized I/O.

## Q19 — service that runs the GUI
- **Domain:** prism
- **Difficulty:** easy
- **ID:** NPX-E-003
- **Priority:** yes

**Question:** Which service is responsible for running the Nutanix GUI interface?

- [ ] Pithos
- [ ] Zeus
- [x] Prism
- [ ] Medusa

**Explanation:** Prism is the management gateway (nCLI, HTML5 UI, and REST API).
It runs on every node and uses an elected leader. Pithos is the vDisk config
manager, Medusa the metadata abstraction layer, and Zeus the cluster-config
library.

## Q20 — email alerts to app owners
- **Domain:** monitoring
- **Difficulty:** medium
- **ID:** NPX-M-009
- **Priority:** yes

**Question:** Custom alert policies in Prism Central monitor CPU and memory of
guest VMs. Specific application owners should be emailed when an alarm triggers.
What does the administrator need to configure?

- [x] Create a rule to send an email to the application owner.
- [ ] Configure the email settings within each VM category.
- [ ] Create a task to send an email to the application owner.
- [ ] Configure the email settings within each specific alert policy.

**Explanation:** Configuring alert emails is a separate action from the alert
policy (and from VM categories): create a rule in Prism Central defining who
receives the email. Prism Central alert emailing must be explicitly enabled and
requires an SMTP server.

## Q21 — Windows VM reports 100% memory
- **Domain:** ahv
- **Difficulty:** medium
- **ID:** NPX-M-010
- **Priority:** yes

**Question:** Memory usage for a Windows VM reports as 100% in Prism while
in-guest usage never exceeds 30%. What action resolves this?

- [ ] Reboot the host where the VM is running
- [ ] Reboot the VM
- [x] Install the VirtIO Balloon driver
- [ ] Live Migrate the VM

**Explanation:** AOS reports guest memory usage using the balloon driver running
inside the guest (part of the Nutanix VirtIO package). Windows does not ship this
driver, so until it is installed memory usage is misreported in Prism.

## Q22 — consistent gold image across clusters
- **Domain:** ahv
- **Difficulty:** hard
- **ID:** NPX-H-009
- **Priority:** yes

**Question:** To keep a VDI gold image consistent across newly added clusters,
what two items must the Nutanix administrator implement? (Choose two)

- [x] Create an Image Placement Policy in PC
- [ ] Setup Leap OnPrem and deploy Protection/Recovery plans
- [x] Create a custom category and tag the cluster and image
- [ ] Install NGT on the gold image so it can replicate between clusters

**Explanation:** In Prism Central, create categories for the cluster and image
and associate each, then create an Image Placement Policy tying the two
categories together ("assign images from these categories to the clusters from
these categories"). NGT and Leap are not relevant to this task.

## Q23 — Encryption Storage Policy values
- **Domain:** security
- **Difficulty:** medium
- **ID:** NPX-M-011
- **Priority:** yes

**Question:** What are two supported values of an Encryption Storage Policy?
(Choose two)

- [x] Inherit from Cluster
- [x] Enabled
- [ ] Self Encrypting Drives (SED) Encryption
- [ ] Disabled

**Explanation:** When enabling encryption within a Storage Policy, the possible
settings are Enabled and Inherit from Cluster.

## Q24 — stop one container using all space
- **Domain:** storage
- **Difficulty:** medium
- **ID:** NPX-M-012
- **Priority:** yes

**Question:** Several storage containers share one storage pool, each with
different optimizations. Which two actions ensure one container does not use all
remaining storage space? (Choose two)

- [ ] Enable Compression for each storage container
- [x] Configure the Reserved Capacity for each storage container
- [ ] Enable Deduplication for each storage container
- [x] Configure the Advertised Capacity for each storage container

**Explanation:** By default every container can use all unused pool space.
Configure Reserved Capacity (guarantees a minimum unavailable to others) and
Advertised Capacity (caps the container's visible size) to keep one container
from consuming the whole pool. Reserve no more than 90% of the pool in total.

## Q25 — full-clone persistent VDI container
- **Domain:** storage
- **Difficulty:** medium
- **ID:** NPX-M-013
- **Priority:** yes

**Question:** An administrator is setting up a new storage container to host
persistent (full clone) VDI desktop VMs. Which storage optimization feature
should be enabled?

- [ ] Flash Pinning
- [ ] Redundancy Factor 1
- [ ] Post-Process Compression
- [x] Deduplication

**Explanation:** Nutanix recommends enabling inline compression for most
workloads and disabling deduplication except for VDI. For a persistent full-clone
VDI container, enable deduplication (on a dedicated container for mixed clusters).
