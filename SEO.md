# SEO

Reference for the SEO architecture in this Next.js 16 App Router project.

**Last updated:** 2026-04-10

---

## Architecture Overview

This site uses two complementary layers:

| Layer | File | Purpose |
|---|---|---|
| Meta tags + OG + Twitter | `src/lib/seo.ts` → Next.js `Metadata` API | Title, description, Open Graph, Twitter cards, robots, canonicals |
| Structured data (JSON-LD) | `src/lib/ai-seo.ts` + two components | Schema.org markup for search engines and AI systems |

**Why not `next-seo`?** The `next-seo` library (v7.2.0, installed) explicitly recommends using Next.js `generateMetadata` for App Router. Its remaining value is JSON-LD components, which this project covers with custom AI-optimized generators. The dependency can be safely removed.

---

## Global Configuration — `src/lib/seo.ts`

### `siteConfig`

Single source of truth for site-wide constants. Import this anywhere you need a URL, name, or social link — never hardcode these.

```ts
export const siteConfig = {
  name: "Isaac Vazquez",
  title: "Product Manager | UC Berkeley Haas MBA | Portfolio & Case Studies",
  description: "...",
  url: "https://isaacavazquez.com",
  ogImage: "/opengraph-image",        // 1200x630
  ogImageAlt: "Isaac Vazquez - ...",
  links: {
    twitter: "https://twitter.com/isaacvazquez",
    github:  "https://github.com/IsaacAVazquez",
    linkedin: "https://linkedin.com/in/isaac-vazquez",
  },
};
```

---

## `constructMetadata(options)` — The Main Builder

Used on every page. Returns a Next.js `Metadata` object with full OG, Twitter, robots, and canonical configuration.

```ts
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  // Required for non-homepage pages
  title: "Contact",
  description: "Get in touch with Isaac Vazquez.",
  canonicalUrl: "/contact",

  // Optional
  image: "/opengraph-image",         // defaults to siteConfig.ogImage
  noIndex: false,                    // set true for admin/utility pages
  datePublished: "2025-01-01",       // ISO 8601
  dateModified: "2026-03-01",        // ISO 8601

  // Article pages only (blog posts, case studies)
  ogType: "article",                 // default: "website"
  articleAuthor: "https://isaacavazquez.com/about",
  articleSection: "Product Management",
  articleTags: ["Product Strategy", "SaaS"],

  // AI-optimized metadata (adds custom ai:* meta tags)
  aiMetadata: {
    profession: "Product Manager",
    expertise: ["Product Strategy", "Data Analytics"],
    industry: ["SaaS", "Fintech"],
    topics: ["Product Management", "Case Studies"],
    contentType: "Article",          // "Article" | "Portfolio" | "Professional Portfolio Homepage" | etc.
    context: "Additional context for AI systems",
    summary: "One-sentence TL;DR",
    primaryFocus: "PM projects",
    specialty: "Cross-functional leadership",
  },
});
```

### What `constructMetadata` outputs

- `title` with `template: "%s | Isaac Vazquez"` (on root layout)
- `description`, `authors`, `creator`, `publisher`
- `openGraph` — type, url, title, description, images, locale, and article fields when `ogType: "article"`
- `twitter` — `summary_large_image` card with creator/site handles
- `alternates.canonical` — prevents duplicate content
- `robots` — full GoogleBot directives (`max-image-preview: large`, `max-snippet: -1`)
- `other` — AI-specific meta tags from `aiMetadata`
- `formatDetection` — disables phone/email/address auto-detection

### `ogType: "article"` — when to use it

Set `ogType: "article"` for any content page that is authored and dated:
- Blog posts → `src/app/writing/[slug]/page.tsx`
- Case studies → `src/app/portfolio/[slug]/page.tsx`

When set, the OpenGraph block outputs the correct `article:published_time`, `article:modified_time`, `article:author`, `article:section`, and `article:tag` fields. Do **not** use it for index/listing pages or tool pages.

---

## `generateAIOptimizedMetadata(pageData)` — Alternative Builder

Used on pages that need richer AI context baked into the description itself (not just in `other`). Currently used on `/about`.

```ts
import { generateAIOptimizedMetadata } from "@/lib/seo";

export const metadata = generateAIOptimizedMetadata({
  title: "About",
  description: "Full-time MBA Candidate at UC Berkeley Haas...",
  summary: "Short TL;DR for AI systems",
  expertise: ["Product Management", "Quality Engineering"],
  context: "UC Berkeley Haas • Consortium Fellow • Based in the Bay Area",
  author: {
    name: "Isaac Vazquez",
    title: "UC Berkeley Haas MBA Candidate",
    credentials: ["MBA Candidate '27", "Consortium Fellow"],
  },
  canonicalUrl: "https://isaacavazquez.com/about",
  dateModified: "2025-02-05",
});
```

Prefer `constructMetadata` for most pages. Use `generateAIOptimizedMetadata` when you need the expertise/context woven into the meta description string itself.

---

## Structured Data — Schema.org JSON-LD

### `<StructuredData>` — Generic Schemas

`src/components/StructuredData.tsx`

Preset schemas for the most common types. Data is built-in from `siteConfig`.

```tsx
import { StructuredData } from "@/components/StructuredData";

// Supported types:
<StructuredData type="Person" />
<StructuredData type="WebSite" />       // includes SearchAction
<StructuredData type="WebPage" />
<StructuredData type="ProfilePage" />
<StructuredData type="ContactPage" />
<StructuredData type="Article" />
<StructuredData type="BlogPosting" />
<StructuredData type="BreadcrumbList" />
<StructuredData type="FAQPage" />
<StructuredData type="SoftwareApplication" />
<StructuredData type="SportsApplication" />
<StructuredData type="CreativeWork" />
<StructuredData type="ProfessionalService" />
<StructuredData type="Organization" />
<StructuredData type="JobPosting" />
```

### `<AIStructuredData>` — AI-Optimized Schemas

`src/components/AIStructuredData.tsx`

Data-driven schemas built from `src/lib/ai-seo.ts`. Pass your own data rather than relying on presets. Used for richer E-E-A-T signals and AI-comprehensible markup.

```tsx
import { AIStructuredData, AIStructuredDataCollection } from "@/components/AIStructuredData";

// Supported types:
<AIStructuredData schema={{ type: "Person",              data: PersonSchemaData }} />
<AIStructuredData schema={{ type: "Article",             data: ArticleSchemaData }} />
<AIStructuredData schema={{ type: "Project",             data: ProjectSchemaData }} />
<AIStructuredData schema={{ type: "ProfilePage",         data: { person, url, description } }} />
<AIStructuredData schema={{ type: "ProfessionalService", data: { ... } }} />
<AIStructuredData schema={{ type: "Breadcrumb",          data: { items: BreadcrumbItem[] } }} />
<AIStructuredData schema={{ type: "FAQ",                 data: FAQItem[] }} />
<AIStructuredData schema={{ type: "ItemList",            data: { name, items } }} />
<AIStructuredData schema={{ type: "Navigation",          data: NavigationItem[] }} />
<AIStructuredData schema={{ type: "Custom",              data: { schema: object } }} />

// Render multiple schemas at once:
<AIStructuredDataCollection schemas={[...]} />
```

### Generator Functions — `src/lib/ai-seo.ts`

These power `AIStructuredData` but can be called directly when you need the raw object.

| Function | Output schema type | Notes |
|---|---|---|
| `generateAIMetaTags(data)` | Plain object (meta tags) | Called by `constructMetadata` via `aiMetadata` |
| `generateEnhancedPersonSchema(data)` | `Person` | Full E-E-A-T: expertise w/ proficiency, awards, occupations |
| `generateArticleSchema(data)` | `Article` | wordCount, readingTime, speakable, genre support |
| `generateProjectSchema(data)` | `CreativeWork` | AI-friendly problem/solution/impact narrative |
| `generateProfilePageSchema(data)` | `ProfilePage` | mainEntity as Person |
| `generateProfessionalServiceSchema(data)` | `ProfessionalService` | Service + provider + areaServed |
| `generateFAQSchema(items)` | `FAQPage` | Array of `{ question, answer }` |
| `generateBreadcrumbSchema(items)` | `BreadcrumbList` | Array of `{ name, url }` |
| `generateItemListSchema(data)` | `ItemList` | For archives, project listings |
| `generateNavigationSchema(items)` | `SiteNavigationElement` | Main nav |
| `generatePageSummary(data)` | Plain object | Structured + natural language summary |

### Generator Functions — `src/lib/seo.ts`

Simpler alternatives for when the AI-optimized versions are overkill.

| Function | Output |
|---|---|
| `generatePersonStructuredData(options?)` | `Person` with credentials, alumniOf, worksFor |
| `generateArticleStructuredData(article)` | `Article` with publisher, mainEntityOfPage |
| `generateBreadcrumbStructuredData(items)` | `BreadcrumbList` |
| `generateProjectStructuredData(project)` | `SoftwareApplication` with offers |
| `generateOrganizationStructuredData(org)` | `Organization` |

---

## Page-Type Patterns

### Homepage (`/`)

```tsx
// src/app/page.tsx
export { metadata } from "./metadata"; // metadata.ts uses constructMetadata()

// In JSX:
<StructuredData type="ProfilePage" />
<StructuredData type="WebSite" />
<AIStructuredData schema={{ type: "Person", data: { ... } }} />
```

### About (`/about`)

```tsx
// src/app/about/page.tsx
export const metadata = generateAIOptimizedMetadata({ ... });

// In JSX:
<AIStructuredData schema={{ type: "Breadcrumb", data: { items: breadcrumbs } }} />
<AIStructuredData schema={{ type: "ProfilePage", data: { person: { ... } } }} />
```

### Blog Post (`/writing/[slug]`)

```tsx
// src/app/writing/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return constructMetadata({
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    ogType: "article",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleAuthor: "https://isaacavazquez.com/about",
    articleSection: post.tags?.[0] ?? "Product Management",
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `https://isaacavazquez.com/writing/${slug}`,
    aiMetadata: { contentType: "Article", ... },
  });
}

// In JSX:
<AIStructuredData schema={{ type: "Breadcrumb", data: { items: breadcrumbs } }} />
<AIStructuredData schema={{ type: "Article", data: { headline, author, wordCount, ... } }} />
```

### Case Study (`/portfolio/[slug]`)

```tsx
// src/app/portfolio/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return constructMetadata({
    title: caseStudy.title,
    description: caseStudy.description,
    ogType: "article",
    articleAuthor: "https://isaacavazquez.com/about",
    articleSection: "Product Management",
    articleTags: ["Product Management", caseStudy.role, ...caseStudy.tools.slice(0, 3)],
    canonicalUrl: `/portfolio/${params.slug}`,
    aiMetadata: { contentType: "Case Study", ... },
  });
}
// Gap: No structured data or breadcrumb component rendered in JSX. See compliance table below.
```

### Generic Static Page

```tsx
export const metadata = constructMetadata({
  title: "Resume",
  description: "Isaac Vazquez's product management resume.",
  canonicalUrl: "/resume",
  dateModified: "2026-01-01",
});
```

---

## Global Layout — `src/app/layout.tsx`

The root layout provides the baseline for every page:

- **Default metadata**: `constructMetadata()` with no args → title template, site description, global OG image
- **Title template**: `"%s | Isaac Vazquez"` — page titles slot into `%s`
- **`<head>` extras** (not handled by Metadata API):
  - `theme-color`: `#2563EB`
  - `color-scheme`: `light dark`
  - `viewport`: standard + `viewport-fit=cover` for notched devices
  - PWA: `apple-mobile-web-app-capable`, status bar style, app title
  - MSApplication tile config
  - `/manifest.json` link
  - Apple touch icon + favicon
  - RSS feed: `<link rel="alternate" href="/api/rss">`
- **Google Search Console**: verification field is stubbed in `constructMetadata()` under the `verification` key. To activate: uncomment the `google` line and paste your Search Console verification code.

---

## Sitemap — `next-sitemap.config.js`

Runs automatically via `postbuild` script. Generates `public/sitemap.xml`.

### Priority tiers

| Priority | Pages |
|---|---|
| 1.0 | `/` |
| 0.95 | `/portfolio` |
| 0.9 | `/about`, `/resume` |
| 0.85 | `/investments`, `/writing`, blog posts with "product"/"mba"/"berkeley" in slug |
| 0.75 | `/march-madness-2026`, standalone dashboards, blog posts with "qa"/"testing"/"quality" in slug |
| 0.7 | `/contact`, all other blog posts |
| 0.6 | `/fantasy-football` |
| 0.5 | `/fantasy-football/tiers/*`, `/fantasy-football/draft-tracker`, `/accessibility` |

### Dynamic blog discovery

Blog posts are discovered from `content/blog/*.mdx` at build time. Slug keywords determine priority (see above).

### Standalone route note

Routes such as `/premier-league`, `/la-liga`, `/news-pulse`, `/spacex-mission-control`, `/polling-aggregator`, `/fintech-tools/budget-planner`, and `/fintech-tools/interchange-iq` are live app routes. Check `next-sitemap.config.js` and generated sitemap output before assuming each has explicit additional-path configuration.

### Excluded paths

`/api/*`, `/_next/*`, `/404`, `/admin/*`

---

## Writing Voice in Meta Content

All user-facing text, including meta descriptions and page titles, must follow `WRITING_VOICE.md`. Key rules for SEO copy:

- **First-person, direct tone** — "I built this because..." not "This tool was designed to..."
- **No corporate hedging** — state what the page is, clearly
- **No "Comprehensive Guide" or "Complete Guide" openers** — these read as generic listicle content
- **No em dashes as stylistic devices** — use commas or periods instead
- **No colons as sentence connectors** — "The problem is X" not "The problem: X"
- **Data woven into sentences** — "5+ years building SaaS products reaching 60M+ users" not a separate stats callout
- **Keep descriptions under 160 characters** — Google truncates beyond this

When writing or editing `description` strings in `constructMetadata()` calls, read `WRITING_VOICE.md` first. The meta description is often the first thing someone reads about a page.

---

## Page Compliance Audit

Current status of metadata and structured data across all pages. Use this to identify gaps.

| Page | Metadata | ogType | canonicalUrl | dateModified | Structured Data | Breadcrumbs | Status |
|---|---|---|---|---|---|---|---|
| `/` | `constructMetadata` | website | `/` | 2026-02-22 | ProfilePage, WebSite, Person | N/A (root) | OK |
| `/about` | `generateAIOptimizedMetadata` | website | `/about` | 2025-02-05 | Breadcrumb, ProfilePage | Yes | OK |
| `/contact` | `constructMetadata` | website | `/contact` | 2026-03-16 | BreadcrumbList, ContactPage | Yes | OK |
| `/resume` | `constructMetadata` | website | `/resume` | 2025-02-05 | BreadcrumbList, Person, JobPosting | Yes | OK |
| `/portfolio` | `constructMetadata` | website | `/portfolio` | None | None | None | **Gap** |
| `/portfolio/[slug]` | `generateMetadata` | article | `/portfolio/{slug}` | None | None | None | **Gap** |
| `/writing` | `constructMetadata` | website | `/writing` | 2025-02-05 | BreadcrumbList, Article (list) | Yes | OK |
| `/writing/[slug]` | `generateMetadata` | article | full URL | post dates | Breadcrumb, Article | Yes | OK |
| `/investments` | `constructMetadata` | website | `/investments` | 2026-03-16 | BreadcrumbList, SoftwareApplication | Yes | OK |
| `/accessibility` | `constructMetadata` | website | full URL | 2025-02-05 | None | None | **Gap** |
| `/search` | `constructMetadata` | website | full URL | 2025-02-05 | None | None | **Gap** |
| `/admin` | None | N/A | N/A | N/A | None | None | **Gap** |
| `/fantasy-football` | `constructMetadata` | website | relative | 2026-03-18 | BreadcrumbList, SportsApp, FAQ | Yes | OK |
| `/fantasy-football/draft-tracker` | `constructMetadata` | website | relative | 2026-03-18 | WebApplication | None | **Gap** |
| `/fantasy-football/rb-tiers` | Redirect | — | — | — | — | — | OK |
| `/fantasy-football/tiers/[pos]` | Redirect | — | — | — | — | — | OK |
| `/premier-league` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/la-liga` | `constructMetadata` | website | relative | 2026-04-03 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/news-pulse` | `constructMetadata` | website | relative | 2026-04-01 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/march-madness-2026` | `constructMetadata` | website | relative | dynamic | BreadcrumbList, Article, FAQ, Sports | Yes | OK |
| `/spacex-mission-control` | `constructMetadata` | website | relative | 2026-04-01 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/polling-aggregator` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/fintech-tools/budget-planner` | `constructMetadata` | website | relative | 2026-04-03 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/fintech-tools/interchange-iq` | `constructMetadata` | website | relative | None | None | None | **Gap** |

### Gaps to address

1. **`/portfolio`** — Missing structured data and breadcrumbs. Should have `BreadcrumbList` + `ItemList` or `CreativeWork` schema.
2. **`/portfolio/[slug]`** — Has `ogType: "article"` in metadata but renders no structured data or breadcrumbs in JSX. Should match the `/writing/[slug]` pattern with `Breadcrumb` + `Article` schemas. Also missing `datePublished`/`dateModified` in the metadata call.
3. **`/accessibility`** — Missing structured data and breadcrumbs. Low priority but should have a `BreadcrumbList` at minimum.
4. **`/search`** — Missing structured data and breadcrumbs. Consider `noIndex: true` since the search index is limited.
5. **`/admin`** — No metadata export at all. Should export `constructMetadata({ noIndex: true })` to prevent indexing.
6. **`/fantasy-football/draft-tracker`** — Missing breadcrumb structured data despite having a parent route.
7. **`/fintech-tools/interchange-iq`** — Missing `dateModified`, structured data, and breadcrumbs.

---

## Best Practices Checklist

### Every page must have
- [ ] `title` — unique, under 60 characters where possible
- [ ] `description` — unique, 150-160 characters, following `WRITING_VOICE.md` tone
- [ ] `canonicalUrl` — prevents duplicate content (use relative paths like `"/about"`)
- [ ] `dateModified` — helps search engines understand content freshness
- [ ] At minimum one structured data type
- [ ] Breadcrumb structured data (all non-homepage pages)

### Article and content pages additionally need
- [ ] `ogType: "article"`
- [ ] `datePublished` (ISO 8601)
- [ ] `articleAuthor`, `articleSection`, `articleTags`
- [ ] `<AIStructuredData type="Article" />` in JSX
- [ ] `<AIStructuredData type="Breadcrumb" />` in JSX

### Non-public pages
- [ ] `noIndex: true` — applies to `/admin`, utility routes, draft pages

### Never do
- Hardcode `https://isaacavazquez.com` in page files — use `siteConfig.url` or pass relative paths to `canonicalUrl`
- Set `og:type: "website"` on blog posts or case studies
- Skip `canonicalUrl` on dynamic routes (duplicate content risk)
- Add `next-seo` imports for meta tags — use `constructMetadata` instead
- Write meta descriptions in third person or corporate voice — see Writing Voice section above
- Use "Comprehensive Guide" or "Complete Guide" in titles or descriptions

---

## Adding SEO to a New Page

### Static page

```tsx
// src/app/new-page/page.tsx
import { constructMetadata } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "New Page Title",
  description: "150-160 character description in first-person voice.",
  canonicalUrl: "/new-page",
  dateModified: "2026-04-05",
});

export default function NewPage() {
  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: [
            { name: "Home", url: "https://isaacavazquez.com" },
            { name: "New Page", url: "https://isaacavazquez.com/new-page" },
          ],
        }}
      />
      {/* page content */}
    </>
  );
}
```

### Dynamic route (content page)

```tsx
// src/app/[slug]/page.tsx
import { constructMetadata } from "@/lib/seo";
import { AIStructuredData } from "@/components/AIStructuredData";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) return { title: "Not Found" };

  return constructMetadata({
    title: item.title,
    description: item.description,
    ogType: "article",
    datePublished: item.createdAt,
    dateModified: item.updatedAt,
    articleAuthor: "https://isaacavazquez.com/about",
    articleSection: item.category,
    articleTags: item.tags,
    canonicalUrl: `/items/${slug}`,
  });
}

export default async function ItemPage({ params }) {
  const { slug } = await params;
  const item = await getItem(slug);

  return (
    <>
      <AIStructuredData
        schema={{
          type: "Breadcrumb",
          data: {
            items: [
              { name: "Home", url: "/" },
              { name: "Items", url: "/items" },
              { name: item.title, url: `/items/${slug}` },
            ],
          },
        }}
      />
      <AIStructuredData
        schema={{
          type: "Article",
          data: {
            headline: item.title,
            description: item.description,
            author: { name: "Isaac Vazquez", url: "https://isaacavazquez.com" },
            datePublished: item.createdAt,
            dateModified: item.updatedAt,
            url: `https://isaacavazquez.com/items/${slug}`,
            keywords: item.tags?.join(", ") || "",
          },
        }}
      />
      {/* page content */}
    </>
  );
}
```

---

## Utilities

### `calculateReadingTime(text: string): number`

Returns estimated reading time in minutes (200 wpm). Used on blog post pages.

```ts
import { calculateReadingTime } from "@/lib/seo";
const minutes = calculateReadingTime(post.content); // e.g. 4
```

---

## Key Files

| File | Role |
|---|---|
| `src/lib/seo.ts` | `constructMetadata`, `siteConfig`, basic schema generators |
| `src/lib/ai-seo.ts` | AI-optimized schema generators, `generateAIMetaTags` |
| `src/components/StructuredData.tsx` | Preset JSON-LD component (15 types) |
| `src/components/AIStructuredData.tsx` | Data-driven JSON-LD component (10 types) |
| `src/app/layout.tsx` | Global metadata, head tags |
| `src/app/metadata.ts` | Homepage metadata config |
| `src/app/writing/[slug]/page.tsx` | Article pattern reference |
| `src/app/portfolio/[slug]/page.tsx` | Case study pattern reference |
| `next-sitemap.config.js` | Sitemap generation and priorities |
| `public/robots.txt` | Crawl directives (manually maintained) |
| `WRITING_VOICE.md` | Voice and tone rules for all user-facing text including meta content |
