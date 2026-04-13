import Image from "next/image";
import Link from "next/link";
import {
  getAllBlogPostPreviews,
  getArchiveBlogPostPreviews,
  getCuratedBlogPostPreviewsByCluster,
} from "@/lib/blog";
import { StructuredData } from "@/components/StructuredData";
import {
  BLOG_CLUSTER_DETAILS,
  BLOG_CLUSTER_ORDER,
  type BlogCluster,
} from "@/lib/blog-config";
import { generateBreadcrumbStructuredData, constructMetadata } from "@/lib/seo";
import { Clock, ArrowRight } from "@/components/ui/ServerIcons";
import { publishedDateFormatter } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Writing",
  description:
    "Writing on PM workflows, agentic AI, fintech product thinking, reliability, and the decisions behind the tools I build.",
  canonicalUrl: "/writing",
  dateModified: "2026-04-13",
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
      <article className="home-card flex h-full flex-col" style={{ padding: "1.5rem" }}>
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
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="home-kicker">{cluster}</p>
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

export default function WritingPage() {
  const posts = getAllBlogPostPreviews();
  const curatedSections = getCuratedBlogPostPreviewsByCluster();
  const archivePosts = getArchiveBlogPostPreviews();

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
    articleSection: post.category,
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
          <header className="space-y-4 pt-4">
            <p className="home-kicker">Writing</p>
            <h1
              className="mx-auto w-full max-w-5xl text-center"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(2.6rem, 6vw, 5rem)",
                fontWeight: 600,
                lineHeight: 0.94,
                letterSpacing: "-0.07em",
                color: "var(--home-ink)",
              }}
            >
              I write to show how I think, not just what I ship.
            </h1>
            <p className="home-body mx-auto max-w-[52rem] text-center">
              The top is focused on PM, AI workflow, fintech, and systems
              thinking. The broader archive is still here, organized behind
              those lead topics.
            </p>
          </header>

          <div className="space-y-14">
            {BLOG_CLUSTER_ORDER.map((cluster) => (
              <WritingClusterSection
                key={cluster}
                cluster={cluster}
                posts={curatedSections[cluster]}
              />
            ))}
          </div>

          {archivePosts.length > 0 ? (
            <section className="space-y-6">
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
                  More from the archive
                </h2>
                <p className="home-body max-w-[52rem]">
                  Sports analytics, media experiments, and earlier writing. Still
                  indexed, still useful, just organized behind the lead topics.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {archivePosts.map((post) => (
                  <ArchiveWritingCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}
