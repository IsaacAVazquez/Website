# Isaac Vazquez Digital Platform - Styling Guide

> **Comprehensive design system documentation for the Isaac Vazquez dual-purpose platform: Professional Portfolio + Fantasy Football Analytics Platform**

**Version:** 1.0.0
**Last Updated:** January 2025
**Design Philosophy:** Cyberpunk Professional Aesthetic

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Patterns](#component-patterns)
6. [Glassmorphism System](#glassmorphism-system)
7. [Animation Standards](#animation-standards)
8. [Accessibility](#accessibility)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)

---

## Design Philosophy

### Core Concept
The platform combines **professional credibility** with a **cutting-edge cyberpunk aesthetic**, creating an immersive digital experience that reflects modern technology while maintaining enterprise-grade usability.

### Key Principles

**1. Professional Cyberpunk**
- Dark backgrounds with strategic neon accents
- High contrast for readability and visual impact
- Terminal-inspired interfaces with modern polish
- Futuristic without sacrificing usability

**2. Data-First Design**
- Fantasy analytics require clear data visualization
- Metrics should be scannable and actionable
- Charts and graphs prioritize clarity over decoration
- Professional resume must remain ATS-friendly

**3. Immersive Experience**
- Full-screen layouts for hero sections
- Glassmorphism for depth and hierarchy
- Smooth animations that don't distract
- Strategic use of glowing effects

**4. Accessibility-Driven**
- WCAG AA compliance minimum
- High contrast color combinations
- Focus states clearly visible
- Keyboard navigation support
- Reduced motion preferences respected

### Target Audience

**Primary:** Hiring managers, recruiters, tech professionals
**Secondary:** Fantasy football enthusiasts, data-driven users
**Technical Level:** High - comfortable with data and analytics
**Experience Expectation:** Modern, fast, visually impressive

---

## Color System

### Primary Palette

Our color system uses **neon accents on dark backgrounds** to create the signature cyberpunk aesthetic while maintaining professional credibility.

#### Brand Colors

```css
/* Primary - Electric Blue */
--color-primary: #00F5FF          /* Light mode */
--color-primary: #00D4FF          /* Dark mode - slightly muted */

Usage: Primary CTAs, links, headings, focus states
Accessibility: 4.5:1 contrast ratio on dark backgrounds
```

```css
/* Secondary - Matrix Green */
--color-secondary: #39FF14        /* Light mode */
--color-secondary: #00FF41        /* Dark mode - brighter */

Usage: Success states, positive metrics, highlights, data points
Accessibility: 5.2:1 contrast ratio on dark backgrounds
```

```css
/* Accent - Neon Purple */
--color-accent: #BF00FF           /* Light mode */
--color-accent: #DD00FF           /* Dark mode - more vibrant */

Usage: Tertiary accents, special features, CTAs, interests
Accessibility: 4.8:1 contrast ratio on dark backgrounds
```

```css
/* Tertiary - Cyber Teal */
--color-tertiary: #00FFBF         /* Light mode */
--color-tertiary: #00E6CC         /* Dark mode */

Usage: Additional accent, alternate data visualization
Accessibility: 5.5:1 contrast ratio on dark backgrounds
```

#### Semantic Colors

```css
/* Warning */
--color-warning: #FFB800

Usage: Warnings, caution states, attention items
```

```css
/* Error */
--color-error: #FF073A

Usage: Errors, critical states, destructive actions
```

#### Neutral Scale

8-tone grayscale for text, backgrounds, and UI elements:

```css
--neutral-50: #F8FAFC    /* Lightest - light mode text */
--neutral-100: #F1F5F9
--neutral-200: #E2E8F0
--neutral-300: #CBD5E1
--neutral-400: #94A3B8   /* Mid-tone - secondary text */
--neutral-500: #64748B
--neutral-600: #475569
--neutral-700: #334155
--neutral-800: #1E293B   /* Dark backgrounds */
--neutral-900: #0F172A   /* Darkest - primary dark bg */
--neutral-950: #020617   /* Terminal black */
```

#### Terminal Colors

Special colors for terminal-style interfaces:

```css
--terminal-bg: #0A0A0B         /* Near-black background */
--terminal-border: #1A1A1B     /* Subtle border */
--terminal-text: #00FF00       /* Classic green terminal text */
--terminal-cursor: #00F5FF     /* Electric blue cursor */
```

### Color Usage Guidelines

#### When to Use Each Color

**Electric Blue (`--color-primary`)**
- Primary buttons and CTAs
- Main navigation links
- Section headings
- Interactive element hover states
- Focus indicators

**Matrix Green (`--color-secondary`)**
- Success messages and confirmations
- Positive metrics and KPIs
- Data visualization (positive trends)
- Terminal-style text effects
- Bullet points and list markers

**Neon Purple (`--color-accent`)**
- Special features or premium content
- Tertiary CTAs
- Interest/hobby tags
- Alternative data points
- Creative accents

**Cyber Teal (`--color-tertiary`)**
- Supporting data visualization
- Alternative highlights
- Complementary accents
- Additional metrics

#### Contrast Requirements

**Text on Dark Backgrounds:**
- Body text: Minimum 7:1 (use neutral-50 or neutral-100)
- Large text (18pt+): Minimum 4.5:1
- Interactive elements: Minimum 4.5:1

**Accessible Alternatives:**

For cases requiring enhanced accessibility, use these adjusted colors:

```css
--color-primary-accessible: #0066CC
--color-secondary-accessible: #228B22
--color-accent-accessible: #8B008B
```

### Gradient Patterns

**Primary Gradient (Blue to Green):**
```css
background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
```
Usage: Hero sections, featured cards, premium elements

**Accent Gradient (Purple to Teal):**
```css
background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-tertiary) 100%);
```
Usage: Alternative highlights, special sections

**Subtle Background Gradient:**
```css
background: linear-gradient(to bottom right,
  rgba(15, 23, 42, 0.5) 0%,
  rgba(30, 41, 59, 0.3) 50%,
  rgba(51, 65, 85, 0.2) 100%
);
```
Usage: Page backgrounds, large containers

### Glow Effects

Our signature cyberpunk aesthetic uses strategic glow effects:

```css
/* Primary Glow - Electric Blue */
--glow-primary: 0 0 20px rgba(0, 245, 255, 0.3);
box-shadow: var(--glow-primary);
```

```css
/* Secondary Glow - Matrix Green */
--glow-secondary: 0 0 20px rgba(57, 255, 20, 0.3);
```

```css
/* Accent Glow - Neon Purple */
--glow-accent: 0 0 20px rgba(191, 0, 255, 0.3);
```

```css
/* Subtle Glow - Reduced intensity */
--glow-subtle: 0 0 15px rgba(0, 245, 255, 0.2);
```

**Usage Guidelines:**
- Use on interactive elements (buttons, cards) on hover
- Apply to focused form inputs
- Highlight important metrics or data
- Enhance glassmorphism effects
- **Never** use more than 2 simultaneous glows in one viewport

---

## Typography

### Font Families

**Orbitron** - Display/Heading Font (Cyberpunk, Futuristic)
```css
--font-heading: 'Orbitron', sans-serif;
```
Usage: All headings (h1-h6), prominent labels, section titles, brand name

**Inter** - Body/UI Font (Readable, Professional)
```css
--font-body: 'Inter', sans-serif;
--font-accent: 'Inter', sans-serif;
```
Usage: Body text, paragraphs, general UI elements, descriptions

**JetBrains Mono** - Monospace/Terminal Font (Technical)
```css
--font-mono: 'JetBrains Mono', monospace;
--font-terminal: 'JetBrains Mono', monospace;
```
Usage: Code blocks, terminal interfaces, data tables, technical labels, metrics

### Type Scale

Based on fluid typography with `clamp()` for responsive sizing:

```css
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);     /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);       /* 14-16px */
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);       /* 16-18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);      /* 18-20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);       /* 20-24px */
--text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);        /* 24-32px */
--text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);    /* 30-40px */
--text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3rem);        /* 36-48px */
--text-5xl: clamp(3rem, 2rem + 5vw, 4rem);                /* 48-64px */
--text-6xl: clamp(3.75rem, 2.5rem + 6.25vw, 5rem);        /* 60-80px */
--text-7xl: clamp(4.5rem, 3rem + 7.5vw, 6rem);            /* 72-96px */
```

### Typography Hierarchy

#### Headings

**H1 - Page Titles**
- Font: Orbitron
- Size: `text-3xl` to `text-5xl` (30-64px)
- Weight: 800 (extrabold)
- Color: Electric Blue gradient or white
- Usage: Main page title (e.g., "ISAAC VAZQUEZ")

**H2 - Section Headings**
- Font: Orbitron
- Size: `text-xl` to `text-3xl` (20-40px)
- Weight: 700 (bold)
- Color: Electric Blue
- Usage: Main sections (Experience, Education, Skills)

**H3 - Subsection Headings**
- Font: Orbitron
- Size: `text-lg` to `text-2xl` (18-32px)
- Weight: 700 (bold)
- Color: White or Electric Blue
- Usage: Company names, job titles, card headers

**H4 - Component Headings**
- Font: Orbitron or Inter
- Size: `text-base` to `text-lg` (16-20px)
- Weight: 600-700 (semibold-bold)
- Color: Electric Blue or white
- Usage: Role titles, card subtitles

#### Body Text

**Large Body (Intro/Lead Text)**
- Font: Inter
- Size: `text-base` to `text-lg` (16-20px)
- Weight: 400 (normal)
- Line Height: 1.6
- Color: neutral-300

**Regular Body**
- Font: Inter
- Size: `text-sm` to `text-base` (14-18px)
- Weight: 400 (normal)
- Line Height: 1.5
- Color: neutral-300 or neutral-400

**Small Text (Captions, Labels)**
- Font: Inter or JetBrains Mono
- Size: `text-xs` to `text-sm` (12-16px)
- Weight: 400-500
- Line Height: 1.4
- Color: neutral-400 or neutral-500

### Line Height Standards

Following WCAG guidelines for readability:

```css
/* Headings */
h1, h2, h3: line-height: 1.2;

/* Body Text */
p, li, div: line-height: 1.5;

/* Large Text */
.lead, .intro: line-height: 1.6;

/* Dense Text (tables, data) */
table, .compact: line-height: 1.4;
```

### Letter Spacing

```css
/* Headings - Tighter tracking */
h1, h2, h3 {
  letter-spacing: -0.02em;  /* -2% */
}

/* All Caps - Wider tracking */
.uppercase, .tracking-wide {
  letter-spacing: 0.05em;   /* +5% */
}

/* Terminal/Mono - Standard */
.font-terminal, .font-mono {
  letter-spacing: 0;
}

/* Body - Normal */
p, span {
  letter-spacing: 0;
}
```

### Font Weight Scale

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

**Usage:**
- Headings: 700-800
- Body: 400
- Emphasized text: 500-600
- Labels/UI: 500-600
- Brand name: 800-900

### Text Color Patterns

```css
/* Primary Text (Headings, Important) */
color: var(--text-primary);  /* neutral-50 in dark mode */

/* Secondary Text (Body, Descriptions) */
color: var(--text-secondary);  /* neutral-400 */

/* Tertiary Text (Captions, Labels) */
color: var(--text-tertiary);  /* neutral-500 */

/* Accent Text (Links, Highlights) */
color: var(--color-primary);  /* Electric Blue */

/* Success/Positive */
color: var(--color-secondary);  /* Matrix Green */
```

---

## Spacing System

### 8-Point Grid Foundation

Our spacing system is based on the **8-point grid** (multiples of 8px) with a **4-point half-step** for fine-tuning:

**Base Unit:** 8px (0.5rem)
**Half-Step:** 4px (0.25rem)

This ensures:
- Perfect scaling across devices
- Consistency in layouts
- Easy mathematical relationships
- iOS and Android compatibility

### Spacing Scale

```css
/* Tailwind Class Equivalent → CSS Variable → Pixel Value */

/* 4pt Half-Steps */
--space-0: 0;           /* 0px */
--space-1: 0.25rem;     /* 4px - Fine adjustments */

/* 8pt Base Scale */
--space-2: 0.5rem;      /* 8px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px - Base spacing */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
```

### Semantic Spacing Tokens

For more intuitive naming:

```css
--space-xs: 0.5rem;     /* 8px */
--space-sm: 0.75rem;    /* 12px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
--space-4xl: 6rem;      /* 96px */
```

### Spacing Usage Guidelines

#### Component Padding (Internal Spacing)

**Cards & Containers:**
```css
/* Small Cards */
padding: var(--space-4) var(--space-5);  /* 16px 20px */

/* Medium Cards */
padding: var(--space-5) var(--space-6);  /* 20px 24px */

/* Large Cards */
padding: var(--space-6) var(--space-8);  /* 24px 32px */

/* Page Containers */
padding: var(--space-8) var(--space-10);  /* 32px 40px */
```

**Buttons:**
```css
/* Small Button */
padding: var(--space-2) var(--space-4);  /* 8px 16px */

/* Medium Button (Default) */
padding: var(--space-3) var(--space-6);  /* 12px 24px */

/* Large Button */
padding: var(--space-4) var(--space-8);  /* 16px 32px */
```

**Form Inputs:**
```css
/* Input Fields */
padding: var(--space-3) var(--space-4);  /* 12px 16px */

/* Textareas */
padding: var(--space-4) var(--space-4);  /* 16px 16px */
```

#### Margin (External Spacing)

**Section Spacing:**
```css
/* Between Major Sections */
margin-bottom: var(--space-16);  /* 64px */

/* Between Subsections */
margin-bottom: var(--space-8);   /* 32px */

/* Between Related Elements */
margin-bottom: var(--space-6);   /* 24px */
```

**Text Spacing:**
```css
/* Heading to Body */
margin-bottom: var(--space-4);   /* 16px */

/* Paragraph Spacing */
margin-bottom: var(--space-5);   /* 20px */

/* List Item Spacing */
margin-bottom: var(--space-3);   /* 12px */
```

#### Gap (Flexbox/Grid Spacing)

**Grid Layouts:**
```css
/* Tight Grid (Cards) */
gap: var(--space-4);    /* 16px */

/* Standard Grid */
gap: var(--space-6);    /* 24px */

/* Loose Grid */
gap: var(--space-8);    /* 32px */
```

**Flex Layouts:**
```css
/* Inline Elements (tags, pills) */
gap: var(--space-2);    /* 8px */

/* Navigation Items */
gap: var(--space-6);    /* 24px */

/* Form Groups */
gap: var(--space-4);    /* 16px */
```

### Internal ≤ External Rule

**Best Practice:** External spacing should be equal to or greater than internal spacing.

Example:
```css
.card {
  padding: 24px;        /* Internal spacing */
  margin-bottom: 32px;  /* External ≥ Internal ✓ */
}
```

This creates clear visual grouping and hierarchy.

### Responsive Spacing

Use Tailwind's responsive prefixes:

```css
/* Mobile-first approach */
p-4         /* 16px on all screens */
sm:p-6      /* 24px on small+ screens */
md:p-8      /* 32px on medium+ screens */
lg:p-10     /* 40px on large+ screens */
```

### Spacing Don'ts

❌ Don't use arbitrary values like `15px` or `37px`
❌ Don't mix spacing systems (stick to 8pt grid)
❌ Don't create uneven spacing (same elements = same spacing)
❌ Don't neglect mobile spacing (reduce by 25-50% for small screens)

---

## Container Width Standards

### Content Container System

Our container width system ensures consistent, readable content across all pages while adapting to different content types.

#### Standard Container Widths

```css
/* Blog & Text-Heavy Content */
max-w-4xl    /* 56rem / 896px */
Usage: Blog posts, articles, long-form content, focused reading
Rationale: Optimal line length for readability (60-75 characters per line)

/* Standard Content Pages */
max-w-6xl    /* 72rem / 1152px */
Usage: Resume, About, Contact, standard pages with mixed content
Rationale: Balanced layout with comfortable white space and section definition

/* Wide Data/Analytics Content */
max-w-7xl    /* 80rem / 1280px */
Usage: Fantasy Football analytics, dashboards, data tables, project galleries
Rationale: Maximum space for charts, tables, and data visualization without being overwhelming

/* Full-Width Hero Sections */
max-w-full   /* 100% */
Usage: Landing pages, hero sections, immersive experiences
Rationale: Edge-to-edge impact for first impressions
```

#### Container Application Patterns

**Blog Pages:**
```tsx
<div className="min-h-screen py-12 md:py-20">
  <div className="max-w-4xl mx-auto px-6">
    {/* Blog content */}
  </div>
</div>
```

**Standard Pages (Resume, About, Contact):**
```tsx
<div className="min-h-screen py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
  <div className="relative max-w-6xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

**Analytics/Data Pages:**
```tsx
<div className="min-h-screen py-12 px-6">
  <div className="max-w-7xl mx-auto">
    {/* Charts, tables, data visualizations */}
  </div>
</div>
```

**Hero Sections:**
```tsx
<div className="relative w-full min-h-screen">
  <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Hero content */}
  </div>
</div>
```

#### Responsive Padding Pattern

Consistent horizontal padding across all container widths:

```css
/* Mobile First */
px-4         /* 16px - Small screens */
sm:px-6      /* 24px - Small+ screens (640px+) */
lg:px-8      /* 32px - Large screens (1024px+) */
```

#### Container Selection Guidelines

**Use max-w-4xl when:**
- Content is primarily text (blog posts, articles)
- Reading comprehension is priority
- Long-form narrative content
- Typography should be focus

**Use max-w-6xl when:**
- Mixed content (text + images + components)
- Standard business pages (resume, about, contact)
- Balanced layout is needed
- Professional appearance is priority

**Use max-w-7xl when:**
- Data visualization is primary content
- Charts, graphs, or tables need space
- Multiple columns of data
- Analytics dashboards
- Project galleries with many items

**Use max-w-full when:**
- Hero sections needing full impact
- Background effects spanning viewport
- Immersive landing experiences
- Terminal-style full-screen interfaces

### Container Don'ts

❌ Don't use max-w-5xl (creates ambiguity between 4xl and 6xl)
❌ Don't mix container widths within the same page section
❌ Don't forget horizontal padding on containers
❌ Don't use fixed widths (always use max-width for responsiveness)
❌ Don't exceed max-w-7xl for readability and usability

---

## Component Patterns

### Buttons

#### Primary Button

**Usage:** Main CTAs, form submissions, primary actions

```tsx
<button className="morph-button">
  Download PDF
</button>
```

**Styles:**
- Background: Electric blue with gradient
- Text: White (neutral-50)
- Padding: `px-6 py-3` (24px 12px)
- Border Radius: `rounded-lg` (8px)
- Font: Inter, semibold (600)
- Transition: All 0.3s ease
- Hover: Scale(1.05), increased glow
- Active: Scale(0.98)

```css
.morph-button {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(0, 245, 255, 0.3);
}

.morph-button:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 245, 255, 0.5);
}

.morph-button:active {
  transform: scale(0.98);
}
```

#### Secondary Button

**Usage:** Secondary actions, cancel buttons

```tsx
<button className="border border-electric-blue/40 text-electric-blue hover:bg-electric-blue/10">
  Cancel
</button>
```

### Cards

#### GlassCard Component

Our signature component using glassmorphism:

**Elevation Levels:**

```tsx
// Level 1 - Subtle elevation
<GlassCard elevation={1}>Content</GlassCard>

// Level 2 - Standard cards
<GlassCard elevation={2}>Content</GlassCard>

// Level 3 - Important sections
<GlassCard elevation={3}>Content</GlassCard>

// Level 4 - Featured content
<GlassCard elevation={4}>Content</GlassCard>

// Level 5 - Modal overlays
<GlassCard elevation={5}>Content</GlassCard>
```

**Styling Pattern:**
```css
/* Base Glass Card */
.glass-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  transition: all 0.3s ease;
}

/* Interactive Variant */
.glass-card.interactive:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(0, 245, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 245, 255, 0.2);
}
```

### Forms

#### Input Fields

```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-slate-900/40 border border-slate-700 rounded-lg
             text-slate-100 placeholder-slate-500
             focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/20"
  placeholder="Enter text..."
/>
```

#### Textarea

```tsx
<textarea
  className="w-full px-4 py-3 bg-slate-900/40 border border-slate-700 rounded-lg
             text-slate-100 placeholder-slate-500 resize-none
             focus:border-matrix-green focus:outline-none focus:ring-2 focus:ring-matrix-green/20"
  rows={4}
/>
```

### Navigation

#### FloatingNav Pattern

```tsx
<nav className="fixed top-4 right-4 glass-card px-6 py-3 flex gap-6">
  <a href="/" className="text-slate-300 hover:text-electric-blue transition">
    Home
  </a>
  {/* More links */}
</nav>
```

### Data Display

#### Metric Card

```tsx
<div className="flex flex-col items-center text-center p-5 rounded-xl bg-gradient-to-br from-matrix-green/10 to-matrix-green/5 border border-matrix-green/30">
  <div className="p-2 bg-matrix-green/20 rounded-lg mb-3">
    <Icon className="w-5 h-5 text-matrix-green" />
  </div>
  <span className="text-sm text-slate-400 font-terminal mb-2">
    Label
  </span>
  <div className="text-3xl font-bold text-matrix-green font-heading">
    Value
  </div>
</div>
```

#### Progress Bar

```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-slate-300">Skill Name</span>
    <span className="text-slate-500">90%</span>
  </div>
  <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-matrix-green to-electric-blue rounded-full"
      style={{ width: '90%' }}
    />
  </div>
</div>
```

### Badges & Pills

```tsx
{/* Status Badge */}
<span className="px-3 py-1 rounded-full bg-matrix-green/20 border border-matrix-green/40 text-matrix-green text-sm font-semibold font-terminal">
  Active
</span>

{/* Interest Pill */}
<span className="px-5 py-2.5 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 border border-neon-purple/40 text-neon-purple text-sm font-semibold font-terminal hover:scale-105 transition">
  Interest
</span>
```

---

## Glassmorphism System

### What is Glassmorphism?

Glassmorphism is a design trend that creates a "frosted glass" effect using:
- Semi-transparent backgrounds
- Backdrop blur
- Subtle borders
- Layered depth

Our implementation uses a **5-tier elevation system** for visual hierarchy.

### Elevation Levels

#### Level 1 - Minimal Elevation
**Use Case:** Subtle backgrounds, minimal emphasis

```css
.glass-1 {
  background: rgba(30, 41, 59, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.1);
}
```

#### Level 2 - Standard Cards
**Use Case:** Regular cards, list items, non-prominent content

```css
.glass-2 {
  background: rgba(30, 41, 59, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
```

#### Level 3 - Important Sections
**Use Case:** Section containers, featured cards, important content

```css
.glass-3 {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

#### Level 4 - Hero/Featured
**Use Case:** Hero sections, primary content areas, highlights

```css
.glass-4 {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}
```

#### Level 5 - Modals/Overlays
**Use Case:** Modal dialogs, dropdown menus, overlays

```css
.glass-5 {
  background: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
}
```

### Border Treatments

**Standard Glass Border:**
```css
border: 1px solid rgba(148, 163, 184, 0.2);
```

**Accent Border (on hover):**
```css
border: 1px solid rgba(0, 245, 255, 0.4);
```

**Gradient Border:**
```css
border: 1px solid transparent;
background: linear-gradient(rgba(30, 41, 59, 0.4), rgba(30, 41, 59, 0.4)) padding-box,
            linear-gradient(135deg, var(--color-primary), var(--color-secondary)) border-box;
```

### Backdrop Blur Values

```css
/* Subtle - Background elements slightly visible */
backdrop-filter: blur(8px);

/* Standard - Clear separation but context visible */
backdrop-filter: blur(12px);

/* Strong - Clear foreground/background separation */
backdrop-filter: blur(16px);

/* Maximum - Overlay/modal level */
backdrop-filter: blur(20px);
```

### Noise Texture (Optional)

For authentic glass appearance:

```css
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
}
```

### Interactive States

```css
/* Hover State */
.glass-card:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(0, 245, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 245, 255, 0.15);
}

/* Focus State */
.glass-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 245, 255, 0.2);
}

/* Active State */
.glass-card:active {
  transform: scale(0.98);
}
```

### Best Practices

✅ **Do:**
- Use higher elevations for more important content
- Maintain consistent elevation within component types
- Reduce elevation on mobile to improve performance
- Test blur effects across browsers

❌ **Don't:**
- Stack too many glass elements (max 3 levels)
- Use glassmorphism on solid backgrounds (needs contrast)
- Over-blur (impacts readability)
- Forget fallbacks for unsupported browsers

---

## Animation Standards

### Framer Motion Integration

We use **Framer Motion** for all animations to ensure:
- Performance optimization
- Gesture support
- Reduced motion preference handling
- Server-side rendering compatibility

### Animation Timing

#### Duration Standards

```javascript
// Quick interactions (hover, click)
const quick = { duration: 0.2 };  // 200ms

// Standard transitions (entrance, state changes)
const standard = { duration: 0.3 };  // 300ms

// Smooth animations (modals, overlays)
const smooth = { duration: 0.5 };  // 500ms

// Slow/dramatic (page transitions)
const slow = { duration: 0.8 };  // 800ms
```

#### Easing Functions

```javascript
// Smooth acceleration (entrances)
const easeOut = [0.4, 0, 0.2, 1];  // cubic-bezier

// Natural movement (general use)
const easeInOut = [0.4, 0, 0.6, 1];

// Snappy (exits)
const easeIn = [0.4, 0, 1, 1];

// Bouncy (playful interactions)
const spring = {
  type: "spring",
  damping: 20,
  stiffness: 300
};
```

### Common Animation Patterns

#### Fade In

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Slide In from Bottom

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Scale In

```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

#### Stagger Children

```jsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  <motion.div variants={childVariants}>Child 1</motion.div>
  <motion.div variants={childVariants}>Child 2</motion.div>
</motion.div>
```

#### Hover Animation

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  Button
</motion.button>
```

### Page Transitions

```jsx
// Layout wrapper
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.5 }}
>
  {children}
</motion.div>
```

### Reduced Motion Support

**Always respect user preferences:**

```jsx
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{
        opacity: 1,
        y: shouldReduceMotion ? 0 : 20  // No movement if reduced motion
      }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : 0.5  // Faster if reduced motion
      }}
    >
      Content
    </motion.div>
  );
}
```

### Animation Performance Tips

✅ **Do:**
- Animate `transform` and `opacity` (GPU-accelerated)
- Use `will-change` sparingly
- Limit simultaneous animations
- Test on low-end devices

❌ **Don't:**
- Animate `width`, `height`, `top`, `left` (triggers reflow)
- Create layout shifts
- Animate too many elements at once
- Ignore reduced motion preferences

### Micro-interactions

#### Glow on Hover

```jsx
<motion.div
  whileHover={{
    boxShadow: "0 0 20px rgba(0, 245, 255, 0.5)"
  }}
  transition={{ duration: 0.2 }}
>
  Card
</motion.div>
```

#### Icon Bounce

```jsx
<motion.div
  animate={{
    y: [0, -5, 0]
  }}
  transition={{
    duration: 0.5,
    ease: "easeInOut",
    repeat: Infinity,
    repeatDelay: 2
  }}
>
  <Icon />
</motion.div>
```

---

## Accessibility

### WCAG Compliance

**Target:** WCAG 2.1 Level AA minimum

### Color Contrast

#### Text Contrast Requirements

```
Normal text (< 18pt):     4.5:1 minimum
Large text (≥ 18pt):      3:1 minimum
UI components & graphics: 3:1 minimum
```

#### Our Contrast Ratios

**On Dark Backgrounds (#0F172A):**
- Electric Blue (#00F5FF): 8.2:1 ✅
- Matrix Green (#39FF14): 10.5:1 ✅
- Neon Purple (#BF00FF): 5.8:1 ✅
- Neutral-50 (white): 15.3:1 ✅
- Neutral-300: 6.4:1 ✅
- Neutral-400: 4.8:1 ✅

**Testing Tools:**
- Chrome DevTools (Accessibility panel)
- WebAIM Contrast Checker
- Stark plugin (Figma/browser)

### Focus States

**All interactive elements must have visible focus indicators:**

```css
/* Default Focus */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Button Focus */
button:focus-visible,
a:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
}

/* Form Input Focus */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--color-secondary);
  outline-offset: 0;
  border-color: var(--color-secondary);
}
```

### Keyboard Navigation

**Requirements:**
- Tab order follows visual flow
- All interactive elements reachable via keyboard
- Skip links for main content
- Visible focus indicators
- Logical heading hierarchy

```tsx
// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             bg-electric-blue text-white px-4 py-2 rounded z-50"
>
  Skip to main content
</a>
```

### Screen Reader Support

#### Semantic HTML

```tsx
// ✅ Good - Semantic
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

<main id="main-content">
  <article>
    <h1>Page Title</h1>
  </article>
</main>

// ❌ Bad - Non-semantic
<div class="navigation">
  <div class="link">Home</div>
</div>
```

#### ARIA Labels

```tsx
// Icon buttons
<button aria-label="Download resume as PDF">
  <IconDownload />
</button>

// Complex interactions
<div
  role="progressbar"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="SQL proficiency"
>
  <div style={{ width: '75%' }} />
</div>

// Loading states
<div aria-live="polite" aria-busy="true">
  Loading content...
</div>
```

### Motion Preferences

**Respect `prefers-reduced-motion`:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Blindness Considerations

**Don't rely on color alone:**

```tsx
// ❌ Bad - Color only
<span className="text-matrix-green">Success</span>

// ✅ Good - Icon + Color
<span className="text-matrix-green flex items-center gap-2">
  <IconCheck className="w-4 h-4" />
  Success
</span>
```

### Touch Targets

**Minimum size: 44x44 pixels (iOS) / 48x48 pixels (Android)**

```css
/* Mobile touch target */
@media (max-width: 768px) {
  button,
  a {
    min-width: 48px;
    min-height: 48px;
    padding: 12px 16px;
  }
}
```

### Text Readability

**Line length: 50-75 characters optimal**

```css
.prose {
  max-width: 65ch;  /* Characters */
}
```

**Line height: 1.5 minimum for body text**

```css
p, li {
  line-height: 1.5;
}
```

---

## Best Practices

### Color Usage

**Do:**
✅ Use Electric Blue for primary actions and links
✅ Use Matrix Green for success states and positive metrics
✅ Maintain 4.5:1 contrast for body text
✅ Test colors with color blindness simulators
✅ Use semantic color tokens, not hex values directly

**Don't:**
❌ Mix more than 3 accent colors in one view
❌ Use low-contrast combinations
❌ Rely on color alone to convey information
❌ Use bright neon colors for large text blocks

### Typography

**Do:**
✅ Use Orbitron for headings, Inter for body
✅ Maintain clear hierarchy with size and weight
✅ Keep line length under 75 characters
✅ Use 1.5+ line height for body text
✅ Left-align body text (except for special cases)

**Don't:**
❌ Use more than 3 font families
❌ Set body text smaller than 16px
❌ Use all-caps for long text
❌ Center-align paragraphs
❌ Use tight letter-spacing on body text

### Spacing

**Do:**
✅ Stick to 8pt grid (8, 16, 24, 32...)
✅ Use 4pt half-steps for fine adjustments only
✅ Maintain consistent spacing within component types
✅ Follow internal ≤ external spacing rule
✅ Reduce spacing by 25-50% on mobile

**Don't:**
❌ Use arbitrary spacing values
❌ Create inconsistent gaps between similar elements
❌ Overcrowd mobile layouts
❌ Mix spacing systems

### Components

**Do:**
✅ Use GlassCard for consistent glassmorphism
✅ Apply appropriate elevation levels
✅ Include hover states for interactive elements
✅ Add loading states for async operations
✅ Handle error states gracefully

**Don't:**
❌ Create one-off custom components for common patterns
❌ Ignore mobile responsiveness
❌ Forget focus states
❌ Skip loading indicators

### Animations

**Do:**
✅ Use Framer Motion for consistency
✅ Keep animations under 500ms for UI interactions
✅ Respect reduced motion preferences
✅ Animate transform and opacity (GPU-accelerated)
✅ Add micro-interactions for feedback

**Don't:**
❌ Animate layout properties (width, height, top, left)
❌ Create distracting animations
❌ Ignore performance on low-end devices
❌ Overuse animations

### Accessibility

**Do:**
✅ Maintain WCAG AA standards minimum
✅ Test with keyboard navigation
✅ Include ARIA labels where needed
✅ Use semantic HTML
✅ Provide skip links

**Don't:**
❌ Use `div` for buttons or links
❌ Remove focus outlines without replacement
❌ Forget alt text for images
❌ Create keyboard traps
❌ Auto-play videos with sound

### Performance

**Do:**
✅ Lazy load images and heavy components
✅ Use Next.js Image component
✅ Minimize bundle size
✅ Implement proper caching
✅ Monitor Core Web Vitals

**Don't:**
❌ Load all data upfront
❌ Use unoptimized images
❌ Block the main thread
❌ Ignore mobile performance

---

## Code Examples

### Complete Card Component

```tsx
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconTrendingUp } from '@tabler/icons-react';

export function MetricCard({
  icon: Icon,
  label,
  value,
  color = 'electric-blue'
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        elevation={2}
        interactive
        className={`flex flex-col items-center text-center p-5
                    border-${color}/30 hover:border-${color}/60`}
      >
        <div className={`p-2 bg-${color}/20 rounded-lg mb-3`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <span className="text-sm text-slate-400 font-terminal mb-2">
          {label}
        </span>
        <div className={`text-3xl font-bold text-${color} font-heading`}>
          {value}
        </div>
      </GlassCard>
    </motion.div>
  );
}
```

### Complete Form Example

```tsx
export function ContactForm() {
  return (
    <form className="space-y-6">
      {/* Name Input */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-300"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full px-4 py-3 bg-slate-900/40 border border-slate-700
                     rounded-lg text-slate-100 placeholder-slate-500
                     focus:border-electric-blue focus:outline-none
                     focus:ring-2 focus:ring-electric-blue/20
                     transition-all"
          placeholder="John Doe"
        />
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-300"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-4 py-3 bg-slate-900/40 border border-slate-700
                     rounded-lg text-slate-100 placeholder-slate-500
                     focus:border-matrix-green focus:outline-none
                     focus:ring-2 focus:ring-matrix-green/20
                     transition-all"
          placeholder="john@example.com"
        />
      </div>

      {/* Message Textarea */}
      <div className="space-y-2">
        <label
          htmlFor="message"
          className="block text-sm font-medium text-slate-300"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          className="w-full px-4 py-3 bg-slate-900/40 border border-slate-700
                     rounded-lg text-slate-100 placeholder-slate-500 resize-none
                     focus:border-matrix-green focus:outline-none
                     focus:ring-2 focus:ring-matrix-green/20
                     transition-all"
          placeholder="Your message here..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="morph-button w-full flex items-center justify-center gap-2"
      >
        Send Message
        <IconSend className="w-4 h-4" />
      </button>
    </form>
  );
}
```

### Complete Page Layout

```tsx
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';

export default function Page() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8
                    bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-6xl mx-auto"
      >
        {/* Header Card */}
        <GlassCard elevation={4} className="p-8 mb-8">
          <h1 className="text-4xl font-bold text-electric-blue font-heading mb-4">
            Page Title
          </h1>
          <p className="text-lg text-slate-300">
            Page description goes here
          </p>
        </GlassCard>

        {/* Content Card */}
        <GlassCard elevation={3} className="p-8">
          {/* Your content */}
        </GlassCard>
      </motion.div>
    </div>
  );
}
```

---

## Responsive Design Guidelines

### Breakpoints

Following Tailwind's default breakpoints:

```css
/* Mobile First */
Default:  0px     (mobile)
sm:       640px   (tablet)
md:       768px   (small laptop)
lg:       1024px  (desktop)
xl:       1280px  (large desktop)
2xl:      1536px  (extra large)
```

### Responsive Patterns

**Stacked to Side-by-Side:**
```tsx
<div className="flex flex-col md:flex-row gap-6">
  <div>Left</div>
  <div>Right</div>
</div>
```

**Grid Columns:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

**Typography Scaling:**
```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl">
  Responsive Heading
</h1>
```

**Spacing Reduction:**
```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  Content
</div>
```

---

## Conclusion

This styling guide serves as the **single source of truth** for all design decisions in the Isaac Vazquez Digital Platform.

**Key Takeaways:**
1. Cyberpunk aesthetic with professional credibility
2. 8pt grid spacing system
3. Semantic color tokens
4. Glassmorphism for depth
5. Accessibility-first approach
6. Performance-optimized animations

**When in Doubt:**
- Refer to this guide first
- Test on multiple devices
- Validate accessibility
- Check performance impact

**Maintenance:**
- Update this document when adding new patterns
- Document component variants
- Share with all contributors
- Review quarterly

---

**Questions or Suggestions?**
Contact: isaacavazquez95@gmail.com
GitHub: https://github.com/isaacavazquez
