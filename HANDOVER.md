# Marsad Field — handover

Written 22 September 2026, at the end of the session that built this. It
covers what the app is, what was decided and why, and what is still open.

## What this is

A whole-building snagging app, built for **Crystal Four** — a G+4+roof
residential building in Wadi Al Safa 3, Dubai, 32 apartments. It shares a
codebase with the original single-unit SnaggingPro but runs as a completely
separate deployment: its own Cloudflare account, database, bucket and PWA
identity. **The original app must not be affected by anything done here.**

The core idea: **an area is a report.** Opening area `201` creates a report
with `job.ref = "CF-201"`. Everything that already worked for a single
apartment — photos, annotation, sync, the library, PDF generation — works
unchanged, because to the rest of the app an area is just another job.

## The register

`src/building/registry.ts` holds `CRYSTAL_FOUR`: 10 levels, **163 areas**.

| Level | Contents |
| --- | --- |
| UG | Tank, AC drain tank, pump room, sump, stair |
| G | Entrance, arcade, lobby, corridors, 32 parking bays, plant rooms, waste |
| L1–L4 | 8 apartments each + corridor, electrical, WM, TEL, TV, garbage, chute, FF recess, shaft, 2 stairs, 2 lift landings |
| R | Pool, kids pool, deck, gym, WCs, changing, shower, plant, store, watchman, pergola, roof slab |
| LM | Machine room, GRP tanks, booster set |
| LIFTS | Lift 1 and Lift 2, each with car, shaft, pit and the contractor's commissioning sheet |
| SYS | Chute shaft, FAHU, exhaust, condenser banks A–D, facade, fire, CCTV, intercom, drainage, water risers |

Apartments get the full multi-room set. Every other area is a single room
carrying its own checklist from `src/building/areaChecklists.ts`, keyed by
`AreaKind`.

Refs are unique building-wide, which is what makes the three-tablet split
safe — see below.

## Working with three tablets

The job is split by reference, not by floor, so two people can be on the
same level without ever touching the same area:

- Tablet 1 — the 32 apartments
- Tablet 2 — common areas, ground to L4
- Tablet 3 — underground, roof, lift machine level, building systems

The building systems belong to nobody by default. Assign them explicitly or
the facade never gets done.

Two mechanisms support this:

- **Cloud autosave** (`src/state/persist.ts`) pushes the working draft to
  the server on a 4s debounce, not just the finished report. Lose a tablet
  mid-apartment and the snags survive.
- **Remote index** (`src/sync/remote.ts`) pulls `GET /reports?since=` into a
  local cache so each tablet shows what the others have done, and warns
  before opening an area another device holds.

Deliberately **summaries only** — pulling a remote report's full state into
the local store would let this device overwrite another tablet's work on its
next autosave. Don't "improve" this without thinking that through.

## Cloudflare

Account `51f5c0aca4c0e775df767b081088a550`, under **osnaggingpro@gmail.com** —
separate from the orlostore account that hosts the original app and the shop.

| Resource | |
| --- | --- |
| D1 | `snaggingpro-buildings` · `27831acf-a5c1-4571-b45a-6770471c12d0` · APAC |
| R2 | `snaggingpro-buildings-photos` · ENAM (wrong region, see open items) |
| Pages | `snaggingpro-buildings` · Direct Upload · `snaggingpro-buildings.pages.dev` |

Bindings on the Pages project: `DB` → the D1 database, `PHOTOS` → the bucket.
`API_SECRET` is set as a Secret, and the same value is compiled into the
client as `VITE_APP_API_SECRET`. **They must match or sync silently fails.**
The client shows "Local only" in the footer when the secret is missing.

Deployments have been manual zips because the Cloudflare API is unreachable
from the build environment and the connector has no Pages tool. Connecting
the repo to Pages removes that entirely — production branch, `npm run build`,
output `dist`.

## Decisions worth knowing

**Scope.** In: civil/architectural, MEP, plumbing, fire alarm and fire
fighting, CCTV, intercom, lifts, pool. Out: testing and commissioning, BMS,
landscaping, access equipment, LPG/gas, telecom, MATV, access control.

Gas, telecom, TV and access control **rooms are still inspected as rooms** —
door, finishes, ventilation. It is the system inside that is excluded. The
register says so on those rows; keep it that way or an inspector will either
do unpaid work or skip the room.

**Regulated systems.** CCTV is inspected technically, never against SiRA.
Fire alarm and fire fighting likewise, never against Civil Defence. Both
carry an explicit waiver in the quotation and a matching note in the
checklists. Do not let anything in the app imply a compliance opinion.

**The lift commissioning sheet came from the client's contractor.** It is
theirs, not invented. Keep the original numbering — the paper and the app
get read side by side. Only page one (items 1–34) has been received.

## Open items

1. **Plan coordinates are wrong.** Measured but not fixed. See
   `tools/plans/README.md` — the core boxes on the typical sheet are out by
   up to 98 units, and L1 needs its own offset. This is the biggest
   outstanding job.
2. **R2 is in ENAM, not APAC.** Empty, so it is free to recreate in the
   dashboard with the right location hint. The connector's create tool takes
   no region parameter.
3. **Lift commissioning sheet is incomplete** — page one ends mid-table at
   item 34 "CWT run by". Chase the rest.
4. **CCTV contractor checklist** was promised and has not arrived. The
   current `cctv_system` list is a placeholder to be replaced by theirs.
5. **18 open design queries** are recorded on the register page, not in the
   app. They include a fire water storage volume that does not reconcile
   (89 m³ labelled against 47,800 imp gal stated), the two drawing sets
   swapping the stair numbers, 62 condensers drawn where 64 are needed, and
   a pool the HVAC sheet calls "future" while the architectural sheet shows
   it built. Several need answers before day one.
6. **Repo split.** This repo also holds the original single-unit app on
   `main`. The intention is for this app to live in its own GitHub under the
   snagging business, fully separate.

## Things not to break

- **Don't rename the IndexedDB database or the localStorage keys.** The
  product was renamed from SnaggingPro to Marsad Field; the storage keys
  were deliberately left alone, because changing them orphans every report
  and photo already on a device. Backup files write the new marker but still
  accept the old one.
- **Don't let the plan refs and the register drift apart.** The supervisor
  matches paper to tablet by reference. If you add an area, draw it.
- **Don't give the shared lift machine room two entries.** Both lifts use
  one room. It is `LM-LMR`, once.
