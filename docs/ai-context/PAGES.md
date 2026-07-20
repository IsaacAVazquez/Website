# Pages — AI Context

Fast route reference for the current app.

**Last updated:** 2026-06-19

---

## Live Route Inventory

| Route | File | Render Pattern |
|------|------|----------------|
| `/` | `src/app/page.tsx` | Server page composing client sections |
| `/about` | `src/app/about/page.tsx` | Server page -> `About` client component |
| `/portfolio` | `src/app/portfolio/page.tsx` | Server page -> `PortfolioInstrument` client (searchable, filtered project index) |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Server detail page |
| `/resume` | `src/app/resume/page.tsx` | Server page -> client resume UI |
| `/contact` | `src/app/contact/page.tsx` | Server page -> `ContactContent` |
| `/accessibility` | `src/app/accessibility/page.tsx` | Server page |
| `/writing` | `src/app/writing/page.tsx` | Async server page |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Async server page |
| `/investments` | `src/app/investments/page.tsx` | Server page -> `InvestmentsClient` |
| `/formula-1` | `src/app/formula-1/page.tsx` | Server page -> `Formula1Client` |
| `/fantasy-formula-1` | `src/app/fantasy-formula-1/page.tsx` | Server page -> `FantasyFormula1Client` |
| `/ai-dev-tools` | `src/app/ai-dev-tools/page.tsx` | Server page with filterable AI tool directory |
| `/frontier-models` | `src/app/frontier-models/page.tsx` | Server page backed by frontier model snapshot data |
| `/github-trending-pulse` | `src/app/github-trending-pulse/page.tsx` | Server page backed by GitHub trending snapshot data |
| `/premier-league` | `src/app/premier-league/page.tsx` | Server page -> `PremierLeagueClient` |
| `/la-liga` | `src/app/la-liga/page.tsx` | Server page -> `LaLigaClient` |
| `/mlb` | `src/app/mlb/page.tsx` | Server page -> MLB dashboard client |
| `/nba` | `src/app/nba/page.tsx` | Server page -> NBA dashboard client |
| `/nfl` | `src/app/nfl/page.tsx` | Server page -> NFL dashboard client |
| `/golf` | `src/app/golf/page.tsx` | Server page -> golf dashboard client |
| `/earthquake-pulse` | `src/app/earthquake-pulse/page.tsx` | Server page -> earthquake dashboard client |
| `/world-cup-2026` | `src/app/world-cup-2026/page.tsx` | Server page -> World Cup dashboard client |
| `/bay-area-transit` | `src/app/bay-area-transit/page.tsx` | Server page -> BART dashboard client |
| `/tech-startup-tracker` | `src/app/tech-startup-tracker/page.tsx` | Server page -> startup tracker client |
| `/march-madness-2026` | `src/app/march-madness-2026/page.tsx` | Async server page -> `MarchMadnessClient` |
| `/news-pulse` | `src/app/news-pulse/page.tsx` | Server page -> `NewsPulseClient` |
| `/spacex-mission-control` | `src/app/spacex-mission-control/page.tsx` | Server page -> SpaceX client dashboard |
| `/polling-aggregator` | `src/app/polling-aggregator/page.tsx` | Async server page -> `PollingAggregatorClient` |
| `/fintech-tools/budget-planner` | `src/app/fintech-tools/budget-planner/page.tsx` | Server page -> budget planner client |
| `/fintech-tools/interchange-iq` | `src/app/fintech-tools/interchange-iq/page.tsx` | Server page -> `InterchangeIQClient` |
| `/mba-internship-notifications` | `src/app/mba-internship-notifications/page.tsx` | Async server page -> `MBAJobsClient` |
| `/decision-lab` | `src/app/decision-lab/page.tsx` | Server page for decision-modeling content |
| `/food-map` | `src/app/food-map/page.tsx` | Server page for food map content |
| `/recipe-finder` | `src/app/recipe-finder/page.tsx` | Server page for recipe finder content |
| `/wine-cellar` | `src/app/wine-cellar/page.tsx` | Server page for wine cellar content |
| `/museum-log` | `src/app/museum-log/page.tsx` | Server page for museum log content |
| `/travel` | `src/app/travel/page.tsx` | Server page -> `TravelPlannerClient` (browser-persisted planner) |
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Server page -> fantasy client UI |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Redirect page to the canonical fantasy board |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | Redirect page to the canonical RB board |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Server page |
| `/search` | `src/app/search/page.tsx` | Search UI page |
| `/admin` | `src/app/admin/page.tsx` | Auth-aware admin page |
| `/now` | `src/app/now/page.tsx` | Current focus / status page |
| `/changelog` | `src/app/changelog/page.tsx` | Site changelog page |

There is no live `/admin/analytics` route in the current app tree.

---

## Shared Layout Facts

- `src/app/layout.tsx` renders fonts, providers, skip link, and `StaticHeader`
- `ConditionalLayout` wraps page content and footer
- self-shell routes:
- `/about`
- `/ai-dev-tools`
- `/bay-area-transit`
- `/changelog`
- `/contact`
- `/decision-lab`
- `/earthquake-pulse`
- `/fantasy-formula-1`
- `/fantasy-football`
- `/fantasy-football/draft-tracker`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/food-map`
- `/formula-1`
- `/golf`
- `/github-trending-pulse`
- `/investments`
- `/la-liga`
- `/march-madness-2026`
- `/mba-internship-notifications`
- `/museum-log`
- `/news-pulse`
- `/now`
- `/polling-aggregator`
- `/premier-league`
- `/portfolio`
- `/portfolio/[slug]`
- `/recipe-finder`
- `/resume`
- `/spacex-mission-control`
- `/tech-startup-tracker`
- `/travel`
- `/wine-cellar`
- `/world-cup-2026`
- `/writing`
- `/writing/[slug]`

Semantics:

- `ConditionalLayout` owns the only `main` landmark for self-shell routes
- route files inside that shell should not render another `main`
- portfolio-shell routes should render one page-level `h1`

Footer behavior:

- compact footer on `/` and `/contact`
- full footer on most other pages

---

## Route-Specific Notes

### `/portfolio`

- server page calls `getPortfolioProjects()` and hands the full non-`comingSoon` project index to the `PortfolioInstrument` client (`src/components/portfolio/PortfolioInstrument.tsx`)
- `PortfolioInstrument` adds a client-side project search, category filter tablist, a featured project, sortable + paginated grid, and a marquee band that sits between the project grid and the pager
- cards should make role, problem space, and impact scannable before click-through
- do not document `ProjectsContent.tsx` as the primary live implementation

### `/writing`

- backed by `content/blog/`
- `Writing` is promoted in the main nav
- route should still be discoverable from portfolio-shell CTAs and cross-links

### `/resume`

- uses the shared shell now and should not drift into a disconnected visual language
- keep the content resume-first even when refreshing the presentation

### `/investments`

- route metadata presents it as a public investment research platform
- client shell lives in `src/app/investments/investments-client.tsx`

### `/march-madness-2026`

- server entry provides metadata, breadcrumb/article/FAQ/sports structured data
- client route supports deep-linked state through query params

### `/premier-league`

- server entry provides metadata plus breadcrumb and sports-application structured data
- client route supports deep-linked `overview`, `fixtures`, and `team` views through query params

### `/formula-1`

- server entry provides metadata plus breadcrumb and software-application structured data
- client route supports deep-linked `overview`, `drivers`, `constructors`, and `calendar` views through query params

### `/fantasy-formula-1`

- server entry provides metadata plus breadcrumb and software-application structured data
- client route supports deep-linked `builder`, `assets`, and `rules` views through query params
- lineup state is browser-local and scoped by season

### `/la-liga`

- server entry provides metadata plus breadcrumb and sports-application structured data
- client route supports deep-linked `overview`, `fixtures`, `europe`, `relegation`, and club views through query params

### `/fantasy-football`

- server shell (`page.tsx`) supplies metadata + structured data and hands deep-linked state to the `FantasyFootballClient` rankings board; sibling route `/fantasy-football/draft-tracker` is the manual draft assistant
- both surfaces read one FantasyPros snapshot through `useFantasySnapshot` (`/data/fantasy/{scoring}.json` with an `/api/fantasy-data` fallback) and share three browser-local stores: watchlist (`fantasy-player-queue-v1`), private notes (`fantasy-player-notes-v1`, 280-char cap), and compare selection (`fantasy-compare-v1`, max 3)
- rankings board: deep-linkable position pill bar (overall/QB/RB/WR/TE/Flex/K/DST via `?position=`), PPR/Half-PPR/Standard scoring selector (`?scoring=`), per-board search, and a List/Tiers view toggle (`?view=tiers`; list is the default and drops the param) managed by `fantasy-state.ts`
- List view adds a localStorage-backed Comfortable/Compact density control (`fantasy-board-density`) and 60-row infinite-scroll windowing; rows surface published rank, expert range, rostered %, bye, and — when the snapshot carries ADP — an ADP column with green Value / amber Reach chips at a ±10-spot consensus-vs-market gap
- shared presentation lives in `src/components/fantasy/` (barrel `index.ts`): `TierBreakdown`, `FantasyBoardLegend`, `PositionFilterBar`, `RankingsListRow`, `TierBreakSeparator`, `PlayerDetailDrawer`, `RankDistributionBar`, `CompareTray`, `CompareModal`; cross-surface stores live in `src/hooks/use{PlayerQueue,PlayerNotes,CompareTray}.ts` over `useLocalStorageString`, with key constants in `src/lib/fantasyLocal.ts`
- board math/formatting/legend copy lives in `src/lib/fantasyUtils.ts`; the pure draft signal engine (steals/reaches/position-runs) lives in `src/lib/draftAnalytics.ts`
- the draft assistant reuses the same snapshot, watchlist, notes, drawer, and compare tray, adding an advisory pick clock, multi-step undo/redo, per-team naming, CSV/recap-CSV/JSON export, and per-season state under `fantasy-draft-tracker-v2-<season>`

### Standalone data tools

- `/news-pulse` is a live route backed by `/api/news-pulse`
- `/spacex-mission-control` is a live route backed by `/api/spacex/*`
- `/polling-aggregator` is a live route backed by `src/data/pollingSnapshot.ts`
- `/mlb`, `/nba`, and `/nfl` are live sports dashboards backed by committed TypeScript snapshots and matching `/api/{league}/*` routes
- `/golf` is a live sports dashboard backed by `src/data/golfSnapshot.ts`, rebuilt by `npm run update:golf`
- `/world-cup-2026` is a live World Cup hub backed by `src/data/worldCupSnapshot.ts` and `/api/world-cup/*`
- `/bay-area-transit` is a live BART dashboard backed by `src/data/bayAreaTransitSnapshot.ts` and `/api/bay-area-transit/*`
- `/earthquake-pulse` is a live USGS earthquake monitor backed by `src/data/earthquakeSnapshot.ts` and `/api/earthquake-pulse/summary`
- `/tech-startup-tracker` is a live curated startup funding tracker backed by `src/data/techStartupSnapshot.ts`
- `/ai-dev-tools` and `/frontier-models` are live AI/knowledge surfaces
- `/decision-lab`, `/food-map`, `/recipe-finder`, `/wine-cellar`, `/museum-log`, `/travel`, `/now`, and `/changelog` are live personal or utility surfaces
- `/fintech-tools/budget-planner` and `/fintech-tools/interchange-iq` are live fintech tool routes
- `/mba-internship-notifications` is a live route backed by `/api/mba-jobs` that polls Greenhouse, Lever, Ashby, SmartRecruiters, and direct-HTML job boards across ~28 of 39 tracked companies for MBA internships and full-time business roles

### `/search`

- search UI exists, but its backing API is limited and mostly hardcoded

---

## Redirect Rules

Canonical routes:

- `/portfolio`, not `/projects`
- `/writing`, not `/blog`

See `REDIRECTS-AND-NAVIGATION.md` for the redirect table.
