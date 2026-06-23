import {
  getAllBlogPostPreviews,
  getArchiveBlogPostPreviewsByBucket,
  getCuratedBlogPostPreviewsByCluster,
} from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import {
  BLOG_ARCHIVE_BUCKET_DETAILS,
  BLOG_ARCHIVE_BUCKET_ORDER,
  BLOG_CLUSTER_DETAILS,
  BLOG_CLUSTER_ORDER,
} from "@/lib/blog-config";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { WritingArchiveV3 } from "@/components/writing/WritingArchiveV3";

export const metadata = constructMetadata({
  title: "Writing",
  description:
    "Writing on PM workflows, agentic AI, fintech product thinking, systems design, and the product decisions behind the tools I build.",
  canonicalUrl: "/writing",
  dateModified: "2026-04-15",
  aiMetadata: {
    expertise: [
      "Product Management",
      "AI Workflows",
      "Agentic AI",
      "Fintech Product Thinking",
      "Quality Engineering",
      "Systems Design",
    ],
    contentType: "Editorial Archive",
    profession: "Product Manager",
    industry: ["Technology", "SaaS", "Fintech"],
    topics: [
      "Product Management",
      "AI Workflow Design",
      "Agentic AI",
      "Fintech Product",
      "Reliability",
    ],
    context:
      "A curated writing archive focused on PM, AI workflow, agentic product thinking, and decision-support tools, with broader archive posts kept discoverable but secondary.",
    primaryFocus:
      "Qualified-lead writing for PM, AI workflow, and fintech/product-tool discovery",
  },
});

function readingMinutes(rt: string): number {
  const m = rt.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function WritingPage() {
  const posts = getAllBlogPostPreviews();
  const curatedSections = getCuratedBlogPostPreviewsByCluster();
  const archiveSections = getArchiveBlogPostPreviewsByBucket();

  const clusters = BLOG_CLUSTER_ORDER.map((c) => ({
    id: c,
    label: c,
    description: BLOG_CLUSTER_DETAILS[c].description,
    count: curatedSections[c].length,
  }));
  const buckets = BLOG_ARCHIVE_BUCKET_ORDER.map((b) => ({
    id: b,
    label: b,
    description: BLOG_ARCHIVE_BUCKET_DETAILS[b].description,
    count: archiveSections[b].length,
  }));

  const totalNotes = posts.filter((p) => readingMinutes(p.readingTime) <= 5).length;
  const totalEssays = posts.length - totalNotes;

  const earliestDate = posts.length
    ? [...posts].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      )[0]?.publishedAt
    : undefined;

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
            url: "https://isaacavazquez.com/writing",
            items: posts.map((post) => ({
              name: post.title,
              description: post.excerpt,
              url: `https://isaacavazquez.com/writing/${post.slug}`,
              image: post.coverImage.startsWith("http")
                ? post.coverImage
                : `https://isaacavazquez.com${post.coverImage}`,
            })),
          },
        }}
      />

      <WritingArchiveV3
        posts={posts}
        clusters={clusters}
        buckets={buckets}
        totalEssays={totalEssays}
        totalNotes={totalNotes}
        earliestDate={earliestDate}
      />
    </>
  );
}
