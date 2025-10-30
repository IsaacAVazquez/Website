# Website Map - Isaac Vazquez Digital Platform

**Last Updated:** October 29, 2025
**Live Site:** https://isaacavazquez.com
**Platform:** Next.js 15 App Router

---

## Table of Contents

- [Site Overview](#site-overview)
- [Complete Page Routes](#complete-page-routes)
- [API Endpoints](#api-endpoints)
- [Navigation System](#navigation-system)
- [URL Redirects & Aliases](#url-redirects--aliases)
- [Quick Reference](#quick-reference)

---

## Site Overview

The platform serves **two primary purposes**:

1. **Professional Portfolio** - Showcasing Isaac Vazquez's work as a QA Engineer & Builder, MBA candidate
2. **Fantasy Football Analytics Platform** - Advanced sports analytics with ML-powered tier calculations

**Design Theme:** Cyberpunk Professional ("Digital Command Center")
**Architecture:** Dual-purpose with conditional full-screen layouts
**Key Features:** Terminal interface, glassmorphism UI, real-time data processing, ML tier calculations

---

## Complete Page Routes

### Portfolio Section

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/` | `src/app/page.tsx` | Home page with TerminalHero | Full-screen, no chrome |
| `/about` | `src/app/about/page.tsx` | Personal story and background | Standard layout |
| `/projects` | `src/app/projects/page.tsx` | Project showcase with bento layout | Standard layout |
| `/resume` | `src/app/resume/page.tsx` | Cyberpunk-styled professional resume | Standard layout |
| `/contact` | `src/app/contact/page.tsx` | Contact form and social links | Standard layout |

### Fantasy Football Analytics Platform

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Main fantasy football analytics hub | Full-width, specialized |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Interactive draft tracking tool | Full-width |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Dynamic position-based tier charts | Full-width |
| `/draft-tiers` | `src/app/draft-tiers/page.tsx` | Advanced draft tier visualization | Full-width |

**Dynamic Position Routes:**
- `/fantasy-football/tiers/qb` - Quarterback rankings
- `/fantasy-football/tiers/rb` - Running back rankings
- `/fantasy-football/tiers/wr` - Wide receiver rankings
- `/fantasy-football/tiers/te` - Tight end rankings
- `/fantasy-football/tiers/k` - Kicker rankings
- `/fantasy-football/tiers/dst` - Defense/Special teams rankings
- `/fantasy-football/tiers/flex` - Flex position rankings
- `/fantasy-football/tiers/overall` - Overall player rankings

### Content Management System

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/blog` | `src/app/blog/page.tsx` | Blog listing with filtering | Standard layout |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Individual blog posts (MDX) | Standard layout |
| `/writing` | `src/app/writing/page.tsx` | Writing portfolio | Standard layout |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Individual writing pieces | Standard layout |
| `/notes` | `src/app/notes/page.tsx` | Notes section | Standard layout |
| `/newsletter` | `src/app/newsletter/page.tsx` | Newsletter subscription | Standard layout |

**Blog Content Location:** `/content/blog/*.mdx` (16 blog posts)

### Utility & Administrative Pages

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/admin` | `src/app/admin/page.tsx` | Administrative dashboard | Admin layout |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Analytics management | Admin layout |
| `/search` | `src/app/search/page.tsx` | Global search interface | Standard layout |
| `/consulting` | `src/app/consulting/page.tsx` | Consulting services | Standard layout |
| `/testimonials` | `src/app/testimonials/page.tsx` | Client testimonials | Standard layout |
| `/faq` | `src/app/faq/page.tsx` | Frequently asked questions | Standard layout |

---

## API Endpoints

### Fantasy Sports Data APIs

| Endpoint | File | Purpose | Method |
|----------|------|---------|--------|
| `/api/fantasy-data` | `src/app/api/fantasy-data/route.ts` | Main fantasy sports data endpoint | GET/POST |
| `/api/fantasy-pros` | `src/app/api/fantasy-pros/route.ts` | FantasyPros integration and sync | GET/POST |
| `/api/fantasy-pros-free` | `src/app/api/fantasy-pros-free/route.ts` | Free tier data access | GET |
| `/api/fantasy-pros-session` | `src/app/api/fantasy-pros-session/route.ts` | Session management for data sources | GET/POST |
| `/api/draft-tiers` | `src/app/api/draft-tiers/route.ts` | Advanced tier calculations & rankings | GET/POST |
| `/api/player-images-mapping` | `src/app/api/player-images-mapping/route.ts` | Player image management | GET/POST |
| `/api/data-manager` | `src/app/api/data-manager/route.ts` | Data management operations (CRUD) | GET/POST/PUT/DELETE |
| `/api/data-metadata` | `src/app/api/data-metadata/route.ts` | Data metadata and statistics | GET |
| `/api/data-pipeline` | `src/app/api/data-pipeline/route.ts` | Automated data processing pipeline | POST |
| `/api/scheduled-update` | `src/app/api/scheduled-update/route.ts` | Scheduled data updates | POST |
| `/api/scrape` | `src/app/api/scrape/route.ts` | Web scraping operations | POST |
| `/api/sample-data` | `src/app/api/sample-data/route.ts` | Sample data for testing | GET |

### Core Application APIs

| Endpoint | File | Purpose | Method |
|----------|------|---------|--------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth.js authentication | ALL |
| `/api/analytics/events` | `src/app/api/analytics/events/route.ts` | Event tracking and analytics | POST |
| `/api/analytics/web-vitals` | `src/app/api/analytics/web-vitals/route.ts` | Performance monitoring | POST |
| `/api/newsletter/subscribe` | `src/app/api/newsletter/subscribe/route.ts` | Newsletter subscription | POST |
| `/api/search` | `src/app/api/search/route.ts` | Global search functionality | GET |
| `/api/rss` | `src/app/api/rss/route.ts` | RSS feed generation | GET |

---

## Navigation System

### Primary Navigation

**File:** `src/constants/navlinks.tsx`

```typescript
Primary Nav Items:
├── Home (/)
├── About (/about)
├── Fantasy Football (/fantasy-football)
├── Blog (/blog)
├── Resume (/resume)
└── Contact (/contact)
```

### Navigation Components

| Component | File | Purpose |
|-----------|------|---------|
| `FloatingNav` | `src/components/ui/FloatingNav.tsx` | Persistent navigation overlay with fantasy integration |
| `CommandPalette` | `src/components/ui/CommandPalette.tsx` | Keyboard shortcut navigation (⌘K) with search |
| `Breadcrumbs` | `src/components/navigation/Breadcrumbs.tsx` | Contextual navigation for complex sections |
| `ConditionalLayout` | `src/components/ConditionalLayout.tsx` | Dynamic layout manager for route-specific layouts |

### Fantasy Football Sub-Navigation

```typescript
Fantasy Football Section:
├── Analytics Hub (/fantasy-football)
├── Draft Tracker (/fantasy-football/draft-tracker)
├── Player Tiers (/draft-tiers)
└── Position Rankings
    ├── QB (/fantasy-football/tiers/qb)
    ├── RB (/fantasy-football/tiers/rb)
    ├── WR (/fantasy-football/tiers/wr)
    ├── TE (/fantasy-football/tiers/te)
    ├── K (/fantasy-football/tiers/k)
    └── DST (/fantasy-football/tiers/dst)
```

---

## URL Redirects & Aliases

**Configuration:** `next.config.mjs` - `redirects()` function

### Portfolio Redirects

| Source | Destination | Type | Purpose |
|--------|-------------|------|---------|
| `/portfolio` | `/projects` | Permanent | Portfolio variations |
| `/work` | `/projects` | Permanent | Common alias |
| `/cv` | `/resume` | Permanent | CV alias |
| `/resume.pdf` | `/Isaac_Vazquez_Resume.pdf` | Permanent | Direct PDF access |
| `/get-in-touch` | `/contact` | Permanent | Contact variations |
| `/hire-me` | `/contact` | Permanent | Contact variations |

### Fantasy Football Redirects

| Source | Destination | Type | Purpose |
|--------|-------------|------|---------|
| `/ff` | `/fantasy-football` | Temporary | Quick alias |
| `/rankings` | `/fantasy-football` | Temporary | Rankings alias |
| `/tiers` | `/draft-tiers` | Temporary | Tiers shortcut |
| `/qb` | `/fantasy-football/tiers/qb` | Temporary | Position shortcuts |
| `/rb` | `/fantasy-football/tiers/rb` | Temporary | Position shortcuts |
| `/wr` | `/fantasy-football/tiers/wr` | Temporary | Position shortcuts |
| `/te` | `/fantasy-football/tiers/te` | Temporary | Position shortcuts |

### Content Redirects

| Source | Destination | Type | Purpose |
|--------|-------------|------|---------|
| `/blog/posts/:slug` | `/blog/:slug` | Permanent | Legacy blog URLs |
| `/articles/:slug` | `/blog/:slug` | Permanent | Legacy content URLs |

### Typo Protection

| Source | Destination | Type | Purpose |
|--------|-------------|------|---------|
| `/fantsy-football/:path*` | `/fantasy-football/:path*` | Temporary | Common misspelling |
| `/fantasy-footbal/:path*` | `/fantasy-football/:path*` | Temporary | Common misspelling |
| `/quatrerback` | `/fantasy-football/tiers/qb` | Temporary | Common misspelling |

---

## Quick Reference

### Most Important Routes

**For Users:**
- Home: `/`
- Fantasy Analytics: `/fantasy-football`
- Draft Tool: `/fantasy-football/draft-tracker`
- Player Tiers: `/draft-tiers`
- Resume: `/resume`
- Contact: `/contact`

**For Developers:**
- API Health: `/api/fantasy-data`
- Admin Dashboard: `/admin`
- Analytics: `/admin/analytics`
- Search: `/search`

### Static Assets

| Asset Type | Location | Purpose |
|------------|----------|---------|
| Headshots | `/public/images/headshot-*.png` | Profile images (320px, 640px) |
| Logos | `/public/images/logos/` | Company/organization logos |
| Resume PDF | `/public/Isaac_Vazquez_Resume.pdf` | Downloadable resume |
| About Image | `/public/images/about.webp` | About page hero image |
| Sitemap | `/public/sitemap.xml` | SEO sitemap (auto-generated) |

### Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js configuration, redirects, image optimization |
| `tailwind.config.ts` | Tailwind CSS configuration, cyberpunk theme |
| `next-sitemap.config.js` | SEO sitemap generation settings |
| `netlify.toml` | Netlify deployment configuration (primary) |
| `vercel.json` | Vercel deployment configuration (secondary) |

### SEO & Metadata

**SEO Library:** `src/lib/seo.ts`

All pages include:
- Dynamic metadata generation
- OpenGraph tags
- Twitter cards
- Structured data (JSON-LD)
- Breadcrumb navigation
- Canonical URLs

**Sitemap Generation:** Automatic via `next-sitemap` post-build

---

## Layout Patterns

### Layout Types

1. **Full-Screen (Home)**
   - No header/sidebar chrome
   - Immersive terminal interface
   - FloatingNav and CommandPalette available

2. **Standard Layout**
   - Full-width content
   - FloatingNav navigation
   - Footer included
   - Responsive mobile navigation

3. **Full-Width Specialized (Fantasy Football)**
   - Optimized for data visualization
   - Wide charts and tables
   - Position-specific filtering
   - Real-time data updates

4. **Admin Layout**
   - Protected routes (NextAuth)
   - Admin-specific navigation
   - Analytics dashboards

### Conditional Layout Logic

**File:** `src/components/ConditionalLayout.tsx`

```typescript
Layout Decision Tree:
├── Is Home page? → Full-screen TerminalHero
├── Is Fantasy Football? → Full-width specialized layout
├── Is Admin? → Protected admin layout
└── Default → Standard full-width with navigation
```

---

## Social & External Links

| Platform | URL | Purpose |
|----------|-----|---------|
| LinkedIn | https://linkedin.com/in/isaac-vazquez | Professional network |
| GitHub | https://github.com/isaacavazquez | Code repositories |
| Email | isaacavazquez95@gmail.com | Direct contact |
| Website | https://isaacavazquez.com | This site |

---

## Notes for Developers

### Adding New Routes

1. Create page in `src/app/[route]/page.tsx`
2. Add metadata using `constructMetadata()` from `src/lib/seo.ts`
3. Add structured data with `<StructuredData />` component
4. Update navigation in `src/constants/navlinks.tsx` if needed
5. Consider adding redirect aliases in `next.config.mjs`
6. Update sitemap priority in `next-sitemap.config.js`

### Testing Routes Locally

```bash
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Test production build
npm run start                  # Run production server
```

### Route Protection

- Admin routes: Protected via NextAuth (`/admin/*`)
- API routes: Rate limited via `src/lib/rateLimit.ts`
- Public routes: No authentication required

---

**For detailed component documentation, see:** `COMPONENT_MAP.md`
**For data architecture, see:** `DATA_ARCHITECTURE_MAP.md`
**For technology stack, see:** `TECHNOLOGY_STACK_MAP.md`
