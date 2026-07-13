import { NextResponse } from "next/server";
import { parseNewsFeed } from "@/lib/news-pulse-feed-parser";
import { NEWS_FEEDS, type NewsFeedId } from "@/lib/news-pulse-sources";
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
  dataStatus: "fresh" | "degraded" | "stale-fallback" | "unavailable";
  staleSources?: string[];
  message?: string;
}

interface FeedFetchResult {
  body: FeedResponseBody;
  status: number;
  isError: boolean;
  // Some feeds failed but every served article is fresh. Reported in the body
  // (dataStatus: "degraded") but cached like a success — one dead feed must
  // not disable CDN caching or the 5-minute server TTL for the whole route.
  isDegraded?: boolean;
  // A usable but stale response: the latest refresh failed, so we serve the last
  // good headlines. Cached with the short error TTL (retry soon) but returned to
  // the client as a 200 with a note rather than a blank 503.
  isStale?: boolean;
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

interface LastGoodFeed {
  articles: NewsArticle[];
  fetchedAt: string;
}

// Keep last-good data at the source grain. A partial refresh can then update
// the feeds that responded without deleting healthy data for a failed feed.
const lastGoodByFeed = new Map<NewsFeedId, LastGoodFeed>();

function isFresh(entry: CacheEntry, now: number): boolean {
  if (entry.completedAt === null || entry.value === null) {
    // Still in-flight — always considered fresh for single-flight purposes.
    return true;
  }
  // Stale (served-from-last-good) responses use the short error TTL so we retry
  // the feeds soon rather than sitting on stale data for the full 5 minutes.
  const ttl =
    entry.value.isError || entry.value.isStale ? ERROR_TTL_MS : SUCCESS_TTL_MS;
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
  const staleSources: string[] = [];
  const fetchedAt = new Date().toISOString();

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
  let successfulFeedCount = 0;
  for (const [index, result] of results.entries()) {
    const feed = NEWS_FEEDS[index];
    if (result.status === "fulfilled") {
      successfulFeedCount += 1;
      articles.push(...result.value);
      lastGoodByFeed.set(feed.id, {
        articles: result.value,
        fetchedAt,
      });
      continue;
    }

    errors.push(`${feed.name}: ${describeFeedError(result.reason)}`);
    const lastGoodFeed = lastGoodByFeed.get(feed.id);
    if (lastGoodFeed) {
      articles.push(...lastGoodFeed.articles);
      staleSources.push(feed.name);
    }
  }

  articles.sort((left, right) => {
    const leftTime = Date.parse(left.pubDate || "");
    const rightTime = Date.parse(right.pubDate || "");
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });

  const body: FeedResponseBody = {
    articles,
    fetchedAt,
    errors,
    dataStatus: errors.length > 0 ? "degraded" : "fresh",
    ...(staleSources.length > 0 ? { staleSources } : {}),
  };

  if (successfulFeedCount === 0) {
    if (articles.length > 0) {
      const lastSuccessfulAt = Math.max(
        ...Array.from(lastGoodByFeed.values(), (feed) =>
          Date.parse(feed.fetchedAt)
        ).filter(Number.isFinite)
      );

      return {
        body: {
          ...body,
          fetchedAt: Number.isFinite(lastSuccessfulAt)
            ? new Date(lastSuccessfulAt).toISOString()
            : fetchedAt,
          dataStatus: "stale-fallback",
          message:
            "Showing the last good headlines — the most recent refresh could not reach the feeds.",
        },
        status: 200,
        isError: false,
        isDegraded: true,
        isStale: true,
      };
    }

    return {
      body: {
        ...body,
        dataStatus: "unavailable",
        message: TOTAL_OUTAGE_MESSAGE,
      },
      status: 503,
      isError: true,
    };
  }

  return {
    body,
    status: 200,
    isError: false,
    isDegraded: errors.length > 0,
    isStale: staleSources.length > 0,
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
      body: {
        articles: [],
        fetchedAt: "",
        errors: [],
        dataStatus: "unavailable",
      },
      status: 0,
      isError: true,
    }),
    completedAt: null,
    value: null,
  };

  entry.promise = (async () => {
    const settle = (result: FeedFetchResult): FeedFetchResult => {
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    };

    try {
      return settle(await fetchAllFeeds());
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      return settle({
        body: {
          articles: [],
          fetchedAt: new Date().toISOString(),
          errors: [message],
          dataStatus: "unavailable",
          message: TOTAL_OUTAGE_MESSAGE,
        },
        status: 503,
        isError: true,
      });
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
      "Cache-Control": result.isError || result.isStale
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
  lastGoodByFeed.clear();
};
