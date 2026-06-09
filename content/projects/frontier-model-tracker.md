---
title: "Frontier Model Tracker"
description: "Markdown snapshot for the live frontier model comparison dashboard at /frontier-models."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "AI/ML"
tags:
  - "Next.js"
  - "TypeScript"
  - "AI Models"
  - "D3.js"
  - "Pricing"
featured: true
role: "Product Designer & Developer"
timeline: "2026"
status: "Live"
route: "/frontier-models"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/frontier-models/page.tsx"
  - "src/app/frontier-models/frontier-models-client.tsx"
  - "src/app/frontier-models/frontier-models-state.ts"
  - "src/data/frontierModelsSnapshot.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Frontier Model Tracker

## Route

- Public route is `/frontier-models`
- Primary implementation is `src/app/frontier-models/page.tsx` and `src/app/frontier-models/frontier-models-client.tsx`

## What It Is

I built a side-by-side reference for frontier language models that surfaces the spec details product teams actually argue about, including context window, blended price, modality coverage, and reasoning support.

## Problem

Provider docs read like marketing pages. Comparing several frontier models usually takes a stack of tabs and a spreadsheet before the tradeoffs become legible.

## Current Surface

- Curated model comparison table
- Cost context charting for model economics
- Deep-linkable provider, capability, and selected-model state
- Checked-in model snapshot data

## Operational Notes

The checked-in data source is `src/data/frontierModelsSnapshot.ts`. The refresh path is `npm run update:frontier-models`.
