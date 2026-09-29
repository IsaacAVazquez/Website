import { SOURCE_META } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { clusterArticlesByStory, extractTopics } from "@/lib/news-pulse-utils";

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

function makeTopicArticle(
  index: number,
  title: string,
  source: NewsArticle["source"],
): NewsArticle {
  return {
    title,
    link: `https://example.com/topic-${index}`,
    description: "",
    pubDate: "2026-09-27T16:20:00.000Z",
    category: "General",
    source,
    sourceName: SOURCE_META[source].name,
    sourceColor: SOURCE_META[source].color,
  };
}

describe("extractTopics", () => {
  it("drops generic words that recur across unrelated headlines instead of one shared subject", () => {
    // Same sentence from four different outlets, the way "world", "back",
    // "city", "state", "life", "play", and "week" actually turned up as
    // topics on the live site: not because outlets covered one shared
    // subject, but because each word is common enough to recur incidentally.
    const sentence =
      "Trump takes a world tour, throws a state dinner, drives back into the city, ends a long week, shares family life, and finds time to play";
    const articles: NewsArticle[] = [
      makeTopicArticle(1, sentence, "atlantic"),
      makeTopicArticle(2, sentence, "guardian"),
      makeTopicArticle(3, sentence, "bbc"),
      makeTopicArticle(4, sentence, "npr"),
    ];

    const topics = extractTopics(articles, 50).map((topic) => topic.topic);

    for (const noise of ["world", "back", "city", "state", "life", "play", "week"]) {
      expect(topics).not.toContain(noise);
    }
    expect(topics).toContain("trump");
  });

  it("drops a second batch of generic connector words seen the same way", () => {
    // "president", "call", "around", "work", and "days" also turned up as
    // topics on the live site for the same reason: incidental recurrence
    // across headlines about unrelated stories, not a shared subject.
    const sentence =
      "The president made a call around the world about work after days of talks about Iran";
    const articles: NewsArticle[] = [
      makeTopicArticle(1, sentence, "atlantic"),
      makeTopicArticle(2, sentence, "guardian"),
      makeTopicArticle(3, sentence, "bbc"),
      makeTopicArticle(4, sentence, "npr"),
    ];

    const topics = extractTopics(articles, 50).map((topic) => topic.topic);

    for (const noise of ["president", "call", "around", "work", "days"]) {
      expect(topics).not.toContain(noise);
    }
    expect(topics).toContain("iran");
  });

  it("drops journalism-meta filler words, not just from story clusters", () => {
    // "live" is a live-blog tag ("NFL week three ... – live"), not a topic.
    const articles: NewsArticle[] = [
      makeTopicArticle(1, "Nations League roundup tonight – live", "bbc"),
      makeTopicArticle(2, "Premier League matchday coverage – live", "guardian"),
      makeTopicArticle(3, "Storm warnings issued for the coastline – live", "npr"),
    ];

    const topics = extractTopics(articles).map((topic) => topic.topic);
    expect(topics).not.toContain("live");
  });
});

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

