<!-- StarNix NCP-MCI question bank — AUTHORING SOURCE (06 format).
     Human-editable. `import-questions.mjs` converts this to questions.js (the
     window.STARNIX_QUESTIONS pack the core merges with its verified fixture).
     Keys were verified against the NCP-MCI blueprint; the source dump's
     uniform "QA - 6.10" domain was discarded and a real @domain assigned.
     One block per question. Options: - ( ) wrong / - (x) correct (exactly one).
     @id is auto-generated (stable hash of stem) when omitted. -->

### Q

An administrator must ensure the built-in nutanix user can no longer SSH into a CVM using a password. What should they enable?

- ( ) Rename the nutanix user
- (x) Cluster Lockdown
- ( ) Delete the nutanix user
- ( ) Block port 22 on every CVM firewall
@domain: security
@difficulty: 2
@explain: Cluster Lockdown disables password-based SSH and enforces key-based access for the CVM accounts. Renaming or deleting the user does not stop password SSH, and blocking port 22 breaks all SSH for everyone.
@briefing: Goal: the built-in nutanix account can no longer SSH into a CVM with a password — keys only. One cluster-wide security mode enforces exactly that. Renaming or deleting the account leaves password SSH open; blocking port 22 cuts off everyone.
@eli5: Think of changing the CVM's door from a guessable PIN pad to a key-only lock: passwords simply stop working, so a leaked password gets nobody in.
@tags: cluster-lockdown, ssh

### Q

On a scale-out Prism Central, which CVM port must be open through the firewall for Data-in-Transit Encryption of service traffic between nodes?

- (x) 2009
- ( ) 9440
- ( ) 2020
- ( ) 22
@domain: security
@difficulty: 2
@explain: Data-in-Transit Encryption uses CVM port 2009 for the encrypted service traffic between cluster nodes. Port 9440 is the Prism UI.
@briefing: Which CVM firewall port carries the encrypted service traffic between nodes for Data-in-Transit Encryption — note it's not the port your browser uses for the Prism UI.
@eli5: The encrypted node-to-node service chatter rides its own dedicated internal port, separate from the one you log into Prism with.
@tags: encryption, ports

### Q

How should an administrator require password authentication for iSCSI clients connecting to Nutanix Volumes?

- ( ) Enable iSER
- (x) Configure CHAP on the Volume Group
- ( ) Use SAML
- ( ) Bind the iSCSI target to LDAP
@domain: security
@difficulty: 2
@explain: CHAP (Challenge-Handshake Authentication Protocol) authenticates iSCSI initiators against the target; Nutanix supports one-way and mutual CHAP on Volume Groups. iSER is an RDMA transport, not auth.
@briefing: An iSCSI initiator must authenticate with a secret before attaching to a Volume Group. One challenge-response auth protocol does this at the target; an RDMA transport or a directory binding doesn't authenticate.
@eli5: It's a challenge-and-response handshake: the storage target demands a shared secret before any client is allowed to connect.
@tags: volumes, chap, iscsi

### Q

A Windows Server VM must run Windows Defender Credential Guard. Which VM setting is required?

- ( ) More vRAM
- ( ) More vCPUs
- (x) UEFI with Secure Boot
- ( ) Legacy BIOS
@domain: security
@difficulty: 2
@explain: Credential Guard depends on virtualization-based security, which requires the VM to boot UEFI with Secure Boot. CPU and RAM size are irrelevant to enabling it.
@briefing: Credential Guard relies on virtualization-based security, which is gated by the VM's firmware and boot mode — vCPU and RAM sizing are irrelevant to turning it on.
@eli5: The feature needs a hardware-backed, verified boot chain; you enable it by choosing the right firmware/boot mode, not by adding CPU or memory.
@tags: credential-guard, secure-boot, uefi

### Q

A network I/O-intensive Linux VM degrades past a few thousand concurrent connections. Which AHV setting spreads packet processing across multiple vCPUs to help?

- ( ) Switch the vNIC to the e1000 model
- (x) Enable RSS VirtIO-Net Multi-Queue
- ( ) Put the vNIC in trunk mode
- ( ) Enable AHV Turbo
@domain: networking
@difficulty: 2
@explain: RSS (Receive Side Scaling) with VirtIO-Net multi-queue lets several vCPUs process network queues in parallel, raising throughput for many-connection workloads. AHV Turbo accelerates disk, not network.
@briefing: A many-connection Linux VM is bottlenecked because one vCPU handles all its packet processing. Which AHV networking setting spreads that across several vCPUs? The disk-acceleration feature won't help network.
@eli5: Right now a single CPU sorts all the mail; the fix opens several sorting lines so packets are processed in parallel across vCPUs.
@tags: rss, virtio, multi-queue

### Q

Which AHV uplink bond type lets user-VM traffic use bandwidth beyond a single physical adapter (and requires switch-side LACP)?

- ( ) Active-Backup
- (x) Active-Active
- ( ) No uplink bond
- ( ) Active-Active with MAC pinning
@domain: networking
@difficulty: 2
@explain: Active-Active (LACP) aggregates links and balances TCP/UDP sessions across adapters for more aggregate bandwidth. Active-Backup and MAC-pinning do not aggregate a single flow's bandwidth.
@briefing: User-VM traffic needs more aggregate bandwidth than one physical NIC, and the upstream switch is set up for link aggregation. Which bond mode pools the links? Active-backup and MAC-pinning don't aggregate a single flow.
@eli5: It's the bond mode that bundles several cables into one fat pipe and balances sessions across them — and it expects the switch to agree to the bundle.
@tags: bonds, lacp, uplink

### Q

Which AHV feature forwards multicast traffic only to the VMs that have joined the group instead of flooding the whole VLAN?

- ( ) LACP
- (x) IGMP Snooping
- ( ) Network segmentation
- ( ) Port mirroring
@domain: networking
@difficulty: 2
@explain: IGMP snooping tracks which VMs joined a multicast group and forwards that traffic only to them, cutting flooding and host CPU load.
@briefing: Multicast is flooding the whole VLAN. Which AHV feature tracks who actually joined a multicast group and forwards only to them, sparing the rest?
@eli5: Instead of shouting to everyone on the floor, the switch learns who subscribed and delivers only to them.
@tags: multicast, igmp

### Q

When configuring the default VLAN on a Nutanix cluster for untagged traffic, which VLAN ID is used?

- (x) VLAN 0
- ( ) VLAN 1
- ( ) VLAN 2
- ( ) VLAN 4095
@domain: networking
@difficulty: 1
@explain: Nutanix treats VLAN 0 as untagged (native) traffic; VMs that should communicate without a tag are placed on VLAN 0.
@briefing: On a Nutanix cluster, untagged (native) traffic is placed on a specific default VLAN ID — recall which one is reserved for 'no tag'.
@eli5: There's a designated VLAN that means 'no tag at all'; VMs that should talk without a VLAN tag sit there.
@tags: vlan

### Q

Which update can Life Cycle Manager apply on a per-node basis rather than cluster-wide?

- ( ) AOS
- (x) BMC firmware
- ( ) NCC
- ( ) AHV
@domain: lifecycle
@difficulty: 2
@explain: Node-level firmware such as BMC/BIOS affects only one node and can be updated per node. AOS, AHV, and NCC are applied cluster-wide for consistency.
@briefing: LCM applies most things cluster-wide for consistency, but one class of update affects only a single node and can run per-node. Which? AOS, AHV, and NCC go cluster-wide.
@eli5: Some updates touch the whole cluster's behavior, but low-level per-box hardware firmware only affects one node — so it can be done one node at a time.
@tags: lcm, firmware, bmc

### Q

On a dark-site (no internet) cluster, what must be uploaded before LCM will list the latest firmware after an inventory scan?

- ( ) Nutanix Foundation
- (x) The LCM compatibility bundle
- ( ) Prism Central
- ( ) A new AOS image
@domain: lifecycle
@difficulty: 2
@explain: Dark-site LCM relies on an offline compatibility bundle to know which firmware and software are available. Without the current bundle, the latest versions will not appear.
@briefing: On an offline (dark-site) cluster, an inventory scan alone won't reveal the latest firmware — something must be uploaded first so LCM knows what versions exist.
@eli5: With no internet, LCM can't look up what's available; you have to hand it the current 'catalog' file so it knows what the latest versions are.
@tags: lcm, dark-site

### Q

At a single-node cluster, LCM lists no firmware updates even though the firmware is several versions behind. Why?

- ( ) LCM needs internet access to show firmware
- (x) LCM does not perform firmware upgrades on single-node clusters
- ( ) Single-node clusters can only update one disk at a time
- ( ) LCM is not supported at all on single-node clusters
@domain: lifecycle
@difficulty: 2
@explain: Firmware upgrades need a node reboot and a service interruption; a single-node cluster has no peer to take over, so LCM does not offer firmware upgrades there. Software upgrades (AOS/AHV) are still supported with VMs shut down.
@briefing: A single-node cluster shows no firmware updates despite being behind. Why? Think about what a firmware upgrade requires that a lone node can't provide.
@eli5: Firmware upgrades need a reboot, and a single node has no partner to carry the workload during that reboot — so that upgrade type isn't offered there (software upgrades still are).
@tags: lcm, single-node, firmware

### Q

Before LCM upgrades an AHV host that has GPUs, what extra step is required?

- ( ) Create an agent VM with GPU drivers installed
- ( ) Run LCM in dark-site mode
- (x) Use Direct Uploads to provide the GPU driver bundle
- ( ) Update NCC and re-run inventory
@domain: lifecycle
@difficulty: 3
@explain: LCM does not fetch GPU drivers automatically; the matching NVIDIA vGPU host-driver bundle must be supplied through Direct Uploads before the upgrade runs.
@briefing: Before LCM upgrades a GPU-equipped AHV host, an extra input is needed that LCM won't fetch on its own. What must you provide, and how?
@eli5: LCM won't auto-download the matching GPU host driver; you have to feed it the driver bundle manually before the upgrade runs.
@tags: lcm, gpu, direct-uploads

### Q

A newly registered AHV cluster has been running 16 days but shows no Capacity Runway projection. Why?

- ( ) It needs 30 days of data
- (x) It needs at least 21 days of data
- ( ) It needs 3 months of data
- ( ) It needs 6 months of data
@domain: monitoring
@difficulty: 2
@explain: Capacity Runway projections require at least 21 days of historical data; at 16 days there is not yet enough to project.
@briefing: A 16-day-old cluster shows no Capacity Runway projection. Why? There's a minimum amount of history before projections appear.
@eli5: The forecast needs enough back-history to draw a trend; 16 days simply isn't enough yet — there's a set minimum number of days.
@tags: capacity, runway

### Q

Which Prism Central Intelligent Operations view identifies a VM consuming excessive resources and starving the others?

- ( ) Constrained VMs list
- (x) Bully VMs list
- ( ) Inactive VMs list
- ( ) Overprovisioned VMs list
@domain: monitoring
@difficulty: 2
@explain: The Bully VMs list flags VMs that hog resources and degrade their neighbors. Constrained and overprovisioned lists describe the opposite or unrelated conditions.
@briefing: Which Prism Central Intelligent Operations view names the VM hogging resources and starving its neighbors? Constrained/overprovisioned lists describe the opposite.
@eli5: It's the list that points at the resource hog elbowing everyone else off the table.
@tags: intelligent-operations, bully-vm

### Q

From which Prism Element dashboard does an administrator generate a log bundle for Nutanix Support?

- ( ) Settings
- ( ) Alerts
- (x) Health
- ( ) Analysis
@domain: monitoring
@difficulty: 1
@explain: The Health dashboard's Actions then Collect Logs (the Logbay utility) produces the support log bundle. Alerts and Analysis only display information.
@briefing: From which Prism Element dashboard do you generate a support log bundle (Logbay)? Alerts and Analysis only display — they don't collect.
@eli5: You gather the diagnostic logs from the dashboard whose job is the cluster's wellbeing checks, not the ones that just show charts or alerts.
@tags: logs, logbay, health

### Q

An administrator wants one chart showing several storage bandwidth metrics for a single VM. Which chart type fits?

- ( ) Metric Chart
- (x) Entity Chart
- ( ) VM Summary Chart
- ( ) Hypervisor Performance Chart
@domain: monitoring
@difficulty: 2
@explain: An Entity Chart plots multiple metrics for one entity (for example read, write, and total bandwidth for a single VM). A Metric Chart tracks one metric across one or more entities.
@briefing: You want ONE chart with several storage-bandwidth metrics for a SINGLE VM. Which chart type plots many metrics for one entity? The other type tracks one metric across many entities.
@eli5: One pick shows many measurements for a single thing; the other shows a single measurement across many things — you want the former.
@tags: charts, prism-central

### Q

What state must a source VM be in to create a VM Template from it?

- ( ) Powered on
- (x) Powered off
- ( ) Running a Sysprep script
- ( ) Joined to an Active Directory domain
@domain: vms
@difficulty: 1
@explain: A template can be created only from a powered-off VM (and it must be on AHV, not an agent or Prism Central VM, with no attached volume group). The source VM can be powered back on afterward.
@briefing: What power state must a source VM be in to create a VM Template from it? It also must be on AHV with no attached volume group.
@eli5: You cast the VM into a reusable mold while it's at rest — it can be switched back on afterward.
@tags: templates

### Q

During host maintenance, which VM type cannot be live-migrated and is instead powered off?

- ( ) A VM without Nutanix Guest Tools
- (x) A VM marked as an Agent VM
- ( ) A memory-overcommitted VM
- ( ) A VM with an attached Volume Group
@domain: vms
@difficulty: 2
@explain: Agent VMs (like pass-through or affinity-pinned VMs) cannot live-migrate and are powered off during maintenance. Missing NGT, overcommit, and Volume Groups do not block migration.
@briefing: During host maintenance, one VM type can't live-migrate and is powered off instead. Which? Missing NGT, overcommit, or Volume Groups don't block migration.
@eli5: A VM pinned to specific host hardware can't hop to another host, so maintenance shuts it down rather than moving it.
@tags: agent-vm, migration, maintenance

### Q

How is the memory over-commit feature enabled on a VM?

- ( ) Only in the Prism Element web console
- (x) Using Prism Central
- ( ) Only with acli on the AHV host
- ( ) It is enabled by default
@domain: vms
@difficulty: 2
@explain: Memory over-commit is enabled from Prism Central. A VM created in the Prism Element web console must have over-commit turned on afterward from Prism Central.
@briefing: Where is memory over-commit enabled? A VM made in the Prism Element console must have it turned on afterward from a different management plane — which one?
@eli5: This setting lives in the higher, multi-cluster management layer, not the single-cluster console.
@tags: memory-overcommit, prism-central

### Q

A correctly configured Protection Policy shows recovery points on the source cluster but none at the DR site. What is the most likely cause?

- ( ) NGT is missing on the source VMs
- ( ) Windows updates are pending on the VMs
- (x) The destination cluster has no storage container with the same name
- ( ) The container Replication Factor differs between sites
@domain: data-protection
@difficulty: 3
@explain: If the destination lacks a storage container with the same name, replicated data lands in the SelfServiceContainer and the expected recovery points do not appear there. Matching container names is required.
@briefing: Replication shows recovery points at the source but none at the DR site. The most likely cause is a naming mismatch on the destination — what must match?
@eli5: If the destination doesn't have a container named the same as the source, the data lands somewhere unexpected and your recovery points don't show up where you look for them.
@tags: replication, containers

### Q

A cross-hypervisor (ESXi to AHV) DR test fails to bring up the guest VMs at the DR site. What must be installed on the source VMs?

- ( ) Raw device mappings
- ( ) Legacy BIOS boot
- (x) Nutanix Guest Tools (NGT)
- ( ) Delta disks
@domain: data-protection
@difficulty: 2
@explain: For cross-hypervisor recovery, NGT must be on the source VMs so disk controllers and drivers are reconfigured for the target hypervisor during failover.
@briefing: An ESXi→AHV DR test won't boot the VMs at the DR site. What must be installed on the SOURCE VMs so their disk controllers/drivers get reconfigured for the new hypervisor?
@eli5: Moving a VM between two different hypervisors needs an in-guest helper that swaps the disk drivers to match the destination — without it the VM can't boot there.
@tags: dr, ngt, cross-hypervisor

### Q

A multi-tier application's VMs must all be protected at the same instant. What should the administrator do?

- ( ) Create one consistency group per VM
- (x) Put all of the application's VMs in one consistency group
- ( ) Create a separate protection domain for each VM
- ( ) Use a VM-VM anti-affinity policy
@domain: data-protection
@difficulty: 2
@explain: Placing all of an application's VMs in a single consistency group snapshots them together, giving an application-consistent, simultaneous recovery point.
@briefing: A multi-tier app's VMs must all be captured at the SAME instant. What grouping snapshots them together for an app-consistent recovery point?
@eli5: Put all the app's VMs in one bundle so they're frozen at the same moment, not one-by-one at slightly different times.
@tags: consistency-group, application-consistent

### Q

VMs report high CPU Ready Time. What should the administrator check first to find the root cause?

- ( ) The CVM's assigned vCPU count
- (x) Host CPU utilization
- ( ) Cluster SSD capacity
- ( ) Memory oversubscription
@domain: performance
@difficulty: 2
@explain: High CPU Ready Time means VMs are waiting for physical cores, i.e. host CPU contention. Check host CPU utilization (sustained above 85-90% indicates overcommit). CVM vCPUs and SSD capacity do not drive Ready Time.
@briefing: High CPU Ready Time means VMs are waiting on physical cores. What do you check FIRST to confirm contention? CVM vCPUs and SSD capacity don't drive Ready Time.
@eli5: Ready Time is VMs queueing for CPU; the first thing to look at is whether the host's processors are simply overbooked.
@tags: cpu-ready-time, contention

### Q

A hybrid SSD/HDD cluster alerts that storage-pool SSD utilization is consistently above 75%. What is the likely impact?

- ( ) The cluster cannot survive an SSD failure
- ( ) The cluster will enter a read-only state
- ( ) The cluster may run out of metadata space
- (x) Average I/O latency may increase
@domain: performance
@difficulty: 2
@explain: Above roughly 75% SSD use, new writes spill to slower HDDs, so average I/O latency rises. Redundancy and read-only behavior are governed by other mechanisms.
@briefing: SSD tier is consistently above ~75% in a hybrid cluster. What's the likely impact? Think about where new writes have to go when the fast tier fills.
@eli5: When the fast tier gets full, new writes spill to the slower disks, so things start responding more slowly on average.
@tags: ssd, latency, tiering

### Q

Which storage-container setting reduces the space available to other containers in the same storage pool?

- ( ) Advertised Capacity
- ( ) Erasure Coding
- ( ) Deduplication
- (x) Reserved Capacity
@domain: storage
@difficulty: 2
@explain: Reserved Capacity carves a guaranteed amount out of the shared pool for one container, so that space is no longer available to others. Advertised Capacity only sets a ceiling.
@briefing: Which container setting carves a guaranteed slice out of the shared pool so OTHER containers lose access to that space? The other cap only sets a ceiling, taking nothing away.
@eli5: One setting fences off space for itself that no one else can touch; the other merely sets a maximum and doesn't reserve anything.
@tags: capacity, reserved

### Q

For which workload does Nutanix recommend enabling deduplication?

- ( ) Linked-clone VMs
- (x) Full-clone VMs
- ( ) Cold or archival data
- ( ) General-purpose server workloads
@domain: storage
@difficulty: 2
@explain: Full clones (and persistent full-clone VDI or P2V) hold identical blocks that dedup collapses well. Linked clones already share blocks, and cold or generic server data benefit little.
@briefing: For which workload does Nutanix recommend deduplication? Think about which VMs hold many identical blocks. Linked clones already share blocks; generic cold data benefits little.
@eli5: Dedup pays off when many copies hold the same blocks — the kind of full, independent copies that repeat identical data.
@tags: deduplication

### Q

On an AHV host, what does the internal virbr0 bridge (192.168.5.0/24) carry?

- ( ) User-VM traffic to the upstream physical network
- (x) Storage and management traffic between the AHV host and its local CVM
- ( ) Replication traffic between clusters
- ( ) Backplane traffic between CVMs on different hosts
@domain: architecture
@difficulty: 2
@explain: virbr0 is an internal-only bridge on 192.168.5.0/24 connecting the AHV host (192.168.5.1) to its local CVM (192.168.5.2) for storage I/O and management. User-VM traffic uses the OVS bridge (br0); the 192.168.5.0/24 range must never be reused elsewhere.
@briefing: What does the internal 192.168.5.0/24 bridge on an AHV host carry? User-VM traffic uses the other OVS bridge, and this internal range must never be reused.
@eli5: That private internal link is the short wire between the host and its own local storage controller — not for user VMs.
@tags: virbr0, cvm, internal-network

### Q

Which Nutanix component runs on every node and serves the storage I/O path for that node's VMs?

- ( ) Prism Central
- (x) The Controller VM (CVM)
- ( ) The Foundation VM
- ( ) The Witness VM
@domain: architecture
@difficulty: 1
@explain: Each node runs a Controller VM (CVM) that handles the data path and cluster services. A VM's storage I/O is served by its local CVM, which is what enables data locality.
@briefing: Which per-node component serves the storage I/O path for that node's VMs, and is what makes data locality possible?
@eli5: Every node has its own little storage brain that handles that node's disk traffic locally.
@tags: cvm, architecture, data-path

<!-- ===== BATCH 2 (same dump, remaining clean items) ===== -->

### Q

Which Nutanix offering runs AOS and AHV in a public cloud (AWS or Azure) to extend an on-prem datacenter?

- ( ) Nutanix Cloud Security
- (x) Nutanix Cloud Clusters (NC2)
- ( ) Nutanix Kubernetes Engine
- ( ) Nutanix Data Services
@domain: architecture
@difficulty: 1
@explain: Nutanix Cloud Clusters (NC2) runs the Nutanix stack (AOS/AHV) on AWS or Azure, giving one operating model across on-prem and cloud for mobility, DR, and burst capacity.
@briefing: Which Nutanix offering runs AOS/AHV inside a public cloud (AWS/Azure) to extend an on-prem datacenter with one operating model?
@eli5: It's the Nutanix stack lifted onto a public cloud so on-prem and cloud feel like the same system.
@tags: nc2, hybrid-cloud

### Q

Which license covers a new AOS-based cluster with no add-on packages under Nutanix Cloud Platform package licensing?

- ( ) Nutanix Cloud Manager (NCM)
- (x) Nutanix Cloud Infrastructure (NCI)
- ( ) Nutanix Unified Storage (NUS)
- ( ) Nutanix Database Service (NDB)
@domain: architecture
@difficulty: 2
@explain: NCI is the core AOS-based cluster license. NCM adds management/automation, NUS is storage services, and NDB is database services.
@briefing: Under Nutanix Cloud Platform package licensing, which license covers a plain AOS cluster with no add-ons? Management, storage-services, and database licenses are separate add-ons.
@eli5: It's the base infrastructure license — the floor everything else is added on top of.
@tags: licensing, nci

### Q

In a scale-out Prism Central deployment, what extra capability does configuring an FQDN provide that a single Virtual IP does not?

- (x) Load balancing across the Prism Central nodes
- ( ) Resiliency
- ( ) Network segmentation
- ( ) SSL certificate support
@domain: architecture
@difficulty: 2
@explain: An FQDN lets requests be distributed across multiple Prism Central instances (load balancing). Resiliency comes from HA/replication, and certificates apply either way.
@briefing: In scale-out Prism Central, what does an FQDN add that a single Virtual IP doesn't? Resiliency comes from HA/replication; certificates apply either way.
@eli5: A name can fan requests out across several Prism Central instances; a single IP just points at one door.
@tags: prism-central, fqdn

### Q

A cluster will not allow a change from Redundancy Factor 2 to Redundancy Factor 3. What must the administrator check?

- ( ) That the cluster is licensed
- (x) That the cluster has five or more nodes
- ( ) Hardware availability of the nodes
- ( ) That data-at-rest encryption is enabled
@domain: architecture
@difficulty: 2
@explain: RF3 requires a minimum of five nodes (to keep the extra data and metadata copies). Node count is the gating factor, not licensing or hardware.
@briefing: A cluster won't move from RF2 to RF3. What's the gating factor to check? It's not licensing or hardware.
@eli5: Keeping a third copy of data and metadata needs a minimum cluster size — too few nodes and the extra copies won't fit.
@tags: redundancy-factor, rf3, nodes

### Q

In an RF2 Nutanix cluster, what is the minimum number of nodes required to remove a host?

- ( ) 2
- ( ) 3
- (x) 4
- ( ) 5
@domain: architecture
@difficulty: 2
@explain: RF2 keeps two data copies and needs at least three nodes to run; removing a host safely while preserving RF2 requires a four-node cluster so two copies still fit afterward.
@briefing: In an RF2 cluster, what's the minimum node count to safely REMOVE a host and still keep two copies afterward?
@eli5: RF2 needs enough nodes that, even after one leaves, two copies of the data still have a home.
@tags: rf2, host-removal, nodes

### Q

In Prism Element, how many nodes can be placed into maintenance mode at one time on a 12-node FT2 cluster?

- (x) 1
- ( ) 2
- ( ) 3
- ( ) 4
@domain: architecture
@difficulty: 2
@explain: Only one node at a time should be in maintenance mode; taking more out at once erodes redundancy and risks availability even on a large FT2 cluster.
@briefing: On a 12-node FT2 cluster, how many nodes should be in maintenance mode at once? A bigger cluster doesn't change the safe answer.
@eli5: Pull only as many as preserves redundancy — and that's a very small number regardless of how big the cluster is.
@tags: maintenance-mode, fault-tolerance

### Q

When configuring a physical network switch in Prism Element for monitoring, what information is required?

- ( ) DNS configuration
- ( ) NTP configuration
- ( ) SMTP configuration
- (x) SNMP configuration
@domain: networking
@difficulty: 2
@explain: Adding a switch for monitoring needs its SNMP details (management IP, SNMP version/security, community, etc.) so Prism can read its status and metrics.
@briefing: To add a physical switch to Prism for monitoring, what config detail is required so Prism can read its status and metrics?
@eli5: Prism needs the switch's standard network-monitoring protocol details to poll its health.
@tags: switch, snmp, monitoring

### Q

What must be allowed on the physical switches for a Nutanix cluster to automatically discover new nodes during expansion?

- ( ) The same hypervisor version on new nodes
- (x) IPv6 multicast
- ( ) The same AOS version on new nodes
- ( ) IPv4 multicast only
@domain: networking
@difficulty: 2
@explain: Node discovery relies on IPv6 multicast (the CVM sends discovery packets on port 5353); matching versions matters for compatibility but not for discovery.
@briefing: What must the physical switches allow for a cluster to auto-discover new nodes during expansion? Version matching matters for compatibility, not discovery.
@eli5: New nodes announce themselves with a specific multicast 'hello'; the switches must let those packets through.
@tags: cluster-expansion, ipv6, multicast

### Q

A security team needs port mirroring (SPAN) from a source VM to a target VM. What must be true?

- ( ) Both VMs are in the same VPC
- ( ) Both VMs are on the same subnet
- (x) Both VMs are on the same host
- ( ) Both VMs are on the same VLAN
@domain: networking
@difficulty: 2
@explain: Encapsulated port mirroring captures traffic on a host, so the source and target VMs must reside on the same host; subnet/VLAN/VPC do not satisfy the requirement.
@briefing: Port mirroring (SPAN) from a source VM to a target VM requires what about their placement? Same subnet/VLAN/VPC isn't enough.
@eli5: The traffic copy is captured locally, so both the watched VM and the watcher must sit on the same physical host.
@tags: port-mirroring, span

### Q

After deploying a cluster, time is not synchronizing across nodes. What must be configured?

- ( ) DNS
- (x) NTP
- ( ) HA
- ( ) SMTP
@domain: lifecycle
@difficulty: 1
@explain: NTP synchronizes time across the CVMs; point the cluster at several reliable NTP servers. DNS, HA, and SMTP do not control time.
@briefing: Time isn't syncing across nodes after deployment. What must be configured? DNS, HA, and SMTP don't control time.
@eli5: Point the cluster at reliable time servers so all the nodes agree on the clock.
@tags: ntp, time-sync

### Q

After fixing issues flagged by NCC Health Checks, how can an administrator re-run only the checks that previously failed?

- ( ) Run LCM Pre-Upgrade to trigger NCC checks
- ( ) Run "ncc health_checks run_all"
- ( ) Click Run Check on each one manually
- (x) Select "Only Failed And Warning Checks"
@domain: lifecycle
@difficulty: 2
@explain: NCC's "Only Failed And Warning Checks" re-runs just the prior FAIL/WARN items to confirm they are resolved, instead of running the whole suite.
@briefing: After fixing NCC findings, how do you re-run ONLY the previously failed/warning checks instead of the whole suite?
@eli5: There's an option to recheck just the items that were red or yellow last time, to confirm they're now clean.
@tags: ncc, health-checks

### Q

An LCM upgrade of AHV hosts will exceed the maintenance window. How can the administrator gracefully prevent further updates?

- ( ) Cancel LCM tasks with ecli
- ( ) Run lcm_task_cleanup.py
- ( ) Restart Genesis to restart LCM
- (x) Use the Stop Update feature in LCM
@domain: lifecycle
@difficulty: 2
@explain: LCM's built-in Stop Update pauses the run gracefully after the current node, so it can be resumed later. The other options are disruptive or do not stop an active run.
@briefing: An LCM run will overrun the maintenance window. Which built-in feature pauses it GRACEFULLY (finishing the current node, resumable later)? The other options are disruptive.
@eli5: There's a clean 'halt after this node' control that lets you resume later — not a hard yank mid-flight.
@tags: lcm, stop-update

### Q

What is the correct first step when upgrading a host's physical memory?

- (x) Place the node into maintenance mode
- ( ) Stop the host via the out-of-band management interface
- ( ) Remove the node from the cluster
- ( ) Run "shutdown -h now" on the AHV host
@domain: lifecycle
@difficulty: 2
@explain: Maintenance mode first live-migrates the running VMs off the node; only then is it safe to shut the host down. Shutting down first causes an outage and an HA event; removing the node forces unnecessary re-replication.
@briefing: First step to upgrade a host's physical RAM? Think about getting the running VMs off safely before powering down. Shutting down first causes an outage; removing the node forces re-replication.
@eli5: Before you open the box, gently move the running VMs off the node — only then power it down.
@tags: maintenance-mode, hardware, memory

### Q

What is the default admin session timeout in Prism?

- ( ) 5 minutes
- ( ) 10 minutes
- (x) 15 minutes
- ( ) 20 minutes
@domain: monitoring
@difficulty: 1
@explain: The default Prism admin session times out after 15 minutes; the IAM token and session cookie expire at 15 minutes even if the UI is set to keep the session alive longer.
@briefing: What's the DEFAULT Prism admin session timeout? The token and cookie expire at this default even if the UI claims to keep you logged in longer.
@eli5: Walk away and the admin session logs you out after a set, fairly short default window.
@tags: prism, session-timeout

### Q

A report created in the Prism Central Intelligent Operations dashboard is gone after the administrator logs back in. Why?

- ( ) A Cluster Viewer deleted it
- ( ) It was archived automatically
- (x) Temporary reports are automatically deleted after 24 hours
- ( ) It was stored in Prism Element
@domain: monitoring
@difficulty: 2
@explain: Reports generated in the Intelligent Operations dashboard are purged after about 24 hours; to keep one, download it (PDF/CSV) or save it as a report configuration.
@briefing: A report made in the Intelligent Operations dashboard vanished after re-login. Why? Temporary reports have a lifespan — to keep one you must download it or save its config.
@eli5: Those quick reports are temporary and get swept away after about a day unless you save a copy.
@tags: reports, intelligent-operations

### Q

How should an administrator verify a cluster's protection from data loss due to a component failure?

- ( ) Open the gear icon and select Pulse
- ( ) Open Home then Alerts
- (x) Check the Data Resiliency Status widget
- ( ) Open the Health dashboard
@domain: monitoring
@difficulty: 1
@explain: The Data Resiliency Status widget summarizes how many failures the cluster can currently tolerate based on configuration and component health. Pulse and Alerts do not report resiliency directly.
@briefing: How do you verify the cluster's current protection from a component failure? Which widget summarizes how many failures it can tolerate? Pulse and Alerts don't report resiliency directly.
@eli5: One widget tells you, right now, how many failures the cluster could shrug off.
@tags: data-resiliency, prism-element

### Q

When several alert policies apply to the same entity, which one takes precedence?

- (x) The policy applied to a specific entity type
- ( ) A policy applied to all entities of a type
- ( ) A policy applied to an entity type in a category
- ( ) A policy applied to an entity type in a cluster
@domain: monitoring
@difficulty: 2
@explain: The most specific policy wins (a specific entity overrides category- or cluster-scoped ones); within the same specificity, the most recently updated policy applies.
@briefing: When several alert policies hit the same entity, which one wins? Think specificity — and, on a tie, recency.
@eli5: The narrowest, most targeted policy beats the broad cluster-wide ones; if two are equally specific, the newest applies.
@tags: alert-policy, precedence

### Q

What guest customization options are available when creating a VM template?

- (x) Sysprep and Cloud-init
- ( ) Bash and PowerShell
- ( ) Python and YAML
- ( ) Custom Script and Guided Script
@domain: vms
@difficulty: 1
@explain: Sysprep (Windows) and cloud-init (Linux) are the guest customization methods offered for templates; the others are scripting languages or formats, not the customization options themselves.
@briefing: What guest-customization options are offered when creating a VM template? The distractors are scripting languages or formats, not customization methods.
@eli5: The two customization tools are the standard Windows and Linux first-boot personalizers — not programming languages.
@tags: templates, sysprep, cloud-init

### Q

In Prism Central, under Compute and Storage, which section is used to upload a Windows ISO file?

- ( ) Catalog Items
- ( ) Templates
- (x) Images
- ( ) OVAs
@domain: vms
@difficulty: 1
@explain: ISO and disk images are uploaded and managed under Images. Templates are for VM templates and OVAs are for virtual-appliance import.
@briefing: Under Compute & Storage in Prism Central, which section hosts a Windows ISO upload? Templates are for VM templates; OVAs are for appliance import.
@eli5: ISOs and disk files live in the section literally meant for disk/optical media, not the VM-template or appliance areas.
@tags: images, iso

### Q

Which AHV feature deploys a temporary VM so an administrator can log in and apply OS patches to a VM template?

- ( ) Create VM from Template
- ( ) Complete Guest OS Update
- ( ) Update Configuration
- (x) Update Guest OS
@domain: vms
@difficulty: 2
@explain: Update Guest OS spins up a temporary VM from the template, lets you patch it, then creates a new template version and deletes the temporary VM.
@briefing: Which AHV feature spins up a TEMPORARY VM so you can log in and patch a template's OS, then versions the template and cleans up?
@eli5: It briefly hatches a throwaway VM from the template, lets you patch it, saves a new template version, then deletes the temp VM.
@tags: templates, guest-os-update

### Q

What must be true before live-migrating a vGPU-enabled VM to another host in the cluster?

- (x) The destination host has enough resources for the VM
- ( ) The vGPU profile is changed first
- ( ) The VM is configured as an agent VM
- ( ) Host affinity pins the VM to a host
@domain: vms
@difficulty: 2
@explain: vGPU live migration is best-effort and only succeeds if the destination has the needed GPU resources; otherwise the VM is shut down. Agent/affinity settings would block migration.
@briefing: Before live-migrating a vGPU VM, what must be true of the destination host? vGPU migration is best-effort; agent/affinity settings would block it entirely.
@eli5: The move only works if the target host has the GPU room to receive it — otherwise the VM gets shut down instead.
@tags: vgpu, live-migration

### Q

On a single-node cluster, which replication option gives the lowest supported RPO?

- ( ) NearSync replication
- ( ) A 16-to-59 minute schedule
- (x) Async replication
- ( ) A 1-to-15 minute schedule
@domain: data-protection
@difficulty: 2
@explain: NearSync and sub-hour schedules are not supported on single-node clusters; the lowest supported RPO there is 6 hours via asynchronous replication.
@briefing: On a SINGLE-NODE cluster, which replication option gives the LOWEST supported RPO? NearSync and sub-hour schedules aren't supported there.
@eli5: On one node you can't do the near-real-time tiers; the best you get is the periodic, hours-apart option.
@tags: rpo, async, single-node

### Q

What is the first step when setting up a Protection Policy for a regular DR test?

- ( ) Install NGT on the supported VMs
- (x) Create an Availability Zone between Production and DR
- ( ) Convert the source cluster to AHV
- ( ) Take a point-in-time snapshot of the source VMs
@domain: data-protection
@difficulty: 2
@explain: An Availability Zone first defines the scope where workloads can be protected and recovered; NGT, snapshots, and hypervisor choice come later or are not required.
@briefing: First step when setting up a Protection Policy for recurring DR tests? Something must define the protected/recovery SCOPE before snapshots or NGT.
@eli5: Before anything else, establish the paired 'regions' between production and DR that define where things can fail over.
@tags: dr, availability-zone

### Q

An administrator cannot delete a protected (secure) snapshot. What is the most likely cause?

- ( ) A recovery is in progress
- ( ) Ransomware encrypted the snapshot
- (x) An approval policy for the deletion was denied
- ( ) The snapshot is corrupted
@domain: data-protection
@difficulty: 2
@explain: Secure snapshots require approval before deletion; a denied approval policy blocks it. Nutanix snapshots are immutable, and corruption would not prevent deletion.
@briefing: An admin can't delete a protected (secure) snapshot. Most likely cause? Secure snapshots gate deletion behind something. Nutanix snapshots are immutable, and corruption wouldn't block deletion.
@eli5: A secure snapshot requires sign-off to delete; if that approval was refused, the deletion is blocked.
@tags: snapshots, approval-policy

### Q

Which data-savings technique uses data stripes plus a parity calculation?

- ( ) Compression
- ( ) Deduplication
- (x) Erasure Coding
- ( ) Capacity reservation
@domain: storage
@difficulty: 1
@explain: Erasure Coding stripes data across nodes and stores parity to rebuild on failure, saving space versus full copies. Compression and dedup reduce size without parity.
@briefing: Which data-savings technique stripes data across nodes PLUS stores a parity calculation to rebuild on failure? Compression and dedup shrink data without parity.
@eli5: It spreads pieces across nodes and keeps a math 'checksum' block, so a lost piece can be recomputed — saving space versus full copies.
@tags: erasure-coding, parity

### Q

Which attributes does a Nutanix Storage Policy manage?

- ( ) Storage containers and volume groups
- (x) Replication Factor and encryption
- ( ) Shares and object stores
- ( ) Network segmentation
@domain: storage
@difficulty: 2
@explain: Storage Policies govern attributes such as Replication Factor, encryption, compression, and QoS — applied to entities via categories — not container or volume-group objects themselves.
@briefing: Which attributes does a Nutanix Storage Policy manage (applied to entities via categories)? Think data-protection and QoS attributes, not container or volume-group objects.
@eli5: A storage policy sets data attributes like how many copies, encryption, compression, and QoS — applied by category, not by hand per object.
@tags: storage-policy

### Q

A container must guarantee 10 GiB that no other container can use, and be capped at 500 GiB. Which settings apply?

- ( ) Advertised 10 GiB and Reserved 500 GiB
- ( ) Reserved 500 GiB only
- ( ) Advertised 10 GiB only
- (x) Reserved 10 GiB and Advertised 500 GiB
@domain: storage
@difficulty: 2
@explain: Reserved Capacity (10 GiB) is the guaranteed floor others cannot consume; Advertised Capacity (500 GiB) is the ceiling that caps growth. The two settings serve opposite purposes.
@briefing: A container must GUARANTEE 10 GiB others can't touch AND be CAPPED at 500 GiB. Which two settings, and which is which? They serve opposite purposes — a floor and a ceiling.
@eli5: One setting is the guaranteed floor nobody else can eat into; the other is the ceiling that caps growth.
@tags: capacity, reserved, advertised

### Q

A Windows Server 2019 VM (1 vCPU, 8 GB RAM, VirtIO SCSI) has storage performance issues while other VMs are fine. Which change should be reviewed first?

- ( ) Add a second virtual SCSI controller
- ( ) Enable Balance-TCP on br0
- ( ) Increase CVM resources
- (x) Increase the VM's vCPU count
@domain: performance
@difficulty: 2
@explain: A single vCPU bottlenecks storage processing under load; since the rest of the cluster is healthy, adding vCPUs to this VM is the first thing to review.
@briefing: A 1-vCPU Windows VM has storage issues while the cluster is otherwise healthy. What to review FIRST? Think about what a single vCPU can't keep up with under load.
@eli5: One CPU can choke on storage processing under load; since everything else is fine, give this VM more CPUs first.
@tags: vcpu, storage-performance

### Q

To comply with a policy that internet-bound replication must be encrypted (replicating to NC2), what should be enabled?

- ( ) A self-encrypting drive
- ( ) UEFI Secure Boot
- ( ) Data-at-Rest Encryption
- (x) Data-in-Transit Encryption
@domain: security
@difficulty: 2
@explain: Data-in-Transit Encryption secures traffic on the wire, including replication to a secondary cluster or NC2 over a WAN. Data-at-Rest and SEDs protect stored data, not data in flight.
@briefing: Policy: internet-bound replication (to NC2) must be encrypted ON THE WIRE. What do you enable? At-Rest encryption and SEDs protect stored data, not data in flight.
@eli5: You need to encrypt the data as it travels the WAN, not where it sits on disk.
@tags: encryption, data-in-transit, nc2

### Q

Team leads need to directly manage a specific set of VMs in a dev environment. What is the most efficient approach?

- ( ) A role mapping per team lead
- ( ) A VPC per team lead with VPC Admin
- (x) A Project per team lead with access assigned
- ( ) Security Policies to isolate users
@domain: security
@difficulty: 2
@explain: Projects scope a defined set of VMs and resources to specific users with roles, giving fine-grained delegated management. VPCs handle networking and security policies handle traffic, not VM-management delegation.
@briefing: Team leads must directly manage a specific set of dev VMs. Most EFFICIENT approach? Think scoped, role-based delegation of a defined resource set. VPCs do networking; security policies do traffic.
@eli5: Hand each lead a scoped 'workspace' that bundles their VMs and grants them roles over just those — clean delegated management.
@tags: projects, rbac, access-control

<!-- Multi-answer items (correctIndices). Mark every correct option with (x);
     the importer emits correctIndices and the games render a multi-select UI
     graded by exact set match. Authored from the NCP-MCI blueprint (verified). -->

### Q

Which TWO redundancy factors (RF) does Nutanix AOS support for protecting cluster data?

- ( ) RF1
- (x) RF2
- (x) RF3
- ( ) RF4
@domain: data-protection
@difficulty: 1
@multi: true
@explain: AOS supports RF2 (two copies, tolerates one component failure) and RF3 (three copies, tolerates two). RF1 keeps a single copy with no redundancy and is not a supported resiliency setting; RF4 does not exist.
@briefing: Which TWO redundancy factors does AOS support for protecting cluster data? One option keeps a single copy with no redundancy; another simply doesn't exist.
@eli5: AOS supports the two-copy and three-copy levels; a one-copy 'level' isn't real protection, and a four-copy one isn't a thing.
@tags: redundancy-factor, resiliency

### Q

Which TWO AHV uplink bond modes operate without any configuration on the upstream physical switch?

- (x) Active-backup
- (x) Balance-SLB
- ( ) Balance-TCP (LACP)
- ( ) Balance-TCP with LACP fallback
@domain: networking
@difficulty: 2
@multi: true
@explain: Active-backup and Balance-SLB make no demands on the physical switch and work with standard access ports. Both Balance-TCP variants negotiate LACP, so they require a matching link-aggregation group configured on the upstream switch.
@briefing: Which TWO AHV bond modes need NO upstream switch configuration? The LACP-negotiating modes require a matching link-aggregation group on the switch.
@eli5: Two bond modes work with plain access ports and ask nothing of the switch; the link-aggregation ones need the switch set up to match.
@tags: ahv, bond-mode, lacp
