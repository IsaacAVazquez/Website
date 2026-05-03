---
title: "GitHub Trending Pulse"
description: "Markdown snapshot for the live GitHub trend dashboard at /github-trending-pulse."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "GitHub API"
  - "Open Source"
  - "Snapshot Pipeline"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/github-trending-pulse"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/github-trending-pulse/page.tsx"
  - "src/app/github-trending-pulse/github-trending-client.tsx"
  - "src/app/github-trending-pulse/github-trending-state.ts"
  - "src/data/githubTrendingSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# GitHub Trending Pulse

## Route

- Public route is `/github-trending-pulse`
- Primary implementation is `src/app/github-trending-pulse/page.tsx` and `src/app/github-trending-pulse/github-trending-client.tsx`

## What It Is

I built a developer-trend dashboard that turns GitHub search data into a daily snapshot across languages, topics, and repository-level star movement.

## Problem

GitHub discovery is noisy when popular projects, freshly active repositories, and topic-specific momentum all sit in different search paths.

## Current Surface

- Segment-level trend views across languages and topics
- Repository detail with weekly star movement
- Snapshot-backed data for predictable rendering
- Deep-linkable state for selected segments and repositories

## Operational Notes

The checked-in data source is `src/data/githubTrendingSnapshot.ts`. The refresh path is `npm run update:github-trending`.
