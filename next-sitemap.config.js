const {
  PUBLIC_SITEMAP_ENTRIES,
  PUBLIC_SITEMAP_PATHS,
} = require("./src/lib/sitemap");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://isaacavazquez.com",
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  sitemapSize: 5000,
  autoLastmod: false,
  exclude: ["/api/*", "/_next/*", "/404", "/admin", "/admin/*", "/search"],
  transform: async (_config, urlPath) => {
    if (!PUBLIC_SITEMAP_PATHS.has(urlPath)) {
      return null;
    }

    const entry = PUBLIC_SITEMAP_ENTRIES.find((candidate) => candidate.loc === urlPath);
    if (!entry) {
      return null;
    }

    return {
      loc: entry.loc,
      lastmod: entry.lastmod,
    };
  },
  additionalPaths: async () => {
    return PUBLIC_SITEMAP_ENTRIES;
  },
};
