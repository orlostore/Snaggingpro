# SnaggingPro

> Mobile-first property condition assessment PWA for UAE handover and DLP inspections.

## Stack

- **Vite + TypeScript (strict)** — build, type safety
- **lit-html** — auto-escaped templating (no XSS)
- **zod** — runtime schema validation of state
- **idb** — IndexedDB for photo blobs and report library
- **vite-plugin-pwa** — manifest + Workbox service worker
- **Vitest** — unit tests
- **ESLint + Prettier** — lint, format
- **Cloudflare Pages** — hosting

No React, no Tailwind, no design-system library. The whole client is a small set of typed modules.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run typecheck
npm run lint
npm run build      # outputs to dist/
```

## Folder layout

```
src/
├── main.ts               App entry, router dispatch
├── styles/               tokens.css is the single source of truth for colour/spacing/typography
├── components/           Reusable UI primitives (Button, Modal, Toast, PhotoAttach, Confirm, …)
├── screens/              One file per screen (Splash, PinGate, Setup, Cover, Dashboard, Room, Report, Library, ReportDetail)
├── domain/               Pure business logic — checklists, disciplines, rooms, snags, typo rules
├── state/                Zod schemas, store, persistence, migrations
├── storage/              IndexedDB layer (photos, reports library)
├── report/               Printable HTML report builder
└── lib/                  env, auth, router, debounce, format, id, escape

tests/
├── setup.ts              Vitest setup (fake-indexeddb)
└── unit/                 Domain + state migration tests

public/
├── _headers              Cloudflare Pages security headers (CSP, X-Frame-Options, …)
├── _redirects            SPA fallback to /index.html
├── favicon.svg
└── icons/                PWA icons

legacy/                   Frozen v0 single-file app — kept for reference, deleted once v2 is verified
```

## Conventions

- **No `innerHTML`.** All UI rendered via `lit-html`. Lint rule blocks regression.
- **No inline `onclick=`.** Handlers attached in TypeScript only.
- **Colour, spacing, typography live in `src/styles/tokens.css`.** Anything else is a bug — fix in tokens.
- **Photos never live in state.** State holds photo IDs; bytes live in IndexedDB.
- **State is schema-validated** on load via zod. Bumping `STATE_VERSION` requires writing a migration in `src/state/migrations.ts`.
- **Destructive actions go through `confirmDialog()`** — never `confirm()` / `prompt()`.
- **Auth is interface-based** (`src/lib/auth.ts`). Swap `PinAuthenticator` for `EmailMagicLinkAuthenticator` in Phase 2 without touching any screen.

## Deploy to Cloudflare Pages

1. **Connect GitHub repo** in the Cloudflare Pages dashboard.
2. **Build settings:**
   - Framework preset: *None*
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave empty
   - Node version (Environment variable): `NODE_VERSION = 22`
3. **Environment variables:**
   - `VITE_APP_PIN` — the PIN that unlocks the app (defaults to `1576` for local dev).
   - `VITE_BUILD_VERSION` — optional; surfaces in the footer.
4. **Production branch:** `main`. Every push to main auto-deploys in ~30 seconds.
5. The repo already ships `public/_headers` (CSP, frame-deny) and `public/_redirects` (SPA fallback) — no further config needed.

## Features

- New inspection workflow: setup → cover photos → room-by-room → report
- Per-room discipline tabs (Civil / Electrical / HVAC / Plumbing / Mechanical / …)
- N/A toggle on rooms — excluded rooms greyed out, hidden from report
- DB Panel(s) with multiple instances (per floor)
- Photo attach — camera **or** gallery (e.g. for client-supplied photos)
- Pre-PDF spellcheck against the typo rule set
- **Reports library** — every saved inspection is searchable, deletable (with confirm), re-openable
- **Edit existing report** — pulls a saved report back into the editor, overwrite-on-save
- **Follow-up inspections** — clone an old report; each snag gets a Fixed / Still Open / New status for the closing PDF
- Offline-first PWA — installable on iOS / Android home screen

## Roadmap

- **Phase 1B:** Guided discipline flow (R4)
- **Phase 2:** Cloudflare D1 + R2 cloud sync, multi-device library, real authentication, PDPL retention policy
