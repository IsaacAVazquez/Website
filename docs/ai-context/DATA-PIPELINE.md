# Data Pipeline — AI Context

Current high-level data flow reference.

**Last updated:** 2026-06-08

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
- `prebuild` runs the faster `scripts/updateFootballSnapshots.ts --league-only` path during `npm run build`

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

Golf uses the manually maintained `src/data/golfSnapshot.ts`; there is no golf update script or scheduled workflow.

---

## Fantasy Football Pipeline

The fantasy stack is generated snapshot first:

- `scripts/buildFantasyPositionData.ts`
- `scripts/buildFantasySnapshots.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/lib/fantasySnapshotServer.ts`
- `src/lib/fantasy.ts`

Public generated outputs include:

- `src/data/fantasyPositionData.generated.ts`
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
- `/museum-log` reads `src/data/museumSnapshot.ts`
- `/recipe-finder` reads `src/data/recipesSnapshot.ts` through `src/lib/recipes.ts`
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is client-side and does not depend on a checked-in data refresh script

---

## Rule Of Thumb

When updating docs:

- treat `content/blog/` as the source for writing content
- treat `src/constants/*` as the source for static portfolio data
- treat `src/app/api/**` as the source for live API data paths
- treat older plan docs as historical unless they are explicitly refreshed
