---
title: "Museum Log"
description: "Markdown snapshot for the live museum tracking app at /museum-log."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Local-First"
  - "Museum Tracking"
  - "Editorial UX"
featured: true
role: "Product Builder & Designer"
timeline: "2026"
status: "Live"
route: "/museum-log"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/museum-log/page.tsx"
  - "src/app/museum-log/museum-log-client.tsx"
  - "src/app/museum-log/museum-log-state.ts"
  - "src/data/museumSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Museum Log

## Route

- Public route is `/museum-log`
- Primary implementation is `src/app/museum-log/page.tsx` and `src/app/museum-log/museum-log-client.tsx`

## What It Is

I built a Letterboxd-style tracker for museums where users browse a curated catalog, save spots to a watchlist, and log visits with personal ratings.

## Problem

There is no equivalent of Letterboxd for museums, so visit notes, watchlists, and exhibit memories often live across spreadsheets, photo albums, bookmarks, and group chats.

## Current Surface

- Curated museum catalog backed by checked-in snapshot data
- Local watchlist and visit logging behavior
- Personal rating and review affordances
- Deep-linkable browse and detail state

## Operational Notes

The checked-in catalog source is `src/data/museumSnapshot.ts`. Local interaction state is owned by the route client and helpers.
