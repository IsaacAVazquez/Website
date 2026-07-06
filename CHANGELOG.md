# Changelog

All notable changes to this repository are documented here. Format: `YYYY-MM-DD` (UTC).

---

## 2026-07-06

- Restore next-auth ^4.24.14 to fix npm ci peer conflict ([#278](https://github.com/IsaacAVazquez/Website/pull/278)).
- High-priority data-source audit remediation ([#277](https://github.com/IsaacAVazquez/Website/pull/277)).
- Open the SpaceX mission drawer before asserting its detail panel ([#279](https://github.com/IsaacAVazquez/Website/pull/279)).
- Cache fantasy snapshot reads and harden refresh workflows ([#280](https://github.com/IsaacAVazquez/Website/pull/280)).
- Serve last-good news-pulse headlines when a refresh fails ([#281](https://github.com/IsaacAVazquez/Website/pull/281)).
- Compact GitHub trending snapshot and query topic:ai ([#282](https://github.com/IsaacAVazquez/Website/pull/282)).
- Use Greenhouse first_published for MBA job posted dates ([#283](https://github.com/IsaacAVazquez/Website/pull/283)).
- Normalize The Guardian news-pulse feed to its front page ([#284](https://github.com/IsaacAVazquez/Website/pull/284)).
- Bump actions/cache from 5 to 6 ([#267](https://github.com/IsaacAVazquez/Website/pull/267)).

---

## 2026-07-02

- Tightened the editorial design system across the site, including shared loading and error states, route polish, and updated design guidance in `STYLING.md`, `DESIGN_CHECKLIST.md`, and `docs/REDESIGN_BRIEF.md`.
- Added a shared holding color palette and utility for investments visuals so allocation and holding components can assign colors consistently.
- Added focused `PortfolioV3` search tests and kept the portfolio index covered as project search became a primary browsing path.
- Added timeouts around fantasy snapshot fetches so a stalled static file request falls back to `/api/fantasy-data` instead of leaving the board on its loading state.
- Hardened draft-tracker persisted-state loading so older localStorage blobs hydrate with safe defaults for undo history, teams, and draft IDs.
- Kept the last good investments quote visible when a same-symbol refresh fails, while surfacing the failure through freshness messaging instead of hiding it.

---

## 2026-06-30

- Updated `WRITING_VOICE.md` and the agent memory docs so the no-em-dash, plainspoken copy rules are current and easier to apply across UI copy, docs, and articles.

---

## 2026-06-25

- Launched `/arcade`, a standalone synthwave CRT reflex game with a route-scoped font stack, custom visual system, and sitemap coverage.
- Added World Cup 2026 group-stage writing coverage and synced the public sitemap with the new articles.
- Gave Formula 1 Pulse a racing-flavored visual identity and restyled the 404 page with a retro treatment.
- Removed stale `/portfolio/pulse-dashboards` sitemap references.

---

## 2026-06-24

- Added in-header search with live results, fixed production search filtering, ranked projects ahead of duplicate matches, and cleaned up search taxonomy and filters.
- Added per-project pixel-art tiles to the portfolio card grid and tightened the portfolio index scan state.
- Improved `/ai-dev-tools` and `/news-pulse` UI/UX, moved fantasy Value next to Avg with cleaner tooltip/touch behavior, and restored investments live pricing while aligning the allocation donut.
- Updated Next, React, TypeScript ESLint, Playwright, Jest tooling, Radix Dropdown, and GitHub checkout dependencies, with fixes for the Jest 30.4 toolchain.

---

## 2026-06-23

- Added `/release-notes`, a month-grouped companion to the longer public changelog.
- Added writing topic pages and an SEO content map so the writing archive can be browsed by recurring themes.
- Improved findability across the homepage, live tools, shell, and search experience.
- Added GA4 event tracking with an analytics reference page, plus sitemap priority and changefreq metadata by content type.
- Staged a global report-only CSP and hardened auth, JSON-LD output, and email rate limiting.
- Kept large sports snapshots out of client bundles, trimmed image runtime, fixed mobile-menu focus order, repaired the compare-modal focus trap, and expanded tests across builders, the tier engine, hooks, search, and sitemap classification.

---

## 2026-06-19

- Overhauled the fantasy football rankings board with a player detail drawer, watchlist queue, notes, compare tray, tier breaks, denser rows, and clearer value/reach explanations.
- Overhauled the fantasy draft assistant with draft timers, undo/redo history, custom team names, CSV exports, stronger team views, and updated draft analytics.
- Added project search to `/portfolio` and moved the marquee band between the project grid and pager.
- Routed snapshot workflows through the shared commit-and-push helper, made the football snapshot prebuild non-fatal on deploy, updated La Liga and Premier League snapshots for 2026, and fixed the deployed investments live-quote allowlist.

---

## 2026-06-18

- Added build-breakdown writing articles for 24 portfolio projects, giving the project catalog a clearer implementation layer.
- Cleaned up `/contact`, removed redundant copy, and dropped the old "not a fit" section.
- Hardened fantasy snapshot freshness and push behavior, authenticated the SpaceX Launch Library path where possible, added a SpaceX snapshot freshness gate, and aligned fantasy snapshot tests with the populated ADP seed.
- Redesigned Formula 1 Pulse with a more dynamic dashboard treatment and fixed the header brand/nav baseline alignment.

---

## 2026-06-15

- Fixed correctness, crash, and SEO bugs across snapshot builders, dashboard clients, local-storage tools, RSS, search, metadata, and the MBA email path.
- Corrected title de-duplication so the homepage keeps the site name in its document title.
- Tightened recipe and wine-cellar parsing tests and hardened several page-level data paths after the June launch wave.

---

## 2026-06-10

- Added a dozen writing pieces across horology, the AI mega-cap rally, AI-agent production practice, AI PM interviews, competitive analysis workflows, and June fantasy-football prep.
- Added real position data to the investments research column, including shares, average cost, market value, total return, day P/L, and allocation context drawn from the local portfolio.
- Added cost-basis and 50-day moving-average overlays to the investments price chart and cleaned up news cards with monogram thumbnails and timestamps.
- Refined responsive fantasy draft-tracker and tier layouts.

---

## 2026-06-09

- Launched Earthquake Pulse, Bay Area Transit Pulse, and Tech Startup Tracker as snapshot-driven dashboards with fail-soft refresh behavior.
- Upgraded the travel planner with itinerary time windows, overlap detection, day color-coding, progress, mood icons, and a storage-corruption fix.
- Moved more surfaces onto the editorial token system, added dashboard loading states, lazy-loaded heavier panels, improved dashboard table accessibility, and expanded unit coverage across March Madness, sports dashboards, polling, recipes, wine cellar, museum log, and Interchange IQ.

---

## 2026-06-08

- Launched World Cup Pulse as a 2026 tournament hub that can become a live dashboard as ESPN-backed snapshots fill in groups, knockout rounds, fixtures, and scorers.
- Published the World Cup contenders countdown and companion tournament-format writing.
- Added a retirement planner inside the investments dashboard with allocation-derived assumptions, seeded Monte Carlo bands, two-phase projections, taxes, RMDs, Social Security mechanics, withdrawal levers, and editable disclosures.
- Rebuilt Food Map on Leaflet as a multi-city curated surface with Miami, Atlanta, Copenhagen, San Sebastián, and Austin.
- Launched the Fantasy Formula 1 optimizer and sharpened the fantasy football board with tier grouping, density controls, and stronger data-source framing.

---

## 2026-05-31

- Refreshed the about and portfolio surfaces to match the current positioning and layout system.
- Added the shared `HomeStatsPanel` to the homepage and writing archive.
- Hardened player ID validation and snapshot handling across sports data modules, moved NBA player stats to a newer ESPN endpoint, and aligned UI copy with `WRITING_VOICE.md`.

---

## 2026-05-26

- Added the `WritingArchiveV3` browsing experience with stronger article filtering and a clearer archive layout.
- Refactored shared error handling and logging across multiple components so route failures use more consistent reporting.

---

## 2026-05-11

- Enhanced the MBA job application tracking workflow and tightened the league snapshot quality gate so generated snapshot checks do not mistake imports for data bodies.

---

## 2026-05-04

- Launched `/travel`, a browser-local trip planner with day-by-day itineraries and per-trip journals.
- Added workflows to refresh sports snapshots for MLB, NBA, NFL, and SpaceX.
- Refactored March Madness tests to cover the newer analytics and companion article links.

---

## 2026-04-29

- Launched NBA Pulse, MLB Pulse, NFL Pulse, GitHub Trending Pulse, and Frontier Model Tracker using the shared snapshot-driven dashboard pattern.
- Launched Food Map, Wine Cellar, Museum Log, and Recipe Finder as browser-persisted or curated personal tools.
- Added a large writing wave across analytics, growth, pricing strategy, performance monitoring, QA automation, product launches, and civic-engagement platforms.
- Improved accessibility and color-variable usage across components and cleaned up the changelog structure.

---

## 2026-04-26

- Rolled out the Editorial V3 design system across the homepage hero, the writing archive, and the investments dashboard.
- Rebuilt investments into a unified portfolio-plus-research shell with a three-column dashboard, hero balance card, dense stats grid, and key-metrics asset header.
- Cut PR E2E feedback time, improved snapshot-refresh CI hygiene, and added retry behavior for snapshot-bot push races.

---

## 2026-04-25

- Worked through the full-site design and UX audit backlog across shell, writing, dashboards, fantasy, fintech, and the MBA tracker.
- Fixed high-priority empty states, tab accessibility, polling announcements, dropdown behavior, URL-state edge cases, pagination, and dashboard polish items.
- Documented shipped audit items so the remaining backlog stayed focused on open work instead of already-fixed issues.

---

## 2026-04-22

- Reworked the fantasy football tool surface and hardened the investments refresh pipeline with clearer data freshness messaging.
- Fixed dark-mode elevation and touch-target compliance issues across the editorial surface.

---

## 2026-04-21

- Added public `/now` and `/changelog` surfaces so current focus and shipped changes have first-class routes.
- Published four April hot-topic deep dives and archived shipped implementation plans for traceability.
- Backfilled the MBA role tracker into route and API inventories.

---

## 2026-04-20

- Refreshed the MBA internship tracker layout, compacted company filters, expanded role search and career-type filtering, tightened job matching, and featured the tracker on the homepage.
- Added Resend environment documentation for email notification setup.

---

## 2026-04-10

- Launched `/mba-internship-notifications`, an MBA internship notifications dashboard with role aggregation, source curation, and email notifications.
- Added and rewrote agentic AI articles across marketing, customer support, product management, and architecture.
- Migrated live stock quotes to Finnhub and improved the investments search/sidebar experience.
- Updated Premier League detail views and continued the football dashboard tabbed-layout work.

---

## 2026-04-08

- Launched the political polling aggregator dashboard with a new component set and refreshed route styling.
- Continued structural cleanup across contact, writing cards, and shared journey components.

---

## 2026-04-05

- Rebuilt the SEO archive structure, refreshed homepage content, and improved accessibility metadata across key pages.
- Enhanced article and case-study Open Graph metadata.
- Documented the football snapshot workflow across architecture, development, automation, components, and testing docs.
- Archived legacy one-time summary files under `docs/archive/`.

---

## 2026-04-02

- Launched News Pulse, SpaceX Mission Control, and Interchange IQ as standalone data and fintech tools.
- Added investments refresh automation and clearer price-freshness labels, while hardening search hydration, RSS coverage, and quote fallback tests.
- Optimized public bundles, restored analyzer reporting, and moved the homepage featured-work placeholders onto real project titles.

---

## 2026-03-30

- Added the news media AI strategy case study for the Atlantic Media fellowship track.
- Fixed fantasy snapshot freshness and stale client-state handling after the corrected fantasy data model shipped.
- Added the canonical `AGENTS.md` guide and repointed the compatibility `AGENT.md` file.

---

## 2026-03-28

- Stabilized SpaceX mission image caching and fixed hydration issues on SpaceX Mission Control.
- Continued fantasy snapshot freshness and stale-client-state fixes around the corrected fantasy data model.

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

## 2026-03-15

- Published and revised the agentic AI writing series across marketing, customer support, product management, and architecture.
- Tightened the theme-toggle fallback path while the writing surface was being reworked into a sharper voice.

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

## 2026-03-02

- Added investments as a featured public work item and restored the investments case study path.
- Added the fantasy football analytics placeholder to the portfolio.
- Configured the Netlify Next.js plugin, standalone output, and webpack production builds to reduce function-bundle size and match local dev behavior.

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
