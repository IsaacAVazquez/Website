# Changelog

All notable changes to this repository are documented here. The format is YYYY-MM-DD with UTC dates.

## 2026-02-18

- Added the missing onboarding docs (`GETTING-STARTED.md`, `API.md`, `PERFORMANCE.md`, `TROUBLESHOOTING.md`) and wired every markdown link to valid destinations.
- Synced the documentation index (`docs/README.md`) with the current set of deep-dive guides.
- General clean up across `docs/` to ensure references to deployment, database, and automation content stay accurate.

## 2026-02-10

- Shipped the portfolio refresh for 2026: new `/projects`, `/consulting`, `/resume`, and `/writing` experiences plus structured data helpers.
- Added fantasy football tooling (RB tiers, draft tracker, sample API responses) and wired the Netlify build hook for scheduled refreshes.

## 2026-01-30

- Migrated the site to Next.js 15 (App Router) with full TypeScript and Tailwind modernization.
- Implemented Lighthouse and Core Web Vitals monitoring and added `next-sitemap` to the build pipeline.
