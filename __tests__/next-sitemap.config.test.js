import sitemapConfig from "../next-sitemap.config.js";

describe("next-sitemap config", () => {
  test("includes the March Madness route in additional paths", async () => {
    const paths = await sitemapConfig.additionalPaths({});

    expect(paths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          loc: "/march-madness-2026",
          changefreq: "weekly",
          priority: 0.75,
        }),
      ])
    );
  });
});
