import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { clusterArticlesByStory } from "@/lib/news-pulse-utils";

const clusteredArticles: NewsArticle[] = [
  {
    title: "Trump tariffs hit auto market as China tensions rise",
    link: "https://example.com/trump-tariffs-atlantic",
    description: "Automakers are weighing China exposure after the latest tariff move.",
    pubDate: "2026-04-08T16:20:00.000Z",
    category: "Business",
    source: "atlantic",
    sourceName: SOURCE_META.atlantic.name,
    sourceColor: SOURCE_META.atlantic.color,
  },
  {
    title: "China tariff tensions hit auto market after Trump move",
    link: "https://example.com/trump-tariffs-guardian",
    description: "Trade desks are watching automaker shares after Trump's tariff push.",
    pubDate: "2026-04-08T16:10:00.000Z",
    category: "Business",
    source: "guardian",
    sourceName: SOURCE_META.guardian.name,
    sourceColor: SOURCE_META.guardian.color,
  },
  {
    title: "Auto market rattled by Trump tariff tensions with China",
    link: "https://example.com/trump-tariffs-bbc",
    description: "Manufacturers face another round of China tariff pressure.",
    pubDate: "2026-04-08T16:05:00.000Z",
    category: "Business",
    source: "bbc",
    sourceName: SOURCE_META.bbc.name,
    sourceColor: SOURCE_META.bbc.color,
  },
  {
    title: "Central banks brace for a new inflation test",
    link: "https://example.com/central-banks",
    description: "Policymakers are watching energy prices and labor data for fresh pressure.",
    pubDate: "2026-04-08T15:30:00.000Z",
    category: "Economy",
    source: "npr",
    sourceName: SOURCE_META.npr.name,
    sourceColor: SOURCE_META.npr.color,
  },
];

describe("clusterArticlesByStory", () => {
  it("groups same-story coverage across outlets and drops single-source clusters", () => {
    const clusters = clusterArticlesByStory(clusteredArticles);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toEqual(
      expect.objectContaining({
        totalCount: 3,
        representative: expect.objectContaining({
          link: "https://example.com/trump-tariffs-atlantic",
        }),
        sources: expect.objectContaining({
          atlantic: 1,
          guardian: 1,
          bbc: 1,
        }),
      }),
    );
  });
});

