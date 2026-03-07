# Page Architecture Documentation

Complete page structure and routing guide for Isaac Vazquez's portfolio website.

**Framework:** Next.js 16 App Router
**Last Updated:** March 2026

---

## Table of Contents

- [Page Overview](#page-overview)
- [Portfolio Pages](#portfolio-pages)
- [Fantasy Football Pages](#fantasy-football-pages)
- [Content Pages](#content-pages)
- [Financial Pages](#financial-pages)
- [Admin & Utility Pages](#admin--utility-pages)
- [URL Redirects](#url-redirects)
- [Page Structure Patterns](#page-structure-patterns)
- [SEO & Metadata](#seo--metadata)

---

## Page Overview

### Routing Structure

```
Portfolio Section
├── Home (/)
├── About (/about)
├── Portfolio (/portfolio, /portfolio/[slug])
├── Resume (/resume)
├── Contact (/contact)
└── Accessibility (/accessibility)

Fantasy Football Platform (/fantasy-football)
├── Landing (/fantasy-football)
├── Position Tiers (/fantasy-football/tiers/[position])
├── RB Tiers (/fantasy-football/rb-tiers)
└── Draft Tracker (/fantasy-football/draft-tracker)

Content Pages
├── Writing (/writing)
└── Writing Post (/writing/[slug])

Financial
└── Investments (/investments)

Utility
├── Search (/search)
├── Admin (/admin)
└── Admin Analytics (/admin/analytics)
```

---

## Portfolio Pages

### Home Page (/)

**File:** `src/app/page.tsx`
**Component:** `ModernHero`

The home page renders the `ModernHero` component with a professional hero section, featured work, and key CTAs.

#### Metadata
```typescript
title: "Isaac Vazquez - Technical Product Manager & UC Berkeley MBA"
description: "Bay Area-based product manager pursuing MBA at UC Berkeley Haas..."
```

---

### About Page (/about)

**File:** `src/app/about/page.tsx` → `src/components/About.tsx`

Tabbed interface with two views:
- **Overview** – Skills, background, experience summary
- **Journey** – Career timeline via `JourneyTimeline` component

---

### Portfolio Page (/portfolio)

**File:** `src/app/portfolio/page.tsx` → `src/components/ProjectsContent.tsx`

> **Note:** `/projects` is not an app route — it redirects permanently to `/portfolio` via `next.config.mjs`. Do not create `src/app/projects/`.

Project showcase with:
- Grid of project cards via `WarmCard`
- Tech stack badges
- Links to live demos and repositories
- Individual project detail pages at `/portfolio/[slug]`

---

### Resume Page (/resume)

**File:** `src/app/resume/page.tsx` → `src/app/resume/resume-client.tsx`

Professional resume with:
- PDF download (links to `/Isaac_Vazquez_Resume.pdf`)
- Structured sections: Summary, Experience, Education, Skills
- Wider `max-w-6xl` layout

---

### Contact Page (/contact)

**File:** `src/app/contact/page.tsx` → `src/components/ContactContent.tsx`

Contact information with:
- Email and LinkedIn CTAs
- 3-column info grid (Experience / Results / Response)
- Location card

---

### Accessibility Page (/accessibility)

**File:** `src/app/accessibility/page.tsx`

Accessibility statement with WCAG AA compliance details.

---

## Fantasy Football Pages

### Landing Page (/fantasy-football)

**File:** `src/app/fantasy-football/page.tsx` → `src/app/fantasy-football/fantasy-football-client.tsx`
**Component:** `FantasyFootballLandingContent`

Main fantasy football hub with:
- Position navigation
- Overview of available ranking tools
- Links to position tiers

---

### Position Tiers (/fantasy-football/tiers/[position])

**File:** `src/app/fantasy-football/tiers/[position]/page.tsx`

Dynamic route for each position: `qb`, `rb`, `wr`, `te`, `k`, `dst`, `flex`

Features:
- D3-powered `TierChart` / `TierChartEnhanced` visualizations
- Gaussian mixture model clustering
- `DataFreshnessIndicator` showing data age
- `ExpertConsensusIndicator`
- `PositionSelector` tab navigation

---

### RB Tiers (/fantasy-football/rb-tiers)

**File:** `src/app/fantasy-football/rb-tiers/page.tsx`

RB-specific tier page with `RBTiersChart` visualization.

---

### Draft Tracker (/fantasy-football/draft-tracker)

**File:** `src/app/fantasy-football/draft-tracker/page.tsx`

Draft tracking tool with:
- `DraftTierChart` visualization
- Player pick tracking

---

## Content Pages

### Writing (/writing)

**File:** `src/app/writing/page.tsx`

Writing portfolio listing all published articles from `content/blog/`.

> **Note:** `/blog` permanently redirects to `/writing` via `next.config.mjs`. The canonical URL is `/writing`. Do not treat `/blog` as an active route.

---

### Writing Post (/writing/[slug])

**File:** `src/app/writing/[slug]/page.tsx`

Individual writing pieces processed from `content/blog/*.mdx` files via `gray-matter` + `remark`.

Content frontmatter fields:
```yaml
title: string
excerpt: string
publishedAt: string (ISO date)
category: string
tags: string[]
featured: boolean
author: string
```

---

## Financial Pages

### Investments (/investments)

**File:** `src/app/investments/page.tsx`

Stock research and portfolio tracking with:
- `PortfolioTracker` – portfolio overview
- `StockResearch` – multi-panel research interface
- Research panels: `DCFPanel`, `FundamentalsPanel`, `GrowthPanel`, `ValuationRatiosPanel`, `NewsPanel`, `TranscriptsPanel`
- Data sourced from Yahoo Finance via `src/lib/yahooFinance.ts`

---

## Admin & Utility Pages

### Search (/search)

**File:** `src/app/search/page.tsx`
**Components:** `SearchInterface`, `SearchResults`, `SearchFilters`

Global search across portfolio content and writing.

---

### Admin (/admin)

**File:** `src/app/admin/page.tsx`
**Protected by:** NextAuth.js (`src/lib/auth.ts`)

Admin dashboard for site management. Requires `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.

---

### Admin Analytics (/admin/analytics)

**File:** `src/app/admin/analytics/page.tsx`

Analytics dashboard showing tracked events and web vitals.

---

## URL Redirects

The following redirects are configured in `next.config.mjs`:

| From | To | Type |
|------|----|------|
| `/projects` | `/portfolio` | Permanent |
| `/work` | `/portfolio` | Permanent |
| `/projects/:path` | `/portfolio/:path` | Permanent |
| `/blog` | `/writing` | Permanent |
| `/blog/:slug` | `/writing/:slug` | Permanent |
| `/cv` | `/resume` | Permanent |
| `/resume.pdf` | `/Isaac_Vazquez_Resume.pdf` | Permanent |
| `/get-in-touch` | `/contact` | Permanent |
| `/hire-me` | `/contact` | Permanent |
| `/ff` | `/fantasy-football` | Temporary |
| `/rankings` | `/fantasy-football` | Temporary |
| `/qb` | `/fantasy-football/tiers/qb` | Temporary |
| `/rb` | `/fantasy-football/tiers/rb` | Temporary |
| `/wr` | `/fantasy-football/tiers/wr` | Temporary |
| `/te` | `/fantasy-football/tiers/te` | Temporary |
| `/fantsy-football/:path` | `/fantasy-football/:path` | Temporary (typo) |
| `/fantasy-footbal/:path` | `/fantasy-football/:path` | Temporary (typo) |
| `/quatrerback` | `/fantasy-football/tiers/qb` | Temporary (typo) |

---

## Page Structure Patterns

### Standard Page Pattern

```tsx
export const metadata: Metadata = {
  title: "Page Title - Isaac Vazquez",
  description: "Page description",
};

export default function PageName() {
  return (
    <div className="min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-[var(--text-primary)]">Page Title</h1>
        <WarmCard padding="lg">
          <ContentComponent />
        </WarmCard>
      </div>
    </div>
  );
}
```

### Max Widths

| Page Type | Max Width |
|-----------|-----------|
| Standard pages | `max-w-5xl` |
| Resume | `max-w-6xl` |
| Headers / centered content | `max-w-4xl` |

### Spacing

```tsx
className="py-16 sm:py-20 lg:py-24"  // Section vertical padding
className="px-4 sm:px-6 lg:px-8"     // Horizontal padding
className="mb-12"                     // Header bottom margin
className="space-y-8"                 // Content spacing
```

---

## SEO & Metadata

### Metadata Pattern

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Title - Isaac Vazquez",
  description: "SEO-optimized page description.",
  openGraph: {
    title: "Page Title",
    description: "Page description",
    url: "https://isaacavazquez.com/page-name",
    siteName: "Isaac Vazquez",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Page description",
  },
};
```

### Adding a New Page

1. Create `src/app/[page-name]/page.tsx`
2. Export `metadata` for SEO
3. Add to `src/constants/navlinks.tsx` if it belongs in nav
4. Update `next-sitemap.config.js` with priority and `changefreq`

---

## Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture
- **[COMPONENTS.md](./COMPONENTS.md)** - Component library reference
- **[STYLING.md](./STYLING.md)** - Design system and CSS conventions
- **[API.md](./API.md)** - API endpoint reference

---

*Last Updated: March 2026*
