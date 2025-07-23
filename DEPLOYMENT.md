# Deployment Guide

This guide covers deployment strategies, configuration, and best practices for the Isaac Vazquez Portfolio project.

## 📋 Table of Contents

- [Netlify Deployment](#netlify-deployment)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Custom Domain Setup](#custom-domain-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## 🚀 Netlify Deployment

### Current Configuration

The site is deployed on Netlify with automatic builds from the main branch.

**Live URLs:**
- **Production:** [isaacavazquez.com](https://isaacavazquez.com)
- **Deploy Previews:** Auto-generated for pull requests
- **Branch Deploys:** Available for feature branches

### Netlify Configuration File

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "npm run dev"
  port = 3000
  publish = ".next"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "public, max-age=0, s-maxage=86400"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### Manual Deployment Steps

1. **Connect Repository**
   ```bash
   # If setting up a new site
   netlify init
   netlify link
   ```

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18.x

3. **Deploy**
   ```bash
   # Manual deploy
   netlify deploy
   
   # Production deploy
   netlify deploy --prod
   ```

## ⚙️ Build Configuration

### Next.js Configuration

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for better Netlify compatibility
  output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true, // Required for static export
    domains: ['isaacavazquez.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Generate sitemap after build
  async afterBuild() {
    await import('./scripts/generate-sitemap.mjs');
  },
  
  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || 'https://isaacavazquez.com',
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(new (require('@next/bundle-analyzer'))());
    }
    
    return config;
  },
};

export default nextConfig;
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "next-sitemap",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true npm run build",
    "build:debug": "next build --debug",
    "export": "next export"
  }
}
```

### Sitemap Generation

```javascript
// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://isaacavazquez.com',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    additionalSitemaps: [
      'https://isaacavazquez.com/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom priority based on page importance
    const priorityMap = {
      '/': 1.0,
      '/about': 0.9,
      '/projects': 0.8,
      '/fantasy-football': 0.7,
      '/resume': 0.6,
      '/contact': 0.5,
    };
    
    return {
      loc: path,
      changefreq: path === '/' ? 'weekly' : 'monthly',
      priority: priorityMap[path] || 0.4,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
```

## 🔐 Environment Variables

### Production Environment

```bash
# Required for production
SITE_URL=https://isaacavazquez.com
NEXTAUTH_URL=https://isaacavazquez.com

# Optional: FantasyPros integration
FANTASYPROS_API_KEY=your_api_key_here

# Analytics (if using)
GOOGLE_ANALYTICS_ID=GA_TRACKING_ID
VERCEL_ANALYTICS_ID=your_vercel_id
```

### Netlify Environment Setup

1. **Via Netlify UI:**
   - Go to Site Settings → Environment Variables
   - Add each variable with appropriate scoping

2. **Via Netlify CLI:**
   ```bash
   netlify env:set SITE_URL "https://isaacavazquez.com"
   netlify env:set NEXTAUTH_URL "https://isaacavazquez.com"
   ```

3. **Via netlify.toml:**
   ```toml
   [context.production.environment]
     SITE_URL = "https://isaacavazquez.com"
     NODE_ENV = "production"
   
   [context.deploy-preview.environment]
     SITE_URL = "https://deploy-preview-$DEPLOY_ID--isaacvazquez.netlify.app"
   ```

### Environment Variable Types

```typescript
// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      SITE_URL: string;
      NEXTAUTH_URL: string;
      FANTASYPROS_API_KEY?: string;
      GOOGLE_ANALYTICS_ID?: string;
    }
  }
}

export {};
```

## ⚡ Performance Optimization

### Build Optimization

**Bundle Analysis:**
```bash
# Analyze bundle size
npm run analyze

# Check build output
npm run build:debug
```

**Webpack Optimizations:**
```javascript
// next.config.mjs
const nextConfig = {
  webpack: (config) => {
    // Tree shaking optimization
    config.optimization.usedExports = true;
    
    // Chunk splitting for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    };
    
    return config;
  },
};
```

### Image Optimization

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="relative overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Rj5nqnvTzTv8AB2ZhWhJ6WVxGYGt2s8mz3pz3v/eGON6OwdkPo9nnfQkVh4JA3QwOPt1zLGf5/9k="
        onLoad={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
    </div>
  );
};
```

### Caching Strategy

```javascript
// HTTP headers for optimal caching
const cacheHeaders = {
  // Static assets (1 year)
  'static/*': 'public, max-age=31536000, immutable',
  
  // Images (1 year with revalidation)
  'images/*': 'public, max-age=31536000, must-revalidate',
  
  // HTML pages (1 hour with stale-while-revalidate)
  'pages/*': 'public, max-age=3600, stale-while-revalidate=86400',
  
  // API routes (no cache, but allow CDN caching)
  'api/*': 'public, max-age=0, s-maxage=86400',
};
```

## 📊 Monitoring and Analytics

### Performance Monitoring

**Lighthouse CI Integration:**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  pull_request:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.9.x
          lhci autorun
```

**Core Web Vitals Tracking:**
```typescript
// lib/analytics.ts
export function trackWebVitals(metric: any) {
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }
  
  // Custom analytics
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  });
}
```

### Error Tracking

```typescript
// lib/error-tracking.ts
export function setupErrorTracking() {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Send to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.error?.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    });
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}
```

## 🌐 Custom Domain Setup

### DNS Configuration

**DNS Records for isaacavazquez.com:**
```
Type    Name    Value                           TTL
A       @       104.198.14.52                   300
CNAME   www     isaacvazquez.netlify.app        300
```

### SSL Certificate

Netlify automatically provisions and renews SSL certificates for custom domains:

1. **Add Custom Domain:**
   ```bash
   netlify domains:add isaacavazquez.com
   ```

2. **Verify DNS Configuration:**
   ```bash
   netlify domains:list
   ```

3. **Force HTTPS:**
   - Enabled automatically for custom domains
   - HTTP requests redirect to HTTPS

### Domain Verification

```bash
# Check domain propagation
dig isaacavazquez.com
nslookup isaacavazquez.com

# Test SSL certificate
curl -I https://isaacavazquez.com
```

## 🔄 CI/CD Pipeline

### Automated Deployment Workflow

**Netlify Build Process:**
1. Code pushed to GitHub
2. Netlify webhook triggered
3. Build environment provisioned
4. Dependencies installed (`npm ci`)
5. Build executed (`npm run build`)
6. Tests run (if configured)
7. Build artifacts deployed
8. CDN cache invalidated
9. Deploy notifications sent

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npx tsc --noEmit
      
      - name: Build project
        run: npm run build
        env:
          SITE_URL: ${{ secrets.SITE_URL }}
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: '.next'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Deploy Previews

**Automatic Preview Deployment:**
- Every pull request gets a unique preview URL
- Preview deploys don't affect production
- Environment variables scoped to context

**Preview URL Format:**
```
https://deploy-preview-{PR-NUMBER}--isaacvazquez.netlify.app
```

## 🛠️ Troubleshooting

### Common Deployment Issues

**1. Build Failures**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check build logs
netlify logs

# Local build test
npm run build && npm run start
```

**2. Environment Variable Issues**
```bash
# List current environment variables
netlify env:list

# Test with environment variables
netlify dev
```

**3. DNS Propagation Issues**
```bash
# Check DNS propagation
dig +trace isaacavazquez.com
nslookup isaacavazquez.com 8.8.8.8

# Clear DNS cache (macOS)
sudo dscacheutil -flushcache
```

**4. SSL Certificate Issues**
```bash
# Check SSL certificate details
openssl s_client -connect isaacavazquez.com:443 -servername isaacavazquez.com

# Test SSL configuration
curl -vI https://isaacavazquez.com
```

### Performance Issues

**Bundle Size Problems:**
```bash
# Analyze bundle size
npm run analyze

# Check for duplicate dependencies
npx depcheck
npx duplicate-package-checker-webpack-plugin
```

**Slow Build Times:**
```bash
# Enable build debugging
npm run build:debug

# Check dependency tree
npm ls --depth=0
```

### Monitoring Commands

```bash
# Check site status
curl -I https://isaacavazquez.com

# Performance audit
npm install -g lighthouse
lighthouse https://isaacavazquez.com --output=json --output-path=./lighthouse-report.json

# Security headers check
curl -I https://isaacavazquez.com | grep -E "X-|Strict|Content-Security"
```

## 📚 Additional Resources

### Netlify Documentation
- [Netlify Build Configuration](https://docs.netlify.com/configure-builds/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)

### Next.js Deployment
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Static Export Configuration](https://nextjs.org/docs/advanced-features/static-html-export)

### Performance Tools
- [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

*This deployment guide is regularly updated to reflect current best practices and infrastructure changes.*