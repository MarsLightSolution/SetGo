# SetGo — Deployment Runbook

This is the accurate, current process for deploying SetGo to production. It replaces
`PRODUCTION_DEPLOYMENT_SUMMARY.md` (Jan 2026, references the old `tiwari.shop` domain and
doesn't describe the actual server workflow) as the thing to follow when deploying.

Written after a real deploy on 2026-09-11 that surfaced several gaps in the old process —
see [Known Issues](#known-issues--found-2026-09-11) at the bottom for what was found and fixed,
and what's still outstanding.

---

## 1. Architecture

One EC2 instance runs everything:

| Service | How | Port | Domain |
|---|---|---|---|
| Frontend (static build) | nginx serves `Frontend/dist` directly | — | `satgo.az`, `www.satgo.az` |
| Backend API | PM2 (`setgo-backend`) | 8080 | `api.satgo.az` |
| Payment microservice | PM2 (`setgo-payment`) | 5001 | `payment.satgo.az` |
| MongoDB | Atlas (external) | — | — |
| Redis | Redis Cloud (external) | — | — |

- **Server**: AWS EC2, region **eu-north-1 (Stockholm)** — not us-east-1, check the region
  selector in the AWS console if you don't see it under EC2 → Instances.
- **SSH user**: `ubuntu`
- **Repo path on server**: `~/SetGo` (i.e. `/home/ubuntu/SetGo`)
- **Process manager**: PM2, config at `ecosystem.config.js` (repo root)
- **Reverse proxy / TLS**: nginx + Certbot (Let's Encrypt, auto-renewing)
- **SSL**: already live for all three domains. Don't re-run `certbot --nginx` unless you
  actually need to add/change a domain — see [nginx config drift](#2-nginx-config-drifted-from-what-was-actually-deployed) below.

---

## 2. The branch strategy

This repo has **two lines of history that matter for deployment**:

- **`main-2`** — the actual development branch. PRs land here.
- **`production/<timestamp>`** — one-off snapshot branches, each containing a full pre-built
  `Frontend/dist/` committed alongside the source (normally `dist/` is gitignored; these
  branches force-add it with `git add -f`). The server always has one of these checked out.
  A new one is created by `scripts/deploy-production.sh` every time you deploy — never commit
  directly to an existing `production/*` branch.

**Important**: as of 2026-09-11, `main-2` and the `production/*` lineage were badly diverged —
`main-2` was missing real, already-live pages (`About.jsx`, `Contact.jsx`, `PrivacyPolicy.jsx`,
`RefundPolicy.jsx`, a simplified `Footer.jsx`, an Admin panel rewrite, `vite.config.js` changes)
because `scripts/`, `ecosystem.config.js`, and `nginx/satgo.conf` had *only ever existed on
production branches* and were never merged back. This has now been fixed — `main-2` has
everything merged in and the deploy tooling now lives on `main-2` too, so **from now on,
always branch/deploy from `main-2`** and this shouldn't recur, provided each deploy's
production branch keeps getting its source changes contributed back the normal way (PR into
`main-2`, not committed straight onto a `production/*` branch).

---

## 3. How to deploy — step by step

Run this from a machine that has the repo cloned, push access to GitHub, Node 18+, and can
reach the server over SSH. (It does **not** need to be the server itself — building on a dev
machine avoids taxing the EC2 box's very limited RAM, see [§5](#5-server-resource-limits).)

### 3.1 Make sure `main-2` is what you want to ship

```bash
git checkout main-2
git pull origin main-2
# merge/land your feature branch into main-2 here (PR, or a clean fast-forward merge)
```

Working tree must be clean (no untracked or uncommitted files) — the deploy script will warn
and prompt if not, and the prompt hangs forever in a non-interactive shell.

### 3.2 Run the deploy script

```bash
bash scripts/deploy-production.sh
```

This does, in order:
1. Preflight checks (clean tree, `git`/`node`/`npm` present, remote reachable)
2. `npm run build` in `Frontend/` (this is when you'd see build errors — fix and re-run)
3. `node --check` on `backend/index.js` and `payment-microservice/src/app.js` (syntax only,
   not a real test)
4. Creates a new branch `production/<UTC-ish timestamp>` off the current commit
5. Force-adds `Frontend/dist/`, commits, pushes to `origin`
6. Switches back to your original branch

You'll get a branch name like `production/2026-09-11-182551` and a reminder of the next step.

### 3.3 Deploy it on the server

```bash
ssh ubuntu@<server-ip>
cd ~/SetGo
git fetch origin production/<the-branch-from-3.2>
git checkout production/<the-branch-from-3.2>
bash scripts/pm2-start.sh
```

`git checkout` here is the actual cutover — it swaps `Frontend/dist` on disk (nginx serves it
directly, so this takes effect immediately) and updates `backend/`/`payment-microservice/`
source. `pm2-start.sh` then does `npm install --omit=dev` in both service dirs and
zero-downtime-reloads (`pm2 reload`) if they're already running.

**Before you run the checkout**, check `Frontend/dist` is owned by `ubuntu`, not `www-data`:

```bash
ls -ld ~/SetGo/Frontend/dist
# should show: drwxr-xr-x  ...  ubuntu ubuntu  ...
# if it shows www-data, fix it first:
sudo chown -R ubuntu:ubuntu ~/SetGo/Frontend/dist
```

If you skip this, `git checkout` **fails silently on individual files** (prints
`error: unable to create file ...: Permission denied` per file but still reports success on the
branch switch) and you end up with a broken mix of old and new build assets being served. See
[§1 in Known Issues](#1-distdir-permission-drift-broke-a-checkout-mid-deploy) for the full story.

### 3.4 Verify

```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://satgo.az/
curl -sk -o /dev/null -w '%{http_code}\n' https://api.satgo.az/config/app
pm2 list          # both setgo-backend and setgo-payment should show "online"
pm2 logs --nostream --lines 30
```

Also spot check that the built JS actually contains what you expect, e.g. after a text change:

```bash
grep -rl "some distinctive string you just changed" ~/SetGo/Frontend/dist/assets/js/
```

---

## 4. House-keeping

### Logs

`backend/logs/{app.log,error.log}` and `backend/logs/pm2/backend-out.log` have **no rotation
and no size cap**. They grew to ~1GB combined before being manually truncated on 2026-09-11
(mostly from a Redis connection error repeating every ~2s — see
[Known Issues §4](#4-redis-connection-is-failing-continuously)). Until that's fixed at the
source, periodically check and truncate:

```bash
df -h ~                                    # check usage first
du -sh ~/SetGo/backend/logs/*
: > ~/SetGo/backend/logs/error.log         # truncate in place — do NOT rm, PM2 has the
: > ~/SetGo/backend/logs/app.log           # file open and rm only frees space once the
: > ~/SetGo/backend/logs/pm2/backend-out.log  # process restarts
```

Truncating in place (`: > file`) keeps the same inode so PM2 keeps writing correctly without a
restart; `rm` would leave PM2 writing to a deleted, invisible file that never frees the disk
until the process restarts.

### Stray build artifacts

`Frontend/dist/` on the server accumulates untracked files across deploys — files from old
hashed builds that were never part of any single commit just sit there forever since `git
checkout` only touches tracked paths. As of 2026-09-11 there were **~100+ stray files**. Not
harmful (nginx only serves what `index.html` references), but wastes disk. To clean safely:

```bash
cd ~/SetGo
git clean -ndx -- Frontend/dist    # dry run — review the list first
git clean -fdx -- Frontend/dist    # actually delete, then re-run `git checkout -- Frontend/dist`
                                    # to restore only what's actually tracked at HEAD
```

### Old production branches

Nine `production/*` branches exist on GitHub as of 2026-09-11, each a full commit with a built
`dist/`. Not urgent, but consider deleting the old ones periodically (`git push origin
--delete production/2026-03-27-184422`, etc.) once you're confident you won't need to roll back
to them.

---

## 5. Server resource limits

The EC2 instance is small: **2 vCPU, ~900MB RAM, no swap configured**, disk **6.8GB total**.
- `npm run build` for the frontend is memory-hungry — prefer building on a dev machine and
  pushing the pre-built `production/*` branch (per §3) rather than building on the server.
- If you ever do need to build on the server, consider adding a temporary swap file first as a
  safety net against OOM:
  ```bash
  sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  ```

---

## Known Issues — found 2026-09-11

Investigation done alongside a routine content deploy. Fixed items are marked ✅; open items
need a decision from whoever owns infra/secrets access.

### 1. `dist/` ownership drift broke a checkout mid-deploy — ✅ fixed this time, can recur

`Frontend/dist` was owned by `www-data:www-data` instead of `ubuntu:ubuntu` (most likely from
an earlier manual `sudo chown` done to let nginx write there, which it never needed — nginx
only needs read access, which world-readable `drwxr-xr-x` already grants). This silently broke
`git checkout` on the new production branch: files that needed to be newly created failed with
`Permission denied` while stale old-hash files were left behind, so the live site briefly served
a broken mix of old and new JS bundle references. Fixed via `sudo chown -R ubuntu:ubuntu
~/SetGo/Frontend/dist`, documented in §3.3 above so it doesn't happen silently again.

### 2. nginx config drifted from what was actually deployed — ✅ fixed

The repo's `nginx/satgo.conf` was the pre-SSL "HTTP only, step 1" version (161 lines). The
actual file on the server, `/etc/nginx/sites-available/satgo.conf` (223 lines), had SSL blocks
that Certbot added directly on the server when it was set up — and that change was never copied
back into git. If the server were ever rebuilt from this repo, SSL would silently be missing.
**Fixed**: `nginx/satgo.conf` now matches the live config exactly (synced 2026-09-11).

### 3. Payment microservice is crash-looping — 🔴 open, needs a decision

`setgo-payment` was already in PM2's crash-restart loop (`waiting…`, pid 0, restart count in the
40s-50s) *before* this session touched anything — confirmed via the restart counter on first
inspection. Cause:

```
Error: ENOENT: no such file or directory, open './keys/private.pem'
```

`payment-microservice/keys/` doesn't exist on the server at all. This key is required by
`payment-microservice/src/services/crypto.service.js` to sign/verify payment requests presumably
to Paymentwall/Azericard.

**Notable**: `git log --all` shows `payment-microservice/keys/private.pem` *was* committed to
this repo at one point (`ed2ef65`, "initial micro service model") and later untracked via
`git rm --cached` when `.gitignore` was updated (`391b127`) — but history was never rewritten/
force-pushed, so **the key is still fully recoverable from git history** by anyone with repo
access. This is both a possible quick fix (restore the file from `ed2ef65` if it's still the
right key) and a security exposure that should be addressed regardless:

- Decide whether the key in `ed2ef65` is still the one Paymentwall/Azericard expects. If yes,
  restore it to `payment-microservice/keys/private.pem` (and `public.pem`) on the server —
  **do not commit it back to git**, it stays server-only per `.gitignore`.
- If it's stale/rotated since, a new keypair needs to be generated and the public half
  re-registered with the payment provider — this is a business/ops decision, not something to
  do unilaterally.
- Either way, consider the old key compromised (it sat in git history, possibly pushed to
  GitHub) and worth rotating regardless of whether it's the current one.

### 4. Redis connection is failing continuously — 🟡 open, not blocking

```
Redis Client Error getaddrinfo ENOTFOUND redis-14708.c239.us-east-1-2.ec2.redns.redis-cloud.com
```

Repeats every ~2 seconds in `backend` logs. The backend still starts and serves requests fine
(MongoDB connects, HTTP API responds), so this looks like a caching/session layer that fails
open — but it's the direct cause of the multi-GB log growth in §4 of House-keeping. Worth
checking whether the Redis Cloud instance expired or DNS/network changed. `backend/.env` has
`REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` — not reproduced here since it's a secrets file.

### 5. No log rotation configured — 🟡 open

Neither the winston logger (`app.log`/`error.log`) nor PM2's own output
(`backend-out.log`) has any max-size or rotation policy. Combined with #4 above, this is what
caused the ~1GB log bloat. Options: `pm2 install pm2-logrotate`, or configure winston with
`maxsize`/`maxFiles` (e.g. via `winston-daily-rotate-file`).

### 6. `main-2` / `production/*` divergence — ✅ fixed, watch for recurrence

Covered in [§2](#2-the-branch-strategy) above.
