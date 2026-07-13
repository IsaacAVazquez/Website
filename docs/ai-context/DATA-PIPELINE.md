# Data Pipeline — AI Context

Current high-level data flow reference.

**Last updated:** 2026-06-19

---

## Portfolio And Route Data

- project metadata comes from `src/constants/caseStudies.ts`
- navigation data comes from `src/constants/navlinks.tsx`
- most marketing/portfolio pages are statically described and metadata-driven

---

## Writing Pipeline

Source:

- `content/blog/*.mdx`

Loader:

- `src/lib/blog.ts`

Flow:

1. read frontmatter with `gray-matter`
2. parse markdown with `remark`, `remark-gfm`, and `remark-html`
3. build the writing index and individual article pages

---

## Investments Pipeline

The live investments experience uses a curated snapshot model.

Main pieces:

- route shell: `src/app/investments/investments-client.tsx`
- local portfolio state: `src/hooks/useInvestments.ts`
- research section fetching: `src/hooks/useStockData.ts`
- API routes:
  - `/api/investments/index`
  - `/api/investments/quotes`
  - `/api/investments/data/[symbol]`
  - `/api/stocks`

Update path:

- `npm run update:investments`
- runs the Python fetch script and snapshot build pipeline

## Football Dashboard Pipeline

Premier League and La Liga use committed TypeScript snapshots:

- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`

Update paths:

- `npm run update:football` for both leagues
- `npm run update:premier-league` for Premier League only
- `npm run update:la-liga` for La Liga only
- production builds consume committed football snapshots without calling external providers

Runtime API routes read those committed snapshots instead of calling `football-data.org`.

---

## US Sports Dashboard Pipeline

MLB, NBA, and NFL use committed TypeScript snapshots:

- `src/data/mlbSnapshot.ts`
- `src/data/nbaSnapshot.ts`
- `src/data/nflSnapshot.ts`

Update paths:

- `npm run update:mlb`
- `npm run update:nba`
- `npm run update:nfl`

Runtime API routes under `/api/mlb/*`, `/api/nba/*`, and `/api/nfl/*` read those snapshots. The matching GitHub Actions workflows refresh and commit snapshots on their seasonal schedules.

Golf uses `src/data/golfSnapshot.ts`, rebuilt by `npm run update:golf` (`scripts/buildGolfSnapshot.ts`) from ESPN's public golf leaderboard endpoint; `.github/workflows/update-golf.yml` refreshes it daily. A failed fetch keeps the previous snapshot.

The 2026 World Cup hub uses `src/data/worldCupSnapshot.ts`, rebuilt by `npm run update:world-cup` from ESPN's public `soccer/fifa.world` endpoints; `.github/workflows/update-world-cup.yml` refreshes it every six hours during June and July. Runtime routes under `/api/world-cup/*` read the committed snapshot.

---

## Civic And Curated Tool Pipelines

- `/bay-area-transit` uses `src/data/bayAreaTransitSnapshot.ts`, rebuilt by `npm run update:bay-area-transit` from BART's public legacy API; `.github/workflows/update-bay-area-transit.yml` refreshes it every six hours. Runtime routes under `/api/bay-area-transit/*` read the committed snapshot.
- `/earthquake-pulse` uses `src/data/earthquakeSnapshot.ts`, rebuilt by `npm run update:earthquake` from public USGS GeoJSON feeds; `.github/workflows/update-earthquake.yml` refreshes it hourly. `/api/earthquake-pulse/summary` reads the committed snapshot, with event detail embedded in the summary payload.
- `/tech-startup-tracker` uses the editorially curated `src/data/techStartupSnapshot.ts`, rebuilt by `npm run update:tech-startups` from a hand-maintained seed in `scripts/buildTechStartupSnapshot.ts`. There is no scheduled workflow because there is no live source to poll.

---

## Shared Snapshot Commit/Push Step

Every scheduled snapshot workflow ends by committing and pushing the refreshed snapshot through one shared helper:

- `scripts/ci/commit-and-push-snapshot.sh <commit-message> <pathspec...>`

What it does:

- sets the `github-actions[bot]` git identity, stages the given pathspecs, and exits cleanly (no-op) when nothing is staged
- on a real diff it commits, then pushes to `HEAD:main` with a retry loop (default 8 attempts, override via `SNAPSHOT_PUSH_ATTEMPTS`)
- on each push rejection it `git fetch origin main` and `git rebase --autostash origin/main`, then retries with capped exponential backoff plus jitter — this absorbs contention from the many snapshot bots pushing to `main` concurrently (e.g. earthquake hourly, world cup, transit)
- bails (exit 1) only on a genuine rebase conflict or after exhausting all attempts

All 14 `.github/workflows/update-*.yml` workflows route their commit+push through this helper: `update-bay-area-transit`, `update-earthquake`, `update-fantasy`, `update-formula-1`, `update-github-trending`, `update-golf`, `update-investments`, `update-la-liga`, `update-mlb`, `update-nba`, `update-nfl`, `update-premier-league`, `update-spacex`, and `update-world-cup`. The behavior is asserted by `.github/workflows/__tests__/snapshot-workflows.test.ts` and `update-investments.test.ts`.

---

## Fantasy Football Pipeline

The fantasy stack is generated snapshot first:

- `scripts/buildFantasyPositionData.ts`
- `scripts/buildFantasyAdpData.ts`
- `scripts/buildFantasySnapshots.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/lib/fantasySnapshotServer.ts`
- `src/lib/fantasy.ts`

Public generated outputs include:

- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasyAdpData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`

The public app and `/api/fantasy-data` read those generated snapshot files. There are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes in the current app tree.

---

## Search Pipeline

Current search is intentionally limited:

- `/api/search` returns a small hardcoded/static content set
- `/search` consumes that route

Do not describe this as a full dynamic content index.

---

## Seasonal Analysis Pipeline

March Madness is split between:

- route metadata and structured data in the server page
- interactive state and content in the client route files
- companion article content in `content/blog/2026-march-madness-bracket-analysis.mdx`

## Other Standalone Data Tools

- `/news-pulse` reads data through `/api/news-pulse` and `src/lib/news-pulse-utils.ts`
- `/spacex-mission-control` reads SpaceX payloads through `/api/spacex/*` and `src/lib/spacexData.ts`
- `/formula-1` reads `src/data/formula1Snapshot.ts`, rebuilt by `npm run update:formula-1`
- `/fantasy-formula-1` reads Formula 1 data and browser-local lineup state helpers in `src/lib/fantasyFormula1.ts`
- `/github-trending-pulse` reads `src/data/githubTrendingSnapshot.ts`, rebuilt by `npm run update:github-trending`
- `/frontier-models` reads `src/data/frontierModelsSnapshot.ts`, rebuilt from `scripts/data/frontierModels.source.ts`
- `/polling-aggregator` reads `src/data/pollingSnapshot.ts`
- `/museum-log` reads `src/data/museumSnapshot.ts`, with personal visit state browser-local via `src/hooks/useMuseumLog.ts`
- `/recipe-finder` reads `src/data/recipesSnapshot.ts` through `src/lib/recipes.ts`
- `/travel` keeps all trip, itinerary, and journal state browser-local via `src/hooks/useTravelPlanner.ts`; there is no server data source
- `/wine-cellar` keeps cellar state browser-local via `src/hooks/useWineCellar.ts`
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is client-side and does not depend on a checked-in data refresh script

---

## Rule Of Thumb

When updating docs:

- treat `content/blog/` as the source for writing content
- treat `src/constants/*` as the source for static portfolio data
- treat `src/app/api/**` as the source for live API data paths
- treat older plan docs as historical unless they are explicitly refreshed
