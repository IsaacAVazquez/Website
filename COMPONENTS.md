# Component Reference

Current component map for the live application.

**Last updated:** 2026-08-11

> Seven routes (`/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`,
> `/contact`) render Catalog 97 composition roots from `src/components/catalog97/`.
> Every other route still runs on Working Instrument. The `*Instrument` composition
> roots that used to own those seven were deleted when Catalog 97 replaced them, as
> were the older single-purpose homepage components this doc once listed. Anything
> still on disk but unrouted is under *Legacy Or Unwired Components*.

---

## Component Groups

### Root shell and shared surfaces

| Component | File | Role |
|----------|------|------|
| `StaticHeader` | `src/components/StaticHeader.tsx` | Global sticky navigation |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Route-aware content wrapper and footer selection |
| `Footer` | `src/components/Footer.tsx` | Full or compact footer |
| `Providers` | `src/components/Providers.tsx` | Theme provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | `next-themes` wrapper |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared editorial-styled error fallback re-exported by per-route `error.tsx` files |
| `ContactCta` | `src/components/ContactCta.tsx` | Shared closing contact CTA used by the full footer |

### Homepage, work, writing, dashboards, about, résumé, contact

These seven routes run on Catalog 97 rather than on Working Instrument. Each
renders one composition root from `src/components/catalog97/`, wrapped in
`Catalog97Shell`, and the route page is a thin server shell that passes data in.
The tokens live in `src/app/catalog97.css`, scoped entirely under `.c97-page`.
`StaticHeader` and `ConditionalLayout` both stand down on these routes (see
`isCatalog97Route` in `src/constants/catalog97Nav.ts`), so the shell owns the
page's only `<main>`, header, and footer.

| Component | File | Role |
|----------|------|------|
| `Catalog97Shell` | `src/components/catalog97/Catalog97Shell.tsx` | Page wrapper: header, `<main>`, pine wordmark band, espresso footer |
| `Catalog97Header` | `src/components/catalog97/Catalog97Header.tsx` | Client header with seven route links, site search, theme control, and an oxblood rule under the active route |
| `Catalog97Primitives` | `src/components/catalog97/Catalog97Primitives.tsx` | `Catalog97Plate` (Anton numeral) and `Catalog97Slot` (flat image field) |
| `Catalog97Home` | `src/components/catalog97/Catalog97Home.tsx` | `/` composition root. Props: `featuredProjects`, `recentPosts`, `heroIndex`, `liveToolGroups`, `liveFeed` |
| `Catalog97Portfolio` | `src/components/catalog97/Catalog97Portfolio.tsx` | `/portfolio` index with client-side search, sorting, and category filters over `classifyToolSlug` |
| `Catalog97Writing` | `src/components/catalog97/Catalog97Writing.tsx` | `/writing` index with client-side search, sorting, cluster/length/bucket filters, and topic links |
| `Catalog97Dashboards` | `src/components/catalog97/Catalog97Dashboards.tsx` | `/dashboards` mosaic. Props: `groups`, `summaries` |
| `Catalog97About` | `src/components/catalog97/Catalog97About.tsx` | `/about` content, reads `careerTimeline` |
| `Catalog97Resume` | `src/components/catalog97/Catalog97Resume.tsx` | `/resume` content |
| `Catalog97Contact` | `src/components/catalog97/Catalog97Contact.tsx` | `/contact` content, with no form because there is no form backend |

### Writing and structured data

| Component | File | Role |
|----------|------|------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD injection |
| `AIStructuredData` | `src/components/AIStructuredData.tsx` | AI-oriented structured data helper |
| `AuthorBio` | `src/components/ui/AuthorBio.tsx` | Article author card |

### Fantasy football

Representative live components:

- `src/app/fantasy-football/fantasy-football-client.tsx`
- `src/app/fantasy-football/best-ball/best-ball-client.tsx`
- `src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx`
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`

These are used across `/fantasy-football/*` routes.

`src/components/newsletter/NewsletterSignup.tsx` is the shared public email opt-in used by the writing archive, fantasy rankings, and Agent Build Index. It posts to `/api/newsletter/subscribe` and records a conversion only after the contact API succeeds.

Shared fantasy presentation components live in `src/components/fantasy/`
(exported via `index.ts`) and are reused by both the rankings board and the
draft assistant:

| Component | File | Role |
|----------|------|------|
| `PositionFilterBar` | `src/components/fantasy/PositionFilterBar.tsx` | Generic position pill radiogroup with per-slice availability/NA states, shared by rankings and draft boards |
| `PlayerDetailDrawer` | `src/components/fantasy/PlayerDetailDrawer.tsx` | Focus-trapped player detail drawer/bottom-sheet with tier context, ADP, distribution bar, queue/compare toggles, and editable note; used by the draft assistant and best ball, while the rankings board renders its own tier-plate drawer inside `fantasy-football-client.tsx` |
| `RankDistributionBar` | `src/components/fantasy/RankDistributionBar.tsx` | Visualizes expert best→worst rank spread with the average marked and tight/mixed/volatile color coding |
| `CompareTray` | `src/components/fantasy/CompareTray.tsx` | Docked bottom bar surfacing the compare selection (up to 3 players) that opens the `CompareModal` |
| `CompareModal` | `src/components/fantasy/CompareModal.tsx` | Side-by-side comparison dialog with per-row winner highlighting and shared-scale range bars |
| `DraftValuePanel` | `src/components/fantasy/DraftValuePanel.tsx` | Shared room-relative Draft Outlook, draft-slot context, published BBM field math, and user-entered expected return calculator for redraft and best ball trackers |

### Investments

`InvestmentsDashboard` (`src/components/investments/InvestmentsDashboard.tsx`) is
the main shell rendered by `src/app/investments/investments-client.tsx`. It
composes the portfolio and research surfaces (all under
`src/components/investments/`):

- Portfolio: `PortfolioSummary`, `PortfolioHeroCard`, `PortfolioStatsGrid`, `HoldingsTable`, `AddStockForm`, `AllocationChart`, `PortfolioPerformanceChart`
- Research: `StockResearch`, `StockSearch`, `ResearchOverview`, `ResearchSidebar`, `ResearchSection`, `ResearchAssetHeader`, `ResearchPosition`
- Research panels: `PriceChartPanel`, `FinancialStatementsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `ProfitabilityPanel`, `IndustryPanel`
- Comparison: `ComparisonTab`, `ComparisonMetricTable`, `ComparisonRadarChart`
- Freshness / chrome: `DataFreshnessIndicator`, `MetricTooltip`, `ErrorState`

Retirement planner components live in `src/components/investments/retirement/`
(`RetirementPlanner` shell, `RetirementInputs`/`RetirementFields`,
`RetirementVerdict`, `RetirementProjectionChart` D3 confidence-band chart,
`RetirementLevers`, `RetirementAssumptions`, `RetirementDisclaimer`). They sit on
the pure engine in `src/lib/retirement/` and `useRetirementPlan` browser-local
state — see `RETIREMENT_PLANNER_ENGINE.md` for the engine reference.

### Football dashboards

Shared components for the `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, and `/world-cup-2026` dashboards. All live in `src/components/football/`.

| Component | File | Role |
|----------|------|------|
| `FixtureCard` | `src/components/football/FixtureCard.tsx` | Single fixture result or upcoming match card |
| `FixtureGroupSection` | `src/components/football/FixtureGroupSection.tsx` | Grouped fixture list by matchday or date |
| `LeaderList` | `src/components/football/LeaderList.tsx` | Scorers and assists leaderboard |
| `StatCard` | `src/components/football/StatCard.tsx` | Single stat display with label and value |
| `MetricCard` | `src/components/football/MetricCard.tsx` | Metric highlight card with optional trend |
| `InfoChip` | `src/components/football/InfoChip.tsx` | Inline label chip for league/competition context |
| `CrestAvatar` | `src/components/football/CrestAvatar.tsx` | Team crest image with fallback initials |
| `TeamResultPill` | `src/components/football/TeamResultPill.tsx` | Win/draw/loss pill for form strips |
| `SurfaceCard` | `src/components/football/SurfaceCard.tsx` | Consistent card surface wrapper |
| `EmptyPanel` | `src/components/football/EmptyPanel.tsx` | Empty-state placeholder panel |

### Standalone data tools

Most of these are snapshot-driven dashboards that share one architecture
(seed → builder → GitHub Action → accessors → API). See
`SNAPSHOT_DRIVEN_DASHBOARDS.md` for the shared pattern, and
`PERSONAL_INTEREST_TOOLS.md` for the browser-persisted tools (`/travel`,
`/wine-cellar`, `/museum-log`, `/recipe-finder`, `/food-map`).

| Area | Primary files | Role |
|------|---------------|------|
| News Pulse | `src/app/news-pulse/*`, `src/lib/news-pulse-utils.ts` | News dashboard route and API-backed article summaries |
| SpaceX Mission Control | `src/components/spacex/*`, `src/app/spacex-mission-control/*` | SpaceX launch dashboard, mission cards, detail panels, patch and vehicle visuals |
| Polling Aggregator | `src/app/polling-aggregator/*`, `src/data/pollingSnapshot.ts` | Snapshot-backed polling dashboard and deep-linkable route state |
| Budget Planner | `src/app/fintech-tools/budget-planner/*`, `src/hooks/useBudgetPlanner.ts` | Client-side budget planning tool |
| Interchange IQ | `src/app/fintech-tools/interchange-iq/*` | Client-side interchange fee analyzer |
| MBA Role Tracker | `src/app/mba-internship-notifications/*`, `src/constants/mba-companies.ts`, `src/lib/mba-job-matching.ts`, `src/types/mba-jobs.ts` | Client shell (`MBAJobsClient`) plus deep-link state helper (`mba-jobs-state.ts`) backed by `/api/mba-jobs`; uses `src/app/api/mba-jobs/email` for Resend digests |
| World Cup Pulse | `src/app/world-cup-2026/*`, `src/data/worldCupSnapshot.ts`, `src/lib/worldCupSnapshot.ts` | Snapshot-backed 2026 FIFA World Cup hub reusing `src/components/football/*` |
| Bay Area Transit Pulse | `src/app/bay-area-transit/*`, `src/data/bayAreaTransitSnapshot.ts`, `src/lib/bayAreaTransitSnapshot.ts` | Snapshot-backed BART dashboard with lines, station departure boards, and advisories |
| Tech Startup Tracker | `src/app/tech-startup-tracker/*`, `src/data/techStartupSnapshot.ts`, `src/lib/techStartups.ts` | Editorially curated startup funding tracker with deep-linkable sector/stage state |
| Travel Planner | `src/app/travel/*`, `src/hooks/useTravelPlanner.ts` | Browser-persisted trip planner client (`travel-planner-client.tsx`) for itineraries and journaling |
| Golf | `src/app/golf/*`, `src/data/golfSnapshot.ts` | Snapshot-backed PGA Tour leaderboard dashboard |

---

## UI Primitives

Core UI primitives live under `src/components/ui/`.

Most reused primitives:

- `WarmCard`
- `ModernButton`
- `Heading`
- `Paragraph`
- `Badge`
- `ThemeToggle`
- `SectionIntro`
- `ServerIcons`
- `dropdown-menu.tsx`

Editorial shared components also live under `src/components/editorial/`; use them when working in the current `--home-*` visual system.

Styling guidance for these lives in `STYLING.md`.

---

## Current Live Ownership

### `/portfolio`

`src/app/portfolio/page.tsx` renders the project grid directly.

### Homepage

`src/app/page.tsx` renders `Catalog97Home` (plus the `StructuredData` /
`AIStructuredData` JSON-LD injectors). `Catalog97Home` is a self-contained
composition that supplies its own header and footer through `Catalog97Shell`. It
still reads the live quake, market, and launch feed through `HomeLiveFeed`, each
of which fails soft to null so a missing snapshot drops its column rather than
rendering an empty one.

### `/investments`

`src/app/investments/investments-client.tsx` is the top-level shell; it renders
`InvestmentsDashboard`, which composes the portfolio and research surfaces listed
above.

### `/march-madness-2026`

The page uses a server entry plus client UI:

- `src/app/march-madness-2026/page.tsx`
- `src/app/march-madness-2026/march-madness-client.tsx`

### Football dashboards

The page-level clients are:

- `src/app/premier-league/premier-league-client.tsx`
- `src/app/la-liga/la-liga-client.tsx`

Route state helpers live next to each client and have unit coverage for invalid params and deep links.

---

## Legacy Or Unwired Components

The pre-Catalog 97 homepage and portfolio components were deleted in August 2026,
so read them from git history if you need that context. The `*Instrument`
composition roots replaced them on the live routes, and the Catalog 97 roots in
turn replaced the `*Instrument` files, which are gone.

Under `src/components/home/`, `HomeLiveFeed.tsx`, `PanelClock.tsx`,
and `HomeStatsPanel.tsx` are all still wired up, the last into 27 dashboard
clients.

---

## Testing Coverage

Current component-oriented tests include:

- `src/components/__tests__/StaticHeader.test.tsx`
- `src/components/__tests__/Footer.test.tsx`
- `src/components/__tests__/ConditionalLayout.test.tsx`
- tests under `src/components/ui/__tests__/`
- investments component tests under `src/components/investments/__tests__/`

See `TESTING.md` for the broader strategy.
