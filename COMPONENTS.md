# Component Reference

Current component map for the live application.

**Last updated:** 2026-10-13

> Seven routes (`/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`,
> `/contact`) render Catalog 97 composition roots from `src/components/catalog97/`.
> Every other route renders inside `Catalog97ToolShell`, so the
> whole site shares one header and one footer. The `*Instrument` composition
> roots that used to own those seven were deleted when Catalog 97 replaced them, as
> were the older single-purpose homepage components this doc once listed. The
> Working Instrument `StaticHeader`, `Footer`, and `ContactCta` were deleted on
> 2026-09-16, and its last shared pieces (`HomeStatsPanel`, `WarmCard`, `Badge`,
> `Chip`, `Kicker`, `SectionIntro`, `Heading`, `Paragraph`, and the editorial
> `InlineSectionLead`) on 2026-09-27. See `AGENTS.md` for the shell description.

---

## Component Groups

### Root shell and shared surfaces

| Component | File | Role |
|----------|------|------|
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Passes the seven designed routes through untouched and wraps every other route in `Catalog97ToolShell` |
| `Catalog97ToolShell` | `src/components/catalog97/Catalog97ToolShell.tsx` | `Catalog97Shell` plus the build-note aside, used by every route outside the seven designed pages |
| `Providers` | `src/components/Providers.tsx` | Mounts the `next-themes` provider and the page-level listeners below |
| `FragmentLinkNavigation` | `src/components/navigation/FragmentLinkNavigation.tsx` | Mounted once by `Providers` and renders nothing. Follows same-page links (`href="#section"`) from the page's current address, because Firefox can hold a link's address from before a page rewrote its own URL and then load the old URL as a new document |
| `FragmentScrollOnLoad` | `src/components/navigation/FragmentScrollOnLoad.tsx` | Mounted once by `Providers` and renders nothing. Lands a fresh load on the element its URL fragment names and holds it there while the page settles, because a browser looks the fragment up once, as it finishes parsing, and React reveals a streamed route after that. It only scrolls a page that sits where a landing left it, so a page the visitor has scrolled stays put, and it leaves a reload or a trip through history to the browser |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback, one Catalog 97 paper band, rendered by the root `src/app/error.tsx` |

### Homepage, work, writing, dashboards, about, résumé, contact

Each of these seven routes
renders one composition root from `src/components/catalog97/`, wrapped in
`Catalog97Shell`, and the route page is a thin server shell that passes data in.
The tokens live in `src/app/catalog97.css`, declared under `[data-c97]`, which
`Catalog97Shell` sets on the same element as the `.c97-page` class.
`ConditionalLayout` stands down on these routes (see
`isCatalog97Route` in `src/constants/catalog97Nav.ts`), so the shell owns the
page's only `<main>`, header, and footer.

| Component | File | Role |
|----------|------|------|
| `Catalog97Shell` | `src/components/catalog97/Catalog97Shell.tsx` | Page wrapper: header, `<main>`, espresso footer |
| `Catalog97Header` | `src/components/catalog97/Catalog97Header.tsx` | Client header with seven route links, site search, theme control, and an oxblood rule under the active route |
| `Catalog97Monet` | `src/components/catalog97/Catalog97Monet.tsx` | Mounted once by the header. Sets `data-c97-daypart` on `<html>` so the brand hover fills the name with a Monet canvas picked by local time, and feeds the pointer position to every `[data-c97-paint]` element for the painted circle reveal on the home and /about portraits and the home collage plates. Clicking a portrait cycles its painter (Monet, Van Gogh, Seurat, Hopper, Lichtenstein) through `data-c97-painter`. The styles are the Monet and paint reveal blocks in `catalog97.css` |
| `Catalog97EasterEggs` | `src/components/catalog97/Catalog97EasterEggs.tsx` | Mounted once by the header. The Konami code (matcher in `konami.ts`) throws the page out of register for six seconds and opens a toast pointing to /arcade, and six fast stamps on the footer wordmark do the same for a phone. The console gets a note once per full load, clicking the footer wordmark stamps it, holding Option (Alt) lays press-proof marks over the viewport, five fast flips of the theme put the page under a darkroom safelight, and the tab title reads "Still on the press…" while the tab is hidden, or "Running the night shift…" from midnight until 5am. The hidden search answers live in `src/app/api/search/route.ts`, the kicker and defense notes in `src/lib/draftEarlySpecialistNote.ts`, the arcade's 30 lives in `src/app/arcade/ArcadeClient.tsx`, and the halftone split, overprint text selection, and article end mark are CSS in `catalog97.css`. The full list is `docs/EASTER_EGGS.md` |
| `Catalog97Primitives` | `src/components/catalog97/Catalog97Primitives.tsx` | `Catalog97Plate` (Anton numeral) and `Catalog97Slot` (flat image field) |
| `Catalog97Home` | `src/components/catalog97/Catalog97Home.tsx` | `/` composition root. Props: `featuredProjects`, `recentPosts`, `heroIndex`, `liveToolGroups`, `liveFeed` |
| `Catalog97Portfolio` | `src/components/catalog97/Catalog97Portfolio.tsx` | `/portfolio` index with client-side search, sorting, and category filters over `classifyToolSlug` |
| `Catalog97Writing` | `src/components/catalog97/Catalog97Writing.tsx` | `/writing` index with client-side search, sorting, cluster/length/bucket filters, and topic links |
| `Catalog97Dashboards` | `src/components/catalog97/Catalog97Dashboards.tsx` | `/dashboards` mosaic. Props: `groups`, `summaries` |
| `Catalog97About` | `src/components/catalog97/Catalog97About.tsx` | `/about` content, one profile piece since 2026-10-18 (hero with the portrait, the biography on the same paper, "How I work" on blue, the FAQ on bone). `Catalog97About.module.css` holds its hero grid |
| `Catalog97Resume` | `src/components/catalog97/Catalog97Resume.tsx` | `/resume` content, one paper document since 2026-10-18 with experience, education, a capabilities ledger, and outside work under hairline rules. `Catalog97Resume.module.css` holds the experience and ledger subgrids and is its print stylesheet, which drops the site chrome, prints black on white, and signs the foot of the page with a pressman's mark that never shows on screen |
| `Catalog97Contact` | `src/components/catalog97/Catalog97Contact.tsx` | `/contact` content, one screen since 2026-10-18 with the address on the paper hero and the other channels on one blue sheet, with no form because there is no form backend |

### Writing and structured data

| Component | File | Role |
|----------|------|------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD injection |
| `AIStructuredData` | `src/components/AIStructuredData.tsx` | AI-oriented structured data helper |
| `AuthorBio` | `src/components/ui/AuthorBio.tsx` | Article author block in Catalog 97: square stone portrait, name at the h3 step, one paragraph, microlink contacts |

### Site search

| Component | File | Role |
|----------|------|------|
| `SearchInterface` | `src/components/search/SearchInterface.tsx` | Main search client page with debounced query input, abortable API requests, and results list |
| `HeaderSearchPanel` | `src/components/search/HeaderSearchPanel.tsx` | Slide-out quick search modal launched from `Catalog97Header` |
| `SearchResults` | `src/components/search/SearchResults.tsx` | Formatted search result list rendering title, category, and snippets |

### Fantasy football

The eight `/fantasy-football/*` routes are one product. `src/app/fantasy-football/layout.tsx` wraps
them in the kit's root (`ffb-root`), loads the product's typeface, and renders `FantasyProductBar`
above the route. They draw with the kit in `src/components/fantasy/fantasy.css`, and
`docs/FANTASY_FOOTBALL_KIT.md` is the reference for its classes, its cascade, and the shared parts below.

Route clients, each with the parts it keeps in its own folder:

- `src/app/fantasy-football/fantasy-football-client.tsx`, the rankings board, which renders its own player drawer
- `src/app/fantasy-football/draft-tracker/draft-tracker-client.tsx`, the redraft room, with `components/DraftSetup.tsx`, `DraftBoard.tsx`, `DraftClock.tsx`, `DraftAnalyticsPanel.tsx`, and `DraftRecapPanel.tsx`
- `src/app/fantasy-football/mock-draft/mock-draft-client.tsx`, the mock draft
- `src/app/fantasy-football/trade-calculator/trade-calculator-client.tsx`, the trade calculator, with `trade-package-fieldset.tsx`, `trade-player-combobox.tsx`, `trade-result-rail.tsx`, `trade-balance-scale.tsx`, and `trade-roster-impact.tsx`
- `src/app/fantasy-football/best-ball/best-ball-client.tsx`, the best ball board
- `src/app/fantasy-football/best-ball/draft-tracker/draft-tracker-client.tsx`, the best ball room, with `best-ball-draft-board.tsx`, `best-ball-recommendations.tsx`, `best-ball-build-panel.tsx`, and `best-ball-build-sheet.tsx`
- `src/app/fantasy-football/weekly/weekly-client.tsx`, which renders both the weekly board and waivers

`src/components/newsletter/NewsletterSignup.tsx` is the public email opt-in on Agent Build Index. It posts to `/api/newsletter/subscribe` and records a conversion only after the contact API succeeds.

Shared fantasy components live in `src/components/fantasy/`. The folder has no `index.ts`, so a page
imports each file by its path, and a route client never imports `PlayerDetailDrawer.tsx` or
`CompareTray.tsx` directly, since the two `Deferred` wrappers keep them out of first load.

| Component | File | Role |
|----------|------|------|
| `FantasyProductBar` | `src/components/fantasy/FantasyProductBar.tsx` | The bar the layout renders above every fantasy route, naming the product and linking the eight tools with the current one marked |
| `FantasyRouteHeader` | `src/components/fantasy/FantasyRouteHeader.tsx` | The page head (title, one orienting sentence, the freshness line) on the rankings board, the best ball board, the trade calculator, and the weekly pages. The file also exports `TitleAccent`, `FantasySectionHeading`, and `FreshnessParts`, the line of source dates the three draft rooms print in their own heads |
| `FantasyLoadingState` | `src/components/fantasy/FantasyLoadingState.tsx` | The loading skeleton in all eight `loading.tsx` files, with `role="status"` and a "Loading …" name |
| `SeasonalScopeNote` | `src/components/fantasy/SeasonalScopeNote.tsx` | The dated note a draft-season page prints from Week 1, which names the week and the season and then carries the page's own sentence about its board |
| `PositionFilterBar` | `src/components/fantasy/PositionFilterBar.tsx` | The position switch on the rankings board, the best ball board, and the three draft rooms. One radiogroup with a roving tab stop, where each position button carries its colour and an unavailable option is disabled and marked "NA" |
| `RankDistributionBar` | `src/components/fantasy/RankDistributionBar.tsx` | The expert spread plot, drawing the best to worst rank as a line, one standard deviation each side of the mean as a thicker segment, and the mean as a tick |
| `PlayerPointsPerGame` | `src/components/fantasy/PlayerPointsPerGame.tsx` | A player's prior-season points per game (low, median, average, high) with the season, scoring, and games it covers, rendered by every player drawer |
| `PlayerNoteField` | `src/components/fantasy/PlayerNoteField.tsx` | The private note on a player, with its counter and where the note is kept, rendered by every player drawer |
| `PlayerDetailDrawer` | `src/components/fantasy/PlayerDetailDrawer.tsx` | The focus-trapped player drawer, a bottom sheet on a phone, with rank, tier, expert range, ADP, movement, points per game, the queue and compare controls, and the note. The best ball board, the redraft room, and the best ball room open it, and the two rooms turn its Compare control off because neither renders a tray |
| `DeferredPlayerDetailDrawer` | `src/components/fantasy/DeferredPlayerDetailDrawer.tsx` | Loads `PlayerDetailDrawer` the first time a player is opened. It is the import the three callers use |
| `CompareTray` | `src/components/fantasy/CompareTray.tsx` | The band pinned to the bottom of the screen that holds the compare selection (up to 3 players) and opens `CompareModal` |
| `CompareModal` | `src/components/fantasy/CompareModal.tsx` | The side by side comparison dialog, which marks the best value in each row and draws the players' ranges on one shared scale |
| `DeferredCompareTray` | `src/components/fantasy/DeferredCompareTray.tsx` | Keeps `CompareTray` out of first load and shows nothing until a player is pinned. The best ball board is the one page that renders it |
| `DraftRoomParts` | `src/components/fantasy/DraftRoomParts.tsx` | The parts the redraft room, the mock draft, and the best ball room share, which are `DraftScorebug` and `DraftScorebugCell` (the room's pinned status bar), `DraftLastPicks`, `DraftRoster`, and `DraftPickGrid`. A room imports them and does not copy their markup |
| `RedraftDecisionPanel` | `src/components/fantasy/RedraftDecisionPanel.tsx` | The redraft room's reading of what waiting costs at each position, one row per position with its tier and next-turn readings |
| `DraftValuePanel` | `src/components/fantasy/DraftValuePanel.tsx` | Draft Outlook for the redraft and best ball rooms, with the room-relative rank, draft-slot context, the published Best Ball Mania VII field math, and the user-entered expected return calculator |
| `MyTeamPanel` | `src/components/fantasy/MyTeamPanel.tsx` | The saved roster on the weekly board and waivers, with its weekly lineup, roster, and league settings views and the add and drop comparison |

Four small helpers sit beside them. `positionClass.ts` returns the kit class that carries a position's
colour, `spreadScale.ts` fits a spread plot to its scale, `useFirstRowCount.ts` counts the children on
a wrapping list's first row, and `scrollChildIntoViewX.ts` moves a sideways scroller without moving
the page.

### Investments

`InvestmentsDashboard` (`src/components/investments/InvestmentsDashboard.tsx`) is
the main shell rendered by `src/app/investments/investments-client.tsx`. It
composes the portfolio and research surfaces (all under
`src/components/investments/`):

- Portfolio: `PortfolioSummary`, `PortfolioHeroCard`, `PortfolioStatsGrid`, `HoldingsTable`, `AddStockForm`, `AllocationChart`
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
| `FixtureLedgerSection` | `src/components/football/FixtureLedger.tsx` | Fixtures under a group label such as a matchday or a date, with the home team, the dated score or kickoff, and the away team in one row. The league pages and the MLB, NBA, NFL, and World Cup boards render it |
| `LeaderLedger` | `src/components/football/LeaderLedger.tsx` | Leaderboard rows (rank, name, club code, value and unit) on hairlines, for the scorers and assists on the league pages and the stat leaders on MLB, NBA, and NFL |
| `DetailDrawer` | `src/components/football/DetailDrawer.tsx`, `detail-drawer.css` | The drawer a selected team or player opens in on the golf, MLB, NBA, and NFL routes, a sheet from the bottom on a phone and a side panel from 640px, with focus, Escape, and scroll lock from `useModal` |
| `PointsLadder` | `src/components/football/PointsLadderChart.tsx` | Premier League and La Liga points ladder beside the table, clubs on a vertical points axis with the zone lines, geometry from `ladderGeometry.ts` |
| `LeagueTableBoard` | `src/components/football/LeagueTableBoard.tsx`, `league-table.css` | The page both Premier League and La Liga render, meaning the title row with the club lookup, the results ticker, the standings with zone bands and each club's last five, the points ladder, and the fixtures and scorers tabs |
| `SeedLadder` | `src/components/football/SeedLadderPanel.tsx`, `seed-ladder.css` | The NBA and NFL playoff picture as the standings, one ruled table per conference split into bands with the games-clear gap on each line between them, from `seedLadder.ts`. Every team is a button that opens the route's drawer |
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
| Polling Aggregator | `src/app/polling-aggregator/*`, `src/data/pollingSnapshot.json` | Snapshot-backed polling dashboard and deep-linkable route state |
| Budget Planner | `src/app/fintech-tools/budget-planner/*`, `src/hooks/useBudgetPlanner.ts` | Client-side budget planning tool |
| Interchange IQ | `src/app/fintech-tools/interchange-iq/*` | Client-side interchange fee analyzer |
| Job Search Tracker | `src/app/mba-internship-notifications/*`, `src/constants/mba-companies.ts`, `src/lib/mba-job-matching.ts`, `src/lib/mba-applications.ts`, `src/types/mba-jobs.ts` | Client shell (`MBAJobsClient`) with tabs for Feed, Pipeline, and Candidates (`CandidatesView`), `ApplicationEditDialog` (fit score, rationale, materials folder, dates, notes), backed by `/api/mba-jobs`, `useMBAApplications`, and `useMBACandidates` with dev-mode `/api/job-search` sync; uses `src/app/api/mba-jobs/email` for Resend digests |
| World Cup Pulse | `src/app/world-cup-2026/*`, `src/data/worldCupSnapshot.json`, `src/lib/worldCupSnapshot.ts` | Snapshot-backed 2026 FIFA World Cup hub reusing `src/components/football/*` |
| Bay Area Transit Pulse | `src/app/bay-area-transit/*`, `src/data/bayAreaTransitSnapshot.json`, `src/lib/bayAreaTransitSnapshot.ts` | Snapshot-backed BART dashboard with a Leaflet street map of every line (`TransitMap.tsx`), station departure boards, and advisories |
| Tech Startup Tracker | `src/app/tech-startup-tracker/*`, `src/data/techStartupSnapshot.json`, `src/lib/techStartups.ts` | Editorially curated startup funding tracker with deep-linkable sector/stage state |
| Travel Planner | `src/app/travel/*`, `src/hooks/useTravelPlanner.ts` | Browser-persisted trip planner client (`travel-planner-client.tsx`) for itineraries and journaling |
| Golf | `src/app/golf/*`, `src/data/golfSnapshot.json` | Snapshot-backed PGA Tour leaderboard dashboard |

---

## UI Primitives

Core UI primitives live under `src/components/ui/`.

The ones still in use are `ModernButton` (admin and the investments forms), `ThemeToggle` and `DeferredThemeToggle` (the header), `AuthorBio` (articles), and `ServerIcons` (inline SVG icons for server components). Most UI is composed from the `catalog97.css` classes, so a new block usually wants a `.c97-panel`, `.c97-chip`, or `.c97-btn` before it wants a component.

The editorial components under `src/components/editorial/` are `InstrumentTape` (Investments, the football results tape, and the SpaceX launch tape); `StatusPanel` was deleted on 2026-10-12 once Job Search stopped rendering it. Every component reads the `--c97-*` tokens, since the Working Instrument tokens were deleted on 2026-09-27.

Styling guidance for these lives in `STYLING.md`.

---

## Current Live Ownership

### `/portfolio`

`src/app/portfolio/page.tsx` is a server shell that passes the project index to `Catalog97Portfolio`.

### Homepage

`src/app/page.tsx` renders `Catalog97Home` (plus the `StructuredData` /
`AIStructuredData` JSON-LD injectors). `Catalog97Home` is a self-contained
composition that supplies its own header and footer through `Catalog97Shell`. Its
dashboards board reads the launch, football, transit, and investments snapshots
through `getSnapshotReadouts` (`src/lib/catalog97Readouts.ts`), which
`/dashboards` also uses for its pull log. Each reader fails soft to null so a
missing snapshot drops its tile rather than rendering an empty one.

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

`src/components/home/` is gone. `HomeLiveFeed.tsx` and `PanelClock.tsx` were
deleted on 2026-09-23 when the home page moved to the snapshot readouts, and
`HomeStatsPanel.tsx` on 2026-09-27 after the project redesign removed it from
its last route.

---

## Testing Coverage

Current component-oriented tests include:

- `src/components/__tests__/ConditionalLayout.test.tsx`
- `src/components/catalog97/__tests__/Catalog97Header.test.tsx`
- `src/components/catalog97/__tests__/Catalog97ToolShell.test.tsx`
- tests under `src/components/ui/__tests__/`
- investments component tests under `src/components/investments/__tests__/`
- search component tests under `src/components/search/__tests__/`
- job search component and dialog tests under `src/app/mba-internship-notifications/__tests__/`

See `TESTING.md` for the broader strategy.
