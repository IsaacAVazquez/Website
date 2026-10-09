/**
 * @jest-environment node
 */
jest.mock("@/lib/blog", () => ({
  getBlogPostSearchEntries: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";
import { getBlogPostSearchEntries } from "@/lib/blog";
import { DASHBOARD_ROUTES } from "@/constants/catalog97Nav";

const mockGetBlogPostSearchEntries =
  getBlogPostSearchEntries as jest.MockedFunction<typeof getBlogPostSearchEntries>;

function makeRequest(queryString: string): NextRequest {
  return new NextRequest(
    `https://isaacvazquez.com/api/search${queryString}`
  );
}

const SAMPLE_PREVIEW = {
  slug: "quantum-search-internals",
  searchText: "A body-only reference to photosynthesis.",
  title: "Quantum Search Internals",
  excerpt: "A deep dive into quantum search relevance ranking.",
  category: "Engineering",
  tags: ["quantum", "search"],
  publishedAt: "2026-06-01",
} as unknown as ReturnType<typeof getBlogPostSearchEntries>[number];

// A publishedAt in the content/blog frontmatter format, dated relative to the
// run so the 30-day recency window never drifts away from the test.
function publishedDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    // Default: one deterministic blog preview in the corpus.
    mockGetBlogPostSearchEntries.mockReturnValue([SAMPLE_PREVIEW]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("finds article body text and keeps repeated body matches below title matches", async () => {
    const bodyMatch = await GET(makeRequest("?q=photosynthesis&type=post"));
    expect((await bodyMatch.json()).results[0].id).toBe("post-quantum-search-internals");
    mockGetBlogPostSearchEntries.mockReturnValue([
      { ...SAMPLE_PREVIEW, searchText: "photosynthesis ".repeat(200) },
      { ...SAMPLE_PREVIEW, slug: "photosynthesis", title: "Photosynthesis", excerpt: "Plant growth", tags: [], searchText: "Short explanation" },
    ]);
    const ranked = await GET(makeRequest("?q=photosynthesis&type=post"));
    const results = (await ranked.json()).results;
    expect(results[0].id).toBe("post-photosynthesis");
    expect(results[1]).not.toHaveProperty("searchText");
    expect(results[1]).not.toHaveProperty("content");
  });

  it("includes every registered tool once", async () => {
    const response = await GET(makeRequest("?type=project&limit=100"));
    const urls = (await response.json()).results.map((item: { url: string }) => item.url);
    for (const url of DASHBOARD_ROUTES) expect(urls).toContain(url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("returns matching results with the documented shape and cache headers", async () => {
    const response = await GET(makeRequest("?q=quantum"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, stale-while-revalidate=86400"
    );

    // Response envelope contract.
    expect(body).toMatchObject({
      query: "quantum",
      filters: { type: "all", category: "all" },
    });
    expect(Array.isArray(body.results)).toBe(true);
    expect(typeof body.total).toBe("number");
    expect(body.total).toBe(body.results.length);

    // The unique blog post should be the relevant match.
    const slugs = body.results.map((r: { id: string }) => r.id);
    expect(slugs).toContain("post-quantum-search-internals");

    const match = body.results.find(
      (r: { id: string }) => r.id === "post-quantum-search-internals"
    );
    expect(match).toMatchObject({
      title: "Quantum Search Internals",
      url: "/writing/quantum-search-internals",
      type: "post",
    });
    expect(typeof match.relevanceScore).toBe("number");
    expect(match.relevanceScore).toBeGreaterThan(0);
    // Results are sorted by descending relevance.
    const scores = body.results.map(
      (r: { relevanceScore: number }) => r.relevanceScore
    );
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("returns the full corpus sorted (not a 400) when the query is missing", async () => {
    const response = await GET(makeRequest(""));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.query).toBe("");
    expect(body.results.length).toBeGreaterThan(0);
    // No-query path returns everything (capped by the default limit of 50),
    // and never assigns a relevance score.
    expect(body.results.length).toBeLessThanOrEqual(50);
    expect(body.results[0].relevanceScore).toBeUndefined();
    // Corpus includes the curated static page entries even with no query.
    const ids = body.results.map((r: { id: string }) => r.id);
    expect(ids).toContain("page-about");
  });

  it("returns an empty result set for a query that matches nothing", async () => {
    // An old publish date keeps this case clear of the recency bonus, which
    // the next test covers.
    mockGetBlogPostSearchEntries.mockReturnValue([
      {
        ...SAMPLE_PREVIEW,
        publishedAt: "2020-01-01",
      },
    ]);

    const response = await GET(
      makeRequest("?q=zzqxnomatchtoken1234567890")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.query).toBe("zzqxnomatchtoken1234567890");
  });

  it("returns no results for a non-matching query when the corpus holds a recent post", async () => {
    // A post published in the last 30 days must not score on its date alone.
    mockGetBlogPostSearchEntries.mockReturnValue([
      {
        ...SAMPLE_PREVIEW,
        publishedAt: publishedDaysAgo(3),
      },
    ]);

    const response = await GET(makeRequest("?q=zzzzqq"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("ranks a recent post above an older post that matches equally", async () => {
    // The titles are chosen so the alphabetical tiebreak would put the older
    // post first, which leaves the recency bonus as the only reason the recent
    // one leads.
    mockGetBlogPostSearchEntries.mockReturnValue([
      {
        ...SAMPLE_PREVIEW,
        slug: "quantum-notes-older",
        title: "Quantum Notes A",
        publishedAt: "2020-01-01",
      },
      {
        ...SAMPLE_PREVIEW,
        slug: "quantum-notes-recent",
        title: "Quantum Notes B",
        publishedAt: publishedDaysAgo(3),
      },
    ]);

    const response = await GET(makeRequest("?q=quantum&type=post"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.map((r: { id: string }) => r.id)).toEqual([
      "post-quantum-notes-recent",
      "post-quantum-notes-older",
    ]);
    const [recent, older] = body.results;
    expect(recent.relevanceScore).toBeGreaterThan(older.relevanceScore);
  });

  it("honors the type filter and reflects it in the response filters", async () => {
    const response = await GET(makeRequest("?q=quantum&type=post"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters.type).toBe("post");
    // Only post-type content should survive the filter.
    for (const result of body.results) {
      expect(result.type).toBe("post");
    }
    expect(
      body.results.some(
        (r: { id: string }) => r.id === "post-quantum-search-internals"
      )
    ).toBe(true);
  });

  it("filters by an exact (case-insensitive) category and echoes it in filters", async () => {
    // 'Site' is a curated static-page category, present regardless of the blog mock.
    const response = await GET(makeRequest("?category=site"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filters.category).toBe("site");
    expect(body.results.length).toBeGreaterThan(0);
    for (const result of body.results) {
      expect(String(result.category).toLowerCase()).toBe("site");
    }
  });

  it("returns nothing for a category that is not present in the corpus", async () => {
    const response = await GET(makeRequest("?category=NotARealCategory"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("clamps the limit parameter into the 1..100 range", async () => {
    // Seed the corpus with many matching posts so the limit is what caps output.
    const previews = Array.from({ length: 10 }, (_, i) => ({
      slug: `clamp-post-${i}`,
      title: `Clamp Post ${i} quantum`,
      excerpt: "quantum relevance",
      category: "Engineering",
      tags: ["quantum"],
      publishedAt: "2026-06-01",
    })) as unknown as ReturnType<typeof getBlogPostSearchEntries>;
    mockGetBlogPostSearchEntries.mockReturnValue(previews);

    const response = await GET(makeRequest("?q=quantum&limit=3"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.length).toBe(3);
    // total reflects all matches before the limit slice.
    expect(body.total).toBeGreaterThanOrEqual(10);
  });

  it("indexes a case study with a live tool once, at the tool's URL", async () => {
    const response = await GET(
      makeRequest("?q=Fantasy%20Football%20Analytics%20Platform")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    const matches = body.results.filter(
      (r: { title: string }) => r.title === "Fantasy Football Analytics Platform"
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].url).toBe("/fantasy-football");
    expect(matches[0].id).toBe("project-case-fantasy-football-analytics");
  });

  it("finds a dashboard by its case study title, categorized from toolCategories", async () => {
    const response = await GET(makeRequest("?q=NFL%20Pulse"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results[0]).toMatchObject({
      title: "NFL Pulse",
      url: "/nfl",
      type: "project",
      category: "Sports",
    });
  });

  it("indexes the best ball rankings and draft assistant as a distinct page", async () => {
    const response = await GET(makeRequest("?q=best%20ball&type=project"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "page-fantasy-football-best-ball",
          title: "Best Ball Rankings and Draft Assistant",
          url: "/fantasy-football/best-ball",
          type: "project",
          category: "Sports",
        }),
      ])
    );
  });

  it.each([
    ["Dixon-Coles", "/score-pools"],
    ["BART", "/bay-area-transit"],
    ["EPL", "/premier-league"],
  ])("matches the curated keyword %s to %s", async (query, url) => {
    const response = await GET(makeRequest(`?q=${encodeURIComponent(query)}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.map((result: { url: string }) => result.url)).toContain(url);
  });

  it("indexes the mock draft simulator as a distinct page", async () => {
    const response = await GET(
      makeRequest("?q=mock%20draft%20simulator&type=project")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "page-fantasy-football-mock-draft",
          title: "Fantasy Football Mock Draft Simulator",
          url: "/fantasy-football/mock-draft",
          type: "project",
          category: "Sports",
        }),
      ])
    );
  });

  it("indexes the preseason trade calculator as a distinct page", async () => {
    const response = await GET(
      makeRequest("?q=fantasy%20trade%20calculator&type=project")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "page-fantasy-football-trade-calculator",
          title: "Fantasy Football Trade Calculator",
          url: "/fantasy-football/trade-calculator",
          type: "project",
          category: "Sports",
          excerpt:
            "A preseason one-QB redraft estimate using expert consensus, mock-draft ADP, and league settings.",
        }),
      ])
    );
  });

  describe("hidden answers", () => {
    const ids = (body: { results: { id: string }[] }) =>
      body.results.map((r) => r.id);

    it("puts the hand-written answer on top for a matching query", async () => {
      const response = await GET(makeRequest("?q=monet"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.results[0]).toMatchObject({
        id: "answer-monet",
        url: "/",
        type: "page",
      });
      expect(body.total).toBe(body.results.length);
    });

    it("matches regardless of case, spacing, and punctuation", async () => {
      for (const q of ["  KONAMI Code ", "Cheat-Code", "Easter Eggs?", "HIRE isaac"]) {
        const response = await GET(makeRequest(`?q=${encodeURIComponent(q)}`));
        const body = await response.json();
        expect(body.results[0].id).toMatch(/^answer-/);
      }
    });

    it.each([
      ["darkroom", "answer-darkroom", "/"],
      ["Safelight", "answer-darkroom", "/"],
      ["rubber stamp", "answer-stamp", "/"],
      ["night shift", "answer-night-shift", "/"],
      ["Contra", "answer-thirty-lives", "/arcade"],
      ["30 lives", "answer-thirty-lives", "/arcade"],
      ["teapot", "answer-teapot", "/teapot"],
      ["418", "answer-teapot", "/teapot"],
      ["I'm a teapot", "answer-teapot", "/teapot"],
      ["humans.txt", "answer-colophon", "/humans.txt"],
      ["colophon", "answer-colophon", "/humans.txt"],
    ])("answers %s with the hint for that easter egg", async (q, id, url) => {
      const response = await GET(makeRequest(`?q=${encodeURIComponent(q)}`));
      const body = await response.json();

      expect(body.results[0]).toMatchObject({ id, url, type: "page" });
    });

    it("never shows for unrelated or partial queries, or filtered searches", async () => {
      for (const qs of [
        "?q=monetize",
        "?q=monet%20water",
        "?q=easter",
        "?q=monet&type=post",
        "?q=teapots",
        "?q=night",
        "?q=stamped",
        "?q=colophon&type=post",
      ]) {
        const response = await GET(makeRequest(qs));
        const body = await response.json();
        expect(ids(body).some((id) => id.startsWith("answer-"))).toBe(false);
      }
    });

    it("does not show the same URL twice alongside the answer", async () => {
      const response = await GET(makeRequest("?q=hire%20isaac"));
      const body = await response.json();
      const contactHits = body.results.filter(
        (r: { url: string }) => r.url === "/contact"
      );
      expect(contactHits).toHaveLength(1);
      expect(contactHits[0].id).toBe("answer-hire");
    });

    it("leaves resume to the real resume page", async () => {
      const response = await GET(makeRequest("?q=resume"));
      const body = await response.json();
      expect(body.results[0].id).toBe("page-resume");
    });
  });

  it("degrades gracefully when the blog corpus loader throws", async () => {
    mockGetBlogPostSearchEntries.mockImplementation(() => {
      throw new Error("boom");
    });

    // The route wraps the blog load in its own try/catch (logs the failure)
    // and still builds the rest of the corpus from the curated static pages,
    // so a thrown blog error alone does not surface a 500 — it just drops the
    // blog entries from the results.
    const response = await GET(makeRequest("?q=quantum"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.results)).toBe(true);
  });
});

describe("GET /api/search corpus", () => {
  beforeEach(() => {
    mockGetBlogPostSearchEntries.mockReturnValue([]);
  });

  it("never returns the same URL twice and never a case study URL that redirects", async () => {
    // A case study with a live tool redirects from /portfolio/<slug> to the
    // tool, so "frontier" once returned the tool under two titles.
    for (const query of ["frontier", "food", "fantasy", "tracker"]) {
      const response = await GET(makeRequest(`?q=${query}&limit=50`));
      const body = await response.json();
      const urls = body.results.map((r: { url: string }) => r.url);

      expect(new Set(urls).size).toBe(urls.length);
    }

    const response = await GET(makeRequest("?q=frontier&limit=50"));
    const body = await response.json();
    const urls = body.results.map((r: { url: string }) => r.url);
    expect(urls).toContain("/frontier-models");
    expect(urls).not.toContain("/portfolio/frontier-models");
  });

  it("indexes the routes that were missing", async () => {
    const expected = [
      ["dashboards", "/dashboards"],
      ["weekly rankings", "/fantasy-football/weekly"],
      ["waiver", "/fantasy-football/waivers"],
      ["draft assistant", "/fantasy-football/draft-tracker"],
      ["best ball draft assistant", "/fantasy-football/best-ball/draft-tracker"],
      ["score pools tracker", "/score-pools/tracker"],
    ];
    for (const [query, url] of expected) {
      const response = await GET(makeRequest(`?q=${encodeURIComponent(query)}&limit=50`));
      const body = await response.json();
      expect([query, body.results.map((r: { url: string }) => r.url)]).toEqual([
        query,
        expect.arrayContaining([url]),
      ]);
    }
  });
});


it("does not treat inherited object properties as hidden search answers", async () => {
  const response = await GET(makeRequest("?q=constructor"));
  const body = await response.json();
  expect(response.status).toBe(200);
  for (const result of body.results) {
    expect(result).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      excerpt: expect.any(String),
      url: expect.any(String),
      type: expect.any(String),
    });
  }
});
