# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-08-16

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
- `/score-pools` (+ `/score-pools/tracker`, `/score-pools/settings`)
- `/writing` and `/writing/[slug]`
- `/resume`
- `/contact`
- `/fantasy-football/*`
- `/march-madness-2026`
- `/ai-dev-tools`
- `/frontier-models`
- `/decision-lab`
- `/enablement-assistant`
- `/food-map`
- `/recipe-finder`
- `/travel`
- `/travel-deals`
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

## Navigation and Shell

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
- `/enablement-assistant`
- `/earthquake-pulse`
- `/fantasy-formula-1`
- `/fantasy-football`
- `/fantasy-football/best-ball`
- `/fantasy-football/best-ball/draft-tracker`
- `/fantasy-football/draft-tracker`
- `/fantasy-football/trade-calculator`
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
- `/score-pools` (+ `/score-pools/*` subroutes)
- `/spacex-mission-control`
- `/tech-startup-tracker`
- `/travel`
- `/travel-deals`
- `/wine-cellar`
- `/world-cup-2026`
- `/writing`
- `/writing/[slug]`

Shell semantics:

- `src/components/ConditionalLayout.tsx` owns the only page-level `main` landmark for self-shell routes
- self-shell route files and leaf sections should use `div` or `section` wrappers, not nested `main`
- portfolio-shell routes should expose exactly one page-level `h1`

Catalog 97 routes:

- `/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`, `/contact` run on the Catalog 97 language, and every other route stays on Working Instrument
- `StaticHeader` and `ConditionalLayout` both return early for them (`isCatalog97Route` in `src/constants/catalog97Nav.ts`), so `Catalog97Shell` owns the header, the only `main`, and the footer
- their tokens live in `src/app/catalog97.css`, scoped under `.c97-page`, and never touch `--home-*`

Footer variants:

- `full` on every route that reaches `ConditionalLayout`
- the Catalog 97 routes render their own espresso footer instead. `Footer` still accepts `variant="compact"`, but nothing currently passes it

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
- The `/portfolio` index is rendered by `src/components/catalog97/Catalog97Portfolio.tsx`, which carries a client-side project search with tokenized AND matching over title, description, role, timeline, metrics, summary, category, and tools, plus curated, newest, alphabetical, and live-first sorting.
- `/api/search` is still limited and mostly hardcoded. Do not describe it as comprehensive site search.

---

## API Surface

Confirm live API routes from `src/app/api/**/route.ts`. Current routes:

- `/api/auth/[...nextauth]`
- `/api/data-revisions` (no-cache production snapshot revision and freshness ledger)
- `/api/bay-area-transit/summary` and `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`
- `/api/fantasy-data`
- `/api/formula-1/meetings/[meetingId]`
- `/api/golf/players/[playerId]`
- `/api/investments/quotes` and `/api/investments/data/[symbol]`
- `/api/la-liga/teams/[teamId]`
- `/api/mba-jobs` and `/api/mba-jobs/email`
- `/api/mlb/teams/[teamId]`
- `/api/nba/teams/[teamId]`
- `/api/news-pulse`
- `/api/nfl/teams/[teamId]`
- `/api/premier-league/teams/[teamId]`
- `/api/rss`
- `/api/search`
- `/api/spacex/summary`, `/api/spacex/launches`, `/api/spacex/launches/[id]`
- `/api/stocks`
- `/api/world-cup/teams/[teamId]`

Most dashboard APIs read committed snapshot files at request time. The exceptions that call external services at request time are the earthquake-pulse, bay-area-transit, news-pulse, mba-jobs, and investments quotes routes; each keeps the committed snapshot (or cached data) as its fallback.

Dashboard pages call their `src/lib/*` accessor directly in the server component, so most surfaces have no `/summary` endpoint. The per-entity detail routes above exist because the client fetches them on selection.

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
- `npm run update:football`, `npm run update:premier-league`, and `npm run update:la-liga` use `FOOTBALL_DATA_API_TOKEN` only when rebuilding checked-in football snapshots. The same token is optional at runtime: when set in the deploy environment, the Premier League and La Liga summary APIs refresh standings and fixtures at request time (5-minute in-memory TTL) and fall back to the committed snapshots; without it they serve the committed snapshots only.
- `npm run update:mlb`, `npm run update:nba`, `npm run update:nfl`, `npm run update:golf`, and `npm run update:world-cup` use public sports data sources and do not require auth tokens.
- `npm run update:bay-area-transit` uses BART's public legacy API. Set the optional `BART_API_KEY` (free registration at api.bart.gov/api/register.aspx) to replace the published demo-key fallback; no token setup is required to get started.
- `npm run update:tech-startups` processes a hand-maintained seed inside `scripts/buildTechStartupSnapshot.ts`; there is no live source to poll.
- `npm run update:formula-1` reads historical OpenF1 endpoints and does not require an API key.
- `npm run update:github-trending` reads the public GitHub Search API. GitHub Actions passes `GITHUB_TOKEN` for higher rate limits.
- `npm run update:spacex` and `npm run update:spacex-images` read public Launch Library / SpaceDevs endpoints. An API key is not strictly required, but the anonymous tier is heavily rate limited (shared CI IPs get 429'd fast, which silently freezes the snapshot) — set the optional `SPACEDEVS_API_TOKEN` to authenticate and raise the limit. The `update-spacex.yml` workflow now also fails loudly if the snapshot goes stale (older than 4 days).
- `npm run update:frontier-models` rebuilds `src/data/frontierModelsSnapshot.ts` from `scripts/data/frontierModels.source.ts`.
- If the investments fetch step fails on imports, install the pinned Python dependency with `.venv/bin/pip install defeatbeta-api==0.0.47`.

### Day-to-day verification

- Use `npm run lint` for ESLint.
- Use `npm test` or targeted Jest runs while iterating.
- Use `npm run test:e2e` for default Playwright end-to-end coverage; use `npm run test:e2e:full` for the full browser matrix.
- Use `npm run build` before shipping route, config, or deployment-affecting changes.

### Fantasy surface

The fantasy-football surface keeps redraft and best ball separate. `/fantasy-football` and `/fantasy-football/draft-tracker` use the scoring-specific redraft snapshots through `useFantasySnapshot`. `/fantasy-football/best-ball` and `/fantasy-football/best-ball/draft-tracker` use `public/data/fantasy/best-ball.json` through `useBestBallSnapshot`, with contest rules and recommendations from `src/lib/bestBall.ts`. The best ball snapshot combines best ball consensus rankings, current Underdog ADP, bye weeks, and Week 17 opponents. Best ball draft state uses its own season-and-contest storage keys and does not read or overwrite the redraft draft state.

The redraft rankings board is tier-first (from the `draft-rankings` Claude Design template): numbered tier plates, avg-rank cliff separators, per-row expert-spread bars, a sticky bar with the deep-linkable position pill row and PPR/Half-PPR/Standard scoring selector (`?position=`, `?scoring=`), per-board search, and, when the ADP source is fresh, ADP and vs-ADP columns plus a market verdict in the board's own player drawer (`?view=` is still parsed for old links but has no UI). Shared presentation components live in `src/components/fantasy/` (barrel `index.ts`); three cross-surface browser-local stores live in `src/hooks/use{PlayerQueue,PlayerNotes,CompareTray}.ts` over `useLocalStorageString.ts`, with parse/serialize helpers and key constants in `src/lib/fantasyLocal.ts`. Board math/formatting/legend copy is in `src/lib/fantasyUtils.ts`; the pure redraft signal engine is `src/lib/draftAnalytics.ts`. LocalStorage keys include `fantasy-player-queue-v1`, `fantasy-player-notes-v1`, and `fantasy-compare-v1`; per-season redraft state persists under `fantasy-draft-tracker-v3-<season>`.

`/fantasy-football/trade-calculator` is a preseason one-QB redraft estimate built from the same overall consensus and mock-draft ADP snapshot. `src/lib/fantasyTrade.ts` converts each source to a league-specific replacement-relative index, keeps expert and market readings separate, and reports sensitivity and input coverage. It is not an in-season, dynasty, creator-specific, projected-points, or win-probability model. Selected player IDs persist under `fantasy-trade-calculator-v1-<season>-<scoring>`, while scoring, team count, roster size, and lineup preset stay in the URL.

Both draft trackers derive a room-relative Draft Outlook from `src/lib/fantasyTeamValue.ts`. The model uses actual pick number against ADP or format rank, roster shape, lineup or stack fit, and weekly bye lineup coverage, with explicit component weights and input coverage. `src/components/fantasy/DraftValuePanel.tsx` renders the shared room rank, draft-slot turn context, published Best Ball Mania VII field economics, and a user-entered expected return calculator. The Draft Outlook is an ordinal draft-process model. Do not describe it as projected points, win probability, or roster-specific payout EV. Those outputs require weekly player distributions and a calibrated field simulation that the current snapshots do not contain. The current contract and limits are in `docs/FANTASY_DRAFT_MODEL.md`.

### Fantasy data workflow

Primary npm entry point:

- `npm run update:fantasy`

The command currently runs this five-step pipeline:

1. `tsx scripts/buildFantasyPositionData.ts`
2. `tsx scripts/buildFantasyAdpData.ts`
3. `tsx scripts/buildFantasyGameLogData.ts`
4. `tsx scripts/buildFantasySnapshots.ts`
5. `tsx scripts/buildBestBallSnapshot.ts`

Steps 2 and 3 are both fail-soft overlays on the consensus board. Each keeps its
previous generated data on a failed or thin fetch and never stops the chain.

Current generated outputs:

- `src/data/fantasyPositionData.generated.ts`
- `src/data/fantasyAdpData.generated.ts`
- `src/data/fantasyGameLogData.generated.ts`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`
- `public/data/fantasy/best-ball.json`

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

Only the index and compacted snapshots under `public/` ship with deploys and are committed by the refresh workflow. Raw per-section files stay in the `data/investments-raw/` workspace as transient builder inputs. That directory is gitignored for new files, but existing historical files remain tracked until the repository cleanup migration, and the refresh workflow's narrowed `public/data/investments` pathspec keeps them out of automated commits. When a symbol fetch fails, the builder keeps its committed snapshot and original freshness metadata.

The refresh now rejects a symbol when its latest market date is more than seven calendar days old, even if the provider returned a non-empty price array. The index records per-symbol `priceAsOf` plus aggregate `priceHealth`, and the UI reports recent and delayed histories separately from snapshot build time. The legacy EPS-based DCF and its Buy/Hold/Sell output are disabled until a statement-backed model replaces them. Current provider, licensing, and migration decisions live in `docs/INVESTMENTS_DATA_SOURCES.md`.

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

Production builds consume the committed football snapshots without calling football-data.org. Refreshes run only through the explicit commands and scheduled workflows above.

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
- `npm run update:score-pools` writes `src/data/scorePoolsSnapshot.ts` from The Odds API (`THE_ODDS_API_KEY`) and API-Football (`API_FOOTBALL_KEY`), merged with manual entries in `scripts/data/scorePools.manual.ts` and CSV drops in `scripts/data/score-pools/`. Local manual runs can omit the tokens, but the scheduled workflow requires both and rejects sample-only output. Odds history is append-only and capped per fixture so line movement stays queryable. See `SCORE_POOLS_ENGINE.md`.
- `npm run update:spacex` writes `src/data/spacexSnapshot.generated.json`.
- `npm run update:spacex-images` writes `src/data/spacexImageManifest.generated.json`, `public/data/spacex/image-reference-index.json`, and cached image files under `public/data/spacex/images/`.

### Article cover image workflow

- `npm run update:article-images` gives blog posts a real, license-safe cover photo in place of the generated `/writing/<slug>/opengraph-image` card, per the plan in `scripts/data/articleCoverImages.ts` (one entry per published slug). It fetches freely licensed photos from Wikimedia Commons, saves them under `public/images/writing/covers/`, and writes the `coverImage*` frontmatter. Pass `--only=<slug>` when publishing a single post, `--force` to re-fetch, or `--dry-run` to preview.
- The agent sandbox blocks image hosts, so this runs in the `update-article-images.yml` Action or on a networked machine, not in-session. Adding a post means adding its plan entry in the same change; abstract pieces intentionally keep the editorial card. Full runbook: `docs/ARTICLE_IMAGE_WORKFLOW.md`.

### Build and asset workflow

- `npm run build` runs `next build --webpack` and npm `postbuild`; it does not refresh data
- `npm run typecheck` runs the standalone TypeScript gate enforced by CI
- `postbuild` runs `scripts/generatePublicSitemap.mjs` and `scripts/patch-nft-sharp.mjs`
- `npm run analyze` enables bundle analysis and still runs the npm `postbuild` hook
- `npm run build:analyze` runs `ANALYZE=true next build --webpack` directly and skips npm `postbuild`
- `npm run generate:icons` rebuilds PWA icons

---

## Command Reference

| Command | Use |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build plus the `postbuild` sitemap/NFT patch steps; consumes committed snapshots |
| `npm run typecheck` | Run the standalone TypeScript gate enforced by CI |
| `npm run postbuild` | Regenerate the public sitemap and run the NFT sharp patch used automatically after build |
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
| `npm run build:fantasy-companion` | Build the private fantasy draft companion extension into `extension/dist` with packaged snapshot copies; not part of the site build. See `docs/FANTASY_DRAFT_COMPANION.md` |
| `npm run update:fantasy` | Generate fantasy position data, ADP, prior-season per-game scoring, and snapshot JSON |
| `npm run update:investments` | Fetch investment data and build compact snapshots |
| `npm run update:football` | Rebuild both Premier League and La Liga snapshots |
| `npm run update:premier-league` | Rebuild the checked-in Premier League snapshot |
| `npm run update:la-liga` | Rebuild the checked-in La Liga snapshot |
| `npm run update:mlb` | Rebuild the checked-in MLB snapshot |
| `npm run update:nba` | Rebuild the checked-in NBA snapshot |
| `npm run update:nfl` | Rebuild the checked-in NFL snapshot |
| `npm run update:golf` | Rebuild the checked-in golf leaderboard snapshot |
| `npm run update:world-cup` | Rebuild the checked-in World Cup 2026 snapshot |
| `npm run update:score-pools` | Rebuild the checked-in score-pools snapshot (fixtures, results, standings, capped odds history) |
| `npm run update:bay-area-transit` | Rebuild the checked-in Bay Area Transit (BART) snapshot |
| `npm run update:formula-1` | Rebuild the checked-in Formula 1 snapshot |
| `npm run update:frontier-models` | Rebuild the checked-in Frontier Models snapshot |
| `npm run update:github-trending` | Rebuild the checked-in GitHub Trending Pulse snapshot |
| `npm run update:tech-startups` | Rebuild the checked-in tech startup tracker snapshot from its curated seed |
| `npm run update:spacex` | Rebuild the checked-in SpaceX Mission Control data snapshot |
| `npm run update:spacex-images` | Rebuild cached SpaceX image snapshots and manifests |
| `npm run update:article-images` | Fetch license-safe blog cover photos per `scripts/data/articleCoverImages.ts` |
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
- `.github/workflows/update-score-pools.yml`
- `.github/workflows/update-bay-area-transit.yml`
- `.github/workflows/update-earthquake.yml`
- `.github/workflows/update-article-images.yml`
- `netlify/functions/purge-cache.ts`

Current behavior:

- `test.yml` runs unit tests, build, sharded Chromium Playwright E2E, and lint on pushes to `main` or `develop`, plus pull requests targeting `main` or `develop`; full-matrix Playwright runs only on pushes to `main`
- `changelog-on-merge.yml` appends a dated bullet to `CHANGELOG.md` on `main` for every merged pull request; add the `skip-changelog` label to opt a PR out. Snapshot-refresh bots push straight to `main` without a PR, so they never trigger it, and the commit lands with `[skip ci]` to avoid a trigger loop
- `update-investments.yml` runs on manual dispatch and weekdays at `22:15 UTC`, then commits refreshed compact snapshots under `public/data/investments`; raw provider responses are not committed
- `update-premier-league.yml` and `update-la-liga.yml` run every four hours during the season (August through May; skipped June and July)
- `update-fantasy.yml` runs daily July through September and weekly otherwise
- `update-github-trending.yml` runs on manual dispatch and daily at `07:45 UTC`, then commits `src/data/githubTrendingSnapshot.ts` when tracked repositories change
- `update-formula-1.yml` runs every three hours Thursday through Sunday and daily otherwise
- `update-spacex.yml` runs on manual dispatch and daily at `09:25 UTC` and `21:25 UTC`, then commits SpaceX data, manifest, image reference, and cached image artifacts when they change
- `update-mlb.yml` runs every four hours March through November
- `update-nba.yml` runs every four hours from mid-October through June
- `update-nfl.yml` runs on manual dispatch and Tuesdays September through February at `10:35 UTC`, then commits `src/data/nflSnapshot.ts` when it changes
- `update-golf.yml` runs every three hours Thursday through Sunday and daily otherwise
- `update-world-cup.yml` runs every 30 minutes during June and July
- `update-score-pools.yml` runs every six hours, requires both live provider tokens, and rejects provider-empty or stale live-league output
- `update-bay-area-transit.yml` runs on manual dispatch and every six hours year-round, then commits `src/data/bayAreaTransitSnapshot.ts` when it changes
- `update-earthquake.yml` runs on manual dispatch and daily at 06:20 UTC, then commits `src/data/earthquakeSnapshot.ts` when it changes — a fallback-seed refresh only, since the summary API fetches USGS live at request time
- `update-polling.yml` runs daily at 05:55 UTC as the fallback-seed refresh; day-to-day polling freshness comes from `netlify/functions/refresh-polling.ts`, a Netlify scheduled function that writes the VoteHub data to the `dashboard-snapshots` blob store every six hours and purges the `polling` CDN cache tag
- `audit-curated-data.yml` checks review dates, verification flags, and structural integrity across Frontier Models, Tech Startups, AI Dev Tools, Museum Log, Travel Deals, and Food Map every Monday
- `netlify/functions/refresh-frontier-models.ts` is a Netlify scheduled function (daily 07:30 UTC, no GitHub Action) that fact-checks the frontier-models seed against models.dev and OpenRouter, writes the result to the `dashboard-snapshots` Netlify Blobs store, and purges the `frontier-models` CDN cache tag; the committed seed stays the fallback
- The tech startup tracker has no workflow by design — its dataset is editorially curated, so refreshes happen by editing the seed and running `npm run update:tech-startups` locally
- All 16 snapshot `update-*.yml` workflows commit and push through the shared `scripts/ci/commit-and-push-snapshot.sh` helper (usage: `commit-and-push-snapshot.sh <commit-message> <pathspec...>`). It regenerates and stages sitemap freshness metadata with the snapshot, sets the `github-actions[bot]` identity, exits cleanly on a no-op refresh, and pushes to `HEAD:main` with a fetch/`rebase --autostash` retry loop (default 8 attempts, `SNAPSHOT_PUSH_ATTEMPTS` override) plus capped exponential backoff to absorb concurrent snapshot-bot pushes. Behavior is asserted by `.github/workflows/__tests__/snapshot-workflows.test.ts` and `update-investments.test.ts`.
- `publish-data.yml` coalesces successful refreshes, builds the site in GitHub Actions, uploads it with `netlify deploy --no-build` (free Actions minutes on a public repo, and a prebuilt upload does not spend Netlify's 300 monthly build minutes, which ran out on 2026-08-06), and verifies the full `/api/data-revisions` ledger before closing publication incidents. `scripts/ci/netlify-ignore.sh` keeps Netlify from building `main` or dependabot branches itself. Needs the `NETLIFY_AUTH_TOKEN` repository secret
- `purge-cache.ts` is protected by `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` and calls Netlify Durable Cache purge; query-string secrets are intentionally rejected
- Historical caveat: `vercel.json` still declares a cron for `/api/scheduled-update`, but no matching route exists. Treat that config as historical until confirmed.

For public fantasy updates, GitHub Actions is the source of truth.

---

## Writing Voice

`WRITING_VOICE.md` governs all user-facing text across the site, not just blog articles. This includes UI copy, page descriptions, bios, hero text, section headings, and any other text a user will read. Read it before editing or creating any text. Non-conforming copy should be rewritten to match it, not patched around it.

---

## Source of Truth Docs

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
- `SCORE_POOLS_ENGINE.md` — exact-score prediction engine and its data flow
- `docs/DATA_UPDATE_OPERATIONS.md` — command → artifact → schedule runbook

Older plans, redesign notes, and summary docs are kept for history. Check `docs/README.md` before treating a markdown file as current.
