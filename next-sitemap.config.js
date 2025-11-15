/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://isaacavazquez.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/api/*',
    '/_next/*',
    '/404',
    '/newsletter',
    '/testimonials',
    '/fantasy-football/*',
    '/draft-tiers',
    '/admin/*',
    '/notes',
    '/faq'
  ],
  
  // Additional paths configuration
  additionalPaths: async (config) => {
    const result = []

    // High priority homepage - Product Manager portfolio
    result.push({
      loc: '/',
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date().toISOString(),
    })

    // Core Portfolio Pages - High Priority for PM job search
    result.push({
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })

    result.push({
      loc: '/projects',
      changefreq: 'monthly',
      priority: 0.95,
      lastmod: new Date().toISOString(),
    })

    result.push({
      loc: '/resume',
      changefreq: 'monthly',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })

    result.push({
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    })

    // Consulting/Services page if exists
    result.push({
      loc: '/consulting',
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    })

    // Writing/Blog landing page
    result.push({
      loc: '/writing',
      changefreq: 'weekly',
      priority: 0.85,
      lastmod: new Date().toISOString(),
    })

    result.push({
      loc: '/blog',
      changefreq: 'weekly',
      priority: 0.85,
      lastmod: new Date().toISOString(),
    })

    // Dynamic blog/writing posts - Product Management focused
    try {
      const path = await import('path')
      const fs = await import('fs')

      // Check for writing posts
      const writingDirectory = path.default.join(process.cwd(), 'content/writing')

      if (fs.default.existsSync(writingDirectory)) {
        const files = fs.default.readdirSync(writingDirectory)
        const writingFiles = files.filter(file => file.endsWith('.mdx') || file.endsWith('.md'))

        // Add writing posts with product management focus
        writingFiles.forEach(file => {
          const slug = file.replace(/\.(mdx|md)$/, '')

          // Higher priority for product management, MBA, and technical leadership content
          let priority = 0.7
          if (slug.includes('product') || slug.includes('mba') || slug.includes('berkeley')) {
            priority = 0.85
          } else if (slug.includes('qa') || slug.includes('testing') || slug.includes('quality')) {
            priority = 0.75
          }

          result.push({
            loc: `/writing/${slug}`,
            changefreq: 'monthly',
            priority,
            lastmod: new Date().toISOString(),
          })
        })
      }

      // Check for blog posts
      const blogDirectory = path.default.join(process.cwd(), 'content/blog')

      if (fs.default.existsSync(blogDirectory)) {
        const files = fs.default.readdirSync(blogDirectory)
        const blogFiles = files.filter(file => file.endsWith('.mdx') || file.endsWith('.md'))

        blogFiles.forEach(file => {
          const slug = file.replace(/\.(mdx|md)$/, '')

          // Higher priority for product management content
          let priority = 0.7
          if (slug.includes('product') || slug.includes('mba') || slug.includes('berkeley')) {
            priority = 0.85
          } else if (slug.includes('qa') || slug.includes('testing')) {
            priority = 0.75
          }

          result.push({
            loc: `/blog/${slug}`,
            changefreq: 'monthly',
            priority,
            lastmod: new Date().toISOString(),
          })
        })
      }
    } catch (error) {
      console.warn('Could not load blog/writing posts for sitemap:', error.message)
    }

    return result
  },
}