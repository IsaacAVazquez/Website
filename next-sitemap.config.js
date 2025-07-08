/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://isaacvazquez.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/_next/*', '/404'],
  
  // Additional paths configuration
  additionalPaths: async (config) => {
    const result = []
    
    // Add high priority pages
    result.push({
      loc: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/projects',
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/resume',
      changefreq: 'monthly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    })
    
    result.push({
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    })
    
    return result
  },
}