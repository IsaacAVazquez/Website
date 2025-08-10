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
    
    // Fantasy Football Landing Page (Main attraction)
    result.push({
      loc: '/projects',
      changefreq: 'daily',
      priority: 0.95,
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
      priority: 0.85,
      lastmod: new Date().toISOString(),
    })
    
    // Position-specific tier pages (Fantasy football content)
    const positions = ['overall', 'qb', 'rb', 'wr', 'te', 'flex', 'k', 'dst']
    positions.forEach(position => {
      result.push({
        loc: `/fantasy-football/tiers/${position}`,
        changefreq: 'daily',
        priority: position === 'overall' ? 0.8 : 0.7,
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
        
        // Add blog posts to sitemap
        blogFiles.forEach(file => {
          const slug = file.replace(/\.(mdx|md)$/, '')
          
          result.push({
            loc: `/blog/${slug}`,
            changefreq: 'weekly',
            priority: 0.7,
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