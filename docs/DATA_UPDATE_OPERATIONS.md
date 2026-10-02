# Data Update Operations

A single command → artifact → schedule lookup for every data refresh on the
site. This is the operational index; it deliberately does **not** re-explain the
architecture or the per-workflow prose:

- Architecture (seed → builder → Action → accessors → API, the fallback
  contract): `../SNAPSHOT_DRIVEN_DASHBOARDS.md`
- Per-workflow detail: `CRON_SETUP.md` and the **Automation Surfaces**
  section of `../AGENTS.md`. Each script's header comment says what it does.

**Last updated:** 2026-10-02

The `update:*` commands write committed TypeScript or JSON artifacts. A failed
or empty fetch keeps the previous snapshot, and every scheduled job now checks
the artifact timestamp against one shared freshness policy before it can
commit. The earthquake and BART API routes also refresh their time-sensitive
data at request time, with the committed artifact retained as the last-good
fallback. Each of those request-time reads makes one attempt with a 4 second
timeout, and a response served from the committed artifact carries the
`stale-fallback` status.

---

## Master table

| Surface | `npm run` | Script(s) | Upstream source | Committed artifact | Workflow | Cadence |
|---|---|---|---|---|---|---|
| Fantasy football (redraft) | `update:fantasy:redraft` | `buildFantasyPositionData.ts` → `buildFantasyAdpData.ts` → `buildFantasyGameLogData.ts` → `buildFantasyVorpData.ts` → `buildFantasySnapshots.ts` | FantasyPros cheatsheets + FF Calculator ADP + nflverse weekly player stats | `public/data/fantasy/{ppr,half_ppr,standard}.json`, `src/data/fantasy*.generated.ts`, `src/data/fantasyRankHistory.generated.json` (rolling 17-day ECR/ADP history behind the 7 and 14-day movement stamps) | `update-fantasy.yml` | daily 17:17 UTC July through December and January 1 through 12; Wednesdays 17:17 UTC January through June; Sundays 11:47 UTC in January and September through December |
| Fantasy football (best ball) | `update:fantasy:best-ball` | `buildBestBallSnapshot.ts` | FantasyPros best ball + Superflex consensus, Underdog ADP via Hayden Winks, ESPN schedule | `public/data/fantasy/best-ball.json` | `update-fantasy.yml` | same job, separate lane and commit; rejected output is restored before either draft lane commits |
| Fantasy football (weekly) | `update:fantasy:weekly` | `buildFantasyWeeklySnapshot.ts` | FantasyPros weekly FLEX and QB consensus | `public/data/fantasy/weekly.json` | `update-fantasy.yml` | same job, builds and commits first; the builder writes nothing before Week 1 or from seven days after Week 18 opens |
| Investments | `update:investments` | `fetch_investments_data.py` (needs `.venv`) → `buildInvestmentsSnapshots.ts` | `defeatbeta-api` (Python) | `public/data/investments/index.json` + `{SYMBOL}/snapshot.json` | `update-investments.yml` | Tuesday through Saturday 08:30 UTC |
| Football (both) | `update:football` | runs `update:premier-league`, waits 30 seconds for the rate-limit window, then runs `update:la-liga` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.json` + `laLigaSnapshot.json` | none *(full run is manual ~weekly)* | manual |
| Premier League | `update:premier-league` | `buildPremierLeagueSnapshot.json` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.json` | `update-premier-league.yml` | every 4h, August through May |
| La Liga | `update:la-liga` | `updateLaLigaSnapshot.json` | football-data.org *(token)* | `src/data/laLigaSnapshot.json` | `update-la-liga.yml` | every 4h, August through May |
| NFL | `update:nfl` | `updateNflSnapshot.json` | NFLverse CSVs | `src/data/nflSnapshot.json` | `update-nfl.yml` | daily 10:35 UTC, September through February |
| MLB | `update:mlb` | `updateMlbSnapshot.json` | MLB Stats API | `src/data/mlbSnapshot.json` | `update-mlb.yml` | every 4h, March 20 through November 6 |
| NBA | `update:nba` | `updateNbaSnapshot.json` | ESPN NBA | `src/data/nbaSnapshot.json` | `update-nba.yml` | every 4h, mid-October through June |
| Golf | `update:golf` | `buildGolfSnapshot.json` | ESPN golf | `src/data/golfSnapshot.json` | `update-golf.yml` | every 3h Thursday through Sunday; daily otherwise; restamping requires verified final tournament status within 45 days |
| Formula 1 | `update:formula-1` | `buildFormula1Snapshot.json` | OpenF1 | `src/data/formula1Snapshot.json` | `update-formula-1.yml` | every 3h Thursday through Sunday; daily otherwise |
| World Cup 2026 | `update:world-cup` | `buildWorldCupSnapshot.json` | ESPN `soccer/fifa.world` | `src/data/worldCupSnapshot.json` | `update-world-cup.yml` | no schedule; manual dispatch only |
| Score pools | `update:score-pools` | `buildScorePoolsSnapshot.json` | The Odds API + API-Football *(tokens required for live leagues)* + manual/CSV | `src/data/scorePoolsSnapshot.json` | `update-score-pools.yml` | every 6h; the run skips the refresh and passes with a notice until both provider keys are set |
| Bay Area Transit | `update:bay-area-transit` | `buildBayAreaTransitSnapshot.json` | BART public API *(`BART_API_KEY` optional; demo-key fallback)* | `src/data/bayAreaTransitSnapshot.json` | `update-bay-area-transit.yml` | every 6h, year-round |
| Earthquake Pulse | `update:earthquake` | `buildEarthquakeSnapshot.json` | USGS GeoJSON feeds | `src/data/earthquakeSnapshot.json` | `update-earthquake.yml` | daily 06:20 UTC |
| GitHub Trending | `update:github-trending` | `buildGitHubTrendingSnapshot.json` | GitHub Search API *(`GITHUB_TOKEN` optional)* | `src/data/githubTrendingSnapshot.json` | `update-github-trending.yml` | daily 07:45 UTC |
| SpaceX data | `update:spacex` | `buildSpaceXSnapshot.ts` | Launch Library / SpaceDevs | `src/data/spacexSnapshot.generated.json` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| SpaceX images | `update:spacex-images` | `buildSpaceXImageSnapshots.ts` | launch image assets | `src/data/spacexImageManifest.generated.json`, `public/data/spacex/*` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| Tech startups | `update:tech-startups` | `buildTechStartupSnapshot.ts` | curated seed *(in script)* | `src/data/techStartupSnapshot.json` | none *(curated)* | manual |
| Frontier models | `update:frontier-models` *(seed)* | `buildFrontierModelsSnapshot.ts` + `netlify/functions/refresh-frontier-models.ts` | `scripts/data/frontierModels.source.ts` + models.dev/OpenRouter fact check | `src/data/frontierModelsSnapshot.json` *(seed)* + `dashboard-snapshots` blob | Netlify scheduled function *(no Action)* | seed manual; facts daily 07:30 UTC |
| AI dev tools | none | hand-authored catalog | official product and repository sources | `src/app/ai-dev-tools/ai-dev-tools-data.ts` | `audit-curated-data.yml` | weekly review |
| Museum log | none | hand-authored catalog | museum websites and curator notes | `src/data/museumSnapshot.ts` | `audit-curated-data.yml` | weekly review |
| Travel deals | none | hand-authored estimates | editorial fare bands and tactics | `src/data/travelDealsSnapshot.ts` | `audit-curated-data.yml` | weekly review |
| Food map | none | hand-authored catalog | curator recommendations and map references | `src/app/food-map/food-map-data.ts` | `audit-curated-data.yml` | weekly review |
| Capital market assumptions | none | hand-authored constants | J.P. Morgan's annual release for two returns, illustrative estimates for the rest | `src/lib/retirement/capitalMarketAssumptions.ts` | `audit-curated-data.yml` | weekly review, 400 day window |
| Rent versus buy tax constants | none | hand-authored constants | IRS pages, 26 USC 164, Freddie Mac's weekly survey | `src/lib/rentVsBuy/defaults.ts` | `audit-curated-data.yml` | weekly review, 400 day window |
| March Madness 2026 | none | hand-authored picks | the picks as made on 2026-03-17, with the results noted | `src/app/march-madness-2026/march-madness-data.ts` | `audit-curated-data.yml` | archived, never overdue |
| Polling | `update:polling` *(seed)* | `buildPollingSnapshot.ts` + `netlify/functions/refresh-polling.ts` (shared `src/lib/pollingData.ts`) | VoteHub Polling API, CC BY 4.0 | `src/data/pollingSnapshot.json` *(seed)* + `dashboard-snapshots` blob | `update-polling.yml` *(seed)* + Netlify scheduled function | seed daily 05:55 UTC; blob every 6h |
| Article cover images | `update:article-images` | `buildArticleCoverImages.ts` (plan: `scripts/data/articleCoverImages.ts`) | Wikimedia Commons *(no token)* | `public/images/writing/covers/*` + `content/blog/*.mdx` frontmatter | `update-article-images.yml` | weekly Mon 06:40 UTC + dispatch |

Investment raw provider responses under `data/investments-raw/` are transient
builder inputs. The directory is gitignored and no files under it are tracked.
The workflow commits only the compact public snapshots, which keeps the raw files
out of automated commits, and a failed symbol keeps its prior snapshot and
original freshness metadata. A non-empty price array is not enough to promote a
symbol: its latest source date must be within seven calendar days of the run.
The builder writes `priceAsOf` for every symbol and an aggregate `priceHealth`
block so source freshness stays separate from snapshot build time. Prices for
the whole symbol list come from one bulk query, written per symbol as
`bulk_price.json`, so a symbol the per-symbol pass did not reach still gets its
newest price. The workflow fails when fewer than 95% of priced symbols carry a
price from the last seven days. The Python packages are pinned in
`scripts/requirements-investments.txt`. The current source and licensing ledger
is `INVESTMENTS_DATA_SOURCES.md`.

Every section other than price comes from a rotation. A run has a 22 minute
budget and fully fetches part of the list, oldest attempt first. It reached 31,
35, and 62 of the 151 symbols in the three runs from 2026-09-15 to 2026-09-29,
so those sections turn over about once a week when every run passes. The industry
section runs last, because its aggregates read every ticker in the industry and
the large industries can outlast the symbol timer. When it does, the symbol
keeps the sections it already fetched and carries its prior industry section
forward. The workflow counts the symbols more than 21 days past their last full
fetch, commits the snapshots anyway, and then fails the run so the backlog opens
an issue.

News Pulse remains API-backed at request time and has no committed snapshot. Its
last good per-feed data, and the MBA jobs route's last good result, are persisted
in Netlify Blobs so cold starts do not erase their fallback.

Frontier models pilots the blob-backed refresh lane. A daily Netlify scheduled
function fact-checks the curated seed against models.dev and OpenRouter and
writes the result to the `dashboard-snapshots` blob store. No commit and no
rebuild is involved, and the committed seed stays the fallback and the editorial
source of truth. See the lane description in `../SNAPSHOT_DRIVEN_DASHBOARDS.md`.

---

## Freshness targets

`src/lib/dataFreshnessPolicy.ts` holds one target per surface, and
`scripts/verifyDataRefresh.ts` and `/api/data-revisions` both read it. The
targets were reset on 2026-09-28 from how often the jobs really run. GitHub
started about two thirds of the scheduled runs in September 2026, often hours
late, and `publish-data.yml` deploys four times a day, so a four hour target
failed on most days without anything being wrong.

| Surface | In season or always | Out of season |
|---|---|---|
| Bay Area transit, score pools | 20 hours | same |
| Premier League, La Liga | 20 hours | 75 days in June and July |
| MLB | 20 hours from April 5 through November 6 | 170 days |
| NBA | 20 hours from October 15 through June | 150 days |
| NFL | 3 days from September through February | 240 days |
| Formula 1, golf | 20 hours Thursday through Sunday, 36 hours Monday through Wednesday | same |
| Earthquake, SpaceX | 36 hours | same |
| GitHub trending, polling | 48 hours | same |
| Investments | 102 hours, which covers a weekend | same |
| Fantasy football | 36 hours from July until Week 1 opens, then 200 days from that kickoff while FantasyPros leaves the draft board frozen | 10 days |
| World Cup 2026 | never goes stale, since the tournament is over | same |
| News Pulse | 6 hours | same |
| MBA jobs | 30 hours | same |
| Frontier models | 45 days | same |
| AI dev tools | 60 days | same |
| Tech startups | 90 days | same |
| Museum log, travel deals, food map | 180 days | same |

Polling is measured from when the refresh ran. VoteHub can go weeks without a
new poll, so the age of the newest poll fails nothing and the page prints it.

---

## Tokens / prerequisites

| Need | Used by |
|------|---------|
| `FOOTBALL_DATA_API_TOKEN` | `update:football`, `update:premier-league`, `update:la-liga` (only when rebuilding). The deployed pages read the committed snapshots and do not need it |
| `THE_ODDS_API_KEY` (needed for live data; the scheduled workflow skips with a notice without it) | `update:score-pools` |
| `API_FOOTBALL_KEY` (needed for live data; the scheduled workflow skips with a notice without it) | `update:score-pools` |
| `SPACEDEVS_API_TOKEN` (optional; the anonymous tier is rate limited) | `update:spacex`, `update:spacex-images` |
| `GITHUB_TOKEN` / `GH_TOKEN` (optional, higher rate limit) | `update:github-trending` |
| `BART_API_KEY` (optional; falls back to the published demo key) | request-time transit refresh, `update:bay-area-transit` |
| Python `.venv` (`.venv/bin/python3`, packages from `scripts/requirements-investments.txt`) | `update:investments` |
| *No token* | MLB, NBA, NFL, golf, Formula 1, World Cup, BART (demo-key fallback), USGS, SpaceX, VoteHub polling |

---

## Build and refresh boundary

- Production builds consume committed snapshots and never call external data
  providers. The earthquake summary route and the two BART routes
  (`/api/earthquake-pulse/summary`, `/api/bay-area-transit/summary`,
  `/api/bay-area-transit/stations/[stationId]`) make separate request-time
  refreshes and keep those snapshots as fallbacks. No other route asks for
  live data.
- Premier League and La Liga refresh through their dedicated workflows every
  four hours in season; NFL refreshes through `update-nfl.yml` (or a manual
  run). Their pages read the committed snapshots.
- `update:football` (the ~16-min full refresh, including per-team fixtures and
  form) remains an explicit local task, not a build step.
- `publish-data.yml` coalesces successful refresh workflows, builds the site in
  GitHub Actions, uploads it with `netlify deploy --prod --context production`, and verifies the
  complete `/api/data-revisions` ledger before it closes a publication incident.
  The check reads the ledger from the Netlify origin, `isaacvazquez.netlify.app`,
  because Cloudflare challenges runner traffic on the custom domain. On
  2026-09-29 that challenge failed every publish from 02:16 UTC until the check
  moved, while the deploys themselves were fine. It started when the workflow
  moved from Node 20 to Node 22.
  Building in Actions is deliberate. The Netlify account is on the free tier with
  300 build minutes a month, it ran out on 2026-08-06, and every git-triggered
  build after that was skipped, so committed data stopped reaching production.
  A build that never runs on Netlify's infrastructure does not consume build minutes, and this repository is public
  so Actions minutes are free. `scripts/ci/netlify-ignore.sh` keeps Netlify from
  building `main` or dependabot branches on its own. Publication needs the
  `NETLIFY_AUTH_TOKEN` repository secret.

---

## Recommended local refresh

```bash
npm run update:football   # ~16 min, run in background
git add src/data/
git commit -m "data: refresh football snapshots"
git push
```

The same shape applies to any surface: run `npm run update:<x>`, then commit the
changed artifact under `src/data/` or `public/data/`.

---

## How workflows commit (shared CI helper)

All 17 `update-*.yml` workflows route their git commit + push through one
shared helper, `scripts/ci/commit-and-push-snapshot.sh`, rather than each
hand-rolling its own git steps. Ten of them (transit, earthquake, GitHub
Trending, golf, La Liga, MLB, NBA, NFL, polling, Premier League) are short
callers of `.github/workflows/refresh-snapshot.yml`, which holds the shared
checkout, install, refresh, verify, commit, and failure-issue steps; each caller
keeps only its name, schedule, concurrency group, and lane inputs.

```bash
bash scripts/ci/commit-and-push-snapshot.sh "<commit message>" <pathspec> [pathspec ...]
```

It sets the `github-actions[bot]` git identity, stages the given pathspecs, and
**exits 0 cleanly if nothing is staged** (a no-op refresh). On a real diff it
commits, then pushes to `HEAD:main` with a retry loop (default 8 attempts;
override via `SNAPSHOT_PUSH_ATTEMPTS`). On each push rejection it
`git fetch origin main` and `git rebase --autostash origin/main`, then retries
with capped exponential backoff plus jitter, which absorbs the contention from
many snapshot bots (the football leagues, transit, and the rest) pushing to
`main` concurrently. It bails (exit 1) only on a genuine rebase conflict or after
exhausting every attempt. Usage is asserted by
`.github/workflows/__tests__/snapshot-workflows.test.ts` (and the investments
variant).

The 17 callers are `update-article-images`, `update-bay-area-transit`, `update-earthquake`, `update-fantasy`,
`update-formula-1`, `update-github-trending`, `update-golf`, `update-investments`,
`update-la-liga`, `update-mlb`, `update-nba`, `update-nfl`, `update-premier-league`,
`update-polling`, `update-score-pools`, `update-spacex`, and `update-world-cup`.

---

## Failure behavior

Builders that fetch a live source fall back to the last-good snapshot on
failure via `scripts/snapshotFallback.ts` (`readGeneratedSnapshot`) and write
atomically. So a flaky upstream produces a no-op run, not a wiped dashboard. The
investments builder is similar, and symbols with no fresh raw sections keep their
committed snapshot. See `../SNAPSHOT_DRIVEN_DASHBOARDS.md` for the contract.
The scheduled workflow still fails when the retained artifact exceeds its
freshness policy, which prevents fail-soft behavior from becoming silent stasis.
