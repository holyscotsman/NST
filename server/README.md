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
> `NST_ROOT_PASSWORD='something-else' node server/server.mjs`
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

## Keeping it running

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

To back it up, stop the service and copy the three files, or use SQLite's own
`.backup` if you have the `sqlite3` CLI. To start over, delete them — a fresh
root account is created on the next start.

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
- repeated failed sign-ins are locked out per IP and username
- sign-in failures are deliberately indistinguishable, so usernames cannot be enumerated
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
