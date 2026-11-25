jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: jest.fn(),
  getBlogPostPreviewBySlug: jest.fn(),
}));

jest.mock("@/lib/og", () => ({
  createEditorialOgImage: jest.fn(() => ({ kind: "image-response" })),
}));

import { getAllBlogPostPreviews, getBlogPostPreviewBySlug } from "@/lib/blog";
import { createEditorialOgImage } from "@/lib/og";
import Image, * as articleImage from "../opengraph-image";

const mockGetAllBlogPostPreviews =
  getAllBlogPostPreviews as jest.MockedFunction<typeof getAllBlogPostPreviews>;

const mockGetBlogPostPreviewBySlug =
  getBlogPostPreviewBySlug as jest.MockedFunction<typeof getBlogPostPreviewBySlug>;

const mockCreateEditorialOgImage =
  createEditorialOgImage as jest.MockedFunction<typeof createEditorialOgImage>;

describe("Writing article opengraph image", () => {
  beforeEach(() => {
    mockGetAllBlogPostPreviews.mockReset();
    mockGetBlogPostPreviewBySlug.mockReset();
    mockCreateEditorialOgImage.mockClear();
  });

  // Without static params the route is dynamic, and every request for an
  // article's share image draws it again.
  it("lists one image per published article for the build to draw", async () => {
    mockGetAllBlogPostPreviews.mockReturnValue([
      { slug: "first-post" },
      { slug: "second-post" },
    ] as ReturnType<typeof getAllBlogPostPreviews>);

    const { generateStaticParams } = articleImage as unknown as {
      generateStaticParams?: () => unknown;
    };

    expect(typeof generateStaticParams).toBe("function");
    expect(await generateStaticParams?.()).toEqual([
      { slug: "first-post" },
      { slug: "second-post" },
    ]);
  });

  it("uses the updated cluster label as the eyebrow", async () => {
    mockGetBlogPostPreviewBySlug.mockReturnValue({
      slug: "test-post",
      title: "Test Post",
      excerpt: "Test excerpt",
      publishedAt: "2026-04-07",
      updatedAt: "2026-04-09",
      category: "Product Management",
      tags: ["Product Management", "AI"],
      readingTime: "4 min read",
      wordCount: 800,
      coverImage: "/writing/test-post/opengraph-image",
      cluster: "PM Workflows",
      cta: undefined,
    });

    await Image({
      params: Promise.resolve({ slug: "test-post" }),
    });

    expect(mockCreateEditorialOgImage).toHaveBeenCalledWith(
      expect.objectContaining({
        eyebrow: "PM Workflows",
      })
    );
  });

  // The article page answers 404 for a slug with no post, and so does its card.
  it("draws nothing for a slug with no article", async () => {
    mockGetBlogPostPreviewBySlug.mockReturnValue(null);

    await expect(
      Image({ params: Promise.resolve({ slug: "no-such-post" }) })
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(mockCreateEditorialOgImage).not.toHaveBeenCalled();
  });

  it("falls back to the archive bucket label when a post is not clustered", async () => {
    mockGetBlogPostPreviewBySlug.mockReturnValue({
      slug: "archive-post",
      title: "Archive Post",
      excerpt: "Archive excerpt",
      publishedAt: "2026-04-07",
      updatedAt: "2026-04-09",
      category: "Technology",
      tags: ["Technology", "AI"],
      readingTime: "4 min read",
      wordCount: 800,
      coverImage: "/writing/archive-post/opengraph-image",
      archiveBucket: "Signals & Commentary",
      cta: undefined,
    });

    await Image({
      params: Promise.resolve({ slug: "archive-post" }),
    });

    expect(mockCreateEditorialOgImage).toHaveBeenCalledWith(
      expect.objectContaining({
        eyebrow: "Signals & Commentary",
      })
    );
  });
});
