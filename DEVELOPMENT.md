# Development Guide

Current development setup and workflow notes.

**Last updated:** 2026-06-19

---

## Prerequisites

- Node.js 20 preferred to match GitHub Actions
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
npm run update:fantasy
npm run update:investments
npm run update:football      # full football snapshot refresh (~16 min, both leagues)
npm run update:premier-league  # PL snapshot only
npm run update:la-liga       # La Liga snapshot only
npm run update:mlb
npm run update:nba
npm run update:nfl
npm run update:formula-1
npm run update:golf
npm run update:earthquake
npm run update:world-cup
npm run update:bay-area-transit
npm run update:frontier-models
npm run update:github-trending
npm run update:tech-startups
npm run update:spacex
npm run update:spacex-images
```

Additional useful scripts:

```bash
npm run test:watch
npm run test:coverage
npm run test:e2e:ui
npm run analyze
npm run build:analyze
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
- Premier League, La Liga, MLB, NBA, NFL, golf, Formula 1, and Fantasy Formula 1 dashboards
- standalone routes for AI tools, frontier models, News Pulse, SpaceX Mission Control, Polling Aggregator, personal logs, and fintech tools
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

- use CSS variables from `src/app/globals.css`, preferably the current `--home-*` editorial tokens for new work
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
- raw provider responses under `data/investments-raw/` are a transient builder workspace, gitignored for new files though existing historical files remain tracked until the repository cleanup migration; the refresh workflow commits only compact snapshots under `public/data/investments/`, so raw files stay out of automated commits

### Fantasy football

- public rankings read generated snapshots in `public/data/fantasy/`
- `npm run update:fantasy` regenerates both TypeScript position data and published JSON snapshots
- `/api/fantasy-data` is a server-side fallback over the same snapshot files

### Football dashboards (Premier League + La Liga)

Both dashboards read from committed TypeScript snapshot files — no live API calls at runtime:

- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`

Updating snapshots:

```bash
npm run update:football          # full update, both leagues, ~16 min
npm run update:premier-league    # PL only, ~8 min
npm run update:la-liga           # La Liga only, ~8 min
```

After running, commit the changed snapshot files:

```bash
git add src/data/premierLeagueSnapshot.ts src/data/laLigaSnapshot.ts
git commit -m "data: refresh football snapshots"
git push
```

The checked-in GitHub Actions workflows refresh Premier League and La Liga snapshots daily and commit changes when the data moves. Production builds consume those committed snapshots and do not call football-data.org. Full local team fixture/form refreshes still use `npm run update:football`.

Requires `FOOTBALL_DATA_API_TOKEN` in `.env.local` (free tier, 10 req/min limit). Without it, the dashboard still loads from the last committed snapshot.

### US sports dashboards

MLB, NBA, and NFL also read from committed TypeScript snapshot files:

```bash
npm run update:mlb
npm run update:nba
npm run update:nfl
```

These commands use public data sources and do not require auth tokens. Golf, Formula 1, the World Cup, Earthquake Pulse, and Bay Area Transit follow the same pattern with their own update scripts (`npm run update:golf`, `npm run update:formula-1`, `npm run update:world-cup`, `npm run update:earthquake`, `npm run update:bay-area-transit`), each against a public source with no auth token.

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
- builds consume committed snapshots and do not mutate data or call external providers
- `next-sitemap` runs during postbuild
- `npm run typecheck` is enforced before the production build in CI
- build-time tracing excludes large optional assets and packages
- the snapshot-refresh GitHub Actions workflows (all `.github/workflows/update-*.yml`) commit and push their refreshed snapshots through the shared `scripts/ci/commit-and-push-snapshot.sh` helper, which sets the `github-actions[bot]` identity, no-ops cleanly when nothing changed, and retries the push with rebase + backoff so concurrent snapshot bots do not collide on `main`

---

## Documentation Workflow

Before changing docs, check:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `README.md`
4. `PAGES.md`
5. `COMPONENTS.md`
6. `docs/README.md`

Older plans and redesign docs are retained for history and should not be treated as live implementation docs without verification.
