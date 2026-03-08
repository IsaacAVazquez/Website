# Styling System — AI Context Reference

> Complete design token inventory, dark mode architecture, animation system, and component styling patterns.

---

## CSS Variable Inventory

All design tokens are defined as CSS custom properties in `src/app/globals.css` and mapped to Tailwind utilities in `tailwind.config.ts`.

### Colors

#### Brand Colors
| Variable | Light Mode | Dark Mode | Tailwind |
|----------|-----------|-----------|----------|
| `--color-primary` | `#2563EB` (Blue 600) | `#3B82F6` (Blue 500) | `text-primary`, `bg-primary` |
| `--color-secondary` | `#1D4ED8` (Blue 700) | `#60A5FA` (Blue 400) | `text-secondary`, `bg-secondary` |
| `--color-accent` | `#3B82F6` (Blue 500) | `#93C5FD` (Blue 300) | `text-accent`, `bg-accent` |
| `--color-success` | `#059669` (Emerald 600) | `#34D399` (Emerald 300) | `text-success` |
| `--color-warning` | `#D97706` (Amber 600) | `#FBBF24` (Amber 400) | `text-warning` |
| `--color-error` | `#DC2626` (Red 600) | `#F87171` (Red 400) | `text-error` |

#### Neutral Scale (Slate palette, inverted in dark mode)
| Variable | Light | Dark | Tailwind |
|----------|-------|------|----------|
| `--neutral-50` | `#F8FAFC` | `#020617` | `neutral-50` |
| `--neutral-100` | `#F1F5F9` | `#0F172A` | `neutral-100` |
| `--neutral-200` | `#E2E8F0` | `#1E293B` | `neutral-200` |
| `--neutral-300` | `#CBD5E1` | `#334155` | `neutral-300` |
| `--neutral-400` | `#94A3B8` | `#475569` | `neutral-400` |
| `--neutral-500` | `#64748B` | `#64748B` | `neutral-500` |
| `--neutral-600` | `#475569` | `#94A3B8` | `neutral-600` |
| `--neutral-700` | `#334155` | `#CBD5E1` | `neutral-700` |
| `--neutral-800` | `#1E293B` | `#E2E8F0` | `neutral-800` |
| `--neutral-900` | `#0F172A` | `#F1F5F9` | `neutral-900` |
| `--neutral-950` | `#020617` | `#F8FAFC` | `neutral-950` |

#### Surfaces
| Variable | Light | Dark |
|----------|-------|------|
| `--surface-primary` | `#FFFFFF` | `#0F172A` |
| `--surface-secondary` | `#F8FAFC` | `#1E293B` |
| `--surface-elevated` | `#FFFFFF` | `#1E293B` |
| `--surface-overlay` | `rgba(15,23,42,0.5)` | `rgba(2,6,23,0.8)` |

#### Semantic Text
| Variable | Light | Dark | Tailwind |
|----------|-------|------|----------|
| `--text-primary` | `#0F172A` | `#F1F5F9` | `text-theme-primary` |
| `--text-secondary` | `#475569` | `#CBD5E1` | `text-theme-secondary` |
| `--text-tertiary` | `#64748B` | `#94A3B8` | `text-theme-tertiary` |
| `--text-inverse` | `#FFFFFF` | `#0F172A` | `text-theme-inverse` |

#### Borders
| Variable | Light | Dark | Tailwind |
|----------|-------|------|----------|
| `--border-primary` | `#E2E8F0` | `#334155` | `border-theme-primary` |
| `--border-secondary` | `#F1F5F9` | `#1E293B` | `border-theme-secondary` |
| `--border-accent` | `rgba(37,99,235,0.3)` | `rgba(59,130,246,0.4)` | `border-theme-accent` |

#### Shadows
| Variable | Light | Dark |
|----------|-------|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)` | Higher opacity |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)` | Higher opacity |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)` | Higher opacity |

### Spacing
| Variable | Value | Tailwind |
|----------|-------|----------|
| `--space-xs` | `0.5rem` (8px) | `p-xs`, `m-xs` |
| `--space-sm` | `0.75rem` (12px) | `p-sm`, `m-sm` |
| `--space-md` | `1rem` (16px) | `p-md`, `m-md` |
| `--space-lg` | `1.5rem` (24px) | `p-lg`, `m-lg` |
| `--space-xl` | `2rem` (32px) | `p-xl`, `m-xl` |
| `--space-2xl` | `3rem` (48px) | `p-2xl` |
| `--space-3xl` | `4rem` (64px) | `p-3xl` |
| `--space-4xl` | `6rem` (96px) | `p-4xl` |

### Transitions
| Variable | Value |
|----------|-------|
| `--transition-fast` | `150ms ease` |
| `--transition-base` | `250ms ease` |
| `--transition-slow` | `400ms ease` |
| `--easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--easing-smooth` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |

---

## Typography

### Font Loading (`src/app/layout.tsx`)
```typescript
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
// Applied: <body className={twMerge(inter.variable, jetbrainsMono.variable, "font-sans")}>
```

### Fluid Type Scale (all use `clamp()`)
| Variable | Min | Max | Tailwind |
|----------|-----|-----|----------|
| `--text-xs` | `0.75rem` | `0.875rem` | `text-xs` |
| `--text-sm` | `0.875rem` | `1rem` | `text-sm` |
| `--text-base` | `1rem` | `1.125rem` | `text-base` |
| `--text-lg` | `1.125rem` | `1.375rem` | `text-lg` |
| `--text-xl` | `1.25rem` | `1.625rem` | `text-xl` |
| `--text-2xl` | `1.5rem` | `2.125rem` | `text-2xl` |
| `--text-3xl` | `1.875rem` | `2.75rem` | `text-3xl` |
| `--text-4xl` | `2.25rem` | `3.5rem` | `text-4xl` |
| `--text-5xl` | `3rem` | `5rem` | `text-5xl` |
| `--text-6xl` | `3.75rem` | `6.5rem` | `text-6xl` |

### Base Typography Styles
- **Headings:** `font-weight: 700`, `letter-spacing: -0.025em`, `line-height: 1.15`, `text-wrap: balance`
- **Body:** `font-weight: 400`, `letter-spacing: -0.01em`, `line-height: 1.6`
- **Paragraphs:** `line-height: 1.7`, `text-wrap: pretty`, `max-inline-size: 65ch`

---

## Dark Mode

### How It Works
1. **Provider:** `next-themes` via `ThemeProvider` in `src/components/Providers.tsx`
2. **Config:** `attribute="class"`, `defaultTheme="system"`, `enableSystem={true}`
3. **Mechanism:** `.dark` class on `<html>` triggers CSS variable overrides in `globals.css`
4. **All CSS variables are redefined** in the `.dark {}` block — components using `var(--color-primary)` automatically get dark values

### Pattern for Components
```tsx
// Colors automatically adapt — no dark: prefix needed for CSS variables
className="bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--border-primary)]"

// Use dark: prefix only for Tailwind utility overrides
className="hover:bg-[var(--neutral-200)] dark:hover:bg-[var(--neutral-300)]"
```

### Theme Transition
```css
/* Applied globally — smooth color transitions on theme switch */
*:not([class*="motion-"]):not(svg):not(path) {
  transition-property: color, background-color, border-color;
  transition-duration: 150ms;
  transition-timing-function: ease;
}
```

---

## Animation System

### CSS Keyframes (in `globals.css`, mapped to Tailwind)

| Animation | Tailwind Class | Duration | Use Case |
|-----------|---------------|----------|----------|
| `skeleton-loading` | `animate-skeleton-loading` | 1.5s infinite | Loading placeholders |
| `slide-in-up` | `animate-slide-in-up` | 0.3s ease | Success messages |
| `shake` | `animate-shake` | 0.3s cubic-bezier | Form errors |
| `spinner-rotate` | `animate-spinner-rotate` | 0.75s linear infinite | Loading spinners |

### CSS Utility Classes
```css
.skeleton     /* Gradient shimmer loading effect */
.loading-spinner  /* Border-based circular spinner */
.form-error   /* Shake animation + red color */
.form-success /* Slide-in-up + green color */
```

### Framer Motion Patterns

**Fade-in on view:**
```tsx
const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: "-100px" });
const shouldReduceMotion = useReducedMotion();

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
/>
```

**Staggered children:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.5 } },
};
```

### Reduced Motion Support
```css
/* CSS: Disables all animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
```tsx
// Framer Motion: All components check this
const shouldReduceMotion = useReducedMotion();
transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
```

---

## Component Styling Patterns

### WarmCard (`src/components/ui/WarmCard.tsx`)
Primary container component. Shows the CSS variable pattern:
```tsx
className={cn(
  "rounded-xl",
  "bg-[var(--surface-elevated)]",
  "border border-[var(--border-primary)]",
  hover && "transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-accent)]",
  paddingClasses[padding],  // none | sm | md | lg | xl
)}
```
Padding options: `none=""`, `sm="p-5 sm:p-6"`, `md="p-6 sm:p-8"`, `lg="p-8 sm:p-10 lg:p-12"`, `xl="p-10 sm:p-12 lg:p-16"`

### ModernButton (`src/components/ui/ModernButton.tsx`)
5 variants with consistent touch targets:
- **primary:** Dark neutral bg, light text
- **secondary:** Elevated surface bg, bordered
- **outline:** Border only, transparent bg
- **ghost:** No border, no bg, subtle hover
- **accent:** Primary color bg, white text

All sizes enforce `min-h-[44px]` (WCAG touch target).

### Class Composition
All components use `cn()` from `tailwind-merge` for conflict-free class merging:
```tsx
import { cn } from "@/lib/utils";
className={cn("base-classes", conditional && "conditional-classes", className)}
```

---

## Accessibility

### Focus Styles
```css
*:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
button:focus-visible, a:focus-visible { box-shadow: 0 0 0 3px var(--border-accent); }
input:focus-visible { border-color: var(--color-primary); }
```

### Touch Targets
Tailwind utilities `min-h-touch` and `min-w-touch` map to `44px`. CSS class `.tap-target` also available.

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  :root { --color-primary: #1D4ED8; --border-primary: #94A3B8; }
  .card { border-width: 2px; }
}
```

### Skip Link
`.skip-link` class — hidden by default, visible on focus at top of page.

---

## Tailwind Config Summary (`tailwind.config.ts`)

| Feature | Configuration |
|---------|--------------|
| Dark mode | `"class"` (manual toggle) |
| Fonts | `sans: var(--font-inter)`, `mono: var(--font-jetbrains-mono)` |
| Colors | All mapped to CSS variables |
| Spacing | Mapped to CSS variables (xs through 4xl) |
| Shadows | Mapped to CSS variables (sm through xl) |
| Animations | 4 custom keyframes |
| Easing | `spring`, `smooth` custom timing functions |
| Touch targets | `min-h-touch: 44px`, `min-w-touch: 44px` |
| Plugins | `@tailwindcss/typography`, `tailwindcss-animate` |

---

## Rules for New Components

1. **Never hardcode hex colors** — use `var(--color-primary)`, `var(--text-secondary)`, etc.
2. **Use bracket notation** for CSS variables: `bg-[var(--surface-elevated)]`
3. **Always test dark mode** — the `.dark` class on `<html>` must work
4. **44px minimum touch targets** — use `min-h-touch min-w-touch` or `min-h-[44px]`
5. **Check reduced motion** — use `useReducedMotion()` for Framer Motion animations
6. **Use `cn()`** from `src/lib/utils` for class composition
7. **Follow existing padding patterns** — match WarmCard's responsive padding scale
