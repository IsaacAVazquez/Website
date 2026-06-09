# Getting Started

Quick local setup for the current Next.js site and its supporting data workflows.

**Last updated:** 2026-06-08

---

## Prerequisites

- Node.js 20 preferred to match GitHub Actions
- npm 10+
- Python 3 if you plan to run `npm run update:investments`

The base site and public fantasy snapshots run without optional third-party credentials. Admin auth, email delivery, investments refreshes, and football-data refreshes need additional setup.

---

## Local Setup

```bash
npm install
cp .env.example .env.local  # if present
npm run dev
```

Open `http://localhost:3000`.

---

## Core Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Production build plus the football prebuild fast path and postbuild sitemap step |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint on `src` |
| `npm test` | Run Jest |
| `npm run test:e2e` | Run Playwright |
| `npm run analyze` | Build with bundle analysis enabled |
| `npm run update:fantasy` | Refresh generated fantasy data and published snapshot JSON |
| `npm run update:investments` | Fetch investment data and rebuild curated snapshots |
| `npm run update:football` | Refresh both Premier League and La Liga snapshots |
| `npm run update:premier-league` | Refresh the Premier League snapshot |
| `npm run update:la-liga` | Refresh the La Liga snapshot |
| `npm run update:mlb` | Refresh the MLB snapshot |
| `npm run update:nba` | Refresh the NBA snapshot |
| `npm run update:nfl` | Refresh the NFL snapshot |
| `npm run update:formula-1` | Refresh the Formula 1 snapshot |
| `npm run update:frontier-models` | Rebuild the frontier model snapshot |
| `npm run update:github-trending` | Refresh the GitHub Trending Pulse snapshot |
| `npm run update:spacex` | Refresh the SpaceX data snapshot |
| `npm run update:spacex-images` | Refresh SpaceX image snapshots and cached image references |
| `npm run generate:icons` | Regenerate PWA icons |

---

## Environment Notes

Most portfolio pages work without custom secrets.

Add the following for broader local coverage:

- `NEXT_PUBLIC_SITE_URL` and `SITE_URL` for canonical URLs and metadata
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` for `/admin`
- `CRON_SECRET` only if testing `netlify/functions/purge-cache.ts`
- `RESEND_API_KEY` and `MBA_DIGEST_ALLOWED_RECIPIENTS` only if testing `/api/mba-jobs/email`
- `FOOTBALL_DATA_API_TOKEN` for football snapshot refreshes

See `docs/ENVIRONMENT_CONFIGURATION.md` for the full matrix.

---

## Data Workflows

### Investments

The public investments experience is built from curated snapshot files in `public/data/investments`.

To rebuild them:

```bash
npm run update:investments
```

That script chain expects:

- Python available at `.venv/bin/python3`
- working outbound network access
- the snapshot builder in `scripts/buildInvestmentsSnapshots.ts`

### Fantasy football

Fantasy routes read generated static snapshots.

To rebuild the currently published static fantasy snapshots:

```bash
npm run update:fantasy
```

This regenerates `src/data/fantasyPositionData.generated.ts`, `src/data/fantasySnapshotRevision.generated.ts`, and `public/data/fantasy/{ppr,half_ppr,standard}.json`.

### Football dashboards

Premier League and La Liga run from committed TypeScript snapshots:

```bash
npm run update:football
npm run update:premier-league
npm run update:la-liga
```

These commands need `FOOTBALL_DATA_API_TOKEN`; normal page loads do not.

Useful references:

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/CRON_SETUP.md`

---

## Where To Look Next

- `README.md` for the product and route overview
- `DEVELOPMENT.md` for coding workflows
- `API.md` for route inventory
- `TESTING.md` for unit and E2E coverage
- `TROUBLESHOOTING.md` for common failures
