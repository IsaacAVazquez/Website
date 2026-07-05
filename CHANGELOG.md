# Changelog

All notable changes to this repository are documented here. Format: `YYYY-MM-DD` (UTC).

---

## 2026-07-02

- Brought `CHANGELOG.md` current by backfilling every release from 2026-03-28 through 2026-06-24 that had been recorded only in the public `content/changelog` entries, and added a public changelog entry for the 2026-06-24 dashboard-polish and investments live-pricing work.
- Added a `Update Changelog on Merge` GitHub Action (`.github/workflows/changelog-on-merge.yml`) that appends a dated bullet to `CHANGELOG.md` for every merged pull request, backed by `scripts/append-changelog-entry.mjs` (idempotent, groups bullets under a UTC date header) and the shared `scripts/ci/commit-and-push-snapshot.sh` push path. Snapshot bots push straight to main so they are never logged, and a `skip-changelog` PR label opts out.

---

## 2026-06-24

- Redesigned the `/ai-dev-tools` directory from a horizontally-scrolling table into a responsive row-card list (single column on mobile, three-up facts grid on wider screens) with a sort control (curated, GitHub stars, recently shipped, name), relative GitHub-stars bars, release-freshness dots, and lifecycle status badges, and fixed the placeholder GitHub quick-link to an open-source filter.
- Surfaced a `Trending topics` leaderboard on the `/news-pulse` coverage view (keywords ranked across two or more outlets with a relative count bar and per-outlet coverage dots), replacing the hardcoded `Average reading time` placeholder stat with a real trending-topics count from the already-implemented topic extraction.
- Restored investments live pricing and the `/api/investments/index` route in production by adding a canonical production-origin fallback (mirroring `seo.ts`) so the deployed Netlify function can reach its own committed public assets when `URL`/`SITE_URL`/`NEXT_PUBLIC_SITE_URL` are unset at runtime, and threaded the request origin through the Finnhub symbol-allowlist lookups used by the quotes, data, and stocks routes.
- Made the investments allocation donut responsive and centered by switching the D3 SVG from fixed dimensions to a `viewBox` with a responsive box.
- Synced the source-of-truth documentation set with the current codebase (fantasy-football surface overhaul, cross-surface browser stores, the shared snapshot commit-and-push helper, and a batch of stale-fact corrections).

---

## 2026-06-10

- Filled out the investments research column with real position data only: a holdings card (shares, average cost, market value, total return, day P/L, allocation bar) drawn from the local portfolio, a price chart with a cost-basis reference line, a 50-day moving average, up/down volume coloring, and per-overlay toggle pills, plus restyled news cards with monogram thumbnails and mono timestamps.
- Swapped the Formula 1 dashboard circuit-map images for a cleaner marker tile, trued the header, footer, projects, and writing pages against the V3 design system, and bumped the primary nav size to balance the header.
- Published a dozen new writing pieces (a two-part horology history, a researched take on the AI mega-cap rally, a series on building with AI agents, and an early 2026 fantasy football look) and rewrote legacy post SEO descriptions in-voice.

---

## 2026-06-09

- Launched three snapshot-driven dashboards: `/earthquake-pulse` (global USGS seismic activity, hourly refresh), `/bay-area-transit` (BART departures, service advisories, and elevator outages, every six hours), and `/tech-startup-tracker` (an editorially curated, unverified dataset with an on-page as-of disclosure).
- Upgraded the `/travel` planner with itinerary stop time windows and overlap detection, day category color-coding, an itinerary progress bar, journal mood icons, and a fix for a localStorage bug that could corrupt or delete stored trips.
- Ran a consolidation pass: moved off-system colors and micro-typography onto the editorial design tokens, unified card radius/shadows, fixed broken color-mix utilities, added dashboard loading states, lazy-loaded the MBA tracker dialogs and team crests, added screen-reader column associations across eight sports dashboards, removed nested landmarks on `/writing` and `/travel`, fixed keyboard access on the transit and startup dashboards, corrected the retirement planner success metric to count guaranteed income, fixed World Cup fixture date classification and the bare `/investments` URL-sync loop, and added unit coverage across several surfaces.

---

## 2026-06-08

- Launched `/world-cup-2026` (World Cup Pulse), a snapshot-driven dashboard that works as a pre-kickoff tournament hub (format, venues, dates) and fills in groups, knockout bracket, schedule, and scorers from ESPN data refreshed every six hours, plus a ten-part contenders countdown series on `/writing`.
- Added a retirement planner to the investments dashboard (`/investments#retirement`): allocation-derived return and volatility from dated capital-market assumptions, a seeded 1,000-trial Monte Carlo rendered as confidence bands with "N of 100 scenarios" framing, a two-phase accumulation/decumulation projection with coarse account-aware taxes, RMDs, Social Security claim mechanics, and withdrawal strategies, and a sensitivity panel computed off the critical path. Educational output only, with disclosed and editable assumptions.
- Launched a fantasy Formula 1 lineup optimizer (`/fantasy-formula-1`) with versioned browser-local saved teams, added a tier-grouped position-column board view to `/fantasy-football/draft-tracker`, and gave the rankings page a list density toggle, sticky board header, and compact rows.
- Rebuilt the `/food-map` on Leaflet as a multi-city, curator-driven surface, launching Miami, Atlanta, Copenhagen, and San Sebastián alongside Austin.

---

## 2026-05-31

- Refreshed the about and portfolio surfaces, added a shared `HomeStatsPanel` feeding the homepage and writing archive, tightened player ID validation and snapshot handling across the sports modules, moved NBA player stats to a newer ESPN endpoint, and aligned UI copy with the writing voice.

---

## 2026-05-04

- Launched the `/travel` planner (trips, day-by-day itineraries, per-trip journal) with all state persisted in localStorage and no backend or account.

---

## 2026-04-29

- Shipped a nine-launch wave: `/nba`, `/mlb`, and `/nfl` dashboards (standings, fixtures, stat leaders from ESPN, the MLB Stats API, and NFLverse), `/github-trending-pulse`, `/frontier-models`, and personal tools `/food-map`, `/wine-cellar`, `/museum-log`, and `/recipe-finder`, each reading from a committed snapshot or curated dataset with no runtime API calls.

---

## 2026-04-26

- Rolled out the V3 editorial design system across the homepage hero, the `/writing` archive layout, and a rebuilt three-column `/investments` dashboard that merges portfolio and research with a hero balance card, a dense key-metrics grid, and a numbers-first asset header.

---

## 2026-04-20

- Refreshed the MBA internship tracker styling to match the editorial system, added compact company filters, expanded role sourcing across more career types, tightened job filtering, and gave the tracker a dedicated homepage feature slot.

---

## 2026-04-10

- Launched the MBA internship notifications dashboard (`/mba-internship-notifications`) with role aggregation and per-company filters, email notifications via Resend, and a lightweight admin layer for curating the source list.

---

## 2026-04-05

- Reorganized the older root-level SEO docs into an archive with `SEO.md` as the single source of truth, updated homepage content, refreshed test mocks to match new component boundaries, and tuned the homepage section width.

---

## 2026-03-28

- Fixed SpaceX mission control (`/spacex-mission-control`) image caching that re-fetched mission art more than needed and a hydration mismatch that flickered the summary panel on first load.

---

## 2026-03-21

- Fixed a real fantasy football snapshot integrity bug where `overall` boards could drift from the matching positional boards because overall rankings were still sourced from stale checked-in overall files while positional boards were generated from current FantasyPros consensus data.
- Reworked fantasy snapshot generation so `overall` and `flex` derive from the same current position-board dataset, preserved consistent player projections and position ranks across views, refreshed the published static fantasy snapshots, and bumped the snapshot schema version to force clients onto the corrected data.
- Added regression coverage to lock the overall-vs-position projection/rank consistency path and kept fantasy API snapshot responses green against the updated source model.

---

## 2026-03-19

- Rebuilt the fantasy football experience around a canonical `/fantasy-football` rankings board and a simplified `/fantasy-football/draft-tracker`, both powered by checked-in published snapshots instead of public runtime fetch chains.
- Replaced the old mixed fantasy runtime path with a scoring-aware generated position-data source, updated the snapshot builder and public APIs to read from it, and added schema-versioned normalization so stale cached payloads do not crash the app.
- Restored full `PPR`, `HALF_PPR`, and `STANDARD` position-board availability by generating real `RB/WR/TE` scoring-specific data, treating `QB`, `K`, and `DST` as scoring-agnostic shared boards, and deriving `FLEX` from eligible position data.
- Corrected fantasy board integrity details by preserving real source tiers and ranges, stopping misleading overall fallbacks, making `/api/sample-data` scoring-aware, and aligning legacy/internal fantasy readers with the new static source model.
- Fixed a real fantasy board query-state bug so scoring and position switches now update the URL reliably, and made the desktop rankings rail sticky while keeping the existing stacked mobile layout.
- Added and refreshed fantasy unit, API, hook, client, redirect, and Playwright coverage for scoring switches, shared `K/DST` behavior, stable static-data loading, legacy snapshot normalization, and the sticky-versus-stacked aside behavior.

---

## 2026-03-18

- Made the investments workspace URL-backed with supported `view`, `symbol`, and `section` query params, so research context now survives top-level tab switches, portfolio jumps, reloads, and shareable deep links.
- Split live quote data from curated historical snapshot data in the research experience, so current price and day change come from the quotes path while the chart/header clearly label the latest historical trading day and stale-history lag.
- Expanded the curated investments index with richer company metadata, preserved provider company names during snapshot transforms, and fixed search/suggestion behavior so symbols like `V` can be found by `Visa` with keyboard-complete dropdown interactions.
- Tightened snapshot normalization for price history by validating, sorting, deduplicating, and trimming rows before publishing, and refreshed the checked-in curated index/snapshot metadata to carry real company labels.
- Extended investments coverage with new transform, snapshot, URL-state, UI, and Playwright tests for deep links, Visa company-name search, preserved research state, curated-only failures, and the live-price-versus-history split.

---

## 2026-03-17

- Simplified the global shell back to a single-row navigation with `Projects` as the public portfolio label, removed `Writing` from the promoted nav/home/footer surfaces, softened homepage and section copy, and kept the spacing cleanup that improved readability across the main landing pages.
- Streamlined closing CTAs across the site by adding compact vs. full footer variants, keeping page-owned contact sections on home and contact, and removing redundant end-of-page prompts from the portfolio index and writing detail pages.
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
