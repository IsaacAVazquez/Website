# Scheduled Refresh Setup

Current reference for how scheduled data refreshes work across the site.

**Last updated:** 2026-07-10

---

## Overview

There are two complementary mechanisms keeping live data current:

1. **GitHub Actions workflows** — refresh per-domain snapshots on a cron, then commit the regenerated files back to `main`. Each workflow is scoped to one data surface and re-runs the matching `npm run update:*` script.
2. **Netlify build hook + cron-job.org** — a daily HTTP ping triggers a production deploy of the latest committed snapshots. Builds do not fetch or mutate data.

The retired `netlify/functions/scheduled-fantasy-update.ts` Netlify scheduled function has been deleted. All scheduled refreshes now flow through GitHub Actions or the build hook.

---

## GitHub Actions workflows

Each workflow lives in `.github/workflows/update-*.yml`. They all support `workflow_dispatch` for manual runs.

| Workflow | Cron (UTC) | What it refreshes |
| --- | --- | --- |
| `update-fantasy.yml` | `0 17 * * 3` (Wed 17:00) | Fantasy football snapshots in `public/data/fantasy/*.json` via `npm run update:fantasy`. |
| `update-investments.yml` | `15 22 * * 1,4` (Mon & Thu 22:15) | Investments index + per-symbol snapshots via `npm run update:investments`. |
| `update-premier-league.yml` | `15 6 * 1-5,8-12 *` (daily January-May and August-December 06:15) | Premier League snapshot in `src/data/premierLeagueSnapshot.ts`. |
| `update-la-liga.yml` | `30 6 * 1-5,8-12 *` (daily January-May and August-December 06:30) | La Liga snapshot in `src/data/laLigaSnapshot.ts`. |
| `update-github-trending.yml` | `45 7 * * *` (daily 07:45) | GitHub trending snapshot in `src/data/githubTrendingSnapshot.ts`. |
| `update-formula-1.yml` | `10 8 * * *` (daily 08:10) | Formula 1 snapshot in `src/data/formula1Snapshot.ts`. |
| `update-spacex.yml` | `25 9,21 * * *` (daily 09:25 and 21:25) | SpaceX data, image manifest, reference index, and cached image artifacts. |
| `update-mlb.yml` | `5 10 * 4-10 *` (daily April through October 10:05) | MLB snapshot in `src/data/mlbSnapshot.ts`. |
| `update-nba.yml` | `20 10 15-31 10 *` and `20 10 * 1-6,11-12 *` (mid-October through June 10:20) | NBA snapshot in `src/data/nbaSnapshot.ts`. |
| `update-nfl.yml` | `35 10 * 1-2,9-12 2` (Tuesdays September through February 10:35) | NFL snapshot in `src/data/nflSnapshot.ts`. |

Workflows commit regenerated snapshots back to `main` using the default `GITHUB_TOKEN`. Look for commits authored by `github-actions[bot]`.

Snapshots that do **not** have a dedicated workflow, such as the manually maintained golf snapshot, are refreshed by hand and committed normally. See `CLAUDE.md` for the full per-surface command list.

---

## Netlify build hook (daily publication)

- Build hook URL is configured in **Netlify → Site configuration → Build hooks**.
- A scheduled job on **cron-job.org** sends a `POST` to that URL daily.
- Each ping triggers a Netlify deploy of the latest committed snapshots. The build itself does not call football-data.org.
- Premier League and La Liga data refresh through their dedicated GitHub Actions workflows or explicit local update commands.
- Per-team snapshots (sidebar fixtures, form strip) refresh when a full league update runs and the resulting snapshots are committed.

This separation keeps deploys reproducible while the data workflows own freshness.

---

## Manual refreshes

When you need a snapshot to update right now, run the relevant `npm run update:*` command and commit the result:

```bash
npm run update:fantasy            # ~30s
npm run update:investments        # ~30s
npm run update:football           # ~16m, both leagues including team data
npm run update:premier-league     # ~8m, full PL refresh
npm run update:la-liga            # ~8m, full La Liga refresh
npm run update:nba                # ~1m
npm run update:nfl                # ~30s
npm run update:mlb                # ~30s
npm run update:formula-1          # ~30s
npm run update:github-trending    # ~30s
npm run update:spacex             # ~30s
```

After running, commit the regenerated `src/data/*.ts` or `public/data/**` files. The site only reads committed snapshots at build time — there is no live FantasyPros, ESPN, or football-data.org call at request time.

---

## Required environment variables

| Variable | Used by |
| --- | --- |
| `FOOTBALL_DATA_API_TOKEN` | `update:football`, `update:premier-league`, `update:la-liga` (free tier, 10 req/min). Set in `.env.local` and GitHub Actions secrets for the league workflows; Netlify builds do not need it. |
| `GITHUB_TOKEN` or `GH_TOKEN` | Optional local higher-rate-limit token for `npm run update:github-trending`; GitHub Actions provides `GITHUB_TOKEN`. |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | `/admin` auth (NextAuth v4). Not used by scheduled refresh. |

`CRON_SECRET` previously gated the retired Netlify scheduled-fantasy function and is no longer required for scheduled refresh. It may still be referenced by older docs; treat any such mention as historical.

---

## Troubleshooting

- **Workflow ran but no snapshot change committed**: the underlying API returned the same data, or the workflow has commit-on-no-change disabled. Check the workflow logs.
- **Football standings look stale**: the daily cron-job.org ping may have failed. Trigger a manual deploy from Netlify, or re-run `npm run update:football` locally.
- **Fantasy snapshot is stale**: re-run `update-fantasy.yml` via `workflow_dispatch` from the GitHub Actions tab, or run `npm run update:fantasy` locally and commit.
