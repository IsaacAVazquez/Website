# Getting Started

Quick local setup for the current Next.js site and its supporting data workflows.

**Last updated:** 2026-03-17

---

## Prerequisites

- Node.js 18+
- npm 10+
- Python 3 if you plan to run `npm run update:investments`

The base site runs without optional third-party credentials. Advanced fantasy and admin workflows need environment variables.

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
| `npm run build` | Production build plus postbuild sitemap step |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint on `src` |
| `npm test` | Run Jest |
| `npm run test:e2e` | Run Playwright |
| `npm run analyze` | Build with bundle analysis enabled |
| `npm run update:fantasy-rb` | Refresh the RB tiers source data |
| `npm run update:investments` | Fetch investment data and rebuild curated snapshots |
| `npm run generate:icons` | Regenerate PWA icons |

---

## Environment Notes

Most portfolio pages work without custom secrets.

Add the following for broader local coverage:

- `NEXT_PUBLIC_SITE_URL` and `SITE_URL` for canonical URLs and metadata
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` for `/admin`
- `CRON_SECRET` for `/api/scheduled-update`
- `FANTASYPROS_USERNAME` and `FANTASYPROS_PASSWORD` for FantasyPros session-based refreshes

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

Fantasy routes mix static assets, API fetches, and SQLite-backed helpers.

Useful references:

- `docs/FANTASY_PLATFORM_SETUP.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/CRON_SETUP.md`

---

## Where To Look Next

- `README.md` for the product and route overview
- `DEVELOPMENT.md` for coding workflows
- `API.md` for route inventory
- `TESTING.md` for unit and E2E coverage
- `TROUBLESHOOTING.md` for common failures
