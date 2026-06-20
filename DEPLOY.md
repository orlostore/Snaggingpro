# SnaggingPro — Cloudflare Deploy Guide

The app lives on **Cloudflare Pages**. From PR #38 onward the same Pages project also serves the API as **Pages Functions** (the `functions/` directory at the repo root). Backend storage is **D1** (SQL) for metadata and **R2** for photo blobs.

One Pages project, one deploy, one origin. No CORS plumbing.

---

## One-time setup

Run these from your workstation (not the remote container). You'll need [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and logged in.

```bash
npm install -g wrangler
wrangler login
```

### 1. Create the D1 database
```bash
wrangler d1 create snaggingpro
```
Wrangler prints a `database_id`. Open `wrangler.toml` and paste it under `[[d1_databases]]`.

### 2. Run the schema
```bash
# remote (production)
wrangler d1 execute snaggingpro --remote --file=migrations/0001_init.sql
# also local (for `wrangler pages dev`)
wrangler d1 execute snaggingpro --local --file=migrations/0001_init.sql
```

### 3. Create the R2 bucket
```bash
wrangler r2 bucket create snaggingpro-photos
```

### 4. Wire the bindings on Pages

Cloudflare dashboard → **Workers & Pages** → your `snaggingpro` Pages project → **Settings → Bindings**:

| Binding | Type | Value |
|---|---|---|
| `DB` | D1 | `snaggingpro` |
| `PHOTOS` | R2 | `snaggingpro-photos` |

Or run from your machine:

```bash
wrangler pages project create snaggingpro                     # only if not created yet
wrangler pages deploy dist                                    # first deploy (uses bindings from this wrangler.toml)
```

### 5. Set the API secret
Pick a long random string (e.g. `openssl rand -hex 32`). Store it in two places:

**On Cloudflare Pages** (production secret):
```bash
wrangler pages secret put API_SECRET --project-name snaggingpro
```
(paste the secret when prompted)

**In your Pages env vars for the build** so the client knows the same value:
- Cloudflare dashboard → Pages project → **Settings → Variables and secrets**
- Add a **plaintext** variable named `VITE_APP_API_SECRET` with the same value.
- *(Yes, it ends up in the JS bundle. That's OK while you're the only user — anyone with the URL would have to know this secret to talk to the API. The PIN gate remains the user-facing lock. When real auth lands in a future PR, this variable goes away.)*

### 6. Redeploy
```bash
git push origin main      # Pages auto-builds + functions deploy together
```

---

## Local development

```bash
npm run dev               # vite dev server (no functions, no D1/R2)
npm run dev:cloud         # wrangler pages dev — runs Vite + functions locally
                          # against local D1 + R2 emulators
```

The "dev:cloud" mode is the closest thing to production. It mounts the bindings from `wrangler.toml` and serves both the SPA and the API on one port.

---

## Files in this PR

```
functions/
├── _middleware.ts          Verifies X-SP-Secret on every /api/* request
├── types.ts                Shared Env + DTO types + json/err helpers
├── tsconfig.json           Workers-runtime tsconfig (excluded from app build)
└── api/
    ├── reports/
    │   ├── index.ts        GET (list summaries) + POST (upsert)
    │   └── [id].ts         GET (full state) + DELETE (cascade R2 photos)
    └── photos/
        └── [id].ts         GET (R2 stream) + PUT (upload) + DELETE

migrations/
└── 0001_init.sql           reports + photos schema

wrangler.toml               Pages project config + D1/R2/secret placeholders
```

---

## Next PRs in this phase

- **PR #2** — client-side cloud adapter behind `reportsRepo`, IndexedDB becomes a write-through cache + offline queue
- **PR #3** — migration screen: list of local reports with per-row checkboxes to upload selected
