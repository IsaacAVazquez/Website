# Release Notes: Public Fintech Repositioning and Dynamic Ticker Research

Date: 2026-03-16

## Summary

This release turns `/investments` into a public-facing fintech product showcase instead of a personal portfolio diary. The page is now discoverable from the main navigation and sitemap, the homepage better signals investment and analytics work, and the research experience now ships as a curated static research product instead of a hybrid runtime Yahoo flow.

## Highlights

### Public fintech positioning

- Reframed `/investments` as an investment research platform with public metadata, canonical portfolio copy, and `SoftwareApplication` structured data.
- Updated homepage, about, and contact messaging to make fintech and investment-research interest explicit without turning the entire portfolio into a fintech-only brand.
- Added `Investments` to the main navigation and sitemap so the experience is reachable from the same paths as the core portfolio work.

### Homepage curation changes

- Updated the homepage `Selected Work` section to show exactly three projects in this order:
  1. `Investment Analytics Platform`
  2. `Transforming Client Reporting into Self-Service Analytics`
  3. `Scaling a Platform to 60M+ Users`
- Removed fantasy football from the homepage featured set while keeping it available on `/portfolio`.
- Hardened the homepage featured-work selector so an invalid featured slug cannot crash the section at runtime.

### Curated static ticker research

- Replaced per-section runtime research fetching with one static `snapshot.json` per curated symbol under `/data/investments/{symbol}/`.
- The client now loads static curated research assets directly instead of depending on `/api/investments/data/[symbol]` for normal rendering.
- Production research is now curated-universe-only; non-curated symbols show a clear unavailable message instead of falling through to Yahoo.
- Portfolio quotes remain the only live Yahoo dependency in the investments experience.
- Static research artifacts now include shared metadata:
  - `source: "prefetched"`
  - `capabilities`
  - `lastUpdated`

### Dataset slimming

- Replaced the large raw per-section JSON payloads with precomputed, UI-ready symbol snapshots.
- Capped static `price` history to the most recent 252 trading days.
- Capped static `news` to the most recent 10 items per symbol.
- Removed transcript artifacts from the generated dataset and the pipeline.
- Reduced `public/data/investments` from roughly `240 MB` to roughly `2.2 MB`.

### Research UX updates

- `StockSearch` now uses the curated static index directly for autocomplete and blocks non-curated symbols from entering research mode.
- `useStockData` serves sections from a per-symbol static snapshot cache, so multiple panels no longer trigger many network requests for the same symbol.
- `StockResearch` fails cleanly for non-curated symbols, including symbols opened from portfolio holdings.
- Overview and summary components now render from the same static snapshot-backed hook contract as the rest of the research surface.

## Technical notes

- Added a snapshot builder that converts the raw investments dataset into normalized static symbol bundles and prunes legacy per-section files.
- Refactored `useStockData` so the static snapshot is the client-side source of truth instead of the per-section API.
- Kept the index/data API routes only as compatibility wrappers over static assets.
- Added route, hook, component, and Playwright tests covering:
  - curated static responses
  - non-curated symbol blocking
  - snapshot generation caps for price and news
  - capability-driven tab visibility from a single symbol snapshot
  - nav/homepage discoverability
- Removed the transcript research feature from the investments app, route validation, and shared investment data types to simplify the research surface area.

## Verification

- `npx jest "src/app/api/investments/data/\\[symbol\\]/__tests__/route.test.ts" --runInBand --modulePathIgnorePatterns='\\.worktrees'`
- `npx jest src/hooks/__tests__/useStockData.test.tsx src/components/investments/__tests__/investments-ui.test.tsx --runInBand --modulePathIgnorePatterns='\\.worktrees'`
- `npx playwright test e2e/investments.spec.ts --project=chromium`
- `npx eslint src/app/investments/investments-client.tsx src/constants/caseStudies.ts`
- `npx eslint src/lib/investmentsData.ts 'src/app/api/investments/data/[symbol]/route.ts' 'src/app/api/investments/data/[symbol]/__tests__/route.test.ts'`
- `npx jest src/lib/__tests__/investmentsData.test.ts src/app/api/investments/index/__tests__/route.test.ts "src/app/api/investments/data/\\[symbol\\]/__tests__/route.test.ts" --runInBand --modulePathIgnorePatterns='\\.worktrees'`
- `npx eslint src/lib/investmentsData.ts src/app/api/investments/index/route.ts 'src/app/api/investments/data/[symbol]/route.ts' 'src/app/api/investments/index/__tests__/route.test.ts' src/lib/__tests__/investmentsData.test.ts 'src/app/api/investments/data/[symbol]/__tests__/route.test.ts'`
