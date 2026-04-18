---
title: "La Liga Pulse"
description: "Markdown snapshot for the live La Liga dashboard at /la-liga."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "La Liga"
  - "Sports Data"
  - "Dashboard"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/la-liga"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/la-liga/page.tsx"
  - "src/app/la-liga/la-liga-client.tsx"
  - "src/data/laLigaSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# La Liga Pulse

## Route

- Public route: `/la-liga`
- Primary implementation: `src/app/la-liga/page.tsx` and `src/app/la-liga/la-liga-client.tsx`

## What It Is

I built a league dashboard for title-race pressure, European qualification, relegation context, and scorer and assist leaderboards in one view.

## Problem

League tables rarely combine season pressure, upcoming context, and leaderboard information in the same product surface. Fans usually need several tabs to piece the season state together.

## Current Surface

- Snapshot-backed standings and table context
- Title race, European qualification, and relegation framing
- Leaderboards for scorers and assists
- Deep-linkable route state for views and team drilldowns

## Operational Notes

The checked-in data source is `src/data/laLigaSnapshot.ts`. The full refresh path is `npm run update:la-liga`.
