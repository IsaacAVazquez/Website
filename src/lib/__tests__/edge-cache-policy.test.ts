import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

interface HeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

function loadHeaderRules(): HeaderRule[] {
  const script = [
    "import config from './next.config.mjs';",
    "process.stdout.write(JSON.stringify(await config.headers()));",
  ].join("");

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
  ) as HeaderRule[];
}

const names = (rule: HeaderRule) => rule.headers.map((header) => header.key.toLowerCase());
const cached = loadHeaderRules().filter((rule) =>
  names(rule).includes("netlify-cdn-cache-control")
);
const cachedSources = cached.map((rule) => rule.source).sort();

describe("edge cache policy", () => {
  // These pages render on every request only because they read searchParams.
  // Their HTML depends on the deploy and the query string and nothing else,
  // so the CDN can keep a copy. Adding a route here is a claim about that
  // route, which is why the list is spelled out.
  it("caches the pages whose HTML depends only on the deploy and the query string", () => {
    expect(cachedSources).toEqual([
      "/ai-dev-tools",
      "/bay-area-transit",
      "/decision-lab",
      "/earthquake-pulse",
      "/fantasy-football/best-ball",
      "/fantasy-football/best-ball/draft-tracker",
      "/fantasy-football/trade-calculator",
      "/fantasy-formula-1",
      "/food-map",
      "/formula-1",
      "/github-trending-pulse",
      "/golf",
      "/investments",
      "/la-liga",
      "/march-madness-2026",
      "/mlb",
      "/museum-log",
      "/nba",
      "/nfl",
      "/premier-league",
      "/search",
      "/tech-startup-tracker",
      "/world-cup-2026",
    ]);
  });

  // Without it the plugin's cache key holds only `_rsc` and `__nextDataReq`
  // from the query string, so /nfl?team=SF would be served the copy cached
  // for /nfl.
  it("makes the whole query string part of the cache key on every cached page", () => {
    for (const rule of cached) {
      expect([rule.source, rule.headers]).toEqual([
        rule.source,
        expect.arrayContaining([{ key: "Netlify-Vary", value: "query" }]),
      ]);
    }
  });

  it("names each cached page exactly, and each one exists", () => {
    for (const source of cachedSources) {
      expect(source).toMatch(/^(\/[a-z0-9-]+)+$/);
      expect([source, existsSync(path.join(process.cwd(), "src/app", source, "page.tsx"))]).toEqual([
        source,
        true,
      ]);
    }
  });

  // Browsers keep Next's `private, no-store`. `CDN-Cache-Control` would pass
  // through the plugin to Cloudflare and the browser, so only Netlify's own
  // header is used.
  it("changes what Netlify's CDN keeps and nothing else", () => {
    for (const rule of cached) {
      expect(names(rule).sort()).toEqual(["netlify-cdn-cache-control", "netlify-vary"]);
    }
  });

  it.each([
    // Each prints a request-time value into its HTML, so a cached copy would
    // show a stale one and could fail hydration.
    "/spacex-mission-control",
    "/score-pools",
    "/fantasy-football",
    "/fantasy-football/weekly",
    "/fantasy-football/waivers",
    // Each fetches live data or reads Netlify Blobs.
    "/news-pulse",
    "/mba-internship-notifications",
    "/frontier-models",
    "/polling-aggregator",
  ])("leaves %s rendering on every request", (source) => {
    expect(cachedSources).not.toContain(source);
  });
});
