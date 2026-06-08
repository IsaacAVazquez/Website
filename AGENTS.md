# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-05-04

---

## Project Snapshot

This repo is a Next.js 16 personal site with several live product surfaces:

- portfolio and resume
- writing and long-form content
- fantasy football analytics
- investments and seasonal analysis experiments
- standalone sports, political, space, news, and fintech data tools

Primary live routes:

- `/`
- `/about`
- `/accessibility`
- `/portfolio` and `/portfolio/[slug]`
- `/investments`
- `/formula-1`
- `/fantasy-formula-1`
- `/github-trending-pulse`
- `/premier-league`
- `/la-liga`
- `/writing` and `/writing/[slug]`
- `/resume`
- `/contact`
- `/fantasy-football/*`
- `/march-madness-2026`
- `/news-pulse`
- `/spacex-mission-control`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/polling-aggregator`
- `/search`
- `/admin`

Canonical redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`

`Writing` is live and promoted in the global header.

---

## Navigation And Shell

Promoted header items:

1. `Home`
2. `About`
3. `Projects`
4. `Writing`
5. `Investments`
6. `Resume`
7. `Contact`

Shared shell files:

- `src/app/layout.tsx`
- `src/components/StaticHeader.tsx`
- `src/components/ConditionalLayout.tsx`
- `src/components/Footer.tsx`

Self-shell routes currently include:

- `/about`
- `/contact`
- `/fantasy-formula-1`
- `/fantasy-football`
- `/fantasy-football/draft-tracker`
- `/fintech-tools/budget-planner`
- `/formula-1`
- `/github-trending-pulse`
- `/investments`
- `/la-liga`
- `/premier-league`
- `/march-madness-2026`
- `/news-pulse`
- `/polling-aggregator`
- `/portfolio`
- `/portfolio/[slug]`
- `/resume`
- `/spacex-mission-control`
- `/writing`
- `/writing/[slug]`

Shell semantics:

- `src/components/ConditionalLayout.tsx` owns the only page-level `main` landmark for self-shell routes
- self-shell route files and leaf sections should use `div` or `section` wrappers, not nested `main`
- portfolio-shell routes should expose exactly one page-level `h1`

Footer variants:

- `compact` on `/` and `/contact`
- `full` on most other routes

---

## Guardrails

- Never hardcode hex colors in components. Use CSS variables from `src/app/globals.css`, preferably the current `--home-*` editorial tokens for new work.
- Never import `@tabler/icons-react` in server components. Use `@/components/ui/ServerIcons`.
- Never import `better-sqlite3` into client code.
- Never create real pages at `/projects`, `/work`, or `/blog`.
- Keep 44px minimum touch targets for interactive elements.
- Respect `prefers-reduced-motion` for Framer Motion usage.
- Shared portfolio-shell primitives must not use `transition-all`. Transition specific properties instead.
- Portfolio-shell routes must keep the primary message and main CTA visible in the initial mobile viewport whenever the route has a hero.
- Portfolio and writing cards should surface role, problem space, and impact in the default scan state.
- `/api/search` is still limited and mostly hardcoded. Do not describe it as comprehensive site search.
- `ProjectsContent.tsx` and `WritingPreview.tsx` still exist, but they are not the primary live path for the current shell.

---

## Core Workflows

### Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

- Prefer Node 20 locally to match GitHub Actions.
- `npm run update:investments` also requires `.venv/bin/python3`.
- `npm run update:football`, `npm run update:premier-league`, and `npm run update:la-liga` use `FOOTBALL_DATA_API_TOKEN` only when rebuilding checked-in football snapshots.
- `npm run update:mlb`, `npm run update:nba`, and `npm run update:nfl` use public sports data sources and do not require auth tokens.
- `npm run update:formula-1` reads historical OpenF1 endpoints and does not require an API key.
- `npm run update:github-trending` reads the public GitHub Search API. GitHub Actions passes `GITHUB_TOKEN` for higher rate limits.
- `npm run update:spacex` and `npm run update:spacex-images` read public Launch Library / SpaceDevs endpoints and do not require an API key.
- `npm run update:frontier-models` rebuilds `src/data/frontierModelsSnapshot.ts` from `scripts/data/frontierModels.source.ts`.
- If the investments fetch step fails on imports, install the Python dependency with `.venv/bin/pip install defeatbeta-api`.

### Day-to-day verification

- Use `npm run lint` for ESLint.
- Use `npm test` or targeted Jest runs while iterating.
- Use `npm run test:e2e` for default Playwright end-to-end coverage; use `npm run test:e2e:full` for the full browser matrix.
- Use `npm run build` before shipping route, config, or deployment-affecting changes.

### Fantasy data workflow

Primary npm entry point:

- `npm run update:fantasy`

The command currently runs this two-step pipeline:

1. `tsx scripts/buildFantasyPositionData.ts`
2. `tsx scripts/buildFantasySnapshots.ts`

Current generated outputs:

- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`

Legacy RB tiers artifacts still exist:

- `scripts/updateFantasyRBTiers.ts`
- `public/fantasy/rb_current.json`
- `src/components/RBTiersChart.tsx`

Operational note: `.github/workflows/update-fantasy.yml` commits the real fantasy snapshot artifacts above. There is no live Netlify scheduled fantasy updater; GitHub Actions is the public update path.

### Investments data workflow

The investments refresh path is:

1. `.venv/bin/python3 scripts/fetch_investments_data.py`
2. `tsx scripts/buildInvestmentsSnapshots.ts`

Use:

```bash
npm run update:investments
```

Inputs and outputs:

- input symbols: `scripts/investments_symbols.txt`
- raw fetch output: `public/data/investments/{SYMBOL}/*.json`
- index file: `public/data/investments/index.json`
- compacted snapshot output: `public/data/investments/{SYMBOL}/snapshot.json`

The snapshot builder removes legacy per-section JSON files after writing `snapshot.json`.

### Football dashboard data workflow

The football dashboards read committed TypeScript snapshots at runtime. The token is only needed when rebuilding those snapshots.

Full football refresh path:

1. `tsx scripts/updateFootballSnapshots.ts`

Use:

```bash
npm run update:football
```

Premier League-only refresh path:

1. `tsx scripts/buildPremierLeagueSnapshot.ts`

Use:

```bash
npm run update:premier-league
```

La Liga-only refresh path:

1. `tsx scripts/updateLaLigaSnapshot.ts`

Use:

```bash
npm run update:la-liga
```

Inputs and outputs:

- auth token: `FOOTBALL_DATA_API_TOKEN`
- Premier League snapshot output: `src/data/premierLeagueSnapshot.ts`
- La Liga snapshot output: `src/data/laLigaSnapshot.ts`

`prebuild` runs `tsx scripts/updateFootballSnapshots.ts --league-only` as the faster standings/fixtures/scorers refresh path during `npm run build`.

### US sports dashboard data workflow

The MLB, NBA, and NFL dashboards read committed TypeScript snapshots at runtime. They refresh through dedicated GitHub Actions workflows and can also be refreshed manually.

- `npm run update:mlb` writes `src/data/mlbSnapshot.ts` from the public MLB Stats API; pass `-- --league-only` to skip per-team snapshots.
- `npm run update:nba` writes `src/data/nbaSnapshot.ts` from ESPN public NBA endpoints; pass `-- --league-only` to skip per-team snapshots.
- `npm run update:nfl` writes `src/data/nflSnapshot.ts` from NFLverse open data; pass `-- --league-only` to skip per-team snapshots and player leaders.

### Other data refresh workflows

- `npm run update:formula-1` writes `src/data/formula1Snapshot.ts` from OpenF1 data and keeps the existing snapshot if refresh fails.
- `npm run update:github-trending` writes `src/data/githubTrendingSnapshot.ts` from the GitHub Search API; use `GITHUB_TOKEN` or `GH_TOKEN` locally for higher rate limits.
- `npm run update:frontier-models` writes `src/data/frontierModelsSnapshot.ts` from the curated source file in `scripts/data/`.
- `npm run update:spacex` and its alias `npm run update:spacex-data` write `src/data/spacexSnapshot.generated.json`.
- `npm run update:spacex-images` writes `src/data/spacexImageManifest.generated.json`, `public/data/spacex/image-reference-index.json`, and cached image files under `public/data/spacex/images/`.

### Build and asset workflow

- `npm run build` runs `prebuild`, `next build --webpack`, and npm `postbuild`
- `npm run prebuild` runs `tsx scripts/updateFootballSnapshots.ts --league-only` as the faster standings/fixtures/scorers refresh path before builds
- `postbuild` runs `next-sitemap` and `scripts/patch-nft-sharp.mjs`
- `npm run analyze` enables bundle analysis and still runs the npm `postbuild` hook
- `npm run build:analyze` runs `ANALYZE=true next build --webpack` directly and skips npm `postbuild`
- `npm run generate:icons` rebuilds PWA icons

---

## Command Reference

| Command | Use |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build plus the football `prebuild` fast path and `postbuild` sitemap/NFT patch steps |
| `npm run prebuild` | Run the football `--league-only` fast path used automatically before build |
| `npm run postbuild` | Run sitemap generation and the NFT sharp patch used automatically after build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint against `src` |
| `npm test` | Run Jest |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run test:ci` | CI-friendly Jest run with coverage and reduced workers |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:full` | Run the full Playwright browser matrix |
| `npm run test:e2e:ui` | Open Playwright UI mode |
| `npm run test:e2e:debug` | Run Playwright in debug mode |
| `npm run test:all` | Run coverage plus E2E tests |
| `npm run analyze` | Analyzer-enabled build that still runs npm `postbuild` |
| `npm run build:analyze` | Analyzer-enabled `next build` without npm `postbuild` |
| `npm run update:fantasy` | Generate fantasy position data and snapshot JSON |
| `npm run update:investments` | Fetch investment data and build compact snapshots |
| `npm run update:football` | Rebuild both Premier League and La Liga snapshots |
| `npm run update:premier-league` | Rebuild the checked-in Premier League snapshot |
| `npm run update:la-liga` | Rebuild the checked-in La Liga snapshot |
| `npm run update:mlb` | Rebuild the checked-in MLB snapshot |
| `npm run update:nba` | Rebuild the checked-in NBA snapshot |
| `npm run update:nfl` | Rebuild the checked-in NFL snapshot |
| `npm run update:formula-1` | Rebuild the checked-in Formula 1 snapshot |
| `npm run update:frontier-models` | Rebuild the checked-in Frontier Models snapshot |
| `npm run update:github-trending` | Rebuild the checked-in GitHub Trending Pulse snapshot |
| `npm run update:spacex` | Rebuild the checked-in SpaceX Mission Control data snapshot |
| `npm run update:spacex-data` | Alias of `npm run update:spacex` |
| `npm run update:spacex-images` | Rebuild cached SpaceX image snapshots and manifests |
| `npm run generate:icons` | Regenerate PWA icons |

---

## Automation Surfaces

Checked-in operational workflows:

- `.github/workflows/test.yml`
- `.github/workflows/update-investments.yml`
- `.github/workflows/update-premier-league.yml`
- `.github/workflows/update-la-liga.yml`
- `.github/workflows/update-fantasy.yml`
- `.github/workflows/update-github-trending.yml`
- `.github/workflows/update-formula-1.yml`
- `.github/workflows/update-spacex.yml`
- `.github/workflows/update-mlb.yml`
- `.github/workflows/update-nba.yml`
- `.github/workflows/update-nfl.yml`
- `netlify/functions/purge-cache.ts`

Current behavior:

- `test.yml` runs unit tests, build, sharded Chromium Playwright E2E, and lint on pushes to `main` or `develop`, plus pull requests targeting `main` or `develop`; full-matrix Playwright runs only on pushes to `main`
- `update-investments.yml` runs on manual dispatch and on Mondays and Thursdays at `22:15 UTC`, then commits refreshed files under `public/data/investments` when the curated dataset changes
- `update-premier-league.yml` runs on manual dispatch and daily at `06:15 UTC`, then commits `src/data/premierLeagueSnapshot.ts` when it changes
- `update-la-liga.yml` runs on manual dispatch and daily at `06:30 UTC`, then commits `src/data/laLigaSnapshot.ts` when it changes
- `update-fantasy.yml` runs on manual dispatch and on Wednesdays at `17:00 UTC`, then commits the generated fantasy snapshot artifacts when they change
- `update-github-trending.yml` runs on manual dispatch and daily at `07:45 UTC`, then commits `src/data/githubTrendingSnapshot.ts` when tracked repositories change
- `update-formula-1.yml` runs on manual dispatch and daily at `08:10 UTC`, then commits `src/data/formula1Snapshot.ts` when it changes
- `update-spacex.yml` runs on manual dispatch and daily at `09:25 UTC` and `21:25 UTC`, then commits SpaceX data, manifest, image reference, and cached image artifacts when they change
- `update-mlb.yml` runs on manual dispatch and daily April through October at `10:05 UTC`, then commits `src/data/mlbSnapshot.ts` when it changes
- `update-nba.yml` runs on manual dispatch and daily from mid-October through June at `10:20 UTC`, then commits `src/data/nbaSnapshot.ts` when it changes
- `update-nfl.yml` runs on manual dispatch and Tuesdays September through February at `10:35 UTC`, then commits `src/data/nflSnapshot.ts` when it changes
- A daily cron-job.org ping to the Netlify build hook triggers production deploys; `prebuild` refreshes Premier League and La Liga league-level snapshots with `tsx scripts/updateFootballSnapshots.ts --league-only`
- `purge-cache.ts` is protected by `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` and calls Netlify Durable Cache purge; query-string secrets are intentionally rejected
- TODO: `vercel.json` still declares a cron for `/api/scheduled-update`, but no matching route exists. Treat that config as historical until confirmed.

For public fantasy updates, GitHub Actions is the source of truth.

---

## Writing Voice

`WRITING_VOICE.md` governs all user-facing text across the site, not just blog articles. This includes UI copy, page descriptions, bios, hero text, section headings, and any other text a user will read. Read it before editing or creating any text. Non-conforming copy should be rewritten to match it, not patched around it.

---

## Source Of Truth Docs

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `PAGES.md`
- `COMPONENTS.md`
- `ARCHITECTURE.md`
- `API.md`
- `DEVELOPMENT.md`
- `TESTING.md`
- `STYLING.md`
- `WRITING_VOICE.md`
- `docs/README.md`

Older plans, redesign notes, and summary docs are kept for history. Check `docs/README.md` before treating a markdown file as current.
