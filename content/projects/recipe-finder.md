---
title: "Recipe Finder"
description: "Markdown snapshot for the live pantry-aware recipe tool at /recipe-finder."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Recipe Search"
  - "Pantry"
  - "Local Persistence"
featured: true
role: "Product Builder & Designer"
timeline: "2026"
status: "Live"
route: "/recipe-finder"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/recipe-finder/page.tsx"
  - "src/app/recipe-finder/recipe-finder-client.tsx"
  - "src/data/recipesSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Recipe Finder

## Route

- Public route is `/recipe-finder`
- Primary implementation is `src/app/recipe-finder/page.tsx` and `src/app/recipe-finder/recipe-finder-client.tsx`

## What It Is

I built an ingredient-driven recipe aggregator that ranks recipes by how many of your on-hand ingredients they cover.

## Problem

Most recipe sites optimize for browsing inspiration, not for actually cooking with what is already in your pantry.

## Current Surface

- Pantry-aware recipe ranking
- Curated recipe corpus backed by checked-in snapshot data
- Browser-persisted pantry input
- Client-side scoring for fast weeknight filtering

## Operational Notes

The checked-in recipe source is `src/data/recipesSnapshot.ts`. Pantry state is browser-local.
