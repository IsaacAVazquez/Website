---
title: "PGA Tour Pulse"
description: "Markdown snapshot for the live PGA Tour dashboard at /golf."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "PGA Tour"
  - "Sports Data"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/golf"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/golf/page.tsx"
  - "src/app/golf/golf-client.tsx"
  - "src/app/golf/golf-state.ts"
  - "src/data/golfSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# PGA Tour Pulse

## Route

- Public route is `/golf`
- Primary implementation is `src/app/golf/page.tsx` and `src/app/golf/golf-client.tsx`

## What It Is

I built a PGA Tour tournament dashboard that turns a checked-in tournament snapshot into a clean, deep-linkable product surface.

## Problem

Most tour leaderboards make it hard to compare round-by-round movement, cut-line pressure, and player form on a single screen.

## Current Surface

- Tournament leaderboard scanning
- Player drilldowns
- Round-by-round movement
- Weekend cut-line and tournament context

## Operational Notes

The checked-in data source is `src/data/golfSnapshot.ts`. The route also exposes summary and player API handlers for focused data reads.
