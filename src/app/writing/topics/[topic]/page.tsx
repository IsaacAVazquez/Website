import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AIStructuredData } from "@/components/AIStructuredData";
import { StructuredData } from "@/components/StructuredData";
import { ArrowRight } from "@/components/ui/ServerIcons";
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

// The first 30 cards render open and the rest sit behind a native disclosure,
// the same page size the /writing archive uses. Sports & Fantasy ran 91 cards
// and about 52 phone screens with nothing to shorten it.
const TOPIC_PAGE_SIZE = 30;

function renderTopicCard(post: BlogPostPreview) {
  return (
    <article key={post.slug} className="home-card flex h-full flex-col p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--home-ink-muted)]">
        <time dateTime={post.publishedAt}>
          {publishedDateFormatter.format(new Date(post.publishedAt))}
        </time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime}</span>
      </div>
      <h2 className="mb-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[var(--home-ink)]">
        <Link href={`/writing/${post.slug}`} className="hover:underline">
          {post.title}
        </Link>
      </h2>
      <p className="home-body mb-6">{post.excerpt}</p>
      <Link
        href={`/writing/${post.slug}`}
        className="home-inline-link mt-auto inline-flex min-h-[44px] items-center gap-2 py-2 font-semibold"
      >
        Read article
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
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

      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--home-ink-muted)]">
              <li>
                <Link href="/writing" className="home-inline-link">
                  Writing
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--home-ink)]">{topic.label}</li>
            </ol>
          </nav>

          <header className="max-w-5xl border-b border-[var(--home-rule)] pb-10">
            <p className="home-kicker mb-3">Writing topic</p>
            <h1
              className="mb-5 text-[clamp(2.2rem,5vw,4.2rem)] font-semibold leading-[1.0] tracking-[-0.04em] text-[var(--home-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {topic.label}
            </h1>
            <p className="home-body max-w-3xl text-lg">{topic.description}</p>
            <p className="mt-5 text-sm font-semibold text-[var(--home-ink-muted)]">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </p>
          </header>

          <div className="grid gap-5 py-10 md:grid-cols-2">
            {posts.slice(0, TOPIC_PAGE_SIZE).map(renderTopicCard)}
          </div>
          {posts.length > TOPIC_PAGE_SIZE ? (
            <details className="group pb-10">
              {/* home-inline-link sets inline-flex, which hides the native disclosure
                  triangle, so an arrow that turns on open does that job, and the label
                  says what the control will do next. */}
              <summary className="home-inline-link min-h-[44px] cursor-pointer gap-2 py-2 font-semibold">
                <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
                <span className="group-open:hidden">Show the other {posts.length - TOPIC_PAGE_SIZE} articles</span>
                <span className="hidden group-open:inline">Hide the other {posts.length - TOPIC_PAGE_SIZE} articles</span>
              </summary>
              <div className="grid gap-5 pt-5 md:grid-cols-2">
                {posts.slice(TOPIC_PAGE_SIZE).map(renderTopicCard)}
              </div>
            </details>
          ) : null}

          <section
            aria-labelledby="other-writing-topics"
            className="border-t border-[var(--home-rule)] py-10"
          >
            <p className="home-kicker mb-3">Keep browsing</p>
            <h2
              id="other-writing-topics"
              className="mb-5 text-3xl font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
            >
              Other writing topics
            </h2>
            <div className="flex flex-wrap gap-3">
              {BLOG_TOPIC_PAGES.filter(
                (candidate) => candidate.slug !== topic.slug
              ).map((candidate) => (
                <Link
                  key={candidate.slug}
                  href={`/writing/topics/${candidate.slug}`}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--home-rule)] px-4 py-2 text-sm font-semibold text-[var(--home-ink)] transition-colors hover:border-[var(--home-signal)] hover:text-[var(--home-signal)]"
                >
                  {candidate.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
