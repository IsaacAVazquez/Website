# Project Roadmap

Last updated: 2026-03-04

Prioritized list of improvements identified from the [codebase audit](./UNDERUTILIZED_FEATURES.md). Organized by priority tier — P0 items are high-impact quick wins, P3 items require a decision before work begins.

For investments-specific enhancements, see [docs/FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md).

---

## P0 — Quick Wins (high impact, low effort)

These items surface existing content that is currently invisible to visitors.

### 1. Add `/writing` to navigation
- **Why:** 16 published articles exist with zero discoverability. No link in nav, footer, or homepage.
- **Files:** `src/constants/navlinks.tsx` (add entry), possibly footer component
- **Effort:** Tiny

### 2. Fix `WritingPreview` on homepage
- **Why:** The homepage `WritingPreview` component calls the search API which returns 0 blog results. It renders nothing.
- **Fix:** Either fix the search API to index blog posts (see P2 #14), or have `WritingPreview` call `blog.ts` directly to get recent posts instead of going through the search API.
- **Files:** `WritingPreview` component, possibly `/api/search` route
- **Effort:** Small

### 3. Link draft tracker from FF landing page
- **Why:** `/fantasy-football/draft-tracker` is built but not linked from the fantasy football landing page.
- **Files:** `src/app/fantasy-football/fantasy-football-client.tsx` or landing page component
- **Effort:** Tiny

### 4. Show all 5 case studies on `/portfolio`
- **Why:** Only 2 of 5 case studies are `featured: true`. The other 3 have detail pages but are unreachable.
- **Options:** (a) Mark all 5 as featured, (b) add a "View all projects" section below featured, (c) add a filter/toggle.
- **Files:** `src/constants/caseStudies.ts`, `src/app/portfolio/` page component
- **Effort:** Tiny–Small

### 5. Add "Read My Writing" CTA to `ThinkingPreview` section
- **Why:** The homepage has a `ThinkingPreview` section that could link to `/writing` to drive traffic to the blog.
- **Files:** `ThinkingPreview` component
- **Effort:** Tiny

---

## P1 — Cleanup (reduce maintenance burden)

Dead code removal. No user-facing impact, but reduces confusion and bundle size.

### 6. Delete dead components
- `src/components/QADashboard.tsx` — 282 lines, never imported
- `src/components/TierChart.tsx` — Superseded by `LightweightTierChart`
- `src/components/DraftTierChart.tsx` — Exported from lazy loader but never consumed
- **Effort:** Tiny

### 7. Delete `src/app/blog/[slug]/page.tsx` stub
- Only contains `notFound()`. The redirect in `next.config.mjs` handles this route before it's ever reached.
- **Effort:** Tiny

### 8. Delete `content/writing/` duplicate directory
- 16 files identical to `content/blog/`. Nothing reads from `content/writing/`.
- **Effort:** Tiny

### 9. Delete orphaned image scraping scripts
- 62+ files in `scripts/` from a completed player image acquisition campaign.
- Also delete stale artifacts: `scripts/image-validation-report.json`, `scripts/players-to-rescrape.json`.
- **Effort:** Small (verify nothing references them first)

### 10. Delete deprecated `/api/fantasy-pros/route.ts`
- Marked `@deprecated` in source. Only referenced by admin validate function.
- Also remove the admin reference to it.
- **Effort:** Tiny

### 11. Delete `src/lib/webScraper.ts`
- Original prototype scraper, superseded by `fantasyProsAPI.ts`.
- Remove import from `dataManager.ts`.
- **Effort:** Tiny

### 12. Remove `Cmd+K` command palette reference from accessibility page
- The accessibility page documents a keyboard shortcut for a command palette that was never built.
- **Files:** `src/app/accessibility/page.tsx`
- **Effort:** Tiny

---

## P2 — Feature Completion

Wire up half-built features so they actually work.

### 13. Wire RSS feed to `blog.ts`
- **Current state:** `/api/rss` serves 3 hardcoded posts from Jan 2025.
- **Fix:** Import `blog.ts` functions, generate RSS from actual `content/blog/` posts. Add `<link rel="alternate" type="application/rss+xml">` to root layout `<head>`.
- **Files:** `src/app/api/rss/route.ts`, `src/app/layout.tsx`
- **Effort:** Small

### 14. Make search API index blog posts
- **Current state:** `getAllSearchableContent()` returns 5 hardcoded entries.
- **Fix:** Have it read from `content/blog/` using `blog.ts` functions, plus index portfolio case studies and other content.
- **Files:** `src/app/api/search/route.ts`
- **Effort:** Small–Medium

### 15. Link FF tier SEO pages from fantasy football UI
- **Current state:** 8 position-specific tier pages exist at `/fantasy-football/tiers/[position]` but aren't linked from the FF interface.
- **Fix:** Add position links/cards to the FF landing page and/or navigation.
- **Files:** FF landing page component
- **Effort:** Small

### 16. Expand investments research to support arbitrary tickers
- **Current state:** Research tab only works for ~10 pre-fetched tickers with static JSON in `public/data/investments/`.
- **Fix:** Add on-demand API fetching for any valid ticker symbol, with caching.
- **Files:** Investment hooks, API routes
- **Effort:** Medium

---

## P3 — Decide: Finish or Remove

These require a product decision before any work begins.

### 17. Local SEO system
- **Current state:** `localSEO.ts`, `localSitemap.ts`, `/sitemap-local.xml`, `/local-business.json` — all populated with fake phone numbers, placeholder API keys, and a "QA consulting" persona.
- **Option A (Remove):** Delete all local SEO files and routes. The site is a personal portfolio, not a local business.
- **Option B (Repurpose):** Populate with real data if local business visibility is desired for consulting.
- **Recommendation:** Remove unless actively pursuing local consulting clients.

### 18. Analytics system
- **Current state:** Client-side event collection sends data to `/api/analytics/` which stores in ephemeral in-memory arrays. Wiped on every Netlify cold start. Never persists.
- **Option A (GA4):** The `NEXT_PUBLIC_GA_ID` env var path already exists. Wire up Google Analytics and remove the custom in-memory API.
- **Option B (Remove):** Delete `/api/analytics/` and the client-side collection code if analytics aren't needed.
- **Recommendation:** GA4 is the simplest path to real analytics.

### 19. Admin analytics dashboard
- **Current state:** `/admin/analytics` shows hardcoded fake data. Doesn't read from any real data source.
- **Option A (Wire to GA4):** If #18 goes with GA4, pull real data via the GA4 Data API.
- **Option B (Remove):** Delete the fake dashboard page.
- **Depends on:** Decision on #18.

### 20. Contact form
- **Current state:** Contact page has mailto link + LinkedIn. No actual form submission.
- **Option A (Add form):** Add a simple contact form with Netlify Forms or a third-party service.
- **Option B (Keep as-is):** mailto + LinkedIn may be sufficient for a portfolio site.
- **Recommendation:** Keep as-is unless contact volume is a problem.

---

## Progress Tracking

| # | Item | Status |
|---|---|---|
| 1 | Add `/writing` to navigation | Not started |
| 2 | Fix `WritingPreview` on homepage | Not started |
| 3 | Link draft tracker from FF landing | Not started |
| 4 | Show all 5 case studies on `/portfolio` | Not started |
| 5 | Add writing CTA to `ThinkingPreview` | Not started |
| 6 | Delete dead components | Not started |
| 7 | Delete blog slug stub | Not started |
| 8 | Delete `content/writing/` duplicate | Not started |
| 9 | Delete orphaned scripts | Not started |
| 10 | Delete deprecated fantasy-pros route | Not started |
| 11 | Delete `webScraper.ts` | Not started |
| 12 | Remove Cmd+K reference | Not started |
| 13 | Wire RSS to `blog.ts` | Not started |
| 14 | Index blog posts in search API | Not started |
| 15 | Link FF tier pages from UI | Not started |
| 16 | Expand investments research | Not started |
| 17 | Local SEO: finish or remove | Decision needed |
| 18 | Analytics: GA4 or remove | Decision needed |
| 19 | Admin analytics dashboard | Decision needed |
| 20 | Contact form | Decision needed |
