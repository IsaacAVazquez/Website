# Changelog

All notable changes to this repository are documented here. Format: `YYYY-MM-DD` (UTC).

---

## 2026-03-16

- Repositioned `/investments` as a public fintech proof point with recruiter-facing metadata, `SoftwareApplication` structured data, homepage/home/about/contact copy updates, sitemap exposure, and main navigation visibility.
- Reworked homepage curation so `Selected Work` highlights `Investment Analytics Platform`, `Transforming Client Reporting into Self-Service Analytics`, and `Scaling a Platform to 60M+ Users`, while removing fantasy football from the homepage featured set.
- Added a hybrid investments data layer with server-side prefetched-symbol reads, Yahoo-backed on-demand ticker snapshots, TTL caching, and shared `source`/`capabilities` metadata across the API and client hook.
- Updated the research workspace to support arbitrary valid ticker entry, on-demand snapshot messaging, capability-aware tab visibility, source-aware freshness labels, and standalone valuation metrics for live snapshot symbols.
- Hardened the on-demand data path for production by deduplicating concurrent snapshot builds per symbol, routing chart history through the shared Yahoo backoff client, falling back to stale snapshots on upstream rate-limit/server errors, and translating upstream `429` responses into temporary `503` API responses.
- Made the prefetched investments dataset loader request-origin aware for Netlify/serverless deployments, fail explicitly with a curated-dataset `503` when seeded data cannot be resolved, and fall back to public asset URLs instead of misclassifying curated symbols as on-demand.
- Removed the extra same-origin proxy hop from portfolio quote fetching.
- Added route, hook, component, and Playwright coverage for seeded vs. on-demand ticker flows, `/investments` discoverability, and homepage featured-work ordering.

---

## 2026-03-06

- Updated core documentation to reflect current state of the platform (Next.js 16, blue/slate design system, dual-purpose portfolio + fantasy football).
- Corrected `PAGES.md`: added fantasy football routes, investments, admin, accessibility pages; removed non-existent `/newsletter`, `/testimonials`, `/faq` routes; clarified redirect-only routes (`/blog` → `/writing`, `/projects` → `/portfolio`).
- Corrected `COMPONENTS.md`: updated component inventory with all 50+ real components; removed references to non-existent `blog/`, `newsletter/`, `testimonials/` directories and `CommandPalette`; added investments components, fantasy football components, `ThemeProvider`, `FeaturedWorkSection`, `button.tsx`, `dropdown-menu.tsx`.
- Corrected `ARCHITECTURE.md`: updated from Next.js 15 to 16; replaced outdated "warm orange" theme with current blue/slate design system; re-added fantasy football as a first-class platform feature; added investments, admin, search routes; removed references to non-existent pages.
- Corrected `API.md`: removed non-existent `/api/newsletter`, `/api/player-images-mapping`, `/api/data-pipeline`; added `/api/investments/`, `/api/stocks/`, `/api/auth/`; clarified route purposes.
- Corrected `DEVELOPMENT.md`: updated to Next.js 16; replaced "Warm Modern" orange color examples with current CSS custom property system; updated file structure to reflect actual app routes; added fantasy football development section with data layer documentation.
- Updated `CHANGELOG.md` with accurate version history.
- Updated `TESTING.md` date to March 2026.

---

## 2026-02-18

- Added onboarding docs (`GETTING-STARTED.md`, `API.md`, `PERFORMANCE.md`, `TROUBLESHOOTING.md`) and wired every markdown link to valid destinations.
- Synced the documentation index (`docs/README.md`) with the current set of deep-dive guides.
- General cleanup across `docs/` to ensure references to deployment, database, and automation content stay accurate.

---

## 2026-02-10

- Shipped portfolio refresh: new `/portfolio`, `/resume`, and `/writing` experiences plus structured data helpers (`AIStructuredData`, `StructuredData`).
- Added investments page (`/investments`) with stock research panels and Yahoo Finance integration.
- Added fantasy football tooling (RB tiers, draft tracker, sample API responses) and wired the Netlify build hook for scheduled data refreshes.
- Introduced investments components: `PortfolioTracker`, `StockResearch`, `DCFPanel`, `FundamentalsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `NewsPanel`, `TranscriptsPanel`, `IndustryPanel`, `ProfitabilityPanel`.

---

## 2026-01-30

- Migrated to Next.js 16 (App Router) with TypeScript strict mode and Tailwind CSS v4.
- Re-introduced full fantasy football analytics platform with D3-powered tier charts and SQLite persistence.
- Added Gaussian mixture model tier clustering (`src/lib/gaussianMixture.ts`).
- Added unified data pipeline: `unifiedFantasyProsAPI.ts`, `unifiedTierCalculator.ts`, `unifiedCache.ts`.
- Implemented Lighthouse and Core Web Vitals monitoring.
- Added `next-sitemap` to the build pipeline.
- Added NextAuth.js for `/admin` route protection.
- Replaced warm orange/sunset design system with modern blue/slate professional theme.
