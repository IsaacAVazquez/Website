---
title: "Budget Planner"
description: "Markdown snapshot for the live personal budgeting workspace at /fintech-tools/budget-planner."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Fintech"
  - "Budgeting"
  - "Personal Finance"
featured: true
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/fintech-tools/budget-planner"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/fintech-tools/budget-planner/page.tsx"
  - "src/app/fintech-tools/budget-planner/budget-planner-client.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Budget Planner

## Route

- Public route: `/fintech-tools/budget-planner`
- Primary implementation: `src/app/fintech-tools/budget-planner/page.tsx` and `src/app/fintech-tools/budget-planner/budget-planner-client.tsx`

## What It Is

I designed a monthly budgeting workspace that keeps planning, savings targets, category budgets, and manual expense tracking in one lightweight flow.

## Problem

Many budgeting tools either push too hard on bank-account syncing or make simple monthly planning feel noisy and rigid. That gets in the way when the job is just to plan clearly and keep using the tool.

## Current Surface

- Monthly income and savings-target planning
- Category-based budget setup
- Manual expense tracking with browser persistence
- Ledger-style layout built for repeat use instead of one-time setup

## Operational Notes

The route is a self-contained client-side tool. The live implementation is route-backed and does not depend on the older markdown content system.
