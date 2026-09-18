# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Dziennik Migreny" — a Polish-language, client-only PWA for logging migraine/headache episodes. No backend, no login, no server: all data lives in the browser's IndexedDB. This is a deliberate constraint, not an oversight — see `src/lib/storage.ts` below.

## Commands

```bash
npm run dev          # Vite dev server (HMR)
npm run build         # tsc -b && vite build -> dist/
npm run preview       # serve the built dist/ locally
npm run test           # vitest run (single pass, CI-style)
npm run test:watch     # vitest watch mode
```

Run a single test file: `npx vitest run src/lib/stats.test.ts`.

There is no lint script configured.

### Deploying

```bash
npm run build
npx gh-pages -d dist
```

`base: './'` in `vite.config.ts` is relative on purpose so the build works from a GitHub Pages subpath (`user.github.io/repo/`) without edits. The `gh-pages` package pushes `dist/` to the `gh-pages` branch; GitHub Pages is configured to serve from that branch. If a fresh deploy ever inherits stray dotfiles from `master` (has happened once, from a botched first-push clone), fix it directly on the `gh-pages` branch — the `dist/` output itself never contains them.

## Architecture

### Data layer: `db.ts` vs `storage.ts`

- `src/lib/db.ts` defines the raw Dexie (IndexedDB) schema and versioned migrations (`this.version(1)...`, `this.version(2)...`). Bump the version number and add a new `.version(n).stores(...)` block for schema changes — never edit an existing version's stores object, since real installs may already be on that version.
- `src/lib/storage.ts` wraps `db.ts` behind a `Storage` interface (`saveEntry`, `listOptions`, `exportAll`, `importAll`, ...). This indirection exists specifically so a future cloud-sync backend could replace the IndexedDB implementation without touching UI code. **Write against `storage`, not `db`, for anything that mutates data.**
- UI components read data reactively via `useLiveQuery` from `dexie-react-hooks`, querying `db` directly (see `CalendarView.tsx`, `StatsView.tsx`) — that's the one place bypassing `storage.ts` is expected, since `Storage` has no live-query equivalent.

### User-extensible option categories

`OptionCategory` / `OptionItem` (in `src/types/index.ts`) back every chip list (triggers, weather, food, meds, etc.). Defaults live in `src/lib/defaultOptions.ts`, seeded once via `ensureSeeded()`. Users can add their own via "+ Inne" in the form, and manage them in Settings → Moje opcje (`MyOptions.tsx`).

`storage.deleteOption` never actually deletes a row — it sets `hidden: true`. Historical entries reference options by id, and hiding (not deleting) keeps old entries displaying correctly while removing the option from future pickers. Preserve this behavior for any new option-management code.

### Weather auto-capture (`src/lib/weather.ts`)

Two Open-Meteo endpoints are used deliberately, not one:
- **Forecast API** (`api.open-meteo.com/v1/forecast` with `past_days`) for entries from the last ~90 days — no publication lag, so it works for a headache logged today.
- **Archive API** (`archive-api.open-meteo.com`) as a fallback for older entries, where the archive's lag doesn't matter.

`fetchWeatherForDate` picks between them based on how many days ago the entry date is. Both endpoints are keyless (no API key, by design — this is a pure frontend app with nowhere safe to hold a secret). `EntryForm.tsx` auto-fetches and stores the result on `entry.autoWeather` whenever the date changes and a city is configured in Settings; `stats.ts#pressureByDay` aggregates it for the pressure/pain chart in `StatsView.tsx`.

### PDF export font

`src/lib/export/pdf.ts` embeds a custom font (`pdfFonts.ts`, base64) because jsPDF's built-in fonts can't render Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż). It's a subset of DejaVu Sans (Bitstream Vera/DejaVu license — freely embeddable; see `src/assets/fonts/LICENSE_DEJAVU.txt`), not Arial, because Arial's license doesn't permit redistribution. If the subset ever needs regenerating (e.g. more glyphs), it was built with `fontTools.subset` against a system DejaVu Sans TTF, then base64-encoded into `pdfFonts.ts`.

### Routing and code-splitting

`App.tsx` uses `HashRouter` (not `BrowserRouter`) so client-side routes work on static hosting without server rewrite rules. `StatsView`, `SettingsView`, and `MyOptions` are `React.lazy`-loaded because their dependencies (recharts; jsPDF + jspdf-autotable + html2canvas) are heavy — keeping them out of the initial bundle matters since the calendar (the first thing opened, "głównie na telefonie") should load fast. Don't move recharts/jsPDF imports back to eagerly-loaded modules without re-checking bundle size (`npm run build` prints per-chunk sizes).

### Testing

`vitest.config.ts` is a **separate file** from `vite.config.ts`, not merged — `vitest/config`'s `defineConfig` bundles its own copy of Vite, which conflicts with the top-level Vite's plugin types if you try to add a `test` block to `vite.config.ts` directly. Keep them split.

Tests that touch the database import `fake-indexeddb/auto` (via `src/test-setup.ts`) to get a real IndexedDB implementation under jsdom, and use the actual `Dexie`/`storage` code — not mocks. Follow that pattern for new persistence tests.

### PIN lock

`PinLockScreen.tsx` derives all PIN-digit state from a single `pin` string via functional `setState` updates, not by reading `pin` from a stale closure — this was a real bug (dropped keystrokes under rapid input) fixed once already. Don't reintroduce closure-based digit accumulation.
