# Environment Configuration Guide

Current environment variable reference for local development and Netlify deployment.

**Last updated:** 2026-11-25

---

## Core Site Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SITE_URL` | recommended | Site origin read by `/api/rss`, `scripts/generatePublicSitemap.mjs`, and `src/lib/investmentsAssetOrigin.ts`, and by `src/lib/seo.ts` when `NEXT_PUBLIC_SITE_URL` is unset. Every reader falls back to `https://isaacvazquez.com` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Site origin that `src/lib/seo.ts` reads first for page metadata and its absolute URLs, and the last environment origin `src/lib/investmentsAssetOrigin.ts` tries |
| `NODE_ENV` | platform-managed | Runtime environment |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Google Analytics measurement ID. The analytics components render nothing without it, and `src/proxy.ts` only allow-lists the analytics domains in the CSP when it is a valid `G-` ID |
| `GOOGLE_SITE_VERIFICATION` | optional | Search Console verification value that `src/lib/seo.ts` passes into page metadata |

Use the production hostname for both site URL variables.

---

## Admin And Auth

There is no authenticated surface. The `/admin` page and NextAuth were removed on 2026-10-02.

---

## Fantasy Operations

The fantasy surface reads checked-in snapshots at runtime. `npm run update:fantasy` regenerates those artifacts from public pages and feeds, led by the FantasyPros consensus pages, and none of them needs a credential. A FantasyPros consensus board that fails its response or board checks stops the redraft refresh, while the ADP, VORP, and game log overlays keep their previous data and never stop it.

The only fantasy-specific variable is `FANTASY_WEEKLY_ALLOW_PRESEASON`, listed under Sports Data below.

The scheduled refresh reads the public FantasyPros rankings pages. The deployed application needs no FantasyPros variable because it serves the generated JSON files.

There are no live `/api/fantasy-pros-*`, `/api/data-manager`, or `/api/scheduled-update` routes in the current app tree.

---

## Operations

| Variable | Required | Purpose |
| --- | --- | --- |
| `DEPLOYMENT_COMMIT` | set by `publish-data.yml` at build time | The commit the build came from, which `next.config.mjs` inlines and `/api/data-revisions` reports as `deploymentCommit`. The route also checks `COMMIT_REF` and `GITHUB_SHA`, which exist while the site builds and not while it serves |

`CRON_SECRET` is no longer read anywhere. It protected the cache purge function, which was deleted on 2026-09-28. `netlify.toml` still names it in `SECRETS_SCAN_OMIT_KEYS` and in a commented example line.

---

## Newsletter

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_CONTACTS_API_KEY` | yes for `/api/newsletter/subscribe`, unless `RESEND_API_KEY` is set | Contact-management key the route reads first. With neither key set, the route logs an error and answers 503 |
| `RESEND_API_KEY` | fallback for `/api/newsletter/subscribe` | Used to create newsletter contacts when `RESEND_CONTACTS_API_KEY` is unset |
| `RESEND_NEWSLETTER_SEGMENT_ID` | recommended for `/api/newsletter/subscribe` | Resend segment that receives public newsletter signups; when omitted, signups are created as unsegmented contacts |

---

## Sports Data

| Variable | Required | Purpose |
| --- | --- | --- |
| `FOOTBALL_DATA_API_TOKEN` | optional for local dev, optional for runtime, required for `npm run update:football`, `npm run update:premier-league`, and `npm run update:la-liga` | Token used only when rebuilding the checked-in Premier League and La Liga snapshots — not needed at runtime since both dashboards serve from committed snapshot files |

Without this token, the Premier League and La Liga routes still work from the checked-in snapshots. You only need it when you want to refresh those snapshots locally or in GitHub Actions.

| Variable | Required | Purpose |
| --- | --- | --- |
| `BART_API_KEY` | optional | BART API key read by `src/lib/bayAreaTransitData.ts` at request time and by the transit refresh workflow; falls back to BART's published demo key |
| `SPACEDEVS_API_TOKEN` | optional | Launch Library 2 token sent as `Authorization: Token <key>` by `src/lib/spacexData.ts` and the two SpaceX snapshot builders, because the anonymous tier is throttled |
| `THE_ODDS_API_KEY` | needed for live score pools data | The Odds API key read by `scripts/buildScorePoolsSnapshot.ts`. While either key is missing, the scheduled workflow skips the refresh and passes with a notice, and the page says no live odds feed is connected |
| `API_FOOTBALL_KEY` | needed for live score pools data | API-Football key read by `scripts/buildScorePoolsSnapshot.ts` |
| `GITHUB_TOKEN` or `GH_TOKEN` | optional | Token `scripts/buildGitHubTrendingSnapshot.ts` uses for the GitHub Search API; GitHub Actions provides `GITHUB_TOKEN` |
| `FANTASY_WEEKLY_ALLOW_PRESEASON` | optional, local validation only | Set to `1` to let `scripts/buildFantasyWeeklySnapshot.ts` build a board before Week 1; the script says not to commit the result |

---

## Investments And Jobs

| Variable | Required | Purpose |
| --- | --- | --- |
| `FINNHUB_API_KEY` | yes for live quotes | Sent as the `X-Finnhub-Token` header by `src/lib/finnhub.ts`, which backs `/api/investments/quotes` |
| `ADZUNA_APP_ID` | optional | Adzuna app ID; `src/lib/mbaJobsServer.ts` skips external job leads unless this and `ADZUNA_APP_KEY` are set |
| `ADZUNA_APP_KEY` | optional | Adzuna app key, paired with `ADZUNA_APP_ID` |
| `ADZUNA_COUNTRY` | optional | Adzuna country code, default `us` |
| `MAX_PRICE_AGE_DAYS` | optional | Oldest price date, in days, that `scripts/fetch_investments_data.py` accepts and `scripts/buildInvestmentsSnapshots.ts` still counts as fresh, default `7` |
| `PER_SYMBOL_TIMEOUT_SECONDS` | optional | Watchdog on each symbol's fetch in `scripts/fetch_investments_data.py`, default `180` |
| `RETRY_FAILED_SYMBOL_TIMEOUT_SECONDS` | optional | Shorter watchdog for a symbol that already failed, default `60` |
| `MAX_LONG_TIMEOUTS_PER_RUN` | optional | After this many long timeouts, the rest of the run uses the retry watchdog, default `2` |
| `GLOBAL_BUDGET_SECONDS` | optional | Soft time budget after which the fetcher starts no new symbols and records the rest as failed. Unset means no budget |

`.github/workflows/update-investments.yml` sets the five investments refresh settings above for `npm run update:investments`, with a 1320-second budget.

---

## Publication And CI

| Variable | Required | Purpose |
| --- | --- | --- |
| `NETLIFY_AUTH_TOKEN` | yes for `publish-data.yml` | Repository secret used by the Actions deploy and by `scripts/ci/verify-deploy-assets.mjs` |
| `NETLIFY_SITE_ID` | set in the workflow | Site identifier that `netlify deploy` uses to pick the site, since the command passes no `--site` flag, and that `scripts/ci/verify-deploy-assets.mjs` reads; `publish-data.yml` sets it inline for the whole job |
| `EXPECTED_COMMIT` | set in the workflow | Commit that `scripts/ci/verify-deploy-assets.mjs` expects in the published deploy's message. The check skips that comparison when it is unset |
| `DATA_LEDGER_POLL_ATTEMPTS`, `DATA_LEDGER_POLL_INTERVAL_MS`, `DATA_LEDGER_REQUEST_TIMEOUT_MS` | optional | Polling limits for `scripts/ci/ensure-production-data-ledger.mjs`, default `60` attempts `10000` ms apart, with a `20000` ms timeout on each request |
| `ANALYZE` | optional | `true` adds `webpack-bundle-analyzer` to a production build. `npm run analyze` and `npm run build:analyze` set it |
| `PRODUCTION_DATA_REVISION_URL` | optional | Repository secret that overrides where `publish-data.yml` reads the ledger. The default is the Netlify origin, `https://isaacvazquez.netlify.app/api/data-revisions`, because Cloudflare challenges runner traffic on the custom domain |
| `SNAPSHOT_PUSH_ATTEMPTS` | optional | Overrides the default 8 push attempts in `scripts/ci/commit-and-push-snapshot.sh` |
| `INDEXNOW_ENDPOINT` | optional | Overrides the default IndexNow endpoint in `scripts/submitIndexNow.mjs` |
| `E2E_PORT`, `E2E_BASE_URL`, `E2E_FULL_MATRIX`, `PLAYWRIGHT_OUTPUT_DIR` | optional | Playwright settings read in `playwright.config.ts` (port, base URL, the full browser matrix when set to `1`, and the output directory) |

---

## Platform-Provided Variables

The code also reads these when available:

- `URL`
- `DEPLOY_URL`
- `DEPLOY_PRIME_URL`
- `NETLIFY_BLOBS_CONTEXT`, which the Netlify functions runtime and `netlify dev` set. Without it, `src/lib/netlifyBlobs.ts` skips Blobs reads and `writeSnapshotBlob` throws
- `BRANCH`, which Netlify sets for its own builds and `scripts/ci/netlify-ignore.sh` reads to cancel the builds of `main` and `dependabot/*` branches

These usually come from the hosting platform and do not need to be set manually for normal local development. The only code that reads the first three is `src/lib/investmentsAssetOrigin.ts`, which tries `URL`, `DEPLOY_PRIME_URL`, and `DEPLOY_URL` in that order before `SITE_URL`.

---

## Local Development

Useful local template for broader coverage:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

Add `RESEND_CONTACTS_API_KEY`, or the `RESEND_API_KEY` fallback, only if you are testing newsletter signup. Add `FOOTBALL_DATA_API_TOKEN` only if you are testing `npm run update:football`, `npm run update:premier-league`, or `npm run update:la-liga`.

Five update scripts read `.env.local` through `tsx --env-file-if-exists`, namely `update:premier-league`, `update:la-liga`, `update:nba`, `update:spacex`, and `update:spacex-images`, and `update:football` does too because it runs the first two. The other update scripts read only the shell environment, so a key for `update:score-pools`, `update:github-trending`, or `update:bay-area-transit` has to be exported in the shell that runs it.

`npm run dev` runs `scripts/dev.cjs`, which starts `next dev --webpack` on `localhost` and sets `JOB_SEARCH_PRIVATE_SYNC` and `NEXT_PUBLIC_JOB_SEARCH_PRIVATE_SYNC` to `1`. Those flags let `/api/job-search` and the job search dashboard sync with local files. Passing `--hostname`, or starting the command with `JOB_SEARCH_PRIVATE_SYNC=0` as `playwright.config.ts` does, turns both off.

---

## Netlify

Set runtime production values in the Netlify dashboard. Keep them aligned with:

- `netlify.toml`
- the active custom domain
- the build and cron workflows

GitHub Actions has a separate secret store for snapshot refresh jobs and for `NETLIFY_AUTH_TOKEN`. If a data refresh or the production deploy fails, check the repository's Actions secrets and workflow logs. If newsletter signup, live quotes, or another runtime key breaks only in production, check the deployed Netlify variables.

Production builds run in GitHub Actions through `netlify deploy`, and the comments in `publish-data.yml` say that this picks up the site's Netlify variables, including `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Build-time values therefore also belong in the Netlify dashboard.

---

## Related References

- `DEPLOYMENT.md`
- `docs/SECURITY.md`
- `docs/EMAIL_DELIVERY.md`
- `docs/CRON_SETUP.md`
- `TROUBLESHOOTING.md`
