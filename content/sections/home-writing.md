---
title: "Home Writing Section"
description: "Markdown snapshot for the proof-of-work writing section on the homepage."
updatedAt: "2026-04-15"
route: "/"
sectionId: "home-writing-heading"
sourceOfTruth:
  - "src/components/home/HomePageContent.tsx"
  - "src/lib/blog.ts"
---

> [!IMPORTANT]
> Historical reference only. This section snapshot exists to close markdown coverage for the live homepage, but the current source of truth remains `src/components/home/HomePageContent.tsx` plus the repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Home Writing Section

## Purpose

This section shows writing as proof of work rather than as a generic blog roll. It is meant to surface how product judgment and AI workflow thinking show up in long-form form.

## Current Content

- Kicker: `Proof of work`
- Heading focused on PM, AI workflows, and fintech tools
- Supporting copy that frames the selected posts as the best first read
- Cards generated from `getHomepageProofOfWorkBlogPostPreviews()`

## Card Requirements

- Category pill stays visible
- Published date and reading time remain easy to scan
- Excerpt needs to carry the argument, not generic filler
- Each card links directly to `/writing/[slug]`

## Implementation Notes

This is the live writing preview for the homepage. It is separate from the older `WritingPreview.tsx`, which is not the current homepage path.
