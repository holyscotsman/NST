# Example question bank — FORMAT ILLUSTRATION ONLY

This file exists to demonstrate the Markdown format and to exercise the
importer/parser in tests. It is **not** shipped as playable content and is not
authored as an exam key — the owner's real bank replaces it. See
`docs/QUESTION_AUTHORING.md` for the full spec.

## Q1
- **Domain:** storage
- **Difficulty:** easy

**Question:** A storage container is a logical construct that draws its capacity
from which underlying Nutanix construct?

- [x] A storage pool
- [ ] A single physical disk
- [ ] The CVM boot volume
- [ ] A protection domain

**Explanation:** A container is a logical slice of a storage pool; the pool
aggregates the cluster's physical devices.
**Phone a friend:** I'm fairly sure it draws from the pool.
**Reference:** Illustrative only

## Q2
- **Domain:** ahv
- **Difficulty:** medium
- **Type:** multi

**Question:** Which of the following are real AHV capabilities? (Select all
that apply.)

- [x] Live migration of running VMs
- [x] VM affinity and anti-affinity rules
- [ ] Faster-than-light snapshots
- [x] Image management for VM deployment

**Explanation:** Live migration, affinity rules, and image management are all
real AHV features; the third option is not.

## Q3
- **Domain:** monitoring
- **Difficulty:** hard
- **Image:** example-diagram.png
- **Alt:** Illustrative placeholder diagram

**Question:** Which built-in utility runs a broad battery of health checks
against cluster components?

- [x] NCC (Nutanix Cluster Check)
- [ ] Foundation
- [ ] Logbay
- [ ] Prism Central Playbooks

**Explanation:** NCC bundles the health checks; Logbay collects logs and
Foundation images nodes.
**Reference:** Illustrative only
