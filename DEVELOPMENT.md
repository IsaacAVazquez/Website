# Development Guide

Current development setup and workflow notes.

**Last updated:** 2026-04-05

---

## Prerequisites

- Node.js 18+
- npm
- Git
- Python 3 for `npm run update:investments`

---

## Local Setup

```bash
git clone https://github.com/IsaacAVazquez/Website.git
cd Website
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

---

## Main Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
npm run update:fantasy-rb
npm run update:investments
npm run update:football      # full football snapshot refresh (~16 min, both leagues)
npm run update:premier-league  # PL snapshot only
```

Additional useful scripts:

```bash
npm run test:watch
npm run test:coverage
npm run test:e2e:ui
npm run analyze
```

---

## Working Model

### Pages

Pages live under `src/app/`.

Important current routes:

- portfolio pages
- writing pages
- fantasy football routes
- investments route
- March Madness route
- search and admin

### Shared shell

- `src/app/layout.tsx` sets fonts and app chrome
- `src/components/StaticHeader.tsx` owns global nav
- `src/components/ConditionalLayout.tsx` owns wrapper + footer selection

### Content

- writing content is read from `content/blog/`
- project data is defined in `src/constants/caseStudies.ts`

### APIs

API routes live in `src/app/api/`.

Do not assume old doc paths are current. Check the actual route tree first.

---

## Frontend Conventions

- use CSS variables from `src/app/globals.css`
- use `@/components/ui/ServerIcons` for server components
- keep 44px touch targets
- respect reduced motion
- preserve established visual language unless intentionally redesigning a route

---

## Data Notes

### Investments

- portfolio state is browser-local
- quotes are refreshed via `/api/investments/quotes`
- research data comes through curated research endpoints, not a generic catch-all API

### Fantasy football

- database and ingestion logic are server-side
- there are sample data fallbacks for degraded environments

### Football dashboards (Premier League + La Liga)

Both dashboards read from committed TypeScript snapshot files — no live API calls at runtime:

- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`

Updating snapshots:

```bash
npm run update:football          # full update, both leagues, ~16 min
npm run update:premier-league    # PL only, ~8 min
npx tsx scripts/updateLaLigaSnapshot.ts  # La Liga only, ~8 min
```

After running, commit the changed snapshot files:

```bash
git add src/data/premierLeagueSnapshot.ts src/data/laLigaSnapshot.ts
git commit -m "data: refresh football snapshots"
git push
```

Netlify auto-refreshes standings-only daily via a cron-job.org build hook that triggers a rebuild. This keeps standings current without manual steps. Full team fixture data only updates on a manual `npm run update:football`.

Requires `FOOTBALL_DATA_API_TOKEN` in `.env.local` (free tier, 10 req/min limit). Without it, the dashboard still loads from the last committed snapshot.

---

## Auth And Admin

- `/admin` uses credential auth from `src/lib/auth.ts`
- env vars:
  - `NEXTAUTH_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`

There is no live `/admin/analytics` page in the current route tree.

---

## Build And Deployment Notes

- deployment target is Netlify
- `prebuild` runs `scripts/updateFootballSnapshots.ts --league-only` (standings, fixtures, scorers only — not full team snapshots)
- `next-sitemap` runs during postbuild
- `typescript.ignoreBuildErrors` is still enabled in `next.config.mjs`
- build-time tracing excludes large optional assets and packages

---

## Documentation Workflow

Before changing docs, check:

1. `AGENT.md`
2. `README.md`
3. `PAGES.md`
4. `COMPONENTS.md`
5. `docs/README.md`

Older plans and redesign docs are retained for history and should not be treated as live implementation docs without verification.
