# Isaac Vazquez Website

Portfolio, writing, fantasy football analytics, investment research, and standalone data tools built on Next.js 16.

**Live:** [isaacavazquez.com](https://isaacavazquez.com)
**Last updated:** 2026-04-27

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
| Data | Static, version-controlled snapshots (TypeScript and JSON) for fantasy football, investments, football, Formula 1, golf, polling, and SpaceX dashboards. No runtime database. |
| Email | Resend (MBA internship digest) |
| Auth | NextAuth v4 (credentials provider) |
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
| `/formula-1` | Formula 1 dashboard |
| `/golf` | PGA Tour dashboard |
| `/writing` | Writing index |
| `/writing/[slug]` | Article page |
| `/march-madness-2026` | Seasonal bracket analysis |
| `/fantasy-football/*` | Fantasy football tools |
| `/news-pulse` | News Pulse dashboard |
| `/spacex-mission-control` | SpaceX Mission Control dashboard |
| `/fintech-tools/budget-planner` | Budget planner |
| `/fintech-tools/interchange-iq` | Interchange fee analyzer |
| `/polling-aggregator` | Political polling aggregator |
| `/decision-lab` | Decision-modeling sandbox |
| `/mba-internship-notifications` | MBA role tracker across tech company job boards |
| `/now` | Current focus / status page |
| `/changelog` | Site changelog |
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
npm run update:investments
npm run update:football
npm run update:premier-league
npm run update:la-liga
npm run update:formula-1
npm run update:spacex
```

`prebuild` runs a league-only football snapshot refresh automatically; `postbuild` runs `next-sitemap`.

---

## Environment Notes

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`. In production these are configured in the Netlify dashboard.

```env
# Site
SITE_URL=https://isaacavazquez.com
GOOGLE_SITE_VERIFICATION=...

# Auth (NextAuth + admin gate on /admin)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...           # generate with: openssl rand -base64 32
ADMIN_USERNAME=...
ADMIN_PASSWORD=...

# Data sources used by update scripts and a few server routes
FOOTBALL_DATA_API_TOKEN=...   # football-data.org, free tier
FINNHUB_API_KEY=...           # quote endpoint for /investments
RESEND_API_KEY=...            # MBA internship email digest
CRON_SECRET=...               # protects the Netlify purge-cache function
```

- `update:investments` additionally expects the Python virtualenv described in `DEVELOPMENT.md`.
- `update:football`, `update:premier-league`, and `update:la-liga` only need `FOOTBALL_DATA_API_TOKEN` when rebuilding checked-in football snapshots.
- Treat every value above as a secret. See [`docs/SECURITY.md`](docs/SECURITY.md) for the full operational guide and [`SECURITY.md`](SECURITY.md) for vulnerability disclosure.

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
- `SECURITY.md` — vulnerability disclosure policy
- `docs/SECURITY.md` — operational security guide for maintainers
- `docs/README.md`
- `docs/ai-context/*`

Older plans, redesign specs, and summary docs are kept for history and are explicitly marked as historical where applicable.

---

## Security

Found a vulnerability? Please **do not open a public issue**. See [`SECURITY.md`](SECURITY.md) for the disclosure process. Day-to-day operational notes (secrets, admin gate, deployment hygiene) live in [`docs/SECURITY.md`](docs/SECURITY.md).

---

## License and Use

This repository is published primarily as a personal portfolio. Source code is provided for reference and evaluation; it is not licensed for redistribution or commercial reuse. Written content under `content/`, project copy, brand assets, and resume material are © Isaac Vazquez and reserved. Reach out via [/contact](https://isaacavazquez.com/contact) before reusing anything beyond small, attributed code excerpts.
