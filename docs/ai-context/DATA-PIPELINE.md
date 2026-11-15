# Data Pipeline — AI Context

Current high-level data flow reference.

**Last updated:** 2026-11-02

---

## Portfolio And Route Data

- project metadata comes from `src/constants/caseStudies.ts`
- navigation data comes from `src/constants/catalog97Nav.ts`
- most marketing/portfolio pages are statically described and metadata-driven
- the homepage and `/dashboards` print readouts from the committed SpaceX, Premier League, La Liga, Bay Area transit, and Formula 1 snapshots and the investments index through `getSnapshotReadouts()` in `src/lib/catalog97Readouts.ts`

---

## Writing Pipeline

Source:

- `content/blog/*.mdx`

Loader:

- `src/lib/blog.ts`

Flow:

1. read frontmatter with `gray-matter`
2. parse markdown with `remark` and `remark-gfm`, then render sanitized HTML through `remark-rehype`, `rehype-sanitize`, and `rehype-stringify`
3. build the writing index, the topic pages under `/writing/topics/[topic]`, the article pages, the search entries behind `/api/search`, and the RSS feed at `/api/rss`
4. hold back any post whose `publishedAt` date (UTC) is still ahead (`isBlogPostPublished`), so it stays out of listings, search, the sitemap, and the RSS feed until a production build runs on or after that date

Cover images come from `npm run update:article-images` (`scripts/buildArticleCoverImages.ts`, with one plan entry per slug in `scripts/data/articleCoverImages.ts`). For each `wikimedia` entry it saves a freely licensed Wikimedia Commons photo under `public/images/writing/covers/` and writes the cover-image frontmatter, and `.github/workflows/update-article-images.yml` runs it every Monday at 06:40 UTC. A post with no `coverImage` falls back to its generated `/writing/<slug>/opengraph-image`. The runbook is `docs/ARTICLE_IMAGE_WORKFLOW.md`.

---

## Investments Pipeline

The live investments experience uses a curated snapshot model.

Main pieces:

- route shell: `src/app/investments/investments-client.tsx`
- local portfolio state: `src/hooks/useInvestments.ts`
- research section fetching: `src/hooks/useStockData.ts`, which reads `/data/investments/{SYMBOL}/snapshot.json` in the browser through `getClientInvestmentSnapshot` in `src/lib/investmentsClientData.ts`
- `/investments/before-you-buy` compares purchases in the browser from the same per-symbol snapshots and reads the holdings `/investments` saved without writing them (`docs/BEFORE_YOU_BUY.md`)
- the index is read on the server by `src/app/investments/page.tsx` (`getInvestmentsIndex`, with `public/data/investments/index.json` as the fallback import); there is no `/api/investments/index` route
- API routes:
  - `/api/investments/quotes`, which fetches live Finnhub quotes at request time (it needs `FINNHUB_API_KEY`) for symbols on the allowlist in `public/data/investments/index.json`

Update path:

- `npm run update:investments`
- runs the Python fetch script and snapshot build pipeline
- `.github/workflows/update-investments.yml` runs it Tuesday through Saturday at 08:30 UTC and commits `public/data/investments`

## Football Dashboard Pipeline

Premier League and La Liga use committed JSON snapshots, each with a typed `.ts` re-export beside it:

- `src/data/premierLeagueSnapshot.json`
- `src/data/laLigaSnapshot.json`

Update paths:

- `npm run update:football` for both leagues
- `npm run update:premier-league` for Premier League only
- `npm run update:la-liga` for La Liga only
- production builds consume committed football snapshots without calling external providers

The pages and the `/api/{premier-league,la-liga}/teams/[teamId]` routes read those committed snapshots instead of calling `football-data.org`. The league `/summary` routes were removed. Both league builders (`src/lib/premierLeagueData.ts`, `src/lib/laLigaData.ts`) are thin wrappers over the competition-parameterized `src/lib/footballLeagueData.ts`, which owns the fetch sequence, the season rollover re-pin, the normalizers, and the live single-flight cache.

---

## US Sports Dashboard Pipeline

MLB, NBA, and NFL use committed JSON snapshots, each with a typed `.ts` re-export beside it:

- `src/data/mlbSnapshot.json`
- `src/data/nbaSnapshot.json`
- `src/data/nflSnapshot.json`

Update paths:

- `npm run update:mlb`
- `npm run update:nba`
- `npm run update:nfl`

The pages read the summaries on the server, and the team drilldown routes under `/api/mlb/*`, `/api/nba/*`, and `/api/nfl/*` read those snapshots. The matching GitHub Actions workflows refresh and commit snapshots on their seasonal schedules.

Golf uses `src/data/golfSnapshot.json`, rebuilt by `npm run update:golf` (`scripts/buildGolfSnapshot.ts`) from ESPN's public golf leaderboard endpoint; `.github/workflows/update-golf.yml` refreshes it every three hours Thursday through Sunday and once a day Monday through Wednesday. A failed fetch keeps the previous snapshot. Between tournaments, restamping requires verified final tournament completion (a status of Final, Complete, or Completed in any case, with ESPN's `completed` flag not set to false) and an end date within 45 days; in-progress boards retain their prior timestamp.

The 2026 World Cup hub uses `src/data/worldCupSnapshot.json`, rebuilt by `npm run update:world-cup` from ESPN's public `soccer/fifa.world` endpoints; `.github/workflows/update-world-cup.yml` has no schedule now that the tournament is over and runs on manual dispatch only, and its gate job skips the refresh outside the tournament window it reads from the snapshot, which for 2026 closed on July 22. Runtime routes under `/api/world-cup/*` read the committed snapshot.

Score pools uses `src/data/scorePoolsSnapshot.json`, rebuilt by `npm run update:score-pools` (`scripts/buildScorePoolsSnapshot.ts`) from The Odds API, API-Football, and manual or CSV fixtures; `.github/workflows/update-score-pools.yml` runs every six hours and skips the refresh with a notice until both `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` are set. The builder refuses to write provider-empty or stale live-league output, and pool configuration and picks stay in the browser through `src/hooks/useScorePools.ts`.

---

## Civic And Curated Tool Pipelines

- `/bay-area-transit` uses `src/data/bayAreaTransitSnapshot.json`, rebuilt by `npm run update:bay-area-transit` from BART's public legacy API; `.github/workflows/update-bay-area-transit.yml` refreshes it every six hours. Runtime routes under `/api/bay-area-transit/*` fetch BART at request time and fall back to the committed snapshot.
- `/earthquake-pulse` uses `src/data/earthquakeSnapshot.json`, rebuilt by `npm run update:earthquake` from public USGS GeoJSON feeds; `.github/workflows/update-earthquake.yml` refreshes it daily at 06:20 UTC. `/api/earthquake-pulse/summary` fetches USGS at request time and falls back to the committed snapshot, with event detail embedded in the summary payload.
- `/tech-startup-tracker` uses the editorially curated `src/data/techStartupSnapshot.json`, rebuilt by `npm run update:tech-startups` from a hand-maintained seed in `scripts/buildTechStartupSnapshot.ts`. There is no refresh workflow because there is no live source to poll.
- `/ai-dev-tools`, `/food-map`, and `/travel-deals` read hand-authored files (`src/app/ai-dev-tools/ai-dev-tools-data.ts`, `src/app/food-map/food-map-data.ts`, `src/data/travelDealsSnapshot.ts`). `.github/workflows/audit-curated-data.yml` runs `scripts/auditCuratedData.ts` every Monday at 15:25 UTC and fails on any of these, the tech startup and frontier model seeds, the museum log, the retirement capital market assumptions, or the rent versus buy tax constants once one is past its review window or structurally invalid.

---

## Shared Snapshot Commit/Push Step

Every scheduled snapshot workflow ends by committing and pushing the refreshed snapshot through one shared helper:

- `scripts/ci/commit-and-push-snapshot.sh <commit-message> <pathspec...>`

What it does:

- exits cleanly (no-op) when the given pathspecs show no change, and otherwise sets the `github-actions[bot]` git identity, regenerates `public/sitemap.xml` and stages it with the pathspecs (only when the site's dependencies are installed), and exits cleanly if nothing ends up staged
- on a real diff it commits, then pushes to `HEAD:main` with a retry loop (default 8 attempts, override via `SNAPSHOT_PUSH_ATTEMPTS`)
- on each push rejection it `git fetch origin main` and `git rebase --autostash origin/main`, regenerates the sitemap and amends the commit when that changes it, then retries with a capped quadratic backoff plus jitter, which absorbs contention from the many snapshot bots pushing to `main` concurrently (the football leagues every four hours, transit, and the rest)
- resolves a rebase conflict confined to `public/sitemap.xml` by regenerating the sitemap, and bails (exit 1) only on a conflict in any other file or after exhausting all attempts

All 17 `.github/workflows/update-*.yml` workflows route their commit+push through this helper: `update-article-images`, `update-bay-area-transit`, `update-earthquake`, `update-fantasy`, `update-formula-1`, `update-github-trending`, `update-golf`, `update-investments`, `update-la-liga`, `update-mlb`, `update-nba`, `update-nfl`, `update-polling`, `update-premier-league`, `update-score-pools`, `update-spacex`, and `update-world-cup`. The behavior is asserted by `.github/workflows/__tests__/snapshot-workflows.test.ts` and `update-investments.test.ts`. Thirteen of those workflows are short callers of the reusable `.github/workflows/refresh-snapshot.yml`, which runs `npm run update:<id>`, checks the result with `scripts/verifyDataRefresh.ts`, commits, and opens or closes the lane's failure issue.

Committed data reaches production through `.github/workflows/publish-data.yml`, which runs at 01:15, 07:15, 13:15, and 19:15 UTC, on any push to `main` whose commit does not carry `[skip ci]`, and on manual dispatch. Every refresh commit carries `[skip ci]`, so refreshed data waits for the next scheduled run. Each run builds the site in GitHub Actions, deploys it with `netlify deploy --prod --context production`, and checks `/api/data-revisions` against the committed data. `scripts/ci/netlify-ignore.sh` keeps Netlify from building `main` itself.

---

## Fantasy Football Pipeline

The fantasy stack is generated snapshot first:

- `scripts/buildFantasyPositionData.ts`
- `scripts/buildFantasyAdpData.ts`
- `scripts/buildFantasyGameLogData.ts`
- `scripts/buildFantasyVorpData.ts`
- `scripts/buildFantasySnapshots.ts`
- `scripts/buildBestBallSnapshot.ts`
- `scripts/buildFantasyWeeklySnapshot.ts`
- `src/app/api/fantasy-data/route.ts`
- `src/lib/fantasySnapshotServer.ts`
- `src/lib/fantasy.ts`

Public generated outputs include:

- `src/data/fantasyPositionData.generated.json`
- `src/data/fantasyAdpData.generated.json`
- `src/data/fantasyGameLogData.generated.json`
- `src/data/fantasyVorpData.generated.json`
- `src/data/fantasyRankHistory.generated.json`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`
- `public/data/fantasy/best-ball.json`
- `public/data/fantasy/weekly.json`

The public app and `/api/fantasy-data` read those generated snapshot files. Locally, `npm run update:fantasy` runs the redraft, best ball, and weekly builds in that order. In CI, `.github/workflows/update-fantasy.yml` publishes the weekly board first, restores rejected redraft and best ball output before either lane commits, and runs within a 45-minute timeout budget. There are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes in the current app tree.

---

## Search Pipeline

Current search is intentionally limited:

- `/api/search` matches against the blog posts from `getBlogPostSearchEntries()` in `src/lib/blog.ts`, the case studies in `src/constants/caseStudies.ts`, and a hardcoded page list in the route
- `/search` consumes that route

Do not describe this as a full dynamic content index.

---

## Seasonal Analysis Pipeline

March Madness is split between:

- route metadata and structured data in the server page
- interactive state in the client route files, with the URL state in `src/app/march-madness-2026/march-madness-state.ts` and the bracket, picks, rankings, and result note in `src/app/march-madness-2026/march-madness-data.ts`, which the weekly curated-data audit lists as archived
- companion articles in `content/blog/2026-march-madness-bracket-analysis.mdx` and `content/blog/2026-march-madness-postmortem.mdx`

## Other Standalone Data Tools

- `/news-pulse` reads data through `/api/news-pulse` and `getNewsPulseData()` in `src/lib/newsPulseServer.ts`, which the page's server render also calls and which keeps each feed's last good result in Netlify Blobs; `src/lib/news-pulse-utils.ts` holds the client-side clustering and sentiment helpers
- `/spacex-mission-control` reads `src/data/spacexSnapshot.generated.json` (rebuilt by `npm run update:spacex`, with launch images from `npm run update:spacex-images`) through `src/lib/spacexData.ts` for both the server render and the client's `/api/spacex/*` calls, and `spacexData.ts` fetches Launch Library live only when the snapshot has no data
- `/formula-1` reads `src/data/formula1Snapshot.json`, rebuilt by `npm run update:formula-1`
- `/fantasy-formula-1` reads Formula 1 data and browser-local lineup state helpers in `src/lib/fantasyFormula1.ts`
- `/github-trending-pulse` and `/agent-build-index` read `src/data/githubTrendingSnapshot.json`, rebuilt by `npm run update:github-trending`
- `/frontier-models` reads the daily fact-checked `frontier-models` blob in the `dashboard-snapshots` Netlify Blobs store through `src/lib/frontierModelsSnapshot.ts` when one is current, and otherwise `src/data/frontierModelsSnapshot.json`, rebuilt from `scripts/data/frontierModels.source.ts`
- `/polling-aggregator` reads the `polling` blob, which `netlify/functions/refresh-polling.ts` writes every six hours, through `src/lib/pollingSnapshot.ts` when one is current, and otherwise the seed `src/data/pollingSnapshot.json`, which `.github/workflows/update-polling.yml` refreshes daily
- `/museum-log` reads `src/data/museumSnapshot.ts`, with personal visit state browser-local via `src/hooks/useMuseumLog.ts`
- `/recipe-finder` reads `src/data/recipesSnapshot.ts` through `src/lib/recipes.ts`, and keeps the pantry and the meal plan (`src/lib/recipePlan.ts`) browser-local
- `/travel` keeps all trip, itinerary, and journal state browser-local via `src/hooks/useTravelPlanner.ts`; there is no server data source
- `/wine-cellar` keeps cellar state browser-local via `src/hooks/useWineCellar.ts`
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is client-side and does not depend on a checked-in data refresh script
- `/fintech-tools/rent-vs-buy` runs `src/lib/rentVsBuy/*` in the browser through `src/hooks/useRentVsBuy.ts`, on dated tax constants in `src/lib/rentVsBuy/defaults.ts` that the weekly curated-data audit checks
- `/decision-lab` scores decisions in the browser with `src/app/decision-lab/decision-lab-data.ts` and keeps saved bets browser-local through `src/hooks/useBrowserRecord.ts`
- `/enablement-assistant` runs `src/app/enablement-assistant/enablement-engine.ts` in the browser and keeps team records browser-local through `src/hooks/useBrowserRecord.ts`

---

## Job Search & MBA Roles Pipeline

- **Sources:** ATS boards for 59 tracked companies in `src/constants/mba-companies.ts` (37 Greenhouse, 7 Ashby, 2 SmartRecruiters, 1 Lever, 1 direct-HTML, and 11 manual; 48 actively fetched).
- **Request-time aggregation:** `/api/mba-jobs` aggregates and normalizes listings with a 30-minute `s-maxage` cache and 8s per-target timeout, filtered by role families and keywords in `src/lib/mba-job-matching.ts`. A request with `?external=on` also pulls Adzuna leads when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are set, and the last good result per source persists in the `runtime-last-good` Netlify Blobs store.
- **Local candidate dumping:** `./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts` pulls live feeds, matches against `private/job-search/targets.json`, and writes `private/job-search/candidates.json`.
- **Development-only file sync:** `/api/job-search` syncs `pipeline.json` and `candidates.json` with the client tracker's `localStorage` in development (content-hash revision tracking, 409 conflict detection, newer `updatedAt` wins). Anywhere else it answers 404, since it needs `NODE_ENV=development`, `JOB_SEARCH_PRIVATE_SYNC=1` (which `npm run dev` sets through `scripts/dev.cjs` unless a hostname flag is passed), and a loopback `Host` header.

---

## Rule Of Thumb

When updating docs:

- treat `content/blog/` as the source for writing content
- treat `src/constants/*` as the source for static portfolio data
- treat `src/app/api/**` as the source for live API data paths
- treat older plan docs as historical unless they are explicitly refreshed
