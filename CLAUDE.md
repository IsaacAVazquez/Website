# CLAUDE.md

Deep implementation context for Claude Code and other agents working in this repo.

**Last updated:** 2026-06-30

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

Build pipeline: `prebuild` runs a league-only football snapshot refresh; `postbuild`
runs `next-sitemap` and `scripts/patch-nft-sharp.mjs`. Full command and data-refresh
runbooks live in `AGENTS.md` and `docs/DATA_UPDATE_OPERATIONS.md`.

---

## Routes, Navigation, and Shell

The full route map, header links, self-shell route list, and footer variants live in
`AGENTS.md`. The patterns that matter when editing the shell:

- `src/app/layout.tsx` renders fonts, providers, skip link, `StaticHeader`, then
  `ConditionalLayout`.
- `src/components/ConditionalLayout.tsx` decides each route's wrapper (default
  constrained, self-managed shell, or `full`/`compact` footer) and owns the only
  page-level `main` landmark for self-shell routes. Leaf sections use `div`/`section`,
  never a nested `main`. Portfolio-shell routes expose exactly one page-level `h1`.
- `src/components/Footer.tsx`: `compact` on `/` and `/contact`, `full` elsewhere —
  intentional, to avoid stacked closing CTAs.
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
- **Curated, unverified datasets** (`/tech-startup-tracker`, `/frontier-models`, and
  the retirement planner CMAs) are tagged with an `asOf` date + a `verified: false`
  flag and disclose their unverified state on-page. Keep that disclosure intact.
- **Shared football components** in `src/components/football/*` back the soccer, NBA,
  MLB, and NFL dashboards (`FixtureCard`, `LeaderList`, `StatCard`, etc.).

### Portfolio / writing

- Project data: `src/constants/caseStudies.ts`. `/portfolio` renders cards directly
  from the route page — `ProjectsContent.tsx` still exists but is **not** the live path.
- Writing posts live in `content/blog/`; `src/lib/blog.ts` reads frontmatter and
  converts MD/MDX to HTML via `remark`. Live routes: `/writing`, `/writing/[slug]`.

### Browser-persisted tools

`/travel`, `/wine-cellar`, `/museum-log`, `/recipe-finder`, `/food-map`, the
investments portfolio, retirement plan, and fantasy draft tracker keep state in
localStorage via dedicated hooks. Reference: `PERSONAL_INTEREST_TOOLS.md`.

### Two engines worth knowing

- **Retirement planner** (`src/lib/retirement/*`) — framework-free, unit-tested
  projection + seeded Monte Carlo engine surfaced in the investments dashboard.
  Returns/volatility are derived from the allocation via dated capital-market
  assumptions (`capitalMarketAssumptions.ts`, currently `CMA_VERIFIED = false`).
  Output is **educational only** — keep the disclaimer and assumption disclosure
  intact (compliance). Full spec: `RETIREMENT_PLANNER_ENGINE.md`.
- **Draft analytics** (`src/lib/draftAnalytics.ts`) — pure, unit-tested engine
  (reaches/steals vs. an ADP-or-consensus baseline, position-run detection, per-team
  grades) rendered in the draft tracker.

### Fantasy football specifics

- Rankings ship as static JSON: `public/data/fantasy/{ppr,half_ppr,standard}.json`
  (schema v6), generated by `npm run update:fantasy` (FantasyPros scrape + mock-draft
  ADP). `/api/fantasy-data` is a server-side fallback reading the same snapshots —
  there are no live FantasyPros calls at runtime.
- ADP is build-time only (`src/lib/fantasyAdpMatcher.ts`, tiered exact matching, never
  fuzzy); when the `adpSource` is `null` the UI hides every ADP surface.
- `useFantasySnapshot` is the single client entry point.

---

## Styling Rules

Tokens and helpers live in `src/app/globals.css`. The editorial system is the
site-wide standard for every live route except `/admin` (which keeps its own aesthetic).
Reference: `STYLING.md`. **Before merging any UI, run the single pre-merge `DESIGN_CHECKLIST.md`.**

- New code uses the `--home-*` editorial palette directly (`var(--home-paper)`,
  `var(--home-ink)`, `var(--home-haze)`, `var(--home-acid)`). Legacy aliases
  (`--surface-*`, `--text-*`, `--border-*`, `--color-primary`, and the
  `--color-success/-error/-warning` names) exist for compatibility but must not be
  introduced in new code or docs — use `--home-positive/-negative/-warning` for status.
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
  **not** stop JS/rAF-driven Framer animation (shared primitives especially, e.g. `PageSummary`).

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

- `AGENTS.md` (start-here) · `AGENT.md` (compat stub) · `README.md`
- `PAGES.md` · `COMPONENTS.md` · `ARCHITECTURE.md` · `API.md` · `DEVELOPMENT.md`
- `TESTING.md` · `STYLING.md` · `DESIGN_CHECKLIST.md` · `SEO.md` · `WRITING_VOICE.md`
- `docs/README.md` · `docs/ai-context/*` · `docs/DESIGN_AUDIT_2026-06.md` (point-in-time audit + fix backlog)

Subsystem references:

- `SNAPSHOT_DRIVEN_DASHBOARDS.md` — the shared snapshot → builder → action → API pattern
- `PERSONAL_INTEREST_TOOLS.md` — the browser-persisted localStorage tools
- `RETIREMENT_PLANNER_ENGINE.md` — the pure projection/Monte Carlo engine
- `docs/DATA_UPDATE_OPERATIONS.md` — command → artifact → schedule runbook for every refresh

**Legacy / historical** (keep for traceability; do not quote as current without checking
code): `docs/archive/*` (incl. `docs/archive/plans/*`), `content-redesign/*`, root-level
SEO/UX summary docs, non-live references under `content/`. `SEO.md` is the current SEO
reference; older root-level SEO audits are historical.

---

## Safe working heuristics

- Confirm routes from `src/app/**/page.tsx`, not old docs.
- Confirm API routes from `src/app/api/**/route.ts`.
- Confirm nav/footer from `StaticHeader.tsx`, `ConditionalLayout.tsx`, `Footer.tsx`.
- Confirm portfolio behavior from `src/app/portfolio/page.tsx`, not `ProjectsContent.tsx`.
- Confirm writing behavior from `src/app/writing/*` and `src/lib/blog.ts`.
- Confirm investments behavior from `src/app/investments/*`, `src/components/investments/*`,
  and the investments API routes.
- When adding a new data dashboard, follow the snapshot-driven pattern end to end
  (snapshot, builder, fail-soft fetch, accessors, API route, and an `error.tsx`).

---

## Writing Voice

Apply Isaac's writing voice by default to any prose, document, or deliverable you produce for this repo, from articles and blog content under `content/blog/` to UI copy, page descriptions, bios, hero text, readouts, and emails. It does not apply to code. When copy doesn't already conform, rewrite it to match rather than patching around it. `WRITING_VOICE.md` is the canonical spec; this is the working summary.

The voice is first-person, direct, and opinion-forward, like a senior practitioner explaining something they actually worked through. Use "I" often, state opinions without corporate hedging, and write in flowing prose paragraphs that string related points into sentences instead of bullets. Weave data and specifics into the sentences rather than isolating them in callouts, and acknowledge the tradeoffs before landing a clear position.

Keep it plainer and more explanatory than punchy. Say the plain literal thing even when it runs a little longer, and don't reach for vivid, aphoristic, or metaphorical compressions or for editorializing color adjectives. Treat stylized sentence fragments and staccato contrast pairs as rare emphasis rather than the default, and smooth them into flowing sentences joined with "but" or "and." Use rhetorical questions sparingly. Prefer long accumulating sentences with stacked clauses and "from X, to Y, to Z" lists over crafted parallelism or tricolons. Don't chase synonym variety, since repeating a word is fine. Keep the calibrated hedging ("it looks like," "I think," "probably," "at least," "actually") as a real feature of the voice, and stay general where the source was general rather than inventing proper nouns or details that weren't provided.

Never use em dashes (—) as a stylistic device; colons as sentence connectors (write "The problem is X", not "The problem: X"); bullet lists with bold labels (prefer prose, though a plain reference table in a catalog is fine); tables of contents; business-framework names as section headers; "comprehensive guide" or "complete guide" openers; generic "Conclusion" sections; end-of-document "Next Steps" bullet lists; or "About the Author" sections. Use section headers only where a long piece genuinely needs them, and prefer unhyphenated compound technical phrases ("invoice to cash," "day to day").

Condense aggressively in polished essays and deliverables, but in emails and explainers tolerate mild redundancy for clarity and warmth. Shift register by context. Email openers are warm and casual, and marketing or event copy is warm, earnest, inclusive, and enthusiastic, emphasizing community over being cool.
