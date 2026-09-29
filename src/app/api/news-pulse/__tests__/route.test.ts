/**
 * @jest-environment node
 */
import { GET } from "../route";
import {
  NEWS_FEEDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";

// The route exposes its cache reset on globalThis under a well-known Symbol
// because Next.js route-type checking forbids extra route exports.
function resetNewsPulseCache(): void {
  const reset = (globalThis as Record<symbol, unknown>)[
    Symbol.for("__newsPulseCacheResetForTesting")
  ];
  if (typeof reset === "function") (reset as () => void)();
}

const FEED_URLS = Object.fromEntries(
  NEWS_FEEDS.map((feed) => [feed.id, feed.url]),
) as Record<NewsFeedId, string>;

const originalFetch = global.fetch;
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function makeRssFeed({
  title,
  link,
  description,
  pubDate,
  category,
}: {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <item>
          <title>${title}</title>
          <link>${link}</link>
          <description><![CDATA[${description}]]></description>
          <pubDate>${pubDate}</pubDate>
          ${category ? `<category>${category}</category>` : ""}
        </item>
      </channel>
    </rss>`;
}

function makeAtomFeed({
  title,
  link,
  summary,
  content,
  published,
  updated,
  category,
}: {
  title: string;
  link: string;
  summary?: string;
  content?: string;
  published?: string;
  updated: string;
  category?: string;
}) {
  return `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>The Atlantic</title>
      <entry>
        <title type="html">${title}</title>
        <link rel="alternate" href="${link}" />
        ${summary ? `<summary type="html">${summary}</summary>` : ""}
        ${content ? `<content type="html">${content}</content>` : ""}
        ${category ? `<category term="${category}" />` : ""}
        ${published ? `<published>${published}</published>` : ""}
        <updated>${updated}</updated>
      </entry>
    </feed>`;
}

// The route drops items older than 7 days, so fixture dates are set from the
// clock. RSS carries RFC 822 dates and Atom carries ISO 8601, as the real feeds do.
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function makeRssItems(
  items: Array<{ title: string; link: string; pubDate: string }>
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        ${items
          .map(
            (item) => `<item>
          <title>${item.title}</title>
          <link>${item.link}</link>
          <description>&lt;p&gt;${item.title} summary&lt;/p&gt;</description>
          <pubDate>${item.pubDate}</pubDate>
          <guid>${item.link}</guid>
        </item>`
          )
          .join("\n")}
      </channel>
    </rss>`;
}

function buildFeedMap(overrides: Partial<Record<string, string | Error>> = {}) {
  return {
    [FEED_URLS.atlantic]: makeAtomFeed({
      title: "Atlantic <em>Headline</em>",
      link: "https://www.theatlantic.com/technology/2026/04/sample-story/",
      summary: "Atlantic <strong>summary</strong>",
      content: "<p>Atlantic content fallback</p>",
      published: hoursAgo(7).toISOString(),
      updated: hoursAgo(6).toISOString(),
      category: "Technology",
    }),
    [FEED_URLS.nyt]: makeRssFeed({
      title: "NYT Headline",
      link: "https://www.nytimes.com/2026/04/03/world/sample-story.html",
      description: "NYT summary",
      pubDate: hoursAgo(1).toUTCString(),
      category: "World",
    }),
    [FEED_URLS.guardian]: makeRssFeed({
      title: "Guardian Headline",
      link: "https://www.theguardian.com/world/2026/apr/03/sample-story",
      description: "Guardian summary",
      pubDate: hoursAgo(2).toUTCString(),
      category: "World",
    }),
    [FEED_URLS.bbc]: makeRssFeed({
      title: "BBC Headline",
      link: "https://www.bbc.com/news/sample-story",
      description: "BBC summary",
      pubDate: hoursAgo(3).toUTCString(),
      category: "UK",
    }),
    [FEED_URLS.npr]: makeRssFeed({
      title: "NPR Headline",
      link: "https://www.npr.org/2026/04/03/sample-story",
      description: "NPR summary",
      pubDate: hoursAgo(4).toUTCString(),
      category: "Politics",
    }),
    [FEED_URLS.aljazeera]: makeRssFeed({
      title: "Al Jazeera Headline",
      link: "https://www.aljazeera.com/news/2026/4/3/sample-story",
      description: "Al Jazeera summary",
      pubDate: hoursAgo(5).toUTCString(),
      category: "World",
    }),
    ...overrides,
  };
}

function installFetchMock(feedMap: Record<string, string | Error | undefined>) {
  mockFetch.mockImplementation(async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const response = feedMap[url];
    if (response instanceof Error) {
      throw response;
    }

    if (typeof response !== "string") {
      return new Response("missing mock response", { status: 404 });
    }

    return new Response(response, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  });
}

describe("GET /api/news-pulse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The route uses a module-level single-flight cache. Without resetting
    // it between tests, the second test's mocked feed map would never be
    // hit because the first test's cached result would be returned.
    resetNewsPulseCache();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: mockFetch,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
  });

  it("still parses feeds into the shared article shape and metadata", async () => {
    installFetchMock(buildFeedMap());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(body.articles).toHaveLength(6);
    expect(body.articles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "nyt",
          sourceName: "NYT",
          title: "NYT Headline",
          link: "https://www.nytimes.com/2026/04/03/world/sample-story.html",
          description: "NYT summary",
          category: "World",
        }),
      ]),
    );

    for (const article of body.articles as Array<{ source: NewsFeedId; sourceName: string; sourceColor: string }>) {
      expect(article.sourceName).toBe(SOURCE_META[article.source].name);
      expect(article.sourceColor).toBe(SOURCE_META[article.source].color);
    }
  });

  it("serves the last good headlines as a stale 200 when a later refresh fails, not a 503", async () => {
    jest.useFakeTimers();
    try {
      // First refresh succeeds and populates the last-good snapshot.
      installFetchMock(buildFeedMap());
      const first = await GET();
      expect(first.status).toBe(200);
      expect((await first.json()).articles).toHaveLength(6);

      // Advance past the 5-minute success TTL so the next request re-fetches.
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Now every feed is down.
      installFetchMock(
        Object.fromEntries(NEWS_FEEDS.map((feed) => [feed.url, new Error("network down")])),
      );

      const second = await GET();
      const body = await second.json();

      // Stale-but-usable: the last good articles with a note and a 200, plus a
      // no-store header so clients re-fetch and we retry the feeds soon.
      expect(second.status).toBe(200);
      expect(body.articles).toHaveLength(6);
      expect(body.dataStatus).toBe("stale-fallback");
      expect(body.staleSources).toHaveLength(NEWS_FEEDS.length);
      expect(body.message).toMatch(/last good headlines/i);
      expect(second.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      jest.useRealTimers();
    }
  });

  it("merges a partial refresh with per-feed last-good data without shrinking later fallbacks", async () => {
    jest.useFakeTimers();
    try {
      installFetchMock(buildFeedMap());
      const first = await GET();
      expect(first.status).toBe(200);
      expect((await first.json()).articles).toHaveLength(6);

      jest.advanceTimersByTime(6 * 60 * 1000);
      installFetchMock(buildFeedMap({
        [FEED_URLS.nyt]: makeRssFeed({
          title: "Updated NYT Headline",
          link: "https://www.nytimes.com/2026/04/03/world/updated-story.html",
          description: "Updated NYT summary",
          pubDate: hoursAgo(0.5).toUTCString(),
          category: "World",
        }),
        [FEED_URLS.bbc]: new Error("network down"),
      }));

      const partial = await GET();
      const partialBody = await partial.json();

      expect(partial.status).toBe(200);
      // Five feeds are fresh and the sixth is backfilled, so one flaky feed
      // does not take the page out of the CDN cache.
      expect(partial.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600",
      );
      expect(partialBody.dataStatus).toBe("degraded");
      expect(partialBody.staleSources).toEqual(["BBC"]);
      expect(partialBody.errors).toEqual([
        expect.stringMatching(
          /^BBC: network down \(showing headlines fetched \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC\)$/,
        ),
      ]);
      expect(partialBody.articles).toHaveLength(6);
      expect(partialBody.articles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source: "nyt", title: "Updated NYT Headline" }),
          expect.objectContaining({ source: "bbc", title: "BBC Headline" }),
        ]),
      );

      // Past the 5 minute success lifetime the partial result now gets.
      jest.advanceTimersByTime(6 * 60 * 1000);
      installFetchMock(
        Object.fromEntries(
          NEWS_FEEDS.map((feed) => [feed.url, new Error("network down")]),
        ),
      );

      const outage = await GET();
      const outageBody = await outage.json();

      expect(outage.status).toBe(200);
      expect(outageBody.dataStatus).toBe("stale-fallback");
      expect(outageBody.articles).toHaveLength(6);
      expect(outageBody.articles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source: "nyt", title: "Updated NYT Headline" }),
          expect.objectContaining({ source: "bbc", title: "BBC Headline" }),
        ]),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the public success cache policy when one feed fails without stale fallback", async () => {
    jest.useFakeTimers();
    try {
      // No prior refresh, so the failed feed has no last-good data: the result
      // is degraded (one source missing) but every served article is fresh.
      installFetchMock(buildFeedMap({
        [FEED_URLS.bbc]: new Error("network down"),
      }));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.dataStatus).toBe("degraded");
      expect(body.errors).toEqual(["BBC: network down"]);
      expect(body.staleSources).toBeUndefined();
      // A partial-but-fresh result stays CDN-cacheable. One chronically dead
      // feed must not flip the whole route to no-store.
      expect(response.headers.get("Cache-Control")).toBe(
        "public, s-maxage=300, stale-while-revalidate=600",
      );

      // ...and it keeps the 5-minute success TTL: 31s later (past the error
      // TTL) the cached result is served without a fresh feed fan-out.
      const callsAfterFirstFetch = mockFetch.mock.calls.length;
      jest.advanceTimersByTime(31 * 1000);
      const cached = await GET();
      expect(cached.status).toBe(200);
      expect(mockFetch.mock.calls.length).toBe(callsAfterFirstFetch);

      // Past the success TTL, a fully-failed refresh still opts out of
      // caching (stale-fallback served from last-good data).
      jest.advanceTimersByTime(5 * 60 * 1000);
      installFetchMock(
        Object.fromEntries(
          NEWS_FEEDS.map((feed) => [feed.url, new Error("network down")]),
        ),
      );
      const outage = await GET();
      expect((await outage.json()).dataStatus).toBe("stale-fallback");
      expect(outage.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the newest 30 items of a feed and drops items older than 7 days", async () => {
    // Shaped like the Guardian feed of 2026-09-27, which carried 113 items
    // reaching back to 2019-07-09 against 10 to 30 for the other outlets.
    const recent = Array.from({ length: 35 }, (_, index) => ({
      title: `Guardian story ${index}`,
      link: `https://www.theguardian.com/world/2026/sep/27/story-${index}`,
      pubDate: hoursAgo(index + 1).toUTCString(),
    }));
    installFetchMock(buildFeedMap({
      [FEED_URLS.guardian]: makeRssItems([
        {
          title: "Guardian story from 2019",
          link: "https://www.theguardian.com/info/2019/jul/09/old-story",
          pubDate: "Tue, 09 Jul 2019 08:19:21 GMT",
        },
        {
          title: "Guardian story from 8 days ago",
          link: "https://www.theguardian.com/world/2026/sep/19/older-story",
          pubDate: hoursAgo(8 * 24).toUTCString(),
        },
        // Oldest first, so the cap has to sort and cannot take the first 30.
        ...[...recent].reverse(),
      ]),
    }));

    const response = await GET();
    const body = await response.json();
    const guardianTitles = (body.articles as Array<{ source: string; title: string }>)
      .filter((article) => article.source === "guardian")
      .map((article) => article.title);

    expect(response.status).toBe(200);
    expect(body.errors).toEqual([]);
    expect(guardianTitles).toEqual(recent.slice(0, 30).map((item) => item.title));
    expect(body.articles).toHaveLength(35);
  });

  it("reports a feed whose items are all older than 7 days", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.bbc]: makeRssItems([
        {
          title: "BBC story from 2025",
          link: "https://www.bbc.com/news/articles/old-story",
          pubDate: "Wed, 30 Apr 2025 14:04:28 GMT",
        },
      ]),
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articles).toHaveLength(5);
    expect(body.errors).toEqual(["BBC: returned nothing from the last 7 days"]);
  });

  it("parses The Atlantic Atom feed with markup stripped and entities decoded", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.atlantic]: makeAtomFeed({
        title: "AT&amp;T <em>merger</em> update",
        link: "https://www.theatlantic.com/business/archive/2026/04/sample-story/",
        summary: "Markets <strong>watch</strong> Tom &amp; Jerry",
        updated: hoursAgo(6).toISOString(),
        category: "Business",
      }),
    }));

    const response = await GET();
    const body = await response.json();
    const atlanticArticle = body.articles.find(
      (article: { source: string }) => article.source === "atlantic",
    );

    expect(response.status).toBe(200);
    expect(atlanticArticle).toEqual(
      expect.objectContaining({
        source: "atlantic",
        sourceName: "The Atlantic",
        title: "AT&T merger update",
        description: "Markets watch Tom & Jerry",
        category: "Business",
      }),
    );
  });

  it("treats zero-item 200 responses as degraded feed errors", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.atlantic]:
        '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>The Atlantic</title></feed>',
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articles).toHaveLength(5);
    expect(
      body.articles.find((article: { source: string }) => article.source === "atlantic"),
    ).toBeUndefined();
    expect(body.errors).toContain("The Atlantic: returned no usable entries");
  });

  it("drops malformed links and records the feed as degraded", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.npr]: makeRssFeed({
        title: "NPR Headline",
        link: "/not-absolute",
        description: "NPR summary",
        pubDate: "Fri, 03 Apr 2026 15:30:00 GMT",
        category: "Politics",
      }),
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articles).toHaveLength(5);
    expect(
      body.articles.find((article: { source: string }) => article.source === "npr"),
    ).toBeUndefined();
    expect(body.errors).toContain("NPR: returned no usable entries");
  });

  it("returns partial success when feed failures and degraded feeds are mixed", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.atlantic]:
        '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>The Atlantic</title></feed>',
      [FEED_URLS.bbc]: new Error("network down"),
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    // Degraded without stale fallback stays on the public success cache policy.
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(body.dataStatus).toBe("degraded");
    expect(body.articles).toHaveLength(4);
    expect(body.articles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "nyt", title: "NYT Headline" }),
        expect.objectContaining({ source: "guardian", title: "Guardian Headline" }),
      ]),
    );
    expect(body.errors).toEqual([
      "The Atlantic: returned no usable entries",
      "BBC: network down",
    ]);
  });

  it("maps an aborted feed fetch to a human timeout message", async () => {
    // AbortController fires this shape when FETCH_TIMEOUT_MS is exceeded.
    const abortError = new Error("This operation was aborted");
    abortError.name = "AbortError";
    installFetchMock(buildFeedMap({
      [FEED_URLS.bbc]: abortError,
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.articles).toHaveLength(5);
    expect(
      body.articles.find((article: { source: string }) => article.source === "bbc"),
    ).toBeUndefined();
    expect(body.errors).toContain("BBC: timed out after 8s");
    expect(body.errors).not.toContain("BBC: This operation was aborted");
  });

  it("returns a 503 with a structured message when every feed fails", async () => {
    installFetchMock(
      Object.fromEntries(NEWS_FEEDS.map((feed) => [feed.url, new Error("network down")])),
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.dataStatus).toBe("unavailable");
    expect(body.articles).toEqual([]);
    expect(body.message).toMatch(/No usable headlines came through/i);
    expect(body.errors).toHaveLength(NEWS_FEEDS.length);
  });
});
