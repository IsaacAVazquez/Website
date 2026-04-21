---
title: "Home Projects Section"
description: "Markdown snapshot for the selected-work section on the homepage."
updatedAt: "2026-04-15"
route: "/"
sectionId: "home-projects-heading"
sourceOfTruth:
  - "src/components/home/HomePageContent.tsx"
  - "src/constants/caseStudies.ts"
---

> [!IMPORTANT]
> Historical reference only. This section snapshot exists to close markdown coverage for the live homepage, but the current source of truth remains `src/components/home/HomePageContent.tsx` plus the repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Home Projects Section

## Purpose

This section turns the featured project set into a fast portfolio scan. It needs to surface what the project is, why it matters, and the role and timeline without forcing another click first.

## Current Content

- Kicker: `Selected work`
- Heading: `Product surfaces that show how I think in practice.`
- Supporting copy focused on fintech tools, research workflows, and data-heavy products
- Project cards generated from `getHomepageFeaturedCaseStudies()`

## Card Requirements

- Each card shows impact first
- The default scan state must expose the problem space
- Role and timeline stay visible in the card footer
- Card links resolve to either the live route or a portfolio detail path

## Implementation Notes

The card renderer for this section lives inside `src/components/home/HomePageContent.tsx`, not in the older `FeaturedWorkSection.tsx` component.
