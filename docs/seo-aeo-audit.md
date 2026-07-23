# AEO and SEO audit

Audited and reconciled July 23, 2026.

## Summary

I checked the finished implementation against every item in the original audit brief, then rebuilt and crawled the production application rather than relying on source inspection alone. The final crawl covered all 249 sitemap URLs, 18 control and legacy URLs, 8,504 rendered internal links, 209 distinct social images, and all 196 published writing pages. Every indexable URL returned 200 with a unique title and description, a self-referencing canonical, complete social metadata, one `h1`, one page-level `main`, valid JSON-LD, and no broken internal links.

The original baseline had two high-severity findings, four medium-severity findings, and three low-severity findings. All nine are fixed. The reconciliation also caught six omissions from the first implementation, including the exact `/admin` robots rule, redirect chains on retired project URLs, the promised article-date validation guard, stale modification dates on changed tools, inaccurate social-image dimensions, and two heading-level skips. Those are fixed too.

No required repository-local corrective work remains from the original brief. Search Console data, production crawl logs, backlinks, third-party mentions, and external entity profiles remain outside this repository.

## Stack and rendering model

| Item | What is in the repository | Evidence |
| --- | --- | --- |
| Framework | Next.js 16 with the App Router | `package.json`; `src/app/` |
| Rendering | A mix of static generation and dynamic server rendering, with client hydration for interactive tools | The production build generated 310 application pages, including 196 statically generated writing pages |
| Content | MDX files for writing and changelog content, TypeScript snapshots for data products, and route components for tools | `content/blog/`; `content/changelog/`; `src/data/`; `src/app/` |
| Deployment | Netlify through `@netlify/plugin-nextjs` | `netlify.toml:16` |
| Shared metadata | Next.js Metadata API through a repository helper | `src/lib/seo.ts:118` |
| Sitemap | Repository-generated XML based on route inventory, content dates, and snapshot revisions | `src/lib/sitemap.js:391`; `scripts/generatePublicSitemap.mjs` |

## Final production verification

| Check | Final result |
| --- | --- |
| Sitemap URLs | 249 of 249 returned 200 |
| Initial HTML | News Pulse headlines and Job Search records were present before hydration |
| Internal discovery | 8,504 internal links checked, 249 unique route targets, no broken targets, no redirecting links, and no orphan sitemap pages |
| URL hygiene | No tracking parameters, uppercase paths, or trailing-slash variants in rendered internal links |
| Titles | No missing, duplicate, or over-60-character titles |
| Descriptions | No missing, duplicate, or over-160-character descriptions |
| Canonicals | No missing or incorrect canonicals on indexable pages |
| Social metadata | Complete Open Graph and Twitter metadata on every indexable page |
| Social images | 209 distinct images returned 200 with an image content type and actual dimensions of 1200 by 630 |
| Language and icons | Every page rendered `lang="en"` with favicon, touch icon, and manifest links |
| Headings and landmarks | Every indexable page rendered one `h1`, one page-level `main`, and no heading-level skips |
| Images and links | No image lacked an `alt` attribute and no vague anchor remained; empty alternatives were limited to decorative hidden graphics |
| JSON-LD | Every block parsed, every writing page had one complete Article object, and every nested indexable page had BreadcrumbList schema |
| Freshness | No future sitemap dates, all writing pages displayed a date, and all 37 migrated articles carried the July 20 modification signal |
| Error handling | The test URL returned 404 with an independent title, `noindex`, and no canonical |
| Redirects | Canonical route families and all ten retired project paths redirected directly to their final destination |
| Cache policy | Rendered HTML included `Netlify-CDN-Cache-Control: no-store` through `src/proxy.ts:88` |

## Crawlability and indexing

The crawl policy is deliberate. Public search and answer retrieval are allowed, including Google-Extended because Gemini visibility was an explicit goal. Training crawlers remain blocked. The exact admin path, API routes other than RSS, framework internals, and dependencies are excluded in every public crawler group at `public/robots.txt:4` through `public/robots.txt:56`.

| Crawler | Policy | Intent |
| --- | --- | --- |
| OAI-SearchBot and ChatGPT-User | Public pages allowed | ChatGPT retrieval |
| Claude-SearchBot and Claude-User | Public pages allowed | Claude retrieval |
| PerplexityBot and Perplexity-User | Public pages allowed | Perplexity retrieval |
| Google-Extended | Public pages allowed | Gemini grounding and other generative uses |
| GPTBot, ClaudeBot, CCBot, Applebot-Extended, Meta-ExternalAgent, Amazonbot, and cohere-ai | Blocked | Model training and broad collection are not part of the visibility goal |

Google documents that Google-Extended controls Gemini training and grounding uses without changing Google Search ranking or eligibility for Google Search AI features. The implemented policy follows that distinction in `public/robots.txt:36`. The supporting source is Google's [crawler documentation](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended).

The sitemap contains every indexable canonical route and excludes `/search`, `/analytics-reference`, and `/admin`, which all render `noindex`. Modification dates come from content frontmatter, interface revision dates, or data snapshot revisions rather than the build timestamp. Future-dated writing stays out of the sitemap.

The retired project mappings now precede the wildcard project redirect at `next.config.mjs:11` through `next.config.mjs:62`, so those URLs do not bounce through `/portfolio/[slug]`. The rendered site contains no links to redirecting paths.

## Page metadata

The shared helper at `src/lib/seo.ts:98` budgets the writing and portfolio title before the brand is added, strips trailing punctuation before an ellipsis, and keeps the rendered title at or below 60 characters. Descriptions are normalized and capped at 160 characters at `src/lib/seo.ts:108`. The rendered crawl found no missing or duplicate title, description, canonical, Open Graph set, or Twitter set.

Writing pages now use their generated 1200 by 630 route card for Open Graph and Twitter metadata at `src/app/writing/[slug]/page.tsx:56`. Licensed cover photos remain visible in the article and remain part of Article schema, but the metadata no longer claims that differently sized cover files are 1200 by 630.

The root layout sets the English language, manifest, favicon, touch icon, and RSS discovery at `src/app/layout.tsx:52` through `src/app/layout.tsx:75`. There is one supported locale, so no alternate language version is advertised. The self-referencing `en-US` alternate is generated by the shared helper at `src/lib/seo.ts:221`.

The admin metadata now has its own title, description, canonical, and `noindex, nofollow` policy at `src/app/admin/layout.tsx:4`. The 404 has an independent title and description, returns a real 404, renders `noindex`, and omits its canonical at `src/app/not-found.tsx:4`.

## Structured data

The site has Person and WebSite identity schema with a consistent `Isaac Vazquez` entity and `/about` identifier at `src/components/StructuredData.tsx:41`. All 196 writing pages render one Article object with headline, author, `datePublished`, `dateModified`, image, canonical entity URL, language, keywords, and word count through `src/app/writing/[slug]/page.tsx:112`.

Every nested indexable page renders BreadcrumbList schema. The score-pools tracker and settings gaps from the baseline are resolved with BreadcrumbList and WebPage objects at `src/app/score-pools/tracker/page.tsx:26` and `src/app/score-pools/settings/page.tsx:26`. FAQ schema remains limited to pages with visible question-and-answer content. I did not add broad FAQPage or HowTo markup where the page does not genuinely fit those types.

The production parser found no invalid JSON-LD, no missing required Article field, and no nested sitemap page without breadcrumbs.

## Content for answer engines

The writing template renders one title, a visible author, published and updated dates, a direct summary before the article body, semantic `article` markup, breadcrumbs, topic links, related posts, and chronological navigation. The relevant template starts at `src/app/writing/[slug]/page.tsx:181`, with visible update handling at `src/app/writing/[slug]/page.tsx:237`.

News Pulse and Job Search now place bounded primary records in the server response through `src/lib/newsPulseServer.ts:290` and `src/lib/mbaJobsServer.ts:1138`. Their route components fetch those functions directly at `src/app/news-pulse/page.tsx:25` and `src/app/mba-internship-notifications/page.tsx:30`, while the clients still handle filtering and refresh after hydration.

The two claim-heavy articles identified in the baseline now cite official vendor announcements and pricing pages next to checkable claims, carry explicit as-of framing, and use descriptive internal anchors. The fact check also corrected one AWS timing sentence from early 2026 to mid-2026. I did not force tables of contents onto all long pieces because the current summary, descriptive sections, breadcrumbs, and related links provide clean extraction without adding a generic navigation block to every essay.

The rendered crawl found no vague `here`, `click here`, `read more`, or `learn more` anchors. It also found no heading skip after correcting the Resume and World Cup group-card hierarchy.

## Freshness and content hygiene

All 37 writing files introduced in the July 20 migration preserve their original publication date and now carry `updatedAt: "2026-07-20"`. That value reaches the visible article header, Metadata API, Article schema, sitemap, and RSS Atom update field. Across the 196 published articles, 51 now have an explicit update date and none predates publication.

The substantive edit guard at `scripts/checkBlogDateReview.ts:90` compares article body text against the pull request base and fails when a meaningful body edit does not include an `updatedAt` review. The test workflow fetches history and runs the guard before the unit suite in `.github/workflows/test.yml`.

Interface revisions for News Pulse, Job Search, Score Pools, Resume, Changelog, and World Cup now use July 23 or a newer underlying snapshot date in page metadata and the sitemap. The final crawl found no future modification date and no writing page without a visible machine-readable date.

## AI-specific extras

`public/llms.txt` exists and points to the canonical sitemap and RSS feed. I would keep treating it as optional agent-readiness documentation, not a citation or ranking control. The higher-value signals are the initial HTML, evidence links, schema, canonicals, consistent identity, and trustworthy dates.

RSS discovery is wired in the root layout at `src/app/layout.tsx:75`. The feed uses canonical item URLs and emits an Atom update value from `updatedAt` or `publishedAt` at `src/app/api/rss/route.ts:41`.

## Baseline findings and resolution

| Severity | Baseline finding | Resolution |
| --- | --- | --- |
| High | Thirty-seven migrated articles exposed only old publication dates | Added truthful July 20 update dates across visible HTML, metadata, schema, sitemap, and RSS |
| High | News Pulse and Job Search omitted primary records from initial HTML | Moved shared data reads to server-callable functions and hydrated clients with bounded initial records |
| Medium | Branded titles exceeded the intended budget and could end on dangling text | Added full rendered-title budgeting, explicit short titles, and regression tests |
| Medium | Google-Extended was blocked despite the Gemini visibility goal | Allowed public retrieval while preserving private-route exclusions |
| Medium | Two fact-heavy articles lacked enough primary-source support | Added official citations, as-of framing, and one timing correction |
| Medium | Substantive article updates lacked a consistent modification-date process | Added visible updates and a pull request guard |
| Low | Score-pools child routes lacked structured data | Added BreadcrumbList and WebPage schema |
| Low | The 404 inherited homepage identity | Added independent metadata, `noindex`, and no canonical |
| Low | Three links used vague anchor text | Replaced them with descriptive destination text |

## Prioritized maintenance

1. Run the rendered crawl after deployment and compare production output with this local production baseline, especially status codes, social-image responses, and cache headers.

2. Keep meaningful writing changes paired with `updatedAt`, and let the date-review check block ambiguous edits rather than automatically changing dates for formatting or image swaps.

3. Keep checkable market, product, and pricing claims tied to primary sources with an explicit as-of date.

4. Revisit crawler permissions intentionally if the content-use policy changes. Google-Extended is currently allowed because Gemini grounding was judged worth it.

## Outside repository scope

Backlinks, third-party mentions, publisher authority, social distribution, external profile consistency, live Google Search Console and Bing Webmaster Tools data, production crawl logs, and answer-engine citation tracking cannot be verified from this repository. The repository makes that work easier through clean canonical URLs, consistent `Isaac Vazquez` identity, descriptive bylines, shareable 1200 by 630 images, RSS, and direct legacy redirects, but it cannot create or measure those off-page signals by itself.

The metadata helper supports Google site verification through `GOOGLE_SITE_VERIFICATION` in `src/lib/seo.ts`. Whether that environment value is configured in production is also outside source control.
