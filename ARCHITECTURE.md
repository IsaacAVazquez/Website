# Architecture

High-level system architecture for the current live application.

**Last updated:** 2026-04-10

---

## System Summary

This repo is a single Next.js app that serves multiple product surfaces:

1. portfolio and professional site pages
2. MDX-backed writing
3. fantasy football analytics tools
4. an investment research platform
5. a seasonal March Madness editorial analysis route
6. football dashboards — Premier League (`/premier-league`) and La Liga (`/la-liga`)
7. standalone data tools for news, space launches, polling, and fintech calculators

The architecture is intentionally mixed:

- server routes for metadata, content loading, and API handlers
- client islands for animation, charting, tabs, and form-heavy workflows

---

## Runtime Shape

```text
src/app/layout.tsx
  -> Providers
  -> StaticHeader
  -> ConditionalLayout
       -> page content
       -> Footer
```

### Key shell facts

- header is always visible
- footer variant depends on route
- some pages render inside the default constrained wrapper
- self-shell pages handle their own spacing and width

---

## Major App Areas

### Portfolio and writing

- static and semi-static content
- metadata-heavy
- project data from constants
- writing content from `content/blog/`

### Fantasy football

- mixed server/client rendering
- chart-heavy UI
- SQLite-backed data flows plus sample fallbacks and scheduled refresh tools

### Investments

- client shell under `src/app/investments/investments-client.tsx`
- browser-local portfolio state
- curated research snapshots served through narrow API routes

### Football dashboards

Both `/premier-league` and `/la-liga` are snapshot-driven. Data is fetched from `football-data.org` by local scripts and committed as TypeScript files to `src/data/`. The app reads those files at build time — no live third-party API calls at runtime.

- `src/data/premierLeagueSnapshot.ts` — Premier League standings, fixtures, scorers
- `src/data/laLigaSnapshot.ts` — La Liga standings, fixtures, scorers

Shared UI components for both dashboards live in `src/components/football/`.

Update workflow:
- `npm run update:football` — full update for both leagues (~16 min, run locally then commit snapshots)
- `npm run update:premier-league` — PL only
- `npm run update:la-liga` — La Liga only
- `prebuild` runs a standings/fixtures/scorers-only fast path through `scripts/updateFootballSnapshots.ts --league-only`
- GitHub Actions also provide daily per-league snapshot refresh workflows

### March Madness

- server page for metadata and structured data
- client UI for deep-linked tabs and editorial analysis modules
- companion article under `/writing`

### Other standalone tools

- `/news-pulse` uses `/api/news-pulse` and `src/lib/news-pulse-utils.ts`
- `/spacex-mission-control` uses `src/components/spacex/` and `/api/spacex/*`
- `/polling-aggregator` uses a committed polling snapshot in `src/data/pollingSnapshot.ts`
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is a client-side fee analyzer

---

## Data Sources

### Static app data

- `src/constants/caseStudies.ts`
- `src/constants/navlinks.tsx`
- `src/constants/personal.ts`

### Football snapshots

- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`

These are committed TypeScript files rebuilt by `scripts/buildPremierLeagueSnapshot.ts` and `scripts/updateLaLigaSnapshot.ts`. The API routes for each dashboard read from these files, not from `football-data.org` at runtime.

### Writing content

- `content/blog/*.mdx`
- loaded through `src/lib/blog.ts`

### Fantasy football

- SQLite and supporting ingestion/cache layers
- sample-data fallbacks
- scheduled update route for refresh flows

### Investments

- curated snapshot assets and targeted research APIs
- live quote enrichment through `/api/stocks` and `/api/investments/quotes`

---

## API Architecture

All API handlers live under `src/app/api/`.

Important groups:

- auth: `/api/auth/[...nextauth]`
- fantasy football: `/api/fantasy-data`, `/api/fantasy-pros-session`, `/api/fantasy-pros-free`, `/api/data-manager`, `/api/data-metadata`, `/api/sample-data`, `/api/scheduled-update`
- investments: `/api/investments/index`, `/api/investments/quotes`, `/api/investments/data/[symbol]`, `/api/stocks`
- football: `/api/premier-league/summary`, `/api/premier-league/teams/[teamId]`, `/api/la-liga/summary`, `/api/la-liga/teams/[teamId]`
- content/utilities: `/api/news-pulse`, `/api/spacex/summary`, `/api/spacex/launches`, `/api/spacex/launches/[id]`, `/api/rss`, `/api/search`, `/api/scrape`

Current caveat:

- `/api/search` is still limited and mostly hardcoded

---

## Layout And Navigation Rules

- canonical portfolio path is `/portfolio`, not `/projects`
- canonical writing path is `/writing`, not `/blog`
- promoted nav is `Home / About / Projects / Writing / Investments / Resume / Contact`
- standalone dashboard/tool routes are live but not promoted in the global header

See `PAGES.md` and `docs/ai-context/REDIRECTS-AND-NAVIGATION.md` for the detailed route map.

---

## Styling Architecture

Core styling lives in:

- `src/app/globals.css`
- `tailwind.config.ts`

The system is token-driven:

- the `--home-*` editorial palette for all live routes except `/admin`
- legacy semantic aliases for compatibility
- Tailwind extensions mapped to those tokens
- shared shell helpers like `.home-page`, `.home-shell`, `.home-section`, and `.home-card`

---

## Deployment And Build

- deployed on Netlify
- build command comes from `netlify.toml`
- `prebuild` runs the fast football snapshot refresh path before `next build`
- `next-sitemap` runs after build
- `next.config.mjs` handles redirects, tracing exclusions, image config, and bundle splitting

Notable build constraints:

- `better-sqlite3` and `sharp` are kept out of inappropriate bundles
- `typescript.ignoreBuildErrors` is still enabled, so doc and code reviewers should not assume builds are type-clean

---

## Current Source Of Truth

When architecture docs and code disagree, trust:

1. `src/app/**`
2. `src/app/api/**`
3. `src/components/**`
4. `next.config.mjs`
5. `package.json`
