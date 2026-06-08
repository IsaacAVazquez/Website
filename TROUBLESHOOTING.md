# Troubleshooting Guide

Fast diagnostics for the current site, data workflows, and deployment path.

**Last updated:** 2026-06-08

---

## Install And Build Problems

### `npm install` fails

- Confirm Node 18+ and npm 10+
- Remove `node_modules` and retry
- Native module failures usually come from `better-sqlite3`

### `npm run build` fails

- Run `npm run lint` first
- Check for App Router metadata or async `params` mistakes in page files
- Confirm route-local imports are not pulling server-only code into client components

### `npm run dev` boots but pages crash

- Check missing environment variables for admin, MBA email, or data refresh flows
- Confirm recent docs or content edits did not introduce malformed frontmatter or markdown

---

## Environment And Auth

### `/admin` does not work

Confirm:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

The admin flow uses credential auth in `src/lib/auth.ts`.

### `netlify/functions/purge-cache.ts` returns `401`

- Set `CRON_SECRET`
- Send `Authorization: Bearer <CRON_SECRET>`

There is no live `/api/scheduled-update` route in the current app tree; older references to that endpoint are historical.

---

## Data Issues

### Investments data looks stale or missing

- The curated UI reads from `public/data/investments`
- Rebuild snapshots with `npm run update:investments`
- `/api/investments/index` and `/api/investments/data/[symbol]` are compatibility routes over curated snapshot data, not a full arbitrary-ticker backend

### Search results look incomplete

That is expected today. `/api/search` is still a small hardcoded index, not a full-site crawler or content search engine.

### Fantasy football data looks inconsistent

The public fantasy surface is snapshot-backed:

- `public/data/fantasy/{ppr,half_ppr,standard}.json` contains the published scoring-format snapshots
- `src/data/fantasyPositionData.generated.ts` contains the generated TypeScript position source
- `src/data/fantasySnapshotRevision.generated.ts` controls client cache busting
- `/api/fantasy-data` reads the same public snapshot files through `src/lib/fantasySnapshotServer.ts`

Rebuild the generated artifacts with `npm run update:fantasy`. There are no live `/api/fantasy-pros-*`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, or `/api/scheduled-update` routes.

### Premier League or La Liga data looks stale

- The public dashboards read from `src/data/premierLeagueSnapshot.ts` and `src/data/laLigaSnapshot.ts`
- Rebuild both with `npm run update:football`
- Rebuild one league with `npm run update:premier-league` or `npm run update:la-liga`
- These rebuild commands need `FOOTBALL_DATA_API_TOKEN`; runtime page loads do not

---

## UI And Layout Problems

### A page is too narrow or spacing looks wrong

Check `src/components/ConditionalLayout.tsx` first. Some routes manage their own shell and should not be wrapped by the shared `max-w-4xl` container.

### Footer CTA feels duplicated

The footer is route-aware:

- compact footer on `/` and `/contact`
- full footer on most other routes

If a page ends with its own strong CTA, verify it is not stacking against the full footer.

### March Madness, football dashboards, or investments has horizontal scrolling

Recheck:

- tab button widths
- chart container overflow
- bracket region grids
- fixture/table containers
- mobile viewport behavior in Playwright

---

## Deployment Problems

### Netlify build behaves differently from local

- Compare local `npm run build` output with `netlify.toml`
- Netlify uses a custom build command that removes some heavy output from `.next/standalone`
- Make sure required env vars are present in the Netlify dashboard

### Sitemap or metadata output looks wrong

- `npm run build` triggers `next-sitemap` in `postbuild`
- check `next-sitemap.config.js`
- check `src/app/metadata.ts` and route-specific metadata exports

---

## References

- `GETTING-STARTED.md`
- `DEVELOPMENT.md`
- `API.md`
- `docs/ENVIRONMENT_CONFIGURATION.md`
- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/CRON_SETUP.md`
