---
title: "Formula 1 Pulse"
description: "Markdown snapshot for the live Formula 1 dashboard at /formula-1."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "OpenF1 API"
  - "Formula 1"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/formula-1"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/formula-1/page.tsx"
  - "src/app/formula-1/formula-1-client.tsx"
  - "src/app/formula-1/formula-1-state.ts"
  - "src/data/formula1Snapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Formula 1 Pulse

## Route

- Public route is `/formula-1`
- Primary implementation is `src/app/formula-1/page.tsx` and `src/app/formula-1/formula-1-client.tsx`

## What It Is

I built a Formula 1 dashboard that compresses the next Grand Prix, championship tables, and race-by-race context into a single snapshot-driven surface.

## Problem

F1 standings, driver form, and race calendars are typically fragmented across separate sites with no unified deep-linkable view.

## Current Surface

- Next Grand Prix context
- Driver and constructor standings
- Race-by-race snapshot detail
- Deep-linkable driver and meeting state

## Operational Notes

The checked-in data source is `src/data/formula1Snapshot.ts`. The refresh path is `npm run update:formula-1`.
