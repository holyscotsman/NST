# Kubernetes and Cloud Native Associate (KCNA)
cert: KCNA
title: Kubernetes and Cloud Native Associate
version: 2026.1
pass: 0.75
domains: architecture, workloads, scheduling, networking, storage, security, observability, delivery, cloud-native

### kcna-001
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What native runtime is Open Container Initiative (OCI) compliant?
- [x] runC
- [ ] runV
- [ ] kata-containers
- [ ] gvisor

Explain: runC is the OCI-compliant reference container runtime.

### kcna-002
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Which API object is the recommended way to run a scalable, stateless application on your cluster?
- [ ] ReplicaSet
- [x] Deployment
- [ ] DaemonSet
- [ ] Pod

Explain: Deployments manage ReplicaSets and provide declarative updates, making them the recommended way to run scalable, stateless apps.

### kcna-003
domain: workloads
difficulty: 5
tags: kubernetes, cloud-native

Q: A CronJob is scheduled to run every one hour. What happens in the cluster when it's time for it to run?
- [ ] Kubelet watches API Server for CronJob objects and runs the Pod directly.
- [ ] Kube-scheduler watches API Server for CronJob objects.
- [ ] CronJob controller creates a Pod and waits until it finishes.
- [x] CronJob controller creates a Job, then the Job controller creates a Pod and waits until it finishes.

Explain: The CronJob controller creates a Job on schedule, and the Job controller then creates the Pod(s).

### kcna-004
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the purpose of the kubelet component within a Kubernetes cluster?
- [ ] A dashboard for managing and troubleshooting applications.
- [ ] A network proxy implementing part of the Service concept.
- [ ] A component that watches for unscheduled Pods and selects a node.
- [x] An agent on each node that ensures containers are running in a Pod.

Explain: The kubelet is the node agent ensuring containers described in Pod specs are actually running.

### kcna-005
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the default value for --authorization-mode in the Kubernetes API server?
- [ ] --authorization-mode=RBAC
- [x] --authorization-mode=AlwaysAllow
- [ ] --authorization-mode=AlwaysDeny
- [ ] --authorization-mode=ABAC

Explain: The historical/raw default is AlwaysAllow, though most distributions explicitly enable RBAC.

### kcna-006
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: An org needs to run 1000 batch jobs of 1 hour each every Monday, cost-effectively. What's best?
- [ ] Run a fixed group of nodes reserved via taints/tolerations/nodeSelectors.
- [x] Leverage the Cluster Autoscaler to start/stop nodes as needed.
- [ ] Commit to reserved instances for discounted pricing.
- [ ] Use PriorityClasses so the batch job gets priority.

Explain: The Cluster Autoscaler scales nodes up only when needed and back down after, which is most cost-effective for bursty batch work.

### kcna-007
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What is a Kubernetes service with no cluster IP address called?
- [x] Headless Service
- [ ] Nodeless Service
- [ ] IPLess Service
- [ ] Specless Service

Explain: A Service with clusterIP: None is called a headless Service.

### kcna-008
domain: delivery
difficulty: 1
tags: kubernetes, cloud-native

Q: CI/CD stands for:
- [ ] Continuous Information / Continuous Development
- [ ] Continuous Integration / Continuous Development
- [ ] Cloud Integration / Cloud Development
- [x] Continuous Integration / Continuous Deployment

Explain: CI/CD stands for Continuous Integration / Continuous Deployment (or Delivery).

### kcna-009
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: What default level of protection is applied to data in Kubernetes Secrets?
- [ ] AES symmetric encryption
- [ ] Stored in plain text
- [ ] Encoded with SHA256 hashes
- [x] Base64 encoded

Explain: By default Secret data is only base64 encoded, not encrypted, unless encryption-at-rest is separately configured.

### kcna-010
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What function does kube-proxy provide to a cluster?
- [ ] Implementing the Ingress resource type.
- [x] Forwarding data to the correct endpoints for Services.
- [ ] Managing data egress from nodes to the network.
- [ ] Managing access to the Kubernetes API.

Explain: kube-proxy maintains network rules that forward traffic to the correct Service endpoints.

### kcna-011
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: How long should a stable API element be supported (at minimum) after deprecation?
- [ ] 9 months
- [ ] 24 months
- [x] 12 months
- [ ] 6 months

Explain: Stable (GA) APIs must be supported for at least 12 months (or 3 releases) after deprecation.

### kcna-012
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the name of the lightweight Kubernetes distribution built for IoT and edge computing?
- [ ] OpenShift
- [x] k3s
- [ ] RKE
- [ ] k1s

Explain: k3s is a certified, lightweight Kubernetes distribution designed for edge and IoT.

### kcna-013
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Kubernetes ___ automatically manages the number of nodes in your cluster to meet demand.
- [ ] Node Autoscaler
- [x] Cluster Autoscaler
- [ ] Horizontal Pod Autoscaler
- [ ] Vertical Pod Autoscaler

Explain: The Cluster Autoscaler adjusts node count based on scheduling demand.

### kcna-014
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement is correct concerning Open Policy Agent (OPA)?
- [ ] Policies must be written in Python.
- [x] Kubernetes can use it to validate requests and apply policies.
- [ ] Policies can only be tested when published.
- [ ] It cannot be used outside Kubernetes.

Explain: OPA (via admission webhooks like Gatekeeper) validates and enforces policy on API requests, and works outside Kubernetes too.

### kcna-015
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: In a cloud native world, what does IaC stand for?
- [ ] Infrastructure and Code
- [x] Infrastructure as Code
- [ ] Infrastructure above Code
- [ ] Infrastructure across Code

Explain: IaC = Infrastructure as Code.

### kcna-016
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: In which framework do developers no longer deal with capacity, deployments, scaling, fault tolerance, and OS?
- [ ] Docker Swarm
- [ ] Kubernetes
- [ ] Mesos
- [x] Serverless

Explain: Serverless computing abstracts away infrastructure concerns like capacity and scaling.

### kcna-017
domain: scheduling
difficulty: 2
tags: kubernetes, cloud-native

Q: Which characteristic is associated with container orchestration?
- [ ] Application message distribution
- [x] Dynamic scheduling
- [ ] Deploying application JAR files
- [ ] Virtual Machine distribution

Explain: Dynamic scheduling of containers onto hosts is a core orchestration characteristic.

### kcna-018
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: Which workload requires a headless service while deploying into the namespace?
- [x] StatefulSet
- [ ] CronJob
- [ ] Deployment
- [ ] DaemonSet

Explain: StatefulSets use a headless Service to provide stable per-Pod network identities.

### kcna-019
domain: delivery
difficulty: 2
tags: kubernetes, cloud-native

Q: What is Helm?
- [ ] An open source dashboard for Kubernetes.
- [x] A package manager for Kubernetes applications.
- [ ] A custom scheduler for Kubernetes.
- [ ] An end-to-end testing project.

Explain: Helm is the package manager for Kubernetes, using charts to define, install, and upgrade applications.

### kcna-020
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: Which is the correct kubectl command to display logs in real time?
- [ ] kubectl logs -p test-container-1
- [ ] kubectl logs -c test-container-1
- [ ] kubectl logs -l test-container-1
- [x] kubectl logs -f test-container-1

Explain: The -f (follow) flag streams logs in real time.

### kcna-021
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: How can you load and generate data required before Pod startup?
- [x] Use an init container with shared file storage.
- [ ] Use a PVC volume.
- [ ] Use a sidecar container with shared volume.
- [ ] Use another pod with a PVC.

Explain: Init containers run to completion before app containers start and can prep shared data via a shared volume.

### kcna-022
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the core functionality of GitOps tools like Argo CD and Flux?
- [ ] They track human production changes and generate an audit trail.
- [ ] They replace human operations with a Git-command agent.
- [ ] They automatically create PRs when dependencies are outdated.
- [x] They continuously compare desired state in Git with actual state and act on differences.

Explain: GitOps tools continuously reconcile the live cluster to match the declared state in Git.

### kcna-023
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Which resource workload ensures that all (or some) nodes run a copy of a Pod?
- [ ] ReplicaSet
- [ ] StatefulSet
- [x] DaemonSet
- [ ] Deployment

Explain: A DaemonSet ensures a copy of a Pod runs on all or a selected subset of nodes.

### kcna-024
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What does CRD stand for, used to extend the Kubernetes API?
- [x] Custom Resource Definition
- [ ] Custom Restricted Definition
- [ ] Customized RUST Definition
- [ ] Custom RUST Definition

Explain: CRD = Custom Resource Definition, used with the aggregation layer to extend the API.

### kcna-025
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: The Kubernetes project's work is carried primarily by SIGs. What does SIG stand for?
- [x] Special Interest Group
- [ ] Software Installation Guide
- [ ] Support and Information Group
- [ ] Strategy Implementation Group

Explain: SIG = Special Interest Group.

### kcna-026
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the order of the 4C's in Cloud Native Security, starting with the layer a user has most control over?
- [ ] Cloud -> Container -> Cluster -> Code
- [ ] Container -> Cluster -> Code -> Cloud
- [ ] Cluster -> Container -> Code -> Cloud
- [x] Code -> Container -> Cluster -> Cloud

Explain: The 4Cs go Code, Container, Cluster, Cloud, from most to least user control.

### kcna-027
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which group of container runtimes provides additional sandboxed isolation and elevated security?
- [ ] runc, cgroups
- [ ] docker, containerd
- [x] runsc, kata
- [ ] crun, cri-o

Explain: gVisor (runsc) and Kata Containers add sandboxing beyond standard runtimes.

### kcna-028
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the common standard for Service Meshes?
- [ ] Service Mesh Specification (SMS)
- [ ] Service Mesh Technology (SMT)
- [x] Service Mesh Interface (SMI)
- [ ] Service Mesh Function (SMF)

Explain: SMI (Service Mesh Interface) was the common standard interface for service meshes.

### kcna-029
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement about Ingress is correct?
- [ ] Ingress tracks network endpoints within a cluster.
- [ ] Ingress is a Service type like NodePort and ClusterIP.
- [ ] Ingress specifies how a Pod is allowed to communicate.
- [x] Ingress exposes routes from outside the cluster to services in the cluster.

Explain: Ingress exposes HTTP/HTTPS routes from outside the cluster to internal Services.

### kcna-030
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What best describes cloud native service discovery?
- [x] A mechanism for applications/microservices to locate each other on a network.
- [ ] A procedure for discovering a MAC address for an IP.
- [ ] Automatically assigning IP addresses to devices.
- [ ] A protocol turning domain names into IP addresses.

Explain: Service discovery lets services locate each other dynamically on the network.

### kcna-031
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What components are common in a service mesh?
- [ ] Tracing and log storage
- [ ] Circuit breaking and Pod scheduling
- [ ] Data plane and runtime plane
- [x] Service proxy and control plane

Explain: A service mesh consists of a data-plane of proxies and a control plane managing them.

### kcna-032
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: Which storage operator in Kubernetes can help the system self-scale, self-heal, etc.?
- [x] Rook
- [ ] Kubernetes
- [ ] Helm
- [ ] Container Storage Interface (CSI)

Explain: Rook is a storage orchestrator that automates self-managing, self-scaling, self-healing storage services.

### kcna-033
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What fields must exist in any Kubernetes object (e.g., YAML) file?
- [x] apiVersion, kind, metadata
- [ ] kind, namespace, data
- [ ] apiVersion, metadata, namespace
- [ ] kind, metadata, data

Explain: apiVersion, kind, and metadata are required top-level fields (along with spec, in most cases).

### kcna-034
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which of the following would fall under the responsibilities of an SRE?
- [ ] Developing a new application feature.
- [x] Creating a monitoring baseline for an application.
- [ ] Submitting a budget for running an app in the cloud.
- [ ] Writing policy on how to submit a code change.

Explain: SREs focus on reliability practices like establishing monitoring baselines.

### kcna-035
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What are the initial namespaces that Kubernetes starts with?
- [x] default, kube-system, kube-public, kube-node-lease
- [ ] default, system, kube-public
- [ ] kube-default, kube-system, kube-main, kube-node-lease
- [ ] kube-default, system, kube-main, kube-primary

Explain: A fresh cluster starts with default, kube-system, kube-public, and kube-node-lease.

### kcna-036
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What is a probe within Kubernetes?
- [ ] A monitoring mechanism of the Kubernetes API.
- [ ] A pre-operational scope issued by kubectl.
- [x] A diagnostic performed periodically by the kubelet on a container.
- [ ] A logging mechanism of the Kubernetes API.

Explain: Probes are periodic diagnostics (liveness/readiness/startup) run by the kubelet against containers.

### kcna-037
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which Kubernetes feature guards against split-brain scenarios with distributed applications?
- [ ] Replication controllers
- [ ] Consensus protocols
- [ ] Rolling updates
- [x] StatefulSet

Explain: StatefulSets provide stable identity and ordered operations that help avoid split-brain in distributed apps. Study note: Community vote is split (57% StatefulSet / 43% consensus protocols) — treat with care.

### kcna-038
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What feature must a CNI support to control specific traffic flows for workloads?
- [ ] Border Gateway Protocol
- [ ] IP Address Management
- [ ] Pod Security Policy
- [x] Network Policies

Explain: CNI plugins that support NetworkPolicy allow controlling ingress/egress traffic flows.

### kcna-039
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the main role of Kubernetes DNS within a cluster?
- [ ] Acts as a DNS server for VMs outside the cluster.
- [ ] Provides DNS as a Service for user-owned domains.
- [ ] Converts IPv6 calls to IPv4 for dual-stack Pods.
- [x] Provides consistent DNS names for Pods and Services that need to communicate.

Explain: Cluster DNS (CoreDNS) gives stable, resolvable names to Pods and Services.

### kcna-040
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: A Service of type LoadBalancer has external-ip stuck 'Pending'. Which component is failing?
- [x] Cloud Controller Manager
- [ ] Load Balancer Manager
- [ ] Cloud Architecture Manager
- [ ] Cloud Load Balancer Manager

Explain: The Cloud Controller Manager provisions the cloud load balancer; if it fails, external-ip stays Pending.

### kcna-041
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What are the characteristics for building every cloud-native application?
- [ ] Resiliency, Operability, Observability, Availability
- [ ] Resiliency, Containerd, Observability, Agility
- [ ] Kubernetes, Operability, Observability, Availability
- [x] Resiliency, Agility, Operability, Observability

Explain: The commonly cited cloud native characteristics are Resiliency, Agility, Operability, and Observability.

### kcna-042
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What does CNCF stand for?
- [ ] Cloud Native Community Foundation
- [x] Cloud Native Computing Foundation
- [ ] Cloud Neutral Computing Foundation
- [ ] Cloud Neutral Community Foundation

Explain: CNCF = Cloud Native Computing Foundation.

### kcna-043
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Kubernetes supports multiple virtual clusters backed by the same physical cluster. These are called:
- [x] namespaces
- [ ] containers
- [ ] hypervisors
- [ ] cgroups

Explain: Namespaces provide virtual cluster partitioning within one physical cluster.

### kcna-044
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What component enables end users, cluster parts, and external components to communicate with one another?
- [ ] kubectl
- [ ] AWS Management Console
- [x] Kubernetes API
- [ ] Google Cloud SDK

Explain: The Kubernetes API is the central communication interface for the whole system.

### kcna-045
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command lists the resource types that exist within a cluster?
- [x] kubectl api-resources
- [ ] kubectl get namespaces
- [ ] kubectl api-versions
- [ ] curl https://kubectrl/namespaces

Explain: kubectl api-resources lists all resource types available in the cluster.

### kcna-046
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which of these components is part of the Kubernetes Control Plane?
- [ ] coredns
- [x] cloud-controller-manager
- [ ] kube-proxy
- [ ] kubelet

Explain: cloud-controller-manager is a control-plane component; kube-proxy and kubelet run on nodes.

### kcna-047
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which system is NOT compatible with the CRI runtime interface standard?
- [ ] CRI-O
- [ ] dockershim
- [x] systemd
- [ ] containerd

Explain: systemd is an init system, not a container runtime implementing CRI.

### kcna-048
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a key feature of a container network?
- [ ] Proxying REST requests across a set of containers.
- [x] Allowing containers on separate hosts to communicate.
- [ ] Allowing containers on the same host to communicate.
- [ ] Caching remote disk access.

Explain: A container network's key feature is enabling cross-host container communication.

### kcna-049
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: How can you monitor the progress of an updated Deployment/DaemonSet/StatefulSet?
- [ ] kubectl rollout watch
- [ ] kubectl rollout progress
- [ ] kubectl rollout state
- [x] kubectl rollout status

Explain: kubectl rollout status reports live rollout progress.

### kcna-050
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the goal of load balancing?
- [ ] Automatically measure request performance across instances.
- [ ] Automatically distribute requests across different app versions.
- [ ] Automatically distribute app instances across the cluster.
- [x] Automatically distribute requests across instances of an application.

Explain: Load balancing spreads incoming requests evenly across available application instances.

### kcna-051
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: How are ReplicaSets and Deployments related?
- [x] Deployments manage ReplicaSets and provide declarative updates to Pods.
- [ ] ReplicaSets manage stateful apps, Deployments manage stateless apps.
- [ ] Deployments are runtime instances of ReplicaSets.
- [ ] ReplicaSets are subsets of Jobs/CronJobs using imperative Deployments.

Explain: A Deployment is a higher-level controller that manages one or more ReplicaSets to enable declarative rollouts.

### kcna-052
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: What factors influence the Kubernetes scheduler when placing Pods on nodes?
- [x] Pod memory requests, node taints, and Pod affinity.
- [ ] Pod labels, node labels, and request labels.
- [ ] Node taints, node level, and Pod priority.
- [ ] Pod priority, container command, and node labels.

Explain: The scheduler weighs resource requests, taints/tolerations, and affinity/anti-affinity rules, among others.

### kcna-053
domain: observability
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the core metric type in Prometheus used to represent a single value that can go up and down?
- [ ] Summary
- [ ] Counter
- [ ] Histogram
- [x] Gauge

Explain: A Gauge represents a value that can arbitrarily increase or decrease.

### kcna-054
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary mechanism to identify grouped objects in a Kubernetes cluster?
- [ ] Custom Resources
- [x] Labels
- [ ] Label Selector
- [ ] Pod

Explain: Labels are the key/value metadata used to identify and group objects. Study note: Community vote is close (52% Labels / 48% Label Selector).

### kcna-055
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the name of the Kubernetes resource used to expose an application?
- [ ] Port
- [x] Service
- [ ] DNS
- [ ] Deployment

Explain: A Service is the resource used to expose a set of Pods as a network endpoint.

### kcna-056
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a DaemonSet?
- [x] A workload that ensures a specific set of nodes run a copy of a Pod.
- [ ] A workload maintaining a stable set of replica Pods on any node.
- [ ] A workload that runs periodically on a schedule.
- [ ] A workload providing ordering, uniqueness, and identity guarantees.

Explain: A DaemonSet ensures a Pod copy runs on all (or a selected subset of) nodes.

### kcna-057
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: What telemetry component represents a series of related distributed events encoding an end-to-end request flow?
- [ ] Metrics
- [ ] Logs
- [ ] Spans
- [x] Traces

Explain: Traces represent the end-to-end path of a request across a distributed system (composed of spans).

### kcna-058
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: In the Kubernetes platform, which component is responsible for running containers?
- [ ] etcd
- [x] CRI-O
- [ ] cloud-controller-manager
- [ ] kube-controller-manager

Explain: CRI-O is a container runtime that actually runs containers via the CRI interface.

### kcna-059
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: Services and Pods in Kubernetes are ______ objects.
- [ ] JSON
- [ ] YAML
- [ ] Java
- [x] REST

Explain: Kubernetes API objects, including Services and Pods, are managed as REST resources.

### kcna-060
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What Kubernetes component handles network communications inside/outside the cluster using OS packet filtering if available?
- [x] kube-proxy
- [ ] kubelet
- [ ] etcd
- [ ] kube-controller-manager

Explain: kube-proxy implements Service networking using iptables/IPVS or similar OS-level packet filtering.

### kcna-061
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What control plane component exposes the programmatic interface to create, manage, and interact with objects?
- [ ] kube-controller-manager
- [ ] kube-proxy
- [x] kube-apiserver
- [ ] etcd

Explain: The kube-apiserver is the front-end API for the whole control plane.

### kcna-062
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Which type of Service requires manual creation of Endpoints?
- [ ] LoadBalancer
- [x] Services without selectors
- [ ] NodePort
- [ ] ClusterIP with selectors

Explain: Selector-less Services need their Endpoints/EndpointSlices created manually.

### kcna-063
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command retrieves documentation and field definitions for a Kubernetes resource?
- [x] kubectl explain
- [ ] kubectl api-resources
- [ ] kubectl get --help
- [ ] kubectl show

Explain: kubectl explain shows field-level docs for a resource type.

### kcna-064
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Which lightweight tool manages traffic flows, enforces access policies, and aggregates telemetry without app code changes?
- [ ] NetworkPolicy
- [x] Linkerd
- [ ] kube-proxy
- [ ] Nginx

Explain: Linkerd is a lightweight service mesh providing traffic management, policy, and telemetry transparently.

### kcna-065
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: Which Kubernetes resource uses the immutable: true boolean field?
- [ ] Deployment
- [ ] Pod
- [x] ConfigMap
- [ ] ReplicaSet

Explain: ConfigMaps (and Secrets) support an immutable field to prevent further updates.

### kcna-066
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement about the Kubernetes network model is correct?
- [ ] Pods can only communicate via a Service.
- [x] Pods can communicate with all Pods without NAT.
- [ ] The Pod IP is only visible inside a Pod.
- [ ] The Service IP is used for Service-to-Service communication.

Explain: The flat Kubernetes network model requires that all Pods can reach all other Pods without NAT.

### kcna-067
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the resource type used to package sets of containers for scheduling in a cluster?
- [x] Pod
- [ ] ContainerSet
- [ ] ReplicaSet
- [ ] Deployment

Explain: A Pod packages one or more containers as the schedulable unit.

### kcna-068
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: Can a Kubernetes Service expose multiple ports?
- [ ] No, only one port per Service.
- [x] Yes, but each port must have an unambiguous name.
- [ ] Yes, the only requirement is different port numbers.
- [ ] No, only port 443 can be exposed.

Explain: A multi-port Service requires each port to be named uniquely. Study note: Community vote is close (56%/44%) on the exact wording of the requirement.

### kcna-069
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which persona is normally responsible for defining, testing, and running an incident management process?
- [x] Site Reliability Engineers
- [ ] Project Managers
- [ ] Application Developers
- [ ] Quality Engineers

Explain: SREs typically own incident management processes.

### kcna-070
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the default deployment strategy in Kubernetes?
- [x] Rolling update
- [ ] Blue/Green deployment
- [ ] Canary deployment
- [ ] Recreate deployment

Explain: RollingUpdate is the default Deployment strategy.

### kcna-071
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command provides info about the replicas field within a deployment's spec?
- [ ] kubectl get deployment.spec.replicas
- [x] kubectl explain deployment.spec.replicas
- [ ] kubectl describe deployment.spec.replicas
- [ ] kubectl explain deployment --spec.replicas

Explain: kubectl explain can target a nested field path like deployment.spec.replicas.

### kcna-072
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is a responsibility of the governance board of an open source project?
- [ ] Decide the project's marketing strategy.
- [ ] Review pull requests in the main branch.
- [x] Outline the project's 'terms of engagement'.
- [ ] Define the license used in the project.

Explain: Governance boards typically define how the project's community operates ('terms of engagement').

### kcna-073
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the role of a NetworkPolicy in Kubernetes?
- [ ] Encrypt and obscure all traffic.
- [x] Classify the Pods as isolated and non-isolated.
- [ ] Prevent loopback or incoming host traffic.
- [ ] Log network security events.

Explain: NetworkPolicies determine which Pods are isolated (traffic-restricted) vs. non-isolated.

### kcna-074
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What are the most important resources to guarantee etcd cluster performance?
- [ ] CPU and disk capacity.
- [x] Network throughput and disk I/O.
- [ ] CPU and RAM memory.
- [ ] Network throughput and CPU.

Explain: etcd is latency-sensitive; fast disk I/O and network throughput are critical.

### kcna-075
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: How do you deploy a workload to Kubernetes without additional tools?
- [ ] Create a Bash script and run it on a worker node.
- [ ] Create a Helm Chart and install it with helm.
- [x] Create a manifest and apply it with kubectl.
- [ ] Create a Python script and run it with kubectl.

Explain: kubectl apply -f against a plain manifest requires no additional tooling.

### kcna-076
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: How do you run a command in a running container of a Pod?
- [x] kubectl exec --
- [ ] docker exec
- [ ] kubectl run --
- [ ] kubectl attach -i

Explain: kubectl exec <pod> -- <cmd> runs a command inside a running container.

### kcna-077
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: How do you create a headless service?
- [ ] By specifying .spec.clusterIP: headless
- [x] By specifying .spec.clusterIP: None
- [ ] By specifying .spec.clusterIP: 0.0.0.0
- [ ] By specifying .spec.clusterIP: localhost

Explain: Setting clusterIP: None creates a headless Service.

### kcna-078
domain: storage
difficulty: 4
tags: kubernetes, cloud-native

Q: How does dynamic storage provisioning work?
- [x] A user requests storage by including an existing storage class in their PVC.
- [ ] An admin creates a storage class and includes it in the pod YAML, skipping the PVC.
- [ ] A pod requests storage by including a storage class and pod name in a PVC.
- [ ] An admin creates a PV and includes its name in the pod YAML.

Explain: Dynamic provisioning: a PVC references a StorageClass, which auto-provisions a matching PV.

### kcna-079
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which tasks are performed by a container orchestration tool?
- [x] Schedule, scale, and manage the health of containers.
- [ ] Create images, scale, and manage the health of containers.
- [ ] Debug applications, and manage the health of containers.
- [ ] Store images, scale, and manage the health of containers.

Explain: Orchestrators schedule, scale, and manage container health — not image building or storage.

### kcna-080
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is a definition of Hybrid Cloud?
- [ ] Combining public/private data centers from the same provider only.
- [ ] Combining public clouds, excluding different availability zones.
- [x] Combining services across different public and private clouds, including on-prem.
- [ ] Combining public/private data centers, excluding serverless functions.

Explain: Hybrid cloud spans multiple public/private clouds and on-premises data centers.

### kcna-081
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a Kubernetes Service Endpoint?
- [ ] The API Endpoint of the cluster.
- [ ] A special Pod name in kube-system.
- [ ] An IP address reachable from the Internet.
- [x] An object holding the IP addresses of individual Pods assigned to it.

Explain: An Endpoints/EndpointSlice object tracks the actual Pod IPs backing a Service.

### kcna-082
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Why is Cloud-Native Architecture important?
- [ ] It revolves around containers, microservices and pipelines.
- [x] It removes constraints to rapid innovation.
- [ ] It's a modern approach to deployment and pipelines.
- [ ] It's a bleeding-edge technology and service.

Explain: Cloud native architecture matters because it removes constraints that slow down innovation.

### kcna-083
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: Which Kubernetes component is the smallest deployable unit of computing?
- [ ] StatefulSet
- [ ] Deployment
- [x] Pod
- [ ] Container

Explain: The Pod is the smallest deployable unit managed directly by Kubernetes.

### kcna-084
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: What kubectl command retrieves CPU and memory resource consumption for nodes or Pods?
- [ ] kubectl cluster-info
- [ ] kubectl version
- [x] kubectl top
- [ ] kubectl api-resources

Explain: kubectl top shows live resource usage for nodes or Pods (via metrics-server).

### kcna-085
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which are the two primary modes for Service discovery within a Kubernetes cluster?
- [x] Environment variables and DNS
- [ ] API Calls and LDAP
- [ ] Labels and Radius
- [ ] Selectors and DHCP

Explain: Kubernetes supports Service discovery via injected environment variables and cluster DNS.

### kcna-086
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: Which capability are you allowed to add to a container using the Restricted Pod Security Standard?
- [ ] CHOWN
- [ ] SYS_CHROOT
- [ ] SETUID
- [x] NET_BIND_SERVICE

Explain: The Restricted profile only permits adding back NET_BIND_SERVICE among capabilities.

### kcna-087
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What methods can you use to scale a deployment?
- [ ] kubectl edit deployment exclusively.
- [ ] kubectl scale-up deployment exclusively.
- [x] kubectl scale deployment and kubectl edit deployment.
- [ ] kubectl scale deployment exclusively.

Explain: Both kubectl scale and kubectl edit (changing replicas) can scale a Deployment.

### kcna-088
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a sidecar container?
- [ ] A Pod that runs next to another container within the same Pod.
- [ ] A container that runs next to another Pod within the same namespace.
- [x] A container that runs next to another container within the same Pod.
- [ ] A Pod that runs next to another Pod within the same namespace.

Explain: A sidecar is an additional container co-located with the main container inside the same Pod.

### kcna-089
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is an industry-standard container runtime with an emphasis on simplicity, robustness, and portability?
- [ ] cri-o
- [ ] lxd
- [x] containerd
- [ ] kata-runtime

Explain: containerd is the widely-adopted CNCF container runtime known for simplicity and portability.

### kcna-090
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: What does vertical scaling an application deployment describe best?
- [ ] Adding/removing applications to meet demand.
- [ ] Adding/removing node instances to meet demand.
- [x] Adding/removing resources to applications to meet demand.
- [ ] Adding/removing app instances of the same app to meet demand.

Explain: Vertical scaling changes the resources (CPU/memory) allocated to existing instances.

### kcna-091
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: Which Prometheus metric represents a single value that can go up and down?
- [ ] Counter
- [x] Gauge
- [ ] Summary
- [ ] Histogram

Explain: A Gauge can increase or decrease arbitrarily, unlike a Counter which only increases.

### kcna-092
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is Serverless computing?
- [x] A computing method providing backend services on an as-used basis.
- [ ] A method for AI/ML operating systems.
- [ ] A method for quantum computing operating systems.
- [ ] A method for cloud computing operating systems.

Explain: Serverless provides backend compute billed and provisioned on an as-used, event-driven basis.

### kcna-093
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the purpose of the CRI?
- [ ] Provide runtime integration control when multiple runtimes are used.
- [ ] Support container replication and scaling on nodes.
- [x] Provide an interface allowing Kubernetes to support pluggable container runtimes.
- [ ] Allow definition of dynamic resource criteria across containers.

Explain: The Container Runtime Interface (CRI) lets Kubernetes support pluggable container runtimes.

### kcna-094
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: There's a requirement to run a database backup every day. Which resource achieves that?
- [ ] Kube-scheduler
- [x] CronJob
- [ ] Task
- [ ] Job

Explain: A CronJob runs Jobs on a recurring, time-based schedule — ideal for daily backups.

### kcna-095
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: In CNCF, who develops specifications for industry standards around container formats and runtimes?
- [x] Open Container Initiative (OCI)
- [ ] Linux Foundation Certification Group (LFCG)
- [ ] Container Network Interface (CNI)
- [ ] Container Runtime Interface (CRI)

Explain: OCI develops the open standards for container image formats and runtimes.

### kcna-096
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which of the following includes valid API versions?
- [ ] alpha1v1, beta3v3, v2
- [ ] alpha1, beta3, v2
- [x] v1alpha1, v2beta3, v2
- [ ] v1alpha1, v2beta3, 2.0

Explain: Valid Kubernetes API version strings look like v1alpha1, v2beta3, v2 — following the vX(alpha|beta)Y convention.

### kcna-097
domain: observability
difficulty: 4
tags: kubernetes, cloud-native

Q: Which command views a snapshot of previously terminated 'ruby' container logs from Pod web-1?
- [x] kubectl logs -p -c ruby web-1
- [ ] kubectl logs -c ruby web-1
- [ ] kubectl logs -p ruby web-1
- [ ] kubectl logs -p -c web-1 ruby

Explain: -p (previous) plus -c <container> targets logs from the terminated instance of that specific container.

### kcna-098
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: A Kubernetes _____ is an abstraction that defines a logical set of Pods and a policy by which to access them.
- [ ] Selector
- [ ] Controller
- [x] Service
- [ ] Job

Explain: This is the textbook definition of a Kubernetes Service.

### kcna-099
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: How many hosts are required for a highly available cluster using an external etcd topology?
- [ ] Four hosts: two control-plane, two etcd.
- [ ] Four hosts: one control-plane, three etcd.
- [ ] Three hosts: control-plane and etcd share hosts.
- [x] Six hosts: three control-plane, three etcd.

Explain: External etcd topology separates the etcd cluster from control-plane nodes, needing 3+3 hosts for HA.

### kcna-100
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: Which event will cause the kube-scheduler to assign a Pod to a node?
- [ ] The Pod crashes because of an error.
- [ ] A new node is added to the cluster.
- [ ] CPU load on a node becomes too high.
- [x] A new Pod is created and has no assigned node.

Explain: The scheduler acts on Pods that exist but have no nodeName assigned yet.

### kcna-101
domain: delivery
difficulty: 2
tags: kubernetes, cloud-native

Q: What helps an organization deliver software more securely at a higher velocity?
- [ ] Kubernetes
- [ ] apt-get
- [ ] Docker Images
- [x] CI/CD Pipeline

Explain: A CI/CD pipeline automates testing and delivery, improving both security and velocity.

### kcna-102
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: Which resource do you use to attach a volume in a Pod?
- [ ] StorageVolume
- [ ] PersistentVolume
- [ ] StorageClass
- [x] PersistentVolumeClaim

Explain: A Pod references a PersistentVolumeClaim, which binds to a PersistentVolume, to attach storage.

### kcna-103
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which key-value store is used to persist Kubernetes cluster data?
- [x] etcd
- [ ] ZooKeeper
- [ ] ControlPlaneStore
- [ ] Redis

Explain: etcd is the distributed key-value store backing all cluster state.

### kcna-104
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What Linux namespace is shared by default by containers running within a Kubernetes Pod?
- [ ] Host Network
- [x] Network
- [ ] Process ID
- [ ] Process Name

Explain: Containers in the same Pod share the network namespace by default.

### kcna-105
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is a Dockerfile?
- [ ] A bash script that automatically builds a docker image.
- [ ] A config file defining which registry to push a container to.
- [x] A text file with commands to assemble an image.
- [ ] An image layer created by a running container.

Explain: A Dockerfile is a text file listing build instructions used to assemble a container image.

### kcna-106
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: What does the nodeSelector within a PodSpec use to place Pods on target nodes?
- [ ] Annotations
- [ ] IP Addresses
- [ ] Hostnames
- [x] Labels

Explain: nodeSelector matches Pods to nodes using node labels.

### kcna-107
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What do Deployments and StatefulSets have in common?
- [x] They manage Pods based on an identical container spec.
- [ ] They support the OnDelete update strategy.
- [ ] They support ordered, graceful deployment and scaling.
- [ ] They maintain a sticky identity for each of their Pods.

Explain: Both manage a set of Pods created from one common Pod template/spec.

### kcna-108
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the practice of bringing financial accountability to the variable spend model of cloud resources?
- [ ] FaaS
- [ ] DevOps
- [ ] CloudCost
- [x] FinOps

Explain: FinOps is the practice/culture of managing and optimizing variable cloud spend.

### kcna-109
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What is a best practice to minimize container image size?
- [ ] Use a Dockerfile.
- [x] Use multistage builds.
- [ ] Build images with different tags.
- [ ] Add a build.sh script.

Explain: Multi-stage builds discard build-time dependencies, shrinking the final image.

### kcna-110
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which tools enable HPA to use custom, application-generated metrics to trigger scaling?
- [x] Prometheus and the prometheus-adapter.
- [ ] Graylog and graylog-autoscaler.
- [ ] Graylog and the kubernetes-adapter.
- [ ] Grafana and Prometheus.

Explain: Prometheus plus the prometheus-adapter exposes custom metrics the HPA can consume via the custom metrics API.

### kcna-111
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: Which of the following is a valid PromQL query?
- [ ] SELECT * from http_requests_total WHERE job=apiserver
- [ ] http_requests_total WHERE (job="apiserver")
- [ ] SELECT * from http_requests_total
- [x] http_requests_total{job="apiserver"}

Explain: PromQL uses a metric name with a label-matcher selector in curly braces, not SQL syntax.

### kcna-112
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which best describes horizontally scaling an application deployment?
- [ ] Adding/removing node instances to the cluster to meet demand.
- [ ] Adding/removing applications to meet demand.
- [x] Adding/removing application instances of the same app to meet demand.
- [ ] Adding/removing resources to application instances to meet demand.

Explain: Horizontal scaling changes the number of replica instances of an application.

### kcna-113
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: How many different Kubernetes Service types can you define?
- [ ] 2
- [ ] 3
- [x] 4
- [ ] 5

Explain: The four Service types are ClusterIP, NodePort, LoadBalancer, and ExternalName.

### kcna-114
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the difference between a Deployment and a ReplicaSet?
- [ ] With a Deployment you can't control the number of pod replicas.
- [ ] A ReplicaSet does not guarantee a stable set of replica pods.
- [ ] A Deployment is basically the same as a ReplicaSet with annotations.
- [x] A Deployment is a higher-level concept that manages ReplicaSets.

Explain: Deployments sit above ReplicaSets, managing them to enable rollouts and rollbacks.

### kcna-115
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: The Container Runtime Interface (CRI) defines the protocol for communication between:
- [x] The kubelet and the container runtime.
- [ ] The container runtime and etcd.
- [ ] The kube-apiserver and the kubelet.
- [ ] The container runtime and the image registry.

Explain: CRI standardizes kubelet-to-container-runtime communication.

### kcna-116
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: Which authorization mode allows granular control over operations different entities can perform on different objects?
- [ ] Webhook Mode Authorization Control
- [x] Role Based Access Control
- [ ] Node Authorization Access Control
- [ ] Attribute Based Access Control

Explain: RBAC provides fine-grained, role-based permission control over API operations.

### kcna-117
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: Which is a correct definition of a Helm chart?
- [ ] A collection of YAML files bundled in a tar.gz, applied without decompressing.
- [ ] A collection of JSON files with all resource definitions.
- [ ] A collection of YAML files applied via kubectl.
- [x] A package-like bundle containing all resource definitions to run an app on Kubernetes.

Explain: A Helm chart packages templated Kubernetes manifests and metadata needed to run an application.

### kcna-118
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement is true about namespaces in Kubernetes?
- [ ] You can nest a namespace within another namespace.
- [ ] You can create two resources of the same kind/name in a namespace.
- [x] The default namespace exists when a new cluster is created.
- [ ] All objects in the cluster are namespaced by default.

Explain: A default namespace is created automatically for every new cluster.

### kcna-119
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: How does Horizontal Pod Autoscaling work in Kubernetes?
- [ ] It adds/reduces CPU or memory allocated to pods based on load.
- [ ] It adds pods above threshold but never reduces them.
- [ ] It scales DaemonSet pod counts based on load.
- [x] It adds pods above threshold and reduces them below threshold.

Explain: HPA changes the replica count up or down based on observed metrics vs. target thresholds.

### kcna-120
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: What is a Pod?
- [ ] A networked application within Kubernetes.
- [ ] A storage volume within Kubernetes.
- [ ] A single container within Kubernetes.
- [x] A group of one or more containers within Kubernetes.

Explain: A Pod is a group of one or more co-located, co-scheduled containers.

### kcna-121
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What element allows Kubernetes to run Pods across the fleet of nodes?
- [ ] The node server.
- [ ] The etcd static pods.
- [ ] The API server.
- [x] The kubelet.

Explain: The kubelet on each node is what actually runs Pods there.

### kcna-122
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the Kubernetes object used for running a recurring workload?
- [ ] Job
- [ ] Batch
- [ ] DaemonSet
- [x] CronJob

Explain: A CronJob runs a workload on a repeating, time-based schedule.

### kcna-123
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: In the DevOps framework and culture, who builds, automates, and offers continuous delivery tools for developer teams?
- [ ] Application Users
- [ ] Application Developers
- [x] Platform Engineers
- [ ] Cluster Operators

Explain: Platform engineers build and maintain the tooling/platform that developer teams use for delivery.

### kcna-124
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which kubectl command is useful for collecting information about any active resource type in a cluster?
- [x] describe
- [ ] list
- [ ] expose
- [ ] explain

Explain: kubectl describe gives detailed status/info about any resource instance.

### kcna-125
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: The cloud native architecture centered around microservices provides a strong system that ensures ______________.
- [ ] fallback
- [x] resiliency
- [ ] failover
- [ ] high reachability

Explain: Microservices architectures are prized for the resiliency they can provide.

### kcna-126
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which is the correct command to run an nginx deployment with 2 replicas?
- [ ] kubectl run deploy nginx --image=nginx --replicas=2
- [x] kubectl create deploy nginx --image=nginx --replicas=2
- [ ] kubectl create nginx deployment --image=nginx --replicas=2
- [ ] kubectl create deploy nginx --image=nginx --count=2

Explain: kubectl create deploy <name> --image=<img> --replicas=<n> is the correct imperative syntax.

### kcna-127
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: What does 'Continuous Integration' mean?
- [ ] Continuous integration and testing of code from multiple sources manually.
- [x] Continuous integration and testing of code from multiple sources via automation.
- [ ] Continuous integration of changes from one environment to another.
- [ ] Continuous integration of new tools to support developers.

Explain: CI automates the integration and testing of code changes from multiple contributors.

### kcna-128
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement is true about considerations for large Kubernetes clusters?
- [ ] Supports up to 1000 nodes, max 1000 containers per node.
- [ ] Supports up to 5000 nodes, max 500 pods per node.
- [x] Supports up to 5000 nodes, max 110 pods per node.
- [ ] Supports up to 50 nodes, max 1000 containers per node.

Explain: Kubernetes' documented scalability guidance is up to 5000 nodes and ~110 pods per node.

### kcna-129
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which component of the node is responsible for running workloads?
- [ ] The kubelet.
- [ ] The kube-proxy.
- [ ] The kube-apiserver.
- [x] The container runtime.

Explain: The container runtime is what actually executes containers, invoked by the kubelet. Study note: Community vote leans this way (62%/38%) though the kubelet coordinates the process.

### kcna-130
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: The IPv4/IPv6 dual stack in Kubernetes:
- [ ] Translates an IPv4 request from a service to an IPv6 service.
- [ ] Allows accessing the IPv4 address using the IPv6 address.
- [ ] Requires NetworkPolicies to prevent services from mixing requests.
- [x] Allows you to create IPv4 and IPv6 dual stack services.

Explain: Dual-stack lets Pods/Services get both IPv4 and IPv6 addresses.

### kcna-131
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: What does 'continuous' mean in the context of CI/CD?
- [ ] Frequent releases, manual processes, repeatable, fast processing
- [ ] Periodic releases, manual processes, repeatable, automated processing
- [x] Frequent releases, automated processes, repeatable, fast processing
- [ ] Periodic releases, automated processes, repeatable, automated processing

Explain: 'Continuous' implies frequent, automated, repeatable, and fast delivery processes.

### kcna-132
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: What is ephemeral storage?
- [x] Storage space that need not persist across restarts.
- [ ] Storage that may grow dynamically.
- [ ] Storage used by multiple consumers (e.g., multiple Pods).
- [ ] Storage that is always provisioned locally.

Explain: Ephemeral storage does not need to survive container/Pod restarts.

### kcna-133
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the reference implementation of the OCI runtime specification?
- [ ] lxc
- [ ] cri-o
- [x] runc
- [ ] docker

Explain: runc is the OCI reference implementation for running containers per the runtime-spec.

### kcna-134
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a Service?
- [ ] A static network mapping from a Pod to a port.
- [x] A way to expose an application running on a set of Pods.
- [ ] The network configuration for a group of Pods.
- [ ] An NGINX load balancer deployed for an application.

Explain: A Service exposes a set of Pods as a network-accessible application.

### kcna-135
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: What's the difference between a security profile and a security context?
- [ ] Security Contexts configure Clusters/Namespaces; profiles enforce Security Context settings.
- [x] Security Contexts configure Pods/Containers at runtime; profiles are control-plane mechanisms enforcing settings.
- [ ] Security Profiles configure Pods/Containers; Contexts are control-plane mechanisms.
- [ ] Security Profiles configure Clusters/Namespaces; Contexts enforce Profile settings.

Explain: SecurityContext sets Pod/container runtime settings, while security profiles (like Pod Security Standards) enforce policy on those settings.

### kcna-136
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: At which layer would distributed tracing be implemented in a cloud native deployment?
- [ ] Network
- [x] Application
- [ ] Database
- [ ] Infrastructure

Explain: Distributed tracing instruments application-level request flows.

### kcna-137
domain: security
difficulty: 2
tags: kubernetes, cloud-native

Q: What framework does Kubernetes use to authenticate users with JSON Web Tokens?
- [x] OpenID Connect
- [ ] OpenID Container
- [ ] OpenID Cluster
- [ ] OpenID CNCF

Explain: Kubernetes supports OIDC-based authentication using JWTs.

### kcna-138
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Which feature does Kubernetes provide by default as a container orchestration tool?
- [ ] A portable operating system.
- [ ] File system redundancy.
- [ ] A container image registry.
- [x] Automated rollouts and rollbacks.

Explain: Deployments provide automated, controlled rollouts and rollbacks by default.

### kcna-139
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement about container runtimes in Kubernetes is true?
- [ ] If iptables sees bridged traffic, you don't need a container runtime.
- [ ] If you enable IPv4 forwarding, you don't need a container runtime.
- [ ] Container runtimes are deprecated; install CRI on each node instead.
- [x] You must install a container runtime on each node to run pods on it.

Explain: A container runtime is mandatory on every node to actually run Pod containers.

### kcna-140
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: If a Pod was waiting for container images to download on the scheduled node, what state would it be in?
- [ ] Failed
- [ ] Succeeded
- [ ] Unknown
- [x] Pending

Explain: A Pod remains Pending while its containers/images are not yet ready to run.

### kcna-141
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is CloudEvents?
- [ ] A spec for event data formats for K8s network traffic and cloud providers.
- [ ] A spec for event data formats across all cloud providers only.
- [x] A spec for describing event data in common formats for interoperability across services/platforms/systems.
- [ ] A K8s spec for event data for iCloud/iOS/iMac.

Explain: CloudEvents is a CNCF spec standardizing event data formats for cross-system interoperability.

### kcna-142
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the main purpose of etcd in Kubernetes?
- [x] etcd stores all cluster data in a key-value store.
- [ ] etcd stores containers for disaster recovery.
- [ ] etcd stores copies of config files in /etc/.
- [ ] etcd stores YAML definitions for all cluster components.

Explain: etcd is the authoritative key-value store for all cluster state.

### kcna-143
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Releasing open-source software for the first time, which is a valid semantic version?
- [ ] 1.0
- [ ] 2021-10-11
- [x] 0.1.0-rc
- [ ] v1beta1

Explain: 0.1.0-rc follows the MAJOR.MINOR.PATCH[-prerelease] SemVer format.

### kcna-144
domain: delivery
difficulty: 2
tags: kubernetes, cloud-native

Q: Which cloud native tools keep clusters in sync with Git and automate updates on new code?
- [x] Flux and ArgoCD
- [ ] GitOps Toolkit
- [ ] Linkerd and Istio
- [ ] Helm and Kustomize

Explain: Flux and Argo CD are the primary GitOps continuous-delivery tools that sync clusters to Git.

### kcna-145
domain: delivery
difficulty: 1
tags: kubernetes, cloud-native

Q: Which tool is used to streamline installing and managing Kubernetes applications?
- [ ] apt
- [x] helm
- [ ] service
- [ ] brew

Explain: Helm is the Kubernetes package manager for installing/managing apps via charts.

### kcna-146
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: What are the two steps performed by the kube-scheduler to select a node to schedule a pod?
- [ ] Grouping and placing
- [ ] Filtering and selecting
- [x] Filtering and scoring
- [ ] Scoring and creating

Explain: The scheduler filters out infeasible nodes, then scores the rest to pick the best one.

### kcna-147
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: Which tool is commonly used alongside Prometheus for data visualization?
- [x] Grafana
- [ ] Graphite
- [ ] Nirvana
- [ ] GraphQL

Explain: Grafana is the standard dashboarding tool paired with Prometheus.

### kcna-148
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: Which item is a Kubernetes node component?
- [ ] kube-scheduler
- [ ] kubectl
- [x] kube-proxy
- [ ] etcd

Explain: kube-proxy runs on every node; scheduler/etcd are control-plane, kubectl is a client tool.

### kcna-149
domain: cloud-native
difficulty: 2
tags: kubernetes, cloud-native

Q: In a serverless computing architecture:
- [x] Users are charged based on the number of requests to a function.
- [ ] Serverless functions are incompatible with containerized functions.
- [ ] Users must reserve capacity based on usage estimates.
- [ ] Containers serving requests run in the background idle.

Explain: Serverless billing is typically usage/request-based, not reservation-based.

### kcna-150
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: How is application data maintained in containers?
- [ ] Store data into data folders.
- [ ] Store data in separate folders.
- [ ] Store data into sidecar containers.
- [x] Store data into volumes.

Explain: Persistent application data is stored in volumes attached to the Pod/container.

### kcna-151
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: Which scenario would benefit the most from a service mesh architecture?
- [ ] A few apps with hundreds of pod replicas across multiple clusters.
- [ ] Thousands of distributed apps in a single cluster.
- [ ] Tens of distributed apps across multiple clusters.
- [x] Thousands of distributed apps across multiple clusters, each providing multiple services.

Explain: Service meshes shine most at the largest, most complex, multi-cluster microservice topologies.

### kcna-152
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Kubernetes ___ protect you against voluntary interruptions (e.g., deleting Pods, draining nodes).
- [ ] Pod Topology Spread Constraints
- [x] Pod Disruption Budgets
- [ ] Taints and Tolerations
- [ ] Resource Limits and Requests

Explain: PodDisruptionBudgets limit how many Pods can be voluntarily disrupted at once.

### kcna-153
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What sentence is true about CronJobs in Kubernetes?
- [x] A CronJob creates one or multiple Jobs on a repeating schedule.
- [ ] A CronJob creates one container on a repeating schedule.
- [ ] CronJobs are useful on Linux but obsolete in Kubernetes.
- [ ] The CronJob schedule format differs from Linux cron.

Explain: A CronJob creates Job objects according to a cron-style repeating schedule.

### kcna-154
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the purpose of the kube-proxy?
- [ ] It balances network requests to pods.
- [x] It maintains network rules on nodes.
- [ ] It ensures cluster connectivity to the internet.
- [ ] It maintains the DNS rules of the cluster.

Explain: kube-proxy maintains per-node network rules that implement Service routing.

### kcna-155
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: Manual reclamation policy of a PVC resource is known as:
- [ ] claimRef
- [ ] Delete
- [x] Retain
- [ ] Recycle

Explain: The Retain reclaim policy requires manual cleanup/reclamation of the underlying volume.

### kcna-156
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: Which component of the Kubernetes architecture integrates with the CRI container runtime?
- [ ] kubeadm
- [x] kubelet
- [ ] kube-apiserver
- [ ] kubectl

Explain: The kubelet talks to the container runtime via the CRI.

### kcna-157
domain: security
difficulty: 2
tags: kubernetes, cloud-native

Q: Which is an open source runtime security tool?
- [ ] lxd
- [ ] containerd
- [x] falco
- [ ] gvisor

Explain: Falco is a CNCF runtime security/threat-detection tool.

### kcna-158
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: What are the advantages of adopting a GitOps approach for deployments?
- [ ] Reduce failed deployments, operational costs, and fragile release processes.
- [x] Reduce failed deployments, configuration drift, and fragile release processes.
- [ ] Reduce failed deployments, operational costs, and learn git.
- [ ] Reduce failed deployments, configuration drift, and improve reputation.

Explain: GitOps reduces failed deployments, configuration drift, and fragile manual release processes.

### kcna-159
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command lists the running containers (pods) in the current Kubernetes namespace?
- [x] kubectl get pods
- [ ] kubectl ls
- [ ] kubectl ps
- [ ] kubectl show pods

Explain: kubectl get pods lists Pods in the current namespace.

### kcna-160
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is a good habit for cloud native cost efficiency?
- [x] Follow an automated approach to cost optimization, with visibility and forecasting.
- [ ] Follow manual processes for cost analysis.
- [ ] Use only one cloud provider to simplify analysis.
- [ ] Keep legacy workloads unchanged to avoid cloud costs.

Explain: Automated cost visibility and forecasting is the recommended FinOps practice.

### kcna-161
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: Which of these is a valid container restart policy?
- [ ] On login
- [ ] On update
- [ ] On start
- [x] On failure

Explain: Valid restart policies are Always, OnFailure, and Never.

### kcna-162
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is a challenge derived from running cloud native applications?
- [ ] Operational costs of maintaining a company data center.
- [x] Cost optimization is complex across different public cloud environments.
- [ ] Lack of container images available in public repositories.
- [ ] Lack of services provided by common public clouds.

Explain: Managing and optimizing cost across multiple cloud environments is a well-known cloud native challenge.

### kcna-163
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the correct hierarchy of Kubernetes components?
- [ ] Containers -> Pods -> Cluster -> Nodes
- [ ] Nodes -> Cluster -> Containers -> Pods
- [x] Cluster -> Nodes -> Pods -> Containers
- [ ] Pods -> Cluster -> Containers -> Nodes

Explain: The nesting order is Cluster contains Nodes, which host Pods, which contain Containers.

### kcna-164
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement about Secrets is correct?
- [ ] A Secret is part of a Pod specification.
- [ ] Secrets data is encrypted with the cluster private key by default.
- [x] Secrets data is base64 encoded and stored unencrypted by default.
- [ ] A Secret can only be used for confidential data.

Explain: By default, Secret values are only base64-encoded in etcd, not encrypted.

### kcna-165
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which mechanism allows extending the Kubernetes API?
- [ ] ConfigMap
- [x] CustomResourceDefinition
- [ ] MutatingAdmissionWebhook mechanism
- [ ] Kustomize

Explain: CRDs are the primary mechanism for adding new custom API types.

### kcna-166
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: Which observability data stream is most useful for plotting resource consumption and predicted future exhaustion?
- [ ] stdout
- [ ] Traces
- [ ] Logs
- [x] Metrics

Explain: Metrics are numeric time-series data ideal for plotting trends and forecasting. Study note: Some community sources favor Logs, but Metrics is the technically correct choice for plotting consumption over time.

### kcna-167
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: What can be used to create a job that runs at specified times/dates or on a repeating schedule?
- [ ] Job
- [ ] CalendarJob
- [ ] BatchJob
- [x] CronJob

Explain: CronJob is the resource for scheduled/repeating job execution.

### kcna-168
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: If kubectl is failing to retrieve information from the cluster, where can you find pod logs to troubleshoot?
- [x] /var/log/pods/
- [ ] ~/.kube/config
- [ ] /var/log/k8s/
- [ ] /etc/kubernetes/

Explain: Pod logs are stored on the node filesystem under /var/log/pods/.

### kcna-169
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which component watches for newly created Pods with no assigned node, and selects a node for them?
- [ ] etcd
- [ ] kube-controller-manager
- [ ] kube-proxy
- [x] kube-scheduler

Explain: The kube-scheduler assigns unscheduled Pods to nodes.

### kcna-170
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: Which control plane component updates the node Ready condition if a node becomes unreachable?
- [ ] The kube-proxy.
- [x] The node controller.
- [ ] The kubelet.
- [ ] The kube-apiserver.

Explain: The node controller (part of kube-controller-manager) marks nodes NotReady/Unknown when unreachable.

### kcna-171
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: Which GitOps engine can be used to orchestrate parallel jobs on Kubernetes?
- [ ] Jenkins X
- [ ] Flagger
- [ ] Flux
- [x] Argo Workflows

Explain: Argo Workflows is designed to orchestrate parallel and DAG-based jobs on Kubernetes. Study note: Some community answers cite Jenkins X, but Argo Workflows is the engine built specifically for parallel job orchestration.

### kcna-172
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the main purpose of the Open Container Initiative (OCI)?
- [ ] Accelerating adoption of containers and Kubernetes.
- [x] Creating open industry standards around container formats and runtimes.
- [ ] Creating standards around container formats for private purposes.
- [ ] Improving security of container format standards.

Explain: OCI's mission is establishing open, vendor-neutral standards for container formats and runtimes.

### kcna-173
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Which are the core features provided by a service mesh?
- [x] Authentication and authorization
- [ ] Distributing and replicating data
- [ ] Security vulnerability scanning
- [ ] Configuration management

Explain: Service meshes provide mTLS-based authentication/authorization along with traffic management and observability.

### kcna-174
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which options include only mandatory fields to create a Kubernetes object using a YAML file?
- [ ] apiVersion, template, kind, status
- [ ] apiVersion, metadata, status, spec
- [ ] apiVersion, template, kind, spec
- [x] apiVersion, metadata, kind, spec

Explain: apiVersion, kind, metadata, and spec are the mandatory top-level fields.

### kcna-175
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which is the name of a container orchestration software?
- [ ] OpenStack
- [ ] Docker
- [x] Apache Mesos
- [ ] CRI-O

Explain: Apache Mesos is a cluster/container orchestration platform (alongside Kubernetes, Swarm).

### kcna-176
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What happens with a regular pod running in Kubernetes when a node fails?
- [ ] A new pod with the same UID is scheduled to another node after a while.
- [x] A new, near-identical pod but with a different UID is scheduled to another node.
- [ ] By default, a pod can only be scheduled to the same node if it fails.
- [ ] A new pod is scheduled elsewhere only if configured explicitly.

Explain: A controller reschedules a replacement Pod (new UID) elsewhere; it isn't the exact same Pod object.

### kcna-177
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the minimum number of etcd members required for a highly available Kubernetes cluster?
- [ ] Two etcd members.
- [ ] Five etcd members.
- [ ] Six etcd members.
- [x] Three etcd members.

Explain: An odd-numbered quorum of at least 3 etcd members is the minimum for HA.

### kcna-178
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the main purpose of Ingress in Kubernetes?
- [ ] Access HTTP/HTTPS services by IP address.
- [ ] Access non-HTTP/HTTPS services by IP address.
- [ ] Access non-HTTP/HTTPS services by path.
- [x] Access HTTP/HTTPS services running in the cluster based on their path.

Explain: Ingress routes external HTTP/HTTPS traffic to in-cluster services based on host/path rules.

### kcna-179
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: How can you extend the Kubernetes API?
- [x] Adding a CustomResourceDefinition or implementing an aggregation layer.
- [ ] Adding a new version of a resource, e.g., v4beta3.
- [ ] With the command kubectl extend api as admin.
- [ ] Adding the desired API object as a kubelet parameter.

Explain: CRDs and the API aggregation layer are the two supported ways to extend the API.

### kcna-180
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What is an ephemeral container?
- [ ] A specialized container that runs as root for infosec applications.
- [x] A specialized container that runs temporarily in an existing Pod.
- [ ] A specialized container that extends/enhances the 'main' container.
- [ ] A specialized container that runs before the app container in a Pod.

Explain: Ephemeral containers are added temporarily to a running Pod, typically for debugging.

### kcna-181
domain: cloud-native
difficulty: 3
tags: kubernetes, cloud-native

Q: In a cloud native environment, who is usually responsible for maintaining the workloads running across different platforms?
- [ ] The cloud provider.
- [x] The Site Reliability Engineering (SRE) team.
- [ ] The team of developers.
- [ ] The Support Engineering team (SE).

Explain: The SRE team typically owns keeping workloads running reliably across platforms.

### kcna-182
domain: workloads
difficulty: 1
tags: kubernetes, cloud-native

Q: Which Kubernetes-native deployment strategy supports zero-downtime updates of a workload?
- [ ] Canary
- [ ] Recreate
- [ ] BlueGreen
- [x] RollingUpdate

Explain: RollingUpdate incrementally replaces old Pods with new ones, avoiding downtime.

### kcna-183
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: What service account does a Pod use in a given namespace when the service account is not specified?
- [ ] admin
- [ ] sysadmin
- [ ] root
- [x] default

Explain: Pods use the 'default' ServiceAccount of their namespace unless one is specified.

### kcna-184
domain: cloud-native
difficulty: 2
tags: kubernetes, cloud-native

Q: What is a cloud native application?
- [ ] A monolithic app that's been containerized and runs on the cloud.
- [x] An app designed to be scalable and take advantage of cloud services.
- [ ] An app designed to run all its functions in separate containers.
- [ ] Any app that runs in a cloud provider and uses its services.

Explain: Cloud native apps are designed for scalability and to leverage the dynamic nature of cloud platforms.

### kcna-185
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What's the most adopted way of conflict resolution and decision-making for CNCF open-source projects?
- [ ] Financial Analysis
- [x] Discussion and Voting
- [ ] Flipism Technique
- [ ] Project Founder Say

Explain: CNCF projects rely on open discussion followed by community voting.

### kcna-186
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: Which options include resources cleaned by the Kubernetes garbage collection mechanism?
- [ ] Stale/expired CSRs and old deployments.
- [ ] Nodes deleted by a cloud controller manager and obsolete kubelet logs.
- [ ] Unused containers/images and obsolete kubelet logs.
- [x] Terminated pods, completed jobs, and objects without owner references.

Explain: Kubernetes garbage collection removes terminated pods, completed jobs, and orphaned objects lacking owner references. Study note: Some community answers point to the cloud-controller-manager option, but the Kubernetes docs support this answer.

### kcna-187
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the default eviction timeout when the Ready condition of a node is Unknown or False?
- [ ] Thirty seconds.
- [ ] Thirty minutes.
- [ ] One minute.
- [x] Five minutes.

Explain: The default node monitor grace period before eviction is five minutes.

### kcna-188
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the main purpose of a DaemonSet?
- [x] A DaemonSet ensures that all (or certain) nodes run a copy of a Pod.
- [ ] A DaemonSet ensures the kubelet is constantly up and running.
- [ ] A DaemonSet ensures as many pods run as specified in the replicas field.
- [ ] A DaemonSet ensures a process (agent) runs on every node.

Explain: A DaemonSet's job is ensuring a Pod copy runs on all (or a selected subset of) nodes.

### kcna-189
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Why do administrators need a container orchestration tool?
- [x] To manage the lifecycle of a large number of containers.
- [ ] To assess security risks of container images in production.
- [ ] To learn how to transform monoliths into microservices.
- [ ] Because orchestration tools like Kubernetes are the future.

Explain: Orchestration tools exist to manage the lifecycle of many containers at scale.

### kcna-190
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Which two elements are shared between containers in the same pod?
- [ ] Network resources and liveness probes.
- [ ] Storage and container image registry.
- [x] Storage and network resources.
- [ ] Network resources and Dockerfiles.

Explain: Containers in a Pod can share storage volumes and always share the network namespace.

### kcna-191
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: In Kubernetes, if the API version of a feature is v2beta3, it means that:
- [ ] The version stays available for all future releases of that major version.
- [x] The API may change in incompatible ways in a later release without notice.
- [ ] The software is well tested and enabling it is considered safe.
- [ ] The software may contain bugs; enabling the feature may expose bugs.

Explain: Beta APIs can still change in breaking ways before reaching stable, even though the code is reasonably well tested. Study note: The community vote leans toward C ('well tested, considered safe'), which matches how the Kubernetes docs describe beta features generally — treat this one as worth double-checking.

### kcna-192
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the API that exposes resource metrics from the metrics-server?
- [ ] custom.k8s.io
- [ ] resources.k8s.io
- [x] metrics.k8s.io
- [ ] cadvisor.k8s.io

Explain: metrics.k8s.io is the resource-metrics API served by metrics-server.

### kcna-193
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: Which resource helps in managing a stateless application workload on a Kubernetes cluster?
- [ ] DaemonSet
- [ ] StatefulSet
- [ ] kubectl
- [x] Deployment

Explain: Deployments are the standard resource for managing stateless workloads.

### kcna-194
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which mechanism can be used to automatically adjust the amount of resources for an application?
- [ ] Horizontal Pod Autoscaler (HPA)
- [ ] Kubernetes Event-driven Autoscaling (KEDA)
- [ ] Cluster Autoscaler
- [x] Vertical Pod Autoscaler (VPA)

Explain: VPA adjusts CPU/memory requests/limits (resource amount) of existing Pods, unlike HPA which changes replica count.

### kcna-195
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: Which is a recommended security habit in Kubernetes?
- [ ] Run containers as group ID 0 (root) and any user ID.
- [x] Disallow privilege escalation from within a container by default.
- [ ] Run containers as user ID 0 (root) and any group ID.
- [ ] Allow privilege escalation from within a container by default.

Explain: Disabling privilege escalation by default is a core Pod security best practice.

### kcna-196
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: What are the 3 pillars of Observability?
- [x] Metrics, Logs, and Traces
- [ ] Metrics, Logs, and Spans
- [ ] Metrics, Data, and Traces
- [ ] Resources, Logs, and Tracing

Explain: Metrics, Logs, and Traces are the classic three pillars of observability.

### kcna-197
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What edge and service proxy tool is designed to be integrated with cloud native applications?
- [ ] CoreDNS
- [ ] CNI
- [ ] gRPC
- [x] Envoy

Explain: Envoy is the widely used edge/service proxy at the heart of many service meshes.

### kcna-198
domain: delivery
difficulty: 1
tags: kubernetes, cloud-native

Q: What is Flux constructed with?
- [ ] GitLab Environment Toolkit
- [x] GitOps Toolkit
- [ ] Helm Toolkit
- [ ] GitHub Actions Toolkit

Explain: Flux is built on the GitOps Toolkit components.

### kcna-199
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: In Kubernetes, which abstraction defines a logical set of Pods and a policy by which to access them?
- [ ] Service Account
- [ ] NetworkPolicy
- [x] Service
- [ ] Custom Resource Definition

Explain: This is the definition of a Kubernetes Service.

### kcna-200
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: What does the livenessProbe in Kubernetes help detect?
- [ ] When a container has started successfully.
- [x] When a container is unresponsive.
- [ ] When a container is ready to serve traffic.
- [ ] When a container exceeds resource limits.

Explain: A livenessProbe checks whether a container is still healthy/responsive, restarting it if not.

### kcna-201
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which command updates the image of a running deployment without recreating the resource?
- [ ] kubectl edit deployment my-app my-container=my-app:v2
- [ ] kubectl replace deployment/my-app my-container=my-app:v2
- [x] kubectl set image deployment/my-app my-container=my-app:v2
- [ ] kubectl set image deployment/my-app rollout restart

Explain: kubectl set image updates a container's image in-place, triggering a rolling update.

### kcna-202
domain: security
difficulty: 5
tags: kubernetes, cloud-native

Q: An admin needs Pods in the test namespace to enforce the Restricted Pod Security Standard. What action should be taken?
- [x] Apply a PodSecurityAdmission configuration with the Restricted standard to the namespace.
- [ ] Update RoleBindings to limit access to specific users.
- [ ] Set a PodSecurityStandard annotation on each Pod.
- [ ] Create a NetworkPolicy restricting access to Pods.

Explain: Pod Security Admission is configured at the namespace level via labels to enforce a standard like Restricted.

### kcna-203
domain: workloads
difficulty: 2
tags: kubernetes, cloud-native

Q: Kubernetes Secrets hold confidential data. Which API object should hold non-confidential data?
- [ ] CSI
- [ ] RBAC
- [ ] CNI
- [x] ConfigMaps

Explain: ConfigMaps are meant for non-sensitive configuration data.

### kcna-204
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: When a Kubernetes Secret is created, how is the data stored by default in etcd?
- [x] As Base64-encoded strings with no actual encryption.
- [ ] As plain text values with no encoding.
- [ ] As encrypted records protected by a control-plane master key.
- [ ] As compressed binary objects.

Explain: By default Secret data is only base64-encoded in etcd, not encrypted.

### kcna-205
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which cloud native proxy is used for ingress/egress in a service mesh and can also serve as an application gateway?
- [ ] Frontend proxy
- [ ] Kube-proxy
- [ ] Reverse proxy
- [x] Envoy proxy

Explain: Envoy is commonly used both as a mesh sidecar and as an edge/ingress gateway.

### kcna-206
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command retrieves container logs from a specific container in a multi-container Pod?
- [x] kubectl logs <pod> -c <container>
- [ ] kubectl logs <container> -c <pod>
- [ ] kubectl exec <pod> -- tail /var/log/app.log
- [ ] kubectl describe pod <pod> -c <container>

Explain: The -c flag on kubectl logs selects which container's logs to show in a multi-container Pod.

### kcna-207
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which is a primary use case of Istio in a Kubernetes cluster?
- [x] Service mesh capabilities: traffic management, observability, and security between services.
- [ ] Secure built-in database management for application workloads.
- [ ] Managing container runtime versions between services.
- [ ] Provisioning and managing persistent storage volumes.

Explain: Istio is a service mesh providing traffic management, observability, and security.

### kcna-208
domain: security
difficulty: 3
tags: kubernetes, cloud-native

Q: Which option represents Pod Security Standards ordered from most permissive to most restrictive?
- [ ] Privileged, Restricted, Baseline
- [ ] Baseline, Restricted, Privileged
- [ ] Baseline, Privileged, Restricted
- [x] Privileged, Baseline, Restricted

Explain: The order from most permissive to most restrictive is Privileged, Baseline, Restricted.

### kcna-209
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: What is an advantage of using the Gateway API compared to Ingress in Kubernetes?
- [x] Clearer role separation between infrastructure providers and application developers.
- [ ] Exposing an application externally with just a Service resource.
- [ ] Configuring routing rules through annotations on Ingress resources.
- [ ] Automatically scaling workloads based on CPU/memory.

Explain: Gateway API's role-oriented resource model separates infra and app-developer concerns more cleanly than Ingress annotations.

### kcna-210
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: An app runs in a logical chain: Gateway API, Service, EndpointSlice, and Container. What object is missing?
- [ ] Docker
- [ ] Proxy
- [x] Pod
- [ ] Firewall

Explain: A Pod sits between EndpointSlice and Container in that chain — EndpointSlices point to Pod IPs, and Pods hold Containers.

### kcna-211
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which kubectl patch command correctly updates a container's image in a Deployment without recreating it?
- [ ] kubectl patch deployment my-app -p '{"containers":[{"name":"app-container","image":"nginx:1.25"}]}'
- [ ] kubectl patch deployment my-app --image=nginx:1.25
- [ ] kubectl patch deployment my-app -p '{"spec":{"containers":[...]}}'
- [x] kubectl patch deployment my-app -p '{"spec":{"template":{"spec":{"containers":[{"name":"app-container","image":"nginx:1.25"}]}}}}'

Explain: The patch must target the full path spec.template.spec.containers to reach the Pod template's container list.

### kcna-212
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Which Kubernetes Service type exposes a service only within the cluster?
- [x] ClusterIP
- [ ] LoadBalancer
- [ ] ExternalName
- [ ] NodePort

Explain: ClusterIP is the default type, reachable only from inside the cluster.

### kcna-213
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the main role of CoreDNS within a cluster?
- [x] Provides consistent DNS names for Pods/Services that need to communicate.
- [ ] Converts IPv6 calls to IPv4 for dual-stack Pods.
- [ ] Acts as a DNS server for VMs outside the cluster.
- [ ] Provides DNS as a Service for user-owned domains.

Explain: CoreDNS is the cluster's internal DNS server, resolving Pod/Service names.

### kcna-214
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod's kubectl get pods shows READY 0/1. What feature causes this?
- [x] Readiness Probes
- [ ] Security Contexts
- [ ] DNS Policy
- [ ] Node Selector

Explain: A failing readiness probe keeps the container marked not-ready, showing 0/1.

### kcna-215
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: An app needs to securely access the Kubernetes API without a developer's personal credentials. What's correct?
- [x] Create a ServiceAccount and bind it to the Pod for API access.
- [ ] Generate a certificate for the application to access the API.
- [ ] Use the default ServiceAccount in the namespace.
- [ ] Use a developer's kubeconfig file with restricted permissions.

Explain: A dedicated ServiceAccount bound to the Pod is the standard, secure way to grant API access.

### kcna-216
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: What are the two essential operations that the kube-scheduler normally performs?
- [ ] Pod eviction or starting
- [x] Filtering and Scoring nodes
- [ ] Resources monitoring and reporting
- [ ] Starting and terminating containers

Explain: Filtering (feasible nodes) and Scoring (best node) are the scheduler's two core steps.

### kcna-217
domain: scheduling
difficulty: 2
tags: kubernetes, cloud-native

Q: Which set of resources can receive automatic updates from the HorizontalPodAutoscaler?
- [ ] DaemonSet, Deployment
- [ ] Pod, StatefulSet
- [ ] DaemonSet, StatefulSet
- [x] Deployment, StatefulSet

Explain: HPA can target Deployments and StatefulSets (scalable resources with a replicas field), not DaemonSets or bare Pods.

### kcna-218
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which option represents best practices when building container images?
- [x] Multi-stage builds, pin base image to a digest, only install necessary packages.
- [ ] Multi-stage builds, pin to a digest, install extra packages just in case.
- [ ] Avoid multi-stage builds, use 'latest' tag, install extra packages.
- [ ] Multi-stage builds, use 'latest' tag, only install necessary packages.

Explain: Best practice combines multi-stage builds, pinned digests, and minimal installed packages.

### kcna-219
domain: storage
difficulty: 2
tags: kubernetes, cloud-native

Q: Which open source cloud native storage orchestrator automates deployment/management of Ceph for self-managing, self-scaling, self-healing storage?
- [ ] MinIO
- [ ] OpenEBS
- [ ] CubeFS
- [x] Rook

Explain: Rook is the CNCF storage orchestrator that automates Ceph (and other backends) on Kubernetes.

### kcna-220
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: In Kubernetes, what is the primary responsibility of the kubelet running on each worker node?
- [ ] Providing internal DNS resolution and routing Service traffic.
- [ ] Allocating persistent storage volumes and managing data replication.
- [x] Ensuring containers defined in Pod specs are running and remain healthy on the node.
- [ ] Managing cluster state and all scheduling decisions.

Explain: The kubelet's core job is keeping the containers of assigned Pods running and healthy.

### kcna-221
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the role of the ingressClassName field in a Kubernetes Ingress resource?
- [x] Indicates which Ingress Controller should implement the rules.
- [ ] Specifies the backend Service used by the controller.
- [ ] Defines the protocol (HTTP/HTTPS) the controller should process.
- [ ] Determines routing-rule priority across multiple Ingress objects.

Explain: ingressClassName selects which Ingress Controller implementation should handle that Ingress.

### kcna-222
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What does SBOM stand for?
- [x] Software Bill of Materials
- [ ] Software Bill Operations Management
- [ ] System Bill of Materials
- [ ] Security Baseline for Open Source Management

Explain: SBOM = Software Bill of Materials, listing a software's components/dependencies.

### kcna-223
domain: delivery
difficulty: 2
tags: kubernetes, cloud-native

Q: Which Helm command deletes the release mysql-1234 from the Kubernetes cluster?
- [ ] helm reject mysql-1234
- [ ] helm erase mysql-1234
- [x] helm uninstall mysql-1234
- [ ] helm remove mysql-1234

Explain: helm uninstall removes a release and its resources from the cluster.

### kcna-224
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: Which statement accurately reflects principles of collaborative development and community stewardship?
- [x] Community events and working groups foster collaboration and knowledge sharing.
- [ ] Maintainers act independently without contributor input.
- [ ] Community stewardship guides growth but excludes sustainability.
- [ ] Open source succeeds when contributors skip community engagement.

Explain: Open source communities thrive through events, working groups, and shared knowledge, not isolated decision-making.

### kcna-226
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: What happens if only a limit is specified for a resource and no admission-time default request applies?
- [x] Kubernetes copies the specified limit and uses it as the requested value.
- [ ] Kubernetes creates the container but it fails with CrashLoopBackOff.
- [ ] Kubernetes chooses a random value as the requested value.
- [ ] Kubernetes disallows container creation without request values.

Explain: If only a limit is set with no default request, Kubernetes sets the request equal to the limit.

### kcna-227
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which action is supported when working with Pods in Kubernetes?
- [x] Creating Pods through workload resources like Deployments.
- [ ] Guaranteeing Pods always stay on the same node once scheduled.
- [ ] Managing static Pods directly through the API server.
- [ ] Renaming containers in a Pod using kubectl patch.

Explain: Pods are normally created indirectly through higher-level controllers like Deployments.

### kcna-228
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: In Kubernetes, what is the primary purpose of using annotations?
- [ ] Specify the deployment strategy for applications.
- [ ] Control access permissions for users and service accounts.
- [x] Provide a way to attach metadata to objects.
- [ ] Define specifications for resource limits and requests.

Explain: Annotations attach arbitrary, non-identifying metadata to objects.

### kcna-229
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod named my-app must run a simple nginx container. Which kubectl command should be used?
- [x] kubectl run my-app --image=nginx
- [ ] kubectl create my-app --image=nginx
- [ ] kubectl create nginx --name=my-app
- [ ] kubectl run nginx --name=my-app

Explain: kubectl run <name> --image=<image> is the imperative command to create a single Pod.

### kcna-230
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the correct method to forward a local port to a specific port inside a Pod?
- [ ] Load Balancer
- [x] kubectl port-forward
- [ ] Gateway API
- [ ] NodePort

Explain: kubectl port-forward tunnels a local port directly to a Pod's port.

### kcna-231
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod is returning a CrashLoopBackOff status. What is the most likely reason?
- [ ] The container's image is missing or cannot be pulled.
- [ ] There are insufficient resources allocated for the Pod.
- [ ] The Pod cannot communicate with the API server.
- [x] The application inside the container crashed after starting.

Explain: CrashLoopBackOff specifically indicates the container starts, then repeatedly crashes.

### kcna-232
domain: scheduling
difficulty: 5
tags: kubernetes, cloud-native

Q: An SRE needs to temporarily prevent new Pods from being scheduled on node-2, keeping existing workloads running. Which command?
- [ ] kubectl pause deployment
- [x] kubectl cordon node-2
- [ ] kubectl drain node-2
- [ ] kubectl delete node-2

Explain: kubectl cordon marks a node unschedulable for new Pods while leaving existing Pods running.

### kcna-233
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: In Kubernetes, what is the primary purpose of creating a Service resource for a Deployment?
- [ ] Automatically adjust Pod count based on utilization.
- [ ] Centrally manage runtime configuration values.
- [x] Provide a stable endpoint for accessing Pods even as IPs change.
- [ ] Define and attach persistent volumes for data across restarts.

Explain: A Service gives a stable network identity independent of the churn of individual Pod IPs.

### kcna-234
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement best describes the role of kubelet on a Kubernetes worker node?
- [ ] kubelet monitors cluster-wide resource usage and assigns Pods to nodes.
- [ ] kubelet is the primary API component storing cluster state.
- [x] kubelet manages the container runtime and ensures scheduled Pods run as expected.
- [ ] kubelet configures networking rules for Service traffic routing.

Explain: The kubelet works with the container runtime to keep scheduled Pods running correctly.

### kcna-235
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the primary purpose of a Horizontal Pod Autoscaler (HPA) in Kubernetes?
- [ ] Allocate and manage persistent volumes for stateful apps.
- [ ] Track performance metrics and report node/Pod health.
- [x] Automatically scale the number of Pod replicas based on resource utilization.
- [ ] Coordinate rolling updates when deploying new versions.

Explain: HPA automatically adjusts replica count based on observed resource utilization.

### kcna-236
domain: storage
difficulty: 4
tags: kubernetes, cloud-native

Q: A request for 500 mebibytes of ephemeral storage must be specified in YAML. How should this be written?
- [ ] 0.5M
- [ ] 500m
- [x] 500Mi
- [ ] 500mi

Explain: Mebibytes are expressed with the 'Mi' suffix (binary units), so 500Mi is correct.

### kcna-237
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What command is often used to troubleshoot a failing Pod?
- [ ] kubectl inspect
- [ ] kubectl analyze
- [ ] kubectl info
- [x] kubectl describe

Explain: kubectl describe surfaces events and status details useful for troubleshooting.

### kcna-238
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which scenario best illustrates the use case for a StatefulSet?
- [ ] A web app needing multiple replicas for load balancing.
- [ ] A service routing traffic to various microservices.
- [x] A database requiring persistent storage and stable network identities.
- [ ] A background job that runs periodically without state.

Explain: StatefulSets are designed for apps like databases needing stable identity and persistent storage per replica.

### kcna-239
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: Which file in a Helm chart defines the default configuration values that can be overridden during deployment?
- [ ] templates/deployment.yaml
- [ ] Chart.yaml
- [x] values.yaml
- [ ] requirements.yaml

Explain: values.yaml holds the default configurable values for a chart's templates.

### kcna-240
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which command is the most efficient way to check the progress of a Deployment rollout and confirm success?
- [ ] kubectl logs deployment/my-deployment --all-containers=true
- [ ] kubectl describe deployment my-deployment --namespace=default
- [x] kubectl rollout status deployment/my-deployment
- [ ] kubectl get deployments --show-labels -o wide

Explain: kubectl rollout status is purpose-built to report live rollout progress and completion.

### kcna-241
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: In a Kubernetes cluster, what is the primary role of the Kubernetes scheduler?
- [ ] Manage the lifecycle of Pods by restarting them when they fail.
- [ ] Monitor the health of nodes and pods in the cluster.
- [ ] Handle network traffic between services within the cluster.
- [x] Distribute Pods across nodes based on resource availability and constraints.

Explain: The scheduler assigns Pods to nodes based on resource availability, constraints, and policies.

### kcna-242
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: An admin wants to limit total memory usage of all Pods in a namespace to 4Gi. What should they create?
- [ ] Namespace
- [ ] LimitRange
- [ ] ClusterRole
- [x] ResourceQuota

Explain: A ResourceQuota caps aggregate resource consumption (like total memory) within a namespace.

### kcna-243
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: How does cert-manager integrate with Kubernetes resources to provide TLS certificates for an application?
- [ ] It injects TLS certificates directly into Pods at deploy time.
- [x] It manages Certificate resources and Secrets that Ingress objects can use for TLS.
- [ ] It updates kube-proxy config to encrypt traffic between Services.
- [ ] It replaces default Kubernetes API certificates with external ones.

Explain: cert-manager issues and manages Certificate custom resources, storing results as Secrets used by Ingress for TLS.

### kcna-244
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: In Kubernetes, what is the primary function of a RoleBinding?
- [ ] Create and define a new Role object with specific permissions.
- [ ] Enforce namespace network rules by binding policies to Pods.
- [x] Assign the permissions of a Role to a user, group, or service account within a namespace.
- [ ] Provide a user/group with cluster-wide permissions across all resources.

Explain: A RoleBinding grants the permissions of a Role to specific subjects within a namespace.

### kcna-245
domain: workloads
difficulty: 5
tags: kubernetes, cloud-native

Q: A Pod is stuck in CrashLoopBackOff. What is the correct way to troubleshoot this?
- [ ] Use kubectl top pod and scale the Deployment to more replicas.
- [x] Use kubectl describe pod to review events, then kubectl logs to inspect output.
- [ ] Use kubectl get nodes and kubectl apply -f to restart the Pod.
- [ ] Use kubectl exec -- bash and check /var/log/kubelet.log.

Explain: describe reveals recent events, and logs shows the actual crash output — the standard troubleshooting flow.

### kcna-246
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the Kubernetes abstraction that allows groups of Pods to be exposed inside a Kubernetes cluster?
- [x] Service
- [ ] Deployment
- [ ] Unit
- [ ] Daemon

Explain: A Service exposes a logical grouping of Pods within (or outside) the cluster.

### kcna-247
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: What is an important consideration when choosing a base image for a container in a Kubernetes deployment?
- [ ] It should be the largest available image to include all dependencies.
- [ ] It should always be the latest version for newest features.
- [x] It should be minimal and purpose-built to reduce attack surface and improve performance.
- [ ] It can be any existing public image without considering its contents.

Explain: Minimal, purpose-built base images reduce attack surface and improve build/runtime efficiency.

### kcna-248
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: When modifying an existing Helm release to apply new configuration values, which approach is best practice?
- [ ] Edit the chart source files directly and reapply them.
- [ ] Use kubectl edit to modify the live release resources.
- [ ] Delete the release and reinstall it with the desired configuration.
- [x] Use helm upgrade with --set to apply new values while preserving release history.

Explain: helm upgrade --set applies new values in a tracked, reversible way, preserving release history.

### kcna-249
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which field in a Pod or Deployment manifest ensures that Pods are scheduled only on nodes with specific labels?
- [ ] annotations: disktype: ssd
- [ ] labels: disktype: ssd
- [x] nodeSelector: disktype: ssd
- [ ] resources: disktype: ssd

Explain: nodeSelector matches Pods to nodes carrying the specified label.

### kcna-250
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the purpose of the Gateway API in Kubernetes?
- [ ] Collect, monitor, and log performance metrics for applications.
- [ ] Define and manage persistent storage resources used by Pods.
- [x] Provide a standardized interface for managing traffic routing to Services.
- [ ] Enable apps to automatically scale based on demand.

Explain: The Gateway API standardizes traffic routing configuration for Services, succeeding Ingress.

### kcna-251
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: Why are ServiceAccounts used in Kubernetes when assigning RBAC permissions to Pods?
- [ ] To authenticate Pods via special admin user identities.
- [ ] To securely store application credentials inside Pods.
- [ ] To automatically assign Pods cluster-admin permissions.
- [x] To let Pods authenticate to the API server securely without personal user credentials.

Explain: ServiceAccounts give Pods their own identity to authenticate to the API server, avoiding use of personal credentials.

### kcna-252
domain: cloud-native
difficulty: 4
tags: kubernetes, cloud-native

Q: In a cloud native environment, how do containerization and virtualization differ in terms of resource management?
- [ ] Containerization consumes more memory than virtualization by default.
- [x] Containerization shares the host OS, while virtualization runs a full OS per instance.
- [ ] Containerization uses hypervisors to manage resources, virtualization does not.
- [ ] Containerization allocates resources per container, virtualization does not isolate them.

Explain: Containers share the host kernel/OS, while VMs each run a full guest OS via a hypervisor.

### kcna-253
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: Which command could an admin use to prevent Pod scheduling on a node temporarily, for maintenance?
- [x] kubectl cordon
- [ ] kubectl annotate
- [ ] kubectl label
- [ ] kubectl taint

Explain: kubectl cordon marks the node unschedulable without disturbing existing Pods.

### kcna-254
domain: delivery
difficulty: 5
tags: kubernetes, cloud-native

Q: A platform engineer wants a new microservice automatically deployed to every cluster registered in Argo CD. Which configuration best achieves this?
- [x] Create an Argo CD ApplicationSet using a Git repository containing the microservice manifests.
- [ ] Set up a CronJob that redeploys the microservice on a schedule.
- [ ] Use a Helm chart with a single Application defined in Argo CD.
- [ ] Manually configure every registered cluster with the deployment YAML.

Explain: ApplicationSet is specifically designed to template and deploy an app across many registered clusters automatically.

### kcna-255
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Lightweight network proxies such as Envoy are part of which plane in a service mesh?
- [ ] Management plane
- [ ] Control plane
- [x] Data plane
- [ ] Gateway plane

Explain: Sidecar proxies like Envoy form the data plane, handling actual traffic.

### kcna-256
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: Which common practice is an antipattern when the GitOps workflow goes live?
- [x] Deploying Kubernetes objects via imperative commands.
- [ ] Leaving manual comments in PR discussions.
- [ ] Deploying Kubernetes objects via declarative manifests.
- [ ] Pushing builds with the deploy label.

Explain: Imperative, manual kubectl changes bypass and drift from the Git-declared desired state, defeating GitOps.

### kcna-257
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What command would be used to check the revisions of Deployment web-app?
- [x] kubectl rollout history deployment/web-app
- [ ] kubectl rollout status deployment/web-app
- [ ] kubectl get history deployment/web-app
- [ ] kubectl describe rollout deployment/web-app

Explain: kubectl rollout history lists past revisions of a Deployment.

### kcna-258
domain: storage
difficulty: 4
tags: kubernetes, cloud-native

Q: Which statement is true about the Container Storage Interface (CSI) in Kubernetes?
- [ ] CSI is a Kubernetes-only API with in-tree compiled drivers selected via a PersistentVolume.
- [ ] CSI lets apps mount storage by referencing the driver name directly in the Pod spec.
- [ ] CSI focuses only on NFS/iSCSI backends with basic volume provisioning.
- [x] CSI is a cross-platform spec; in Kubernetes, CSI drivers run as pods with sidecars, consumed via StorageClass/PVC.

Explain: CSI is portable across orchestrators; in Kubernetes it's implemented as driver pods, used through StorageClass and PVC objects.

### kcna-259
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: A deployment must run only on nodes with specific hardware capabilities. What configuration ensures this?
- [ ] Use Pod affinity rules.
- [ ] Set a PodDisruptionBudget for the deployment.
- [x] Use a nodeSelector in the deployment specification.
- [ ] Configure resource limits and requests.

Explain: A nodeSelector restricts scheduling to nodes matching a specific label (e.g., hardware type).

### kcna-260
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: Which cloud native tool(s) keep clusters in sync with Git config sources and automate updates on new code?
- [x] Flux and Argo CD
- [ ] Helm and Kustomize
- [ ] Linkerd and Istio
- [ ] Tekton and Jenkins X

Explain: Flux and Argo CD are the standard GitOps continuous-delivery tools for this purpose.

### kcna-261
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod shows ErrImagePull status. What is most likely the cause?
- [ ] Kubelet is not running properly on the node.
- [ ] Kube-scheduler cannot find a node to execute the Pod.
- [x] The container image cannot be downloaded.
- [ ] The container image needs to run using hostNetwork.

Explain: ErrImagePull specifically indicates the container image could not be pulled/downloaded.

### kcna-262
domain: observability
difficulty: 2
tags: kubernetes, cloud-native

Q: Which statement best describes observability in a cloud native environment?
- [x] Collecting and analyzing logs, metrics, and traces to understand system behavior.
- [ ] Using alerts and dashboards to notify admins about outages.
- [ ] Restarting failed Pods to maintain application availability.
- [ ] Configuring health probes to check container health.

Explain: Observability broadly means gathering and analyzing telemetry (logs/metrics/traces) to understand system behavior.

### kcna-263
domain: storage
difficulty: 4
tags: kubernetes, cloud-native

Q: Which statement best explains the Container Storage Interface (CSI) concept in Kubernetes?
- [x] CSI is a standard API letting Kubernetes (and other orchestrators) use different storage systems via plugins.
- [ ] CSI manages container-to-container communication across nodes.
- [ ] CSI is a Kubernetes-only API providing built-in storage drivers.
- [ ] CSI is a framework that provisions local node storage without external plugins.

Explain: CSI is a vendor-neutral standard specification for pluggable storage integration across orchestrators.

### kcna-264
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Gateway API is a successor to what Kubernetes API?
- [ ] NetworkPolicy
- [ ] Service
- [ ] NodePort
- [x] Ingress

Explain: Gateway API is designed as the next-generation successor to Ingress.

### kcna-265
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: How are ConfigMaps correctly used in Kubernetes applications?
- [ ] To adjust cluster scheduling rules applied by the scheduler.
- [ ] To keep encrypted secrets such as passwords or tokens.
- [x] To provide configuration values that Pods consume as files or variables.
- [ ] To hold shared log files that applications produce.

Explain: ConfigMaps supply non-sensitive configuration data to Pods via env vars or mounted files.

### kcna-266
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: How is an Argo CD ApplicationSet configured to ensure continuous deployment of an application?
- [ ] Manually deploy via kubectl every time changes are made.
- [x] Define the ApplicationSet in YAML and link it to a Git repository containing manifests.
- [ ] Define an ApplicationSet with deployment parameters and apply via kubectl.
- [ ] Use a Helm chart packaged and deployed directly, bypassing GitOps.

Explain: ApplicationSet uses a generator pointing at a Git repo to continuously drive deployments.

### kcna-267
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: DNS issues are suspected inside a Pod. Which command is most useful to verify the problem?
- [ ] kubectl delete pod to recreate and test if the issue resolves.
- [ ] kubectl get endpoints to confirm backend addresses.
- [ ] kubectl logs to review app output for DNS errors.
- [x] kubectl exec -- nslookup to check name resolution directly inside the Pod.

Explain: Running nslookup from inside the Pod directly tests its DNS resolution against CoreDNS.

### kcna-268
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: In Kubernetes RBAC, what is the primary difference between a Role and a ClusterRole?
- [ ] Role is weaker in scope/power; ClusterRole is always stronger.
- [x] A Role is namespace-scoped; a ClusterRole is cluster-scoped, applying across all namespaces.
- [ ] Role defines modify permissions; ClusterRole defines only view permissions.
- [ ] Role is limited to Pods/Services; ClusterRole can grant access to any resource type.

Explain: Roles apply within one namespace; ClusterRoles can apply cluster-wide (or be bound within a namespace too).

### kcna-269
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which Kubernetes resource provides standardized load balancing, TLS termination, and multi-context traffic routing across different implementations?
- [x] Gateway API
- [ ] CoreDNS
- [ ] Ingress
- [ ] kube-proxy

Explain: The Gateway API standardizes advanced traffic routing/LB/TLS features across implementations.

### kcna-270
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement describes the purpose of Labels in Kubernetes?
- [ ] Labels must be defined on objects before they can be created.
- [ ] Labels assign objects to specific namespaces for isolation.
- [ ] Labels provide globally unique identifiers for all objects.
- [x] Labels attach identifying metadata to objects so they can be selected and grouped.

Explain: Labels are key/value metadata used for selecting and organizing objects.

### kcna-271
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: In a Kubernetes cluster, the component called etcd plays an essential role. What is its primary function?
- [ ] Replicate cluster state data across control plane nodes for HA.
- [x] Provide a distributed key-value store for all cluster state and data.
- [ ] Persist API object definitions such as Pods, ConfigMaps, Secrets.
- [ ] Maintain desired state of workloads by reconciling changes through controllers.

Explain: etcd's core role is serving as the distributed key-value store holding all cluster state.

### kcna-272
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the correct command to scale multiple Pods for a deployment?
- [ ] kubectl scale --clones=3 deployment/my-app
- [ ] kubectl scale --pods=3 deployment/my-app
- [x] kubectl scale --replicas=3 deployment/my-app
- [ ] kubectl scale --copy=3 deployment/my-app

Explain: kubectl scale --replicas=<n> sets the desired replica count for a Deployment.

### kcna-273
domain: security
difficulty: 2
tags: kubernetes, cloud-native

Q: Which Pod Security Standard balances ease of adoption while still preventing known privilege escalations?
- [ ] Privileged
- [ ] Permissive
- [ ] Restricted
- [x] Baseline

Explain: Baseline blocks known privilege-escalation vectors while remaining easy to adopt broadly.

### kcna-274
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A logging agent must be deployed to run on every node in a Kubernetes cluster. Which resource should be used?
- [ ] Deployment
- [x] DaemonSet
- [ ] ReplicaSet
- [ ] StatefulSet

Explain: A DaemonSet automatically runs a Pod copy on every (or selected) node — ideal for logging agents.

### kcna-275
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: How can a tls-type secret be created holding a TLS cert and key using kubectl?
- [ ] kubectl create secret generic tls-secret --cert=... --key=...
- [x] kubectl create secret tls tls-secret --cert=path/to/tls.crt --key=path/to/tls.key
- [ ] kubectl create secret tls tls-secret --from-file=cert=... --from-file=key=...
- [ ] kubectl create secret generic tls-secret --from-file=cert=... --from-file=key=...

Explain: kubectl create secret tls uses --cert and --key flags specifically for the TLS secret type.

### kcna-276
domain: networking
difficulty: 4
tags: kubernetes, cloud-native

Q: In a Kubernetes cluster, how does DNS resolution work for services?
- [ ] Uses the IP addresses of the Pods directly.
- [ ] Handled by an external DNS provider managing all service names.
- [x] Kubernetes creates service names that resolve to stable cluster IPs.
- [ ] Service names are resolved using environment variables set in each Pod.

Explain: Cluster DNS resolves service names to stable ClusterIPs (or Pod IPs for headless Services).

### kcna-277
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What best describes containerization?
- [ ] A technique for running apps only on bare metal without abstraction.
- [x] A lightweight approach to running apps in isolated environments using shared OS resources.
- [ ] A way to create and manage virtual machines.
- [ ] A method of virtualizing hardware to run multiple OSes.

Explain: Containerization isolates applications while sharing the host OS kernel, unlike full virtualization.

### kcna-278
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: In a Kubernetes cluster, how are Labels and Selectors utilized to manage and organize resources?
- [ ] Labels are used only for service discovery.
- [x] Labels categorize resources; Selectors filter and retrieve resources based on those labels.
- [ ] Selectors can only be applied to Pods.
- [ ] Labels are auto-generated; Selectors are manually defined.

Explain: Labels tag resources with metadata, and Selectors query/filter resources by that metadata.

### kcna-279
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary role of a Service in a Kubernetes cluster?
- [x] It exposes an application running behind a single outward-facing endpoint.
- [ ] To store configuration data and secrets in the cluster.
- [ ] To provide internet access into the cluster.
- [ ] To manage automatic scaling of applications.

Explain: A Service provides one stable endpoint for a set of backing Pods.

### kcna-280
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What happens if a container runtime is missing on Kubernetes worker nodes?
- [ ] kubelet cannot communicate with kube-api-server.
- [ ] Nodes cannot communicate with each other.
- [x] kubelet cannot launch Pods.
- [ ] Pods cannot communicate with each other.

Explain: Without a container runtime, the kubelet has no way to actually start containers for Pods.

### kcna-281
domain: security
difficulty: 2
tags: kubernetes, cloud-native

Q: Which Pod Security Standard enforces the most restrictive settings, designed for security-critical workloads?
- [ ] Unrestricted
- [x] Restricted
- [ ] Privileged
- [ ] Baseline

Explain: Restricted is the most locked-down of the three official Pod Security Standards.

### kcna-282
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: Which statement is correct about Role and ClusterRole objects in Kubernetes?
- [x] Roles can only set permissions for resources within a particular namespace.
- [ ] ClusterRoles and Roles can remove permissions from resources within a namespace.
- [ ] ClusterRoles can only set permissions for non-namespaced resources.
- [ ] Roles can set permissions for both namespaced and non-namespaced objects.

Explain: A Role's permissions are always scoped to a single namespace.

### kcna-283
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What are the possible options for PolicyTypes when configuring a NetworkPolicy?
- [ ] inbound and outbound
- [x] ingress and egress
- [ ] push and pull
- [ ] get and put

Explain: NetworkPolicy PolicyTypes are Ingress and Egress.

### kcna-284
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod needs to be configured for a slow-starting application, only marked ready once fully initialized. What's the best approach?
- [ ] Use a startup probe only.
- [ ] Use a readiness probe only.
- [ ] Use both liveness and startup probes.
- [x] Use both readiness and startup probes.

Explain: A startup probe delays liveness/readiness checks; combined with a readiness probe, the Pod is only marked ready once initialized.

### kcna-285
domain: architecture
difficulty: 4
tags: kubernetes, cloud-native

Q: A node is scheduled for maintenance. How can Pods on that node be identified so workloads can be redirected first?
- [ ] kubectl describe node
- [x] kubectl get pods -o wide --all-namespaces
- [ ] kubectl get pods --on
- [ ] kubectl describe pods --on

Explain: Listing all Pods with -o wide (filtered by node) shows which Pods are running where.

### kcna-286
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: By default Pods are non-isolated. When a NetworkPolicy selects a Pod, it becomes isolated. How are multiple NetworkPolicies on the same Pod handled?
- [ ] restricted
- [x] additive
- [ ] conflicting
- [ ] hierarchical

Explain: Multiple NetworkPolicies applied to the same Pod are combined additively (union of allowed traffic).

### kcna-287
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: CNCF organizes different Kubernetes related events: meetups, KubeCons, KubeDays, KCDs, etc. What does KCD stand for?
- [ ] Kubernetes Cloud Developers
- [ ] Kubernetes Cloud Days
- [x] Kubernetes Community Days
- [ ] Kubernetes Community Developers

Explain: KCD = Kubernetes Community Days.

### kcna-288
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: Which command correctly uses kubectl exec to inspect environment variables inside a running container?
- [ ] kubectl exec -- show variables
- [ ] kubectl exec -- get env
- [ ] kubectl exec -- list config
- [x] kubectl exec -- env

Explain: kubectl exec <pod> -- env runs the env command inside the container.

### kcna-289
domain: scheduling
difficulty: 5
tags: kubernetes, cloud-native

Q: A node worker-1 needs maintenance; workloads must be safely evicted and rescheduled. Which command?
- [ ] kubectl delete node worker-1 --delete-emptydir-data
- [x] kubectl drain worker-1 --ignore-daemonsets
- [ ] kubectl scale deployment --replicas=0 --namespace=production
- [ ] kubectl cordon worker-1 --daemonsets=off

Explain: kubectl drain safely evicts Pods from a node (ignoring DaemonSets) before maintenance.

### kcna-290
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which CNCF project is primarily used as a high-performance proxy for microservices, handling service-to-service communication, load balancing, and observability in service meshes?
- [ ] Helm
- [ ] Fluentd
- [x] Envoy
- [ ] Prometheus

Explain: Envoy is the CNCF proxy widely used as the data-plane component of service meshes.

### kcna-291
domain: scheduling
difficulty: 3
tags: kubernetes, cloud-native

Q: Which Kubernetes feature is the simplest way to force a Pod or Deployment to run only on nodes with a specific label?
- [ ] Taint
- [x] NodeSelector
- [ ] NodeAffinity
- [ ] Toleration

Explain: nodeSelector is the simplest label-based scheduling constraint, simpler than full node affinity.

### kcna-292
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary purpose of an Ingress resource in Kubernetes?
- [ ] Monitor the health status of application Pods.
- [x] Expose internal services to external web traffic.
- [ ] Store configuration data used by applications.
- [ ] Manage persistent volumes for application data.

Explain: Ingress exposes internal Services to external HTTP/HTTPS traffic.

### kcna-293
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: In Kubernetes, how do Namespaces differ from Labels in managing resources within a cluster?
- [ ] Namespaces can only contain Pods, but Labels apply to any resource.
- [ ] Namespaces are static, while Labels can be modified dynamically.
- [ ] Namespaces are only for access control; Labels are solely for monitoring.
- [x] Namespaces isolate resources, while Labels are used for query and selection.

Explain: Namespaces partition/isolate resources; Labels are metadata used to query and select across resources.

### kcna-294
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: A team's ML workload performs best on nodes labeled disk=ssd but must still run elsewhere if none are available. Which scheduling rule?
- [x] Node Affinity with PreferredDuringSchedulingIgnoredDuringExecution
- [ ] Pod Anti-Affinity
- [ ] Taints and Tolerations
- [ ] Node Affinity with RequiredDuringSchedulingIgnoredDuringExecution

Explain: 'Preferred' node affinity expresses a soft preference, falling back to other nodes if unmet.

### kcna-295
domain: cloud-native
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the main role of CNCF Ambassadors in the cloud native ecosystem?
- [x] Promote cloud native adoption by supporting communities, organizing events, and advocating for CNCF projects.
- [ ] Handle CNCF operations: budgets, sponsors, agreements.
- [ ] Design Kubernetes features: writing code, planning releases.
- [ ] Manage project governance: guiding development, reviewing code.

Explain: CNCF Ambassadors are community advocates who promote adoption and organize local events.

### kcna-296
domain: observability
difficulty: 1
tags: kubernetes, cloud-native

Q: Prometheus has 4 core metric types: Summary, Histogram, Gauge. What is the 4th metric type?
- [ ] Sampler
- [x] Counter
- [ ] Final
- [ ] Total

Explain: The four core Prometheus metric types are Counter, Gauge, Histogram, and Summary.

### kcna-297
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: How can a Pod be configured to use a ServiceAccount for authenticated API access?
- [ ] Attach the ServiceAccount directly to the kube-scheduler.
- [x] Specify the ServiceAccount name in the Pod spec; Kubernetes mounts its token as a volume.
- [ ] Embed the ServiceAccount token inside the container image at build time.
- [ ] Convert the ServiceAccount into a ConfigMap consumed as environment variables.

Explain: Referencing a serviceAccountName in the Pod spec causes its token to be automatically mounted into the Pod.

### kcna-298
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: Which component is responsible for maintaining the desired state of applications by reconciling resources such as Deployments and ReplicaSets?
- [x] Controller Manager
- [ ] Kubernetes API Server
- [ ] kubelet
- [ ] etcd

Explain: The (kube-)controller-manager runs the control loops that reconcile actual vs. desired state.

### kcna-299
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary purpose of Custom Resource Definitions (CRDs) in Kubernetes?
- [ ] Automatically scale pods based on resource usage.
- [ ] Facilitate network communication between Pods and services.
- [x] Define a set of custom resources that extend the Kubernetes API.
- [ ] Manage the storage of persistent volumes within a cluster.

Explain: CRDs let you define entirely new custom API resource types.

### kcna-300
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: If a Pod contains multiple containers, how can logs be viewed from one of the containers?
- [ ] kubectl logs --describe
- [x] kubectl logs --container
- [ ] kubectl logs --application
- [ ] kubectl logs --docker

Explain: The --container (-c) flag on kubectl logs selects which container's logs to display.

### kcna-301
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: New nodes with SSD disks are labeled via kubectl label nodes disktype=ssd. Which Pod manifest field ensures placement only on these nodes?
- [ ] nodeName: ssd
- [ ] nodeSelector: disktype=ssd (invalid YAML)
- [x] nodeSelector: {disktype: ssd}
- [ ] nodeDiskType: ssd

Explain: nodeSelector uses YAML's colon key:value syntax (disktype: ssd) to match node labels; nodeName targets a literal node name, and the made-up nodeDiskType field doesn't exist.

### kcna-302
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary difference between a control-plane node and a worker node?
- [ ] Control-plane nodes are only for monitoring, worker nodes handle networking.
- [ ] Control-plane nodes are always VMs, worker nodes always physical servers.
- [ ] Control-plane nodes run applications, worker nodes manage cluster state.
- [x] Control-plane nodes manage the cluster state, worker nodes run applications.

Explain: Control-plane nodes host management components (API server, scheduler, etcd); worker nodes run application Pods via kubelet.

### kcna-303
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: When deploying an application using Helm, which flag deletes the installation on failure?
- [ ] -force
- [ ] -verify
- [ ] -wait
- [x] --atomic

Explain: --atomic tells Helm to automatically roll back and delete the release if install/upgrade fails.

### kcna-304
domain: workloads
difficulty: 5
tags: kubernetes, cloud-native

Q: A Deployment web-app in production has 2 replicas; it must be increased to 5. Which command correctly scales it?
- [ ] kubectl create deployment web-app --replicas=5 -n production
- [ ] kubectl apply -f web-app-deployment.yaml -replicas=5 -n production
- [ ] kubectl edit deployment web-app -replicas=5 -n production
- [x] kubectl scale deployment web-app --replicas=5 -n production

Explain: kubectl scale deployment <name> --replicas=<n> is the direct, purpose-built way to change replica count.

### kcna-306
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: When building a container image, which practice best ensures the image size is optimized?
- [ ] Include unnecessary files for debugging purposes.
- [x] Minimize the number of layers in the image.
- [ ] Always run containers as the root user.
- [ ] Use a large base image to include all dependencies.

Explain: Fewer layers (via multi-stage builds and combined RUN commands) reduces image size and improves efficiency.

### kcna-307
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: What Kubernetes object is commonly used to control or limit traffic flow to/from Pods?
- [ ] iptables
- [ ] nftables
- [ ] firewalld
- [x] NetworkPolicy

Explain: NetworkPolicy is the native Kubernetes API object for controlling Pod ingress/egress traffic.

### kcna-308
domain: networking
difficulty: 3
tags: kubernetes, cloud-native

Q: Which of the following describes the main use cases of Istio?
- [ ] Building Docker images and managing container registries.
- [ ] Replacing Kubernetes as a container orchestration platform.
- [ ] Provisioning cloud infrastructure like VMs and storage.
- [x] Traffic management, security, and observability for microservices in Kubernetes.

Explain: Istio is a service mesh providing traffic management, mTLS security, and observability.

### kcna-309
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What Kubernetes component runs on every worker node and makes sure containers are running in a Pod?
- [ ] etcd
- [ ] kube-scheduler
- [x] kubelet
- [ ] kube-apiserver

Explain: The kubelet is the node agent ensuring Pod containers stay running.

### kcna-310
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: Configuring an Argo CD ApplicationSet for continuous deployment — which action is essential?
- [ ] Create a Service exposing the ApplicationSet itself.
- [ ] Manually reapply the ApplicationSet config with kubectl after each change.
- [ ] Add a Helm generator or Git generator in the ApplicationSet.
- [x] Specify the source repository/path for manifests in the ApplicationSet.

Explain: An ApplicationSet needs a generator (Git or Helm) to discover and template Applications, and that generator's job is to specify the source repository and path for the application manifests it should manage.

### kcna-311
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What is a key advantage of using a DaemonSet for cluster-wide services such as logging or monitoring agents?
- [ ] Exposes the application externally through a stable IP.
- [ ] Creates a single Pod replicating logs from all other nodes.
- [ ] Ensures the Pod runs only on master nodes.
- [x] Automatically schedules a Pod on every node, including newly added ones.

Explain: DaemonSets auto-schedule a Pod copy onto every node, including ones added later.

### kcna-312
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: What best describes the primary difference between blue-green and canary deployments?
- [ ] Canary is for rollback scenarios; blue-green is for new feature releases.
- [ ] Blue-green is generally faster since it avoids gradual monitoring/traffic shifting.
- [x] Blue-green runs two environments side by side and switches traffic entirely; canary shifts traffic gradually.
- [ ] Canary always replaces the entire app in one step; blue-green proceeds incrementally.

Explain: Blue-green cuts over all traffic at once between two full environments; canary incrementally shifts a portion of traffic.

### kcna-313
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: Which statement is true about the role of etcd in a Kubernetes cluster?
- [x] etcd is a key-value store that holds the cluster's state and configuration data.
- [ ] etcd provides load balancing for traffic entering the cluster.
- [ ] etcd stores container images for Pods running in the cluster.
- [ ] etcd manages networking policies between Namespaces.

Explain: etcd is the distributed, consistent key-value store persisting all cluster state.

### kcna-314
domain: observability
difficulty: 4
tags: kubernetes, cloud-native

Q: How can logs be retrieved from a previously terminated container named golang inside Pod golang-web-app?
- [x] kubectl logs -p -c golang golang-web-app
- [ ] kubectl logs golang
- [ ] kubectl logs -c golang golang-web-app
- [ ] kubectl logs -c golang golang-web-app --terminated

Explain: -p (previous) plus -c golang targets logs from the terminated instance of that specific container.

### kcna-315
domain: delivery
difficulty: 4
tags: kubernetes, cloud-native

Q: In Kubernetes application delivery, what is the main role of Kustomize compared to Helm?
- [x] Kustomize overlays configurations directly without templates, while Helm relies on templates for reusable charts.
- [ ] Kustomize handles dependencies automatically, Helm requires manual tracking.
- [ ] Kustomize is for installing new apps only, Helm for ongoing upgrades.
- [ ] Kustomize creates Helm charts; Helm deploys those charts.

Explain: Kustomize patches plain YAML via overlays with no templating language, unlike Helm's templated chart model.

### kcna-316
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: What is the primary benefit of using GitOps tools like Argo CD?
- [ ] Automated scaling of resources through usage monitoring policies.
- [ ] Automatic generation of Helm charts for deployments.
- [x] Declarative management of application states in a version-controlled repository.
- [ ] Enhanced security through encrypted secrets synchronization.

Explain: GitOps tools reconcile live cluster state to a declarative desired state stored in Git.

### kcna-317
domain: architecture
difficulty: 1
tags: kubernetes, cloud-native

Q: Which Kubernetes component enforces resource consumption limits on containers?
- [ ] kube-proxy
- [x] kubelet
- [ ] kube-apiserver
- [ ] etcd

Explain: The kubelet enforces requests/limits by configuring cgroups on the node.

### kcna-318
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the main purpose of applying the principle of least privilege when configuring access controls?
- [ ] Allow every user unrestricted access for collaboration.
- [ ] Enforce strict separation of access boundaries between workloads.
- [x] Ensure users/applications have only the minimum access necessary for their tasks.
- [ ] Simplify and standardize permission management across namespaces.

Explain: Least privilege means granting only the minimum permissions strictly required, limiting blast radius.

### kcna-319
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the main advantage of using kubectl patch to update a Deployment compared to applying a modified YAML file?
- [x] It allows real-time updates without downtime.
- [ ] It automatically rolls back changes if they fail.
- [ ] It simplifies the YAML file structure required for updates.
- [ ] It reduces the risk of configuration drift.

Explain: kubectl patch updates specific fields on the live object immediately without a full YAML resubmission or disruption.

### kcna-320
domain: workloads
difficulty: 4
tags: kubernetes, cloud-native

Q: What describes the dependency relationship between Liveness, Readiness, and Startup probes?
- [ ] Startup probes replace Readiness probes and run continuously after startup.
- [x] Readiness and Liveness probes wait for the Startup probe to succeed, then run independently.
- [ ] Readiness runs first, then Liveness; Startup only runs if those fail.
- [ ] Startup runs first, then Readiness; Liveness only runs if both succeed.

Explain: The kubelet holds off Liveness/Readiness checks until Startup succeeds, after which they run independently.

### kcna-321
domain: security
difficulty: 5
tags: kubernetes, cloud-native

Q: A DevOps engineer must ensure Pods in the testing namespace cannot run with elevated privileges. Which action correctly enforces this?
- [x] Apply a PodSecurityAdmission controller with the privileged level set to false.
- [ ] Define a ResourceQuota with strict CPU/memory caps.
- [ ] Configure a PodSecurityPolicy (deprecated) blocking privileged containers.
- [ ] Create a NetworkPolicy restricting ingress traffic.

Explain: Pod Security Admission (replacing deprecated PodSecurityPolicy) enforces standards like disallowing privileged Pods at the namespace level.

### kcna-322
domain: architecture
difficulty: 3
tags: kubernetes, cloud-native

Q: How does containerd differ from the Docker Engine?
- [x] containerd is a container runtime that Docker Engine includes, plus extra features like image building.
- [ ] Docker Engine is designed for high scalability; containerd is single-node only.
- [ ] containerd is a management UI; Docker Engine is command-line based.
- [ ] Docker Engine is a runtime; containerd includes a runtime plus image building.

Explain: containerd is the lightweight core runtime bundled inside the larger Docker Engine platform, which adds tooling like BuildKit.

### kcna-323
domain: storage
difficulty: 4
tags: kubernetes, cloud-native

Q: A Pod can't be scheduled: 'node(s) had no available volume zone'. What is the most likely cause?
- [ ] Resource limits prevent volume creation.
- [ ] No available container image in the zone.
- [x] The persistent volume is provisioned in a different availability zone than the Pod.
- [ ] The Pod is missing environment variables for storage config.

Explain: This error indicates a storage topology mismatch — the PV's zone doesn't match any schedulable node's zone.

### kcna-324
domain: workloads
difficulty: 3
tags: kubernetes, cloud-native

Q: Which command inspects environment variables inside a running Pod?
- [ ] kubectl get -show-env
- [ ] kubectl get pods -o yaml
- [ ] kubectl logs -- env
- [x] kubectl exec -- env

Explain: kubectl exec -- env runs the env command inside the container, showing actual runtime values.

### kcna-325
domain: cloud-native
difficulty: 1
tags: kubernetes, cloud-native

Q: What is the preferred method of conflict resolution and decision-making for CNCF open source projects?
- [ ] Project Founder Say
- [ ] Financial Analysis
- [ ] Flipism Technique
- [x] Discussion and Voting

Explain: CNCF projects favor open discussion followed by community voting.

### kcna-326
domain: delivery
difficulty: 3
tags: kubernetes, cloud-native

Q: What is a commonly used, declarative, GitOps continuous delivery tool for Kubernetes?
- [x] Argo CD
- [ ] Prometheus
- [ ] kubectl
- [ ] Helm

Explain: Argo CD is the widely used declarative GitOps CD tool syncing clusters to Git state.

### kcna-327
domain: architecture
difficulty: 2
tags: kubernetes, cloud-native

Q: What is the general purpose of certificates for cluster components?
- [x] To secure communication between control plane components and nodes.
- [ ] To define access policies for Kubernetes users.
- [ ] To schedule Pods on specific nodes based on resources.
- [ ] Certificates are not required for control plane communication.

Explain: TLS certificates authenticate and encrypt communication between control-plane components and nodes.

### kcna-328
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: In a cloud native environment, what is OpenTelemetry primarily used for?
- [ ] Managing container orchestration and deployment.
- [x] Providing a framework for collecting and sending telemetry data.
- [ ] Acting as a centralized telemetry storage/visualization system.
- [ ] Defining and enforcing network/access policies for microservices.

Explain: OpenTelemetry is a vendor-neutral framework/APIs for generating, collecting, and exporting telemetry data.

### kcna-329
domain: security
difficulty: 4
tags: kubernetes, cloud-native

Q: What is the primary reason for creating a Secret instead of storing credentials in a ConfigMap?
- [ ] Secrets are generally easier to manage than ConfigMaps.
- [ ] Secrets allow storing larger amounts of data.
- [ ] ConfigMaps aren't designed for storing any data.
- [x] Secrets provide a dedicated mechanism for securely storing sensitive information.

Explain: Secrets exist specifically for sensitive data, with handling distinct from (and more restrictive than) ConfigMaps.

### kcna-330
domain: scheduling
difficulty: 4
tags: kubernetes, cloud-native

Q: How does node affinity influence Pod scheduling?
- [ ] Node affinity is solely for balancing load across nodes.
- [ ] Node affinity can only be used with node taints.
- [ ] Node affinity prevents Pods from being scheduled on any node.
- [x] Node affinity allows Pods to be scheduled on nodes with specific labels.

Explain: Node affinity uses label-based rules (required or preferred) to influence which nodes a Pod can land on.

### kcna-331
domain: networking
difficulty: 5
tags: kubernetes, cloud-native

Q: A Pod is suspected of being unable to resolve a Service's DNS name. What's the correct troubleshooting approach with nslookup?
- [x] Run kubectl exec -- nslookup <svc>.<ns>.svc.cluster.local.
- [ ] Run kubectl get pods -o wide to verify DNS works across nodes.
- [ ] Run kubectl logs to check if DNS queries appear in output.
- [ ] Run kubectl describe service to list DNS names generated by CoreDNS.

Explain: Running nslookup from inside the Pod directly tests DNS resolution through CoreDNS.

### kcna-332
domain: networking
difficulty: 2
tags: kubernetes, cloud-native

Q: Which of the following is a stable Gateway API resource?
- [x] HTTPRoute
- [ ] NodePort
- [ ] Ingress
- [ ] CNI

Explain: HTTPRoute has reached GA/stable status in the Gateway API as the modern successor to Ingress rules.

### kcna-333
domain: observability
difficulty: 3
tags: kubernetes, cloud-native

Q: Which kubectl command is used to collect logs from a Pod?
- [ ] kubectl get logs
- [x] kubectl logs
- [ ] kubectl fetch logs
- [ ] kubectl describe logs

Explain: kubectl logs is the correct subcommand for retrieving container stdout/stderr output.
