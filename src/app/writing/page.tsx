import {
  getAllBlogPostPreviews,
  getArchiveBlogPostPreviewsByBucket,
  getCuratedBlogPostPreviewsByCluster,
  newestBlogPostDate,
} from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import {
  BLOG_ARCHIVE_BUCKET_ORDER,
  BLOG_CLUSTER_ORDER,
} from "@/lib/blog-config";
import {
  absoluteUrl,
  generateBreadcrumbStructuredData,
  constructMetadata,
  laterDate,
} from "@/lib/seo";
import { Catalog97Writing } from "@/components/catalog97/Catalog97Writing";

export function generateMetadata() {
  return constructMetadata({
    title: "Isaac Vazquez Writing | Product, AI and Fintech",
    description:
      "My essays and notes on product management, AI workflows, fintech, quality systems, and the tools I'm building.",
    canonicalUrl: "/writing",
    // The index changes whenever a post is published or edited, which is how
    // sitemap.js dates it. 2026-09-28 is the page's own last copy change.
    dateModified: laterDate(
      newestBlogPostDate(getAllBlogPostPreviews()),
      "2026-09-28"
    ),
  });
}

export default function WritingPage() {
  const posts = getAllBlogPostPreviews();
  const curatedSections = getCuratedBlogPostPreviewsByCluster();
  const archiveSections = getArchiveBlogPostPreviewsByBucket();

  const clusters = BLOG_CLUSTER_ORDER.map((c) => ({
    id: c,
    label: c,
    count: curatedSections[c].length,
  }));
  const buckets = BLOG_ARCHIVE_BUCKET_ORDER.map((b) => ({
    id: b,
    label: b,
    count: archiveSections[b].length,
  }));

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as {
            itemListElement: object[];
          }).itemListElement,
        }}
      />

      <AIStructuredData
        schema={{
          type: "ItemList",
          data: {
            name: "Isaac Vazquez Writing",
            description:
              "Writing on product management, agentic AI, fintech, systems, quality, and the tools Isaac Vazquez builds.",
            url: absoluteUrl("/writing"),
            items: posts.map((post) => ({
              name: post.title,
              description: post.excerpt,
              url: absoluteUrl(`/writing/${post.slug}`),
              image: absoluteUrl(post.coverImage),
            })),
          },
        }}
      />

      <Catalog97Writing
        // Only the fields the index reads cross into the client payload.
        posts={posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          publishedAt: post.publishedAt,
          category: post.category,
          tags: post.tags,
          readingTime: post.readingTime,
          coverImage: post.coverImage,
          coverImageAlt: post.coverImageAlt,
          cluster: post.cluster,
          archiveBucket: post.archiveBucket,
        }))}
        clusters={clusters}
        buckets={buckets}
      />
    </>
  );
}
