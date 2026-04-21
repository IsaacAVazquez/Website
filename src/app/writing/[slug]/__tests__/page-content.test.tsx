import { render, screen } from "@testing-library/react";

jest.mock("@/components/AIStructuredData", () => ({
  AIStructuredData: () => null,
}));

jest.mock("@/components/ui/AuthorBio", () => ({
  AuthorBio: () => <div data-testid="author-bio" />,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock("@/lib/blog", () => ({
  getAllBlogPostPreviews: jest.fn(() => []),
  getBlogPostBySlug: jest.fn(),
  getRelatedBlogPosts: jest.fn(async () => []),
}));

import { getBlogPostBySlug } from "@/lib/blog";
import BlogPostPage from "../page";

const mockGetBlogPostBySlug = getBlogPostBySlug as jest.MockedFunction<
  typeof getBlogPostBySlug
>;

describe("Writing article page", () => {
  beforeEach(() => {
    mockGetBlogPostBySlug.mockReset();
  });

  it("renders the updated cluster label in the article header", async () => {
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

    const page = await BlogPostPage({
      params: Promise.resolve({ slug: "test-post" }),
    });

    render(page);

    expect(screen.getByText("PM Workflows")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Test Post" })).toBeVisible();
  });

  it("falls back to the archive bucket label when a post is not in a lead pillar", async () => {
    mockGetBlogPostBySlug.mockResolvedValue({
      slug: "archive-post",
      title: "Archive Post",
      excerpt: "Archive excerpt",
      content: "<p>Body</p>",
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
      seo: {
        title: "Archive Post SEO",
        description: "Archive post SEO description",
      },
    });

    const page = await BlogPostPage({
      params: Promise.resolve({ slug: "archive-post" }),
    });

    render(page);

    expect(screen.getByText("Signals & Commentary")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Archive Post" })).toBeVisible();
  });
});
