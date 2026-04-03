/**
 * @jest-environment node
 */
import { GET } from "../route";

const FEED_URLS = {
  atlantic: "https://www.theatlantic.com/feed/all/",
  nyt: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  guardian: "https://www.theguardian.com/world/rss",
  bbc: "https://feeds.bbci.co.uk/news/rss.xml",
  npr: "https://feeds.npr.org/1001/rss.xml",
  wapo: "https://feeds.washingtonpost.com/rss/world",
} as const;

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
        <link rel="alternate" href="${link}"></link>
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
    [FEED_URLS.wapo]: makeRssFeed({
      title: "Washington Post Headline",
      link: "https://www.washingtonpost.com/world/2026/04/03/sample-story/",
      description: "Washington Post summary",
      pubDate: "Fri, 03 Apr 2026 14:30:00 GMT",
      category: "World",
    }),
    ...overrides,
  };
}

function installFetchMock(feedMap: Record<string, string | Error>) {
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

  it("still parses RSS feeds from existing outlets", async () => {
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
  });

  it("parses The Atlantic Atom feed into the shared article shape", async () => {
    installFetchMock(buildFeedMap());

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
        title: "Atlantic Headline",
        link: "https://www.theatlantic.com/technology/2026/04/sample-story/",
        description: "Atlantic summary",
        category: "Technology",
        pubDate: "2026-04-03T14:15:00-04:00",
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
    expect(body.articles.find((article: { source: string }) => article.source === "atlantic")).toBeUndefined();
    expect(body.errors).toContain("The Atlantic: returned no usable entries");
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
});
