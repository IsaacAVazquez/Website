import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPublicSitemapEntries } = require("../../../src/lib/sitemap.js") as {
  getPublicSitemapEntries: () => Array<{
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
  }>;
};

describe("public sitemap", () => {
  it("matches the canonical route inventory and freshness metadata", () => {
    const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
    const siteUrl = "https://isaacavazquez.com";
    const readTag = (block: string, tag: string) =>
      block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1];

    const actual = Array.from(sitemap.matchAll(/<url>(.*?)<\/url>/gs), (match) => {
      const block = match[1];
      const loc = readTag(block, "loc") ?? "";
      return {
        loc: loc === siteUrl ? "/" : loc.replace(siteUrl, ""),
        lastmod: readTag(block, "lastmod"),
        changefreq: readTag(block, "changefreq"),
        priority: Number(readTag(block, "priority")),
      };
    }).sort((a, b) => a.loc.localeCompare(b.loc));

    const expected = getPublicSitemapEntries()
      .map((entry) => ({
        loc: entry.loc,
        lastmod: entry.lastmod,
        changefreq: entry.changefreq,
        priority: entry.priority,
      }))
      .sort((a, b) => a.loc.localeCompare(b.loc));

    expect(actual).toEqual(expected);
  });
});
