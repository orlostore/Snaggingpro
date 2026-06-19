# SnaggingPro

> Mobile-first property condition assessment PWA for UAE handover and DLP inspections.
> Live at **https://snaggingpro.pages.dev**

A single-file HTML/JS/CSS progressive web app for snagging inspections of UAE villas, townhouses, and apartments. Generates branded PDF condition reports with snag IDs, severity tiers, photos, and a critical-items summary.

---

## Quick facts

| | |
|---|---|
| **Live URL** | https://snaggingpro.pages.dev |
| **Hosting** | Cloudflare Pages (GitHub auto-deploy) |
| **Stack** | Single HTML file. Vanilla JS. No build step. No framework. |
| **Storage (current)** | `localStorage` only — local to one device |
| **Inspection fee** | AED 3,355 per villa (target market: handover & 11-month DLP review) |
| **Operator** | One inspector. UAE FM background, 20+ years. Bilingual EN/AR. |

---

## Repository contents

```
/
├── index.html       Main PWA — full app in one file (~2,340 lines)
├── terms.html       Terms of Engagement page (linked from setup screen)
└── README.md        This file
```

No build tooling. No npm. No package.json. Edit `index.html` directly, push to GitHub, Cloudflare deploys.

---

## Architecture in one paragraph

`index.html` is a single-file PWA. The entire app — splash screen, PIN gate, setup, dashboard, room inspection, photo capture + annotation, PDF report — lives in one file. State lives in a global `STATE` object persisted to `localStorage` on every change. Room types and their inspection checklists are defined in a `CL` object. `buildRooms()` decides which rooms to show for the chosen property type. `generateFullReportHTML()` returns the printable report as an HTML string opened in a new window for the user to print/save as PDF.

---

## Roadmap — phase status

| Phase | Status | Contents |
|---|---|---|
| **Baseline (v0)** | ✅ Live | Original 1,863-line file currently deployed |
| **Phase 1A** | ✅ Built — awaiting deploy | R1, R2, R3, R5, R9 + DB Panel(s) with multi-instance |
| **Phase 1B** | ⏳ Pending | R4 (guided discipline flow), R6 (light theme — DEFERRED by user) |
| **Phase 2** | ⏳ Pending | R7, R8, P2.1–P2.10 (cloud backend, report library, follow-up inspections, standards) |

---

## Phase 1A — Built, not yet deployed

All five items in this section are already implemented in `index.html`. They need to be tested on a real Sunday off-day before being used in a paying inspection.

### R1 — Pre-PDF spellcheck

**Problem solved:** Repeated typos in field notes that shipped to clients (`costing→coating`, `funtional→functional`, `upstad→upstand`, `Nit→Not`, `Ironmongert→Ironmongery`, `is fix→is fixed`, `lose→loose` with object noun).

**Implementation:**
- 18-pattern `TYPO_RULES` array (regex + suggested fix, case-preserving where relevant)
- `scanForTypos()` walks every observation note and pass-item note across non-excluded rooms
- Bottom-sheet modal appears when "Generate Report" is tapped, IF any typos found
- Each issue shows: room, item, snag ID, original text with typo highlighted in orange, suggested fix in green
- Three actions per issue: **✓ Choose** (accept fix) / **✎ Adjust** (edit manually) / **Approve as-is** (keep)
- Clean text triggers no modal — straight to PDF
- Word list grows over time as new typos are observed in real reports

**Where to add new typos:** `TYPO_RULES` array near the bottom of the script section.

### R2 — Room exclusion toggle ("N/A")

**Problem solved:** Reports listed all expected rooms even when the unit didn't have them (e.g., balconies for ground-floor villas). Looked sloppy.

**Implementation:**
- Small "N/A" button on every room card on the dashboard
- Tap → confirms if room has data (to prevent accidental loss), then sets `rd.excluded = true`
- Excluded rooms grey out on dashboard, labelled "NOT APPLICABLE"
- Tap again → restored
- Filtered out of stats, progress bar, `bakeAllAnnotations()`, `buildReport()`, `generateFullReportHTML()`
- Cover page shows excluded rooms in a "Not Applicable to This Property" callout for audit trail

### R3 — Guest's Washroom

Added as a separate room type to `buildRooms()`. Auto-appears for villas/townhouses and any 2+ BR apartment. Uses the existing `bathroom` checklist (per-item N/A handles shower-not-present case).

### R5 — Villa/townhouse-only rooms

Four new room types appear **only** when Property Type = Villa/Townhouse:

| Room | Disciplines | Item count |
|---|---|---|
| **Booster Pump Room** | Civil, Mechanical, Electrical | 21 |
| **Water Tank (Ground/Underground)** | Civil, Mechanical, Plumbing | 13 |
| **Water Tank (Roof)** | Civil, Mechanical, Plumbing | 13 |
| **Solar Water Heater** | Civil, Mechanical, Electrical, Plumbing | 12 |

New `mechanical` discipline added to `DISC_LABELS` for pumps, vessels, valves.

### R9 — Handover Documents page in PDF

Added between Scope & Disclaimer and room sections. Three boxed sections with magenta headings:

- **Warranties & Guarantees** (8 checkboxes — DLP, waterproofing 10yr, structural 10yr, MEP, manufacturer warranties, solar heater, booster pump, smart home)
- **Operation & Maintenance Manuals** (7 checkboxes — HVAC, booster pump, water heater, solar heater, kitchen appliances, smart home, pool/landscape)
- **Other Important Documents** (5 checkboxes — as-builts, Civil Defence cert, completion cert, DEWA/SEWA/FEWA, title deed/Oqood)

Closes with italic: *"SnaggingPro recommends retaining copies of all the above documents for the life of the property. Lost warranties cannot be re-issued."*

### Bonus: DB Panel(s) with multiple instances + edit pencil

Restructured how DB Panels are handled. Previously: single "DB Panel" room. Now: single "DB Panel(s)" room containing multiple **instances**, each with their own copy of the full electrical checklist.

- **Apartments:** 1 instance ("DB Panel 1", no location suffix)
- **Villas/townhouses:** 2 instances by default ("DB Panel 1 — GF", "DB Panel 2 — FF")
- **+ Add DB Panel** button at the bottom of the DB Panel room → prompts for optional location → auto-numbers (3, 4, 5...)
- **✎ Edit pencil** on each sub-header → edit location text after the fact
- Sub-headers visually group items by instance in both the room view AND the report
- All-N/A instances show as "NOT APPLICABLE" in the report (clean way to handle single-floor villas without removing the audit trail)
- Snags from each instance are prefixed in the report snag block (e.g., "DB Panel 2 — FF · MCBs partially labelled")

**Implementation details:**
- `rd.dbInstances = [{num, location}, ...]` array on the room state
- Item keys suffixed with `_dbN` for uniqueness (e.g., `electrical_0_db1`, `electrical_0_db2`)
- Items tagged with `item.dbNum` for grouping
- Numbering uses `Math.max(...nums) + 1` so N/A'd instances don't cause renumber issues

---

## Phase 1B — Pending

### R4 — Guided discipline flow

**Problem to solve:** Inspector missed items in rooms during real inspections because the current UI doesn't enforce or remind about discipline completion.

**Approach (decided): soft-strict, not hard-blocked.**

- Inside a room, items grouped by discipline tabs in this order: **Civil → Electrical → HVAC → Plumbing → Mechanical** (where applicable)
- Default landing tab = Civil
- Each tab shows a progress pill: *"5/8 inspected"*
- Trying to leave room with untouched items → modal: *"Civil: 3 items pending. Continue anyway?"* with [Stay] / [Leave anyway]
- Finishing a discipline (all items marked) → toast: *"Civil complete ✓ — go to Electrical?"* [Next discipline] / [Stay]
- All disciplines done → green banner: *"Room complete ✓"* [Next room] / [Back to room list]
- **Reopen-room-later remains possible** — must not break.

### R6 — Light theme + sun mode

**Deferred by user decision.** User confirmed "leave looks now" — current dark theme stays. Re-open this if outdoor readability becomes a blocker.

**Original spec, if reactivated:**
- Light theme as default (white bg, dark text, magenta brand stays)
- Quick-access "sun mode" button — one tap to max-contrast bright-on-bright
- Bigger fonts (16–18px minimum), bigger touch targets (44×44px minimum)
- PDF report styling already fine — user confirmed.

---

## Phase 2 — Pending (Cloudflare backend project)

### R7 — Hybrid auto-save (local + cloud)

- Every change saves to local storage immediately (already exists)
- Background sync to cloud every 30 seconds, or when signal returns
- Dual status indicator: "Saved ✓" (on phone) and "Synced ☁" (on cloud)
- No manual save button needed

### R8 — Report library + follow-up inspection

**Problem to solve:** Once a report is generated, the data is gone. Cannot re-open old jobs, cannot do 11-month DLP follow-up reviews, no searchable history of customer inspections.

**Decided approach:**

**Storage:** Cloudflare D1 (SQL) for metadata + Cloudflare R2 (object storage) for PDFs and photos. Same Cloudflare account as Pages. Frankfurt region preferred for data residency.

**Reports Library screen** — new section on dashboard:
- Searchable list of all completed reports
- Per row: Client name · Project/Unit · Date · Total snags · Critical count
- Search by client name, project, unit, date range, or phone

**Report detail screen** (tap a row):
- Customer details (name, phone, email, inspection reason)
- Property details (developer, project, unit, BUA, fee)
- Summary stats (KPI tiles like cover page)
- Re-download PDF
- Re-export HTML
- View / edit observations (for follow-up snag checks)
- **Clone as new inspection** (same client buying another unit, or re-inspection visit)

**Follow-up inspection mode:**
- From a past report → tap "Start Follow-Up Inspection"
- New job created, pre-populated with all snags from the original
- Each original snag gets a status toggle: **Fixed / Still Open / New Issue**
- Cover page marked: *"Follow-Up Inspection — DLP Review"* (or similar)
- Pricing: separate fee (TBD — possibly AED 2,000 for DLP review vs AED 3,355 for handover snag)

**PDPL compliance (UAE Federal Decree-Law 45/2021):**
- Privacy notice on first use ("we store your inspection report for X years")
- Data retention period: suggest 7 years (matches UAE commercial record-keeping)
- Data region: EU or Asia, locked
- Terms of Engagement (`terms.html`) needs updating to cover this when R8 ships

**Auth:** Login required for library access (so reports follow inspector across phones/devices). Suggest Cloudflare Access or a simple email-magic-link via Workers.

### P2.1 — UAE regulatory standards page

Reference the actual codes inspected against, not just visual observation:

- Dubai Civil Defence Fire & Life Safety Code
- DEWA Regulations for Electrical Installations
- Dubai Municipality Building Code
- ESMA standards (appliances, water fixtures)
- Trakhees / DCCA (for free zone units)
- DLD / RERA (handover acceptance)
- ASHRAE 55 & 62.1 (thermal comfort, ventilation)
- CIBSE Guides (MEP)
- NFPA standards (fire safety)

Each room/discipline section should reference the relevant standard at top.

### P2.2 — Methodology page per discipline

Document *how* each discipline is inspected:

- **Civil** — visual inspection method, tile hollowness via tapping, level via digital level, crack measurement, plumb/alignment standards
- **Electrical** — socket polarity (HT106 tester), insulation resistance if megger used, thermal imaging of DB panels
- **HVAC** — supply air <14°C pass mark, vent velocity via anemometer, 60 dB conversational baseline, thermal scan for duct leakage
- **Plumbing** — flow at fixtures, drain test, TDS reading per faucet, leak inspection, fall-to-drain on wet areas

### P2.3 — Equipment & instrumentation page

Inspector's toolkit with photos:
- IR thermometer
- Anemometer (UNI-T UT363S)
- Sound level meter
- Thermal imaging camera (FLIR)
- Socket tester (HT106-style)
- TDS / water quality meter (HM Digital TDS-EZ)
- Moisture meter (Extech MO210)
- Spirit level (magnetic pocket)

Each tool: brand, model, last-calibration date if applicable.

### P2.4 — Inspection scope & exclusions

Explicit lists of what is and is not inspected. Limitations clearly stated (visual only, time-bound to inspection date, weather-dependent items, no concealed services without dismantling).

### P2.5 — Severity definitions

Define the three tiers explicitly so developers cannot dispute:

- **CRITICAL** — safety risk, system non-functional, water/structural integrity compromised, fire/electrical hazard. Must be rectified before handover acceptance.
- **MAJOR** — significant defect affecting function, appearance, or longevity. Should be rectified during DLP.
- **MINOR** — cosmetic or workmanship issue. Recommended for rectification during DLP.

### P2.6 — DLP guidance page

Short page explaining the Defects Liability Period (typically 12 months in UAE), how to submit defects to the developer, what's covered, recommended timing for a follow-up inspection at month 11.

### P2.7 — Inspector credentials

Sign-off page upgrade:
- Inspector name
- 20+ years UAE FM experience
- Notable properties (with discretion)
- Professional certifications (IFMA, BIFM, MEP-specific where held)
- Trade license number for SnaggingPro

### P2.8 — Trade-specific recommendations

Each snag tagged with the specific trade required (Carpenter / Tile contractor / MEP / HVAC / Glazier / Painter / Civil works) — not the generic "qualified professional" of competitors.

### P2.9 — Photographic standards

Document the photo methodology: wide shot + close-up per snag, red-circle annotation convention, reference scale where applicable.

### P2.10 — Report numbering & traceability

- Report version control (R1, R2, R3... like the current SP-XXXXXX-YYY format)
- Re-inspection cross-references (link old SP-### to new findings)
- Audit trail of changes between versions

---

## Tech notes for future code work

### Where things live in `index.html`

| What | Approximate location | Key identifiers |
|---|---|---|
| CSS variables (colours, fonts) | Top `<style>` block | `:root { --dark: ..., --magenta: ... }` |
| Room checklists | Inside the script | `const CL = { kitchen: {...}, bathroom: {...}, ... }` |
| Discipline labels | Inside the script | `const DISC_LABELS = {...}` |
| Property pricing | Inside the script | `const PRICING = {...}` |
| Room library logic | Inside the script | `function buildRooms(propType) {...}` |
| State initialiser | Inside the script | `function initRooms(propType) {...}` |
| Dashboard renderer | Inside the script | `function renderDashboard() {...}` |
| Items list renderer | Inside the script | `function renderItemsList(disc) {...}` |
| Report generator | Inside the script | `function generateFullReportHTML() {...}` |
| Spellcheck rules | Inside the script | `const TYPO_RULES = [...]` |

### State shape

```
STATE = {
  jobRef, propType, clientName, phone, developer, community, unit, floor,
  bua, price, date, coverPhotos: [3 slots],
  roomList: [ {id, label, icon, clKey, discs, custom?}, ... ],
  rooms: {
    [roomId]: {
      excluded: bool,             // R2 — room not present in this unit
      overviewPhoto: string,
      items: {
        [itemKey]: {
          label, disc, status, note, observations: [], photos: [],
          dbNum?: number          // only on items inside DB Panel(s) room
        }
      },
      dbInstances?: [             // only on DB Panel(s) room
        { num: 1, location: 'GF' },
        { num: 2, location: 'FF' }
      ]
    }
  }
}
```

### Constraints / gotchas

- **No build step.** Everything is one file. Edits go directly.
- **No frameworks.** Vanilla JS only. Avoid introducing libraries — keeps the file portable and offline-capable.
- **Service worker / PWA.** Phone may cache an old version. Hard-refresh or clear PWA storage when testing a fresh deploy.
- **`prompt()` is used in places** (e.g., add-DB-Panel location). Works on iOS Safari and Android Chrome but is utilitarian. Future polish item.
- **Type3 font in the report** — when patching text in generated PDFs post-hoc, native fonts can't be reused; cover + redraw approach is needed.
- **Image dataURLs are stored in `localStorage`.** This will run into quota issues on large jobs (~5MB localStorage limit per origin in most browsers). Phase 2's R2 storage solves this.

### Testing checklist before deploying any change

1. New Inspection → Villa 3BR → check all rooms appear including new villa-only ones
2. Toggle a room N/A → confirm it greys out, confirm it's hidden from report
3. Open DB Panel(s) → see two instances → add a third via "+ Add DB Panel" → verify checklist appears
4. Edit a DB instance location via the ✎ pencil → verify it updates everywhere
5. Add an observation containing a known typo (e.g. "costing peels off") → Generate Report → confirm spellcheck modal appears with Choose/Adjust/Approve buttons
6. Approve all → confirm PDF includes Handover Documents page
7. Hard-refresh phone PWA to clear cache before live testing

---

## Brand & assets

- **Primary colour:** `#d10165` (magenta — pink/red)
- **Background:** `#414242` (dark grey — current theme)
- **Card background:** `#2e2f2f`
- **Accent blue:** `#3b6daa`
- **Greyed text:** `#b7baba`
- **Typography:** Syne (display, weights 400/600/700/800), DM Sans (body, weights 300/400/500). Both from Google Fonts.
- **Icon set:** Emoji (no external icon library — keeps file portable).
- **PIN:** 1576 (gate to launch the app — placeholder; should be replaced with proper auth in Phase 2).

---

## Deployment

### Current setup
- Cloudflare Pages, direct upload
- Domain: `snaggingpro.pages.dev` (default Pages subdomain)
- No custom domain yet

### Target setup (do this when ready)
1. Connect Cloudflare Pages to this GitHub repo
2. Production branch: `main`
3. No build command (static HTML)
4. Output directory: `/`
5. Every push to `main` auto-deploys in ~30 seconds

### Going to a custom domain later
- Suggested: `snaggingpro.ae` or similar
- Set up in Cloudflare DNS → connect to Pages project
- Free SSL via Cloudflare

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| May 2026 | Single HTML file architecture | Portable, offline-capable, no build step, easy to edit on the go |
| May 2026 | Cloudflare Pages over Vercel | Better Phase 2 fit (D1 + R2 + Workers on one platform), better MENA edge coverage |
| May 2026 | Local-only storage for v0 | Ship fast. Cloud sync is Phase 2. |
| May 2026 | Dark theme retained for now | User confirmed acceptable. Light theme deferred to Phase 1B if needed. |
| May 2026 | DB Panel(s) as one room with multiple instances (not separate rooms) | Cleaner dashboard. All electrical inspection items grouped. Easy to add more via "+ Add DB Panel". |
| May 2026 | Soft-strict discipline flow (R4) — nudges not blocks | Real-world inspections aren't linear (water off, contractor blocking access, etc.). Hard blocks frustrate inspectors. |
| May 2026 | Edit pencil for DB Panel locations, no Remove button | All-N/A treatment preserves audit trail better than deletion. |
| May 2026 | Phase 2 = cloud backend | Local-only is fine for v1. Cloud sync, library, follow-up are a project of their own. |

---

## Contact / context

SnaggingPro is operated by a UAE-based FM professional with 20+ years of experience across major Dubai landmarks. Operates alongside ORLO Store (UAE e-commerce). Built as a commercial inspection service targeting handover and DLP-review market.

Repository is **private** by design — commercial business logic, customer data flow, and pricing structure should not be public.

---

*Last updated: May 2026 — at the close of Phase 1A build session.*
