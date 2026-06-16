# Data Update Operations

A single command → artifact → schedule lookup for every data refresh on the
site. This is the operational index; it deliberately does **not** re-explain the
architecture or the per-workflow prose:

- Architecture (seed → builder → Action → accessors → API, the fallback
  contract): `../SNAPSHOT_DRIVEN_DASHBOARDS.md`
- Per-script and per-workflow detail: `AUTOMATION_SCRIPTS.md`, `CRON_SETUP.md`,
  and the **Automation Surfaces** section of `../AGENTS.md`

**Last updated:** 2026-06-16

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
| MLB | `update:mlb` | `updateMlbSnapshot.ts` | MLB Stats API | `src/data/mlbSnapshot.ts` | `update-mlb.yml` | daily 10:05 UTC, Apr–Oct |
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

## Failure behavior

Builders that fetch a live source fall back to the last-good snapshot on
failure via `scripts/snapshotFallback.ts` (`readGeneratedSnapshot`) and write
atomically. So a flaky upstream produces a no-op run, not a wiped dashboard. The
investments builder is similar — symbols with no fresh raw sections keep their
committed snapshot. See `../SNAPSHOT_DRIVEN_DASHBOARDS.md` for the contract.
