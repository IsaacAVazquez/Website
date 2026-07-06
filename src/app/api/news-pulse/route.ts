import { NextResponse } from "next/server";
import { parseNewsFeed } from "@/lib/news-pulse-feed-parser";
import { NEWS_FEEDS } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";

const CACHE_CONTROL_HEADER = "public, s-maxage=300, stale-while-revalidate=600";
const ERROR_CACHE_CONTROL_HEADER = "no-store";
const FETCH_TIMEOUT_MS = 8_000;
const SUCCESS_TTL_MS = 5 * 60 * 1000;
const ERROR_TTL_MS = 30 * 1000;
const TOTAL_OUTAGE_MESSAGE =
  "No usable headlines came through on this refresh. I could not build a trustworthy comparison view.";

interface FeedResponseBody {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
  message?: string;
}

interface FeedFetchResult {
  body: FeedResponseBody;
  status: number;
  isError: boolean;
}

interface CacheEntry {
  promise: Promise<FeedFetchResult>;
  completedAt: number | null;
  value: FeedFetchResult | null;
}

// Module-level in-memory cache. Single Netlify instance — no Redis needed.
// Keyed by a stable cache key (currently "all" since the route has no
// per-request inputs). Single-flight: if a request comes in while a fetch
// is in-flight, we return the in-flight promise rather than starting a
// fresh fan-out to all 6 feeds.
const cache = new Map<string, CacheEntry>();

function isFresh(entry: CacheEntry, now: number): boolean {
  if (entry.completedAt === null || entry.value === null) {
    // Still in-flight — always considered fresh for single-flight purposes.
    return true;
  }
  const ttl = entry.value.isError ? ERROR_TTL_MS : SUCCESS_TTL_MS;
  return now - entry.completedAt < ttl;
}

// A timed-out fetch rejects with an AbortError once FETCH_TIMEOUT_MS elapses.
// Surface that as a plain "timed out" note instead of the runtime's raw
// "This operation was aborted" string, and pass other errors through as-is.
function describeFeedError(reason: unknown): string {
  if (
    reason instanceof Error &&
    (reason.name === "AbortError" || /abort/i.test(reason.message))
  ) {
    return `timed out after ${FETCH_TIMEOUT_MS / 1000}s`;
  }
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }
  return "unknown error";
}

async function fetchAllFeeds(): Promise<FeedFetchResult> {
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

    errors.push(`${NEWS_FEEDS[index].name}: ${describeFeedError(result.reason)}`);
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
    return {
      body: { ...body, message: TOTAL_OUTAGE_MESSAGE },
      status: 503,
      isError: true,
    };
  }

  return {
    body,
    status: 200,
    isError: false,
  };
}

function getOrFetch(key: string): Promise<FeedFetchResult> {
  const now = Date.now();
  const existing = cache.get(key);

  if (existing && isFresh(existing, now)) {
    return existing.promise;
  }

  const entry: CacheEntry = {
    promise: Promise.resolve<FeedFetchResult>({
      body: { articles: [], fetchedAt: "", errors: [] },
      status: 0,
      isError: true,
    }),
    completedAt: null,
    value: null,
  };

  entry.promise = (async () => {
    try {
      const result = await fetchAllFeeds();
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      const result: FeedFetchResult = {
        body: {
          articles: [],
          fetchedAt: new Date().toISOString(),
          errors: [message],
          message: TOTAL_OUTAGE_MESSAGE,
        },
        status: 503,
        isError: true,
      };
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    }
  })();

  cache.set(key, entry);
  return entry.promise;
}

export async function GET() {
  const result = await getOrFetch("all");

  return NextResponse.json(result.body, {
    status: result.status,
    headers: {
      "Cache-Control": result.isError
        ? ERROR_CACHE_CONTROL_HEADER
        : CACHE_CONTROL_HEADER,
    },
  });
}

// Test-only side channel. Next.js route-type checking forbids non-handler
// exports, so the cache reset is hung off a Symbol on `globalThis` instead.
// Tests call `(globalThis as any)[Symbol.for(...)]()` between cases to clear
// the module-level single-flight cache. Do not call this from production.
(globalThis as Record<symbol, unknown>)[
  Symbol.for("__newsPulseCacheResetForTesting")
] = (): void => {
  cache.clear();
};
