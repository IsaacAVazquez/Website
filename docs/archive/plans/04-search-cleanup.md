> [!IMPORTANT]
> Historical reference only. This file captures an older implementation plan and is not a current source of truth by itself. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `API.md`, `PAGES.md`, and `docs/README.md` for current documentation.

# Search Page Design System Cleanup — Implementation Plan

## Context

`src/app/search/page.tsx` uses hardcoded Tailwind `slate-*` color classes instead of the project's CSS custom property design system. This causes the search page to look visually inconsistent in dark mode — the design system inverts CSS variables automatically, but hardcoded `dark:text-slate-300` overrides create potential redundancy or mismatch.

Affected lines: 34, 46–48, 53–57

---

## Replacements

| Old class | New class |
|-----------|-----------|
| `text-slate-700 dark:text-slate-300` | `text-[var(--text-secondary)]` |
| `border-slate-200/70 dark:border-slate-800` | `border-[var(--border-primary)]` |
| `bg-white/60 dark:bg-slate-900/30` | `bg-[var(--surface-elevated)]` |
| `text-slate-900 dark:text-white` | `text-[var(--text-primary)]` |
| `text-slate-600 dark:text-slate-300` | `text-[var(--text-secondary)]` |

---

## Files to Modify

### `src/app/search/page.tsx`
Lines 34, 46–57 — apply all replacements in the table above.

---

## Implementation Steps

1. Read `src/app/search/page.tsx`
2. Apply all 5 class replacements
3. Verify no other `slate-*` classes remain in the file

---

## Verification

1. `/search` in light mode — text and borders render correctly
2. `/search` in dark mode — no visual regression; colors come from CSS variables
3. `grep "slate-" src/app/search/page.tsx` → no results
