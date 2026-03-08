# Pages — AI Context Reference

> Every route with rendering strategy, data dependencies, component tree, and metadata.

---

## Page Inventory

| Route | File | Server/Client | Layout |
|-------|------|--------------|--------|
| `/` | `src/app/page.tsx` | Server | Root |
| `/about` | `src/app/about/page.tsx` | Server | Root |
| `/portfolio` | `src/app/portfolio/page.tsx` | Server | Root |
| `/portfolio/[slug]` | `src/app/portfolio/[slug]/page.tsx` | Server | Root |
| `/resume` | `src/app/resume/page.tsx` | Server | Root |
| `/contact` | `src/app/contact/page.tsx` | Server | Root |
| `/accessibility` | `src/app/accessibility/page.tsx` | Server | Root |
| `/writing` | `src/app/writing/page.tsx` | Server (async) | Root |
| `/writing/[slug]` | `src/app/writing/[slug]/page.tsx` | Server (async) | Root |
| `/search` | `src/app/search/page.tsx` | Server | Root |
| `/fantasy-football` | `src/app/fantasy-football/page.tsx` | Server | FF Layout |
| `/fantasy-football/tiers/[position]` | `src/app/fantasy-football/tiers/[position]/page.tsx` | Server (async) | FF Layout |
| `/fantasy-football/rb-tiers` | `src/app/fantasy-football/rb-tiers/page.tsx` | Server | FF Layout |
| `/fantasy-football/draft-tracker` | `src/app/fantasy-football/draft-tracker/page.tsx` | Server | FF Layout |
| `/investments` | `src/app/investments/page.tsx` | Server | Root |
| `/admin` | `src/app/admin/page.tsx` | Server | Admin Layout |
| 404 | `src/app/not-found.tsx` | Client | Root |

---

## Layouts

### Root Layout (`src/app/layout.tsx`)
- Loads Inter + JetBrains Mono fonts (variable, swap)
- Wraps in `<Providers>` (ThemeProvider)
- Renders `<ConditionalLayout>` (full-width for home, max-w-4xl for others)
- Includes `<Analytics>`, `<AIStructuredData>`, `<StructuredData type="Person">`
- Body classes: font variables + `font-sans`

### Fantasy Football Layout (`src/app/fantasy-football/layout.tsx`)
- Client component (`"use client"`)
- Wraps children in `<PlayerImageCacheProvider>` for headshot caching

### Admin Layout (`src/app/admin/layout.tsx`)
- Wraps in `<AdminProviders>` (NextAuth `<SessionProvider>`)
- Provides authentication context for all `/admin/*` pages

---

## Page Details

### Home (`/`)
**File:** `src/app/page.tsx` — Server component
**Components:** `<ModernHero />` (main hero section, client component)
**Metadata:** From `src/app/metadata.ts` — "Isaac Vazquez - Product Manager | UC Berkeley Haas MBA"
**Data:** None (static). Hero content is in the ModernHero component.

### About (`/about`)
**File:** `src/app/about/page.tsx` — Server component
**Components:** `<About />` (client component with tabbed navigation: Overview/Journey)
**Metadata:** `constructMetadata()` with AI metadata (expertise, profession, topics)
**Data:** Static. Career timeline and skills from `src/constants/personal.ts`.

### Portfolio (`/portfolio`)
**File:** `src/app/portfolio/page.tsx` — Server component
**Components:** `<WarmCard>`, `<Heading>`, icons from `@tabler/icons-react`
**Data:** `caseStudiesData` from `src/constants/caseStudies.ts` — filters for `featured` studies
**Metadata:** "Work & Case Studies | Isaac Vazquez" with AI metadata
**Note:** Renders case study cards directly (no separate client component). Uses `IconArrowRight`, `IconExternalLink`.

### Portfolio Detail (`/portfolio/[slug]`)
**File:** `src/app/portfolio/[slug]/page.tsx` — Server component
**Components:** Renders case study detail with structured data
**Data:** `caseStudiesData[slug]` lookup. Returns `notFound()` if slug doesn't match.
**Metadata:** Dynamic via `generateMetadata()` — title from case study data
**Structured data:** `SoftwareApplication` schema for each project

### Resume (`/resume`)
**File:** `src/app/resume/page.tsx` — Server component
**Components:** Renders `<ResumeClient />` (client component)
**Metadata:** "Resume & Experience | Isaac Vazquez"
**Data:** Static. Resume content in client component.

### Contact (`/contact`)
**File:** `src/app/contact/page.tsx` — Server component
**Components:** `<ContactContent />` (client component)
**Metadata:** "Contact | Isaac Vazquez" with AI metadata
**Data:** Static.

### Accessibility (`/accessibility`)
**File:** `src/app/accessibility/page.tsx` — Server component
**Components:** Direct JSX (no separate component)
**Metadata:** "Accessibility Statement | Isaac Vazquez"
**Data:** Static accessibility statement content.

### Writing (`/writing`)
**File:** `src/app/writing/page.tsx` — Server component (async)
**Components:** `<WarmCard>`, `<Heading>`, `<Paragraph>`, `<StructuredData>`, icons
**Data:** `await getAllBlogPosts()` from `src/lib/blog.ts` — reads markdown files from `content/blog/`
**Metadata:** "Writing - Product Management Insights" with AI metadata
**Structured data:** BreadcrumbList + Article schema for each post

### Writing Detail (`/writing/[slug]`)
**File:** `src/app/writing/[slug]/page.tsx` — Server component (async)
**Data:** `await getBlogPost(slug)` from `src/lib/blog.ts` — reads and renders markdown with remark
**Metadata:** Dynamic via `generateMetadata()` — title/description from frontmatter
**Structured data:** Article schema

### Search (`/search`)
**File:** `src/app/search/page.tsx` — Server component
**Components:** `<SearchInterface.client />` (client component)
**Data:** Client-side fetching via `/api/search?q=...`

### Fantasy Football Landing (`/fantasy-football`)
**File:** `src/app/fantasy-football/page.tsx` — Server component
**Components:** `<FantasyFootballLandingContent />` (client component)
**Metadata:** "2026 Fantasy Football Rankings & Tier Charts"
**Data:** Client-side via `useUnifiedFantasyData` hook

### Fantasy Football Tiers (`/fantasy-football/tiers/[position]`)
**File:** `src/app/fantasy-football/tiers/[position]/page.tsx` — Server component (async)
**Components:** `<TierDisplay>`, `<ModernButton>`, `<WarmCard>`, icons
**Data:** `dataManager.getData(position)` → `generateTierGroups()` from `src/lib/tierImageGenerator.ts`
**Validation:** Checks position against valid list, returns `notFound()` if invalid
**Metadata:** Dynamic — "2026 Fantasy Football [Position] Rankings & Tier Chart"
**Structured data:** BreadcrumbList

### Fantasy Football RB Tiers (`/fantasy-football/rb-tiers`)
**File:** `src/app/fantasy-football/rb-tiers/page.tsx` — Server component
**Components:** RB-specific tier visualization
**Data:** Static JSON from `public/fantasy/rb_current.json`

### Draft Tracker (`/fantasy-football/draft-tracker`)
**File:** `src/app/fantasy-football/draft-tracker/page.tsx` — Server component
**Components:** `<DraftTrackerClient />` (client component with sub-components: DraftBoard, DraftSetup, DraftHistory, DraftControls, PlayerDraftCard)
**Data:** Client-side via `useAllFantasyData` hook

### Investments (`/investments`)
**File:** `src/app/investments/page.tsx` — Server component
**Components:** `<InvestmentsClient />` (client component)
**Data:** Client-side via `useInvestments` and `useStockData` hooks
**Metadata:** "Investment Analytics | Isaac Vazquez"

### Admin (`/admin`)
**File:** `src/app/admin/page.tsx` — Server component
**Components:** Admin dashboard with login form
**Data:** NextAuth session check
**Auth:** Protected by NextAuth — shows login form if no session

### 404 Not Found
**File:** `src/app/not-found.tsx` — Client component (`"use client"`)
**Components:** Custom 404 page with navigation links back to home

---

## Metadata Pattern

All pages use `constructMetadata()` from `src/lib/seo.ts`:

```typescript
export const metadata = constructMetadata({
  title: "Page Title | Isaac Vazquez",
  description: "Page description for SEO",
  canonicalUrl: "/page-path",
  aiMetadata: {
    profession: "Product Manager",
    expertise: ["..."],
    topics: ["..."],
    contentType: "Portfolio",
    context: "Additional context for AI systems",
    summary: "Concise summary",
  },
});
```

Dynamic pages use `generateMetadata()`:
```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await fetchData(params.slug);
  return constructMetadata({ title: data.title, ... });
}
```

---

## Data Fetching Patterns

| Pattern | Used By | Example |
|---------|---------|---------|
| Static imports | Home, About, Portfolio, Contact | `caseStudiesData`, `personal` constants |
| Server-side async | Writing, Tiers | `await getAllBlogPosts()`, `dataManager.getData()` |
| Client-side hooks | FF Landing, Draft Tracker, Investments | `useUnifiedFantasyData()`, `useInvestments()` |
| Client-side fetch | Search | `fetch('/api/search?q=...')` |

**Server components** handle data that's available at build/request time.
**Client components** handle data that requires user interaction or real-time updates.
