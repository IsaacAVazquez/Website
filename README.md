# Isaac Vazquez Website

Portfolio, writing, fantasy football analytics, investment research, and standalone data tools built on Next.js 16.

**Live:** [isaacvazquez.com](https://isaacvazquez.com)
**Last updated:** 2026-11-02

---

## Overview

This repo powers a multi-surface personal site with several live product areas:

- Portfolio: homepage, about, projects, resume, contact
- Writing: MDX-backed long-form posts under `/writing`
- Fantasy football: tiered rankings boards, draft rooms, a mock draft, a trade calculator, and in-season weekly and waiver boards under `/fantasy-football/*`
- Investments and seasonal analysis: `/investments`, `/investments/before-you-buy`, and `/march-madness-2026`
- Sports and data dashboards: off-nav products like `/premier-league`, `/la-liga`, `/mlb`, `/nba`, `/nfl`, `/golf`, `/world-cup-2026`, `/earthquake-pulse`, `/bay-area-transit`, `/tech-startup-tracker`, `/polling-aggregator`, `/news-pulse`, and `/spacex-mission-control`
- Fintech tools: standalone calculators under `/fintech-tools/*`
- Job search tracker: `/mba-internship-notifications`
- Personal tools: `/travel`, `/travel-deals`, `/food-map`, `/recipe-finder`, `/wine-cellar`, and `/museum-log`

The site is portfolio-first. `Writing` is live and promoted in the global header.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Charts | D3 |
| Maps | Leaflet, loaded at a pinned version from unpkg.com by `src/lib/leaflet.ts` for `/bay-area-transit` and `/food-map` |
| Theme | `next-themes` |
| Content | `gray-matter`, `remark`, `remark-gfm`, `remark-rehype`, `rehype-sanitize`, `rehype-stringify` |
| Data | Version-controlled snapshots for repeatable builds, request-time USGS and BART overlays, and Netlify Blobs for runtime last-good caches and for the polling and frontier model snapshots that two scheduled functions in `netlify/functions/` refresh. |
| Email | Resend (newsletter contacts) |
| Tests | Jest, Playwright |
| Deploy | Netlify + `@netlify/plugin-nextjs` |

---

## Main Routes

| Route | Purpose |
|------|---------|
| `/` | Homepage |
| `/about` | Background and journey |
| `/portfolio` | Work page with the four lead projects and the two career write-ups |
| `/portfolio/[slug]` | Permanent redirect from each case study slug to its live tool |
| `/dashboards` | Index of the live dashboards, tools, and calculators |
| `/investments` | Investment research platform |
| `/investments/before-you-buy` | Before You Buy, a two-purchase portfolio comparison concept |
| `/premier-league` | Premier League dashboard |
| `/la-liga` | La Liga dashboard |
| `/formula-1` | Formula 1 dashboard |
| `/fantasy-formula-1` | Fantasy Formula 1 optimizer |
| `/mlb` | MLB dashboard |
| `/nba` | NBA dashboard |
| `/nfl` | NFL dashboard |
| `/golf` | PGA Tour dashboard |
| `/world-cup-2026` | 2026 FIFA World Cup hub |
| `/earthquake-pulse` | USGS earthquake monitor |
| `/bay-area-transit` | BART transit dashboard |
| `/score-pools` | Exact-score pool analysis and tracking |
| `/tech-startup-tracker` | Curated startup funding tracker |
| `/writing` | Writing index |
| `/writing/[slug]` | Article page |
| `/writing/topics/[topic]` | Writing topic index |
| `/march-madness-2026` | Seasonal bracket analysis |
| `/fantasy-football/*` | Fantasy football tools |
| `/ai-dev-tools` | AI development tools directory |
| `/frontier-models` | Frontier model tracker |
| `/github-trending-pulse` | GitHub Trending Pulse dashboard |
| `/agent-build-index` | Focused weekly AI agent repository index |
| `/food-map` | Food map |
| `/recipe-finder` | Recipe finder |
| `/wine-cellar` | Wine cellar |
| `/blackjack-trainer` | Blackjack basic strategy trainer |
| `/news-pulse` | News Pulse dashboard |
| `/spacex-mission-control` | SpaceX Mission Control dashboard |
| `/fintech-tools/budget-planner` | Budget planner |
| `/fintech-tools/interchange-iq` | Interchange fee analyzer |
| `/fintech-tools/rent-vs-buy` | Rent vs buy calculator |
| `/polling-aggregator` | Political polling aggregator |
| `/decision-lab` | Decision-modeling sandbox |
| `/enablement-assistant` | Automation platform enablement assistant |
| `/mba-internship-notifications` | Full-time and internship job search tracker over the tech companies in `src/constants/mba-companies.ts` (Feed, Pipeline with fit grading and interview rounds, Candidates review) |
| `/museum-log` | Museum visit log |
| `/travel` | Browser-persisted travel planner |
| `/travel-deals` | Travel Deal Lab trip cost optimizer |
| `/now` | Current focus / status page |
| `/changelog` | Running log of what's shipped |
| `/arcade` | Reactor, a neon reflex arcade game (style experiment) |
| `/resume` | Resume |
| `/contact` | Contact page |
| `/accessibility` | Accessibility statement |
| `/privacy` | Privacy page |
| `/search` | Site search UI |

Redirects:

- `/projects` -> `/portfolio`
- `/work` -> `/portfolio`
- `/blog` -> `/writing`
- `/blog/:slug` -> `/writing/:slug`
- `/release-notes` -> `/changelog`
- `/fintech-tools` -> `/dashboards`

`next.config.mjs` holds every redirect apart from the per-case-study ones in the `/portfolio/[slug]` stub, and `docs/ai-context/REDIRECTS-AND-NAVIGATION.md` lists the rest (retired portfolio slugs, fantasy shortcuts, feed and contact aliases).

---

## Getting Started

Use Node 22 (`.nvmrc` pins 22, and `package.json` requires `>=22.12.0`).

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
npm run typecheck
npm test
npm run test:e2e
npm run update:fantasy
npm run update:fantasy:weekly
npm run update:score-pools
npm run update:investments
npm run update:football
npm run update:premier-league
npm run update:la-liga
npm run update:mlb
npm run update:nba
npm run update:nfl
npm run update:formula-1
npm run update:golf
npm run update:earthquake
npm run update:world-cup
npm run update:bay-area-transit
npm run update:polling
npm run update:tech-startups
npm run update:frontier-models
npm run update:github-trending
npm run update:spacex
npm run update:spacex-images
npm run update:article-images
```

Football refreshes run through their explicit update commands and scheduled workflows; production builds only consume committed snapshots. `postbuild` runs `scripts/generatePublicSitemap.mjs`, `scripts/buildLlmsFull.mjs` (which writes `public/llms-full.txt`), and `scripts/patch-nft-sharp.mjs`.

---

## Environment Notes

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`. In production the keys the running site reads belong in the Netlify dashboard, and the scheduled refresh workflows read the snapshot keys from GitHub Actions secrets (`refresh-snapshot.yml`, `update-score-pools.yml`, and `update-spacex.yml`).

```env
# Site
SITE_URL=https://isaacvazquez.com
NEXT_PUBLIC_SITE_URL=https://isaacvazquez.com
GOOGLE_SITE_VERIFICATION=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=  # GA4; leave unset to turn analytics off

# Data sources used by update scripts and a few server routes
FOOTBALL_DATA_API_TOKEN=...   # football-data.org, free tier
FINNHUB_API_KEY=...           # quote endpoint for /investments
BART_API_KEY=...              # optional; BART's published demo key is the fallback
SPACEDEVS_API_TOKEN=...       # optional; raises the Launch Library 2 rate limit for update:spacex
THE_ODDS_API_KEY=...          # optional; odds for update:score-pools
API_FOOTBALL_KEY=...          # optional; fixtures and results for update:score-pools
ADZUNA_APP_ID=...             # optional, with ADZUNA_APP_KEY; extra job leads on /mba-internship-notifications
ADZUNA_APP_KEY=...

# Newsletter contacts in Resend
RESEND_CONTACTS_API_KEY=...       # server-only key with contact access
RESEND_API_KEY=...                # fallback when the contacts key is unset
RESEND_NEWSLETTER_SEGMENT_ID=...  # optional segment for new contacts
```

The newsletter keys are described in [`docs/EMAIL_DELIVERY.md`](docs/EMAIL_DELIVERY.md).

- `update:investments` also needs a Python virtualenv at `.venv` with the packages pinned in `scripts/requirements-investments.txt`, as `docs/DATA_UPDATE_OPERATIONS.md` describes.
- `update:football`, `update:premier-league`, and `update:la-liga` only need `FOOTBALL_DATA_API_TOKEN` when rebuilding checked-in football snapshots.
- `npm run dev` reads `.env.local` through Next.js, and so do `update:premier-league`, `update:la-liga`, `update:nba`, `update:spacex`, and `update:spacex-images` through `tsx --env-file-if-exists=.env.local`. The other update scripts read only the shell's environment, so a key meant for `npm run update:score-pools` (`THE_ODDS_API_KEY`, `API_FOOTBALL_KEY`) or `npm run update:bay-area-transit` (`BART_API_KEY`) reaches it only when it is exported in the shell.
- Treat every value above as a secret. See [`docs/SECURITY.md`](docs/SECURITY.md) for the full operational guide and [`SECURITY.md`](SECURITY.md) for vulnerability disclosure.

---

## Important Repo Facts

- Global nav is the seven links in `src/constants/catalog97Nav.ts`, labeled `Home / Work / Writing / Dashboards / About / Résumé / Contact`
- `Writing` is live and intentionally promoted in the header
- `/portfolio` is a server shell in `src/app/portfolio/page.tsx` that passes the project index to `Catalog97Portfolio`
- `/api/search` indexes the full text of every published article, every case study, and a hand-listed set of pages, but no dashboard data, so do not treat it as full site search
- `/investments` uses `InvestmentsClient` plus the `/api/investments/quotes` route
- Sports dashboards read committed snapshots. Earthquake and BART add request-time upstream refreshes with their committed snapshots kept as fallbacks.

---

## Documentation Map

Current source-of-truth docs:

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
- `DESIGN_CHECKLIST.md` (the pre-merge check for any UI change)
- `SEO.md`
- `WRITING_VOICE.md`
- `SECURITY.md` (vulnerability disclosure policy)
- `docs/SECURITY.md` (operational security guide for maintainers)
- `docs/DATA_UPDATE_OPERATIONS.md` (every data refresh command, its output, and its schedule)
- `docs/JOB_SEARCH_PRIVATE_DATA.md` (private job-search pipeline data contract and local directory layout)
- `docs/README.md`
- `docs/ai-context/*`

The subsystem references (snapshot dashboards, the retirement planner, score pools, the fantasy models and kit, and the rest) are listed in the "Documentation map" section of `CLAUDE.md`.

Older plans, redesign specs, and summary docs are kept for history and are explicitly marked as historical where applicable.

---

## Security

Found a vulnerability? Please do not open a public issue. See [`SECURITY.md`](SECURITY.md) for the disclosure process. Day-to-day operational notes (secrets, the public API surface, deployment hygiene) live in [`docs/SECURITY.md`](docs/SECURITY.md). The site has no authenticated surface, since the `/admin` page and NextAuth were removed on 2026-10-02.

---

## License and Use

This repository is published primarily as a personal portfolio. Source code is provided for reference and evaluation; it is not licensed for redistribution or commercial reuse. Written content under `content/`, project copy, brand assets, and resume material are © Isaac Vazquez and reserved. Reach out via [/contact](https://isaacvazquez.com/contact) before reusing anything beyond small, attributed code excerpts.
