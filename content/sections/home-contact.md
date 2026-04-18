---
title: "Home Contact Section"
description: "Markdown snapshot for the closing contact section on the homepage."
updatedAt: "2026-04-15"
route: "/"
sectionId: "home-contact-heading"
sourceOfTruth:
  - "src/components/home/HomePageContent.tsx"
---

> [!IMPORTANT]
> Historical reference only. This section snapshot exists to close markdown coverage for the live homepage, but the current source of truth remains `src/components/home/HomePageContent.tsx` plus the repo docs in `AGENTS.md`, `CLAUDE.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md`.

# Home Contact Section

## Purpose

This section closes the homepage with a direct invitation to connect. It needs to feel concise, specific, and easy to act on without stacking too many choices.

## Current Content

- Kicker: `Contact`
- Heading: `If you're building something that needs judgment and follow-through, I'd like to hear about it.`
- Supporting copy focused on product, analytics, fintech, and workflow tooling
- Three direct actions: email, GitHub, and LinkedIn

## Interaction Notes

- All actions are rendered as button-like links
- External links open in a new tab where appropriate
- The section sits inside the homepage closing panel rather than reusing the standalone `/contact` route content

## Implementation Notes

This is the live homepage contact surface. Older references in `content/components/footer.md` and `content/contact.md` are historical only.
