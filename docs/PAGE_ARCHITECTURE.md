# Page Architecture Documentation

## Overview

The Isaac Vazquez Digital Platform is a **dual-purpose application** serving as both a professional portfolio and a sophisticated Fantasy Football Analytics Platform. This document covers all page routes, their structure, metadata configuration, and SEO implementation.

---

## Application Structure

### Portfolio Section (Personal/Professional)

**Base Path:** `/`

Pages focused on professional presentation and personal branding.

### Fantasy Football Platform

**Base Path:** `/fantasy-football`

Advanced analytics platform with machine learning tier calculations and draft tracking.

### Administrative & Utility

**Base Path:** `/admin`, `/search`, etc.

Backend management and search functionality.

---

## Complete Page Routing

### Portfolio Pages

#### **Home** - `/`
- **Component:** `src/app/page.tsx`
- **Purpose:** Immersive terminal hero with professional introduction
- **Layout:** Full-screen TerminalHero + secondary content sections
- **Key Features:**
  - Animated terminal interface
  - Professional value proposition
  - Fun facts section
  - CTA cards (Resume, Contact)
  - Quick access links (Fantasy Football, Blog, Resume)
- **Metadata:**
  - Title: "Isaac Vazquez - Product Manager & UC Berkeley MBA Student"
  - Description: Technical product manager with strategic vision

**Content Structure:**
```tsx
<TerminalHero />           // Full-screen terminal interface
<ProductVisionSection />   // Headshot + value proposition
<FunFactsSection />        // Career journey highlights
<CTAGrid />                // Resume + Contact CTAs
```

---

#### **About** - `/about`
- **Component:** `src/app/about/page.tsx`
- **Purpose:** Detailed professional background and story
- **Layout:** Centered content container (max-w-4xl)
- **Key Features:**
  - Berkeley Haas MBA credentials
  - Career transition narrative
  - Core competencies (Product, Technical, Analytics, Leadership)
  - Experience at Civitech and State of Florida
  - MBA pursuit details
- **Metadata:**
  - Title: "About"
  - Canonical: `/about`
- **Structured Data:**
  - Person schema with job title, education, skills
  - AlumniOf: UC Berkeley Haas

**Breadcrumbs:**
```
Home > About
```

---

#### **Resume** - `/resume`
- **Component:** `src/app/resume/page.tsx` → `resume-client.tsx`
- **Purpose:** Comprehensive professional resume with download capability
- **Layout:** Full-width responsive design
- **Key Features:**
  - Professional summary
  - Experience section (Civitech, Open Progress)
  - Education (UC Berkeley MBA, FSU)
  - Skills categorization (Product & Analytics, Data & Development, Cloud & AI, Design & Collaboration)
  - PDF download functionality
  - Responsive design (mobile-first)
- **Metadata:**
  - Title: "Resume"
  - Description: "Berkeley Haas MBA Candidate '27, Consortium Fellow"
  - Canonical: `/resume`
- **Structured Data:**
  - Person schema with detailed occupation
  - WorksFor: CiviTech
  - AlumniOf: UC Berkeley, Florida State University

**Download Path:**
```
/Isaac_Vazquez_Resume.pdf
```

**Responsive Container:**
```tsx
<div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
  {/* Resume content with progressive padding */}
</div>
```

---

#### **Projects** - `/projects`
- **Component:** `src/app/projects/page.tsx`
- **Purpose:** Fantasy Football project showcase
- **Layout:** Full-width with max-w-7xl container
- **Key Features:**
  - Fantasy Football Landing Content
  - Interactive tier visualizations
  - Draft tracker showcase
  - Data management interface
- **Metadata:**
  - Breadcrumbs: Home > Fantasy Football
- **Structured Data:**
  - SoftwareApplication schemas for:
    - Interactive Fantasy Football Tier Graph
    - Fantasy Football Draft Tier Cards
    - Fantasy Football Data Management

**Programming Languages:**
- TypeScript, JavaScript

**Keywords:**
- D3.js, K-Means, Data Visualization, React, Next.js, API Integration

---

#### **Contact** - `/contact`
- **Component:** `src/app/contact/page.tsx`
- **Purpose:** Contact form and connection options
- **Layout:** Centered content container (max-w-4xl)
- **Key Features:**
  - Contact form
  - Social links
  - Professional email
  - LinkedIn and GitHub profiles
- **Metadata:**
  - Title: "Contact"
  - Description: "Get in touch with Isaac Vazquez"
  - Canonical: `/contact`
- **Structured Data:**
  - ContactPage schema
  - Person entity with email and URL

**Contact Information:**
```
Email: isaacavazquez95@gmail.com
LinkedIn: linkedin.com/in/isaac-vazquez
GitHub: github.com/IsaacAVazquez
```

---

#### **Blog** - `/blog`
- **Component:** `src/app/blog/page.tsx`
- **Purpose:** Technical insights and deep dives
- **Layout:** Centered with max-w-4xl
- **Key Features:**
  - Category filtering (Product Management, Fantasy Football, Software Development)
  - Tag filtering
  - Search functionality
  - Featured posts section
  - Coming soon placeholder
- **Metadata:**
  - Title: "Blog - QA Engineering & Fantasy Football Analytics"
  - Description: "Product management insights, fantasy football analytics, and technical leadership"
  - Canonical: `/blog`
- **Structured Data:**
  - WebPage schema with publish/modified dates

**Search Parameters:**
```typescript
?category=product-management
?tag=analytics
?q=search+term
```

**Content Categories:**
- Product Management
- Fantasy Football Analytics
- Software Development

---

#### **Blog Post** - `/blog/[slug]`
- **Component:** `src/app/blog/[slug]/page.tsx`
- **Purpose:** Individual blog post content
- **Layout:** Dynamic based on MDX content
- **Key Features:**
  - MDX support
  - Reading time
  - Category/tag metadata
  - Social sharing
  - Related posts

**Example Paths:**
```
/blog/mastering-fantasy-football-analytics
/blog/product-management-frameworks
/blog/mba-learnings-applied-to-product
```

---

### Fantasy Football Platform Pages

#### **Fantasy Football Hub** - `/fantasy-football`
- **Component:** `src/app/fantasy-football/page.tsx`
- **Purpose:** Main analytics platform landing page
- **Layout:** Full-width fantasy-specific layout
- **Key Features:**
  - Interactive tier rankings
  - Position-based navigation
  - Expert consensus aggregation
  - Real-time data integration
- **Metadata:**
  - Title: "Fantasy Football Tier Rankings"
  - Description: "Interactive fantasy football tier rankings with data visualization"
  - Canonical: `/fantasy-football`
- **Structured Data:**
  - SportsApplication schema
  - FAQPage with common questions
  - BreadcrumbList

**Feature List:**
- Real-time NFL player data integration
- K-Means clustering tier analysis
- Interactive D3.js visualizations
- Position-specific player rankings
- Expert consensus aggregation
- Mobile-responsive design

**FAQ Topics:**
- How are tiers calculated?
- How often is data updated?
- What positions are included?

---

#### **Draft Tracker** - `/fantasy-football/draft-tracker`
- **Component:** `src/app/fantasy-football/draft-tracker/page.tsx`
- **Purpose:** Interactive draft tracking tool
- **Layout:** Full-width with specialized draft board
- **Key Features:**
  - DraftBoard component
  - DraftControls
  - DraftHistory tracking
  - DraftSetup wizard
  - PlayerDraftCard displays
- **Data Source:**
  - Real-time player database
  - Live draft updates
  - Historical draft analytics

**Location:**
```
src/components/fantasy-football/draft-tracker/components/
├── DraftBoard.tsx
├── DraftControls.tsx
├── DraftHistory.tsx
├── DraftSetup.tsx
└── PlayerDraftCard.tsx
```

---

#### **Position Tiers** - `/fantasy-football/tiers/[position]`
- **Component:** `src/app/fantasy-football/tiers/[position]/page.tsx`
- **Purpose:** Dynamic position-based tier charts
- **Layout:** Full-width with tier visualization
- **Key Features:**
  - TierChart component
  - TierChartEnhanced (ML insights)
  - LightweightTierChart (mobile optimized)
  - PositionSelector
  - EnhancedPlayerCard
- **Dynamic Routes:**
  - `/fantasy-football/tiers/qb` - Quarterbacks
  - `/fantasy-football/tiers/rb` - Running Backs
  - `/fantasy-football/tiers/wr` - Wide Receivers
  - `/fantasy-football/tiers/te` - Tight Ends
  - `/fantasy-football/tiers/k` - Kickers
  - `/fantasy-football/tiers/dst` - Defense/Special Teams

**Data Files:**
```
src/data/
├── qbData.ts
├── rbData.ts
├── wrData.ts
├── teData.ts
├── kData.ts
└── dstData.ts
```

---

#### **Draft Tiers** - `/draft-tiers`
- **Component:** `src/app/draft-tiers/page.tsx`
- **Purpose:** Advanced draft tier visualization system
- **Layout:** Full-width with D3.js charts
- **Key Features:**
  - DraftTierChart (D3.js)
  - Machine learning tier calculations
  - Gaussian mixture models
  - Statistical clustering
  - Dynamic chart generation

**Tier Calculation Methods:**
```
src/lib/
├── tierCalculator.ts           // Core algorithms
├── optimizedTierCalculator.ts  // Performance optimized
├── unifiedTierCalculator.ts    // Unified system
├── clustering.ts               // K-means clustering
├── gaussianMixture.ts          // Statistical modeling
└── tierGrouping.ts             // Advanced grouping
```

---

### Administrative Pages

#### **Admin Dashboard** - `/admin`
- **Component:** `src/app/admin/page.tsx`
- **Purpose:** Administrative control panel
- **Layout:** Admin-specific layout
- **Access:** Restricted (NextAuth.js)
- **Key Features:**
  - Data management controls
  - Performance monitoring
  - User analytics
  - System status

---

#### **Admin Analytics** - `/admin/analytics`
- **Component:** `src/app/admin/analytics/page.tsx`
- **Purpose:** Analytics management console
- **Layout:** Full-width admin layout
- **Key Features:**
  - User engagement metrics
  - Performance analytics
  - Traffic analysis
  - Conversion tracking

---

### Utility Pages

#### **Search** - `/search`
- **Component:** `src/app/search/page.tsx`
- **Purpose:** Global search functionality
- **Layout:** Centered search interface
- **Key Features:**
  - SearchInterface component
  - SearchFilters
  - SearchResults with relevance ranking
  - Multi-content search (blog, players, pages)

**Search Scope:**
- Blog posts
- Fantasy football players
- Portfolio pages
- Project content

---

#### **Newsletter** - `/newsletter`
- **Component:** `src/app/newsletter/page.tsx`
- **Purpose:** Newsletter subscription
- **Layout:** Centered content
- **Key Features:**
  - NewsletterSignup form
  - NewsletterCTA components
  - Subscription management

---

#### **Testimonials** - `/testimonials`
- **Component:** `src/app/testimonials/page.tsx`
- **Purpose:** Client testimonials display
- **Layout:** Grid layout
- **Key Features:**
  - TestimonialCard components
  - TestimonialsSection management

---

#### **FAQ** - `/faq`
- **Component:** `src/app/faq/page.tsx`
- **Purpose:** Frequently asked questions
- **Layout:** Accordion-style FAQ
- **Structured Data:** FAQPage schema

---

#### **Notes** - `/notes`
- **Component:** `src/app/notes/page.tsx`
- **Purpose:** Personal notes and thoughts
- **Status:** In development

---

#### **Consulting** - `/consulting`
- **Component:** `src/app/consulting/page.tsx`
- **Purpose:** Consulting services information
- **Status:** In development

---

#### **Writing** - `/writing`
- **Component:** `src/app/writing/page.tsx`
- **Purpose:** Writing portfolio separate from blog
- **Dynamic Routes:** `/writing/[slug]`
- **Status:** In development

---

## API Routes

### Fantasy Sports APIs

#### **Fantasy Data** - `/api/fantasy-data`
- **Purpose:** Main fantasy sports data endpoint
- **Methods:** GET, POST
- **Returns:** Player rankings, statistics, projections

---

#### **FantasyPros Integration** - `/api/fantasy-pros`
- **Purpose:** FantasyPros API integration and data sync
- **Methods:** GET
- **Caching:** Multi-tier cache system

---

#### **FantasyPros Free** - `/api/fantasy-pros-free`
- **Purpose:** Free tier data access
- **Rate Limiting:** Applied

---

#### **FantasyPros Session** - `/api/fantasy-pros-session`
- **Purpose:** Session management for data sources

---

#### **Draft Tiers** - `/api/draft-tiers`
- **Purpose:** Advanced tier calculations and rankings
- **Methods:** GET, POST
- **Processing:** Machine learning tier grouping

---

#### **Player Images Mapping** - `/api/player-images-mapping`
- **Purpose:** Player image management system
- **Methods:** GET
- **Source:** Multiple image providers (ESPN, FantasyPros, NFL)

---

#### **Data Manager** - `/api/data-manager`
- **Purpose:** Data management operations and CRUD
- **Methods:** GET, POST, PUT, DELETE
- **Access:** Admin only

---

#### **Data Pipeline** - `/api/data-pipeline`
- **Purpose:** Automated data processing pipeline
- **Methods:** POST
- **Automation:** Scheduled updates

---

#### **Scheduled Update** - `/api/scheduled-update`
- **Purpose:** Scheduled data updates and maintenance
- **Trigger:** Cron/manual

---

#### **Scrape** - `/api/scrape`
- **Purpose:** Web scraping operations and data collection
- **Methods:** POST
- **Sources:** ESPN, FantasyPros, NFL.com

---

### Core Application APIs

#### **Analytics Events** - `/api/analytics/events`
- **Purpose:** Event tracking and user analytics
- **Methods:** POST
- **Tracking:** User interactions, conversions, engagement

---

#### **Web Vitals** - `/api/analytics/web-vitals`
- **Purpose:** Performance monitoring and metrics
- **Methods:** POST
- **Metrics:** LCP, FID, CLS, TTFB

---

#### **Authentication** - `/api/auth/[...nextauth]`
- **Purpose:** NextAuth.js authentication system
- **Provider:** NextAuth.js
- **Routes:**
  - `/api/auth/signin`
  - `/api/auth/signout`
  - `/api/auth/session`
  - `/api/auth/providers`

---

#### **Newsletter Subscribe** - `/api/newsletter/subscribe`
- **Purpose:** Newsletter subscription management
- **Methods:** POST

---

#### **Search** - `/api/search`
- **Purpose:** Global search functionality
- **Methods:** GET
- **Query Parameters:** `?q=search+term`

---

## RSS Feed - `/api/rss`
- **Purpose:** RSS feed generation for blog
- **Format:** RSS 2.0
- **Content:** Latest blog posts

---

## SEO & Metadata

### Metadata Construction

All pages use centralized metadata generation:

```typescript
// src/lib/seo.ts
export function constructMetadata({
  title = "Isaac Vazquez",
  description = "...",
  canonicalUrl = "",
  image = "/og-image.png",
  ...props
}: MetadataProps): Metadata
```

### Structured Data Types

Pages implement JSON-LD structured data:

- **Person** - About, Resume, Contact pages
- **WebSite** - Root layout
- **WebPage** - Blog, standard pages
- **BreadcrumbList** - All navigable pages
- **SoftwareApplication** - Fantasy Football features
- **SportsApplication** - Fantasy Football platform
- **FAQPage** - FAQ, Fantasy Football help
- **ContactPage** - Contact page

### OpenGraph & Twitter Cards

All pages include:
- OpenGraph meta tags
- Twitter card metadata
- Social sharing images
- Proper title/description hierarchy

### Canonical URLs

```tsx
<link rel="canonical" href="https://isaacavazquez.com/page-path" />
```

---

## Breadcrumb Navigation

### Implementation

```typescript
// In each page
const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Page Name", url: "/page-path" }
];

<Breadcrumbs className="mb-8" />
```

### Breadcrumb Structured Data

```typescript
import { generateBreadcrumbStructuredData } from "@/lib/seo";

<StructuredData
  type="BreadcrumbList"
  data={{ items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement }}
/>
```

---

## Sitemap

### Generation

Automatic sitemap generation via `next-sitemap`:

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://isaacavazquez.com',
  generateRobotsTxt: true,
  priority: 0.7,
  changefreq: 'daily'
}
```

### Output

```
/public/sitemap.xml
/public/sitemap-0.xml
/public/robots.txt
```

---

## Page Layout Patterns

### Home Page

```tsx
<TerminalHero />
<div className="py-12 sm:py-16 lg:py-20">
  <ProductVisionSection />
  <VisualSeparator />
  <FunFactsSection />
  <CTAGrid />
</div>
```

### Standard Pages (About, Contact, Resume)

```tsx
<ConditionalLayout>
  <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
    <Breadcrumbs className="mb-8" />
    {children}
  </div>
</ConditionalLayout>
```

### Fantasy Football Pages

```tsx
<ConditionalLayout>
  <div className="min-h-screen w-full">
    {/* Full-width fantasy content */}
  </div>
</ConditionalLayout>
```

### Blog Pages

```tsx
<div className="min-h-screen py-12 md:py-20">
  <div className="max-w-4xl mx-auto px-6">
    <Header />
    <BlogFilter />
    <FeaturedPosts />
    <AllPosts />
    <Categories />
  </div>
</div>
```

---

## Navigation Context

### Conditional Layout Logic

```typescript
// src/components/ConditionalLayout.tsx
const isHomePage = pathname === "/";
const isFantasyFootballPage = pathname.startsWith('/fantasy-football');
const isFullWidthPage = isFantasyFootballPage;
```

### Footer Display

```tsx
{!isHomePage && !isFantasyFootballPage && <Footer />}
```

### FloatingNav Display

```tsx
{showFloatingNav && <FloatingNav />}
```

---

## Performance Optimization

### Static Generation

Most pages use Static Site Generation (SSG):

```typescript
export const metadata = constructMetadata({ ... });
```

### Dynamic Routes

Position tiers and blog posts use dynamic routes with generateStaticParams:

```typescript
export async function generateStaticParams() {
  return positions.map((position) => ({
    position: position.slug,
  }));
}
```

### Image Optimization

```tsx
<Image
  src="/path/to/image.png"
  alt="Description"
  width={640}
  height={480}
  priority={true}          // For above-fold images
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Accessibility

### Skip Links

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### ARIA Labels

```tsx
<main
  id="main-content"
  role="main"
  aria-label="Portfolio Content"
  tabIndex={-1}
>
```

### Semantic HTML

All pages use proper heading hierarchy (h1 → h2 → h3) and semantic elements.

---

## Related Documentation

- [Layout System](./LAYOUT_SYSTEM.md) - Layout component patterns
- [Component Library](./COMPONENT_LIBRARY.md) - UI component usage
- [Styling System](./STYLING_SYSTEM.md) - Design system
- [SEO Improvements](./SEO_IMPROVEMENTS.md) - SEO strategy
- [Fantasy Platform Setup](./FANTASY_PLATFORM_SETUP.md) - Fantasy football architecture

---

**Last Updated:** October 2025
**Maintained By:** Isaac Vazquez
