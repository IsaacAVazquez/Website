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
    delete process.env.SITE_URL;
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
        wordCount: 0,
        author: "Isaac Vazquez",
        coverImage: "",
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
    expect(body).toContain(
      "<atom:updated>2026-04-02T00:00:00.000Z</atom:updated>"
    );
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
        wordCount: 0,
        author: "Isaac Vazquez",
        coverImage: "",
      },
    ]);

    const response = await GET();
    const body = await response.text();

    expect(body).toContain("<description>It&#039;s all in the excerpt</description>");
  });

  it("filters invalid posts and falls back to the title when no description fields exist", async () => {
    mockGetAllBlogPosts.mockResolvedValue([
      {
        slug: "invalid-title",
        title: "   ",
        excerpt: "Ignored",
        publishedAt: "2026-04-02",
      },
      {
        slug: "invalid-date",
        title: "Invalid Date",
        excerpt: "Ignored",
        publishedAt: "not-a-date",
      },
      {
        slug: "title-fallback",
        title: "Title Fallback",
        excerpt: "",
        publishedAt: "2026-04-02",
      },
    ] as unknown as Awaited<ReturnType<typeof getAllBlogPosts>>);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("<title>Title Fallback</title>");
    expect(body).toContain("<description>Title Fallback</description>");
    expect(body).not.toContain("invalid-title");
    expect(body).not.toContain("invalid-date");
    expect(body.match(/<item>/g)).toHaveLength(1);
  });

  it("uses the most recent updatedAt value for lastBuildDate and trims custom SITE_URL values", async () => {
    process.env.SITE_URL = "https://preview.isaacavazquez.com/";
    mockGetAllBlogPosts.mockResolvedValue([
      {
        slug: "newer-published",
        title: "Newer Published",
        excerpt: "Latest by publish date",
        content: "<p>Latest by publish date</p>",
        publishedAt: "2026-04-02T00:00:00.000Z",
      },
      {
        slug: "older-but-updated",
        title: "Older but updated",
        excerpt: "Updated later",
        content: "<p>Updated later</p>",
        publishedAt: "2026-03-17T00:00:00.000Z",
        updatedAt: "2026-04-03T12:34:56.000Z",
      },
    ] as unknown as Awaited<ReturnType<typeof getAllBlogPosts>>);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("<lastBuildDate>Fri, 03 Apr 2026 12:34:56 GMT</lastBuildDate>");
    expect(body).toContain("<link>https://preview.isaacavazquez.com</link>");
    expect(body).toContain(
      "<atom:link href=\"https://preview.isaacavazquez.com/api/rss\" rel=\"self\" type=\"application/rss+xml\"/>"
    );
    expect(body).toContain(
      "<guid isPermaLink=\"true\">https://preview.isaacavazquez.com/writing/older-but-updated</guid>"
    );
    expect(body).toContain(
      "<atom:updated>2026-04-03T12:34:56.000Z</atom:updated>"
    );
  });
});
