# Styling System Documentation

Complete design system and styling guide for Isaac Vazquez's modern professional portfolio.

**Design Philosophy:** Modern Professional
**Last Updated:** March 2026
**WCAG Compliance:** AAA (7.5:1+ contrast ratios)
**Tech Stack:** Tailwind CSS v4, CSS Custom Properties, Framer Motion

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Modern CSS Architecture](#modern-css-architecture)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Component Styling](#component-styling)
- [Responsive Design](#responsive-design)
- [Animations & Motion](#animations--motion)
- [Accessibility](#accessibility)
- [Performance Optimization](#performance-optimization)
- [Modern UX Patterns](#modern-ux-patterns)
- [Implementation Guide](#implementation-guide)

---

## Design Philosophy

### Core Concept
The modern professional aesthetic creates a clean, credible portfolio that balances technical precision with approachability. Think clarity, confidence, and trustworthiness — a blue-anchored palette that conveys expertise without coldness.

### Design Principles (2026)

**1. Welcoming & Professional**
- Blue-based primary palette (Blue 600 `#2563EB`) for trust and credibility
- Slate neutrals for a clean, modern, professional feel
- Subtle shadows using neutral rgba values
- Rounded corners (8px-16px radius) for friendly approachability
- Inviting, not intimidating — designed for human connection

**2. Professional Credibility**
- Clean typography hierarchy using Inter variable font
- Fluid typography with `clamp()` for perfect scaling
- Consistent 8px spacing system
- Purposeful use of color with semantic tokens
- High contrast for readability (7.5:1+ for AAA compliance)

**3. Accessible & Inclusive**
- WCAG AAA compliance (exceeds AA requirements)
- Enhanced focus indicators (2px solid outline with `focus-visible`)
- 44px minimum touch targets for mobile accessibility
- Readable text colors on all backgrounds (7.5:1+ contrast)
- Full keyboard navigation support
- Reduced motion support via `prefers-reduced-motion` and Framer Motion's `useReducedMotion`
- Semantic HTML and ARIA labels throughout

**4. Performance Optimized**
- CSS Layers (`@layer base, components, utilities`) for optimal cascade
- Minimal CSS footprint with Tailwind v4
- Efficient utility classes with automatic purging (Tailwind v4 auto-detects content)
- Purposeful animations (only when adding value)
- Fast paint times with CSS containment (`content-visibility: auto`)
- Variable fonts (Inter) with `swap` loading strategy

**5. Modern & Future-Proof**
- CSS Custom Properties for runtime theming
- `text-wrap: balance` and `text-wrap: pretty` for beautiful heading/paragraph breaks
- Framer Motion for physics-based animations
- Dark mode with slate tones (not just inverted colors)
- Progressive enhancement principles

---

## Modern CSS Architecture

### CSS Layers Organization

The project uses three CSS layers defined in `globals.css`:

```css
/* globals.css */
@import "tailwindcss";

@layer base, components, utilities;
```

**Layer Purpose:**
- **base**: CSS resets, focus indicators, global element defaults (h1–h6, body, p)
- **components**: Reusable component styles (`.card`, `.skeleton`, `.form-error`)
- **utilities**: Custom utility classes (`.max-inline-size-prose`, `.tap-target`)

> **Note:** There is no `overrides` layer. Keep all styles within these three layers to maintain specificity predictability.

### CSS Custom Properties Strategy

All design tokens live in `:root` and are overridden in `.dark`. This enables runtime theming without rebuilding.

```css
/* globals.css — :root tokens */
:root {
  /* Brand colors */
  --color-primary: #2563EB;
  --color-secondary: #1D4ED8;
  --color-accent: #3B82F6;

  /* Surface colors */
  --surface-primary: #FFFFFF;
  --surface-elevated: #FFFFFF;

  /* Text hierarchy */
  --text-primary: #0F172A;
  --text-secondary: #475569;

  /* Fluid typography */
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
}

/* Dark mode overrides via .dark on <html> */
.dark {
  --color-primary: #3B82F6;
  --surface-primary: #0F172A;
  --text-primary: #F1F5F9;
}
```

**Benefits:**
- Dark mode with a single class toggle on `<html>`
- Component-level customization via inline CSS vars
- Better browser DevTools debugging

### Tailwind CSS v4 Integration

**Key difference from v3:** Tailwind v4 uses `@import "tailwindcss"` (PostCSS plugin via `@tailwindcss/postcss`) and auto-detects content files — no `content` array in `tailwind.config.ts`.

```typescript
// tailwind.config.ts
{
  darkMode: "class",    // Manual dark mode via .dark class
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        neutral: { 50: "var(--neutral-50)", /* ... */ }
      },
      textColor: {
        "theme-primary": "var(--text-primary)",
        "theme-secondary": "var(--text-secondary)",
      }
    }
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate")
  ]
}
```

**Best Practices:**
- Use CSS variables for runtime theming, never hardcode hex values in components
- Use `cn()` (from `tailwind-merge`) for conditional class composition
- Leverage `@tailwindcss/typography` for MDX/blog content with `.prose`
- Use custom `textColor` and `borderColor` aliases (`text-theme-primary`, `border-theme-accent`) for semantic usage

---

## Color System

### Modern Color Architecture

All colors use **semantic tokens** via CSS Custom Properties. **Never hardcode hex values in components.**

```css
/* globals.css — Brand Colors */
:root {
  --color-primary: #2563EB;    /* Blue 600 — CTAs, links, accent variant buttons */
  --color-secondary: #1D4ED8;  /* Blue 700 — hover state of accent buttons */
  --color-accent: #3B82F6;     /* Blue 500 — highlights, decorative */
  --color-success: #059669;    /* Emerald 600 — success states */
  --color-warning: #D97706;    /* Amber 600 — warnings */
  --color-error: #DC2626;      /* Red 600 — errors */
}
```

**Semantic Usage:**
- `--color-primary` (`#2563EB`): `accent` variant buttons, links, active navigation, focus rings, brand elements
- `--color-secondary` (`#1D4ED8`): Hover state of `accent` buttons
- `--color-accent` (`#3B82F6`): Hover highlights, decorative elements
- `--neutral-900` (`#0F172A`): `primary` variant buttons (dark grey, not blue — see [ModernButton](#modernbutton-component))

> **Critical:** The `primary` button variant is **dark grey** (`--neutral-900`), not blue. Blue buttons use the `accent` variant.

### Slate Neutral Scale

```css
/* Light mode (maps 50→light, 950→dark) */
:root {
  --neutral-50: #F8FAFC;    /* Near-white — main background */
  --neutral-100: #F1F5F9;   /* Light gray — elevated surfaces */
  --neutral-200: #E2E8F0;   /* Soft gray — borders, skeleton bg */
  --neutral-300: #CBD5E1;   /* Light slate — border hover */
  --neutral-400: #94A3B8;   /* Medium slate — disabled, tertiary */
  --neutral-500: #64748B;   /* Slate — placeholders */
  --neutral-600: #475569;   /* Dark slate — secondary text */
  --neutral-700: #334155;   /* Darker slate — muted */
  --neutral-800: #1E293B;   /* Very dark — dark mode surfaces */
  --neutral-900: #0F172A;   /* Almost black — primary buttons, headings */
  --neutral-950: #020617;   /* Deepest — shadow base */
}

/* Dark mode — neutrals are inverted (50→dark, 950→light) */
.dark {
  --neutral-50: #020617;
  --neutral-100: #0F172A;
  /* ... inverts through to ... */
  --neutral-950: #F8FAFC;
}
```

### Semantic Text Colors

```css
:root {
  --text-primary: #0F172A;    /* Slate 900 — body text */
  --text-secondary: #475569;  /* Slate 600 — captions, descriptions */
  --text-tertiary: #64748B;   /* Slate 500 — labels, metadata */
  --text-inverse: #FFFFFF;    /* For text on dark backgrounds */
}

.dark {
  --text-primary: #F1F5F9;    /* Slate 100 */
  --text-secondary: #CBD5E1;  /* Slate 300 */
  --text-tertiary: #94A3B8;   /* Slate 400 */
  --text-inverse: #0F172A;    /* Slate 900 */
}
```

**Contrast Ratios (WCAG):**
- Primary text (`#0F172A` on `#FFFFFF`): **21:1** — exceeds AAA (7:1)
- Secondary text (`#475569` on `#FFFFFF`): **7.0:1** — AA/AAA
- UI elements: **4.5:1+** — AA minimum
- Links/accent buttons (`#2563EB` on `#FFFFFF`): **4.5:1+** — AA

### Surface & Background Colors

```css
:root {
  --surface-primary: #FFFFFF;                /* Main page background */
  --surface-secondary: #F8FAFC;              /* Section backgrounds */
  --surface-elevated: #FFFFFF;               /* Cards, modals */
  --surface-overlay: rgba(15, 23, 42, 0.5);  /* Backdrop overlays */
}

.dark {
  --surface-primary: #0F172A;                /* Slate 900 */
  --surface-secondary: #1E293B;              /* Slate 800 */
  --surface-elevated: #1E293B;               /* Slate 800 */
  --surface-overlay: rgba(2, 6, 23, 0.8);    /* Near-black overlay */
}
```

### Border & Shadow System

```css
:root {
  --border-primary: #E2E8F0;                   /* Slate 200 — default borders */
  --border-secondary: #F1F5F9;                 /* Slate 100 — subtle borders */
  --border-accent: rgba(37, 99, 235, 0.3);     /* Blue at 30% — hover/focus borders */

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
}

.dark {
  --border-primary: #334155;                   /* Slate 700 */
  --border-secondary: #1E293B;                 /* Slate 800 */
  --border-accent: rgba(59, 130, 246, 0.4);    /* Blue 500 at 40% */

  /* Dark mode shadows are more opaque */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
}
```

### Tailwind Color Utilities

```tsx
// Semantic colors (map to CSS vars)
className="text-primary"           // --color-primary
className="bg-surface-primary"     // --surface-primary
className="border-theme-primary"   // --border-primary
className="border-theme-accent"    // --border-accent

// Neutral scale (dark-mode-aware via CSS var inversion)
className="bg-neutral-50"          // Near-white in light, near-black in dark
className="text-neutral-900"       // Near-black in light, near-white in dark

// Theme-aware text (explicit aliases)
className="text-theme-primary"     // --text-primary
className="text-theme-secondary"   // --text-secondary

// Dark mode explicit overrides (when needed)
className="bg-neutral-50 dark:bg-neutral-900"
className="border-neutral-200 dark:border-neutral-700"
```

### Dark Mode Colors

```css
.dark {
  /* Blue palette brightens for dark background legibility */
  --color-primary: #3B82F6;    /* Blue 500 (one step lighter than light mode) */
  --color-secondary: #60A5FA;  /* Blue 400 */
  --color-accent: #93C5FD;     /* Blue 300 */

  /* Semantic state colors also lighten */
  --color-success: #34D399;    /* Emerald 400 */
  --color-warning: #FBBF24;    /* Amber 400 */
  --color-error: #F87171;      /* Red 400 */
}
```

### High Contrast Media Query

```css
@media (prefers-contrast: high) {
  :root {
    --color-primary: #1D4ED8;   /* Darker blue for better contrast */
    --border-primary: #94A3B8;  /* Stronger borders */
  }

  .card {
    border-width: 2px;
  }
}
```

---

## Typography

### Font System

```css
/* globals.css — Font variables */
:root {
  --font-body: var(--font-inter);
  --font-heading: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}
```

Fonts are loaded via Next.js inline style variables in `src/app/layout.tsx`:
- `--font-inter` → Inter variable font + system fallbacks
- `--font-jetbrains-mono` → JetBrains Mono + monospace fallbacks

**Tailwind font families:**
```tsx
className="font-sans"   // var(--font-inter)
className="font-mono"   // var(--font-jetbrains-mono)
```

### Fluid Typography System

All font sizes use `clamp()` for responsive scaling without media queries. These are defined in `:root` and mapped to Tailwind's `fontSize` config.

```css
/* globals.css — Fluid scale */
:root {
  --text-xs:   clamp(0.75rem,  0.7rem  + 0.25vw,  0.875rem);   /* 12–14px */
  --text-sm:   clamp(0.875rem, 0.8rem  + 0.375vw, 1rem);       /* 14–16px */
  --text-base: clamp(1rem,     0.9rem  + 0.5vw,   1.125rem);   /* 16–18px */
  --text-lg:   clamp(1.125rem, 1rem    + 0.625vw, 1.375rem);   /* 18–22px */
  --text-xl:   clamp(1.25rem,  1.1rem  + 0.75vw,  1.625rem);   /* 20–26px */
  --text-2xl:  clamp(1.5rem,   1.25rem + 1.25vw,  2.125rem);   /* 24–34px */
  --text-3xl:  clamp(1.875rem, 1.5rem  + 1.875vw, 2.75rem);    /* 30–44px */
  --text-4xl:  clamp(2.25rem,  1.75rem + 2.5vw,   3.5rem);     /* 36–56px */
  --text-5xl:  clamp(3rem,     2rem    + 5vw,      5rem);       /* 48–80px */
  --text-6xl:  clamp(3.75rem,  2.5rem  + 6.25vw,  6.5rem);     /* 60–104px */
}
```

**Tailwind usage (all auto-scale via clamp):**
```tsx
className="text-xs"     // 12–14px
className="text-sm"     // 14–16px
className="text-base"   // 16–18px
className="text-lg"     // 18–22px
className="text-xl"     // 20–26px
className="text-2xl"    // 24–34px
className="text-3xl"    // 30–44px
className="text-4xl"    // 36–56px
className="text-5xl"    // 48–80px
className="text-6xl"    // 60–104px
```

> **Note:** There is no `--text-7xl` or `--text-display-*` in `globals.css`. If you need oversized display type, define a one-off `clamp()` directly inline or in a component-scoped CSS class.

### Typography Hierarchy (base layer)

```css
/* globals.css @layer base */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  text-wrap: balance;
  color: var(--text-primary);
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  background-color: var(--surface-primary);
}

p {
  margin-bottom: 1.25em;
  line-height: 1.7;
  text-wrap: pretty;
  max-inline-size: 65ch;
}
```

### Font Weights

```css
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

```tsx
className="font-normal"    // 400
className="font-medium"    // 500
className="font-semibold"  // 600
className="font-bold"      // 700
```

### Text Utilities

```tsx
/* Responsive text that doesn't need breakpoints (uses clamp) */
className="text-4xl"        // Auto-scales 36–56px

/* Explicit responsive (rarely needed) */
className="text-2xl md:text-3xl lg:text-4xl"

/* Text balancing (2026 best practice) */
className="text-balance"    // Better heading line breaks (text-wrap: balance)
className="text-pretty"     // Prevents orphan words in paragraphs

/* Tracking */
className="tracking-tight"  // -0.025em — headings
className="tracking-normal" // 0em — body

/* Line height */
className="leading-none"    // 1 — display headings
className="leading-tight"   // 1.25
className="leading-snug"    // 1.375
className="leading-normal"  // 1.5
className="leading-relaxed" // 1.625
className="leading-loose"   // 2
```

### Text Gradient Effect

```tsx
// Blue gradient text (used in hero headings)
<span
  className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]
             bg-clip-text text-transparent"
>
  Gradient Heading
</span>
```

### Prose Content

For blog posts and long-form MDX content, use `@tailwindcss/typography`:

```tsx
<div className="prose prose-slate dark:prose-invert max-w-none">
  {/* MDX content renders with clean typography styles */}
</div>
```

### Reading Width Utilities

```tsx
className="max-inline-size-prose"   // 65ch — optimal reading width (default for p)
className="max-inline-size-narrow"  // 55ch — tighter reading
className="max-inline-size-wide"    // 75ch — wider reading
```

---

## Spacing System

### 8px Grid Tokens

```css
:root {
  --space-xs:  0.5rem;   /*  8px */
  --space-sm:  0.75rem;  /* 12px */
  --space-md:  1rem;     /* 16px */
  --space-lg:  1.5rem;   /* 24px */
  --space-xl:  2rem;     /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
  --space-4xl: 6rem;     /* 96px */
}
```

These are mapped to Tailwind's `spacing` config, so you can use:
```tsx
className="p-xs"    // 8px
className="p-sm"    // 12px
className="p-md"    // 16px
className="p-lg"    // 24px
className="gap-xl"  // 32px
className="mb-2xl"  // 48px
```

### Section Spacing Patterns

```tsx
/* Standard section vertical padding */
className="py-16 sm:py-20 lg:py-24"

/* Standard horizontal padding */
className="px-4 sm:px-6 lg:px-8"

/* Fluid spacing without breakpoints */
style={{ paddingBlock: "clamp(4rem, 8vw, 6rem)" }}
```

### Container Widths

```tsx
className="max-w-prose mx-auto"   // 65ch — optimal reading width
className="max-w-4xl mx-auto"     // 896px
className="max-w-5xl mx-auto"     // 1024px — home, about, contact
className="max-w-6xl mx-auto"     // 1152px — resume, projects
className="max-w-7xl mx-auto"     // 1280px — full-width pages
```

### Component Spacing

**WarmCard Padding System:**

| Value | Mobile       | Tablet       | Desktop      |
|-------|-------------|-------------|-------------|
| `none` | 0px        | —           | —           |
| `sm`   | 20px (p-5) | 24px (p-6)  | —           |
| `md`   | 24px (p-6) | 32px (p-8)  | —           |
| `lg`   | 32px (p-8) | 40px (p-10) | 48px (p-12) |
| `xl`   | 40px (p-10)| 48px (p-12) | 64px (p-16) |

```tsx
<WarmCard padding="none" />   // No padding — custom content
<WarmCard padding="sm" />     // Compact card
<WarmCard padding="md" />     // Default (20–32px responsive)
<WarmCard padding="lg" />     // Comfortable
<WarmCard padding="xl" />     // Spacious
```

### Touch Target Sizing

```css
/* globals.css — tap-target utility */
.tap-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

```tsx
// Tailwind touch-friendly patterns
className="min-h-touch min-w-touch"  // via tailwind.config.ts minHeight/minWidth
className="min-h-[44px]"             // Explicit when needed
```

---

## Component Styling

### WarmCard Component

**File:** `src/components/ui/WarmCard.tsx`

```tsx
interface WarmCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;           // Adds translateY(-2px) + accent border on hover
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  ariaLabel?: string;
  ariaDescription?: string;  // Sets title attribute
  onClick?: (e: React.MouseEvent) => void;
}
```

**Actual base styles:**
```tsx
className={cn(
  "rounded-xl",
  "bg-[var(--surface-elevated)]",
  "border border-[var(--border-primary)]",
  hover && [
    "transition-all duration-200 ease-out",
    "hover:-translate-y-0.5",
    "hover:border-[var(--border-accent)]",
    "cursor-pointer"
  ],
  paddingClasses[padding],
)}
```

**Key notes:**
- Uses `rounded-xl` (12px), **not** `rounded-2xl`
- Background is `--surface-elevated` (white/slate-800), **not** hardcoded white
- No `backdrop-blur` or glass effect
- Hover lift is `-translate-y-0.5` (2px), **not** `-translate-y-1` (4px)
- Always renders with `role="article"`

**Usage:**
```tsx
<WarmCard hover padding="xl">
  <h3>Interactive Card</h3>
  <p>Hover for subtle lift + blue border</p>
</WarmCard>

<WarmCard padding="md" className="max-w-md">
  <p>Compact card content</p>
</WarmCard>

// No padding for custom layout control
<WarmCard padding="none">
  <img className="rounded-t-xl" src="..." alt="..." />
  <div className="p-6">Custom padding</div>
</WarmCard>
```

### ModernButton Component

**File:** `src/components/ui/ModernButton.tsx`

**5 variants** (polymorphic — renders as `<button>`, Next.js `<Link>`, or `<a>` based on `href`):

| Variant     | Background             | Text                     | Use Case                        |
|-------------|------------------------|--------------------------|---------------------------------|
| `primary`   | `--neutral-900` (dark grey) | `--neutral-50` (white)   | Default CTAs, dark emphasis     |
| `secondary` | `--surface-elevated`   | `--text-primary`         | Secondary actions, bordered     |
| `outline`   | Transparent            | `--text-primary`         | Tertiary actions, low emphasis  |
| `ghost`     | Transparent            | `--text-secondary`       | Icon buttons, subtle actions    |
| `accent`    | `--color-primary` (blue) | white                  | **Blue** CTAs, brand emphasis   |

> **Critical distinction:** `primary` is dark grey, `accent` is blue. If you want the classic blue button, use `variant="accent"`.

```tsx
interface ModernButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
  href?: string;          // Renders as Link when provided
  disabled?: boolean;
}
```

**Actual variant styles:**
```tsx
const variants = {
  primary: cn(
    "bg-[var(--neutral-900)] hover:bg-[var(--neutral-800)]",
    "text-[var(--neutral-50)]",
    "shadow-sm hover:shadow-md"
  ),
  secondary: cn(
    "bg-[var(--surface-elevated)] hover:bg-[var(--neutral-200)]",
    "text-[var(--text-primary)]",
    "border border-[var(--border-primary)]",
    "shadow-sm hover:shadow-md"
  ),
  outline: cn(
    "border border-[var(--neutral-300)]",
    "text-[var(--text-primary)]",
    "hover:bg-[var(--neutral-200)] hover:border-[var(--neutral-400)]"
  ),
  ghost: cn(
    "text-[var(--text-secondary)]",
    "hover:text-[var(--text-primary)]",
    "hover:bg-[var(--neutral-200)]"
  ),
  accent: cn(
    "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
    "text-white",
    "shadow-sm hover:shadow-md"
  ),
};
```

**Size styles (all maintain 44px min-height for accessibility):**
```tsx
const sizes = {
  sm: "px-4 py-2 text-sm min-h-[44px] gap-1.5",
  md: "px-6 py-2.5 text-base min-h-[44px] gap-2",
  lg: "px-8 py-3.5 text-lg min-h-[52px] gap-2.5",
};
```

**Base styles (always applied):**
```tsx
"inline-flex items-center justify-center font-semibold rounded-lg"
"transition-all duration-200"
"disabled:opacity-40 disabled:cursor-not-allowed"
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
"active:scale-[0.98]"   // Press feedback
```

**Usage examples:**
```tsx
// Dark grey CTA (default)
<ModernButton variant="primary" size="lg">
  View Resume
</ModernButton>

// Blue brand CTA
<ModernButton variant="accent" size="lg" href="/contact">
  Get in Touch
</ModernButton>

// Secondary action
<ModernButton variant="secondary">
  Learn More
</ModernButton>

// External link (auto-detects and adds target="_blank" + rel)
<ModernButton variant="accent" href="https://example.com">
  External Link
</ModernButton>

// Full width
<ModernButton variant="outline" fullWidth>
  Submit Form
</ModernButton>
```

### Badge Component

**File:** `src/components/ui/Badge.tsx`

```tsx
// Variants: default, success, warning, outline
// Sizes: sm, md, lg

<Badge>Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="outline">Tag</Badge>
```

**Base:** `inline-flex` with `rounded-md`, colored background at 10% opacity, matching text color.

### Heading Component

**File:** `src/components/ui/Heading.tsx`

```tsx
// Levels 1–6 with semantic rendering
<Heading level={1}>Page Title</Heading>   // text-5xl sm:text-6xl
<Heading level={2}>Section</Heading>       // text-4xl sm:text-5xl
<Heading level={3}>Subsection</Heading>    // text-3xl sm:text-4xl
<Heading level={4}>Card Title</Heading>    // text-2xl sm:text-3xl
<Heading level={5}>Label</Heading>         // text-xl sm:text-2xl
<Heading level={6}>Caption</Heading>       // text-lg sm:text-xl

// Override rendered tag (semantic "as" prop)
<Heading level={3} as="h2">...</Heading>
```

All headings: `font-bold tracking-tight text-[var(--text-primary)]`.

### Card CSS Class

For non-component card usage, `globals.css` provides `.card` and `.card-hover`:

```css
@layer components {
  .card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    transition: all 0.25s ease;
  }

  .card-hover:hover {
    border-color: var(--border-accent);
    transform: translateY(-1px);
  }
}
```

**Prefer `WarmCard` component** for new work — use `.card` class only in legacy or non-React contexts.

### Shadow System

```tsx
className="shadow-sm"           // Subtle — flat cards
className="shadow-md"           // Default — elevated cards
className="shadow-lg"           // Interactive — hover target
className="shadow-xl"           // Prominent — modals, dropdowns
className="hover:shadow-lg"     // Hover elevation increase
```

### Border Radius Patterns

```tsx
className="rounded-sm"     // 2px — very subtle
className="rounded"        // 4px — tags, chips
className="rounded-md"     // 6px — inputs
className="rounded-lg"     // 8px — buttons (ModernButton)
className="rounded-xl"     // 12px — cards (WarmCard)
className="rounded-2xl"    // 16px — large cards
className="rounded-full"   // Avatars, pill badges
```

---

## Responsive Design

### Tailwind Breakpoints (Mobile-First)

```
sm:  640px   — Mobile landscape, small tablets
md:  768px   — Tablets
lg:  1024px  — Desktop
xl:  1280px  — Large desktop
2xl: 1536px  — Extra large / 4K
```

### Preferred: Fluid Layouts

Use CSS Grid auto-fit and `clamp()` before resorting to breakpoints:

```tsx
// Cards auto-arrange without breakpoints
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  {cards}
</div>

// Typography scales without breakpoints (uses clamp in CSS vars)
className="text-4xl"   // Scales from 36px→56px automatically
```

### Standard Responsive Patterns

```tsx
// Stack → row layout
<div className="flex flex-col gap-4 md:flex-row md:gap-8 lg:gap-12">
  ...
</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
  ...
</div>

// Responsive typography (when clamp isn't enough)
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
  ...
</h1>
```

### Images (Next.js)

Always use `OptimizedImage` wrapper or `next/image` directly:

```tsx
import Image from 'next/image';

<Image
  src="/headshot.jpg"
  alt="Isaac Vazquez"
  width={288}
  height={288}
  sizes="(max-width: 640px) 224px, (max-width: 768px) 256px, 288px"
  className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full object-cover"
  priority   // Add for above-fold images
/>
```

**Never use `<img>` directly** — always go through Next.js Image for optimization (AVIF/WebP, lazy loading, LCP optimization).

### Viewport Height

```tsx
className="min-h-dvh"   // Dynamic viewport height (handles mobile browser chrome)
className="h-screen"    // 100vh (use min-h-dvh for full-page sections on mobile)
```

---

## Animations & Motion

### Framer Motion (Primary Animation System)

```tsx
import { motion, useReducedMotion } from 'framer-motion';

// Always check reduced motion preference
const shouldReduceMotion = useReducedMotion();

// Fade in up with spring (standard entrance)
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6
    }
  }
};

// Stagger children (for card grids, list items)
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

**Reduced motion pattern:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={
    shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.6, type: "spring" }
  }
>
  Content
</motion.div>
```

### Tailwind CSS Animations

These animations exist in `tailwind.config.ts` and `globals.css`:

| Class                    | Effect                        | Duration |
|--------------------------|-------------------------------|----------|
| `animate-skeleton-loading` | Gradient shimmer on skeleton | 1.5s loop |
| `animate-slide-in-up`    | Fade + translateY entrance    | 0.3s     |
| `animate-shake`          | Horizontal shake (form error) | 0.3s     |
| `animate-spinner-rotate` | 360° rotation for spinners    | 0.75s loop |

> **Note:** `animate-float`, `animate-pulse-slow`, and `animate-gradient-shift` do **not** exist. Use Framer Motion for floating/custom effects.

### Transition Tokens

```css
--transition-fast: 150ms ease;   /* Button hover, focus */
--transition-base: 250ms ease;   /* Standard transitions */
--transition-slow: 400ms ease;   /* Modals, drawers */

--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* Bouncy */
--easing-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smooth out */
```

**Tailwind easing extensions:**
```tsx
className="ease-spring"   // cubic-bezier(0.34, 1.56, 0.64, 1)
className="ease-smooth"   // cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

### Transition Timing Guidelines

- **Micro-interactions** (button hover, focus ring): 150–200ms
- **UI transitions** (dropdowns, tooltips): 250ms
- **Content entrances** (modals, sidebars): 300–400ms
- **Page-level animations** (hero, section reveals): 600ms+
- **Loading/skeleton screens**: 1500ms loop

### Reduced Motion (CSS)

```css
/* globals.css — prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }

  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### GPU-Accelerated Properties

Animate only GPU-accelerated properties to avoid layout thrashing:

```css
/* Performant — GPU composited */
transform: translateY(-10px);   /* translate, scale, rotate */
opacity: 0.5;

/* Avoid animating — triggers layout */
margin-top: -10px;
top: -10px;
width: 200px;
height: 200px;
```

### Theme Transition

The global theme transition smoothly changes color/bg/border on dark mode toggle:

```css
/* globals.css */
*:not([class*="motion-"]):not(svg):not(path) {
  transition-property: color, background-color, border-color;
  transition-duration: 150ms;
  transition-timing-function: ease;
}
```

> This is intentionally limited to color properties only. It excludes `motion-*` classes, SVGs, and paths to avoid unwanted transitions on animated elements.

---

## Accessibility

### WCAG 2.2 AAA Target

**Contrast Ratios:**
- Primary text (`#0F172A` on white): **21:1** — exceeds AAA (7:1)
- Secondary text (`#475569` on white): **7.0:1** — AAA
- Accent buttons (`#2563EB` on white): **4.5:1** — AA

### Focus Indicators

**Actual focus styles in `globals.css`:**

```css
@layer base {
  /* Remove default — use focus-visible instead */
  *:focus {
    outline: none;
  }

  /* Keyboard-only focus ring (2px — not 3px) */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Enhanced for buttons and links */
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 3px var(--border-accent);  /* Glow layer */
  }

  /* Form inputs */
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 0;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--border-accent);
  }
}
```

> Focus rings are **2px** (not 3px as some older docs may indicate). Buttons and links get an additional glow via `box-shadow`.

**ModernButton focus (via Tailwind):**
```tsx
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"
```

### Skip Link

```css
/* globals.css */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--neutral-900);
  color: var(--neutral-50);
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 8px;
  z-index: 1000;
  font-weight: 600;
  transition: top 0.3s ease;
}

.skip-link:focus {
  top: 6px;
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

```tsx
// Place as first element in layout
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```tsx
<span className="sr-only">
  Additional context for screen readers
</span>

<IconClose aria-hidden="true" />  {/* Decorative — hide from SR */}
```

### Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible
<button tabIndex={0}>Action</button>

// Custom interactive divs — add role + keyboard handler
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
>
  Custom button
</div>

// Never use tabindex > 0 — it disrupts natural tab order
```

### ARIA Patterns

```tsx
// Navigation
<nav aria-label="Main navigation">...</nav>

// Main landmark
<main id="main-content">...</main>

// Expandable elements
<button
  aria-label="Close modal"
  aria-expanded={isOpen}
  aria-controls="modal-id"
>
  <IconClose aria-hidden="true" />
</button>

// Live regions
<div role="status" aria-live="polite">  {/* Polite — success messages */}
  {statusMessage}
</div>

<div role="alert" aria-live="assertive">  {/* Assertive — errors */}
  {errorMessage}
</div>
```

### Form Validation Styles

```css
/* globals.css — CSS-only validation feedback */
input:invalid:not(:focus):not(:placeholder-shown),
textarea:invalid:not(:focus):not(:placeholder-shown) {
  border-color: var(--color-error);
}

input:valid:not(:placeholder-shown),
textarea:valid:not(:placeholder-shown) {
  border-color: var(--color-success);
}
```

```css
.form-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-top: 0.25rem;
  animation: shake 0.3s cubic-bezier(.36,.07,.19,.97);
}

.form-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-success);
  font-size: var(--text-sm);
  margin-top: 0.25rem;
  animation: slide-in-up 0.3s ease;
}
```

### Accessibility Checklist

**Pre-ship verification:**
- [ ] All text meets 7.5:1 contrast ratio (AAA)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works end-to-end without mouse
- [ ] Skip link present and functional
- [ ] All images have meaningful alt text (or `alt=""` + `aria-hidden` for decorative)
- [ ] Forms have visible labels and descriptive error messages
- [ ] ARIA labels on icon-only buttons
- [ ] Touch targets minimum 44×44px
- [ ] Reduced motion support tested
- [ ] Screen reader tested (NVDA/JAWS/VoiceOver)

---

## Performance Optimization

### CSS Containment

```css
/* globals.css — content-visibility for off-screen sections */
.offscreen-content {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;  /* Reserve estimated height */
}
```

Use on below-fold page sections to defer their rendering:
```tsx
<section className="offscreen-content">
  <HeavySection />
</section>
```

### Text Content Utilities

```css
.content-text {
  font-size: var(--text-base);
  line-height: 1.8;
  max-width: 65ch;
}

.article-text {
  font-size: var(--text-base);
  line-height: 1.9;
  max-width: 65ch;
}
```

### Image Optimization

```tsx
// Always use next/image or OptimizedImage wrapper
import Image from 'next/image';

// Priority for above-fold images (avoids LCP penalty)
<Image src="..." alt="..." priority />

// Responsive sizes for bandwidth savings
<Image
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
  ...
/>
```

### Font Loading

Fonts are configured via Next.js `layout.tsx` inline styles (not `next/font/google` with config objects). The CSS variables `--font-inter` and `--font-jetbrains-mono` are injected on the `<body>` element at render time, ensuring zero layout shift.

### Bundle Analysis

```bash
npm run analyze    # Opens bundle visualizer
npm run build      # Check First Load JS size in output
```

Target: First Load JS < 200kB per route.

### Animation Performance

Only animate GPU-composited properties (`transform`, `opacity`). Avoid animating `width`, `height`, `margin`, `padding`, or `top`/`left`.

```tsx
// Efficient hover with will-change hint
<div className="transition-transform hover:-translate-y-0.5 will-change-transform">
  Card
</div>
```

---

## Modern UX Patterns

### Loading States

**Skeleton screen:**
```tsx
// Custom skeleton using globals.css .skeleton class
<div className="skeleton h-12 rounded-xl" />
<div className="skeleton h-64 rounded-xl mt-4" />
<div className="skeleton h-8 rounded-lg w-3/4 mt-4" />

// Or Tailwind animate-pulse
<div className="animate-pulse space-y-4">
  <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
  <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
</div>
```

**Loading spinner:**
```tsx
<div className="loading-spinner" aria-label="Loading..." />

// Or with icon
<span className="animate-spinner-rotate inline-block">
  <IconLoader className="text-primary" />
</span>
```

### Progress Bar

```css
/* globals.css */
.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--neutral-200);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: var(--progress, 0%);
  background: var(--color-primary);
  transition: width 0.3s ease;
}
```

```tsx
<div
  className="progress-bar"
  style={{ "--progress": `${progress}%` } as React.CSSProperties}
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

### Error States

```tsx
<WarmCard padding="lg" className="border-[var(--color-error)]">
  <div className="flex items-start gap-4">
    <IconAlertCircle className="text-error shrink-0 mt-0.5" aria-hidden="true" />
    <div>
      <h3 className="font-semibold text-[var(--color-error)]">Error Loading Data</h3>
      <p className="text-theme-secondary mt-1">
        We couldn't load your content. Please try again.
      </p>
      <ModernButton variant="outline" className="mt-4" onClick={retry}>
        Retry
      </ModernButton>
    </div>
  </div>
</WarmCard>
```

### Toast Notifications

```tsx
<div
  role="status"
  aria-live="polite"
  className="fixed bottom-4 right-4 bg-[var(--surface-elevated)] border border-[var(--border-primary)]
             rounded-xl shadow-xl p-4 min-w-[300px] animate-slide-in-up"
>
  <div className="flex items-center gap-3">
    <IconCheckCircle className="text-success shrink-0" aria-hidden="true" />
    <p className="text-theme-primary font-medium">Changes saved successfully</p>
  </div>
</div>
```

### Accordion (Progressive Disclosure)

```tsx
<WarmCard padding="none">
  <button
    aria-expanded={isOpen}
    aria-controls="content-id"
    onClick={() => setIsOpen(!isOpen)}
    className="w-full flex justify-between items-center p-6 text-left"
  >
    <h3 className="font-semibold">Section Title</h3>
    <IconChevronDown
      className={cn(
        "transition-transform duration-200",
        isOpen && "rotate-180"
      )}
      aria-hidden="true"
    />
  </button>

  <div
    id="content-id"
    hidden={!isOpen}
    className="px-6 pb-6"
  >
    Disclosed content
  </div>
</WarmCard>
```

### Selection Highlight

```css
/* globals.css — custom text selection color */
::selection {
  background: var(--border-accent);
  color: var(--text-primary);
}
```

---

## Implementation Guide

### Quick Start Checklist

**1. Containers — always use WarmCard:**
```tsx
<WarmCard hover padding="lg">
  <h2 className="text-2xl font-bold tracking-tight mb-2">Card Title</h2>
  <p className="text-theme-secondary">Content description</p>
  <ModernButton variant="accent" className="mt-4">Action</ModernButton>
</WarmCard>
```

**2. Colors — always use CSS variables:**
```tsx
// Semantic tokens (preferred)
className="text-theme-primary"          // var(--text-primary)
className="text-theme-secondary"        // var(--text-secondary)
className="bg-[var(--surface-elevated)]" // Surface

// Tailwind color aliases
className="text-primary"               // var(--color-primary)
className="bg-neutral-50"              // var(--neutral-50)
className="border-theme-primary"       // var(--border-primary)

// NEVER hardcode
className="text-[#2563EB]"  // BAD — breaks dark mode
className="bg-white"        // BAD — hardcoded, breaks dark mode
className="bg-[var(--surface-primary)]"  // GOOD
```

**3. Typography:**
```tsx
// Headings
<h2 className="text-3xl font-bold tracking-tight text-balance">
  Section Heading
</h2>

// Body
<p className="text-theme-secondary leading-relaxed text-pretty">
  Description text that wraps nicely.
</p>

// Use Heading component for semantic hierarchy
<Heading level={2}>Section Title</Heading>
```

**4. Spacing:**
```tsx
// Section level
<section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto">
    ...
  </div>
</section>

// Component level
<div className="flex flex-col gap-4 md:gap-6">
  ...
</div>
```

**5. Animations with accessibility:**
```tsx
const shouldReduceMotion = useReducedMotion();

<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, type: "spring" }}
>
  Content
</motion.section>
```

**6. Accessibility fundamentals:**
```tsx
// Focus ring (built into ModernButton and globals.css)
className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)]"

// Touch targets (min 44px)
className="min-h-touch"   // via tailwind.config.ts

// ARIA
<button aria-label="Close menu">
  <IconClose aria-hidden="true" />
</button>

// Skip link (use SkipToContent component)
<SkipToContent />
```

### Tailwind Class Organization

Order classes consistently using `cn()`:

```tsx
className={cn(
  // 1. Layout (display, position, flex/grid)
  "flex items-center justify-between",

  // 2. Sizing
  "w-full max-w-5xl",

  // 3. Spacing
  "px-6 py-3 gap-4",

  // 4. Typography
  "text-base font-semibold tracking-tight",

  // 5. Colors & surfaces
  "text-theme-primary bg-[var(--surface-elevated)]",

  // 6. Borders
  "rounded-xl border border-[var(--border-primary)]",

  // 7. Shadows
  "shadow-md",

  // 8. Transitions & transforms
  "transition-all duration-200 hover:-translate-y-0.5",

  // 9. Focus/accessibility
  "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",

  // 10. Conditional classes last
  isActive && "border-[var(--border-accent)]"
)}
```

### Creating New Components

1. Check `src/components/ui/` — the needed primitive may already exist
2. Define TypeScript `interface` for props with `className?: string`
3. Use `cn()` for class composition
4. Reference CSS custom properties, never hardcode hex values
5. Add ARIA labels and keyboard support
6. Ensure 44px min touch targets
7. Test `prefers-reduced-motion` for any animations
8. Verify dark mode with `.dark` class on `<html>`

### Performance Checklist

- [ ] CSS layers configured (`@layer base, components, utilities` — three layers only)
- [ ] All colors use CSS variables (never hardcoded)
- [ ] Variable fonts loaded via Next.js layout inline styles
- [ ] Images use `next/image` with `priority` for above-fold
- [ ] Animations use `transform`/`opacity` only (GPU-composited)
- [ ] Reduced motion support in all animated components
- [ ] `content-visibility: auto` on heavy off-screen sections
- [ ] Bundle size monitored with `npm run analyze`

---

## Related Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Complete application overview and conventions
- **[COMPONENTS.md](./COMPONENTS.md)** — Component library reference
- Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## References

- **Tailwind CSS v4:** https://tailwindcss.com
- **Framer Motion:** https://www.framer.com/motion
- **WCAG 2.2 Guidelines:** https://www.w3.org/WAI/WCAG22/quickref
- **Next.js Optimization:** https://nextjs.org/docs/app/building-your-application/optimizing
- **Contrast Checker:** https://webaim.org/resources/contrastchecker

---

*Last Updated: March 2026*
