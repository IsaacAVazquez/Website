# Layout System Documentation

## Overview

The Isaac Vazquez Digital Platform uses a **dynamic conditional layout system** that adapts based on page type, screen size, and user context. This document covers the layout architecture, component patterns, and responsive behaviors.

---

## Core Layout Architecture

### Root Layout

**Location:** `src/app/layout.tsx`

The root layout provides the foundational HTML structure, global providers, and font configuration.

#### Font Configuration

```typescript
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",          // Show fallback immediately
  preload: true,            // Critical font
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,           // Load on-demand
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-orbitron",
  display: "swap",
  preload: false,           // Load on-demand for headings
});
```

#### HTML Structure

```tsx
<html lang="en" className="scroll-smooth-dark">
  <head>
    {/* PWA meta tags */}
    {/* Structured data */}
    {/* Dark mode initialization */}
  </head>
  <body className={twMerge(
    inter.className,
    inter.variable,
    jetbrainsMono.variable,
    orbitron.variable,
    "min-h-screen antialiased bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]"
  )}>
    <Analytics>
      <Providers>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </Providers>
    </Analytics>
  </body>
</html>
```

#### Global Providers

- **Analytics:** Web vitals and user analytics tracking
- **Providers:** NextAuth session, theme provider, etc.

#### Dark Mode Initialization

Prevents flash of unstyled content (FOUC):

```tsx
<script dangerouslySetInnerHTML={{
  __html: `(() => {
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();`
}} />
```

---

## Conditional Layout System

**Location:** `src/components/ConditionalLayout.tsx`

The ConditionalLayout component dynamically adjusts layout based on the current route and viewport.

### Layout Detection Logic

```typescript
const { showFloatingNav, pathname } = useNavigation();

const isHomePage = pathname === "/";
const isFantasyFootballPage = pathname.startsWith('/fantasy-football');
const isFullWidthPage = isFantasyFootballPage;
```

### Layout Variants

#### **1. Home Page Layout**

Full-screen immersive experience without traditional chrome:

```tsx
{isHomePage ? (
  children  // TerminalHero with no wrapper
) : (
  // Standard layout
)}
```

Features:
- No container constraints
- No breadcrumbs
- No footer
- FloatingNav positioned top-right (desktop) or bottom-center (mobile)

---

#### **2. Fantasy Football Full-Width Layout**

Specialized layout for data visualization and analytics:

```tsx
{isFullWidthPage ? (
  <div className="min-h-screen w-full">
    <main className="min-h-screen w-full">
      {children}
    </main>
  </div>
) : (
  // Standard layout
)}
```

Features:
- Full viewport width
- No max-width constraints
- Optimized for charts and data tables
- No footer
- Custom navigation integration

---

#### **3. Standard Portfolio Layout**

Centered content for portfolio pages (About, Resume, Contact, Blog):

```tsx
<main className="flex-1 min-h-screen">
  <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
    <Breadcrumbs className="mb-8" />
    {children}
  </div>
</main>
```

Features:
- Max width of 1024px (4xl)
- Centered with auto margins
- Responsive padding: `px-6 py-12 md:py-16`
- Breadcrumb navigation
- Footer included
- FloatingNav bottom-center

---

### Complete Layout Structure

```tsx
<GestureNavigation>
  {/* Skip Navigation Links */}
  <div className="sr-only">
    <a href="#main-content">Skip to main content</a>
    <a href="#navigation">Skip to navigation</a>
  </div>

  {/* Main Layout Container */}
  <div className={isFullWidthPage
    ? "min-h-screen w-full"
    : "min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]"
  }>

    {/* Main Content Area */}
    <main
      id="main-content"
      role="main"
      aria-label={
        isHomePage ? "Isaac Vazquez Portfolio Homepage" :
        isFantasyFootballPage ? "Fantasy Football Analytics Platform" :
        "Portfolio Content"
      }
      className={isFullWidthPage
        ? "min-h-screen w-full focus-ring"
        : "flex-1 min-h-screen focus-ring md:ml-0"
      }
      tabIndex={-1}
    >
      {/* Content based on page type */}
    </main>
  </div>

  {/* Conditional Footer */}
  {!isHomePage && !isFantasyFootballPage && <Footer />}

  {/* Floating Navigation */}
  {showFloatingNav && <FloatingNav />}

  {/* Command Palette */}
  <CommandPalette />
</GestureNavigation>
```

---

## Navigation Components

### FloatingNav

**Location:** `src/components/ui/FloatingNav.tsx`

Persistent navigation that adapts position based on page and viewport.

#### Position Logic

```typescript
const getNavClasses = () => {
  if (isHomePage) {
    // Home: bottom center (mobile) or top-right (desktop)
    return isMobile
      ? "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      : "fixed top-6 right-6 z-50";
  } else {
    // Other pages: bottom center (all screens)
    return "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50";
  }
};
```

#### Animation Behavior

```typescript
const getInitialAnimation = () => {
  if (isHomePage && !isMobile) {
    return { x: 100, opacity: 0 }; // Slide from right
  }
  return { y: 100, opacity: 0 }; // Slide from bottom
};
```

#### Scroll Behavior

Hides on scroll down, shows on scroll up:

```typescript
useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < lastScrollY || currentScrollY < 100) {
      setIsVisible(true);   // Show when scrolling up
    } else {
      setIsVisible(false);  // Hide when scrolling down
    }

    setLastScrollY(currentScrollY);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
}, [lastScrollY]);
```

#### Component Structure

```tsx
<motion.nav
  initial={getInitialAnimation()}
  animate={getAnimateAnimation()}
  exit={getExitAnimation()}
  className={getNavClasses()}
>
  <div className="glass-card elevation-4 px-4 py-3 flex items-center gap-2">
    {navlinks.map((link) => (
      <Link href={link.href}>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon />
        </motion.div>
      </Link>
    ))}
  </div>
</motion.nav>
```

---

### GestureNavigation

**Location:** `src/components/ui/FloatingNav.tsx`

Mobile gesture-based navigation wrapper.

#### Swipe Detection

```typescript
<motion.div
  drag="x"                    // Horizontal drag
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
      handleNavigation(direction);
    }
  }}
>
  {children}
</motion.div>
```

#### Navigation Logic

```typescript
const handleNavigation = (direction: "left" | "right") => {
  const pages = ["/", "/about", "/projects", "/resume", "/contact"];
  const currentIndex = pages.indexOf(pathname);

  let nextIndex;
  if (direction === "right") {
    nextIndex = (currentIndex + 1) % pages.length;
  } else {
    nextIndex = (currentIndex - 1 + pages.length) % pages.length;
  }

  router.push(pages[nextIndex]);
};
```

#### Visual Feedback

```tsx
<AnimatePresence>
  {dragDirection && (
    <motion.div className={`fixed top-1/2 ${dragDirection === "left" ? "left-4" : "right-4"}`}>
      <motion.div animate={{ x: dragDirection === "left" ? -5 : 5 }}>
        {dragDirection === "left" ? "←" : "→"}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

### Footer

**Location:** `src/components/Footer.tsx`

Professional footer with social links and copyright.

#### Structure

```tsx
<footer
  role="contentinfo"
  aria-label="Site footer with copyright and social links"
  className="relative z-20 flex flex-col items-center justify-center p-5 pb-2 min-h-[72px] bg-gradient-to-t from-terminal-bg/70 to-transparent backdrop-blur rounded-t-xl border-t border-electric-blue/20"
>
  {/* Copyright */}
  <div className="flex items-center gap-2 text-base font-semibold text-slate-400 mb-1">
    <span className="text-lg animate-wave">⚡</span>
    <span>{new Date().getFullYear()}</span>
    <span>— BUILT BY Isaac Vazquez</span>
  </div>

  {/* Social Links */}
  <nav aria-label="Social media links" className="flex gap-4 mt-1">
    <a href="https://linkedin.com/in/isaac-vazquez">
      <FaLinkedin />
    </a>
    <a href="https://github.com/IsaacAVazquez">
      <FaGithub />
    </a>
  </nav>
</footer>
```

#### Display Logic

```typescript
{!isHomePage && !isFantasyFootballPage && <Footer />}
```

---

### Breadcrumbs

**Location:** `src/components/navigation/Breadcrumbs.tsx`

Contextual navigation trail.

#### Usage

```tsx
const breadcrumbs = [
  { name: "Home", url: "/" },
  { name: "About", url: "/about" }
];

<Breadcrumbs className="mb-8" />
```

#### Structured Data Integration

```tsx
<StructuredData
  type="BreadcrumbList"
  data={{ items: generateBreadcrumbStructuredData(breadcrumbs).itemListElement }}
/>
```

---

## Page-Specific Layouts

### Home Page: TerminalHero

**Location:** `src/components/TerminalHero.tsx`

Full-screen immersive terminal interface.

#### Structure

```tsx
<div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
  {/* Background Effects */}
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/20 to-slate-700/10">
    <div className="absolute inset-0 opacity-5">
      {/* Grid pattern */}
    </div>
  </div>

  {/* Floating Particles */}
  <div className="absolute inset-0">
    {PARTICLE_POSITIONS.map((position, i) => (
      <motion.div className="absolute w-1 h-1 bg-electric-blue/60" />
    ))}
  </div>

  {/* Main Content */}
  <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <header className="max-w-4xl space-y-6">
      <h1 className="heading-hero gradient-text">
        ISAAC VAZQUEZ
      </h1>
      <div className="text-cyber text-matrix-green text-xl md:text-2xl">
        PRODUCT MANAGER // UC BERKELEY MBA // TECHNICAL FOUNDATION
      </div>
      <p className="text-lg md:text-xl text-slate-300">
        Value proposition...
      </p>
      <nav className="flex flex-col sm:flex-row gap-4">
        {/* CTA buttons */}
      </nav>
    </header>

    {/* Compact Terminal */}
    <motion.div className="w-full max-w-2xl">
      <div className="glass-card bg-terminal-bg/95">
        {/* Terminal content */}
      </div>
    </motion.div>
  </div>

  {/* Scroll Indicator */}
  <motion.div className="absolute bottom-8 left-1/2">
    {/* Animated scroll icon */}
  </motion.div>
</div>
```

#### Mobile Navigation

Floating menu button for mobile:

```tsx
<div className="fixed top-4 right-4 z-50 md:hidden">
  <Link href="/about" className="flex items-center justify-center w-12 h-12 bg-terminal-bg/90 border border-electric-blue/30 rounded-full">
    <IconMenu2 className="w-6 h-6 text-electric-blue" />
  </Link>
</div>
```

---

### Resume Page Layout

**Location:** `src/app/resume/resume-client.tsx`

Responsive resume with progressive enhancement.

#### Container Structure

```tsx
<div className="min-h-screen w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
  <motion.div className="relative max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
    {/* Resume content */}
  </motion.div>
</div>
```

#### Responsive Breakpoints

- **Mobile (< 640px):** `max-w-full`, `p-4`, `text-3xl`
- **Small (640px+):** `max-w-3xl`, `p-6`, `text-4xl`
- **Medium (768px+):** `max-w-4xl`, `p-8`, `text-5xl`
- **Large (1024px+):** `max-w-5xl`, `p-10`, `text-5xl`

#### Section Layout

```tsx
<GlassCard className="p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 md:mb-10">
  <Heading level={1} className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
    ISAAC VAZQUEZ
  </Heading>

  <div className="text-xs sm:text-sm md:text-base">
    {/* Contact info */}
  </div>
</GlassCard>
```

---

### Blog Layout

**Location:** `src/app/blog/page.tsx`

Centered blog layout with filtering.

#### Structure

```tsx
<div className="min-h-screen py-12 md:py-20">
  <div className="max-w-4xl mx-auto px-6">
    {/* Header */}
    <div className="text-center mb-12">
      <Heading level={1} className="mb-4">
        Technical Insights & Deep Dives
      </Heading>
    </div>

    {/* Filter Controls */}
    <BlogFilter categories={categories} tags={tags} />

    {/* Featured Posts */}
    <section className="mb-16">
      <div className="grid gap-8 md:grid-cols-2">
        {featuredPosts.map(...)}
      </div>
    </section>

    {/* All Posts */}
    <section>
      <div className="grid gap-6">
        {posts.map(...)}
      </div>
    </section>

    {/* Categories */}
    <section className="mt-16">
      <div className="grid gap-6 md:grid-cols-3">
        {categories.map(...)}
      </div>
    </section>
  </div>
</div>
```

---

### Fantasy Football Layout

**Location:** `src/app/fantasy-football/page.tsx`

Full-width layout optimized for data visualization.

#### Structure

```tsx
<div className="min-h-screen w-full">
  {/* No max-width constraints */}
  <FantasyFootballClient />
</div>
```

#### Nested Components

Charts and tables span full viewport width for optimal data display.

---

## Responsive Patterns

### Container Widths

```tsx
// Full width (fantasy football, home)
<div className="w-full">

// Extra small (mobile-first default)
<div className="max-w-full">

// Small (640px+)
<div className="sm:max-w-3xl">     // 768px

// Medium (768px+)
<div className="md:max-w-4xl">     // 896px

// Large (1024px+)
<div className="lg:max-w-5xl">     // 1024px

// Extra large (1280px+)
<div className="xl:max-w-6xl">     // 1152px

// Standard portfolio
<div className="max-w-4xl mx-auto">
```

---

### Padding & Spacing

#### Progressive Padding

```tsx
// Mobile → Tablet → Desktop
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
// 16px → 24px → 32px → 40px

<div className="px-4 sm:px-6 lg:px-8">
// Horizontal: 16px → 24px → 32px

<div className="py-8 sm:py-12 md:py-16">
// Vertical: 32px → 48px → 64px
```

#### Section Spacing

```tsx
<div className="space-y-6 sm:space-y-8 md:space-y-10">
  // Vertical spacing between elements
  // 24px → 32px → 40px
</div>

<div className="mb-6 sm:mb-8 md:mb-10">
  // Bottom margin
  // 24px → 32px → 40px
</div>
```

---

### Typography Scaling

```tsx
// Name/hero headings
<h1 className="text-3xl sm:text-4xl md:text-5xl">
// 48px → 56px → 64px

// Section headings
<h2 className="text-2xl sm:text-3xl md:text-4xl">
// 32px → 48px → 56px

// Body text
<p className="text-sm sm:text-base md:text-lg">
// 14px → 16px → 18px
```

---

### Grid Layouts

```tsx
// Stacked → 2 columns → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Stacked → 2 columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

// Featured post grid
<div className="grid gap-8 md:grid-cols-2">
```

---

## Accessibility Features

### Skip Links

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

Styles:

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--electric-blue);
  color: var(--slate-900);
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

---

### ARIA Labels

```tsx
<main
  id="main-content"
  role="main"
  aria-label="Isaac Vazquez Portfolio Homepage"
  tabIndex={-1}
>
```

---

### Focus Management

```tsx
<div className="focus-ring">
  {/* Receives proper focus indicators */}
</div>
```

---

## Command Palette

**Location:** `src/components/ui/CommandPalette.tsx`

Global command interface (⌘K):

```tsx
<CommandPalette />
```

Features:
- Keyboard shortcut navigation
- Search across all content
- Quick access to pages
- Fuzzy search

---

## Performance Optimizations

### Font Loading

```typescript
display: "swap"     // Show fallback font immediately
preload: true       // Preload critical fonts (Inter)
preload: false      // Lazy load decorative fonts (Orbitron, JetBrains Mono)
```

---

### Layout Shift Prevention

- Fixed navigation heights
- Skeleton screens for dynamic content
- Proper image aspect ratios

---

### Scroll Performance

```typescript
window.addEventListener("scroll", handleScroll, { passive: true });
```

Throttled to ~60fps (16ms).

---

## Related Documentation

- [Page Architecture](./PAGE_ARCHITECTURE.md) - All page routes
- [Component Library](./COMPONENT_LIBRARY.md) - UI components
- [Styling System](./STYLING_SYSTEM.md) - Design system
- [Component Patterns](./COMPONENT_PATTERNS.md) - Usage patterns

---

**Last Updated:** October 2025
**Maintained By:** Isaac Vazquez
