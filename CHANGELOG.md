# Changelog

All notable changes to this repository are documented here. Format: `YYYY-MM-DD` (UTC).

---

## 2026-03-17

- Repackaged `/march-madness-2026` as a search-oriented editorial landing page by splitting the route into a server metadata shell plus client UI, adding canonical metadata, article/FAQ/sports structured data, a route-level Open Graph image, and query-param deep links for primary views and sub-tabs.
- Added above-the-fold March Madness traffic hooks including a sharper hero thesis, top-upset summaries, methodology cards, and a share layer with copy-link support, while preserving the bracket’s existing picks and analytics model.
- Published a companion writing piece, `2026 March Madness Bracket Analysis: Best Upset Picks, Final Four, and Time Zone Traps`, and added sitemap coverage plus tests for the article file, route metadata, deep-link states, and the writing-index publication path.
- Fixed markdown post rendering to emit HTML links and updated affected Next 16 routes to await async `params`/`searchParams`, so the new March Madness content path works cleanly with the current app runtime.
- Added full-width route handling for `/investments` and `/march-madness-2026`, so both app-like experiences can render outside the default `max-w-4xl` content wrapper while keeping the shared site header and footer.
- Refreshed the investment analytics workspace with a stable page shell, cleaner tab hierarchy, tighter control-row spacing, and more consistent treatment across the core research and portfolio surfaces.
- Restyled the March Madness bracket analysis page from inline/global styles to responsive route-local class-based UI, preserving the existing data model and interactions while improving mobile layout, tab accessibility, and overflow behavior.
- Extended investments UI coverage, added a dedicated March Madness Playwright spec, and added route-level checks for stable shell width and no horizontal scrolling on Chromium and Mobile Chrome.

---

## 2026-03-16

- Repositioned `/investments` as a public fintech proof point with recruiter-facing metadata, `SoftwareApplication` structured data, homepage/home/about/contact copy updates, sitemap exposure, and main navigation visibility.
- Reworked homepage curation so `Selected Work` highlights `Investment Analytics Platform`, `Transforming Client Reporting into Self-Service Analytics`, and `Scaling a Platform to 60M+ Users`, while removing fantasy football from the homepage featured set.
- Replaced the investments research runtime path with static curated symbol snapshots served from `/data/investments/*`, so the research UI now loads one published snapshot per symbol instead of fanning out through server-side section APIs.
- Slimmed the curated investments dataset from raw per-section dumps to precomputed UI-ready snapshots, capped price history to 1Y, capped news to 10 items, removed transcript artifacts, and reduced the published research dataset from roughly `240 MB` to roughly `2.2 MB`.
- Updated the research workspace to support curated-symbol search only in production, show a clear curated-universe message for non-curated symbols, and keep portfolio quote lookups as the only live Yahoo dependency.
- Removed transcript functionality from the investments research surface, route validation, and shared investment data types to simplify the app and reduce unsupported feature area.
- Simplified the server-side investments compatibility routes so they now read static snapshots and index files only, while keeping request-origin-aware static asset fallback for Netlify/serverless environments.
- Removed the extra same-origin proxy hop from portfolio quote fetching.
- Added route, hook, component, snapshot-builder, and Playwright coverage for curated static ticker flows, `/investments` discoverability, and homepage featured-work ordering.

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
