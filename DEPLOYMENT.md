# Deployment Guide

Current deployment reference for the live site.

**Last updated:** 2026-04-10

---

## Production Target

The site is deployed on Netlify with the Next.js plugin enabled.

Key config lives in:

- `netlify.toml`
- `next-sitemap.config.js`
- `src/app/metadata.ts`

---

## Build Pipeline

`netlify.toml` currently uses:

```toml
[build]
  command = "npm run build && rm -rf .next/standalone/*/public/data node_modules/@img node_modules/sharp"
  publish = ".next"
```

Notes:

- `prebuild` runs `scripts/updateFootballSnapshots.ts --league-only` before the main Next build
- `npm run build` runs `next build --webpack`
- `postbuild` runs `next-sitemap` and `scripts/patch-nft-sharp.mjs`
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
npm run update:fantasy-rb
```

If your change touches football dashboard snapshots, verify the relevant command:

```bash
npm run update:football
npm run update:premier-league
npm run update:la-liga
```

---

## Required Environment Variables

Core production variables:

- `SITE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Operational variables:

- `CRON_SECRET`
- `FANTASYPROS_USERNAME`
- `FANTASYPROS_PASSWORD`
- `FANTASYPROS_API_KEY`
- `FOOTBALL_DATA_API_TOKEN`

Platform-provided variables like `URL`, `DEPLOY_URL`, `DEPLOY_PRIME_URL`, and `VERCEL_URL` are consumed when available and do not need to be set manually unless you are reproducing a deploy context.

See `docs/ENVIRONMENT_CONFIGURATION.md` for details.

---

## Data And Asset Notes

### Investments

- The public investments UI depends on curated snapshot files in `public/data/investments`
- Commit generated snapshot changes when the curated research dataset changes

### Fantasy football

- Some routes use checked-in assets, some use runtime APIs, and some use SQLite-backed helpers
- Validate the exact workflow you changed before deploying seasonal data updates

### Football dashboards

- `/premier-league` and `/la-liga` read committed TypeScript snapshots at runtime
- `FOOTBALL_DATA_API_TOKEN` is needed only when rebuilding those snapshots
- Daily GitHub Actions refreshes can commit `src/data/premierLeagueSnapshot.ts` and `src/data/laLigaSnapshot.ts` when data changes

### Static caching

`netlify.toml` defines long-lived cache headers for Next.js static assets and dedicated cache behavior for `public/data/investments/**`.

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
- `/admin`

Also verify:

- canonical metadata
- sitemap generation
- theme toggle
- mobile nav
- no horizontal overflow on the custom self-shell routes

---

## Related Docs

- `README.md`
- `GETTING-STARTED.md`
- `TROUBLESHOOTING.md`
- `docs/SECURITY.md`
- `docs/ENVIRONMENT_CONFIGURATION.md`
