---
title: "Investment Analytics Platform"
description: "Markdown snapshot for the live investment research workspace at /investments."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "Fintech"
  - "Investment Research"
  - "Portfolio Tracking"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2025"
status: "Live"
route: "/investments"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/investments/page.tsx"
  - "src/app/investments/investments-client.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Investment Analytics Platform

## Route

- Public route: `/investments`
- Primary implementation: `src/app/investments/page.tsx` and `src/app/investments/investments-client.tsx`

## What It Is

I built an investment research workspace that keeps company snapshots, valuation review, financial statements, price history, and browser-saved portfolio tracking in one place.

## Problem

Retail investing workflows usually sprawl across broker apps, spreadsheets, and finance sites. That makes even basic comparison work slower than it should be and hides the tradeoffs behind too many tabs.

## Current Surface

- Curated company snapshots backed by checked-in investment data
- Portfolio tracking saved in the browser
- Side-by-side stock comparison across valuation, growth, profitability, and analyst signals
- Section-level research views for price history, DCF, fundamentals, financial statements, industry context, and news

## Operational Notes

The public data refresh path is `.venv/bin/python3 scripts/fetch_investments_data.py` followed by `tsx scripts/buildInvestmentsSnapshots.ts`, exposed through `npm run update:investments`.
