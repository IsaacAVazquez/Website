# AGENTS.md

Operational context for agents working in this repo. Start here, then read `CLAUDE.md` for deeper implementation context.

**Last updated:** 2026-11-02

---

## Project Snapshot

This repo is a Next.js 16 personal site with several live product surfaces:

- portfolio and resume
- writing and long-form content
- fantasy football analytics
- investments and seasonal analysis experiments
- standalone sports, political, space, news, transit, and fintech data tools
- personal-interest tools such as travel planning, food, recipes, wine, museums, and a blackjack trainer

Primary live routes:

- `/`
- `/about`
- `/accessibility`
- `/privacy`
- `/portfolio` (`/portfolio/[slug]` only permanent-redirects each case study to its live tool)
- `/dashboards`
- `/investments`
- `/investments/before-you-buy`
- `/formula-1`
- `/fantasy-formula-1`
- `/github-trending-pulse`
- `/agent-build-index`
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
- `/writing`, `/writing/[slug]`, and `/writing/topics/[topic]`
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
- `/fintech-tools/rent-vs-buy`
- `/polling-aggregator`
- `/mba-internship-notifications`
- `/museum-log`
- `/arcade`
- `/blackjack-trainer`
- `/now`
- `/changelog` (renders the entries in `content/changelog/`, not the merged-PR log the changelog workflow appends to `CHANGELOG.md`)
- `/search`
- `/back-room/[discovery]` (noindexed easter-egg pages `receipt`, `transit`, `gallery`, `1997`, and `registration`) and `/teapot` (a route handler that answers 418); both are listed in `docs/EASTER_EGGS.md`

Canonical redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`

`redirects()` in `next.config.mjs` holds the full list, including the fantasy shortcuts and typos (`/ff`, `/rankings`, `/qb`), the retired project slugs, `/fintech-tools` to `/dashboards`, `/cv` and `/hire-me`, and the RSS aliases (`/rss`, `/feed`, `/feed.xml`, `/rss.xml`) for `/api/rss`.

`Writing` is live and promoted in the global header.

---

## Navigation and Shell

Header items (from `catalog97NavLinks` in `src/constants/catalog97Nav.ts`), the same seven links on every route:

1. `Home` (`/`)
2. `Work` (`/portfolio`)
3. `Writing` (`/writing`)
4. `Dashboards` (`/dashboards`)
5. `About` (`/about`)
6. `Résumé` (`/resume`)
7. `Contact` (`/contact`)

`Dashboards` also reads as the current section (`aria-current="true"`) on every route a portfolio case study links to and the pages below it, through `isDashboardRoute` and `DASHBOARD_ROUTES` in the same file, so `/score-pools`, `/arcade`, and the other utility routes leave it unmarked. `src/constants/__tests__/project-routes-complete.test.ts` fails if that list drifts from the case studies' links. The same test fails on any `page.tsx` route that is not one of the seven designed pages, at or below a `DASHBOARD_ROUTES` entry, or in the test's own `UTILITY_ROUTES` set, so a new page has to be placed in one of the three.

Shared shell files:

- `src/app/layout.tsx`
- `src/components/ConditionalLayout.tsx`
- `src/components/catalog97/Catalog97Shell.tsx` (the header, the one `main`, and the footer)
- `src/components/catalog97/Catalog97Header.tsx` (the header nav and its search button)
- `src/components/catalog97/Catalog97ToolShell.tsx`

Every route that is not one of the seven designed Catalog 97 pages renders inside `Catalog97ToolShell`.

Shell semantics:

- `Catalog97Shell` renders the only page-level `main` landmark (`#main-content`, the skip link's target). The seven designed pages render that shell themselves, and `ConditionalLayout` supplies it through `Catalog97ToolShell` for every other route
- route files and leaf sections should use `div` or `section` wrappers, not nested `main`
- every route should expose exactly one page-level `h1`

Catalog 97 routes:

- `/`, `/portfolio`, `/writing`, `/dashboards`, `/about`, `/resume`, `/contact` render their own `Catalog97Shell` and pass through `ConditionalLayout` untouched, so `isCatalog97Route` (`src/constants/catalog97Nav.ts`) is what tells `ConditionalLayout` to stand down for them
- every other route is wrapped in `Catalog97ToolShell`, which is `Catalog97Shell` plus the build-note aside on the routes `src/components/projectBuildNoteLinks.ts` lists, so it owns the same header, the same only `main`, and the same footer
- tokens live in `src/app/catalog97.css`, scoped under `[data-c97]` and `[data-c97-surface]`. The frame and the seven designed pages read `--c97-*` directly, and a project route may declare its own tokens inside the frame, as the fantasy football routes do with `--ffb-*`
- the Working Instrument `--home-*` tokens, its helpers, and the bridge that aliased them were deleted on 2026-09-27 when the unification closed, and `src/app/__tests__/catalog97-closeout.test.ts` keeps them from coming back

Footer:

- one footer now, the espresso `Catalog97Footer` inside `Catalog97Shell`, reached by every route through either branch of `ConditionalLayout`
- the old `Footer.tsx` component and its `compact`/`full` variants were deleted on 2026-09-16

---

## Guardrails

- Never hardcode hex colors in components. On the frame and the seven designed pages use the `--c97-*` tokens from `src/app/catalog97.css` through `data-c97-surface`, and the `c97-*` classes. A project route may read tokens of its own from its own stylesheet, and the fantasy football routes read `--ffb-*` from `src/components/fantasy/fantasy.css`. The Working Instrument `--home-*` tokens no longer exist.
- Server components take icons from `@/components/ui/ServerIcons` (inline SVG). The installed icon library is `lucide-react`. `@tabler/icons-react` (removed on 2026-08-11) and `better-sqlite3` (removed on 2026-04-22) are not dependencies, so do not add imports of either.
- Never create real pages at `/projects`, `/work`, or `/blog`.
- Keep 44px minimum touch targets for interactive elements.
- Entrances are CSS transitions; JS-driven motion reads `useReducedMotion()` from `src/hooks`.
- Shared portfolio-shell primitives must not use `transition-all`. Transition specific properties instead.
- Portfolio-shell routes must keep the primary message and main CTA visible in the initial mobile viewport whenever the route has a hero.
- Portfolio and writing cards should surface role, problem space, and impact in the default scan state.
- The `/portfolio` index is rendered by `src/components/catalog97/Catalog97Portfolio.tsx`, a server component that shows the first four projects in `PORTFOLIO_PROJECT_ORDER` as lead cards plus the Juno and Civitech write-ups, and points at `/dashboards` for the full inventory. The search field and category filter it carried until 2026-10-19 live on `/dashboards` only, and its sort select was dropped that day.
- `/api/search` is still limited and mostly hardcoded. Do not describe it as comprehensive site search.
- A dashboard page is cached at Netlify's CDN only when it is listed in `cdnCachedPages` in `next.config.mjs`, and it belongs there only when its server render reads no clock, random number, live data, or Netlify Blobs. `src/lib/__tests__/edge-cache-policy.test.ts` spells out the same list, so adding a page means editing that test too.
- Validate all persisted and restored user strings, and construct chart tooltips using text nodes or `textContent` to prevent script execution. Investment symbols show the pattern, since restored holdings and `/api/investments/quotes` both check them with `isValidSymbol` in `src/lib/investmentSymbol.ts`, which accepts 1 to 10 characters that start with a letter, with single `.` or `-` separators as in `BRK.B` and `BRK-B`.
- In dictionary and keyword lookups (like `/api/search`), always use `Object.hasOwn()` or `Map` to prevent prototype property resolution for inherited keys like `constructor`.

---

## API Surface

Confirm live API routes from `src/app/api/**/route.ts`. Current routes:

- `/api/data-revisions` (the production snapshot revision and freshness ledger, served with `Cache-Control: no-store`, and read by `publish-data.yml` after each deploy)
- `/api/bay-area-transit/summary` and `/api/bay-area-transit/stations/[stationId]`
- `/api/earthquake-pulse/summary`
- `/api/fantasy-data`
- `/api/formula-1/meetings/[meetingId]`
- `/api/golf/players/[playerId]`
- `/api/investments/quotes` (calls Finnhub at request time with `FINNHUB_API_KEY`, which `.env.example` does not list; without the key every quote comes back unavailable and the page shows the latest saved data)
- `/api/la-liga/teams/[teamId]`
- `/api/job-search` (a 404 unless the server is `next dev` with `JOB_SEARCH_PRIVATE_SYNC=1`, which `npm run dev` sets, and the request's `Host` is loopback; reads and writes the gitignored `private/job-search/` files for the local tracker)
- `/api/mba-jobs`
- `/api/mlb/teams/[teamId]`
- `/api/nba/teams/[teamId]`
- `/api/news-pulse`
- `/api/newsletter/subscribe` (POST only; creates a Resend contact at request time and answers 503 when neither `RESEND_CONTACTS_API_KEY` nor `RESEND_API_KEY` is set; see `docs/EMAIL_DELIVERY.md`)
- `/api/nfl/teams/[teamId]`
- `/api/premier-league/teams/[teamId]`
- `/api/rss`
- `/api/search`
- `/api/spacex/summary`, `/api/spacex/launches`, `/api/spacex/launches/[id]`
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

- Use Node 22 locally to match GitHub Actions. `.nvmrc` pins it, every workflow reads that file, and `package.json` requires 22.12 or newer.
- `npm run dev` runs `scripts/dev.cjs`, which starts `next dev --webpack` on `localhost` and sets `JOB_SEARCH_PRIVATE_SYNC=1` so the job-search tracker can sync with `private/job-search/`. Passing `--hostname`, or starting it with `JOB_SEARCH_PRIVATE_SYNC=0` as local Playwright runs do, leaves that sync off.
- `npm run update:investments` also requires `.venv/bin/python3`. Build that venv with Python 3.12, the version `scripts/requirements-investments.txt` is compiled for and the one `update-investments.yml` sets up. After the 2026-10-02 dependency bumps, pip found no matching contourpy or numpy distribution on 3.11, which failed every refresh from 2026-10-03 until the workflow moved to 3.12 in PR #581 on 2026-10-10 (issue #562).
- `npm run update:football`, `npm run update:premier-league`, and `npm run update:la-liga` use `FOOTBALL_DATA_API_TOKEN` only when rebuilding checked-in football snapshots. The football pages never call the provider at request time. `src/lib/premierLeagueSnapshot.ts` and `src/lib/laLigaSnapshot.ts` each have a `preferLive` refresh path, but no caller passes it, so the pages always serve the committed snapshots.
- `npm run update:mlb`, `npm run update:nba`, `npm run update:nfl`, `npm run update:golf`, and `npm run update:world-cup` use public sports data sources and do not require auth tokens.
- `npm run update:bay-area-transit` uses BART's public legacy API. Set the optional `BART_API_KEY` (free registration at api.bart.gov/api/register.aspx) to replace the published demo-key fallback; no token setup is required to get started.
- `npm run update:tech-startups` processes a hand-maintained seed inside `scripts/buildTechStartupSnapshot.ts`; there is no live source to poll.
- `npm run update:formula-1` reads historical OpenF1 endpoints and does not require an API key.
- `npm run update:github-trending` reads the public GitHub Search API. GitHub Actions passes `GITHUB_TOKEN` for higher rate limits.
- `npm run update:spacex` and `npm run update:spacex-images` read public Launch Library / SpaceDevs endpoints. An API key is not strictly required, but the anonymous tier is heavily rate limited (shared CI IPs get 429'd fast, which silently freezes the snapshot), so set the optional `SPACEDEVS_API_TOKEN` to authenticate and raise the limit. Since 2026-06-18 the `update-spacex.yml` workflow also fails loudly when the snapshot is more than 4 days old.
- `npm run update:frontier-models` rebuilds `src/data/frontierModelsSnapshot.json` from `scripts/data/frontierModels.source.ts`.
- If the investments fetch step fails on imports, install the pinned Python packages with `.venv/bin/pip install -r scripts/requirements-investments.txt`. That file is the one place the `defeatbeta-api` version is set.

### Day-to-day verification

- Use `npm run lint` for ESLint.
- Use `npm run typecheck` for the TypeScript check CI runs before the build.
- Use `npm test` or targeted Jest runs while iterating.
- An edit to the body text of an existing article in `content/blog/` needs a new `updatedAt` in the same change, or CI's `npm run check:blog-dates` step fails. The new date also moves that post's entry in `public/sitemap.xml`, so run `npm run generate:sitemap` too, or `src/lib/__tests__/sitemap-consistency.test.ts` fails.
- Use `npm run test:e2e` for default Playwright end-to-end coverage, which is the Chromium project only; use `npm run test:e2e:full` for the full browser matrix, which adds Firefox, WebKit, and two mobile projects. Outside CI, Playwright starts `npm run dev` with `JOB_SEARCH_PRIVATE_SYNC=0`, but it reuses any server already answering on `E2E_PORT` (then `PORT`, default 3000), so a dev server left running from another checkout is the one it tests.
- Use `npm run build` before shipping route, config, or deployment-affecting changes.

### Fantasy surface

The eight fantasy routes are one product on a kit of their own. `src/app/fantasy-football/layout.tsx` wraps them in the kit's root (`ffb-root`), loads the product's typeface, and renders the product bar that links the eight tools. The kit is `src/components/fantasy/fantasy.css`, with `--ffb-*` tokens and `ffb-` classes inside `@layer components`. Each page or family of shared parts has an unlayered area sheet (`fantasy-<area>.css`) in `src/components/fantasy/` beside the kit, with a class prefix of its own, and `src/app/fantasy-football/__tests__/print-shop-rules.test.ts` fails a selector that starts on anything but that prefix or `.ffb-root`. A draft room imports the scorebug, the last picks, the roster, and the pick grid from `src/components/fantasy/DraftRoomParts.tsx` and does not copy their markup. All eight routes are in `WIDE_TOOL_ROUTES` (`src/constants/catalog97Nav.ts`), beside `/bay-area-transit`, `/investments`, and `/score-pools`. Read `docs/FANTASY_FOOTBALL_KIT.md` before writing markup for one of these pages. The spec is `docs/superpowers/specs/2026-10-13-fantasy-football-redesign-design.md`.

The fantasy-football surface keeps redraft and best ball separate. `/fantasy-football` and `/fantasy-football/draft-tracker` use the scoring-specific redraft snapshots through `useFantasySnapshot`. `/fantasy-football/best-ball` and `/fantasy-football/best-ball/draft-tracker` use `public/data/fantasy/best-ball.json` through `useBestBallSnapshot`, with contest rules and recommendations from `src/lib/bestBall/`. The best ball snapshot combines best ball consensus rankings, a separate half PPR Superflex consensus board that orders the Superflex contest, current Underdog ADP, bye weeks, and Week 17 opponents. Best ball draft state uses its own season-and-contest storage keys and does not read or overwrite the redraft draft state.

`/fantasy-football/weekly` and `/fantasy-football/waivers` are the in-season surfaces. Both read `public/data/fantasy/weekly.json` through the shared weekly client and `useFantasyWeeklySnapshot`. The file does not exist before Week 1, so the hook treats a 404 as a not-published state rather than an error. The other six fantasy routes show a dated `SeasonalScopeNote` from Week 1. On the five draft boards it says the board is the preseason market kept for reference, and on the trade calculator it says which market the estimate is pricing.

The weekly board draws its rows in tiers the way the redraft rankings board below does, through the shared `TierSection` and `ExpertSpread` in `src/components/fantasy/TierSection.tsx`, with tiers computed by `src/lib/fantasyWeeklyTiers.ts` because FantasyPros publishes none for weekly boards.

The redraft rankings board groups its rows under tier breaks that carry the tier's count, rank range, and average-rank cliff, and draws an expert spread plot on each row. One pinned block holds the toolbar and the column heads, with the deep-linkable position switch, the PPR, Half PPR, and Standard scoring switch, the consensus or VORP ranking method, and per-board search (`?position=`, `?scoring=`, `?ranking=`, `?teams=`, `?q=`). While the ADP source is current the board adds ADP and vs ADP columns, and the board's own player drawer adds a market verdict. Shared components live in `src/components/fantasy/`, which has no `index.ts`, so each is imported by its file path; three cross-surface browser-local stores live in `src/hooks/use{PlayerQueue,PlayerNotes,CompareTray}.ts` over `useLocalStorageString.ts`, with parse/serialize helpers and key constants in `src/lib/fantasyLocal.ts`. Board math, formatting, and tooltip copy are in `src/lib/fantasyUtils.ts`; the pure redraft signal engine is `src/lib/draftAnalytics.ts`. LocalStorage keys include `fantasy-player-queue-v1`, `fantasy-player-notes-v1`, and `fantasy-compare-v1`; per-season redraft state persists under `fantasy-draft-tracker-v3-<season>`.

`/fantasy-football/trade-calculator` is a one-QB redraft estimate. Before the season it reads the same overall consensus and mock-draft ADP snapshot, and from Week 1 it reads the rest-of-season board in `weekly.json` and this season's scoring. `src/lib/fantasyTrade.ts` converts each source to a league-specific replacement-relative index, keeps the two readings separate, and reports sensitivity and input coverage. It is not a dynasty, creator-specific, projected-points, or win-probability model. Selected player IDs persist under `fantasy-trade-calculator-v1-<season>-<scoring>` and are mirrored into the `give` and `get` URL params so a deal can be shared, and on first load a shared link's known player IDs replace the stored deal. Scoring, team count, roster size, and lineup preset stay in the URL as `scoring`, `teams`, `rosterSize`, and `lineup`.

`/fantasy-football/mock-draft` is a one-QB practice room on the same redraft snapshots, read through `useFantasySnapshot`. The simulated teams pick around the user through the seeded engine in `src/lib/mockDraft.ts`, so a room replays from its seed and resumes from localStorage under `fantasy-mock-draft-v1-<season>`. The recap shows the board grid and a value report.

Both draft trackers derive a room-relative Draft Outlook from `src/lib/fantasyTeamValue.ts`. The model uses actual pick number against ADP or format rank, roster shape, lineup or stack fit, and weekly bye lineup coverage, with explicit component weights and input coverage. `src/components/fantasy/DraftValuePanel.tsx` renders the shared room rank, draft-slot turn context, published Best Ball Mania VII field economics, and a user-entered expected return calculator. The Draft Outlook is an ordinal draft-process model. Do not describe it as projected points, win probability, or roster-specific payout EV. Those outputs require weekly player distributions and a calibrated field simulation that the current snapshots do not contain. The current contract and limits are in `docs/FANTASY_DRAFT_MODEL.md`.

### Fantasy data workflow

Primary npm entry point:

- `npm run update:fantasy`

The command chains `npm run update:fantasy:redraft` (steps 1 to 5), `npm run update:fantasy:best-ball` (step 6), and `npm run update:fantasy:weekly` (step 7), so it runs this seven-step pipeline:

1. `tsx scripts/buildFantasyPositionData.ts`
2. `tsx scripts/buildFantasyAdpData.ts`
3. `tsx scripts/buildFantasyGameLogData.ts`
4. `tsx scripts/buildFantasyVorpData.ts`
5. `tsx scripts/buildFantasySnapshots.ts`
6. `tsx scripts/buildBestBallSnapshot.ts`
7. `tsx scripts/buildFantasyWeeklySnapshot.ts`

Steps 2, 3, and 4 are fail-soft overlays on the consensus board. Each keeps its
previous generated data on a failed or rejected fetch (VORP per scoring format and
team size, same season only) and never stops the chain; a board with nothing usable
is left out of the snapshot and the site hides the VORP toggle for that league size.

Current generated outputs:

- `src/data/fantasyPositionData.generated.json`
- `src/data/fantasyAdpData.generated.json`
- `src/data/fantasyGameLogData.generated.json`
- `src/data/fantasyVorpData.generated.json`
- `src/data/fantasyRankHistory.generated.json`
- `src/data/fantasySnapshotRevision.generated.ts`
- `public/data/fantasy/ppr.json`
- `public/data/fantasy/half_ppr.json`
- `public/data/fantasy/standard.json`
- `public/data/fantasy/best-ball.json`
- `public/data/fantasy/weekly.json` when the in-season board is published

The old RB tier route redirects to the canonical fantasy board.

Operational note: `.github/workflows/update-fantasy.yml` commits the real fantasy snapshot artifacts above. It runs with a 45-minute job timeout budget, builds and commits the weekly board before the draft lanes, and restores any redraft or best ball output that failed its gates before committing the rest. Production picks the commits up through `publish-data.yml`. There is no live Netlify scheduled fantasy updater; GitHub Actions is the public update path.

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

Only the index and compacted snapshots under `public/` ship with deploys and are committed by the refresh workflow. Raw per-section files stay in the `data/investments-raw/` workspace as transient builder inputs. That directory is gitignored and has no tracked files, and the refresh workflow's narrowed `public/data/investments` pathspec keeps raw files out of automated commits. When a symbol fetch fails, the builder keeps its committed snapshot and original freshness metadata.

Since 2026-07-20 the refresh rejects a symbol when its latest market date is more than seven calendar days old (`MAX_PRICE_AGE_DAYS` overrides the seven), even if the provider returned a non-empty price array. The index records per-symbol `priceAsOf` plus aggregate `priceHealth`, and the UI reports recent and delayed histories separately from snapshot build time. The legacy EPS-based DCF and its Buy/Hold/Sell output are disabled until a statement-backed model replaces them. Current provider, licensing, and migration decisions live in `docs/INVESTMENTS_DATA_SOURCES.md`.

Prices refresh for every symbol on every run. The other sections rotate, 31 to 62 of the 151 symbols a run in September 2026, so they turn over about once a week. The industry section is fetched last, and a timeout inside it costs that one section while the symbol keeps the rest. The workflow fails after the commit when any symbol is more than 21 days past its last full fetch.

### Football dashboard data workflow

The football dashboards read committed JSON snapshots at runtime, each through the typed `.ts` module beside it in `src/data/`. The token is only needed when rebuilding those snapshots.

`npm run update:football` refreshes both leagues by running the two league refreshes below one after the other, with a 30-second pause between them:

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
- Premier League snapshot output: `src/data/premierLeagueSnapshot.json`
- La Liga snapshot output: `src/data/laLigaSnapshot.json`

Production builds consume the committed football snapshots without calling football-data.org. Refreshes run only through the explicit commands and scheduled workflows above.

### US sports dashboard data workflow

The MLB, NBA, NFL, golf, and World Cup dashboards read committed JSON snapshots at runtime, each through the typed `.ts` module beside it in `src/data/`. They refresh through dedicated GitHub Actions workflows and can also be refreshed manually.

- `npm run update:mlb` writes `src/data/mlbSnapshot.json` from the public MLB Stats API.
- `npm run update:nba` writes `src/data/nbaSnapshot.json` from ESPN public NBA endpoints.
- `npm run update:nfl` writes `src/data/nflSnapshot.json` from NFLverse open data.
- `npm run update:golf` writes `src/data/golfSnapshot.json` from the public ESPN golf leaderboard endpoint; a failed fetch keeps the previous snapshot. Between tournaments ESPN lists only the next event with no field posted, and the builder restamps the last final board's `generatedAt` only when the tournament status is verified final and completed within 45 days; incomplete boards keep their original timestamp so freshness gates do not falsely mark in-progress results as current.
- `npm run update:world-cup` writes `src/data/worldCupSnapshot.json` from ESPN's public `soccer/fifa.world` endpoints; a failed or empty fetch keeps the previous snapshot.

### Other data refresh workflows

- `npm run update:formula-1` writes `src/data/formula1Snapshot.json` from OpenF1 data and keeps the existing snapshot if refresh fails. From 45 minutes before a session starts to 45 minutes after it ends, a margin around the window when OpenF1 closes to anonymous callers, it keeps the snapshot on purpose and reports `live_lock=true`, and the workflow then skips its freshness check.
- `npm run update:earthquake` writes `src/data/earthquakeSnapshot.json` from the USGS public GeoJSON feeds, with no token, and keeps the existing snapshot if the fetch fails. `/api/earthquake-pulse/summary` fetches USGS live, so this file is its fallback seed.
- `npm run update:polling` writes the fallback seed `src/data/pollingSnapshot.json` from the VoteHub API through `src/lib/pollingData.ts`, the same code `netlify/functions/refresh-polling.ts` runs every six hours into the `dashboard-snapshots` blob store.
- `npm run update:bay-area-transit` writes `src/data/bayAreaTransitSnapshot.json` from BART's public API (stations, lines, advisories, elevator outages, real-time departures); a failed or thin fetch keeps the previous snapshot.
- `npm run update:github-trending` writes `src/data/githubTrendingSnapshot.json` from the GitHub Search API; use `GITHUB_TOKEN` or `GH_TOKEN` locally for higher rate limits.
- `npm run update:tech-startups` writes `src/data/techStartupSnapshot.json` from the hand-maintained seed in `scripts/buildTechStartupSnapshot.ts`. The dataset is editorially curated with an `asOf` date and `verified: false` flag; refresh it by editing the seed, not by polling an API.
- `npm run update:frontier-models` writes `src/data/frontierModelsSnapshot.json` from the curated source file in `scripts/data/`.
- `npm run update:score-pools` writes `src/data/scorePoolsSnapshot.json` from The Odds API (`THE_ODDS_API_KEY`) and API-Football (`API_FOOTBALL_KEY`), merged with manual entries in `scripts/data/scorePools.manual.ts` and CSV drops in the optional `scripts/data/score-pools/` folder (one `<league-key>.csv` per league; the builder skips the folder when it is absent, and none is checked in as of 2026-11-02). Since PR #629 merged on 2026-10-21, the builder runs the quality check in `scripts/verifyScorePoolsSnapshot.ts` before it writes and refuses provider-empty, sample-only, or stale live-league output, so a run without both tokens, local or scheduled, exits nonzero and leaves the committed snapshot in place. Odds history is append-only and capped per fixture so line movement stays queryable. See `SCORE_POOLS_ENGINE.md`.
- `npm run update:spacex` writes `src/data/spacexSnapshot.generated.json`.
- `npm run update:spacex-images` writes `src/data/spacexImageManifest.generated.json`, `public/data/spacex/image-reference-index.json`, and cached image files under `public/data/spacex/images/`.
- `./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts [inbox.json ...]` pulls the live job boards of every company in `src/constants/mba-companies.ts` whose `atsType` is not `manual` (plus Adzuna leads when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are set), filters against `private/job-search/targets.json`, drops existing pipeline and candidate records, merges any inbox files named on the command line, and writes `private/job-search/candidates.json` (local manual only, personal gitignored folder; see `docs/JOB_SEARCH_PRIVATE_DATA.md`).

### Article cover image workflow

- `npm run update:article-images` gives blog posts a real, license-safe cover photo in place of the generated `/writing/<slug>/opengraph-image` card, per the plan in `scripts/data/articleCoverImages.ts` (one entry per published slug). It fetches freely licensed photos from Wikimedia Commons, saves them under `public/images/writing/covers/`, and writes the `coverImage*` frontmatter. Pass its flags after `--`, as in `npm run update:article-images -- --only=<slug>` when publishing a single post, with `--force` to re-fetch or `--dry-run` to preview.
- The agent sandbox blocks image hosts, so this runs in the `update-article-images.yml` Action or on a networked machine, not in-session. Adding a post means adding its plan entry in the same change; abstract pieces intentionally keep the editorial card. Full runbook: `docs/ARTICLE_IMAGE_WORKFLOW.md`.

### Build and asset workflow

- `npm run build` runs `next build --webpack` and npm `postbuild`; it does not refresh data
- `npm run typecheck` runs the standalone TypeScript gate enforced by CI
- `postbuild` runs `npm run generate:sitemap` (`scripts/generatePublicSitemap.mjs`, which writes `public/sitemap.xml`), then `npm run build:llms` (`scripts/buildLlmsFull.mjs`, which writes `public/llms-full.txt`), then `scripts/patch-nft-sharp.mjs`
- `public/sitemap.xml` and `public/llms-full.txt` are committed files, and `src/lib/__tests__/sitemap-consistency.test.ts` fails when the committed sitemap lags `src/lib/sitemap.js`
- `npm run analyze` enables bundle analysis and still runs the npm `postbuild` hook
- `npm run build:analyze` runs `ANALYZE=true next build --webpack` directly and skips npm `postbuild`

---

## Command Reference

| Command | Use |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on `localhost` through `scripts/dev.cjs`, with the private job-search file sync on |
| `npm run build` | Production build plus the `postbuild` sitemap, `llms-full.txt`, and NFT patch steps; consumes committed snapshots |
| `npm run typecheck` | Run the standalone TypeScript gate enforced by CI |
| `npm run postbuild` | Regenerate the public sitemap and `public/llms-full.txt`, then run the NFT sharp patch; runs automatically after build |
| `npm run generate:sitemap` | Regenerate `public/sitemap.xml` from `src/lib/sitemap.js` (the first `postbuild` step) |
| `npm run build:llms` | Rebuild `public/llms-full.txt` from the profile text and representative articles named in `scripts/buildLlmsFull.mjs` (the second `postbuild` step) |
| `npm run submit:indexnow` | Post every URL in `public/sitemap.xml` to IndexNow, or only validate the payload with `--dry-run`; no workflow runs it |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint against `src` |
| `npm run check:blog-dates -- --base=<revision>` | Fail when an existing article's body changed since `<revision>` without a new `updatedAt`; CI runs it before the unit tests |
| `npm test` | Run Jest |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run test:ci` | CI-friendly Jest run with coverage and reduced workers |
| `npm run test:e2e` | Run Playwright end-to-end tests in the Chromium project only |
| `npm run test:e2e:full` | Run the full Playwright browser matrix (`E2E_FULL_MATRIX=1`) |
| `npm run test:e2e:ui` | Open Playwright UI mode |
| `npm run test:e2e:debug` | Run Playwright in debug mode |
| `npm run test:all` | Run coverage plus E2E tests |
| `npm run analyze` | Analyzer-enabled build that still runs npm `postbuild` |
| `npm run build:analyze` | Analyzer-enabled `next build` without npm `postbuild` |
| `npm run build:fantasy-companion` | Build the private fantasy draft companion extension into `extension/dist` with packaged snapshot copies; not part of the site build. See `docs/FANTASY_DRAFT_COMPANION.md` |
| `npm run update:fantasy` | Run the redraft, best ball, and weekly lanes in order (position data, ADP, per-game scoring, VORP, the redraft snapshots and rolling rank movement history, the best ball snapshot, and the weekly board) |
| `npm run update:fantasy:redraft` | Fantasy steps 1 to 5, the redraft snapshots and the generated data they read |
| `npm run update:fantasy:best-ball` | Rebuild `public/data/fantasy/best-ball.json` |
| `npm run update:fantasy:weekly` | Rebuild the in-season `public/data/fantasy/weekly.json` |
| `npm run update:investments` | Fetch investment data and build compact snapshots |
| `npm run update:football` | Rebuild both Premier League and La Liga snapshots |
| `npm run update:premier-league` | Rebuild the checked-in Premier League snapshot |
| `npm run update:la-liga` | Rebuild the checked-in La Liga snapshot |
| `npm run update:mlb` | Rebuild the checked-in MLB snapshot |
| `npm run update:nba` | Rebuild the checked-in NBA snapshot |
| `npm run update:nfl` | Rebuild the checked-in NFL snapshot |
| `npm run update:golf` | Rebuild the checked-in golf leaderboard snapshot |
| `npm run update:world-cup` | Rebuild the checked-in World Cup 2026 snapshot |
| `npm run update:score-pools` | Rebuild the checked-in score-pools snapshot (fixtures, results, standings, capped odds history); writes nothing without both provider keys |
| `npm run update:bay-area-transit` | Rebuild the checked-in Bay Area Transit (BART) snapshot |
| `npm run update:earthquake` | Rebuild the checked-in earthquake fallback snapshot from the USGS feeds |
| `npm run update:polling` | Rebuild the checked-in polling fallback seed from VoteHub |
| `npm run update:formula-1` | Rebuild the checked-in Formula 1 snapshot |
| `npm run update:frontier-models` | Rebuild the checked-in Frontier Models snapshot |
| `npm run update:github-trending` | Rebuild the checked-in GitHub Trending Pulse snapshot |
| `npm run update:tech-startups` | Rebuild the checked-in tech startup tracker snapshot from its curated seed |
| `npm run update:spacex` | Rebuild the checked-in SpaceX Mission Control data snapshot |
| `npm run update:spacex-images` | Rebuild cached SpaceX image snapshots and manifests |
| `npm run update:article-images` | Fetch license-safe blog cover photos per `scripts/data/articleCoverImages.ts` |

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
- `.github/workflows/update-polling.yml`
- `.github/workflows/audit-curated-data.yml`
- `.github/workflows/changelog-on-merge.yml`
- `.github/workflows/publish-data.yml`
- `.github/workflows/refresh-snapshot.yml` (the reusable refresh job, described below)

Current behavior:

- `test.yml` runs the writing date review (`npm run check:blog-dates`) and unit tests, the TypeScript check and build, sharded Chromium Playwright E2E, and lint on pushes to `main` or `develop`, plus pull requests targeting `main` or `develop`; full-matrix Playwright runs only on pushes to `main`, and a failure there opens or updates an `e2e-matrix-failure` issue
- `changelog-on-merge.yml` appends a dated bullet to `CHANGELOG.md` on `main` for every merged pull request; add the `skip-changelog` label to opt a PR out. Snapshot-refresh bots push straight to `main` without a PR, so they never trigger it, and the commit lands with `[skip ci]` to avoid a trigger loop
- `update-investments.yml` runs on manual dispatch and Tuesday through Saturday at `08:30 UTC`, after the provider's dataset for the prior trading day lands (05:53 UTC on 2026-09-28), then commits refreshed compact snapshots under `public/data/investments`; raw provider responses are not committed. The run fails when fewer than 95% of symbols carry a recent price
- `update-premier-league.yml` and `update-la-liga.yml` run every four hours during the season (August through May; skipped June and July). They share one concurrency group, since both spend the same football-data.org request budget
- `update-fantasy.yml` runs daily at 17:17 UTC July through December and January 1 through 12, on Wednesdays January through June, and on Sundays at 11:47 UTC September through January so the weekly board is current before kickoff. It builds and commits the weekly board first, and it discards redraft or best ball files that failed their gates so a later lane never commits them
- `update-github-trending.yml` runs on manual dispatch and daily at `07:45 UTC`, then commits `src/data/githubTrendingSnapshot.json`, which changes on every successful run because each one stamps a new `generatedAt`
- `update-formula-1.yml` runs every three hours Thursday through Sunday and daily otherwise
- `update-spacex.yml` runs on manual dispatch and daily at `09:25 UTC` and `21:25 UTC`, then commits SpaceX data, manifest, image reference, and cached image artifacts when they change
- `update-mlb.yml` runs every four hours from March 20 through November 6
- `update-nba.yml` runs every four hours from mid-October through June
- `update-nfl.yml` runs on manual dispatch and daily September through February at `10:35 UTC`, then commits `src/data/nflSnapshot.json` when it changes
- `update-golf.yml` runs every three hours Thursday through Sunday and daily otherwise
- `update-world-cup.yml` has no schedule, since the tournament ended, and runs on manual dispatch only. Its gate job still skips the refresh unless the run falls between two days before the snapshot's `startDate` and three days after its `endDate`
- `update-score-pools.yml` runs every six hours. Until both provider keys are set as repository secrets it skips the refresh and passes with a notice. With the keys set it rejects provider-empty or stale live-league output
- `update-bay-area-transit.yml` runs on manual dispatch and every six hours year-round, then commits `src/data/bayAreaTransitSnapshot.json` when it changes
- `update-earthquake.yml` runs on manual dispatch and daily at 06:20 UTC, then commits `src/data/earthquakeSnapshot.json` when it changes — a fallback-seed refresh only, since the summary API fetches USGS live at request time
- `update-polling.yml` runs daily at 05:55 UTC as the fallback-seed refresh; day-to-day polling freshness comes from `netlify/functions/refresh-polling.ts`, a Netlify scheduled function that writes the VoteHub data to the `dashboard-snapshots` blob store every six hours
- `update-article-images.yml` runs on manual dispatch (with optional `only` slugs and a `force` flag) and every Monday at 06:40 UTC to backfill covers for new articles, then commits `public/images/writing/covers/` and the `content/blog` frontmatter it changed. It is the one update workflow that still posts a Netlify build hook (`NETLIFY_BUILD_HOOK`) after a commit, and `snapshot-workflows.test.ts` skips it by name when it checks that the other update workflows do not
- `audit-curated-data.yml` checks review dates and structural integrity every Monday across Frontier Models, Tech Startups, AI Dev Tools, Museum Log, Travel Deals, Food Map, the retirement planner's capital market assumptions, the rent versus buy tax constants, and the March Madness page. A dataset fails on age or structure, and the verified flag is a label that never fails it. A failing run writes its report into the body of the `curated-data-review` issue and ends red
- `netlify/functions/refresh-frontier-models.ts` is a Netlify scheduled function (daily 07:30 UTC, no GitHub Action) that fact-checks the frontier-models seed against models.dev and OpenRouter, and writes the result to the `dashboard-snapshots` Netlify Blobs store; the committed seed stays the fallback. A fact listed in a model's `pinnedFacts` keeps its curated value, which is how a price read from the provider's own page survives a catalog that states it differently
- The tech startup tracker has no workflow by design — its dataset is editorially curated, so refreshes happen by editing the seed and running `npm run update:tech-startups` locally
- Thirteen `update-*.yml` lanes (bay-area-transit, earthquake, formula-1, github-trending, golf, la-liga, mlb, nba, nfl, polling, premier-league, score-pools, world-cup) are callers of the reusable `refresh-snapshot.yml`, which carries the shared job body; World Cup and score pools put a gate job in front of it, and fantasy, investments, SpaceX, and article images keep their own. The shared body runs `npm run update:<id>` and then `scripts/verifyDataRefresh.ts <id>`, which fails the run when the lane's artifact, registered in `scripts/dataRefreshRegistry.ts`, has no usable source date, is older than its limit in `src/lib/dataFreshnessPolicy.ts`, or falls under the registry's count minimums. Fantasy, investments, and SpaceX call the same verifier from their own jobs. Every refresh lane except article images opens or updates a failure issue under its own label through `scripts/ci/failure-issue.cjs`, and the next green run closes it. All of them commit and push through the shared `scripts/ci/commit-and-push-snapshot.sh` helper (usage: `commit-and-push-snapshot.sh <commit-message> <pathspec...>`). It regenerates and stages sitemap freshness metadata with the snapshot, sets the `github-actions[bot]` identity, exits cleanly on a no-op refresh, and pushes to `HEAD:main` with a fetch/`rebase --autostash` retry loop (default 8 attempts, `SNAPSHOT_PUSH_ATTEMPTS` override) and a wait between attempts that grows with each one (attempt squared times two seconds, capped at 30, plus up to four seconds of jitter) to absorb concurrent snapshot-bot pushes. A rebase conflict confined to `public/sitemap.xml` is resolved by regenerating the sitemap, and any other conflict fails the run. Behavior is asserted by `.github/workflows/__tests__/snapshot-workflows.test.ts` and `update-investments.test.ts`.
- `publish-data.yml` runs on pushes to `main`, at 01:15, 07:15, 13:15, and 19:15 UTC, and on manual dispatch. Refresh commits carry `[skip ci]` and do not trigger it, so each scheduled run coalesces the refreshes that landed since the last one. It builds and uploads the site with one `netlify deploy --prod --context production` command run in GitHub Actions (free Actions minutes on a public repo, and a build that never runs on Netlify's infrastructure does not spend its 300 monthly build minutes, which ran out on 2026-08-06), tries that command up to three times, and verifies the full `/api/data-revisions` ledger before closing publication incidents. The build and the upload stay one command on purpose, since a separate `netlify build` lets `@netlify/plugin-nextjs` swap its static output back out before the upload reads it, which served an unstyled site on 2026-08-20, and `scripts/ci/verify-deploy-assets.mjs` then asks the Netlify API whether the deploy stored its static assets. It reads the ledger from the Netlify origin, `isaacvazquez.netlify.app`, because Cloudflare challenges runner traffic on the custom domain. `scripts/ci/netlify-ignore.sh` keeps Netlify from building `main` or dependabot branches itself. Needs the `NETLIFY_AUTH_TOKEN` repository secret
- `.github/dependabot.yml` opens weekly Monday update pull requests for npm (grouping `next`, `react`, and the testing packages), GitHub Actions, and the pinned investments requirements in `scripts/`

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
- `DESIGN_CHECKLIST.md` (the single pre-merge UI checklist)
- `SEO.md`
- `WRITING_VOICE.md`
- `docs/README.md`

Subsystem references:

- `SNAPSHOT_DRIVEN_DASHBOARDS.md`: shared snapshot-driven dashboard pattern
- `PERSONAL_INTEREST_TOOLS.md`: browser-persisted localStorage tools
- `RETIREMENT_PLANNER_ENGINE.md`: pure retirement projection engine
- `SCORE_POOLS_ENGINE.md`: exact-score prediction engine and its data flow
- `docs/DATA_UPDATE_OPERATIONS.md`: command → artifact → schedule runbook
- `docs/FANTASY_FOOTBALL_KIT.md`: the kit the eight fantasy football pages draw with
- `docs/FANTASY_DRAFT_MODEL.md`: every fantasy draft and trade metric, its formula, and its limits
- `docs/FANTASY_DRAFT_COMPANION.md`: the private Chrome and Edge draft side panel
- `docs/ARTICLE_IMAGE_WORKFLOW.md`: blog cover-image plan and fetch builder
- `docs/INVESTMENTS_DATA_SOURCES.md`: investments provider, licensing, and migration decisions
- `docs/BEFORE_YOU_BUY.md`: the comparison model and saved state behind `/investments/before-you-buy`
- `docs/PROJECT_TOOL_WORKFLOWS.md`: the saved workflows added to six project tools on 2026-10-22, with their storage keys
- `docs/JOB_SEARCH_PRIVATE_DATA.md`: private job-search data contract and the development sync route
- `docs/EASTER_EGGS.md`: every easter egg, its trigger, and its code; update it in any change that adds, alters, or removes one
- `docs/TODO.md`: open items that need Isaac or a scheduled run; add blocked work there and delete an item when it is done

Older plans, redesign notes, and summary docs are kept for history. Check `docs/README.md` before treating a markdown file as current.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
