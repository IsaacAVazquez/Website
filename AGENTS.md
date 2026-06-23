# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-06-16

---

## Project Snapshot

This repo is a Next.js 16 personal site with several live product surfaces:

- portfolio and resume
- writing and long-form content
- fantasy football analytics
- investments and seasonal analysis experiments
- standalone sports, political, space, news, transit, and fintech data tools
- personal-interest tools such as travel planning, food, recipes, wine, and museums

Primary live routes:

- `/`
- `/about`
- `/accessibility`
- `/portfolio` and `/portfolio/[slug]`
- `/investments`
- `/formula-1`
- `/fantasy-formula-1`
- `/github-trending-pulse`
- `/tech-startup-tracker`
- `/premier-league`
- `/la-liga`
- `/mlb`
- `/nba`
- `/nfl`
- `/golf`
- `/earthquake-pulse`
- `/world-cup-2026`
- `/bay-area-transit`
- `/writing` and `/writing/[slug]`
- `/resume`
- `/contact`
- `/fantasy-football/*`
- `/march-madness-2026`
- `/ai-dev-tools`
- `/frontier-models`
- `/decision-lab`
- `/food-map`
- `/recipe-finder`
- `/travel`
- `/wine-cellar`
- `/news-pulse`
- `/spacex-mission-control`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/polling-aggregator`
- `/mba-internship-notifications`
- `/museum-log`
- `/now`
- `/changelog`
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

Promoted header items (from `src/constants/navlinks.tsx`):

1. `Home`
2. `About`
3. `Projects` (points to `/portfolio`)
4. `Writing`
5. `Investments`
6. `Fantasy` (points to `/fantasy-football`)
7. `Resume`
8. `Contact`

Shared shell files:

- `src/app/layout.tsx`
- `src/components/StaticHeader.tsx`
- `src/components/ConditionalLayout.tsx`
- `src/components/Footer.tsx`

Self-shell routes currently include:

- `/about`
- `/ai-dev-tools`
- `/bay-area-transit`
- `/changelog`
- `/contact`
- `/decision-lab`
- `/earthquake-pulse`
- `/fantasy-formula-1`
- `/fantasy-football`
- `/fantasy-football/draft-tracker`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/food-map`
- `/formula-1`
- `/golf`
- `/github-trending-pulse`
- `/investments`
- `/la-liga`
- `/march-madness-2026`
- `/mba-internship-notifications`
- `/museum-log`
- `/news-pulse`
- `/now`
- `/polling-aggregator`
- `/premier-league`
- `/portfolio`
- `/portfolio/[slug]`
- `/recipe-finder`
- `/resume`
- `/spacex-mission-control`
- `/tech-startup-tracker`
- `/travel`
- `/wine-cellar`
- `/world-cup-2026`
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

## API Surface

Confirm live API routes from `src/app/api/**/route.ts`. Current routes:

- `/api/auth/[...nextauth]`
- `/api/bay-area-transit/summary` and `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`
- `/api/fantasy-data`
- `/api/golf/summary` and `/api/golf/players/[playerId]`
- `/api/investments/index`, `/api/investments/quotes`, `/api/investments/data/[symbol]`
- `/api/la-liga/summary` and `/api/la-liga/teams/[teamId]`
- `/api/mba-jobs` and `/api/mba-jobs/email`
- `/api/mlb/summary` and `/api/mlb/teams/[teamId]`
- `/api/nba/summary` and `/api/nba/teams/[teamId]`
- `/api/news-pulse`
- `/api/nfl/summary` and `/api/nfl/teams/[teamId]`
- `/api/premier-league/summary` and `/api/premier-league/teams/[teamId]`
- `/api/rss`
- `/api/search`
- `/api/spacex/summary`, `/api/spacex/launches`, `/api/spacex/launches/[id]`
- `/api/stocks`
- `/api/world-cup/summary` and `/api/world-cup/teams/[teamId]`

The dashboard APIs read committed snapshot files; they do not call external services at request time.

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
- `npm run update:mlb`, `npm run update:nba`, `npm run update:nfl`, `npm run update:golf`, and `npm run update:world-cup` use public sports data sources and do not require auth tokens.
- `npm run update:bay-area-transit` uses BART's public legacy API with the published demo key baked into the builder; no token setup required.
- `npm run update:tech-startups` processes a hand-maintained seed inside `scripts/buildTechStartupSnapshot.ts`; there is no live source to poll.
- `npm run update:formula-1` reads historical OpenF1 endpoints and does not require an API key.
- `npm run update:github-trending` reads the public GitHub Search API. GitHub Actions passes `GITHUB_TOKEN` for higher rate limits.
- `npm run update:spacex` and `npm run update:spacex-images` read public Launch Library / SpaceDevs endpoints. An API key is not strictly required, but the anonymous tier is heavily rate limited (shared CI IPs get 429'd fast, which silently freezes the snapshot) — set the optional `SPACEDEVS_API_TOKEN` to authenticate and raise the limit. The `update-spacex.yml` workflow now also fails loudly if the snapshot goes stale (older than 4 days).
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

The command currently runs this three-step pipeline:

1. `tsx scripts/buildFantasyPositionData.ts`
2. `tsx scripts/buildFantasyAdpData.ts`
3. `tsx scripts/buildFantasySnapshots.ts`

Current generated outputs:

- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`

Legacy RB tiers artifact still exists, and the old RB tier route redirects to the canonical fantasy board:

- `public/fantasy/rb_current.json`

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
- raw fetch output: `data/investments-raw/{SYMBOL}/*.json` (script-only, never deployed)
- index file: `public/data/investments/index.json`
- compacted snapshot output: `public/data/investments/{SYMBOL}/snapshot.json`

Only the index and the compacted snapshots live under `public/` (and ship with deploys); the raw per-section files stay in `data/investments-raw/`. Symbols with no raw sections on disk are stale-served: the builder keeps their committed snapshot instead of failing.

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
- `npm run update:golf` writes `src/data/golfSnapshot.ts` from the public ESPN golf leaderboard endpoint; a failed fetch keeps the previous snapshot.
- `npm run update:world-cup` writes `src/data/worldCupSnapshot.ts` from ESPN's public `soccer/fifa.world` endpoints; a failed or empty fetch keeps the previous snapshot.

### Other data refresh workflows

- `npm run update:formula-1` writes `src/data/formula1Snapshot.ts` from OpenF1 data and keeps the existing snapshot if refresh fails.
- `npm run update:bay-area-transit` writes `src/data/bayAreaTransitSnapshot.ts` from BART's public API (stations, lines, advisories, elevator outages, real-time departures); a failed or thin fetch keeps the previous snapshot.
- `npm run update:github-trending` writes `src/data/githubTrendingSnapshot.ts` from the GitHub Search API; use `GITHUB_TOKEN` or `GH_TOKEN` locally for higher rate limits.
- `npm run update:tech-startups` writes `src/data/techStartupSnapshot.ts` from the hand-maintained seed in `scripts/buildTechStartupSnapshot.ts`. The dataset is editorially curated with an `asOf` date and `verified: false` flag; refresh it by editing the seed, not by polling an API.
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
| `npm run update:golf` | Rebuild the checked-in golf leaderboard snapshot |
| `npm run update:world-cup` | Rebuild the checked-in World Cup 2026 snapshot |
| `npm run update:bay-area-transit` | Rebuild the checked-in Bay Area Transit (BART) snapshot |
| `npm run update:formula-1` | Rebuild the checked-in Formula 1 snapshot |
| `npm run update:frontier-models` | Rebuild the checked-in Frontier Models snapshot |
| `npm run update:github-trending` | Rebuild the checked-in GitHub Trending Pulse snapshot |
| `npm run update:tech-startups` | Rebuild the checked-in tech startup tracker snapshot from its curated seed |
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
- `.github/workflows/update-golf.yml`
- `.github/workflows/update-world-cup.yml`
- `.github/workflows/update-bay-area-transit.yml`
- `.github/workflows/update-earthquake.yml`
- `netlify/functions/purge-cache.ts`

Current behavior:

- `test.yml` runs unit tests, build, sharded Chromium Playwright E2E, and lint on pushes to `main` or `develop`, plus pull requests targeting `main` or `develop`; full-matrix Playwright runs only on pushes to `main`
- `update-investments.yml` runs on manual dispatch and on Mondays and Thursdays at `22:15 UTC`, then commits refreshed files under `public/data/investments` and `data/investments-raw` when the curated dataset changes
- `update-premier-league.yml` runs on manual dispatch and daily at `06:15 UTC` during the season (August through May; skipped June and July), then commits `src/data/premierLeagueSnapshot.ts` when it changes
- `update-la-liga.yml` runs on manual dispatch and daily at `06:30 UTC` during the season (August through May; skipped June and July), then commits `src/data/laLigaSnapshot.ts` when it changes
- `update-fantasy.yml` runs on manual dispatch and on Wednesdays at `17:00 UTC`, then commits the generated fantasy snapshot artifacts when they change
- `update-github-trending.yml` runs on manual dispatch and daily at `07:45 UTC`, then commits `src/data/githubTrendingSnapshot.ts` when tracked repositories change
- `update-formula-1.yml` runs on manual dispatch and daily at `08:10 UTC`, then commits `src/data/formula1Snapshot.ts` when it changes
- `update-spacex.yml` runs on manual dispatch and daily at `09:25 UTC` and `21:25 UTC`, then commits SpaceX data, manifest, image reference, and cached image artifacts when they change
- `update-mlb.yml` runs on manual dispatch and daily April through October at `10:05 UTC`, then commits `src/data/mlbSnapshot.ts` when it changes
- `update-nba.yml` runs on manual dispatch and daily from mid-October through June at `10:20 UTC`, then commits `src/data/nbaSnapshot.ts` when it changes
- `update-nfl.yml` runs on manual dispatch and Tuesdays September through February at `10:35 UTC`, then commits `src/data/nflSnapshot.ts` when it changes
- `update-golf.yml` runs on manual dispatch and daily at `08:40 UTC`, then commits `src/data/golfSnapshot.ts` when it changes
- `update-world-cup.yml` runs on manual dispatch and every six hours during June and July, then commits `src/data/worldCupSnapshot.ts` when it changes
- `update-bay-area-transit.yml` runs on manual dispatch and every six hours year-round, then commits `src/data/bayAreaTransitSnapshot.ts` when it changes
- `update-earthquake.yml` runs on manual dispatch and hourly (minute 20), then commits `src/data/earthquakeSnapshot.ts` when it changes
- The tech startup tracker has no workflow by design — its dataset is editorially curated, so refreshes happen by editing the seed and running `npm run update:tech-startups` locally
- A daily cron-job.org ping to the Netlify build hook triggers production deploys; `prebuild` refreshes Premier League and La Liga league-level snapshots with `tsx scripts/updateFootballSnapshots.ts --league-only`
- `purge-cache.ts` is protected by `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` and calls Netlify Durable Cache purge; query-string secrets are intentionally rejected
- Historical caveat: `vercel.json` still declares a cron for `/api/scheduled-update`, but no matching route exists. Treat that config as historical until confirmed.

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

Subsystem references:

- `SNAPSHOT_DRIVEN_DASHBOARDS.md` — shared snapshot-driven dashboard pattern
- `PERSONAL_INTEREST_TOOLS.md` — browser-persisted localStorage tools
- `RETIREMENT_PLANNER_ENGINE.md` — pure retirement projection engine
- `docs/DATA_UPDATE_OPERATIONS.md` — command → artifact → schedule runbook

Older plans, redesign notes, and summary docs are kept for history. Check `docs/README.md` before treating a markdown file as current.
