import { observeNews, parseNewsHistory, newsArticleKey } from "@/lib/newsHistory";
import type { NewsArticle } from "@/lib/news-pulse-utils";

const article: NewsArticle = { source: "bbc", sourceName: "BBC", sourceColor: "", link: "https://example.org/story", title: "Initial headline", description: "", pubDate: "2026-10-23T08:00:00Z", category: "" };

it("records first observation and a title revision without inventing a publication time", () => {
  const first = observeNews([], [article], "2026-10-23T09:00:00Z");
  const second = observeNews(first, [{ ...article, title: "Updated headline" }], "2026-10-23T10:00:00Z");
  expect(second).toHaveLength(1);
  expect(second[0]).toMatchObject({ firstSeen: "2026-10-23T09:00:00Z", lastSeen: "2026-10-23T10:00:00Z" });
  expect(second[0].revisions.map(item => item.title)).toEqual(["Initial headline", "Updated headline"]);
  expect(observeNews(second, [{ ...article, title: "Updated headline" }], "2026-10-23T11:00:00Z")[0].revisions).toHaveLength(2);
  const updated = { ...article, title: "Updated headline" };
  expect(newsArticleKey(article)).toBe(newsArticleKey(updated));
});

it("ages out observations, keeps separate outlets, and rejects unsafe restored records", () => {
  const first = observeNews([], [article, { ...article, source: "nyt" }], "2026-10-01T09:00:00Z");
  expect(first).toHaveLength(2);
  expect(observeNews(first, [], "2026-10-23T09:00:00Z")).toEqual([]);
  expect(parseNewsHistory([{ ...first[0], link: "javascript:alert(1)" }, null, { ...first[0], source: "constructor" }])).toEqual([]);
});
