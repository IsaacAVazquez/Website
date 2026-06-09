---
title: "Pulse Dashboards"
description: "Markdown snapshot for the portfolio case study covering the Pulse dashboard family."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "Dashboard UX"
  - "Snapshot Pipeline"
  - "Sports Data"
featured: true
role: "Product Designer, Full-Stack Developer, and Data UX Builder"
timeline: "2026"
status: "Live"
route: "/portfolio/pulse-dashboards"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/portfolio/[slug]/page.tsx"
  - "src/app/news-pulse/page.tsx"
  - "src/app/github-trending-pulse/page.tsx"
  - "src/app/premier-league/page.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Pulse Dashboards

## Route

- Portfolio route is `/portfolio/pulse-dashboards`
- Primary implementation is `src/constants/caseStudies.ts` rendered through `src/app/portfolio/[slug]/page.tsx`

## What It Is

I designed and shipped a family of live dashboards that turn fragmented sports, media, developer, and political data into fast, deep-linkable product surfaces.

## Problem

Most live data products answer only one slice of the question. A standings table shows rank, a schedule shows timing, and a leaderboard shows leaders, but the user still has to assemble the actual state by hand.

## Current Surface

- Shared dashboard interaction patterns across sports, news, developer, and polling routes
- Deep-linkable state for league, team, segment, and comparison views
- Snapshot or lightweight live fetch paths chosen by domain
- Editorial framing that leads with pressure, movement, and likely next questions

## Operational Notes

This is an umbrella portfolio case study. The individual live surfaces remain implemented in their own route folders and data pipelines.
