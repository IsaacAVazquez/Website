jest.mock("remark", () => ({
  remark: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest.fn().mockResolvedValue({ toString: () => "<p>Processed content</p>" }),
  })),
}));
jest.mock("remark-gfm", () => jest.fn());
jest.mock("remark-html", () => jest.fn());

import {
  getAllBlogPostPreviews,
  getArchiveBlogPostPreviews,
  getArchiveBlogPostPreviewsByBucket,
  getCuratedBlogPostPreviewsByCluster,
  getRelatedBlogPosts,
} from "../blog";
import {
  BLOG_ARCHIVE_BUCKET_ORDER,
  BLOG_CLUSTER_ORDER,
} from "../blog-config";

function expectPublishedDateOrder(
  posts: Array<{ slug: string; publishedAt: string }>
) {
  const sorted = [...posts].sort((a, b) => {
    const dateDifference =
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return a.slug.localeCompare(b.slug);
  });

  expect(posts.map((post) => post.slug)).toEqual(sorted.map((post) => post.slug));
}

describe("blog taxonomy", () => {
  it("assigns every preview to exactly one lead pillar or archive bucket", () => {
    const previews = getAllBlogPostPreviews();

    for (const post of previews) {
      const hasCluster = Boolean(post.cluster);
      const hasArchiveBucket = Boolean(post.archiveBucket);

      expect(hasCluster || hasArchiveBucket).toBe(true);
      expect(hasCluster && hasArchiveBucket).toBe(false);
    }
  });

  it("keeps the lead pillars and archive buckets in deterministic descending order", () => {
    const clusteredPreviews = getCuratedBlogPostPreviewsByCluster();
    const archivePreviewsByBucket = getArchiveBlogPostPreviewsByBucket();

    for (const cluster of BLOG_CLUSTER_ORDER) {
      expectPublishedDateOrder(clusteredPreviews[cluster]);
    }

    for (const bucket of BLOG_ARCHIVE_BUCKET_ORDER) {
      expectPublishedDateOrder(archivePreviewsByBucket[bucket]);
    }
  });

  it("keeps representative posts in the intended lead pillars", () => {
    const clusteredPreviews = getCuratedBlogPostPreviewsByCluster();

    expect(clusteredPreviews["PM Workflows"].map((post) => post.slug)).toContain(
      "ai-workflow-mba-product-manager-daily"
    );
    expect(clusteredPreviews["Agentic AI"].map((post) => post.slug)).toContain(
      "mcp-integration-layer-what-it-means"
    );
    expect(
      clusteredPreviews["Fintech Product & Pricing"].map((post) => post.slug)
    ).toContain("building-an-investment-research-platform");
    expect(clusteredPreviews["Systems & Quality"].map((post) => post.slug)).toContain(
      "cybersecurity-in-age-of-ai-software-engineer-perspective"
    );
  });

  it("groups archive posts into the expected secondary buckets", () => {
    const archivePreviews = getArchiveBlogPostPreviews();
    const archivePreviewsByBucket = getArchiveBlogPostPreviewsByBucket();

    expect(archivePreviewsByBucket["Sports & Fantasy"].map((post) => post.slug)).toContain(
      "rb-vs-wr-draft-strategy-modeling-positional-value"
    );
    expect(
      archivePreviewsByBucket["Signals & Commentary"].map((post) => post.slug)
    ).toContain("2026-week-in-tech-ai-infra-geopolitics");
    expect(
      archivePreviewsByBucket["Space & Experiments"].map((post) => post.slug)
    ).toContain("building-news-pulse-dashboard");

    const groupedArchiveSlugs = BLOG_ARCHIVE_BUCKET_ORDER.flatMap((bucket) =>
      archivePreviewsByBucket[bucket].map((post) => post.slug)
    ).sort();

    expect(groupedArchiveSlugs).toEqual(
      archivePreviews.map((post) => post.slug).sort()
    );
  });

  it("uses archive bucket matches when finding related posts for archive essays", async () => {
    const relatedPosts = await getRelatedBlogPosts(
      "spacex-ipo-case-for-going-public",
      3
    );

    expect(relatedPosts).toHaveLength(3);
    expect(
      relatedPosts.some(
        (post) => post.archiveBucket === "Signals & Commentary"
      )
    ).toBe(true);
  });
});
