# Component Reference

Current component map for the live application.

**Last updated:** 2026-06-19

> The homepage, about, portfolio, contact, and writing-archive surfaces each render
> a single dedicated `*Instrument` composition root (the Working Instrument redesign).
> The older single-purpose homepage components (`ModernHero`, `ThinkingPreview`,
> `ContactSection`) and the `FeaturedWorkSection`/`ContactContent` names this doc
> previously listed are no longer wired into any route — see *Legacy Or Unwired
> Components*.

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

### Homepage, about, portfolio, contact, writing

Each of these editorial surfaces renders a single dedicated `*Instrument`
composition root (the Working Instrument redesign). The route page is a thin
server shell that passes data in.

| Component | File | Role |
|----------|------|------|
| `HomeInstrument` | `src/components/home/HomeInstrument.tsx` | Homepage composition root (hero, featured work, writing, contact). Props: `featuredProjects`, `recentPosts`, `heroIndex`, `liveToolGroups`, `liveFeed` |
| `AboutInstrument` | `src/components/about/AboutInstrument.tsx` | `/about` content |
| `PortfolioInstrument` | `src/components/portfolio/PortfolioInstrument.tsx` | `/portfolio` project grid and surfacing |
| `ContactInstrument` | `src/components/contact/ContactInstrument.tsx` | `/contact` content |
| `WritingInstrument` | `src/components/writing/WritingInstrument.tsx` | `/writing` archive index |
| `ProjectDetailModal` | `src/components/ProjectDetailModal.tsx` | Legacy project modal, imported only by `ProjectsContent.tsx` (non-primary flow) |

### Writing and structured data

| Component | File | Role |
|----------|------|------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD injection |
| `AIStructuredData` | `src/components/AIStructuredData.tsx` | AI-oriented structured data helper |
| `AuthorBio` | `src/components/ui/AuthorBio.tsx` | Article author card |

### Fantasy football

Representative live components:

- `src/app/fantasy-football/fantasy-football-client.tsx`
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`

These are used across `/fantasy-football/*` routes.

Shared fantasy presentation components live in `src/components/fantasy/`
(exported via `index.ts`) and are reused by both the rankings board and the
draft assistant:

| Component | File | Role |
|----------|------|------|
| `TierBreakdown` | `src/components/fantasy/TierBreakdown.tsx` | Tiers view: FantasyPros tier-grouped sections with player counts, rank ranges, and rank-cliff hints |
| `FantasyBoardLegend` | `src/components/fantasy/FantasyBoardLegend.tsx` | Collapsible "How to read this board" key, sourced from `FANTASY_BOARD_LEGEND` |
| `PositionFilterBar` | `src/components/fantasy/PositionFilterBar.tsx` | Generic position pill radiogroup with per-slice availability/NA states, shared by rankings and draft boards |
| `RankingsListRow` | `src/components/fantasy/RankingsListRow.tsx` | Single List-view row: published rank, position chip, note indicator, metric strip, and star/compare toggles |
| `TierBreakSeparator` | `src/components/fantasy/TierBreakSeparator.tsx` | Labeled rule injected into the List view at tier boundaries with rank-cliff hints |
| `PlayerDetailDrawer` | `src/components/fantasy/PlayerDetailDrawer.tsx` | Shared focus-trapped player detail drawer/bottom-sheet with tier context, ADP, distribution bar, queue/compare toggles, and editable note |
| `RankDistributionBar` | `src/components/fantasy/RankDistributionBar.tsx` | Visualizes expert best→worst rank spread with the average marked and tight/mixed/volatile color coding |
| `CompareTray` | `src/components/fantasy/CompareTray.tsx` | Docked bottom bar surfacing the compare selection (up to 3 players) that opens the `CompareModal` |
| `CompareModal` | `src/components/fantasy/CompareModal.tsx` | Side-by-side comparison dialog with per-row winner highlighting and shared-scale range bars |

### Investments

`InvestmentsDashboard` (`src/components/investments/InvestmentsDashboard.tsx`) is
the main shell rendered by `src/app/investments/investments-client.tsx`. It
composes the portfolio and research surfaces (all under
`src/components/investments/`):

- Portfolio: `PortfolioSummary`, `PortfolioHeroCard`, `PortfolioStatsGrid`, `HoldingsTable`, `AddStockForm`, `AllocationChart`, `PortfolioPerformanceChart`, `Sparkline`
- Research: `StockResearch`, `StockSearch`, `ResearchOverview`, `ResearchSidebar`, `ResearchSection`, `ResearchAssetHeader`, `ResearchPosition`
- Research panels: `PriceChartPanel`, `DCFPanel`, `FinancialStatementsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `ProfitabilityPanel`, `IndustryPanel`
- Comparison: `ComparisonTab`, `ComparisonMetricTable`, `ComparisonRadarChart`
- Freshness / chrome: `DataFreshnessIndicator`, `InvestmentsFreshnessBanner`, `MetricTooltip`, `ErrorState`

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
- `JourneyTimeline`
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
`ProjectsContent.tsx` is not the primary live implementation for this route.

### Homepage

`src/app/page.tsx` renders `HomeInstrument` (plus the `StructuredData` /
`AIStructuredData` JSON-LD injectors). `HomeInstrument` is a self-contained
composition; the older `ModernHero` / `ThinkingPreview` / `ContactSection` files
and `WritingPreview.tsx` still exist in the repo but are no longer wired into the
homepage.

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

These files still exist, but should not be described as the primary live path without confirming current usage:

- `src/components/ProjectsContent.tsx`
- `src/components/WritingPreview.tsx`
- `src/components/ModernHero.tsx`
- `src/components/ThinkingPreview.tsx`
- `src/components/ContactSection.tsx`
- `src/components/ProjectDetailModal.tsx` (imported only by `ProjectsContent.tsx`)

They remain useful as historical or alternate implementation context. The
`*Instrument` composition roots replaced them on the live routes.

---

## Testing Coverage

Current component-oriented tests include:

- `src/components/__tests__/StaticHeader.test.tsx`
- `src/components/__tests__/Footer.test.tsx`
- `src/components/__tests__/ConditionalLayout.test.tsx`
- tests under `src/components/ui/__tests__/`
- investments component tests under `src/components/investments/__tests__/`

See `TESTING.md` for the broader strategy.
