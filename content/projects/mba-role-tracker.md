---
title: "Job Search"
description: "Markdown snapshot for the live recruiting-intelligence dashboard at /mba-internship-notifications."
publishedAt: "2026-04-15"
updatedAt: "2026-04-17"
category: "Full-Stack Development"
tags:
  - "Next.js"
  - "TypeScript"
  - "Recruiting"
  - "Job Boards"
  - "MBA"
featured: false
role: "Full-Stack Developer & Designer"
timeline: "2026"
status: "Live"
route: "/mba-internship-notifications"
sourceOfTruth:
  - "src/constants/caseStudies.ts"
  - "src/app/mba-internship-notifications/page.tsx"
  - "src/app/mba-internship-notifications/mba-jobs-client.tsx"
  - "src/app/api/mba-jobs/route.ts"
---

> [!IMPORTANT]
> Historical reference only. This markdown snapshot exists to close content coverage for a live route-backed project, but the current source of truth remains the code and repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Job Search

## Route

- Public route: `/mba-internship-notifications`
- Primary implementation: `src/app/mba-internship-notifications/page.tsx` and `src/app/mba-internship-notifications/mba-jobs-client.tsx`

## What It Is

I built a recruiting-intelligence dashboard that tracks public tech-company job boards for MBA internships and full-time business roles in one place.

## Problem

MBA recruiting is fragmented across Greenhouse, Ashby, Lever, and manual company career pages. That turns simple monitoring into repetitive tab work and makes it easy to miss fresh openings.

## Current Surface

- Company coverage across public job boards and manual fallbacks
- Filters for role type, role family, search, and sort state
- Alerts and digest-oriented workflow framing
- API-backed data delivery through `/api/mba-jobs`

## Operational Notes

This route is a live portfolio tool surfaced through the projects section. The route client and API handler are the implementation source of truth.
