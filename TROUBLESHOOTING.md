# Troubleshooting Guide

This guide helps resolve common issues encountered when developing, building, or deploying the Isaac Vazquez Portfolio.

## 📋 Table of Contents

- [Development Issues](#development-issues)
- [Build Problems](#build-problems)
- [Deployment Issues](#deployment-issues)
- [Performance Problems](#performance-problems)
- [Styling Issues](#styling-issues)
- [Browser Compatibility](#browser-compatibility)
- [Getting Help](#getting-help)

## 🛠️ Development Issues

### Server Won't Start

**Problem:** `npm run dev` fails or server doesn't start

**Solutions:**
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
lsof -ti:3000
kill -9 <PID>
```

### Module Resolution Errors

**Problem:** TypeScript can't find modules or path aliases

**Solutions:**
```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep -A 10 "paths"

# Restart TypeScript server (VS Code)
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Clear TypeScript cache
rm -rf .next/cache
```

**Check Configuration:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### Environment Variables Not Loading

**Problem:** Environment variables are undefined in development

**Solutions:**
```bash
# Create .env.local for development
cat > .env.local << EOF
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
EOF

# Restart development server
npm run dev
```

### Hot Reload Not Working

**Problem:** Changes don't reflect in browser automatically

**Solutions:**
```bash
# Clear browser cache and hard refresh
# Chrome: Cmd/Ctrl + Shift + R

# Check file watchers limit (Linux/macOS)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Restart development server
npm run dev
```

## 🔨 Build Problems

### Build Fails with TypeScript Errors

**Problem:** `npm run build` fails with type errors

**Solutions:**
```bash
# Run type checking separately
npx tsc --noEmit

# Check for missing type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# Skip type checking temporarily (not recommended for production)
# next.config.mjs
export default {
  typescript: {
    ignoreBuildErrors: true
  }
}
```

### Bundle Size Too Large

**Problem:** Build output shows large bundle sizes

**Solutions:**
```bash
# Analyze bundle composition
npm run build
npx @next/bundle-analyzer

# Check for duplicate dependencies
npx duplicate-package-checker-webpack-plugin

# Remove unused dependencies
npx depcheck
```

**Optimization Tips:**
```typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { ssr: false }
);

// Tree shake unused code
// Import only what you need
import { specificFunction } from 'library';
// Instead of: import * as library from 'library';
```

### Image Optimization Errors

**Problem:** Next.js Image component fails to optimize images

**Solutions:**
```javascript
// next.config.mjs - Add domains for external images
export default {
  images: {
    domains: ['isaacavazquez.com', 'example.com'],
    formats: ['image/webp', 'image/avif'],
  }
}
```

```bash
# Check image file permissions
ls -la public/images/

# Verify image formats are supported
file public/images/example.jpg
```

## 🚀 Deployment Issues

### Netlify Build Failures

**Problem:** Deployment fails during build process

**Common Solutions:**
```bash
# Check Node.js version in netlify.toml
[build.environment]
NODE_VERSION = "18"

# Clear Netlify cache
# Netlify UI → Site Settings → Build & deploy → Post processing → Clear cache

# Check build logs for specific errors
netlify logs
```

**Environment Variables:**
```bash
# Set via Netlify CLI
netlify env:set NEXT_PUBLIC_SITE_URL "https://isaacavazquez.com"

# Or via Netlify UI
# Site Settings → Environment variables
```

### Domain/SSL Issues

**Problem:** Custom domain not working or SSL certificate issues

**Solutions:**
```bash
# Check DNS propagation
dig isaacavazquez.com
nslookup isaacavazquez.com

# Verify DNS records
Type    Name    Value
A       @       104.198.14.52
CNAME   www     isaacvazquez.netlify.app

# Clear local DNS cache
# macOS:
sudo dscacheutil -flushcache
# Windows:
ipconfig /flushdns
```

### Redirect Issues

**Problem:** Page redirects not working correctly

**Check Configuration:**
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Verify redirect rules
netlify deploy --dry-run
```

## ⚡ Performance Problems

### Slow Page Load Times

**Problem:** Portfolio loads slowly

**Diagnostic Steps:**
```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://isaacavazquez.com --output=html --output-path=./audit.html

# Check Core Web Vitals
# Use Google PageSpeed Insights or Chrome DevTools
```

**Solutions:**
```typescript
// Optimize images with proper sizing
<Image
  src="/images/hero.webp"
  alt="Portfolio hero"
  width={1200}
  height={800}
  priority // For above-the-fold images
  placeholder="blur"
/>

// Lazy load heavy components
const ProjectModal = lazy(() => import('./ProjectModal'));

// Preload critical resources
<link rel="preload" href="/fonts/orbitron.woff2" as="font" type="font/woff2" crossOrigin="" />
```

### Memory Issues

**Problem:** High memory usage during development or build

**Solutions:**
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Monitor memory usage
node --inspect npm run build
# Open chrome://inspect in Chrome
```

### Animation Performance

**Problem:** Animations are janky or cause frame drops

**Solutions:**
```typescript
// Use transform and opacity for smooth animations
<motion.div
  initial={{ opacity: 0, transform: 'translateY(20px)' }}
  animate={{ opacity: 1, transform: 'translateY(0px)' }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Disable animations for users who prefer reduced motion
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={!prefersReducedMotion ? { x: 100 } : {}}
>
  Content
</motion.div>
```

## 🎨 Styling Issues

### Tailwind Styles Not Applied

**Problem:** CSS classes don't work or aren't being applied

**Solutions:**
```bash
# Verify Tailwind is properly configured
npx tailwindcss --init --dry-run

# Check content paths in tailwind.config.ts
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
]

# Rebuild CSS
rm -rf .next
npm run dev
```

### Custom CSS Variables Not Working

**Problem:** CSS custom properties aren't being applied

**Check Implementation:**
```css
/* globals.css - Ensure variables are defined */
:root {
  --electric-blue: #00F5FF;
  --matrix-green: #39FF14;
  --terminal-bg: #0A0A0B;
}

/* Usage in components */
.cyberpunk-button {
  background-color: var(--electric-blue);
  color: var(--terminal-bg);
}
```

### Responsive Design Issues

**Problem:** Layout breaks on mobile devices

**Solutions:**
```typescript
// Use mobile-first responsive design
<div className="
  flex flex-col gap-4    // Mobile: stack vertically
  md:flex-row md:gap-8   // Tablet+: horizontal layout
  lg:gap-12              // Desktop: larger gaps
">
  Content
</div>

// Test responsive breakpoints
// Chrome DevTools → Toggle device toolbar
```

### Glassmorphism Effects Not Showing

**Problem:** Backdrop blur effects aren't visible

**Solutions:**
```css
/* Ensure backdrop-filter support */
.glass-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* Safari */
  background: rgba(10, 10, 11, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Check browser support */
@supports (backdrop-filter: blur(20px)) {
  .glass-card {
    backdrop-filter: blur(20px);
  }
}
```

## 🌐 Browser Compatibility

### Safari-Specific Issues

**Problem:** Features not working in Safari

**Common Fixes:**
```css
/* Add webkit prefixes */
.element {
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  
  -webkit-transform: translateX(100px);
  transform: translateX(100px);
}
```

```typescript
// Polyfills for older browsers
// next.config.mjs
export default {
  compiler: {
    styledComponents: true,
  },
  experimental: {
    polyfills: ['ie11'],
  }
}
```

### Font Loading Issues

**Problem:** Custom fonts not loading properly

**Solutions:**
```typescript
// Ensure fonts are properly configured
import { Inter, Orbitron, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Add fallbacks
.font-orbitron {
  font-family: var(--font-orbitron), 'Courier New', monospace;
}
```

### JavaScript Errors in Production

**Problem:** Code works in development but fails in production

**Solutions:**
```bash
# Test production build locally
npm run build
npm run start

# Check for hydration issues
# Look for "Hydration mismatch" errors in console

# Enable source maps for debugging
# next.config.mjs
export default {
  productionBrowserSourceMaps: true
}
```

## 🔧 Common Error Messages

### "Module not found" Errors

```bash
Error: Module not found: Can't resolve '@/components/...'

# Solution: Check path aliases in tsconfig.json
# Restart TypeScript server
# Verify file exists at the specified path
```

### "Hydration Mismatch" Errors

```bash
Error: Hydration failed because the initial UI does not match what was rendered on the server

# Solution: Ensure server and client render the same content
# Check for browser-only APIs in server components
# Use useEffect for client-only code
```

### "Cannot read property" Errors

```bash
TypeError: Cannot read property 'map' of undefined

# Solution: Add safety checks
const items = data?.items || [];
return items.map(item => <Item key={item.id} {...item} />);
```

## 📞 Getting Help

### Debug Information to Collect

When reporting issues, include:

```bash
# System information
node --version
npm --version
next --version

# Package information
npm list next react react-dom

# Build output
npm run build 2>&1 | tee build.log

# Browser console errors
# Screenshots of the issue
# Steps to reproduce
```

### Useful Commands for Debugging

```bash
# Clear all caches
rm -rf .next node_modules package-lock.json
npm install

# Verbose build output
npm run build --verbose

# Check dependency tree
npm list --depth=0

# Security audit
npm audit

# Check for outdated packages
npm outdated
```

### Resources

- **Next.js Documentation:** [nextjs.org/docs](https://nextjs.org/docs)
- **React Documentation:** [react.dev](https://react.dev)
- **Tailwind CSS Docs:** [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Framer Motion Docs:** [framer.com/motion](https://www.framer.com/motion/)

### Project-Specific Help

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development environment setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment configuration
- **[PERFORMANCE.md](./PERFORMANCE.md)** - Performance optimization guide
- **[COMPONENTS.md](./COMPONENTS.md)** - Component documentation

---

*If you encounter an issue not covered in this guide, please check the project's GitHub issues or create a new one with detailed information about the problem.*