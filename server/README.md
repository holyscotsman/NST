# Running the Nutanix Study Tool on a VM

The study tool is a static site, so it normally needs no server at all. This
directory adds one for the case where that isn't enough:

- the GitHub URL is blocked on your network, so the site has to be hosted somewhere reachable
- several people want to use it, each with their own progress
- progress should follow the person, not the browser they happened to use

It is a single Node process with **no npm dependencies** — nothing to install,
no `node_modules`, no build step. The database is one SQLite file you can copy,
back up, or delete.

## Requirements

Node 22 or newer. Check with `node --version`.

(SQLite comes from Node's built-in `node:sqlite`. That is why there is nothing
to install and no database server to administer.)

## Start it

```bash
git clone <this repo> nst && cd nst
node server/server.mjs
```

That's it. It prints the address it is listening on:

```
  Nutanix Study Tool
  serving  /opt/nst
  database /opt/nst/server/data/nst.db
  listening on http://<this-vm>:8080
```

Open `http://<vm-address>:8080` from any machine that can reach the VM.

## First sign-in

A **root** account is created on first run, with the password **`nutanix`**.

Sign in as `root`, then go to **Accounts** (top right) to manage everyone else.
Anyone can create their own account from the **Create one** link on the sign-in
page, so you usually only need root for administration.

> **Change the root password.** `nutanix` is a documented default, so anyone who
> can reach the server knows it. Use **Change password** on the Accounts page.
> The server and the Accounts page both warn you until you do.
>
> To avoid the default existing at all, set the password on the very first run:
> ```bash
> NST_ROOT_PASSWORD='something-else' node server/server.mjs     # Linux / macOS
> ```
> ```powershell
> $env:NST_ROOT_PASSWORD='something-else'; node server\server.mjs   # Windows PowerShell
> ```
> (The `VAR=value command` form is POSIX-shell syntax. It is a syntax error in
> PowerShell and cmd.exe, which is why the Windows line is spelled out.)
> (It is read only when the root account is created. After that, change it in the UI.)

## What root can do

From `/admin`:

| Action | Effect |
|---|---|
| **Reset password** | Issues a one-time password, shown once on screen. The user must set their own at next sign-in, and their sessions are ended. |
| **Disable / Enable** | Blocks sign-in and immediately ends any live session. Progress is kept. |
| **Make root / Make user** | Grants or removes administrator access. |
| **Delete** | Removes the account *and its progress*. Not reversible. |

The last remaining root account cannot be deleted, disabled or demoted — that
would lock everyone out of administration permanently.

## Performance

Text responses are compressed with brotli (falling back to gzip), which is
roughly a 59% saving across what the site actually sends:

| | on disk | over the wire |
|---|---|---|
| StarNix (one self-contained file) | 2868 KB | 1350 KB |
| The NCP-MCI question bank | 367 KB | 98 KB |
| WWTBANE's 3D library | 652 KB | 155 KB |

Fonts and images are sent as they are — they are already compressed, and running
them through brotli costs CPU to make them very slightly larger.

Compressed copies are cached in memory per file, so only the first request for
each pays for it. Nothing to configure.

## Updating

From `/admin`, signed in as root:

| Button | What it does |
|---|---|
| **Check for updates** | Asks GitHub what version is published and compares it with the one running. Changes nothing. |
| **Install update** | Downloads it, verifies it, installs it, and exits so the service restarts on the new code. |

This is the point of the feature: the VM usually can't reach GitHub *from a
browser*, which is why the server exists at all — but it can reach it from Node.

**Your database is never touched.** `server/data/`, `node_modules/` and `.git/`
are preserved across every update.

**A bad download can't break the install.** The archive is extracted to a temp
directory and checked against a manifest of files that must exist before
anything live is overwritten. If the download is truncated or wrong, the update
fails and the old copy keeps running.

**The update always comes from `holyscotsman/NST`.** That address is a constant
in `server/update.mjs` — no request can point it somewhere else.

After **Install update** the process exits on purpose. Under NSSM or systemd it
comes straight back on the new version; if you started it by hand in a terminal,
start it again yourself.

Extraction uses `tar`, which ships with Windows 10 / Server 2019+ and every
Linux. On anything older, update by re-cloning.

## Configuration

All optional, all environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `NST_PORT` | `8080` | Port to listen on |
| `NST_HOST` | `0.0.0.0` | Address to bind (`127.0.0.1` to allow only a local reverse proxy) |
| `NST_DB` | `server/data/nst.db` | Where the database file lives |
| `NST_ROOT_PASSWORD` | `nutanix` | Root's password, read **only** when the account is first created |
| `NST_ALLOW_SIGNUP` | on | Set to `0` to close self-registration; root then creates accounts |
| `NST_TRUST_PROXY` | off | Set to `1` **only** behind a reverse proxy, to read `X-Forwarded-For` / `-Proto` |

## Running it on Windows

The server itself is platform-neutral — the path guards, shutdown handling and
SQLite access are all exercised under Windows semantics in CI
(`scripts/path-guard-test.mjs` runs every case under `path.win32`). These are the
Windows-specific operational steps.

**1. Clone with line endings left alone.** The repo ships a `.gitattributes` with
`* -text` for this, so a normal clone is fine. If you cloned *before* that file
existed, git may have rewritten files to CRLF, which breaks `node build.mjs`
(it verifies the vendored assets by SHA-256). Repair an existing clone with:

```powershell
git rm --cached -r . ; git reset --hard
```

Check with `git config --get core.autocrlf` if you are unsure.

**2. Install Node 22 or newer** — the MSI from nodejs.org. `node --version` must
report v22+; `node:sqlite` is built in from 22, which is why there is nothing to
`npm install`.

**3. Open the port in Windows Firewall.** Nothing can reach the VM until you do,
and the failure looks like the server "not working" rather than a firewall block:

```powershell
New-NetFirewallRule -DisplayName "Nutanix Study Tool" -Direction Inbound `
  -Protocol TCP -LocalPort 8080 -Action Allow
```

**4. Put the database somewhere a service can write.** `C:\Program Files` is not
writable by a service account; `C:\ProgramData` is the convention:

```powershell
$env:NST_DB = 'C:\ProgramData\NST\nst.db'
```

**5. Run it as a Windows service** so it survives reboots and logoff. Windows has
no systemd; [NSSM](https://nssm.cc/) is the least-fuss wrapper:

```powershell
nssm install NST "C:\Program Files\nodejs\node.exe" "C:\nst\server\server.mjs"
nssm set NST AppDirectory C:\nst
nssm set NST AppEnvironmentExtra NST_PORT=8080 NST_DB=C:\ProgramData\NST\nst.db
nssm start NST
```

Environment variables go in `AppEnvironmentExtra`, **not** as a `VAR=value`
prefix — that syntax does not exist in cmd.exe or PowerShell.

To stop it: `nssm stop NST`. A hard kill is safe — SQLite is in WAL mode with
synchronous commits, so the next start recovers automatically.

**Port 8080 in use?** Windows reserves ranges for Hyper-V and WinNAT, and a bind
inside one fails with `EACCES` for no obvious reason. Check with
`netsh int ipv4 show excludedportrange protocol=tcp` and pick a port outside
those ranges via `NST_PORT`.

**Backups.** Use `/admin` → **Download a backup**: it needs no service stop, and
Windows will not let you copy a file SQLite holds open anyway. The manual route
(stop, copy `nst.db`, `nst.db-wal` and `nst.db-shm` together, start) is only for
when the server will not run.

## Keeping it running (Linux)

A minimal systemd unit:

```ini
# /etc/systemd/system/nst.service
[Unit]
Description=Nutanix Study Tool
After=network.target

[Service]
Type=simple
User=nst
WorkingDirectory=/opt/nst
ExecStart=/usr/bin/node /opt/nst/server/server.mjs
Environment=NST_PORT=8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now nst
sudo journalctl -u nst -f
```

## The database

Everything lives in `server/data/nst.db` (plus SQLite's `-wal` / `-shm`
companions). It is excluded from git, because it holds password hashes and
everyone's progress.

**To back it up: `/admin` → Download a backup.** One file, taken while people are
still using it, holding every account and everyone's progress. That is the whole
procedure — the older advice below is only for when the server will not start.

To restore one: stop the server, delete `nst.db`, `nst.db-wal` and `nst.db-shm`,
put the backup in their place named `nst.db`, and start it again. **Deleting the
other two matters.** A restored file sitting beside a stale `-wal` loses exactly
the changes you were trying to restore, silently.

By hand, without the server running: copy all three files together. Copying
`nst.db` alone while the service is up gives you a file whose recent writes are
still in `-wal` — a backup that looks fine and is quietly out of date. (This is
why the button uses SQLite's `VACUUM INTO`, which writes a fully checkpointed
single file with no companions.)

To start over, delete all three — a fresh root account is created on the next
start.

Each person's study data is stored the same way as the app's own
**Save backup file** export (`shared/nst-backup.js`), so the two are
interchangeable: a file exported from a browser can be restored into an account,
and vice versa.

## How it fits the existing app

Nothing in StarNix, WWTBANE or Practice Exams knows an account exists. They keep
using `localStorage` exactly as before, and `shared/nst-sync.js` mirrors that
store to the signed-in account: pull on load, push on change (debounced), and a
last push as the tab closes.

That has two consequences worth knowing:

- **The app still works if the network hiccups.** A dropped request means the
  next push catches up; nothing is lost mid-session.
- **The same build works both ways.** On GitHub Pages or `file://` there is no
  `/api/me`, so the sync module stays dormant and the tool behaves exactly as it
  always has.

## Security notes

Reasonable for an internal tool on a trusted network:

- passwords are stored as **scrypt** hashes with a per-user random salt — never plaintext
- session tokens are random 32-byte values, stored **hashed**, so database access alone does not yield a usable cookie
- cookies are `HttpOnly` + `SameSite=Strict`, and `Secure` when served over HTTPS
- repeated failed sign-ins are locked out on two keys: per IP *and* username
  (eight tries), and per address alone on a much looser limit, because a bot
  inventing a new username every request never repeats the first key. The
  attempt table itself is capped, so neither flood can exhaust the process
- sign-in failures are indistinguishable **in text and in time** — an unknown or
  disabled account burns the same scrypt as a real one, so the reply clock cannot
  be used to enumerate accounts either
- sign-up is rate-limited per address *before* the name lookup, the password hash
  or the insert, so it cannot be used to create accounts in bulk, pin the CPU, or
  mine "that username is already taken"
- a malformed `Cookie` header is parsed, never fatal — an undecodable value
  matches nothing instead of erroring the request
- state-changing forms carry a CSRF token
- the database, `.git`, and CI config are never served, to anyone

What it deliberately does **not** do:

- **No HTTPS of its own.** Over plain HTTP on an untrusted network, passwords
  travel in the clear. Put it behind a reverse proxy (nginx, Caddy) with TLS if
  it leaves a trusted LAN, and set `NST_TRUST_PROXY=1` so rate limiting sees real
  client addresses.
- No email, password reset by email, or 2FA. Root resets passwords by hand.

## Tests

```bash
node scripts/server-test.mjs
```

Spawns its own instance on a scratch port with a throwaway database, and checks
the whole surface — gating, traversal, account isolation, admin actions, CSRF,
throttling. It runs in CI.

```bash
node scripts/auth-test.mjs
```

The login layer on its own: cookie parsing against everything a client can send,
a real timing measurement of a known versus an unknown username, the ordering
proof that the sign-up gate runs before any expensive work, and a lockout that
has to survive someone flooding the attempt table to wash it out. Also in CI.

```bash
node scripts/robustness-test.mjs
```

Everything hostile or merely malformed a client can send, against one bar: the
process must not end. Also in CI.
