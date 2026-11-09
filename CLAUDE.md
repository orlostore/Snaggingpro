# Notes for Claude working on this repo

## Architecture rules

- Tokens (`src/styles/tokens.css`) are the **only** place colour / spacing / radius / shadow / typography are defined. If a screen wants a new shade, add it to tokens first.
- All rendering goes through **lit-html** via `render()`. Never assign to `innerHTML`. ESLint enforces this.
- No inline event handlers in HTML. Hash router lives in `src/lib/router.ts`.
- **Photos are blobs in IndexedDB** (`src/storage/photos.ts`). State (zod-validated) holds only photo IDs.
- Destructive UI actions go through `confirmDialog()` in `src/components/Confirm.ts`. Never call `confirm()` or `prompt()`.
- Authentication is the `Authenticator` interface in `src/lib/auth.ts`. Today: PIN from `VITE_APP_PIN`. Phase 2 swaps the implementation only.

## Approved colours (owner sign-off, Nov 2026)

- Palette: **midway teal + sand on warm ivory**. Teal `#1f6b71` (band `#297c83` → `#1a5c64`), sand fill `#e1b27b`, ivory canvas `#f6f1ea`. Do not add other brand colours or bring back navy/black/grey themes.
- Use the tokens in `src/styles/tokens.css` only; the rules for which colour may sit on which surface are written at the top of that file.
- Small text on teal is ivory (`--color-on-brand`). Pale sand (`--color-accent-light`) on teal is for large text (24px+) and lines only. Text on sand fills is `--color-on-accent`. Small sand text on light surfaces is `--color-accent-strong`.
- Every text/background pair is checked against WCAG AA by `tests/unit/contrast.test.ts`. Adding a new pairing means adding it to that test; changing a colour means the test must still pass.
- Font: **Barlow Semi Condensed** for everything in the app (titles and body), via `--font-display` / `--font-body`. Do not reintroduce serif or other display fonts.
- Client PDFs (quotation, receipt, report) keep their own fixed print styles.

## State

- Single canonical schema in `src/state/schema.ts`, version `STATE_VERSION`.
- Loading goes through `loadDraft()` → zod parse → falls through to a v0 migration if a legacy blob is found.
- Adding a field: update the zod schema, bump `STATE_VERSION`, add a migration in `src/state/migrations.ts`.

## Reports library

- Persisted via `reportsRepo` in `src/storage/reports.ts`. Today the backing store is IndexedDB.
- Phase 2 will swap the implementation for a Cloudflare Workers + D1 + R2 adapter — but only this module changes.
- Library list reads `summaries` (denormalised); the report detail reads `reports` (full state).

## Code style

- TypeScript strict + `noUncheckedIndexedAccess`.
- Function names: `verbNoun`, lowerCamelCase.
- Files: `PascalCase.ts` for components/screens, `lowerCamelCase.ts` for everything else.
- One screen per file, one component per file.
- Avoid utility libraries unless they save real complexity (we already use `idb`, `lit-html`, `zod`).
- Comments are rare — write code that doesn't need them. Use comments only for non-obvious WHY.

## Deploying

- Cloudflare Pages, build command `npm run build`, output `dist`, Node 22.
- Env vars: `VITE_APP_PIN`, `VITE_BUILD_VERSION`.
- `public/_headers` carries CSP and security headers; `public/_redirects` is the SPA fallback.

## Anti-patterns to reject in review

- New `innerHTML` assignment anywhere
- Native `confirm()` / `prompt()` / `alert()` calls
- Colours / spacing / sizes that aren't `var(--...)`
- Photos stored as base64 dataURLs in state
- New screens that don't use `Header` + `Footer` components
- Adding a new dependency without a written reason
