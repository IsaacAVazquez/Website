---
title: "MLB Pulse"
description: "Markdown snapshot for the live Major League Baseball dashboard at /mlb."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "MLB Stats API"
  - "Sports Data"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/mlb"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/mlb/page.tsx"
  - "src/app/mlb/mlb-client.tsx"
  - "src/app/mlb/mlb-state.ts"
  - "src/data/mlbSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# MLB Pulse

## Route

- Public route is `/mlb`
- Primary implementation is `src/app/mlb/page.tsx` and `src/app/mlb/mlb-client.tsx`

## What It Is

I built an MLB dashboard that combines division standings, league splits, wild card pressure, and league-wide stat leaders into one snapshot-driven surface.

## Problem

League standings, wild card context, and stat leaders are usually split across separate tabs with no unified view of what actually matters that week.

## Current Surface

- Division standings and league splits
- Wild card race context
- Recent results and team drilldowns
- League-wide hitting and pitching leaders

## Operational Notes

The checked-in data source is `src/data/mlbSnapshot.ts`. The refresh path is `npm run update:mlb`.
