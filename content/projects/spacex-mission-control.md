---
title: "SpaceX Mission Control"
description: "Markdown snapshot for the live SpaceX launch dashboard at /spacex-mission-control."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "SpaceX"
  - "REST APIs"
  - "Dashboard"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/spacex-mission-control"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/spacex-mission-control/page.tsx"
  - "src/app/spacex-mission-control/spacex-mission-control-client.tsx"
  - "src/app/api/spacex/summary/route.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# SpaceX Mission Control

## Route

- Public route: `/spacex-mission-control`
- Primary implementation: `src/app/spacex-mission-control/page.tsx` and `src/app/spacex-mission-control/spacex-mission-control-client.tsx`

## What It Is

I designed a mission-control-style launch board that makes the next launch, recent missions, and deeper mission detail easier to browse.

## Problem

Public space-launch information is often fragmented across plain tables, isolated articles, and inconsistent detail pages. That makes a simple browse-and-understand workflow harder than it should be.

## Current Surface

- A next-launch hero and mission summary
- Upcoming and past mission browsing in one route
- Deep-linked mission detail with relationship-aware context
- Supporting SpaceX API routes for summary and launch detail

## Operational Notes

The public route depends on the client shell plus `/api/spacex/*` handlers. The markdown snapshot exists only to close the historical content gap.
