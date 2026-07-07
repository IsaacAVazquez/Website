# Data Update Operations

A single command → artifact → schedule lookup for every data refresh on the
site. This is the operational index; it deliberately does **not** re-explain the
architecture or the per-workflow prose:

- Architecture (seed → builder → Action → accessors → API, the fallback
  contract): `../SNAPSHOT_DRIVEN_DASHBOARDS.md`
- Per-script and per-workflow detail: `AUTOMATION_SCRIPTS.md`, `CRON_SETUP.md`,
  and the **Automation Surfaces** section of `../AGENTS.md`

**Last updated:** 2026-06-19

All `update:*` commands write a **committed** artifact (TS snapshot or JSON);
nothing here runs at request time. A failed/empty fetch **keeps the previous
snapshot** rather than wiping it. Workflows commit only when the artifact
changes.

---

## Master table

| Surface | `npm run` | Script(s) | Upstream source | Committed artifact | Workflow | Cadence |
|---|---|---|---|---|---|---|
| Fantasy football | `update:fantasy` | `buildFantasyPositionData.ts` → `buildFantasyAdpData.ts` → `buildFantasySnapshots.ts` | FantasyPros cheatsheets + FF Calculator ADP | `public/data/fantasy/{ppr,half_ppr,standard}.json`, `src/data/fantasy*.generated.ts` | `update-fantasy.yml` | Wed 17:00 UTC |
| Investments | `update:investments` | `fetch_investments_data.py` (needs `.venv`) → `buildInvestmentsSnapshots.ts` | `defeatbeta-api` (Python) | `public/data/investments/index.json` + `{SYMBOL}/snapshot.json` | `update-investments.yml` | Mon + Thu 22:15 UTC |
| Football (both) | `update:football` | `updateFootballSnapshots.ts` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.ts` + `laLigaSnapshot.ts` | — *(full run is manual ~weekly)* | manual |
| Premier League | `update:premier-league` | `buildPremierLeagueSnapshot.ts` | football-data.org *(token)* | `src/data/premierLeagueSnapshot.ts` | `update-premier-league.yml` | daily 06:15 UTC, Aug–May |
| La Liga | `update:la-liga` | `updateLaLigaSnapshot.ts` | football-data.org *(token)* | `src/data/laLigaSnapshot.ts` | `update-la-liga.yml` | daily 06:30 UTC, Aug–May |
| NFL | `update:nfl` | `updateNflSnapshot.ts` | NFLverse CSVs | `src/data/nflSnapshot.ts` | `update-nfl.yml` | Tue 10:35 UTC, Sep–Feb |
| MLB | `update:mlb` | `updateMlbSnapshot.ts` | MLB Stats API | `src/data/mlbSnapshot.ts` | `update-mlb.yml` | daily 10:05 UTC, Mar–Nov |
| NBA | `update:nba` | `updateNbaSnapshot.ts` | ESPN NBA | `src/data/nbaSnapshot.ts` | `update-nba.yml` | daily 10:20 UTC, mid-Oct–Jun |
| Golf | `update:golf` | `buildGolfSnapshot.ts` | ESPN golf | `src/data/golfSnapshot.ts` | `update-golf.yml` | daily 08:40 UTC |
| Formula 1 | `update:formula-1` | `buildFormula1Snapshot.ts` | OpenF1 | `src/data/formula1Snapshot.ts` | `update-formula-1.yml` | daily 08:10 UTC |
| World Cup 2026 | `update:world-cup` | `buildWorldCupSnapshot.ts` | ESPN `soccer/fifa.world` | `src/data/worldCupSnapshot.ts` | `update-world-cup.yml` | every 6h, Jun–Jul |
| Bay Area Transit | `update:bay-area-transit` | `buildBayAreaTransitSnapshot.ts` | BART public API *(demo key)* | `src/data/bayAreaTransitSnapshot.ts` | `update-bay-area-transit.yml` | every 6h, year-round |
| Earthquake Pulse | `update:earthquake` | `buildEarthquakeSnapshot.ts` | USGS GeoJSON feeds | `src/data/earthquakeSnapshot.ts` | `update-earthquake.yml` | hourly (min 20) |
| GitHub Trending | `update:github-trending` | `buildGitHubTrendingSnapshot.ts` | GitHub Search API *(`GITHUB_TOKEN` optional)* | `src/data/githubTrendingSnapshot.ts` | `update-github-trending.yml` | daily 07:45 UTC |
| SpaceX data | `update:spacex` *(alias `update:spacex-data`)* | `buildSpaceXSnapshot.ts` | Launch Library / SpaceDevs | `src/data/spacexSnapshot.generated.json` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| SpaceX images | `update:spacex-images` | `buildSpaceXImageSnapshots.ts` | launch image assets | `src/data/spacexImageManifest.generated.json`, `public/data/spacex/*` | `update-spacex.yml` | daily 09:25 + 21:25 UTC |
| Tech startups | `update:tech-startups` | `buildTechStartupSnapshot.ts` | curated seed *(in script)* | `src/data/techStartupSnapshot.ts` | none — curated | manual |
| Frontier models | `update:frontier-models` | `buildFrontierModelsSnapshot.ts` | `scripts/data/frontierModels.source.ts` | `src/data/frontierModelsSnapshot.ts` | none — curated | manual |
| Article cover images | `update:article-images` | `buildArticleCoverImages.ts` (plan: `scripts/data/articleCoverImages.ts`) | Wikimedia Commons *(no token)* | `public/images/writing/covers/*` + `content/blog/*.mdx` frontmatter | `update-article-images.yml` | weekly Mon 06:40 UTC + dispatch |

**No update path (not snapshot-built):**
- `/polling-aggregator` — static committed `src/data/pollingSnapshot.ts`, edited by hand.
- `/news-pulse` — API-backed at request time (`/api/news-pulse`), no committed snapshot.

---

## Tokens / prerequisites

| Need | Used by |
|------|---------|
| `FOOTBALL_DATA_API_TOKEN` | `update:football`, `update:premier-league`, `update:la-liga` (only when rebuilding) |
| `GITHUB_TOKEN` / `GH_TOKEN` (optional, higher rate limit) | `update:github-trending` |
| Python `.venv` (`.venv/bin/python3`; `defeatbeta-api`) | `update:investments` |
| *No token* | MLB, NBA, NFL, golf, Formula 1, World Cup, BART, USGS, SpaceX |

---

## Build-time refresh (Netlify)

- `prebuild` runs `tsx scripts/updateFootballSnapshots.ts --league-only` on every
  deploy — the fast standings/fixtures/scorers path for the two soccer leagues.
- A daily cron-job.org ping to the Netlify build hook triggers a production
  deploy, so the league-only football refresh and any newly committed snapshots
  go live without manual steps.
- **NFL is intentionally not in `prebuild`** — it refreshes only via
  `update-nfl.yml` (or a manual run).
- `update:football` (the ~16-min full refresh, incl. per-team fixtures + form) is
  a **local weekly** task, not a build step.

---

## Recommended local refresh

```bash
npm run update:football   # ~16 min — run in background
git add src/data/
git commit -m "data: refresh football snapshots"
git push
```

The same shape applies to any surface: run `npm run update:<x>`, then commit the
changed artifact under `src/data/` or `public/data/`.

---

## How workflows commit (shared CI helper)

All 14 snapshot `update-*.yml` workflows route their git commit + push through one
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
with capped exponential backoff plus jitter — this absorbs the contention from
many snapshot bots (earthquake hourly, world cup, transit, etc.) pushing to
`main` concurrently. It bails (exit 1) only on a genuine rebase conflict or after
exhausting every attempt. Usage is asserted by
`.github/workflows/__tests__/snapshot-workflows.test.ts` (and the investments
variant).

The 14 callers: `update-bay-area-transit`, `update-earthquake`, `update-fantasy`,
`update-formula-1`, `update-github-trending`, `update-golf`, `update-investments`,
`update-la-liga`, `update-mlb`, `update-nba`, `update-nfl`, `update-premier-league`,
`update-spacex`, `update-world-cup`.

---

## Failure behavior

Builders that fetch a live source fall back to the last-good snapshot on
failure via `scripts/snapshotFallback.ts` (`readGeneratedSnapshot`) and write
atomically. So a flaky upstream produces a no-op run, not a wiped dashboard. The
investments builder is similar — symbols with no fresh raw sections keep their
committed snapshot. See `../SNAPSHOT_DRIVEN_DASHBOARDS.md` for the contract.
