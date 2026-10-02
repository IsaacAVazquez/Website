import { parseNewsFeed } from "@/lib/news-pulse-feed-parser";
import { NEWS_FEEDS, type NewsFeedId } from "@/lib/news-pulse-sources";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import { readDurableJson, writeDurableJson } from "@/lib/netlifyBlobs";
import { isTimeoutError } from "@/lib/fetchRetry";
import { recordRuntimeSurfaceHeartbeat } from "@/lib/runtimeSurfaceHeartbeat";

const FETCH_TIMEOUT_MS = 8_000;
const SUCCESS_TTL_MS = 5 * 60 * 1000;
const ERROR_TTL_MS = 30 * 1000;
const TOTAL_OUTAGE_MESSAGE =
  "No usable headlines came through on this refresh. I could not build a trustworthy comparison view.";
const DURABLE_LAST_GOOD_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ARTICLES_PER_FEED = 30;
const MAX_ARTICLE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface NewsPulseFeedResponse {
  articles: NewsArticle[];
  fetchedAt: string;
  errors: string[];
  dataStatus: "fresh" | "degraded" | "stale-fallback" | "unavailable";
  staleSources?: string[];
  message?: string;
}

interface NewsPulseDataResult {
  body: NewsPulseFeedResponse;
  status: number;
  isError: boolean;
  // Some feeds failed and at least one is fresh. A failed feed shows its last
  // good headlines when it has them. Reported in the body (dataStatus:
  // "degraded") but cached like a success, since one dead feed must not
  // disable CDN caching or the 5-minute server TTL for the whole route.
  isDegraded?: boolean;
  // A usable but stale response: every feed failed, so we serve the last good
  // headlines. Cached with the short error TTL (retry soon) but returned to
  // the client as a 200 with a note rather than a blank 503.
  isStale?: boolean;
}

interface CacheEntry {
  promise: Promise<NewsPulseDataResult>;
  completedAt: number | null;
  value: NewsPulseDataResult | null;
}

// Module-level in-memory cache. Single Netlify instance — no Redis needed.
// Keyed by a stable cache key (currently "all" since the route has no
// per-request inputs). Single-flight: if a request comes in while a fetch
// is in-flight, we return the in-flight promise rather than starting a
// fresh fan-out to all 6 feeds.
let cached: CacheEntry | null = null;

interface LastGoodFeed {
  articles: NewsArticle[];
  fetchedAt: string;
}

// Keep last-good data at the source grain. A partial refresh can then update
// the feeds that responded without deleting healthy data for a failed feed.
const lastGoodByFeed = new Map<NewsFeedId, LastGoodFeed>();
let durableHydrationPromise: Promise<void> | null = null;

function hydrateDurableLastGood(): Promise<void> {
  if (durableHydrationPromise) return durableHydrationPromise;
  durableHydrationPromise = (async () => {
    const saved = await readDurableJson<
      Partial<Record<NewsFeedId, LastGoodFeed>>
    >("news-pulse/feeds", DURABLE_LAST_GOOD_MAX_AGE_MS);
    if (!saved) return;
    for (const feed of NEWS_FEEDS) {
      const value = saved[feed.id];
      if (value && !lastGoodByFeed.has(feed.id)) {
        lastGoodByFeed.set(feed.id, value);
      }
    }
  })();
  return durableHydrationPromise;
}

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

// A timed-out fetch rejects with a TimeoutError once FETCH_TIMEOUT_MS elapses.
// Surface that as a plain "timed out" note instead of the runtime's raw
// "The operation was aborted due to timeout" string, and pass other errors through as-is.
function describeFeedError(reason: unknown): string {
  if (isTimeoutError(reason) || (reason instanceof Error && /abort/i.test(reason.message))) {
    return `timed out after ${FETCH_TIMEOUT_MS / 1000}s`;
  }
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }
  return "unknown error";
}

function getPublishedTime(article: NewsArticle): number {
  const time = Date.parse(article.pubDate || "");
  return Number.isNaN(time) ? 0 : time;
}

function byNewest(left: NewsArticle, right: NewsArticle): number {
  return getPublishedTime(right) - getPublishedTime(left);
}

async function fetchAllFeeds(): Promise<NewsPulseDataResult> {
  await hydrateDurableLastGood();
  const errors: string[] = [];
  const staleSources: string[] = [];
  const fetchedAt = new Date().toISOString();

  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const response = await fetch(feed.url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": "NewsPulseDashboard/1.0" },
        next: { revalidate: 300 },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xml = await response.text();
      const articles = parseNewsFeed(xml, feed);
      if (articles.length === 0) {
        throw new Error("returned no usable entries");
      }

      // One outlet's feed can carry several times the items of the others
      // and reach back years, so each feed is cut to its newest items. An
      // undated item has no age to judge, so it stays and sorts last.
      const oldestAllowed = Date.now() - MAX_ARTICLE_AGE_MS;
      const recent = articles
        .filter(
          (article) =>
            !article.pubDate || getPublishedTime(article) >= oldestAllowed
        )
        .sort(byNewest)
        .slice(0, MAX_ARTICLES_PER_FEED);
      if (recent.length === 0) {
        throw new Error("returned nothing from the last 7 days");
      }

      return recent;
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

    const reason = `${feed.name}: ${describeFeedError(result.reason)}`;
    const lastGoodFeed = lastGoodByFeed.get(feed.id);
    if (!lastGoodFeed) {
      errors.push(reason);
      continue;
    }
    articles.push(...lastGoodFeed.articles);
    staleSources.push(feed.name);
    const lastGoodAt = lastGoodFeed.fetchedAt.slice(0, 16).replace("T", " ");
    errors.push(`${reason} (showing headlines fetched ${lastGoodAt} UTC)`);
  }

  if (successfulFeedCount > 0) {
    await writeDurableJson(
      "news-pulse/feeds",
      Object.fromEntries(lastGoodByFeed) as Partial<
        Record<NewsFeedId, LastGoodFeed>
      >
    );
  }

  articles.sort(byNewest);

  const body: NewsPulseFeedResponse = {
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
            "I am showing the last good headlines because the most recent refresh could not reach the feeds.",
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
  };
}

export async function getNewsPulseData(): Promise<NewsPulseDataResult> {
  if (cached && isFresh(cached, Date.now())) {
    return cached.promise;
  }

  const entry: CacheEntry = {
    promise: Promise.resolve<NewsPulseDataResult>({
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
    const settle = (result: NewsPulseDataResult): NewsPulseDataResult => {
      entry.value = result;
      entry.completedAt = Date.now();
      return result;
    };

    try {
      const result = settle(await fetchAllFeeds());
      // Stamp the revision-ledger heartbeat with the served condition. A total
      // outage (unavailable) served nothing, so it's skipped and the last
      // known-good heartbeat stands.
      if (result.body.dataStatus !== "unavailable") {
        await recordRuntimeSurfaceHeartbeat("news-pulse", {
          fetchedAt: result.body.fetchedAt,
          status: result.body.dataStatus,
        });
      }
      return result;
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

  cached = entry;
  return entry.promise;
}

// Test-only side channel. Next.js route-type checking forbids non-handler
// exports, so the cache reset is hung off a Symbol on `globalThis` instead.
// Tests call `(globalThis as any)[Symbol.for(...)]()` between cases to clear
// the module-level single-flight cache. Do not call this from production.
(globalThis as Record<symbol, unknown>)[
  Symbol.for("__newsPulseCacheResetForTesting")
] = (): void => {
  cached = null;
  lastGoodByFeed.clear();
  durableHydrationPromise = null;
};
