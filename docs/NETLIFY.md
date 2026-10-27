# Hosting on Netlify

Site: <https://nutanix-study-tool.netlify.app>. Static pages come from `dist/` (built by
`scripts/netlify-build.mjs`, which publishes a whitelist only). Accounts run as a Netlify Function
(`netlify/functions/app.mjs`) on Netlify Database (Postgres). An edge function (`netlify/edge-functions/ncm-gate.mjs`)
gates `/ncm-practice/*` to signed-in users and fails closed.

## Accounts
Sign-in is optional. Signed out, everything works from the browser's storage. Signed in, `shared/nst-sync.js`
syncs progress through `/api/me` and `/api/progress`. Tables are prefixed `nst_`; migrations are in
`netlify/database/migrations/` (never edit an applied one; add a new file).

## Environment variables
- `NST_SETUP_TOKEN` — required once. Open `/setup`, enter it, choose the administrator username and password.
  `/setup` returns 404 once an administrator exists; delete the variable afterwards.
- `NST_ALLOW_SIGNUP=0` — optional; closes public sign-up (the administrator can still add users at `/admin`).

## Deploy
Connect the repo in Netlify (build command and publish dir come from `netlify.toml`), or use the Netlify
connector's `deploy-site`. Env-var changes need a new deploy to take effect.

## Local development
`npm install`, then `npm install --no-save @netlify/database-dev` and run
`node scripts/netlify-app-test.mjs` (real Postgres, in-process) and `node scripts/netlify-site-test.mjs`.
