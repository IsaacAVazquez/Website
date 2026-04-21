import Image from "next/image";
import Link from "next/link";
import {
  getAllBlogPostPreviews,
  getArchiveBlogPostPreviewsByBucket,
  getCuratedBlogPostPreviewsByCluster,
} from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import {
  BLOG_ARCHIVE_BUCKET_DETAILS,
  BLOG_ARCHIVE_BUCKET_ORDER,
  BLOG_CLUSTER_DETAILS,
  BLOG_CLUSTER_ORDER,
  type BlogArchiveBucket,
  type BlogCluster,
} from "@/lib/blog-config";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { Clock, ArrowRight } from "@/components/ui/ServerIcons";
import { publishedDateFormatter } from "@/lib/utils";

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

type WritingCardPost = ReturnType<typeof getAllBlogPostPreviews>[number];

function toSectionId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function WritingCardFooter({ post }: { post: WritingCardPost }) {
  const footerTags = post.tags.slice(0, 2);

  return (
    <div
      className="mt-auto flex items-center justify-between gap-4 pt-4"
      style={{ borderTop: "1px solid var(--home-rule)" }}
    >
      <div className="min-w-0 flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <div
          className="flex items-center gap-1"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "0.8rem",
            color: "var(--home-ink-muted)",
          }}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{post.readingTime}</span>
        </div>

        {footerTags.length > 0 ? (
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
            {footerTags.map((tag) => (
              <span key={tag} className="resume-chip shrink-0">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ArrowRight
        className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
        style={{ color: "var(--home-haze)" }}
      />
    </div>
  );
}

function CuratedWritingCard({ post }: { post: WritingCardPost }) {
  return (
    <Link key={post.slug} href={`/writing/${post.slug}`} className="group block h-full">
      <article className="home-card flex h-full flex-col" style={{ padding: "1.5rem" }}>
        <div className="relative aspect-[1200/630] overflow-hidden rounded-[1.2rem] border border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="home-kicker">{post.category}</span>
            <time dateTime={post.publishedAt} className="home-meta mb-0">
              {publishedDateFormatter.format(new Date(post.publishedAt))}
            </time>
          </div>

          <h2
            className="transition-colors group-hover:opacity-70"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "1.35rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.12,
              color: "var(--home-ink)",
            }}
          >
            {post.title}
          </h2>

          <p className="home-body mb-0 flex-1 line-clamp-4 text-sm leading-6">{post.excerpt}</p>

          <WritingCardFooter post={post} />
        </div>
      </article>
    </Link>
  );
}

function ArchiveWritingCard({ post }: { post: WritingCardPost }) {
  return (
    <Link key={post.slug} href={`/writing/${post.slug}`} className="group block h-full">
      <article
        className="flex h-full flex-col rounded-[1.5rem] border"
        style={{
          padding: "1.25rem",
          borderColor: "color-mix(in srgb, var(--home-rule) 78%, var(--home-elev-mix))",
          background:
            "color-mix(in srgb, var(--home-paper) 82%, var(--home-paper-alt) 18%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="home-kicker">{post.category}</span>
          <time dateTime={post.publishedAt} className="home-meta mb-0">
            {publishedDateFormatter.format(new Date(post.publishedAt))}
          </time>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          <h2
            className="transition-colors group-hover:opacity-70"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.18,
              color: "var(--home-ink)",
            }}
          >
            {post.title}
          </h2>

          <p
            className="mb-0 flex-1 line-clamp-4 text-sm leading-6"
            style={{ color: "var(--home-ink-muted)" }}
          >
            {post.excerpt}
          </p>

          <WritingCardFooter post={post} />
        </div>
      </article>
    </Link>
  );
}

function WritingClusterSection({
  cluster,
  posts,
}: {
  cluster: BlogCluster;
  posts: ReturnType<typeof getAllBlogPostPreviews>;
}) {
  if (posts.length === 0) {
    return null;
  }

  const details = BLOG_CLUSTER_DETAILS[cluster];

  return (
    <section
      id={toSectionId(cluster)}
      data-testid={`writing-cluster-${toSectionId(cluster)}`}
      className="space-y-6 scroll-mt-28"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="home-kicker mb-0">Lead pillar</p>
          <span className="resume-chip">{posts.length} articles</span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.05em",
            color: "var(--home-ink)",
          }}
        >
          {cluster}
        </h2>
        <p className="home-body max-w-[52rem]">{details.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <CuratedWritingCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

function ArchiveBucketSection({
  bucket,
  posts,
}: {
  bucket: BlogArchiveBucket;
  posts: ReturnType<typeof getAllBlogPostPreviews>;
}) {
  if (posts.length === 0) {
    return null;
  }

  const details = BLOG_ARCHIVE_BUCKET_DETAILS[bucket];

  return (
    <section
      id={toSectionId(bucket)}
      data-testid={`writing-archive-${toSectionId(bucket)}`}
      className="rounded-[2rem] border p-6 md:p-7"
      style={{
        borderColor: "color-mix(in srgb, var(--home-rule) 74%, var(--home-elev-mix))",
        background:
          "color-mix(in srgb, var(--home-paper) 76%, var(--home-paper-alt) 24%)",
      }}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="home-kicker mb-0">Archive bucket</p>
          <span className="resume-chip">{posts.length} articles</span>
        </div>
        <h3
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "1.4rem",
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            color: "var(--home-ink)",
          }}
        >
          {bucket}
        </h3>
        <p className="home-body text-sm">{details.description}</p>
      </div>

      <div className="mt-6 grid gap-4">
        {posts.map((post) => (
          <ArchiveWritingCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

export default function WritingPage() {
  const posts = getAllBlogPostPreviews();
  const curatedSections = getCuratedBlogPostPreviewsByCluster();
  const archiveSections = getArchiveBlogPostPreviewsByBucket();
  const leadCount = BLOG_CLUSTER_ORDER.reduce(
    (count, cluster) => count + curatedSections[cluster].length,
    0
  );
  const archiveCount = BLOG_ARCHIVE_BUCKET_ORDER.reduce(
    (count, bucket) => count + archiveSections[bucket].length,
    0
  );

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
  ];

  const articlesStructuredData = posts.slice(0, 12).map((post) => ({
    headline: post.title,
    description: post.excerpt,
    author: {
      name: post.author || "Isaac Vazquez",
      url: "https://isaacavazquez.com",
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    keywords: post.tags,
    articleSection: post.cluster || post.category,
    wordCount: post.wordCount,
    url: `https://isaacavazquez.com/writing/${post.slug}`,
    image: `https://isaacavazquez.com${post.coverImage}`,
  }));

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

      {articlesStructuredData.map((article, index) => (
        <StructuredData key={index} type="Article" data={article} />
      ))}

      <section className="home-page min-h-screen">
        <div className="home-shell home-section space-y-14">
          <header className="space-y-6 pt-4">
            <div className="space-y-4 text-center">
              <p className="home-kicker">Writing</p>
              <h1
                className="mx-auto w-full max-w-5xl"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "clamp(2.6rem, 6vw, 5rem)",
                  fontWeight: 600,
                  lineHeight: 0.94,
                  letterSpacing: "-0.07em",
                  color: "var(--home-ink)",
                }}
              >
                I keep the writing organized around the work I want to do more of.
              </h1>
              <p className="home-body mx-auto max-w-[54rem] text-center">
                The first layer is PM workflows, agentic AI, fintech product
                thinking, and systems work. The broader archive is still here,
                but it lives in smaller buckets instead of one undifferentiated
                feed.
              </p>
            </div>

            <div
              className="grid gap-4 rounded-[2rem] border p-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] md:p-7"
              style={{
                borderColor: "var(--home-rule)",
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--home-paper-alt) 84%, var(--home-elev-mix)) 0%, color-mix(in srgb, var(--home-paper) 88%, var(--home-paper-alt) 12%) 100%)",
              }}
            >
              <div className="space-y-3">
                <p className="home-kicker mb-0">Start with the pillar that matches the question</p>
                <p
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "clamp(1.3rem, 3vw, 1.85rem)",
                    fontWeight: 600,
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    color: "var(--home-ink)",
                  }}
                >
                  The top of the archive is meant to be a faster scan. You
                  should know where to start before you read a single card.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Lead pillars", value: BLOG_CLUSTER_ORDER.length },
                  { label: "Lead pieces", value: leadCount },
                  { label: "Archive pieces", value: archiveCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.35rem] border px-4 py-4 text-center"
                    style={{
                      borderColor: "color-mix(in srgb, var(--home-rule) 82%, var(--home-elev-mix))",
                      background:
                        "color-mix(in srgb, var(--home-paper) 72%, var(--home-paper-alt) 28%)",
                    }}
                  >
                    <p className="home-meta mb-1">{stat.label}</p>
                    <p
                      className="mb-0"
                      style={{
                        fontFamily: "var(--font-home-sans)",
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        letterSpacing: "-0.05em",
                        lineHeight: 1,
                        color: "var(--home-ink)",
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <nav
            aria-label="Writing pillars"
            className="rounded-[1.8rem] border p-3"
            style={{
              borderColor: "var(--home-rule)",
              background:
                "color-mix(in srgb, var(--home-paper) 82%, var(--home-paper-alt) 18%)",
            }}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {BLOG_CLUSTER_ORDER.map((cluster) => {
                const sectionId = toSectionId(cluster);

                return (
                  <Link
                    key={cluster}
                    href={`#${sectionId}`}
                    className="group flex min-h-[56px] items-center justify-between gap-3 rounded-[1.2rem] border px-4 py-3 transition-[border-color,background-color,color]"
                    style={{
                      borderColor: "color-mix(in srgb, var(--home-rule) 84%, var(--home-elev-mix))",
                      background:
                        "color-mix(in srgb, var(--home-paper-alt) 76%, var(--home-elev-mix))",
                    }}
                  >
                    <div className="space-y-1">
                      <p className="home-kicker mb-0">{cluster}</p>
                      <p
                        className="mb-0 text-sm"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        {curatedSections[cluster].length} articles
                      </p>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ color: "var(--home-haze)" }}
                    />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="space-y-14">
            {BLOG_CLUSTER_ORDER.map((cluster) => (
              <WritingClusterSection
                key={cluster}
                cluster={cluster}
                posts={curatedSections[cluster]}
              />
            ))}
          </div>

          {archiveCount > 0 ? (
            <section className="space-y-6" data-testid="writing-archive-root">
              <div className="space-y-3">
                <p className="home-kicker">Archive</p>
                <h2
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
                    fontWeight: 600,
                    lineHeight: 0.98,
                    letterSpacing: "-0.05em",
                    color: "var(--home-ink)",
                  }}
                >
                  Broader archive
                </h2>
                <p className="home-body max-w-[52rem]">
                  Sports and fantasy work, weekly signals, and the side-path
                  experiments are still fully available. They are just grouped
                  by what they are instead of competing with the lead library.
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {BLOG_ARCHIVE_BUCKET_ORDER.map((bucket) => (
                  <ArchiveBucketSection
                    key={bucket}
                    bucket={bucket}
                    posts={archiveSections[bucket]}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
