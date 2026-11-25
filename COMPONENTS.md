# Component Reference

Current component map for the live application.

**Last updated:** 2026-11-24

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
| `Providers` | `src/components/Providers.tsx` | Mounts the `next-themes` provider, the two page-level listeners below, and the three analytics components, `GoogleAnalytics`, `ScrollDepthTracker`, and `ActionClickTracker` (`src/components/analytics/`), which render nothing unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` holds a measurement id |
| `FragmentLinkNavigation` | `src/components/navigation/FragmentLinkNavigation.tsx` | Mounted once by `Providers` and renders nothing. Follows same-page links (`href="#section"`) from the page's current address, because Firefox can hold a link's address from before a page rewrote its own URL and then load the old URL as a new document |
| `FragmentScrollOnLoad` | `src/components/navigation/FragmentScrollOnLoad.tsx` | Mounted once by `Providers` and renders nothing. Lands a fresh load on the element its URL fragment names and holds it there while the page settles, because a browser looks the fragment up once, as it finishes parsing, and React reveals a streamed route after that. It only scrolls a page that sits where a landing left it, so a page the visitor has scrolled stays put, and it leaves a reload or a trip through history to the browser |
| `RouteErrorBoundary` | `src/components/RouteErrorBoundary.tsx` | Shared error fallback, one Catalog 97 paper band, rendered by the root `src/app/error.tsx`, by `src/app/global-error.tsx`, and by `src/app/investments/before-you-buy/error.tsx` |
| `RouteLoadingState` | `src/components/RouteLoadingState.tsx` | The matching loading band, rendered by every `loading.tsx` outside the eight fantasy football routes, which use `FantasyLoadingState` |
| `ProjectBuildNote` | `src/components/ProjectBuildNote.tsx` | The build-note aside `Catalog97ToolShell` adds under a route listed in `projectBuildNoteLinks.ts`, loaded as its own chunk, with its prose in `projectBuildNoteContent.ts` |
| `NotFoundNote` | `src/components/NotFoundNote.tsx` | The line `src/app/not-found.tsx` prints under the 404's lead for a few addresses people type on purpose or that scanners try, matched on the lower-cased pathname and listed in `docs/EASTER_EGGS.md` |
| `ProjectWorkspace` | `src/components/ProjectWorkspace.tsx`, `project-workspace.css` | The titled section that the saved comparison and following blocks on the project routes render inside. The file also exports `FollowPicker`, a select and list for following up to 20 items, and `StorageNotice`, the line a block prints when browser storage is unavailable and its changes last only while the page stays open |

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
| `Catalog97Shell` | `src/components/catalog97/Catalog97Shell.tsx` | Page wrapper: header, `<main>`, espresso footer, and `VisitLedger`, which records each visit for the back room receipt. The footer's colophon links that receipt and the registration puzzle |
| `Catalog97Header` | `src/components/catalog97/Catalog97Header.tsx` | Client header, printed as a saffron sheet, with the seven route links, site search, and the theme control. An ink block behind a link marks the current route, and Dashboards reads as the current section on every tool route through `isDashboardRoute` |
| `Catalog97Monet` | `src/components/catalog97/Catalog97Monet.tsx` | Mounted once by the header. Sets `data-c97-daypart` on `<html>` so the brand hover fills the name with a Monet canvas picked by local time, and feeds the pointer position to every `[data-c97-paint]` element for the painted circle reveal on the home and /about portraits and the home collage plates. Clicking a portrait cycles its painter (Monet, Van Gogh, Seurat, Hopper, Lichtenstein) through `data-c97-painter`. The styles are the Monet and paint reveal blocks in `catalog97.css` |
| `Catalog97EasterEggs` | `src/components/catalog97/Catalog97EasterEggs.tsx` | Mounted once by the header. The Konami code (matcher in `konami.ts`) throws the page out of register for six seconds and opens a toast pointing to /arcade, and six fast stamps on the footer wordmark do the same for a phone. The console gets a note once per full load, clicking the footer wordmark stamps it, holding Option (Alt) lays press-proof marks over the viewport, five fast flips of the theme put the page under a darkroom safelight, and the tab title reads "Still on the press…" while the tab is hidden, or "Running the night shift…" from midnight until 5am. The hundredth stamp from one browser, counted under `c97-stamps-v1`, opens a "Worn in" toast. /arcade and /spacex-mission-control answer the code themselves, so it skips them. The hidden search answers live in `src/app/api/search/route.ts`, the kicker and defense notes in `src/lib/draftEarlySpecialistNote.ts`, the arcade's 30 lives in `src/app/arcade/ArcadeClient.tsx`, the drill launch in `src/components/spacex/MissionControlHero.tsx`, the article end mark in `src/components/editorial/ArticleEndMark.tsx`, and the halftone split and overprint text selection are CSS in `catalog97.css`. The full list is `docs/EASTER_EGGS.md` |
| `Catalog97Primitives` | `src/components/catalog97/Catalog97Primitives.tsx` | `Catalog97Slot` (flat image field). `Catalog97Plate`, the Anton numeral, was deleted from this file on 2026-09-24 |
| `Catalog97Home` | `src/components/catalog97/Catalog97Home.tsx` | `/` composition root. Props: `featuredProjects`, `recentPosts`, `readouts` |
| `Catalog97Collage` | `src/components/catalog97/Catalog97Collage.tsx` | The home page's dashboards board, three riso plates or flat ink blocks pasted edge to edge, each linking to its dashboard with its snapshot readout pasted on. It mounts `Catalog97Reveal` (`src/components/catalog97/Catalog97Reveal.tsx`), which scales each plate in as it scrolls into view. `projectPlates.ts` maps a project slug to its riso plate for Home and Work |
| `Catalog97Portfolio` | `src/components/catalog97/Catalog97Portfolio.tsx` | `/portfolio` curated work page: four lead projects, the Juno and Civitech write-ups, and a link to `/dashboards` for the full inventory |
| `Catalog97Writing` | `src/components/catalog97/Catalog97Writing.tsx` | `/writing` index with client-side search, sorting, cluster/length/bucket filters, and topic links |
| `Catalog97Dashboards` | `src/components/catalog97/Catalog97Dashboards.tsx` | `/dashboards` mosaic with a search field and a category filter. Props: `groups`, `summaries`, `cardLines`, `latestPull`, `pullLog`, `staleNote` |
| `Catalog97About` | `src/components/catalog97/Catalog97About.tsx` | `/about` content, a proof since 2026-10-19: the portrait plate, the biography with four marked claims that link to checked notes in the margin, each with its source, and the FAQ as a specimen strip across the foot, all on one paper sheet. `Catalog97About.module.css` holds the proof grid, the marks, the margin, and the strip |
| `Catalog97Resume` | `src/components/catalog97/Catalog97Resume.tsx` | `/resume` content, the sheet on the press bed since 2026-10-19: the whole record set tight on a letter-proportioned paper sheet on the bone bed, the download in the left rail, the write-ups and Get in touch in the right. `Catalog97Resume.module.css` holds the bed, the sheet, and the rails and is its print stylesheet, which drops the site chrome and the download rail, prints black on white, and signs the foot of the sheet |
| `Catalog97Contact` | `src/components/catalog97/Catalog97Contact.tsx` | `/contact` content, a reply card since 2026-10-19: the message on the left half, the stamp and the four address lines on the right with the email as the largest, and one sentence under the card, with no form because there is no form backend. It exports `CONTACT_DATE_MODIFIED`, which the page's metadata and the stamp's year both read. `Catalog97Contact.module.css` holds the card |

### Writing and structured data

| Component | File | Role |
|----------|------|------|
| `StructuredData` | `src/components/StructuredData.tsx` | JSON-LD injection |
| `AIStructuredData` | `src/components/AIStructuredData.tsx` | AI-oriented structured data helper |
| `AuthorBio` | `src/components/ui/AuthorBio.tsx` | Article author block in Catalog 97: square stone portrait, name at the h3 step, one paragraph, microlink contacts |
| `NewsletterSignup` | `src/components/newsletter/NewsletterSignup.tsx` | The public email opt-in, rendered only on `/agent-build-index`. It posts to `/api/newsletter/subscribe`, which adds the address to Resend's contacts, and records the `newsletter_subscribe` event only after that route reports success |
| `ArticleCodeCopy` | `src/components/analytics/ArticleCodeCopy.tsx` | Mounted on a post page, it adds a Copy code button to each code block in the injected article HTML and records the GA4 `code_copy` event when one is pressed |

### Back room discoveries

The easter egg components added on 2026-10-21 live in `src/components/discoveries/`, and `docs/EASTER_EGGS.md` says how a visitor finds each one. Five of them render the five noindexed `/back-room/[discovery]` pages, and `downloadPrint.ts` draws the receipt and the registration souvenir onto a canvas for their PNG downloads.

| Component | File | Role |
|----------|------|------|
| `VisitLedger` | `src/components/discoveries/VisitLedger.tsx` | Mounted by `Catalog97Shell` and renders nothing. Records each route visit in this tab's session storage for the receipt |
| `VisitReceipt` | `src/components/discoveries/VisitReceipt.tsx` | `/back-room/receipt`, the visit list printed as a receipt, with a PNG download and a clear button |
| `SiteTransitMap` | `src/components/discoveries/SiteTransitMap.tsx` | `/back-room/transit`, three fictional train lines whose stations link to the site's dashboards |
| `PortraitControls` | `src/components/discoveries/PortraitControls.tsx` | The Another painter button beside the Home and About portraits, which links to the gallery once all five painters have shown |
| `PainterGallery` | `src/components/discoveries/PainterGallery.tsx` | `/back-room/gallery`, the five painted portraits with museum labels |
| `RetroHome` | `src/components/discoveries/RetroHome.tsx` | `/back-room/1997`, the 1997 homepage, with a guestbook kept in local storage |
| `RegistrationGame` | `src/components/discoveries/RegistrationGame.tsx` | `/back-room/registration`, four sliders that bring two ink layers into register before a souvenir PNG downloads |
| `WineCork` | `src/components/discoveries/WineCork.tsx` | The cork on `/wine-cellar` that opens a tasting note for the site after three presses |
| `ArticlePostscript` | `src/components/discoveries/ArticlePostscript.tsx` | The "-30-" that opens a note from the build, printed in place of `ArticleEndMark` on the posts in `src/lib/articlePostscripts.ts` |

### Site search

| Component | File | Role |
|----------|------|------|
| `SearchInterface` | `src/components/search/SearchInterface.tsx` | The `/search` client, loaded without server rendering through `SearchInterfaceClient` in `src/components/search/SearchInterface.client.tsx`, with debounced query input, abortable API requests, and the results list |
| `SearchFilters` | `src/components/search/SearchFilters.tsx` | The content type and category filters on `/search`, whose ids have to match the values `/api/search` emits |
| `HeaderSearchPanel` | `src/components/search/HeaderSearchPanel.tsx` | The search dialog that drops below `Catalog97Header`, opened by its Search button, `/`, or Ctrl or ⌘ with K. It shows the top six `/api/search` results inline and hands Enter to `/search` |
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

Shared fantasy components live in `src/components/fantasy/`. The folder has no `index.ts`, so a page
imports each file by its path, and a route client never imports `PlayerDetailDrawer.tsx` or
`CompareTray.tsx` directly, since the two `Deferred` wrappers keep them out of first load.

| Component | File | Role |
|----------|------|------|
| `FantasyProductBar` | `src/components/fantasy/FantasyProductBar.tsx` | The bar the layout renders above every fantasy route, naming the product and linking the eight tools with the current one marked |
| `FantasyRouteHeader` | `src/components/fantasy/FantasyRouteHeader.tsx` | The page head (title, one orienting sentence, the freshness line) on the rankings board, the best ball board, the trade calculator, and the weekly pages. The file also exports `FantasySectionHeading` and `FreshnessParts`, the line of source dates the three draft rooms print in their own heads |
| `FantasyLoadingState` | `src/components/fantasy/FantasyLoadingState.tsx` | The loading skeleton in all eight `loading.tsx` files, with `role="status"` and a "Loading …" name |
| `SeasonalScopeNote` | `src/components/fantasy/SeasonalScopeNote.tsx` | The dated note a draft-season page prints from Week 1, which names the week and the season and then carries the page's own sentence about its board |
| `PositionFilterBar` | `src/components/fantasy/PositionFilterBar.tsx` | The position switch on the rankings board, the best ball board, the weekly board's flex view, and the three draft rooms. One radiogroup with a roving tab stop, where each position button carries its colour and an unavailable option is disabled and marked "NA" |
| `RankDistributionBar` | `src/components/fantasy/RankDistributionBar.tsx` | The expert spread plot, drawing the best to worst rank as a line, one standard deviation each side of the mean as a thicker segment, and the mean as a tick |
| `TierSection` | `src/components/fantasy/TierSection.tsx` | The tier break (a 2px ink rule with the tier's tab, count, rank range, and the cliff above it) over its rows, shared by the rankings board and the weekly board. The file also exports `ExpertSpread`, the spread plot on each row, and `SpreadScaleLabels`, the scale over a group of those plots |
| `IsaacScoutCard` | `src/components/fantasy/IsaacScoutCard.tsx` | The novelty scouting card the rankings board shows above the results for a search of `Isaac` or `Isaac Vazquez`, listed in `docs/EASTER_EGGS.md` |
| `PlayerPointsPerGame` | `src/components/fantasy/PlayerPointsPerGame.tsx` | A player's prior-season points per game (low, median, average, high) with the season, scoring, and games it covers, rendered by every player drawer |
| `PlayerNoteField` | `src/components/fantasy/PlayerNoteField.tsx` | The private note on a player, with its counter and where the note is kept, rendered by every player drawer |
| `PlayerDetailDrawer` | `src/components/fantasy/PlayerDetailDrawer.tsx` | The focus-trapped player drawer, a bottom sheet on a phone, with rank, tier, expert range, ADP, movement, points per game, the queue and compare controls, and the note. The best ball board, the redraft room, and the best ball room open it, and the two rooms turn its Compare control off because neither renders a tray |
| `DeferredPlayerDetailDrawer` | `src/components/fantasy/DeferredPlayerDetailDrawer.tsx` | Loads `PlayerDetailDrawer` the first time a player is opened. It is the import the three callers use |
| `CompareTray` | `src/components/fantasy/CompareTray.tsx` | The band pinned to the bottom of the screen that holds the compare selection (up to 3 players) and opens `CompareModal` |
| `CompareModal` | `src/components/fantasy/CompareModal.tsx` | The side by side comparison dialog, which marks the best value in each row and draws the players' ranges on one shared scale |
| `DeferredCompareTray` | `src/components/fantasy/DeferredCompareTray.tsx` | Keeps `CompareTray` out of first load and shows nothing until a player is pinned. The best ball board is the one page that renders it |
| `DraftRoomParts` | `src/components/fantasy/DraftRoomParts.tsx` | The parts the redraft room, the mock draft, and the best ball room share, which are `DraftScorebug` and `DraftScorebugCell` (the room's pinned status bar), `DraftLastPicks`, `DraftRoster`, and `DraftPickGrid`. The best ball room uses all of them except `DraftRoster`. A room imports them and does not copy their markup |
| `RedraftDecisionPanel` | `src/components/fantasy/RedraftDecisionPanel.tsx` | The redraft room's reading of what waiting costs at each position, one row per position with its tier and next-turn readings |
| `DraftValuePanel` | `src/components/fantasy/DraftValuePanel.tsx` | Draft Outlook for the redraft and best ball rooms, with the room-relative rank, draft-slot context, the published Best Ball Mania VII field math, and the user-entered expected return calculator |
| `MyTeamPanel` | `src/components/fantasy/MyTeamPanel.tsx` | The saved roster on the weekly board and waivers, with its weekly lineup, roster, and league settings views and the add and drop comparison |

Five small helpers sit beside them. `positionClass.ts` returns the kit class that carries a position's
colour, `spreadScale.ts` fits a spread plot to its scale, `useFirstRowCount.ts` counts the children on
a wrapping list's first row, `scrollChildIntoViewX.ts` moves a sideways scroller without moving
the page, and `compareMetrics.ts` picks the winner of each row in `CompareModal`, or none when the gap
is too small to mean anything.

### Investments

`InvestmentsDashboard` (`src/components/investments/InvestmentsDashboard.tsx`) is
the main shell rendered by `src/app/investments/investments-client.tsx`. It
composes the portfolio and research surfaces (all under
`src/components/investments/`):

- Portfolio: `PortfolioSummary`, `PortfolioHeroCard`, `PortfolioStatsGrid`, `HoldingsTable`, `AddStockForm`, `AllocationChart`
- Research: `StockSearch`, `ResearchSection`, `ResearchWorkspace` (the tabbed research view inside `ResearchSection`), `ResearchLoading`, `ResearchOverview`, `ResearchAssetHeader`, `ResearchPosition`
- Research panels: `PriceChartPanel`, `FinancialStatementsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `ProfitabilityPanel`, `IndustryPanel`
- Comparison: `ComparisonTab`, `ComparisonMetricTable`, `ComparisonRadarChart`
- Freshness / chrome: `DataFreshnessIndicator`, `MetricTooltip` (which the fantasy football pages use too), `ErrorState`, `TerminalPanel` (the frame the research panels print in), and `holdingPalette.ts`, which gives each holding one colour across the quote tape, `AllocationChart`, `HoldingsTable`, and `ResearchAssetHeader`

Retirement planner components live in `src/components/investments/retirement/`
(`RetirementPlanner` shell, `RetirementInputs`/`RetirementFields`,
`RetirementVerdict`, `RetirementProjectionChart` D3 confidence-band chart,
`RetirementLevers`, `RetirementAssumptions`, `RetirementDisclaimer`, and
`RetirementScenarios` with its `RetirementScenarioTable` for saved plans). They sit on
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
| `ClubDrawer` | `src/components/football/ClubDrawer.tsx` | The Premier League and La Liga club drawer, a sheet from the bottom on a phone and a side panel on wider screens, with the club's crest, recent form, `StatFascia` metrics, top scorers, and recent and upcoming fixtures. The two league clients render it through `DeferredClubDrawer` (`src/components/football/DeferredClubDrawer.tsx`), which loads it the first time a club opens |
| `StatFascia` | `src/components/football/StatFascia.tsx` | The fused hairline stat strip inside `ClubDrawer`, two cells across on a phone and four from `sm` up |
| `ResultsTape` | `src/components/football/ResultsTape.tsx` | The recent results and upcoming kickoffs ticker over the league table, drawn on `InstrumentTape` |
| `GoalsPulseStrip` | `src/components/football/GoalsPulseStrip.tsx` | The goals-per-matchday bars beside the results ticker, with a plain note in place of the chart before the first matchday finishes |
| `SegmentedTabs` | `src/components/football/SegmentedTabs.tsx` | The `role="tablist"` tab row on the league pages and the MLB, NBA, and NFL boards, with arrow-key movement from `useTablistKeyboard` |
| `SeedLadder` | `src/components/football/SeedLadderPanel.tsx`, `seed-ladder.css` | The NBA and NFL playoff picture as the standings, one ruled table per conference split into bands with the games-clear gap on each line between them, from `seedLadder.ts`. Every team is a button that opens the route's drawer |
| `InfoChip` | `src/components/football/InfoChip.tsx` | Inline label chip for league/competition context |
| `CrestAvatar` | `src/components/football/CrestAvatar.tsx` | Team crest image with fallback initials |
| `TeamResultPill` | `src/components/football/TeamResultPill.tsx` | Win/draw/loss pill for form strips |
| `EmptyPanel` | `src/components/football/EmptyPanel.tsx` | Empty-state placeholder panel |
| `PersonalTeams` | `src/components/football/PersonalTeams.tsx` | The "My teams and standings changes" block on the Premier League, La Liga, MLB, NBA, and NFL pages. It keeps up to ten favorite teams under `<league>-favorite-teams-v1` and the standings this browser has seen under `<league>-observed-standings-v1`, both through `useBrowserRecord` |

Beside them, `fixtureFormat.ts` formats a fixture's day, time, and kickoff, a rate, and a rank and reads a team's result, `fixtureGroups.ts` and `fixtureLedgerUtils.ts` group fixtures for `FixtureLedgerSection` under a caller's label or by matchday, and `useKeepPressedInView.ts` keeps the pressed pill of a sideways view switch on screen, which the GitHub Trending Pulse and Decision Lab pages use too.

### Standalone data tools

Most of these are snapshot-driven dashboards that share one architecture
(seed → builder → GitHub Action → accessors → API). See
`SNAPSHOT_DRIVEN_DASHBOARDS.md` for the shared pattern, and
`PERSONAL_INTEREST_TOOLS.md` for the personal-interest tools, meaning the browser-persisted
`/travel`, `/wine-cellar`, `/museum-log`, and `/recipe-finder` and the curated `/food-map`,
which keeps no browser state.

| Area | Primary files | Role |
|------|---------------|------|
| News Pulse | `src/app/news-pulse/*`, `src/lib/newsPulseServer.ts`, `src/lib/news-pulse-utils.ts` | News dashboard over six outlets' RSS feeds, read at request time with a five-minute server cache, with coverage, trending topics, and a light sentiment reading |
| SpaceX Mission Control | `src/components/spacex/*`, `src/app/spacex-mission-control/*` | SpaceX launch dashboard, mission cards, detail panels, patch and vehicle visuals |
| Polling Aggregator | `src/app/polling-aggregator/*`, `src/data/pollingSnapshot.json` | Snapshot-backed polling dashboard and deep-linkable route state |
| Budget Planner | `src/app/fintech-tools/budget-planner/*`, `src/hooks/useBudgetPlanner.ts` | Client-side budget planning tool |
| Interchange IQ | `src/app/fintech-tools/interchange-iq/*` | Client-side interchange fee analyzer |
| Job Search Tracker | `src/app/mba-internship-notifications/*`, `src/constants/mba-companies.ts`, `src/lib/mba-job-matching.ts`, `src/lib/mba-applications.ts`, `src/types/mba-jobs.ts` | Client shell (`MBAJobsClient`) with a view switch for the role feed, the application pipeline, and, only when `npm run dev` started the server, the candidates (`CandidatesView`), plus `ApplicationEditDialog` (fit score, rationale, materials folder, dates, notes), `ApplicationHistory` (an application's status history), and `UpcomingInterviews` (the next seven days), backed by `/api/mba-jobs`, `useMBAApplications`, and `useMBAJobCandidates` with dev-mode `/api/job-search` sync |
| World Cup Pulse | `src/app/world-cup-2026/*`, `src/data/worldCupSnapshot.json`, `src/lib/worldCupSnapshot.ts` | Snapshot-backed 2026 FIFA World Cup hub reusing `src/components/football/*` |
| Bay Area Transit Pulse | `src/app/bay-area-transit/*`, `src/data/bayAreaTransitSnapshot.json`, `src/lib/bayAreaTransitSnapshot.ts` | Snapshot-backed BART dashboard with a Leaflet street map of every line (`TransitMap.tsx`), station departure boards, advisories, and a saved commute kept in the browser (`CommutePanel.tsx`) |
| Tech Startup Tracker | `src/app/tech-startup-tracker/*`, `src/data/techStartupSnapshot.json`, `src/lib/techStartups.ts` | Editorially curated startup funding tracker with deep-linkable sector/stage state |
| Travel Planner | `src/app/travel/*`, `src/hooks/useTravelPlanner.ts` | Browser-persisted trip planner client (`travel-planner-client.tsx`) for itineraries and journaling |
| Golf | `src/app/golf/*`, `src/data/golfSnapshot.json` | Snapshot-backed PGA Tour leaderboard dashboard |
| Earthquake Pulse | `src/app/earthquake-pulse/*`, `src/data/earthquakeSnapshot.json`, `src/lib/earthquakeSnapshot.ts` | Global earthquake monitor for the past 24 hours, with the committed snapshot as the fallback for its request-time USGS summary |
| Formula 1 and Fantasy Formula 1 | `src/app/formula-1/*`, `src/app/fantasy-formula-1/*`, `src/data/formula1Snapshot.json` | The season dashboard and the fantasy lineup optimizer, both reading the committed OpenF1 snapshot |
| Frontier Models | `src/app/frontier-models/*`, `src/data/frontierModelsSnapshot.json`, `src/lib/frontierModels.ts` | Curated tracker of frontier language models, built from `scripts/data/frontierModels.source.ts` |
| AI Dev Tools | `src/app/ai-dev-tools/*` | Filterable directory of AI coding and agent tools, curated in the route's `ai-dev-tools-data.ts` |
| GitHub Trending Pulse and Agent Build Index | `src/app/github-trending-pulse/*`, `src/app/agent-build-index/*`, `src/data/githubTrendingSnapshot.json`, `src/lib/agentBuildIndex.ts` | The trending repositories dashboard, and the daily read on AI agent repositories, ranked by seven-day star movement and drawn from the same snapshot |
| Score Pools | `src/app/score-pools/*`, `src/data/scorePoolsSnapshot.json`, `src/lib/scorePools/*`, `src/hooks/useScorePools.ts` | Exact-score prediction pools with a tracker and settings page, picks kept in the browser. `SCORE_POOLS_ENGINE.md` is the engine reference |
| Rent vs Buy | `src/app/fintech-tools/rent-vs-buy/*`, `src/lib/rentVsBuy/*`, `src/hooks/useRentVsBuy.ts` | Browser-persisted month-by-month rent versus buy net-worth calculator |
| Before You Buy | `src/app/investments/before-you-buy/*`, `src/lib/beforeYouBuy.ts` | Compares two purchases of the same amount against an edited portfolio, reading the investments snapshots and the saved holdings |
| Decision Lab | `src/app/decision-lab/*` | Product-bet triage tool, with saved bets kept in the browser through `useBrowserRecord` |
| Enablement Assistant | `src/app/enablement-assistant/*` | Platform enablement tool that recommends a test stack and builds an onboarding plan, with saved teams kept in the browser through `useBrowserRecord` |
| Travel Deal Lab | `src/app/travel-deals/*`, `src/data/travelDealsSnapshot.ts`, `src/lib/travelDeals.ts` | Browser-persisted trip cost planner reasoning against a hand-authored fare snapshot |
| Reactor Arcade | `src/app/arcade/*` | A reflex game on its own fonts and state machine (`ArcadeClient.tsx`), which keeps its high score in the browser and gives 30 lives for the Konami code |

---

## UI Primitives

Core UI primitives live under `src/components/ui/`.

The ones still in use are `ModernButton` (the investments `AddStockForm` and `ErrorState`, since the admin page was removed on 2026-10-02), `ThemeToggle` and `DeferredThemeToggle` (the header), `AuthorBio` (articles), and `ServerIcons` (inline SVG icons for server components). Most UI is composed from the `catalog97.css` classes, so a new block usually wants a `.c97-panel`, `.c97-chip`, or `.c97-btn` before it wants a component.

The editorial components under `src/components/editorial/` are `InstrumentTape` (Investments, the football results tape, and the SpaceX launch tape) and `ArticleEndMark`, the "-30-" button at the end of a post (the posts with a commentary print `ArticlePostscript` from `src/components/discoveries/` there instead), added on 2026-10-21; `StatusPanel` was deleted on 2026-10-12 once Job Search stopped rendering it. Every component reads the `--c97-*` tokens, since the Working Instrument tokens were deleted on 2026-09-27.

Styling guidance for these lives in `STYLING.md`.

---

## Current Live Ownership

### `/portfolio`

`src/app/portfolio/page.tsx` is a server shell that passes the project index to `Catalog97Portfolio`.

### Homepage

`src/app/page.tsx` renders `Catalog97Home` plus two `StructuredData` JSON-LD
injectors (`Person` and `WebSite`). It stopped rendering `AIStructuredData` on
2026-07-20. `Catalog97Home` is a self-contained
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
- `src/app/mlb/mlb-client.tsx`
- `src/app/nba/nba-client.tsx`
- `src/app/nfl/nfl-client.tsx`
- `src/app/world-cup-2026/world-cup-client.tsx`

Route state helpers live next to each client (`*-state.ts`, or `*-state.core.ts` on La Liga, MLB, NBA, and NFL) and have unit coverage for invalid params and deep links.

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

- `src/components/__tests__/` (`ConditionalLayout`, `NotFoundNote`, `ProjectBuildNote`, `StructuredData`)
- `src/components/catalog97/__tests__/` (`Catalog97Header`, `Catalog97ToolShell`, `Catalog97EasterEggs`)
- a `__tests__/` folder inside each of the analytics, discoveries, editorial, fantasy, football, investments (and `investments/retirement/`), navigation, newsletter, search, spacex, and ui component folders
- `DraftValuePanel.test.tsx` and `RankDistributionBar.test.tsx`, which sit beside their components in `src/components/fantasy/`
- job search component and dialog tests under `src/app/mba-internship-notifications/__tests__/`
- `src/app/__tests__/component-docs.test.ts`, which fails when a table row in this file names a `src/` file that does not exist

See `TESTING.md` for the broader strategy.
