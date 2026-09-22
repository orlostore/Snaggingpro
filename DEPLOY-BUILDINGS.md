# SnaggingPro Buildings — deployment

This branch (`buildings`) is a **separate app** from the original SnaggingPro.
It shares the codebase so checklist and photo improvements benefit both, but it
deploys to its own URL with its own database and its own bucket. Nothing here
can touch the live single-unit app or its data.

## What makes it separate

| | Original | Buildings |
|---|---|---|
| Branch | `main` | `buildings` |
| Pages project | `snaggingpro` | `snaggingpro-buildings` |
| D1 database | `snaggingpro` | `snaggingpro-buildings` |
| R2 bucket | `snaggingpro-photos` | `snaggingpro-buildings-photos` |
| PWA name | SnaggingPro | SnaggingPro Buildings |
| Home-screen icon | navy | **deep blue building mark** |

Different name and different icon matter: both apps will be installed on the
same phone, and they must be told apart at a glance.

## One-time setup

1. **Create the storage** (from the Cloudflare dashboard, or wrangler):
   ```
   npx wrangler d1 create snaggingpro-buildings
   npx wrangler r2 bucket create snaggingpro-buildings-photos --location apac
   ```
   Use the **APAC** location hint — the users and the data are in the UAE.
   Put the returned database id into `wrangler.toml`.

2. **Apply the schema** to the new D1:
   ```
   npx wrangler d1 execute snaggingpro-buildings --remote --file migrations/0001_init.sql
   npx wrangler d1 execute snaggingpro-buildings --remote --file migrations/0002_acknowledgements.sql
   ```

3. **Create the Pages project** `snaggingpro-buildings`:
   - Production branch: `buildings`
   - Build command `npm run build`, output `dist`, Node 22
   - Bindings: `DB` → the new D1, `PHOTOS` → the new R2 bucket
   - Variables: `VITE_APP_PIN`, `VITE_BUILD_VERSION`, and the
     `API_SECRET` secret (a **new** secret, not the one the original uses)

## Installing on a phone

Open the deployed URL in Chrome or Safari and choose *Add to Home Screen*.
It installs as a separate app beside the original — separate icon, separate
storage, separate service worker. Signing in to one does not affect the other.

The marked-up level plans are precached, so the register and the plans work
with no signal — which is the normal condition in a basement or a plant room.

## The register

`src/building/registry.ts` holds the Crystal Four register: 158 areas across
nine levels, with refs that match the bubbled refs on the plan sheets in
`public/plans/`. To add another building, add a `BuildingDef` to that file —
no other code changes.
