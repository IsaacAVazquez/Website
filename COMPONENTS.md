# Component Library Documentation

Complete component library reference for Isaac Vazquez's warm modern portfolio.

**Design System:** Warm Modern Professional
**Component Count:** 25+ components
**Last Updated:** January 2025

---

## 📋 Table of Contents

- [Component Overview](#component-overview)
- [Core UI Components](#core-ui-components)
- [Layout Components](#layout-components)
- [Content Components](#content-components)
- [Navigation Components](#navigation-components)
- [Usage Guidelines](#usage-guidelines)
- [Best Practices](#best-practices)

---

## 🎨 Component Overview

### Component Architecture

```
src/components/
├── ui/                      # Core UI library (10+ components)
│   ├── WarmCard.tsx        # Main container component
│   ├── ModernButton.tsx    # Button component
│   ├── Heading.tsx         # Typography
│   ├── Paragraph.tsx       # Body text
│   ├── Badge.tsx           # Labels and tags
│   └── JourneyTimeline.tsx # Timeline component
│
├── ModernHero.tsx          # Hero section
├── ContactContent.tsx      # Contact page content
├── ProjectsContent.tsx     # Projects showcase
├── About.tsx               # About page
│
├── blog/                   # Blog components
├── newsletter/             # Newsletter components
└── testimonials/           # Testimonial components
```

### Design Principles

**Consistency:**
- All components use warm color palette
- Standardized spacing and sizing
- Unified hover and focus states
- Consistent shadow system

**Accessibility:**
- WCAG AA compliant
- Keyboard navigation support
- Screen reader optimized
- Focus indicators on all interactive elements

**Performance:**
- Minimal re-renders
- Optimized animations
- Lazy loading where appropriate
- Tree-shakeable exports

---

## 🧱 Core UI Components

### WarmCard

Primary container component with warm theme styling.

**Location:** `src/components/ui/WarmCard.tsx`

#### Props Interface

```typescript
interface WarmCardProps {
  children: React.ReactNode;
  hover?: boolean;          // Hover scale effect (default: false)
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';  // default: 'md'
  className?: string;
}
```

#### Usage Examples

**Basic Card:**
```tsx
import { WarmCard } from '@/components/ui/WarmCard';

<WarmCard padding="lg">
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</WarmCard>
```

**Interactive Card with Hover:**
```tsx
<WarmCard hover={true} padding="xl">
  <h2 className="text-[#FF6B35]">Featured Content</h2>
  <p className="text-[#4A3426] dark:text-[#D4A88E]">
    This card scales slightly on hover
  </p>
</WarmCard>
```

#### Styling Details

```css
/* Base Styles */
background: white / dark:#2D1B12 (80% opacity)
border: 2px solid #FFE4D6 / dark:rgba(255, 142, 83, 0.3)
border-radius: 1rem (rounded-2xl)
box-shadow: subtle / dark:warm-lg
backdrop-filter: blur(4px)

/* Hover State */
transform: scale(1.02)
transition: 300ms ease
shadow: warm-lg
```

#### Padding Scale

```typescript
xs: 0.75rem  (12px)
sm: 1rem     (16px)
md: 1.5rem   (24px)
lg: 2rem     (32px)
xl: 3rem     (48px)
```

---

### ModernButton

Warm-themed button component with multiple variants.

**Location:** `src/components/ui/ModernButton.tsx`

#### Props Interface

```typescript
interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}
```

#### Usage Examples

**Primary Button:**
```tsx
import { ModernButton } from '@/components/ui/ModernButton';

<ModernButton variant="primary" size="lg">
  Get Started
</ModernButton>
```

**Secondary Button:**
```tsx
<ModernButton variant="secondary" size="md">
  Learn More
</ModernButton>
```

**Outline Button:**
```tsx
<ModernButton variant="outline" size="sm">
  View Details
</ModernButton>
```

#### Variant Styles

**Primary:**
```css
Light: bg-#FF6B35 hover:bg-#E85A28
Dark:  bg-#FF8E53 hover:bg-#FFA876
Text:  white
Shadow: warm-lg
```

**Secondary:**
```css
Light: bg-#F7B32B hover:bg-#E0A220
Dark:  bg-#FFD666
Text:  #4A3426
```

**Outline:**
```css
Border: 2px solid #FF6B35 / dark:#FF8E53
Text:   #FF6B35 / dark:#FF8E53
Hover:  bg-#FF6B35/10
```

#### Size Scale

```typescript
sm: px-3 py-1.5   text-sm
md: px-4 py-2     text-base
lg: px-6 py-3     text-lg
```

---

### Heading

Typography component with hierarchy and styling options.

**Location:** `src/components/ui/Heading.tsx`

#### Props Interface

```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}
```

#### Usage Examples

```tsx
import { Heading } from '@/components/ui/Heading';

// H1 with gradient
<Heading level={1} className="gradient-text-warm">
  Main Page Title
</Heading>

// H2 with warm color
<Heading level={2} className="text-[#FF6B35]">
  Section Heading
</Heading>

// H3 standard
<Heading level={3} className="text-[#2D1B12] dark:text-[#FFE4D6]">
  Subsection Title
</Heading>
```

#### Typography Scale

```tsx
H1: text-4xl md:text-5xl lg:text-6xl  font-bold
H2: text-2xl lg:text-3xl              font-bold
H3: text-xl                            font-bold
H4: text-lg                            font-semibold
H5: text-base                          font-semibold
H6: text-sm                            font-semibold
```

---

### Badge

Label and tag component for categories and status.

**Location:** `src/components/ui/Badge.tsx`

#### Props Interface

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}
```

#### Usage Examples

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="default" size="sm">
  React
</Badge>

<Badge variant="success">
  Completed
</Badge>

<Badge variant="warning">
  In Progress
</Badge>
```

---

### JourneyTimeline

Timeline component for career journey display.

**Location:** `src/components/ui/JourneyTimeline.tsx`

#### Features

- Displays career timeline with logos
- Tech stack tags for each position
- Warm theme styling throughout
- Responsive layout

#### Usage

```tsx
import { JourneyTimeline } from '@/components/ui/JourneyTimeline';

// Used in About page Journey tab
<JourneyTimeline />
```

**Data Source:** `src/constants/personal.ts` → `personalMetrics.careerTimeline`

---

## 🏗️ Layout Components

### ModernHero

Hero section component for home page.

**Location:** `src/components/ModernHero.tsx`

#### Features

- Grid layout with text and professional photo
- Responsive image sizing (w-56 to w-72)
- Warm gradient backgrounds
- Framer Motion animations
- CTA buttons

#### Usage

```tsx
import { ModernHero } from '@/components/ModernHero';

// Used on home page
export default function Home() {
  return (
    <div>
      <ModernHero />
      {/* Rest of page */}
    </div>
  );
}
```

#### Key Styling

```tsx
// Photo sizing
className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72"

// Border
className="border-[3px] border-[#FFE4D6] dark:border-[#FF8E53]/30"

// Grid layout
className="grid grid-cols-1 md:grid-cols-[1fr_auto]"
```

---

### ConditionalLayout

Dynamic layout wrapper that adapts based on route.

**Location:** `src/components/ConditionalLayout.tsx`

#### Features

- Route-based layout switching
- Skip links for accessibility
- Conditional navigation/footer display
- Background gradients

#### Layout Rules

```typescript
Home page (/) → ModernHero with minimal chrome
All other pages → Standard layout with navigation + footer
```

---

### Footer

Site-wide footer with social links.

**Location:** `src/components/Footer.tsx`

#### Features

- Social media links
- Copyright information
- Warm theme styling
- Responsive layout

---

## 📝 Content Components

### ContactContent

Contact page content with form and info cards.

**Location:** `src/components/ContactContent.tsx`

#### Features

- Contact heading and description
- CTA cards with warm styling
- Location information
- Links to email and LinkedIn

#### Usage

```tsx
import { ContactContent } from '@/components/ContactContent';

// Used in /contact page
export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <ContactContent />
      </div>
    </div>
  );
}
```

---

### ProjectsContent

Project showcase with bento layout.

**Location:** `src/components/ProjectsContent.tsx`

#### Features

- Project grid display
- WarmCard containers
- Project descriptions and tech stacks
- Links to live demos and repositories

---

### About

About page component with tabbed content.

**Location:** `src/components/About.tsx`

#### Features

- Tab navigation (Overview / Journey)
- Overview with skills and experience
- Journey with JourneyTimeline
- Framer Motion page transitions

---

## 🧭 Navigation Components

### FloatingNav

Persistent navigation overlay.

**Location:** `src/components/navigation/FloatingNav.tsx`

#### Features

- Fixed position navigation
- Mobile-responsive
- Active route highlighting
- Smooth transitions

---

### CommandPalette

Keyboard-driven command interface (⌘K).

**Location:** `src/components/navigation/CommandPalette.tsx`

#### Features

- Quick page navigation
- Search functionality
- Keyboard shortcuts
- Modal overlay

---

## 📘 Usage Guidelines

### When to Use Each Component

**WarmCard:**
- Section containers
- Content grouping
- Card-based layouts
- Any boxed content

**ModernButton:**
- Primary actions (variant="primary")
- Secondary actions (variant="secondary")
- Links styled as buttons (variant="outline")

**Heading:**
- Page titles (level={1})
- Section headers (level={2})
- Subsections (level={3-6})

**Badge:**
- Tech stack tags
- Category labels
- Status indicators

### Component Composition

```tsx
// Good: Composing components
<WarmCard hover={true} padding="xl">
  <Heading level={2} className="text-[#FF6B35] mb-4">
    Featured Project
  </Heading>
  <p className="text-[#4A3426] dark:text-[#D4A88E] mb-6">
    Project description goes here
  </p>
  <div className="flex gap-2 mb-6">
    <Badge>React</Badge>
    <Badge>TypeScript</Badge>
    <Badge>Tailwind</Badge>
  </div>
  <ModernButton variant="primary">
    View Project
  </ModernButton>
</WarmCard>
```

---

## ✨ Best Practices

### Accessibility

**Always include:**
- ARIA labels for interactive elements
- Proper semantic HTML
- Keyboard navigation support
- Focus indicators

```tsx
// Good
<ModernButton
  aria-label="Download resume PDF"
  onClick={handleDownload}
>
  Download Resume
</ModernButton>

// Bad
<div onClick={handleDownload}>
  Download Resume
</div>
```

### Performance

**Optimize rendering:**
```tsx
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render */}</div>;
});

// Use callback refs for animations
const ref = useCallback((node) => {
  if (node) {
    // Setup animation
  }
}, []);
```

### Styling

**Follow established patterns:**
```tsx
// Good: Using utility classes
<div className="text-[#4A3426] dark:text-[#D4A88E]">

// Bad: Inline styles
<div style={{ color: '#4A3426' }}>
```

### Consistency

**Use standardized spacing:**
```tsx
// Good: Consistent spacing
<div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
  <div className="max-w-5xl mx-auto space-y-8">

// Bad: Arbitrary spacing
<div className="py-10 px-5">
  <div className="max-w-[900px] mx-auto">
```

---

## 🔗 Related Documentation

- **[STYLING.md](./STYLING.md)** - Complete styling system
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture

---

*Last Updated: January 2025 - Warm Modern Theme*
