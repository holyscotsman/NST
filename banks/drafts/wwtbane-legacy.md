<!-- wwtbane-legacy — RESCUED CONTENT, NOT PUBLISHED.
     160 verified questions that lived only in wwtbane/src/content/questions.js, a
     compiled fixture the app never read. They appear in no published bank, so no
     player has ever been able to answer one. Moved here so they live where banks
     live; drafts/ is deliberately absent from banks/manifest.json.
     Check with: node scripts/bank-test.mjs banks/drafts/wwtbane-legacy.md -->

cert: WWTBANE-LEGACY
title: WWTBANE legacy set (rescued, unpublished)
pass: 0.80
domains: ahv, dataprotection, foundation, lifecycle, migration, monitoring, networking, performance, prism, security, storage, unifiedstorage

### NPX-H-003
domain: prism
difficulty: 4
priority: true

Q: Which two CLI commands are required to take the CVM and the node out of maintenance mode? (Choose two.)
- [x] `acli host.exit_maintenance_mode host-ip`
- [x] `ncli host edit id=host-ID enable-maintenance-mode=false`
- [ ] `acli host.disable_maintenance_mode host-ip`
- [ ] `ncli host edit id=host-ID disable-maintenance-mode=true`

Explain: Remove the CVM from maintenance mode with `ncli host edit id=host-ID enable-maintenance-mode=false` (after finding the ID via `ncli host list`), then remove the node with `acli host.exit_maintenance_mode host-ip` and verify with `acli host.get`.

### NPX-M-008
domain: monitoring
difficulty: 3
priority: true

Q: After an update, a VM's CPU usage spikes to 100% every 60–120 minutes, against a normal weekday/weekend band. In which two locations should the administrator look to track this behavior? (Choose two)
- [ ] In the VM details Alert tab.
- [x] In the Event dashboard.
- [x] In the VM details Metrics tab.
- [ ] In the Alerts dashboard.

Explain: Anomaly detection learns a normal behavior band per metric and flags outliers as events. Anomalies appear in the behavioral-anomaly Event details and on the VM details Metrics tab.

### NPX-H-009
domain: ahv
difficulty: 4
priority: true

Q: To keep a VDI gold image consistent across newly added clusters, what two items must the Nutanix administrator implement? (Choose two)
- [x] Create an Image Placement Policy in PC
- [ ] Setup Leap OnPrem and deploy Protection/Recovery plans
- [x] Create a custom category and tag the cluster and image
- [ ] Install NGT on the gold image so it can replicate between clusters

Explain: In Prism Central, create categories for the cluster and image and associate each, then create an Image Placement Policy tying the two categories together ("assign images from these categories to the clusters from these categories"). NGT and Leap are not relevant to this task.

### AHV-E-001
domain: ahv
difficulty: 1
tags: ahv, kvm, architecture
reference: AHV Administration Guide

Q: An administrator is explaining the AHV architecture to a new team member and is asked what core virtualization technology AHV is built on. What is the correct answer?
- [x] A hardened, Nutanix-tuned build of Linux KVM
- [ ] A Nutanix fork of VMware ESXi
- [ ] The Xen hypervisor with a custom management layer
- [ ] Microsoft Hyper-V repackaged by Nutanix

Explain: AHV is Nutanix's native hypervisor, built on open-source Linux KVM (Kernel-based Virtual Machine) with QEMU and libvirt, and managed by the Acropolis service. It is not derived from ESXi, Xen, or Hyper-V.

### AHV-E-002
domain: ahv
difficulty: 1
tags: ahv, virtio, windows, drivers
reference: AHV Administration Guide - Nutanix VirtIO

Q: A Windows Server VM boots on AHV but fails to detect its SCSI system disk and its network adapter. Which software should be installed in the guest to resolve this?
- [x] The Nutanix VirtIO package for Windows
- [ ] VMware Tools
- [ ] Only Nutanix Guest Tools (NGT)
- [ ] Windows Hyper-V Integration Services

Explain: AHV presents paravirtualized VirtIO devices (SCSI storage, network, and balloon), which Windows does not include natively. The Nutanix VirtIO package must be installed so the guest can see its disk and NIC. NGT adds features like VSS and self-service restore but does not replace the base VirtIO storage/network drivers.

### AHV-E-003
domain: ahv
difficulty: 1
tags: ahv, image-service, iso, vm-creation
reference: Prism Web Console Guide - Image Management

Q: An administrator wants to create a new VM on AHV and boot it from an OS installation ISO. What is the recommended way to make that ISO available to the VM?
- [x] Import it into the Image Service (image configuration) and attach it as a CD-ROM
- [ ] Copy the ISO into the CVM's /home directory and boot from there
- [ ] Attach it directly from the administrator's laptop over the network
- [ ] Convert the ISO to a qcow2 boot disk first

Explain: The AHV Image Service (Image Configuration) imports ISOs and disk images into a storage container so they can be attached to VMs. An imported ISO is mounted as a virtual CD-ROM for installation, which is the supported workflow.

### AHV-E-004
domain: ahv
difficulty: 1
tags: ahv, live-migration, vm-mobility
reference: AHV Administration Guide - Live Migration

Q: During a planned workload rebalance, an administrator needs to move a running, business-critical VM from one AHV host to another with no service interruption. Which operation accomplishes this?
- [x] Live migration
- [ ] Cold clone and delete
- [ ] VM export and re-import
- [ ] Protection domain failover

Explain: Live migration transfers a running VM's memory and CPU state to another host in the same cluster with no downtime. Because all hosts share the Nutanix Distributed Storage Fabric, no disk data is copied. The other options all involve downtime or are disaster-recovery operations.

### AHV-M-001
domain: ahv
difficulty: 3
tags: ahv, ads, scheduling, hotspot
reference: AHV Administration Guide - Acropolis Dynamic Scheduling

Q: A cluster has Acropolis Dynamic Scheduling (ADS) enabled with default settings. How often does ADS perform its scheduled evaluation of the cluster for resource hotspots?
- [x] Every 15 minutes
- [ ] Continuously, in real time
- [ ] Once every 60 minutes
- [ ] Only when a VM is powered on

Explain: By default ADS runs a scheduled analysis of CPU and storage utilization every 15 minutes and migrates VMs (or ABS volume-group sessions) to resolve detected hotspots. It is periodic, not a continuous real-time load balancer.

### AHV-M-002
domain: ahv
difficulty: 3
tags: ahv, snapshots, ngt, application-consistent
reference: Data Protection and Recovery with Prism Element

Q: An administrator must ensure a database VM can take an application-consistent snapshot on AHV. What is the prerequisite for application-consistent, rather than crash-consistent, snapshots?
- [x] Nutanix Guest Tools (NGT) must be installed and enabled in the guest
- [ ] The VM must be powered off during the snapshot
- [ ] The VirtIO balloon driver must be disabled in the guest
- [ ] Deduplication must be enabled on the storage container

Explain: AHV snapshots are crash-consistent by default. Application-consistent snapshots require Nutanix Guest Tools (NGT), which uses Microsoft VSS on Windows (or pre-freeze/post-thaw scripts on Linux) to quiesce the application before the snapshot. Powering the VM off would only produce an offline snapshot, not a live application-consistent one.

### AHV-M-003
domain: ahv
difficulty: 3
tags: ahv, hot-add, memory, vcpu
reference: AHV Administration Guide - Virtual Machine Management

Q: A running Linux VM on AHV is under pressure, and the owner asks to increase both its RAM and its vCPU count without a reboot. What does AHV support here?
- [x] Both memory and vCPUs can be hot-added while the VM is powered on
- [ ] Only memory can be changed live; vCPU changes always require a reboot
- [ ] Neither can be changed without powering the VM off
- [ ] vCPUs can be hot-removed but never hot-added

Explain: AHV supports hot-adding (increasing) both memory and vCPUs on a powered-on VM, provided the guest OS supports it. The operation is add-only, however: you cannot hot-remove or decrease memory or vCPUs while the VM is running.

### AHV-M-004
domain: ahv
difficulty: 3
tags: ahv, image-service, disk-formats
reference: Prism Web Console Guide - Image Management

Q: An administrator is importing virtual disks into the AHV Image Service from several source platforms. Which of the following formats is NOT supported for direct import by the Image Service?
- [x] OVA
- [ ] qcow2
- [ ] VMDK
- [ ] VHDX

Explain: The AHV Image Service can import disk formats such as raw, qcow2, VMDK, VHD, VHDX, VDI, and ISO. OVA is a packaged appliance format (a tar of an OVF descriptor plus disks), not a single disk image, so it cannot be imported directly; its disks must be extracted or a dedicated migration tool used.

### AHV-H-001
domain: ahv
difficulty: 4
tags: ahv, ads, hotspot, threshold
reference: AHV Administration Guide - Acropolis Dynamic Scheduling

Q: On a busy cluster, one AHV host's CPU is running very hot while its peers are lightly loaded. Using default ADS behavior, at approximately what sustained host CPU utilization does ADS classify the host as a hotspot and attempt remediation?
- [x] Above 85% CPU utilization
- [ ] Above 50% CPU utilization
- [ ] Above 95% CPU utilization
- [ ] Above 70% CPU utilization

Explain: ADS flags a host as contended (a hotspot) when its CPU utilization stays above roughly 85% of capacity for a sustained period, then migrates VMs to a less-loaded host. A 50% or 70% trigger would cause needless migration churn, while waiting for 95% would let workloads degrade first.
Clue: ADS is not a continuous balancer chasing perfectly even load; it only intervenes when a host is genuinely contended. Think about a threshold high enough to avoid constant migration churn, yet low enough to act before workloads actually starve for CPU. Nutanix set that value in the mid-to-high 80s percent.

### AHV-H-002
domain: ahv
difficulty: 4
tags: ahv, affinity, anti-affinity, ads
reference: AHV Administration Guide - VM Affinity Policies

Q: An administrator configures a VM-host affinity policy pinning VM-A to Host-1, and a VM-VM anti-affinity policy separating VM-B and VM-C. Which statement correctly describes how AHV enforces these two policies?
- [x] VM-host affinity is strictly enforced; VM-VM anti-affinity is best-effort and may be broken if no other host is available
- [ ] Both policies are strictly enforced and are never violated under any condition
- [ ] Both policies are best-effort and may be violated when the cluster is under load
- [ ] VM-VM anti-affinity is strictly enforced, while VM-host affinity is only a placement preference

Explain: In AHV, VM-host affinity is a required (hard) rule: an affined VM runs only on its designated host(s) and will not be moved elsewhere, even for HA. VM-VM anti-affinity is a best-effort (soft) rule that ADS honors when possible but may violate if there is no other viable placement.
Clue: Consider what each rule protects. Pinning a VM to specific hosts is often for licensing or dedicated hardware like a GPU, so the platform treats it as non-negotiable, even at the cost of not restarting the VM during HA. Keeping two VMs apart is about resilience, so the platform tries hard but will not leave a VM powerless just to satisfy separation when hosts are scarce.

### AHV-H-003
domain: ahv
difficulty: 4
tags: ahv, maintenance-mode, evacuation, gpu-passthrough
reference: AHV Administration Guide - Host Maintenance Mode

Q: An administrator places an AHV host into maintenance mode to replace a faulty NIC. Some VMs on that host use GPU passthrough and therefore cannot be live-migrated. What happens to those non-migratable VMs?
- [x] They are gracefully powered off and stay down until the host exits maintenance mode
- [ ] They are forcibly live-migrated with a brief guest hang
- [ ] They keep running on the host while it is being serviced
- [ ] The maintenance-mode operation is aborted for the entire host

Explain: When a host enters maintenance mode, AHV live-migrates all migratable guest VMs to other hosts. VMs that cannot be migrated (for example, those using GPU or PCI passthrough, or pinned by host affinity) are shut down and remain off until the host exits maintenance mode. The Controller VM is not migrated and is handled separately.
Clue: Live migration streams a VM's memory state to another host, but that only works when the VM's virtual hardware is fully abstracted. A device passed straight through to physical hardware breaks that abstraction and binds the VM to that host. When the host must be evacuated, the only safe option for such a VM is to stop it cleanly rather than leave it on a host going down for service.

### AHV-H-004
domain: ahv
difficulty: 4
tags: ahv, guest-customization, cloud-init, sysprep, cloning
reference: Prism Web Console Guide - VM Guest Customization

Q: An administrator is cloning a Windows template VM and a Linux template VM on AHV and wants each clone to boot with a unique hostname, network configuration, and credentials applied automatically. Which guest customization mechanisms does AHV use for these two guest types?
- [x] Sysprep for the Windows clone and cloud-init for the Linux clone
- [ ] cloud-init for both the Windows and the Linux clone
- [ ] Sysprep for both the Windows and the Linux clone
- [ ] NGT scripting for the Windows clone and Sysprep for the Linux clone

Explain: AHV guest customization applies Sysprep (an unattend answer file) to Windows guests and cloud-init to Linux guests. You supply the script or answer file when creating or cloning the VM, and it runs on first boot to set hostname, networking, users, and more. cloud-init is not the Windows mechanism, and Sysprep is Windows-only.
Clue: Each OS family has its own long-standing unattended-provisioning framework, and AHV simply hooks into the native one for each guest. Windows has used an answer-file-driven generalization-and-specialization tool for years, while the Linux and cloud world standardized on a metadata-driven first-boot configuration system. AHV feeds your config to whichever one matches the guest.

### DP-E-001
domain: dataprotection
difficulty: 1
tags: async DR, RPO, protection domain, replication
reference: Prism Web Console Guide - Data Protection (Async DR)

Q: An administrator configures asynchronous DR replication for a protection domain to a remote site. What is the shortest RPO that a standard asynchronous schedule supports?
- [ ] 15 minutes
- [x] 60 minutes
- [ ] 5 minutes
- [ ] 1 minute

Explain: Standard asynchronous replication supports a minimum RPO of 60 minutes (hourly snapshots). Shorter RPOs of 1-15 minutes require NearSync, and an RPO of 0 requires Metro Availability.

### DP-E-002
domain: dataprotection
difficulty: 1
tags: self-service restore, NGT, file-level restore
reference: Prism Web Console Guide - Self-Service Restore

Q: A Windows VM owner wants to recover an accidentally deleted file directly from a VM snapshot without contacting an administrator. What must be installed inside the guest to enable Self-Service Restore?
- [x] Nutanix Guest Tools (NGT)
- [ ] VMware Tools
- [ ] Nutanix Move agent
- [ ] Prism Central agent

Explain: Self-Service Restore (file-level restore) requires Nutanix Guest Tools (NGT) in the guest so the VM owner can mount a snapshot and recover individual files. VMware Tools and Move are unrelated to this feature.

### DP-E-003
domain: dataprotection
difficulty: 1
tags: Metro Availability, RPO, synchronous replication
reference: Prism Web Console Guide - Metro Availability

Q: Which Nutanix data protection feature delivers a zero RPO by synchronously replicating every write to a second cluster before acknowledging it?
- [ ] Asynchronous DR
- [ ] NearSync
- [x] Metro Availability
- [ ] Self-Service Restore

Explain: Metro Availability synchronously mirrors writes between two clusters (a stretched container), giving an RPO of 0. NearSync achieves 1-15 minutes and async a minimum of 60 minutes, so neither is zero.

### DP-E-004
domain: dataprotection
difficulty: 1
tags: consistency group, protection domain, snapshot
reference: Prism Web Console Guide - Data Protection (Consistency Groups)

Q: Within a protection domain, what is achieved by placing several VMs in the same consistency group?
- [x] They are captured together at the same consistent point in time
- [ ] They are automatically load-balanced across hosts
- [ ] They share a single virtual NIC
- [ ] They are excluded from replication

Explain: A consistency group ensures all of its VMs are snapshotted together at a single consistent point in time, which matters for multi-VM applications. Consistency groups have nothing to do with host load-balancing or networking.

### DP-M-001
domain: dataprotection
difficulty: 3
tags: NearSync, LWS, RPO, replication
reference: Prism Web Console Guide - NearSync

Q: An administrator must replicate a group of VMs to another cluster with a 5-minute RPO. Which technology will the protection domain use to meet this target?
- [x] NearSync using lightweight snapshots (LWS)
- [ ] Metro Availability stretch container
- [ ] Standard asynchronous snapshots
- [ ] Self-Service Restore

Explain: RPOs between 1 and 15 minutes are delivered by NearSync, which uses lightweight snapshots (LWS) taken about every minute. Async cannot go below 60 minutes, and Metro is synchronous (RPO 0), not a 5-minute schedule.

### DP-M-002
domain: dataprotection
difficulty: 3
tags: Metro Availability, latency, requirements
reference: Prism Web Console Guide - Metro Availability Requirements

Q: Before enabling Metro Availability between two data centers, which network requirement must the environment satisfy?
- [x] Round-trip network latency between the sites must be 5 ms or less
- [ ] The two sites must share the same broadcast domain
- [ ] Deduplication must be enabled on both clusters
- [ ] NGT must be installed on every protected VM

Explain: Because Metro replicates writes synchronously, Nutanix requires a maximum round-trip latency of 5 ms between the two sites; higher latency would degrade write performance. Shared broadcast domains, deduplication, and NGT are not Metro prerequisites.

### DP-M-003
domain: dataprotection
difficulty: 3
tags: application-consistent, VSS, NGT, AHV
reference: Prism Web Console Guide - Application-Consistent Snapshots

Q: To capture application-consistent snapshots of a Windows SQL Server VM on AHV, what mechanism does Nutanix use to quiesce the application, and what must be present in the guest?
- [x] Microsoft VSS, with Nutanix Guest Tools installed in the VM
- [ ] Redirect-on-write, with no in-guest prerequisites
- [ ] Lightweight snapshots, requiring all-flash nodes
- [ ] Metro stretch, requiring a witness VM

Explain: On AHV, application-consistent snapshots use Microsoft VSS to quiesce the application, which requires Nutanix Guest Tools (NGT) installed in the VM. Without NGT/VSS the snapshot is only crash-consistent.

### DP-M-004
domain: dataprotection
difficulty: 3
tags: Nutanix Leap, Recovery Plan, DR orchestration
reference: Nutanix Disaster Recovery (Leap) Guide - Recovery Plans

Q: In Nutanix Leap, which construct defines the VM power-on sequence, inter-stage delays, and network mappings that are executed during a failover?
- [x] Recovery Plan
- [ ] Protection Policy
- [ ] Consistency Group
- [ ] Remote Site

Explain: A Recovery Plan orchestrates failover: it defines boot ordering (stages), delays, and test/production network mappings. A Protection Policy, by contrast, defines the RPO, snapshot schedule, and retention of recovery points.

### DP-H-001
domain: dataprotection
difficulty: 4
tags: Metro Availability, witness, failover, split-brain
reference: Prism Web Console Guide - Metro Availability Witness

Q: A Metro Availability deployment must fail over automatically and without split-brain if either of the two data sites, or the link between them, fails. Which component makes this possible?
- [x] A Witness VM deployed at an independent third site
- [ ] A second CVM added to each of the two clusters
- [ ] A NearSync LWS store on both clusters
- [ ] Prism Central hosted at one of the two data sites

Explain: The Metro Witness is a lightweight VM placed in an independent third failure domain; it arbitrates which site stays active when connectivity is lost, enabling automatic failover while preventing split-brain. Placing the arbiter at one of the two data sites would defeat its purpose.
Clue: In a two-site synchronous mirror both copies are equally valid, so when the sites lose contact each could decide to take over - that is split-brain. The fix is a neutral arbiter sitting in a separate failure domain that both sites can reach; it breaks the tie by designating a single surviving site. Putting that arbiter inside one of the two data sites would give that site an unfair vote and reintroduce the risk.

### DP-H-002
domain: dataprotection
difficulty: 4
tags: NearSync, LWS, async fallback, RPO
reference: Prism Web Console Guide - NearSync Requirements and Behavior

Q: A protection domain running NearSync with a 5-minute RPO experiences sustained replication delays that prevent it from meeting the schedule. How does AOS respond?
- [x] It automatically falls back to hourly asynchronous replication, then transitions back to NearSync once it can keep pace
- [ ] It immediately fails the protection domain over to the remote site
- [ ] It permanently disables the schedule until an admin intervenes
- [ ] It converts the affected snapshots into Metro Availability

Explain: When NearSync cannot sustain its cadence, AOS gracefully reverts the protection domain to hourly (async) snapshots so protection continues, and it automatically transitions back to NearSync when the system can keep pace again. It does not trigger a failover or disable protection.
Clue: NearSync depends on continuously shipping lightweight snapshots, which only works if both the cluster and the inter-site link can keep up. If they fall behind, the safest design choice is to keep protecting data at a coarser interval rather than losing protection or forcing a failover. Well-designed systems also self-heal, resuming the tighter cadence automatically once conditions recover.

### DP-H-003
domain: dataprotection
difficulty: 4
tags: changed region tracking, CBT, third-party backup, REST API
reference: Nutanix Backup and Recovery / Data Protection REST API documentation

Q: A third-party backup product performs incremental-forever backups of AHV VMs by reading only the regions that changed since the previous backup. Which Nutanix capability enables this?
- [x] Changed Region Tracking exposed through Nutanix REST (v3) APIs
- [ ] VMware Changed Block Tracking (CBT)
- [ ] In-guest file system journaling read via NGT
- [ ] Deduplication fingerprint comparisons

Explain: Nutanix exposes Changed Region Tracking through its REST (v3) APIs, letting backup partners query the regions that differ between two recovery points on AHV. VMware's CBT is a hypervisor-specific feature that does not apply to AHV.
Clue: Incremental-forever backup needs the storage layer to report which parts of a disk changed between two point-in-time copies, so the backup app never re-reads unchanged data. Nutanix provides this to partners through its APIs at the storage and recovery-point level, independent of the guest OS. Be wary of a distractor that names a hypervisor-specific feature borrowed from a different platform.

### DP-H-004
domain: dataprotection
difficulty: 4
tags: Metro Availability, storage container, configuration, stretch
reference: Prism Web Console Guide - Configuring Metro Availability

Q: An administrator enables Metro Availability between cluster A and cluster B. Which statement about how Metro is scoped and configured is correct?
- [x] Both clusters must present a storage container with the same name, and the Metro domain protects every VM in that container
- [ ] Metro protects only the individual VMs added to a consistency group
- [ ] Metro replicates changed regions to the remote site every 60 seconds
- [ ] Metro requires NearSync LWS to be enabled on the container first

Explain: Metro Availability stretches a storage container synchronously, so both clusters must have a container with the same name, and protection applies to all VMs residing in that container rather than to hand-picked VMs. Metro is synchronous (RPO 0), so it does not batch changes on a 60-second interval, and it does not depend on NearSync.
Clue: Metro works by extending a single storage namespace synchronously across two clusters, so the unit of protection is the storage boundary itself rather than a curated list of VMs. For that shared namespace to work, both clusters must present a container of the same name. And because writes are mirrored synchronously for zero data loss, there is no batching interval like you would see in snapshot-based replication.

### STOR-X-002
domain: storage
difficulty: 5
tags: metadata, cassandra, medusa, replication-factor, quorum
reference: Nutanix AOS Distributed Storage Fabric (Medusa/Cassandra metadata)

Q: A cluster stores user data at Redundancy Factor 2 (two data copies). Independent of those data copies, how many copies of the distributed cluster metadata does the Medusa/Cassandra store keep by default?
- [ ] 2
- [x] 3
- [ ] 4
- [ ] 5

Explain: To survive failures while still forming a strict majority (Paxos) quorum, Nutanix always keeps metadata at higher redundancy than user data: an RF2 cluster keeps 3 copies of metadata (and Zookeeper config), while an RF3 cluster keeps 5. Matching metadata to the 2 data copies would leave no majority to break ties.
Clue: Metadata must survive a failure and still form a strict majority to vote on consistency, so its copy count is always odd and always greater than the number of data copies. For a two-copy data policy the metadata ring holds just one more than that. The same rule pushes a three-copy data policy up to five metadata copies.

### DP-X-001
domain: dataprotection
difficulty: 5
tags: metro-availability, synchronous-replication, latency, zero-rpo
reference: Nutanix Data Protection and Recovery Guide (Metro Availability)

Q: An architect is designing Metro Availability (synchronous replication with zero RPO) between two datacenters. What is the maximum round-trip network latency Nutanix specifies between the two sites for this configuration to be supported?
- [ ] 1 ms
- [ ] 20 ms
- [x] 5 ms
- [ ] 200 ms

Explain: Because every write must be acknowledged at both sites before it completes, Metro Availability requires a maximum round-trip latency of 5 ms between the two clusters, effectively limiting them to metro distances. The 200 ms figure applies to the arbitrating Witness VM, not to the inter-site data path.
Clue: Synchronous replication acknowledges each write at both sites before telling the guest the write is done, so physical distance taxes every single I/O. That forces a very tight round-trip budget in the low single-digit milliseconds, which is why the two sites must be metro-close. Do not confuse this with the far looser latency tolerated by the arbitrating witness.

### AHV-X-001
domain: ahv
difficulty: 5
tags: ahv, cvm, iscsi-redirector, stargate, internal-network
reference: Nutanix AHV architecture (CVM autopathing / iSCSI redirector)

Q: On an AHV host, QEMU serves VM disk I/O by connecting over the internal 192.168.5.0/24 network to the local Controller VM's Stargate through the iSCSI redirector. Which IP address does the host target to reach that local Stargate storage endpoint?
- [ ] 192.168.5.1
- [ ] 192.168.5.2
- [ ] 127.0.0.1
- [x] 192.168.5.254

Explain: On the internal non-routable 192.168.5.0/24 link the AHV host uses 192.168.5.1 and the CVM uses 192.168.5.2, but the local Stargate storage/iSCSI endpoint the host targets for I/O is 192.168.5.254. The iSCSI redirector transparently steers connections to a healthy Stargate (preferring the local one) so I/O survives a local CVM outage.
Clue: The hypervisor and its local controller VM talk over a private, non-routable subnet that never touches the physical network; the host owns the .1 address and the controller VM owns .2. Storage I/O, however, is aimed at a separate virtual endpoint so a redirector can transparently fail it over to a peer controller VM when the local one is down. That storage endpoint sits high in the subnet, not at .1, .2, or loopback.

### AHV-X-002
domain: ahv
difficulty: 5
tags: ahv, vm-ha, high-availability, reservation
reference: Prism Web Console Guide (VM High Availability in Acropolis)

Q: A new AHV cluster is deployed and the admin has not configured any high-availability settings. If a host fails, what VM HA behavior is in effect by default?
- [ ] Guaranteed HA: capacity is reserved cluster-wide so all VMs are certain to restart
- [x] Best-effort HA: VMs restart on surviving hosts only if free resources happen to be available
- [ ] No HA at all: failed VMs stay down until an admin manually powers them on
- [ ] Guaranteed HA using dedicated reserved hosts kept idle as standby

Explain: Out of the box AHV provides best-effort VM HA with no admission control: after a host failure Acropolis attempts to restart affected VMs wherever free capacity exists, but does not guarantee success. Guaranteed restart is opt-in and works by reserving segments of capacity, not by parking whole idle hosts.
Clue: By default the hypervisor already attempts to bring failed VMs back up elsewhere, so the do-nothing option is wrong. But the default mode reserves no capacity and enforces no admission control, so a restart is attempted, not promised. The stronger guaranteed mode is opt-in and works by reserving segments of capacity rather than parking entire idle hosts.

### PRISM-X-001
domain: prism
difficulty: 5
tags: prism-central, scale-out, resiliency, quorum
reference: Prism Central Guide (Expanding / Scale Out Prism Central)

Q: To make the management plane resilient to the loss of a single Prism Central VM, an admin converts a single-VM Prism Central into a scale-out deployment. How many Prism Central VMs does a scale-out Prism Central run?
- [ ] 2
- [ ] 4
- [x] 3
- [ ] 5

Explain: Scale-out Prism Central runs as exactly 3 PC VMs, providing n+1 resiliency so the management plane survives the loss of one PC VM. A 2-VM design could not maintain a majority quorum, which is why 3 is the supported scale-out size.
Clue: A single management-plane VM is a single point of failure, so the resilient design clusters several instances and tolerates losing one (n+1). Quorum-based clusters need an odd number of members to break ties, and the smallest odd count above one that delivers n+1 is the supported size here. It is not two, and it is not five.

### NET-X-001
domain: networking
difficulty: 5
tags: ahv, mac-address, oui, vnic, networking
reference: AHV Administration Guide (MAC Address Prefix)

Q: While auditing VM NICs on an AHV cluster, an engineer wants to programmatically identify auto-generated (Acropolis-assigned) VM interfaces by their MAC address. Which OUI prefix does AHV use for automatically assigned VM MAC addresses?
- [ ] 00:0c:29
- [ ] 00:50:56
- [ ] 00:1a:11
- [x] 50:6b:8d

Explain: AHV auto-assigns VM NIC MAC addresses from the Nutanix-owned OUI range 50:6b:8d:xx:xx:xx. The 00:0c:29 and 00:50:56 prefixes are VMware's, and 00:1a:11 belongs to Google, so those would not appear on Acropolis-generated NICs.
Clue: Every vendor auto-generates virtual NIC MACs from its own registered OUI, the first three octets of the address. Two of the prefixes on the list belong to a well-known competing virtualization vendor, and another to a large search company, so eliminate those. The correct block is the one registered to Nutanix itself.

### LCM-X-001
domain: lifecycle
difficulty: 5
tags: lcm, firmware, phoenix, upgrade, maintenance-mode
reference: Life Cycle Manager Guide (firmware updates)

Q: An admin runs a BIOS/BMC firmware update through Life Cycle Manager (LCM). For firmware that requires the node to be taken fully offline, into which environment does LCM boot the host to apply the update?
- [x] A Phoenix (CentOS/Linux) staging image booted on the node itself
- [ ] The Foundation imaging appliance running inside the CVM
- [ ] The hypervisor's own built-in recovery/maintenance shell
- [ ] A Genesis service instance running on a neighboring node

Explain: For firmware that cannot be applied live, LCM stages a Phoenix image on the node, puts the node in maintenance mode, and reboots it into Phoenix to flash the BIOS/BMC/HBA firmware before rebooting back into the hypervisor. Foundation is the imaging/deployment tool and Genesis is the cluster service manager, not the firmware staging environment.
Clue: Some firmware, such as BIOS and BMC, simply cannot be flashed while the hypervisor is running. So the update tool evacuates the node, puts it in maintenance mode, and reboots it into a small purpose-built Linux staging image dedicated to running the flash, then boots it back into the hypervisor. That staging image is distinct from the appliance used to first image and deploy nodes, and distinct from the service that supervises cluster processes.

### MON-X-001
domain: monitoring
difficulty: 5
tags: monitoring, syslog, rsyslog, RELP, logging
reference: AOS Advanced Administration Guide - Configuring Remote Syslog (ncli rsyslog-config)

Q: A security team requires that no audit log messages be silently dropped in transit to their SIEM, even during brief network congestion. Beyond plain UDP and TCP, which transport can a Nutanix cluster's remote syslog (rsyslog) configuration use to provide reliable, acknowledged log delivery?
- [ ] SCTP with multihoming
- [ ] GELF (Graylog Extended Log Format)
- [x] RELP (Reliable Event Logging Protocol)
- [ ] Syslog-ng over QUIC

Explain: Nutanix ncli rsyslog-config supports UDP, TCP, and RELP; RELP adds application-level acknowledgements so buffered messages are not lost if the connection briefly resets. SCTP, QUIC, and GELF are not options exposed by the rsyslog configuration.
Clue: Plain UDP syslog is fire-and-forget, and even TCP can lose messages sitting in a buffer if the session resets. There is a purpose-built syslog transport whose entire reason for existing is per-message acknowledgement so nothing is dropped in flight. Nutanix exposes exactly that option alongside UDP and TCP.

### MOVE-X-001
domain: migration
difficulty: 5
tags: migration, move, cbt, vddk, incremental
reference: Nutanix Move User Guide - VMware Migration Architecture

Q: During a large VMware ESXi-to-AHV migration with Nutanix Move, the initial full seed of a VM's disks completes and Move then keeps the target in sync with minimal impact until cutover. Which source-side mechanism does Move rely on to transfer only the blocks that changed since the previous pass?
- [ ] AOS Cerebro lightweight snapshots on the source
- [x] VMware Changed Block Tracking (CBT)
- [ ] rsync-style checksum comparison of each VMDK
- [ ] vSphere Replication configured on the source cluster

Explain: Move uses VADP/VDDK together with VMware Changed Block Tracking to read only changed blocks on each incremental pass, minimizing cutover downtime. Cerebro snapshots live on the Nutanix target side, not on ESXi sources, and Move requires neither vSphere Replication nor full-disk checksum scans.
Clue: Copying an entire multi-terabyte disk on every sync would make near-zero-downtime cutovers impossible. The trick is to let the source hypervisor report exactly which blocks were dirtied since the last read, so each incremental pass moves only deltas. This is a native vSphere data-protection capability, not anything running on the Nutanix side.

### NUS-X-001
domain: unifiedstorage
difficulty: 5
tags: unifiedstorage, volumes, iscsi, data-services-ip, failover
reference: Nutanix Volumes Guide - iSCSI Data Services IP Address

Q: You are configuring an external Linux host to consume block storage from Nutanix Volumes over iSCSI, and you want target discovery plus transparent failover if the serving Controller VM goes down. Which address should the initiator be pointed at as its discovery portal?
- [ ] The Prism Element cluster virtual IP (VIP)
- [ ] The eth0 management IP of a specific CVM
- [ ] The AHV host's hypervisor management IP
- [x] The cluster's iSCSI Data Services IP

Explain: The iSCSI Data Services IP (DSIP) is a floating address owned by one CVM at a time; initiators discover targets through it, and on a CVM failure the DSIP relocates and re-login redirects the session to a healthy CVM. Pointing initiators at a specific CVM interface or the Prism VIP defeats this redirection and is explicitly discouraged.
Clue: The Prism virtual IP carries management traffic; block clients need a separate, floating address dedicated to data services. Because only one Controller VM owns that address at a time and it relocates on failure, the initiator always re-logs in through it and is steered to a live CVM. Never hard-code a client to an individual CVM's interface.

### SEC-X-001
domain: security
difficulty: 5
tags: security, scma, saltstack, stig, hardening
reference: Nutanix Security Guide - Security Baseline and Self-Healing (SCMA)

Q: A CVM's security-hardened configuration drifts because an operator manually loosened a file permission. Nutanix's baseline framework detects this and automatically reverts it to the supported hardened value. Which configuration-management engine does this self-healing SCMA framework use under the hood?
- [x] SaltStack
- [ ] Ansible
- [ ] Puppet
- [ ] Chef

Explain: Nutanix Security Configuration Management Automation (SCMA) uses SaltStack to continuously inspect over a thousand security entities and self-heal the CVM/AHV baseline back to its STIG-hardened state. Ansible, Puppet, and Chef are common config-management tools but are not the engine behind SCMA.
Clue: Nutanix does not just harden the platform once; it re-checks well over a thousand security entities on a schedule and silently corrects any drift back to the baseline. That continuous enforcement is driven by an off-the-shelf configuration-management engine embedded in the controller VM. Recall which engine Nutanix has publicly said it standardized on for this.

### PERF-X-001
domain: performance
difficulty: 5
tags: performance, curator, full-scan, partial-scan, mapreduce
reference: The Nutanix Bible - AOS Storage (Curator); Nutanix KB on Curator scan types and frequency

Q: Background metadata scans in AOS drive maintenance tasks such as ILM tiering, disk balancing, and garbage collection. Left undisturbed by event-triggered runs, what are the default intervals for Curator's full scan and partial scan, respectively?
- [ ] Full scan every 24 hours; partial scan every 6 hours
- [x] Full scan every 6 hours; partial scan every 1 hour
- [ ] Full scan every 1 hour; partial scan every 15 minutes
- [ ] Full scan every 12 hours; partial scan every 3 hours

Explain: By default Curator runs a full MapReduce scan about every 6 hours and a partial scan about every hour, in addition to urgent event-triggered scans. The other cadences are plausible-sounding but incorrect.
Clue: There are two periodic scan tiers plus urgent event-triggered runs. The heavier, cluster-wide pass happens only a few times per day, while the lighter pass runs several times more often to catch issues sooner. Anchor on the heavier one being on the order of a quarter-day and the lighter one being hourly.

### PERF-X-002
domain: performance
difficulty: 5
tags: performance, ilm, tiering, ssd, down-migration
reference: The Nutanix Bible - AOS Storage (Disk Balancing / ILM)

Q: In a hybrid (SSD+HDD) Nutanix node, hot data stays on the SSD tier until the tier begins to fill. At what default SSD-tier utilization does DSF ILM begin down-migrating the coldest data to the HDD tier?
- [ ] 50%
- [ ] 90%
- [x] 75%
- [ ] 95%

Explain: The default curator_tier_usage_ilm_threshold_percent is 75%; once SSD utilization crosses it, ILM down-migrates the least-recently-accessed data (chosen by last access time) to the HDD tier. A 90% or 95% threshold would leave too little low-latency headroom for incoming hot writes.
Clue: ILM is not waiting until the fast tier is nearly full, since that would starve new hot writes of low-latency space. It leaves meaningful headroom, triggering down-migration once the SSD tier is roughly three-quarters used, and it evicts the coldest data by last-access time. Pick the threshold that preserves burst capacity.

### FDN-E-001
domain: foundation
difficulty: 1
tags: foundation, imaging, cluster-creation
reference: Field Installation Guide (Foundation)

Q: A pallet of bare-metal Nutanix nodes has arrived and an administrator needs to install the hypervisor and AOS on them and build a cluster. Which tool is designed for this?
- [x] Foundation
- [ ] Prism Central
- [ ] Life Cycle Manager (LCM)
- [ ] Nutanix Move

Explain: Foundation is the provisioning tool that images bare-metal nodes (installing the hypervisor and AOS) and then creates the cluster. LCM only updates software and firmware on an existing cluster, and Move migrates VMs, so neither performs initial imaging.

### FDN-E-002
domain: foundation
difficulty: 1
tags: redundancy-factor, cluster-size, rf2
reference: Prism Web Console Guide - Cluster Management

Q: An administrator is sizing the smallest standard cluster that can tolerate a single node failure using redundancy factor 2. What is the minimum number of nodes?
- [ ] 2
- [x] 3
- [ ] 4
- [ ] 5

Explain: Redundancy factor 2 requires a minimum of three nodes so that data and metadata copies can be placed on separate nodes and the cluster keeps a metadata quorum after one node is lost. A two-node cluster is a special ROBO case that additionally needs an external Witness.

### FDN-E-003
domain: foundation
difficulty: 1
tags: cvm, architecture, storage-fabric
reference: Nutanix Bible - AOS Architecture

Q: On each node in a Nutanix cluster, which component runs as a dedicated virtual machine and serves all storage I/O for the local hypervisor?
- [x] The Controller VM (CVM)
- [ ] The Prism Central VM
- [ ] The Witness VM
- [ ] The Foundation VM

Explain: Every node runs a Controller VM (CVM) that hosts the Distributed Storage Fabric services (such as Stargate) and handles storage I/O for the VMs on that host. Prism Central, Witness, and Foundation are separate management or utility roles that do not serve node storage I/O.

### FDN-E-004
domain: foundation
difficulty: 1
tags: two-node, witness, robo
reference: Prism Web Console Guide - Two-Node Clusters

Q: A remote office will run a two-node Nutanix cluster. What additional component must be deployed to arbitrate and preserve availability if the two nodes lose contact with each other?
- [x] A Witness VM in a separate failure domain
- [ ] A third Controller VM on one of the nodes
- [ ] A second Prism Central instance
- [ ] A dedicated Foundation VM at the site

Explain: Two-node clusters require an external Witness VM, placed in a separate failure domain, to break ties and prevent split-brain if a node or the inter-node link fails. It is the same Witness role used by Metro Availability.

### FDN-M-001
domain: foundation
difficulty: 3
tags: foundation, discovery, ipv6-link-local, networking
reference: Field Installation Guide (Foundation)

Q: When Foundation lists factory-imaged nodes that have never been assigned an IP address, how does it discover them, and what does this imply about placement?
- [x] Via IPv6 link-local multicast, so Foundation must be on the same Layer 2 broadcast domain as the nodes
- [ ] Via a DNS SRV record, so the nodes must first be registered in DNS
- [ ] Via an IPv4 DHCP broadcast, so a DHCP server is required on the subnet
- [ ] Via Prism Central mDNS, so the nodes must already be registered to Prism Central

Explain: Unconfigured nodes have no routable IPv4 address yet, so Foundation discovers them using IPv6 link-local addressing, which only works within a single Layer 2 broadcast domain. That is why the Foundation host and the nodes must sit on the same subnet or VLAN for discovery to succeed.

### FDN-M-002
domain: foundation
difficulty: 3
tags: redundancy-factor, rf3, cluster-size, fault-tolerance
reference: Prism Web Console Guide - Cluster Management

Q: A customer wants their cluster to tolerate two simultaneous node failures using redundancy factor 3. What is the minimum number of nodes required?
- [ ] 3
- [ ] 4
- [x] 5
- [ ] 6

Explain: Redundancy factor 3 keeps three copies of data and five copies of cluster metadata, so it requires a minimum of five nodes to place those copies on independent failure domains and survive two concurrent node losses. Redundancy factor 2 needs only three nodes.

### FDN-M-003
domain: foundation
difficulty: 3
tags: redundancy-factor, replication-factor, terminology
reference: Nutanix Bible - Data Path Resiliency

Q: A study group is debating Nutanix terminology. How do 'redundancy factor' and 'replication factor' differ?
- [x] Redundancy factor is a cluster-wide metadata fault-tolerance setting; replication factor is the number of data copies per storage container
- [ ] They are identical terms that Nutanix uses interchangeably with no distinction
- [ ] Redundancy factor is the number of data copies; replication factor is the number of Witness VMs
- [ ] Redundancy factor applies only to AHV clusters; replication factor applies only to ESXi clusters

Explain: Redundancy factor is set at the cluster level and determines how many copies of cluster metadata and configuration (Cassandra and Zookeeper) are kept, and therefore how many failures the cluster survives. Replication factor is the per-container number of data copies (2 or 3), which cannot exceed what the cluster's redundancy factor allows.

### FDN-M-004
domain: foundation
difficulty: 3
tags: foundation-central, prism-central, remote-sites, edge
reference: Foundation Central Guide

Q: An organization must image nodes and build clusters at dozens of remote edge sites without sending staff or a laptop running Foundation to each location. Which capability best addresses this?
- [x] Foundation Central, a service in Prism Central that orchestrates remote imaging and cluster creation
- [ ] The Foundation applet embedded in each CVM, run manually per site
- [ ] Life Cycle Manager (LCM) running from Prism Element
- [ ] The Prism Self-Service portal

Explain: Foundation Central runs within Prism Central and lets you image factory nodes and create clusters at remote sites centrally; the remote nodes reach Foundation Central (for example via DHCP options) and are deployed without an on-site Foundation instance. The CVM Foundation applet and LCM do not provide this centralized remote-site orchestration.

### FDN-H-001
domain: foundation
difficulty: 4
tags: expand-cluster, add-node, imaging, foundation
reference: Prism Web Console Guide - Expanding a Cluster

Q: An administrator uses Prism's Expand Cluster workflow to add a node that shipped with a newer AOS and a different hypervisor build than the running cluster. What does the workflow do before the node joins?
- [x] It can automatically re-image the node's hypervisor and AOS to match the existing cluster, then add it
- [ ] It rejects the node and requires the admin to downgrade it manually with LCM first
- [ ] It adds the node immediately and lets the two AOS versions coexist permanently
- [ ] It forces the entire cluster to upgrade to the new node's AOS version

Explain: Expand Cluster discovers the node over IPv6 link-local and, when versions differ, can image the node's hypervisor and AOS to match the cluster before adding it, keeping the cluster on one consistent version. It does not run mixed AOS versions permanently or force a cluster-wide upgrade just to admit a single node.
Clue: Think about why a cluster wants every node on the same AOS and hypervisor build - mixed versions would complicate the distributed storage and management services. The add-node workflow is built to normalize an incoming node, and it reuses the same imaging engine that first built the cluster rather than refusing the node or dragging the whole cluster to a new version.

### FDN-H-002
domain: foundation
difficulty: 4
tags: block-awareness, availability-domain, rf2, resiliency
reference: Nutanix Bible - Availability Domains (Block Awareness)

Q: A customer wants block awareness so that losing a full block (chassis) cannot make data unavailable at redundancy factor 2. Beyond enabling it, what is the key infrastructure requirement?
- [x] At least three blocks, so copies can always be placed on separate blocks
- [ ] At least two blocks, since RF2 keeps only two data copies
- [ ] Exactly one node per block across the cluster
- [ ] A dedicated Witness VM to track block placement

Explain: Block awareness requires a minimum of three blocks at RF2 so that data, metadata (the Cassandra ring), and configuration (Zookeeper) copies can be distributed across separate blocks and survive losing an entire block. Two blocks are insufficient because the quorum-based metadata and Zookeeper services need three independent failure domains to keep a majority.
Clue: Block awareness is about spreading the copies you already keep for node failures across a coarser failure domain. Data at RF2 needs only two copies, but the cluster's metadata and quorum services need an odd number of independent homes to retain a majority after one domain is lost. Count the minimum failure domains those quorum services require, not just the number of data copies.

### FDN-H-003
domain: foundation
difficulty: 4
tags: two-node, witness, failure-handling, robo
reference: Prism Web Console Guide - Two-Node Clusters

Q: In a healthy two-node cluster with a Witness, one node suddenly fails. What keeps the cluster serving I/O?
- [x] The Witness arbitrates leadership to the surviving node, which continues in single-node mode and rebuilds redundancy across its local disks
- [ ] The Witness VM promotes itself to a third data-serving node until the failed node returns
- [ ] The cluster halts all I/O until both original nodes are back online
- [ ] The surviving node forwards all writes to the Witness VM for safekeeping

Explain: The Witness only arbitrates; it never stores or serves cluster data. When a node fails, the Witness grants leadership to the survivor, which keeps running (transitioning toward single-node operation) and restores redundancy across its own disks so two data copies are maintained within the remaining node. When the peer returns, the cluster resynchronizes and rebuilds two-node redundancy.
Clue: Keep the Witness's job narrow: it is a tie-breaker, not a storage device, so any option that has it holding or serving data is wrong. With one node gone, the survivor must still honor two copies of data somehow, which it can only do using the disks it still has. Picture the cluster degrading gracefully to a single node rather than stopping.

### FDN-H-004
domain: foundation
difficulty: 4
tags: single-node, robo, resiliency, replication-factor
reference: Prism Web Console Guide - Single-Node Clusters

Q: A single-node Nutanix cluster is deployed as a ROBO backup target. Which statement about its data resiliency is correct?
- [x] It keeps two data copies on separate disks within the node, so it survives a disk failure but not loss of the node
- [ ] It stores only one copy of data, so any single disk failure causes data loss
- [ ] It requires a Witness VM in order to tolerate disk failures
- [ ] It automatically replicates every write to Prism Central for redundancy

Explain: A single-node cluster still operates at RF2 by keeping two copies of each data block on different disks within the same node, so it tolerates a drive failure and can rebuild if free capacity allows. It cannot survive loss of the node itself, and unlike a two-node cluster it does not use a Witness.
Clue: Even with one physical node, the storage fabric still wants the same number of copies it would keep anywhere else; it just has to find separate homes for them inside the single chassis. Ask what the smallest independent failure unit is when there is only one node, and what kind of failure that protects against versus what it fundamentally cannot.

### LCM-E-001
domain: lifecycle
difficulty: 1
tags: lcm, inventory, updates
reference: Acropolis Life Cycle Manager Guide

Q: An administrator wants a single Prism tool that inventories the firmware and software versions running across the cluster and applies available updates. Which feature provides this?
- [ ] Foundation
- [x] Life Cycle Manager (LCM)
- [ ] Nutanix Cluster Check (NCC)
- [ ] Prism Central Playbooks

Explain: LCM inventories installed firmware and software versions and applies updates from one interface. Foundation images nodes, NCC runs health checks, and Playbooks automate operational tasks.

### LCM-E-002
domain: lifecycle
difficulty: 1
tags: lcm, firmware, software
reference: Acropolis Life Cycle Manager Guide

Q: A new administrator asks whether LCM only handles software like AOS, or also device firmware such as BIOS and disk firmware. Which statement is correct?
- [x] LCM manages both software components and device firmware
- [ ] LCM manages only software; firmware needs a manual vendor tool
- [ ] LCM manages only firmware; software uses a separate portal
- [ ] LCM manages neither; all updates are run from the CVM CLI

Explain: LCM is a unified framework covering both software (AOS, NCC, Foundation, AHV) and device firmware (BIOS, BMC, disk, HBA, NIC), so a single tool tracks and updates both.

### LCM-E-003
domain: lifecycle
difficulty: 1
tags: aos, one-click, upgrade
reference: Prism Web Console Guide - Software and Firmware Upgrades

Q: An administrator selects an AOS target version and clicks Upgrade in Prism. Which statement best describes the '1-click' AOS upgrade?
- [ ] The admin must manually SSH to each CVM and run the installer
- [ ] The cluster must be fully shut down before AOS can be upgraded
- [x] Prism orchestrates the AOS upgrade across all nodes automatically
- [ ] Only one node is upgraded; the rest must be done later by hand

Explain: The 1-click upgrade orchestrates the AOS software upgrade across the whole cluster automatically, without per-node manual installation or a cluster shutdown.

### LCM-E-004
domain: lifecycle
difficulty: 1
tags: rolling-upgrade, aos, availability
reference: Prism Web Console Guide - Software and Firmware Upgrades

Q: During an AOS upgrade an administrator notices the cluster stays online and VMs keep running. How does AOS apply the upgrade to achieve this?
- [x] It upgrades and reboots one node at a time in a rolling fashion
- [ ] It upgrades all nodes simultaneously during a maintenance window
- [ ] It requires powering off all user VMs first
- [ ] It clones the cluster and switches over when finished

Explain: AOS upgrades are rolling: each CVM is upgraded and restarted one at a time while the other nodes keep serving I/O, so the cluster and its VMs stay online.

### LCM-M-001
domain: lifecycle
difficulty: 3
tags: lcm, inventory
reference: Acropolis Life Cycle Manager Guide

Q: An administrator opens LCM to apply firmware updates but sees no available updates listed. Which operation must run first so LCM can determine what is installed and what applies?
- [ ] Foundation imaging
- [ ] Cluster expansion
- [ ] Genesis restart
- [x] Inventory

Explain: LCM must run an Inventory operation to detect current component versions and query the update source; only then does it present the applicable updates.

### LCM-M-002
domain: lifecycle
difficulty: 3
tags: lcm, dark-site, local-web-server
reference: Acropolis Life Cycle Manager Guide - Dark Site Deployment

Q: A cluster in a secure facility has no internet access. How can the administrator still use LCM to update firmware and software?
- [x] Configure LCM to use a local (dark-site) web server hosting the LCM bundles
- [ ] LCM cannot be used without internet; use manual firmware tools only
- [ ] Temporarily open a direct path from the CVMs to the Nutanix portal
- [ ] Copy updates onto USB drives and insert them into each node

Explain: For dark sites you host the LCM framework and update bundles on a local web server and point LCM at it, so updates work without any direct internet access.

### LCM-M-003
domain: lifecycle
difficulty: 3
tags: foundation, lcm, roles
reference: Field Installation Guide (Foundation); Acropolis Life Cycle Manager Guide

Q: An administrator is unsure whether to use Foundation or LCM for a task. Which statement correctly distinguishes their primary roles?
- [ ] Both perform identical functions and are interchangeable
- [ ] Foundation updates firmware on running clusters; LCM images bare-metal nodes
- [x] Foundation images and provisions nodes to build clusters; LCM updates an existing cluster's software and firmware
- [ ] Foundation runs health checks; LCM creates user VMs

Explain: Foundation handles bare-metal imaging and initial cluster creation/expansion, while LCM manages lifecycle updates (software and firmware) of an already-running cluster.

### LCM-M-004
domain: lifecycle
difficulty: 3
tags: ncc, pre-upgrade, health-check
reference: Prism Web Console Guide; Nutanix Cluster Check (NCC) Guide

Q: Before starting a major AOS upgrade, which action is the recommended best practice to validate cluster health first?
- [ ] Delete old snapshots to free up space
- [x] Run a full NCC health check and resolve any critical failures
- [ ] Disable data resiliency to speed up the upgrade
- [ ] Reboot every CVM to clear memory

Explain: Running Nutanix Cluster Check (NCC) before an upgrade surfaces health issues that could cause it to fail. Disabling resiliency or rebooting CVMs is never recommended and does not validate health.

### LCM-H-001
domain: lifecycle
difficulty: 4
tags: data-path-redundancy, rolling-upgrade, resiliency
reference: AOS Storage Guide / Nutanix Bible - Data Path Redundancy

Q: During a rolling AOS upgrade, one CVM is offline while it restarts. Which mechanism ensures user VMs on that host still have storage access throughout?
- [x] Data Path Redundancy redirects that host's I/O to a healthy peer CVM while replica copies serve the data
- [ ] The user VMs are paused until their local CVM returns
- [ ] All data is cached in the host's RAM during the CVM restart
- [ ] The node's disks are temporarily mounted directly by the hypervisor

Explain: When a local CVM is down, Data Path Redundancy transparently reroutes that host's storage I/O to another CVM, and because AOS keeps redundant replicas (RF2/RF3) the data stays available - so VMs are not paused.
Clue: Think about a host whose local CVM is briefly gone. Nutanix keeps multiple copies of every block on different nodes (the replication factor), and the storage stack can reroute that host's I/O to a peer controller. Nothing has to pause because another copy is always reachable.

### LCM-H-002
domain: lifecycle
difficulty: 4
tags: ahv, hypervisor-upgrade, live-migration, maintenance-mode
reference: AHV Administration Guide; Acropolis Life Cycle Manager Guide

Q: An administrator initiates an AHV hypervisor upgrade through LCM on a running cluster. What happens to the user VMs on a host as it is being upgraded?
- [ ] They are powered off, then powered back on after the host reboots
- [ ] They keep running on the host during its reboot with no interruption
- [ ] They are deleted and recreated from templates on other hosts
- [x] They are live-migrated to other hosts, then the host enters maintenance mode and reboots

Explain: LCM places the host in maintenance mode, which live-migrates its running VMs to other hosts before upgrading and rebooting it; the VMs are not powered off. This is why the cluster needs spare capacity to absorb them.
Clue: Consider how a hypervisor host can reboot without dropping its workloads. AHV can move running VMs between hosts without powering them off, and the upgrade uses a maintenance mode that evacuates the host first. The catch is that other hosts must have room to receive those VMs.

### LCM-H-003
domain: lifecycle
difficulty: 4
tags: lcm, framework-update, upgrade-order
reference: Acropolis Life Cycle Manager Guide - LCM Framework Updates

Q: An administrator runs LCM inventory and, before any component updates are offered, LCM performs an update on itself. Why does LCM update its own framework first?
- [ ] It is upgrading AOS, which is bundled inside the LCM framework
- [x] The framework must be current to correctly detect components and apply the latest update modules
- [ ] The self-update reboots the cluster, which must happen before other updates
- [ ] It replaces Foundation, which LCM depends on to image nodes

Explain: LCM refreshes its own framework first so it has the newest detection logic and update modules to accurately inventory components and apply later updates; the framework update does not upgrade AOS or reboot the cluster.
Clue: Ask why a tool would patch itself before patching anything else. LCM's detection and update logic lives in modules that ship separately from any product; if that logic is stale it might misread versions or miss newly supported components. Bringing the framework current is a prerequisite step, not an AOS or cluster-level change.

### LCM-H-004
domain: lifecycle
difficulty: 4
tags: lcm, dependencies, upgrade-order, compatibility
reference: Acropolis Life Cycle Manager Guide

Q: When multiple components are selected in LCM, how does it handle dependencies such as AOS and AHV needing compatible versions?
- [ ] The administrator must manually calculate and enforce the correct order
- [ ] LCM applies all selected updates in parallel regardless of dependencies
- [x] LCM sequences the updates automatically to satisfy dependency and compatibility ordering
- [ ] LCM ignores compatibility and relies on the admin to pick valid versions

Explain: LCM understands inter-component dependencies and orders the selected updates so compatibility is maintained (for example, ensuring the running AOS supports the target AHV) rather than leaving the sequencing to the operator.
Clue: Consider why you can queue several updates at once and trust the result. Certain components have version compatibility relationships - a hypervisor version must be supported by the running storage OS, for instance. The lifecycle tool encodes those relationships and schedules the operations in a safe sequence instead of leaving ordering to you.

### MOVE-E-001
domain: migration
difficulty: 1
tags: move, architecture, migration-tool
reference: Nutanix Move User Guide

Q: An administrator wants to migrate virtual machines from a VMware ESXi cluster onto a Nutanix AHV cluster with minimal manual effort. Which Nutanix tool is purpose-built for this task?
- [ ] Nutanix Foundation
- [ ] Prism Central
- [x] Nutanix Move
- [ ] Nutanix Life Cycle Manager (LCM)

Explain: Nutanix Move is the free, purpose-built migration appliance for moving VMs between hypervisors and clouds onto AHV (or ESXi). Foundation images/deploys nodes, LCM handles firmware/software upgrades, and Prism Central is multi-cluster management - none of those perform VM migrations.

### MOVE-E-002
domain: migration
difficulty: 1
tags: move, appliance, deployment
reference: Nutanix Move User Guide - Deploying Move

Q: A team is planning a migration project and asks how Nutanix Move is deployed in their environment. In what form does Move run?
- [x] As a downloadable virtual appliance (VM) deployed on the cluster
- [ ] As a service that is always enabled inside every CVM
- [ ] As a physical hardware appliance shipped by Nutanix
- [ ] As a browser plug-in installed on the admin workstation

Explain: Move is distributed as a lightweight virtual appliance (a VM) that you deploy on an AHV or ESXi cluster and manage through its own web UI. It is not built into the CVM, not a physical appliance, and not a browser plug-in.

### MOVE-E-003
domain: migration
difficulty: 1
tags: move, agentless, architecture
reference: Nutanix Move User Guide

Q: An administrator is describing Nutanix Move to colleagues and emphasizes that it does not require installing migration software inside each guest VM beforehand. What characteristic of Move is being described?
- [ ] It requires a persistent kernel agent in every VM
- [ ] It only migrates powered-off VMs
- [ ] It clones VMs by exporting them to OVF manually
- [x] It performs agentless migration

Explain: Move performs agentless migration - it connects to the source environment's management layer (for example vCenter) rather than requiring a permanent agent installed in each guest. This is a key reason Move simplifies large migrations.

### MOVE-E-004
domain: migration
difficulty: 1
tags: move, source, target, migration-plan
reference: Nutanix Move User Guide - Adding Environments

Q: Before any data is copied, a Move migration plan requires the administrator to define two endpoints. What are these two endpoints called?
- [ ] A primary site and a witness site
- [x] A source environment and a target environment
- [ ] A protection domain and a remote site
- [ ] A metro cluster and a stretch VLAN

Explain: A Move migration plan is built by adding a source environment (for example ESXi/vCenter, Hyper-V, or AWS) and a target environment (typically an AHV cluster), then selecting the VMs to migrate between them. The other terms belong to disaster-recovery and metro-availability features, not Move.

### MOVE-M-001
domain: migration
difficulty: 3
tags: move, virtio, vmware-tools, guest-preparation
reference: Nutanix Move User Guide - Automatic Guest Preparation

Q: During a Move migration from ESXi to AHV, the guest OS boots on AHV using VirtIO devices and its VMware Tools are removed. When does Move perform this in-guest preparation by default?
- [ ] Only if the administrator manually runs a script inside each VM first
- [ ] After cutover, requiring a second reboot initiated by the admin
- [x] Automatically as part of the migration, when guest credentials are provided
- [ ] Never - the administrator must install VirtIO by hand before seeding

Explain: When valid guest credentials are supplied, Move performs automatic in-guest preparation - installing the VirtIO drivers needed to boot on AHV and uninstalling VMware Tools - so the VM boots cleanly after cutover. Without credentials, Move can fall back to manual preparation, but the default automated path handles it for you.

### MOVE-M-002
domain: migration
difficulty: 3
tags: move, changed-block-tracking, seeding, incremental
reference: Nutanix Move User Guide - Data Seeding and Cutover

Q: An administrator seeds several large VMs with Move and, over the following days, the source VMs keep changing. How does Move keep the target copy current while the source stays online, so that cutover only transfers a small final delta?
- [ ] It re-copies every disk in full on each sync interval
- [x] It uses changed-block tracking to copy only blocks modified since the last sync
- [ ] It quiesces the source VM and blocks all writes during seeding
- [ ] It relies on the guest OS to email changed files to the appliance

Explain: Move leverages changed-block tracking (CBT) on the source so that after the initial full seed, each incremental sync copies only the blocks that changed. This keeps the target nearly in sync while the source keeps running, minimizing the data - and therefore downtime - at cutover.

### MOVE-M-003
domain: migration
difficulty: 3
tags: move, bandwidth, throttling, network
reference: Nutanix Move User Guide - Bandwidth Throttling

Q: A migration must run during business hours, and the network team is worried Move's data copy will saturate the link between the source and the Nutanix cluster. Which Move capability directly addresses this concern?
- [ ] Deduplication of the guest file system
- [ ] Compression of the Move appliance logs
- [x] Network bandwidth throttling on the migration plan
- [ ] Erasure coding of the migrated vdisks

Explain: Move lets you configure bandwidth throttling so the data-seeding traffic is capped, protecting production links during business hours. Dedup, compression, and erasure coding are storage-efficiency features unrelated to controlling migration link utilization.

### MOVE-M-004
domain: migration
difficulty: 3
tags: move, phases, seeding, cutover, workflow
reference: Nutanix Move User Guide - Migration Plan Lifecycle

Q: An administrator lists the phases a Move migration plan proceeds through for each VM. Which sequence correctly reflects the Move workflow?
- [x] Source preparation, then data seeding, then cutover
- [ ] Cutover, then data seeding, then validation
- [ ] Data seeding, then rollback, then source preparation
- [ ] Cutover, then source preparation, then seeding

Explain: A Move plan first prepares the source and validates it, then performs data seeding (the initial full copy plus incremental syncs), and finally cutover, where the source is powered off, a last delta is copied, and the VM starts on AHV. The other orderings put cutover or rollback before the copy has completed, which is not how the workflow runs.

### MOVE-H-001
domain: migration
difficulty: 4
tags: move, mac-address, retain, regenerate, network
reference: Nutanix Move User Guide - Migration Plan Network Settings

Q: A migrated application uses licensing tied to the VM's network adapter identity, and the app team insists nothing about the NIC change after moving to AHV. When configuring the Move migration plan, which setting preserves this identity?
- [ ] Enable changed-block tracking on the target NIC
- [x] Retain the original MAC addresses rather than regenerate them
- [ ] Set the target network to an unmanaged VLAN
- [ ] Assign a new static IP from the AHV IPAM pool

Explain: Move offers an option to retain the source VM's MAC addresses instead of generating new ones. Retaining the MAC preserves adapter identity so MAC-bound licensing keeps working, whereas regenerating would break it. IPAM and VLAN choices affect addressing, not the hardware MAC that the licensing checks.
Clue: Ethernet adapters carry a hardware-layer address that is separate from any IP assignment. Some software binds its license or its ARP-dependent behavior to that lower-layer identifier, so if the migration hands the guest a freshly generated one, that binding breaks. A well-designed migration tool therefore lets you decide whether that identifier should carry over unchanged or be created anew.

### MOVE-H-002
domain: migration
difficulty: 4
tags: move, test, validation, cutover, pre-cutover
reference: Nutanix Move User Guide - Validating a Migration

Q: Before committing to cutover for a business-critical VM, an administrator wants to confirm the migrated copy actually boots and behaves correctly on AHV without disrupting the still-running source. Which Move capability supports this?
- [ ] Delete the migration plan and recreate it to force a fresh boot
- [x] Run a test/validation of the migrated VM on the target before cutover
- [ ] Power off the source VM early to free its MAC address
- [ ] Switch the plan from agentless to agent-based mode

Explain: Move can validate the migrated VM by test-booting it on the target so you can verify it comes up correctly, all while the source keeps running and serving users. This de-risks the actual cutover. Powering off the source early would cause the very downtime the test is meant to avoid.
Clue: The whole point of seeding data while the source keeps running is that you can rehearse the destination without touching production. A careful migrator wants proof the copy powers on and the application responds before the irreversible switch, and does so in a way that leaves the live workload untouched. Look for the option that exercises the target copy while the original still serves users.

### MOVE-H-003
domain: migration
difficulty: 4
tags: move, rollback, cutover, source-vm, recovery
reference: Nutanix Move User Guide - Cutover and Rollback Considerations

Q: A cutover to AHV completed, but the application team reports the migrated VM misbehaves and wants to fall back to the original. From a rollback-planning standpoint, what is the safest practice Move relies on to make this possible?
- [ ] Move automatically reverses all copied blocks back to the source
- [ ] Rollback restores the VM from a Prism protection-domain snapshot
- [x] The source VM is left intact and powered off at cutover, so it can be powered back on
- [ ] The target VM is deleted and re-seeded from scratch to recover

Explain: At cutover Move powers off the source VM but does not delete it, so the original remains available as a fallback if the migrated VM has problems. There is no automatic reverse-sync of data back to the source; sound rollback planning depends on keeping the untouched source VM until the migration is fully validated.
Clue: A safe migration never destroys the original at the moment of switchover. Because the tool has been copying data one direction only, there is no automatic way to push changes back the other way once you commit. Your recovery path is therefore the pristine, powered-down original, which is exactly why you should not delete it until the new copy has proven itself.

### MOVE-H-004
domain: migration
difficulty: 4
tags: move, sources, esxi, hyper-v, aws, support-matrix
reference: Nutanix Move Support Matrix

Q: An architect is scoping which environments a single Nutanix Move deployment can migrate FROM into an AHV target. Which of the following are supported source environments for Move? (Select all that apply.)
- [x] VMware ESXi / vCenter
- [x] Microsoft Hyper-V
- [ ] IBM mainframe LPARs
- [x] Amazon Web Services EC2 instances

Explain: Move supports migrating from VMware ESXi/vCenter, Microsoft Hyper-V, and AWS EC2 (among other sources) into AHV. IBM mainframe LPARs are not a supported Move source - Move targets x86 hypervisor and public-cloud workloads, not mainframe partitions.
Clue: Move is built to consolidate mainstream x86 virtualization and public-cloud compute onto AHV. Think about which platforms run the commodity guest operating systems Move knows how to re-driver and re-boot: the major on-prem hypervisors and a leading public cloud's instance service all qualify. A legacy big-iron partitioning technology running non-x86 workloads is outside that scope.

### MON-E-001
domain: monitoring
difficulty: 1
tags: ncc, health-checks, diagnostics
reference: Nutanix NCC Guide

Q: An administrator wants to proactively surface configuration, hardware, and performance issues on a Nutanix cluster before they cause an outage. Which built-in utility runs a broad battery of health checks against cluster components?
- [x] NCC (Nutanix Cluster Check)
- [ ] Foundation
- [ ] Logbay
- [ ] Prism Central Playbooks

Explain: NCC (Nutanix Cluster Check) is the diagnostic framework that runs hundreds of health checks across hardware, AOS services, and configuration. Foundation is for imaging/deploying nodes, and Logbay only collects log bundles rather than evaluating health.

### MON-E-002
domain: monitoring
difficulty: 1
tags: ncc, cli, cvm
reference: Nutanix NCC Guide - Running NCC Checks

Q: From an SSH session on a Controller VM, which command runs the complete set of NCC health checks on the cluster?
- [x] ncc health_checks run_all
- [ ] cluster status
- [ ] ncli health check-all
- [ ] allssh run ncc

Explain: The full check suite is launched with 'ncc health_checks run_all' from any CVM. 'cluster status' reports AOS service state, not health checks, and the other two are not valid NCC commands.

### MON-E-003
domain: monitoring
difficulty: 1
tags: alerts, events, monitoring
reference: Prism Web Console Guide - Alert and Event Monitoring

Q: In Prism, what best distinguishes an event from an alert?
- [x] An event records a routine cluster status change and needs no action by itself, while an alert flags a condition that warrants attention
- [ ] An event is always a higher severity than an alert
- [ ] Events exist only in Prism Central while alerts exist only in Prism Element
- [ ] Events must be acknowledged manually while alerts always clear on their own

Explain: Events are informational records of state changes or actions in the cluster and generally require no response, whereas alerts are raised when a monitored condition needs administrator attention. Severity, location, and acknowledgment behavior are not what separates the two.

### MON-E-004
domain: monitoring
difficulty: 1
tags: ncc, prism, health-dashboard
reference: Prism Web Console Guide - Health Monitoring

Q: Without using the CLI, an administrator wants to launch the NCC health checks from the Prism Element web interface. From which dashboard is the 'Run Checks' action available?
- [x] Health dashboard
- [ ] Home dashboard
- [ ] Storage dashboard
- [ ] Settings > Cluster Details

Explain: The Health dashboard's Actions menu provides 'Run Checks' (and 'Collect Logs') so NCC can be run from the GUI instead of a CVM shell. The Home and Storage dashboards summarize status but do not launch NCC.

### MON-M-001
domain: monitoring
difficulty: 3
tags: alerts, severity, alert-policy
reference: Prism Alerts Reference - Alert Policies

Q: When reviewing and configuring alert policies in Prism, which set correctly lists the three severity levels Nutanix assigns to alerts?
- [x] Critical, Warning, Info
- [ ] Critical, Major, Minor
- [ ] High, Medium, Low
- [ ] Fatal, Error, Warning

Explain: Nutanix classifies alerts as Critical, Warning, or Info, and policies can be enabled or filtered by these levels. The other groupings borrow from other vendors' schemes and are not used by Prism.

### MON-M-002
domain: monitoring
difficulty: 3
tags: logbay, log-collection, ncc
reference: NCC Guide - Log Collection (Logbay)

Q: Support asks an administrator to gather a diagnostic log bundle spanning several hours across all nodes of the cluster. Which current Nutanix utility is purpose-built for this log collection?
- [x] Logbay
- [ ] Genesis
- [ ] Curator
- [ ] Foundation

Explain: Logbay is the NCC log-collection framework that gathers and bundles logs across the cluster (superseding the older log_collector). Genesis manages cluster services, Curator runs background storage scans, and Foundation images nodes.

### MON-M-003
domain: monitoring
difficulty: 3
tags: syslog, rsyslog, log-forwarding, siem
reference: Prism Web Console Guide - Configuring Syslog

Q: An administrator must forward AOS, audit, and API request logs from a cluster to a central SIEM. What must be configured on the cluster to enable this forwarding?
- [x] A remote syslog (rsyslog) server entry specifying the modules and minimum severity levels to forward
- [ ] An SNMP v3 trap receiver
- [ ] An SMTP relay under the email alert settings
- [ ] A Prism Central category applied to each host

Explain: Log forwarding to a SIEM is done by configuring a remote syslog (rsyslog) server, where you select which modules to send and the minimum severity. SNMP traps and SMTP carry alerts, not the underlying log streams, and categories are for policy grouping.

### MON-M-004
domain: monitoring
difficulty: 3
tags: alerts, auto-resolve, alert-policy
reference: Prism Central Alerts Reference - Alert Policies

Q: An administrator notices that certain alerts disappear from the Alerts page on their own once the underlying condition is no longer present, without anyone clearing them. Which Prism capability explains this?
- [x] Auto-resolve, where eligible alerts clear automatically once the condition stops recurring
- [ ] Alert acknowledgment
- [ ] Severity-based alert suppression
- [ ] Alert throttling

Explain: Many alert policies support auto-resolve, so the alert is cleared automatically when the triggering condition has not recurred. Acknowledgment only marks an alert as seen (it stays until resolved), while suppression and throttling control whether/how often alerts are raised.

### MON-H-001
domain: monitoring
difficulty: 4
tags: snmp, monitoring, traps, versions
reference: Prism Web Console Guide - Configuring SNMP

Q: An administrator is configuring SNMP monitoring directly on a Nutanix cluster through Prism. Which statement most accurately describes AOS SNMP support?
- [x] SNMP v2c and v3 are supported (v2c is for traps only); SNMP v1 is not supported
- [ ] Only SNMP v1 and v2c are supported
- [ ] SNMP v1, v2c, and v3 are all fully supported for both GET and traps
- [ ] Only SNMP v3 is supported, and only for GET operations

Explain: AOS supports SNMP v2c and v3 but not v1, and for v2c only traps are supported (no GET/polling). Full GET plus trap support requires SNMP v3 with a configured user, which is why the v3-based user/auth/priv model appears in the Prism SNMP page.
Clue: Nutanix deliberately dropped legacy SNMP v1. The v2c implementation is limited to sending traps outbound, so a monitoring station cannot poll (GET) the cluster over v2c. To both poll metrics and receive traps you must use SNMP v3, which is why the Prism SNMP configuration is built around v3 users with authentication and privacy settings and an engine ID.

### MON-H-002
domain: monitoring
difficulty: 4
tags: analysis, metric-chart, custom-metrics, performance
reference: Prism Web Console Guide - Analysis Dashboard

Q: A performance engineer wants to overlay CVM CPU usage and cluster IOPS on a single time-series graph over a custom time window to correlate them. Which Prism feature is designed for this?
- [x] Build a metric chart on the Analysis dashboard
- [ ] Read the Health dashboard summary tiles
- [ ] Define a new alert policy
- [ ] Open the Hardware diagram view

Explain: The Analysis dashboard lets you create metric charts (and entity charts) that plot chosen metrics over a selectable time range so they can be compared on one graph. The Health dashboard and Hardware diagram show current status, not custom historical trend overlays, and alert policies define thresholds rather than visualize data.
Clue: Prism separates status views from trend analysis. The Analysis dashboard is where you construct charts over an arbitrary time range: a metric chart plots one or more metrics (like cluster IOPS or CVM CPU), while an entity chart tracks a metric for a specific entity such as a VM or disk. Because you choose the metrics and the window, it is the right tool for correlating two signals on one timeline.

### MON-H-003
domain: monitoring
difficulty: 4
tags: entity-metrics, latency, iops, stargate, performance
reference: Prism Web Console Guide - Performance Monitoring

Q: In the Prism VM performance view, an administrator sees Controller IOPS, Controller Bandwidth, and Controller Latency for a VM. What does the 'Controller' qualifier indicate about these numbers?
- [x] They reflect I/O as measured by the Stargate storage controller (CVM) serving the VM, not raw physical disk device counters
- [ ] They are taken solely from the hypervisor's virtual disk layer
- [ ] They are SNMP-polled counters read directly from the physical drives
- [ ] They report the host physical NIC controller throughput

Explain: The 'Controller' metrics represent I/O as seen by the CVM's Stargate storage controller that services the VM's I/O, which is why they can differ from bare physical device counters or the hypervisor's own view. They are not NIC or raw drive statistics.
Clue: In Nutanix, every VM's storage I/O is served by the local CVM's Stargate process, the storage 'controller'. Prism's Controller IOPS/Bandwidth/Latency therefore describe the I/O stream at that software controller layer for the entity, which is the number that actually reflects the VM's storage experience. It is distinct from a physical disk's device counters or the hypervisor's local view, so comparing Controller latency to disk latency helps localize where a bottleneck sits.

### MON-H-004
domain: monitoring
difficulty: 4
tags: smtp, email-alerting, notifications
reference: Prism Web Console Guide - Configuring SMTP and Alert Email

Q: Automated alert emails from a cluster stopped arriving after a recent network change. Alert policies are still enabled and Prism is actively generating alerts. What is the most likely cause?
- [x] The SMTP server configuration in Prism (host, port, security, and from/to addresses) is now unreachable or incorrect
- [ ] The remote syslog server entry is misconfigured
- [ ] The SNMP engine ID changed after the network update
- [ ] Pulse telemetry was disabled in the settings

Explain: Alerts are still being raised in Prism, so the alerting engine is fine; the failure is in email delivery, which depends on the SMTP server settings (reachable host, correct port/security, valid sender and recipients). Syslog, SNMP, and Pulse are separate channels and do not carry the alert email.
Clue: Separate the detection of an alert from its delivery. Prism raising alerts proves the policy/health engine works; the problem is the transport. Email notifications flow through the configured SMTP server, so a network change that makes that server unreachable, or wrong port/TLS/addresses, silently stops the mail while alerts keep appearing in the UI. Syslog and SNMP are independent notification paths and Pulse is support telemetry, none of which delivers your alert emails.

### NET-E-001
domain: networking
difficulty: 1
tags: ahv, open vswitch, bridge, br0
reference: AHV Administration Guide - AHV Networking

Q: A new administrator inspects a freshly deployed AHV host and wants to know which Open vSwitch bridge the hypervisor creates by default to carry CVM and VM traffic. What is that default bridge named?
- [x] br0
- [ ] br1
- [ ] vmbr0
- [ ] vSwitch0

Explain: AHV is built on Open vSwitch, and every host is deployed with a default bridge named br0 that carries CVM and guest VM traffic. br1 would be an additional bridge you create manually, while vmbr0 and vSwitch0 belong to other hypervisors.

### NET-E-002
domain: networking
difficulty: 1
tags: bond, uplink, active-backup, virtual switch
reference: AHV Administration Guide - Host Network Management

Q: An administrator deploys a cluster and does not change any networking settings. Which uplink bond mode is configured by default on the AHV virtual switch?
- [x] active-backup
- [ ] balance-slb
- [ ] balance-tcp (LACP)
- [ ] round-robin

Explain: AHV defaults to active-backup, where only one uplink is active at a time and no special switch configuration is required. balance-slb and balance-tcp are load-balancing modes you must opt into, and round-robin is not an AHV bond option.

### NET-E-003
domain: networking
difficulty: 1
tags: ipam, managed network, dhcp, unmanaged network
reference: Prism Web Console Guide - Network Configuration

Q: An administrator creates a VM network in Prism, enables Nutanix IPAM, and defines an IP pool for it. What service will this managed network now provide to VMs that attach to it?
- [x] DHCP IP address assignment from the configured pool
- [ ] Layer-3 routing between VLANs
- [ ] Automatic VLAN trunking to the physical switch
- [ ] NAT to the external network

Explain: A managed network uses Nutanix IPAM to act as a DHCP server, handing out addresses from the pool you define; an unmanaged network instead relies on an external DHCP server. AHV does not perform inter-VLAN routing, trunk negotiation, or NAT for guest networks.

### NET-E-004
domain: networking
difficulty: 1
tags: ahv, open vswitch, ovs
reference: AHV Administration Guide - AHV Networking

Q: A colleague asks which software switch technology AHV uses inside each host to move traffic between VMs, the CVM, and the physical uplinks. What is the correct answer?
- [x] Open vSwitch (OVS)
- [ ] VMware vSphere Distributed Switch
- [ ] Linux legacy bridge (brctl) only
- [ ] Cisco Nexus 1000V

Explain: AHV networking is implemented with Open vSwitch (OVS), which provides the bridges, bonds, and OpenFlow-based forwarding on each host. The other options belong to different platforms and are not what AHV uses.

### NET-M-001
domain: networking
difficulty: 3
tags: bond, balance-slb, lacp, uplink
reference: AHV Administration Guide - Bond Modes

Q: An administrator wants both uplinks of an AHV bond to share outbound VM traffic, but does not want to configure link aggregation (LACP) on the upstream physical switches. Which bond mode meets this requirement?
- [x] balance-slb
- [ ] balance-tcp
- [ ] active-backup
- [ ] active-active with LACP

Explain: balance-slb load-balances traffic across all uplinks using source-MAC hashing and does not require any link-aggregation configuration on the physical switches. balance-tcp (and active-active LACP) require LACP on the switch, and active-backup uses only one uplink at a time.

### NET-M-002
domain: networking
difficulty: 3
tags: balance-tcp, lacp, link aggregation, bond
reference: AHV Administration Guide - Bond Modes

Q: To achieve true per-flow load balancing so that a single VM's traffic can span the aggregate bandwidth of multiple uplinks, an administrator plans to use balance-tcp. What must be configured on the physical switch for this to work correctly?
- [x] Link aggregation with LACP on the ports connected to the host
- [ ] Nothing; the host negotiates it automatically
- [ ] Spanning-tree portfast only
- [ ] A separate VLAN for each uplink

Explain: balance-tcp performs Layer-4 (TCP flow) hashing and requires the upstream switch ports to be bundled in an LACP link-aggregation group. Without matching LACP configuration the bond will not form correctly; STP portfast and per-uplink VLANs do not provide aggregation.

### NET-M-003
domain: networking
difficulty: 3
tags: vlan, tagging, ovs, trunk
reference: AHV Administration Guide - VLAN Configuration

Q: In an AHV cluster, an administrator creates several VM networks, each mapped to a different VLAN ID. How does AHV deliver a frame from a VM on VLAN 30 onto the physical network?
- [x] OVS tags the frame with VLAN 30 as it egresses the uplink bond (trunk)
- [ ] The VM's guest OS must add the VLAN tag itself
- [ ] Each VLAN requires its own dedicated physical NIC
- [ ] AHV routes the traffic at Layer 3 into VLAN 30

Explain: An AHV VM network is essentially a VLAN; OVS applies the VLAN tag on egress, so the uplink must be a trunk carrying those VLANs. The guest OS is unaware of the tag, multiple VLANs share the same bonded uplinks, and AHV does not route between them.

### NET-M-004
domain: networking
difficulty: 3
tags: network visualization, lldp, prism, topology
reference: Prism Web Console Guide - Network Visualization

Q: An administrator opens the Network Visualization page in Prism to confirm which physical switch port each host uplink connects to. Which protocol must be enabled on the switch so Prism can display this host-to-switch topology?
- [x] LLDP on the physical switches
- [ ] SNMPv2 traps
- [ ] NetFlow export
- [ ] BGP peering

Explain: Prism's network visualization builds the host-to-physical-switch topology from LLDP neighbor information, so LLDP must be enabled on the connected switch ports. SNMP, NetFlow, and BGP are unrelated to discovering directly connected neighbor ports.

### NET-H-001
domain: networking
difficulty: 4
tags: flow, microsegmentation, monitor mode, security policy
reference: Flow Network Security Guide

Q: A security administrator has built a Flow Network Security application policy but wants to observe which flows it would permit or block before it actually starts dropping any traffic. Which policy state should be used first?
- [x] Monitor mode
- [ ] Enforce mode
- [ ] Quarantine mode
- [ ] Isolation mode

Explain: Flow Network Security policies can run in Monitor mode, where all traffic is still allowed but flows that would be blocked are visualized, letting you validate rules before switching to Enforce mode, which actually drops disallowed traffic. Quarantine and Isolation are separate policy types, not observation states.
Clue: Think about the safe way to roll out any firewall rule set: you first want to see what would happen before anything is actually dropped. Flow has a state that permits all traffic while still showing you, in the visualization, exactly which flows a rule would have denied. Only after you trust those results do you flip it to the state that truly enforces the drops. Do not confuse that observation state with the distinct policy types used to lock down or fence off individual VMs.

### NET-H-002
domain: networking
difficulty: 4
tags: cvm, network requirements, eth1, internal network
reference: AHV Administration Guide - Controller VM Network Requirements

Q: During a network review, an administrator examines a CVM's interfaces. Which interface carries the private, internal communication path between the CVM and its own local AHV host and must not be reconfigured?
- [x] eth1 on the 192.168.5.0/24 internal network
- [ ] eth0 on the external management network
- [ ] eth2 on the backplane network
- [ ] the br0 uplink bond

Explain: The CVM uses eth1 bound to the internal 192.168.5.x network for private communication with its local hypervisor host; disrupting it breaks local storage I/O. eth0 is external management, eth2 exists only when network segmentation/backplane is enabled, and the uplink bond is not a CVM eth interface.
Clue: Every CVM talks to its own host over a dedicated, non-routable private link so that local storage traffic never has to leave the node. There is a well-known private RFC1918 subnet reserved for exactly this host-to-CVM back channel, and touching it severs the local data path. Keep that internal link distinct from the externally reachable management address and from the optional segmented backplane interface that only appears once you enable network segmentation.

### NET-H-003
domain: networking
difficulty: 4
tags: virtual switch, rolling update, maintenance mode, vs0
reference: AHV Administration Guide - Virtual Switch Management

Q: An administrator changes the bond mode on the default virtual switch (vs0) from Prism Central and applies it. Using the default update method, how does AHV roll this change out across the cluster?
- [x] A rolling update that puts each host in maintenance mode and migrates its VMs before reconfiguring
- [ ] Simultaneously on all hosts with a brief cluster-wide outage
- [ ] Only on the host you selected, leaving the others unchanged
- [ ] At the next scheduled cluster reboot

Explain: The default (Standard) virtual switch update is a rolling operation: it live-migrates VMs off each host, puts the host in maintenance mode, applies the change, then moves to the next host, avoiding a cluster-wide outage. The Quick method skips maintenance mode but risks brief connectivity loss, and the change is cluster-wide rather than per-host.
Clue: A virtual switch is a cluster-wide object, so a change to it has to reach every host, but doing that all at once would be disruptive. The default method is deliberately conservative: it evacuates one host at a time by live-migrating its guests, quiesces that host, applies the change, then repeats down the line. There is a faster alternative that skips the evacuation step at the cost of a possible brief connectivity blip, but that is not the default.

### NET-H-004
domain: networking
difficulty: 4
tags: balance-slb, lacp, bond, switch configuration
reference: AHV Administration Guide - Bond Modes

Q: A team enabled balance-slb on an AHV bond, but the upstream switch ports for those uplinks were also configured as an LACP port-channel, and connectivity became unstable. What is the correct guidance for balance-slb regarding the physical switch?
- [x] The switch ports must NOT be in a link-aggregation/LACP group; balance-slb expects independent ports
- [ ] The ports must be in an LACP group for balance-slb to load balance
- [ ] balance-slb only works over a single active uplink
- [ ] balance-slb requires each uplink port in a different VLAN

Explain: balance-slb performs its own source-MAC load balancing and assumes each uplink faces an independent switch port; bundling those ports into an LACP port-channel causes MAC flapping and dropped traffic. Switch-side LACP aggregation is required only for balance-tcp, not for balance-slb.
Clue: Two of the load-balancing modes take opposite views of the physical switch. One does all the balancing itself inside the host by hashing source MAC addresses, and therefore needs each uplink to face an ordinary, independent switch port. The other hands balancing to a negotiated aggregation group and therefore requires the switch ports to be bundled together. Combining the host-side-balancing mode with a switch-side aggregation group makes the same MAC appear on multiple ports and breaks connectivity.

### PERF-E-001
domain: performance
difficulty: 1
tags: oplog, write buffer, random writes, latency
reference: The Nutanix Bible - Drive Breakdown / OpLog

Q: A database VM sends bursts of small, random writes. Which Distributed Storage Fabric component absorbs these writes first to keep write latency low?
- [ ] The Extent Store, the persistent capacity tier
- [x] The OpLog, a persistent write buffer on the fastest storage tier
- [ ] The Unified Cache held in CVM memory
- [ ] The Curator background scan framework

Explain: The OpLog is a persistent staging buffer on the highest-performance tier that coalesces random and bursty writes before draining them sequentially to the Extent Store. The Unified Cache is a read cache, and the Extent Store is where data eventually lands.

### PERF-E-002
domain: performance
difficulty: 1
tags: data locality, reads, latency
reference: The Nutanix Bible - Data Locality

Q: A VM runs on Node A of a Nutanix cluster. Under steady-state operation, where are that VM's reads primarily served from to minimize latency?
- [ ] Round-robin across every node in the cluster
- [ ] Always from whichever node holds the second RF copy
- [ ] From an external storage array over the network
- [x] From the local node's storage, via data locality

Explain: DSF data locality keeps a running VM's active data on the same node as the VM, so reads are served locally over the internal bus rather than the network. When a VM migrates, locality is re-established as data is read.

### PERF-E-003
domain: performance
difficulty: 1
tags: sizer, sizing, capacity planning
reference: Nutanix Sizer documentation

Q: Before deploying a cluster, an administrator must translate a customer's VM, IOPS, and capacity requirements into a recommended node configuration. Which Nutanix tool is designed for this?
- [x] Nutanix Sizer
- [ ] Nutanix X-Ray
- [ ] Nutanix Move
- [ ] Nutanix Foundation

Explain: Nutanix Sizer takes workload requirements and recommends an appropriate node count and model. X-Ray is for benchmarking, Move is for migration, and Foundation is for imaging and deploying nodes.

### PERF-E-004
domain: performance
difficulty: 1
tags: x-ray, benchmarking, testing
reference: Nutanix X-Ray documentation

Q: A team wants to benchmark and stress-test cluster performance and resiliency using realistic, automated scenarios before going to production. Which Nutanix tool is built for this?
- [ ] Nutanix Sizer
- [ ] Nutanix Move
- [x] Nutanix X-Ray
- [ ] Nutanix Foundation

Explain: Nutanix X-Ray is a testing and benchmarking framework that runs automated, real-world scenarios to evaluate performance and resiliency. Sizer only estimates a configuration, and Foundation images nodes.

### PERF-M-001
domain: performance
difficulty: 3
tags: oplog, sequential writes, extent store
reference: The Nutanix Bible - OpLog / Draining

Q: A backup job streams a large, sequential write to a VM's disk. How does the Distributed Storage Fabric typically treat this sequential I/O relative to the OpLog?
- [ ] It is always staged in the OpLog first, like every write
- [ ] It is cached in the Unified Cache instead of being written
- [x] It bypasses the OpLog and is written directly to the Extent Store
- [ ] It is buffered until the OpLog fully drains

Explain: The OpLog exists to coalesce random writes; large sequential streams gain nothing from staging, so DSF bypasses the OpLog and writes them directly to the Extent Store. This avoids double-writing large sequential I/O.

### PERF-M-002
domain: performance
difficulty: 3
tags: ads, noisy neighbor, lazan, contention
reference: AHV Administration Guide - Acropolis Dynamic Scheduling

Q: A noisy-neighbor VM is causing sustained CPU contention on one node, degrading other VMs. Which Nutanix feature automatically detects the hotspot and live-migrates workloads to remediate it?
- [ ] Data Locality
- [x] Acropolis Dynamic Scheduling (ADS)
- [ ] Erasure Coding (EC-X)
- [ ] Redundancy Factor (RF)

Explain: ADS, driven by the Lazan service, continuously monitors CPU and storage-controller contention and live-migrates VMs or volume groups off hotspot nodes to rebalance load. EC-X and RF address data efficiency and resiliency, not compute scheduling.

### PERF-M-003
domain: performance
difficulty: 3
tags: storage-only node, storage-heavy, compute-only, scaling
reference: Nutanix - Storage-only and Compute-only nodes

Q: A cluster is low on storage capacity but has ample CPU and memory. The administrator adds nodes that contribute storage and I/O to the fabric but do not host user VMs. What are these nodes called?
- [ ] Compute-only nodes
- [ ] Witness nodes
- [ ] Prism Central nodes
- [x] Storage-only (storage-heavy) nodes

Explain: Storage-only nodes run AHV and a CVM to add capacity and I/O to DSF but do not run user VMs, which is ideal when capacity is the constraint. Compute-only nodes are the inverse, adding CPU and memory without contributing local storage to the fabric.

### PERF-M-004
domain: performance
difficulty: 3
tags: working set, hot data, tiering, cache
reference: The Nutanix Bible - Storage Tiering and Prioritization

Q: When sizing SSD and cache to sustain a workload's performance, an administrator focuses on the 'working set.' What does the working set represent?
- [x] The actively and frequently accessed subset of a workload's data over a period
- [ ] The total raw capacity of all disks in the cluster
- [ ] The number of CVMs participating in each write
- [ ] The complete set of snapshots retained for a VM

Explain: The working set is the portion of data that is actively accessed (the hot data); keeping it resident in the flash tier and Unified Cache is what drives high performance. Sizing flash and cache to hold the working set is a key performance consideration.

### PERF-H-001
domain: performance
difficulty: 4
tags: oplog, replication, redundancy factor, write latency, durability
reference: The Nutanix Bible - OpLog

Q: An OLTP workload issues many small random writes yet sees low, consistent write latency with full crash consistency. Which statement about the OpLog best explains this?
- [ ] Writes are acknowledged from volatile CVM DRAM and flushed lazily with no replication
- [x] Random writes are staged in the OpLog and synchronously replicated to peer CVM OpLogs before the write is acknowledged
- [ ] The OpLog stores only metadata while all data goes directly to the Extent Store
- [ ] Each write is acknowledged only once it has reached the HDD capacity tier

Explain: The OpLog is a persistent, per-vDisk write buffer; incoming random writes are written locally and synchronously replicated to remote CVM OpLog(s) per the redundancy factor before the guest is acknowledged, giving low latency plus durability. It is not a volatile DRAM cache, and it stores data, not just metadata.
Clue: Think about how a write can be both fast and safe. The buffer that catches random writes lives on persistent flash, not volatile memory, and durability demands that copies exist on more than one node before the guest is told the write succeeded. That synchronous cross-node replication is what makes it crash-consistent while keeping latency low.

### PERF-H-002
domain: performance
difficulty: 4
tags: unified cache, read cache, single-touch, multi-touch
reference: The Nutanix Bible - Unified Cache

Q: An administrator wants to know how the Unified Cache avoids letting a single large sequential scan evict genuinely hot data. How does the read cache decide what stays resident?
- [ ] It keeps all cached data in one FIFO queue with equal priority
- [ ] It caches only the blocks that were most recently written
- [ ] It caches data only after at least ten accesses
- [x] New reads enter a single-touch pool and are promoted to a multi-touch pool on repeated access

Explain: The Unified Cache uses a single-touch pool for first reads and promotes data to a multi-touch pool on subsequent hits, keeping the truly hot working set resident. This two-tier design prevents a one-time large scan from evicting frequently accessed data.
Clue: A good read cache has to distinguish data touched once, like a one-off scan, from data touched repeatedly, the real working set. The design uses two tiers: a first-touch area and a hotter area that data is promoted into on re-access. That way a single large sequential read cannot flush out your genuinely hot blocks.

### PERF-H-003
domain: performance
difficulty: 4
tags: cvm, resources, bottleneck, iops, latency
reference: Nutanix - Controller VM (CVM) resource requirements

Q: In a heavily consolidated cluster, storage latency begins to climb. Which explanation best captures how CVM resourcing can become the limiting factor?
- [x] All local VM I/O flows through the node's CVM, so starving it of CPU or memory throttles I/O for every VM on that node
- [ ] The CVM only manages metadata, so its resources cannot affect data-path latency
- [ ] Adding CVM memory directly reduces usable Extent Store capacity
- [ ] The CVM offloads all I/O to the hypervisor kernel, so its resources are irrelevant

Explain: Every read and write for local VMs passes through the node's Controller VM; if it is starved of CPU or memory, I/O queues build and latency rises for all VMs on that node. This is why CVM vCPU and memory reservations must not be reduced below supported minimums.
Clue: Remember the data path: on each node, guest I/O does not go straight to disk, it flows through a dedicated virtual appliance that owns the storage stack. If that appliance is short on CPU or memory, its queues back up and every VM on the node feels the latency. That is why its resource reservations are protected and should not be trimmed.

### PERF-H-004
domain: performance
difficulty: 4
tags: erasure coding, ec-x, data efficiency, redundancy factor, capacity
reference: The Nutanix Bible - Erasure Coding (EC-X)

Q: A team wants maximum usable capacity from data that is rarely overwritten, without heavily penalizing active write latency. Which data-efficiency feature fits, and what is its main trade-off?
- [ ] Deduplication, which carries no memory or metadata overhead
- [ ] Inline compression, which should be avoided because it always doubles write latency
- [x] Erasure Coding (EC-X), which reclaims space on write-cold data but adds compute overhead on overwrites and failure rebuilds
- [ ] Redundancy Factor 1, which improves resiliency while saving space

Explain: EC-X encodes write-cold data into parity strips to reclaim space beyond replication, but overwrites and node-failure rebuilds incur extra compute, so it targets infrequently-written data. Dedup carries metadata and memory overhead, inline compression is generally recommended rather than avoided, and RF1 is not a resiliency improvement.
Clue: The goal is squeezing more usable space out of data that rarely changes, beyond what plain replication gives. The technique computes parity across data strips instead of keeping full extra copies. The catch is that recomputing parity is only cheap when data is cold; frequent overwrites or a node failure force expensive recalculation, so you reserve it for write-cold data.

### PRISM-E-001
domain: prism
difficulty: 1
tags: prism central, prism element, multi-cluster, management plane
reference: Prism Central Guide - Introduction to Prism Central

Q: An administrator manages several separate Nutanix clusters across two data centers and wants a single console to monitor and operate all of them together. Which component is designed for this multi-cluster management?
- [x] Prism Central
- [ ] Prism Element
- [ ] Foundation
- [ ] Nutanix Cluster Check (NCC)

Explain: Prism Central is the multi-cluster management plane that provides a single pane of glass across many clusters, while Prism Element is the built-in management interface for one individual cluster. Foundation images nodes and NCC runs health checks; neither manages multiple clusters.

### PRISM-E-002
domain: prism
difficulty: 1
tags: categories, policies, grouping, prism central
reference: Prism Central Guide - Categories Management

Q: While setting up policies in Prism Central, an administrator is told to use categories. What is the primary purpose of categories?
- [x] Grouping entities such as VMs so that policies can be applied to the group
- [ ] Storing long-term performance metrics for later analysis
- [ ] Defining IP address pools for guest VM networks
- [ ] Encrypting data at rest on the cluster

Explain: Categories are key-value pairs used to group entities (most commonly VMs) so that policies such as protection, security (Flow), and recovery plans can target the group. They do not store metrics, define IP pools, or perform encryption.

### PRISM-E-003
domain: prism
difficulty: 1
tags: x-play, playbooks, automation, prism central
reference: Prism Central Guide - X-Play (Playbooks)

Q: An administrator wants Prism Central to automatically respond to certain conditions, for example powering on a VM or sending an email when an alert fires. Which feature provides this automation?
- [x] X-Play (Playbooks)
- [ ] Life Cycle Manager (LCM)
- [ ] Foundation
- [ ] Data Lens

Explain: X-Play lets administrators build playbooks that automate operational and remediation tasks in response to triggers such as alerts. LCM handles software and firmware updates, Foundation images nodes, and Data Lens provides file analytics.

### PRISM-E-004
domain: prism
difficulty: 1
tags: dashboard, widgets, customization, prism
reference: Prism Web Console Guide - Dashboard and Widgets

Q: An administrator wants the Prism home dashboard to display the specific charts and information most relevant to their team. How is this accomplished?
- [x] By adding, removing, and rearranging widgets on the dashboard
- [ ] By editing a configuration file on the CVM
- [ ] By reimaging the cluster with Foundation
- [ ] The dashboard layout is fixed and cannot be changed

Explain: Prism dashboards are customizable: administrators can create dashboards and add, remove, and rearrange widgets to surface the data they care about. No CVM file editing or reimaging is required, and the layout is not fixed.

### PRISM-M-001
domain: prism
difficulty: 3
tags: rbac, roles, prism viewer, read-only
reference: Prism Central Admin Guide - Role-Based Access Control (Built-in Roles)

Q: A helpdesk user must be able to view every entity and its status in Prism Central but must not be able to change anything. Which built-in role best fits this requirement?
- [x] Prism Viewer
- [ ] Prism Admin
- [ ] Super Admin
- [ ] Operator

Explain: The built-in Prism Viewer role grants read-only visibility across Prism Central without the ability to make changes. Prism Admin and Super Admin allow configuration changes, and Operator can perform certain operational actions rather than being view-only.

### PRISM-M-002
domain: prism
difficulty: 3
tags: reports, scheduling, capacity, prism central
reference: Prism Central Guide - Reports Management

Q: Management wants a weekly PDF summarizing cluster capacity and performance emailed automatically to stakeholders. Which Prism Central feature is built to schedule and deliver this?
- [x] Reports
- [ ] The Analysis page
- [ ] Alerts
- [ ] X-Play

Explain: The Reports feature lets you build reports, schedule them, export to PDF or CSV, and email them to recipients on a recurring basis. The Analysis page is for interactive troubleshooting charts, Alerts surface conditions, and X-Play automates actions rather than producing scheduled reports.

### PRISM-M-003
domain: prism
difficulty: 3
tags: cluster registration, prism central, prism element, one-to-one
reference: Prism Central Guide - Register (Unregister) Cluster with Prism Central

Q: A cluster is already registered to one Prism Central instance. An administrator attempts to register that same cluster to a second Prism Central. What is true about this scenario?
- [x] A cluster can be registered to only one Prism Central at a time and must be unregistered first
- [ ] The cluster registers to both instances so they act as redundant managers
- [ ] Registration queues until the first Prism Central goes offline
- [ ] Both instances get read access but only the newer one can make changes

Explain: A Nutanix cluster (Prism Element) can be registered to only one Prism Central at a time; to move it you must unregister it from the first before registering it to another. It cannot be simultaneously managed by two Prism Central instances.

### PRISM-M-004
domain: prism
difficulty: 3
tags: one-click upgrade, aos, rolling upgrade, prism
reference: Acropolis Upgrade Guide - Upgrading AOS (One-Click Upgrade)

Q: An administrator needs to upgrade AOS across all nodes using a rolling process that keeps guest VMs running throughout. Which Prism capability performs this?
- [x] One-click upgrade (Upgrade Software)
- [ ] Foundation imaging
- [ ] Cluster destroy and recreate
- [ ] Genesis service restart

Explain: The one-click Upgrade Software workflow in Prism performs a rolling, non-disruptive AOS upgrade, updating one CVM at a time so guest VMs stay online. Foundation reimages nodes from scratch, destroy/recreate is not an upgrade path, and restarting Genesis does not upgrade AOS.

### PRISM-H-001
domain: prism
difficulty: 4
tags: rbac, custom roles, categories, scoping
reference: Prism Central Admin Guide - Custom Roles and Role Assignment

Q: In Prism Central an administrator creates a custom role and must grant an AD group management access to only the VMs belonging to one application, out of thousands of VMs. What is the recommended way to scope that role assignment?
- [x] Assign the role over one or more categories that group those VMs
- [ ] List each VM's UUID individually in the role assignment
- [ ] Create a separate Prism Central instance for those VMs
- [ ] Move the VMs into a dedicated storage container and scope by container

Explain: Prism Central RBAC scopes a role assignment by selecting the entities it applies to, and at scale this is done with categories rather than enumerating individual VMs. Standing up a separate Prism Central or scoping by storage container are not how RBAC access boundaries are defined.
Clue: Prism Central RBAC separates what a role can do from which entities it applies to. Because categories are key-value groupings that both policies and RBAC consume, scoping an assignment to a category automatically covers every entity that matches, and membership updates as VMs are tagged, without editing the role. Enumerating individual entities does not scale and defeats the purpose of categories.

### PRISM-H-002
domain: prism
difficulty: 4
tags: x-play, playbooks, triggers, webhook, alerts
reference: Prism Central Guide - X-Play Triggers and Actions

Q: When building an X-Play playbook in Prism Central, which of the following can be configured as the trigger that starts the playbook? (Select all that apply.)
- [x] An alert being raised
- [x] A manual (on-demand) trigger
- [x] An incoming webhook
- [ ] A guest OS user logging into a VM
- [ ] An NCC health check completing

Explain: X-Play playbooks begin when a defined trigger fires, and supported trigger types include an alert being raised, a manual on-demand run, and an incoming webhook. Events occurring inside a guest OS and the completion of an NCC health check are not native playbook triggers.
Clue: X-Play cleanly separates triggers from actions: a playbook is dormant until a configured trigger fires, then it runs an ordered list of actions such as sending email or changing VM power state. Triggers are things the Prism Central control plane can observe, like an alert, a webhook call, or an operator pressing play. Activity happening inside a guest operating system or a health-check finishing are not surfaced as playbook triggers.

### PRISM-H-003
domain: prism
difficulty: 4
tags: authentication, active directory, ldap, role mapping, sso
reference: Prism Web Console Guide - Configuring Authentication and Role Mapping

Q: Active Directory is configured as a directory service in Prism and connectivity tests succeed, yet a user who enters valid AD credentials is denied access. What is the most likely cause?
- [x] No role mapping exists that grants the user or their AD group a role
- [ ] The cluster is not registered to Prism Central
- [ ] SAML must be enabled before AD logins work
- [ ] The user has not uploaded an SSH public key

Explain: Adding a directory service only enables authentication of credentials; authorization requires a role mapping that ties the AD user, group, or OU to a Prism role. With valid credentials but no matching role mapping, the user authenticates but has no assigned role and is refused.
Clue: In Prism, authentication and authorization are two separate steps. Configuring a directory service lets Prism verify a user's credentials, but it grants no access on its own. You must add role mappings that associate directory users, groups, or organizational units with specific Prism roles; until a mapping matches the user, a valid login still results in no permissions and access is denied.

### PRISM-H-004
domain: prism
difficulty: 4
tags: prism central, scale-out, sizing, pcvm, high availability
reference: Prism Central Guide - Scale-Out and Sizing Prism Central

Q: A single-VM (small) Prism Central needs more capacity to manage additional VMs and to add resiliency for the management plane. Which statement about scaling Prism Central is correct?
- [x] Scaling out forms a three-PCVM instance, so two additional PCVMs are added, not one
- [ ] You add a single PCVM to create a two-node HA pair
- [ ] Scaling out only means increasing the vCPU and RAM of the existing single PCVM
- [ ] Each registered cluster automatically contributes a PCVM to the scale-out

Explain: A scale-out Prism Central is a cluster of three PCVMs, so scaling out from a single instance adds two more PCVMs rather than one; there is no two-node form. Vertically resizing one PCVM changes its capacity but does not by itself provide the management-plane high availability that scale-out delivers.
Clue: Prism Central runs either as a single PCVM or as a scale-out cluster of three PCVMs, with no supported two-node option. Scale-out both raises the ceiling on how many entities Prism Central can manage and provides high availability for the management plane, and the PCVMs must match one another in size. Simply giving one PCVM more vCPU and memory increases its form factor but does not make the management plane resilient.

### SEC-E-001
domain: security
difficulty: 1
tags: cluster lockdown, ssh, hardening, key-based auth
reference: Nutanix Security Guide (Cluster Lockdown)

Q: An administrator wants to prevent password-based SSH logins to the CVMs and AHV hosts, permitting only key-based access on a hardened cluster. Which Prism feature accomplishes this?
- [x] Cluster Lockdown
- [ ] Data-at-Rest Encryption
- [ ] Flow Network Security
- [ ] Curator scan tuning

Explain: Cluster Lockdown (Prism Settings) disables password-based SSH authentication to the CVMs and hosts; administrators add public SSH keys so only key-based access is allowed. Data-at-Rest Encryption and Flow address storage and network security, not SSH access.

### SEC-E-002
domain: security
difficulty: 1
tags: encryption, data-at-rest, AES-256
reference: Nutanix Security Guide (Data-at-Rest Encryption)

Q: A security team asks which cipher Nutanix software-based data-at-rest encryption uses to protect data written to the storage media. What should the administrator tell them?
- [x] AES-256
- [ ] SHA-256
- [ ] RSA-2048
- [ ] 3DES

Explain: Nutanix software-based data-at-rest encryption protects data on disk using AES-256 symmetric encryption. SHA-256 is a hash, RSA-2048 is asymmetric key exchange, and 3DES is a legacy cipher not used here.

### SEC-E-003
domain: security
difficulty: 1
tags: login banner, welcome banner, compliance
reference: Prism Web Console Guide (Welcome Banner)

Q: To meet a compliance requirement, an administrator must display a legal consent message that every user acknowledges before logging in to Prism. Which capability should be configured?
- [x] The Welcome Banner (login banner)
- [ ] Cluster Lockdown
- [ ] Syslog forwarding
- [ ] Two-factor authentication

Explain: Prism's Welcome Banner displays a custom message that users must acknowledge before login, satisfying consent-banner requirements. The other options address SSH access, log export, and stronger authentication respectively.

### SEC-E-004
domain: security
difficulty: 1
tags: flow, network security, monitor mode, enforce
reference: Flow Network Security Guide (Policy Modes)

Q: A newly created Flow Network Security policy is left in Monitor mode. What happens to VM traffic that the policy would otherwise disallow?
- [x] The traffic still flows but is visualized and logged as a would-be violation
- [ ] The traffic is immediately blocked
- [ ] The affected VMs are automatically quarantined
- [ ] The policy has no effect until the VMs are rebooted

Explain: In Monitor mode a Flow policy only visualizes and logs traffic that would violate it; nothing is actually blocked. Enforce (Apply) mode is required to drop disallowed traffic, which is why admins typically monitor first and then enforce.

### SEC-M-001
domain: security
difficulty: 3
tags: encryption, KMS, native key manager, external KMS
reference: Nutanix Security Guide (Key Management)

Q: An administrator wants to enable software data-at-rest encryption but has no dedicated KMIP key server in the environment. Which Nutanix option removes the need for a separate external key manager?
- [x] The Local (Native) Key Manager built into AOS
- [ ] A KMIP-compliant external appliance
- [ ] Flow Network Security
- [ ] The Prism Central IAM microservice

Explain: The Local (Native) Key Manager runs inside the cluster and manages encryption keys, eliminating the need for a dedicated external KMIP server. A KMIP external appliance is exactly the outside dependency the admin is trying to avoid.

### SEC-M-002
domain: security
difficulty: 3
tags: RBAC, roles, least privilege, prism central
reference: Prism Central Admin Guide (Role-Based Access Control)

Q: A helpdesk user needs to view VMs and dashboards in Prism Central but must not be able to make any changes. Which built-in role best follows the principle of least privilege?
- [x] Prism Viewer (read-only)
- [ ] Prism Admin
- [ ] Super Admin
- [ ] Self-Service Admin

Explain: The built-in Prism Viewer role grants read-only visibility, matching least privilege. Prism Admin and Super Admin permit configuration changes, and Self-Service Admin manages self-service projects and tenants.

### SEC-M-003
domain: security
difficulty: 3
tags: certificate, SSL, prism, trust chain
reference: Nutanix Security Guide (Installing an SSL Certificate)

Q: When replacing Prism's default self-signed SSL certificate with a CA-signed certificate, which set of items must the administrator upload?
- [x] The private key, the signed certificate, and the CA chain/root certificate
- [ ] Only the signed public certificate
- [ ] Only the CSR generated by Prism
- [ ] The KMS master key and the certificate

Explain: Installing a custom certificate in Prism requires the matching private key, the CA-signed certificate, and the CA chain/root certificate so the full trust path validates. Uploading only the public certificate or the CSR is insufficient.

### SEC-M-004
domain: security
difficulty: 3
tags: SCMA, STIG, baseline, self-heal, hardening
reference: Nutanix Security Guide (Security Baselines / SCMA)

Q: After hardening a cluster, an administrator worries that ad-hoc configuration changes could weaken the CVM security baseline over time. Which Nutanix mechanism automatically detects and reverts that drift?
- [x] SCMA (Security Configuration Management Automation)
- [ ] Cluster Lockdown
- [ ] Curator scans
- [ ] Prism Self-Service

Explain: SCMA periodically checks the CVM and hypervisor against the STIG-based security baseline and self-heals any drift back to the hardened state. Cluster Lockdown only controls SSH access, and Curator handles storage and metadata maintenance, not security posture.

### SEC-H-001
domain: security
difficulty: 4
tags: encryption, data-at-rest, threat model, access control
reference: Nutanix Security Guide (Data-at-Rest Encryption)

Q: A CISO claims that enabling Nutanix data-at-rest encryption will protect cluster data from an attacker who logs in over the network using valid administrative credentials. How should the architect respond?
- [x] At-rest encryption protects data on the physical media (theft/RMA/disposal); it is transparent to an authenticated user reading live data
- [ ] It fully prevents any authenticated administrator from reading VM data
- [ ] It encrypts CVM-to-CVM network traffic, blocking credentialed remote access
- [ ] It automatically enforces two-factor authentication for all administrators

Explain: Data-at-rest encryption keeps drive contents unreadable if the media is removed, returned, or decommissioned, but it is transparent to authorized live I/O, so a validly authenticated admin still sees data. Guarding sessions and credentials requires 2FA, RBAC, and network controls, not DARE.
Clue: Match each control to the threat it actually addresses. Encryption 'at rest' targets the case where a physical disk leaves the datacenter - theft, RMA, or disposal - by keeping only ciphertext on the platters. It is deliberately transparent to legitimate authenticated I/O, so it never substitutes for the identity and access controls that decide who may log in and read live data.

### SEC-H-002
domain: security
difficulty: 4
tags: 2FA, CAC, authentication, client certificate
reference: Nutanix Security Guide (Two-Factor Authentication)

Q: A federal customer must enable two-factor authentication for Prism using a smart card (CAC). Which two factors does Prism combine to satisfy this requirement?
- [x] A client certificate (something you have) plus a username/password (something you know)
- [ ] Two separate passwords entered in sequence
- [ ] A username/password plus a security question
- [ ] A drive SED PIN plus an administrator password

Explain: Prism two-factor authentication pairs client-certificate authentication - the CAC/smart-card certificate, something you have - with directory username/password, something you know. Two passwords or a security question are both knowledge-only and remain a single factor.
Clue: True multifactor requires factors from different categories: knowledge, possession, or inherence. A CAC or smart card carries a client certificate that proves possession, and it is combined with the directory credential the user knows. Two things you simply memorize, no matter how many, still count as one factor.

### SEC-H-003
domain: security
difficulty: 4
tags: encryption, SED, software encryption, KMS
reference: Nutanix Security Guide (Data-at-Rest Encryption)

Q: A storage architect is validating facts about Nutanix data-at-rest encryption before a design review. Which of the following statements are correct? (Select all that apply.)
- [x] Software-based encryption encrypts data in the AOS write path and can use the Local (Native) Key Manager
- [x] SED-based encryption performs the encryption within the self-encrypting drive's own hardware
- [x] Enabling cluster-wide software encryption is a one-way action that cannot later be disabled
- [ ] It encrypts inter-cluster replication traffic while that data traverses the network
- [ ] Software-based encryption requires every node to be populated with self-encrypting drives

Explain: Software encryption runs in the AOS data path on ordinary drives and can use the native or an external KMS; SEDs encrypt inside the drive; and cluster-level encryption cannot be disabled once enabled. It does not protect data in transit (a separate feature), and software encryption specifically does not require SEDs.
Clue: Separate the 'where' from the 'when.' SEDs push the cipher into drive firmware, while software encryption does it in the AOS I/O path on standard drives, so the two are alternative implementations of the same at-rest goal. 'At rest' is the key phrase - it says nothing about bytes moving across the network - and turning cluster encryption on is intentionally irreversible so data is never silently left unprotected.

### SEC-H-004
domain: security
difficulty: 4
tags: cluster lockdown, ssh, key-based auth, hardening
reference: Nutanix Security Guide (Cluster Lockdown)

Q: After enabling Cluster Lockdown with 'remote login with password' disabled and no public keys added, an administrator finds they can no longer SSH into the CVM at all. Why?
- [x] With password login disabled and no public keys installed, there is no permitted SSH authentication method left
- [ ] Lockdown also disables the Prism web console until keys are added
- [ ] The CVM requires a reboot to apply lockdown, which is still pending
- [ ] Lockdown deleted the local admin (nutanix) account

Explain: Cluster Lockdown disables password-based SSH, so access then depends entirely on installed public keys. With password auth off and zero keys present, no valid SSH authentication method remains and all SSH login is blocked; the Prism web console uses a separate auth path and is unaffected.
Clue: Lockdown is really about which SSH authentication methods remain enabled. Turning off password authentication shifts all trust to public-key pairs; if none are loaded, the SSH daemon has nothing left to accept. Remember this governs shell access only and is independent of the Prism web console, which authenticates through its own path.

### STOR-E-001
domain: storage
difficulty: 1
tags: storage container, storage pool, compression, deduplication
reference: Prism Web Console Guide - Storage Management

Q: An administrator needs to enable compression on one group of VMs while leaving another group uncompressed in the same cluster. At which level are data-efficiency settings like compression and deduplication applied?
- [ ] The storage pool, which spans all disks in the cluster
- [x] The storage container
- [ ] Each individual virtual disk (vDisk)
- [ ] The CVM's local SSD

Explain: Compression, deduplication, erasure coding, and replication factor are all configured per storage container. A storage pool simply aggregates all physical drives in the cluster and holds no data-efficiency policy, so it cannot differentiate the two VM groups.

### STOR-E-002
domain: storage
difficulty: 1
tags: RF2, redundancy factor, fault tolerance
reference: AOS Storage / Prism Web Console Guide

Q: A three-node cluster hosts a storage container configured with replication factor 2 (RF2). How many simultaneous node failures can this container survive without data loss?
- [x] One
- [ ] Two
- [ ] Three
- [ ] Zero - RF2 provides no fault tolerance

Explain: RF2 maintains two copies of every write, so the cluster tolerates the loss of a single node or drive. Surviving two simultaneous failures requires RF3, which keeps three copies.

### STOR-E-003
domain: storage
difficulty: 1
tags: thin provisioning, container, reservations
reference: Prism Web Console Guide - Storage Management

Q: Without any manual reservation, how does a Nutanix storage container present capacity to the hypervisor by default?
- [ ] Thick provisioned and eager-zeroed
- [x] Thin provisioned, consuming capacity only as data is written
- [ ] Fully reserved at container creation time
- [ ] Read-only until a reservation is configured

Explain: Nutanix containers are thin provisioned by default, so physical capacity is consumed only as guests actually write data. Reservations or an advertised-capacity limit can be added explicitly, but they are not the default.

### STOR-E-004
domain: storage
difficulty: 1
tags: storage pool, architecture, SSD, HDD
reference: Prism Web Console Guide - Storage Management

Q: In the Nutanix storage architecture, what does a storage pool represent?
- [ ] A logical dataset with its own compression and RF policy
- [x] The physical group of all disks (SSD and HDD) aggregated across the cluster
- [ ] The write buffer that absorbs random I/O before it is drained
- [ ] A datastore mounted by a single hypervisor host

Explain: A storage pool is the physical aggregation of all storage devices (SSDs and HDDs) across every node in the cluster, and typically a cluster has just one. Logical datasets that carry their own policies are storage containers, not pools.

### STOR-M-001
domain: storage
difficulty: 3
tags: oplog, extent store, io path, sequential, random
reference: The Nutanix Bible - Book of AOS Storage (I/O Path)

Q: A workload generates a burst of small random writes followed by a large sequential write. In the Nutanix I/O path, how is this data typically handled?
- [ ] All writes are cached in the unified cache before being acknowledged
- [x] Random writes land in the OpLog and are coalesced before draining; large sequential writes bypass it and go straight to the extent store
- [ ] Both random and sequential writes are written straight to the extent store
- [ ] Random writes go to the extent store while sequential writes are buffered in the OpLog

Explain: The OpLog is a persistent SSD write buffer that absorbs and coalesces random writes before draining them sequentially to the extent store. Large sequential writes gain nothing from buffering, so they bypass the OpLog and are written directly to the extent store.

### STOR-M-002
domain: storage
difficulty: 3
tags: deduplication, vdi, full clones, data efficiency
reference: Nutanix Data Efficiency Tech Note (TN-2032)

Q: For which workload does Nutanix most recommend enabling deduplication?
- [ ] A transactional database with mostly unique, frequently-overwritten data
- [x] VDI full clones and persistent desktops with large amounts of identical data
- [ ] A single large archival file server holding unique documents
- [ ] A latency-sensitive workload on a two-node ROBO cluster

Explain: Deduplication delivers the most benefit where many copies of identical data exist, such as full-clone VDI and persistent desktops (P2V migrations are another good fit). Workloads with mostly unique data gain little while still paying the metadata and compute overhead.

### STOR-M-003
domain: storage
difficulty: 3
tags: erasure coding, EC-X, write-cold, data efficiency
reference: Prism Web Console Guide - Erasure Coding Best Practices

Q: On which type of data does Nutanix erasure coding (EC-X) provide the best space savings with the least performance penalty?
- [ ] Write-hot data that is frequently overwritten
- [x] Write-cold data that is read often but rarely modified after being written
- [ ] The OpLog's most recent random writes
- [ ] Metadata stored in the distributed Cassandra ring

Explain: EC-X is a post-process operation applied to write-cold data (extents not overwritten for roughly seven days), encoding data plus parity instead of full replicas to reclaim capacity. Overwrite-heavy data forces costly strip recalculation, so EC-X is not recommended there.

### STOR-M-004
domain: storage
difficulty: 3
tags: RF3, redundancy factor, minimum nodes, fault tolerance
reference: Prism Web Console Guide - Redundancy Factor 3

Q: An administrator wants to protect a cluster against two simultaneous node failures by using redundancy factor 3 (RF3). What is the minimum number of nodes required?
- [ ] Three
- [ ] Four
- [x] Five
- [ ] Six

Explain: RF3 requires a minimum of five nodes because cluster metadata is kept at RF5 to survive two concurrent failures. RF2, by contrast, needs only three nodes.

### STOR-H-001
domain: storage
difficulty: 4
tags: erasure coding, EC-X, minimum nodes, RF2, RF3
reference: Prism Web Console Guide - Erasure Coding Best Practices and Requirements

Q: A team plans to enable erasure coding on containers in two clusters: one protected with RF2 and one with RF3. What are the minimum node counts Nutanix requires to enable EC-X in each case?
- [ ] 3 nodes for RF2 and 5 nodes for RF3
- [x] 4 nodes for RF2 and 6 nodes for RF3
- [ ] 4 nodes for RF2 and 5 nodes for RF3
- [ ] 5 nodes for RF2 and 7 nodes for RF3

Explain: Erasure coding needs enough nodes to place a full data-plus-parity strip and still rebuild after a failure: a minimum of 4 nodes for RF2 and 6 nodes for RF3. Meeting only the RF minimum (3 for RF2, 5 for RF3) is not sufficient to enable EC-X.
Clue: Erasure coding replaces full replicas with a strip of data blocks plus parity blocks, so the cluster must be able to hold the whole strip and still have spare capacity to rebuild a lost member. That pushes the requirement above the plain RF minimum by an extra node's worth of headroom at each protection level. Think about how many members an RF2 strip versus an RF3 strip needs before a rebuild is possible.

### STOR-H-002
domain: storage
difficulty: 4
tags: deduplication, capacity tier, cache tier, vdi, prerequisite
reference: Nutanix Data Efficiency Tech Note (TN-2032)

Q: An administrator wants to reclaim HDD capacity on a full-clone VDI container by enabling capacity-tier deduplication. What is a key prerequisite or characteristic they must account for?
- [ ] Capacity-tier dedup can be enabled independently and only affects the SSD read cache
- [x] Cache (performance-tier) deduplication must be enabled before capacity-tier deduplication can be turned on
- [ ] Capacity-tier dedup removes the need for the OpLog on that container
- [ ] Capacity-tier dedup only functions on RF3 containers

Explain: Cache (performance-tier) dedup fingerprints data to deduplicate the in-memory and SSD read cache, while capacity-tier dedup extends that deduplication to persistent HDD data - and it can only be enabled if cache dedup is already on. It also carries higher CVM resource requirements, so it is reserved for high-duplication workloads like full-clone VDI.
Clue: Nutanix has two deduplication scopes that build on each other: one shrinks the working set held in RAM and flash so more of it stays hot, and the other extends the same fingerprint-based dedup down onto spinning disk to reclaim persistent capacity. Because the disk-level scope reuses the fingerprints generated by the cache-level scope, one is a strict prerequisite for the other. Consider which layer produces the fingerprints first.

### STOR-H-003
domain: storage
difficulty: 4
tags: disk balancing, ILM, tiering, curator, SSD, HDD
reference: The Nutanix Bible - Book of AOS Storage (Disk Balancing / ILM)

Q: Curator performs two related but distinct background operations: disk balancing and Information Lifecycle Management (ILM). Which statement correctly distinguishes them?
- [ ] Disk balancing moves data between the SSD and HDD tiers; ILM redistributes data across disks within one tier
- [x] Disk balancing evens out utilization across disks within one tier; ILM migrates data between the SSD and HDD tiers by access frequency
- [ ] Both operations move data only between tiers, but ILM always runs first
- [ ] Disk balancing applies only to the OpLog while ILM applies only to the extent store

Explain: Disk balancing keeps utilization uniform across disks within the same tier, while ILM moves data between tiers - down-migrating cold extents from SSD to HDD and up-migrating hot data - based on access patterns and SSD utilization thresholds. Option one reverses the two.
Clue: Two different problems are being solved here. One is 'my disks are unevenly full' - the fix keeps capacity level across drives that sit in the same performance class. The other is 'my fast flash is filling up with data nobody touches' - the fix relocates data up or down the SSD/HDD hierarchy according to how hot it is. Don't let the similar names blur which one crosses tier boundaries.

### STOR-H-004
domain: storage
difficulty: 4
tags: compression, inline, post-process, compression delay, data efficiency
reference: The Nutanix Bible - Book of AOS Data Efficiency (Compression)

Q: On a storage container an administrator sets the compression delay to 0 minutes. What behavior does this configure, and when is it preferred?
- [ ] Post-process compression that waits for a Curator scan; preferred for latency-sensitive random writes
- [x] Inline compression that compresses data as it is written; preferred for most workloads, especially large or sequential I/O
- [ ] Compression is effectively disabled because the delay is zero
- [ ] Deduplication rather than compression, because a zero delay switches the feature

Explain: A compression delay of 0 minutes configures inline compression: data is compressed on the write path (random writes still buffer in the OpLog, but data is compressed as it drains to the extent store). A non-zero delay defers compression to a later Curator (post-process) pass. Inline is generally recommended, especially for large or sequential I/O.
Clue: Nutanix expresses the choice between compressing on the write path versus compressing later as a single tunable: a delay measured in minutes. Set it to nothing and data is squeezed as it lands in the extent store; set it to a positive value and a background maintenance pass handles it afterward. A zero here does not mean 'off' - it means 'do it now.' Reason about what a delay of zero implies for timing.

### NUS-E-001
domain: unifiedstorage
difficulty: 1
tags: nutanix-files, smb, nfs, protocols
reference: Nutanix Files User Guide

Q: A team needs a single shared folder reachable by both Windows desktops and Linux servers using their native file-sharing methods. Which pair of protocols does Nutanix Files support to serve these clients?
- [ ] iSCSI and Fibre Channel
- [ ] S3 and Swift object APIs
- [x] SMB for Windows and NFS for Linux/UNIX
- [ ] SMB and iSCSI

Explain: Nutanix Files is a scale-out file service that presents shares over SMB (for Windows clients) and exports over NFS (for Linux/UNIX clients), including multiprotocol access. iSCSI and S3 are block and object protocols delivered by Volumes and Objects, not Files.

### NUS-E-002
domain: unifiedstorage
difficulty: 1
tags: nutanix-objects, s3, buckets, object-storage
reference: Nutanix Objects User Guide

Q: A cloud-native application team wants to store unstructured data in buckets using the same API they use with public cloud object storage. Which API does Nutanix Objects expose?
- [x] An Amazon S3-compatible REST API
- [ ] NFS version 4.1
- [ ] The iSCSI block protocol
- [ ] SMB 3.0

Explain: Nutanix Objects is S3-compatible object storage: applications interact with buckets and objects over an Amazon S3-style REST API using access and secret keys. NFS, iSCSI, and SMB are file and block protocols, not object interfaces.

### NUS-E-003
domain: unifiedstorage
difficulty: 1
tags: nutanix-volumes, iscsi, block-storage
reference: Nutanix Volumes Guide

Q: An administrator needs to present raw block storage volumes to an external server so the guest OS sees them as local disks. Over which protocol does Nutanix Volumes deliver this block storage?
- [ ] SMB 3.0
- [x] iSCSI
- [ ] NFSv3
- [ ] The S3 REST API

Explain: Nutanix Volumes exposes block storage (volume groups made of virtual disks) to clients over iSCSI, so initiators mount them as block devices. SMB and NFS are file protocols and S3 is object storage.

### NUS-E-004
domain: unifiedstorage
difficulty: 1
tags: nutanix-files, fsvm, architecture
reference: Nutanix Files User Guide

Q: Nutanix Files is delivered as a scale-out cluster of dedicated virtual machines that own and serve the file data. What are these virtual machines called?
- [ ] Controller VMs (CVMs)
- [x] File Server VMs (FSVMs)
- [ ] Prism Central VMs
- [ ] Witness VMs

Explain: A Nutanix Files file server is composed of File Server VMs (FSVMs), which host the shares and scale out as more are added. CVMs run AOS storage services for the whole cluster, and Prism Central and Witness VMs serve management and quorum roles, not file serving.

### NUS-M-001
domain: unifiedstorage
difficulty: 3
tags: nutanix-files, distributed-share, standard-share, home-directories
reference: Nutanix Files User Guide

Q: An administrator is deploying a Nutanix Files share for 5,000 users who each need their own home directory, and wants user connections and data spread evenly across all FSVMs. Which share type best meets this goal?
- [ ] A standard (general) share, which is hosted entirely on a single FSVM
- [x] A distributed (home) share, which spreads top-level directories across all FSVMs
- [ ] An SMB share with continuous availability, which round-robins every file
- [ ] An NFS export with root squash enabled

Explain: A distributed (home) share assigns its top-level directories across all FSVMs, balancing load for workloads such as user home directories and profiles. A standard share lives on one FSVM, so a large user population would concentrate load on that single VM.

### NUS-M-002
domain: unifiedstorage
difficulty: 3
tags: nutanix-volumes, data-services-ip, iscsi, external-clients
reference: Nutanix Volumes Guide

Q: Before external servers can attach volume groups from Nutanix Volumes over iSCSI, one cluster-level address must be configured. Which address is it, and what is its role?
- [ ] The Cluster Virtual IP, which gives a single address for the Prism web console
- [x] The iSCSI Data Services IP, a cluster-wide address clients use for discovery and that redirects them to a CVM
- [ ] Each CVM's backplane IP, so initiators can target the storage network directly
- [ ] The AHV host management IP, which brokers all iSCSI sessions

Explain: The iSCSI Data Services IP is a single cluster-wide virtual IP that external iSCSI clients use as the discovery/target portal; the cluster then redirects each session to an appropriate CVM and can re-redirect on failure for high availability. The Cluster Virtual IP is a separate address used for Prism and cluster management.

### NUS-M-003
domain: unifiedstorage
difficulty: 3
tags: nutanix-volumes, workload-selection, block-storage, iscsi
reference: Nutanix Volumes Guide

Q: A physical, non-virtualized database server needs low-latency storage presented as raw LUNs that its operating system formats and manages directly. Which Nutanix data service fits this requirement?
- [ ] Nutanix Files, via an SMB share
- [ ] Nutanix Objects, via an S3 bucket
- [x] Nutanix Volumes, via iSCSI-attached volume groups
- [ ] A Nutanix Files distributed NFS export

Explain: Raw block LUNs that the guest OS formats and owns are the definition of block storage, which Nutanix Volumes delivers as iSCSI volume groups to external and physical clients. Files (SMB/NFS) serves shared files, and Objects serves S3 objects - neither presents raw block devices.

### NUS-M-004
domain: unifiedstorage
difficulty: 3
tags: nutanix-objects, versioning, buckets, data-protection
reference: Nutanix Objects User Guide

Q: A team wants their Nutanix Objects bucket to keep prior copies of an object whenever it is overwritten or deleted, so an earlier state can be recovered after an accidental change. Which bucket feature should they enable?
- [x] Bucket versioning
- [ ] A lifecycle expiration policy
- [ ] Multipart upload
- [ ] Static website hosting

Explain: Bucket versioning preserves multiple versions of an object as it is overwritten or deleted, allowing recovery of a previous version. A lifecycle policy removes or transitions objects over time, multipart upload only aids large-object uploads, and website hosting serves content - none of these retain prior versions.

### NUS-H-001
domain: unifiedstorage
difficulty: 4
tags: nutanix-volumes, data-services-ip, iscsi-redirection, high-availability
reference: Nutanix Volumes Guide

Q: An external server opens an iSCSI session to a Nutanix cluster's Data Services IP to use a volume group. How does the cluster handle that session, and what happens if the CVM serving it fails?
- [ ] The initiator is permanently bound to whichever CVM currently owns the Data Services IP address.
- [x] The Data Services IP is a discovery portal that redirects the initiator to a CVM, then to a healthy CVM if that CVM fails.
- [ ] Every virtual disk in the volume group is served simultaneously by all CVMs via round-robin MPIO by default.
- [ ] After discovery the initiator connects directly to the target CVM's management IP and no longer uses the Data Services IP.

Explain: The Data Services IP is the iSCSI redirection portal: the initiator connects to it and is redirected to a CVM that serves the target, and if that CVM fails the initiator reconnects through the Data Services IP and is redirected to a healthy CVM, providing transparent high availability without a separate load balancer.
Clue: External iSCSI clients never target a CVM directly; they connect to one stable cluster-wide portal address. That portal's job is to redirect the session to whichever CVM is currently hosting the target, and to redirect again to a surviving CVM after a failure. This built-in redirection is why Volumes offers high availability to physical and virtual clients without external load balancers or MPIO tricks.

### NUS-H-002
domain: unifiedstorage
difficulty: 4
tags: nutanix-files, distributed-share, fsvm, load-balancing
reference: Nutanix Files User Guide

Q: An admin created a Nutanix Files distributed share but placed all of the data under one single top-level folder. They now see one FSVM heavily loaded while the others sit idle. What best explains this behavior?
- [x] Distributed shares balance load per top-level directory, so everything under one top-level folder is served by a single FSVM.
- [ ] Distributed shares stripe each file's blocks evenly across FSVMs, so the imbalance means an FSVM has failed.
- [ ] Distributed shares balance strictly per client connection regardless of folder layout, so the structure is irrelevant.
- [ ] Distributed shares require SMB continuous availability to balance, and it was not enabled.

Explain: A distributed share distributes ownership at the top-level-directory granularity: each top-level folder is assigned to an FSVM. If all data lives under one top-level folder, that whole tree is owned by a single FSVM, so no balancing occurs. Effective distribution requires many top-level folders (such as one per user).
Clue: Distributed shares spread work by handing out top-level directories to different FSVMs, not by striping individual file blocks. The balancing therefore depends entirely on having many top-level folders - the classic fit is a home-directory or profile share where each user is a separate top-level folder. Concentrating everything under one folder defeats the design because that one folder can only be owned by a single FSVM.

### NUS-H-003
domain: unifiedstorage
difficulty: 4
tags: nutanix-files, nutanix-volumes, csi, kubernetes, workload-selection
reference: Nutanix CSI / Cloud Native Storage Documentation

Q: A Kubernetes platform on Nutanix needs a persistent volume that many pods spread across different worker nodes can mount read-write at the same time (ReadWriteMany). Which Nutanix backend satisfies this through the CSI driver?
- [ ] Nutanix Volumes, because iSCSI block devices natively support concurrent multi-node read-write mounts.
- [x] Nutanix Files, which provides an NFS-backed ReadWriteMany file volume.
- [ ] Nutanix Objects, mounted as a POSIX filesystem directly by each pod.
- [ ] A local ephemeral disk provisioned on each worker node.

Explain: ReadWriteMany requires a shared file system that multiple nodes can safely mount at once, which Nutanix Files provides over NFS via the CSI driver. Block volumes from Nutanix Volumes are ReadWriteOnce per node - sharing a raw block device across nodes without a cluster-aware file system risks corruption - and Objects is accessed via the S3 API, not a POSIX mount.
Clue: The key distinction is block versus file access. A raw block volume attaches to one node at a time (ReadWriteOnce); letting several nodes write the same block device without a clustered file system would corrupt data. Simultaneous read-write access from many nodes (ReadWriteMany) needs a shared file protocol, which is exactly what a network file service delivers. Object storage is reached through an HTTP/S3 API, not mounted as a POSIX file system, so it doesn't fit a standard persistent volume mount.

### NUS-H-004
domain: unifiedstorage
difficulty: 4
tags: nutanix-objects, worm, object-lock, compliance, immutability
reference: Nutanix Objects User Guide

Q: Compliance rules require that once written, certain records stored in Nutanix Objects cannot be modified or deleted until a fixed retention period expires. Which capability enforces this immutability?
- [ ] Bucket versioning, which retains prior copies of each object
- [x] WORM (Write Once Read Many) object-lock retention
- [ ] A lifecycle policy that transitions objects to an archive tier
- [ ] Server-side encryption with cluster-managed keys

Explain: WORM / object-lock retention makes objects immutable, blocking modification and deletion until the retention period ends, which is what regulatory records demand. Versioning keeps history but a versioned object can still be overwritten or deleted, lifecycle policies actively change or expire data, and encryption protects confidentiality, not immutability.
Clue: There is an important gap between keeping history and enforcing immutability. Versioning preserves older copies, yet a user can still create new versions or delete objects, so it cannot guarantee a record stays unchanged. Regulatory retention requires a WORM/object-lock mechanism that actively prevents any modification or deletion of an object for a defined period. Encryption and lifecycle tiering solve different problems - confidentiality and cost - not immutability.
