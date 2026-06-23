import sitemapConfig from "../next-sitemap.config.js";

const investmentsIndex = require("../public/data/investments/index.json");

describe("next-sitemap config", () => {
  test("includes the explicit public-route allowlist and omits internal pages", async () => {
    const paths = await sitemapConfig.additionalPaths({});

    expect(paths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ loc: "/march-madness-2026" }),
        expect.objectContaining({ loc: "/news-pulse" }),
        expect.objectContaining({ loc: "/premier-league" }),
        expect.objectContaining({ loc: "/la-liga" }),
        expect.objectContaining({ loc: "/polling-aggregator" }),
        expect.objectContaining({ loc: "/spacex-mission-control" }),
      ])
    );

    expect(paths.some((path) => path.loc === "/admin")).toBe(false);
    expect(paths.some((path) => path.loc === "/search")).toBe(false);
  });

  test("filters admin and noindex routes from the generated sitemap", async () => {
    await expect(sitemapConfig.transform({}, "/admin")).resolves.toBeNull();
    await expect(sitemapConfig.transform({}, "/search")).resolves.toBeNull();
  });

  test("uses meaningful page-level lastmod values instead of build time", async () => {
    const paths = await sitemapConfig.additionalPaths({});
    const investmentArticle = paths.find(
      (path) => path.loc === "/writing/building-an-investment-research-platform"
    );
    const investmentsTool = paths.find((path) => path.loc === "/investments");

    expect(investmentArticle.lastmod).toBe(new Date("2026-04-02T00:00:00.000Z").toISOString());
    expect(investmentsTool.lastmod).toBe(new Date(investmentsIndex.lastUpdated).toISOString());
  });

  test("assigns content-type priority and changefreq", async () => {
    const paths = await sitemapConfig.additionalPaths({});
    const home = paths.find((path) => path.loc === "/");
    const investmentsHub = paths.find((path) => path.loc === "/investments");
    const investmentArticle = paths.find(
      (path) => path.loc === "/writing/building-an-investment-research-platform"
    );

    // Primary page
    expect(home).toMatchObject({ priority: 1.0, changefreq: "weekly" });
    // Section hub
    expect(investmentsHub).toMatchObject({ priority: 0.8, changefreq: "weekly" });
    // Individual article
    expect(investmentArticle).toMatchObject({ priority: 0.6, changefreq: "monthly" });
  });
});
