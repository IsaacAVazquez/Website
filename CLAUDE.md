# Isaac Vazquez Portfolio - Comprehensive Application Overview

## Project Summary
Isaac Vazquez's professional portfolio website featuring a sleek, modern aesthetic with contemporary professional colors, clean typography, and accessible design optimized for both desktop and mobile experiences.

**Live Site:** https://isaacavazquez.com
**Owner:** Isaac Vazquez (Technical Product Manager & UC Berkeley Haas MBA Candidate)
**Primary Purpose:** Professional Portfolio
**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion

---

## Application Architecture Overview

### **Professional Portfolio Platform**

This is a modern portfolio application showcasing:

- Modern hero section with professional headshot
- Project showcase with modern card styling
- Professional resume with download capability
- Contact page with social links
- About page with tabbed navigation (Overview/Journey)
- Blog system with MDX support
- Consulting services page

---

## Architecture & Technical Stack

### Framework & Core Technologies
- **Next.js 15** with App Router architecture
- **TypeScript** for comprehensive type safety
- **Tailwind CSS v4** for styling with custom modern professional theme
- **Framer Motion** for animations and micro-interactions
- **React 19** with modern hooks and patterns

### Key Dependencies
#### Core UI & Animation
- `@tabler/icons-react` (v3.34.1) - Primary icon system
- `lucide-react` (v0.539.0) - Additional icon library
- `react-icons` (v5.5.0) - Supplementary icons
- `framer-motion` (v12.23.12) - Animations and transitions
- `tailwind-merge` (v3.3.1) - Dynamic class merging
- `@tailwindcss/typography` (v0.5.16) - Rich text styling
- `clsx` (v2.1.1) - Conditional class names

#### Content & SEO
- `next-sitemap` (v4.2.3) - SEO sitemap generation
- `gray-matter` (v2.0.1) - MDX/Markdown processing
- `remark` (v15.0.1) - Content processing pipeline
- `remark-gfm` (v4.0.1) - GitHub-flavored markdown
- `remark-html` (v16.0.1) - HTML rendering

#### Performance
- `web-vitals` (v5.1.0) - Performance monitoring and analytics

### Build & Deployment
- **Build Command:** `npm run build`
- **Dev Server:** `npm run dev`
- **Deployment:** Netlify (primary platform)
- **SEO:** Automatic sitemap generation, structured data, OpenGraph metadata
- **Bundle Analysis:** `npm run analyze` - Webpack bundle analyzer integration
- **Bundle Size:** Optimized with advanced code splitting strategies

---

## Design System: Modern Professional Theme

### Color Palette
```css
/* Modern Professional Colors */
--color-primary: #0F172A        /* Slate 900 - Deep professional blue-gray */
--color-secondary: #3B82F6      /* Blue 500 - Bright, trustworthy blue */
--color-accent: #06B6D4         /* Cyan 500 - Fresh, modern cyan */
--color-tertiary: #10B981       /* Emerald 500 - Vibrant green */
--color-success: #10B981        /* Emerald 500 - Success states */
--color-warning: #F59E0B        /* Amber 500 - Attention-grabbing */
--color-error: #EF4444          /* Red 500 - Clear error indication */

/* Additional Accent Colors */
--color-purple: #8B5CF6         /* Violet 500 - Creative accent */
--color-pink: #EC4899           /* Pink 500 - Modern highlight */
--color-indigo: #6366F1         /* Indigo 500 - Tech-forward */

/* Modern Slate Gray Scale */
--neutral-50: #F8FAFC           /* Slate 50 - Lightest background */
--neutral-100: #F1F5F9          /* Slate 100 - Light surface */
--neutral-200: #E2E8F0          /* Slate 200 - Subtle borders */
--neutral-500: #64748B          /* Slate 500 - Secondary text */
--neutral-700: #334155          /* Slate 700 - Dark text */
--neutral-900: #0F172A          /* Slate 900 - Primary dark */

/* Semantic Colors */
--text-primary: #0F172A         /* Slate 900 - Primary text */
--text-secondary: #475569       /* Slate 600 - Secondary text */
--surface-primary: rgba(255, 255, 255, 1)     /* Pure white */
--surface-secondary: rgba(248, 250, 252, 1)   /* Slate 50 */
--surface-elevated: rgba(255, 255, 255, 1)    /* Pure white elevated */
--border-primary: rgba(226, 232, 240, 1)      /* Slate 200 border */
```

### Typography Hierarchy
- **Headings:** Inter (clean, modern, professional)
- **Body Text:** Inter (optimal readability)
- **Display Text:** Oversized Inter for hero sections (text-display-xl/xxl)
- **Code:** JetBrains Mono (monospace, technical)
- **Font Variables:**
  - `--font-inter` - Primary sans-serif
  - `--font-jetbrains-mono` - Monospace

### Animation Patterns
- **Modern Shadows:** Clean, subtle shadows for depth (shadow-subtle, shadow-elevated)
- **Hover Lift:** Gentle elevation on interactive elements with smooth transitions
- **Fade In:** Smooth entrance animations with Framer Motion
- **Physics-based:** Spring animations with custom timing (cubic-bezier(0.34, 1.56, 0.64, 1))
- **Reduced Motion:** Full support for accessibility preferences
- **Micro-interactions:** float, pulse-slow, gradient-shift, skeleton-loading
- **Custom Animations:** slide-in-up, shake, spinner-rotate

---

## Application Structure

### Complete Page Routing & Content

#### **Portfolio Pages**
```
/ (Home)                    - ModernHero with oversized typography and headshot
/about                      - Personal story with tabbed navigation (Overview/Journey)
/projects                   - Project showcase with modern card styling
/resume                     - Professional resume with download capability
/contact                    - Contact information and social links
/consulting                 - Consulting services and offerings
```

#### **Content & Community Pages**
```
/blog                       - Blog listing with MDX support
/blog/[slug]                - Individual blog posts
/writing                    - Writing portfolio and articles
/writing/[slug]             - Individual writing pieces
/notes                      - Notes and quick thoughts
/newsletter                 - Newsletter subscription
/testimonials               - Client and colleague testimonials
/faq                        - Frequently asked questions
```

#### **Admin & Utility Pages**
```
/admin                      - Admin dashboard (authenticated)
/admin/analytics            - Analytics and metrics dashboard
/search                     - Global search functionality
```

#### **SEO & Structured Data**
```
/sitemap.xml                - Auto-generated sitemap
/sitemap-local.xml          - Local business structured data
/robots.txt                 - Search engine directives
/manifest.json              - PWA manifest
```

### Navigation System
- **FloatingNav:** Persistent navigation overlay with active route highlighting
- **CommandPalette:** Keyboard shortcut navigation (⌘K) with quick page access
- **Mobile Navigation:** Touch-friendly floating navigation
- **Skip Links:** Accessibility-first navigation
- **Footer:** Social links and site information

### URL Redirects & Aliases
The application includes comprehensive URL redirects for SEO and user experience:
- `/portfolio`, `/work` → `/projects`
- `/cv` → `/resume`
- `/get-in-touch`, `/hire-me` → `/contact`
- `/blog/posts/:slug`, `/articles/:slug` → `/blog/:slug`

---

## API Architecture

### Core Application APIs
```
/api/analytics/
├── events                  - Event tracking and user analytics
└── web-vitals              - Performance monitoring and Core Web Vitals

/api/content/
├── newsletter/subscribe    - Newsletter subscription
├── search                  - Global search functionality
├── rss                     - RSS feed generation
└── scrape                  - Web scraping utilities
```

**Note:** Most content is static and pre-rendered for optimal performance.

---

## Component Architecture

### Core Layout Components
- **`ConditionalLayout`** (`src/components/ConditionalLayout.tsx`) - Dynamic route and layout management
- **`ModernHero`** (`src/components/ModernHero.tsx`) - Home page hero with oversized typography
- **`Header`** (`src/components/Header.tsx`) - Page header component
- **`Footer`** (`src/components/Footer.tsx`) - Footer with social links
- **`BackgroundEffects`** (`src/components/BackgroundEffects.tsx`) - Animated background elements
- **`Circles`** (`src/components/Circles.tsx`) - Decorative circle animations

### UI Component Library (`src/components/ui/`)
- **`WarmCard`** - Main container with modern professional styling, hover effects, multiple padding options
- **`ModernButton`** - Button with 4 variants (primary, secondary, outline, ghost)
- **`Badge`** - Modern-styled labels and tags
- **`Heading`** - Typography component with hierarchy (h1-h6)
- **`Paragraph`** - Body text component with theme integration
- **`FloatingNav`** - Persistent navigation overlay with active route highlighting
- **`CommandPalette`** - Keyboard-driven command interface (⌘K)
- **`SkipToContent`** - Accessibility skip link component
- **`OptimizedImage`** - Image optimization wrapper with Next.js Image
- **`JourneyTimeline`** - Career timeline visualization component

### Portfolio-Specific Components
- **`About`** (`src/components/About.tsx`) - About page with tabbed navigation
- **`ProductManagerJourney`** (`src/components/ProductManagerJourney.tsx`) - Career journey timeline
- **`ProjectsContent`** (`src/components/ProjectsContent.tsx`) - Project showcase
- **`ProjectDetailModal`** (`src/components/ProjectDetailModal.tsx`) - Project detail modal
- **`ContactContent`** (`src/components/ContactContent.tsx`) - Contact page layout
- **`ConsultingContent`** (`src/components/ConsultingContent.tsx`) - Consulting services display

### Advanced UI Components
- **`SkillsRadar`** (`src/components/ui/SkillsRadar.tsx`) - Radar chart for skills visualization
- **`PersonalMetrics`** (`src/components/ui/PersonalMetrics.tsx`) - Animated metrics display
- **`QADashboard`** (`src/components/ui/QADashboard.tsx`) - Quality assurance dashboard
- **`LazyQADashboard`** - Lazy-loaded QA dashboard
- **`WebVitalsDashboard`** (`src/components/ui/WebVitalsDashboard.tsx`) - Performance metrics
- **`SystemInfo`** (`src/components/ui/SystemInfo.tsx`) - System information display
- **`RelatedContent`** (`src/components/ui/RelatedContent.tsx`) - Related content suggestions

### Content Components
- **Blog Components** (`src/components/blog/`) - Blog-specific components
- **Newsletter Components** (`src/components/newsletter/`) - Newsletter subscription
- **Search Components** (`src/components/search/`) - Search functionality
- **Testimonials Components** (`src/components/testimonials/`) - Testimonial display
- **FAQ Components** (`src/components/FAQ/`) - FAQ accordion and display
- **Local SEO Components** (`src/components/local-seo/`) - Local business markup

### Utility Components
- **`Analytics`** (`src/components/Analytics.tsx`) - Analytics tracking wrapper
- **`Providers`** (`src/components/Providers.tsx`) - React context providers
- **`Container`** (`src/components/Container.tsx`) - Layout container
- **`Prose`** (`src/components/Prose.tsx`) - Typography wrapper for content
- **`Highlight`** (`src/components/Highlight.tsx`) - Text highlighting
- **`StructuredData`** (`src/components/StructuredData.tsx`) - JSON-LD structured data

---

## Data Management System

### Static Content Management
```
src/constants/
├── personal.ts             - Personal information, career data, metrics, achievements
├── navlinks.tsx            - Navigation configuration and routing
├── socials.tsx             - Social media links
└── testimonials.ts         - Client testimonials data
```

### Utility Libraries (`src/lib/`)
```
Core Utilities:
├── utils.ts                - General utility functions
├── seo.ts                  - SEO metadata generation
├── performance.ts          - Performance monitoring
├── analytics.ts            - Analytics tracking
├── auth.ts                 - Authentication utilities
├── logger.ts               - Logging system
└── rateLimit.ts            - API rate limiting

Content & SEO:
├── blog.ts                 - Blog post processing
├── faqData.ts              - FAQ data management
├── localSEO.ts             - Local business SEO
├── localSitemap.ts         - Local sitemap generation
└── webScraper.ts           - Web scraping utilities
```

### Custom Hooks (`src/hooks/`)
```
src/hooks/
├── useDebounce.ts                 - Input debouncing utility
├── useLazyLoad.ts                 - Lazy loading for performance
├── useNavigation.ts               - Navigation state management
├── useScrollAnimation.ts          - Scroll-based animations
├── useTypingAnimation.ts          - Typing effect animations

Content Hooks:
└── useBlogPost.ts                 - Blog post data fetching
```

### TypeScript Types (`src/types/`)
```
src/types/
├── index.ts                       - Core type definitions
└── navlink.tsx                    - Navigation link types
```

---

## Features & Functionality

### ModernHero Component
**File:** `src/components/ModernHero.tsx`
- Oversized display typography with warm gradient text
- Professional headshot with optimized Next.js Image
- Grid layout responsive across all breakpoints
- Framer Motion animations with reduced motion support
- Warm mesh gradient background
- Call-to-action buttons (Resume, Get In Touch)

### Component Features

#### **WarmCard System**
- Multiple padding options (none, sm, md, lg, xl)
- Optional hover lift effect
- Clean borders and subtle professional shadows
- Accessibility-friendly with ARIA labels
- Dark mode support with modern slate color palette

#### **ModernButton Variants**
- **Primary:** Deep slate with clean shadows
- **Secondary:** Bright blue for secondary actions
- **Outline:** Bordered style for tertiary actions
- **Ghost:** Minimal style for subtle interactions
- Touch-friendly (44px minimum tap target)
- Reduced motion support

#### **JourneyTimeline Component**
- Career timeline visualization
- Company logos and position details
- Tech stack badges for each role
- Warm styling throughout
- Responsive layout

### Animation Framework
- **Framer Motion** for smooth, physics-based animations
- Fade-in entrance animations for page content
- Hover lift effects on interactive elements
- Staggered animations with delays
- Full reduced motion support for accessibility
- Spring-based transitions with custom timing functions
- Custom keyframe animations (float, gradient-shift, skeleton-loading, slide-in-up, shake, spinner-rotate)

### SEO & Performance Optimization
**Files:** `src/lib/seo.ts`, `src/lib/performance.ts`
- Comprehensive metadata generation
- Structured data (JSON-LD) for rich snippets
- OpenGraph and Twitter card optimization
- Automatic sitemap generation (general + local business)
- Next.js Image optimization (AVIF, WebP)
- Core Web Vitals monitoring
- Advanced webpack bundle splitting:
  - Separate chunks for UI components, icons, Framer Motion
  - Content features chunk (blog, newsletter)
  - Vendor chunking strategy
  - Tree shaking and dead code elimination
- Console removal in production
- Package import optimization (@tabler/icons-react, lucide-react, framer-motion)

---

## Development Guidelines

### Code Organization
```
Website/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── page.tsx            # Home page (ModernHero)
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── about/              # About page
│   │   ├── projects/           # Projects showcase
│   │   ├── resume/             # Resume page
│   │   ├── contact/            # Contact page
│   │   ├── consulting/         # Consulting services
│   │   ├── blog/               # Blog with MDX support
│   │   ├── writing/            # Writing portfolio
│   │   ├── notes/              # Notes section
│   │   ├── admin/              # Admin dashboard (authenticated)
│   │   ├── newsletter/         # Newsletter subscription
│   │   ├── testimonials/       # Testimonials page
│   │   ├── faq/                # FAQ page
│   │   ├── search/             # Search functionality
│   │   └── api/                # API routes
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Core UI component library
│   │   ├── blog/               # Blog-specific components
│   │   ├── newsletter/         # Newsletter components
│   │   ├── search/             # Search components
│   │   ├── testimonials/       # Testimonial components
│   │   ├── FAQ/                # FAQ components
│   │   ├── navigation/         # Navigation components
│   │   ├── local-seo/          # SEO components
│   │   └── lazy/               # Lazy-loaded components
│   ├── constants/              # Static data and configuration
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and helpers
│   ├── types/                  # TypeScript type definitions
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
│   ├── images/                 # Image assets
│   ├── project-screenshots/    # Project portfolio images
│   ├── Isaac_Vazquez_Resume.pdf
│   ├── favicon.png
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── postcss.config.js           # PostCSS configuration
├── next-sitemap.config.js      # Sitemap generation
├── netlify.toml                # Netlify deployment
└── package.json                # Dependencies and scripts
```

### Component Patterns
- **Consistent Props Interface:** All components use comprehensive TypeScript interfaces
- **Accessibility First:** ARIA labels, focus management, keyboard navigation
- **Responsive Design:** Mobile-first approach with breakpoint consistency
- **Theme Integration:** All components use CSS custom properties from globals.css
- **Performance Optimization:** Lazy loading, code splitting, memoization
- **Error Boundaries:** Graceful error handling in components
- **Server/Client Components:** Clear separation with 'use client' directives

### Styling Conventions
- **Tailwind Classes:** Utility-first with modern professional theme extensions
- **CSS Custom Properties:** Defined in `src/app/globals.css` at `:root`
  - Color variables (--color-primary, --color-secondary, etc.)
  - Spacing scale (--space-xs through --space-4xl)
  - Font sizes (--text-xs through --text-display-xxl)
  - Shadow utilities (--shadow-subtle, --shadow-elevated, --shadow-primary)
  - Surface colors (--surface-primary, --surface-secondary, etc.)
- **Component Variants:** Consistent sizing, color, and state variations
- **Animation Classes:** Reusable animation utilities with reduced motion support
- **Dark Mode:** Class-based dark mode with modern slate color palette

### Performance Considerations
- **Image Optimization:**
  - Next.js Image component with AVIF/WebP formats
  - Device sizes: [640, 750, 828, 1080, 1200, 1920, 2048]
  - Image sizes: [16, 32, 48, 64, 96, 128, 256, 384]
  - 30-day cache TTL
  - Lazy loading with blur placeholders
- **Font Loading:** Variable fonts (Inter, JetBrains Mono) with swap strategy
- **Code Splitting:**
  - Route-based splitting with App Router
  - Component-level splitting with React.lazy()
  - Advanced webpack chunk optimization
- **Bundle Optimization:** Tree shaking, dead code elimination, minification
- **Static Generation:** Pre-rendering for portfolio pages

### TypeScript Guidelines
- **Strict Mode Enabled:** Full TypeScript strict mode (currently with build errors ignored)
- **Type Definitions:** Comprehensive types in `src/types/index.ts`
- **Interface First:** Prefer interfaces over types for object shapes
- **Explicit Return Types:** Document function signatures
- **No Implicit Any:** Avoid implicit any (when strict mode fully enforced)

---

## Configuration Files

### Core Configuration
- **`next.config.mjs`** - Next.js configuration
  - URL redirects (portfolio, legacy URLs)
  - Image optimization (AVIF, WebP, remote patterns)
  - Webpack customization (bundle splitting, externals)
  - Experimental features (package import optimization, scroll restoration)
  - Build-time linting/TypeScript bypass (temporary)
  - Console removal in production
  - Bundle analyzer integration

- **`tailwind.config.ts`** - Tailwind CSS configuration
  - Custom warm modern theme colors
  - Font family definitions
  - Extended spacing scale
  - Custom animations and keyframes
  - Box shadow utilities
  - Typography plugin
  - Color variable generation

- **`tsconfig.json`** - TypeScript configuration
  - Strict mode enabled
  - Path aliases configured
  - Next.js plugin integration

- **`eslint.config.js`** - ESLint configuration
  - Next.js recommended rules
  - React refresh plugin

- **`postcss.config.js`** - PostCSS configuration
  - Tailwind CSS v4 support
  - Autoprefixer

- **`next-sitemap.config.js`** - Sitemap generation
  - Automatic sitemap creation
  - URL priority settings
  - Change frequency configuration

### Deployment Configuration
- **`netlify.toml`** - Netlify deployment configuration
  - Build commands and settings
  - Environment variables
  - Redirect rules

### Environment & Build
- **Development:** `npm run dev` (http://localhost:3000)
- **Production Build:** `npm run build` + `npm run start`
- **Post-Build:** `npm run postbuild` (sitemap generation)
- **Linting:** `npm run lint` (currently bypassed in build)
- **Bundle Analysis:** `npm run analyze` or `ANALYZE=true npm run build`

---

## Navigation Structure

### Complete Navigation System
```typescript
// Primary navigation (src/constants/navlinks.tsx)
[
  { href: "/", label: "Home", icon: IconHome },
  { href: "/about", label: "About", icon: IconUser },
  { href: "/projects", label: "Projects", icon: IconBriefcase },
  { href: "/resume", label: "Resume", icon: IconFileText },
  { href: "/contact", label: "Contact", icon: IconMail }
]
```

### Social Links & Professional Presence
```typescript
// src/constants/socials.tsx
- LinkedIn: https://linkedin.com/in/isaac-vazquez
- GitHub: https://github.com/isaacavazquez
- Email: isaacavazquez95@gmail.com
- Website: https://isaacavazquez.com
```

---

## Recent Major Changes & Evolution

### Current State (February 2026)
- **Professional Portfolio:** Clean, focused portfolio platform
- **Modern Professional Design:** Slate-based color palette with contemporary aesthetic
- **Component Library:** Extensive UI component system with WarmCard/ModernButton
- **Performance Optimization:** Advanced code splitting, lazy loading
- **SEO Enhancement:** Comprehensive metadata, structured data, sitemap generation

### Modern Design Update (February 2026)
- **Color Palette Modernization:** Updated to contemporary slate/blue professional colors
- **Enhanced Contrast:** WCAG AA+ compliance with modern slate gray scale
- **Clean Aesthetics:** Professional blue accents with cyan and emerald highlights
- **Dark Mode Enhancement:** Rich slate-based dark theme with vibrant accent colors
- **Contemporary Styling:** Aligned with modern portfolio trends (2025-2026)

### Previous Design Evolution (January 2025)
- **Complete Theme Overhaul:** Cyberpunk → Professional aesthetic
- **Component Modernization:** GlassCard → WarmCard, MorphButton → ModernButton
- **Typography Simplification:** Orbitron → Inter throughout for consistency
- **Accessibility Enhancement:** WCAG AA+ compliance with excellent contrast ratios
- **Performance Optimization:** 60% bundle size reduction

### Component Architecture
- **ModernHero:** Oversized typography with professional headshot
- **WarmCard:** Modern professional container with hover effects
- **ModernButton:** 4 variants optimized for modern palette
- **JourneyTimeline:** Career visualization component
- **Responsive Layout:** Mobile-first with consistent spacing

---

## Known Issues & Technical Debt

### Build Configuration
- **TypeScript Strict Mode:** Build errors currently bypassed with `ignoreBuildErrors: true`
- **ESLint:** Linting bypassed during builds with `ignoreDuringBuilds: true`
- **Action Items:**
  - Resolve remaining TypeScript type errors
  - Re-enable strict type checking
  - Fix ESLint warnings and errors
  - Remove build bypasses

### Performance Optimizations Needed
- Bundle size reduction opportunities
- Image optimization improvements

### Accessibility Improvements
- WCAG AAA compliance audit needed
- Keyboard navigation enhancements
- Screen reader optimization
- Focus management improvements

---

## Future Development Roadmap

### Content Enhancements
- **Blog System Expansion:** More MDX features, syntax highlighting, table of contents
- **Case Studies:** Deep dives into major projects and product work
- **Video Content:** Project demos and product walkthroughs
- **Interactive Prototypes:** Embedded product prototypes

### Interactive Features
- **Skills Visualization:** Interactive skills radar (SkillsRadar component exists)
- **Project Filtering:** Advanced filtering and categorization
- **Search Enhancement:** Full-text search with algolia/meilisearch
- **Dark Mode Toggle:** Manual theme switching (dark mode CSS already implemented)

### Technical Enhancements
- **Type Safety:** Resolve all TypeScript errors, enable strict mode
- **Testing:** Unit tests, integration tests, E2E tests
- **CI/CD:** Automated testing and deployment pipeline
- **Monitoring:** Error tracking (Sentry), performance monitoring (Vercel Analytics)
- **A/B Testing:** Experimentation framework

### Performance Optimization
- **Bundle Size:** Target <100kB First Load JS
- **Lighthouse Score:** Achieve 95+ across all metrics
- **Core Web Vitals:** Optimize LCP, FID, CLS

---

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Analyze bundle size
npm run analyze
```

### Common Development Tasks

#### Adding a New Page
1. Create page component in `src/app/[page-name]/page.tsx`
2. Add route to navigation in `src/constants/navlinks.tsx` (if needed)
3. Update sitemap configuration in `next-sitemap.config.js`
4. Add metadata for SEO in page component

#### Creating a New Component
1. Create component file in appropriate directory (`src/components/` or `src/components/ui/`)
2. Define TypeScript interface for props
3. Implement accessibility features (ARIA labels, keyboard navigation)
4. Add responsive design (mobile-first)
5. Test with reduced motion preferences
6. Document usage and props

#### Styling Guidelines
1. Use Tailwind utility classes first
2. Reference CSS custom properties from `globals.css`
3. Implement warm color palette (primary, secondary, accent)
4. Ensure 44px minimum touch targets
5. Test with dark mode class
6. Add reduced motion variants

---

## Testing Strategy

### Current State
- **Unit Tests:** Not currently implemented
- **Integration Tests:** Not currently implemented
- **E2E Tests:** Not currently implemented
- **Manual Testing:** Primary testing method

### Recommended Testing Stack
- **Jest** - Unit testing framework
- **React Testing Library** - Component testing
- **Playwright** or **Cypress** - E2E testing
- **MSW (Mock Service Worker)** - API mocking
- **Testing Library User Event** - User interaction simulation

---

## Deployment & CI/CD

### Netlify Deployment
**File:** `netlify.toml`
- **Primary Platform:** Netlify
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:** Configure in Netlify dashboard
- **Deploy Previews:** Enabled for pull requests
- **Continuous Deployment:** Enabled for main branch

### Environment Variables
```env
# Analytics (optional)
NEXT_PUBLIC_GA_ID=<google_analytics_id>
```

### Build Optimization
- **Static Generation:** Portfolio pages pre-rendered
- **Edge Functions:** Potential use for API routes (Netlify Edge Functions)

---

## Monitoring & Analytics

### Performance Monitoring
**File:** `src/lib/performance.ts`
- Core Web Vitals tracking (LCP, FID, CLS)
- Custom performance metrics
- `/api/analytics/web-vitals` endpoint for data collection

### User Analytics
**File:** `src/lib/analytics.ts`
- Event tracking system
- Page view analytics
- User interaction metrics
- `/api/analytics/events` endpoint

### Error Tracking
- **Current:** Console logging (removed in production)
- **Recommended:** Sentry or similar error tracking service

---

## Contact & Ownership

**Isaac Vazquez**
Technical Product Manager & UC Berkeley Haas MBA Candidate

**Contact Information:**
- **Email:** isaacavazquez95@gmail.com
- **LinkedIn:** https://linkedin.com/in/isaac-vazquez
- **Website:** https://isaacavazquez.com
- **GitHub:** https://github.com/isaacavazquez

**Development Context:** This platform showcases Isaac's professional journey as a Technical Product Manager. The warm, modern design reflects his approach to product development: user-friendly, accessible, and data-driven. The clean architecture and attention to detail demonstrate his technical background and commitment to quality.

**Platform Mission:** A professional portfolio that effectively communicates Isaac's product management expertise, technical capabilities, and business acumen to potential employers, collaborators, and clients. Built with modern web technologies and optimized for performance, accessibility, and user experience.

---

## AI Assistant Guidelines

### When Working on This Codebase

#### **Understanding the Purpose**
- This is a professional portfolio platform
- Changes should maintain professional aesthetic
- Focus on showcasing skills, projects, and experience

#### **Code Quality Standards**
- Follow existing TypeScript patterns and interfaces
- Maintain accessibility standards (WCAG AA minimum)
- Ensure responsive design (mobile-first)
- Add proper error handling and validation
- Document complex logic with comments
- Use semantic HTML and ARIA labels

#### **Styling Conventions**
- Use modern professional color palette (primary: #0F172A slate, secondary: #3B82F6 blue)
- Reference CSS custom properties from globals.css
- Maintain 44px minimum touch targets
- Test with dark mode
- Support reduced motion preferences
- Use Tailwind utility classes consistently

#### **Performance Considerations**
- Lazy load heavy components
- Optimize images with Next.js Image component
- Use React.memo for expensive renders
- Monitor bundle size impact

#### **Testing Checklist**
- Test on mobile and desktop viewports
- Verify keyboard navigation works
- Check screen reader compatibility
- Test with reduced motion enabled
- Verify dark mode appearance
- Test with slow network conditions

#### **Common Pitfalls to Avoid**
- Don't bypass TypeScript errors without fixing root cause
- Don't add heavy dependencies without justification
- Don't skip accessibility features
- Don't hardcode values that should be configurable
- Don't forget to update TypeScript types

#### **Commit Message Format**
```
<type>: <description>

Types: feat, fix, refactor, style, docs, test, chore, perf
Examples:
- feat: add project filtering to projects page
- fix: resolve navigation active state bug
- refactor: optimize image loading performance
- style: update button hover states for warm theme
- docs: update CLAUDE.md with new components
```

---

## Version History

**Current Version:** 0.1.0
**Last Updated:** February 2026
**Documentation Version:** 3.0

### Changelog
- **v3.0 (February 2026):** Portfolio-focused documentation
  - Removed all fantasy football references
  - Streamlined component architecture
  - Updated API architecture for portfolio-only focus
  - Simplified data management documentation
  - Updated AI assistant guidelines

- **v2.0 (November 2025):** Comprehensive rewrite reflecting actual codebase state
  - Documented dual portfolio + fantasy football purpose
  - Added complete API architecture
  - Detailed fantasy football data pipeline
  - Comprehensive component inventory
  - Build configuration and optimization details
  - Known issues and technical debt section

- **v1.0 (January 2025):** Initial CLAUDE.md creation
  - Portfolio-focused documentation
  - Warm modern theme introduction
  - Basic component architecture

---

**Note:** This documentation reflects the current state of the codebase as of February 2026. The platform is a professional portfolio showcasing technical expertise and product management experience.
