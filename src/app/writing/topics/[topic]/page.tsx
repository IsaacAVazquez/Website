import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIStructuredData } from "@/components/AIStructuredData";
import { StructuredData } from "@/components/StructuredData";
import {
  BLOG_TOPIC_PAGES,
  getBlogTopicPage,
} from "@/lib/blog-config";
import { getBlogPostPreviewsByTopicSlug, type BlogPostPreview } from "@/lib/blog";
import {
  constructMetadata,
  generateBreadcrumbStructuredData,
  siteConfig,
} from "@/lib/seo";
import { publishedDateFormatter } from "@/lib/utils";

// The first 30 rows render open and the rest sit behind a native disclosure,
// the same page size the /writing archive uses. Sports & Fantasy ran 91 rows
// and about 52 phone screens with nothing to shorten it.
const TOPIC_PAGE_SIZE = 30;

/*
 * One archive row, the same ledger shape the /writing index draws: title and
 * excerpt on the left, the date and reading time on the right, a hairline
 * between rows.
 */
function renderTopicRow(post: BlogPostPreview) {
  return (
    <article
      key={post.slug}
      className="c97-row c97-row-stack-sm"
      style={{
        borderTop: "1px solid var(--c97-rule)",
        paddingBlock: "var(--c97-sp-3)",
      }}
    >
      <div>
        <h2 className="c97-serif c97-h3">
          <Link href={`/writing/${post.slug}`} style={{ textDecoration: "none" }}>
            {post.title}
          </Link>
        </h2>
        <p
          className="c97-prose"
          style={{ marginTop: "var(--c97-sp-1)", color: "var(--c97-ink-2)" }}
        >
          {post.excerpt}
        </p>
      </div>
      <p className="c97-meta">
        <time dateTime={post.publishedAt}>
          {publishedDateFormatter.format(new Date(post.publishedAt))}
        </time>
        <span className="c97-tabular">{post.readingTime}</span>
      </p>
    </article>
  );
}

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return BLOG_TOPIC_PAGES.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { topic: topicSlug } = await params;
  const topic = getBlogTopicPage(topicSlug);

  if (!topic) {
    return { title: "Writing topic not found", robots: { index: false, follow: true } };
  }

  return constructMetadata({
    title: topic.seoTitle,
    description: topic.metaDescription,
    canonicalUrl: `/writing/topics/${topic.slug}`,
  });
}

export default async function WritingTopicPage({ params }: TopicPageProps) {
  const { topic: topicSlug } = await params;
  const topic = getBlogTopicPage(topicSlug);

  if (!topic) {
    notFound();
  }

  const posts = getBlogPostPreviewsByTopicSlug(topic.slug);
  const remaining = posts.length - TOPIC_PAGE_SIZE;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
    { name: topic.label, url: `/writing/topics/${topic.slug}` },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (
            generateBreadcrumbStructuredData(breadcrumbs) as {
              itemListElement: object[];
            }
          ).itemListElement,
        }}
      />
      <AIStructuredData
        schema={{
          type: "ItemList",
          data: {
            name: `${topic.label} writing`,
            description: topic.description,
            url: `${siteConfig.url}/writing/topics/${topic.slug}`,
            items: posts.map((post) => ({
              name: post.title,
              description: post.excerpt,
              url: `${siteConfig.url}/writing/${post.slug}`,
              image: post.coverImage.startsWith("http")
                ? post.coverImage
                : `${siteConfig.url}${post.coverImage}`,
            })),
          },
        }}
      />

      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div className="c97-shell">
          <nav aria-label="Breadcrumb">
            <ol className="c97-breadcrumb">
              <li>
                <Link href="/writing" className="c97-microlink">
                  Writing
                </Link>
              </li>
              <li aria-current="page">{topic.label}</li>
            </ol>
          </nav>
          <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-4)" }}>
            Writing topic
          </p>
          <h1 className="c97-display" style={{ marginTop: "var(--c97-sp-2)" }}>
            {topic.label}
          </h1>
          <p
            className="c97-lead"
            style={{
              marginTop: "var(--c97-sp-3)",
              maxWidth: "var(--c97-measure-wide)",
              color: "var(--c97-ink-2)",
            }}
          >
            {topic.description}
          </p>
          <p className="c97-meta" style={{ marginTop: "var(--c97-sp-3)" }}>
            <span className="c97-tabular">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </span>
          </p>
        </div>
      </section>

      {/* The archive ledger */}
      <section className="c97-band c97-band-continues" data-c97-surface="paper">
        <div className="c97-shell">
          <div>{posts.slice(0, TOPIC_PAGE_SIZE).map(renderTopicRow)}</div>
          {remaining > 0 ? (
            <details className="c97-disclosure" style={{ marginTop: "var(--c97-sp-3)" }}>
              {/*
                The native marker is hidden so the label can say what the control
                will do next; the summary's own text flips on open through the
                two spans below.
              */}
              <summary
                className="c97-microlink"
                style={{ color: "var(--c97-ink)" }}
              >
                <span data-when="closed">
                  Show the other {remaining} articles
                </span>
                <span data-when="open">
                  Hide the other {remaining} articles
                </span>
              </summary>
              <div style={{ marginTop: "var(--c97-sp-3)" }}>
                {posts.slice(TOPIC_PAGE_SIZE).map(renderTopicRow)}
              </div>
            </details>
          ) : null}
        </div>
      </section>

      {/* The other topics, on bone. */}
      <section
        aria-labelledby="other-writing-topics"
        className="c97-band"
        data-c97-surface="bone"
      >
        <div className="c97-shell">
          <p className="c97-kicker">Keep browsing</p>
          <h2
            id="other-writing-topics"
            className="c97-serif c97-h2"
            style={{ marginTop: "var(--c97-sp-2)" }}
          >
            Other writing topics
          </h2>
          <ul
            className="c97-segmented"
            style={{ listStyle: "none", marginTop: "var(--c97-sp-4)" }}
          >
            {BLOG_TOPIC_PAGES.filter(
              (candidate) => candidate.slug !== topic.slug
            ).map((candidate) => (
              <li key={candidate.slug}>
                <Link
                  href={`/writing/topics/${candidate.slug}`}
                  className="c97-microlink"
                  style={{ color: "var(--c97-ink)" }}
                >
                  {candidate.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
