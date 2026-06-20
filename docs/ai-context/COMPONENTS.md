# Components — AI Context

Current component ownership reference.

**Last updated:** 2026-06-19

---

## Shared Shell

| Component | File | Notes |
|----------|------|------|
| `StaticHeader` | `src/components/StaticHeader.tsx` | Current global nav |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Route wrapper + footer variant logic |
| `Footer` | `src/components/Footer.tsx` | `full` and `compact` variants |
| `Providers` | `src/components/Providers.tsx` | Root provider wrapper |
| `ThemeProvider` | `src/components/ThemeProvider.tsx` | Theme context |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback re-exported by per-route `error.tsx` files |

---

## Portfolio And Homepage

| Component | Role |
|----------|------|
| `ModernHero` | Homepage hero |
| `FeaturedWorkSection` | Homepage featured projects |
| `PortfolioProjectCard` | Shared project card for homepage and `/portfolio` |
| `ThinkingPreview` | Homepage product-thinking section |
| `ContactSection` | Homepage CTA section |
| `About` | About page tab UI |
| `ContactContent` | Contact page |
| `SectionIntro` | Shared page/section intro; set `headingLevel` explicitly when used below the route `h1` |

Legacy/unwired caution:

- `ProjectsContent.tsx` still exists, but `/portfolio` does not currently render through it
- `WritingPreview.tsx` still exists, but it is not part of the current homepage shell

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

- `PortfolioTracker`
- `StockResearch`
- `PortfolioSummary`
- `StockCard`
- `AddStockForm`
- `AllocationChart`
- `PortfolioPerformanceChart`
- `ResearchSummaryStrip`
- `ResearchOverview`
- `ComparisonTab`
- `PriceChartPanel`
- `DCFPanel`
- `FundamentalsPanel`
- `FinancialStatementsPanel`
- `GrowthPanel`
- `ValuationRatiosPanel`
- `ProfitabilityPanel`
- `IndustryPanel`
- `NewsPanel`

Top-level ownership:

- `src/app/investments/investments-client.tsx` is the route shell
- it lazy-loads `PortfolioTracker` and `StockResearch`
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

- `src/app/fantasy-football/fantasy-football-client.tsx` — rankings board (List/Tiers, position/scoring/search filters, density toggle, infinite-scroll windowing, sidebar, stats panel, legend)
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx` — draft assistant (reuses snapshot + shared drawer/compare/notes/queue)
- `src/app/fantasy-football/draft-tracker/components/DraftBoard.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftAnalyticsPanel.tsx` — live signals card + completion recap, backed by the pure `draftAnalytics` engine

Shared presentation components in `src/components/fantasy/` (barrel-exported via `index.ts`):

- `TierBreakdown` — Tiers view (tier-grouped sections, counts, rank ranges, rank-cliff hints)
- `RankingsListRow` — single List-view row (published rank, position chip, expert range, ADP Value/Reach chip, rostered %/bye, queue + compare toggles, `compact` density)
- `TierBreakSeparator` — labeled tier-boundary rule injected into the List view
- `PositionFilterBar` (+ `PositionFilterOption` type) — shared position pill radiogroup with per-slice availability/NA states
- `FantasyBoardLegend` — collapsible "How to read this board" key keyed to `FANTASY_BOARD_LEGEND`
- `PlayerDetailDrawer` — shared focus-trapped detail drawer/bottom-sheet (position rank, tier N of M, ADP, distribution bar, editable private note, queue/compare toggles)
- `RankDistributionBar` — expert best→worst spread with consensus marker and tight/mixed/volatile coloring
- `CompareTray` — docked bottom bar for the pinned compare selection (up to 3)
- `CompareModal` — side-by-side compare dialog with per-row winner highlighting

Cross-surface browser-local stores (shared by both clients) in `src/hooks/`:

- `usePlayerQueue` — starred watchlist of player ids (`fantasy-player-queue-v1`)
- `usePlayerNotes` — private per-player notes, 280-char cap (`fantasy-player-notes-v1`)
- `useCompareTray` — compare selection, max 3 (`fantasy-compare-v1`)
- `useLocalStorageString` — low-level reactive single-key localStorage reader the three stores build on
- list density preference lives inline in `fantasy-football-client.tsx` via `useSyncExternalStore` (`fantasy-board-density`)
- draft state persists per-season under `fantasy-draft-tracker-v2-<season>`

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
- `JourneyTimeline`
- `SectionIntro`
- `ThemeToggle`
- `ServerIcons`
- `button.tsx`
- `dropdown-menu.tsx`

Shared primitive rules:

- `ConditionalLayout` owns the only `main` for self-shell routes
- `SectionIntro` should be treated as semantic, not decorative; pass `headingLevel={1}` only for the page-level heading
- shared shell primitives should not use `transition-all`

---

## Practical Rule

When docs and code disagree about component ownership, verify the route entry file first. The current route file is the best indicator of which component path is live.
