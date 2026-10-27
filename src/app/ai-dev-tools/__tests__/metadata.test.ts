import { metadata } from "../page";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPublicSitemapEntries } = require("../../../lib/sitemap.js") as {
  getPublicSitemapEntries: () => Array<{ loc: string; lastmod: string }>;
};

describe("AI Dev Tool Directory metadata", () => {
  // The sitemap dates the route at its last redesign or its data, whichever
  // is later, and the page's own modified date has to say the same day.
  it("dates the page the same day the sitemap does", () => {
    const entry = getPublicSitemapEntries().find(({ loc }) => loc === "/ai-dev-tools");
    const other = metadata.other as Record<string, string>;

    expect(other["og:updated_time"]).toBe(entry?.lastmod.slice(0, 10));
  });
});
