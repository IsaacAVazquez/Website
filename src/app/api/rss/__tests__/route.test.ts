/**
 * @jest-environment node
 */
jest.mock("@/lib/blog", () => ({
  getAllBlogPosts: jest.fn(),
}));

import { GET } from "../route";
import { getAllBlogPosts } from "@/lib/blog";

const mockGetAllBlogPosts = getAllBlogPosts as jest.MockedFunction<
  typeof getAllBlogPosts
>;

describe("GET /api/rss", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds RSS items from blog frontmatter", async () => {
    mockGetAllBlogPosts.mockResolvedValue([
      {
        slug: "alpha-post",
        title: "Alpha & Beta",
        excerpt: "Fallback excerpt",
        content: "<p>Alpha content</p>",
        publishedAt: "2026-04-02",
        category: "Testing",
        tags: ["rss"],
        featured: false,
        readingTime: "1 min read",
        author: "Isaac Vazquez",
        seo: {
          description: "Alpha & Beta description",
        },
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(body).toContain("<rss version=\"2.0\"");
    expect(body).toContain("<title>Alpha &amp; Beta</title>");
    expect(body).toContain("<description>Alpha &amp; Beta description</description>");
    expect(body).toContain("<link>https://isaacavazquez.com/writing/alpha-post</link>");
  });

  it("falls back to the post excerpt when no SEO description exists", async () => {
    mockGetAllBlogPosts.mockResolvedValue([
      {
        slug: "excerpt-post",
        title: "Excerpt Post",
        excerpt: "It's all in the excerpt",
        content: "<p>Excerpt content</p>",
        publishedAt: "2026-04-01",
        category: "Testing",
        tags: [],
        featured: false,
        readingTime: "1 min read",
        author: "Isaac Vazquez",
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("<description>It&#039;s all in the excerpt</description>");
  });
});
