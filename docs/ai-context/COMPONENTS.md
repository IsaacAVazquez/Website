# Components — AI Context

Current component ownership reference.

**Last updated:** 2026-09-21

---

## Shared Shell

| Component | File | Notes |
|----------|------|------|
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Picks the shell. The seven routes in `src/constants/catalog97Nav.ts` pass through and render `Catalog97Shell` themselves; every other route is wrapped in `Catalog97ToolShell` |
| `Catalog97Shell` | `src/components/catalog97/Catalog97Shell.tsx` | Header, the only page-level `main`, and the espresso footer |
| `Catalog97ToolShell` | `src/components/catalog97/Catalog97ToolShell.tsx` | `Catalog97Shell` plus an optional title band and the build-note aside from `projectBuildNoteLinks` |
| `Catalog97Header` | `src/components/catalog97/Catalog97Header.tsx` | Global nav built from `catalog97NavLinks` |
| `Providers` | `src/components/Providers.tsx` | Root provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | Theme context |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback re-exported by per-route `error.tsx` files |

---

## Portfolio And Homepage

The seven designed routes each render one page component from `src/components/catalog97/`.

| Route | Component |
|------|-----------|
| `/` | `Catalog97Home` |
| `/portfolio` | `Catalog97Portfolio` |
| `/writing` | `Catalog97Writing` |
| `/dashboards` | `Catalog97Dashboards` |
| `/about` | `Catalog97About` |
| `/resume` | `Catalog97Resume` |
| `/contact` | `Catalog97Contact` |

`Catalog97Primitives.tsx` holds the shared `Catalog97Plate` and `Catalog97Slot` pieces. `SectionIntro` (`src/components/ui/SectionIntro.tsx`) is still the shared page and section intro for tool routes, and `headingLevel` should be set explicitly when it is used below the route `h1`.

The earlier homepage and portfolio components (`ModernHero`, `FeaturedWorkSection`, `PortfolioProjectCard`, `ThinkingPreview`, `ContactSection`, `About`, `ContactContent`, `ProjectsContent`, `WritingPreview`) no longer exist. See the root `COMPONENTS.md` and `AGENTS.md` for the wider component map.

---

## Writing And SEO

| Component | Role |
|----------|------|
| `StructuredData` | JSON-LD helper |
| `AIStructuredData` | AI-oriented structured data helper |
| `AuthorBio` | Writing article author block |

---

## Investments

Primary investments components:

- `InvestmentsDashboard`
- `PortfolioHeroCard`
- `PortfolioStatsGrid`
- `PortfolioSummary`
- `HoldingsTable`
- `StockSearch`
- `AddStockForm`
- `AllocationChart`
- `PortfolioPerformanceChart`
- `ResearchAssetHeader`
- `ResearchOverview`
- `ResearchPosition`
- `ResearchSection`
- `ComparisonTab`
- `PriceChartPanel`
- `FinancialStatementsPanel`
- `GrowthPanel`
- `ValuationRatiosPanel`
- `ProfitabilityPanel`
- `IndustryPanel`

Top-level ownership:

- `src/app/investments/investments-client.tsx` is the route shell
- it renders `InvestmentsDashboard` from `src/components/investments/InvestmentsDashboard.tsx`
- retirement planner UI lives in `src/components/investments/retirement/` on top of the pure engine in `src/lib/retirement/`

---

## Football Dashboards

Shared components for `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, and `/world-cup-2026` live in `src/components/football/`:

- `FixtureCard`
- `FixtureGroupSection`
- `LeaderList`
- `StatCard`
- `MetricCard`
- `InfoChip`
- `CrestAvatar`
- `TeamResultPill`
- `SurfaceCard`
- `EmptyPanel`

Page-level clients live at `src/app/premier-league/premier-league-client.tsx` and `src/app/la-liga/la-liga-client.tsx`.

---

## Standalone Data Tools

- `src/app/news-pulse/*` plus `src/lib/news-pulse-utils.ts`
- `src/components/spacex/*` plus `src/app/spacex-mission-control/*`
- `src/app/mlb/*`, `src/app/nba/*`, `src/app/nfl/*`, and `src/components/football/*`
- `src/app/golf/*` plus `src/data/golfSnapshot.ts`
- `src/app/world-cup-2026/*` plus `src/data/worldCupSnapshot.ts`
- `src/app/bay-area-transit/*` plus `src/data/bayAreaTransitSnapshot.ts`
- `src/app/earthquake-pulse/*` plus `src/data/earthquakeSnapshot.ts`
- `src/app/tech-startup-tracker/*` plus `src/data/techStartupSnapshot.ts`
- `src/app/travel/*` plus `src/hooks/useTravelPlanner.ts`
- `src/app/polling-aggregator/*` plus `src/data/pollingSnapshot.ts`
- `src/app/fintech-tools/budget-planner/*` plus `src/hooks/useBudgetPlanner.ts`
- `src/app/fintech-tools/interchange-iq/*`

---

## Fantasy Football

Route clients:

- `src/app/fantasy-football/fantasy-football-client.tsx` — tier-plate rankings board from the `draft-rankings` design template (sticky position/scoring/search bar, avg-rank cliff separators, expert-spread bars, windowing, and its own player drawer with neighborhood, queue, and notes)
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx` — draft assistant (reuses snapshot + shared drawer/compare/notes/queue)
- `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftAnalyticsPanel.tsx` — live signals card + completion recap, backed by the pure `draftAnalytics` engine

Shared presentation components in `src/components/fantasy/` (barrel-exported via `index.ts`):

- `PositionFilterBar` (+ `PositionFilterOption` type) — shared position pill radiogroup with per-slice availability/NA states
- `PlayerDetailDrawer` — focus-trapped detail drawer/bottom-sheet (position rank, tier N of M, ADP, distribution bar, editable private note, queue/compare toggles); used by the draft assistant and best ball, while the rankings board renders its own template drawer in `fantasy-football-client.tsx`
- `RankDistributionBar` — expert best→worst spread with consensus marker and tight/mixed/volatile coloring
- `CompareTray` — docked bottom bar for the pinned compare selection (up to 3)
- `CompareModal` — side-by-side compare dialog with per-row winner highlighting

Cross-surface browser-local stores (shared by both clients) in `src/hooks/`:

- `usePlayerQueue` — starred watchlist of player ids (`fantasy-player-queue-v1`)
- `usePlayerNotes` — private per-player notes, 280-char cap (`fantasy-player-notes-v1`)
- `useCompareTray` — compare selection, max 3 (`fantasy-compare-v1`)
- `useLocalStorageString` — low-level reactive single-key localStorage reader the three stores build on
- list density preference lives inline in `fantasy-football-client.tsx` via `useSyncExternalStore` (`fantasy-board-density`)
- draft state persists per-season under `fantasy-draft-tracker-v3-<season>`

Supporting libs:

- `src/lib/fantasyUtils.ts` — board math, formatting, and legend copy (`getValueVsAdp`, `getConsensusSpread`, `withTierBreaks`, freshness helpers, `FANTASY_BOARD_LEGEND`)
- `src/lib/draftAnalytics.ts` — pure steal/reach/position-run engine consumed by `DraftAnalyticsPanel`
- `src/lib/fantasyLocal.ts` — parse/serialize helpers + storage-key constants for the queue/notes/compare stores

These work with the generated fantasy snapshots (loaded through `useFantasySnapshot`) and `/api/fantasy-data` route described elsewhere in `docs/ai-context`.

---

## UI Primitives

Current primitives worth reusing first:

- `WarmCard`
- `ModernButton`
- `Heading`
- `Paragraph`
- `Badge`
- `Chip`
- `Kicker`
- `SectionIntro`
- `ThemeToggle`
- `ServerIcons`

Shared primitive rules:

- `Catalog97Shell` owns the only page-level `main`, on every route; `ConditionalLayout` renders none
- `SectionIntro` should be treated as semantic, not decorative; pass `headingLevel={1}` only for the page-level heading
- shared shell primitives should not use `transition-all`

---

## Practical Rule

When docs and code disagree about component ownership, verify the route entry file first. The current route file is the best indicator of which component path is live.
