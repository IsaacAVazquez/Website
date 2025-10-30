# Component Patterns Documentation

## Overview

This document provides usage patterns, props reference, and best practices for all UI components in the Isaac Vazquez Digital Platform. Components follow consistent patterns for accessibility, animation, and responsive design.

---

## Core UI Components

### GlassCard

**Location:** `src/components/ui/GlassCard.tsx`

Glassmorphism card component with elevation system and interactive effects.

#### Props Interface

```typescript
interface GlassCardProps {
  elevation?: 1 | 2 | 3 | 4 | 5;     // Depth level (default: 2)
  interactive?: boolean;              // Hover/click effects (default: false)
  floating?: boolean;                 // Floating animation (default: false)
  cursorGlow?: boolean;               // Cursor-following glow (default: false)
  noiseTexture?: boolean;             // Subtle noise overlay (default: false)
  children: React.ReactNode;
  className?: string;
}
```

#### Basic Usage

```tsx
import { GlassCard } from "@/components/ui/GlassCard";

<GlassCard elevation={2} className="p-6">
  <h3>Card Title</h3>
  <p>Card content</p>
</GlassCard>
```

#### Interactive Card

```tsx
<GlassCard
  elevation={3}
  interactive={true}
  cursorGlow={true}
  noiseTexture={true}
  className="p-8"
>
  <Heading level={2}>Interactive Feature</Heading>
  <Paragraph>Hover to see effects</Paragraph>
</GlassCard>
```

#### Floating Animation

```tsx
<GlassCard
  elevation={4}
  floating={true}
  className="p-6"
>
  <div>Floats gently in the viewport</div>
</GlassCard>
```

#### Elevation Levels

- **1:** Subtle depth - minimal shadow
- **2:** Default cards - moderate depth
- **3:** Featured cards - noticeable elevation
- **4:** Modal/overlay - significant depth
- **5:** Maximum elevation - dominant elements

#### Accessibility

- Automatically sets `role="button"` when `interactive={true}`
- Keyboard accessible (Enter/Space triggers click)
- Focus visible with proper outline

---

### Heading

**Location:** `src/components/ui/Heading.tsx`

Consistent heading component with cyberpunk styling.

#### Props Interface

```typescript
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;     // Apply gradient text effect
  cyber?: boolean;        // Apply cyberpunk uppercase style
}
```

#### Usage

```tsx
import { Heading } from "@/components/ui/Heading";

<Heading level={1} className="mb-6">
  Page Title
</Heading>

<Heading level={2} gradient={true}>
  Featured Section
</Heading>

<Heading level={3} cyber={true} className="text-electric-blue">
  CYBERPUNK_HEADING
</Heading>
```

#### Automatic Styling

- Uses Orbitron font family
- Uppercase transformation
- Proper letter spacing (0.05em-0.1em)
- Semantic HTML (h1-h6)

---

### Paragraph

**Location:** `src/components/ui/Paragraph.tsx`

Optimized paragraph component with size variants.

#### Props Interface

```typescript
interface ParagraphProps {
  size?: 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}
```

#### Usage

```tsx
import { Paragraph } from "@/components/ui/Paragraph";

<Paragraph size="base" className="text-slate-300">
  Standard body text with optimal readability.
</Paragraph>

<Paragraph size="lg" className="text-slate-400">
  Larger introductory text for emphasis.
</Paragraph>
```

#### Typography Features

- Line height: 1.7 for readability
- Max width: 75ch for optimal line length
- Responsive font sizing with clamp()

---

### MorphButton

**Location:** `src/components/ui/MorphButton.tsx`

Animated button with 3D perspective transform.

#### Props Interface

```typescript
interface MorphButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'base' | 'lg';
  href?: string;              // Link destination
  onClick?: () => void;       // Click handler
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}
```

#### Variants

##### Primary (Gradient)

```tsx
<MorphButton variant="primary" href="/action">
  Primary Action
</MorphButton>
```

Styling:
- Gradient background (electric-blue → matrix-green)
- 3D perspective transform on hover
- Glow effect

##### Secondary

```tsx
<MorphButton variant="secondary" onClick={handleClick}>
  Secondary Action
</MorphButton>
```

##### Outline

```tsx
<MorphButton variant="outline" size="sm">
  Outline Button
</MorphButton>
```

##### Ghost

```tsx
<MorphButton variant="ghost" href="/link">
  Ghost Button
</MorphButton>
```

#### Sizes

```tsx
<MorphButton size="sm">Small</MorphButton>
<MorphButton size="base">Medium</MorphButton>
<MorphButton size="lg">Large</MorphButton>
```

#### As Link or Button

```tsx
// Renders as <Link> when href provided
<MorphButton href="/destination">Navigate</MorphButton>

// Renders as <button> when onClick provided
<MorphButton onClick={() => alert('Clicked')}>
  Click Me
</MorphButton>
```

---

### Badge

**Location:** `src/components/ui/Badge.tsx`

Small label component for tags and categories.

#### Props Interface

```typescript
interface BadgeProps {
  variant?: 'electric' | 'matrix' | 'purple' | 'amber' | 'outline';
  size?: 'sm' | 'base';
  children: React.ReactNode;
  className?: string;
}
```

#### Variants

```tsx
<Badge variant="electric">Electric Blue</Badge>
<Badge variant="matrix">Matrix Green</Badge>
<Badge variant="purple">Neon Purple</Badge>
<Badge variant="amber">Warning Amber</Badge>
<Badge variant="outline">Outlined</Badge>
```

#### Sizes

```tsx
<Badge size="sm">Small Badge</Badge>
<Badge size="base">Normal Badge</Badge>
```

#### Common Use Cases

**Category Tags:**
```tsx
<Badge variant="electric">Product Management</Badge>
<Badge variant="matrix">Analytics</Badge>
```

**Status Indicators:**
```tsx
<Badge variant="matrix">Active</Badge>
<Badge variant="amber">Pending</Badge>
```

---

## Navigation Components

### FloatingNav

**Location:** `src/components/ui/FloatingNav.tsx`

Persistent floating navigation with scroll behavior.

#### Features

- Auto-hide on scroll down
- Show on scroll up or when near top (< 100px)
- Position adapts to page and viewport
- Glass morphism styling
- Icon-based navigation

#### Usage

```tsx
import { FloatingNav } from "@/components/ui/FloatingNav";

{showFloatingNav && <FloatingNav />}
```

#### Configuration

Navigation links defined in `src/constants/navlinks.tsx`:

```typescript
export const navlinks = [
  { href: "/", label: "Home", icon: IconBolt },
  { href: "/about", label: "About", icon: IconMessage2 },
  { href: "/fantasy-football", label: "Fantasy Football", icon: IconTrophy },
  { href: "/blog", label: "Blog", icon: IconArticle },
  { href: "/resume", label: "Resume", icon: IconFileText },
  { href: "/contact", label: "Contact", icon: IconMail }
];
```

#### Position Behavior

**Home Page:**
- Desktop: Top-right
- Mobile: Bottom-center

**Other Pages:**
- All screens: Bottom-center

---

### Breadcrumbs

**Location:** `src/components/navigation/Breadcrumbs.tsx`

Contextual navigation trail with structured data.

#### Usage

```tsx
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "Blog", url: "/blog" },
  { name: "Post Title", url: "/blog/post-slug" }
];

<Breadcrumbs className="mb-8" />
```

#### Structured Data

Automatically generates JSON-LD breadcrumb schema:

```tsx
<StructuredData
  type="BreadcrumbList"
  data={{
    items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement
  }}
/>
```

---

### CommandPalette

**Location:** `src/components/ui/CommandPalette.tsx`

Spotlight-style command interface.

#### Features

- Keyboard shortcut: `⌘K` (Mac) or `Ctrl+K` (Windows)
- Global search
- Quick navigation
- Fuzzy search

#### Usage

```tsx
import { CommandPalette } from "@/components/ui/CommandPalette";

<CommandPalette />
```

Automatically included in ConditionalLayout.

---

## Animation Patterns

### Framer Motion Imports

```tsx
import { motion, AnimatePresence } from "framer-motion";
```

---

### Entrance Animations

#### Fade In from Bottom

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

---

#### Fade In with Delay

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6, delay: 0.2 }}
>
  Content
</motion.div>
```

---

#### Spring Animation

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    type: "spring",
    stiffness: 100,
    damping: 15
  }}
>
  Content
</motion.div>
```

---

### Staggered Children

```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

---

### Hover Effects

```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.3 }}
>
  Interactive element
</motion.div>
```

---

### Exit Animations

```tsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      Conditional content
    </motion.div>
  )}
</AnimatePresence>
```

---

### Layout Animations

```tsx
<motion.div layoutId="unique-id">
  Content that morphs between states
</motion.div>
```

---

## Fantasy Football Components

### EnhancedPlayerCard

**Location:** `src/components/fantasy-football/EnhancedPlayerCard.tsx`

Comprehensive player information display.

#### Props

```typescript
interface EnhancedPlayerCardProps {
  player: Player;
  variant?: 'compact' | 'full';
  showImage?: boolean;
  showStats?: boolean;
  onClick?: () => void;
}
```

#### Usage

```tsx
<EnhancedPlayerCard
  player={playerData}
  variant="full"
  showImage={true}
  showStats={true}
  onClick={handlePlayerSelect}
/>
```

---

### TierChart

**Location:** `src/components/fantasy-football/TierChart.tsx`

Interactive tier visualization with D3.js.

#### Props

```typescript
interface TierChartProps {
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  data: PlayerData[];
  interactive?: boolean;
  height?: number;
}
```

#### Usage

```tsx
<TierChart
  position="QB"
  data={qbData}
  interactive={true}
  height={600}
/>
```

---

### PositionSelector

**Location:** `src/components/fantasy-football/PositionSelector.tsx`

Fantasy position filtering interface.

#### Usage

```tsx
<PositionSelector
  currentPosition={selectedPosition}
  onPositionChange={setSelectedPosition}
/>
```

---

### LazyPlayerImage

**Location:** `src/components/fantasy-football/LazyPlayerImage.tsx`

Optimized player image loading system.

#### Props

```typescript
interface LazyPlayerImageProps {
  playerId: string;
  playerName: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}
```

#### Usage

```tsx
<LazyPlayerImage
  playerId="player-id"
  playerName="Player Name"
  size="md"
  fallback="/images/default-player.png"
/>
```

Features:
- Lazy loading with Intersection Observer
- Multiple image source fallbacks
- Skeleton loading state
- Error handling with fallback image

---

## Blog Components

### BlogFilter

**Location:** `src/components/blog/BlogFilter.tsx`

Blog filtering and search interface.

#### Props

```typescript
interface BlogFilterProps {
  categories: string[];
  tags: string[];
  currentCategory?: string;
  currentTag?: string;
  currentQuery?: string;
}
```

#### Usage

```tsx
<BlogFilter
  categories={categories}
  tags={tags}
  currentCategory={category}
  currentTag={tag}
  currentQuery={q}
/>
```

---

## Form Components

### Input Fields

```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-terminal-bg/50 border border-electric-blue/30 rounded-lg text-slate-300 focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
  placeholder="Enter text..."
/>
```

---

### Textarea

```tsx
<textarea
  className="w-full px-4 py-2 bg-terminal-bg/50 border border-electric-blue/30 rounded-lg text-slate-300 focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20"
  rows={5}
  placeholder="Enter message..."
/>
```

---

### Form Submit Button

```tsx
<MorphButton
  variant="primary"
  type="submit"
  className="w-full"
>
  Submit Form
</MorphButton>
```

---

## Accessibility Patterns

### Focus Management

All interactive elements include proper focus states:

```tsx
<div className="focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-offset-2">
  Interactive content
</div>
```

---

### ARIA Labels

```tsx
<button aria-label="Close dialog" onClick={handleClose}>
  <IconX />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<section aria-labelledby="section-heading">
  <h2 id="section-heading">Section Title</h2>
</section>
```

---

### Keyboard Navigation

```tsx
<div
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
>
  Keyboard accessible element
</div>
```

---

### Screen Reader Text

```tsx
<span className="sr-only">
  Screen reader only text for context
</span>
```

---

## Responsive Patterns

### Mobile-First Utilities

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">
  Desktop only content
</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">
  Mobile only content
</div>

// Different layouts
<div className="flex flex-col md:flex-row">
  Stacks on mobile, rows on desktop
</div>
```

---

### Responsive Text

```tsx
<p className="text-sm sm:text-base md:text-lg lg:text-xl">
  Scales from 14px → 16px → 18px → 20px
</p>
```

---

### Responsive Spacing

```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  Padding: 16px → 24px → 32px → 40px
</div>

<div className="space-y-4 sm:space-y-6 md:space-y-8">
  Vertical spacing: 16px → 24px → 32px
</div>
```

---

### Responsive Grid

```tsx
// Stack → 2 cols → 3 cols
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map(...)}
</div>
```

---

## Performance Patterns

### Lazy Loading

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

---

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/path/to/image.png"
  alt="Description"
  width={640}
  height={480}
  priority={false}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

### Memoization

```tsx
import { memo, useMemo, useCallback } from 'react';

// Component memoization
const ExpensiveComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// Value memoization
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(dependencies);
}, [dependencies]);

// Callback memoization
const handleClick = useCallback(() => {
  doSomething(dependency);
}, [dependency]);
```

---

## Error Handling Patterns

### Error Boundary

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

---

### Loading States

```tsx
{isLoading ? (
  <div className="flex items-center justify-center p-12">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full"
    />
  </div>
) : (
  <Content />
)}
```

---

### Empty States

```tsx
{items.length === 0 ? (
  <GlassCard className="text-center py-12">
    <Heading level={3} className="mb-4">
      No Items Found
    </Heading>
    <Paragraph className="text-slate-400 mb-6">
      Try adjusting your filters or search query.
    </Paragraph>
    <MorphButton href="/explore">
      Explore More
    </MorphButton>
  </GlassCard>
) : (
  <ItemList items={items} />
)}
```

---

## Common Component Combinations

### Hero Section

```tsx
<section className="min-h-screen flex items-center justify-center">
  <div className="max-w-4xl mx-auto text-center space-y-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Heading level={1} gradient={true} className="mb-4">
        Hero Title
      </Heading>
      <Paragraph size="lg" className="text-slate-300">
        Compelling value proposition
      </Paragraph>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex gap-4 justify-center"
    >
      <MorphButton variant="primary" href="/action">
        Primary CTA
      </MorphButton>
      <MorphButton variant="outline" href="/learn">
        Learn More
      </MorphButton>
    </motion.div>
  </div>
</section>
```

---

### Feature Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map((feature, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        elevation={2}
        interactive={true}
        className="p-6 h-full"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-electric-blue/10 flex items-center justify-center">
            <feature.icon className="w-6 h-6 text-electric-blue" />
          </div>
          <Heading level={3}>{feature.title}</Heading>
        </div>
        <Paragraph className="text-slate-400">
          {feature.description}
        </Paragraph>
      </GlassCard>
    </motion.div>
  ))}
</div>
```

---

### CTA Section

```tsx
<GlassCard
  elevation={3}
  className="p-8 md:p-12 text-center"
>
  <Heading level={2} className="mb-4">
    Ready to Get Started?
  </Heading>
  <Paragraph size="lg" className="text-slate-300 mb-8 max-w-2xl mx-auto">
    Join thousands of users who trust our platform.
  </Paragraph>
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <MorphButton variant="primary" size="lg" href="/signup">
      Sign Up Now
    </MorphButton>
    <MorphButton variant="outline" size="lg" href="/demo">
      View Demo
    </MorphButton>
  </div>
</GlassCard>
```

---

## Related Documentation

- [Styling System](./STYLING_SYSTEM.md) - Design tokens and CSS
- [Layout System](./LAYOUT_SYSTEM.md) - Layout patterns
- [Page Architecture](./PAGE_ARCHITECTURE.md) - Page structure
- [Component Library](./COMPONENT_LIBRARY.md) - Full component reference

---

**Last Updated:** October 2025
**Maintained By:** Isaac Vazquez
