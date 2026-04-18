jest.mock("@/lib/blog", () => ({
  getBlogPostPreviewBySlug: jest.fn(),
}));

jest.mock("@/lib/og", () => ({
  createEditorialOgImage: jest.fn(() => ({ kind: "image-response" })),
}));

import { getBlogPostPreviewBySlug } from "@/lib/blog";
import { createEditorialOgImage } from "@/lib/og";
import Image from "../opengraph-image";

const mockGetBlogPostPreviewBySlug =
  getBlogPostPreviewBySlug as jest.MockedFunction<typeof getBlogPostPreviewBySlug>;

const mockCreateEditorialOgImage =
  createEditorialOgImage as jest.MockedFunction<typeof createEditorialOgImage>;

describe("Writing article opengraph image", () => {
  beforeEach(() => {
    mockGetBlogPostPreviewBySlug.mockReset();
    mockCreateEditorialOgImage.mockClear();
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
      featured: false,
      readingTime: "4 min read",
      wordCount: 800,
      author: "Isaac Vazquez",
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

  it("falls back to the archive bucket label when a post is not clustered", async () => {
    mockGetBlogPostPreviewBySlug.mockReturnValue({
      slug: "archive-post",
      title: "Archive Post",
      excerpt: "Archive excerpt",
      publishedAt: "2026-04-07",
      updatedAt: "2026-04-09",
      category: "Technology",
      tags: ["Technology", "AI"],
      featured: false,
      readingTime: "4 min read",
      wordCount: 800,
      author: "Isaac Vazquez",
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
