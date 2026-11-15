# Scheduled Refresh Setup

Current reference for how scheduled data refreshes work across the site.

**Last updated:** 2026-11-02

---

## Overview

There are three mechanisms keeping live data current:

1. **GitHub Actions workflows** — refresh per-domain snapshots on a cron, then commit the regenerated files back to `main`. Each workflow is scoped to one data surface and re-runs the matching `npm run update:*` script.
2. `publish-data.yml` — batches publication four times a day, builds the site in GitHub Actions, and uploads it to Netlify. Builds do not fetch or mutate data.

3. **Netlify scheduled functions** write two blob-backed refreshes without a commit. `netlify/functions/refresh-frontier-models.ts` runs daily at 07:30 UTC and `netlify/functions/refresh-polling.ts` runs every six hours at minute 45.

The retired `netlify/functions/scheduled-fantasy-update.ts` Netlify scheduled function was deleted on 2026-05-03. Every other scheduled refresh flows through GitHub Actions.

---

## GitHub Actions workflows

Each workflow lives in `.github/workflows/update-*.yml`. They all support `workflow_dispatch` for manual runs. Every one of them except `update-fantasy.yml`, `update-investments.yml`, `update-spacex.yml`, and `update-article-images.yml` is a short caller of the reusable `.github/workflows/refresh-snapshot.yml`, so a change to the shared steps is made once there.

This file does not keep its own cron table, since a copy would drift from the workflows. The exact cron expression for each workflow is in its own file under `.github/workflows/`. The cadence, artifact, and upstream source for each surface are in the master table in `DATA_UPDATE_OPERATIONS.md`.

Workflows commit regenerated snapshots back to `main` using the default `GITHUB_TOKEN`. Look for commits authored by `github-actions[bot]`.

Every lane except `update-article-images.yml` checks the snapshot it built with `scripts/verifyDataRefresh.ts`, a step the Formula 1 lane skips only when OpenF1 is locked for a live session and the builder kept the committed snapshot, and the fantasy, investments, and SpaceX workflows add quality checks of their own. A failed run opens a GitHub issue labeled for its lane, such as `nba-refresh-failure`, or comments on the one already open, and the next successful run closes it. `update-article-images.yml` opens no issue, and it commits the covers that did arrive before it fails the run over a planned cover that did not.

Golf has its own workflow, `update-golf.yml`. The surfaces with no scheduled refresh are the full `update:football` run and the curated datasets listed as manual in `DATA_UPDATE_OPERATIONS.md`, which are refreshed by hand and committed normally, plus the World Cup. `update-world-cup.yml` has had no `schedule` block since 2026-09-28 (the 2026 final was July 19), so it runs only on manual dispatch, and its window job skips the refresh outside the tournament dates in the committed snapshot. The weekly `audit-curated-data.yml` run checks the hand-maintained datasets for review age and structure without refreshing them, and it keeps one `curated-data-review` issue open with its latest report until they pass.

---

## Publication (`publish-data.yml`)

- Runs at 01:15, 07:15, 13:15, and 19:15 UTC, on every push to `main` that is not marked `[skip ci]`, and on `workflow_dispatch`. Refresh commits carry `[skip ci]`, so they accumulate until the next scheduled run rather than each triggering a deploy.
- It builds and uploads the site in one `netlify deploy --prod --context production` inside GitHub Actions. The build itself does not call football-data.org.
- The build runs in Actions rather than on Netlify because the account is on the free tier with 300 build minutes a month. It ran out on 2026-08-06 with the limit enforced, every git-triggered build after that returned "Skipped due to account builds usage exceeded", and committed data stopped reaching production for close to two weeks. A build that never runs on Netlify's infrastructure does not consume build minutes, and Actions minutes are free on a public repository.
- `scripts/ci/netlify-ignore.sh` is wired in as the `ignore` command in `netlify.toml`. It cancels Netlify's own builds of `main`, which would otherwise duplicate every deploy, and of dependabot branches, whose previews are what exhausted the quota. Human pull requests still get a deploy preview.
- Publication needs the `NETLIFY_AUTH_TOKEN` repository secret. The site ID is set in the workflow and is an identifier rather than a credential.
- The deploy is tried up to three times. After it, the workflow polls `/api/data-revisions` on the Netlify origin, `isaacvazquez.netlify.app` unless the optional `PRODUCTION_DATA_REVISION_URL` secret names another address, until production reports the committed data revision or a deploy built from that commit or a later one. It then asks the Netlify API whether the deploy stored its static assets. A failed step opens or updates a `data-publication-failure` issue, and the next successful run closes it.
- The older lane pinged a Netlify build hook from cron-job.org, and publication no longer depends on it. The one workflow that still reads the `NETLIFY_BUILD_HOOK` secret is `update-article-images.yml`, which pings the hook after it commits new covers and skips that step when the secret is unset. The cron-job.org job and the secret can be retired once the Actions lane has run cleanly.
- Premier League and La Liga data refresh through their dedicated GitHub Actions workflows or explicit local update commands.
- Per-team snapshots (sidebar fixtures, form strip) refresh when a full league update runs and the resulting snapshots are committed.

This separation keeps deploys reproducible while the data workflows own freshness.

---

## Manual refreshes

When you need a snapshot to update right now, run the relevant `npm run update:*` command and commit the result:

```bash
npm run update:fantasy            # ~30s
npm run update:investments        # needs .venv; no overall time cap unless GLOBAL_BUDGET_SECONDS is set (CI sets 1320, 22 minutes)
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

The full set is the `update:*` scripts in `package.json`. After running one, commit the regenerated files under `src/data/` or `public/data/`, or, for `update:article-images`, the covers in `public/images/writing/covers/` and the frontmatter it writes in `content/blog/`. The deployed site reads the committed snapshots, and the only snapshot routes that fetch upstream at request time are the earthquake summary and the two Bay Area transit routes, plus the SpaceX summary and launch list when the committed SpaceX snapshot lacks the data they serve, so there is no FantasyPros, ESPN, or football-data.org call at request time.

---

## Required environment variables

| Variable | Used by |
| --- | --- |
| `FOOTBALL_DATA_API_TOKEN` | `update:football`, `update:premier-league`, `update:la-liga` (free tier, 10 req/min). Set in `.env.local` and GitHub Actions secrets for the league workflows; Netlify builds do not need it. |
| `GITHUB_TOKEN` or `GH_TOKEN` | Optional local higher-rate-limit token for `npm run update:github-trending`; GitHub Actions provides `GITHUB_TOKEN`. |
| `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY` | `update:score-pools`. `update-score-pools.yml` skips the refresh with a notice until both repository secrets are set, and the page shows sample data until then. |
| `SPACEDEVS_API_TOKEN` | Optional Launch Library 2 token for `update:spacex` and `update:spacex-images`. The anonymous tier is heavily throttled, so `update-spacex.yml` passes the repository secret to both steps. |
| `BART_API_KEY` | Optional personal BART key for `update:bay-area-transit` and the request-time transit routes. Without it the code uses BART's published demo key. |

`CRON_SECRET` is no longer read anywhere. It authorized the retired scheduled-fantasy function's calls to `/api/scheduled-update` until 2026-04-15 and gated the cache purge function, `netlify/functions/purge-cache.ts`, until that function was deleted on 2026-09-28. `netlify.toml` still lists it under `SECRETS_SCAN_OMIT_KEYS`. Treat any other mention of it as historical.

---

## Troubleshooting

- **Workflow ran but no snapshot change committed**: the regenerated snapshot matched the committed one, so `scripts/ci/commit-and-push-snapshot.sh` logged `No snapshot changes detected` and committed nothing. Check the workflow logs.
- **Football standings look stale**: check the latest `update-premier-league.yml` or `update-la-liga.yml` run and the next `publish-data.yml` run, or re-run `npm run update:football` locally and commit.
- **Fantasy snapshot is stale**: re-run `update-fantasy.yml` via `workflow_dispatch` from the GitHub Actions tab, or run `npm run update:fantasy` locally and commit.
