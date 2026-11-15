# Architecture

High-level system architecture for the current live application.

**Last updated:** 2026-11-02

---

## System Summary

This repo is a single Next.js app that serves multiple product surfaces:

1. portfolio and professional site pages
2. MDX-backed writing
3. fantasy football analytics tools
4. an investment research platform
5. a seasonal March Madness editorial analysis route
6. sports dashboards — Premier League (`/premier-league`), La Liga (`/la-liga`), MLB (`/mlb`), NBA (`/nba`), NFL (`/nfl`), golf (`/golf`), the 2026 World Cup (`/world-cup-2026`), Formula 1 (`/formula-1`), and Fantasy Formula 1 (`/fantasy-formula-1`)
7. standalone data tools for AI tools, frontier models, GitHub trends, news, space launches, polling, earthquakes (`/earthquake-pulse`), Bay Area transit (`/bay-area-transit`), startup funding (`/tech-startup-tracker`), exact-score prediction pools (`/score-pools`), product and team tools (`/decision-lab`, `/enablement-assistant`), personal logs and planners (including `/travel` and `/travel-deals`), and fintech calculators
8. a full-time and internship job search tracker (`/mba-internship-notifications`)

The architecture is intentionally mixed:

- server routes for metadata, content loading, and API handlers
- client islands for animation, charting, tabs, and form-heavy workflows

---

## Runtime Shape

```text
src/app/layout.tsx
  -> Providers
  -> ConditionalLayout
       -> the seven designed routes pass through and render Catalog97Shell themselves
       -> every other route is wrapped in Catalog97ToolShell
```

### Key shell facts

- `Catalog97Shell` supplies the header, the only `main` landmark, and the espresso footer on every route, either directly or through `Catalog97ToolShell`
- the seven designed routes are the ones in `src/constants/catalog97Nav.ts`
- `Catalog97ToolShell` adds the build-note aside
- `ConditionalLayout` passes `wide` for the dense tools in `WIDE_TOOL_ROUTES` (`src/constants/catalog97Nav.ts`), and every shell on those pages, header and footer included, prints on the 1376px `--c97-container-wide`
- see `AGENTS.md` for the full shell description

---

## Major App Areas

### Portfolio and writing

- static and semi-static content
- metadata-heavy
- project data from constants
- writing content from `content/blog/`

### Fantasy football

- mixed server/client rendering
- generated static snapshots in `public/data/fantasy/`
- `/api/fantasy-data` server fallback over the same snapshot files
- `.github/workflows/update-fantasy.yml` refreshes the snapshots daily from July 1 through January 12, on Wednesdays from January through June, and on Sunday mornings in January and from September through December, running `npm run update:fantasy:weekly`, `update:fantasy:redraft`, and `update:fantasy:best-ball` as three lanes that commit separately (`npm run update:fantasy` runs all three locally)
- a separate committed best ball snapshot at `public/data/fantasy/best-ball.json` combines FantasyPros best ball and half PPR superflex consensus, current Underdog ADP, bye weeks, and the Week 17 schedule; `src/lib/bestBall/` applies the selected contest rules without changing the redraft engine
- `src/lib/fantasyTeamValue.ts` derives the shared room-relative Draft Outlook and exact expected return math used by both trackers. The structural model stays separate from payout probability because current snapshots do not contain populated weekly player projections or an outcome distribution
- the rankings board (`/fantasy-football`) and draft assistant (`/fantasy-football/draft-tracker`) share two browser-local stores layered over `src/hooks/useLocalStorageString.ts`, with pure parse/serialize and key constants in `src/lib/fantasyLocal.ts`: a player watchlist (`usePlayerQueue`) and per-player notes (`usePlayerNotes`). The third store keyed there, the compare selection (`useCompareTray`), backs the shared player drawer and the compare tray, and only the best ball board renders that tray, since the rankings board dropped its compare tray and its persisted list density on 2026-08-18. Shared presentation components live in `src/components/fantasy/`. Both draft trackers save synchronously and track revisions to guard against multi-tab overwrite
- the in-season weekly board ships at `public/data/fantasy/weekly.json` (built by `npm run update:fantasy:weekly`) and backs `/fantasy-football/weekly` and `/fantasy-football/waivers`, and `/fantasy-football/trade-calculator` reads the redraft snapshot and, from Week 1, the weekly snapshot's rest-of-season board
- the private draft companion, a Chrome and Edge side panel, lives in `extension/` with its shared logic in `src/lib/fantasyCompanion/`, builds with `npm run build:fantasy-companion`, and is not part of the deployed site (see `docs/FANTASY_DRAFT_COMPANION.md`)

### Investments

- client shell under `src/app/investments/investments-client.tsx`
- browser-local portfolio state, subscribing to storage events and checking each stored symbol's shape with `isValidSymbol` (`src/lib/investmentSymbol.ts`)
- curated research snapshots read as static files from `public/data/investments/` (`index.json` plus one `<SYMBOL>/snapshot.json` per symbol) through `src/lib/investmentsClientData.ts`, since the research API routes were removed (the last on 2026-10-02)
- `/investments/before-you-buy` compares two purchases of the same amount against an edited copy of the portfolio, reading the same static snapshots and the saved holdings (`src/lib/beforeYouBuy.ts`)
- the retirement planner inside the dashboard (`src/components/investments/retirement/`) runs on the pure projection and Monte Carlo engine in `src/lib/retirement/` and keeps its inputs in the browser through `useRetirementPlan` (see `RETIREMENT_PLANNER_ENGINE.md`)

### Football dashboards

Both `/premier-league` and `/la-liga` are snapshot-driven. Data is fetched from `football-data.org` by builder scripts, run locally or by the GitHub Actions below, and committed as JSON files in `src/data/`, each with a typed `.ts` wrapper. The pages and the team API routes read those committed files, and nothing calls `football-data.org` at runtime.

- `src/data/premierLeagueSnapshot.json` — Premier League standings, fixtures, scorers
- `src/data/laLigaSnapshot.json` — La Liga standings, fixtures, scorers

Shared UI components for both dashboards live in `src/components/football/`.

Update workflow:
- `npm run update:football` — full update for both leagues (~16 min, run locally then commit snapshots)
- `npm run update:premier-league` — PL only
- `npm run update:la-liga` — La Liga only
- GitHub Actions refresh each league every four hours from August through May
- production builds consume committed snapshots without calling football-data.org

### March Madness

- server page for metadata and structured data
- client UI for deep-linked tabs and editorial analysis modules
- companion article under `/writing`

### Job search and candidate pipeline

The `/mba-internship-notifications` route is a full-time and internship job search tracker for tech product management and business roles across 59 tracked companies.

- Client shell lives in `src/app/mba-internship-notifications/mba-jobs-client.tsx`, supporting three primary views:
  - The feed shows live postings aggregated from public ATS boards (Greenhouse, Ashby, SmartRecruiters, Lever, direct-HTML) via `/api/mba-jobs`, filtered by `src/lib/mba-job-matching.ts`
  - The pipeline is the application tracker (`useMBAApplications`), with stages (saved, applied, interviewing, offer, rejected, archived), priority, a fit reading (a score from 0 to 100 with a rationale), interview rounds (label, date, outcome, notes), deadlines, and follow-ups
  - Candidates is the sourced candidate review view (`candidates-view.tsx` and `useMBAJobCandidates`) for triaging prospective roles (sourced, reviewed, dismissed), and the view switch shows it only when `npm run dev` started the server
- Storage & sync:
  - In production, and in any dev server not started by `npm run dev`, application state persists in browser `localStorage` only
  - When `npm run dev` starts the server, `scripts/dev.cjs` turns private sync on, and the tracker syncs its `localStorage` with `private/job-search/pipeline.json` through `/api/job-search` (newer `updatedAt` wins, and a 409 on a stale revision merges and retries once), while the candidates view reads and writes `private/job-search/candidates.json` through the same route
- Local candidate dumping: `scripts/jobSearch/dumpCandidates.ts` pulls live boards, matches against `private/job-search/targets.json`, and writes `private/job-search/candidates.json`

### Other standalone tools

- `/mlb`, `/nba`, and `/nfl` use committed JSON snapshots in `src/data/` and matching `/api/{league}/*` routes
- `/golf` uses `src/data/golfSnapshot.json`, rebuilt by `npm run update:golf` from ESPN's public golf leaderboard endpoint
- `/world-cup-2026` uses `src/data/worldCupSnapshot.json` and `/api/world-cup/*`, rebuilt by `npm run update:world-cup` from ESPN's public World Cup endpoints
- `/bay-area-transit` uses a committed route catalog and last-good snapshot, while `/api/bay-area-transit/*` refreshes departures and alerts from BART at request time
- `/earthquake-pulse` uses `src/data/earthquakeSnapshot.json` as fallback while `/api/earthquake-pulse/summary` refreshes from USGS at request time
- `/tech-startup-tracker` uses the editorially curated `src/data/techStartupSnapshot.json`, rebuilt by `npm run update:tech-startups` from a hand-maintained seed
- `/travel` is a browser-persisted travel planner backed by `src/hooks/useTravelPlanner.ts`
- `/formula-1` and `/fantasy-formula-1` use `src/data/formula1Snapshot.json`, and `/fantasy-formula-1` keeps the picked lineup in the browser
- `/ai-dev-tools` is a curated directory whose data lives in the route's `ai-dev-tools-data.ts`, and `/frontier-models` serves the daily fact check that `netlify/functions/refresh-frontier-models.ts` writes to Netlify Blobs while it is under three days old and newer than the committed seed, and otherwise the committed `src/data/frontierModelsSnapshot.json`, which `npm run update:frontier-models` builds from `scripts/data/frontierModels.source.ts`
- `/github-trending-pulse` uses `src/data/githubTrendingSnapshot.json`
- `/news-pulse` reads six outlets' RSS feeds at request time through `src/lib/newsPulseServer.ts`, which caches the result for five minutes and keeps each feed's last good headlines. The page renders that result on the server and fetches it again through `/api/news-pulse` once it loads, and the clustering, sentiment, and reading-level helpers are in `src/lib/news-pulse-utils.ts`
- `/spacex-mission-control` renders the committed `src/data/spacexSnapshot.generated.json`, which `npm run update:spacex` builds from Launch Library 2, and its client polls `/api/spacex/*` every five minutes while the tab is visible. Those routes read the same committed snapshot and fall back to Launch Library 2 only when it has nothing to serve, and the UI lives in `src/components/spacex/`
- `/polling-aggregator` serves the VoteHub refresh that `netlify/functions/refresh-polling.ts` writes to Netlify Blobs every six hours while it is under 36 hours old and newer than the committed seed, and otherwise the committed `src/data/pollingSnapshot.json`, which `.github/workflows/update-polling.yml` rebuilds daily
- `/food-map`, `/recipe-finder`, `/wine-cellar`, `/museum-log`, `/travel`, `/now`, and `/changelog` are live personal or utility surfaces
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is a client-side fee analyzer
- `/fintech-tools/rent-vs-buy` is a browser-persisted calculator on the pure engine in `src/lib/rentVsBuy/`, read through `src/hooks/useRentVsBuy.ts`
- `/score-pools`, `/score-pools/tracker`, and `/score-pools/settings` read `src/data/scorePoolsSnapshot.json`, rebuilt by `npm run update:score-pools` from API-Football fixtures, The Odds API odds, and manual entries, and keep pools and picks in the browser through `src/hooks/useScorePools.ts`; the engine is `src/lib/scorePools/` (see `SCORE_POOLS_ENGINE.md`)
- `/agent-build-index` ranks AI agent repositories from the same `src/data/githubTrendingSnapshot.json` through `src/lib/agentBuildIndex.ts`
- `/decision-lab` and `/enablement-assistant` are client-side tools whose data lives in the route folder, and they keep saved bets and teams in the browser through `src/hooks/useBrowserRecord.ts`
- `/travel-deals` reasons against the hand-authored `src/data/travelDealsSnapshot.ts` through `src/lib/travelDeals.ts` and keeps its state in the browser
- `/arcade` is a client-side game (`src/app/arcade/ArcadeClient.tsx`)
- `/search` is the full site search over `/api/search`, `/accessibility` and `/privacy` are the site's policy pages, and the five noindexed `/back-room/[discovery]` pages and `/teapot`, a route handler outside `src/app/api/` that answers 418, are easter eggs listed in `docs/EASTER_EGGS.md`

---

## Data Sources

### Static app data

- `src/constants/caseStudies.ts`
- `src/constants/catalog97Nav.ts`
- `src/constants/personal.ts`
- `src/constants/toolCategories.ts` (the categories `/dashboards` filters by)
- `src/constants/aboutFaq.ts` (the `/about` FAQ and its structured data)
- `src/constants/mba-companies.ts` and `src/constants/mba-role-taxonomy.ts` (the job search tracker's companies and role families)

### Football snapshots

- `src/data/premierLeagueSnapshot.json`
- `src/data/laLigaSnapshot.json`

These are committed JSON files, each with a typed `.ts` wrapper beside it, rebuilt by `scripts/buildPremierLeagueSnapshot.ts` and `scripts/updateLaLigaSnapshot.ts`. The API routes for each dashboard read from these files, not from `football-data.org` at runtime.

### Other dashboard snapshots

- `src/data/mlbSnapshot.json`
- `src/data/nbaSnapshot.json`
- `src/data/nflSnapshot.json`
- `src/data/golfSnapshot.json`
- `src/data/worldCupSnapshot.json`
- `src/data/earthquakeSnapshot.json`
- `src/data/bayAreaTransitSnapshot.json`
- `src/data/formula1Snapshot.json`
- `src/data/githubTrendingSnapshot.json`
- `src/data/frontierModelsSnapshot.json`
- `src/data/techStartupSnapshot.json`
- `src/data/pollingSnapshot.json`
- `src/data/scorePoolsSnapshot.json`
- `src/data/travelDealsSnapshot.ts`
- `src/data/museumSnapshot.ts`
- `src/data/recipesSnapshot.ts`
- `src/data/spacexSnapshot.generated.json`
- `src/data/spacexImageManifest.generated.json`

### Writing content

- `content/blog/*.mdx`
- loaded through `src/lib/blog.ts`

### Fantasy football

- generated position data in `src/data/fantasyPositionData.generated.json`, with the ADP, game log, VORP, and rank history data beside it in `src/data/fantasyAdpData.generated.json`, `src/data/fantasyGameLogData.generated.json`, `src/data/fantasyVorpData.generated.json`, and `src/data/fantasyRankHistory.generated.json`, and the cache-busting revision in `src/data/fantasySnapshotRevision.generated.ts`
- generated public JSON snapshots in `public/data/fantasy/`
- snapshot reader in `src/lib/fantasySnapshotServer.ts`
- public API fallback at `/api/fantasy-data`
- browser-local user state (watchlist, notes, compare selection) in `src/lib/fantasyLocal.ts` with `use{PlayerQueue,PlayerNotes,CompareTray}` hooks; not part of the committed snapshot

### Investments

- curated snapshot assets in `public/data/investments/`, rebuilt by `npm run update:investments` and read by the client as static files
- live quote enrichment through `/api/investments/quotes`, which asks Finnhub and accepts only symbols listed in `public/data/investments/index.json`

---

## API Architecture

All API handlers live under `src/app/api/`.

Important groups:

- system and freshness ledger: `/api/data-revisions`
- fantasy football: `/api/fantasy-data`
- investments: `/api/investments/quotes`
- football: `/api/premier-league/teams/[teamId]`, `/api/la-liga/teams/[teamId]`
- US sports and golf: `/api/mlb/teams/[teamId]`, `/api/nba/teams/[teamId]`, `/api/nfl/teams/[teamId]`, `/api/golf/players/[playerId]`, `/api/formula-1/meetings/[meetingId]`
- World Cup: `/api/world-cup/teams/[teamId]`
- transit and geo: `/api/bay-area-transit/summary`, `/api/bay-area-transit/stations/[stationId]`, `/api/earthquake-pulse/summary`
- jobs: `/api/mba-jobs` and development-only `/api/job-search`
- content/utilities: `/api/news-pulse`, `/api/spacex/summary`, `/api/spacex/launches`, `/api/spacex/launches/[id]`, `/api/rss`, `/api/search`
- newsletter: `/api/newsletter/subscribe`, which adds an address to Resend's contacts for `NewsletterSignup`

Current caveat:

- `/api/search` is still limited. It matches substrings and tags over every blog post, every case study, and a hand-kept list of the other pages and tools in the route file, so it does not index every page

---

## Layout And Navigation Rules

- canonical portfolio path is `/portfolio`, not `/projects`
- canonical writing path is `/writing`, not `/blog`
- promoted nav is the seven links in `catalog97NavLinks`, labeled `Home / Work / Writing / Dashboards / About / Résumé / Contact`
- standalone dashboard/tool routes are live but not promoted in the global header

See `PAGES.md` and `docs/ai-context/REDIRECTS-AND-NAVIGATION.md` for the detailed route map.

---

## Styling Architecture

Core styling lives in:

- `src/app/globals.css`
- `src/app/catalog97.css`
- `tailwind.config.ts`

The system is token-driven:

- the `--c97-*` Catalog 97 tokens, declared under `[data-c97]` and `[data-c97-surface]` in `src/app/catalog97.css` and read by the site frame on every route
- since 2026-10-11 each project route owns its design inside that frame (`docs/superpowers/specs/2026-10-11-project-sovereign-design.md`), so a route may declare a palette of its own, as the eight fantasy football routes do with the `--ffb-*` tokens in `src/components/fantasy/fantasy.css`
- the fluid type scale in `globals.css`, which Tailwind's `text-*` utilities read
- a Tailwind config whose radius and shadow scales compile to nothing, since Catalog 97 has neither
- the `catalog97.css` component classes (`c97-band`, `c97-shell`, `c97-panel`, `c97-table`, and the rest) in place of the Working Instrument helpers, which were deleted on 2026-09-27

---

## Deployment And Build

- deployed on Netlify, though Netlify's own git integration does not build production. `.github/workflows/publish-data.yml` builds and uploads it with one `netlify deploy --prod` command on every push to `main` without `[skip ci]`, at 01:15, 07:15, 13:15, and 19:15 UTC, and on manual dispatch, and `scripts/ci/netlify-ignore.sh` cancels Netlify's own builds of `main` and `dependabot/*` branches, so human pull requests still get a Netlify deploy preview
- build command comes from `netlify.toml`
- production builds consume committed snapshots without running data refreshes, and the refresh workflows commit with `[skip ci]`, so refreshed data goes live at the next scheduled `publish-data.yml` run
- `postbuild` runs `scripts/generatePublicSitemap.mjs`, then `scripts/buildLlmsFull.mjs` (which writes `public/llms-full.txt`), then `scripts/patch-nft-sharp.mjs`
- `next.config.mjs` handles redirects, response headers (including CDN caching for the pages in `cdnCachedPages`), tracing exclusions, image config, `optimizePackageImports` for `lucide-react` and `d3`, and hash-validated webpack snapshots for production builds
- `netlify/functions/` holds two scheduled functions, `refresh-polling.ts` (every six hours) and `refresh-frontier-models.ts` (daily at 07:30 UTC), which write fresh snapshots to Netlify Blobs through `src/lib/netlifyBlobs.ts`

Notable build constraints:

- `better-sqlite3` and `sharp` are kept out of inappropriate bundles
- `.github/workflows/test.yml` runs `npm run typecheck` before `npm run build` on every push and pull request to `main` or `develop`, and the deploy in `publish-data.yml` does not run that script

---

## Current Source Of Truth

When architecture docs and code disagree, trust:

1. `src/app/**`
2. `src/app/api/**`
3. `src/components/**`
4. `next.config.mjs`
5. `package.json`
