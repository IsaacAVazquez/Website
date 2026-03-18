> [!IMPORTANT]
> Historical reference only. This file captures an older implementation plan and is not a current source of truth by itself. Use `AGENT.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md` for current documentation.

# Navigation Fixes — Implementation Plan

## Context

The Resume page at `/resume` is fully built and accessible, but its navigation link is **commented out** in `src/constants/navlinks.tsx`. This is a confusing inconsistency — the page exists but users can't reach it from the nav. The Writing section at `/writing` (16 posts) also has no nav link. These are quick wins.

---

## Design

**Change 1:** Uncomment the Resume link in `navlinks.tsx`
**Change 2:** Add a Writing link after "About" and before "Work"

Final nav order:
1. Home `/`
2. About `/about`
3. Work `/portfolio`
4. Writing `/writing` ← new
5. Resume `/resume` ← re-enabled
6. Contact `/contact`

---

## Files to Modify

### `src/constants/navlinks.tsx`
- Remove the `/* ... */` comment wrapping the Resume link
- Add Writing link: `{ href: "/writing", label: "Writing", icon: IconPencil }` (icon already imported)

---

## Implementation Steps

1. Read `navlinks.tsx` (current state: Resume commented out, IconPencil imported but unused)
2. Uncomment Resume entry
3. Add Writing entry between Work and Resume
4. Verify icon imports are correct (IconPencil already imported)

---

## Verification

1. Navigation renders 6 links: Home, About, Work, Writing, Resume, Contact
2. Writing link navigates to `/writing`
3. Resume link navigates to `/resume`
4. Mobile nav works (links are touch-accessible)
5. Active state highlight works on each new link
