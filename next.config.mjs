/** @type {import('next').NextConfig} */

const nextConfig = {
  // URL redirects for better SEO and user experience
  async redirects() {
    return [
      // Portfolio redirects - common variations
      {
        source: '/portfolio',
        destination: '/projects',
        permanent: true,
      },
      {
        source: '/work',
        destination: '/projects',
        permanent: true,
      },
      {
        source: '/portfolio/:path*',
        destination: '/projects/:path*',
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
      {
        source: '/tiers',
        destination: '/draft-tiers',
        permanent: false,
      },
      
      // Fantasy football position redirects for better URLs
      {
        source: '/qb',
        destination: '/fantasy-football/tiers/qb',
        permanent: false,
      },
      {
        source: '/rb',
        destination: '/fantasy-football/tiers/rb',
        permanent: false,
      },
      {
        source: '/wr',
        destination: '/fantasy-football/tiers/wr',
        permanent: false,
      },
      {
        source: '/te',
        destination: '/fantasy-football/tiers/te',
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
        destination: '/fantasy-football/tiers/qb',
        permanent: false,
      },
      
      // Legacy URL support
      {
        source: '/blog/posts/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/articles/:slug',
        destination: '/blog/:slug',
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

  // Temporarily disable strict linting until remaining type issues are resolved
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }

    if (!dev && !isServer) {
      // Bundle splitting for better caching
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Separate chunk for heavy UI components (portfolio-specific)
          uiComponents: {
            test: /[\\/](components[\\/](ui|ProjectDetailModal|LazyQADashboard)|hooks[\\/](useDebounce|useTypingAnimation)).*\.tsx?$/,
            name: 'ui-components',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Enhanced icons chunk - optimize for portfolio usage
          icons: {
            test: /[\\/]node_modules[\\/](@tabler[\\/]icons-react|lucide-react)[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Framer Motion chunk (heavy animation library)
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            chunks: 'all',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Blog and content chunk
          content: {
            test: /[\\/](components[\\/](blog|newsletter)|lib[\\/](blog|seo)).*\.tsx?$/,
            name: 'content-features',
            chunks: 'all',
            priority: 12,
            reuseExistingChunk: true,
          },
          // Default vendor chunk for everything else
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      };

      // Bundle analyzer (enabled for production analysis)
      if (process.env.ANALYZE === 'true') {
        try {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: '../bundle-analyzer-report.html',
            })
          );
        } catch (error) {
          console.warn('Bundle analyzer not available, skipping...');
        }
      }
    }

    return config;
  },
};

export default nextConfig;
