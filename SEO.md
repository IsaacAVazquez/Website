# SEO

Reference for the SEO architecture in this Next.js 16 App Router project.

**Last updated:** 2026-11-02

---

## Architecture Overview

This site uses two complementary layers:

| Layer | File | Purpose |
|---|---|---|
| Meta tags + OG + Twitter | `src/lib/seo.ts` → Next.js `Metadata` API | Title, description, Open Graph, Twitter cards, robots, canonicals |
| Structured data (JSON-LD) | `src/lib/ai-seo.ts`, the JSON-LD helpers in `src/lib/seo.ts`, and two components | Schema.org markup for search engines and AI systems |

**Why not `next-seo`?** The `next-seo` library itself recommends Next.js `generateMetadata` for the App Router. Its remaining value is JSON-LD components, which this project covers with custom AI-optimized generators, so the dependency was removed in August 2026.

---

## Global Configuration — `src/lib/seo.ts`

### `siteConfig`

Single source of truth for site-wide constants. Import this anywhere you need a URL, name, or social link, and never hardcode these. The name, description, and links come from `profile` in `src/lib/profile.ts`, which `buildPersonEntity()` also reads.

```ts
export const siteConfig = {
  name: profile.name,                  // "Isaac Vazquez"
  title: "Berkeley Haas MBA Candidate",
  description: profile.description,
  url: resolveSiteUrl(),               // NEXT_PUBLIC_SITE_URL, then SITE_URL, when set to an http(s) URL; otherwise https://isaacvazquez.com
  ogImage: "/opengraph-image",         // 1200x630
  ogImageAlt: "Isaac Vazquez, UC Berkeley Haas MBA candidate",
  links: {
    github: profile.sameAs.github,     // https://github.com/IsaacAVazquez
    linkedin: profile.sameAs.linkedin, // https://www.linkedin.com/in/isaac-vazquez/
  },
};
```

The X handle @isaacvazquez came out of `profile.sameAs`, the Person `alternateName`, and the twitter card on 2026-09-25, because x.com answered "User Profile Not Found" for it on 2026-09-24. Add an account back only once its public profile resolves.

---

## `constructMetadata(options)` — The Main Builder

The root layout calls it, and every page that sets its own metadata goes through it, `/about` by way of `generateAIOptimizedMetadata`. The exceptions are `/back-room/[discovery]`, `not-found.tsx`, and the not-found branches of the two writing routes, which return plain metadata objects marked noindex. It returns a Next.js `Metadata` object with Open Graph, Twitter, and robots settings, plus a canonical when `canonicalUrl` is passed.

```ts
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  // Every page-level call passes these three; only the root layout's call leaves them out
  title: "Contact",
  description: "Get in touch with Isaac Vazquez.",
  canonicalUrl: "/contact",

  // Optional
  image: "/opengraph-image",         // defaults to siteConfig.ogImage
  icons: "/favicon.png",             // the default
  noIndex: false,                    // set true for utility pages such as /search
  datePublished: "2025-01-01",       // ISO 8601
  dateModified: "2026-03-01",        // ISO 8601

  // Article pages only (blog posts)
  ogType: "article",                 // default: "website"
  articleAuthor: "https://isaacvazquez.com/about",
  articleSection: "Product Management",
  articleTags: ["Product Strategy", "SaaS"],
});
```

### What `constructMetadata` outputs

- `title`: with a `title` option, an absolute title with the site name appended once (`"Contact | Isaac Vazquez"`), or the title as given when it already contains the name. With no title, which is the root layout's call, `default: "Isaac Vazquez | Berkeley Haas MBA Candidate"` and `template: "%s | Isaac Vazquez"`.
- `description`, `authors`, `creator`, `publisher`. The description is fitted to 160 characters by `fitMetaDescription`, which ends on the last full sentence when one ends at 70 characters or later, and otherwise clips at a word with an ellipsis.
- `openGraph`: type, title, description, `siteName`, locale, one 1200x630 image with `siteConfig.ogImageAlt` as its alt, and article fields when `ogType: "article"`. `url` is set only when `canonicalUrl` is passed.
- `twitter`: a `summary_large_image` card with no creator or site handle
- `alternates.canonical`, plus an `en-US` entry under `alternates.languages`: set only when `canonicalUrl` is passed. There is deliberately no default. The root layout calls `constructMetadata()` with no arguments and every route without metadata of its own inherits the result, so a homepage default told Google those routes were copies of the homepage.
- `robots`: indexable with full GoogleBot directives (`max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1`), or with `noIndex: true`, `index: false`, `follow: true`, and `nocache: true`
- `other`: `og:updated_time` from `dateModified`
- `formatDetection`: disables phone, email, and address auto-detection
- `icons`: `/favicon.png` unless the caller passes another
- `metadataBase`: `siteConfig.url`, which relative canonicals and image paths resolve against
- `verification.google`: the `GOOGLE_SITE_VERIFICATION` environment variable (see the root layout section)

### `ogType: "article"` — when to use it

Set `ogType: "article"` for any content page that is authored and dated:
- Blog posts → `src/app/writing/[slug]/page.tsx`

When set, the OpenGraph block outputs the correct `article:published_time`, `article:modified_time`, `article:author`, `article:section`, and `article:tag` fields. Do **not** use it for index/listing pages or tool pages.

---

## `generateAIOptimizedMetadata(pageData)` — Alternative Builder

`/about` is the only page that calls it. It is a compatibility wrapper that passes the title, description, image, `noIndex`, `canonicalUrl`, and dates through to `constructMetadata`. It still accepts `summary`, `expertise`, `context`, `author`, and `readingTime` so older calls compile, and it drops all five.

```ts
// src/app/about/page.tsx
import { generateAIOptimizedMetadata } from "@/lib/seo";

export const metadata = generateAIOptimizedMetadata({
  title: "About Isaac Vazquez | Berkeley Haas MBA Candidate",
  description:
    "I'm a second-year Berkeley Haas MBA moving into product, after six years in campaign data and QA and a summer on Juno's MBA growth team.",
  canonicalUrl: "/about",
  dateModified: "2026-10-19",
});
```

Prefer `constructMetadata` for new pages.

---

## Structured Data — Schema.org JSON-LD

### `<StructuredData>` — Generic Schemas

`src/components/StructuredData.tsx`

Preset schemas for the most common types. `Person` comes from `buildPersonEntity()` and `WebSite` from `siteConfig`, and the other presets take a `data` prop and fall back to `siteConfig` for missing fields. Every preset renders through `safeJsonLd`.

```tsx
import { StructuredData } from "@/components/StructuredData";

// Supported types (Person is the default):
<StructuredData type="Person" />
<StructuredData type="WebSite" />
<StructuredData type="WebPage" />
<StructuredData type="ContactPage" />
<StructuredData type="Article" />
<StructuredData type="BlogPosting" />
<StructuredData type="BreadcrumbList" />       // data.items must already be ListItem objects
<StructuredData type="FAQPage" />              // data.questions becomes mainEntity
<StructuredData type="SoftwareApplication" />
<StructuredData type="SportsApplication" />    // prints a SoftwareApplication, applicationCategory "SportsApplication" by default
<StructuredData type="Dataset" />
```

`WebSite` lost its `SearchAction` on 2026-04-13, and the `ProfilePage`, `CreativeWork`, `ProfessionalService`, `Organization`, and `JobPosting` presets were removed on 2026-07-20, so a ProfilePage goes through `AIStructuredData`. `src/lib/__tests__/seo-integrity.test.ts` fails if a `JobPosting` case comes back.

### `<AIStructuredData>` — AI-Optimized Schemas

`src/components/AIStructuredData.tsx`

Data-driven schemas built from `src/lib/ai-seo.ts`. Pass your own data rather than relying on presets. Used for richer E-E-A-T signals and AI-comprehensible markup.

```tsx
import { AIStructuredData } from "@/components/AIStructuredData";

// Supported types:
<AIStructuredData schema={{ type: "Person",              data: PersonSchemaData }} />
<AIStructuredData schema={{ type: "Article",             data: ArticleSchemaData }} />
<AIStructuredData schema={{ type: "Project",             data: ProjectSchemaData }} />
<AIStructuredData schema={{ type: "ProfilePage",         data: { person, url, description, lastReviewed } }} />
<AIStructuredData schema={{ type: "ProfessionalService", data: { ... } }} />
<AIStructuredData schema={{ type: "Breadcrumb",          data: { items: BreadcrumbItem[] } }} />
<AIStructuredData schema={{ type: "FAQ",                 data: { items: FAQItem[] } }} />
<AIStructuredData schema={{ type: "ItemList",            data: { name, description, url, items } }} />
<AIStructuredData schema={{ type: "Navigation",          data: { items: BreadcrumbItem[] } }} />
<AIStructuredData schema={{ type: "Custom",              data: object }} />   // printed as given
```

### Generator Functions — `src/lib/ai-seo.ts`

These power `AIStructuredData` but can be called directly when you need the raw object.

| Function | Output schema type | Notes |
|---|---|---|
| `generateEnhancedPersonSchema(data)` | `Person` | Starts from `buildPersonEntity()` and adds awards, occupations, memberships, and employer; expertise names merge into `knowsAbout` |
| `generateArticleSchema(data)` | `Article` | wordCount, speakable, genre, about, and mentions support; publisher defaults to the Person |
| `generateProjectSchema(data)` | `CreativeWork` | AI-friendly problem/solution/impact narrative |
| `generateProfilePageSchema(data)` | `ProfilePage` | mainEntity as Person; `lastReviewed` becomes `dateModified` as a midnight UTC DateTime |
| `generateProfessionalServiceSchema(data)` | `ProfessionalService` | Service + provider + areaServed |
| `generateFAQSchema(items)` | `FAQPage` | Array of `{ question, answer }` |
| `generateBreadcrumbSchema(items)` | `BreadcrumbList` | Array of `{ name, url }` |
| `generateItemListSchema(data)` | `ItemList` | For archives, project listings |
| `generateNavigationSchema(items)` | `SiteNavigationElement` | Main nav |

### Generator Functions — `src/lib/seo.ts`

`buildPersonEntity()` is the one Person node every Person schema starts from, so the shared `@id` (`https://isaacvazquez.com/about#person` by default) never ships two different copies. It replaced `generatePersonStructuredData()` on 2026-07-20. `generateBreadcrumbStructuredData()` is the breadcrumb builder the `StructuredData` pages use.

| Function | Output |
|---|---|
| `buildPersonEntity()` | `Person` node with no `@context`, built from `src/lib/profile.ts`, with name, job title, description, image, `sameAs`, address, the current program as `affiliation`, the completed degree as `alumniOf`, and `knowsAbout` |
| `generateBreadcrumbStructuredData(items)` | `BreadcrumbList` with numbered items and absolute URLs |

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
<AIStructuredData schema={{ type: "ProfilePage", data: { url, lastReviewed, description, person: { ... } } }} />
<AIStructuredData schema={{ type: "FAQ", data: { items: ABOUT_FAQ.map(({ question, answer }) => ({ question, answer })) } }} />
```

### Blog Post (`/writing/[slug]`)

```tsx
// src/app/writing/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: true } };
  }

  return constructMetadata({
    title: fitSearchTitle(post.seo?.title || post.title),
    description: fitMetaDescription(post.seo?.description || post.excerpt || post.title),
    image: `/writing/${slug}/opengraph-image`,
    ogType: "article",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleAuthor: `${siteConfig.url}/about`,
    articleSection: getBlogPostCollectionLabel(post),
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `${siteConfig.url}/writing/${slug}`,
  });
}

// In JSX:
<AIStructuredData schema={{ type: "Breadcrumb", data: { items: breadcrumbs } }} />
<AIStructuredData schema={{ type: "Article", data: { headline, author, wordCount, ... } }} />
```

The JSON-LD trail runs Home, Writing, the post's topic page when it has one, and the post. The page also prints a visible trail from Writing down.

### Case study slugs (`/portfolio/[slug]`)

`src/app/portfolio/[slug]/page.tsx` is a redirect stub with no metadata of its own. It generates a static param per case study, permanent-redirects each slug to that case study's live tool, and returns a 404 for any slug it does not know. The case study template that used to render there was deleted on 2026-10-02, so there is no case study pattern to copy.

### Dashboard and tool pages

Most tool pages pair a `BreadcrumbList` with an application preset, `SportsApplication` on most of the sports pages and `SoftwareApplication` with an `applicationCategory` such as `FinanceApplication` or `NewsApplication` on the rest. A page that uses `SportsApplication` passes `offers: freeApplicationOffer` itself. `/frontier-models`, `/earthquake-pulse`, `/github-trending-pulse`, and `/agent-build-index` add a `Dataset` block for the data they publish. `src/app/fantasy-football/page.tsx` and `src/app/agent-build-index/page.tsx` are examples, and both build their JSON-LD URLs from `siteConfig.url`.

### Generic Static Page

```tsx
// src/app/resume/page.tsx
export const metadata = constructMetadata({
  title: "Isaac Vazquez Resume | Product and Analytics",
  description:
    "My résumé covers campaign data at Open Progress, QA and product work at Civitech, a 2026 growth internship at Juno, and my Berkeley Haas MBA.",
  canonicalUrl: "/resume",
  dateModified: "2026-10-19",
});
```

The title already contains the site name, so `constructMetadata` leaves it as written.

---

## Global Layout — `src/app/layout.tsx`

The root layout provides the baseline for every page:

- Default metadata: `constructMetadata()` with no args gives the title template, site description, and global OG image, and no canonical
- Title template: `"%s | Isaac Vazquez"`. It applies only where a page's metadata sets a plain string title, such as `/back-room/[discovery]` and the not-found branches of the two writing routes, since `constructMetadata({ title })` returns an absolute title with the site name already added.
- `viewport` export: `width=device-width`, initial scale 1, `viewport-fit=cover` for notched devices, `theme-color` `#f1ebdf` in light mode and `#14100c` in dark mode, and `color-scheme` `light dark`. These moved from `<head>` tags into Next's viewport API on 2026-10-01.
- `<head>` extras (not handled by the Metadata API):
  - PWA: `mobile-web-app-capable`, `apple-mobile-web-app-capable`, status bar style, app title, and `application-name`
  - `format-detection` with telephone, date, email, and address detection off, which repeats the three settings in `constructMetadata`'s `formatDetection` and adds dates
  - MSApplication tile color and `/browserconfig.xml`
  - `/manifest.json` link
  - Apple touch icon (152x152) and 96px and 72px PNG icons, beside the `/favicon.png` that `constructMetadata` sets
  - RSS feed: `<link rel="alternate" type="application/rss+xml" href="/api/rss">`
  - LLM summary: `<link rel="alternate" type="text/markdown" href="/llms.txt">`
- Google Search Console: `constructMetadata()` sets `verification.google` from the `GOOGLE_SITE_VERIFICATION` environment variable, so the tag renders only when that variable is set at build time. Production rendered no verification tag on 2026-09-24.

---

## Sitemap — `scripts/generatePublicSitemap.mjs` + `src/lib/sitemap.js`

Runs automatically as the first `postbuild` step (`npm run generate:sitemap && npm run build:llms && node scripts/patch-nft-sharp.mjs`) and writes `public/sitemap.xml`. The snapshot refresh workflows also regenerate it through `scripts/ci/commit-and-push-snapshot.sh` and commit it with each changed snapshot, so snapshot-dated `lastmod` values move with the data.

`scripts/generatePublicSitemap.mjs` writes `PUBLIC_SITEMAP_ENTRIES` from `src/lib/sitemap.js`, prefixing each path with `SITE_URL` (default `https://isaacvazquez.com`). URLs already in the committed file keep their order, and new ones are appended alphabetically. `src/lib/sitemap.js` walks every `page.tsx` under `src/app`, skipping `api/` and `_`-prefixed folders, and lists each page unless it opts out, either with `noIndex: true` (or `index: false`) in its metadata or by rendering nothing but a redirect. `UNLISTED_ROUTES` covers pages whose metadata cannot say so, and it is empty as of 2026-11-02. Dynamic segments come from their own builders. Run `npm run generate:sitemap` after any change that alters an entry, such as a new or removed page or post, a post date, a snapshot refresh, or a row in `STATIC_ROUTE_LASTMOD` or `CHANGEFREQ_BY_ROUTE`, because the consistency test compares the committed file.

### Output fields

Each entry emits `loc`, `lastmod`, `changefreq`, and `priority`. `priority` is 1.0 for the routes in `PRIMARY_ROUTES`, 0.8 for the section hubs in `SECTION_HUB_ROUTES`, and 0.6 for everything else, and `changefreq` comes from `CHANGEFREQ_BY_ROUTE` with `monthly` as the fallback. The Jest sitemap consistency test compares all four fields against `public/sitemap.xml`.

### How `src/lib/sitemap.js` builds the list

`getPublicSitemapEntries()` merges four sources, dedupes by `loc`, and sorts alphabetically:

1. Static routes come from the route walk above, dated from the `STATIC_ROUTE_LASTMOD` map. Snapshot-driven routes take the later of their snapshot's timestamp, read by functions such as `readPremierLeagueLastmod`, `readInvestmentsLastmod`, `readFantasyLastmod`, and `readEarthquakeLastmod`, and a hand date for their last redesign. The identity pages carry the date of their last copy change, kept in step with each page's own `dateModified`, and `/writing` takes the later of its own copy change and its newest post. A route with no row gets the build date and a warning.
2. Writing topic pages come one per `BLOG_TOPIC_PAGES` entry, each dated by the newest post filed under its label through the `cluster` or `archiveBucket` frontmatter, and never earlier than `WRITING_TOPIC_LASTMOD` (2026-06-22).
3. Portfolio case studies come from `getPortfolioSlugEntries()`, which regex-extracts top-level slug keys from `src/constants/caseStudies.ts`, skipping any entry with a top-level `link:` (those `[slug]` routes `permanentRedirect()` to the live tool instead of rendering a page). Every current case study has one, so none is listed.
4. Blog posts come from `getBlogRouteEntries()`, which discovers `content/blog/*.{mdx,md}` at build time, using `updatedAt || publishedAt` for `lastmod` and excluding future-dated posts (their `publishedAt` is later than today).

Google uses `lastmod` only while it keeps matching real changes, which is why none of these dates is left to drift by hand when a source for it exists.

### Excluded paths

`/api/*`, `/_next/*`, `/404`, `/search`, `/score-pools/settings`, and the `/back-room/<discovery>` pages never appear. `/api/*` and `/_next/*` are off the route walk, the 404 response renders from `not-found.tsx` with no `page.tsx` of its own, `/search` and `/score-pools/settings` set `noIndex`, and `/back-room/[discovery]` is a dynamic segment with no builder whose pages also mark themselves noindex.

### Redirects and server-rendered HTML

Put redirects in `next.config.mjs`. On Netlify the proxy in `src/proxy.ts` answers before config redirects run, so a redirect in the proxy shadows the config's permanent rule, which is how `/blog` answered 307 and `/blog/posts/<slug>` landed on a 404 until 2026-09-24. A page that calls `permanentRedirect()` under a `loading.tsx` boundary also misfires, because the redirect lands after the 200 shell has streamed and ships as a meta refresh with the root layout's metadata.

A client component that calls `useSearchParams()` in a statically prerendered route bails the page out to client rendering at the nearest Suspense boundary, and the served HTML then drops the h1, the body text, and the JSON-LD. Render such a route per request, as the trade calculator does with `force-dynamic`, or give the client its own `<Suspense>`, and check the served HTML rather than the dev server, which renders every request.

---

## Open Graph images

`src/app/opengraph-image.tsx` draws the default 1200x630 card at `/opengraph-image`, which is `siteConfig.ogImage` and the image `constructMetadata` puts on the Open Graph and Twitter tags when a page passes none. A route folder with its own `opengraph-image.tsx` passes that card to `constructMetadata` as `image: "/<route>/opengraph-image"`, and `find src/app -name opengraph-image.tsx` lists them. Every card except March Madness's draws through `createEditorialOgImage` in `src/lib/og.tsx`. `src/app/writing/[slug]/opengraph-image.tsx` prerenders one card per post through its own `generateStaticParams`.

---

## Crawl policy, llms.txt, and IndexNow

### `public/robots.txt`

The file is maintained by hand. The `*` group blocks `/api/` except `/api/rss`, `/_next/` except `/_next/static/` and `/_next/image`, and `/node_modules/`. Named groups for the search and answer crawlers and for Google-Extended repeat those rules, because a named group replaces `*`, and the model-training crawlers are blocked from everything. The file ends with `Host` and `Sitemap` lines. `src/lib/__tests__/crawler-policy.test.ts` holds the named groups to the `*` rules, keeps the RSS feed and rendering assets open, keeps the training crawlers out, and checks the `Host` and `Sitemap` lines, and its `RETRIEVAL_AGENTS`, `PUBLIC_GENERATIVE_AGENTS` (Google-Extended), and `TRAINING_AGENTS` lists name each crawler.

### `llms.txt` and `llms-full.txt`

`public/llms.txt` is a hand-maintained summary of the site for language models, with its own "Last reviewed" line, and the root layout links it. `public/llms-full.txt` is generated, and the output is committed too. `npm run build:llms` runs `scripts/buildLlmsFull.mjs`, the second `postbuild` step, which writes a fixed profile, working principles, and tool list, then the full text of each post in `REPRESENTATIVE_SLUGS`. A slug whose file is missing is skipped without an error, and no test covers either file.

### IndexNow

`npm run submit:indexnow` runs `scripts/submitIndexNow.mjs`, which posts every `<loc>` in the committed `public/sitemap.xml` to `https://api.indexnow.org/indexnow`, or to `INDEXNOW_ENDPOINT` when that is set. The key file is `public/9f7d1a8c2fca455871c1520aaeb5753c.txt`. The script refuses any URL that is not HTTPS on `isaacvazquez.com` and any list outside 1 to 10,000 URLs, and `--dry-run` checks the payload without sending it. No workflow runs it, so a submission only happens by hand.

---

## Writing Voice in Meta Content

All user-facing text, including meta descriptions and page titles, must follow `WRITING_VOICE.md`. The rules that come up most in SEO copy:

- First person and direct, so "I built this because..." instead of "This tool was designed to..."
- No corporate hedging, so say plainly what the page is
- No "Comprehensive Guide" or "Complete Guide" openers, which read as generic listicle content
- No em dashes as stylistic devices, so use commas or periods instead
- No colons as sentence connectors, so "The problem is X" instead of "The problem: X"
- Data woven into sentences, as in the homepage's "I spent six years in campaign data and QA, and summer 2026 on Juno's MBA growth team," instead of a separate stats callout
- Descriptions within 160 characters, since `fitMetaDescription` cuts anything longer

When writing or editing `description` strings in `constructMetadata()` calls, read `WRITING_VOICE.md` first. The meta description is often the first thing someone reads about a page.

---

## Page Compliance Audit

Status of metadata and structured data for the routes listed below. The table does not cover every route, and the page file is the source of truth for `dateModified`. A "snapshot date" cell means the page follows its committed snapshot, and most of those pages also keep a floor at their last redesign through `laterDate()` or `getScorePoolsModifiedDate()`, so a stale snapshot shows the redesign date instead. On 2026-11-02 that put `/score-pools/settings` at 2026-10-12, since its committed snapshot dates from 2026-07-20. The Breadcrumbs column records `BreadcrumbList` JSON-LD, and only `/writing/[slug]` and `/writing/topics/[topic]` also print a visible trail. SportsApp is the `StructuredData` preset that prints a `SoftwareApplication` with a sports `applicationCategory`.

| Page | Metadata | ogType | canonicalUrl | dateModified | Structured Data | Breadcrumbs | Status |
|---|---|---|---|---|---|---|---|
| `/` | `constructMetadata` | website | `/` | 2026-10-01 | Person, WebSite | N/A (root) | OK |
| `/about` | `generateAIOptimizedMetadata` | website | `/about` | 2026-10-19 | Breadcrumb, ProfilePage, FAQ | Yes | OK |
| `/contact` | `constructMetadata` | website | `/contact` | 2026-10-19 | BreadcrumbList, ContactPage | Yes | OK |
| `/resume` | `constructMetadata` | website | `/resume` | 2026-10-19 | BreadcrumbList, ProfilePage | Yes | OK |
| `/portfolio` | `constructMetadata` | website | `/portfolio` | 2026-10-19 | BreadcrumbList, ItemList | Yes | OK |
| `/portfolio/[slug]` | None | None | None | None | None | None | OK; a redirect stub since 2026-10-02, every case study slug answers 308 to its live tool and any other slug is a 404, and the home and portfolio cards link to the tool directly |
| `/writing` | `constructMetadata` | website | `/writing` | 2026-09-28 | BreadcrumbList, ItemList | Yes | OK |
| `/writing/[slug]` | `generateMetadata` | article | full URL | post dates | Breadcrumb, Article | Yes | OK |
| `/writing/topics/[topic]` | `generateMetadata` | website | relative | newest post's `publishedAt` | BreadcrumbList, ItemList | Yes | OK |
| `/investments` | `constructMetadata` | website | `/investments` | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK |
| `/accessibility` | `constructMetadata` | website | `/accessibility` | 2026-10-02 | WebPage, BreadcrumbList | Yes | OK |
| `/privacy` | `constructMetadata` | website | `/privacy` | 2026-10-21 | WebPage, BreadcrumbList | Yes | OK |
| `/search` | `constructMetadata` | website | `/search` | 2025-02-05 | None | None | OK, `noIndex` |
| `/fantasy-football` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp, FAQ | Yes | OK; the first page of rankings rows is server-rendered from the committed snapshot, so non-JS crawlers see real players |
| `/fantasy-football/draft-tracker` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK |
| `/fantasy-football/rb-tiers` | 308 in `next.config.mjs` | n/a | n/a | n/a | n/a | n/a | OK; page file removed |
| `/fantasy-football/tiers/[pos]` | 308 in `next.config.mjs` | n/a | n/a | n/a | n/a | n/a | OK; page file removed |
| `/fantasy-football/trade-calculator` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK; renders per request (`force-dynamic`) so the client's `useSearchParams()` does not blank the HTML |
| `/fantasy-football/weekly`, `/fantasy-football/waivers` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApplication | Yes | OK; the first rows render on the server from a one-format seed of `weekly.json` (`loadFantasyWeeklySeed`) |
| `/score-pools/settings` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, WebPage | Yes | OK, `noIndex` |
| `/premier-league` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/la-liga` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SportsApp | Yes | OK |
| `/news-pulse` | `constructMetadata` | website | relative | 2026-10-12 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/march-madness-2026` | `constructMetadata` | website | relative | 2026-10-26 | BreadcrumbList, Article, FAQ, SportsApp | Yes | OK |
| `/spacex-mission-control` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApp | Yes | OK |
| `/polling-aggregator` | `constructMetadata` | website | relative | snapshot date | BreadcrumbList, SoftwareApp | Yes | OK |
| `/fintech-tools/budget-planner` | `constructMetadata` | website | relative | 2026-10-12 | BreadcrumbList, SoftwareApp | Yes | OK |
| `/fintech-tools/interchange-iq` | `constructMetadata` | website | relative | 2026-10-12 | BreadcrumbList, SoftwareApplication | Yes | OK |

### Gaps to address

1. Visible breadcrumbs. Most pages in the table emit `BreadcrumbList` JSON-LD, but only the article and topic pages under `/writing` print a trail a reader can see. Add one elsewhere only if the page design calls for it.
2. `/search` is correctly `noIndex`, which keeps it out of the sitemap, and it should stay that way because the search API is intentionally limited.

---

## Best Practices Checklist

### Every page must have
- [ ] `title`, unique and within 60 characters where possible once `constructMetadata` adds the site name, which leaves 44 characters for the page's own words
- [ ] `description` — unique, 150-160 characters, following `WRITING_VOICE.md` tone
- [ ] `canonicalUrl` — prevents duplicate content (use relative paths like `"/about"`)
- [ ] `dateModified` — helps search engines understand content freshness
- [ ] At minimum one structured data type
- [ ] Breadcrumb structured data (all non-homepage pages)

### Article and content pages additionally need
- [ ] `ogType: "article"`
- [ ] `datePublished` (ISO 8601)
- [ ] `articleAuthor`, `articleSection`, `articleTags`
- [ ] `<AIStructuredData schema={{ type: "Article", data }} />` in JSX
- [ ] `<AIStructuredData schema={{ type: "Breadcrumb", data: { items } }} />` in JSX

### Non-public pages
- [ ] `noIndex: true` — applies to utility routes, draft pages

### Never do
- Hardcode `https://isaacvazquez.com` in page files — use `siteConfig.url` or pass relative paths to `canonicalUrl`
- Set `og:type: "website"` on blog posts
- Skip `canonicalUrl` on dynamic routes (duplicate content risk)
- Reintroduce `next-seo` for meta tags, since `constructMetadata` covers it
- Write meta descriptions in third person or corporate voice — see Writing Voice section above
- Use "Comprehensive Guide" or "Complete Guide" in titles or descriptions

---

## Adding SEO to a New Page

### Static page

```tsx
// src/app/new-page/page.tsx
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/StructuredData";

export const metadata = constructMetadata({
  title: "New Page Title",
  description: "150-160 character description in first-person voice.",
  canonicalUrl: "/new-page",
  dateModified: "2026-04-05",
});

export default function NewPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "New Page", url: "/new-page" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      {/* page content */}
    </>
  );
}
```

`<StructuredData type="BreadcrumbList">` prints `items` unchanged as the list's elements, so build them with `generateBreadcrumbStructuredData`, which numbers each entry and makes its URL absolute. Every `BreadcrumbList` page in `src/app` does it this way. Then add the route to `STATIC_ROUTE_LASTMOD` in `src/lib/sitemap.js` with the same date as `dateModified` and run `npm run generate:sitemap`, or the sitemap gives the page the build date and a warning.

### Dynamic route (content page)

```tsx
// src/app/items/[slug]/page.tsx
import { notFound } from "next/navigation";
import { absoluteUrl, constructMetadata, personCanonicalUrl, siteConfig } from "@/lib/seo";
import { AIStructuredData } from "@/components/AIStructuredData";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) return { title: "Not found", robots: { index: false, follow: true } };

  return constructMetadata({
    title: item.title,
    description: item.description,
    ogType: "article",
    datePublished: item.createdAt,
    dateModified: item.updatedAt,
    articleAuthor: personCanonicalUrl,
    articleSection: item.category,
    articleTags: item.tags,
    canonicalUrl: `/items/${slug}`,
  });
}

export default async function ItemPage({ params }) {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) notFound();

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
            author: { name: siteConfig.name, url: personCanonicalUrl },
            datePublished: item.createdAt,
            dateModified: item.updatedAt,
            url: absoluteUrl(`/items/${slug}`),
            keywords: item.tags,
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

### `fitSearchTitle(title)` and `fitMetaDescription(description)`

`fitSearchTitle` drops a trailing site-name suffix and clips the rest to 44 characters, which keeps the title within 60 once `constructMetadata` adds the suffix back. `/writing/[slug]` is the only page that calls it. `fitMetaDescription` is the 160-character fitter described under `constructMetadata`, and the article page also calls it directly.

### `laterDate(a, b)`

Returns the later of two `YYYY-MM-DD` dates, and a missing first date loses. Several snapshot dashboards pass it their snapshot date and the date of their last redesign, so `dateModified` never falls behind the redesign.

### `safeJsonLd(data)`

Serializes JSON-LD for `dangerouslySetInnerHTML` with `<`, `>`, `&`, U+2028, and U+2029 escaped, so a value containing `</script>` cannot end the script block. `StructuredData` and `AIStructuredData` both render through it.

### `absoluteUrl(path)`

Prefixes `siteConfig.url` to a relative path and returns an absolute URL unchanged. `personCanonicalUrl` (`/about`) and `personSchemaId` (`/about#person`) are built with it.

### `freeApplicationOffer`

The free `Offer` (price `"0"`, currency USD) that the `SoftwareApplication` preset adds when a page passes no `offers`. The `SportsApplication` preset adds no offer of its own, so every page that uses it passes `offers: freeApplicationOffer`.

### `calculateReadingTime(text: string): number`

Returns estimated reading time in minutes (200 wpm). Only `src/lib/__tests__/seo.test.ts` calls it. Blog posts get their reading time from a separate `calculateReadingTime` in `src/lib/blog.ts`, which uses the same 200 words per minute and returns a string such as "4 min read".

```ts
import { calculateReadingTime } from "@/lib/seo";
const minutes = calculateReadingTime(post.content); // e.g. 4
```

---

## Key Files

| File | Role |
|---|---|
| `src/lib/seo.ts` | `constructMetadata`, `siteConfig`, `buildPersonEntity`, the breadcrumb builder, and the title, description, date, and JSON-LD helpers |
| `src/lib/ai-seo.ts` | AI-optimized schema generators |
| `src/components/StructuredData.tsx` | Preset JSON-LD component (11 types) |
| `src/components/AIStructuredData.tsx` | Data-driven JSON-LD component (10 types) |
| `src/app/layout.tsx` | Global metadata, `viewport` export, head tags |
| `src/app/metadata.ts` | Homepage metadata config |
| `src/app/writing/[slug]/page.tsx` | Article pattern reference |
| `src/lib/profile.ts` | Name, description, and `sameAs` links that `siteConfig` and the Person entity read |
| `src/app/opengraph-image.tsx`, `src/lib/og.tsx` | Default share card and the drawing helper most route cards use |
| `public/llms.txt` | Hand-maintained site summary for language models, linked from the root layout |
| `scripts/buildLlmsFull.mjs` | Writes `public/llms-full.txt` (`npm run build:llms`, the second `postbuild` step) |
| `scripts/submitIndexNow.mjs` | Posts every sitemap URL to IndexNow (`npm run submit:indexnow`, run by hand) |
| `src/app/api/rss/route.ts` | RSS feed of every published post at `/api/rss`, built once per deploy (`force-static`) and linked from the root layout |
| `next.config.mjs` | Legacy URL redirects in `redirects()` |
| `scripts/generatePublicSitemap.mjs` | Writes `public/sitemap.xml` from `src/lib/sitemap.js` |
| `src/lib/sitemap.js` | Builds the allowlisted sitemap entries (`loc` + `lastmod`) |
| `public/robots.txt` | Crawl directives (manually maintained). Cloudflare prepends its managed AI crawler block when it serves the file, so the live robots.txt is longer than this one, and `crawler-policy.test.ts` can't see the difference. See `docs/seo-aeo-audit-2026-11-02.md`. |
| `WRITING_VOICE.md` | Voice and tone rules for all user-facing text including meta content |
