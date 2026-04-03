# CLAUDE.md

Comprehensive repo context for agents and collaborators working in `/Users/isaacvazquez/Website`.

**Last updated:** 2026-04-03

---

## Platform Overview

This codebase is a multi-surface Next.js 16 site for Isaac Vazquez. It combines four distinct product surfaces inside one app:

1. **Portfolio site** — homepage, about, projects, resume, contact
2. **Writing surface** — long-form MDX posts under `/writing`
3. **Fantasy football analytics** — rankings, tiers, and draft tooling
4. **Investments + seasonal experiments** — `/investments` and `/march-madness-2026`
5. **Experimental dashboards** — standalone tools like `/premier-league`

The site is not a generic blog template. It is a portfolio-first experience with secondary authority-building content.

---

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- D3 for charting
- `next-themes` for dark mode
- `better-sqlite3` for server-side fantasy football persistence
- NextAuth v4 for `/admin`
- Netlify deployment via `@netlify/plugin-nextjs`

Key scripts:

```bash
npm run dev
npm run build
npm test
npm run test:e2e
npm run update:fantasy-rb
npm run update:investments
```

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

- `/premier-league`

### Fantasy football

- `/fantasy-football`
- `/fantasy-football/tiers/[position]`
- `/fantasy-football/rb-tiers`
- `/fantasy-football/draft-tracker`

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

Promoted header items:

1. `Home`
2. `About`
3. `Projects`
4. `Investments`
5. `Resume`
6. `Contact`

`Writing` remains live but is intentionally not promoted in the global nav.

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
- All articles must follow the voice and formatting rules in `WRITING_VOICE.md` — read it before editing or creating any post

### Investments

- `src/app/investments/investments-client.tsx` is the main shell
- portfolio state is browser-local via `useInvestments`
- research data loads through curated snapshots and thin API routes:
  - `/api/investments/index`
  - `/api/investments/quotes`
  - `/api/investments/data/[symbol]`

### Premier League

- `/premier-league` is a standalone sports dashboard route
- live Premier League data is fetched server-side via `football-data.org`
- the client shell manages deep-linkable `overview`, `fixtures`, and `team` views

### March Madness

- `/march-madness-2026` is a live seasonal route
- server page provides metadata and structured data
- client page manages deep-linkable tab state
- there is a companion article in `content/blog/2026-march-madness-bracket-analysis.mdx`

### Fantasy football

- fantasy pages mix server-rendered routes with client charts and hooks
- the stack includes SQLite, sample data, scheduled refresh tooling, and tier chart rendering

---

## API Surface

Live routes under `src/app/api/`:

- `/api/auth/[...nextauth]`
- `/api/data-manager`
- `/api/data-metadata`
- `/api/fantasy-data`
- `/api/fantasy-pros-free`
- `/api/fantasy-pros-session`
- `/api/investments/data/[symbol]`
- `/api/investments/index`
- `/api/investments/quotes`
- `/api/premier-league/summary`
- `/api/premier-league/teams/[teamId]`
- `/api/rss`
- `/api/sample-data`
- `/api/scheduled-update`
- `/api/scrape`
- `/api/search`
- `/api/stocks`

Important caveats:

- `/api/search` is still a limited, mostly hardcoded search index
- there is no general `/api/investments` catch-all route anymore
- `/api/investments/quotes` proxies quote access for the investments UI

---

## Styling Rules

Global tokens and helpers live in `src/app/globals.css`.

Key conventions:

- use CSS variables such as `var(--color-primary)` and `var(--text-primary)`
- use semantic shell helpers like:
  - `.page-shell`
  - `.page-shell-tight`
  - `.page-section`
  - `.section-panel`
  - `.section-kicker`
  - `.section-subtitle`
- keep light/dark mode support intact
- maintain 44px minimum touch targets
- honor reduced motion for animated components

Do not reintroduce older “warm modern” or “cyberpunk” palette assumptions into live docs or code unless you are explicitly working on historical materials.

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
- `WRITING_VOICE.md`
- `docs/README.md`
- `docs/ai-context/*`

Treat older plans, redesign specs, SEO summaries, and reference templates as historical unless they explicitly say they are current.

---

## Known Legacy / Historical Areas

The repo still contains older materials for context:

- `docs/plans/*`
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
