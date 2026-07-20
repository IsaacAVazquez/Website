import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const nextConfig = {
  poweredByHeader: false,
  // URL redirects for better SEO and user experience
  async redirects() {
    return [
      // Portfolio redirects - redirect old /projects to new /portfolio
      {
        source: '/projects',
        destination: '/portfolio',
        permanent: true,
      },
      {
        source: '/work',
        destination: '/portfolio',
        permanent: true,
      },
      {
        source: '/projects/:path*',
        destination: '/portfolio/:path*',
        permanent: true,
      },
      // Redirect external-link portfolio slugs to their real destinations
      {
        source: '/portfolio/investment-analytics-platform',
        destination: '/investments',
        permanent: true,
      },

      // Legacy professional case studies moved to /writing
      {
        source: '/portfolio/textout-platform',
        destination: '/writing/textout-platform',
        permanent: true,
      },
      {
        source: '/portfolio/runningmate-platform',
        destination: '/writing/runningmate-platform-launch',
        permanent: true,
      },
      {
        source: '/portfolio/civic-engagement-platform-scale',
        destination: '/writing/scaling-civic-engagement-platform',
        permanent: true,
      },
      {
        source: '/portfolio/campaign-analytics-dashboard',
        destination: '/writing/campaign-self-service-analytics',
        permanent: true,
      },
      {
        source: '/portfolio/qa-automation-framework',
        destination: '/writing/qa-automation-daily-deploys',
        permanent: true,
      },
      {
        // Pulse Dashboards was a meta write-up of the Pulse family, not a
        // standalone tool — it lives as a /writing article; the nine dashboards
        // are each their own portfolio project.
        source: '/portfolio/pulse-dashboards',
        destination: '/writing/building-the-pulse-dashboard-family',
        permanent: true,
      },
      {
        source: '/portfolio/performance-intelligence',
        destination: '/writing/proactive-performance-intelligence',
        permanent: true,
      },
      {
        source: '/portfolio/pricing-strategy-initiative',
        destination: '/writing/pricing-strategy-initiative',
        permanent: true,
      },
      {
        source: '/portfolio/digital-acquisition-strategy',
        destination: '/writing/digital-acquisition-strategy',
        permanent: true,
      },

      // Fantasy football aliases for easier sharing
      {
        source: '/ff',
        destination: '/fantasy-football',
        permanent: false,
      },
      {
        source: '/rankings',
        destination: '/fantasy-football',
        permanent: false,
      },

      // Fantasy football position redirects for better URLs
      {
        source: '/qb',
        destination: '/fantasy-football?position=qb&scoring=ppr',
        permanent: false,
      },
      {
        source: '/rb',
        destination: '/fantasy-football?position=rb&scoring=ppr',
        permanent: false,
      },
      {
        source: '/wr',
        destination: '/fantasy-football?position=wr&scoring=ppr',
        permanent: false,
      },
      {
        source: '/te',
        destination: '/fantasy-football?position=te&scoring=ppr',
        permanent: false,
      },
      
      // Common misspellings
      {
        source: '/fantsy-football/:path*',
        destination: '/fantasy-football/:path*',
        permanent: false,
      },
      {
        source: '/fantasy-footbal/:path*',
        destination: '/fantasy-football/:path*',
        permanent: false,
      },
      {
        source: '/quatrerback',
        destination: '/fantasy-football?position=qb&scoring=ppr',
        permanent: false,
      },
      
      // Blog → Writing redirects
      {
        source: '/blog',
        destination: '/writing',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/writing/:slug',
        permanent: true,
      },
      // Legacy URL support
      {
        source: '/blog/posts/:slug',
        destination: '/writing/:slug',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/writing/:slug',
        permanent: true,
      },

      // Release history has one canonical home.
      {
        source: '/release-notes',
        destination: '/changelog',
        permanent: true,
      },
      
      // Contact page variations
      {
        source: '/get-in-touch',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/hire-me',
        destination: '/contact',
        permanent: true,
      },
      
      // Resume variations
      {
        source: '/cv',
        destination: '/resume',
        permanent: true,
      },
      {
        source: '/resume.pdf',
        destination: '/Isaac_Vazquez_Resume.pdf',
        permanent: true,
      },

      // RSS feed aliases for easier subscription
      {
        source: '/rss',
        destination: '/api/rss',
        permanent: false,
      },
      {
        source: '/feed',
        destination: '/api/rss',
        permanent: false,
      },
      {
        source: '/feed.xml',
        destination: '/api/rss',
        permanent: false,
      },
      {
        source: '/rss.xml',
        destination: '/api/rss',
        permanent: false,
      },
    ];
  },

  outputFileTracingRoot: __dirname,
  // Prevent native modules from being bundled into server functions.
  serverExternalPackages: ['better-sqlite3', 'sharp'],
  // Exclude sharp and its platform-specific binaries from the NFT bundle.
  // sharp is an optional dep of Next.js for image optimization, but Netlify's
  // image CDN handles /_next/image so sharp is never needed at runtime.
  // Without this, @img/sharp-libvips-linux-x64 (~150-200 MB) pushes the
  // function bundle over Netlify's 250 MB limit.
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/@img/**',
      '**/node_modules/sharp/**',
      '**/public/data/investments/**',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // dangerouslyAllowSVG is required because some content (e.g. team crests,
    // logos in snapshot data) is delivered as inline SVG. The image-scoped CSP
    // below (script-src 'none'; sandbox) prevents script execution from those
    // SVGs, mitigating the main risk. Removing this flag would break sports
    // and finance dashboards that depend on remote SVG assets.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Site-wide security headers. Applied to all routes.
  //
  // CSP is staged via Content-Security-Policy-Report-Only (below). Report-Only
  // enforces nothing — the browser still loads every resource and only reports
  // what a future enforcing policy *would* block. This is the standard, safe
  // way to inventory inline scripts, third-party tags, and analytics endpoints
  // before flipping to an enforcing `Content-Security-Policy` header.
  //
  // The directives reflect this site's actual runtime surface:
  //   - fonts are self-hosted by next/font (no runtime fonts.gstatic.com)
  //   - all external data APIs run at build time, so browser connect is 'self'
  //   - next-themes + Next bootstrap + JSON-LD need inline <script>
  //   - Framer Motion + style attributes need inline styles
  //   - Food Map loads pinned Leaflet assets from unpkg.com
  //   - team crests/logos load from many remote CDNs via <img> (img-src https:)
  //
  // Once reports confirm no legitimate surface is flagged (and inline scripts
  // are moved to nonces/hashes to drop 'unsafe-inline'), graduate this to an
  // enforcing `Content-Security-Policy` header.
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "manifest-src 'self'",
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy-Report-Only",
        value: contentSecurityPolicy,
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@tabler/icons-react', 'lucide-react', 'framer-motion'],
    scrollRestoration: true,
  },
  // Enhanced webpack configuration for performance
  webpack: (config, { dev, isServer }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }

    if (!dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-analyzer-report.html',
        })
      );
    }

    return config;
  },
};

export default nextConfig;
