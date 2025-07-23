# Isaac Vazquez Portfolio - Application Overview

## Project Summary
This is Isaac Vazquez's personal portfolio website - a cyberpunk professional themed showcase featuring a QA Engineer's work, experience, and projects. The site emphasizes a "Digital Command Center" aesthetic with terminal interfaces, glassmorphism effects, and immersive full-screen experiences.

**Live Site:** https://isaacavazquez.com  
**Owner:** Isaac Vazquez (QA Engineer & Builder)  
**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion

---

## Architecture & Technical Stack

### Framework & Core Technologies
- **Next.js 15** with App Router architecture
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling with custom cyberpunk theme
- **Framer Motion** for animations and micro-interactions
- **React 19** with modern hooks and patterns

### Key Dependencies
- `@tabler/icons-react` - Icon system
- `framer-motion` - Animations and transitions
- `tailwind-merge` - Dynamic class merging
- `next-sitemap` - SEO sitemap generation
- `@tailwindcss/typography` - Rich text styling

### Build & Deployment
- **Build Command:** `npm run build`
- **Dev Server:** `npm run dev`
- **Deployment:** Netlify (configured via netlify.toml)
- **SEO:** Automatic sitemap generation, structured data, OpenGraph

---

## Design System: Cyberpunk Professional Theme

### Color Palette
```css
/* Primary Cyberpunk Colors */
--electric-blue: #00F5FF    /* Primary accent, headings, links */
--matrix-green: #39FF14     /* Secondary accent, highlights, success states */
--warning-amber: #FFB800    /* Warnings, attention items */
--error-red: #FF073A        /* Errors, critical states */
--neon-purple: #BF00FF      /* Tertiary accent, special effects */
--cyber-teal: #00FFBF       /* Additional accent color */

/* Terminal Interface */
--terminal-bg: #0A0A0B      /* Dark backgrounds, cards */
--terminal-border: #1A1A1B  /* Subtle borders */
--terminal-text: #00FF00    /* Terminal-style text */
--terminal-cursor: #00F5FF  /* Cursor and active states */

/* Professional Neutrals */
--slate-900 to --slate-50   /* Text hierarchy, backgrounds */
```

### Typography Hierarchy
- **Headings:** Orbitron (cyberpunk, futuristic font)
- **Body Text:** Inter (readable, professional)
- **Accents:** Syne (modern, stylish)
- **Terminal/Code:** JetBrains Mono (monospace, technical)

### Animation Patterns
- **Glassmorphism:** Backdrop blur effects with transparency
- **Glow Effects:** Electric blue/matrix green glows on hover
- **Terminal Animations:** Typing effects, cursor blinking
- **Physics-based:** Spring animations for natural movement
- **Micro-interactions:** Hover states, focus management

---

## Application Structure

### Layout System
**Conditional Full-Screen Layout:** All pages use a full-screen experience without traditional sidebars.

**File:** `src/components/ConditionalLayout.tsx`
- Home page: Immersive terminal hero with no chrome
- Other pages: Full-width content with mobile navigation
- Consistent FloatingNav and CommandPalette across all pages
- Footer shown on non-home pages

### Page Routing & Content
```
/ (Home)           - TerminalHero with animated terminal interface
/about             - Personal story, skills, background
/projects          - Bento-box layout showcasing work
/contact           - Contact form and social links
/resume            - Cyberpunk-styled professional resume
```

### Navigation System
- **FloatingNav:** Persistent navigation overlay
- **CommandPalette:** Keyboard shortcut navigation (⌘K)
- **Mobile Navigation:** Floating button for mobile users
- **GestureNavigation:** Touch-friendly interactions

---

## Key Components

### Core Layout Components
- **`ConditionalLayout`** - Routes and layout management
- **`TerminalHero`** - Home page terminal interface
- **`Footer`** - Cyberpunk-styled footer with social links

### UI Component Library
- **`GlassCard`** - Glassmorphism containers with elevation system
- **`MorphButton`** - Animated buttons with cyberpunk styling
- **`FloatingNav`** - Persistent navigation overlay
- **`CommandPalette`** - Spotlight-style command interface
- **`QADashboard`** - Interactive metrics display

### Utility Components
- **`Heading`** - Typography component with consistent styling
- **`Paragraph`** - Body text with theme integration
- **`Badge`** - Cyberpunk-styled labels and tags
- **`Circles`** - Animated background effects

### Content Components
- **`About`** - Personal information and story
- **`ProjectsContent`** - Project showcase with bento layout
- **`ContactContent`** - Contact form and information

---

## Features & Functionality

### Terminal Hero Interface
**File:** `src/components/TerminalHero.tsx`
- Animated terminal commands with realistic typing
- Split-screen layout: terminal left, hero content right
- Floating particles and grid background effects
- Professional messaging with status indicators
- Responsive design with mobile adaptations

### Glassmorphism System
**Implemented in:** `src/app/globals.css`
- 5-tier elevation system for depth
- Backdrop blur and transparency effects
- Interactive hover states with cursor tracking
- Noise textures for authentic glass appearance

### Animation Framework
- **Framer Motion** integration throughout
- Physics-based spring animations
- Staggered entrance animations
- Hover and focus micro-interactions
- Reduced motion support for accessibility

### SEO & Performance
**File:** `src/lib/seo.ts`
- Comprehensive metadata generation
- Structured data (JSON-LD) for search engines
- OpenGraph and Twitter card optimization
- Automatic sitemap generation
- Performance-optimized images and fonts

---

## Development Guidelines

### Code Organization
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── components/ui/       # UI component library
├── constants/           # Static data and configuration
├── lib/                 # Utility functions and helpers
└── types/               # TypeScript type definitions
```

### Component Patterns
- **Consistent Props Interface:** All components use TypeScript interfaces
- **Accessibility First:** ARIA labels, focus management, keyboard navigation
- **Responsive Design:** Mobile-first approach with breakpoint consistency
- **Theme Integration:** All components use CSS custom properties

### Styling Conventions
- **Tailwind Classes:** Utility-first with custom cyberpunk extensions
- **CSS Custom Properties:** Theme colors and spacing defined in `:root`
- **Component Variants:** Consistent sizing and color variations
- **Animation Classes:** Reusable animation utilities

### Performance Considerations
- **Image Optimization:** Next.js Image component with proper sizing
- **Font Loading:** Variable fonts with swap loading strategy
- **Code Splitting:** Dynamic imports for heavy components
- **Bundle Optimization:** Tree shaking and minimal dependencies

---

## Configuration Files

### Important Config Files
- **`next.config.mjs`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS with custom theme
- **`next-sitemap.config.js`** - SEO sitemap generation
- **`netlify.toml`** - Deployment configuration
- **`tsconfig.json`** - TypeScript compiler options

### Environment & Build
- **Development:** `npm run dev` (http://localhost:3000)
- **Production Build:** `npm run build` + `npm run start`
- **Linting:** `next lint` with ESLint configuration
- **Type Checking:** TypeScript strict mode enabled

---

## Navigation Structure

### Main Navigation Links
```typescript
// src/constants/navlinks.tsx
[
  { href: "/", label: "Home", icon: IconBolt },
  { href: "/about", label: "About", icon: IconMessage2 },
  { href: "/projects", label: "Projects", icon: IconBriefcase },
  { href: "/resume", label: "Resume", icon: IconFileText },
  { href: "/contact", label: "Contact", icon: IconMail }
]
```

### Social Links
- LinkedIn: https://linkedin.com/in/isaac-vazquez
- GitHub: https://github.com/isaacvazquez
- Contact: isaacavazquez95@gmail.com

---

## Recent Major Changes

### Full-Screen Layout Implementation
- **Removed traditional sidebar** across all pages
- **Implemented conditional layout system** for different page types
- **Added mobile navigation** with floating buttons
- **Updated all page components** to use full-width layouts

### Cyberpunk Theme Integration
- **Comprehensive color system** with electric blue and matrix green
- **Typography hierarchy** using Orbitron and JetBrains Mono
- **Glassmorphism component system** with elevation tiers
- **Terminal interface design** for the home page hero

### Component System Modernization
- **Advanced animation patterns** with Framer Motion
- **Accessibility improvements** with proper ARIA labels
- **Responsive design patterns** for mobile and desktop
- **Performance optimizations** for faster loading

---

## Future Development Notes

### Potential Enhancements
- **Professional tagline system** with rotating text
- **Impact metrics strip** component for achievements
- **Interactive skills visualization** (radar/tree)
- **Radial navigation menu** system
- **Smart navigation bar** with scroll detection

### Technical Debt
- Consider consolidating similar animation patterns
- Evaluate component prop interfaces for consistency
- Review and optimize bundle size
- Implement automated testing for UI components

---

## Contact & Ownership
**Isaac Vazquez**  
QA Engineer & Builder  
Email: isaacavazquez95@gmail.com  
LinkedIn: https://linkedin.com/in/isaac-vazquez  
Website: https://isaacavazquez.com

**Development Context:** This application showcases Isaac's technical skills as a QA Engineer while maintaining a professional cyberpunk aesthetic. The design emphasizes reliability, attention to detail, and modern web development practices - reflecting his professional expertise in quality assurance and software engineering.