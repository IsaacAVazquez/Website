import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getPublicSitemapEntries } = require("../../../src/lib/sitemap.js") as {
  getPublicSitemapEntries: () => Array<{ loc: string }>;
};

describe("public sitemap", () => {
  it("matches the canonical route inventory", () => {
    const sitemap = fs.readFileSync("public/sitemap.xml", "utf8");
    const actual = Array.from(
      sitemap.matchAll(/<loc>https:\/\/isaacavazquez\.com([^<]*)<\/loc>/g),
      (match) => match[1] || "/"
    ).sort();
    const expected = getPublicSitemapEntries()
      .map((entry) => entry.loc)
      .sort();

    expect(actual).toEqual(expected);
  });
});
