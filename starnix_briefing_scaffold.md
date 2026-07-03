<!-- StarNix briefing/eli5/tags scaffold. One entry per question; keyed by id comment + stem (matches the bank). -->
<!-- FILL @briefing, @eli5, @tags. @answer/@domain/@context are read-only context. -->

<!-- a1q1 -->
### Q
An administrator sees the alert shown in the exhibit. What should the administrator do to make sure the Nutanix user can no longer SSH to a CVM using a password?
@answer: Enable Cluster Lockdown.
@domain: security
@context: Enabling Cluster Lockdown ensures the nutanix user cannot SSH using a password.
@briefing: 
@eli5: 
@tags: 

<!-- a1q2 -->
### Q
How many copies of the metadata are maintained within a Redundancy Factor 3 Nutanix cluster?
@answer: 5
@domain: architecture
@context: A Redundancy Factor 3 (RF3) cluster maintains five copies of the metadata. This ensures availability and consistency even if two nodes fail. While the data itself has three copies in RF3, the metadata has five to guarantee quorum and prevent split-brain scenarios.
@briefing: 
@eli5: 
@tags: 

<!-- a1q3 -->
### Q
Which update in LCM can an administrator apply on a per-node basis?
@answer: BMC
@domain: lifecycle
@context: Nutanix LCM allows firmware updates to be applied on a per-node basis. While software updates generally apply to the whole cluster, firmware updates like BIOS or BMC can be applied to individual nodes.
@briefing: 
@eli5: 
@tags: 

<!-- a1q4 -->
### Q
What is the default admin session log out time?
@answer: 15 minutes
@domain: security
@context: The default admin session timeout in Prism is 15 minutes. While the session timeout setting in the UI can be adjusted to longer durations, the IAM token and session cookie still expire after 15 minutes. The UI setting controls how long the UI attempts to keep the session alive by making API calls.
@briefing: 
@eli5: 
@tags: 

<!-- a1q5 -->
### Q
When configuring a physical network switch in Prism Element, what information is needed?
@answer: SNMP Configuration
@domain: networking
@context: To configure a physical network switch in Prism Element, you'll need SNMP information for the switch, including the switch management IP address, SNMP version, security level, community name, authentication type, privacy type (if applicable), and privacy passphrase (if applicable).
@briefing: 
@eli5: 
@tags: 

<!-- a1q6 -->
### Q
After deploying a cluster, time is not synchronizing properly. What task needs to be performed on the cluster?
@answer: NTP configuration
@domain: networking
@context: NTP (Network Time Protocol) configuration is necessary. After the cluster deployment, ensure that the NTP service is running and configured correctly on each CVM. The cluster should be configured to synchronize with at least three reliable NTP servers for redundancy and accuracy.
@briefing: 
@eli5: 
@tags: 

<!-- a1q7 -->
### Q
In an RF2 Nutanix cluster, what is the minimum number of nodes required to allow a host removal?
@answer: 4
@domain: architecture
@context: Four nodes are required to remove a host from an RF2 Nutanix cluster. With RF2, two copies of the data exist, ensuring redundancy and fault tolerance. A four-node cluster ensures sufficient resources are available for data replication and availability during the host removal process.
@briefing: 
@eli5: 
@tags: 

<!-- a1q8 -->
### Q
An administrator has been tasked with increasing security on a Nutanix cluster by disabling password authentication when accessing the CVM and AHV hosts and instead moving to key-based SSH. What is the easiest way for the administrator to meet these requirements?
@answer: Enable Cluster Lockdown and provide an RSA key.
@domain: security
@context: To increase security on a Nutanix cluster by disabling password authentication for Controller Virtual Machine (CVM) and AHV hosts and moving to key-based SSH, enabling Cluster Lockdown and providing an RSA key is the recommended approach.1
@briefing: 
@eli5: 
@tags: 

<!-- a1q9 -->
### Q
An administrator needs to make sure that a VM is powered on before the rest of the VMs when starting a host. Which configuration option allows this behavior?
@answer: Agent VM
@domain: vms
@context: The configuration option that allows a VM to be powered on before other VMs when starting a host is to configure the VM as an agent VM. This setting ensures that the VM is prioritized during the host's startup sequence and is powered on before other standard VMs. Agent VMs are typically used for essential services, such as providing network functions, that need to be available before other VMs can function correctly.
@briefing: 
@eli5: 
@tags: 

<!-- a1q10 -->
### Q
When expanding a Nutanix cluster, what is required to automatically discover new nodes?
@answer: IPv6 multicast must be allowed on physical switches.
@domain: networking
@context: IPv6 multicast must be allowed on the physical switches for automatic node discovery during cluster expansion. The Controller Virtual Machine (CVM) initiates the process by sending IPv6 and IPv4 multicast packets on port 5353.
@briefing: 
@eli5: 
@tags: 

<!-- a1q11 -->
### Q
An administrator has been asked to calculate baseline Capacity Runway on a newly registered AHV cluster. The cluster has been up and running for 16 days, but no runway projections are displayed. Why are no Capacity Runway projections being displayed?
@answer: Capacity Planning requires at least 21 days of data.
@domain: performance
@context: Capacity Runway projections require at least 21 days of data from a newly registered AHV cluster. Since the cluster has only been running for 16 days, there is insufficient data for the projections to be displayed. Additionally, it takes approximately one day after cluster registration for data to begin appearing in Prism Central
@briefing: 
@eli5: 
@tags: 

<!-- a1q12 -->
### Q
An administrator is responsible for resource planning and needs to plan for resiliency of a 10-node RF3 Nutanix cluster. The cluster has 100TB of storage. How should the administrator plan for capacity in the event of future failures?
@answer: Set Reserve Capacity for Failure to Auto Detect.
@domain: storage
@context: In an RF3 cluster, using "Auto Detect" ensures that failure reserves are calculated correctly.
@briefing: 
@eli5: 
@tags: 

<!-- a1q13 -->
### Q
An administrator has tasked to configured AHV Metro Availability with Witness and wants to document failover scenarios. As a part of the failover tests, connection losses between these pairs were simulated: - Both the metro pair of clusters. -Primary cluster and Prism Central. However, Prism Central and the recovery cluster are still connected. What are two expected system behaviors in this case? (Choose two.)
@answer: Guest VM I/O operations pause (freeze) until connectivity is restored. | Guest VMs failover automatically to the recovery cluster.
@domain: data-protection
@context: Witness Initiated Failover: The Witness VM will detect the failure of the primary cluster and automatically initiate a failover to the recovery cluster.
@briefing: 
@eli5: 
@tags: 

<!-- a1q14 -->
### Q
An administrator is working with a network team to design the network architecture for a Disaster Recovery (DR) failover. Because DNS is well-designed and implemented, DR will utilize a different subnet from production. To make the planning and execution easy to implement, the network team would like to utilize the same last octet in the IP address in DR. What is the best way to achieve this?
@answer: Utilize Recovery Plan Offset-based IP mapping.
@domain: data-protection
@context: The best way to retain the same last octet in the IP address while using a different subnet during DR failover is to use static IP mapping within the Recovery Plan. While Nutanix often tries to retain the last octet automatically, it's not guaranteed without static mapping.
@briefing: 
@eli5: 
@tags: 

<!-- a1q15 -->
### Q
A user created a report in the prism central Intelligent Operations Analysis Dashboard but forgot to download it. However, after logging back into Prism Central, the administrator finds that the report is no longer available. What is the most likely cause?
@answer: Reports are automatically deleted after 24 hours.
@domain: monitoring
@context: The most likely reason is that the report was automatically deleted after 24 hours. Reports generated in the Intelligent Operations dashboard are automatically purged after this time. To retain a report, you should download it (in PDF or CSV format) or save it as a report configuration for later use.
@briefing: 
@eli5: 
@tags: 

<!-- a1q16 -->
### Q
An administrator receives complaints about VM performance. After reviewing the VM’s CPU Ready Time data shown in the exhibit, which step should the administrator take to diagnose the issue and identify root cause?
@answer: Review host CPU utilization.
@domain: vms
@context: High CPU Ready Time suggests CPU overcommitment or host saturation. The administrator should check host CPU usage in Prism Central to determine if the cluster is overloaded. If host CPU usage is consistently above 85–90%, VMs are competing for CPU resources, leading to high CPU Ready Time.
@briefing: 
@eli5: 
@tags: 

<!-- a1q17 -->
### Q
An administrator is experiencing performance issues within a VM and believes that more vCPUs should be added to the specific VM. The cluster as a whole appears to be performing well.
Which two metrics should be analyzed to determine if adding more vCPUs is warranted? (Choose two.)
@answer: VM CPU Ready Time | VM CPU Usage
@domain: performance
@context: To determine whether adding more virtual CPUs (vCPUs) would improve the virtual machine's (VM) performance, the administrator should analyze these two metrics: CPU Ready Time: This metric indicates the amount of time a VM has to wait for available physical CPU resources. High CPU ready times suggest that the VM is experiencing CPU contention and could benefit from additional vCPUs. CPU Usage: While high CPU usage alone doesn't necessarily mean adding more vCPUs will help, it's important to analyze it in conjunction with CPU ready time. If CPU usage is high and CPU ready time is high, it strongly suggests that the VM is CPU constrained and could benefit from additional vCPUs. If, however, CPU usage is low, adding more vCPUs is unlikely to improve performance. Adding vCPUs won't resolve performance issues if the VM isn't already using all of its available CPU resources.
@briefing: 
@eli5: 
@tags: 

<!-- a1q18 -->
### Q
After upgrading Prism Central from PC2022.1 to PC2024.1, an administrator is unable to log in with their IAM active directory domain account.
What is the first thing the administrator should do?
@answer: Log in with a local admin account.
@domain: security
@context: Using a local admin account helps diagnose and fix IAM authentication failures.
@briefing: 
@eli5: 
@tags: 

<!-- a1q19 -->
### Q
Refer to the exhibit.
The customer expects to maintain a cluster runway of 9 months. The customer doesn’t have a budget for 6 months, but they want to add new workloads to the existing cluster.
Based on the exhibit, what is required to meet the customer's budgetary timeframe?
@answer: Add resources to the cluster.
@domain: performance
@context: The exhibit shows that the overall runway is only 59 days, meaning that the current cluster does not have enough capacity to sustain workloads for 6 months, let alone 9 months. The best solution is to add resources to the cluster (Option 1), such as CPU, memory, orstorage, to extend the runway.
@briefing: 
@eli5: 
@tags: 

<!-- a1q20 -->
### Q
A DR administrator has set up a Protection Policy for 50 workloads, all configured similarly in terms of OS, storage, network, and performance. The RPO is 60 minutes with a specified retention of 10 local copies, 5 remote copies, and crash consistency. After configuring the protection policy and activating it, the administrator has noticed that recovery points are not appearing at the DR site yet, everything within the Protection Policy looks correct and recovery points are not showing up on production side.
What is the most likely issue?
@answer: The storage container name on the DR cluster does not match the production cluster.
@domain: data-protection
@context: The most likely reason why recovery points are visible on the production side but not at the DR site, despite a correctly configured Protection Policy, is that the storage container name on the DR cluster does not match the production cluster. If a storage container with the same name is not found on the destination cluster, the replicated data will be directed to the SelfServiceContainer. This can lead to recovery points not being readily available in the expected location on the DR site.
@briefing: 
@eli5: 
@tags: 

<!-- a1q21 -->
### Q
An administrator needs to create 2 virtual machines: VM4 and VM5 that leverage the memory over-commit feature. Once VM4 is created and running, the administrator notices that it uses only 28GB of RAM. What will be the maximum RAM that can be allocated to VM5 so that it can be powered on?
@answer: 8GB
@domain: vms
@context: Thehost has 128GB of physical RAM. Thecurrent memory allocationacrossthree VMs (VM1, VM2, VM3) is 128GB, but only92GB is actually utilized. This means there is36GB of unutilized memory available for allocation. VM5 can be allocated up to 8GB of RAM, considering overcommit and available resources the available ememory 36 - 28=8.
@briefing: 
@eli5: 
@tags: 

<!-- a1q22 -->
### Q
The team leads of a dev environment want to limit developer access to a specific set of VMs.
What is the most efficient way to enable the team leads to directly manage these VMs?
@answer: Create a Project for each team lead and assign access.
@domain: security
@context: Based on the search results, using projects and roles within Nutanix's access control system seems like the most direct approach for enabling team leads to manage specific VMs in a development environment.
@briefing: 
@eli5: 
@tags: 

<!-- a1q23 -->
### Q
An administrator using a dark site deployment for LCM is attempting to upgrade to the latest BIOS. After completing an inventory scan, the administrator does not see the expected BIOS version available for upgrade. What is the most likely reason the latest BIOS is not shown after inventory?
@answer: The latest compatibility bundle has not been uploaded.
@domain: lifecycle
@context: The most likely reason the latest BIOS version isn't shown in Life Cycle Manager (LCM) after an inventory scan in a dark site deployment is that the latest compatibility bundle has not been uploaded. LCM relies on the compatibility bundle to understand which updates are available. If the bundle isn't up-to-date, the latest BIOS versions won't be displayed for upgrade.
@briefing: 
@eli5: 
@tags: 

<!-- a1q24 -->
### Q
An administrator needs to create a single chart showing multiple storage bandwidth metrics a VM is consuming. Which type of chart should the administrator create?
@answer: Entity Chart
@domain: monitoring
@context: To create a single chart that shows multiple storage bandwidth metrics for a single virtual machine (VM), an administrator should create an Entity Chart. An Entity Chart is the appropriate choice because it is designed to display various performance metrics for a single selected entity, such as a specific VM. This allows an administrator to correlate different metrics, like read bandwidth, write bandwidth, and total bandwidth, for that one VM on a single graph. Resources
@briefing: 
@eli5: 
@tags: 

<!-- a1q25 -->
### Q
What guest customization options are available when creating a VM template?
@answer: Sysprep, Cloud-init
@domain: vms
@context: Sysprep (for Windows), cloud-init (for Linux), custom scripts, and guided scripts are all guest customization options available when creating a VM template.
@briefing: 
@eli5: 
@tags: 

<!-- a1q26 -->
### Q
An administrator wants to make sure that VMs can be migrated and restarted on another node in the event of a single-host failure. What action should be taken in Prism Element to meet this requirement?
@answer: Enable HA Reservation.
@domain: vms
@context: To ensure that VMs can be migrated and restarted on another node in the event of a single-host failure, enable High Availability (HA) in Prism Element. HA reserves a portion of cluster resources to restart VMs on surviving nodes if a host fails.
@briefing: 
@eli5: 
@tags: 

<!-- a1q27 -->
### Q
An administrator needs to enable application discovery on a Nutanix cluster to monitor applications. A Prism Central instance is already configured and meets the licensing, CPU and memory requirements.
What two other prerequisites must be met before enabling application discovery? (Choose two.)
@answer: API key and key ID | Internet connection
@domain: monitoring
@context: The prerequisites for enabling application discovery on a Nutanix cluster, given that you already have a Prism Central (PC) instance with sufficient CPU and memory are: Internet connection: Application Discovery requires a connection to the Nutanix cloud for gathering and analyzing netflow network data. API key and key ID are necessary for certain functionalities within application discovery and other integrations.
@briefing: 
@eli5: 
@tags: 

<!-- a1q28 -->
### Q
An administrator wants to enable Windows Defender Credential Guard to comply with company policy. The new VM configurations include:
- Legacy BIOS
- 4 vCPUs
- 8 GB RAM
- Windows Server 2019
What must be changed in order to properly enable Windows Defender Credential Guard?
@answer: Enable UEFI with Secure Boot.
@domain: vms
@context: Windows Defender Credential Guard requires UEFI with Secure Boot enabled.
@briefing: 
@eli5: 
@tags: 

<!-- a1q29 -->
### Q
An administrator attempted to enable Data-in-Transit Encryption on a Scale-Out Prism Central cluster to encrypt service-level traffic between nodes. However, the feature did not work correctly due to a firewall restriction. Which CVM-specific port should be allowed through the firewall for Data-in-Transit Encryption?
@answer: 2009
@domain: security
@context: The correct port to allow for Data-in-Transit Encryption on a Scale-Out Prism Central cluster is 2009. The Nutanix Security Guide v7.0 states that you should "ensure that you allow port 2009, which is used for Data-in-Transit Encryption." This document also notes that Data-in-Transit Encryption encrypts service-level traffic between cluster nodes.
@briefing: 
@eli5: 
@tags: 

<!-- a1q30 -->
### Q
In a scale-out Prism Central deployment, what additional functionality does configuring an FQDN instead of a Virtual IP provide?
@answer: Load balancing
@domain: architecture
@context: When using FQDN instead of a Virtual IP in a scale-out Prism Central deployment, Nutanix enables load balancing across multiple Prism Central instances.
@briefing: 
@eli5: 
@tags: 

<!-- a1q31 -->
### Q
How can a VM or Volume Group (VG) be associated with a Storage Policy?
@answer: Assign the VM or VG to the same Category as the Storage Policy.
@domain: vms
@context: A VM or Volume Group (VG) can be associated with a Storage Policy using categories. Storage Policies are applied to VMs and VGs via categories using the Kanon service, which applies/fixes up policies every 30 minutes. A default Storage Policy can be selected during VM/VG creation
@briefing: 
@eli5: 
@tags: 

<!-- a1q32 -->
### Q
An administrator is managing a 4-node Nutanix cluster, based on intermixed hardware as follows:
- Two G5 Nodes # 2 CPUs (12 cores), 1 SSD (1.92 TB), 2 HDDs (4 TB).
- Two G7 Nodes # 2 CPUs (16 cores), 2 SSDs (1.92 TB), 4 HDDs (4 TB).
G5 Nodes are going out of support and need to be replaced, this cluster will be decommissioned from production and used for Disaster Recovery purposes with an RPO of 1 hour.
What is the supported configuration when swapping G5 nodes without impacting performance?
@answer: New node must have at least 2 SSDs.
@domain: architecture
@context: For optimal Disaster Recovery performance, new nodes must match or exceed the storage performance of existing nodes View sources
@briefing: 
@eli5: 
@tags: 

<!-- a1q33 -->
### Q
Due to application requirements, an administrator needs to modify an AHV VM to support a large number of distinct, concurrent network connections. The VM has below configuration:
- 4 vCPUs
- 20 GB RAM
- OS: Microsoft Windows Server 2022
Which modification can improve network performance for network I/O-intensive applications running on this VM?
@answer: Enable RSS VirtIO-Net Multi-Queue
@domain: networking
@context: Enabling RSS VirtIO-Net Multi-Queue optimizes network performance by allowing multiple CPU cores to process network packets in parallel, reducing bottlenecks for network I/O-intensive workloads.
@briefing: 
@eli5: 
@tags: 

<!-- a1q34 -->
### Q
A consultant is configuring syslog monitoring and wants to receive CRITICAL logs from the Audit module. Which severity level setting should be configured to get the desired output?
@answer: 2
@domain: monitoring
@context: The correct severity level to receive CRITICAL logs from the Audit module is 2. This corresponds to the Critical severity level in syslog. While other modules like SYSLOG_MODULE might require different configurations or log to different locations, for the Audit module itself, selecting level 2 will filter for Critical logs
@briefing: 
@eli5: 
@tags: 

<!-- a1q35 -->
### Q
An administrator is configuring Erasure Coding on a Redundancy Factor 2 Nutanix cluster. How many nodes, at a minimum, are necessary?
@answer: 4
@domain: storage
@context: An administrator needs four nodes at a minimum to configure Erasure Coding on a Redundancy Factor 2 cluster. A six-node cluster with RF2 uses a stripe size of five, with four nodes for data and one for parity. The sixth node ensures availability for rebuild in case of node failure.
@briefing: 
@eli5: 
@tags: 

<!-- a1q36 -->
### Q
An administrator needs to perform an LCM upgrade on an AHV host with GPUs.
What additional step is required for LCM to upgrade an AHV host that has CPUs?
@answer: Use Direct Uploads to upload appropriate driver bundles.
@domain: lifecycle
@context: Before initiating the LCM upgrade on an AHV host with GPUs, upload the relevant NVIDIA vGPU AHV host driver bundle to the "Direct Uploads" section within Nutanix LCM. This ensures the correct driver is available during the upgrade process.
@briefing: 
@eli5: 
@tags: 

<!-- a1q37 -->
### Q
An administrator is looking at the memory cluster runway diagram, as shown in the exhibit. The environment is based on three hosts with the following configuration:
- CPU: 2x Intel Xeon Gold (8 cores, 2.6 GHz)
- RAM: 256 GB per host
- Storage: SSDs and HDDs
The Prism Central Intelligent Operations feature has been active for one month, but no further configurations were applied.
What does the dotted red line mean?
@answer: It is the calculated memory oversubscription limit for currently running VMs.
@domain: performance
@context: The dotted red line in the Prism Central memory cluster runway diagram represents the calculated memory oversubscription limit for the currently running VMs. This dotted red line is not a static threshold.
@briefing: 
@eli5: 
@tags: 

<!-- a1q38 -->
### Q
An administrator wants to change a cluster from Redundancy Factor 2 to 3, but it is not allowed. What must the administrator check?
@answer: Check that the cluster has five or more nodes.
@domain: storage
@context: The administrator should check that the cluster has five or more nodes. A minimum of five nodes per cluster is required for Redundancy Factor 3 (RF3).
@briefing: 
@eli5: 
@tags: 

<!-- a1q39 -->
### Q
Which storage container option reduces the available storage to other containers?
@answer: Reserved Capacity
@domain: storage
@context: Reserving capacity for a storage container or setting an advertised capacity limits the available storage to other containers within the same storage pool. By default, all containers share the unused space in a pool. However, with reservations or advertised capacity, a specific amount of storage is allocated to a particular container and becomes unavailable for other containers to utilize.
@briefing: 
@eli5: 
@tags: 

<!-- a1q40 -->
### Q
An administrator wants to collect log files that have been requested by Nutanix Support team.
From which Prism Element dashboard can this be accomplished?
@answer: Health
@domain: monitoring
@context: An administrator can collect log files requested by Nutanix Support from the Prism Element dashboard by navigating to the Health page and selecting Actions → Collect Logs. This process utilizes the Logbay utility, which allows for flexible log collection and can be further customized from the command line interface (CLI). Within the Collect Logs section of the Prism Element dashboard, you can specify the nodes and tags for targeted log collection, define the duration of logs to collect, and select the destination for the collected logs.
@briefing: 
@eli5: 
@tags: 

<!-- a1q41 -->
### Q
An administrator receives an alert:
"A node cannot enter maintenance mode."
What could be the cause of this alert?
@answer: Other nodes in the cluster may not have enough resources available.
@domain: monitoring
@context: The most likely cause for a node failing to enter maintenance mode is that the cluster is in a critical High Availability (HA) state. When HA is critical, it means there aren't enough resources available to restart VMs on other nodes if the node entering maintenance mode fails.
@briefing: 
@eli5: 
@tags: 

<!-- a1q42 -->
### Q
An administrator is conducting LCM updates in a Nutanix cluster and is being prompted for handling non-migratable VMs. Which VM type is non-migratable?
@answer: VMs marked as an Agent
@domain: vms
@context: Agent VMs are indeed non-migratable. Other non-migratable VM types include those with CPU passthrough, GPU passthrough, PCI passthrough, and VMs with host affinity policies configured. During host maintenance, these VMs are typically shut down and powered back on after the maintenance is complete.
@briefing: 
@eli5: 
@tags: 

<!-- a1q43 -->
### Q
When is deduplication recommended?
@answer: Full clone VMs
@domain: storage
@context: Nutanix recommends enabling deduplication for full clone VMs, persistent desktops, and P2V. VDI workloads using full clones also benefit from deduplication. Server workloads, linked clone VMs, and VAAI clones generally see less benefit. It's not recommended for instant clones or data that is accessed infrequently (cold data).
@briefing: 
@eli5: 
@tags: 

<!-- a1q44 -->
### Q
Within Prism Central, which Compute and Storage section will allow an administrator to upload a Windows ISO file?
@answer: Images
@domain: vms
@context: The section within Prism Central where an administrator can upload a Windows ISO file is called "Image Configuration," found under the "Compute and Storage" section. This area allows for uploading ISO files, which are then used for creating virtual machines. The process typically involves selecting "Upload Image," filling in the required information (such as name and description), and choosing the source ISO file to upload.
@briefing: 
@eli5: 
@tags: 

<!-- a1q45 -->
### Q
An administrator needs to create a VM Template from an existing VM. What is required for this action to be successful?
@answer: The VM is powered off.
@domain: vms
@context: To successfully create a VM template from an existing VM, the source VM must be powered off. Once powered off, you can initiate the template creation process. A template name and, optionally, a description are required when creating the template. You can customize the guest OS settings, and choose whether users can override these settings during VM deployments. Once created, the template metadata is stored in Prism Central, with the data itself stored as a VM recovery point on the same cluster as the source VM. The original VM remains, and can be powered back on at any time.
@briefing: 
@eli5: 
@tags: 

<!-- a1q46 -->
### Q
An administrator has spent time correcting specific issues that have been identified by NCC Health Checks in Prism Element (PE). How can just the checks that previously did not pass be executed again to confirm they are all resolved?
@answer: Select Only Failed And Warning Checks.
@domain: monitoring
@context: Running only failed and warning checks helps verify issue resolution efficiently.
@briefing: 
@eli5: 
@tags: 

<!-- a1q47 -->
### Q
What is the purpose of the OpLog?
@answer: Persistent write buffer
@domain: architecture
@context: The OpLog (Operational Log) in Nutanix serves as apersistent write bufferfor incoming I/O operations. It temporarily stores write requests to ensure fast acknowledgment to clients and better performance. The data is later coalesced and written to the Extent Store for long-term storage.
@briefing: 
@eli5: 
@tags: 

<!-- a1q49 -->
### Q
An administrator observes an alert in Prism for a hybrid SSD/HDD cluster:
1 "Storage Pool SSD utilization consistently above 75%."
What is the potential impact of this condition?
@answer: Average I/O latency in the cluster may increase.
@domain: storage
@context: High SSD utilization in a hybrid cluster can lead to increased I/O latency as new writes may spill over to HDDs, reducing overall performance. If SSD usage is above 75%, data tiering shifts to slower HDDs, increasing latency.
@briefing: 
@eli5: 
@tags: 

<!-- a1q50 -->
### Q
Which two actions occur by default on a node which is placed in Maintenance Mode? (Choose two.)
@answer: All eligible VMs on the host are migrated to other hosts in the cluster. | Non-migratable VMs are powered off.
@domain: vms
@context: When a node is placed into Maintenance Mode, Nutanix follows a structured process to ensure service continuity and data integrity. 1- Live Migration automatically moves VMs to other hosts to avoid downtime. 2- Some VMs, such as those using GPU pass-through or local storage dependencies, cannot be livemigrated.
@briefing: 
@eli5: 
@tags: 

<!-- a1q51 -->
### Q
An administrator is tasked with optimizing a VM's storage to leverage compression features. Currently, vDisks are in a storage container default-container-91003002003041 that has no optimization activated. The administrator must move the VM's storage to the storage container Production.
What is the most efficient way to achieve this operation?
@answer: Migrate VM to the Production storage container.
@domain: storage
@context: Nutanix applies storage policies—such as compression, deduplication, and Replication Factor (RF)—at the storage container level. If a VM is residing in a container without these features enabled, simply turning them on for that container will only affect new writes; it will not immediately compress existing data unless a background "Curator" scan is triggered. By migrating the vDisks to a container that already has compression enabled (the Production container), Nutanix performs a cross-container move. During this move, the data is rewritten into the new container, allowing the Capacity Optimization Engine (COE) to apply the target container's compression policy to the data as it is moved. This operation can be performed via the Prism Central UI or the acli (Acropolis CLI) using the vm.update_container command, which allows for either all disks or specific disks to be moved without downtime.
@briefing: 
@eli5: 
@tags: 

<!-- a1q52 -->
### Q
A company is evaluating Nutanix DR to protect some business-critical applications and tasked an administrator to find an optimal configuration providing highest resiliency and lowest RPO to the production environment. The company's production environment is deployed on two physical sites with each hosting one AHV-based cluster.
What configuration will meet the company's requirements?
@answer: Deploy Prism Central instance on each site. Configure Metro Availability using Protection Domains.
@domain: data-protection
@context: Metro Availability offers the lowest RPO (zero) and highest resiliency: Metro Availability, leveraging synchronous replication, ensures zero data loss and near-zero RTO in a failover scenario. This is the best option for business-critical applications requiring continuous availability. Since the company has two sites, placing Prism Central on each site provides management redundancy.  Protection Domains can also be used as part of this Configuration: Setting up Protection Domains within the Metro Availability configuration enhances disaster recovery capabilities, providing options for granular VM protection and orchestration for less critical applications. These would likely be configured with NearSync replication within the same Prism Central instance.  Other options are suboptimal: Options A and B are not ideal because NearSync and synchronous replication alone don't offer the automatic failover and near-zero RTO provided by Metro Availability. Option C is incorrect because the company has two clusters (one in each site); this would imply that there's a dedicated site for DR which the question does not support.
@briefing: 
@eli5: 
@tags: 

<!-- a1q53 -->
### Q
Which predefined view should be leveraged in Prism Central Intelligent Operations to determine which VM is consuming too many resources and causing other VMs to starve?
@answer: Bully VMs List
@domain: performance
@context: The "Bully VMs List" in Prism Central Intelligent Operations (formerly called AIOps) specifically identifies VMs consuming excessive resources and impacting the performance of other VMs by "stealing" resources from them. While other options might provide insights into resource usage, they do not directly address the issue of one VM negatively affecting others.
@briefing: 
@eli5: 
@tags: 

<!-- a1q54 -->
### Q
An administrator is trying to troubleshoot the environment after NCC raised an alert.
1 Detailed information for remote_site_connectivity_check:
2 Node x.x.x.x:
3 WARN: Failed to connect to the remote site <remote_site>.
Which two steps should an administrator follow to provide a solution? (Choose two.)
@answer: Confirm that the remote cluster is reachable, and ports 2009 and 2020 are open between the clusters. | If the remote site has been re-configured and the cluster has a new cluster incarnation ID, re-create the remote site.
@domain: networking
@context: The NCC alert remote_site_connectivity_check WARN message indicates a failure to connect to the remote site. To troubleshoot, you should focus on network connectivity between the sites. The following two steps address this: 1. Confirm that the remote cluster is reachable, and ports 2009 and 2020 are open between the clusters: This directly addresses the error message. As seen in multiple examples, the failure to connect on ports 2009 and 2020 is the primary reason for this alert. 3. If the remote site has been re-configured and the cluster has a new cluster incarnation ID, re-create the remote site: If the remote site's configuration has changed significantly, including a new cluster incarnation ID, the local cluster's connection information might be outdated, triggering the connectivity failure. Re-creating the remote site configuration on the local cluster ensures the correct connection details are in place.
@briefing: 
@eli5: 
@tags: 

<!-- a1q55 -->
### Q
An administrator has been tasked by the company's leadership to justify and explain the decision to utilize the new Nutanix Disaster Recovery solution. The environment contains:
- 100 workloads
- Workloads have varying boot orders
- Workloads span multiple subnets
- Workloads span across different business units
How should the administrator most efficiently organize and manage the workloads?
@answer: Utilize Categories to organize VMs in Recovery Plans.
@domain: data-protection
@context: Utilizing Categories to organize VMs in Recovery Plans is the most efficient method. Categories are designed specifically for grouping VMs logically within Recovery Plans. They allow the administrator to manage workloads based on boot order, subnet, business unit or any other criteria relevant to disaster recovery. This approach simplifies recovery orchestration significantly compared to other options.
@briefing: 
@eli5: 
@tags: 

<!-- a1q56 -->
### Q
An administrator has been tasked with creating a new storage container named TestData. The TestData storage container must meet the following conditions:
- The container needs to have a Replication Factor of 1 (RF1).
- Inline Compression must be enabled.
- Deduplication must be disabled.
- The container must have a maximum storage capacity of 100 GiB.
How should the administrator complete this task?
@answer: Log into Prism Element and create the storage container with an Advertised Capacity of 100 GiB.
@domain: storage
@context: - Prism Element is ideal for managing individual clusters and is the only platform that reliably allows configuration of all required storage container properties at creation, such as Replication Factor, compression, deduplication, and advertised (hard capped) capacity. - Prism Central, while powerful for multi-cluster and global management, does not provide the same level of granularity for storage container creation on a single cluster, especially when enforcing a strict capacity limit and choosing advanced features. - The Advertised Capacity setting in Prism Element is essential to enforce the 100 GiB limit; other methods may not provide a hard cap or could skip key configuration details. - Therefore, Option C directly satisfies all requirements in the scenario, making it the preferred choice for Nutanix storage container creation with strict settings.
@briefing: 
@eli5: 
@tags: 

<!-- a1q57 -->
### Q
An administrator has migrated a physical MySQL database from a legacy 3-Tier environment to a Nutanix cluster. Post migration, the administrator finds that at peak load, the number of IOPS being generated is lower than expected, and latency is higher.
Which two steps should the administrator take to improve this behavior? (Choose two.)
@answer: Use LVM to stripe the SQL data across multiple vDisks. | Create additional vDisks for SQL data.
@domain: storage
@context: Striping data and creating additional vDisks can improve IOPS and reduce latency.
@briefing: 
@eli5: 
@tags: 

<!-- a1q58 -->
### Q
A new employee has inherited a partially configured Disaster Recovery (DR) schema. Source workloads have been identified and Nutanix Guest Tools has been installed.
There are two Protection Polices in place, one with an asynchronous schedule with a 1-hour RPO and a second policy utilizing synchronous replication. All of these workloads need to be recovered at a DR location and this will be orchestrated by Prism Central Recovery Plans.
What is the best way to setup this recovery orchestration?
@answer: Setup a single Recovery Plan utilizing stages of recovery delays as needed.
@domain: data-protection
@context: Nutanix Disaster Recovery is built to orchestrate failover at the application level, not by replication technology. You can include VMs protected by different Protection Policies (both sync and async) in the same Recovery Plan, and then use stages to define the boot sequence. This keeps DR simple, coordinated, and aligned to real-world business needs — ensuring that an entire application stack can be recovered with a single action.
@briefing: 
@eli5: 
@tags: 

<!-- a1q59 -->
### Q
Within Intelligent Operations, Capacity Configurations have been set to Auto Detect for Reserve Capacity For Failure.
For an RF2 cluster with 10 nodes, what effect does this have on Capacity Runway?
@answer: Reserves CPU, RAM and storage from the largest node to account for a single node failure.
@domain: performance
@context: For an RF2 cluster, “Auto Detect” dynamically calculates and reserves the amount of capacity required to absorb the failure of the single largest node — across all three dimensions: CPU, memory, and storage. This keeps the cluster protected and ensures Capacity Runway calculations accurately reflect the true usable capacity after accounting for node failure tolerance.
@briefing: 
@eli5: 
@tags: 

<!-- a1q60 -->
### Q
An administrator has deployed two Nutanix clusters and is now establishing synchronous replication between them. However, the replication is failing immediately.
Which two responses show the reason and corrective action an administrator can take to resolve the issue? (Choose two.)
@answer: If the primary and the recovery clusters are in different subnets, open the ports manually for communication. | Use the command modify firewall to open the ports on eth0 interface.
@domain: data-protection
@context: Synchronous (and asynchronous) replication between clusters in different subnets requires: 1 1- Manually opened for communication between the two clusters (for replication, Stargate, etc.). 2 2- Proper routing and open firewall ports on the external interface (eth0).  The modify_firewall command is used on eth0, because that’s the interface for external CVM-to-CVM communication across clusters.  When clusters are on the same subnet, this configuration is not needed, since local traffic on br0 is already allowed by default.
@briefing: 
@eli5: 
@tags: 

<!-- a2q1 -->
### Q
An administrator receives an alert in Prism stating:
1 "Storage container <container_name> on cluster <cluster_name> will run out of storage resources in approximately 1 day."
However, the cluster has plenty of available space remaining.
What configuration setting is causing the container to run out of space while the cluster has space remaining?
@answer: Advertised Capacity is set too low
@domain: storage
@context: The alert warns that this specific container will run out of space within about a day while the cluster still has plenty free. That pattern points to the container's Advertised Capacity being set lower than the pool it draws from: the container fills against its own cap and alerts even though the cluster has space. [Source key corrected: the dump marked 'Reserved Capacity is set too high,' which is wrong — see review notes.]
@briefing: 
@eli5: 
@tags: 

<!-- a2q2 -->
### Q
An administrator is responsible for Nutanix DR configuration and testing. The administrator experiences a Recovery Plan Failure for a cross hypervisor (ESXi to AHV) DR Test. The guest VMs do not recover at the DR location.
Which configuration is required for a successful event?
@answer: Nutanix Guest Tools (NGT) must be installed on source guest VMs
@domain: data-protection
@context: For cross-hypervisor DR failover (e.g., ESXi to AHV), Nutanix Guest Tools (NGT) must be installed on VMs to ensure proper configuration and recovery.
@briefing: 
@eli5: 
@tags: 

<!-- a2q3 -->
### Q
What is supported for creating a VM Template in Nutanix?
@answer: VM has disks located on RF2 containers
@domain: vms
@context: The requirements for a VM that can be made into a template are: The VM must be powered off. The VM must be on AHV. The VM cannot be an agent VM or a Prism Central (PC) VM. The VM cannot have a volume group attached. The VM cannot be undergoing vDisk migration. The VM cannot have disks located on RF1 containers. The VM cannot be protected by Protection Domain-based disaster recovery (DR).
@briefing: 
@eli5: 
@tags: 

<!-- a2q4 -->
### Q
An administrator is experiencing storage performance issues on a Windows Server 2019 VM with the below configuration:
- vCPU: 1
- VRAM: 8 GB
- vSCSI: VirtIO SCSI Controller
- vDisk: 2 (100 GB, 250 GB)
- vNIC: VirtIO Fast Ethernet
The AHV cluster is healthy, and other Windows VMs are performing well. Which configuration change should be reviewed to enhance VM performance?
@answer: Increase the VM's number of vCPUs
@domain: vms
@context: Increasing the VM's vCPUs (option 4) is the most likely configuration change to improve storage performance in this scenario. While the other options might impact performance in some cases, they are less likely to be the root cause given the described situation.
@briefing: 
@eli5: 
@tags: 

<!-- a2q5 -->
### Q
In a five-node Nutanix cluster, an administrator noticed that three VMs are consuming too many resources on a single host, but ADS is not able to migrate these VMs.
What reason describes what is preventing ADS from migrating these VMs?
@answer: VMs use GPU pass-through
@domain: vms
@context: VMs using GPU pass-through cannot be live-migrated because they are directly tied to a physical GPU on a specific host. ADS avoids migrating VMs that use GPU passthrough. While ADS does handle vGPU migration in some cases like defragmentation or power-on operations (starting from AOS 5.20/6.0), it's generally more restrictive with pGPU (pass-through) due to the resource dedication and potential complexities involved
@briefing: 
@eli5: 
@tags: 

<!-- a2q6 -->
### Q
How can just the checks that previously did not pass be executed again to confirm they are all resolved?
@answer: Select Only Failed And Warning Checks
@domain: monitoring
@context: Select Only Failed And Warning Checks is an option within NCC that allows for re-execution of only the checks that previously resulted in a FAIL or WARN status. This helps confirm resolution of issues without running all checks. NCC (Nutanix Cluster Check) itself is a health check tool for Nutanix clusters. Failed checks indicate critical issues requiring immediate action, while warnings signify problems needing attention. NCC offers various checks, including network, hardware, and software tests, aiding in proactive cluster maintenance and troubleshooting.
@briefing: 
@eli5: 
@tags: 

<!-- a2q7 -->
### Q
For dark site Nutanix clusters, what should be downloaded prior to running an LCM Inventory or updates?
@answer: Nutanix Compatibility Bundle
@domain: lifecycle
@context: The Nutanix Compatibility Bundle should be downloaded before running an LCM Inventory or updates in dark site clusters. This ensures that the cluster is running a supported configuration and avoids potential issues during updates. It's important to download the latest Compatibility Bundle and replace the existing files on the web server.
@briefing: 
@eli5: 
@tags: 

<!-- a2q8 -->
### Q
How should an administrator verify cluster protection from potential data loss due to a component failure?
@answer: Look at the Data Resiliency Status widget
@domain: monitoring
@context: The primary method for verifying cluster protection is to check the Data Resiliency Status widget on the Prism Element dashboard. This widget provides a summary of how many failures the cluster can tolerate based on the current configuration and health of its components (nodes, disks, etc.). For a more detailed view, clicking the widget displays further information about the cluster's resilience to component failures, specifying the configured failure domain.
@briefing: 
@eli5: 
@tags: 

<!-- a2q9 -->
### Q
Which Nutanix offering allows for extending an on-prem datacenter into the public cloud?
@answer: Nutanix Cloud Clusters
@domain: architecture
@context: Nutanix Cloud Clusters (NC2) extends the on-premises datacenter into the public cloud. NC2 allows you to run the Nutanix Cloud Platform, including AOS and AHV, in a public cloud environment like AWS or Azure. This provides a consistent operating model across both on-premises and public cloud, simplifying management and enabling hybrid cloud capabilities like workload mobility, disaster recovery, and burst capacity.
@briefing: 
@eli5: 
@tags: 

<!-- a2q10 -->
### Q
What must be enabled when creating a VM to enable Windows Defender Credential Guard?
@answer: UEFI
@domain: vms
@context: To enable Windows Defender Credential Guard when creating a VM in AHV, you must select the "Windows Defender Credential Guard" option under "Boot Configuration" while configuring the VM. Additionally, ensure that UEFI and Secure Boot are also selected.
@briefing: 
@eli5: 
@tags: 

<!-- a2q11 -->
### Q
Which feature should be enabled to prevent password access to the CVM for both the nutanix and admin user accounts?
@answer: Cluster lockdown
@domain: security
@context: Enabling lockdown mode prevents password access to the CVM for both the nutanix and admin user accounts. This restricts access to SSH key-based authentication only. This is documented in the Nutanix Security Guide.
@briefing: 
@eli5: 
@tags: 

<!-- a2q12 -->
### Q
What license type is required to license a new AOS-based cluster with no add-on packages via Nutanix Cloud Platform Package Licensing?
@answer: Nutanix Cloud Infrastructure (NCI)
@domain: architecture
@context: Nutanix Cloud Infrastructure (NCI) is required for basic AOS-based cluster licensing.
@briefing: 
@eli5: 
@tags: 

<!-- a2q13 -->
### Q
When multiple Alert policies are applied to an entity, which will take precedence?
@answer: Policy applied to a specific entity type.
@domain: monitoring
@context: When multiple alert policies apply to an entity, the most specific policy takes precedence. For example, a policy applied to a specific VM overrides a policy applied to a category of VMs. Within a given level of specificity, the policy updated most recently takes precedence.
@briefing: 
@eli5: 
@tags: 

<!-- a2q14 -->
### Q
Prism Central will be installed manually on an AHV cluster. Which three disk images must be downloaded from the portal for the Prism Central VM?
@answer: boot | home | data
@domain: architecture
@context: When manually installing Prism Central on an AHV cluster, you actually need to download two disk images: the boot image and the data image. The documentation mentions a "home" image in older versions, but current installations utilize only boot and data images.
@briefing: 
@eli5: 
@tags: 

<!-- a2q15 -->
### Q
Which data savings technique utilizes stripes and parity calculation in a Nutanix cluster?
@answer: Erasure coding
@domain: storage
@context: Erasure Coding (EC) is the data savings technique employed in Nutanix clusters. It utilizes stripes of data blocks and calculates parity to provide redundancy while reducing storage overhead. Specifically, data is divided into stripes across multiple nodes, and a parity block is calculated and stored. This parity information can be used to reconstruct data in case of a node failure.
@briefing: 
@eli5: 
@tags: 

<!-- a2q16 -->
### Q
What is the function of the virbr0 bridge on AHV?
@answer: To carry management and storage communication between the CVM and AHV host
@domain: networking
@context: The virbr0 bridge is a fundamental component of the Nutanix "Internal-Only" network architecture. By using a local bridge and the reserved 192.168.5.0/24 subnet, Nutanix ensures that the AHV host can always reach its CVM for vital storage services, even if physical network uplinks are down or misconfigured. This is why Nutanix strongly advises administrators never to use the 192.168.5.0/24 range for any other purpose in the VPC or physical network, as it would conflict with this essential internal communication path.
@briefing: 
@eli5: 
@tags: 

<!-- a2q17 -->
### Q
How should an administrator enable secure access to Volumes using a password?
@answer: CHAP
@domain: security
@context: To enable secure access to Volumes using a password, you should configure CHAP (Challenge-Handshake Authentication Protocol) when creating the Volume Group. This allows for one-way or mutual authentication between the initiator and target. Nutanix recommends using one-way CHAP. For increased security, mutual CHAP is also supported
@briefing: 
@eli5: 
@tags: 

<!-- a2q18 -->
### Q
An administrator logs in to Prism Element, goes to the Network Visualization view, and sees the output shown in the exhibit.
Which three steps must the administrator take to increase throughput to the host?
@answer: Connect the 10Gb interfaces to the physical switch | Remove any 1Gb interfaces still connected from the default bond | Change the bond mode to balance-slb or balance-tcp
@domain: networking
@context: The correct answers are B, C, and D. Here's why: B. Connect the 10Gb interfaces to the physical switch: Connecting 10Gb interfaces directly to the physical switch provides more bandwidth compared to 1Gb interfaces, thus increasing the potential throughput to the host. Discussions about switch recommendations and optimal configurations often emphasize using 10Gb interfaces for higher performance. C. Remove any 1Gb interfaces still connected from the default bond: If 1Gb interfaces are part of a bond that also includes 10Gb interfaces, they can create a bottleneck. Removing the slower interfaces from the bond allows the bond to operate at the higher speed of the 10Gb interfaces. D. Change the bond mode to balance-slb or balance-tcp: Bond modes like balance-slb (Source Load Balancing) or balance-tcp (Transmit Load Balancing) can improve throughput by distributing network traffic across multiple interfaces. This is more effective when all interfaces in the bond are operating at the same speed, which is why removing the 1Gb interfaces (as in option C) is important. Changing the VLAN ID to a higher priority ID (option A) deals with Quality of Service (QoS), not throughput. Adding a new switch and connecting 1Gb interfaces to it (option E) wouldn't increase throughput to the host, as it still relies on the slower 1Gb connections.
@briefing: 
@eli5: 
@tags: 

<!-- a2q19 -->
### Q
An administrator is configuring data protection and DR for a multi-tier application. All VMs must be protected at the same time. What must the administrator do to meet this requirement?
@answer: Create a consistency group for the application and place all VMs in it.
@domain: data-protection
@context: The administrator's suggestion to create a consistency group for the application and place all VMs in it is correct. This will ensure that all the VMs are protected simultaneously. This approach aligns with the need to protect multi-tier applications as a single unit, enabling application-consistent recovery points and facilitating a more efficient Disaster Recovery (DR) process.
@briefing: 
@eli5: 
@tags: 

<!-- a2q20 -->
### Q
A company is evaluating Nutanix Disaster Recovery (DR) to protect multiple business-critical applications. Some applications are built using a 3-tier architecture and have interdependencies.
After failover, the VM's static IP address is retained, but DNS configuration is lost. How should an administrator proceed to resolve this issue?
@answer: Create custom in-guest scripts to preserve the statically assigned DNS IP addresses.
@domain: data-protection
@context: Creating custom in-guest scripts to preserve the statically assigned DNS IP addresses is a valid approach. The in-guest script should execute after the failover event and reconfigure the DNS settings within the VM's operating system. This can be achieved using PowerShell for Windows VMs or shell scripts for Linux VMs. Ensure the script has the necessary permissions to modify network settings within the guest OS.
@briefing: 
@eli5: 
@tags: 

<!-- a2q21 -->
### Q
If an administrator creates a report with no retention policy configured, how many instances of the report are retained by default?
@answer: 10
@domain: data-protection
@context: By default, 10 instances of a report are retained if no specific retention policy is configured.
@briefing: 
@eli5: 
@tags: 

<!-- a2q22 -->
### Q
An administrator is trying to delete a protected snapshot but is unable to do so. What is the most likely cause?
@answer: There is an approval policy that was denied.
@domain: data-protection
@context: The most likely reason an administrator is unable to delete a protected snapshot is due to an approval policy that was denied. Secure snapshots require approvals before deletion. Concurrent secure snapshot deletions can take a long time and block normal snapshot deletions.
@briefing: 
@eli5: 
@tags: 

<!-- a2q23 -->
### Q
An administrator is preparing for a firmware upgrade on a host and wants to manually migrate VMs before executing the LCM upgrade. However, one VM is unable to migrate while others migrate successfully.
Which action would fix the issue?
@answer: Disable Agent VM within the VM configuration options.
@domain: vms
@context: Disabling the Agent VM setting within the VM configuration options will allow the VM to be migrated. Agent VMs are given higher priority during boot up and shut down, which disables features like live migration. An agent VM cannot use live migration or VM-Host Affinity. If a host is put in maintenance mode, the Agent VM on that host will be stopped. However, the administrator can start the VM on a different host via the command line interface (CLI).
@briefing: 
@eli5: 
@tags: 

<!-- a2q24 -->
### Q
An administrator wants to live-migrate a vGPU-enabled VM from one host to another within the same cluster. What requirements must be met before initiating the migration?
@answer: The target host has sufficient resources to support the VM.
@domain: vms
@context: You can perform live migration of VMs enabled with virtual GPUs (vGPU-enabled VMs) only on commercially reasonable effort, if the destination node is equipped to provide enough resources to the vGPU- enabled VMs. However, if the destination node is not equipped with the enough resources, the vGPU-enabled VMs are shut down and you might experience a downtime.
@briefing: 
@eli5: 
@tags: 

<!-- a2q25 -->
### Q
An administrator wants to ensure that user VMs on AHV hosts can take advantage of bandwidth beyond a single adapter in a bond. Which uplink Bond Type should the administrator configure to accomplish this?
@answer: Active-Active
@domain: networking
@context: The administrator should configure Active-Active bond type. This leverages link aggregation and balances VM NIC TCP/UDP sessions across multiple adapters, maximizing bandwidth utilization. It requires link aggregation protocol (LACP) configuration on the network switch side.
@briefing: 
@eli5: 
@tags: 

<!-- a2q26 -->
### Q
An administrator configured a remote site for Protection Domain replication, but network performance and stability are impacted.
How can the remote site configuration be adjusted to fix the issue?
@answer: Configure a Bandwidth Throttling Policy.
@domain: data-protection
@context: Configuring a Bandwidth Throttling Policy can improve network performance and stability impacted by remote site Protection Domain (PD) replication.
@briefing: 
@eli5: 
@tags: 

<!-- a2q27 -->
### Q
An administrator is configuring Protection Policies to replicate VMs to a Nutanix Cloud Cluster (NC2) over the internet. To comply with an organizational security policy, data sent via the internet must be encrypted.
How should data be protected during transmission?
@answer: Enable Data-in-Transit Encryption.
@domain: security
@context: Data-in-transit encryption should be enabled to protect data during transmission. The Nutanix Security Guide mentions that enabling Data-in-Transit Encryption protects data sent between nodes in the same cluster or during replication to a secondary cluster over a Wide Area Network (WAN).
@briefing: 
@eli5: 
@tags: 

<!-- a2q28 -->
### Q
Due to application requirements, an administrator needs to support a multicast configuration in an AHV cluster. Which AHV feature can be used to optimize network traffic so that multicast traffic is only forwarded to the VMs that need to receive it?
@answer: IGMP Snooping
@domain: networking
@context: IGMP snooping. It allows the AHV host to track which VMs on a VLAN want to receive multicast traffic and then forwards the traffic only to those VMs. This prevents multicast traffic from being flooded to all VMs on the VLAN, which improves network performance and reduces CPU load on the host.
@briefing: 
@eli5: 
@tags: 

<!-- a2q29 -->
### Q
What feature allows receiving a weekly message about infrastructure performance summary?
@answer: Intelligent Operations Reports
@domain: monitoring
@context: Intelligent Operations Reports are a feature of Nutanix Cloud Manager (NCM) that uses machine learning and smart automation to improve the efficiency of IT operations. The "Infrastructure Performance Summary" is a system report available within the Nutanix environment.
@briefing: 
@eli5: 
@tags: 

<!-- a2q30 -->
### Q
Which storage attributes do Storage Policies manage?
@answer: Replication Factor and Encryption
@domain: storage
@context: Nutanix Storage Policies manage the following storage attributes:\n\n- Replication Factor (RF): This attribute governs the number of copies of data maintained for redundancy and availability.\n- Encryption: This attribute enables data encryption at rest to enhance security.\n- Compression: This attribute enables data compression to optimize storage utilization.\n- Quality of Service (QoS): This attribute manages performance by setting rate limits (IOPS or bandwidth) for storage resources.
@briefing: 
@eli5: 
@tags: 

<!-- a2q31 -->
### Q
An administrator has been tasked with justifying why Nutanix Disaster Recovery was chosen for a multi-tier application spanning multiple business units. What is the most efficient way to organize and manage the workloads?
@answer: Utilize Categories to organize VMs in Recovery Plans
@domain: data-protection
@context: Nutanix Disaster Recovery offers an efficient way to organize and manage multi-tier applications spanning multiple business units for disaster recovery by leveraging the following:12 * Application-Centric Categories: Organize VMs based on application tiers (web, app, database) or business units. This allows for granular control over failover and recovery processes, ensuring that interdependent application components are treated as a single unit. Use categories to automate protection and apply policies specific to application needs. * Protection Policies: Define Recovery Point Objectives (RPOs) at the application level to meet individual business requirements. This ensures that critical applications have the lowest RPOs while less critical ones have more relaxed RPOs.1 * Recovery Plans: Orchestrate the recovery process by defining boot order and dependencies between application tiers. This automation ensures that applications are brought online in the correct sequence, minimizing downtime and data inconsistencies. Recovery Plans also allow for testing failover scenarios without impacting production.
@briefing: 
@eli5: 
@tags: 

<!-- a2q32 -->
### Q
Which capability refers to the storage of VM data on the node where the VM is running and ensures that the read I/O does not have to traverse the network?
@answer: Data Locality
@domain: architecture
@context: Data Locality is the capability that stores VM data on the node where the VM is running. This ensures that read I/O doesn't have to traverse the network, optimizing read performance.
@briefing: 
@eli5: 
@tags: 

<!-- a2q33 -->
### Q
A security team asks an administrator to set up port mirroring of a specific source VM to a target VM.
What must the administrator ensure for this configuration to be possible?
@answer: Source VM and Target VM are on the same host.
@domain: networking
@context: To set up port mirroring (also called SPAN) of a source VM to a target VM, the administrator must ensure the following: VM Placement: The source VM and target VM should reside on the same host. While mirroring traffic across hosts is possible using a dedicated VLAN tunnel, it's not encapsulated mirroring.
@briefing: 
@eli5: 
@tags: 

<!-- a2q34 -->
### Q
An administrator needs to create a storage container for VM disks. The container must meet the following conditions:
- 10 GiB of the total allocated space must not be used by other containers.
- The container must have a maximum storage capacity of 500 GiB.
What settings should the administrator configure while creating the storage container?
@answer: Set Reserved Capacity to 10 GiB and Advertised Capacity to 500 GiB.
@domain: storage
@context: Reserved Capacity ensures that 10 GiB is always available for this container and not consumed by other containers while Advertised Capacity defines alogical limit of 500 GiB to prevent over-allocation.
@briefing: 
@eli5: 
@tags: 

<!-- a2q35 -->
### Q
An administrator is setting up a Nutanix cluster and needs to configure the default VLAN. Which configuration should the administrator choose?
@answer: VLAN 0
@domain: networking
@context: VLAN 0 is the correct configuration for the default VLAN in a Nutanix cluster. This aligns with the native VLAN configuration on Cisco switches, allowing untagged traffic to flow between the Nutanix nodes and the network infrastructure. VMs that need to communicate with the network without VLAN tagging should be attached to the network using VLAN 0.
@briefing: 
@eli5: 
@tags: 

<!-- a2q36 -->
### Q
An administrator needs to configure NTP on Prism Central running on a Hyper-V cluster. How should the administrator complete this task?
@answer: Add the IP of the Domain Controller
@domain: security
@context: To configure NTP on a Prism Central instance running on a Hyper-V cluster, an administrator must use the command-line interface (CLI). Due to Kerberos requirements, Nutanix clusters on Hyper-V automatically add local domain controllers as NTP sources for all Controller Virtual Machines (CVMs). It is crucial to supplement these domain controllers with additional, reliable, non-Windows NTP sources, ideally aiming for a total of five time sources.
@briefing: 
@eli5: 
@tags: 

<!-- a2q37 -->
### Q
After adding new workloads, why is Overall Runway below 365 days and the scenario still shows the cluster is in good shape?
@answer: Because the Target is 1 month
@domain: performance
@context: A cluster is considered in "good shape" within a scenario if its Overall Runway meets or exceeds the specified Target Runway. The user interface typically visualizes this with the color blue, indicating that the resources are sufficient for the planned duration. In the context of the question: - Adding new workloads will calculate a new, shorter "Overall Runway." - If this new runway (e.g., 45 days) is still longer than the Target Runway you set in the scenario (e.g., 1 month or ~30 days), the scenario will indicate the cluster is still healthy or in "good shape" for your planning purposes. - The fact that the runway is less than 365 days is not relevant as long as it satisfies the goal you set in the Target Runway parameter.
@briefing: 
@eli5: 
@tags: 

<!-- a2q38 -->
### Q
An administrator has been tasked with performing firmware upgrades for all Nutanix sites.
When attempting to perform firmware upgrades via Life Cycle Manager (LCM) at a remote site with a single-node cluster, no firmware updates are listed as available. The administrator confirmed that the currently installed firmware is several revisions behind.
Why are no firmware upgrades listed in LCM for this cluster?
@answer: LCM cannot perform firmware upgrades on single-node clusters
@domain: lifecycle
@context: LCM firmware updates are not supported on single-node clusters. This is because firmware updates typically require services to be stopped. In a single-node cluster, there is no other node to take over the workload from the node being updated. Resources
@briefing: 
@eli5: 
@tags: 

<!-- a2q39 -->
### Q
Which two entities can be categorized? (Choose two.)
@answer: Virtual Machines | ISO Images
@domain: vms
@context: Virtual Machines and ISO Images can be categorized. Within Nutanix, categories are used to organize and manage entities, and virtual machines (VMs) and ISO images are among the entities that can be categorized. This allows for easier management and automation, especially in larger environments.
@briefing: 
@eli5: 
@tags: 

<!-- a2q40 -->
### Q
An administrator is configuring a replication schedule on multiple remote locations deployed using a single-node cluster. The goal is to achieve the lowest possible RPO (Recovery Point Objective).
How should the administrator configure the replication schedule?
@answer: Configure Async replication
@domain: data-protection
@context: Nutanix documentation emphasizes the limitations of single-node clusters regarding Recovery Point Objective (RPO). While NearSync replication might seem configurable through Prism Central, it's not supported on single-node clusters. The lowest supported RPO for a single-node cluster is 6 hours, achieved through asynchronous replication. Therefore, to achieve the lowest supported RPO on a single-node cluster, the administrator must configure Async replication. It's crucial to prioritize supported configurations for reliability and stability.
@briefing: 
@eli5: 
@tags: 

<!-- a2q41 -->
### Q
What can be used to easily group a set of VMs?
@answer: Categories
@domain: vms
@context: Categories can be used to group VMs, which simplifies management tasks. Another approach is to use VM-Host affinity policy to tie a VM to a specific host or group of hosts. A VM-VM anti-affinity policy can also be employed to keep selected VMs on different hosts to increase availability and resiliency.
@briefing: 
@eli5: 
@tags: 

<!-- a2q42 -->
### Q
An administrator wants to create a VM with memory overcommit features enabled in Nutanix cluster. Which statement best describes how the administrator will perform this VM creation?
@answer: Memory overcommit can only be updated using the Prism Central console.
@domain: vms
@context: You cannot enable the memory overcommit feature using the Prism Element Web Console. Enable memory overcommit on a VM that you create by using Prism Central. If you create a VM using Prism Web Console, then you can enable memory overcommit on that VM using Prism Central. Resources
@briefing: 
@eli5: 
@tags: 

<!-- a2q43 -->
### Q
Which feature deploys a temporary VM that allows an administrator to log in and apply operating system patches to a VM template?
@answer: Update Guest OS
@domain: vms
@context: The Guest OS update feature deploys a temporary VM named "VmTemplateVM-update-guest-os-". This allows an administrator to log in, apply OS patches, and other software updates to the temporary VM. After the updates are completed, a new template version is created. The temporary VM is then automatically deleted.
@briefing: 
@eli5: 
@tags: 

<!-- a2q44 -->
### Q
Which two URLs must be accessible from a Connected Site's Controller VMs to allow Life Cycle Manager to download software updates?
@answer: download.nutanix.com | release-api.nutanix.com
@domain: lifecycle
@context: download.nutanix.com and release-api.nutanix.com are the two URLs that must be accessible. The first URL is the primary location for LCM software updates, while the second provides metadata about the updates.
@briefing: 
@eli5: 
@tags: 

<!-- a2q45 -->
### Q
Refer to the exhibit. An administrator notices the Message shown in the exhibit when navigating to LCM from Prism Central.
Which action should they take to update LCM to the latest version?
@answer: Perform an Inventory Scan.
@domain: lifecycle
@context: Performing an Inventory Scan is the correct action. Within Prism Central, an administrator navigates to the LCM page and selects Inventory then Perform Inventory. This action allows LCM to check for updates, download the necessary files, and then apply the LCM update.
@briefing: 
@eli5: 
@tags: 

<!-- a2q46 -->
### Q
An administrator configured Metro Availability for a Protection Domain but sees a warning: "VM-1 is accessing data from a remote cluster." What should they do first?
@answer: Migrate the VM to its primary site and set proper rules for DRS and affinity.
@domain: data-protection
@context: The warning "VM-1 is accessing data from a remote cluster" within a Metro Availability Protection Domain setup indicates that the VM is running on the standby site while its data resides on the active site. This situation can severely impact performance. The provided text from Metro High Availability explains this exact scenario and recommends migrating the VM back to its primary site. It also mentions updating DRS (Distributed Resource Scheduler) rules and affinity rules to prevent this from happening again. Must-affinity rules ensure that a VM runs on the specified site while other settings in DRS influence placement decisions.
@briefing: 
@eli5: 
@tags: 

<!-- a2q47 -->
### Q
An administrator needs to set up a protection policy in preparation for a regular Disaster Recovery (DR) test. What is the first step required to satisfy this task?
@answer: Create an Availability Zone between Production and DR.
@domain: data-protection
@context: The correct first step is to create an Availability Zone between the Production and DR sites to define the scope of protection.
@briefing: 
@eli5: 
@tags: 

<!-- a2q48 -->
### Q
What is required to create a category in Nutanix?
@answer: A name and a value
@domain: vms
@context: Categories in Nutanix are created using a name and a value. The name is required, while the value is optional. They function as tags, allowing you to apply policies to multiple entities at once. For example, you could create a category named "Department" with values like "Marketing", "Sales", or "Engineering". Then, you could create a protection policy applied to all VMs with the category "Department:Sales". As new VMs are added and assigned the "Department:Sales" category, they automatically inherit the associated protection policy.
@briefing: 
@eli5: 
@tags: 

<!-- a2q49 -->
### Q
An administrator started an LCM upgrade of the AHV hosts in Nutanix Cluster and realized that the upgrade would exceed the planned maintenance window. The administrator would like to prevent further updates at this point.
Which feature should be leveraged to prevent additional updates from occurring?
@answer: Use the Stop Update feature in LCM.
@domain: lifecycle
@context: The correct approach is to use the "Stop Update" feature within LCM. This feature allows an administrator to pause an ongoing upgrade process gracefully, preventing any further updates from occurring and allowing the upgrade to be resumed later.
@briefing: 
@eli5: 
@tags: 

<!-- a2q50 -->
### Q
An administrator is trying to configure Metro Availability between Nutanix ESXi-based clusters. However, the Compatible Remote Sites screen does not list all required storage containers.
Which two reasons could be a cause for this issue? (Choose two.)
@answer: The destination storage container is not empty. | Both storage containers must have the same name.
@domain: data-protection
@context: The administrator must ensure the following: The remote site's storage container has the same name as the local storage container. The remote site is configured to support Metro Availability. The transmission latency between the clusters is less than 5ms. The remote Site storage container is empty
@briefing: 
@eli5: 
@tags: 

<!-- a2q51 -->
### Q
An administrator has successfully configured a Metro Availability protection domain. After a couple of days, the following NCC warning is raised:
Detailed information for data_locality check:
Node x.x.x.20:
Following VMs are accessing data from remote clusters VM-1 from remote cluster Remote-m1
Refer to KB 2093 for details on data locality check
What is the first action an administrator must take to fix the issue?
@answer: Migrate the VM to its primary site and set appropriate rules for DRS and affinity.
@domain: data-protection
@context: The NCC warning data_locality check indicates that VM-1 is accessing data from a remote cluster, which is causing performance issues. The first step to address this is to migrate the VM back to its primary site and then configure appropriate affinity or DRS rules to prevent it from migrating to the standby datastore again. This corresponds to option '4'.
@briefing: 
@eli5: 
@tags: 

<!-- a2q52 -->
### Q
A Linux VM provides services for multiple clients on a single large subnet.
The number of clients varies over time. The clients consist of VMs and physical systems. The administrator observed network performance problems on the Linux VM when going over 2,000 client connections.
Which action can be performed to mitigate the issue?
@answer: Enable RSS VirtIO-Net Multi-Queue.
@domain: networking
@context: Receive Side Scaling (RSS) with VirtIO multi-queue enables the Linux virtual machine (VM) to utilize multiple CPUs (vCPUs) for network processing. This distributes the workload, improving performance, especially with a high number of client connections (like the 2000 connections causing the issue). Documentation specifically mentions this as a solution for improving network performance in network I/O-intensive applications on AHV VMs.
@briefing: 
@eli5: 
@tags: 

<!-- a2q53 -->
### Q
An administrator is configuring a protection domain for business critical applications, including SQL, Oracle, and Exchange. The administrator needs to evaluate the requirements and limitations for application-consistent snapshots. What action should the administrator take while configuring application-consistent snapshots?
@answer: Select application consistent snapshot checkbox in consistency group settings only.
@domain: data-protection
@context: Application-consistent snapshots are enabled at the consistency group level. This setting coordinates with the Nutanix Guest Tools (NGT) on the VMs within the group to quiesce applications before the snapshot, ensuring data consistency. The information regarding an application-consistent snapshot failing due to an outdated NGT version further supports this point.
@briefing: 
@eli5: 
@tags: 

<!-- a2q54 -->
### Q
An administrator is attempting to upgrade the NIC firmware on a Nutanix cluster and sees the error displayed in the exhibit.
Which log is the most appropriate to analyze the LCM precheck failure?
@answer: lcm_ops.out
@domain: lifecycle
@context: The provided context clearly points to lcm_ops.out as the correct log file for analyzing Life Cycle Management (LCM) precheck failures during Network Interface Card (NIC) firmware upgrades. The LCM Troubleshooting document explicitly recommends checking this log file, particularly for upgrade failures, and suggests searching for the term "Operation failed." Additionally, this document provides a specific example of a Network Interface Card firmware upgrade failure found within the lcm_ops.out log.
@briefing: 
@eli5: 
@tags: 

<!-- a2q55 -->
### Q
An administrator is protecting an application and its data stored on Volume Groups using protection domains. During failover tests, all application VMs are restored successfully, however, the application data is completely missing.
In which two ways can the protection domain configuration be adjusted to avoid this issue in the future? (Choose two.)
@answer: Select the Auto protect related entities checkbox. | Manually add Volume Groups to Protected Entities.
@domain: data-protection
@context: To avoid application data loss after restoring application VMs during failover tests, ensure the Volume Groups (VGs) containing the application data are included in the protection domain. There are two ways to achieve this:  Select "Auto protect related entities": This automatically includes VGs associated with the protected VMs in the protection domain, ensuring their data is replicated.  Manually add VGs to protected entities: This gives explicit control, guaranteeing the necessary VGs are protected even if "Auto protect related entities" is not enabled. This is useful for complex environments.
@briefing: 
@eli5: 
@tags: 

<!-- a2q56 -->
### Q
In Prism Element, how many nodes can be placed into maintenance mode at one time on a 12-Node FT2 cluster?
@answer: 1
@domain: architecture
@context: Only one node can be placed into maintenance mode at a time on a 12-node FT2 cluster. The other options are incorrect because placing multiple nodes in maintenance mode concurrently would negatively impact cluster performance, availability, and redundancy.
@briefing: 
@eli5: 
@tags: 

<!-- a2q57 -->
### Q
What happens when a VM is associated with multiple VM-Host affinity policies?
@answer: The oldest policy is applied.
@domain: vms
@context: While the provided documentation primarily focuses on VM-Host affinity and VM-VM anti-affinity, it explains that if a VM is part of multiple VM-Host affinity policies, the oldest policy is applied, and the VM is shown as non-compliant for the rest. This implies that all policies are evaluated and applied simultaneously, even if only the oldest one actively governs VM placement.
@briefing: 
@eli5: 
@tags: 

<!-- a2q58 -->
### Q
Which task should be performed first when upgrading host memory?
@answer: Place node into the maintenance mode.
@domain: vms
@context: For any hardware upgrade (like adding memory), the proper first step is to Placing a node into maintenance mode gracefully live-migrates all running virtual machines (VMs) to other available hosts in the cluster. The second step is to shutdown the AHV host.
@briefing: 
@eli5: 
@tags: 

<!-- a3q2 -->
### Q
What will occurs if an agent VM is powered off and then manually started on another host?
@answer: Agent VM cannot be migrated back to the original host.
@domain: vms
@context: An agent VM in a Nutanix AHV environment is a special type of virtual machine that is pinned to a specific host. This feature is used for VMs that provide essential services to a host and must not move, such as virtual firewalls, network monitoring tools, or certain service VMs. The key behaviors of an agent VM are: - No Live Migration: Agent VMs cannot be live-migrated. - No Automatic Migration: They are not automatically migrated during HA events or when a host enters maintenance mode. Instead, they are powered off and will only be powered back on once their designated host becomes available again. 3 sources - Host Affinity: They have a strong affinity to the host they are running on. The scenario in the question describes a specific manual override. While an agent VM won't move automatically, an administrator can manually move it while it is powered off. The procedure is: 1 Power off the agent VM. 2 Manually start the VM on a different host using the command line (acli vm.on <vm_name> host=<new_host>). When this is done, the agent VM's affinity is reset. It "forgets" its original host and becomes permanently associated with the new host. It will now operate as an agent VM on this new host and will not automatically migrate back.
@briefing: 
@eli5: 
@tags: 

<!-- a3q3 -->
### Q
An administrator has been assigned to monitoring performance across a number of different entities in the Nutanix cluster. The CIO has tasked the administrator to provide Analysis charts that show performance as granularly as possible.
What is the smallest preset time interval (in hours) that the administrator can select in a Metric or Entity Chart?
@answer: 1
@domain: monitoring
@context: When monitoring performance in Nutanix using Metric or Entity charts, the goal of achieving the most granular view possible means selecting the smallest available time interval. The Analysis dashboard provides several preset time ranges for viewing performance data. Based on the available documentation, the smallest preset time interval you can select in the Analysis dashboard is 1 hour. This option provides the most detailed and granular view of performance metrics over a short period, which is exactly what the CIO has requested.
@briefing: 
@eli5: 
@tags: 

<!-- a3q4 -->
### Q
What is the Nutanix tool provides real-time insights and anomaly detection for a Nutanix environment?
@answer: Prism Central
@domain: monitoring
@context: The Nutanix tool that provides real-time insights and anomaly detection is Prism Central, especially when licensed with tiers that enable Intelligent Operations. Prism Central serves as the centralized management plane for a Nutanix environment and uses machine learning to proactively detect performance anomalies, provide operational insights, and help troubleshoot infrastructure issues. While other tools play a role in the health and management of the cluster, Prism Central is the primary platform for this specific set of advanced analytical capabilities.
@briefing: 
@eli5: 
@tags: 

<!-- a3q5 -->
### Q
An administrator has been assigned to developing a Prism Central Recovery Plan for 50 workloads that will be assigned new IP addresses and will need to utilize a new DNS server upon instantiation of workloads in the Disaster Recovery (DR) location.
Which best way to accomplish this?
@answer: Install Nutanix Guest Tools, this will allow Re-IP and automatically assign updated DNS server(s).
@domain: data-protection
@context: The best way to automate the assignment of new IP addresses and DNS servers for 50 workloads during a failover is to install Nutanix Guest Tools (NGT) on the VMs and configure IP address management within the Recovery Plan. NGT is an in-guest agent that allows Prism Central to communicate directly with the guest operating system. This capability is essential for the Recovery Plan to automatically change a VM's network settings, such as its static IP address, upon failover to the DR site. This method is the most scalable and efficient, as it centralizes the network configuration within the Recovery Plan's network mapping settings, eliminating the need for manual intervention or complex scripting for each VM.
@briefing: 
@eli5: 
@tags: 

<!-- a3q6 -->
### Q
What would cause an LCM framework invokes the pre-check test_esx_entering_mm_pinned_vms check during an AOS upgrade?
@answer: Affinity rules are configured to prevent VM migration.
@domain: lifecycle
@context: The Nutanix Life Cycle Manager (LCM) automates software and firmware upgrades in a non-disruptive, rolling fashion. A critical part of this process is placing one host at a time into maintenance mode. For this to succeed, all user virtual machines (VMs) running on that host must be migrated to other hosts in the cluster. The LCM pre-check test_esx_entering_mm_pinned_vms fails when there are VMs on a host that cannot be automatically migrated to another host. During an upgrade, LCM needs to put each host into maintenance mode, which requires evacuating all running VMs. If a VM is "pinned" to its current host for any reason, the host cannot enter maintenance mode, and the upgrade process is halted to prevent failure. The most common reason for a VM to be pinned in this way is the presence of an affinity rule that restricts its movement.
@briefing: 
@eli5: 
@tags: 

<!-- a3q7 -->
### Q
As per InfoSec team requirements, an administrator has uploaded a signed SSL certificate to Prism for Common Access Card (CAC) authentication. Once the certificate has been uploaded successfully, the certificate appears to be valid but CAC authentication is not functional.
What is a potential cause of this issue?
@answer: There is no Certificate Revocation List (CRL) configured.
@domain: security
@context: When setting up Common Access Card (CAC) authentication, Prism must be able to verify that the client certificate presented by the user is not only valid but also has not been revoked by the issuing Certificate Authority (CA). This revocation check is a critical security step. Even if a signed SSL certificate is uploaded correctly and appears valid, authentication will fail if Prism cannot perform this revocation check. The most common reason for this failure is that a Certificate Revocation List (CRL) or Online Certificate Status Protocol (OCSP) endpoint has not been configured, or if configured, is unreachable from the Nutanix cluster. For CAC authentication, especially in secure environments, simply having a valid certificate is not enough; Prism must be able to confirm its current revocation status. Therefore, the most likely cause of the issue is the lack of a configured and reachable revocation checking mechanism.
@briefing: 
@eli5: 
@tags: 

<!-- a3q8 -->
### Q
What is the Nutanix product used for automating application deployment across clouds?
@answer: Self-Service
@domain: vms
@context: The key to this question is identifying the tool designed for application automation across different clouds. While all the listed products are part of the Nutanix portfolio, they serve distinct purposes: - NKP focuses specifically on automating container and Kubernetes cluster management. - Flow is centered on network security and microsegmentation. - Prism Central is the overarching management console for the infrastructure. Nutanix Self-Service (Calm) is the only product designed with multi-cloud application automation as its core function. It allows you to create a single blueprint that can deploy a complex, multi-tier application on your on-premises Nutanix cluster or in a public cloud. It orchestrates the entire process—from provisioning VMs and installing software to configuring network rules and scaling—providing a true application-centric automation solution for hybrid and multi-cloud environments.
@briefing: 
@eli5: 
@tags: 

<!-- a3q9 -->
### Q
An administrator has assigned to plan for new project-related growth. New project workload requirements have been included for a cluster named HQ_Prod Cluster:
- 2 Medium Sized SQL Servers
- 10 VMs with 16Gb RAM, 4 vCPU, 100GB Storage
Which two additional information items should be added to the capacity planning scenario to provide a proper capacity runway expectation? (Choose two.)
@answer: Date(s) workload(s) will be added | Existing cluster hardware specifications
@domain: performance
@context: The goal of capacity planning is to determine when you will run out of resources based on current consumption, known future additions, and growth trends. This is often visualized as a "capacity runway"—the amount of time you have left before a resource (CPU, memory, or storage) is exhausted. To calculate a time-based runway, you need two fundamental types of information: - What is the current capacity? You need to know the total resources available in the cluster. - When will new resources be consumed? Knowing the size of new workloads is not enough; you must know when they will be added to accurately predict their impact on the runway. Given the options, the two most critical pieces of additional information required are: 1 Existing cluster hardware specifications: This tells you the total capacity you are starting with. 2 Date(s) workload(s) will be added: This places the new consumption on a timeline, which is essential for calculating a "runway" (a measure of time).
@briefing: 
@eli5: 
@tags: 

<!-- a3q11 -->
### Q
An administrator have two clusters registered to two different Prism Central instances.
After configuring a Protection Policy for synchronous replication and verifying data replication, the administrator would like to create a new Recovery Plan with automatic failover.
However, the administrator finds that the Recovery Plan workflow offers only manual failure execution mode.
What configuration must be fixed to execute the failover automatically?
@answer: Primary Location and Recovery Location must be in the same AZ.
@domain: data-protection
@context: When using synchronous replication (Metro Availability) with Nutanix Disaster Recovery, the option for an automatic unplanned failover in a Recovery Plan is only available when both the primary and recovery clusters are managed by the same Prism Central instance. This means they must reside within the same Availability Zone (AZ). In your scenario, the two clusters are registered to two different Prism Central instances. By definition, this creates two separate Availability Zones. Deployments that span multiple AZs do not support automatic failover for synchronous replication; only manual failover is possible. To fix this and enable automatic failover, both clusters would need to be unregistered from their respective Prism Central instances and then registered to a single, shared Prism Central instance.
@briefing: 
@eli5: 
@tags: 

<!-- a3q12 -->
### Q
What is the main function of NearSync Replication in Nutanix?
@answer: Replicates data with an RPO of less than 1 minute
@domain: data-protection
@context: Nutanix offers a spectrum of data protection and disaster recovery options, each defined by its Recovery Point Objective (RPO), which is the maximum acceptable amount of data loss measured in time. 1 Asynchronous Replication (Hours/Minutes RPO): This is the traditional DR method where snapshots are taken on a schedule (e.g., every hour or every 15 minutes) and replicated to a remote site. The RPO is equal to the time between snapshots. 2 Synchronous Replication (Zero RPO): This provides the highest level of data protection. Every write is committed to both the local and remote clusters simultaneously before being acknowledged. This guarantees zero data loss (RPO=0) in a disaster but has strict requirements, such as very low network latency (typically <5ms round-trip time making it suitable only for sites in close proximity. 3 NearSync Replicationtion (Seconds/Sub-Minute RPO):** NearSync fills the critical gap between these two options. It allows for continuous replication of data with an RPO as low as 20 seconds (and configurable up to 15 minutes), making it a powerful option for protecting critical applications across longer distances where synchronous replication is not possible. It provides a much lower RPO than traditional asynchronous replication without the strict latency constraints of synchronous replication. Therefore, the main function and key benefit of NearSync is to provide a very low, sub-minute RPO for workloads that require aggressive data protection but cannot meet the requirements for a zero-RPO synchronous solution.
@briefing: 
@eli5: 
@tags: 

<!-- a3q13 -->
### Q
An administrator is receiving repeated approval requests to delete a protected snapshot from Nutanix Cluster that has already been approved.
What is the likely cause of this problem?
@answer: The administrator is an approver on the approval policy.
@domain: security
@context: The scenario describes a loop in an approval workflow. An administrator approves a request, but the request keeps reappearing as if it were never approved. This behavior typically points to a misconfiguration in the approval policy itself, specifically related to who is allowed to perform the action versus who is required to approve it. In many workflow systems, including those that might be used for managing protected data, a fundamental rule is that a user cannot approve their own requests. This is a common security and governance control to enforce separation of duties. In this case, the most probable cause is that the administrator who is trying to delete the snapshot is also listed as an approver in the policy that governs that action. When the administrator initiates the deletion, the policy engine sees that approval is required and sends a request. Since the administrator is also an approver, they approve it. However, the system detects this as a self-approval, which is often disallowed. It invalidates the approval and re-triggers the request, creating an endless loop of requests and approvals.
@briefing: 
@eli5: 
@tags: 

<!-- a3q14 -->
### Q
An administrator has an upcoming maintenance window scheduled . The administrator would like to minimize the chance of an upgrade failure during the maintenance window to ensure the updates will complete without issue.
What action should the administrator take to reduce the risk of any potential failures during an upgrade?
@answer: Run an Upgrade Precheck from LCM.
@domain: lifecycle
@context: The best way to reduce the risk of an upgrade failure is to run an Upgrade Precheck from Life Cycle Manager (LCM). This built-in function performs a comprehensive health assessment of the cluster to find any underlying problems that could disrupt the upgrade. By running this check beforehand, an administrator can proactively address any discovered issues, ensuring a smoother and more successful update process during the planned maintenance window.
@briefing: 
@eli5: 
@tags: 

<!-- a3q15 -->
### Q
What is the Nutanix feature to enable asynchronous replication for disaster recovery?
@answer: Protection Domains
@domain: data-protection
@context: The Nutanix feature that provides the framework to enable and manage asynchronous replication for disaster recovery is Protection Domains. A Protection Domain is a logical grouping of VMs and volume groups that you want to protect and replicate together to a remote Nutanix cluster. While snapshots are the underlying technology that captures the data at a point in time, Protection Domains are the management and policy construct used to schedule these snapshots and replicate them asynchronously to another site. This allows for a Recovery Point Objective (RPO) of one hour or more, making it a robust and widely-used solution for disaster recovery.
@briefing: 
@eli5: 
@tags: 

<!-- a3q16 -->
### Q
What is the networking component in AHV responsible for providing network connectivity to virtual machines?
@answer: Virtual Switch (vSwitch)
@domain: networking
@context: In Nutanix AHV, the networking component responsible for providing network connectivity to virtual machines is the Virtual Switch (vSwitch). Every AHV host contains a vSwitch, which is based on Open vSwitch (OVS). This vSwitch acts just like a physical switch but in software. It creates a logical network where virtual machines (VMs) can connect. The VM's virtual network interface cards (vNICs) are connected to ports on the vSwitch. The vSwitch then directs traffic between VMs on the same host and connects to the physical network through the host's physical network adapters (uplinks), allowing VMs to communicate with the rest of the network and the internet.
@briefing: 
@eli5: 
@tags: 

<!-- a3q17 -->
### Q
List all hypervisors are officially supported by Nutanix for running virtualized workloads?
@answer: VMware ESXi, Microsoft Hyper-V, Nutanix AHV
@domain: architecture
@context: Nutanix is fundamentally a hypervisor-agnostic platform, meaning it is designed to work with multiple virtualization solutions. This flexibility allows customers to choose the hypervisor that best fits their operational needs, existing skill sets, and licensing preferences. The officially supported hypervisors that you can run on a Nutanix cluster are: - Nutanix AHV: Nutanix's native, enterprise-grade hypervisor that is included with the Nutanix Cloud Platform at no extra cost. It is deeply integrated into the stack and managed through Prism. - VMware ESXi: A widely-used hypervisor in enterprise environments. Nutanix fully supports running ESXi on its platform, allowing customers to continue using their existing VMware tools and expertise. - Microsoft Hyper-V: Another popular hypervisor, especially in environments with a significant Microsoft footprint. Nutanix also supports Hyper-V for running virtualized workloads. Therefore, the correct combination of officially supported hypervisors is Nutanix AHV, VMware ESXi, and Microsoft Hyper-V.
@briefing: 
@eli5: 
@tags: 

<!-- a3q18 -->
### Q
An administrator assigned to create a new storage container for persistent desktops.
Which storage optimization setting must the administrator set for the best possible capacity savings?
@answer: Post Process Deduplication
@domain: storage
@context: For a storage container hosting persistent desktops, the best setting for maximum capacity savings is Post-Process Deduplication. Persistent VDI involves many full-clone VMs that share identical operating system and application files. Persistent desktops, especially when created as full clones, result in many virtual machines that share a large number of identical data blocks from the base operating system and installed applications. Post-process deduplication is designed specifically for this type of workload. It works in the background to scan data that has been written to the capacity tier (SSD/HDD), find these duplicate blocks across all the different VMs, and consolidate them, freeing up significant storage space. This process is highly effective for VDI workloads with full or persistent clones.
@briefing: 
@eli5: 
@tags: 

<!-- a3q19 -->
### Q
Which Nutanix feature allows an administrator to perform non-disruptive upgrades of software and firmware?
@answer: One-Click Upgrade
@domain: lifecycle
@context: The feature that allows a Nutanix administrator to perform non-disruptive upgrades of software and firmware is One-Click Upgrade. This capability is managed through the Nutanix Life Cycle Manager (LCM). The One-Click Upgrade process is designed to simplify and automate the entire upgrade workflow for the Nutanix stack, including AOS, hypervisors, and firmware for servers, with minimal business disruption. The system intelligently updates one node at a time. It first migrates all virtual machines from the node to other nodes in the cluster, then updates the node, and finally brings it back into the cluster. This rolling process ensures that applications remain online and available throughout the entire maintenance window.
@briefing: 
@eli5: 
@tags: 

<!-- a3q20 -->
### Q
What is the prerequisite should be met before any LCM updates are performed?
@answer: Update LCM framework
@domain: lifecycle
@context: Before performing any other updates in the Nutanix stack, the primary prerequisite is to ensure that the Life Cycle Manager (LCM) framework itself is updated to the latest version. LCM is the engine that orchestrates all software and firmware updates, and keeping it current ensures it has the latest logic, compatibility information, and bug fixes required for a smooth upgrade process for all other components like AOS, hypervisors, and firmware. The recommended upgrade sequence generally starts with updating the management tools. In Prism Element, this means updating LCM first, followed by NCC, and then other components like Foundation and AOS.
@briefing: 
@eli5: 
@tags: 

<!-- a3q21 -->
### Q
Upon reaching the maximum instances of retained reports in PC, what will occur?
@answer: Oldest report is deleted
@domain: monitoring
@context: When the maximum number of retained report instances is reached for a report configuration in Prism Central's Intelligent Operations, the system automatically deletes the oldest generated report instance to make room for the new one. This is a "first-in, first-out" (FIFO) process that ensures the reporting feature continues to function without requiring manual cleanup or causing failures. By default, 25 instances are retained if no specific policy is set. Resources
@briefing: 
@eli5: 
@tags: 

<!-- a3q22 -->
### Q
Which default file system is used by Nutanix storage?
@answer: NDFS (Nutanix Distributed File System)
@domain: storage
@context: The default and core file system used by Nutanix storage is the NDFS (Nutanix Distributed File System). This is a purpose-built, highly distributed file system that aggregates the local storage (SSDs and HDDs) from all nodes in the cluster into a single, unified storage pool. NDFS is the foundation of the Nutanix storage architecture. It is responsible for managing all data, ensuring data protection and high availability through features like replication and erasure coding, and providing advanced storage functionalities like compression, deduplication, and snapshots. All I/O from virtual machines is handled by NDFS, which runs within the Controller VM (CVM) on each node. While the official marketing name has evolved to "AOS Storage" or was previously "Distributed Storage Fabric (DSF)", the underlying technology and its original name is NDFS.
@briefing: 
@eli5: 
@tags: 

<!-- a3q23 -->
### Q
To fulfill the requirements from the network team, an administrator must create User VMs on VLAN 10 on multiple Nutanix AHV clusters.
What network configuration should the administrator consider in order to ensure consistent connectivity for User VMs on VLAN 10?
@answer: Virtual Switch Configuration
@domain: networking
@context: To ensure that User VMs on VLAN 10 have consistent network connectivity across multiple, separate AHV clusters, the most critical element to consider is the Virtual Switch Configuration. In AHV, networking for VMs is managed through virtual networks created in Prism. These virtual networks are assigned a specific VLAN ID and are attached to the underlying virtual switches (which are based on Open vSwitch) on each host. However, since the requirement is for multiple clusters, you must ensure that the Virtual Switch on each separate cluster is configured identically with a network for VLAN 10. While this was historically a manual, per-cluster process, newer versions of Prism Central introduce multi-cluster virtual switches, which simplify this by allowing a single network configuration to span multiple clusters.< Regardless of the method, the virtual switch is the fundamental component that must be configured correctly on all relevant clusters.
@briefing: 
@eli5: 
@tags: 

<!-- a3q24 -->
### Q
A Nutanix administrator is assigned to ensure the protection of a business critical application. The application is running on a Linux VM and is using a custom DB that require application consistent snapshots for data integrity.
An administrator has written a pre_freeze and post_thaw scripts and placed them under /usr/local/sbin/.
During protection domain scheduled run an alert is generated:
Execution of the PostThaw Script Failed
Which two resolution steps could an administrator conduct to fix the issue? (Choose two.)
@answer: Ensure NGT service is up and running. | Execute scripts manually and ensure they succeed
@domain: data-protection
@context: When a post_thaw script fails during an application-consistent snapshot on a Linux VM, it indicates a problem with either the script itself or the Nutanix Guest Tools (NGT) service responsible for executing it. To resolve this, the administrator must validate that the NGT service is operational and that the script is correctly configured, has the proper permissions, and can run without errors. The two most effective resolution steps are to ensure the NGT service is up and running and to execute the scripts manually to confirm they succeed. These actions directly test the two core components involved: the execution framework (NGT) and the executable content (the script).
@briefing: 
@eli5: 
@tags: 

<!-- a3q25 -->
### Q
How to automate the deployment of 100 Linux VMs with similar configurations but different hostnames, local configurations, and install packages?
@answer: Cloud-Init configuration
@domain: vms
@context: For automating the deployment of 100 Linux VMs with similar base configurations but unique hostnames, local settings, and software packages, the best method is to use a Cloud-Init configuration. Cloud-Init is the industry standard for customizing Linux virtual machines on their first boot. It allows you to use a single "golden image" or template and then apply specific configurations to each new VM created from it, such as setting a unique hostname, creating user accounts, adding SSH keys, and running scripts to install packages. This approach is highly efficient and scalable, making it ideal for deploying a large number of VMs.
@briefing: 
@eli5: 
@tags: 

<!-- a3q26 -->
### Q
An administrator is assigned to create a Playbook where VM protection has failed for VMs in category:
CriticalApps:Alerts. The administrator needs to create an alert for only the VMs in the CriticalApps:Alerts category. The alert must send a notification to the on-call personnel in the event that a VM Protection Failed Alert is triggered.
How should the administrator complete this assignment?
@answer: Create a Playbook with an Alert Matching Criteria trigger.
@domain: monitoring
@context: To accomplish this task, the administrator should create a Playbook using the Alert Matching Criteria trigger. This specific trigger type is designed for the exact scenario you've described: it allows you to build a highly targeted automation that activates only when a specific alert (like 'VM Protection Failed') occurs on entities that match a specific filter, such as being part of a category ('CriticalApps:Alerts'). Using a more generic trigger, like the standard 'Alert-based' trigger, would be too broad. The 'Alert Matching Criteria' trigger provides the necessary granularity to precisely define the conditions under which the Playbook should run, ensuring notifications are only sent for the critical VMs you care about in this context.
@briefing: 
@eli5: 
@tags: 

<!-- a3q27 -->
### Q
What is the Nutanix feature helps optimize storage space by removing duplicate blocks of data?
@answer: Deduplication
@domain: storage
@context: While both Compression and Deduplication are storage optimization technologies that save space, they work differently. Compression makes data smaller, whereas Deduplication entirely eliminates redundant copies of data blocks. In contrast, Data Locality is focused on improving performance by reducing read latency, and Replication Factor is focused on data protection and availability by creating multiple copies of data, which actually increases storage consumption. Therefore, the specific feature designed to optimize storage by removing duplicate data blocks is Deduplication.
@briefing: 
@eli5: 
@tags: 

<!-- a3q28 -->
### Q
An administrator has an environment based on two different AHV-based and ESXi-based clusters. Workloads are evenly distributed and in a healthy state.
A Linux VM running on ESXi is not performing well at the storage level and is configured as follows:
- VCPU: 8
- VRAM: 32
- vDisk: 3, first 100 GB, second 250 GB, third 250 GB
What is the easiest way to test VM performance, while minimizing downtime?
@answer: Enable vDisk sharding at AOS level.
@domain: performance
@context: The core of the problem is a storage performance bottleneck on a single VM. Historically, Nutanix addressed this by recommending that administrators create multiple smaller vDisks and stripe them together in the operating system (like LVM in Linux). This approach distributes I/O across multiple vDisk controllers, improving throughput. However, Nutanix introduced vDisk sharding to provide a similar benefit automatically and transparently for a single large vDisk. This feature allows a vDisk's I/O to be processed by multiple threads in the Nutanix storage fabric (Stargate), effectively "sharding" the workload. Since it is an AOS-level feature that can be enabled without VM downtime and directly targets the described bottleneck, it is the easiest and most direct method to test for a performance improvement.
@briefing: 
@eli5: 
@tags: 

<!-- a3q30 -->
### Q
How could the Nutanix administrator create a custom Intelligent Operations report, and run across multiple Prism Central instances?
@answer: Export/import the report configuration in .rpt format.
@domain: monitoring
@context: Nutanix Prism Central is designed to be a centralized management plane for one or more Nutanix clusters. However, different Prism Central instances operate independently of one another. There is no native feature that allows one Prism Central to automatically discover or run reports on another. To maintain consistency and save administrative effort across separate environments (like development, production, or different geographical sites), Nutanix provides an export/import functionality for certain configurations, including custom reports from Intelligent Operations. The process is straightforward: 1 In the source Prism Central, you create and finalize your custom report. 2 From the Reports > Configuration page, you select the report and use the Export action. 3 This generates a .rpt file containing the report's structure. 4 In the destination Prism Central, you navigate to the same page and use the Import action to upload the .rpt file. This correctly populates the custom report in the new Prism Central, ready to be run against the clusters it manages. This same export/import methodology is also used for other configurations like X-Play playbooks.
@briefing: 
@eli5: 
@tags: 

<!-- a3q31 -->
### Q
An administrator is creating a storage performance test between two Microsoft Windows VMs. The first VM was deployed by using a template, while the second one was created from scratch.
Results show that VMs have very different metrics when using the same performance test. The first VM reaches 8000 IOPS, while the second struggles reaching 500/800 IOPS. Currently the AHV cluster is not under pressure.
How can the administrator determine why these results were produced?
@answer: Verify both VMs have installed Nutanix Guest Tools.
@domain: vms
@context: The significant difference in storage performance (8000 IOPS vs. 500-800 IOPS) between the two Microsoft Windows VMs is almost certainly due to the absence of the correct storage drivers on the VM that was created from scratch. The high-performing VM, created from a template, would have been built from a "golden image" that already included the necessary Nutanix VirtIO drivers. These drivers are essential for high performance on the AHV platform. When a Windows VM is created from scratch without manually installing these drivers, it falls back to using emulated, legacy storage controllers (like IDE or a non-paravirtualized SCSI). These emulated drivers have a massive performance overhead and cannot deliver the high IOPS that the underlying Nutanix platform is capable of, which explains the drastically lower performance you are observing. The solution is to ensure the Nutanix VirtIO drivers, which are part of the Nutanix Guest Tools (NGT) package, are installed on the underperforming VM.
@briefing: 
@eli5: 
@tags: 

<!-- a3q32 -->
### Q
An administrator needs to ensure that DR snapshots are protected from inadvertent or malicious deletion without notification.
What is the best way to accomplish this?
@answer: Create and Apply an Approval Policy.
@domain: data-protection
@context: The core requirement of the question is to find a method that protects snapshots from being deleted without oversight, not just one that reports on the deletion after it happens. This calls for a proactive control rather than a reactive one. - Reactive Options (Alert Policy, Playbook): These tools are excellent for notification and post-event automation. They tell you that a snapshot was deleted but do not stop the deletion itself. - Permissions Option (DR Admin Role): This is a basic access control mechanism, but the role itself grants the very permissions the administrator wants to control. It doesn't add an extra layer of protection. - Proactive Option (Approval Policy): This is the only feature listed that inserts a control step before a sensitive action is executed. By requiring approval for the "Recovery Point Delete" operation, you ensure that no snapshot can be removed without a second party's consent. This effectively prevents unauthorized or accidental deletions and provides a clear audit trail, perfectly matching the administrator's goal.
@briefing: 
@eli5: 
@tags: 

<!-- a3q33 -->
### Q
What is the Nutanix feature allows administrators to expand a cluster by adding new nodes without downtime?
@answer: Scale-out Architecture
@domain: architecture
@context: The core principle behind Nutanix's flexibility is its Scale-out Architecture. Unlike traditional three-tier architectures that require complex and disruptive "rip-and-replace" upgrades when they run out of resources, Nutanix is designed for simple, incremental growth. When a business needs more compute or storage resources, the process is straightforward: 1 Rack and network a new Nutanix node. 2 Use Prism to discover the new node on the network. 3 Select the node and click to add it to the cluster. The Nutanix Distributed Storage Fabric (DSF) automatically handles the rest. It integrates the new node's resources and begins redistributing data to ensure it is evenly balanced and that data locality is optimized. This entire operation happens online without impacting running workloads, fulfilling the requirement of expanding a cluster without downtime. The other options listed are specific features for management (Prism Central) or data protection (Metro Availability, Protection Domains), not the fundamental architectural principle that enables non-disruptive expansion.
@briefing: 
@eli5: 
@tags: 

<!-- a4q1 -->
### Q
An administrator needs to configure a solution that ensures VMs automatically power on in a specific order at the DR site in the event of a disaster. Which nutanix feature will achieve this?
@answer: Recovery Plan
@domain: data-protection
@context: The feature that ensures VMs automatically power on in a specific order at the DR site during a disaster is a Recovery Plan. Recovery Plans are part of Nutanix’s DR functionality and allow administrators to define startup sequences, dependencies, and priorities for VMs during failover scenarios.
@briefing: 
@eli5: 
@tags: 

<!-- a4q2 -->
### Q
Which AOS process determines if an I/O from a user VM will be written to oplog or the extent store?
@answer: Stargate
@domain: architecture
@context: The AOS process responsible for determining whether an I/O operation from a user VM is written to the oplog or the extent store is called Stargate.
@briefing: 
@eli5: 
@tags: 

<!-- a4q3 -->
### Q
After initial configuration and an NCC upgrade, an administrator sees critical alerts.
Which two initial cluster configuration tasks were missed?
@answer: Host password change | CVM Password change
@domain: lifecycle
@context: CVM password change and Host password change are correct. These are considered critical security configurations that, if missed, could trigger alerts after an NCC upgrade. NCC performs checks related to security best practices, including password configurations. Unchanged default passwords are flagged as security vulnerabilities.
@briefing: 
@eli5: 
@tags: 

<!-- a4q4 -->
### Q
An administrator needs to configure a new subnet on an AHV cluster and wants to ensure that VMs will automatically be assigned an IP address at creation time. Which type of network does the administrator need to create?
@answer: Managed Network
@domain: networking
@context: The administrator needs to create a managed network. In AHV, a managed network utilizes DHCP to automatically assign IP addresses to VMs upon their creation. An unmanaged network requires manual IP configuration for each VM.
@briefing: 
@eli5: 
@tags: 

<!-- a4q5 -->
### Q
An administrator needs to create a new Linux image and will need to do the following as part of the VM deployment: Set the OS hostname, Add custom users, Add keys, Run custom scripts. What package needs to be installed in the Linux image to facilitate this automation?
@answer: Cloudinit
@domain: vms
@context: The package you need to install to automate tasks like setting the OS hostname, adding custom users, adding keys, and running custom scripts during Linux VM deployment is cloud-init.
@briefing: 
@eli5: 
@tags: 

<!-- a4q6 -->
### Q
Which Nutanix process stores and manages all of the cluster metadata in a distributed ring-like manner?
@answer: Cassandra
@domain: architecture
@context: The Nutanix process responsible for storing and managing all cluster metadata in a distributed ring-like method is Cassandra. It's based on a modified version of Apache Cassandra and uses the Paxos algorithm to maintain consistency across the cluster. This service operates on every node within the cluster. Access to Cassandra is provided through an interface known as Medusa.
@briefing: 
@eli5: 
@tags: 

<!-- a4q7 -->
### Q
An administrator has been asked to deploy VMs using a specific image. The image has been configured with settings and applications that will be used to develop a new product for the company. The image is not available on the desired cluster, but it is available in other clusters associated with Prism Central. Why isn’t the image available?
@answer: The cluster has not been added to the correct category
@domain: vms
@context: The administrator should check if the cluster they are trying to deploy the Virtual Machines (VMs) to has been added to the correct category within Prism Central (PC). Image placement policies in PC use categories to determine which images are available to which clusters. If the cluster isn't assigned to the category specified in the image placement policy, the image won't be available. The administrator needs to add the cluster to the appropriate category within PC to make the image accessible for VM deployment. Image placement policies can also be configured with "soft" or "hard" enforcement. A "hard" enforcement policy strictly limits image availability to clusters within the specified categories, while a "soft" enforcement policy allows clusters outside the specified categories to use the image if needed.
@briefing: 
@eli5: 
@tags: 

<!-- a4q8 -->
### Q
An administrator has created a Nutanix-managed network and assigned it a VLAN ID of 512. Several VMs have been created, but the administrator notices that the VMs can communicate with other VMs on that VLAN provided they are on the same host but cannot communicate with VMs that reside on a different host in the cluster. What is most likely the cause of this issue?
@answer: The VLAN was not created on the upstream switches.
@domain: networking
@context: The most likely cause is that the VLAN (VLAN ID 512) was not created on the upstream switches. VMs on the same host can communicate because they are on the same physical network segment. However, for inter-host communication, the VLAN must be configured on the physical network infrastructure, specifically the upstream switches. If the VLAN is not present on these switches, traffic will not be routed between hosts.
@briefing: 
@eli5: 
@tags: 

<!-- a4q9 -->
### Q
After configuring Active Directory as the desired authentication service, an administrator is not able to log in to Prism Central using a privileged account. Which configuration must be checked first?
@answer: Role Mapping
@domain: security
@context: The first configuration to check is Role Mapping. After configuring Active Directory, users need to be mapped to roles within Prism Central to gain appropriate access. If a privileged account is not mapped to a role with sufficient permissions, login will be denied even if the credentials are valid within Active Directory. Verifying the role mapping ensures the account has the necessary permissions to access Prism Central.
@briefing: 
@eli5: 
@tags: 

<!-- a4q10 -->
### Q
A recently configured cluster is leveraging NearSync with a recovery schedule of 15 minutes. It is noticed that the cluster is consistently transitioning in and out of NearSync. What action should be taken to potentially address this issue?
@answer: Increase the network bandwidth
@domain: data-protection
@context: Increasing the network bandwidth between the sites is the most likely solution if the cluster is consistently out of Near Sync. Near Sync relies on frequent data transfers to maintain synchronization, and insufficient bandwidth can hinder this process. While increasing the Near Sync schedule to 30 minutes might reduce the frequency of synchronization attempts and temporarily alleviate the issue, it doesn't address the root cause. Adding vCPUs to user VMs won't impact Near Sync functionality. Configuring a secondary schedule also doesn't directly resolve the underlying network bandwidth problem.
@briefing: 
@eli5: 
@tags: 

<!-- a4q11 -->
### Q
What is the minimum time a newly created deduplication storage policy takes to apply to VMs in the container?
@answer: 30 Minutes
@domain: storage
@context: Deduplication policies take a minimum of 30 minutes to apply to VMs. The actual time can vary depending on the number of VMs and the amount of data in the container. For example, in a Metro Availability scenario with encryption enabled, the policy application can take 30 minutes or more. A similar delay can occur when conflicts exist between the storage policy and the container configuration, such as when a container previously had deduplication enabled. These delays are due to the underlying storage policy engine and background processes.
@briefing: 
@eli5: 
@tags: 

<!-- a4q12 -->
### Q
After running an LCM inventory, it is noticed that there are a number of firmware and software updates available. The administrator would like to avoid any host reboots but would like to apply some of the available updates. Which two updates can be done while avoiding a host reboot?
@answer: AOS | Data Drives
@domain: lifecycle
@context: Data Drives and AOS updates can be performed without requiring a host reboot. AHV and M.2 Drives require a reboot.
@briefing: 
@eli5: 
@tags: 

<!-- a4q13 -->
### Q
In the event of a disk failure, which process will immediately and automatically scan Cassandra to find all data previously hosted on the failed disk and all disks in that node?
@answer: Curator
@domain: architecture
@context: Curator scans and ensures data resiliency after disk failures.
@briefing: 
@eli5: 
@tags: 

<!-- a4q14 -->
### Q
Refer Exhibit: An administrator wants to reduce the largest amount of alert emails received from PC. Which two settings should the administrator customize to meet the requirement.( choose Two)
@answer: Skip empty digest email | Daily Digest
@domain: monitoring
@context: The two settings an administrator should customize to reduce the number of alert emails from PC are: Daily Digest: Enabling this setting will consolidate individual alerts into a single daily summary email. Skip empty digest email: Enabling this setting will prevent the system from sending a digest email if there are no alerts to report. This is helpful in reducing unnecessary emails.
@briefing: 
@eli5: 
@tags: 

<!-- a4q15 -->
### Q
An Administrator has been notified by a user that a Microsoft SQL Server instance is not performing well. When reviewing the utilization metrics, the following concerns are noted:
- Memory consumption has been above 95% for several months
- Memory consumption has been spiking to 100% for the last five days
- CPU usage is 45% - Storage latency is 2ms.
When logging into Prism Central, how could the administrator quickly verify if this VM has performance bottlenecks?
@answer: Filter VM by efficiency
@domain: performance
@context: A VM running at 95-100% memory is the textbook Constrained VM, which Prism Central exposes via VM efficiency. Filtering VMs by efficiency identifies the constrained VM and the exact resource it lacks, directly confirming the bottleneck. Capacity runway is a cluster-level forecast, not a per-VM diagnostic. [Source key corrected: the dump marked 'See capacity runway,' which is wrong — see review notes.]
@briefing: 
@eli5: 
@tags: 

<!-- a4q16 -->
### Q
An administrator has an AHV cluster that is comprised of 4 nodes with the following configuration in each:
- CPU: 2 x 2.4GHz 12-core
- Memory: 256GB
- Disks: 6 x 1.92TB SSD
A VM with 16 vCPUs and 96GB of RAM is being created on the cluster. How should the administrator configure the VM to assure optimal performance?
@answer: With 2 vNUMA nodes
@domain: vms
@context: To ensure optimal performance for the VM with 16 vCPUs and 96GB of RAM on the four-node AHV cluster, the administrator should configure the VM with 2 vNUMA nodes. Given the VM's size, leveraging vNUMA improves performance by distributing the CPU and memory resources optimally across NUMA boundaries.
@briefing: 
@eli5: 
@tags: 

<!-- a4q17 -->
### Q
An Administrator manages an AHV cluster that is dedicated to a dev/test environment. The administrator is receiving complaints from users that they are unable to create VMs on the clusters.
After reviewing the clusters, the administrator finds that the memory resources are almost fully utilized, with many VMs overprovisioned on Memory. What option is the most efficient resolution to enable additional VMs to be created.
@answer: Enable Memory overcommit on the overprovisioned VMs
@domain: vms
@context: This is likely the most efficient solution in a dev/test environment. Memory overcommit allows you to assign more memory to virtual machines (VMs) than is physically available on the cluster. This works because most VMs don't utilize all of their assigned memory all the time. Overcommitting allows for greater VM density, effectively sharing the available memory across more VMs. However, keep in mind that if the overcommitted VMs suddenly require their full memory allocation, performance could be impacted.
@briefing: 
@eli5: 
@tags: 

<!-- a4q18 -->
### Q
An administrator recently added new SSDs to a Nutanix cluster and knows the firmware will be out of date. Due to security constraints, the cluster does not have access to the internet.
Which two steps must be completed to update the firmware (Choose Two)
@answer: Update the LCM source and URL | Download a darksite bundle and deploy it on an internal webserver
@domain: lifecycle
@context: Update the LCM source and URL: LCM (Life Cycle Manager) usually pulls updates from the Nutanix portal. Since the cluster is offline, its source URL needs to be redirected to the internal web server hosting the offline update bundles. The command configure_lcm -p can be used to verify the current LCM configuration including the URL and whether a bundle has been uploaded. Look for the "uploaded_bundle: True" in the output to confirm the bundle upload is successful. The specific commands to change the URL will depend on the LCM version. Download a darksite bundle and deploy it on an internal webserver: A darksite bundle contains the necessary firmware updates. This bundle needs to be downloaded to a system with internet access and then deployed on a web server accessible to the isolated Nutanix cluster. This allows the cluster to access the updates internally. Once the LCM Framework Bundle is uploaded, you should see the "Dark Site - Direct Upload" mode in the LCM UI in Prism.
@briefing: 
@eli5: 
@tags: 

<!-- a4q19 -->
### Q
An administrator is not able to log into PC using a new Active Directory user account, after logging with the local user, the administrator verified that directory services and role mapping settings are valid.
What is the most likely cause of this issue?
@answer: Change password at next logon attribute is set
@domain: security
@context: The user is required to change their password before logging in, which prevents access.
@briefing: 
@eli5: 
@tags: 

<!-- a4q20 -->
### Q
An administrator logs into the Nutanix support portal and notices there is a new version of the LCM framework available. In an effort to ensure LCM is providing the latest features, the administrator would like to upgrade LCM.
How can the LCM framework be upgraded?
@answer: Perform an LCM inventory
@domain: lifecycle
@context: The Life Cycle Manager (LCM) framework is upgraded automatically as part of the LCM Inventory operation. This happens whether the inventory is triggered manually or automatically. During the inventory, LCM checks if a new version is available at the configured URL and, if so, silently upgrades the framework before starting the inventory.
@briefing: 
@eli5: 
@tags: 

<!-- a4q21 -->
### Q
An administrator needs to limit the amount of storage space that data stored in a single container can consume. Which action should the administrator take?
@answer: Set advertised capacity for the container
@domain: storage
@context: Storage Advertised Capacity: Set an advertised capacity for the container. This acts as a soft limit, preventing the container from exceeding the specified capacity. Note: some extra space should be allocated beyond the projected size of any virtual machines (VMs) placed in the container to allow room for data that hasn't been garbage collected. Convert the desired capacity from TiB to GiB when setting the advertised capacity on individual storage containers. Be aware that with external storage, using advertised capacity as a hard limit is unreliable due to a time delay in detecting when the limit is crossed
@briefing: 
@eli5: 
@tags: 

<!-- a4q22 -->
### Q
Which Nutanix service controls ncli, the HTML5 UI, and REST API?
@answer: Prism
@domain: architecture
@context: The Nutanix service that controls ncli, the HTML5 UI, and REST API is Prism. Prism is the central management interface for Nutanix clusters, providing a single pane of glass for administrators. It offers multiple interfaces, including the HTML5 UI, REST API, ncli, and PowerShell cmdlets, to manage various aspects of the Nutanix environment, such as platform management, VM and container lifecycle management, policy definition and compliance, service design and status, and analytics and monitoring.
@briefing: 
@eli5: 
@tags: 

<!-- a4q23 -->
### Q
An administrator wants to receive an environment summary report when a host failure occurs. Which action would address the administrator's need?
@answer: Configure an Alert Policy
@domain: monitoring
@context: To receive an environment summary report when a host failure occurs, the administrator should configure an Alert Policy. Alert policies can be configured to trigger notifications, including reports, based on specific events, such as host failures.
@briefing: 
@eli5: 
@tags: 

<!-- a4q24 -->
### Q
Which two types of granular RBAC does Nutanix provide for AHV hosts? (Choose two)
@answer: Category Based | Project Based
@domain: security
@context: Nutanix provides two granular RBAC types for AHV hosts:\n\n- Category-based: Allows assigning permissions based on VM categories.\n- Project-based: Enables access control based on user roles within specific projects
@briefing: 
@eli5: 
@tags: 

<!-- a4q25 -->
### Q
An administrator is adding a new node to the cluster. The node has been imaged to the same version of AHV and AOS that the cluster is running, configured with the appropriate IP address, and br0-up has been configured with the same uplink bonds. What is the next step?
@answer: Add the node to the cluster from Prism
@domain: networking
@context: The next step after imaging the new node with the same Acropolis Hypervisor (AHV) and Acropolis Operating System (AOS) versions, configuring the IP address, and setting up br0-up is to a. Add the node to the cluster from Prism. This is the standard procedure for expanding an existing Nutanix cluster. The other options involve commands that are part of the initial cluster creation or troubleshooting, not the expansion process.
@briefing: 
@eli5: 
@tags: 

<!-- a4q26 -->
### Q
An administrator is performing validation testing of a newly deployed cluster. During this test, the administrator disconnects each LAN interface from each node while pinging the hypervisor and guest VMs. When the first interface is disconnected, ping continues as expected to the hypervisor, but the guest VM stops responding. Ping resumes when the interface is reconnected. When the second interface is disconnected, ping continues to both the hypervisor and guest VMs. What could be the cause of this issue?
@answer: Switch ports are configured with different VLANs
@domain: networking
@context: If the switch ports connected to the two LAN interfaces are configured with different VLANs, the guest VM traffic may be tagged incorrectly when failing over. When the first interface (likely the primary) goes down, the guest VM traffic might be sent on a VLAN that the second interface and/or other network devices are not configured to receive, resulting in the loss of ping. Since pinging the hypervisor is unaffected, its traffic is likely on a different VLAN (or untagged) that is correctly configured across both interfaces and the rest of the network. When the second interface is disconnected, the active connection remains on the first interface and its VLAN, hence no disruption
@briefing: 
@eli5: 
@tags: 

<!-- a4q27 -->
### Q
While installing Windows Server 2019 on a new VM on an AHV cluster, an administrator notices there aren’t any drives listed for the install. What might be the problem?
@answer: VirtIO drivers have not yet been installed and the disks are SCSI disks
@domain: vms
@context: The most likely reason is missing VirtIO drivers. During the Windows installation process, you need to load these drivers to allow the OS to recognize the virtual storage controller presented by the AHV hypervisor. If these drivers aren't loaded, the installer won't be able to see any storage devices to install Windows onto. Make sure you have the VirtIO driver ISO attached to the VM and, at the appropriate point in the Windows installation, load the SCSI controller driver from the ISO
@briefing: 
@eli5: 
@tags: 

<!-- a4q28 -->
### Q
An administrator needs to configure Prism to send encrypted messages to a set of recipients. Which setting must be applied?
@answer: Set SMTP security mode to STARTTLS
@domain: security
@context: To configure Prism to send encrypted messages, set the SMTP security mode to STARTTLS. This setting ensures that email communication is encrypted during transmission, enhancing security and protecting sensitive information.
@briefing: 
@eli5: 
@tags: 

<!-- a4q29 -->
### Q
An administrator needs to ensure logs, alerts, and information are consistent across clusters that are located in different countries. Which service needs to be configured?
@answer: NTP
@domain: monitoring
@context: NTP (Network Time Protocol) is the correct service to configure. It synchronizes time across clusters, ensuring that logs, alerts, and other time-sensitive information remain consistent, regardless of their geographical location. While other options like SMTP, DNS, and SNMP have their respective roles in a network, they don't directly address the need for consistent timing across different locations.
@briefing: 
@eli5: 
@tags: 

<!-- a4q30 -->
### Q
An administrator is troubleshooting vDisk performance issues in a Nutanix cluster with a hybrid disk. The VMs all have Flash Mode enabled but users report disk latency. What could cause these performance issues?
@answer: Data size for Flash Mode exceeds 25% of SSD capacity
@domain: storage
@context: One possible cause of the vDisk performance issues, despite Flash Mode being enabled and the cluster having hybrid disks, is that the data size for Flash Mode exceeds 25% of the SSD capacity. If the data size for Flash Mode-enabled VMs or volume groups (VGs) exceeds this threshold, the system might down-migrate the data, impacting performance and causing latency.
@briefing: 
@eli5: 
@tags: 

<!-- a4q31 -->
### Q
An administrator has been asked to enable block awareness and increase the fault tolerance to FT3 on a Nutanix AHV cluster with the following configuration.
- Four Blocks
- One node per block
Will the administrator be able to accomplish the task?
@answer: NO - FT3 requires a minimum of five nodes
@domain: architecture
@context: No, the administrator will not be able to accomplish the task. A Nutanix cluster requires a minimum of five nodes for Fault Tolerance 3 (FT3). The administrator has only four nodes, one node per block.
@briefing: 
@eli5: 
@tags: 

<!-- a4q32 -->
### Q
An administrator is trying to put a node into maintenance mode but receives the message shown in the exhibit. What is the potential reason for this dialog?
@answer: Linux VM1 uses a vDisk stored in an RF1 DataStore
@domain: vms
@context: The error message indicates that a virtual machine (VM) named LinuxVM1, residing on the node being put into maintenance mode, has a vDisk stored in an RF1 datastore. RF1 (Replication Factor 1) implies that the vDisk has only one copy, offering no redundancy. When a node enters maintenance mode, its VMs are typically migrated to other nodes in the cluster. However, with RF1, there's no other copy of the vDisk to migrate, hence preventing the node from entering maintenance mode to protect against data loss. To resolve this, increase the replication factor to at least RF2 before attempting to put the node into maintenance mode. This ensures data redundancy and allows for live migration of the VM during maintenance.
@briefing: 
@eli5: 
@tags: 

<!-- a4q33 -->
### Q
A user running a computer aided design (CAD) application is complaining about slow response time within the VM, particularly when moving windows or rendering images.
Which VM matric will guide the administrator toward diagnosing the problem.
@answer: GPU Usage
@domain: vms
@context: The most relevant VM metric to investigate slow response times in a CAD application, especially when moving windows or rendering images, is GPU usage. CAD applications, particularly rendering tasks, rely heavily on the GPU. High GPU usage indicates the virtual machine's GPU resources are saturated, directly impacting the user experience with slow window movement and rendering times. While other metrics such as storage controller latency, swap-in rate, and hypervisor memory usage can contribute to general VM slowness, they are less likely to be the primary bottleneck for the specific issues described by the CAD user.
@briefing: 
@eli5: 
@tags: 

<!-- a4q34 -->
### Q
An administrator wants to replace an old node with a node of newer generation in a 3-node cluster. The administrator has already chosen the appropriate node, but is unable to remove it from Nutanix cluster. Why is remove HOST option is not shown in exhibit.
@answer: It is not possible to remove a node from a 3-node cluster
@domain: architecture
@context: It is not possible to remove a host from a 3-node cluster. Nutanix clusters require a minimum of three nodes for redundancy and fault tolerance. Removing a node from a 3-node cluster would leave only two nodes, violating this minimum requirement. Therefore, the option to remove a host is disabled in Prism when managing a 3-node cluster. To replace a node, you would typically add the new node to the cluster first, then remove the old node.
@briefing: 
@eli5: 
@tags: 

<!-- a4q35 -->
### Q
Refer Exhibit: Why has an anomaly been triggered?
@answer: Because the CPU usage crossed the blue band
@domain: monitoring
@context: Nutanix leverages a method for determining the bands called ‘Generalized Extreme Studentized Deviate Test’. A simple way to think about thisis similar to a confidence interval where the values are between the lower and upper limits established by the algorithm.
@briefing: 
@eli5: 
@tags: 

<!-- a4q37 -->
### Q
An administrator is tasked with configuring networking on an AHV cluster and wants to minimize the throughput for the host with many small VMs while minimizing network switch configuration. Which bond mode should the administrator select?
@answer: Active-Backup
@domain: networking
@context: Active-Backup. This mode uses a single active adapter for all traffic, minimizing throughput compared to Active-Active modes. It also simplifies switch configuration as it avoids the need for link aggregation protocols like LACP. This setup is suitable for a host with many small VMs where maximizing throughput isn't the primary concern, but redundancy is still desired.
@briefing: 
@eli5: 
@tags: 

<!-- a4q38 -->
### Q
An administrator has been alerted that the database VMs in the environment are not responsive. During the investigation, they discovered that the unresponsive VMs were migrated to different nodes in the cluster and have tasks in Prism Central named
"ADS: Remove resource contention."
What caused these VM migrations?
@answer: ADS detected that the host CPU was running > 85% for 10 minutes
@domain: vms
@context: Acropolis Data Services (ADS) likely triggered the migrations and the "ADS: Remove resource contention" tasks. ADS automatically migrates VMs to redistribute resources and alleviate contention. While the specific resource causing the contention isn't explicitly stated in the task name, high memory or CPU utilization are common triggers. A common trigger for this is sustained high CPU utilization on a host, often above a threshold like 85% for a certain period (e.g., 10 minutes). While the provided search results don't explicitly state the 85% / 10 minute rule, they do confirm that ADS initiates migrations in response to resource contention, typically high CPU usage
@briefing: 
@eli5: 
@tags: 

<!-- a4q39 -->
### Q
A newly hired Nutanix administrator was tasked by the CIO to create a single VM on a test network. The network administrator stated that a native VLAN was used on the Cisco TOR switches with the following parameters:
- IP address: 172.16.1.2,
- Network Mask: 255.255.255.0,
- Gateway: 172.16.1.1,
- VLAN: 1.
The same parameters were used to create a network profile on Nutanix, but when the VM was created, it had no L3 connectivity. What should the administrator do to fix the issue?
@answer: Change VLAN field from VLAN 1 to VLAN 0
@domain: networking
@context: The network administrator confirmed a native VLAN is in use on the Cisco top-of-rack (TOR) switches. Native VLANs on Cisco switches are untagged. While the network profile on Nutanix was created with VLAN 1, it should be set to VLAN 0 to match the native VLAN configuration on the physical switches. This allows the VM's traffic to be treated as native VLAN traffic and ensures L3 connectivity.1
@briefing: 
@eli5: 
@tags: 

<!-- a4q40 -->
### Q
Refer Exhibit: Why has an anomaly been triggered?
@answer: Observed values do not match predicted values
@domain: monitoring
@context: Nutanix detects anomalies by comparing actual metrics to expected patterns.
@briefing: 
@eli5: 
@tags: 

<!-- a4q41 -->
### Q
An administrator needs to provide access for a user to view real-time performance metrics for all clusters across the data center.
Which method accomplishes this with the least effort and ongoing maintenance?
@answer: Configure a local account and assign the new user to the viewer role in PC
@domain: security
@context: Configuring a local account and assigning the new user to the viewer role in Prism Central (PC) is the most efficient approach. The viewer role grants access to real-time performance metrics for all clusters managed by PC, without granting unnecessary administrative privileges. This method minimizes configuration overhead and ongoing maintenance compared to other options like custom roles or individual cluster configurations.
@briefing: 
@eli5: 
@tags: 

<!-- a4q42 -->
### Q
An administrator was reviewing various AOS logs when it was noticed that the time of the logs were off by several hours.
Which initial step was missed during the post process cluster configuration?
@answer: Setting the cluster time zone via CVM nCLI
@domain: architecture
@context: The missing step is setting the cluster time zone via the CVM using the ncli command. After the cluster is deployed, an NTP server should be configured, and the time zone set using the following command: ncli cluster set-timezone timezone=
@briefing: 
@eli5: 
@tags: 

<!-- a4q43 -->
### Q
Refer Exhibit: A User is complaining about slowness of a mission-critical MSSQL server. The administrator logs into Prism Element to investigate the VM performance and observes what is shown in the diagram. Which action would best improve VM performance?
@answer: Ensure the HOSTs CPUs are not excessively overcommitted
@domain: vms
@context: Based on the exhibit, the MSSQL (Microsoft SQL Server) virtual machine (VM) shows high CPU usage, but low RAM and storage usage. This indicates the VM is CPU-constrained. Therefore, the best action to improve performance would be 4. Ensure the HOSTs CPUs are not excessively overcommitted. If the host's CPUs are overcommitted, other VMs on the same host are competing for CPU resources, impacting the MSSQL server's performance.
@briefing: 
@eli5: 
@tags: 

<!-- a4q44 -->
### Q
What does Nutanix recommend when setting up the node networking?
@answer: Include at least two physical interfaces in every bond
@domain: networking
@context: Nutanix recommends adhering to their networking best practices when setting up node networking. It is recommended to have two stand-alone trunk ports from the switch to the Nutanix nodes. For the hypervisor/Controller Virtual Machine (CVM) network connections, connect a cable from each node’s data network Network Interface Cards (NICs) to the provided switch ports. Nutanix recommends a minimum of two 10G connections for this.
@briefing: 
@eli5: 
@tags: 

<!-- a4q45 -->
### Q
An administrator needs to increase bandwidth available to the AHV host and to the CVM. How should the administrator complete this task?
@answer: In Prism, update VS0 to change the configuration to Active-Active
@domain: networking
@context: In Nutanix AHV networking, the Controller VM (CVM) and the AHV host communicate through a default bridge called br0. In current versions of AOS, this bridge is managed by a logical entity in Prism called a Virtual Switch (vs0). By default, Nutanix uses an Active-Backup bond mode, where only one physical interface is active at a time for a given flow, limiting the total throughput to the speed of a single NIC. To increase available bandwidth and allow the host/CVM to use multiple uplinks at once, the administrator must change the bond mode to Active-Active (specifically balance-tcp with LACP) . Performing this change through the Prism UI ensures the configuration is applied consistently across all nodes in the cluster and persists through reboots and upgrades
@briefing: 
@eli5: 
@tags: 

<!-- a4q46 -->
### Q
Which component can be associated with a storage policy?
@answer: Category
@domain: storage
@context: A category can be associated with a storage policy. Categories are used to group similar entities, and a storage policy applied to a category affects all entities within that category.
@briefing: 
@eli5: 
@tags: 

<!-- a4q47 -->
### Q
On a Nutanix Cluster, what does Network Segmentation refer to?
@answer: Isolating management traffic from storage replication traffic
@domain: networking
@context: On a Nutanix cluster, Network Segmentation (NS) allows you to isolate network traffic for different purposes, such as management, data, and virtual storage area network (VSAN). This is achieved by using separate virtual local area networks (VLANs) and IP addresses for each function. This enhances security by containing data traffic within a specific network, preventing unauthorized access from outside.
@briefing: 
@eli5: 
@tags: 

<!-- a4q48 -->
### Q
An administrator manages a cluster and notices several failed components shown in the exhibit. What two options does the administrator have to run all NCC checks manually? (Choose Two)
@answer: Running ncc health_checks run_all on the CVM | Using the action drop-down menu in the health dashboard of PE
@domain: monitoring
@context: Running ncc health_checks run_all on a Controller VM (CVM) initiates all NCC checks. Alternatively, using the action drop-down menu in the health dashboard of Prism Element (PE) allows running NCC checks through the UI.
@briefing: 
@eli5: 
@tags: 

<!-- a4q49 -->
### Q
An administrator receives complaints of poor performance in a particular VM. Based on the VM performance metrics, what is the most likely cause of this behavior?
@answer: The host CPU is severely overloaded
@domain: performance
@context: The most likely cause is high CPU utilization on the host. If the host's CPU is severely overloaded, the VMs running on that host will contend for CPU resources, leading to performance degradation within the affected VM. While other factors like insufficient vCPUs, limited storage IOPS, or a full oplog can contribute to performance issues, they are less likely to be the primary cause if the host's CPU is consistently overloaded. Therefore, the administrator should investigate the host's CPU utilization first and foremost to determine the root cause of the VM's poor performance.
@briefing: 
@eli5: 
@tags: 

<!-- a4q50 -->
### Q
Which baseline is used to identify a zombie VM?
@answer: Fewer than 30 IOPS and less than 1000 bytes per day of network traffic for the past 21 days
@domain: performance
@context: Fewer than 30 IOPS and less than 1000 bytes per day of network traffic for the past 21 days. This signifies minimal activity, aligning with the characteristics of a zombie VM.
@briefing: 
@eli5: 
@tags: 

<!-- a5q1 -->
### Q
Which two permission assignment tasks can be accomplished via Prism Element? (Choose two.)
@answer: Grant a user to view details of all VMs on a specific cluster | Grant an Active Directory group permission to perform backup operations
@domain: security
@context: A user can be granted permission to view details of all virtual machines (VMs) on a specific cluster through Prism Element (PE). It is also possible to assign the Backup admin role to an Active Directory group through PE
@briefing: 
@eli5: 
@tags: 

<!-- a5q2 -->
### Q
After logging into Prism Element, an administrator presses the letter A on the keyboard. What is the expected outcome of this input?
@answer: Alerts page will launch.
@domain: monitoring
@context: The keyboard shortcut "A" opens the Alerts list in Prism Element.
@briefing: 
@eli5: 
@tags: 

<!-- a5q3 -->
### Q
An administrator is concerned about the amount of data that a VM is reading and writing to the storage fabric. Which metric will provide that data?
@answer: VM Storage Controller Bandwidth
@domain: performance
@context: VM storage controller Bandwidth is the metric that provides data on the amount of data a VM is reading and writing to the storage fabric. It measures the total data transfer rate for a VM's storage controller. This metric gives insight into the volume of data the VM is exchanging with the storage. While VM storage controller IOPS measures the number of input/output operations per second, it doesn't reflect the actual data volume being transferred. Host-level metrics like Host Disk IOPS and Host Hypervisor IO bandwidth aren't granular enough to isolate a specific VM's data transfer activity.1
@briefing: 
@eli5: 
@tags: 

<!-- a5q4 -->
### Q
An administrator has received reports of users being disconnected from remote desktop sessions to a specific VM. Which VM metric is most useful for isolating the cause of the issue?
@answer: Virtual NIC receive packets dropped.
@domain: networking
@context: The most useful VM metric for isolating the cause of users being disconnected from remote desktop sessions is "Virtual NIC receive packets dropped." Packet drops on the virtual NIC can cause network disconnections, and specifically, packet loss can lead to RDP (Remote Desktop Protocol) session drops.
@briefing: 
@eli5: 
@tags: 

<!-- a5q5 -->
### Q
An administrator is adding a new node to a cluster. The node has been imaged to the same versions of AHV and AOS that the cluster is running, configured with appropriate IP addresses, and bonding has been configured the same as the existing uplink bonds. When attempting to add the node to the cluster with the Expand Cluster function in Prism, the cluster is unable to find the new node. Based on the above output from the new node, what is most likely the cause of this issue?
@answer: The existing cluster and the expansion node are on different VLANs.
@domain: networking
@context: If the cluster and the new node are on different VLANs, they will not be able to communicate with each other, preventing the cluster from discovering the new node during the expansion process. Since the node has already been imaged and configured with the correct IP addresses and bonding, and LACP configuration on the upstream switch is not relevant for node discovery within the same network, VLAN mismatch is the most probable cause. LKP is not relevant during the expansion process.
@briefing: 
@eli5: 
@tags: 

<!-- a5q6 -->
### Q
An administrator is trying to implement the solution that is shown in the exhibit but has been unsuccessful. Based on the diagram, what is causing the issue?
@answer: Network latency
@domain: data-protection
@context: Network latency between the two sites is the most likely cause of the issue. Stretched clusters require low latency between sites for proper function. High latency can impact synchronization and failover, leading to the setup failing.
@briefing: 
@eli5: 
@tags: 

<!-- a5q7 -->
### Q
The administrator recently had a node fail in an AHV Nutanix cluster. All of the VMs restarted on other nodes in the cluster, but they discovered that the VMs that make up a SQL Cluster were running on the failed host. The administrator has been asked to take measures to prevent a SQL outage in the future.
What affinity option will prevent the SQL VMs from running on the same host?
@answer: VM-VM anti-affinity policy
@domain: vms
@context: To prevent all the virtual machines (VMs) that make up the SQL cluster from running on the same host and avoid a future SQL outage, the administrator should implement a VM-VM anti-affinity policy. This policy ensures that specified VMs do not run on the same host. If one host fails, the other VMs in the SQL cluster will be running on different hosts and remain available.
@briefing: 
@eli5: 
@tags: 

<!-- a5q8 -->
### Q
The Update Source for LCM has been configured as shown in the exhibit, but the inventory is failing consistently. What is the likely cause of this issue?
@answer: Port 443 is blocked by a firewall.
@domain: lifecycle
@context: As it is clearly shown that Enable HTTPS is checked, which means that communication will go through port 443 (i.e. default HTTPS port). Port 443 is required for LCM to communicate with the update source. If it is blocked by a firewall, the inventory will fail. Examine firewall rules to ensure that outbound HTTPS traffic on port 443 is allowed from the cluster to the configured update source.12
@briefing: 
@eli5: 
@tags: 

<!-- a5q9 -->
### Q
Which inefficient VM profile can be used to identify a VM that consumes too many resources and causes other VMs to starve?
@answer: Bully VM
@domain: performance
@context: A Bully VM is an inefficient VM profile. It's used to identify a VM that consumes an excessive amount of resources, which causes other VMs to starve or experience performance degradation. A bully VM typically exhibits high CPU ready time, high memory swap rate, and high host I/O Stargate CPU usage for an extended period, usually over an hour. Identifying bully VMs helps determine if any VMs are malfunctioning or require additional resources.
@briefing: 
@eli5: 
@tags: 

<!-- a5q10 -->
### Q
What is the recommended approach for a constrained VM?
@answer: Increase the VM resources.
@domain: performance
@context: A constrained VM doesn't have enough resources to meet demand, which can cause performance issues. The recommended approach is to increase the VM's resources (CPU, memory, storage) to alleviate the constraint.
@briefing: 
@eli5: 
@tags: 

<!-- a5q11 -->
### Q
What is a requirement to enable Flow Networking?
@answer: Microservices Infrastructure (CMSP) is enabled.
@domain: networking
@context: Microservices Infrastructure (CMSP) being enabled is a requirement for Flow Networking. Flow Networking leverages the container orchestration capabilities of CMSP.
@briefing: 
@eli5: 
@tags: 

<!-- a5q12 -->
### Q
During an AHV upgrade, an administrator finds that a critical VM was powered off rather than migrating to another host. Which scenario explains this behavior?
@answer: The VM was marked as an agent VM.
@domain: vms
@context: Agent VMs do not migrate and may be powered off instead.
@briefing: 
@eli5: 
@tags: 

<!-- a5q13 -->
### Q
An administrator is tasked with configuring networking on an AHV cluster and needs to optimize for maximum single VM throughput. Which bond mode should the administrator select?
@answer: Active-Active
@domain: networking
@context: Active-Active bonding. This leverages all available physical links for network traffic, maximizing the potential throughput for a single VM. While other options like Active-Backup provide redundancy, they limit throughput by using only one link at a time. Active-Active with MAC pinning can improve load balancing but may not maximize single VM throughput due to traffic distribution across multiple destinations.
@briefing: 
@eli5: 
@tags: 

<!-- a5q14 -->
### Q
When configuring a syslog server in Prism Central, what two pieces are required? (Choose two)
@answer: Transport Protocol | IP address/port
@domain: monitoring
@context: The IP address/port and Transport Protocol are required when configuring a syslog server in Prism Central. The IP address/port specifies the location (IP address) and communication port of the syslog server. The Transport Protocol defines how the logs are transmitted, typically using either TCP or UDP.
@briefing: 
@eli5: 
@tags: 

<!-- a5q15 -->
### Q
Which Nutanix feature provides effective caching optimization in VDI environments?
@answer: Shadow Clones
@domain: storage
@context: Nutanix Shadow Clones provide effective caching optimization, especially in VDI environments. They enable distributed caching of virtual disks across the Nutanix cluster. When multiple virtual desktops access the same data, Shadow Clones create local read-only copies of the data on each CVM, reducing read latency and improving performance. This is particularly beneficial in VDI deployments with multiple users accessing the same base image. This feature helps decrease read latency in any scenario with distributed multi-reader access.
@briefing: 
@eli5: 
@tags: 

<!-- a5q16 -->
### Q
Which component is supported by Prism Central storage policies?
@answer: Volume Groups
@domain: storage
@context: Prism Central storage policies support Volume Groups (VGs). They allow you to manage storage attributes like replication factor, encryption, compression, and Quality of Service (QoS) for VGs. A single storage policy can manage the attributes of several entities (like VMs and VGs) that are associated with various categories. You can apply storage policies to VGs on AHV and ESX.
@briefing: 
@eli5: 
@tags: 

<!-- a5q17 -->
### Q
After configuring modules for a Remote Syslog Server, the settings are as shown. The administrator notices that even though the level parameter is set to EMERGENCY, all monitor logs are being sent. What is the likely cause of this issue?
@answer: The true setting for Include Monitor Logs sends all monitor logs regardless of the level.
@domain: monitoring
@context: The issue you are encountering is due to the include-monitor-logs=true parameter. When this parameter is set to "true", all monitor logs are sent to the remote syslog server, regardless of the level setting (e.g., EMERGENCY). This is expected behavior. If you want to filter monitor logs based on level, you need to set include-monitor-logs=false.
@briefing: 
@eli5: 
@tags: 

<!-- a5q18 -->
### Q
An administrator is creating a Windows 10 VM that will be used for a virtual desktop template. After creating the VM and booting to the ISO, the administrator is unable to install Windows and receives the error:
"Couldn't find any drives. To get a storage driver, click Load Driver."
What steps does the administrator need to take to install the OS?
@answer: Load the virtio SCSI passthrough driver.
@domain: vms
@context: The administrator needs to load the VirtIO SCSI pass-through controller driver. When installing Windows on a Nutanix AHV cluster, the Windows installer needs this driver to recognize the virtual SCSI storage provided by AHV. Without it, the installer won't be able to find any drives to install Windows on, resulting in the error "Couldn't find any drives. To get a storage driver, click Load Driver." Loading the VirtIO network ethernet adapter, the Nutanix VirtIO Serial BUS driver, or the Nutanix VirtIO Balloon Driver won't resolve this issue because they are related to network, other devices, and memory management,
@briefing: 
@eli5: 
@tags: 

<!-- a5q19 -->
### Q
An administrator would like to leverage the Reliable Event Logging Protocol (RELP) with their Remote Syslog Server. After completing the configuration, it is observed that RELP logging is not working as expected. What is the likely cause of this issue?
@answer: The remote server does not have rsyslog-relp installed.
@domain: monitoring
@context: The likely cause of the Reliable Event Logging Protocol (RELP) not working is that the remote server does not have rsyslog-relp installed. As mentioned in the documentation, "To use RELP logging, ensure that you have installed rsyslog-relp on the remote syslog server." This indicates that the rsyslog-relp package is a requirement on the remote server, not the Nutanix cluster.
@briefing: 
@eli5: 
@tags: 

<!-- a5q20 -->
### Q
When is an IP address assigned to a VM connected to a Nutanix-managed network?
@answer: When the guest OS receives a DHCP acknowledge
@domain: networking
@context: When a VM connects to a Nutanix-managed network, the IP address is assigned when the guest OS receives a DHCP acknowledgment. The VM's vNIC sends a DHCP request to the network's DHCP server, and upon receiving an acknowledgment, the IP address, along with other network configuration parameters, is assigned to the VM.
@briefing: 
@eli5: 
@tags: 

<!-- a5q21 -->
### Q
Refer Exhibit: An administrator is attempting to create an additional virtual switch on a newly deployed AHV cluster, using the two currently disconnected interfaces. The administrator is unable to select the interfaces when creating the virtual switch. What is the likely cause of this issue?
@answer: The disconnected interfaces are currently assigned to virtual switch 0.
@domain: networking
@context: AHV creates a default virtual switch (vs0) during installation or upgrade. All default bridges (br0) on the nodes in the cluster are mapped to vs0. Additional interfaces, even if disconnected, might already be part of this default virtual switch, preventing them from being assigned to a new virtual switch. It's also worth noting that the default virtual switch cannot be deleted (though this may have changed in later versions). There are known issues with virtual switch configuration, so it's important to proceed cautiously.
@briefing: 
@eli5: 
@tags: 

<!-- a5q22 -->
### Q
An administrator needs to periodically send information about cluster efficiency via email to a set of users. What should be configured to accomplish this task?
@answer: Add a schedule to Prism Central reports.
@domain: monitoring
@context: To configure Prism Central to periodically send information about cluster efficiency via email, you should add a schedule to the reports. You can customize the report to include specific cluster efficiency metrics and choose the recipients for the emails.
@briefing: 
@eli5: 
@tags: 

<!-- a5q23 -->
### Q
An administrator wants to ensure that data in a container is stored in the most space-efficient manner as quickly as possible after being written.
@answer: Inline Compression
@domain: storage
@context: Inline Compression compresses data as it's written. For large or sequential write operations (greater than 64 KB), data bypasses the OpLog and is compressed and written to the extent store. Smaller, random write operations (larger than 4 KB) are compressed and written to the OpLog. When this data is drained from the OpLog, it is decompressed, aligned in 32 KB blocks, and then written to the extent store. This method increases the effective capacity of both the vDisk OpLog and the cluster's hot tier. Almost all workloads are suitable for inline compression except for data that is already encrypted or compressed within the OS or application (like images, audio, and video files).
@briefing: 
@eli5: 
@tags: 

<!-- a5q24 -->
### Q
An administrator is preparing to deploy a new application on an AHV cluster. Security requirements dictate that all virtual servers supporting this application must be prevented from communicating with unauthorized hosts.
@answer: Create a new Application Security Policy restricting communication to the authorized hosts and apply it to the servers in enforce mode.
@domain: security
@context: To prevent virtual servers supporting the new application from communicating with unauthorized hosts on your AHV cluster, you should create a new Application Security Policy. Within this policy, specify the allowed communication partners for these virtual servers. Then, apply the policy to the servers in enforce mode. This approach offers granular control over communication and effectively restricts the virtual servers to interacting only with authorized hosts.
@briefing: 
@eli5: 
@tags: 

<!-- a5q25 -->
### Q
Refer Exhibit:
An administrator needs to update some images that were previously uploaded to their Nutanix cluster. While logged into Prism Element, when trying to update the images, the update icon is not enabled.
What could be the cause for this behavior?
@answer: Images were imported into Prism Central.
@domain: vms
@context: When a Nutanix cluster is registered to Prism Central, certain management functions—including the Image Service—can be offloaded to Prism Central for global catalog management. If images were imported into or are managed by Prism Central, they may appear as read-only or have restricted actions (like updating or deleting) within the local Prism Element interface
@briefing: 
@eli5: 
@tags: 

<!-- a5q26 -->
### Q
An administrator wants to expand the Failure Domain level of a cluster. What two options are available? (Choose two.)
@answer: Node | Block
@domain: architecture
@context: An administrator wanting to expand the Failure Domain level of a cluster has two options: Node and Block. Nutanix clusters support failure domains at these two levels. The other options presented, Data Center and Rack, are not supported as Failure Domain levels in Nutanix.
@briefing: 
@eli5: 
@tags: 

<!-- a5q27 -->
### Q
Which scenario would benefit most from Erasure Coding being enabled on a container?
@answer: Long-term storage of data which is written once and read infrequently
@domain: storage
@context: Erasure Coding (EC) offers significant space savings by reducing storage overhead, but it comes at the cost of performance. EC is most beneficial when enabled on containers storing write-cold data, meaning data written once and read infrequently. the scenario that would benefit most from enabling EC is long-term storage of data which is written once and read infrequently. In such cases, the reduced storage consumption outweighs the performance trade-off, as the data is not accessed regularly.
@briefing: 
@eli5: 
@tags: 

<!-- a5q28 -->
### Q
Upon logging into Prism Central, an administrator notices high cluster latency. How can the administrator analyze data with the least number of steps or actions?
@answer: Click the cluster name in the cluster quick access widget
@domain: monitoring
@context: Clicking the cluster name in the cluster quick access widget on the Prism Central main dashboard is the fastest way to investigate high cluster latency. This widget displays the average total (read and write) I/O latency for clusters experiencing the highest latency and provides a direct link to the cluster's summary page for more detailed performance analysis.
@briefing: 
@eli5: 
@tags: 

<!-- a5q29 -->
### Q
Why can't the Remove Host option be seen when trying to replace an old node in a 3-node cluster?
@answer: It is not possible to remove a node from a 3-node cluster
@domain: architecture
@context: In a 3-node Nutanix cluster, removing a node isn't directly possible through the Remove Host option. This is because a 3-node cluster represents the minimum configuration for maintaining redundancy and fault tolerance. Removing a node would violate this fundamental principle. The standard process for replacing a node involves adding the new node to the existing 3-node cluster first. Once the new node is integrated and the cluster is healthy with 4 nodes, the old node can then be safely removed, preserving the necessary redundancy.
@briefing: 
@eli5: 
@tags: 

<!-- a5q30 -->
### Q
Can an administrator enable block awareness and FT2 on a Nutanix AHV cluster with four blocks and one node per block?
@answer: No - FT2 requires a minimum of five nodes
@domain: architecture
@context: No. While block awareness can be enabled with four blocks, FT2 requires a minimum of five nodes. The current configuration has only four nodes (one per block), which is insufficient for FT2. FT2 tolerates the failure of two nodes, and therefore requires at least five nodes to function correctly.
@briefing: 
@eli5: 
@tags: 

<!-- a5q31 -->
### Q
How can an administrator provide a user access to real-time VM performance metrics across all clusters?
@answer: Configure a local account and assign Viewer role in Prism Central
@domain: security
@context: To provide a user with access to real-time VM performance metrics across all clusters, the administrator should configure a local account and assign the "Viewer" role to that user in Prism Central. This approach grants the necessary read-only access to the required metrics with minimal administrative overhead and ongoing maintenance.
@briefing: 
@eli5: 
@tags: 

<!-- a5q32 -->
### Q
An administrator disconnects LAN interfaces from an AHV cluster node during validation testing. When the first interface is disconnected, guest VMs lose connectivity. What is the cause?
@answer: Switch ports are configured with different VLANs.
@domain: networking
@context: The most likely cause is a misconfiguration of VLANs on the switch ports connected to the AHV cluster node's network interfaces. When the administrator disconnects the first interface, the guest virtual machines (VMs) lose connectivity because the second interface is on a different VLAN. Traffic isn't properly routed between the two, leading to the disruption. When the second interface is disconnected, pings continue to both the hypervisor and guest VMs because they are likely now on the same VLAN and network. This is further supported by the fact that pings resume when the first interface is reconnected.
@briefing: 
@eli5: 
@tags: 

<!-- a5q33 -->
### Q
How should an administrator increase bandwidth to AHV hosts and CVMs?
@answer: In Prism, update vs0 to change the configuration to Active-Active.
@domain: networking
@context: In Nutanix AHV networking, the Controller VM (CVM) and the AHV host communicate through a default bridge called br0. In current versions of AOS, this bridge is managed by a logical entity in Prism called a Virtual Switch (vs0). By default, Nutanix uses an Active-Backup bond mode, where only one physical interface is active at a time for a given flow, limiting the total throughput to the speed of a single NIC. To increase available bandwidth and allow the host/CVM to use multiple uplinks at once, the administrator must change the bond mode to Active-Active (specifically balance-tcp with LACP) . Performing this change through the Prism UI ensures the configuration is applied consistently across all nodes in the cluster and persists through reboots and upgrades
@briefing: 
@eli5: 
@tags: 

<!-- a5q34 -->
### Q
An administrator is trying to create a custom alert policy for all VMs. Why is the "Alert Warning If" field greyed out?
@answer: The "Behavioral Anomaly" threshold is set.
@domain: monitoring
@context: The "Alert Warning If" field being grayed out is likely due to the "Behavioral Anomaly" threshold being set. When behavioral anomaly detection is enabled for a policy, the system automatically manages certain thresholds, which disables the manual setting of warning thresholds. This is mentioned in the search result titled "1 (1)" within the spreadsheet.
@briefing: 
@eli5: 
@tags: 

<!-- a5q35 -->
### Q
An administrator is setting up a Nutanix cluster for a mission-critical workload. All VMs must continue running in case of hardware failure. What should be enabled?
@answer: Enable HA Reservation in Prism Element
@domain: architecture
@context: Enabling HA Reservation in Prism Element is the correct action. HA Reservation ensures that sufficient resources are reserved in the cluster to restart VMs in case of a host failure. This guarantees the high availability of mission-critical workloads even during hardware failures. While other factors contribute to overall resilience, HA Reservation directly addresses the requirement for VMs to continue running despite hardware problems.
@briefing: 
@eli5: 
@tags: 

<!-- a5q36 -->
### Q
Refer to the exhibit: Which virtual network technology does Nutanix AHV use?
@answer: OVS
@domain: networking
@context: Nutanix AHV uses Open vSwitch (OVS). OVS is an open-source virtual switch that provides a high-performance, scalable networking solution for AHV. It manages the network traffic between virtual machines (VMs) and the physical network.
@briefing: 
@eli5: 
@tags: 

<!-- a5q37 -->
### Q
To minimize delays in LCM updates, what should an administrator do before starting?
@answer: Disable any VM affinity rules
@domain: vms
@context: To minimize delays during LCM updates, disable any VM affinity rules. This prevents delays caused by VM migrations that might be triggered by the update process.
@briefing: 
@eli5: 
@tags: 

<!-- a5q38 -->
### Q
Refer Exhibit: An Administrator needs to enable inline deduplication for a pre-existing storage container. When trying to enable deduplication on the storage container, this feature is greyed OUT. What is the reason for this behaviour.
@answer: Replication Factor 1 is configured
@domain: storage
@context: There are several reasons why the inline deduplication option might be grayed out for a storage container: Replication Factor 1: Inline deduplication requires a Replication Factor of 2 or higher. If the storage container is configured with RF1, the deduplication option will be unavailable. Hybrid Storage: Inline deduplication is only supported on all-flash clusters. If the cluster uses hybrid storage (a combination of flash and spinning disks), inline deduplication cannot be enabled. Datastore Type (Objects): Inline deduplication may be enabled by default for Objects storage, where it cannot be disabled from the standard UI. Note that disabling Erasure Coding (EC) will not automatically disable inline deduplication. While ncli or the REST API might allow you to disable EC or inline deduplication, the UI and standard workflow is to decommission/clean up Objects if it is not required, as this will remove the corresponding storage container and its inherent inline deduplication settings.
@briefing: 
@eli5: 
@tags: 

<!-- a5q39 -->
### Q
What is the most likely cause of an AD user being unable to log in to Prism Central?
@answer: Change password at next logon attribute is set
@domain: security
@context: The most likely cause is the "Change password at next logon" attribute being set for the AD user. While other issues such as incorrect role mapping or the user not belonging to the appropriate group could prevent access, a user being required to change their password on next login is a very common reason for login failures, especially for newly created accounts. If the user can log in to other AD resources, this further isolates the issue to the password reset requirement.
@briefing: 
@eli5: 
@tags: 
