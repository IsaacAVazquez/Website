# CLAUDE.md

Deep implementation context for Claude Code and other agents working in this repo.

**Last updated:** 2026-08-16

---

## How this file works

Claude Code loads this file into context at the start of every session, walking up
from the working directory. Keep it focused: durable, cross-cutting context that an
agent needs in *most* sessions. Anything narrower belongs elsewhere.

- **`AGENTS.md`** is the shorter start-here companion (route map, command reference,
  data-workflow runbooks, guardrails). Read it first; this file holds the deeper
  "why" and the patterns that span surfaces.
- **`CLAUDE.local.md`** (gitignored) is for personal, machine-specific notes —
  sandbox URLs, local test data, worktree quirks. Do not commit personal setup here.
- **Subsystem docs** carry the per-surface depth (see [Documentation map](#documentation-map)).
  Prefer pointing at them over re-documenting a subsystem in full here.
- To pull another file inline, use an `@path` import (e.g. `@AGENTS.md`). Imports load
  at launch like the rest of this file, so use them for organization, not token savings.

**When docs and code disagree, code wins.** Confirm routes from `src/app/**/page.tsx`,
API routes from `src/app/api/**/route.ts`, and shell behavior from the components below.

---

## Platform Overview

A multi-surface Next.js 16 site for Isaac Vazquez. It is **portfolio-first** with
secondary authority-building content — not a generic blog template. The surfaces:

1. **Portfolio** — homepage, about, projects, resume, contact
2. **Writing** — long-form MDX under `/writing`
3. **Fantasy football analytics** — rankings, tiers, draft tooling
4. **Investments + seasonal** — `/investments`, `/march-madness-2026`
5. **Experimental dashboards** — ~20 standalone data tools (sports, civic, space,
   news, markets); see the Route Map in `AGENTS.md`
6. **Fintech tools** — calculators under `/fintech-tools/*`
7. **MBA internship tracker** — `/mba-internship-notifications`
8. **Personal-interest tools** — browser-persisted (`/travel`, `/food-map`,
   `/recipe-finder`, `/wine-cellar`, `/museum-log`)

---

## Tech Stack

- Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4
- Framer Motion · D3 (charting) · `next-themes` (dark mode)
- NextAuth v4 for `/admin`
- Netlify deployment via `@netlify/plugin-nextjs`

Build pipeline: `npm run build` consumes committed snapshots without mutating data;
`postbuild` runs `scripts/generatePublicSitemap.mjs` and `scripts/patch-nft-sharp.mjs`. Full command and
data-refresh runbooks live in `AGENTS.md` and `docs/DATA_UPDATE_OPERATIONS.md`.

---

## Routes, Navigation, and Shell

The full route map, header links, self-shell route list, and footer variants live in
`AGENTS.md`. The patterns that matter when editing the shell:

- `src/app/layout.tsx` renders fonts, providers, skip link, `StaticHeader`, then
  `ConditionalLayout`.
- `src/components/ConditionalLayout.tsx` decides each route's wrapper (default
  constrained or self-managed shell) and owns the only page-level `main` landmark
  for self-shell routes. Leaf sections use `div`/`section`, never a nested `main`.
  Every route exposes exactly one page-level `h1`.
- The seven **Catalog 97** routes (`/`, `/portfolio`, `/writing`, `/dashboards`,
  `/about`, `/resume`, `/contact`) are the exception to all of it. `StaticHeader`
  and `ConditionalLayout` both return early for them (`isCatalog97Route` in
  `src/constants/catalog97Nav.ts`), and `Catalog97Shell` supplies the header,
  the only `main`, and the footer. Their tokens live in `src/app/catalog97.css`,
  scoped under `.c97-page`, and never touch `--home-*`.
- `src/components/Footer.tsx` is always `full` now, since the only two routes
  that took `compact` are Catalog 97 routes and no longer reach it. The prop
  still works if a route needs it again.
- Header links come from `src/constants/navlinks.tsx` (8 links; Fantasy →
  `/fantasy-football`).

Redirects (`next.config.mjs`): `/projects`,`/work` → `/portfolio`; `/blog` →
`/writing`; `/blog/:slug` → `/writing/:slug`; plus fantasy-football shortcuts/typos.
Never create real pages at `/projects`, `/work`, or `/blog`.

### Error boundaries

- Shared fallback: `src/components/RouteErrorBoundary.tsx` (editorial-styled, calls
  `logger.error`, exposes `reset()` retry). Top-level catch-all: `src/app/error.tsx`.
- Snapshot-driven dashboards add a per-route `error.tsx` that re-exports
  `RouteErrorBoundary` with a bespoke `surfaceName`. **When adding a new data-fetching
  dashboard route, drop one in.**

---

## Content and Data Patterns

Most surfaces share a few repeating patterns. Learn the pattern once; the per-surface
specifics live in the subsystem docs.

### Snapshot-driven dashboards (the dominant pattern)

15+ dashboards follow one shape: a committed TypeScript/JSON **snapshot** → a
**builder** script (`npm run update:<name>`) → an optional **GitHub Action** that
commits refreshes → **accessors** → thin **API routes** that read the committed
snapshot (no external calls at request time). Canonical reference:
`SNAPSHOT_DRIVEN_DASHBOARDS.md`. Per-tool sources, schedules, and route state are in
`AGENTS.md` and `docs/DATA_UPDATE_OPERATIONS.md`.

Shared conventions worth internalizing:

- **Fail-soft refresh:** a failed or empty fetch keeps the previous snapshot rather
  than wiping it (shared `readGeneratedSnapshot` fallback). Several seeds ship empty
  or with a hand-authored seed so the page is useful before the first live refresh.
- **Curated, unverified datasets** include `/tech-startup-tracker`, `/frontier-models`,
  `/ai-dev-tools`, `/museum-log`, `/travel-deals`, `/food-map`, and the retirement
  planner CMAs. Their review dates, verification flags, and structural checks feed the
  weekly curated-data audit. Keep the on-page source and estimate disclosures intact.
- **Shared football components** in `src/components/football/*` back the soccer, NBA,
  MLB, and NFL dashboards (`FixtureCard`, `LeaderList`, `StatCard`, etc.).

### Portfolio / writing

- Project data: `src/constants/caseStudies.ts`. `/portfolio` renders cards directly
  from the route page.
- Writing posts live in `content/blog/`; `src/lib/blog.ts` reads frontmatter and
  converts MD/MDX to HTML via `remark`. Live routes: `/writing`, `/writing/[slug]`.
- **Cover images are part of publishing, not an afterthought.** Every post has a
  plan entry in `scripts/data/articleCoverImages.ts` (one per slug): a `wikimedia`
  photo (fetched license-safe by `npm run update:article-images`, saved to
  `public/images/writing/covers/`, written into `coverImage*` frontmatter), an
  `editorial-card` for abstract pieces that keep the generated
  `/writing/<slug>/opengraph-image`, or a hand-curated `manual` photo. When you
  add a post, add its plan entry in the same change. The fetch is blocked in the
  agent sandbox (image hosts are egress-denied) and runs in CI or locally.
  Runbook: `docs/ARTICLE_IMAGE_WORKFLOW.md`.

### Browser-persisted tools

`/travel`, `/wine-cellar`, `/museum-log`, `/recipe-finder`, `/food-map`, the
investments portfolio, retirement plan, and fantasy draft tracker keep state in
localStorage via dedicated hooks. Reference: `PERSONAL_INTEREST_TOOLS.md`.

### Engines worth knowing

- **Retirement planner** (`src/lib/retirement/*`) — framework-free, unit-tested
  projection + seeded Monte Carlo engine surfaced in the investments dashboard.
  Returns/volatility are derived from the allocation via dated capital-market
  assumptions (`capitalMarketAssumptions.ts`, currently `CMA_VERIFIED = false`).
  Output is **educational only** — keep the disclaimer and assumption disclosure
  intact (compliance). Full spec: `RETIREMENT_PLANNER_ENGINE.md`.
- **Draft analytics** (`src/lib/draftAnalytics.ts`) — pure, unit-tested engine
  (reaches/steals vs. an ADP-or-consensus baseline, position-run detection, per-team
  market deltas and roster coverage) rendered in the draft tracker.
- **Fantasy Draft Outlook** (`src/lib/fantasyTeamValue.ts`) — pure, unit-tested
  room comparison shared by redraft and best ball. It combines market price,
  roster shape, format fit, and bye coverage, then keeps the user-entered expected
  return calculation separate. Treat the room rank as draft-process guidance, not
  projected points, win probability, or roster-specific payout EV.
- **Fantasy trade calculator** (`src/lib/fantasyTrade.ts`) — pure, unit-tested
  preseason one-QB redraft estimator behind `/fantasy-football/trade-calculator`.
  Expert consensus and mock-draft ADP each become a league-specific
  replacement-relative index (log curve above a starter cutoff and a depth cutoff,
  weighted 75/25), blended by an ADP-reliability factor, and reported with a value
  range, a `coverage` grade, and a `verdict`. A relative gap at or under 5% reads
  balanced; a clear edge needs 15%, `supported` coverage, and non-overlapping
  ranges. Not an in-season, dynasty, superflex, projected-points, or
  win-probability model. Full spec: `docs/FANTASY_DRAFT_MODEL.md`.
- **Rent vs buy** (`src/lib/rentVsBuy/*`) — pure, unit-tested nominal-dollar
  buy-versus-rent comparison behind `/fintech-tools/rent-vs-buy`. It seeds the
  renter with the buyer's up-front cash and invests each month's cost difference
  on whichever side spends less. Dated tax assumptions (`SALT_CAP`,
  `STANDARD_DEDUCTION`, `CAPITAL_GAINS_EXCLUSION`) live in `defaults.ts`. Output
  is **educational only** — keep the disclaimer and assumption disclosure intact.
- **Score pools** (`src/lib/scorePools/*`) — pure, unit-tested exact-score prediction
  engine: odds de-vig, market-calibrated Dixon-Coles scoreline distribution with a
  90-minute vs final-result scoring basis, expected-points optimizer, and a
  standing-aware leaderboard layer. Calibration compromises surface in `diagnostics` —
  keep the honesty framing (as-of stamps, sample/manual labels, residual disclosure)
  intact. Full spec: `SCORE_POOLS_ENGINE.md`.

### Fantasy football specifics

- Rankings ship as static JSON: `public/data/fantasy/{ppr,half_ppr,standard}.json`
  (schema v8), generated by `npm run update:fantasy` (FantasyPros scrape + mock-draft
  ADP + prior-season per-game scoring). `/api/fantasy-data` is a server-side fallback reading the same snapshots —
  there are no live FantasyPros calls at runtime.
- ADP is build-time only (`src/lib/fantasyAdpMatcher.ts`, tiered exact matching, never
  fuzzy); when the `adpSource` is `null` the UI hides every ADP surface.
- Per-game scoring (`player.gameLog`) is the prior completed regular season from
  nflverse's weekly `stats_player` release, built by
  `scripts/buildFantasyGameLogData.ts` and matched onto the consensus board through
  the same exact matcher ADP uses. It backs the rankings drawer's points-per-game
  panel only, and it is history rather than a projection, so never let it read as a
  forecast. Players under the four-game floor and anyone unmatched (rookies, most
  notably) carry no `gameLog` and the panel simply does not render. The builder
  tries the current season first and falls back to the prior one, so the rollover
  needs no manual edit.
- `useFantasySnapshot` is the single client entry point.
- Best ball ships separately at `public/data/fantasy/best-ball.json`, with consensus rankings, Underdog ADP, bye weeks, and Week 17 opponents. `useBestBallSnapshot` is its client entry point, and `src/lib/bestBall/` owns contest presets and draft recommendations (`contests.ts`, `draft.ts`, `rankings.ts`, `recommendations.ts`, `strategy.ts`). Keep best ball state and roster logic separate from the redraft tracker.
- The in-season weekly board ships at `public/data/fantasy/weekly.json` (schema v1), built by `npm run update:fantasy:weekly` (`scripts/buildFantasyWeeklySnapshot.ts`) from the FantasyPros weekly FLEX and QB consensus pages through `src/lib/fantasyWeeklySource.ts`. FantasyPros publishes no single overall board in season, so FLEX stands in for the Overall tab, and flex and quarterback ranks stay in separate rank spaces because a flex rank of 12 and a quarterback rank of 12 are not comparable. `src/lib/fantasyWeeklySnapshot.ts` owns the schema, the reader's validator, and the waiver reading, which is a published rank percentile minus a published rostered percentage and models no bid, projection, or points total. The rest-of-season URLs in the source module are wired but still serve the prior season, so the season check correctly rejects them. **No route renders this snapshot yet.**
- `src/components/fantasy/DraftValuePanel.tsx` is the shared UI for Draft Outlook and expected return math. Best Ball Mania VII field economics are published inputs from the dated contest preset. Weekly Winners, Sit and Go, and other variable lobby cards must not receive invented static economics.
- `/fantasy-football/trade-calculator` reads the same redraft snapshot through `src/lib/fantasyTrade.ts` and `src/hooks/useFantasyTradeCalculator.ts`. Selected player IDs persist under `fantasy-trade-calculator-v1-<season>-<scoring>` via `src/lib/fantasyTradePersistence.ts`; scoring, team count, roster size, and lineup preset stay in the URL. It never issues a verdict when the expert board is stale or when any selected player lacks a reliable current-market reading.
- The **fantasy draft companion** is a private Chrome/Edge side panel, not a deployed surface. Its source is `extension/` (Vite, `service-worker.ts`, `sidepanel.html`), its shared logic is `src/lib/fantasyCompanion/*`, and it builds with `npm run build:fantasy-companion` (`scripts/buildFantasyCompanionExtension.mjs`), which packages compact snapshot copies into `extension/dist`. At open it fetches the published snapshot from `isaacvazquez.com` and falls back to the packaged copy. Provider pick auto-sync is deliberately disabled and there is no content script for any draft room — do not add one. Runbook: `docs/FANTASY_DRAFT_COMPANION.md`.
- `docs/FANTASY_DRAFT_MODEL.md` defines every fantasy draft metric, model limit, and remaining validation requirement.

---

## Styling Rules

Tokens and helpers live in `src/app/globals.css`. The editorial system is the
site-wide standard for every live route except `/admin` (which keeps its own aesthetic).
Reference: `STYLING.md`. **Before merging any UI, run the single pre-merge `DESIGN_CHECKLIST.md`.**

- New code uses the `--home-*` Working Instrument palette directly (`var(--home-paper)`,
  `var(--home-ink)`, `var(--home-ink-muted)`, `var(--home-rule)`, and the single accent
  `var(--home-signal)` — reserved for data, state, and action, never decorative washes).
  `--home-haze`/`--home-acid`/`--home-moss` survive as token definitions only —
  phase two removed every component usage; do not add new ones. Legacy aliases (`--surface-*`, `--text-*`, `--border-*`,
  `--color-primary`, and the `--color-success/-error/-warning` names) exist for compatibility
  but must not be introduced in new code or docs — use `--home-positive/-negative/-warning`
  for status.
- Never hardcode hex colors in components — use the CSS variables.
- For raised surfaces use `var(--home-paper-raised)` or mix toward `var(--home-elev-mix)`;
  **never `color-mix(…, white)`** — it lightens in both themes and breaks dark mode.
- D3/SVG charts resolve token colors at render time via `getComputedStyle` (see
  `PortfolioPerformanceChart`); never bake a token's hex into a constant.
- No arbitrary `text-[Npx]` micro-type — use `text-3xs`/`text-2xs` (see `STYLING.md`).
- CSS-Module surfaces must alias the global tokens (`--x-paper: var(--home-paper)`), never
  re-declare the palette as fresh hex with its own `.dark` mirror.
- Use the editorial shell helpers (`.home-page`, `.home-shell`, `.home-section`,
  `.home-card`, `.home-kicker`).
- Keep light/dark mode support, 44px minimum touch targets, and `prefers-reduced-motion`
  for animated components. Shared portfolio-shell primitives must not use
  `transition-all` — transition specific properties.
- Framer Motion entrances must honor `useReducedMotion()` — the global CSS guard does
  **not** stop JS/rAF-driven Framer animation, and shared primitives are the usual offenders.

---

## Guardrails

- Never import `@tabler/icons-react` in server components — use `@/components/ui/ServerIcons`.
- Never import `better-sqlite3` into client code.
- `/api/search` is still a limited, mostly hardcoded index — do not describe it as
  comprehensive site search.
- All user-facing text (articles, UI copy, page descriptions, bios, hero text) must
  follow `WRITING_VOICE.md`. Read it before editing or creating any copy; rewrite
  non-conforming copy to match it rather than patching around it.

---

## Testing

Jest for unit/integration, Playwright for browser. Coverage thresholds are
intentionally modest. Prefer targeted runs while iterating and match the style of
nearby tests. Full guidance — commands, where tests live, the browser matrix — is in
`TESTING.md`.

```bash
npm test                                 # full Jest suite
npx jest -t "name of test"               # single test by name
npm run test:e2e                         # Playwright (default subset)
npx playwright test e2e/homepage.spec.ts # single spec
```

---

## Documentation map

Current source-of-truth docs:

- `AGENTS.md` (start-here) · `README.md`
- `PAGES.md` · `COMPONENTS.md` · `ARCHITECTURE.md` · `API.md` · `DEVELOPMENT.md`
- `TESTING.md` · `STYLING.md` · `DESIGN_CHECKLIST.md` · `SEO.md` · `WRITING_VOICE.md`
- `docs/README.md` · `docs/ai-context/*` · `docs/DESIGN_AUDIT_2026-06.md` (point-in-time audit + fix backlog)

Subsystem references:

- `SNAPSHOT_DRIVEN_DASHBOARDS.md` — the shared snapshot → builder → action → API pattern
- `PERSONAL_INTEREST_TOOLS.md` — the browser-persisted localStorage tools
- `RETIREMENT_PLANNER_ENGINE.md` — the pure projection/Monte Carlo engine
- `SCORE_POOLS_ENGINE.md` — the exact-score prediction engine (`/score-pools`): de-vig →
  market-calibrated Dixon-Coles scoreline distribution → expected-points optimizer →
  leaderboard layer. Pure modules in `src/lib/scorePools/`; snapshot-driven data with
  capped append-only odds history; pool config/picks in localStorage.
- `docs/FANTASY_DRAFT_MODEL.md` — every fantasy draft and trade metric, its formula,
  its source limits, and the remaining validation requirements
- `docs/FANTASY_DRAFT_COMPANION.md` — the private Chrome/Edge side panel: build, load,
  ranking refresh, and why provider pick sync stays disabled
- `docs/DATA_UPDATE_OPERATIONS.md` — command → artifact → schedule runbook for every refresh
- `docs/ARTICLE_IMAGE_WORKFLOW.md` — blog cover-image plan, the fetch builder, and the writing-time step

**Legacy / historical** (do not quote as current without checking code): root-level
SEO/UX summary docs and non-live references under `content/`. `SEO.md` is the current SEO
reference; older root-level SEO audits are historical. The former `docs/archive/*` and
`content-redesign/*` trees were deleted in August 2026; read them from git history if
you need them.

---

## Safe working heuristics

- Confirm routes from `src/app/**/page.tsx`, not old docs.
- Confirm API routes from `src/app/api/**/route.ts`.
- Confirm nav/footer from `StaticHeader.tsx`, `ConditionalLayout.tsx`, `Footer.tsx`.
- Confirm portfolio behavior from `src/app/portfolio/page.tsx`.
- Confirm writing behavior from `src/app/writing/*` and `src/lib/blog.ts`.
- Confirm investments behavior from `src/app/investments/*`, `src/components/investments/*`,
  and the investments API routes.
- When adding a new data dashboard, follow the snapshot-driven pattern end to end
  (snapshot, builder, fail-soft fetch, accessors, API route, and an `error.tsx`).

---

## Writing Voice

Apply Isaac's writing voice by default to any prose, document, or deliverable you produce for this repo, from articles and blog content under `content/blog/` to UI copy, page descriptions, bios, hero text, readouts, and emails. It does not apply to code. `WRITING_VOICE.md` is the canonical spec and is deliberately not duplicated here, so read it before writing or editing any copy, and rewrite non-conforming copy to match it rather than patching around it.

The load-bearing points, as a reminder and not a substitute: first-person, direct, opinion-forward prose; plainer and more explanatory than punchy, with long accumulating sentences over fragments; calibrated hedging kept as a feature of the voice, never stripped; personal anchors (Civitech, Haas, Lyft, Juno) woven in as evidence without inventing details; no em dashes as stylistic devices, no colons as sentence connectors, no bullet lists with bold labels; condense hard in polished pieces. The full hard-rule list, the AI tells to strip, the essay structure, and the register shifts all live in `WRITING_VOICE.md`.
