# OptimizedImage Fixes — Implementation Plan

## Context

`src/components/ui/OptimizedImage.tsx` has three bugs:

1. **Tailwind dynamic class bug:** Line 140 uses `` `object-${objectFit}` `` — Tailwind's JIT compiler cannot detect dynamic class names from template literals, so `object-cover`, `object-contain`, etc. will be purged from the production CSS bundle. Images will render without the intended fit.

2. **Undefined CSS class:** Lines 93 and 108 use `bg-terminal-border` — this is a legacy class that doesn't exist in the current design system, causing no background color on the loading skeleton and error state.

3. **Cyberpunk overlay divs:** Lines 151–154 add two absolute overlay divs using `from-black/10`, `to-transparent`, and `bg-electric-blue/5` — these are leftovers from a previous design theme that don't match the current clean design system and add unnecessary DOM nodes.

4. **Missing reduced motion:** The Framer Motion fade-in (lines 123–127) doesn't check `prefers-reduced-motion`, inconsistent with the rest of the site.

---

## Files to Modify

### `src/components/ui/OptimizedImage.tsx`

**Fix 1:** Replace dynamic Tailwind class with a lookup map:
```tsx
// Replace line 140:
className={`transition-opacity duration-300 ${fill ? `object-${objectFit}` : ''}`}

// With:
const objectFitClass: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};
// ...
className={`transition-opacity duration-300 ${fill ? (objectFitClass[objectFit] ?? 'object-cover') : ''}`}
```

**Fix 2:** Replace `bg-terminal-border` (lines 93, 108) with `bg-[var(--neutral-200)]`

**Fix 3:** Remove the overlay section (lines 150–154):
```tsx
{/* Remove entirely: */}
<div className="absolute inset-0 pointer-events-none">
  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-50" />
  <div className="absolute inset-0 bg-electric-blue/5 mix-blend-overlay" />
</div>
```

**Fix 4:** Add `useReducedMotion` to skip animation:
```tsx
import { motion, useReducedMotion } from 'framer-motion';
// ...
const shouldReduceMotion = useReducedMotion();
// ...
<motion.div
  initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
  animate={{ opacity: isLoaded ? 1 : 0 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
>
```

---

## Implementation Steps

1. Read the full `OptimizedImage.tsx` file
2. Add `objectFitClass` lookup map before the return statement
3. Update line 140 to use the lookup map
4. Replace both `bg-terminal-border` instances with `bg-[var(--neutral-200)]`
5. Remove the 5-line overlay div block
6. Import `useReducedMotion` from framer-motion; add the hook call; pass to motion.div

---

## Verification

1. `npm run build` — no CSS purge warnings
2. Set `objectFit="contain"` on an `<OptimizedImage>` — image renders with `object-contain` visible in dev tools
3. Error state shows `bg-[var(--neutral-200)]` background, not transparent
4. Loading skeleton shows `bg-[var(--neutral-200)]`, not transparent
5. OS reduced motion enabled → image fades in without animation
6. Dark mode: skeleton background appears correctly
