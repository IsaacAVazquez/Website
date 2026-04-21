---
title: "Interchange IQ"
description: "Markdown snapshot for the live payment fee analyzer at /fintech-tools/interchange-iq."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
category: "Analytics & Data"
tags:
  - "Next.js"
  - "TypeScript"
  - "Fintech"
  - "Payments"
  - "Pricing"
featured: true
role: "Builder"
timeline: "2025"
status: "Live"
route: "/fintech-tools/interchange-iq"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/fintech-tools/interchange-iq/page.tsx"
  - "src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Interchange IQ

## Route

- Public route: `/fintech-tools/interchange-iq`
- Primary implementation: `src/app/fintech-tools/interchange-iq/page.tsx` and `src/app/fintech-tools/interchange-iq/interchange-iq-client.tsx`

## What It Is

I built a fee analyzer that models real payment processing costs across major processors using published interchange data, live calculator inputs, and a breakeven view.

## Problem

Processor pricing is deliberately opaque. Merchants and fintech builders struggle to compare flat-rate and interchange-plus pricing without manually decoding rate tables and spreadsheet assumptions.

## Current Surface

- Processor comparisons across seven payment providers
- Live fee modeling driven by volume, average ticket, and card-mix inputs
- Breakeven logic for comparing flat-rate and interchange-plus structures
- A browser-native interface built for quick scenario testing

## Operational Notes

The route is a client-side calculator surface. The main source of truth is the route implementation and supporting pricing logic in the same folder.
