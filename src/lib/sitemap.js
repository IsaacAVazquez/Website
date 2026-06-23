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
  "/earthquake-pulse": readEarthquakeLastmod(),
  "/decision-lab": "2026-04-04",
  "/formula-1": "2026-04-04",
  "/fantasy-formula-1": readFormula1Lastmod(),
  "/frontier-models": "2026-04-04",
  "/mba-internship-notifications": "2026-04-04",
  "/mlb": "2026-04-04",
  "/museum-log": "2026-04-04",
  "/nba": "2026-04-04",
  "/now": "2026-04-13",
  "/recipe-finder": "2026-04-04",
  "/wine-cellar": "2026-04-04",
  "/bay-area-transit": readBayAreaTransitLastmod(),
  "/changelog": "2026-04-13",
  "/github-trending-pulse": readGitHubTrendingLastmod(),
  "/tech-startup-tracker": readTechStartupLastmod(),
  "/investments": readInvestmentsLastmod(),
  "/news-pulse": "2026-04-01",
  "/spacex-mission-control": "2026-04-01",
  "/polling-aggregator": readPollingLastmod(),
  "/premier-league": readPremierLeagueLastmod(),
  "/la-liga": readLaLigaLastmod(),
  "/nfl": readNflLastmod(),
  "/world-cup-2026": readWorldCupLastmod(),
  "/march-madness-2026": "2026-03-17",
  "/fantasy-football": readFantasyLastmod(),
  "/fantasy-football/draft-tracker": readFantasyLastmod(),
  "/fintech-tools/budget-planner": "2026-04-03",
  "/fintech-tools/interchange-iq": "2026-04-02",
  "/food-map": "2026-04-28",
  "/travel": "2026-05-04",
};

// --- Priority + changefreq classification -------------------------------
//
// Three priority tiers, by content type:
//   1.0  primary pages       — the canonical, identity-defining surfaces
//   0.8  section hubs         — pages that aggregate a section's children
//   0.6  components/articles  — individual dashboards/tools, writing posts,
//                               case studies, and leaf utility pages
//
// changefreq reflects how often each surface *realistically* changes, derived
// from its data-refresh cadence (see CLAUDE.md). Live data dashboards refresh
// daily (or hourly), curated/editorial surfaces monthly, identity pages
// monthly-to-yearly.

const PRIMARY_ROUTES = new Set(["/", "/about", "/resume", "/contact"]);

const SECTION_HUB_ROUTES = new Set([
  "/portfolio",
  "/writing",
  "/fantasy-football",
  "/investments",
]);

// Explicit changefreq per static route. Anything not listed here falls back to
// the per-type default in `classifyEntry` (monthly for articles/case studies).
const CHANGEFREQ_BY_ROUTE = {
  "/": "weekly",
  "/about": "monthly",
  "/resume": "monthly",
  "/contact": "yearly",
  "/accessibility": "yearly",
  "/portfolio": "weekly",
  "/writing": "weekly",
  "/now": "monthly",
  "/changelog": "weekly",
  // Fantasy football — weekly FantasyPros + ADP refresh
  "/fantasy-football": "weekly",
  "/fantasy-football/draft-tracker": "weekly",
  // Investments — committed snapshots refresh twice weekly
  "/investments": "weekly",
  // Knowledge / editorial surfaces — hand-maintained, refreshed occasionally
  "/ai-dev-tools": "monthly",
  "/decision-lab": "monthly",
  "/frontier-models": "monthly",
  "/tech-startup-tracker": "monthly",
  // Seasonal
  "/march-madness-2026": "monthly",
  // Live aggregators / daily-refreshed data dashboards
  "/mba-internship-notifications": "daily",
  "/news-pulse": "daily",
  "/spacex-mission-control": "daily",
  "/github-trending-pulse": "daily",
  "/formula-1": "daily",
  "/fantasy-formula-1": "daily",
  "/golf": "daily",
  "/premier-league": "daily",
  "/la-liga": "daily",
  "/nfl": "daily",
  "/nba": "daily",
  "/mlb": "daily",
  "/world-cup-2026": "daily",
  "/polling-aggregator": "weekly",
  // Sub-daily refresh cadence
  "/earthquake-pulse": "hourly",
  "/bay-area-transit": "hourly",
  // Browser-persisted / curated personal-interest + fintech tools
  "/fintech-tools/budget-planner": "monthly",
  "/fintech-tools/interchange-iq": "monthly",
  "/food-map": "monthly",
  "/recipe-finder": "monthly",
  "/wine-cellar": "monthly",
  "/travel": "monthly",
  "/museum-log": "monthly",
};

/**
 * Assign a sitemap `priority` and `changefreq` to a route based on its content
 * type. Pure function of `loc` so it can be applied to every entry uniformly.
 */
function classifyEntry(loc) {
  let priority;
  if (PRIMARY_ROUTES.has(loc)) {
    priority = 1.0;
  } else if (SECTION_HUB_ROUTES.has(loc)) {
    priority = 0.8;
  } else {
    // Individual components, articles, case studies, and leaf utility pages.
    priority = 0.6;
  }

  let changefreq = CHANGEFREQ_BY_ROUTE[loc];
  if (!changefreq) {
    // Writing articles and portfolio case studies: published content that is
    // rarely edited after the fact.
    changefreq = "monthly";
  }

  return { priority, changefreq };
}

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

function readWorldCupLastmod() {
  // The tournament block is first in the file, so the first generatedAt match is
  // the tournament-level timestamp (per-team snapshots also carry one).
  return toIsoString(
    readFirstMatch("src/data/worldCupSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function readFormula1Lastmod() {
  return toIsoString(
    readFirstMatch("src/data/formula1Snapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function readEarthquakeLastmod() {
  return toIsoString(
    readFirstMatch("src/data/earthquakeSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
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

function readTechStartupLastmod() {
  return toIsoString(
    readFirstMatch("src/data/techStartupSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function readBayAreaTransitLastmod() {
  return toIsoString(
    readFirstMatch("src/data/bayAreaTransitSnapshot.ts", /"generatedAt":\s*"([^"]+)"/)
  );
}

function getStaticRouteEntries() {
  return Object.entries(STATIC_ROUTE_LASTMOD).map(([loc, lastmod]) => ({
    loc,
    lastmod: toIsoString(lastmod) || new Date("2026-01-01T00:00:00.000Z").toISOString(),
  }));
}

/**
 * Walk a brace-balanced block starting at `openIndex` (which must point at a
 * `{`) and return the index of its matching `}`, or -1 if unbalanced.
 */
function matchBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Read portfolio case-study slugs directly from `src/constants/caseStudies.ts`.
 * The `[slug]/page.tsx` route uses `Object.keys(caseStudiesData)` for
 * `generateStaticParams`, so every key in that record gets a real page.
 *
 * We avoid the cost of compiling TypeScript from a JS sitemap helper by
 * regex-extracting top-level string keys inside the `caseStudiesData = { ... }`
 * object literal. Adding a new entry there automatically propagates to the
 * sitemap on the next build.
 */
function getPortfolioSlugEntries() {
  const source = readFile("src/constants/caseStudies.ts");
  const objectStart = source.indexOf("export const caseStudiesData");
  if (objectStart === -1) {
    return [];
  }

  // Walk the file from the export keyword and capture the brace-balanced object
  // literal so we don't accidentally pick up unrelated string keys later in the
  // file (e.g. inside helper functions).
  const braceStart = source.indexOf("{", objectStart);
  if (braceStart === -1) {
    return [];
  }

  const braceEnd = matchBrace(source, braceStart);
  if (braceEnd === -1) {
    return [];
  }

  const objectBody = source.slice(braceStart, braceEnd + 1);

  // Top-level entries look like `  "slug-name": {` at the start of a line.
  // Nested object keys are indented further or appear after `{` so a strict
  // 2-space prefix keeps us at depth 1.
  const slugRegex = /^\s{2}"([a-z0-9][a-z0-9-]*)":\s*\{/gm;
  const slugs = new Set();
  let match;
  while ((match = slugRegex.exec(objectBody)) !== null) {
    // Case studies with a top-level `link:` redirect (the [slug] route calls
    // `redirect(caseStudy.link)` instead of rendering a page), so listing them
    // in the sitemap just produces "Page with redirect" URLs. Only emit slugs
    // whose block has no top-level `link` property (4-space indented).
    const blockBraceStart = objectBody.indexOf("{", match.index + match[0].length - 1);
    const blockEnd = matchBrace(objectBody, blockBraceStart);
    if (blockEnd === -1) {
      continue;
    }
    const block = objectBody.slice(blockBraceStart, blockEnd + 1);
    if (/\n {4}link\s*:/.test(block)) {
      continue;
    }
    slugs.add(match[1]);
  }

  // Use the portfolio index lastmod as a sensible default; portfolio pages
  // share that bucket today.
  const lastmod = toIsoString("2026-04-04");
  return Array.from(slugs).map((slug) => ({
    loc: `/portfolio/${slug}`,
    lastmod,
  }));
}

function getBlogRouteEntries() {
  const contentDirectory = path.join(process.cwd(), "content/blog");

  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  // Future-dated posts (staggered series) stay out of the sitemap until their
  // publish date arrives — search engines distrust future lastmod values, and
  // the listing pages apply the same cutoff (see isBlogPostPublished).
  const today = new Date().toISOString().slice(0, 10);

  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.(mdx|md)$/, "");
      const { data } = matter(readFile(path.join("content/blog", file)));
      if (data.publishedAt && String(data.publishedAt).slice(0, 10) > today) {
        return null;
      }
      return {
        loc: `/writing/${slug}`,
        lastmod: toIsoString(data.updatedAt || data.publishedAt),
      };
    })
    .filter((entry) => entry && entry.lastmod);
}

function getPublicSitemapEntries() {
  const allEntries = [
    ...getStaticRouteEntries(),
    ...getPortfolioSlugEntries(),
    ...getBlogRouteEntries(),
  ];
  const dedupedEntries = new Map();

  for (const entry of allEntries) {
    dedupedEntries.set(entry.loc, entry);
  }

  return Array.from(dedupedEntries.values())
    .map((entry) => ({ ...entry, ...classifyEntry(entry.loc) }))
    .sort((a, b) => a.loc.localeCompare(b.loc));
}

const PUBLIC_SITEMAP_ENTRIES = getPublicSitemapEntries();
const PUBLIC_SITEMAP_PATHS = new Set(PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.loc));

module.exports = {
  PUBLIC_SITEMAP_ENTRIES,
  PUBLIC_SITEMAP_PATHS,
  getPublicSitemapEntries,
};
