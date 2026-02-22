# Isaac Vazquez Portfolio

A modern professional portfolio and fantasy football analytics platform showcasing Technical Product Management expertise and UC Berkeley Haas MBA candidacy, built with cutting-edge web technologies and optimized for performance and accessibility.

**🚀 Live Site:** [isaacavazquez.com](https://isaacavazquez.com)

![Portfolio Preview](https://isaacavazquez.com/images/about.webp)

## ✨ Features

### 🎯 Core Portfolio
- **Modern Professional Design System** - Blue-based palette (`#2563EB`) with slate neutrals
- **Professional Hero Section** - ModernHero component with optimized headshot
- **Full-Screen Experience** - Immersive layout optimized for content presentation
- **Responsive Design** - Mobile-first approach with touch-friendly interactions
- **Performance Optimized** - Advanced optimization techniques for fast loading

### 🏈 Fantasy Football Platform
- **Live Tier Rankings** - Position tiers (QB/RB/WR/TE/K/DST/Flex) with D3.js visualizations
- **Draft Tracker** - Real-time draft tracking tool
- **FantasyPros Integration** - Automated data pipeline with authenticated scraping
- **Expert Consensus** - Gaussian mixture model tier calculations
- **Player Images** - Automated NFL player headshot system

### 🛠️ Technical Features
- **Modern Stack** - Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Performance Optimized** - Server-side rendering, image optimization, code splitting
- **SEO Enhanced** - Structured data, sitemaps, OpenGraph meta tags
- **Accessibility First** - ARIA labels, keyboard navigation, screen reader support
- **PWA Ready** - Progressive Web App capabilities with offline support

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16 with App Router
- **UI Library:** React 19 with modern hooks
- **Styling:** Tailwind CSS v4 with modern professional design system
- **Animations:** Framer Motion for physics-based interactions
- **Typography:** Inter (body), JetBrains Mono (code)

### Data & Analytics
- **Visualizations:** D3.js for fantasy football tier charts
- **Database:** SQLite (better-sqlite3) for fantasy data persistence
- **Authentication:** NextAuth.js for admin panel

### Development & Deployment
- **Language:** TypeScript with strict mode
- **Linting:** ESLint with Next.js configuration
- **Build:** Next.js production optimization with advanced chunking
- **Deployment:** Netlify with automatic builds
- **Performance:** Bundle size optimization and lazy loading

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/IsaacAVazquez/isaacvazquez-portfolio.git
   cd isaacvazquez-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 Portfolio Sections

### Navigation
- **Home** - Professional hero section with ModernHero component
- **About** - Personal story and technical background
- **Projects** - Interactive showcase of development work
- **Resume** - Professional experience and skills
- **Contact** - Get in touch form and social links
- **Fantasy Football** - Live tier rankings and draft tracker

### Interactive Features
- **Command Palette** - Quick navigation with ⌘K
- **Modern Hero** - Professional headshot with optimized layout
- **Project Showcase** - Interactive project cards with warm styling
- **Tabbed Navigation** - Overview/Journey tabs on About page

## 🎨 Design System

### Color Palette
```css
/* Modern Professional Colors */
--color-primary: #2563EB    /* Blue 600 - primary actions, links */
--color-secondary: #1D4ED8  /* Blue 700 - secondary actions */
--color-accent: #3B82F6     /* Blue 500 - hover states, highlights */
--color-success: #059669    /* Emerald 600 - success states */
--color-warning: #D97706    /* Amber 600 - attention items */
--color-error: #DC2626      /* Red 600 - error states */

/* Slate Neutrals */
--neutral-50: #F8FAFC       /* Near-white - backgrounds */
--neutral-700: #334155      /* Dark slate - muted elements */
--neutral-900: #0F172A      /* Almost black - primary text */
```

### Typography Hierarchy
- **Display:** Inter (clean, modern headings)
- **Body:** Inter (readable, professional content)
- **Accent:** Inter (consistent throughout)
- **Code:** JetBrains Mono (technical text)

### Animation Patterns
- **Subtle Shadows:** Neutral elevation using slate-based shadows
- **Hover Lift:** Gentle elevation on interactive elements
- **Fade In:** Smooth entrance animations
- **Physics-based:** Spring animations for natural movement
- **Reduced Motion:** Full support for accessibility

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/              # About page
│   ├── contact/            # Contact form and information
│   ├── portfolio/          # Project showcase
│   ├── resume/             # Professional resume
│   ├── fantasy-football/   # Fantasy football platform
│   │   ├── tiers/[position]/  # Position tier pages
│   │   ├── rb-tiers/       # RB-specific tier page
│   │   └── draft-tracker/  # Draft tracking tool
│   └── api/                # Backend API endpoints
├── components/             # Reusable React components
│   ├── ui/                # UI component library (WarmCard, ModernButton, etc.)
│   ├── ModernHero.tsx     # Modern hero section component
│   └── ...                # Feature-specific components
├── constants/             # Static data and configuration
├── lib/                   # Utility functions and helpers
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## 🧪 Development

### Available Scripts
```bash
npm run dev                  # Start development server
npm run build                # Build for production
npm run start                # Start production server
npm run lint                 # Run ESLint
npm run postbuild            # Generate sitemap after build
npm test                     # Run unit tests
npm run test:e2e             # Run Playwright E2E tests
npm run update:fantasy-rb    # Update fantasy football RB tier data
npm run analyze              # Analyze bundle size
```

### Performance Optimizations
- **Bundle Splitting:** Portfolio-specific chunk optimization
- **Lazy Loading:** Heavy components loaded on demand
- **Font Optimization:** Strategic preloading and reduced weights
- **Image Optimization:** Next.js Image component with placeholders

## 🌐 Deployment

The site is optimized for deployment on Netlify with automatic builds.

### Build Configuration
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 18+
- **Environment:** Production optimizations enabled

### Performance Features
- **Static Generation:** Pre-rendered pages for fast loading
- **Image Optimization:** Automatic WebP conversion and sizing
- **Code Splitting:** Optimized bundle chunks for portfolio content
- **PWA:** Service worker for offline capability

## 📚 Documentation

### Development Guides
- **[GETTING-STARTED.md](./GETTING-STARTED.md)** - Quick start checklist
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive development setup
- **[COMPONENTS.md](./COMPONENTS.md)** - UI component library documentation
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance strategy overview
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common fixes and diagnostics

### Project Management & Ops
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and updates
- **[IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md)** - Roadmap + milestone tracking
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Netlify deployment configuration

## 🤝 Contributing

This is a personal portfolio project. If you're interested in collaborating or have suggestions, feel free to reach out!

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Contact

**Isaac Vazquez**
Technical Product Manager & UC Berkeley Haas MBA Candidate

- **Website:** [isaacavazquez.com](https://isaacavazquez.com)
- **LinkedIn:** [isaac-vazquez](https://linkedin.com/in/isaac-vazquez)
- **Email:** isaacavazquez95@gmail.com
- **GitHub:** [IsaacAVazquez](https://github.com/IsaacAVazquez)

---

*Built with care by Isaac Vazquez - A showcase of modern web development and product management excellence*
