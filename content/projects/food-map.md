---
title: "Food Map"
description: "Markdown snapshot for the live Austin restaurant shortlist at /food-map."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Austin"
  - "Food Map"
  - "Editorial UX"
featured: true
role: "Product Builder & Designer"
timeline: "2026"
status: "Live"
route: "/food-map"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/food-map/page.tsx"
  - "src/app/food-map/food-map-client.tsx"
  - "src/app/food-map/food-map-data.ts"
  - "src/app/food-map/food-map-state.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Food Map

## Route

- Public route is `/food-map`
- Primary implementation is `src/app/food-map/page.tsx` and `src/app/food-map/food-map-client.tsx`

## What It Is

I built a curated Austin food map that turns my actual go-to restaurant shortlist into a single deep-linkable product surface.

## Problem

Most food guides are either too long to be useful or too generic to be honest. A friend asking where to eat usually wants a short, opinionated answer, not a list of forty options.

## Current Surface

- Curated restaurant stops across neighborhoods, cuisines, and meal types
- Filter state that can be shared as a link
- Selected-pick detail for quick recommendations
- Local TypeScript data for the current shortlist

## Operational Notes

The route uses curated local data in `src/app/food-map/food-map-data.ts`. The state helpers keep route filters canonical and shareable.
