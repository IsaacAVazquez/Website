# Automation Scripts

Current inventory of the checked-in scripts and operational automations in this repo.

**Last updated:** 2026-06-08

---

## Scripts Directory

Current operational files under `scripts/`:

| File | Purpose |
| --- | --- |
| `buildFantasyPositionData.ts` | Build per-position fantasy data files |
| `buildFantasySnapshots.ts` | Generate static fantasy ranking snapshots |
| `buildFormula1Snapshot.ts` | Rebuild `src/data/formula1Snapshot.ts` from OpenF1 data |
| `buildFrontierModelsSnapshot.ts` | Rebuild `src/data/frontierModelsSnapshot.ts` from the curated source file |
| `buildGitHubTrendingSnapshot.ts` | Rebuild `src/data/githubTrendingSnapshot.ts` from the GitHub Search API |
| `buildInvestmentsSnapshots.ts` | Convert fetched investments data into curated static snapshots |
| `buildPremierLeagueSnapshot.ts` | Rebuild `src/data/premierLeagueSnapshot.ts` from football-data.org (~8 min) |
| `buildSpaceXImageSnapshots.ts` | Cache SpaceX reference images and rebuild image manifests |
| `buildSpaceXSnapshot.ts` | Rebuild `src/data/spacexSnapshot.generated.json` |
| `fetch_investments_data.py` | Pull raw investment data before snapshot generation |
| `generate-pwa-icons.mjs` | Rebuild icon assets |
| `patch-nft-sharp.mjs` | Postbuild patch step used after `next-sitemap` |
| `updateFootballSnapshots.ts` | Orchestrates full football refresh (both PL and La Liga); with `--league-only` flag runs standings-only fast path used in prebuild |
| `updateLaLigaSnapshot.ts` | Rebuild `src/data/laLigaSnapshot.ts` from football-data.org (~8 min) |
| `updateMlbSnapshot.ts` | Rebuild `src/data/mlbSnapshot.ts` from the public MLB Stats API |
| `updateNbaSnapshot.ts` | Rebuild `src/data/nbaSnapshot.ts` from ESPN public NBA endpoints |
| `updateNflSnapshot.ts` | Rebuild `src/data/nflSnapshot.ts` from NFLverse public data |
| `data/frontierModels.source.ts` | Curated source data for the frontier model snapshot builder |
| `investments_symbols.txt` | Curated input list for the investments data workflow |

---

## NPM Entry Points

| Command | Underlying workflow |
| --- | --- |
| `npm run build` | Runs `prebuild`, `next build --webpack`, then npm `postbuild` |
| `npm run prebuild` | Runs the football `--league-only` fast path automatically before build |
| `npm run update:football` | Full football snapshot refresh — both PL and La Liga (~16 min) |
| `npm run update:premier-league` | PL snapshot only — `buildPremierLeagueSnapshot.ts` (~8 min) |
| `npm run update:la-liga` | La Liga snapshot only — `updateLaLigaSnapshot.ts` (~8 min) |
| `npm run update:mlb` | MLB snapshot refresh |
| `npm run update:nba` | NBA snapshot refresh |
| `npm run update:nfl` | NFL snapshot refresh |
| `npm run update:formula-1` | Formula 1 snapshot refresh |
| `npm run update:frontier-models` | Frontier model snapshot rebuild |
| `npm run update:github-trending` | GitHub Trending Pulse snapshot refresh |
| `npm run update:spacex` | SpaceX data snapshot refresh |
| `npm run update:spacex-data` | Alias of `npm run update:spacex` |
| `npm run update:spacex-images` | SpaceX image cache and manifest refresh |
| `npm run update:investments` | Python fetch plus TypeScript snapshot build |
| `npm run update:fantasy` | Fantasy position data plus published snapshot JSON |
| `npm run generate:icons` | PWA icon generation |

---

## Scheduled Automations

The repo also contains scheduled GitHub Actions and a Netlify cache purge function:

- `.github/workflows/update-fantasy.yml`
- `.github/workflows/update-investments.yml`
- `.github/workflows/update-premier-league.yml`
- `.github/workflows/update-la-liga.yml`
- `.github/workflows/update-github-trending.yml`
- `.github/workflows/update-formula-1.yml`
- `.github/workflows/update-spacex.yml`
- `.github/workflows/update-mlb.yml`
- `.github/workflows/update-nba.yml`
- `.github/workflows/update-nfl.yml`
- `netlify/functions/purge-cache.ts`

The GitHub workflows refresh and commit:

- `public/data/investments/index.json`
- `public/data/investments/{SYMBOL}/snapshot.json`
- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`
- `src/data/githubTrendingSnapshot.ts`
- `src/data/formula1Snapshot.ts`
- `src/data/spacexSnapshot.generated.json`
- `src/data/spacexImageManifest.generated.json`
- `public/data/spacex/image-reference-index.json`
- `public/data/spacex/images/**`
- `src/data/mlbSnapshot.ts`
- `src/data/nbaSnapshot.ts`
- `src/data/nflSnapshot.ts`
- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/*.json`

Current schedules:

- investments: Mondays and Thursdays at `22:15 UTC`
- Premier League: daily January-May and August-December at `06:15 UTC`
- La Liga: daily January-May and August-December at `06:30 UTC`
- fantasy snapshots: Wednesdays at `17:00 UTC`
- GitHub Trending Pulse: daily at `07:45 UTC`
- Formula 1: daily at `08:10 UTC`
- SpaceX: daily at `09:25 UTC` and `21:25 UTC`
- MLB: daily April through October at `10:05 UTC`
- NBA: daily from mid-October through June at `10:20 UTC`
- NFL: Tuesdays September through February at `10:35 UTC`

`netlify/functions/purge-cache.ts` is not a snapshot refresh pipeline. It purges Netlify Durable Cache and is protected by `CRON_SECRET`.

---

## Notes

- This repo does not currently contain the older “50+ script” automation surface described in previous docs.
- Treat `scripts/` as a task-focused toolkit tied to the current fantasy, investments, sports, SpaceX, GitHub Trending, frontier model, and asset workflows.
- If you add a new script, update this file and the relevant sections in `DEVELOPMENT.md`.

---

## Related References

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/CRON_SETUP.md`
- `GETTING-STARTED.md`
- `DEVELOPMENT.md`
