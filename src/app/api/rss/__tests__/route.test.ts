/**
 * @jest-environment node
 */
jest.mock("@/lib/blog", () => ({
  getBlogFeedEntries: jest.fn(),
}));

import { GET, dynamic } from "../route";
import { getBlogFeedEntries } from "@/lib/blog";

const mockGetBlogFeedEntries = getBlogFeedEntries as jest.MockedFunction<
  typeof getBlogFeedEntries
>;

describe("GET /api/rss", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SITE_URL;
  });

  // The feed changes only when a post does, which takes a deploy.
  it("is built once per deploy", () => {
    expect(dynamic).toBe("force-static");
  });

  it("builds RSS items from blog frontmatter", async () => {
    mockGetBlogFeedEntries.mockReturnValue([
      {
        slug: "alpha-post",
        title: "Alpha & Beta",
        excerpt: "Fallback excerpt",
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
    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    expect(body).toContain("<rss version=\"2.0\"");
    expect(body).toContain("<title>Alpha &amp; Beta</title>");
    expect(body).toContain("<description>Alpha &amp; Beta description</description>");
    expect(body).toContain("<link>https://isaacvazquez.com/writing/alpha-post</link>");
    expect(body).toContain(
      "<atom:updated>2026-04-02T00:00:00.000Z</atom:updated>"
    );
  });

  it("falls back to the post excerpt when no SEO description exists", async () => {
    mockGetBlogFeedEntries.mockReturnValue([
      {
        slug: "excerpt-post",
        title: "Excerpt Post",
        excerpt: "It's all in the excerpt",
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
    mockGetBlogFeedEntries.mockReturnValue([
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
    ] as unknown as ReturnType<typeof getBlogFeedEntries>);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("<title>Title Fallback</title>");
    expect(body).toContain("<description>Title Fallback</description>");
    expect(body).not.toContain("invalid-date");
    expect(body.match(/<item>/g)).toHaveLength(1);
  });

  it("uses the most recent updatedAt value for lastBuildDate and trims custom SITE_URL values", async () => {
    process.env.SITE_URL = "https://preview.isaacvazquez.com/";
    mockGetBlogFeedEntries.mockReturnValue([
      {
        slug: "newer-published",
        title: "Newer Published",
        excerpt: "Latest by publish date",
        publishedAt: "2026-04-02T00:00:00.000Z",
      },
      {
        slug: "older-but-updated",
        title: "Older but updated",
        excerpt: "Updated later",
        publishedAt: "2026-03-17T00:00:00.000Z",
        updatedAt: "2026-04-03T12:34:56.000Z",
      },
    ] as unknown as ReturnType<typeof getBlogFeedEntries>);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("<lastBuildDate>Fri, 03 Apr 2026 12:34:56 GMT</lastBuildDate>");
    expect(body).toContain("<link>https://preview.isaacvazquez.com</link>");
    expect(body).toContain(
      "<atom:link href=\"https://preview.isaacvazquez.com/api/rss\" rel=\"self\" type=\"application/rss+xml\"/>"
    );
    expect(body).toContain(
      "<guid isPermaLink=\"true\">https://preview.isaacvazquez.com/writing/older-but-updated</guid>"
    );
    expect(body).toContain(
      "<atom:updated>2026-04-03T12:34:56.000Z</atom:updated>"
    );
  });
});
