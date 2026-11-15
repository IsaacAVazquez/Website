# Development Guide

Current development setup and workflow notes.

**Last updated:** 2026-11-02

---

## Prerequisites

- Node.js 22.12 or newer, which the `engines` field in `package.json` requires. `.nvmrc` pins major version 22, and every GitHub Actions workflow that sets up Node reads it through `node-version-file`
- npm
- Git
- Python 3.12 for `npm run update:investments`, which runs `.venv/bin/python3`. The refresh workflow creates that `.venv` at the repo root with `python -m venv .venv` and installs `scripts/requirements-investments.txt`, whose pins are compiled for Python 3.12

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

`.env.example` holds placeholder values, and the code treats any non-empty value as real, so fill in or delete each line you copied into `.env.local`. A placeholder `BART_API_KEY`, for example, is sent to BART in place of its demo key. None of the keys is needed to run `npm run dev`, and `docs/ENVIRONMENT_CONFIGURATION.md` says what each one turns on.

The dev server answers only on this computer. To open it from a phone on the same network, start it with `npm run dev -- --hostname 0.0.0.0` and use the Network address it prints, which also leaves the private job search sync off. Next refuses hot reload from that address unless it is listed in `allowedDevOrigins` in `next.config.mjs`, so reload the phone's page by hand after an edit.

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
npm run update:polling
npm run update:github-trending
npm run update:tech-startups
npm run update:score-pools
npm run update:spacex
npm run update:spacex-images
npm run update:article-images
```

Additional useful scripts:

```bash
npm run typecheck
npm run check:blog-dates -- --base=origin/main
npm run test:watch
npm run test:coverage
npm run test:e2e:ui
npm run analyze
npm run build:analyze
npm run build:fantasy-companion
npm run start
npm run submit:indexnow -- --dry-run
```

`npm run dev` (through `scripts/dev.cjs`) and `npm run build` both run Next with `--webpack`. `npm run start` serves the last production build, which is what Playwright tests against in CI. `npm run submit:indexnow` posts every URL in `public/sitemap.xml` to IndexNow, `-- --dry-run` only checks the list, and no workflow runs it. `TESTING.md` lists the rest of the test commands.

Of the update scripts, only `update:premier-league`, `update:la-liga`, `update:nba`, `update:spacex`, and `update:spacex-images` load `.env.local` (through `tsx --env-file-if-exists`), and `update:football` does through the first two. Any other update script reads only the shell environment, so a key such as `THE_ODDS_API_KEY` for `update:score-pools` or `BART_API_KEY` for `update:bay-area-transit` has to be exported in the shell that runs it.

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
- Premier League, La Liga, MLB, NBA, NFL, golf, Formula 1, Fantasy Formula 1, and World Cup dashboards
- standalone routes for AI tools, frontier models, News Pulse, SpaceX Mission Control, Polling Aggregator, Earthquake Pulse, Bay Area Transit, GitHub Trending Pulse, the tech startup tracker, score pools, the job search tracker, personal logs, and fintech tools
- search, changelog, and utility pages

The full route map is in `AGENTS.md`, and `src/app/**/page.tsx` is the source of truth.

### Shared shell

- `src/app/layout.tsx` sets fonts and providers
- `src/components/ConditionalLayout.tsx` passes the seven designed Catalog 97 routes through and wraps every other route in `src/components/catalog97/Catalog97ToolShell.tsx`
- `src/components/catalog97/Catalog97Shell.tsx` owns the header, the only `main`, and the footer; the nav links come from `src/constants/catalog97Nav.ts`
- see `AGENTS.md` for the full shell description

### Content

- writing content is read from `content/blog/`
- project data is defined in `src/constants/caseStudies.ts`

### APIs

API routes live in `src/app/api/`.

Do not assume old doc paths are current. Check the actual route tree first.

---

## Frontend Conventions

- never hardcode hex colors in components. Use the `--c97-*` tokens from `src/app/catalog97.css` through `data-c97-surface`, or, on a project route, the route's own `--<abbr>-*` custom properties, which the Project routes section of `DESIGN_CHECKLIST.md` has allowed since 2026-10-11. The Working Instrument `--home-*` tokens were deleted on 2026-09-27
- use `@/components/ui/ServerIcons` for server components
- keep 44px touch targets
- respect reduced motion
- preserve established visual language unless intentionally redesigning a route

---

## Data Notes

### Investments

- portfolio state is browser-local
- quotes are refreshed via `/api/investments/quotes`
- research data is static JSON (`public/data/investments/index.json` and `public/data/investments/{SYMBOL}/snapshot.json`) that the investments pages read as plain files. `/api/investments/quotes` is the only investments API route
- raw provider responses under `data/investments-raw/` are a transient builder workspace that is gitignored and has no tracked files; the refresh workflow commits only compact snapshots under `public/data/investments/`, so raw files stay out of automated commits

### Fantasy football

- public rankings read generated snapshots in `public/data/fantasy/`
- `npm run update:fantasy` runs `update:fantasy:redraft`, `update:fantasy:best-ball`, and `update:fantasy:weekly` in turn, which regenerate the `src/data/fantasy*.generated.*` sources and the published JSON in `public/data/fantasy/`
- `/api/fantasy-data` is a server-side fallback over the same snapshot files

### Football dashboards (Premier League + La Liga)

Both dashboards read committed JSON snapshot files, each imported through the typed `.ts` wrapper beside it, and make no live API calls at runtime:

- `src/data/premierLeagueSnapshot.json`
- `src/data/laLigaSnapshot.json`

Updating snapshots:

```bash
npm run update:football          # full update, both leagues, ~16 min
npm run update:premier-league    # PL only, ~8 min
npm run update:la-liga           # La Liga only, ~8 min
```

After running, commit the changed snapshot files:

```bash
git add src/data/premierLeagueSnapshot.json src/data/laLigaSnapshot.json
git commit -m "data: refresh football snapshots"
git push
```

The checked-in GitHub Actions workflows refresh Premier League and La Liga snapshots every four hours from August through May and commit changes when the data moves. Production builds consume those committed snapshots and do not call football-data.org. Each workflow runs the same `npm run update:premier-league` or `npm run update:la-liga` builder a local run uses, team fixtures and form included, and `npm run update:football` runs the two in turn.

Requires `FOOTBALL_DATA_API_TOKEN` in `.env.local` (free tier, 10 req/min limit). Without it, the dashboard still loads from the last committed snapshot.

### US sports dashboards

MLB, NBA, and NFL also read from committed JSON snapshot files:

```bash
npm run update:mlb
npm run update:nba
npm run update:nfl
```

These commands use public data sources and do not require auth tokens. Golf, Formula 1, the World Cup, Earthquake Pulse, and Bay Area Transit follow the same pattern with their own update scripts (`npm run update:golf`, `npm run update:formula-1`, `npm run update:world-cup`, `npm run update:earthquake`, `npm run update:bay-area-transit`), each against a public source. The first four need no token, and Bay Area Transit reads an optional `BART_API_KEY` and falls back to BART's published demo key without one. Of the dashboards in this section, Earthquake Pulse and Bay Area Transit also take live data at request time, since `/api/earthquake-pulse/summary`, `/api/bay-area-transit/summary`, and `/api/bay-area-transit/stations/[stationId]` pass `preferLive: true` and fall back to the committed snapshot.
 
### Job search and candidate pipeline

- `/mba-internship-notifications` tracks full-time and internship opportunities across the companies in `src/constants/mba-companies.ts`. Each entry's `atsType` says whether its board is polled (Greenhouse, Ashby, SmartRecruiters, Lever, or a direct HTML page) or shown as a manual card that links to the company's careers search.
- Local candidate dumping script:
  ```bash
  ./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts [inbox.json ...]
  ```
  Pulls active ATS feeds, matches full-time roles against `private/job-search/targets.json`, drops duplicates already in pipeline or candidates, and writes `private/job-search/candidates.json`. Each `inbox.json` argument is merged in too, and with `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` set the run also pulls Adzuna leads.
- Under plain `npm run dev`, the tracker keeps `localStorage` in step with `private/job-search/pipeline.json` through `/api/job-search` (newer `updatedAt` wins, and a 409 merges the server's copy and retries once). It reads and writes `private/job-search/candidates.json` through the same route with no `localStorage` copy.
- Everything in `private/job-search/` is personal, gitignored, and never deployed to production.

---

## Auth And Admin

There is no authenticated surface. The `/admin` page and NextAuth were removed on 2026-10-02.

---

## Build And Deployment Notes

Production webpack snapshots validate file and directory contents with hashes.
I added this setting after repeated builds with Next.js 16.3.6 failed inside
webpack's cached symlink context hashing. Development keeps its default
settings, and production still uses filesystem caching. The configured snapshot
categories and hash checks are described in [webpack's snapshot documentation](https://webpack.js.org/configuration/other-options/#snapshot).

- deployment target is Netlify, but Netlify's git integration does not build production. `.github/workflows/publish-data.yml` builds and uploads it in one `netlify deploy --prod` command on every push to `main` without `[skip ci]`, at 01:15, 07:15, 13:15, and 19:15 UTC, and on manual dispatch. `scripts/ci/netlify-ignore.sh` cancels Netlify's own builds for `main` and `dependabot/*` branches, and human pull requests still get a Netlify deploy preview
- builds consume committed snapshots, change no snapshot data, and call no data provider, but `next/font/google` downloads the site's fonts during the build, so a build needs network access
- `postbuild` runs `scripts/generatePublicSitemap.mjs` (`npm run generate:sitemap`), `scripts/buildLlmsFull.mjs` (`npm run build:llms`), and `scripts/patch-nft-sharp.mjs`. The first two rewrite the tracked `public/sitemap.xml` and `public/llms-full.txt`, so a local build can leave a diff in either file
- `.github/workflows/test.yml` runs `npm run typecheck` before `npm run build` on every push and pull request to `main` or `develop`, and the production deploy in `publish-data.yml` does not run it
- build-time tracing excludes large optional assets and packages
- the snapshot-refresh GitHub Actions workflows (all `.github/workflows/update-*.yml`, most of them through the reusable `.github/workflows/refresh-snapshot.yml`) and `changelog-on-merge.yml` commit and push through the shared `scripts/ci/commit-and-push-snapshot.sh` helper, which sets the `github-actions[bot]` identity, no-ops cleanly when nothing changed, regenerates `public/sitemap.xml` beside a snapshot when dependencies are installed, and retries the push with rebase + backoff so concurrent snapshot bots do not collide on `main`. Their commits carry `[skip ci]`, so refreshed data goes live at the next `publish-data.yml` run
- `netlify/functions/` holds two Netlify scheduled functions that refresh data with no commit or rebuild. `refresh-polling.ts` runs at 00:45, 06:45, 12:45, and 18:45 UTC and `refresh-frontier-models.ts` daily at 07:30 UTC, and each writes its snapshot to the `dashboard-snapshots` Netlify Blobs store, which `/polling-aggregator` and `/frontier-models` serve in place of the committed seed while the blob is newer than that seed and no more than 36 hours (polling) or three days (frontier models) old. Off Netlify, `npm run dev` included, both pages serve the committed seed

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
