---
title: "NFL Pulse"
description: "Markdown snapshot for the live NFL dashboard at /nfl."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "NFLverse"
  - "Sports Data"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/nfl"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/nfl/page.tsx"
  - "src/app/nfl/nfl-client.tsx"
  - "src/app/nfl/nfl-state.ts"
  - "src/data/nflSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# NFL Pulse

## Route

- Public route is `/nfl`
- Primary implementation is `src/app/nfl/page.tsx` and `src/app/nfl/nfl-client.tsx`

## What It Is

I built an NFL dashboard that packages conference standings, division context, playoff pressure, and stat leaders into one snapshot-driven surface.

## Problem

NFL standings, playoff seeding, point differential, and player leaders usually live in separate places, which makes the season picture harder to scan quickly.

## Current Surface

- Conference seeding and division race views
- Playoff cutoff context and point differential
- Passing, rushing, receiving, and sack leaders
- Deep-linkable team and view state

## Operational Notes

The checked-in data source is `src/data/nflSnapshot.ts`. The refresh path is `npm run update:nfl`.
