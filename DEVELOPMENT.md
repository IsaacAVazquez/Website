# Development Guide

Complete development guide for the Isaac Vazquez Digital Platform - a modern warm-themed portfolio website built with Next.js 15.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Styling & Design](#styling--design)
- [Testing & Debugging](#testing--debugging)
- [Troubleshooting](#troubleshooting)
- [Environment Configuration](#environment-configuration)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 8+** or yarn 1.22+
- **Git** for version control
- **VS Code** recommended (see extensions below)

### One-Minute Setup
```bash
# Clone repository
git clone https://github.com/IsaacAVazquez/isaacvazquez-portfolio.git
cd isaacvazquez-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Available Commands
```bash
# Development
npm run dev          # Start dev server (hot reload)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check without building

# Utilities
npm run postbuild    # Generate sitemap (auto-runs after build)
```

---

## 🛠️ Development Environment

### VS Code Setup

**Essential Extensions:**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Environment Variables

Create `.env.local` for development:
```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Optional: Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
```

**Production Environment** (Netlify):
```env
# Required
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_production_ga_id
```

**Security Notes:**
- Never commit `.env.local` to Git
- Use strong secrets for production
- Environment variables are visible only to site owners
- Consider rotating credentials periodically

---

## 🏗️ Project Architecture

### File Structure
```
src/
├── app/                 # Next.js App Router pages & API routes
│   ├── about/          # About page
│   ├── contact/        # Contact page
│   ├── projects/       # Projects showcase
│   ├── resume/         # Resume page
│   └── api/            # Backend API endpoints
├── components/         # React components
│   ├── ui/            # Core UI library (WarmCard, ModernButton, etc.)
│   ├── ModernHero/    # Hero section component
│   └── ...            # Feature-specific components
├── constants/         # Static data and configuration
├── lib/              # Utility functions and helpers
├── types/            # TypeScript type definitions
└── hooks/            # Custom React hooks
```

### Design Patterns

**Component Structure:**
```typescript
// Consistent prop interfaces
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

// Export typed components
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

**State Management:**
- **Local state**: `useState` for component-level state
- **Server state**: Next.js data fetching
- **Global state**: Context API for theme/preferences
- **Form state**: Controlled components with validation

**Error Handling:**
```typescript
// API routes
try {
  const result = await apiCall();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}

// Components
const [error, setError] = useState<string>('');
useEffect(() => {
  fetchData().catch(err => {
    setError(err.message);
    console.error('Fetch failed:', err);
  });
}, []);
```

---

## 🔄 Development Workflow

### Branch Strategy
- `main` - Production (auto-deploys to Netlify)
- `develop` - Development integration
- `feature/*` - Feature branches
- `hotfix/*` - Critical production fixes

### Commit Convention
```bash
feat: add new project showcase
fix: resolve mobile navigation overlay
docs: update API documentation
style: improve warm theme colors
refactor: optimize component rendering
test: add unit tests for contact form
```

### Code Quality Checks
```bash
# Run all checks before committing
npm run lint                # ESLint
npx tsc --noEmit           # Type checking
npm run build --dry-run    # Test build

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 🎨 Styling & Design

### Warm Modern Theme

**Color System** (`src/app/globals.css`):
```css
:root {
  /* Golden Hour Warmth */
  --color-primary: #FF6B35;      /* Sunset Orange */
  --color-secondary: #F7B32B;    /* Golden Yellow */
  --color-accent: #FF8E53;       /* Coral */
  --color-success: #6BCF7F;      /* Fresh Green */

  /* Warm Neutrals */
  --warm-cream: #FFFCF7;         /* Light background */
  --warm-brown-dark: #4A3426;    /* Text primary */
  --warm-brown-medium: #6B4F3D;  /* Text secondary */
}
```

### Component Patterns

**WarmCard** - Main container component:
```tsx
<WarmCard hover={true} padding="xl">
  <h2 className="text-[#FF6B35]">Your Content</h2>
</WarmCard>
```

**ModernButton** - Button component:
```tsx
<ModernButton variant="primary" size="lg">
  Click Me
</ModernButton>
```

**Heading** - Typography:
```tsx
<Heading level={2} className="gradient-text-warm">
  Your Heading
</Heading>
```

### Responsive Design
```css
/* Mobile-first approach */
.component {
  @apply flex flex-col gap-4;      /* Mobile */
}

@media (min-width: 768px) {
  .component {
    @apply flex-row gap-8;          /* Tablet+ */
  }
}
```

**Breakpoints:**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

---

## 🧪 Testing & Debugging

### Performance Optimization

**Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src="/images/hero.jpg"
  alt="Portfolio hero"
  width={1200}
  height={800}
  priority              // Above-the-fold images
  placeholder="blur"
/>
```

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false  // Client-side only
  }
);
```

**Bundle Analysis:**
```bash
npm run build
npx @next/bundle-analyzer
```

### Debugging Tools

**Logging Strategy:**
```typescript
const isDev = process.env.NODE_ENV === 'development';

const log = {
  info: (message: string, data?: any) => {
    if (isDev) console.log(`ℹ️ ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`❌ ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    if (isDev) console.warn(`⚠️ ${message}`, data);
  }
};
```

**Browser DevTools:**
- React Developer Tools
- Performance tab for optimization
- Network tab for API debugging
- Lighthouse for performance audits

---

## 🐛 Troubleshooting

### Development Issues

**Server Won't Start:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Check Node.js version (requires 18+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -ti:3000 | xargs kill -9
```

**Module Resolution Errors:**
```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep -A 10 "paths"

# Restart TypeScript server (VS Code)
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Clear TypeScript cache
rm -rf .next/cache
```

**Hot Reload Not Working:**
```bash
# Clear browser cache (Chrome: Cmd/Ctrl + Shift + R)

# Check file watchers limit (Linux/macOS)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Restart dev server
npm run dev
```

### Build Problems

**TypeScript Build Errors:**
```bash
# Run type checking separately
npx tsc --noEmit

# Check for missing type definitions
npm install --save-dev @types/node @types/react @types/react-dom
```

**Bundle Size Too Large:**
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer

# Check for duplicates
npx duplicate-package-checker-webpack-plugin

# Remove unused dependencies
npx depcheck
```

### Styling Issues

**Tailwind Styles Not Applied:**
```bash
# Verify Tailwind config
npx tailwindcss --init --dry-run

# Check content paths in tailwind.config.ts
# Rebuild CSS
rm -rf .next
npm run dev
```

**Custom CSS Variables Not Working:**
```css
/* globals.css - Ensure variables are defined */
:root {
  --color-primary: #FF6B35;
  --color-secondary: #F7B32B;
}

/* Usage */
.button {
  background-color: var(--color-primary);
}
```

### Common Error Messages

**"Module not found":**
```bash
# Check path aliases in tsconfig.json
# Restart TypeScript server
# Verify file exists
```

**"Hydration mismatch":**
```bash
# Ensure server and client render same content
# Check for browser-only APIs in server components
# Use useEffect for client-only code
```

### Getting Help

**Debug Information to Collect:**
```bash
# System info
node --version
npm --version
next --version

# Package info
npm list next react react-dom

# Build output
npm run build 2>&1 | tee build.log
```

**Useful Debugging Commands:**
```bash
# Clear all caches
rm -rf .next node_modules package-lock.json
npm install

# Verbose build
npm run build --verbose

# Check dependency tree
npm list --depth=0

# Security audit
npm audit

# Check for outdated packages
npm outdated
```

---

## 📝 Environment Configuration

### Local Development
Create `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### Production (Netlify)
Set in Netlify Dashboard → Site Settings → Environment Variables:
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Verification
After setting environment variables:
1. Redeploy site (Netlify auto-redeploys on changes)
2. Test functionality
3. Check console for errors
4. Verify all features work

---

## 📚 Additional Resources

### Documentation
- **[README.md](./README.md)** - Project overview
- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive architecture
- **[COMPONENTS.md](./COMPONENTS.md)** - Component library
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

### External Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

*Last Updated: January 2025 - Warm Modern Theme*
