# Isaac Vazquez Portfolio — Design System

## Overview
A modern, minimal portfolio system inspired by premium product companies (Linear, Vercel, Stripe, Notion, Mouthwash) with UC Berkeley influence. Built for Product Management recruiting and professional storytelling.

---

## Visual Principles

### Core Values
- **Minimal & Clean**: Strong whitespace, clear hierarchy, uncluttered
- **Premium & Polished**: High trust, professional, refined
- **Human & Warm**: Approachable, authentic, not corporate
- **Motion-Aware**: Subtle animations, smooth transitions, purposeful movement

### Design Inspiration
- **Mouthwash Studio**: Editorial layout, bold typography, sophisticated color
- **Linear**: Precision, clarity, purposeful animation
- **Vercel**: Clean grids, strong contrast, modern sans-serif
- **Stripe**: Trust, polish, subtle gradients
- **Notion**: Warmth, accessibility, human-centered

---

## Color Palette

### Primary Colors
```css
--berkeley-blue: #003262      /* Primary brand, headers, key CTAs */
--berkeley-gold: #FDB515      /* Accent, highlights, active states */
--deep-navy: #0A1929          /* Text primary, dark backgrounds */
--warm-gold: #C4820E          /* Darker gold for text/borders */
```

### Neutral Scale
```css
--neutral-50: #FAFAF9         /* Page background */
--neutral-100: #F5F5F4        /* Surface background */
--neutral-200: #E7E5E4        /* Subtle borders */
--neutral-300: #D6D3D1        /* Borders */
--neutral-400: #A8A29E        /* Disabled text */
--neutral-500: #78716C        /* Secondary text */
--neutral-600: #57534E        /* Body text */
--neutral-700: #44403C        /* Emphasized text */
--neutral-800: #292524        /* Headings */
--neutral-900: #1C1917        /* Black */
```

### Semantic Colors
```css
--text-primary: var(--neutral-800)
--text-secondary: var(--neutral-600)
--text-tertiary: var(--neutral-500)

--surface-primary: #FFFFFF
--surface-secondary: var(--neutral-50)
--surface-elevated: #FFFFFF

--border-subtle: var(--neutral-200)
--border-default: var(--neutral-300)
--border-strong: var(--neutral-400)

--accent-primary: var(--berkeley-blue)
--accent-secondary: var(--berkeley-gold)
--accent-hover: #004080        /* Darker blue for hover */
```

### Gradients
```css
--gradient-hero: linear-gradient(135deg, #003262 0%, #004080 100%)
--gradient-subtle: linear-gradient(180deg, #FAFAF9 0%, #FFFFFF 100%)
--gradient-gold: linear-gradient(135deg, #FDB515 0%, #C4820E 100%)
--gradient-accent: linear-gradient(135deg, #003262 0%, #0A4F8C 50%, #FDB515 100%)
```

---

## Typography

### Font Stack
```css
/* Primary: Söhne (fallback to Inter) */
--font-primary: 'Söhne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace: JetBrains Mono */
--font-mono: 'JetBrains Mono', 'SF Mono', 'Roboto Mono', monospace;
```

### Type Scale
```css
/* Display (Hero sections) */
--text-display-2xl: 72px / 1.1      /* 72px, tight leading */
--text-display-xl: 60px / 1.1       /* 60px */
--text-display-lg: 48px / 1.15      /* 48px */

/* Headings */
--text-h1: 40px / 1.2               /* 40px */
--text-h2: 32px / 1.25              /* 32px */
--text-h3: 24px / 1.3               /* 24px */
--text-h4: 20px / 1.4               /* 20px */
--text-h5: 18px / 1.4               /* 18px */

/* Body */
--text-xl: 20px / 1.6               /* 20px, relaxed */
--text-lg: 18px / 1.6               /* 18px */
--text-base: 16px / 1.6             /* 16px, base body */
--text-sm: 14px / 1.5               /* 14px */
--text-xs: 12px / 1.4               /* 12px */
```

### Font Weights
```css
--weight-light: 300
--weight-regular: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
```

### Usage Guidelines
- **Display text**: Medium weight (500), tight leading, generous spacing
- **Headings**: Semibold (600) for hierarchy
- **Body text**: Regular (400), 16px base, 1.6 line height
- **Labels/UI**: Medium (500), 14px, uppercase or sentence case
- **Emphasis**: Semibold (600), not italic

---

## Spacing System

### Scale (8px base)
```css
--space-1: 4px      /* 0.25rem */
--space-2: 8px      /* 0.5rem */
--space-3: 12px     /* 0.75rem */
--space-4: 16px     /* 1rem */
--space-5: 20px     /* 1.25rem */
--space-6: 24px     /* 1.5rem */
--space-8: 32px     /* 2rem */
--space-10: 40px    /* 2.5rem */
--space-12: 48px    /* 3rem */
--space-16: 64px    /* 4rem */
--space-20: 80px    /* 5rem */
--space-24: 96px    /* 6rem */
--space-32: 128px   /* 8rem */
```

### Layout Spacing
```css
--section-spacing-sm: 64px          /* Mobile sections */
--section-spacing-md: 96px          /* Tablet sections */
--section-spacing-lg: 128px         /* Desktop sections */

--container-padding-sm: 20px        /* Mobile padding */
--container-padding-md: 40px        /* Tablet padding */
--container-padding-lg: 80px        /* Desktop padding */

--content-gap-sm: 24px              /* Small element gaps */
--content-gap-md: 40px              /* Medium gaps */
--content-gap-lg: 64px              /* Large gaps */
```

---

## Grid System

### Container Widths
```css
--container-sm: 640px               /* Small content */
--container-md: 768px               /* Medium content (prose) */
--container-lg: 1024px              /* Large content */
--container-xl: 1280px              /* Extra large (page max) */
```

### Columns
- **Desktop**: 12-column grid, 24px gap
- **Tablet**: 8-column grid, 20px gap
- **Mobile**: 4-column grid, 16px gap

### Layout Patterns
```
Hero:           Full width, centered content (max 1024px)
Content:        768px max width for prose
Cards:          Grid: 3 cols desktop, 2 tablet, 1 mobile
Sidebar:        2/3 content + 1/3 sidebar on desktop
```

---

## Elevation & Shadows

### Shadow Scale
```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)
```

### Elevation Usage
- **Cards**: shadow-sm default, shadow-md hover
- **Modals**: shadow-xl
- **Dropdowns**: shadow-lg
- **Sticky nav**: shadow-sm

---

## Border Radius

```css
--radius-sm: 4px                    /* Buttons, inputs */
--radius-md: 8px                    /* Cards, containers */
--radius-lg: 12px                   /* Large cards */
--radius-xl: 16px                   /* Hero sections */
--radius-full: 9999px               /* Pills, avatars */
```

---

## Motion & Animation

### Timing Functions
```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Durations
```css
--duration-fast: 150ms              /* Micro-interactions */
--duration-base: 250ms              /* Standard transitions */
--duration-slow: 350ms              /* Complex animations */
--duration-slower: 500ms            /* Page transitions */
```

### Animation Patterns
```css
/* Fade in */
opacity: 0 → 1
duration: 250ms
easing: ease-out

/* Slide up */
transform: translateY(20px) → translateY(0)
opacity: 0 → 1
duration: 350ms
easing: ease-out

/* Scale */
transform: scale(0.95) → scale(1)
duration: 150ms
easing: ease-out

/* Hover lift */
transform: translateY(0) → translateY(-4px)
shadow: sm → md
duration: 250ms
easing: ease-out
```

### Reduced Motion
Always respect `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Patterns

### Buttons

**Primary Button**
```
Background: berkeley-blue
Text: white
Padding: 12px 24px
Border radius: 8px
Font: 16px medium
Hover: darker blue + shadow-md
Active: scale(0.98)
```

**Secondary Button**
```
Background: transparent
Border: 2px solid berkeley-blue
Text: berkeley-blue
Padding: 10px 22px (account for border)
Hover: background berkeley-blue, text white
```

**Ghost Button**
```
Background: transparent
Text: neutral-700
Padding: 12px 24px
Hover: background neutral-100
```

### Cards

**Standard Card**
```
Background: white
Border: 1px solid neutral-200
Border radius: 12px
Padding: 32px
Shadow: shadow-sm
Hover: shadow-md + translateY(-4px)
Transition: 250ms ease-out
```

**Feature Card**
```
Background: gradient-subtle
Border: 1px solid neutral-200
Border radius: 16px
Padding: 40px
Shadow: shadow-md
```

### Links

**Inline Link**
```
Color: berkeley-blue
Underline: 1px solid transparent
Hover: underline berkeley-blue
Transition: 150ms
```

**Nav Link**
```
Color: neutral-600
Font: 16px medium
Hover: color neutral-900
Active: color berkeley-blue + gold underline
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px              /* Mobile landscape */
--breakpoint-md: 768px              /* Tablet */
--breakpoint-lg: 1024px             /* Desktop */
--breakpoint-xl: 1280px             /* Large desktop */
--breakpoint-2xl: 1536px            /* Extra large */
```

### Mobile-First Approach
```css
/* Base styles: mobile */
.element { }

/* Tablet and up */
@media (min-width: 768px) { }

/* Desktop and up */
@media (min-width: 1024px) { }
```

---

## Accessibility Standards

### Contrast Ratios
- **Body text**: Minimum 4.5:1 (WCAG AA)
- **Large text**: Minimum 3:1
- **Target**: 7:1+ for optimal readability

### Focus States
```css
outline: 2px solid berkeley-blue
outline-offset: 2px
border-radius: 4px
```

### Interactive Targets
- Minimum 44×44px touch target
- 8px minimum spacing between targets

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Skip links provided
- Focus visible at all times

---

## Icons & Graphics

### Icon System
- **Library**: Heroicons, Tabler Icons, or Lucide
- **Size**: 16px, 20px, 24px, 32px
- **Stroke**: 1.5px - 2px
- **Style**: Outline (primary), Solid (accents)

### Imagery
- **Aspect ratios**: 16:9 (landscapes), 1:1 (avatars), 3:2 (projects)
- **Corners**: 12px border radius for images
- **Overlays**: rgba(0, 50, 98, 0.6) for text overlays
- **Filters**: Subtle saturation/contrast adjustments for brand consistency

---

## Content Guidelines

### Voice & Tone
- **Clear**: Simple sentences, active voice
- **Concise**: No jargon, no filler, no em dashes
- **Human**: Conversational, authentic, not corporate
- **Confident**: Direct, purposeful, not apologetic

### Writing Patterns
```
Good: "I built a voter targeting model that increased turnout by 12%."
Bad: "Led the development of an innovative AI-powered solution that leveraged machine learning to optimize voter engagement strategies—resulting in significant improvements."

Good: "Product Manager focused on cloud AI tools."
Bad: "Passionate thought leader driving transformative product experiences."
```

### Formatting
- **Headings**: Sentence case (not title case)
- **Lists**: Use bullets for scannability
- **Emphasis**: Bold for key points, avoid italics
- **Numbers**: Use numerals (12%, not twelve percent)

---

## Implementation Notes

### CSS Architecture
```
Tailwind CSS v4 (utility-first)
Custom properties for tokens
Component classes for patterns
Responsive modifiers
Dark mode support (optional)
```

### Performance
- Lazy load images below fold
- Preload critical fonts
- Optimize images (WebP, AVIF)
- Code split by route
- Minimal third-party scripts

### SEO
- Semantic HTML
- Meta tags (title, description, OG)
- Structured data (JSON-LD)
- Accessible images (alt text)
- Fast Core Web Vitals

---

## Quick Reference

### Common Patterns
```css
/* Hero section */
background: gradient-hero
text: white
padding: 96px 0
max-width: 1024px
center aligned

/* Content section */
background: white or neutral-50
padding: 80px 0
max-width: 768px

/* Card grid */
grid: 3 columns
gap: 32px
card: shadow-sm, hover shadow-md

/* Footer */
background: neutral-900
text: neutral-300
padding: 64px 0
```

---

**Last updated**: November 2025
**Version**: 1.0
**Owner**: Isaac Vazquez
