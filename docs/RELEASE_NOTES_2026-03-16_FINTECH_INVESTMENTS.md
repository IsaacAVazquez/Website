# Release Notes: Public Fintech Repositioning and Dynamic Ticker Research

Date: 2026-03-16

## Summary

This release turns `/investments` into a public-facing fintech product showcase instead of a personal portfolio diary. The page is now discoverable from the main navigation and sitemap, the homepage better signals investment and analytics work, and the research experience now supports arbitrary valid ticker symbols through a hybrid prefetched plus on-demand data path.

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

### Hybrid ticker research

- Moved investments data loading behind a shared server-side layer and API envelope.
- Seeded research symbols still load from the prefetched dataset first.
- Valid unseeded symbols now fetch on demand from Yahoo-backed server utilities and are cached in memory with a TTL.
- API responses now expose:
  - `source: "prefetched" | "on-demand"`
  - `capabilities` for research sections and seeded-only features
  - `lastUpdated`

### On-demand research behavior

- Guaranteed on-demand support:
  - `Overview`
  - `Financials`
  - `Growth`
  - `Valuation`
  - `Chart`
- Best-effort on-demand support:
  - `DCF` when the required inputs are available
- Seeded-universe-only features in this release:
  - `Industry`
  - `Transcripts`
  - embedded `News`
  - `Compare`
- On-demand valuation now renders a standalone valuation snapshot instead of industry-relative comparisons.

### Research UX updates

- `StockSearch` now accepts any valid ticker symbol, while still using the seeded index for autocomplete suggestions.
- Unknown but valid symbols now show an on-demand snapshot hint instead of a hard database rejection.
- `StockResearch` uses capability metadata to hide unsupported tabs for on-demand symbols.
- Added a live snapshot banner and source-aware freshness labels so users can tell whether they are viewing curated dataset content or a live fetch.
- Overview mode omits seeded-only news UI for on-demand symbols.

## Technical notes

- Added a new shared investments data module for prefetched reads, on-demand fetches, transforms, and caching.
- Refactored `useStockData` so the API is the single source of truth instead of client-side reads from `public/data/investments/*`.
- Added an index API route for seeded symbol lookup and dataset freshness.
- Added route, hook, component, and Playwright tests covering:
  - seeded responses
  - uncached valid on-demand symbols
  - invalid symbols
  - unsupported on-demand sections
  - manual unknown-ticker submission
  - capability-driven tab visibility
  - nav/homepage discoverability

## Verification

- `npx jest "src/app/api/investments/data/\\[symbol\\]/__tests__/route.test.ts" --runInBand --modulePathIgnorePatterns='\\.worktrees'`
- `npx jest src/hooks/__tests__/useStockData.test.tsx src/components/investments/__tests__/investments-ui.test.tsx --runInBand --modulePathIgnorePatterns='\\.worktrees'`
- `npx playwright test e2e/investments.spec.ts --project=chromium`
- `npx eslint src/app/investments/investments-client.tsx src/constants/caseStudies.ts`
