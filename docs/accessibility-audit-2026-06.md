# Accessibility Audit — June 2026

**Standard:** WCAG 2.1 AA (with AAA where practical)
**Scope:** Code-level audit of `src/` (components + App Router routes)
**Method:** Manual code review of the shell, navigation, modals, forms, images, and global styles. No automated scanner (axe/Lighthouse) is wired into the repo yet — see "Recommended follow-ups."

This is the current accessibility reference. The root-level `ACCESSIBILITY_AUDIT.md` is a November 2025 snapshot kept for history only; it describes components that have since been removed (`FloatingNav`, `ModernButton`) and the old monochrome palette, so do not treat it as current.

---

## Summary

The site has strong accessibility foundations already in place:

- `lang="en"` on `<html>` and a working **skip link** to `#main-content` (`src/app/layout.tsx`).
- Real landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) and a single `<h1>` per page (enforced by `e2e/accessibility.spec.ts`).
- `prefers-reduced-motion` is honored globally in CSS (`src/app/globals.css`) **and** per-component via Framer Motion's `useReducedMotion()` in the animated surfaces (`ProjectDetailModal`, `PlayerDetailDrawer`, `CompareModal`, etc.).
- `:focus-visible` rings on all interactive elements; pointer focus is suppressed but keyboard focus is always shown.
- 44px minimum touch targets across nav, controls, and the theme toggle.
- Icon-only buttons carry `aria-label`s (e.g. `ThemeToggle`, mobile menu toggle, modal close buttons).
- Images use descriptive `alt`, with `alt=""` + `aria-hidden` for decorative graphics.
- External `target="_blank"` links consistently use `rel="noopener noreferrer"`.
- Most overlays (`PlayerDetailDrawer`, `EmailDigestDialog`, `ApplicationEditDialog`) implement a full focus trap, `Escape` to close, `role="dialog"` + `aria-modal`, and focus restoration on close.

The audit found a small number of concrete gaps. The high-confidence ones were fixed in this change; the remainder are documented below as follow-ups.

---

## Fixed in this change

### 1. Mobile nav menu kept collapsed links in the tab order — `src/components/StaticHeader.tsx`
The mobile menu stays mounted for its height/opacity transition. When collapsed (`max-h-0 opacity-0`) its links were still reachable by `Tab` and exposed to screen readers, so keyboard users on desktop tabbed into invisible navigation (WCAG 2.4.3 Focus Order, 1.3.2 Meaningful Sequence).
**Fix:** added `inert` and `aria-hidden` on the menu container while closed, removing the collapsed links from both the tab order and the accessibility tree.

### 2. `CompareModal` lacked a focus trap and focus restoration — `src/components/fantasy/CompareModal.tsx`
The compare overlay already had `role="dialog"`, `aria-modal`, `aria-label`, and `Escape` handling, but — unlike its sibling modals — it did not move focus into the dialog, trap `Tab` within it, or restore focus to the trigger on close (WCAG 2.4.3, 2.1.2 No Keyboard Trap / focus management).
**Fix:** mirrored the established `PlayerDetailDrawer` pattern — capture the active element on open, focus the panel, wrap `Tab`/`Shift+Tab` within the dialog, and restore focus on unmount.

### 3. Search filter pills did not announce their active state — `src/components/search/SearchFilters.tsx`
The content-type and category filter pills are toggles styled only by color/background, with no programmatic state, so screen-reader users could not tell which filter was active (WCAG 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value).
**Fix:** added `aria-pressed` reflecting the selected state to both pill groups.

---

## Recommended follow-ups (not changed here)

These are lower-severity or need a product decision, so they're left for a follow-up rather than changed blindly:

- **`WarmCard` clickable semantics (`src/components/ui/WarmCard.tsx`).** The component accepts an `onClick` and renders a `<div role="article">`, which would be keyboard-inaccessible if used as a button. **No current caller passes `onClick`**, so this is latent, not a live defect. If a clickable variant is ever needed, render a real `<button>` (or add `role="button"`, `tabIndex={0}`, and `Enter`/`Space` handlers).
- **"Opens in a new tab" cue for external links.** External links secure the tab with `rel="noopener noreferrer"` but most rely on a visual icon only. Consider a visually-hidden "(opens in a new tab)" string for screen-reader users, matching the pattern already used on the W3C link in `src/app/accessibility/page.tsx`.
- **Manual contrast verification of muted tokens.** `--home-ink-muted` and the `color-mix()`-derived `--home-ink-soft` / `--text-tertiary` are documented as tuned for AA, but should be re-verified with a contrast checker in both light and dark mode, especially for small text.
- **Wire up an automated scanner.** `e2e/accessibility.spec.ts` does hand-rolled checks and its own comment notes "in production, you'd use axe-core." Adding `@axe-core/playwright` to that spec, and/or `eslint-plugin-jsx-a11y`, would catch regressions automatically. Neither is currently installed.

---

## Verification

- `npx tsc --noEmit` — passes
- `npx eslint` on the three changed files — clean
- `npx jest src/components/fantasy src/components/ui/__tests__/WarmCard.test.tsx` — passes
