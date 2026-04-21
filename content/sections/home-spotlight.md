---
title: "Home Spotlight Section"
description: "Markdown snapshot for the manifesto-style spotlight section on the homepage."
updatedAt: "2026-04-15"
route: "/"
sectionId: "home-spotlight-heading"
sourceOfTruth:
  - "src/components/home/HomePageContent.tsx"
---

> [!IMPORTANT]
> Historical reference only. This section snapshot exists to close markdown coverage for the live homepage, but the current source of truth remains `src/components/home/HomePageContent.tsx` plus the repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Home Spotlight Section

## Purpose

This is the homepage point-of-view section. It states the product philosophy directly and gives the page a stronger editorial center than a generic value-prop block would.

## Current Content

- Kicker: `Where I do my best work`
- Heading centered on a clearer way to make ambitious product work feel usable
- Supporting paragraph focused on legible tradeoffs, honest scope, and decision support
- Supporting visual board with the phrases `Tradeoffs legible.` and `Scope honest.`

## Visual Structure

- Two-column layout on larger screens
- Manifesto copy on the left
- Poster-style board and tags on the right
- Reinforces the `home-section-acid` visual treatment

## Implementation Notes

This section is authored inline in `src/components/home/HomePageContent.tsx`. There is no separate section component for it in the current live implementation.
