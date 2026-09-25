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

import { getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blog";
import BlogPostPage from "../page";

const mockGetBlogPostBySlug = getBlogPostBySlug as jest.MockedFunction<
  typeof getBlogPostBySlug
>;
const mockGetRelatedBlogPosts = getRelatedBlogPosts as jest.MockedFunction<
  typeof getRelatedBlogPosts
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
      coverImage: "/images/writing/covers/test-post.jpg",
      coverImageAlt: "Custom cover image alt",
      coverImageCredit: "Test Photographer, CC BY 4.0 via Wikimedia Commons",
      coverImageCreditUrl: "https://commons.wikimedia.org/wiki/File:Test.jpg",
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

    expect(screen.getAllByRole("link", { name: "PM Workflows" })).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 1, name: "Test Post" })).toBeVisible();
    expect(screen.getByText("Apr 9, 2026")).toBeVisible();
    expect(screen.getByRole("img", { name: "Custom cover image alt" })).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Test Photographer, CC BY 4.0 via Wikimedia Commons",
      })
    ).toHaveAttribute("href", "https://commons.wikimedia.org/wiki/File:Test.jpg");
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

    expect(screen.getAllByRole("link", { name: "Signals & Commentary" })).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 1, name: "Archive Post" })).toBeVisible();
  });

  it("puts the title and body in one article, apart from the related posts", async () => {
    const post = {
      slug: "test-post",
      title: "Test Post",
      excerpt: "Test excerpt",
      content: "<p>Body</p>",
      publishedAt: "2026-04-07",
      category: "Product Management",
      tags: ["Product Management"],
      featured: false,
      readingTime: "4 min read",
      wordCount: 800,
      author: "Isaac Vazquez",
      coverImage: "/writing/test-post/opengraph-image",
      cta: undefined,
    };
    mockGetBlogPostBySlug.mockResolvedValue(post);
    mockGetRelatedBlogPosts.mockResolvedValueOnce([
      { ...post, slug: "other-post", title: "Other Post", content: "<p>Other</p>" },
    ]);

    render(await BlogPostPage({ params: Promise.resolve({ slug: "test-post" }) }));

    // Extractors take the page's <article> as its main content, so the post
    // has to live in one and the related rows have to stay out of it.
    const article = screen
      .getByRole("heading", { level: 1, name: "Test Post" })
      .closest("article");
    expect(article).toContainElement(screen.getByText("Body"));
    expect(article).not.toContainElement(
      screen.getByRole("link", { name: "Other Post" })
    );
  });
});
