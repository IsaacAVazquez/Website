# CLAUDE.md

Comprehensive repo context for agents and collaborators working in `/Users/isaacvazquez/Website`.

**Last updated:** 2026-05-04

---

## Platform Overview

This codebase is a multi-surface Next.js 16 site for Isaac Vazquez. It combines several distinct product surfaces inside one app:

1. **Portfolio site** — homepage, about, projects, resume, contact
2. **Writing surface** — long-form MDX posts under `/writing`
3. **Fantasy football analytics** — rankings, tiers, and draft tooling
4. **Investments + seasonal experiments** — `/investments` and `/march-madness-2026`
5. **Experimental dashboards** — standalone tools like `/formula-1`, `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, `/polling-aggregator`, `/news-pulse`, `/github-trending-pulse`, and `/spacex-mission-control`
6. **Fintech tools** — standalone calculators under `/fintech-tools/*`
7. **MBA internship tracker** — live role aggregator at `/mba-internship-notifications`, surfaced through the projects section

The site is not a generic blog template. It is a portfolio-first experience with secondary authority-building content.

---

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- D3 for charting (football dashboards, Formula 1)
- `next-themes` for dark mode
- NextAuth v4 for `/admin`
- Netlify deployment via `@netlify/plugin-nextjs`

Key scripts:

```bash
npm run dev
npm run build
npm test
npm run test:e2e
npm run update:fantasy
npm run update:investments
npm run update:football
npm run update:premier-league
npm run update:la-liga
npm run update:mlb
npm run update:nba
npm run update:nfl
npm run update:formula-1
npm run update:github-trending
npm run update:spacex
npm run lint
```

Note: `prebuild` automatically runs a league-only football snapshot refresh; `postbuild` runs `next-sitemap`.

---

## Route Map

### Core portfolio

- `/`
- `/about`
- `/portfolio`
- `/portfolio/[slug]`
- `/resume`
- `/contact`
- `/accessibility`

### Writing

- `/writing`
- `/writing/[slug]`

### Investments and seasonal analysis

- `/investments`
- `/march-madness-2026`

### Experimental dashboards

- `/formula-1`
- `/github-trending-pulse`
- `/premier-league`
- `/la-liga`
- `/mlb`
- `/nba`
- `/nfl`
- `/golf`

### Fantasy football

- `/fantasy-football`
- `/fantasy-football/tiers/[position]`
- `/fantasy-football/rb-tiers`
- `/fantasy-football/draft-tracker`

### AI / knowledge surfaces

- `/ai-dev-tools`
- `/frontier-models`
- `/decision-lab`

### Personal interest surfaces

- `/food-map`
- `/recipe-finder`
- `/wine-cellar`

### Other live routes

- `/news-pulse`
- `/github-trending-pulse`
- `/spacex-mission-control`
- `/fintech-tools/budget-planner`
- `/fintech-tools/interchange-iq`
- `/polling-aggregator`
- `/mba-internship-notifications`
- `/museum-log`
- `/now`
- `/changelog`

### Utility/admin

- `/search`
- `/admin`

Redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`
- several fantasy-football shortcuts and typo redirects live in `next.config.mjs`

---

## Current Navigation And Shell

### Header

`src/components/StaticHeader.tsx` uses `src/constants/navlinks.tsx`.

All 7 links are active in the nav: Home, About, Projects, Writing, Investments, Resume, Contact.

### Layout

- `src/app/layout.tsx` renders fonts, providers, skip link, `StaticHeader`, then `ConditionalLayout`
- `src/components/ConditionalLayout.tsx` decides whether a route gets:
  - the default constrained wrapper
  - a self-managed page shell
  - a `full` or `compact` footer

### Footer

`src/components/Footer.tsx` has two variants:

- `compact` on `/` and `/contact`
- `full` on most content pages

This is intentional to avoid stacked closing CTAs.

### Error boundaries

- Shared fallback: `src/components/RouteErrorBoundary.tsx` (editorial-styled, calls `logger.error`, exposes `reset()` retry).
- Top-level catch-all: `src/app/error.tsx` covers anything below.
- Per-route boundaries on snapshot-driven dashboards that need bespoke surface labels: `/nba`, `/nfl`, `/mlb`, `/formula-1`, `/premier-league`, `/la-liga`, `/spacex-mission-control`, `/news-pulse`, `/investments`.
- When adding a new data-fetching dashboard route, drop in an `error.tsx` that re-exports `RouteErrorBoundary` with a `surfaceName`.

---

## Content And Data

### Portfolio/projects

- Project data lives primarily in `src/constants/caseStudies.ts`
- `/portfolio` now renders project cards directly from the route page
- `ProjectsContent.tsx` still exists but is not the current primary implementation for `/portfolio`

### Writing

- Posts live in `content/blog/`
- `src/lib/blog.ts` reads frontmatter and converts markdown/MDX to HTML using `remark`
- `/writing` and `/writing/[slug]` are the live surfaced routes
- All user-facing text must follow the voice and formatting rules in `WRITING_VOICE.md` — this includes articles, UI copy, page descriptions, bios, and hero text. Read it before editing or creating any text.

### Investments

- `src/app/investments/investments-client.tsx` is the main shell
- portfolio state is browser-local via `useInvestments`
- research data loads through curated snapshots and thin API routes:
  - `/api/investments/index`
  - `/api/investments/quotes`
  - `/api/investments/data/[symbol]`

### NFL Dashboard

`/nfl` is a snapshot-driven NFL dashboard following the same pattern as the Premier League and La Liga. Data comes from public NFLverse CSVs (no API key required) and is committed to the repo as TypeScript.

**Snapshot file:** `src/data/nflSnapshot.ts`

**Data sources:**
- Standings: `https://github.com/nflverse/nfldata/raw/master/data/standings.csv`
- Games / scores: `https://github.com/nflverse/nfldata/raw/master/data/games.csv`
- Team metadata + logos: `https://github.com/nflverse/nflfastR-data/raw/master/teams_colors_logos.csv`
- Player stat leaders: `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_<season>.csv`

**Update script:**

| Command | Time | When to use |
|---|---|---|
| `npm run update:nfl` | ~30 s | Refresh standings, schedule, and stat leaders. Also runs weekly through GitHub Actions during the season. |

NFL is intentionally **not** wired into the Netlify `prebuild` step. The snapshot is small and refreshes through `.github/workflows/update-nfl.yml` on Tuesdays during the season, with `npm run update:nfl` available for manual refreshes.

**Shared football components:** Reuses `src/components/football/*` (FixtureCard accepts an optional `periodLabel` prop, set to `"Week"` for NFL).

**State / route:** `?view=` (`league`, `afc`, `nfc`, `playoffs`) and `?team=<lowercase abbr>` (e.g., `kc`, `buf`).

### Football Dashboards (Premier League + La Liga)

Both dashboards are snapshot-driven. Data is fetched from `football-data.org` by local scripts and committed as TypeScript files. The app reads those files at build time — no live API calls at runtime.

**API token:** `FOOTBALL_DATA_API_TOKEN` in `.env.local` (free tier, 10 req/min limit). Also set in Netlify environment variables.

**Snapshot files:**
- `src/data/premierLeagueSnapshot.ts`
- `src/data/laLigaSnapshot.ts`

**Update scripts:**

| Command | What it fetches | Time | When to use |
|---|---|---|---|
| `npm run build` (Netlify prebuild) | Standings, fixtures, scorers only | ~2 min | Runs automatically on every Netlify deploy |
| `npm run update:football` | Full update including per-team fixtures and form | ~16 min | Run locally ~weekly, then commit snapshots |
| `npm run update:premier-league` | PL only, full | ~8 min | Run locally when you only want PL refreshed |
| `npm run update:la-liga` | La Liga only, full | ~8 min | Run locally when you only want La Liga refreshed |

**Recommended weekly workflow:**
```
npm run update:football   # ~16 min, run in background
git add src/data/
git commit -m "data: refresh football snapshots"
git push
```

**Netlify auto-refresh (standings only, daily):**
- Build hook URL is in Netlify → Site configuration → Build hooks
- A scheduled job on cron-job.org hits that URL daily to trigger a rebuild
- This keeps standings/scorers/fixtures current without any manual steps
- Team snapshot data (sidebar fixtures, form strip) only updates on a manual `npm run update:football`

**Shared components:** `src/components/football/` — used by the soccer and NBA dashboards:
- `FixtureCard`, `FixtureGroupSection` — generic fixture rendering
- `LeaderList` — scorers/assists leaderboard
- `StatCard`, `MetricCard`, `InfoChip`, `CrestAvatar`, `TeamResultPill`, `EmptyPanel`, `SurfaceCard`

### NBA Dashboard

The `/nba` route follows the same snapshot-driven pattern as the soccer dashboards.

**Data source:** ESPN's public NBA endpoints (no API token required):
- standings → `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings`
- scoreboard → `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- leaders → `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders`
- per-team schedule → `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{abbr}/schedule`

**Snapshot file:** `src/data/nbaSnapshot.ts` (committed; ships empty in the seed and is filled by the update script).

**Update script:** `npm run update:nba` (full refresh, ~1 min). Pass `-- --league-only` to skip per-team schedule snapshots. `.github/workflows/update-nba.yml` refreshes the committed snapshot daily from mid-October through June.

**Route state:** deep-linkable `view` (east, west, playoff, play-in) and `team` query params.

**API routes:**
- `/api/nba/summary` — conference standings, leaders, scoreboard slate
- `/api/nba/teams/[teamId]` — team schedule + form, keyed by lowercased ESPN abbreviation

### Other standalone data tools

- `/mlb` reads from `src/data/mlbSnapshot.ts` with deep-linkable route state. Snapshot is built by `npm run update:mlb` against the public MLB Stats API (`https://statsapi.mlb.com/api/v1`); no auth token required. `.github/workflows/update-mlb.yml` refreshes it daily April through October. Shares the football components in `src/components/football/`.
- `/formula-1` reads from `src/data/formula1Snapshot.ts` with deep-linkable route state; `.github/workflows/update-formula-1.yml` refreshes it daily
- `/github-trending-pulse` reads from `src/data/githubTrendingSnapshot.ts`, generated by `scripts/buildGitHubTrendingSnapshot.ts` from the public GitHub Search API
- `/news-pulse` reads from `src/lib/news-pulse-utils.ts` through `/api/news-pulse`
- `/spacex-mission-control` reads from SpaceX data helpers and `/api/spacex/*` routes; `.github/workflows/update-spacex.yml` refreshes data and image artifacts twice daily
- `/polling-aggregator` reads from `src/data/pollingSnapshot.ts` with deep-linkable route state
- `/golf` reads from `src/data/golfSnapshot.ts`. **Manually maintained — no build script, no GitHub workflow.** To refresh, hand-edit the snapshot (tournament metadata, leaderboard, round scores). A scraped automation against the public ESPN golf endpoints (`https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard`) would be doable but hasn't been built; the dashboard intentionally tracks specific events Isaac follows rather than every tour stop.
- `/fintech-tools/budget-planner` uses `src/hooks/useBudgetPlanner.ts`
- `/fintech-tools/interchange-iq` is a client-side fee analyzer under `src/app/fintech-tools/interchange-iq`

### March Madness

- `/march-madness-2026` is a live seasonal route
- server page provides metadata and structured data
- client page manages deep-linkable tab state
- there is a companion article in `content/blog/2026-march-madness-bracket-analysis.mdx`

### Fantasy football

- `/fantasy-football` is a server shell (metadata + structured data) that delegates to `fantasy-football-client.tsx`
- `/fantasy-football/draft-tracker` is a local-storage-backed draft assistant; shares the same snapshot as the rankings page
- Data source: `public/data/fantasy/{ppr,half_ppr,standard}.json`, generated by `npm run update:fantasy` (scrapes FantasyPros public cheatsheets)
- The scrape script (`scripts/buildFantasyPositionData.ts`) retries each request up to 3 times with exponential backoff
- `useFantasySnapshot` hook is the single client-side entry point; cached by `fantasySnapshotRevision.generated.ts`
- Rankings page has a **List / Tiers** view toggle; tier view is deep-linkable via `?view=tiers` and rendered by `src/components/fantasy/TierBreakdown.tsx`
- Shared utilities live in `src/lib/fantasyUtils.ts`: `getPositionTone`, `formatRankValue`, `formatRange`, `formatUpdatedAt`, `formatOwnership`, `getSourceKindLabel`
- Automation: `.github/workflows/update-fantasy.yml` runs weekly on Wednesdays (17:00 UTC); manual trigger via `workflow_dispatch`

### MBA internship tracker

- `/mba-internship-notifications` is a live role aggregator surfaced through the projects section
- client shell: `src/app/mba-internship-notifications/mba-jobs-client.tsx`
- filter/search state lives in `mba-jobs-state.ts` in the same folder
- data is served by `/api/mba-jobs`

---

## API Surface

Live routes under `src/app/api/`:

- `/api/auth/[...nextauth]`
- `/api/fantasy-data`
- `/api/investments/data/[symbol]`
- `/api/investments/index`
- `/api/investments/quotes`
- `/api/premier-league/summary`
- `/api/premier-league/teams/[teamId]`
- `/api/la-liga/summary`
- `/api/la-liga/teams/[teamId]`
- `/api/mlb/summary`
- `/api/mlb/teams/[teamId]`
- `/api/nba/summary`
- `/api/nba/teams/[teamId]`
- `/api/nfl/summary`
- `/api/nfl/teams/[teamId]`
- `/api/mba-jobs`
- `/api/mba-jobs/email`
- `/api/news-pulse`
- `/api/spacex/launches`, `/api/spacex/launches/[id]`, `/api/spacex/summary`
- `/api/rss`
- `/api/search`
- `/api/stocks`

Important caveats:

- `/api/search` is still a limited, mostly hardcoded search index
- there is no general `/api/investments` catch-all route anymore
- `/api/investments/quotes` proxies quote access for the investments UI
- Fantasy football rankings are served as static JSON from `public/data/fantasy/` — `/api/fantasy-data` is a server-side fallback that reads the same snapshots. There are no live FantasyPros API calls at runtime.

---

## Styling Rules

Global tokens and helpers live in `src/app/globals.css`.

Key conventions:

- new code should use the `--home-*` editorial palette directly, such as `var(--home-paper)`, `var(--home-ink)`, `var(--home-haze)`, and `var(--home-acid)`
- legacy aliases such as `--surface-*`, `--text-*`, `--border-*`, and `--color-primary` still exist for compatibility, but should not be introduced in new docs or code
- use editorial shell helpers like:
  - `.home-page`
  - `.home-shell`
  - `.home-shell-tight`
  - `.home-section`
  - `.home-card`
  - `.home-kicker`
- keep light/dark mode support intact
- maintain 44px minimum touch targets
- honor reduced motion for animated components

The editorial system is the site-wide standard for all live routes except `/admin`, which intentionally keeps its separate admin aesthetic. Do not reintroduce older palette assumptions into live docs or code unless you are explicitly working on historical materials.

---

## Testing

The repo uses:

- Jest for unit/integration coverage
- Playwright for browser coverage

Key current facts:

- Jest coverage thresholds are low and pragmatic, not strict enterprise thresholds
- component tests are a mix of `react-dom/client` style tests and Testing Library-style tests
- Playwright projects include desktop and mobile browsers, though local environments may only have a subset installed

Read `TESTING.md` before expanding coverage.

---

## Current Documentation Conventions

Treat the following as current source of truth:

- `AGENT.md`
- `README.md`
- `PAGES.md`
- `COMPONENTS.md`
- `ARCHITECTURE.md`
- `API.md`
- `DEVELOPMENT.md`
- `TESTING.md`
- `STYLING.md`
- `SEO.md`
- `WRITING_VOICE.md`
- `docs/README.md`
- `docs/ai-context/*`

Treat older plans, redesign specs, and reference templates as historical unless they explicitly say they are current. `SEO.md` (listed above) is the current SEO reference — older root-level SEO audit/summary docs are historical.

---

## Known Legacy / Historical Areas

The repo still contains older materials for context:

- `docs/archive/*` (includes `docs/archive/plans/*` for completed implementation plans)
- `content-redesign/*`
- many root-level SEO and UX summary docs
- non-live content references under `content/`

Keep them for historical traceability, but do not quote them as current implementation without cross-checking the code.

---

## Safe Working Heuristics

- Confirm routes from `src/app/**/page.tsx`, not from old docs
- Confirm API routes from `src/app/api/**/route.ts`
- Confirm nav and footer behavior from `StaticHeader.tsx`, `ConditionalLayout.tsx`, and `Footer.tsx`
- Confirm current portfolio behavior from `src/app/portfolio/page.tsx`, not `ProjectsContent.tsx`
- Confirm current writing behavior from `src/app/writing/*` and `src/lib/blog.ts`
- Confirm investments behavior from `src/app/investments/*`, `src/components/investments/*`, and the investments API routes

When docs and code disagree, code wins.
