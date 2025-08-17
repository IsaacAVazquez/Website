/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://isaacavazquez.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/_next/*', '/404', '/newsletter', '/testimonials'],
  
  // Additional paths configuration  
  additionalPaths: async (config) => {
    const result = []
    
    // High priority homepage
    result.push({
      loc: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString(),
    })
    
    // Blog landing page (High priority for SEO)
    result.push({
      loc: '/blog',
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })
    
    // Projects Landing Page (Portfolio showcase)
    result.push({
      loc: '/projects',
      changefreq: 'weekly',
      priority: 0.85,
      lastmod: new Date().toISOString(),
    })
    
    // Interactive Fantasy Football Tools (High traffic)
    result.push({
      loc: '/fantasy-football',
      changefreq: 'daily', 
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/draft-tiers',
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    })
    
    // Draft tracker tool (Interactive feature)
    result.push({
      loc: '/fantasy-football/draft-tracker',
      changefreq: 'weekly',
      priority: 0.75,
      lastmod: new Date().toISOString(),
    })
    
    // Position-specific tier pages (Fantasy football content)
    const positions = [
      { position: 'overall', priority: 0.8 },
      { position: 'qb', priority: 0.75 },
      { position: 'rb', priority: 0.75 },
      { position: 'wr', priority: 0.75 },
      { position: 'te', priority: 0.7 },
      { position: 'flex', priority: 0.7 },
      { position: 'k', priority: 0.6 },
      { position: 'dst', priority: 0.65 }
    ]
    
    positions.forEach(({ position, priority }) => {
      result.push({
        loc: `/fantasy-football/tiers/${position}`,
        changefreq: 'daily',
        priority,
        lastmod: new Date().toISOString(),
      })
    })
    
    // Dynamic blog posts
    try {
      // Import blog utilities
      const path = await import('path')
      const fs = await import('fs')
      
      const postsDirectory = path.default.join(process.cwd(), 'content/blog')
      
      // Check if blog directory exists
      if (fs.default.existsSync(postsDirectory)) {
        const files = fs.default.readdirSync(postsDirectory)
        const blogFiles = files.filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
        
        // Add blog posts to sitemap with category-based priorities
        blogFiles.forEach(file => {
          const slug = file.replace(/\.(mdx|md)$/, '')
          
          // Higher priority for fantasy football and QA engineering content
          let priority = 0.65
          if (slug.includes('fantasy-football') || slug.includes('analytics')) {
            priority = 0.75
          } else if (slug.includes('qa-engineering') || slug.includes('testing')) {
            priority = 0.7
          }
          
          result.push({
            loc: `/blog/${slug}`,
            changefreq: 'weekly',
            priority,
            lastmod: new Date().toISOString(),
          })
        })
      }
    } catch (error) {
      console.warn('Could not load blog posts for sitemap:', error.message)
    }
    
    // Professional pages (Lower priority but still important)
    result.push({
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.6,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/resume',
      changefreq: 'monthly',
      priority: 0.6,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.5,
      lastmod: new Date().toISOString(),
    })
    
    return result
  },
}