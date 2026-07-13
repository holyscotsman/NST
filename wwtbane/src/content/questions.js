// questions.js — the playable NCP-MCI question bank.
// ASSEMBLED by scripts/import-questions.mjs (--merge): priority questions from an
// authored Markdown source are merged AHEAD of the existing bank. Content is
// human-authored; the runtime never uses AI to grade (CLAUDE.md §4) — the stored
// authored key is authoritative. Re-run the importer to regenerate.

export const QUESTIONS = [
  {
    "id": "ncp-mci-e1-q1",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator sees the alert shown in the exhibit. What should the administrator do to make sure the Nutanix user can no longer SSH to a CVM using a password?",
    "options": [
      "Rename the nutanix user.",
      "Block port 22 on the CVM firewall.",
      "Enable Cluster Lockdown.",
      "Delete the nutanix user."
    ],
    "answer": [
      2
    ],
    "explanation": "Enabling Cluster Lockdown ensures the nutanix user cannot SSH using a password.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, renaming does not prevent SSH access.",
      "Incorrect, blocks all SSH access but affects all users.",
      "Correct: prevents SSH access for the nutanix user using password.",
      "Incorrect: Not recommended; can cause system issues."
    ],
    "tags": [
      "cluster-lockdown",
      "ssh",
      "cvm",
      "alerts"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q1.png",
      "alt": "Prism alert detail: 'The cluster is using password based ssh access for the cvm 192.168.10.102.' Severity Info, impact type Configuration. Summary states password-based remote login is enabled and recommends key-based SSH instead. Recommendation: change the SSH security setting of the CVM."
    }
  },
  {
    "id": "ncp-mci-e1-q2",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "How many copies of the metadata are maintained within a Redundancy Factor 3 Nutanix cluster?",
    "options": [
      "2",
      "3",
      "5",
      "7"
    ],
    "answer": [
      2
    ],
    "explanation": "A Redundancy Factor 3 (RF3) cluster maintains five copies of the metadata. This ensures availability and consistency even if two nodes fail. While the data itself has three copies in RF3, the metadata has five to guarantee quorum and prevent split-brain scenarios.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, even insufficient for RF2 clusters.",
      "Incorrect, as RF3 requires more metadata copies, but 3 is number of copies for RF2.",
      "Correct: as RF3 maintains five metadata copies.",
      "Incorrect: not the default metadata copy count for RF3."
    ],
    "tags": [
      "redundancy-factor",
      "rf3",
      "metadata",
      "quorum"
    ]
  },
  {
    "id": "ncp-mci-e1-q3",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Which update in LCM can an administrator apply on a per-node basis?",
    "options": [
      "AOS",
      "BMC",
      "NCC",
      "AHV"
    ],
    "answer": [
      1
    ],
    "explanation": "Nutanix LCM allows firmware updates to be applied on a per-node basis. While software updates generally apply to the whole cluster, firmware updates like BIOS or BMC can be applied to individual nodes.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: AOS upgrades affect the entire cluster and require cluster-wide consistency.",
      "Correct: BMC firmware controls remote management and power cycling of individual nodes. Updating BMC does not impact the entire cluster and can be done per node.",
      "Incorrect: NCC updates apply across all nodes simultaneously, ensuring uniformity in checks.",
      "Incorrect: AHV updates require coordinated upgrades across hosts to maintain VM availability."
    ],
    "tags": [
      "lcm",
      "firmware",
      "bmc",
      "upgrades"
    ]
  },
  {
    "id": "ncp-mci-e1-q4",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "What is the default admin session log out time?",
    "options": [
      "5 minutes",
      "10 minutes",
      "15 minutes",
      "20 minutes"
    ],
    "answer": [
      2
    ],
    "explanation": "The default admin session timeout in Prism is 15 minutes. While the session timeout setting in the UI can be adjusted to longer durations, the IAM token and session cookie still expire after 15 minutes. The UI setting controls how long the UI attempts to keep the session alive by making API calls.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, Too short for default setting",
      "Incorrect, default setting is 15 min",
      "Correct: default session timeout",
      "Incorrect: Not the default setting"
    ],
    "tags": [
      "prism",
      "session-timeout",
      "iam"
    ]
  },
  {
    "id": "ncp-mci-e1-q5",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When configuring a physical network switch in Prism Element, what information is needed?",
    "options": [
      "DNS Configuration",
      "NTP Configuration",
      "SMTP Configuration",
      "SNMP Configuration"
    ],
    "answer": [
      3
    ],
    "explanation": "To configure a physical network switch in Prism Element, you'll need SNMP information for the switch, including the switch management IP address, SNMP version, security level, community name, authentication type, privacy type (if applicable), and privacy passphrase (if applicable).",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, Not required when adding a switch.",
      "Incorrect, Useful but not mandatory.",
      "Incorrect, Not relevant for switch configuration.",
      "Correct, Required for monitoring switch status and metrics."
    ],
    "tags": [
      "prism-element",
      "snmp",
      "switch"
    ]
  },
  {
    "id": "ncp-mci-e1-q6",
    "domain": "networking",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "After deploying a cluster, time is not synchronizing properly. What task needs to be performed on the cluster?",
    "options": [
      "DNS configuration",
      "NTP configuration",
      "HA configuration",
      "SMTP configuration"
    ],
    "answer": [
      1
    ],
    "explanation": "NTP (Network Time Protocol) configuration is necessary. After the cluster deployment, ensure that the NTP service is running and configured correctly on each CVM. The cluster should be configured to synchronize with at least three reliable NTP servers for redundancy and accuracy.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: DNS is unrelated to time synchronization.",
      "Correct: NTP is required to synchronize time across the cluster.",
      "Incorrect: HA does not affect time settings.",
      "Incorrect: SMTP is for email notifications, not time settings."
    ],
    "tags": [
      "ntp",
      "time-sync",
      "cluster-config"
    ]
  },
  {
    "id": "ncp-mci-e1-q7",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "In an RF2 Nutanix cluster, what is the minimum number of nodes required to allow a host removal?",
    "options": [
      "2",
      "3",
      "4",
      "5"
    ],
    "answer": [
      2
    ],
    "explanation": "Four nodes are required to remove a host from an RF2 Nutanix cluster. With RF2, two copies of the data exist, ensuring redundancy and fault tolerance. A four-node cluster ensures sufficient resources are available for data replication and availability during the host removal process.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, RF2 requires at least 3 nodes for redundancy.",
      "Incorrect, Removing a node from a 3-node cluster would break RF2.",
      "Correct: A 4-node cluster can sustain a single-node removal while maintaining RF2.",
      "Incorrect: RF2 does not require 5 nodes."
    ],
    "tags": [
      "rf2",
      "node-removal",
      "resiliency"
    ]
  },
  {
    "id": "ncp-mci-e1-q8",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator has been tasked with increasing security on a Nutanix cluster by disabling password authentication when accessing the CVM and AHV hosts and instead moving to key-based SSH. What is the easiest way for the administrator to meet these requirements?",
    "options": [
      "Configure LDAP authentication through a secure server.",
      "Enable STIG via command line on SSH to CVM.",
      "Enable Cluster Lockdown and provide an RSA key.",
      "Restrict access with User Management in Prism."
    ],
    "answer": [
      2
    ],
    "explanation": "To increase security on a Nutanix cluster by disabling password authentication for Controller Virtual Machine (CVM) and AHV hosts and moving to key-based SSH, enabling Cluster Lockdown and providing an RSA key is the recommended approach.1",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, LDAP does not affect SSH key authentication.",
      "Incorrect, STIG security compliance does not enforce SSH keys.",
      "Correct: Cluster Lockdown disables password access and enforces SSH key authentication.",
      "Incorrect: Prism user management does not enforce SSH key authentication."
    ],
    "tags": [
      "cluster-lockdown",
      "ssh",
      "rsa-key",
      "ahv"
    ]
  },
  {
    "id": "ncp-mci-e1-q9",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator needs to make sure that a VM is powered on before the rest of the VMs when starting a host. Which configuration option allows this behavior?",
    "options": [
      "Recovery Plan",
      "Host Affinity",
      "High Availability",
      "Agent VM"
    ],
    "answer": [
      3
    ],
    "explanation": "The configuration option that allows a VM to be powered on before other VMs when starting a host is to configure the VM as an agent VM. This setting ensures that the VM is prioritized during the host's startup sequence and is powered on before other standard VMs. Agent VMs are typically used for essential services, such as providing network functions, that need to be available before other VMs can function correctly.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, Recovery Plans are used for DR but do not control boot order during host startup.",
      "Incorrect, Host Affinity controls VM placement but not boot priority.",
      "Incorrect, High Availability ensures VMs restart after a failure but does not define boot order.",
      "Correct, Agent VMs, such as those for security or management, can be prioritized to start before others."
    ],
    "tags": [
      "agent-vm",
      "boot-order",
      "ahv"
    ]
  },
  {
    "id": "ncp-mci-e1-q10",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When expanding a Nutanix cluster, what is required to automatically discover new nodes?",
    "options": [
      "New nodes must have the same hypervisor version.",
      "IPv6 multicast must be allowed on physical switches.",
      "New nodes must have the same AOS version.",
      "IPv4 multicast must be allowed on physical switches."
    ],
    "answer": [
      1
    ],
    "explanation": "IPv6 multicast must be allowed on the physical switches for automatic node discovery during cluster expansion. The Controller Virtual Machine (CVM) initiates the process by sending IPv6 and IPv4 multicast packets on port 5353.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "IIncorrect: While important, it is not required for automatic discovery.",
      "Correct: Nutanix does require IPv6 multicast for node discovery.",
      "Incorrect: Required for compatibility but not for discovery.",
      "Incorrect: Nutanix does not uses IPv4 multicast for node discovery."
    ],
    "tags": [
      "cluster-expansion",
      "ipv6",
      "multicast",
      "discovery"
    ]
  },
  {
    "id": "ncp-mci-e1-q11",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator has been asked to calculate baseline Capacity Runway on a newly registered AHV cluster. The cluster has been up and running for 16 days, but no runway projections are displayed. Why are no Capacity Runway projections being displayed?",
    "options": [
      "Capacity Planning requires at least 30 days of data.",
      "Capacity Planning requires at least 21 days of data.",
      "Capacity Planning requires at least 3 months of data.",
      "Capacity Planning requires at least 6 months of data."
    ],
    "answer": [
      1
    ],
    "explanation": "Capacity Runway projections require at least 21 days of data from a newly registered AHV cluster. Since the cluster has only been running for 16 days, there is insufficient data for the projections to be displayed. Additionally, it takes approximately one day after cluster registration for data to begin appearing in Prism Central",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: 30 days is not the minimum requirement.",
      "Correct: at least 21 days of historical data is required for projections.",
      "Incorrect: projections can be generated before 3 months.",
      "Incorrect: projections can be generated well before 6 months."
    ],
    "tags": [
      "capacity-runway",
      "capacity-planning",
      "prism-central"
    ]
  },
  {
    "id": "ncp-mci-e1-q12",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is responsible for resource planning and needs to plan for resiliency of a 10-node RF3 Nutanix cluster. The cluster has 100TB of storage. How should the administrator plan for capacity in the event of future failures?",
    "options": [
      "Set Reserve Storage Capacity (%) to 20.",
      "Set Reserve Capacity for Failure to None.",
      "Set Reserve Capacity for Failure to Auto Detect.",
      "Set Reserve Memory Capacity (%) to 20."
    ],
    "answer": [
      2
    ],
    "explanation": "In an RF3 cluster, using \"Auto Detect\" ensures that failure reserves are calculated correctly.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect; does not account for RF3 failure requirements.",
      "Incorrect; this would leave no reserved space for failures.",
      "Correct: auto-detect ensures the cluster accounts for failures dynamically.",
      "Incorrect: Memory capacity does not impact storage resiliency."
    ],
    "tags": [
      "reserve-capacity",
      "capacity-planning",
      "rf3"
    ]
  },
  {
    "id": "ncp-mci-e1-q14",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator is working with a network team to design the network architecture for a Disaster Recovery (DR) failover. Because DNS is well-designed and implemented, DR will utilize a different subnet from production. To make the planning and execution easy to implement, the network team would like to utilize the same last octet in the IP address in DR. What is the best way to achieve this?",
    "options": [
      "Use a custom script to update the IP address after instantiation in DR.",
      "Set up IPAM so the address is dynamically assigned during DR.",
      "Manually log into VMs after the DR event and update the last octet.",
      "Utilize Recovery Plan Offset-based IP mapping."
    ],
    "answer": [
      3
    ],
    "explanation": "The best way to retain the same last octet in the IP address while using a different subnet during DR failover is to use static IP mapping within the Recovery Plan. While Nutanix often tries to retain the last octet automatically, it's not guaranteed without static mapping.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect; Works, but is not the best automated solution.",
      "Incorrect; Works, but requires an external system to manage addresses.",
      "Incorrect; Inefficient and not recommended for automation.",
      "Correct; allows automatic IP address adjustment during failover."
    ],
    "tags": [
      "recovery-plan",
      "ip-mapping",
      "dr",
      "subnet"
    ]
  },
  {
    "id": "ncp-mci-e1-q15",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A user created a report in the prism central Intelligent Operations Analysis Dashboard but forgot to download it. However, after logging back into Prism Central, the administrator finds that the report is no longer available. What is the most likely cause?",
    "options": [
      "A user with Cluster Viewer role deleted the report.",
      "The user-generated report was archived.",
      "Reports are automatically deleted after 24 hours.",
      "The report is stored in the cluster’s Prism Element."
    ],
    "answer": [
      2
    ],
    "explanation": "The most likely reason is that the report was automatically deleted after 24 hours. Reports generated in the Intelligent Operations dashboard are automatically purged after this time. To retain a report, you should download it (in PDF or CSV format) or save it as a report configuration for later use.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect; cluster Viewer cannot delete reports.",
      "Incorrect; reports are not archived automatically.",
      "Correct: temporary reports are deleted after 24 hours.",
      "Incorrect: reports are stored in Prism Central, not Prism Element."
    ],
    "tags": [
      "reports",
      "prism-central",
      "intelligent-operations"
    ]
  },
  {
    "id": "ncp-mci-e1-q16",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator receives complaints about VM performance. After reviewing the VM’s CPU Ready Time data shown in the exhibit, which step should the administrator take to diagnose the issue and identify root cause?",
    "options": [
      "Check the number of vCPUs assigned to each CVM.",
      "Review host CPU utilization.",
      "Assess cluster SSD capacity.",
      "Enable VM memory oversubscription."
    ],
    "answer": [
      1
    ],
    "explanation": "High CPU Ready Time suggests CPU overcommitment or host saturation. The administrator should check host CPU usage in Prism Central to determine if the cluster is overloaded. If host CPU usage is consistently above 85–90%, VMs are competing for CPU resources, leading to high CPU Ready Time.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: CVMs (Controller VMs) have fixed CPU allocation, and modifying their vCPU count is not recommended unless advised by Nutanix Support.",
      "Correct: high CPU Ready Time indicates host CPU contention.",
      "Incorrect: SSD capacity impacts storage performance (latency, read/write speeds) but does not affect CPU Ready Time.",
      "Incorrect: Memory oversubscription does not affect CPU contention."
    ],
    "tags": [
      "cpu-ready-time",
      "contention",
      "troubleshooting"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q16.png",
      "alt": "A VM CPU Ready Time chart in Prism Central showing many overlapping per-VM series (curie_test vmsmall / vmmedium / vmlarge) over a ten-minute window, with a hover tooltip listing individual VMs and readings of 18%, 18.8% and 21.5%."
    }
  },
  {
    "id": "ncp-mci-e1-q18",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "After upgrading Prism Central from PC2022.1 to PC2024.1, an administrator is unable to log in with their IAM active directory domain account. What is the first thing the administrator should do?",
    "options": [
      "Ping the Domain Controller from the CVM.",
      "Ensure port 9441 is open in the firewall.",
      "Validate the trusted signing certificate of the organization.",
      "Log in with a local admin account."
    ],
    "answer": [
      3
    ],
    "explanation": "Using a local admin account helps diagnose and fix IAM authentication failures.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, Checking network connectivity is useful but not the first step.",
      "Incorrect, Port 9441 is required for authentication, but other issues may exist.",
      "Incorrect, Certificate issues can prevent authentication but are not the first check.",
      "Correct: Logging in locally allows troubleshooting IAM issues."
    ],
    "tags": [
      "prism-central",
      "iam",
      "active-directory",
      "upgrade"
    ]
  },
  {
    "id": "ncp-mci-e1-q19",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Refer to the exhibit. The customer expects to maintain a cluster runway of 9 months. The customer doesn’t have a budget for 6 months, but they want to add new workloads to the existing cluster. Based on the exhibit, what is required to meet the customer's budgetary timeframe?",
    "options": [
      "Add resources to the cluster.",
      "Postpone the start of new workloads.",
      "Delete workloads running on the cluster",
      "Change the target to 9 months."
    ],
    "answer": [
      1
    ],
    "explanation": "The exhibit shows an Overall Runway of 59 days, which is significantly less than the customer's goal of 9 months. Since the customer has no budget for 6 months, they cannot purchase the additional hardware required to expand the cluster's capacity (\"Add resources\"). By postponing new workloads, the customer avoids overwhelming the existing resources until they reach the 6-month mark, at which point they can secure a budget to scale the cluster and accommodate the new growth while maintaining their 9-month runway target.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "This is incorrect because the customer explicitly has no budget for the next 6 months to purchase additional hardware.",
      "Correct: By delaying the addition of new workloads until the 6-month mark (when budget becomes available), the customer can keep the current cluster running within its existing limits and then expand the cluster when they have the funds to do so.",
      "Incorrect; While this would increase runway, it is usually a last-resort disruptive action and isn't specified as a preference here.",
      "Incorrect; This is a configuration setting in the tool to see what is needed, but it does not actually solve the capacity shortfall to meet the budget."
    ],
    "tags": [
      "capacity-runway",
      "capacity-planning",
      "prism-central"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q19.png",
      "alt": "Prism Central capacity runway 'New Scenario' view. Overall Runway 59 days, with CPU, Memory and Storage each also 59 days. Target is set to 6 months. An Existing cluster is selected and Capacity configuration is enabled."
    }
  },
  {
    "id": "ncp-mci-e1-q20",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A DR administrator has set up a Protection Policy for 50 workloads, all configured similarly in terms of OS, storage, network, and performance. The RPO is 60 minutes with a specified retention of 10 local copies, 5 remote copies, and crash consistency. After configuring the protection policy and activating it, the administrator has noticed that recovery points are not appearing at the DR site yet, everything within the Protection Policy looks correct and recovery points are not showing up on production side. What is the most likely issue?",
    "options": [
      "Nutanix Guest Tools (NGT) is not installed on the source VMs.",
      "Windows updates need to be applied to all affected VMs.",
      "The storage container name on the DR cluster does not match the production cluster.",
      "The storage container RF factor does not match in both clusters."
    ],
    "answer": [
      2
    ],
    "explanation": "The most likely reason why recovery points are visible on the production side but not at the DR site, despite a correctly configured Protection Policy, is that the storage container name on the DR cluster does not match the production cluster. If a storage container with the same name is not found on the destination cluster, the replicated data will be directed to the SelfServiceContainer. This can lead to recovery points not being readily available in the expected location on the DR site.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, NGT is needed for application-consistent snapshots but not for replication.",
      "Incorrect, OS updates do not impact Nutanix replication.",
      "Correct: If container names do not match, replication will fail.",
      "Incorrect: RF mismatch affects redundancy, not replication."
    ],
    "tags": [
      "protection-policy",
      "storage-container",
      "dr",
      "rpo"
    ]
  },
  {
    "id": "ncp-mci-e1-q21",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator needs to create 2 virtual machines: VM4 and VM5 that leverage the memory over-commit feature. Once VM4 is created and running, the administrator notices that it uses only 28GB of RAM. What will be the maximum RAM that can be allocated to VM5 so that it can be powered on?",
    "options": [
      "4GB",
      "8GB",
      "16GB",
      "32GB"
    ],
    "answer": [
      1
    ],
    "explanation": "Thehost has 128GB of physical RAM. Thecurrent memory allocationacrossthree VMs (VM1, VM2, VM3) is 128GB, but only92GB is actually utilized. This means there is36GB of unutilized memory available for allocation. VM5 can be allocated up to 8GB of RAM, considering overcommit and available resources the available ememory 36 - 28=8.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: remaining 8 GB.",
      "Correct: Unutilized memory 36 - 28 = 8 GB",
      "Incorrect: no available unutilized memory.",
      "Incorrect: no available unutilized memory."
    ],
    "tags": [
      "memory-overcommit",
      "ahv",
      "capacity"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q21.png",
      "alt": "Memory table for Host 1 (128 GB). VM1: 64 GB allocated, 48 GB utilized, 16 GB unutilized. VM2: 32 / 20 / 12. VM3: 32 / 24 / 8. Total: 128 GB allocated, 92 GB utilized, 36 GB unutilized."
    }
  },
  {
    "id": "ncp-mci-e1-q22",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "The team leads of a dev environment want to limit developer access to a specific set of VMs. What is the most efficient way to enable the team leads to directly manage these VMs?",
    "options": [
      "Create a role mapping for each team lead and assign appropriately.",
      "Create a VPC for each team lead and give them VPC Admin.",
      "Create a Project for each team lead and assign access.",
      "Create Security Policies to isolate users."
    ],
    "answer": [
      2
    ],
    "explanation": "Based on the search results, using projects and roles within Nutanix's access control system seems like the most direct approach for enabling team leads to manage specific VMs in a development environment.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, Role mappings control access but do not limit it to a specific set of VMs efficiently.",
      "Incorrect, VPCs are used for network segmentation, not access control for VMs.",
      "Correct: Projects allow fine-grained control over a specific set of VMs for designated users.",
      "Incorrect: Security policies define network access but do not manage VM access."
    ],
    "tags": [
      "projects",
      "rbac",
      "prism-central",
      "delegation"
    ]
  },
  {
    "id": "ncp-mci-e1-q23",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator using a dark site deployment for LCM is attempting to upgrade to the latest BIOS. After completing an inventory scan, the administrator does not see the expected BIOS version available for upgrade. What is the most likely reason the latest BIOS is not shown after inventory?",
    "options": [
      "AOS needs to be upgraded first.",
      "The latest compatibility bundle has not been uploaded.",
      "The BMC version needs to be upgraded first.",
      "The dark site webserver is not accessible."
    ],
    "answer": [
      1
    ],
    "explanation": "The most likely reason the latest BIOS version isn't shown in Life Cycle Manager (LCM) after an inventory scan in a dark site deployment is that the latest compatibility bundle has not been uploaded. LCM relies on the compatibility bundle to understand which updates are available. If the bundle isn't up-to-date, the latest BIOS versions won't be displayed for upgrade.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: AOS does not need to be upgraded first for a BIOS update.",
      "Correct: LCM relies on an offline compatibility bundle to detect and upgrade firmware.",
      "Incorrect: The BMC firmware does not always need updating before BIOS updates.",
      "Incorrect: In a dark site deployment, LCM does not rely on an internet connection, so webserver access is not required."
    ],
    "tags": [
      "lcm",
      "dark-site",
      "bios",
      "firmware"
    ]
  },
  {
    "id": "ncp-mci-e1-q24",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator needs to create a single chart showing multiple storage bandwidth metrics a VM is consuming. Which type of chart should the administrator create?",
    "options": [
      "Metric Chart",
      "Entity Chart",
      "Hypervisor Performance Chart",
      "VM Summary Chart"
    ],
    "answer": [
      1
    ],
    "explanation": "To create a single chart that shows multiple storage bandwidth metrics for a single virtual machine (VM), an administrator should create an Entity Chart. An Entity Chart is the appropriate choice because it is designed to display various performance metrics for a single selected entity, such as a specific VM. This allows an administrator to correlate different metrics, like read bandwidth, write bandwidth, and total bandwidth, for that one VM on a single graph. Resources",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Metric Charts create a chart that tracks a single metric for one or more entities",
      "Correct: Entity Charts create a chart that tracks one or more metrics for a single entity",
      "Incorrect, These focus on hypervisor-level performance, not VM storage bandwidth.",
      "Incorrect, These summarize VM details but do not focus on specific metrics."
    ],
    "tags": [
      "charts",
      "entity-chart",
      "prism-central"
    ]
  },
  {
    "id": "ncp-mci-e1-q25",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "What guest customization options are available when creating a VM template?",
    "options": [
      "Sysprep, Cloud-init",
      "Bash, Powershell",
      "Python, YAML",
      "Custom Script, Guided Script"
    ],
    "answer": [
      0
    ],
    "explanation": "Sysprep (for Windows), cloud-init (for Linux), custom scripts, and guided scripts are all guest customization options available when creating a VM template.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: These are standard guest customization options in Nutanix.",
      "Incorrect: These are scripting languages but not specifically guest customization options.",
      "Incorrect, These are used in automation but are not Nutanix guest customization options.",
      "Incorrect, Guest customization using Sysprep for windows, and Cloud-init for linux"
    ],
    "tags": [
      "vm-template",
      "sysprep",
      "cloud-init",
      "guest-customization"
    ]
  },
  {
    "id": "ncp-mci-e1-q26",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to make sure that VMs can be migrated and restarted on another node in the event of a single-host failure. What action should be taken in Prism Element to meet this requirement?",
    "options": [
      "Set Redundancy Factor to 3.",
      "Configure an RF1 storage container.",
      "Configure a Protection Domain.",
      "Enable HA Reservation."
    ],
    "answer": [
      3
    ],
    "explanation": "To ensure that VMs can be migrated and restarted on another node in the event of a single-host failure, enable High Availability (HA) in Prism Element. HA reserves a portion of cluster resources to restart VMs on surviving nodes if a host fails.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, RF3 increases data redundancy but does not ensure VM failover.",
      "Incorrect, RF1 has no redundancy, making it unsuitable.",
      "Incorrect, Protection Domains provide backup and recovery but do not ensure VM failover.",
      "Correct, HA Reservation ensures VMs can restart on another node in case of a failure."
    ],
    "tags": [
      "high-availability",
      "ha-reservation",
      "prism-element"
    ]
  },
  {
    "id": "ncp-mci-e1-q28",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to enable Windows Defender Credential Guard to comply with company policy. The new VM configurations include: • Legacy BIOS • 4 vCPUs • 8 GB RAM • Windows Server 2019 What must be changed in order to properly enable Windows Defender Credential Guard?",
    "options": [
      "Update Memory to 16GB.",
      "Use Windows Server 2022.",
      "Enable UEFI with Secure Boot.",
      "Update vCPU to 8."
    ],
    "answer": [
      2
    ],
    "explanation": "Windows Defender Credential Guard requires UEFI with Secure Boot enabled.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, More memory does not enable Credential Guard.",
      "Incorrect, Credential Guard is supported on Windows Server 2019 as well.",
      "Correct: Credential Guard requires UEFI with Secure Boot.",
      "Incorrect: More vCPUs do not affect Credential Guard."
    ],
    "tags": [
      "credential-guard",
      "uefi",
      "secure-boot",
      "windows"
    ]
  },
  {
    "id": "ncp-mci-e1-q29",
    "domain": "security",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator attempted to enable Data-in-Transit Encryption on a Scale-Out Prism Central cluster to encrypt service-level traffic between nodes. However, the feature did not work correctly due to a firewall restriction. Which CVM-specific port should be allowed through the firewall for Data-in-Transit Encryption?",
    "options": [
      "2009",
      "9440",
      "2010",
      "2020"
    ],
    "answer": [
      0
    ],
    "explanation": "The correct port to allow for Data-in-Transit Encryption on a Scale-Out Prism Central cluster is 2009. The Nutanix Security Guide v7.0 states that you should \"ensure that you allow port 2009, which is used for Data-in-Transit Encryption.\" This document also notes that Data-in-Transit Encryption encrypts service-level traffic between cluster nodes.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: port to allow for Data-in-Transit Encryption on a Scale-Out Prism Central cluster is 2009",
      "Incorrect: Used for Prism Central UI access.",
      "Incorrect, Not related to Data-in-Transit Encryption.",
      "Incorrect, Port 2009, not 2020, is used for data-in-transit encryption within a Nutanix cluster."
    ],
    "tags": [
      "data-in-transit-encryption",
      "ports",
      "firewall",
      "prism-central"
    ]
  },
  {
    "id": "ncp-mci-e1-q30",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "In a scale-out Prism Central deployment, what additional functionality does configuring an FQDN instead of a Virtual IP provide?",
    "options": [
      "Load balancing",
      "Resiliency",
      "Segmentation",
      "SSL Certificate"
    ],
    "answer": [
      0
    ],
    "explanation": "When using FQDN instead of a Virtual IP in a scale-out Prism Central deployment, Nutanix enables load balancing across multiple Prism Central instances.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: because it ensures that requests are distributed among multiple Prism Central nodes, improving performance and redundancy.",
      "Incorrect: because resiliency is achieved through HA and replication, not through FQDN configuration.",
      "Incorrect, because network segmentation is handled at the VLAN or security policy level.",
      "Incorrect, because SSL certificates can be applied regardless of whether FQDN or Virtual IP is used."
    ],
    "tags": [
      "prism-central",
      "fqdn",
      "scale-out",
      "load-balancing"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q30.png",
      "alt": "Prism Central 'Cluster Details' dialog. Text reads: Virtual IP and FQDN are used to access the PC VM Cluster. Fields for Cluster Name (Unnamed), FQDN, and Virtual IP, with a note that Virtual IP is relevant for a multi-VM Prism Central."
    }
  },
  {
    "id": "ncp-mci-e1-q31",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "How can a VM or Volume Group (VG) be associated with a Storage Policy?",
    "options": [
      "Assign the Storage Policy directly on the VM or VG.",
      "Assign the VM or VG directly to the Storage Policy.",
      "Migrate the VM or VG to the Storage Container assigned to the Storage Policy.",
      "Assign the VM or VG to the same Category as the Storage Policy."
    ],
    "answer": [
      3
    ],
    "explanation": "A VM or Volume Group (VG) can be associated with a Storage Policy using categories. Storage Policies are applied to VMs and VGs via categories using the Kanon service, which applies/fixes up policies every 30 minutes. A default Storage Policy can be selected during VM/VG creation",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect, as policies apply to categories.",
      "Incorrect, Storage Policies apply to categories, not directly to VMs/VGs.",
      "Incorrect, Not a valid method to apply a storage policy.",
      "Correct, Storage policies are applied at the category level."
    ],
    "tags": [
      "storage-policy",
      "categories",
      "volume-group"
    ]
  },
  {
    "id": "ncp-mci-e1-q32",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator is managing a 4-node Nutanix cluster, based on intermixed hardware as follows: • Two G5 Nodes # 2 CPUs (12 cores), 1 SSD (1.92 TB), 2 HDDs (4 TB). • Two G7 Nodes # 2 CPUs (16 cores), 2 SSDs (1.92 TB), 4 HDDs (4 TB). G5 Nodes are going out of support and need to be replaced, this cluster will be decommissioned from production and used for Disaster Recovery purposes with an RPO of 1 hour. What is the supported configuration when swapping G5 nodes without impacting performance?",
    "options": [
      "New node must have at least 2 SSDs.",
      "New node must be G7 or G8.",
      "New node must have 2 CPUs with 12 cores.",
      "New node must be hybrid."
    ],
    "answer": [
      0
    ],
    "explanation": "For optimal Disaster Recovery performance, new nodes must match or exceed the storage performance of existing nodes View sources",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: Since the G7 nodes have two SSDs, replacing G5 nodes with at least 2 SSDs ensures consistent SSD cache and performance.",
      "Incorrect: G7 or G8 nodes may help, but storage performance is more critical for DR.",
      "Incorrect, CPU core count does not impact DR storage performance as much as SSD capacity.",
      "Incorrect, Hybrid nodes are already in use, but SSDs must match for performance balance."
    ],
    "tags": [
      "intermixed-hardware",
      "cluster-expansion",
      "ssd"
    ]
  },
  {
    "id": "ncp-mci-e1-q33",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Due to application requirements, an administrator needs to modify an AHV VM to support a large number of distinct, concurrent network connections. The VM has below configuration: • 4 vCPUs • 20 GB RAM • OS: Microsoft Windows Server 2022 Which modification can improve network performance for network I/O-intensive applications running on this VM?",
    "options": [
      "Add more vCPUs",
      "Enable AHV Turbo Technology",
      "Enable RSS VirtIO-Net Multi-Queue",
      "Add more RAM"
    ],
    "answer": [
      2
    ],
    "explanation": "Enabling RSS VirtIO-Net Multi-Queue optimizes network performance by allowing multiple CPU cores to process network packets in parallel, reducing bottlenecks for network I/O-intensive workloads.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Adding more vCPUs can improve CPU-bound tasks but does not directly optimize network performance.",
      "Incorrect: AHV Turbo improves disk performance, not network performance.",
      "Correct: RSS (Receive Side Scaling) VirtIO-Net Multi-Queue enhances network performance by distributing network traffic across multiple vCPUs.",
      "Incorrect: Increasing RAM helps memory-intensive applications but does not improve network I/O."
    ],
    "tags": [
      "virtio",
      "multi-queue",
      "rss",
      "ahv"
    ]
  },
  {
    "id": "ncp-mci-e1-q34",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A consultant is configuring syslog monitoring and wants to receive CRITICAL logs from the Audit module. Which severity level setting should be configured to get the desired output?",
    "options": [
      "0",
      "2",
      "5",
      "7"
    ],
    "answer": [
      1
    ],
    "explanation": "The correct severity level to receive CRITICAL logs from the Audit module is 2. This corresponds to the Critical severity level in syslog. While other modules like SYSLOG_MODULE might require different configurations or log to different locations, for the Audit module itself, selecting level 2 will filter for Critical logs",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Represents emergency logs.",
      "Correct: Represents critical logs.",
      "Incorrect: Represents notice-level logs.",
      "Incorrect: Represents debug-level logs."
    ],
    "tags": [
      "syslog",
      "severity",
      "audit"
    ]
  },
  {
    "id": "ncp-mci-e1-q35",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is configuring Erasure Coding on a Redundancy Factor 2 Nutanix cluster. How many nodes, at a minimum, are necessary?",
    "options": [
      "3",
      "4",
      "5",
      "6"
    ],
    "answer": [
      1
    ],
    "explanation": "An administrator needs four nodes at a minimum to configure Erasure Coding on a Redundancy Factor 2 cluster. A six-node cluster with RF2 uses a stripe size of five, with four nodes for data and one for parity. The sixth node ensures availability for rebuild in case of node failure.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: RF2 requires a minimum of three nodes but does not support Erasure Coding.",
      "Correct: Erasure Coding requires at least four nodes but is not optimal but in the question ask about minimum so answer is 4.",
      "Incorrect: This is the optimal required for effective Erasure Coding.",
      "Incorrect: Larger clusters improve resilience, but the minimum is five."
    ],
    "tags": [
      "erasure-coding",
      "rf2",
      "node-count"
    ]
  },
  {
    "id": "ncp-mci-e1-q36",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator needs to perform an LCM upgrade on an AHV host with GPUs. What additional step is required for LCM to upgrade an AHV host that has CPUs?",
    "options": [
      "Create an agent VM on each host that has GPU drivers installed.",
      "Run LCM in dark site mode so it can update AHV independently.",
      "Use Direct Uploads to upload appropriate driver bundles.",
      "Update NCC to the latest version and re-run Inventory."
    ],
    "answer": [
      2
    ],
    "explanation": "Before initiating the LCM upgrade on an AHV host with GPUs, upload the relevant NVIDIA vGPU AHV host driver bundle to the \"Direct Uploads\" section within Nutanix LCM. This ensures the correct driver is available during the upgrade process.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Agent VMs are not required for GPU updates.",
      "Incorrect: Dark site mode is used when internet access is unavailable but does not affect GPU upgrades.",
      "Correct: LCM does not automatically fetch GPU drivers. The administrator must download and manually upload the appropriate firmware bundle before upgrading.",
      "Incorrect: Updating NCC is a best practice but does not resolve GPU driver issues."
    ],
    "tags": [
      "lcm",
      "gpu",
      "drivers",
      "direct-upload"
    ]
  },
  {
    "id": "ncp-mci-e1-q37",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator is looking at the memory cluster runway diagram, as shown in the exhibit. The environment is based on three hosts with the following configuration: • CPU: 2x Intel Xeon Gold (8 cores, 2.6 GHz) • RAM: 256 GB per host • Storage: SSDs and HDDs The Prism Central Intelligent Operations feature has been active for one month, but no further configurations were applied. What does the dotted red line mean?",
    "options": [
      "It is the default trend analysis static threshold that can be manually set.",
      "It is the maximum memory the administrator can assign to VMs.",
      "It is the calculated memory oversubscription limit for currently running VMs.",
      "It is the usable capacity based on cluster configuration options."
    ],
    "answer": [
      2
    ],
    "explanation": "The dotted red line in the Prism Central memory cluster runway diagram represents the calculated memory oversubscription limit for the currently running VMs. This dotted red line is not a static threshold.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Admins can manually configure thresholds, but this is not the meaning of the red line.",
      "Incorrect: Memory allocation limits are set based on available resources, not the red line.",
      "Correct: The dotted red line represents projected memory exhaustion based on trends.",
      "Incorrect: Usable capacity is shown differently in Prism."
    ],
    "tags": [
      "memory-runway",
      "oversubscription",
      "intelligent-operations"
    ],
    "image": {
      "src": "src/content/images/ncp-mci-e1-q37.png",
      "alt": "Memory cluster runway chart over 365 days. A dotted line labelled 'Effective Capacity (503.22 GiB)' slopes gently downward across the chart, above a solid blue consumption area that steps up sharply at 'TODAY'. Y-axis runs 0.00 GiB to 651.93 GiB."
    }
  },
  {
    "id": "ncp-mci-e1-q38",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to change a cluster from Redundancy Factor 2 to 3, but it is not allowed. What must the administrator check?",
    "options": [
      "Check that the cluster has been properly licensed.",
      "Check that the cluster has five or more nodes.",
      "Check hardware availability of the nodes.",
      "Check AOS version and upgrade, if needed."
    ],
    "answer": [
      1
    ],
    "explanation": "The administrator should check that the cluster has five or more nodes. A minimum of five nodes per cluster is required for Redundancy Factor 3 (RF3).",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Licensing does not affect RF settings.",
      "Correct: RF3 requires a minimum of five nodes.",
      "Incorrect: Hardware availability does not restrict RF changes.",
      "Incorrect: AOS version must support RF3, but the main factor is node count."
    ],
    "tags": [
      "redundancy-factor",
      "rf3",
      "node-count"
    ]
  },
  {
    "id": "ncp-mci-e1-q39",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Which storage container option reduces the available storage to other containers?",
    "options": [
      "Advertised Capacity",
      "Erasure Coding",
      "Capacity Deduplication",
      "Reserved Capacity"
    ],
    "answer": [
      3
    ],
    "explanation": "Reserving capacity for a storage container or setting an advertised capacity limits the available storage to other containers within the same storage pool. By default, all containers share the unused space in a pool. However, with reservations or advertised capacity, a specific amount of storage is allocated to a particular container and becomes unavailable for other containers to utilize.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: This sets a soft quota but does not reduce actual storage.",
      "Incorrect: Erasure coding optimizes storage but does not restrict other containers.",
      "Incorrect: Deduplication optimizes space but does not reserve storage.",
      "Correct: Ensures a fixed amount of storage is allocated, reducing availability for other containers."
    ],
    "tags": [
      "storage-container",
      "reserved-capacity",
      "advertised-capacity"
    ]
  },
  {
    "id": "ncp-mci-e1-q40",
    "domain": "monitoring",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants to collect log files that have been requested by Nutanix Support team. From which Prism Element dashboard can this be accomplished?",
    "options": [
      "Settings",
      "Alerts",
      "Health",
      "Analysis"
    ],
    "answer": [
      2
    ],
    "explanation": "An administrator can collect log files requested by Nutanix Support from the Prism Element dashboard by navigating to the Health page and selecting Actions → Collect Logs. This process utilizes the Logbay utility, which allows for flexible log collection and can be further customized from the command line interface (CLI). Within the Collect Logs section of the Prism Element dashboard, you can specify the nodes and tags for targeted log collection, define the duration of logs to collect, and select the destination for the collected logs.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Used for general system configurations, not log collection.",
      "Incorrect: Displays system alerts but does not collect logs.",
      "Correct: The Health dashboard provides an option to generate and download log bundles.",
      "Incorrect: Provides insights but does not collect logs."
    ],
    "tags": [
      "log-collection",
      "ncc",
      "support",
      "prism-element"
    ]
  },
  {
    "id": "ncp-mci-e1-q41",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator receives an alert: \"A node cannot enter maintenance mode.\" What could be the cause of this alert?",
    "options": [
      "Other nodes in the cluster may not have enough resources available.",
      "Another node in this cluster is already in maintenance mode.",
      "This node in the cluster is already in maintenance mode.",
      "This node in the cluster may not have enough resources available."
    ],
    "answer": [
      0
    ],
    "explanation": "The most likely cause for a node failing to enter maintenance mode is that the cluster is in a critical High Availability (HA) state. When HA is critical, it means there aren't enough resources available to restart VMs on other nodes if the node entering maintenance mode fails.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: Insufficient resources prevent nodes from entering maintenance mode.",
      "Incorrect: Clusters allow only one node at a time in maintenance mode, but this is not the cause of this alert.",
      "Incorrect: If a node was already in maintenance mode, this alert would not appear.",
      "Incorrect: Resource availability may affect VM migrations, but maintenance mode is restricted by existing maintenance sessions."
    ],
    "tags": [
      "maintenance-mode",
      "alerts",
      "resources"
    ]
  },
  {
    "id": "ncp-mci-e1-q42",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is conducting LCM updates in a Nutanix cluster and is being prompted for handling non-migratable VMs. Which VM type is non-migratable?",
    "options": [
      "VMs without NGT",
      "VMs marked as an Agent",
      "Memory Overcommitted",
      "VMs with attached Volume Groups"
    ],
    "answer": [
      1
    ],
    "explanation": "Agent VMs are indeed non-migratable. Other non-migratable VM types include those with CPU passthrough, GPU passthrough, PCI passthrough, and VMs with host affinity policies configured. During host maintenance, these VMs are typically shut down and powered back on after the maintenance is complete.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Nutanix Guest Tools (NGT) are used for guest-level integration but do not affect VM migratability.",
      "Correct: Agent VMs are system-critical and cannot be migrated.",
      "Incorrect: While memory overcommitment can affect performance, it does not make VMs non-migratable. Nutanix AHV handles memory allocation dynamically.",
      "Incorrect: as the iSCSI connections used by Volume Groups directed to the data services IP, so VMs with VG can be migrated seamlessly."
    ],
    "tags": [
      "agent-vm",
      "migration",
      "lcm",
      "maintenance-mode"
    ]
  },
  {
    "id": "ncp-mci-e1-q43",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When is deduplication recommended?",
    "options": [
      "Server workloads",
      "Linked Clone VMs",
      "Full clone VMs",
      "Cold data"
    ],
    "answer": [
      2
    ],
    "explanation": "Nutanix recommends enabling deduplication for full clone VMs, persistent desktops, and P2V. VDI workloads using full clones also benefit from deduplication. Server workloads, linked clone VMs, and VAAI clones generally see less benefit. It's not recommended for instant clones or data that is accessed infrequently (cold data).",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Deduplication is not highly beneficial for server workloads as they often have unique data.",
      "Incorrect: Linked clones share data blocks, making deduplication efficient.",
      "Correct: Full clones have identical data blocks, benefiting from deduplication.",
      "Incorrect: Deduplication is typically used for active data rather than cold storage."
    ],
    "tags": [
      "deduplication",
      "full-clone",
      "efficiency"
    ]
  },
  {
    "id": "ncp-mci-e1-q44",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Within Prism Central, which Compute and Storage section will allow an administrator to upload a Windows ISO file?",
    "options": [
      "Catalog Items",
      "Templates",
      "Images",
      "OVAs"
    ],
    "answer": [
      2
    ],
    "explanation": "The section within Prism Central where an administrator can upload a Windows ISO file is called \"Image Configuration,\" found under the \"Compute and Storage\" section. This area allows for uploading ISO files, which are then used for creating virtual machines. The process typically involves selecting \"Upload Image,\" filling in the required information (such as name and description), and choosing the source ISO file to upload.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: as this is used to manage preconfigured application templates.",
      "Incorrect: Used for VM templates, not for storing ISO files.",
      "Correct: as it allows uploading and managing ISO and disk images.",
      "Incorrect: as this pertains to importing virtual appliances, not ISO files."
    ],
    "tags": [
      "images",
      "iso",
      "prism-central"
    ]
  },
  {
    "id": "ncp-mci-e1-q45",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator needs to create a VM Template from an existing VM. What is required for this action to be successful?",
    "options": [
      "Sysprep or Cloud-init script.",
      "The VM is powered on.",
      "Windows OS is installed.",
      "The VM is powered off."
    ],
    "answer": [
      3
    ],
    "explanation": "To successfully create a VM template from an existing VM, the source VM must be powered off. Once powered off, you can initiate the template creation process. A template name and, optionally, a description are required when creating the template. You can customize the guest OS settings, and choose whether users can override these settings during VM deployments. Once created, the template metadata is stored in Prism Central, with the data itself stored as a VM recovery point on the same cluster as the source VM. The original VM remains, and can be powered back on at any time.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Helps with VM customization but is not required for template creation.",
      "Incorrect: as a template cannot be created while the VM is running.",
      "Incorrect: Not required; a template can be created from any VM state.",
      "Correct: Required to create a template successfully."
    ],
    "tags": [
      "vm-template",
      "power-state"
    ]
  },
  {
    "id": "ncp-mci-e1-q46",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator has spent time correcting specific issues that have been identified by NCC Health Checks in Prism Element (PE). How can just the checks that previously did not pass be executed again to confirm they are all resolved?",
    "options": [
      "Run LCM Pre-Upgrade to trigger NCC Checks.",
      "Run ncc health checks run_all.",
      "Select Run Check for each check worked.",
      "Select Only Failed And Warning Checks."
    ],
    "answer": [
      3
    ],
    "explanation": "Running only failed and warning checks helps verify issue resolution efficiently.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: Triggers checks but includes all, not just failed ones.",
      "Incorrect: Runs all checks, not just failed ones.",
      "Incorrect: Can be done manually but is inefficient.",
      "Correct: The correct option, as it reruns only failed and warning checks."
    ],
    "tags": [
      "ncc",
      "health-checks",
      "prism-element"
    ]
  },
  {
    "id": "ncp-mci-e1-q47",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "What is the purpose of the OpLog?",
    "options": [
      "Persistent write buffer",
      "Persistent data storage",
      "Global metadata",
      "Dynamic read cache"
    ],
    "answer": [
      0
    ],
    "explanation": "The OpLog (Operational Log) in Nutanix serves as apersistent write bufferfor incoming I/O operations. It temporarily stores write requests to ensure fast acknowledgment to clients and better performance. The data is later coalesced and written to the Extent Store for long-term storage.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: The correct option, as OpLog is used for storing incoming writes before committing them to storage.",
      "Incorrect: OpLog is not a long-term storage mechanism.",
      "Incorrect: OpLog does not store metadata, it handles write operations.",
      "Incorrect: OpLog is primarily for writes, not read caching."
    ],
    "tags": [
      "oplog",
      "write-path",
      "extent-store"
    ]
  },
  {
    "id": "ncp-mci-e1-q49",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator observes an alert in Prism for a hybrid SSD/HDD cluster: 1 \"Storage Pool SSD utilization consistently above 75%.\" What is the potential impact of this condition?",
    "options": [
      "The cluster is unable to sustain an SSD disk failure.",
      "The cluster may be nearly out of storage for metadata.",
      "The cluster is at risk of entering a read-only state.",
      "Average I/O latency in the cluster may increase."
    ],
    "answer": [
      3
    ],
    "explanation": "High SSD utilization in a hybrid cluster can lead to increased I/O latency as new writes may spill over to HDDs, reducing overall performance. If SSD usage is above 75%, data tiering shifts to slower HDDs, increasing latency.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: SSD failures are managed via redundancy policies (RF2/RF3), and high utilization does not impact failure handling",
      "Incorrect: Metadata is stored separately, and high SSD usage does not mean metadata is at risk.",
      "Incorrect: Clusters do not go into read-only mode due to high SSD utilization---they simply experience performance degradation",
      "Correct: High SSD utilization can slow performance."
    ],
    "tags": [
      "ssd",
      "storage-pool",
      "latency",
      "tiering"
    ]
  },
  {
    "id": "ncp-mci-e1-q52",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A company is evaluating Nutanix DR to protect some business-critical applications and tasked an administrator to find an optimal configuration providing highest resiliency and lowest RPO to the production environment. The company's production environment is deployed on two physical sites with each hosting one AHV-based cluster. What configuration will meet the company's requirements?",
    "options": [
      "Deploy Prism Central instance on one of the sites. Configure NearSync replication using Protection Domains.",
      "Deploy one Prism Central instance on each site and configure synchronous replication using Protection Policy.",
      "Deploy Prism Central instance on one of the sites, configure Prism Central Disaster Recovery, and setup Metro AHV.",
      "Deploy Prism Central instance on each site. Configure Metro Availability using Protection Domains."
    ],
    "answer": [
      3
    ],
    "explanation": "Metro Availability offers the lowest RPO (zero) and highest resiliency: Metro Availability, leveraging synchronous replication, ensures zero data loss and near-zero RTO in a failover scenario. This is the best option for business-critical applications requiring continuous availability. Since the company has two sites, placing Prism Central on each site provides management redundancy.  Protection Domains can also be used as part of this Configuration: Setting up Protection Domains within the Metro Availability configuration enhances disaster recovery capabilities, providing options for granular VM protection and orchestration for less critical applications. These would likely be configured with NearSync replication within the same Prism Central instance.  Other options are suboptimal: Options A and B are not ideal because NearSync and synchronous replication alone don't offer the automatic failover and near-zero RTO provided by Metro Availability. Option C is incorrect because the company has two clusters (one in each site); this would imply that there's a dedicated site for DR which the question does not support.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: NearSync replication provides low RPO but may not offer the highest resiliency.",
      "Incorrect: Synchronous replication provides the highest resiliency and lowest RPO.",
      "Incorrect: This option provides good resiliency but may not offer the lowest RPO.",
      "Correct: Metro Availability provides high resiliency and low RPO."
    ],
    "tags": [
      "metro-availability",
      "protection-domain",
      "rpo",
      "dr"
    ]
  },
  {
    "id": "ncp-mci-e1-q53",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Which predefined view should be leveraged in Prism Central Intelligent Operations to determine which VM is consuming too many resources and causing other VMs to starve?",
    "options": [
      "Constrained VMs List",
      "Bully VMs List",
      "Inactive VMs List",
      "Overprovisioned VMs List"
    ],
    "answer": [
      1
    ],
    "explanation": "The \"Bully VMs List\" in Prism Central Intelligent Operations (formerly called AIOps) specifically identifies VMs consuming excessive resources and impacting the performance of other VMs by \"stealing\" resources from them. While other options might provide insights into resource usage, they do not directly address the issue of one VM negatively affecting others.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: This view shows VMs that are constrained by resource limits.",
      "Correct: This view shows VMs that are consuming excessive resources and causing other VMs to starve.",
      "Incorrect: This view shows VMs that are inactive and not consuming resources.",
      "Incorrect: This view shows VMs that are overprovisioned with resources."
    ],
    "tags": [
      "bully-vms",
      "intelligent-operations",
      "contention"
    ]
  },
  {
    "id": "ncp-mci-e1-q55",
    "domain": "dataprotection",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator has been tasked by the company's leadership to justify and explain the decision to utilize the new Nutanix Disaster Recovery solution. The environment contains: • 100 workloads • Workloads have varying boot orders • Workloads span multiple subnets • Workloads span across different business units How should the administrator most efficiently organize and manage the workloads?",
    "options": [
      "Utilize Categories to organize VMs in Recovery Plans.",
      "Utilize RESTful APIs to script creation of Recovery Plans.",
      "Utilize a 1:10 ratio of Recovery-Plan to VMs.",
      "Utilize a VM naming schema that allows sorting."
    ],
    "answer": [
      0
    ],
    "explanation": "Utilizing Categories to organize VMs in Recovery Plans is the most efficient method. Categories are designed specifically for grouping VMs logically within Recovery Plans. They allow the administrator to manage workloads based on boot order, subnet, business unit or any other criteria relevant to disaster recovery. This approach simplifies recovery orchestration significantly compared to other options.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: Categories help organize VMs efficiently.",
      "Incorrect: While APIs offer automation capabilities, they don't inherently provide organizational structure. You would still need a method for grouping VMs logically within the Recovery Plans created by the scripts.",
      "Incorrect: This might be a workable approach, but it doesn't directly address the organizational challenges presented by boot orders, subnets, and business units. It could lead to unnecessary complexity with a large number of Recovery Plans.",
      "Incorrect: A good naming schema is helpful, but it doesn't replace the need for grouping and orchestrating VMs within Recovery Plans based on dependencies and business requirements. Sorting alone won't manage boot orders or subnet dependencies during recovery."
    ],
    "tags": [
      "categories",
      "recovery-plan",
      "dr",
      "boot-order"
    ]
  },
  {
    "id": "ncp-mci-e1-q56",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator has been tasked with creating a new storage container named TestData. The TestData storage container must meet the following conditions: • The container needs to have a Replication Factor of 1 (RF1). • Inline Compression must be enabled. • Deduplication must be disabled. • The container must have a maximum storage capacity of 100 GiB. How should the administrator complete this task?",
    "options": [
      "Log into Prism Element and create the storage container.",
      "Log into Prism Central and create the storage container with a Reserved Capacity of 100 GiB.",
      "Log into Prism Element and create the storage container with an Advertised Capacity of 100 GiB.",
      "Log into Prism Central and create the storage container."
    ],
    "answer": [
      2
    ],
    "explanation": "• Prism Element is ideal for managing individual clusters and is the only platform that reliably allows configuration of all required storage container properties at creation, such as Replication Factor, compression, deduplication, and advertised (hard capped) capacity. • Prism Central, while powerful for multi-cluster and global management, does not provide the same level of granularity for storage container creation on a single cluster, especially when enforcing a strict capacity limit and choosing advanced features. • The Advertised Capacity setting in Prism Element is essential to enforce the 100 GiB limit; other methods may not provide a hard cap or could skip key configuration details. • Therefore, Option C directly satisfies all requirements in the scenario, making it the preferred choice for Nutanix storage container creation with strict settings.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: This approach uses Prism Element, which is designed for cluster-local management, including creation of containers with advanced features. However, this option is vague and does not specify setting the capacity (maximum 100 GiB) as required, so it may not enforce the capacity limit directly.",
      "Incorrect: Prism Central provides centralized management for multiple clusters . Setting Reserved Capacity does not guarantee enforcement of a hard storage limit, so this does not fully satisfy the requirement for strictly limiting container size. Some advanced settings might not be as granular as in Prism Element when configuring storage features at creation time.",
      "Correct: In Prism Element, when creating storage containers, you can set specific features such as Replication Factor (RF1), enable inline compression, disable deduplication, and—critically—set \"Advertised Capacity\" to 100 GiB, which enforces the storage limit. Prism Element gives you cluster-local control to configure all required features at creation, which is not as easily handled in Prism Central's broader policy management view.",
      "Incorrect: Prism Central is usually best for environments with multiple clusters, centralized policy management, and automation, but it may not expose all granular features required for specific container customizations (like Replication Factor, compression, deduplication, and explicit advertised capacity limits) at creation time. Without specifying reserved or advertised capacity, this approach is incomplete versus the scenario's requirements."
    ],
    "tags": [
      "storage-container",
      "rf1",
      "advertised-capacity",
      "prism-element"
    ]
  },
  {
    "id": "ncp-mci-e1-q58",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A new employee has inherited a partially configured Disaster Recovery (DR) schema. Source workloads have been identified and Nutanix Guest Tools has been installed. There are two Protection Polices in place, one with an asynchronous schedule with a 1-hour RPO and a second policy utilizing synchronous replication. All of these workloads need to be recovered at a DR location and this will be orchestrated by Prism Central Recovery Plans. What is the best way to setup this recovery orchestration?",
    "options": [
      "Setup a single Recovery Plan utilizing stages of recovery delays as needed.",
      "Identify the workload startup order and create Recovery Plans corresponding to the startup order.",
      "Setup two Recovery Plans, one for the asynchronous replication and one for the synchronous replication.",
      "Setup a Recovery Plan for the asynchronous replication and convert the synchronous replication to a Protection Domain."
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix Disaster Recovery is built to orchestrate failover at the application level, not by replication technology. You can include VMs protected by different Protection Policies (both sync and async) in the same Recovery Plan, and then use stages to define the boot sequence. This keeps DR simple, coordinated, and aligned to real-world business needs — ensuring that an entire application stack can be recovered with a single action.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Correct: Nutanix recommends an application-centric approach to DR. You can (and should) create a single Recovery Plan that includes VMs protected by both synchronous and asynchronous replication policies, as long as they belong to the same application or business service. The plan can use stages and delays to handle boot order and dependencies, orchestrating a smooth failover.",
      "Incorrect: Startup order should be managed inside a single Recovery Plan using stages and delays — not by splitting into separate Recovery Plans.",
      "Incorrect: Splitting by replication type breaks the application into multiple plans, forcing operators to coordinate failover manually across different plans — which defeats the purpose of automated recovery orchestration.",
      "Incorrect: Modern Prism Central Recovery Plans work with Protection Policies directly; converting to Protection Domains adds complexity and is unnecessary."
    ],
    "tags": [
      "recovery-plan",
      "stages",
      "boot-order",
      "dr"
    ]
  },
  {
    "id": "ncp-mci-e1-q59",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Within Intelligent Operations, Capacity Configurations have been set to Auto Detect for Reserve Capacity For Failure. For an RF2 cluster with 10 nodes, what effect does this have on Capacity Runway?",
    "options": [
      "Reserves 10% of CPU, memory and storage to account for a single node failure.",
      "Reserves RAM and CPU from the fastest node to account for a single node failure.",
      "Reserves CPU, RAM and storage from the largest node to account for a single node failure.",
      "Reserves storage and memory from the largest node to account for a single node failure."
    ],
    "answer": [
      2
    ],
    "explanation": "For an RF2 cluster, “Auto Detect” dynamically calculates and reserves the amount of capacity required to absorb the failure of the single largest node — across all three dimensions: CPU, memory, and storage. This keeps the cluster protected and ensures Capacity Runway calculations accurately reflect the true usable capacity after accounting for node failure tolerance.",
    "reviewStatus": "human-reviewed",
    "optionNotes": [
      "Incorrect: The system doesn’t reserve a flat percentage; instead, it reserves capacity equal to the impact of losing the largest node in the cluster.",
      "Incorrect: Nutanix doesn’t consider “fastest” node in terms of CPU clock speed or performance. The calculation is based on capacity, not performance.",
      "Correct: When Capacity Configurations > Reserve Capacity For Failure is set to Auto Detect, Nutanix Intelligent Operations automatically reserves enough CPU, RAM, and storage to handle the failure of the largest node in the cluster. This ensures that, in an RF2 cluster, a single node failure can be tolerated without impacting workload availability.",
      "Incorrect: This option ignores CPU, which is also included in the reservation calculation. Nutanix reserves all three: CPU, memory, and storage."
    ],
    "tags": [
      "reserve-capacity",
      "auto-detect",
      "capacity-runway",
      "rf2"
    ]
  },
  {
    "id": "NPX-H-001",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "If a Nutanix cluster that has been deployed using ESXi is only using one datastore, which advanced option needs to be set during the initial cluster deployment?",
    "options": [
      "`das.ignoreInsufficientHbDatastore` with Value of `false`",
      "`das.ignoreInsufficientHbDatastore` with Value of `0`",
      "`das.ignoreInsufficientHbDatastore` with Value of `1`",
      "`das.ignoreInsufficientHbDatastore` with Value of `true`"
    ],
    "answer": [
      3
    ],
    "explanation": "With only one Nutanix datastore, vSphere HA reports an insufficient-heartbeat-datastores warning unless the advanced option `das.ignoreInsufficientHbDatastore = true` is set. Recommended vSphere availability settings also include enabling host monitoring and using percentage-based admission control sized to the number of nodes.",
    "reviewStatus": "human-reviewed",
    "reference": "vSphere HA — Admission Control & heartbeat datastores",
    "priority": true
  },
  {
    "id": "NPX-E-001",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "multi",
    "stem": "To improve security on a newly created vSphere-based Nutanix cluster, which two default passwords should be changed? (Choose two)",
    "options": [
      "root user on ESXi",
      "nutanix user on vCenter",
      "nutanix user on the CVM",
      "root user on Prism Central"
    ],
    "answer": [
      0,
      2
    ],
    "explanation": "Nutanix recommends changing the default passwords, including the Controller VM (CVM) local `nutanix` account and the hypervisor's local account — for ESXi that is the local `root` user. (Other accounts to change elsewhere include AHV root/admin/nutanix, Hyper-V administrator, Prism Central admin + nutanix, IPMI ADMIN, and FSVM nutanix.)",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-002",
    "domain": "lifecycle",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "After triggering a set of LCM updates, an administrator notices a failure message in Prism during the pre-checks, but it lacks enough detail to isolate the cause. Which two logs should be investigated on the CVM? (Choose two)",
    "options": [
      "`stargate.out`",
      "`lcm_ops.out`",
      "`genesis.out`",
      "`lcm_wget.out`"
    ],
    "answer": [
      1,
      2
    ],
    "explanation": "Before an update LCM runs pre-checks and stops if any fail. LCM writes all operations to `genesis.out`, `lcm_ops.out`, `lcm_ops.trace`, and `lcm_wget.log`; `lcm_ops.out` and `genesis.out` carry the pre-check context.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-003",
    "domain": "prism",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "Which two CLI commands are required to take the CVM and the node out of maintenance mode? (Choose two.)",
    "options": [
      "`acli host.exit_maintenance_mode host-ip`",
      "`ncli host edit id=host-ID enable-maintenance-mode=false`",
      "`acli host.disable_maintenance_mode host-ip`",
      "`ncli host edit id=host-ID disable-maintenance-mode=true`"
    ],
    "answer": [
      0,
      1
    ],
    "explanation": "Remove the CVM from maintenance mode with `ncli host edit id=host-ID enable-maintenance-mode=false` (after finding the ID via `ncli host list`), then remove the node with `acli host.exit_maintenance_mode host-ip` and verify with `acli host.get`.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-001",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Which terms describe performance acceleration features of the Distributed Storage Fabric?",
    "options": [
      "Extent Groups, vDisk flash mode and AHV Turbo",
      "Intelligent Tiering, Data Locality and Automatic Disk Balancing",
      "Erasure Coding, vDisk flash mode and Autonomous Extent Store",
      "Deduplication, Compression and Erasure Coding"
    ],
    "answer": [
      1
    ],
    "explanation": "DSF accelerates performance with Intelligent Tiering (moves data between SSD and HDD by access pattern), Data Locality (VM data kept on the node running the VM, following it on migration), and Automatic Disk Balancing (keeps utilization uniform across the cluster).",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-004",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "The Autonomous Extent Store will bypass the OpLog in which workload scenario?",
    "options": [
      "Sequential Read",
      "Sequential Write",
      "Sustained Random Write",
      "Sustained Random Read"
    ],
    "answer": [
      2
    ],
    "explanation": "For sustained random write workloads, AES writes directly to the Extent Store, bypassing the OpLog. Bursty random workloads still take the OpLog path and drain to the Extent Store via AES where possible.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-002",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "multi",
    "stem": "What two types of VDI workloads benefit from enabling cache deduplication? (Choose two)",
    "options": [
      "VAAI Clone",
      "Persistent Desktops",
      "Full Clone",
      "Linked Clone"
    ],
    "answer": [
      1,
      2
    ],
    "explanation": "Cache (inline read-cache) deduplication is recommended for full-clone, persistent-desktop, and physical-to-virtual use cases (CVMs need at least 24 GB RAM). It is not recommended for VAAI clone or linked-clone environments.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-003",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is preparing an RF2 4-node cluster to deploy a VDI project consisting of full clones. Which action should the administrator take to support this workload?",
    "options": [
      "Create a dedicated storage pool with the default storage efficiency configuration.",
      "Create a dedicated storage container with inline compression and deduplication.",
      "Set cluster redundancy to RF3 to support Erasure Coding in a new Storage Container.",
      "Add one node to the cluster and enable Erasure coding in a new Storage Container."
    ],
    "answer": [
      1
    ],
    "explanation": "Nutanix recommends inline compression for most workloads and disabling deduplication except for VDI. For a VDI full-clone project, create a dedicated storage container with inline compression and deduplication enabled.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-005",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A company wants a few lower-priority VMs to communicate through 1G uplinks only. How could the company achieve this while still maintaining maximum throughput for the other mission-critical VMs?",
    "options": [
      "Add all available uplinks to br0 and configure LACP.",
      "Add all available uplinks to br0 and configure balance-slb.",
      "Create vs1 with 1G uplinks and assign the lower priority VMs a network on br1.",
      "Create vs0 with 1G uplinks and assign the lower priority VMs a network on br1."
    ],
    "answer": [
      2
    ],
    "explanation": "Create a new virtual switch (vs1) built on the 1G uplink interfaces (bridge br1) and place the lower-priority VMs there, keeping the mission-critical VMs on a virtual switch with faster uplinks so their throughput is unaffected.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-004",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "What is the Nutanix recommended configuration for taking full advantage of the bandwidth provided by multiple links?",
    "options": [
      "No Uplink Bond",
      "Active-Active with MAC Pinning",
      "Active-Backup",
      "Active-Active"
    ],
    "answer": [
      3
    ],
    "explanation": "Active-Active (Balance-TCP) lets VMs send traffic across multiple uplink interfaces, aggregating their bandwidth. Active-Backup uses one uplink at a time, MAC pinning (Balance-SLB) pins a vNIC to a single uplink, and No Uplink Bond uses only one uplink — none aggregate bandwidth like Active-Active.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-005",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to script a network map of which nodes/NICs connect to which switches/ports using MAC addresses. What is the most efficient way to collect the node MAC address?",
    "options": [
      "Using the network configuration in Prism Element.",
      "Use the `ethtool` command via `cli`.",
      "Use the `manage_ovs` command via `cli`.",
      "Use the IPMI interface collect HW data."
    ],
    "answer": [
      1
    ],
    "explanation": "On the AHV host, `ethtool -P ethX` prints the permanent (hardware) MAC address of the interface — scriptable and efficient. (`ifconfig ethX` also shows the HWaddr along with interface statistics.)",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-006",
    "domain": "prism",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator needs to customize report settings, such as appearance and retention format, differentiated for each corporate business unit. Where should these customizations be configured?",
    "options": [
      "In the main **Report Setting** in Prism Central Reports",
      "In Prism Central Settings, **UI Settings**",
      "In Nutanix Cloud Manager Operation Policies",
      "In **Report Settings** for each report"
    ],
    "answer": [
      3
    ],
    "explanation": "Report settings can be applied globally (all reports) or per report. To differentiate per business unit, configure the settings for each individual report — the report-level setting takes precedence over the global one.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-007",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "multi",
    "stem": "An administrator needs to compare two VMs to see if one is resource constrained. Which two chart types can provide this information? (Choose two)",
    "options": [
      "Entity Chart for each VM showing its CPU Ready %",
      "Metric chart showing each VM's CPU Usage %",
      "Metric chart showing cluster CPU Usage %",
      "Entity chart for each VM's host showing Hypervisor CPU Usage %"
    ],
    "answer": [
      0,
      1
    ],
    "explanation": "Entity charts track one or more metrics for a single entity (per VM — CPU Ready %); Metric charts track a single metric across one or more entities (CPU Usage % for both VMs). The host- and cluster-level charts don't isolate the two VMs.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-008",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "multi",
    "stem": "After an update, a VM's CPU usage spikes to 100% every 60–120 minutes, against a normal weekday/weekend band. In which two locations should the administrator look to track this behavior? (Choose two)",
    "options": [
      "In the VM details Alert tab.",
      "In the Event dashboard.",
      "In the VM details Metrics tab.",
      "In the Alerts dashboard."
    ],
    "answer": [
      1,
      2
    ],
    "explanation": "Anomaly detection learns a normal behavior band per metric and flags outliers as events. Anomalies appear in the behavioral-anomaly Event details and on the VM details Metrics tab.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-006",
    "domain": "performance",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An application is not performing well. The VM has 1 vCPU with 2 vCores; Prism shows 50% CPU usage and 0 CPU Ready. Which action should be taken?",
    "options": [
      "Do not add vCPUs because the cluster is already overcommitted.",
      "Add 1 vCPU with 2 vCores to ensure vNUMA support.",
      "Do not add vCPUs because the application does not support SMP.",
      "Add 2 vCores to double VM computing power."
    ],
    "answer": [
      2
    ],
    "explanation": "At only 50% CPU usage and 0 CPU Ready, the VM is not waiting on CPU scheduling and would gain nothing from more processors — the application cannot use additional CPUs because it does not support SMP (Symmetric Multi-Processing).",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-007",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Which Inefficient VM Profile type is used to identify a VM with Host I/O Stargate CPU usage > 85%?",
    "options": [
      "Over-provisioned VM",
      "Bully",
      "Inactive VM",
      "Constrained VM"
    ],
    "answer": [
      1
    ],
    "explanation": "A bully VM consumes so many resources that others starve. It is flagged when, for over an hour, it shows CPU ready time > 5%, memory swap rate > 0 Kbps, or Host I/O Stargate CPU usage > 85%.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-008",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "An administrator must configure an AHV cluster to forward all system logs to a central log server. What two steps need to be taken? (Choose two)",
    "options": [
      "Determine which modules and log levels need to be forwarded.",
      "Configure `rsyslog-config` via `ncli`.",
      "Install the Splunk Agent for AHV.",
      "Configure `rsyslog` forwarding via Prism Element."
    ],
    "answer": [
      0,
      1
    ],
    "explanation": "Use the nCLI `rsyslog-config` command to forward logs: add the server, then add a module specifying which modules and log levels to forward, and enable it. It cannot be configured in Prism Element (only Prism Central or the CVM's ncli), and no Splunk agent is required.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-E-002",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Which service controls all I/O in the Nutanix cluster?",
    "options": [
      "Stargate",
      "Zookeeper",
      "Curator",
      "Genesis"
    ],
    "answer": [
      0
    ],
    "explanation": "Stargate is the data I/O manager — responsible for all data management and I/O and the main interface from the hypervisor (NFS/iSCSI/SMB). It runs on every node to serve localized I/O.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-E-003",
    "domain": "prism",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Which service is responsible for running the Nutanix GUI interface?",
    "options": [
      "Pithos",
      "Zeus",
      "Prism",
      "Medusa"
    ],
    "answer": [
      2
    ],
    "explanation": "Prism is the management gateway (nCLI, HTML5 UI, and REST API). It runs on every node and uses an elected leader. Pithos is the vDisk config manager, Medusa the metadata abstraction layer, and Zeus the cluster-config library.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-009",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Custom alert policies in Prism Central monitor CPU and memory of guest VMs. Specific application owners should be emailed when an alarm triggers. What does the administrator need to configure?",
    "options": [
      "Create a rule to send an email to the application owner.",
      "Configure the email settings within each VM category.",
      "Create a task to send an email to the application owner.",
      "Configure the email settings within each specific alert policy."
    ],
    "answer": [
      0
    ],
    "explanation": "Configuring alert emails is a separate action from the alert policy (and from VM categories): create a rule in Prism Central defining who receives the email. Prism Central alert emailing must be explicitly enabled and requires an SMTP server.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-010",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Memory usage for a Windows VM reports as 100% in Prism while in-guest usage never exceeds 30%. What action resolves this?",
    "options": [
      "Reboot the host where the VM is running",
      "Reboot the VM",
      "Install the VirtIO Balloon driver",
      "Live Migrate the VM"
    ],
    "answer": [
      2
    ],
    "explanation": "AOS reports guest memory usage using the balloon driver running inside the guest (part of the Nutanix VirtIO package). Windows does not ship this driver, so until it is installed memory usage is misreported in Prism.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-H-009",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "To keep a VDI gold image consistent across newly added clusters, what two items must the Nutanix administrator implement? (Choose two)",
    "options": [
      "Create an Image Placement Policy in PC",
      "Setup Leap OnPrem and deploy Protection/Recovery plans",
      "Create a custom category and tag the cluster and image",
      "Install NGT on the gold image so it can replicate between clusters"
    ],
    "answer": [
      0,
      2
    ],
    "explanation": "In Prism Central, create categories for the cluster and image and associate each, then create an Image Placement Policy tying the two categories together (\"assign images from these categories to the clusters from these categories\"). NGT and Leap are not relevant to this task.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-011",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "multi",
    "stem": "What are two supported values of an Encryption Storage Policy? (Choose two)",
    "options": [
      "Inherit from Cluster",
      "Enabled",
      "Self Encrypting Drives (SED) Encryption",
      "Disabled"
    ],
    "answer": [
      0,
      1
    ],
    "explanation": "When enabling encryption within a Storage Policy, the possible settings are Enabled and Inherit from Cluster.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-012",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "multi",
    "stem": "Several storage containers share one storage pool, each with different optimizations. Which two actions ensure one container does not use all remaining storage space? (Choose two)",
    "options": [
      "Enable Compression for each storage container",
      "Configure the Reserved Capacity for each storage container",
      "Enable Deduplication for each storage container",
      "Configure the Advertised Capacity for each storage container"
    ],
    "answer": [
      1,
      3
    ],
    "explanation": "By default every container can use all unused pool space. Configure Reserved Capacity (guarantees a minimum unavailable to others) and Advertised Capacity (caps the container's visible size) to keep one container from consuming the whole pool. Reserve no more than 90% of the pool in total.",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "NPX-M-013",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is setting up a new storage container to host persistent (full clone) VDI desktop VMs. Which storage optimization feature should be enabled?",
    "options": [
      "Flash Pinning",
      "Redundancy Factor 1",
      "Post-Process Compression",
      "Deduplication"
    ],
    "answer": [
      3
    ],
    "explanation": "Nutanix recommends enabling inline compression for most workloads and disabling deduplication except for VDI. For a persistent full-clone VDI container, enable deduplication (on a dedicated container for mixed clusters).",
    "reviewStatus": "human-reviewed",
    "priority": true
  },
  {
    "id": "AHV-E-001",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator is explaining the AHV architecture to a new team member and is asked what core virtualization technology AHV is built on. What is the correct answer?",
    "options": [
      "A hardened, Nutanix-tuned build of Linux KVM",
      "A Nutanix fork of VMware ESXi",
      "The Xen hypervisor with a custom management layer",
      "Microsoft Hyper-V repackaged by Nutanix"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV is Nutanix's native hypervisor, built on open-source Linux KVM (Kernel-based Virtual Machine) with QEMU and libvirt, and managed by the Acropolis service. It is not derived from ESXi, Xen, or Hyper-V.",
    "reference": "AHV Administration Guide",
    "phoneHint": "I'm pretty confident it's the KVM one - AHV has always been KVM under the hood.",
    "steveClue": "",
    "tags": [
      "ahv",
      "kvm",
      "architecture"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-E-002",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A Windows Server VM boots on AHV but fails to detect its SCSI system disk and its network adapter. Which software should be installed in the guest to resolve this?",
    "options": [
      "The Nutanix VirtIO package for Windows",
      "VMware Tools",
      "Only Nutanix Guest Tools (NGT)",
      "Windows Hyper-V Integration Services"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV presents paravirtualized VirtIO devices (SCSI storage, network, and balloon), which Windows does not include natively. The Nutanix VirtIO package must be installed so the guest can see its disk and NIC. NGT adds features like VSS and self-service restore but does not replace the base VirtIO storage/network drivers.",
    "reference": "AHV Administration Guide - Nutanix VirtIO",
    "phoneHint": "Go with the VirtIO one - Windows needs those drivers to even see the disk.",
    "steveClue": "",
    "tags": [
      "ahv",
      "virtio",
      "windows",
      "drivers"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-E-003",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants to create a new VM on AHV and boot it from an OS installation ISO. What is the recommended way to make that ISO available to the VM?",
    "options": [
      "Import it into the Image Service (image configuration) and attach it as a CD-ROM",
      "Copy the ISO into the CVM's /home directory and boot from there",
      "Attach it directly from the administrator's laptop over the network",
      "Convert the ISO to a qcow2 boot disk first"
    ],
    "answer": [
      0
    ],
    "explanation": "The AHV Image Service (Image Configuration) imports ISOs and disk images into a storage container so they can be attached to VMs. An imported ISO is mounted as a virtual CD-ROM for installation, which is the supported workflow.",
    "reference": "Prism Web Console Guide - Image Management",
    "phoneHint": "I think it's the Image Service one - that's how you get ISOs into AHV.",
    "steveClue": "",
    "tags": [
      "ahv",
      "image-service",
      "iso",
      "vm-creation"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-E-004",
    "domain": "ahv",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "During a planned workload rebalance, an administrator needs to move a running, business-critical VM from one AHV host to another with no service interruption. Which operation accomplishes this?",
    "options": [
      "Live migration",
      "Cold clone and delete",
      "VM export and re-import",
      "Protection domain failover"
    ],
    "answer": [
      0
    ],
    "explanation": "Live migration transfers a running VM's memory and CPU state to another host in the same cluster with no downtime. Because all hosts share the Nutanix Distributed Storage Fabric, no disk data is copied. The other options all involve downtime or are disaster-recovery operations.",
    "reference": "AHV Administration Guide - Live Migration",
    "phoneHint": "It's live migration - that's the whole no-downtime move thing.",
    "steveClue": "",
    "tags": [
      "ahv",
      "live-migration",
      "vm-mobility"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-M-001",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A cluster has Acropolis Dynamic Scheduling (ADS) enabled with default settings. How often does ADS perform its scheduled evaluation of the cluster for resource hotspots?",
    "options": [
      "Every 15 minutes",
      "Continuously, in real time",
      "Once every 60 minutes",
      "Only when a VM is powered on"
    ],
    "answer": [
      0
    ],
    "explanation": "By default ADS runs a scheduled analysis of CPU and storage utilization every 15 minutes and migrates VMs (or ABS volume-group sessions) to resolve detected hotspots. It is periodic, not a continuous real-time load balancer.",
    "reference": "AHV Administration Guide - Acropolis Dynamic Scheduling",
    "phoneHint": "I'm fairly sure it checks every 15 minutes, not constantly.",
    "steveClue": "",
    "tags": [
      "ahv",
      "ads",
      "scheduling",
      "hotspot"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-M-002",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator must ensure a database VM can take an application-consistent snapshot on AHV. What is the prerequisite for application-consistent, rather than crash-consistent, snapshots?",
    "options": [
      "Nutanix Guest Tools (NGT) must be installed and enabled in the guest",
      "The VM must be powered off during the snapshot",
      "The VirtIO balloon driver must be disabled in the guest",
      "Deduplication must be enabled on the storage container"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV snapshots are crash-consistent by default. Application-consistent snapshots require Nutanix Guest Tools (NGT), which uses Microsoft VSS on Windows (or pre-freeze/post-thaw scripts on Linux) to quiesce the application before the snapshot. Powering the VM off would only produce an offline snapshot, not a live application-consistent one.",
    "reference": "Data Protection and Recovery with Prism Element",
    "phoneHint": "Pretty sure you need NGT installed for the app-consistent part.",
    "steveClue": "",
    "tags": [
      "ahv",
      "snapshots",
      "ngt",
      "application-consistent"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-M-003",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A running Linux VM on AHV is under pressure, and the owner asks to increase both its RAM and its vCPU count without a reboot. What does AHV support here?",
    "options": [
      "Both memory and vCPUs can be hot-added while the VM is powered on",
      "Only memory can be changed live; vCPU changes always require a reboot",
      "Neither can be changed without powering the VM off",
      "vCPUs can be hot-removed but never hot-added"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV supports hot-adding (increasing) both memory and vCPUs on a powered-on VM, provided the guest OS supports it. The operation is add-only, however: you cannot hot-remove or decrease memory or vCPUs while the VM is running.",
    "reference": "AHV Administration Guide - Virtual Machine Management",
    "phoneHint": "I believe you can hot-add both memory and vCPUs on AHV - go with that one.",
    "steveClue": "",
    "tags": [
      "ahv",
      "hot-add",
      "memory",
      "vcpu"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-M-004",
    "domain": "ahv",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is importing virtual disks into the AHV Image Service from several source platforms. Which of the following formats is NOT supported for direct import by the Image Service?",
    "options": [
      "OVA",
      "qcow2",
      "VMDK",
      "VHDX"
    ],
    "answer": [
      0
    ],
    "explanation": "The AHV Image Service can import disk formats such as raw, qcow2, VMDK, VHD, VHDX, VDI, and ISO. OVA is a packaged appliance format (a tar of an OVF descriptor plus disks), not a single disk image, so it cannot be imported directly; its disks must be extracted or a dedicated migration tool used.",
    "reference": "Prism Web Console Guide - Image Management",
    "phoneHint": "I think OVA is the odd one out - the others are raw disk formats it accepts.",
    "steveClue": "",
    "tags": [
      "ahv",
      "image-service",
      "disk-formats"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-H-001",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "On a busy cluster, one AHV host's CPU is running very hot while its peers are lightly loaded. Using default ADS behavior, at approximately what sustained host CPU utilization does ADS classify the host as a hotspot and attempt remediation?",
    "options": [
      "Above 85% CPU utilization",
      "Above 50% CPU utilization",
      "Above 95% CPU utilization",
      "Above 70% CPU utilization"
    ],
    "answer": [
      0
    ],
    "explanation": "ADS flags a host as contended (a hotspot) when its CPU utilization stays above roughly 85% of capacity for a sustained period, then migrates VMs to a less-loaded host. A 50% or 70% trigger would cause needless migration churn, while waiting for 95% would let workloads degrade first.",
    "reference": "AHV Administration Guide - Acropolis Dynamic Scheduling",
    "phoneHint": "I lean toward the 85% figure, but I'm not 100% sure on the exact number.",
    "steveClue": "ADS is not a continuous balancer chasing perfectly even load; it only intervenes when a host is genuinely contended. Think about a threshold high enough to avoid constant migration churn, yet low enough to act before workloads actually starve for CPU. Nutanix set that value in the mid-to-high 80s percent.",
    "tags": [
      "ahv",
      "ads",
      "hotspot",
      "threshold"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-H-002",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator configures a VM-host affinity policy pinning VM-A to Host-1, and a VM-VM anti-affinity policy separating VM-B and VM-C. Which statement correctly describes how AHV enforces these two policies?",
    "options": [
      "VM-host affinity is strictly enforced; VM-VM anti-affinity is best-effort and may be broken if no other host is available",
      "Both policies are strictly enforced and are never violated under any condition",
      "Both policies are best-effort and may be violated when the cluster is under load",
      "VM-VM anti-affinity is strictly enforced, while VM-host affinity is only a placement preference"
    ],
    "answer": [
      0
    ],
    "explanation": "In AHV, VM-host affinity is a required (hard) rule: an affined VM runs only on its designated host(s) and will not be moved elsewhere, even for HA. VM-VM anti-affinity is a best-effort (soft) rule that ADS honors when possible but may violate if there is no other viable placement.",
    "reference": "AHV Administration Guide - VM Affinity Policies",
    "phoneHint": "I think host-affinity is the strict one and VM-VM anti-affinity is only best-effort - first option.",
    "steveClue": "Consider what each rule protects. Pinning a VM to specific hosts is often for licensing or dedicated hardware like a GPU, so the platform treats it as non-negotiable, even at the cost of not restarting the VM during HA. Keeping two VMs apart is about resilience, so the platform tries hard but will not leave a VM powerless just to satisfy separation when hosts are scarce.",
    "tags": [
      "ahv",
      "affinity",
      "anti-affinity",
      "ads"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-H-003",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator places an AHV host into maintenance mode to replace a faulty NIC. Some VMs on that host use GPU passthrough and therefore cannot be live-migrated. What happens to those non-migratable VMs?",
    "options": [
      "They are gracefully powered off and stay down until the host exits maintenance mode",
      "They are forcibly live-migrated with a brief guest hang",
      "They keep running on the host while it is being serviced",
      "The maintenance-mode operation is aborted for the entire host"
    ],
    "answer": [
      0
    ],
    "explanation": "When a host enters maintenance mode, AHV live-migrates all migratable guest VMs to other hosts. VMs that cannot be migrated (for example, those using GPU or PCI passthrough, or pinned by host affinity) are shut down and remain off until the host exits maintenance mode. The Controller VM is not migrated and is handled separately.",
    "reference": "AHV Administration Guide - Host Maintenance Mode",
    "phoneHint": "Pretty sure the passthrough VMs just get powered off since they can't move - first option.",
    "steveClue": "Live migration streams a VM's memory state to another host, but that only works when the VM's virtual hardware is fully abstracted. A device passed straight through to physical hardware breaks that abstraction and binds the VM to that host. When the host must be evacuated, the only safe option for such a VM is to stop it cleanly rather than leave it on a host going down for service.",
    "tags": [
      "ahv",
      "maintenance-mode",
      "evacuation",
      "gpu-passthrough"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "AHV-H-004",
    "domain": "ahv",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator is cloning a Windows template VM and a Linux template VM on AHV and wants each clone to boot with a unique hostname, network configuration, and credentials applied automatically. Which guest customization mechanisms does AHV use for these two guest types?",
    "options": [
      "Sysprep for the Windows clone and cloud-init for the Linux clone",
      "cloud-init for both the Windows and the Linux clone",
      "Sysprep for both the Windows and the Linux clone",
      "NGT scripting for the Windows clone and Sysprep for the Linux clone"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV guest customization applies Sysprep (an unattend answer file) to Windows guests and cloud-init to Linux guests. You supply the script or answer file when creating or cloning the VM, and it runs on first boot to set hostname, networking, users, and more. cloud-init is not the Windows mechanism, and Sysprep is Windows-only.",
    "reference": "Prism Web Console Guide - VM Guest Customization",
    "phoneHint": "I'm fairly sure it's Sysprep for Windows and cloud-init for Linux - that split sounds right.",
    "steveClue": "Each OS family has its own long-standing unattended-provisioning framework, and AHV simply hooks into the native one for each guest. Windows has used an answer-file-driven generalization-and-specialization tool for years, while the Linux and cloud world standardized on a metadata-driven first-boot configuration system. AHV feeds your config to whichever one matches the guest.",
    "tags": [
      "ahv",
      "guest-customization",
      "cloud-init",
      "sysprep",
      "cloning"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-E-001",
    "domain": "dataprotection",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator configures asynchronous DR replication for a protection domain to a remote site. What is the shortest RPO that a standard asynchronous schedule supports?",
    "options": [
      "15 minutes",
      "60 minutes",
      "5 minutes",
      "1 minute"
    ],
    "answer": [
      1
    ],
    "explanation": "Standard asynchronous replication supports a minimum RPO of 60 minutes (hourly snapshots). Shorter RPOs of 1-15 minutes require NearSync, and an RPO of 0 requires Metro Availability.",
    "reference": "Prism Web Console Guide - Data Protection (Async DR)",
    "phoneHint": "Pretty sure async tops out at hourly, so I'd go with the 60-minute option.",
    "steveClue": "",
    "tags": [
      "async DR",
      "RPO",
      "protection domain",
      "replication"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-E-002",
    "domain": "dataprotection",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A Windows VM owner wants to recover an accidentally deleted file directly from a VM snapshot without contacting an administrator. What must be installed inside the guest to enable Self-Service Restore?",
    "options": [
      "Nutanix Guest Tools (NGT)",
      "VMware Tools",
      "Nutanix Move agent",
      "Prism Central agent"
    ],
    "answer": [
      0
    ],
    "explanation": "Self-Service Restore (file-level restore) requires Nutanix Guest Tools (NGT) in the guest so the VM owner can mount a snapshot and recover individual files. VMware Tools and Move are unrelated to this feature.",
    "reference": "Prism Web Console Guide - Self-Service Restore",
    "phoneHint": "I'm fairly sure it's Nutanix Guest Tools that unlocks that self-service file recovery.",
    "steveClue": "",
    "tags": [
      "self-service restore",
      "NGT",
      "file-level restore"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-E-003",
    "domain": "dataprotection",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Which Nutanix data protection feature delivers a zero RPO by synchronously replicating every write to a second cluster before acknowledging it?",
    "options": [
      "Asynchronous DR",
      "NearSync",
      "Metro Availability",
      "Self-Service Restore"
    ],
    "answer": [
      2
    ],
    "explanation": "Metro Availability synchronously mirrors writes between two clusters (a stretched container), giving an RPO of 0. NearSync achieves 1-15 minutes and async a minimum of 60 minutes, so neither is zero.",
    "reference": "Prism Web Console Guide - Metro Availability",
    "phoneHint": "The synchronous, zero-data-loss one is Metro Availability - I'd pick that.",
    "steveClue": "",
    "tags": [
      "Metro Availability",
      "RPO",
      "synchronous replication"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-E-004",
    "domain": "dataprotection",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Within a protection domain, what is achieved by placing several VMs in the same consistency group?",
    "options": [
      "They are captured together at the same consistent point in time",
      "They are automatically load-balanced across hosts",
      "They share a single virtual NIC",
      "They are excluded from replication"
    ],
    "answer": [
      0
    ],
    "explanation": "A consistency group ensures all of its VMs are snapshotted together at a single consistent point in time, which matters for multi-VM applications. Consistency groups have nothing to do with host load-balancing or networking.",
    "reference": "Prism Web Console Guide - Data Protection (Consistency Groups)",
    "phoneHint": "Consistency group means snapshotted together at the same moment, so the first option sounds right.",
    "steveClue": "",
    "tags": [
      "consistency group",
      "protection domain",
      "snapshot"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-M-001",
    "domain": "dataprotection",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator must replicate a group of VMs to another cluster with a 5-minute RPO. Which technology will the protection domain use to meet this target?",
    "options": [
      "NearSync using lightweight snapshots (LWS)",
      "Metro Availability stretch container",
      "Standard asynchronous snapshots",
      "Self-Service Restore"
    ],
    "answer": [
      0
    ],
    "explanation": "RPOs between 1 and 15 minutes are delivered by NearSync, which uses lightweight snapshots (LWS) taken about every minute. Async cannot go below 60 minutes, and Metro is synchronous (RPO 0), not a 5-minute schedule.",
    "reference": "Prism Web Console Guide - NearSync",
    "phoneHint": "A 5-minute RPO is squarely NearSync/LWS territory - I'd go with that one.",
    "steveClue": "",
    "tags": [
      "NearSync",
      "LWS",
      "RPO",
      "replication"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-M-002",
    "domain": "dataprotection",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Before enabling Metro Availability between two data centers, which network requirement must the environment satisfy?",
    "options": [
      "Round-trip network latency between the sites must be 5 ms or less",
      "The two sites must share the same broadcast domain",
      "Deduplication must be enabled on both clusters",
      "NGT must be installed on every protected VM"
    ],
    "answer": [
      0
    ],
    "explanation": "Because Metro replicates writes synchronously, Nutanix requires a maximum round-trip latency of 5 ms between the two sites; higher latency would degrade write performance. Shared broadcast domains, deduplication, and NGT are not Metro prerequisites.",
    "reference": "Prism Web Console Guide - Metro Availability Requirements",
    "phoneHint": "Synchronous means it's latency-sensitive - I think the 5 ms round-trip requirement is the answer.",
    "steveClue": "",
    "tags": [
      "Metro Availability",
      "latency",
      "requirements"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-M-003",
    "domain": "dataprotection",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "To capture application-consistent snapshots of a Windows SQL Server VM on AHV, what mechanism does Nutanix use to quiesce the application, and what must be present in the guest?",
    "options": [
      "Microsoft VSS, with Nutanix Guest Tools installed in the VM",
      "Redirect-on-write, with no in-guest prerequisites",
      "Lightweight snapshots, requiring all-flash nodes",
      "Metro stretch, requiring a witness VM"
    ],
    "answer": [
      0
    ],
    "explanation": "On AHV, application-consistent snapshots use Microsoft VSS to quiesce the application, which requires Nutanix Guest Tools (NGT) installed in the VM. Without NGT/VSS the snapshot is only crash-consistent.",
    "reference": "Prism Web Console Guide - Application-Consistent Snapshots",
    "phoneHint": "Windows app-consistent snapshots lean on VSS, and NGT is what enables it on AHV - first option.",
    "steveClue": "",
    "tags": [
      "application-consistent",
      "VSS",
      "NGT",
      "AHV"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-M-004",
    "domain": "dataprotection",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "In Nutanix Leap, which construct defines the VM power-on sequence, inter-stage delays, and network mappings that are executed during a failover?",
    "options": [
      "Recovery Plan",
      "Protection Policy",
      "Consistency Group",
      "Remote Site"
    ],
    "answer": [
      0
    ],
    "explanation": "A Recovery Plan orchestrates failover: it defines boot ordering (stages), delays, and test/production network mappings. A Protection Policy, by contrast, defines the RPO, snapshot schedule, and retention of recovery points.",
    "reference": "Nutanix Disaster Recovery (Leap) Guide - Recovery Plans",
    "phoneHint": "The orchestration/runbook piece in Leap is the Recovery Plan - I'd choose that.",
    "steveClue": "",
    "tags": [
      "Nutanix Leap",
      "Recovery Plan",
      "DR orchestration"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-H-001",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A Metro Availability deployment must fail over automatically and without split-brain if either of the two data sites, or the link between them, fails. Which component makes this possible?",
    "options": [
      "A Witness VM deployed at an independent third site",
      "A second CVM added to each of the two clusters",
      "A NearSync LWS store on both clusters",
      "Prism Central hosted at one of the two data sites"
    ],
    "answer": [
      0
    ],
    "explanation": "The Metro Witness is a lightweight VM placed in an independent third failure domain; it arbitrates which site stays active when connectivity is lost, enabling automatic failover while preventing split-brain. Placing the arbiter at one of the two data sites would defeat its purpose.",
    "reference": "Prism Web Console Guide - Metro Availability Witness",
    "phoneHint": "For automatic Metro failover you need an arbiter off to the side - I'm leaning to the independent third-site option, but confirm me.",
    "steveClue": "In a two-site synchronous mirror both copies are equally valid, so when the sites lose contact each could decide to take over - that is split-brain. The fix is a neutral arbiter sitting in a separate failure domain that both sites can reach; it breaks the tie by designating a single surviving site. Putting that arbiter inside one of the two data sites would give that site an unfair vote and reintroduce the risk.",
    "tags": [
      "Metro Availability",
      "witness",
      "failover",
      "split-brain"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-H-002",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A protection domain running NearSync with a 5-minute RPO experiences sustained replication delays that prevent it from meeting the schedule. How does AOS respond?",
    "options": [
      "It automatically falls back to hourly asynchronous replication, then transitions back to NearSync once it can keep pace",
      "It immediately fails the protection domain over to the remote site",
      "It permanently disables the schedule until an admin intervenes",
      "It converts the affected snapshots into Metro Availability"
    ],
    "answer": [
      0
    ],
    "explanation": "When NearSync cannot sustain its cadence, AOS gracefully reverts the protection domain to hourly (async) snapshots so protection continues, and it automatically transitions back to NearSync when the system can keep pace again. It does not trigger a failover or disable protection.",
    "reference": "Prism Web Console Guide - NearSync Requirements and Behavior",
    "phoneHint": "I think it degrades gracefully to hourly async and later climbs back to NearSync rather than doing anything drastic - first option, I believe.",
    "steveClue": "NearSync depends on continuously shipping lightweight snapshots, which only works if both the cluster and the inter-site link can keep up. If they fall behind, the safest design choice is to keep protecting data at a coarser interval rather than losing protection or forcing a failover. Well-designed systems also self-heal, resuming the tighter cadence automatically once conditions recover.",
    "tags": [
      "NearSync",
      "LWS",
      "async fallback",
      "RPO"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-H-003",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A third-party backup product performs incremental-forever backups of AHV VMs by reading only the regions that changed since the previous backup. Which Nutanix capability enables this?",
    "options": [
      "Changed Region Tracking exposed through Nutanix REST (v3) APIs",
      "VMware Changed Block Tracking (CBT)",
      "In-guest file system journaling read via NGT",
      "Deduplication fingerprint comparisons"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix exposes Changed Region Tracking through its REST (v3) APIs, letting backup partners query the regions that differ between two recovery points on AHV. VMware's CBT is a hypervisor-specific feature that does not apply to AHV.",
    "reference": "Nutanix Backup and Recovery / Data Protection REST API documentation",
    "phoneHint": "On AHV the incremental mechanism is Nutanix's own changed-region tracking via the APIs, not VMware CBT - first option.",
    "steveClue": "Incremental-forever backup needs the storage layer to report which parts of a disk changed between two point-in-time copies, so the backup app never re-reads unchanged data. Nutanix provides this to partners through its APIs at the storage and recovery-point level, independent of the guest OS. Be wary of a distractor that names a hypervisor-specific feature borrowed from a different platform.",
    "tags": [
      "changed region tracking",
      "CBT",
      "third-party backup",
      "REST API"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "DP-H-004",
    "domain": "dataprotection",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator enables Metro Availability between cluster A and cluster B. Which statement about how Metro is scoped and configured is correct?",
    "options": [
      "Both clusters must present a storage container with the same name, and the Metro domain protects every VM in that container",
      "Metro protects only the individual VMs added to a consistency group",
      "Metro replicates changed regions to the remote site every 60 seconds",
      "Metro requires NearSync LWS to be enabled on the container first"
    ],
    "answer": [
      0
    ],
    "explanation": "Metro Availability stretches a storage container synchronously, so both clusters must have a container with the same name, and protection applies to all VMs residing in that container rather than to hand-picked VMs. Metro is synchronous (RPO 0), so it does not batch changes on a 60-second interval, and it does not depend on NearSync.",
    "reference": "Prism Web Console Guide - Configuring Metro Availability",
    "phoneHint": "Metro is a container-level stretch with matching container names on both sides - the first option matches what I remember.",
    "steveClue": "Metro works by extending a single storage namespace synchronously across two clusters, so the unit of protection is the storage boundary itself rather than a curated list of VMs. For that shared namespace to work, both clusters must present a container of the same name. And because writes are mirrored synchronously for zero data loss, there is no batching interval like you would see in snapshot-based replication.",
    "tags": [
      "Metro Availability",
      "storage container",
      "configuration",
      "stretch"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-X-002",
    "domain": "storage",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "A cluster stores user data at Redundancy Factor 2 (two data copies). Independent of those data copies, how many copies of the distributed cluster metadata does the Medusa/Cassandra store keep by default?",
    "options": [
      "2",
      "3",
      "4",
      "5"
    ],
    "answer": [
      1
    ],
    "explanation": "To survive failures while still forming a strict majority (Paxos) quorum, Nutanix always keeps metadata at higher redundancy than user data: an RF2 cluster keeps 3 copies of metadata (and Zookeeper config), while an RF3 cluster keeps 5. Matching metadata to the 2 data copies would leave no majority to break ties.",
    "reference": "Nutanix AOS Distributed Storage Fabric (Medusa/Cassandra metadata)",
    "phoneHint": "I think metadata is kept at a higher count than the data copies for quorum reasons, so more than two, but I'd verify the exact number.",
    "steveClue": "Metadata must survive a failure and still form a strict majority to vote on consistency, so its copy count is always odd and always greater than the number of data copies. For a two-copy data policy the metadata ring holds just one more than that. The same rule pushes a three-copy data policy up to five metadata copies.",
    "tags": [
      "metadata",
      "cassandra",
      "medusa",
      "replication-factor",
      "quorum"
    ],
    "reviewStatus": "verified",
    "impossible": true
  },
  {
    "id": "DP-X-001",
    "domain": "dataprotection",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "An architect is designing Metro Availability (synchronous replication with zero RPO) between two datacenters. What is the maximum round-trip network latency Nutanix specifies between the two sites for this configuration to be supported?",
    "options": [
      "1 ms",
      "20 ms",
      "5 ms",
      "200 ms"
    ],
    "answer": [
      2
    ],
    "explanation": "Because every write must be acknowledged at both sites before it completes, Metro Availability requires a maximum round-trip latency of 5 ms between the two clusters, effectively limiting them to metro distances. The 200 ms figure applies to the arbitrating Witness VM, not to the inter-site data path.",
    "reference": "Nutanix Data Protection and Recovery Guide (Metro Availability)",
    "phoneHint": "Synchronous replication is very latency-sensitive, so I'd lean to a small single-digit millisecond number rather than the big ones.",
    "steveClue": "Synchronous replication acknowledges each write at both sites before telling the guest the write is done, so physical distance taxes every single I/O. That forces a very tight round-trip budget in the low single-digit milliseconds, which is why the two sites must be metro-close. Do not confuse this with the far looser latency tolerated by the arbitrating witness.",
    "tags": [
      "metro-availability",
      "synchronous-replication",
      "latency",
      "zero-rpo"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "AHV-X-001",
    "domain": "ahv",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "On an AHV host, QEMU serves VM disk I/O by connecting over the internal 192.168.5.0/24 network to the local Controller VM's Stargate through the iSCSI redirector. Which IP address does the host target to reach that local Stargate storage endpoint?",
    "options": [
      "192.168.5.1",
      "192.168.5.2",
      "127.0.0.1",
      "192.168.5.254"
    ],
    "answer": [
      3
    ],
    "explanation": "On the internal non-routable 192.168.5.0/24 link the AHV host uses 192.168.5.1 and the CVM uses 192.168.5.2, but the local Stargate storage/iSCSI endpoint the host targets for I/O is 192.168.5.254. The iSCSI redirector transparently steers connections to a healthy Stargate (preferring the local one) so I/O survives a local CVM outage.",
    "reference": "Nutanix AHV architecture (CVM autopathing / iSCSI redirector)",
    "phoneHint": "It's on that internal 192.168.5 network, but not the host's own .1 or the CVM's .2. I recall it being a high address near the top of the range.",
    "steveClue": "The hypervisor and its local controller VM talk over a private, non-routable subnet that never touches the physical network; the host owns the .1 address and the controller VM owns .2. Storage I/O, however, is aimed at a separate virtual endpoint so a redirector can transparently fail it over to a peer controller VM when the local one is down. That storage endpoint sits high in the subnet, not at .1, .2, or loopback.",
    "tags": [
      "ahv",
      "cvm",
      "iscsi-redirector",
      "stargate",
      "internal-network"
    ],
    "reviewStatus": "verified",
    "impossible": true
  },
  {
    "id": "AHV-X-002",
    "domain": "ahv",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "A new AHV cluster is deployed and the admin has not configured any high-availability settings. If a host fails, what VM HA behavior is in effect by default?",
    "options": [
      "Guaranteed HA: capacity is reserved cluster-wide so all VMs are certain to restart",
      "Best-effort HA: VMs restart on surviving hosts only if free resources happen to be available",
      "No HA at all: failed VMs stay down until an admin manually powers them on",
      "Guaranteed HA using dedicated reserved hosts kept idle as standby"
    ],
    "answer": [
      1
    ],
    "explanation": "Out of the box AHV provides best-effort VM HA with no admission control: after a host failure Acropolis attempts to restart affected VMs wherever free capacity exists, but does not guarantee success. Guaranteed restart is opt-in and works by reserving segments of capacity, not by parking whole idle hosts.",
    "reference": "Prism Web Console Guide (VM High Availability in Acropolis)",
    "phoneHint": "I'm pretty sure it does try to restart your VMs by default but without any capacity guarantee, so the best-effort option, though double-check me.",
    "steveClue": "By default the hypervisor already attempts to bring failed VMs back up elsewhere, so the do-nothing option is wrong. But the default mode reserves no capacity and enforces no admission control, so a restart is attempted, not promised. The stronger guaranteed mode is opt-in and works by reserving segments of capacity rather than parking entire idle hosts.",
    "tags": [
      "ahv",
      "vm-ha",
      "high-availability",
      "reservation"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "PRISM-X-001",
    "domain": "prism",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "To make the management plane resilient to the loss of a single Prism Central VM, an admin converts a single-VM Prism Central into a scale-out deployment. How many Prism Central VMs does a scale-out Prism Central run?",
    "options": [
      "2",
      "4",
      "3",
      "5"
    ],
    "answer": [
      2
    ],
    "explanation": "Scale-out Prism Central runs as exactly 3 PC VMs, providing n+1 resiliency so the management plane survives the loss of one PC VM. A 2-VM design could not maintain a majority quorum, which is why 3 is the supported scale-out size.",
    "reference": "Prism Central Guide (Expanding / Scale Out Prism Central)",
    "phoneHint": "Clustered management planes usually want an odd number for quorum, so I'd go with three rather than two or four.",
    "steveClue": "A single management-plane VM is a single point of failure, so the resilient design clusters several instances and tolerates losing one (n+1). Quorum-based clusters need an odd number of members to break ties, and the smallest odd count above one that delivers n+1 is the supported size here. It is not two, and it is not five.",
    "tags": [
      "prism-central",
      "scale-out",
      "resiliency",
      "quorum"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "NET-X-001",
    "domain": "networking",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "While auditing VM NICs on an AHV cluster, an engineer wants to programmatically identify auto-generated (Acropolis-assigned) VM interfaces by their MAC address. Which OUI prefix does AHV use for automatically assigned VM MAC addresses?",
    "options": [
      "00:0c:29",
      "00:50:56",
      "00:1a:11",
      "50:6b:8d"
    ],
    "answer": [
      3
    ],
    "explanation": "AHV auto-assigns VM NIC MAC addresses from the Nutanix-owned OUI range 50:6b:8d:xx:xx:xx. The 00:0c:29 and 00:50:56 prefixes are VMware's, and 00:1a:11 belongs to Google, so those would not appear on Acropolis-generated NICs.",
    "reference": "AHV Administration Guide (MAC Address Prefix)",
    "phoneHint": "Honestly this is deep trivia, but I have a faint memory the Nutanix prefix starts with 50:6b, not any of the classic VMware ones.",
    "steveClue": "Every vendor auto-generates virtual NIC MACs from its own registered OUI, the first three octets of the address. Two of the prefixes on the list belong to a well-known competing virtualization vendor, and another to a large search company, so eliminate those. The correct block is the one registered to Nutanix itself.",
    "tags": [
      "ahv",
      "mac-address",
      "oui",
      "vnic",
      "networking"
    ],
    "reviewStatus": "verified",
    "impossible": true
  },
  {
    "id": "LCM-X-001",
    "domain": "lifecycle",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "An admin runs a BIOS/BMC firmware update through Life Cycle Manager (LCM). For firmware that requires the node to be taken fully offline, into which environment does LCM boot the host to apply the update?",
    "options": [
      "A Phoenix (CentOS/Linux) staging image booted on the node itself",
      "The Foundation imaging appliance running inside the CVM",
      "The hypervisor's own built-in recovery/maintenance shell",
      "A Genesis service instance running on a neighboring node"
    ],
    "answer": [
      0
    ],
    "explanation": "For firmware that cannot be applied live, LCM stages a Phoenix image on the node, puts the node in maintenance mode, and reboots it into Phoenix to flash the BIOS/BMC/HBA firmware before rebooting back into the hypervisor. Foundation is the imaging/deployment tool and Genesis is the cluster service manager, not the firmware staging environment.",
    "reference": "Life Cycle Manager Guide (firmware updates)",
    "phoneHint": "I remember the node reboots into a small special Linux environment to flash the firmware, and I'm fairly sure that environment is the one named after staging, not the imaging tool.",
    "steveClue": "Some firmware, such as BIOS and BMC, simply cannot be flashed while the hypervisor is running. So the update tool evacuates the node, puts it in maintenance mode, and reboots it into a small purpose-built Linux staging image dedicated to running the flash, then boots it back into the hypervisor. That staging image is distinct from the appliance used to first image and deploy nodes, and distinct from the service that supervises cluster processes.",
    "tags": [
      "lcm",
      "firmware",
      "phoenix",
      "upgrade",
      "maintenance-mode"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "MON-X-001",
    "domain": "monitoring",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "A security team requires that no audit log messages be silently dropped in transit to their SIEM, even during brief network congestion. Beyond plain UDP and TCP, which transport can a Nutanix cluster's remote syslog (rsyslog) configuration use to provide reliable, acknowledged log delivery?",
    "options": [
      "SCTP with multihoming",
      "GELF (Graylog Extended Log Format)",
      "RELP (Reliable Event Logging Protocol)",
      "Syslog-ng over QUIC"
    ],
    "answer": [
      2
    ],
    "explanation": "Nutanix ncli rsyslog-config supports UDP, TCP, and RELP; RELP adds application-level acknowledgements so buffered messages are not lost if the connection briefly resets. SCTP, QUIC, and GELF are not options exposed by the rsyslog configuration.",
    "reference": "AOS Advanced Administration Guide - Configuring Remote Syslog (ncli rsyslog-config)",
    "phoneHint": "I'm fairly sure it's that reliable-logging protocol, the third option, but syslog transports aren't my strong suit so confirm it.",
    "steveClue": "Plain UDP syslog is fire-and-forget, and even TCP can lose messages sitting in a buffer if the session resets. There is a purpose-built syslog transport whose entire reason for existing is per-message acknowledgement so nothing is dropped in flight. Nutanix exposes exactly that option alongside UDP and TCP.",
    "tags": [
      "monitoring",
      "syslog",
      "rsyslog",
      "RELP",
      "logging"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "MOVE-X-001",
    "domain": "migration",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "During a large VMware ESXi-to-AHV migration with Nutanix Move, the initial full seed of a VM's disks completes and Move then keeps the target in sync with minimal impact until cutover. Which source-side mechanism does Move rely on to transfer only the blocks that changed since the previous pass?",
    "options": [
      "AOS Cerebro lightweight snapshots on the source",
      "VMware Changed Block Tracking (CBT)",
      "rsync-style checksum comparison of each VMDK",
      "vSphere Replication configured on the source cluster"
    ],
    "answer": [
      1
    ],
    "explanation": "Move uses VADP/VDDK together with VMware Changed Block Tracking to read only changed blocks on each incremental pass, minimizing cutover downtime. Cerebro snapshots live on the Nutanix target side, not on ESXi sources, and Move requires neither vSphere Replication nor full-disk checksum scans.",
    "reference": "Nutanix Move User Guide - VMware Migration Architecture",
    "phoneHint": "Pretty confident it's the VMware change-tracking feature, the second option, though I always mix up the acronyms.",
    "steveClue": "Copying an entire multi-terabyte disk on every sync would make near-zero-downtime cutovers impossible. The trick is to let the source hypervisor report exactly which blocks were dirtied since the last read, so each incremental pass moves only deltas. This is a native vSphere data-protection capability, not anything running on the Nutanix side.",
    "tags": [
      "migration",
      "move",
      "cbt",
      "vddk",
      "incremental"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "NUS-X-001",
    "domain": "unifiedstorage",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "You are configuring an external Linux host to consume block storage from Nutanix Volumes over iSCSI, and you want target discovery plus transparent failover if the serving Controller VM goes down. Which address should the initiator be pointed at as its discovery portal?",
    "options": [
      "The Prism Element cluster virtual IP (VIP)",
      "The eth0 management IP of a specific CVM",
      "The AHV host's hypervisor management IP",
      "The cluster's iSCSI Data Services IP"
    ],
    "answer": [
      3
    ],
    "explanation": "The iSCSI Data Services IP (DSIP) is a floating address owned by one CVM at a time; initiators discover targets through it, and on a CVM failure the DSIP relocates and re-login redirects the session to a healthy CVM. Pointing initiators at a specific CVM interface or the Prism VIP defeats this redirection and is explicitly discouraged.",
    "reference": "Nutanix Volumes Guide - iSCSI Data Services IP Address",
    "phoneHint": "I think it's the dedicated data-services address, the last option, not the Prism VIP, but double-check the naming.",
    "steveClue": "The Prism virtual IP carries management traffic; block clients need a separate, floating address dedicated to data services. Because only one Controller VM owns that address at a time and it relocates on failure, the initiator always re-logs in through it and is steered to a live CVM. Never hard-code a client to an individual CVM's interface.",
    "tags": [
      "unifiedstorage",
      "volumes",
      "iscsi",
      "data-services-ip",
      "failover"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "SEC-X-001",
    "domain": "security",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "A CVM's security-hardened configuration drifts because an operator manually loosened a file permission. Nutanix's baseline framework detects this and automatically reverts it to the supported hardened value. Which configuration-management engine does this self-healing SCMA framework use under the hood?",
    "options": [
      "SaltStack",
      "Ansible",
      "Puppet",
      "Chef"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix Security Configuration Management Automation (SCMA) uses SaltStack to continuously inspect over a thousand security entities and self-heal the CVM/AHV baseline back to its STIG-hardened state. Ansible, Puppet, and Chef are common config-management tools but are not the engine behind SCMA.",
    "reference": "Nutanix Security Guide - Security Baseline and Self-Healing (SCMA)",
    "phoneHint": "I'm leaning toward the first one, SaltStack, but honestly all four are plausible config tools, so confirm it.",
    "steveClue": "Nutanix does not just harden the platform once; it re-checks well over a thousand security entities on a schedule and silently corrects any drift back to the baseline. That continuous enforcement is driven by an off-the-shelf configuration-management engine embedded in the controller VM. Recall which engine Nutanix has publicly said it standardized on for this.",
    "tags": [
      "security",
      "scma",
      "saltstack",
      "stig",
      "hardening"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "PERF-X-001",
    "domain": "performance",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "Background metadata scans in AOS drive maintenance tasks such as ILM tiering, disk balancing, and garbage collection. Left undisturbed by event-triggered runs, what are the default intervals for Curator's full scan and partial scan, respectively?",
    "options": [
      "Full scan every 24 hours; partial scan every 6 hours",
      "Full scan every 6 hours; partial scan every 1 hour",
      "Full scan every 1 hour; partial scan every 15 minutes",
      "Full scan every 12 hours; partial scan every 3 hours"
    ],
    "answer": [
      1
    ],
    "explanation": "By default Curator runs a full MapReduce scan about every 6 hours and a partial scan about every hour, in addition to urgent event-triggered scans. The other cadences are plausible-sounding but incorrect.",
    "reference": "The Nutanix Bible - AOS Storage (Curator); Nutanix KB on Curator scan types and frequency",
    "phoneHint": "I want to say six hours and one hour, the second option, but these exact timers are fuzzy for me.",
    "steveClue": "There are two periodic scan tiers plus urgent event-triggered runs. The heavier, cluster-wide pass happens only a few times per day, while the lighter pass runs several times more often to catch issues sooner. Anchor on the heavier one being on the order of a quarter-day and the lighter one being hourly.",
    "tags": [
      "performance",
      "curator",
      "full-scan",
      "partial-scan",
      "mapreduce"
    ],
    "reviewStatus": "verified",
    "impossible": true
  },
  {
    "id": "PERF-X-002",
    "domain": "performance",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "In a hybrid (SSD+HDD) Nutanix node, hot data stays on the SSD tier until the tier begins to fill. At what default SSD-tier utilization does DSF ILM begin down-migrating the coldest data to the HDD tier?",
    "options": [
      "50%",
      "90%",
      "75%",
      "95%"
    ],
    "answer": [
      2
    ],
    "explanation": "The default curator_tier_usage_ilm_threshold_percent is 75%; once SSD utilization crosses it, ILM down-migrates the least-recently-accessed data (chosen by last access time) to the HDD tier. A 90% or 95% threshold would leave too little low-latency headroom for incoming hot writes.",
    "reference": "The Nutanix Bible - AOS Storage (Disk Balancing / ILM)",
    "phoneHint": "I'm fairly sure it kicks in around three-quarters full, the third option, but the exact percent is from memory.",
    "steveClue": "ILM is not waiting until the fast tier is nearly full, since that would starve new hot writes of low-latency space. It leaves meaningful headroom, triggering down-migration once the SSD tier is roughly three-quarters used, and it evicts the coldest data by last-access time. Pick the threshold that preserves burst capacity.",
    "tags": [
      "performance",
      "ilm",
      "tiering",
      "ssd",
      "down-migration"
    ],
    "reviewStatus": "verified",
    "impossible": false
  },
  {
    "id": "FDN-E-001",
    "domain": "foundation",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A pallet of bare-metal Nutanix nodes has arrived and an administrator needs to install the hypervisor and AOS on them and build a cluster. Which tool is designed for this?",
    "options": [
      "Foundation",
      "Prism Central",
      "Life Cycle Manager (LCM)",
      "Nutanix Move"
    ],
    "answer": [
      0
    ],
    "explanation": "Foundation is the provisioning tool that images bare-metal nodes (installing the hypervisor and AOS) and then creates the cluster. LCM only updates software and firmware on an existing cluster, and Move migrates VMs, so neither performs initial imaging.",
    "reference": "Field Installation Guide (Foundation)",
    "phoneHint": "I'm pretty sure it's the first one, Foundation.",
    "steveClue": "",
    "tags": [
      "foundation",
      "imaging",
      "cluster-creation"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-E-002",
    "domain": "foundation",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator is sizing the smallest standard cluster that can tolerate a single node failure using redundancy factor 2. What is the minimum number of nodes?",
    "options": [
      "2",
      "3",
      "4",
      "5"
    ],
    "answer": [
      1
    ],
    "explanation": "Redundancy factor 2 requires a minimum of three nodes so that data and metadata copies can be placed on separate nodes and the cluster keeps a metadata quorum after one node is lost. A two-node cluster is a special ROBO case that additionally needs an external Witness.",
    "reference": "Prism Web Console Guide - Cluster Management",
    "phoneHint": "Fairly confident it's three - the second option.",
    "steveClue": "",
    "tags": [
      "redundancy-factor",
      "cluster-size",
      "rf2"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-E-003",
    "domain": "foundation",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "On each node in a Nutanix cluster, which component runs as a dedicated virtual machine and serves all storage I/O for the local hypervisor?",
    "options": [
      "The Controller VM (CVM)",
      "The Prism Central VM",
      "The Witness VM",
      "The Foundation VM"
    ],
    "answer": [
      0
    ],
    "explanation": "Every node runs a Controller VM (CVM) that hosts the Distributed Storage Fabric services (such as Stargate) and handles storage I/O for the VMs on that host. Prism Central, Witness, and Foundation are separate management or utility roles that do not serve node storage I/O.",
    "reference": "Nutanix Bible - AOS Architecture",
    "phoneHint": "I think it's the Controller VM, the first option.",
    "steveClue": "",
    "tags": [
      "cvm",
      "architecture",
      "storage-fabric"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-E-004",
    "domain": "foundation",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A remote office will run a two-node Nutanix cluster. What additional component must be deployed to arbitrate and preserve availability if the two nodes lose contact with each other?",
    "options": [
      "A Witness VM in a separate failure domain",
      "A third Controller VM on one of the nodes",
      "A second Prism Central instance",
      "A dedicated Foundation VM at the site"
    ],
    "answer": [
      0
    ],
    "explanation": "Two-node clusters require an external Witness VM, placed in a separate failure domain, to break ties and prevent split-brain if a node or the inter-node link fails. It is the same Witness role used by Metro Availability.",
    "reference": "Prism Web Console Guide - Two-Node Clusters",
    "phoneHint": "Pretty sure it's the Witness VM, the first option.",
    "steveClue": "",
    "tags": [
      "two-node",
      "witness",
      "robo"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-M-001",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When Foundation lists factory-imaged nodes that have never been assigned an IP address, how does it discover them, and what does this imply about placement?",
    "options": [
      "Via IPv6 link-local multicast, so Foundation must be on the same Layer 2 broadcast domain as the nodes",
      "Via a DNS SRV record, so the nodes must first be registered in DNS",
      "Via an IPv4 DHCP broadcast, so a DHCP server is required on the subnet",
      "Via Prism Central mDNS, so the nodes must already be registered to Prism Central"
    ],
    "answer": [
      0
    ],
    "explanation": "Unconfigured nodes have no routable IPv4 address yet, so Foundation discovers them using IPv6 link-local addressing, which only works within a single Layer 2 broadcast domain. That is why the Foundation host and the nodes must sit on the same subnet or VLAN for discovery to succeed.",
    "reference": "Field Installation Guide (Foundation)",
    "phoneHint": "I'm fairly sure it's the IPv6 link-local one, but confirm the Layer 2 part.",
    "steveClue": "",
    "tags": [
      "foundation",
      "discovery",
      "ipv6-link-local",
      "networking"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-M-002",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A customer wants their cluster to tolerate two simultaneous node failures using redundancy factor 3. What is the minimum number of nodes required?",
    "options": [
      "3",
      "4",
      "5",
      "6"
    ],
    "answer": [
      2
    ],
    "explanation": "Redundancy factor 3 keeps three copies of data and five copies of cluster metadata, so it requires a minimum of five nodes to place those copies on independent failure domains and survive two concurrent node losses. Redundancy factor 2 needs only three nodes.",
    "reference": "Prism Web Console Guide - Cluster Management",
    "phoneHint": "I think five is right for RF3 - the third option.",
    "steveClue": "",
    "tags": [
      "redundancy-factor",
      "rf3",
      "cluster-size",
      "fault-tolerance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-M-003",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A study group is debating Nutanix terminology. How do 'redundancy factor' and 'replication factor' differ?",
    "options": [
      "Redundancy factor is a cluster-wide metadata fault-tolerance setting; replication factor is the number of data copies per storage container",
      "They are identical terms that Nutanix uses interchangeably with no distinction",
      "Redundancy factor is the number of data copies; replication factor is the number of Witness VMs",
      "Redundancy factor applies only to AHV clusters; replication factor applies only to ESXi clusters"
    ],
    "answer": [
      0
    ],
    "explanation": "Redundancy factor is set at the cluster level and determines how many copies of cluster metadata and configuration (Cassandra and Zookeeper) are kept, and therefore how many failures the cluster survives. Replication factor is the per-container number of data copies (2 or 3), which cannot exceed what the cluster's redundancy factor allows.",
    "reference": "Nutanix Bible - Data Path Resiliency",
    "phoneHint": "Fairly confident it's the first option, about cluster metadata versus per-container data copies.",
    "steveClue": "",
    "tags": [
      "redundancy-factor",
      "replication-factor",
      "terminology"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-M-004",
    "domain": "foundation",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An organization must image nodes and build clusters at dozens of remote edge sites without sending staff or a laptop running Foundation to each location. Which capability best addresses this?",
    "options": [
      "Foundation Central, a service in Prism Central that orchestrates remote imaging and cluster creation",
      "The Foundation applet embedded in each CVM, run manually per site",
      "Life Cycle Manager (LCM) running from Prism Element",
      "The Prism Self-Service portal"
    ],
    "answer": [
      0
    ],
    "explanation": "Foundation Central runs within Prism Central and lets you image factory nodes and create clusters at remote sites centrally; the remote nodes reach Foundation Central (for example via DHCP options) and are deployed without an on-site Foundation instance. The CVM Foundation applet and LCM do not provide this centralized remote-site orchestration.",
    "reference": "Foundation Central Guide",
    "phoneHint": "I'm fairly sure it's Foundation Central, the first one.",
    "steveClue": "",
    "tags": [
      "foundation-central",
      "prism-central",
      "remote-sites",
      "edge"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-H-001",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator uses Prism's Expand Cluster workflow to add a node that shipped with a newer AOS and a different hypervisor build than the running cluster. What does the workflow do before the node joins?",
    "options": [
      "It can automatically re-image the node's hypervisor and AOS to match the existing cluster, then add it",
      "It rejects the node and requires the admin to downgrade it manually with LCM first",
      "It adds the node immediately and lets the two AOS versions coexist permanently",
      "It forces the entire cluster to upgrade to the new node's AOS version"
    ],
    "answer": [
      0
    ],
    "explanation": "Expand Cluster discovers the node over IPv6 link-local and, when versions differ, can image the node's hypervisor and AOS to match the cluster before adding it, keeping the cluster on one consistent version. It does not run mixed AOS versions permanently or force a cluster-wide upgrade just to admit a single node.",
    "reference": "Prism Web Console Guide - Expanding a Cluster",
    "phoneHint": "I lean toward the first one, that it re-images the node to match, but double-check me.",
    "steveClue": "Think about why a cluster wants every node on the same AOS and hypervisor build - mixed versions would complicate the distributed storage and management services. The add-node workflow is built to normalize an incoming node, and it reuses the same imaging engine that first built the cluster rather than refusing the node or dragging the whole cluster to a new version.",
    "tags": [
      "expand-cluster",
      "add-node",
      "imaging",
      "foundation"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-H-002",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A customer wants block awareness so that losing a full block (chassis) cannot make data unavailable at redundancy factor 2. Beyond enabling it, what is the key infrastructure requirement?",
    "options": [
      "At least three blocks, so copies can always be placed on separate blocks",
      "At least two blocks, since RF2 keeps only two data copies",
      "Exactly one node per block across the cluster",
      "A dedicated Witness VM to track block placement"
    ],
    "answer": [
      0
    ],
    "explanation": "Block awareness requires a minimum of three blocks at RF2 so that data, metadata (the Cassandra ring), and configuration (Zookeeper) copies can be distributed across separate blocks and survive losing an entire block. Two blocks are insufficient because the quorum-based metadata and Zookeeper services need three independent failure domains to keep a majority.",
    "reference": "Nutanix Bible - Availability Domains (Block Awareness)",
    "phoneHint": "I'm leaning toward three blocks, the first option, but I'm not fully certain.",
    "steveClue": "Block awareness is about spreading the copies you already keep for node failures across a coarser failure domain. Data at RF2 needs only two copies, but the cluster's metadata and quorum services need an odd number of independent homes to retain a majority after one domain is lost. Count the minimum failure domains those quorum services require, not just the number of data copies.",
    "tags": [
      "block-awareness",
      "availability-domain",
      "rf2",
      "resiliency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-H-003",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "In a healthy two-node cluster with a Witness, one node suddenly fails. What keeps the cluster serving I/O?",
    "options": [
      "The Witness arbitrates leadership to the surviving node, which continues in single-node mode and rebuilds redundancy across its local disks",
      "The Witness VM promotes itself to a third data-serving node until the failed node returns",
      "The cluster halts all I/O until both original nodes are back online",
      "The surviving node forwards all writes to the Witness VM for safekeeping"
    ],
    "answer": [
      0
    ],
    "explanation": "The Witness only arbitrates; it never stores or serves cluster data. When a node fails, the Witness grants leadership to the survivor, which keeps running (transitioning toward single-node operation) and restores redundancy across its own disks so two data copies are maintained within the remaining node. When the peer returns, the cluster resynchronizes and rebuilds two-node redundancy.",
    "reference": "Prism Web Console Guide - Two-Node Clusters",
    "phoneHint": "I think it's the first option - the Witness just arbitrates - but verify the single-node rebuild detail.",
    "steveClue": "Keep the Witness's job narrow: it is a tie-breaker, not a storage device, so any option that has it holding or serving data is wrong. With one node gone, the survivor must still honor two copies of data somehow, which it can only do using the disks it still has. Picture the cluster degrading gracefully to a single node rather than stopping.",
    "tags": [
      "two-node",
      "witness",
      "failure-handling",
      "robo"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "FDN-H-004",
    "domain": "foundation",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A single-node Nutanix cluster is deployed as a ROBO backup target. Which statement about its data resiliency is correct?",
    "options": [
      "It keeps two data copies on separate disks within the node, so it survives a disk failure but not loss of the node",
      "It stores only one copy of data, so any single disk failure causes data loss",
      "It requires a Witness VM in order to tolerate disk failures",
      "It automatically replicates every write to Prism Central for redundancy"
    ],
    "answer": [
      0
    ],
    "explanation": "A single-node cluster still operates at RF2 by keeping two copies of each data block on different disks within the same node, so it tolerates a drive failure and can rebuild if free capacity allows. It cannot survive loss of the node itself, and unlike a two-node cluster it does not use a Witness.",
    "reference": "Prism Web Console Guide - Single-Node Clusters",
    "phoneHint": "I'm fairly sure it's the first one, about two copies on separate disks, but confirm.",
    "steveClue": "Even with one physical node, the storage fabric still wants the same number of copies it would keep anywhere else; it just has to find separate homes for them inside the single chassis. Ask what the smallest independent failure unit is when there is only one node, and what kind of failure that protects against versus what it fundamentally cannot.",
    "tags": [
      "single-node",
      "robo",
      "resiliency",
      "replication-factor"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-E-001",
    "domain": "lifecycle",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants a single Prism tool that inventories the firmware and software versions running across the cluster and applies available updates. Which feature provides this?",
    "options": [
      "Foundation",
      "Life Cycle Manager (LCM)",
      "Nutanix Cluster Check (NCC)",
      "Prism Central Playbooks"
    ],
    "answer": [
      1
    ],
    "explanation": "LCM inventories installed firmware and software versions and applies updates from one interface. Foundation images nodes, NCC runs health checks, and Playbooks automate operational tasks.",
    "reference": "Acropolis Life Cycle Manager Guide",
    "phoneHint": "Pretty sure it's LCM - the second option, that's the update manager.",
    "steveClue": "",
    "tags": [
      "lcm",
      "inventory",
      "updates"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-E-002",
    "domain": "lifecycle",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A new administrator asks whether LCM only handles software like AOS, or also device firmware such as BIOS and disk firmware. Which statement is correct?",
    "options": [
      "LCM manages both software components and device firmware",
      "LCM manages only software; firmware needs a manual vendor tool",
      "LCM manages only firmware; software uses a separate portal",
      "LCM manages neither; all updates are run from the CVM CLI"
    ],
    "answer": [
      0
    ],
    "explanation": "LCM is a unified framework covering both software (AOS, NCC, Foundation, AHV) and device firmware (BIOS, BMC, disk, HBA, NIC), so a single tool tracks and updates both.",
    "reference": "Acropolis Life Cycle Manager Guide",
    "phoneHint": "I think it does both - firmware and software - so the first option.",
    "steveClue": "",
    "tags": [
      "lcm",
      "firmware",
      "software"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-E-003",
    "domain": "lifecycle",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator selects an AOS target version and clicks Upgrade in Prism. Which statement best describes the '1-click' AOS upgrade?",
    "options": [
      "The admin must manually SSH to each CVM and run the installer",
      "The cluster must be fully shut down before AOS can be upgraded",
      "Prism orchestrates the AOS upgrade across all nodes automatically",
      "Only one node is upgraded; the rest must be done later by hand"
    ],
    "answer": [
      2
    ],
    "explanation": "The 1-click upgrade orchestrates the AOS software upgrade across the whole cluster automatically, without per-node manual installation or a cluster shutdown.",
    "reference": "Prism Web Console Guide - Software and Firmware Upgrades",
    "phoneHint": "The point of 1-click is automation - I'd say the third one.",
    "steveClue": "",
    "tags": [
      "aos",
      "one-click",
      "upgrade"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-E-004",
    "domain": "lifecycle",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "During an AOS upgrade an administrator notices the cluster stays online and VMs keep running. How does AOS apply the upgrade to achieve this?",
    "options": [
      "It upgrades and reboots one node at a time in a rolling fashion",
      "It upgrades all nodes simultaneously during a maintenance window",
      "It requires powering off all user VMs first",
      "It clones the cluster and switches over when finished"
    ],
    "answer": [
      0
    ],
    "explanation": "AOS upgrades are rolling: each CVM is upgraded and restarted one at a time while the other nodes keep serving I/O, so the cluster and its VMs stay online.",
    "reference": "Prism Web Console Guide - Software and Firmware Upgrades",
    "phoneHint": "Rolling, one node at a time - first option, I'm fairly confident.",
    "steveClue": "",
    "tags": [
      "rolling-upgrade",
      "aos",
      "availability"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-M-001",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator opens LCM to apply firmware updates but sees no available updates listed. Which operation must run first so LCM can determine what is installed and what applies?",
    "options": [
      "Foundation imaging",
      "Cluster expansion",
      "Genesis restart",
      "Inventory"
    ],
    "answer": [
      3
    ],
    "explanation": "LCM must run an Inventory operation to detect current component versions and query the update source; only then does it present the applicable updates.",
    "reference": "Acropolis Life Cycle Manager Guide",
    "phoneHint": "You run Inventory first - I think that's the last option here.",
    "steveClue": "",
    "tags": [
      "lcm",
      "inventory"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-M-002",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A cluster in a secure facility has no internet access. How can the administrator still use LCM to update firmware and software?",
    "options": [
      "Configure LCM to use a local (dark-site) web server hosting the LCM bundles",
      "LCM cannot be used without internet; use manual firmware tools only",
      "Temporarily open a direct path from the CVMs to the Nutanix portal",
      "Copy updates onto USB drives and insert them into each node"
    ],
    "answer": [
      0
    ],
    "explanation": "For dark sites you host the LCM framework and update bundles on a local web server and point LCM at it, so updates work without any direct internet access.",
    "reference": "Acropolis Life Cycle Manager Guide - Dark Site Deployment",
    "phoneHint": "I'm fairly sure you set up a local web server for dark sites - first option.",
    "steveClue": "",
    "tags": [
      "lcm",
      "dark-site",
      "local-web-server"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-M-003",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is unsure whether to use Foundation or LCM for a task. Which statement correctly distinguishes their primary roles?",
    "options": [
      "Both perform identical functions and are interchangeable",
      "Foundation updates firmware on running clusters; LCM images bare-metal nodes",
      "Foundation images and provisions nodes to build clusters; LCM updates an existing cluster's software and firmware",
      "Foundation runs health checks; LCM creates user VMs"
    ],
    "answer": [
      2
    ],
    "explanation": "Foundation handles bare-metal imaging and initial cluster creation/expansion, while LCM manages lifecycle updates (software and firmware) of an already-running cluster.",
    "reference": "Field Installation Guide (Foundation); Acropolis Life Cycle Manager Guide",
    "phoneHint": "Foundation builds and images, LCM updates - that's the third option.",
    "steveClue": "",
    "tags": [
      "foundation",
      "lcm",
      "roles"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-M-004",
    "domain": "lifecycle",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Before starting a major AOS upgrade, which action is the recommended best practice to validate cluster health first?",
    "options": [
      "Delete old snapshots to free up space",
      "Run a full NCC health check and resolve any critical failures",
      "Disable data resiliency to speed up the upgrade",
      "Reboot every CVM to clear memory"
    ],
    "answer": [
      1
    ],
    "explanation": "Running Nutanix Cluster Check (NCC) before an upgrade surfaces health issues that could cause it to fail. Disabling resiliency or rebooting CVMs is never recommended and does not validate health.",
    "reference": "Prism Web Console Guide; Nutanix Cluster Check (NCC) Guide",
    "phoneHint": "Run NCC first - the second option, I'm fairly sure.",
    "steveClue": "",
    "tags": [
      "ncc",
      "pre-upgrade",
      "health-check"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-H-001",
    "domain": "lifecycle",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "During a rolling AOS upgrade, one CVM is offline while it restarts. Which mechanism ensures user VMs on that host still have storage access throughout?",
    "options": [
      "Data Path Redundancy redirects that host's I/O to a healthy peer CVM while replica copies serve the data",
      "The user VMs are paused until their local CVM returns",
      "All data is cached in the host's RAM during the CVM restart",
      "The node's disks are temporarily mounted directly by the hypervisor"
    ],
    "answer": [
      0
    ],
    "explanation": "When a local CVM is down, Data Path Redundancy transparently reroutes that host's storage I/O to another CVM, and because AOS keeps redundant replicas (RF2/RF3) the data stays available - so VMs are not paused.",
    "reference": "AOS Storage Guide / Nutanix Bible - Data Path Redundancy",
    "phoneHint": "Something about redirecting I/O to another CVM using the replicas - I'd lean the first option but check me.",
    "steveClue": "Think about a host whose local CVM is briefly gone. Nutanix keeps multiple copies of every block on different nodes (the replication factor), and the storage stack can reroute that host's I/O to a peer controller. Nothing has to pause because another copy is always reachable.",
    "tags": [
      "data-path-redundancy",
      "rolling-upgrade",
      "resiliency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-H-002",
    "domain": "lifecycle",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator initiates an AHV hypervisor upgrade through LCM on a running cluster. What happens to the user VMs on a host as it is being upgraded?",
    "options": [
      "They are powered off, then powered back on after the host reboots",
      "They keep running on the host during its reboot with no interruption",
      "They are deleted and recreated from templates on other hosts",
      "They are live-migrated to other hosts, then the host enters maintenance mode and reboots"
    ],
    "answer": [
      3
    ],
    "explanation": "LCM places the host in maintenance mode, which live-migrates its running VMs to other hosts before upgrading and rebooting it; the VMs are not powered off. This is why the cluster needs spare capacity to absorb them.",
    "reference": "AHV Administration Guide; Acropolis Life Cycle Manager Guide",
    "phoneHint": "VMs get live-migrated off before the host reboots - I'd lean the last option.",
    "steveClue": "Consider how a hypervisor host can reboot without dropping its workloads. AHV can move running VMs between hosts without powering them off, and the upgrade uses a maintenance mode that evacuates the host first. The catch is that other hosts must have room to receive those VMs.",
    "tags": [
      "ahv",
      "hypervisor-upgrade",
      "live-migration",
      "maintenance-mode"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-H-003",
    "domain": "lifecycle",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator runs LCM inventory and, before any component updates are offered, LCM performs an update on itself. Why does LCM update its own framework first?",
    "options": [
      "It is upgrading AOS, which is bundled inside the LCM framework",
      "The framework must be current to correctly detect components and apply the latest update modules",
      "The self-update reboots the cluster, which must happen before other updates",
      "It replaces Foundation, which LCM depends on to image nodes"
    ],
    "answer": [
      1
    ],
    "explanation": "LCM refreshes its own framework first so it has the newest detection logic and update modules to accurately inventory components and apply later updates; the framework update does not upgrade AOS or reboot the cluster.",
    "reference": "Acropolis Life Cycle Manager Guide - LCM Framework Updates",
    "phoneHint": "It refreshes itself so it has the latest logic first - I think the second option.",
    "steveClue": "Ask why a tool would patch itself before patching anything else. LCM's detection and update logic lives in modules that ship separately from any product; if that logic is stale it might misread versions or miss newly supported components. Bringing the framework current is a prerequisite step, not an AOS or cluster-level change.",
    "tags": [
      "lcm",
      "framework-update",
      "upgrade-order"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "LCM-H-004",
    "domain": "lifecycle",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "When multiple components are selected in LCM, how does it handle dependencies such as AOS and AHV needing compatible versions?",
    "options": [
      "The administrator must manually calculate and enforce the correct order",
      "LCM applies all selected updates in parallel regardless of dependencies",
      "LCM sequences the updates automatically to satisfy dependency and compatibility ordering",
      "LCM ignores compatibility and relies on the admin to pick valid versions"
    ],
    "answer": [
      2
    ],
    "explanation": "LCM understands inter-component dependencies and orders the selected updates so compatibility is maintained (for example, ensuring the running AOS supports the target AHV) rather than leaving the sequencing to the operator.",
    "reference": "Acropolis Life Cycle Manager Guide",
    "phoneHint": "LCM figures out the order for you - that's the third option.",
    "steveClue": "Consider why you can queue several updates at once and trust the result. Certain components have version compatibility relationships - a hypervisor version must be supported by the running storage OS, for instance. The lifecycle tool encodes those relationships and schedules the operations in a safe sequence instead of leaving ordering to you.",
    "tags": [
      "lcm",
      "dependencies",
      "upgrade-order",
      "compatibility"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-E-001",
    "domain": "migration",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants to migrate virtual machines from a VMware ESXi cluster onto a Nutanix AHV cluster with minimal manual effort. Which Nutanix tool is purpose-built for this task?",
    "options": [
      "Nutanix Foundation",
      "Prism Central",
      "Nutanix Move",
      "Nutanix Life Cycle Manager (LCM)"
    ],
    "answer": [
      2
    ],
    "explanation": "Nutanix Move is the free, purpose-built migration appliance for moving VMs between hypervisors and clouds onto AHV (or ESXi). Foundation images/deploys nodes, LCM handles firmware/software upgrades, and Prism Central is multi-cluster management - none of those perform VM migrations.",
    "reference": "Nutanix Move User Guide",
    "phoneHint": "I'm pretty confident it's the tool literally called 'Move' - the third option.",
    "steveClue": "",
    "tags": [
      "move",
      "architecture",
      "migration-tool"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-E-002",
    "domain": "migration",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A team is planning a migration project and asks how Nutanix Move is deployed in their environment. In what form does Move run?",
    "options": [
      "As a downloadable virtual appliance (VM) deployed on the cluster",
      "As a service that is always enabled inside every CVM",
      "As a physical hardware appliance shipped by Nutanix",
      "As a browser plug-in installed on the admin workstation"
    ],
    "answer": [
      0
    ],
    "explanation": "Move is distributed as a lightweight virtual appliance (a VM) that you deploy on an AHV or ESXi cluster and manage through its own web UI. It is not built into the CVM, not a physical appliance, and not a browser plug-in.",
    "reference": "Nutanix Move User Guide - Deploying Move",
    "phoneHint": "I think it's the first one - the virtual appliance you download and deploy as a VM.",
    "steveClue": "",
    "tags": [
      "move",
      "appliance",
      "deployment"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-E-003",
    "domain": "migration",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator is describing Nutanix Move to colleagues and emphasizes that it does not require installing migration software inside each guest VM beforehand. What characteristic of Move is being described?",
    "options": [
      "It requires a persistent kernel agent in every VM",
      "It only migrates powered-off VMs",
      "It clones VMs by exporting them to OVF manually",
      "It performs agentless migration"
    ],
    "answer": [
      3
    ],
    "explanation": "Move performs agentless migration - it connects to the source environment's management layer (for example vCenter) rather than requiring a permanent agent installed in each guest. This is a key reason Move simplifies large migrations.",
    "reference": "Nutanix Move User Guide",
    "phoneHint": "Pretty sure it's the last one, agentless - that's Move's whole selling point.",
    "steveClue": "",
    "tags": [
      "move",
      "agentless",
      "architecture"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-E-004",
    "domain": "migration",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Before any data is copied, a Move migration plan requires the administrator to define two endpoints. What are these two endpoints called?",
    "options": [
      "A primary site and a witness site",
      "A source environment and a target environment",
      "A protection domain and a remote site",
      "A metro cluster and a stretch VLAN"
    ],
    "answer": [
      1
    ],
    "explanation": "A Move migration plan is built by adding a source environment (for example ESXi/vCenter, Hyper-V, or AWS) and a target environment (typically an AHV cluster), then selecting the VMs to migrate between them. The other terms belong to disaster-recovery and metro-availability features, not Move.",
    "reference": "Nutanix Move User Guide - Adding Environments",
    "phoneHint": "I'd go with the second one, source and target - that's the natural pair for a migration.",
    "steveClue": "",
    "tags": [
      "move",
      "source",
      "target",
      "migration-plan"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-M-001",
    "domain": "migration",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "During a Move migration from ESXi to AHV, the guest OS boots on AHV using VirtIO devices and its VMware Tools are removed. When does Move perform this in-guest preparation by default?",
    "options": [
      "Only if the administrator manually runs a script inside each VM first",
      "After cutover, requiring a second reboot initiated by the admin",
      "Automatically as part of the migration, when guest credentials are provided",
      "Never - the administrator must install VirtIO by hand before seeding"
    ],
    "answer": [
      2
    ],
    "explanation": "When valid guest credentials are supplied, Move performs automatic in-guest preparation - installing the VirtIO drivers needed to boot on AHV and uninstalling VMware Tools - so the VM boots cleanly after cutover. Without credentials, Move can fall back to manual preparation, but the default automated path handles it for you.",
    "reference": "Nutanix Move User Guide - Automatic Guest Preparation",
    "phoneHint": "I believe Move does it automatically when you give it the guest login - the third option.",
    "steveClue": "",
    "tags": [
      "move",
      "virtio",
      "vmware-tools",
      "guest-preparation"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-M-002",
    "domain": "migration",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator seeds several large VMs with Move and, over the following days, the source VMs keep changing. How does Move keep the target copy current while the source stays online, so that cutover only transfers a small final delta?",
    "options": [
      "It re-copies every disk in full on each sync interval",
      "It uses changed-block tracking to copy only blocks modified since the last sync",
      "It quiesces the source VM and blocks all writes during seeding",
      "It relies on the guest OS to email changed files to the appliance"
    ],
    "answer": [
      1
    ],
    "explanation": "Move leverages changed-block tracking (CBT) on the source so that after the initial full seed, each incremental sync copies only the blocks that changed. This keeps the target nearly in sync while the source keeps running, minimizing the data - and therefore downtime - at cutover.",
    "reference": "Nutanix Move User Guide - Data Seeding and Cutover",
    "phoneHint": "I'm fairly sure it's changed-block tracking, the second one - copying only the deltas - but double-check me.",
    "steveClue": "",
    "tags": [
      "move",
      "changed-block-tracking",
      "seeding",
      "incremental"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-M-003",
    "domain": "migration",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A migration must run during business hours, and the network team is worried Move's data copy will saturate the link between the source and the Nutanix cluster. Which Move capability directly addresses this concern?",
    "options": [
      "Deduplication of the guest file system",
      "Compression of the Move appliance logs",
      "Network bandwidth throttling on the migration plan",
      "Erasure coding of the migrated vdisks"
    ],
    "answer": [
      2
    ],
    "explanation": "Move lets you configure bandwidth throttling so the data-seeding traffic is capped, protecting production links during business hours. Dedup, compression, and erasure coding are storage-efficiency features unrelated to controlling migration link utilization.",
    "reference": "Nutanix Move User Guide - Bandwidth Throttling",
    "phoneHint": "The throttling option lines up with a bandwidth worry - I'd pick the third one.",
    "steveClue": "",
    "tags": [
      "move",
      "bandwidth",
      "throttling",
      "network"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-M-004",
    "domain": "migration",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator lists the phases a Move migration plan proceeds through for each VM. Which sequence correctly reflects the Move workflow?",
    "options": [
      "Source preparation, then data seeding, then cutover",
      "Cutover, then data seeding, then validation",
      "Data seeding, then rollback, then source preparation",
      "Cutover, then source preparation, then seeding"
    ],
    "answer": [
      0
    ],
    "explanation": "A Move plan first prepares the source and validates it, then performs data seeding (the initial full copy plus incremental syncs), and finally cutover, where the source is powered off, a last delta is copied, and the VM starts on AHV. The other orderings put cutover or rollback before the copy has completed, which is not how the workflow runs.",
    "reference": "Nutanix Move User Guide - Migration Plan Lifecycle",
    "phoneHint": "The logical order is prepare, copy, then cut over - so the first one.",
    "steveClue": "",
    "tags": [
      "move",
      "phases",
      "seeding",
      "cutover",
      "workflow"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-H-001",
    "domain": "migration",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A migrated application uses licensing tied to the VM's network adapter identity, and the app team insists nothing about the NIC change after moving to AHV. When configuring the Move migration plan, which setting preserves this identity?",
    "options": [
      "Enable changed-block tracking on the target NIC",
      "Retain the original MAC addresses rather than regenerate them",
      "Set the target network to an unmanaged VLAN",
      "Assign a new static IP from the AHV IPAM pool"
    ],
    "answer": [
      1
    ],
    "explanation": "Move offers an option to retain the source VM's MAC addresses instead of generating new ones. Retaining the MAC preserves adapter identity so MAC-bound licensing keeps working, whereas regenerating would break it. IPAM and VLAN choices affect addressing, not the hardware MAC that the licensing checks.",
    "reference": "Nutanix Move User Guide - Migration Plan Network Settings",
    "phoneHint": "Something about keeping the original MAC rings a bell - I'd lean to the second one, but I'm not certain.",
    "steveClue": "Ethernet adapters carry a hardware-layer address that is separate from any IP assignment. Some software binds its license or its ARP-dependent behavior to that lower-layer identifier, so if the migration hands the guest a freshly generated one, that binding breaks. A well-designed migration tool therefore lets you decide whether that identifier should carry over unchanged or be created anew.",
    "tags": [
      "move",
      "mac-address",
      "retain",
      "regenerate",
      "network"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-H-002",
    "domain": "migration",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Before committing to cutover for a business-critical VM, an administrator wants to confirm the migrated copy actually boots and behaves correctly on AHV without disrupting the still-running source. Which Move capability supports this?",
    "options": [
      "Delete the migration plan and recreate it to force a fresh boot",
      "Run a test/validation of the migrated VM on the target before cutover",
      "Power off the source VM early to free its MAC address",
      "Switch the plan from agentless to agent-based mode"
    ],
    "answer": [
      1
    ],
    "explanation": "Move can validate the migrated VM by test-booting it on the target so you can verify it comes up correctly, all while the source keeps running and serving users. This de-risks the actual cutover. Powering off the source early would cause the very downtime the test is meant to avoid.",
    "reference": "Nutanix Move User Guide - Validating a Migration",
    "phoneHint": "I think there's a test/validate step before cutover - I'd go the second option, but verify.",
    "steveClue": "The whole point of seeding data while the source keeps running is that you can rehearse the destination without touching production. A careful migrator wants proof the copy powers on and the application responds before the irreversible switch, and does so in a way that leaves the live workload untouched. Look for the option that exercises the target copy while the original still serves users.",
    "tags": [
      "move",
      "test",
      "validation",
      "cutover",
      "pre-cutover"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-H-003",
    "domain": "migration",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A cutover to AHV completed, but the application team reports the migrated VM misbehaves and wants to fall back to the original. From a rollback-planning standpoint, what is the safest practice Move relies on to make this possible?",
    "options": [
      "Move automatically reverses all copied blocks back to the source",
      "Rollback restores the VM from a Prism protection-domain snapshot",
      "The source VM is left intact and powered off at cutover, so it can be powered back on",
      "The target VM is deleted and re-seeded from scratch to recover"
    ],
    "answer": [
      2
    ],
    "explanation": "At cutover Move powers off the source VM but does not delete it, so the original remains available as a fallback if the migrated VM has problems. There is no automatic reverse-sync of data back to the source; sound rollback planning depends on keeping the untouched source VM until the migration is fully validated.",
    "reference": "Nutanix Move User Guide - Cutover and Rollback Considerations",
    "phoneHint": "I'm fairly sure the source is just powered off and kept around as a fallback - the third option - but confirm.",
    "steveClue": "A safe migration never destroys the original at the moment of switchover. Because the tool has been copying data one direction only, there is no automatic way to push changes back the other way once you commit. Your recovery path is therefore the pristine, powered-down original, which is exactly why you should not delete it until the new copy has proven itself.",
    "tags": [
      "move",
      "rollback",
      "cutover",
      "source-vm",
      "recovery"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MOVE-H-004",
    "domain": "migration",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "An architect is scoping which environments a single Nutanix Move deployment can migrate FROM into an AHV target. Which of the following are supported source environments for Move? (Select all that apply.)",
    "options": [
      "VMware ESXi / vCenter",
      "Microsoft Hyper-V",
      "IBM mainframe LPARs",
      "Amazon Web Services EC2 instances"
    ],
    "answer": [
      0,
      1,
      3
    ],
    "explanation": "Move supports migrating from VMware ESXi/vCenter, Microsoft Hyper-V, and AWS EC2 (among other sources) into AHV. IBM mainframe LPARs are not a supported Move source - Move targets x86 hypervisor and public-cloud workloads, not mainframe partitions.",
    "reference": "Nutanix Move Support Matrix",
    "phoneHint": "I'm confident about ESXi, Hyper-V, and AWS being supported; the mainframe one sounds wrong. Skip the LPAR option.",
    "steveClue": "Move is built to consolidate mainstream x86 virtualization and public-cloud compute onto AHV. Think about which platforms run the commodity guest operating systems Move knows how to re-driver and re-boot: the major on-prem hypervisors and a leading public cloud's instance service all qualify. A legacy big-iron partitioning technology running non-x86 workloads is outside that scope.",
    "tags": [
      "move",
      "sources",
      "esxi",
      "hyper-v",
      "aws",
      "support-matrix"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-E-001",
    "domain": "monitoring",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants to proactively surface configuration, hardware, and performance issues on a Nutanix cluster before they cause an outage. Which built-in utility runs a broad battery of health checks against cluster components?",
    "options": [
      "NCC (Nutanix Cluster Check)",
      "Foundation",
      "Logbay",
      "Prism Central Playbooks"
    ],
    "answer": [
      0
    ],
    "explanation": "NCC (Nutanix Cluster Check) is the diagnostic framework that runs hundreds of health checks across hardware, AOS services, and configuration. Foundation is for imaging/deploying nodes, and Logbay only collects log bundles rather than evaluating health.",
    "reference": "Nutanix NCC Guide",
    "phoneHint": "Pretty sure it's the first one, NCC, that's literally the cluster health checker.",
    "steveClue": "",
    "tags": [
      "ncc",
      "health-checks",
      "diagnostics"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-E-002",
    "domain": "monitoring",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "From an SSH session on a Controller VM, which command runs the complete set of NCC health checks on the cluster?",
    "options": [
      "ncc health_checks run_all",
      "cluster status",
      "ncli health check-all",
      "allssh run ncc"
    ],
    "answer": [
      0
    ],
    "explanation": "The full check suite is launched with 'ncc health_checks run_all' from any CVM. 'cluster status' reports AOS service state, not health checks, and the other two are not valid NCC commands.",
    "reference": "Nutanix NCC Guide - Running NCC Checks",
    "phoneHint": "I'd go with the 'ncc health_checks run_all' one, that phrasing sounds exactly right.",
    "steveClue": "",
    "tags": [
      "ncc",
      "cli",
      "cvm"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-E-003",
    "domain": "monitoring",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "In Prism, what best distinguishes an event from an alert?",
    "options": [
      "An event records a routine cluster status change and needs no action by itself, while an alert flags a condition that warrants attention",
      "An event is always a higher severity than an alert",
      "Events exist only in Prism Central while alerts exist only in Prism Element",
      "Events must be acknowledged manually while alerts always clear on their own"
    ],
    "answer": [
      0
    ],
    "explanation": "Events are informational records of state changes or actions in the cluster and generally require no response, whereas alerts are raised when a monitored condition needs administrator attention. Severity, location, and acknowledgment behavior are not what separates the two.",
    "reference": "Prism Web Console Guide - Alert and Event Monitoring",
    "phoneHint": "First option feels right, event is just a log of something happening, alert is the one that needs you to act.",
    "steveClue": "",
    "tags": [
      "alerts",
      "events",
      "monitoring"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-E-004",
    "domain": "monitoring",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Without using the CLI, an administrator wants to launch the NCC health checks from the Prism Element web interface. From which dashboard is the 'Run Checks' action available?",
    "options": [
      "Health dashboard",
      "Home dashboard",
      "Storage dashboard",
      "Settings > Cluster Details"
    ],
    "answer": [
      0
    ],
    "explanation": "The Health dashboard's Actions menu provides 'Run Checks' (and 'Collect Logs') so NCC can be run from the GUI instead of a CVM shell. The Home and Storage dashboards summarize status but do not launch NCC.",
    "reference": "Prism Web Console Guide - Health Monitoring",
    "phoneHint": "I think it's the Health dashboard, that's where all the check and log-collect actions live.",
    "steveClue": "",
    "tags": [
      "ncc",
      "prism",
      "health-dashboard"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-M-001",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When reviewing and configuring alert policies in Prism, which set correctly lists the three severity levels Nutanix assigns to alerts?",
    "options": [
      "Critical, Warning, Info",
      "Critical, Major, Minor",
      "High, Medium, Low",
      "Fatal, Error, Warning"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix classifies alerts as Critical, Warning, or Info, and policies can be enabled or filtered by these levels. The other groupings borrow from other vendors' schemes and are not used by Prism.",
    "reference": "Prism Alerts Reference - Alert Policies",
    "phoneHint": "Fairly confident it's Critical, Warning, Info, that's the Nutanix wording.",
    "steveClue": "",
    "tags": [
      "alerts",
      "severity",
      "alert-policy"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-M-002",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Support asks an administrator to gather a diagnostic log bundle spanning several hours across all nodes of the cluster. Which current Nutanix utility is purpose-built for this log collection?",
    "options": [
      "Logbay",
      "Genesis",
      "Curator",
      "Foundation"
    ],
    "answer": [
      0
    ],
    "explanation": "Logbay is the NCC log-collection framework that gathers and bundles logs across the cluster (superseding the older log_collector). Genesis manages cluster services, Curator runs background storage scans, and Foundation images nodes.",
    "reference": "NCC Guide - Log Collection (Logbay)",
    "phoneHint": "Go with Logbay, the name basically gives it away as the log tool.",
    "steveClue": "",
    "tags": [
      "logbay",
      "log-collection",
      "ncc"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-M-003",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator must forward AOS, audit, and API request logs from a cluster to a central SIEM. What must be configured on the cluster to enable this forwarding?",
    "options": [
      "A remote syslog (rsyslog) server entry specifying the modules and minimum severity levels to forward",
      "An SNMP v3 trap receiver",
      "An SMTP relay under the email alert settings",
      "A Prism Central category applied to each host"
    ],
    "answer": [
      0
    ],
    "explanation": "Log forwarding to a SIEM is done by configuring a remote syslog (rsyslog) server, where you select which modules to send and the minimum severity. SNMP traps and SMTP carry alerts, not the underlying log streams, and categories are for policy grouping.",
    "reference": "Prism Web Console Guide - Configuring Syslog",
    "phoneHint": "Sounds like the remote syslog / rsyslog option to me, that's the log-forwarding one.",
    "steveClue": "",
    "tags": [
      "syslog",
      "rsyslog",
      "log-forwarding",
      "siem"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-M-004",
    "domain": "monitoring",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator notices that certain alerts disappear from the Alerts page on their own once the underlying condition is no longer present, without anyone clearing them. Which Prism capability explains this?",
    "options": [
      "Auto-resolve, where eligible alerts clear automatically once the condition stops recurring",
      "Alert acknowledgment",
      "Severity-based alert suppression",
      "Alert throttling"
    ],
    "answer": [
      0
    ],
    "explanation": "Many alert policies support auto-resolve, so the alert is cleared automatically when the triggering condition has not recurred. Acknowledgment only marks an alert as seen (it stays until resolved), while suppression and throttling control whether/how often alerts are raised.",
    "reference": "Prism Central Alerts Reference - Alert Policies",
    "phoneHint": "I'd pick auto-resolve, that's the feature where they clear themselves.",
    "steveClue": "",
    "tags": [
      "alerts",
      "auto-resolve",
      "alert-policy"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-H-001",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator is configuring SNMP monitoring directly on a Nutanix cluster through Prism. Which statement most accurately describes AOS SNMP support?",
    "options": [
      "SNMP v2c and v3 are supported (v2c is for traps only); SNMP v1 is not supported",
      "Only SNMP v1 and v2c are supported",
      "SNMP v1, v2c, and v3 are all fully supported for both GET and traps",
      "Only SNMP v3 is supported, and only for GET operations"
    ],
    "answer": [
      0
    ],
    "explanation": "AOS supports SNMP v2c and v3 but not v1, and for v2c only traps are supported (no GET/polling). Full GET plus trap support requires SNMP v3 with a configured user, which is why the v3-based user/auth/priv model appears in the Prism SNMP page.",
    "reference": "Prism Web Console Guide - Configuring SNMP",
    "phoneHint": "I lean toward the first one, something about v2c being trap-only and no v1, but sanity-check the versions.",
    "steveClue": "Nutanix deliberately dropped legacy SNMP v1. The v2c implementation is limited to sending traps outbound, so a monitoring station cannot poll (GET) the cluster over v2c. To both poll metrics and receive traps you must use SNMP v3, which is why the Prism SNMP configuration is built around v3 users with authentication and privacy settings and an engine ID.",
    "tags": [
      "snmp",
      "monitoring",
      "traps",
      "versions"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-H-002",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A performance engineer wants to overlay CVM CPU usage and cluster IOPS on a single time-series graph over a custom time window to correlate them. Which Prism feature is designed for this?",
    "options": [
      "Build a metric chart on the Analysis dashboard",
      "Read the Health dashboard summary tiles",
      "Define a new alert policy",
      "Open the Hardware diagram view"
    ],
    "answer": [
      0
    ],
    "explanation": "The Analysis dashboard lets you create metric charts (and entity charts) that plot chosen metrics over a selectable time range so they can be compared on one graph. The Health dashboard and Hardware diagram show current status, not custom historical trend overlays, and alert policies define thresholds rather than visualize data.",
    "reference": "Prism Web Console Guide - Analysis Dashboard",
    "phoneHint": "I think you build a metric chart on the Analysis page, that's the custom-graph one, but confirm the name.",
    "steveClue": "Prism separates status views from trend analysis. The Analysis dashboard is where you construct charts over an arbitrary time range: a metric chart plots one or more metrics (like cluster IOPS or CVM CPU), while an entity chart tracks a metric for a specific entity such as a VM or disk. Because you choose the metrics and the window, it is the right tool for correlating two signals on one timeline.",
    "tags": [
      "analysis",
      "metric-chart",
      "custom-metrics",
      "performance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-H-003",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "In the Prism VM performance view, an administrator sees Controller IOPS, Controller Bandwidth, and Controller Latency for a VM. What does the 'Controller' qualifier indicate about these numbers?",
    "options": [
      "They reflect I/O as measured by the Stargate storage controller (CVM) serving the VM, not raw physical disk device counters",
      "They are taken solely from the hypervisor's virtual disk layer",
      "They are SNMP-polled counters read directly from the physical drives",
      "They report the host physical NIC controller throughput"
    ],
    "answer": [
      0
    ],
    "explanation": "The 'Controller' metrics represent I/O as seen by the CVM's Stargate storage controller that services the VM's I/O, which is why they can differ from bare physical device counters or the hypervisor's own view. They are not NIC or raw drive statistics.",
    "reference": "Prism Web Console Guide - Performance Monitoring",
    "phoneHint": "My guess is the first one about the Stargate/CVM controller, but the wording is tricky so double-check.",
    "steveClue": "In Nutanix, every VM's storage I/O is served by the local CVM's Stargate process, the storage 'controller'. Prism's Controller IOPS/Bandwidth/Latency therefore describe the I/O stream at that software controller layer for the entity, which is the number that actually reflects the VM's storage experience. It is distinct from a physical disk's device counters or the hypervisor's local view, so comparing Controller latency to disk latency helps localize where a bottleneck sits.",
    "tags": [
      "entity-metrics",
      "latency",
      "iops",
      "stargate",
      "performance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "MON-H-004",
    "domain": "monitoring",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Automated alert emails from a cluster stopped arriving after a recent network change. Alert policies are still enabled and Prism is actively generating alerts. What is the most likely cause?",
    "options": [
      "The SMTP server configuration in Prism (host, port, security, and from/to addresses) is now unreachable or incorrect",
      "The remote syslog server entry is misconfigured",
      "The SNMP engine ID changed after the network update",
      "Pulse telemetry was disabled in the settings"
    ],
    "answer": [
      0
    ],
    "explanation": "Alerts are still being raised in Prism, so the alerting engine is fine; the failure is in email delivery, which depends on the SMTP server settings (reachable host, correct port/security, valid sender and recipients). Syslog, SNMP, and Pulse are separate channels and do not carry the alert email.",
    "reference": "Prism Web Console Guide - Configuring SMTP and Alert Email",
    "phoneHint": "Since the alerts still fire but the emails don't, I'd blame the SMTP settings, the first option.",
    "steveClue": "Separate the detection of an alert from its delivery. Prism raising alerts proves the policy/health engine works; the problem is the transport. Email notifications flow through the configured SMTP server, so a network change that makes that server unreachable, or wrong port/TLS/addresses, silently stops the mail while alerts keep appearing in the UI. Syslog and SNMP are independent notification paths and Pulse is support telemetry, none of which delivers your alert emails.",
    "tags": [
      "smtp",
      "email-alerting",
      "notifications"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-E-001",
    "domain": "networking",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A new administrator inspects a freshly deployed AHV host and wants to know which Open vSwitch bridge the hypervisor creates by default to carry CVM and VM traffic. What is that default bridge named?",
    "options": [
      "br0",
      "br1",
      "vmbr0",
      "vSwitch0"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV is built on Open vSwitch, and every host is deployed with a default bridge named br0 that carries CVM and guest VM traffic. br1 would be an additional bridge you create manually, while vmbr0 and vSwitch0 belong to other hypervisors.",
    "reference": "AHV Administration Guide - AHV Networking",
    "phoneHint": "Pretty sure it's the first one, br-zero, that's the AHV default.",
    "steveClue": "",
    "tags": [
      "ahv",
      "open vswitch",
      "bridge",
      "br0"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-E-002",
    "domain": "networking",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator deploys a cluster and does not change any networking settings. Which uplink bond mode is configured by default on the AHV virtual switch?",
    "options": [
      "active-backup",
      "balance-slb",
      "balance-tcp (LACP)",
      "round-robin"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV defaults to active-backup, where only one uplink is active at a time and no special switch configuration is required. balance-slb and balance-tcp are load-balancing modes you must opt into, and round-robin is not an AHV bond option.",
    "reference": "AHV Administration Guide - Host Network Management",
    "phoneHint": "I think it's active-backup, the default that needs no switch setup.",
    "steveClue": "",
    "tags": [
      "bond",
      "uplink",
      "active-backup",
      "virtual switch"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-E-003",
    "domain": "networking",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator creates a VM network in Prism, enables Nutanix IPAM, and defines an IP pool for it. What service will this managed network now provide to VMs that attach to it?",
    "options": [
      "DHCP IP address assignment from the configured pool",
      "Layer-3 routing between VLANs",
      "Automatic VLAN trunking to the physical switch",
      "NAT to the external network"
    ],
    "answer": [
      0
    ],
    "explanation": "A managed network uses Nutanix IPAM to act as a DHCP server, handing out addresses from the pool you define; an unmanaged network instead relies on an external DHCP server. AHV does not perform inter-VLAN routing, trunk negotiation, or NAT for guest networks.",
    "reference": "Prism Web Console Guide - Network Configuration",
    "phoneHint": "Managed network means Nutanix handles DHCP, so the first option, fairly sure.",
    "steveClue": "",
    "tags": [
      "ipam",
      "managed network",
      "dhcp",
      "unmanaged network"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-E-004",
    "domain": "networking",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A colleague asks which software switch technology AHV uses inside each host to move traffic between VMs, the CVM, and the physical uplinks. What is the correct answer?",
    "options": [
      "Open vSwitch (OVS)",
      "VMware vSphere Distributed Switch",
      "Linux legacy bridge (brctl) only",
      "Cisco Nexus 1000V"
    ],
    "answer": [
      0
    ],
    "explanation": "AHV networking is implemented with Open vSwitch (OVS), which provides the bridges, bonds, and OpenFlow-based forwarding on each host. The other options belong to different platforms and are not what AHV uses.",
    "reference": "AHV Administration Guide - AHV Networking",
    "phoneHint": "It's Open vSwitch, the OVS one, first choice.",
    "steveClue": "",
    "tags": [
      "ahv",
      "open vswitch",
      "ovs"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-M-001",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants both uplinks of an AHV bond to share outbound VM traffic, but does not want to configure link aggregation (LACP) on the upstream physical switches. Which bond mode meets this requirement?",
    "options": [
      "balance-slb",
      "balance-tcp",
      "active-backup",
      "active-active with LACP"
    ],
    "answer": [
      0
    ],
    "explanation": "balance-slb load-balances traffic across all uplinks using source-MAC hashing and does not require any link-aggregation configuration on the physical switches. balance-tcp (and active-active LACP) require LACP on the switch, and active-backup uses only one uplink at a time.",
    "reference": "AHV Administration Guide - Bond Modes",
    "phoneHint": "I'd go with balance-slb, it spreads load but needs no LACP on the switch.",
    "steveClue": "",
    "tags": [
      "bond",
      "balance-slb",
      "lacp",
      "uplink"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-M-002",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "To achieve true per-flow load balancing so that a single VM's traffic can span the aggregate bandwidth of multiple uplinks, an administrator plans to use balance-tcp. What must be configured on the physical switch for this to work correctly?",
    "options": [
      "Link aggregation with LACP on the ports connected to the host",
      "Nothing; the host negotiates it automatically",
      "Spanning-tree portfast only",
      "A separate VLAN for each uplink"
    ],
    "answer": [
      0
    ],
    "explanation": "balance-tcp performs Layer-4 (TCP flow) hashing and requires the upstream switch ports to be bundled in an LACP link-aggregation group. Without matching LACP configuration the bond will not form correctly; STP portfast and per-uplink VLANs do not provide aggregation.",
    "reference": "AHV Administration Guide - Bond Modes",
    "phoneHint": "The switch side needs LACP link aggregation, so the first option.",
    "steveClue": "",
    "tags": [
      "balance-tcp",
      "lacp",
      "link aggregation",
      "bond"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-M-003",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "In an AHV cluster, an administrator creates several VM networks, each mapped to a different VLAN ID. How does AHV deliver a frame from a VM on VLAN 30 onto the physical network?",
    "options": [
      "OVS tags the frame with VLAN 30 as it egresses the uplink bond (trunk)",
      "The VM's guest OS must add the VLAN tag itself",
      "Each VLAN requires its own dedicated physical NIC",
      "AHV routes the traffic at Layer 3 into VLAN 30"
    ],
    "answer": [
      0
    ],
    "explanation": "An AHV VM network is essentially a VLAN; OVS applies the VLAN tag on egress, so the uplink must be a trunk carrying those VLANs. The guest OS is unaware of the tag, multiple VLANs share the same bonded uplinks, and AHV does not route between them.",
    "reference": "AHV Administration Guide - VLAN Configuration",
    "phoneHint": "OVS does the tagging on the way out to a trunk, first one I think.",
    "steveClue": "",
    "tags": [
      "vlan",
      "tagging",
      "ovs",
      "trunk"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-M-004",
    "domain": "networking",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator opens the Network Visualization page in Prism to confirm which physical switch port each host uplink connects to. Which protocol must be enabled on the switch so Prism can display this host-to-switch topology?",
    "options": [
      "LLDP on the physical switches",
      "SNMPv2 traps",
      "NetFlow export",
      "BGP peering"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism's network visualization builds the host-to-physical-switch topology from LLDP neighbor information, so LLDP must be enabled on the connected switch ports. SNMP, NetFlow, and BGP are unrelated to discovering directly connected neighbor ports.",
    "reference": "Prism Web Console Guide - Network Visualization",
    "phoneHint": "It relies on LLDP neighbor info, so the first option.",
    "steveClue": "",
    "tags": [
      "network visualization",
      "lldp",
      "prism",
      "topology"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-H-001",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A security administrator has built a Flow Network Security application policy but wants to observe which flows it would permit or block before it actually starts dropping any traffic. Which policy state should be used first?",
    "options": [
      "Monitor mode",
      "Enforce mode",
      "Quarantine mode",
      "Isolation mode"
    ],
    "answer": [
      0
    ],
    "explanation": "Flow Network Security policies can run in Monitor mode, where all traffic is still allowed but flows that would be blocked are visualized, letting you validate rules before switching to Enforce mode, which actually drops disallowed traffic. Quarantine and Isolation are separate policy types, not observation states.",
    "reference": "Flow Network Security Guide",
    "phoneHint": "I'm fairly sure you start in Monitor mode, but check the wording, it watches without blocking.",
    "steveClue": "Think about the safe way to roll out any firewall rule set: you first want to see what would happen before anything is actually dropped. Flow has a state that permits all traffic while still showing you, in the visualization, exactly which flows a rule would have denied. Only after you trust those results do you flip it to the state that truly enforces the drops. Do not confuse that observation state with the distinct policy types used to lock down or fence off individual VMs.",
    "tags": [
      "flow",
      "microsegmentation",
      "monitor mode",
      "security policy"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-H-002",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "During a network review, an administrator examines a CVM's interfaces. Which interface carries the private, internal communication path between the CVM and its own local AHV host and must not be reconfigured?",
    "options": [
      "eth1 on the 192.168.5.0/24 internal network",
      "eth0 on the external management network",
      "eth2 on the backplane network",
      "the br0 uplink bond"
    ],
    "answer": [
      0
    ],
    "explanation": "The CVM uses eth1 bound to the internal 192.168.5.x network for private communication with its local hypervisor host; disrupting it breaks local storage I/O. eth0 is external management, eth2 exists only when network segmentation/backplane is enabled, and the uplink bond is not a CVM eth interface.",
    "reference": "AHV Administration Guide - Controller VM Network Requirements",
    "phoneHint": "I believe it's the internal 192.168.5.x interface, eth1, first option, but verify the subnet.",
    "steveClue": "Every CVM talks to its own host over a dedicated, non-routable private link so that local storage traffic never has to leave the node. There is a well-known private RFC1918 subnet reserved for exactly this host-to-CVM back channel, and touching it severs the local data path. Keep that internal link distinct from the externally reachable management address and from the optional segmented backplane interface that only appears once you enable network segmentation.",
    "tags": [
      "cvm",
      "network requirements",
      "eth1",
      "internal network"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-H-003",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator changes the bond mode on the default virtual switch (vs0) from Prism Central and applies it. Using the default update method, how does AHV roll this change out across the cluster?",
    "options": [
      "A rolling update that puts each host in maintenance mode and migrates its VMs before reconfiguring",
      "Simultaneously on all hosts with a brief cluster-wide outage",
      "Only on the host you selected, leaving the others unchanged",
      "At the next scheduled cluster reboot"
    ],
    "answer": [
      0
    ],
    "explanation": "The default (Standard) virtual switch update is a rolling operation: it live-migrates VMs off each host, puts the host in maintenance mode, applies the change, then moves to the next host, avoiding a cluster-wide outage. The Quick method skips maintenance mode but risks brief connectivity loss, and the change is cluster-wide rather than per-host.",
    "reference": "AHV Administration Guide - Virtual Switch Management",
    "phoneHint": "I think the default does a rolling, host-by-host maintenance-mode update, first option, though I'd double-check the term.",
    "steveClue": "A virtual switch is a cluster-wide object, so a change to it has to reach every host, but doing that all at once would be disruptive. The default method is deliberately conservative: it evacuates one host at a time by live-migrating its guests, quiesces that host, applies the change, then repeats down the line. There is a faster alternative that skips the evacuation step at the cost of a possible brief connectivity blip, but that is not the default.",
    "tags": [
      "virtual switch",
      "rolling update",
      "maintenance mode",
      "vs0"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NET-H-004",
    "domain": "networking",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A team enabled balance-slb on an AHV bond, but the upstream switch ports for those uplinks were also configured as an LACP port-channel, and connectivity became unstable. What is the correct guidance for balance-slb regarding the physical switch?",
    "options": [
      "The switch ports must NOT be in a link-aggregation/LACP group; balance-slb expects independent ports",
      "The ports must be in an LACP group for balance-slb to load balance",
      "balance-slb only works over a single active uplink",
      "balance-slb requires each uplink port in a different VLAN"
    ],
    "answer": [
      0
    ],
    "explanation": "balance-slb performs its own source-MAC load balancing and assumes each uplink faces an independent switch port; bundling those ports into an LACP port-channel causes MAC flapping and dropped traffic. Switch-side LACP aggregation is required only for balance-tcp, not for balance-slb.",
    "reference": "AHV Administration Guide - Bond Modes",
    "phoneHint": "Balance-slb wants independent switch ports, not an LACP bundle, first option I believe.",
    "steveClue": "Two of the load-balancing modes take opposite views of the physical switch. One does all the balancing itself inside the host by hashing source MAC addresses, and therefore needs each uplink to face an ordinary, independent switch port. The other hands balancing to a negotiated aggregation group and therefore requires the switch ports to be bundled together. Combining the host-side-balancing mode with a switch-side aggregation group makes the same MAC appear on multiple ports and breaks connectivity.",
    "tags": [
      "balance-slb",
      "lacp",
      "bond",
      "switch configuration"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-E-001",
    "domain": "performance",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A database VM sends bursts of small, random writes. Which Distributed Storage Fabric component absorbs these writes first to keep write latency low?",
    "options": [
      "The Extent Store, the persistent capacity tier",
      "The OpLog, a persistent write buffer on the fastest storage tier",
      "The Unified Cache held in CVM memory",
      "The Curator background scan framework"
    ],
    "answer": [
      1
    ],
    "explanation": "The OpLog is a persistent staging buffer on the highest-performance tier that coalesces random and bursty writes before draining them sequentially to the Extent Store. The Unified Cache is a read cache, and the Extent Store is where data eventually lands.",
    "reference": "The Nutanix Bible - Drive Breakdown / OpLog",
    "phoneHint": "I'd go with the OpLog write-buffer one, the second option. Fairly confident.",
    "steveClue": "",
    "tags": [
      "oplog",
      "write buffer",
      "random writes",
      "latency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-E-002",
    "domain": "performance",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A VM runs on Node A of a Nutanix cluster. Under steady-state operation, where are that VM's reads primarily served from to minimize latency?",
    "options": [
      "Round-robin across every node in the cluster",
      "Always from whichever node holds the second RF copy",
      "From an external storage array over the network",
      "From the local node's storage, via data locality"
    ],
    "answer": [
      3
    ],
    "explanation": "DSF data locality keeps a running VM's active data on the same node as the VM, so reads are served locally over the internal bus rather than the network. When a VM migrates, locality is re-established as data is read.",
    "reference": "The Nutanix Bible - Data Locality",
    "phoneHint": "It's the data-locality one about the local node, the last option. Pretty sure.",
    "steveClue": "",
    "tags": [
      "data locality",
      "reads",
      "latency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-E-003",
    "domain": "performance",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Before deploying a cluster, an administrator must translate a customer's VM, IOPS, and capacity requirements into a recommended node configuration. Which Nutanix tool is designed for this?",
    "options": [
      "Nutanix Sizer",
      "Nutanix X-Ray",
      "Nutanix Move",
      "Nutanix Foundation"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix Sizer takes workload requirements and recommends an appropriate node count and model. X-Ray is for benchmarking, Move is for migration, and Foundation is for imaging and deploying nodes.",
    "reference": "Nutanix Sizer documentation",
    "phoneHint": "Sizer, the first option. That is literally what it is for.",
    "steveClue": "",
    "tags": [
      "sizer",
      "sizing",
      "capacity planning"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-E-004",
    "domain": "performance",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A team wants to benchmark and stress-test cluster performance and resiliency using realistic, automated scenarios before going to production. Which Nutanix tool is built for this?",
    "options": [
      "Nutanix Sizer",
      "Nutanix Move",
      "Nutanix X-Ray",
      "Nutanix Foundation"
    ],
    "answer": [
      2
    ],
    "explanation": "Nutanix X-Ray is a testing and benchmarking framework that runs automated, real-world scenarios to evaluate performance and resiliency. Sizer only estimates a configuration, and Foundation images nodes.",
    "reference": "Nutanix X-Ray documentation",
    "phoneHint": "The benchmarking one is X-Ray, the third option. Confident on that.",
    "steveClue": "",
    "tags": [
      "x-ray",
      "benchmarking",
      "testing"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-M-001",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A backup job streams a large, sequential write to a VM's disk. How does the Distributed Storage Fabric typically treat this sequential I/O relative to the OpLog?",
    "options": [
      "It is always staged in the OpLog first, like every write",
      "It is cached in the Unified Cache instead of being written",
      "It bypasses the OpLog and is written directly to the Extent Store",
      "It is buffered until the OpLog fully drains"
    ],
    "answer": [
      2
    ],
    "explanation": "The OpLog exists to coalesce random writes; large sequential streams gain nothing from staging, so DSF bypasses the OpLog and writes them directly to the Extent Store. This avoids double-writing large sequential I/O.",
    "reference": "The Nutanix Bible - OpLog / Draining",
    "phoneHint": "I think sequential writes skip the OpLog and go straight to the Extent Store, the third option. Worth a check.",
    "steveClue": "",
    "tags": [
      "oplog",
      "sequential writes",
      "extent store"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-M-002",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A noisy-neighbor VM is causing sustained CPU contention on one node, degrading other VMs. Which Nutanix feature automatically detects the hotspot and live-migrates workloads to remediate it?",
    "options": [
      "Data Locality",
      "Acropolis Dynamic Scheduling (ADS)",
      "Erasure Coding (EC-X)",
      "Redundancy Factor (RF)"
    ],
    "answer": [
      1
    ],
    "explanation": "ADS, driven by the Lazan service, continuously monitors CPU and storage-controller contention and live-migrates VMs or volume groups off hotspot nodes to rebalance load. EC-X and RF address data efficiency and resiliency, not compute scheduling.",
    "reference": "AHV Administration Guide - Acropolis Dynamic Scheduling",
    "phoneHint": "That's ADS, the dynamic scheduler, the second option. Reasonably sure.",
    "steveClue": "",
    "tags": [
      "ads",
      "noisy neighbor",
      "lazan",
      "contention"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-M-003",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A cluster is low on storage capacity but has ample CPU and memory. The administrator adds nodes that contribute storage and I/O to the fabric but do not host user VMs. What are these nodes called?",
    "options": [
      "Compute-only nodes",
      "Witness nodes",
      "Prism Central nodes",
      "Storage-only (storage-heavy) nodes"
    ],
    "answer": [
      3
    ],
    "explanation": "Storage-only nodes run AHV and a CVM to add capacity and I/O to DSF but do not run user VMs, which is ideal when capacity is the constraint. Compute-only nodes are the inverse, adding CPU and memory without contributing local storage to the fabric.",
    "reference": "Nutanix - Storage-only and Compute-only nodes",
    "phoneHint": "Storage-only nodes, the last option. That fits 'adds capacity but no user VMs.'",
    "steveClue": "",
    "tags": [
      "storage-only node",
      "storage-heavy",
      "compute-only",
      "scaling"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-M-004",
    "domain": "performance",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When sizing SSD and cache to sustain a workload's performance, an administrator focuses on the 'working set.' What does the working set represent?",
    "options": [
      "The actively and frequently accessed subset of a workload's data over a period",
      "The total raw capacity of all disks in the cluster",
      "The number of CVMs participating in each write",
      "The complete set of snapshots retained for a VM"
    ],
    "answer": [
      0
    ],
    "explanation": "The working set is the portion of data that is actively accessed (the hot data); keeping it resident in the flash tier and Unified Cache is what drives high performance. Sizing flash and cache to hold the working set is a key performance consideration.",
    "reference": "The Nutanix Bible - Storage Tiering and Prioritization",
    "phoneHint": "Working set means the hot, actively-used data, the first option. That's the definition.",
    "steveClue": "",
    "tags": [
      "working set",
      "hot data",
      "tiering",
      "cache"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-H-001",
    "domain": "performance",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An OLTP workload issues many small random writes yet sees low, consistent write latency with full crash consistency. Which statement about the OpLog best explains this?",
    "options": [
      "Writes are acknowledged from volatile CVM DRAM and flushed lazily with no replication",
      "Random writes are staged in the OpLog and synchronously replicated to peer CVM OpLogs before the write is acknowledged",
      "The OpLog stores only metadata while all data goes directly to the Extent Store",
      "Each write is acknowledged only once it has reached the HDD capacity tier"
    ],
    "answer": [
      1
    ],
    "explanation": "The OpLog is a persistent, per-vDisk write buffer; incoming random writes are written locally and synchronously replicated to remote CVM OpLog(s) per the redundancy factor before the guest is acknowledged, giving low latency plus durability. It is not a volatile DRAM cache, and it stores data, not just metadata.",
    "reference": "The Nutanix Bible - OpLog",
    "phoneHint": "I lean toward the one about replicating to peer OpLogs before the ack, the second option, but this is subtle so double-check me.",
    "steveClue": "Think about how a write can be both fast and safe. The buffer that catches random writes lives on persistent flash, not volatile memory, and durability demands that copies exist on more than one node before the guest is told the write succeeded. That synchronous cross-node replication is what makes it crash-consistent while keeping latency low.",
    "tags": [
      "oplog",
      "replication",
      "redundancy factor",
      "write latency",
      "durability"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-H-002",
    "domain": "performance",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator wants to know how the Unified Cache avoids letting a single large sequential scan evict genuinely hot data. How does the read cache decide what stays resident?",
    "options": [
      "It keeps all cached data in one FIFO queue with equal priority",
      "It caches only the blocks that were most recently written",
      "It caches data only after at least ten accesses",
      "New reads enter a single-touch pool and are promoted to a multi-touch pool on repeated access"
    ],
    "answer": [
      3
    ],
    "explanation": "The Unified Cache uses a single-touch pool for first reads and promotes data to a multi-touch pool on subsequent hits, keeping the truly hot working set resident. This two-tier design prevents a one-time large scan from evicting frequently accessed data.",
    "reference": "The Nutanix Bible - Unified Cache",
    "phoneHint": "Something about single-touch versus multi-touch pools, the last option. That's my guess, verify it.",
    "steveClue": "A good read cache has to distinguish data touched once, like a one-off scan, from data touched repeatedly, the real working set. The design uses two tiers: a first-touch area and a hotter area that data is promoted into on re-access. That way a single large sequential read cannot flush out your genuinely hot blocks.",
    "tags": [
      "unified cache",
      "read cache",
      "single-touch",
      "multi-touch"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-H-003",
    "domain": "performance",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "In a heavily consolidated cluster, storage latency begins to climb. Which explanation best captures how CVM resourcing can become the limiting factor?",
    "options": [
      "All local VM I/O flows through the node's CVM, so starving it of CPU or memory throttles I/O for every VM on that node",
      "The CVM only manages metadata, so its resources cannot affect data-path latency",
      "Adding CVM memory directly reduces usable Extent Store capacity",
      "The CVM offloads all I/O to the hypervisor kernel, so its resources are irrelevant"
    ],
    "answer": [
      0
    ],
    "explanation": "Every read and write for local VMs passes through the node's Controller VM; if it is starved of CPU or memory, I/O queues build and latency rises for all VMs on that node. This is why CVM vCPU and memory reservations must not be reduced below supported minimums.",
    "reference": "Nutanix - Controller VM (CVM) resource requirements",
    "phoneHint": "It's the first one, the CVM handles all the I/O so under-resourcing it hits everything. I think that's right.",
    "steveClue": "Remember the data path: on each node, guest I/O does not go straight to disk, it flows through a dedicated virtual appliance that owns the storage stack. If that appliance is short on CPU or memory, its queues back up and every VM on the node feels the latency. That is why its resource reservations are protected and should not be trimmed.",
    "tags": [
      "cvm",
      "resources",
      "bottleneck",
      "iops",
      "latency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PERF-H-004",
    "domain": "performance",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A team wants maximum usable capacity from data that is rarely overwritten, without heavily penalizing active write latency. Which data-efficiency feature fits, and what is its main trade-off?",
    "options": [
      "Deduplication, which carries no memory or metadata overhead",
      "Inline compression, which should be avoided because it always doubles write latency",
      "Erasure Coding (EC-X), which reclaims space on write-cold data but adds compute overhead on overwrites and failure rebuilds",
      "Redundancy Factor 1, which improves resiliency while saving space"
    ],
    "answer": [
      2
    ],
    "explanation": "EC-X encodes write-cold data into parity strips to reclaim space beyond replication, but overwrites and node-failure rebuilds incur extra compute, so it targets infrequently-written data. Dedup carries metadata and memory overhead, inline compression is generally recommended rather than avoided, and RF1 is not a resiliency improvement.",
    "reference": "The Nutanix Bible - Erasure Coding (EC-X)",
    "phoneHint": "The erasure-coding option, the third one, good for cold data but with rebuild overhead. Lean that way, but weigh the others.",
    "steveClue": "The goal is squeezing more usable space out of data that rarely changes, beyond what plain replication gives. The technique computes parity across data strips instead of keeping full extra copies. The catch is that recomputing parity is only cheap when data is cold; frequent overwrites or a node failure force expensive recalculation, so you reserve it for write-cold data.",
    "tags": [
      "erasure coding",
      "ec-x",
      "data efficiency",
      "redundancy factor",
      "capacity"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-E-001",
    "domain": "prism",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator manages several separate Nutanix clusters across two data centers and wants a single console to monitor and operate all of them together. Which component is designed for this multi-cluster management?",
    "options": [
      "Prism Central",
      "Prism Element",
      "Foundation",
      "Nutanix Cluster Check (NCC)"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism Central is the multi-cluster management plane that provides a single pane of glass across many clusters, while Prism Element is the built-in management interface for one individual cluster. Foundation images nodes and NCC runs health checks; neither manages multiple clusters.",
    "reference": "Prism Central Guide - Introduction to Prism Central",
    "phoneHint": "I'm fairly sure it's the first one, Prism Central, since that's the multi-cluster tool.",
    "steveClue": "",
    "tags": [
      "prism central",
      "prism element",
      "multi-cluster",
      "management plane"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-E-002",
    "domain": "prism",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "While setting up policies in Prism Central, an administrator is told to use categories. What is the primary purpose of categories?",
    "options": [
      "Grouping entities such as VMs so that policies can be applied to the group",
      "Storing long-term performance metrics for later analysis",
      "Defining IP address pools for guest VM networks",
      "Encrypting data at rest on the cluster"
    ],
    "answer": [
      0
    ],
    "explanation": "Categories are key-value pairs used to group entities (most commonly VMs) so that policies such as protection, security (Flow), and recovery plans can target the group. They do not store metrics, define IP pools, or perform encryption.",
    "reference": "Prism Central Guide - Categories Management",
    "phoneHint": "I think it's the first one, categories are for grouping VMs so policies can hit them.",
    "steveClue": "",
    "tags": [
      "categories",
      "policies",
      "grouping",
      "prism central"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-E-003",
    "domain": "prism",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants Prism Central to automatically respond to certain conditions, for example powering on a VM or sending an email when an alert fires. Which feature provides this automation?",
    "options": [
      "X-Play (Playbooks)",
      "Life Cycle Manager (LCM)",
      "Foundation",
      "Data Lens"
    ],
    "answer": [
      0
    ],
    "explanation": "X-Play lets administrators build playbooks that automate operational and remediation tasks in response to triggers such as alerts. LCM handles software and firmware updates, Foundation images nodes, and Data Lens provides file analytics.",
    "reference": "Prism Central Guide - X-Play (Playbooks)",
    "phoneHint": "Pretty sure it's X-Play, the first option, for that if-this-then-that automation.",
    "steveClue": "",
    "tags": [
      "x-play",
      "playbooks",
      "automation",
      "prism central"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-E-004",
    "domain": "prism",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants the Prism home dashboard to display the specific charts and information most relevant to their team. How is this accomplished?",
    "options": [
      "By adding, removing, and rearranging widgets on the dashboard",
      "By editing a configuration file on the CVM",
      "By reimaging the cluster with Foundation",
      "The dashboard layout is fixed and cannot be changed"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism dashboards are customizable: administrators can create dashboards and add, remove, and rearrange widgets to surface the data they care about. No CVM file editing or reimaging is required, and the layout is not fixed.",
    "reference": "Prism Web Console Guide - Dashboard and Widgets",
    "phoneHint": "I'd go with the first one, you just add and move widgets around.",
    "steveClue": "",
    "tags": [
      "dashboard",
      "widgets",
      "customization",
      "prism"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-M-001",
    "domain": "prism",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A helpdesk user must be able to view every entity and its status in Prism Central but must not be able to change anything. Which built-in role best fits this requirement?",
    "options": [
      "Prism Viewer",
      "Prism Admin",
      "Super Admin",
      "Operator"
    ],
    "answer": [
      0
    ],
    "explanation": "The built-in Prism Viewer role grants read-only visibility across Prism Central without the ability to make changes. Prism Admin and Super Admin allow configuration changes, and Operator can perform certain operational actions rather than being view-only.",
    "reference": "Prism Central Admin Guide - Role-Based Access Control (Built-in Roles)",
    "phoneHint": "I believe it's Prism Viewer, the read-only one, but double-check the exact name.",
    "steveClue": "",
    "tags": [
      "rbac",
      "roles",
      "prism viewer",
      "read-only"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-M-002",
    "domain": "prism",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Management wants a weekly PDF summarizing cluster capacity and performance emailed automatically to stakeholders. Which Prism Central feature is built to schedule and deliver this?",
    "options": [
      "Reports",
      "The Analysis page",
      "Alerts",
      "X-Play"
    ],
    "answer": [
      0
    ],
    "explanation": "The Reports feature lets you build reports, schedule them, export to PDF or CSV, and email them to recipients on a recurring basis. The Analysis page is for interactive troubleshooting charts, Alerts surface conditions, and X-Play automates actions rather than producing scheduled reports.",
    "reference": "Prism Central Guide - Reports Management",
    "phoneHint": "I'm fairly sure it's Reports, the first option, since that's the scheduled-and-emailed one.",
    "steveClue": "",
    "tags": [
      "reports",
      "scheduling",
      "capacity",
      "prism central"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-M-003",
    "domain": "prism",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A cluster is already registered to one Prism Central instance. An administrator attempts to register that same cluster to a second Prism Central. What is true about this scenario?",
    "options": [
      "A cluster can be registered to only one Prism Central at a time and must be unregistered first",
      "The cluster registers to both instances so they act as redundant managers",
      "Registration queues until the first Prism Central goes offline",
      "Both instances get read access but only the newer one can make changes"
    ],
    "answer": [
      0
    ],
    "explanation": "A Nutanix cluster (Prism Element) can be registered to only one Prism Central at a time; to move it you must unregister it from the first before registering it to another. It cannot be simultaneously managed by two Prism Central instances.",
    "reference": "Prism Central Guide - Register (Unregister) Cluster with Prism Central",
    "phoneHint": "I think it's the first one, only one Prism Central at a time, so you unregister first.",
    "steveClue": "",
    "tags": [
      "cluster registration",
      "prism central",
      "prism element",
      "one-to-one"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-M-004",
    "domain": "prism",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator needs to upgrade AOS across all nodes using a rolling process that keeps guest VMs running throughout. Which Prism capability performs this?",
    "options": [
      "One-click upgrade (Upgrade Software)",
      "Foundation imaging",
      "Cluster destroy and recreate",
      "Genesis service restart"
    ],
    "answer": [
      0
    ],
    "explanation": "The one-click Upgrade Software workflow in Prism performs a rolling, non-disruptive AOS upgrade, updating one CVM at a time so guest VMs stay online. Foundation reimages nodes from scratch, destroy/recreate is not an upgrade path, and restarting Genesis does not upgrade AOS.",
    "reference": "Acropolis Upgrade Guide - Upgrading AOS (One-Click Upgrade)",
    "phoneHint": "Go with the first one, the one-click upgrade does the rolling AOS update.",
    "steveClue": "",
    "tags": [
      "one-click upgrade",
      "aos",
      "rolling upgrade",
      "prism"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-H-001",
    "domain": "prism",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "In Prism Central an administrator creates a custom role and must grant an AD group management access to only the VMs belonging to one application, out of thousands of VMs. What is the recommended way to scope that role assignment?",
    "options": [
      "Assign the role over one or more categories that group those VMs",
      "List each VM's UUID individually in the role assignment",
      "Create a separate Prism Central instance for those VMs",
      "Move the VMs into a dedicated storage container and scope by container"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism Central RBAC scopes a role assignment by selecting the entities it applies to, and at scale this is done with categories rather than enumerating individual VMs. Standing up a separate Prism Central or scoping by storage container are not how RBAC access boundaries are defined.",
    "reference": "Prism Central Admin Guide - Custom Roles and Role Assignment",
    "phoneHint": "I lean toward the categories option, the first one, but I'm not fully certain on the exact wording.",
    "steveClue": "Prism Central RBAC separates what a role can do from which entities it applies to. Because categories are key-value groupings that both policies and RBAC consume, scoping an assignment to a category automatically covers every entity that matches, and membership updates as VMs are tagged, without editing the role. Enumerating individual entities does not scale and defeats the purpose of categories.",
    "tags": [
      "rbac",
      "custom roles",
      "categories",
      "scoping"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-H-002",
    "domain": "prism",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "When building an X-Play playbook in Prism Central, which of the following can be configured as the trigger that starts the playbook? (Select all that apply.)",
    "options": [
      "An alert being raised",
      "A manual (on-demand) trigger",
      "An incoming webhook",
      "A guest OS user logging into a VM",
      "An NCC health check completing"
    ],
    "answer": [
      0,
      1,
      2
    ],
    "explanation": "X-Play playbooks begin when a defined trigger fires, and supported trigger types include an alert being raised, a manual on-demand run, and an incoming webhook. Events occurring inside a guest OS and the completion of an NCC health check are not native playbook triggers.",
    "reference": "Prism Central Guide - X-Play Triggers and Actions",
    "phoneHint": "I'm fairly confident the first three, alert, manual, and webhook, are triggers, but check the last two.",
    "steveClue": "X-Play cleanly separates triggers from actions: a playbook is dormant until a configured trigger fires, then it runs an ordered list of actions such as sending email or changing VM power state. Triggers are things the Prism Central control plane can observe, like an alert, a webhook call, or an operator pressing play. Activity happening inside a guest operating system or a health-check finishing are not surfaced as playbook triggers.",
    "tags": [
      "x-play",
      "playbooks",
      "triggers",
      "webhook",
      "alerts"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-H-003",
    "domain": "prism",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Active Directory is configured as a directory service in Prism and connectivity tests succeed, yet a user who enters valid AD credentials is denied access. What is the most likely cause?",
    "options": [
      "No role mapping exists that grants the user or their AD group a role",
      "The cluster is not registered to Prism Central",
      "SAML must be enabled before AD logins work",
      "The user has not uploaded an SSH public key"
    ],
    "answer": [
      0
    ],
    "explanation": "Adding a directory service only enables authentication of credentials; authorization requires a role mapping that ties the AD user, group, or OU to a Prism role. With valid credentials but no matching role mapping, the user authenticates but has no assigned role and is refused.",
    "reference": "Prism Web Console Guide - Configuring Authentication and Role Mapping",
    "phoneHint": "I'd guess the role-mapping one, the first option, but I'm not 100 percent sure.",
    "steveClue": "In Prism, authentication and authorization are two separate steps. Configuring a directory service lets Prism verify a user's credentials, but it grants no access on its own. You must add role mappings that associate directory users, groups, or organizational units with specific Prism roles; until a mapping matches the user, a valid login still results in no permissions and access is denied.",
    "tags": [
      "authentication",
      "active directory",
      "ldap",
      "role mapping",
      "sso"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "PRISM-H-004",
    "domain": "prism",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A single-VM (small) Prism Central needs more capacity to manage additional VMs and to add resiliency for the management plane. Which statement about scaling Prism Central is correct?",
    "options": [
      "Scaling out forms a three-PCVM instance, so two additional PCVMs are added, not one",
      "You add a single PCVM to create a two-node HA pair",
      "Scaling out only means increasing the vCPU and RAM of the existing single PCVM",
      "Each registered cluster automatically contributes a PCVM to the scale-out"
    ],
    "answer": [
      0
    ],
    "explanation": "A scale-out Prism Central is a cluster of three PCVMs, so scaling out from a single instance adds two more PCVMs rather than one; there is no two-node form. Vertically resizing one PCVM changes its capacity but does not by itself provide the management-plane high availability that scale-out delivers.",
    "reference": "Prism Central Guide - Scale-Out and Sizing Prism Central",
    "phoneHint": "I think it's the three-PCVM answer, the first one, but I'm hedging on the exact node count.",
    "steveClue": "Prism Central runs either as a single PCVM or as a scale-out cluster of three PCVMs, with no supported two-node option. Scale-out both raises the ceiling on how many entities Prism Central can manage and provides high availability for the management plane, and the PCVMs must match one another in size. Simply giving one PCVM more vCPU and memory increases its form factor but does not make the management plane resilient.",
    "tags": [
      "prism central",
      "scale-out",
      "sizing",
      "pcvm",
      "high availability"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-E-001",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator wants to prevent password-based SSH logins to the CVMs and AHV hosts, permitting only key-based access on a hardened cluster. Which Prism feature accomplishes this?",
    "options": [
      "Cluster Lockdown",
      "Data-at-Rest Encryption",
      "Flow Network Security",
      "Curator scan tuning"
    ],
    "answer": [
      0
    ],
    "explanation": "Cluster Lockdown (Prism Settings) disables password-based SSH authentication to the CVMs and hosts; administrators add public SSH keys so only key-based access is allowed. Data-at-Rest Encryption and Flow address storage and network security, not SSH access.",
    "reference": "Nutanix Security Guide (Cluster Lockdown)",
    "phoneHint": "I'm pretty confident it's the first one - the lockdown feature is literally about controlling SSH access.",
    "steveClue": "",
    "tags": [
      "cluster lockdown",
      "ssh",
      "hardening",
      "key-based auth"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-E-002",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A security team asks which cipher Nutanix software-based data-at-rest encryption uses to protect data written to the storage media. What should the administrator tell them?",
    "options": [
      "AES-256",
      "SHA-256",
      "RSA-2048",
      "3DES"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix software-based data-at-rest encryption protects data on disk using AES-256 symmetric encryption. SHA-256 is a hash, RSA-2048 is asymmetric key exchange, and 3DES is a legacy cipher not used here.",
    "reference": "Nutanix Security Guide (Data-at-Rest Encryption)",
    "phoneHint": "Fairly sure it's AES-256 - that's the standard symmetric cipher for disk encryption.",
    "steveClue": "",
    "tags": [
      "encryption",
      "data-at-rest",
      "AES-256"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-E-003",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "To meet a compliance requirement, an administrator must display a legal consent message that every user acknowledges before logging in to Prism. Which capability should be configured?",
    "options": [
      "The Welcome Banner (login banner)",
      "Cluster Lockdown",
      "Syslog forwarding",
      "Two-factor authentication"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism's Welcome Banner displays a custom message that users must acknowledge before login, satisfying consent-banner requirements. The other options address SSH access, log export, and stronger authentication respectively.",
    "reference": "Prism Web Console Guide (Welcome Banner)",
    "phoneHint": "I'd go with the banner option - that's exactly what a pre-login consent message is.",
    "steveClue": "",
    "tags": [
      "login banner",
      "welcome banner",
      "compliance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-E-004",
    "domain": "security",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A newly created Flow Network Security policy is left in Monitor mode. What happens to VM traffic that the policy would otherwise disallow?",
    "options": [
      "The traffic still flows but is visualized and logged as a would-be violation",
      "The traffic is immediately blocked",
      "The affected VMs are automatically quarantined",
      "The policy has no effect until the VMs are rebooted"
    ],
    "answer": [
      0
    ],
    "explanation": "In Monitor mode a Flow policy only visualizes and logs traffic that would violate it; nothing is actually blocked. Enforce (Apply) mode is required to drop disallowed traffic, which is why admins typically monitor first and then enforce.",
    "reference": "Flow Network Security Guide (Policy Modes)",
    "phoneHint": "Pretty sure Monitor just watches and logs - it doesn't block. So the first one.",
    "steveClue": "",
    "tags": [
      "flow",
      "network security",
      "monitor mode",
      "enforce"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-M-001",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to enable software data-at-rest encryption but has no dedicated KMIP key server in the environment. Which Nutanix option removes the need for a separate external key manager?",
    "options": [
      "The Local (Native) Key Manager built into AOS",
      "A KMIP-compliant external appliance",
      "Flow Network Security",
      "The Prism Central IAM microservice"
    ],
    "answer": [
      0
    ],
    "explanation": "The Local (Native) Key Manager runs inside the cluster and manages encryption keys, eliminating the need for a dedicated external KMIP server. A KMIP external appliance is exactly the outside dependency the admin is trying to avoid.",
    "reference": "Nutanix Security Guide (Key Management)",
    "phoneHint": "I think it's the native/local key manager - the whole point is that you don't need an external KMS server.",
    "steveClue": "",
    "tags": [
      "encryption",
      "KMS",
      "native key manager",
      "external KMS"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-M-002",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A helpdesk user needs to view VMs and dashboards in Prism Central but must not be able to make any changes. Which built-in role best follows the principle of least privilege?",
    "options": [
      "Prism Viewer (read-only)",
      "Prism Admin",
      "Super Admin",
      "Self-Service Admin"
    ],
    "answer": [
      0
    ],
    "explanation": "The built-in Prism Viewer role grants read-only visibility, matching least privilege. Prism Admin and Super Admin permit configuration changes, and Self-Service Admin manages self-service projects and tenants.",
    "reference": "Prism Central Admin Guide (Role-Based Access Control)",
    "phoneHint": "The read-only 'Viewer' role sounds right for view-only access - fairly confident.",
    "steveClue": "",
    "tags": [
      "RBAC",
      "roles",
      "least privilege",
      "prism central"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-M-003",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "When replacing Prism's default self-signed SSL certificate with a CA-signed certificate, which set of items must the administrator upload?",
    "options": [
      "The private key, the signed certificate, and the CA chain/root certificate",
      "Only the signed public certificate",
      "Only the CSR generated by Prism",
      "The KMS master key and the certificate"
    ],
    "answer": [
      0
    ],
    "explanation": "Installing a custom certificate in Prism requires the matching private key, the CA-signed certificate, and the CA chain/root certificate so the full trust path validates. Uploading only the public certificate or the CSR is insufficient.",
    "reference": "Nutanix Security Guide (Installing an SSL Certificate)",
    "phoneHint": "You normally need the private key plus the signed cert and the CA chain - so the first option.",
    "steveClue": "",
    "tags": [
      "certificate",
      "SSL",
      "prism",
      "trust chain"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-M-004",
    "domain": "security",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "After hardening a cluster, an administrator worries that ad-hoc configuration changes could weaken the CVM security baseline over time. Which Nutanix mechanism automatically detects and reverts that drift?",
    "options": [
      "SCMA (Security Configuration Management Automation)",
      "Cluster Lockdown",
      "Curator scans",
      "Prism Self-Service"
    ],
    "answer": [
      0
    ],
    "explanation": "SCMA periodically checks the CVM and hypervisor against the STIG-based security baseline and self-heals any drift back to the hardened state. Cluster Lockdown only controls SSH access, and Curator handles storage and metadata maintenance, not security posture.",
    "reference": "Nutanix Security Guide (Security Baselines / SCMA)",
    "phoneHint": "I'm fairly sure it's SCMA - that's the self-healing security automation for the baseline.",
    "steveClue": "",
    "tags": [
      "SCMA",
      "STIG",
      "baseline",
      "self-heal",
      "hardening"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-H-001",
    "domain": "security",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A CISO claims that enabling Nutanix data-at-rest encryption will protect cluster data from an attacker who logs in over the network using valid administrative credentials. How should the architect respond?",
    "options": [
      "At-rest encryption protects data on the physical media (theft/RMA/disposal); it is transparent to an authenticated user reading live data",
      "It fully prevents any authenticated administrator from reading VM data",
      "It encrypts CVM-to-CVM network traffic, blocking credentialed remote access",
      "It automatically enforces two-factor authentication for all administrators"
    ],
    "answer": [
      0
    ],
    "explanation": "Data-at-rest encryption keeps drive contents unreadable if the media is removed, returned, or decommissioned, but it is transparent to authorized live I/O, so a validly authenticated admin still sees data. Guarding sessions and credentials requires 2FA, RBAC, and network controls, not DARE.",
    "reference": "Nutanix Security Guide (Data-at-Rest Encryption)",
    "phoneHint": "I think the honest answer is that at-rest encryption only protects the physical drives, not a logged-in admin - so the first one, but weigh it yourself.",
    "steveClue": "Match each control to the threat it actually addresses. Encryption 'at rest' targets the case where a physical disk leaves the datacenter - theft, RMA, or disposal - by keeping only ciphertext on the platters. It is deliberately transparent to legitimate authenticated I/O, so it never substitutes for the identity and access controls that decide who may log in and read live data.",
    "tags": [
      "encryption",
      "data-at-rest",
      "threat model",
      "access control"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-H-002",
    "domain": "security",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A federal customer must enable two-factor authentication for Prism using a smart card (CAC). Which two factors does Prism combine to satisfy this requirement?",
    "options": [
      "A client certificate (something you have) plus a username/password (something you know)",
      "Two separate passwords entered in sequence",
      "A username/password plus a security question",
      "A drive SED PIN plus an administrator password"
    ],
    "answer": [
      0
    ],
    "explanation": "Prism two-factor authentication pairs client-certificate authentication - the CAC/smart-card certificate, something you have - with directory username/password, something you know. Two passwords or a security question are both knowledge-only and remain a single factor.",
    "reference": "Nutanix Security Guide (Two-Factor Authentication)",
    "phoneHint": "Real 2FA mixes something you have with something you know, so the client-certificate-plus-password option - fairly confident, but check the factor categories.",
    "steveClue": "True multifactor requires factors from different categories: knowledge, possession, or inherence. A CAC or smart card carries a client certificate that proves possession, and it is combined with the directory credential the user knows. Two things you simply memorize, no matter how many, still count as one factor.",
    "tags": [
      "2FA",
      "CAC",
      "authentication",
      "client certificate"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-H-003",
    "domain": "security",
    "authoredDifficulty": "hard",
    "type": "multi",
    "stem": "A storage architect is validating facts about Nutanix data-at-rest encryption before a design review. Which of the following statements are correct? (Select all that apply.)",
    "options": [
      "Software-based encryption encrypts data in the AOS write path and can use the Local (Native) Key Manager",
      "SED-based encryption performs the encryption within the self-encrypting drive's own hardware",
      "Enabling cluster-wide software encryption is a one-way action that cannot later be disabled",
      "It encrypts inter-cluster replication traffic while that data traverses the network",
      "Software-based encryption requires every node to be populated with self-encrypting drives"
    ],
    "answer": [
      0,
      1,
      2
    ],
    "explanation": "Software encryption runs in the AOS data path on ordinary drives and can use the native or an external KMS; SEDs encrypt inside the drive; and cluster-level encryption cannot be disabled once enabled. It does not protect data in transit (a separate feature), and software encryption specifically does not require SEDs.",
    "reference": "Nutanix Security Guide (Data-at-Rest Encryption)",
    "phoneHint": "I'd pick the three about the data path, in-drive SEDs, and it being irreversible - the in-transit and 'must have SEDs' ones feel wrong, but double-check.",
    "steveClue": "Separate the 'where' from the 'when.' SEDs push the cipher into drive firmware, while software encryption does it in the AOS I/O path on standard drives, so the two are alternative implementations of the same at-rest goal. 'At rest' is the key phrase - it says nothing about bytes moving across the network - and turning cluster encryption on is intentionally irreversible so data is never silently left unprotected.",
    "tags": [
      "encryption",
      "SED",
      "software encryption",
      "KMS"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "SEC-H-004",
    "domain": "security",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "After enabling Cluster Lockdown with 'remote login with password' disabled and no public keys added, an administrator finds they can no longer SSH into the CVM at all. Why?",
    "options": [
      "With password login disabled and no public keys installed, there is no permitted SSH authentication method left",
      "Lockdown also disables the Prism web console until keys are added",
      "The CVM requires a reboot to apply lockdown, which is still pending",
      "Lockdown deleted the local admin (nutanix) account"
    ],
    "answer": [
      0
    ],
    "explanation": "Cluster Lockdown disables password-based SSH, so access then depends entirely on installed public keys. With password auth off and zero keys present, no valid SSH authentication method remains and all SSH login is blocked; the Prism web console uses a separate auth path and is unaffected.",
    "reference": "Nutanix Security Guide (Cluster Lockdown)",
    "phoneHint": "It makes sense that with no password and no keys there's simply no way in over SSH - I'd go first option.",
    "steveClue": "Lockdown is really about which SSH authentication methods remain enabled. Turning off password authentication shifts all trust to public-key pairs; if none are loaded, the SSH daemon has nothing left to accept. Remember this governs shell access only and is independent of the Prism web console, which authenticates through its own path.",
    "tags": [
      "cluster lockdown",
      "ssh",
      "key-based auth",
      "hardening"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-E-001",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator needs to enable compression on one group of VMs while leaving another group uncompressed in the same cluster. At which level are data-efficiency settings like compression and deduplication applied?",
    "options": [
      "The storage pool, which spans all disks in the cluster",
      "The storage container",
      "Each individual virtual disk (vDisk)",
      "The CVM's local SSD"
    ],
    "answer": [
      1
    ],
    "explanation": "Compression, deduplication, erasure coding, and replication factor are all configured per storage container. A storage pool simply aggregates all physical drives in the cluster and holds no data-efficiency policy, so it cannot differentiate the two VM groups.",
    "reference": "Prism Web Console Guide - Storage Management",
    "phoneHint": "Pretty sure it's the container level, not the pool - go with the second option.",
    "steveClue": "",
    "tags": [
      "storage container",
      "storage pool",
      "compression",
      "deduplication"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-E-002",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A three-node cluster hosts a storage container configured with replication factor 2 (RF2). How many simultaneous node failures can this container survive without data loss?",
    "options": [
      "One",
      "Two",
      "Three",
      "Zero - RF2 provides no fault tolerance"
    ],
    "answer": [
      0
    ],
    "explanation": "RF2 maintains two copies of every write, so the cluster tolerates the loss of a single node or drive. Surviving two simultaneous failures requires RF3, which keeps three copies.",
    "reference": "AOS Storage / Prism Web Console Guide",
    "phoneHint": "I think RF2 covers a single failure - the first option.",
    "steveClue": "",
    "tags": [
      "RF2",
      "redundancy factor",
      "fault tolerance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-E-003",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Without any manual reservation, how does a Nutanix storage container present capacity to the hypervisor by default?",
    "options": [
      "Thick provisioned and eager-zeroed",
      "Thin provisioned, consuming capacity only as data is written",
      "Fully reserved at container creation time",
      "Read-only until a reservation is configured"
    ],
    "answer": [
      1
    ],
    "explanation": "Nutanix containers are thin provisioned by default, so physical capacity is consumed only as guests actually write data. Reservations or an advertised-capacity limit can be added explicitly, but they are not the default.",
    "reference": "Prism Web Console Guide - Storage Management",
    "phoneHint": "Nutanix is thin by default, I'm fairly sure - second option.",
    "steveClue": "",
    "tags": [
      "thin provisioning",
      "container",
      "reservations"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-E-004",
    "domain": "storage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "In the Nutanix storage architecture, what does a storage pool represent?",
    "options": [
      "A logical dataset with its own compression and RF policy",
      "The physical group of all disks (SSD and HDD) aggregated across the cluster",
      "The write buffer that absorbs random I/O before it is drained",
      "A datastore mounted by a single hypervisor host"
    ],
    "answer": [
      1
    ],
    "explanation": "A storage pool is the physical aggregation of all storage devices (SSDs and HDDs) across every node in the cluster, and typically a cluster has just one. Logical datasets that carry their own policies are storage containers, not pools.",
    "reference": "Prism Web Console Guide - Storage Management",
    "phoneHint": "The pool is the physical bucket of all the disks - second option.",
    "steveClue": "",
    "tags": [
      "storage pool",
      "architecture",
      "SSD",
      "HDD"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-M-001",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A workload generates a burst of small random writes followed by a large sequential write. In the Nutanix I/O path, how is this data typically handled?",
    "options": [
      "All writes are cached in the unified cache before being acknowledged",
      "Random writes land in the OpLog and are coalesced before draining; large sequential writes bypass it and go straight to the extent store",
      "Both random and sequential writes are written straight to the extent store",
      "Random writes go to the extent store while sequential writes are buffered in the OpLog"
    ],
    "answer": [
      1
    ],
    "explanation": "The OpLog is a persistent SSD write buffer that absorbs and coalesces random writes before draining them sequentially to the extent store. Large sequential writes gain nothing from buffering, so they bypass the OpLog and are written directly to the extent store.",
    "reference": "The Nutanix Bible - Book of AOS Storage (I/O Path)",
    "phoneHint": "I'm fairly confident random goes to OpLog and big sequential skips it - the second option.",
    "steveClue": "",
    "tags": [
      "oplog",
      "extent store",
      "io path",
      "sequential",
      "random"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-M-002",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "For which workload does Nutanix most recommend enabling deduplication?",
    "options": [
      "A transactional database with mostly unique, frequently-overwritten data",
      "VDI full clones and persistent desktops with large amounts of identical data",
      "A single large archival file server holding unique documents",
      "A latency-sensitive workload on a two-node ROBO cluster"
    ],
    "answer": [
      1
    ],
    "explanation": "Deduplication delivers the most benefit where many copies of identical data exist, such as full-clone VDI and persistent desktops (P2V migrations are another good fit). Workloads with mostly unique data gain little while still paying the metadata and compute overhead.",
    "reference": "Nutanix Data Efficiency Tech Note (TN-2032)",
    "phoneHint": "Dedup shines with VDI full clones - go second option.",
    "steveClue": "",
    "tags": [
      "deduplication",
      "vdi",
      "full clones",
      "data efficiency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-M-003",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "On which type of data does Nutanix erasure coding (EC-X) provide the best space savings with the least performance penalty?",
    "options": [
      "Write-hot data that is frequently overwritten",
      "Write-cold data that is read often but rarely modified after being written",
      "The OpLog's most recent random writes",
      "Metadata stored in the distributed Cassandra ring"
    ],
    "answer": [
      1
    ],
    "explanation": "EC-X is a post-process operation applied to write-cold data (extents not overwritten for roughly seven days), encoding data plus parity instead of full replicas to reclaim capacity. Overwrite-heavy data forces costly strip recalculation, so EC-X is not recommended there.",
    "reference": "Prism Web Console Guide - Erasure Coding Best Practices",
    "phoneHint": "EC-X likes cold, read-mostly data - second option, I think.",
    "steveClue": "",
    "tags": [
      "erasure coding",
      "EC-X",
      "write-cold",
      "data efficiency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-M-004",
    "domain": "storage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator wants to protect a cluster against two simultaneous node failures by using redundancy factor 3 (RF3). What is the minimum number of nodes required?",
    "options": [
      "Three",
      "Four",
      "Five",
      "Six"
    ],
    "answer": [
      2
    ],
    "explanation": "RF3 requires a minimum of five nodes because cluster metadata is kept at RF5 to survive two concurrent failures. RF2, by contrast, needs only three nodes.",
    "reference": "Prism Web Console Guide - Redundancy Factor 3",
    "phoneHint": "I believe RF3 needs five nodes minimum - the third option.",
    "steveClue": "",
    "tags": [
      "RF3",
      "redundancy factor",
      "minimum nodes",
      "fault tolerance"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-H-001",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A team plans to enable erasure coding on containers in two clusters: one protected with RF2 and one with RF3. What are the minimum node counts Nutanix requires to enable EC-X in each case?",
    "options": [
      "3 nodes for RF2 and 5 nodes for RF3",
      "4 nodes for RF2 and 6 nodes for RF3",
      "4 nodes for RF2 and 5 nodes for RF3",
      "5 nodes for RF2 and 7 nodes for RF3"
    ],
    "answer": [
      1
    ],
    "explanation": "Erasure coding needs enough nodes to place a full data-plus-parity strip and still rebuild after a failure: a minimum of 4 nodes for RF2 and 6 nodes for RF3. Meeting only the RF minimum (3 for RF2, 5 for RF3) is not sufficient to enable EC-X.",
    "reference": "Prism Web Console Guide - Erasure Coding Best Practices and Requirements",
    "phoneHint": "I'm leaning toward 4 and 6, but the node math is easy to trip on - double-check me.",
    "steveClue": "Erasure coding replaces full replicas with a strip of data blocks plus parity blocks, so the cluster must be able to hold the whole strip and still have spare capacity to rebuild a lost member. That pushes the requirement above the plain RF minimum by an extra node's worth of headroom at each protection level. Think about how many members an RF2 strip versus an RF3 strip needs before a rebuild is possible.",
    "tags": [
      "erasure coding",
      "EC-X",
      "minimum nodes",
      "RF2",
      "RF3"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-H-002",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An administrator wants to reclaim HDD capacity on a full-clone VDI container by enabling capacity-tier deduplication. What is a key prerequisite or characteristic they must account for?",
    "options": [
      "Capacity-tier dedup can be enabled independently and only affects the SSD read cache",
      "Cache (performance-tier) deduplication must be enabled before capacity-tier deduplication can be turned on",
      "Capacity-tier dedup removes the need for the OpLog on that container",
      "Capacity-tier dedup only functions on RF3 containers"
    ],
    "answer": [
      1
    ],
    "explanation": "Cache (performance-tier) dedup fingerprints data to deduplicate the in-memory and SSD read cache, while capacity-tier dedup extends that deduplication to persistent HDD data - and it can only be enabled if cache dedup is already on. It also carries higher CVM resource requirements, so it is reserved for high-duplication workloads like full-clone VDI.",
    "reference": "Nutanix Data Efficiency Tech Note (TN-2032)",
    "phoneHint": "I think you have to turn on the cache/performance dedup first - second option, but verify.",
    "steveClue": "Nutanix has two deduplication scopes that build on each other: one shrinks the working set held in RAM and flash so more of it stays hot, and the other extends the same fingerprint-based dedup down onto spinning disk to reclaim persistent capacity. Because the disk-level scope reuses the fingerprints generated by the cache-level scope, one is a strict prerequisite for the other. Consider which layer produces the fingerprints first.",
    "tags": [
      "deduplication",
      "capacity tier",
      "cache tier",
      "vdi",
      "prerequisite"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-H-003",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Curator performs two related but distinct background operations: disk balancing and Information Lifecycle Management (ILM). Which statement correctly distinguishes them?",
    "options": [
      "Disk balancing moves data between the SSD and HDD tiers; ILM redistributes data across disks within one tier",
      "Disk balancing evens out utilization across disks within one tier; ILM migrates data between the SSD and HDD tiers by access frequency",
      "Both operations move data only between tiers, but ILM always runs first",
      "Disk balancing applies only to the OpLog while ILM applies only to the extent store"
    ],
    "answer": [
      1
    ],
    "explanation": "Disk balancing keeps utilization uniform across disks within the same tier, while ILM moves data between tiers - down-migrating cold extents from SSD to HDD and up-migrating hot data - based on access patterns and SSD utilization thresholds. Option one reverses the two.",
    "reference": "The Nutanix Bible - Book of AOS Storage (Disk Balancing / ILM)",
    "phoneHint": "The second option lines up with what I remember - balancing is within a tier, ILM is between tiers.",
    "steveClue": "Two different problems are being solved here. One is 'my disks are unevenly full' - the fix keeps capacity level across drives that sit in the same performance class. The other is 'my fast flash is filling up with data nobody touches' - the fix relocates data up or down the SSD/HDD hierarchy according to how hot it is. Don't let the similar names blur which one crosses tier boundaries.",
    "tags": [
      "disk balancing",
      "ILM",
      "tiering",
      "curator",
      "SSD",
      "HDD"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "STOR-H-004",
    "domain": "storage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "On a storage container an administrator sets the compression delay to 0 minutes. What behavior does this configure, and when is it preferred?",
    "options": [
      "Post-process compression that waits for a Curator scan; preferred for latency-sensitive random writes",
      "Inline compression that compresses data as it is written; preferred for most workloads, especially large or sequential I/O",
      "Compression is effectively disabled because the delay is zero",
      "Deduplication rather than compression, because a zero delay switches the feature"
    ],
    "answer": [
      1
    ],
    "explanation": "A compression delay of 0 minutes configures inline compression: data is compressed on the write path (random writes still buffer in the OpLog, but data is compressed as it drains to the extent store). A non-zero delay defers compression to a later Curator (post-process) pass. Inline is generally recommended, especially for large or sequential I/O.",
    "reference": "The Nutanix Bible - Book of AOS Data Efficiency (Compression)",
    "phoneHint": "Zero delay means inline compression, I'm fairly sure - second option, but confirm the delay logic.",
    "steveClue": "Nutanix expresses the choice between compressing on the write path versus compressing later as a single tunable: a delay measured in minutes. Set it to nothing and data is squeezed as it lands in the extent store; set it to a positive value and a background maintenance pass handles it afterward. A zero here does not mean 'off' - it means 'do it now.' Reason about what a delay of zero implies for timing.",
    "tags": [
      "compression",
      "inline",
      "post-process",
      "compression delay",
      "data efficiency"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-E-001",
    "domain": "unifiedstorage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A team needs a single shared folder reachable by both Windows desktops and Linux servers using their native file-sharing methods. Which pair of protocols does Nutanix Files support to serve these clients?",
    "options": [
      "iSCSI and Fibre Channel",
      "S3 and Swift object APIs",
      "SMB for Windows and NFS for Linux/UNIX",
      "SMB and iSCSI"
    ],
    "answer": [
      2
    ],
    "explanation": "Nutanix Files is a scale-out file service that presents shares over SMB (for Windows clients) and exports over NFS (for Linux/UNIX clients), including multiprotocol access. iSCSI and S3 are block and object protocols delivered by Volumes and Objects, not Files.",
    "reference": "Nutanix Files User Guide",
    "phoneHint": "I'm pretty confident it's the SMB-plus-NFS option - those are the classic Windows and Linux file protocols.",
    "steveClue": "",
    "tags": [
      "nutanix-files",
      "smb",
      "nfs",
      "protocols"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-E-002",
    "domain": "unifiedstorage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "A cloud-native application team wants to store unstructured data in buckets using the same API they use with public cloud object storage. Which API does Nutanix Objects expose?",
    "options": [
      "An Amazon S3-compatible REST API",
      "NFS version 4.1",
      "The iSCSI block protocol",
      "SMB 3.0"
    ],
    "answer": [
      0
    ],
    "explanation": "Nutanix Objects is S3-compatible object storage: applications interact with buckets and objects over an Amazon S3-style REST API using access and secret keys. NFS, iSCSI, and SMB are file and block protocols, not object interfaces.",
    "reference": "Nutanix Objects User Guide",
    "phoneHint": "S3-compatible is what object storage means here, so I'd go with the first choice.",
    "steveClue": "",
    "tags": [
      "nutanix-objects",
      "s3",
      "buckets",
      "object-storage"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-E-003",
    "domain": "unifiedstorage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "An administrator needs to present raw block storage volumes to an external server so the guest OS sees them as local disks. Over which protocol does Nutanix Volumes deliver this block storage?",
    "options": [
      "SMB 3.0",
      "iSCSI",
      "NFSv3",
      "The S3 REST API"
    ],
    "answer": [
      1
    ],
    "explanation": "Nutanix Volumes exposes block storage (volume groups made of virtual disks) to clients over iSCSI, so initiators mount them as block devices. SMB and NFS are file protocols and S3 is object storage.",
    "reference": "Nutanix Volumes Guide",
    "phoneHint": "Block storage to external clients almost always means iSCSI - the second option.",
    "steveClue": "",
    "tags": [
      "nutanix-volumes",
      "iscsi",
      "block-storage"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-E-004",
    "domain": "unifiedstorage",
    "authoredDifficulty": "easy",
    "type": "single",
    "stem": "Nutanix Files is delivered as a scale-out cluster of dedicated virtual machines that own and serve the file data. What are these virtual machines called?",
    "options": [
      "Controller VMs (CVMs)",
      "File Server VMs (FSVMs)",
      "Prism Central VMs",
      "Witness VMs"
    ],
    "answer": [
      1
    ],
    "explanation": "A Nutanix Files file server is composed of File Server VMs (FSVMs), which host the shares and scale out as more are added. CVMs run AOS storage services for the whole cluster, and Prism Central and Witness VMs serve management and quorum roles, not file serving.",
    "reference": "Nutanix Files User Guide",
    "phoneHint": "The file service runs on File Server VMs - FSVMs, the second answer.",
    "steveClue": "",
    "tags": [
      "nutanix-files",
      "fsvm",
      "architecture"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-M-001",
    "domain": "unifiedstorage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "An administrator is deploying a Nutanix Files share for 5,000 users who each need their own home directory, and wants user connections and data spread evenly across all FSVMs. Which share type best meets this goal?",
    "options": [
      "A standard (general) share, which is hosted entirely on a single FSVM",
      "A distributed (home) share, which spreads top-level directories across all FSVMs",
      "An SMB share with continuous availability, which round-robins every file",
      "An NFS export with root squash enabled"
    ],
    "answer": [
      1
    ],
    "explanation": "A distributed (home) share assigns its top-level directories across all FSVMs, balancing load for workloads such as user home directories and profiles. A standard share lives on one FSVM, so a large user population would concentrate load on that single VM.",
    "reference": "Nutanix Files User Guide",
    "phoneHint": "For thousands of home directories you'd want the distributed share so the load is shared - I'd pick the second one.",
    "steveClue": "",
    "tags": [
      "nutanix-files",
      "distributed-share",
      "standard-share",
      "home-directories"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-M-002",
    "domain": "unifiedstorage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "Before external servers can attach volume groups from Nutanix Volumes over iSCSI, one cluster-level address must be configured. Which address is it, and what is its role?",
    "options": [
      "The Cluster Virtual IP, which gives a single address for the Prism web console",
      "The iSCSI Data Services IP, a cluster-wide address clients use for discovery and that redirects them to a CVM",
      "Each CVM's backplane IP, so initiators can target the storage network directly",
      "The AHV host management IP, which brokers all iSCSI sessions"
    ],
    "answer": [
      1
    ],
    "explanation": "The iSCSI Data Services IP is a single cluster-wide virtual IP that external iSCSI clients use as the discovery/target portal; the cluster then redirects each session to an appropriate CVM and can re-redirect on failure for high availability. The Cluster Virtual IP is a separate address used for Prism and cluster management.",
    "reference": "Nutanix Volumes Guide",
    "phoneHint": "It's the iSCSI Data Services IP - the one purpose-built for external block clients, not the Prism virtual IP. The second option.",
    "steveClue": "",
    "tags": [
      "nutanix-volumes",
      "data-services-ip",
      "iscsi",
      "external-clients"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-M-003",
    "domain": "unifiedstorage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A physical, non-virtualized database server needs low-latency storage presented as raw LUNs that its operating system formats and manages directly. Which Nutanix data service fits this requirement?",
    "options": [
      "Nutanix Files, via an SMB share",
      "Nutanix Objects, via an S3 bucket",
      "Nutanix Volumes, via iSCSI-attached volume groups",
      "A Nutanix Files distributed NFS export"
    ],
    "answer": [
      2
    ],
    "explanation": "Raw block LUNs that the guest OS formats and owns are the definition of block storage, which Nutanix Volumes delivers as iSCSI volume groups to external and physical clients. Files (SMB/NFS) serves shared files, and Objects serves S3 objects - neither presents raw block devices.",
    "reference": "Nutanix Volumes Guide",
    "phoneHint": "Raw LUNs to a bare-metal database points to Volumes and iSCSI - the third option feels right.",
    "steveClue": "",
    "tags": [
      "nutanix-volumes",
      "workload-selection",
      "block-storage",
      "iscsi"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-M-004",
    "domain": "unifiedstorage",
    "authoredDifficulty": "medium",
    "type": "single",
    "stem": "A team wants their Nutanix Objects bucket to keep prior copies of an object whenever it is overwritten or deleted, so an earlier state can be recovered after an accidental change. Which bucket feature should they enable?",
    "options": [
      "Bucket versioning",
      "A lifecycle expiration policy",
      "Multipart upload",
      "Static website hosting"
    ],
    "answer": [
      0
    ],
    "explanation": "Bucket versioning preserves multiple versions of an object as it is overwritten or deleted, allowing recovery of a previous version. A lifecycle policy removes or transitions objects over time, multipart upload only aids large-object uploads, and website hosting serves content - none of these retain prior versions.",
    "reference": "Nutanix Objects User Guide",
    "phoneHint": "Keeping older copies of an object is exactly what versioning does - I'd choose the first one.",
    "steveClue": "",
    "tags": [
      "nutanix-objects",
      "versioning",
      "buckets",
      "data-protection"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-H-001",
    "domain": "unifiedstorage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An external server opens an iSCSI session to a Nutanix cluster's Data Services IP to use a volume group. How does the cluster handle that session, and what happens if the CVM serving it fails?",
    "options": [
      "The initiator is permanently bound to whichever CVM currently owns the Data Services IP address.",
      "The Data Services IP is a discovery portal that redirects the initiator to a CVM, then to a healthy CVM if that CVM fails.",
      "Every virtual disk in the volume group is served simultaneously by all CVMs via round-robin MPIO by default.",
      "After discovery the initiator connects directly to the target CVM's management IP and no longer uses the Data Services IP."
    ],
    "answer": [
      1
    ],
    "explanation": "The Data Services IP is the iSCSI redirection portal: the initiator connects to it and is redirected to a CVM that serves the target, and if that CVM fails the initiator reconnects through the Data Services IP and is redirected to a healthy CVM, providing transparent high availability without a separate load balancer.",
    "reference": "Nutanix Volumes Guide",
    "phoneHint": "I think the whole point of the Data Services IP is redirection with automatic failover, so probably the second option - but confirm the failover wording.",
    "steveClue": "External iSCSI clients never target a CVM directly; they connect to one stable cluster-wide portal address. That portal's job is to redirect the session to whichever CVM is currently hosting the target, and to redirect again to a surviving CVM after a failure. This built-in redirection is why Volumes offers high availability to physical and virtual clients without external load balancers or MPIO tricks.",
    "tags": [
      "nutanix-volumes",
      "data-services-ip",
      "iscsi-redirection",
      "high-availability"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-H-002",
    "domain": "unifiedstorage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "An admin created a Nutanix Files distributed share but placed all of the data under one single top-level folder. They now see one FSVM heavily loaded while the others sit idle. What best explains this behavior?",
    "options": [
      "Distributed shares balance load per top-level directory, so everything under one top-level folder is served by a single FSVM.",
      "Distributed shares stripe each file's blocks evenly across FSVMs, so the imbalance means an FSVM has failed.",
      "Distributed shares balance strictly per client connection regardless of folder layout, so the structure is irrelevant.",
      "Distributed shares require SMB continuous availability to balance, and it was not enabled."
    ],
    "answer": [
      0
    ],
    "explanation": "A distributed share distributes ownership at the top-level-directory granularity: each top-level folder is assigned to an FSVM. If all data lives under one top-level folder, that whole tree is owned by a single FSVM, so no balancing occurs. Effective distribution requires many top-level folders (such as one per user).",
    "reference": "Nutanix Files User Guide",
    "phoneHint": "I'm fairly sure distributed shares balance by top-level folder, so one big folder would land on one FSVM - the first option, but double-check the granularity.",
    "steveClue": "Distributed shares spread work by handing out top-level directories to different FSVMs, not by striping individual file blocks. The balancing therefore depends entirely on having many top-level folders - the classic fit is a home-directory or profile share where each user is a separate top-level folder. Concentrating everything under one folder defeats the design because that one folder can only be owned by a single FSVM.",
    "tags": [
      "nutanix-files",
      "distributed-share",
      "fsvm",
      "load-balancing"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-H-003",
    "domain": "unifiedstorage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "A Kubernetes platform on Nutanix needs a persistent volume that many pods spread across different worker nodes can mount read-write at the same time (ReadWriteMany). Which Nutanix backend satisfies this through the CSI driver?",
    "options": [
      "Nutanix Volumes, because iSCSI block devices natively support concurrent multi-node read-write mounts.",
      "Nutanix Files, which provides an NFS-backed ReadWriteMany file volume.",
      "Nutanix Objects, mounted as a POSIX filesystem directly by each pod.",
      "A local ephemeral disk provisioned on each worker node."
    ],
    "answer": [
      1
    ],
    "explanation": "ReadWriteMany requires a shared file system that multiple nodes can safely mount at once, which Nutanix Files provides over NFS via the CSI driver. Block volumes from Nutanix Volumes are ReadWriteOnce per node - sharing a raw block device across nodes without a cluster-aware file system risks corruption - and Objects is accessed via the S3 API, not a POSIX mount.",
    "reference": "Nutanix CSI / Cloud Native Storage Documentation",
    "phoneHint": "RWX across nodes screams shared file system, which is Files over NFS - I'd lean to the second option, though verify block can't do RWX safely.",
    "steveClue": "The key distinction is block versus file access. A raw block volume attaches to one node at a time (ReadWriteOnce); letting several nodes write the same block device without a clustered file system would corrupt data. Simultaneous read-write access from many nodes (ReadWriteMany) needs a shared file protocol, which is exactly what a network file service delivers. Object storage is reached through an HTTP/S3 API, not mounted as a POSIX file system, so it doesn't fit a standard persistent volume mount.",
    "tags": [
      "nutanix-files",
      "nutanix-volumes",
      "csi",
      "kubernetes",
      "workload-selection"
    ],
    "reviewStatus": "verified"
  },
  {
    "id": "NUS-H-004",
    "domain": "unifiedstorage",
    "authoredDifficulty": "hard",
    "type": "single",
    "stem": "Compliance rules require that once written, certain records stored in Nutanix Objects cannot be modified or deleted until a fixed retention period expires. Which capability enforces this immutability?",
    "options": [
      "Bucket versioning, which retains prior copies of each object",
      "WORM (Write Once Read Many) object-lock retention",
      "A lifecycle policy that transitions objects to an archive tier",
      "Server-side encryption with cluster-managed keys"
    ],
    "answer": [
      1
    ],
    "explanation": "WORM / object-lock retention makes objects immutable, blocking modification and deletion until the retention period ends, which is what regulatory records demand. Versioning keeps history but a versioned object can still be overwritten or deleted, lifecycle policies actively change or expire data, and encryption protects confidentiality, not immutability.",
    "reference": "Nutanix Objects User Guide",
    "phoneHint": "Immutable-until-expiry compliance storage is WORM / object lock, so probably the second choice - but confirm it's not just versioning.",
    "steveClue": "There is an important gap between keeping history and enforcing immutability. Versioning preserves older copies, yet a user can still create new versions or delete objects, so it cannot guarantee a record stays unchanged. Regulatory retention requires a WORM/object-lock mechanism that actively prevents any modification or deletion of an object for a defined period. Encryption and lifecycle tiering solve different problems - confidentiality and cost - not immutability.",
    "tags": [
      "nutanix-objects",
      "worm",
      "object-lock",
      "compliance",
      "immutability"
    ],
    "reviewStatus": "verified"
  }
];
