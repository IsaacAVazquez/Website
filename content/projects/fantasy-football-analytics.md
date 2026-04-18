---
title: "Fantasy Football Analytics Platform"
description: "Markdown snapshot for the live fantasy football rankings and draft workflow at /fantasy-football."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "Fantasy Football"
  - "Rankings"
  - "Draft Tools"
featured: true
role: "Solo Builder"
timeline: "2024-2025"
status: "Live"
route: "/fantasy-football"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/fantasy-football/page.tsx"
  - "src/app/fantasy-football/fantasy-football-client.tsx"
  - "src/app/fantasy-football/draft-tracker/page.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Fantasy Football Analytics Platform

## Route

- Public route: `/fantasy-football`
- Related route: `/fantasy-football/draft-tracker`
- Primary implementation: `src/app/fantasy-football/page.tsx` and `src/app/fantasy-football/fantasy-football-client.tsx`

## What It Is

I built a fantasy football platform that combines published rankings, freshness metadata, scoring controls, and a linked draft tracker into one weekly workflow.

## Problem

Fantasy players usually piece together rankings, tiers, and draft context from scattered sources. That makes it harder to move from raw lists to actual lineup, waiver, and draft decisions.

## Current Surface

- Snapshot-backed overall and position-specific rankings
- PPR, Half PPR, and Standard scoring toggles
- Published freshness metadata for the source board and local snapshot
- Manual draft tracker that reads from the same published data

## Operational Notes

The main refresh path is `npm run update:fantasy`, which generates the committed fantasy ranking artifacts used by the public site.
