import { NextResponse } from "next/server";
import { parseNewsFeed } from "@/lib/news-pulse-feed-parser";
import { NEWS_FEEDS } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";

const CACHE_CONTROL_HEADER = "public, s-maxage=300, stale-while-revalidate=600";
const FETCH_TIMEOUT_MS = 8_000;
const TOTAL_OUTAGE_MESSAGE =
  "No usable headlines came through on this refresh. I could not build a trustworthy comparison view.";

interface FeedResponseBody {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
  message?: string;
}

export async function GET() {
  const errors: string[] = [];

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "NewsPulseDashboard/1.0" },
          next: { revalidate: 300 },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xml = await response.text();
        const articles = parseNewsFeed(xml, feed);
        if (articles.length === 0) {
          throw new Error("returned no usable entries");
        }

        return articles;
      } finally {
        clearTimeout(timeout);
      }
    }),
  );

  const articles: NewsArticle[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      continue;
    }

    errors.push(`${NEWS_FEEDS[index].name}: ${result.reason?.message ?? "unknown error"}`);
  }

  articles.sort((left, right) => {
    const leftTime = Date.parse(left.pubDate || "");
    const rightTime = Date.parse(right.pubDate || "");
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });

  const body: FeedResponseBody = {
    articles,
    fetchedAt: new Date().toISOString(),
    errors,
  };

  if (articles.length === 0) {
    return NextResponse.json(
      { ...body, message: TOTAL_OUTAGE_MESSAGE },
      {
        status: 503,
        headers: { "Cache-Control": CACHE_CONTROL_HEADER },
      },
    );
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": CACHE_CONTROL_HEADER },
  });
}

