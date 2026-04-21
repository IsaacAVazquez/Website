---
title: "Polling Aggregator"
description: "Markdown snapshot for the live political polling dashboard at /polling-aggregator."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "Polling"
  - "Politics"
  - "Dashboard"
featured: false
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/polling-aggregator"
sourceOfTruth:
  - "src/app/polling-aggregator/page.tsx"
  - "src/app/polling-aggregator/polling-aggregator-client.tsx"
  - "src/data/pollingSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Polling Aggregator

## Route

- Public route: `/polling-aggregator`
- Primary implementation: `src/app/polling-aggregator/page.tsx` and `src/app/polling-aggregator/polling-aggregator-client.tsx`

## What It Is

I built a political polling dashboard that tracks presidential approval, the generic congressional ballot, and key 2026 Senate and governor races from a committed snapshot.

## Problem

Polling data is easy to find in pieces and harder to compare in one coherent surface. The friction is not just the data itself, but the work of moving between races, time frames, and average views.

## Current Surface

- Snapshot-backed polling averages
- View switching across approval, generic ballot, Senate, and governor races
- Deep-linkable route state for specific race views
- Public dashboard backed by `src/data/pollingSnapshot.ts`

## Operational Notes

This route is live even though it is not currently represented in `src/constants/caseStudies.ts`. The markdown snapshot closes that documentation gap without changing portfolio ordering.
