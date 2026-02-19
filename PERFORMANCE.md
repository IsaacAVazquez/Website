# Performance Playbook

This document consolidates the most important performance optimizations that power **isaacavazquez.com**. Detailed metrics and experiments live in `PERFORMANCE_REPORT.md` and `PERFORMANCE-SEO.md`; this file gives a concise field guide.

## Rendering Strategy

- **Static Generation + ISR**: Core marketing pages (`/`, `/about`, `/consulting`, `/projects`, etc.) are pre-rendered. Data-heavy views (fantasy tiers, investments) opt into incremental re-validation so fresh data is served without blocking the build.
- **Streaming + Suspense**: Expensive components (project grids, FAQ blocks) stream once the data layer resolves.
- **Route Grouping**: The App Router’s nested layouts reduce redundant work and allow route-specific metadata.

## Asset Optimizations

- **Fonts**: Only the required variable fonts are loaded. Preload tags are added in `src/app/layout.tsx` and `next/font` handles subsetting.
- **Images**: `next/image` serves responsive WebP with blur-up placeholders. Hero imagery and logos live in `/public/images`.
- **Code Splitting**: Feature-specific bundles (fantasy tools, resume builder) are dynamically imported so marketing pages stay light.

## Runtime Monitoring

- **Web Vitals**: `src/lib/web-vitals.ts` (see `PERFORMANCE_REPORT.md`) captures CLS/LCP/INP and feeds Netlify analytics.
- **Custom Logging**: API routes (see `API.md`) log response times for the fantasy data pipeline. Slow paths are flagged in the server console during builds.

## Testing Checklist

- Run `npm run build && npm run start` locally and audit with Lighthouse (Chrome DevTools).
- Use `npm run test:e2e` to ensure lazy-loaded routes render as expected.
- Verify `next-sitemap` output plus the critical CSS budgets listed in `PERFORMANCE_REPORT.md`.

## SEO + Performance Handshake

Page structure, metadata, and FAQ schema (see `src/components/StructuredData.tsx`) were tuned during the work captured in `PERFORMANCE-SEO.md`. Keeping Core Web Vitals green protects rankings for the product case studies and long-form writing.

For deeper dives, open:
- `PERFORMANCE_REPORT.md` – metrics, budgets, and regression tracking.
- `PERFORMANCE-SEO.md` – Lighthouse, crawl budget, and structured data improvements.
