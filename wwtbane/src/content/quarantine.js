// quarantine.js — questions held back from play, awaiting human rework
// AUTO-ASSEMBLED from human-guided authoring + independent AI verification
// (offline ingestion QA per CLAUDE.md §4). Every key was re-derived by a second
// agent and marked reviewStatus:"verified". These remain pending final HUMAN
// sign-off — see docs/CONTENT_QA_REPORT.md and FLAGS.md.
// Do not hand-edit for content; edit the source and re-run assembly, or curate
// directly once a human owns the bank.

// NOT imported by the game. Kept for a human to fix, merge, or discard.
export const QUARANTINE = [
  {
    "id": "STOR-X-001",
    "domain": "storage",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "An admin observes that free space is not reclaimed the instant VMs are deleted, and that disk rebalancing happens on a steady rhythm. Which statement correctly describes the default scan cadence of the Curator background maintenance framework?",
    "options": [
      "Partial scans run roughly every 6 hours; full scans run roughly every hour",
      "Full and partial scans both run every 60 minutes in lockstep",
      "Full scans run roughly every 6 hours; partial scans run roughly every hour",
      "Curator only scans on demand when an administrator manually triggers it"
    ],
    "answer": [
      2
    ],
    "explanation": "Curator is a distributed MapReduce framework that runs a comprehensive full scan approximately every 6 hours and a lighter partial scan approximately every hour. These background scans drive disk balancing, ILM tiering, and reclamation of space from deleted vDisks, which is why freed capacity is not returned instantly.",
    "reference": "Nutanix AOS Distributed Storage Fabric architecture (Curator)",
    "phoneHint": "I'm fairly sure the big sweep is every six hours and the lighter one every hour, but don't hold me to the exact minutes.",
    "steveClue": "Picture the cluster's janitor: a MapReduce engine that periodically sweeps metadata to rebalance disks, tier cold data down, and garbage-collect deletions. It runs two cadences, a heavyweight comprehensive pass on a multi-hour timer and a much more frequent lighter pass. The comprehensive one is measured in hours, not minutes, and it is never purely manual.",
    "tags": [
      "curator",
      "mapreduce",
      "background-scan",
      "space-reclamation"
    ],
    "reviewStatus": "quarantine",
    "impossible": false,
    "quarantineReason": "Duplicate niche fact (Curator scan cadence) — kept PERF-X-001"
  },
  {
    "id": "FDN-X-001",
    "domain": "foundation",
    "authoredDifficulty": "extreme",
    "type": "single",
    "stem": "Each hypervisor host reaches its local Controller VM over a private, non-routed internal network. On that 192.168.5.0/24 segment the host is .1 and the local CVM is .2. Which additional address does AOS reserve there, configured as a sub-interface (eth1:1) on the CVM?",
    "options": [
      "192.168.5.3",
      "192.168.5.100",
      "192.168.5.253",
      "192.168.5.254"
    ],
    "answer": [
      3
    ],
    "explanation": "AOS reserves 192.168.5.1 (host), 192.168.5.2 (local CVM), and 192.168.5.254 (a CVM internal sub-interface, eth1:1) on the private internal network. Guest storage I/O to the local CVM traverses this segment, and CVM autopathing reroutes it to a remote CVM if the local one fails.",
    "reference": "The Nutanix Bible - Book of vSphere / How It Works (CVM Autopathing); Nutanix networking references",
    "phoneHint": "Something up in the .250s, I think .254, the last option, but I would not bet the house on the exact host number.",
    "steveClue": "This is the tiny private link between a host and the storage controller living on the very same node, not a production VLAN. Only a handful of addresses on it are reserved: the hypervisor, the controller VM, and one more high-numbered address bound to a controller sub-interface. Reach for the address near the very top of the /24.",
    "tags": [
      "foundation",
      "internal-network",
      "192.168.5.0",
      "autopathing",
      "cvm"
    ],
    "reviewStatus": "quarantine",
    "impossible": true,
    "quarantineReason": "Duplicate niche fact (192.168.5.254 internal address) — kept AHV-X-001"
  }
];

export default QUARANTINE;
