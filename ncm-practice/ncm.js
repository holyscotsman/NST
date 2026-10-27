// NST serves this page under a strict CSP (style-src 'self'), which forbids inline style attributes in markup. The
// templates below carry data-css="prop:value;..." instead, and this applies it through the style API (allowed).
(function(){const apply=n=>{if(n.nodeType!==1)return;const els=n.matches('[data-css]')?[n,...n.querySelectorAll('[data-css]')]:[...n.querySelectorAll('[data-css]')];els.forEach(e=>{String(e.getAttribute('data-css')).split(';').forEach(d=>{const k=d.indexOf(':');if(k>0)e.style.setProperty(d.slice(0,k).trim(),d.slice(k+1).trim())});e.removeAttribute('data-css')})};
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(apply))).observe(document.documentElement,{childList:true,subtree:true})})();

// ---------- DATA ----------
const LOCS=["Prism Element","Prism Central","SSH / CLI","Desktop text editor","PC API Explorer","Nutanix Sizer"];
const T=[
{id:1,name:"SQL01 vs SQL02 analysis + fix SQL02",loc:1,locFull:"Prism Central (Analysis, Reports, VM disk clone) → ACLI as a fallback for the disk",
 scen:"The DBA team says SQL02 performs worse than SQL01 though both came from the same image. Both VMs are off and must stay off. Compare them, save the analysis and a scheduled report, capture the page to a text file, and fix SQL02.",
 vals:[["Analysis session name","Compare SQL01 and SQL02"],["Report name","Compare SQL01 and SQL02"],["Report schedule","Daily at 10:00 AM",["daily 10:00 am","daily 10am","daily at 10am","daily 10:00"]],["Report recipient","perf_group@ACME.org"],["Report retention","disabled",["off","disable","none"]],["Text file on Desktop","Task 1.txt"],["SQL02 problem disk bus → correct bus","IDE/SATA → SCSI",["ide → scsi","sata → scsi","ide/sata to scsi","scsi"]],["The three charts to add","IOPS, I/O latency, I/O bandwidth",["iops latency bandwidth","iops, io latency, io bandwidth","3 io charts"]],["GUI clone option name","Clone from ADSF File",["clone from adsf","adsf file","clone from adsf file"]]],
 steps:["PC → Operations → Analysis → New Session; entity type Virtual Machine, add SQL01 + SQL02","Three I/O charts: IOPS, I/O latency, I/O bandwidth (storage, not CPU/memory)","Save session as Compare SQL01 and SQL02","Right-click chart area → Select All → copy → Notepad → Desktop\\Task 1.txt","Create Report from the session: Compare SQL01 and SQL02, daily 10:00 AM to perf_group@ACME.org, retention off","PC → SQL02 → Disks: the IDE/SATA disk is the problem; hover it and copy its ADSF path","Add New Disk → Clone from ADSF File → paste the path → bus SCSI → Add","Remove the IDE/SATA disk; VM stays off (ACLI clone_from_vmdisk is the fallback)"],
 cmds:"acli vm.get SQL01\nacli vm.get SQL02\nacli vm.disk_create SQL02 clone_from_vmdisk=<UUID> bus=scsi\nacli vm.disk_delete SQL02 disk_addr=sata.0   # or ide.0",
 gotchas:["Powering on either VM","Charting CPU/memory; the task is storage, so IOPS + latency + bandwidth","Leaving report retention enabled","Saving Task1.txt instead of Task 1.txt","Fixing charts but never fixing SQL02's disk","Deleting the VM instead of correcting the disk"],
 flash:"PC Analysis (3 IO charts) + Report + Desktop Task 1.txt + SQL02 disk cloned to SCSI; leave SQL01/SQL02 OFF."},
{id:2,name:"OpenSSL CSR with SAN",loc:2,locFull:"SSH to a CVM (openssl); results copied to Desktop by cat → paste",
 scen:"Security needs a CSR for the Prism Element certificate covering the cluster VIP and all three CVMs before the corporate CA will issue it. Save the config, the CSR, and the commands you ran.",
 vals:[["Common Name","prism_element.ACME.org"],["SANs","cvm1.ACME.org, cvm2.ACME.org, cvm3.ACME.org",["cvm1 cvm2 cvm3","cvm1.acme.org cvm2.acme.org cvm3.acme.org","cvm1, cvm2, cvm3"]],["Country / State / Locality","US / North Carolina / Durham",["us north carolina durham","us, north carolina, durham"]],["Org / OU","ACME / Infrastructure",["acme infrastructure","acme, infrastructure"]],["Key / digest","RSA 2048 / SHA-256",["rsa 2048 sha256","2048 sha256","2048/sha256","rsa2048 sha256"]],["Config file name","prism_element_acme.cnf"],["CSR file name","prism_element_acme.csr"],["Commands + output file","Task 13.txt"],["Get files to the Desktop by","cat → select → paste into Notepad",["cat and paste","copy paste","cat"]]],
 steps:["SSH to a CVM","Write prism_element_acme.cnf: [req], [req_distinguished_name], [v3_req], [alt_names]","openssl req -new -nodes -sha256 … -config the .cnf → .csr (and .key)","openssl req -text -noout -verify -in the .csr; confirm SANs in the output","cat each file, select the text in the terminal, paste into Notepad, Save As the exact name on the Desktop","Paste commands and output into Desktop\\Task 13.txt","Only if the task asks for a self-signed cert too: openssl x509 -req … -extensions v3_req -extfile the .cnf"],
 cmds:"[ req ]\ndefault_bits = 2048\ndistinguished_name = req_distinguished_name\nreq_extensions = v3_req\nprompt = no\n[ req_distinguished_name ]\nC = US\nST = North Carolina\nL = Durham\nO = ACME\nOU = Infrastructure\nCN = prism_element.ACME.org\nemailAddress = administrator@ACME.org\n[ v3_req ]\nsubjectAltName = @alt_names\n[ alt_names ]\nDNS.1 = cvm1.ACME.org\nDNS.2 = cvm2.ACME.org\nDNS.3 = cvm3.ACME.org\n\nopenssl req -new -nodes -out prism_element_acme.csr -keyout prism_element_acme.key -config prism_element_acme.cnf -sha256\nopenssl req -text -noout -verify -in prism_element_acme.csr\n\n# only if a self-signed certificate is also required:\nopenssl x509 -req -days 1460 -in prism_element_acme.csr -signkey prism_element_acme.key -out prism_element_acme.crt -sha256 -extensions v3_req -extfile prism_element_acme.cnf",
 gotchas:["Forgetting the SANs (v3_req / alt_names)","Trying to download the files instead of cat → copy → paste into Notepad","Saving the key but not the CSR","Wrong filename or path","Not pasting output into Task 13.txt","Using SHA1 instead of SHA-256"],
 flash:"OpenSSL CSR; files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt; cat → paste to get them onto the Desktop."},
{id:3,name:"Category + storage encryption policy",loc:1,locFull:"Prism Central → Govern → Categories / Storage Policies",
 scen:"Admins should be able to opt a VM into software encryption by tagging it. Some VMs will later sit on self-encrypting drives and must be distinguishable by the same category.",
 vals:[["Category name","VM-Storage"],["Category values (two)","softwareencrypted, SEDencrypted",["softwareencrypted sedencrypted","softwareencrypted and sedencrypted"]],["Storage policy name","Encrypted-Storage"],["Policy matches which value","softwareencrypted"],["Policy action","Encrypt VM storage",["encrypt","encryption","storage encryption"]]],
 steps:["PC → Govern → Categories","Create category VM-Storage","Add value softwareencrypted","Add value SEDencrypted","Govern → Policies → Storage Policies","Create Encrypted-Storage, rule VM-Storage = softwareencrypted","Enable encryption action, save, verify"],
 cmds:"",
 gotchas:["Creating only one category value","Pointing the policy at SEDencrypted instead of softwareencrypted","Looking for categories in PE instead of PC","Creating the category but never the policy"],
 flash:"PC → Categories + Storage Policy; VM-Storage has two values, policy uses softwareencrypted."},
{id:4,name:"Database_VM volume group optimization",loc:1,locFull:"Prism Central → Infrastructure → Storage → Volume Groups (PE Storage → Volume Groups also works)",
 scen:"Database_VM was migrated with a volume group attached. Tune that VG for best performance in a production multi-node cluster. Use the existing VG, add no disks, VM stays off.",
 vals:[["Setting that spreads VG I/O across nodes","Load balancing",["load balance","load balancing","enable load balancing","load balance volume groups"]],["What must happen before you can change it","Detach the VM (Manage Connections → remove)",["detach","detach the vm","remove vm from vg","manage connections"]],["After enabling it","Re-attach the VM (Manage Connections → add)",["re-add","reattach","re-attach","add vm back"]],["Where","Storage → Volume Groups → right-click VG → Manage Connections / Update",["storage volume groups","volume groups","manage connections"]],["VM power state","OFF",["off","powered off"]],["Create a new VG?","No",["no","never","do not"]]],
 steps:["Confirm Database_VM is powered off","Storage → Volume Groups → List → right-click the Database_VM VG → Manage Connections","Remove Database_VM from the VG's client list → Save (settings are locked while a client is attached)","Right-click the VG → Update: enable Load Balancing (the multi-node optimization); add Flash Mode only if the task also asks for SSD pinning","Manage Connections again → add Database_VM back → Save","Reopen and verify: load balancing on, VM attached, VM still off"],
 cmds:"acli vg.list\nacli vg.get Database_VM\nacli vm.get Database_VM",
 gotchas:["Powering on the VM","Trying to toggle the setting while the VM is still attached (greyed out); detach, change, re-attach","Forgetting to re-attach the VM afterward","Creating a new VG instead of editing the existing one","Adding disks","Treating Flash Mode as the whole answer when the task says multi-node"],
 flash:"VG → Manage Connections: detach VM → Update: enable Load Balancing → re-attach VM; VM OFF."},
{id:5,name:"Small VM template + SMTP + NCC reports",loc:0,locFull:"Prism Element for the VM, SMTP and NCC email; Prism Central for the template (Compute → VMs → Create VM Template)",
 scen:"ACME standardizes VM sizing on NVD-2031. Build the small profile VM, template it, and make Cluster 1 email alerts and NCC reports.",
 vals:[["VM name","Small VM"],["Template name","Small Template"],["vCPU / memory / disk","2 vCPU / 8 GB / 125 GB",["2/8/125","2 8 125","2 vcpu 8 gb 125 gb","2, 8, 125"]],["Disk container","default",["default container","default storage container"]],["Where templates are made","Prism Central → Compute → VMs → right-click → Create VM Template",["prism central","pc","compute vms create vm template","create vm template"]],["SMTP server","Cluster 2 CVM external IP",["cluster 2 cvm","cluster 2 cvm ip","cluster2 cvm external ip"]],["Cluster sender address","cluster1@ACME.org"],["Alert recipients","primaryalerts@ACME.org, secondaryalerts@ACME.org",["primaryalerts secondaryalerts","primaryalerts@acme.org secondaryalerts@acme.org"]],["Where NCC report email lives","Health → Actions → Set NCC Frequency",["health actions set ncc frequency","set ncc frequency","health → actions"]]],
 steps:["Cluster 1 PE → VM → Create VM: Small VM, 2 vCPU, 8 GB, 125 GB on the default container; do not power on","PC → Compute → VMs → right-click Small VM → Create VM Template → Small Template (PE has no template function)","PE Gear → SMTP Server: Cluster 2 CVM external IP, sender cluster1@ACME.org; send test","PE Gear → Alert Email Configuration: recipients primaryalerts + secondaryalerts","PE Health → Actions → Set NCC Frequency: enable the emailed NCC report to the same recipients"],
 cmds:"",
 gotchas:["Guessing the VM size instead of NVD-2031 (2/8/125)","Powering on Small VM","Looking for Create Template in PE; it lives in PC","Saving SMTP without testing","Forgetting the NCC report email is a separate setting from alert email"],
 flash:"PE Create Small VM (2/8/125) → PC Create VM Template Small Template → PE SMTP + Alert Email + Set NCC Frequency."},
{id:6,name:"DR remote site + protection domain",loc:0,locFull:"Prism Element → Data Protection, on Cluster 1 and then Cluster 2",
 scen:"Cluster 1 is production, Cluster 2 is DR. Web-Prod, App-Prod and DB-Prod must recover on Cluster 2 as one consistent unit and fail back afterward. Every object name must include Task17.",
 vals:[["Required string in object names","Task17"],["Replication network","172.30.0.x DR addresses",["172.30.0.x","172.30.0","dr ip","dr addresses"]],["Remote site type","Physical Cluster",["physical","physical cluster"]],["Bandwidth limit","10 MB/sec",["10 mb/s","10mb/sec","10 mbps","10 mb"]],["Local / remote retention","2 days / 2 days",["2/2","2 days","2 and 2","2 days 2 days"]],["How many protection domains","One, with all three VMs",["1","one","one pd"]],["PD type","Async DR",["async","async dr"]],["Failback setting","Remote site configured on both clusters (reverse replication)",["reverse replication","both clusters","on each cluster"]],["Fix if PE throws DR errors","Restart cerebro",["allssh genesis stop cerebro; cluster start","cerebro restart","restart cerebro service"]]],
 steps:["Cluster 1 PE → Data Protection → Table → + Remote Site → Physical Cluster","Name with Task17; capability Disaster Recovery; address = Cluster 2 CVM/VIP on the 172.30.0.x DR network","Bandwidth throttling 10 MB/sec (10240 KB/sec if the field is KB); Network Mapping source → destination","Repeat the remote site on Cluster 2 pointing back at Cluster 1 (this is what allows failback)","Cluster 1 → + Protection Domain → Async DR → name with Task17","Protect Selected Entities: Web-Prod, App-Prod, DB-Prod together","New Schedule: tightest RPO allowed (15-min async), retention 2 local / 2 remote, remote site = the Task17 site","Save; verify remote site and PD healthy; if PE errors, restart cerebro"],
 cmds:"allssh genesis stop cerebro\ncluster start",
 gotchas:["Using the external IP instead of the 172.30.0.x DR IP","Creating the remote site on Cluster 1 only (no failback)","One PD per VM instead of one PD for all three","Leaving Task17 out of a name","Leaving bandwidth unlimited","Skipping network mapping","Not restarting cerebro when PE errors"],
 flash:"PE DR: Task17 remote site on both clusters (Physical, DR IP, 10 MB/sec, network mapping) + one Task17 Async DR PD for Web/App/DB, 2 days local/remote."},
{id:7,name:"Corp_Syslog",loc:0,locFull:"Prism Element (Cluster 1) → Settings → Syslog Server, or ncli rsyslog-config",
 scen:"Security operations collects VM lifecycle events from Cluster 1 on a central syslog server. Forward only those logs.",
 vals:[["Server name","Corp_Syslog"],["IP address","23.236.51.202"],["Protocol / port","TCP / 514",["tcp 514","tcp/514","tcp, 514"]],["Log module (VM lifecycle events)","ACROPOLIS, with Monitor logs included",["acropolis","acropolis monitor"]],["relp-enabled value for plain TCP","false",["relp-enabled=false","no"]],["Which cluster","Cluster 1 only",["cluster 1","cluster1","1"]]],
 steps:["Cluster 1 PE → Settings → Syslog Server (or SSH + ncli rsyslog-config)","New server Corp_Syslog","IP 23.236.51.202","TCP, port 514; RELP off","Module ACROPOLIS only (the service that creates/changes/deletes VMs); level INFO so change events are included","Tick Include Monitor logs for that module; no other modules","Save and verify"],
 cmds:"ncli rsyslog-config add-server name=Corp_Syslog ip-address=23.236.51.202 port=514 network-protocol=tcp relp-enabled=false\nncli rsyslog-config add-module server-name=Corp_Syslog module-name=ACROPOLIS level=INFO include-monitor-logs=true\nncli rsyslog-config set-status enable=true\nncli rsyslog-config ls-servers\nncli rsyslog-config ls-modules server-name=Corp_Syslog",
 gotchas:["UDP instead of TCP","Port 6514 instead of 514","relp-enabled=true (that is RELP, not plain TCP)","Level ERROR when the task wants change events (INFO)","Selecting every module (there is no AOS module in this build; VM events are ACROPOLIS)","Configuring Cluster 2 as well","Forgetting Include Monitor logs"],
 flash:"PE → Settings → Syslog; Corp_Syslog 23.236.51.202 TCP/514 relp off; module ACROPOLIS INFO + monitor logs; Cluster 1 only."},
{id:8,name:"Repair Security Policy.txt",loc:3,locFull:"Desktop text editor (Notepad / Notepad++)",
 scen:"A Flow policy export on the Desktop has values masked with xxxx placeholders. Restore it to the intended policies without changing structure, and keep the file name.",
 vals:[["File","Security Policy.txt"],["Quarantine: hitlog / action / environment","false / APPLY / SecOps",["false apply secops","false, apply, secops"]],["SMB block: hitlog / action / tags","True / MONITOR / smbhost + smbclient",["true monitor smbhost smbclient","true, monitor, smbhost, smbclient"]],["dn-policy1: ipv6 / action / protocol / hitlog","True / MONITOR / ALL / True",["true monitor all true","true, monitor, all, true"]],["Only policy in APPLY mode","Quarantine"],["May you add or delete lines?","No",["no","never"]]],
 steps:["Open Desktop\\Security Policy.txt","Quarantine: is_policy_hitlog_enabled=false, action=APPLY, Environment=SecOps","SMB-block: hitlog=True, action=MONITOR, SMBv1 values smbhost then smbclient","dn-policy1: allow_ipv6_traffic=True, action=MONITOR, protocol=ALL, hitlog=True","Leave any placeholder the task says not to replace","Save with the same file name"],
 cmds:"Quarantine: is_policy_hitlog_enabled=false; action=APPLY; Environment=SecOps\nSMB:        is_policy_hitlog_enabled=True;  action=MONITOR; SMBv1=smbhost, smbclient\nDN:         allow_ipv6_traffic=True; action=MONITOR; protocol=ALL; is_policy_hitlog_enabled=True",
 gotchas:["Changing the JSON structure","APPLY on a non-quarantine policy","TCP instead of ALL for the DN policy","Logging quarantine when it is the one exception","Renaming the file"],
 flash:"Edit Security Policy.txt only; Quarantine false/APPLY/SecOps; SMB True/MONITOR/smbhost/smbclient; DN True/MONITOR/ALL/True."},
{id:9,name:"SCMA security hardening (Cluster 2)",loc:2,locFull:"SSH to Cluster 2 CVM (ncli) + Prism Element Cluster 2 → Gear → Cluster Lockdown",
 scen:"An audit found Cluster 2 on default security settings. Capture the current config first, enable AIDE weekly, high-strength passwords, change the AHV root password, and require SSH keys for CVM login. No reboots.",
 vals:[["Output file captured BEFORE changes","task 10.txt"],["Commands that capture current config","ncli cluster get-cvm-security-config and get-hypervisor-security-config",["get-cvm-security-config","get-hypervisor-security-config","get-cvm-security-config get-hypervisor-security-config"]],["AIDE schedule","weekly"],["AHV host IP (from the CVM)","172.30.0.2"],["Root password must match","admin user's password",["admin","admin password","the admin password"]],["Public key location","Desktop\\Files\\SSH",["desktop/files/ssh","files\\ssh","desktop files ssh"]],["Key type to import","public key (.pub)",["public","pub",".pub"]],["Where SSH keys are managed in PE","Gear → Cluster Lockdown",["cluster lockdown","gear cluster lockdown"]],["After importing the key","Uncheck Enable Remote Login with Password",["disable password login","disable password ssh","uncheck remote login with password"]]],
 steps:["SSH to a Cluster 2 CVM as nutanix","ncli cluster get-cvm-security-config and get-hypervisor-security-config → paste both outputs to Desktop\\task 10.txt BEFORE any change","edit-cvm-security-params and edit-hypervisor-security-params: enable-aide=true, schedule=weekly","edit-cvm-security-params and edit-hypervisor-security-params: enable-high-strength-password=true","ssh root@172.30.0.2 → passwd → set to the admin password (last of the CLI steps)","PE Cluster 2 → Gear → Cluster Lockdown → New Public Key → paste the contents of the .pub file from Desktop\\Files\\SSH → Save","Uncheck Enable Remote Login with Password → Save; validate; do not reboot"],
 cmds:"ncli cluster get-cvm-security-config\nncli cluster get-hypervisor-security-config\nncli cluster edit-cvm-security-params enable-aide=true\nncli cluster edit-cvm-security-params schedule=weekly\nncli cluster edit-cvm-security-params enable-high-strength-password=true\nncli cluster edit-hypervisor-security-params enable-aide=true\nncli cluster edit-hypervisor-security-params schedule=weekly\nncli cluster edit-hypervisor-security-params enable-high-strength-password=true\nssh root@172.30.0.2\npasswd",
 gotchas:["Exporting task 10.txt after the changes","Changing the AHV root password before the ncli security commands (do all ncli work first, root password last)","Doing only the hypervisor side when the task says hypervisor and CVMs","Using 192.168.x.x instead of 172.30.0.2","Importing the private key instead of the public .pub key","Unchecking password login before the key is imported (lockout)","Rebooting anything"],
 flash:"Cluster 2: get-*-security-config to task 10.txt first; AIDE weekly + high-strength on cvm and hypervisor; root passwd; Cluster Lockdown: add .pub, uncheck password login."},
{id:10,name:"sql3532 per KB-3532",loc:0,locFull:"Prism Element (Cluster 1) → VM → Update",
 scen:"sql3532 was migrated from another platform and doesn't match the SQL Server standard. Reconfigure it: sizing, split SCSI disks, SSD preference, first to power on after node failure. Stays off.",
 vals:[["vCPU / memory","12 vCPU / 128 GB",["12/128","12 128","12 vcpu 128 gb"]],["OS / Data / Logs / TempDB disk sizes","100 / 80 / 100 / 50 GB",["100 80 100 50","100/80/100/50","100, 80, 100, 50"]],["Disk bus","SCSI"],["Volume group?","None",["no","none","no vg"]],["Network adapter?","None",["no","none","no nic"]],["Keep on SSD via","Flash Mode",["flash mode","flash"]],["Power-on priority setting in PE 6.10","Agent VM",["agent vm","agent","high / agent vm"]],["If a dedicated SQL container is required","compression on (0 delay), dedup off, erasure coding off",["compression on dedup off ec off","inline compression no dedup no ec","compression on, dedup off, erasure coding off"]]],
 steps:["Cluster 1 PE → VM → Table → sql3532 → Update","12 vCPU, 128 GB; stay on the default container unless the task asks for a SQL container (then Storage → Containers: compression on with 0 delay, dedup off, erasure coding off)","Four SCSI disks in this order (AHV disks have no names; order is the label): scsi.0 OS 100, scsi.1 DATA 80, scsi.2 LOGS 100, scsi.3 TEMPDB 50","No volume group, no NIC","SSD preference = Update VM → Flash Mode checkbox","Agent VM option so it powers on before other VMs","Save; confirm still powered off"],
 cmds:"acli vm.get sql3532   # optional validation",
 gotchas:["Powering on the VM","Creating a volume group","Adding a NIC","One big disk instead of the split layout","Forgetting Flash Mode","SATA/IDE instead of SCSI","Enabling dedup or erasure coding on a SQL container"],
 flash:"PE sql3532: 12 CPU/128 GB, OS 100, DATA 80, LOGS 100, TEMPDB 50, SCSI, Flash Mode, Agent VM, no VG/NIC, OFF."},
{id:11,name:"Immediate rebuild after planned reboot",loc:2,locFull:"SSH to a Cluster 1 CVM (ncli)",
 scen:"ACME does rolling host and CVM reboots in maintenance windows. Cluster 1 must start rebuilding resiliency immediately when a node goes down. Command line only. No reboots.",
 vals:[["Full command","ncli cluster set-resiliency-preference desired-resiliency-preference=immediate",["ncli cluster set-resiliency-preference desired-resiliency-preference=immediate"]],["Verify with","ncli cluster get-resiliency-status",["get-resiliency-status","ncli cluster get-resiliency-preference","get-resiliency-preference"]],["Spaces around the = sign?","No",["no","none"]]],
 steps:["SSH to any Cluster 1 CVM (if you blank: type ncli cluster and press Tab twice to list subcommands)","ncli cluster set-resiliency-preference desired-resiliency-preference=immediate","ncli cluster get-resiliency-status to verify","Do not reboot hosts or CVMs"],
 cmds:"ncli cluster set-resiliency-preference desired-resiliency-preference=immediate\nncli cluster get-resiliency-status\nncli cluster get-resiliency-preference   # if available",
 gotchas:["Spaces around =","Quoting immediate if the command rejects it","Using the older rebuild-reservation command","Not verifying"],
 flash:"SSH → ncli cluster set-resiliency-preference desired-resiliency-preference=immediate."},
{id:12,name:"API JSON repair + Test_Deploy VM",loc:4,locFull:"Prism Central → username menu (top right) → REST API Explorer; UUIDs from the API or from a CVM",
 scen:"A colleague's API request file on the Desktop has errors and placeholders. Fix it, save under the same name, and create the VM through the v3 REST API. VM must stay off.",
 vals:[["File","API_Create_VM.txt"],["Where REST API Explorer is","Click your username, top right of PC",["username top right","user menu","top right"]],["Endpoint","POST /api/nutanix/v3/vms",["post /vms","/api/nutanix/v3/vms","v3/vms","post v3/vms"]],["Cluster UUID from the CLI","ncli cluster info | grep -i uuid",["ncli cluster info","cluster info grep uuid"]],["Subnet UUID from the CLI","acli net.list",["net.list","acli net.list"]],["Find cluster UUID with (API)","POST /clusters/list {\"kind\":\"cluster\"}",["clusters/list","post /clusters/list","/api/nutanix/v3/clusters/list"]],["num_sockets / memory_size_mib / disk_size_mib","2 / 8192 / 51200",["2 8192 51200","2, 8192, 51200"]],["disable_branding","true"],["metadata.kind","vm"],["Success HTTP status","202",["202 accepted","accepted"]],["Subnet name","default-net"]],
 steps:["Get the UUIDs: SSH to a CVM → ncli cluster info | grep -i uuid, acli net.list (or POST /clusters/list and /subnets/list in the API Explorer)","Open Desktop\\API_Create_VM.txt; fix num_sockets=2, memory 8192, disk 51200, disable_branding=true, metadata {\"kind\":\"vm\"}, UUIDs in quotes","Save with the same file name","PC → click your username (top right) → REST API Explorer → vms → POST /vms → Try it out","Paste the fixed JSON → Execute; confirm 202 Accepted","Verify Test_Deploy exists on Cluster 1, on default-net, powered off"],
 cmds:"ncli cluster info | grep -i uuid        # cluster UUID\nacli net.list                           # subnet UUID\nacli image.list                         # image UUID if the JSON needs one\n\nPOST /api/nutanix/v3/clusters/list   body: {\"kind\":\"cluster\"}\nPOST /api/nutanix/v3/subnets/list    body: {\"kind\":\"subnet\"}\nPOST /api/nutanix/v3/vms             body: fixed API_Create_VM.txt\n\n\"num_sockets\": 2\n\"memory_size_mib\": 8192\n\"disk_size_mib\": 51200\n\"disable_branding\": true\n\"metadata\": {\"kind\": \"vm\"}\n\"uuid\": \"<Cluster-UUID>\" / \"<Subnet-UUID>\"",
 gotchas:["Hunting for Postman; the lab has the REST API Explorer under your username","Missing quotes around UUIDs","metadata.kind left blank","Using names where UUIDs are required","Powering on the VM","Saving under a different file name","Wrong endpoint"],
 flash:"UUIDs via ncli cluster info / acli net.list; fix API_Create_VM.txt; username → REST API Explorer → POST /vms → 202; Test_Deploy OFF."},
{id:13,name:"NEWSQL write-intensive VM",loc:0,locFull:"Prism Element (Cluster 1) → VM → Create VM, then Storage → Volume Groups for the data disk",
 scen:"New write-heavy MS-SQL workload on Cluster 1. Create the VM for maximum production storage performance; every object name includes NEWSQL. No network, stays off, do not touch Storage Policies.",
 vals:[["Required string in name","NEWSQL"],["vCPU / memory","12 vCPU / 128 GB",["12/128","12 128","12 vcpu 128 gb"]],["OS disk / data disk","100 GB / 750 GB",["100/750","100 750","100 and 750"]],["Disk bus","SCSI"],["How to avoid I/O pinned to one node","Data disk as a volume group with load balancing enabled",["volume group","vg with load balancing","load balanced volume group","volume group load balancing"]],["Why the UI capped the disk at ~239 GB","The container was out of free space; pick a container with room",["container free space","out of space","different container"]],["Network adapter?","None",["no","none","no nic"]],["Performance option","Flash Mode",["flash mode","flash"]],["Use Storage Policies?","No",["no","do not","never"]]],
 steps:["Cluster 1 PE → VM → Create VM: name with NEWSQL (e.g. NEWSQL_VM), 12 vCPU, 128 GB","OS disk 100 GB SCSI on a container with free space","Storage → Volume Groups → + Volume Group: NEWSQL_VG, add a 750 GB disk on a container with room (the ~239 GB cap is the default container's free space)","On the VG: enable Load Balancing (spreads I/O across nodes) and Flash Mode","Attach the VG to NEWSQL_VM (Manage Connections / add client)","No NIC; do not power on; save and validate; leave Storage Policies alone"],
 cmds:"acli vm.get NEWSQL_VM   # optional validation\nacli vg.get NEWSQL_VG",
 gotchas:["Forgetting NEWSQL in the name of the VM or the VG","Fighting the 239 GB cap on the default container instead of choosing a container with space","Adding a NIC","Powering on the VM","SATA/IDE instead of SCSI","Creating only one disk","Opening Storage Policies despite the instruction"],
 flash:"PE: NEWSQL_VM 12/128, 100 GB OS; NEWSQL_VG 750 GB on a container with room, load balancing + Flash Mode, attached; no NIC, OFF."},
{id:14,name:"IaaS capacity plan (3 waves)",loc:1,locFull:"Prism Central → Operations → Planning → Scenarios (Nutanix Sizer at sizer.nutanix.com is the fallback)",
 scen:"A new customer wants a cluster for general IaaS. Size it for 12 months with two-host-failure tolerance on HPE DX365-10-G11-NVMe full flash, three VM waves, and export the PDF.",
 vals:[["Where the planning tool is","PC → Operations → Planning → Scenarios",["operations planning","planning","pc planning scenarios","operations → planning"]],["Scenario name","IaaS"],["Target","New cluster",["new","new cluster / new environment","new environment"]],["Hardware","HPE DX365-10-G11-NVMe",["dx365-10-g11-nvme","hpe dx365","dx365"]],["Resiliency","RF3 / 2 host failures",["rf3","2 host failures","rf3 2 failures","2 failures"]],["Runway","12 months",["12","12mo","1 year"]],["Per-VM profile","4 vCPU / 16 GB / 200 GB",["4/16/200","4 16 200","4 vcpu 16 gb 200 gb"]],["Waves","100 now, 50 at 3 months, 20 at 6 months",["100/50/20","100 50 20","100, 50, 20"]],["Export file","IaaS-requirement.pdf"]],
 steps:["PC → Operations → Planning → Scenarios → + New Scenario, named IaaS","Target: New Cluster (not an existing one)","Hardware: vendor HPE, model DX365-10-G11-NVMe, full flash; leave the model's CPU/RAM/drives alone","Resiliency RF3 / 2 host failures; period 12 months","Workload: VMs at 4 vCPU / 16 GB / 200 GB; add 100 starting now, 50 starting in 3 months, 20 starting in 6 months","Recommend; take the smallest node count that satisfies it; save","Generate the PDF report → save as Desktop\\IaaS-requirement.pdf","Fallback only if Planning is missing: sizer.nutanix.com directly (my.nutanix.com is blocked)"],
 cmds:"",
 gotchas:["Hunting for Sizer when PC Planning does the whole task","Using an existing cluster","RF2","Changing the hardware profile","Forgetting a wave","Wrong export filename","Not exporting the PDF at all"],
 flash:"PC → Operations → Planning: scenario IaaS, new cluster, HPE DX365-10-G11-NVMe, RF3, 12 months, 100/50/20 waves, PDF IaaS-requirement.pdf."},
{id:15,name:"SQL_Batch_Saturday report",loc:1,locFull:"Prism Central → Operations → Reports",
 scen:"The DBA team runs batch jobs on the SQL servers every Saturday and wants a weekly report showing whether the cluster or the VMs were the bottleneck. Generate one now and save the CSV ZIP to the Desktop.",
 vals:[["Report name","SQL_Batch_Saturday"],["Cluster scope","Cluster 1 only",["cluster 1","cluster1"]],["Cluster metric + aggregation","CPU used % , Maximum",["max cpu","cpu usage maximum","maximum cpu used","cpu used maximum"]],["VM filter type","Name starts with SQL (prefix)",["prefix","starts with","starts with sql","prefix sql"]],["VM metrics","Max I/O read latency; max CPU ready",["read latency cpu ready","io read latency and cpu ready","max read latency max cpu ready"]],["Schedule","Sunday 12:00 AM",["sunday 12am","sundays 12:00 am","sunday midnight","weekly sunday 12:00 am"]],["Time range","Previous 7 days",["7 days","last 7 days","previous 7"]],["Recipient","dbateam@ACME.org"],["Export","CSV → ZIP on Desktop",["csv zip","csv","zip to desktop"]]],
 steps:["PC → Operations → Reports → new report SQL_Batch_Saturday","Cluster-level view for Cluster 1 only","Cluster metric: CPU Used %, aggregation Maximum","VM-level view; filter name prefix (starts with) SQL","VM metrics: I/O read latency (Maximum) and CPU Ready (Maximum)","Schedule weekly Sunday 12:00 AM, time range previous 7 days","Recipient dbateam@ACME.org; save","Generate an instance, export CSV, save the ZIP to Desktop"],
 cmds:"",
 gotchas:["All clusters instead of Cluster 1","Filter 'contains SQL' instead of prefix/starts-with","Average instead of Maximum","CPU Usage instead of CPU Ready for the VM metric","Wrong time range","Never generating and exporting the ZIP"],
 flash:"PC Reports: SQL_Batch_Saturday, Cluster 1 max CPU, SQL* VMs max read latency + max CPU ready, Sunday 12AM previous 7 days, email DBA, CSV ZIP to Desktop."},
{id:16,name:"NCC suppression + Pulse alert tuning",loc:2,locFull:"SSH to Cluster 1 CVM (ncc) + Prism Element → Health → Checks (search \"pulse\")",
 scen:"Protection domain NoVMs intentionally has a schedule but no entities and must not be deleted. NCC keeps warning about it, and a 'Pulse is not enabled' alert is active. Quiet both without disabling Pulse or any other check.",
 vals:[["NCC check to disable","backup_schedule_check"],["NCC path","health_checks data_protection_checks protection_domain_checks backup_schedule_check",["data_protection_checks protection_domain_checks backup_schedule_check","health_checks data_protection_checks protection_domain_checks"]],["Delete NoVMs PD?","No",["no","never","do not"]],["Where the Pulse check lives in PE","Health → Checks → search pulse → Pulse enablement check",["health checks pulse","pulse enablement check","health → checks"]],["Pulse alert: messages / alert","Messages recorded, alert disabled",["messages on alert off","record messages no alert","messages yes alert no"]],["Last step","Resolve the active Pulse alert",["resolve alert","resolve the alert","resolve"]]],
 steps:["SSH to a Cluster 1 CVM","Run ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check to confirm it is the one","Disable only that check","PE Cluster 1 → Health → Checks → search pulse → open the Pulse enablement check","Turn its alert off while leaving messages/logging on (do not disable Pulse itself)","Alerts → resolve the existing Pulse alert","Validate: no backup_schedule_check warning, Pulse alert resolved"],
 cmds:"ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check\nncc health_checks data_protection_checks protection_domain_checks backup_schedule_check --disable   # syntax varies; ncc --help\nncc health_checks list_disabled",
 gotchas:["Deleting the NoVMs protection domain","Disabling Pulse itself","Suppressing all NCC checks","Turning off logging/messages","Not resolving the active alert"],
 flash:"Cluster 1: suppress backup_schedule_check only; Health → Checks → pulse enablement check: messages yes, alert no; resolve existing alert."},
{id:17,name:"Inode threshold tuning",loc:0,locFull:"Prism Element (Cluster 1) → Health → Checks (search \"inode\")",
 scen:"After a CVM ran out of inodes, ACME wants earlier warning on Cluster 1 and the condition to stay visible until an admin clears it. Change only the inode check.",
 vals:[["How to find the check","Health → Checks → search inode",["health checks inode","search inode","health → checks"]],["Warning threshold","45%",["45"]],["Critical threshold","60%",["60"]],["Check interval","every 1 minute",["1 minute","1 min","every minute","1"]],["Auto-resolve","disabled",["off","no","disable"]],["Disable the check instead of tuning?","No",["no","never"]]],
 steps:["Cluster 1 PE → Health → Checks","Search inode; open the CVM inode usage check","Edit its parameters","Warning 45%, critical 60%","Frequency every 1 minute","Turn off auto-resolve","Save, reopen, verify"],
 cmds:"",
 gotchas:["Disabling the check instead of tuning it","Warning higher than critical","Leaving the default schedule","Leaving auto-resolve on","Changing unrelated NCC checks"],
 flash:"PE Health → Checks → inode: warning 45%, critical 60%, every minute, no auto-resolve."},
];

// CLI sessions per task. c = canonical; req = tokens that must appear (order-free) when flags can vary; <X> in c matches any token; k = tokens blanked in Command fill.
const CLI={
1:{sh:"cvm",cmds:[
 {c:"acli vm.get SQL01",p:"Inspect SQL01 disk bus and power state",o:"SQL01 {\n  config { ... disk_list { addr { bus: \"scsi\" index: 0 } ... } }\n  state: \"kOff\"\n}",k:["vm.get"]},
 {c:"acli vm.get SQL02",p:"Inspect SQL02; find the slow disk bus",o:"SQL02 {\n  config { ... disk_list { addr { bus: \"sata\" index: 0 } vmdisk_uuid: \"3f9c…a1\" } }\n  state: \"kOff\"\n}",k:["vm.get"]},
 {c:"acli vm.disk_create SQL02 clone_from_vmdisk=<UUID> bus=scsi",p:"Clone the SATA disk as a SCSI disk",o:"DiskCreate: complete",k:["disk_create","clone_from_vmdisk","bus=scsi"]},
 {c:"acli vm.disk_delete SQL02 disk_addr=sata.0",alt:["acli vm.disk_delete SQL02 disk_addr=ide.0"],p:"Remove the old SATA/IDE disk",o:"Delete disk sata.0? (yes/no) yes\nDiskDelete: complete",k:["disk_delete","disk_addr=sata.0"]}]},
2:{sh:"cvm",cmds:[
 {c:"cat > prism_element_acme.cnf <<'EOF'",req:["prism_element_acme.cnf"],start:/^(cat\s*>|vi|vim|nano)\s/,p:"Create the OpenSSL config ([req], [req_distinguished_name], [v3_req], [alt_names])",o:"(heredoc written: CN=prism_element.ACME.org, DNS.1-3 = cvm1-3.ACME.org, default_bits 2048)",k:["prism_element_acme.cnf"]},
 {c:"openssl req -new -nodes -out prism_element_acme.csr -keyout prism_element_acme.key -config prism_element_acme.cnf -sha256",req:["openssl","req","-new","-nodes","-out","prism_element_acme.csr","-config","prism_element_acme.cnf","-sha256"],p:"Generate the CSR, RSA 2048 / SHA-256",o:"Generating a RSA private key\n.............+++++\nwriting new private key to 'prism_element_acme.key'\n-----",k:["-new","-nodes","-config","-sha256"]},
 {c:"openssl req -text -noout -verify -in prism_element_acme.csr",req:["openssl","req","-verify","-in","prism_element_acme.csr"],p:"Verify the CSR and confirm SANs",o:"verify OK\nCertificate Request:\n    Subject: C=US, ST=North Carolina, L=Durham, O=ACME, OU=Infrastructure, CN=prism_element.ACME.org\n    X509v3 Subject Alternative Name:\n        DNS:cvm1.ACME.org, DNS:cvm2.ACME.org, DNS:cvm3.ACME.org",k:["-text","-noout","-verify"]}]},
6:{sh:"cvm",cmds:[
 {c:"allssh genesis stop cerebro",p:"Stop cerebro on every CVM when PE DR config errors out",o:"================== 10.x.x.11 =================\n2026-10-23 … INFO Stopping cerebro (pids [4412])\n================== 10.x.x.12 =================\n… Stopping cerebro",k:["allssh","genesis stop","cerebro"]},
 {c:"cluster start",p:"Restart stopped services",o:"… INFO cluster:2943 Success!",k:["cluster start"]}]},
9:{sh:"cvm2",cmds:[
 {c:"ncli cluster get-cvm-security-config",p:"Capture current CVM SCMA config BEFORE changes → Desktop\\task 10.txt",o:"    Enable Aide : false\n    Enable Core : false\n    Enable High Strength P... : false\n    Enable Banner : false\n    Schedule : DAILY",k:["get-cvm-security-config"]},
 {c:"ncli cluster get-hypervisor-security-config",p:"Capture current hypervisor SCMA config → same file",o:"    Enable Aide : false\n    Enable Core : false\n    Enable High Strength P... : false\n    Schedule : DAILY",k:["get-hypervisor-security-config"]},
 {c:"ncli cluster edit-cvm-security-params enable-aide=true",p:"Enable AIDE on the CVMs",o:"    Enable Aide : true",k:["edit-cvm-security-params","enable-aide=true"]},
 {c:"ncli cluster edit-cvm-security-params schedule=weekly",p:"CVM AIDE schedule weekly",o:"    Schedule : WEEKLY",k:["schedule=weekly"]},
 {c:"ncli cluster edit-cvm-security-params enable-high-strength-password=true",p:"High-strength passwords on the CVMs",o:"    Enable High Strength P... : true",k:["enable-high-strength-password=true"]},
 {c:"ncli cluster edit-hypervisor-security-params enable-aide=true",p:"Enable AIDE on the hypervisor",o:"    Enable Aide : true",k:["edit-hypervisor-security-params","enable-aide=true"]},
 {c:"ncli cluster edit-hypervisor-security-params schedule=weekly",p:"Hypervisor AIDE schedule weekly",o:"    Schedule : WEEKLY",k:["schedule=weekly"]},
 {c:"ncli cluster edit-hypervisor-security-params enable-high-strength-password=true",p:"High-strength passwords on the hypervisor",o:"    Enable High Strength P... : true",k:["enable-high-strength-password=true"]},
 {c:"ssh root@172.30.0.2",p:"Hop to the AHV host from the CVM (after all ncli work)",o:"root@172.30.0.2's password: ********\n[root@AHV-2 ~]#",k:["root@172.30.0.2"]},
 {c:"passwd",p:"Set AHV root password to match admin",o:"Changing password for user root.\nNew password: ********\nRetype new password: ********\npasswd: all authentication tokens updated successfully.",k:["passwd"]}]},
7:{sh:"cvm",cmds:[
 {c:"ncli rsyslog-config add-server name=Corp_Syslog ip-address=23.236.51.202 port=514 network-protocol=tcp relp-enabled=false",p:"Create the Corp_Syslog server: TCP 514, RELP off",o:"    Name                      : Corp_Syslog\n    IP Address                : 23.236.51.202\n    Port                      : 514\n    Protocol                  : TCP\n    RELP                      : false",k:["add-server","relp-enabled=false"]},
 {c:"ncli rsyslog-config add-module server-name=Corp_Syslog module-name=ACROPOLIS level=INFO include-monitor-logs=true",p:"Forward only the ACROPOLIS module at INFO, with monitor logs",o:"    Server Name               : Corp_Syslog\n    Module                    : ACROPOLIS\n    Level                     : INFO\n    Include Monitor Logs      : true",k:["add-module","module-name=ACROPOLIS"]},
 {c:"ncli rsyslog-config set-status enable=true",p:"Turn syslog forwarding on",o:"    Status                    : true",k:["set-status","enable=true"]}]},
11:{sh:"cvm",cmds:[
 {c:"ncli cluster set-resiliency-preference desired-resiliency-preference=immediate",p:"Rebuild immediately after a node goes down",o:"    Desired Resiliency Preference : immediate",k:["set-resiliency-preference","desired-resiliency-preference=immediate"]},
 {c:"ncli cluster get-resiliency-status",alt:["ncli cluster get-resiliency-preference"],p:"Verify",o:"    Desired Resiliency Preference : immediate\n    Current Resiliency Status : ok",k:["get-resiliency-status"]}]},
12:{sh:"api",cmds:[
 {c:"POST /api/nutanix/v3/clusters/list {\"kind\":\"cluster\"}",req:["post","clusters/list"],alt:["ncli cluster info | grep -i uuid"],p:"Find Cluster 1 UUID (API list call, or ncli cluster info | grep -i uuid on a CVM)",o:"200 OK\n{ \"entities\": [ { \"metadata\": { \"kind\": \"cluster\", \"uuid\": \"0005f1a2-…-c1\" }, \"spec\": { \"name\": \"Cluster1\" } } ] }",k:["clusters/list","\"kind\":\"cluster\""]},
 {c:"POST /api/nutanix/v3/subnets/list {\"kind\":\"subnet\"}",req:["post","subnets/list"],alt:["acli net.list"],p:"Find default-net UUID (API list call, or acli net.list on a CVM)",o:"200 OK\n{ \"entities\": [ { \"metadata\": { \"kind\": \"subnet\", \"uuid\": \"6b0e…-net\" }, \"spec\": { \"name\": \"default-net\" } } ] }",k:["subnets/list","\"kind\":\"subnet\""]},
 {c:"POST /api/nutanix/v3/vms",req:["post","/vms"],p:"Create Test_Deploy from the fixed API_Create_VM.txt (username → REST API Explorer → vms → POST → Try it out)",o:"202 Accepted\n{ \"status\": { \"state\": \"PENDING\", \"execution_context\": { \"task_uuid\": \"9d1c…\" } }, \"spec\": { \"name\": \"Test_Deploy\", \"resources\": { \"num_sockets\": 2, \"memory_size_mib\": 8192, \"power_state\": \"OFF\" } } }",k:["/api/nutanix/v3/vms"]}]},
16:{sh:"cvm",cmds:[
 {c:"ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check",req:["ncc","health_checks","backup_schedule_check"],p:"Run / locate the single check",o:"Running : health_checks data_protection_checks protection_domain_checks backup_schedule_check\n[ WARN ] Protection domain NoVMs has a schedule but no entities",k:["data_protection_checks","protection_domain_checks","backup_schedule_check"]},
 {c:"ncc health_checks data_protection_checks protection_domain_checks backup_schedule_check --disable",req:["ncc","health_checks","backup_schedule_check","--disable"],p:"Disable only that check (syntax varies; ncc --help)",o:"Check backup_schedule_check disabled.",k:["--disable"]},
 {c:"ncc health_checks list_disabled",p:"Confirm only that check is off",o:"Disabled checks:\n  backup_schedule_check",k:["list_disabled"]}]}
};
// Exam numbering. The field guide's order was wrong where the lab's own file names prove it: Task 1.txt (SQL analysis), task 10.txt (SCMA), Task 13.txt (CSR), Task17 (DR). Displaced tasks take the freed slots.
const RENUM={2:13,13:2,9:10,10:9,6:17,17:6};
T.forEach(t=>{t.id=RENUM[t.id]||t.id});T.sort((a,b)=>a.id-b.id);
function remapKeys(o){const r={};Object.keys(o).forEach(k=>{r[RENUM[k]||k]=o[k]});return r}
const CLI_=remapKeys(CLI);Object.keys(CLI).forEach(k=>delete CLI[k]);Object.assign(CLI,CLI_);
const CLI_TASKS=Object.keys(CLI).map(Number);

// Plain-English lesson per task, for teaching someone who has never used Nutanix.
const KID={
1:{why:"Two database servers were built from the same template, but one is slow. The company wants proof of the difference and the slow one fixed, and both servers have to stay switched off the whole time.",do:"You open the management console that sees every cluster (Prism Central), graph the two servers side by side on three storage charts (IOPS, latency, bandwidth), save the graph with an exact name, copy it into a text file, and schedule it to email a team every morning. Then you look at how the slow server's virtual hard drive is plugged in. It's on an old-style connector (like USB 1 vs USB 3). You clone the drive onto the fast connector and remove the old one.",listen:["Prism Central, not Prism Element, for the analysis and the report","Three charts: IOPS, I/O latency, I/O bandwidth","Session and report both named Compare SQL01 and SQL02","Daily at 10:00 AM to perf_group@ACME.org, retention off","File is Task 1.txt with the space","SQL02's disk is IDE/SATA; clone it as SCSI (Clone from ADSF File) and remove the old one","Neither VM gets powered on"]},
2:{why:"Websites and admin consoles prove who they are with certificates. To get one, you first write a request that lists every name the certificate should cover. The security team wants that request file.",do:"You write a small config file naming the main address plus three extra names (the SANs), runs a command-line tool called openssl to turn it into a request, verifies it, and saves the config, the request, and a log of what he typed onto the Desktop with exact file names.",listen:["Common name prism_element.ACME.org","Three SANs: cvm1, cvm2, cvm3 .ACME.org","RSA 2048 and SHA-256, not SHA1","Files: prism_element_acme.cnf, prism_element_acme.csr, Task 13.txt","Verify the CSR and show the SANs in the output"]},
3:{why:"The company wants admins to turn on encryption for a server just by putting a label on it, instead of configuring each one by hand.",do:"In Prism Central You create a label (category) called VM-Storage with two possible values, then a rule (storage policy) that says: anything labeled softwareencrypted gets its storage encrypted.",listen:["Done in Prism Central under Govern","Category VM-Storage with two values: softwareencrypted and SEDencrypted","Policy named Encrypted-Storage","Policy matches softwareencrypted, not SEDencrypted"]},
4:{why:"A database server has a shared storage volume attached. On a cluster of several machines, that volume's traffic can all land on one machine; the company wants it spread across them. Nothing may be added or removed, and the server stays off.",do:"The setting that spreads the load can't be changed while the server is attached to the volume. So you detach the server from the volume group, turn on load balancing, and attach it again. Flash Mode (pin to SSD) is a different setting and only belongs here if the task mentions SSDs.",listen:["Storage → Volume Groups → Manage Connections","Detach the VM first; the setting is locked while attached","Enable Load Balancing","Re-attach the VM afterward","Don't create a new VG, don't add disks, VM stays off"]},
5:{why:"The company has a standard 'small server' size from a Nutanix design document and wants a reusable template of it. The cluster also needs to be able to send email alerts and health reports.",do:"You build a VM with exactly 2 CPUs, 8 GB memory and a 125 GB disk in Prism Element and leave it off. Templates are a Prism Central feature, so you switch consoles to turn it into a template. Then back in Prism Element you point the cluster at a mail server, add two alert mailboxes, and switch on the emailed health report.",listen:["Small VM: 2 vCPU, 8 GB, 125 GB on the default container, powered off","Template is made in Prism Central (Compute → VMs → Create VM Template), named Small Template","SMTP server is a Cluster 2 CVM external IP, sender cluster1@ACME.org","Alert recipients primaryalerts and secondaryalerts","NCC report email: Health → Actions → Set NCC Frequency"]},
6:{why:"If the main datacenter dies, a three-part app (web, app, database) must come back on a second cluster together, from the same moment in time, and be able to move back later.",do:"You tell each cluster about the other as a remote site over a dedicated replication network, cap the bandwidth so it doesn't flood the link, map the networks, and put all three servers in one protection domain with a snapshot schedule and two days of retention on each side. Everything you name must contain Task17.",listen:["Task17 in every object name","Remote site is Physical Cluster type, on the 172.30.0.x DR address, not the external one","Remote site configured on both clusters (that's the failback)","10 MB/sec bandwidth cap, network mapping set","One Async DR protection domain with all three VMs","2 days local, 2 days remote","If PE errors: restart cerebro"]},
7:{why:"Security wants a record of every time a virtual machine is created, changed or deleted, sent to their central log server. Only those events, only from Cluster 1.",do:"You add a syslog server entry with the server's address, pick TCP on port 514 with RELP off, and attach only the Acropolis module (the service that manages VMs) at INFO level with monitor logs.",listen:["Name Corp_Syslog, IP 23.236.51.202","TCP 514, not UDP, not 6514, RELP off","Module ACROPOLIS only, level INFO, with Monitor logs","Cluster 1 only"]},
8:{why:"A firewall rule export was handed over with some values blanked out as xxxx. The company wants the blanks filled in correctly without changing anything else in the file.",do:"You open the text file and fills in three rules: quarantine is the only one that actually blocks (APPLY) and isn't logged; the other two are watch-only (MONITOR) and logged. He saves it under the same name.",listen:["Quarantine: hitlog false, APPLY, Environment SecOps","SMB: hitlog True, MONITOR, smbhost and smbclient","dn-policy1: IPv6 True, MONITOR, protocol ALL, hitlog True","Only placeholders change; no lines added, removed or renamed file"]},
9:{why:"A security audit found Cluster 2 using default settings. It needs to be hardened, but first the current state must be saved as evidence, and nothing can be rebooted.",do:"You SSH into a controller VM, dump the current security config (CVM and hypervisor) to a file first, then turn on a file-integrity checker (AIDE) weekly and strong passwords on both, change the host's root password last, then in Prism Element's Cluster Lockdown load the public key and uncheck password logins.",listen:["Capture task 10.txt BEFORE any change, with get-cvm-security-config and get-hypervisor-security-config","AIDE enabled weekly on CVMs and hypervisor","High-strength passwords on both","ssh root@172.30.0.2 then passwd, matching admin, as the last CLI step","Gear → Cluster Lockdown: paste the .pub key, then uncheck Enable Remote Login with Password","No reboot"]},
10:{why:"A SQL server moved from another platform doesn't follow the company's SQL standard. Fix it to match the internal KB article. It stays off.",do:"You resize it to 12 CPUs / 128 GB, gives it four separate SCSI disks (system, data, logs, temp) with sizes worked out from the requirements, turns on Flash Mode, and marks it to start first after a failure. No network card, no volume group.",listen:["12 vCPU, 128 GB","Disks: OS 100, Data 80 (4×20), Logs 100 (80+25%), TempDB 50, all SCSI","Flash Mode on","Agent VM so it powers on first","No VG, no NIC, stays off"]},
11:{why:"When the company reboots machines for maintenance, the cluster normally waits a while before rebuilding lost data copies. They want it to start rebuilding immediately.",do:"One command over SSH on a Cluster 1 controller VM, then a second to verify. No spaces around the equals sign.",listen:["ncli cluster set-resiliency-preference desired-resiliency-preference=immediate","Verify with get-resiliency-status","No reboot, nothing else changed"]},
12:{why:"Someone drafted a request to create a server through the programming interface (API) instead of the console, but left mistakes in it. Fix the request and use it to create the server, switched off.",do:"You grab the cluster's and network's ID numbers from a CVM (ncli cluster info, acli net.list), fix the JSON file (CPU, memory in MiB, disk in MiB, branding off, IDs in quotes), save it, open the REST API Explorer from your username menu in Prism Central, and send it. A 202 reply means it worked.",listen:["UUIDs from ncli cluster info / acli net.list (or the API list calls)","num_sockets 2, memory 8192, disk 51200, disable_branding true, metadata.kind vm","UUIDs in quotes; names don't work","REST API Explorer is under the username menu, top right; POST /vms; expect 202","Test_Deploy exists, powered off; file saved under the same name"]},
13:{why:"A new database server that writes a lot of data needs to be built for speed on Cluster 1, without its storage traffic getting stuck on a single machine. Every object name must include NEWSQL.",do:"You create a VM with 12 CPUs / 128 GB and a 100 GB system disk. The big 750 GB data disk goes into a volume group with load balancing and Flash Mode, on a container that has room, and you attach that to the VM. No network card, left off, and you don't touch Storage Policies.",listen:["NEWSQL in the VM name and the VG name","12 vCPU, 128 GB","OS disk 100 GB SCSI","Data disk 750 GB as a volume group with load balancing + Flash Mode, attached to the VM","Pick a container with free space (that's the ~239 GB cap)","No NIC, powered off, no Storage Policies"]},
14:{why:"A new customer wants to know how many servers to buy. Prism Central has a planning tool that does the math if you describe the workload correctly.",do:"In Prism Central → Operations → Planning you create a scenario named IaaS for a brand-new cluster on one specific HPE model, say it must survive two hosts failing at once, plan 12 months ahead, describe the VMs, add three waves of growth, let it recommend a node count, and export the PDF with an exact name. Nutanix Sizer on the web is only the fallback.",listen:["PC → Operations → Planning → Scenarios, not Sizer","Scenario IaaS, new cluster, HPE DX365-10-G11-NVMe full flash, hardware untouched","RF3 / 2 host failures, 12-month runway","4 vCPU / 16 GB / 200 GB per VM","100 now, 50 in 3 months, 20 in 6 months","Smallest recommended node count","Desktop\\IaaS-requirement.pdf"]},
15:{why:"Database admins run heavy jobs every Saturday and want a weekly report showing whether the cluster or the servers were the slow part.",do:"In Prism Central Reports You build a report with a cluster section (peak CPU) and a VM section filtered to names starting with SQL (peak read latency and peak CPU-ready), schedules it for Sunday midnight over the last 7 days, emails it, then runs it once and saves the CSV ZIP.",listen:["SQL_Batch_Saturday, Cluster 1 only","Cluster metric: CPU used, Maximum","VM filter: name starts with (prefix) SQL, not contains","VM metrics: max I/O read latency, max CPU ready","Sunday 12:00 AM, previous 7 days, dbateam@ACME.org","Generate once, export CSV, ZIP on Desktop"]},
16:{why:"A health check keeps complaining about a protection domain that is intentionally empty, and there's a nagging alert about Pulse (phone-home telemetry). Quiet both without turning anything important off.",do:"You disable exactly one NCC check over SSH, then in Prism Element sets the Pulse alert to log messages but not alert, and resolves the alert that's already showing.",listen:["Only backup_schedule_check disabled","NoVMs PD is not deleted","Pulse stays enabled; messages recorded, alert off","Resolve the existing alert"]},
17:{why:"A controller once ran out of inodes (file slots). The company wants an earlier warning that stays on screen until a human clears it.",do:"In Prism Element Health you find the inode check and sets warning 45%, critical 60%, runs it every minute, and turns off auto-resolve. He tunes the check; he doesn't disable it.",listen:["Warning 45%, critical 60%","Every 1 minute","Auto-resolve off","Only the inode check changed, not disabled"]}
};
const GLOSSARY=[["Cluster","A group of physical servers working as one pool of compute and storage."],["VM","Virtual machine: a computer made of software, running on the cluster."],["CVM","Controller VM: the special VM on each server that runs Nutanix's storage software. Admins SSH into it to run commands."],["Prism Element (PE)","The console for one cluster. Local things: VMs on that cluster, storage, DR, syslog, health checks."],["Prism Central (PC)","The console that sees all clusters. Cross-cluster things: analysis, reports, categories, policies, the API."],["SSH","A text terminal connection to a server. Faster than clicking around in a slow web console."],["ncli / acli / ncc","Nutanix command-line tools: ncli for cluster settings, acli for VMs and disks, ncc for health checks."],["SCSI vs IDE/SATA","Ways a virtual disk is attached. SCSI is the fast modern one; IDE/SATA is the slow compatibility one."],["Volume group","A set of virtual disks that can be shared with VMs, used for databases."],["Flash Mode","Pins a VM's or volume group's data to SSDs so it stays fast."],["Snapshot","A saved point-in-time copy of a VM's data."],["Protection domain","A group of VMs snapshotted together on a schedule and replicated to another cluster for disaster recovery."],["RPO","How much data you can afford to lose, measured in time. 15 minutes means snapshots every 15 minutes."],["Category / policy","A label on a VM, and a rule that does something to every VM with that label."],["Template","A VM frozen as a blueprint, so new VMs can be stamped from it."],["Syslog","A standard way to ship log lines to a central server."],["NCC","Nutanix Cluster Check: hundreds of health checks that raise alerts."],["Pulse","Nutanix's phone-home telemetry."],["API / JSON / UUID","Talking to the system with structured text instead of clicks; JSON is the text format; a UUID is an object's unique ID number."],["CSR / SAN","Certificate signing request, and the extra names a certificate should cover."],["Sizer","Nutanix's tool for working out how many servers a workload needs."],["Inode","A slot in a filesystem for one file; run out and you can't create files even with free space."]];
{const K=remapKeys(KID);Object.keys(KID).forEach(k=>delete KID[k]);Object.assign(KID,K)}
const SHELL={cvm:"nutanix@NTNX-C1-CVM:~$ ",cvm2:"nutanix@NTNX-C2-CVM:~$ ",api:"API Explorer > "};

const SCREENS=[["home","Home"],["practice","Practice"],["tasks","Tasks"],["ref","Reference"]];
const DRILL_TYPES=["walk","recall","loc","vals","order","trap","cmd"];
const MIXED=["walk","walk","recall","loc","vals","order","trap","cmd","term"];
const TYPE_LABEL={walk:"Walkthrough",recall:"Recall",loc:"Location",vals:"Values",order:"Step order",trap:"Traps",cmd:"Commands",term:"Terminal"};
const FOCUS=[["mixed","Mixed (recommended)"],["walk","Walkthrough"],["term","Terminal"],["cmd","Command fill"],["recall","Recall"],["loc","Location"],["vals","Values"],["order","Step order"],["trap","Traps"]];

// ---------- STATE ----------
const KEY="nst.ncm-practice.v1";
let S={box:{},seen:0,right:0,streak:0};
try{const s=localStorage.getItem(KEY);if(s)S=Object.assign(S,JSON.parse(s))}catch(e){}
if(S.v!==2){const nb={};Object.keys(S.box).forEach(k=>{const [id,ty]=k.split(":");nb[(RENUM[id]||id)+":"+ty]=S.box[k]});S.box=nb;
  if(S.fade){const nf={};Object.keys(S.fade).forEach(id=>{nf[RENUM[id]||id]=S.fade[id]});S.fade=nf}S.v=2;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function save(){S.updated=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
// ---------- ACCOUNT SYNC ----------
// Progress lives under an nst. key, so shared/nst-backup.js + shared/nst-sync.js carry it to the signed-in account
// with everything else (and it is part of a downloaded backup). When a pull brings newer progress in, re-read it.
function reloadFromStore(){try{const s=localStorage.getItem(KEY);if(s)S=Object.assign({box:{},fade:{},cfade:{},seen:0,right:0,streak:0,v:2},JSON.parse(s))}catch(e){}if(typeof screen!=="undefined"&&screen==="home")renderHome()}
window.addEventListener("nst-sync-pulled",reloadFromStore);
function boxOf(t,type){return S.box[t+":"+type]||0}
function mark(t,type,ok){const k=t+":"+type;S.box[k]=ok?Math.min(3,(S.box[k]||0)+1):0;S.seen++;if(ok){S.right++;S.streak++}else S.streak=0;save();if(screen==="home")renderProg()}

// ---------- HELPERS ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s).toLowerCase().replace(/[“”"']/g,"").replace(/\s*[,/→\-–]\s*/g," ").replace(/\s+/g," ").trim();
function valMatch(input,ans,alts){const n=norm(input);if(!n)return false;const cands=[ans,...(alts||[])].map(norm);return cands.some(c=>c===n||(c.length>=4&&n.includes(c)&&n.length<=c.length+8))}
let lastPick=null;
function pickTask(type){ // lowest box first, avoid immediate repeat
  const src=(type==="cmd"||type==="term")?T.filter(t=>CLI[t.id]):T;
  const pool=src.map(t=>({t,b:boxOf(t.id,type==="term"?"cmd":type)}));
  const min=Math.min(...pool.map(p=>p.b));
  let c=pool.filter(p=>p.b===min);
  if(c.length>1&&lastPick)c=c.filter(p=>p.t.id!==lastPick)||c;
  const p=c[Math.random()*c.length|0];lastPick=p.t.id;return p.t}
function head(t,type,extra=""){return `<div class="eyebrow"><span class="tag">Task ${t.id}</span><span>${TYPE_LABEL[type]||""}</span>${extra}</div>`}
function next(){return `<div class="row"><button class="btn primary" id="next">Next</button><button class="btn" id="toref">Open task page</button></div>`}
function wireNext(ret,t){$("#next")?.addEventListener("click",()=>go(ret));$("#toref")?.addEventListener("click",()=>{taskId=t.id;taskTab="learn";show("tasks")})}

// ---------- VIEWS ----------
let screen="home",focus="mixed",taskFilter="all",taskId=1,taskTab="learn",refTab="cmds",view=$("#view");
function show(sc){screen=sc;document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.s===sc));$("#prog").hidden=sc!=="home";window.scrollTo({top:0});
  if(sc==="home")return renderHome();if(sc==="tasks")return renderTask();if(sc==="ref")return renderRef();go("practice")}
function go(ret){
  if(ret==="practice"){let type,t;
    if(taskFilter==="all"){type=focus==="mixed"?MIXED[Math.random()*MIXED.length|0]:focus;t=pickTask(type)}
    else{t=T.find(x=>x.id===+taskFilter);const pool=(focus==="mixed"?MIXED:[focus]).filter(ty=>(ty!=="cmd"&&ty!=="term")||CLI[t.id]);
      if(!pool.length){focus="mixed";return go("practice")}type=pool[Math.random()*pool.length|0]}
    view.innerHTML=`<div class="focusbar"><label for="taskf">Task</label><select id="taskf"><option value="all" ${taskFilter==="all"?"selected":""}>All (weakest first)</option>${T.map(x=>`<option value="${x.id}" ${String(x.id)===taskFilter?"selected":""}>Task ${x.id}: ${esc(x.name)}</option>`).join("")}</select><label for="focus">Focus</label><select id="focus">${FOCUS.map(f=>`<option value="${f[0]}" ${f[0]===focus?"selected":""}>${f[1]}</option>`).join("")}</select></div><div id="q"></div>`;
    $("#focus").value=focus;$("#taskf").value=taskFilter;$("#focus").onchange=e=>{focus=e.target.value;go("practice")};$("#taskf").onchange=e=>{taskFilter=e.target.value;go("practice")};return render(type,t,"practice",$("#q"))}
  if(ret.startsWith("task:")){const t=T.find(x=>x.id===+ret.slice(5));const pool=MIXED.filter(ty=>(ty!=="cmd"&&ty!=="term")||CLI[t.id]);const type=pool[Math.random()*pool.length|0];
    taskTab="practice";renderTaskShell(t);return render(type,t,ret,$("#tbody"))}}
function render(type,t,ret,el){view=el||$("#view");
  ({recall:qRecall,loc:qLoc,vals:qVals,order:qOrder,trap:qTrap,walk:qWalk,cmd:qCmd,term:qTerm})[type](t,ret)}

// ---------- WALKTHROUGH (fading cues) ----------
function fadeOf(id){return (S.fade&&S.fade[id])||1}
function setFade(id,l){S.fade=S.fade||{};S.fade[id]=Math.max(1,Math.min(3,l));save()}
function qWalk(t,ret){
  const lvl=fadeOf(t.id);let i=0,misses=0;const steps=t.steps;
  const lvlName=["","Pick","Cue","Blind"][lvl];
  view.innerHTML=`<div class="card">${head(t,"walk",`<span class="lvl" title="Level: Pick from 3 → first-two-word cue → blind">${[1,2,3].map(n=>`<span class="${n===lvl?"on":""}">${["","Pick","Cue","Blind"][n]}</span>`).join("")}</span>`)}
  <h2>${esc(t.name)}</h2><p class="scen">${esc(t.scen)}</p>
  <div class="stepdone" id="sd"></div><div id="cur"></div></div>`;
  const show=()=>{
    if(i>=steps.length){const ok=misses===0;if(ok)setFade(t.id,lvl+1);
      $("#cur").innerHTML=`<div class="fb ${ok?"ok":"bad"}">${ok?`Clean run at level ${lvlName}. ${lvl<3?"Next time this task runs at the next level.":"Mastered blind."}`:`${misses} miss${misses>1?"es":""}. Same level next time.`}</div>${next()}`;
      mark(t.id,"walk",ok);wireNext(ret,t);return}
    const s=steps[i];
    if(lvl===1){
      const others=shuffle(steps.filter((_,j)=>j!==i)).slice(0,2);const opts=shuffle([s,...others]);
      $("#cur").innerHTML=`<div class="cue">Step ${i+1} of ${steps.length}: what comes next?</div><div class="opts">${opts.map(o=>`<button class="opt" data-s="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      document.querySelectorAll("#cur .opt").forEach(b=>b.onclick=()=>{if(b.dataset.s===s){done(s)}else{misses++;b.classList.add("bad");b.classList.add("done")}})}
    else{
      const words=s.split(" ");const cue=lvl===2?words.slice(0,2).join(" ")+' <span class="ghost">…</span>':'<span class="ghost">(say the whole step)</span>';
      $("#cur").innerHTML=`<div class="cue">Step ${i+1} of ${steps.length}: ${cue}</div><div class="row"><button class="btn primary" id="rv">Reveal</button></div><div id="after" hidden><div class="flash">${esc(s)}</div><div class="row"><button class="btn good" id="ok">Had it</button><button class="btn miss" id="miss">Missed</button></div></div>`;
      $("#rv").onclick=()=>{$("#after").hidden=false;$("#rv").hidden=true};
      $("#ok").onclick=()=>done(s);$("#miss").onclick=()=>{misses++;done(s)}}};
  const done=s=>{$("#sd").insertAdjacentHTML("beforeend",`<div><b>${i+1}.</b> ${esc(s)}</div>`);i++;show()};
  show()}

// ---------- COMMAND FILL ----------
function cfadeOf(id){return (S.cfade&&S.cfade[id])||1}
function setCfade(id,l){S.cfade=S.cfade||{};S.cfade[id]=Math.max(1,Math.min(3,l));save()}
function qCmd(t,ret){
  const cmd=CLI[t.id].cmds[Math.random()*CLI[t.id].cmds.length|0];const lvl=cfadeOf(t.id);
  const pills=`<span class="lvl" title="Level: one blank → all key tokens → whole command">${[1,2,3].map(n=>`<span class="${n===lvl?"on":""}">${["","One blank","Key tokens","Whole command"][n]}</span>`).join("")}</span>`;
  let n=0;const blanks=[];let html;
  if(lvl===3){html=`<input id="b0" class="full" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="type the full command">`;blanks.push(cmd.c)}
  else{html=esc(cmd.c);const keys=lvl===1?cmd.k.slice(0,1):cmd.k;
    keys.forEach(k=>{const e=esc(k);if(html.includes(e)){blanks.push(k);html=html.replace(e,`<input id="b${n}" data-css="--w:${k.length+1}ch" autocomplete="off" spellcheck="false" autocapitalize="off">`);n++}})}
  view.innerHTML=`<div class="card">${head(t,"cmd",pills)}<h2>${esc(t.name)}</h2><div class="purpose">${esc(cmd.p)}</div>
  <form id="f"><div class="cmdline">${SHELL[CLI[t.id].sh]}${html}</div>
  <div class="row"><button class="btn primary" type="submit">Check</button><button class="btn" type="button" id="show">Show</button></div></form><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  $("#b0")?.focus();
  const finish=graded=>{let ok=0;
    if(lvl===3){const el=$("#b0");const good=graded&&cmdMatches(cmd,el.value);if(good)ok++;el.classList.add(good?"ok":"bad");if(!good){el.value=cmd.c}}
    else blanks.forEach((k,i)=>{const el=$("#b"+i);const good=graded&&norm(el.value)===norm(k);if(good)ok++;el.classList.add(good?"ok":"bad");if(!good)el.value=k});
    const all=ok===blanks.length;if(all)setCfade(t.id,lvl+1);
    $("#fb").className="fb "+(all?"ok":"bad");$("#fb").textContent=all?(lvl<3?"Exact. Next time this task asks for more.":"Exact. Whole command from memory."):(lvl===3?"Not quite. The full command is shown; same level next time.":`${ok}/${blanks.length}. Corrected tokens shown in the line.`);
    mark(t.id,"cmd",all);$("#nx").innerHTML=next();wireNext(ret,t);$("#f").querySelectorAll("button").forEach(b=>b.disabled=true)};
  $("#f").onsubmit=e=>{e.preventDefault();finish(true)};$("#show").onclick=()=>finish(false)}

// ---------- TERMINAL ----------
function cmdMatches(entry,input){
  const n=input.trim().replace(/\s+/g," ");const nl=n.toLowerCase();
  if(entry.start&&!entry.start.test(n))return false;
  if(entry.req)return entry.req.every(tok=>nl.includes(tok.toLowerCase()));
  const cands=[entry.c,...(entry.alt||[])];
  return cands.some(c=>{const re=new RegExp("^"+c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/<[^>]+>/g,"\\S+")+"$","i");return re.test(n)})}
function blankKey(entry){let s=entry.c;entry.k.slice(0,1).forEach(k=>{s=s.replace(k,"_".repeat(Math.min(k.length,10)))});return s}
function qTerm(t,ret){
  const sess=CLI[t.id];const cmds=sess.cmds;let i=0,hints=0,wrong=0;const P=SHELL[sess.sh];
  view.innerHTML=`<div class="card">${head(t,"term",'<span class="tag">type <code>hint</code> · <code>steps</code> · <code>clear</code></span>')}
  <h2>${esc(t.name)}</h2><p class="scen">${esc(t.scen)}</p>
  <div class="chk" id="chk">${cmds.map((c,j)=>`<span id="c${j}">${j+1}. ${esc(c.p)}</span>`).join("")}</div>
  <div class="term" id="term"><span class="o">Connected. ${cmds.length} command${cmds.length>1?"s":""} to run, in order. Objective: ${esc(t.flash)}</span>\n</div>
  <form class="termin" id="tf"><span>${esc(P.trim())}</span><input id="ti" autocomplete="off" spellcheck="false" autocapitalize="off" autofocus></form><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  const term=$("#term"),inp=$("#ti");inp.focus();
  const out=(txt,cls="o")=>{term.insertAdjacentHTML("beforeend",`<span class="${cls}">${esc(txt)}</span>\n`);term.scrollTop=term.scrollHeight};
  $("#tf").onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value="";if(!v.trim())return;
    term.insertAdjacentHTML("beforeend",`<span class="p">${esc(P)}</span>${esc(v)}\n`);
    const w=v.trim().toLowerCase();
    if(w==="clear"){term.innerHTML="";return}
    if(w==="steps"){out(cmds.map((c,j)=>`${j<i?"✓":" "} ${j+1}. ${c.p}`).join("\n"),"h");return}
    if(w==="hint"){hints++;out("next: "+blankKey(cmds[i]),"h");return}
    if(w==="help"){out("Type the real command for the next objective. hint = next command with the key token blanked. steps = objective list.","h");return}
    if(i>=cmds.length)return out("Session complete. Click Next.","g");
    if(cmdMatches(cmds[i],v)){out(cmds[i].o,"o");$("#c"+i).classList.add("done");i++;
      if(i===cmds.length){const ok=hints===0&&wrong===0;out(`All ${cmds.length} commands correct${hints?` with ${hints} hint${hints>1?"s":""}`:""}${wrong?`, ${wrong} wrong attempt${wrong>1?"s":""}`:""}.`,"g");
        $("#fb").className="fb "+(ok?"ok":"bad");$("#fb").textContent=ok?"Clean session.":"Completed, but not clean. Counts as a miss for Commands.";mark(t.id,"cmd",ok);$("#nx").innerHTML=next();wireNext(ret,t)}
      return}
    const later=cmds.findIndex((c,j)=>j>i&&cmdMatches(c,v));
    wrong++;
    if(later>=0)return out(`Valid, but not yet. Step ${i+1} comes first: ${cmds[i].p}`,"e");
    const first=w.split(" ")[0],exp=cmds[i].c.toLowerCase().split(" ")[0];
    if(first!==exp&&sess.sh!=="api")return out(`-bash: ${first}: command not found   (expected tool: ${exp})`,"e");
    out(`Error: unrecognized or incomplete arguments. Expected: ${cmds[i].p}. Type hint.`,"e")}}

function qRecall(t,ret){
  view.innerHTML=`<div class="card">${head(t,"recall",'<span class="tag warn">say it out loud, then reveal</span>')}
  <h2>${esc(t.name)}</h2><p class="scen">${esc(t.scen)}</p>
  <p class="hint">Before revealing: where does it run, what are the deliverables and values, what order, what zeroes it?</p>
  <div class="row"><button class="btn primary" id="rev">Reveal</button></div>
  <div class="reveal" id="rv" hidden>${refBody(t)}
   <div class="row"><button class="btn good" id="ok">Got it</button><button class="btn miss" id="miss">Missed something</button></div></div></div>`;
  $("#rev").onclick=()=>{$("#rv").hidden=false;$("#rev").hidden=true};
  $("#ok").onclick=()=>{mark(t.id,"recall",true);go(ret)};
  $("#miss").onclick=()=>{mark(t.id,"recall",false);go(ret)}}

function qLoc(t,ret){
  const correct=LOCS[t.loc];const others=shuffle(LOCS.filter((_,i)=>i!==t.loc)).slice(0,3);const opts=shuffle([correct,...others]);
  view.innerHTML=`<div class="card">${head(t,"loc")}<h2>Where does this task run?</h2><p class="scen">${esc(t.scen)}</p>
  <div class="opts">${opts.map(o=>`<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const ok=b.dataset.v===correct;document.querySelectorAll(".opt").forEach(x=>{x.classList.add("done");if(x.dataset.v===correct)x.classList.add("ok")});if(!ok)b.classList.add("bad");
    $("#fb").className="fb "+(ok?"ok":"bad");$("#fb").innerHTML=(ok?"Correct. ":"No. ")+esc(t.locFull);mark(t.id,"loc",ok);$("#nx").innerHTML=next();wireNext(ret,t)})}

function qVals(t,ret){
  const vs=shuffle(t.vals).slice(0,Math.min(5,t.vals.length));
  view.innerHTML=`<div class="card">${head(t,"vals")}<h2>${esc(t.name)}</h2><p class="scen">${esc(t.scen)}</p>
  <form id="f">${vs.map((v,i)=>`<div class="field" id="fl${i}"><label for="v${i}">${esc(v[0])}</label><input id="v${i}" autocomplete="off" spellcheck="false"><span class="ans" id="a${i}"></span></div>`).join("")}
  <div class="row"><button class="btn primary" type="submit">Check</button><button class="btn" type="button" id="show">Show answers</button></div></form><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  $("#v0").focus();
  const finish=(graded)=>{let n=0;vs.forEach((v,i)=>{const ok=graded&&valMatch($("#v"+i).value,v[1],v[2]);if(ok)n++;$("#fl"+i).classList.add(ok?"ok":"bad");$("#a"+i).textContent=ok?"✓":"→ "+v[1]});
    const all=n===vs.length;$("#fb").className="fb "+(all?"ok":"bad");$("#fb").textContent=`${n}/${vs.length} exact.`+(all?"":" Every one of these is graded on the exam.");mark(t.id,"vals",all);$("#nx").innerHTML=next();wireNext(ret,t);$("#f").querySelectorAll("button").forEach(b=>b.disabled=true)};
  $("#f").onsubmit=e=>{e.preventDefault();finish(true)};$("#show").onclick=()=>finish(false)}

function qOrder(t,ret){
  const steps=t.steps;const sh=shuffle(steps.map((s,i)=>({s,i})));let expect=0,errors=0;
  view.innerHTML=`<div class="card">${head(t,"order")}<h2>${esc(t.name)}: click the steps in order</h2><p class="scen">${esc(t.scen)}</p>
  <div class="opts" id="ol">${sh.map(o=>`<button class="opt" data-i="${o.i}"><span class="n"></span>${esc(o.s)}</button>`).join("")}</div><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  document.querySelectorAll("#ol .opt").forEach(b=>b.onclick=()=>{
    if(b.classList.contains("done"))return;const i=+b.dataset.i;
    if(i===expect){b.classList.add("done","ok");b.querySelector(".n").textContent=(expect+1)+".";expect++;
      if(expect===steps.length){const ok=errors===0;$("#fb").className="fb "+(ok?"ok":"bad");$("#fb").textContent=ok?"Clean run.":`${errors} wrong click${errors>1?"s":""}. Reread the order in the reference.`;mark(t.id,"order",ok);$("#nx").innerHTML=next();wireNext(ret,t)}}
    else{errors++;b.classList.add("bad");setTimeout(()=>b.classList.remove("bad"),500)}})}

function qTrap(t,ret){
  // one true statement (a step or value) vs three real traps from this task
  const truths=[...t.steps.map(s=>s),...t.vals.map(v=>`${v[0]}: ${v[1]}`)];
  const truth=truths[Math.random()*truths.length|0];const traps=shuffle(t.gotchas).slice(0,3);
  const opts=shuffle([{s:truth,ok:true},...traps.map(s=>({s,ok:false}))]);
  view.innerHTML=`<div class="card">${head(t,"trap")}<h2>Which one is correct? The other three cost you the task.</h2><p class="scen">${esc(t.name)}: ${esc(t.scen)}</p>
  <div class="opts">${opts.map((o,i)=>`<button class="opt" data-ok="${o.ok}">${esc(o.s)}</button>`).join("")}</div><div class="fb" id="fb"></div><div id="nx"></div></div>`;
  document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const ok=b.dataset.ok==="true";document.querySelectorAll(".opt").forEach(x=>{x.classList.add("done");if(x.dataset.ok==="true")x.classList.add("ok")});if(!ok)b.classList.add("bad");
    $("#fb").className="fb "+(ok?"ok":"bad");$("#fb").innerHTML=ok?"Correct.":"That one is a documented mistake. Traps for this task: "+esc(t.gotchas.join(" · "));mark(t.id,"trap",ok);$("#nx").innerHTML=next();wireNext(ret,t)})}

function refBody(t){
  return `<div class="section"><h3>Runs in</h3><div>${esc(t.locFull)}</div></div>
  <div class="section"><h3>Flash card</h3><div class="flash">${esc(t.flash)}</div></div>
  <div class="section"><h3>Required values</h3><dl class="kv">${t.vals.map(v=>`<dt>${esc(v[0])}</dt><dd>${esc(v[1])}</dd>`).join("")}</dl></div>
  <div class="section"><h3>Order of work</h3><ol class="steps">${t.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
  ${t.cmds?`<div class="section"><h3>Commands / edits</h3><pre tabindex="0">${esc(t.cmds)}</pre></div>`:""}
  <div class="section"><h3>What zeroes the task</h3><ul class="gotchas">${t.gotchas.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>`}
let finderQ="";
const ALLCMDS=[];T.forEach(t=>{(CLI[t.id]?.cmds||[]).forEach(c=>ALLCMDS.push({id:t.id,c:c.c,p:c.p}))});
[[4,"acli vg.get Database_VM","Inspect the volume group (Flash Mode, attachments)"],[9,"acli vm.get sql3532","Validate sql3532 disks/NIC/power"],[2,"acli vm.get NEWSQL_VM","Validate NEWSQL VM"],[8,"Quarantine: is_policy_hitlog_enabled=false; action=APPLY; Environment=SecOps","Security Policy.txt: quarantine values"],[8,"SMB: is_policy_hitlog_enabled=True; action=MONITOR; SMBv1=smbhost, smbclient","Security Policy.txt: SMB values"],[8,"DN: allow_ipv6_traffic=True; action=MONITOR; protocol=ALL; is_policy_hitlog_enabled=True","Security Policy.txt: dn-policy1 values"],[12,"\"num_sockets\": 2, \"memory_size_mib\": 8192, \"disk_size_mib\": 51200, \"disable_branding\": true, \"metadata\": {\"kind\": \"vm\"}","API_Create_VM.txt key fixes"],[14,"PC → Operations → Planning → Scenarios  (fallback: https://sizer.nutanix.com)","Capacity planning tool location"]].forEach(r=>ALLCMDS.push({id:r[0],c:r[1],p:r[2]}));
ALLCMDS.sort((a,b)=>a.id-b.id);

// ---------- HOME ----------
function renderHome(){
  view.innerHTML=`<div class="home">
    <h2>Seventeen lab tasks. Know where each one runs, what it is named, in what order, and what loses it.</h2>
    <p class="scen">Start a practice session and the drill serves whatever you know least. Open a task page to learn it first, or to have someone examine you on it.</p>
    <div class="row" data-css="margin-top:8px"><button class="btn primary" id="start">Start practice</button><button class="btn" id="browse">Browse tasks</button></div>
    <div class="section" data-css="margin-top:28px"><h3>Weakest right now</h3><div class="weak" id="weak"></div></div></div>`;
  $("#start").onclick=()=>show("practice");$("#browse").onclick=()=>show("tasks");
  const scored=T.map(t=>({t,s:DRILL_TYPES.reduce((a,ty)=>a+((ty==="cmd"&&!CLI[t.id])?3:boxOf(t.id,ty)),0)})).sort((a,b)=>a.s-b.s).slice(0,4);
  $("#weak").innerHTML=scored.map(x=>`<button class="opt" data-id="${x.t.id}"><span class="n">T${x.t.id}</span>${esc(x.t.name)}<span class="hint" data-css="float:right">${esc(LOCS[x.t.loc])}</span></button>`).join("");
  document.querySelectorAll("#weak .opt").forEach(b=>b.onclick=()=>{taskId=+b.dataset.id;taskTab="learn";show("tasks")});
  renderProg()}

// ---------- TASK PAGE ----------
function renderTaskShell(t){
  view=$("#view");
  view.innerHTML=`<div class="tasklist">${T.map(x=>`<button data-id="${x.id}" aria-current="${x.id===t.id}" title="${esc(x.name)}">${x.id}</button>`).join("")}</div>
  <div class="card">${head(t,"",'<span class="hint">'+esc(LOCS[t.loc])+'</span>')}<h2>${esc(t.name)}</h2>
  <div class="tabs"><button data-t="learn" aria-current="${taskTab==="learn"}">Learn</button><button data-t="practice" aria-current="${taskTab==="practice"}">Practice this task</button><button data-t="exam" aria-current="${taskTab==="exam"}">Examiner card</button></div>
  <div id="tbody"></div></div>`;
  document.querySelectorAll(".tasklist button").forEach(b=>b.onclick=()=>{taskId=+b.dataset.id;renderTask()});
  document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{taskTab=b.dataset.t;renderTask()})}
function renderTask(){
  const t=T.find(x=>x.id===taskId),k=KID[t.id];
  if(taskTab==="practice")return go("task:"+t.id);
  renderTaskShell(t);const el=$("#tbody");
  if(taskTab==="learn"){
    el.innerHTML=`<div class="section"><h3>What the customer wants, and why</h3><p class="scen">${esc(k.why)}</p></div>
    <div class="section"><h3>What you do</h3><p class="scen">${esc(k.do)}</p></div>
    <div class="section"><h3>Where</h3><div>${esc(t.locFull)}</div></div>
    <div class="section"><h3>In one line</h3><div class="flash">${esc(t.flash)}</div></div>
    <div class="section"><h3>Required values</h3><dl class="kv">${t.vals.map(v=>`<dt>${esc(v[0])}</dt><dd>${esc(v[1])}</dd>`).join("")}</dl></div>
    <div class="section"><h3>Order of work</h3><ol class="steps">${t.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>
    ${t.cmds?`<div class="section"><h3>Commands and edits</h3><pre tabindex="0">${esc(t.cmds)}</pre></div>`:""}
    <div class="section"><h3>What loses the task</h3><ul class="gotchas">${t.gotchas.map(g=>`<li>${esc(g)}</li>`).join("")}</ul></div>
    <div class="row"><button class="btn primary" id="pr">Practice this task</button>${CLI[t.id]?'<button class="btn" id="tm">Open terminal</button>':""}<button class="btn" id="prev">← Task ${t.id>1?t.id-1:17}</button><button class="btn" id="nxt">Task ${t.id<17?t.id+1:1} →</button></div>`;
    $("#pr").onclick=()=>{taskTab="practice";renderTask()};$("#tm")?.addEventListener("click",()=>{taskTab="practice";renderTaskShell(t);view=$("#tbody");qTerm(t,"task:"+t.id)});
  } else {
    el.innerHTML=`<p class="hint" data-css="margin-top:0">For a second person. The examiner holds this screen; the candidate does not see it.</p>
    <div class="section"><h3>Read aloud</h3><p class="scen" data-css="font-size:17px;line-height:27px">“${esc(t.scen)}”</p>
    <p class="hint">Then ask: <b>Where do you do it? What exactly do you name or set? In what order? What would make you lose the task?</b> Tick each point as it is said. Ask “anything else?” once before grading.</p></div>
    <div class="section"><h3>Must be said</h3><div class="opts" id="ck">${k.listen.map((s,i)=>`<label class="opt" data-css="display:flex;gap:12px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="ck${i}" data-css="margin-top:5px;accent-color:var(--accent)"><span>${esc(s)}</span></label>`).join("")}</div></div>
    <div class="row"><button class="btn primary" id="grade">Grade</button><button class="btn" id="showfull">Show full answer</button></div><div class="fb" id="fb"></div>
    <div class="reveal" id="rv" hidden>${refBody(t)}</div>
    <div class="row"><button class="btn" id="prev">← Task ${t.id>1?t.id-1:17}</button><button class="btn" id="nxt">Task ${t.id<17?t.id+1:1} →</button></div>`;
    $("#grade").onclick=()=>{const n=k.listen.filter((_,i)=>$("#ck"+i).checked).length,all=n===k.listen.length;
      $("#fb").className="fb "+(all?"ok":"bad");$("#fb").textContent=all?`${n}/${k.listen.length}. Pass. Recorded as a clean Recall for Task ${t.id}.`:`${n}/${k.listen.length}. Not yet. Read back the missed points; this task will come up sooner in practice.`;
      mark(t.id,"recall",all);$("#grade").disabled=true};
    $("#showfull").onclick=()=>{$("#rv").hidden=false}}
  $("#prev").onclick=()=>{taskId=taskId>1?taskId-1:17;renderTask()};$("#nxt").onclick=()=>{taskId=taskId<17?taskId+1:1;renderTask()}}

// ---------- REFERENCE ----------
function renderRef(){
  view=$("#view");
  const tabs=`<div class="tabs"><button data-t="cmds" aria-current="${refTab==="cmds"}">Command finder</button><button data-t="nav" aria-current="${refTab==="nav"}">Menu paths</button><button data-t="gloss" aria-current="${refTab==="gloss"}">Glossary</button></div>`;
  if(refTab==="cmds"){
    const q=norm(finderQ);const rows=ALLCMDS.filter(r=>!q||norm(r.p+" "+r.c+" task "+r.id+" "+T.find(t=>t.id===r.id).name).includes(q));
    view.innerHTML=`${tabs}<div class="card"><div class="finder"><input id="fq" placeholder="What do you need to do? e.g. rebuild, aide, csr, syslog, cerebro, uuid" value="${esc(finderQ)}" autocomplete="off"></div>
    <div data-css="overflow-x:auto"><table class="cmds">${rows.map(r=>`<tr><td>T${r.id}</td><td>${esc(r.p)}<br><code>${esc(r.c)}</code></td></tr>`).join("")||"<tr><td></td><td class='hint'>No match.</td></tr>"}</table></div></div>`;
    const fq=$("#fq");fq.oninput=()=>{finderQ=fq.value;const pos=fq.selectionStart;renderRef();const f=$("#fq");f.focus();f.setSelectionRange(pos,pos)};
  } else if(refTab==="nav"){
    view.innerHTML=`${tabs}<div class="card"><p class="hint" data-css="margin-top:0">First click for every task. On a slow exam VM, knowing this before touching the mouse is the time saver.</p><div data-css="overflow-x:auto"><table class="cmds">${T.map(t=>{const s=t.steps.find(x=>x.includes("→"))||t.steps[0];return `<tr><td>T${t.id}</td><td>${esc(t.name)}<br><code>${esc(t.locFull)}</code><br><span class="hint">${esc(s)}</span></td></tr>`}).join("")}</table></div></div>`;
  } else {
    view.innerHTML=`${tabs}<div class="card"><p class="hint" data-css="margin-top:0">Enough vocabulary to follow every task.</p><dl class="kv" data-css="gap:8px 20px">${GLOSSARY.map(g=>`<dt data-css="font-weight:600;color:var(--fg)">${esc(g[0])}</dt><dd data-css="font-family:var(--font);font-size:14px">${esc(g[1])}</dd>`).join("")}</dl></div>`}
  document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{refTab=b.dataset.t;renderRef()})}

// ---------- PROGRESS (home only) ----------
function renderProg(){
  const total=T.length*(DRILL_TYPES.length-1)+CLI_TASKS.length;let mastered=0;
  T.forEach(t=>DRILL_TYPES.forEach(ty=>{if(ty==="cmd"&&!CLI[t.id])return;if(boxOf(t.id,ty)===3)mastered++}));
  const pct=S.seen?Math.round(100*S.right/S.seen):0;
  $("#prog").innerHTML=`<h3><span>Progress · ${mastered}/${total} mastered</span><span class="stat">${S.seen} answered · ${pct}% right · streak ${S.streak}</span></h3>
  <div class="grid"><span></span>${DRILL_TYPES.map(ty=>`<span class="h">${TYPE_LABEL[ty]}</span>`).join("")}
  ${T.map(t=>`<span class="t">T${t.id}</span>`+DRILL_TYPES.map(ty=>(ty==="cmd"&&!CLI[t.id])?`<span class="cell na" title="No CLI in this task"></span>`:`<span class="cell b${boxOf(t.id,ty)}" title="Task ${t.id} ${TYPE_LABEL[ty]}: ${boxOf(t.id,ty)} in a row${ty==="walk"?` · level ${fadeOf(t.id)}`:ty==="cmd"?` · level ${cfadeOf(t.id)}`:""}"></span>`).join("")).join("")}</div>
  <p class="hint" data-css="margin:12px 0 0">Progress is saved in this browser. Sign in from the NST home page and it follows you to any device.</p>
  <div class="legend"><span><i data-css="background:var(--box0)"></i>not yet</span><span><i data-css="background:var(--box1)"></i>1 right</span><span><i data-css="background:var(--box2)"></i>2 in a row</span><span><i data-css="background:var(--box3)"></i>3 in a row</span><span>A miss resets the cell.</span><button class="toggle" id="reset">Reset progress</button></div>`;
  $("#reset").onclick=()=>{if($("#reset").textContent!=="Confirm reset"){$("#reset").textContent="Confirm reset";return}S={box:{},fade:{},cfade:{},seen:0,right:0,streak:0,v:2};save();renderProg()}}

// ---------- BOOT ----------
$("#nav").innerHTML=SCREENS.map(m=>`<button data-s="${m[0]}" aria-current="${m[0]===screen}">${m[1]}</button>`).join("");
document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>show(b.dataset.s));
(function(){const l=document.getElementById("logo");const th=document.documentElement.dataset.theme;if(th==="dark")l.src="assets/Nutanix-Logo-White-Digital.svg";if(th==="light")l.closest("picture").querySelector("source").remove()})();
show("home");
