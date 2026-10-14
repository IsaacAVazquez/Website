# Components — AI Context

Current component ownership reference.

**Last updated:** 2026-10-13

---

## Shared Shell

| Component | File | Notes |
|----------|------|------|
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Picks the shell. The seven routes in `src/constants/catalog97Nav.ts` pass through and render `Catalog97Shell` themselves; every other route is wrapped in `Catalog97ToolShell` |
| `Catalog97Shell` | `src/components/catalog97/Catalog97Shell.tsx` | Header, the only page-level `main`, and the espresso footer |
| `Catalog97ToolShell` | `src/components/catalog97/Catalog97ToolShell.tsx` | `Catalog97Shell` plus the build-note aside from `projectBuildNoteLinks` |
| `Catalog97Header` | `src/components/catalog97/Catalog97Header.tsx` | Global nav built from `catalog97NavLinks` |
| `Providers` | `src/components/Providers.tsx` | Root provider wrapper |
| `FragmentLinkNavigation` | `src/components/navigation/FragmentLinkNavigation.tsx` | Mounted once by `Providers`. Follows same-page `#` links from the current address, so Firefox does not load the page again after a route rewrote its URL |
| `FragmentScrollOnLoad` | `src/components/navigation/FragmentScrollOnLoad.tsx` | Mounted once by `Providers`. Lands a fresh load on the element its URL fragment names and holds it there while the page settles, since React reveals a streamed route after the browser has looked the fragment up |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback rendered by the root `src/app/error.tsx` |

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

`Catalog97Primitives.tsx` holds the shared `Catalog97Plate` and `Catalog97Slot` pieces. Tool routes open on their own root, since `SectionIntro` was deleted on 2026-09-27 and `Catalog97ProjectHero` on 2026-10-12, once every project route owned its design.

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
- `FixtureLedgerSection` (in `FixtureLedger.tsx`)
- `LeaderLedger`
- `SeedLadder` (in `SeedLadderPanel.tsx`)
- `DetailDrawer`, which the golf route opens its player detail in as well
- `LeagueTableBoard`
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
- `src/app/golf/*` plus `src/data/golfSnapshot.json`
- `src/app/world-cup-2026/*` plus `src/data/worldCupSnapshot.json`
- `src/app/bay-area-transit/*` plus `src/data/bayAreaTransitSnapshot.json`
- `src/app/earthquake-pulse/*` plus `src/data/earthquakeSnapshot.json`
- `src/app/tech-startup-tracker/*` plus `src/data/techStartupSnapshot.json`
- `src/app/travel/*` plus `src/hooks/useTravelPlanner.ts`
- `src/app/polling-aggregator/*` plus `src/data/pollingSnapshot.json`
- `src/app/fintech-tools/budget-planner/*` plus `src/hooks/useBudgetPlanner.ts`
- `src/app/fintech-tools/interchange-iq/*`
- `src/app/mba-internship-notifications/*` (`MBAJobsClient`, `CandidatesView`, `ApplicationEditDialog`) plus `src/constants/mba-companies.ts` and `src/lib/mba-applications.ts`

---

## Fantasy Football

The eight routes are one product inside `src/app/fantasy-football/layout.tsx`, which sets the kit's root (`ffb-root`), loads the product's typeface, and renders `FantasyProductBar`. The kit is `src/components/fantasy/fantasy.css`, each page or family of shared parts has an area sheet beside it (`fantasy-<area>.css`), and `docs/FANTASY_FOOTBALL_KIT.md` is the reference.

Route clients:

- `src/app/fantasy-football/fantasy-football-client.tsx` — the rankings board (rows under tier breaks with the average-rank cliff, an expert spread plot per row, a pinned toolbar over the column heads, windowing, and its own player drawer with the neighbouring ranks, the queue toggle, and a private note)
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx` — the redraft room (reuses the snapshot, the queue, and the shared drawer)
- `src/app/fantasy-football/draft-tracker/components/DraftSetup.tsx`, `DraftBoard.tsx`, `DraftClock.tsx`, `DraftRecapPanel.tsx`
- `src/app/fantasy-football/draft-tracker/components/DraftAnalyticsPanel.tsx` — live signals and the completion recap, backed by the pure `draftAnalytics` engine
- `src/app/fantasy-football/mock-draft/mock-draft-client.tsx` — the mock draft
- `src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx` — the trade calculator, with `trade-package-fieldset.tsx`, `trade-player-combobox.tsx`, `trade-result-rail.tsx`, `trade-balance-scale.tsx`, and `trade-roster-impact.tsx`
- `src/app/fantasy-football/best-ball/best-ball-client.tsx` — the best ball board
- `src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx` — the best ball room, with `best-ball-draft-board.tsx`, `best-ball-recommendations.tsx`, `best-ball-build-panel.tsx`, and `best-ball-build-sheet.tsx`
- `src/app/fantasy-football/weekly/weekly-client.tsx` — the weekly board and waivers

Shared components in `src/components/fantasy/` (no `index.ts`, so each is imported by its file path):

- `FantasyProductBar` — the bar above every fantasy route that links the eight tools
- `FantasyRouteHeader` (+ `TitleAccent`, `FantasySectionHeading`, `FreshnessParts`) — the page head and the line of source dates
- `FantasyLoadingState` — the loading skeleton in all eight `loading.tsx` files
- `SeasonalScopeNote` — the dated note a draft-season page prints from Week 1
- `PositionFilterBar` (+ `PositionFilterOption` type) — the position switch, one radiogroup with a roving tab stop and a disabled "NA" state per option
- `RankDistributionBar` — the expert spread plot, with the range as a line, one standard deviation as a thicker segment, and the mean as a tick
- `PlayerPointsPerGame`, `PlayerNoteField` — the points per game block and the private note field every player drawer renders
- `PlayerDetailDrawer` — the focus-trapped drawer, a bottom sheet on a phone (rank, tier, expert range, ADP, movement, points per game, queue and compare controls, private note); opened by the best ball board, the redraft room, and the best ball room through `DeferredPlayerDetailDrawer`, while the rankings board renders its own drawer in `fantasy-football-client.tsx`
- `CompareTray`, `CompareModal` — the band pinned to the bottom of the screen for the compare selection (up to 3) and the side by side dialog it opens; rendered through `DeferredCompareTray`, and the best ball board is the one page that renders it
- `DraftRoomParts` — `DraftScorebug`, `DraftScorebugCell`, `DraftLastPicks`, `DraftRoster`, and `DraftPickGrid`, shared by the redraft room, the mock draft, and the best ball room
- `RedraftDecisionPanel` — the redraft room's reading of what waiting costs at each position
- `DraftValuePanel` — Draft Outlook and the expected return calculator for both draft trackers
- `MyTeamPanel` — the saved roster on the weekly board and waivers

Cross-surface browser-local stores in `src/hooks/`:

- `usePlayerQueue` — starred watchlist of player ids (`fantasy-player-queue-v1`), read by the rankings board, the redraft room's board, and the shared drawer
- `usePlayerNotes` — private per-player notes, 280-char cap (`fantasy-player-notes-v1`), read by the rankings board and the shared drawer
- `useCompareTray` — compare selection, max 3 (`fantasy-compare-v1`), read by the shared drawer and the compare tray
- `useLocalStorageString` — low-level reactive single-key localStorage reader the three stores build on
- draft state persists per-season under `fantasy-draft-tracker-v3-<season>`

Supporting libs:

- `src/lib/fantasyUtils.ts` — board math, formatting, and tooltip copy (`getValueVsAdp`, `getConsensusSpread`, `withTierBreaks`, freshness helpers, the `FANTASY_*_TOOLTIP` strings)
- `src/lib/draftAnalytics.ts` — pure steal/reach/position-run engine consumed by `DraftAnalyticsPanel`
- `src/lib/fantasyLocal.ts` — parse/serialize helpers + storage-key constants for the queue/notes/compare stores

These work with the generated fantasy snapshots (loaded through `useFantasySnapshot`) and `/api/fantasy-data` route described elsewhere in `docs/ai-context`.

---

## UI Primitives

The React primitives still in use are `ModernButton`, `ThemeToggle`, `AuthorBio`, and `ServerIcons`. Most UI is composed from the `catalog97.css` classes instead (`.c97-panel`, `.c97-chip`, `.c97-btn`, `.c97-table`), and `WarmCard`, `Heading`, `Paragraph`, `Badge`, `Chip`, `Kicker`, and `SectionIntro` were deleted on 2026-09-27.

Shared primitive rules:

- `Catalog97Shell` owns the only page-level `main`, on every route; `ConditionalLayout` renders none
- shared shell primitives should not use `transition-all`

---

## Practical Rule

When docs and code disagree about component ownership, verify the route entry file first. The current route file is the best indicator of which component path is live.
