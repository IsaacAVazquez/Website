import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { AuthorBio } from "@/components/ui/AuthorBio";
import { constructMetadata, absoluteUrl, siteConfig } from "@/lib/seo";
import { AIStructuredData } from "@/components/AIStructuredData";
import { getBlogPostCollectionLabel } from "@/lib/blog-config";
import {
  getAllBlogPostPreviews,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/blog";
import { ArrowRight } from "@/components/ui/ServerIcons";
import { publishedDateFormatter } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPostPreviews();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  const metadataTitle = post.seo?.title || post.title;
  const metadataDescription = post.seo?.description || post.excerpt || post.title;

  return constructMetadata({
    title: metadataTitle,
    description: metadataDescription,
    image: post.coverImage,
    ogType: "article",
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    articleAuthor: `${siteConfig.url}/about`,
    articleSection: getBlogPostCollectionLabel(post),
    articleTags: post.seo?.keywords || post.tags,
    canonicalUrl: `${siteConfig.url}/writing/${slug}`,
    aiMetadata: {
      expertise: post.seo?.keywords || post.tags || [],
      contentType: "Article",
      profession: "Product Manager",
      summary: metadataDescription,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(slug, 3);
  // Prev/next sequential nav based on the publish-date-ordered list returned
  // by getAllBlogPostPreviews (newest first). "previous" = older post,
  // "next" = newer post in the same chronology.
  const allPosts = getAllBlogPostPreviews();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Writing", url: "/writing" },
    { name: post.title, url: `/writing/${slug}` },
  ];

  const articleDescription = post.seo?.description || post.excerpt || post.title;
  const articleKeywords = post.seo?.keywords || post.tags;

  return (
    <>
      <AIStructuredData
        schema={{
          type: "Breadcrumb",
          data: { items: breadcrumbs },
        }}
      />
      <AIStructuredData
        schema={{
          type: "Article",
          data: {
            headline: post.title,
            description: articleDescription,
            author: {
              name: "Isaac Vazquez",
              jobTitle: "Product Manager & UC Berkeley Haas MBA Candidate",
              url: siteConfig.url,
            },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            url: `${siteConfig.url}/writing/${slug}`,
            keywords: Array.isArray(articleKeywords)
              ? articleKeywords
              : articleKeywords
                ? [articleKeywords]
                : undefined,
            wordCount: post.wordCount,
            image: absoluteUrl(post.coverImage),
            inLanguage: "en-US",
            isAccessibleForFree: true,
            articleSection: getBlogPostCollectionLabel(post),
          },
        }}
      />

      <section className="home-page min-h-screen">
        <div className="home-shell home-section">
          <article className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol
                className="flex items-center gap-2 text-sm"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  color: "var(--home-ink-muted)",
                }}
              >
                <li>
                  <Link
                    href="/writing"
                    className="transition-colors hover:text-[var(--home-ink)]"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Writing
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="max-w-[40ch] truncate" style={{ color: "var(--home-ink)" }}>
                  {post.title}
                </li>
              </ol>
            </nav>

            <header className="mb-10 space-y-5">
              <span className="home-kicker inline-block">
                {getBlogPostCollectionLabel(post)}
              </span>

              <h1
                className="max-w-5xl"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                  color: "var(--home-ink)",
                }}
              >
                {post.title}
              </h1>

              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1"
                style={{
                  fontFamily: "var(--font-home-sans)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--home-ink-muted)",
                }}
              >
                <time dateTime={post.publishedAt}>
                  {publishedDateFormatter.format(new Date(post.publishedAt))}
                </time>
                <span aria-hidden="true">·</span>
                <span>{post.readingTime}</span>
              </div>

              <p className="home-body max-w-[54rem]">{post.excerpt}</p>

              {post.tags && post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="resume-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="relative aspect-[1200/630] overflow-hidden rounded-[1.6rem] border border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(min-width: 1280px) 72rem, 100vw"
                  className="object-cover"
                />
              </div>
            </header>

            <div
              className="prose prose-writing dark:prose-invert mb-16 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.cta ? (
              <section
                className="home-card mb-10 space-y-4"
                style={{
                  background: "color-mix(in srgb, var(--home-paper-alt) 86%, var(--home-elev-mix))",
                  padding: "1.8rem",
                }}
              >
                <p className="home-kicker mb-0">{post.cta.eyebrow || "Related work"}</p>
                <h2
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "1.7rem",
                    fontWeight: 600,
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    color: "var(--home-ink)",
                  }}
                >
                  {post.cta.title}
                </h2>
                <p className="home-body mb-0 max-w-[42rem]">{post.cta.description}</p>
                <Link href={post.cta.href} className="home-inline-link inline-flex items-center gap-2">
                  {post.cta.actionLabel || "Open it"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            ) : null}

            {relatedPosts.length > 0 ? (
              <section className="mb-12 space-y-5">
                <div className="space-y-2">
                  <p className="home-kicker mb-0">Related writing</p>
                  <h2
                    style={{
                      fontFamily: "var(--font-home-sans)",
                      fontSize: "clamp(1.7rem, 4vw, 2.2rem)",
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                      color: "var(--home-ink)",
                    }}
                  >
                    If this piece was useful, these should stack on top of it.
                  </h2>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/writing/${relatedPost.slug}`}
                      className="group block h-full"
                    >
                      <article className="home-card h-full" style={{ padding: "1.35rem" }}>
                        <p className="home-kicker mb-2">
                          {getBlogPostCollectionLabel(relatedPost)}
                        </p>
                        <h3
                          style={{
                            fontFamily: "var(--font-home-sans)",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.18,
                            color: "var(--home-ink)",
                          }}
                        >
                          {relatedPost.title}
                        </h3>
                        <p
                          className="mb-0 mt-3 text-sm leading-6"
                          style={{ color: "var(--home-ink-muted)" }}
                        >
                          {relatedPost.excerpt}
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t border-[var(--home-rule)] pt-4 text-sm">
                          <span style={{ color: "var(--home-ink-muted)" }}>
                            {relatedPost.readingTime}
                          </span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div
              className="mb-10"
              style={{ borderTop: "1px solid var(--home-rule)", paddingTop: "2.5rem" }}
            >
              <AuthorBio variant="full" />
            </div>

            {(olderPost || newerPost) && (
              <nav
                className="mb-10 grid gap-4 border-t border-[var(--home-rule)] pt-8 md:grid-cols-2"
                aria-label="Article pagination"
              >
                {olderPost ? (
                  <Link
                    href={`/writing/${olderPost.slug}`}
                    className="home-card group block h-full p-5 transition-colors hover:border-[var(--home-haze)]"
                    rel="prev"
                  >
                    <p className="home-kicker mb-2">Previous</p>
                    <p className="mb-0 text-base font-semibold leading-snug text-[var(--home-ink)]">
                      {olderPost.title}
                    </p>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
                {newerPost ? (
                  <Link
                    href={`/writing/${newerPost.slug}`}
                    className="home-card group block h-full p-5 text-right transition-colors hover:border-[var(--home-haze)]"
                    rel="next"
                  >
                    <p className="home-kicker mb-2">Next</p>
                    <p className="mb-0 text-base font-semibold leading-snug text-[var(--home-ink)]">
                      {newerPost.title}
                    </p>
                  </Link>
                ) : (
                  <span aria-hidden="true" />
                )}
              </nav>
            )}

            <div className="pb-8">
              <Link href="/writing" className="home-inline-link">
                &larr; Back to writing
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
