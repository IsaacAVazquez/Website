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

function buildFeedMap(overrides: Partial<Record<string, string | Error>> = {}) {
  return {
    [FEED_URLS.atlantic]: makeAtomFeed({
      title: "Atlantic <em>Headline</em>",
      link: "https://www.theatlantic.com/technology/2026/04/sample-story/",
      summary: "Atlantic <strong>summary</strong>",
      content: "<p>Atlantic content fallback</p>",
      published: "2026-04-03T14:15:00-04:00",
      updated: "2026-04-03T14:20:09-04:00",
      category: "Technology",
    }),
    [FEED_URLS.nyt]: makeRssFeed({
      title: "NYT Headline",
      link: "https://www.nytimes.com/2026/04/03/world/sample-story.html",
      description: "NYT summary",
      pubDate: "Fri, 03 Apr 2026 18:30:00 GMT",
      category: "World",
    }),
    [FEED_URLS.guardian]: makeRssFeed({
      title: "Guardian Headline",
      link: "https://www.theguardian.com/world/2026/apr/03/sample-story",
      description: "Guardian summary",
      pubDate: "Fri, 03 Apr 2026 17:30:00 GMT",
      category: "World",
    }),
    [FEED_URLS.bbc]: makeRssFeed({
      title: "BBC Headline",
      link: "https://www.bbc.com/news/sample-story",
      description: "BBC summary",
      pubDate: "Fri, 03 Apr 2026 16:30:00 GMT",
      category: "UK",
    }),
    [FEED_URLS.npr]: makeRssFeed({
      title: "NPR Headline",
      link: "https://www.npr.org/2026/04/03/sample-story",
      description: "NPR summary",
      pubDate: "Fri, 03 Apr 2026 15:30:00 GMT",
      category: "Politics",
    }),
    [FEED_URLS.aljazeera]: makeRssFeed({
      title: "Al Jazeera Headline",
      link: "https://www.aljazeera.com/news/2026/4/3/sample-story",
      description: "Al Jazeera summary",
      pubDate: "Fri, 03 Apr 2026 14:30:00 GMT",
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
      expect(body.message).toMatch(/last good headlines/i);
      expect(second.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      jest.useRealTimers();
    }
  });

  it("parses The Atlantic Atom feed with markup stripped and entities decoded", async () => {
    installFetchMock(buildFeedMap({
      [FEED_URLS.atlantic]: makeAtomFeed({
        title: "AT&amp;T <em>merger</em> update",
        link: "https://www.theatlantic.com/business/archive/2026/04/sample-story/",
        summary: "Markets <strong>watch</strong> Tom &amp; Jerry",
        updated: "2026-04-03T14:20:09-04:00",
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
    expect(body.articles).toEqual([]);
    expect(body.message).toMatch(/No usable headlines came through/i);
    expect(body.errors).toHaveLength(NEWS_FEEDS.length);
  });
});

