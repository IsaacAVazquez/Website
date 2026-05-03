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
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
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
  // TODO: Add a global Content-Security-Policy header in a future, separately
  // staged change. CSP requires careful inventory of inline scripts, third-party
  // tag managers, and analytics endpoints; rolling it out without staging would
  // break those surfaces. Tracked separately.
  async headers() {
    const securityHeaders = [
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
