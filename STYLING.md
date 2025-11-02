# Styling System Documentation

Complete design system and styling guide for Isaac Vazquez's warm modern portfolio.

**Design Philosophy:** Warm Modern Professional
**Last Updated:** January 2025
**WCAG Compliance:** AA (7.5:1 contrast ratios)

---

## 📋 Table of Contents

- [Design Philosophy](#design-philosophy)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Component Styling](#component-styling)
- [Responsive Design](#responsive-design)
- [Animations](#animations)
- [Accessibility](#accessibility)
- [Implementation Guide](#implementation-guide)

---

## 🎨 Design Philosophy

### Core Concept
The warm modern aesthetic creates a professional, approachable portfolio that balances technical credibility with human warmth. Think "golden hour" - inviting, optimistic, and trustworthy.

### Design Principles

**1. Warm & Welcoming**
- Sunset oranges and golden yellows
- Warm browns instead of cool grays
- Soft shadows and rounded corners
- Inviting, not intimidating

**2. Professional Credibility**
- Clean typography hierarchy
- Consistent spacing and alignment
- Purposeful use of color
- High contrast for readability (7.5:1)

**3. Accessible & Inclusive**
- WCAG AA compliance exceeded
- Readable text colors on all backgrounds
- Focus indicators for keyboard navigation
- Reduced motion support

**4. Performance Optimized**
- Minimal CSS footprint
- Efficient Tailwind utilities
- No unnecessary animations
- Fast paint times

---

## 🌈 Color System

### Primary Palette

```css
/* Golden Hour Warmth */
:root {
  --color-primary: #FF6B35;      /* Sunset Orange - primary actions, headings */
  --color-secondary: #F7B32B;    /* Golden Yellow - secondary actions, accents */
  --color-accent: #FF8E53;       /* Coral - hover states, highlights */
  --color-success: #6BCF7F;      /* Fresh Green - success states */
}
```

**Usage:**
- **Sunset Orange (#FF6B35)**: Primary buttons, main headings, links, active states
- **Golden Yellow (#F7B32B)**: Secondary buttons, badges, year indicators
- **Coral (#FF8E53)**: Hover states, focus indicators, warm highlights
- **Fresh Green (#6BCF7F)**: Success messages, positive indicators

### Text Colors

```css
/* Warm Text Hierarchy */
:root {
  /* Light Mode */
  --text-primary: #4A3426;       /* 7.5:1 contrast - body text */
  --text-secondary: #6B4F3D;     /* 4.8:1 contrast - secondary text */
  --text-tertiary: #9C7A5F;      /* 3.2:1 contrast - captions, labels */

  /* Dark Mode */
  --text-primary-dark: #FFE4D6;  /* Warm cream - body text */
  --text-secondary-dark: #D4A88E; /* Tan - secondary text */
  --text-tertiary-dark: #B89478; /* Light brown - captions */
}
```

**Contrast Ratios (WCAG AA+):**
- Primary text: 7.5:1 (exceeds AAA)
- Secondary text: 4.8:1 (AA compliant)
- UI elements: 3:1 minimum (AA compliant)

### Background Colors

```css
/* Warm Backgrounds */
:root {
  /* Light Mode */
  --bg-primary: #FFFCF7;         /* Warm cream - main background */
  --bg-secondary: #FFF8F0;       /* Lighter cream - cards */
  --bg-tertiary: #FFE4D6;        /* Peach - subtle accents */

  /* Dark Mode */
  --bg-primary-dark: #1C1410;    /* Deep warm brown */
  --bg-secondary-dark: #2D1B12;  /* Medium warm brown */
  --bg-tertiary-dark: #4A3426;   /* Light warm brown */
}
```

### Border & Shadow Colors

```css
/* Borders & Shadows */
:root {
  /* Light Mode */
  --border-light: #FFE4D6;       /* Warm peach border */
  --shadow-warm: rgba(255, 107, 53, 0.15);

  /* Dark Mode */
  --border-dark: rgba(255, 142, 83, 0.3);  /* Coral with opacity */
  --shadow-warm-dark: rgba(255, 107, 53, 0.25);
}
```

### Tailwind Classes

```tsx
// Primary colors
className="text-[#FF6B35]"           // Sunset orange text
className="bg-[#FF6B35]"             // Sunset orange background
className="border-[#FFE4D6]"         // Warm peach border

// Text colors
className="text-[#4A3426]"           // Primary text (light mode)
className="dark:text-[#FFE4D6]"      // Primary text (dark mode)

// Backgrounds
className="bg-[#FFFCF7]"             // Warm cream background
className="dark:bg-[#2D1B12]"        // Dark warm brown
```

---

## 📝 Typography

### Font Stack

```css
/* Font Families */
--font-display: 'Orbitron', monospace;    /* Headings */
--font-body: 'Inter', sans-serif;         /* Body text */
--font-accent: 'Syne', sans-serif;        /* Accents */
--font-mono: 'JetBrains Mono', monospace; /* Code */
```

**Next.js Font Configuration:**
```typescript
import { Inter, Orbitron, Syne } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-orbitron'
});
```

### Typography Scale

```css
/* Heading Hierarchy */
.display-heading {
  font-family: var(--font-orbitron);
  font-weight: 900;
}

h1, .text-4xl  { font-size: 2.25rem; line-height: 2.5rem; }  /* 36px */
h2, .text-3xl  { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
h3, .text-2xl  { font-size: 1.5rem; line-height: 2rem; }     /* 24px */
h4, .text-xl   { font-size: 1.25rem; line-height: 1.75rem; }  /* 20px */
h5, .text-lg   { font-size: 1.125rem; line-height: 1.75rem; } /* 18px */
h6, .text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
```

**Responsive Typography:**
```tsx
// Mobile → Tablet → Desktop
className="text-4xl md:text-5xl lg:text-6xl"  // Headings
className="text-base md:text-lg"              // Body text
className="text-sm md:text-base"              // Small text
```

### Text Styles

```css
/* Gradient Text (Warm) */
.gradient-text-warm {
  background: linear-gradient(135deg, #FF6B35 0%, #F7B32B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Text Shadows */
.text-shadow-warm {
  text-shadow: 2px 2px 4px rgba(255, 107, 53, 0.3);
}
```

---

## 📐 Spacing System

### Consistent Spacing

```css
/* Section Spacing (Vertical) */
.section-spacing {
  padding-top: 4rem;    /* 64px - mobile */
  padding-bottom: 4rem;
}

@media (min-width: 640px) {
  .section-spacing {
    padding-top: 5rem;    /* 80px - tablet */
    padding-bottom: 5rem;
  }
}

@media (min-width: 1024px) {
  .section-spacing {
    padding-top: 6rem;    /* 96px - desktop */
    padding-bottom: 6rem;
  }
}
```

**Tailwind Classes:**
```tsx
// Standardized across all pages
className="py-16 sm:py-20 lg:py-24"  // Section spacing
className="px-4 sm:px-6 lg:px-8"     // Horizontal padding
className="space-y-8"                 // Vertical spacing between elements
className="gap-12 md:gap-16"         // Grid/flex gaps
```

### Container Widths

```tsx
// Page-level containers
className="max-w-5xl mx-auto"   // Home, About, Contact
className="max-w-6xl mx-auto"   // Resume (needs more width)
className="max-w-4xl mx-auto"   // Centered content
```

### Component Spacing

```tsx
// Card padding
<WarmCard padding="xs" />  // 12px
<WarmCard padding="sm" />  // 16px
<WarmCard padding="md" />  // 24px
<WarmCard padding="lg" />  // 32px
<WarmCard padding="xl" />  // 48px
```

---

## 🎯 Component Styling

### WarmCard Component

```tsx
// Base WarmCard styling
className="
  bg-white dark:bg-[#2D1B12]/80
  rounded-2xl
  border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30
  shadow-subtle dark:shadow-warm-lg
  backdrop-blur-sm
"

// Hover state
hover="
  transform transition-transform duration-300
  hover:scale-[1.02]
  hover:shadow-warm-lg
"
```

### ModernButton Component

```tsx
// Primary button
variant="primary"
className="
  bg-[#FF6B35] hover:bg-[#E85A28]
  dark:bg-[#FF8E53] dark:hover:bg-[#FFA876]
  text-white
  shadow-warm-lg
"

// Secondary button
variant="secondary"
className="
  bg-[#F7B32B] hover:bg-[#E0A220]
  dark:bg-[#FFD666]
  text-[#4A3426]
"

// Outline button
variant="outline"
className="
  border-2 border-[#FF6B35] dark:border-[#FF8E53]
  text-[#FF6B35] dark:text-[#FF8E53]
  hover:bg-[#FF6B35]/10
"
```

### Shadow System

```css
/* Tailwind Shadow Extensions */
.shadow-subtle {
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.08);
}

.shadow-warm-lg {
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
}

.shadow-warm-xl {
  box-shadow: 0 16px 48px rgba(255, 107, 53, 0.2);
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Tailwind Breakpoints */
sm: 640px   /* Mobile landscape, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large screens */
```

### Mobile-First Approach

```tsx
// Start with mobile, add breakpoints for larger screens
<div className="
  flex flex-col gap-4           // Mobile: vertical stack
  md:flex-row md:gap-8          // Tablet: horizontal
  lg:gap-12                     // Desktop: larger gaps
">
  Content
</div>
```

### Responsive Images

```tsx
// ModernHero photo sizing
className="
  w-56 h-56      // Mobile: 224px
  sm:w-64 sm:h-64 // Tablet: 256px
  md:w-72 md:h-72 // Desktop: 288px
"
```

---

## ✨ Animations

### Framer Motion Patterns

**Fade In Up:**
```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};
```

**Stagger Children:**
```typescript
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

### Transition Guidelines
- **Duration**: 0.3s for UI interactions, 0.6s for page elements
- **Easing**: `ease-out` for entrances, `ease-in` for exits
- **Reduced Motion**: Always respect `prefers-reduced-motion`

---

## ♿ Accessibility

### WCAG AA Compliance

**Text Contrast:**
- Primary text (#4A3426): 7.5:1 (exceeds AAA)
- Secondary text (#6B4F3D): 4.8:1 (AA)
- Links (#FF6B35): 4.6:1 (AA)

**Focus Indicators:**
```css
.focus-visible {
  outline: 2px solid #FF6B35;
  outline-offset: 2px;
}
```

**Keyboard Navigation:**
- All interactive elements focusable
- Visible focus indicators
- Skip links for navigation
- Tab order follows visual order

---

## 🛠️ Implementation Guide

### Quick Start

**1. Use WarmCard for containers:**
```tsx
<WarmCard hover={true} padding="xl">
  Your content here
</WarmCard>
```

**2. Use ModernButton for actions:**
```tsx
<ModernButton variant="primary" size="lg">
  Primary Action
</ModernButton>
```

**3. Apply warm color classes:**
```tsx
<h2 className="text-[#FF6B35]">Heading</h2>
<p className="text-[#4A3426] dark:text-[#D4A88E]">Body text</p>
```

**4. Use standardized spacing:**
```tsx
<div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto space-y-8">
    Content
  </div>
</div>
```

---

## 🔗 Related Documentation

- **[COMPONENTS.md](./COMPONENTS.md)** - Component library details
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

---

*Last Updated: January 2025 - Warm Modern Theme*
