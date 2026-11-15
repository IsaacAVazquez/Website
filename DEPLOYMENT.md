# Deployment Guide

Current deployment reference for the live site.

**Last updated:** 2026-11-02

---

## Production Target

The site is deployed on Netlify with the Next.js plugin enabled.

Key config lives in:

- `netlify.toml`
- `.github/workflows/publish-data.yml`
- `scripts/ci/netlify-ignore.sh`
- `next.config.mjs`
- `src/proxy.ts`
- `src/lib/sitemap.js`
- `src/lib/seo.ts`
- `src/app/metadata.ts`

---

## Build Pipeline

`netlify.toml` currently uses:

```toml
[build]
  command = "npm run build && rm -rf .next/standalone/*/public/data node_modules/@img node_modules/sharp"
  publish = ".next"
  ignore = "sh scripts/ci/netlify-ignore.sh"
```

Notes:

- production is not built on Netlify. `.github/workflows/publish-data.yml` runs on pushes to `main`, on a six-hourly schedule (01:15, 07:15, 13:15, and 19:15 UTC), and on manual dispatch, builds the site in GitHub Actions, and uploads it with `netlify deploy --prod --context production` from `netlify-cli@26.1.0`, trying up to three times. It needs the `NETLIFY_AUTH_TOKEN` repository secret
- the build and the upload stay one `netlify deploy` command, which builds by default on the runner with the Node version in `.nvmrc` (22). A separate `netlify build` followed by `netlify deploy --no-build` uploads the raw Next.js output instead, because `@netlify/plugin-nextjs` swaps its static output back out at the end of a standalone build, and every `/_next/static` URL then returns 404. That shipped on 2026-08-20 and served an unstyled site
- snapshot refresh commits carry `[skip ci]`, so they do not trigger that push event and wait for the next scheduled run, up to six hours later. Run the workflow by hand to publish sooner
- after the upload, the workflow polls `/api/data-revisions` on the Netlify origin (`https://isaacvazquez.netlify.app`, unless the `PRODUCTION_DATA_REVISION_URL` secret overrides it) until production reports the expected data revision or commit (`scripts/ci/ensure-production-data-ledger.mjs`), then asks Netlify's API whether the published deploy stored its static assets (`scripts/ci/verify-deploy-assets.mjs`). A failed run opens or comments on a `data-publication-failure` issue, and the next successful run closes it
- `scripts/ci/netlify-ignore.sh` cancels Netlify's own git-triggered builds for `main` and `dependabot/*` branches, so only other pull request branches still get a Netlify deploy preview
- there is no `prebuild` script, and the build consumes committed snapshots without refreshing data
- `npm run build` runs `next build --webpack`
- `postbuild` runs `scripts/generatePublicSitemap.mjs`, `scripts/buildLlmsFull.mjs` (which writes `public/llms-full.txt`), and `scripts/patch-nft-sharp.mjs`
- Netlify then serves the `.next` output through `@netlify/plugin-nextjs`

---

## Pre-Deploy Checklist

Run locally before pushing:

```bash
npm run lint
npm test
npx playwright test
npm run build
```

If your change touches curated investments data, also verify:

```bash
npm run update:investments
```

If your change touches published fantasy snapshots, verify:

```bash
npm run update:fantasy
```

If your change touches football dashboard snapshots, verify the relevant command:

```bash
npm run update:football
npm run update:premier-league
npm run update:la-liga
```

---

## Required Environment Variables

The production deploy needs one repository secret:

- `NETLIFY_AUTH_TOKEN`

Core production variables:

- `SITE_URL`
- `NEXT_PUBLIC_SITE_URL`

Every reader of those two falls back to `https://isaacvazquez.com` when they are unset. `NEXT_PUBLIC_GA_MEASUREMENT_ID` belongs in Netlify's site environment, which `netlify deploy` reads while it builds, and without it Google Analytics does not load.

Runtime keys the deployed functions read:

- `FINNHUB_API_KEY` for live quotes on `/api/investments/quotes`
- `RESEND_CONTACTS_API_KEY`, or `RESEND_API_KEY` as its fallback, for `/api/newsletter/subscribe`

Optional runtime keys:

- `BART_API_KEY`, which the transit routes use in place of BART's published demo key
- `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`, which turn on external job leads in `src/lib/mbaJobsServer.ts`
- `RESEND_NEWSLETTER_SEGMENT_ID`, the Resend segment that newsletter signups join

Operational variables, kept as GitHub Actions secrets for the snapshot refresh workflows:

- `FOOTBALL_DATA_API_TOKEN`
- `THE_ODDS_API_KEY` and `API_FOOTBALL_KEY`, without which the score pools refresh skips itself
- `SPACEDEVS_API_TOKEN` and `BART_API_KEY`, which are optional

The fantasy snapshot builder reads the public FantasyPros rankings pages and needs no credential. The deployed runtime does not fetch from FantasyPros.

Platform-provided variables like `URL`, `DEPLOY_URL`, and `DEPLOY_PRIME_URL` are consumed when available and do not need to be set manually unless you are reproducing a deploy context.

See `docs/ENVIRONMENT_CONFIGURATION.md` for details.

---

## Data And Asset Notes

### Investments

- The public investments UI depends on curated snapshot files in `public/data/investments`
- Commit generated snapshot changes when the curated research dataset changes
- `.github/workflows/update-investments.yml` runs `npm run update:investments` Tuesday through Saturday at 08:30 UTC and commits the refreshed `public/data/investments` files

### Fantasy football

- The fantasy routes read checked-in JSON snapshots at runtime
- `.github/workflows/update-fantasy.yml` runs the three lanes behind `npm run update:fantasy` as separate steps (`update:fantasy:weekly`, `update:fantasy:redraft`, and `update:fantasy:best-ball`) and commits each lane's refreshed artifacts on its own
- The GitHub workflow and local builder runs both use the public page parser

### Football dashboards

- `/premier-league` and `/la-liga` read committed JSON snapshots at runtime, through the typed wrappers `src/data/premierLeagueSnapshot.ts` and `src/data/laLigaSnapshot.ts`
- `FOOTBALL_DATA_API_TOKEN` is needed only when rebuilding those snapshots
- GitHub Actions refreshes, every four hours from August through May, can commit `src/data/premierLeagueSnapshot.json` and `src/data/laLigaSnapshot.json` when data changes

### Scheduled functions

`netlify.toml` points Netlify at `netlify/functions/`, which holds two scheduled functions. `refresh-polling.ts` runs every six hours at minute 45 and `refresh-frontier-models.ts` runs daily at 07:30 UTC, and each writes a refreshed snapshot to the `dashboard-snapshots` Netlify Blobs store, which `/polling-aggregator` and `/frontier-models` read before their committed seeds. The same `[functions]` block packages `public/data/investments/**` with the server functions through `included_files`.

### Static caching

`netlify.toml` gives the hashed `/_next/static/` assets a one-year immutable cache, and it gives the snapshot files under `/data/investments/**` and `/data/fantasy/**` an hour in the browser and a day at Netlify's CDN, each with a stale-while-revalidate window.

A page that renders on every request is cached at Netlify's CDN only when it is listed in `cdnCachedPages` in `next.config.mjs`, which sends it `Netlify-CDN-Cache-Control: public, durable, s-maxage=21600, stale-while-revalidate=86400` and `Netlify-Vary: query`. A route belongs there only when its server render reads no clock, random number, live data, or Netlify Blobs, and `src/lib/__tests__/edge-cache-policy.test.ts` checks the list.

---

## Post-Deploy Validation

Spot-check:

- `/`
- `/portfolio`
- `/investments`
- `/premier-league`
- `/la-liga`
- `/march-madness-2026`
- `/news-pulse`
- `/spacex-mission-control`
- `/polling-aggregator`
- `/fintech-tools/budget-planner`
- one `/writing/[slug]` page
- one fantasy route
- `/search`

Also verify:

- canonical metadata
- sitemap generation
- theme toggle
- the header navigation at phone width, where its links wrap onto extra rows, since the header has no separate mobile menu
- no horizontal overflow from phone to big-monitor widths, which `node scripts/layoutSweep.mjs <baseUrl>` checks on every public route

---

## Related Docs

- `README.md`
- `DEVELOPMENT.md`
- `TROUBLESHOOTING.md`
- `docs/SECURITY.md`
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/DATA_UPDATE_OPERATIONS.md`
