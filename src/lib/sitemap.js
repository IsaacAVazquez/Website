/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const STATIC_ROUTE_LASTMOD = {
  "/": "2026-04-13",
  "/about": "2026-04-13",
  "/accessibility": "2025-02-05",
  "/ai-dev-tools": "2026-04-28",
  "/contact": "2026-03-16",
  "/resume": "2026-04-13",
  "/portfolio": "2026-04-04",
  "/writing": "2026-04-13",
  "/golf": "2026-04-16",
  "/github-trending-pulse": readGitHubTrendingLastmod(),
  "/investments": readInvestmentsLastmod(),
  "/news-pulse": "2026-04-01",
  "/spacex-mission-control": "2026-04-01",
  "/polling-aggregator": readPollingLastmod(),
  "/premier-league": readPremierLeagueLastmod(),
  "/la-liga": readLaLigaLastmod(),
  "/nfl": readNflLastmod(),
  "/march-madness-2026": "2026-03-17",
  "/fantasy-football": readFantasyLastmod(),
  "/fantasy-football/draft-tracker": readFantasyLastmod(),
  "/fantasy-football/rb-tiers": readFantasyLastmod(),
  "/fantasy-football/tiers/qb": readFantasyLastmod(),
  "/fantasy-football/tiers/rb": readFantasyLastmod(),
  "/fantasy-football/tiers/wr": readFantasyLastmod(),
  "/fantasy-football/tiers/te": readFantasyLastmod(),
  "/fantasy-football/tiers/k": readFantasyLastmod(),
  "/fantasy-football/tiers/dst": readFantasyLastmod(),
  "/fantasy-football/tiers/flex": readFantasyLastmod(),
  "/fintech-tools/budget-planner": "2026-04-03",
  "/fintech-tools/interchange-iq": "2026-04-02",
  "/food-map": "2026-04-28",
  "/portfolio/investment-analytics-platform": "2026-04-04",
  "/portfolio/interchange-iq": "2026-04-04",
  "/portfolio/news-pulse-dashboard": "2026-04-04",
  "/portfolio/budget-planner": "2026-04-04",
  "/portfolio/spacex-mission-control": "2026-04-04",
  "/portfolio/premier-league-pulse": "2026-04-04",
  "/portfolio/fantasy-football-analytics": "2026-04-04",
  "/portfolio/la-liga-pulse": "2026-04-04",
  "/portfolio/march-madness-2026": "2026-04-04",
  "/portfolio/food-map": "2026-04-28",
  "/portfolio/ai-dev-tool-ecosystem": "2026-04-28",
  "/portfolio/github-trending-pulse": readGitHubTrendingLastmod(),
};

function readFile(filePath) {
  return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

function toIsoString(value) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = value.length === 10 ? `${value}T00:00:00.000Z` : value;
  return new Date(normalizedValue).toISOString();
}

function readFirstMatch(filePath, pattern) {
  const source = readFile(filePath);
  const match = source.match(pattern);
  return match ? match[1] : undefined;
}

function readInvestmentsLastmod() {
  const source = JSON.parse(readFile("public/data/investments/index.json"));
  return toIsoString(source.lastUpdated);
}

function readPollingLastmod() {
  return toIsoString(
    readFirstMatch("src/data/pollingSnapshot.ts", /generatedAt:\s*"([^"]+)"/)
  );
}

function readPremierLeagueLastmod() {
  return toIsoString(
    readFirstMatch("src/data/premierLeagueSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function readLaLigaLastmod() {
  return toIsoString(
    readFirstMatch("src/data/laLigaSnapshot.ts", /"updatedAt":\s*"([^"]+)"/)
  );
}

function readNflLastmod() {
  return toIsoString(
    readFirstMatch("src/data/nflSnapshot.ts", /"updatedAt":\s*"([^"]+)"/)
  );
}

function readFantasyLastmod() {
  const source = JSON.parse(readFile("public/data/fantasy/ppr.json"));
  return toIsoString(source.generatedAt);
}

function readGitHubTrendingLastmod() {
  return toIsoString(
    readFirstMatch("src/data/githubTrendingSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function getStaticRouteEntries() {
  return Object.entries(STATIC_ROUTE_LASTMOD).map(([loc, lastmod]) => ({
    loc,
    lastmod: toIsoString(lastmod) || new Date("2026-01-01T00:00:00.000Z").toISOString(),
  }));
}

function getBlogRouteEntries() {
  const contentDirectory = path.join(process.cwd(), "content/blog");

  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.(mdx|md)$/, "");
      const { data } = matter(readFile(path.join("content/blog", file)));
      return {
        loc: `/writing/${slug}`,
        lastmod: toIsoString(data.updatedAt || data.publishedAt),
      };
    })
    .filter((entry) => entry.lastmod);
}

function getPublicSitemapEntries() {
  const allEntries = [...getStaticRouteEntries(), ...getBlogRouteEntries()];
  const dedupedEntries = new Map();

  for (const entry of allEntries) {
    dedupedEntries.set(entry.loc, entry);
  }

  return Array.from(dedupedEntries.values()).sort((a, b) => a.loc.localeCompare(b.loc));
}

const PUBLIC_SITEMAP_ENTRIES = getPublicSitemapEntries();
const PUBLIC_SITEMAP_PATHS = new Set(PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.loc));

module.exports = {
  PUBLIC_SITEMAP_ENTRIES,
  PUBLIC_SITEMAP_PATHS,
  getPublicSitemapEntries,
};
