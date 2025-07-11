# Isaac Vazquez Portfolio

A cyberpunk-themed professional portfolio website showcasing QA Engineering expertise, built with cutting-edge web technologies and featuring an interactive fantasy football tier visualization system.

**🚀 Live Site:** [isaacvazquez.com](https://isaacvazquez.com)

![Portfolio Preview](https://isaacvazquez.com/images/about.webp)

## ✨ Features

### 🎯 Core Portfolio
- **Cyberpunk Design System** - Electric blue and matrix green color palette with glassmorphism effects
- **Terminal Interface** - Interactive command-line hero section with realistic typing animations
- **Full-Screen Experience** - Immersive layout without traditional sidebars
- **Responsive Design** - Mobile-first approach with touch-friendly interactions
- **Dark Theme** - Professional cyberpunk aesthetic throughout

### 📊 Fantasy Football Tier Charts
- **Boris Chen-Style Visualizations** - Expert consensus rankings with tier clustering
- **Multiple Data Sources** - FantasyPros integration, CSV import, manual entry
- **Scoring Format Support** - Standard, PPR, and Half-PPR variations
- **Real-time Data** - Live updates from FantasyPros expert consensus
- **Interactive Charts** - D3.js visualizations with zoom and pan controls

### 🛠️ Technical Features
- **Modern Stack** - Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Performance Optimized** - Server-side rendering, image optimization, code splitting
- **SEO Enhanced** - Structured data, sitemaps, OpenGraph meta tags
- **Accessibility First** - ARIA labels, keyboard navigation, screen reader support

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **UI Library:** React 19 with modern hooks
- **Styling:** Tailwind CSS v4 with custom cyberpunk theme
- **Animations:** Framer Motion for physics-based interactions
- **Typography:** Orbitron (headings), Inter (body), JetBrains Mono (code)

### Data Visualization
- **Charts:** D3.js for interactive tier visualizations
- **Clustering:** K-means and Gaussian Mixture Models
- **Data Processing:** TypeScript implementations of statistical algorithms

### Backend & APIs
- **Runtime:** Node.js with Next.js API routes
- **Data Sources:** FantasyPros integration, CSV parsing
- **Authentication:** Session-based FantasyPros login
- **Storage:** In-memory data management with persistent API

### Development & Deployment
- **Language:** TypeScript with strict mode
- **Linting:** ESLint with Next.js configuration
- **Build:** Next.js production optimization
- **Deployment:** Netlify with automatic builds
- **Analytics:** Built-in performance monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/IsaacAVazquez/Website.git
   cd Website
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

### Environment Variables (Optional)
```env
FANTASYPROS_API_KEY=your_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

## 📱 Usage

### Portfolio Navigation
- **Home** - Terminal hero interface with animated commands
- **About** - Personal story and technical background
- **Projects** - Showcase of development work
- **Resume** - Professional experience and skills
- **Contact** - Get in touch form and social links

### Fantasy Football Features
1. **Access the admin panel** at `/admin`
2. **Import data** using one of several methods:
   - FantasyPros login (recommended)
   - Free rankings (no authentication)
   - CSV upload
   - Manual text entry
3. **View visualizations** at `/fantasy-football`
4. **Switch between** positions and scoring formats
5. **Interact with charts** using zoom and pan controls

## 🎨 Design System

### Color Palette
```css
/* Primary Cyberpunk Colors */
--electric-blue: #00F5FF    /* Primary accent, headings, links */
--matrix-green: #39FF14     /* Secondary accent, highlights */
--warning-amber: #FFB800    /* Warnings, attention items */
--error-red: #FF073A        /* Errors, critical states */
--neon-purple: #BF00FF      /* Tertiary accent, effects */

/* Terminal Interface */
--terminal-bg: #0A0A0B      /* Dark backgrounds, cards */
--terminal-text: #00FF00    /* Terminal-style text */
--terminal-cursor: #00F5FF  /* Cursor and active states */
```

### Typography Hierarchy
- **Display:** Orbitron (futuristic, cyberpunk headings)
- **Body:** Inter (readable, professional content)
- **Accent:** Syne (modern, stylish highlights)
- **Code:** JetBrains Mono (technical, terminal text)

### Animation Patterns
- **Glassmorphism:** Backdrop blur with transparency
- **Glow Effects:** Electric accents on hover states
- **Terminal Animations:** Realistic typing and cursor effects
- **Physics-based:** Spring animations for natural movement

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── about/          # About page
│   ├── admin/          # Fantasy football data management
│   ├── api/            # Backend API endpoints
│   ├── contact/        # Contact form and information
│   ├── fantasy-football/ # Tier chart visualization
│   ├── projects/       # Project showcase
│   └── resume/         # Professional resume
├── components/         # Reusable React components
│   ├── ui/            # UI component library
│   └── ...            # Feature-specific components
├── constants/         # Static data and configuration
├── lib/              # Utility functions and helpers
├── types/            # TypeScript type definitions
└── data/             # Sample data and test fixtures
```

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run postbuild    # Generate sitemap after build
```

### Key Development Tools
- **Hot Reload:** Instant updates during development
- **TypeScript:** Strict type checking and IntelliSense
- **ESLint:** Code quality and consistency
- **Prettier:** Automatic code formatting (via ESLint)

## 🌐 Deployment

The site is deployed on Netlify with automatic builds from the main branch.

### Build Configuration
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 18+
- **Environment:** Production optimizations enabled

### Performance Features
- **Static Generation:** Pre-rendered pages for fast loading
- **Image Optimization:** Automatic WebP conversion and sizing
- **Code Splitting:** Automatic bundle optimization
- **CDN:** Global content delivery network

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any improvements.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Contact

**Isaac Vazquez**  
QA Engineer & Full-Stack Developer

- **Website:** [isaacvazquez.com](https://isaacvazquez.com)
- **LinkedIn:** [isaac-vazquez](https://linkedin.com/in/isaac-vazquez)
- **Email:** isaacavazquez95@gmail.com
- **GitHub:** [IsaacAVazquez](https://github.com/IsaacAVazquez)

---

*Built with ⚡ by Isaac Vazquez - Showcasing the intersection of QA expertise and full-stack development*