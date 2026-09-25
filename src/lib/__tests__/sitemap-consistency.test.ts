import fs from "fs";
import matter from "gray-matter";
import { BLOG_TOPIC_PAGES } from "@/lib/blog-config";
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

  // Google only trusts lastmod when it tracks real changes, and a new post
  // changes the writing index and the topic page it is filed under.
  describe("writing freshness", () => {
    const entries = getPublicSitemapEntries();
    const lastmodOf = (loc: string) => entries.find((entry) => entry.loc === loc)?.lastmod ?? "";
    const posts = entries
      .filter(({ loc }) => /^\/writing\/(?!topics\/)[^/]+$/.test(loc))
      .map(({ loc, lastmod }) => {
        const slug = loc.replace("/writing/", "");
        const file = ["mdx", "md"]
          .map((extension) => `content/blog/${slug}.${extension}`)
          .find((candidate) => fs.existsSync(candidate)) as string;
        const { data } = matter(fs.readFileSync(file, "utf8"));
        return { lastmod, topic: data.cluster || data.archiveBucket };
      });
    const newest = (candidates: typeof posts) =>
      candidates.map(({ lastmod }) => lastmod).sort().at(-1) ?? "";

    it("dates the writing index no earlier than its newest post", () => {
      expect(posts.length).toBeGreaterThan(0);
      expect(lastmodOf("/writing") >= newest(posts)).toBe(true);
    });

    it.each(BLOG_TOPIC_PAGES.map(({ slug, label }) => [slug, label]))(
      "dates /writing/topics/%s no earlier than the newest post filed under it",
      (slug, label) => {
        const filed = posts.filter(({ topic }) => topic === label);
        expect(filed.length).toBeGreaterThan(0);
        expect(lastmodOf(`/writing/topics/${slug}`) >= newest(filed)).toBe(true);
      }
    );
  });

  it("keeps the score pools settings form out of the sitemap", () => {
    const locs = getPublicSitemapEntries().map(({ loc }) => loc);
    expect(locs).not.toContain("/score-pools/settings");
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
