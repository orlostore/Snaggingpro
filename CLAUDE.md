# Notes for Claude working on this repo

## Architecture rules

- Tokens (`src/styles/tokens.css`) are the **only** place colour / spacing / radius / shadow / typography are defined. If a screen wants a new shade, add it to tokens first.
- All rendering goes through **lit-html** via `render()`. Never assign to `innerHTML`. ESLint enforces this.
- No inline event handlers in HTML. Hash router lives in `src/lib/router.ts`.
- **Photos are blobs in IndexedDB** (`src/storage/photos.ts`). State (zod-validated) holds only photo IDs.
- Destructive UI actions go through `confirmDialog()` in `src/components/Confirm.ts`. Never call `confirm()` or `prompt()`.
- Authentication is the `Authenticator` interface in `src/lib/auth.ts`. Today: PIN from `VITE_APP_PIN`. Phase 2 swaps the implementation only.

## Colours (owner decision, Nov 2026)

- **Active palette: the original deep blue + a silver accent** (replacing the original gold). Blue `#1e3a5f` (header/band gradient `#1e3a5f` → `#152d4a`), silver fill `#e1e6ed`, steel `#616b7a` for small text/bars/lines on light surfaces, pale silver `#eef1f6` on blue, background `#f7f7f8`. The owner will revisit colours later; until then do not introduce other brand colours.
- **Parked palettes (swap back by editing only `src/styles/tokens.css`):**
  - Original gold: fill `#b8923a`, small text `#816629`, pale `#dcc28f`, button text `#1a1b1e`.
  - Teal + sand: teal `#1f6b71` (band `#297c83` → `#1a5c64`), sand fill `#e1b27b`, ivory canvas `#f6f1ea`, ink `#192e31`, sand text on light `#8e5f31`, pale sand on teal `#eac9a3`, ivory on teal `#fcf8f1`.
- Use the tokens in `src/styles/tokens.css` only; the rules for which colour may sit on which surface are written at the top of that file.
- Small text on the blue is white (`--color-on-brand`). Pale silver (`--color-accent-light`) on blue is for large text (24px+) and lines only. Text on silver fills is `--color-on-accent`. Silver itself is too faint for thin lines, bars or focus rings on light surfaces — use `--color-accent-strong` there.
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
