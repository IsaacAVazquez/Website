# Isaac Vazquez Website

Portfolio, writing, fantasy football analytics, investment research, and standalone data tools built on Next.js 16.

**Live:** [isaacavazquez.com](https://isaacavazquez.com)
**Last updated:** 2026-04-10

---

## Overview

This repo powers a multi-surface personal site with several live product areas:

- **Portfolio** — homepage, about, projects, resume, contact
- **Writing** — MDX-backed long-form posts under `/writing`
- **Fantasy football** — rankings, tier charts, and draft tooling
- **Investments and seasonal analysis** — `/investments` and `/march-madness-2026`
- **Sports and data dashboards** — off-nav products like `/premier-league`, `/la-liga`, `/polling-aggregator`, `/news-pulse`, and `/spacex-mission-control`
- **Fintech tools** — standalone calculators under `/fintech-tools/*`

The site is portfolio-first. `Writing` is live and promoted in the global header.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, Framer Motion |
| Charts | D3 |
| Theme | `next-themes` |
| Content | `gray-matter`, `remark`, `remark-gfm`, `remark-html` |
| Data | SQLite (`better-sqlite3`) for fantasy football, curated static snapshots for investments and football dashboards |
| Auth | NextAuth v4 |
| Tests | Jest, Playwright |
| Deploy | Netlify + `@netlify/plugin-nextjs` |

---

## Main Routes

| Route | Purpose |
|------|---------|
| `/` | Homepage |
| `/about` | Background and journey |
| `/portfolio` | Projects index |
| `/portfolio/[slug]` | Project detail |
| `/investments` | Investment research platform |
| `/premier-league` | Premier League dashboard |
| `/la-liga` | La Liga dashboard |
| `/writing` | Writing index |
| `/writing/[slug]` | Article page |
| `/march-madness-2026` | Seasonal bracket analysis |
| `/fantasy-football/*` | Fantasy football tools |
| `/news-pulse` | News Pulse dashboard |
| `/spacex-mission-control` | SpaceX Mission Control dashboard |
| `/fintech-tools/budget-planner` | Budget planner |
| `/fintech-tools/interchange-iq` | Interchange fee analyzer |
| `/polling-aggregator` | Political polling aggregator |
| `/resume` | Resume |
| `/contact` | Contact page |
| `/accessibility` | Accessibility statement |
| `/search` | Site search UI |
| `/admin` | Protected admin surface |

Redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Key scripts

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
npm run update:fantasy
npm run update:fantasy-rb
npm run update:investments
npm run update:football
npm run update:premier-league
npm run update:la-liga
```

---

## Environment Notes

Common local env vars:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
FANTASYPROS_USERNAME=...
FANTASYPROS_PASSWORD=...
FANTASYPROS_API_KEY=...
FOOTBALL_DATA_API_TOKEN=...
CRON_SECRET=...
SITE_URL=https://isaacavazquez.com
```

`update:investments` also expects the Python environment described in `DEVELOPMENT.md`.
`update:football`, `update:premier-league`, and `update:la-liga` use `FOOTBALL_DATA_API_TOKEN` only when rebuilding checked-in football snapshots.

---

## Important Repo Facts

- Global nav is `Home / About / Projects / Writing / Investments / Resume / Contact`
- `Writing` is live and intentionally promoted in the header
- `/portfolio` renders directly from `src/app/portfolio/page.tsx`
- `ProjectsContent.tsx` and `WritingPreview.tsx` still exist, but they are not the primary live path for the current shell
- `/api/search` is limited and mostly hardcoded; do not treat it as comprehensive site search
- `/investments` uses `InvestmentsClient` plus targeted routes under `/api/investments/index`, `/api/investments/quotes`, and `/api/investments/data/[symbol]`
- `/premier-league` and `/la-liga` read from committed TypeScript snapshots, not live third-party API calls at runtime

---

## Documentation Map

Current source-of-truth docs:

- `AGENT.md`
- `AGENTS.md`
- `CLAUDE.md`
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

Older plans, redesign specs, and summary docs are kept for history and are explicitly marked as historical where applicable.
