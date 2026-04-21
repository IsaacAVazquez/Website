# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-04-10

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
- `/fantasy-football`
- `/fantasy-football/draft-tracker`
- `/fintech-tools/budget-planner`
- `/formula-1`
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
- `npm run update:formula-1` reads historical OpenF1 endpoints and does not require an API key.
- If the investments fetch step fails on imports, install the Python dependency with `.venv/bin/pip install defeatbeta-api`.

### Day-to-day verification

- Use `npm run lint` for ESLint.
- Use `npm test` or targeted Jest runs while iterating.
- Use `npm run test:e2e` for end-to-end coverage.
- Use `npm run build` before shipping route, config, or deployment-affecting changes.

### Fantasy data workflow

Primary npm entry points:

- `npm run update:fantasy`
- `npm run update:fantasy-rb`

Both commands currently run the same two-step pipeline:

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

Operational note: `.github/workflows/update-fantasy-rb.yml` now commits the real fantasy snapshot artifacts above. The Netlify scheduled fantasy updater is retained only as a deprecated no-op and is not part of the public update path.

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
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint against `src` |
| `npm test` | Run Jest |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run test:ci` | CI-friendly Jest run with coverage and reduced workers |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Open Playwright UI mode |
| `npm run test:e2e:debug` | Run Playwright in debug mode |
| `npm run test:all` | Run coverage plus E2E tests |
| `npm run analyze` | Analyzer-enabled build that still runs npm `postbuild` |
| `npm run build:analyze` | Analyzer-enabled `next build` without npm `postbuild` |
| `npm run update:fantasy` | Generate fantasy position data and snapshot JSON |
| `npm run update:fantasy-rb` | Alias of `npm run update:fantasy` |
| `npm run update:investments` | Fetch investment data and build compact snapshots |
| `npm run update:football` | Rebuild both Premier League and La Liga snapshots |
| `npm run update:premier-league` | Rebuild the checked-in Premier League snapshot |
| `npm run update:la-liga` | Rebuild the checked-in La Liga snapshot |
| `npm run update:formula-1` | Rebuild the checked-in Formula 1 snapshot |
| `npm run generate:icons` | Regenerate PWA icons |

---

## Automation Surfaces

Checked-in operational workflows:

- `.github/workflows/test.yml`
- `.github/workflows/update-investments.yml`
- `.github/workflows/update-premier-league.yml`
- `.github/workflows/update-la-liga.yml`
- `.github/workflows/update-fantasy-rb.yml`
- `netlify/functions/scheduled-fantasy-update.ts`
- `netlify/functions/purge-cache.ts`

Current behavior:

- `test.yml` runs unit tests, Playwright E2E, lint, and build on pushes to `main`, `develop`, and `claude/**`, plus pull requests targeting `main` or `develop`
- `update-investments.yml` runs on manual dispatch and on weekdays at `22:15 UTC`, then commits refreshed files under `public/data/investments` when the curated dataset changes
- `update-premier-league.yml` runs on manual dispatch and daily at `06:15 UTC`, then commits `src/data/premierLeagueSnapshot.ts` when it changes
- `update-la-liga.yml` runs on manual dispatch and daily at `06:30 UTC`, then commits `src/data/laLigaSnapshot.ts` when it changes
- `update-fantasy-rb.yml` runs on manual dispatch and on Wednesdays at `17:00 UTC`, then commits the generated fantasy snapshot artifacts when they change
- `scheduled-fantasy-update.ts` is deprecated and intentionally no longer updates public fantasy data
- `purge-cache.ts` is protected by `x-cron-secret` or `?secret=` and calls Netlify Durable Cache purge

For public fantasy updates, GitHub Actions is the source of truth. The Netlify scheduled function remains checked in only as a deprecated placeholder.

Useful scheduled-update checks:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/scheduled-update

curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/scheduled-update
```

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
