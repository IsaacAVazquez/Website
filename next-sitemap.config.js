/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://isaacavazquez.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/_next/*', '/404'],
  
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