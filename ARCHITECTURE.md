# Architecture Documentation

Complete system architecture for Isaac Vazquez's portfolio and fantasy football analytics platform.

**Live Site:** https://isaacavazquez.com
**Framework:** Next.js 16 (App Router)
**Last Updated:** March 2026

---

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Page Routes](#page-routes)
- [API Endpoints](#api-endpoints)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Fantasy Football Data Pipeline](#fantasy-football-data-pipeline)
- [Version History](#version-history)

---

## System Overview

### Dual-Purpose Platform

This is both a **professional portfolio** and a **fantasy football analytics platform**:

1. **Professional Portfolio** – Career showcase, projects, resume, writing, contact
2. **Fantasy Football Analytics** – Live tier rankings (QB/RB/WR/TE/K/DST/Flex), draft tracker, D3 visualizations, automated FantasyPros data pipeline

### Design Philosophy

- **Modern Professional**: Blue-anchored palette (`#2563EB` primary) — credibility without coldness
- **Accessibility First**: WCAG AA minimum compliance
- **Performance**: Lazy-loaded heavy components (D3, player images), bundle splitting
- **Mobile-first**: Fluid type scale, `clamp()`-based responsive sizing

---

## Technology Stack

### Core Framework

```
Next.js 16 (App Router)
├── React 19
├── TypeScript (strict mode; ignoreBuildErrors: true in next.config.mjs)
├── Tailwind CSS v4 (PostCSS plugin: @tailwindcss/postcss)
├── Framer Motion (v12)
├── D3.js (v7) — tier chart visualizations
├── SQLite (better-sqlite3) — server-only fantasy football data
└── NextAuth (v4) — /admin authentication
```

### Key Dependencies

| Category | Packages |
|----------|---------|
| UI / Icons | `@tabler/icons-react`, `lucide-react`, `react-icons` |
| Styling | `tailwind-merge`, `tailwindcss-animate`, `clsx`, `class-variance-authority` |
| Components | `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot` |
| Themes | `next-themes` |
| Content | `gray-matter`, `remark`, `remark-gfm`, `remark-html` |
| SEO | `next-sitemap`, `@tailwindcss/typography` |
| Analytics | `web-vitals` |
| Testing | `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@playwright/test`, `msw` |

### Deployment

- **Platform:** Netlify + `@netlify/plugin-nextjs`
- **Build:** `npm run build` (postbuild auto-generates sitemap)
- **Dev:** `npm run dev` (webpack mode — `--webpack` baked into script)
- **Serverless functions:** `netlify/functions/`
- **Turbopack:** Acknowledged in config (`turbopack: {}`) but dev runs webpack

---

## Page Routes

### Portfolio Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Home (ModernHero) |
| `/about` | `src/app/about/page.tsx` | About with tabbed navigation |
| `/portfolio` | `src/app/portfolio/page.tsx` | Project showcase |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Individual project |
| `/resume` | `src/app/resume/page.tsx` | Resume with PDF download |
| `/contact` | `src/app/contact/page.tsx` | Contact info |
| `/accessibility` | `src/app/accessibility/page.tsx` | Accessibility statement |

### Fantasy Football Pages

| Route | File | Purpose |
|-------|------|---------|
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | FF landing |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Position tiers (qb/rb/wr/te/k/dst/flex) |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | RB tier page |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Draft tracker |

### Content Pages

| Route | File | Purpose |
|-------|------|---------|
| `/writing` | `src/app/writing/page.tsx` | Writing portfolio |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Individual articles |
| `/search` | `src/app/search/page.tsx` | Global search |

> **Note:** `/blog` permanently redirects to `/writing` via `next.config.mjs`. There is no standalone `/blog` app route.

### Financial & Admin Pages

| Route | File | Purpose |
|-------|------|---------|
| `/investments` | `src/app/investments/page.tsx` | Stock research & portfolio |
| `/admin` | `src/app/admin/page.tsx` | Admin dashboard (NextAuth protected) |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Analytics dashboard |

### SEO & PWA

| Route | Purpose |
|-------|---------|
| `/sitemap.xml` | Auto-generated sitemap |
| `/sitemap-local.xml` | Local business structured data |
| `/robots.txt` | Custom (not auto-generated) |
| `/manifest.json` | PWA manifest |

---

## API Endpoints

All routes are Next.js App Router API routes in `src/app/api/`. They return JSON and are server-only.

### Fantasy Football APIs

| Endpoint | Purpose |
|----------|---------|
| `/api/fantasy-data/` | Core fantasy player data (reads from SQLite or sample files) |
| `/api/fantasy-pros/` | FantasyPros authenticated scraping proxy |
| `/api/fantasy-pros-free/` | FantasyPros free tier data |
| `/api/fantasy-pros-session/` | Session management for scraping |
| `/api/data-manager/` | Data management operations |
| `/api/data-metadata/` | Data freshness and metadata |
| `/api/sample-data/` | Sample/fallback data |
| `/api/scheduled-update/` | Cron-triggered data refresh |

### Portfolio & Content APIs

| Endpoint | Purpose |
|----------|---------|
| `/api/analytics/` | Event tracking and web vitals |
| `/api/investments/` | Investment/stock data |
| `/api/search/` | Full-text search |
| `/api/rss/` | RSS feed |
| `/api/scrape/` | Web scraping utilities |
| `/api/stocks/` | Stock data |
| `/api/auth/` | NextAuth endpoints |

### API Response Format

```typescript
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

HTTP status codes: `200` Success, `400` Bad Request, `401` Unauthorized, `429` Rate Limited, `500` Server Error.

---

## Component Architecture

### Organization

```
src/components/
├── ui/                    # Design system primitives
│   ├── WarmCard.tsx       # Container with hover, padding options
│   ├── ModernButton.tsx   # 4 variants: primary/secondary/outline/ghost
│   ├── button.tsx         # Radix/shadcn-style button primitive
│   ├── dropdown-menu.tsx  # Radix dropdown primitive
│   ├── Heading.tsx        # Typography hierarchy
│   ├── Badge.tsx          # Labels and tags
│   ├── JourneyTimeline.tsx
│   ├── OptimizedImage.tsx
│   ├── ThemeToggle.tsx
│   ├── LazyPlayerImage.tsx
│   └── ...
│
├── investments/           # Investment page components (15 components)
├── navigation/            # Breadcrumbs, LazyFantasyComponents
├── search/                # SearchInterface, SearchResults, SearchFilters
├── lazy/                  # React.lazy() wrappers for heavy components
│
├── ConditionalLayout.tsx  # Route-based layout switcher
├── ModernHero.tsx         # Home hero
├── About.tsx
├── ContactContent.tsx
├── ProjectsContent.tsx
├── FeaturedWorkSection.tsx
├── ThemeProvider.tsx      # next-themes context
├── Providers.tsx          # Aggregated context wrapper
├── AIStructuredData.tsx   # AI-specific JSON-LD (in root layout)
└── ...fantasy football components (TierChart, EnhancedPlayerCard, etc.)
```

---

## Data Flow

### Static Content

```
src/constants/
├── personal.ts        → career timeline, metrics, skills
├── navlinks.tsx       → navigation config
├── socials.tsx        → social media links
└── caseStudies.ts     → project data
         ↓
Server Components (data fetching + metadata)
         ↓
Client Components (interactive: tabs, forms, animations)
         ↓
Browser (hydrated React app)
```

### Writing Content

```
content/blog/*.mdx
         ↓
gray-matter (frontmatter parsing)
         ↓
remark + remark-gfm + remark-html
         ↓
/writing/[slug] dynamic routes
```

### Fantasy Football Data

See [Fantasy Football Data Pipeline](#fantasy-football-data-pipeline) below.

---

## Fantasy Football Data Pipeline

### Architecture

```
FantasyPros (external)
         ↓
Session auth (fantasyProsSession.ts)
         ↓
Scraping (fantasyProsAPI.ts / fantasyProsAlternative.ts)
         ↓
Unified API (unifiedFantasyProsAPI.ts)
         ↓
Caching (unifiedCache.ts / dataCache.ts)
         ↓
SQLite (fantasy-data.db via database.ts)
         ↓
/api/fantasy-data/ endpoint
         ↓
React hooks (useUnifiedFantasyData, useAllFantasyData)
         ↓
TierChart + TierChartEnhanced (D3 visualizations)
```

### Tier Calculation

- **Clustering:** K-means via `src/lib/clustering.ts`
- **Tier assignment:** Gaussian mixture models via `src/lib/gaussianMixture.ts`
- **Unified calculator:** `src/lib/unifiedTierCalculator.ts`
- **Scoring formats:** PPR / Standard / Half-PPR via `src/lib/scoringFormatUtils.ts`

### Data Updates

- **Manual:** `npm run update:fantasy-rb`
- **Automated:** Netlify Scheduled Functions → `/api/scheduled-update/` (runs at 2 AM UTC)

### SQLite Limitation

SQLite (`better-sqlite3`) is a server-only native module. It is excluded from:
- Client-side bundle (`webpack externals` in `next.config.mjs`)
- Netlify serverless functions (listed in `serverExternalPackages`)

Data is effectively read-only at runtime on Netlify — write operations happen during build/update scripts.

---

## Security

### Middleware (`src/middleware.ts`)

Applied to all routes. Adds security headers:
- `Content-Security-Policy` (includes `connect-src https://api.fantasypros.com`)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

### Authentication

NextAuth.js protects `/admin` routes with credentials-based auth (env vars: `ADMIN_USERNAME`, `ADMIN_PASSWORD`).

---

## Version History

### Current (March 2026)

- Next.js 16, React 19, Tailwind CSS v4
- Dual-purpose platform: portfolio + fantasy football analytics
- Modern professional blue/slate design system
- Investments tracker with Yahoo Finance integration
- Full test suite: Jest + Playwright

### February 2026

- Added investments page (`/investments`) with stock research panels
- Shipped portfolio refresh: new `/portfolio`, `/resume`, `/writing` experiences
- Fantasy football tooling (RB tiers, draft tracker, sample API responses)
- Netlify build hook for scheduled fantasy data refreshes
- Comprehensive documentation overhaul

### January 2026

- Migrated to Next.js 16 (App Router)
- Re-introduced fantasy football platform with D3 tier visualizations
- SQLite persistence for fantasy data
- Implemented Lighthouse and Core Web Vitals monitoring
- Added `next-sitemap` to build pipeline

---

## Related Documentation

- **[README.md](./README.md)** – Project overview and quick start
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** – Development setup
- **[COMPONENTS.md](./COMPONENTS.md)** – Component library
- **[STYLING.md](./STYLING.md)** – Design system
- **[API.md](./API.md)** – API endpoint reference
- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** – SQLite schema
- **[docs/FANTASY_PLATFORM_SETUP.md](./docs/FANTASY_PLATFORM_SETUP.md)** – Fantasy platform setup
- **[docs/AUTOMATION_SCRIPTS.md](./docs/AUTOMATION_SCRIPTS.md)** – Data automation scripts

---

*Last Updated: March 2026*
