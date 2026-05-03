---
title: "AI Dev Tool Ecosystem"
description: "Markdown snapshot for the live AI coding tool directory at /ai-dev-tools."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "AI/ML"
tags:
  - "Next.js"
  - "TypeScript"
  - "AI Tools"
  - "Developer Tools"
  - "Market Research"
featured: true
role: "Product Designer & Developer"
timeline: "2026"
status: "Live"
route: "/ai-dev-tools"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/ai-dev-tools/page.tsx"
  - "src/app/ai-dev-tools/ai-dev-tools-client.tsx"
  - "src/app/ai-dev-tools/ai-dev-tools-data.ts"
  - "src/app/ai-dev-tools/ai-dev-tools-state.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# AI Dev Tool Ecosystem

## Route

- Public route is `/ai-dev-tools`
- Primary implementation is `src/app/ai-dev-tools/page.tsx` and `src/app/ai-dev-tools/ai-dev-tools-client.tsx`

## What It Is

I built a market map for AI coding tools that makes it easier to compare editors, terminal agents, cloud agents, open-source tools, pricing models, and model support without maintaining a spreadsheet.

## Problem

AI coding tools change pricing, model access, and release pace constantly. The useful comparison is not just feature coverage, but cost model, model control, open-source traction, and update velocity.

## Current Surface

- Filterable tool directory across categories, pricing, model support, and source model
- Detail panels with source links and concise tool context
- Deep-linkable filters and selected-tool state
- Curated local data in `ai-dev-tools-data.ts`

## Operational Notes

The route is a curated live project surface. The current implementation reads local TypeScript data instead of depending on a runtime market-data feed.
