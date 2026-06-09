---
title: "Decision Lab"
description: "Markdown snapshot for the live product-bet triage tool at /decision-lab."
publishedAt: "2026-05-03"
updatedAt: "2026-05-03"
category: "Product Strategy"
tags:
  - "Next.js"
  - "TypeScript"
  - "Decision Support"
  - "Product Strategy"
  - "Deep Links"
featured: true
role: "Product Builder & Designer"
timeline: "2026"
status: "Live"
route: "/decision-lab"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/decision-lab/page.tsx"
  - "src/app/decision-lab/decision-lab-client.tsx"
  - "src/app/decision-lab/decision-lab-data.ts"
  - "src/app/decision-lab/decision-lab-state.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Decision Lab

## Route

- Public route is `/decision-lab`
- Primary implementation is `src/app/decision-lab/page.tsx` and `src/app/decision-lab/decision-lab-client.tsx`

## What It Is

I built a product-bet triage tool that keeps impact, confidence, effort, and reversibility separate before forcing a plain ship, test, or hold recommendation.

## Problem

Product discussions often collapse multiple tradeoffs into one vague conviction. That makes it easier to argue confidently than to reason clearly.

## Current Surface

- Preset product decisions with adjustable scoring inputs
- Deterministic recommendation model
- Deep-linkable state for sharing a specific decision setup
- Lightweight decision explanation tied to the visible inputs

## Operational Notes

The scoring model and presets live in `src/app/decision-lab/decision-lab-data.ts`. URL normalization lives in `src/app/decision-lab/decision-lab-state.ts`.
