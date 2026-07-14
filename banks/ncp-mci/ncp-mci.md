# Nutanix Certified Professional — Multicloud Infrastructure
cert: NCP-MCI
title: Nutanix Certified Professional — Multicloud Infrastructure
pass: 0.80
domains: architecture, storage, networking, security, vms, data-protection, lifecycle, monitoring, performance

### mci-security-q3p5
domain: security
difficulty: 3
tags: cluster-lockdown, ssh, cvm, alerts
image: images/ncp-mci-e1-q1.png
image-alt: Prism alert detail: 'The cluster is using password based ssh access for the cvm 192.168.10.102.' Severity Info, impact type Configuration. Summary states password-based remote login is enabled and recommends key-based SSH instead. Recommendation: change the SSH security setting of the CVM.

Q: An administrator sees the alert shown in the exhibit. What should the administrator do to make sure the Nutanix user can no longer SSH to a CVM using a password?
- [ ] Rename the nutanix user.
  > Incorrect, renaming does not prevent SSH access.
- [ ] Block port 22 on the CVM firewall.
  > Incorrect, blocks all SSH access but affects all users.
- [x] Enable Cluster Lockdown.
  > Correct: prevents SSH access for the nutanix user using password.
- [ ] Delete the nutanix user.
  > Incorrect: Not recommended; can cause system issues.

Explain: Enabling Cluster Lockdown ensures the nutanix user cannot SSH using a password.
Teach: The BCM does not need to breach the hull if we leave a password-shaped door open. That alert says a CVM still accepts password SSH. Renaming the nutanix user changes the label on the door, not the lock. Blocking port 22 seals the whole corridor and locks our own engineers out with it. Deleting the account breaks the systems that depend on it. Enable Cluster Lockdown: it disables password-based SSH and forces key-based access only. Keys we control. Passwords they can guess. Shut it down.

### mci-architecture-ia1c
domain: architecture
difficulty: 3
tags: redundancy-factor, rf3, metadata, quorum

Q: How many copies of the metadata are maintained within a Redundancy Factor 3 Nutanix cluster?
- [ ] 2
  > Incorrect, even insufficient for RF2 clusters.
- [ ] 3
  > Incorrect, as RF3 requires more metadata copies, but 3 is number of copies for RF2.
- [x] 5
  > Correct: as RF3 maintains five metadata copies.
- [ ] 7
  > Incorrect: not the default metadata copy count for RF3.

Explain: A Redundancy Factor 3 (RF3) cluster maintains five copies of the metadata. This ensures availability and consistency even if two nodes fail. While the data itself has three copies in RF3, the metadata has five to guarantee quorum and prevent split-brain scenarios.
Teach: The station's core index, the metadata, is how we find every fragment we haul back. Redundancy Factor 3 keeps three copies of the data, and crews assume the index matches. It does not. RF3 maintains five copies of the metadata. Five, so quorum survives two nodes going dark without a split-brain tearing the map in half. Three is the RF2 figure. Carry it into an RF3 build and you are a fragment short exactly when it matters. Say it back: data three, metadata five.

### mci-lifecycle-9037
domain: lifecycle
difficulty: 3
tags: lcm, firmware, bmc, upgrades

Q: Which update in LCM can an administrator apply on a per-node basis?
- [ ] AOS
  > Incorrect: AOS upgrades affect the entire cluster and require cluster-wide consistency.
- [x] BMC
  > Correct: BMC firmware controls remote management and power cycling of individual nodes. Updating BMC does not impact the entire cluster and can be done per node.
- [ ] NCC
  > Incorrect: NCC updates apply across all nodes simultaneously, ensuring uniformity in checks.
- [ ] AHV
  > Incorrect: AHV updates require coordinated upgrades across hosts to maintain VM availability.

Explain: Nutanix LCM allows firmware updates to be applied on a per-node basis. While software updates generally apply to the whole cluster, firmware updates like BIOS or BMC can be applied to individual nodes.
Teach: Not every upgrade lands the same way. Software — AOS, NCC, AHV — rolls out cluster-wide, because every node has to agree or the formation fractures. Firmware is different. BMC governs remote management and power for one node and one node only, so LCM can push it per node without touching the rest of the cluster. When the question is which update applies to a single node, the answer is firmware. Software, cluster-wide. Firmware, per node.

### mci-security-qckx
domain: security
difficulty: 2
tags: prism, session-timeout, iam

Q: What is the default admin session log out time?
- [ ] 5 minutes
  > Incorrect, Too short for default setting
- [ ] 10 minutes
  > Incorrect, default setting is 15 min
- [x] 15 minutes
  > Correct: default session timeout
- [ ] 20 minutes
  > Incorrect: Not the default setting

Explain: The default admin session timeout in Prism is 15 minutes. While the session timeout setting in the UI can be adjusted to longer durations, the IAM token and session cookie still expire after 15 minutes. The UI setting controls how long the UI attempts to keep the session alive by making API calls.
Teach: An idle console is an open console. Prism logs an admin session out after fifteen minutes by default. You can stretch what the interface shows you, but the IAM token and the session cookie still expire at fifteen; the UI is just making calls to look alive. Ten is not the default. Five would be paranoid, twenty wishful. Fifteen. Step away longer than that and you come back to a login prompt, which is exactly what we want if the BCM is watching.

### mci-networking-kg6r
domain: networking
difficulty: 3
tags: prism-element, snmp, switch

Q: When configuring a physical network switch in Prism Element, what information is needed?
- [ ] DNS Configuration
  > Incorrect, Not required when adding a switch.
- [ ] NTP Configuration
  > Incorrect, Useful but not mandatory.
- [ ] SMTP Configuration
  > Incorrect, Not relevant for switch configuration.
- [x] SNMP Configuration
  > Correct, Required for monitoring switch status and metrics.

Explain: To configure a physical network switch in Prism Element, you'll need SNMP information for the switch, including the switch management IP address, SNMP version, security level, community name, authentication type, privacy type (if applicable), and privacy passphrase (if applicable).
Teach: You want Prism Element to see the physical switch, not just the cable running into it. That takes SNMP; it is how the cluster polls the switch for status and metrics. DNS resolves names, NTP keeps clocks honest, SMTP mails alerts — all useful, none of them the thing a switch reports in on. Adding a physical switch in Prism Element means supplying SNMP configuration. Without it the switch is a black box and we are flying the network blind.

### mci-networking-vyuv
domain: networking
difficulty: 2
tags: ntp, time-sync, cluster-config

Q: After deploying a cluster, time is not synchronizing properly. What task needs to be performed on the cluster?
- [ ] DNS configuration
  > Incorrect: DNS is unrelated to time synchronization.
- [x] NTP configuration
  > Correct: NTP is required to synchronize time across the cluster.
- [ ] HA configuration
  > Incorrect: HA does not affect time settings.
- [ ] SMTP configuration
  > Incorrect: SMTP is for email notifications, not time settings.

Explain: NTP (Network Time Protocol) configuration is necessary. After the cluster deployment, ensure that the NTP service is running and configured correctly on each CVM. The cluster should be configured to synchronize with at least three reliable NTP servers for redundancy and accuracy.
Teach: Clocks drifting apart is how a cluster starts lying to itself: logs out of order, certificates rejected, services unable to agree on when now is. If time will not synchronize after deployment, nothing exotic has broken. You skipped NTP. Point the cluster at reliable time sources and configure it. Every node marches to the same clock, or none of them do.

### mci-architecture-5s7u
domain: architecture
difficulty: 3
tags: rf2, node-removal, resiliency

Q: In an RF2 Nutanix cluster, what is the minimum number of nodes required to allow a host removal?
- [ ] 2
  > Incorrect, RF2 requires at least 3 nodes for redundancy.
- [ ] 3
  > Incorrect, Removing a node from a 3-node cluster would break RF2.
- [x] 4
  > Correct: A 4-node cluster can sustain a single-node removal while maintaining RF2.
- [ ] 5
  > Incorrect: RF2 does not require 5 nodes.

Explain: Four nodes are required to remove a host from an RF2 Nutanix cluster. With RF2, two copies of the data exist, ensuring redundancy and fault tolerance. A four-node cluster ensures sufficient resources are available for data replication and availability during the host removal process.
Teach: Removing a host is not just powering it down. The cluster has to keep two copies of everything while it rebuilds what the departing node was holding. In an RF2 cluster that means four nodes minimum before a host removal is allowed — three still standing after the fourth walks out, which is the floor RF2 needs to stay resilient. Try it with three and the data has nowhere to rebuild to. Count the hulls before you pull one out of formation.

### mci-security-128k
domain: security
difficulty: 3
tags: cluster-lockdown, ssh, rsa-key, ahv

Q: An administrator has been tasked with increasing security on a Nutanix cluster by disabling password authentication when accessing the CVM and AHV hosts and instead moving to key-based SSH. What is the easiest way for the administrator to meet these requirements?
- [ ] Configure LDAP authentication through a secure server.
  > Incorrect, LDAP does not affect SSH key authentication.
- [ ] Enable STIG via command line on SSH to CVM.
  > Incorrect, STIG security compliance does not enforce SSH keys.
- [x] Enable Cluster Lockdown and provide an RSA key.
  > Correct: Cluster Lockdown disables password access and enforces SSH key authentication.
- [ ] Restrict access with User Management in Prism.
  > Incorrect: Prism user management does not enforce SSH key authentication.

Explain: To increase security on a Nutanix cluster by disabling password authentication for Controller Virtual Machine (CVM) and AHV hosts and moving to key-based SSH, enabling Cluster Lockdown and providing an RSA key is the recommended approach.1
Teach: Same lock, bigger door. The order is to kill password authentication across the CVMs and the AHV hosts and move to key-based SSH. The easiest path is not a script and not a firewall rule. It is Cluster Lockdown, and you hand it an RSA public key on the way in. Lockdown disables password authentication cluster-wide; the key you provided becomes the only way through. Provide the key first. Enable lockdown without one and you have locked yourself out alongside the BCM.

### mci-vms-nsv5
domain: vms
difficulty: 3
tags: agent-vm, boot-order, ahv

Q: An administrator needs to make sure that a VM is powered on before the rest of the VMs when starting a host. Which configuration option allows this behavior?
- [ ] Recovery Plan
  > Incorrect, Recovery Plans are used for DR but do not control boot order during host startup.
- [ ] Host Affinity
  > Incorrect, Host Affinity controls VM placement but not boot priority.
- [ ] High Availability
  > Incorrect, High Availability ensures VMs restart after a failure but does not define boot order.
- [x] Agent VM
  > Correct, Agent VMs, such as those for security or management, can be prioritized to start before others.

Explain: The configuration option that allows a VM to be powered on before other VMs when starting a host is to configure the VM as an agent VM. This setting ensures that the VM is prioritized during the host's startup sequence and is powered on before other standard VMs. Agent VMs are typically used for essential services, such as providing network functions, that need to be available before other VMs can function correctly.
Teach: Some systems have to be breathing before anything else wakes up — the services the rest of the fleet leans on. Flag that machine as an Agent VM. Agent VMs power on ahead of other VMs when a host starts, and they are not live-migrated during maintenance; they come up first and they stay put. That is the setting you want when a VM must lead the boot order rather than follow it.

### mci-networking-r25q
domain: networking
difficulty: 3
tags: cluster-expansion, ipv6, multicast, discovery

Q: When expanding a Nutanix cluster, what is required to automatically discover new nodes?
- [ ] New nodes must have the same hypervisor version.
  > IIncorrect: While important, it is not required for automatic discovery.
- [x] IPv6 multicast must be allowed on physical switches.
  > Correct: Nutanix does require IPv6 multicast for node discovery.
- [ ] New nodes must have the same AOS version.
  > Incorrect: Required for compatibility but not for discovery.
- [ ] IPv4 multicast must be allowed on physical switches.
  > Incorrect: Nutanix does not uses IPv4 multicast for node discovery.

Explain: IPv6 multicast must be allowed on the physical switches for automatic node discovery during cluster expansion. The Controller Virtual Machine (CVM) initiates the process by sending IPv6 and IPv4 multicast packets on port 5353.
Teach: A new node announces itself before it has any address we gave it. That handshake rides on IPv6 multicast, which is why automatic discovery dies the moment a physical switch blocks it. If you are expanding the cluster and the new nodes never appear, stop interrogating the node and look at the switch. IPv6 multicast must be permitted on the physical switches. Block it and you are adding every node by hand, one at a time, in the dark.

### mci-monitoring-swwi
domain: monitoring
difficulty: 3
tags: capacity-runway, capacity-planning, prism-central

Q: An administrator has been asked to calculate baseline Capacity Runway on a newly registered AHV cluster. The cluster has been up and running for 16 days, but no runway projections are displayed. Why are no Capacity Runway projections being displayed?
- [ ] Capacity Planning requires at least 30 days of data.
  > Incorrect: 30 days is not the minimum requirement.
- [x] Capacity Planning requires at least 21 days of data.
  > Correct: at least 21 days of historical data is required for projections.
- [ ] Capacity Planning requires at least 3 months of data.
  > Incorrect: projections can be generated before 3 months.
- [ ] Capacity Planning requires at least 6 months of data.
  > Incorrect: projections can be generated well before 6 months.

Explain: Capacity Runway projections require at least 21 days of data from a newly registered AHV cluster. Since the cluster has only been running for 16 days, there is insufficient data for the projections to be displayed. Additionally, it takes approximately one day after cluster registration for data to begin appearing in Prism Central
Teach: Sixteen days of telemetry and no runway projection. That is not a fault — that is the system refusing to guess. Capacity Planning needs at least twenty-one days of data before it will project a runway. Less than that and the trend line is noise wearing the costume of a forecast, which is more dangerous than no forecast at all. Give it five more days. We do not plan the station's future on a curve the machine itself will not vouch for.

### mci-monitoring-pvdc
domain: monitoring
difficulty: 3
tags: reserve-capacity, capacity-planning, rf3

Q: An administrator is responsible for resource planning and needs to plan for resiliency of a 10-node RF3 Nutanix cluster. The cluster has 100TB of storage. How should the administrator plan for capacity in the event of future failures?
- [ ] Set Reserve Storage Capacity (%) to 20.
  > Incorrect; does not account for RF3 failure requirements.
- [ ] Set Reserve Capacity for Failure to None.
  > Incorrect; this would leave no reserved space for failures.
- [x] Set Reserve Capacity for Failure to Auto Detect.
  > Correct: auto-detect ensures the cluster accounts for failures dynamically.
- [ ] Set Reserve Memory Capacity (%) to 20.
  > Incorrect: Memory capacity does not impact storage resiliency.

Explain: In an RF3 cluster, using "Auto Detect" ensures that failure reserves are calculated correctly.
Teach: Planning capacity as though nothing will ever fail is how a cluster runs out of room during the failure. Set Reserve Capacity for Failure to Auto Detect. The system then holds back enough CPU, memory, and storage to absorb a node loss and rebuild, sized from the cluster's own configuration instead of a number you guessed at. Ten nodes, RF3, a hundred terabytes: let it do the arithmetic. Reserve first, then plan growth against what is actually left.

### mci-data-protection-1etj
domain: data-protection
difficulty: 4
tags: recovery-plan, ip-mapping, dr, subnet

Q: An administrator is working with a network team to design the network architecture for a Disaster Recovery (DR) failover. Because DNS is well-designed and implemented, DR will utilize a different subnet from production. To make the planning and execution easy to implement, the network team would like to utilize the same last octet in the IP address in DR. What is the best way to achieve this?
- [ ] Use a custom script to update the IP address after instantiation in DR.
  > Incorrect; Works, but is not the best automated solution.
- [ ] Set up IPAM so the address is dynamically assigned during DR.
  > Incorrect; Works, but requires an external system to manage addresses.
- [ ] Manually log into VMs after the DR event and update the last octet.
  > Incorrect; Inefficient and not recommended for automation.
- [x] Utilize Recovery Plan Offset-based IP mapping.
  > Correct; allows automatic IP address adjustment during failover.

Explain: The best way to retain the same last octet in the IP address while using a different subnet during DR failover is to use static IP mapping within the Recovery Plan. While Nutanix often tries to retain the last octet automatically, it's not guaranteed without static mapping.
Teach: Fail over into a different subnet and every machine wakes up with the wrong address. You can hand-map all of them and lose the night, or you can let the Recovery Plan do it. Offset-based IP mapping carries the host portion of each address into the recovery subnet automatically: same host number, new network. DNS is well built on our side, so names keep resolving to the right place. One rule, every VM, no spreadsheet.

### mci-monitoring-vaol
domain: monitoring
difficulty: 3
tags: reports, prism-central, intelligent-operations

Q: A user created a report in the prism central Intelligent Operations Analysis Dashboard but forgot to download it. However, after logging back into Prism Central, the administrator finds that the report is no longer available. What is the most likely cause?
- [ ] A user with Cluster Viewer role deleted the report.
  > Incorrect; cluster Viewer cannot delete reports.
- [ ] The user-generated report was archived.
  > Incorrect; reports are not archived automatically.
- [x] Reports are automatically deleted after 24 hours.
  > Correct: temporary reports are deleted after 24 hours.
- [ ] The report is stored in the cluster’s Prism Element.
  > Incorrect: reports are stored in Prism Central, not Prism Element.

Explain: The most likely reason is that the report was automatically deleted after 24 hours. Reports generated in the Intelligent Operations dashboard are automatically purged after this time. To retain a report, you should download it (in PDF or CSV format) or save it as a report configuration for later use.
Teach: Generate a report and it is not yours until you download it. Prism Central holds a generated report for twenty-four hours and then it is gone. Not archived. Not recoverable. Gone. If you built it and walked away, you build it again. Pull the file down while you are still looking at it.

### mci-performance-i0w8
domain: performance
difficulty: 3
tags: cpu-ready-time, contention, troubleshooting
image: images/ncp-mci-e1-q16.png
image-alt: A VM CPU Ready Time chart in Prism Central showing many overlapping per-VM series (curie_test vmsmall / vmmedium / vmlarge) over a ten-minute window, with a hover tooltip listing individual VMs and readings of 18%, 18.8% and 21.5%.

Q: An administrator receives complaints about VM performance. After reviewing the VM’s CPU Ready Time data shown in the exhibit, which step should the administrator take to diagnose the issue and identify root cause?
- [ ] Check the number of vCPUs assigned to each CVM.
  > Incorrect: CVMs (Controller VMs) have fixed CPU allocation, and modifying their vCPU count is not recommended unless advised by Nutanix Support.
- [x] Review host CPU utilization.
  > Correct: high CPU Ready Time indicates host CPU contention.
- [ ] Assess cluster SSD capacity.
  > Incorrect: SSD capacity impacts storage performance (latency, read/write speeds) but does not affect CPU Ready Time.
- [ ] Enable VM memory oversubscription.
  > Incorrect: Memory oversubscription does not affect CPU contention.

Explain: High CPU Ready Time suggests CPU overcommitment or host saturation. The administrator should check host CPU usage in Prism Central to determine if the cluster is overloaded. If host CPU usage is consistently above 85–90%, VMs are competing for CPU resources, leading to high CPU Ready Time.
Teach: High CPU Ready Time does not mean the VM is working hard. It means the VM is waiting — instructions queued, no physical CPU free to run them. That is contention on the host, not a fault inside the guest. So go look at host CPU utilization. If the hosts are pinned above eighty-five or ninety percent, the VMs are fighting each other for cycles. Do not touch CVM vCPUs, do not blame the SSDs, and do not reach for memory oversubscription. None of them is what is making this VM wait.

### mci-security-n244
domain: security
difficulty: 3
tags: prism-central, iam, active-directory, upgrade

Q: After upgrading Prism Central from PC2022.1 to PC2024.1, an administrator is unable to log in with their IAM active directory domain account. What is the first thing the administrator should do?
- [ ] Ping the Domain Controller from the CVM.
  > Incorrect, Checking network connectivity is useful but not the first step.
- [ ] Ensure port 9441 is open in the firewall.
  > Incorrect, Port 9441 is required for authentication, but other issues may exist.
- [ ] Validate the trusted signing certificate of the organization.
  > Incorrect, Certificate issues can prevent authentication but are not the first check.
- [x] Log in with a local admin account.
  > Correct: Logging in locally allows troubleshooting IAM issues.

Explain: Using a local admin account helps diagnose and fix IAM authentication failures.
Teach: The upgrade landed and your domain account will not authenticate. Do not start rebuilding the directory integration — you cannot even see it from out here. Get inside first. Log in with a local admin account, which does not depend on IAM or the AD connection, and diagnose from there. Recover access, then troubleshoot. Standing outside a locked door theorising about the lock helps nobody.

### mci-monitoring-ayrj
domain: monitoring
difficulty: 4
tags: capacity-runway, capacity-planning, prism-central
image: images/ncp-mci-e1-q19.png
image-alt: Prism Central capacity runway 'New Scenario' view. Overall Runway 59 days, with CPU, Memory and Storage each also 59 days. Target is set to 6 months. An Existing cluster is selected and Capacity configuration is enabled.

Q: Refer to the exhibit. The customer expects to maintain a cluster runway of 9 months. The customer doesn’t have a budget for 6 months, but they want to add new workloads to the existing cluster. Based on the exhibit, what is required to meet the customer's budgetary timeframe?
- [ ] Add resources to the cluster.
  > This is incorrect because the customer explicitly has no budget for the next 6 months to purchase additional hardware.
- [x] Postpone the start of new workloads.
  > Correct: By delaying the addition of new workloads until the 6-month mark (when budget becomes available), the customer can keep the current cluster running within its existing limits and then expand the cluster when they have the funds to do so.
- [ ] Delete workloads running on the cluster
  > Incorrect; While this would increase runway, it is usually a last-resort disruptive action and isn't specified as a preference here.
- [ ] Change the target to 9 months.
  > Incorrect; This is a configuration setting in the tool to see what is needed, but it does not actually solve the capacity shortfall to meet the budget.

Explain: The exhibit shows an Overall Runway of 59 days, which is significantly less than the customer's goal of 9 months. Since the customer has no budget for 6 months, they cannot purchase the additional hardware required to expand the cluster's capacity ("Add resources"). By postponing new workloads, the customer avoids overwhelming the existing resources until they reach the 6-month mark, at which point they can secure a budget to scale the cluster and accommodate the new growth while maintaining their 9-month runway target.
Teach: Read the gauge before you commit. Runway is fifty-nine days across CPU, memory, and storage — nowhere near the nine months command wants. There is no resupply for six months, so bolting on hardware is not an option we have. Deleting live workloads is a scorched-hull last resort. Re-setting the target to nine months changes the readout, not the tank. That leaves the disciplined call: hold the new workloads until the budget lands at month six, then expand. Patience keeps us flying. Loading more weight onto fifty-nine days of fuel strands us in the dark.

### mci-data-protection-nl8n
domain: data-protection
difficulty: 4
tags: protection-policy, storage-container, dr, rpo

Q: A DR administrator has set up a Protection Policy for 50 workloads, all configured similarly in terms of OS, storage, network, and performance. The RPO is 60 minutes with a specified retention of 10 local copies, 5 remote copies, and crash consistency. After configuring the protection policy and activating it, the administrator has noticed that recovery points are not appearing at the DR site yet, everything within the Protection Policy looks correct and recovery points are not showing up on production side. What is the most likely issue?
- [ ] Nutanix Guest Tools (NGT) is not installed on the source VMs.
  > Incorrect, NGT is needed for application-consistent snapshots but not for replication.
- [ ] Windows updates need to be applied to all affected VMs.
  > Incorrect, OS updates do not impact Nutanix replication.
- [x] The storage container name on the DR cluster does not match the production cluster.
  > Correct: If container names do not match, replication will fail.
- [ ] The storage container RF factor does not match in both clusters.
  > Incorrect: RF mismatch affects redundancy, not replication.

Explain: The most likely reason why recovery points are visible on the production side but not at the DR site, despite a correctly configured Protection Policy, is that the storage container name on the DR cluster does not match the production cluster. If a storage container with the same name is not found on the destination cluster, the replicated data will be directed to the SelfServiceContainer. This can lead to recovery points not being readily available in the expected location on the DR site.
Teach: Fifty identical workloads, one policy, and only some of them recover. When the failure is selective but the configuration looks uniform, stop staring at the policy and look underneath it. Nutanix DR needs the storage container name on the recovery cluster to match the source. Where the name does not match, the workload has nowhere to land. Same name, both sides. It is the kind of detail that stays invisible right up until the day you actually need the failover.

### mci-vms-t844
domain: vms
difficulty: 4
tags: memory-overcommit, ahv, capacity
image: images/ncp-mci-e1-q21.png
image-alt: Memory table for Host 1 (128 GB). VM1: 64 GB allocated, 48 GB utilized, 16 GB unutilized. VM2: 32 / 20 / 12. VM3: 32 / 24 / 8. Total: 128 GB allocated, 92 GB utilized, 36 GB unutilized.

Q: An administrator needs to create 2 virtual machines: VM4 and VM5 that leverage the memory over-commit feature. Once VM4 is created and running, the administrator notices that it uses only 28GB of RAM. What will be the maximum RAM that can be allocated to VM5 so that it can be powered on?
- [ ] 4GB
  > Incorrect: remaining 8 GB.
- [x] 8GB
  > Correct: Unutilized memory 36 - 28 = 8 GB
- [ ] 16GB
  > Incorrect: no available unutilized memory.
- [ ] 32GB
  > Incorrect: no available unutilized memory.

Explain: Thehost has 128GB of physical RAM. Thecurrent memory allocationacrossthree VMs (VM1, VM2, VM3) is 128GB, but only92GB is actually utilized. This means there is36GB of unutilized memory available for allocation. VM5 can be allocated up to 8GB of RAM, considering overcommit and available resources the available ememory 36 - 28=8.
Teach: Over-commit lets us promise more memory than we physically hold, and it works because VMs rarely touch everything they are given. So read the table, not the promises. The host has 128 GB. The three running VMs are allocated all 128, but only 92 is actually in use — 36 GB of headroom is genuinely free. VM4 is holding 28 of it. That leaves eight. Eight gigabytes is the ceiling for VM5. Over-commit is generous, not infinite; promise past what the host can truly deliver and something gets swapped, throttled, or killed.

### mci-security-k5ml
domain: security
difficulty: 3
tags: projects, rbac, prism-central, delegation

Q: The team leads of a dev environment want to limit developer access to a specific set of VMs. What is the most efficient way to enable the team leads to directly manage these VMs?
- [ ] Create a role mapping for each team lead and assign appropriately.
  > Incorrect, Role mappings control access but do not limit it to a specific set of VMs efficiently.
- [ ] Create a VPC for each team lead and give them VPC Admin.
  > Incorrect, VPCs are used for network segmentation, not access control for VMs.
- [x] Create a Project for each team lead and assign access.
  > Correct: Projects allow fine-grained control over a specific set of VMs for designated users.
- [ ] Create Security Policies to isolate users.
  > Incorrect: Security policies define network access but do not manage VM access.

Explain: Based on the search results, using projects and roles within Nutanix's access control system seems like the most direct approach for enabling team leads to manage specific VMs in a development environment.
Teach: The team leads want to run their own machines without you standing over them, and you want them nowhere near anyone else's. That is delegation, not permission-by-permission drudgery. Create a Project per team lead and assign access there. The Project scopes exactly which VMs and resources they can touch, and they manage inside it directly. It is the efficient answer because it hands over a bounded sector, not a key to the whole station.

### mci-lifecycle-y6x9
domain: lifecycle
difficulty: 3
tags: lcm, dark-site, bios, firmware

Q: An administrator using a dark site deployment for LCM is attempting to upgrade to the latest BIOS. After completing an inventory scan, the administrator does not see the expected BIOS version available for upgrade. What is the most likely reason the latest BIOS is not shown after inventory?
- [ ] AOS needs to be upgraded first.
  > Incorrect: AOS does not need to be upgraded first for a BIOS update.
- [x] The latest compatibility bundle has not been uploaded.
  > Correct: LCM relies on an offline compatibility bundle to detect and upgrade firmware.
- [ ] The BMC version needs to be upgraded first.
  > Incorrect: The BMC firmware does not always need updating before BIOS updates.
- [ ] The dark site webserver is not accessible.
  > Incorrect: In a dark site deployment, LCM does not rely on an internet connection, so webserver access is not required.

Explain: The most likely reason the latest BIOS version isn't shown in Life Cycle Manager (LCM) after an inventory scan in a dark site deployment is that the latest compatibility bundle has not been uploaded. LCM relies on the compatibility bundle to understand which updates are available. If the bundle isn't up-to-date, the latest BIOS versions won't be displayed for upgrade.
Teach: A dark site has no line home. LCM cannot phone Nutanix for what is available, so it only knows about what you have physically carried in. The inventory scan ran and the BIOS version is missing, which means the parts crate is short: the latest compatibility bundle has not been uploaded. Upload it, re-run inventory, and the upgrade appears. In the dark, nothing arrives that you did not bring yourself.

### mci-monitoring-n1hs
domain: monitoring
difficulty: 3
tags: charts, entity-chart, prism-central

Q: An administrator needs to create a single chart showing multiple storage bandwidth metrics a VM is consuming. Which type of chart should the administrator create?
- [ ] Metric Chart
  > Incorrect: Metric Charts create a chart that tracks a single metric for one or more entities
- [x] Entity Chart
  > Correct: Entity Charts create a chart that tracks one or more metrics for a single entity
- [ ] Hypervisor Performance Chart
  > Incorrect, These focus on hypervisor-level performance, not VM storage bandwidth.
- [ ] VM Summary Chart
  > Incorrect, These summarize VM details but do not focus on specific metrics.

Explain: To create a single chart that shows multiple storage bandwidth metrics for a single virtual machine (VM), an administrator should create an Entity Chart. An Entity Chart is the appropriate choice because it is designed to display various performance metrics for a single selected entity, such as a specific VM. This allows an administrator to correlate different metrics, like read bandwidth, write bandwidth, and total bandwidth, for that one VM on a single graph. Resources
Teach: You want several storage bandwidth metrics for one VM, all on one chart, so the lines can be read against each other. That is an Entity Chart: one entity, multiple metrics, stacked on a single set of axes. Metric charts go the other way — one metric across many entities. Pick the wrong one and you get the right data drawn in a shape that answers a question nobody asked.

### mci-vms-v2m6
domain: vms
difficulty: 2
tags: vm-template, sysprep, cloud-init, guest-customization

Q: What guest customization options are available when creating a VM template?
- [x] Sysprep, Cloud-init
  > Correct: These are standard guest customization options in Nutanix.
- [ ] Bash, Powershell
  > Incorrect: These are scripting languages but not specifically guest customization options.
- [ ] Python, YAML
  > Incorrect, These are used in automation but are not Nutanix guest customization options.
- [ ] Custom Script, Guided Script
  > Incorrect, Guest customization using Sysprep for windows, and Cloud-init for linux

Explain: Sysprep (for Windows), cloud-init (for Linux), custom scripts, and guided scripts are all guest customization options available when creating a VM template.
Teach: A template is a mould, and a mould that stamps out identical machines — same hostname, same identity — causes chaos the moment two of them meet on the network. Guest customization is how each casting comes out unique. On Windows that is Sysprep. On Linux it is Cloud-init. Those are your two options when you build a VM template, and between them they cover the fleet.

### mci-vms-1b6i
domain: vms
difficulty: 3
tags: high-availability, ha-reservation, prism-element

Q: An administrator wants to make sure that VMs can be migrated and restarted on another node in the event of a single-host failure. What action should be taken in Prism Element to meet this requirement?
- [ ] Set Redundancy Factor to 3.
  > Incorrect, RF3 increases data redundancy but does not ensure VM failover.
- [ ] Configure an RF1 storage container.
  > Incorrect, RF1 has no redundancy, making it unsuitable.
- [ ] Configure a Protection Domain.
  > Incorrect, Protection Domains provide backup and recovery but do not ensure VM failover.
- [x] Enable HA Reservation.
  > Correct, HA Reservation ensures VMs can restart on another node in case of a failure.

Explain: To ensure that VMs can be migrated and restarted on another node in the event of a single-host failure, enable High Availability (HA) in Prism Element. HA reserves a portion of cluster resources to restart VMs on surviving nodes if a host fails.
Teach: A host dies. Where do its VMs go? Nowhere, unless somebody set aside room for them in advance. Enable HA Reservation in Prism Element and the cluster holds back enough resources on the surviving nodes to restart the casualties. Redundancy Factor protects the data, not the running machines. A Protection Domain is for recovering elsewhere later. Neither one restarts a VM tonight. HA Reservation does.

### mci-security-umfh
domain: security
difficulty: 3
tags: credential-guard, uefi, secure-boot, windows

Q: An administrator wants to enable Windows Defender Credential Guard to comply with company policy. The new VM configurations include: • Legacy BIOS • 4 vCPUs • 8 GB RAM • Windows Server 2019 What must be changed in order to properly enable Windows Defender Credential Guard?
- [ ] Update Memory to 16GB.
  > Incorrect, More memory does not enable Credential Guard.
- [ ] Use Windows Server 2022.
  > Incorrect, Credential Guard is supported on Windows Server 2019 as well.
- [x] Enable UEFI with Secure Boot.
  > Correct: Credential Guard requires UEFI with Secure Boot.
- [ ] Update vCPU to 8.
  > Incorrect: More vCPUs do not affect Credential Guard.

Explain: Windows Defender Credential Guard requires UEFI with Secure Boot enabled.
Teach: Credential Guard protects secrets inside a hardware-backed vault, and a vault needs a foundation it can trust from the first instruction. Legacy BIOS cannot give it one. Enable UEFI with Secure Boot: Secure Boot establishes the verified boot chain that Credential Guard's virtualization-based security depends on. The vCPUs and the RAM in that spec are fine. The firmware mode is the thing standing in your way.

### mci-security-cxm0
domain: security
difficulty: 4
tags: data-in-transit-encryption, ports, firewall, prism-central

Q: An administrator attempted to enable Data-in-Transit Encryption on a Scale-Out Prism Central cluster to encrypt service-level traffic between nodes. However, the feature did not work correctly due to a firewall restriction. Which CVM-specific port should be allowed through the firewall for Data-in-Transit Encryption?
- [x] 2009
  > Correct: port to allow for Data-in-Transit Encryption on a Scale-Out Prism Central cluster is 2009
- [ ] 9440
  > Incorrect: Used for Prism Central UI access.
- [ ] 2010
  > Incorrect, Not related to Data-in-Transit Encryption.
- [ ] 2020
  > Incorrect, Port 2009, not 2020, is used for data-in-transit encryption within a Nutanix cluster.

Explain: The correct port to allow for Data-in-Transit Encryption on a Scale-Out Prism Central cluster is 2009. The Nutanix Security Guide v7.0 states that you should "ensure that you allow port 2009, which is used for Data-in-Transit Encryption." This document also notes that Data-in-Transit Encryption encrypts service-level traffic between cluster nodes.
Teach: Data-in-Transit Encryption protects the service-level traffic running between cluster nodes — exactly the traffic the BCM would most like to sit and listen to. It cannot establish that if a firewall is standing in the path. The CVM port to open is 2009. Not 9440, that is the Prism interface. Open 2009 and the encrypted channel forms; leave it shut and the feature configures cleanly and then does nothing at all.

### mci-architecture-n2hp
domain: architecture
difficulty: 3
tags: prism-central, fqdn, scale-out, load-balancing
image: images/ncp-mci-e1-q30.png
image-alt: Prism Central 'Cluster Details' dialog. Text reads: Virtual IP and FQDN are used to access the PC VM Cluster. Fields for Cluster Name (Unnamed), FQDN, and Virtual IP, with a note that Virtual IP is relevant for a multi-VM Prism Central.

Q: In a scale-out Prism Central deployment, what additional functionality does configuring an FQDN instead of a Virtual IP provide?
- [x] Load balancing
  > Correct: because it ensures that requests are distributed among multiple Prism Central nodes, improving performance and redundancy.
- [ ] Resiliency
  > Incorrect: because resiliency is achieved through HA and replication, not through FQDN configuration.
- [ ] Segmentation
  > Incorrect, because network segmentation is handled at the VLAN or security policy level.
- [ ] SSL Certificate
  > Incorrect, because SSL certificates can be applied regardless of whether FQDN or Virtual IP is used.

Explain: When using FQDN instead of a Virtual IP in a scale-out Prism Central deployment, Nutanix enables load balancing across multiple Prism Central instances.
Teach: A Virtual IP gives a scale-out Prism Central one address to answer on — a single door into a building with several rooms. An FQDN does more than name the door. Configure the FQDN instead and Nutanix load balances requests across the Prism Central instances, spreading the work instead of funnelling it. Not segmentation, not certificates. Load balancing. That is the functionality you gain.

### mci-storage-pjdh
domain: storage
difficulty: 3
tags: storage-policy, categories, volume-group

Q: How can a VM or Volume Group (VG) be associated with a Storage Policy?
- [ ] Assign the Storage Policy directly on the VM or VG.
  > Incorrect, as policies apply to categories.
- [ ] Assign the VM or VG directly to the Storage Policy.
  > Incorrect, Storage Policies apply to categories, not directly to VMs/VGs.
- [ ] Migrate the VM or VG to the Storage Container assigned to the Storage Policy.
  > Incorrect, Not a valid method to apply a storage policy.
- [x] Assign the VM or VG to the same Category as the Storage Policy.
  > Correct, Storage policies are applied at the category level.

Explain: A VM or Volume Group (VG) can be associated with a Storage Policy using categories. Storage Policies are applied to VMs and VGs via categories using the Kanon service, which applies/fixes up policies every 30 minutes. A default Storage Policy can be selected during VM/VG creation
Teach: You do not bolt a Storage Policy onto a machine by hand — that does not scale past the first dozen. You describe the machine, and the policy finds it. Assign the VM or Volume Group to the same Category the Storage Policy targets, and the association happens by itself. Categories are the labels; policies act on the labels. Label the cargo correctly and the rules apply themselves.

### mci-architecture-5hhg
domain: architecture
difficulty: 4
tags: intermixed-hardware, cluster-expansion, ssd

Q: An administrator is managing a 4-node Nutanix cluster, based on intermixed hardware as follows: • Two G5 Nodes # 2 CPUs (12 cores), 1 SSD (1.92 TB), 2 HDDs (4 TB). • Two G7 Nodes # 2 CPUs (16 cores), 2 SSDs (1.92 TB), 4 HDDs (4 TB). G5 Nodes are going out of support and need to be replaced, this cluster will be decommissioned from production and used for Disaster Recovery purposes with an RPO of 1 hour. What is the supported configuration when swapping G5 nodes without impacting performance?
- [x] New node must have at least 2 SSDs.
  > Correct: Since the G7 nodes have two SSDs, replacing G5 nodes with at least 2 SSDs ensures consistent SSD cache and performance.
- [ ] New node must be G7 or G8.
  > Incorrect: G7 or G8 nodes may help, but storage performance is more critical for DR.
- [ ] New node must have 2 CPUs with 12 cores.
  > Incorrect, CPU core count does not impact DR storage performance as much as SSD capacity.
- [ ] New node must be hybrid.
  > Incorrect, Hybrid nodes are already in use, but SSDs must match for performance balance.

Explain: For optimal Disaster Recovery performance, new nodes must match or exceed the storage performance of existing nodes View sources
Teach: Mixed hardware in one cluster is allowed, but the newcomer cannot drag the formation backwards. Two G5s with a single SSD each, two G7s with two — the cluster's storage tier is built on what the nodes bring. A node joining this cluster must have at least two SSDs to match the tier it is entering. Cores and spindles matter less here than the flash. Bring fewer SSDs and you are not reinforcing the formation, you are slowing it down.

### mci-networking-qa99
domain: networking
difficulty: 4
tags: virtio, multi-queue, rss, ahv

Q: Due to application requirements, an administrator needs to modify an AHV VM to support a large number of distinct, concurrent network connections. The VM has below configuration: • 4 vCPUs • 20 GB RAM • OS: Microsoft Windows Server 2022 Which modification can improve network performance for network I/O-intensive applications running on this VM?
- [ ] Add more vCPUs
  > Incorrect: Adding more vCPUs can improve CPU-bound tasks but does not directly optimize network performance.
- [ ] Enable AHV Turbo Technology
  > Incorrect: AHV Turbo improves disk performance, not network performance.
- [x] Enable RSS VirtIO-Net Multi-Queue
  > Correct: RSS (Receive Side Scaling) VirtIO-Net Multi-Queue enhances network performance by distributing network traffic across multiple vCPUs.
- [ ] Add more RAM
  > Incorrect: Increasing RAM helps memory-intensive applications but does not improve network I/O.

Explain: Enabling RSS VirtIO-Net Multi-Queue optimizes network performance by allowing multiple CPU cores to process network packets in parallel, reducing bottlenecks for network I/O-intensive workloads.
Teach: A single network queue means a single vCPU doing all the packet work, and that one core saturates long before the wire does. Huge numbers of concurrent connections need the load spread. Enable RSS with VirtIO-Net Multi-Queue: receive-side scaling hands the queues out across multiple vCPUs so the VM can process traffic in parallel. More RAM will not fix a bottleneck that is only one core wide.

### mci-monitoring-afoc
domain: monitoring
difficulty: 3
tags: syslog, severity, audit

Q: A consultant is configuring syslog monitoring and wants to receive CRITICAL logs from the Audit module. Which severity level setting should be configured to get the desired output?
- [ ] 0
  > Incorrect: Represents emergency logs.
- [x] 2
  > Correct: Represents critical logs.
- [ ] 5
  > Incorrect: Represents notice-level logs.
- [ ] 7
  > Incorrect: Represents debug-level logs.

Explain: The correct severity level to receive CRITICAL logs from the Audit module is 2. This corresponds to the Critical severity level in syslog. While other modules like SYSLOG_MODULE might require different configurations or log to different locations, for the Audit module itself, selecting level 2 will filter for Critical logs
Teach: Syslog severity counts downward: the lower the number, the louder the alarm. Zero is emergency, one is alert, two is critical. You want CRITICAL logs out of the Audit module, so you set severity level 2. Set it to 0 and you hear only the end of the world. Set it to 5 or 7 and you drown in routine chatter — and a signal you cannot hear over the noise is the same as no signal at all.

### mci-storage-yyq7
domain: storage
difficulty: 3
tags: erasure-coding, rf2, node-count

Q: An administrator is configuring Erasure Coding on a Redundancy Factor 2 Nutanix cluster. How many nodes, at a minimum, are necessary?
- [ ] 3
  > Incorrect: RF2 requires a minimum of three nodes but does not support Erasure Coding.
- [x] 4
  > Correct: Erasure Coding requires at least four nodes but is not optimal but in the question ask about minimum so answer is 4.
- [ ] 5
  > Incorrect: This is the optimal required for effective Erasure Coding.
- [ ] 6
  > Incorrect: Larger clusters improve resilience, but the minimum is four.

Explain: An administrator needs four nodes at a minimum to configure Erasure Coding on a Redundancy Factor 2 cluster. A six-node cluster with RF2 uses a stripe size of five, with four nodes for data and one for parity. The sixth node ensures availability for rebuild in case of node failure.
Teach: Erasure coding buys back capacity by storing parity instead of a whole second copy, but parity needs somewhere to live that is not with the data it protects. On an RF2 cluster the minimum is four nodes: enough distinct failure domains to hold the strip and its parity apart. Fewer than four and there is no honest way to spread it. Four nodes, RF2. That is the floor.

### mci-lifecycle-2ued
domain: lifecycle
difficulty: 3
tags: lcm, gpu, drivers, direct-upload

Q: An administrator needs to perform an LCM upgrade on an AHV host with GPUs. What additional step is required for LCM to upgrade an AHV host that has GPUs?
- [ ] Create an agent VM on each host that has GPU drivers installed.
  > Incorrect: Agent VMs are not required for GPU updates.
- [ ] Run LCM in dark site mode so it can update AHV independently.
  > Incorrect: Dark site mode is used when internet access is unavailable but does not affect GPU upgrades.
- [x] Use Direct Uploads to upload appropriate driver bundles.
  > Correct: LCM does not automatically fetch GPU drivers. The administrator must download and manually upload the appropriate firmware bundle before upgrading.
- [ ] Update NCC to the latest version and re-run Inventory.
  > Incorrect: Updating NCC is a best practice but does not resolve GPU driver issues.

Explain: Before initiating the LCM upgrade on an AHV host with GPUs, upload the relevant NVIDIA vGPU AHV host driver bundle to the "Direct Uploads" section within Nutanix LCM. This ensures the correct driver is available during the upgrade process.
Teach: A GPU host is not a standard host, and LCM will not conjure the driver bundle it needs out of the void. Use Direct Uploads to supply the appropriate driver bundles before the upgrade, and LCM can then take the host through cleanly. Skip it and the upgrade stalls on the one node you least wanted to be arguing with.

### mci-monitoring-81m5
domain: monitoring
difficulty: 4
tags: memory-runway, oversubscription, intelligent-operations
image: images/ncp-mci-e1-q37.png
image-alt: Memory cluster runway chart over 365 days. A dotted line labelled 'Effective Capacity (503.22 GiB)' slopes gently downward across the chart, above a solid blue consumption area that steps up sharply at 'TODAY'. Y-axis runs 0.00 GiB to 651.93 GiB.

Q: An administrator is looking at the memory cluster runway diagram, as shown in the exhibit. The environment is based on three hosts with the following configuration: • CPU: 2x Intel Xeon Gold (8 cores, 2.6 GHz) • RAM: 256 GB per host • Storage: SSDs and HDDs The Prism Central Intelligent Operations feature has been active for one month, but no further configurations were applied. What does the dotted red line mean?
- [ ] It is the default trend analysis static threshold that can be manually set.
  > Incorrect: Admins can manually configure thresholds, but this is not the meaning of the red line.
- [ ] It is the maximum memory the administrator can assign to VMs.
  > Incorrect: Memory allocation limits are set based on available resources, not the red line.
- [x] It is the calculated memory oversubscription limit for currently running VMs.
  > Correct: The dotted red line represents projected memory exhaustion based on trends.
- [ ] It is the usable capacity based on cluster configuration options.
  > Incorrect: Usable capacity is shown differently in Prism.

Explain: The dotted red line in the Prism Central memory cluster runway diagram represents the calculated memory oversubscription limit for the currently running VMs. This dotted red line is not a static threshold.
Teach: That dotted red line on the memory runway is not a threshold somebody typed in, and it is not the usable capacity of the hardware. It is calculated: the memory oversubscription limit for the VMs currently running. It moves as the workload moves, because it is derived from the workload. Read it as a live ceiling, not a fence, and never mistake it for a number you are free to set yourself.

### mci-architecture-8csw
domain: architecture
difficulty: 3
tags: redundancy-factor, rf3, node-count

Q: An administrator wants to change a cluster from Redundancy Factor 2 to 3, but it is not allowed. What must the administrator check?
- [ ] Check that the cluster has been properly licensed.
  > Incorrect: Licensing does not affect RF settings.
- [x] Check that the cluster has five or more nodes.
  > Correct: RF3 requires a minimum of five nodes.
- [ ] Check hardware availability of the nodes.
  > Incorrect: Hardware availability does not restrict RF changes.
- [ ] Check AOS version and upgrade, if needed.
  > Incorrect: AOS version must support RF3, but the main factor is node count.

Explain: The administrator should check that the cluster has five or more nodes. A minimum of five nodes per cluster is required for Redundancy Factor 3 (RF3).
Teach: The cluster is refusing to go from Redundancy Factor 2 to 3, and it is right to refuse. RF3 keeps a third copy of the data and five copies of the metadata, and that needs enough independent nodes to hold them apart. The floor is five nodes. Count them. If you have four, the answer is not to argue with the cluster — it is to add hardware.

### mci-storage-zbae
domain: storage
difficulty: 3
tags: storage-container, reserved-capacity, advertised-capacity

Q: Which storage container option reduces the available storage to other containers?
- [ ] Advertised Capacity
  > Incorrect: This sets a soft quota but does not reduce actual storage.
- [ ] Erasure Coding
  > Incorrect: Erasure coding optimizes storage but does not restrict other containers.
- [ ] Capacity Deduplication
  > Incorrect: Deduplication optimizes space but does not reserve storage.
- [x] Reserved Capacity
  > Correct: Ensures a fixed amount of storage is allocated, reducing availability for other containers.

Explain: Reserving capacity for a storage container or setting an advertised capacity limits the available storage to other containers within the same storage pool. By default, all containers share the unused space in a pool. However, with reservations or advertised capacity, a specific amount of storage is allocated to a particular container and becomes unavailable for other containers to utilize.
Teach: Reserved Capacity is a claim staked on the storage pool. Set it on a container and that space is fenced off for that container alone — which means it is taken away from everyone else, whether or not it is ever used. That is the option that shrinks what the other containers can see. Reserve deliberately. Every gigabyte you promise to one container is a gigabyte the rest of the station cannot touch.

### mci-monitoring-jtk8
domain: monitoring
difficulty: 2
tags: log-collection, ncc, support, prism-element

Q: An administrator wants to collect log files that have been requested by Nutanix Support team. From which Prism Element dashboard can this be accomplished?
- [ ] Settings
  > Incorrect: Used for general system configurations, not log collection.
- [ ] Alerts
  > Incorrect: Displays system alerts but does not collect logs.
- [x] Health
  > Correct: The Health dashboard provides an option to generate and download log bundles.
- [ ] Analysis
  > Incorrect: Provides insights but does not collect logs.

Explain: An administrator can collect log files requested by Nutanix Support from the Prism Element dashboard by navigating to the Health page and selecting Actions → Collect Logs. This process utilizes the Logbay utility, which allows for flexible log collection and can be further customized from the command line interface (CLI). Within the Collect Logs section of the Prism Element dashboard, you can specify the nodes and tags for targeted log collection, define the duration of logs to collect, and select the destination for the collected logs.
Teach: Support is asking for logs and the clock is running. In Prism Element, log collection lives on the Health dashboard — the same place the cluster reports how it feels, which is exactly where you would look if you thought about it for a second. Not Settings, not the VM view. Health. Gather the bundle, hand it over, and let them work.

### mci-lifecycle-oayz
domain: lifecycle
difficulty: 3
tags: maintenance-mode, alerts, resources

Q: An administrator receives an alert: "A node cannot enter maintenance mode." What could be the cause of this alert?
- [x] Other nodes in the cluster may not have enough resources available.
  > Correct: Insufficient resources prevent nodes from entering maintenance mode.
- [ ] Another node in this cluster is already in maintenance mode.
  > Incorrect: Clusters allow only one node at a time in maintenance mode, but this is not the cause of this alert.
- [ ] This node in the cluster is already in maintenance mode.
  > Incorrect: If a node was already in maintenance mode, this alert would not appear.
- [ ] This node in the cluster may not have enough resources available.
  > Incorrect: Resource availability may affect VM migrations, but maintenance mode is restricted by existing maintenance sessions.

Explain: The most likely cause for a node failing to enter maintenance mode is that the cluster is in a critical High Availability (HA) state. When HA is critical, it means there aren't enough resources available to restart VMs on other nodes if the node entering maintenance mode fails.
Teach: A node cannot enter maintenance mode, and the reason is almost never the node itself. Maintenance mode means evacuating the VMs to somewhere else in the cluster. If the surviving nodes do not have the CPU and memory free to take them, there is nowhere to evacuate to, and the cluster stops rather than dropping workloads on the floor. That refusal is the cluster protecting you. Make room, then try again.

### mci-vms-plrh
domain: vms
difficulty: 3
tags: agent-vm, migration, lcm, maintenance-mode

Q: An administrator is conducting LCM updates in a Nutanix cluster and is being prompted for handling non-migratable VMs. Which VM type is non-migratable?
- [ ] VMs without NGT
  > Incorrect: Nutanix Guest Tools (NGT) are used for guest-level integration but do not affect VM migratability.
- [x] VMs marked as an Agent
  > Correct: Agent VMs are system-critical and cannot be migrated.
- [ ] Memory Overcommitted
  > Incorrect: While memory overcommitment can affect performance, it does not make VMs non-migratable. Nutanix AHV handles memory allocation dynamically.
- [ ] VMs with attached Volume Groups
  > Incorrect: as the iSCSI connections used by Volume Groups directed to the data services IP, so VMs with VG can be migrated seamlessly.

Explain: Agent VMs are indeed non-migratable. Other non-migratable VM types include those with CPU passthrough, GPU passthrough, PCI passthrough, and VMs with host affinity policies configured. During host maintenance, these VMs are typically shut down and powered back on after the maintenance is complete.
Teach: The upgrade is asking what to do with the VMs it cannot move. Agent VMs are the ones it means. They are pinned to their host by design — that is the whole point of the flag — so they will not live-migrate away during an LCM update, and the cluster has to power them off instead. Know which of your machines are Agents before you start an upgrade, not while it is waiting on you.

### mci-storage-53h7
domain: storage
difficulty: 3
tags: deduplication, full-clone, efficiency

Q: When is deduplication recommended?
- [ ] Server workloads
  > Incorrect: Deduplication is not highly beneficial for server workloads as they often have unique data.
- [ ] Linked Clone VMs
  > Incorrect: Linked clones share data blocks, making deduplication efficient.
- [x] Full clone VMs
  > Correct: Full clones have identical data blocks, benefiting from deduplication.
- [ ] Cold data
  > Incorrect: Deduplication is typically used for active data rather than cold storage.

Explain: Nutanix recommends enabling deduplication for full clone VMs, persistent desktops, and P2V. VDI workloads using full clones also benefit from deduplication. Server workloads, linked clone VMs, and VAAI clones generally see less benefit. It's not recommended for instant clones or data that is accessed infrequently (cold data).
Teach: Deduplication earns its overhead only when there is genuine duplication to find. Full clone VMs are the textbook case: each clone carries its own complete copy of an almost identical image, so the redundancy is enormous and dedup collapses it. Data that is already unique gains nothing and still pays the CPU and memory cost of being hashed. Deduplicate where things are copies. Everywhere else, it is a tax.

### mci-vms-aanz
domain: vms
difficulty: 2
tags: images, iso, prism-central

Q: Within Prism Central, which Compute and Storage section will allow an administrator to upload a Windows ISO file?
- [ ] Catalog Items
  > Incorrect: as this is used to manage preconfigured application templates.
- [ ] Templates
  > Incorrect: Used for VM templates, not for storing ISO files.
- [x] Images
  > Correct: as it allows uploading and managing ISO and disk images.
- [ ] OVAs
  > Incorrect: as this pertains to importing virtual appliances, not ISO files.

Explain: The section within Prism Central where an administrator can upload a Windows ISO file is called "Image Configuration," found under the "Compute and Storage" section. This area allows for uploading ISO files, which are then used for creating virtual machines. The process typically involves selecting "Upload Image," filling in the required information (such as name and description), and choosing the source ISO file to upload.
Teach: You have a Windows ISO and you need it where the cluster can build from it. In Prism Central, under Compute and Storage, that is the Images section. Images is the armoury: ISOs and disk images land there once and every VM you create afterwards can draw from them. Upload it there and it is available fleet-wide.

### mci-vms-vzb8
domain: vms
difficulty: 2
tags: vm-template, power-state

Q: An administrator needs to create a VM Template from an existing VM. What is required for this action to be successful?
- [ ] Sysprep or Cloud-init script.
  > Incorrect: Helps with VM customization but is not required for template creation.
- [ ] The VM is powered on.
  > Incorrect: as a template cannot be created while the VM is running.
- [ ] Windows OS is installed.
  > Incorrect: Not required; a template can be created from any VM state.
- [x] The VM is powered off.
  > Correct: Required to create a template successfully.

Explain: To successfully create a VM template from an existing VM, the source VM must be powered off. Once powered off, you can initiate the template creation process. A template name and, optionally, a description are required when creating the template. You can customize the guest OS settings, and choose whether users can override these settings during VM deployments. Once created, the template metadata is stored in Prism Central, with the data itself stored as a VM recovery point on the same cluster as the source VM. The original VM remains, and can be powered back on at any time.
Teach: You cannot take a clean cast of a machine that is still moving. Creating a VM Template from an existing VM requires that VM to be powered off — a running machine has memory in flight and disks mid-write, and a template taken from that is a template of a moment that never quite existed. Shut it down, then take the mould.

### mci-monitoring-cxg9
domain: monitoring
difficulty: 3
tags: ncc, health-checks, prism-element

Q: An administrator has spent time correcting specific issues that have been identified by NCC Health Checks in Prism Element (PE). How can just the checks that previously did not pass be executed again to confirm they are all resolved?
- [ ] Run LCM Pre-Upgrade to trigger NCC Checks.
  > Incorrect: Triggers checks but includes all, not just failed ones.
- [ ] Run ncc health checks run_all.
  > Incorrect: Runs all checks, not just failed ones.
- [ ] Select Run Check for each check worked.
  > Incorrect: Can be done manually but is inefficient.
- [x] Select Only Failed And Warning Checks.
  > Correct: The correct option, as it reruns only failed and warning checks.

Explain: Running only failed and warning checks helps verify issue resolution efficiently.
Teach: You have spent the shift fixing what the health checks flagged. Do not now re-run the entire battery and wait for the ones that were already green. Select Only Failed And Warning Checks and NCC re-runs precisely the checks that did not pass, so you get your confirmation in a fraction of the time. Verify the repair, not the whole hull.

### mci-storage-01sr
domain: storage
difficulty: 2
tags: oplog, write-path, extent-store

Q: What is the purpose of the OpLog?
- [x] Persistent write buffer
  > Correct: The correct option, as OpLog is used for storing incoming writes before committing them to storage.
- [ ] Persistent data storage
  > Incorrect: OpLog is not a long-term storage mechanism.
- [ ] Global metadata
  > Incorrect: OpLog does not store metadata, it handles write operations.
- [ ] Dynamic read cache
  > Incorrect: OpLog is primarily for writes, not read caching.

Explain: The OpLog (Operational Log) in Nutanix serves as apersistent write bufferfor incoming I/O operations. It temporarily stores write requests to ensure fast acknowledgment to clients and better performance. The data is later coalesced and written to the Extent Store for long-term storage.
Teach: Every write we take has to be safe before we can acknowledge it, and it has to be fast or the whole station stalls. The OpLog is how we get both: a persistent write buffer on flash. Writes land there, are coalesced, and are later drained down into the Extent Store, which is the durable capacity tier. The OpLog is not the tier itself. It is the landing pad in front of it.

### mci-performance-s11q
domain: performance
difficulty: 3
tags: ssd, storage-pool, latency, tiering

Q: An administrator observes an alert in Prism for a hybrid SSD/HDD cluster: 1 "Storage Pool SSD utilization consistently above 75%." What is the potential impact of this condition?
- [ ] The cluster is unable to sustain an SSD disk failure.
  > Incorrect: SSD failures are managed via redundancy policies (RF2/RF3), and high utilization does not impact failure handling
- [ ] The cluster may be nearly out of storage for metadata.
  > Incorrect: Metadata is stored separately, and high SSD usage does not mean metadata is at risk.
- [ ] The cluster is at risk of entering a read-only state.
  > Incorrect: Clusters do not go into read-only mode due to high SSD utilization---they simply experience performance degradation
- [x] Average I/O latency in the cluster may increase.
  > Correct: High SSD utilization can slow performance.

Explain: High SSD utilization in a hybrid cluster can lead to increased I/O latency as new writes may spill over to HDDs, reducing overall performance. If SSD usage is above 75%, data tiering shifts to slower HDDs, increasing latency.
Teach: SSD utilization holding above seventy-five percent is a warning about speed, not about running out of room. The hot tier is where the working set lives; when it is that full, there is less space to absorb incoming writes and more data gets pushed down to spinning disk. The consequence is felt everywhere at once: average I/O latency across the cluster starts to climb. It is not a capacity alarm. It is a performance one.

### mci-data-protection-idch
domain: data-protection
difficulty: 4
tags: metro-availability, protection-domain, rpo, dr

Q: A company is evaluating Nutanix DR to protect some business-critical applications and tasked an administrator to find an optimal configuration providing highest resiliency and lowest RPO to the production environment. The company's production environment is deployed on two physical sites with each hosting one AHV-based cluster. What configuration will meet the company's requirements?
- [ ] Deploy Prism Central instance on one of the sites. Configure NearSync replication using Protection Domains.
  > Incorrect: NearSync replication provides low RPO but may not offer the highest resiliency.
- [ ] Deploy one Prism Central instance on each site and configure synchronous replication using Protection Policy.
  > Incorrect: Synchronous replication provides the highest resiliency and lowest RPO.
- [ ] Deploy Prism Central instance on one of the sites, configure Prism Central Disaster Recovery, and setup Metro AHV.
  > Incorrect: This option provides good resiliency but may not offer the lowest RPO.
- [x] Deploy Prism Central instance on each site. Configure Metro Availability using Protection Domains.
  > Correct: Metro Availability provides high resiliency and low RPO.

Explain: Metro Availability offers the lowest RPO (zero) and highest resiliency: Metro Availability, leveraging synchronous replication, ensures zero data loss and near-zero RTO in a failover scenario. This is the best option for business-critical applications requiring continuous availability. Since the company has two sites, placing Prism Central on each site provides management redundancy. Protection Domains can also be used as part of this Configuration: Setting up Protection Domains within the Metro Availability configuration enhances disaster recovery capabilities, providing options for granular VM protection and orchestration for less critical applications. These would likely be configured with NearSync replication within the same Prism Central instance. Other options are suboptimal: the single-site NearSync configuration and the synchronous-replication Protection Policy are not ideal because NearSync and synchronous replication alone don't offer the automatic failover and near-zero RTO provided by Metro Availability. The Prism Central Disaster Recovery + Metro AHV configuration is incorrect because the company has two clusters (one in each site); this would imply that there's a dedicated site for DR which the question does not support.
Teach: Highest resiliency and the lowest possible RPO is a demanding pair of words. Asynchronous replication cannot give it to you: there is always a gap between the last snapshot and the failure. Metro Availability closes that gap by keeping the two sites synchronously in step, so the RPO approaches zero. Deploy a Prism Central instance at each site and configure Metro Availability using Protection Domains. Lowest RPO means synchronous. Everything else is a compromise dressed up as a plan.

### mci-monitoring-0hjk
domain: monitoring
difficulty: 3
tags: bully-vms, intelligent-operations, contention

Q: Which predefined view should be leveraged in Prism Central Intelligent Operations to determine which VM is consuming too many resources and causing other VMs to starve?
- [ ] Constrained VMs List
  > Incorrect: This view shows VMs that are constrained by resource limits.
- [x] Bully VMs List
  > Correct: This view shows VMs that are consuming excessive resources and causing other VMs to starve.
- [ ] Inactive VMs List
  > Incorrect: This view shows VMs that are inactive and not consuming resources.
- [ ] Overprovisioned VMs List
  > Incorrect: This view shows VMs that are overprovisioned with resources.

Explain: The "Bully VMs List" in Prism Central Intelligent Operations (formerly called AIOps) specifically identifies VMs consuming excessive resources and impacting the performance of other VMs by "stealing" resources from them. While other options might provide insights into resource usage, they do not directly address the issue of one VM negatively affecting others.
Teach: One machine is eating the cluster and the rest are starving in its wake. Prism Central has a predefined view for exactly that offender: the Bully VMs list. It surfaces the VMs whose resource consumption is degrading everyone around them, so you are not hunting through charts trying to catch the culprit by hand. Find the bully first. Everything downstream of it is a symptom.

### mci-data-protection-44k8
domain: data-protection
difficulty: 3
tags: categories, recovery-plan, dr, boot-order

Q: An administrator has been tasked by the company's leadership to justify and explain the decision to utilize the new Nutanix Disaster Recovery solution. The environment contains: • 100 workloads • Workloads have varying boot orders • Workloads span multiple subnets • Workloads span across different business units How should the administrator most efficiently organize and manage the workloads?
- [x] Utilize Categories to organize VMs in Recovery Plans.
  > Correct: Categories help organize VMs efficiently.
- [ ] Utilize RESTful APIs to script creation of Recovery Plans.
  > Incorrect: While APIs offer automation capabilities, they don't inherently provide organizational structure. You would still need a method for grouping VMs logically within the Recovery Plans created by the scripts.
- [ ] Utilize a 1:10 ratio of Recovery-Plan to VMs.
  > Incorrect: This might be a workable approach, but it doesn't directly address the organizational challenges presented by boot orders, subnets, and business units. It could lead to unnecessary complexity with a large number of Recovery Plans.
- [ ] Utilize a VM naming schema that allows sorting.
  > Incorrect: A good naming schema is helpful, but it doesn't replace the need for grouping and orchestrating VMs within Recovery Plans based on dependencies and business requirements. Sorting alone won't manage boot orders or subnet dependencies during recovery.

Explain: Utilizing Categories to organize VMs in Recovery Plans is the most efficient method. Categories are designed specifically for grouping VMs logically within Recovery Plans. They allow the administrator to manage workloads based on boot order, subnet, business unit or any other criteria relevant to disaster recovery. This approach simplifies recovery orchestration significantly compared to other options.
Teach: A hundred workloads with different boot orders, and you are not going to name them one at a time in a Recovery Plan and keep that list correct for a year. Use Categories. Group the VMs by what they are and when they need to come up, then build the Recovery Plan against the Categories. New VM joins a category, it is protected automatically. Describe the fleet once; let the plan follow the description.

### mci-storage-1pxr
domain: storage
difficulty: 4
tags: storage-container, rf1, advertised-capacity, prism-element

Q: An administrator has been tasked with creating a new storage container named TestData. The TestData storage container must meet the following conditions: • The container needs to have a Replication Factor of 1 (RF1). • Inline Compression must be enabled. • Deduplication must be disabled. • The container must have a maximum storage capacity of 100 GiB. How should the administrator complete this task?
- [ ] Log into Prism Element and create the storage container.
  > Incorrect: This approach uses Prism Element, which is designed for cluster-local management, including creation of containers with advanced features. However, this option is vague and does not specify setting the capacity (maximum 100 GiB) as required, so it may not enforce the capacity limit directly.
- [ ] Log into Prism Central and create the storage container with a Reserved Capacity of 100 GiB.
  > Incorrect: Prism Central provides centralized management for multiple clusters . Setting Reserved Capacity does not guarantee enforcement of a hard storage limit, so this does not fully satisfy the requirement for strictly limiting container size. Some advanced settings might not be as granular as in Prism Element when configuring storage features at creation time.
- [x] Log into Prism Element and create the storage container with an Advertised Capacity of 100 GiB.
  > Correct: In Prism Element, when creating storage containers, you can set specific features such as Replication Factor (RF1), enable inline compression, disable deduplication, and—critically—set "Advertised Capacity" to 100 GiB, which enforces the storage limit. Prism Element gives you cluster-local control to configure all required features at creation, which is not as easily handled in Prism Central's broader policy management view.
- [ ] Log into Prism Central and create the storage container.
  > Incorrect: Prism Central is usually best for environments with multiple clusters, centralized policy management, and automation, but it may not expose all granular features required for specific container customizations (like Replication Factor, compression, deduplication, and explicit advertised capacity limits) at creation time. Without specifying reserved or advertised capacity, this approach is incomplete versus the scenario's requirements.

Explain: • Prism Element is ideal for managing individual clusters and is the only platform that reliably allows configuration of all required storage container properties at creation, such as Replication Factor, compression, deduplication, and advertised (hard capped) capacity. • Prism Central, while powerful for multi-cluster and global management, does not provide the same level of granularity for storage container creation on a single cluster, especially when enforcing a strict capacity limit and choosing advanced features. • The Advertised Capacity setting in Prism Element is essential to enforce the 100 GiB limit; other methods may not provide a hard cap or could skip key configuration details. • Therefore, creating the container in Prism Element with an Advertised Capacity of 100 GiB directly satisfies all requirements in the scenario, making it the preferred choice for Nutanix storage container creation with strict settings.
Teach: Four requirements, and only one console can satisfy all four at creation. Prism Element is where a storage container's full property set lives: replication factor down to RF1, inline compression on, deduplication off, and a hard cap on size. That cap is Advertised Capacity — 100 GiB advertised is the limit the container will honour. Reserved Capacity is the opposite instrument: it fences space off for this container and takes it from everyone else. Advertised caps. Reserved claims. Do not confuse the two.

### mci-data-protection-dfj5
domain: data-protection
difficulty: 4
tags: recovery-plan, stages, boot-order, dr

Q: A new employee has inherited a partially configured Disaster Recovery (DR) schema. Source workloads have been identified and Nutanix Guest Tools has been installed. There are two Protection Polices in place, one with an asynchronous schedule with a 1-hour RPO and a second policy utilizing synchronous replication. All of these workloads need to be recovered at a DR location and this will be orchestrated by Prism Central Recovery Plans. What is the best way to setup this recovery orchestration?
- [x] Setup a single Recovery Plan utilizing stages of recovery delays as needed.
  > Correct: Nutanix recommends an application-centric approach to DR. You can (and should) create a single Recovery Plan that includes VMs protected by both synchronous and asynchronous replication policies, as long as they belong to the same application or business service. The plan can use stages and delays to handle boot order and dependencies, orchestrating a smooth failover.
- [ ] Identify the workload startup order and create Recovery Plans corresponding to the startup order.
  > Incorrect: Startup order should be managed inside a single Recovery Plan using stages and delays — not by splitting into separate Recovery Plans.
- [ ] Setup two Recovery Plans, one for the asynchronous replication and one for the synchronous replication.
  > Incorrect: Splitting by replication type breaks the application into multiple plans, forcing operators to coordinate failover manually across different plans — which defeats the purpose of automated recovery orchestration.
- [ ] Setup a Recovery Plan for the asynchronous replication and convert the synchronous replication to a Protection Domain.
  > Incorrect: Modern Prism Central Recovery Plans work with Protection Policies directly; converting to Protection Domains adds complexity and is unnecessary.

Explain: Nutanix Disaster Recovery is built to orchestrate failover at the application level, not by replication technology. You can include VMs protected by different Protection Policies (both sync and async) in the same Recovery Plan, and then use stages to define the boot sequence. This keeps DR simple, coordinated, and aligned to real-world business needs — ensuring that an entire application stack can be recovered with a single action.
Teach: Two Protection Policies, one synchronous and one asynchronous, and an instinct to build a Recovery Plan for each. Resist it. A Recovery Plan is not tied to a single policy; it is the running order for the recovery. Build one Recovery Plan and use stages, with delays between them, so the machines come up in the order the applications actually require. Split it in two and nothing coordinates the sequence across them. One plan. Staged.

### mci-monitoring-o26c
domain: monitoring
difficulty: 3
tags: reserve-capacity, auto-detect, capacity-runway, rf2

Q: Within Intelligent Operations, Capacity Configurations have been set to Auto Detect for Reserve Capacity For Failure. For an RF2 cluster with 10 nodes, what effect does this have on Capacity Runway?
- [ ] Reserves 10% of CPU, memory and storage to account for a single node failure.
  > Incorrect: The system doesn’t reserve a flat percentage; instead, it reserves capacity equal to the impact of losing the largest node in the cluster.
- [ ] Reserves RAM and CPU from the fastest node to account for a single node failure.
  > Incorrect: Nutanix doesn’t consider “fastest” node in terms of CPU clock speed or performance. The calculation is based on capacity, not performance.
- [x] Reserves CPU, RAM and storage from the largest node to account for a single node failure.
  > Correct: When Capacity Configurations > Reserve Capacity For Failure is set to Auto Detect, Nutanix Intelligent Operations automatically reserves enough CPU, RAM, and storage to handle the failure of the largest node in the cluster. This ensures that, in an RF2 cluster, a single node failure can be tolerated without impacting workload availability.
- [ ] Reserves storage and memory from the largest node to account for a single node failure.
  > Incorrect: This option ignores CPU, which is also included in the reservation calculation. Nutanix reserves all three: CPU, memory, and storage.

Explain: For an RF2 cluster, “Auto Detect” dynamically calculates and reserves the amount of capacity required to absorb the failure of the single largest node — across all three dimensions: CPU, memory, and storage. This keeps the cluster protected and ensures Capacity Runway calculations accurately reflect the true usable capacity after accounting for node failure tolerance.
Teach: Auto Detect does not reserve a tidy ten percent, and it does not pick the fastest node. It looks at the cluster and reserves enough CPU, memory, and storage to survive the loss of the largest node — because that is the worst single failure the cluster can actually suffer. All three dimensions, sized to the biggest hull in the formation. Capacity Runway then projects against what is genuinely left over, not against a number that assumes nothing ever breaks.

### mci-performance-e8q0
domain: performance
difficulty: 4

Q: An administrator is experiencing performance issues within a VM and believes that more vCPUs should be added to the specific VM. The cluster as a whole appears to be performing well. Which two metrics should be analyzed to determine if adding more vCPUs is warranted? (Choose two.)
- [x] VM CPU Ready Time
  > Correct, High CPU Ready Time indicates CPU contention, meaning adding vCPUs may not help.
- [x] VM CPU Usage
  > Correct, If CPU usage is consistently high, adding more vCPUs may improve performance.
- [ ] Host CPU Usage
  > Incorrect, Host CPU usage provides insight but does not determine VM CPU needs directly.
- [ ] Host Memory Swap Out Rate
  > Incorrect, This metric relates to memory, not CPU performance.

Explain: To determine whether adding more virtual CPUs (vCPUs) would improve the virtual machine's (VM) performance, the administrator should analyze these two metrics: CPU Ready Time: This metric indicates the amount of time a VM has to wait for available physical CPU resources. High CPU ready times suggest that the VM is experiencing CPU contention and could benefit from additional vCPUs. CPU Usage: While high CPU usage alone doesn't necessarily mean adding more vCPUs will help, it's important to analyze it in conjunction with CPU ready time. If CPU usage is high and CPU ready time is high, it strongly suggests that the VM is CPU constrained and could benefit from additional vCPUs. If, however, CPU usage is low, adding more vCPUs is unlikely to improve performance. Adding vCPUs won't resolve performance issues if the VM isn't already using all of its available CPU resources.

### mci-vms-sqgl
domain: vms
difficulty: 4

Q: Which two actions occur by default on a node which is placed in Maintenance Mode? (Choose two.)
- [ ] Non-migratable VMs are powered off and restarted on other hosts in the cluster.
  > Incorrect: Non-migratable VMs are not automatically restarted on other hosts---they remain powered off until manually restarted.
- [x] All eligible VMs on the host are migrated to other hosts in the cluster.
  > Correct: Nutanix attempts to live migrate all virtual machines (VMs) that are configured to allow live migration.
- [ ] All eligible VMs on the host are powered off.
  > Incorrect: Eligible VMs are live-migrated, not powered off.
- [x] Non-migratable VMs are powered off.
  > Correct: VMs that cannot be live migrated, such as those with CPU passthrough, PCI passthrough, pinned VMs (with host affinity policies), and RF1 VMs, are powered off. .

Explain: When a node is placed into Maintenance Mode, Nutanix follows a structured process to ensure service continuity and data integrity. 1- Live Migration automatically moves VMs to other hosts to avoid downtime. 2- Some VMs, such as those using GPU pass-through or local storage dependencies, cannot be livemigrated.

### mci-storage-0eqz
domain: storage
difficulty: 3

Q: An administrator is tasked with optimizing a VM's storage to leverage compression features. Currently, vDisks are in a storage container default-container-91003002003041 that has no optimization activated. The administrator must move the VM's storage to the storage container Production. What is the most efficient way to achieve this operation?
- [ ] Recreate vDisk in the Production storage container configuration and copy data.
  > Incorrect: It requires significant manual effort, creates potential for data inconsistency if the application is live, and often necessitates taking the service offline to ensure a clean copy.
- [ ] Migrate vDisks to the Production storage container.
  > Incorrect: It is a single automated task that maintains the VM's configuration and metadata. The system handles the background data copy and cutover with minimal to no impact on VM availability
- [ ] Recreate VM in the Production storage container configuration and copy data.
  > Incorrect: This is the most time-consuming option. It requires reconfiguring VM settings (CPU, RAM, Network) and typically results in a new UUID/MAC address, which can break software licensing or network configurations.
- [x] Migrate VM to the Production storage container.
  > Correct: While some interfaces might group storage moves under VM updates, the specific operation required here is a vDisk migration to change the underlying storage container while keeping the VM on its current compute resources

Explain: Nutanix applies storage policies—such as compression, deduplication, and Replication Factor (RF)—at the storage container level. If a VM is residing in a container without these features enabled, simply turning them on for that container will only affect new writes; it will not immediately compress existing data unless a background "Curator" scan is triggered. By migrating the vDisks to a container that already has compression enabled (the Production container), Nutanix performs a cross-container move. During this move, the data is rewritten into the new container, allowing the Capacity Optimization Engine (COE) to apply the target container's compression policy to the data as it is moved. This operation can be performed via the Prism Central UI or the acli (Acropolis CLI) using the vm.update_container command, which allows for either all disks or specific disks to be moved without downtime.

### mci-networking-vf8s
domain: networking
difficulty: 4

Q: An administrator is trying to troubleshoot the environment after NCC raised an alert. 1 Detailed information for remote_site_connectivity_check: 2 Node x.x.x.x: 3 WARN: Failed to connect to the remote site <remote_site>. Which two steps should an administrator follow to provide a solution? (Choose two.)
- [x] Confirm that the remote cluster is reachable, and ports 2009 and 2020 are open between the clusters.
  > Correct: Ensuring connectivity and open ports is crucial for communication.
- [ ] Configure Network Address Translation performed by any device in between the two Nutanix clusters.
  > Incorrect: configuring Network Address Translation (NAT), isn't a direct solution to the stated problem. While NAT might exist in the network, the core issue is basic connectivity on ports 2009 and 2020. Focus on verifying that these ports are open and reachable before addressing complex NAT scenarios.
- [x] If the remote site has been re-configured and the cluster has a new cluster incarnation ID, re-create the remote site.
  > Correct: Re-creating the remote site may be necessary if the cluster ID has changed.
- [ ] Check if ping packets with an MTU of 9000 reach the destination cluster.
  > Incorrect: checking ping packets with an Maximum Transmission Unit (MTU) of 9000, is a less common issue. While MTU fragmentation can cause issues, start with the simpler checks in A and C first. An MTU check is part of NCC but the core issue here is connectivity, not necessarily MTU size. NCC does cover an MTU_check.

Explain: The NCC alert remote_site_connectivity_check WARN message indicates a failure to connect to the remote site. To troubleshoot, you should focus on network connectivity between the sites. The following two steps address this: 1. Confirm that the remote cluster is reachable, and ports 2009 and 2020 are open between the clusters: This directly addresses the error message. As seen in multiple examples, the failure to connect on ports 2009 and 2020 is the primary reason for this alert. 3. If the remote site has been re-configured and the cluster has a new cluster incarnation ID, re-create the remote site: If the remote site's configuration has changed significantly, including a new cluster incarnation ID, the local cluster's connection information might be outdated, triggering the connectivity failure. Re-creating the remote site configuration on the local cluster ensures the correct connection details are in place.

### mci-storage-ydhj
domain: storage
difficulty: 4

Q: An administrator has migrated a physical MySQL database from a legacy 3-Tier environment to a Nutanix cluster. Post migration, the administrator finds that at peak load, the number of IOPS being generated is lower than expected, and latency is higher. Which two steps should the administrator take to improve this behavior? (Choose two.)
- [x] Use LVM to stripe the SQL data across multiple vDisks.
  > Correct: Striping data across multiple vDisks can improve IOPS and reduce latency.
- [x] Create additional vDisks for SQL data.
  > Correct: Additional vDisks can help distribute the load and improve performance.
- [ ] Ensure that the SQL data vDisks are thick provisioned.
  > Incorrect: Thick provisioning can improve performance but may not be the best option for all environments.
- [ ] Ensure that the SQL data vDisks are thin provisioned.
  > Incorrect: Thin provisioning can save space but may not improve performance.

Explain: Striping data and creating additional vDisks can improve IOPS and reduce latency.

### mci-data-protection-fvym
domain: data-protection
difficulty: 4

Q: An administrator has deployed two Nutanix clusters and is now establishing synchronous replication between them. However, the replication is failing immediately. Which two responses show the reason and corrective action an administrator can take to resolve the issue? (Choose two.)
- [ ] If the primary and the recovery clusters are on the same subnet, open the ports manually for communication.
  > Incorrect: When both clusters are on the same subnet, CVM communication typically uses the internal bridge (br0 or eth0), and required ports are already open by default; manual firewall modification is not necessary.
- [x] If the primary and the recovery clusters are in different subnets, open the ports manually for communication.
  > Correct: When clusters are in different subnets, firewall ports must be manually opened for communication between the two clusters (for replication, Stargate, etc.).
- [ ] Use the command modify firewall to open the ports on eth1 interface.
  > Incorrect: The eth1 interface is used for the internal backplane network (192.168.5.x) between CVMs and hypervisors, not for external replication traffic.
- [x] Use the command modify firewall to open the ports on eth0 interface.
  > Correct: Replication traffic between clusters in different subnets travels via eth0 (the external data network). To enable communication, the firewall on eth0 must be modified to open required ports (e.g., 2009, 2020, etc.).

Explain: Synchronous (and asynchronous) replication between clusters in different subnets requires: 1) ports manually opened for communication between the two clusters (for replication, Stargate, etc.). 2) Proper routing and open firewall ports on the external interface (eth0). The modify_firewall command is used on eth0, because that’s the interface for external CVM-to-CVM communication across clusters. When clusters are on the same subnet, this configuration is not needed, since local traffic on br0 is already allowed by default.

### mci-storage-ddyu
domain: storage
difficulty: 3

Q: An administrator receives an alert in Prism stating: 1 "Storage container <container_name> on cluster <cluster_name> will run out of storage resources in approximately 1 day." However, the cluster has plenty of available space remaining. What configuration setting is causing the container to run out of space while the cluster has space remaining?
- [x] Advertised Capacity is set too low
  > Correct: A container's Advertised Capacity caps how much of the storage pool it can use, and the container's fullness is measured against that cap. Set it below what the cluster provides and that one container reaches capacity (and alerts) while the pool still has free space.
- [ ] Reserved Capacity is set too high
  > Incorrect: Reserving capacity guarantees space to a container from the pool; it does not make that container report 'out of space.' High reservations on OTHER containers shrink the shared pool, but then the cluster would not show plenty of free space.
- [ ] Compression is set too low
  > Incorrect: Compression affects the effective storage capacity, but it's unlikely to be the direct cause of this specific scenario where the cluster has enough space.
- [ ] Replication Factor is set too high
  > Incorrect: A higher RF consumes more raw storage. However, the alert refers to the container running out of resources, not the cluster. While a high RF can lead to overall cluster storage shortages, it wouldn't explain a container running out of space while the cluster still has plenty of capacity

Explain: The alert warns that this specific container will run out of space within about a day while the cluster still has plenty free. That pattern points to the container's Advertised Capacity being set lower than the pool it draws from: the container fills against its own cap and alerts even though the cluster has space. [Source key corrected: the dump marked 'Reserved Capacity is set too high,' which is wrong — see review notes.]

### mci-data-protection-c8sy
domain: data-protection
difficulty: 3

Q: An administrator is responsible for Nutanix DR configuration and testing. The administrator experiences a Recovery Plan Failure for a cross hypervisor (ESXi to AHV) DR Test. The guest VMs do not recover at the DR location. Which configuration is required for a successful event?
- [ ] Utilize delta disks
  > Incorrect: Delta disks improve backup efficiency but do not impact cross-hypervisor recovery.
- [ ] Deploy Legacy BIOS boot on hosts within the cluster
  > Incorrect: AHV prefers UEFI boot mode, and Legacy BIOS is not a requirement
- [ ] Use raw device mappings
  > Incorrect: RDMs are not supported for cross-hypervisor DR.
- [x] Nutanix Guest Tools (NGT) must be installed on source guest VMs
  > Correct: NGT ensures correct reconfiguration of VM devices and networking settings during failover. It handles disk and driver reassignments between ESXi and AHV.

Explain: For cross-hypervisor DR failover (e.g., ESXi to AHV), Nutanix Guest Tools (NGT) must be installed on VMs to ensure proper configuration and recovery.

### mci-vms-pd0t
domain: vms
difficulty: 2

Q: What is supported for creating a VM Template in Nutanix?
- [ ] VM is protected by Protection Domain-based DR
  > Incorrect: You cannot create a VM template if "Is protected by Protection Domain-based DR".
- [ ] VM is an agent or a Prism Central VM
  > Incorrect: You cannot create a VM template if "Is an agent VM or PC VM".
- [x] VM has disks located on RF2 containers
  > Correct: VM templates in Nutanix are supported only when the VM's disks reside on storage containers configured with Replication Factor 2 (RF2) or higher
- [ ] VM runs on the ESXi hypervisor
  > Incorrect: You cannot create a VM template if "Is not on AHV".

Explain: The requirements for a VM that can be made into a template are: The VM must be powered off. The VM must be on AHV. The VM cannot be an agent VM or a Prism Central (PC) VM. The VM cannot have a volume group attached. The VM cannot be undergoing vDisk migration. The VM cannot have disks located on RF1 containers. The VM cannot be protected by Protection Domain-based disaster recovery (DR).

### mci-vms-itzi
domain: vms
difficulty: 4

Q: An administrator is experiencing storage performance issues on a Windows Server 2019 VM with the below configuration: - vCPU: 1 - VRAM: 8 GB - vSCSI: VirtIO SCSI Controller - vDisk: 2 (100 GB, 250 GB) - vNIC: VirtIO Fast Ethernet The AHV cluster is healthy, and other Windows VMs are performing well. Which configuration change should be reviewed to enhance VM performance?
- [ ] Add a second virtual storage controller (vSCSI)
  > Incorrect: While this can sometimes improve performance by allowing for parallel I/O operations, it's less likely to have a significant impact with only two vDisks.
- [ ] Enable Balance-TCP on bridge (br0)
  > Incorrect: This setting relates to network traffic optimization and is unlikely to directly address storage performance issues.
- [ ] Increase Controller VM (CVM) resources
  > Incorrect: While insufficient Controller VM resources can impact overall cluster performance, the prompt states that other Windows VMs are performing well.
- [x] Increase the VM's number of vCPUs
  > Correct: A single vCPU can create a bottleneck, especially for storage-intensive operations. Windows Server 2019, even with only 8GB of vRAM, can benefit from additional vCPUs to handle storage processing more efficiently.

Explain: Increasing the VM's vCPUs (option 4) is the most likely configuration change to improve storage performance in this scenario. While the other options might impact performance in some cases, they are less likely to be the root cause given the described situation.

### mci-vms-2jtg
domain: vms
difficulty: 3

Q: In a five-node Nutanix cluster, an administrator noticed that three VMs are consuming too many resources on a single host, but ADS is not able to migrate these VMs. What reason describes what is preventing ADS from migrating these VMs?
- [ ] VMs use a Volume Group
  > Incorrect: Volume Groups support live migration unless they are configured incorrectly.
- [x] VMs use GPU pass-through
  > Correct: Pass-through devices (such as GPUs) are directly assigned to VMs, making migration impossible unless the VM is powered off first.
- [ ] VM-VM anti-affinity policy is set
  > Incorrect: Anti-affinity rules prevent two specific VMs from running together, but do not prevent migration.
- [ ] VMs use external Network Attached Storage
  > Incorrect: Using NAS does not block VM migration, as Nutanix supports shared storage across hosts.

Explain: VMs using GPU pass-through cannot be live-migrated because they are directly tied to a physical GPU on a specific host. ADS avoids migrating VMs that use GPU passthrough. While ADS does handle vGPU migration in some cases like defragmentation or power-on operations (starting from AOS 5.20/6.0), it's generally more restrictive with pGPU (pass-through) due to the resource dedication and potential complexities involved

### mci-monitoring-gkrr
domain: monitoring
difficulty: 3

Q: How can just the checks that previously did not pass be executed again to confirm they are all resolved?
- [ ] Run LCM Pre-Upgrade to trigger NCC Checks
  > Incorrect: LCM Pre-Upgrade runs checks but does not focus on failed ones
- [ ] Run ncc health checks run_all
  > Incorrect: Runs all health checks, not just the failed ones
- [ ] Select Run Check for each check worked
  > Incorrect: Requires manual selection, which is inefficient
- [x] Select Only Failed And Warning Checks
  > Correct: Runs only checks that previously failed

Explain: Select Only Failed And Warning Checks is an option within NCC that allows for re-execution of only the checks that previously resulted in a FAIL or WARN status. This helps confirm resolution of issues without running all checks. NCC (Nutanix Cluster Check) itself is a health check tool for Nutanix clusters. Failed checks indicate critical issues requiring immediate action, while warnings signify problems needing attention. NCC offers various checks, including network, hardware, and software tests, aiding in proactive cluster maintenance and troubleshooting.

### mci-lifecycle-kvuy
domain: lifecycle
difficulty: 3

Q: For dark site Nutanix clusters, what should be downloaded prior to running an LCM Inventory or updates?
- [ ] Nutanix Foundation
  > Incorrect: Used for initial deployment, not LCM updates
- [x] Nutanix Compatibility Bundle
  > Correct: Provides necessary updates for dark site clusters
- [ ] Nutanix Prism Central
  > Incorrect: Used for management, not required for LCM
- [ ] Nutanix Foundation Platform
  > Incorrect: No such specific package for dark site updates

Explain: The Nutanix Compatibility Bundle should be downloaded before running an LCM Inventory or updates in dark site clusters. This ensures that the cluster is running a supported configuration and avoids potential issues during updates. It's important to download the latest Compatibility Bundle and replace the existing files on the web server.

### mci-monitoring-9ip8
domain: monitoring
difficulty: 3

Q: How should an administrator verify cluster protection from potential data loss due to a component failure?
- [ ] Select the gear icon and then select Pulse
  > Incorrect: Pulse monitors external connectivity and alerts
- [ ] Click on Home and then Alerts
  > Incorrect: Alerts indicate issues but do not verify protection status
- [x] Look at the Data Resiliency Status widget
  > Correct: Directly displays data resiliency status
- [ ] Navigate to the Health dashboard
  > Incorrect: General health information but does not focus on data resiliency

Explain: The primary method for verifying cluster protection is to check the Data Resiliency Status widget on the Prism Element dashboard. This widget provides a summary of how many failures the cluster can tolerate based on the current configuration and health of its components (nodes, disks, etc.). For a more detailed view, clicking the widget displays further information about the cluster's resilience to component failures, specifying the configured failure domain.

### mci-architecture-kx8a
domain: architecture
difficulty: 3

Q: Which Nutanix offering allows for extending an on-prem datacenter into the public cloud?
- [ ] Nutanix Cloud Security
  > Incorrect: Focuses on security, not cloud extension
- [x] Nutanix Cloud Clusters
  > Correct: Enables hybrid cloud deployment
- [ ] Nutanix Kubernetes Engine
  > Incorrect: Manages containers, not hybrid cloud
- [ ] Nutanix Data Services
  > Incorrect: Provides data services, not hybrid cloud

Explain: Nutanix Cloud Clusters (NC2) extends the on-premises datacenter into the public cloud. NC2 allows you to run the Nutanix Cloud Platform, including AOS and AHV, in a public cloud environment like AWS or Azure. This provides a consistent operating model across both on-premises and public cloud, simplifying management and enabling hybrid cloud capabilities like workload mobility, disaster recovery, and burst capacity.

### mci-vms-xth3
domain: vms
difficulty: 3

Q: What must be enabled when creating a VM to enable Windows Defender Credential Guard?
- [ ] Live Migration
  > Incorrect: Enables moving VMs without downtime, unrelated to Credential Guard
- [x] UEFI
  > Correct: Required for security features like Credential Guard
- [ ] HA
  > Incorrect: Ensures VM availability, not related to Credential Guard
- [ ] Legacy BIOS
  > Incorrect: Does not support modern security features

Explain: To enable Windows Defender Credential Guard when creating a VM in AHV, you must select the "Windows Defender Credential Guard" option under "Boot Configuration" while configuring the VM. Additionally, ensure that UEFI and Secure Boot are also selected.

### mci-security-f40i
domain: security
difficulty: 3

Q: Which feature should be enabled to prevent password access to the CVM for both the nutanix and admin user accounts?
- [x] Cluster lockdown
  > Correct: Restricts direct CVM access using password
- [ ] STIG
  > Incorrect: Security standards but does not prevent direct access
- [ ] RBAC Policy on PC
  > Incorrect: Controls access in Prism Central, not CVM login
- [ ] Data-at-Rest Encryption
  > Incorrect: Protects data but does not block CVM access

Explain: Enabling lockdown mode prevents password access to the CVM for both the nutanix and admin user accounts. This restricts access to SSH key-based authentication only. This is documented in the Nutanix Security Guide.

### mci-architecture-sggp
domain: architecture
difficulty: 3

Q: What license type is required to license a new AOS-based cluster with no add-on packages via Nutanix Cloud Platform Package Licensing?
- [ ] Nutanix Cloud Manager (NCM)
  > Incorrect: Provides management and automation, not core infrastructure
- [x] Nutanix Cloud Infrastructure (NCI)
  > Correct: Covers core AOS-based cluster licensing
- [ ] Nutanix Unified Storage (NUS)
  > Incorrect: Focuses on storage services, not AOS licensing
- [ ] Nutanix Database Service (NDB)
  > Incorrect: Used for database services, not cluster licensing

Explain: Nutanix Cloud Infrastructure (NCI) is required for basic AOS-based cluster licensing.

### mci-monitoring-gg6v
domain: monitoring
difficulty: 3

Q: When multiple Alert policies are applied to an entity, which will take precedence?
- [x] Policy applied to a specific entity type.
  > Correct: Higher specificity takes precedence.
- [ ] Policy applied to all entities of an entity type.
  > Incorrect: Less specific than entity-level policies.
- [ ] Policy applied to an entity type in a category.
  > Incorrect: Applies broadly across categories.
- [ ] Policy applied to an entity type in a cluster.
  > Incorrect: Lowest precedence.

Explain: When multiple alert policies apply to an entity, the most specific policy takes precedence. For example, a policy applied to a specific VM overrides a policy applied to a category of VMs. Within a given level of specificity, the policy updated most recently takes precedence.

### mci-architecture-cf9n
domain: architecture
difficulty: 4

Q: Prism Central will be installed manually on an AHV cluster. Which three disk images must be downloaded from the portal for the Prism Central VM?
- [ ] var
  > Incorrect: Not required for Prism Central installation.
- [ ] tmp
  > Incorrect: Not a necessary disk image.
- [x] boot
  > Correct: boot is correct image
- [x] home
  > Correct: home is correct image
- [x] data
  > Correct: data is also a correct image

Explain: When manually installing Prism Central on an AHV cluster, you actually need to download two disk images: the boot image and the data image. The documentation mentions a "home" image in older versions, but current installations utilize only boot and data images.

### mci-storage-souq
domain: storage
difficulty: 4

Q: Which data savings technique utilizes stripes and parity calculation in a Nutanix cluster?
- [ ] Compression
  > Incorrect: Compression reduces storage size but does not use parity.
- [ ] Parity strip
  > Incorrect: Not a valid Nutanix feature.
- [x] Erasure coding
  > Correct: Uses parity and stripes to optimize storage efficiency.
- [ ] Deduplication
  > Incorrect: Removes duplicate data but does not use parity.

Explain: Erasure Coding (EC) is the data savings technique employed in Nutanix clusters. It utilizes stripes of data blocks and calculates parity to provide redundancy while reducing storage overhead. Specifically, data is divided into stripes across multiple nodes, and a parity block is calculated and stored. This parity information can be used to reconstruct data in case of a node failure.

### mci-networking-6e6o
domain: networking
difficulty: 2

Q: What is the function of the virbr0 bridge on AHV?
- [x] To carry management and storage communication between the CVM and AHV host
  > Correct: The virbr0 bridge handles the critical internal traffic between the local host and its CVM. Specifically, it uses the 192.168.5.0/24 internal network. The AHV host is always assigned 192.168.5.1 and the CVM is 192.168.5.2. This path is used for storage I/O (via iSCSI/NFS redirectors) and management tasks (like heartbeat monitoring).
- [ ] To carry all traffic between the user VMs and the upstream network
  > Incorrect: Traffic between User VMs and the external/upstream network is handled by the Open vSwitch (OVS) bridges, typically named br0 (or br-overlay in FVN setups). virbr0 is strictly internal and never has physical uplinks attached to it.
- [ ] To carry storage communication between the guest VMs and the CVM
  > Incorrect: Guest VMs communicate with the CVM for storage through the standard virtual switch (br0). While the traffic eventually reaches the CVM, the virbr0 bridge itself is specifically for the host-to-local-CVM internal link, not for general Guest VM data paths.
- [ ] To carry management and storage communication between user VMs and the CVM
  > Incorrect: Management and storage communication for user VMs occurs over the production bridges (like br0). virbr0 is an isolated bridge used for infrastructure-level communication between the hypervisor and the controller.

Explain: The virbr0 bridge is a fundamental component of the Nutanix "Internal-Only" network architecture. By using a local bridge and the reserved 192.168.5.0/24 subnet, Nutanix ensures that the AHV host can always reach its CVM for vital storage services, even if physical network uplinks are down or misconfigured. This is why Nutanix strongly advises administrators never to use the 192.168.5.0/24 range for any other purpose in the VPC or physical network, as it would conflict with this essential internal communication path.

### mci-security-bn5m
domain: security
difficulty: 3

Q: How should an administrator enable secure access to Volumes using a password?
- [ ] iSER
  > Incorrect: iSER is for RDMA storage acceleration, not security.
- [x] CHAP
  > Correct: CHAP is a security protocol for authentication in storage access.
- [ ] SAML
  > Incorrect: SAML is used for authentication but not for storage security.
- [ ] LDAP
  > Incorrect: LDAP is a directory service, not a volume security method.

Explain: To enable secure access to Volumes using a password, you should configure CHAP (Challenge-Handshake Authentication Protocol) when creating the Volume Group. This allows for one-way or mutual authentication between the initiator and target. Nutanix recommends using one-way CHAP. For increased security, mutual CHAP is also supported

### mci-networking-5gfy
domain: networking
difficulty: 4
image: images/a2q18.png

Q: An administrator logs in to Prism Element, goes to the Network Visualization view, and sees the output shown in the exhibit. Which three steps must the administrator take to increase throughput to the host?
- [ ] Change the VLAN ID to a higher priority ID
  > Incorrect: Change VLAN ID will not impact the throughput
- [x] Connect the 10Gb interfaces to the physical switch
  > Correct: Connecting the 10G Interface will increase the throughput
- [x] Remove any 1Gb interfaces still connected from the default bond
  > Correct: Prevents lower-speed interfaces from limiting throughput.
- [x] Change the bond mode to balance-slb or balance-tcp
  > Correct: change bond mode will increase the throughput
- [ ] Add a new switch to the network and connect 1Gb interfaces to it
  > Incorrect: new switch with 1GB will not impact the throughput

Explain: Three changes together raise throughput. Connect the 10Gb interfaces to the physical switch: connecting 10Gb interfaces directly to the switch provides more bandwidth than 1Gb interfaces, increasing the potential throughput to the host — switch guidance consistently emphasizes 10Gb interfaces for higher performance. Remove any 1Gb interfaces still connected from the default bond: if 1Gb interfaces share a bond with 10Gb interfaces they create a bottleneck; removing the slower interfaces lets the bond run at the 10Gb speed. Change the bond mode to balance-slb or balance-tcp: these bond modes improve throughput by distributing traffic across multiple interfaces, and they work best when every interface in the bond runs at the same speed — which is exactly why removing the 1Gb interfaces matters. Changing the VLAN ID to a higher-priority ID deals with Quality of Service (QoS), not throughput. Adding a new switch and connecting 1Gb interfaces to it wouldn't increase throughput to the host, as it still relies on the slower 1Gb links.

### mci-data-protection-weni
domain: data-protection
difficulty: 3

Q: An administrator is configuring data protection and DR for a multi-tier application. All VMs must be protected at the same time. What must the administrator do to meet this requirement?
- [ ] Create a consistency group for each VM with identical schedules.
  > Incorrect: Protects individual VMs separately but does not ensure consistency across them.
- [x] Create a consistency group for the application and place all VMs in it.
  > Correct: Groups VMs together to ensure they are protected as a unit.
- [ ] Create a protection domain for the application and select auto-protect related entities.
  > Incorrect: Ensures related VMs are automatically included in the protection plan.
- [ ] Create a protection domain for each VM with identical schedules.
  > Incorrect: Like the per-VM consistency-group approach, this protects VMs separately and does not maintain cross-VM consistency.

Explain: The administrator's suggestion to create a consistency group for the application and place all VMs in it is correct. This will ensure that all the VMs are protected simultaneously. This approach aligns with the need to protect multi-tier applications as a single unit, enabling application-consistent recovery points and facilitating a more efficient Disaster Recovery (DR) process.

### mci-data-protection-43in
domain: data-protection
difficulty: 3

Q: A company is evaluating Nutanix Disaster Recovery (DR) to protect multiple business-critical applications. Some applications are built using a 3-tier architecture and have interdependencies. After failover, the VM's static IP address is retained, but DNS configuration is lost. How should an administrator proceed to resolve this issue?
- [ ] Configure Self-Service Restore.
  > Incorrect: Self-Service Restore does not handle network configuration.
- [x] Create custom in-guest scripts to preserve the statically assigned DNS IP addresses.
  > Correct: Custom scripts can be used to restore the DNS configuration after failover.
- [ ] Install Network Manager command-line tool (ncli) in the protected Windows VMs.
  > Incorrect: ncli is used for cluster management, not VM DNS configuration.
- [ ] Configure a Protection Domain.
  > Incorrect: Protection Domains handle VM protection but do not restore DNS settings.

Explain: Creating custom in-guest scripts to preserve the statically assigned DNS IP addresses is a valid approach. The in-guest script should execute after the failover event and reconfigure the DNS settings within the VM's operating system. This can be achieved using PowerShell for Windows VMs or shell scripts for Linux VMs. Ensure the script has the necessary permissions to modify network settings within the guest OS.

### mci-data-protection-8ui8
domain: data-protection
difficulty: 3

Q: If an administrator creates a report with no retention policy configured, how many instances of the report are retained by default?
- [ ] 5
  > Incorrect: Lower than the default retention setting.
- [x] 10
  > Correct: default retention setting.
- [ ] 15
  > Incorrect: Higher than the default retention setting.
- [ ] 20
  > Incorrect: Higher than the default retention setting.

Explain: By default, 10 instances of a report are retained if no specific retention policy is configured.

### mci-data-protection-cbb8
domain: data-protection
difficulty: 3

Q: An administrator is trying to delete a protected snapshot but is unable to do so. What is the most likely cause?
- [ ] There is an active recovery occurring at that time.
  > Incorrect: If a recovery operation is ongoing, the snapshot can be deleted.
- [ ] Ransomware has encrypted the snapshot.
  > Incorrect: Nutanix snapshots are immutable and cannot be encrypted by ransomware.
- [x] There is an approval policy that was denied.
  > Correct: Approval policies do impact snapshot deletion.
- [ ] The snapshot has been corrupted.
  > Incorrect: A corrupted snapshot does not prevent deletion.

Explain: The most likely reason an administrator is unable to delete a protected snapshot is due to an approval policy that was denied. Secure snapshots require approvals before deletion. Concurrent secure snapshot deletions can take a long time and block normal snapshot deletions.

### mci-vms-e8uw
domain: vms
difficulty: 3

Q: An administrator is preparing for a firmware upgrade on a host and wants to manually migrate VMs before executing the LCM upgrade. However, one VM is unable to migrate while others migrate successfully. Which action would fix the issue?
- [ ] Enable Acropolis Dynamic Scheduling (ADS) at the cluster level.
  > Incorrect: ADS optimizes resource usage but does not directly resolve migration issues.
- [ ] Update Link Layer Discovery Protocol (LLDP).
  > Incorrect: LLDP is a network protocol and does not impact VM migration.
- [x] Disable Agent VM within the VM configuration options.
  > Correct: Disabling Agent VM mode allows the VM to be migrated.
- [ ] Configure backplane port groups that are assigned to the CVM.
  > Incorrect: CVM port groups do not affect VM migration.

Explain: Disabling the Agent VM setting within the VM configuration options will allow the VM to be migrated. Agent VMs are given higher priority during boot up and shut down, which disables features like live migration. An agent VM cannot use live migration or VM-Host Affinity. If a host is put in maintenance mode, the Agent VM on that host will be stopped. However, the administrator can start the VM on a different host via the command line interface (CLI).

### mci-vms-0xfz
domain: vms
difficulty: 3

Q: An administrator wants to live-migrate a vGPU-enabled VM from one host to another within the same cluster. What requirements must be met before initiating the migration?
- [x] The target host has sufficient resources to support the VM.
  > Correct: The target host must have the necessary GPU resources.
- [ ] The vGPU profile needs to be changed.
  > Incorrect: vGPU profiles do not need to be changed for migration.
- [ ] The VM must be configured as an agent VM.
  > Incorrect: Agent VMs cannot be migrated.
- [ ] The host affinity for the VM must be set to a specific host.
  > Incorrect: Host affinity restricts migration.

Explain: You can perform live migration of VMs enabled with virtual GPUs (vGPU-enabled VMs) only on commercially reasonable effort, if the destination node is equipped to provide enough resources to the vGPU- enabled VMs. However, if the destination node is not equipped with the enough resources, the vGPU-enabled VMs are shut down and you might experience a downtime.

### mci-networking-0hg2
domain: networking
difficulty: 3

Q: An administrator wants to ensure that user VMs on AHV hosts can take advantage of bandwidth beyond a single adapter in a bond. Which uplink Bond Type should the administrator configure to accomplish this?
- [ ] No Uplink Bond
  > Incorrect: This does not allow bandwidth aggregation.
- [x] Active-Active
  > Correct: Active-Active bonding enables bandwidth aggregation across multiple adapters.
- [ ] Active-Active with MAC pinning
  > Incorrect: MAC pinning does not provide full bandwidth aggregation.
- [ ] Active-Backup
  > Incorrect: Active-Backup does not provide additional bandwidth.

Explain: The administrator should configure Active-Active bond type. This leverages link aggregation and balances VM NIC TCP/UDP sessions across multiple adapters, maximizing bandwidth utilization. It requires link aggregation protocol (LACP) configuration on the network switch side.

### mci-data-protection-33xw
domain: data-protection
difficulty: 3

Q: An administrator configured a remote site for Protection Domain replication, but network performance and stability are impacted. How can the remote site configuration be adjusted to fix the issue?
- [ ] Configure Network Address Translation (NAT) between the two Nutanix clusters.
  > Incorrect: NAT is not relevant to Protection Domain replication.
- [ ] Configure the Protection Domain with many-to-many replication.
  > Incorrect: Many-to-many replication is not a standard configuration for resolving network performance issues.
- [x] Configure a Bandwidth Throttling Policy.
  > Correct: Throttling bandwidth can help reduce network congestion.
- [ ] Configure the remote Cluster VIP as a proxy.
  > Incorrect: The Cluster VIP does not function as a proxy for replication.

Explain: Configuring a Bandwidth Throttling Policy can improve network performance and stability impacted by remote site Protection Domain (PD) replication.

### mci-security-akel
domain: security
difficulty: 3

Q: An administrator is configuring Protection Policies to replicate VMs to a Nutanix Cloud Cluster (NC2) over the internet. To comply with an organizational security policy, data sent via the internet must be encrypted. How should data be protected during transmission?
- [ ] Configure Data on a self-encrypting drive.
  > Incorrect: Self-encrypting drives protect data at rest, not in transit.
- [ ] Configure VMs to use UEFI Secure Boot.
  > Incorrect: Secure Boot protects against unauthorized OS modifications, not data in transit.
- [ ] Enable Data-at-Rest Encryption.
  > Incorrect: Data-at-Rest Encryption does not protect data while being transmitted.
- [x] Enable Data-in-Transit Encryption.
  > Correct: Data-in-Transit Encryption ensures that replication traffic is secure.

Explain: Data-in-transit encryption should be enabled to protect data during transmission. The Nutanix Security Guide mentions that enabling Data-in-Transit Encryption protects data sent between nodes in the same cluster or during replication to a secondary cluster over a Wide Area Network (WAN).

### mci-networking-wps6
domain: networking
difficulty: 3

Q: Due to application requirements, an administrator needs to support a multicast configuration in an AHV cluster. Which AHV feature can be used to optimize network traffic so that multicast traffic is only forwarded to the VMs that need to receive it?
- [ ] LACP
  > Incorrect: LACP is used for link aggregation, not multicast.
- [ ] UDP
  > Incorrect: UDP is a transport protocol and does not manage multicast forwarding.
- [x] IGMP Snooping
  > Correct: IGMP Snooping ensures multicast traffic is forwarded only to interested VMs.
- [ ] Network Segmentation
  > Incorrect: Network segmentation controls traffic between different VLANs but does not optimize multicast.

Explain: IGMP snooping. It allows the AHV host to track which VMs on a VLAN want to receive multicast traffic and then forwards the traffic only to those VMs. This prevents multicast traffic from being flooded to all VMs on the VLAN, which improves network performance and reduces CPU load on the host.

### mci-monitoring-vdd2
domain: monitoring
difficulty: 3

Q: What feature allows receiving a weekly message about infrastructure performance summary?
- [ ] Admin Center Life Cycle Manager
  > Incorrect: LCM handles firmware updates, not reports.
- [ ] Prism Central Syslog
  > Incorrect: Syslog collects logs but does not generate weekly reports.
- [ ] Infrastructure VMs List
  > Incorrect: This is an inventory list, not a reporting feature.
- [x] Intelligent Operations Reports
  > Correct: This feature provides scheduled reports on Infrastructure Performance Summary.

Explain: Intelligent Operations Reports are a feature of Nutanix Cloud Manager (NCM) that uses machine learning and smart automation to improve the efficiency of IT operations. The "Infrastructure Performance Summary" is a system report available within the Nutanix environment.

### mci-storage-s6m5
domain: storage
difficulty: 3

Q: Which storage attributes do Storage Policies manage?
- [ ] Storage Containers and Volume Groups
  > Incorrect: Storage policies do not manage containers and volume groups.
- [x] Replication Factor and Encryption
  > Correct: Storage policies manage replication factor and encryption settings.
- [ ] Shares and Object Stores
  > Incorrect: These are managed separately, not through Storage Policies.
- [ ] Data Protection and Security
  > Incorrect: While related, Storage Policies specifically control replication and encryption.

Explain: Nutanix Storage Policies manage the following storage attributes:\n\n- Replication Factor (RF): This attribute governs the number of copies of data maintained for redundancy and availability.\n- Encryption: This attribute enables data encryption at rest to enhance security.\n- Compression: This attribute enables data compression to optimize storage utilization.\n- Quality of Service (QoS): This attribute manages performance by setting rate limits (IOPS or bandwidth) for storage resources.

### mci-data-protection-eusy
domain: data-protection
difficulty: 3

Q: An administrator has been tasked with justifying why Nutanix Disaster Recovery was chosen for a multi-tier application spanning multiple business units. What is the most efficient way to organize and manage the workloads?
- [ ] Utilize a VM naming schema that allows sorting
  > Incorrect: Naming conventions help but do not optimize DR management.
- [x] Utilize Categories to organize VMs in Recovery Plans
  > Correct: Categories allow better organization and automation of recovery plans.
- [ ] Utilize a 1:10 ratio of Recovery Plan to VMs
  > Incorrect: There is no fixed ratio for Recovery Plans to VMs.
- [ ] Utilize RESTful APIs to script creation of Recovery Plans
  > Incorrect: APIs help automate, but categories provide better workload organization.

Explain: Nutanix Disaster Recovery offers an efficient way to organize and manage multi-tier applications spanning multiple business units for disaster recovery by leveraging the following:12 * Application-Centric Categories: Organize VMs based on application tiers (web, app, database) or business units. This allows for granular control over failover and recovery processes, ensuring that interdependent application components are treated as a single unit. Use categories to automate protection and apply policies specific to application needs. * Protection Policies: Define Recovery Point Objectives (RPOs) at the application level to meet individual business requirements. This ensures that critical applications have the lowest RPOs while less critical ones have more relaxed RPOs.1 * Recovery Plans: Orchestrate the recovery process by defining boot order and dependencies between application tiers. This automation ensures that applications are brought online in the correct sequence, minimizing downtime and data inconsistencies. Recovery Plans also allow for testing failover scenarios without impacting production.

### mci-architecture-pjk4
domain: architecture
difficulty: 3

Q: Which capability refers to the storage of VM data on the node where the VM is running and ensures that the read I/O does not have to traverse the network?
- [ ] Intelligent Locality
  > Incorrect: Not a Nutanix-specific term
- [ ] Intelligent Tiering
  > Incorrect: Does not describe local data storage
- [x] Data Locality
  > Correct: Ensures data stays on the node where the VM runs
- [ ] Data Tiering
  > Incorrect: Manages hot and cold data across storage tiers

Explain: Data Locality is the capability that stores VM data on the node where the VM is running. This ensures that read I/O doesn't have to traverse the network, optimizing read performance.

### mci-networking-xppm
domain: networking
difficulty: 3

Q: A security team asks an administrator to set up port mirroring of a specific source VM to a target VM. What must the administrator ensure for this configuration to be possible?
- [ ] Source VM and Target VM are on the same VPC.
  > Incorrect: VPCs enable network segmentation but are not required for port mirroring.
- [ ] Source VM and Target VM are on the same subnet.
  > Incorrect: Port mirroring does not require the same subnet.
- [x] Source VM and Target VM are on the same host.
  > Correct: Port mirroring requires both VMs to be on the same host to capture network traffic efficiently.
- [ ] Source VM and Target VM are on the same VLAN.
  > Incorrect: VLANs impact traffic segmentation but not port mirroring.

Explain: To set up port mirroring (also called SPAN) of a source VM to a target VM, the administrator must ensure the following: VM Placement: The source VM and target VM should reside on the same host. While mirroring traffic across hosts is possible using a dedicated VLAN tunnel, it's not encapsulated mirroring.

### mci-storage-t6wd
domain: storage
difficulty: 3

Q: An administrator needs to create a storage container for VM disks. The container must meet the following conditions: - 10 GiB of the total allocated space must not be used by other containers. - The container must have a maximum storage capacity of 500 GiB. What settings should the administrator configure while creating the storage container?
- [ ] Set Advertised Capacity to 10 GiB and Reserved Capacity to 500 GiB.
  > Incorrect: Advertised Capacity of 10 GiB is too low and does not match the requirement of a 500 GiB storage container.
- [ ] Set Reserved Capacity to 500 GiB.
  > Incorrect: Only setting Advertised Capacity does not guarantee Reserved Capacity, meaning other containers could consume the reserved space.
- [ ] Set Advertised Capacity to 10 GiB.
  > Incorrect: Setting only Reserved Capacity does not enforce an upper limit, which could lead to overprovisioning.
- [x] Set Reserved Capacity to 10 GiB and Advertised Capacity to 500 GiB.
  > Correct: Reserved Capacity ensures that 10 GiB is always available for this container and not consumed by other containers. Advertised Capacity defines a logical limit of 500 GiB to prevent over-allocation.

Explain: Reserved Capacity ensures that 10 GiB is always available for this container and not consumed by other containers while Advertised Capacity defines alogical limit of 500 GiB to prevent over-allocation.

### mci-networking-r061
domain: networking
difficulty: 3

Q: An administrator is setting up a Nutanix cluster and needs to configure the default VLAN. Which configuration should the administrator choose?
- [x] VLAN 0
  > Correct: VLAN 0 is used for untagged traffic.
- [ ] VLAN 1
  > Incorrect: Default VLAN is VLAN 0 in Nutanix.
- [ ] VLAN 2
  > Incorrect: VLAN 2 is user-defined.
- [ ] VLAN 7
  > Incorrect: No special meaning for VLAN 7 in Nutanix.

Explain: VLAN 0 is the correct configuration for the default VLAN in a Nutanix cluster. This aligns with the native VLAN configuration on Cisco switches, allowing untagged traffic to flow between the Nutanix nodes and the network infrastructure. VMs that need to communicate with the network without VLAN tagging should be attached to the network using VLAN 0.

### mci-security-6032
domain: security
difficulty: 3

Q: An administrator needs to configure NTP on Prism Central running on a Hyper-V cluster. How should the administrator complete this task?
- [ ] Add an external NTP server
  > Incorrect: Ensures accurate time synchronization across the cluster but AD is the recommanded in case of Hyper-v
- [ ] Add the DNS server IP
  > Incorrect: DNS is not an NTP server
- [ ] Add a server with a DNS hostname
  > Incorrect: A valid option if it resolves to an NTP server
- [x] Add the IP of the Domain Controller
  > Correct: Domain Controllers are always NTP servers

Explain: To configure NTP on a Prism Central instance running on a Hyper-V cluster, an administrator must use the command-line interface (CLI). Due to Kerberos requirements, Nutanix clusters on Hyper-V automatically add local domain controllers as NTP sources for all Controller Virtual Machines (CVMs). It is crucial to supplement these domain controllers with additional, reliable, non-Windows NTP sources, ideally aiming for a total of five time sources.

### mci-performance-ni21
domain: performance
difficulty: 3
image: images/a2q37.jpeg

Q: After adding new workloads, why is Overall Runway below 365 days and the scenario still shows the cluster is in good shape?
- [ ] Because Storage Runway is still good
  > Incorrect: Storage runway alone is not the only factor; CPU and memory are equally important.
- [ ] Because new workloads are sustainable
  > Incorrect: The added workloads don't critically impact runway to an unsustainable level
- [ ] Because there are recommended resources
  > Incorrect: : The presence of recommended resources does not mean the cluster is in good shape.
- [x] Because the Target is 1 month
  > Correct: The cluster is considered in good shape because the target runway threshold is only 1 month. Even though Overall Runway is below 365 days, it still meets the defined target.

Explain: A cluster is considered in "good shape" within a scenario if its Overall Runway meets or exceeds the specified Target Runway. The user interface typically visualizes this with the color blue, indicating that the resources are sufficient for the planned duration. In the context of the question: - Adding new workloads will calculate a new, shorter "Overall Runway." - If this new runway (e.g., 45 days) is still longer than the Target Runway you set in the scenario (e.g., 1 month or ~30 days), the scenario will indicate the cluster is still healthy or in "good shape" for your planning purposes. - The fact that the runway is less than 365 days is not relevant as long as it satisfies the goal you set in the Target Runway parameter.

### mci-lifecycle-8vpz
domain: lifecycle
difficulty: 3

Q: An administrator has been tasked with performing firmware upgrades for all Nutanix sites. When attempting to perform firmware upgrades via Life Cycle Manager (LCM) at a remote site with a single-node cluster, no firmware updates are listed as available. The administrator confirmed that the currently installed firmware is several revisions behind. Why are no firmware upgrades listed in LCM for this cluster?
- [ ] Single-node clusters only support one-disk firmware upgrades
  > Incorrect: Not a true limitation
- [ ] LCM is not supported on single-node clusters
  > Incorrect; LCM does support software upgrades, including AOS and AHV, on single-node clusters. However, to avoid data loss and service disruption, upgrades to AOS and AHV require manual shutdown of all guest VMs before starting but LCM does not support firmware upgrades on single-node clusters.
- [x] LCM cannot perform firmware upgrades on single-node clusters
  > Correct: LCM does not support firmware upgrades on single-node clusters. Since the firmware updates require node reboots and service interruptions, single-node clusters have no additional nodes for failover.
- [ ] LCM does not have connectivity to the internet
  > Incorrect: Connectivity is required to fetch updates

Explain: LCM firmware updates are not supported on single-node clusters. This is because firmware updates typically require services to be stopped. In a single-node cluster, there is no other node to take over the workload from the node being updated. Resources

### mci-vms-tbwc
domain: vms
difficulty: 4

Q: Which two entities can be categorized? (Choose two.)
- [ ] Storage Containers
  > Incorrect: Containers cannot be categorized
- [ ] Alerts
  > Incorrect: Can not be categorized just you can filtering using status or severity
- [x] Virtual Machines
  > Correct: Can be categorized for policies and grouping
- [x] ISO Images
  > Correct: ISO Images can be categorized

Explain: Virtual Machines and ISO Images can be categorized. Within Nutanix, categories are used to organize and manage entities, and virtual machines (VMs) and ISO images are among the entities that can be categorized. This allows for easier management and automation, especially in larger environments.

### mci-data-protection-yabm
domain: data-protection
difficulty: 3

Q: An administrator is configuring a replication schedule on multiple remote locations deployed using a single-node cluster. The goal is to achieve the lowest possible RPO (Recovery Point Objective). How should the administrator configure the replication schedule?
- [ ] Configure NearSync replication
  > Incorrect: explicitly unsupported for single-node clusters.
- [ ] Configure a schedule for 16 minutes up to 59 minutes
  > Incorrect: Not the lowest RPO
- [x] Configure Async replication
  > Correct: Async replication inherently offers a lower RPO (6 hours) than any other supported option on a single-node cluster.
- [ ] Configure a schedule for 1 minute up to 15 minutes
  > Incorrect: explicitly unsupported for single-node clusters.

Explain: Nutanix documentation emphasizes the limitations of single-node clusters regarding Recovery Point Objective (RPO). While NearSync replication might seem configurable through Prism Central, it's not supported on single-node clusters. The lowest supported RPO for a single-node cluster is 6 hours, achieved through asynchronous replication. Therefore, to achieve the lowest supported RPO on a single-node cluster, the administrator must configure Async replication. It's crucial to prioritize supported configurations for reliability and stability.

### mci-vms-3902
domain: vms
difficulty: 3

Q: What can be used to easily group a set of VMs?
- [ ] Labels
  > Incorrect: Not a Nutanix grouping method
- [ ] Projects
  > Incorrect: Used for access control, not grouping
- [x] Categories
  > Correct: Used for VM grouping and policy enforcement
- [ ] Catalog Items
  > Incorrect: Used in self-service, not grouping

Explain: Categories can be used to group VMs, which simplifies management tasks. Another approach is to use VM-Host affinity policy to tie a VM to a specific host or group of hosts. A VM-VM anti-affinity policy can also be employed to keep selected VMs on different hosts to increase availability and resiliency.

### mci-vms-6r5q
domain: vms
difficulty: 3

Q: An administrator wants to create a VM with memory overcommit features enabled in Nutanix cluster. Which statement best describes how the administrator will perform this VM creation?
- [x] Memory overcommit can only be updated using the Prism Central console.
  > Correct:  Enable memory overcommit on a VM that you create by using Prism Central.
- [ ] Memory overcommit cannot be enabled for VM from the Prism Central console.
  > Incorrect: Prism Central allows enabling memory overcommit.
- [ ] Memory overcommit can be enabled while creating a VM using Prism Element Web Console.
  > Incorrect: You cannot enable the memory overcommit feature using the Prism Element Web Console
- [ ] Memory overcommit can only be updated using the Prism Element Web Console once VM created.
  > Incorrect: can be set at creation or updated later.

Explain: You cannot enable the memory overcommit feature using the Prism Element Web Console. Enable memory overcommit on a VM that you create by using Prism Central. If you create a VM using Prism Web Console, then you can enable memory overcommit on that VM using Prism Central. Resources

### mci-vms-or58
domain: vms
difficulty: 3

Q: Which feature deploys a temporary VM that allows an administrator to log in and apply operating system patches to a VM template?
- [ ] Create VM from Template
  > Incorrect: This creates a new VM but does not allow patching an existing template.
- [ ] Complete Guest OS Update
  > Incorrect: This is used to update the guest OS of a deployed VM.
- [ ] Update Configuration
  > Incorrect: This updates configuration settings but does not deploy a temporary VM.
- [x] Update Guest OS
  > Correct: This feature creates a temporary VM to apply patches to a VM template.

Explain: The Guest OS update feature deploys a temporary VM named "VmTemplateVM-update-guest-os-". This allows an administrator to log in, apply OS patches, and other software updates to the temporary VM. After the updates are completed, a new template version is created. The temporary VM is then automatically deleted.

### mci-lifecycle-v2rt
domain: lifecycle
difficulty: 4

Q: Which two URLs must be accessible from a Connected Site's Controller VMs to allow Life Cycle Manager to download software updates?
- [x] download.nutanix.com
  > Correct: This is the main source for software downloads.
- [ ] mynutanix.com
  > Incorrect: This is used for Nutanix account management, not software downloads.
- [x] release-api.nutanix.com
  > Correct: This provides metadata about available software updates.
- [ ] portal.nutanix.com
  > Incorrect: This is a general portal but not used for LCM updates.

Explain: download.nutanix.com and release-api.nutanix.com are the two URLs that must be accessible. The first URL is the primary location for LCM software updates, while the second provides metadata about the updates.

### mci-lifecycle-cfr6
domain: lifecycle
difficulty: 3
image: images/a2q45.jpg

Q: Refer to the exhibit. An administrator notices the Message shown in the exhibit when navigating to LCM from Prism Central. Which action should they take to update LCM to the latest version?
- [ ] Run an AOS upgrade.
  > Incorrect: This updates the Acropolis Operating System but does not update LCM directly.
- [ ] Run an AHV upgrade.
  > Incorrect: This upgrades the hypervisor but does not update LCM.
- [x] Perform an Inventory Scan.
  > Correct: This scans for available updates and is a required step before applying LCM updates.
- [ ] Download and install the latest LCM version from a CVM.
  > Incorrect: This is not the standard method for updating LCM.

Explain: Performing an Inventory Scan is the correct action. Within Prism Central, an administrator navigates to the LCM page and selects Inventory then Perform Inventory. This action allows LCM to check for updates, download the necessary files, and then apply the LCM update.

### mci-data-protection-muvf
domain: data-protection
difficulty: 3

Q: An administrator configured Metro Availability for a Protection Domain but sees a warning: "VM-1 is accessing data from a remote cluster." What should they do first?
- [ ] Run an ncli command to check active roles.
  > Incorrect: This provides diagnostic information but does not fix the issue.
- [ ] Use must-affinity rules to prevent automated VM migration.
  > Incorrect: This ensures VMs do not move to remote sites unintentionally.
- [x] Migrate the VM to its primary site and set proper rules for DRS and affinity.
  > Correct: This restores correct data locality and prevents unnecessary remote access.
- [ ] Run an NCC health check for data locality.
  > Incorrect: This checks for data locality issues but does not directly resolve them.

Explain: The warning "VM-1 is accessing data from a remote cluster" within a Metro Availability Protection Domain setup indicates that the VM is running on the standby site while its data resides on the active site. This situation can severely impact performance. The provided text from Metro High Availability explains this exact scenario and recommends migrating the VM back to its primary site. It also mentions updating DRS (Distributed Resource Scheduler) rules and affinity rules to prevent this from happening again. Must-affinity rules ensure that a VM runs on the specified site while other settings in DRS influence placement decisions.

### mci-data-protection-k99t
domain: data-protection
difficulty: 3

Q: An administrator needs to set up a protection policy in preparation for a regular Disaster Recovery (DR) test. What is the first step required to satisfy this task?
- [ ] Install NGT (Nutanix Guest Tools) on VMs where applications are supported.
  > Incorrect: NGT provides additional VM functionality but is not required for setting up a DR policy.
- [x] Create an Availability Zone between Production and DR.
  > Correct: Availability Zones define where workloads can be protected and recovered.
- [ ] Convert the source cluster to AHV.
  > Incorrect: AHV is not a requirement for setting up DR.
- [ ] Create a point-in-time snapshot of source VMs.
  > Incorrect: Snapshots are part of data protection but not the first step in a DR policy.

Explain: The correct first step is to create an Availability Zone between the Production and DR sites to define the scope of protection.

### mci-vms-rlje
domain: vms
difficulty: 2

Q: What is required to create a category in Nutanix?
- [x] A name and a value
  > Correct: Categories require only a name, while values are optional.
- [ ] A policy and an entity
  > Incorrect: Policies and entities do not define categories.
- [ ] A service and a scope
  > Incorrect: Services and scopes are unrelated to category creation.
- [ ] A catalog and a template
  > Incorrect: Catalogs and templates are used for application deployment, not categories.

Explain: Categories in Nutanix are created using a name and a value. The name is required, while the value is optional. They function as tags, allowing you to apply policies to multiple entities at once. For example, you could create a category named "Department" with values like "Marketing", "Sales", or "Engineering". Then, you could create a protection policy applied to all VMs with the category "Department:Sales". As new VMs are added and assigned the "Department:Sales" category, they automatically inherit the associated protection policy.

### mci-lifecycle-2vzt
domain: lifecycle
difficulty: 3

Q: An administrator started an LCM upgrade of the AHV hosts in Nutanix Cluster and realized that the upgrade would exceed the planned maintenance window. The administrator would like to prevent further updates at this point. Which feature should be leveraged to prevent additional updates from occurring?
- [ ] Cancel the LCM tasks via the Ergon command line (ecli).
  > Incorrect: This method is more complex and not the preferred approach.
- [ ] Run the lcm_task_cleanup.py script.
  > Incorrect: This script cleans up LCM tasks but does not stop an active update.
- [ ] Restart Genesis on the cluster to restart the LCM service.
  > Incorrect: Restarting Genesis could disrupt other services and is not the best approach.
- [x] Use the Stop Update feature in LCM.
  > Correct: LCM provides a built-in Stop Update feature to pause ongoing upgrades.

Explain: The correct approach is to use the "Stop Update" feature within LCM. This feature allows an administrator to pause an ongoing upgrade process gracefully, preventing any further updates from occurring and allowing the upgrade to be resumed later.

### mci-data-protection-uvq8
domain: data-protection
difficulty: 4
image: images/a2q50.png

Q: An administrator is trying to configure Metro Availability between Nutanix ESXi-based clusters. However, the Compatible Remote Sites screen does not list all required storage containers. Which two reasons could be a cause for this issue? (Choose two.)
- [ ] Source and destination hardware are from different vendors.
  > Incorrect: Different vendor hardware does not affect Metro Availability compatibility.
- [ ] The remote site storage container has compression enabled.
  > Incorrect: Compression does not affect Metro Availability compatibility. However, it is recommended to keep compression settings aligned between sites.
- [x] The destination storage container is not empty.
  > Correct, The destination storage container must be empty. Metro Availability requires a clean storage container at the secondary site to receive data. If the container already contains data, it cannot be used.
- [x] Both storage containers must have the same name.
  > Correct, The storage containers must have the same name. This ensures that replication and failover work seamlessly. If the names do not match, the storage containers will not be listed as compatible.

Explain: The administrator must ensure the following: The remote site's storage container has the same name as the local storage container. The remote site is configured to support Metro Availability. The transmission latency between the clusters is less than 5ms. The remote Site storage container is empty

### mci-data-protection-gi2l
domain: data-protection
difficulty: 3

Q: An administrator has successfully configured a Metro Availability protection domain. After a couple of days, the following NCC warning is raised: Detailed information for data_locality check: Node x.x.x.20: Following VMs are accessing data from remote clusters VM-1 from remote cluster Remote-m1 Refer to KB 2093 for details on data locality check What is the first action an administrator must take to fix the issue?
- [ ] Run command neli pd la metro-avail-true legrep "Protection Domain Stretch Role" Igrep -B2 "ACTIVE" 1grep "Protection Domain".
  > Incorrect: This command retrieves information about the protection domain's stretch role and active site, but it doesn't fix the underlying data locality issue.
- [ ] Use "must" affinity rules to avoid automated VM migration to the standby datastore.
  > Incorrect: While using "must" affinity rules can help prevent unwanted migrations after the VM is on the correct site, it doesn't address the current problem of the VM already being on the wrong site.
- [ ] Run command nec health checks metro_availability_checks data_locality check --cvm_list-X.X.X.20.
  > Incorrect: This command checks data locality health. This command merely rechecks the data_locality health check for the specified CVM; it doesn't resolve the issue.
- [x] Migrate the VM to its primary site and set appropriate rules for DRS and affinity.
  > Correct: Migrating the VM and setting rules can resolve data locality issues.

Explain: The NCC warning data_locality check indicates that VM-1 is accessing data from a remote cluster, which is causing performance issues. The first step to address this is to migrate the VM back to its primary site and then configure appropriate affinity or DRS rules to prevent it from migrating to the standby datastore again. This corresponds to option '4'.

### mci-networking-53cr
domain: networking
difficulty: 3

Q: A Linux VM provides services for multiple clients on a single large subnet. The number of clients varies over time. The clients consist of VMs and physical systems. The administrator observed network performance problems on the Linux VM when going over 2,000 client connections. Which action can be performed to mitigate the issue?
- [ ] Add multiple VNIC to the virtual machine.
  > Incorrect: While adding multiple virtual network interface controllers (VNICs) can enhance network throughput, it is typically relevant in multi-VLAN scenarios (especially with Nutanix Files servers) and requires careful configuration at both the VM and hypervisor levels. It doesn't directly address the problem of handling a large number of client connections on a single subnet.
- [ ] Configure vNIC to operate in trunk mode.
  > Incorrect: Trunk mode is used for handling multiple VLANs on a single VNIC, not for improving performance with many clients on one subnet. It's more relevant for network segmentation than addressing connection limits.
- [x] Enable RSS VirtIO-Net Multi-Queue.
  > Correct: RSS Multi-Queue can improve network performance.
- [ ] Change VirtIO-Net vNIC to e1000 model.
  > Incorrect: Switching to the e1000 model is generally discouraged. VirtIO drivers are typically more modern and performant than e1000.

Explain: Receive Side Scaling (RSS) with VirtIO multi-queue enables the Linux virtual machine (VM) to utilize multiple CPUs (vCPUs) for network processing. This distributes the workload, improving performance, especially with a high number of client connections (like the 2000 connections causing the issue). Documentation specifically mentions this as a solution for improving network performance in network I/O-intensive applications on AHV VMs.

### mci-data-protection-qqjj
domain: data-protection
difficulty: 3

Q: An administrator is configuring a protection domain for business critical applications, including SQL, Oracle, and Exchange. The administrator needs to evaluate the requirements and limitations for application-consistent snapshots. What action should the administrator take while configuring application-consistent snapshots?
- [ ] Ensure that Windows VMs have in-guest mounted VHDX disks.
  > Incorrect:  While in-guest mounted VHDX disks might be present in some virtual machine (VM) configurations, this is not a requirement for application-consistent snapshots. The provided context doesn't mention this as a necessary condition.
- [ ] Configure one consistency group for all VMs comprising an App.
  > Incorrect:  While it's common practice to group related VMs into a single consistency group for applicationconsistency, it's not a strict requirement to have all VMs of an application in one group. Separate consistency groups might be used depending on the application's architecture and recovery requirements.
- [ ] Configure one consistency group for each VM.
  > Incorrect: Configuring a separate consistency group for each VM is not necessary for application-consistent snapshots and can add unnecessary complexity. It defeats the purpose of a consistency group, which is to ensure data consistency across multiple VMs related to an application.
- [x] Select application consistent snapshot checkbox in consistency group settings only.
  > Correct: This option ensures application consistency.

Explain: Application-consistent snapshots are enabled at the consistency group level. This setting coordinates with the Nutanix Guest Tools (NGT) on the VMs within the group to quiesce applications before the snapshot, ensuring data consistency. The information regarding an application-consistent snapshot failing due to an outdated NGT version further supports this point.

### mci-lifecycle-4t5z
domain: lifecycle
difficulty: 3
image: images/a2q54.png

Q: An administrator is attempting to upgrade the NIC firmware on a Nutanix cluster and sees the error displayed in the exhibit. Which log is the most appropriate to analyze the LCM precheck failure?
- [ ] genesis.out
  > Incorrect: While this log file might contain some information related to the Life Cycle Management process, the documentation primarily associates it with the download phase and Cassandra service issues, not Network Interface Card firmware upgrade precheck failures. A Jira ticket mentions moving precheck logging out of genesis.out, further diminishing its relevance in this context.
- [x] lcm_ops.out
  > Correct: The provided context clearly points to lcm_ops.out as the correct log file for analyzing Life Cycle Management (LCM) precheck failures during Network Interface Card (NIC) firmware upgrades.
- [ ] lcm_wget.out
  > Incorrect: These log files are not mentioned in the provided context in relation to Life Cycle Management precheck failures for Network Interface Card firmware upgrades, making them less suitable choices for troubleshooting this specific issue.
- [ ] catalog.out
  > Incorrect: These log files are not mentioned in the provided context in relation to Life Cycle Management precheck failures for Network Interface Card firmware upgrades, making them less suitable choices for troubleshooting this specific issue.

Explain: The provided context clearly points to lcm_ops.out as the correct log file for analyzing Life Cycle Management (LCM) precheck failures during Network Interface Card (NIC) firmware upgrades. The LCM Troubleshooting document explicitly recommends checking this log file, particularly for upgrade failures, and suggests searching for the term "Operation failed." Additionally, this document provides a specific example of a Network Interface Card firmware upgrade failure found within the lcm_ops.out log.

### mci-data-protection-x75r
domain: data-protection
difficulty: 4

Q: An administrator is protecting an application and its data stored on Volume Groups using protection domains. During failover tests, all application VMs are restored successfully, however, the application data is completely missing. In which two ways can the protection domain configuration be adjusted to avoid this issue in the future? (Choose two.)
- [ ] Place Volume Groups in a separate Protection Domain.
  > Incorrect: Separate protection domains can ensure data protection.
- [x] Select the Auto protect related entities checkbox.
  > Correct : This option ensures that any entities related to the protected VMs, including VGs, are automatically included in the protection domain. This prevents accidental exclusion of the VGs from protection and ensures their data is also replicated during failover.
- [ ] Use application consistent snapshots.
  > Incorrect: Application consistent snapshots can ensure data protection.
- [x] Manually add Volume Groups to Protected Entities.
  > Correct: If "Auto protect related entities" isn't used, explicitly adding the VGs to the protected entities list within the protection domain configuration guarantees they are included in the protection and recovery process. This provides direct control over which VGs are protected, especially useful in complex environments.

Explain: To avoid application data loss after restoring application VMs during failover tests, ensure the Volume Groups (VGs) containing the application data are included in the protection domain. There are two ways to achieve this: Select "Auto protect related entities": This automatically includes VGs associated with the protected VMs in the protection domain, ensuring their data is replicated. Manually add VGs to protected entities: This gives explicit control, guaranteeing the necessary VGs are protected even if "Auto protect related entities" is not enabled. This is useful for complex environments.

### mci-architecture-99yk
domain: architecture
difficulty: 3

Q: In Prism Element, how many nodes can be placed into maintenance mode at one time on a 12-Node FT2 cluster?
- [x] 1
  > Correct: Only one node is the recommanded to be placed into maintenance mode at a time on a 12-node FT2 cluster.
- [ ] 2
  > Incorrect: While theoretically possible in some clusters, placing two nodes in maintenance mode simultaneously on an FT2 cluster significantly impacts performance and availability. It is generally not recommended.
- [ ] 3
  > Incorrect: Placing three nodes in maintenance mode concurrently on an FT2 cluster is highly inadvisable. It drastically reduces redundancy and risks data loss, especially with a replication factor of 2.
- [ ] 4
  > Incorrect: Putting four nodes in maintenance mode at the same time on an FT2 cluster is not supported and would severely compromise cluster functionality and data availability.

Explain: Only one node can be placed into maintenance mode at a time on a 12-node FT2 cluster. The other options are incorrect because placing multiple nodes in maintenance mode concurrently would negatively impact cluster performance, availability, and redundancy.

### mci-vms-ndhx
domain: vms
difficulty: 3

Q: What happens when a VM is associated with multiple VM-Host affinity policies?
- [ ] The VM is automatically removed from all policies.
  > Incorrect: This option is not correct.
- [ ] The newest policy takes precedence.
  > Incorrect: The newest policy will not take precedence over others.
- [x] The oldest policy is applied.
  > Correct: The oldest policy is applied.
- [ ] All policies are applied simultaneously.
  > Incorrect: All policies cannot be applied simultaneously.

Explain: While the provided documentation primarily focuses on VM-Host affinity and VM-VM anti-affinity, it explains that if a VM is part of multiple VM-Host affinity policies, the oldest policy is applied, and the VM is shown as non-compliant for the rest. This implies that all policies are evaluated and applied simultaneously, even if only the oldest one actively governs VM placement.

### mci-vms-m3zr
domain: vms
difficulty: 3

Q: Which task should be performed first when upgrading host memory?
- [x] Place node into the maintenance mode.
  > Correct: This step should only be performed after the node is in maintenance mode and all VMs have been successfully migrated. Shutting down the host before migrating VMs would cause an outage for those workloads and trigger a high-availability (HA) event.
- [ ] Gracefully stop the host by using the out of band management interface.
  > Incorrect: Executing this as the first step would abruptly power off all VMs running on that host, causing an outage and potential data corruption. This command should only be run after the node has been successfully placed into maintenance mode.
- [ ] Remove node from the cluster.
  > Incorrect: This is an incorrect and disruptive action for temporary maintenance. Removing a node is a permanent action that tells the cluster the node is not coming back. This would cause the cluster to re-replicate all data that was on that node, creating unnecessary network traffic and I/O load.
- [ ] Execute "shutdown -h now" from the AHV command line interface.
  > Incorrect: Similar to option 2, this command shuts down the host. Executing this as the first step would abruptly power off all VMs running on that host, causing an outage and potential data corruption. This command should only be run after the node has been successfully placed into maintenance mode.

Explain: For any hardware upgrade (like adding memory), the proper first step is to Placing a node into maintenance mode gracefully live-migrates all running virtual machines (VMs) to other available hosts in the cluster. The second step is to shutdown the AHV host.

### mci-vms-r8it
domain: vms
difficulty: 3

Q: What will occurs if an agent VM is powered off and then manually started on another host?
- [ ] Agent VM become unresponsive.
  > Incorrect: The Agent VM will power on and function normally on the new host. Manually starting it on a different host is a supported action, although it permanently changes the VM's host affinity.
- [x] Agent VM cannot be migrated back to the original host.
  > Correct: Once the Agent VM is powered on and running on the new host, it permanently resides there. It will not automatically migrate back. While you could manually power it off again and restart it on the original host, the system itself will not initiate or facilitate a "migration back." For all intents and purposes, its affinity has changed to the new host.
- [ ] Agent VM migrates back to the original host once it's powered on.
  > Incorrect: The system does not automatically move the Agent VM back to its original location. The manual start on a new host overrides its previous host pinning. The defining behavior of an Agent VM is that it stays on its designated host unless an administrator manually intervenes while it is powered off.
- [ ] Agent VM migrates to another host automatically
  > Incorrect: Agent VMs are specifically excluded from automatic migration, which is why Live Migration is disabled for them. They are designed to be non-migratable to ensure they remain on a specific host to perform their function (e.g., traffic mirroring). Any movement must be a deliberate, manual action performed while the VM is off.

Explain: An agent VM in a Nutanix AHV environment is a special type of virtual machine that is pinned to a specific host. This feature is used for VMs that provide essential services to a host and must not move, such as virtual firewalls, network monitoring tools, or certain service VMs. The key behaviors of an agent VM are: - No Live Migration: Agent VMs cannot be live-migrated. - No Automatic Migration: They are not automatically migrated during HA events or when a host enters maintenance mode. Instead, they are powered off and will only be powered back on once their designated host becomes available again. 3 sources - Host Affinity: They have a strong affinity to the host they are running on. The scenario in the question describes a specific manual override. While an agent VM won't move automatically, an administrator can manually move it while it is powered off. The procedure is: 1 Power off the agent VM. 2 Manually start the VM on a different host using the command line (acli vm.on <vm_name> host=<new_host>). When this is done, the agent VM's affinity is reset. It "forgets" its original host and becomes permanently associated with the new host. It will now operate as an agent VM on this new host and will not automatically migrate back.

### mci-monitoring-4tsq
domain: monitoring
difficulty: 3

Q: An administrator has been assigned to monitoring performance across a number of different entities in the Nutanix cluster. The CIO has tasked the administrator to provide Analysis charts that show performance as granularly as possible. What is the smallest preset time interval (in hours) that the administrator can select in a Metric or Entity Chart?
- [x] 1
  > Correct: The "Last 1 hour" option is a standard preset in the Analysis dashboard for viewing performance graphs. It provides the highest level of granularity by displaying data points collected at very frequent intervals (e.g., every 30 seconds), allowing for detailed, near-real-time performance analysis.
- [ ] 3
  > Incorrect: While the Analysis dashboard is flexible, "Last 3 hours" is a preset time range, but it is not the smallest available. It offers a granular view, but less so than the 1-hour option.
- [ ] 12
  > Incorrect: A 12-hour view provides a broader look at performance trends over half a day. While useful for identifying patterns, it is far less granular than the 1-hour interval and would not meet the CIO's request for the most detailed view possible.
- [ ] 24
  > Incorrect: The "Last 24 hours" option is a standard preset for viewing daily performance. As the time range increases, the interval between data points shown on the chart also increases to keep the chart readable, meaning it is less granular than shorter time frames.

Explain: When monitoring performance in Nutanix using Metric or Entity charts, the goal of achieving the most granular view possible means selecting the smallest available time interval. The Analysis dashboard provides several preset time ranges for viewing performance data. Based on the available documentation, the smallest preset time interval you can select in the Analysis dashboard is 1 hour. This option provides the most detailed and granular view of performance metrics over a short period, which is exactly what the CIO has requested.

### mci-monitoring-ohe2
domain: monitoring
difficulty: 2

Q: What is the Nutanix tool provides real-time insights and anomaly detection for a Nutanix environment?
- [ ] NCC (Nutanix Cluster Check)
  > Incorrect: NCC is a health-check framework used to diagnose the health of a cluster at a specific point in time.
- [ ] Insights
  > Incorrect: This option is partially correct but less precise than Prism Central. Nutanix Insights is a service that augments product support by securely transmitting system-level diagnostic data for predictive health analysis and faster issue resolution.
- [x] Prism Central
  > Correct: This is the correct answer. Prism Central's advanced capabilities include anomaly detection, capacity planning, and operational task automation. It intelligently plans and optimizes capacity, proactively identifies performance deviations from the baseline, and offers advanced application insights for troubleshooting.
- [ ] LCM (Life Cycle Manager)
  > Incorrect:  LCM is a tool designed to manage and perform one-click upgrades for all software and firmware within the Nutanix stack.

Explain: The Nutanix tool that provides real-time insights and anomaly detection is Prism Central, especially when licensed with tiers that enable Intelligent Operations. Prism Central serves as the centralized management plane for a Nutanix environment and uses machine learning to proactively detect performance anomalies, provide operational insights, and help troubleshoot infrastructure issues. While other tools play a role in the health and management of the cluster, Prism Central is the primary platform for this specific set of advanced analytical capabilities.

### mci-data-protection-bajr
domain: data-protection
difficulty: 3

Q: An administrator has been assigned to developing a Prism Central Recovery Plan for 50 workloads that will be assigned new IP addresses and will need to utilize a new DNS server upon instantiation of workloads in the Disaster Recovery (DR) location. Which best way to accomplish this?
- [x] Install Nutanix Guest Tools, this will allow Re-IP and automatically assign updated DNS server(s).
  > Correct: To allow a Recovery Plan to automatically change the IP address of a VM, NGT must be installed on the guest OS.
- [ ] Enable scripting within Recovery Sequence & utilize custom script per VM.
  > Incorrect: This is a possible but less efficient method. Recovery Plans do support the execution of custom in-guest scripts after a VM powers on.
- [ ] Utilize recovery Plan to bring VMs online at DR and then manually login to each VM and update IP/DNS.
  > Incorrect: This option is highly impractical and defeats the purpose of orchestration. Manually logging into 50 VMs to change network settings would be extremely time-consuming, prone to human error, and would significantly increase the Recovery Time Objective (RTO). The goal of a Recovery Plan is to automate the failover process as much as possible to minimize downtime and manual effort.
- [ ] Update DNS settings on production VMs prior to execution of Recovery Plan.
  > Incorrect: Changing the DNS settings on the production VMs before the failover would break their ability to communicate properly in the production environment. Network changes should only be applied to the VMs after they have been failed over and started at the DR location.

Explain: The best way to automate the assignment of new IP addresses and DNS servers for 50 workloads during a failover is to install Nutanix Guest Tools (NGT) on the VMs and configure IP address management within the Recovery Plan. NGT is an in-guest agent that allows Prism Central to communicate directly with the guest operating system. This capability is essential for the Recovery Plan to automatically change a VM's network settings, such as its static IP address, upon failover to the DR site. This method is the most scalable and efficient, as it centralizes the network configuration within the Recovery Plan's network mapping settings, eliminating the need for manual intervention or complex scripting for each VM.

### mci-lifecycle-dpfy
domain: lifecycle
difficulty: 3

Q: What would cause an LCM framework invokes the pre-check test_esx_entering_mm_pinned_vms check during an AOS upgrade?
- [ ] HA priority settings are misconfigured.
  > Incorrect. High Availability (HA) priority settings determine which VMs are given precedence for restarting on other hosts after a host failure. This does not prevent a VM from being migrated off a host that is entering maintenance mode for an upgrade.
- [ ] Host has insufficient memory.
  > Incorrect. If other hosts in the cluster lack sufficient memory to accommodate a migrated VM, a different pre-check related to resource availability would fail. The test_esx_entering_mm_pinned_vms check is specific to VMs that are "pinned" and cannot be moved, regardless of resource availability elsewhere.
- [ ] VMs on the host have high CPU usage.
  > Incorrect. High CPU usage on a VM does not prevent it from being live-migrated by DRS (Distributed Resource Scheduler). The migration might be momentarily intensive, but it is a standard operation and would not cause this specific pre-check to fail.
- [x] Affinity rules are configured to prevent VM migration.
  > Correct: The LCM pre-check test_esx_entering_mm_pinned_vms is specifically designed to identify VMs on an ESXi host that cannot be migrated, which would block the host from entering maintenance mode. A primary reason for a VM to be "pinned" is the presence of a VMware DRS affinity rule that requires the VM to run on a specific host or group of hosts. During an upgrade, LCM needs to evacuate all VMs from the host being updated. If an affinity rule prevents a VM from moving, the host cannot enter maintenance mode, and the LCM pre-check fails to prevent the upgrade from stalling.

Explain: The Nutanix Life Cycle Manager (LCM) automates software and firmware upgrades in a non-disruptive, rolling fashion. A critical part of this process is placing one host at a time into maintenance mode. For this to succeed, all user virtual machines (VMs) running on that host must be migrated to other hosts in the cluster. The LCM pre-check test_esx_entering_mm_pinned_vms fails when there are VMs on a host that cannot be automatically migrated to another host. During an upgrade, LCM needs to put each host into maintenance mode, which requires evacuating all running VMs. If a VM is "pinned" to its current host for any reason, the host cannot enter maintenance mode, and the upgrade process is halted to prevent failure. The most common reason for a VM to be pinned in this way is the presence of an affinity rule that restricts its movement.

### mci-vms-7y49
domain: vms
difficulty: 2

Q: What is the Nutanix product used for automating application deployment across clouds?
- [x] Self-Service
  > Correct: Nutanix Self-Service is an application lifecycle management and automation framework. It uses "Blueprints," which are pre-defined templates that model all the components and dependencies of an application.
- [ ] Flow
  > Incorrect. Nutanix Flow is a software-defined networking and security product. Its main purpose is to provide microsegmentation to secure application traffic (East-West traffic) within the datacenter and protect against network threats. While it is critical for securing deployed applications, it does not automate the deployment of the applications themselves.
- [ ] Prism Central
  > Incorrect. Prism Central is the centralized management plane for the Nutanix Cloud Platform. It provides a single interface for managing multiple Nutanix clusters, VMs, and services. While it is the platform where Nutanix Self-Service is enabled and operates, its core function is infrastructure management, monitoring, and operations, not multi-cloud application deployment automation.
- [ ] NKP
  > Incorrect. NKP is an enterprise-grade platform for deploying, managing, and scaling containerized applications using Kubernetes. It simplifies the entire lifecycle of Kubernetes clusters. While it automates the deployment of containerized applications on the Nutanix platform, its focus is on Kubernetes orchestration rather than automating traditional VM-based applications across hybrid and multi-cloud environments.

Explain: The key to this question is identifying the tool designed for application automation across different clouds. While all the listed products are part of the Nutanix portfolio, they serve distinct purposes: - NKP focuses specifically on automating container and Kubernetes cluster management. - Flow is centered on network security and microsegmentation. - Prism Central is the overarching management console for the infrastructure. Nutanix Self-Service (Calm) is the only product designed with multi-cloud application automation as its core function. It allows you to create a single blueprint that can deploy a complex, multi-tier application on your on-premises Nutanix cluster or in a public cloud. It orchestrates the entire process—from provisioning VMs and installing software to configuring network rules and scaling—providing a true application-centric automation solution for hybrid and multi-cloud environments.

### mci-performance-zfpl
domain: performance
difficulty: 4

Q: An administrator has assigned to plan for new project-related growth. New project workload requirements have been included for a cluster named HQ_Prod Cluster: - 2 Medium Sized SQL Servers - 10 VMs with 16Gb RAM, 4 vCPU, 100GB Storage Which two additional information items should be added to the capacity planning scenario to provide a proper capacity runway expectation? (Choose two.)
- [ ] Storage compression ratio(s) for new workload
  > Incorrect: Knowing the expected compression ratio for the new workloads would help you forecast the actual storage consumption more accurately, as Nutanix storage efficiency features can significantly reduce the physical capacity used.
- [x] Date(s) workload(s) will be added
  > Correct: This is a correct and critical piece of information. A capacity runway is a forecast over time. You already know the what (the new VMs), but you must also know the when. The date the workloads are deployed determines at what point on the timeline the new resource consumption will occur. Without a date, you can only calculate if the new workloads will fit right now, but you cannot create a runway forecast that shows you how many days/months/years you have left.
- [x] Existing cluster hardware specifications
  > Correct: This is the second correct and critical piece of information. To plan for adding new workloads, you must first know the total resource capacity of the cluster they are being added to. The hardware specifications (number of nodes, CPU type/cores, total memory, and total storage) define the upper limit of your available resources. Without knowing your starting capacity, you cannot determine the impact of adding new workloads or calculate how much "room" is left.
- [ ] Change in Demand percentage
  > Incorrect: "Change in Demand" is a feature in Nutanix capacity planning that allows you to model organic growth over time (e.g., "I expect my existing workloads to grow by 10% every quarter").

Explain: The goal of capacity planning is to determine when you will run out of resources based on current consumption, known future additions, and growth trends. This is often visualized as a "capacity runway"—the amount of time you have left before a resource (CPU, memory, or storage) is exhausted. To calculate a time-based runway, you need two fundamental types of information: - What is the current capacity? You need to know the total resources available in the cluster. - When will new resources be consumed? Knowing the size of new workloads is not enough; you must know when they will be added to accurately predict their impact on the runway. Given the options, the two most critical pieces of additional information required are: 1 Existing cluster hardware specifications: This tells you the total capacity you are starting with. 2 Date(s) workload(s) will be added: This places the new consumption on a timeline, which is essential for calculating a "runway" (a measure of time).

### mci-data-protection-u701
domain: data-protection
difficulty: 3

Q: An administrator have two clusters registered to two different Prism Central instances. After configuring a Protection Policy for synchronous replication and verifying data replication, the administrator would like to create a new Recovery Plan with automatic failover. However, the administrator finds that the Recovery Plan workflow offers only manual failure execution mode. What configuration must be fixed to execute the failover automatically?
- [ ] Verify protected VM are not already part of another Recovery Plan.
  > Incorrect: While a VM can only be part of one protection method at a time, this is not the reason the automatic failover option is missing.
- [ ] Protection Policy must also have a local schedule.Z.
  > Incorrect. A local schedule is for creating local snapshots on the primary cluster for backup purposes and is not a prerequisite for configuring the failover type (manual vs. automatic) in a Recovery Plan using synchronous replication.
- [ ] Modify firewall to open 2030, 2036, 2073, 2090 ports on every local and remote CVM5.
  > Incorrect. While correct firewall ports are essential for replication traffic to work at all, they do not determine the availability of the automatic failover option in the Recovery Plan user interface.
- [x] Primary Location and Recovery Location must be in the same AZ.
  > Correct. The critical requirement for automatic failover with synchronous replication is that both the source and destination clusters are part of the same Availability Zone, which means they must be registered to and managed by the same Prism Central.

Explain: When using synchronous replication (Metro Availability) with Nutanix Disaster Recovery, the option for an automatic unplanned failover in a Recovery Plan is only available when both the primary and recovery clusters are managed by the same Prism Central instance. This means they must reside within the same Availability Zone (AZ). In your scenario, the two clusters are registered to two different Prism Central instances. By definition, this creates two separate Availability Zones. Deployments that span multiple AZs do not support automatic failover for synchronous replication; only manual failover is possible. To fix this and enable automatic failover, both clusters would need to be unregistered from their respective Prism Central instances and then registered to a single, shared Prism Central instance.

### mci-data-protection-w3w1
domain: data-protection
difficulty: 2

Q: What is the main function of NearSync Replication in Nutanix?
- [ ] Backs up VM snapshots to external cloud storage
  > Incorrect. This describes a function of Nutanix Mine or integration with third-party backup solutions that can tier snapshots to S3-compatible storage or public clouds. NearSync is a disaster recovery feature for replicating between Nutanix clusters, not for long-term backup to cloud object storage.
- [x] Replicates data with an RPO of less than 1 minute
  > Correct: NearSync Replication is a specific tier of Nutanix's disaster recovery solution designed to bridge the gap between asynchronous replication (minutes to hours RPO) and synchronous replication (zero RPO). It provides a Recovery Point Objective (RPO) of as low as 20 seconds, and typically less than one minute, making it ideal for protecting critical applications that can tolerate a very small amount of data loss but where synchronous replication is not feasible due to distance or network latency.
- [ ] Migrates workloads between clusters automatically
  > Incorrect. This describes an automatic failover, which is a feature of a Recovery Plan. While NearSync provides the replicated data needed for a failover, it is not the feature that performs the automatic migration itself. An automatic failover is a higher-level orchestration managed by Prism Central and requires a witness.
- [ ] Provides synchronous data replication with zero RPO
  > Incorrect. This describes Synchronous Replication (formerly Metro Availability). Synchronous replication ensures a zero RPO by writing data to both the primary and remote sites before acknowledging the write to the application. NearSync is, by definition, "nearly" synchronous, meaning there is a very small, but non-zero, RPO.

Explain: Nutanix offers a spectrum of data protection and disaster recovery options, each defined by its Recovery Point Objective (RPO), which is the maximum acceptable amount of data loss measured in time. 1 Asynchronous Replication (Hours/Minutes RPO): This is the traditional DR method where snapshots are taken on a schedule (e.g., every hour or every 15 minutes) and replicated to a remote site. The RPO is equal to the time between snapshots. 2 Synchronous Replication (Zero RPO): This provides the highest level of data protection. Every write is committed to both the local and remote clusters simultaneously before being acknowledged. This guarantees zero data loss (RPO=0) in a disaster but has strict requirements, such as very low network latency (typically <5ms round-trip time making it suitable only for sites in close proximity. 3 NearSync Replicationtion (Seconds/Sub-Minute RPO):** NearSync fills the critical gap between these two options. It allows for continuous replication of data with an RPO as low as 20 seconds (and configurable up to 15 minutes), making it a powerful option for protecting critical applications across longer distances where synchronous replication is not possible. It provides a much lower RPO than traditional asynchronous replication without the strict latency constraints of synchronous replication. Therefore, the main function and key benefit of NearSync is to provide a very low, sub-minute RPO for workloads that require aggressive data protection but cannot meet the requirements for a zero-RPO synchronous solution.

### mci-security-kohm
domain: security
difficulty: 3

Q: An administrator is receiving repeated approval requests to delete a protected snapshot from Nutanix Cluster that has already been approved. What is the likely cause of this problem?
- [ ] There is an error with the SMTP server.
  > Incorrect: An SMTP server is responsible for sending email notifications. If there were an error with the SMTP server, the administrator would likely not receive the approval request emails at all, or they would be delayed.
- [ ] The Policy Engine wasn't implemented.
  > Incorrect: If the Policy Engine were not implemented or configured, no approval would be triggered in the first place. The administrator could simply delete the snapshot without any request being generated.
- [x] The administrator is an approver on the approval policy.
  > This is the correct and most likely cause. Approval policies are often designed with a "separation of duties" principle, which prevents a user from approving their own actions. When the administrator initiates the deletion, the policy requires an approval.
- [ ] There are multiple approvers on the approval policy.
  > Incorrect: The presence of multiple approvers does not, by itself, cause a request to repeat after it has been approved. As long as the approval conditions are met (e.g., at least one person approves, or a quorum approves), the action should proceed.

Explain: The scenario describes a loop in an approval workflow. An administrator approves a request, but the request keeps reappearing as if it were never approved. This behavior typically points to a misconfiguration in the approval policy itself, specifically related to who is allowed to perform the action versus who is required to approve it. In many workflow systems, including those that might be used for managing protected data, a fundamental rule is that a user cannot approve their own requests. This is a common security and governance control to enforce separation of duties. In this case, the most probable cause is that the administrator who is trying to delete the snapshot is also listed as an approver in the policy that governs that action. When the administrator initiates the deletion, the policy engine sees that approval is required and sends a request. Since the administrator is also an approver, they approve it. However, the system detects this as a self-approval, which is often disallowed. It invalidates the approval and re-triggers the request, creating an endless loop of requests and approvals.

### mci-lifecycle-xty8
domain: lifecycle
difficulty: 3

Q: An administrator has an upcoming maintenance window scheduled . The administrator would like to minimize the chance of an upgrade failure during the maintenance window to ensure the updates will complete without issue. What action should the administrator take to reduce the risk of any potential failures during an upgrade?
- [ ] Reboot each CVM one-at-a-time to ensure the reboots are successful.
  > Incorrect: While this action helps confirm that Controller VMs (CVMs) can restart successfully, it is not as comprehensive as a full pre-check. It doesn't cover the wide range of health and stability checks that LCM performs.
- [x] Run an Upgrade Precheck from LCM.
  > Correct: This is the recommended action. It is an automated test that validates the cluster's health and readiness for an update. If it finds any critical issues, it stops the upgrade from starting, preventing a potential failure and allowing the administrator to fix the problems first.
- [ ] Reboot each host one-at-a-time to ensure the reboots are successful.
  > Incorrect: Similar to rebooting CVMs, this confirms host stability but is not a substitute for the thorough, automated checks performed by the LCM pre-upgrade process.
- [ ] Upgrade AOS to the latest version from LCM.
  > Incorrect: This is the goal of the maintenance activity itself, not a preparatory step to reduce risk. Attempting an upgrade without running pre-checks first would increase the chance of failure.

Explain: The best way to reduce the risk of an upgrade failure is to run an Upgrade Precheck from Life Cycle Manager (LCM). This built-in function performs a comprehensive health assessment of the cluster to find any underlying problems that could disrupt the upgrade. By running this check beforehand, an administrator can proactively address any discovered issues, ensuring a smoother and more successful update process during the planned maintenance window.

### mci-data-protection-b2lq
domain: data-protection
difficulty: 2

Q: What is the Nutanix feature to enable asynchronous replication for disaster recovery?
- [ ] Snapshots
  > Incorrect: This is partially correct but incomplete. Snapshots are the point-in-time copies of VMs that are replicated, but they are just the data component. The feature that orchestrates the creation, replication, and management of these snapshots for disaster recovery is the Protection Domain.
- [ ] Metro Availability
  > Incorrect. Metro Availability is Nutanix's feature for synchronous replication, which offers a zero Recovery Point Objective (RPO) by writing data to both sites simultaneously. The question specifically asks for the asynchronous replication feature.
- [ ] Prism Element
  > Incorrect. Prism Element is the management interface for a single Nutanix cluster. While you use Prism Element to configure Protection Domains, it is the management platform, not the replication feature itself.
- [x] Protection Domains
  > Correct: Protection Domains are the feature used to group VMs and define an asynchronous replication schedule to one or more remote sites for disaster recovery purposes. It is the fundamental building block for Nutanix's asynchronous DR solution.

Explain: The Nutanix feature that provides the framework to enable and manage asynchronous replication for disaster recovery is Protection Domains. A Protection Domain is a logical grouping of VMs and volume groups that you want to protect and replicate together to a remote Nutanix cluster. While snapshots are the underlying technology that captures the data at a point in time, Protection Domains are the management and policy construct used to schedule these snapshots and replicate them asynchronously to another site. This allows for a Recovery Point Objective (RPO) of one hour or more, making it a robust and widely-used solution for disaster recovery.

### mci-networking-i081
domain: networking
difficulty: 2

Q: What is the networking component in AHV responsible for providing network connectivity to virtual machines?
- [ ] RDMA
  > Incorrect: While Nutanix can use RDMA over Converged Ethernet (RoCE) for very high-speed, low-latency communication between nodes for storage traffic, it is not the component responsible for providing general network connectivity to guest VMs. It is a specialized storage fabric technology, not a general-purpose virtual networking component.
- [x] Virtual Switch (vSwitch)
  > Correct: The vSwitch is the core software-defined networking component in AHV. It functions as a layer-2 switch, managing network traffic for all VMs on a host. It forwards traffic between VMs, connects them to physical networks via uplink ports, and handles features like VLAN tagging and load balancing. All VM network traffic must pass through the vSwitch.
- [ ] Nutanix Files
  > Incorrect: Nutanix Files is a storage product that uses the network; it does not provide the underlying network connectivity to other virtual machines. It's an application-level service, not a foundational networking component.
- [ ] Controller VM (CVM)
  > Incorrect: While the CVM has a network interface and communicates heavily over the network for storage replication and cluster management, it is not responsible for switching or routing network traffic for guest VMs. Guest VM network traffic is handled directly by the vSwitch on the AHV host, bypassing the CVM for better performance and separation of concerns.

Explain: In Nutanix AHV, the networking component responsible for providing network connectivity to virtual machines is the Virtual Switch (vSwitch). Every AHV host contains a vSwitch, which is based on Open vSwitch (OVS). This vSwitch acts just like a physical switch but in software. It creates a logical network where virtual machines (VMs) can connect. The VM's virtual network interface cards (vNICs) are connected to ports on the vSwitch. The vSwitch then directs traffic between VMs on the same host and connects to the physical network through the host's physical network adapters (uplinks), allowing VMs to communicate with the rest of the network and the internet.

### mci-architecture-perf
domain: architecture
difficulty: 3

Q: List all hypervisors are officially supported by Nutanix for running virtualized workloads?
- [x] VMware ESXi, Microsoft Hyper-V, Nutanix AHV
  > Correct: Nutanix builds its platform to run on and support the three major enterprise hypervisors. This includes VMware ESXi, Microsoft Hyper-V, and its own native, license-free hypervisor, AHV.
- [ ] Citrix XenServer, KVM, Nutanix AHV
  > Incorrect. While Nutanix AHV is built upon a foundation that includes open-source components like KVM, Nutanix does not officially support running a generic, standalone KVM or Citrix XenServer as the hypervisor on its clusters. The supported KVM-based hypervisor is Nutanix's own hardened and integrated AHV.
- [ ] OpenStack, Proxmox, Nutanix AHV
  > Incorrect. Proxmox and OpenStack are not listed as officially supported hypervisors for running workloads directly on a Nutanix cluster. While Nutanix can integrate with OpenStack environments, it is not a supported hypervisor in the same way as ESXi, Hyper-V, or AHV.
- [ ] Red Hat Enterprise Virtualization, VMware ESXi, KVM
  > Incorrect. Similar to the other options, Nutanix does not officially support Red Hat Enterprise Virtualization (RHEV) or a generic KVM hypervisor on its platform. The list of supported hypervisors is explicitly limited to AHV, ESXi, and Hyper-V.

Explain: Nutanix is fundamentally a hypervisor-agnostic platform, meaning it is designed to work with multiple virtualization solutions. This flexibility allows customers to choose the hypervisor that best fits their operational needs, existing skill sets, and licensing preferences. The officially supported hypervisors that you can run on a Nutanix cluster are: - Nutanix AHV: Nutanix's native, enterprise-grade hypervisor that is included with the Nutanix Cloud Platform at no extra cost. It is deeply integrated into the stack and managed through Prism. - VMware ESXi: A widely-used hypervisor in enterprise environments. Nutanix fully supports running ESXi on its platform, allowing customers to continue using their existing VMware tools and expertise. - Microsoft Hyper-V: Another popular hypervisor, especially in environments with a significant Microsoft footprint. Nutanix also supports Hyper-V for running virtualized workloads. Therefore, the correct combination of officially supported hypervisors is Nutanix AHV, VMware ESXi, and Microsoft Hyper-V.

### mci-storage-a7dy
domain: storage
difficulty: 3

Q: An administrator assigned to create a new storage container for persistent desktops. Which storage optimization setting must the administrator set for the best possible capacity savings?
- [ ] Erasure Coding
  > Incorrect: This feature saves space by using parity instead of full data copies for redundancy. While it saves capacity, the savings from deduplication are far greater for a VDI workload with many duplicate OS files.
- [ ] Inline compression with a delay of 0 minutes
  > Incorrect: This compresses data as it's written, providing immediate space savings. It's a recommended best practice, but deduplication offers much higher savings potential for the duplicate data found in a persistent VDI environment.
- [ ] Inline Deduplication of Read Caches
  > Incorrect: This type of deduplication works on the hot data tier (SSD/RAM) to improve performance, not to save overall storage capacity. The question asks for capacity savings.
- [x] Post Process Deduplication
  > Correct: It runs on the capacity storage tier to find and remove duplicate data blocks after they are written. This is ideal for persistent desktops, where many VMs have identical files, leading to the highest possible capacity savings.

Explain: For a storage container hosting persistent desktops, the best setting for maximum capacity savings is Post-Process Deduplication. Persistent VDI involves many full-clone VMs that share identical operating system and application files. Persistent desktops, especially when created as full clones, result in many virtual machines that share a large number of identical data blocks from the base operating system and installed applications. Post-process deduplication is designed specifically for this type of workload. It works in the background to scan data that has been written to the capacity tier (SSD/HDD), find these duplicate blocks across all the different VMs, and consolidate them, freeing up significant storage space. This process is highly effective for VDI workloads with full or persistent clones.

### mci-lifecycle-k0kw
domain: lifecycle
difficulty: 3

Q: Which Nutanix feature allows an administrator to perform non-disruptive upgrades of software and firmware?
- [ ] Pulse Monitoring
  > Incorrect: Pulse is the health and telemetry monitoring feature of Nutanix. It sends system-level diagnostic data to Nutanix Support to enable proactive and predictive support. It monitors the cluster's health but is not the feature that performs the upgrades.
- [ ] Prism Central
  > Incorrect: Prism Central is the centralized management plane for monitoring and managing multiple Nutanix clusters. While you initiate and monitor the One-Click Upgrade from the Prism Central interface, Prism Central itself is the management platform, not the specific upgrade feature.
- [ ] Data Replication
  > Incorrect: Data Replication is focused on data protection and disaster recovery. It is unrelated to the process of upgrading the software and firmware of the cluster itself.
- [x] One-Click Upgrade
  > Correct: The "One-Click" functionality, powered by LCM, provides a simplified, non-disruptive method for upgrading the entire Nutanix software and firmware stack. It automates the process of updating nodes in a rolling fashion, ensuring high availability for workloads during the upgrade.

Explain: The feature that allows a Nutanix administrator to perform non-disruptive upgrades of software and firmware is One-Click Upgrade. This capability is managed through the Nutanix Life Cycle Manager (LCM). The One-Click Upgrade process is designed to simplify and automate the entire upgrade workflow for the Nutanix stack, including AOS, hypervisors, and firmware for servers, with minimal business disruption. The system intelligently updates one node at a time. It first migrates all virtual machines from the node to other nodes in the cluster, then updates the node, and finally brings it back into the cluster. This rolling process ensures that applications remain online and available throughout the entire maintenance window.

### mci-lifecycle-w5el
domain: lifecycle
difficulty: 2

Q: What is the prerequisite should be met before any LCM updates are performed?
- [ ] Update AOS
  > Incorrect: You use LCM to update AOS; you don't update AOS as a preparation step for all other LCM tasks. For example, you might only want to update firmware, which shouldn't require an AOS update first.
- [x] Update LCM framework
  > Correct: The recommended practice is to update the LCM framework before updating any components.
- [ ] Update AHV
  > Incorrect: This is an operation executed through LCM. It is not a prerequisite to update AHV before updating other components like firmware. Also, this option is not applicable to clusters running ESXi or Hyper-V. The universal prerequisite must apply to all Nutanix clusters, regardless of the hypervisor.
- [ ] Update BIOS
  > Incorrect: This is a component that LCM updates. The best practice is to ensure the LCM framework is current before attempting firmware updates like the BIOS. In fact, the documentation explicitly advises that firmware upgrades should not be the initial step in the upgrade process.

Explain: Before performing any other updates in the Nutanix stack, the primary prerequisite is to ensure that the Life Cycle Manager (LCM) framework itself is updated to the latest version. LCM is the engine that orchestrates all software and firmware updates, and keeping it current ensures it has the latest logic, compatibility information, and bug fixes required for a smooth upgrade process for all other components like AOS, hypervisors, and firmware. The recommended upgrade sequence generally starts with updating the management tools. In Prism Element, this means updating LCM first, followed by NCC, and then other components like Foundation and AOS.

### mci-monitoring-1441
domain: monitoring
difficulty: 3

Q: Upon reaching the maximum instances of retained reports in PC, what will occur?
- [ ] New reporting is delayed.
  > Incorrect: The system is designed to generate new reports as scheduled or requested by deleting the oldest instance to make space.
- [ ] Reporting failure is reported.
  > Incorrect. The automatic deletion of the oldest report is a normal, expected part of the retention policy management and not considered a failure. A failure would only be reported if the report generation itself encounters an error.
- [ ] Manual deletion is required.
  > Incorrect. Prism Central handles the deletion of the oldest report instances automatically based on the defined retention policy. Manual deletion is an available option but not required for the system to manage its retention limits.
- [x] Oldest report is deleted
  > Correct: This is the correct action. When a new report instance is generated (either manually or via a schedule) and the configured retention limit has been met, Prism Central automatically deletes the very first instance that was generated. This ensures the total number of retained reports does not exceed the set limit [25].

Explain: When the maximum number of retained report instances is reached for a report configuration in Prism Central's Intelligent Operations, the system automatically deletes the oldest generated report instance to make room for the new one. This is a "first-in, first-out" (FIFO) process that ensures the reporting feature continues to function without requiring manual cleanup or causing failures. By default, 25 instances are retained if no specific policy is set. Resources

### mci-storage-n58m
domain: storage
difficulty: 3

Q: Which default file system is used by Nutanix storage?
- [ ] EXT4
  > Incorrect: While the Nutanix Controller VM (CVM) itself runs on a Linux-based OS which might use filesystems like EXT4 for its own boot partitions, EXT4 is not the file system used to manage the cluster-wide storage pool for virtual machines. Nutanix uses its own proprietary distributed file system for that purpose.
- [ ] NTFS
  > Incorrect: NTFS is a file system for Windows and has no role in the underlying Nutanix storage fabric. Guest VMs running Windows will use NTFS for their own virtual disks, but the data for those virtual disks is stored as files on NDFS.
- [ ] XFS
  > Incorrect: Similar to EXT4, XFS is a standard Linux file system. It is not the distributed file system that Nutanix developed to pool storage across multiple nodes.
- [x] NDFS (Nutanix Distributed File System)
  > Correct: NDFS is the proprietary, distributed file system at the heart of the Nutanix platform. It is designed from the ground up to provide a scalable, resilient, and high-performance storage foundation for virtualized workloads in a hyperconverged environment. It aggregates storage from all nodes and makes it available to all hypervisors in the cluster.

Explain: The default and core file system used by Nutanix storage is the NDFS (Nutanix Distributed File System). This is a purpose-built, highly distributed file system that aggregates the local storage (SSDs and HDDs) from all nodes in the cluster into a single, unified storage pool. NDFS is the foundation of the Nutanix storage architecture. It is responsible for managing all data, ensuring data protection and high availability through features like replication and erasure coding, and providing advanced storage functionalities like compression, deduplication, and snapshots. All I/O from virtual machines is handled by NDFS, which runs within the Controller VM (CVM) on each node. While the official marketing name has evolved to "AOS Storage" or was previously "Distributed Storage Fabric (DSF)", the underlying technology and its original name is NDFS.

### mci-networking-34k0
domain: networking
difficulty: 3

Q: To fulfill the requirements from the network team, an administrator must create User VMs on VLAN 10 on multiple Nutanix AHV clusters. What network configuration should the administrator consider in order to ensure consistent connectivity for User VMs on VLAN 10?
- [x] Virtual Switch Configuration
  > Correct: The "Virtual Switch Configuration" encompasses the creation and management of virtual networks for VMs. To ensure VMs can connect to VLAN 10, the administrator must explicitly create a virtual network (e.g., named "VLAN-10-Network") and assign it VLAN ID: 10 within Prism on each of the AHV clusters. By maintaining a consistent virtual network definition across all clusters, the administrator guarantees that a VM can be placed on VLAN 10 regardless of which cluster it resides on.
- [ ] MTU
  > Incorrect: While having a consistent MTU across the entire network path (physical switches, hosts, vSwitches) is a best practice to prevent packet fragmentation and performance issues, it is a general infrastructure setting. Configuring the MTU does not, by itself, create or assign VLANs to VMs. An MTU mismatch would affect all traffic, not just connectivity for a specific VLAN.
- [ ] MAC Address Prefix
  > Incorrect: A VM's MAC address is its unique Layer 2 identifier, but it is independent of its VLAN assignment. Changing the MAC prefix has no impact on which VLAN the VM's traffic is tagged with. This setting is for identity management, not network segmentation.
- [ ] Bond Type
  > Incorrect: The bond configuration deals with the physical uplink resilience and traffic distribution from the host. While the physical switch ports connected to this bond must be configured as trunks to carry VLAN 10 traffic, the choice of bond type itself does not make that VLAN available to the VMs. The virtual network must still be created on the virtual switch to bridge the VMs to that VLAN.

Explain: To ensure that User VMs on VLAN 10 have consistent network connectivity across multiple, separate AHV clusters, the most critical element to consider is the Virtual Switch Configuration. In AHV, networking for VMs is managed through virtual networks created in Prism. These virtual networks are assigned a specific VLAN ID and are attached to the underlying virtual switches (which are based on Open vSwitch) on each host. However, since the requirement is for multiple clusters, you must ensure that the Virtual Switch on each separate cluster is configured identically with a network for VLAN 10. While this was historically a manual, per-cluster process, newer versions of Prism Central introduce multi-cluster virtual switches, which simplify this by allowing a single network configuration to span multiple clusters.< Regardless of the method, the virtual switch is the fundamental component that must be configured correctly on all relevant clusters.

### mci-data-protection-7a77
domain: data-protection
difficulty: 4

Q: A Nutanix administrator is assigned to ensure the protection of a business critical application. The application is running on a Linux VM and is using a custom DB that require application consistent snapshots for data integrity. An administrator has written a pre_freeze and post_thaw scripts and placed them under /usr/local/sbin/. During protection domain scheduled run an alert is generated: Execution of the PostThaw Script Failed Which two resolution steps could an administrator conduct to fix the issue? (Choose two.)
- [ ] Ensure that scripts have nutanix user ownership and admin access.
  > Incorrect: This is partially correct but less precise than the other options. For the scripts to be executed by the NGT service, they must have executable permissions (chmod +x).<doc 7 /> While ownership is important (typically root or nutanix user), the key is the executable flag (-rwxr-xr-x).<doc 7 /> The term "admin access" is ambiguous in a Linux context. Simply having the right permissions is more crucial than ownership in this case, and this step is a subset of manually testing the script's functionality.
- [ ] Review the NGT logs under /usr/local/sbin/post_thaw.
  > Incorrect: Because it points to the wrong log location. The post_thaw file is the script itself, not a log file or directory. The NGT logs on a Linux VM are located in the /usr/local/nutanix/ngt/logs directory.<doc 2 /><doc 7 /> Reviewing the guest_agent_monitor.INFO and other logs in that correct location would be a valid troubleshooting step to find error messages related to script execution, but the location specified in this option is wrong.
- [x] Ensure NGT service is up and running.
  > Correct: The Nutanix Guest Agent (NGA) service, which is part of NGT, is responsible for receiving commands from the cluster and executing the pre_freeze and post_thaw scripts inside the guest VM.<doc 7 /> If the NGT service is stopped, crashed, or its communication link to the cluster is inactive, it cannot execute any scripts, leading to a failure. Verifying that the ngt_guest_agent service is active is a fundamental first step.
- [x] Execute scripts manually and ensure they succeed
  > Correct: This is also a correct and critical troubleshooting step. A script failure can occur if there is a syntax error, an incorrect command, or a logical issue within the script itself. By logging into the Linux VM and running the /usr/local/sbin/pre_freeze and /usr/local/sbin/post_thaw scripts manually as the nutanix or root user, the administrator can check for any error messages printed to the console. This action directly validates that the scripts are functional and do what they are intended to do outside of the NGT framework.

Explain: When a post_thaw script fails during an application-consistent snapshot on a Linux VM, it indicates a problem with either the script itself or the Nutanix Guest Tools (NGT) service responsible for executing it. To resolve this, the administrator must validate that the NGT service is operational and that the script is correctly configured, has the proper permissions, and can run without errors. The two most effective resolution steps are to ensure the NGT service is up and running and to execute the scripts manually to confirm they succeed. These actions directly test the two core components involved: the execution framework (NGT) and the executable content (the script).

### mci-vms-8lkf
domain: vms
difficulty: 3

Q: How to automate the deployment of 100 Linux VMs with similar configurations but different hostnames, local configurations, and install packages?
- [ ] Manual configuration
  > Incorrect: This is highly impractical and inefficient for deploying 100 VMs. Manually configuring each machine would be extremely time-consuming, prone to human error, and would not be a scalable or repeatable process. The goal of the question is to find the best way to automate the deployment, which manual configuration directly contradicts.
- [x] Cloud-Init configuration
  > Correct: Cloud-Init is a package specifically designed for the initial setup of Linux cloud and virtual instances.
- [ ] SysPrep Configuration
  > Incorrect: SysPrep (System Preparation Tool) is the Microsoft equivalent of Cloud-Init but is designed exclusively for customizing Windows operating systems. It would not work for deploying Linux VMs.
- [ ] VM template configuration
  > Incorrect: While using a VM template is a part of the process (you would typically create a template with Cloud-Init installed), it is not the complete solution on its own. A template creates identical clones, but it doesn't handle the unique customization needed for each of the 100 VMs (like different hostnames). Cloud-Init provides the intelligence on top of the template to apply those unique settings.

Explain: For automating the deployment of 100 Linux VMs with similar base configurations but unique hostnames, local settings, and software packages, the best method is to use a Cloud-Init configuration. Cloud-Init is the industry standard for customizing Linux virtual machines on their first boot. It allows you to use a single "golden image" or template and then apply specific configurations to each new VM created from it, such as setting a unique hostname, creating user accounts, adding SSH keys, and running scripts to install packages. This approach is highly efficient and scalable, making it ideal for deploying a large number of VMs.

### mci-monitoring-ft1h
domain: monitoring
difficulty: 3

Q: An administrator is assigned to create a Playbook where VM protection has failed for VMs in category: CriticalApps:Alerts. The administrator needs to create an alert for only the VMs in the CriticalApps:Alerts category. The alert must send a notification to the on-call personnel in the event that a VM Protection Failed Alert is triggered. How should the administrator complete this assignment?
- [ ] Create a Playbook with a Manual trigger.
  > Incorrect: A manual trigger requires an administrator to explicitly run the Playbook on a target entity. This contradicts the goal of automatically sending a notification when a failure alert is generated. The requirement is for an automated, reactive workflow, not a manual one.
- [x] Create a Playbook with an Alert Matching Criteria trigger.
  > Correct: The "Alerts Matching Criteria" trigger is the most powerful and flexible option for this task. It allows you to define a set of specific conditions that must be met for the Playbook to run. In this case, you would configure the trigger to look for:
- [ ] Create a Playbook with an Event-based trigger.
  > Incorrect: An event-based trigger initiates a Playbook based on system events, such as 'VM Created' or 'VM Updated'. A 'VM Protection Failed' notification is classified as an alert (indicating a problem), not a standard operational event. Therefore, an event-based trigger would not fire for this condition.
- [ ] Create a Playbook with an Alert-based trigger
  > Incorrect: This option is less suitable because it is not as specific. The standard "Alert" trigger typically prompts you to select a pre-existing alert policy. While you could create an alert policy for 'VM Protection Failed', applying it only to a specific category for the purpose of a Playbook is less direct than using the "Alert Matching Criteria" trigger. The "Alert Matching Criteria" trigger is purpose-built for this kind of ad-hoc, granular filtering.

Explain: To accomplish this task, the administrator should create a Playbook using the Alert Matching Criteria trigger. This specific trigger type is designed for the exact scenario you've described: it allows you to build a highly targeted automation that activates only when a specific alert (like 'VM Protection Failed') occurs on entities that match a specific filter, such as being part of a category ('CriticalApps:Alerts'). Using a more generic trigger, like the standard 'Alert-based' trigger, would be too broad. The 'Alert Matching Criteria' trigger provides the necessary granularity to precisely define the conditions under which the Playbook should run, ensuring notifications are only sent for the critical VMs you care about in this context.

### mci-storage-kkxt
domain: storage
difficulty: 2

Q: What is the Nutanix feature helps optimize storage space by removing duplicate blocks of data?
- [ ] Compression
  > Incorrect: While compression also saves storage space, it works differently. Compression reduces the size of individual data blocks by using algorithms to remove redundant information within each block. It does not find and remove duplicate blocks across the storage system. Deduplication and compression can be used together for maximum space savings.
- [x] Deduplication
  > Correct: Nutanix offers multiple forms of deduplication, including post-process and inline. The primary goal of capacity deduplication is to scan data on the storage tier, find identical data blocks across different VMs or files, and consolidate them to save space.
- [ ] Data Locality
  > Incorrect: This is a performance optimization feature. AOS (AOS Storage) attempts to store a virtual machine's data on the same node where the VM is running. This ensures that read requests are served from local storage, which minimizes network latency and improves performance. When a VM moves to a different node, its data will eventually follow it to maintain this locality.
- [ ] Replication
  > Incorrect: This is a data resiliency feature that determines how many copies of data are maintained across the cluster to protect against component failure. For example, a Replication Factor of 2 (RF2) means there will be two copies of the data (the original and one replica), while RF3 means there will be three copies. This ensures data availability if a node or disk fails.

Explain: While both Compression and Deduplication are storage optimization technologies that save space, they work differently. Compression makes data smaller, whereas Deduplication entirely eliminates redundant copies of data blocks. In contrast, Data Locality is focused on improving performance by reducing read latency, and Replication Factor is focused on data protection and availability by creating multiple copies of data, which actually increases storage consumption. Therefore, the specific feature designed to optimize storage by removing duplicate data blocks is Deduplication.

### mci-performance-ycbb
domain: performance
difficulty: 4

Q: An administrator has an environment based on two different AHV-based and ESXi-based clusters. Workloads are evenly distributed and in a healthy state. A Linux VM running on ESXi is not performing well at the storage level and is configured as follows: - VCPU: 8 - VRAM: 32 - vDisk: 3, first 100 GB, second 250 GB, third 250 GB What is the easiest way to test VM performance, while minimizing downtime?
- [ ] Increase the number of vCPUs.
  > Incorrect: While adding vCPUs can help with overall VM performance, it is not a direct solution for a storage I/O bottleneck. A storage performance issue is typically caused by limitations in the storage I/O path, not a lack of compute resources in the guest VM. This change would not address the root cause and is unlikely to resolve the poor storage performance.
- [ ] Migrate the VM to the AHV cluster.
  > Incorrect: Migrating the VM from ESXi to AHV could potentially improve performance due to AHV's optimized I/O path (AHV Turbo). However, this is not the easiest way to test performance. A migration involves significant planning and a brief downtime during the cutover, even when using a tool like Nutanix Move. Given that the goal is to test a performance fix easily, a full hypervisor migration is a comparatively complex step.
- [x] Enable vDisk sharding at AOS level.
  > Correct:  vDisk sharding is a Nutanix AOS feature specifically designed to improve single vDisk performance by breaking the single-threaded limitation of vDisk controllers. It allows a single vDisk to be served by multiple internal threads (shards), significantly increasing I/O throughput, especially for read-heavy and sequential write workloads.
- [ ] Collapse the second and the third disk into a single one
  > Incorrect: This action would likely worsen the problem. Nutanix best practices have historically recommended using multiple vDisks (and striping them within the guest OS) to overcome single-vDisk performance limits. Combining two 250 GB vDisks into a single 500 GB vDisk would consolidate the I/O into a single path, potentially creating a more significant bottleneck. While vDisk sharding now addresses this for single large disks, collapsing existing disks is counterproductive and would require downtime to perform the data migration and disk reconfiguration within the guest OS.

Explain: The core of the problem is a storage performance bottleneck on a single VM. Historically, Nutanix addressed this by recommending that administrators create multiple smaller vDisks and stripe them together in the operating system (like LVM in Linux). This approach distributes I/O across multiple vDisk controllers, improving throughput. However, Nutanix introduced vDisk sharding to provide a similar benefit automatically and transparently for a single large vDisk. This feature allows a vDisk's I/O to be processed by multiple threads in the Nutanix storage fabric (Stargate), effectively "sharding" the workload. Since it is an AOS-level feature that can be enabled without VM downtime and directly targets the described bottleneck, it is the easiest and most direct method to test for a performance improvement.

### mci-monitoring-5nod
domain: monitoring
difficulty: 3

Q: How could the Nutanix administrator create a custom Intelligent Operations report, and run across multiple Prism Central instances?
- [ ] When creating the report, select the other Prism Central instances.
  > Incorrect. A single Prism Central instance manages its own set of clusters and entities. The report creation interface within one Prism Central does not have the context or ability to directly select and run reports on other, separate Prism Central instances
- [x] Export/import the report configuration in .rpt format.
  > Correct: Prism Central allows an administrator to export the configuration of a custom report. This exported file, which has a .rpt extension, can then be imported into a different Prism Central instance. This process effectively duplicates the custom report structure, allowing it to be run on the second environment. The only prerequisite is that the destination Prism Central must be the same or a newer version than the source.
- [ ] Configure report sharing between Prism Central instances.
  > Incorrect. While Prism Central has many features for management and data collection, there is no built-in, direct "sharing" or "syncing" mechanism for report configurations between independent Prism Central instances. The method for sharing configurations like reports and playbooks is through an export/import process.
- [ ] Manually recreate the report in each Prism Central instance
  > Incorrect: While this is technically possible, it is not the correct or most efficient answer. Manually recreating a complex report is time-consuming and prone to human error, especially if the report has many specific metrics and configurations. The export/import feature is designed specifically to avoid this manual effort.

Explain: Nutanix Prism Central is designed to be a centralized management plane for one or more Nutanix clusters. However, different Prism Central instances operate independently of one another. There is no native feature that allows one Prism Central to automatically discover or run reports on another. To maintain consistency and save administrative effort across separate environments (like development, production, or different geographical sites), Nutanix provides an export/import functionality for certain configurations, including custom reports from Intelligent Operations. The process is straightforward: 1 In the source Prism Central, you create and finalize your custom report. 2 From the Reports > Configuration page, you select the report and use the Export action. 3 This generates a .rpt file containing the report's structure. 4 In the destination Prism Central, you navigate to the same page and use the Import action to upload the .rpt file. This correctly populates the custom report in the new Prism Central, ready to be run against the clusters it manages. This same export/import methodology is also used for other configurations like X-Play playbooks.

### mci-vms-brzc
domain: vms
difficulty: 3

Q: An administrator is creating a storage performance test between two Microsoft Windows VMs. The first VM was deployed by using a template, while the second one was created from scratch. Results show that VMs have very different metrics when using the same performance test. The first VM reaches 8000 IOPS, while the second struggles reaching 500/800 IOPS. Currently the AHV cluster is not under pressure. How can the administrator determine why these results were produced?
- [ ] Compare vDisk bus type between VMs.
  > Incorrect: On AHV, the vDisk bus type is typically SCSI or IDE. For optimal performance, disks should be set to SCSI.
- [ ] Enable AHV Turbo on the second VM.
  > Incorrect: AHV Turbo Mode (or multi-queue) is a performance feature that allows I/O processing to be distributed across multiple vCPUs, significantly boosting performance for I/O-heavy workloads.
- [ ] Check number of VCPUs assigned to VMs
  > Incorrect: While the number of vCPUs can impact overall VM performance and is a prerequisite for features like AHV Turbo, it's unlikely to be the root cause of such a drastic drop in storage IOPS.
- [x] Verify both VMs have installed Nutanix Guest Tools.
  > Correct: This is the most probable cause of the issue. Nutanix Guest Tools (NGT) is a critical software package that includes the Nutanix VirtIO drivers for Windows. These drivers are essential for high-performance storage and network I/O on the AHV hypervisor.

Explain: The significant difference in storage performance (8000 IOPS vs. 500-800 IOPS) between the two Microsoft Windows VMs is almost certainly due to the absence of the correct storage drivers on the VM that was created from scratch. The high-performing VM, created from a template, would have been built from a "golden image" that already included the necessary Nutanix VirtIO drivers. These drivers are essential for high performance on the AHV platform. When a Windows VM is created from scratch without manually installing these drivers, it falls back to using emulated, legacy storage controllers (like IDE or a non-paravirtualized SCSI). These emulated drivers have a massive performance overhead and cannot deliver the high IOPS that the underlying Nutanix platform is capable of, which explains the drastically lower performance you are observing. The solution is to ensure the Nutanix VirtIO drivers, which are part of the Nutanix Guest Tools (NGT) package, are installed on the underperforming VM.

### mci-data-protection-zbz5
domain: data-protection
difficulty: 3

Q: An administrator needs to ensure that DR snapshots are protected from inadvertent or malicious deletion without notification. What is the best way to accomplish this?
- [ ] Create and Apply an Alert Policy.
  > Incorrect: An Alert Policy is a reactive measure. It can be configured to send a notification after a specific event, such as "Recovery Point Delete," has already occurred. While this provides notification after the fact, it does not protect or prevent the snapshot from being deleted in the first place.
- [ ] Assign DR Admin Role to users.
  > Incorrect: Assigning the DR Admin role is a standard security practice for controlling who has permission to manage disaster recovery configurations. However, this role explicitly grants users the permission to create, modify, and delete snapshots and protection policies. This option does the opposite of what is requested; it gives users the power to delete snapshots, rather than protecting them from deletion.
- [x] Create and Apply an Approval Policy.
  > Correct: An Approval Policy is a proactive governance feature in Prism Central designed to enforce a "four-eyes principle" for sensitive operations. You can create a policy that requires one or more designated approvers to authorize specific actions before they are executed. By creating an approval policy for "Recovery Point Delete" and applying it to the relevant users or groups, an administrator ensures that no single person can delete a critical DR snapshot without explicit, logged approval from another party. This directly prevents both inadvertent and malicious deletions.
- [ ] Create a Playbook to alert on event.
  > Incorrect: Similar to an Alert Policy, a Playbook triggered by a "Recovery Point Delete" event is also a reactive measure. The playbook would run after the snapshot has been deleted. While you could configure it to send an email, create a ticket, or perform other automated actions, it cannot prevent the initial deletion.

Explain: The core requirement of the question is to find a method that protects snapshots from being deleted without oversight, not just one that reports on the deletion after it happens. This calls for a proactive control rather than a reactive one. - Reactive Options (Alert Policy, Playbook): These tools are excellent for notification and post-event automation. They tell you that a snapshot was deleted but do not stop the deletion itself. - Permissions Option (DR Admin Role): This is a basic access control mechanism, but the role itself grants the very permissions the administrator wants to control. It doesn't add an extra layer of protection. - Proactive Option (Approval Policy): This is the only feature listed that inserts a control step before a sensitive action is executed. By requiring approval for the "Recovery Point Delete" operation, you ensure that no snapshot can be removed without a second party's consent. This effectively prevents unauthorized or accidental deletions and provides a clear audit trail, perfectly matching the administrator's goal.

### mci-architecture-cc6t
domain: architecture
difficulty: 2

Q: What is the Nutanix feature allows administrators to expand a cluster by adding new nodes without downtime?
- [ ] Prism Central
  > Incorrect: This is the centralized management plane for Nutanix environments. It allows administrators to manage multiple clusters, VMs, and services from a single interface.
- [ ] Metro Availability
  > Incorrect: This is a business continuity and disaster recovery (DR) feature. It provides continuous data availability by synchronously replicating data between two separate Nutanix clusters, typically located in different sites.
- [x] Scale-out Architecture
  > Correct:. The Nutanix platform is built on a web-scale, distributed architecture that is designed to "scale out" linearly. This means an administrator can seamlessly add new nodes (servers) to an existing cluster.
- [ ] AHV Protection Domains
  > Incorrect: This is a data protection feature used for backup and disaster recovery. A Protection Domain is a group of VMs that are snapshotted and replicated together to another cluster (local or remote) on a defined schedule.

Explain: The core principle behind Nutanix's flexibility is its Scale-out Architecture. Unlike traditional three-tier architectures that require complex and disruptive "rip-and-replace" upgrades when they run out of resources, Nutanix is designed for simple, incremental growth. When a business needs more compute or storage resources, the process is straightforward: 1 Rack and network a new Nutanix node. 2 Use Prism to discover the new node on the network. 3 Select the node and click to add it to the cluster. The Nutanix Distributed Storage Fabric (DSF) automatically handles the rest. It integrates the new node's resources and begins redistributing data to ensure it is evenly balanced and that data locality is optimized. This entire operation happens online without impacting running workloads, fulfilling the requirement of expanding a cluster without downtime. The other options listed are specific features for management (Prism Central) or data protection (Metro Availability, Protection Domains), not the fundamental architectural principle that enables non-disruptive expansion.

### mci-data-protection-auq3
domain: data-protection
difficulty: 3

Q: An administrator needs to configure a solution that ensures VMs automatically power on in a specific order at the DR site in the event of a disaster. Which nutanix feature will achieve this?
- [x] Recovery Plan
  > Correct: The recovery plan define the order of power on VMs and allow administrators to define startup sequences, dependencies, and priorities for VMs during failover scenarios.
- [ ] Resource Scheduling
  > Incorrect: resource scheduling is not related to automatically power on VMs in a specific order
- [ ] Protection Policy
  > Incorrect: protection policy to define the schedule of the replication and the entitiled category
- [ ] Category
  > Incorrect: category used for assign entity to policy, such as a VM to protection policy

Explain: The feature that ensures VMs automatically power on in a specific order at the DR site during a disaster is a Recovery Plan. Recovery Plans are part of Nutanix’s DR functionality and allow administrators to define startup sequences, dependencies, and priorities for VMs during failover scenarios.

### mci-architecture-5fzi
domain: architecture
difficulty: 3

Q: Which AOS process determines if an I/O from a user VM will be written to oplog or the extent store?
- [x] Stargate
  > Correct: Manages storage I/O operations, including oplog and extent store writes.
- [ ] Zeus
  > Incorrect: Manages cluster configuration.
- [ ] Cassandra
  > Incorrect: Handles metadata storage.
- [ ] Curator
  > Incorrect: Manages background storage cleanup tasks.

Explain: The AOS process responsible for determining whether an I/O operation from a user VM is written to the oplog or the extent store is called Stargate.

### mci-lifecycle-uavw
domain: lifecycle
difficulty: 4
image: images/a4q3.png

Q: After initial configuration and an NCC upgrade, an administrator sees critical alerts. Which two initial cluster configuration tasks were missed?
- [ ] Password Policy change
  > Incorrect: Recommended but not a critical alert cause
- [x] Host password change
  > Correct: Default host passwords can trigger security alerts
- [ ] BIOS Password Change
  > Incorrect: Good practice but not commonly an NCC alert cause
- [x] CVM Password change
  > Correct: Critical for security and can trigger alerts

Explain: CVM password change and Host password change are correct. These are considered critical security configurations that, if missed, could trigger alerts after an NCC upgrade. NCC performs checks related to security best practices, including password configurations. Unchanged default passwords are flagged as security vulnerabilities.

### mci-networking-0bfz
domain: networking
difficulty: 3

Q: An administrator needs to configure a new subnet on an AHV cluster and wants to ensure that VMs will automatically be assigned an IP address at creation time. Which type of network does the administrator need to create?
- [ ] DHCP Network
  > Incorrect: Not a valid Nutanix network type.
- [ ] Dynamic Network
  > Incorrect: No such type in Nutanix.
- [x] Managed Network
  > Correct: Managed networks provide automatic IP assignment.
- [ ] Unmanaged Network
  > Incorrect: Requires manual IP configuration.

Explain: The administrator needs to create a managed network. In AHV, a managed network utilizes DHCP to automatically assign IP addresses to VMs upon their creation. An unmanaged network requires manual IP configuration for each VM.

### mci-vms-97c4
domain: vms
difficulty: 3

Q: An administrator needs to create a new Linux image and will need to do the following as part of the VM deployment: Set the OS hostname, Add custom users, Add keys, Run custom scripts. What package needs to be installed in the Linux image to facilitate this automation?
- [ ] NGT
  > Incorrect: Nutanix Guest Tools do not handle OS customization
- [x] Cloudinit
  > Correct: Cloud-init is used for Linux VM customization
- [ ] Sysprep
  > Incorrect: Sysprep is used for Windows customization
- [ ] Kickstart
  > Incorrect: Kickstart is used for unattended RHEL installations

Explain: The package you need to install to automate tasks like setting the OS hostname, adding custom users, adding keys, and running custom scripts during Linux VM deployment is cloud-init.

### mci-architecture-xqls
domain: architecture
difficulty: 3

Q: Which Nutanix process stores and manages all of the cluster metadata in a distributed ring-like manner?
- [ ] Chronos
  > Incorrect: Handles job scheduling, not metadata.
- [ ] Zeus
  > Incorrect: Controls cluster services but does not manage metadata.
- [x] Cassandra
  > Correct: Distributed database used for metadata storage.
- [ ] Zookeeper
  > Incorrect: Manages service coordination but not metadata.

Explain: The Nutanix process responsible for storing and managing all cluster metadata in a distributed ring-like method is Cassandra. It's based on a modified version of Apache Cassandra and uses the Paxos algorithm to maintain consistency across the cluster. This service operates on every node within the cluster. Access to Cassandra is provided through an interface known as Medusa.

### mci-vms-u6ou
domain: vms
difficulty: 3

Q: An administrator has been asked to deploy VMs using a specific image. The image has been configured with settings and applications that will be used to develop a new product for the company. The image is not available on the desired cluster, but it is available in other clusters associated with Prism Central. Why isn’t the image available?
- [ ] The image bandwidth policy has prevented the image upload
  > Incorrect: Bandwidth policy controls speed but does not prevent image availability
- [ ] They should be removed from all categories
  > Incorrect: Categories help organize images but do not restrict them
- [x] The cluster has not been added to the correct category
  > Correct: Images may be categorized to specific clusters, preventing visibility
- [ ] The image placement policy was configured with soft enforcement
  > Incorrect: Soft enforcement does not prevent image visibility, only suggests placement

Explain: The administrator should check if the cluster they are trying to deploy the Virtual Machines (VMs) to has been added to the correct category within Prism Central (PC). Image placement policies in PC use categories to determine which images are available to which clusters. If the cluster isn't assigned to the category specified in the image placement policy, the image won't be available. The administrator needs to add the cluster to the appropriate category within PC to make the image accessible for VM deployment. Image placement policies can also be configured with "soft" or "hard" enforcement. A "hard" enforcement policy strictly limits image availability to clusters within the specified categories, while a "soft" enforcement policy allows clusters outside the specified categories to use the image if needed.

### mci-networking-00k9
domain: networking
difficulty: 3

Q: An administrator has created a Nutanix-managed network and assigned it a VLAN ID of 512. Several VMs have been created, but the administrator notices that the VMs can communicate with other VMs on that VLAN provided they are on the same host but cannot communicate with VMs that reside on a different host in the cluster. What is most likely the cause of this issue?
- [ ] There is a firewall rule blocking VLAN 512 traffic.
  > Incorrect: Firewalls typically do not block VLAN traffic by default.
- [ ] VLAN 512 is a reserved VLAN ID and not usable for guest VMs.
  > Incorrect: VLAN 512 is not reserved and can be used for guest VMs.
- [x] The VLAN was not created on the upstream switches.
  > Correct: If the VLAN does not exist on upstream switches, inter-host communication will not work.
- [ ] The administrator did not create the VLAN on all hosts.
  > Incorrect: Nutanix manages VLANs at the cluster level, not per host.

Explain: The most likely cause is that the VLAN (VLAN ID 512) was not created on the upstream switches. VMs on the same host can communicate because they are on the same physical network segment. However, for inter-host communication, the VLAN must be configured on the physical network infrastructure, specifically the upstream switches. If the VLAN is not present on these switches, traffic will not be routed between hosts.

### mci-security-gh7a
domain: security
difficulty: 3

Q: After configuring Active Directory as the desired authentication service, an administrator is not able to log in to Prism Central using a privileged account. Which configuration must be checked first?
- [ ] Account lock status
  > Incorrect: Locking the account could prevent access.
- [x] Role Mapping
  > Correct: Ensuring role mapping is correct is critical.
- [ ] Local user account
  > Incorrect: The issue is related to AD, not local users.
- [ ] Cluster Lockdown
  > Incorrect: Lockdown mode does not affect AD authentication.

Explain: The first configuration to check is Role Mapping. After configuring Active Directory, users need to be mapped to roles within Prism Central to gain appropriate access. If a privileged account is not mapped to a role with sufficient permissions, login will be denied even if the credentials are valid within Active Directory. Verifying the role mapping ensures the account has the necessary permissions to access Prism Central.

### mci-data-protection-ca5n
domain: data-protection
difficulty: 3

Q: A recently configured cluster is leveraging NearSync with a recovery schedule of 15 minutes. It is noticed that the cluster is consistently transitioning in and out of NearSync. What action should be taken to potentially address this issue?
- [ ] Change the NearSync Schedule to 30 minutes
  > Incorrect: While increasing the Near Sync schedule to 30 minutes might reduce the frequency of synchronization attempts and temporarily alleviate the issue, it doesn't address the root cause
- [ ] Configure a secondary schedule in the same protection domain
  > Incorrect: Helps in redundancy but does not resolve instability
- [x] Increase the network bandwidth
  > Correct: Network issues can impact sync.
- [ ] Add vCPU to the user VMs
  > Incorrect: VM CPU allocation does not impact NearSync

Explain: Increasing the network bandwidth between the sites is the most likely solution if the cluster is consistently out of Near Sync. Near Sync relies on frequent data transfers to maintain synchronization, and insufficient bandwidth can hinder this process. While increasing the Near Sync schedule to 30 minutes might reduce the frequency of synchronization attempts and temporarily alleviate the issue, it doesn't address the root cause. Adding vCPUs to user VMs won't impact Near Sync functionality. Configuring a secondary schedule also doesn't directly resolve the underlying network bandwidth problem.

### mci-storage-vdew
domain: storage
difficulty: 2

Q: What is the minimum time a newly created deduplication storage policy takes to apply to VMs in the container?
- [ ] 5 Minutes
  > Incorrect: Too short for deduplication processing
- [ ] 10 Minutes
  > Incorrect: Insufficient time for background processing
- [x] 30 Minutes
  > Correct: Minimum time required for policy application
- [ ] 60 Minutes
  > Incorrect: Possible but not the minimum

Explain: Deduplication policies take a minimum of 30 minutes to apply to VMs. The actual time can vary depending on the number of VMs and the amount of data in the container. For example, in a Metro Availability scenario with encryption enabled, the policy application can take 30 minutes or more. A similar delay can occur when conflicts exist between the storage policy and the container configuration, such as when a container previously had deduplication enabled. These delays are due to the underlying storage policy engine and background processes.

### mci-lifecycle-ii09
domain: lifecycle
difficulty: 4

Q: After running an LCM inventory, it is noticed that there are a number of firmware and software updates available. The administrator would like to avoid any host reboots but would like to apply some of the available updates. Which two updates can be done while avoiding a host reboot?
- [x] AOS
  > Correct: AOS Can be updated without rebooting the host, only CVM Reboot which does not required a host restart
- [x] Data Drives
  > Correct: Can be updated without rebooting the host.
- [ ] AHV
  > Incorrect: Requires a reboot since it involves the hypervisor.
- [ ] M.2 Drives
  > Incorrect: These require a reboot to update firmware.

Explain: Data Drives and AOS updates can be performed without requiring a host reboot. AHV and M.2 Drives require a reboot.

### mci-architecture-gcct
domain: architecture
difficulty: 3

Q: In the event of a disk failure, which process will immediately and automatically scan Cassandra to find all data previously hosted on the failed disk and all disks in that node?
- [x] Curator
  > Correct: Curator is responsible for storage optimization and data balancing
- [ ] Stargate
  > Incorrect: Stargate handles I/O operations
- [ ] Genesis
  > Incorrect: Genesis is responsible for cluster initialization
- [ ] Prism
  > Incorrect: Prism is the UI for cluster management but does not handle data recovery

Explain: Curator scans and ensures data resiliency after disk failures.

### mci-monitoring-60o8
domain: monitoring
difficulty: 4
image: images/a4q14.png

Q: Refer Exhibit: An administrator wants to reduce the largest amount of alert emails received from PC. Which two settings should the administrator customize to meet the requirement.( choose Two)
- [x] Skip empty digest email
  > Correct: Prevents sending digest emails with no alerts.
- [ ] Every single alert
  > Incorrect: Ensures all alerts generate emails, increasing the volume.
- [x] Daily Digest
  > Correct: Groups alerts into a single daily summary email.
- [ ] Email Recipients
  > Incorrect: Limits who receives alerts, reducing email volume.

Explain: The two settings an administrator should customize to reduce the number of alert emails from PC are: Daily Digest: Enabling this setting will consolidate individual alerts into a single daily summary email. Skip empty digest email: Enabling this setting will prevent the system from sending a digest email if there are no alerts to report. This is helpful in reducing unnecessary emails.

### mci-performance-z1r8
domain: performance
difficulty: 3

Q: An Administrator has been notified by a user that a Microsoft SQL Server instance is not performing well. When reviewing the utilization metrics, the following concerns are noted: - Memory consumption has been above 95% for several months - Memory consumption has been spiking to 100% for the last five days - CPU usage is 45% - Storage latency is 2ms. When logging into Prism Central, how could the administrator quickly verify if this VM has performance bottlenecks?
- [ ] See capacity runway
  > Incorrect: Capacity runway forecasts when the whole cluster will exhaust CPU/memory/storage; it does not diagnose whether one specific VM is bottlenecked right now.
- [x] Filter VM by efficiency
  > Correct: A VM pegged at 95-100% memory matches the Constrained VM profile, which Prism Central surfaces through VM efficiency. Filtering VMs by efficiency flags the constrained VM and the resource it is short on, confirming the bottleneck.
- [ ] Update capacity configuration
  > Incorrect: Updating capacity settings does not diagnose real-time performance issues
- [ ] Perform entity sync
  > Incorrect: Entity sync refreshes data but does not analyze performance

Explain: A VM running at 95-100% memory is the textbook Constrained VM, which Prism Central exposes via VM efficiency. Filtering VMs by efficiency identifies the constrained VM and the exact resource it lacks, directly confirming the bottleneck. Capacity runway is a cluster-level forecast, not a per-VM diagnostic. [Source key corrected: the dump marked 'See capacity runway,' which is wrong — see review notes.]

### mci-vms-jrho
domain: vms
difficulty: 4

Q: An administrator has an AHV cluster that is comprised of 4 nodes with the following configuration in each: - CPU: 2 x 2.4GHz 12-core - Memory: 256GB - Disks: 6 x 1.92TB SSD A VM with 16 vCPUs and 96GB of RAM is being created on the cluster. How should the administrator configure the VM to assure optimal performance?
- [ ] With an affinity policy
  > Incorrect: Affinity policies control placement but do not directly impact performance
- [ ] With memory overcommit
  > Incorrect: Memory overcommit can degrade performance in high-utilization environments
- [x] With 2 vNUMA nodes
  > Correct: NUMA-aware configuration can improve memory locality and performance
- [ ] With Flash Mode enabled
  > Incorrect: Flash Mode improves storage performance, not CPU/memory

Explain: To ensure optimal performance for the VM with 16 vCPUs and 96GB of RAM on the four-node AHV cluster, the administrator should configure the VM with 2 vNUMA nodes. Given the VM's size, leveraging vNUMA improves performance by distributing the CPU and memory resources optimally across NUMA boundaries.

### mci-vms-669j
domain: vms
difficulty: 3

Q: An Administrator manages an AHV cluster that is dedicated to a dev/test environment. The administrator is receiving complaints from users that they are unable to create VMs on the clusters. After reviewing the clusters, the administrator finds that the memory resources are almost fully utilized, with many VMs overprovisioned on Memory. What option is the most efficient resolution to enable additional VMs to be created.
- [ ] Upgrade the nodes with additional memory DIMMs
  > Incorrect: Adds capacity but is not the most efficient solution
- [x] Enable Memory overcommit on the overprovisioned VMs
  > Correct: Allows more VMs to run by overcommitting memory
- [ ] Disable HA Reservation on the cluster
  > Incorrect: Reduces reserved memory but may impact HA
- [ ] Enable Memory HA on the overprovisioned VMs
  > Incorrect: Ensures redundancy but does not solve memory exhaustion

Explain: This is likely the most efficient solution in a dev/test environment. Memory overcommit allows you to assign more memory to virtual machines (VMs) than is physically available on the cluster. This works because most VMs don't utilize all of their assigned memory all the time. Overcommitting allows for greater VM density, effectively sharing the available memory across more VMs. However, keep in mind that if the overcommitted VMs suddenly require their full memory allocation, performance could be impacted.

### mci-lifecycle-4pjd
domain: lifecycle
difficulty: 4

Q: An administrator recently added new SSDs to a Nutanix cluster and knows the firmware will be out of date. Due to security constraints, the cluster does not have access to the internet. Which two steps must be completed to update the firmware (Choose Two)
- [x] Update the LCM source and URL
  > Correct: Allows LCM to access the firmware bundle
- [x] Download a darksite bundle and deploy it on an internal webserver
  > Correct: Provides a local update option for isolated environments
- [ ] Download the disk firmware from the OEM’s website
  > Incorrect: May not be compatible with Nutanix LCM
- [ ] Select upgrade software then upload the firmware bundle
  > Incorrect: Not an LCM-supported method

Explain: Update the LCM source and URL: LCM (Life Cycle Manager) usually pulls updates from the Nutanix portal. Since the cluster is offline, its source URL needs to be redirected to the internal web server hosting the offline update bundles. The command configure_lcm -p can be used to verify the current LCM configuration including the URL and whether a bundle has been uploaded. Look for the "uploaded_bundle: True" in the output to confirm the bundle upload is successful. The specific commands to change the URL will depend on the LCM version. Download a darksite bundle and deploy it on an internal webserver: A darksite bundle contains the necessary firmware updates. This bundle needs to be downloaded to a system with internet access and then deployed on a web server accessible to the isolated Nutanix cluster. This allows the cluster to access the updates internally. Once the LCM Framework Bundle is uploaded, you should see the "Dark Site - Direct Upload" mode in the LCM UI in Prism.

### mci-security-w4vz
domain: security
difficulty: 3

Q: An administrator is not able to log into PC using a new Active Directory user account, after logging with the local user, the administrator verified that directory services and role mapping settings are valid. What is the most likely cause of this issue?
- [ ] PE authentication is not configured
  > Incorrect: This is unrelated to the login issue in Prism Central (PC).
- [ ] Active Directory functional level is wrong
  > Incorrect: The functional level does not impact individual user logins.
- [ ] User does not belong to the administrator group
  > Incorrect: While this could prevent access, the user should still be able to log in with limited privileges.
- [x] Change password at next logon attribute is set
  > Correct: If this attribute is enabled, the user will not be able to log in until the password is changed.

Explain: The user is required to change their password before logging in, which prevents access.

### mci-lifecycle-97eg
domain: lifecycle
difficulty: 3

Q: An administrator logs into the Nutanix support portal and notices there is a new version of the LCM framework available. In an effort to ensure LCM is providing the latest features, the administrator would like to upgrade LCM. How can the LCM framework be upgraded?
- [ ] Upgrade AOS
  > Incorrect: This does not directly upgrade the LCM framework.
- [ ] Upload the latest LCM framework as an image in the image configuration in Prism
  > Incorrect: LCM framework is not updated through image configuration.
- [x] Perform an LCM inventory
  > Correct: Running an LCM inventory refreshes the LCM framework and detects updates.
- [ ] Upload the latest LCM framework bundle via upgrade software in Prism
  > Incorrect: This option does not exist in Prism.

Explain: The Life Cycle Manager (LCM) framework is upgraded automatically as part of the LCM Inventory operation. This happens whether the inventory is triggered manually or automatically. During the inventory, LCM checks if a new version is available at the configured URL and, if so, silently upgrades the framework before starting the inventory.

### mci-storage-nxdp
domain: storage
difficulty: 3

Q: An administrator needs to limit the amount of storage space that data stored in a single container can consume. Which action should the administrator take?
- [ ] Enable reservations for rebuild capacity
  > Incorrect: This ensures space for data recovery, not limiting usage.
- [x] Set advertised capacity for the container
  > Correct: This limits the visible capacity of the storage container.
- [ ] Thick provision the container
  > Incorrect: This does not enforce a strict limit on storage usage.
- [ ] Store VM Snapshots in a different container
  > Incorrect: This is a workaround, not a direct limitation method.

Explain: Storage Advertised Capacity: Set an advertised capacity for the container. This acts as a soft limit, preventing the container from exceeding the specified capacity. Note: some extra space should be allocated beyond the projected size of any virtual machines (VMs) placed in the container to allow room for data that hasn't been garbage collected. Convert the desired capacity from TiB to GiB when setting the advertised capacity on individual storage containers. Be aware that with external storage, using advertised capacity as a hard limit is unreliable due to a time delay in detecting when the limit is crossed

### mci-architecture-11z2
domain: architecture
difficulty: 3

Q: Which Nutanix service controls ncli, the HTML5 UI, and REST API?
- [x] Prism
  > Correct: Controls UI, CLI, and API access.
- [ ] Zookeeper
  > Incorrect: Manages distributed coordination but not API/UI.
- [ ] Chronos
  > Incorrect: Handles job scheduling, not UI or API.
- [ ] Cassandra
  > Incorrect: Manages metadata but not UI or API.

Explain: The Nutanix service that controls ncli, the HTML5 UI, and REST API is Prism. Prism is the central management interface for Nutanix clusters, providing a single pane of glass for administrators. It offers multiple interfaces, including the HTML5 UI, REST API, ncli, and PowerShell cmdlets, to manage various aspects of the Nutanix environment, such as platform management, VM and container lifecycle management, policy definition and compliance, service design and status, and analytics and monitoring.

### mci-monitoring-sxe9
domain: monitoring
difficulty: 3

Q: An administrator wants to receive an environment summary report when a host failure occurs. Which action would address the administrator's need?
- [ ] Enable App Discovery
  > Incorrect: App Discovery is used for identifying applications running on VMs, not for alerting
- [ ] Edit Report Schedule
  > Incorrect: Scheduling reports does not provide real-time alerts
- [x] Configure an Alert Policy
  > Correct: Alert policies allow notifications and reports based on specific triggers like host failure
- [ ] Create a playbook
  > Incorrect: Playbooks can automate actions but are not directly related to summary reports

Explain: To receive an environment summary report when a host failure occurs, the administrator should configure an Alert Policy. Alert policies can be configured to trigger notifications, including reports, based on specific events, such as host failures.

### mci-security-4pxp
domain: security
difficulty: 4

Q: Which two types of granular RBAC does Nutanix provide for AHV hosts? (Choose two)
- [x] Category Based
  > Correct: Allows role-based access based on categories
- [ ] Disk Based
  > Incorrect: No RBAC available at the disk level
- [ ] Cluster Based
  > Incorrect: Access is typically set at the cluster level, not granular
- [x] Project Based
  > Correct: Provides project-specific access control

Explain: Nutanix provides two granular RBAC types for AHV hosts:\n\n- Category-based: Allows assigning permissions based on VM categories.\n- Project-based: Enables access control based on user roles within specific projects

### mci-networking-o1xz
domain: networking
difficulty: 3

Q: An administrator is adding a new node to the cluster. The node has been imaged to the same version of AHV and AOS that the cluster is running, configured with the appropriate IP address, and br0-up has been configured with the same uplink bonds. What is the next step?
- [x] Add the node to the cluster from Prism
  > Correct: The node must be manually added in Prism
- [ ] Run "cluster start" on the CVM
  > Incorrect: "cluster start" is used after adding nodes
- [ ] Restart the node
  > Incorrect: Restarting does not add the node to the cluster
- [ ] Run "genesis start" on the CVM
  > Incorrect: Genesis starts services but does not add nodes

Explain: The next step after imaging the new node with the same Acropolis Hypervisor (AHV) and Acropolis Operating System (AOS) versions, configuring the IP address, and setting up br0-up is to a. Add the node to the cluster from Prism. This is the standard procedure for expanding an existing Nutanix cluster. The other options involve commands that are part of the initial cluster creation or troubleshooting, not the expansion process.

### mci-networking-1fk1
domain: networking
difficulty: 3

Q: An administrator is performing validation testing of a newly deployed cluster. During this test, the administrator disconnects each LAN interface from each node while pinging the hypervisor and guest VMs. When the first interface is disconnected, ping continues as expected to the hypervisor, but the guest VM stops responding. Ping resumes when the interface is reconnected. When the second interface is disconnected, ping continues to both the hypervisor and guest VMs. What could be the cause of this issue?
- [ ] This is normal behavior for LAN failover
  > Incorrect: While a brief interruption during failover is possible, the complete loss of guest VM connectivity while the hypervisor remains online suggests a configuration problem
- [ ] PortFast is not enabled on the switch ports
  > Incorrect: PortFast is a feature that speeds up the transition of switch ports to the forwarding state, preventing delays during initial connection. While PortFast is beneficial for minimizing network downtime, it doesn't directly cause this specific issue.
- [ ] One of the network interfaces has a bad patch cable
  > Incorrect: A faulty patch cable would typically lead to continuous connectivity issues rather than the observed behavior of the guest VM only being unreachable when one specific interface is disconnected.
- [x] Switch ports are configured with different VLANs
  > Correct: VLAN misconfiguration can cause this behavior

Explain: If the switch ports connected to the two LAN interfaces are configured with different VLANs, the guest VM traffic may be tagged incorrectly when failing over. When the first interface (likely the primary) goes down, the guest VM traffic might be sent on a VLAN that the second interface and/or other network devices are not configured to receive, resulting in the loss of ping. Since pinging the hypervisor is unaffected, its traffic is likely on a different VLAN (or untagged) that is correctly configured across both interfaces and the rest of the network. When the second interface is disconnected, the active connection remains on the first interface and its VLAN, hence no disruption

### mci-vms-5vsf
domain: vms
difficulty: 3

Q: While installing Windows Server 2019 on a new VM on an AHV cluster, an administrator notices there aren’t any drives listed for the install. What might be the problem?
- [ ] VirtIO drivers aren’t supported on this version of Windows 2019
  > Incorrect: VirtIO is supported on Windows 2019
- [x] VirtIO drivers have not yet been installed and the disks are SCSI disks
  > Correct: Windows needs VirtIO drivers for SCSI disks
- [ ] VirtIO drivers must be installed on AHV for installation of Windows
  > Incorrect: VirtIO is installed in the guest, not on AHV
- [ ] VirtIO drivers have not yet been installed and the disks are IDE disks
  > Incorrect: IDE disks do not require VirtIO drivers

Explain: The most likely reason is missing VirtIO drivers. During the Windows installation process, you need to load these drivers to allow the OS to recognize the virtual storage controller presented by the AHV hypervisor. If these drivers aren't loaded, the installer won't be able to see any storage devices to install Windows onto. Make sure you have the VirtIO driver ISO attached to the VM and, at the appropriate point in the Windows installation, load the SCSI controller driver from the ISO

### mci-security-ulhe
domain: security
difficulty: 3

Q: An administrator needs to configure Prism to send encrypted messages to a set of recipients. Which setting must be applied?
- [ ] Use SMTP port 25
  > Incorrect: Port 25 is typically used for unencrypted SMTP traffic
- [ ] Configure Prism Central to use Cluster Lockdown
  > Incorrect: Cluster Lockdown restricts changes but does not impact email security
- [ ] Install SSL certificates on Prism Central
  > Incorrect: SSL certificates help secure connections but do not enforce email encryption
- [x] Set SMTP security mode to STARTTLS
  > Correct: STARTTLS ensures emails are encrypted when sent

Explain: To configure Prism to send encrypted messages, set the SMTP security mode to STARTTLS. This setting ensures that email communication is encrypted during transmission, enhancing security and protecting sensitive information.

### mci-monitoring-bnhi
domain: monitoring
difficulty: 3

Q: An administrator needs to ensure logs, alerts, and information are consistent across clusters that are located in different countries. Which service needs to be configured?
- [ ] DNS
  > Incorrect: Resolves domain names but does not synchronize logs
- [x] NTP
  > Correct: Synchronizes time to ensure consistent timing across different locations
- [ ] SMTP
  > Incorrect: don't directly address the need for consistent timing across different locations
- [ ] SNMP
  > Incorrect: Used for network monitoring, not log consistency

Explain: NTP (Network Time Protocol) is the correct service to configure. It synchronizes time across clusters, ensuring that logs, alerts, and other time-sensitive information remain consistent, regardless of their geographical location. While other options like SMTP, DNS, and SNMP have their respective roles in a network, they don't directly address the need for consistent timing across different locations.

### mci-storage-6i2k
domain: storage
difficulty: 3

Q: An administrator is troubleshooting vDisk performance issues in a Nutanix cluster with a hybrid disk. The VMs all have Flash Mode enabled but users report disk latency. What could cause these performance issues?
- [ ] The VMs' vDisks are in multiple containers
  > Incorrect: Container placement does not cause Flash Mode issues
- [ ] Flash Mode is disabled when a node fails
  > Incorrect: Flash Mode does not disable on node failure
- [x] Data size for Flash Mode exceeds 25% of SSD capacity
  > Correct: Overuse of SSD storage can degrade performance
- [ ] Compression is disabled on the vDisk storage container
  > Incorrect: Compression impacts storage, not Flash Mode performance

Explain: One possible cause of the vDisk performance issues, despite Flash Mode being enabled and the cluster having hybrid disks, is that the data size for Flash Mode exceeds 25% of the SSD capacity. If the data size for Flash Mode-enabled VMs or volume groups (VGs) exceeds this threshold, the system might down-migrate the data, impacting performance and causing latency.

### mci-architecture-auxz
domain: architecture
difficulty: 4

Q: An administrator has been asked to enable block awareness and increase the fault tolerance to FT3 on a Nutanix AHV cluster with the following configuration. - Four Blocks - One node per block Will the administrator be able to accomplish the task?
- [x] NO - FT3 requires a minimum of five nodes
  > Correct: FT3 needs at least five nodes to tolerate three failures.
- [ ] NO - Fault Tolerance changes are not supported
  > Incorrect: Fault tolerance can be modified but is subject to cluster size limits.
- [ ] Yes - FT3 requires a minimum of three nodes
  > Incorrect: FT3 requires more than three nodes.
- [ ] Yes - Block awareness requires a minimum of three blocks
  > Incorrect: Block awareness requires at least three blocks, but FT3 has additional requirements.

Explain: No, the administrator will not be able to accomplish the task. A Nutanix cluster requires a minimum of five nodes for Fault Tolerance 3 (FT3). The administrator has only four nodes, one node per block.

### mci-vms-ru5i
domain: vms
difficulty: 3
image: images/a4q32.png

Q: An administrator is trying to put a node into maintenance mode but receives the message shown in the exhibit. What is the potential reason for this dialog?
- [x] Linux VM1 uses a vDisk stored in an RF1 DataStore
  > Correct: RF1 does not provide sufficient redundancy, preventing maintenance mode.
- [ ] Linux VM1 uses a vDisk stored in an RF3 DataStore
  > Incorrect: RF3 provides enough redundancy and would not block maintenance mode.
- [ ] Linux VM1 uses a vGPU
  > Incorrect: vGPU can prevent live migration, but this scenario points to storage issues.
- [ ] Linux VM1 uses a Volume Group
  > Incorrect: Volume groups can be replicated, but they are not preventing maintenance mode in this case.

Explain: The error message indicates that a virtual machine (VM) named LinuxVM1, residing on the node being put into maintenance mode, has a vDisk stored in an RF1 datastore. RF1 (Replication Factor 1) implies that the vDisk has only one copy, offering no redundancy. When a node enters maintenance mode, its VMs are typically migrated to other nodes in the cluster. However, with RF1, there's no other copy of the vDisk to migrate, hence preventing the node from entering maintenance mode to protect against data loss. To resolve this, increase the replication factor to at least RF2 before attempting to put the node into maintenance mode. This ensures data redundancy and allows for live migration of the VM during maintenance.

### mci-vms-99wn
domain: vms
difficulty: 3

Q: A user running a computer aided design (CAD) application is complaining about slow response time within the VM, particularly when moving windows or rendering images. Which VM matric will guide the administrator toward diagnosing the problem.
- [x] GPU Usage
  > Correct: High GPU usage can indicate rendering issues.
- [ ] SWAP in Rate
  > Incorrect: Swapping can affect performance but is not specific to CAD.
- [ ] Storage Controller Latency
  > Incorrect: High latency can cause slow file access.
- [ ] Hypervisor Memory Usage (%)
  > Incorrect: Memory overcommitment can cause slowness, but storage latency is a more likely factor.

Explain: The most relevant VM metric to investigate slow response times in a CAD application, especially when moving windows or rendering images, is GPU usage. CAD applications, particularly rendering tasks, rely heavily on the GPU. High GPU usage indicates the virtual machine's GPU resources are saturated, directly impacting the user experience with slow window movement and rendering times. While other metrics such as storage controller latency, swap-in rate, and hypervisor memory usage can contribute to general VM slowness, they are less likely to be the primary bottleneck for the specific issues described by the CAD user.

### mci-architecture-2shp
domain: architecture
difficulty: 3
image: images/a4q34.png

Q: An administrator wants to replace an old node with a node of newer generation in a 3-node cluster. The administrator has already chosen the appropriate node, but is unable to remove it from Nutanix cluster. Why is remove HOST option is not shown in exhibit.
- [ ] The node needs to be placed into maintenance mode first
  > Incorrect: Nodes must be in maintenance mode before removal.
- [ ] It is only possible to remove a host using CLI
  > Incorrect: GUI options exist for removing nodes.
- [x] It is not possible to remove a node from a 3-node cluster
  > Correct: Removing a node would break redundancy in a 3-node cluster.
- [ ] The host needs to be removed using PC
  > Incorrect: Removal can be performed through various interfaces.

Explain: It is not possible to remove a host from a 3-node cluster. Nutanix clusters require a minimum of three nodes for redundancy and fault tolerance. Removing a node from a 3-node cluster would leave only two nodes, violating this minimum requirement. Therefore, the option to remove a host is disabled in Prism when managing a 3-node cluster. To replace a node, you would typically add the new node to the cluster first, then remove the old node.

### mci-networking-2cwj
domain: networking
difficulty: 3

Q: An administrator is tasked with configuring networking on an AHV cluster and wants to minimize the throughput for the host with many small VMs while minimizing network switch configuration. Which bond mode should the administrator select?
- [ ] Active-Active
  > Incorrect: Maximizes throughput but may require additional switch configuration.
- [x] Active-Backup
  > Correct: Provides fault tolerance while minimizing switch configuration.
- [ ] No uplink bond
  > Incorrect: Reduces redundancy and performance.
- [ ] Active-Active with MAC pinning
  > Incorrect: Offers load balancing but may require switch-side adjustments.

Explain: Active-Backup. This mode uses a single active adapter for all traffic, minimizing throughput compared to Active-Active modes. It also simplifies switch configuration as it avoids the need for link aggregation protocols like LACP. This setup is suitable for a host with many small VMs where maximizing throughput isn't the primary concern, but redundancy is still desired.

### mci-vms-7qm9
domain: vms
difficulty: 3

Q: An administrator has been alerted that the database VMs in the environment are not responsive. During the investigation, they discovered that the unresponsive VMs were migrated to different nodes in the cluster and have tasks in Prism Central named "ADS: Remove resource contention." What caused these VM migrations?
- [ ] ADS detected that the host memory was running > 75% for 15 minutes
  > Incorrect: ADS automatically migrates VMs when memory usage is too high, but the threshold differs.
- [x] ADS detected that the host CPU was running > 85% for 10 minutes
  > Correct: High CPU usage can trigger migration.
- [ ] ADS detected that the host networking was running > 85% for 10 minutes
  > Incorrect: ADS does not migrate VMs based on networking contention.
- [ ] ADS detected that the storage controller IOPS was running > 75% for 15 minutes
  > Incorrect: ADS does not trigger migrations based on storage IOPS alone.

Explain: Acropolis Data Services (ADS) likely triggered the migrations and the "ADS: Remove resource contention" tasks. ADS automatically migrates VMs to redistribute resources and alleviate contention. While the specific resource causing the contention isn't explicitly stated in the task name, high memory or CPU utilization are common triggers. A common trigger for this is sustained high CPU utilization on a host, often above a threshold like 85% for a certain period (e.g., 10 minutes). While the provided search results don't explicitly state the 85% / 10 minute rule, they do confirm that ADS initiates migrations in response to resource contention, typically high CPU usage

### mci-networking-5ccy
domain: networking
difficulty: 3

Q: A newly hired Nutanix administrator was tasked by the CIO to create a single VM on a test network. The network administrator stated that a native VLAN was used on the Cisco TOR switches with the following parameters: - IP address: 172.16.1.2, - Network Mask: 255.255.255.0, - Gateway: 172.16.1.1, - VLAN: 1. The same parameters were used to create a network profile on Nutanix, but when the VM was created, it had no L3 connectivity. What should the administrator do to fix the issue?
- [ ] Enable IPv6 on the VM
  > Incorrect: The issue is with VLAN tagging, not IP version settings.
- [ ] Nutanix removed support for native VLAN
  > Incorrect: Nutanix supports VLAN tagging, including VLAN 0 for native VLANs.
- [ ] Use DHCP as opposed to static IP
  > Incorrect: Static IPs should work fine if configured correctly.
- [x] Change VLAN field from VLAN 1 to VLAN 0
  > Correct: VLAN 0 is used for untagged traffic, aligning with native VLANs on Cisco switches.

Explain: The network administrator confirmed a native VLAN is in use on the Cisco top-of-rack (TOR) switches. Native VLANs on Cisco switches are untagged. While the network profile on Nutanix was created with VLAN 1, it should be set to VLAN 0 to match the native VLAN configuration on the physical switches. This allows the VM's traffic to be treated as native VLAN traffic and ensures L3 connectivity.1

### mci-security-h73t
domain: security
difficulty: 3

Q: An administrator needs to provide access for a user to view real-time performance metrics for all clusters across the data center. Which method accomplishes this with the least effort and ongoing maintenance?
- [ ] Configure IDP authentication and assign the user to the cluster admin role in PC
  > Incorrect: Cluster admin role provides excessive permissions.
- [x] Configure a local account and assign the new user to the viewer role in PC
  > Correct: Provides read-only access to cluster metrics with minimal overhead.
- [ ] Configure AD authentication and assign the user to the viewer role in PE
  > Incorrect: Limits access to a single cluster rather than all clusters.
- [ ] Configure AD authentication, create a custom role, assign the user to the role, and apply the role to all clusters and VMs
  > Incorrect: Requires more configuration effort compared to assigning a built-in role.

Explain: Configuring a local account and assigning the new user to the viewer role in Prism Central (PC) is the most efficient approach. The viewer role grants access to real-time performance metrics for all clusters managed by PC, without granting unnecessary administrative privileges. This method minimizes configuration overhead and ongoing maintenance compared to other options like custom roles or individual cluster configurations.

### mci-architecture-rqij
domain: architecture
difficulty: 3

Q: An administrator was reviewing various AOS logs when it was noticed that the time of the logs were off by several hours. Which initial step was missed during the post process cluster configuration?
- [ ] Setting the cluster time zone via PE GUI
  > Incorrect: PE GUI does not provide an option to set the time zone for the cluster
- [ ] Setting the cluster time zone via CVM aCLI
  > Incorrect: aCLI is not used for cluster-wide time zone settings
- [x] Setting the cluster time zone via CVM nCLI
  > Correct: nCLI is the correct method to set the cluster-wide time zone
- [ ] Setting the cluster time zone via PC GUI
  > Incorrect: PC GUI is used for management but not for setting the time zone

Explain: The missing step is setting the cluster time zone via the CVM using the ncli command. After the cluster is deployed, an NTP server should be configured, and the time zone set using the following command: ncli cluster set-timezone timezone=

### mci-vms-xblt
domain: vms
difficulty: 3
image: images/a4q43.png

Q: Refer Exhibit: A User is complaining about slowness of a mission-critical MSSQL server. The administrator logs into Prism Element to investigate the VM performance and observes what is shown in the diagram. Which action would best improve VM performance?
- [ ] Add additional RAM to the user VM
  > Incorrect: If memory is the bottleneck, adding RAM can help, but it may not be the main issue
- [ ] Disable hyperthreading in the BIOS
  > Incorrect: Disabling hyperthreading may impact overall performance rather than improve it
- [ ] Add additional RAM to the host on which the VM is running
  > Incorrect: If RAM is the bottleneck on the host, this could help, but CPU overcommitment is a more likely issue
- [x] Ensure the HOSTs CPUs are not excessively overcommitted
  > Correct: If CPUs are overcommitted, VMs will experience contention and performance degradation

Explain: Based on the exhibit, the MSSQL (Microsoft SQL Server) virtual machine (VM) shows high CPU usage, but low RAM and storage usage. This indicates the VM is CPU-constrained. Therefore, the best action to improve performance would be 4. Ensure the HOSTs CPUs are not excessively overcommitted. If the host's CPUs are overcommitted, other VMs on the same host are competing for CPU resources, impacting the MSSQL server's performance.

### mci-networking-2e4p
domain: networking
difficulty: 3

Q: What does Nutanix recommend when setting up the node networking?
- [ ] Include NIC modules from different vendors in the same bond
  > Incorrect: This is not recommended due to driver inconsistencies.
- [ ] Combine NIC modules from different vendors in the same bond
  > Incorrect: Similar to the previous option, this can cause issues.
- [x] Include at least two physical interfaces in every bond
  > Correct: Ensures redundancy and performance.
- [ ] Combine 1 Gbe interfaces and 10 Gbe interfaces in the same bond
  > Incorrect: This leads to performance inconsistencies.

Explain: Nutanix recommends adhering to their networking best practices when setting up node networking. It is recommended to have two stand-alone trunk ports from the switch to the Nutanix nodes. For the hypervisor/Controller Virtual Machine (CVM) network connections, connect a cable from each node’s data network Network Interface Cards (NICs) to the provided switch ports. Nutanix recommends a minimum of two 10G connections for this.

### mci-networking-97l4
domain: networking
difficulty: 3

Q: An administrator needs to increase bandwidth available to the AHV host and to the CVM. How should the administrator complete this task?
- [ ] Use manage_ovs command to update br0 to change the configuration to Active-Active
  > Incorrect: While manage_ovs was historically used for this task, in modern Nutanix versions (AOS 5.19+), the Virtual Switch (VS) framework in Prism takes precedence . If you use the CLI to modify a bridge that is managed by a Virtual Switch (like br0 which is managed by vs0), the system will often block the command or automatically revert the change to match the Prism configuration
- [ ] In Prism, create a VS1 interface and add any remaining uplinks
  > Incorrect: Creating a second virtual switch (vs1) and bridge (br1) is typically used to separate traffic (e.g., dedicated uplinks for guest VMs or storage replication), rather than increasing the bandwidth of the primary management/storage path used by the AHV host and CVM . To increase bandwidth for the existing host and CVM traffic, you should optimize the primary switch (vs0).
- [ ] Use manage_ovs command to create br1 and add any remaining uplinks
  > Incorrect: using manage_ovs for bridge creation is deprecated in favor of the Prism UI for versions 5.19 and later . Furthermore, creating a new bridge (br1) does not inherently increase the bandwidth available to the CVM and AHV host, which remain on br0/vs0 by default
- [x] In Prism, update VS0 to change the configuration to Active-Active
  > Correct: This is the correct and recommended method. Updating vs0 (which manages the default br0 bridge) to Active-Active (balance-tcp) allows the system to utilize the bandwidth of multiple physical uplinks simultaneously for the AHV host, CVM, and VM traffic . This configuration requires LACP to be enabled on the physical switches

Explain: In Nutanix AHV networking, the Controller VM (CVM) and the AHV host communicate through a default bridge called br0. In current versions of AOS, this bridge is managed by a logical entity in Prism called a Virtual Switch (vs0). By default, Nutanix uses an Active-Backup bond mode, where only one physical interface is active at a time for a given flow, limiting the total throughput to the speed of a single NIC. To increase available bandwidth and allow the host/CVM to use multiple uplinks at once, the administrator must change the bond mode to Active-Active (specifically balance-tcp with LACP) . Performing this change through the Prism UI ensures the configuration is applied consistently across all nodes in the cluster and persists through reboots and upgrades

### mci-storage-jfly
domain: storage
difficulty: 3

Q: Which component can be associated with a storage policy?
- [ ] Catalog
  > Incorrect: Catalog is not linked to storage policies.
- [x] Category
  > Correct: Storage policies are applied based on categories.
- [ ] Subnet
  > Incorrect: Subnets are network-related, not storage-related.
- [ ] VM
  > Incorrect: VMs can be affected by storage policies, but the policies themselves are associated with categories.

Explain: A category can be associated with a storage policy. Categories are used to group similar entities, and a storage policy applied to a category affects all entities within that category.

### mci-networking-tyuy
domain: networking
difficulty: 3

Q: On a Nutanix Cluster, what does Network Segmentation refer to?
- [ ] Isolating intra-cluster traffic from guest VM traffic
  > Incorrect: This is part of network segmentation but not the full definition.
- [ ] Physically separating management traffic from guest VM traffic
  > Incorrect: Network segmentation can be logical, not necessarily physical.
- [ ] A distributed firewall for securing VM-to-VM traffic
  > Incorrect: This describes Nutanix Flow, not segmentation.
- [x] Isolating management traffic from storage replication traffic
  > Correct: Segmentation ensures management and storage replication traffic do not interfere.

Explain: On a Nutanix cluster, Network Segmentation (NS) allows you to isolate network traffic for different purposes, such as management, data, and virtual storage area network (VSAN). This is achieved by using separate virtual local area networks (VLANs) and IP addresses for each function. This enhances security by containing data traffic within a specific network, preventing unauthorized access from outside.

### mci-monitoring-k2ng
domain: monitoring
difficulty: 4
image: images/a4q48.png

Q: An administrator manages a cluster and notices several failed components shown in the exhibit. What two options does the administrator have to run all NCC checks manually? (Choose Two)
- [ ] Running ncc health_checks run_all on the PC VM
  > Incorrect: NCC checks should be run from CVM, not PC VM
- [x] Running ncc health_checks run_all on the CVM
  > Correct: This command runs all NCC health checks on a CVM
- [ ] Using the action drop-down menu in the health dashboard of PC
  > Incorrect: Not a valid option for running all NCC checks manually
- [x] Using the action drop-down menu in the health dashboard of PE
  > Correct: Allows running NCC checks from the Prism Element UI

Explain: Running ncc health_checks run_all on a Controller VM (CVM) initiates all NCC checks. Alternatively, using the action drop-down menu in the health dashboard of Prism Element (PE) allows running NCC checks through the UI.

### mci-performance-nwcz
domain: performance
difficulty: 3
image: images/a4q49.png

Q: An administrator receives complaints of poor performance in a particular VM. Based on the VM performance metrics, what is the most likely cause of this behavior?
- [ ] The VM needs more vCPUs
  > Incorrect: Adding vCPUs would help if CPU demand is high, but metrics should confirm this.
- [ ] SSD Tier is not big enough to serve workload IOPS demand
  > Incorrect: Storage IOPS can impact performance, but CPU contention is more likely.
- [x] The host CPU is severely overloaded
  > Correct: If the host is overcommitted on CPU, VM performance will degrade.
- [ ] Oplog is full and cannot serve IO requests from this VM
  > Incorrect: Oplog issues usually cause storage bottlenecks, not direct CPU issues.

Explain: The most likely cause is high CPU utilization on the host. If the host's CPU is severely overloaded, the VMs running on that host will contend for CPU resources, leading to performance degradation within the affected VM. While other factors like insufficient vCPUs, limited storage IOPS, or a full oplog can contribute to performance issues, they are less likely to be the primary cause if the host's CPU is consistently overloaded. Therefore, the administrator should investigate the host's CPU utilization first and foremost to determine the root cause of the VM's poor performance.

### mci-performance-dvip
domain: performance
difficulty: 3

Q: Which baseline is used to identify a zombie VM?
- [ ] Memory usage is less than 1% and memory swap rate is equal to 0Kbps for past 21 days
  > Incorrect: Low memory usage alone does not indicate a zombie VM.
- [x] Fewer than 30 IOPS and less than 1000 bytes per day of network traffic for the past 21 days
  > Correct: This indicates minimal activity, which matches the definition of a zombie VM.
- [ ] VM is powered off for the past 21 days
  > Incorrect: A powered-off VM is not necessarily a zombie VM.
- [ ] VM has no logins for the past 21 days
  > Incorrect: Lack of logins does not necessarily indicate a zombie VM.

Explain: Fewer than 30 IOPS and less than 1000 bytes per day of network traffic for the past 21 days. This signifies minimal activity, aligning with the characteristics of a zombie VM.

### mci-security-brgv
domain: security
difficulty: 4

Q: Which two permission assignment tasks can be accomplished via Prism Element? (Choose two.)
- [ ] Grant a user permission to create VMs on a specific storage container
  > Incorrect: Prism Element does not provide granular storage-based permissions
- [x] Grant a user to view details of all VMs on a specific cluster
  > Correct: This is possible in Prism Element
- [x] Grant an Active Directory group permission to perform backup operations
  > Correct: Backup Admin role can be assigned through Prism Element
- [ ] Grant a user to create and delete snapshots on a specific VM
  > Incorrect: Prism Element does not allows snapshot management at the VM level

Explain: A user can be granted permission to view details of all virtual machines (VMs) on a specific cluster through Prism Element (PE). It is also possible to assign the Backup admin role to an Active Directory group through PE

### mci-monitoring-sypr
domain: monitoring
difficulty: 3

Q: After logging into Prism Element, an administrator presses the letter A on the keyboard. What is the expected outcome of this input?
- [x] Alerts page will launch.
  > Correct: Pressing "A" takes the user to the Alerts page.
- [ ] Analysis
  > Incorrect: "A" does not open the Analysis page.
- [ ] About Nutanix
  > Incorrect: "A" does not open the About section.
- [ ] API Explorer
  > Incorrect: "A" does not open API Explorer.

Explain: The keyboard shortcut "A" opens the Alerts list in Prism Element.

### mci-performance-pera
domain: performance
difficulty: 3

Q: An administrator is concerned about the amount of data that a VM is reading and writing to the storage fabric. Which metric will provide that data?
- [ ] Host hypervisor IO bandwidth
  > Incorrect: Measures total storage traffic at the hypervisor level, not per VM.
- [ ] Host Disk IOPS
  > Incorrect: Measures disk IOPS at the host level, not VM-specific.
- [ ] VM storage controller IOPS
  > Incorrect: Measures the number of read/write operations performed by the VM.
- [x] VM Storage Controller Bandwidth
  > Correct: Measures the total data transfer rate for a VM.

Explain: VM storage controller Bandwidth is the metric that provides data on the amount of data a VM is reading and writing to the storage fabric. It measures the total data transfer rate for a VM's storage controller. This metric gives insight into the volume of data the VM is exchanging with the storage. While VM storage controller IOPS measures the number of input/output operations per second, it doesn't reflect the actual data volume being transferred. Host-level metrics like Host Disk IOPS and Host Hypervisor IO bandwidth aren't granular enough to isolate a specific VM's data transfer activity.1

### mci-networking-h7ar
domain: networking
difficulty: 3

Q: An administrator has received reports of users being disconnected from remote desktop sessions to a specific VM. Which VM metric is most useful for isolating the cause of the issue?
- [ ] Storage Controller Bandwidth
  > Incorrect: Unlikely, as storage bandwidth is not directly related to RDP disconnections.
- [ ] Swap-Out Rate
  > Incorrect: Might indicate memory pressure but not directly related to network disconnections.
- [ ] Hypervisor CPU Ready Time (%)
  > Incorrect: High CPU ready time can indicate CPU contention, which may cause slow responses but not direct disconnections.
- [x] Virtual NIC receive packets dropped.
  > Correct: Packet drops on the virtual NIC can cause network disconnections.

Explain: The most useful VM metric for isolating the cause of users being disconnected from remote desktop sessions is "Virtual NIC receive packets dropped." Packet drops on the virtual NIC can cause network disconnections, and specifically, packet loss can lead to RDP (Remote Desktop Protocol) session drops.

### mci-networking-efdc
domain: networking
difficulty: 3
image: images/a5q5.png

Q: An administrator is adding a new node to a cluster. The node has been imaged to the same versions of AHV and AOS that the cluster is running, configured with appropriate IP addresses, and bonding has been configured the same as the existing uplink bonds. When attempting to add the node to the cluster with the Expand Cluster function in Prism, the cluster is unable to find the new node. Based on the above output from the new node, what is most likely the cause of this issue?
- [ ] The ports on the upstream switch are not configured for LACP.
  > Incorrect: LACP misconfiguration can prevent the new node from communicating with the cluster.
- [x] The existing cluster and the expansion node are on different VLANs.
  > Correct: VLAN mismatches prevent network discovery.
- [ ] There is a firewall blocking the discovery traffic from the cluster.
  > Incorrect: is another possible, although less likely given the information, cause if specific ports required for cluster communication are blocked between the existing cluster network and the new node's network.
- [ ] LACP must be completed after cluster expansion.
  > Incorrect: LACP does not impact node discovery.

Explain: If the cluster and the new node are on different VLANs, they will not be able to communicate with each other, preventing the cluster from discovering the new node during the expansion process. Since the node has already been imaged and configured with the correct IP addresses and bonding, and LACP configuration on the upstream switch is not relevant for node discovery within the same network, VLAN mismatch is the most probable cause. LKP is not relevant during the expansion process.

### mci-data-protection-cth1
domain: data-protection
difficulty: 3
image: images/a5q6.png

Q: An administrator is trying to implement the solution that is shown in the exhibit but has been unsuccessful. Based on the diagram, what is causing the issue?
- [ ] A remote Witness VM
  > Incorrect: If the witness VM is unreachable, it can cause failure in the solution.
- [ ] Active containers in both sites
  > Incorrect: Running active containers in both sites could cause data conflicts.
- [x] Network latency
  > Correct: High latency can prevent proper failover and synchronization.
- [ ] Unsupported hypervisor
  > Incorrect: If the hypervisor is not supported, the setup will not work.

Explain: Network latency between the two sites is the most likely cause of the issue. Stretched clusters require low latency between sites for proper function. High latency can impact synchronization and failover, leading to the setup failing.

### mci-vms-8ain
domain: vms
difficulty: 3

Q: The administrator recently had a node fail in an AHV Nutanix cluster. All of the VMs restarted on other nodes in the cluster, but they discovered that the VMs that make up a SQL Cluster were running on the failed host. The administrator has been asked to take measures to prevent a SQL outage in the future. What affinity option will prevent the SQL VMs from running on the same host?
- [x] VM-VM anti-affinity policy
  > Correct: Ensures that specific VMs do not run on the same host.
- [ ] Create affinity category
  > Incorrect: This groups VMs but does not enforce placement rules.
- [ ] VM-Host affinity policy
  > Incorrect: Ensures a VM runs on specific hosts but does not prevent co-location of SQL VMs.
- [ ] Create affinity project
  > Incorrect: This is not a valid Nutanix placement policy.

Explain: To prevent all the virtual machines (VMs) that make up the SQL cluster from running on the same host and avoid a future SQL outage, the administrator should implement a VM-VM anti-affinity policy. This policy ensures that specified VMs do not run on the same host. If one host fails, the other VMs in the SQL cluster will be running on different hosts and remain available.

### mci-lifecycle-rv1e
domain: lifecycle
difficulty: 3
image: images/a5q8.png

Q: The Update Source for LCM has been configured as shown in the exhibit, but the inventory is failing consistently. What is the likely cause of this issue?
- [x] Port 443 is blocked by a firewall.
  > Correct: LCM updates require HTTPS (port 443).
- [ ] Port 80 is blocked by a firewall.
  > Incorrect: LCM does not rely on port 80 for updates.
- [ ] Administrator does not have a valid portal account.
  > Incorrect: The issue is network-related, not account-related.
- [ ] The license assigned to the cluster has expired.
  > Incorrect: License expiration does not affect inventory collection.

Explain: As it is clearly shown that Enable HTTPS is checked, which means that communication will go through port 443 (i.e. default HTTPS port). Port 443 is required for LCM to communicate with the update source. If it is blocked by a firewall, the inventory will fail. Examine firewall rules to ensure that outbound HTTPS traffic on port 443 is allowed from the cluster to the configured update source.12

### mci-performance-9h2c
domain: performance
difficulty: 3

Q: Which inefficient VM profile can be used to identify a VM that consumes too many resources and causes other VMs to starve?
- [ ] Over-provisioned VM
  > Incorrect: A VM with allocated but unused resources.
- [ ] Inactive VM
  > Incorrect: A VM that has low or no activity.
- [x] Bully VM
  > Correct: A VM that excessively consumes resources, affecting others.
- [ ] Constrained VM
  > Incorrect: A VM that lacks sufficient resources.

Explain: A Bully VM is an inefficient VM profile. It's used to identify a VM that consumes an excessive amount of resources, which causes other VMs to starve or experience performance degradation. A bully VM typically exhibits high CPU ready time, high memory swap rate, and high host I/O Stargate CPU usage for an extended period, usually over an hour. Identifying bully VMs helps determine if any VMs are malfunctioning or require additional resources.

### mci-performance-5l58
domain: performance
difficulty: 2

Q: What is the recommended approach for a constrained VM?
- [ ] Reboot the VM.
  > Incorrect: A reboot does not resolve resource constraints.
- [ ] Delete the VM.
  > Incorrect: Deleting is not a solution unless the VM is unnecessary.
- [x] Increase the VM resources.
  > Correct: Allocating more resources can resolve the constraint issue.
- [ ] Decrease the VM resources.
  > Incorrect: Reducing resources would worsen the problem.

Explain: A constrained VM doesn't have enough resources to meet demand, which can cause performance issues. The recommended approach is to increase the VM's resources (CPU, memory, storage) to alleviate the constraint.

### mci-networking-h8a9
domain: networking
difficulty: 2

Q: What is a requirement to enable Flow Networking?
- [ ] A dedicated virtual switch has been created for Flow Networking.
  > Incorrect: Flow Networking does not require a dedicated switch.
- [ ] Flow Microsegmentation must be enabled.
  > Incorrect: Microsegmentation is not a prerequisite for Flow Networking.
- [x] Microservices Infrastructure (CMSP) is enabled.
  > Correct: CMSP is required to support Flow Networking.
- [ ] Prism Central is using a three-node scale-out deployment.
  > Incorrect: A scale-out deployment is necessary for Flow Networking.

Explain: Microservices Infrastructure (CMSP) being enabled is a requirement for Flow Networking. Flow Networking leverages the container orchestration capabilities of CMSP.

### mci-vms-m8bg
domain: vms
difficulty: 3

Q: During an AHV upgrade, an administrator finds that a critical VM was powered off rather than migrating to another host. Which scenario explains this behavior?
- [ ] No AHV hosts were able to schedule the VM.
  > Incorrect: If no hosts were available, the VM could not migrate.
- [ ] The VM OS crashed during migration.
  > Incorrect: A crash could cause downtime but is not the main reason in this scenario.
- [ ] The VM was on the same host as the Acropolis Leader.
  > Incorrect: This does not prevent migration.
- [x] The VM was marked as an agent VM.
  > Correct: Agent VMs are excluded from migration and may be powered off.

Explain: Agent VMs do not migrate and may be powered off instead.

### mci-networking-0tjz
domain: networking
difficulty: 3

Q: An administrator is tasked with configuring networking on an AHV cluster and needs to optimize for maximum single VM throughput. Which bond mode should the administrator select?
- [ ] Active-Active MAC pinning
  > Incorrect: MAC pinning does not maximize throughput.
- [x] Active-Active
  > Correct: Active-Active bonding provides the highest throughput.
- [ ] Active-Backup
  > Incorrect: Active-Backup does not optimize throughput.
- [ ] No Uplink Bond
  > Incorrect: Without bonding, throughput is not optimized.

Explain: Active-Active bonding. This leverages all available physical links for network traffic, maximizing the potential throughput for a single VM. While other options like Active-Backup provide redundancy, they limit throughput by using only one link at a time. Active-Active with MAC pinning can improve load balancing but may not maximize single VM throughput due to traffic distribution across multiple destinations.

### mci-monitoring-aett
domain: monitoring
difficulty: 4

Q: When configuring a syslog server in Prism Central, what two pieces are required? (Choose two)
- [ ] HTTPS URL
  > Incorrect: Not required for syslog configuration.
- [ ] Encryption Secret
  > Incorrect: Not a standard syslog requirement.
- [x] Transport Protocol
  > Correct: Defines whether to use TCP or UDP for syslog messages.
- [x] IP address/port
  > Correct: Specifies where logs should be sent.

Explain: The IP address/port and Transport Protocol are required when configuring a syslog server in Prism Central. The IP address/port specifies the location (IP address) and communication port of the syslog server. The Transport Protocol defines how the logs are transmitted, typically using either TCP or UDP.

### mci-storage-xmla
domain: storage
difficulty: 3

Q: Which Nutanix feature provides effective caching optimization in VDI environments?
- [ ] Remote Protection Group
  > Incorrect: Used for DR replication, not caching.
- [ ] Local Protection Group
  > Incorrect: Provides snapshots and protection but not caching.
- [ ] Snap Clones
  > Incorrect: Provides fast VM cloning, not caching.
- [x] Shadow Clones
  > Correct: Allows caching of read-intensive data across multiple nodes.

Explain: Nutanix Shadow Clones provide effective caching optimization, especially in VDI environments. They enable distributed caching of virtual disks across the Nutanix cluster. When multiple virtual desktops access the same data, Shadow Clones create local read-only copies of the data on each CVM, reducing read latency and improving performance. This is particularly beneficial in VDI deployments with multiple users accessing the same base image. This feature helps decrease read latency in any scenario with distributed multi-reader access.

### mci-storage-4ih5
domain: storage
difficulty: 3

Q: Which component is supported by Prism Central storage policies?
- [ ] Virtual Machines
  > Incorrect: Not directly managed by storage policies.
- [x] Volume Groups
  > Correct: Supported in storage policies for grouping volumes.
- [ ] VM Templates
  > Incorrect: Not directly related to storage policies.
- [ ] Storage Containers
  > Incorrect: Not a supported component in storage policies.

Explain: Prism Central storage policies support Volume Groups (VGs). They allow you to manage storage attributes like replication factor, encryption, compression, and Quality of Service (QoS) for VGs. A single storage policy can manage the attributes of several entities (like VMs and VGs) that are associated with various categories. You can apply storage policies to VGs on AHV and ESX.

### mci-monitoring-fk8s
domain: monitoring
difficulty: 3
image: images/a5q17.png

Q: After configuring modules for a Remote Syslog Server, the settings are as shown. The administrator notices that even though the level parameter is set to EMERGENCY, all monitor logs are being sent. What is the likely cause of this issue?
- [ ] A second rsyslog server is configured to send all monitor logs.
  > Incorrect: Possible but not the most direct cause.
- [ ] Having the Module Name set to STARGATE sends all monitor logs regardless of the level.
  > Incorrect: STARGATE module captures all logs at all levels.
- [ ] A Log Level of emergency includes all monitor logs.
  > Incorrect: as "Emergency" should only send critical logs.
- [x] The true setting for Include Monitor Logs sends all monitor logs regardless of the level.
  > Correct: the include-monitor-logs option sends all monitor logs, regardless of the level set by the level= parameter.

Explain: The issue you are encountering is due to the include-monitor-logs=true parameter. When this parameter is set to "true", all monitor logs are sent to the remote syslog server, regardless of the level setting (e.g., EMERGENCY). This is expected behavior. If you want to filter monitor logs based on level, you need to set include-monitor-logs=false.

### mci-vms-pcb4
domain: vms
difficulty: 3

Q: An administrator is creating a Windows 10 VM that will be used for a virtual desktop template. After creating the VM and booting to the ISO, the administrator is unable to install Windows and receives the error: "Couldn't find any drives. To get a storage driver, click Load Driver." What steps does the administrator need to take to install the OS?
- [ ] Load the Nutanix virt I/O serial bus driver.
  > Incorrect: Not related to disk detection.
- [ ] Load the virtio network ethernet driver.
  > Incorrect: Related to network but not storage.
- [ ] Load the Nutanix virt I/O balloon driver.
  > Incorrect: Used for memory optimization, not storage.
- [x] Load the virtio SCSI passthrough driver.
  > Correct: Required for detecting disks on AHV.

Explain: The administrator needs to load the VirtIO SCSI pass-through controller driver. When installing Windows on a Nutanix AHV cluster, the Windows installer needs this driver to recognize the virtual SCSI storage provided by AHV. Without it, the installer won't be able to find any drives to install Windows on, resulting in the error "Couldn't find any drives. To get a storage driver, click Load Driver." Loading the VirtIO network ethernet adapter, the Nutanix VirtIO Serial BUS driver, or the Nutanix VirtIO Balloon Driver won't resolve this issue because they are related to network, other devices, and memory management,

### mci-monitoring-idzj
domain: monitoring
difficulty: 3

Q: An administrator would like to leverage the Reliable Event Logging Protocol (RELP) with their Remote Syslog Server. After completing the configuration, it is observed that RELP logging is not working as expected. What is the likely cause of this issue?
- [ ] The cluster does not have RELP installed.
  > Incorrect: RELP is not installed on Nutanix clusters, but it is needed on the remote server.
- [ ] The GENESIS module was the only one chosen to forward log information.
  > Incorrect: GENESIS is not related to RELP logging.
- [ ] The Remote Syslog Server was configured using TCP as the protocol.
  > Incorrect: RELP requires its specific protocol, not just TCP.
- [x] The remote server does not have rsyslog-relp installed.
  > Correct: The remote syslog server must have rsyslog-relp installed to support RELP.

Explain: The likely cause of the Reliable Event Logging Protocol (RELP) not working is that the remote server does not have rsyslog-relp installed. As mentioned in the documentation, "To use RELP logging, ensure that you have installed rsyslog-relp on the remote syslog server." This indicates that the rsyslog-relp package is a requirement on the remote server, not the Nutanix cluster.

### mci-networking-dky3
domain: networking
difficulty: 3

Q: When is an IP address assigned to a VM connected to a Nutanix-managed network?
- [ ] When the vNIC is created on the VM
  > Incorrect: The vNIC creation does not assign an IP.
- [ ] When the VM is powered on
  > Incorrect: Powering on does not guarantee an IP assignment.
- [ ] When the guest OS sends a DHCP request
  > Incorrect: The request is necessary to get an IP address.
- [x] When the guest OS receives a DHCP acknowledge
  > Correct: This is the point at which an IP is assigned.

Explain: When a VM connects to a Nutanix-managed network, the IP address is assigned when the guest OS receives a DHCP acknowledgment. The VM's vNIC sends a DHCP request to the network's DHCP server, and upon receiving an acknowledgment, the IP address, along with other network configuration parameters, is assigned to the VM.

### mci-networking-1wcj
domain: networking
difficulty: 3
image: images/a5q21.png

Q: Refer Exhibit: An administrator is attempting to create an additional virtual switch on a newly deployed AHV cluster, using the two currently disconnected interfaces. The administrator is unable to select the interfaces when creating the virtual switch. What is the likely cause of this issue?
- [ ] Only one interface is available on the selected hosts.
  > Incorrect: The issue is not related to the number of interfaces.
- [ ] Interfaces must be connected to the network before they can be assigned.
  > Incorrect: Nutanix requires connected interfaces for assignment.
- [x] The disconnected interfaces are currently assigned to virtual switch 0.
  > Correct: If assigned to another switch, they must be freed first.
- [ ] Interfaces must be assigned to virtual switches via the CLI.
  > Incorrect: GUI can also be used for this task.

Explain: AHV creates a default virtual switch (vs0) during installation or upgrade. All default bridges (br0) on the nodes in the cluster are mapped to vs0. Additional interfaces, even if disconnected, might already be part of this default virtual switch, preventing them from being assigned to a new virtual switch. It's also worth noting that the default virtual switch cannot be deleted (though this may have changed in later versions). There are known issues with virtual switch configuration, so it's important to proceed cautiously.

### mci-monitoring-kbd6
domain: monitoring
difficulty: 3

Q: An administrator needs to periodically send information about cluster efficiency via email to a set of users. What should be configured to accomplish this task?
- [ ] Configure Efficiency widget in Prism Central.
  > Incorrect: The widget provides insights but does not schedule emails.
- [ ] Create a new Prism Central project.
  > Incorrect: Projects manage resources but do not handle reporting.
- [ ] Update Capacity Configurations in Prism Central.
  > Incorrect: Capacity settings do not relate to email reports.
- [x] Add a schedule to Prism Central reports.
  > Correct: Scheduling reports allows automatic email delivery.

Explain: To configure Prism Central to periodically send information about cluster efficiency via email, you should add a schedule to the reports. You can customize the report to include specific cluster efficiency metrics and choose the recipients for the emails.

### mci-storage-hn0u
domain: storage
difficulty: 3

Q: An administrator wants to ensure that data in a container is stored in the most space-efficient manner as quickly as possible after being written.
- [x] Inline Compression
  > Correct: Compresses data as it is written, saving space immediately.
- [ ] Thin Provisioning
  > Incorrect: Reduces allocated storage but does not compress data.
- [ ] Cache Deduplication
  > Incorrect: Works on hot data but does not ensure full storage efficiency.
- [ ] Erasure Coding
  > Incorrect: Improves redundancy but does not immediately optimize space.

Explain: Inline Compression compresses data as it's written. For large or sequential write operations (greater than 64 KB), data bypasses the OpLog and is compressed and written to the extent store. Smaller, random write operations (larger than 4 KB) are compressed and written to the OpLog. When this data is drained from the OpLog, it is decompressed, aligned in 32 KB blocks, and then written to the extent store. This method increases the effective capacity of both the vDisk OpLog and the cluster's hot tier. Almost all workloads are suitable for inline compression except for data that is already encrypted or compressed within the OS or application (like images, audio, and video files).

### mci-security-llfj
domain: security
difficulty: 3

Q: An administrator is preparing to deploy a new application on an AHV cluster. Security requirements dictate that all virtual servers supporting this application must be prevented from communicating with unauthorized hosts.
- [ ] Create a new VLAN, create a subnet on the cluster with the VLAN tag, deploy servers with vNICs in the new subnet.
  > Incorrect: VLANs help separate traffic but do not enforce communication rules.
- [x] Create a new Application Security Policy restricting communication to the authorized hosts and apply it to the servers in enforce mode.
  > Correct: Application Security Policies provide granular control over allowed communication.
- [ ] Create a new Isolation Environment policy, apply it to the new servers and all authorized hosts.
  > Incorrect: No such policy exists in AHV security features.
- [ ] Create a new subnet and assign to an existing policy.
  > Incorrect: A subnet alone does not enforce security restrictions.

Explain: To prevent virtual servers supporting the new application from communicating with unauthorized hosts on your AHV cluster, you should create a new Application Security Policy. Within this policy, specify the allowed communication partners for these virtual servers. Then, apply the policy to the servers in enforce mode. This approach offers granular control over communication and effectively restricts the virtual servers to interacting only with authorized hosts.

### mci-vms-y55b
domain: vms
difficulty: 3
image: images/a5q25.png

Q: Refer Exhibit: An administrator needs to update some images that were previously uploaded to their Nutanix cluster. While logged into Prism Element, when trying to update the images, the update icon is not enabled. What could be the cause for this behavior?
- [ ] The files were ISO but were uploaded as disk images, hence cannot be used or edited.
  > Incorrect: ISO images can still be used if uploaded correctly.
- [ ] Images are corrupted and must be re-uploaded.
  > Incorrect: Unlikely, as corruption would generally result in an error rather than a disabled update option.
- [ ] RBAC is configured and the administrator's user doesn't have the right privileges.
  > Incorrect: Role-Based Access Control (RBAC) can certainly restrict a user from performing updates. If a user is assigned a "Viewer" role, they will have read-only access and cannot modify any entities, including images
- [x] Images were imported into Prism Central.
  > Correct: This is the most common reason in a managed environment. When a cluster is registered to Prism Central, the Global Image Service takes over management. Images managed by Prism Central are often read-only in Prism Element to ensure centralized control and consistency across multiple clusters

Explain: When a Nutanix cluster is registered to Prism Central, certain management functions—including the Image Service—can be offloaded to Prism Central for global catalog management. If images were imported into or are managed by Prism Central, they may appear as read-only or have restricted actions (like updating or deleting) within the local Prism Element interface

### mci-architecture-49j8
domain: architecture
difficulty: 4

Q: An administrator wants to expand the Failure Domain level of a cluster. What two options are available? (Choose two.)
- [ ] Data Center
  > Incorrect: Nutanix does not support Data Center as a Failure Domain level.
- [x] Node
  > Correct: Nutanix allows failure domains at the node level.
- [x] Block
  > Correct: blocks can be designated as failure domains.
- [ ] Rack
  > Incorrect: Nutanix does not natively support rack-level failure domains.

Explain: An administrator wanting to expand the Failure Domain level of a cluster has two options: Node and Block. Nutanix clusters support failure domains at these two levels. The other options presented, Data Center and Rack, are not supported as Failure Domain levels in Nutanix.

### mci-storage-lkh3
domain: storage
difficulty: 3

Q: Which scenario would benefit most from Erasure Coding being enabled on a container?
- [ ] WEB and API Servers
  > Incorrect: these require low-latency storage, making EC unsuitable.
- [ ] High-performance databases where all data is relatively hot
  > Incorrect: erasure coding adds latency, making it unsuitable for hot data.
- [ ] VDI use cases where a single VM is cloned 100’s of times
  > Incorrect: VDI environments benefit more from Shadow Clones.
- [x] Long-term storage of data which is written once and read infrequently
  > Correct, Erasure Coding reduces storage footprint for cold data.

Explain: Erasure Coding (EC) offers significant space savings by reducing storage overhead, but it comes at the cost of performance. EC is most beneficial when enabled on containers storing write-cold data, meaning data written once and read infrequently. the scenario that would benefit most from enabling EC is long-term storage of data which is written once and read infrequently. In such cases, the reduced storage consumption outweighs the performance trade-off, as the data is not accessed regularly.

### mci-monitoring-gzw8
domain: monitoring
difficulty: 3

Q: Upon logging into Prism Central, an administrator notices high cluster latency. How can the administrator analyze data with the least number of steps or actions?
- [ ] Modify Data Density in the main Prism Central dashboard
  > Incorrect: Not directly related to latency analysis.
- [ ] Click on the chart in the widget to expand the data elements
  > Incorrect: Allows a quick drill-down into latency details.
- [ ] Take note of the cluster name and create a new Analysis chart
  > Incorrect: Requires additional steps to get insights.
- [x] Click the cluster name in the cluster quick access widget
  > Correct: Provides an immediate view of the cluster’s performance metrics.

Explain: Clicking the cluster name in the cluster quick access widget on the Prism Central main dashboard is the fastest way to investigate high cluster latency. This widget displays the average total (read and write) I/O latency for clusters experiencing the highest latency and provides a direct link to the cluster's summary page for more detailed performance analysis.

### mci-architecture-id1s
domain: architecture
difficulty: 3

Q: Why can't the Remove Host option be seen when trying to replace an old node in a 3-node cluster?
- [ ] The host needs to be placed into Maintenance Mode first
  > Incorrect: Required before removal
- [x] It is not possible to remove a node from a 3-node cluster
  > Correct: A 3-node cluster cannot have a node removed because it would compromise redundancy.
- [ ] It is only possible to remove a host from a cluster using CLI
  > Incorrect: Prism can be used
- [ ] The host needs to be removed from the cluster using Prism Central
  > Incorrect: Prism Element manages node removal

Explain: In a 3-node Nutanix cluster, removing a node isn't directly possible through the Remove Host option. This is because a 3-node cluster represents the minimum configuration for maintaining redundancy and fault tolerance. Removing a node would violate this fundamental principle. The standard process for replacing a node involves adding the new node to the existing 3-node cluster first. Once the new node is integrated and the cluster is healthy with 4 nodes, the old node can then be safely removed, preserving the necessary redundancy.

### mci-architecture-lg4q
domain: architecture
difficulty: 3

Q: Can an administrator enable block awareness and FT2 on a Nutanix AHV cluster with four blocks and one node per block?
- [x] No - FT2 requires a minimum of five nodes
  > Correct: FT2 needs at least 5 nodes
- [ ] Yes - Block awareness requires a minimum of three blocks
  > Incorrect: but FT2 still requires more nodes
- [ ] Yes - FT2 requires a minimum of three nodes
  > Incorrect: FT2 requires five nodes
- [ ] No - Fault tolerance changes are not supported
  > Incorrect: FT is configurable but requires sufficient nodes

Explain: No. While block awareness can be enabled with four blocks, FT2 requires a minimum of five nodes. The current configuration has only four nodes (one per block), which is insufficient for FT2. FT2 tolerates the failure of two nodes, and therefore requires at least five nodes to function correctly.

### mci-security-rhrv
domain: security
difficulty: 3

Q: How can an administrator provide a user access to real-time VM performance metrics across all clusters?
- [ ] Configure AD authentication and assign a custom role
  > Incorrect: Most flexible, but more maintenance required
- [ ] Configure IDP authentication and assign the Cluster Admin role
  > Incorrect: Too much privilege for viewing only
- [ ] Configure AD authentication and assign the Viewer role in Prism Element
  > Incorrect: Only grants access to one cluster
- [x] Configure a local account and assign Viewer role in Prism Central
  > Correct: Provides required access with minimal maintenance

Explain: To provide a user with access to real-time VM performance metrics across all clusters, the administrator should configure a local account and assign the "Viewer" role to that user in Prism Central. This approach grants the necessary read-only access to the required metrics with minimal administrative overhead and ongoing maintenance.

### mci-networking-as0q
domain: networking
difficulty: 3

Q: An administrator disconnects LAN interfaces from an AHV cluster node during validation testing. When the first interface is disconnected, guest VMs lose connectivity. What is the cause?
- [ ] One of the network interfaces has a bad patch cable.
  > Incorrect: A bad cable would cause connectivity issues, but not predictably.
- [ ] Portfast is not enabled on the switch ports.
  > Incorrect: Portfast can help with quicker reconnections but isn't the primary cause.
- [x] Switch ports are configured with different VLANs.
  > Correct: If VLANs differ between interfaces, guest VMs may lose access to the correct network.
- [ ] This is normal behavior for LAN Failover.
  > Incorrect: LAN failover should keep connectivity intact.

Explain: The most likely cause is a misconfiguration of VLANs on the switch ports connected to the AHV cluster node's network interfaces. When the administrator disconnects the first interface, the guest virtual machines (VMs) lose connectivity because the second interface is on a different VLAN. Traffic isn't properly routed between the two, leading to the disruption. When the second interface is disconnected, pings continue to both the hypervisor and guest VMs because they are likely now on the same VLAN and network. This is further supported by the fact that pings resume when the first interface is reconnected.

### mci-networking-naz4
domain: networking
difficulty: 3

Q: How should an administrator increase bandwidth to AHV hosts and CVMs?
- [ ] Use manage_ovs commands to update br0 to change the configuration to Active-Active.
  > Incorrect: While manage_ovs was historically used for this task, in modern Nutanix versions (AOS 5.19+), the Virtual Switch (VS) framework in Prism takes precedence . If you use the CLI to modify a bridge that is managed by a Virtual Switch (like br0 which is managed by vs0), the system will often block the command or automatically revert the change to match the Prism configuration
- [ ] In Prism, create vs1 interface and add any remaining uplinks.
  > Incorrect: Creating a second virtual switch (vs1) and bridge (br1) is typically used to separate traffic (e.g., dedicated uplinks for guest VMs or storage replication), rather than increasing the bandwidth of the primary management/storage path used by the AHV host and CVM . To increase bandwidth for the existing host and CVM traffic, you should optimize the primary switch (vs0).
- [ ] Use manage_ovs commands to create br1 and add any remaining uplinks.
  > Incorrect: Similar to option 1, using manage_ovs for bridge creation is deprecated in favor of the Prism UI for versions 5.19 and later . Furthermore, creating a new bridge (br1) does not inherently increase the bandwidth available to the CVM and AHV host, which remain on br0/vs0 by default
- [x] In Prism, update vs0 to change the configuration to Active-Active.
  > Correct: This is the correct and recommended method. Updating vs0 (which manages the default br0 bridge) to Active-Active (balance-tcp) allows the system to utilize the bandwidth of multiple physical uplinks simultaneously for the AHV host, CVM, and VM traffic . This configuration requires LACP to be enabled on the physical switches

Explain: In Nutanix AHV networking, the Controller VM (CVM) and the AHV host communicate through a default bridge called br0. In current versions of AOS, this bridge is managed by a logical entity in Prism called a Virtual Switch (vs0). By default, Nutanix uses an Active-Backup bond mode, where only one physical interface is active at a time for a given flow, limiting the total throughput to the speed of a single NIC. To increase available bandwidth and allow the host/CVM to use multiple uplinks at once, the administrator must change the bond mode to Active-Active (specifically balance-tcp with LACP) . Performing this change through the Prism UI ensures the configuration is applied consistently across all nodes in the cluster and persists through reboots and upgrades

### mci-monitoring-1a8d
domain: monitoring
difficulty: 3
image: images/a5q34.png

Q: An administrator is trying to create a custom alert policy for all VMs. Why is the "Alert Warning If" field greyed out?
- [ ] The "Alert Critical If" threshold is set.
  > Incorrect: Setting a critical threshold can not disable warning options.
- [x] The "Behavioral Anomaly" threshold is set.
  > Correct: When behavioral anomaly detection is enabled for a policy, the system automatically manages certain thresholds,
- [ ] The "Enable Policy" option is checked.
  > Incorrect: Enabling policy does not affect warning thresholds.
- [ ] The "Auto Resolve Alerts" option is checked.
  > Incorrect: Auto-resolve settings do not impact alert warnings.

Explain: The "Alert Warning If" field being grayed out is likely due to the "Behavioral Anomaly" threshold being set. When behavioral anomaly detection is enabled for a policy, the system automatically manages certain thresholds, which disables the manual setting of warning thresholds. This is mentioned in the search result titled "1 (1)" within the spreadsheet.

### mci-architecture-kfzb
domain: architecture
difficulty: 3

Q: An administrator is setting up a Nutanix cluster for a mission-critical workload. All VMs must continue running in case of hardware failure. What should be enabled?
- [ ] Change the fault tolerance level to Block
  > Incorrect: Not applicable to VM HA.
- [x] Enable HA Reservation in Prism Element
  > Correct: Ensures reserved resources for VM failover.
- [ ] Change the redundancy factor to 3
  > Incorrect: Affects data availability, not VM failover.
- [ ] Enable Degraded Node Detection
  > Incorrect: Helps detect failures but does not reserve resources.

Explain: Enabling HA Reservation in Prism Element is the correct action. HA Reservation ensures that sufficient resources are reserved in the cluster to restart VMs in case of a host failure. This guarantees the high availability of mission-critical workloads even during hardware failures. While other factors contribute to overall resilience, HA Reservation directly addresses the requirement for VMs to continue running despite hardware problems.

### mci-networking-x76w
domain: networking
difficulty: 3
image: images/a5q36.png

Q: Refer to the exhibit: Which virtual network technology does Nutanix AHV use?
- [ ] NSX-V
  > Incorrect: VMware-specific virtual networking.
- [ ] NSX-T
  > Incorrect: VMware SDN solution, not used by AHV.
- [ ] vDS
  > Incorrect: VMware's distributed switch.
- [x] OVS
  > Correct: AHV uses Open vSwitch (OVS) for networking.

Explain: Nutanix AHV uses Open vSwitch (OVS). OVS is an open-source virtual switch that provides a high-performance, scalable networking solution for AHV. It manages the network traffic between virtual machines (VMs) and the physical network.

### mci-vms-b0oq
domain: vms
difficulty: 3

Q: To minimize delays in LCM updates, what should an administrator do before starting?
- [ ] Enable automatic NCC updates
  > Incorrect: NCC updates help, but not the main factor.
- [ ] Manually migrate VMs to a single host
  > Incorrect: Unnecessary and may cause performance issues.
- [ ] Add vCPUs to each CVM
  > Incorrect: Unrelated to LCM update speed.
- [x] Disable any VM affinity rules
  > Correct: Prevents migration delays during updates.

Explain: To minimize delays during LCM updates, disable any VM affinity rules. This prevents delays caused by VM migrations that might be triggered by the update process.

### mci-storage-8acu
domain: storage
difficulty: 3
image: images/a5q38.png

Q: Refer Exhibit: An Administrator needs to enable inline deduplication for a pre-existing storage container. When trying to enable deduplication on the storage container, this feature is greyed OUT. What is the reason for this behaviour.
- [ ] Capacity reservation is not enabled
  > Incorrect: Not a requirement for deduplication.
- [x] Replication Factor 1 is configured
  > Correct: Deduplication requires RF2 or higher.
- [ ] Cluster has hybrid storage, but deduplication works only on all-flash clusters
  > Incorrect: Hybrid clusters support deduplication.
- [ ] Cluster has fewer than 5 nodes, the minimum required
  > Incorrect: Deduplication works with fewer nodes.

Explain: There are several reasons why the inline deduplication option might be grayed out for a storage container: Replication Factor 1: Inline deduplication requires a Replication Factor of 2 or higher. If the storage container is configured with RF1, the deduplication option will be unavailable. Hybrid Storage: Inline deduplication is only supported on all-flash clusters. If the cluster uses hybrid storage (a combination of flash and spinning disks), inline deduplication cannot be enabled. Datastore Type (Objects): Inline deduplication may be enabled by default for Objects storage, where it cannot be disabled from the standard UI. Note that disabling Erasure Coding (EC) will not automatically disable inline deduplication. While ncli or the REST API might allow you to disable EC or inline deduplication, the UI and standard workflow is to decommission/clean up Objects if it is not required, as this will remove the corresponding storage container and its inherent inline deduplication settings.

### mci-security-g3yj
domain: security
difficulty: 2

Q: What is the most likely cause of an AD user being unable to log in to Prism Central?
- [x] Change password at next logon attribute is set
  > Correct: This may prevent login but is not the most likely cause.
- [ ] User does not belong to the administrator’s group
  > Incorrect: If the user is not mapped to a role, they cannot log in.
- [ ] Active Directory functional level is wrong
  > Incorrect: This would prevent integration but is less likely the issue.
- [ ] Prism Element authentication is not configured
  > Incorrect: Prism Central authentication is separate.

Explain: The most likely cause is the "Change password at next logon" attribute being set for the AD user. While other issues such as incorrect role mapping or the user not belonging to the appropriate group could prevent access, a user being required to change their password on next login is a very common reason for login failures, especially for newly created accounts. If the user can log in to other AD resources, this further isolates the issue to the password reset requirement.

### mci-architecture-w7d1
domain: architecture
difficulty: 4
priority: true

Q: If a Nutanix cluster that has been deployed using ESXi is only using one data store, which advanced option needs to be set during the initial cluster deployment?
- [ ] das.ignoreInsufficientHbDatastore with Value of false
  > Incorrect: With only one Nutanix datastore, vSphere HA reports an insufficient-heartbeat-datastores warning unless das.ignoreInsufficientHbDatastore is set to true, not false.
- [ ] das.ignoreInsufficientHbDatastore with Value of 0
  > Incorrect: The advanced option must be set to the value true; 0 does not suppress the insufficient-heartbeat-datastores warning.
- [ ] das.ignoreInsufficientHbDatastore with Value of 1
  > Incorrect: The advanced option must be set to the value true; 1 does not suppress the insufficient-heartbeat-datastores warning.
- [x] das.ignoreInsufficientHbDatastore with Value of true
  > Correct: With only one (Nutanix) datastore, vSphere HA reports an insufficient-heartbeat-datastores warning unless das.ignoreInsufficientHbDatastore = true is set.

Explain: vSphere Availability settings for a Nutanix environment include enabling host monitoring and enabling admission control with the percentage-based policy using a value based on the number of nodes in the cluster (see vSphere HA Admission Control - percentage of cluster resources reserved as failover spare capacity). Because the cluster has only one (Nutanix) datastore, vSphere HA reports an insufficient-heartbeat-datastores warning unless the advanced option das.ignoreInsufficientHbDatastore = true is set during the initial cluster deployment.

### mci-security-pn7j
domain: security
difficulty: 3
priority: true

Q: To improve security on a newly created vSphere based Nutanix cluster, which two default passwords should be changed? (Choose two)
- [x] root user on ESXi
  > Correct: For an ESXi hypervisor, Nutanix recommends changing the default password of the local 'root' user account.
- [ ] nutanix user on vCenter
  > Incorrect: vCenter is not in Nutanix's list of default passwords to change, which covers the CVM, the installed hypervisor, Prism Central, IPMI, and the FSVMs.
- [x] nutanix user on the CVM
  > Correct: Nutanix recommends changing the default password of the local 'nutanix' user account on the Nutanix Controller VM (CVM).
- [ ] root user on Prism Central
  > Incorrect: For Prism Central, the accounts to change are the 'admin' Prism GUI user account and the local 'nutanix' user account, not root.

Explain: To secure a Nutanix cluster, Nutanix recommends changing the default passwords, including: the local 'nutanix' user account on the Nutanix Controller VM (CVM); the installed hypervisor - for ESXi the local 'root' user account, for AHV the local 'root', 'admin', and 'nutanix' accounts, for Hyper-V the local 'administrator' account; Prism Central's 'admin' Prism GUI user account and local 'nutanix' user account; the Out-of-Band Management (IPMI) 'ADMIN' user account; and the File Server VMs (FSVMs) 'nutanix' user account. On a vSphere based cluster the two to change are the ESXi root user and the CVM nutanix user.

### mci-lifecycle-m0tk
domain: lifecycle
difficulty: 3
priority: true

Q: After triggering a set of LCM updates, an administrator notices a failure message in Prism during the pre-checks. Unfortunately, the message does not contain enough information to isolate the exact cause of the pre-check failure. In order to obtain more context around the issue, which two logs should be investigated on the CVM? (Choose two)
- [ ] stargate.out
  > Incorrect: LCM writes all operations to genesis.out, lcm_ops.out, lcm_ops.trace, and lcm_wget.log; stargate.out is not among them.
- [x] lcm_ops.out
  > Correct: lcm_ops.out is one of the output logs LCM writes all operations to.
- [x] genesis.out
  > Correct: genesis.out is one of the output logs LCM writes all operations to.
- [ ] lcm_wget.out
  > Incorrect: The LCM output log is named lcm_wget.log, not lcm_wget.out.

Explain: LCM performs two functions: taking inventory of the cluster and performing updates on the cluster. LCM updates are not reversible, so before performing an update LCM runs a set of pre-checks to verify the state of the cluster; if any checks fail, LCM stops the update. LCM writes all operations to these output logs: genesis.out, lcm_ops.out, lcm_ops.trace, and lcm_wget.log - so genesis.out and lcm_ops.out are the two logs to investigate on the CVM for more context around a pre-check failure.

### mci-lifecycle-t9yn
domain: lifecycle
difficulty: 3
priority: true

Q: Refer to the exhibit. *(Prism hardware view: host 10.38.69.28 shows warning "Host is under maintenance")* Which two CLI commands are required to take the CVM and the node out of maintenance mode? (Choose two.)
- [x] acli host.exit_maintenance_mode host-ip
  > Correct: Run from any CVM in the cluster, this command removes the node from maintenance mode; verify with acli host.get host-ip.
- [x] ncli host edit id=host-ID enable-maintenance-mode=false
  > Correct: Run from any other CVM in the cluster after finding the host ID with ncli host list, this command removes the CVM from maintenance mode.
- [ ] acli host.disable_maintenance_mode host-ip
  > Incorrect: The documented command to remove the node from maintenance mode is acli host.exit_maintenance_mode host-ip.
- [ ] ncli host edit id=host-ID disable-maintenance-mode=true
  > Incorrect: The documented command to remove the CVM from maintenance mode is ncli host edit id=host-ID enable-maintenance-mode=false.

Explain: To remove the CVM from maintenance mode, first determine the ID of the host with ncli host list, then from any other CVM in the cluster run ncli host edit id=host-ID enable-maintenance-mode=false, and verify all processes on all CVMs are UP with cluster status | grep -v UP. To remove the node from maintenance mode, from any CVM in the cluster run acli host.exit_maintenance_mode host-ip, then verify the host has exited maintenance mode with acli host.get host-ip.

### mci-storage-opx0
domain: storage
difficulty: 3
priority: true

Q: Which terms describe performance acceleration features of the Distributed Storage Fabric?
- [ ] Extent Groups, vDisk flash mode and AHV Turbo
  > Incorrect: The DSF capabilities for performance acceleration are Intelligent Tiering, Data Locality and Automatic Disk Balancing.
- [x] Intelligent Tiering, Data Locality and Automatic Disk Balancing
  > Correct: These are the key capabilities the Distributed Storage Fabric (DSF) uses for performance acceleration.
- [ ] Erasure Coding, vDisk flash mode and Autonomous Extent Store
  > Incorrect: These are not the DSF performance acceleration capabilities, which are Intelligent Tiering, Data Locality and Automatic Disk Balancing.
- [ ] Deduplication, Compression and Erasure Coding
  > Incorrect: These are not the DSF performance acceleration capabilities, which are Intelligent Tiering, Data Locality and Automatic Disk Balancing.

Explain: The Distributed Storage Fabric (DSF) uses three key capabilities for performance acceleration. Intelligent Tiering continuously and automatically monitors data access patterns and optimizes data placement, moving data between the SSD and HDD tiers for optimal performance without requiring an administrator. Data Locality stores VM data on the node where the VM is running so read I/O does not have to go through the network, optimizing performance and reducing congestion; when a VM moves to another node (vMotion, live migration, or an HA event), the migrated VM data is also moved to ensure data locality. Automatic Disk Balancing keeps data distributed uniformly across the cluster, lets any node use storage resources across the cluster, reacts to changing workloads once it reaches its threshold, and makes manual rebalancing unnecessary.

### mci-storage-16du
domain: storage
difficulty: 4
priority: true

Q: The Autonomous Extent Store will bypass the OpLog in which workload scenario?
- [ ] Sequential Read
  > Incorrect: The OpLog bypass with AES applies only to sustained random write workloads, not sequential reads.
- [ ] Sequential Write
  > Incorrect: The OpLog bypass with AES applies only to sustained random write workloads, not sequential writes.
- [x] Sustained Random Write
  > Correct: Sustained random write workloads bypass the OpLog and are written directly to the Extent Store using AES.
- [ ] Sustained Random Read
  > Incorrect: The OpLog bypass with AES applies only to sustained random write workloads, not sustained random reads.

Explain: The Autonomous Extent Store (AES), introduced in AOS 5.10, is a method for writing and storing data in the Extent Store that leverages a mix of primarily local plus global metadata, allowing much more efficient sustained performance due to metadata locality. Sustained random write workloads bypass the OpLog and are written directly to the Extent Store using AES; bursty random workloads take the typical OpLog I/O path and then drain to the Extent Store using AES where possible. As of AOS 5.20 (LTS), AES is enabled by default for new containers on All Flash Clusters; as of AOS 6.1 (STS), if requirements are met, AES is enabled on new containers created on Hybrid (SSD+HDD) clusters.

### mci-storage-6m2j
domain: storage
difficulty: 3
priority: true

Q: What two types of VDI workloads benefit from enabling cache deduplication? (Choose two)
- [ ] VAAI Clone
  > Incorrect: Turning deduplication on for VAAI clone environments is not recommended.
- [x] Persistent Desktops
  > Correct: Cache deduplication is primarily recommended for persistent desktops.
- [x] Full Clone
  > Correct: Cache deduplication is primarily recommended for full-clone use cases.
- [ ] Linked Clone
  > Incorrect: Turning deduplication on for linked clone environments is not recommended.

Explain: Selecting the CACHE check box performs inline deduplication of read caches to optimize performance and requires Controller VMs configured with at least 24 GB of RAM; this feature is primarily recommended for full-clone, persistent desktops, and physical-to-virtual migration use cases, while turning deduplication on for VAAI clone or linked clone environments is not recommended. Selecting the CAPACITY check box performs post-process deduplication of persistent data, recommended primarily for full clone, persistent desktops, and physical-to-virtual migration use cases that need storage capacity savings, with Controller VMs having at least 32 GB of RAM and 300 GB SSDs for the metadata disk.

### mci-storage-8f5q
domain: storage
difficulty: 3
priority: true

Q: An administrator is preparing an RF2 4-node cluster to deploy a VDI project consisting of full clones. Which action should the administrator take within the cluster to support this workload?
- [ ] Create a dedicated storage pool with the default storage efficiency configuration.
  > Incorrect: For VDI workloads Nutanix recommends a separate storage container with inline compression and deduplication enabled, not the default configuration.
- [x] Create a dedicated storage container with inline compression and deduplication.
  > Correct: Nutanix recommends creating a separate storage container for VDI workloads with inline compression enabled and deduplication enabled on that container.
- [ ] Set cluster redundancy to RF3 to support Erasure Coding in a new Storage Container.
  > Incorrect: The recommended action for a full-clone VDI workload is a dedicated container with inline compression and deduplication, not changing cluster redundancy.
- [ ] Add one node to the cluster and enable Erasure coding in a new Storage Container.
  > Incorrect: The recommended action for a full-clone VDI workload is a dedicated container with inline compression and deduplication, not adding a node or enabling Erasure Coding.

Explain: Capacity optimization guidance: Nutanix recommends enabling inline compression unless otherwise advised, and recommends disabling deduplication for all workloads except VDI. For mixed-workload Nutanix clusters, create a separate storage container for VDI workloads and enable deduplication on that storage container.

### mci-networking-6ax2
domain: networking
difficulty: 3
priority: true

Q: A company wants a few lower priority VMs to communicate through 1G uplinks only. How could the company achieve this while still maintaining maximum throughput for the other mission critical VMs?
- [ ] Add all available uplinks to br0 and configure LACP.
  > Incorrect: Adding all available uplinks to br0 does not keep the lower priority VMs on a separate virtual switch with 1G uplinks only.
- [ ] Add all available uplinks to br0 and configure balance-slb.
  > Incorrect: Adding all available uplinks to br0 does not keep the lower priority VMs on a separate virtual switch with 1G uplinks only.
- [x] Create vs1 with 1G uplinks and assign the lower priority VMs a network on br1.
  > Correct: Creating a new virtual switch vs1 with 1G uplink interfaces and assigning the lower priority VMs to it keeps the mission critical VMs on a virtual switch that uses faster uplink interfaces.
- [ ] Create vs0 with 1G uplinks and assign the lower priority VMs a network on br1.
  > Incorrect: The company needs to create a new virtual switch (vs1) for the 1G uplinks rather than building vs0 with them.

Explain: To maintain maximum throughput for the mission-critical VMs, the company needs to create a new virtual switch (vs1) and assign the lower-priority VMs to it. Keeping the lower-priority VMs on a separate virtual switch from the mission-critical VMs allows the company to build the vs1 switch with 1Gb uplink interfaces, while keeping the mission-critical VMs on a virtual switch that uses faster uplink interfaces.

### mci-networking-s2a3
domain: networking
difficulty: 3
priority: true

Q: What is the Nutanix recommended configuration for taking full advantage of the bandwidth provided by multiple links?
- [ ] No Uplink Bond
  > Incorrect: It is used with only a single uplink interface on the virtual switch and thus cannot provide the same bandwidth advantage as Active-Active can.
- [ ] Active-Active with MAC Pinning
  > Incorrect: Balance-SLB locks (pins) the VM's network interface card (vNIC) to a single uplink interface at one time.
- [ ] Active-Backup
  > Incorrect: It only allows VMs to send traffic across one uplink interface at a time.
- [x] Active-Active
  > Correct: Also known as Balance-TCP, it allows VMs to send traffic across multiple virtual switch uplink interfaces, taking advantage of the aggregated bandwidth across all uplinks.

Explain: Active-Active (also known as Balance-TCP) allows VMs to send traffic across multiple virtual switch uplink interfaces, taking advantage of the aggregated amount of bandwidth across all uplink interfaces of the virtual switch. Active-Backup only allows VMs to send traffic across one uplink interface at a time. Active-Active with MAC Pinning (Balance-SLB) locks (pins) the VM's network interface card (vNIC) to a single uplink interface at one time. No Uplink Bond is used with only a single uplink interface on the virtual switch and thus cannot provide the same bandwidth advantage as Active-Active.

### mci-networking-4ube
domain: networking
difficulty: 3
priority: true

Q: The administrator wants to create a detailed network mapping of which nodes/NICs connect to which switches/ports, using MAC addresses, and plans on using a script to collect this information from the cluster. What would be the most efficient way to collect the node MAC address?
- [ ] Using the network configuration in Prism Element.
  > Incorrect: The way to find a host NIC MAC address is to execute ethtool -P on the AHV host, not the Prism Element network configuration.
- [x] Use the ethtool command via cli.
  > Correct: Running ethtool -P eth3 on the AHV host returns the NIC's permanent MAC address directly.
- [ ] Use the manage_ovs command via cli.
  > Incorrect: The way to find a host NIC MAC address is ethtool -P on the AHV host (or ifconfig showing the HWaddr), not manage_ovs.
- [ ] Use the IPMI interface collect HW data.
  > Incorrect: The way to collect the node MAC address is ethtool -P on the AHV host, not IPMI hardware data.

Explain: To find the MAC address of a host NIC, execute ethtool -P eth3 on the AHV host, which returns the permanent address (for example 00:25:90:cb:39:27); this makes the ethtool command the most efficient method for a script collecting node MAC addresses. Alternatively, ifconfig eth3 shows the HWaddr along with interface statistics such as RX/TX packets, errors, and drops.

### mci-monitoring-tnh4
domain: monitoring
difficulty: 3
priority: true

Q: An administrator needs to customize report settings, such as appearance and retention format that are differentiated for each corporate business unit. Where should these customizations be configured?
- [ ] In the main Report Setting in Prism Central Reports
  > Incorrect: Settings on the Reports dashboard apply globally to all reports, and settings applied at the report level take precedence over them.
- [ ] In Prism Central Settings, UI Settings
  > Incorrect: Report settings are configured on the Reports dashboard or in the New Report wizard, not in Prism Central UI Settings.
- [ ] In Nutanix Cloud Manager Operation Policies
  > Incorrect: Report settings are configured on the Reports dashboard or in the New Report wizard, not in Nutanix Cloud Manager Operation Policies.
- [x] In Report Settings for each report
  > Correct: Configuring Report Settings for each individual report applies settings at the report level, which takes precedence and allows differentiated customization per business unit.

Explain: Report settings can be configured for individual reports or for all generated reports, and they are applied depending on where they are configured; if settings are applied at both the global level (all reports) and the report level (when creating a new report), the report-level setting takes precedence. Global settings are reached by clicking Report Settings on the Reports dashboard, while report-level settings are reached by clicking Report Settings in the New Report wizard. Appearance configuration is divided into cover page settings (logo and background color) and content page settings (header color), with any of the 16 HTML-supported color names available. Differentiated per-business-unit customization therefore belongs in Report Settings for each report.

### mci-monitoring-z0bn
domain: monitoring
difficulty: 3
priority: true

Q: An administrator needs to compare two VMs to see if one is resource constrained. Which two chart types can provide the administrator with this information? (Choose two)
- [x] Entity Chart for each VM showing its CPU Ready %
  > Correct: Entity charts track one or more metrics for a single entity, so this focuses on each VM individually and can be used to compare the two VMs.
- [x] Metric chart showing each VM's CPU Usage %
  > Correct: Metric charts track a single metric for one or more entities, so this shows CPU Usage % across both VMs being compared.
- [ ] Metric chart showing cluster CPU Usage %
  > Incorrect: This is focused on cluster resource usage rather than the VMs being compared.
- [ ] Entity chart for each VM's host showing Hypervisor CPU Usage %
  > Incorrect: This is focused on host resource usage rather than the VMs being compared.

Explain: Both Entity and Metric charts are excellent methods of getting and analyzing data relevant to a Nutanix cluster environment: Entity charts track one or more metrics for a single entity (a VM in this scenario), while Metric charts track a single metric for one or more entities. The two choices that satisfy the requirement of comparing the two VMs are the Metric chart showing each VM's CPU Usage % (shows CPU Usage % across both VMs being compared) and the Entity chart for each VM showing its CPU Ready % (focuses on each VM individually, usable to compare the two). The remaining choices focus on host and cluster resource usage, not the VMs, and are therefore incorrect.

### mci-monitoring-odrs
domain: monitoring
difficulty: 3
priority: true

Q: From Monday to Friday, a VM has a CPU consumption range between 20% and 40%. During the weekend, the range decreases to between 15% and 25%. In the last week after an update, VM CPU usage has spiked to 100% every 60-120 minutes. In which two locations should the administrator look to track this behavior? (Choose two)
- [ ] In the VM details Alert tab.
  > Incorrect: Anomalies are recorded as events and appear in the behavioral anomaly event details screen and the VM details Metrics tab, not the Alert tab.
- [x] In the Event dashboard.
  > Correct: Usage outside the predicted behavior band is flagged as an anomaly and recorded as an event.
- [x] In the VM details Metrics tab.
  > Correct: Anomalies appear as outliers in the VM details Metrics tab.
- [ ] In the Alerts dashboard.
  > Incorrect: Anomaly detection records outliers as events shown in the event details screen and the VM details Metrics tab, not the Alerts dashboard.

Explain: Anomaly Detection predicts a normal behavior band for various metrics based on historical data: 27 metrics are monitored daily for VMs, hosts, and clusters; data from the past 21 days is recorded and analyzed, a normal behavior band is established, and predictions for the next 2 days are formulated, with bands adjusted when time period or trend patterns are observed (such as low CPU on weekends or increasing CPU usage). The module measures usage every five minutes and compares it with predicted values; a value outside the band is flagged as an anomaly and recorded as an event. Anomalies appear as outliers in the behavioral anomaly event details screen and the VM details Metrics tab.

### mci-performance-pjes
domain: performance
difficulty: 4
priority: true

Q: An administrator has been asked to increase the number of processors for a VM because an application is not performing well. Currently, the VM has 1 vCPU with 2 vCores. Prism shows 50% CPU usage and 0 CPU Ready. Which action should be taken?
- [ ] Do not add vCPUs because the cluster is already overcommitted.
  > Incorrect: CPU Ready Time is the percentage of time the VM was ready but could not get scheduled, and at 0 there is no sign of scheduling contention or overcommitment.
- [ ] Add 1 vCPU with 2 vCores to ensure vNUMA support.
  > Incorrect: The metrics show the application is unable to access additional virtual CPUs, so the VM would gain no benefit from more processors.
- [x] Do not add vCPUs because the application does not support SMP.
  > Correct: With only 50% CPU usage and no elevated CPU Ready, the application cannot access additional virtual CPUs, so increasing processors would provide no benefit.
- [ ] Add 2 vCores to double VM computing power.
  > Incorrect: The application is unable to access additional virtual CPUs, so adding vCores would not improve performance.

Explain: The VM is not performing well despite showing only 50% CPU usage and no elevated CPU Ready metrics. The administrator can use these metrics to evaluate the VM: Hypervisor CPU Usage is the percent of CPU used by the hypervisor, and Hypervisor CPU Ready Time (%) is the percentage of time the virtual machine was ready but could not get scheduled to run. Together these metrics show a VM whose installed application is unable to access additional virtual CPUs and thus would gain no benefit from an increased processor count; therefore the administrator should not add vCPUs because the application does not support SMP (Symmetric Multi-Processing).

### mci-performance-4int
domain: performance
difficulty: 3
priority: true

Q: Which Inefficient VM Profile type is used to identify a VM with Host I/O Stargate CPU usage > 85%?
- [ ] Over-provisioned VM
  > Incorrect: An over-provisioned VM is over-sized and wastes resources which are not needed, identified by low CPU and memory usage over the past 21 days, not Stargate CPU usage.
- [x] Bully
  > Correct: A bully VM consumes too many resources and causes other VMs to starve; one of its qualifying conditions is Host I/O Stargate CPU usage > 85% for over an hour.
- [ ] Inactive VM
  > Incorrect: An inactive VM is either dead (powered off for at least 21 days) or zombie (minimal I/O and byte traffic per day), not defined by Stargate CPU usage.
- [ ] Constrained VM
  > Incorrect: A constrained VM does not have enough resources for the demand, identified by high CPU or memory usage, CPU ready time, or memory swap rate, not Stargate CPU usage.

Explain: A bully VM consumes too many resources and causes other VMs to starve; it is flagged when it exhibits one or more of these conditions for over an hour: CPU ready time > 5%, memory swap rate > 0 Kbps, or Host I/O Stargate CPU usage > 85%. The other profiles do not use the Stargate CPU condition: a constrained VM lacks resources for demand (high CPU/memory usage, ready time, or swap rate over the past 21 days), an over-provisioned VM is the opposite, over-sized and wasting unneeded resources (low CPU and memory usage), and an inactive VM is either dead (powered off at least 21 days) or zombie (fewer than 30 I/Os and under 1000 bytes per day for 21 days).

### mci-security-wn75
domain: security
difficulty: 3
priority: true

Q: An administrator needs to configure an AHV cluster to be compliant with a corporate policy that all system logs are forwarded to a central log server for inspection and analysis. What two steps need to be taken? (Choose two)
- [x] Determine which modules and log levels need to be forwarded.
  > Correct: This is a required configuration step, performed with the rsyslog-config add-module command specifying the module name and log level.
- [x] Configure rsyslog-config via ncli.
  > Correct: The nCLI rsyslog-config command is how a Nutanix cluster is configured to send logs to a remote syslog server over TCP, UDP, or RELP.
- [ ] Install the Splunk Agent for AHV.
  > Incorrect: Installing a Splunk Agent is not required to forward logs to a Syslog server.
- [ ] Configure rsyslog forwarding via Prism Element.
  > Incorrect: Rsyslog forwarding cannot be configured within Prism Element; it can only be configured in Prism Central or in the CVM's ncli command mode.

Explain: The nCLI rsyslog-config command sends logs from a Nutanix cluster to a remote syslog server, forwarded from a Controller VM over TCP or UDP (or RELP if rsyslog-relp is installed on the remote server). The flow: disable the remote server while configuring (rsyslog-config set-status enable=false), create the syslog server (rsyslog-config add-server with name, IP, port, protocol), determine which modules and log levels need to be forwarded (rsyslog-config add-module), then enable it (rsyslog-config set-status enable=true). A Splunk Agent is not required, and forwarding cannot be configured within Prism Element - only in Prism Central (one syslog server for all registered clusters) or per cluster via the CVM's ncli.

### mci-architecture-nrpr
domain: architecture
difficulty: 2
priority: true

Q: Which service controls all I/O in the Nutanix cluster?
- [x] Stargate
  > Correct: Stargate is the data I/O manager, responsible for all data management and I/O operations and the main interface from the hypervisor, running on every node to serve localized I/O.
- [ ] Zookeeper
  > Incorrect: Zookeeper is the cluster configuration manager, storing all cluster configuration including hosts, IPs, and state, not the I/O service.
- [ ] Curator
  > Incorrect: Curator handles MapReduce cluster management and cleanup, such as disk balancing and proactive scrubbing, not I/O operations.
- [ ] Genesis
  > Incorrect: Genesis is the cluster component and service manager, responsible for service interactions (start/stop) and initial configuration, not I/O operations.

Explain: Stargate is the data I/O manager: it is responsible for all data management and I/O operations and is the main interface from the hypervisor (via NFS, iSCSI, or SMB), running on every node to serve localized I/O. Curator handles MapReduce cluster management and cleanup (disk balancing, proactive scrubbing) under an elected Curator Leader, with full scans about every 6 hours and partial scans every hour. Genesis is the cluster component and service manager running on each node, requiring only Zookeeper to be up. Zookeeper is the cluster configuration manager storing hosts, IPs, and state, running on three nodes with an elected leader and accessed via the Zeus interface.

### mci-architecture-c629
domain: architecture
difficulty: 2
priority: true

Q: Which service is responsible for running the Nutanix GUI interface?
- [ ] Pithos
  > Incorrect: Pithos is the vDisk (DSF file) configuration manager, running on every node and built on top of Cassandra.
- [ ] Zeus
  > Incorrect: Zeus is the library all other components use to access the cluster configuration, implemented using Apache Zookeeper.
- [x] Prism
  > Correct: Prism is the management gateway for configuring and monitoring the Nutanix cluster, including Ncli, the HTML5 UI, and REST API.
- [ ] Medusa
  > Incorrect: Medusa is the abstraction layer in front of the distributed database that holds metadata about where data and replicas are stored.

Explain: Prism is the management gateway (UI and API) for components and administrators to configure and monitor the Nutanix cluster, including Ncli, the HTML5 UI, and REST API; it runs on every node in the cluster and uses an elected leader like all components. Pithos is the vDisk (DSF file) configuration manager, running on every node on top of Cassandra. Medusa is the Nutanix abstraction layer in front of the database that tracks where data and its replicas are stored, distributed across all nodes using a modified Apache Cassandra. Zeus is the library all other components use to access the cluster configuration (hosts, disks, storage containers, IPs, replication rules), currently implemented with Apache Zookeeper.

### mci-monitoring-ufho
domain: monitoring
difficulty: 3
priority: true

Q: An administrator has created custom alert policies in Prism Central that monitor CPU and Memory usage of guest VMs. The application owners of specific VMs should be notified by email when an alarm is triggered. What does the administrator need to configure?
- [x] Create a rule to send an email to the application owner.
  > Correct: Prism Central allows configuring rules for who should receive email alerts and customizing the alert messages.
- [ ] Configure the email settings within each VM category.
  > Incorrect: Configuring alert emails is separate from any configuration of VM categories.
- [ ] Create a task to send an email to the application owner.
  > Incorrect: Alert email recipients are configured through rules in Prism Central, not through a task.
- [ ] Configure the email settings within each specific alert policy.
  > Incorrect: Configuring alert emails is a separate action from configuring the specific alerts, so it is not completed within the alert policy.

Explain: Prism Central allows configuring rules for who should receive email alerts and customizing the alert messages. Configuring alert emails is a separate action from configuring the specific alerts, so it is not completed within the alert policy, and it is also separate from any configuration of VM categories. Prism Central alert emailing is not enabled by default - you must explicitly enable it and specify the recipients (Nutanix customer support and/or supplied addresses), and Prism Central requires an SMTP server to send the messages. These emails are in addition to any alert emails configured on individual clusters through Prism Element, so disable per-cluster customer notifications there if you want to avoid double emails for the same alert.

### mci-vms-tuqo
domain: vms
difficulty: 3
priority: true

Q: An administrator has observed that memory usage for a Windows VM is reporting as 100% utilized in Prism, while the in-guest usage never reports above 30%. What action should the administrator take to resolve this issue?
- [ ] Reboot the host where the VM is running
  > Incorrect: Prism's memory reporting depends on the balloon driver inside the guest; rebooting the host does not install the missing driver.
- [ ] Reboot the VM
  > Incorrect: The mismatch is caused by a missing or outdated balloon driver, not VM state, so a reboot does not add the driver.
- [x] Install the VirtIO Balloon driver
  > Correct: AOS relies on data from the in-guest balloon driver, part of the Nutanix VirtIO package, and Windows does not ship this driver with the OS.
- [ ] Live Migrate the VM
  > Incorrect: Moving the VM to another host does not provide the in-guest balloon driver that Prism needs to report memory usage.

Explain: AOS reports guest VM memory usage using data provided by the balloon driver running inside the guest, which is part of the Nutanix VirtIO package. Linux VMs have this driver pre-installed in most cases, but Windows does not have it packaged with the OS. When the balloon driver is not installed, or the installed driver version is old, memory usage is not reported correctly in Prism, so installing the VirtIO Balloon driver resolves the discrepancy between the 100% reading in Prism and the 30% in-guest usage.

### mci-vms-wfl5
domain: vms
difficulty: 3
priority: true

Q: A company initially purchased a single Nutanix AHV cluster for virtual desktops. They have configured the gold image to reside on the cluster to provision their desktops. After 6 months they have made an additional investment for 4 more clusters that are also dedicated to run virtual desktop workloads. In order for the administrator to be able to keep the gold image consistent across all clusters, what are the two items that the Nutanix administrator needs to implement? (Choose two)
- [x] Create an Image Placement Policy in PC
  > Correct: The Image Placement Policy, created in Prism Central with the wizard, associates the image categories with the cluster categories to keep the gold image consistent across clusters.
- [ ] Setup Leap OnPrem and deploy Protection\Recovery plans
  > Incorrect: Setting up Leap is not relevant to keeping a gold image consistent across clusters.
- [x] Create a custom category and tag the cluster and image
  > Correct: Categories must first be created and associated with the respective cluster and image so the placement policy can link them together.
- [ ] Install NGT on the gold image so it can replicate between clusters
  > Incorrect: Installing NGT is not relevant to this task.

Explain: Within Prism Central the administrator must first create categories for the cluster and image, then associate each category with its respective cluster and image, and finally create an Image Placement Policy using the Create Image Placement Policy wizard, associating the two categories together via the steps "Assign Images from the Following Categories" and "To The Clusters From The Following Categories". Installing NGT and setting up Leap are not relevant to this task.

### mci-security-fldu
domain: security
difficulty: 2
priority: true

Q: What are two supported values of a Encryption Storage Policy? (Choose two)
- [x] Inherit from Cluster
  > Correct: Inherit from Cluster is one of the possible settings when enabling Encryption within a Storage Policy.
- [x] Enabled
  > Correct: Enabled is one of the possible settings when enabling Encryption within a Storage Policy.
- [ ] Self Encrypting Drives (SED) Encryption
  > Incorrect: Not a supported setting; the possible Encryption settings within a Storage Policy are Enabled and Inherit from Cluster.
- [ ] Disabled
  > Incorrect: Not a supported setting; the possible Encryption settings within a Storage Policy are Enabled and Inherit from Cluster.

Explain: When enabling Encryption within a Storage Policy, the possible settings are Enabled and Inherit from Cluster; the other listed values are not supported settings for an Encryption Storage Policy.

### mci-storage-9j7i
domain: storage
difficulty: 3
priority: true

Q: An administrator has created several storage containers, which are all associated with the same storage pool. Each container has different optimizations to support the VM workload. Which two actions can the administrator take to ensure that one container does not use all remaining storage space? (Choose two)
- [ ] Enable Compression for each storage container
  > Incorrect: The stated way to keep one container from using all remaining space is to configure Reserved Capacity and Advertised Capacity for each container, not compression.
- [x] Configure the Reserved Capacity for each storage container
  > Correct: Capacity reservation guarantees that a storage container has a minimum amount of space reserved that is unavailable to other storage containers.
- [ ] Enable Deduplication for each storage container
  > Incorrect: The stated way to keep one container from using all remaining space is to configure Reserved Capacity and Advertised Capacity for each container, not deduplication.
- [x] Configure the Advertised Capacity for each storage container
  > Correct: Configuring the Advertised Capacity for each container ensures one container does not take all remaining space; allocate extra room beyond projected VM size for data not yet garbage collected.

Explain: By default each storage container has access to all of the unused storage in the storage pool, so with multiple containers one may take all the remaining space and leave others with none. To prevent this, configure the Advertised Capacity and the Reserved Capacity for each storage container; capacity reservation guarantees a container a minimum amount that is unavailable to other containers. Best practices: reserve capacity only if the pool has multiple containers, reserve no more than 90% of the pool space in total, and when setting an advertised capacity allocate extra space beyond the projected size of the VMs to allow for data not yet garbage collected (10% or more of the storage capacity in some cases).

### mci-storage-wn50
domain: storage
difficulty: 3
priority: true

Q: An administrator is setting up a new storage container which will host persistent (full clone) VDI desktop VMs. Which storage optimization feature should be enabled?
- [ ] Flash Pinning
  > Incorrect: The stated recommendation for VDI workloads is to enable deduplication on the storage container, not this feature.
- [ ] Redundancy Factor 1
  > Incorrect: The stated recommendation for VDI workloads is to enable deduplication on the storage container, not this feature.
- [ ] Post-Process Compression
  > Incorrect: Nutanix recommends inline compression unless otherwise advised; the feature called out for VDI containers is deduplication.
- [x] Deduplication
  > Correct: Nutanix recommends disabling deduplication for all workloads except VDI, enabling it on a separate storage container dedicated to VDI workloads.

Explain: Nutanix recommends enabling inline compression unless otherwise advised and disabling deduplication for all workloads except VDI. For mixed-workload Nutanix clusters, create a separate storage container for VDI workloads and enable deduplication on that storage container, so deduplication is the storage optimization feature to enable for a container hosting persistent full-clone VDI desktop VMs.

