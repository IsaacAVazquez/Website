import { NEWS_SOURCE_IDS, type NewsFeedId } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { isRecord } from "@/lib/utils";

export const NEWS_HISTORY_DAYS = 7;
export const NEWS_LAST_VISIT_KEY = "news-pulse-last-visit-v1";
const MAX_OBSERVATIONS = 600;
const MAX_REVISIONS = 8;
export interface NewsObservation {
  source: NewsFeedId;
  link: string;
  firstSeen: string;
  lastSeen: string;
  revisions: { title: string; observedAt: string }[];
}

export function newsArticleKey(
  article: Pick<NewsArticle, "source" | "link">,
): string {
  return `${article.source}\n${article.link}`;
}

export function parseNewsHistory(input: unknown): NewsObservation[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const validDate = (value: unknown): value is string =>
    typeof value === "string" && Number.isFinite(Date.parse(value));
  return input.slice(0, MAX_OBSERVATIONS).flatMap((item): NewsObservation[] => {
    if (
      !isRecord(item) ||
      !NEWS_SOURCE_IDS.includes(item.source as NewsFeedId) ||
      typeof item.link !== "string" ||
      !/^https?:\/\//i.test(item.link) ||
      item.link.length > 2000 ||
      !validDate(item.firstSeen) ||
      !validDate(item.lastSeen) ||
      Date.parse(item.lastSeen) < Date.parse(item.firstSeen) ||
      !Array.isArray(item.revisions)
    )
      return [];
    const revisions = item.revisions
      .flatMap((revision) =>
        isRecord(revision) &&
        typeof revision.title === "string" &&
        revision.title.trim() &&
        validDate(revision.observedAt) &&
        Date.parse(revision.observedAt) >=
          Date.parse(item.firstSeen as string) &&
        Date.parse(revision.observedAt) <= Date.parse(item.lastSeen as string)
          ? [
              {
                title: revision.title.trim().slice(0, 600),
                observedAt: revision.observedAt,
              },
            ]
          : [],
      )
      .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
      .slice(-MAX_REVISIONS);
    if (revisions.length === 0) return [];
    const key = newsArticleKey({
      source: item.source as NewsFeedId,
      link: item.link,
    });
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        source: item.source as NewsFeedId,
        link: item.link,
        firstSeen: item.firstSeen,
        lastSeen: item.lastSeen,
        revisions,
      },
    ];
  });
}

export function observeNews(
  history: NewsObservation[],
  articles: NewsArticle[],
  observedAt: string,
): NewsObservation[] {
  const now = Date.parse(observedAt);
  if (!Number.isFinite(now)) return history;
  const cutoff = now - NEWS_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const records = new Map(
    history
      .filter((item) => Date.parse(item.lastSeen) >= cutoff)
      .map((item) => [newsArticleKey(item), item]),
  );
  for (const article of articles) {
    if (!/^https?:\/\//i.test(article.link) || !article.title.trim()) continue;
    const key = newsArticleKey(article);
    const previous = records.get(key);
    if (previous && Date.parse(previous.lastSeen) >= now) continue;
    const revisions = [...(previous?.revisions ?? [])];
    if (revisions.at(-1)?.title !== article.title.trim())
      revisions.push({ title: article.title.trim().slice(0, 600), observedAt });
    records.set(key, {
      source: article.source,
      link: article.link,
      firstSeen: previous?.firstSeen ?? observedAt,
      lastSeen: observedAt,
      revisions: revisions.slice(-MAX_REVISIONS),
    });
  }
  return [...records.values()]
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen))
    .slice(0, MAX_OBSERVATIONS);
}
