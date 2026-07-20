# Data Update Operations

A single command → artifact → schedule lookup for every data refresh on the
site. This is the operational index; it deliberately does **not** re-explain the
architecture or the per-workflow prose:

- Architecture (seed → builder → Action → accessors → API, the fallback
  contract): `../SNAPSHOT_DRIVEN_DASHBOARDS.md`
- Per-script and per-workflow detail: `AUTOMATION_SCRIPTS.md`, `CRON_SETUP.md`,
  and the **Automation Surfaces** section of `../AGENTS.md`

**Last updated:** 2026-07-20

The `update:*` commands write committed TypeScript or JSON artifacts. A failed
or empty fetch keeps the previous snapshot, and every scheduled job now checks
the artifact timestamp against one shared freshness policy before it can
commit. Earthquake, BART, and MLB APIs also refresh their time-sensitive data
at request time, with the committed artifact retained as the last-good
fallback.

---

## Master table

| Surface | `npm run` | Script(s) | Upstream source | Committed artifact | Workflow | Cadence |
|---|---|---|---|---|---|---|
| Fantasy football | `update:fantasy` | `buildFantasyPositionData.ts` → `buildFantasyAdpData.ts` → `buildFantasySnapshots.ts` | FantasyPros cheatsheets + FF Calculator ADP | `public/data/fantasy/{ppr,half_ppr,standard}.json`, `src/data/fantasy*.generated.ts` | `update-fantasy.yml` | daily July through September; weekly otherwise |
| Investments | `update:investments` | `fetch_investments_data.py` (needs `.venv`) → `buildInvestmentsSnapshots.ts` | `defeatbeta-api` (Python) | `public/data/investments/index.json` + `{SYMBOL}/snapshot.json` | `update-investments.yml` | weekdays 22:15 UTC |
| Football (both) | `update:football` | `updateFootballSnapshots.ts` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.ts` + `laLigaSnapshot.ts` | none *(full run is manual ~weekly)* | manual |
| Premier League | `update:premier-league` | `buildPremierLeagueSnapshot.ts` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.ts` | `update-premier-league.yml` | every 4h, August through May |
| La Liga | `update:la-liga` | `updateLaLigaSnapshot.ts` | football-data.org *(token)* | `src/data/laLigaSnapshot.ts` | `update-la-liga.yml` | every 4h, August through May |
| NFL | `update:nfl` | `updateNflSnapshot.ts` | NFLverse CSVs | `src/data/nflSnapshot.ts` | `update-nfl.yml` | Tue 10:35 UTC, September through February |
| MLB | `update:mlb` | `updateMlbSnapshot.ts` | MLB Stats API | `src/data/mlbSnapshot.ts` | `update-mlb.yml` | every 4h, March through November (fallback seed; the API serves live statsapi at request time) |
| NBA | `update:nba` | `updateNbaSnapshot.ts` | ESPN NBA | `src/data/nbaSnapshot.ts` | `update-nba.yml` | every 4h, mid-October through June |
| Golf | `update:golf` | `buildGolfSnapshot.ts` | ESPN golf | `src/data/golfSnapshot.ts` | `update-golf.yml` | every 3h Thursday through Sunday; daily otherwise |
| Formula 1 | `update:formula-1` | `buildFormula1Snapshot.ts` | OpenF1 | `src/data/formula1Snapshot.ts` | `update-formula-1.yml` | every 3h Thursday through Sunday; daily otherwise |
| World Cup 2026 | `update:world-cup` | `buildWorldCupSnapshot.ts` | ESPN `soccer/fifa.world` | `src/data/worldCupSnapshot.ts` | `update-world-cup.yml` | every 30m, June through July |
| Score pools | `update:score-pools` | `buildScorePoolsSnapshot.ts` | The Odds API + API-Football *(tokens required for live leagues)* + manual/CSV | `src/data/scorePoolsSnapshot.ts` | `update-score-pools.yml` | every 6h |
| Bay Area Transit | `update:bay-area-transit` | `buildBayAreaTransitSnapshot.ts` | BART public API *(`BART_API_KEY` optional; demo-key fallback)* | `src/data/bayAreaTransitSnapshot.ts` | `update-bay-area-transit.yml` | every 6h, year-round |
| Earthquake Pulse | `update:earthquake` | `buildEarthquakeSnapshot.ts` | USGS GeoJSON feeds | `src/data/earthquakeSnapshot.ts` | `update-earthquake.yml` | hourly (min 20) |
| GitHub Trending | `update:github-trending` | `buildGitHubTrendingSnapshot.ts` | GitHub Search API *(`GITHUB_TOKEN` optional)* | `src/data/githubTrendingSnapshot.ts` | `update-github-trending.yml` | daily 07:45 UTC |
| SpaceX data | `update:spacex` *(alias `update:spacex-data`)* | `buildSpaceXSnapshot.ts` | Launch Library / SpaceDevs | `src/data/spacexSnapshot.generated.json` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| SpaceX images | `update:spacex-images` | `buildSpaceXImageSnapshots.ts` | launch image assets | `src/data/spacexImageManifest.generated.json`, `public/data/spacex/*` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| Tech startups | `update:tech-startups` | `buildTechStartupSnapshot.ts` | curated seed *(in script)* | `src/data/techStartupSnapshot.ts` | none *(curated)* | manual |
| Frontier models | `update:frontier-models` | `buildFrontierModelsSnapshot.ts` | `scripts/data/frontierModels.source.ts` | `src/data/frontierModelsSnapshot.ts` | none *(curated)* | manual |
| AI dev tools | none | hand-authored catalog | official product and repository sources | `src/app/ai-dev-tools/ai-dev-tools-data.ts` | `audit-curated-data.yml` | weekly review |
| Museum log | none | hand-authored catalog | museum websites and curator notes | `src/data/museumSnapshot.ts` | `audit-curated-data.yml` | weekly review |
| Travel deals | none | hand-authored estimates | editorial fare bands and tactics | `src/data/travelDealsSnapshot.ts` | `audit-curated-data.yml` | weekly review |
| Food map | none | hand-authored catalog | curator recommendations and map references | `src/app/food-map/food-map-data.ts` | `audit-curated-data.yml` | weekly review |
| Polling | `update:polling` | `buildPollingSnapshot.ts` | VoteHub Polling API, CC BY 4.0 | `src/data/pollingSnapshot.ts` | `update-polling.yml` | every 6h |
| Article cover images | `update:article-images` | `buildArticleCoverImages.ts` (plan: `scripts/data/articleCoverImages.ts`) | Wikimedia Commons *(no token)* | `public/images/writing/covers/*` + `content/blog/*.mdx` frontmatter | `update-article-images.yml` | weekly Mon 06:40 UTC + dispatch |

Investment raw provider responses under `data/investments-raw/` are transient
builder inputs. The directory is gitignored for new files, but existing
historical files remain tracked until the repository cleanup migration. The
workflow commits only the compact public snapshots, which keeps the raw files
out of automated commits, and a failed symbol keeps its prior snapshot and
original freshness metadata. A non-empty price array is not enough to promote a
symbol: its latest source date must be within seven calendar days of the run.
The builder writes `priceAsOf` for every symbol and an aggregate `priceHealth`
block so source freshness stays separate from snapshot build time. The current
source and licensing ledger is `INVESTMENTS_DATA_SOURCES.md`.

News Pulse remains API-backed at request time and has no committed snapshot. Its
last good per-feed data, and the MBA jobs route's last good result, are persisted
in Netlify Blobs so cold starts do not erase their fallback.

---

## Tokens / prerequisites

| Need | Used by |
|------|---------|
| `FOOTBALL_DATA_API_TOKEN` | `update:football`, `update:premier-league`, `update:la-liga` (only when rebuilding) |
| `THE_ODDS_API_KEY` (required in the scheduled workflow) | `update:score-pools` |
| `API_FOOTBALL_KEY` (required in the scheduled workflow) | `update:score-pools` |
| `GITHUB_TOKEN` / `GH_TOKEN` (optional, higher rate limit) | `update:github-trending` |
| `BART_API_KEY` (optional; falls back to the published demo key) | request-time transit refresh, `update:bay-area-transit` |
| Python `.venv` (`.venv/bin/python3`; `defeatbeta-api`) | `update:investments` |
| *No token* | MLB, NBA, NFL, golf, Formula 1, World Cup, BART (demo-key fallback), USGS, SpaceX, VoteHub polling |

---

## Build and refresh boundary

- Production builds consume committed snapshots and never call external data
  providers. Earthquake, BART, and MLB make separate request-time refreshes
  and keep those snapshots as fallbacks.
- Premier League and La Liga refresh through their dedicated daily workflows;
  NFL refreshes through `update-nfl.yml` (or a manual run).
- `update:football` (the ~16-min full refresh, including per-team fixtures and
  form) remains an explicit local task, not a build step.
- `publish-data.yml` coalesces successful refresh workflows, triggers the
  Netlify build hook only when production is behind, and verifies the complete
  `/api/data-revisions` ledger before it closes a publication incident.

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

All 16 snapshot `update-*.yml` workflows route their git commit + push through one
shared helper, `scripts/ci/commit-and-push-snapshot.sh`, rather than each
hand-rolling its own git steps:

```bash
bash scripts/ci/commit-and-push-snapshot.sh "<commit message>" <pathspec> [pathspec ...]
```

It sets the `github-actions[bot]` git identity, stages the given pathspecs, and
**exits 0 cleanly if nothing is staged** (a no-op refresh). On a real diff it
commits, then pushes to `HEAD:main` with a retry loop (default 8 attempts;
override via `SNAPSHOT_PUSH_ATTEMPTS`). On each push rejection it
`git fetch origin main` and `git rebase --autostash origin/main`, then retries
with capped exponential backoff plus jitter, which absorbs the contention from
many snapshot bots (world cup in-tournament, transit, etc.) pushing to
`main` concurrently. It bails (exit 1) only on a genuine rebase conflict or after
exhausting every attempt. Usage is asserted by
`.github/workflows/__tests__/snapshot-workflows.test.ts` (and the investments
variant).

The 16 callers include `update-bay-area-transit`, `update-earthquake`, `update-fantasy`,
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
