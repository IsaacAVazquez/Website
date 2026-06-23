/**
 * @jest-environment node
 */
jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";
import { getAllBlogPostPreviews } from "@/lib/blog";

const mockGetAllBlogPostPreviews =
  getAllBlogPostPreviews as jest.MockedFunction<typeof getAllBlogPostPreviews>;

function makeRequest(queryString: string): NextRequest {
  return new NextRequest(
    `https://isaacavazquez.com/api/search${queryString}`
  );
}

const SAMPLE_PREVIEW = {
  slug: "quantum-search-internals",
  title: "Quantum Search Internals",
  excerpt: "A deep dive into quantum search relevance ranking.",
  category: "Engineering",
  tags: ["quantum", "search"],
  publishedAt: "2026-06-01",
} as unknown as ReturnType<typeof getAllBlogPostPreviews>[number];

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    // Default: one deterministic blog preview in the corpus.
    mockGetAllBlogPostPreviews.mockReturnValue([SAMPLE_PREVIEW]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    // Use an old publish date so the recency boost (within 30 days) doesn't
    // contribute a baseline score for an otherwise non-matching entry.
    mockGetAllBlogPostPreviews.mockReturnValue([
      {
        ...(SAMPLE_PREVIEW as Record<string, unknown>),
        publishedAt: "2020-01-01",
      },
    ] as unknown as ReturnType<typeof getAllBlogPostPreviews>);

    const response = await GET(
      makeRequest("?q=zzqxnomatchtoken1234567890")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.query).toBe("zzqxnomatchtoken1234567890");
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
    })) as unknown as ReturnType<typeof getAllBlogPostPreviews>;
    mockGetAllBlogPostPreviews.mockReturnValue(previews);

    const response = await GET(makeRequest("?q=quantum&limit=3"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.length).toBe(3);
    // total reflects all matches before the limit slice.
    expect(body.total).toBeGreaterThanOrEqual(10);
  });

  it("degrades gracefully when the blog corpus loader throws", async () => {
    mockGetAllBlogPostPreviews.mockImplementation(() => {
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
