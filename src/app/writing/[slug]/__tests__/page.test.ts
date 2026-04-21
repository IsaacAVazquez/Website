jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: jest.fn(() => []),
  getBlogPostBySlug: jest.fn(),
  getRelatedBlogPosts: jest.fn(),
}));

import { getBlogPostBySlug } from "@/lib/blog";
import { generateMetadata } from "../page";

const mockGetBlogPostBySlug = getBlogPostBySlug as jest.MockedFunction<typeof getBlogPostBySlug>;

describe("Writing article metadata", () => {
  beforeEach(() => {
    mockGetBlogPostBySlug.mockReset();
  });

  it("uses the article-specific cover image for open graph and twitter cards", async () => {
    mockGetBlogPostBySlug.mockResolvedValue({
      slug: "test-post",
      title: "Test Post",
      excerpt: "Test excerpt",
      content: "<p>Body</p>",
      publishedAt: "2026-04-07",
      updatedAt: "2026-04-09",
      category: "Product Management",
      tags: ["Product Management", "AI"],
      featured: false,
      readingTime: "4 min read",
      wordCount: 800,
      author: "Isaac Vazquez",
      coverImage: "/writing/test-post/opengraph-image",
      cluster: "PM Workflows",
      cta: undefined,
      seo: {
        title: "Test Post SEO",
        description: "Test post SEO description",
      },
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "test-post" }),
    });

    const openGraph = metadata.openGraph as { images: Array<{ url: string }> };
    const twitter = metadata.twitter as { images: string[] };

    expect(openGraph.images[0].url).toBe("https://isaacavazquez.com/writing/test-post/opengraph-image");
    expect(twitter.images[0]).toBe("https://isaacavazquez.com/writing/test-post/opengraph-image");
  });
});
