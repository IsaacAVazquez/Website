---
title: "NBA Pulse"
description: "Markdown snapshot for the live NBA dashboard at /nba."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "ESPN API"
  - "Sports Data"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/nba"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/nba/page.tsx"
  - "src/app/nba/nba-client.tsx"
  - "src/app/nba/nba-state.ts"
  - "src/data/nbaSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# NBA Pulse

## Route

- Public route is `/nba`
- Primary implementation is `src/app/nba/page.tsx` and `src/app/nba/nba-client.tsx`

## What It Is

I built an NBA dashboard that packages conference standings, playoff seeding, play-in pressure, and league-wide stat leaders into one snapshot-driven view.

## Problem

Conference standings, playoff seeding, the play-in picture, and stat leaders rarely live on a single shareable surface.

## Current Surface

- Conference standings and playoff seed context
- Play-in race framing
- Points, rebounds, and assists leaderboards
- Team drilldowns through API-backed detail reads

## Operational Notes

The checked-in data source is `src/data/nbaSnapshot.ts`. The refresh path is `npm run update:nba`.
