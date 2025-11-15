# Architecture Documentation

Complete system architecture for Isaac Vazquez's modern warm-themed portfolio website.

**Live Site:** https://isaacavazquez.com
**Framework:** Next.js 15 with App Router
**Last Updated:** January 2025

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Page Routes](#page-routes)
- [API Endpoints](#api-endpoints)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Version History](#version-history)

---

## 🌐 System Overview

### Platform Purpose
Professional portfolio website showcasing Isaac Vazquez's work as a Technical Product Manager and UC Berkeley Haas MBA candidate with a focus on warm, modern, accessible design.

### Design Philosophy
- **Warm Modern Aesthetic**: Sunset orange (#FF6B35), golden yellow (#F7B32B), and warm browns
- **Accessibility First**: WCAG AA compliance with enhanced contrast ratios (7.5:1+)
- **Performance Optimized**: <152kB First Load JS, sub-2.5s load times
- **Mobile Responsive**: Mobile-first approach with touch-friendly interactions

### Key Features
- Modern hero section with optimized professional headshot
- Interactive project showcase with warm card styling
- Professional resume with download capability
- Contact page with social links
- Tab-based navigation (Overview/Journey on About page)

---

## 🛠️ Technology Stack

### Core Framework & Runtime

**Next.js 15 Configuration:**
```
Framework: Next.js 15 (App Router)
├── Runtime: React 19
├── Language: TypeScript 5.9 (strict mode)
├── Styling: Tailwind CSS v4
├── Animation: Framer Motion 12
└── Icons: Tabler Icons, Lucide React

Features:
├── React Server Components
├── Server Actions
├── Image Optimization (AVIF, WebP)
├── Font Optimization (Variable fonts)
├── Bundle Splitting
└── Edge Runtime Support
```

**Image Optimization:**
- Formats: AVIF, WebP fallback
- Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048]
- Cache TTL: 30 days
- Priority loading for above-the-fold images

### UI & Styling

**Tailwind CSS v4:**
```css
Custom Theme Extensions:
├── Colors: Warm palette (sunset orange, golden yellow, coral)
├── Fonts: Inter (all text), JetBrains Mono (code)
├── Shadows: shadow-warm-lg, shadow-warm-xl, shadow-subtle
├── Border Radius: Consistent rounded-2xl across components
└── Spacing: py-16 sm:py-20 lg:py-24 section spacing
```

**Component Library:**
- `WarmCard` - Main container with warm theme and hover effects
- `ModernButton` - Primary button with multiple variants
- `Heading` - Typography component with hierarchy
- `ModernHero` - Hero section with optimized headshot
- `JourneyTimeline` - Career timeline visualization

### Data & State Management

**State Management:**
- **Local State**: `useState` for component-level state
- **Server State**: Next.js data fetching (Server Components)
- **Global State**: Context API for theme preferences
- **Form State**: Controlled components with validation

**Data Storage:**
- Static data in `/src/constants/`
- Personal metrics in `personalMetrics` constant
- No database required for current portfolio

### Build & Development Tools

**Development Stack:**
```
Package Manager: npm
├── Linting: ESLint 9 + TypeScript ESLint
├── Type Checking: TypeScript strict mode
├── Build Tool: Next.js Compiler + Webpack
└── Code Formatting: Prettier (via ESLint)

Scripts:
├── npm run dev     → Development server
├── npm run build   → Production build
├── npm run start   → Production server
├── npm run lint    → Code linting
└── npm run postbuild → Sitemap generation
```

### Deployment Configuration

**Primary: Netlify**
```toml
Build Command: npm run build
Publish Directory: .next
Node Version: 18+
Environment: Production optimizations enabled

Features:
├── Automatic deploys from main branch
├── Edge CDN distribution
├── HTTPS/SSL certificates
└── Continuous deployment
```

**Build Optimization:**
- Bundle size: <152kB First Load JS (60% reduction)
- Tree shaking and dead code elimination
- Code splitting for route-specific chunks
- Font subsetting and preloading
- Image optimization pipeline

---

## 📄 Page Routes

### Portfolio Pages

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/` | `src/app/page.tsx` | Home with ModernHero | Full-screen hero |
| `/about` | `src/app/about/page.tsx` | Personal story with tabbed navigation | Standard layout |
| `/projects` | `src/app/projects/page.tsx` | Project showcase with warm cards | Standard layout |
| `/resume` | `src/app/resume/page.tsx` | Professional resume with download | Standard layout |
| `/contact` | `src/app/contact/page.tsx` | Contact information and social links | Standard layout |

### Content Pages

| Route | File | Purpose | Layout |
|-------|------|---------|--------|
| `/blog` | `src/app/blog/page.tsx` | Blog listing (currently disabled) | Standard layout |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Blog posts (MDX) | Standard layout |
| `/newsletter` | `src/app/newsletter/page.tsx` | Newsletter subscription | Standard layout |
| `/testimonials` | `src/app/testimonials/page.tsx` | Client testimonials | Standard layout |
| `/faq` | `src/app/faq/page.tsx` | FAQ section | Standard layout |

### Utility Pages

| Route | File | Purpose |
|-------|------|---------|
| `/search` | `src/app/search/page.tsx` | Global search interface |
| `/writing` | `src/app/writing/page.tsx` | Writing portfolio |

---

## 🔌 API Endpoints

### Core Application APIs

| Endpoint | File | Purpose | Method |
|----------|------|---------|--------|
| `/api/analytics/events` | `src/app/api/analytics/events/route.ts` | Event tracking | POST |
| `/api/analytics/web-vitals` | `src/app/api/analytics/web-vitals/route.ts` | Performance metrics | POST |
| `/api/newsletter/subscribe` | `src/app/api/newsletter/subscribe/route.ts` | Newsletter subscription | POST |
| `/api/search` | `src/app/api/search/route.ts` | Global search | GET |

### API Response Format

All APIs follow consistent format:
```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🧩 Component Architecture

### Component Organization

```
src/components/
├── ui/                      # Core UI library
│   ├── WarmCard.tsx        # Main container component
│   ├── ModernButton.tsx    # Button component
│   ├── Heading.tsx         # Typography
│   └── JourneyTimeline.tsx # Timeline component
│
├── ModernHero.tsx          # Hero section
├── ContactContent.tsx      # Contact page content
├── ProjectsContent.tsx     # Projects showcase
├── About.tsx               # About page component
│
├── blog/                   # Blog components
│   └── BlogFilter.tsx      # Blog filtering
│
├── newsletter/             # Newsletter components
└── testimonials/           # Testimonial components
```

### Core UI Components

**WarmCard** - Main container:
```tsx
<WarmCard
  hover={true}      // Hover effect
  padding="xl"      // xs | sm | md | lg | xl
>
  Content
</WarmCard>
```

**ModernButton** - Primary button:
```tsx
<ModernButton
  variant="primary"  // primary | secondary | outline
  size="lg"         // sm | md | lg
>
  Click Me
</ModernButton>
```

**Heading** - Typography:
```tsx
<Heading
  level={2}                    // 1-6
  className="gradient-text-warm"
>
  Your Heading
</Heading>
```

### Layout Components

**ConditionalLayout** - Route-based layout manager:
- Home page: Full-screen ModernHero
- Other pages: Standard layout with FloatingNav and footer
- Consistent background gradients

**ModernHero** - Hero section features:
- Oversized display typography (text-display-xl/xxl)
- Professional headshot with optimized Next.js Image
- Grid layout with text content and photo
- Responsive sizing: w-56 to w-72 (224-288px)
- Warm peachy borders and golden shadows
- Framer Motion animations with reduced motion support

### Component Patterns

**Consistent Prop Interfaces:**
```typescript
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Component: React.FC<ComponentProps> = ({
  className,
  children,
  variant = 'primary'
}) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};
```

---

## 📊 Data Flow

### Application Data Flow

```
Static Data Sources
├── src/constants/personal.ts (career timeline, metrics)
├── src/constants/navlinks.tsx (navigation config)
└── public/ (images, assets)
        ↓
Server Components (Default)
├── Page-level data fetching
├── Metadata generation
└── Static content rendering
        ↓
Client Components (Interactive)
├── Tab switching (Overview/Journey)
├── Form handling (Contact)
├── Animation states
└── User interactions
        ↓
Browser Rendering
└── Hydrated interactive application
```

### Content Processing

**MDX Blog Posts:**
```
content/blog/*.mdx
        ↓
Gray Matter (frontmatter parsing)
        ↓
MDX Compilation
        ↓
Dynamic routes (/blog/[slug])
        ↓
Rendered blog post pages
```

---

## 📅 Version History

### [3.0.0] - January 2025 (Current)

**Major Changes:**
- **Warm Modern Theme**: Complete redesign from cyberpunk to warm professional aesthetic
- **Portfolio-Only Focus**: Removed fantasy football features for pure professional portfolio
- **Consistency Overhaul**: Unified styling across all pages with warm color system
- **Accessibility Enhancement**: WCAG AA+ compliance with 7.5:1+ contrast ratios

**Added:**
- WarmCard component with hover effects and multiple padding options
- ModernButton with 4 variants (primary, secondary, outline, ghost)
- ModernHero with oversized typography and optimized headshot
- JourneyTimeline component with warm styling
- Enhanced reduced motion support
- Touch-friendly tap targets (44px minimum)

**Changed:**
- Color palette: Cyberpunk neon → Warm sunset/golden (#FF6B35, #F7B32B)
- Typography: Orbitron → Inter throughout for consistency
- Spacing: Standardized to py-16 sm:py-20 lg:py-24
- Images: Optimized sizing with responsive breakpoints (w-56 to w-72)
- Layout: Consistent max-widths (max-w-5xl to max-w-7xl)
- Shadows: Neon glow → Warm orange/golden shadows

**Removed:**
- All fantasy football features and infrastructure
- Cyberpunk theme elements (neon colors, terminal effects)
- GlassCard component (replaced with WarmCard)
- MorphButton component (replaced with ModernButton)
- D3.js visualization library
- SQLite database and fantasy data management
- Excessive decorative effects

**Performance:**
- Bundle size: <152kB First Load JS (60% reduction from v1.5)
- Improved text contrast for better readability
- Faster paint times with simplified animations
- Enhanced mobile performance
- Reduced dependencies footprint

### [2.0.0] - December 2024

**Major Changes:**
- Portfolio-only focus (removed fantasy football features)
- Performance overhaul (60% bundle size reduction from v1.5)
- Complete documentation rewrite

**Performance:**
- Bundle size: 173kB → 152kB First Load JS
- Removed D3.js, SQLite, FantasyPros integrations
- Optimized font loading with variable fonts
- Implemented lazy loading for heavy components

### [1.5.0] - December 2024

**Added:**
- Glassmorphism effect system
- Command palette navigation (⌘K)
- Terminal hero interface
- Performance optimized images

### [1.4.0] - November 2024

**Added:**
- Full-screen layout system
- Interactive project showcase
- Advanced SEO with structured data
- Code splitting optimization

---

## 🔗 Related Documentation

- **[README.md](./README.md)** - Project overview and quick start
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
- **[COMPONENTS.md](./COMPONENTS.md)** - Component library
- **[STYLING.md](./STYLING.md)** - Design system and styling
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment configuration

---

*Last Updated: January 2025 - Warm Modern Portfolio*
