# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-04-03

---

## Project Snapshot

This repo is a Next.js 16 personal site with four live product surfaces:

- portfolio and resume
- writing and long-form content
- fantasy football analytics
- investments and seasonal analysis experiments
- standalone sports data dashboards like the Premier League tool

Primary live routes:

- `/`
- `/about`
- `/accessibility`
- `/portfolio` and `/portfolio/[slug]`
- `/investments`
- `/premier-league`
- `/writing` and `/writing/[slug]`
- `/resume`
- `/contact`
- `/fantasy-football/*`
- `/march-madness-2026`
- `/search`
- `/admin`

Canonical redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`

`Writing` is live, but it is not a promoted top-level nav item.

---

## Navigation And Shell

Promoted header items:

1. `Home`
2. `About`
3. `Projects`
4. `Investments`
5. `Resume`
6. `Contact`

Shared shell files:

- `src/app/layout.tsx`
- `src/components/StaticHeader.tsx`
- `src/components/ConditionalLayout.tsx`
- `src/components/Footer.tsx`

Self-shell routes currently include:

- `/about`
- `/contact`
- `/investments`
- `/premier-league`
- `/march-madness-2026`
- `/portfolio`
- `/portfolio/[slug]`
- `/resume`
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

- Never hardcode hex colors in components. Use CSS variables from `src/app/globals.css`.
- Never import `@tabler/icons-react` in server components. Use `@/components/ui/ServerIcons`.
- Never import `better-sqlite3` into client code.
- Never create real pages at `/projects`, `/work`, or `/blog`.
- Keep 44px minimum touch targets for interactive elements.
- Respect `prefers-reduced-motion` for Framer Motion usage.
- Shared portfolio-shell primitives must not use `transition-all`. Transition specific properties instead.
- Portfolio-shell routes must keep the primary message and main CTA visible in the initial mobile viewport whenever the route has a hero.
- Portfolio and writing cards should surface role, problem space, and impact in the default scan state.
- `/api/search` is still limited and mostly hardcoded. Do not describe it as full-site search.
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

Important caveat: `.github/workflows/update-fantasy-rb.yml` still assumes the legacy `public/fantasy/rb_current.json` path, while the current npm alias writes the snapshot pipeline outputs above.

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

### Build and asset workflow

- `npm run build` runs `next build --webpack`
- `postbuild` runs `next-sitemap` and `scripts/patch-nft-sharp.mjs`
- `npm run analyze` enables bundle analysis and still runs the npm `postbuild` hook
- `npm run build:analyze` runs `ANALYZE=true next build` directly and skips npm `postbuild`
- `npm run generate:icons` rebuilds PWA icons

---

## Command Reference

| Command | Use |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build plus `postbuild` sitemap and NFT patch steps |
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
| `npm run generate:icons` | Regenerate PWA icons |

---

## Automation Surfaces

Checked-in operational workflows:

- `.github/workflows/test.yml`
- `.github/workflows/update-investments.yml`
- `.github/workflows/update-fantasy-rb.yml`
- `netlify/functions/scheduled-fantasy-update.ts`
- `netlify/functions/purge-cache.ts`

Current behavior:

- `test.yml` runs unit tests, Playwright E2E, lint, and build on pushes to `main`, `develop`, and `claude/**`, plus pull requests targeting `main` or `develop`
- `update-investments.yml` runs on manual dispatch and on weekdays at `22:15 UTC`, then commits refreshed files under `public/data/investments` when the curated dataset changes
- `update-fantasy-rb.yml` runs on manual dispatch and on Wednesdays at `17:00 UTC`
- `scheduled-fantasy-update.ts` runs on Wednesdays at `08:00 UTC` and calls `/api/scheduled-update` with `Authorization: Bearer $CRON_SECRET`
- `purge-cache.ts` is protected by `x-cron-secret` or `?secret=` and calls Netlify Durable Cache purge

If seasonal automation changes, verify both the GitHub Actions workflow and the Netlify scheduled function. They are separate checked-in schedules today.

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

## Source Of Truth Docs

- `README.md`
- `CLAUDE.md`
- `PAGES.md`
- `COMPONENTS.md`
- `ARCHITECTURE.md`
- `API.md`
- `DEVELOPMENT.md`
- `TESTING.md`
- `STYLING.md`
- `docs/README.md`

Older plans, redesign notes, and summary docs are kept for history. Check `docs/README.md` before treating a markdown file as current.
