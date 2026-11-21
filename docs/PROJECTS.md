> [!IMPORTANT]
> Historical reference only. This file captures an older roadmap snapshot and is not a current source of truth by itself. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, `ARCHITECTURE.md`, `API.md`, and `docs/README.md` for current documentation.

# Project Roadmap

Last updated: 2026-11-16 (the roadmap was written on 2026-03-04, and the notes that start "As of 2026-11-02" were added on 2026-11-02)

Prioritized list of improvements identified from a codebase audit (`docs/UNDERUTILIZED_FEATURES.md`, removed 2026-10-01 and still in git history). Items are organized by priority tier, where P0 items are high-impact quick wins and P3 items need a decision before work begins.

For investments-specific enhancements, see [docs/FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md).

---

## P0 — Quick Wins (high impact, low effort)

These items surface existing content that is currently invisible to visitors.

### 1. Add `/writing` to navigation
- **Why:** 16 published articles exist with zero discoverability. No link in nav, footer, or homepage.
- **Files:** `src/constants/navlinks.tsx` (add entry), possibly footer component
- **Effort:** Tiny
- As of 2026-11-02 this is done. Writing came back to the header on 2026-04-03 and is one of the seven `catalog97NavLinks` in `src/constants/catalog97Nav.ts`, and `navlinks.tsx` was deleted on 2026-09-16.

### 2. Fix `WritingPreview` on homepage — obsolete
- **Why:** `WritingPreview` was deleted in August 2026 after Catalog 97 replaced the homepage, so the component this item described no longer exists.

### 3. Link draft tracker from FF landing page
- **Why:** `/fantasy-football/draft-tracker` is built but not linked from the fantasy football landing page.
- **Files:** `src/app/fantasy-football/fantasy-football-client.tsx` or landing page component
- **Effort:** Tiny
- As of 2026-11-02 this is done. The fantasy product bar (`src/components/fantasy/FantasyProductBar.tsx`, added on 2026-10-13) links the draft tracker from every fantasy page.

### 4. Show all 5 case studies on `/portfolio`
- **Why:** Only 2 of 5 case studies are `featured: true`. The other 3 have detail pages but are unreachable.
- **Options:** (a) Mark all 5 as featured, (b) add a "View all projects" section below featured, (c) add a filter/toggle.
- **Files:** `src/constants/caseStudies.ts`, `src/app/portfolio/` page component
- **Effort:** Tiny–Small
- As of 2026-11-02 this is obsolete. Every case study in `caseStudies.ts` now links to a live tool, `/portfolio/[slug]` only redirects to that tool, `/dashboards` indexes all of them, and since 2026-10-19 `/portfolio` shows four lead projects on purpose.

### 5. Add "Read My Writing" CTA to `ThinkingPreview` section — obsolete
- **Why:** `ThinkingPreview` was deleted in August 2026 after Catalog 97 replaced the homepage, so the section this item described no longer exists.

---

## P1 — Cleanup (reduce maintenance burden) ✅ Complete

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
- Marked `@deprecated` in source. Used by admin's "FantasyPros API" import tab (API key validation + data fetch).
- Also removed `handleAPIFetch` function, `apiKey` state, and the import tab button from `admin/page.tsx`.
- **Effort:** Tiny

### 11. Delete `src/lib/webScraper.ts`
- Original prototype scraper, superseded by `fantasyProsAPI.ts`.
- Remove import from `dataManager.ts`.
- **Effort:** Tiny

### 12. Remove `Cmd+K` command palette reference from accessibility page
- The accessibility page documents a keyboard shortcut for a command palette that was never built.
- **Files:** `src/app/accessibility/page.tsx`
- **Effort:** Tiny
- As of 2026-11-02, Cmd/Ctrl+K and `/` open the header's site search panel (`src/components/catalog97/Catalog97Header.tsx`), which the site header has done since 2026-06-23, and the accessibility page's keyboard shortcut list names only Escape, Tab, and Shift + Tab.

---

## P2 — Feature Completion

Wire up half-built features so they actually work.

### 13. Wire RSS feed to `blog.ts`
- **Current state:** `/api/rss` serves 3 hardcoded posts from Jan 2025.
- **Fix:** Import `blog.ts` functions, generate RSS from actual `content/blog/` posts. Add `<link rel="alternate" type="application/rss+xml">` to root layout `<head>`.
- **Files:** `src/app/api/rss/route.ts`, `src/app/layout.tsx`
- **Effort:** Small
- As of 2026-11-02 this is done. `src/app/api/rss/route.ts` has built the feed from `src/lib/blog.ts` since 2026-04-02, through `getBlogFeedEntries` as of 2026-11-16, and `src/app/layout.tsx` carries the `rel="alternate"` RSS link.

### 14. Make search API index blog posts
- **Current state:** `getAllSearchableContent()` returns 5 hardcoded entries.
- **Fix:** Have it read from `content/blog/` using `blog.ts` functions, plus index portfolio case studies and other content.
- **Files:** `src/app/api/search/route.ts`
- **Effort:** Small–Medium
- As of 2026-11-02 this is done. Since PR #580 merged on 2026-10-09, `getAllSearchableContent()` indexes the full text of every published post through `getBlogPostSearchEntries`, every case study, and a hand-listed set of pages.

### 15. Link FF tier SEO pages from fantasy football UI
- **Current state:** 8 position-specific tier pages exist at `/fantasy-football/tiers/[position]` but aren't linked from the FF interface.
- **Fix:** Add position links/cards to the FF landing page and/or navigation.
- **Files:** FF landing page component
- **Effort:** Small
- As of 2026-11-02 this is obsolete. The tier pages are retired, and since 2026-09-24 `next.config.mjs` permanently redirects `/fantasy-football/tiers/:position` to `/fantasy-football?position=:position&scoring=ppr`.

### 16. Expand investments research to support arbitrary tickers
- **Current state:** Research tab only works for ~10 pre-fetched tickers with static JSON in `public/data/investments/`.
- **Fix:** Add on-demand API fetching for any valid ticker symbol, with caching.
- **Files:** Investment hooks, API routes
- **Effort:** Medium
- As of 2026-11-02 this is still not started. Research covers the tickers prefetched under `public/data/investments/` (151 on that date), and there is no on-demand fetch for any other ticker.

---

## P3 — Decide: Finish or Remove

These require a product decision before any work begins.

### 17. Local SEO system
- **Current state:** `localSEO.ts`, `localSitemap.ts`, `/sitemap-local.xml`, `/local-business.json` — all populated with fake phone numbers, placeholder API keys, and a "QA consulting" persona.
- **Option A (Remove):** Delete all local SEO files and routes. The site is a personal portfolio, not a local business.
- **Option B (Repurpose):** Populate with real data if local business visibility is desired for consulting.
- **Recommendation:** Remove unless actively pursuing local consulting clients.
- As of 2026-11-02 this is done. `localSEO.ts`, `localSitemap.ts`, and the `/sitemap-local.xml` and `/local-business.json` routes were deleted on 2026-03-05, the day after this roadmap was written.

### 18. Analytics system
- **Current state:** Public third-party analytics have been removed from the live site. There is no supported GA measurement ID configuration path and no live `/api/analytics/` integration.
- **Status:** Done — removed orphaned GA4 and Contentsquare injections while keeping the stricter CSP in place.
- As of 2026-11-02, GA4 is back as an opt-in. `src/components/analytics/GoogleAnalytics.tsx` (added on 2026-06-23) loads gtag.js only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` holds a `G-` measurement ID, and there is still no `/api/analytics/` route.

### 19. Admin analytics dashboard
- **Current state:** `/admin/analytics` is not part of the live route tree.
- **Status:** Done — removed with the rest of the abandoned analytics surface.

### 20. Contact form
- **Current state:** Contact page has mailto link + LinkedIn. No actual form submission.
- **Option A (Add form):** Add a simple contact form with Netlify Forms or a third-party service.
- **Option B (Keep as-is):** mailto + LinkedIn may be sufficient for a portfolio site.
- **Recommendation:** Keep as-is unless contact volume is a problem.

---

## Progress Tracking

| # | Item | Status |
|---|---|---|
| 1 | Add `/writing` to navigation | Done, Writing in the header since 2026-04-03 |
| 2 | Fix `WritingPreview` on homepage | Obsolete, component deleted |
| 3 | Link draft tracker from FF landing | Done, fantasy product bar added 2026-10-13 |
| 4 | Show all 5 case studies on `/portfolio` | Obsolete, `/dashboards` indexes every case study and `/portfolio` shows four since 2026-10-19 |
| 5 | Add writing CTA to `ThinkingPreview` | Obsolete, component deleted |
| 6 | Delete dead components | Done |
| 7 | Delete blog slug stub | Done |
| 8 | Delete `content/writing/` duplicate | Done |
| 9 | Delete orphaned scripts | Done |
| 10 | Delete deprecated fantasy-pros route | Done — removed route + `handleAPIFetch` handler and "FantasyPros API" tab from admin UI |
| 11 | Delete `webScraper.ts` | Done — removed file + import and dead methods from `dataManager.ts` |
| 12 | Remove Cmd+K reference | Done |
| 13 | Wire RSS to `blog.ts` | Done, the feed reads `blog.ts` since 2026-04-02, through `getBlogFeedEntries` as of 2026-11-16 |
| 14 | Index blog posts in search API | Done in PR #580, merged 2026-10-09 |
| 15 | Link FF tier pages from UI | Obsolete, tier pages redirect to the board since 2026-09-24 |
| 16 | Expand investments research | Not started (151 prefetched tickers on 2026-11-02) |
| 17 | Local SEO: finish or remove | Done — removed |
| 18 | Analytics: GA4 or remove | Removed, then GA4 returned as an opt-in on 2026-06-23 |
| 19 | Admin analytics dashboard | Done — removed |
| 20 | Contact form | Decision needed |
