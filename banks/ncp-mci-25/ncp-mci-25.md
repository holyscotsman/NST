# Nutanix Practice — 25-Question Set
cert: NCP-MCI
title: Nutanix Practice — 25-Question Set
pass: 0.80
domains: architecture, storage, networking, security, vms, lifecycle, monitoring, performance

### ncp25-q01
domain: vms
difficulty: 3

Q: If a Nutanix cluster deployed using ESXi is only using one datastore, which advanced option needs to be set during the initial cluster deployment?
- [ ] das.ignoreInsufficientHbDatastore with a value of false
- [ ] das.ignoreInsufficientHbDatastore with a value of 0
- [ ] das.ignoreInsufficientHbDatastore with a value of 1
- [x] das.ignoreInsufficientHbDatastore with a value of true

Explain: With only a single Nutanix datastore, vSphere HA raises an insufficient-heartbeat-datastores warning unless the advanced option das.ignoreInsufficientHbDatastore is set to true. Nutanix also recommends enabling host monitoring and percentage-based admission control sized to the number of nodes.

### ncp25-q02
domain: security
difficulty: 2

Q: To improve security on a newly created vSphere-based Nutanix cluster, which two default passwords should be changed? (Choose two)
- [x] root user on ESXi
- [ ] nutanix user on vCenter
- [x] nutanix user on the CVM
- [ ] root user on Prism Central

Explain: Nutanix recommends changing the default password for the CVM local nutanix account and, on an ESXi deployment, the hypervisor local root account. The broader recommendation also covers AHV root/admin/nutanix, Hyper-V administrator, Prism Central admin and nutanix, IPMI ADMIN, and FSVM nutanix accounts.

### ncp25-q03
domain: lifecycle
difficulty: 3

Q: After triggering a set of LCM updates, an administrator sees a pre-check failure in Prism that lacks enough detail to isolate the cause. Which two logs on the CVM should be investigated? (Choose two)
- [ ] stargate.out
- [x] lcm_ops.out
- [x] genesis.out
- [ ] lcm_wget.out

Explain: LCM writes its inventory and update operations to genesis.out, lcm_ops.out, lcm_ops.trace, and lcm_wget.log. For a failed pre-check, genesis.out and lcm_ops.out carry the operational context needed to isolate the cause.

### ncp25-q04
domain: lifecycle
difficulty: 3

Q: Refer to the exhibit (Prism hardware view: host 10.38.69.28 shows the warning "Host is under maintenance"). Which two CLI commands are required to take the CVM and the node out of maintenance mode? (Choose two)
- [x] acli host.exit_maintenance_mode host-ip
- [x] ncli host edit id=host-ID enable-maintenance-mode=false
- [ ] acli host.disable_maintenance_mode host-ip
- [ ] ncli host edit id=host-ID disable-maintenance-mode=true

Explain: Bring the CVM out of maintenance first with ncli host edit id=host-ID enable-maintenance-mode=false, then bring the node out with acli host.exit_maintenance_mode host-ip. The other two commands are not valid syntax.

### ncp25-q05
domain: performance
difficulty: 2

Q: Which terms describe performance acceleration features of the Distributed Storage Fabric?
- [ ] Extent Groups, vDisk flash mode, and AHV Turbo
- [x] Intelligent Tiering, Data Locality, and Automatic Disk Balancing
- [ ] Erasure Coding, vDisk flash mode, and Autonomous Extent Store
- [ ] Deduplication, Compression, and Erasure Coding

Explain: The DSF accelerates performance with Intelligent Tiering (moving hot data between the SSD and HDD tiers automatically), Data Locality (keeping a VM's working set on the node where it runs to avoid network reads), and Automatic Disk Balancing (spreading data uniformly across the cluster).

### ncp25-q06
domain: storage
difficulty: 4

Q: The Autonomous Extent Store will bypass the OpLog in which workload scenario?
- [ ] Sequential Read
- [ ] Sequential Write
- [x] Sustained Random Write
- [ ] Sustained Random Read

Explain: With AES, sustained random write workloads bypass the OpLog and are written directly to the Extent Store, using primarily local metadata for efficient sustained performance. Bursty random writes still take the normal OpLog path and later drain to the Extent Store.

### ncp25-q07
domain: storage
difficulty: 3

Q: What two types of VDI workloads benefit from enabling cache deduplication? (Choose two)
- [ ] VAAI Clone
- [x] Persistent Desktops
- [x] Full Clone
- [ ] Linked Clone

Explain: Inline cache (read) deduplication is recommended primarily for full-clone and persistent-desktop VDI, where many VMs read identical OS and application data. It is not recommended for VAAI-clone or linked-clone environments, and it requires CVMs with at least 24 GB of RAM.

### ncp25-q08
domain: storage
difficulty: 3

Q: An administrator is preparing an RF2 four-node cluster to deploy a VDI project consisting of full clones. Which action should the administrator take to support this workload?
- [ ] Create a dedicated storage pool with the default storage efficiency configuration.
- [x] Create a dedicated storage container with inline compression and deduplication.
- [ ] Set cluster redundancy to RF3 to support Erasure Coding in a new storage container.
- [ ] Add one node to the cluster and enable Erasure Coding in a new storage container.

Explain: Nutanix recommends enabling inline compression generally and enabling deduplication only for VDI, in a separate container. So create a dedicated container for the VDI full clones with inline compression and deduplication.

### ncp25-q09
domain: networking
difficulty: 3

Q: A company wants a few lower-priority VMs to communicate through 1G uplinks only, while keeping maximum throughput for the other mission-critical VMs. How can this be achieved?
- [ ] Add all available uplinks to br0 and configure LACP.
- [ ] Add all available uplinks to br0 and configure balance-slb.
- [x] Create vs1 with 1G uplinks and assign the lower-priority VMs a network on br1.
- [ ] Create vs0 with 1G uplinks and assign the lower-priority VMs a network on br1.

Explain: Put the lower-priority VMs on a separate virtual switch (vs1 on br1) built with the 1G uplinks, and keep the mission-critical VMs on a switch that uses the faster uplinks. vs0/br0 is the default switch carrying the critical VMs, so it should not be rebuilt with 1G links.

### ncp25-q10
domain: networking
difficulty: 2

Q: What is the Nutanix-recommended configuration for taking full advantage of the bandwidth provided by multiple links?
- [ ] No Uplink Bond
- [ ] Active-Active with MAC Pinning
- [ ] Active-Backup
- [x] Active-Active

Explain: Active-Active (Balance-TCP) lets VMs send traffic across multiple uplink interfaces simultaneously, aggregating their bandwidth. Active-Backup uses one uplink at a time, MAC pinning (Balance-SLB) pins each vNIC to a single uplink, and no bond uses only one link.

### ncp25-q11
domain: networking
difficulty: 3

Q: An administrator wants to script the collection of node NIC MAC addresses to map nodes and NICs to switches and ports. What is the most efficient way to collect the node MAC address?
- [ ] Use the network configuration in Prism Element.
- [x] Use the ethtool command via the CLI.
- [ ] Use the manage_ovs command via the CLI.
- [ ] Use the IPMI interface to collect hardware data.

Explain: Running ethtool -P on a NIC (for example, ethtool -P eth3) on the AHV host returns that interface's permanent MAC address, which is ideal for scripting. The ifconfig command also displays the HWaddr.

### ncp25-q12
domain: monitoring
difficulty: 2

Q: An administrator needs to customize report settings, such as appearance and retention, differently for each corporate business unit. Where should these customizations be configured?
- [ ] In the main Report Setting in Prism Central Reports
- [ ] In Prism Central Settings, UI Settings
- [ ] In Nutanix Cloud Manager Operation Policies
- [x] In Report Settings for each report

Explain: Report settings can be applied globally or per report; to differentiate them per business unit, configure Report Settings within each individual report. When both global and report-level settings exist, the report-level setting takes precedence.

### ncp25-q13
domain: monitoring
difficulty: 3

Q: An administrator needs to compare two VMs to see if one is resource constrained. Which two chart types provide this information? (Choose two)
- [x] Entity chart for each VM showing its CPU Ready %
- [x] Metric chart showing each VM's CPU Usage %
- [ ] Metric chart showing cluster CPU Usage %
- [ ] Entity chart for each VM's host showing Hypervisor CPU Usage %

Explain: An Entity chart tracks one or more metrics for a single entity (each VM's CPU Ready %), and a Metric chart tracks a single metric across entities (each VM's CPU Usage %). The other options focus on the host and cluster rather than on the two VMs being compared.

### ncp25-q14
domain: monitoring
difficulty: 3

Q: A VM's CPU normally runs 20-40% on weekdays and 15-25% on weekends, but since a recent update it spikes to 100% every 60-120 minutes. In which two locations should the administrator look to track this behavior? (Choose two)
- [ ] In the VM details Alert tab.
- [x] In the Event dashboard.
- [x] In the VM details Metrics tab.
- [ ] In the Alerts dashboard.

Explain: Anomaly detection learns a normal behavior band from historical data and flags outliers as events. Those anomalies appear in the Event dashboard (behavioral anomaly event details) and on the VM details Metrics tab.

### ncp25-q15
domain: performance
difficulty: 4

Q: An administrator is asked to add processors to a VM whose application performs poorly. The VM has 1 vCPU with 2 vCores; Prism shows 50% CPU usage and 0 CPU Ready. Which action should be taken?
- [ ] Do not add vCPUs because the cluster is already overcommitted.
- [ ] Add 1 vCPU with 2 vCores to ensure vNUMA support.
- [x] Do not add vCPUs because the application does not support SMP.
- [ ] Add 2 vCores to double VM computing power.

Explain: With only 50% CPU usage and no CPU Ready time, the VM is not waiting on CPU scheduling, so adding processors would not help. The application cannot use additional CPUs because it does not support SMP (symmetric multi-processing).

### ncp25-q16
domain: performance
difficulty: 3

Q: Which Inefficient VM Profile type is used to identify a VM with Host I/O Stargate CPU usage greater than 85%?
- [ ] Over-provisioned VM
- [x] Bully
- [ ] Inactive VM
- [ ] Constrained VM

Explain: A bully VM consumes so many resources that others starve; one trigger is Host I/O Stargate CPU usage above 85% (others include CPU ready time over 5% or a memory swap rate above 0 Kbps sustained for over an hour). Constrained, over-provisioned, and inactive profiles use different criteria.

### ncp25-q17
domain: monitoring
difficulty: 3

Q: An administrator must configure an AHV cluster to forward all system logs to a central log server. Which two steps are needed? (Choose two)
- [x] Determine which modules and log levels need to be forwarded.
- [x] Configure rsyslog-config via ncli.
- [ ] Install the Splunk Agent for AHV.
- [ ] Configure rsyslog forwarding via Prism Element.

Explain: Use the ncli rsyslog-config command to add a remote syslog server and then add modules specifying which modules and log levels to forward. No Splunk agent is required, and rsyslog forwarding cannot be configured in Prism Element (only in Prism Central or in the CVM ncli).

### ncp25-q18
domain: architecture
difficulty: 2

Q: Which service controls all I/O in the Nutanix cluster?
- [x] Stargate
- [ ] Zookeeper
- [ ] Curator
- [ ] Genesis

Explain: Stargate is the data I/O manager, responsible for all data management and I/O operations and the main interface from the hypervisor (via NFS, iSCSI, or SMB); it runs on every node. Curator handles MapReduce cleanup, Genesis manages services, and Zookeeper stores cluster configuration.

### ncp25-q19
domain: architecture
difficulty: 2

Q: Which service is responsible for running the Nutanix GUI interface?
- [ ] Pithos
- [ ] Zeus
- [x] Prism
- [ ] Medusa

Explain: Prism is the management gateway (HTML5 UI, ncli, and REST API) and runs on every node with an elected leader. Pithos manages vDisk configuration, Medusa fronts the metadata database, and Zeus is the library used to access cluster configuration.

### ncp25-q20
domain: monitoring
difficulty: 3

Q: An administrator has custom alert policies in Prism Central monitoring guest VM CPU and memory. The application owners of specific VMs should be emailed when an alarm triggers. What must be configured?
- [x] Create a rule to send an email to the application owner.
- [ ] Configure the email settings within each VM category.
- [ ] Create a task to send an email to the application owner.
- [ ] Configure the email settings within each specific alert policy.

Explain: Configuring who receives alert emails is a separate action from the alert policy itself and from VM categories. In Prism Central you create an email rule (recipients and message) for the alerts; it requires an SMTP server and is not enabled by default.

### ncp25-q21
domain: vms
difficulty: 2

Q: A Windows VM reports 100% memory usage in Prism while in-guest usage never exceeds 30%. What should the administrator do to resolve this?
- [ ] Reboot the host where the VM is running.
- [ ] Reboot the VM.
- [x] Install the VirtIO Balloon driver.
- [ ] Live Migrate the VM.

Explain: AOS relies on the balloon driver (part of the Nutanix VirtIO package) inside the guest to report memory usage. Windows does not ship this driver, so without it Prism cannot report accurate guest memory usage.

### ncp25-q22
domain: vms
difficulty: 3

Q: A company runs virtual desktops from a gold image on one AHV cluster and later adds four more clusters dedicated to VDI. To keep the gold image consistent across all clusters, which two items must the administrator implement? (Choose two)
- [x] Create an Image Placement Policy in Prism Central.
- [ ] Set up Leap OnPrem and deploy Protection/Recovery plans.
- [x] Create a custom category and tag the cluster and image.
- [ ] Install NGT on the gold image so it can replicate between clusters.

Explain: In Prism Central, create categories and tag the clusters and image, then create an Image Placement Policy that associates the image categories with the cluster categories. Leap and NGT are not relevant to keeping an image consistent across clusters.

### ncp25-q23
domain: security
difficulty: 3

Q: What are two supported values of an Encryption Storage Policy? (Choose two)
- [x] Inherit from Cluster
- [x] Enabled
- [ ] Self Encrypting Drives (SED) Encryption
- [ ] Disabled

Explain: When enabling encryption within a Storage Policy, the two possible settings are Enabled and Inherit from Cluster.

### ncp25-q24
domain: storage
difficulty: 3

Q: An administrator has several storage containers on the same storage pool, each with different optimizations. Which two actions ensure that one container does not consume all remaining storage space? (Choose two)
- [ ] Enable Compression for each storage container.
- [x] Configure the Reserved Capacity for each storage container.
- [ ] Enable Deduplication for each storage container.
- [x] Configure the Advertised Capacity for each storage container.

Explain: By default every container can use all unused pool space. Set Reserved Capacity (a guaranteed minimum) and Advertised Capacity (a maximum ceiling) per container so no single container starves the others. In total, reserve no more than 90% of the pool.

### ncp25-q25
domain: storage
difficulty: 2

Q: An administrator is setting up a new storage container to host persistent (full-clone) VDI desktop VMs. Which storage optimization feature should be enabled?
- [ ] Flash Pinning
- [ ] Redundancy Factor 1
- [ ] Post-Process Compression
- [x] Deduplication

Explain: Nutanix recommends enabling deduplication only for VDI workloads, in a dedicated container. Persistent full-clone desktops share large amounts of identical data, so deduplication yields significant capacity savings.
