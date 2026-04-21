---
title: "News Pulse Dashboard"
description: "Markdown snapshot for the live media coverage dashboard at /news-pulse."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "RSS"
  - "Media Analysis"
  - "Dashboard"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/news-pulse"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/news-pulse/page.tsx"
  - "src/app/news-pulse/news-pulse-client.tsx"
  - "src/app/api/news-pulse/route.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# News Pulse Dashboard

## Route

- Public route: `/news-pulse`
- Primary implementation: `src/app/news-pulse/page.tsx` and `src/app/news-pulse/news-pulse-client.tsx`

## What It Is

I built a media analytics dashboard that turns RSS feeds into a faster comparison surface for coverage patterns, topic frequency, and tone.

## Problem

Following how multiple outlets frame the same story usually means scanning feeds manually. There is rarely a lightweight way to compare coverage patterns without wiring up a larger media-monitoring stack.

## Current Surface

- Aggregation across major outlet RSS feeds
- Coverage and topic summaries surfaced in one dashboard
- Lightweight sentiment and framing analysis without external NLP services
- API-backed route state through `/api/news-pulse`

## Operational Notes

The live route depends on the route client plus the API handler. The historical markdown file exists only as reference coverage for the project inventory.
