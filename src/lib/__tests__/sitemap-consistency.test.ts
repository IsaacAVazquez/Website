import fs from "fs";
import { formula1Snapshot } from "@/data/formula1Snapshot";
import { golfSnapshot } from "@/data/golfSnapshot";
import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { mlbSnapshot } from "@/data/mlbSnapshot";
import { nbaSnapshot } from "@/data/nbaSnapshot";

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
    const siteUrl = "https://isaacvazquez.com";
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

  it.each([
    ["/formula-1", formula1Snapshot.generatedAt],
    ["/golf", golfSnapshot.summary.tournament?.generatedAt],
    ["/la-liga", laLigaSnapshot.generatedAt],
    ["/mlb", mlbSnapshot.generatedAt],
    ["/nba", nbaSnapshot.generatedAt],
    [
      "/spacex-mission-control",
      JSON.parse(fs.readFileSync("src/data/spacexSnapshot.generated.json", "utf8"))
        .generatedAt,
    ],
  ])("tracks the current snapshot timestamp for %s", (pathname, generatedAt) => {
    const entry = getPublicSitemapEntries().find(({ loc }) => loc === pathname);
    expect(entry?.lastmod).toBe(new Date(generatedAt as string).toISOString());
  });

  it("publishes the trade calculator as a weekly fantasy leaf", () => {
    const entries = getPublicSitemapEntries();
    const fantasyHub = entries.find(({ loc }) => loc === "/fantasy-football");
    const tradeCalculator = entries.find(
      ({ loc }) => loc === "/fantasy-football/trade-calculator"
    );

    expect(tradeCalculator).toMatchObject({
      changefreq: "weekly",
      priority: 0.6,
      lastmod: fantasyHub?.lastmod,
    });
  });
});
