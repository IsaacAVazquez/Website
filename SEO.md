# SEO

Reference for the SEO architecture in this Next.js 16 App Router project.

**Last updated:** 2026-09-24

---

## Architecture Overview

This site uses two complementary layers:

| Layer | File | Purpose |
|---|---|---|
| Meta tags + OG + Twitter | `src/lib/seo.ts` → Next.js `Metadata` API | Title, description, Open Graph, Twitter cards, robots, canonicals |
| Structured data (JSON-LD) | `src/lib/ai-seo.ts` + two components | Schema.org markup for search engines and AI systems |

**Why not `next-seo`?** The `next-seo` library itself recommends Next.js `generateMetadata` for the App Router. Its remaining value is JSON-LD components, which this project covers with custom AI-optimized generators, so the dependency was removed in August 2026.

---

## Global Configuration — `src/lib/seo.ts`

### `siteConfig`

Single source of truth for site-wide constants. Import this anywhere you need a URL, name, or social link — never hardcode these.

```ts
export const siteConfig = {
  name: "Isaac Vazquez",
  title: "Product Manager and Berkeley Haas MBA",
  description: "...",
  url: "https://isaacvazquez.com",    // NEXT_PUBLIC_SITE_URL or SITE_URL when set
  ogImage: "/opengraph-image",        // 1200x630
  ogImageAlt: "Isaac Vazquez - ...",
  links: {
    github:  "https://github.com/IsaacAVazquez",
    linkedin: "https://www.linkedin.com/in/isaac-vazquez/",
  },
};
```

The X handle @isaacvazquez came out of `profile.sameAs`, the Person `alternateName`, and the twitter card on 2026-09-24, because x.com answered "User Profile Not Found" for it. Add an account back only once its public profile resolves.

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
  articleAuthor: "https://isaacvazquez.com/about",
  articleSection: "Product Management",
  articleTags: ["Product Strategy", "SaaS"],
});
```

### What `constructMetadata` outputs

- `title` with `template: "%s | Isaac Vazquez"` (on root layout)
- `description`, `authors`, `creator`, `publisher`. The description is fitted to 160 characters by `fitMetaDescription`, which ends on the last full sentence when one ends at 70 characters or later, and otherwise clips at a word with an ellipsis.
- `openGraph`: type, title, description, images, locale, and article fields when `ogType: "article"`. `url` is set only when `canonicalUrl` is passed.
- `twitter`: a `summary_large_image` card with no creator or site handle
- `alternates.canonical`: set only when `canonicalUrl` is passed. There is deliberately no default. The root layout calls `constructMetadata()` with no arguments and every route without metadata of its own inherits the result, so a homepage default told Google those routes were copies of the homepage.
- `robots`: full GoogleBot directives (`max-image-preview: large`, `max-snippet: -1`)
- `other`: `og:updated_time` from `dateModified`
- `formatDetection`: disables phone, email, and address auto-detection

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
  canonicalUrl: "https://isaacvazquez.com/about",
  dateModified: "2025-02-05",
});
```

Prefer `constructMetadata` for most pages. `generateAIOptimizedMetadata` is now a compatibility wrapper that passes the title, description, image, `noIndex`, `canonicalUrl`, and dates through to `constructMetadata`, and it ignores the summary, expertise, and context fields.

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
<StructuredData type="Person" />
<StructuredData type="WebSite" />
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
    articleAuthor: "https://isaacvazquez.com/about",
    articleSection: post.tags?.[0] ?? "Product Management",
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `https://isaacvazquez.com/writing/${slug}`,
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
    articleAuthor: "https://isaacvazquez.com/about",
    articleSection: "Product Management",
    articleTags: ["Product Management", caseStudy.role, ...caseStudy.tools.slice(0, 3)],
    canonicalUrl: `/portfolio/${params.slug}`,
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

- Default metadata: `constructMetadata()` with no args gives the title template, site description, and global OG image, and no canonical
- Title template: `"%s | Isaac Vazquez"`, with page titles slotting into `%s`
- `<head>` extras (not handled by the Metadata API):
  - `theme-color`: `#F6F5F1` in light mode and `#151412` in dark mode
  - `color-scheme`: `light dark`
  - `viewport`: standard + `viewport-fit=cover` for notched devices
  - PWA: `apple-mobile-web-app-capable`, status bar style, app title
  - MSApplication tile config
  - `/manifest.json` link
  - Apple touch icon + favicon
  - RSS feed: `<link rel="alternate" href="/api/rss">`
- Google Search Console: `constructMetadata()` sets `verification.google` from the `GOOGLE_SITE_VERIFICATION` environment variable, so the tag renders only when that variable is set at build time. Production rendered no verification tag on 2026-09-24.

---

## Sitemap — `scripts/generatePublicSitemap.mjs` + `src/lib/sitemap.js`

Runs automatically via the `postbuild` script (`npm run generate:sitemap && node scripts/patch-nft-sharp.mjs`). Generates `public/sitemap.xml`.

`scripts/generatePublicSitemap.mjs` writes `PUBLIC_SITEMAP_ENTRIES` from `src/lib/sitemap.js`. That module walks every `page.tsx` under `src/app` and lists it unless the page opts out, either with `noIndex: true` (or `index: false`) in its metadata or by rendering nothing but a redirect. `UNLISTED_ROUTES` covers a page whose metadata cannot say so (`/admin`), and dynamic segments come from their own builders. Run `npm run generate:sitemap` after any change to post dates, because the consistency test compares the committed file.

### Output fields

Each entry emits `loc`, `lastmod`, `changefreq`, and `priority`. `src/lib/sitemap.js` supplies explicit freshness and classification metadata per route. The Jest sitemap consistency test compares all four fields against `public/sitemap.xml`.

### How `src/lib/sitemap.js` builds the list

`getPublicSitemapEntries()` merges four sources, dedupes by `loc`, and sorts alphabetically:

1. Static routes come from the route walk above, dated from the `STATIC_ROUTE_LASTMOD` map. Snapshot-driven routes read `lastmod` from their snapshot (e.g. `readPremierLeagueLastmod`, `readInvestmentsLastmod`, `readFantasyLastmod`, `readEarthquakeLastmod`). The identity pages carry the date of their last copy change, kept in step with each page's own `dateModified`, and `/writing` takes the later of its own copy change and its newest post. A route with no row gets the build date and a warning.
2. Writing topic pages come one per `BLOG_TOPIC_PAGES` entry, each dated by the newest post filed under its label through the `cluster` or `archiveBucket` frontmatter.
3. Portfolio case studies come from `getPortfolioSlugEntries()`, which regex-extracts top-level slug keys from `src/constants/caseStudies.ts`, skipping any entry with a top-level `link:` (those `[slug]` routes `permanentRedirect()` to the live tool instead of rendering a page). Every current case study has one, so none is listed.
4. Blog posts come from `getBlogRouteEntries()`, which discovers `content/blog/*.{mdx,md}` at build time, using `updatedAt || publishedAt` for `lastmod` and excluding future-dated posts (their `publishedAt` is later than today).

Google uses `lastmod` only while it keeps matching real changes, which is why none of these dates is left to drift by hand when a source for it exists.

### Excluded paths

`/api/*`, `/_next/*`, `/404`, `/admin`, `/admin/*`, `/search`, and `/score-pools/settings` never appear, since each is either off the route walk or marked `noIndex`.

### Redirects and server-rendered HTML

Put redirects in `next.config.mjs`. On Netlify the proxy in `src/proxy.ts` answers before config redirects run, so a redirect in the proxy shadows the config's permanent rule, which is how `/blog` answered 307 and `/blog/posts/<slug>` landed on a 404 until 2026-09-24. A page that calls `permanentRedirect()` under a `loading.tsx` boundary also misfires, because the redirect lands after the 200 shell has streamed and ships as a meta refresh with the root layout's metadata.

A client component that calls `useSearchParams()` in a statically prerendered route bails the page out to client rendering at the nearest Suspense boundary, and the served HTML then drops the h1, the body text, and the JSON-LD. Render such a route per request, as the trade calculator does with `force-dynamic`, or give the client its own `<Suspense>`, and check the served HTML rather than the dev server, which renders every request.

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

Status of metadata and structured data for the routes listed below. The table does not cover every route, and the page file is the source of truth for `dateModified`.

| Page | Metadata | ogType | canonicalUrl | dateModified | Structured Data | Breadcrumbs | Status |
|---|---|---|---|---|---|---|---|
| `/` | `constructMetadata` | website | `/` | 2026-09-24 | Person, WebSite | N/A (root) | OK |
| `/about` | `generateAIOptimizedMetadata` | website | `/about` | 2026-09-14 | Breadcrumb, ProfilePage | Yes | OK |
| `/contact` | `constructMetadata` | website | `/contact` | 2026-09-14 | BreadcrumbList, ContactPage | Yes | OK |
| `/resume` | `constructMetadata` | website | `/resume` | 2026-09-14 | BreadcrumbList, Person, JobPosting | Yes | OK |
| `/portfolio` | `constructMetadata` | website | `/portfolio` | 2026-09-14 | ItemList | No visible breadcrumb; structured index present | OK |
| `/portfolio/[slug]` | `generateMetadata` | article | `/portfolio/{slug}` | 2026-04-04 | Breadcrumb, CreativeWork on non-redirect entries | Yes, when rendered | OK; every current slug answers 308 to its live tool, and the home and portfolio cards link to the tool directly |
| `/writing` | `constructMetadata` | website | `/writing` | 2026-09-14 | BreadcrumbList, ItemList | Yes | OK |
| `/writing/[slug]` | `generateMetadata` | article | full URL | post dates | Breadcrumb, Article | Yes | OK |
| `/investments` | `constructMetadata` | website | `/investments` | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK |
| `/accessibility` | `constructMetadata` | website | full URL | 2026-07-16 | WebPage, BreadcrumbList | Yes | OK |
| `/search` | `constructMetadata` | website | `/search` | 2025-02-05 | None | None | OK, `noIndex` |
| `/admin` | layout metadata | N/A | N/A | N/A | None | None | OK, `noIndex` |
| `/fantasy-football` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp, FAQ | Yes | OK; the first page of rankings rows is server-rendered from the committed snapshot, so non-JS crawlers see real players |
| `/fantasy-football/draft-tracker` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK |
| `/fantasy-football/rb-tiers` | 308 in `next.config.mjs` | n/a | n/a | n/a | n/a | n/a | OK; page file removed |
| `/fantasy-football/tiers/[pos]` | 308 in `next.config.mjs` | n/a | n/a | n/a | n/a | n/a | OK; page file removed |
| `/fantasy-football/trade-calculator` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK; renders per request (`force-dynamic`) so the client's `useSearchParams()` does not blank the HTML |
| `/fantasy-football/weekly`, `/fantasy-football/waivers` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK; the first rows render on the server from a one-format seed of `weekly.json` (`loadFantasyWeeklySeed`) |
| `/score-pools/settings` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK, `noIndex` |
| `/premier-league` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/la-liga` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApp | Yes | OK |
| `/news-pulse` | `constructMetadata` | website | relative | 2026-07-23 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/march-madness-2026` | `constructMetadata` | website | relative | dynamic | BreadcrumbList, Article, FAQ, Sports | Yes | OK |
| `/spacex-mission-control` | `constructMetadata` | website | relative | 2026-04-01 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/polling-aggregator` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/fintech-tools/budget-planner` | `constructMetadata` | website | relative | 2026-04-03 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/fintech-tools/interchange-iq` | `constructMetadata` | website | relative | 2026-04-02 | BreadcrumbList, SoftwareApplication | Yes | OK |

### Gaps to address

1. **`/portfolio`** — Emits `ItemList` structured data, but no visible breadcrumb trail. Add visible breadcrumbs only if the page design calls for it.
2. **`/search`** — Correctly `noIndex`; leave it out of sitemap because the search API is intentionally limited.

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
- Hardcode `https://isaacvazquez.com` in page files — use `siteConfig.url` or pass relative paths to `canonicalUrl`
- Set `og:type: "website"` on blog posts or case studies
- Skip `canonicalUrl` on dynamic routes (duplicate content risk)
- Reintroduce `next-seo` for meta tags, since `constructMetadata` covers it
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
            { name: "Home", url: "https://isaacvazquez.com" },
            { name: "New Page", url: "https://isaacvazquez.com/new-page" },
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
    articleAuthor: "https://isaacvazquez.com/about",
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
            author: { name: "Isaac Vazquez", url: "https://isaacvazquez.com" },
            datePublished: item.createdAt,
            dateModified: item.updatedAt,
            url: `https://isaacvazquez.com/items/${slug}`,
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
| `scripts/generatePublicSitemap.mjs` | Writes `public/sitemap.xml` from `src/lib/sitemap.js` |
| `src/lib/sitemap.js` | Builds the allowlisted sitemap entries (`loc` + `lastmod`) |
| `public/robots.txt` | Crawl directives (manually maintained) |
| `WRITING_VOICE.md` | Voice and tone rules for all user-facing text including meta content |
