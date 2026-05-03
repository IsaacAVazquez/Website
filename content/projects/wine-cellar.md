---
title: "Wine Cellar"
description: "Markdown snapshot for the live personal wine review app at /wine-cellar."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Local Persistence"
  - "Wine Journal"
  - "Product UX"
featured: true
role: "Product Builder & Designer"
timeline: "2026"
status: "Live"
route: "/wine-cellar"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/wine-cellar/page.tsx"
  - "src/app/wine-cellar/wine-cellar-client.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Wine Cellar

## Route

- Public route is `/wine-cellar`
- Primary implementation is `src/app/wine-cellar/page.tsx` and `src/app/wine-cellar/wine-cellar-client.tsx`

## What It Is

I built a personal wine reviewing app for logging tastings, rating bottles, and tracking the wines I have poured.

## Problem

Most wine apps lean heavily on social or commerce features when the core need is a private journaling surface for tasting notes.

## Current Surface

- Browser-persisted wine log
- Bottle ratings and tasting notes
- Lightweight cellar summary
- Local-first interaction model with no account requirement

## Operational Notes

The implementation is intentionally local-first. The route client owns the browser persistence and product workflow.
