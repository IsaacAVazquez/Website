---
title: "Home Hero"
description: "Markdown snapshot for the live homepage hero section."
updatedAt: "2026-04-15"
route: "/"
sectionId: "home-hero-heading"
sourceOfTruth:
  - "src/components/home/HomePageContent.tsx"
---

> [!IMPORTANT]
> Historical reference only. This section snapshot exists to close markdown coverage for the live homepage, but the current source of truth remains `src/components/home/HomePageContent.tsx` plus the repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Home Hero

## Purpose

The hero introduces the site as a portfolio-first surface that also includes writing and live tools. It sets the main point of view immediately and keeps the primary CTA visible in the first mobile viewport.

## Current Content

- Wordmark: `ISAAC VAZQUEZ`
- Kicker: `Product work, writing, and live tools`
- Heading: `I build products that make hard problems easier to act on.`
- Supporting copy focused on product judgment, AI workflows, and decision-support tooling
- Primary actions: `View projects` and `About`

## Visual Structure

- Left column for copy and actions
- Right column for the homepage headshot image
- Uses the `home` editorial classes inside `src/components/home/HomePageContent.tsx`

## Implementation Notes

This is the live homepage hero. Older hero references in `content/components/hero.md` are historical and should not be treated as current implementation guidance.
